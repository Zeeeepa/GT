import React, { createContext, useState, useContext, useMemo, useCallback } from 'react';

type DialogType = 'resume-run' | 'create-run' | 'view-response';

interface DialogContextType {
  openDialog: (type: DialogType, data?: any) => void;
  closeDialog: () => void;
  isDialogOpen: (type: DialogType) => boolean;
  dialogData: any;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeDialog, setActiveDialog] = useState<DialogType | null>(null);
  const [dialogData, setDialogData] = useState<any>(null);

  const openDialog = useCallback((type: DialogType, data: any = null) => {
    setActiveDialog(type);
    setDialogData(data);
  }, []);

  const closeDialog = useCallback(() => {
    setActiveDialog(null);
    setDialogData(null);
  }, []);

  const isDialogOpen = useCallback((type: DialogType) => {
    return activeDialog === type;
  }, [activeDialog]);

  const value = useMemo(() => ({
    openDialog,
    closeDialog,
    isDialogOpen,
    dialogData,
  }), [openDialog, closeDialog, isDialogOpen, dialogData]);

  return (
    <DialogContext.Provider value={value}>
      {children}
    </DialogContext.Provider>
  );
};

export const useDialog = (): DialogContextType => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};
