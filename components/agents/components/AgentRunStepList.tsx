import React, { useState } from 'react';
import { List, Icon } from '@raycast/api';
import { AgentRunStep } from '../../../types';
import { formatDistanceToNow } from 'date-fns';

interface AgentRunStepListProps {
  steps: AgentRunStep[];
}

export function AgentRunStepList({ steps }: AgentRunStepListProps) {
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);

  // Toggle step expansion
  const toggleStepExpansion = (stepId: string) => {
    if (expandedStepId === stepId) {
      setExpandedStepId(null);
    } else {
      setExpandedStepId(stepId);
    }
  };

  // Get icon for step status
  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return { source: Icon.CheckCircle, tintColor: Icon.Color.Green };
      case 'failed':
        return { source: Icon.XMarkCircle, tintColor: Icon.Color.Red };
      case 'running':
        return { source: Icon.Circle, tintColor: Icon.Color.Blue };
      case 'pending':
        return { source: Icon.Circle, tintColor: Icon.Color.SecondaryText };
      default:
        return { source: Icon.Circle, tintColor: Icon.Color.SecondaryText };
    }
  };

  // Format step duration
  const formatDuration = (duration?: number) => {
    if (!duration) return '';
    
    if (duration < 1000) {
      return `${duration}ms`;
    } else if (duration < 60000) {
      return `${(duration / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(duration / 60000);
      const seconds = ((duration % 60000) / 1000).toFixed(0);
      return `${minutes}m ${seconds}s`;
    }
  };

  return (
    <List isShowingDetail>
      {steps.map((step) => {
        const isExpanded = expandedStepId === step.id;
        const statusIcon = getStepStatusIcon(step.status);
        const formattedTime = step.timestamp ? formatDistanceToNow(new Date(step.timestamp), { addSuffix: true }) : '';
        const formattedDuration = formatDuration(step.duration);
        
        return (
          <List.Item
            key={step.id}
            title={step.title}
            subtitle={step.description}
            icon={statusIcon}
            accessories={[
              { text: step.status.toUpperCase() },
              { text: formattedTime },
              ...(formattedDuration ? [{ text: formattedDuration }] : [])
            ]}
            detail={
              <List.Item.Detail
                markdown={`
                  # ${step.title}
                  
                  **Status:** ${step.status.toUpperCase()}
                  **Time:** ${formattedTime}
                  ${formattedDuration ? `**Duration:** ${formattedDuration}` : ''}
                  
                  ## Description
                  
                  ${step.description}
                  
                  ${step.details ? `## Details\n\n${step.details}` : ''}
                  
                  ${step.error ? `## Error\n\n\`\`\`\n${step.error}\n\`\`\`` : ''}
                  
                  ${step.logs && step.logs.length > 0 ? `## Logs\n\n\`\`\`\n${step.logs.join('\n')}\n\`\`\`` : ''}
                `}
              />
            }
            actions={
              <List.Item.Actions>
                {/* Add actions here if needed */}
              </List.Item.Actions>
            }
          />
        );
      })}
    </List>
  );
}
