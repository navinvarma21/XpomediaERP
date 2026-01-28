import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControlLabel, Switch } from '@mui/material';

const SettingsDialog = ({ settings, setSettings, settingsOpen, setSettingsOpen, showMessage }) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    setSettings(localSettings);
    setSettingsOpen(false);
    showMessage('Settings saved successfully', 'success');
  };

  return (
    <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Timetable Settings</DialogTitle>
      <DialogContent>
        <TextField
          label="Max Teacher Periods Per Day"
          type="number"
          value={localSettings.maxTeacherPeriodsPerDay}
          onChange={(e) => setLocalSettings({ ...localSettings, maxTeacherPeriodsPerDay: parseInt(e.target.value) || 6 })}
          fullWidth
          margin="normal"
          inputProps={{ min: 1 }}
        />
        <TextField
          label="Min Break Between Classes (Periods)"
          type="number"
          value={localSettings.minBreakBetweenClasses}
          onChange={(e) => setLocalSettings({ ...localSettings, minBreakBetweenClasses: parseInt(e.target.value) || 1 })}
          fullWidth
          margin="normal"
          inputProps={{ min: 0 }}
        />
        <TextField
          label="Max Consecutive Periods"
          type="number"
          value={localSettings.maxConsecutivePeriods}
          onChange={(e) => setLocalSettings({ ...localSettings, maxConsecutivePeriods: parseInt(e.target.value) || 3 })}
          fullWidth
          margin="normal"
          inputProps={{ min: 1 }}
        />
        <FormControlLabel
          control={<Switch checked={localSettings.preferMorningSlots} onChange={(e) => setLocalSettings({ ...localSettings, preferMorningSlots: e.target.checked })} />}
          label="Prefer Morning Slots"
        />
        <TextField
          label="Population Size"
          type="number"
          value={localSettings.populationSize}
          onChange={(e) => setLocalSettings({ ...localSettings, populationSize: parseInt(e.target.value) || 100 })}
          fullWidth
          margin="normal"
          inputProps={{ min: 10 }}
        />
        <TextField
          label="Generations"
          type="number"
          value={localSettings.generations}
          onChange={(e) => setLocalSettings({ ...localSettings, generations: parseInt(e.target.value) || 500 })}
          fullWidth
          margin="normal"
          inputProps={{ min: 10 }}
        />
        <TextField
          label="Mutation Rate (0-1)"
          type="number"
          value={localSettings.mutationRate}
          onChange={(e) => setLocalSettings({ ...localSettings, mutationRate: parseFloat(e.target.value) || 0.1 })}
          fullWidth
          margin="normal"
          inputProps={{ min: 0, max: 1, step: 0.1 }}
        />
        <TextField
          label="Elite Size"
          type="number"
          value={localSettings.eliteSize}
          onChange={(e) => setLocalSettings({ ...localSettings, eliteSize: parseInt(e.target.value) || 10 })}
          fullWidth
          margin="normal"
          inputProps={{ min: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setSettingsOpen(false)}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsDialog;