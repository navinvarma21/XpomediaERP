

const ACADEMIC_YEARS_COLLECTION = "academicYears";

// ✅ Utility: Generate readable ID (e.g., "2025-2026")
const generateYearId = (startDate, endDate) => {
  const start = new Date(startDate).getFullYear();
  const end = new Date(endDate).getFullYear();
  return `${start}-${end}`;
};

// ✅ CREATE
export const createAcademicYear = async (data) => {
  try {
    const id = generateYearId(data.startDate, data.endDate);
    const docRef = doc(db, ACADEMIC_YEARS_COLLECTION, id);
    const existing = await getDoc(docRef);

    if (existing.exists()) {
      throw new Error("Academic year already exists");
    }

    // If status is active, deactivate other years
    if (data.status === "active") {
      await deactivateOtherYears();
    }

    // Create new academic year
    await setDoc(docRef, {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    });

    return id;
  } catch (error) {
    console.error("Error creating academic year:", error);
    throw error; // Rethrow or handle as needed
  }
};

// ✅ READ: All academic years
export const getAcademicYears = async () => {
  try {
    const snapshot = await getDocs(collection(db, ACADEMIC_YEARS_COLLECTION));
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching academic years:", error);
    throw error; // Rethrow or handle as needed
  }
};

// ✅ READ: Single academic year by ID
export const getAcademicYearById = async (id) => {
  try {
    const docRef = doc(db, ACADEMIC_YEARS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error("Academic year not found");
    }

    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error(`Error fetching academic year with ID ${id}:`, error);
    throw error; // Rethrow or handle as needed
  }
};

// ✅ UPDATE
export const updateAcademicYear = async (id, updatedData) => {
  try {
    const docRef = doc(db, ACADEMIC_YEARS_COLLECTION, id);

    // If status is active, deactivate other years
    if (updatedData.status === "active") {
      await deactivateOtherYears();
    }

    await updateDoc(docRef, updatedData);
  } catch (error) {
    console.error("Error updating academic year:", error);
    throw error; // Rethrow or handle as needed
  }
};

// ✅ DELETE
export const deleteAcademicYear = async (id) => {
  try {
    const docRef = doc(db, ACADEMIC_YEARS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting academic year:", error);
    throw error; // Rethrow or handle as needed
  }
};

// ✅ Deactivate all other active years (helper)
const deactivateOtherYears = async () => {
  try {
    const snapshot = await getDocs(collection(db, ACADEMIC_YEARS_COLLECTION));

    const updates = snapshot.docs.map(async (docSnap) => {
      if (docSnap.data().status === "active") {
        const docRef = doc(db, ACADEMIC_YEARS_COLLECTION, docSnap.id);
        await updateDoc(docRef, { status: "inactive" });
      }
    });

    await Promise.all(updates); // Ensure all updates are done in parallel
  } catch (error) {
    console.error("Error deactivating other years:", error);
    throw error; // Rethrow or handle as needed
  }
};
