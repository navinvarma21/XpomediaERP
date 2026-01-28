import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  LinearProgress,
  Alert,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add,
  Print,
  FileDownload,
  ErrorOutline,
  Undo,
  Redo,
  SwapHoriz,
  AutoFixHigh,
  Dashboard,
  Info,
  Close,
} from '@mui/icons-material';
import workerScript from './timetableWorker.js';

const GenerateVerify = ({
  timetableData,
  generatedTimetable,
  setGeneratedTimetable,
  setActiveStep,
  showMessage,
  conflicts,
  setConflicts,
  printTimetable,
  exportToPDF,
  exportToExcel,
  settings,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [workerStatus, setWorkerStatus] = useState('idle');
  const [generationStats, setGenerationStats] = useState(null);
  const [viewMode, setViewMode] = useState('timetable');
  const [selectedClass, setSelectedClass] = useState('');
  const [quickFixDialog, setQuickFixDialog] = useState(false);
  const workerRef = useRef(null);

  const startGeneration = () => {
    if (!timetableData.classes.length || !timetableData.teachers.length || !timetableData.days.length) {
      showMessage('Missing required timetable data', 'error');
      return;
    }
    setIsGenerating(true);
    setGenerationProgress(0);
    setWorkerStatus('running');
    setGenerationStats(null);

    workerRef.current = new Worker(workerScript);

    workerRef.current.onmessage = (event) => {
      if (event.data.type === 'progress') {
        setGenerationProgress(event.data.progress);
        setGenerationStats(event.data.stats);
      } else if (event.data.type === 'result') {
        setGeneratedTimetable(event.data.timetable);
        setConflicts(event.data.conflicts);
        setGenerationStats(event.data.stats);
        setIsGenerating(false);
        setWorkerStatus('completed');
        if (event.data.conflicts.length === 0) {
          showMessage('Timetable generated successfully!', 'success');
        } else {
          showMessage(`Timetable generated with ${event.data.conflicts.length} conflicts`, 'warning');
        }
        workerRef.current.terminate();
      } else if (event.data.error) {
        showMessage(`Generation failed: ${event.data.error}`, 'error');
        setIsGenerating(false);
        setWorkerStatus('error');
        workerRef.current.terminate();
      }
    };

    workerRef.current.onerror = (error) => {
      showMessage(`Generation failed: ${error.message}`, 'error');
      setIsGenerating(false);
      setWorkerStatus('error');
      workerRef.current.terminate();
    };

    workerRef.current.postMessage({ timetableData, settings });
  };

  const stopGeneration = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      setIsGenerating(false);
      setWorkerStatus('stopped');
      showMessage('Generation stopped', 'info');
    }
  };

  useEffect(() => {
    return () => {
      if (workerRef.current) workerRef.current.terminate();
    };
  }, []);

  const handleQuickFix = () => setQuickFixDialog(true);

  const applyQuickFix = (fixType) => {
    const newTimetable = { ...generatedTimetable };
    conflicts.filter(c => c.type === fixType).forEach(conflict => {
      if (fixType === 'teacher' && conflict.suggestion.includes('Swap')) {
        // Implement swap logic (simplified example)
        const otherClass = conflict.conflictWith;
        const otherDay = conflict.day;
        const otherPeriod = conflict.period;
        if (newTimetable[otherClass] && newTimetable[conflict.className]) {
          const temp = newTimetable[conflict.className][conflict.day][conflict.period];
          newTimetable[conflict.className][conflict.day][conflict.period] = newTimetable[otherClass][otherDay][otherPeriod];
          newTimetable[otherClass][otherDay][otherPeriod] = temp;
        }
      }
    });
    setGeneratedTimetable(newTimetable);
    setConflicts(detectConflicts(newTimetable));
    setQuickFixDialog(false);
    showMessage(`Quick fix applied for ${fixType} conflicts`, 'success');
  };

  const detectConflicts = (timetable) => {
    const newConflicts = [];
    const teacherAssignments = {};
    const roomAssignments = {};

    timetableData.teachers.forEach(teacher => {
      teacherAssignments[teacher.name] = {};
      timetableData.days.forEach(day => {
        teacherAssignments[teacher.name][day] = Array(timetableData.periods.filter(p => p.type !== 'break').length).fill(null);
      });
    });

    timetableData.rooms.forEach(room => {
      roomAssignments[room.name] = {};
      timetableData.days.forEach(day => {
        roomAssignments[room.name][day] = Array(timetableData.periods.filter(p => p.type !== 'break').length).fill(null);
      });
    });

    Object.keys(timetable).forEach(className => {
      timetableData.days.forEach(day => {
        let currentSubject = null;
        let consecutiveCount = 0;
        timetableData.periods.filter(p => p.type !== 'break').forEach((_, pIndex) => {
          const item = timetable[className][day][pIndex];
          if (item) {
            if (teacherAssignments[item.teacher][day][pIndex]) {
              newConflicts.push({
                type: 'teacher',
                teacher: item.teacher,
                day,
                period: pIndex,
                className,
                subject: item.subject,
                conflictWith: teacherAssignments[item.teacher][day][pIndex],
                suggestion: `Swap with ${teacherAssignments[item.teacher][day][pIndex]} at another slot`,
              });
            } else {
              teacherAssignments[item.teacher][day][pIndex] = className;
            }

            if (item.room) {
              if (roomAssignments[item.room][day][pIndex]) {
                newConflicts.push({
                  type: 'room',
                  room: item.room,
                  day,
                  period: pIndex,
                  className,
                  subject: item.subject,
                  conflictWith: roomAssignments[item.room][day][pIndex],
                  suggestion: `Assign a different room`,
                });
              } else {
                roomAssignments[item.room][day][pIndex] = className;
              }
            }

            if (item.subject === currentSubject) {
              consecutiveCount++;
              if (consecutiveCount > settings.maxConsecutivePeriods) {
                newConflicts.push({
                  type: 'consecutive',
                  className,
                  day,
                  period: pIndex,
                  subject: item.subject,
                  consecutiveCount,
                  maxAllowed: settings.maxConsecutivePeriods,
                  suggestion: `Space out ${consecutiveCount} consecutive periods`,
                });
              }
            } else {
              currentSubject = item.subject;
              consecutiveCount = 1;
            }
          } else {
            currentSubject = null;
            consecutiveCount = 0;
          }
        });
      });
    });

    timetableData.teachers.forEach(teacher => {
      timetableData.days.forEach(day => {
        const periodsTaught = teacherAssignments[teacher.name][day].filter(Boolean).length;
        if (periodsTaught > settings.maxTeacherPeriodsPerDay) {
          newConflicts.push({
            type: 'workload',
            teacher: teacher.name,
            day,
            periods: periodsTaught,
            maxAllowed: settings.maxTeacherPeriodsPerDay,
            suggestion: `Redistribute ${periodsTaught - settings.maxTeacherPeriodsPerDay} periods`,
          });
        }
      });
    });

    return newConflicts;
  };

  const renderClassTimetable = (className) => {
    if (!generatedTimetable[className]) return null;

    return (
      <Box sx={{ overflowX: 'auto', mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Day</TableCell>
              {timetableData.periods.filter(p => p.type !== 'break').map((_, pIndex) => <TableCell key={pIndex}>P{pIndex + 1}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {timetableData.days.map((day, dIndex) => (
              <TableRow key={dIndex}>
                <TableCell>{day}</TableCell>
                {timetableData.periods.filter(p => p.type !== 'break').map((_, pIndex) => {
                  const item = generatedTimetable[className][day][pIndex];
                  const slotConflicts = conflicts.filter(c => c.day === day && c.period === pIndex && c.className === className);
                  return (
                    <TableCell
                      key={pIndex}
                      sx={{
                        backgroundColor: slotConflicts.length > 0 ? 'error.light' : item ? item.color || 'background.default' : 'background.default',
                        minWidth: 120,
                        minHeight: 50,
                        title: slotConflicts.length > 0 ? slotConflicts.map(c => c.suggestion).join('\n') : item ? `Teacher: ${item.teacher}, Room: ${item.room || 'N/A'}` : 'Empty slot',
                      }}
                    >
                      {item && (
                        <>
                          <Typography variant="body2">{item.subject}{item.group ? ` (${item.group})` : ''}</Typography>
                          <Typography variant="caption">{item.teacher}{item.room ? `, ${item.room}` : ''}</Typography>
                          {slotConflicts.length > 0 && (
                            <Tooltip title={<Box>{slotConflicts.map((conflict, idx) => <Typography key={idx} variant="body2">{conflict.suggestion}</Typography>)}</Box>}>
                              <ErrorOutline color="error" fontSize="small" sx={{ ml: 1 }} />
                            </Tooltip>
                          )}
                        </>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    );
  };

  const renderStats = () => {
    if (!generationStats) return null;
    const filledSlots = Object.values(generatedTimetable).reduce((acc, classSchedule) => acc + timetableData.days.reduce((dayAcc, day) => dayAcc + timetableData.periods.filter(p => p.type !== 'break').reduce((periodAcc, _, pIndex) => periodAcc + (classSchedule[day][pIndex] ? 1 : 0), 0), 0), 0);
    const totalSlots = timetableData.classes.length * timetableData.days.length * timetableData.periods.filter(p => p.type !== 'break').length;

    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>Generation Statistics</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1">Fitness Progress</Typography>
              <Typography variant="body2">Final Fitness: {generationStats.finalFitness.toFixed(2)}</Typography>
              <Typography variant="body2">Conflicts: {generationStats.conflictCount}</Typography>
              <Typography variant="body2">Generations: {generationStats.generation}</Typography>
              <Typography variant="body2">Filled Slots: {filledSlots} / {totalSlots} ({((filledSlots / totalSlots) * 100).toFixed(2)}%)</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1">Performance</Typography>
              <Typography variant="body2">Best Fitness: {Math.min(...generationStats.bestFitnessHistory).toFixed(2)}</Typography>
              <Typography variant="body2">Average Fitness: {(
                generationStats.averageFitnessHistory.reduce((a, b) => a + b, 0) /
                generationStats.averageFitnessHistory.length
              ).toFixed(2)}</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderConflictSummary = () => {
    if (conflicts.length === 0) return null;
    const conflictTypes = {
      teacher: conflicts.filter(c => c.type === 'teacher').length,
      room: conflicts.filter(c => c.type === 'room').length,
      consecutive: conflicts.filter(c => c.type === 'consecutive').length,
      workload: conflicts.filter(c => c.type === 'workload').length,
    };

    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>Conflict Summary</Typography>
        <Grid container spacing={2}>
          {Object.entries(conflictTypes).map(([type, count]) => (
            <Grid item xs={6} sm={3} key={type}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="subtitle1" textTransform="capitalize">{type}</Typography>
                <Typography variant="h4" color="error">{count}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Generate & Verify Timetable</Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          onClick={startGeneration}
          disabled={isGenerating}
          startIcon={isGenerating ? <CircularProgress size={20} /> : <Add />}
        >
          {isGenerating ? 'Generating...' : 'Generate Timetable'}
        </Button>

        {isGenerating && (
          <Button variant="outlined" color="error" onClick={stopGeneration}>Stop Generation</Button>
        )}

        {conflicts.length > 0 && (
          <Button
            variant="contained"
            color="secondary"
            onClick={handleQuickFix}
            startIcon={<AutoFixHigh />}
          >
            Quick Fix Conflicts
          </Button>
        )}

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Select Class</InputLabel>
          <Select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            label="Select Class"
            disabled={Object.keys(generatedTimetable).length === 0}
          >
            <MenuItem value="">Select a class</MenuItem>
            {timetableData.classes.map((cls) => <MenuItem key={cls.name} value={cls.name}>{cls.name}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {isGenerating && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1">Generating Timetable ({workerStatus})</Typography>
          <LinearProgress variant="determinate" value={generationProgress} sx={{ mt: 1, height: 10 }} />
          <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>Progress: {Math.round(generationProgress)}%</Typography>
        </Box>
      )}

      {conflicts.length > 0 && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={handleQuickFix} startIcon={<AutoFixHigh />}>Fix Conflicts</Button>
          }
        >
          {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} detected in the timetable.
        </Alert>
      )}

      <Tabs value={viewMode} onChange={(e, newValue) => setViewMode(newValue)} sx={{ mb: 2 }}>
        <Tab label="Timetable" value="timetable" icon={<Dashboard />} />
        <Tab label="Statistics" value="stats" icon={<Info />} />
      </Tabs>

      {viewMode === 'timetable' ? (
        <>
          {selectedClass ? renderClassTimetable(selectedClass) : <Typography color="textSecondary" sx={{ mt: 2 }}>Select a class to view its timetable</Typography>}
        </>
      ) : (
        <>
          {renderStats()}
          {renderConflictSummary()}
        </>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button variant="outlined" onClick={() => setActiveStep(5)}>Back</Button>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" startIcon={<Print />} onClick={printTimetable} disabled={Object.keys(generatedTimetable).length === 0}>Print</Button>
          <Button variant="contained" startIcon={<FileDownload />} onClick={exportToPDF} disabled={Object.keys(generatedTimetable).length === 0}>Export PDF</Button>
          <Button variant="contained" startIcon={<FileDownload />} onClick={exportToExcel} disabled={Object.keys(generatedTimetable).length === 0}>Export Excel</Button>
        </Box>
      </Box>

      <Dialog open={quickFixDialog} onClose={() => setQuickFixDialog(false)}>
        <DialogTitle>Quick Fix Conflicts</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>Select the type of conflicts to fix automatically:</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Button variant="outlined" onClick={() => applyQuickFix('teacher')} startIcon={<ErrorOutline color="error" />}>
              Fix Teacher Conflicts ({conflicts.filter(c => c.type === 'teacher').length})
            </Button>
            <Button variant="outlined" onClick={() => applyQuickFix('room')} startIcon={<ErrorOutline color="error" />}>
              Fix Room Conflicts ({conflicts.filter(c => c.type === 'room').length})
            </Button>
            <Button variant="outlined" onClick={() => applyQuickFix('consecutive')} startIcon={<ErrorOutline color="error" />}>
              Fix Consecutive Periods ({conflicts.filter(c => c.type === 'consecutive').length})
            </Button>
            <Button variant="outlined" onClick={() => applyQuickFix('workload')} startIcon={<ErrorOutline color="error" />}>
              Fix Workload Issues ({conflicts.filter(c => c.type === 'workload').length})
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuickFixDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => applyQuickFix('all')}>Fix All Conflicts</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GenerateVerify;