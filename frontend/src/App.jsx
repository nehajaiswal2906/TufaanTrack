import { Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import OverviewPage from "./pages/OverviewPage";
import LiveMapPage from "./pages/LiveMapPage";
import CyclonePage from "./pages/CyclonePage";
import SettlementsPage from "./pages/SettlementsPage";
import SheltersPage from "./pages/SheltersPage";
import MedicalPage from "./pages/MedicalPage";
import AssessmentPage from "./pages/AssessmentPage";
import ReportsPage from "./pages/ReportsPage";
import SosPage from "./pages/SosPage";
import NotFoundPage from "./pages/NotFoundPage";

import "./App.css";

// Routes = which page appears for which URL.
// Every page is placed inside <Layout>, so they all share
// the same sidebar, top bar and footer.
function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<OverviewPage />} />
        <Route path="map" element={<LiveMapPage />} />
        <Route path="cyclone" element={<CyclonePage />} />
        <Route path="settlements" element={<SettlementsPage />} />
        <Route path="shelters" element={<SheltersPage />} />
        <Route path="medical" element={<MedicalPage />} />
        <Route path="assessment" element={<AssessmentPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="sos" element={<SosPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
