import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, where, getDocs, limit, startAfter } from 'firebase/firestore';
import { db } from '../firebase/config';
import ItemCard from '../components/ItemCard';
import { Link } from 'react-router-dom';

const LostItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [hasReward, setHasReward] = useState(false);

  const categories = [
    'Electronics', 'Books', 'Clothing', 'Accessories', 
    'ID/Cards', 'Keys', 'Bags/Backpacks', 'Other'
  ];

  const locations = [
    'Library', 'Student Center', 'Cafeteria', 'Gym', 
    'Science Building', 'Arts Building', 'Dormitories', 'Parking Lot', 'Other'
  ];

  const fetchItems = async (isInitial = false) => {
    try {
      setError('');
      setLoading(true);
      
      // Start with the base query
      let itemsQuery = query(
        collection(db, 'lost_items'),
        orderBy('createdAt', 'desc'),
        limit(12)
      );
      
      // Apply filters if they exist
      if (selectedCategory) {
        itemsQuery = query(
          collection(db, 'lost_items'),
          where('category', '==', selectedCategory),
          orderBy('createdAt', 'desc'),
          limit(12)
        );
      }
      
      if (selectedLocation) {
        itemsQuery = query(
          collection(db, 'lost_items'),
          where('location', '==', selectedLocation),
          orderBy('createdAt', 'desc'),
          limit(12)
        );
      }
      
      // If not initial load and we have a last document, start after it
      if (!isInitial && lastVisible) {
        itemsQuery = query(
          itemsQuery,
          startAfter(lastVisible)
        );
      }

      const snapshot = await getDocs(itemsQuery);
      
      // Check if we have more items to load
      setHasMore(!snapshot.empty && snapshot.docs.length === 12);
      
      // Set the last visible document for pagination
      if (!snapshot.empty) {
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      } else {
        setLastVisible(null);
      }
      
      // Process the data and update state
      let loadedItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter by search query if it exists (client-side filtering)
      if (searchQuery) {
        loadedItems = loadedItems.filter(item => 
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Filter by date if it exists (client-side filtering)
      if (fromDate) {
        const startDate = new Date(fromDate);
        startDate.setHours(0, 0, 0, 0); // Set to beginning of day
        
        loadedItems = loadedItems.filter(item => {
          const itemDate = new Date(item.date);
          return itemDate >= startDate;
        });
      }
      
      // Filter by reward if selected
      if (hasReward) {
        loadedItems = loadedItems.filter(item => item.reward && item.reward > 0);
      }
      
      // Update state based on initial load or load more
      if (isInitial) {
        setItems(loadedItems);
      } else {
        setItems(prevItems => [...prevItems, ...loadedItems]);
      }
    } catch (error) {
      console.error('Error fetching lost items:', error);
      setError('Failed to load lost items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load of items
  useEffect(() => {
    fetchItems(true);
  }, [selectedCategory, selectedLocation, searchQuery, fromDate, hasReward]);

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchItems();
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedLocation('');
    setFromDate('');
    setHasReward(false);
  };

  // Circular loading indicator
  const CircularLoading = () => (
    <div className="flex justify-center items-center">
      <div className="relative h-10 w-10">
        <svg className="animate-spin h-full w-full" viewBox="0 0 44 44">
          <circle
            className="text-gray-200"
            strokeWidth="4"
            stroke="currentColor"
            fill="transparent"
            r="20"
            cx="22"
            cy="22"
          />
          <circle
            className="text-[#82001A]"
            strokeWidth="4"
            strokeDasharray={126}
            strokeDashoffset={126 * 0.75}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="20"
            cx="22"
            cy="22"
            transform="rotate(-90 22 22)"
          />
        </svg>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">Lost Items</h1>
        <Link
          to="/report/lost"
          className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#82001A] hover:bg-[#82001A]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#82001A]"
        >
          Report Lost Item
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-md rounded-lg p-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Search
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type="text"
                id="search"
                className="block w-full pr-10 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#82001A] focus:border-[#82001A] sm:text-sm"
                placeholder="Search by title or description"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              id="category"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#82001A] focus:border-[#82001A] sm:text-sm"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Last Seen Location
            </label>
            <select
              id="location"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#82001A] focus:border-[#82001A] sm:text-sm"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              <option value="">All Locations</option>
              {locations.map((location) => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="date-from" className="block text-sm font-medium text-gray-700">
              From Date
            </label>
            <input
              type="date"
              id="date-from"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#82001A] focus:border-[#82001A] sm:text-sm"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>
        
        <div className="flex flex-wrap items-center mt-4">
          <div className="flex items-center mr-6">
            <input
              id="has-reward"
              type="checkbox"
              className="h-4 w-4 text-[#82001A] focus:ring-[#82001A] border-gray-300 rounded"
              checked={hasReward}
              onChange={(e) => setHasReward(e.target.checked)}
            />
            <label htmlFor="has-reward" className="ml-2 block text-sm text-gray-700">
              Has reward only
            </label>
          </div>
          
          <button
            onClick={handleResetFilters}
            className="md:ml-auto mt-2 md:mt-0 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#82001A] flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset Filters
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <CircularLoading />
        </div>
      ) : (
        <>
          {items.length === 0 ? (
            <div className="bg-white shadow-md rounded-lg p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 text-lg mt-4">No lost items to display.</p>
              <p className="text-gray-500 mt-2">Try adjusting your filters or check back later.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {items.map((item) => (
                  <ItemCard key={item.id} item={item} type="lost" />
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="px-6 py-2 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-[#82001A] hover:bg-[#82001A]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#82001A] disabled:opacity-70 disabled:cursor-not-allowed flex items-center"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        <span>Loading...</span>
                      </>
                    ) : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default LostItems;