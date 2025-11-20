"use server"
import Papa from 'papaparse';

const DOC_ID = '1hZZzJVsMOcxghGi8jn7bSi96_aJ12LBO_935aM7zosE';

const SHEET_IDS = {
  items: '1562953263',
  taxis: '858405310',
  risk: '896225532',
  laws: '23265564',
  norms: '1563703116'
};

const fetchSheetData = async (gid) => {
  const url = `https://docs.google.com/spreadsheets/d/${DOC_ID}/export?gid=${gid}&format=csv`;
  console.log("Attempting to fetch URL:", url);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const csvText = await response.text();

    if (csvText.trim().startsWith('<!DOCTYPE html')) {
      throw new Error("Received HTML instead of CSV data. The Google Sheet is still private.");
    }

    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    console.log(`Successfully parsed GID ${gid}. Array length: ${parsed.data.length}`);
    return parsed.data;

  } catch (error) {
    console.error(`Error fetching sheet with GID ${gid}:`, error);
    return [];
  }
};

export const getAllSheets = async () => {
  const [items, taxis, risk, lawsSheet, normsSheet] = await Promise.all([
    fetchSheetData(SHEET_IDS.items),
    fetchSheetData(SHEET_IDS.taxis),
    fetchSheetData(SHEET_IDS.risk),
    fetchSheetData(SHEET_IDS.laws),
    fetchSheetData(SHEET_IDS.norms)
  ]);

  const cleanNum = (v) => {
    if (v === undefined || v === null || v === "") return null;
    const cleaned = Number(String(v).replace(/[^\d.-]/g, ""));
    return isNaN(cleaned) ? null : cleaned;
  };

  // --------------------------
  // ⭐ Convert Sheet → Array Shape
  // --------------------------
  const formatRules = (rows) =>
    rows.map((row) => {
      const lat = cleanNum(row.lat);
      const lng = cleanNum(row.lang);

      return {
        id: Number(row.id),
        title: row.title?.trim() || "",
        description: row.description?.trim() || "",
        location:
          lat !== null && lng !== null
            ? { lat, lng }
            : null,
      };
    });

  // Convert sheets
  const laws = formatRules(lawsSheet);
  const norms = formatRules(normsSheet);

  // --------------------------
  // ⭐ Build Taxis (unchanged except for return)
  // --------------------------
  const groupedTaxis = {};

  taxis.forEach((row) => {
    const id = cleanNum(row.Station);
    const lat = cleanNum(row.Lat);
    const lng = cleanNum(row.Ing);
    const name = row.Name?.trim() || "";

    if (!groupedTaxis[id]) {
      groupedTaxis[id] = {
        id,
        price: 5,
        road: [],
        names: [],
      };
    }

    if (!isNaN(lat) && !isNaN(lng)) {
      groupedTaxis[id].road.push({ lat, lng });
      groupedTaxis[id].names.push(name);
    }
  });

  const formattedTaxis = Object.values(groupedTaxis);

  // --------------------------
  // ⭐ Final return object
  // --------------------------
  return {
    items,
    taxis: formattedTaxis,
    risk,
    laws,
    norms,
  };
};
