

const EXAM_TYPE_COLLECTION = "exam_types";

// CREATE with custom, sanitized ID
export const addExamType = async (label) => {
  // Sanitize: only letters, numbers, and underscores
  const id = label.replace(/[^a-zA-Z0-9_]/g, "_");
  const docRef = doc(db, EXAM_TYPE_COLLECTION, id);
  await setDoc(docRef, { label });
  return { id, label };
};

// READ
export const getExamTypes = async () => {
  const snapshot = await getDocs(collection(db, EXAM_TYPE_COLLECTION));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// UPDATE
export const updateExamType = async (id, label) => {
  const docRef = doc(db, EXAM_TYPE_COLLECTION, id);
  await updateDoc(docRef, { label });
  return { id, label };
};

// DELETE
export const deleteExamType = async (id) => {
  await deleteDoc(doc(db, EXAM_TYPE_COLLECTION, id));
};

