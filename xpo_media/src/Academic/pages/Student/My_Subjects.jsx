import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Divider,
  CircularProgress,
  Box,
} from "@mui/material";
import BookIcon from "@mui/icons-material/Book";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

// Helper to build subjectConfigurations docId
const getFlatDocId = (year, term, standard) =>
  `${year}-${term.replace(/\s+/g, "_")}-${standard}`;

const DEFAULT_TERM = "Term One"; // You can make this dynamic if you want

const My_Subjects = () => {
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStudentAndSubjects = async () => {
      setLoading(true);
      setError("");
      try {
        // 1. Get current user
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) {
          setError("Not logged in");
          setLoading(false);
          return;
        }

        // 2. Get user doc to find studentId
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (!userDoc.exists()) {
          setError("User profile not found");
          setLoading(false);
          return;
        }
        const { studentId } = userDoc.data();

        // 3. Query students_admission to get student details
        const q = query(
          collection(db, "students_admission"),
          where("studentID", "==", studentId)
        );
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          setError("Student admission record not found");
          setLoading(false);
          return;
        }
        const studentData = querySnapshot.docs[0].data();
        setStudentInfo(studentData);

        // 4. Build docId for subjectConfigurations
        const { academicYear, standard } = studentData;
        const docId = getFlatDocId(academicYear, DEFAULT_TERM, standard);

        // 5. Fetch subjects from subjectConfigurations
        const subjDoc = await getDoc(doc(db, "subjectConfigurations", docId));
        if (subjDoc.exists()) {
          setSubjects(subjDoc.data().subjects || []);
        } else {
          setSubjects([]);
        }
      } catch (err) {
        setError("Error fetching data: " + err.message);
      }
      setLoading(false);
    };

    fetchStudentAndSubjects();
  }, []);

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Container maxWidth={false} sx={{ px: 3, py: 3 }}>
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      </Container>
    );

  return (
    <Container maxWidth={false} sx={{ px: 3, py: 3 }}>
      <Typography variant="h5" gutterBottom>
        My Subjects
      </Typography>
      {studentInfo && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1">
            Name: <b>{studentInfo.fullName}</b>
          </Typography>
          <Typography variant="subtitle1">
            Standard: <b>{studentInfo.standard}</b>
          </Typography>
          <Typography variant="subtitle1">
            Section: <b>{studentInfo.section}</b>
          </Typography>
          <Typography variant="subtitle1">
            Academic Year: <b>{studentInfo.academicYear}</b>
          </Typography>
        </Box>
      )}
      {subjects.length === 0 ? (
        <Typography color="text.secondary">No subjects found for your standard.</Typography>
      ) : (
        <List sx={{ bgcolor: "background.paper", borderRadius: 2, boxShadow: 1 }}>
          {subjects.map((subject, idx) => (
            <React.Fragment key={idx}>
              <ListItem alignItems="flex-start">
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: "primary.main" }}>
                    <BookIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography fontWeight="bold" variant="h6">
                      {subject}
                    </Typography>
                  }
                />
              </ListItem>
              {idx !== subjects.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Container>
  );
};

export default My_Subjects;
