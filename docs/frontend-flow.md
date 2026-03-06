# Frontend Flow & WebSocket Protocol

A concise walkthrough of how the React frontend communicates with the Spring Boot backend via STOMP-over-WebSocket.

---

## 1. Connect & Hello Handshake

- **On page load**, `ChatPage` calls `connect()` eagerly so the WebSocket is ready before the user clicks anything.
- `useWebSocket` creates a `@stomp/stompjs` `Client` with `brokerURL` from `env.ts` (runtime `window.__APP_CONFIG__` or build-time `VITE_WS_BROKER_URL`).
- On STOMP connect:
  1. Subscribe to **`/topic/hello`** (broadcast topic, filtered by `clientId`).
  2. Publish to **`/app/hello`** with `{ clientId }`.
  3. Backend responds with `HelloResponse { clientId, sessionId }` on `/topic/hello`.
  4. Client stores `sessionId`, then subscribes to per-user channels:
     - **`/topic/match/{sessionId}`** — match lifecycle events
     - **`/topic/system/{sessionId}`** — identity / error / info
  5. Unsubscribe from `/topic/hello` after receiving own response.
  6. Subscribe to **`/topic/online-count`** and publish to **`/app/online-count`** immediately + every 8 s.

| Direction | Destination | Payload (DTO) |
|-----------|-------------|---------------|
| Send | `/app/hello` | `HelloMessage { clientId: string }` |
| Receive | `/topic/hello` | `HelloResponse { clientId, sessionId }` |
| Receive | `/topic/system/{sessionId}` | `SystemEvent { type: 'IDENTITY'\|'ERROR'\|'INFO', message }` |

---

## 2. Join Queue (Gender + Preference)

- User selects gender on `HomeView` → clicks **Start Chatting** → enters `LobbyView`.
- User picks chat-with preference (Males / Females / Anyone) → clicks **Find Partner**.
- `ChatPage` calls `join(preference, gender)` which publishes to **`/app/join`**:

```json
{ "gender": "MALE", "preference": "BOTH" }
```

- A 30-second no-match timeout starts; if no `MATCHED` arrives, `noMatchFound` flips to `true` and searching stops.

| Direction | Destination | Payload |
|-----------|-------------|---------|
| Send | `/app/join` | `JoinRequest { gender, preference }` |

---

## 3. Match Events on `/topic/match/{sessionId}`

All match lifecycle events arrive as `MatchResponse`:

```ts
{ type: 'MATCHED' | 'SEARCHING' | 'PARTNER_LEFT' | 'PARTNER_NEXT', roomId?: string, message?: string }
```

### SEARCHING
- Backend confirms user is queued. UI shows the search-pulse animation.

### MATCHED
- Contains `roomId`. Frontend:
  1. Clears old messages and timers.
  2. Sets `connectionState.roomId` → renders `ChatRoomView`.
  3. Subscribes to **`/topic/room/{roomId}`** for chat messages.
  4. Shows "Connected to chat room!" system bubble.

### PARTNER_LEFT
- Partner clicked **Leave**. Frontend:
  1. Immediately publishes **`/app/leave`** so backend removes this user from auto-queue.
  2. Sets `ignoreBackendSearchingRef = true` to ignore stale SEARCHING/MATCHED from auto-queue.
  3. Unsubscribes from room topic.
  4. `ChatPage` detects `partnerAction === 'left'` and **auto-joins** with last preference.

### PARTNER_NEXT
- Partner clicked **Next**. Same cleanup as PARTNER_LEFT, except:
  - `ChatPage` shows the LobbyView **without** auto-joining — user decides manually.

---

## 4. Room Messages on `/topic/room/{roomId}`

Messages arrive as `ChatMessage`:

```ts
{ senderId?: string, message: string, type?: 'SYSTEM' | 'USER_LEFT' | 'USER_JOINED' }
```

- If `senderId` is present → compare to local `anonId` → render as `'me'` or `'other'` bubble.
- If `type` is present but no `senderId` → render as system bubble (auto-dismissed after 5 s).
- Sending: publish to **`/app/message`** with `MessageRequest { roomId, message }`.

| Direction | Destination | Payload |
|-----------|-------------|---------|
| Send | `/app/message` | `MessageRequest { roomId, message }` |
| Receive | `/topic/room/{roomId}` | `ChatMessage { senderId?, message, type? }` |

---

## 5. Next / Leave / Disconnect

| Action | Button | Backend Destination | Behaviour |
|--------|--------|--------------------|-----------| 
| **Next** | Chat header "Next" | `/app/next` | Resets room, enters searching state, starts 30 s timeout |
| **Leave** (from chat) | Chat header "Leave" | `/app/leave` | Resets room, navigates back to HomeView |
| **Leave** (from lobby) | Lobby "Leave" | _(none — WS stays alive)_ | Returns to HomeView without notifying backend |
| **Disconnect** | _(unmount only)_ | `client.deactivate()` | Full WebSocket teardown |

---

## 6. Online Count

- **Subscribe:** `/topic/online-count` — backend may send `{ count: number }` or a bare number.
- **Request:** `/app/online-count` (body `{}`) — triggers a point-to-point response.
- Polled every **8 seconds** to keep each tab's display fresh.
- Displayed in `HomeView`'s top-right badge. Falls back to "1 online" when connected but no count received yet, or "connecting..." when WebSocket is not yet established.

| Direction | Destination | Payload |
|-----------|-------------|---------|
| Send | `/app/online-count` | `{}` |
| Receive | `/topic/online-count` | `OnlineCountMessage { count }` or bare `number` |

---

## Component → View Routing (ChatPage state machine)

```
HomeView                          ← default (not inLobby, no roomId, not inGameZone)
  ↓ Start Chatting (gender)
LobbyView                        ← inLobby && !roomId
  ↓ Find Partner → /app/join
  ↓ MATCHED → roomId set
ChatRoomView                     ← connected && roomId
  ↓ Leave  → /app/leave          → HomeView
  ↓ Next   → /app/next           → LobbyView (searching)
  ↓ PARTNER_LEFT                  → LobbyView (auto-join)
  ↓ PARTNER_NEXT                  → LobbyView (manual join)
GameZoneView                     ← inGameZone (from Home)
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/hooks/useWebSocket.ts` | All STOMP connection logic, subscriptions, state management |
| `src/pages/ChatPage.tsx` | View routing state machine, partner-action effects |
| `src/types/chat.ts` | TypeScript interfaces matching backend DTOs |
| `src/config/env.ts` | Runtime / build-time broker URL resolution |
| `src/components/HomeView.tsx` | Landing page, gender selection, online count badge |
| `src/components/LobbyView.tsx` | Preference selection, searching animation, no-match state |
| `src/components/ChatRoomView.tsx` | Chat window, message input, Next/Leave buttons |
| `src/components/ChatWindow.tsx` | Scrollable message list with auto-scroll |
| `src/components/ChatBubble.tsx` | Individual message rendering (me / other / system) |
| `src/components/Navbar.tsx` | Top nav bar with side-drawer profile panel |

---

## Missing / Future UI Considerations

- **Typing indicators** — backend may support typing events; no frontend handling exists yet.
- **Bot messages** — no special rendering for bot-sent messages.  
- **Leave button in searching state** — lobby has a Leave button that returns to Home, but doesn't cancel the backend queue (backend will auto-timeout).
- **Online count in chat room** — count is only shown on HomeView; could be added to the Navbar or chat header.
