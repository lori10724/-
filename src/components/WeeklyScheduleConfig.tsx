/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ToggleLeft, ToggleRight, Info, RefreshCw, CheckCircle, ShieldAlert } from 'lucide-react';
import { WeeklyScheduleSettings } from '../types';
import { TIMELINE_SLOTS, WEEKDAYS } from '../data';

interface WeeklyScheduleConfigProps {
  settings: WeeklyScheduleSettings;
  onUpdateSetting: (dayOfWeek: number, slotId: string, isOccupied: boolean, label: string) => void;
  onResetToDefaults: () => void;
}

export default function WeeklyScheduleConfig({
  settings,
  onUpdateSetting,
  onResetToDefaults,
}: WeeklyScheduleConfigProps) {
  // Store the active setting day tab in Settings view
  const [activeDayTab, setActiveDayTab] = useState(1); // Default to Monday

  const handleToggle = (day: number, slotId: string, currentOccupied: boolean) => {
    // If we toggle from Free to Occupied, default label is "有課"
    const nextOccupied = !currentOccupied;
    const currentLabel = settings[`${day}_${slotId}`]?.label || '';
    const nextLabel = nextOccupied ? (currentLabel || '有課 (固定課表)') : '';
    onUpdateSetting(day, slotId, nextOccupied, nextLabel);
  };

  const handleLabelChange = (day: number, slotId: string, val: string) => {
    const isOcc = settings[`${day}_${slotId}`]?.isOccupied || false;
    onUpdateSetting(day, slotId, isOcc, val);
  };

  return (
    <div id="weekly_schedule_config_view" className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 mb-6">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <SlidersIcon className="w-5 h-5 text-slate-600" />
            教師固定每週課表與佔用時間設定
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            設定每週固定時段是否有課。被標記為<strong>「有課」</strong>的時間格將鎖定，<strong>不可排入隨機工作</strong>。標記為<strong>「空堂」</strong>方可拖入任務。
          </p>
        </div>

        <button
          id="reset_to_defaults_btn"
          type="button"
          onClick={() => {
            if (window.confirm('確定要還原為系統預設教師課表嗎？（將覆蓋您目前的有課標記變更）')) {
              onResetToDefaults();
            }
          }}
          className="flex items-center gap-1.5 border border-slate-300 hover:border-slate-400 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          還原預設課表
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex items-start gap-2.5 text-xs text-amber-800 mb-5">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold">課表作用提示：</strong>
          預設已載入週一、週三下午课後班與特殊有課、週四研究所整天之鎖定排程。當您在此變更課表設定時，相應時段
          在首頁時間軸 與 每週總表中會自動更新。已被任務佔用的時段若被標記為有課，任務會自動退回未排程區，以防衝突。
        </div>
      </div>

      {/* Weekday Switcher in settings */}
      <div className="flex border-b border-slate-200 mb-6 gap-1 overflow-x-auto">
        {WEEKDAYS.map((wd) => {
          const isActive = activeDayTab === wd.day;
          // Count occupied spots
          let occupiedCount = 0;
          TIMELINE_SLOTS.forEach((slot) => {
            if (settings[`${wd.day}_${slot.id}`]?.isOccupied) {
              occupiedCount++;
            }
          });

          return (
            <button
              key={wd.day}
              type="button"
              id={`setting_day_tab_${wd.day}`}
              onClick={() => setActiveDayTab(wd.day)}
              className={`pb-3 px-4 text-xs font-semibold transition-all relative shrink-0 ${
                isActive ? 'text-slate-900 border-b-2 border-slate-800 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {wd.fullLabel}
              {occupiedCount > 0 && (
                <span className="ml-1.5 bg-slate-100 text-slate-600 border border-slate-200 text-[10px] px-1.5 py-0.25 rounded-md font-mono">
                  {occupiedCount} 節有課
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Grid List of 13 slots for active settings day */}
      <div id="setting_slots_grid" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TIMELINE_SLOTS.map((slot, index) => {
          const key = `${activeDayTab}_${slot.id}`;
          const currentSetting = settings[key] || { isOccupied: false, label: '' };

          return (
            <div
              key={slot.id}
              id={`setting_slot_row_${slot.id}`}
              className={`p-4 border rounded-xl flex items-center justify-between gap-4 transition-all ${
                currentSetting.isOccupied
                  ? 'bg-slate-50 border-slate-300 shadow-2xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="min-w-0 flex-1 flex flex-col gap-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-100 border border-slate-200 text-slate-600 font-mono text-[10px] px-2 py-0.5 rounded font-semibold shrink-0">
                    {slot.time}
                  </span>
                  <span className="text-sm font-semibold text-slate-700 truncate">{slot.name}</span>
                </div>

                {/* Occupied title text input (only enable when occupied is true) */}
                {currentSetting.isOccupied ? (
                  <input
                    type="text"
                    id={`setting_label_input_${activeDayTab}_${slot.id}`}
                    value={currentSetting.label}
                    onChange={(e) => handleLabelChange(activeDayTab, slot.id, e.target.value)}
                    placeholder="請輸入佔用事由 (如：第一節 國文課)..."
                    className="w-full text-xs px-2.5 py-1.5 mt-1 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 placeholder-slate-400"
                  />
                ) : (
                  <span className="text-[11px] text-slate-400 mt-1 italic flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    空堂（可排自修、備課、聯絡、改作業）
                  </span>
                )}
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                id={`setting_toggle_btn_${activeDayTab}_${slot.id}`}
                onClick={() => handleToggle(activeDayTab, slot.id, currentSetting.isOccupied)}
                className="focus:outline-none cursor-pointer shrink-0"
                title={currentSetting.isOccupied ? '切換為空堂' : '切換為有課'}
              >
                {currentSetting.isOccupied ? (
                  <div className="flex items-center gap-1 text-rose-600 font-semibold text-xs bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>有課</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-slate-400 font-semibold text-xs bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg hover:text-slate-600 hover:border-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>空堂</span>
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Inline mini icon component to avoid extra file imports
function SlidersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" x12="4" y1="21" y2="14" />
      <line x1="4" x12="4" y1="10" y2="3" />
      <line x1="12" x12="12" y1="21" y2="12" />
      <line x1="12" x12="12" y1="8" y2="3" />
      <line x1="20" x12="20" y1="21" y2="16" />
      <line x1="20" x12="20" y1="12" y2="3" />
      <line x1="2" x12="6" y1="14" y2="14" />
      <line x1="10" x12="14" y1="8" y2="8" />
      <line x1="18" x12="22" y1="16" y2="16" />
    </svg>
  );
}
