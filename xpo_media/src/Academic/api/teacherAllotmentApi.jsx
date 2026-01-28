

// Get all academic years
export const getAcademicYears = async () => {
  const snapshot = await getDocs(collection(db, "academicYears"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Get all terms for a given academic year
export const getTermsForYear = async (academicYear) => {
  const yearDoc = await getDoc(doc(db, "academicYears", academicYear));
  if (yearDoc.exists()) {
    return Array.isArray(yearDoc.data().terms)
      ? yearDoc.data().terms.map(t => t.name)
      : [];
  }
  return [];
};

// Get all standards for a given academic year and term
export const getStandardsForYearTerm = async (academicYear, term) => {
  const standardsRef = collection(db, "academicYears", academicYear, "terms", term, "standards");
  const snapshot = await getDocs(standardsRef);
  return snapshot.docs.map(doc => doc.id);
};

// Get subjects for a given standard
export const getSubjectsForStandard = async (academicYear, term, standard) => {
  const standardRef = doc(db, "academicYears", academicYear, "terms", term, "standards", standard);
  const docSnap = await getDoc(standardRef);
  return docSnap.exists() ? docSnap.data().subjects || [] : [];
};

// Save teacher subject allocation (one doc per teacher-year-term-standard)
// export const saveTeacherSubjectAllocation = async ({
//   academicYear,
//   term,
//   standards,
//   subjects,
//   teacherId, // <-- Use teacherId everywhere!
//   teacherName
// }) => {
//   for (const standard of standards) {
//     const docId = `${teacherId}_${academicYear}_${term}_${standard}`;
//     await setDoc(doc(db, "teacher_subject_allocation", docId), {
//       academicYear,
//       term,
//       standards: [standard],
//       subjects: Array.from(new Set(subjects)),
//       teacherId, // <-- Use teacherId
//       teacherName,
//       createdAt: new Date().toISOString()
//     }, { merge: true });
//   }
// };

// Get all teacher allocation documents
export const getAllTeacherAllocations = async () => {
  const snapshot = await getDocs(collection(db, "teacher_subject_allocation"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Get a specific teacher allocation document by ID
export const getTeacherAllocationById = async (docId) => {
  const docSnap = await getDoc(doc(db, "teacher_subject_allocation", docId));
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

// Update a teacher allocation document
export const updateTeacherAllocation = async (docId, updatedData) => {
  await updateDoc(doc(db, "teacher_subject_allocation", docId), updatedData);
};

// Delete a teacher allocation document
export const deleteTeacherAllocation = async (docId) => {
  await deleteDoc(doc(db, "teacher_subject_allocation", docId));
};

// Save teacher subject allocation (merge subjects if already exists)
export const saveTeacherSubjectAllocation = async ({
  academicYear,
  term,
  standards,
  subjects,
  teacherId,
  teacherName
}) => {
  for (const standard of standards) {
    const docId = `${teacherId}_${academicYear}_${term}_${standard}`;
    const docRef = doc(db, "teacher_subject_allocation", docId);

    // Get existing data
    const docSnap = await getDoc(docRef);
    const existingSubjects = docSnap.exists() ? docSnap.data().subjects || [] : [];

    // Merge subjects and remove duplicates
    const mergedSubjects = Array.from(new Set([...existingSubjects, ...subjects]));

    await setDoc(docRef, {
      academicYear,
      term,
      standards: [standard],
      subjects: mergedSubjects,
      teacherId,
      teacherName,
      createdAt: new Date().toISOString()
    }, { merge: true });
  }
};

