import React, { useState, useEffect } from 'react';
import { NpmPackageDetail, FileNode } from '../../types';
import { getNpmPackageDetails, getNpmFileTree } from '../../services/searchService';
import LoadingSpinner from '../shared/LoadingSpinner';
import { XIcon } from '../shared/icons/XIcon';
import { ChevronRightIcon } from '../shared/icons/ChevronRightIcon';
import { DocumentIcon } from '../shared/icons/DocumentIcon';
import { FolderIcon } from '../shared/icons/FolderIcon';

interface NpmDetailModalProps {
    packageName: string;
    version: string;
    onClose: () => void;
}

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const FileTree: React.FC<{ nodes: FileNode[] }> = ({ nodes }) => {
    const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});

    const toggleFolder = (path: string) => {
        setOpenFolders(prev => ({...prev, [path]: !prev[path]}));
    };

    const renderNode = (node: FileNode, level: number) => {
        const isFolder = node.type === 'directory';
        const isOpen = openFolders[node.path];

        return (
            <div key={node.path} style={{ paddingLeft: `${level * 1.25}rem`}}>
                <div onClick={isFolder ? () => toggleFolder(node.path) : undefined} className={`flex items-center gap-2 py-1.5 rounded-md cursor-pointer hover:bg-tertiary ${isFolder ? '' : 'cursor-default'}`}>
                     {isFolder ? (
                        <>
                            <ChevronRightIcon className={`w-4 h-4 text-text-secondary transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                            <FolderIcon className="w-5 h-5 text-accent"/>
                        </>
                     ) : (
                        <>
                            <span className="w-4 h-4"></span>
                            <DocumentIcon className="w-5 h-5 text-text-secondary" />
                        </>
                     )}
                    <span className="text-sm text-text-primary">{node.name}</span>
                </div>
                {isFolder && isOpen && node.files && (
                    <div className="border-l border-border-color/50">
                        {node.files.map(child => renderNode(child, level + 1))}
                    </div>
                )}
            </div>
        )
    };
    return <>{nodes.map(node => renderNode(node, 0))}</>;
};

const NpmDetailModal: React.FC<NpmDetailModalProps> = ({ packageName, version, onClose }) => {
    const [details, setDetails] = useState<NpmPackageDetail | null>(null);
    const [fileTree, setFileTree] = useState<FileNode[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fileTreeError, setFileTreeError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'files'>('details');

    useEffect(() => {
        const fetchDetails = async () => {
            setIsLoading(true);
            setError(null);
            setFileTreeError(null);
            try {
                const [detailsResult, fileTreeResult] = await Promise.allSettled([
                    getNpmPackageDetails(packageName),
                    getNpmFileTree(packageName, version),
                ]);

                if (detailsResult.status === 'fulfilled') {
                    setDetails(detailsResult.value);
                } else {
                    throw detailsResult.reason;
                }

                if (fileTreeResult.status === 'fulfilled') {
                    setFileTree(fileTreeResult.value);
                } else {
                    console.warn(`Could not load file tree for ${packageName}@${version}:`, fileTreeResult.reason);
                    setFileTreeError('Could not load file tree. The package may be too large or its structure is unavailable from the CDN.');
                    setFileTree(null);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch package data.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetails();
    }, [packageName, version]);

    const renderContent = () => {
        if (isLoading) return <div className="flex justify-center items-center h-96"><LoadingSpinner /></div>;
        if (error) return <div className="text-center p-8 text-danger">{error}</div>;
        if (!details) return <div className="text-center p-8 text-text-secondary">No details found.</div>;
        
        if (activeTab === 'files') {
            if (fileTreeError) {
                return <div className="text-center p-8 text-text-secondary">{fileTreeError}</div>;
            }
            return (
                <div className="max-h-[60vh] overflow-y-auto pr-2 font-mono">
                    {fileTree && fileTree.length > 0 ? <FileTree nodes={fileTree} /> : <p className="text-text-secondary text-center p-8">File tree is empty or not available.</p>}
                </div>
            );
        }

        return (
             <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <p className="text-text-secondary">{details.description}</p>
                 <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-tertiary p-3 rounded-md">
                        <div className="text-text-secondary text-xs">Version</div>
                        <div className="text-text-primary font-semibold">{details.version}</div>
                    </div>
                    <div className="bg-tertiary p-3 rounded-md">
                        <div className="text-text-secondary text-xs">License</div>
                        <div className="text-text-primary font-semibold">{details.license || 'N/A'}</div>
                    </div>
                    <div className="bg-tertiary p-3 rounded-md">
                        <div className="text-text-secondary text-xs">Unpacked Size</div>
                        <div className="text-text-primary font-semibold">{formatBytes(details.unpackedSize)}</div>
                    </div>
                     <div className="bg-tertiary p-3 rounded-md">
                        <div className="text-text-secondary text-xs">Homepage</div>
                        <a href={details.homepage} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline truncate block">{details.homepage || 'N/A'}</a>
                    </div>
                </div>
                <div>
                    <h4 className="text-text-primary font-semibold mb-2">Dependencies</h4>
                    {details.dependencies && Object.keys(details.dependencies).length > 0 ? (
                        <div className="bg-tertiary p-3 rounded-md max-h-40 overflow-y-auto text-sm space-y-1">
                            {Object.entries(details.dependencies).map(([name, ver]) => (
                                <div key={name} className="flex justify-between">
                                    <span className="text-text-primary">{name}</span>
                                    <span className="text-text-secondary">{ver}</span>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-text-secondary text-sm">No dependencies found.</p>}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-secondary rounded-lg shadow-2xl border border-border-color w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <header className="p-4 flex justify-between items-start border-b border-border-color">
                    <div className="min-w-0">
                        <h2 className="text-xl font-bold text-text-primary truncate">{packageName}</h2>
                        <p className="text-sm text-text-secondary">v{version}</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-tertiary text-text-secondary hover:text-text-primary"><XIcon className="w-6 h-6" /></button>
                </header>

                <div className="border-b border-border-color">
                     <nav className="flex space-x-2 px-4" aria-label="Tabs">
                        <button onClick={() => setActiveTab('details')} className={`${activeTab === 'details' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'} whitespace-nowrap py-3 px-2 border-b-2 font-medium text-sm`}>Details</button>
                        <button onClick={() => setActiveTab('files')} className={`${activeTab === 'files' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'} whitespace-nowrap py-3 px-2 border-b-2 font-medium text-sm`}>File Tree</button>
                    </nav>
                </div>

                <div className="p-6">
                    {renderContent()}
                </div>
                 <div className="bg-tertiary px-6 py-4 flex justify-end items-center rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-transparent border border-border-color text-text-primary hover:bg-border-color transition-colors">Close</button>
                </div>
            </div>
        </div>
    );
};

export default NpmDetailModal;