// ============================================================
// src/content/lessons/index.ts
// Centralisation de toutes les leçons locales
// ============================================================

import type { Lesson } from '@/types';
import { MODULE_1_LESSONS } from './module1';
import { MODULE_2_LESSONS, MODULE_3_LESSONS } from './module2_3';
import { MODULE_4_LESSONS, MODULE_5_LESSONS, MODULE_6_LESSONS, MODULE_7_LESSONS } from './module4_7';

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
