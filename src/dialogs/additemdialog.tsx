
"use client";

import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  Tabs,
  Tab,
  Box,
} from '@mui/material';
import { InventoryItem } from '@/utils/firebase';
import { Camera } from 'react-camera-pro';

interface AddItemDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (newItem: InventoryItem) => void;
}
const errorMessages = {
  noCameraAccessible: "No camera accessible. Please ensure your camera is properly connected and try again.",
  permissionDenied: "Permission to access the camera was denied. Please enable camera access in your browser settings and reload the page.",
  switchCamera: "Error switching the camera. Please try again.",
  canvas: "Error accessing the canvas element. Please ensure the canvas is available and try again."
};
const AddItemDialog: React.FC<AddItemDialogProps> = ({ open, onClose, onAdd }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [newItem, setNewItem] = useState<InventoryItem>({ itemId: '', date: new Date().toISOString(), type: '', quantity: 0 });
  const cameraRef = useRef<any>(null);
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analyzedResult, setAnalyzedResult] = useState<{ type: string; quantity: number } | null>(null);

  const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabIndex(newValue);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewItem((prevItem) => ({
      ...prevItem,
      [name]: name === 'quantity' ? Number(value) : value,
    }));
  };

  const handleAdd = async () => {
    let updatedItem = { ...newItem, date: new Date().toISOString() };

    if (tabIndex === 1 && image) {
      try {
        const result = await analyzeImage(image);
        const [type, quantity] = result.split(',');
        updatedItem = { ...updatedItem, type, quantity: Number(quantity) };
      } catch (error) {
        console.error('Error analyzing image:', error);
        alert('There was an error analyzing the image. Please try again.');
        return;
      }
    }

    onAdd(updatedItem);
    onClose(); // Close the dialog after adding the item
  };

  const handleTakePhoto = async () => {
    if (cameraRef.current) {
      const photo = cameraRef.current.takePhoto();
      setImage(photo);
      await analyzeImage(photo);
    }
  };

  const isValidImage = (file: File) => {
    const validFormats = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    const maxSize = 20 * 1024 * 1024; // 20 MB

    if (!validFormats.includes(file.type)) {
      return 'Unsupported image format. Please upload a PNG, JPEG, GIF, or WEBP image.';
    }
    if (file.size > maxSize) {
      return 'Image size exceeds 20 MB. Please upload a smaller image.';
    }
    return null;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const errorMessage = isValidImage(file);
      if (errorMessage) {
        console.error(errorMessage);
        alert(errorMessage);
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Image = e.target?.result as string;
        setImage(base64Image);
        await analyzeImage(base64Image);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraSwitch = () => {
    if (cameraRef.current) {
      cameraRef.current.switchCamera();
    }
  };

  const analyzeImage = async (base64Image: string) => {
    try {
      const result = await fetchImageAnalysis(base64Image);
      const [type, quantity] = result.split(',');
      if (type && quantity) {
        setAnalyzedResult({ type, quantity: Number(quantity) });
        return result;
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      alert('There was an error analyzing the image. Please try again.');
      throw error;
    }
  };

  const fetchImageAnalysis = async (base64Image: string) => {
    try {
      const response = await fetch('/api/vision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64_image: base64Image,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error: ${response.status} ${response.statusText} - ${errorData.error}`);
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Error fetching image analysis:', error);
      throw error;
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add New Item</DialogTitle>
      <DialogContent>
        <Tabs value={tabIndex} onChange={handleTabChange}>
          <Tab label="Manual Entry" />
          <Tab label="Computer Vision" />
        </Tabs>
        <Box p={3}>
          {tabIndex === 0 && (
            <>
              <TextField
                autoFocus
                margin="dense"
                label="Type"
                name="type"
                type="text"
                fullWidth
                value={newItem.type}
                onChange={handleChange}
              />
              <TextField
                margin="dense"
                label="Quantity"
                name="quantity"
                type="number"
                fullWidth
                value={newItem.quantity}
                onChange={handleChange}
              />
              <TextField
                margin="dense"
                label="Date"
                name="date"
                type="datetime-local"
                fullWidth
                value={new Date(newItem.date).toISOString().substring(0, 16)}
                onChange={handleChange}
              />
            </>
          )}
          {tabIndex === 1 && (
            <Box>
              <Camera ref={cameraRef} errorMessages={errorMessages} aspectRatio={16 / 9} />
              <Box mt={2}>
                <Button variant="contained" onClick={handleTakePhoto} style={{ marginRight: '10px' }}>
                  Take a Picture
                </Button>
                <Button variant="contained" onClick={() => fileInputRef.current?.click()}>
                  Upload a Picture
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
              </Box>
              {image && <img src={image} alt="Captured or Uploaded" style={{ marginTop: '20px', width: '100%' }} />}
              <Box mt={2}>
                <Button variant="contained" onClick={handleCameraSwitch}>
                  Switch Camera
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleAdd} color="primary">
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddItemDialog;

