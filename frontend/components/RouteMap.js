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

export default function RouteMap({ pickupLat, pickupLng, pickupLabel, dropLat, dropLng, dropLabel }) {
  useEffect(() => {
    // react-leaflet sometimes needs a nudge to recalc size when rendered
    // inside a card that wasn't visible at mount time.
    window.dispatchEvent(new Event("resize"));
  }, []);

  const bounds = [
    [pickupLat, pickupLng],
    [dropLat, dropLng],
  ];
  const center = [(pickupLat + dropLat) / 2, (pickupLng + dropLng) / 2];

  return (
    <div className="rounded-2xl overflow-hidden border border-white/60" style={{ height: "260px" }}>
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
        <Polyline positions={[[pickupLat, pickupLng], [dropLat, dropLng]]} pathOptions={{ color: "#375775", weight: 3, dashArray: "6 6" }} />
      </MapContainer>
    </div>
  );
}
