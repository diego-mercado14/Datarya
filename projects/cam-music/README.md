# DATARYA CAM-MUSIC

**Camera · Gesture · Sound** — an experimental musical instrument for the browser.

[Live original concept on ChatGPT Sites](https://datarya-cam-music.diegojuarez1417.chatgpt.site/)

## About this version

This folder is a **portfolio reconstruction** of the CAM-MUSIC concept, not an export of the original ChatGPT Sites source code. The original source was unavailable when publishing to GitHub. The implementation here is a standalone, inspectable browser prototype.

The left hand selects harmonies; the right hand shapes volume and brightness of the sound. Hand landmarks are detected locally and the audio is synthesized in-browser.

## Features implemented

- Webcam-based detection of up to two hands, with 21 landmarks per hand.
- Four harmony zones driven by horizontal left-hand position.
- Right-hand vertical position controls volume; horizontal position controls filter brightness.
- Twelve root keys, major/minor mode and three oscillator waveforms.
- On-screen landmark visualizer and chord/gesture readouts.
- "Play demo chord" fallback to test sound without using a webcam.
- Local microphone-free audio synthesis using the Web Audio API.
- Clear camera start/stop, status and error handling.

Not implemented in this reconstruction: looping/overdubbing, session recording/export, advanced calibration, custom presets.

## Run locally

Serve this folder from a local HTTP server; do not open the HTML file directly if the browser blocks module imports or webcam access.

```bash
cd projects/cam-music
python -m http.server 8000
```

Then open **http://localhost:8000** in desktop Chrome and click **Start camera**. Allow camera access, then use both hands inside the frame. To test audio without permission to use a camera, click **Play demo chord**.

Alternatively, publish this folder on any HTTPS static host. Webcam access needs a **secure context** (HTTPS or localhost), an available webcam and user permission. The first load needs internet access to download MediaPipe scripts, WASM and the hand-landmarker model.

## Controls

| Control | Action |
| --- | --- |
| Left hand (move horizontally) | Select chord I, IV, V, vi (major) or i, VI, III, VII (minor) |
| Right hand (move vertically) | Control output volume |
| Right hand (move horizontally) | Control filter brightness |
| Key / Mode | Select tonal center and major/minor |
| Sound | Switch oscillator waveform |
| Play demo chord | Play a short chord with no camera |

## Tech

- Vanilla HTML, CSS, JavaScript (ES modules).
- [MediaPipe Tasks Vision](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker) for in-browser hand tracking.
- Web Audio API for oscillator synthesis and real-time gain/filter control.
- Fully static: no application backend and no video upload by this code.

**Privacy note:** Video frames are processed in the browser; CAM-MUSIC does not upload them. MediaPipe assets are loaded from external CDN/model hosts and Google's library may process telemetry as described in its documentation. Avoid claiming "no network traffic."

## Status and credits

Portfolio demonstration / experimental prototype. Visual design and product concept: **DATARYA**. Built as a separate module in the public DATARYA repository without changing the existing website application.

© DATARYA — project showcase.