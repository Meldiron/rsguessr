import { Client, Databases, Storage, Query, ID, Permission, Role } from 'node-appwrite';

const DB = 'main';
const BUCKET = 'locationImages';
const SLUG_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,35}$/;

// Authenticated API for managing packs, their locations and coordinates.
//
// Security model: clients can NOT create/update/delete packs, locations or
// coordinates directly (the collections grant no write access to users). Every
// mutation goes through this function, which:
//   1. trusts `x-appwrite-user-id` (set by Appwrite for the authenticated
//      caller, not user-controllable),
//   2. verifies the caller owns the pack, and
//   3. refuses any change to a pack that is in `packRecommendations`.
// Only then does it use the privileged dynamic API key to perform the write.
export default async ({ req, res, error }) => {
  const userId = req.headers['x-appwrite-user-id'];
  if (!userId) {
    return res.json({ ok: false, message: 'You must be signed in.' }, 401);
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body ?? {};
  } catch {
    return res.json({ ok: false, message: 'Invalid request body.' }, 400);
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] ?? process.env.APPWRITE_API_KEY ?? '');

  const databases = new Databases(client);
  const storage = new Storage(client);

  // Ownership is encoded in the pack's document permissions (the creator gets
  // update/delete on their own pack) rather than a data attribute.
  function ownsPack(pack) {
    const perms = pack.$permissions ?? [];
    return (
      perms.includes(`update("user:${userId}")`) || perms.includes(`delete("user:${userId}")`)
    );
  }

  // Recommended packs are curated/blessed and locked from any further changes.
  async function assertNotRecommended(packId) {
    const res = await databases.listDocuments(DB, 'packRecommendations', [
      Query.equal('packId', packId),
      Query.limit(1)
    ]);
    if (res.total > 0) {
      const err = new Error('This pack is recommended and can no longer be changed.');
      err.status = 403;
      throw err;
    }
  }

  // Loads a pack and verifies the caller owns it.
  async function assertPackOwner(packId) {
    const pack = await databases.getDocument(DB, 'packs', packId);
    if (!ownsPack(pack)) {
      const err = new Error('You do not own this pack.');
      err.status = 403;
      throw err;
    }
    return pack;
  }

  // Loads a pack and verifies the caller may modify it (owner + not recommended).
  async function assertPackWritable(packId) {
    const pack = await assertPackOwner(packId);
    await assertNotRecommended(packId);
    return pack;
  }

  // Loads a location and verifies its pack may be modified.
  async function assertLocationWritable(locationId) {
    const location = await databases.getDocument(DB, 'locations', locationId);
    await assertPackWritable(location.packId);
    return location;
  }

  async function findCoordinate(locationId) {
    const docs = await databases.listDocuments(DB, 'locationCoordinates', [
      Query.equal('locationId', locationId),
      Query.limit(1)
    ]);
    return docs.documents[0] ?? null;
  }

  // Deletes a location together with its coordinate(s) and image file.
  async function removeLocation(location) {
    const coords = await databases.listDocuments(DB, 'locationCoordinates', [
      Query.equal('locationId', location.$id),
      Query.limit(100)
    ]);
    for (const coord of coords.documents) {
      await databases.deleteDocument(DB, 'locationCoordinates', coord.$id);
    }
    await databases.deleteDocument(DB, 'locations', location.$id);
    if (location.imageId) {
      try {
        await storage.deleteFile(BUCKET, location.imageId);
      } catch {
        /* file may already be gone */
      }
    }
  }

  try {
    const action = body.action;

    // ===================== PACKS =====================

    // --- Read the (private) answer coordinates for a pack you own ----------
    if (action === 'getCoordinates') {
      const { packId } = body;
      if (!packId) return res.json({ ok: false, message: 'Missing packId.' }, 400);

      await assertPackOwner(packId);

      const locations = await databases.listDocuments(DB, 'locations', [
        Query.equal('packId', packId),
        Query.select(['$id']),
        Query.limit(5000)
      ]);
      const locationIds = locations.documents.map((l) => l.$id);

      const coords = {};
      if (locationIds.length > 0) {
        const coordsRes = await databases.listDocuments(DB, 'locationCoordinates', [
          Query.equal('locationId', locationIds),
          Query.limit(5000)
        ]);
        for (const c of coordsRes.documents) {
          coords[c.locationId] = { $id: c.$id, lat: c.lat, lng: c.lng };
        }
      }

      return res.json({ ok: true, coords });
    }

    // --- Create a pack ------------------------------------------------------
    if (action === 'createPack') {
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
      if (!name) return res.json({ ok: false, message: 'Please enter a pack name.' }, 400);
      if (!SLUG_RE.test(slug)) {
        return res.json({ ok: false, message: 'Invalid slug.' }, 400);
      }

      const pack = await databases.createDocument(
        DB,
        'packs',
        slug,
        { name },
        // Everyone can read/play; the creator owns it (update/delete).
        [
          Permission.read(Role.users()),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId))
        ]
      );

      return res.json({ ok: true, pack });
    }

    // --- Rename a pack ------------------------------------------------------
    if (action === 'updatePack') {
      const { packId } = body;
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      if (!packId) return res.json({ ok: false, message: 'Missing packId.' }, 400);
      if (!name) return res.json({ ok: false, message: 'Please enter a pack name.' }, 400);

      await assertPackWritable(packId);
      const pack = await databases.updateDocument(DB, 'packs', packId, { name });
      return res.json({ ok: true, pack });
    }

    // --- Delete a pack and everything under it ------------------------------
    if (action === 'deletePack') {
      const { packId } = body;
      if (!packId) return res.json({ ok: false, message: 'Missing packId.' }, 400);

      await assertPackWritable(packId);

      const locations = await databases.listDocuments(DB, 'locations', [
        Query.equal('packId', packId),
        Query.limit(5000)
      ]);
      for (const location of locations.documents) {
        await removeLocation(location);
      }

      await databases.deleteDocument(DB, 'packs', packId);
      return res.json({ ok: true });
    }

    // ===================== LOCATIONS =====================

    // --- Create a location + its (private) answer coordinate ---------------
    if (action === 'createLocation') {
      const { packId, imageId, hint, lat, lng, view } = body;
      // A location is meaningless without an answer, so coordinates are required.
      if (!packId || !imageId || !hint || typeof lat !== 'number' || typeof lng !== 'number') {
        return res.json({ ok: false, message: 'A location needs an image, a hint and a coordinate.' }, 400);
      }

      await assertPackWritable(packId);

      const location = await databases.createDocument(
        DB,
        'locations',
        ID.unique(),
        { packId, imageId, hint, view: typeof view === 'string' ? view : null },
        // Players can read the location to play; nobody can write it via the client.
        [Permission.read(Role.users())]
      );

      // Coordinate creation must succeed; otherwise roll the location back so we
      // never leave a location without its answer.
      try {
        await databases.createDocument(
          DB,
          'locationCoordinates',
          ID.unique(),
          { locationId: location.$id, lat, lng },
          // The answer is readable only by the owner (and the server via API key).
          [Permission.read(Role.user(userId))]
        );
      } catch (err) {
        try {
          await databases.deleteDocument(DB, 'locations', location.$id);
        } catch {
          /* best effort */
        }
        throw err;
      }

      return res.json({ ok: true, location });
    }

    // --- Update a location (hint / image / view) and/or its coordinate -----
    if (action === 'updateLocation') {
      const { locationId, hint, imageId, lat, lng, view } = body;
      if (!locationId) {
        return res.json({ ok: false, message: 'Missing locationId.' }, 400);
      }

      const location = await assertLocationWritable(locationId);

      const patch = {};
      if (typeof hint === 'string' && hint.trim()) patch.hint = hint.trim();
      if (typeof imageId === 'string' && imageId && imageId !== location.imageId) {
        patch.imageId = imageId;
      }
      if (typeof view === 'string' && view !== location.view) patch.view = view;

      let updated = location;
      if (Object.keys(patch).length > 0) {
        updated = await databases.updateDocument(DB, 'locations', locationId, patch);
        // Clean up the now-orphaned old image.
        if (patch.imageId && location.imageId) {
          try {
            await storage.deleteFile(BUCKET, location.imageId);
          } catch {
            /* file may already be gone */
          }
        }
      }

      if (typeof lat === 'number' && typeof lng === 'number') {
        const existing = await findCoordinate(locationId);
        if (existing) {
          await databases.updateDocument(DB, 'locationCoordinates', existing.$id, { lat, lng });
        } else {
          await databases.createDocument(
            DB,
            'locationCoordinates',
            ID.unique(),
            { locationId, lat, lng },
            [Permission.read(Role.user(userId))]
          );
        }
      }

      return res.json({ ok: true, location: updated });
    }

    // --- Delete a location, its coordinate(s) and its image ----------------
    if (action === 'deleteLocation') {
      const { locationId } = body;
      if (!locationId) {
        return res.json({ ok: false, message: 'Missing locationId.' }, 400);
      }

      const location = await assertLocationWritable(locationId);
      await removeLocation(location);

      return res.json({ ok: true });
    }

    return res.json({ ok: false, message: 'Unknown action.' }, 400);
  } catch (err) {
    error(`${body?.action ?? 'unknown'} failed: ${err.message}`);
    return res.json({ ok: false, message: err.message }, err.status ?? 500);
  }
};
