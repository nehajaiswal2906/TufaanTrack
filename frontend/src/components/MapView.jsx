
import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom map markers
const createIcon = (color) =>
  L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: 14px;
      height: 14px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 12px ${color};
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });

// Temporary demonstration locations
const demoLocations = [
  {
    name: "Demo Settlement A",
    type: "Settlement",
    position: [19.8135, 85.8312],
    color: "#42c9e8"
  },
  {
    name: "Demo Shelter A",
    type: "Cyclone Shelter",
    position: [19.85, 85.88],
    color: "#36d399"
  },
  {
    name: "Demo Hospital A",
    type: "Hospital",
    position: [19.78, 85.80],
    color: "#ff647c"
  }
];

function MapView() {
  const [selectedType, setSelectedType] = useState("All");

  const filteredLocations =
    selectedType === "All"
      ? demoLocations
      : demoLocations.filter((item) => item.type === selectedType);

  return (
    <div className="map-view">
      <div className="map-filters">
        {["All", "Settlement", "Cyclone Shelter", "Hospital"].map((type) => (
          <button
            key={type}
            className={selectedType === type ? "active-filter" : ""}
            onClick={() => setSelectedType(type)}
          >
            {type}
          </button>
        ))}
      </div>

      <MapContainer
        center={[19.8135, 85.8312]}
        zoom={11}
        scrollWheelZoom={true}
        className="leaflet-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Circle
          center={[19.8135, 85.8312]}
          radius={3500}
          pathOptions={{
            color: "#ff647c",
            fillColor: "#ff647c",
            fillOpacity: 0.12
          }}
        />
        
        <Polyline
        positions={[
            [20.5, 86.5],
            [20.2, 86.2],
            [20.0, 86.0],
            [19.8135, 85.8312]
        ]}
        pathOptions={{
            color: "#ff647c",
            weight: 4,
            opacity: 0.9,
            dashArray: "8 8"
            }}
            />

        {filteredLocations.map((location, index) => (
          <Marker
            key={index}
            position={location.position}
            icon={createIcon(location.color)}
          >
            <Popup>
              <strong>{location.name}</strong>
              <br />
              {location.type}
              <br />
              <small>Sample demonstration data</small>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="map-demo-label">
        DEMO DATA · NOT LIVE DISASTER INFORMATION
      </div>
    </div>
  );
}

export default MapView;
