"use client";
import React, { useEffect, useState } from "react";
import styles from "./page.module.css";
import { getAllSheets } from "../lib/googleSheets";


const Page = () => {
  const placeholderImage =
    "https://via.placeholder.com/80?text=No+Image";

  const [items, setItems] = useState([]);

  // -------------------------
  // FILTER STATES
  // -------------------------
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchText, setSearchText] = useState("");

  // Extract unique categories for dropdown
  let [categories, setCategories] = useState([...new Set(items.map((item) => item.categories))].filter((item)=> item != " "));

  // -------------------------
  // FILTER LOGIC
  // -------------------------
  const filteredItems = items.filter((item) => {
    const matchCategory =
      selectedCategory === "" || item.categories === selectedCategory;
    const matchName = item.piece
      .toLowerCase()
      .includes(searchText.toLowerCase());

    return matchCategory && matchName;
  });

  const getItems = async() =>{
    let data = await getAllSheets();
    setItems(data.items);
  }

  useEffect(()=>{
    getItems();
  }, [])

  useEffect(()=>{
    setCategories([...new Set(items.map((item) => item.categories))].filter((item)=> item != " "));
  }, [items])

  return (
    <section className={styles.section}>
      <main>
      <h1 className={styles.title}>Prices</h1>
      {/* FILTER FORM */}
      <form className={styles.filters}>
        <label>
          Category:
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All</option>
            {categories.map((cat, i) => (
              <option key={i} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>

        <label>
          Name:
          <input
            type="text"
            placeholder="Search name..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </label>
      </form>        
      </main>

      {/* ITEMS GRID */}
      <article className={styles.itemsGrid}>
        {filteredItems.map((item, index) => (
          <div key={index} className={styles.itemCard}>
            <div>
              <h3>Image</h3>
              <h3>Item</h3>
              <h3>Unit</h3>
              <h3>Price</h3>
            </div>

            <div>
              <img
                src={item.imageLink || placeholderImage}
                alt={item.piece}
              />
              <h3>{item.piece}</h3>
              <h3>{item.unit}</h3>
              <h3>{item.price} DH</h3>
            </div>
          </div>
        ))}
      </article>
    </section>
  );
};

export default Page;
