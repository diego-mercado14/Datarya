import { FilesetResolver, HandLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.2/vision_bundle.mjs";

const $ = (id) => document.getElementById(id);
const video = $("webcam");
const canvas = $("overlay");
const ctx = canvas.getContext("2d");
const startButton = $("cameraButton");
const demoButton = $("demoButton");
const keySelect = $("keySelect");
const modeSelect = $("modeSelect");
const waveSelect = $("waveSelect");
const NOTE_NAMES = ["C","C♯","D","D♯","E","F","F♯","G","G♯","A","A♯","B"];
const MAJOR = [[0,4,7],[5,9,12],[7,11,14],[9,12,16]];
const MINOR = [[0,3,7],[8,12,15],[3,7,10],[10,14,17]];
const MAJOR_NAMES = ["I","IV","V","vi"];
const MINOR_NAMES = ["i","VI","III","VII"];
const HAND_EDGES = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
let tracker = null, stream = null, frame = 0, lastVideoTime = -1, active = false;
let audio = null, filter = null, master = null, voices = [];
let lastChord = -1, lastKey = -1, lastMode = "", lastWave = "", lastSeenLeft = 0;
let smoothVolume = 0.17, smoothBrightness = 0.4;
let demoTimer = null, demoRunning = false;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
function setStatus(text, kind = "") {
  $("status").className = "status " + kind;
  $("status").innerHTML = '<span class="status-light"></span>' + text;
}
function noteName(midi) { return NOTE_NAMES[((midi % 12) + 12) % 12]; }
function midiFreq(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }
function chordNotes(index) {
  const scale = modeSelect.value === "major" ? MAJOR : MINOR;
  const root = 48 + Number(keySelect.value);
  return scale[index].map((offset) => root + offset);
}
function chordLabel(index) {
  const names = modeSelect.value === "major" ? MAJOR_NAMES : MINOR_NAMES;
  const notes = chordNotes(index);
  return noteName(notes[0]) + " / " + names[index];
}
function initAudio() {
  if (audio) return;
  const AudioClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioClass) throw new Error("Web Audio is not supported in this browser.");
  audio = new AudioClass();
  filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1300;
  filter.Q.value = 0.7;
  master = audio.createGain();
  master.gain.value = 0;
  filter.connect(master);
  master.connect(audio.destination);
}
async function unlockAudio() { initAudio(); if (audio.state !== "running") await audio.resume(); }
function stopVoices() {
  if (!audio) return;
  const now = audio.currentTime;
  const old = voices;
  voices = [];
  for (const voice of old) {
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setTargetAtTime(0, now, 0.045);
    try { voice.osc.stop(now + 0.3); } catch (_) {}
  }
  master.gain.setTargetAtTime(0, now, 0.05);
  lastChord = -1;
}
function playChord(index, volume, brightness) {
  if (!audio || audio.state !== "running") return;
  const currentKey = Number(keySelect.value);
  const currentMode = modeSelect.value;
  const currentWave = waveSelect.value;
  const changed = lastChord !== index || lastKey !== currentKey || lastMode !== currentMode || lastWave !== currentWave;
  if (changed) {
    const oldVoices = voices;
    voices = [];
    const now = audio.currentTime;
    for (const voice of oldVoices) {
      voice.gain.gain.setTargetAtTime(0, now, 0.04);
      try { voice.osc.stop(now + 0.25); } catch (_) {}
    }
    for (const midi of chordNotes(index)) {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      gain.gain.value = 0;
      osc.type = currentWave;
      osc.frequency.value = midiFreq(midi);
      osc.connect(gain); gain.connect(filter);
      osc.start();
      gain.gain.setTargetAtTime(0.26, now, 0.06);
      voices.push({osc,gain});
    }
    lastChord = index; lastKey = currentKey; lastMode = currentMode; lastWave = currentWave;
  }
  master.gain.setTargetAtTime(clamp(volume,0,0.48),audio.currentTime,0.065);
  filter.frequency.setTargetAtTime(250 + clamp(brightness,0,1) * 4600,audio.currentTime,0.07);
}
function syncControls() {
  if (lastChord >= 0 && audio && audio.state === "running") {
    const index = lastChord;
    lastChord = -1;
    playChord(index,smoothVolume,smoothBrightness);
    $("harmonyValue").textContent = chordLabel(index);
  }
}
[keySelect, modeSelect, waveSelect].forEach((input) => input.addEventListener("change", syncControls));
async function demo() {
  if (demoTimer) clearTimeout(demoTimer);
  await unlockAudio();
  demoRunning = true;
  smoothVolume = 0.29; smoothBrightness = 0.48;
  playChord(0,0.29,0.48);
  $("harmonyValue").textContent = chordLabel(0);
  $("harmonyHint").textContent = "Demo: synthesized chord";
  demoTimer = setTimeout(() => {
    demoRunning = false;
    if (!active) {
      stopVoices();
      $("harmonyValue").textContent = "—";
      $("harmonyHint").textContent = "Move horizontally to choose a chord";
    }
  },1600);
}
demoButton.addEventListener("click", () => { demo().catch((err) => setStatus(err.message,"error")); });
function drawHands(landmarks, handedness) {
  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 720;
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0,0,w,h);
  for (let i=0; i<landmarks.length; i++) {
    const hand = landmarks[i];
    const name = handedness[i]?.[0]?.categoryName || "?";
    ctx.strokeStyle = name === "Left" ? "rgba(211,154,169,.95)" : "rgba(175,211,194,.95)";
    ctx.fillStyle = name === "Left" ? "#e6afb9" : "#a9e0ca";
    ctx.lineWidth = Math.max(2,w/450);
    for (const [a,b] of HAND_EDGES) {
      ctx.beginPath(); ctx.moveTo(hand[a].x*w,hand[a].y*h); ctx.lineTo(hand[b].x*w,hand[b].y*h); ctx.stroke();
    }
    for (const point of hand) { ctx.beginPath();ctx.arc(point.x*w,point.y*h,Math.max(2.4,w/360),0,Math.PI*2);ctx.fill(); }
  }
}
function analyze(result, now) {
  const labels = result.handedness || result.handednesses || [];
  drawHands(result.landmarks, labels);
  $("handCount").textContent = result.landmarks.length + (result.landmarks.length===1 ? " HAND" : " HANDS");
  let left = null, right = null;
  result.landmarks.forEach((hand,i) => {
    const name = labels[i]?.[0]?.categoryName;
    if (name === "Left") left = hand;
    if (name === "Right") right = hand;
  });
  if (left) {
    const x = left[9].x;
    const index = Math.min(3,Math.floor(clamp(x,0,0.999)*4));
    lastSeenLeft = now;
    $("harmonyValue").textContent = chordLabel(index);
    $("harmonyHint").textContent = "Zone " + (index + 1) + " / 4 · Left hand detected";
    smoothVolume += ((right ? smoothVolume : 0.22) - smoothVolume)*0.15;
    if (right) {
      const vol = clamp((0.92-right[9].y)*0.55,0.015,0.43);
      smoothVolume += (vol - smoothVolume)*0.2;
      smoothBrightness += (clamp(right[9].x,0,1) - smoothBrightness)*0.12;
      $("expressionValue").textContent = Math.round(smoothVolume/0.43*100) + "%";
      $("expressionHint").textContent = "Volume / filter " + Math.round(smoothBrightness*100) + "%";
    } else {
      $("expressionValue").textContent = "—";
      $("expressionHint").textContent = "Show your right hand to shape sound";
    }
    if (!demoRunning) playChord(index,smoothVolume,smoothBrightness);
  } else if (now-lastSeenLeft > 170) {
    if (!demoRunning) stopVoices();
    $("harmonyValue").textContent = "—";
    $("harmonyHint").textContent = "Show your left hand to play";
    $("expressionValue").textContent = "—";
    $("expressionHint").textContent = "Show your right hand to shape sound";
  }
}
function loop() {
  if (!active) return;
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    try {
      const result = tracker.detectForVideo(video,performance.now());
      analyze(result,performance.now());
      frame++;
      $("frameInfo").textContent = "FRAME " + String(frame).padStart(5,"0");
    } catch (error) {
      setStatus("TRACKING ERROR — " + String(error.message).slice(0,70),"error");
      stopCamera();
      return;
    }
  }
  requestAnimationFrame(loop);
}
async function loadTracker() {
  if (tracker) return tracker;
  const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.2/wasm");
  const options = {
    baseOptions: {modelAssetPath:"https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",delegate:"GPU"},
    runningMode:"VIDEO",numHands:2,minHandDetectionConfidence:0.55,minTrackingConfidence:0.5
  };
  try { tracker = await HandLandmarker.createFromOptions(vision,options); }
  catch (_) { options.baseOptions.delegate = "CPU"; tracker = await HandLandmarker.createFromOptions(vision,options); }
  return tracker;
}
async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error("Use Chrome over HTTPS or localhost to access your camera.");
  startButton.disabled = true;
  setStatus("INITIALIZING CAMERA...");
  try {
    stream = await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:"user",width:{ideal:1280},height:{ideal:720}}});
    video.srcObject = stream;
    await video.play();
    setStatus("LOADING HAND-TRACKING MODEL...");
    await loadTracker();
    await unlockAudio();
    active = true; lastVideoTime = -1; frame = 0;
    $("cameraIdle").hidden = true;
    document.querySelector(".stage").classList.add("active");
    startButton.textContent = "STOP CAMERA";
    setStatus("CAMERA ACTIVE","live");
    loop();
  } catch (error) {
    stopCamera();
    throw error;
  } finally { startButton.disabled = false; }
}
function stopCamera() {
  active = false;
  if (stream) { stream.getTracks().forEach((track) => track.stop()); stream=null; }
  video.pause(); video.srcObject=null;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  document.querySelector(".stage").classList.remove("active");
  $("cameraIdle").hidden = false;
  $("handCount").textContent = "0 HANDS";
  $("frameInfo").textContent = "WAITING FOR CAMERA";
  $("harmonyValue").textContent = "—";
  $("expressionValue").textContent = "—";
  $("harmonyHint").textContent = "Move horizontally to choose a chord";
  $("expressionHint").textContent = "Move up/down to shape volume";
  if (!demoRunning) stopVoices();
  startButton.textContent = "START CAMERA ↗";
  setStatus("READY TO START");
}
startButton.addEventListener("click",async () => {
  if (active) { stopCamera();return; }
  try { await startCamera(); }
  catch (error) { setStatus(String(error.message || error).slice(0,100),"error"); }
});
window.addEventListener("pagehide", () => {
  stopCamera();
  if (tracker) { tracker.close(); tracker=null; }
  if (audio) { audio.close(); audio=null; }
});