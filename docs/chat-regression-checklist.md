# Chat System — Permanent Regression Checklist

> Use this checklist every time a chat-related feature is modified.
> Goal: Detect silent breakages before tagging a release.

---

# 1️⃣ Core Messaging (TEXT)

## Send / Receive

* [ ] Sender can send text message
* [ ] Receiver receives in real-time (socket)
* [ ] Message persists after reload
* [ ] Message order correct (chronological)

## Delete

* [ ] Deleting message shows deleted placeholder
* [ ] Message remains in version history
* [ ] Reactions still accessible in history

## Edit

* [ ] Text message can be edited
* [ ] Edit history visible in version panel
* [ ] Edited message persists after reload

## Quote

* [ ] Can quote text message
* [ ] Quote preview shows correct content
* [ ] Quote works after original message deletion

## Reactions

* [ ] Add reaction updates in real-time
* [ ] Remove reaction updates in real-time
* [ ] Sidebar preview updates correctly
* [ ] Reaction persists after reload

---

# 2️⃣ Audio Messaging (AUDIO)

## Recording Flow

* [ ] Record button works
* [ ] Preview playback works before sending
* [ ] Send audio works

## Playback

* [ ] Sender can play audio
* [ ] Receiver can play audio
* [ ] Duration displays correctly (not 0:00)
* [ ] Works immediately after upload (no rebuild required)
* [ ] Works after reload

## Delete Behavior (B1 Rule)

* [ ] Deleting audio hides it in chat panel
* [ ] Audio remains playable in Version History
* [ ] audioUrl remains intact in DB

## Restrictions

* [ ] Audio cannot be edited
* [ ] Audio can be quoted
* [ ] Audio can receive reactions

## Sidebar

* [ ] Shows "🎵 Audio message"
* [ ] Role-aware preview works
* [ ] Reaction preview over audio works
* [ ] Removal fallback works

---

# 3️⃣ Attachments (PDF / Image / ZIP)

## Upload

* [ ] Upload succeeds
* [ ] File opens immediately (200 status)
* [ ] No 404 in network tab

## Persistence

* [ ] File opens after reload
* [ ] File opens without rebuild

## Delete

* [ ] Deleted placeholder appears
* [ ] Version history still accessible

---

# 4️⃣ Sidebar Behavior

* [ ] New text moves conversation to top
* [ ] New audio moves conversation to top
* [ ] New reaction moves conversation to top
* [ ] Removing latest reaction reverts correctly
* [ ] Reload keeps correct preview

---

# 5️⃣ Scroll System

## Initial Open

* [ ] Opens at first unread (if exists)
* [ ] Opens at bottom (if no unread)

## Divider

* [ ] Divider persists after read receipts
* [ ] Divider clears when user reaches bottom
* [ ] Live incoming sets divider while scrolled up

## Jump To Latest

* [ ] Button appears when new message while scrolled up
* [ ] Button scrolls to correct anchor
* [ ] Highlight animation works

---

# 6️⃣ Search (In-Conversation)

* [ ] Search opens/closes correctly
* [ ] Matches count correct
* [ ] Navigation cycles newest → oldest
* [ ] Active match centered on screen
* [ ] Clearing search resets highlights

---

# 7️⃣ RBAC + Identity

* [ ] Freelancer cannot access client routes
* [ ] Client cannot access freelancer routes
* [ ] Admin restrictions intact
* [ ] Chat online status correct

---

# 8️⃣ Production File Serving

* [ ] Newly uploaded files open immediately
* [ ] No rebuild required
* [ ] No middleware interference
* [ ] Direct URL returns 200

---

# 🧠 Usage Protocol

After ANY chat modification:

1. Run `npm run build`
2. Run `npm start`
3. Execute only the sections affected
4. If touching multiple layers → run full checklist
5. Tag only after all boxes pass

---

# 🔒 Stability Rule

If 2+ core systems break at once:

→ Stop
→ Revert to last stable tag
→ Re-implement feature in isolation

---

This document is the single source of truth for chat stability.
