import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ItemCard = ({ item, type }) => {
  const date = new Date(item.date || item.createdAt).toLocaleDateString();
  const [imageError, setImageError] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-xl hover:-translate-y-1">
      <div className="relative h-52">
        {(item.imageURL && !imageError) ? (
          <img 
            src={item.imageURL} 
            alt={item.title} 
            className="h-52 w-full object-cover transition-transform duration-500 hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute h-52 w-full bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500 mt-1">No image</p>
            </div>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 text-xs font-bold rounded-full ${
            type === 'found' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {type === 'found' ? 'Found' : 'Lost'}
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-800 line-clamp-1">{item.title}</h3>
        </div>
        
        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{item.description}</p>
        
        <div className="mt-3 text-xs text-gray-500">
          <p className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-#82001A" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-semibold">{type === 'found' ? 'Found at:' : 'Last seen:'}</span> {item.location}
          </p>
          <p className="flex items-center mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-#82001A" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-semibold">Date:</span> {date}
          </p>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <Link 
            to={`/item/${type}/${item.id}`} 
            className="text-#82001A hover:text-#82001A/80 text-sm font-medium flex items-center"
          >
            View Details
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
          
          {type === 'lost' && item.reward && (
            <span className="bg-#82001A/10 text-#82001A text-xs font-semibold px-2 py-1 rounded-full">
              Reward: ${item.reward}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemCard;