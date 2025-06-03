import React, { useState, useEffect } from 'react';
import { db, storage, auth } from '../../firebase/config';
import { collection, addDoc, Timestamp, query, where, getDocs, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Calendar } from "../ui/calendar";
import { DateRange } from "react-day-picker";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "../ui/collapsible";
import { ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { useNavigate } from 'react-router-dom';
import { Menubar, MenubarMenu, MenubarTrigger } from "../ui/menubar";
import { cn } from "../../lib/utils";
import { Listbox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';


interface Trip {
  id: string;
  userId: string;
  from: string;
  to: string;
  fromStation: string;
  toStation: string;
  busName: string;
  busPrice: number;
  fromDate: Timestamp | null;
  toDate: Timestamp | null;
  amount: number;
  note: string;
  images: string[];
  createdAt: Timestamp;
  tripName: string;
}

function TestCaption(props: any) {
  const { displayMonth, goToMonth, nextMonth, previousMonth, locale } = props;
  const monthLabel = displayMonth.toLocaleString(locale || 'ja-JP', { month: "long", year: "numeric" });
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      minWidth: 0
    }}>
      <button
        onClick={() => previousMonth && goToMonth(previousMonth)}
        style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}
        aria-label="前の月"
      >
        &lt;
      </button>
      <span style={{ flex: 1, textAlign: 'center', fontWeight: 600, fontSize: 20, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {monthLabel}
      </span>
      <button
        onClick={() => nextMonth && goToMonth(nextMonth)}
        style={{ flex: 1, textAlign: 'right', background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}
        aria-label="次の月"
      >
        &gt;
      </button>
    </div>
  );
}

function ProjectTabs() {
  const [activeTab, setActiveTab] = useState('夜行バス');
  const navigate = useNavigate();
  const tabs = [
    { name: '夜行バス', path: '/nightbus' },
    { name: '宿泊先', path: '/accommodation' },
    { name: '予算管理', path: '/budget' },
    { name: '共有', path: '/share' }
  ];

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

const NightBusForm: React.FC = () => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [fromStation, setFromStation] = useState('');
  const [toStation, setToStation] = useState('');
  const [busName, setBusName] = useState('');
  const [busPrice, setBusPrice] = useState('');
  const [range, setRange] = useState<DateRange | undefined>();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [images, setImages] = useState<FileList | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [savedTrips, setSavedTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // 生成时间选项
  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hour = String(Math.floor(i / 2)).padStart(2, '0');
    const min = i % 2 === 0 ? '00' : '30';
    return `${hour}:${min}`;
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // 验证文件类型
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const invalidFiles = Array.from(files).filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      setError('無効なファイル形式です。JPEG、PNG、GIF、WebPのみ対応しています。');
      setToastMsg('無効なファイル形式です。JPEG、PNG、GIF、WebPのみ対応しています。');
      setToastOpen(true);
      return;
    }

    // 验证文件大小
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = Array.from(files).filter(file => file.size > MAX_FILE_SIZE);
    
    if (oversizedFiles.length > 0) {
      setError('ファイルサイズが大きすぎます。5MB以下のファイルを選択してください。');
      setToastMsg('ファイルサイズが大きすぎます。5MB以下のファイルを選択してください。');
      setToastOpen(true);
      return;
    }

    // 验证总文件数量
    const MAX_FILES = 10;
    if (files.length > MAX_FILES) {
      setError(`一度に${MAX_FILES}枚までしかアップロードできません。`);
      setToastMsg(`一度に${MAX_FILES}枚までしかアップロードできません。`);
      setToastOpen(true);
      return;
    }

    setImages(files);
    const urls = Array.from(files).map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...urls]);
  };

  const handleDeleteImage = (index: number) => {
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    if (images) {
      const newFiles = Array.from(images).filter((_, i) => i !== index);
      const dataTransfer = new DataTransfer();
      newFiles.forEach(file => dataTransfer.items.add(file));
      setImages(dataTransfer.files);
    }
  };

  const handlePreviewImage = (url: string) => {
    setSelectedImage(url);
  };

  const handleClosePreview = () => {
    setSelectedImage(null);
  };

  const handleSkyTicket = () => {
    window.open('https://skyticket.jp/bus/', '_blank');
  };

  useEffect(() => {
    const fetchUserTrips = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const tripsQuery = query(
        collection(db, 'night_buses'),
        where('userId', '==', user.uid)
      );

      const querySnapshot = await getDocs(tripsQuery);
      const trips = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Trip))
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate() || new Date(0);
          const dateB = b.createdAt?.toDate() || new Date(0);
          return dateB.getTime() - dateA.getTime();
        });
      setSavedTrips(trips);
    };

    fetchUserTrips();
  }, []);

  const handleTripSelect = (tripId: string) => {
    setSelectedTrip(tripId);
    if (tripId) {
      const selectedTripData = savedTrips.find(trip => trip.id === tripId);
      if (selectedTripData) {
        setFrom(selectedTripData.from);
        setTo(selectedTripData.to);
        setFromStation(selectedTripData.fromStation);
        setToStation(selectedTripData.toStation);
        setBusName(selectedTripData.busName);
        setBusPrice(selectedTripData.busPrice.toString());
        setAmount(selectedTripData.amount.toString());
        setNote(selectedTripData.note);
        setRange({
          from: selectedTripData.fromDate?.toDate() || undefined,
          to: selectedTripData.toDate?.toDate() || undefined
        });
        setPreviewUrls(selectedTripData.images || []);
      }
    } else {
      setFrom('');
      setTo('');
      setFromStation('');
      setToStation('');
      setBusName('');
      setBusPrice('');
      setAmount('');
      setNote('');
      setRange(undefined);
      setPreviewUrls([]);
    }
  };

  // 删除 Storage 中的图片
  const deleteImageFromStorage = async (imageUrl: string) => {
    try {
      // 从 URL 中提取文件路径
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('图片删除失败:', error);
      throw error;
    }
  };

  // 删除所有图片
  const deleteAllImages = async (imageUrls: string[]) => {
    try {
      const deletePromises = imageUrls.map(url => deleteImageFromStorage(url));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('批量删除图片失败:', error);
      throw error;
    }
  };

  // 添加重试函数
  const retryOperation = async <T,>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> => {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
      }
    }
    throw lastError;
  };

  // 修改图片上传函数
  const uploadImage = async (file: File): Promise<string> => {
    try {
      // 验证文件大小
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`文件 ${file.name} 超过5MB限制`);
      }

      // 验证文件类型
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        throw new Error(`文件 ${file.name} 格式不支持`);
      }

      // 检查用户是否已登录
      const user = auth.currentUser;
      if (!user) {
        throw new Error('ログインが必要です。');
      }

      // 生成文件名
      const timestamp = Date.now();
      const uniqueFileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const storageRef = ref(storage, `nightbus_images/${uniqueFileName}`);

      // 使用重试机制上传文件
      const snapshot = await retryOperation(() => uploadBytes(storageRef, file));
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error: any) {
      console.error(`图片 ${file.name} 上传失败:`, error);
      
      // 处理特定类型的错误
      if (error.code === 'storage/unauthorized') {
        throw new Error('画像のアップロード権限がありません。ログインしてください。');
      } else if (error.code === 'storage/canceled') {
        throw new Error('画像のアップロードがキャンセルされました。');
      } else if (error.code === 'storage/retry-limit-exceeded') {
        throw new Error('画像のアップロードがタイムアウトしました。ネットワーク接続を確認してください。');
      } else {
        throw new Error(`图片 ${file.name} 上传失败: ${error.message}`);
      }
    }
  };

  // 修改 handleSubmit 函数中的错误处理部分
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 检查用户是否已登录
    const user = auth.currentUser;
    if (!user) {
      setError('ログインが必要です。');
      setToastMsg('ログインが必要です。');
      setToastOpen(true);
      return;
    }

    if (!validateForm()) {
      setToastMsg(validationErrors.join('\n'));
      setToastOpen(true);
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');
    
    try {
      let imageUrls: string[] = [];
      
      // 如果是更新操作，先删除旧的图片
      if (selectedTrip) {
        try {
          const tripDoc = await getDocs(query(collection(db, 'night_buses'), where('id', '==', selectedTrip)));
          const oldTripData = tripDoc.docs[0]?.data() as Trip;
          if (oldTripData.images && oldTripData.images.length > 0) {
            await deleteAllImages(oldTripData.images);
          }
        } catch (deleteError: any) {
          console.error('删除旧图片失败:', deleteError);
          if (deleteError.code === 'storage/unauthorized') {
            setError('画像の削除権限がありません。');
          } else {
            setError('古い画像の削除に失敗しました。');
          }
          setToastMsg('古い画像の削除に失敗しました。');
          setToastOpen(true);
          setIsSaving(false);
          return;
        }
      }

      // 上传新图片
      if (images && images.length > 0) {
        try {
          // 显示上传进度
          setToastMsg('画像をアップロード中...');
          setToastOpen(true);

          // 逐个上传图片，避免并发问题
          for (const file of Array.from(images)) {
            try {
              const url = await uploadImage(file);
              imageUrls.push(url);
            } catch (uploadError: any) {
              console.error('单个图片上传失败:', uploadError);
              // 继续上传其他图片，但记录错误
              setError(prev => prev + `\n${uploadError.message}`);
            }
          }

          // 检查是否所有图片都上传成功
          if (imageUrls.length === 0) {
            throw new Error('すべての画像のアップロードに失敗しました。');
          }
        } catch (uploadError: any) {
          console.error('图片上传失败:', uploadError);
          setError('画像のアップロードに失敗しました。');
          setToastMsg('画像のアップロードに失敗しました。');
          setToastOpen(true);
          setIsSaving(false);
          return;
        }
      }

      const tripData = {
        userId: user.uid,
        from,
        to,
        fromStation,
        toStation,
        busName,
        busPrice: Number(busPrice),
        fromDate: range?.from ? Timestamp.fromDate(range.from) : null,
        toDate: range?.to ? Timestamp.fromDate(range.to) : null,
        amount: Number(amount),
        note,
        images: imageUrls,
        createdAt: Timestamp.now(),
        tripName: `${fromStation} → ${toStation} (${range?.from?.toLocaleDateString() || '未定'})`
      };

      try {
        if (selectedTrip) {
          await updateDoc(doc(db, 'night_buses', selectedTrip), tripData);
          setToastMsg('更新成功！');
        } else {
          await addDoc(collection(db, 'night_buses'), tripData);
          setToastMsg('保存成功！');
        }
        
        // 清空表单
        setFrom('');
        setTo('');
        setFromStation('');
        setToStation('');
        setBusName('');
        setBusPrice('');
        setRange(undefined);
        setAmount('');
        setNote('');
        setImages(null);
        setPreviewUrls([]);
        
        // 清除本地存储
        localStorage.removeItem('nightBusFormData');
        
        setToastOpen(true);
      } catch (dbError: any) {
        console.error('数据库保存失败:', dbError);
        setError('データの保存に失敗しました。');
        setToastMsg('データの保存に失敗しました。');
        setToastOpen(true);
      }
    } catch (err: any) {
      console.error('保存失败', err);
      setError('保存に失敗しました。');
      setToastMsg('保存に失敗しました。');
      setToastOpen(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTrip) return;
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // 获取当前行程的图片URL
      const tripDoc = await getDocs(query(collection(db, 'night_buses'), where('id', '==', selectedTrip)));
      const tripData = tripDoc.docs[0]?.data() as Trip;
      
      // 删除图片
      if (tripData.images && tripData.images.length > 0) {
        await deleteAllImages(tripData.images);
      }

      // 删除文档
      await deleteDoc(doc(db, 'night_buses', selectedTrip));
      
      setSavedTrips(prevTrips => prevTrips.filter(trip => trip.id !== selectedTrip));
      setSelectedTrip(null);
      setFrom('');
      setTo('');
      setFromStation('');
      setToStation('');
      setBusName('');
      setBusPrice('');
      setRange(undefined);
      setAmount('');
      setNote('');
      setImages(null);
      setPreviewUrls([]);
      setToastMsg('削除成功！');
      setToastOpen(true);
    } catch (err: any) {
      console.error('删除失败:', err);
      setError('削除に失敗しました。');
      setToastMsg('削除に失敗しました。');
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

  // 验证函数
  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    if (!from || !to || !fromStation || !toStation) {
      errors.push('请填写完整的行程信息');
    }
    
    if (!range?.from) {
      errors.push('请选择出发日期');
    }
    
    if (isNaN(Number(busPrice)) || Number(busPrice) < 0) {
      errors.push('请输入有效的巴士价格');
    }
    
    if (images) {
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      const oversizedFiles = Array.from(images).filter(file => file.size > MAX_FILE_SIZE);
      if (oversizedFiles.length > 0) {
        errors.push('图片大小不能超过5MB');
      }
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  // 保存到 localStorage
  const saveToLocalStorage = () => {
    const formData = {
      from,
      to,
      fromStation,
      toStation,
      busName,
      busPrice,
      range,
      amount,
      note,
      previewUrls
    };
    localStorage.setItem('nightBusFormData', JSON.stringify(formData));
  };

  // 从 localStorage 加载数据
  const loadFromLocalStorage = () => {
    const savedData = localStorage.getItem('nightBusFormData');
    if (savedData) {
      const formData = JSON.parse(savedData);
      setFrom(formData.from || '');
      setTo(formData.to || '');
      setFromStation(formData.fromStation || '');
      setToStation(formData.toStation || '');
      setBusName(formData.busName || '');
      setBusPrice(formData.busPrice || '');
      setRange(formData.range || undefined);
      setAmount(formData.amount || '');
      setNote(formData.note || '');
      setPreviewUrls(formData.previewUrls || []);
    }
  };

  // 在组件加载时加载保存的数据
  useEffect(() => {
    loadFromLocalStorage();
  }, []);

  // 在表单数据变化时保存到 localStorage
  useEffect(() => {
    saveToLocalStorage();
  }, [from, to, fromStation, toStation, busName, busPrice, range, amount, note, previewUrls]);

  // 清理预览URL
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

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
          <label className="block text-base mb-2 font-semibold">保存済みの行程</label>
          <Listbox value={selectedTrip || ''} onChange={handleTripSelect}>
            <div className="relative">
              <Listbox.Button className="relative w-full h-12 bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-left focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base">
                <span className="block truncate">
                  {selectedTrip 
                    ? savedTrips.find(trip => trip.id === selectedTrip)?.tripName 
                    : '新しい行程を作成'}
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
                        active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                      }`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                          新しい行程を作成
                        </span>
                      </>
                    )}
                  </Listbox.Option>
                  {savedTrips.map((trip) => (
                    <Listbox.Option
                      key={trip.id}
                      value={trip.id}
                      className={({ active }) =>
                        `relative cursor-pointer select-none py-2 pl-4 pr-9 ${
                          active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                        }`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                            {(trip.fromDate && trip.toDate) ?
                              (() => {
                                const from = trip.fromDate.toDate ? trip.fromDate.toDate() : new Date(trip.fromDate.seconds * 1000);
                                const to = trip.toDate.toDate ? trip.toDate.toDate() : new Date(trip.toDate.seconds * 1000);
                                return `${from.getFullYear()}/${(from.getMonth()+1).toString().padStart(2,'0')}/${from.getDate().toString().padStart(2,'0')} - ${to.getFullYear()}/${(to.getMonth()+1).toString().padStart(2,'0')}/${to.getDate().toString().padStart(2,'0')} ${trip.fromStation || ''}→${trip.toStation || ''}`;
                              })()
                              : trip.tripName}
                          </span>
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>
          {selectedTrip && (
            <button type="button" onClick={handleDelete} className="mt-2 bg-red-500 hover:bg-red-600 text-white text-xs rounded px-3 py-1">削除</button>
          )}
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-3 gap-3 mx-auto">
            <div className="flex flex-col items-start -ml-2 mt-3">
              <div className="bg-blue-200 rounded-2xl flex flex-col items-center justify-center p-4 w-[320px] h-[260px] mb-9">
                <label className="flex flex-col items-center cursor-pointer w-full h-full justify-center">
                  <span className="text-6xl text-blue-500 mb-2">＋</span>
                  <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                  <span className="text-base text-blue-700">画像アップロード</span>
                </label>
                {previewUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 w-full justify-start">
                    {previewUrls.map((url, idx) => (
                      <div key={idx} className="relative group">
                        <img 
                          src={url} 
                          alt="preview" 
                          className="w-12 h-12 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity" 
                          onClick={() => handlePreviewImage(url)}
                        />
                        <button
                          onClick={() => handleDeleteImage(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" onClick={handleSkyTicket} className="bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-[4px] w-[320px] h-24 text-xl flex flex-col items-center justify-center shadow">
                <span>skyticket</span>
                <span className="text-base mt-1">夜行バス検索</span>
              </button>
            </div>
            <div className="flex flex-col items-start">
              <div className="w-full max-w-[360px] mb-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-base mb-1 font-semibold">出発時間</label>
                    <input type="time" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full h-12 border border-gray-300 rounded-[4px] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base placeholder-gray-400" />
                  </div>
                  <div>
                    <label className="block text-base mb-1 font-semibold">到着時間</label>
                    <input type="time" value={to} onChange={(e) => setTo(e.target.value)} className="w-full h-12 border border-gray-300 rounded-[4px] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base placeholder-gray-400" />
                  </div>
                  <div>
                    <label className="block text-base mb-1 font-semibold">出発地駅名</label>
                    <input type="text" value={fromStation} onChange={(e) => setFromStation(e.target.value)} className="w-full h-12 border border-gray-300 rounded-[4px] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base placeholder-gray-400" placeholder="例：新宿" />
                  </div>
                  <div>
                    <label className="block text-base mb-1 font-semibold">到着地駅名</label>
                    <input type="text" value={toStation} onChange={(e) => setToStation(e.target.value)} className="w-full h-12 border border-gray-300 rounded-[4px] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base placeholder-gray-400" placeholder="例：大阪" />
                  </div>
                </div>
              </div>
              <div className="w-full max-w-[420px] bg-blue-50 rounded-lg p-6 flex flex-col gap-4 shadow min-h-[80px] items-start">
                <div className="w-full">
                  <label className="block text-base mb-1 font-semibold">夜行バス名</label>
                  <input type="text" value={busName} onChange={(e) => setBusName(e.target.value)} className="w-full h-12 border border-gray-300 rounded-[4px] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base placeholder-gray-400" placeholder="例：WILLER EXPRESS" />
                </div>
                <div className="w-full">
                  <label className="block text-base mb-1 font-semibold">夜行バス料金</label>
                  <input type="number" value={busPrice} onChange={(e) => setBusPrice(e.target.value)} className="w-full h-12 border border-gray-300 rounded-[4px] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-base placeholder-gray-400" placeholder="例：4500" />
                </div>
              </div>
            </div>
            <div className="flex flex-col  items-start w-[320px] justify-center ml-10">
              <div className="w-full bg-gray-50 rounded-lg p-6 mb-4 flex items-center justify-center gap-2 border text-sm font-semibold ">
                <span className="text-gray-600"><svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="#2563eb" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10m-9 8h10m-9-4h6m-7 8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6Z"/></svg></span>
                <span className="text-gray-700 text-sm">
                  {range?.from ? range.from.toLocaleDateString() : '----/--/--'}
                  {range?.to ? ` - ${range.to.toLocaleDateString()}` : ''}
                </span>
              </div>
              <div className="bg-white rounded-2xl shadow p-1 mb-6 w-full">
                <DayPicker
                  mode="range"
                  selected={range}
                  onSelect={setRange}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-between mt-6">
            <button 
              type="submit" 
              disabled={isSaving}
              className={`ml-auto text-white font-bold rounded-[4px] w-48 h-14 text-lg shadow -mt-2 ${
                isSaving 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-700 hover:bg-blue-800'
              }`}
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
        {toastOpen && (
          <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded shadow-lg flex items-center animate-fade-in-out ${toastMsg.includes('削除成功') ? 'bg-red-500' : 'bg-green-500'} text-white`}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            <span>{toastMsg}</span>
            <button onClick={() => setToastOpen(false)} className="ml-4 text-white hover:text-gray-200">×</button>
          </div>
        )}
      </div>

      {/* 图片预览模态框 */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleClosePreview}>
          <div className="relative max-w-4xl max-h-[90vh] p-4" onClick={e => e.stopPropagation()}>
            <button
              onClick={handleClosePreview}
              className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-75"
            >
              ×
            </button>
            <img src={selectedImage} alt="preview" className="max-w-full max-h-[80vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};

export default NightBusForm; 