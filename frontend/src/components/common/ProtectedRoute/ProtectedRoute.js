import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useUser } from '../../../contexts/UserContext';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';

const ProtectedRoute = ({ children, requireOnboarding = true }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { userProfile, loading: userLoading } = useUser();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (authLoading || userLoading) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check onboarding completion if required
  if (requireOnboarding && userProfile && !userProfile.onboarding?.completed) {
    // Redirect to appropriate onboarding step
    const currentStep = userProfile?.onboarding?.currentStep || 0;
    
    if (currentStep === 0) {
      return <Navigate to="/onboarding/welcome" replace />;
    } else if (currentStep === 1) {
      return <Navigate to="/onboarding/basic-info" replace />;
    } else if (currentStep === 2) {
      return <Navigate to="/onboarding/medical" replace />;
    } else if (currentStep === 3) {
      return <Navigate to="/onboarding/preferences" replace />;
    } else if (currentStep === 4) {
      return <Navigate to="/onboarding/lifestyle" replace />;
    } else if (currentStep === 5) {
      return <Navigate to="/onboarding/review" replace />;
    } else {
      return <Navigate to="/onboarding/confirmation" replace />;
    }
  }

  // Check if user is trying to access onboarding when already completed
  if (location.pathname.startsWith('/onboarding') && userProfile?.onboarding?.completed) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;




