import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../../contexts/LanguageContext';
import { validateEmail } from '../../../utils/validators';
import { FiMail, FiArrowLeft } from 'react-icons/fi';
import LoadingSpinner from '../../../components/common/LoadingSpinner/LoadingSpinner';
import styles from './ForgotPassword.module.css';

const ForgotPassword = () => {
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors({});
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      // TODO: Implement forgot password API call
      // const result = await authService.forgotPassword(email);

      // For now, just simulate success
      setTimeout(() => {
        setSuccess(true);
        setLoading(false);
      }, 2000);

    } catch (error) {
      setErrors({ submit: 'Failed to send reset email. Please try again.' });
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.logo}>
              <span className={styles.logoIcon}>🍎</span>
              <h1 className={styles.logoText}>SmartNutritrack</h1>
            </div>
            <h2 className={styles.title}>Check Your Email</h2>
            <p className={styles.subtitle}>
              We've sent a password reset link to {email}
            </p>
          </div>

          <div className={styles.successContent}>
            <div className={styles.successIcon}>📧</div>
            <p className={styles.successText}>
              If you don't see the email in your inbox, check your spam folder.
              The link will expire in 24 hours.
            </p>
          </div>

          <div className={styles.footer}>
            <Link to="/login" className={styles.backLink}>
              <FiArrowLeft className={styles.backIcon} />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🍎</span>
            <h1 className={styles.logoText}>SmartNutritrack</h1>
          </div>
          <h2 className={styles.title}>Forgot Password</h2>
          <p className={styles.subtitle}>
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Email Field */}
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              Email Address
            </label>
            <div className={styles.inputContainer}>
              <FiMail className={styles.inputIcon} />
              <input
                type="email"
                id="email"
                value={email}
                onChange={handleChange}
                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                placeholder="Enter your email"
                autoComplete="email"
                disabled={loading}
              />
            </div>
            {errors.email && <span className={styles.error}>{errors.email}</span>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? (
              <LoadingSpinner size="small" message="" />
            ) : (
              'Send Reset Link'
            )}
          </button>

          {/* Submit Error */}
          {errors.submit && (
            <div className={styles.submitError}>
              {errors.submit}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className={styles.footer}>
          <Link to="/login" className={styles.backLink}>
            <FiArrowLeft className={styles.backIcon} />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
