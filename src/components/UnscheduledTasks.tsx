/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Layers, ArrowRightLeft, Sparkles, Filter, Trash2, ArrowUpCircle } from 'lucide-react';
import { Task } from '../types';
import TaskCard from './TaskCard';

interface UnscheduledTasksProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onDropTaskToUnscheduled: (id: string) => void;
  onAutoSchedule: () => void;
  onClearCompleted: () => void;
  onDragStart?: (id: string) => void;
}

export default function UnscheduledTasks({
  tasks,
  onToggleComplete,
  onDelete,
  onDropTaskToUnscheduled,
  onAutoSchedule,
  onClearCompleted,
  onDragStart,
}: UnscheduledTasksProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (dataStr) {
        const { taskId } = JSON.parse(dataStr);
        if (taskId) {
          onDropTaskToUnscheduled(taskId);
        }
      }
    } catch (err) {
      console.error('Drop error in backlog', err);
    }
  };

  // Filter tasks based on selected priority dropdown
  const filteredTasks = tasks.filter((t) => {
    if (priorityFilter === 'all') return true;
    return t.priority === priorityFilter;
  });

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div
      id="unscheduled_tasks_container"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bg-slate-50 border-2 rounded-xl p-5 flex flex-col h-full transition-all duration-200 ${
        isDragOver
          ? 'border-indigo-400 bg-indigo-50/20 scale-[1.01]'
          : 'border-slate-200/80 hover:border-slate-300'
      }`}
    >
      {/* Header and Statistics */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="w-4.5 h-4.5 text-indigo-600 shrink-0" />
          <h3 className="font-bold text-slate-800 text-sm">
            未排程任務堆積區 ({tasks.length})
          </h3>
        </div>
        <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-700 font-mono px-2 py-0.5 rounded-full">
          Backlog
        </span>
      </div>

      <p className="text-xs text-slate-500 mb-3 leading-relaxed shrink-0">
        放下的任務或退回的任務會放在此處。您可以<strong>按住卡片拖拉</strong>到右側課表的空堂時間格，也能一鍵自動排程。
      </p>

      {/* Action Filters and Sorters */}
      <div className="flex flex-wrap items-center gap-2 mb-3 shrink-0">
        {/* Priority Filter select */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1 flex-1 min-w-[124px]">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            id="priority_filter_select"
            value={priorityFilter}
            onChange={(e: any) => setPriorityFilter(e.target.value)}
            className="w-full text-xs font-semibold text-slate-600 bg-transparent border-0 focus:ring-0 focus:outline-none cursor-pointer"
          >
            <option value="all">過濾：全部優先級</option>
            <option value="high">🔴 僅高優先級</option>
            <option value="medium">🟠 僅中優先級</option>
            <option value="low">🟢 僅低優先級</option>
          </select>
        </div>

        {/* Clear Completed tasks button */}
        {completedCount > 0 && (
          <button
            id="clear_completed_un_tasks_btn"
            type="button"
            onClick={onClearCompleted}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 p-1 bg-white hover:bg-rose-50 rounded"
            title="一鍵清除已完成的任務"
          >
            <Trash2 className="w-3 h-3" />
            清空已完成
          </button>
        )}
      </div>

      {/* Auto scheduler triggers */}
      {tasks.length > 0 && (
        <button
          id="btn_backlog_autoschedule"
          type="button"
          onClick={onAutoSchedule}
          className="w-full mb-3 shrink-0 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-slate-800 text-white font-bold text-xs py-2 rounded-lg cursor-pointer transition-all border border-indigo-500 shadow-sm hover:shadow-md"
          title="使用多準則調配算法：依高、中、低優先級，及截止時間，自動分派堆積任務至當日空堂！"
        >
          <Sparkles className="w-3.5 h-3.5" />
          一鍵自動排定當日計畫
        </button>
      )}

      {/* Task List container */}
      <div
        id="backlog_tasks_scroll_area"
        className="flex-1 overflow-y-auto space-y-2.5 max-h-[380px] lg:max-h-[620px] pr-1.5 min-h-[140px]"
      >
        {filteredTasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-10 border border-dashed border-slate-200 rounded-lg bg-white/50">
            <Layers className="w-8 h-8 text-slate-300 stroke-1 mb-2" />
            <p className="text-xs font-semibold">此優先級無待辦</p>
            <p className="text-[10px] text-slate-400 mt-0.5">新增或拖曳任務到此以暫存</p>
          </div>
        ) : (
          filteredTasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onToggleComplete={onToggleComplete}
              onDelete={onDelete}
              onDragStart={onDragStart}
            />
          ))
        )}
      </div>

      {/* Subtle bottom indicator */}
      {isDragOver && (
        <div className="mt-3 py-1.5 border border-dashed border-indigo-300 bg-indigo-50/50 rounded-lg text-center font-semibold text-[11px] text-indigo-700 animate-pulse flex items-center justify-center gap-1">
          <ArrowRightLeft className="w-3.5 h-3.5" />
          放開以移入待辦堆積區
        </div>
      )}
    </div>
  );
}
