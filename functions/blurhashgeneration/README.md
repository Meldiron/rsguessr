# blurhashGeneration

Walks every file in the `locationImages` storage bucket, generates a
[blurhash](https://blurha.sh) for each one, and stores it in the `blurhashes`
collection (document id = storage file id).

## 🧰 Usage

### Any method `/`

Iterates the whole bucket and generates blurhashes for files that don't have one yet.

**Query params**

| Param   | Value  | Description                                     |
| ------- | ------ | ----------------------------------------------- |
| `force` | `true` | Regenerate hashes even when one already exists. |

**Response**

```json
{
  "ok": true,
  "summary": { "total": 42, "generated": 40, "skipped": 2, "failed": 0 }
}
```

The job is resumable: re-running it only processes files that are still missing
a blurhash (unless `force=true`).

## ⚙️ Configuration

| Setting           | Value                                             |
| ----------------- | ------------------------------------------------- |
| Runtime           | Node (25)                                         |
| Entrypoint        | `src/main.js`                                     |
| Build Commands    | `npm install`                                     |
| Permissions       | `any`                                             |
| Scopes            | `files.read`, `documents.read`, `documents.write` |
| Timeout (Seconds) | 900                                               |

## 🔒 Environment Variables

No environment variables required — the function uses the dynamic API key
(`x-appwrite-key` header) scoped to the permissions above. `APPWRITE_API_KEY` is
honoured as a fallback if set.
