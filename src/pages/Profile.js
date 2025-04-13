import React, { useState, useEffect, Component } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, deleteDoc } from 'firebase/firestore';
import { db, storage } from '../firebase/config';

// Class-based component for edit profile form to fix text input focus issues
class EditProfileForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: props.initialValues.name || '',
      rollNumber: props.initialValues.rollNumber || '',
      profileImage: null,
      profileImageUrl: props.initialValues.profileImageUrl || '',
      uploadProgress: 0,
    };
  }

  handleImageChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        this.props.onError('Image size should be less than 5MB');
        return;
      }
      this.setState({
        profileImage: file,
        profileImageUrl: URL.createObjectURL(file)
      });
      // Clear any previous errors
      this.props.onError('');
    }
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      this.props.onError('');
      this.props.onSuccess('');
      this.props.setLoading(true);
      
      let photoURL = this.props.currentUser.photoURL;
      
      // Validate roll number format (19B81Axxxx)
      const rollNumberPattern = /^[0-9]{2}[A-Za-z][0-9]{2}[A-Za-z][0-9]{4}$/;
      if (this.state.rollNumber && !rollNumberPattern.test(this.state.rollNumber)) {
        this.props.onError('Please enter a valid roll number format (e.g., 19B81A0123)');
        this.props.setLoading(false);
        return;
      }
      
      // If there's a new profile image, upload it
      if (this.state.profileImage) {
        const storageRef = ref(storage, `profile-images/${this.props.currentUser.uid}/${Date.now()}-${this.state.profileImage.name}`);
        const uploadTask = uploadBytesResumable(storageRef, this.state.profileImage);
        
        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              this.setState({ uploadProgress: progress });
            },
            (error) => {
              this.props.onError('Error uploading image: ' + error.message);
              this.props.setLoading(false);
              reject(error);
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                photoURL = downloadURL;
                resolve();
              } catch (error) {
                reject(error);
              }
            }
          );
        });
      }
      
      // Update user profile in Firebase Auth
      await this.props.updateUserProfile({
        name: this.state.name,
        photoURL: photoURL
      });
      
      // Update Firestore user document with additional data
      const userRef = doc(db, 'users', this.props.currentUser.uid);
      await updateDoc(userRef, {
        name: this.state.name,
        rollNumber: this.state.rollNumber,
        updatedAt: new Date()
      });
      
      this.props.onSuccess('Profile updated successfully!');
      this.props.onCancel();
    } catch (error) {
      this.props.onError('Failed to update profile: ' + error.message);
      console.error('Update profile error:', error);
    } finally {
      this.props.setLoading(false);
      this.setState({ uploadProgress: 0 });
    }
  };

  handleCancel = () => {
    this.props.onCancel();
  };

  render() {
    const { loading } = this.props;
    const { name, rollNumber, profileImageUrl, uploadProgress } = this.state;

    const CircularProgress = ({ value }) => {
      const circumference = 2 * Math.PI * 20;
      const strokeDashoffset = circumference - (value / 100) * circumference;
      
      return (
        <div className="flex flex-col items-center">
          <div className="relative h-14 w-14">
            <svg className="h-full w-full" viewBox="0 0 44 44">
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
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="20"
                cx="22"
                cy="22"
                transform="rotate(-90 22 22)"
              />
            </svg>
            <div className="absolute top-0 left-0 flex h-full w-full items-center justify-center">
              <span className="text-xs font-medium">{Math.round(value)}%</span>
            </div>
          </div>
          <span className="mt-1 text-xs text-gray-500">Uploading...</span>
        </div>
      );
    };

    return (
      <form onSubmit={this.handleSubmit} className="space-y-6">
        <div className="flex flex-col items-center">
          <div className="relative">
            <img 
              src={profileImageUrl || "https://via.placeholder.com/150?text=Upload+Photo"} 
              alt="Profile" 
              className="h-32 w-32 rounded-full object-cover border-2 border-gray-200" 
            />
            <label htmlFor="profile-image" className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-[#82001A] flex items-center justify-center cursor-pointer">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input 
                id="profile-image" 
                name="profile-image" 
                type="file" 
                accept="image/*" 
                onChange={this.handleImageChange} 
                className="sr-only" 
              />
            </label>
          </div>
          
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-4">
              <CircularProgress value={uploadProgress} />
            </div>
          )}
        </div>
        
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={name}
            onChange={(e) => this.setState({ name: e.target.value })}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#82001A] focus:border-[#82001A] sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="rollNumber" className="block text-sm font-medium text-gray-700">
            Roll Number
          </label>
          <input
            type="text"
            id="rollNumber"
            name="rollNumber"
            value={rollNumber}
            onChange={(e) => this.setState({ rollNumber: e.target.value.toUpperCase() })}
            placeholder="e.g., 19B81A0123"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#82001A] focus:border-[#82001A] sm:text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">Format: 19B81Axxxx</p>
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={this.props.email}
            disabled
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-500 sm:text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={this.handleCancel}
            className="py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#82001A]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#82001A] hover:bg-[#82001A]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#82001A] disabled:opacity-70"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    );
  }
}

const Profile = () => {
  const { currentUser, updateUserProfile } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userItems, setUserItems] = useState({ lost: [], found: [] });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('profile');
  const [contactRequests, setContactRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [processingRequestId, setProcessingRequestId] = useState(null);
  
  useEffect(() => {
    if (currentUser) {
      setEmail(currentUser.email || '');
      setName(currentUser.displayName || '');
      setProfileImageUrl(currentUser.photoURL || '');
      
      // Fetch additional user data from Firestore
      const fetchUserData = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.name && !currentUser.displayName) {
              setName(userData.name);
            }
            if (userData.rollNumber) {
              setRollNumber(userData.rollNumber);
            }
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
        }
      };
      
      fetchUserData();
      fetchUserItems();
      fetchContactRequests();
    }
  }, [currentUser]);

  // Fetch user's items (lost and found)
  const fetchUserItems = async () => {
    if (!currentUser) return;
    
    try {
      // Fetch lost items
      const lostItemsQuery = query(
        collection(db, 'lost_items'),
        where('lostBy.uid', '==', currentUser.uid)
      );
      
      const lostSnapshot = await getDocs(lostItemsQuery);
      const lostItems = lostSnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Handle Firestore timestamp safely
        let processedData = {
          ...data,
          // Convert Firestore timestamps to date strings or use fallback
          createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
          date: data.date || new Date().toISOString()
        };
        
        return {
          id: doc.id,
          ...processedData
        };
      });
      
      // Fetch found items
      const foundItemsQuery = query(
        collection(db, 'found_items'),
        where('foundBy.uid', '==', currentUser.uid)
      );
      
      const foundSnapshot = await getDocs(foundItemsQuery);
      const foundItems = foundSnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Handle Firestore timestamp safely
        let processedData = {
          ...data,
          // Convert Firestore timestamps to date strings or use fallback
          createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
          date: data.date || new Date().toISOString()
        };
        
        return {
          id: doc.id,
          ...processedData
        };
      });
      
      console.log("Fetched items:", { lost: lostItems, found: foundItems });
      setUserItems({ lost: lostItems, found: foundItems });
    } catch (err) {
      console.error('Error fetching user items:', err);
    }
  };
  
  // Fetch contact requests for the user
  const fetchContactRequests = async () => {
    if (!currentUser) return;
    
    try {
      // Fetch received contact requests
      const receivedRequestsQuery = query(
        collection(db, 'contact_requests'),
        where('recipientId', '==', currentUser.uid)
      );
      
      const receivedSnapshot = await getDocs(receivedRequestsQuery);
      const received = receivedSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAtFormatted: data.createdAt ? new Date(data.createdAt.toDate()).toLocaleString() : new Date().toLocaleString()
        };
      });
      
      setContactRequests(received);
      
      // Fetch sent contact requests
      const sentRequestsQuery = query(
        collection(db, 'contact_requests'),
        where('requesterId', '==', currentUser.uid)
      );
      
      const sentSnapshot = await getDocs(sentRequestsQuery);
      const sent = sentSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAtFormatted: data.createdAt ? new Date(data.createdAt.toDate()).toLocaleString() : new Date().toLocaleString()
        };
      });
      
      console.log("Fetched requests:", { received, sent });
      setSentRequests(sent);
    } catch (err) {
      console.error('Error fetching contact requests:', err);
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      setProfileImage(file);
      setProfileImageUrl(URL.createObjectURL(file));
      // Clear any previous errors
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      let photoURL = currentUser.photoURL;
      
      // Validate roll number format (19B81Axxxx)
      const rollNumberPattern = /^[0-9]{2}[A-Za-z][0-9]{2}[A-Za-z][0-9]{4}$/;
      if (rollNumber && !rollNumberPattern.test(rollNumber)) {
        setError('Please enter a valid roll number format (e.g., 19B81A0123)');
        setLoading(false);
        return;
      }
      
      // If there's a new profile image, upload it
      if (profileImage) {
        const storageRef = ref(storage, `profile-images/${currentUser.uid}/${Date.now()}-${profileImage.name}`);
        const uploadTask = uploadBytesResumable(storageRef, profileImage);
        
        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => {
              setError('Error uploading image: ' + error.message);
              setLoading(false);
              reject(error);
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                photoURL = downloadURL;
                resolve();
              } catch (error) {
                reject(error);
              }
            }
          );
        });
      }
      
      // Update user profile in Firebase Auth
      await updateUserProfile({
        name: name,
        photoURL: photoURL
      });
      
      // Update Firestore user document with additional data
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        name: name,
        rollNumber: rollNumber,
        updatedAt: new Date()
      });
      
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      setError('Failed to update profile: ' + error.message);
      console.error('Update profile error:', error);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };
  
  // Handle contact request actions (approve, reject)
  const handleContactRequest = async (requestId, action) => {
    setProcessingRequestId(requestId);
    
    try {
      const requestRef = doc(db, 'contact_requests', requestId);
      
      if (action === 'approve') {
        await updateDoc(requestRef, {
          status: 'approved',
          updatedAt: new Date()
        });
      } else if (action === 'reject') {
        await updateDoc(requestRef, {
          status: 'rejected',
          updatedAt: new Date()
        });
      } else if (action === 'delete') {
        await deleteDoc(requestRef);
      }
      
      // Refresh contact requests data
      fetchContactRequests();
      setSuccess(`Request ${action === 'delete' ? 'deleted' : action + 'd'} successfully!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      setError(`Failed to ${action} request: ${error.message}`);
      console.error(`Error ${action}ing request:`, error);
    } finally {
      setProcessingRequestId(null);
    }
  };

  const CircularProgress = ({ value }) => {
    const circumference = 2 * Math.PI * 20;
    const strokeDashoffset = circumference - (value / 100) * circumference;
    
    return (
      <div className="flex flex-col items-center">
        <div className="relative h-14 w-14">
          <svg className="h-full w-full" viewBox="0 0 44 44">
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
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="20"
              cx="22"
              cy="22"
              transform="rotate(-90 22 22)"
            />
          </svg>
          <div className="absolute top-0 left-0 flex h-full w-full items-center justify-center">
            <span className="text-xs font-medium">{Math.round(value)}%</span>
          </div>
        </div>
        <span className="mt-1 text-xs text-gray-500">Uploading...</span>
      </div>
    );
  };

  const ProfileSection = () => (
    <>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Profile Information</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details</p>
          </div>
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#82001A] hover:bg-[#82001A]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#82001A]"
            >
              Edit Profile
            </button>
          )}
        </div>
        
        {isEditing ? (
          <div className="px-4 py-5 sm:p-6">
            <EditProfileForm 
              initialValues={{
                name,
                rollNumber,
                profileImageUrl
              }}
              email={email}
              currentUser={currentUser}
              updateUserProfile={updateUserProfile}
              loading={loading}
              setLoading={setLoading}
              onError={setError}
              onSuccess={setSuccess}
              onCancel={() => {
                setIsEditing(false);
                setName(currentUser.displayName || '');
                setProfileImageUrl(currentUser.photoURL || '');
                setError('');
                setSuccess('');
              }}
            />
          </div>
        ) : (
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Profile Photo</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <img 
                    src={profileImageUrl || "https://via.placeholder.com/150?text=No+Photo"} 
                    alt="Profile" 
                    className="h-20 w-20 rounded-full object-cover border-2 border-gray-200" 
                  />
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Full name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{name || 'Not set'}</dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Roll number</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{rollNumber || 'Not set'}</dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Email address</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{email}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </>
  );
  
  const ItemCard = ({ item, type }) => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    
    // Use the string date from our fixed data structure
    const date = item.date ? new Date(item.date).toLocaleDateString() : new Date().toLocaleDateString();
    
    const handleStatusUpdate = async () => {
      if (item.status !== 'searching') return;
      
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
        
        // Update the local item state
        item.status = 'found';
        
        // Hide success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } catch (error) {
        console.error('Error updating item status:', error);
      } finally {
        setLoading(false);
      }
    };
    
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="h-32 bg-gray-100 relative">
          {item.imageURL ? (
            <img 
              src={item.imageURL} 
              alt={item.title} 
              className="h-32 w-full object-cover" 
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <svg className="h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
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
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-semibold text-gray-800 truncate">{item.title}</h3>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              item.status === 'returned' 
                ? 'bg-green-100 text-green-800'
                : item.status === 'claimed' || item.status === 'found'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-yellow-100 text-yellow-800'
            }`}>
              {item.status === 'searching'
                ? 'Still Looking'
                : item.status === 'found'
                  ? 'Found'
                  : item.status === 'returned'
                    ? 'Returned'
                    : item.status === 'claimed'
                      ? 'Claimed'
                      : 'Processing'}
            </span>
          </div>
          
          <p className="text-xs text-gray-500 mb-3">
            <span className="font-medium">{type === 'found' ? 'Found at:' : 'Last seen:'}</span> {item.location}
            <br />
            <span className="font-medium">Date:</span> {date}
            {item.contactRequestsCount > 0 && (
              <span className="block mt-1 text-[#82001A] font-medium">
                {item.contactRequestsCount} contact request{item.contactRequestsCount !== 1 && 's'}
              </span>
            )}
          </p>
          
          <div className="flex justify-between items-center">
            <Link 
              to={`/item/${type}/${item.id}`}
              className="text-[#82001A] hover:text-[#82001A]/80 text-xs font-medium flex items-center"
            >
              View Details
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
          
          {/* Status update button - only shown for lost items with 'searching' status */}
          {type === 'lost' && item.status === 'searching' && (
            <div className="mt-3">
              {success ? (
                <div className="bg-green-100 text-green-800 text-xs p-2 rounded-md text-center">
                  Status updated successfully!
                </div>
              ) : (
                <button
                  onClick={handleStatusUpdate}
                  disabled={loading}
                  className="w-full mt-2 py-1.5 px-3 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-[#82001A] hover:bg-[#82001A]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#82001A] disabled:opacity-70 flex justify-center items-center"
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
        </div>
      </div>
    );
  };
  
  const ItemsSection = () => (
    <>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Your Items</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Items you have reported as lost or found
          </p>
        </div>
        
        <div className="border-t border-gray-200">
          <div>
            <div className="py-4 sm:py-5 sm:px-6">
              <h4 className="text-md font-medium text-gray-900">Lost Items</h4>
              {userItems.lost.length === 0 ? (
                <p className="mt-1 text-sm text-gray-500">You haven't reported any lost items yet.</p>
              ) : (
                <div className="mt-3 grid grid-cols-1 gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {userItems.lost.map(item => (
                    <ItemCard key={item.id} item={item} type="lost" />
                  ))}
                </div>
              )}
            </div>
            
            <div className="py-4 sm:py-5 sm:px-6 bg-gray-50">
              <h4 className="text-md font-medium text-gray-900">Found Items</h4>
              {userItems.found.length === 0 ? (
                <p className="mt-1 text-sm text-gray-500">You haven't reported any found items yet.</p>
              ) : (
                <div className="mt-3 grid grid-cols-1 gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {userItems.found.map(item => (
                    <ItemCard key={item.id} item={item} type="found" />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
  
  const ContactRequestCard = ({ request, isReceived }) => {
    const date = request.createdAtFormatted || 'Unknown date';
    const itemType = request.itemType || 'unknown';
    
    return (
      <div className="bg-white rounded-lg shadow-md p-4 relative">
        <div className="absolute top-2 right-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            request.status === 'approved' 
              ? 'bg-green-100 text-green-800'
              : request.status === 'rejected'
                ? 'bg-red-100 text-red-800'
                : 'bg-blue-100 text-blue-800'
          }`}>
            {request.status === 'approved'
              ? 'Approved'
              : request.status === 'rejected'
                ? 'Rejected'
                : 'Pending'}
          </span>
        </div>

        <div>
          <div className="flex items-start">
            <span className={`flex-shrink-0 inline-block h-2 w-2 rounded-full ${
              request.status === 'pending' ? 'bg-blue-500' : 'bg-gray-300'
            } mr-2 mt-2`}></span>
            <h3 className="text-sm font-medium text-gray-900 pr-14">
              {isReceived 
                ? `${request.requesterName || request.requesterEmail} is interested in your ${itemType} item: "${request.itemTitle}"`
                : `Your request for ${itemType} item: "${request.itemTitle}"`
              }
            </h3>
          </div>
          
          <div className="mt-2 text-xs text-gray-500">{date}</div>
          
          <div className="mt-2 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700">{request.message}</p>
          </div>
          
          {isReceived && request.status === 'pending' && (
            <div className="mt-3 flex space-x-2">
              <button
                onClick={() => handleContactRequest(request.id, 'approve')}
                disabled={processingRequestId === request.id}
                className="inline-flex justify-center py-1 px-3 border border-transparent shadow-sm text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70"
              >
                {processingRequestId === request.id ? 'Processing...' : 'Approve & Share Contact'}
              </button>
              <button
                onClick={() => handleContactRequest(request.id, 'reject')}
                disabled={processingRequestId === request.id}
                className="inline-flex justify-center py-1 px-3 border border-transparent shadow-sm text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-70"
              >
                {processingRequestId === request.id ? 'Processing...' : 'Reject'}
              </button>
            </div>
          )}
          
          {((isReceived && request.status !== 'pending') || (!isReceived && request.status === 'approved')) && (
            <div className="mt-3 text-xs">
              <p className="font-medium text-gray-700">Contact Information:</p>
              <p className="text-gray-600">
                {isReceived 
                  ? `${request.requesterName || 'Name not provided'} (${request.requesterEmail})`
                  : `${request.recipientName || 'Name not provided'} (${request.recipientEmail})`
                }
              </p>
            </div>
          )}
          
          {(!isReceived || request.status !== 'pending') && (
            <div className="mt-3">
              <button
                onClick={() => handleContactRequest(request.id, 'delete')}
                disabled={processingRequestId === request.id}
                className="inline-flex justify-center py-1 px-3 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#82001A] disabled:opacity-70"
              >
                {processingRequestId === request.id ? 'Processing...' : 'Delete'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  const RequestsSection = () => (
    <>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Contact Requests</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Manage contact requests for your items
          </p>
        </div>
        
        <div className="border-t border-gray-200">
          <div className="px-4 py-5 sm:px-6">
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">Requests Received</h4>
              {contactRequests.length === 0 ? (
                <p className="text-sm text-gray-500">You haven't received any contact requests yet.</p>
              ) : (
                <div className="space-y-4">
                  {contactRequests.map(request => (
                    <ContactRequestCard key={request.id} request={request} isReceived={true} />
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Requests Sent</h4>
              {sentRequests.length === 0 ? (
                <p className="text-sm text-gray-500">You haven't sent any contact requests yet.</p>
              ) : (
                <div className="space-y-4">
                  {sentRequests.map(request => (
                    <ContactRequestCard key={request.id} request={request} isReceived={false} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {success && (
          <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{success}</span>
          </div>
        )}
        
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-[#82001A] text-[#82001A]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('items')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'items'
                  ? 'border-[#82001A] text-[#82001A]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Items {userItems.lost.length + userItems.found.length > 0 && 
                `(${userItems.lost.length + userItems.found.length})`}
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'requests'
                  ? 'border-[#82001A] text-[#82001A]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Requests {contactRequests.length > 0 && 
                <span className="ml-1 bg-red-500 text-white rounded-full h-5 w-5 inline-flex items-center justify-center text-xs">
                  {contactRequests.filter(r => r.status === 'pending').length}
                </span>
              }
            </button>
          </nav>
        </div>
        
        {/* Active Tab Content */}
        {activeTab === 'profile' && <ProfileSection />}
        {activeTab === 'items' && <ItemsSection />}
        {activeTab === 'requests' && <RequestsSection />}
      </div>
    </div>
  );
};

export default Profile;