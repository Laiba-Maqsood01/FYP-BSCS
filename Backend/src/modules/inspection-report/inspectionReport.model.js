import mongoose from "mongoose";

// ── Section metadata ──────────────────────────────────────────────────────────

export const SECTION_LABELS = {
  bodyFrame:  "Body Frame Accident Checklist",
  engine:     "Engine / Transmission / Clutch",
  brakes:     "Brakes",
  suspension: "Suspension/Steering",
  interior:   "Interior",
  acHeater:   "Ac/Heater",
  electrical: "Electrical & Electronics",
  exterior:   "Exterior & Body",
  tyres:      "Tyres",
  testDrive:  "Test Drive",
};

export const SECTION_KEYS = Object.keys(SECTION_LABELS);

// ── Full checklist definition (groups + items + options per item) ─────────────
// type: 'select' → predefined options with quality tags
// type: 'text'   → free-text input (brand names, measurements, etc.)
// quality: 'ok' | 'caution' | 'bad' | 'na'

export const CHECKLIST_DEF = {

  // ── 1. Body Frame Accident Checklist ─────────────────────────────────────────
  bodyFrame: {
    groups: [
      {
        name: "Body Frame",
        items: [
          { name: "Radiator Core Support",   options: [{ value: "Ok", quality: "ok" }, { value: "Repaired (Partial)", quality: "caution" }, { value: "Repaired (Full)", quality: "bad" }, { value: "Previously Welded", quality: "bad" }] },
          { name: "Right Strut Tower Apron", options: [{ value: "Ok", quality: "ok" }, { value: "Repaired (Partial)", quality: "caution" }, { value: "Repaired (Full)", quality: "bad" }, { value: "Previously Welded", quality: "bad" }] },
          { name: "Left Strut Tower Apron",  options: [{ value: "Ok", quality: "ok" }, { value: "Repaired (Partial)", quality: "caution" }, { value: "Repaired (Full)", quality: "bad" }, { value: "Previously Welded", quality: "bad" }] },
          { name: "Right Front Rail",        options: [{ value: "Ok", quality: "ok" }, { value: "Repaired (Partial)", quality: "caution" }, { value: "Repaired (Full)", quality: "bad" }, { value: "Previously Welded", quality: "bad" }] },
          { name: "Left Front Rail",         options: [{ value: "Ok", quality: "ok" }, { value: "Repaired (Partial)", quality: "caution" }, { value: "Repaired (Full)", quality: "bad" }, { value: "Previously Welded", quality: "bad" }] },
          { name: "Cowl Panel Firewall",     options: [{ value: "Ok", quality: "ok" }, { value: "Repaired (Partial)", quality: "caution" }, { value: "Repaired (Full)", quality: "bad" }, { value: "Previously Welded", quality: "bad" }] },
          { name: "Right A Pillar",          options: [{ value: "Ok", quality: "ok" }, { value: "Repaired (Partial)", quality: "caution" }, { value: "Repaired (Full)", quality: "bad" }, { value: "Previously Welded", quality: "bad" }] },
          { name: "Left A Pillar",           options: [{ value: "Ok", quality: "ok" }, { value: "Repaired (Partial)", quality: "caution" }, { value: "Repaired (Full)", quality: "bad" }, { value: "Previously Welded", quality: "bad" }] },
          { name: "Right B Pillar",          options: [{ value: "Ok", quality: "ok" }, { value: "Repaired (Partial)", quality: "caution" }, { value: "Repaired (Full)", quality: "bad" }, { value: "Previously Welded", quality: "bad" }] },
          { name: "Left B Pillar",           options: [{ value: "Ok", quality: "ok" }, { value: "Repaired (Partial)", quality: "caution" }, { value: "Repaired (Full)", quality: "bad" }, { value: "Previously Welded", quality: "bad" }] },
          { name: "Right C Pillar",          options: [{ value: "Ok", quality: "ok" }, { value: "Repaired (Partial)", quality: "caution" }, { value: "Repaired (Full)", quality: "bad" }, { value: "Previously Welded", quality: "bad" }] },
          { name: "Left C Pillar",           options: [{ value: "Ok", quality: "ok" }, { value: "Repaired (Partial)", quality: "caution" }, { value: "Repaired (Full)", quality: "bad" }, { value: "Previously Welded", quality: "bad" }] },
          { name: "Right D Pillar",          options: [{ value: "Ok", quality: "ok" }, { value: "Repaired (Partial)", quality: "caution" }, { value: "Repaired (Full)", quality: "bad" }, { value: "Previously Welded", quality: "bad" }] },
          { name: "Left D Pillar",           options: [{ value: "Ok", quality: "ok" }, { value: "Repaired (Partial)", quality: "caution" }, { value: "Repaired (Full)", quality: "bad" }, { value: "Previously Welded", quality: "bad" }] },
          { name: "Boot Floor",              options: [{ value: "Ok", quality: "ok" }, { value: "Repaired (Partial)", quality: "caution" }, { value: "Repaired (Full)", quality: "bad" }, { value: "Previously Welded", quality: "bad" }] },
          { name: "Boot Lock Pillar",        options: [{ value: "Ok", quality: "ok" }, { value: "Repaired (Partial)", quality: "caution" }, { value: "Repaired (Full)", quality: "bad" }, { value: "Previously Welded", quality: "bad" }] },
          { name: "Rear Sub Frame",          options: [{ value: "Ok", quality: "ok" }, { value: "Repaired (Partial)", quality: "caution" }, { value: "Repaired (Full)", quality: "bad" }, { value: "Previously Welded", quality: "bad" }] },
          { name: "Front Sub Frame",         options: [{ value: "Ok", quality: "ok" }, { value: "Repaired (Partial)", quality: "caution" }, { value: "Repaired (Full)", quality: "bad" }, { value: "Previously Welded", quality: "bad" }] },
        ],
      },
    ],
  },

  // ── 2. Engine / Transmission / Clutch ────────────────────────────────────────
  engine: {
    groups: [
      {
        name: "Fluids/filters check",
        items: [
          { name: "Engine Oil Level",         options: [{ value: "Complete and Clean", quality: "ok" }, { value: "Low", quality: "caution" }, { value: "Very Low", quality: "bad" }] },
          { name: "Engine Oil Leakage",       options: [{ value: "No Leakage", quality: "ok" }, { value: "Minor Leakage", quality: "caution" }, { value: "Major Leakage", quality: "bad" }] },
          { name: "Transmission Oil Leakage", options: [{ value: "No Leakage", quality: "ok" }, { value: "Minor Leakage", quality: "caution" }, { value: "Major Leakage", quality: "bad" }] },
          { name: "Coolant Leakage",          options: [{ value: "No Leakage", quality: "ok" }, { value: "Minor Leakage", quality: "caution" }, { value: "Major Leakage", quality: "bad" }] },
          { name: "Brake Oil Leakage",        options: [{ value: "No Leakage", quality: "ok" }, { value: "Minor Leakage", quality: "caution" }, { value: "Major Leakage", quality: "bad" }] },
        ],
      },
      {
        name: "Mechanical check",
        items: [
          { name: "Belts (Fan)",              options: [{ value: "Ok", quality: "ok" }, { value: "Worn", quality: "caution" }, { value: "Broken", quality: "bad" }] },
          { name: "Wires (Wiring Harness)",   options: [{ value: "Ok", quality: "ok" }, { value: "Damaged", quality: "bad" }] },
          { name: "Engine Blow (Manual Check)", options: [{ value: "Not Present", quality: "ok" }, { value: "Present", quality: "bad" }] },
          { name: "Engine Noise",             options: [{ value: "No Noise", quality: "ok" }, { value: "Minor Noise", quality: "caution" }, { value: "Loud Noise", quality: "bad" }] },
          { name: "Engine Vibration",         options: [{ value: "No Vibration", quality: "ok" }, { value: "Minor Vibration", quality: "caution" }, { value: "Heavy Vibration", quality: "bad" }] },
          { name: "Cold Start",               options: [{ value: "Ok", quality: "ok" }, { value: "Hard Start", quality: "caution" }, { value: "No Start", quality: "bad" }] },
          { name: "Engine Mounts",            options: [{ value: "Ok", quality: "ok" }, { value: "Loose", quality: "caution" }, { value: "Broken", quality: "bad" }] },
          { name: "Pulleys (Adjuster)",       options: [{ value: "Ok", quality: "ok" }, { value: "Worn", quality: "caution" }, { value: "Faulty", quality: "bad" }] },
          { name: "Hoses",                    options: [{ value: "Ok", quality: "ok" }, { value: "Cracked", quality: "caution" }, { value: "Leaking", quality: "bad" }] },
        ],
      },
      {
        name: "Exhaust check",
        items: [
          { name: "Exhaust Sound", options: [{ value: "Ok", quality: "ok" }, { value: "Noisy", quality: "caution" }, { value: "Loud / Faulty", quality: "bad" }] },
        ],
      },
      {
        name: "Engine cooling system",
        items: [
          { name: "Radiator",    options: [{ value: "Ok", quality: "ok" }, { value: "Leaking", quality: "caution" }, { value: "Faulty", quality: "bad" }] },
          { name: "Suction Fan", options: [{ value: "Working", quality: "ok" }, { value: "Faulty", quality: "bad" }] },
        ],
      },
      {
        name: "Engine electronics",
        items: [
          { name: "Starter Operation", options: [{ value: "Ok", quality: "ok" }, { value: "Faulty", quality: "bad" }] },
        ],
      },
    ],
  },

  // ── 3. Brakes ─────────────────────────────────────────────────────────────────
  brakes: {
    groups: [
      {
        name: "Mechanical check",
        items: [
          { name: "Front Right Disc",      options: [{ value: "Smooth", quality: "ok" }, { value: "Worn", quality: "caution" }, { value: "Cracked", quality: "bad" }] },
          { name: "Front Left Disc",       options: [{ value: "Smooth", quality: "ok" }, { value: "Worn", quality: "caution" }, { value: "Cracked", quality: "bad" }] },
          { name: "Front Right Brake Pad", options: [{ value: "More than 50%", quality: "ok" }, { value: "Less than 50%", quality: "caution" }, { value: "Critical", quality: "bad" }] },
          { name: "Front Left Brake Pad",  options: [{ value: "More than 50%", quality: "ok" }, { value: "Less than 50%", quality: "caution" }, { value: "Critical", quality: "bad" }] },
        ],
      },
    ],
  },

  // ── 4. Suspension/Steering ────────────────────────────────────────────────────
  suspension: {
    groups: [
      {
        name: "Front suspension",
        items: [
          { name: "Steering Wheel Play",  options: [{ value: "Ok", quality: "ok" }, { value: "Excessive", quality: "bad" }] },
          { name: "Right Ball Joint",     options: [{ value: "Ok", quality: "ok" }, { value: "Worn", quality: "caution" }, { value: "Faulty", quality: "bad" }] },
          { name: "Left Ball Joint",      options: [{ value: "Ok", quality: "ok" }, { value: "Worn", quality: "caution" }, { value: "Faulty", quality: "bad" }] },
          { name: "Right Z Links",        options: [{ value: "Ok", quality: "ok" }, { value: "Boot Damage or Play", quality: "caution" }, { value: "Faulty", quality: "bad" }] },
          { name: "Left Z Links",         options: [{ value: "Ok", quality: "ok" }, { value: "Boot Damage or Play", quality: "caution" }, { value: "Faulty", quality: "bad" }] },
          { name: "Right Tie Rod End",    options: [{ value: "Ok", quality: "ok" }, { value: "Worn", quality: "caution" }, { value: "Faulty", quality: "bad" }] },
          { name: "Left Tie Rod End",     options: [{ value: "Ok", quality: "ok" }, { value: "Worn", quality: "caution" }, { value: "Faulty", quality: "bad" }] },
          { name: "Front Right Boots",    options: [{ value: "Ok", quality: "ok" }, { value: "Damaged", quality: "caution" }, { value: "Torn", quality: "bad" }] },
          { name: "Front Left Boots",     options: [{ value: "Ok", quality: "ok" }, { value: "Damaged", quality: "caution" }, { value: "Torn", quality: "bad" }] },
          { name: "Front Right Bushes",   options: [{ value: "Ok", quality: "ok" }, { value: "Worn", quality: "caution" }, { value: "Damaged", quality: "bad" }] },
          { name: "Front Left Bushes",    options: [{ value: "Ok", quality: "ok" }, { value: "Worn", quality: "caution" }, { value: "Damaged", quality: "bad" }] },
          { name: "Front Right Shock",    options: [{ value: "Ok", quality: "ok" }, { value: "Leaking", quality: "caution" }, { value: "Faulty", quality: "bad" }] },
          { name: "Front Left Shock",     options: [{ value: "Ok", quality: "ok" }, { value: "Leaking", quality: "caution" }, { value: "Faulty", quality: "bad" }] },
        ],
      },
      {
        name: "Rear suspension",
        items: [
          { name: "Rear Right Bushes", options: [{ value: "No Damage Found", quality: "ok" }, { value: "Worn", quality: "caution" }, { value: "Damaged", quality: "bad" }] },
          { name: "Rear Left Bushes",  options: [{ value: "No Damage Found", quality: "ok" }, { value: "Worn", quality: "caution" }, { value: "Damaged", quality: "bad" }] },
          { name: "Rear Right Shock",  options: [{ value: "Ok", quality: "ok" }, { value: "Leaking", quality: "caution" }, { value: "Faulty", quality: "bad" }] },
          { name: "Rear Left Shock",   options: [{ value: "Ok", quality: "ok" }, { value: "Leaking", quality: "caution" }, { value: "Faulty", quality: "bad" }] },
        ],
      },
    ],
  },

  // ── 5. Interior ───────────────────────────────────────────────────────────────
  interior: {
    groups: [
      {
        name: "Steering controls",
        items: [
          { name: "Steering Wheel Condition",                        options: [{ value: "Good", quality: "ok" }, { value: "Scratched", quality: "caution" }, { value: "Damaged", quality: "bad" }] },
          { name: "Steering Wheel Buttons",                          options: [{ value: "Working", quality: "ok" }, { value: "Faulty", quality: "bad" }, { value: "Not Present", quality: "na" }] },
          { name: "Horn",                                            options: [{ value: "Working", quality: "ok" }, { value: "Faulty", quality: "bad" }] },
          { name: "Lights Lever / Switch (High / Low Beams, Indicators)", options: [{ value: "Working", quality: "ok" }, { value: "Faulty", quality: "bad" }] },
          { name: "Wiper / Washer Lever (Washer, Speeds)",           options: [{ value: "Working", quality: "ok" }, { value: "Faulty", quality: "bad" }] },
        ],
      },
      {
        name: "Mirrors",
        items: [
          { name: "Right Side Mirror",      options: [{ value: "Working", quality: "ok" }, { value: "Faulty", quality: "bad" }, { value: "Missing", quality: "bad" }] },
          { name: "Left Side Mirror",       options: [{ value: "Working", quality: "ok" }, { value: "Faulty", quality: "bad" }, { value: "Missing", quality: "bad" }] },
          { name: "Rear View Mirror Dimmer", options: [{ value: "Showing Reflection", quality: "ok" }, { value: "Not Working", quality: "bad" }] },
        ],
      },
      {
        name: "Seats",
        items: [
          { name: "Right Seat Adjuster Recliner",   options: [{ value: "Working", quality: "ok" }, { value: "Faulty", quality: "bad" }] },
          { name: "Left Seat Adjuster Recliner",    options: [{ value: "Working", quality: "ok" }, { value: "Faulty", quality: "bad" }] },
          { name: "Right Seat Adjuster Lear Track", options: [{ value: "Working", quality: "ok" }, { value: "Faulty", quality: "bad" }] },
          { name: "Left Seat Adjuster Lear Track",  options: [{ value: "Working", quality: "ok" }, { value: "Faulty", quality: "bad" }] },
          { name: "Right Seat Belt",                options: [{ value: "Working", quality: "ok" }, { value: "Faulty", quality: "bad" }] },
          { name: "Left Seat Belt",                 options: [{ value: "Working", quality: "ok" }, { value: "Faulty", quality: "bad" }] },
          { name: "Rear Seat Belts",                options: [{ value: "Working", quality: "ok" }, { value: "Faulty", quality: "bad" }] },
          { name: "Glove Box",                      options: [{ value: "Working", quality: "ok" }, { value: "Faulty", quality: "bad" }] },
        ],
      },
      {
        name: "Dash / roof controls",
        items: [
          { name: "Interior Lightings",              options: [{ value: "Working", quality: "ok" }, { value: "Faulty", quality: "bad" }] },
          { name: "Dash Controls - A/C",             options: [{ value: "Working", quality: "ok" }, { value: "Faulty", quality: "bad" }] },
          { name: "Dash Controls - De-Fog",          options: [{ value: "Working", quality: "ok" }, { value: "Faulty", quality: "bad" }] },
          { name: "Dash Controls - Hazzard Lights",  options: [{ value: "Working", quality: "ok" }, { value: "Faulty", quality: "bad" }] },
          { name: "Dash Controls - Parking Button",  options: [{ value: "Working", quality: "ok" }, { value: "Faulty", quality: "bad" }, { value: "Not Present", quality: "na" }] },
          { name: "Dash Controls - Others",          options: [{ value: "Working", quality: "ok" }, { value: "Faulty", quality: "bad" }] },
          { name: "Audio/Video",                     options: [{ value: "Working", quality: "ok" }, { value: "Faulty", quality: "bad" }, { value: "Not Present", quality: "na" }] },
          { name: "Rear View Camera",                options: [{ value: "Working", quality: "ok" }, { value: "Faulty", quality: "bad" }, { value: "Not Present", quality: "na" }] },
          { name: "Trunk Release Lever / Button",    options: [{ value: "Working", quality: "ok" }, { value: "Faulty", quality: "bad" }] },
          { name: "Fuel Cap Release Lever / Button", options: [{ value: "Working", quality: "ok" }, { value: "Faulty", quality: "bad" }] },
          { name: "Bonnet Release Lever / Button",   options: [{ value: "Working", quality: "ok" }, { value: "Faulty", quality: "bad" }] },
          { name: "Sun Roof Control Button",         options: [{ value: "Working", quality: "ok" }, { value: "Faulty", quality: "bad" }, { value: "Not Present", quality: "na" }] },
        ],
      },
      {
        name: "Poshish",
        items: [
          { name: "Roof Poshish",          options: [{ value: "Perfect", quality: "ok" }, { value: "Dirty", quality: "caution" }, { value: "Damaged", quality: "bad" }] },
          { name: "Floor Mat",             options: [{ value: "Perfect", quality: "ok" }, { value: "Worn", quality: "caution" }, { value: "Missing", quality: "bad" }] },
          { name: "Front Right Seat Poshish", options: [{ value: "Perfect", quality: "ok" }, { value: "Minor Spots", quality: "caution" }, { value: "Damaged", quality: "bad" }] },
          { name: "Front Left Seat Poshish",  options: [{ value: "Perfect", quality: "ok" }, { value: "Minor Spots", quality: "caution" }, { value: "Damaged", quality: "bad" }] },
          { name: "Rear Seat Poshish",     options: [{ value: "Perfect", quality: "ok" }, { value: "Minor Spots", quality: "caution" }, { value: "Damaged", quality: "bad" }] },
          { name: "Dashboard Condition",   options: [{ value: "Perfect", quality: "ok" }, { value: "Minor Spots", quality: "caution" }, { value: "Damaged", quality: "bad" }] },
        ],
      },
      {
        name: "Equipment",
        items: [
          { name: "Spare Tire", options: [{ value: "Present", quality: "ok" }, { value: "Missing", quality: "bad" }] },
          { name: "Tools",      options: [{ value: "Complete", quality: "ok" }, { value: "Incomplete", quality: "caution" }, { value: "Missing", quality: "bad" }] },
          { name: "Jack",       options: [{ value: "Present", quality: "ok" }, { value: "Missing", quality: "bad" }] },
        ],
      },
      {
        name: "Power / manual windows & central locking",
        items: [
          { name: "Front Right Power Window/Manual Lever", options: [{ value: "Working Properly", quality: "ok" }, { value: "Partially Working", quality: "caution" }, { value: "Faulty", quality: "bad" }] },
          { name: "Front Left Power Window/Manual Lever",  options: [{ value: "Working Properly", quality: "ok" }, { value: "Partially Working", quality: "caution" }, { value: "Faulty", quality: "bad" }] },
          { name: "Rear Right Power Window/Manual Lever",  options: [{ value: "Working Properly", quality: "ok" }, { value: "Partially Working", quality: "caution" }, { value: "Faulty", quality: "bad" }] },
          { name: "Rear Left Power Window/Manual Lever",   options: [{ value: "Working Properly", quality: "ok" }, { value: "Partially Working", quality: "caution" }, { value: "Faulty", quality: "bad" }] },
          { name: "Auto Lock Button",   options: [{ value: "Working", quality: "ok" }, { value: "Faulty", quality: "bad" }, { value: "Not Present", quality: "na" }] },
          { name: "Window Safety Lock", options: [{ value: "Working", quality: "ok" }, { value: "Faulty", quality: "bad" }, { value: "Not Present", quality: "na" }] },
        ],
      },
    ],
  },

  // ── 6. Ac/Heater ─────────────────────────────────────────────────────────────
  acHeater: {
    groups: [
      {
        name: "Ac / heater check up",
        items: [
          { name: "AC Fitted",      options: [{ value: "Yes", quality: "ok" }, { value: "No", quality: "na" }] },
          { name: "AC Operational", options: [{ value: "Yes", quality: "ok" }, { value: "No", quality: "bad" }] },
          { name: "Blower",         options: [{ value: "Excellent Air Throw", quality: "ok" }, { value: "Average Air Throw", quality: "caution" }, { value: "Weak Air Throw", quality: "bad" }] },
          { name: "Cooling",        options: [{ value: "Excellent", quality: "ok" }, { value: "Average", quality: "caution" }, { value: "Poor", quality: "bad" }] },
          { name: "Heating",        options: [{ value: "Excellent", quality: "ok" }, { value: "Average", quality: "caution" }, { value: "Poor", quality: "bad" }] },
        ],
      },
    ],
  },

  // ── 7. Electrical & Electronics ──────────────────────────────────────────────
  electrical: {
    groups: [
      {
        name: "Computer check up",
        items: [
          { name: "Computer Check up / Malfunction Check", options: [{ value: "No Error", quality: "ok" }, { value: "Error Codes Present", quality: "bad" }] },
          { name: "Battery Warning Light",                 options: [{ value: "Not Present", quality: "ok" }, { value: "Present", quality: "bad" }] },
          { name: "Oil Pressure Low Warning Light",        options: [{ value: "Not Present", quality: "ok" }, { value: "Present", quality: "bad" }] },
          { name: "Temperature Warning Light / Gauge",     options: [{ value: "Not Present", quality: "ok" }, { value: "Present", quality: "bad" }] },
          { name: "Air Bag Warning Light",                 options: [{ value: "Not Present", quality: "ok" }, { value: "Present", quality: "bad" }] },
          { name: "Power Steering Warning Light",          options: [{ value: "Not Present", quality: "ok" }, { value: "Present", quality: "bad" }] },
          { name: "ABS Warning Light",                     options: [{ value: "Not Present", quality: "ok" }, { value: "Present", quality: "bad" }] },
          { name: "Key Fob Battery Low Light",             options: [{ value: "Not Present", quality: "ok" }, { value: "Present", quality: "bad" }] },
        ],
      },
      {
        name: "Battery",
        items: [
          { name: "Voltage",              type: "text", placeholder: "e.g. 12" },
          { name: "Terminals Condition",  options: [{ value: "Ok", quality: "ok" }, { value: "Corroded", quality: "caution" }, { value: "Broken", quality: "bad" }] },
          { name: "Charging",             options: [{ value: "Ok", quality: "ok" }, { value: "Not Ok", quality: "bad" }] },
          { name: "Alternator Operation", options: [{ value: "Ok", quality: "ok" }, { value: "Faulty", quality: "bad" }] },
        ],
      },
      {
        name: "Instrument cluster",
        items: [
          { name: "Gauges", options: [{ value: "Working", quality: "ok" }, { value: "Faulty", quality: "bad" }] },
        ],
      },
    ],
  },

  // ── 8. Exterior & Body ───────────────────────────────────────────────────────
  exterior: {
    groups: [
      {
        name: "Car frame",
        items: [
          { name: "Trunk Lock",                 options: [{ value: "Ok", quality: "ok" }, { value: "Faulty", quality: "bad" }] },
          { name: "Front Windshield Condition", options: [{ value: "Ok", quality: "ok" }, { value: "Scratches", quality: "caution" }, { value: "Cracked / Broken", quality: "bad" }] },
          { name: "Rear Windshield Condition",  options: [{ value: "Ok", quality: "ok" }, { value: "Scratches", quality: "caution" }, { value: "Cracked / Broken", quality: "bad" }] },
          { name: "Front Right Door Window",    options: [{ value: "Ok", quality: "ok" }, { value: "Scratches", quality: "caution" }, { value: "Cracked / Broken", quality: "bad" }] },
          { name: "Front Left Door Window",     options: [{ value: "Ok", quality: "ok" }, { value: "Scratches", quality: "caution" }, { value: "Cracked / Broken", quality: "bad" }] },
          { name: "Rear Right Door Window",     options: [{ value: "Ok", quality: "ok" }, { value: "Scratches", quality: "caution" }, { value: "Cracked / Broken", quality: "bad" }] },
          { name: "Rear Left Door Window",      options: [{ value: "Ok", quality: "ok" }, { value: "Scratches", quality: "caution" }, { value: "Cracked / Broken", quality: "bad" }] },
          { name: "Windscreen Wiper",           options: [{ value: "Cleaning Properly", quality: "ok" }, { value: "Partially Working", quality: "caution" }, { value: "Faulty", quality: "bad" }] },
          { name: "Sun Roof Glass",             options: [{ value: "Ok", quality: "ok" }, { value: "Scratches", quality: "caution" }, { value: "Cracked / Broken", quality: "bad" }, { value: "Not Present", quality: "na" }] },
        ],
      },
      {
        name: "Exterior lights",
        items: [
          { name: "Right Headlight (Working)",   options: [{ value: "Working", quality: "ok" }, { value: "Faulty", quality: "bad" }] },
          { name: "Left Headlight (Working)",    options: [{ value: "Working", quality: "ok" }, { value: "Faulty", quality: "bad" }] },
          { name: "Right Headlight (Condition)", options: [{ value: "Perfect", quality: "ok" }, { value: "Repaired", quality: "caution" }, { value: "Yellow / Faded", quality: "caution" }, { value: "Cracked or Broken", quality: "bad" }] },
          { name: "Left Headlight (Condition)",  options: [{ value: "Perfect", quality: "ok" }, { value: "Repaired", quality: "caution" }, { value: "Yellow / Faded", quality: "caution" }, { value: "Cracked or Broken", quality: "bad" }] },
          { name: "Right Taillight (Working)",   options: [{ value: "Working", quality: "ok" }, { value: "Faulty", quality: "bad" }] },
          { name: "Left Taillight (Working)",    options: [{ value: "Working", quality: "ok" }, { value: "Faulty", quality: "bad" }] },
          { name: "Right Taillight (Condition)", options: [{ value: "Perfect", quality: "ok" }, { value: "Repaired", quality: "caution" }, { value: "Cracked or Broken", quality: "bad" }] },
          { name: "Left Taillight (Condition)",  options: [{ value: "Perfect", quality: "ok" }, { value: "Repaired", quality: "caution" }, { value: "Cracked or Broken", quality: "bad" }] },
          { name: "Fog Lights (Working)",        options: [{ value: "Working", quality: "ok" }, { value: "Faulty", quality: "bad" }, { value: "Not Present", quality: "na" }] },
        ],
      },
    ],
  },

  // ── 9. Tyres ─────────────────────────────────────────────────────────────────
  tyres: {
    groups: [
      {
        name: "Tyres",
        items: [
          { name: "Front Right Tyre Brand", type: "text", placeholder: "e.g. BG Luxo Plus" },
          { name: "Front Right Tyre",       type: "text", placeholder: "e.g. 5.4mm (remaining tread)" },
          { name: "Front Left Tyre Brand",  type: "text", placeholder: "e.g. BG Luxo Plus" },
          { name: "Front Left Tyre",        type: "text", placeholder: "e.g. 5.6mm (remaining tread)" },
          { name: "Rear Right Tyre Brand",  type: "text", placeholder: "e.g. BG Luxo Plus" },
          { name: "Rear Right Tyre",        type: "text", placeholder: "e.g. 6.2mm (remaining tread)" },
          { name: "Rear Left Tyre Brand",   type: "text", placeholder: "e.g. BG Luxo Plus" },
          { name: "Rear Left Tyre",         type: "text", placeholder: "e.g. 6.0mm (remaining tread)" },
          { name: "Tyre Size",              type: "text", placeholder: "e.g. 215/55/R16" },
          { name: "Rims",       options: [{ value: "Alloy", quality: "ok" }, { value: "Steel", quality: "ok" }, { value: "Damaged", quality: "bad" }] },
          { name: "Wheel Caps", options: [{ value: "Present", quality: "ok" }, { value: "Missing", quality: "caution" }, { value: "Damaged", quality: "bad" }] },
        ],
      },
    ],
  },

  // ── 10. Test Drive ────────────────────────────────────────────────────────────
  testDrive: {
    groups: [
      {
        name: "Test Drive",
        items: [
          { name: "Engine Pick",                              options: [{ value: "Ok", quality: "ok" }, { value: "Sluggish", quality: "caution" }, { value: "No Power", quality: "bad" }] },
          { name: "Drive Shaft Noise",                        options: [{ value: "No Noise", quality: "ok" }, { value: "Noise Present", quality: "bad" }] },
          { name: "Gear Shifting (Automatic)",                options: [{ value: "Smooth", quality: "ok" }, { value: "Jerky", quality: "caution" }, { value: "Slipping / Faulty", quality: "bad" }] },
          { name: "Brake Pedal Operation",                    options: [{ value: "Timely Response", quality: "ok" }, { value: "Delayed", quality: "caution" }, { value: "Faulty", quality: "bad" }] },
          { name: "ABS Operation",                            options: [{ value: "Timely Response", quality: "ok" }, { value: "Faulty", quality: "bad" }, { value: "Not Present", quality: "na" }] },
          { name: "Front Suspension (While Driving)",         options: [{ value: "No Noise", quality: "ok" }, { value: "Noise Present", quality: "caution" }, { value: "Shaky / Faulty", quality: "bad" }] },
          { name: "Rear Suspension (While Driving)",          options: [{ value: "No Noise", quality: "ok" }, { value: "Noise Present", quality: "caution" }, { value: "Shaky / Faulty", quality: "bad" }] },
          { name: "Steering Operation (While Driving)",       options: [{ value: "Smooth", quality: "ok" }, { value: "Heavy", quality: "caution" }, { value: "Vibrating / Faulty", quality: "bad" }] },
          { name: "Steering Wheel Alignment (While Driving)", options: [{ value: "Centered", quality: "ok" }, { value: "Not Centered", quality: "bad" }] },
          { name: "AC Operation (While Driving)",             options: [{ value: "Perfect", quality: "ok" }, { value: "Average", quality: "caution" }, { value: "Poor", quality: "bad" }] },
          { name: "Heater Operation (While Driving)",         options: [{ value: "Perfect", quality: "ok" }, { value: "Average", quality: "caution" }, { value: "Poor", quality: "bad" }] },
          { name: "Speedometer (While Driving)",              options: [{ value: "Working", quality: "ok" }, { value: "Faulty", quality: "bad" }] },
          { name: "Test Drive Done By",                       options: [{ value: "Seller", quality: "na" }, { value: "Inspector", quality: "na" }, { value: "Both", quality: "na" }, { value: "Not Done", quality: "na" }] },
        ],
      },
    ],
  },
};

// ── Exterior damage ───────────────────────────────────────────────────────────

export const DAMAGE_CODES = ["E1", "P", "A1", "A2", "A3", "B1", "B3", "U1", "U3"];

export const DAMAGE_LABELS = {
  E1: "Few Dimples",
  P:  "Paint marked",
  A1: "Small Scratch",
  A2: "Scratch",
  A3: "Big Scratch",
  B1: "Small dent with scratch (size like a thumb)",
  B3: "Big Dent with scratch (size like elbow)",
  U1: "Small Dent",
  U3: "Big Dent",
};

export const PANELS = [
  "frontBumper", "hood", "windscreen", "roof",
  "rearWindscreen", "trunk", "rearBumper",
  "frontLeftFender", "frontRightFender",
  "rearLeftFender",  "rearRightFender",
  "frontLeftDoor",   "frontRightDoor",
  "rearLeftDoor",    "rearRightDoor",
];

export const PANEL_LABELS = {
  frontBumper:      "Front Bumper",
  hood:             "Hood",
  windscreen:       "Windscreen",
  roof:             "Roof",
  rearWindscreen:   "Rear Windscreen",
  trunk:            "Trunk",
  rearBumper:       "Rear Bumper",
  frontLeftFender:  "Front Left Fender",
  frontRightFender: "Front Right Fender",
  rearLeftFender:   "Rear Left Fender",
  rearRightFender:  "Rear Right Fender",
  frontLeftDoor:    "Front Left Door",
  frontRightDoor:   "Front Right Door",
  rearLeftDoor:     "Rear Left Door",
  rearRightDoor:    "Rear Right Door",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export function buildEmptySections() {
  const sections = {};
  for (const key of SECTION_KEYS) {
    const def = CHECKLIST_DEF[key];
    const items = def.groups.flatMap(g =>
      g.items.map(item => ({
        name:    item.name,
        group:   g.name,
        type:    item.type ?? "select",
        value:   "",
        quality: "na",
        notes:   "",
        photos:  [],
      }))
    );
    sections[key] = { items, score: 0 };
  }
  return sections;
}

export function calcSectionScore(items) {
  const scorable = items.filter(i => i.quality && i.quality !== "na" && i.value);
  if (!scorable.length) return 0;
  const pts = scorable.reduce((s, i) => s + (i.quality === "ok" ? 100 : i.quality === "caution" ? 50 : 0), 0);
  return Math.round(pts / scorable.length);
}

export function calcOverallRating(sections) {
  const scores = SECTION_KEYS.map(k => sections[k]?.score ?? 0);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return parseFloat((Math.round(avg) / 10).toFixed(1));
}

// ── Sub-schemas ───────────────────────────────────────────────────────────────

const checklistItemSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  group:   { type: String, default: "" },
  type:    { type: String, enum: ["select", "text"], default: "select" },
  value:   { type: String, default: "" },
  quality: { type: String, enum: ["ok", "caution", "bad", "na"], default: "na" },
  notes:   { type: String, default: "" },
  photos:  [{ url: String, fileId: String, _id: false }],
}, { _id: false });

const sectionSchema = new mongoose.Schema({
  items: [checklistItemSchema],
  score: { type: Number, default: 0 },
}, { _id: false });

const damageMarkerSchema = new mongoose.Schema({
  panel:    { type: String, enum: PANELS,       required: true },
  code:     { type: String, enum: DAMAGE_CODES, required: true },
  note:     { type: String, default: "" },
  imageUrl: { type: String, default: "" },
  fileId:   { type: String, default: "" },
}, { _id: true });

const reportPhotoSchema = new mongoose.Schema({
  url:     { type: String, required: true },
  fileId:  { type: String, default: "" },
  caption: { type: String, default: "" },
}, { _id: false });

// ── Main schema ───────────────────────────────────────────────────────────────

const inspectionReportSchema = new mongoose.Schema({
  inspection: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      "inspections",
    required: true,
    unique:   true,
  },
  listing: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      "listings",
    required: true,
  },

  carSnapshot: {
    title:          { type: String, default: "" },
    year:           Number,
    brand:          { type: String, default: "" },
    carModel:       { type: String, default: "" },
    engineCapacity: Number,
    mileage:        Number,
    transmission:   { type: String, default: "" },
    engineType:     { type: String, default: "" },
    exteriorColor:  { type: String, default: "" },
    chassisNo:      { type: String, default: "" },
    engineNo:       { type: String, default: "" },
    registrationNo: { type: String, default: "" },
    registeredCity: { type: String, default: "" },
    location:       { type: String, default: "" },
    images:         [{ url: String, fileId: String, _id: false }],
  },

  inspectorName:  { type: String, default: "" },
  inspectionDate: { type: Date,   default: Date.now },

  sections: {
    bodyFrame:  { type: sectionSchema, default: () => ({ items: [], score: 0 }) },
    engine:     { type: sectionSchema, default: () => ({ items: [], score: 0 }) },
    brakes:     { type: sectionSchema, default: () => ({ items: [], score: 0 }) },
    suspension: { type: sectionSchema, default: () => ({ items: [], score: 0 }) },
    interior:   { type: sectionSchema, default: () => ({ items: [], score: 0 }) },
    acHeater:   { type: sectionSchema, default: () => ({ items: [], score: 0 }) },
    electrical: { type: sectionSchema, default: () => ({ items: [], score: 0 }) },
    exterior:   { type: sectionSchema, default: () => ({ items: [], score: 0 }) },
    tyres:      { type: sectionSchema, default: () => ({ items: [], score: 0 }) },
    testDrive:  { type: sectionSchema, default: () => ({ items: [], score: 0 }) },
  },

  exteriorDamage: [damageMarkerSchema],
  reportPhotos:   [reportPhotoSchema],

  overallRating: { type: Number, default: 0 },

  status: {
    type:    String,
    enum:    ["DRAFT", "PUBLISHED"],
    default: "DRAFT",
  },

  verifyToken: { type: String, unique: true, sparse: true },

}, { timestamps: true });

inspectionReportSchema.index({ verifyToken: 1 });
inspectionReportSchema.index({ listing: 1 });

const InspectionReport = mongoose.model("inspection_reports", inspectionReportSchema);
export default InspectionReport;
