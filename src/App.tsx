/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  INITIAL_TASKS,
  DEFAULT_WEEK_SETTINGS,
  TIMELINE_SLOTS,
  WEEKDAYS,
} from './data';
import { Task, WeeklyScheduleSettings, CompletedArchiveItem, Priority } from './types';
import CalendarHeader from './components/CalendarHeader';
import TaskInputForm from './components/TaskInputForm';
import UnscheduledTasks from './components/UnscheduledTasks';
import TimelineView from './components/TimelineView';
import WeeklyView from './components/WeeklyView';
import WeeklyScheduleConfig from './components/WeeklyScheduleConfig';
import { CheckCircle2, Award, Calendar, AlertCircle, Info, Flame, Sparkles, BookOpen, Clock } from 'lucide-react';

const TASKS_STORAGE_KEY = 'teacher_scheduler_tasks_v1.5';
const SETTINGS_STORAGE_KEY = 'teacher_scheduler_settings_v1.5';
const ARCHIVE_STORAGE_KEY = 'teacher_scheduler_archive_v1.5';
const DATE_STORAGE_KEY = 'teacher_scheduler_date_v1.5';

export default function App() {
  // --- STATE MANAGERS ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [scheduleSettings, setScheduleSettings] = useState<WeeklyScheduleSettings>({});
  const [archivedCompleted, setArchivedCompleted] = useState<CompletedArchiveItem[]>([]);
  const [currentDateStr, setCurrentDateStr] = useState('2026-06-10'); // Simulated start date: June 10, 2026 (Wednesday)
  const [currentDayIndex, setCurrentDayIndex] = useState(3); // 3 = Wednesday
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'settings'>('daily');
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'info' | 'warning'; text: string } | null>(null);

  // --- INITIAL LOAD FROM LOCAL STORAGE ---
  useEffect(() => {
    // 1. Load active simulated date
    const savedDate = localStorage.getItem(DATE_STORAGE_KEY);
    if (savedDate) {
      setCurrentDateStr(savedDate);
      const dayIdx = calculateDayOfWeek(savedDate);
      setCurrentDayIndex(dayIdx);
    } else {
      localStorage.setItem(DATE_STORAGE_KEY, '2026-06-10');
    }

    // 2. Load Tasks Database
    const savedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (err) {
        setTasks(INITIAL_TASKS);
      }
    } else {
      setTasks(INITIAL_TASKS);
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(INITIAL_TASKS));
    }

    // 3. Load Timetable lock settings
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (savedSettings) {
      try {
        setScheduleSettings(JSON.parse(savedSettings));
      } catch (err) {
        setScheduleSettings(DEFAULT_WEEK_SETTINGS);
      }
    } else {
      setScheduleSettings(DEFAULT_WEEK_SETTINGS);
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_WEEK_SETTINGS));
    }

    // 4. Load Archived / completed tasks history logs
    const savedArchive = localStorage.getItem(ARCHIVE_STORAGE_KEY);
    if (savedArchive) {
      try {
        setArchivedCompleted(JSON.parse(savedArchive));
      } catch (err) {
        setArchivedCompleted([]);
      }
    }
  }, []);

  // --- PERSISTENCE WRITERS ---
  const saveTasksToLocalStorage = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(newTasks));
  };

  const saveSettingsToLocalStorage = (newSettings: WeeklyScheduleSettings) => {
    setScheduleSettings(newSettings);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
  };

  const saveArchiveToLocalStorage = (newArchive: CompletedArchiveItem[]) => {
    setArchivedCompleted(newArchive);
    localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(newArchive));
  };

  // --- UTILITY: HELPER TO EXTRACT WEEKDAY INDEX FROM DATE STRING ---
  const calculateDayOfWeek = (dateString: string): number => {
    // dateString pattern: YYYY-MM-DD
    const dateObj = new Date(dateString);
    const day = dateObj.getDay(); // 0 is Sunday, 1 is Monday ...
    return day === 0 ? 7 : day;
  };

  const triggerAlert = (text: string, type: 'success' | 'info' | 'warning' = 'info') => {
    setAlertMsg({ text, type });
    setTimeout(() => {
      setAlertMsg(null);
    }, 4500);
  };

  // --- ADDING A NEW TASK ---
  const handleAddTask = (taskData: {
    name: string;
    deadline: string;
    duration: 20 | 40;
    priority: Priority;
    autoSchedule: boolean;
  }) => {
    const newTask: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: taskData.name,
      deadline: taskData.deadline,
      duration: taskData.duration,
      completed: false,
      priority: taskData.priority,
      dayOfWeek: currentDayIndex,
      slotId: null, // Default to unscheduled
      createdAt: currentDateStr,
    };

    let updatedTasksList = [...tasks, newTask];

    if (taskData.autoSchedule) {
      // Find suitable slot on current day
      const targetSlotId = findFirstSuitableSlotForTask(newTask, updatedTasksList, currentDayIndex);
      if (targetSlotId) {
        // Schedule it immediately!
        updatedTasksList = updatedTasksList.map((t) => {
          if (t.id === newTask.id) {
            return { ...t, slotId: targetSlotId };
          }
          return t;
        });
        triggerAlert(`任務已成功新增，並自動安置在「${getSlotLabel(targetSlotId)}」時間段！`, 'success');
      } else {
        // No room found, leave it in unscheduled backlog
        triggerAlert('今日空堂時間格子預估已滿或衝程，任務已放入左側「未排程備用區」！', 'info');
      }
    } else {
      triggerAlert('任務已成功加入左側「未排程任務堆積區」，您可以按住拖拉到合適時段。', 'success');
    }

    saveTasksToLocalStorage(updatedTasksList);
  };

  // Helper helper to locate a fitting slot
  const findFirstSuitableSlotForTask = (task: Task, allTasksOnDay: Task[], day: number): string | null => {
    // Get slots sorted by suitability depending on priority
    let preferredSequence: string[] = [];
    if (task.priority === 'high') {
      // 🔴 Morning preference
      preferredSequence = ['slot_1', 'slot_2', 'slot_3', 'slot_4', 'slot_5'];
    } else if (task.priority === 'medium') {
      // 🟠 Afternoon preference
      preferredSequence = ['slot_6', 'slot_7', 'slot_8', 'slot_9', 'slot_10', 'slot_11'];
    } else {
      // 🟢 Evening preference
      preferredSequence = ['slot_12', 'slot_13'];
    }

    // Fail-safe fallbacks: all remaining days slots in chronological order
    const fullCycle = ['slot_1', 'slot_2', 'slot_3', 'slot_4', 'slot_5', 'slot_6', 'slot_7', 'slot_8', 'slot_9', 'slot_10', 'slot_11', 'slot_12', 'slot_13'];
    const candidates = [...preferredSequence, ...fullCycle].filter(
      (value, index, self) => self.indexOf(value) === index
    );

    for (const slotId of candidates) {
      const isOccupied = scheduleSettings[`${day}_${slotId}`]?.isOccupied || false;
      if (isOccupied) continue; // Skip school lessons/grad school periods

      const slot = TIMELINE_SLOTS.find((s) => s.id === slotId);
      if (!slot) continue;

      // Check current total minutes used by uncompleted tasks currently scheduled in this slot
      const allocated = allTasksOnDay.filter((t) => t.dayOfWeek === day && t.slotId === slotId);
      const usedMinutes = allocated.reduce((acc, t) => acc + (t.completed ? 0 : t.duration), 0);

      if (usedMinutes + task.duration <= slot.duration) {
        return slotId;
      }
    }

    return null;
  };

  const getSlotLabel = (slotId: string): string => {
    return TIMELINE_SLOTS.find((s) => s.id === slotId)?.name || slotId;
  };

  // --- TOGGLING COMPLETED STATUS ---
  const handleToggleComplete = (id: string) => {
    const updated = tasks.map((t) => {
      if (t.id === id) {
        const nextCompleted = !t.completed;
        return { ...t, completed: nextCompleted };
      }
      return t;
    });
    saveTasksToLocalStorage(updated);
  };

  // --- DELETE A TASK ---
  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    saveTasksToLocalStorage(updated);
    triggerAlert('任務已順利刪除！', 'info');
  };

  // --- DRAG AND DROP: ASSIGN TASK TO A SLOT ---
  const handleAssignTask = (taskId: string, dayOfWeek: number, slotId: string | null) => {
    // Guard: Verify slot is not occupied in Settings
    if (slotId) {
      const isOccupied = scheduleSettings[`${dayOfWeek}_${slotId}`]?.isOccupied || false;
      if (isOccupied) {
        triggerAlert('此時段已被標記為有課狀態，無法排入任務事項！', 'warning');
        return;
      }
    }

    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          dayOfWeek, // assign target day of week
          slotId, // assign target slot (null means backlog / unscheduled)
        };
      }
      return t;
    });

    saveTasksToLocalStorage(updated);
    if (slotId) {
      const slotName = TIMELINE_SLOTS.find((s) => s.id === slotId)?.name || '';
      triggerAlert(`已成功將任務排列至 ${WEEKDAYS.find((w) => w.day === dayOfWeek)?.label} 的「${slotName}」時段！`, 'success');
    } else {
      triggerAlert('已將任務退回至待辦堆積區！', 'info');
    }
  };

  // --- MOVE TASK TO BACKLOG (E.G. DROP OVER BACKLOG CONTAINER) ---
  const handleDropTaskToUnscheduled = (taskId: string) => {
    handleAssignTask(taskId, currentDayIndex, null);
  };

  // --- CONFIGURE SCHOOL HOUR LOCKS TOGGLES ---
  const handleUpdateWeeklySetting = (day: number, slotId: string, isOccupied: boolean, label: string) => {
    const newSettings = {
      ...scheduleSettings,
      [`${day}_${slotId}`]: { isOccupied, label },
    };

    // CRITICAL VALUE-ADD:
    // "如果把有課跟空堂互相轉換，原本的排課衝突會自動妥善安排"
    // If we changed a slot to "Occupied" (有課), find all scheduled tasks in this specific weekday and slot,
    // and automatically EVICT them back to the Unscheduled Backlog (slotId = null) so they are kept safely!
    let evictCount = 0;
    const nextTasks = tasks.map((t) => {
      if (t.dayOfWeek === day && t.slotId === slotId && isOccupied) {
        evictCount++;
        return { ...t, slotId: null };
      }
      return t;
    });

    saveSettingsToLocalStorage(newSettings);
    if (evictCount > 0) {
      saveTasksToLocalStorage(nextTasks);
      triggerAlert(`已將該時段設為有課。原本排在該時段的 ${evictCount} 項任務已自動退回左側未排程區，防範時間衝突！`, 'warning');
    } else {
      triggerAlert('已儲存您的課表時程設定！每週設定將立即更新。', 'success');
    }
  };

  // --- RESTORE DEFAULT SCHOOL TIMETABLE ---
  const handleResetToDefaultTimetable = () => {
    // Find all evicted items if the new defaults conflict with current tasks
    let evictCount = 0;
    const nextSettings = { ...DEFAULT_WEEK_SETTINGS };

    const nextTasks = tasks.map((t) => {
      if (t.slotId) {
        const key = `${t.dayOfWeek}_${t.slotId}`;
        const defaultIsOccupied = nextSettings[key]?.isOccupied || false;
        if (defaultIsOccupied) {
          evictCount++;
          return { ...t, slotId: null };
        }
      }
      return t;
    });

    saveSettingsToLocalStorage(nextSettings);
    saveTasksToLocalStorage(nextTasks);

    if (evictCount > 0) {
      triggerAlert(`已回復預設教師課表。原先衝突的 ${evictCount} 個時段任務已安全撤回未排程區。`, 'warning');
    } else {
      triggerAlert('已成功將每週有課/空堂設定恢復至教師基本預設值！', 'success');
    }
  };

  // --- AUTOMATIC MIDNIGHT ROLLOVER: AUTOMATIC CLEANSING AND ARCHIVING ---
  // "每日的12:00AM網頁會自動將已完成任務放入完成區，未完成任務放入隔日未排程任務區"
  const handleSimulateMidnight = () => {
    // 1. Calculate tomorrow's date string
    const currentDate = new Date(currentDateStr);
    currentDate.setDate(currentDate.getDate() + 1);
    const tomorrowStr = currentDate.toISOString().split('T')[0];
    const tomorrowDayIndex = calculateDayOfWeek(tomorrowStr);

    // 2. Identify all active tasks that belong to the current planning date
    // (Tasks created today, or assigned to today)
    // We separate Tasks based on completed index!
    const activeTasksToKeep: Task[] = [];
    const archivedItems: CompletedArchiveItem[] = [...archivedCompleted];
    let recycledCount = 0;
    let archivedCount = 0;

    tasks.forEach((task) => {
      // If task is completed -> Archive it!
      if (task.completed) {
        archivedCount++;
        archivedItems.push({
          id: task.id,
          name: task.name,
          completedAt: currentDateStr,
          duration: task.duration,
        });
      } else {
        // If task is NOT completed -> recycle/carryover to tomorrow's unscheduled list !
        recycledCount++;
        activeTasksToKeep.push({
          ...task,
          dayOfWeek: tomorrowDayIndex, // auto update day to tomorrow
          slotId: null, // automatic eviction to backlog (隔日未排程任務區) as requested
          createdAt: tomorrowStr,
        });
      }
    });

    // Write to State & LocalStorage
    setCurrentDateStr(tomorrowStr);
    setCurrentDayIndex(tomorrowDayIndex);
    localStorage.setItem(DATE_STORAGE_KEY, tomorrowStr);

    saveTasksToLocalStorage(activeTasksToKeep);
    saveArchiveToLocalStorage(archivedItems);

    triggerAlert(
      `🔔 跨夜轉移成功！目前日期為 ${tomorrowStr} (${WEEKDAYS.find((d) => d.day === tomorrowDayIndex)?.fullLabel})。已整理 ${archivedCount} 項已完成任務歸檔，且自動將 ${recycledCount} 項未完成任務移轉至今日未排程任務區！`,
      'success'
    );
  };

  // --- SMART AUTO-SCHEDULER FOR CURRENT ACTIVE DAY ---
  const handleAutoScheduleToday = () => {
    // Identify vacant "空堂" slots of the current active day
    const vacantSlots = TIMELINE_SLOTS.filter((slot) => {
      const setting = scheduleSettings[`${currentDayIndex}_${slot.id}`];
      return !setting?.isOccupied;
    });

    // Retrieve all active backlog tasks (slotId === null)
    const unscheduledTasks = tasks.filter((t) => t.slotId === null);
    if (unscheduledTasks.length === 0) {
      triggerAlert('目前沒有待發派的未排程任務！請先在上方新增任務。', 'info');
      return;
    }

    // SORT backlog tasks for allocation:
    // 1. High Priority (高/🔴) first
    // 2. Then Medium (中/🟠)
    // 3. Then Low (低/🟢)
    // Also prioritize items with specific deadlines (representing "必須排在之前")
    const sortedUnscheduled = [...unscheduledTasks].sort((a, b) => {
      const weight = { high: 3, medium: 2, low: 1 };
      const diff = weight[b.priority] - weight[a.priority];
      if (diff !== 0) return diff;

      const hasDeadlineA = a.deadline && a.deadline !== '本日' ? 1 : 0;
      const hasDeadlineB = b.deadline && b.deadline !== '本日' ? 1 : 0;
      return hasDeadlineB - hasDeadlineA; // Put items with target deadlines ahead!
    });

    let nextTasks = [...tasks];
    let countScheduled = 0;

    sortedUnscheduled.forEach((task) => {
      const slotId = findFirstSuitableSlotForTask(task, nextTasks, currentDayIndex);
      if (slotId) {
        countScheduled++;
        nextTasks = nextTasks.map((t) => {
          if (t.id === task.id) {
            return {
              ...t,
              dayOfWeek: currentDayIndex,
              slotId: slotId,
            };
          }
          return t;
        });
      }
    });

    if (countScheduled > 0) {
      saveTasksToLocalStorage(nextTasks);
      triggerAlert(`智能排程引擎已成功為您自動安插編排 ${countScheduled} 項隨機待辦事項！`, 'success');
    } else {
      triggerAlert('空堂時間緊湊或負荷多，無法自動安置剩餘任務！請手動調整或在設定中解鎖部分有課時段。', 'warning');
    }
  };

  // --- SORT TASKS IN A TIMELINES SLOT BY COMPLETION STATUS ---
  // "按照執行狀態（已完成 / 未完成）自動將任務進行整理"
  const handleSortSlotTasksByStatus = (slotId: string) => {
    // Move uncompleted tasks of this slot to top, completed tasks to bottom
    const slotTasks = tasks.filter((t) => t.dayOfWeek === currentDayIndex && t.slotId === slotId);
    if (slotTasks.length <= 1) return;

    const uncompleted = slotTasks.filter((t) => !t.completed);
    const completed = slotTasks.filter((t) => t.completed);
    const combined = [...uncompleted, ...completed];

    // Reconstruct general tasks list
    const otherTasks = tasks.filter((t) => !(t.dayOfWeek === currentDayIndex && t.slotId === slotId));

    // To preserve overall ordering, we append the newly sorted items for that slot
    saveTasksToLocalStorage([...otherTasks, ...combined]);
    triggerAlert('已自動將未完成的任務置頂、已做完的任務置底！', 'success');
  };

  // --- QUICK CLEANING BACKLOG COMPLETED ITEMS ---
  const handleClearCompletedBacklog = () => {
    const uncompleted = tasks.filter((t) => t.slotId !== null || !t.completed);
    const completedBacklog = tasks.filter((t) => t.slotId === null && t.completed);

    if (completedBacklog.length > 0) {
      // Archive them first so they are saved
      const savedArchive = [...archivedCompleted];
      completedBacklog.forEach((t) => {
        savedArchive.push({
          id: t.id,
          name: t.name,
          completedAt: currentDateStr,
          duration: t.duration,
        });
      });
      saveArchiveToLocalStorage(savedArchive);
    }

    saveTasksToLocalStorage(uncompleted);
    triggerAlert('已清空未排程區中所有已標記完成的項目，並存檔至歷史封存區！', 'info');
  };

  const handleQuickSwitchDay = (day: number) => {
    setCurrentDayIndex(day);
    setViewMode('daily');
    triggerAlert(`已快速切換至 ${WEEKDAYS.find((wd) => wd.day === day)?.fullLabel} 計劃視野！`, 'success');
  };

  // --- STATS COMPUTATIONS ---
  const activeUnscheduled = tasks.filter((t) => t.slotId === null);
  const activeScheduled = tasks.filter((t) => t.slotId !== null);
  const totalCompletedCount = archivedCompleted.length;
  // Calc completed hours saved
  const totalMinutesSaved = archivedCompleted.reduce((sum, item) => sum + item.duration, 0);
  const hoursSavedStr = (totalMinutesSaved / 60).toFixed(1);

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 selection:bg-slate-800 selection:text-white antialiased pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto pt-6">
        
        {/* Banner Alarm messaging banner */}
        {alertMsg && (
          <div
            id="app_floating_alert"
            className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-full text-xs font-bold shadow-xl border transition-all animate-bounce ${
              alertMsg.type === 'success'
                ? 'bg-emerald-900 border-emerald-700 text-emerald-100'
                : alertMsg.type === 'warning'
                ? 'bg-rose-900 border-rose-700 text-rose-100'
                : 'bg-indigo-900 border-indigo-700 text-indigo-100'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{alertMsg.text}</span>
          </div>
        )}

        {/* Dynamic header display */}
        <CalendarHeader
          currentDayIndex={currentDayIndex}
          onSelectDay={setCurrentDayIndex}
          currentDateStr={currentDateStr}
          viewMode={viewMode}
          onSetViewMode={setViewMode}
          onSimulateMidnight={handleSimulateMidnight}
          unscheduledCount={activeUnscheduled.length}
          scheduledCount={activeScheduled.length}
        />

        {/* Master layouts */}
        {viewMode === 'settings' && (
          <div className="animate-fade-in">
            <WeeklyScheduleConfig
              settings={scheduleSettings}
              onUpdateSetting={handleUpdateWeeklySetting}
              onResetToDefaults={handleResetToDefaultTimetable}
            />
          </div>
        )}

        {viewMode === 'weekly' && (
          <div className="animate-fade-in">
            <WeeklyView
              tasks={tasks}
              scheduleSettings={scheduleSettings}
              onAssignTask={handleAssignTask}
              onToggleComplete={handleToggleComplete}
              onDelete={handleDeleteTask}
              onQuickSwitchDay={handleQuickSwitchDay}
            />
          </div>
        )}

        {viewMode === 'daily' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
            {/* Left side column: task creator & backlog pool */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* Task Add Area */}
              <div className="shadow-xs rounded-xl overflow-hidden bg-white border border-slate-200">
                <div className="bg-slate-50 border-b border-slate-250/20 px-5 py-3.5 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
                    <BookOpen className="w-4 h-4 text-slate-600" />
                    ① 任務輸入區
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">1. Task Input Form</span>
                </div>
                <div className="p-4">
                  <TaskInputForm
                    onAddTask={handleAddTask}
                    isAllOccupiedToday={TIMELINE_SLOTS.every((s) => scheduleSettings[`${currentDayIndex}_${s.id}`]?.isOccupied)}
                  />
                </div>
              </div>

              {/* Unassigned Work Backlog Area */}
              <div className="shadow-xs bg-white border border-slate-200 rounded-xl p-4 flex-1">
                <div className="mb-4">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide border-b border-slate-100 pb-2">
                    <Flame className="w-4 h-4 text-violet-600 shrink-0" />
                    ② 未排程任務儲存區
                  </span>
                </div>
                <UnscheduledTasks
                  tasks={activeUnscheduled}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDeleteTask}
                  onDropTaskToUnscheduled={handleDropTaskToUnscheduled}
                  onAutoSchedule={handleAutoScheduleToday}
                  onClearCompleted={handleClearCompletedBacklog}
                />
              </div>

              {/* Archived History statistics widgets */}
              {archivedCompleted.length > 0 && (
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-800 text-slate-300 rounded-xl p-4 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg text-emerald-400">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">今日已解鎖成就</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">累計已歸檔完成之任務數量</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold font-mono text-emerald-400">{totalCompletedCount}</span>
                    <span className="text-slate-400 text-[10px] block font-medium">({hoursSavedStr} 小時)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right main column: timeline grid */}
            <div className="lg:col-span-8">
              
              {/* Daily Timeline */}
              <div className="shadow-xs rounded-xl overflow-hidden bg-white border border-slate-200">
                <div className="bg-slate-50 border-b border-slate-250/20 px-5 py-3.5 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
                    <Clock className="w-4 h-4 text-slate-600" />
                    ③ 每日時間表 / 固定時間軸
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">2. Timeline grid</span>
                </div>
                <div className="p-4 bg-slate-50/15">
                  <TimelineView
                    currentDayIndex={currentDayIndex}
                    tasks={tasks}
                    scheduleSettings={scheduleSettings}
                    onAssignTask={handleAssignTask}
                    onToggleComplete={handleToggleComplete}
                    onDelete={handleDeleteTask}
                    onSortByStatus={handleSortSlotTasksByStatus}
                    onAutoScheduleToday={handleAutoScheduleToday}
                  />
                </div>
              </div>

              {/* Bottom Instructions / Help widget */}
              <div className="mt-5 bg-blue-50/40 border border-blue-105 rounded-xl p-4 text-slate-600 text-xs leading-relaxed flex items-start gap-2.5">
                <Info className="w-4.5 h-4.5 text-slate-600 shrink-0 mt-0.5" />
                <div className="text-left">
                  <span className="font-bold block text-slate-800 mb-0.5">💡 教師工作規劃術操作提示：</span>
                  1. <strong className="font-semibold text-slate-700">自由安排您的行程：</strong> 在左側未排程區，按住任何任務卡片，向右拖曳並放在各節「空堂」即可。也能直接點擊任務前面的核取方塊標示完成。<br />
                  2. <strong className="font-semibold text-slate-700">自動跨夜機制：</strong> 點選上方的「模擬跨夜 AM 12:00」按鈕，已完成的任務將歸檔封存至歷史累計數中，而未完成的工作會回扣成「隔日未辦」出現在未排程區，方便您重排！<br />
                  3. <strong className="font-semibold text-slate-700">自訂每週課表：</strong> 如果您的真實課表不同，請點選上方「編輯週固定課表」任意切換。設為有課能自動防範將事項誤拖入的情事。
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
