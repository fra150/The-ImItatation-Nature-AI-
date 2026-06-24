import { useEffect, useRef } from 'react';
import L from 'leaflet';

// Mappa Leaflet dell'Italia con marker per aree, sensori, droni e incendi
// (gli incendi sono posizionati sul centro dell'area di appartenenza).
export default function MapView({ areas = [], sensors = [], drones = [], fires = [] }) {
  const el = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);

  useEffect(() => {
    if (map.current) return;
    map.current = L.map(el.current).setView([41.8, 13.5], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 18,
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    setTimeout(() => map.current.invalidateSize(), 200);
  }, []);

  useEffect(() => {
    const grp = layer.current;
    if (!grp) return;
    grp.clearLayers();
    const coord = (x) => (x && typeof x.latitude === 'number' ? [x.latitude, x.longitude] : null);

    const areaById = {};
    areas.forEach((a) => {
      areaById[a.id] = a;
      const p = coord(a.location);
      if (p)
        L.circleMarker(p, { radius: 11, color: '#e2581f', weight: 2, fillOpacity: 0.15 })
          .bindPopup(`<b>${a.name}</b><br/>rischio: ${a.riskLevel}`)
          .addTo(grp);
    });
    sensors.forEach((s) => {
      const p = coord(s.location);
      if (p)
        L.circleMarker(p, { radius: 5, color: '#16a34a', fillColor: '#22c55e', fillOpacity: 0.9 })
          .bindPopup(`Sensore: <b>${s.name}</b><br/>${s.type} · ${s.status}`)
          .addTo(grp);
    });
    drones.forEach((d) => {
      const p = coord(d.location);
      if (p)
        L.circleMarker(p, { radius: 6, color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.9 })
          .bindPopup(`Drone: <b>${d.model}</b><br/>${d.status} · 🔋${d.batteryLevel}%`)
          .addTo(grp);
    });
    fires.forEach((f) => {
      const a = areaById[f.areaId];
      const p = a && coord(a.location);
      if (p)
        L.circleMarker(p, { radius: 14, color: '#dc2626', fillColor: '#ef4444', fillOpacity: 0.5 })
          .bindPopup(`🔥 <b>${f.location}</b><br/>gravità: ${f.severity} · ${f.status}`)
          .addTo(grp);
    });
  }, [areas, sensors, drones, fires]);

  return <div className="map" ref={el} />;
}
