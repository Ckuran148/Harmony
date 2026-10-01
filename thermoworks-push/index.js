import { ThermoworksCloud } from "thermoworks-sdk";
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
const client = new ThermoworksCloud({
  email: TW_EMAIL,
  password: TW_PASSWORD,
  tokenCachePath: true,
});

let running = true;

async function pushData() {
  try {
    console.log(`[${new Date().toISOString()}] Fetching ThermoWorks devices...`);

    const devices = await client.getDevices();
    console.log(`[${new Date().toISOString()}] Found ${devices.length} device(s)`);

    for (const device of devices) {
      const serial = device.serial;
      console.log(`  Processing device: ${serial} (${device.label || "unnamed"})`);

      let channels;
      try {
        channels = await client.getAllDeviceChannels(serial);
      } catch (err) {
        console.error(`  Error fetching channels for ${serial}:`, err.message);
        continue;
      }

      // Build channels map keyed by channel number string
      const channelsMap = {};
      for (const ch of channels) {
        channelsMap[String(ch.number)] = {
          label: ch.label || `Channel ${ch.number}`,
          value: ch.value ?? null,
          units: ch.units || "F",
          alarmHigh: ch.alarmHigh ?? null,
          alarmLow: ch.alarmLow ?? null,
        };
      }

      const docData = {
        deviceLabel: device.label || serial,
        status: device.status || "UNKNOWN",
        battery: device.battery ?? 0,
        batteryState: device.batteryState || "unknown",
        wifiStrength: device.wifi_stength ?? null,
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
    client.close();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main();
