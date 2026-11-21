// =========================================
// NAVIGATION CONFIG
// One list that describes every page in TufaanTrack.
// The sidebar, top bar and browser tab title all read from here,
// so adding a page later only needs one new entry.
// =========================================

import {
  LayoutDashboard,
  Map,
  Wind,
  MapPin,
  Shield,
  Hospital,
  BarChart3,
  Radio,
  Siren
} from "lucide-react";

export const NAV_SECTIONS = [
  {
    label: "Operations",
    items: [
      {
        path: "/",
        label: "Overview",
        icon: LayoutDashboard,
        title: "Operations Dashboard",
        description: "Situation summary and quick access to every module"
      },
      {
        path: "/map",
        label: "Live Map",
        icon: Map,
        title: "Regional Intelligence Map",
        description: "Settlements, shelters and hospitals on one map"
      },
      {
        path: "/cyclone",
        label: "Cyclone Tracking",
        icon: Wind,
        title: "Cyclone Tracking",
        description: "Cyclone track, warning zones and movement details"
      }
    ]
  },
  {
    label: "Geography & Resources",
    items: [
      {
        path: "/settlements",
        label: "Settlements",
        icon: MapPin,
        title: "Settlement Information",
        description: "Villages, population and exposure details"
      },
      {
        path: "/shelters",
        label: "Cyclone Shelters",
        icon: Shield,
        title: "Cyclone Shelters",
        description: "Shelter locations and capacity information"
      },
      {
        path: "/medical",
        label: "Medical Facilities",
        icon: Hospital,
        title: "Medical Facilities",
        description: "Hospitals and primary health centres"
      }
    ]
  },
  {
    label: "Response",
    items: [
      {
        path: "/assessment",
        label: "Impact Assessment",
        icon: BarChart3,
        title: "Impact Assessment",
        description: "Exposed settlements and priority levels"
      },
      {
        path: "/reports",
        label: "Emergency Reports",
        icon: Radio,
        title: "Emergency Reports",
        description: "Community reports and verification status"
      },
      {
        path: "/sos",
        label: "Submit SOS",
        icon: Siren,
        title: "Submit SOS Request",
        description: "Report an emergency with its location"
      }
    ]
  }
];

// A flat list of all pages (easier to search through)
export const ALL_PAGES = NAV_SECTIONS.flatMap((section) =>
  section.items.map((item) => ({ ...item, section: section.label }))
);

// Find the page details for the current URL path
export function getPageMeta(pathname) {
  return ALL_PAGES.find((page) => page.path === pathname) ?? null;
}
