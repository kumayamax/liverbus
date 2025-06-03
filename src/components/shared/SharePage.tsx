import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Copy } from 'lucide-react';
import { Menubar, MenubarMenu, MenubarTrigger } from "../ui/menubar";
import { cn } from '../../lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { db, auth, functions } from '../../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

function getInitial(name: string) {
  return name.split(' ').map(s => s[0]).join('').toUpperCase();
}

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

export default function SharePage() {
  const [accessList, setAccessList] = useState([
    { name: 'Olivia Martin', email: 'm@example.com', access: 'edit' },
    { name: 'Isabella Nguyen', email: 'b@example.com', access: 'view' },
    { name: 'Sofia Davis', email: 'p@example.com', access: 'view' },
  ]);
  const [copied, setCopied] = useState(false);

  const [trips, setTrips] = useState<any[]>([]);
  const [accommodations, setAccommodations] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [selectedTrips, setSelectedTrips] = useState<string[]>([]);
  const [selectedAccommodations, setSelectedAccommodations] = useState<string[]>([]);
  const [selectedBudgets, setSelectedBudgets] = useState<string[]>([]);

  const [shareUrl, setShareUrl] = useState('');

  const [emailToSend, setEmailToSend] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSendResult, setEmailSendResult] = useState<{success: boolean, message: string} | null>(null);

  const sendShareEmail = httpsCallable(functions, 'sendShareEmail');

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const tripsQuery = query(collection(db, 'night_buses'), where('userId', '==', user.uid));
      const tripsSnap = await getDocs(tripsQuery);
      setTrips(tripsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      const accQuery = query(collection(db, 'accommodations'), where('userId', '==', user.uid));
      const accSnap = await getDocs(accQuery);
      setAccommodations(accSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      const budgetQuery = query(collection(db, 'budgets'), where('userId', '==', user.uid));
      const budgetSnap = await getDocs(budgetQuery);
      setBudgets(budgetSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedTrips.length > 0) params.append('trips', selectedTrips.join(','));
    if (selectedAccommodations.length > 0) params.append('accommodations', selectedAccommodations.join(','));
    if (selectedBudgets.length > 0) params.append('budgets', selectedBudgets.join(','));
    setShareUrl(`${window.location.origin}/shared?${params.toString()}`);
  }, [selectedTrips, selectedAccommodations, selectedBudgets]);

  const handleTripCheck = (id: string) => {
    setSelectedTrips(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  const handleAccCheck = (id: string) => {
    setSelectedAccommodations(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  const handleBudgetCheck = (id: string) => {
    setSelectedBudgets(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleAccessChange = (index: number, newAccess: string) => {
    const updated = [...accessList];
    updated[index].access = newAccess;
    setAccessList(updated);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSendEmail = async () => {
    if (!emailToSend) return;
    setSendingEmail(true);
    setEmailSendResult(null);
    try {
      await sendShareEmail({ email: emailToSend, link: shareUrl });
      setEmailSendResult({ success: true, message: 'リンクを送信しました！' });
      setEmailToSend('');
    } catch (e) {
      setEmailSendResult({ success: false, message: '送信に失敗しました。' });
    } finally {
      setSendingEmail(false);
    }
  };

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="p-5 rounded-2xl shadow-md border">
            <div className="font-bold text-lg mb-3 text-blue-500">夜行バス</div>
            <div className="flex flex-col gap-2">
              {trips.length === 0 && <div className="text-gray-400 text-center py-6">データなし</div>}
              {trips.map(trip => (
                <label
                  key={trip.id}
                  className={cn(
                    "flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer transition",
                    selectedTrips.includes(trip.id)
                      ? "bg-blue-50"
                      : "hover:bg-blue-50"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedTrips.includes(trip.id)}
                    onChange={() => handleTripCheck(trip.id)}
                    className="w-5 h-5 accent-blue-500"
                  />
                  <div>
                    <div className="font-semibold">{trip.tripName || `${trip.fromStation || ''}→${trip.toStation || ''}`}</div>
                    <div className="text-xs text-gray-500">
                      {trip.fromDate && trip.toDate
                        ? `${new Date(trip.fromDate.seconds * 1000).toLocaleDateString()} - ${new Date(trip.toDate.seconds * 1000).toLocaleDateString()}`
                        : ''}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </Card>
          <Card className="p-5 rounded-2xl shadow-md border">
            <div className="font-bold text-lg mb-3 text-pink-500">宿泊先</div>
            <div className="flex flex-col gap-2">
              {accommodations.length === 0 && <div className="text-gray-400 text-center py-6">データなし</div>}
              {accommodations.map(acc => (
                <label
                  key={acc.id}
                  className={cn(
                    "flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer transition",
                    selectedAccommodations.includes(acc.id)
                      ? "bg-pink-50"
                      : "hover:bg-pink-50"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedAccommodations.includes(acc.id)}
                    onChange={() => handleAccCheck(acc.id)}
                    className="w-5 h-5 accent-pink-500"
                  />
                  <div>
                    <div className="font-semibold">{acc.accommodationName || acc.name}</div>
                    <div className="text-xs text-gray-500">
                      {acc.fromDate && acc.toDate
                        ? `${new Date(acc.fromDate.seconds * 1000).toLocaleDateString()} - ${new Date(acc.toDate.seconds * 1000).toLocaleDateString()}`
                        : ''}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </Card>
          <Card className="p-5 rounded-2xl shadow-md border">
            <div className="font-bold text-lg mb-3 text-green-600">予算管理</div>
            <div className="flex flex-col gap-2">
              {budgets.length === 0 && <div className="text-gray-400 text-center py-6">データなし</div>}
              {budgets.map(budget => (
                <label
                  key={budget.id}
                  className={cn(
                    "flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer transition",
                    selectedBudgets.includes(budget.id)
                      ? "bg-green-50"
                      : "hover:bg-green-50"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedBudgets.includes(budget.id)}
                    onChange={() => handleBudgetCheck(budget.id)}
                    className="w-5 h-5 accent-green-600"
                  />
                  <div>
                    <div className="font-semibold">{budget.fromDate ? `予算(${new Date(budget.fromDate.seconds * 1000).toLocaleDateString()})` : '無題の予算'}</div>
                  </div>
                </label>
              ))}
            </div>
          </Card>
        </div>
        <Card className="w-full max-w-6xl mx-auto p-8 rounded-2xl shadow-lg space-y-7 mt-10 -mt-5">
          <div className="flex flex-col md:flex-row gap-12">
            <div className="flex-1 flex flex-col gap-4 justify-center">
              <h2 className="text-xl font-semibold">共有リンクを作成</h2>
              <p className="text-sm text-muted-foreground">このリンクを知っている人は誰でも閲覧できます。</p>
              <div className="flex gap-3">
                <Input value={shareUrl} readOnly className="rounded-xl shadow-sm h-12 text-base flex-1" />
                <Button
                  onClick={copyToClipboard}
                  className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  {copied ? 'コピー済み！' : 'リンクをコピー'}
                </Button>
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-4 justify-center">
              <h3 className="text-xl font-semibold">メールで共有</h3>
              <p className="text-sm text-muted-foreground">指定したメールアドレスに共有リンクを送信します。</p>
              <div className="flex gap-3">
                <Input
                  type="email"
                  className="rounded-xl shadow-sm h-12 text-base flex-1"
                  placeholder="メールアドレスを入力"
                  value={emailToSend}
                  onChange={e => setEmailToSend(e.target.value)}
                />
                <Button
                  type="button"
                  onClick={handleSendEmail}
                  className="bg-pink-600 hover:bg-pink-700 text-white font-bold h-12 px-6 rounded-xl"
                  disabled={sendingEmail || !emailToSend}
                >
                  {sendingEmail ? '送信中...' : '送信'}
                </Button>
              </div>
              {emailSendResult && (
                <div className={`mt-2 text-sm ${emailSendResult.success ? 'text-green-600' : 'text-red-600'}`}>{emailSendResult.message}</div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 