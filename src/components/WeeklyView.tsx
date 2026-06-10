/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CalendarRange, ShieldAlert, Sparkles, AlertCircle, ArrowRightLeft, FileCheck, Check } from 'lucide-react';
import { Slot, Task, WeeklyScheduleSettings } from '../types';
import { TIMELINE_SLOTS, WEEKDAYS } from '../data';

interface WeeklyViewProps {
  tasks: Task[];
  scheduleSettings: WeeklyScheduleSettings;
  onAssignTask: (taskId: string, dayOfWeek: number, slotId: string | null) => void;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onQuickSwitchDay: (day: number) => void;
}

export default function WeeklyView({
  tasks,
  scheduleSettings,
  onAssignTask,
  onToggleComplete,
  onDelete,
  onQuickSwitchDay,
}: WeeklyViewProps) {
  // Store which specific cell is being hovered during dragging
  // Key format: "day_slot" e.g., "3_slot_5"
  const [dragOverCellKey, setDragOverCellKey] = useState<string | null>(null);

  // Filter tasks belonging to a specific day and slot
  const getTasksForCell = (day: number, slotId: string) => {
    return tasks.filter((t) => t.dayOfWeek === day && t.slotId === slotId);
  };

  const handleDragOver = (e: React.DragEvent, day: number, slotId: string, isOccupied: boolean) => {
    e.preventDefault();
    if (!isOccupied) {
      e.dataTransfer.dropEffect = 'move';
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  const handleDragEnter = (e: React.DragEvent, day: number, slotId: string, isOccupied: boolean) => {
    e.preventDefault();
    if (!isOccupied) {
      setDragOverCellKey(`${day}_${slotId}`);
    }
  };

  const handleDragLeave = () => {
    setDragOverCellKey(null);
  };

  const handleDropOnCell = (e: React.DragEvent, day: number, slotId: string, isOccupied: boolean) => {
    e.preventDefault();
    setDragOverCellKey(null);

    if (isOccupied) return;

    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (dataStr) {
        const { taskId } = JSON.parse(dataStr);
        if (taskId) {
          onAssignTask(taskId, day, slotId);
        }
      }
    } catch (err) {
      console.error('Error dropping task in weekly cell', err);
    }
  };

  // Compact priority bubble colors
  const getPriorityDot = (p: Task['priority']) => {
    return {
      high: 'bg-rose-500',
      medium: 'bg-amber-500',
      low: 'bg-emerald-500',
    }[p];
  };

  // Check if a slot carries overloading workloads in any specific day
  const isOverpowered = (day: number, slot: Slot, cellTasks: Task[]) => {
    const sum = cellTasks.reduce((acc, t) => acc + (t.completed ? 0 : t.duration), 0);
    return sum > slot.duration;
  };

  return (
    <div id="weekly_grid_container" className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 mb-6">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <CalendarRange className="w-5 h-5 text-indigo-600" />
            每週課表任務整合一覽總表 (08:00 ～ 21:00)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            横向為一週課表，縱向為 13 節與備課時段。您可以將任何任務<strong>拖拉至不同的格內</strong>跨日調整。
            點選週標題可<strong>快速切換</strong>至該日的詳細日程視窗。
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>高優先</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>中優先</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>低優先</span>
        </div>
      </div>

      {/* Grid structure with horizontal-scroll container for mobile */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
        <div className="min-w-[1200px] bg-slate-50/50">
          
          {/* Calendar Day Header Row */}
          <div className="grid grid-cols-8 divide-x divide-slate-200 border-b border-slate-200 text-slate-700 bg-slate-100 font-bold text-xs select-none sticky top-0 z-20">
            {/* Corner time labels header */}
            <div className="p-3 text-center text-slate-500 flex flex-col justify-center">
              <span>時間 / 時期</span>
            </div>

            {/* Days of week Headers */}
            {WEEKDAYS.map((wd) => {
              // Calculate allocated total tasks
              const numTasks = tasks.filter((t) => t.dayOfWeek === wd.day && t.slotId !== null).length;
              return (
                <div
                  key={wd.day}
                  id={`week_header_col_${wd.day}`}
                  onClick={() => onQuickSwitchDay(wd.day)}
                  className="p-3 hover:bg-slate-200/50 cursor-pointer transition-all flex flex-col items-center justify-center gap-1 group py-3.5"
                  title="點擊切換為此日之每日垂直細節計畫..."
                >
                  <span className="text-slate-800 font-bold group-hover:text-indigo-600 transition-colors">
                    {wd.fullLabel}
                  </span>
                  {numTasks > 0 ? (
                    <span className="bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] px-2 py-0.25 rounded-md font-mono">
                      {numTasks} 項排定
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-normal">無工作</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Table Body (13 slots Rows x 7 Day cells) */}
          <div className="divide-y divide-slate-200 bg-white">
            {TIMELINE_SLOTS.map((slot) => {
              return (
                <div key={slot.id} className="grid grid-cols-8 divide-x divide-slate-150 relative">
                  {/* Left row label (slot metadata) */}
                  <div className="p-2.5 flex flex-col justify-center bg-slate-50/75 select-none shrink-0 min-h-[90px]">
                    <span className="font-mono text-[9px] font-bold text-slate-500 bg-white border border-slate-200 rounded px-1.5 py-0.5 w-max">
                      {slot.time}
                    </span>
                    <span className="text-xs font-bold text-slate-700 mt-1.5 leading-snug">
                      {slot.name}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">({slot.duration}分)</span>
                  </div>

                  {/* Day cells for week */}
                  {WEEKDAYS.map((wd) => {
                    const cellKey = `${wd.day}_${slot.id}`;
                    const setting = scheduleSettings[cellKey] || { isOccupied: false, label: '' };
                    const cellTasks = getTasksForCell(wd.day, slot.id);
                    const isHovered = dragOverCellKey === cellKey;
                    const overload = isOverpowered(wd.day, slot, cellTasks);

                    return (
                      <div
                        key={wd.day}
                        id={`weekly_cell_${wd.day}_${slot.id}`}
                        onDragOver={(e) => handleDragOver(e, wd.day, slot.id, setting.isOccupied)}
                        onDragEnter={(e) => handleDragEnter(e, wd.day, slot.id, setting.isOccupied)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDropOnCell(e, wd.day, slot.id, setting.isOccupied)}
                        className={`p-2 transition-all flex flex-col justify-start relative min-h-[90px] ${
                          setting.isOccupied
                            ? 'bg-slate-100/40 select-none cursor-not-allowed bg-diagonal-stripes-light'
                            : isHovered
                            ? 'bg-indigo-50/50 ring-2 ring-indigo-400 ring-inset scale-[0.99]'
                            : 'hover:bg-slate-50/20'
                        }`}
                      >
                        {setting.isOccupied ? (
                          /* Render Occupied class info */
                          <div className="absolute inset-x-2 inset-y-2 p-1.5 flex flex-col items-start justify-center gap-0.5 bg-slate-200/50 border border-slate-300/40 rounded-lg shadow-3xs overflow-hidden">
                            <span className="text-[8px] font-bold tracking-wider text-slate-400 uppercase leading-none">有課鎖定</span>
                            <span
                              className="text-[11px] font-bold text-slate-600 line-clamp-2 leading-snug break-all text-left"
                              title={setting.label}
                            >
                              {setting.label || '有課 / 固定課表'}
                            </span>
                          </div>
                        ) : (
                          /* Render allocated tasks */
                          <div className="flex-1 flex flex-col gap-1.5 h-full relative z-10">
                            {cellTasks.length === 0 ? (
                              <div className="flex-1 flex items-center justify-center text-slate-300 text-[10px] italic select-none">
                                {isHovered ? '放開即可放入' : '—'}
                              </div>
                            ) : (
                              <div className="space-y-1">
                                {overload && (
                                  <div className="flex items-center gap-0.5 text-rose-600 text-[8px] bg-rose-50 border border-rose-100 px-1 py-0.25 rounded font-semibold w-max mb-1">
                                    <AlertCircle className="w-2.5 h-2.5" />
                                    <span>超額佔用</span>
                                  </div>
                                )}
                                <div className="space-y-1">
                                  {cellTasks.map((task) => {
                                    // Make minimal card representation for weekly grid cells
                                    const dotColor = getPriorityDot(task.priority);
                                    return (
                                      <div
                                        key={task.id}
                                        id={`weekly_pill_${task.id}`}
                                        draggable
                                        onDragStart={(e) => {
                                          e.dataTransfer.effectAllowed = 'move';
                                          e.dataTransfer.setData('application/json', JSON.stringify({ taskId: task.id }));
                                        }}
                                        className={`group relative p-1.5 bg-white border border-slate-200 rounded-lg hover:shadow-2xs active:cursor-grabbing hover:border-slate-300 transition-all text-left flex flex-col justify-between cursor-grab leading-none ${
                                          task.completed ? 'opacity-40 line-through text-slate-400' : ''
                                        }`}
                                      >
                                        <div className="flex items-start gap-1 min-w-0">
                                          {/* Priority Dot */}
                                          <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${dotColor}`}></span>

                                          {/* Task Name */}
                                          <span className="text-[11px] font-medium text-slate-700 truncate flex-1 leading-snug">
                                            {task.name}
                                          </span>
                                        </div>

                                        <div className="flex items-center justify-between mt-1 text-[9px] text-slate-400 font-medium">
                                          {/* Double click/click on completed trigger */}
                                          <button
                                            type="button"
                                            onClick={() => onToggleComplete(task.id)}
                                            className="hover:text-slate-600 flex items-center gap-0.5 bg-slate-100 hover:bg-slate-200 px-1 rounded"
                                            title="標設已完成/未完成"
                                          >
                                            {task.completed ? (
                                              <Check className="w-2 h-2 text-emerald-600" />
                                            ) : (
                                              <span className="w-1.5 h-1.5 rounded bg-transparent border border-slate-450 inline-block"></span>
                                            )}
                                            <span>{task.duration}m</span>
                                          </button>

                                          <span className="truncate max-w-[50px]" title="截止時間">
                                            {task.deadline}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
