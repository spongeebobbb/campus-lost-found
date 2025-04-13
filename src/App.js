import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Components
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import FoundItems from './pages/FoundItems';
import LostItems from './pages/LostItems';
import FoundItemForm from './components/FoundItemForm';
import LostItemForm from './components/LostItemForm';
import Home from './pages/Home';
import Profile from './pages/Profile';
import ItemDetail from './pages/ItemDetail';

// Route Guards
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const AdminRoute = ({ children }) => {
  const { currentUser, userRole } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  if (userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function AppRoutes() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/found-items" element={<FoundItems />} />
          <Route path="/lost-items" element={<LostItems />} />
          
          {/* Protected Routes */}
          <Route 
            path="/report/found" 
            element={
              <ProtectedRoute>
                <div className="py-8">
                  <FoundItemForm />
                </div>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/report/lost" 
            element={
              <ProtectedRoute>
                <div className="py-8">
                  <LostItemForm />
                </div>
              </ProtectedRoute>
            } 
          />
          
          {/* Profile Route */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin Routes */}
          <Route 
            path="/admin/*" 
            element={
              <AdminRoute>
                <div>Admin Dashboard (To be implemented)</div>
              </AdminRoute>
            } 
          />
          
          {/* Item Detail Route */}
          <Route 
            path="/item/:type/:id" 
            element={<ItemDetail />}
          />
          
          {/* 404 Route */}
          <Route path="*" element={<div className="text-center py-20">Page Not Found</div>} />
        </Routes>
      </main>
      
      <footer className="bg-white py-6 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} VJLNF</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
