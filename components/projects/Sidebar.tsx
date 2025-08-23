import React from 'react';
import { ProjectList, ProjectView } from '../../types';
import { CollectionIcon } from '../shared/icons/CollectionIcon';
import { ChevronDoubleLeftIcon } from '../shared/icons/ChevronDoubleLeftIcon';
import { ChevronDoubleRightIcon } from '../shared/icons/ChevronDoubleRightIcon';
import { ListBulletIcon } from '../shared/icons/ListBulletIcon';
import { GithubIcon } from '../shared/icons/GithubIcon';
import { SearchIcon } from '../shared/icons/SearchIcon';
import { CogIcon } from '../shared/icons/CogIcon';

interface SidebarProps {
  lists: (ProjectList & { item_count: number })[];
  activeView: ProjectView;
  onSelectView: (view: ProjectView) => void;
  onOpenManageListsModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenSyncManagementModal?: () => void;
  isCollapsed: boolean;
  onToggle: () => void;
  width: number;
  onResizeStart: (e: React.MouseEvent) => void;
  isResizing: boolean;
  draggedOverListId: string | null;
  onDrop: (e: React.DragEvent, listId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnter: (e: React.DragEvent, listId: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const NavButton: React.FC<{
  onClick: () => void;
  isActive: boolean;
  isCollapsed: boolean;
  label: string;
  children: React.ReactNode;
  extraContent?: React.ReactNode;
}> = ({ onClick, isActive, isCollapsed, label, children, extraContent }) => (
  <div className="relative group">
      <button
        onClick={onClick}
        className={`w-full flex items-center p-2 rounded-md transition-colors duration-200 ${
          isActive ? 'bg-accent/20 text-accent font-semibold' : 'hover:bg-tertiary text-text-secondary'
        } ${isCollapsed ? 'justify-center' : ''}`}
      >
        {children}
        {!isCollapsed && <span className="flex-1 ml-3 text-left truncate">{label}</span>}
        {!isCollapsed && extraContent}
      </button>
      {isCollapsed && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-2 py-1 bg-tertiary text-text-primary text-xs font-normal rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
          {label}
        </div>
      )}
  </div>
);


const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(({ 
  lists, activeView, onSelectView, onOpenManageListsModal, onOpenSettingsModal, onOpenSyncManagementModal,
  isCollapsed, onToggle, width, onResizeStart, isResizing,
  draggedOverListId, onDrop, onDragOver, onDragEnter, onDragLeave,
  searchQuery, onSearchChange
}, ref) => {
  
  return (
    <aside 
      ref={ref}
      style={{ width: isCollapsed ? 80 : width }}
      className={`relative flex flex-col shrink-0 bg-secondary border-r border-border-color ${isResizing ? '' : 'transition-width duration-300 ease-in-out'}`}
    >
      <header className="flex items-center p-4 border-b border-border-color shrink-0">
        <div className={`flex ${isCollapsed ? 'flex-col space-y-2 items-center' : 'space-x-2 items-center'}`}>
          <button 
            onClick={onOpenSettingsModal} 
            className={`p-1 rounded-md hover:bg-tertiary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-secondary focus:ring-accent transition-all duration-300`} 
            aria-label="GitHub Settings"
            title="GitHub Settings"
          >
            <GithubIcon className="w-8 h-8 text-text-primary" />
          </button>
          
          {onOpenSyncManagementModal && (
            <button 
              onClick={onOpenSyncManagementModal} 
              className={`p-1 rounded-md hover:bg-tertiary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-secondary focus:ring-accent transition-all duration-300`} 
              aria-label="Sync Management"
              title="Sync Management"
            >
              <CogIcon className="w-8 h-8 text-text-primary" />
            </button>
          )}
        </div>
      </header>
      
      <div className={`p-4 border-b border-border-color shrink-0 ${isCollapsed ? 'hidden' : ''}`}>
          <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <SearchIcon className="w-5 h-5 text-text-secondary" />
              </span>
              <input 
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full bg-primary border border-border-color rounded-md pl-10 pr-4 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  aria-label="Search projects"
              />
          </div>
      </div>

      <div className={`flex-1 overflow-y-auto overflow-x-hidden space-y-2 ${isCollapsed ? 'p-2' : 'p-4'}`}>
        <NavButton 
            onClick={() => onSelectView({ type: 'all' })} 
            isActive={activeView.type === 'all'}
            isCollapsed={isCollapsed}
            label="All Projects"
        >
            <CollectionIcon className="w-5 h-5 shrink-0" />
        </NavButton>
        
        <div className="pt-4">
            <div className={`px-2 text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 ${isCollapsed ? 'text-center' : ''}`}>
                {isCollapsed ? 'L' : 'Lists'}
            </div>
        </div>

        {lists.map(list => (
          <div 
            key={list.id} 
            onDrop={(e) => onDrop(e, list.id)}
            onDragOver={onDragOver}
            onDragEnter={(e) => onDragEnter(e, list.id)}
            onDragLeave={onDragLeave}
            className={`rounded-md transition-colors ${draggedOverListId === list.id ? 'bg-accent/30' : ''}`}
          >
            <NavButton
              onClick={() => onSelectView({ type: 'list', list })}
              isActive={activeView.type === 'list' && activeView.list.id === list.id}
              isCollapsed={isCollapsed}
              label={list.name}
              extraContent={<span className="text-xs bg-tertiary rounded-full px-2 py-0.5">{list.item_count}</span>}
            >
              <span style={{ backgroundColor: list.color || '#8B949E' }} className="w-4 h-4 rounded-full shrink-0 border-2 border-secondary box-content" />
            </NavButton>
          </div>
        ))}
        
        <div className="pt-2">
           <NavButton
              onClick={onOpenManageListsModal}
              isActive={false}
              isCollapsed={isCollapsed}
              label="Manage Lists"
            >
              <ListBulletIcon className="w-5 h-5 shrink-0" />
            </NavButton>
        </div>
      </div>
      <div className={`mt-auto pt-4 border-t border-border-color flex items-center gap-2 ${isCollapsed ? 'p-2 flex-col' : 'p-4'}`}>
          <div className={`${isCollapsed ? 'w-full' : 'flex-1'}`}>
            <NavButton
              onClick={onToggle}
              isActive={false}
              isCollapsed={isCollapsed}
              label={isCollapsed ? 'Expand' : 'Collapse'}
            >
              {isCollapsed ? <ChevronDoubleRightIcon className="w-5 h-5 shrink-0" /> : <ChevronDoubleLeftIcon className="w-5 h-5 shrink-0" />}
            </NavButton>
          </div>
      </div>

      {!isCollapsed && (
        <div
          role="separator"
          aria-label="Resize sidebar"
          onMouseDown={onResizeStart}
          className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-accent/50 transition-colors z-10"
        />
      )}
    </aside>
  );
});

export default Sidebar;

