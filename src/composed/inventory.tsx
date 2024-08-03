
"use client";

import React, { useState, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Typography, TextField, Paper, Button, Box } from '@mui/material';
import InventoryTable from './inventory-table';
import EditDialog from '@/dialogs/editdialog';
import DeleteDialog from '@/dialogs/deletedialog';
import AddItemDialog from '@/dialogs/additemdialog';
import RecipeDialog from '@/dialogs/recipe';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, getUserInventory, addItemToInventory, removeItemFromInventory, editItemInInventory } from '@/utils/firebase';

interface InventoryItem {
  itemId: string;
  date: string;
  type: string;
  quantity: number;
}

const Inventory: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [openEditDialog, setOpenEditDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [openAddDialog, setOpenAddDialog] = useState<boolean>(false);
  const [openFetchDialog, setOpenFetchDialog] = useState<boolean>(false);
  const [currentItem, setCurrentItem] = useState<InventoryItem | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const userItems = await getUserInventory(user.uid);
        setItems(userItems);
      } else {
        setUser(null);
        setItems([]);
        router.push('/signin');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredItems = items.filter((item) =>
    item.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (item: InventoryItem) => {
    setCurrentItem(item);
    setOpenEditDialog(true);
  };

  const handleDeleteConfirm = (item: InventoryItem) => {
    setCurrentItem(item);
    setOpenDeleteDialog(true);
  };

  const handleDelete = async (itemId: string) => {
    if (user) {
      try {
        await removeItemFromInventory(user.uid, itemId);
        const updatedItems = await getUserInventory(user.uid);
        setItems(updatedItems);
        setOpenDeleteDialog(false);
      } catch (error) {
        console.error('Error removing item:', error);
      }
    }
  };

  const handleCloseEdit = () => {
    setOpenEditDialog(false);
    setCurrentItem(null);
  };

  const handleCloseDelete = () => {
    setOpenDeleteDialog(false);
    setCurrentItem(null);
  };

  const handleSave = async (updatedItem: InventoryItem) => {
    if (user) {
      try {
        await editItemInInventory(user.uid, updatedItem.itemId, updatedItem.type, updatedItem.quantity);
        const updatedItems = await getUserInventory(user.uid);
        setItems(updatedItems);
        handleCloseEdit();
      } catch (error) {
        console.error('Error updating item:', error);
      }
    }
  };

  const handleAdd = async (newItem: InventoryItem) => {
    if (user) {
      try {
        const date = new Date(newItem.date);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date value');
        }
        await addItemToInventory(user.uid, date, newItem.type, newItem.quantity);
        const updatedItems = await getUserInventory(user.uid);
        setItems(updatedItems);
        setOpenAddDialog(false);
      } catch (error) {
        console.error('Error adding item:', error);
      }
    }
  };

  const handleSaveSync = (updatedItem: InventoryItem) => {
    handleSave(updatedItem).catch(error => console.error('Error updating item:', error));
  };

  const handleAddSync = (newItem: InventoryItem) => {
    handleAdd(newItem).catch(error => console.error('Error adding item:', error));
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Inventory Manager
      </Typography>
      <Box display="flex" alignItems="center" marginBottom={2}>
        <TextField
          label="Search"
          variant="outlined"
          fullWidth
          margin="normal"
          value={searchTerm}
          onChange={handleSearch}
        />
        <Button variant="contained" color="primary" onClick={() => setOpenAddDialog(true)} style={{ marginLeft: 16 }}>
          Add New Item
        </Button>
        <Button variant="contained" color="secondary" onClick={() => setOpenFetchDialog(true)} style={{ marginLeft: 16 }}>
          Generate Random Recipe
        </Button>
      </Box>
      <Paper>
        <InventoryTable items={filteredItems} onEdit={handleEdit} onDelete={handleDeleteConfirm} />
      </Paper>
      {currentItem && (
        <EditDialog
          open={openEditDialog}
          item={currentItem}
          onClose={handleCloseEdit}
          onSave={handleSaveSync}
        />
      )}
      {currentItem && (
        <DeleteDialog
          open={openDeleteDialog}
          onClose={handleCloseDelete}
          onConfirm={() => currentItem && handleDelete(currentItem.itemId)}
        />
      )}
      <AddItemDialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} onAdd={handleAddSync} />
      <RecipeDialog open={openFetchDialog} onClose={() => setOpenFetchDialog(false)} inventory={items} />
    </Container>
  );
};

export default Inventory;

