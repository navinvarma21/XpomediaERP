const workerFunction = function() {
  const self = this;

  self.onmessage = function(e) {
    const { timetableData, settings } = e.data;

    // Input Validation
    if (!timetableData.classes?.length || !timetableData.teachers?.length || !timetableData.days?.length) {
      self.postMessage({ type: 'result', error: 'Missing required timetable data' });
      return;
    }
    if (!settings.maxTeacherPeriodsPerDay || !settings.minBreakBetweenClasses || !settings.maxConsecutivePeriods) {
      self.postMessage({ type: 'result', error: 'Missing required settings' });
      return;
    }

    const nonBreakPeriods = timetableData.periods.filter(p => p.type !== 'break');

    // Constraint Satisfaction (Simplified AC-3-like Pre-processing)
    const revise = (var1, var2, constraints) => {
      let revised = false;
      const domain1 = var1.availability[var2.day] || [];
      const newDomain = domain1.map((avail, idx) => avail && constraints.every(c => c(var1, var2, idx)));
      if (JSON.stringify(newDomain) !== JSON.stringify(domain1)) {
        var1.availability[var2.day] = newDomain;
        revised = true;
      }
      return revised;
    };

    const ac3 = () => {
      const queue = [];
      timetableData.teachers.forEach(t => timetableData.classes.forEach(c => queue.push({ var1: t, var2: c })));
      while (queue.length) {
        const { var1, var2 } = queue.shift();
        const constraints = [(t, c, idx) => t.availability[var2.day][idx] && c.availability[var2.day][idx]];
        if (revise(var1, var2, constraints)) {
          timetableData.teachers.forEach(t2 => {
            if (t2 !== var1) queue.push({ var1: t2, var2: var1 });
          });
        }
      }
    };
    ac3();

    const canScheduleLesson = (lesson, group, day, periodIndex, timetable) => {
      const teacher = group ? group.teachers[0] : lesson.teacherNames[0];
      const subject = group ? group.subjects[0] : lesson.subjectNames[0];
      const room = group?.room;

      for (let i = 0; i < lesson.lessonLength; i++) {
        if (periodIndex + i >= nonBreakPeriods.length) return false;
        const teacherData = timetableData.teachers.find(t => t.name === teacher);
        if (!teacherData?.availability[day][periodIndex + i]) return false;
        for (const className of lesson.classNames) {
          const classData = timetableData.classes.find(c => c.name === className);
          if (!classData?.availability[day][periodIndex + i]) return false;
        }
        if (room) {
          const roomData = timetableData.rooms.find(r => r.name === room);
          if (!roomData?.availability[day][periodIndex + i]) return false;
        }
        for (const className of lesson.classNames) {
          if (timetable[className]?.[day]?.[periodIndex + i]) return false;
        }
      }
      return true;
    };

    const initializePopulation = (populationSize) => {
      const population = [];
      for (let i = 0; i < populationSize; i++) {
        const timetable = {};
        timetableData.classes.forEach(cls => {
          timetable[cls.name] = {};
          timetableData.days.forEach(day => {
            timetable[cls.name][day] = Array(nonBreakPeriods.length).fill(null);
          });
        });
        const lessonsCopy = [...timetableData.lessons];
        shuffleArray(lessonsCopy);
        for (const lesson of lessonsCopy) {
          let assigned = 0;
          let attempts = 0;
          const maxAttempts = 50;
          while (assigned < lesson.periodsPerWeek && attempts < maxAttempts) {
            const day = timetableData.days[Math.floor(Math.random() * timetableData.days.length)];
            const periodIndex = Math.floor(Math.random() * (nonBreakPeriods.length - lesson.lessonLength + 1));
            const group = lesson.splitGroups ? lesson.splitGroups[Math.floor(Math.random() * lesson.splitGroups.length)] : null;
            if (canScheduleLesson(lesson, group, day, periodIndex, timetable)) {
              for (const className of lesson.classNames) {
                for (let i = 0; i < lesson.lessonLength; i++) {
                  timetable[className][day][periodIndex + i] = {
                    subject: group ? group.subjects[0] : lesson.subjectNames[0],
                    teacher: group ? group.teachers[0] : lesson.teacherNames[0],
                    room: group?.room || null,
                    color: getSubjectColor(group ? group.subjects[0] : lesson.subjectNames[0]),
                    group: group?.name || null,
                    lessonLength: lesson.lessonLength,
                  };
                }
              }
              assigned++;
            }
            attempts++;
          }
        }
        population.push(timetable);
      }
      return population;
    };

    const calculateFitness = (timetable) => {
      let fitness = 0;
      const teacherLoads = {};
      const classLoads = {};
      const teacherAssignments = {};
      const roomAssignments = {};
      const classConsecutivePeriods = {};

      timetableData.teachers.forEach(teacher => {
        teacherLoads[teacher.name] = 0;
        teacherAssignments[teacher.name] = {};
        timetableData.days.forEach(day => {
          teacherAssignments[teacher.name][day] = Array(nonBreakPeriods.length).fill(null);
        });
      });

      timetableData.classes.forEach(cls => {
        classLoads[cls.name] = 0;
        classConsecutivePeriods[cls.name] = {};
        timetableData.days.forEach(day => {
          classConsecutivePeriods[cls.name][day] = Array(nonBreakPeriods.length).fill(0);
        });
      });

      timetableData.rooms.forEach(room => {
        roomAssignments[room.name] = {};
        timetableData.days.forEach(day => {
          roomAssignments[room.name][day] = Array(nonBreakPeriods.length).fill(null);
        });
      });

      Object.keys(timetable).forEach(className => {
        timetableData.days.forEach(day => {
          let currentSubject = null;
          let consecutiveCount = 0;
          nonBreakPeriods.forEach((_, pIndex) => {
            const item = timetable[className][day][pIndex];
            if (item) {
              teacherLoads[item.teacher] = (teacherLoads[item.teacher] || 0) + 1;
              classLoads[className] = (classLoads[className] || 0) + 1;
              if (teacherAssignments[item.teacher][day][pIndex]) {
                fitness += 100;
              } else {
                teacherAssignments[item.teacher][day][pIndex] = className;
              }
              if (item.room) {
                if (roomAssignments[item.room][day][pIndex]) {
                  fitness += 50;
                } else {
                  roomAssignments[item.room][day][pIndex] = className;
                }
              }
              if (item.subject === currentSubject) {
                consecutiveCount++;
                if (consecutiveCount > settings.maxConsecutivePeriods) {
                  fitness += 20 * (consecutiveCount - settings.maxConsecutivePeriods);
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
            fitness += 30 * (periodsTaught - settings.maxTeacherPeriodsPerDay);
          }
        });
      });

      const vacantSlots = Object.values(timetable).reduce((acc, classSchedule) => acc + timetableData.days.reduce((dayAcc, day) => dayAcc + nonBreakPeriods.reduce((periodAcc, _, pIndex) => periodAcc + (classSchedule[day][pIndex] ? 0 : 1), 0), 0), 0);
      fitness += vacantSlots * 5;

      const teacherVariance = variance(Object.values(teacherLoads));
      const classVariance = variance(Object.values(classLoads));
      fitness += (teacherVariance + classVariance) * 10; // Penalty for uneven distribution

      return fitness;

      function variance(arr) {
        const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
        return arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length || 0;
      }
    };

    function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    }

    function getSubjectColor(subjectName) {
      const subject = timetableData.subjects.find(s => s.name === subjectName);
      return subject?.color || '#ffffff';
    }

    const generateTimetable = () => {
      const { populationSize, generations, mutationRate, eliteSize } = settings;
      let population = initializePopulation(populationSize);
      let bestFitness = Infinity;
      let bestTimetable = null;
      let stats = { generation: 0, bestFitnessHistory: [], averageFitnessHistory: [] };

      for (let generation = 0; generation < generations; generation++) {
        stats.generation = generation;

        if (generation % 1 === 0) {
          self.postMessage({ type: 'progress', progress: (generation / generations) * 100, stats });
        }

        const populationWithFitness = population.map(timetable => ({
          timetable,
          fitness: calculateFitness(timetable),
        }));

        populationWithFitness.sort((a, b) => a.fitness - b.fitness);

        if (populationWithFitness[0].fitness < bestFitness) {
          bestFitness = populationWithFitness[0].fitness;
          bestTimetable = JSON.parse(JSON.stringify(populationWithFitness[0].timetable));
        }

        const averageFitness = populationWithFitness.reduce((sum, item) => sum + item.fitness, 0) / populationSize;
        stats.bestFitnessHistory.push(bestFitness);
        stats.averageFitnessHistory.push(averageFitness);

        if (bestFitness <= 0) break;

        const newPopulation = [];
        for (let i = 0; i < eliteSize; i++) {
          newPopulation.push(populationWithFitness[i].timetable);
        }

        while (newPopulation.length < populationSize) {
          const parent1 = populationWithFitness[Math.floor(Math.random() * eliteSize * 2)].timetable;
          const parent2 = populationWithFitness[Math.floor(Math.random() * eliteSize * 2)].timetable;
          const child = { ...parent1 };

          timetableData.classes.forEach(cls => {
            if (Math.random() < 0.3) child[cls.name] = { ...parent2[cls.name] };
          });

          if (Math.random() < mutationRate) {
            const className = timetableData.classes[Math.floor(Math.random() * timetableData.classes.length)].name;
            const day = timetableData.days[Math.floor(Math.random() * timetableData.days.length)];
            // Dynamic conflict detection within mutation
            const localConflicts = detectLocalConflicts(child);
            const conflictIndex = localConflicts.findIndex(c => c.className === className && c.day === day);
            const periodIndex = conflictIndex !== -1 ? localConflicts[conflictIndex].period : Math.floor(Math.random() * nonBreakPeriods.length);
            child[className][day][periodIndex] = null;

            const classLessons = timetableData.lessons.filter(lesson => lesson.classNames.includes(className));
            if (classLessons.length > 0) {
              const lesson = classLessons[Math.floor(Math.random() * classLessons.length)];
              const group = lesson.splitGroups ? lesson.splitGroups[Math.floor(Math.random() * lesson.splitGroups.length)] : null;
              if (canScheduleLesson(lesson, group, day, periodIndex, child)) {
                for (let i = 0; i < lesson.lessonLength; i++) {
                  if (periodIndex + i < nonBreakPeriods.length) {
                    child[className][day][periodIndex + i] = {
                      subject: group ? group.subjects[0] : lesson.subjectNames[0],
                      teacher: group ? group.teachers[0] : lesson.teacherNames[0],
                      room: group?.room || null,
                      color: getSubjectColor(group ? group.subjects[0] : lesson.subjectNames[0]),
                      group: group?.name || null,
                      lessonLength: lesson.lessonLength,
                    };
                  }
                }
              }
            }
          }

          newPopulation.push(child);
        }

        population = newPopulation;
      }

      const conflicts = detectConflicts(bestTimetable);

      return { timetable: bestTimetable, conflicts, stats: { ...stats, finalFitness: bestFitness, conflictCount: conflicts.length } };
    };

    const detectLocalConflicts = (timetable) => {
      const conflicts = [];
      const teacherAssignments = {};
      const roomAssignments = {};

      timetableData.teachers.forEach(teacher => {
        teacherAssignments[teacher.name] = {};
        timetableData.days.forEach(day => {
          teacherAssignments[teacher.name][day] = Array(nonBreakPeriods.length).fill(null);
        });
      });

      timetableData.rooms.forEach(room => {
        roomAssignments[room.name] = {};
        timetableData.days.forEach(day => {
          roomAssignments[room.name][day] = Array(nonBreakPeriods.length).fill(null);
        });
      });

      Object.keys(timetable).forEach(className => {
        timetableData.days.forEach(day => {
          nonBreakPeriods.forEach((_, pIndex) => {
            const item = timetable[className][day][pIndex];
            if (item) {
              if (teacherAssignments[item.teacher][day][pIndex]) {
                conflicts.push({
                  type: 'teacher',
                  teacher: item.teacher,
                  day,
                  period: pIndex,
                  className,
                  subject: item.subject,
                  conflictWith: teacherAssignments[item.teacher][day][pIndex],
                });
              } else {
                teacherAssignments[item.teacher][day][pIndex] = className;
              }
              if (item.room) {
                if (roomAssignments[item.room][day][pIndex]) {
                  conflicts.push({
                    type: 'room',
                    room: item.room,
                    day,
                    period: pIndex,
                    className,
                    subject: item.subject,
                    conflictWith: roomAssignments[item.room][day][pIndex],
                  });
                } else {
                  roomAssignments[item.room][day][pIndex] = className;
                }
              }
            }
          });
        });
      });

      return conflicts;
    };

    const detectConflicts = (timetable) => {
      const conflicts = [];
      const teacherAssignments = {};
      const roomAssignments = {};
      const classConsecutivePeriods = {};

      timetableData.teachers.forEach(teacher => {
        teacherAssignments[teacher.name] = {};
        timetableData.days.forEach(day => {
          teacherAssignments[teacher.name][day] = Array(nonBreakPeriods.length).fill(null);
        });
      });

      timetableData.rooms.forEach(room => {
        roomAssignments[room.name] = {};
        timetableData.days.forEach(day => {
          roomAssignments[room.name][day] = Array(nonBreakPeriods.length).fill(null);
        });
      });

      timetableData.classes.forEach(cls => {
        classConsecutivePeriods[cls.name] = {};
        timetableData.days.forEach(day => {
          classConsecutivePeriods[cls.name][day] = Array(nonBreakPeriods.length).fill(0);
        });
      });

      Object.keys(timetable).forEach(className => {
        timetableData.days.forEach(day => {
          let currentSubject = null;
          let consecutiveCount = 0;
          nonBreakPeriods.forEach((_, pIndex) => {
            const item = timetable[className][day][pIndex];
            if (item) {
              if (teacherAssignments[item.teacher][day][pIndex]) {
                conflicts.push({
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
                  conflicts.push({
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
                  conflicts.push({
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
            conflicts.push({
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

      return conflicts;
    };

    const result = generateTimetable();
    self.postMessage({ type: 'result', ...result });
  };

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  function getSubjectColor(subjectName) {
    const subject = timetableData.subjects.find(s => s.name === subjectName);
    return subject?.color || '#ffffff';
  }
};

const workerCode = `(${workerFunction.toString()})();`;
const blob = new Blob([workerCode], { type: 'application/javascript' });
const workerScript = URL.createObjectURL(blob);

export default workerScript;