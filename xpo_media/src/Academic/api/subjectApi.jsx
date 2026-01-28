

// ✅ Get subjects for a specific standard (flat structure)
export const getSubjects = async (standard) => {
  try {
    const q = query(collection(db, "subjects"), where("standard", "==", standard));
    const snapshot = await getDocs(q);
    console.log(`Fetched subjects for standard: ${standard}`);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return [];
  }
};

// ✅ Add a subject (flat structure)
export const addSubject = async (standard, subject) => {
  try {
    const newSubject = { ...subject, standard };
    await addDoc(collection(db, "subjects"), newSubject);
    console.log("Subject added:", newSubject);
  } catch (error) {
    console.error("Error adding subject:", error);
  }
};

// ✅ Update subject
export const updateSubject = async (id, updatedData) => {
  try {
    const ref = doc(db, "subjects", id);
    await updateDoc(ref, updatedData);
    console.log(`Subject ${id} updated`);
  } catch (error) {
    console.error("Error updating subject:", error);
  }
};

// ✅ Delete subject
export const deleteSubject = async (id) => {
  try {
    const ref = doc(db, "subjects", id);
    await deleteDoc(ref);
    console.log(`Subject ${id} deleted`);
  } catch (error) {
    console.error("Error deleting subject:", error);
  }
};

// ✅ Get subject configuration for a specific academic year, term, and standard
export const getSubjectConfig = async (academicYear, term, standard) => {
  try {
    const docId = `${academicYear}_${term}_${standard}`;
    const docRef = doc(db, "subjectConfigurations", docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.warn(`No subject config found for: ${docId}`);
    }

    return { subjects: [] };
  } catch (error) {
    console.error("Error fetching subject config:", error);
    return { subjects: [] };
  }
};


// ✅ Get list of standards (top-level documents in "students")
export const getStandards = async () => {
  try {
    const standardsSnap = await getDocs(collection(db, "students"));
    return standardsSnap.docs.map(doc => doc.id);
  } catch (error) {
    console.error("Error fetching standards from students collection:", error);
    return [];
  }
};

// ✅ Get students by standard
export const getStudentsByStandard = async (standard) => {
  try {
    const studentsSnap = await getDocs(collection(db, "students", standard, "students"));
    return studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error(`Error fetching students for standard ${standard}:`, error);
    return [];
  }
};

// ✅ Ensure standard doc has 'subjects' array initialized
export const initializeStandardSubjects = async (academicYear, term, standard) => {
  try {
    const standardRef = doc(db, "academicYears", academicYear, "terms", term, "standards", standard);
    await setDoc(standardRef, { subjects: [] }, { merge: true });
    console.log(`Initialized subjects array for ${standard}`);
  } catch (error) {
    console.error("Error initializing standard subjects:", error);
  }
};

// Fetch all academic years
export const getAcademicYears = async () => {
  try {
    const snap = await getDocs(collection(db, "academicYears"));
    return snap.docs.map(doc => doc.id);
  } catch (error) {
    console.error("Error fetching academic years:", error);
    return [];
  }
};

// Fetch all terms for a given academic year
export const getTermsForYear = async (academicYear) => {
  try {
    const snap = await getDocs(collection(db, "academicYears", academicYear, "terms"));
    return snap.docs.map(doc => doc.id);
  } catch (error) {
    console.error("Error fetching terms:", error);
    return [];
  }
};

// Fetch all standards for a given academic year and term
export const getStandardsForYearTerm = async (academicYear, term) => {
  try {
    const snap = await getDocs(collection(db, "academicYears", academicYear, "terms", term, "standards"));
    return snap.docs.map(doc => doc.id);
  } catch (error) {
    console.error("Error fetching standards:", error);
    return [];
  }
};

// Fetch subjects for a standard (from nested structure)
export const getSubjectsForStandard = async (academicYear, term, standard) => {
  try {
    const standardRef = doc(
      db,
      "academicYears",
      academicYear,
      "terms",
      term,
      "standards",
      standard
    );
    const docSnap = await getDoc(standardRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.subjects || [];
    } else {
      console.warn(`No document found for standard ${standard}`);
      return [];
    }
  } catch (error) {
    console.error("Error fetching subjects for standard:", error);
    return [];
  }
};




export const listenSubjectsForStandard = (academicYear, term, standard, callback) => {
  const standardRef = doc(
    db,
    "academicYears",
    academicYear,
    "terms",
    term,
    "standards",
    standard
  );
  return onSnapshot(standardRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data().subjects || []);
    } else {
      callback([]);
    }
  });
};