import { Client, Storage, Databases, Query, Permission, Role } from 'node-appwrite';
import { encode } from 'blurhash';
import sharp from 'sharp';

const DATABASE_ID = 'main';
const COLLECTION_ID = 'blurhashes';
const BUCKET_ID = 'locationImages';

// Number of blurhash components. 4x3 suits the landscape location images.
const COMPONENT_X = 4;
const COMPONENT_Y = 3;

// How many files we pull per listFiles page.
const PAGE_SIZE = 100;

/**
 * Decodes an image buffer and produces a blurhash string for it.
 */
async function blurhashForImage(buffer) {
  const { data, info } = await sharp(buffer)
    // Downscale before encoding - blurhash only needs a tiny image and this
    // keeps memory/cpu low even for large source images.
    .resize(64, 64, { fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return encode(new Uint8ClampedArray(data), info.width, info.height, COMPONENT_X, COMPONENT_Y);
}

/**
 * Creates the blurhash document, or updates it if one already exists.
 */
async function saveBlurhash(databases, fileId, blurhash) {
  const data = { blurhash };
  const permissions = [Permission.read(Role.users())];

  try {
    await databases.createDocument(DATABASE_ID, COLLECTION_ID, fileId, data, permissions);
  } catch (err) {
    // 409 -> document already exists, update it instead.
    if (err.code === 409) {
      await databases.updateDocument(DATABASE_ID, COLLECTION_ID, fileId, data);
    } else {
      throw err;
    }
  }
}

// This Appwrite function walks every file in the locationImages bucket and
// upserts a blurhash document (keyed by fileId) into the blurhashes collection.
export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] ?? process.env.APPWRITE_API_KEY ?? '');

  const storage = new Storage(client);
  const databases = new Databases(client);

  // `?force=true` regenerates hashes even when one already exists.
  const force = req.query?.force === 'true' || req.query?.force === true;

  const summary = { total: 0, generated: 0, skipped: 0, failed: 0 };

  try {
    let cursor = null;

    // Paginate through the whole bucket using cursor pagination.
    while (true) {
      const queries = [Query.limit(PAGE_SIZE), Query.orderAsc('$id')];
      if (cursor) queries.push(Query.cursorAfter(cursor));

      const { files } = await storage.listFiles(BUCKET_ID, queries);
      if (files.length === 0) break;

      for (const file of files) {
        summary.total++;

        try {
          if (!force) {
            // Skip files that already have a blurhash.
            try {
              await databases.getDocument(DATABASE_ID, COLLECTION_ID, file.$id);
              summary.skipped++;
              continue;
            } catch {
              // Not found -> fall through and generate it.
            }
          }

          const arrayBuffer = await storage.getFileDownload(BUCKET_ID, file.$id);
          const blurhash = await blurhashForImage(Buffer.from(arrayBuffer));
          await saveBlurhash(databases, file.$id, blurhash);

          summary.generated++;
          log(`Generated blurhash for ${file.$id}: ${blurhash}`);
        } catch (err) {
          summary.failed++;
          error(`Failed for ${file.$id}: ${err.message}`);
        }
      }

      cursor = files[files.length - 1].$id;
      if (files.length < PAGE_SIZE) break;
    }
  } catch (err) {
    error('Listing files failed: ' + err.message);
    return res.json({ ok: false, message: err.message, summary }, 500);
  }

  log(`Done. ${JSON.stringify(summary)}`);
  return res.json({ ok: true, summary });
};
