# Audio Message System — Future Upgrade Specification

> Status: Deferred (Rollback to last stable commit recommended)
> Goal: Implement audio messages WITHOUT breaking existing chat systems.

---

# 1. Core Philosophy

Audio messages must behave exactly like normal messages in the system.

They should:

* Follow the same lifecycle as TEXT messages
* Work with reactions
* Work with quoting
* Work with unread divider
* Work with jump-to-latest
* Work with sidebar preview logic
* Work with version history
* Respect deletion rules

They must NOT:

* Break existing message logic
* Introduce special-case branching across the system
* Modify unrelated chat subsystems

---

# 2. Message Model Requirements

## 2.1 Database

Message table must include:

```
type        String   @default("TEXT")  // TEXT | AUDIO | CALL
audioUrl    String?  // Only set when type = 'AUDIO'
```

Rules:

* TEXT → content required
* AUDIO → content empty string, audioUrl required
* CALL → callMeta required

No separate Audio table.
Audio is just another message type.

---

# 3. Audio Message Lifecycle

## 3.1 Record

* Use MediaRecorder API
* Store Blob locally
* Show preview player before sending

## 3.2 Preview (Before Send)

* Local blob playback allowed
* User can:

  * Send
  * Discard

## 3.3 Send

Flow:

1. Upload blob to `/public/uploads/chat/`
2. Receive URL: `/uploads/chat/<filename>.webm`
3. Call sendMessage with:

```
type = 'AUDIO'
content = ''
audioUrl = returned URL
```

---

# 4. Rendering Rules

## 4.1 In Conversation Panel

If:

```
message.type === 'AUDIO'
```

Render:

```
<audio controls src={message.audioUrl} preload="metadata" />
```

No edit button.
Delete button allowed.
React allowed.
Quote allowed.

---

# 5. Editing Rules

| Type  | Editable? |
| ----- | --------- |
| TEXT  | ✅ Yes     |
| AUDIO | ❌ No      |
| CALL  | ❌ No      |

UI must hide Edit button when:

```
message.type !== 'TEXT'
```

---

# 6. Deletion Rules (B1 Requirement)

Deletion must:

```
isDeleted = true
```

Must NOT:

* Remove audioUrl
* Remove reactions
* Remove message versions

## 6.1 Conversation Panel

If:

```
message.isDeleted === true
```

Render:

"🗑️ This message was deleted"

Audio player must NOT appear in main panel.

---

# 7. Version History Behavior (Critical Requirement)

Version history must ignore `isDeleted`.

If a deleted AUDIO message exists:

In Version History Panel:

```
Render audio player normally
```

Even if:

```
isDeleted === true
```

This ensures:

* Both users can still listen to deleted audio in history
* System preserves accountability

---

# 8. Sidebar Preview Rules

Audio must behave like a normal lastMessage.

## 8.1 Basic Audio Preview

If lastMessage.type === 'AUDIO'

Display:

```
🎵 Audio message
```

---

## 8.2 Role-Aware Reaction Preview

When a reaction happens on AUDIO message:

Client UI:

"You reacted 🩷 to 🎵 Audio message"

Freelancer UI:

"Dennis reacted 🩷 to 🎵 Audio message"

Same formatting logic as TEXT.

---

# 9. Reaction Rules

Audio messages:

* Can receive reactions
* Appear in reaction timeline
* Participate in latest-reaction sidebar preview
* Persist across reload
* Restore correct ordering if latest reaction removed

Reaction timeline system must treat AUDIO same as TEXT.

Only difference:

When deriving preview content:

```
if message.content === '' and type === 'AUDIO'
    display '🎵 Audio message'
```

---

# 10. Quote Rules

Quoting AUDIO must show:

```
🎵 Audio message
```

If quoted message is deleted:

Show:

```
🗑️ This message was deleted
```

Quote system must not break.

---

# 11. Scroll & Divider Compatibility

Audio messages must:

* Participate in unread divider
* Participate in jump-to-latest
* Not affect scroll determinism

No special-case scroll logic.

---

# 12. Search Behavior

Search should NOT match AUDIO messages.

Reason:

* content = ''
* No textual content

No special handling needed.

---

# 13. Upload Requirements

Audio files must:

* Be saved in `/public/uploads/chat/`
* Be accessible via `/uploads/chat/<filename>`
* Return 200 in browser
* Have valid Content-Type (audio/webm etc)
* Not return 404

Failure here causes:

* 0:00 / 0:00 playback

---

# 14. What Must NOT Be Touched

While implementing audio:

Do NOT modify:

* Reaction state machine
* Unread divider system
* Jump-to-latest logic
* Scroll logic
* useChat message ordering
* Socket protocol (unless adding audioUrl field only)
* Version history core logic

Audio must integrate into existing architecture.

---

# 15. Regression Checklist (Future Implementation)

When re-attempting audio, verify:

## Core

* [ ] Send text still works
* [ ] Edit text still works
* [ ] Delete text still works
* [ ] Reactions still persist
* [ ] Reaction removal restores correctly
* [ ] Sidebar ordering correct

## Audio

* [ ] Record
* [ ] Preview
* [ ] Send
* [ ] Play (sender)
* [ ] Play (receiver)
* [ ] Delete
* [ ] Version history playback still works after deletion
* [ ] Reaction preview correct
* [ ] Sidebar preview correct
* [ ] Quote correct
* [ ] No console errors

---

# 16. Final Rule

Audio must behave like a normal message type.

If at any point implementation requires rewriting core chat logic,

Stop.

Re-architect instead of patching.

---

END OF SPECIFICATION
