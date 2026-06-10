/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Moon, LayoutGrid, CalendarRange, Sliders, Play } from 'lucide-react';
import { WEEKDAYS } from '../data';

interface CalendarHeaderProps {
  currentDayIndex: number; // 1-7
  onSelectDay: (day: number) => void;
  currentDateStr: string; // YYYY-MM-DD
  viewMode: 'daily' | 'weekly' | 'settings';
  onSetViewMode: (mode: 'daily' | 'weekly' | 'settings') => void;
  onSimulateMidnight: () => void;
  unscheduledCount: number;
  scheduledCount: number;
}

export default function CalendarHeader({
  currentDayIndex,
  onSelectDay,
  currentDateStr,
  viewMode,
  onSetViewMode,
  onSimulateMidnight,
  unscheduledCount,
  scheduledCount,
}: CalendarHeaderProps) {
  const [timeString, setTimeString] = useState('');

  // Update a simple real-time digital clock display
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('zh-TW', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format the visual date string e.g., 2026年06月10日
  const formattedDate = () => {
    try {
      const [y, m, d] = currentDateStr.split('-');
      const weekdayLabel = WEEKDAYS.find((wd) => wd.day === currentDayIndex)?.fullLabel || '';
      return `${y}年${m}月${d}日 (${weekdayLabel})`;
    } catch {
      return currentDateStr;
    }
  };

  return (
    <header id="app_header" className="bg-slate-900 text-white rounded-xl p-5 mb-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Branding & Simulated Clock */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-800 text-slate-100 p-2.5 rounded-lg border border-slate-700">
            <Calendar className="w-6 h-6 text-slate-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg lg:text-xl font-bold tracking-tight text-white font-sans">
                教師每日時間規劃工具
              </h1>
              <span className="bg-slate-100/10 text-slate-300 border border-slate-700 text-[11px] font-medium px-2 py-0.5 rounded-full font-mono">
                v1.2-Local
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              專為中中小學教師設計的課表拖拉式日程與待辦安排，支援週課表狀態連動
            </p>
          </div>
        </div>

        {/* Info widgets and Midnight Rollover */}
        <div className="flex flex-wrap items-center gap-3 lg:self-end">
          {/* Virtual Clock Display */}
          <div className="flex items-center gap-2.5 bg-slate-800/80 border border-slate-700 px-3.5 py-1.5 rounded-lg font-mono">
            <Clock className="w-4 h-4 text-slate-400 animate-pulse" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase text-slate-400 leading-none">系統時間</span>
              <span className="text-sm font-semibold text-white mt-0.5">{timeString || '08:00:00'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-800/80 border border-slate-700 px-3.5 py-1.5 rounded-lg">
            <CalendarRange className="w-4 h-4 text-slate-400" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase text-slate-400 leading-none">模擬日期</span>
              <span className="text-xs font-semibold text-slate-200 mt-0.5">{formattedDate()}</span>
            </div>
          </div>

          {/* Trigger Midnight Rollover */}
          <button
            id="midnight_sim_btn"
            type="button"
            onClick={onSimulateMidnight}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs px-3.5 py-2 rounded-lg cursor-pointer transition-all border border-amber-500 shadow-md transform hover:scale-[1.02]"
            title="將日期跨過 12:00 AM，已完成任務進入歷史存檔，未完成任務移至昨日未排程堆積區"
          >
            <Moon className="w-3.5 h-3.5" />
            模擬跨夜 AM 12:00
          </button>
        </div>
      </div>

      {/* Navigation tabs between views */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Toggle between main view modes */}
        <div className="flex bg-slate-800 p-1 border border-slate-700 rounded-lg max-w-max">
          <button
            id="nav_mode_daily_btn"
            onClick={() => onSetViewMode('daily')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'daily'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            每日規劃
          </button>
          <button
            id="nav_mode_weekly_btn"
            onClick={() => onSetViewMode('weekly')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'weekly'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            每週任務總表
          </button>
          <button
            id="nav_mode_settings_btn"
            onClick={() => onSetViewMode('settings')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'settings'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            編輯週固定課表
          </button>
        </div>

        {/* Switch ACTIVE day (ONLY relevant if viewMode is 'daily') */}
        {viewMode === 'daily' && (
          <div className="flex items-center gap-1.5 bg-slate-800/50 p-1 rounded-lg border border-slate-700/60 overflow-x-auto max-w-full">
            <span className="text-xs text-slate-400 px-2 select-none font-medium shrink-0">
              選擇規劃日：
            </span>
            {WEEKDAYS.map((wd) => {
              const isActive = currentDayIndex === wd.day;
              return (
                <button
                  key={wd.day}
                  id={`wd_tab_select_${wd.day}`}
                  onClick={() => onSelectDay(wd.day)}
                  className={`text-xs px-3 py-1 rounded-md font-semibold transition-all shrink-0 ${
                    isActive
                      ? 'bg-slate-100 text-slate-950 font-bold'
                      : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
                  }`}
                >
                  {wd.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Tiny stats display */}
        <div className="text-right flex items-center md:justify-end gap-3.5 text-xs text-slate-400">
          <div>
            已排程：
            <span className="font-mono font-semibold text-slate-200">
              {scheduledCount}
            </span>
          </div>
          <div className="border-l border-slate-700 h-3"></div>
          <div>
            未排程：
            <span className="font-mono font-semibold text-slate-200">
              {unscheduledCount}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
