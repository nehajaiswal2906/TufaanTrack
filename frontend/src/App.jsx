import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import OverviewPage from "./pages/OverviewPage";

import "./App.css";

// Pages other than Overview are loaded only when first opened
// ("code splitting"), so the website starts faster.
const LiveMapPage = lazy(() => import("./pages/LiveMapPage"));
const CyclonePage = lazy(() => import("./pages/CyclonePage"));
const SettlementsPage = lazy(() => import("./pages/SettlementsPage"));
const SheltersPage = lazy(() => import("./pages/SheltersPage"));
const MedicalPage = lazy(() => import("./pages/MedicalPage"));
const AssessmentPage = lazy(() => import("./pages/AssessmentPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const SosPage = lazy(() => import("./pages/SosPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

// Shown for a moment while a page's code is downloading
const pageLoading = <div className="page-message">Loading page…</div>;

// Routes = which page appears for which URL.
// Every page is placed inside <Layout>, so they all share
// the same sidebar, top bar and footer.
function App() {
  return (
    <Suspense fallback={pageLoading}>
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
    </Suspense>
  );
}

export default App;
