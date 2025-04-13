import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, getDoc } from 'firebase/firestore';
import { db, storage } from '../firebase/config';

const Profile = () => {
  const { currentUser, updateUserProfile } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userItems, setUserItems] = useState({ lost: [], found: [] });
  const [uploadProgress, setUploadProgress] = useState(0);

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
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
        }
      };
      
      fetchUserData();
    }
  }, [currentUser]);

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      setProfileImage(file);
      setProfileImageUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      let photoURL = currentUser.photoURL;
      
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
      
      // Update user profile in Firebase Auth and Firestore
      await updateUserProfile({
        name: name,
        photoURL: photoURL
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
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Profile Information</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and your reported items</p>
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
          
          {error && (
            <div className="mx-4 my-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          {success && (
            <div className="mx-4 my-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{success}</span>
            </div>
          )}
          
          {isEditing ? (
            <div className="px-4 py-5 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
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
                        onChange={handleImageChange} 
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
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#82001A] focus:border-[#82001A] sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    disabled
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setName(currentUser.displayName || '');
                      setProfileImageUrl(currentUser.photoURL || '');
                      setProfileImage(null);
                      setError('');
                      setSuccess('');
                    }}
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
                  <dt className="text-sm font-medium text-gray-500">Email address</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{email}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>
        
        {/* User's Lost and Found Items */}
        <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Your Items</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Items you have reported as lost or found
            </p>
          </div>
          
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            <div className="sm:divide-y sm:divide-gray-200">
              <div className="py-4 sm:py-5 sm:px-6">
                <h4 className="text-md font-medium text-gray-900">Lost Items</h4>
                {userItems.lost.length === 0 ? (
                  <p className="mt-1 text-sm text-gray-500">You haven't reported any lost items yet.</p>
                ) : (
                  <ul className="mt-3 grid grid-cols-1 gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {userItems.lost.map(item => (
                      <li key={item.id} className="col-span-1 bg-white rounded-lg shadow divide-y divide-gray-200">
                        {/* Item details would go here */}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              <div className="py-4 sm:py-5 sm:px-6">
                <h4 className="text-md font-medium text-gray-900">Found Items</h4>
                {userItems.found.length === 0 ? (
                  <p className="mt-1 text-sm text-gray-500">You haven't reported any found items yet.</p>
                ) : (
                  <ul className="mt-3 grid grid-cols-1 gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {userItems.found.map(item => (
                      <li key={item.id} className="col-span-1 bg-white rounded-lg shadow divide-y divide-gray-200">
                        {/* Item details would go here */}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;