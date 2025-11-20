"use client";

import {
  AdvancedMarker,
  APIProvider,
  Map,
  useMap,
  InfoWindow,
  useAdvancedMarkerRef,
} from "@vis.gl/react-google-maps";
import { useEffect, useState, useRef, useCallback } from "react";
import TaxiSection from "../component/sections/taxisection/section";
import SectionLaws from "../component/sections/lawssection/section";
import NormSection from "../component/sections/normssection/section";
import styles from "./page.module.css";
import { getAllSheets } from "../lib/googleSheets";

// -------------------------
// RED CIRCLES COMPONENT
// -------------------------
function RedCircles({ onCircleClick, riskData }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !window.google || !riskData || riskData.length === 0) return;

    const circlesAndMarkers = riskData.map((pos) => {
      const circle = new window.google.maps.Circle({
        strokeColor: "#ff0000",
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: "#ff0000",
        fillOpacity: 0.25,
        map,
        center: { lat: pos.lat, lng: pos.lng },
        radius: 180,
      });

      const label = new window.google.maps.Marker({
        position: { lat: pos.lat, lng: pos.lng },
        map,
        title: pos.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 0,
        },
      });

      circle.addListener("click", () => {
        map.panTo(circle.getCenter());
        map.setZoom(15);
        if (onCircleClick) onCircleClick(pos);
      });
      label.addListener("click", () => {
        map.panTo(label.getPosition());
        map.setZoom(15);
        if (onCircleClick) onCircleClick(pos);
      });

      return { circle, label };
    });

    return () => circlesAndMarkers.forEach((c) => { c.circle.setMap(null); c.label.setMap(null); });
  }, [map, onCircleClick, riskData]);

  return null;
}

// -------------------------
// USER MARKER (GPS)
// -------------------------
function UserMarker({ userPos }) {
  const [markerRef, marker] = useAdvancedMarkerRef();

  useEffect(() => {
    if (marker && userPos) {
      marker.position = userPos;
    }
  }, [marker, userPos]);

  if (!userPos) return null;

  return (
    <AdvancedMarker
      ref={markerRef}
      position={userPos}
      draggable={false}
      title="You"
    >
      <img
        src="/taxi.png"
        style={{ width: 40, height: 40 }}
        alt="You"
      />
    </AdvancedMarker>
  );
}

// -------------------------
// POLYLINE
// -------------------------
function CustomPolyline({ path, strokeColor = "#007aff", strokeOpacity = 0.8, strokeWeight = 5 }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !window.google) return;
    if (!path || path.length === 0) return;

    const polyline = new window.google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor,
      strokeOpacity,
      strokeWeight,
      map,
    });

    return () => polyline.setMap(null);
  }, [map, path, strokeColor, strokeOpacity, strokeWeight]);

  return null;
}

// -------------------------
// TAXI MARKERS
// -------------------------
const TaxiMarker = ({ taxiData, openInfoWindowId, setOpenInfoWindowId, setFullRoad, map }) => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const isOpen = openInfoWindowId === taxiData.id;

  const handleMarkerClick = () => {
    setOpenInfoWindowId(isOpen ? null : taxiData.id);
    if (!isOpen && map) map.panTo(taxiData.road[0]);
  };

  const calculateAndShowFullRoute = useCallback(() => {
    const road = taxiData.road;
    if (road.length < 2 || !map || !window.google || !window.google.maps || !window.google.maps.DirectionsService) {
      console.error("Taxi route data is invalid or DirectionsService not available.");
      return;
    }

    const origin = road[0];
    const destination = road[road.length - 1];
    const waypoints = road.slice(1, -1).map((p) => ({ location: p, stopover: true }));
    const service = new window.google.maps.DirectionsService();

    service.route(
      { origin, destination, waypoints, travelMode: window.google.maps.TravelMode.DRIVING },
      (result, status) => {
        if (status === "OK") {
          const path = result.routes[0].overview_path.map((p) => ({ lat: p.lat(), lng: p.lng() }));
          setFullRoad(path);
          map.fitBounds(result.routes[0].bounds);
          setOpenInfoWindowId(null);
        } else {
          console.error("Taxi full route directions failed:", status);
          setFullRoad([]);
        }
      }
    );
  }, [taxiData, map, setFullRoad, setOpenInfoWindowId]);

  return (
    <>
      <AdvancedMarker ref={markerRef} position={taxiData.road[0]} onClick={handleMarkerClick} title={`Taxi ID: ${taxiData.id} - ${taxiData.names[0]}`}>
        <img src="/taxi.png" style={{ width: 45, height: 45, cursor: "pointer" }} alt="Taxi" />
      </AdvancedMarker>

      {isOpen && (
        <InfoWindow anchor={marker} onCloseClick={() => setOpenInfoWindowId(null)}>
          <div className={styles.infoWindowContent}>
            <h3 style={{ color: "black", marginBottom: 8 }}>Taxi Destinations</h3>
            <p style={{ margin: 2 }}>
              <strong>Origin:</strong> {taxiData.names[0]}
            </p>
            <p style={{ margin: 2 }}>
              <strong>Stops:</strong> {taxiData.road.length - 1}
            </p>
            <p style={{ margin: 2 }}>
              <strong>Price:</strong> {taxiData.price} DH
            </p>
            <button
              onClick={calculateAndShowFullRoute}
              style={{ backgroundColor: "#007aff", color: "#fff", padding: "8px 12px", borderRadius: 8, border: "none", width: "100%", marginTop: 10 }}
            >
              View Full Route
            </button>
          </div>
        </InfoWindow>
      )}
    </>
  );
};

const TaxiMarkers = ({ taxis, setFullRoad }) => {
  const map = useMap();
  const [openInfoWindowId, setOpenInfoWindowId] = useState(null);
  if (!taxis || taxis.length === 0) return null;
  return taxis.map((taxi) => (
    <TaxiMarker key={taxi.id} taxiData={taxi} openInfoWindowId={openInfoWindowId} setOpenInfoWindowId={setOpenInfoWindowId} setFullRoad={setFullRoad} map={map} />
  ));
};

// -------------------------
// MAP CONTROLLER
// -------------------------
function MapController({ selectedPoint, setSelectedPoint, setCenter }) {
  const map = useMap();
  useEffect(() => {
    if (selectedPoint && map) {
      map.panTo(selectedPoint);
      setCenter(selectedPoint);
      setSelectedPoint(null);
    }
  }, [selectedPoint, map, setCenter, setSelectedPoint]);
  return null;
}

// -------------------------
// MAIN COMPONENT
// -------------------------
export default function Home() {
  const [infoCurrent, setInfoCurrent] = useState({ taxis: true, laws: false, norms: false });
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [center, setCenter] = useState({ lat: 34.256, lng: -6.554 });
  const [userPos, setUserPos] = useState(null);
  const [fullRoad, setFullRoad] = useState([]);
  const [originMarker, setOriginMarker] = useState(null);
  const [destinationMarker, setDestinationMarker] = useState(null);

  // ⭐️ Dynamically loaded Google Sheets data
  const [googleSheetArrays, setGoogleSheetArray] = useState(null); 
  const [riskZones, setRiskZones] = useState([]); 

  const originRef = useRef(null);
  const destinationRef = useRef(null);

  const options = { mapId: "18b5d155a199e5b63d22784f" };

  const getArrays = async() => {
    let data = await getAllSheets();
    setGoogleSheetArray(data);
    
    if (data && data.risk) {
      const newRiskZones = data.risk.map(item => ({
        lat: parseFloat(item.Latitude), 
        lng: parseFloat(item.Longitude),
        name: item.Name,
      }));
      setRiskZones(newRiskZones);
      console.log("Loaded risk zones from sheet:", newRiskZones.length);
    } else {
      console.error("Could not load risk data from Google Sheets.");
    }
  }

  useEffect(() => {
    getArrays();
    if (!navigator.geolocation) return;
    const watch = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(coords);
      },
      (err) => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watch);
  }, []);

  useEffect(() => {
    if (!window.google || !window.google.maps || !window.google.maps.places) return;
    if (!originRef.current || !destinationRef.current) return;

    const originAuto = new window.google.maps.places.Autocomplete(originRef.current);
    originAuto.addListener("place_changed", () => {
      const place = originAuto.getPlace();
      if (!place.geometry) return;
      const loc = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
      setOriginMarker(loc);
      setCenter(loc);
      setSelectedPoint(loc);
    });

    const destAuto = new window.google.maps.places.Autocomplete(destinationRef.current);
    destAuto.addListener("place_changed", () => {
      const place = destAuto.getPlace();
      if (!place.geometry) return;
      const loc = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
      setDestinationMarker(loc);
    });

    const onFocus = () => {
      if (originRef.current) {
        originRef.current.value = userPos ? "Current location" : "Acquiring current location...";
        if (userPos) {
          setOriginMarker(userPos);
          setCenter(userPos);
          setSelectedPoint(userPos);
        }
      }
    };
    originRef.current.addEventListener("focus", onFocus);

    return () => {
      originRef?.current?.removeEventListener("focus", onFocus);
    };
  }, [userPos]);

  useEffect(() => {
    if (originMarker && destinationMarker && window.google && window.google.maps) {
      // FIX START: Ensure coordinates are valid numbers before calling route
      if (
        typeof originMarker.lat !== 'number' || 
        typeof originMarker.lng !== 'number' ||
        typeof destinationMarker.lat !== 'number' ||
        typeof destinationMarker.lng !== 'number'
      ) {
        return;
      }
      // FIX END

      const service = new window.google.maps.DirectionsService();
      service.route(
        { origin: originMarker, destination: destinationMarker, travelMode: window.google.maps.TravelMode.DRIVING },
        (result, status) => {
          if (status === "OK") {
            const path = result.routes[0].overview_path.map((p) => ({ lat: p.lat(), lng: p.lng() }));
            setFullRoad(path);
          } else if (status === "ZERO_RESULTS") {
             // FIX: Handle ZERO_RESULTS gracefully
             console.warn("No driving route found between these points.");
             setFullRoad([]);
          } else {
            console.error("Directions failed:", status);
            setFullRoad([]);
          }
        }
      );
    }
  }, [originMarker, destinationMarker]);

  const onCircleClick = (pos) => {
    setSelectedPoint({ lat: pos.lat, lng: pos.lng });
  };

  // ⭐️ Replace hardcoded taxis with dynamic Google Sheet data
  const allTaxis = googleSheetArrays?.taxis || [];

  return (
    <APIProvider libraries={["places", "marker"]} apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyDkLcwpHjqYo0T-57cJUjnYpW2NUo5IH48"}>
      <div className={styles.grid}>
        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <label>
            Origin:
            <input ref={originRef} type="text" placeholder="Enter origin" />
          </label>

          <label>
            Destination:
            <input ref={destinationRef} type="text" placeholder="Enter destination" />
          </label>
        </form>

        <section className={styles.infoSection}>
          <div className={styles.options}>
            <button onClick={() => setInfoCurrent({ taxis: true, laws: false, norms: false })}>Taxis</button>
            <button onClick={() => setInfoCurrent({ taxis: false, laws: true, norms: false })}>Laws</button>
            <button onClick={() => setInfoCurrent({ taxis: false, laws: false, norms: true })}>Social Norms</button>
          </div>

          {infoCurrent.taxis && <TaxiSection userPos={userPos} setFullRoad={setFullRoad} fullRoad={fullRoad} taxis={allTaxis} />}
          {infoCurrent.laws && <SectionLaws userPos={userPos} setFullRoad={setFullRoad} fullRoad={fullRoad} />}
          {infoCurrent.norms && <NormSection userPos={userPos} setFullRoad={setFullRoad} fullRoad={fullRoad} />}
        </section>

        <Map styles={{ width: "70vw" }} className={styles.Map} defaultCenter={center} defaultZoom={14} options={options} gestureHandling="greedy" disableDefaultUI>
          <CustomPolyline path={fullRoad} />
          {originMarker && <AdvancedMarker position={originMarker} />}
          {destinationMarker && <AdvancedMarker position={destinationMarker} />}
          <TaxiMarkers taxis={allTaxis} setFullRoad={setFullRoad} />
          <RedCircles onCircleClick={onCircleClick} riskData={riskZones} />
          <UserMarker userPos={userPos} />
          <MapController selectedPoint={selectedPoint} setSelectedPoint={setSelectedPoint} setCenter={setCenter} />
        </Map>
      </div>
    </APIProvider>
  );
}