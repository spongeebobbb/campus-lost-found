import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, where, getDocs, limit, startAfter, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import ItemCard from '../components/ItemCard';
import { Link } from 'react-router-dom';

const FoundItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const categories = [
    'Electronics', 'Books', 'Clothing', 'Accessories', 
    'ID/Cards', 'Keys', 'Bags/Backpacks', 'Other'
  ];

  const locations = [
    'Library', 'Student Center', 'Cafeteria', 'Gym', 
    'Science Building', 'Arts Building', 'Dormitories', 'Parking Lot', 'Other'
  ];

  // Process found items to automatically conclude items in processing state
  const processFoundItems = async (itemsData) => {
    const currentDate = new Date();
    const processedItems = [...itemsData];
    const itemsToUpdate = [];

    for (let i = 0; i < processedItems.length; i++) {
      const item = processedItems[i];
      
      // If the item is in 'processing' state and was created more than 2 days ago
      if (!item.status || item.status === 'processing') {
        const createdAt = item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
        const daysSinceCreation = Math.floor((currentDate - createdAt) / (1000 * 60 * 60 * 24));
        
        // If it's been more than 2 days since creation, update the status to 'found'
        if (daysSinceCreation >= 2) {
          processedItems[i].status = 'found';
          itemsToUpdate.push({
            id: item.id,
            status: 'found'
          });
        }
      }
    }

    // Update the items in Firestore
    const updatePromises = itemsToUpdate.map(item => {
      const itemRef = doc(db, 'found_items', item.id);
      return updateDoc(itemRef, { 
        status: item.status,
        updatedAt: new Date()
      });
    });

    // Wait for all updates to complete
    if (updatePromises.length > 0) {
      try {
        await Promise.all(updatePromises);
        console.log(`${updatePromises.length} items have been updated from 'processing' to 'found'`);
      } catch (error) {
        console.error('Error updating item statuses:', error);
      }
    }

    return processedItems;
  };

  const fetchItems = async (isInitial = false) => {
    try {
      setError('');
      setLoading(true);
      
      // Start with the base query
      let itemsQuery = query(
        collection(db, 'found_items'),
        orderBy('createdAt', 'desc'),
        limit(12)
      );
      
      // Apply filters if they exist
      if (selectedCategory) {
        itemsQuery = query(
          collection(db, 'found_items'),
          where('category', '==', selectedCategory),
          orderBy('createdAt', 'desc'),
          limit(12)
        );
      }
      
      if (selectedLocation) {
        itemsQuery = query(
          collection(db, 'found_items'),
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
      }
      
      // Process the data and update state
      const loadedItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Process found items to update status if needed
      const processedItems = await processFoundItems(loadedItems);
      
      // Filter by search query if it exists (client-side filtering)
      const filteredItems = searchQuery 
        ? processedItems.filter(item => 
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : processedItems;
      
      // Filter by date range if it exists (client-side filtering)
      const dateFilteredItems = filteredItems.filter(item => {
        if (!dateRange.start && !dateRange.end) return true;
        
        const itemDate = new Date(item.date);
        const startDate = dateRange.start ? new Date(dateRange.start) : null;
        const endDate = dateRange.end ? new Date(dateRange.end) : null;
        
        if (startDate && endDate) {
          return itemDate >= startDate && itemDate <= endDate;
        } else if (startDate) {
          return itemDate >= startDate;
        } else if (endDate) {
          return itemDate <= endDate;
        }
        
        return true;
      });
      
      // Update state based on initial load or load more
      if (isInitial) {
        setItems(dateFilteredItems);
      } else {
        setItems(prevItems => [...prevItems, ...dateFilteredItems]);
      }
    } catch (error) {
      console.error('Error fetching found items:', error);
      setError('Failed to load found items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load of items
  useEffect(() => {
    fetchItems(true);
  }, [selectedCategory, selectedLocation, searchQuery, dateRange]);

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchItems();
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedLocation('');
    setDateRange({ start: '', end: '' });
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">Found Items</h1>
        <Link
          to="/report/found"
          className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Report Found Item
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-md rounded-lg p-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Search
            </label>
            <input
              type="text"
              id="search"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search by title or description"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              id="category"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
              Location
            </label>
            <select
              id="location"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              <option value="">All Locations</option>
              {locations.map((location) => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="date-from" className="block text-sm font-medium text-gray-700">
                From
              </label>
              <input
                type="date"
                id="date-from"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="date-to" className="block text-sm font-medium text-gray-700">
                To
              </label>
              <input
                type="date"
                id="date-to"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end mt-4">
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {items.length === 0 ? (
            <div className="bg-white shadow-md rounded-lg p-8 text-center">
              <p className="text-gray-500 text-lg">No found items to display.</p>
              <p className="text-gray-500 mt-2">Try adjusting your filters or check back later.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {items.map((item) => (
                  <ItemCard key={item.id} item={item} type="found" />
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="px-6 py-2 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {loading ? 'Loading...' : 'Load More'}
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

export default FoundItems;