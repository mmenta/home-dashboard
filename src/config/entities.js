// Map your Home Assistant entity IDs to the dashboard.
// Find these in Home Assistant -> Developer Tools -> States.
// Edit these to match YOUR setup — the placeholders below are examples.

export const LIGHTS = [
  { entityId: "light.living_room", name: "Living Room" },
  { entityId: "light.kitchen", name: "Kitchen" },
  { entityId: "light.bedroom", name: "Bedroom" },
];

// Air-quality / environment sensors (read-only).
export const AIR_QUALITY = [
  { entityId: "sensor.living_room_pm25", name: "PM2.5", unitFallback: "µg/m³" },
  { entityId: "sensor.living_room_co2", name: "CO₂", unitFallback: "ppm" },
  { entityId: "sensor.living_room_temperature", name: "Temperature", unitFallback: "°C" },
  { entityId: "sensor.living_room_humidity", name: "Humidity", unitFallback: "%" },
];

// Aqara door / window contact sensors (binary: on = open).
export const CONTACT_SENSORS = [
  { entityId: "binary_sensor.front_door", name: "Front Door" },
  { entityId: "binary_sensor.back_door", name: "Back Door" },
  { entityId: "binary_sensor.living_room_window", name: "Living Room Window" },
];

// How often (ms) to refresh state from Home Assistant.
export const POLL_INTERVAL = 5000;
