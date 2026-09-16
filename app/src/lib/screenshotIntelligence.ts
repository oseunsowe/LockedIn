import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Screenshot Intelligence (TODO.md §10). Client-side half of the "never persist raw screenshots
 * server-side" rule: images are compressed here, base64-encoded, sent directly in the
 * `scan-screenshots` request body, and never touch Supabase Storage — there is no bucket for
 * screenshots anywhere in this app, deliberately (see the migration's own doc comment).
 *
 * Smaller target than proof photos (`src/lib/proofUpload.ts`'s 1600px/0.7): a screenshot only
 * needs to stay legible for text/UI extraction, not hold up as photographic evidence, and a batch
 * of up to `MAX_BATCH_SIZE` of them travels in one request body — keeping each one smaller keeps
 * that request comfortably sized.
 */
export const MAX_BATCH_SIZE = 10;
const MAX_DIMENSION = 1200;

export type EncodedImage = { id: string; base64: string; mediaType: string };

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read image data.'));
    reader.onload = () => {
      const result = reader.result as string; // "data:image/jpeg;base64,AAAA..."
      const commaIndex = result.indexOf(',');
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.readAsDataURL(blob);
  });
}

/** Compresses one picked screenshot and returns it ready to embed in the scan request body. */
export async function compressAndEncode(
  id: string,
  uri: string,
  width: number | undefined,
): Promise<EncodedImage> {
  const actions = width && width > MAX_DIMENSION ? [{ resize: { width: MAX_DIMENSION } }] : [];
  const compressed = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: 0.6,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  const response = await fetch(compressed.uri);
  const blob = await response.blob();
  const base64 = await blobToBase64(blob);
  return { id, base64, mediaType: 'image/jpeg' };
}
