import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import { Modal } from './Modal';
import { Button } from './Button';
import { LogIn, Clock } from 'lucide-react';

export const SessionExpiredModal: React.FC = () => {
  const navigate = useNavigate();
  const { sessionStatus, clearError } = useAuthStore();
  const isOpen = sessionStatus === 'EXPIRED';

  const handleLogin = () => {
    clearError();
    navigate('/login');
  };

  return (
    <Modal isOpen={isOpen} onClose={handleLogin} title="Session Expired">
      <div className="space-y-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
          <Clock className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-200">
            For your security, your session has expired.
          </p>
          <p className="text-xs text-slate-400">
            Please log in again to continue accessing your account.
          </p>
        </div>

        <Button
          variant="primary"
          className="w-full"
          leftIcon={<LogIn className="w-4 h-4" />}
          onClick={handleLogin}
        >
          Log In Again
        </Button>
      </div>
    </Modal>
  );
};
