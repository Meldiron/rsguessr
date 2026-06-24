# api

Authenticated API for managing packs, their locations and their (private)
answer coordinates. Clients cannot write to the `packs` / `locations` /
`locationCoordinates` collections directly — every mutation goes through this
function, which verifies the caller (via the trusted `x-appwrite-user-id`
header) owns the target pack and that the pack is **not recommended**. A pack
whose id is in `packRecommendations` is locked: every action below is refused
with 403.

## 🧰 Usage

Execute the function with a JSON body containing an `action` and its fields.
Call it **synchronously** (`async = false`) so the response body is returned.

### `createPack`

```json
{ "action": "createPack", "name": "...", "slug": "my-pack" }
```

The `slug` becomes the pack's document id.

### `updatePack`

```json
{ "action": "updatePack", "packId": "...", "name": "..." }
```

### `deletePack`

```json
{ "action": "deletePack", "packId": "..." }
```

Removes the pack and all of its locations, coordinates and images.

### `getCoordinates`

```json
{ "action": "getCoordinates", "packId": "..." }
```

Returns the private answer coordinates for a pack you own, keyed by location id:
`{ "ok": true, "coords": { "<locationId>": { "$id", "lat", "lng" } } }`. These are
not client-readable, so the editor fetches them through here.

### `createLocation`

```json
{ "action": "createLocation", "packId": "...", "imageId": "...", "hint": "...", "lat": 3200, "lng": 3200 }
```

### `updateLocation`

```json
{ "action": "updateLocation", "locationId": "...", "hint": "...", "imageId": "...", "lat": 3200, "lng": 3200 }
```

All fields except `locationId` are optional.

### `deleteLocation`

```json
{ "action": "deleteLocation", "locationId": "..." }
```

Also removes the location's coordinate(s) and image file.

**Response**

```json
{ "ok": true, "location": { "...": "..." } }
```

On error: `{ "ok": false, "message": "..." }` with an appropriate status code
(401 unauthenticated, 403 not the owner, 400 bad input).

## ⚙️ Configuration

| Setting           | Value                                          |
| ----------------- | ---------------------------------------------- |
| Runtime           | Node (25)                                      |
| Entrypoint        | `src/main.js`                                  |
| Build Commands    | `npm install`                                  |
| Execute access    | `users`                                        |
| Scopes            | `documents.read`, `documents.write`, `files.write` |
| Timeout (Seconds) | 15                                             |

## 🔒 Environment Variables

No environment variables required — uses the dynamic API key (`x-appwrite-key`).
`APPWRITE_API_KEY` is honoured as a fallback if set.
