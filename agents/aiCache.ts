import crypto from 'crypto';
import { getDb } from './firebaseAdmin';

/**
 * Firestore-backed cache for deterministic Gemini answers.
 *
 * The daily DSA problem and ML concepts are the same content for every user,
 * so an uncached hint endpoint asks the model the identical question once per
 * user per view. On the free tier that is fatal: the quota is 20 requests per
 * day for the whole project, and a handful of people clicking "Get AI Hint"
 * exhausts it for everyone -- which is exactly how the feature went down.
 *
 * Keying on a hash of the prompt input means one generation per distinct piece
 * of content, ever, shared across all users. It also makes repeat views
 * instant, since a Firestore read beats a model call comfortably.
 */

const COLLECTION = 'aiCache';

function cacheKey(kind: string, input: string): string {
  const hash = crypto.createHash('sha256').update(input).digest('hex').slice(0, 32);
  return `${kind}_${hash}`;
}

export async function getOrGenerate(
  kind: string,
  input: string,
  generate: () => Promise<string>
): Promise<{ text: string; cached: boolean }> {
  const db = getDb();
  const ref = db.collection(COLLECTION).doc(cacheKey(kind, input));

  try {
    const snap = await ref.get();
    const cached = snap.data()?.text;
    if (typeof cached === 'string' && cached.length > 0) {
      return { text: cached, cached: true };
    }
  } catch (err) {
    // A cache read failure must not take the feature down -- fall through and
    // generate, exactly as if it had been a miss.
    console.error('AI cache read failed, generating instead:', err);
  }

  const text = await generate();

  try {
    await ref.set({ kind, text, createdAt: new Date().toISOString() });
  } catch (err) {
    console.error('AI cache write failed (answer still returned):', err);
  }

  return { text, cached: false };
}
