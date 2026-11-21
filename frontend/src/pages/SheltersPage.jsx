import FacilityPage from "../components/infrastructure/FacilityPage";
import { SHELTER_PAGE } from "../config/infrastructurePages";

// Cyclone Shelters page (Module 5) — uses the shared FacilityPage
function SheltersPage() {
  return <FacilityPage config={SHELTER_PAGE} />;
}

export default SheltersPage;
