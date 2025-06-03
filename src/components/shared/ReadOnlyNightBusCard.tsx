import React from 'react';
import { Card } from '../ui/card';

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
  return (
    <Card className="p-6 rounded-2xl shadow-md border">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{trip.tripName || `${trip.fromStation || ''}→${trip.toStation || ''}`}</h3>
              <p className="text-sm text-gray-500">
                {trip.fromDate && trip.toDate
                  ? `${new Date(trip.fromDate.seconds * 1000).toLocaleDateString()} - ${new Date(trip.toDate.seconds * 1000).toLocaleDateString()}`
                  : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">出発時間</p>
            <p className="font-medium">{trip.from}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">到着時間</p>
            <p className="font-medium">{trip.to}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">出発地駅名</p>
            <p className="font-medium">{trip.fromStation}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">到着地駅名</p>
            <p className="font-medium">{trip.toStation}</p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">夜行バス名</p>
              <p className="font-medium">{trip.busName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">夜行バス料金</p>
              <p className="font-medium">¥{trip.busPrice.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {trip.note && (
          <div>
            <p className="text-sm text-gray-500 mb-1">メモ</p>
            <p className="text-sm bg-gray-50 p-3 rounded-lg">{trip.note}</p>
          </div>
        )}

        {trip.images && trip.images.length > 0 && (
          <div>
            <p className="text-sm text-gray-500 mb-2">画像</p>
            <div className="grid grid-cols-4 gap-2">
              {trip.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Trip image ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ReadOnlyNightBusCard; 