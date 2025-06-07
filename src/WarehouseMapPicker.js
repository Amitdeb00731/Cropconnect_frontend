// WarehouseMapPicker.js
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function WarehouseMapPicker({ lat, lon, onChange, readOnly }) {
  const position = [lat || 20.5937, lon || 78.9629];
  const markerRef = useRef(null);

  const markerIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });

  function DraggableMarker() {
    const map = useMap();

    // Center the map when lat/lon changes
    useEffect(() => {
      if (lat && lon) {
        const newCenter = L.latLng(lat, lon);
        map.setView(newCenter, map.getZoom());
        if (markerRef.current) markerRef.current.setLatLng(newCenter);
      }
    }, [lat, lon, map]);

    useMapEvents({
      click(e) {
        if (!readOnly) {
          const { lat, lng } = e.latlng;
          onChange(lat, lng);
        }
      }
    });

    return (
      <Marker
        position={position}
        icon={markerIcon}
        draggable={!readOnly}
        ref={markerRef}
        eventHandlers={{
          dragend: (e) => {
            const { lat, lng } = e.target.getLatLng();
            onChange(lat, lng);
          }
        }}
      />
    );
  }

  return (
    <MapContainer center={position} zoom={13} style={{ height: '300px', borderRadius: 8 }}>
      <TileLayer
        attribution="&copy; Geoapify"
        url={`https://maps.geoapify.com/v1/tile/osm-carto/{z}/{x}/{y}.png?apiKey=35d72c07d6f74bec8a373961eea91f46`}
      />
      <DraggableMarker />
    </MapContainer>
  );
}
