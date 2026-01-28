

// Add student and ensure parent docs exist
export const addStudent = async (student) => {
  const { standard, section, fullName, studentID } = student;
  if (!standard || !section || !fullName) throw new Error("Standard, Section, and Full Name are required");
  if (!studentID) throw new Error("studentID is required (must be fetched from users collection)");

  // 1. Ensure standard doc exists
  await setDoc(
    doc(db, "students admission", standard),
    { createdAt: new Date().toISOString() },
    { merge: true }
  );

  // 2. Ensure session doc exists
  await setDoc(
    doc(db, "students admission", standard, "sessions", section),
    { createdAt: new Date().toISOString() },
    { merge: true }
  );

  // 3. Add the student doc
  await setDoc(
    doc(db, "students admission", standard, "sessions", section, "students", studentID),
    { ...student, studentID }
  );

  return studentID;
};

// Update student
export const updateStudent = async (standard, section, studentID, student) => {
  await updateDoc(
    doc(db, "students admission", standard, "sessions", section, "students", studentID),
    student
  );
};

// Delete student
export const deleteStudent = async (standard, section, studentID) => {
  await deleteDoc(
    doc(db, "students admission", standard, "sessions", section, "students", studentID)
  );
};

// Get a student by standard, section, and studentID
export const getStudent = async (standard, section, studentID) => {
  const docRef = doc(db, "students admission", standard, "sessions", section, "students", studentID);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
};

// Get all standards (classes)
export const getAllStandards = async () => {
  const standardsSnap = await getDocs(collection(db, "students admission"));
  return standardsSnap.docs.map(doc => doc.id);
};

// Get all sessions/sections for a standard
export const getSessionsByStandard = async (standard) => {
  const sessionsSnap = await getDocs(collection(db, "students admission", standard, "sessions"));
  return sessionsSnap.docs.map(doc => doc.id);
};

// Get all students for a standard and section
export const getStudentsByStandardAndSection = async (standard, section) => {
  const studentsSnap = await getDocs(
    collection(db, "students admission", standard, "sessions", section, "students")
  );
  return studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
