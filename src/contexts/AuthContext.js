import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider, 
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const [loading, setLoading] = useState(true);

  // Sign up with email and password
  const signup = async (email, password, name) => {
    try {
      const response = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile with display name
      await updateProfile(response.user, { displayName: name });
      
      // Create a user document in Firestore
      await setDoc(doc(db, 'users', response.user.uid), {
        name,
        email,
        role: 'user',
        createdAt: new Date().toISOString(),
        photoURL: response.user.photoURL || null
      });
      
      // Update the current user state immediately to avoid waiting for the auth state observer
      setCurrentUser({...response.user, displayName: name});
      setUserRole('user');
      
      return response.user;
    } catch (error) {
      console.error("Error during signup:", error);
      throw error;
    }
  };

  // Login with email and password
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Login with Google
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    // Check if user document exists, if not create one
    const userRef = doc(db, 'users', result.user.uid);
    const docSnap = await getDoc(userRef);
    
    if (!docSnap.exists()) {
      await setDoc(userRef, {
        name: result.user.displayName,
        email: result.user.email,
        role: 'user',
        createdAt: new Date().toISOString(),
        photoURL: result.user.photoURL || null
      });
      
      // Update user role immediately
      setUserRole('user');
    } else {
      // Update user role from database
      setUserRole(docSnap.data().role);
    }
    
    return result.user;
  };

  // Logout
  const logout = () => {
    return signOut(auth);
  };

  // Get user role from Firestore
  const getUserRole = async (user) => {
    if (!user) return 'user';
    
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setUserRole(docSnap.data().role);
        return docSnap.data().role;
      }
      
      return 'user';
    } catch (error) {
      console.error("Error getting user role:", error);
      return 'user';
    }
  };
  
  // Update user profile
  const updateUserProfile = async (data) => {
    if (!currentUser) throw new Error("No user is signed in");
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      
      // If there's a displayName update, update the auth profile too
      if (data.name) {
        await updateProfile(currentUser, { displayName: data.name });
      }
      
      // If there's a photoURL update, update the auth profile too
      if (data.photoURL) {
        await updateProfile(currentUser, { photoURL: data.photoURL });
      }
      
      // Update the Firestore document
      await setDoc(userRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
      
      // Update the current user state
      setCurrentUser({...currentUser, displayName: data.name || currentUser.displayName, photoURL: data.photoURL || currentUser.photoURL});
      
      return true;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await getUserRole(user);
      } else {
        setUserRole('user');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    login,
    signup,
    logout,
    loginWithGoogle,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};