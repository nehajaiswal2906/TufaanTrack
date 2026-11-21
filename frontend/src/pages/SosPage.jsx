import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Siren,
  Send,
  LocateFixed,
  MousePointerClick,
  CircleCheck,
  TriangleAlert,
  LoaderCircle,
  Info
} from "lucide-react";

import MapView from "../components/MapView";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api";
import { loadMapPoints } from "../services/mapData";
import {
  REPORT_TYPES,
  reportTypeLabel,
  DESCRIPTION_MIN,
  DESCRIPTION_MAX,
  DISTRICT_BOUNDS
} from "../config/reports";
import "../components/reports/reports.css";

const EMPTY_FORM = { reportType: "", description: "", villageId: "", latitude: "", longitude: "" };

// Checks the form and returns { field: "message" } for every problem
function validate(form) {
  const errors = {};
  const lat = Number(form.latitude);
  const lng = Number(form.longitude);

  if (!form.reportType) errors.reportType = "Choose what kind of emergency this is.";

  const length = form.description.trim().length;
  if (length < DESCRIPTION_MIN) errors.description = `Please describe the situation (at least ${DESCRIPTION_MIN} characters).`;
  if (length > DESCRIPTION_MAX) errors.description = `Please keep it under ${DESCRIPTION_MAX} characters.`;

  if (form.latitude === "" || form.longitude === "") {
    errors.location = "Pick a location on the map, choose a village, or use your current location.";
  } else if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
    errors.location = "Latitude must be between -90 and 90, and longitude between -180 and 180.";
  }

  return errors;
}

// True if a valid location is clearly outside Puri district
function outsideDistrict(form) {
  const lat = Number(form.latitude);
  const lng = Number(form.longitude);
  if (form.latitude === "" || form.longitude === "" || !Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  const b = DISTRICT_BOUNDS;
  return lat < b.minLat || lat > b.maxLat || lng < b.minLng || lng > b.maxLng;
}

function SosPage() {
  const mapData = useApi(loadMapPoints);
  const villages = [...(mapData.data?.settlement ?? [])].sort((a, b) => a.name.localeCompare(b.name));

  const [form, setForm] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState(false); // show errors only after a submit attempt
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [submitted, setSubmitted] = useState(null); // the report saved by the backend
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState(null);

  const errors = validate(form);
  const hasErrors = Object.keys(errors).length > 0;
  const pickedPoint =
    form.latitude !== "" && form.longitude !== "" && !errors.location
      ? [Number(form.latitude), Number(form.longitude)]
      : null;

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setSendError(null);
  }

  function setLocation(lat, lng) {
    setForm((current) => ({ ...current, latitude: lat.toFixed(5), longitude: lng.toFixed(5) }));
  }

  // Choosing a village links the report to it and moves the pin there
  function chooseVillage(villageId) {
    update("villageId", villageId);
    const village = villages.find((v) => v.village_id === villageId);
    if (village) setLocation(village.latitude, village.longitude);
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setLocateError("This browser cannot share your location.");
      return;
    }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position.coords.latitude, position.coords.longitude);
        setLocating(false);
      },
      () => {
        setLocateError("Location permission was denied or unavailable. Pick the location on the map instead.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setTouched(true);
    if (hasErrors || sending) return;

    setSending(true);
    setSendError(null);
    try {
      const saved = await api.submitSos({
        report_type: form.reportType,
        description: form.description.trim(),
        village_id: form.villageId || null,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude)
      });
      setSubmitted(saved);
      setForm(EMPTY_FORM);
      setTouched(false);
    } catch (err) {
      setSendError(err.message);
    } finally {
      setSending(false);
    }
  }

  // ---------- After a successful submission ----------
  if (submitted) {
    return (
      <section className="placeholder-panel sos-success">
        <div className="placeholder-icon success">
          <CircleCheck size={34} strokeWidth={1.5} />
        </div>
        <span className="module-badge">REPORT #{submitted.report_id} RECEIVED</span>
        <h2>Your report has been sent</h2>
        <p className="placeholder-summary">
          <strong>{reportTypeLabel(submitted.report_type)}</strong> at{" "}
          {Number(submitted.latitude).toFixed(4)}° N, {Number(submitted.longitude).toFixed(4)}° E.
          Its status is <strong>{submitted.status}</strong> until an operator reviews it.
        </p>
        <div className="welcome-actions centered">
          <Link to="/reports" className="primary-button">View emergency reports</Link>
          <button className="secondary-button" onClick={() => setSubmitted(null)}>
            Submit another report
          </button>
        </div>
        <p className="sos-emergency-note">
          In a life-threatening emergency, also call <strong>112</strong> (India's emergency number).
        </p>
      </section>
    );
  }

  // ---------- The form ----------
  return (
    <div className="sos-layout">
      <form className="map-panel sos-form" onSubmit={handleSubmit} noValidate>
        <div className="panel-heading">
          <div>
            <span className="eyebrow">COMMUNITY REPORTING</span>
            <h2>Report an emergency</h2>
          </div>
          <Siren size={20} />
        </div>

        <div className="sos-emergency-note top">
          <TriangleAlert size={15} />
          <span>
            For a life-threatening emergency, call <strong>112</strong> first. This form
            records reports for the response team — it does not dispatch help by itself.
          </span>
        </div>

        {/* Report type */}
        <label className="field">
          <span className="field-label">Type of emergency *</span>
          <select
            value={form.reportType}
            onChange={(e) => update("reportType", e.target.value)}
            aria-invalid={touched && Boolean(errors.reportType)}
          >
            <option value="">Choose a type…</option>
            {Object.entries(REPORT_TYPES).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          {touched && errors.reportType && <span className="field-error">{errors.reportType}</span>}
        </label>

        {/* Description */}
        <label className="field">
          <span className="field-label">
            What is happening? *
            <em className={form.description.length > DESCRIPTION_MAX ? "over" : ""}>
              {form.description.length}/{DESCRIPTION_MAX}
            </em>
          </span>
          <textarea
            rows={4}
            placeholder="e.g. Large tree fallen across the main road near the school; vehicles cannot pass."
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            aria-invalid={touched && Boolean(errors.description)}
          />
          {touched && errors.description && <span className="field-error">{errors.description}</span>}
        </label>

        {/* Village */}
        <label className="field">
          <span className="field-label">Village (optional)</span>
          <select
            value={form.villageId}
            onChange={(e) => chooseVillage(e.target.value)}
            disabled={mapData.loading || Boolean(mapData.error)}
          >
            <option value="">
              {mapData.loading ? "Loading villages…" : mapData.error ? "Villages unavailable" : "Not linked to a village"}
            </option>
            {villages.map((v) => (
              <option key={v.village_id} value={v.village_id}>
                {v.name} ({v.village_id})
              </option>
            ))}
          </select>
          <span className="field-hint">
            <Info size={11} /> Linking a village lets the backend's impact assessment take this
            report into account (it uses unverified road-blockage reports).
          </span>
        </label>

        {/* Location */}
        <fieldset className="field">
          <span className="field-label">Location *</span>
          <div className="coord-row">
            <label>
              Latitude
              <input
                type="number"
                step="any"
                inputMode="decimal"
                placeholder="19.81350"
                value={form.latitude}
                onChange={(e) => update("latitude", e.target.value)}
              />
            </label>
            <label>
              Longitude
              <input
                type="number"
                step="any"
                inputMode="decimal"
                placeholder="85.83120"
                value={form.longitude}
                onChange={(e) => update("longitude", e.target.value)}
              />
            </label>
          </div>
          <div className="location-actions">
            <span className="field-hint"><MousePointerClick size={12} /> Or click the map to place the pin</span>
            <button type="button" className="secondary-button small" onClick={useMyLocation} disabled={locating}>
              {locating ? <LoaderCircle size={13} className="spin" /> : <LocateFixed size={13} />}
              {locating ? "Locating…" : "Use my location"}
            </button>
          </div>
          {locateError && <span className="field-error">{locateError}</span>}
          {touched && errors.location && <span className="field-error">{errors.location}</span>}
          {outsideDistrict(form) && !errors.location && (
            <span className="field-warning">
              This location is outside Puri district, the area TufaanTrack currently monitors.
              You can still send it.
            </span>
          )}
        </fieldset>

        {sendError && (
          <div className="form-error" role="alert">
            <TriangleAlert size={15} />
            <span><strong>Report not sent.</strong> {sendError}</span>
          </div>
        )}

        <button type="submit" className="primary-button submit-button" disabled={sending}>
          {sending ? <LoaderCircle size={16} className="spin" /> : <Send size={16} />}
          {sending ? "Sending report…" : "Send SOS report"}
        </button>
      </form>

      <section className="map-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">LOCATION</span>
            <h2>{pickedPoint ? "Pin placed" : "Click the map to place a pin"}</h2>
          </div>
        </div>
        <MapView
          height="max(560px, calc(100vh - 330px))"
          data={mapData.data ?? { settlement: [], shelter: [], hospital: [] }}
          isDemo={false}
          loading={mapData.loading}
          error={mapData.error}
          onRetry={mapData.retry}
          initialLayers={{ shelter: false, hospital: false }}
          onMapClick={({ lat, lng }) => setLocation(lat, lng)}
          onSelect={(key, item) => {
            if (key === "settlement") chooseVillage(item.village_id);
          }}
          selectedId={form.villageId ? form.villageId : null}
          pickedPoint={pickedPoint}
        />
      </section>
    </div>
  );
}

export default SosPage;
