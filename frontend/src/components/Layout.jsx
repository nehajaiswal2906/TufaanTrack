import { Suspense, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { getPageMeta } from "../config/navigation";

// Fallback details for URLs that don't match any page
const NOT_FOUND_PAGE = {
  section: "Error",
  title: "Page Not Found",
  description: "The page you requested does not exist"
};

// The frame shared by every page: sidebar, top bar, page content, footer.
// <Outlet /> is where React Router places the current page.
function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const page = getPageMeta(location.pathname) ?? NOT_FOUND_PAGE;

  // When the page changes: update the browser tab title and scroll to the top
  useEffect(() => {
    document.title = `${page.title} · TufaanTrack`;
    window.scrollTo(0, 0);
  }, [page.title]);

  return (
    <div className="app">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Dark backdrop behind the drawer on narrow screens */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="content">
        <Topbar page={page} pathname={location.pathname} onMenuClick={() => setSidebarOpen(true)} />

        <div className="page" key={location.pathname}>
          <Suspense fallback={<div className="page-message">Loading page…</div>}>
            <Outlet />
          </Suspense>
        </div>

        <footer className="footer">
          <span>TUFAANTRACK © 2026</span>
          <span>SPACE-BASED DISASTER INTELLIGENCE · INDIA</span>
        </footer>
      </main>
    </div>
  );
}

export default Layout;
