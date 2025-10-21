import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { validateVerificationCode } from '../../../utils/validators';
import { FiMail, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import LoadingSpinner from '../../../components/common/LoadingSpinner/LoadingSpinner';
import styles from './Verification.module.css';

const Verification = () => {
  const { verifyEmail, resendVerificationCode } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [email, setEmail] = useState('');
  
  const inputRefs = useRef([]);

  useEffect(() => {
    // Get email from location state or redirect to register
    const emailFromState = location.state?.email;
    if (emailFromState) {
      setEmail(emailFromState);
    } else {
      navigate('/register', { replace: true });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    // Start countdown for resend button
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleCodeChange = (index, value) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    // Clear error when user starts typing
    if (errors.code) {
      setErrors(prev => ({ ...prev, code: '' }));
    }
    
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);
    
    const newCode = [...code];
    for (let i = 0; i < digits.length; i++) {
      newCode[i] = digits[i];
    }
    setCode(newCode);
    
    // Focus the next empty input or the last input
    const nextEmptyIndex = newCode.findIndex(digit => !digit);
    const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : 5;
    inputRefs.current[focusIndex]?.focus();
  };

  const validateForm = () => {
    const codeString = code.join('');
    const validation = validateVerificationCode(codeString);
    
    if (!validation.isValid) {
      setErrors({ code: validation.error });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setErrors({});
    
    try {
      const codeString = code.join('');
      const result = await verifyEmail(codeString);
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/onboarding/welcome', { replace: true });
        }, 2000);
      } else {
        setErrors({ submit: result.message });
      }
    } catch (error) {
      setErrors({ submit: 'Verification failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCountdown > 0) return;
    
    setResendLoading(true);
    setErrors({});
    
    try {
      const result = await resendVerificationCode();
      
      if (result.success) {
        setResendCountdown(60); // 60 seconds countdown
        setErrors({ resend: 'Verification code sent successfully!' });
      } else {
        setErrors({ resend: result.message });
      }
    } catch (error) {
      setErrors({ resend: 'Failed to resend code. Please try again.' });
    } finally {
      setResendLoading(false);
    }
  };

  const handleBackToRegister = () => {
    navigate('/register');
  };

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>
            <FiCheckCircle />
          </div>
          <h2 className={styles.successTitle}>Email Verified!</h2>
          <p className={styles.successMessage}>
            Your email has been successfully verified. Redirecting to onboarding...
          </p>
          <div className={styles.loadingContainer}>
            <LoadingSpinner size="small" message="" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.verificationCard}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🍎</span>
            <h1 className={styles.logoText}>SmartNutritrack</h1>
          </div>
          <h2 className={styles.title}>Verify Your Email</h2>
          <p className={styles.subtitle}>
            We've sent a 6-digit verification code to
          </p>
          <p className={styles.email}>{email}</p>
        </div>

        {/* Verification Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Code Input */}
          <div className={styles.codeContainer}>
            <label className={styles.label}>Enter verification code</label>
            <div className={styles.codeInputs}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className={`${styles.codeInput} ${errors.code ? styles.inputError : ''}`}
                  disabled={loading}
                  autoComplete="off"
                />
              ))}
            </div>
            {errors.code && <span className={styles.error}>{errors.code}</span>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading || code.some(digit => !digit)}
          >
            {loading ? (
              <LoadingSpinner size="small" message="" />
            ) : (
              'Verify Email'
            )}
          </button>

          {/* Submit Error */}
          {errors.submit && (
            <div className={styles.submitError}>
              {errors.submit}
            </div>
          )}
        </form>

        {/* Resend Code */}
        <div className={styles.resendSection}>
          <p className={styles.resendText}>
            Didn't receive the code?
          </p>
          <button
            type="button"
            className={styles.resendButton}
            onClick={handleResendCode}
            disabled={resendLoading || resendCountdown > 0}
          >
            {resendLoading ? (
              <LoadingSpinner size="small" message="" />
            ) : resendCountdown > 0 ? (
              `Resend in ${resendCountdown}s`
            ) : (
              'Resend Code'
            )}
          </button>
          
          {errors.resend && (
            <div className={`${styles.resendMessage} ${errors.resend.includes('successfully') ? styles.success : styles.error}`}>
              {errors.resend}
            </div>
          )}
        </div>

        {/* Back to Register */}
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.backButton}
            onClick={handleBackToRegister}
          >
            <FiArrowLeft />
            Back to Registration
          </button>
        </div>
      </div>
    </div>
  );
};

export default Verification;




