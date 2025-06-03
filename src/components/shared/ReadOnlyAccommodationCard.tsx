import React from 'react';
import { Card } from '../ui/card';

interface Accommodation {
  id: string;
  name: string;
  accommodationName: string;
  fromDate: any;
  toDate: any;
  price: number;
  note: string;
  images: string[];
}

interface ReadOnlyAccommodationCardProps {
  accommodation: Accommodation;
}

const ReadOnlyAccommodationCard: React.FC<ReadOnlyAccommodationCardProps> = ({ accommodation }) => {
  return (
    <Card className="p-6 rounded-2xl shadow-md border">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-pink-100 p-2 rounded-lg">
              <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{accommodation.accommodationName || accommodation.name}</h3>
              <p className="text-sm text-gray-500">
                {accommodation.fromDate && accommodation.toDate
                  ? `${new Date(accommodation.fromDate.seconds * 1000).toLocaleDateString()} - ${new Date(accommodation.toDate.seconds * 1000).toLocaleDateString()}`
                  : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-pink-50 rounded-lg p-4">
          <div>
            <p className="text-sm text-gray-500">宿泊料金</p>
            <p className="font-medium">¥{accommodation.price.toLocaleString()}</p>
          </div>
        </div>

        {accommodation.note && (
          <div>
            <p className="text-sm text-gray-500 mb-1">メモ</p>
            <p className="text-sm bg-gray-50 p-3 rounded-lg">{accommodation.note}</p>
          </div>
        )}

        {accommodation.images && accommodation.images.length > 0 && (
          <div>
            <p className="text-sm text-gray-500 mb-2">画像</p>
            <div className="grid grid-cols-4 gap-2">
              {accommodation.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Accommodation image ${index + 1}`}
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

export default ReadOnlyAccommodationCard; 