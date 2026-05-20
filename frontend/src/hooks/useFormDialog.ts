import { useState, useCallback } from 'react';

export function useFormDialog<T extends { id: string }>() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);

  const openCreate = useCallback(() => {
    setEditing(null);
    setOpen(true);
  }, []);

  const openEdit = useCallback((item: T) => {
    setEditing(item);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setEditing(null);
  }, []);

  return { open, editing, openCreate, openEdit, close, setOpen };
}
