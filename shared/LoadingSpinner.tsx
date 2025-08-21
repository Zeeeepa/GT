import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  color = 'currentColor' 
}) => {
  const sizeMap = {
    small: 16,
    medium: 24,
    large: 32,
  };

  const pixelSize = sizeMap[size];

  return (
    <div className="loading-spinner-container" style={{ display: 'inline-flex' }}>
      <svg
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-spin"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke={color}
          strokeWidth="2"
          strokeOpacity="0.25"
        />
        <path
          d="M12 2C6.47715 2 2 6.47715 2 12"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

export default LoadingSpinner;
