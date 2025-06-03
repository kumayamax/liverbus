import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const COLORS = ['#4FC3F7', '#FFD54F', '#F06292', '#BA68C8'];

export default function ReadOnlyBudgetCard({ budget }: { budget: any }) {
  const data = [
    { name: '夜行バス料金', value: Number(budget.bus) || 0 },
    { name: '宿泊先料金', value: Number(budget.hotel) || 0 },
    { name: 'チケット料金', value: Number(budget.ticket) || 0 },
    { name: 'グッズ料金', value: Number(budget.goods) || 0 },
  ];
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return (
    <div className="w-full flex flex-col md:flex-row gap-8 mb-8">
      {/* 左侧：金额卡片 */}
      <div className="grid grid-cols-2 gap-4 flex-1">
        <div className="border-2 rounded-xl p-4" style={{ borderColor: '#4FC3F7' }}>
          <div className="font-semibold" style={{ color: '#4FC3F7' }}>交通料金</div>
          <div className="relative mt-2">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-lg" style={{ color: '#4FC3F7' }}>¥</span>
            <div className="w-full pl-7 border-b-2 text-xl font-bold outline-none" style={{ borderBottomColor: '#4FC3F7' }}>{budget.bus || 0}</div>
          </div>
          <div className="text-xs text-gray-600 mt-1 w-full border rounded px-2 py-1 mt-3 bg-gray-100">{budget.busMemo || '-'}</div>
        </div>
        <div className="border-2 rounded-xl p-4" style={{ borderColor: '#FFD54F' }}>
          <div className="font-semibold" style={{ color: '#FFD54F' }}>宿泊先料金</div>
          <div className="relative mt-2">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-lg" style={{ color: '#FFD54F' }}>¥</span>
            <div className="w-full pl-7 border-b-2 text-xl font-bold outline-none" style={{ borderBottomColor: '#FFD54F' }}>{budget.hotel || 0}</div>
          </div>
          <div className="text-xs text-gray-600 mt-1 w-full border rounded px-2 py-1 mt-3 bg-gray-100">{budget.hotelMemo || '-'}</div>
        </div>
        <div className="border-2 rounded-xl p-4" style={{ borderColor: '#F06292' }}>
          <div className="font-semibold" style={{ color: '#F06292' }}>チケット料金</div>
          <div className="relative mt-2">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-lg" style={{ color: '#F06292' }}>¥</span>
            <div className="w-full pl-7 border-b-2 text-xl font-bold outline-none" style={{ borderBottomColor: '#F06292' }}>{budget.ticket || 0}</div>
          </div>
          <div className="text-xs text-gray-600 mt-1 w-full border rounded px-2 py-1 mt-3 bg-gray-100">{budget.ticketMemo || '-'}</div>
        </div>
        <div className="border-2 rounded-xl p-4" style={{ borderColor: '#BA68C8' }}>
          <div className="font-semibold" style={{ color: '#BA68C8' }}>グッズ料金</div>
          <div className="relative mt-2">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-lg" style={{ color: '#BA68C8' }}>¥</span>
            <div className="w-full pl-7 border-b-2 text-xl font-bold outline-none" style={{ borderBottomColor: '#BA68C8' }}>{budget.goods || 0}</div>
          </div>
          <div className="text-xs text-gray-600 mt-1 w-full border rounded px-2 py-1 mt-3 bg-gray-100">{budget.goodsMemo || '-'}</div>
        </div>
      </div>
      {/* 中间：饼图 */}
      <div className="flex-1 flex flex-col items-center justify-center min-w-[320px]">
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              fill="#8884d8"
              paddingAngle={2}
              dataKey="value"
              label={({ name, value }: { name: string; value: number }) => value > 0 ? `${name} ¥${value}` : ''}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* 右侧：总金额卡片+备注+日期 */}
      <div className="flex-1 flex flex-col items-center justify-center min-w-[280px]">
        <div className="w-full bg-white rounded-2xl shadow p-8 mb-8 border-2" style={{ borderColor: '#43A047' }}>
          <div className="font-semibold text-lg mb-2" style={{ color: '#43A047' }}>
            合計料金
          </div>
          <div className="text-3xl font-bold mb-1" style={{ color: '#43A047' }}>
            ¥ {total.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600 w-full border rounded px-2 py-1 mt-3 bg-gray-100">{budget.totalMemo || '-'}</div>
        </div>
        <div className="w-full bg-gray-50 rounded-lg p-6 mb-4 flex items-center justify-center gap-2 border text-sm font-semibold ">
          <span className="text-gray-600">
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
  );
} 