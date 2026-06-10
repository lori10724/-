/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GripVertical, Trash2, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Task } from '../types';

interface TaskCardProps {
  key?: string;
  task: Task;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onDragStart?: (id: string) => void;
  isCompact?: boolean;
}

export default function TaskCard({
  task,
  onToggleComplete,
  onDelete,
  onDragStart,
  isCompact = false,
}: TaskCardProps) {
  const priorityInfo = {
    high: { border: 'border-l-4 border-l-rose-500 bg-rose-50/10 hover:bg-rose-50/20', text: '🔴 高' },
    medium: { border: 'border-l-4 border-l-amber-500 bg-amber-50/10 hover:bg-amber-50/20', text: '🟠 中' },
    low: { border: 'border-l-4 border-l-emerald-500 bg-emerald-50/10 hover:bg-emerald-50/20', text: '🟢 低' },
  }[task.priority];

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({ taskId: task.id }));
    if (onDragStart) {
      onDragStart(task.id);
    }
  };

  return (
    <div
      id={`task_card_${task.id}`}
      draggable
      onDragStart={handleDragStart}
      className={`group relative flex items-center justify-between p-3 border border-slate-200/60 rounded-lg shadow-2xs hover:shadow-xs bg-white transition-all cursor-grab active:cursor-grabbing ${
        priorityInfo.border
      } ${task.completed ? 'opacity-50 saturate-50' : ''}`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {/* Grip Handle */}
        <div className="text-slate-300 group-hover:text-slate-400 transition-colors">
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Checkbox */}
        <input
          id={`task_checkbox_${task.id}`}
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggleComplete(task.id)}
          className="w-4 h-4 text-slate-700 bg-gray-100 border-gray-300 rounded focus:ring-slate-500 accent-slate-700 cursor-pointer"
        />

        {/* Task Content */}
        <div className="min-w-0 flex-1 flex flex-col gap-0.5">
          <span
            id={`task_name_span_${task.id}`}
            className={`text-slate-700 text-sm font-medium truncate ${
              task.completed ? 'line-through text-slate-400' : ''
            }`}
            title={task.name}
          >
            {task.name}
          </span>

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-slate-400 font-medium">
            {/* Custom deadline */}
            <span className="flex items-center gap-1 shrink-0" title="截止時間">
              <Clock className="w-3 h-3 text-slate-400" />
              {task.deadline}
            </span>

            {/* Simulated duration */}
            <span className="bg-slate-100 text-slate-500 px-1.5 py-0.25 rounded font-mono text-[10px] shrink-0">
              {task.duration} mins
            </span>

            {/* Priority dot indicator */}
            <span className="shrink-0">{priorityInfo.text}</span>
          </div>
        </div>
      </div>

      {/* Delete / Actions */}
      <button
        id={`task_delete_btn_${task.id}`}
        type="button"
        title="刪除任務"
        onClick={() => onDelete(task.id)}
        className="ml-2 text-slate-300 hover:text-rose-500 p-1 rounded-md hover:bg-slate-50 transition-colors opacity-100 sm:opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
