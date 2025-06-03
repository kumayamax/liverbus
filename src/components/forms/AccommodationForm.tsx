import React, { useState, useEffect } from 'react';
import { db, storage, auth } from '../../firebase/config';
import { collection, addDoc, Timestamp, query, where, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { DayPicker } from "react-day-picker";
import { DateRange } from "react-day-picker";
import { useNavigate } from 'react-router-dom';
import { Calendar } from '../ui/calendar';
import { cn } from '../../lib/utils';
import { Menubar, MenubarMenu, MenubarTrigger } from "../ui/menubar";
import { Listbox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/20/solid';

interface Accommodation {
  id: string;
  userId: string;
  name: string;
  address: string;
  checkIn: string;
  checkOut: string;
  price: number;
  fromDate: Timestamp | null;
  toDate: Timestamp | null;
  note: string;
  images: string[];
  createdAt: Timestamp;
  accommodationName: string;
}

function ProjectTabs() {
  const [activeTab, setActiveTab] = useState('宿泊先');
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

// 重试机制
const retryOperation = async <T,>(operation: () => Promise<T>, maxRetries: number = 3, delay: number = 1000): Promise<T> => {
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

// 上传单张图片
const uploadImage = async (file: File): Promise<string> => {
  try {
    // 验证文件大小
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
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
    // 生成唯一文件名
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const storageRef = ref(storage, `accommodation_images/${uniqueFileName}`);
    // 上传
    const snapshot = await retryOperation(() => uploadBytes(storageRef, file));
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error: any) {
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

// 删除 Storage 中的图片
const deleteImageFromStorage = async (imageUrl: string) => {
  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('图片删除失败:', error);
    throw error;
  }
};

// 批量删除
const deleteAllImages = async (imageUrls: string[]) => {
  try {
    const deletePromises = imageUrls.map(url => deleteImageFromStorage(url));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('批量删除图片失败:', error);
    throw error;
  }
};

const AccommodationForm: React.FC = () => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [price, setPrice] = useState('');
  const [range, setRange] = useState<DateRange | undefined>();
  const [note, setNote] = useState('');
  const [images, setImages] = useState<FileList | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [savedAccommodations, setSavedAccommodations] = useState<Accommodation[]>([]);
  const [selectedAccommodation, setSelectedAccommodation] = useState<string | null>(null);
  const [isNoteExpanded, setIsNoteExpanded] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    // 验证类型
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const invalidFiles = Array.from(files).filter(file => !validTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      setError('無効なファイル形式です。JPEG、PNG、GIF、WebPのみ対応しています。');
      setToastMsg('無効なファイル形式です。JPEG、PNG、GIF、WebPのみ対応しています。');
      setToastOpen(true);
      return;
    }
    // 验证大小
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const oversizedFiles = Array.from(files).filter(file => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      setError('ファイルサイズが大きすぎます。5MB以下のファイルを選択してください。');
      setToastMsg('ファイルサイズが大きすぎます。5MB以下のファイルを選択してください。');
      setToastOpen(true);
      return;
    }
    // 验证数量
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

  useEffect(() => {
    const fetchUserAccommodations = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const accommodationsQuery = query(
        collection(db, 'accommodations'),
        where('userId', '==', user.uid)
      );

      const querySnapshot = await getDocs(accommodationsQuery);
      const accommodations = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Accommodation))
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate() || new Date(0);
          const dateB = b.createdAt?.toDate() || new Date(0);
          return dateB.getTime() - dateA.getTime();
        });
      setSavedAccommodations(accommodations);
    };

    fetchUserAccommodations();
  }, []);

  const handleAccommodationSelect = (accommodationId: string) => {
    setSelectedAccommodation(accommodationId);
    if (accommodationId) {
      const selectedAccommodationData = savedAccommodations.find(acc => acc.id === accommodationId);
      if (selectedAccommodationData) {
        setName(selectedAccommodationData.name);
        setAddress(selectedAccommodationData.address);
        setCheckIn(selectedAccommodationData.checkIn);
        setCheckOut(selectedAccommodationData.checkOut);
        setPrice(selectedAccommodationData.price.toString());
        setNote(selectedAccommodationData.note);
        setRange({
          from: selectedAccommodationData.fromDate?.toDate() || undefined,
          to: selectedAccommodationData.toDate?.toDate() || undefined
        });
        setPreviewUrls(selectedAccommodationData.images || []);
      }
    } else {
      setName('');
      setAddress('');
      setCheckIn('');
      setCheckOut('');
      setPrice('');
      setNote('');
      setRange(undefined);
      setPreviewUrls([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      let imageUrls: string[] = [];
      if (images && images.length > 0) {
        const uploadPromises = Array.from(images).map(async (file) => {
          const uploadURL = await uploadImage(file);
          return uploadURL;
        });
        imageUrls = await Promise.all(uploadPromises);
      }

      const user = auth.currentUser;
      if (!user) {
        setError('ログインが必要です。');
        return;
      }

      const accommodationData = {
        userId: user.uid,
        name,
        address,
        checkIn,
        checkOut,
        price: Number(price),
        fromDate: range?.from ? Timestamp.fromDate(range.from) : null,
        toDate: range?.to ? Timestamp.fromDate(range.to) : null,
        note,
        images: imageUrls,
        createdAt: Timestamp.now(),
        accommodationName: `${name} (${range?.from?.toLocaleDateString() || '未定'})`
      };

      if (selectedAccommodation) {
        await updateDoc(doc(db, 'accommodations', selectedAccommodation), accommodationData);
        setToastMsg('更新成功！');
        setToastOpen(true);
      } else {
        await addDoc(collection(db, 'accommodations'), accommodationData);
        setToastMsg('保存成功！');
        setToastOpen(true);
      }
      setName('');
      setAddress('');
      setCheckIn('');
      setCheckOut('');
      setPrice('');
      setRange(undefined);
      setNote('');
      setImages(null);
      setPreviewUrls([]);
    } catch (err: any) {
      setError('保存に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAccommodation) return;
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      // 获取当前住宿的图片URL
      const accDoc = await getDocs(query(collection(db, 'accommodations'), where('id', '==', selectedAccommodation)));
      const accData = accDoc.docs[0]?.data() as Accommodation;
      // 删除图片
      if (accData.images && accData.images.length > 0) {
        await deleteAllImages(accData.images);
      }
      // 删除文档
      await deleteDoc(doc(db, 'accommodations', selectedAccommodation));
      setSavedAccommodations(prev => prev.filter(acc => acc.id !== selectedAccommodation));
      setSelectedAccommodation(null);
      setName('');
      setAddress('');
      setCheckIn('');
      setCheckOut('');
      setPrice('');
      setRange(undefined);
      setNote('');
      setImages(null);
      setPreviewUrls([]);
      setToastMsg('削除成功！');
      setToastOpen(true);
    } catch (err: any) {
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

  const handleAirbnb = () => {
    window.open('https://www.airbnb.jp/', '_blank');
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
        <div className="w-full mb-4 -mt-2">
          <label className="block text-base mb-2 font-semibold">保存済みの宿泊先</label>
          <Listbox value={selectedAccommodation || ''} onChange={handleAccommodationSelect}>
            <div className="relative">
              <Listbox.Button className="relative w-full h-12 bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-left focus:outline-none focus:ring-2 focus:ring-pink-400 transition text-base">
                <span className="block truncate">
                  {selectedAccommodation 
                    ? savedAccommodations.find(acc => acc.id === selectedAccommodation)?.accommodationName 
                    : '新しい宿泊先を作成'}
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
                        active ? 'bg-pink-100 text-pink-900' : 'text-gray-900'
                      }`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                          新しい宿泊先を作成
                        </span>
                      </>
                    )}
                  </Listbox.Option>
                  {savedAccommodations.map((accommodation) => (
                    <Listbox.Option
                      key={accommodation.id}
                      value={accommodation.id}
                      className={({ active }) =>
                        `relative cursor-pointer select-none py-2 pl-4 pr-9 ${
                          active ? 'bg-pink-100 text-pink-900' : 'text-gray-900'
                        }`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                            {(accommodation.fromDate && accommodation.toDate) ?
                              (() => {
                                const from = accommodation.fromDate.toDate ? accommodation.fromDate.toDate() : new Date(accommodation.fromDate.seconds * 1000);
                                const to = accommodation.toDate.toDate ? accommodation.toDate.toDate() : new Date(accommodation.toDate.seconds * 1000);
                                return `${from.getFullYear()}/${(from.getMonth()+1).toString().padStart(2,'0')}/${from.getDate().toString().padStart(2,'0')} - ${to.getFullYear()}/${(to.getMonth()+1).toString().padStart(2,'0')}/${to.getDate().toString().padStart(2,'0')} ${accommodation.name || ''}`;
                              })()
                              : accommodation.accommodationName}
                          </span>
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>
          {selectedAccommodation && (
            <button type="button" onClick={handleDelete} className="mt-2 bg-red-500 hover:bg-red-600 text-white text-xs rounded px-3 py-1">削除</button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3 mx-auto">
          <div className="flex flex-col items-start -ml-2 mt-3">
            <div className="bg-pink-100 rounded-2xl flex flex-col items-center justify-center p-4 w-[320px] h-[260px] mb-9">
              <label className="flex flex-col items-center cursor-pointer w-full h-full justify-center">
                <span className="text-6xl text-pink-500 mb-2">＋</span>
                <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                <span className="text-base text-pink-700">画像アップロード</span>
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
            <button 
              type="button" 
              onClick={handleAirbnb} 
              className="bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 text-white font-bold rounded-[4px] w-[320px] h-24 text-xl flex flex-col items-center justify-center shadow"
            >
              <span>Airbnb</span>
              <span className="text-base mt-1">宿泊先検索</span>
            </button>
          </div>

          <div className="flex flex-col items-start">
            <div className="w-full max-w-[360px] mb-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-base mb-1 font-semibold">チェックイン時間</label>
                  <input type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="w-full h-12 border border-gray-300 rounded-[4px] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400 transition text-base placeholder-gray-400" />
                </div>
                <div>
                  <label className="block text-base mb-1 font-semibold">チェックアウト時間</label>
                  <input type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="w-full h-12 border border-gray-300 rounded-[4px] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400 transition text-base placeholder-gray-400" />
                </div>
                <div>
                  <label className="block text-base mb-1 font-semibold">宿泊施設名</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full h-12 border border-gray-300 rounded-[4px] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400 transition text-base placeholder-gray-400" placeholder="例：ホテル〇〇" />
                </div>
                <div>
                  <label className="block text-base mb-1 font-semibold">住所</label>
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full h-12 border border-gray-300 rounded-[4px] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400 transition text-base placeholder-gray-400" placeholder="例：東京都渋谷区..." />
                </div>
              </div>
            </div>
            <div className="w-full max-w-[420px] bg-pink-50 rounded-lg p-6 flex flex-col gap-4 shadow min-h-[80px] items-start">
              <div className="w-full">
                <label className="block text-base mb-1 font-semibold">宿泊料金</label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full h-12 border border-gray-300 rounded-[4px] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400 transition text-base placeholder-gray-400" placeholder="例：8000" />
              </div>
              <div className="w-full">
                <label className="block text-base mb-1 font-semibold">メモ</label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} onClick={() => setIsNoteExpanded(true)} onBlur={() => { if (!note) setIsNoteExpanded(false); }} onMouseUp={() => { if (!note) setIsNoteExpanded(false); }} className={`w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all duration-200 text-base placeholder-gray-400 resize-none ${isNoteExpanded ? 'h-24' : 'h-12'}`} placeholder="特記事項があれば入力してください" />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start w-[320px] justify-center ml-10">
            <div className="w-full bg-gray-50 rounded-lg p-6 mb-4 flex items-center justify-center gap-2 border text-sm font-semibold">
              <span className="text-gray-600">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path stroke="#FF5A5F" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10m-9 8h10m-9-4h6m-7 8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6Z"/>
                </svg>
              </span>
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
            form="accommodation-form" 
            className="ml-auto bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 text-white font-bold rounded-[4px] w-48 h-14 text-lg shadow -mt-6"
          >
            保存
          </button>
        </div>
        <form id="accommodation-form" className="hidden" onSubmit={handleSubmit}></form>
        {toastOpen && (
          <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded shadow-lg flex items-center animate-fade-in-out ${toastMsg.includes('削除成功') ? 'bg-red-500' : (toastMsg.includes('失敗') || error) ? 'bg-red-500' : 'bg-green-500'} text-white`}>
            {(toastMsg.includes('失敗') || error) ? (
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            )}
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

export default AccommodationForm; 