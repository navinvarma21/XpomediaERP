// Student Component (updated)
import React, { useEffect, useState } from "react";
import My_Subjects from "./Student/My_Subjects";

function Student() {
  const { user } = useUser();
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch student admission data
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        // 1. Get user document to find studentID
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) return;

        const studentID = userDoc.data().studentId;

        // 2. Query students_admission collection
        const q = query(
          collection(db, "students_admission"),
          where("studentId", "==", studentID)
        );

        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setStudentData(querySnapshot.docs[0].data());
        }
      } catch (error) {
        console.error("Error fetching student data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchStudentData();
  }, [user]);

  if (loading) return <div>Loading student data...</div>;
  if (!studentData) return <div>No student data found</div>;

  return (
    <div>
      {/* Student Profile Section */}
      <div className="student-profile">
        <h2>{studentData.fullName}</h2>
        <p>Standard: {studentData.standard}</p>
        <p>Section: {studentData.section}</p>
        <p>Academic Year: {studentData.academicYear}</p>
      </div>

      {/* Subjects Component */}

      <My_Subjects
        standard={studentData.standard}
        academicYear={studentData.academicYear}
      />
    </div>
  );
}

export default Student;