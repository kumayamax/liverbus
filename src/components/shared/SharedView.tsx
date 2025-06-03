import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Menubar, MenubarMenu, MenubarTrigger } from "../ui/menubar";
import { cn } from "../../lib/utils";
import ReadOnlyNightBusCard from './ReadOnlyNightBusCard';
import ReadOnlyAccommodationCard from './ReadOnlyAccommodationCard';
import ReadOnlyBudgetCard from './ReadOnlyBudgetCard';

const TABS = [
  { key: 'nightbus', label: '夜行バス' },
  { key: 'accommodation', label: '宿泊先' },
  { key: 'budget', label: '予算管理' }
];

export default function SharedView() {
  const [activeTab, setActiveTab] = useState('nightbus');
  const [nightBuses, setNightBuses] = useState<any[]>([]);
  const [accommodations, setAccommodations] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const tripIds = params.get('trips')?.split(',') || [];
        const accommodationIds = params.get('accommodations')?.split(',') || [];
        const budgetIds = params.get('budgets')?.split(',') || [];

        const [tripsSnap, accSnap, budgetSnap] = await Promise.all([
          tripIds.length > 0 ? getDocs(query(collection(db, 'night_buses'), where('__name__', 'in', tripIds))) : Promise.resolve(null),
          accommodationIds.length > 0 ? getDocs(query(collection(db, 'accommodations'), where('__name__', 'in', accommodationIds))) : Promise.resolve(null),
          budgetIds.length > 0 ? getDocs(query(collection(db, 'budgets'), where('__name__', 'in', budgetIds))) : Promise.resolve(null)
        ]);

        setNightBuses(tripsSnap?.docs.map(doc => ({ id: doc.id, ...doc.data() })) || []);
        setAccommodations(accSnap?.docs.map(doc => ({ id: doc.id, ...doc.data() })) || []);
        setBudgets(budgetSnap?.docs.map(doc => ({ id: doc.id, ...doc.data() })) || []);
      } catch (err) {
        setError('データの取得に失敗しました。');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [location.search]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center bg-gray-100 min-h-screen py-8">
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-10 bg-white rounded-2xl shadow p-8">
        <div className="flex items-center -mt-2 -ml-3">
          <img src="/bus.png" alt="logo" className="h-6 w-11 mr-3" />
          <span className="font-bold text-xl mr-8">Live Bus Planner</span>
        </div>
        <div className="flex justify-start mb-8 mt-4">
          <Menubar className="rounded-md shadow-sm px-1 py-0.5 bg-gray-200">
            {TABS.map((tab) => (
              <MenubarMenu key={tab.key}>
                <MenubarTrigger
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "text-sm font-medium px-3 py-1.5 transition-colors rounded-[4px]",
                    activeTab === tab.key
                      ? "bg-gray-700 text-white font-semibold"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-300"
                  )}
                  style={{ borderRadius: '4px' }}
                >
                  {tab.label}
                </MenubarTrigger>
              </MenubarMenu>
            ))}
          </Menubar>
        </div>
        <div className="flex flex-col gap-10 w-full">
          {activeTab === 'nightbus' && nightBuses.map(trip => (
            <ReadOnlyNightBusCard key={trip.id} trip={trip} />
          ))}
          {activeTab === 'accommodation' && accommodations.map(acc => (
            <ReadOnlyAccommodationCard key={acc.id} accommodation={acc} />
          ))}
          {activeTab === 'budget' && budgets.map(budget => (
            <ReadOnlyBudgetCard key={budget.id} budget={budget} />
          ))}
        </div>
      </div>
    </div>
  );
} 