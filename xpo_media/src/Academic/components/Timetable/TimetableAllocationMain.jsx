import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Snackbar,
  Alert,
  Tooltip,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Delete,
  Undo,
  Redo,
  Print,
  FileDownload,
  FileUpload,
  Settings,
  ErrorOutline,
  DarkMode,
  LightMode,
} from '@mui/icons-material';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { ThemeProvider, createTheme } from '@mui/material';
import GeneralSettings from './GeneralSettings';
import SubjectsTaught from './SubjectsTaught';
import TeachersClassrooms from './TeachersClassrooms';
import ClassesGrades from './ClassesGrades';
import Rooms from './Rooms';
import ClassLessons from './ClassLessons';
import GenerateVerify from './GenerateVerify';
import SettingsDialog from './SettingsDialog';

const TimetableAllocationMain = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [timetableData, setTimetableData] = useState(() => {
    const saved = localStorage.getItem('timetableData');
    return saved ? JSON.parse(saved) : {
      name: '',
      periods: [],
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      subjects: [],
      teachers: [],
      classes: [],
      rooms: [],
      lessons: [],
    };
  });
  const [generatedTimetable, setGeneratedTimetable] = useState({});
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({
    maxTeacherPeriodsPerDay: 6,
    minBreakBetweenClasses: 1,
    preferMorningSlots: true,
    maxConsecutivePeriods: 3,
    populationSize: 100,
    generations: 500,
    mutationRate: 0.1,
    eliteSize: 10,
  });
  const [conflicts, setConflicts] = useState([]);
  const timetableRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('timetableData', JSON.stringify(timetableData));
  }, [timetableData]);

  const theme = createTheme({
    palette: { mode: darkMode ? 'dark' : 'light' },
  });

  const steps = [
    'General Settings',
    'Subjects Taught',
    'Teachers',
    'Classes/Grades',
    'Rooms',
    'Class Lessons',
    'Generate & Verify',
  ];

  const saveToHistory = (currentState) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(currentState)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setTimetableData(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setTimetableData(history[historyIndex + 1]);
    }
  };

  const showMessage = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const updatedData = { ...data, rooms: data.rooms || data.classrooms || [], classrooms: undefined };
        setTimetableData(updatedData);
        showMessage('Data imported successfully', 'success');
      } catch (error) {
        showMessage('Failed to import data', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify({ ...timetableData, classrooms: undefined }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    saveAs(blob, `timetable-data-${new Date().toISOString().slice(0, 10)}.json`);
    showMessage('Data exported successfully', 'success');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`Timetable: ${timetableData.name}`, 10, 10);

    Object.keys(generatedTimetable).forEach((className, i) => {
      if (i > 0) doc.addPage();
      doc.text(`Class: ${className}`, 10, 20);
      const headers = ['Period', ...timetableData.days];
      const data = timetableData.periods.filter(p => p.type !== 'break').map((_, pIndex) => {
        const row = [`P${pIndex + 1}`];
        timetableData.days.forEach((day) => {
          const item = generatedTimetable[className][day][pIndex];
          row.push(item ? `${item.subject} (${item.teacher}${item.room ? `, ${item.room}` : ''})` : '');
        });
        return row;
      });
      doc.autoTable({ head: [headers], body: data, startY: 25, styles: { fontSize: 8 }, columnStyles: { 0: { cellWidth: 20 } } });
    });
    doc.save(`timetable-${timetableData.name}.pdf`);
    showMessage('PDF exported successfully', 'success');
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    Object.keys(generatedTimetable).forEach((className) => {
      const headers = ['Period', ...timetableData.days];
      const data = timetableData.periods.filter(p => p.type !== 'break').map((_, pIndex) => {
        const row = [`P${pIndex + 1}`];
        timetableData.days.forEach((day) => {
          const item = generatedTimetable[className][day][pIndex];
          row.push(item ? `${item.subject} (${item.teacher}${item.room ? `, ${item.room}` : ''})` : '');
        });
        return row;
      });
      const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
      XLSX.utils.book_append_sheet(wb, ws, className.slice(0, 31));
    });
    XLSX.writeFile(wb, `timetable-${timetableData.name}.xlsx`);
    showMessage('Excel exported successfully', 'success');
  };

  const printTimetable = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>${timetableData.name} Timetable</title><style>body{font-family:Arial;margin:20px;}h1{color:#333;}table{border-collapse:collapse;width:100%;margin-bottom:30px;}th,td{border:1px solid #ddd;padding:8px;text-align:center;}th{background-color:#f2f2f2;}.conflict{background-color:#ffcccc;}</style></head><body><h1>${timetableData.name} Timetable</h1>`);
    Object.keys(generatedTimetable).forEach((className) => {
      printWindow.document.write(`<h2>Class: ${className}</h2><table><thead><tr><th>Period</th>${timetableData.days.map(day => `<th>${day}</th>`).join('')}</tr></thead><tbody>`);
      timetableData.periods.filter(p => p.type !== 'break').forEach((_, pIndex) => {
        printWindow.document.write('<tr>');
        printWindow.document.write(`<td>P${pIndex + 1}</td>`);
        timetableData.days.forEach((day) => {
          const item = generatedTimetable[className][day][pIndex];
          const isConflict = conflicts.some(c => c.day === day && c.period === pIndex && c.className === className);
          printWindow.document.write(`<td${isConflict ? ' class="conflict"' : ''}>${item ? `${item.subject}<br>(${item.teacher}${item.room ? `, ${item.room}` : ''})` : ''}</td>`);
        });
        printWindow.document.write('</tr>');
      });
      printWindow.document.write('</tbody></table>');
    });
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  const detectConflicts = () => {
    const newConflicts = [];
    const teacherAssignments = {};
    const roomAssignments = {};

    timetableData.teachers.forEach(teacher => {
      teacherAssignments[teacher.name] = {};
      timetableData.days.forEach(day => {
        teacherAssignments[teacher.name][day] = Array(timetableData.periods.filter(p => p.type !== 'break').length).fill(false);
      });
    });

    timetableData.rooms.forEach(room => {
      roomAssignments[room.name] = {};
      timetableData.days.forEach(day => {
        roomAssignments[room.name][day] = Array(timetableData.periods.filter(p => p.type !== 'break').length).fill(false);
      });
    });

    Object.keys(generatedTimetable).forEach((className) => {
      timetableData.days.forEach((day) => {
        timetableData.periods.filter(p => p.type !== 'break').forEach((_, pIndex) => {
          const item = generatedTimetable[className][day][pIndex];
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

    setConflicts(newConflicts);
    return newConflicts;
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: darkMode ? 1 : 3, backgroundColor: theme.palette.background.default, minHeight: '100vh' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: darkMode ? 'wrap' : 'nowrap', gap: 2 }}>
          <Typography variant={darkMode ? 'h5' : 'h4'}>{timetableData.name || 'Timetable Allocation'}</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Tooltip title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              <IconButton onClick={() => setDarkMode(!darkMode)}>{darkMode ? <LightMode /> : <DarkMode />}</IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton onClick={() => setSettingsOpen(true)}><Settings /></IconButton>
            </Tooltip>
            <Tooltip title="Undo">
              <span><IconButton onClick={handleUndo} disabled={historyIndex <= 0}><Undo /></IconButton></span>
            </Tooltip>
            <Tooltip title="Redo">
              <span><IconButton onClick={handleRedo} disabled={historyIndex >= history.length - 1}><Redo /></IconButton></span>
            </Tooltip>
            <Tooltip title="Import Data">
              <span><IconButton component="label"><FileUpload /><input type="file" hidden accept=".json" onChange={handleImport} /></IconButton></span>
            </Tooltip>
            <Tooltip title="Export Data">
              <IconButton onClick={handleExport}><FileDownload /></IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Paper sx={{ p: 2, mb: 3 }}>
          <Stepper activeStep={activeStep} orientation={darkMode ? 'vertical' : 'horizontal'}>
            {steps.map((label, index) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
          </Stepper>
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>
        ) : (
          <>
            {activeStep === 0 && <GeneralSettings timetableData={timetableData} setTimetableData={setTimetableData} setActiveStep={setActiveStep} saveToHistory={saveToHistory} showMessage={showMessage} />}
            {activeStep === 1 && <SubjectsTaught timetableData={timetableData} setTimetableData={setTimetableData} setActiveStep={setActiveStep} saveToHistory={saveToHistory} showMessage={showMessage} />}
            {activeStep === 2 && <TeachersClassrooms timetableData={timetableData} setTimetableData={setTimetableData} setActiveStep={setActiveStep} saveToHistory={saveToHistory} showMessage={showMessage} />}
            {activeStep === 3 && <ClassesGrades timetableData={timetableData} setTimetableData={setTimetableData} setActiveStep={setActiveStep} saveToHistory={saveToHistory} showMessage={showMessage} />}
            {activeStep === 4 && <Rooms timetableData={timetableData} setTimetableData={setTimetableData} setActiveStep={setActiveStep} saveToHistory={saveToHistory} showMessage={showMessage} />}
            {activeStep === 5 && <ClassLessons timetableData={timetableData} setTimetableData={setTimetableData} setActiveStep={setActiveStep} saveToHistory={saveToHistory} showMessage={showMessage} />}
            {activeStep === 6 && <GenerateVerify timetableData={timetableData} generatedTimetable={generatedTimetable} setGeneratedTimetable={setGeneratedTimetable} setActiveStep={setActiveStep} saveToHistory={saveToHistory} showMessage={showMessage} conflicts={conflicts} setConflicts={setConflicts} detectConflicts={detectConflicts} printTimetable={printTimetable} exportToPDF={exportToPDF} exportToExcel={exportToExcel} settings={settings} />}
          </>
        )}

        <SettingsDialog settings={settings} setSettings={setSettings} settingsOpen={settingsOpen} setSettingsOpen={setSettingsOpen} showMessage={showMessage} />

        <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default TimetableAllocationMain;