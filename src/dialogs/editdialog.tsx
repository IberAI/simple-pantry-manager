
"use client";
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Button,
} from '@mui/material';
import { InventoryItem } from '@/utils/firebase';

interface EditDialogProps {
  open: boolean;
  item: InventoryItem | null;
  onClose: () => void;
  onSave: (updatedItem: InventoryItem) => void;
}

const EditDialog: React.FC<EditDialogProps> = ({ open, item, onClose, onSave }) => {
  const [editedItem, setEditedItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    if (item) {
      setEditedItem(item);
    }
  }, [item]);

  const handleSave = () => {
    if (editedItem) {
      onSave(editedItem);
    }
  };

  const handleChange = (field: keyof InventoryItem, value: string | number) => {
    setEditedItem((prevItem) => prevItem ? { ...prevItem, [field]: value } : null);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Edit Item</DialogTitle>
      <DialogContent>
        <DialogContentText>Edit the details of the item.</DialogContentText>
        {editedItem && (
          <>
            <TextField
              autoFocus
              margin="dense"
              label="Type"
              type="text"
              fullWidth
              value={editedItem.type}
              onChange={(e) => handleChange('type', e.target.value)}
            />
            <TextField
              margin="dense"
              label="Quantity"
              type="number"
              fullWidth
              value={editedItem.quantity}
              onChange={(e) => handleChange('quantity', +e.target.value)}
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleSave} color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditDialog;

