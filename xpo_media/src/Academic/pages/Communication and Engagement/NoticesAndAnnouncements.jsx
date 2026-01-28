import React, { useState } from 'react';
import { Grid, Typography, TextField, Button, FormControl, InputLabel, Select, MenuItem, Card, CardContent } from '@mui/material';

const NoticesAndAnnouncements = () => {
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [announcements, setAnnouncements] = useState([]);

  // Sample categories - replace with actual data as needed
  const categories = ['General', 'Academic', 'Events', 'Urgent'];

  const handleSubmit = () => {
    if (title && description && category) {
      setAnnouncements([...announcements, { id: Date.now(), category, title, description }]);
      setCategory('');
      setTitle('');
      setDescription('');
    }
  };

  return (
    <Grid container spacing={2} direction="column" alignItems="center" justifyContent="center" style={{ padding: '20px' }}>
      <Typography variant="h5" gutterBottom>
        Notices and Announcements
      </Typography>

      <FormControl fullWidth variant="outlined" margin="normal">
        <InputLabel id="category-label">Category</InputLabel>
        <Select
          labelId="category-label"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          label="Category"
        >
          {categories.map((cat) => (
            <MenuItem key={cat} value={cat}>
              {cat}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth variant="outlined" margin="normal">
        <TextField
          id="title"
          label="Announcement Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          variant="outlined"
        />
      </FormControl>

      <FormControl fullWidth variant="outlined" margin="normal">
        <TextField
          id="description"
          label="Announcement Description"
          multiline
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          variant="outlined"
        />
      </FormControl>

      <Button variant="contained" color="primary" onClick={handleSubmit} style={{ marginTop: '16px' }}>
        Post Announcement
      </Button>

      <Grid container spacing={2} style={{ marginTop: '20px' }}>
        {announcements.map((announcement) => (
          <Grid item xs={12} key={announcement.id}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6">{announcement.title}</Typography>
                <Typography color="textSecondary" gutterBottom>
                  Category: {announcement.category}
                </Typography>
                <Typography variant="body2">{announcement.description}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Grid>
  );
};

export default NoticesAndAnnouncements;