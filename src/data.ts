/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Slot, WeeklyScheduleSettings } from './types';

export const TIMELINE_SLOTS: Slot[] = [
  { id: 'slot_1', name: '早修', time: '08:00–08:35', type: 'morning', duration: 35 },
  { id: 'slot_2', name: '第一節', time: '08:40–09:20', type: 'morning', duration: 40 },
  { id: 'slot_3', name: '第二節', time: '09:30–10:10', type: 'morning', duration: 40 },
  { id: 'slot_4', name: '第三節', time: '10:30–11:10', type: 'morning', duration: 40 },
  { id: 'slot_5', name: '第四節', time: '11:20–12:00', type: 'morning', duration: 40 },
  { id: 'slot_6', name: '午休', time: '12:00–13:30', type: 'afternoon', duration: 90 },
  { id: 'slot_7', name: '第五節', time: '13:30–14:10', type: 'afternoon', duration: 40 },
  { id: 'slot_8', name: '第六節', time: '14:20–15:00', type: 'afternoon', duration: 40 },
  { id: 'slot_9', name: '第七節', time: '15:10–15:50', type: 'afternoon', duration: 40 },
  { id: 'slot_10', name: '第八節(課後)', time: '16:00–16:50', type: 'afternoon', duration: 50 },
  { id: 'slot_11', name: '第九節(課後)', time: '17:00–17:50', type: 'afternoon', duration: 50 },
  { id: 'slot_12', name: '晚餐/放學', time: '18:00–19:30', type: 'evening', duration: 90 },
  { id: 'slot_13', name: '晚自習/備課', time: '19:30–21:00', type: 'evening', duration: 90 },
];

export const WEEKDAYS = [
  { day: 1, label: '週一', fullLabel: '星期一' },
  { day: 2, label: '週二', fullLabel: '星期二' },
  { day: 3, label: '週三', fullLabel: '星期三' },
  { day: 4, label: '週四', fullLabel: '星期四' },
  { day: 5, label: '週五', fullLabel: '星期五' },
  { day: 6, label: '週六', fullLabel: '星期六' },
  { day: 7, label: '週日', fullLabel: '星期日' },
];

// Initialize default scheduled classes/locked times for teachers
export const DEFAULT_WEEK_SETTINGS: WeeklyScheduleSettings = (() => {
  const settings: WeeklyScheduleSettings = {};

  // Default Mon-Sun settings as empty
  for (let day = 1; day <= 7; day++) {
    for (const slot of TIMELINE_SLOTS) {
      settings[`${day}_${slot.id}`] = {
        isOccupied: false,
        label: '',
      };
    }
  }

  // --- Mon: 13:30–16:00上課（fifth, sixth, seventh periods）；16:00–17:50課後班 (eighth, ninth periods) ---
  settings['1_slot_7'] = { isOccupied: true, label: '下午上課 (13:30–16:00)' };
  settings['1_slot_8'] = { isOccupied: true, label: '下午上課 (13:30–16:00)' };
  settings['1_slot_9'] = { isOccupied: true, label: '下午上課 (13:30–16:00)' };
  settings['1_slot_10'] = { isOccupied: true, label: '課後辅導班 (16:00–17:50)' };
  settings['1_slot_11'] = { isOccupied: true, label: '課後辅導班 (16:00–17:50)' };

  // --- Wed: 13:30–16:00 課後照顧班 ---
  settings['3_slot_7'] = { isOccupied: true, label: '課後班 (13:30–16:00)' };
  settings['3_slot_8'] = { isOccupied: true, label: '課後班 (13:30–16:00)' };
  settings['3_slot_9'] = { isOccupied: true, label: '課後班 (13:30–16:00)' };

  // --- Thu: 研究所課程整天 (no school-work allowed) ---
  for (const slot of TIMELINE_SLOTS) {
    settings[`4_${slot.id}`] = {
      isOccupied: true,
      label: '研究所整日課 (不可排學校工作)',
    };
  }

  return settings;
})();

// Helper to simulate mock teacher tasks
export const INITIAL_TASKS = [
  {
    id: 'task_def_1',
    name: '批改國文生字簿 (30本)',
    deadline: '12:00',
    duration: 40,
    completed: false,
    priority: 'high',
    dayOfWeek: 1, // Mon
    slotId: 'slot_3', // 第二節空堂
    createdAt: '2026-06-10',
  },
  {
    id: 'task_def_2',
    name: '製作第三單元自然講義',
    deadline: '16:00',
    duration: 40,
    completed: false,
    priority: 'medium',
    dayOfWeek: 1,
    slotId: 'slot_5', // 第四節空堂
    createdAt: '2026-06-10',
  },
  {
    id: 'task_def_3',
    name: '打電話與小明家長聯絡 (段考事宜)',
    deadline: '20:30',
    duration: 20,
    completed: false,
    priority: 'high',
    dayOfWeek: 1,
    slotId: 'slot_12', // 晚餐/放學時間
    createdAt: '2026-06-10',
  },
  {
    id: 'task_def_4',
    name: '填寫特教生個別化教育計畫 (IEP)',
    deadline: '明天五點前',
    duration: 40,
    completed: false,
    priority: 'medium',
    dayOfWeek: 1,
    slotId: null, // Unassigned
    createdAt: '2026-06-10',
  },
  {
    id: 'task_def_5',
    name: '整理教室圖書角圖書',
    deadline: '放學前',
    duration: 20,
    completed: true, // Completed
    priority: 'low',
    dayOfWeek: 1,
    slotId: 'slot_6', // 午休
    createdAt: '2026-06-10',
  },
] as any[];
