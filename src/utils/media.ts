// ============================================================
// src/utils/media.ts
// Génération dynamique des URL publiques Firebase Storage
// avec protection de chemin obfuscé
// ============================================================

const BUCKET = 'polonais-facile.firebasestorage.app';
const BASE_URL = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o`;

// Segment de chemin secret obfusqué pour empêcher le scraping de dossier
export const SECRET_PATH = 'v9k2p7m4q1z8n5x3';

/**
 * Génère l'URL publique Firebase Storage pour l'image d'un item
 * Exemple : https://firebasestorage.googleapis.com/v0/b/polonais-facile.firebasestorage.app/o/images%2Fv9k2p7m4q1z8n5x3%2Fvocab_fam_01.jpg?alt=media
 */
export function getImageUrl(itemId: string, ext = 'jpg'): string {
  if (!itemId) return '';
  return `${BASE_URL}/${encodeURIComponent(`images/${SECRET_PATH}/${itemId}.${ext}`)}?alt=media`;
}

/**
 * Génère l'URL publique Firebase Storage pour l'audio d'un item
 * Exemple : https://firebasestorage.googleapis.com/v0/b/polonais-facile.firebasestorage.app/o/audio%2Fv9k2p7m4q1z8n5x3%2Fvocab_fam_01.mp3?alt=media
 */
export function getAudioUrl(itemId: string, ext = 'mp3'): string {
  if (!itemId) return '';
  return `${BASE_URL}/${encodeURIComponent(`audio/${SECRET_PATH}/${itemId}.${ext}`)}?alt=media`;
}
