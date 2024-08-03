
"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';

interface InventoryItem {
  itemId: string;
  date: string;
  type: string;
  quantity: number;
}

interface RecipeDialogProps {
  open: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
}

const RecipeDialog: React.FC<RecipeDialogProps> = ({ open, onClose, inventory }) => {
  const [data, setData] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pantry_items: inventory })
      });
      const result = await response.json();
      setData(result.recipes); // Adjust this based on your API response structure
    } catch (error) {
      console.error('Error fetching data:', error);
      setData('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(data).then(
      () => setCopySuccess('Copied to clipboard!'),
      () => setCopySuccess('Failed to copy!')
    );
  };

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Generated Recipe</DialogTitle>
      <DialogContent>
        {loading ? (
          <CircularProgress />
        ) : (
          <DialogContentText>{data}</DialogContentText>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={fetchData} color="primary">
          Refresh
        </Button>
        <Button onClick={handleCopy} color="primary">
          Copy
        </Button>
      </DialogActions>
      <Snackbar
        open={!!copySuccess}
        autoHideDuration={3000}
        onClose={() => setCopySuccess('')}
      >
        <Alert onClose={() => setCopySuccess('')} severity="success" sx={{ width: '100%' }}>
          {copySuccess}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default RecipeDialog;

