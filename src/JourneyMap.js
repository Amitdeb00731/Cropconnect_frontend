import React, { useEffect, useRef, useState } from 'react';


let lastSpoken = '';

function speakDirection(text) {
  if (!text || text === lastSpoken) return;

  const utterance = new SpeechSynthesisUtterance(stripHtml(text));
  utterance.lang = 'en-US';
  utterance.pitch = 1;
  utterance.rate = 1;
  window.speechSynthesis.speak(utterance);

  lastSpoken = text;
}

function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}


export default function JourneyMap({ destination, onStop }) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [eta, setEta] = useState('');
  const [distance, setDistance] = useState('');
  const [is3D, setIs3D] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const markerRef = useRef(null);
  const [watchId, setWatchId] = useState(null);

  useEffect(() => {
    const initMap = () => {
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        zoom: 18,
        tilt: 0,
        heading: 0,
        mapTypeId: 'terrain',
        fullscreenControl: false,
        streetViewControl: false,
        gestureHandling: 'greedy',
      });

      const dirRenderer = new window.google.maps.DirectionsRenderer({
        map: mapInstance,
        suppressMarkers: false,
        preserveViewport: true,
        panel: document.getElementById('instructions-panel'),
      });

      setMap(mapInstance);
      setDirectionsRenderer(dirRenderer);
    };

    if (!window.google?.maps) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`;
      script.setAttribute('async', '');
      script.setAttribute('defer', '');
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
          const bounds = map.getBounds();
          if (!bounds || !bounds.contains(current)) {
            map.panTo(current);
          }
        }

        if (!markerRef.current && map) {
          markerRef.current = new google.maps.marker.AdvancedMarkerElement({
            position: current,
            map,
            icon: {
              url: 'https://cdn-icons-png.flaticon.com/512/64/64113.png',
              scaledSize: new window.google.maps.Size(30, 30),
            },
            title: 'Your Location',
          });
        } else {
          markerRef.current.setPosition(current);
        }

        directionsService.route(
          {
            origin: current,
            destination,
            travelMode: 'DRIVING',
            provideRouteAlternatives: true,
          },
          (result, status) => {
            if (status === 'OK') {
              if (status === 'OK') {
  directionsRenderer.setDirections(result);

  const leg = result.routes[0].legs[0];
  setEta(leg.duration.text);
  setDistance(leg.distance.text);

  const steps = leg.steps;
  const currentStep = steps[0]; // We'll detect the closest one dynamically
  const nextInstruction = steps[1]?.instructions || '';

  speakDirection(nextInstruction); // 🔊 Speak next turn
}

            } else {
              console.warn('Route error:', status);
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
      map.setZoom(18);
      setTimeout(() => {
        map.setTilt(45);
        map.setHeading(90);
      }, 500);
    } else {
      map.setTilt(0);
      map.setHeading(0);
      map.setMapTypeId('terrain');
    }

    setIs3D(!is3D);
  };

  const stopJourney = () => {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    onStop();
  };

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, zIndex: 9999 }}>
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />

      {/* ETA & Distance Panel */}
      <div style={{
      position: 'absolute',
      top: '10px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(0,0,0,0.7)',
      color: 'white',
      padding: '8px 16px',
      borderRadius: '10px',
      display: 'flex',
      gap: '16px',
      fontSize: '14px',
      zIndex: 1000,
      flexWrap: 'wrap'
    }}>
        <span>ETA: {eta || 'Loading...'}</span>
        <span>Distance: {distance || 'Loading...'}</span>
      </div>

      {/* Turn-by-turn Instructions */}
      <div id="instructions-panel" style={{
      position: 'absolute',
      right: '0',
      top: '70px',
      bottom: '0',
      width: '300px',
      maxWidth: '90vw',
      overflowY: 'auto',
      background: 'white',
      zIndex: 1000,
      padding: '10px',
      boxShadow: '0 0 10px rgba(0,0,0,0.2)'
    }} />
    <div style={{
      position: 'absolute',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px',
      zIndex: 1000
    }}></div>

      {/* 3D Toggle Button */}
     <button onClick={toggle3D} style={{
        backgroundColor: '#0a74da',
        color: 'white',
        border: 'none',
        padding: '10px 14px',
        borderRadius: '8px',
        fontWeight: 'bold',
        width: '160px'
      }}>
        {is3D ? 'Disable 3D' : 'Enable 3D'}
      </button>

     <button onClick={() => window.speechSynthesis.cancel()} style={{
        backgroundColor: '#555',
        color: 'white',
        border: 'none',
        padding: '10px 14px',
        borderRadius: '8px',
        fontWeight: 'bold',
        width: '160px'
      }}>
        Mute Voice
      </button>

      {/* Stop Button */}
       <button onClick={stopJourney} style={{
        padding: '12px 24px',
        background: 'red',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontWeight: 'bold',
        fontSize: '16px',
        width: '160px'
      }}>
        Stop Journey
      </button>
    </div>
  );
}
