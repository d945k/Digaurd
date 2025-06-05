// =============================================================
//  DiGuard Chrome Extension – background.js
//  v2.0 – Adds VirusTotal fallback when a URL is not on the
//        Google‑Sheet‑backed blacklist stored in IndexedDB.
// =============================================================

import {
  googleSheetApiKey,
  googleSheetId,
  virustotalApiKey, //  <‑‑  add this export to credentials.js
} from "./credentials.js";

// -------------------------------------------------------------
//  SECTION 1 – IndexedDB helper functions
// -------------------------------------------------------------
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("DiGuardDB", 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("blacklist")) {
        db.createObjectStore("blacklist", { keyPath: "domain" });
      }
      if (!db.objectStoreNames.contains("vt_cache")) {
        // Per‑URL cache for VirusTotal verdicts (keyPath: urlHash)
        db.createObjectStore("vt_cache", { keyPath: "h" });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function saveBlacklistToDB(blacklist) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("blacklist", "readwrite");
    const store = transaction.objectStore("blacklist");
    store.clear().onsuccess = () =>
      blacklist.forEach((item) => store.put(item));
    transaction.oncomplete = () => resolve();
    transaction.onerror = (e) => reject(e.target.error);
  });
}

async function getDomainRecord(domain) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("blacklist", "readonly");
    const req = tx.objectStore("blacklist").get(domain);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// -------  VirusTotal cached results (store: vt_cache) ----------
function sha256Base64(str) {
  // tiny helper – deterministic key. crypto.subtle is async, so wrap it.
  return crypto.subtle
    .digest("SHA-256", new TextEncoder().encode(str))
    .then((buf) => {
      const bytes = [...new Uint8Array(buf)];
      const bin = bytes.map((b) => String.fromCharCode(b)).join("");
      return btoa(bin)
        .replace(/=+$/, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
    });
}

async function getVtCache(urlHash) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db
      .transaction("vt_cache", "readonly")
      .objectStore("vt_cache")
      .get(urlHash);
    req.onsuccess = () => resolve(req.result?.v ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function putVtCache(urlHash, verdict) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("vt_cache", "readwrite");
    tx.objectStore("vt_cache").put({ h: urlHash, v: verdict, ts: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
}

// -------------------------------------------------------------
//  SECTION 2 – Google‑Sheet Blacklist sync
// -------------------------------------------------------------
async function fetchRestrictedDomains() {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${googleSheetId}/values/A:D?key=${googleSheetApiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.values || data.values.length < 2) return [];
  return data.values.slice(1).map((r) => ({
    domain: (r[0] || "").toLowerCase().replace(/^www\./, ""),
    category: r[1] || "Uncategorized",
    description: r[2] || "No description provided",
  }));
}

async function updateBlacklist() {
  const list = await fetchRestrictedDomains();
  await saveBlacklistToDB(list);
  console.log(`[DiGuard] Blacklist refreshed – ${list.length} domains.`);
}

chrome.runtime.onInstalled.addListener(updateBlacklist);
chrome.alarms.create("syncBlacklist", { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener(
  (a) => a.name === "syncBlacklist" && updateBlacklist()
);

// -------------------------------------------------------------
//  SECTION 3 – VirusTotal lookup helpers
// -------------------------------------------------------------
async function submitToVirusTotal(url) {
  const r = await fetch("https://www.virustotal.com/api/v3/urls", {
    method: "POST",
    headers: {
      "x-apikey": virustotalApiKey,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: "url=" + encodeURIComponent(url),
  });
  const j = await r.json();
  if (!j.data?.id) throw new Error("VT submission failed");
  return j.data.id;
}

async function waitForVtAnalysis(
  id,
  { maxWaitMs = 5 * 60_000, pollStep = 15_000 } = {}
) {
  const deadline = Date.now() + maxWaitMs;
  let step = pollStep;

  while (Date.now() < deadline) {
    const res = await fetch(
      `https://www.virustotal.com/api/v3/analyses/${id}`,
      { headers: { "x-apikey": virustotalApiKey } }
    );

    // public key → 4 req/min limit
    if (res.status === 429) {
      console.warn("[DiGuard] VT throttle hit – backing off");
      step = Math.max(step, 30_000); // wait ≥30 s next round
      await new Promise((r) => setTimeout(r, step));
      continue;
    }
    if (!res.ok) throw new Error(`VT error ${res.status}`);

    const json = await res.json();
    const status = json.data?.attributes?.status;

    if (status === "completed") return json;
    if (status === "error")
      throw new Error(
        `VT analysis failed: ${json.data?.attributes?.error ?? "unknown"}`
      );

    await new Promise((r) => setTimeout(r, step));
    step = Math.min(step * 1.5, 60_000); // exponential back‑off, cap 60 s
  }
  throw new Error("VT analysis timeout");
}

async function askVirusTotal(url) {
  const h = await sha256Base64(url);
  const cached = await getVtCache(h);
  if (cached) return cached;

  try {
    const id = await submitToVirusTotal(url);
    await new Promise((r) => setTimeout(r, 2000)); // 2 s head‑start
    const result = await waitForVtAnalysis(id);
    const s = result.data.attributes.stats;
    const verdict = {
      malicious: s.malicious + s.suspicious > 0,
      stats: s,
      scannedAt: result.data.attributes.date,
    };
    await putVtCache(h, verdict);
    return verdict;
  } catch (e) {
    console.error("[DiGuard] VirusTotal error:", e);
    return { malicious: false, stats: null, scannedAt: 0 };
  }
}

// -------------------------------------------------------------
//  SECTION 4 – Core navigation + download interception
// -------------------------------------------------------------
function normalizeDomain(u) {
  try {
    return new URL(u).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

async function evaluateUrl(url) {
  const domain = normalizeDomain(url);
  if (!domain) return { safe: true };

  const local = await getDomainRecord(domain);
  if (local) {
    return {
      safe: false,
      source: "sheet",
      category: local.category,
      description: local.description,
    };
  }

  console.log("[DiGuard] URL not found in local DB, checking VT...", url);

  const vt = await askVirusTotal(url);

  if (vt.malicious) {
    return {
      safe: false,
      source: "virustotal",
      category: "Malware / Phishing (VT)",
      description: `Flagged by VirusTotal: ${vt.stats.malicious} engines.`,
    };
  }
  return { safe: true };
}

function showWarning(tabId, info) {
  chrome.storage.local.set(
    {
      originalUrl: info.url,
      category: info.category,
      domainDescription: info.description,
      verdictSource: info.source,
    },
    () => {
      chrome.tabs.update(tabId, { url: chrome.runtime.getURL("warning.html") });
    }
  );
}

// --- Navigation ---
chrome.webNavigation.onBeforeNavigate.addListener(
  async (details) => {
    const url = details.url;
    if (url.includes(chrome.runtime.getURL("warning.html"))) return;

    const override = await new Promise((res) => {
      chrome.storage.local.get("proceedOverride", (r) =>
        res(r.proceedOverride)
      );
    });
    if (override && override === url) {
      chrome.storage.local.remove("proceedOverride");
      return;
    }

    try {
      const verdict = await evaluateUrl(url);
      if (!verdict.safe) {
        showWarning(details.tabId, { ...verdict, url });
      }
    } catch (e) {
      console.error("[DiGuard] navigation eval error", e);
    }
  },
  { url: [{ urlMatches: "http://*/*" }, { urlMatches: "https://*/*" }] }
);

// --- Downloads ---
chrome.downloads.onCreated.addListener(async (item) => {
  if (item.url.includes(chrome.runtime.getURL("warning.html"))) return;
  const verdict = await evaluateUrl(item.finalUrl || item.url);
  if (!verdict.safe) {
    chrome.downloads.cancel(item.id, () => {
      showWarning(null, { ...verdict, url: item.finalUrl || item.url });
    });
  }
});

// -------------------------------------------------------------
//  END OF FILE
// -------------------------------------------------------------
