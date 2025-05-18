import React, { useEffect, useRef, useState } from 'react';

export default function JourneyMap({ destination, onStop }) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [eta, setEta] = useState('');
  const [distance, setDistance] = useState('');
  const [is3D, setIs3D] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const markerRef = useRef(null);



  useEffect(() => {
    const initMap = () => {
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        zoom: 15,
        tilt: 0,
        heading: 0,
        mapTypeId: 'terrain',
        fullscreenControl: false,
        streetViewControl: false,
      });

      const dirRenderer = new window.google.maps.DirectionsRenderer({
        map: mapInstance,
        suppressMarkers: false,
      });

      setMap(mapInstance);
      setDirectionsRenderer(dirRenderer);
    };

    if (!window.google?.maps) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyC3Z3-dst23ovGuNx3gkVWuQALGSHaI8jA`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.body.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  useEffect(() => {
    if (!map || !destination || !window.google?.maps) return;

    const directionsService = new window.google.maps.DirectionsService();

    const watch = navigator.geolocation.watchPosition(
      (position) => {
        const current = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentPosition(current);
        if (map) {
            map.panTo(current);

  if (!markerRef.current) {
    markerRef.current = new window.google.maps.Marker({
      position: current,
      map: map,
      icon: {
        url: 'https://cdn-icons-png.flaticon.com/512/64/64113.png',
        scaledSize: new window.google.maps.Size(30, 30),
      },
      title: 'Your Location',
    });
  } else {
    markerRef.current.setPosition(current);
  }
}



        directionsService.route(
          {
            origin: current,
            destination,
            travelMode: 'DRIVING',
          },
          (result, status) => {
            if (status === 'OK') {
              directionsRenderer.setDirections(result);

              const leg = result.routes[0].legs[0];
              setEta(leg.duration.text);
              setDistance(leg.distance.text);
            }
          }
        );
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );

    setWatchId(watch);
  }, [map, destination]);

  const toggle3D = () => {
  if (!map) return;

  if (!is3D) {
    map.setMapTypeId('satellite');
    map.setZoom(18); // Must be zoomed in
    setTimeout(() => {
      map.setTilt(45);
      map.setHeading(90); // Optional
    }, 500); // Slight delay to allow map to re-render
  } else {
    map.setTilt(0);
    map.setHeading(0);
    map.setMapTypeId('terrain'); // or 'roadmap'
  }

  setIs3D(!is3D);
};



  return (
    <div style={{ height: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, zIndex: 9999 }}>
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
     
      {/* Tracking Panel */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '10px',
        display: 'flex',
        gap: '20px',
        fontSize: '14px',
        zIndex: 1000
      }}>
        <span>ETA: {eta || 'Loading...'}</span>
        <span>Distance: {distance || 'Loading...'}</span>
      </div>

      {/* 3D Toggle */}
      <button
        onClick={toggle3D}
        style={{
          position: 'absolute',
          bottom: '90px',
          right: '20px',
          backgroundColor: '#0a74da',
          color: 'white',
          border: 'none',
          padding: '10px 14px',
          borderRadius: '8px',
          fontWeight: 'bold',
        }}
      >
        {is3D ? 'Disable 3D' : 'Enable 3D'}
      </button>

      {/* Stop Journey */}
      <button
        onClick={() => {
          if (watchId) navigator.geolocation.clearWatch(watchId);
          onStop();
        }}
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '12px 24px',
          background: 'red',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontWeight: 'bold',
          fontSize: '16px'
        }}
      >
        Stop Journey
      </button>
    </div>
  );
}
