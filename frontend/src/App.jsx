
import {
  LayoutDashboard,
  Map,
  MapPin,
  Shield,
  Hospital,
  Radio,
  Activity,
  Bell,
  Search,
  Wind,
  Navigation,
  ArrowUpRight,
  Satellite,
  Menu
} from "lucide-react";

import MapView from "./components/MapView";
import "./App.css";

function App() {
  return (
    <div className="app">

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Satellite size={23} />
          </div>
          <div>
            <h2>TUFAANTRACK</h2>
            <span>INTELLIGENCE SYSTEM</span>
          </div>
        </div>

        <p className="menu-label">MAIN MENU</p>

        <nav>
          <div className="nav-item active">
            <LayoutDashboard size={18} /> Overview
          </div>
          <div className="nav-item">
            <Map size={18} /> Live Map
          </div>
          <div className="nav-item">
            <MapPin size={18} /> Settlements
          </div>
          <div className="nav-item">
            <Shield size={18} /> Cyclone Shelters
          </div>
          <div className="nav-item">
            <Hospital size={18} /> Medical Facilities
          </div>
          <div className="nav-item">
            <Radio size={18} /> Emergency Reports
          </div>
        </nav>

        <div className="sidebar-footer">
          <span className="online-dot"></span>
          All systems operational
          <small>VERSION 1.0.0 · INDIA</small>
        </div>
      </aside>

      <main className="content">

        <header className="topbar">
          <div className="page-heading">
            <span>DISASTER INTELLIGENCE / OVERVIEW</span>
            <h1>Operations Dashboard</h1>
          </div>

          <div className="top-actions">
            <button className="icon-button">
              <Search size={18} />
            </button>
            <button className="icon-button">
              <Bell size={18} />
            </button>
            <div className="profile">TT</div>
          </div>
        </header>

        <section className="welcome">
          <div>
            <span className="eyebrow">SPACE-BASED DISASTER MANAGEMENT</span>
            <h2>Monitor. Predict. Respond.</h2>
            <p>
              Geospatial intelligence for cyclone preparedness
              and emergency response across India.
            </p>
          </div>

          <div className="welcome-icon">
            <Satellite size={65} strokeWidth={1} />
          </div>
        </section>

        <section className="section-title">
          <div>
            <h2>Infrastructure Overview</h2>
            <p>Emergency resources and monitored locations</p>
          </div>
          <span className="live-badge">
            <span></span> SYSTEM ONLINE
          </span>
        </section>

        <section className="stats">

          <div className="stat-card">
            <div className="stat-top">
              <span>SETTLEMENTS</span>
              <MapPin size={19} />
            </div>
            <h2>--</h2>
            <p>Monitored locations</p>
            <div className="stat-bottom">GEOGRAPHIC COVERAGE</div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>CYCLONE SHELTERS</span>
              <Shield size={19} />
            </div>
            <h2>--</h2>
            <p>Emergency facilities</p>
            <div className="stat-bottom">SAFETY INFRASTRUCTURE</div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>HOSPITALS</span>
              <Hospital size={19} />
            </div>
            <h2>--</h2>
            <p>Medical facilities</p>
            <div className="stat-bottom">HEALTHCARE NETWORK</div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>EMERGENCY REPORTS</span>
              <Radio size={19} />
            </div>
            <h2>--</h2>
            <p>Community submissions</p>
            <div className="stat-bottom">COMMUNITY RESPONSE</div>
          </div>

        </section>

        <section className="workspace">

          <div className="map-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">GEOSPATIAL ANALYSIS</span>
                <h2>Regional Intelligence Map</h2>
              </div>
              <button className="map-button">
                <Navigation size={15} /> Explore Map
              </button>
            </div>

            <MapView />

            <div className="map-legend">
              <span><i className="blue"></i> Settlements</span>
              <span><i className="green"></i> Shelters</span>
              <span><i className="red"></i> Hospitals</span>
              <span><i className="orange"></i> Warning Zones</span>
            </div>
          </div>

          <aside className="intel-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">MONITORING CENTRE</span>
                <h2>Intelligence Feed</h2>
              </div>
              <Activity size={19} />
            </div>

            <div className="intel-card">
              <Wind size={20} />
              <div>
                <h3>Cyclone Monitoring</h3>
                <p>Awaiting cyclone data</p>
              </div>
            </div>

            <div className="intel-card">
              <MapPin size={20} />
              <div>
                <h3>Geographic Coverage</h3>
                <p>Awaiting settlement data</p>
              </div>
            </div>

            <div className="intel-card">
              <Shield size={20} />
              <div>
                <h3>Emergency Infrastructure</h3>
                <p>Awaiting resource data</p>
              </div>
            </div>

            <div className="intel-footer">
              <ArrowUpRight size={16} />
              <span>More intelligence features coming soon</span>
            </div>
          </aside>

        </section>

        <footer className="footer">
          <span>TUFAANTRACK © 2026</span>
          <span>SPACE-BASED DISASTER INTELLIGENCE</span>
        </footer>

      </main>
    </div>
  );
}

export default App;
