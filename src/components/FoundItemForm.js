import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

const categories = [
  'Electronics', 'Books', 'Clothing', 'Accessories', 
  'ID/Cards', 'Keys', 'Bags/Backpacks', 'Other'
];

const campusLocations = [
  'Library', 'Student Center', 'Cafeteria', 'Gym', 
  'Science Building', 'Arts Building', 'Dormitories', 'Parking Lot', 'Other'
];

const FoundItemForm = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      // Clear any previous errors
      setError('');
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    // Reset the file input
    const fileInput = document.getElementById('image');
    if (fileInput) fileInput.value = '';
  };

  const validateForm = () => {
    if (!title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!description.trim()) {
      setError('Description is required');
      return false;
    }
    if (!category) {
      setError('Category is required');
      return false;
    }
    if (!location) {
      setError('Location is required');
      return false;
    }
    if (!date) {
      setError('Date is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('You must be logged in to report an item');
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      setFormSubmitted(true);
      
      // Create new found item document without image URL first
      const foundItemData = {
        title,
        description,
        category,
        location,
        date: date || new Date().toISOString().split('T')[0],
        foundBy: {
          uid: currentUser.uid,
          name: currentUser.displayName || '',
          email: currentUser.email
        },
        status: 'available', // available, claimed, returned
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      if (image) {
        // Create a storage reference
        const storageRef = ref(storage, `found-items/${Date.now()}-${image.name}`);
        
        // Upload image
        const uploadTask = uploadBytesResumable(storageRef, image);
        
        // Listen for upload progress
        uploadTask.on('state_changed',
          (snapshot) => {
            // Calculate progress percentage
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            setError('Error uploading image: ' + error.message);
            setLoading(false);
            setFormSubmitted(false);
            console.error('Upload error:', error);
          },
          async () => {
            // Get download URL after upload completes
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              
              // Add image URL to found item data
              foundItemData.imageURL = downloadURL;
              
              // Add document to Firestore
              await addDoc(collection(db, 'found_items'), foundItemData);
              
              setLoading(false);
              navigate('/found-items');
            } catch (error) {
              setError('Error completing submission: ' + error.message);
              setLoading(false);
              setFormSubmitted(false);
            }
          }
        );
      } else {
        // If no image, just add document to Firestore
        await addDoc(collection(db, 'found_items'), foundItemData);
        setLoading(false);
        navigate('/found-items');
      }
    } catch (error) {
      setError('Failed to report found item: ' + error.message);
      setLoading(false);
      setFormSubmitted(false);
      console.error('Report error:', error);
    }
  };

  // Create circular progress indicator component
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
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-[#82001A]">Report Found Item</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload Section */}
        <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
          <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
            Item Image (Recommended)
          </label>
          
          {!imagePreview ? (
            <div className="space-y-2">
              <svg 
                className="mx-auto h-12 w-12 text-gray-400" 
                stroke="currentColor" 
                fill="none" 
                viewBox="0 0 48 48" 
                aria-hidden="true"
              >
                <path 
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" 
                  strokeWidth={2} 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              </svg>
              <div className="flex justify-center text-sm text-gray-600">
                <label 
                  htmlFor="image" 
                  className="relative cursor-pointer bg-[#82001A] rounded-md font-medium text-white hover:bg-[#82001A]/90 py-2 px-4"
                >
                  <span>Upload an image</span>
                  <input id="image" name="image" type="file" accept="image/*" className="sr-only" onChange={handleImageChange} />
                </label>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
            </div>
          ) : (
            <div className="relative">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="h-48 mx-auto object-cover rounded-md" 
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-0 right-0 -mt-2 -mr-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Item Title*
          </label>
          <input
            type="text"
            id="title"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#82001A] focus:border-[#82001A]"
            placeholder="e.g. Blue Backpack, iPhone 12, Student ID Card"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category*
            </label>
            <select
              id="category"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#82001A] focus:border-[#82001A]"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">
              Date Found*
            </label>
            <input
              type="date"
              id="date"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#82001A] focus:border-[#82001A]"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">
            Location Found*
          </label>
          <select
            id="location"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#82001A] focus:border-[#82001A]"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option value="">Select a location</option>
            {campusLocations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description*
          </label>
          <textarea
            id="description"
            rows="4"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#82001A] focus:border-[#82001A]"
            placeholder="Provide details about the item (color, brand, condition, etc.)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>
        
        <div className="flex justify-center">
          {(loading && uploadProgress > 0 && uploadProgress < 100) && (
            <CircularProgress value={uploadProgress} />
          )}
        </div>
        
        <div>
          <button
            type="submit"
            disabled={loading || formSubmitted}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#82001A] hover:bg-[#82001A]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#82001A] ${
              (loading || formSubmitted) ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Submitting...' : 'Submit Found Item'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FoundItemForm;