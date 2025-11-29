import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { UserProvider } from './contexts/UserContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Layout from './components/layout/Layout';

// Auth Pages
import Login from './pages/auth/Login/Login';
import Register from './pages/auth/Register/Register';
import Verification from './pages/auth/Verification/Verification';
import ForgotPassword from './pages/auth/ForgotPassword/ForgotPassword';

// Onboarding Pages
import Step1Welcome from './pages/onboarding/Step1Welcome/Step1Welcome';
import Step2BasicInfo from './pages/onboarding/Step2BasicInfo/Step2BasicInfo';
import Step3Medical from './pages/onboarding/Step3Medical/Step3Medical';
import Step4Preferences from './pages/onboarding/Step4Preferences/Step4Preferences';
import Step5Lifestyle from './pages/onboarding/Step5Lifestyle/Step5Lifestyle';
import Step6Review from './pages/onboarding/Step6Review/Step6Review';
import Step7Confirmation from './pages/onboarding/Step7Confirmation/Step7Confirmation';

// Main Pages
import Dashboard from './pages/dashboard/Dashboard';
import MealPlanner from './pages/meal-planner/MealPlanner';
import SingleMealPlanner from './pages/meal-planner/SingleMealPlanner/SingleMealPlanner';
import DailyMealPlanner from './pages/meal-planner/DailyMealPlanner/DailyMealPlanner';
import MultipleMealPlanner from './pages/meal-planner/MultipleMealPlanner/MultipleMealPlanner';
import ScanFood from './pages/scan-food/ScanFood';
import DishScan from './pages/scan-food/DishScan/DishScan';
import FruitsVegetablesScan from './pages/scan-food/FruitsVegetablesScan/FruitsVegetablesScan';
import BarcodeScan from './pages/scan-food/BarcodeScan/BarcodeScan';
import AddMeal from './pages/add-meal/AddMeal';
import Analytics from './pages/analytics/Analytics';
import Profile from './pages/profile/Profile';
import Social from './pages/social/Social';
import Settings from './pages/settings/Settings';
import MealHistory from './pages/meal-history/MealHistory';
import Cart from './pages/cart/Cart';

// Legal Pages
import Privacy from './pages/privacy/Privacy';
import Terms from './pages/terms/Terms';

// Protected Route Component
import ProtectedRoute from './components/common/ProtectedRoute/ProtectedRoute';

// Meals routes
import EditMeal from './pages/edit-meal/EditMeal';
import EditUserMeal from './pages/edit-user-meal/EditUserMeal';

// Global Styles
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <UserProvider>
            <Router>
              <div className="App">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/verify-email" element={<Verification />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  
                  {/* Onboarding Routes - Protected but allow incomplete onboarding */}
                  <Route path="/onboarding/welcome" element={<ProtectedRoute requireOnboarding={false}><Step1Welcome /></ProtectedRoute>} />
                  <Route path="/onboarding/basic-info" element={<ProtectedRoute requireOnboarding={false}><Step2BasicInfo /></ProtectedRoute>} />
                  <Route path="/onboarding/medical" element={<ProtectedRoute requireOnboarding={false}><Step3Medical /></ProtectedRoute>} />
                  <Route path="/onboarding/preferences" element={<ProtectedRoute requireOnboarding={false}><Step4Preferences /></ProtectedRoute>} />
                  <Route path="/onboarding/lifestyle" element={<ProtectedRoute requireOnboarding={false}><Step5Lifestyle /></ProtectedRoute>} />
                  <Route path="/onboarding/review" element={<ProtectedRoute requireOnboarding={false}><Step6Review /></ProtectedRoute>} />
                  <Route path="/onboarding/confirmation" element={<ProtectedRoute requireOnboarding={false}><Step7Confirmation /></ProtectedRoute>} />
                  
                  {/* Protected Routes with Layout */}
                  <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
                  <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
                  
                  <Route path="/meal-planner" element={<ProtectedRoute><Layout><MealPlanner /></Layout></ProtectedRoute>} />
                  <Route path="/meal-planner/single" element={<ProtectedRoute><Layout><SingleMealPlanner /></Layout></ProtectedRoute>} />
                  <Route path="/meal-planner/daily" element={<ProtectedRoute><Layout><DailyMealPlanner /></Layout></ProtectedRoute>} />
                  <Route path="/meal-planner/multiple" element={<ProtectedRoute><Layout><MultipleMealPlanner /></Layout></ProtectedRoute>} />
                  
                  <Route path="/scan-food" element={<ProtectedRoute><Layout><ScanFood /></Layout></ProtectedRoute>} />
                  <Route path="/scan-food/dish" element={<ProtectedRoute><Layout><DishScan /></Layout></ProtectedRoute>} />
                  <Route path="/scan-food/fruits-vegetables" element={<ProtectedRoute><Layout><FruitsVegetablesScan /></Layout></ProtectedRoute>} />
                  <Route path="/scan-food/barcode" element={<ProtectedRoute><Layout><BarcodeScan /></Layout></ProtectedRoute>} />
                  
                  <Route path="/edit-meal/:id" element={<ProtectedRoute><Layout><EditMeal /></Layout></ProtectedRoute>} />
                  <Route path="/edit-user-meal/:id" element={<ProtectedRoute><Layout><EditUserMeal /></Layout></ProtectedRoute>} />
                  <Route path="/add-meal" element={<ProtectedRoute><Layout><AddMeal /></Layout></ProtectedRoute>} />
                  <Route path="/analytics" element={<ProtectedRoute><Layout><Analytics /></Layout></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
                  <Route path="/social" element={<ProtectedRoute><Layout><Social /></Layout></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
                  <Route path="/meal-history" element={<ProtectedRoute><Layout><MealHistory /></Layout></ProtectedRoute>} />
                  <Route path="/cart" element={<ProtectedRoute><Layout><Cart /></Layout></ProtectedRoute>} />
                  
                  {/* Default redirect */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </div>
            </Router>
          </UserProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
