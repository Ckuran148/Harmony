import { ThermoWorks } from "thermoworks-sdk";
import admin from "firebase-admin";
import { readFileSync } from "fs";

// --- Configuration ---
const TW_EMAIL = process.env.TW_EMAIL;
const TW_PASSWORD = process.env.TW_PASSWORD;
const PUSH_INTERVAL_MS = parseInt(process.env.PUSH_INTERVAL_MS || "300000", 10); // 5 min default
const SA_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || "./serviceAccount.json";

if (!TW_EMAIL || !TW_PASSWORD) {
  console.error("TW_EMAIL and TW_PASSWORD environment variables are required");
  process.exit(1);
}

// --- Firebase Admin Init ---
const serviceAccount = JSON.parse(readFileSync(SA_PATH, "utf8"));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const firestore = admin.firestore();

// --- ThermoWorks Client ---
const tw = new ThermoWorks();

let running = true;

async function pushData() {
  try {
    console.log(`[${new Date().toISOString()}] Authenticating with ThermoWorks...`);
    await tw.authenticate(TW_EMAIL, TW_PASSWORD);

    const devices = await tw.getDevices();
    console.log(`[${new Date().toISOString()}] Found ${devices.length} device(s)`);

    for (const device of devices) {
      const serial = device.serial;
      console.log(`  Processing device: ${serial} (${device.name || "unnamed"})`);

      let channels;
      try {
        channels = await tw.getAllDeviceChannels(serial);
      } catch (err) {
        console.error(`  Error fetching channels for ${serial}:`, err.message);
        continue;
      }

      // Build channels map keyed by channel number string
      const channelsMap = {};
      for (const ch of channels) {
        channelsMap[String(ch.channel)] = {
          label: ch.name || `Channel ${ch.channel}`,
          value: ch.currentReading ?? null,
          units: ch.units || "F",
          alarmHigh: ch.alarmHigh ?? null,
          alarmLow: ch.alarmLow ?? null,
        };
      }

      const docData = {
        deviceLabel: device.name || serial,
        status: device.status || "UNKNOWN",
        battery: device.battery ?? 0,
        batteryState: device.batteryState || "unknown",
        wifiStrength: device.wifiStrength ?? null,
        lastSeen: device.lastSeen || null,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        channels: channelsMap,
      };

      await firestore.doc(`thermoworks/${serial}`).set(docData, { merge: true });
      console.log(`  Wrote thermoworks/${serial} to Firestore`);
    }

    console.log(`[${new Date().toISOString()}] Push complete. Next in ${PUSH_INTERVAL_MS / 1000}s`);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Push error:`, err.message);
  }
}

// --- Main Loop ---
async function main() {
  console.log("ThermoWorks push service starting...");
  console.log(`  Interval: ${PUSH_INTERVAL_MS / 1000}s`);

  // Initial push
  await pushData();

  // Schedule subsequent pushes
  const interval = setInterval(async () => {
    if (!running) {
      clearInterval(interval);
      return;
    }
    await pushData();
  }, PUSH_INTERVAL_MS);

  // Graceful shutdown
  const shutdown = () => {
    console.log("\nShutting down gracefully...");
    running = false;
    clearInterval(interval);
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main();
