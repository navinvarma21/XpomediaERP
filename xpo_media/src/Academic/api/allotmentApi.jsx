

// Save teacher subject allotment
export const saveAllotment = async ({
  academicYear,
  teacherName,
  teacherID,
  standards,
  subjects,
  sections = [],
}) => {
  const docRef = doc(
    db,
    "teacher_subject_allotment",
    academicYear,
    `${teacherName}_${teacherID}`
  );
  await setDoc(docRef, {
    teacherId: teacherID,
    teacherName,
    academicYear,
    standards,
    subjects,
    sections,
    assignedAt: new Date().toISOString(),
  });
};
