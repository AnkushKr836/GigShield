"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Leaflet's default marker icons resolve to broken URLs under Next.js's
// bundler (a long-standing, well-known issue) — pointing at the CDN
// versions directly sidesteps it entirely rather than fighting webpack.
const pickupIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function RouteMap({ pickupLat, pickupLng, pickupLabel, dropLat, dropLng, dropLabel, routePoints, routeSource, routeDisclaimer }) {
  useEffect(() => {
    // react-leaflet sometimes needs a nudge to recalc size when rendered
    // inside a card that wasn't visible at mount time.
    window.dispatchEvent(new Event("resize"));
  }, []);

  const endpoints = [
    [pickupLat, pickupLng],
    [dropLat, dropLng],
  ];
  const path = routePoints?.length > 1 ? routePoints : endpoints;
  const bounds = path;
  const center = [(pickupLat + dropLat) / 2, (pickupLng + dropLng) / 2];

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/60" style={{ height: "260px" }}>
      <MapContainer bounds={bounds} boundsOptions={{ padding: [30, 30] }} center={center} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[pickupLat, pickupLng]} icon={pickupIcon}>
          <Popup>Pickup: {pickupLabel}</Popup>
        </Marker>
        <Marker position={[dropLat, dropLng]} icon={pickupIcon}>
          <Popup>Drop: {dropLabel}</Popup>
        </Marker>
        <Polyline positions={path} pathOptions={{ color: routePoints?.length > 1 ? "#1689c9" : "#375775", weight: 4, opacity: 0.9, dashArray: routePoints?.length > 1 ? undefined : "6 6" }} />
      </MapContainer>
      <div className="pointer-events-none absolute right-3 top-3 z-[500] max-w-[80%] rounded-xl border border-white/80 bg-white/90 px-3 py-2 shadow-sm backdrop-blur">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">{routeSource === "tomtom_historical_route_estimate" ? "TomTom route estimate" : "Demo route guide"}</p>
        <p className="mt-0.5 text-[10px] leading-snug text-muted">{routeDisclaimer || "Venue endpoints only; no GPS trip trace recorded."}</p>
      </div>
    </div>
  );
}
