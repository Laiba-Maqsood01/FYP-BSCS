/**
 * CarDiagram — PakWheels hatchback SVG (inlined) with label-only damage markers.
 *
 * Props:
 *   markers            — [{panel, imageUrl, fileId, note}]
 *   onPanelClick(key)  — admin: toggle a panel marked/unmarked
 *   onImageClick(m)    — viewer: called with the marker when label is clicked (open lightbox)
 *   readonly           — disables onPanelClick; labels still show, imageClick still works
 */
import { useState } from "react";

export const DAMAGE_CODES = ["E1","P","A1","A2","A3","B1","B3","U1","U3"];
export const DAMAGE_LABELS = {
  E1:"Few Dimples", P:"Paint Marked",
  A1:"Small Scratch", A2:"Scratch", A3:"Big Scratch",
  B1:"Small Dent w/ Scratch", B3:"Big Dent w/ Scratch",
  U1:"Small Dent", U3:"Big Dent",
};
const CODE_COLOR = {
  E1:"#f59e0b",P:"#f59e0b",A1:"#f97316",A2:"#f97316",A3:"#ea580c",
  B1:"#dc2626",B3:"#b91c1c",U1:"#dc2626",U3:"#b91c1c",
};

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

// Hit-area paths + label anchor points, all in the 465.95×574.6 coordinate space.
const PANELS = {
  frontBumper: {
    d: "M233.21 58.3c14.1.06 35.67.86 37.45 1-1.19-2.16-2.73-6.61-1.7-9.25a7.47 7.47 0 0 1 3.22-4 13.9 13.9 0 0 1 5.57-1.39 39.2 39.2 0 0 1 11.88.88 33.66 33.66 0 0 1 17.36 9.76 31 31 0 0 1 2.37 2.94l.53.79a30 30 0 0 0 3.78-2.44 31.2 31.2 0 0 0 8-8.89c-1.75-13.34-6.68-28.46-10.55-40-1.16-3.47-3.54-6.38-7.21-6.46Q292.19.98 280.36.81C271.5.68 252.5.62 233.25.61c-19.25 0-38.25.07-47.11.2q-11.84.18-23.55.43c-3.68.08-6 3-7.21 6.46-3.88 11.58-8.81 26.7-10.55 40a31.1 31.1 0 0 0 7.95 8.89 31 31 0 0 0 3.79 2.44l.53-.79a32 32 0 0 1 2.32-2.94 33.73 33.73 0 0 1 17.37-9.76 39.2 39.2 0 0 1 11.87-.88 13.8 13.8 0 0 1 5.57 1.39 7.44 7.44 0 0 1 3.23 4c1 2.64-.51 7.09-1.7 9.25 1.78-.1 23.35-.9 37.45-1Z",
    lx: 233, ly: 30,
  },
  hood: {
    d: "M298.22 249.05c6.1-22.24 12-43.82 18.05-66.05a554 554 0 0 0-6.59-78.37q-.92-5.91-1.93-11.64c-2.17-12.19-11.93-21.23-23.6-21.93 0 0-36.33-2.33-50.94-2.52-14.61.19-50.95 2.52-50.95 2.52-11.67.7-21.42 9.74-23.59 21.93q-1 5.73-1.93 11.64a554 554 0 0 0-6.59 78.37c6.09 22.23 12 43.81 18 66.05",
    lx: 233, ly: 150,
  },
  windscreen: {
    d: "M233.73 244.62c12.05.08 24.93.65 38.53 1.92 9.05.85 18.2 2 26.46 3.31 6.14-21.92 11.81-43.93 17.95-65.85l-.22-.19c-14.39-12-37-17.7-50.25-19.37-8-1-23.66-1.15-32.47-1.16-8.81 0-24.5.16-32.48 1.16-13.27 1.67-35.86 7.41-50.24 19.37l-.22.19c6.14 21.92 11.81 43.93 18 65.85 8.26-1.27 17.41-2.46 26.46-3.31 13.6-1.27 26.48-1.84 38.53-1.92",
    transform: "translate(-.52 -.7)", lx: 233, ly: 212,
  },
  roof: {
    d: "M233.21 411.02a640 640 0 0 1 64.21 3.5 1325 1325 0 0 1 0-154.38 418.4 418.4 0 0 0-64.21-5.38 418.4 418.4 0 0 0-64.21 5.38 1330 1330 0 0 1 0 154.38 640 640 0 0 1 64.21-3.5Z",
    lx: 233, ly: 334,
  },
  rearWindscreen: {
    d: "M233.73 483.29a670 670 0 0 0 71.14-4.07 4 4 0 0 0 3.39-2.53 6.54 6.54 0 0 0 .09-5.11l-14.72-35.73a3.79 3.79 0 0 0-3.09-2.41 425 425 0 0 0-56.82-3.92 425 425 0 0 0-56.82 3.92 3.79 3.79 0 0 0-3.08 2.41l-14.72 35.73a6.5 6.5 0 0 0 .09 5.11 4 4 0 0 0 3.39 2.53 670 670 0 0 0 71.13 4.07Z",
    transform: "translate(-.52 -.7)", lx: 233, ly: 461,
  },
  trunk: {
    d: "M233.21 489.3c29.18 0 56.14-1 81.36-4.09.13 0 9.41-.81 11.28 8.6-1.46-6.43-6.08-17-6.89-19.13l-18.83-45.13a4.8 4.8 0 0 0-1.65-2.25 4.26 4.26 0 0 0-1.91-.79c-21.81-3.27-41-4.28-63.39-4.35-22.37.07-41.58 1.08-63.39 4.35a4.2 4.2 0 0 0-1.91.79 4.8 4.8 0 0 0-1.62 2.22l-18.78 45.12c-.81 2.16-5.43 12.7-6.89 19.13 1.87-9.41 11.15-8.6 11.27-8.6 25.23 3.05 52.19 4 81.37 4.09Z",
    lx: 233, ly: 466,
  },
  rearBumper: {
    d: "M318.48 574.01c2.08 0 8.79-9.55 11.72-17.84a36.6 36.6 0 0 0 1.44-6c.4-2.91 1.37-9.53-.26-14.84H135.07c-1.64 5.31-.66 11.93-.26 14.84a36.6 36.6 0 0 0 1.44 6c2.92 8.29 9.63 17.84 11.72 17.84 13.71.06 156.77.06 170.51 0Z",
    lx: 233, ly: 552,
  },
  frontLeftFender: {
    d: "M143.03 187.16c-13.57-42.46-30.5-64.35-31.67-67.68-4-11.32-9-28.52-15-43.7A182.6 182.6 0 0 0 78.48 41.3a9.41 9.41 0 0 0-7.63-4.21c-7-.15-19.66-.33-22.95-.13-6.42.34-23.31 7.25-23.31 10.34 0 12.62-.05 23.23 0 35.62 24.8-2 40.56 13.38 40.52 34.16 0 20.21-14.68 35.61-35.16 35.3a5.27 5.27 0 0 0-5.4 5.25v7.51s48.82-.31 78.87 0c1.82 0 8.14.16 9.44 1.45 5.23 5.2 15.88 14.08 34.82 55.22a1.29 1.29 0 0 0 2.47-.66 181.7 181.7 0 0 0-7.12-33.99Z",
    lx: 58, ly: 128,
  },
  frontLeftDoor: {
    d: "M156.58 327.9c-14.69-3.45-36.13-8.1-54.36-10.12a427.7 427.7 0 0 0-77.74-1.39c-.3-36.07.36-94.22.14-132.28a5.25 5.25 0 0 1 5.23-5.28c18.57-.05 61.59-.3 74.23.06a7.2 7.2 0 0 1 1.61.24 7.7 7.7 0 0 1 3.85 2.61c16.65 19.19 24.27 37 24.27 37 21.79 48.44 22.74 109.11 22.74 109.11.31 19.33.37 57.82-4.78 88.17-3.67.89-36.43 7.45-41.06 8.61a16.3 16.3 0 0 1-3.62.51c-8.68.1-28.2-6.52-80.68-50.76a5.3 5.3 0 0 1-1.88-4c-.05-5.69 0-32.75-.05-54.05",
    clip: "url(#clip-fl-door)", lx: 36, ly: 228,
  },
  rearLeftDoor: {
    d: "M156.58 327.9c-14.69-3.45-36.13-8.1-54.36-10.12a427.7 427.7 0 0 0-77.74-1.39c-.3-36.07.36-94.22.14-132.28a5.25 5.25 0 0 1 5.23-5.28c18.57-.05 61.59-.3 74.23.06a7.2 7.2 0 0 1 1.61.24 7.7 7.7 0 0 1 3.85 2.61c16.65 19.19 24.27 37 24.27 37 21.79 48.44 22.74 109.11 22.74 109.11.31 19.33.37 57.82-4.78 88.17-3.67.89-36.43 7.45-41.06 8.61a16.3 16.3 0 0 1-3.62.51c-8.68.1-28.2-6.52-80.68-50.76a5.3 5.3 0 0 1-1.88-4c-.05-5.69 0-32.75-.05-54.05",
    clip: "url(#clip-rl-door)", lx: 36, ly: 338,
  },
  rearLeftFender: {
    d: "M45.42 405.16c41.44 31.09 58 33 64.94 31.7 1-.19 2-.41 3-.64 7.14-1.69 36.24-8.44 36.24-8.44-4.14 13.33-12 31.48-12.22 32.28a98.3 98.3 0 0 0-14.61 15.83c-1.26 1.72-8 10.94-12.55 15.82a44.6 44.6 0 0 1-7.86 6.46l-.84.51a40.8 40.8 0 0 1-10.13 4.18c-3.64.13-12.44 1-19.78 7.09a26 26 0 0 0-3.3 3.27 8.7 8.7 0 0 1-4.83 2.84 40 40 0 0 1-6.55 1 34.6 34.6 0 0 1-6.76.17 14.4 14.4 0 0 1-7.69-3.4c-1.71-1.73-3.83-3.76-6.35-5.91-3.25-2.78-4.68-3.64-6-4.81-2.86-2.62-5.95-4.34-5.15-17.35 20.61 1.06 36.28-10.94 39.6-28.36a31.2 31.2 0 0 0-.32-13.25c-3.78-15.49-20.13-28.23-39.64-26.36v-29.11s13.58 11.06 20.8 16.48Z",
    lx: 52, ly: 468,
  },
  frontRightFender: {
    d: "M323.38 187.16c13.58-42.46 30.5-64.35 31.67-67.68 4-11.32 9.06-28.52 15-43.7a182.6 182.6 0 0 1 17.93-34.48 9.38 9.38 0 0 1 7.62-4.21c7.06-.15 19.67-.33 23-.13 6.35.37 23.27 7.25 23.27 10.33v35.62c-24.8-2-40.57 13.38-40.52 34.16.05 20.21 14.68 35.61 35.16 35.3a5.27 5.27 0 0 1 5.4 5.25v7.51s-48.83-.31-78.87 0c-1.83 0-8.14.16-9.44 1.45-5.23 5.2-15.89 14.08-34.83 55.22a1.29 1.29 0 0 1-2.46-.66 182.6 182.6 0 0 1 7.07-33.98Z",
    lx: 408, ly: 128,
  },
  frontRightDoor: {
    d: "M309.83 327.9c14.7-3.45 36.14-8.1 54.37-10.12a427.7 427.7 0 0 1 77.74-1.39c.3-36.07-.36-94.22-.15-132.28a5.24 5.24 0 0 0-5.22-5.28c-18.58-.05-61.59-.3-74.23.06a7.2 7.2 0 0 0-1.61.24 7.7 7.7 0 0 0-3.85 2.61c-16.65 19.19-24.27 37-24.27 37-21.79 48.44-22.75 109.11-22.75 109.11-.3 19.33-.36 57.82 4.79 88.17 3.67.89 36.43 7.45 41.05 8.61a16.5 16.5 0 0 0 3.62.51c8.69.1 28.21-6.52 80.69-50.76a5.26 5.26 0 0 0 1.87-4c.05-5.69 0-32.75.06-54.05",
    clip: "url(#clip-fr-door)", lx: 430, ly: 228,
  },
  rearRightDoor: {
    d: "M309.83 327.9c14.7-3.45 36.14-8.1 54.37-10.12a427.7 427.7 0 0 1 77.74-1.39c.3-36.07-.36-94.22-.15-132.28a5.24 5.24 0 0 0-5.22-5.28c-18.58-.05-61.59-.3-74.23.06a7.2 7.2 0 0 0-1.61.24 7.7 7.7 0 0 0-3.85 2.61c-16.65 19.19-24.27 37-24.27 37-21.79 48.44-22.75 109.11-22.75 109.11-.3 19.33-.36 57.82 4.79 88.17 3.67.89 36.43 7.45 41.05 8.61a16.5 16.5 0 0 0 3.62.51c8.69.1 28.21-6.52 80.69-50.76a5.26 5.26 0 0 0 1.87-4c.05-5.69 0-32.75.06-54.05",
    clip: "url(#clip-rr-door)", lx: 430, ly: 338,
  },
  rearRightFender: {
    d: "M421 405.16c-41.44 31.09-57.95 33-64.94 31.7-1-.19-2-.41-3-.64-7.14-1.69-36.24-8.44-36.24-8.44 4.13 13.33 12 31.48 12.22 32.28a98.8 98.8 0 0 1 14.61 15.83c1.26 1.72 7.95 10.94 12.54 15.82a45 45 0 0 0 7.86 6.46l.85.51a39 39 0 0 0 3.94 2 40 40 0 0 0 6.19 2.17c3.64.13 12.44 1 19.78 7.09a26 26 0 0 1 3.3 3.27 8.7 8.7 0 0 0 4.79 2.84 40 40 0 0 0 6.55 1 34.6 34.6 0 0 0 6.76.17 14.4 14.4 0 0 0 7.76-3.38c1.71-1.73 3.83-3.76 6.34-5.91 3.26-2.78 4.69-3.64 6-4.81 2.86-2.62 5.95-4.34 5.15-17.35-20.61 1.06-36.28-10.94-39.61-28.36a31.3 31.3 0 0 1 .33-13.25c3.82-15.49 18.19-28.16 39.64-26.91v-28.57s-13.6 11.06-20.82 16.48Z",
    lx: 414, ly: 468,
  },
};

export default function CarDiagram({ markers = [], onPanelClick, onImageClick, readonly = false }) {
  const [hovered, setHovered] = useState(null);

  // Group markers by panel (multiple marks per panel are supported)
  const markersByPanel = {};
  for (const m of markers) {
    if (!markersByPanel[m.panel]) markersByPanel[m.panel] = [];
    markersByPanel[m.panel].push(m);
  }
  // Keep backward-compat (used for hover suppression)
  const markerMap = markersByPanel;

  const interactive = !readonly && !!onPanelClick;

  return (
    <div className="flex flex-col items-center select-none">
      <div className="w-full max-w-xs">
        <svg viewBox="0 0 465.95 574.6" style={{ display: "block", width: "100%" }}>
          <defs>
            {/* Gradients — verbatim from PakWheels SVG */}
            <linearGradient id="lg" x1="286.69" x2="321.76" y1="162.53" y2="162.53" gradientTransform="translate(-128.45 -102.12)" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#f9f2ce"/><stop offset=".17" stopColor="#fae2ad"/>
              <stop offset=".43" stopColor="#facd82"/><stop offset=".66" stopColor="#fbbe64"/>
              <stop offset=".86" stopColor="#fbb551"/><stop offset="1" stopColor="#fbb24a"/>
            </linearGradient>
            <linearGradient xlinkHref="#lg" id="lg3" x1="175.21" x2="176.46" y1="39.74" y2="86.23"/>
            <linearGradient xlinkHref="#lg" id="lg4" x1="143.76" x2="172.95" y1="520.94" y2="482.3"/>
            <linearGradient xlinkHref="#lg" id="lg5" x1="691.36" x2="726.42" y1="162.53" y2="162.53" gradientTransform="matrix(-1 0 0 1 1000.58 -102.12)"/>
            <linearGradient xlinkHref="#lg" id="lg7" x1="291.18" x2="292.33" y1="44.78" y2="81.47"/>
            <linearGradient xlinkHref="#lg" id="lg8" x1="321.83" x2="294.52" y1="516.66" y2="484.56"/>
            <linearGradient xlinkHref="#lg" id="lg10" x1="379.06" x2="376.97" y1="56.07" y2="119.88"/>
            <linearGradient xlinkHref="#lg" id="lg11" x1="578.73" x2="576.64" y1="56.07" y2="119.88" gradientTransform="matrix(-1 0 0 1 667.08 0)"/>
            <linearGradient xlinkHref="#lg" id="lg12" x1="359.33" x2="370.8" y1="490.36" y2="456.24"/>
            <linearGradient xlinkHref="#lg" id="lg15" x1="107.46" x2="98.5" y1="490.88" y2="456.69"/>
            <radialGradient id="rg" cx="1911.48" cy="-733.23" r="1.56" gradientTransform="rotate(-90 1561.95 594.15)" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#fff"/><stop offset="1" stopColor="#abd7e2"/>
            </radialGradient>
            <radialGradient id="rg2" cx="720.44" cy="558.53" r="93.8" gradientTransform="translate(-486.71 -102.12)" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#fff"/><stop offset=".2" stopColor="#f4fafb"/>
              <stop offset=".56" stopColor="#d7ecf1"/><stop offset="1" stopColor="#abd7e2"/>
            </radialGradient>
            <radialGradient xlinkHref="#rg" id="rg3" cx="1947.7" cy="-327.25" r="180.19" gradientTransform="matrix(0 -1 -1 0 -95.67 2156.1)"/>
            <radialGradient xlinkHref="#rg" id="rg4" cx="1911.48" cy="-329.1" r="1.56" gradientTransform="matrix(0 -1 -1 0 -95.67 2156.1)"/>
            <radialGradient xlinkHref="#rg" id="rg5" cx="1482.38" cy="-5690.08" r="98.54" gradientTransform="matrix(.01 .95 .98 -.01 5922.62 -1204.58)"/>
            <radialGradient xlinkHref="#rg" id="rg6" cx="1610.54" cy="-5693.76" r="85.66" gradientTransform="matrix(.01 .93 .98 -.01 5922.82 -1186.9)"/>
            <radialGradient xlinkHref="#rg" id="rg7" cx="1493.87" cy="-4522.95" r="98.54" gradientTransform="rotate(90.6 -1557.66 -2734.26)scale(.95 .98)"/>
            <radialGradient xlinkHref="#rg" id="rg8" cx="1622.2" cy="-4526.62" r="85.66" gradientTransform="matrix(-.01 .93 -.98 -.01 -4307.86 -1186.9)"/>
            {/* Door clip paths: split the side-body path at y=277 (front/rear door midpoint) */}
            <clipPath id="clip-fl-door"><rect x="-1" y="0" width="170" height="277"/></clipPath>
            <clipPath id="clip-rl-door"><rect x="-1" y="277" width="170" height="300"/></clipPath>
            <clipPath id="clip-fr-door"><rect x="297" y="0" width="170" height="277"/></clipPath>
            <clipPath id="clip-rr-door"><rect x="297" y="277" width="170" height="300"/></clipPath>
          </defs>

          {/* ── Original SVG paths (PakWheels hatchback, unmodified) ───────── */}
          <path d="m191.91 53.41-3.16 2.21-14 9.83a2 2 0 0 1-.63.31c-1.69.53-9.26 2.9-13.73 4.19a1.93 1.93 0 0 1-2.56-2.29 24.6 24.6 0 0 1 3.27-6.62 26 26 0 0 1 2-2.45c8.62-9.41 21.81-9.28 23.9-9.21h.25l3.92.59a1.85 1.85 0 0 1 .74 3.44Z" fill="url(#lg)" stroke="#000" strokeMiterlimit="10" strokeWidth="1.09"/>
          <path d="m191.91 53.41-3.16 2.21-14 9.83a2 2 0 0 1-.63.31c-1.69.53-9.26 2.9-13.73 4.19a1.93 1.93 0 0 1-2.56-2.29 24.6 24.6 0 0 1 3.27-6.62 26 26 0 0 1 2-2.45c8.62-9.41 21.81-9.28 23.9-9.21h.25l3.92.59a1.85 1.85 0 0 1 .74 3.44Z" fill="url(#lg)" stroke="#000" strokeMiterlimit="10" strokeWidth="1.09"/>
          <path d="m192.43 54.11-3.16 2.21-14 9.83a2 2 0 0 1-.63.31c-1.69.53-9.26 2.9-13.73 4.19a1.93 1.93 0 0 1-2.56-2.29 24.6 24.6 0 0 1 3.27-6.62 26 26 0 0 1 2-2.45c8.62-9.41 21.81-9.28 23.9-9.21h.25l3.92.59a1.85 1.85 0 0 1 .74 3.44Z" fill="url(#lg3)" stroke="#000" strokeMiterlimit="10" strokeWidth="1.09" transform="translate(-.52 -.7)"/>
          <path d="M172.42 514.89c-1.6-2.32-9.14-12.89-12.29-25.81 0 0 .11-2.44-6.87-3.1l-.63-.06a10.64 10.64 0 0 0-10.24 5.08 10.9 10.9 0 0 0-1.26 3.32c-1 4.67-.29 20.2-.29 20.2s27.04.34 31.58.37Z" fill="url(#lg4)" stroke="#000" strokeMiterlimit="10" strokeWidth="1.09" transform="translate(-.52 -.7)"/>
          <path d="M235.37 244.62h-1.64" stroke="#231f20" strokeMiterlimit="10" strokeWidth="1.09" fill="url(#rg)" transform="translate(-.52 -.7)"/>
          <path d="m274.48 53.41 3.16 2.21 14 9.83a2 2 0 0 0 .63.31c1.69.53 9.26 2.9 13.73 4.19a1.92 1.92 0 0 0 2.55-2.29 24 24 0 0 0-3.27-6.62 25 25 0 0 0-2-2.45c-8.62-9.41-21.81-9.28-23.9-9.21h-.25l-3.92.59a1.85 1.85 0 0 0-.73 3.44Z" fill="url(#lg5)" stroke="#000" strokeMiterlimit="10" strokeWidth="1.09"/>
          <path d="m274.48 53.41 3.16 2.21 14 9.83a2 2 0 0 0 .63.31c1.69.53 9.26 2.9 13.73 4.19a1.92 1.92 0 0 0 2.55-2.29 24 24 0 0 0-3.27-6.62 25 25 0 0 0-2-2.45c-8.62-9.41-21.81-9.28-23.9-9.21h-.25l-3.92.59a1.85 1.85 0 0 0-.73 3.44Z" fill="url(#lg5)" stroke="#000" strokeMiterlimit="10" strokeWidth="1.09"/>
          <path d="m275 54.11 3.16 2.21 14 9.83a2 2 0 0 0 .63.31c1.69.53 9.26 2.9 13.73 4.19a1.92 1.92 0 0 0 2.55-2.29 24 24 0 0 0-3.27-6.62 25 25 0 0 0-2-2.45c-8.62-9.41-21.81-9.28-23.9-9.21h-.25l-3.92.59a1.85 1.85 0 0 0-.73 3.44Z" fill="url(#lg7)" stroke="#000" strokeMiterlimit="10" strokeWidth="1.09" transform="translate(-.52 -.7)"/>
          <path d="M233.21 58.3c14.1.06 35.67.86 37.45 1-1.19-2.16-2.73-6.61-1.7-9.25a7.47 7.47 0 0 1 3.22-4 13.9 13.9 0 0 1 5.57-1.39 39.2 39.2 0 0 1 11.88.88 33.66 33.66 0 0 1 17.36 9.76 31 31 0 0 1 2.37 2.94l.53.79a30 30 0 0 0 3.78-2.44 31.2 31.2 0 0 0 8-8.89c-1.75-13.34-6.68-28.46-10.55-40-1.16-3.47-3.54-6.38-7.21-6.46Q292.19.98 280.36.81C271.5.68 252.5.62 233.25.61c-19.25 0-38.25.07-47.11.2q-11.84.18-23.55.43c-3.68.08-6 3-7.21 6.46-3.88 11.58-8.81 26.7-10.55 40a31.1 31.1 0 0 0 7.95 8.89 31 31 0 0 0 3.79 2.44l.53-.79a32 32 0 0 1 2.32-2.94 33.73 33.73 0 0 1 17.37-9.76 39.2 39.2 0 0 1 11.87-.88 13.8 13.8 0 0 1 5.57 1.39 7.44 7.44 0 0 1 3.23 4c1 2.64-.51 7.09-1.7 9.25 1.78-.1 23.35-.9 37.45-1ZM299.67 507.02c-1.78 2.66-3.43 4.72-5.05 7.06 5.68 0 21.48-.26 31.53-.06 2.59 6.91 3.88 10.79 4.66 14.7h-195.2c.78-3.91 2.07-7.79 4.66-14.7 10.05-.2 25.85 0 31.53.06" fill="none" stroke="#000" strokeMiterlimit="10" strokeWidth="1.09"/>
          <path d="M295 514.89c1.6-2.32 9.14-12.89 12.29-25.81 0 0-.12-2.44 6.86-3.1l.64-.06a10.64 10.64 0 0 1 10.28 5.08 10.9 10.9 0 0 1 1.26 3.32c1 4.67.29 20.2.29 20.2s-27.04.34-31.62.37Z" fill="url(#lg8)" stroke="#000" strokeMiterlimit="10" strokeWidth="1.09" transform="translate(-.52 -.7)"/>
          <path d="M233.21 489.3c29.18 0 56.14-1 81.36-4.09.13 0 9.41-.81 11.28 8.6-1.46-6.43-6.08-17-6.89-19.13l-18.83-45.13a4.8 4.8 0 0 0-1.65-2.25 4.26 4.26 0 0 0-1.91-.79c-21.81-3.27-41-4.28-63.39-4.35-22.37.07-41.58 1.08-63.39 4.35a4.2 4.2 0 0 0-1.91.79 4.8 4.8 0 0 0-1.62 2.22l-18.78 45.12c-.81 2.16-5.43 12.7-6.89 19.13 1.87-9.41 11.15-8.6 11.27-8.6 25.23 3.05 52.19 4 81.37 4.09Z" fill="none" stroke="#000" strokeMiterlimit="10" strokeWidth="1.09"/>
          <path d="M233.73 483.29a670 670 0 0 0 71.14-4.07 4 4 0 0 0 3.39-2.53 6.54 6.54 0 0 0 .09-5.11l-14.72-35.73a3.79 3.79 0 0 0-3.09-2.41 425 425 0 0 0-56.82-3.92 425 425 0 0 0-56.82 3.92 3.79 3.79 0 0 0-3.08 2.41l-14.72 35.73a6.5 6.5 0 0 0 .09 5.11 4 4 0 0 0 3.39 2.53 670 670 0 0 0 71.13 4.07Z" fill="url(#rg2)" stroke="#231f20" strokeMiterlimit="10" strokeWidth="1.09" transform="translate(-.52 -.7)"/>
          <path d="M318.48 574.01c2.08 0 8.79-9.55 11.72-17.84a36.6 36.6 0 0 0 1.44-6c.4-2.91 1.37-9.53-.26-14.84H135.07c-1.64 5.31-.66 11.93-.26 14.84a36.6 36.6 0 0 0 1.44 6c2.92 8.29 9.63 17.84 11.72 17.84 13.71.06 156.77.06 170.51 0ZM298.22 249.05c6.1-22.24 12-43.82 18.05-66.05a554 554 0 0 0-6.59-78.37q-.92-5.91-1.93-11.64c-2.17-12.19-11.93-21.23-23.6-21.93 0 0-36.33-2.33-50.94-2.52-14.61.19-50.95 2.52-50.95 2.52-11.67.7-21.42 9.74-23.59 21.93q-1 5.73-1.93 11.64a554 554 0 0 0-6.59 78.37c6.09 22.23 12 43.81 18 66.05" fill="none" stroke="#000" strokeMiterlimit="10" strokeWidth="1.09"/>
          <path d="M233.73 244.62c12.05.08 24.93.65 38.53 1.92 9.05.85 18.2 2 26.46 3.31 6.14-21.92 11.81-43.93 17.95-65.85l-.22-.19c-14.39-12-37-17.7-50.25-19.37-8-1-23.66-1.15-32.47-1.16-8.81 0-24.5.16-32.48 1.16-13.27 1.67-35.86 7.41-50.24 19.37l-.22.19c6.14 21.92 11.81 43.93 18 65.85 8.26-1.27 17.41-2.46 26.46-3.31 13.6-1.27 26.48-1.84 38.53-1.92" fill="url(#rg3)" stroke="#231f20" strokeMiterlimit="10" strokeWidth="1.09" transform="translate(-.52 -.7)"/>
          <path d="M232.63 244.62h1.65" fill="url(#rg4)" stroke="#231f20" strokeMiterlimit="10" strokeWidth="1.09" transform="translate(-.52 -.7)"/>
          <path d="M233.21 411.02a640 640 0 0 1 64.21 3.5 1325 1325 0 0 1 0-154.38 418.4 418.4 0 0 0-64.21-5.38 418.4 418.4 0 0 0-64.21 5.38 1330 1330 0 0 1 0 154.38 640 640 0 0 1 64.21-3.5ZM323.38 187.16c13.58-42.46 30.5-64.35 31.67-67.68 4-11.32 9.06-28.52 15-43.7a182.6 182.6 0 0 1 17.93-34.48 9.38 9.38 0 0 1 7.62-4.21c7.06-.15 19.67-.33 23-.13 6.35.37 23.27 7.25 23.27 10.33v35.62c-24.8-2-40.57 13.38-40.52 34.16.05 20.21 14.68 35.61 35.16 35.3a5.27 5.27 0 0 1 5.4 5.25v7.51s-48.83-.31-78.87 0c-1.83 0-8.14.16-9.44 1.45-5.23 5.2-15.89 14.08-34.83 55.22a1.29 1.29 0 0 1-2.46-.66 182.6 182.6 0 0 1 7.07-33.98Z" fill="none" stroke="#000" strokeMiterlimit="10" strokeWidth="1.09"/>
          <path d="M368.92 81.71a.8.8 0 0 1 0-.31c1.2-5 4-10.67 7.1-17.55a158 158 0 0 1 8.45-15.55c.5-.84 2.16 0 2.4.91 1.18 4.44 1.85 8.32 1.08 12.67-2.56 14.46-9.46 27.14-13.88 37.95a1 1 0 0 1-1.88-.22c-.77-5.97-2.48-11.93-3.27-17.9Z" fill="url(#lg10)" stroke="#000" strokeMiterlimit="10" strokeWidth="1.09" transform="translate(-.52 -.7)"/>
          <path d="M98.48 81.71a.8.8 0 0 0 0-.31c-1.2-5-4-10.67-7.11-17.55a154 154 0 0 0-8.46-15.55c-.49-.84-2.15 0-2.4.91-1.17 4.44-1.84 8.32-1.07 12.67C82 76.34 88.9 89 93.31 99.83a1 1 0 0 0 1.89-.22c.8-5.97 2.5-11.93 3.28-17.9Z" fill="url(#lg11)" stroke="#000" strokeMiterlimit="10" strokeWidth="1.09" transform="translate(-.52 -.7)"/>
          <path d="M322.27 314.85c2.73-45 18.19-106.91 43.29-120.61.11-.06.1-.15.28-.1s.21.15.21.21v.06l-3.78 113.47c-6.52.89-13.24 1.92-20.16 3.13s-13.47 2.48-19.84 3.84Z" fill="url(#rg5)" stroke="#231f20" strokeMiterlimit="10" strokeWidth="1.09" transform="translate(-.52 -.7)"/>
          <path d="M324.83 406.86q-1.33-9.19-2.32-19c-1.84-18.45-1.78-34.64-1.44-50.62q9.07-2 18.85-3.83 11.49-2.1 22.19-3.52l-.84 78.87c-.2 2.91-3 4.14-5.91 3.59Z" fill="url(#rg6)" stroke="#231f20" strokeMiterlimit="10" strokeWidth="1.09" transform="translate(-.52 -.7)"/>
          <path d="M309.83 327.9c14.7-3.45 36.14-8.1 54.37-10.12a427.7 427.7 0 0 1 77.74-1.39c.3-36.07-.36-94.22-.15-132.28a5.24 5.24 0 0 0-5.22-5.28c-18.58-.05-61.59-.3-74.23.06a7.2 7.2 0 0 0-1.61.24 7.7 7.7 0 0 0-3.85 2.61c-16.65 19.19-24.27 37-24.27 37-21.79 48.44-22.75 109.11-22.75 109.11-.3 19.33-.36 57.82 4.79 88.17 3.67.89 36.43 7.45 41.05 8.61a16.5 16.5 0 0 0 3.62.51c8.69.1 28.21-6.52 80.69-50.76a5.26 5.26 0 0 0 1.87-4c.05-5.69 0-32.75.06-54.05" fill="none" stroke="#000" strokeMiterlimit="10" strokeWidth="1.09"/>
          <path d="M360.3 196.64c-2.64 2-7.33 8-9.36 11-2.77 3.8 1.22 6.78 2.24 7.36a11 11 0 0 0 3.83 1.36 11.54 11.54 0 0 0 6.17-.73 2.1 2.1 0 0 0 1.35-1.92c0-4.42.55-11.26.53-15.68 0-1-1.18-1.79-1.82-2a4 4 0 0 0-2.94.61Z" fill="#fff" stroke="#231f20" strokeMiterlimit="10" strokeWidth="1.09"/>
          <path d="M344.94 462.93c2.69 4.92 8.2 11.91 13.08 18.2 8 10.36 14.75 12 23 15-1.25-5.42-2.25-9-3.55-14.6-1.37-6-6-13-11.76-14.88Z" fill="url(#lg12)" stroke="#000" strokeMiterlimit="10" strokeWidth="1.09" transform="translate(-.52 -.7)"/>
          <ellipse cx="437.39" cy="451.55" rx="27.88" ry="26.7" fill="none" stroke="#000" strokeMiterlimit="10" strokeWidth="1.09"/>
          <path d="M421 405.16c-41.44 31.09-57.95 33-64.94 31.7-1-.19-2-.41-3-.64-7.14-1.69-36.24-8.44-36.24-8.44 4.13 13.33 12 31.48 12.22 32.28a98.8 98.8 0 0 1 14.61 15.83c1.26 1.72 7.95 10.94 12.54 15.82a45 45 0 0 0 7.86 6.46l.85.51a39 39 0 0 0 3.94 2 40 40 0 0 0 6.19 2.17c3.64.13 12.44 1 19.78 7.09a26 26 0 0 1 3.3 3.27 8.7 8.7 0 0 0 4.79 2.84 40 40 0 0 0 6.55 1 34.6 34.6 0 0 0 6.76.17 14.4 14.4 0 0 0 7.76-3.38c1.71-1.73 3.83-3.76 6.34-5.91 3.26-2.78 4.69-3.64 6-4.81 2.86-2.62 5.95-4.34 5.15-17.35-20.61 1.06-36.28-10.94-39.61-28.36a31.3 31.3 0 0 1 .33-13.25c3.82-15.49 18.19-28.16 39.64-26.91v-28.57s-13.6 11.06-20.82 16.48Z" fill="none" stroke="#000" strokeMiterlimit="10" strokeWidth="1.09"/>
          <ellipse cx="437.39" cy="117.78" rx="27.88" ry="26.7" fill="none" stroke="#000" strokeMiterlimit="10" strokeWidth="1.09"/>
          <path d="M143.03 187.16c-13.57-42.46-30.5-64.35-31.67-67.68-4-11.32-9-28.52-15-43.7A182.6 182.6 0 0 0 78.48 41.3a9.41 9.41 0 0 0-7.63-4.21c-7-.15-19.66-.33-22.95-.13-6.42.34-23.31 7.25-23.31 10.34 0 12.62-.05 23.23 0 35.62 24.8-2 40.56 13.38 40.52 34.16 0 20.21-14.68 35.61-35.16 35.3a5.27 5.27 0 0 0-5.4 5.25v7.51s48.82-.31 78.87 0c1.82 0 8.14.16 9.44 1.45 5.23 5.2 15.88 14.08 34.82 55.22a1.29 1.29 0 0 0 2.47-.66 181.7 181.7 0 0 0-7.12-33.99Z" fill="none" stroke="#000" strokeMiterlimit="10" strokeWidth="1.09"/>
          <path d="M145.19 314.85c-2.73-45-18.19-106.91-43.29-120.61-.11-.06-.1-.15-.28-.1s-.21.15-.21.21v.06l3.78 113.47a545 545 0 0 1 40 6.97Z" fill="url(#rg7)" stroke="#231f20" strokeMiterlimit="10" strokeWidth="1.09" transform="translate(-.52 -.7)"/>
          <path d="M142.63 406.86q1.34-9.19 2.32-19c1.84-18.45 1.78-34.64 1.44-50.62q-9.07-2-18.86-3.83-11.48-2.1-22.19-3.52l.85 78.87c.2 2.91 3 4.14 5.91 3.59Z" fill="url(#rg8)" stroke="#231f20" strokeMiterlimit="10" strokeWidth="1.09" transform="translate(-.52 -.7)"/>
          <path d="M156.58 327.9c-14.69-3.45-36.13-8.1-54.36-10.12a427.7 427.7 0 0 0-77.74-1.39c-.3-36.07.36-94.22.14-132.28a5.25 5.25 0 0 1 5.23-5.28c18.57-.05 61.59-.3 74.23.06a7.2 7.2 0 0 1 1.61.24 7.7 7.7 0 0 1 3.85 2.61c16.65 19.19 24.27 37 24.27 37 21.79 48.44 22.74 109.11 22.74 109.11.31 19.33.37 57.82-4.78 88.17-3.67.89-36.43 7.45-41.06 8.61a16.3 16.3 0 0 1-3.62.51c-8.68.1-28.2-6.52-80.68-50.76a5.3 5.3 0 0 1-1.88-4c-.05-5.69 0-32.75-.05-54.05" fill="none" stroke="#000" strokeMiterlimit="10" strokeWidth="1.09"/>
          <path d="M106.12 196.64c2.64 2 7.33 8 9.36 11 2.77 3.8-1.22 6.78-2.24 7.36a11 11 0 0 1-3.83 1.36 11.5 11.5 0 0 1-6.17-.73 2.1 2.1 0 0 1-1.35-1.92c0-4.42-.55-11.26-.54-15.68 0-1 1.18-1.79 1.83-2a4 4 0 0 1 2.94.61Z" fill="#fff" stroke="#231f20" strokeMiterlimit="10" strokeWidth="1.09"/>
          <path d="M122.52 462.93c-2.7 4.92-8.2 11.91-13.08 18.2-8 10.36-14.75 12-23 15 1.25-5.42 2.25-9 3.54-14.6 1.38-6 6-13 11.77-14.88Z" fill="url(#lg15)" stroke="#000" strokeMiterlimit="10" strokeWidth="1.09" transform="translate(-.52 -.7)"/>
          <ellipse cx="29.02" cy="451.55" rx="27.88" ry="26.7" fill="none" stroke="#000" strokeMiterlimit="10" strokeWidth="1.09"/>
          <path d="M45.42 405.16c41.44 31.09 58 33 64.94 31.7 1-.19 2-.41 3-.64 7.14-1.69 36.24-8.44 36.24-8.44-4.14 13.33-12 31.48-12.22 32.28a98.3 98.3 0 0 0-14.61 15.83c-1.26 1.72-8 10.94-12.55 15.82a44.6 44.6 0 0 1-7.86 6.46l-.84.51a40.8 40.8 0 0 1-10.13 4.18c-3.64.13-12.44 1-19.78 7.09a26 26 0 0 0-3.3 3.27 8.7 8.7 0 0 1-4.83 2.84 40 40 0 0 1-6.55 1 34.6 34.6 0 0 1-6.76.17 14.4 14.4 0 0 1-7.69-3.4c-1.71-1.73-3.83-3.76-6.35-5.91-3.25-2.78-4.68-3.64-6-4.81-2.86-2.62-5.95-4.34-5.15-17.35 20.61 1.06 36.28-10.94 39.6-28.36a31.2 31.2 0 0 0-.32-13.25c-3.78-15.49-20.13-28.23-39.64-26.36v-29.11s13.58 11.06 20.8 16.48Z" fill="none" stroke="#000" strokeMiterlimit="10" strokeWidth="1.09"/>
          <ellipse cx="29.02" cy="117.78" rx="27.88" ry="26.7" fill="none" stroke="#000" strokeMiterlimit="10" strokeWidth="1.09"/>
          <path d="M.68 178.7h15.11v194.08H.68zM450.16 178.7h15.11v194.08h-15.11z" fill="none" stroke="#231f20" strokeMiterlimit="10" strokeWidth="1.36"/>

          {/* ── Invisible hit areas (exact panel shapes, transparent) ──────── */}
          {Object.entries(PANELS).map(([key, panel]) => (
            <path
              key={`hit-${key}`}
              d={panel.d}
              transform={panel.transform}
              clipPath={panel.clip}
              fill="transparent"
              stroke="none"
              pointerEvents={interactive ? "all" : "none"}
              style={{ cursor: interactive ? "crosshair" : "default" }}
              onClick={() => interactive && onPanelClick(key)}
              onMouseEnter={() => interactive && setHovered(key)}
              onMouseLeave={() => interactive && setHovered(null)}
            />
          ))}

          {/* ── Hover preview label (admin only, grey, before marking) ───── */}
          {interactive && hovered && !(markersByPanel[hovered]?.length) && (() => {
            const p = PANELS[hovered];
            return (
              <text
                x={p.lx} y={p.ly}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="10" fontWeight="600" fontFamily="sans-serif"
                fill="#6b7280"
                paintOrder="stroke" stroke="white" strokeWidth="3" strokeLinejoin="round"
                pointerEvents="none"
              >
                {PANEL_LABELS[hovered]}
              </text>
            );
          })()}

          {/* ── Damage labels (multiple marks per panel supported) ───────── */}
          {Object.entries(markersByPanel).map(([panel, ms]) => {
            const p = PANELS[panel];
            if (!p) return null;
            const count = ms.length;
            // Centre the badge row horizontally; each badge is 24px wide with 2px gap
            const badgeW = 24;
            const gap    = 2;
            const totalW = count * badgeW + (count - 1) * gap;
            const startX = p.lx - totalW / 2;

            return (
              <g key={panel}>
                {ms.map((m, idx) => {
                  const color     = CODE_COLOR[m.code] ?? "#dc2626";
                  const bx        = startX + idx * (badgeW + gap);
                  const clickable = readonly && m.imageUrl && onImageClick;
                  return (
                    <g
                      key={m._id ?? m.localId ?? `${panel}-${idx}`}
                      onClick={() => clickable && onImageClick(m)}
                      style={{ cursor: clickable ? "pointer" : "default" }}
                      pointerEvents={clickable ? "all" : "none"}
                    >
                      <rect x={bx} y={p.ly - 18} width={badgeW} height="13" rx="3" fill={color} />
                      <text
                        x={bx + badgeW / 2} y={p.ly - 11}
                        textAnchor="middle" dominantBaseline="middle"
                        fontSize="9" fontWeight="800" fontFamily="sans-serif" fill="white"
                        pointerEvents="none"
                      >{m.code}</text>
                    </g>
                  );
                })}
                {/* Panel name — one label per panel */}
                <text
                  x={p.lx} y={p.ly + 1}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize="9" fontWeight="700" fontFamily="sans-serif"
                  fill="#111827"
                  paintOrder="stroke" stroke="white" strokeWidth="3" strokeLinejoin="round"
                  pointerEvents="none"
                >
                  {PANEL_LABELS[panel]}
                </text>
                {/* "tap for photo" hint — show if any mark has a photo */}
                {readonly && ms.some(m => m.imageUrl) && (
                  <text
                    x={p.lx} y={p.ly + 13}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize="7.5" fontFamily="sans-serif" fill="#6366f1"
                    paintOrder="stroke" stroke="white" strokeWidth="2.5"
                    pointerEvents="none"
                  >
                    tap for photo
                  </text>
                )}
              </g>
            );
          })}

          {/* Direction labels */}
          <text x="233" y="9" textAnchor="middle" fontSize="8" fill="#9ca3af" fontWeight="600" fontFamily="sans-serif" letterSpacing="2">FRONT</text>
          <text x="233" y="569" textAnchor="middle" fontSize="8" fill="#9ca3af" fontWeight="600" fontFamily="sans-serif" letterSpacing="2">REAR</text>
        </svg>
      </div>
    </div>
  );
}
