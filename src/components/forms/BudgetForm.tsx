import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menubar, MenubarMenu, MenubarTrigger } from "../ui/menubar";
import { cn } from '../../lib/utils';
import { addDays, format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Calendar } from "../ui/calendar";
import { db, auth } from '../../firebase/config';
import { collection, addDoc, updateDoc, doc, Timestamp, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { Listbox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';

function ProjectTabs() {
  const location = useLocation();
  const navigate = useNavigate();
  const tabs = [
    { name: '夜行バス', path: '/nightbus' },
    { name: '宿泊先', path: '/accommodation' },
    { name: '予算管理', path: '/budget' },
    { name: '共有', path: '/share' }
  ];
  const currentTab = tabs.find(tab => location.pathname.startsWith(tab.path))?.name || tabs[0].name;
  const [activeTab, setActiveTab] = useState(currentTab);
  useEffect(() => {
    setActiveTab(currentTab);
  }, [location.pathname]);
  const handleTabClick = (tab: { name: string; path: string }) => {
    setActiveTab(tab.name);
    navigate(tab.path);
  };
  return (
    <Menubar className="rounded-md shadow-sm px-1 py-0.5 bg-gray-200">
      {tabs.map((tab) => (
        <MenubarMenu key={tab.name}>
          <MenubarTrigger
            onClick={() => handleTabClick(tab)}
            className={cn(
              "text-sm font-medium px-3 py-1.5 transition-colors rounded-[4px]",
              activeTab === tab.name
                ? "bg-gray-700 text-white font-semibold"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-300"
            )}
            style={{ borderRadius: '4px' }}
          >
            {tab.name}
          </MenubarTrigger>
        </MenubarMenu>
      ))}
    </Menubar>
  );
}

const COLORS = ['#4FC3F7', '#FFD54F', '#F06292', '#BA68C8'];

function DatePickerWithRange({ className, date, setDate }: { className?: string, date: DateRange | undefined, setDate: (d: DateRange | undefined) => void }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className={cn("grid gap-2 -mt-8", className)}>
      <button
        id="date"
        type="button"
        className={cn(
          "w-[300px] justify-start text-left font-normal flex items-center border border-gray-300 rounded px-3 py-2 bg-white hover:bg-gray-50 transition",
          !date && "text-muted-foreground"
        )}
        onClick={() => setOpen((v) => !v)}
      >
        <CalendarIcon className="mr-4" />
        {date?.from ? (
          date.to ? (
            <>
              {format(date.from, "LLL dd, y")} -{" "}
              {format(date.to, "LLL dd, y")}
            </>
          ) : (
            format(date.from, "LLL dd, y")
          )
        ) : (
          <span>日付を選択</span>
        )}
      </button>
      {open && (
        <div className="absolute z-50 bg-white border rounded shadow p-2 mt-12 w-[640px] min-w-[390px] overflow-hidden">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
        </div>
      )}
    </div>
  );
}

const BudgetForm: React.FC = () => {
  const [bus, setBus] = useState('');
  const [hotel, setHotel] = useState('');
  const [ticket, setTicket] = useState('');
  const [goods, setGoods] = useState('');
  const [busMemo, setBusMemo] = useState('');
  const [hotelMemo, setHotelMemo] = useState('');
  const [ticketMemo, setTicketMemo] = useState('');
  const [goodsMemo, setGoodsMemo] = useState('');
  const [totalMemo, setTotalMemo] = useState('');
  const [budgetId, setBudgetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [savedBudgets, setSavedBudgets] = useState<any[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7),
  });

  const data = [
    { name: '夜行バス料金', value: Number(bus) || 0 },
    { name: '宿泊先料金', value: Number(hotel) || 0 },
    { name: 'チケット料金', value: Number(ticket) || 0 },
    { name: 'グッズ料金', value: Number(goods) || 0 },
  ];
  const total = data.reduce((sum, item) => sum + item.value, 0);

  useEffect(() => {
    const fetchBudgets = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const q = query(collection(db, 'budgets'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      const budgets = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSavedBudgets(budgets);
      setSelectedBudget(null);
      clearForm();
      setBudgetId(null);
    };
    fetchBudgets();
  }, []);

  const handleBudgetSelect = (budgetId: string) => {
    setSelectedBudget(budgetId);
    if (budgetId === '') {
      clearForm();
      setBudgetId(null);
    } else {
      const budget = savedBudgets.find(b => b.id === budgetId);
      if (budget) {
        fillForm(budget);
        setBudgetId(budget.id);
      }
    }
  };

  const fillForm = (d: any) => {
    setBus(d.bus || '');
    setHotel(d.hotel || '');
    setTicket(d.ticket || '');
    setGoods(d.goods || '');
    setBusMemo(d.busMemo || '');
    setHotelMemo(d.hotelMemo || '');
    setTicketMemo(d.ticketMemo || '');
    setGoodsMemo(d.goodsMemo || '');
    setTotalMemo(d.totalMemo || '');
    setDateRange({
      from: d.fromDate?.toDate ? d.fromDate.toDate() : d.fromDate ? new Date(d.fromDate.seconds * 1000) : undefined,
      to: d.toDate?.toDate ? d.toDate.toDate() : d.toDate ? new Date(d.toDate.seconds * 1000) : undefined,
    });
  };

  const clearForm = () => {
    setBus(''); setHotel(''); setTicket(''); setGoods('');
    setBusMemo(''); setHotelMemo(''); setTicketMemo(''); setGoodsMemo(''); setTotalMemo('');
    setDateRange({ from: undefined, to: undefined });
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('ログインが必要です');
      const budgetData = {
        userId: user.uid,
        bus,
        hotel,
        ticket,
        goods,
        busMemo,
        hotelMemo,
        ticketMemo,
        goodsMemo,
        totalMemo,
        fromDate: dateRange?.from ? Timestamp.fromDate(dateRange.from) : null,
        toDate: dateRange?.to ? Timestamp.fromDate(dateRange.to) : null,
        createdAt: Timestamp.now(),
      };
      if (budgetId) {
        await updateDoc(doc(db, 'budgets', budgetId), budgetData);
        setSuccess('更新成功！');
        setToastMsg('更新成功！');
      } else {
        const ref = await addDoc(collection(db, 'budgets'), budgetData);
        setBudgetId(ref.id);
        setSuccess('保存成功！');
        setToastMsg('保存成功！');
      }
      const q = query(collection(db, 'budgets'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      setSavedBudgets(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setToastOpen(true);
    } catch (e: any) {
      setError('保存に失敗しました');
      setToastMsg('保存に失敗しました');
      setToastOpen(true);
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(''), 2000);
    }
  };

  const handleDelete = async () => {
    if (!budgetId) return;
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      await deleteDoc(doc(db, 'budgets', budgetId));
      setSavedBudgets(prev => prev.filter(b => b.id !== budgetId));
      setSelectedBudget(null);
      setBudgetId(null);
      clearForm();
      setToastMsg('削除成功！');
      setToastOpen(true);
    } catch (e: any) {
      setError('削除に失敗しました。');
      setToastMsg('削除に失敗しました');
      setToastOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (toastOpen) {
      const timer = setTimeout(() => setToastOpen(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [toastOpen]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-6">
      <div className="w-full max-w-6xl bg-white rounded-xl shadow p-8 flex flex-col gap-4">
        <div className="flex items-center -mt-2 -ml-3">
          <img src="/bus.png" alt="logo" className="h-6 w-11 mr-3" />
          <span className="font-bold text-xl mr-8">Live Bus Planner</span>
        </div>
        <div className="flex justify-start mb-8 mt-4">
          <ProjectTabs />
        </div>
        <div className="w-full mb-4 -mt-2">
          <label className="block text-base mb-2 font-semibold">保存済みの予算</label>
          <Listbox value={selectedBudget || ''} onChange={handleBudgetSelect}>
            <div className="relative">
              <Listbox.Button className="relative w-full h-12 bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-left focus:outline-none focus:ring-2 focus:ring-green-400 transition text-base">
                <span className="block truncate">
                  {selectedBudget
                    ? (() => {
                        const budget = savedBudgets.find(b => b.id === selectedBudget);
                        if (budget && budget.fromDate && budget.toDate) {
                          const from = budget.fromDate.toDate
                            ? budget.fromDate.toDate()
                            : new Date(budget.fromDate.seconds * 1000);
                          const to = budget.toDate.toDate
                            ? budget.toDate.toDate()
                            : new Date(budget.toDate.seconds * 1000);
                          return `予算(${from.getFullYear()}/${(from.getMonth()+1).toString().padStart(2,'0')}/${from.getDate().toString().padStart(2,'0')})`;
                        }
                        return '無題の予算';
                      })()
                    : '新しい予算を作成'}
                </span>
                <span className="absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </span>
              </Listbox.Button>
              <Transition
                enter="transition duration-100 ease-out"
                enterFrom="transform scale-95 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition duration-75 ease-out"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-95 opacity-0"
              >
                <Listbox.Options className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
                  <Listbox.Option
                    key="new"
                    value=""
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-2 pl-4 pr-9 ${
                        active ? 'bg-green-100 text-green-900' : 'text-gray-900'
                      }`
                    }
                  >
                    {({ selected }) => (
                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>新しい予算を作成</span>
                    )}
                  </Listbox.Option>
                  {savedBudgets.map((budget) => (
                    <Listbox.Option
                      key={budget.id}
                      value={budget.id}
                      className={({ active }) =>
                        `relative cursor-pointer select-none py-2 pl-4 pr-9 ${
                          active ? 'bg-green-100 text-green-900' : 'text-gray-900'
                        }`
                      }
                    >
                      {({ selected }) => {
                        let title = '無題の予算';
                        if (budget.fromDate && budget.toDate) {
                          const from = budget.fromDate.toDate
                            ? budget.fromDate.toDate()
                            : new Date(budget.fromDate.seconds * 1000);
                          const to = budget.toDate.toDate
                            ? budget.toDate.toDate()
                            : new Date(budget.toDate.seconds * 1000);
                          title = `${from.getFullYear()}/${(from.getMonth()+1).toString().padStart(2,'0')}/${from.getDate().toString().padStart(2,'0')} - ${to.getFullYear()}/${(to.getMonth()+1).toString().padStart(2,'0')}/${to.getDate().toString().padStart(2,'0')} 予算`;
                        }
                        return <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{title}</span>;
                      }}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>
          {selectedBudget && (
            <button type="button" onClick={handleDelete} className="mt-2 bg-red-500 hover:bg-red-600 text-white text-xs rounded px-3 py-1">削除</button>
          )}
        </div>
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="border-2 rounded-xl p-4" style={{ borderColor: '#4FC3F7' }}>
            <div className="font-semibold" style={{ color: '#4FC3F7' }}>交通料金</div>
            <div className="relative mt-2">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-lg" style={{ color: '#4FC3F7' }}>¥</span>
              <input type="number" value={bus} onChange={e => setBus(e.target.value)} className="w-full pl-7 border-b-2 text-xl font-bold outline-none" style={{ borderBottomColor: '#4FC3F7' }} placeholder="例：9400" />
            </div>
            <input type="text" value={busMemo} onChange={e => setBusMemo(e.target.value)} className="text-xs text-gray-600 mt-1 w-full border rounded px-2 py-1 mt-3" placeholder="メモ（例：夜行バス）" />
          </div>
          <div className="border-2 rounded-xl p-4" style={{ borderColor: '#FFD54F' }}>
            <div className="font-semibold" style={{ color: '#FFD54F' }}>宿泊先料金</div>
            <div className="relative mt-2">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-lg" style={{ color: '#FFD54F' }}>¥</span>
              <input type="number" value={hotel} onChange={e => setHotel(e.target.value)} className="w-full pl-7 border-b-2 text-xl font-bold outline-none" style={{ borderBottomColor: '#FFD54F' }} placeholder="例：3230" />
            </div>
            <input type="text" value={hotelMemo} onChange={e => setHotelMemo(e.target.value)} className="text-xs text-gray-600 mt-1 w-full border rounded px-2 py-1 mt-3" placeholder="メモ（例：ネットカフェ）" />
          </div>
          <div className="border-2 rounded-xl p-4" style={{ borderColor: '#F06292' }}>
            <div className="font-semibold" style={{ color: '#F06292' }}>チケット料金</div>
            <div className="relative mt-2">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-lg" style={{ color: '#F06292' }}>¥</span>
              <input type="number" value={ticket} onChange={e => setTicket(e.target.value)} className="w-full pl-7 border-b-2 text-xl font-bold outline-none" style={{ borderBottomColor: '#F06292' }} placeholder="例：15620" />
            </div>
            <input type="text" value={ticketMemo} onChange={e => setTicketMemo(e.target.value)} className="text-xs text-gray-600 mt-1 w-full border rounded px-2 py-1 mt-3" placeholder="メモ（例：一般指定席グッズ付）" />
          </div>
          <div className="border-2 rounded-xl p-4" style={{ borderColor: '#BA68C8' }}>
            <div className="font-semibold" style={{ color: '#BA68C8' }}>グッズ料金</div>
            <div className="relative mt-2">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-lg" style={{ color: '#BA68C8' }}>¥</span>
              <input type="number" value={goods} onChange={e => setGoods(e.target.value)} className="w-full pl-7 border-b-2 text-xl font-bold outline-none" style={{ borderBottomColor: '#BA68C8' }} placeholder="例：12000" />
            </div>
            <input type="text" value={goodsMemo} onChange={e => setGoodsMemo(e.target.value)} className="text-xs text-gray-600 mt-1 w-full border rounded px-2 py-1 mt-3" placeholder="メモ（例：アクリルキーホルダー）" />
          </div>
        </div>
        <div className="flex items-center justify-between mt-8">
          <div className="w-2/3 flex flex-col items-center">
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
          <div className="w-1/3 flex flex-col items-center">
            <DatePickerWithRange className="mb-4" date={dateRange} setDate={setDateRange} />
            <div
              className="border-2 rounded-2xl p-8 mb-8 w-64 mt-6 text-center"
              style={{ borderColor: '#43A047' }}
            >
              <div className="font-semibold text-lg mb-2" style={{ color: '#43A047' }}>
                合計料金
              </div>
              <div className="text-3xl font-bold mb-1" style={{ color: '#43A047' }}>
                ¥ {total.toLocaleString()}
              </div>
              <input type="text" value={totalMemo} onChange={e => setTotalMemo(e.target.value)} className="text-xs text-gray-600 w-full border rounded px-2 py-1 mt-3" placeholder="全体の予算メモ" />
            </div>
            <button
              className="font-bold rounded-[4px] w-64 h-14 text-xl shadow transition-colors"
              style={{ backgroundColor: '#43A047', color: '#fff' }}
              onMouseOver={e => (e.currentTarget.style.backgroundColor = '#2e7031')}
              onMouseOut={e => (e.currentTarget.style.backgroundColor = '#43A047')}
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
      {toastOpen && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded shadow-lg flex items-center animate-fade-in-out ${toastMsg.includes('削除成功') ? 'bg-red-500' : toastMsg.includes('失敗') ? 'bg-red-400' : 'bg-green-500'} text-white`}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          <span>{toastMsg}</span>
          <button onClick={() => setToastOpen(false)} className="ml-4 text-white hover:text-gray-200">×</button>
        </div>
      )}
    </div>
  );
};

export default BudgetForm; 