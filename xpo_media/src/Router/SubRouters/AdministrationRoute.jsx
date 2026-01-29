import { Routes, Route } from "react-router-dom"

// Main Pages
import CourseSetup from "../../pages/Administration Pages/MainPages/CourseSetup"
import FeeHeadSetup from "../../pages/Administration Pages/MainPages/FeeHeadSetup"
import MiscellaneousFeeHeadSetup from "../../pages/Administration Pages/MainPages/MiscellaneousFeeHeadSetup"
import HostelFeeHeadSetup from "../../pages/Administration Pages/MainPages/HostelFeeHeadSetup"
import TutionFeeSetup from "../../pages/Administration Pages/MainPages/TutionFeeSetup"
import HostelFeeSetup from "../../pages/Administration Pages/MainPages/HostelFeeSetup"
import CommunityAndCasteSetup from "../../pages/Administration Pages/MainPages/CommunityAndCasteSetup"
import ParentOccupationSetup from "../../pages/Administration Pages/MainPages/ParentOccupationSetup"
import StaffDesignationandCategory from "../../pages/Administration Pages/MainPages/StaffDesignationandCategory"
import ReceiptSetup from "../../pages/Administration Pages/MainPages/ReceiptSetup"
import ReceiptHeadSetup from "../../pages/Administration Pages/ReceiptSetupPages/ReceiptHeadSetup"
import ReceiptSubHeadSetup from "../../pages/Administration Pages/ReceiptSetupPages/ReceiptSubHeadSetup"
import PaymentSetup from "../../pages/Administration Pages/MainPages/PaymentSetup"
import PaymenHeadSetup from "../../pages/Administration Pages/PaymentSetupPages/PaymentHeadSetup"
import PaymentSubHeadSetup from "../../pages/Administration Pages/PaymentSetupPages/PaymentSubHeadSetup"
import CertificatePreparation from "../../pages/Administration Pages/MainPages/CirtificatePreparation"
// ✅ Fixed capitalization below: changed Attendancecertificate to AttendanceCertificate
import AttendanceCertificate from "../../pages/Administration Pages/CertificatePreparationPages/AttendanceCertificate"
import CourseCertificate from "../../pages/Administration Pages/CertificatePreparationPages/CourseCertificate"
import ExperienceCertificate from "../../pages/Administration Pages/CertificatePreparationPages/ExperienceCertificate"
import SubjectHead from "../../pages/Administration Pages/MainPages/SubjectHead"
import StaffMaster from "../../pages/Administration Pages/MainPages/StaffMaster"
import StaffForm from "../../pages/Administration Pages/MainPages/StaffForm"
import PasswordSetup from "../../pages/Administration Pages/MainPages/PasswordSetup"
import StudentsCategory from "../../pages/Administration Pages/MainPages/StudentsCategory"
import StateAndDistrictManagement from "../../pages/Administration Pages/MainPages/StateAndDistrictManagement"
import MotherTongueSetup from "../../pages/Administration Pages/MainPages/MotherTongueSetup"
import SectionSetup from "../../pages/Administration Pages/MainPages/SectionSetup"
import BloodGroupSetup from "../../pages/Administration Pages/MainPages/BloodGroupSetup"
import ServiceCertificate from "../../pages/Admission Pages/StudentDetaisReport.jsx/ServiceCertificate"

function AdministrationRoute() {
  return (
    <Routes>
      <Route path="standard-setup" element={<CourseSetup />} />
      <Route path="fee-setup" element={<FeeHeadSetup />} />
      <Route path="miscellaneous-feeHead-setup" element={<MiscellaneousFeeHeadSetup />} />
      <Route path="hostel-fee-head-setup" element={<HostelFeeHeadSetup />} />
      <Route path="password-setup" element={<PasswordSetup />} />
      <Route path="tuition-setup" element={<TutionFeeSetup />} />
      <Route path="hostel-fee-setup" element={<HostelFeeSetup />} />
      <Route path="students-category" element={<StudentsCategory />} />
      <Route path="subject-head" element={<SubjectHead />} />
      <Route path="community-setup" element={<CommunityAndCasteSetup />} />
      <Route path="staff-designation-and-category" element={<StaffDesignationandCategory />} />
      <Route path="occupation-setup" element={<ParentOccupationSetup />} />
      <Route path="receipt-setup" element={<ReceiptSetup />} />
      <Route path="head-setup" element={<ReceiptHeadSetup />} />
      <Route path="subhead-setup" element={<ReceiptSubHeadSetup />} />
      <Route path="payment-setup" element={<PaymentSetup />} />
      <Route path="staff-master" element={<StaffMaster />} />
      <Route path="staff-form" element={<StaffForm />} />
      <Route path="staff-form/:id" element={<StaffForm />} />
      <Route path="paymenthead-setup" element={<PaymenHeadSetup />} />
      <Route path="paymentsubhead-setup" element={<PaymentSubHeadSetup />} />
      <Route path="certificate" element={<CertificatePreparation />} />
      <Route path="attendance-certificate" element={<AttendanceCertificate />} />
      <Route path="course-certificate" element={<CourseCertificate />} />
      <Route path="experience-certificate" element={<ExperienceCertificate />} />
      <Route path="state-and-district-management" element={<StateAndDistrictManagement />} />
      <Route path="mother-tongue-setup" element={<MotherTongueSetup />} />
      <Route path="blood-group-setup" element={<BloodGroupSetup />} />
      <Route path="section-setup" element={<SectionSetup />} />
    </Routes>
  )
}

export default AdministrationRoute
