# Future Communication Upgrades

This document lists **planned, optional, and advanced improvements** for SmartGIG’s communication system. These are intentionally deferred to keep the current implementation stable and demo-ready.

---

## 1. Video Call – Future Enhancements

### 1.1 Media & Quality

* Adaptive bitrate based on network conditions
* Dynamic resolution switching (360p → 720p → 1080p)
* Hardware acceleration detection (GPU vs CPU)
* Manual video quality selector (Low / Medium / HD)
* Background blur or background replacement

### 1.2 Call Controls

* Screen sharing (entire screen / window / tab)
* Pause / resume video stream
* Switch camera (front ↔ back on mobile)
* Picture-in-picture (PiP) mode
* Fullscreen toggle per participant

### 1.3 Call Experience

* Call waiting / busy state handling
* Reconnect logic on temporary network drop
* Call recording (local or server-side)
* Live captions / subtitles (future AI feature)
* Raise hand / reactions

### 1.4 Scalability

* Group video calls (multi-party)
* Video rooms tied to contracts or meetings
* SFU-based architecture (Janus / mediasoup)

---

## 2. Audio Call – Future Enhancements

### 2.1 Audio Quality & Controls

* Push-to-talk mode
* Manual mic sensitivity control
* Output device selector (speaker / headphones)
* Audio level meter (live waveform / volume bars)
* Voice activity detection (VAD)

### 2.2 UX Improvements

* Audio-only minimized call bar
* Background audio support (continue while navigating)
* Call hold / resume
* Mute indicators for both sides

### 2.3 Advanced Audio

* Audio recording (with consent)
* Noise profile presets (Office / Home / Outdoor)
* Spatial audio (future experiment)

---

## 3. Chat System – Future Enhancements

### 3.1 Messaging Features

* Message reactions (👍 ❤️ 😂)
* Message editing
* Message deletion (for self / for everyone)
* Reply / quote messages
* Typing indicators

### 3.2 Attachments & Media

* Voice notes
* Image preview & gallery
* Video attachments
* File upload progress indicators
* File size limits per plan

### 3.3 UX & Productivity

* Pin important messages
* Star / bookmark messages
* Search within conversation
* Jump to unread messages
* Infinite scroll optimization

---

## 4. Call + Chat Integration

* Show call history inside chat timeline
* Join call directly from chat card
* Resume previous call context
* Shared notes during calls
* Post-call summary card
* **In-call chat panel (reuse existing conversation):**

  * Open the current conversation inside the active audio/video call
  * Send text messages and links while the call is ongoing
  * No new conversation is created per call
  * Messages persist before, during, and after the call in the same thread
  * Acts as an auxiliary panel, not a replacement for the main chat UI

---

## 5. Notifications & Presence

* Online / offline / busy status
* Call missed notifications
* Call reminder notifications
* Read receipts (optional)

---

## 6. Security & Privacy (Future)

* End-to-end encryption (E2EE)
* Per-call permission controls
* Call consent prompts
* Media device permission audit UI

---

## 7. Developer / Platform Enhancements

* Call analytics dashboard (duration, failures)
* Debug overlay (ICE state, bitrate, latency)
* Feature flags for experimental call features
* Environment-based call configs (dev / prod)

---

## 8. Explicitly Out of Scope (For Now)

These are **intentionally deferred**:

* Live streaming
* Webinar mode
* AI meeting summaries
* Translation / dubbing
* Cross-platform native apps

---

## Notes

* Current implementation is **1-to-1 WebRTC P2P**, optimized for reliability and clarity.
* Audio and Video calls are **strictly separated by design**.
* All items here are future upgrades, not blockers for launch or final-year evaluation.

---

*Last updated after stabilizing Audio + Video Call V1.*
