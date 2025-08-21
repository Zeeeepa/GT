import React from 'react';

// Quality Score Icon
export const QualityScoreIcon: React.FC<{ score: number; className?: string }> = ({ score, className = "w-4 h-4" }) => {
    const getColor = () => {
        if (score >= 0.8) return 'text-green-500';
        if (score >= 0.6) return 'text-yellow-500';
        if (score >= 0.4) return 'text-orange-500';
        return 'text-red-500';
    };

    return (
        <svg className={`${className} ${getColor()}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
    );
};

// Popularity Icon
export const PopularityIcon: React.FC<{ score: number; className?: string }> = ({ score, className = "w-4 h-4" }) => {
    const getColor = () => {
        if (score >= 0.8) return 'text-purple-500';
        if (score >= 0.6) return 'text-blue-500';
        if (score >= 0.4) return 'text-indigo-500';
        return 'text-gray-500';
    };

    return (
        <svg className={`${className} ${getColor()}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
    );
};

// Maintenance Icon
export const MaintenanceIcon: React.FC<{ score: number; className?: string }> = ({ score, className = "w-4 h-4" }) => {
    const getColor = () => {
        if (score >= 0.8) return 'text-green-500';
        if (score >= 0.6) return 'text-yellow-500';
        if (score >= 0.4) return 'text-orange-500';
        return 'text-red-500';
    };

    return (
        <svg className={`${className} ${getColor()}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
    );
};

// Download Count Icon
export const DownloadIcon: React.FC<{ count: number; className?: string }> = ({ count, className = "w-4 h-4" }) => {
    const getColor = () => {
        if (count >= 1000000) return 'text-purple-500';
        if (count >= 100000) return 'text-blue-500';
        if (count >= 10000) return 'text-green-500';
        if (count >= 1000) return 'text-yellow-500';
        return 'text-gray-500';
    };

    return (
        <svg className={`${className} ${getColor()}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
    );
};

// License Icon
export const LicenseIcon: React.FC<{ license?: string; className?: string }> = ({ license, className = "w-4 h-4" }) => {
    const getColor = () => {
        if (!license) return 'text-red-500';
        const openSourceLicenses = ['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause', 'ISC', 'GPL-2.0', 'LGPL-2.1'];
        if (openSourceLicenses.includes(license)) return 'text-green-500';
        return 'text-yellow-500';
    };

    return (
        <svg className={`${className} ${getColor()}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2L3 7v6c0 5.55 3.84 7.74 9 9 5.16-1.26 9-3.45 9-9V7l-7-5zM8 12l-2-2 1.41-1.41L8 9.17l3.59-3.58L13 7l-5 5z" clipRule="evenodd" />
        </svg>
    );
};

// Dependents Icon
export const DependentsIcon: React.FC<{ count: number; className?: string }> = ({ count, className = "w-4 h-4" }) => {
    const getColor = () => {
        if (count >= 10000) return 'text-purple-500';
        if (count >= 1000) return 'text-blue-500';
        if (count >= 100) return 'text-green-500';
        if (count >= 10) return 'text-yellow-500';
        return 'text-gray-500';
    };

    return (
        <svg className={`${className} ${getColor()}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
        </svg>
    );
};

// Package Size Icon
export const PackageSizeIcon: React.FC<{ size: number; className?: string }> = ({ size, className = "w-4 h-4" }) => {
    const getColor = () => {
        if (size > 10000000) return 'text-red-500'; // > 10MB
        if (size > 1000000) return 'text-orange-500'; // > 1MB
        if (size > 100000) return 'text-yellow-500'; // > 100KB
        return 'text-green-500'; // <= 100KB
    };

    return (
        <svg className={`${className} ${getColor()}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
        </svg>
    );
};
