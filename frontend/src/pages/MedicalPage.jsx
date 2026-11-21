import FacilityPage from "../components/infrastructure/FacilityPage";
import { HOSPITAL_PAGE } from "../config/infrastructurePages";

// Medical Facilities page (Module 5) — uses the shared FacilityPage
function MedicalPage() {
  return <FacilityPage config={HOSPITAL_PAGE} />;
}

export default MedicalPage;
