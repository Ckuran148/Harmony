import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// CONFIGURATION
const REFRESH_RATE = 300000; // 5 minutes
const ALERT_ROTATION_RATE = 5000;
const JOLT_REFRESH_RATE = 300000; // 5 minutes

const firebaseConfig = {
  apiKey: "AIzaSyCIBUjhkYDcSPMAiowao6NUCOdOb_V73m8",
  authDomain: "harmony9503.firebaseapp.com",
  projectId: "harmony9503",
  storageBucket: "harmony9503.firebasestorage.app",
  messagingSenderId: "244278361492",
  appId: "1:244278361492:web:a18a7a5a6351a26f9ea381",
  measurementId: "G-47T5G80056",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// JOLT CONFIG
const JOLT_ENDPOINT = "https://jolt-proxy.ckuran.workers.dev";
const JOLT_HEADERS = { "Content-Type": "application/json" };

// ... (Queries remain the same)
const CHECKLIST_QUERY = `
    query ListInstances($filter: ListInstancesFilter!, $mode: ModeInput) {
        listInstances(filter: $filter, mode: $mode) {
            id, instanceTitle, completionTimestamp, listTemplate { title }, displayTimestamp, createTimestamp, deadlineTimestamp
        }
    }
`;

const SENSOR_QUERY = `
    query ExampleQuery($mode: ModeInput!, $filter: SensorDeviceFilter, $scenarioEventsFilter: ScenarioEventsFilter) {
        sensorDevices(mode: $mode, filter: $filter, scenarioEventsFilter: $scenarioEventsFilter) {
            name, readings { value type }, lastReadTime, signalStrength, batteryLevel
            scenarioEvents { alertType, isActive, readingType }
        }
    }
`;

const urlParams = new URLSearchParams(window.location.search);
const storeID = urlParams.get("store");

// GLOBAL STATE
let activeSchedule = [];
let activeAlerts = [];
let currentAlertIndex = 0;
let cachedJoltId = null;

// Scroll Timers (Only for Jolt now)
let joltScrollIntervalCurrent = null;
let joltScrollIntervalUpcoming = null;
let lastJoltFetch = 0;

// --- CORE FUNCTION ---
async function fetchData() {
  if (!storeID) {
    document.getElementById("alert-section").innerText =
      "ERROR: URL needs ?store=XXX";
    document.getElementById("alert-section").style.backgroundColor = "black";
    return;
  }

  document.getElementById("site-indicator").innerText = storeID;

  try {
    const storeSnap = await getDoc(doc(db, "stores", storeID));

    if (!storeSnap.exists()) {
      document.getElementById("alert-section").innerText =
        "ERROR: Store not found in Database";
      return;
    }

    const storeData = storeSnap.data();
    const marketName = storeData.market;
    const districtName = storeData.district;

    const [generalSnap, marketSnap, districtSnap] = await Promise.all([
      getDoc(doc(db, "company", "general")),
      marketName
        ? getDoc(doc(db, "markets", marketName))
        : Promise.resolve({ exists: () => false }),
      districtName
        ? getDoc(doc(db, "districts", districtName))
        : Promise.resolve({ exists: () => false }),
    ]);

    const generalData = generalSnap.exists() ? generalSnap.data() : {};
    const marketData = marketSnap.exists() ? marketSnap.data() : {};
    const districtData = districtSnap.exists() ? districtSnap.data() : {};

    // ALERTS & MASTER DATA
    const rawAlerts = [
      ...(generalData.alerts || []),
      ...(marketData.alerts || []),
      ...(districtData.alerts || []),
      ...(storeData.alerts || []),
    ];
    activeAlerts = rawAlerts.filter(isAlertActive);

    const alertBox = document.getElementById("alert-section");
    if (activeAlerts.length === 0) {
      activeAlerts = [{ text: `Dashboard - ${storeID}`, type: "normal" }];
    }

    // Always show the first active alert immediately and set initial state
    const firstAlert = activeAlerts[0];
    alertBox.innerText = firstAlert.text;
    if (firstAlert.type === "warning") {
      alertBox.style.backgroundColor = "#b00000";
      alertBox.style.color = "#ffffff";
    } else if (firstAlert.type === "info") {
      alertBox.style.backgroundColor = "#005cc8";
      alertBox.style.color = "#ffffff";
    } else if (firstAlert.type === "custom") {
      alertBox.style.backgroundColor = firstAlert.bgColor || "#028a0f";
      alertBox.style.color = firstAlert.textColor || "#ffffff";
    } else {
      alertBox.style.backgroundColor = "#028a0f";
      alertBox.style.color = "#ffffff";
    }
    alertBox.style.opacity = 1;
    currentAlertIndex = 0; // Reset index on data fetch

    const mergedData = {
      storeName: storeData.storeName || "Wendy's Dashboard",
      announcements: [
        ...(generalData.announcements || []),
        ...(marketData.announcements || []),
        ...(districtData.announcements || []),
        ...(storeData.announcements || []),
      ],
      ltos: [
        ...(generalData.ltos || []),
        ...(marketData.ltos || []),
        ...(districtData.ltos || []),
        ...(storeData.ltos || []),
      ],
      disengagements: [
        ...(generalData.disengagements || []),
        ...(marketData.disengagements || []),
        ...(districtData.disengagements || []),
        ...(storeData.disengagements || []),
      ],
      events: [
        ...(generalData.events || []),
        ...(marketData.events || []),
        ...(districtData.events || []),
        ...(storeData.events || []),
      ],
      closureDates: [
        ...(generalData.closureDates || []),
        ...(marketData.closureDates || []),
        ...(districtData.closureDates || []),
        ...(storeData.closureDates || []),
      ],
      joltLocationId: storeData.joltLocationId,
    };

    if (mergedData.joltLocationId) cachedJoltId = mergedData.joltLocationId;
    else {
      console.log("No Jolt ID in DB, using storeID as fallback:", storeID);
      cachedJoltId = storeID;
    }

    if (storeData.daypartSchedule) activeSchedule = storeData.daypartSchedule;
    else if (generalData.daypartSchedule)
      activeSchedule = generalData.daypartSchedule;

    const isClosed = checkClosure(mergedData.closureDates);

    if (!isClosed) {
      updateDashboardContent(mergedData);
      if (activeSchedule.length > 0) updateDaypart();

      const now = Date.now();
      if (cachedJoltId && now - lastJoltFetch >= JOLT_REFRESH_RATE) {
        lastJoltFetch = now;
        fetchChecklists(cachedJoltId);
        fetchSensors(cachedJoltId);
      } else if (!cachedJoltId) {
        document.getElementById("jolt-list-current").innerHTML =
          "<li>No Jolt ID</li>";
      }
    }
  } catch (error) {
    console.error("Error loading data:", error);
  }
}

// --- 1. CHECKLIST LOGIC ---
async function fetchChecklists(locationId) {
  const listCurrent = document.getElementById("jolt-list-current");
  const scrollCurrent = document.getElementById("jolt-scroll-current");
  const listUpcoming = document.getElementById("jolt-list-upcoming");
  const scrollUpcoming = document.getElementById("jolt-scroll-upcoming");

  if (joltScrollIntervalCurrent) clearInterval(joltScrollIntervalCurrent);
  if (joltScrollIntervalUpcoming) clearInterval(joltScrollIntervalUpcoming);
  scrollCurrent.scrollTop = 0;
  scrollUpcoming.scrollTop = 0;

  const nowSeconds = Math.floor(Date.now() / 1000);

  // 31 DAYS AHEAD WINDOW
  const pastWindow = nowSeconds - 31 * 24 * 60 * 60;
  const futureWindow = nowSeconds + 31 * 24 * 60 * 60;
  const threeHoursLater = nowSeconds + 3 * 60 * 60;
  const expiredCutoff = nowSeconds - 24 * 60 * 60;

  const filter = {
    deadlineAfterTimestamp: pastWindow,
    deadlineBeforeTimestamp: futureWindow,
    completionStatus: "INCOMPLETE",
    isSublist: false,
  };
  const variables = { filter, mode: { mode: "LOCATION", id: locationId } };

  try {
    const res = await fetch(JOLT_ENDPOINT, {
      method: "POST",
      headers: JOLT_HEADERS,
      body: JSON.stringify({ query: CHECKLIST_QUERY, variables }),
    });
    const payload = await res.json();
    const lists = payload.data?.listInstances || [];
    const incomplete = lists.filter((l) => !l.completionTimestamp);

    listCurrent.innerHTML = "";
    listUpcoming.innerHTML = "";

    if (incomplete.length === 0) {
      listCurrent.innerHTML =
        '<li style="color: #028a0f;">✅ All Caught Up!</li>';
      return;
    }

    incomplete.sort(
      (a, b) => (a.displayTimestamp || 0) - (b.displayTimestamp || 0),
    );

    const currentItems = [];
    const upcomingItems = [];

    incomplete.forEach((l) => {
      const disp = l.displayTimestamp || 0;
      const dead = l.deadlineTimestamp || 0;

      if (disp > nowSeconds) {
        // UPCOMING
        if (disp <= threeHoursLater)
          upcomingItems.push({ item: l, status: "upcoming" });
      } else {
        // CURRENT / LATE
        if (dead > 0 && dead < expiredCutoff) return; // Expired > 24h ago

        if (dead > 0 && dead < nowSeconds)
          currentItems.push({ item: l, status: "late" });
        else currentItems.push({ item: l, status: "active" });
      }
    });

    if (currentItems.length > 0)
      currentItems.forEach((obj) => renderJoltItem(obj, listCurrent));
    else listCurrent.innerHTML = '<li style="color: #028a0f;">✅ Complete</li>';

    if (upcomingItems.length > 0)
      upcomingItems.forEach((obj) => renderJoltItem(obj, listUpcoming));
    else listUpcoming.innerHTML = '<li style="color: #555;">None soon</li>';

    setTimeout(() => {
      startJoltScroll(scrollCurrent, listCurrent, "current");
      startJoltScroll(scrollUpcoming, listUpcoming, "upcoming");
    }, 1000);
  } catch (err) {
    console.error("Checklist Error", err);
  }
}

function renderJoltItem(dataObj, container) {
  const item = dataObj.item;
  const status = dataObj.status;
  let rawName =
    (item.instanceTitle && item.instanceTitle.trim()) ||
    (item.listTemplate && item.listTemplate.title) ||
    `Checklist ${item.id}`;
  const li = document.createElement("li");
  li.className = "jolt-item";
  if (rawName.includes("🟧")) li.classList.add("jolt-important");
  const cleanName = rawName
    .replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
      "",
    )
    .trim();

  if (status === "late") {
    li.classList.add("jolt-late");
    li.innerHTML = `⚠️ ${cleanName}`;
  } else {
    li.textContent = cleanName;
  }
  container.appendChild(li);
}

// --- 2. SENSOR LOGIC ---
async function fetchSensors(locationId) {
  const grid = document.getElementById("sensor-grid");

  const FILTER_DATA = {
    locationIds: locationId,
    isActive: true,
    alertTypes: ["WARNING", "ALERT"],
    readingTypes: "TEMPERATURE",
  };

  const SCENARIO_FILTER = {
    alertTypes: ["ALERT", "WARNING"],
    isCurrent: true,
    readingType: "TEMPERATURE",
  };

  const variables = {
    mode: {
      mode: "CONTENT_GROUP",
      id: "Q29udGVudEdyb3VwOjAwMDU4NzViMjYwZDRjNmI2NDdhNjBjZDAxNDFlZDU2",
    },
    filter: FILTER_DATA,
    scenarioEventsFilter: SCENARIO_FILTER,
  };

  try {
    const res = await fetch(JOLT_ENDPOINT, {
      method: "POST",
      headers: JOLT_HEADERS,
      body: JSON.stringify({ query: SENSOR_QUERY, variables }),
    });
    const json = await res.json();
    const sensors = json.data?.sensorDevices || [];

    grid.innerHTML = "";
    if (sensors.length > 0) {
      sensors.forEach((s) => renderSensorCard(s, grid));
    } else {
      grid.innerHTML =
        "<div style='color:#555; padding:10px;'>No Sensors Found</div>";
    }
  } catch (err) {
    console.error("Sensor Error", err);
  }
}

function renderSensorCard(sensor, grid) {
  const displayName = sensor.name.includes("-")
    ? sensor.name.split("-").slice(1).join("-").trim()
    : sensor.name.trim();
  const tempReading = sensor.readings.find(
    (r) => r.type === "VOLTAGE" || r.type === "TEMPERATURE",
  );
  let tempF = "N/A";
  if (tempReading && !isNaN(tempReading.value))
    tempF = ((tempReading.value * 9) / 5 + 32).toFixed(1) + "°F";

  const fifteenMinutesAgo = Date.now() - 900000; // 15 minutes in milliseconds
  const offline =
    sensor.signalStrength === "No Signal" ||
    sensor.lastReadTime * 1000 < fifteenMinutesAgo;

  // Alert Indicators
  let tempClass = "";
  if (offline) {
    tempClass = "blink";
  } else if (sensor.scenarioEvents && sensor.scenarioEvents.length > 0) {
    const tempEvents = sensor.scenarioEvents.filter(
      (ev) => ev.isActive && ev.readingType === "TEMPERATURE",
    );
    if (tempEvents.some((ev) => ev.alertType === "ALERT"))
      tempClass = "temp-critical";
    else if (tempEvents.some((ev) => ev.alertType === "WARNING"))
      tempClass = "temp-warning";
  }

  let batHtml = '<span class="battery-good">🔋</span>';
  if (sensor.batteryLevel <= 20)
    batHtml = '<span class="battery-low">🪫</span>';
  else if (sensor.batteryLevel <= 59)
    batHtml = '<span class="battery-med">🔋</span>';

  const card = document.createElement("div");
  card.className = "sensor-card";
  card.innerHTML = `
        <div>
            <h3>${displayName}</h3>
            <div class="reading ${tempClass}">${tempF}</div>
            ${offline ? '<div class="last-reading-indicator">Last Reading</div>' : ""}
        </div>
        <div class="signal-row">
            ${batHtml}
            <span class="sensor-status-text" style="color: #888;">${offline ? "No Sig" : "On Line"}</span>
        </div>
    `;
  grid.appendChild(card);
}

// --- SCROLL HELPERS ---
function startJoltScroll(container, listElement, type) {
  if (listElement.scrollHeight <= container.clientHeight) return;
  const clone = listElement.cloneNode(true);
  clone.id = `jolt-clone-${type}`;
  container.appendChild(clone);
  const speed = 1;
  const interval = setInterval(() => {
    container.scrollTop += speed;
    if (container.scrollTop >= listElement.scrollHeight)
      container.scrollTop = 0;
  }, 50);
  if (type === "current") joltScrollIntervalCurrent = interval;
  else joltScrollIntervalUpcoming = interval;
}

// --- HELPERS (Standard) ---
function isAlertActive(config) {
  if (!config || !config.text) return false;
  if (!config.startDate && !config.endDate) return true;
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  if (config.startDate && todayStr < config.startDate) return false;
  if (config.endDate && todayStr > config.endDate) return false;
  return true;
}

function rotateAlert() {
  if (activeAlerts.length <= 1) return;
  currentAlertIndex = (currentAlertIndex + 1) % activeAlerts.length;
  const alert = activeAlerts[currentAlertIndex];
  const alertBox = document.getElementById("alert-section");
  alertBox.style.opacity = 0;
  setTimeout(() => {
    alertBox.innerText = alert.text;
    if (alert.type === "warning") {
      alertBox.style.backgroundColor = "#b00000";
      alertBox.style.color = "#ffffff";
    } else if (alert.type === "info") {
      alertBox.style.backgroundColor = "#005cc8";
      alertBox.style.color = "#ffffff";
    } else if (alert.type === "custom") {
      alertBox.style.backgroundColor = alert.bgColor || "#028a0f";
      alertBox.style.color = alert.textColor || "#ffffff";
    } else {
      alertBox.style.backgroundColor = "#028a0f";
      alertBox.style.color = "#ffffff";
    }
    alertBox.style.opacity = 1;
  }, 200);
}
function updateDaypart() {
  if (activeSchedule.length === 0) return;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  let text = "PREP / OFF HOURS";
  let bgColor = "#333";
  let textColor = "#fff";
  for (let i = 0; i < activeSchedule.length; i++) {
    const phase = activeSchedule[i];
    const startMin = timeToMinutes(phase.startTime);
    const endMin = timeToMinutes(phase.endTime);
    if (currentMinutes >= startMin && currentMinutes < endMin) {
      const displayStart = formatTimeDisplay(phase.startTime);
      const displayEnd = formatTimeDisplay(phase.endTime);
      text = `${phase.icon} ${phase.name} • ${displayStart} - ${displayEnd}`;
      bgColor = phase.color;
      textColor = phase.textColor;
      break;
    }
  }
  const dpDiv = document.getElementById("daypart-section");
  dpDiv.innerText = text;
  dpDiv.style.backgroundColor = bgColor;
  dpDiv.style.color = textColor;
}

function checkClosure(datesList) {
  const overlay = document.getElementById("closed-overlay");
  if (!datesList || datesList.length === 0) {
    overlay.style.display = "none";
    return false;
  }
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const todayStr = `${year}-${month}-${day}`;
  if (datesList.includes(todayStr)) {
    overlay.style.display = "flex";
    return true;
  } else {
    overlay.style.display = "none";
    return false;
  }
}

function updateDashboardContent(data) {
  if (data.storeName) document.title = data.storeName;
  updateList("announcements-list", data.announcements);
  updateList("events-list", data.events);
  const taggedLTOs = (data.ltos || []).map(item => ({ ...item, _type: "lto" }));
  const taggedDisengagements = (data.disengagements || []).map(item => ({ ...item, _type: "disengagement" }));
  updateLTOList("lto-list", [...taggedLTOs, ...taggedDisengagements]);
}

function updateList(elementId, items) {
  const list = document.getElementById(elementId);
  list.innerHTML = "";
  const now = new Date().toISOString().split("T")[0];

  if (items && items.length > 0) {
    items.forEach((item) => {
      let text = typeof item === "string" ? item : item.text;
      let startDate = typeof item === "object" ? item.startDate : null;
      let endDate = typeof item === "object" ? item.endDate : null;

      if (startDate && now < startDate) return; // Not started yet
      if (endDate && now > endDate) return; // Expired

      const li = document.createElement("li");
      li.innerText = text;
      list.appendChild(li);
    });
  }

  if (list.children.length === 0) list.innerHTML = "<li>No updates.</li>";
}

function updateLTOList(elementId, items) {
  const list = document.getElementById(elementId);
  list.innerHTML = "";
  if (items && items.length > 0)
    items.forEach((item) => {
      const li = document.createElement("li");
      li.className = "lto-item";

      // Create left column for visual (Icon/Image + Countdown)
      const leftCol = document.createElement("div");
      leftCol.style.display = "flex";
      leftCol.style.flexDirection = "column";
      leftCol.style.alignItems = "center";
      leftCol.style.marginRight = "15px";
      leftCol.style.minWidth = "80px"; // Ensure consistent width
      leftCol.style.maxWidth = "80px";
      leftCol.style.flexShrink = "0";

      if (item._type === "disengagement") {
        const badge = document.createElement("div");
        badge.innerText = "DISENGAGING";
        badge.style.fontWeight = "900";
        badge.style.color = "#ff4444";
        badge.style.textAlign = "center";
        badge.style.lineHeight = "1.1";
        badge.style.width = "100%";
        badge.style.fontSize = "clamp(0.45rem, 1.8cqi, 0.75rem)";
        leftCol.appendChild(badge);
      } else if (item.icon) {
        const spanIcon = document.createElement("span");
        spanIcon.style.fontSize = "3rem"; // Larger icon
        spanIcon.innerText = item.icon;
        leftCol.appendChild(spanIcon);
      } else if (item.image) {
        const img = document.createElement("img");
        img.src = item.image;
        img.className = "lto-img";
        if (item.countdownDate) img.classList.add("lto-img-shrink"); // Apply shrink class
        img.onerror = function () {
          this.style.display = "none";
        };
        leftCol.appendChild(img);
      }

      // Add countdown if present
      if (item.countdownDate) {
        const countdownDiv = document.createElement("div");
        countdownDiv.className = "lto-countdown";
        countdownDiv.style.fontSize = "0.85rem"; // Subtext size
        countdownDiv.style.color = "#ffcc00"; // Gold color for visibility
        countdownDiv.innerText = "Loading...";
        leftCol.appendChild(countdownDiv);
        startLTOCountdown(countdownDiv, item.countdownDate, item._type || "lto");
      }

      li.appendChild(leftCol);

      // Text content
      const spanText = document.createElement("span");
      spanText.innerText = item.text;
      spanText.style.minWidth = "0";
      spanText.style.overflow = "hidden";
      spanText.style.wordBreak = "break-word";
      li.appendChild(spanText);

      list.appendChild(li);
    });
  else list.innerHTML = "<li>No upcoming LTOs.</li>";
}
function timeToMinutes(timeStr) {
  if (timeStr === "24:00") timeStr = "23:59";

  const [hours, minutes] = timeStr.split(":").map(Number);

  return hours * 60 + minutes;
}

function formatTimeDisplay(timeStr) {
  if (timeStr === "24:00" || timeStr === "23:59") return "12:00 AM";

  const [hours, minutes] = timeStr.split(":").map(Number);

  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  const displayMin = minutes.toString().padStart(2, "0");

  return `${displayHour}:${displayMin} ${suffix}`;
}

function startLTOCountdown(element, targetDate, type) {
  const target = new Date(targetDate).getTime();

  const update = () => {
    const now = new Date().getTime();

    const distance = target - now;

    if (distance < 0) {
      if (type === "disengagement") {
        element.innerText = "DISCONTINUED";
        element.style.color = "#ff4444";
      } else {
        element.innerText = "LIVE!";
        element.style.color = "#00ff00";
      }
      element.style.fontWeight = "900";
      element.style.fontSize = "1.2rem";

      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));

    const hours = Math.floor(
      (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );

    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (days > 0) {
      element.innerHTML = `${days}d ${hours}h<br>${minutes}m ${seconds}s`;
    } else {
      element.innerHTML = `${hours}h ${minutes}m<br>${seconds}s`;
    }
  };

  update(); // Initial call

  setInterval(update, 1000);
}

// --- START SEQUENCE ---

fetchData();
setInterval(fetchData, REFRESH_RATE);
setInterval(rotateAlert, ALERT_ROTATION_RATE);
setInterval(updateDaypart, 60000);
