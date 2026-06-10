/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, CheckSquare, CalendarDays, SortAsc, AlertCircle, RefreshCw, Sparkles, BookOpen } from 'lucide-react';
import { Slot, Task, WeeklyScheduleSettings } from '../types';
import { TIMELINE_SLOTS } from '../data';
import TaskCard from './TaskCard';

interface TimelineViewProps {
  currentDayIndex: number; // 1-7
  tasks: Task[];
  scheduleSettings: WeeklyScheduleSettings;
  onAssignTask: (taskId: string, dayOfWeek: number, slotId: string | null, targetIndex?: number) => void;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onSortByStatus: (slotId: string) => void;
  onAutoScheduleToday: () => void;
}

export default function TimelineView({
  currentDayIndex,
  tasks,
  scheduleSettings,
  onAssignTask,
  onToggleComplete,
  onDelete,
  onSortByStatus,
  onAutoScheduleToday,
}: TimelineViewProps) {
  // Keep track of which slot ID is being hovered by a dragged item
  const [dragOverSlotId, setDragOverSlotId] = useState<string | null>(null);

  // Group tasks by slotId for today
  const getTasksForSlot = (slotId: string) => {
    return tasks.filter((t) => t.dayOfWeek === currentDayIndex && t.slotId === slotId);
  };

  const handleDragOver = (e: React.DragEvent, slotId: string, isOccupied: boolean) => {
    e.preventDefault();
    if (isOccupied) {
      e.dataTransfer.dropEffect = 'none';
    } else {
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDragEnter = (e: React.DragEvent, slotId: string, isOccupied: boolean) => {
    e.preventDefault();
    if (!isOccupied) {
      setDragOverSlotId(slotId);
    }
  };

  const handleDragLeave = (slotId: string) => {
    if (dragOverSlotId === slotId) {
      setDragOverSlotId(null);
    }
  };

  const handleDropOnSlot = (e: React.DragEvent, slotId: string, isOccupied: boolean) => {
    e.preventDefault();
    setDragOverSlotId(null);

    if (isOccupied) return;

    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (dataStr) {
        const { taskId } = JSON.parse(dataStr);
        if (taskId) {
          onAssignTask(taskId, currentDayIndex, slotId);
        }
      }
    } catch (err) {
      console.error('Error dropping task on slot', err);
    }
  };

  // Check capacity warnings
  const getSlotCapacityInfo = (slot: Slot, slotTasks: Task[]) => {
    const totalDuration = slotTasks.reduce((acc, t) => acc + (t.completed ? 0 : t.duration), 0);
    const completedDuration = slotTasks.reduce((acc, t) => acc + (t.completed ? t.duration : 0), 0);
    const overallDuration = totalDuration + completedDuration;
    const limit = slot.duration;

    const isOverloaded = overallDuration > limit;

    return {
      total: overallDuration,
      isOverloaded,
      limit,
    };
  };

  // Group slots by category for pretty sectioning
  const morningSlots = TIMELINE_SLOTS.filter((s) => s.type === 'morning');
  const afternoonSlots = TIMELINE_SLOTS.filter((s) => s.type === 'afternoon');
  const eveningSlots = TIMELINE_SLOTS.filter((s) => s.type === 'evening');

  const renderSlotRow = (slot: Slot) => {
    const settingKey = `${currentDayIndex}_${slot.id}`;
    const slotSetting = scheduleSettings[settingKey] || { isOccupied: false, label: '' };
    const slotTasks = getTasksForSlot(slot.id);
    const cap = getSlotCapacityInfo(slot, slotTasks);

    const isHovered = dragOverSlotId === slot.id;

    return (
      <div
        key={slot.id}
        id={`slot_container_${slot.id}`}
        onDragOver={(e) => handleDragOver(e, slot.id, slotSetting.isOccupied)}
        onDragEnter={(e) => handleDragEnter(e, slot.id, slotSetting.isOccupied)}
        onDragLeave={() => handleDragLeave(slot.id)}
        onDrop={(e) => handleDropOnSlot(e, slot.id, slotSetting.isOccupied)}
        className={`group relative grid grid-cols-12 border-b border-dashed border-slate-150 py-3.5 px-4 transition-all duration-200 ${
          slotSetting.isOccupied
            ? 'bg-slate-100/50 cursor-not-allowed select-none'
            : isHovered
            ? 'bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-400 ring-inset scale-[1.002]'
            : 'bg-white hover:bg-slate-50/30'
        }`}
      >
        {/* Time and Slot Title Column */}
        <div className="col-span-12 md:col-span-3 flex flex-row md:flex-col items-center md:items-start justify-between md:justify-center pr-3 border-r-0 md:border-r border-slate-200/60 pb-3 md:pb-0 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.75 rounded-md">
              {slot.time}
            </span>
            <span className="text-xs text-slate-400 font-sans">({slot.duration}m)</span>
          </div>
          <span className="text-sm font-bold text-slate-800 tracking-tight font-sans mt-0.5">{slot.name}</span>
        </div>

        {/* Tasks or Class Content Column (Middle & Right combined) */}
        <div className="col-span-12 md:col-span-9 pl-0 md:pl-5 flex flex-col justify-center min-h-[50px]">
          {slotSetting.isOccupied ? (
            /* locked block representing Class schedules */
            <div
              id={`slot_class_badge_${slot.id}`}
              className="flex items-center justify-between bg-slate-200/40 p-4 border border-slate-300/60 rounded-xl bg-diagonal-stripes text-slate-600 gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <BookOpen className="w-5 h-5 text-slate-500 shrink-0" />
                <div className="text-left min-w-0">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest font-mono">固定課表佔用 / 教學時段</span>
                  <p className="text-sm font-bold text-slate-700 truncate mt-0.5">
                    {slotSetting.label || '教師有課 / 固定時程'}
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-1 bg-slate-300/60 border border-slate-400/30 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                <span>不排學校工作</span>
              </div>
            </div>
          ) : (
            /* Free Drop zone & Slot tasks list */
            <div className="flex flex-col gap-2">
              {slotTasks.length === 0 ? (
                <div className="py-3 text-center text-slate-400 border border-dashed border-slate-200 rounded-lg bg-slate-50/20 text-xs italic">
                  {isHovered ? '放開滑鼠即可排定至此時段' : '空堂時間 — 可拖拉任務至此處分派'}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    {/* Sum stats & overload caution warnings */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 font-sans">
                        已排計畫預估：
                        <strong className="text-slate-800 font-mono">{cap.total}</strong> / {cap.limit} 分鐘
                      </span>
                      {cap.isOverloaded && (
                        <span className="flex items-center gap-0.5 text-rose-600 font-semibold text-[10px] bg-rose-50 border border-rose-100 rounded px-1.5 py-0.25 font-mono">
                          <AlertCircle className="w-3.5 h-3.5" />
                          負荷過重!
                        </span>
                      )}
                    </div>

                    {/* Drag ordering helper actions */}
                    {slotTasks.length > 1 && (
                      <button
                        id={`sort_slot_btn_${slot.id}`}
                        type="button"
                        onClick={() => onSortByStatus(slot.id)}
                        className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200/80 px-2 py-0.75 rounded bg-white transition-colors cursor-pointer"
                        title="將未完成任務排在最上方，已完成任務排在最下方"
                      >
                        <SortAsc className="w-3 h-3 text-slate-500" />
                        依完成狀態重排
                      </button>
                    )}
                  </div>

                  {/* Render multi-tasks in Slot */}
                  <div className="grid grid-cols-1 gap-2">
                    {slotTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggleComplete={onToggleComplete}
                        onDelete={onDelete}
                        isCompact
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div id="daily_timeline_view" className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-slate-600" />
            單日垂直時間規劃圖表 (08:00 ～ 21:00)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            自由將左側的待辦卡片<strong>拖曳放置</strong>到右側課表的各個空堂中；可在時間格內<strong>點擊重排</strong>整理。
          </p>
        </div>

        {/* Trigger inline auto scheduler */}
        <button
          id="btn_auto_timeline_schedule"
          type="button"
          onClick={onAutoScheduleToday}
          className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 px-3.5 py-2 rounded-lg cursor-pointer transition-colors shrink-0"
          title="自動推薦安排當日未排程的堆積任務"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          智能空堂排程
        </button>
      </div>

      {/* Slots divided nicely */}
      <div id="timeline_timetable_matrix" className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        {/* Morning header */}
        <div className="bg-amber-50/40 border-b border-slate-200 py-2 px-4 flex items-center justify-between text-xs font-bold text-slate-600">
          <span className="flex items-center gap-1.5 uppercase font-sans tracking-wider">☀️ 上午時段 (Morning Lesson Blocks)</span>
          <span className="font-mono text-slate-400 font-semibold">08:00–12:00</span>
        </div>
        <div className="divide-y divide-slate-100 bg-white">
          {morningSlots.map(renderSlotRow)}
        </div>

        {/* Afternoon header */}
        <div className="bg-blue-50/30 border-t border-b border-slate-200 py-2 px-4 flex items-center justify-between text-xs font-bold text-slate-600 mt-4">
          <span className="flex items-center gap-1.5 uppercase font-sans tracking-wider">⛅ 下午時段 (Afternoon School Schedule)</span>
          <span className="font-mono text-slate-400 font-semibold">12:00–18:00</span>
        </div>
        <div className="divide-y divide-slate-100 bg-white">
          {afternoonSlots.map(renderSlotRow)}
        </div>

        {/* Evening header */}
        <div className="bg-slate-150/45 border-t border-b border-slate-200 py-2 px-4 flex items-center justify-between text-xs font-bold text-slate-600 mt-4">
          <span className="flex items-center gap-1.5 uppercase font-sans tracking-wider">🌙 晚間與備課 (Evening Personal & Prep)</span>
          <span className="font-mono text-slate-400 font-semibold">18:00–21:00</span>
        </div>
        <div className="divide-y divide-slate-100 bg-white">
          {eveningSlots.map(renderSlotRow)}
        </div>
      </div>
    </div>
  );
}
