"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type TruckLocationView = {
  truckId: string;
  truckName: string;
  latitude: number;
  longitude: number;
  recordedAt: string;
};

export function GpsDashboard() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [locations, setLocations] = useState<TruckLocationView[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) {
      return;
    }

    leafletMapRef.current = L.map(mapRef.current).setView([37.7749, -122.4194], 10);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(leafletMapRef.current);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadLocations() {
      const response = await fetch("/api/gps/locations", { cache: "no-store" });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        if (!cancelled) {
          setError(payload.error || "Unable to load GPS data");
        }
        return;
      }

      const payload = (await response.json()) as { locations: TruckLocationView[] };
      if (cancelled) {
        return;
      }

      setLocations(payload.locations);
      setError("");
    }

    loadLocations();
    const interval = window.setInterval(loadLocations, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) {
      return;
    }

    const activeIds = new Set(locations.map((location) => location.truckId));

    markersRef.current.forEach((marker, truckId) => {
      if (!activeIds.has(truckId)) {
        marker.remove();
        markersRef.current.delete(truckId);
      }
    });

    locations.forEach((location) => {
      const icon = L.divIcon({
        className: "",
        html: `<div style="background:#111;color:#fff;padding:4px 6px;border-radius:4px;font-size:12px;">${location.truckName}</div>`
      });

      const existing = markersRef.current.get(location.truckId);
      if (existing) {
        existing.setLatLng([location.latitude, location.longitude]);
        existing.bindPopup(
          `${location.truckName}<br/>Last update: ${new Date(location.recordedAt).toLocaleString()}`
        );
      } else {
        const marker = L.marker([location.latitude, location.longitude], { icon }).addTo(map);
        marker.bindPopup(
          `${location.truckName}<br/>Last update: ${new Date(location.recordedAt).toLocaleString()}`
        );
        markersRef.current.set(location.truckId, marker);
      }
    });

    if (locations.length) {
      map.setView([locations[0].latitude, locations[0].longitude], 12);
    }
  }, [locations]);

  return (
    <section className="stack">
      <h2>GPS</h2>
      {error ? <p className="error">{error}</p> : null}
      <div ref={mapRef} style={{ height: 360, border: "1px solid #ccc" }} />
      <ul>
        {locations.map((location) => (
          <li key={location.truckId}>
            {location.truckName}: {location.latitude}, {location.longitude} at{" "}
            {new Date(location.recordedAt).toLocaleString()}
          </li>
        ))}
      </ul>
    </section>
  );
}
