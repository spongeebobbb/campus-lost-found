import React, { useState, useEffect, useCallback, Component } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, serverTimestamp, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

// Class-based ContactFormModal component to fix focus issues
class ContactFormModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      message: props.initialMessage || '',
    };
  }

  handleMessageChange = (e) => {
    this.setState({ message: e.target.value });
  };

  handleSubmit = (e) => {
    e.preventDefault();
    this.props.onSubmit(this.state.message);
  };

  render() {
    const { type, closeModal, sendingRequest } = this.props;
    const { message } = this.state;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-lg w-full mx-auto shadow-xl">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Contact About This Item</h3>
              <button 
                className="text-gray-400 hover:text-gray-500" 
                onClick={closeModal}
              >
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={this.handleSubmit}>
              <div className="mb-4">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  required
                  value={message}
                  onChange={this.handleMessageChange}
                  placeholder={`Explain why you believe this ${type === 'lost' ? 'lost' : 'found'} item is yours or provide additional details...`}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#82001A] focus:border-[#82001A] sm:text-sm"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Your contact information will be shared with the {type === 'lost' ? 'person who reported this item as lost' : 'finder'} when they approve your request.
                </p>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingRequest}
                  className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#82001A] hover:bg-[#82001A]/90 focus:outline-none disabled:opacity-70"
                >
                  {sendingRequest ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
}

const ItemDetail = () => {
  const { type, id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [alreadyContacted, setAlreadyContacted] = useState(false);

  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        setLoading(true);
        const collectionName = type === 'lost' ? 'lost_items' : 'found_items';
        const itemDoc = await getDoc(doc(db, collectionName, id));
        
        if (!itemDoc.exists()) {
          setError('Item not found');
        } else {
          const itemData = {
            id: itemDoc.id,
            ...itemDoc.data()
          };
          setItem(itemData);
          
          // Check if current user has already contacted about this item
          if (currentUser) {
            const contactRequestsQuery = query(
              collection(db, 'contact_requests'),
              where('itemId', '==', id),
              where('itemType', '==', type),
              where('requesterId', '==', currentUser.uid)
            );
            
            const requestSnapshot = await getDocs(contactRequestsQuery);
            setAlreadyContacted(!requestSnapshot.empty);
          }
        }
      } catch (err) {
        console.error('Error fetching item details:', err);
        setError('Failed to load item details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchItemDetails();
  }, [id, type, currentUser]);

  // Stable handler functions using useCallback to prevent recreation on each render
  const closeContactModal = useCallback(() => {
    setShowContactModal(false);
  }, []);

  const handleFormSubmit = useCallback(async (message) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    try {
      setSendingRequest(true);
      
      // Create a contact request in Firestore
      const contactRequest = {
        itemId: id,
        itemType: type,
        itemTitle: item.title,
        requesterId: currentUser.uid,
        requesterName: currentUser.displayName || currentUser.email,
        requesterEmail: currentUser.email,
        recipientId: type === 'lost' ? item.lostBy.uid : item.foundBy.uid,
        recipientName: type === 'lost' ? item.lostBy.name : item.foundBy.name,
        recipientEmail: type === 'lost' ? item.lostBy.email : item.foundBy.email,
        message: message,
        status: 'pending', // pending, approved, rejected
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'contact_requests'), contactRequest);
      
      // Update item's contactRequests count
      const itemRef = doc(db, type === 'lost' ? 'lost_items' : 'found_items', id);
      await updateDoc(itemRef, {
        contactRequestsCount: (item.contactRequestsCount || 0) + 1
      });
      
      setShowContactModal(false);
      setRequestSent(true);
      setAlreadyContacted(true);
    } catch (error) {
      console.error('Error submitting contact request:', error);
      setError('Failed to send contact request. Please try again.');
    } finally {
      setSendingRequest(false);
    }
  }, [currentUser, id, type, item, navigate]);

  // Format date display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#82001A]"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
          <p className="text-lg">{error}</p>
          <p className="mt-2">
            <button 
              onClick={() => navigate(-1)} 
              className="text-[#82001A] font-medium hover:text-[#82001A]/80"
            >
              Go Back
            </button>
          </p>
        </div>
      </div>
    );
  }

  if (!item) return null;

  const isOwner = currentUser && (
    (type === 'lost' && item.lostBy?.uid === currentUser.uid) ||
    (type === 'found' && item.foundBy?.uid === currentUser.uid)
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Success message after sending contact request */}
      {requestSent && (
        <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg" role="alert">
          <p className="font-medium">Contact request sent successfully!</p>
          <p className="text-sm">The item owner will be notified and can choose to contact you.</p>
        </div>
      )}
      
      {/* Main content area */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="md:flex">
          {/* Image section */}
          <div className="md:w-1/2">
            {item.imageURL ? (
              <img 
                src={item.imageURL} 
                alt={item.title} 
                className="h-96 w-full object-cover" 
              />
            ) : (
              <div className="h-96 w-full bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <svg className="mx-auto h-24 w-24 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500 mt-1">No image available</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Details section */}
          <div className="md:w-1/2 p-6 md:p-8">
            <div className="flex justify-between items-start">
              <div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  type === 'found' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {type === 'found' ? 'Found Item' : 'Lost Item'}
                </span>
                <h1 className="mt-2 text-2xl font-bold text-gray-900">{item.title}</h1>
              </div>
              
              {type === 'lost' && item.reward > 0 && (
                <span className="bg-[#82001A]/10 text-[#82001A] px-3 py-1 rounded-full text-sm font-medium">
                  ${item.reward} Reward
                </span>
              )}
            </div>
            
            <div className="mt-6 border-t border-gray-200 pt-4">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Category</dt>
                  <dd className="mt-1 text-sm text-gray-900">{item.category}</dd>
                </div>
                
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">
                    {type === 'found' ? 'Date Found' : 'Date Lost'}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(item.date)}</dd>
                </div>
                
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">
                    {type === 'found' ? 'Found At' : 'Last Seen'}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{item.location}</dd>
                </div>
                
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.status === 'returned' 
                        ? 'bg-green-100 text-green-800'
                        : item.status === 'delivered'
                          ? 'bg-purple-100 text-purple-800'
                        : item.status === 'received'
                          ? 'bg-teal-100 text-teal-800'
                        : item.status === 'claimed' || item.status === 'found'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.status === 'searching'
                        ? 'Still Looking'
                        : item.status === 'found'
                          ? 'Found'
                          : item.status === 'returned'
                            ? 'Returned to Owner'
                            : item.status === 'claimed'
                              ? 'Claimed'
                              : item.status === 'delivered'
                                ? 'Delivered'
                                : item.status === 'received'
                                  ? 'Received'
                                  : 'Processing'}
                    </span>
                  </dd>
                </div>
                
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                    {item.description}
                  </dd>
                </div>
                
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">
                    {type === 'found' ? 'Reported By' : 'Reported By'}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {type === 'found' 
                      ? (item.foundBy?.name || item.foundBy?.email || 'Anonymous')
                      : (item.lostBy?.name || item.lostBy?.email || 'Anonymous')}
                  </dd>
                </div>

                {/* Delivery Information Section - Only show for found items with delivery status */}
                {type === 'found' && (item.status === 'delivered' || item.status === 'received' || item.status === 'returned') && (
                  <div className="sm:col-span-2 mt-2">
                    <div className={`p-4 rounded-md ${
                      item.status === 'returned' 
                        ? 'bg-green-50' 
                        : item.status === 'received' 
                          ? 'bg-teal-50' 
                          : 'bg-purple-50'
                    }`}>
                      <h4 className={`text-sm font-medium ${
                        item.status === 'returned' 
                          ? 'text-green-800' 
                          : item.status === 'received' 
                            ? 'text-teal-800' 
                            : 'text-purple-800'
                      }`}>
                        Delivery Status: {item.status === 'returned' 
                          ? 'Returned to Owner' 
                          : item.status === 'received' 
                            ? 'Received by Claimer' 
                            : 'Item Delivered'}
                      </h4>
                      
                      {item.status === 'delivered' && item.deliveredBy && (
                        <p className="mt-2 text-sm text-gray-700">
                          <span className="font-medium">Delivered by:</span> {item.deliveredBy.name || item.deliveredBy.email}
                          {item.deliveredBy.timestamp && (
                            <span className="block text-xs text-gray-500">
                              On {formatDate(item.deliveredBy.timestamp?.toDate?.() || item.deliveredBy.timestamp)}
                            </span>
                          )}
                        </p>
                      )}
                      
                      {item.status === 'received' && item.receivedBy && (
                        <p className="mt-2 text-sm text-gray-700">
                          <span className="font-medium">Received by:</span> {item.receivedBy.name || item.receivedBy.email}
                          {item.receivedBy.timestamp && (
                            <span className="block text-xs text-gray-500">
                              On {formatDate(item.receivedBy.timestamp?.toDate?.() || item.receivedBy.timestamp)}
                            </span>
                          )}
                        </p>
                      )}
                      
                      {/* Additional message to guide users in delivery process */}
                      {item.status === 'delivered' && currentUser && item.claimedBy?.uid === currentUser.uid && (
                        <div className="mt-2 text-sm text-gray-700">
                          <p>This item has been marked as delivered to you. Please press the <strong>Done</strong> button on the item card to confirm reception.</p>
                        </div>
                      )}
                      
                      {item.status === 'received' && currentUser && item.foundBy?.uid === currentUser.uid && (
                        <div className="mt-2 text-sm text-gray-700">
                          <p>The claimer has confirmed receiving this item. Please press the <strong>Done</strong> button on the item card to finalize the return.</p>
                        </div>
                      )}
                      
                      {item.status === 'returned' && (
                        <div className="mt-2 text-sm text-gray-700">
                          <p>This item has been successfully returned to its owner. Thank you for using Campus Lost & Found!</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </dl>
            </div>
            
            {/* Contact Button */}
            <div className="mt-6 border-t border-gray-200 pt-6">
              {isOwner ? (
                <div className="bg-gray-50 rounded-md p-4">
                  <p className="text-sm text-gray-700">
                    You reported this item. Check your profile to update its status or see contact requests.
                  </p>
                </div>
              ) : currentUser ? (
                alreadyContacted ? (
                  <div className="bg-blue-50 rounded-md p-4">
                    <p className="text-sm text-blue-700">
                      You've already sent a contact request for this item. Check your profile for updates.
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowContactModal(true)}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#82001A] hover:bg-[#82001A]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#82001A]"
                  >
                    Contact About This Item
                  </button>
                )
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#82001A] hover:bg-[#82001A]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#82001A]"
                >
                  Login to Contact
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Back button */}
      <div className="mt-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-[#82001A] font-medium hover:text-[#82001A]/80"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Items
        </button>
      </div>
      
      {/* Contact modal - using class-based component */}
      {showContactModal && (
        <ContactFormModal
          type={type}
          initialMessage={contactMessage}
          onSubmit={handleFormSubmit}
          closeModal={closeContactModal}
          sendingRequest={sendingRequest}
        />
      )}
    </div>
  );
};

export default ItemDetail;