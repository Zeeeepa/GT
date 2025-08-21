
import React, { useState, useEffect, useRef } from 'react';
import { ProjectList } from '../types';
import HueSlider from './shared/HueSlider';
import { PencilIcon } from './shared/icons/PencilIcon';
import { TrashIcon } from './shared/icons/TrashIcon';
import { CheckIcon } from './shared/icons/CheckIcon';
import { XIcon } from './shared/icons/XIcon';
import { PlusIcon } from './shared/icons/PlusIcon';
import { hexToHsl, parseHslString } from '../utils/colorUtils';
import { UploadIcon } from './shared/icons/UploadIcon';
import { DownloadIcon } from './shared/icons/DownloadIcon';

const SATURATION = 80;
const LIGHTNESS = 60;

// Converts a hex color from the old palette or an HSL string to a hue value
function colorToHue(color?: string): number {
    if (!color) return 210; // Default blueish hue
    if (color.startsWith('hsl')) {
        const hsl = parseHslString(color);
        return hsl ? hsl.h : 210;
    }
    const hsl = hexToHsl(color);
    return hsl ? hsl.h : 210;
}

interface ManageListsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lists: ProjectList[];
  repoListMembership: Record<string, string[]>;
  syncSettings: Record<string, boolean>;
  onConfirmDelete: (list: ProjectList) => void;
  onEditList: (listId: string, newName: string, newColor: string) => void;
  onCreateList: (name: string, color: string) => void;
  onImportData: (data: { lists: ProjectList[], repoListMembership: Record<string, string[]>, syncSettings?: Record<string, boolean> }) => void;
}

const ManageListsModal: React.FC<ManageListsModalProps> = ({ isOpen, onClose, lists, repoListMembership, syncSettings, onConfirmDelete, onEditList, onCreateList, onImportData }) => {
    const [editingListId, setEditingListId] = useState<string | null>(null);
    const [currentName, setCurrentName] = useState('');
    const [currentHue, setCurrentHue] = useState(210);

    const [newListName, setNewListName] = useState('');
    const [newListHue, setNewListHue] = useState(Math.floor(Math.random() * 360));
    
    const importFileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isOpen) {
            setEditingListId(null);
            setNewListName('');
            setNewListHue(Math.floor(Math.random() * 360));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleEditClick = (list: ProjectList) => {
        setEditingListId(list.id);
        setCurrentName(list.name);
        setCurrentHue(colorToHue(list.color));
    };

    const handleCancelClick = () => {
        setEditingListId(null);
    };

    const handleSaveClick = () => {
        if (editingListId && currentName.trim()) {
            const newColor = `hsl(${currentHue}, ${SATURATION}%, ${LIGHTNESS}%)`;
            onEditList(editingListId, currentName.trim(), newColor);
            setEditingListId(null);
        }
    };
    
    const handleCreateClick = () => {
        if (newListName.trim()) {
            const newColor = `hsl(${newListHue}, ${SATURATION}%, ${LIGHTNESS}%)`;
            onCreateList(newListName.trim(), newColor);
            setNewListName('');
            setNewListHue(Math.floor(Math.random() * 360));
        }
    };

    const handleExportClick = () => {
        const dataStr = JSON.stringify({ lists, repoListMembership, syncSettings }, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "github-project-catalog.json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => {
        importFileRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const data = JSON.parse(text);
                onImportData(data);
                onClose(); // Close modal after successful import
            } catch (error) {
                alert(`Error reading or parsing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        };
        reader.onerror = () => {
            alert("Failed to read the file.");
        };
        reader.readAsText(file);
        
        // Reset file input value
        if (event.target) {
            event.target.value = "";
        }
    };

    const ListItem = ({ list }: { list: ProjectList }) => {
        const isEditing = editingListId === list.id;
        const listColor = list.color || `hsl(210, ${SATURATION}%, ${LIGHTNESS}%)`;

        if (isEditing) {
            return (
                <div className="bg-tertiary p-4 rounded-lg space-y-4 border border-accent">
                    <input
                        type="text"
                        value={currentName}
                        onChange={(e) => setCurrentName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveClick()}
                        className="w-full bg-primary border border-border-color rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        autoFocus
                    />
                    <HueSlider hue={currentHue} onHueChange={setCurrentHue} />
                    <div className="flex justify-end items-center gap-2">
                        <button onClick={handleCancelClick} className="px-3 py-1.5 text-sm text-text-secondary rounded-md hover:bg-border-color transition-colors" aria-label="Cancel edit">Cancel</button>
                        <button onClick={handleSaveClick} className="px-3 py-1.5 text-sm bg-accent text-white font-semibold rounded-md hover:bg-accent/80 transition-colors" aria-label="Save changes">Save</button>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex items-center justify-between bg-tertiary p-3 rounded-md group">
                <div className="flex items-center min-w-0">
                    <span style={{ backgroundColor: listColor }} className="w-4 h-4 rounded-full mr-3 shrink-0 border border-black/20"></span>
                    <span className="text-text-primary font-medium truncate" title={list.name}>{list.name}</span>
                </div>
                <div className="flex items-center shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditClick(list)} className="p-2 text-text-secondary rounded-md hover:text-accent hover:bg-accent/20 transition-colors" aria-label={`Edit list ${list.name}`}>
                        <PencilIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => onConfirmDelete(list)} className="p-2 text-text-secondary rounded-md hover:text-danger hover:bg-danger/20 transition-colors" aria-label={`Delete list ${list.name}`}>
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-secondary rounded-lg shadow-2xl border border-border-color w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <h2 className="text-xl font-bold text-text-primary mb-6">Manage Lists</h2>
                    
                    <div className="bg-tertiary p-4 rounded-lg mb-6 space-y-4">
                        <h3 className="font-semibold text-text-primary">Create New List</h3>
                        <input
                            type="text"
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateClick()}
                            placeholder="New list name..."
                            className="w-full bg-primary border border-border-color rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                        <HueSlider hue={newListHue} onHueChange={setNewListHue} />
                        <div className="flex justify-end">
                            <button onClick={handleCreateClick} disabled={!newListName.trim()} className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white font-semibold rounded-md hover:bg-accent/80 transition-colors text-sm disabled:bg-gray-500 disabled:cursor-not-allowed">
                                <PlusIcon className="w-5 h-5" />
                                Create List
                            </button>
                        </div>
                    </div>

                    <h3 className="font-semibold text-text-primary mb-3">Existing Lists</h3>
                    <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
                        {lists.length > 0 ? (
                            [...lists].sort((a,b) => a.name.localeCompare(b.name)).map(list => <ListItem key={list.id} list={list} />)
                        ) : (
                            <p className="text-text-secondary text-center py-4">You have no lists yet.</p>
                        )}
                    </div>
                </div>
                <div className="bg-tertiary px-6 py-4 flex justify-between items-center rounded-b-lg">
                    <div className="flex items-center gap-2">
                         <input
                            type="file"
                            ref={importFileRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept=".json"
                        />
                        <button onClick={handleImportClick} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-text-secondary rounded-md hover:bg-border-color transition-colors" aria-label="Import lists">
                            <UploadIcon className="w-5 h-5" />
                            <span>Import</span>
                        </button>
                        <button onClick={handleExportClick} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-text-secondary rounded-md hover:bg-border-color transition-colors" aria-label="Export lists">
                            <DownloadIcon className="w-5 h-5" />
                            <span>Export</span>
                        </button>
                    </div>
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-transparent border border-border-color text-text-primary hover:bg-border-color transition-colors">Done</button>
                </div>
            </div>
        </div>
    );
};

export default ManageListsModal;
