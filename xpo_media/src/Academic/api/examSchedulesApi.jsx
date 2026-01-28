// src/api/examSchedulesApi.js


export const saveExamSchedules = async (schedules, context) => {
  // context: { academicYear, term, standard }
  const batch = schedules.map((schedule) =>
    addDoc(collection(db, 'examSchedules'), {
      academicYear: context.academicYear,
      term: context.term,
      standard: context.standard,
      ...schedule,
      createdAt: new Date(),
    })
  );
  await Promise.all(batch);
};
