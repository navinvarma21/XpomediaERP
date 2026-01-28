import React, { useState } from 'react';
import { Grid, Typography, TextField, Button, FormControl, InputLabel, Select, MenuItem, Card, CardContent, Box } from '@mui/material';

const CommunityManagement = () => {
  const [category, setCategory] = useState('');
  const [clubName, setClubName] = useState('');
  const [description, setDescription] = useState('');
  const [leader, setLeader] = useState('');
  const [clubs, setClubs] = useState([]);

  // Sample categories - replace with actual data as needed
  const categories = [
    'Social',
    'Service-Oriented',
    'Academic',
    'Sports',
    'Arts & Culture',
    'Technology',
    'Environmental',
    'Others'
  ];

  // Sample leaders - replace with actual data
  const leaders = ['John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Brown'];

  const handleSubmit = () => {
    if (category && clubName && description && leader) {
      const newClub = {
        id: Date.now(),
        category,
        clubName,
        description,
        leader
      };
      setClubs([...clubs, newClub]);
      // Reset form
      setCategory('');
      setClubName('');
      setDescription('');
      setLeader('');
    }
  };

  return (
    <Grid container spacing={2} direction="column" alignItems="center" justifyContent="center" style={{ padding: '20px' }}>
      <Typography variant="h5" gutterBottom>
        Community Management
      </Typography>

      <FormControl fullWidth variant="outlined" margin="normal">
        <InputLabel id="category-label">Club Category</InputLabel>
        <Select
          labelId="category-label"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          label="Club Category"
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
          id="club-name"
          label="Club Name"
          value={clubName}
          onChange={(e) => setClubName(e.target.value)}
          variant="outlined"
        />
      </FormControl>

      <FormControl fullWidth variant="outlined" margin="normal">
        <TextField
          id="description"
          label="Description"
          multiline
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          variant="outlined"
        />
      </FormControl>

      <FormControl fullWidth variant="outlined" margin="normal">
        <InputLabel id="leader-label">Club Leader</InputLabel>
        <Select
          labelId="leader-label"
          value={leader}
          onChange={(e) => setLeader(e.target.value)}
          label="Club Leader"
        >
          {leaders.map((lead) => (
            <MenuItem key={lead} value={lead}>
              {lead}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button variant="contained" color="primary" onClick={handleSubmit} style={{ marginTop: '16px' }}>
        Add Club
      </Button>

      <Grid container spacing={2} style={{ marginTop: '30px', width: '100%' }}>
        <Typography variant="h6" gutterBottom style={{ marginLeft: '16px' }}>
          Existing Clubs
        </Typography>
        {clubs.map((club) => (
          <Grid item xs={12} md={6} lg={4} key={club.id}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {club.clubName}
                </Typography>
                <Typography color="textSecondary">
                  Category: {club.category}
                </Typography>
                <Typography variant="body2" style={{ marginTop: '8px' }}>
                  {club.description}
                </Typography>
                <Typography color="textSecondary" style={{ marginTop: '8px' }}>
                  Leader: {club.leader}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Grid>
  );
};

export default CommunityManagement;