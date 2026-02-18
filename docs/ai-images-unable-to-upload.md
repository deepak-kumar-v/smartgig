# 📌 Future Upgrade — Robust Attachment Upload System

## Status  
⚠️ Deferred — Upload system shows inconsistent behavior with certain PNG files and occasionally locks the UI.

---

## 🐛 Current Problems

### 1️⃣ PNG Upload Inconsistency

- Some PNG files upload successfully.
- Some PNG files fail silently.
- AI-generated PNG files are especially problematic.
- Same file sometimes works after re-saving in Paint.
- Backend validation has already been relaxed (image/* allowed).
- Issue is inconsistent and difficult to reproduce deterministically.

### 2️⃣ UI Lock After Failed Upload

When certain files fail:

- Cursor shows 🚫 over attachment button.
- File input becomes unresponsive.
- User cannot select another file.
- Requires full page reload to recover.
- No clear error feedback shown to user.

### 3️⃣ Behavior Differences Between Files

| File Type | Behavior |
|-----------|----------|
| JPG       | Works consistently |
| PDF       | Works |
| PNG (normal) | Sometimes works |
| PNG (AI-generated) | Often fails |
| Audio     | Works (after static serving fix) |

---

# 🎯 Required Final Behavior

## A. File Upload Requirements

1. The system must allow:
   - image/*
   - audio/*
   - pdf
   - office files
   - zip
   - txt
   - csv
   - xlsx
   - pptx
   - generic binary files

2. The system must:
   - Never silently fail.
   - Always show user-visible error on failure.
   - Never lock the UI.
   - Always allow selecting another file immediately.

3. If a file is invalid:
   - Show clear error message.
   - Reset upload state.
   - Keep attachment button interactive.

---

## B. UI State Requirements

1. `isUploading` must:
   - Only be true during active upload.
   - Always reset in `finally`.
   - Never remain stuck true.

2. `<input type="file">` must:
   - Never stay disabled after failure.
   - Always clear its value after attempt.
   - Always be re-clickable without reload.

3. Cursor must:
   - Never show 🚫 permanently.
   - Only reflect disabled state during actual upload.

---

## C. Error Handling Requirements

On failure:

- Catch all thrown exceptions.
- Catch server action serialization errors.
- Catch file reading errors.
- Catch MIME issues.
- Log error in console.
- Show user notification.

---

## D. Security Requirements

System must:

- Block:
  - .exe
  - .msi
  - .bat
  - .cmd
  - .js
  - .html
  - application/javascript
  - text/html

- Allow safe formats.
- Prevent path traversal.
- Prevent overwriting files.
- Limit size (10MB currently acceptable).

---

## E. Stability Requirement

Upload failure must NEVER affect:

- Chat message sending
- Reactions
- Scroll state machine
- Unread divider
- Jump-to-latest
- Sidebar preview
- Socket connection
- Audio playback
- Version history

---

# 🔎 Suspected Root Causes (Unresolved)

1. Corrupted PNG metadata from AI image tools.
2. Browser-level MIME mismatch.
3. File header mismatch (PNG signature mismatch).
4. Server action serialization boundary issues.
5. Input accept attribute filtering edge cases.
6. React state race condition on file input.
7. OS-level file locking behavior.

Not conclusively identified.

---

# 🛠 Proper Long-Term Fix (Future Implementation)

Instead of current server action upload:

### Recommended Upgrade Path:

1. Replace server action upload with dedicated `/api/upload` route.
2. Use streaming upload instead of FormData server action.
3. Validate file signature (magic number), not just MIME.
4. Normalize image files server-side (sharp).
5. Return structured error response.
6. Add centralized upload error toast system.
7. Add upload retry mechanism.
8. Add upload status indicator.
9. Add integration tests for upload behavior.

---

# 📈 Testing Matrix Required (When Revisited)

| Scenario | Expected Result |
|----------|-----------------|
| Valid PNG | Upload success |
| Corrupted PNG | Clear error, UI unlocked |
| Oversized file | Clear error |
| Blocked extension | Clear error |
| Cancel upload | UI unlocked |
| Network failure | UI unlocked |
| Rapid double click | No lock |
| Re-upload same file | Allowed |

---

# 🧠 Decision

This feature is currently functional for most files but unstable for edge PNG cases.

Given time constraints and feature fatigue, we defer a full refactor to a future milestone.
