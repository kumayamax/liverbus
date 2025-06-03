import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const COLORS = ['#4FC3F7', '#FFD54F', '#F06292', '#BA68C8'];

export default function ReadOnlyBudgetCard({ budget }: { budget: any }) {
  // 预留图片预览功能
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const images: string[] = budget.images || [];
  const data = [
    { name: '夜行バス料金', value: Number(budget.bus) || 0 },
    { name: '宿泊先料金', value: Number(budget.hotel) || 0 },
    { name: 'チケット料金', value: Number(budget.ticket) || 0 },
    { name: 'グッズ料金', value: Number(budget.goods) || 0 },
  ];
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return (
    <div className="flex flex-row gap-12 p-8 items-start bg-gray-50 rounded-3xl shadow-xl border border-gray-200">
      {/* 左侧：金额分组卡片区 */}
      <div className="flex flex-col gap-6 w-full max-w-[340px] bg-blue-50 rounded-3xl p-6 shadow-sm">
        <div className="bg-white rounded-2xl shadow p-5 border-2" style={{ borderColor: '#4FC3F7' }}>
          <div className="font-semibold text-blue-400 text-base mb-1">交通料金</div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-blue-400 text-lg font-bold">¥</span>
            <span className="text-2xl font-bold text-gray-800">{budget.bus || 0}</span>
          </div>
          <div className="text-xs text-gray-600 bg-gray-100 rounded px-2 py-1">{budget.busMemo || '-'}</div>
        </div>
        <div className="bg-white rounded-2xl shadow p-5 border-2" style={{ borderColor: '#FFD54F' }}>
          <div className="font-semibold text-yellow-500 text-base mb-1">宿泊先料金</div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-yellow-500 text-lg font-bold">¥</span>
            <span className="text-2xl font-bold text-gray-800">{budget.hotel || 0}</span>
          </div>
          <div className="text-xs text-gray-600 bg-gray-100 rounded px-2 py-1">{budget.hotelMemo || '-'}</div>
        </div>
        <div className="bg-white rounded-2xl shadow p-5 border-2" style={{ borderColor: '#F06292' }}>
          <div className="font-semibold text-pink-400 text-base mb-1">チケット料金</div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-pink-400 text-lg font-bold">¥</span>
            <span className="text-2xl font-bold text-gray-800">{budget.ticket || 0}</span>
          </div>
          <div className="text-xs text-gray-600 bg-gray-100 rounded px-2 py-1">{budget.ticketMemo || '-'}</div>
        </div>
        <div className="bg-white rounded-2xl shadow p-5 border-2" style={{ borderColor: '#BA68C8' }}>
          <div className="font-semibold text-purple-400 text-base mb-1">グッズ料金</div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-purple-400 text-lg font-bold">¥</span>
            <span className="text-2xl font-bold text-gray-800">{budget.goods || 0}</span>
          </div>
          <div className="text-xs text-gray-600 bg-gray-100 rounded px-2 py-1">{budget.goodsMemo || '-'}</div>
        </div>
      </div>
      {/* 右侧：饼图+合计卡片+日期区块 */}
      <div className="flex flex-col gap-8 flex-1 min-w-[400px]">
        {/* 饼图区（右上） */}
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-[620px] h-[440px] mx-auto flex items-center justify-center">
          <ResponsiveContainer width={400} height={260}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={2}
                dataKey="value"
                label={({ name }: { name: string }) => name}
                labelLine={false}
                stroke="#fff"
                strokeWidth={2}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* 合计卡片（右下） */}
        <div className="flex flex-col gap-6 w-full max-w-[500px] mx-auto">
          <div className="w-full bg-white rounded-2xl shadow p-6 border-2 border-green-600">
            <div className="font-semibold text-lg mb-2 text-green-700">
              合計料金
            </div>
            <div className="text-3xl font-bold mb-1 text-green-700">
              ¥ {total.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600 w-full border rounded px-2 py-1 mt-3 bg-gray-100">{budget.totalMemo || '-'}</div>
          </div>
          <div className="w-full bg-gray-50 rounded-lg p-6 flex items-center justify-center gap-2 border text-sm font-semibold ">
            <span className="text-green-700">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path stroke="#43A047" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10m-9 8h10m-9-4h6m-7 8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6Z"/>
              </svg>
            </span>
            <span className="text-gray-700 text-sm">
              {budget.fromDate && budget.toDate
                ? `${new Date(budget.fromDate.seconds * 1000).toLocaleDateString()} - ${new Date(budget.toDate.seconds * 1000).toLocaleDateString()}`
                : '----/--/--'}
            </span>
          </div>
        </div>
      </div>
      {/* 预览模态框 */}
      {previewIdx !== null && images[previewIdx] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={() => setPreviewIdx(null)}>
          <div className="relative" onClick={e => e.stopPropagation()}>
            <img
              src={images[previewIdx]}
              alt="preview-large"
              className="max-w-[90vw] max-h-[80vh] rounded-2xl shadow-2xl border-4 border-white"
            />
            <button
              className="absolute top-2 right-2 bg-white bg-opacity-80 rounded-full p-2 shadow hover:bg-opacity-100"
              onClick={() => setPreviewIdx(null)}
            >
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M6 6l12 12M6 18L18 6" stroke="#333" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
            {images.length > 1 && (
              <>
                <button
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 shadow hover:bg-opacity-100"
                  onClick={() => setPreviewIdx((previewIdx! - 1 + images.length) % images.length)}
                >
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" stroke="#333" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 shadow hover:bg-opacity-100"
                  onClick={() => setPreviewIdx((previewIdx! + 1) % images.length)}
                >
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" stroke="#333" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 