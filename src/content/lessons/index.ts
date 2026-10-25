// ============================================================
// src/content/lessons/index.ts
// Centralisation de toutes les leçons locales
// ============================================================

import type { Lesson } from '@/types';
import { MODULE_1_LESSONS } from './module1';
import { MODULE_2_LESSONS, MODULE_3_LESSONS } from './module2_3';
import { MODULE_4_LESSONS, MODULE_5_LESSONS, MODULE_6_LESSONS, MODULE_7_LESSONS } from './module4_7';
import { MODULE_8_LESSONS } from './module08';
import { MODULE_9_LESSONS } from './module09';
import { MODULE_10_LESSONS } from './module10';
import { MODULE_11_LESSONS } from './module11';
import { MODULE_12_LESSONS } from './module12';
import { MODULE_13_LESSONS } from './module13';
import { MODULE_14_LESSONS } from './module14';
import { MODULE_15_LESSONS } from './module15';
import { MODULE_16_LESSONS } from './module16';
import { MODULE_17_LESSONS } from './module17';
import { MODULE_18_LESSONS } from './module18';
import { MODULE_19_LESSONS } from './module19';
import { MODULE_20_LESSONS } from './module20';

/**
 * Liste complète de toutes les leçons disponibles localement.
 */
export const ALL_LOCAL_LESSONS: Lesson[] = [
  ...MODULE_1_LESSONS,
  ...MODULE_2_LESSONS,
  ...MODULE_3_LESSONS,
  ...MODULE_4_LESSONS,
  ...MODULE_5_LESSONS,
  ...MODULE_6_LESSONS,
  ...MODULE_7_LESSONS,
  ...MODULE_8_LESSONS,
  ...MODULE_9_LESSONS,
  ...MODULE_10_LESSONS,
  ...MODULE_11_LESSONS,
  ...MODULE_12_LESSONS,
  ...MODULE_13_LESSONS,
  ...MODULE_14_LESSONS,
  ...MODULE_15_LESSONS,
  ...MODULE_16_LESSONS,
  ...MODULE_17_LESSONS,
  ...MODULE_18_LESSONS,
  ...MODULE_19_LESSONS,
  ...MODULE_20_LESSONS,
];

/**
 * Récupère une leçon par son ID unique.
 * @param id L'identifiant de la leçon (ex: 'lesson_1_1')
 */
export function getLessonById(id: string): Lesson | undefined {
  return ALL_LOCAL_LESSONS.find(lesson => lesson.id === id);
}

/**
 * Récupère toutes les leçons d'un module spécifique.
 * @param moduleId L'identifiant du module (ex: 'module_1')
 */
export function getLessonsByModule(moduleId: string): Lesson[] {
  return ALL_LOCAL_LESSONS.filter(lesson => lesson.moduleId === moduleId);
}
