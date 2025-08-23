import React from 'react';
import { AgentRun, AgentRunStatus } from '../../types';
import { CheckCircleIcon } from '../shared/icons/CheckCircleIcon';
import { XCircleIcon } from '../shared/icons/XCircleIcon';
import { ClockIcon } from '../shared/icons/ClockIcon';
import { PlayIcon } from '../shared/icons/PlayIcon';
import LoadingSpinner from '../shared/LoadingSpinner';

interface RunListItemProps {
    run: AgentRun;
    isExpanded: boolean;
    onToggle: () => void;
    onResume: (run: AgentRun) => void;
}

const timeAgo = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)}y ago`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)}mo ago`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)}d ago`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}h ago`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)}m ago`;
    return `${Math.floor(seconds)}s ago`;
};

const StatusBadge: React.FC<{ status: AgentRun['status'] }> = ({ status }) => {
    const s = status ? status.toLowerCase() : 'unknown';
    const styles: Record<string, string> = {
        [AgentRunStatus.PENDING.toLowerCase()]: 'bg-gray-500/20 text-gray-400',
        'running': 'bg-blue-500/20 text-blue-400 animate-pulse',
        [AgentRunStatus.RUNNING.toLowerCase()]: 'bg-blue-500/20 text-blue-400 animate-pulse',
        'completed': 'bg-green-500/20 text-green-400',
        [AgentRunStatus.COMPLETED.toLowerCase()]: 'bg-green-500/20 text-green-400',
        [AgentRunStatus.FAILED.toLowerCase()]: 'bg-red-500/20 text-red-400',
        'error': 'bg-red-500/20 text-red-400',
        [AgentRunStatus.PAUSED.toLowerCase()]: 'bg-yellow-500/20 text-yellow-400',
        'requires_action': 'bg-yellow-500/20 text-yellow-400',
        [AgentRunStatus.CANCELLED.toLowerCase()]: 'bg-gray-700/30 text-gray-500',
    };
    const defaultStyle = 'bg-gray-700/20 text-gray-500';
    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${styles[s] || defaultStyle}`}>
            {(s || 'unknown').replace(/_/g, ' ')}
        </span>
    );
};

const StepIcon = ({ status }: { status: NonNullable<AgentRun['steps']>[0]['status'] }) => {
    switch (status) {
        case 'completed': return <CheckCircleIcon className="w-5 h-5 text-success"/>;
        case 'failed': return <XCircleIcon className="w-5 h-5 text-danger"/>;
        case 'running': return <div className="w-5 h-5 text-accent"><LoadingSpinner /></div>;
        default: return <ClockIcon className="w-5 h-5 text-text-secondary"/>;
    }
};

const RunListItem: React.FC<RunListItemProps> = ({ run, isExpanded, onToggle, onResume }) => {
    const handleResumeClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onResume(run);
    };

    const isResumable = run.status?.toLowerCase() === AgentRunStatus.PAUSED.toLowerCase();

    return (
        <li className="bg-secondary border border-border-color rounded-lg transition-all duration-300">
            <div className="p-4 cursor-pointer hover:bg-tertiary/50" onClick={onToggle}>
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">{run.prompt || 'No prompt provided'}</p>
                        <div className="flex items-center gap-2 text-xs text-text-secondary mt-1 flex-wrap">
                            <span>ID: {run.id}</span>
                            {run.web_url && <><span>•</span><a href={run.web_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline" onClick={e => e.stopPropagation()}>View on Codegen</a></>}
                            <span>•</span>
                            <span>{timeAgo(run.created_at)}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <StatusBadge status={run.status} />
                        {isResumable && (
                            <button onClick={handleResumeClick} className="flex items-center gap-1 text-xs px-2 py-1 bg-accent text-white rounded-md hover:bg-accent/80">
                                <PlayIcon className="w-4 h-4" />
                                Resume
                            </button>
                        )}
                    </div>
                </div>
            </div>
            {isExpanded && run.steps && (
                <div className="border-t border-border-color p-4 space-y-4">
                    <h4 className="font-semibold text-sm">Live Progression</h4>
                    <ul className="space-y-3">
                        {run.steps.map(step => (
                            <li key={step.id} className="flex items-start gap-3">
                                <StepIcon status={step.status} />
                                <div className="flex-1">
                                    <p className="font-medium text-sm">{step.title}</p>
                                    <p className="text-xs text-text-secondary">{step.description}</p>
                                </div>
                                <span className="text-xs text-text-secondary shrink-0">{timeAgo(step.timestamp)}</span>
                            </li>
                        ))}
                    </ul>
                    {run.status?.toUpperCase() === AgentRunStatus.COMPLETED && run.result && (
                        <div>
                            <h4 className="font-semibold text-sm mb-2">Result</h4>
                            <div className="bg-primary p-3 rounded-md text-sm whitespace-pre-wrap border border-border-color/50">{run.result}</div>
                        </div>
                    )}
                     {run.status?.toUpperCase() === AgentRunStatus.FAILED && (
                        <div>
                            <h4 className="font-semibold text-sm mb-2 text-danger">Failure Details</h4>
                            <div className="bg-primary p-3 rounded-md text-sm whitespace-pre-wrap border border-danger/50 text-danger/90">
                                {run.result || `The agent failed during the '${run.steps?.find(s => s.status === 'failed')?.title || 'unknown'}' step.`}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </li>
    );
};

export default RunListItem;
