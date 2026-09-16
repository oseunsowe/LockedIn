import * as ImageManipulator from 'expo-image-manipulator';

import { supabase } from '@/lib/supabase';
import type { ProofType } from '@/lib/database.types';

export type PickedAsset = {
  uri: string;
  mimeType?: string | null;
  width?: number;
  height?: number;
  /** Display-only (e.g. a picked file's original name) — not used for the upload itself. */
  name?: string;
};

/** Long edge for photo/screenshot proof — plenty for Claude's vision input, a fraction of a raw
 * camera photo's size. Never upscales a smaller image (see the `width` guard below). */
const MAX_DIMENSION = 1600;

function randomId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function extensionFor(mimeType: string | null | undefined, fallback: string): string {
  const subtype = mimeType?.split('/')[1];
  return (subtype ? subtype.split('+')[0] : undefined) ?? fallback;
}

/**
 * Compresses an image proof client-side (TODO.md §8.2: "client-side compression before upload")
 * and uploads it — or an arbitrary file proof, uncompressed — to the private `proofs` Storage
 * bucket. The `{userId}/...` path prefix is load-bearing: it's what the bucket's RLS policies
 * (supabase/migrations/20260901000007_proof_storage_policies.sql) key off, not just a convention.
 */
export async function uploadProofAsset(params: {
  userId: string;
  proofType: ProofType;
  asset: PickedAsset;
}): Promise<{ path: string; contentType: string }> {
  const { userId, proofType, asset } = params;

  let uploadUri = asset.uri;
  let contentType = asset.mimeType ?? 'application/octet-stream';
  let ext = extensionFor(asset.mimeType, 'dat');

  if (proofType === 'photo' || proofType === 'screenshot') {
    const actions =
      asset.width && asset.width > MAX_DIMENSION ? [{ resize: { width: MAX_DIMENSION } }] : [];
    const compressed = await ImageManipulator.manipulateAsync(asset.uri, actions, {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    uploadUri = compressed.uri;
    contentType = 'image/jpeg';
    ext = 'jpg';
  }

  const path = `${userId}/${randomId()}.${ext}`;
  const response = await fetch(uploadUri);
  const blob = await response.blob();

  const { error } = await supabase.storage.from('proofs').upload(path, blob, {
    contentType,
    upsert: false,
  });
  if (error) throw error;

  return { path, contentType };
}
