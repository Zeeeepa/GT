import { getAPIClient } from '../services/codegenApiService';
import { getAgentRunCache } from '../storage/agentRunCache';
import { AgentRunResponse, AgentRunStatus } from '../types';

// Event types for the monitoring service
export enum MonitoringEventType {
  RUN_UPDATED = 'run_updated',
  RUN_COMPLETED = 'run_completed',
  RUN_FAILED = 'run_failed',
  RUN_PAUSED = 'run_paused',
  RUN_RESUMED = 'run_resumed',
  RUN_CREATED = 'run_created',
  ERROR = 'error',
}

// Event interface for monitoring events
export interface MonitoringEvent {
  type: MonitoringEventType;
  data: any;
  timestamp: string;
}

// Configuration for the monitoring service
export interface MonitoringConfig {
  activeRunPollingInterval: number; // ms
  completedRunPollingInterval: number; // ms
  maxRetries: number;
  retryDelay: number; // ms
}

// Default configuration
const DEFAULT_CONFIG: MonitoringConfig = {
  activeRunPollingInterval: 5000, // 5 seconds
  completedRunPollingInterval: 30000, // 30 seconds
  maxRetries: 3,
  retryDelay: 2000, // 2 seconds
};

/**
 * A service to monitor agent runs in the background.
 * Provides real-time updates for active runs and periodic updates for completed runs.
 */
class BackgroundMonitoringService {
  private _isMonitoring: boolean = false;
  private intervalId: number | null = null;
  private trackedRuns: Map<number, { 
    organizationId: number, 
    lastPolled: Date,
    status: string,
    retryCount: number 
  }> = new Map();
  private eventListeners: Map<MonitoringEventType, Function[]> = new Map();
  private config: MonitoringConfig;
  private apiClient = getAPIClient();
  private cache = getAgentRunCache();

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize event listeners map
    Object.values(MonitoringEventType).forEach(type => {
      this.eventListeners.set(type as MonitoringEventType, []);
    });
  }

  /**
   * Start the background monitoring service
   */
  public start(): void {
    if (!this._isMonitoring) {
      console.log("Background monitoring service started.");
      this._isMonitoring = true;
      
      // Start polling for updates
      this.intervalId = window.setInterval(() => this.pollTrackedRuns(), 1000);
    }
  }

  /**
   * Stop the background monitoring service
   */
  public stop(): void {
    if (this._isMonitoring) {
      console.log("Background monitoring service stopped.");
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      this._isMonitoring = false;
      this.trackedRuns.clear();
    }
  }

  /**
   * Check if the monitoring service is active
   */
  public isMonitoring(): boolean {
    return this._isMonitoring;
  }

  /**
   * Track an agent run for monitoring
   * @param organizationId The organization ID
   * @param agentRunId The agent run ID
   * @param initialStatus The initial status of the run
   */
  public trackRun(organizationId: number, agentRunId: number, initialStatus: string): void {
    this.trackedRuns.set(agentRunId, { 
      organizationId, 
      lastPolled: new Date(0), // Set to epoch to ensure immediate polling
      status: initialStatus,
      retryCount: 0
    });
    
    console.log(`Now tracking agent run #${agentRunId} with status ${initialStatus}`);
    
    // Start the service if it's not already running
    if (!this._isMonitoring) {
      this.start();
    }
  }

  /**
   * Stop tracking an agent run
   * @param agentRunId The agent run ID to stop tracking
   */
  public untrackRun(agentRunId: number): void {
    if (this.trackedRuns.has(agentRunId)) {
      this.trackedRuns.delete(agentRunId);
      console.log(`Stopped tracking agent run #${agentRunId}`);
    }
  }

  /**
   * Check if an agent run is being tracked
   * @param agentRunId The agent run ID to check
   */
  public isTracking(agentRunId: number): boolean {
    return this.trackedRuns.has(agentRunId);
  }

  /**
   * Get all tracked run IDs
   */
  public getTrackedRunIds(): number[] {
    return Array.from(this.trackedRuns.keys());
  }

  /**
   * Add an event listener
   * @param eventType The event type to listen for
   * @param callback The callback function
   */
  public addEventListener(eventType: MonitoringEventType, callback: Function): void {
    const listeners = this.eventListeners.get(eventType) || [];
    listeners.push(callback);
    this.eventListeners.set(eventType, listeners);
  }

  /**
   * Remove an event listener
   * @param eventType The event type
   * @param callback The callback function to remove
   */
  public removeEventListener(eventType: MonitoringEventType, callback: Function): void {
    const listeners = this.eventListeners.get(eventType) || [];
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
      this.eventListeners.set(eventType, listeners);
    }
  }

  /**
   * Emit an event to all listeners
   * @param eventType The event type
   * @param data The event data
   */
  private emitEvent(eventType: MonitoringEventType, data: any): void {
    const event: MonitoringEvent = {
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    };
    
    const listeners = this.eventListeners.get(eventType) || [];
    listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error(`Error in event listener for ${eventType}:`, error);
      }
    });
  }

  /**
   * Poll all tracked runs for updates
   */
  private async pollTrackedRuns(): Promise<void> {
    if (!this._isMonitoring || this.trackedRuns.size === 0) return;

    const now = new Date();
    const runsToPoll: number[] = [];

    // Determine which runs need polling based on their status and last poll time
    this.trackedRuns.forEach((runInfo, agentRunId) => {
      const isActive = this.isActiveStatus(runInfo.status);
      const interval = isActive 
        ? this.config.activeRunPollingInterval 
        : this.config.completedRunPollingInterval;
      
      const timeSinceLastPoll = now.getTime() - runInfo.lastPolled.getTime();
      
      if (timeSinceLastPoll >= interval) {
        runsToPoll.push(agentRunId);
      }
    });

    // Poll each run that needs updating
    for (const agentRunId of runsToPoll) {
      await this.pollRun(agentRunId);
    }
  }

  /**
   * Poll a specific agent run for updates
   * @param agentRunId The agent run ID to poll
   */
  private async pollRun(agentRunId: number): Promise<void> {
    const runInfo = this.trackedRuns.get(agentRunId);
    if (!runInfo) return;

    // Update last polled time
    runInfo.lastPolled = new Date();
    
    try {
      // Fetch the latest run data
      const updatedRun = await this.apiClient.getAgentRun(
        runInfo.organizationId.toString(), 
        agentRunId
      );
      
      // Reset retry count on success
      runInfo.retryCount = 0;
      
      // Check if status has changed
      const statusChanged = runInfo.status !== updatedRun.status;
      const previousStatus = runInfo.status;
      runInfo.status = updatedRun.status;
      
      // Update the cache
      await this.cache.updateAgentRun(runInfo.organizationId, updatedRun);
      
      // Emit update event
      this.emitEvent(MonitoringEventType.RUN_UPDATED, updatedRun);
      
      // Emit status-specific events if status changed
      if (statusChanged) {
        if (updatedRun.status.toLowerCase() === AgentRunStatus.COMPLETE.toLowerCase()) {
          this.emitEvent(MonitoringEventType.RUN_COMPLETED, updatedRun);
        } else if (updatedRun.status.toLowerCase() === AgentRunStatus.FAILED.toLowerCase() || 
                  updatedRun.status.toLowerCase() === AgentRunStatus.ERROR.toLowerCase()) {
          this.emitEvent(MonitoringEventType.RUN_FAILED, updatedRun);
        } else if (updatedRun.status.toLowerCase() === AgentRunStatus.PAUSED.toLowerCase()) {
          this.emitEvent(MonitoringEventType.RUN_PAUSED, updatedRun);
        } else if (updatedRun.status.toLowerCase() === AgentRunStatus.ACTIVE.toLowerCase() && 
                  previousStatus.toLowerCase() === AgentRunStatus.PAUSED.toLowerCase()) {
          // Detect resumed runs (transition from PAUSED to ACTIVE)
          this.emitEvent(MonitoringEventType.RUN_RESUMED, updatedRun);
        }
      }
      
      // Check for parent-child relationships (resumed runs)
      if (updatedRun.parent_run_id) {
        // This is a resumed run, emit event with parent info
        this.emitEvent(MonitoringEventType.RUN_RESUMED, {
          ...updatedRun,
          parentRunId: updatedRun.parent_run_id
        });
      }
      
      // Stop tracking completed or failed runs after emitting events
      if (!this.isActiveStatus(updatedRun.status)) {
        // Keep tracking for one more interval to ensure UI updates
        setTimeout(() => this.untrackRun(agentRunId), this.config.completedRunPollingInterval);
      }
    } catch (error) {
      runInfo.retryCount++;
      console.error(`Error polling agent run #${agentRunId}:`, error);
      
      // Emit error event
      this.emitEvent(MonitoringEventType.ERROR, { 
        agentRunId, 
        organizationId: runInfo.organizationId,
        error 
      });
      
      // Stop tracking after max retries
      if (runInfo.retryCount >= this.config.maxRetries) {
        console.warn(`Max retries reached for agent run #${agentRunId}, stopping tracking.`);
        this.untrackRun(agentRunId);
      } else {
        // Exponential backoff for retries
        const backoffDelay = this.config.retryDelay * Math.pow(2, runInfo.retryCount - 1);
        runInfo.lastPolled = new Date(Date.now() - this.config.activeRunPollingInterval + backoffDelay);
      }
    }
  }

  /**
   * Check if a status is considered "active" (needs frequent polling)
   * @param status The status to check
   */
  private isActiveStatus(status: string): boolean {
    const activeStatuses = [
      AgentRunStatus.ACTIVE.toLowerCase(),
      AgentRunStatus.PENDING.toLowerCase(),
      AgentRunStatus.EVALUATION.toLowerCase(),
      'running', // Additional status that might be returned by the API
      'processing', // Additional status that might be returned by the API
      'initializing' // Additional status that might be returned by the API
    ];
    return activeStatuses.includes(status.toLowerCase());
  }
}

// Singleton instance
let serviceInstance: BackgroundMonitoringService | null = null;

/**
 * Get the background monitoring service instance
 * @param config Optional configuration for the service
 */
export function getBackgroundMonitoringService(config?: Partial<MonitoringConfig>): BackgroundMonitoringService {
  if (!serviceInstance) {
    serviceInstance = new BackgroundMonitoringService(config);
  }
  return serviceInstance;
}
