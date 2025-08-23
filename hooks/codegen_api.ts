import { useState, useEffect, useCallback } from 'react';
import { getCodegenService } from '../services/codegenService';
import { 
  ApiError, 
  AgentRun, 
  AgentRunLog, 
  User, 
  Repository,
  Organization,
  Integration,
  CreateAgentRunRequest,
  PaginationParams,
  SourceType,
  AgentRunStatus
} from '../types';

export function useApiCall<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const execute = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, refetch: execute };
}

export function useAsyncAction<T, P extends any[]>(
  action: (...args: P) => Promise<T>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const execute = useCallback(async (...args: P): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await action(...args);
      return result;
    } catch (err) {
      setError(err as ApiError);
      return null;
    } finally {
      setLoading(false);
    }
  }, [action]);

  return { execute, loading, error };
}

// Specialized hooks for Codegen API

export function useAgentRuns(params?: {
  user_id?: number;
  source_type?: SourceType;
  skip?: number;
  limit?: number;
}) {
  return useApiCall(
    () => getCodegenService().listAgentRuns(params),
    [params?.user_id, params?.source_type, params?.skip, params?.limit]
  );
}

export function useAgentRun(agentRunId: number | null) {
  return useApiCall(
    () => agentRunId ? getCodegenService().getAgentRun(agentRunId) : Promise.resolve(null),
    [agentRunId]
  );
}

export function useAgentRunLogs(agentRunId: number | null, params?: PaginationParams) {
  return useApiCall(
    () => agentRunId ? getCodegenService().getAgentRunLogs(agentRunId, params) : Promise.resolve(null),
    [agentRunId, params?.skip, params?.limit]
  );
}

export function useCreateAgentRun() {
  return useAsyncAction((data: CreateAgentRunRequest) => 
    getCodegenService().createAgentRun(data)
  );
}

export function useResumeAgentRun() {
  return useAsyncAction((agentRunId: number, prompt: string, images?: string[]) => 
    getCodegenService().resumeAgentRun(agentRunId, prompt, images)
  );
}

export function useStopAgentRun() {
  return useAsyncAction((agentRunId: number) => 
    getCodegenService().stopAgentRun(agentRunId)
  );
}

export function useBanChecks() {
  return useAsyncAction((agentRunId: number) => 
    getCodegenService().banChecksForAgentRun(agentRunId)
  );
}

export function useUnbanChecks() {
  return useAsyncAction((agentRunId: number) => 
    getCodegenService().unbanChecksForAgentRun(agentRunId)
  );
}

export function useRemoveCodegenFromPR() {
  return useAsyncAction((agentRunId: number) => 
    getCodegenService().removeCodegenFromPR(agentRunId)
  );
}

export function useCurrentUser() {
  return useApiCall(() => getCodegenService().getCurrentUser(), []);
}

export function useRepositories() {
  return useApiCall(() => getCodegenService().getRepositories(), []);
}

export function useOrganizations() {
  return useApiCall(() => getCodegenService().getOrganizations(), []);
}

export function useOrganizationIntegrations() {
  return useApiCall(() => getCodegenService().getOrganizationIntegrations(), []);
}

// Real-time log streaming hook
export function useAgentRunLogStream(agentRunId: number | null) {
  const [logs, setLogs] = useState<AgentRunLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const startStreaming = useCallback(async () => {
    if (!agentRunId) return;

    setLoading(true);
    setError(null);
    setLogs([]);
    setIsComplete(false);

    try {
      await getCodegenService().waitForCompletion(agentRunId, {
        pollInterval: 2000,
        onLogUpdate: (newLogs) => {
          setLogs(prevLogs => [...prevLogs, ...newLogs]);
        },
        onStatusUpdate: (status) => {
          if ([AgentRunStatus.COMPLETED, AgentRunStatus.FAILED, AgentRunStatus.CANCELLED].includes(status as AgentRunStatus)) {
            setIsComplete(true);
            setLoading(false);
          }
        }
      });
    } catch (err) {
      setError(err as ApiError);
      setLoading(false);
    }
  }, [agentRunId]);

  const stopStreaming = useCallback(() => {
    setLoading(false);
    setIsComplete(true);
  }, []);

  return {
    logs,
    loading,
    error,
    isComplete,
    startStreaming,
    stopStreaming
  };
}