// src/api/teacherApi.js

// Add teacher
export const addTeacher = async (teacher) => {
  const { teacherId } = teacher;
  const id = teacherId || Date.now().toString();
  await setDoc(doc(db, "teachers_flat", id), { ...teacher, teacherId: id });
};

// Get all teachers
export const getTeachers = async () => {
  const teachersSnap = await getDocs(collection(db, "teachers_flat"));
  return teachersSnap.docs.map(doc => doc.data());
};

// Get teacher by teacherId
export const getTeacher = async (teacherId) => {
  const docRef = doc(db, "teachers_flat", teacherId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
};

// Update teacher
export const updateTeacher = async (teacherId, teacher) => {
  await updateDoc(doc(db, "teachers_flat", teacherId), teacher);
};

// Delete teacher
export const deleteTeacher = async (teacherId) => {
  await deleteDoc(doc(db, "teachers_flat", teacherId));
};
