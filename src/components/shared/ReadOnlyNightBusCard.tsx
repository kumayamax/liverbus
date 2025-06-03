import React, { useState } from 'react';
import { DayPicker } from 'react-day-picker';

interface Trip {
  id: string;
  from: string;
  to: string;
  fromStation: string;
  toStation: string;
  busName: string;
  busPrice: number;
  fromDate: any;
  toDate: any;
  amount: number;
  note: string;
  images: string[];
  tripName?: string;
}

interface ReadOnlyNightBusCardProps {
  trip: Trip;
}

const ReadOnlyNightBusCard: React.FC<ReadOnlyNightBusCardProps> = ({ trip }) => {
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const from = trip.fromDate ? new Date(trip.fromDate.seconds * 1000) : undefined;
  const to = trip.toDate ? new Date(trip.toDate.seconds * 1000) : undefined;
  return (
    <div className="flex flex-col md:flex-row gap-12 p-8 items-center bg-gray-50 rounded-3xl shadow-xl border border-gray-200">
      {/* 左：图片区（加宽） */}
      <div className="bg-blue-100 rounded-3xl flex flex-col items-center justify-center p-6 w-full md:w-[300px] min-h-[400px] shadow-sm">
        {trip.images && trip.images.length > 0 ? (
          <div className="flex flex-wrap gap-3 w-full justify-center">
            {trip.images.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt="preview"
                className="w-24 h-24 object-cover rounded-xl border border-blue-200 shadow cursor-pointer"
                onClick={() => setPreviewIdx(idx)}
              />
            ))}
          </div>
        ) : (
          <span className="text-7xl text-blue-400 mb-2">＋</span>
        )}
        <span className="text-lg font-bold text-blue-700 mt-4 tracking-wide">画像</span>
      </div>
      {/* 预览模态框 */}
      {previewIdx !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={() => setPreviewIdx(null)}>
          <div className="relative" onClick={e => e.stopPropagation()}>
            <img
              src={trip.images[previewIdx]}
              alt="preview-large"
              className="max-w-[90vw] max-h-[80vh] rounded-2xl shadow-2xl border-4 border-white"
            />
            {/* 关闭按钮 */}
            <button
              className="absolute top-2 right-2 bg-white bg-opacity-80 rounded-full p-2 shadow hover:bg-opacity-100"
              onClick={() => setPreviewIdx(null)}
            >
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M6 6l12 12M6 18L18 6" stroke="#333" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
            {/* 多图切换 */}
            {trip.images.length > 1 && (
              <>
                <button
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 shadow hover:bg-opacity-100"
                  onClick={() => setPreviewIdx((previewIdx - 1 + trip.images.length) % trip.images.length)}
                >
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" stroke="#333" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 shadow hover:bg-opacity-100"
                  onClick={() => setPreviewIdx((previewIdx + 1) % trip.images.length)}
                >
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" stroke="#333" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {/* 中：信息区（分组优化） */}
      <div className="flex-1 flex flex-col justify-center min-w-0 gap-10 ml-5">
        {/* 时间信息 */}
        <div className="flex flex-row gap-10">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-600 mb-1">出発時間</span>
            <span className="bg-white rounded-xl px-5 py-2 shadow text-xl font-bold min-w-[100px] text-gray-800 text-left">{trip.from}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-600 mb-1">到着時間</span>
            <span className="bg-white rounded-xl px-5 py-2 shadow text-xl font-bold min-w-[100px] text-gray-800 text-left">{trip.to}</span>
          </div>
        </div>
        {/* 车站信息 */}
        <div className="flex flex-row gap-10">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-600 mb-1">出発地駅名</span>
            <span className="bg-white rounded-xl px-5 py-2 shadow text-xl font-bold min-w-[100px] text-gray-800 text-left">{trip.fromStation}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-600 mb-1">到着地駅名</span>
            <span className="bg-white rounded-xl px-5 py-2 shadow text-xl font-bold min-w-[100px] text-gray-800 text-left">{trip.toStation}</span>
          </div>
        </div>
        {/* 巴士信息 */}
        <div className="flex flex-row gap-10">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-600 mb-1">夜行バス名</span>
            <span className="bg-blue-50 rounded-xl px-5 py-2 shadow text-xl font-bold min-w-[100px] text-blue-700 text-left">{trip.busName}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-600 mb-1">夜行バス料金</span>
            <span className="bg-blue-50 rounded-xl px-5 py-2 shadow text-xl font-bold min-w-[100px] text-blue-700 text-left">¥{trip.busPrice.toLocaleString()}</span>
          </div>
        </div>
        {/* 备注信息 */}
        {trip.note && (
          <div className="flex flex-col mt-2">
            <span className="text-sm font-semibold text-gray-600 mb-1">メモ</span>
            <span className="bg-gray-100 rounded-xl px-5 py-2 shadow text-base min-w-[100px] text-gray-700 text-left">{trip.note}</span>
          </div>
        )}
      </div>
      {/* 右：日历区（加宽，恢复 items-center） */}
      <div className="flex flex-col items-center justify-center w-full md:w-[330px]">
        <div className="w-full bg-white rounded-2xl p-6 mb-6 flex items-center justify-center gap-3 border border-blue-100 shadow text-base font-semibold ">
          <span className="text-blue-500">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path stroke="#2563eb" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10m-9 8h10m-9-4h6m-7 8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6Z"/></svg>
          </span>
          <span className="text-gray-700 text-base">
            {from ? from.toLocaleDateString() : '----/--/--'}
            {to ? ` - ${to.toLocaleDateString()}` : ''}
          </span>
        </div>
        <div className="bg-gray-50 rounded-3xl shadow-lg p-2 w-full">
          <DayPicker
            mode="range"
            selected={{ from, to }}
            showOutsideDays
            disabled
            className="!rounded-2xl !border-0 !shadow-none"
          />
        </div>
      </div>
    </div>
  );
};

export default ReadOnlyNightBusCard; 