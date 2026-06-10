/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Priority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  name: string;
  deadline: string; // e.g., "12:00" or "第一節下課"
  duration: 20 | 40; // in minutes
  completed: boolean;
  priority: Priority;
  dayOfWeek: number; // 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat, 7 = Sun
  slotId: string | null; // e.g. "slot_1" or null if unscheduled
  createdAt: string; // YYYY-MM-DD
}

export interface Slot {
  id: string;
  name: string;
  time: string; // e.g., "08:40–09:20"
  type: 'morning' | 'afternoon' | 'evening';
  duration: number; // minutes
}

export interface SlotConfig {
  isOccupied: boolean;
  label: string;
}

export interface WeeklyScheduleSettings {
  // Key format: "dayOfWeek_slotId" e.g., "1_slot_2" for Monday slot_2
  [key: string]: SlotConfig;
}

export interface CompletedArchiveItem {
  id: string;
  name: string;
  completedAt: string; // YYYY-MM-DD
  duration: number;
}
