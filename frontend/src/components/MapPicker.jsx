import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function MapPicker({ lat, lng, onLocationChange }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const defaultLat = lat || 4.7110;
  const defaultLng = lng || -74.0721;

  useEffect(() => {
    if (mapInstanceRef.current) return;

    const map = L.map(mapRef.current, { zoomControl: true }).setView([defaultLat, defaultLng], 15);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    const marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);
    markerRef.current = marker;

    marker.bindPopup('📍 Arrastra el pin a tu ubicación').openPopup();

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      onLocationChange?.(pos.lat, pos.lng);
    });

    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      onLocationChange?.(e.latlng.lat, e.latlng.lng);
    });

    return () => { map.remove(); mapInstanceRef.current = null; };
  }, []);

  useEffect(() => {
    if (markerRef.current && lat && lng) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current?.setView([lat, lng], 16);
    }
  }, [lat, lng]);

  const handleGPS = () => {
    if (!navigator.geolocation) return alert('GPS no disponible en este navegador');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        markerRef.current?.setLatLng([latitude, longitude]);
        mapInstanceRef.current?.setView([latitude, longitude], 17);
        onLocationChange?.(latitude, longitude);
      },
      () => alert('No se pudo obtener tu ubicación. Verifica los permisos del navegador.')
    );
  };

  return (
    <div className="relative">
      <div ref={mapRef} className="rounded-2xl overflow-hidden" style={{ height: '300px' }} />
      <button
        type="button"
        onClick={handleGPS}
        className="absolute bottom-3 right-3 z-[400] bg-naranja text-white px-3 py-2 rounded-xl text-sm font-semibold shadow-warm flex items-center gap-1.5 hover:bg-naranja-dark transition-colors"
      >
        📍 Usar mi ubicación GPS
      </button>
    </div>
  );
}
