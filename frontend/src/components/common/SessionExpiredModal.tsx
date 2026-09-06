import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import { Modal } from './Modal';
import { Button } from './Button';
import { LogIn, Clock, X } from 'lucide-react';

export const SessionExpiredModal: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionStatus, dismissSessionExpired, clearError } = useAuthStore();
  const [isDismissed, setIsDismissed] = useState(false);

  // If user is already on login or register, do not show session expired dialog
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register';
  const isOpen = sessionStatus === 'EXPIRED' && !isDismissed && !isAuthRoute;

  // Reset local dismissed state if session status changes to EXPIRED anew
  useEffect(() => {
    if (sessionStatus === 'EXPIRED') {
      setIsDismissed(false);
    }
  }, [sessionStatus]);

  const handleClose = () => {
    setIsDismissed(true);
    dismissSessionExpired();
    clearError();
  };

  const handleLogin = () => {
    handleClose();
    if (location.pathname !== '/login') {
      navigate('/login');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Session Expired">
      <div className="space-y-5 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-inner">
          <Clock className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-bold text-slate-200">
            For your security, your session has expired.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Please log in again to continue accessing authorized features.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            leftIcon={<LogIn className="w-4 h-4" />}
            onClick={handleLogin}
          >
            Log In Again
          </Button>
        </div>
      </div>
    </Modal>
  );
};
