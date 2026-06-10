/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Clock, AlertTriangle } from 'lucide-react';
import { Priority, Task } from '../types';

interface TaskInputFormProps {
  onAddTask: (taskData: {
    name: string;
    deadline: string;
    duration: 20 | 40;
    priority: Priority;
    autoSchedule: boolean;
  }) => void;
  isAllOccupiedToday: boolean;
}

export default function TaskInputForm({ onAddTask, isAllOccupiedToday }: TaskInputFormProps) {
  const [name, setName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [duration, setDuration] = useState<20 | 40>(40);
  const [priority, setPriority] = useState<Priority>('medium');
  const [autoSchedule, setAutoSchedule] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddTask({
      name: name.trim(),
      deadline: deadline.trim() || '本日',
      duration,
      priority,
      autoSchedule,
    });

    // Reset fields
    setName('');
    setDeadline('');
    setDuration(40);
    setPriority('medium');
  };

  return (
    <form
      id="task_creation_form"
      onSubmit={handleSubmit}
      className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 shadow-xs transition-all"
    >
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/60">
        <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
          <Plus className="w-4 h-4 text-slate-600" />
          新增教師待辦任務
        </h3>
        <span className="text-xs text-slate-500 font-mono">Quick Task Creator</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Task Name */}
        <div className="md:col-span-4 flex flex-col gap-1.5">
          <label htmlFor="task_name_input" className="text-xs font-semibold text-slate-600">
            任務名稱 <span className="text-rose-500">*</span>
          </label>
          <input
            id="task_name_input"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：批改第三組科學作業、印聯絡簿..."
            className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 bg-white placeholder-slate-400"
          />
        </div>

        {/* Deadline */}
        <div className="md:col-span-3 flex flex-col gap-1.5">
          <label htmlFor="task_deadline_input" className="text-xs font-semibold text-slate-600">
            截止時間 / 細節
          </label>
          <input
            id="task_deadline_input"
            type="text"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            placeholder="例如：12:00、放學前、第三節後"
            className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 bg-white placeholder-slate-400"
          />
        </div>

        {/* Duration */}
        <div className="md:col-span-2 flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600">預估時間</label>
          <div className="grid grid-cols-2 gap-1 bg-white p-1 border border-slate-200 rounded-lg">
            <button
              type="button"
              id="duration_20_btn"
              onClick={() => setDuration(20)}
              className={`py-1 text-xs font-medium rounded-md transition-all ${
                duration === 20
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              20 分鐘
            </button>
            <button
              type="button"
              id="duration_40_btn"
              onClick={() => setDuration(40)}
              className={`py-1 text-xs font-medium rounded-md transition-all ${
                duration === 40
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              40 分鐘
            </button>
          </div>
        </div>

        {/* Priority */}
        <div className="md:col-span-3 flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 font-sans">任務優先級 (優先排課依據)</label>
          <div className="grid grid-cols-3 gap-1 bg-white p-1 border border-slate-200 rounded-lg">
            {(['high', 'medium', 'low'] as Priority[]).map((p) => {
              const colors = {
                high: { active: 'bg-rose-50 text-rose-700 border-rose-200', text: '🔴 核心/高' },
                medium: { active: 'bg-amber-50 text-amber-700 border-amber-200', text: '🟠 中等' },
                low: { active: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: '🟢 自訂/低' },
              }[p];

              const isActive = priority === p;

              return (
                <button
                  key={p}
                  type="button"
                  id={`priority_${p}_btn`}
                  onClick={() => setPriority(p)}
                  className={`py-1 text-[11px] font-medium rounded-md border transition-all ${
                    isActive
                      ? `${colors.active} font-semibold`
                      : 'border-transparent text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {colors.text}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-200/40">
        <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-600">
          <input
            type="checkbox"
            checked={autoSchedule}
            onChange={(e) => setAutoSchedule(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-slate-700 focus:ring-slate-500accent-slate-700"
          />
          <span>自動放置至本日第一個合適的空堂區塊</span>
        </label>

        <button
          type="submit"
          id="add_task_btn"
          className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          加入排程
        </button>
      </div>
    </form>
  );
}
