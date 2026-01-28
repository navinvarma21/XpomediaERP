import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Enquiry from '../../pages/Admission Pages/Enquiry';
import AdmissionForm from '../../pages/Admission Pages/AdmissionForm';
import StudentDetails from '../../pages/Admission Pages/StudentDetails';
import EditStudentDetails from '../../pages/Admission Pages/EditStudentDetails';
import StudentDetailsReport from '../../pages/Admission Pages/StudentDetailsReport';
import DemandReport from '../../pages/Admission Pages/DemandReport';
import SectionReplace from '../../pages/Admission Pages/SectionReplace';
import ArrearFeeUpdating from '../../pages/Admission Pages/ArrearFeeUpdating';
import BarcodeDesign from '../../pages/Admission Pages/BarcodeDesign';
import EnquiryForm from '../../pages/Admission Pages/EnquiryForm';
import StudentRegisterReport from '../../pages/Admission Pages/StudentDetaisReport.jsx/StudentRegisterReport';
import ReligionWiseReport from '../../pages/Admission Pages/StudentDetaisReport.jsx/ReligionwiseReport';
import StageWiseReport from '../../pages/Admission Pages/StudentDetaisReport.jsx/StageWiseReport';
import CategoryWiseReport from '../../pages/Admission Pages/StudentDetaisReport.jsx/CategoryWiseReport';
import RouteWiseReport from '../../pages/Admission Pages/StudentDetaisReport.jsx/RouteWiserReport';
import IndividualFullView from '../../pages/Admission Pages/StudentDetaisReport.jsx/IndividualFullView';
import CourseStudyCertificate from '../../pages/Admission Pages/StudentDetaisReport.jsx/CourseStudyCertificate';
import TypeWise from '../../pages/Admission Pages/StudentDetaisReport.jsx/TypeWise';
import CustomizedReportGenerate from '../../pages/Admission Pages/StudentDetaisReport.jsx/CustomizedReportGenerate';
import GradeWiseReport from '../../pages/Admission Pages/StudentDetaisReport.jsx/GradeFullView';
import AdhaarEmisNumber from '../../pages/Admission Pages/StudentDetaisReport.jsx/AadharEmis';
import ServiceCertificate from '../../pages/Admission Pages/StudentDetaisReport.jsx/ServiceCertificate';
import StrengthReport from '../../pages/Admission Pages/StudentDetaisReport.jsx/StrengthReport';
import FullViewReport from '../../pages/Admission Pages/StudentDetaisReport.jsx/FullViewReport';
import HostelStatusReport from '../../pages/Admission Pages/StudentDetaisReport.jsx/HostelStatusReport';
import StudentRegisterGrade from '../../pages/Admission Pages/StudentDetaisReport.jsx/StudentRegisterGrade';
import PhoneNumberReplace from '../../pages/Admission Pages/PhoneNumberReplace';
import TwelfthCertificate from '../../pages/Admission Pages/TC-View-Wise/TwelfthCertificate';
import CBSECertificate1 from '../../pages/Admission Pages/TC-View-Wise/CBSECertificate1';
import CBSECertificate2 from '../../pages/Admission Pages/TC-View-Wise/CBSECertificate2';
import CertificateManagement from '../../pages/Admission Pages/CertificateManagement';
import TenthCertificate from '../../pages/Admission Pages/TC-View-Wise/TenthCertificate';


function AdmissionMaster() {
  return (
    <Routes>
      <Route path="enquiry" element={<Enquiry />} />
      <Route path="AdmissionForm" element={<AdmissionForm />} />
      <Route path="AdmissionForm/:id" element={<AdmissionForm />} />
      <Route path="Bar-code-Design" element={<BarcodeDesign />} />
      <Route path="StudentDetails" element={<StudentDetails />} />
      <Route path="EditStudentDetails" element={<EditStudentDetails />} />
      <Route path="Student-Details-Report" element={<StudentDetailsReport />} />
      <Route path="Transfer-Certificate" element={<CertificateManagement />} />
      <Route path="Demand-Report" element={<DemandReport />} />
      <Route path="Section-Replace" element={<SectionReplace />} />
      <Route path="Arrear-FeeUpdating" element={<ArrearFeeUpdating />} />
      <Route path="/enquiry-form/:id" element={<EnquiryForm />} />
      <Route path="/enquiry-form/" element={<EnquiryForm />} />
      <Route path="Student-Details-Report/student-register-report" element={<StudentRegisterReport />} />
      <Route path="Student-Details-Report/religion-wise-report" element={<ReligionWiseReport />} />
      <Route path="Student-Details-Report/stage-wise-report" element={<StageWiseReport />} />
      <Route path="Student-Details-Report/category-wise-report" element={<CategoryWiseReport />} />
      <Route path="Student-Details-Report/route-wise-report" element={<RouteWiseReport />} />
      <Route path="Student-Details-Report/individual-full-view" element={<IndividualFullView />} />
      <Route path="Student-Details-Report/course-study-certificate" element={<CourseStudyCertificate />} />
      <Route path="Student-Details-Report/type-wise-report" element={<TypeWise />} />
      <Route path="Student-Details-Report/customize-report-generate" element={<CustomizedReportGenerate />} />
      <Route path="Student-Details-Report/grade-wise-report" element={<GradeWiseReport />} />
      <Route path="Student-Details-Report/adhaar-emis-number" element={<AdhaarEmisNumber />} />
      <Route path="Student-Details-Report/service-certificate" element={<ServiceCertificate />} />
      <Route path="Student-Details-Report/strength-report" element={<StrengthReport />} />
      <Route path="Student-Details-Report/full-view-report" element={<FullViewReport />} />
      <Route path="Student-Details-Report/hostel-status-report" element={<HostelStatusReport />} />
      <Route path="Student-Details-Report/student-register-grade" element={<StudentRegisterGrade />} />
      <Route path="phone-number-replace" element={<PhoneNumberReplace />} />
      <Route path="tenth-certificate" element={<TenthCertificate />} />
      <Route path="twelth-certificate" element={<TwelfthCertificate />} />
      <Route path="cbse-certificate-1" element={<CBSECertificate1 />} />
      <Route path="cbse-certificate-2" element={<CBSECertificate2 />} />
    </Routes>
  );
}

export default AdmissionMaster;