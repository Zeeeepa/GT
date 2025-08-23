import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import SettingsDialog from './SettingsDialog';

const SettingsIcon: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const openDialog = () => {
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
  };

  return (
    <>
      <button
        onClick={openDialog}
        className="p-2 rounded-md hover:bg-hover transition-colors"
        title="Settings"
      >
        <Settings className="w-5 h-5 text-text-secondary" />
      </button>
      <SettingsDialog isOpen={isDialogOpen} onClose={closeDialog} />
    </>
  );
};

export default SettingsIcon;

