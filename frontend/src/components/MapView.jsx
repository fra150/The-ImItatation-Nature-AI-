import { useEffect, useRef } from 'react';
import L from 'leaflet';

// Punto di destinazione dato un punto di partenza, una rotta (gradi) e una
// distanza (metri) — formula sferica standard, usata per disegnare la freccia
// di propagazione stimata (vedi GET /api/fire-events/:id/spread).
function destinationPoint(lat, lng, bearingDeg, distanceMeters) {
  const R = 6371000;
  const δ = distanceMeters / R;
  const θ = (bearingDeg * Math.PI) / 180;
  const φ1 = (lat * Math.PI) / 180;
  const λ1 = (lng * Math.PI) / 180;
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
  const λ2 =
    λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));
  return [(φ2 * 180) / Math.PI, (λ2 * 180) / Math.PI];
}

// Mappa Leaflet dell'Italia con marker per aree, sensori, droni e incendi.
// Gli incendi usano le proprie coordinate (latitude/longitude); per i fuochi
// storici che ne sono privi si ripiega sul centro dell'area di appartenenza.
// `spreadByFireId` (opzionale): { [fireId]: stima da GET .../spread } — se
// disponibile disegna una freccia tratteggiata verso la direzione stimata di
// avanzamento (euristica, vedi disclaimer nel popup).
export default function MapView({ areas = [], sensors = [], drones = [], fires = [], spreadByFireId = {} }) {
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
      // Coordinate proprie dell'incendio se presenti, altrimenti centro area.
      const own = typeof f.latitude === 'number' ? [f.latitude, f.longitude] : null;
      const a = areaById[f.areaId];
      const p = own || (a && coord(a.location));
      if (p)
        L.circleMarker(p, { radius: 14, color: '#dc2626', fillColor: '#ef4444', fillOpacity: 0.5 })
          .bindPopup(`🔥 <b>${f.location}</b><br/>gravità: ${f.severity} · ${f.status}`)
          .addTo(grp);

      // Overlay propagazione stimata (euristica vento — vedi disclaimer nel
      // popup): freccia tratteggiata dal fuoco verso la rotta stimata.
      const spread = spreadByFireId[f.id];
      if (p && spread && spread.available) {
        const tip = destinationPoint(p[0], p[1], spread.bearingDeg, spread.projectedDistanceMeters);
        L.polyline([p, tip], { color: '#f97316', weight: 3, dashArray: '6,6', opacity: 0.85 })
          .bindPopup(
            `↗️ Propagazione stimata: ${spread.bearingDeg}°, ~${spread.projectedDistanceMeters}m in ${spread.horizonMinutes} min<br/><small>${spread.disclaimer}</small>`,
          )
          .addTo(grp);
        L.circleMarker(tip, { radius: 5, color: '#f97316', fillColor: '#f97316', fillOpacity: 0.9 }).addTo(grp);
      }
    });
  }, [areas, sensors, drones, fires, spreadByFireId]);

  return <div className="map" ref={el} />;
}
