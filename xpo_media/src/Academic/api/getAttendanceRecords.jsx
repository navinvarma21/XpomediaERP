

/**
 * Fetch attendance records for a given year, term, standard, and session.
 * Returns an array of attendance records with date and student details.
 */
export async function getAttendanceRecords(year, term, standard, session) {
  if (!year || !term || !standard || !session) return [];

  // Get all dates under the attendance path
  const attendanceRef = collection(
    db,
    "attendance",
    year.trim(),
    term.trim()
  );
  const dateSnapshots = await getDocs(attendanceRef);

  let allRecords = [];
  for (const dateDoc of dateSnapshots.docs) {
    const dateKey = dateDoc.id;
    const recordsRef = collection(
      db,
      "attendance",
      year.trim(),
      term.trim(),
      dateKey,
      standard.trim(),
      session.trim(),
      "records"
    );
    const recordsSnap = await getDocs(recordsRef);
    recordsSnap.forEach(docSnap => {
      allRecords.push({
        ...docSnap.data(),
        id: docSnap.id,
        date: dateKey,
      });
    });
  }
  return allRecords;
}
