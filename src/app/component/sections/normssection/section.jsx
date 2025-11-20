"use client";
import React, { useState, useEffect } from "react";
import NormCard from "../../cards/norm/norm";
import styles from "./section.module.css";
import { getAllSheets } from "../../../lib/googleSheets.js"; // <-- imported

const NormSection = ({ userPos }) => {
  const [norms, setNorms] = useState([]);
  const [normMin, setNormMin] = useState(2);
  const [search, setSearch] = useState("");

  // Load norms from Sheet
  useEffect(() => {
    const loadData = async () => {
      try {
        const sheetsData = await getAllSheets();
        const raw = sheetsData?.norms || [];

        const cleaned = raw.map((row) => ({
          id: Number(row.id),
          title: row.title,
          description: row.description,
          location:
            row.lat && row.lng
              ? { lat: Number(row.lat), lng: Number(row.lng) }
              : null,
        }));

        setNorms(cleaned);
      } catch (err) {
        console.error("Failed to load norms:", err);
      }
    };

    loadData();
  }, []);

  const filtered = norms.filter((n) =>
    (n.title + n.description).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <article className={styles.normContent}>
      <h2>Nearby Norms You Should Know</h2>

      <input
        className={styles.search}
        placeholder="Search norms..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <h3>Filter by Distance</h3>
      <select
        className={styles.Select}
        onChange={(e) => setNormMin(Number(e.target.value))}
        value={normMin}
      >
        <option value={1}>1 KM</option>
        <option value={2}>2 KM</option>
        <option value={5}>5 KM</option>
        <option value={10}>10 KM</option>
      </select>

      {filtered.map((norm) => (
        <NormCard
          key={norm.id}
          data={norm}
          userPos={userPos}
          normMin={normMin}
        />
      ))}
    </article>
  );
};

export default NormSection;