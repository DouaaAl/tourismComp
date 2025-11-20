"use client"
import React, { useEffect, useState } from 'react'
import styles from "./taxi.module.css";
import { useMap } from "@vis.gl/react-google-maps";


const taxi = ({setFullRoad, userPos, data, taxiMin}) => {
  const map = useMap();
  const [NearBy, setNearby] = useState(false);
  
  // The start point is the relevant location for distance checks (first point in the road array)
  const road = data.road;
  const startPos = road[0]; 

  function getDistanceInKm(pos1, pos2) {
    const R = 6371; 
    const dLat = (pos2.lat - pos1.lat) * (Math.PI / 180);
    const dLng = (pos2.lng - pos1.lng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(pos1.lat * (Math.PI / 180)) *
      Math.cos(pos2.lat * (Math.PI / 180)) *
      Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Effect to check if taxi is nearby (using start position)
  useEffect(() => {
    if (!map || !userPos) return;

    const updateNearby = () => {
      const bounds = map.getBounds();
      if (!bounds) return;

      const distance = getDistanceInKm(userPos, startPos);
      const googleLatLng = new window.google.maps.LatLng(startPos.lat, startPos.lng);
      const insideBounds = bounds.contains(googleLatLng);

      // Check if within the filter distance or visible on the map
      setNearby(distance <= taxiMin || insideBounds);
    };

    updateNearby();

    const listener = map.addListener("bounds_changed", updateNearby);

    return () => listener.remove();
  }, [map, userPos, taxiMin, startPos]);

  // Function to calculate the FULL route using DirectionsService
  const calculateAndShowFullRoute = () => {
    if (road.length < 2 || !map || !window.google || !window.google.maps || !window.google.maps.DirectionsService) {
      console.error("Taxi route data is invalid or DirectionsService not available.");
      return;
    }
    
    // First point is origin, last is destination
    const origin = road[0];
    const destination = road[road.length - 1];
    
    // Intermediate points are waypoints
    const waypoints = road.slice(1, -1).map(p => ({
        location: p,
        stopover: true 
    }));
    
    const service = new window.google.maps.DirectionsService();
    
    service.route(
      {
        origin: origin, 
        destination: destination,
        waypoints: waypoints, 
        optimizeWaypoints: false, 
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK") {
          const path = result.routes[0].overview_path.map((p) => ({
            lat: p.lat(),
            lng: p.lng(),
          }));
          setFullRoad(path);
          
          // Fit map to the full route's bounds
          map.fitBounds(result.routes[0].bounds);

        } else {
          console.error("Taxi full route directions failed:", status);
          setFullRoad([]); 
        }
      }
    );
  };
  
  // NEW: Function to calculate route up to a specific waypoint, ensuring it follows the road network
  const calculateAndShowPartialRoute = (index) => {
    // index is the actual index in the 'road' array (where road[0] is the start)
    if (index < 1 || index >= road.length || !map || !window.google || !window.google.maps) {
      console.error("Invalid index or Maps services not available for partial route.");
      return;
    }
    
    // Origin is always the start
    const origin = road[0];
    // Destination is the selected point
    const destination = road[index];
    
    // Waypoints are all points between the origin (1) and the destination (index - 1)
    const waypoints = road.slice(1, index).map(p => ({
        location: p,
        stopover: true 
    }));
    
    const service = new window.google.maps.DirectionsService();
    
    service.route(
      {
        origin: origin, 
        destination: destination,
        waypoints: waypoints, 
        optimizeWaypoints: false, 
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK") {
          const path = result.routes[0].overview_path.map((p) => ({
            lat: p.lat(),
            lng: p.lng(),
          }));
          setFullRoad(path);
          
          // Pan to the final stop of the partial route
          map.panTo(destination); 

        } else {
          console.error(`Partial route directions failed for stop ${index}:`, status);
          setFullRoad([]); 
        }
      }
    );
  };

  const stopsCount = road.length - 2; 

  return (
    <>
      {NearBy && (
        <div className={styles.card}>
          <div className={styles.header}>
            <button
              onClick={calculateAndShowFullRoute} // Now shows the full, detailed route
              className={styles.locationButton}
            >
              See Full Detailed Route
            </button>
          </div>

          <div className={styles.price}>
            <h4>
              Price: <span>{data.price} DH</span>
            </h4>
          </div>

          <div className={styles.roadSection}>
            <h4>Route Stops:</h4>
            <ul className={styles.addressList}>
              {/* Iterating through all points except the first (Origin) */}
              {road.slice(1).map((item, index) => {
                // actualIndex is the index in the original 'road' array (1, 2, 3...)
                const actualIndex = index + 1;
                
                // Get the name from data.names using the actual index
                const addressName = data.names 
                    ? data.names[actualIndex] || `Stop ${actualIndex}` 
                    : `Stop ${actualIndex}`;
                
                return (
                  <li key={actualIndex}>
                    {addressName} 
                    <button
                      onClick={() => calculateAndShowPartialRoute(actualIndex)}
                      className={styles.viewButton}
                    >
                      View
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <button
            onClick={() => {
              setFullRoad([]); // Clear the displayed route
            }}
            className={styles.locationButton}
          >
            Clear Route
          </button>
        </div>
      )}
    </>
  )
}

export default taxi