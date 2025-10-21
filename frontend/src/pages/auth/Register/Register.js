import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { validateEmail, validatePassword, validateName, validatePhoneNumber } from '../../../utils/validators';
import { COUNTRIES } from '../../../utils/constants';
import { FiEye, FiEyeOff, FiMail, FiLock, FiUser, FiPhone, FiChevronDown } from 'react-icons/fi';
import LoadingSpinner from '../../../components/common/LoadingSpinner/LoadingSpinner';
import styles from './Register.module.css';

const Register = () => {
  const { register, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    countryCode: '+1',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleCountrySelect = (countryCode) => {
    setFormData(prev => ({
      ...prev,
      countryCode
    }));
    setIsCountryDropdownOpen(false);
    
    if (errors.countryCode) {
      setErrors(prev => ({
        ...prev,
        countryCode: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // First Name
    const firstNameValidation = validateName(formData.firstName);
    if (!firstNameValidation.isValid) {
      newErrors.firstName = firstNameValidation.error;
    }
    
    // Last Name
    const lastNameValidation = validateName(formData.lastName);
    if (!lastNameValidation.isValid) {
      newErrors.lastName = lastNameValidation.error;
    }
    
    // Email
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Phone
    const phoneValidation = validatePhoneNumber(formData.phone, formData.countryCode);
    if (!phoneValidation.isValid) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    // Password
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = Object.values(passwordValidation.errors).filter(Boolean)[0];
    }
    
    // Confirm Password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Terms Agreement
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the Terms & Conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const registrationData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        countryCode: formData.countryCode,
        password: formData.password
      };
      
      const result = await register(registrationData);
      
      if (result.success) {
        navigate('/login', { 
          state: { email: formData.email },
          replace: true 
        });
      } else {
        setErrors({ submit: result.message });
      }
    } catch (error) {
      setErrors({ submit: 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    let strength = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    strength = Object.values(checks).filter(Boolean).length;
    
    return {
      strength,
      checks,
      percentage: (strength / 5) * 100
    };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className={styles.container}>
      <div className={styles.registerCard}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🍎</span>
            <h1 className={styles.logoText}>SmartNutritrack</h1>
          </div>
          <h2 className={styles.title}>Create Account</h2>
          <p className={styles.subtitle}>Join SmartNutritrack to start your nutrition journey</p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Name Fields */}
          <div className={styles.nameFields}>
            <div className={styles.field}>
              <label htmlFor="firstName" className={styles.label}>
                First Name
              </label>
              <div className={styles.inputContainer}>
                <FiUser className={styles.inputIcon} />
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`${styles.input} ${errors.firstName ? styles.inputError : ''}`}
                  placeholder="Enter your first name"
                  autoComplete="given-name"
                  disabled={loading}
                />
              </div>
              {errors.firstName && <span className={styles.error}>{errors.firstName}</span>}
            </div>

            <div className={styles.field}>
              <label htmlFor="lastName" className={styles.label}>
                Last Name
              </label>
              <div className={styles.inputContainer}>
                <FiUser className={styles.inputIcon} />
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`${styles.input} ${errors.lastName ? styles.inputError : ''}`}
                  placeholder="Enter your last name"
                  autoComplete="family-name"
                  disabled={loading}
                />
              </div>
              {errors.lastName && <span className={styles.error}>{errors.lastName}</span>}
            </div>
          </div>

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
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                placeholder="Enter your email"
                autoComplete="email"
                disabled={loading}
              />
            </div>
            {errors.email && <span className={styles.error}>{errors.email}</span>}
          </div>

          {/* Phone Field */}
          <div className={styles.field}>
            <label htmlFor="phone" className={styles.label}>
              Phone Number
            </label>
            <div className={styles.phoneContainer}>
              <div className={styles.countrySelector}>
                <button
                  type="button"
                  className={`${styles.countryButton} ${errors.countryCode ? styles.inputError : ''}`}
                  onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                  disabled={loading}
                >
                  <img
                    src={COUNTRIES.find(c => c.code === formData.countryCode)?.flag || 'https://flagcdn.com/w40/us.png'}
                    alt={COUNTRIES.find(c => c.code === formData.countryCode)?.name || 'United States'}
                    className={styles.countryFlag}
                  />
                  <span className={styles.countryCode}>{formData.countryCode}</span>
                  <FiChevronDown className={styles.chevronIcon} />
                </button>
                
                {isCountryDropdownOpen && (
                  <div className={styles.countryDropdown}>
                    {COUNTRIES.map(country => (
                      <button
                        key={country.code}
                        type="button"
                        className={`${styles.countryOption} ${formData.countryCode === country.code ? styles.selected : ''}`}
                        onClick={() => handleCountrySelect(country.code)}
                      >
                        <img
                          src={country.flag}
                          alt={country.name}
                          className={styles.countryFlag}
                        />
                        <span className={styles.countryCode}>{country.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className={styles.phoneInputContainer}>
                <FiPhone className={styles.inputIcon} />
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`${styles.input} ${styles.phoneInput} ${errors.phone ? styles.inputError : ''}`}
                  placeholder="Enter your phone number"
                  autoComplete="tel"
                  disabled={loading}
                />
              </div>
            </div>
            {errors.phone && <span className={styles.error}>{errors.phone}</span>}
          </div>

          {/* Password Field */}
          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <div className={styles.inputContainer}>
              <FiLock className={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                placeholder="Create a strong password"
                autoComplete="new-password"
                disabled={loading}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={togglePasswordVisibility}
                disabled={loading}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {formData.password && (
              <div className={styles.passwordStrength}>
                <div className={styles.strengthBar}>
                  <div 
                    className={`${styles.strengthFill} ${styles[`strength${passwordStrength.strength}`]}`}
                    style={{ width: `${passwordStrength.percentage}%` }}
                  ></div>
                </div>
                <div className={styles.strengthText}>
                  Password strength: {['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength.strength - 1] || 'Very Weak'}
                </div>
                <div className={styles.passwordChecks}>
                  <div className={`${styles.check} ${passwordStrength.checks.length ? styles.valid : ''}`}>
                    At least 8 characters
                  </div>
                  <div className={`${styles.check} ${passwordStrength.checks.uppercase ? styles.valid : ''}`}>
                    One uppercase letter
                  </div>
                  <div className={`${styles.check} ${passwordStrength.checks.lowercase ? styles.valid : ''}`}>
                    One lowercase letter
                  </div>
                  <div className={`${styles.check} ${passwordStrength.checks.number ? styles.valid : ''}`}>
                    One number
                  </div>
                  <div className={`${styles.check} ${passwordStrength.checks.special ? styles.valid : ''}`}>
                    One special character
                  </div>
                </div>
              </div>
            )}
            
            {errors.password && <span className={styles.error}>{errors.password}</span>}
          </div>

          {/* Confirm Password Field */}
          <div className={styles.field}>
            <label htmlFor="confirmPassword" className={styles.label}>
              Confirm Password
            </label>
            <div className={styles.inputContainer}>
              <FiLock className={styles.inputIcon} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
                placeholder="Confirm your password"
                autoComplete="new-password"
                disabled={loading}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={toggleConfirmPasswordVisibility}
                disabled={loading}
              >
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {errors.confirmPassword && <span className={styles.error}>{errors.confirmPassword}</span>}
          </div>

          {/* Terms Agreement */}
          <div className={styles.field}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                disabled={loading}
                className={errors.agreeToTerms ? styles.checkboxError : ''}
              />
              <span className={styles.checkboxText}>
                I agree to the{' '}
                <Link to="/terms" className={styles.link} target="_blank">
                  Terms & Conditions
                </Link>
                {' '}and{' '}
                <Link to="/privacy" className={styles.link} target="_blank">
                  Privacy Policy
                </Link>
              </span>
            </label>
            {errors.agreeToTerms && <span className={styles.error}>{errors.agreeToTerms}</span>}
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
              'Create Account'
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
          <p className={styles.footerText}>
            Already have an account?{' '}
            <Link to="/login" className={styles.signinLink}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;




