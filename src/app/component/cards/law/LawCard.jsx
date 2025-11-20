"use client";
import React, { useEffect, useState } from "react";
import styles from "./law.module.css";

const LawCard = ({ data, userPos, lawDistance }) => {
  const [nearby, setNearby] = useState(true);

  function getDistanceInKm(pos1, pos2) {
    const R = 6371;
    const dLat = ((pos2.lat - pos1.lat) * Math.PI) / 180;
    const dLng = ((pos2.lng - pos1.lng) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((pos1.lat * Math.PI) / 180) *
        Math.cos((pos2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;

    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  useEffect(() => {
    // Always show when no location
    if (!data.location) {
      setNearby(true);
      return;
    }

    if (!userPos) return;

    const distance = getDistanceInKm(userPos, data.location);
    setNearby(distance <= lawDistance);
  }, [userPos, lawDistance, data.location]);

  if (!nearby) return null;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3>{data.title}</h3>
      </div>
      <p>{data.description}</p>
    </div>
  );
};

export default LawCard;
