"use client";
import React, { useState, useEffect } from "react";
import LawCard from "../../cards/law/LawCard.jsx";
import styles from "./section.module.css";
import { getAllSheets } from "../../../lib/googleSheets.js"; // <-- imported

const SectionLaws = ({ userPos }) => {
  const [laws, setLaws] = useState([]);
  const [lawDistance, setLawDistance] = useState(2);
  const [search, setSearch] = useState("");

  // Load laws from Google Sheets via getAllSheets()
  useEffect(() => {
    const loadData = async () => {
      try {
        const sheetsData = await getAllSheets();
        // Expecting sheetsData.laws to be your sheet tab
        const raw = sheetsData?.laws || [];

        const cleaned = raw.map((row) => ({
          id: Number(row.id),
          title: row.title,
          description: row.description,
          location:
            row.lat && row.lng
              ? { lat: Number(row.lat), lng: Number(row.lng) }
              : null,
        }));

        setLaws(cleaned);
      } catch (err) {
        console.error("Failed to load laws:", err);
      }
    };

    loadData();
  }, []);

  const filtered = laws.filter((law) =>
    (law.title + law.description).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <article className={styles.LawContent}>
      <h2>Laws Tourists Should Know</h2>

      <input
        className={styles.search}
        placeholder="Search laws..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <h4>Show laws near you</h4>
      <select
        className={styles.Select}
        onChange={(e) => setLawDistance(Number(e.target.value))}
        value={lawDistance}
      >
        <option value={1}>1 KM</option>
        <option value={2}>2 KM</option>
        <option value={5}>5 KM</option>
        <option value={10}>10 KM</option>
      </select>

      {filtered.map((law) => (
        <LawCard
          key={law.id}
          data={law}
          userPos={userPos}
          lawDistance={lawDistance}
        />
      ))}
    </article>
  );
};

export default SectionLaws;