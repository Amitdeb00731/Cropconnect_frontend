// HarvestMapView.js
import React from 'react';
import {
  MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip
} from 'react-leaflet';
import L from 'leaflet';
import harvestIconImg from './assets/harvest-icon.png';

const harvestIcon = new L.Icon({
  iconUrl: harvestIconImg,
  iconSize: [30, 30],
});


const currentIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/64/64113.png',
  iconSize: [30, 30],
});

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (angle) => (angle * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

export default function HarvestMapView({ currentLocation, harvests }) {
  if (!currentLocation) return <p>Fetching location...</p>;

  return (
    <MapContainer
      center={[currentLocation.latitude, currentLocation.longitude]}
      zoom={13}
      scrollWheelZoom
      style={{ height: '100%', width: '100%', minHeight: '300px', borderRadius: '12px' }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[currentLocation.latitude, currentLocation.longitude]} icon={currentIcon}>
        <Popup>Your Current Location</Popup>
      </Marker>

      {harvests.map((h) => {
        const distance = haversineDistance(
          currentLocation.latitude, currentLocation.longitude, h.latitude, h.longitude
        ).toFixed(2);

        const linePositions = [
          [currentLocation.latitude, currentLocation.longitude],
          [h.latitude, h.longitude],
        ];

        return (
          <React.Fragment key={h.id}>
            <Marker position={[h.latitude, h.longitude]} icon={harvestIcon}>
              <Popup>
                <strong>{h.riceType}</strong><br />
                {h.farmLocation || 'No address'}<br />
                Remaining: {h.remainingQuantity} {h.quantityUnit || 'Kg'}<br />
                Distance: {distance} km
              </Popup>
            </Marker>
            <Polyline positions={linePositions} color="green">
              <Tooltip permanent direction="center">{distance} km</Tooltip>
            </Polyline>
          </React.Fragment>
        );
      })}
    </MapContainer>
  );
}
