import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doc, updateDoc, addDoc, collection, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

const ItemCard = ({ item, type }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [doneSuccess, setDoneSuccess] = useState(false);
  const [claimState, setClaimState] = useState(null);
  
  const isOwner = currentUser && 
    ((type === 'lost' && item.lostBy?.uid === currentUser.uid) ||
    (type === 'found' && item.foundBy?.uid === currentUser.uid));
  
  // Check if this is a found item that could be claimed
  const isClaimable = currentUser && 
    type === 'found' && 
    item.status === 'found' && 
    item.foundBy?.uid !== currentUser.uid;
    
  // Determine if the current user is the finder or the claimer
  const isItemFounder = currentUser && type === 'found' && item.foundBy?.uid === currentUser.uid;
  const isItemClaimer = currentUser && item.claimedBy?.uid === currentUser.uid;
  
  // Check if the item is in the process of being returned
  useEffect(() => {
    // Only check for claims if the item is a found item and we have a current user
    if (type === 'found' && currentUser && (item.status === 'claimed' || item.status === 'delivered' || item.status === 'received')) {
      const fetchClaimInfo = async () => {
        try {
          // Find associated claim
          if (item.claimId) {
            const claimRef = doc(db, 'item_claims', item.claimId);
            const claimSnap = await getDoc(claimRef);
            if (claimSnap.exists()) {
              setClaimState(claimSnap.data());
            }
          }
        } catch (error) {
          console.error('Error fetching claim information:', error);
        }
      };
      
      fetchClaimInfo();
    }
  }, [currentUser, item, type]);
  
  // Format date in a human-readable way
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleStatusUpdate = async () => {
    if (!isOwner || item.status !== 'searching') return;
    
    try {
      setLoading(true);
      
      // Update the item status in Firestore
      const itemRef = doc(db, type === 'lost' ? 'lost_items' : 'found_items', item.id);
      await updateDoc(itemRef, {
        status: 'found',
        updatedAt: new Date()
      });
      
      // Show success message
      setSuccess(true);
      
      // Update the local item state (this doesn't update the parent component's state)
      item.status = 'found';
    } catch (error) {
      console.error('Error updating item status:', error);
    } finally {
      setLoading(false);
      
      // Hide success message after 3 seconds
      if (success) {
        setTimeout(() => setSuccess(false), 3000);
      }
    }
  };

  const handleClaimItem = async () => {
    if (!currentUser || !isClaimable) return;
    
    try {
      setLoading(true);
      
      // Create a claim request in the database
      const claimRef = await addDoc(collection(db, 'item_claims'), {
        itemId: item.id,
        itemType: 'found',
        itemTitle: item.title,
        claimantId: currentUser.uid,
        claimantEmail: currentUser.email,
        claimantName: currentUser.displayName || '',
        foundByUid: item.foundBy?.uid,
        foundByEmail: item.foundBy?.email,
        status: 'pending',
        message: `I believe this ${item.title} belongs to me. Please contact me to arrange the return.`,
        createdAt: serverTimestamp()
      });
      
      // Show success message
      setClaimSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setClaimSuccess(false), 3000);
    } catch (error) {
      console.error('Error claiming item:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDoneButton = async () => {
    if (!currentUser || !item.id) return;
    
    try {
      setLoading(true);
      
      // Reference to the item document
      const itemRef = doc(db, 'found_items', item.id);
      const itemDoc = await getDoc(itemRef);
      
      if (!itemDoc.exists()) {
        console.error('Item not found');
        return;
      }
      
      const currentData = itemDoc.data();
      
      // Determine the new status based on who's clicking and current status
      let newStatus = currentData.status;
      const updates = {}; 
      
      // If the finder is marking as done and status is 'claimed' or, update to 'delivered'
      if (isItemFounder && currentData.status === 'claimed') {
        newStatus = 'delivered';
        updates.deliveredBy = {
          uid: currentUser.uid,
          email: currentUser.email,
          name: currentUser.displayName || '',
          timestamp: new Date()
        };
      }
      // If the claimer is marking as done and item was already delivered, mark as received
      else if (isItemClaimer && currentData.status === 'delivered') {
        newStatus = 'received';
        updates.receivedBy = {
          uid: currentUser.uid,
          email: currentUser.email,
          name: currentUser.displayName || '',
          timestamp: new Date()
        };
      }
      // If both parties have marked it done, update to returned
      else if (
        (isItemFounder && currentData.status === 'received') || 
        (isItemClaimer && currentData.status === 'delivered' && currentData.deliveredBy) 
      ) {
        newStatus = 'returned';
      }
      
      // Update the item with new status
      await updateDoc(itemRef, {
        ...updates,
        status: newStatus,
        updatedAt: new Date()
      });
      
      // If there's a claim ID, update that too
      if (currentData.claimId) {
        const claimRef = doc(db, 'item_claims', currentData.claimId);
        await updateDoc(claimRef, {
          status: newStatus,
          updatedAt: new Date()
        });
      }
      
      // Show success message
      setDoneSuccess(true);
      
      // Update the local state
      item.status = newStatus;
      if (updates.deliveredBy) item.deliveredBy = updates.deliveredBy;
      if (updates.receivedBy) item.receivedBy = updates.receivedBy;
      
      // Hide success message after 3 seconds
      setTimeout(() => setDoneSuccess(false), 3000);
      
    } catch (error) {
      console.error('Error updating item status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to determine status display text
  const getStatusDisplayText = () => {
    if (type !== 'found') {
      return item.status === 'searching'
        ? 'Still Looking'
        : item.status === 'found'
          ? 'Found'
          : item.status === 'returned'
            ? 'Returned'
            : 'Processing';
    }
    
    switch(item.status) {
      case 'searching': return 'Still Looking';
      case 'found': return 'Found';
      case 'claimed': return 'Claimed';
      case 'delivered': 
        return isItemFounder ? 'Delivered' : 'Awaiting your confirmation';
      case 'received': 
        return isItemClaimer ? 'Received' : 'Awaiting your confirmation';
      case 'returned': return 'Returned';
      default: return 'Processing';
    }
  };

  // Function to check if item is delivered
  const isItemDelivered = () => {
    return item.status === 'delivered' || item.status === 'received' || item.status === 'returned';
  };

  // Function to get the status color
  const getStatusColorClasses = () => {
    switch(item.status) {
      case 'returned': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-purple-100 text-purple-800';
      case 'received': return 'bg-teal-100 text-teal-800';
      case 'found': return 'bg-blue-100 text-blue-800';
      case 'claimed': return 'bg-amber-100 text-amber-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Function to determine if Done button should be shown
  const shouldShowDoneButton = () => {
    // Only show Done button for found items
    if (type !== 'found') return false;
    
    // Only when user is logged in
    if (!currentUser) return false;
    
    // If user is the founder
    if (isItemFounder) {
      return item.status === 'claimed' || item.status === 'received';
    }
    
    // If user is the claimer
    if (isItemClaimer) {
      return item.status === 'delivered';
    }
    
    return false;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col h-full">
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
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-[#82001A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-semibold">{type === 'found' ? 'Found at:' : 'Last seen:'}</span> {item.location}
          </p>
          <p className="flex items-center mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-[#82001A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-semibold">Date:</span> {formatDate(item.date || item.createdAt)}
          </p>
        </div>
        
        {/* Status badge */}
        <div className="mt-3">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColorClasses()}`}>
            {getStatusDisplayText()}
          </span>
        </div>
      </div>

      <div className="p-4 mt-auto border-t border-gray-200">
        <div className="flex items-center justify-between">
          <Link 
            to={`/item/${type}/${item.id}`} 
            className="text-[#82001A] hover:text-[#82001A]/80 text-sm font-medium flex items-center"
          >
            View Details
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
          
          {type === 'lost' && item.reward && (
            <span className="bg-[#82001A]/10 text-[#82001A] text-xs font-semibold px-2 py-1 rounded-full">
              Reward: ${item.reward}
            </span>
          )}
        </div>

        {/* Status update button - only shown to owners of lost items with 'searching' status */}
        {isOwner && type === 'lost' && item.status === 'searching' && (
          <div className="mt-3">
            {success ? (
              <div className="bg-green-100 text-green-800 text-xs p-2 rounded-md text-center">
                Status updated successfully!
              </div>
            ) : (
              <button
                onClick={handleStatusUpdate}
                disabled={loading}
                className="w-full mt-2 py-1.5 px-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#82001A] hover:bg-[#82001A]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#82001A] disabled:opacity-70 flex justify-center items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white mr-2"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  "I Found It!"
                )}
              </button>
            )}
          </div>
        )}
        
        {/* "That's Mine" button - only shown for found items with 'found' status that don't belong to the current user */}
        {isClaimable && currentUser && (
          <div className="mt-3">
            {claimSuccess ? (
              <div className="bg-green-100 text-green-800 text-xs p-2 rounded-md text-center">
                Claim submitted successfully! The finder will contact you.
              </div>
            ) : (
              <button
                onClick={handleClaimItem}
                disabled={loading}
                className="w-full mt-2 py-1.5 px-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 flex justify-center items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white mr-2"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  "That's Mine!"
                )}
              </button>
            )}
          </div>
        )}
        
        {/* "Done" button - shown when an item is being returned */}
        {shouldShowDoneButton() && (
          <div className="mt-3">
            {doneSuccess ? (
              <div className="bg-green-100 text-green-800 text-xs p-2 rounded-md text-center">
                Status updated successfully!
              </div>
            ) : (
              <button
                onClick={handleDoneButton}
                disabled={loading}
                className="w-full mt-2 py-1.5 px-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 flex justify-center items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white mr-2"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  "Done"
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemCard;