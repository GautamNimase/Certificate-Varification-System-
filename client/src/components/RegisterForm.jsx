import api from '../lib/api';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Eye, EyeOff, GraduationCap, Loader2, Lock, Mail, User } from 'lucide-react';
import { useState } from 'react';
import RoleSelector from './RoleSelector';

/**
 * RegisterForm Component
 * Modern registration form with role selection
 * Features:
 * - Full Name, Email, Password, Confirm Password fields
 * - Role selector (Admin, Student, Verifier)
 * - University ID field (shown only for Student role)
 * - Password confirmation validation
 * - Animated error messages
 * - Loading state with spinner
 */

const RegisterForm = ({ onSubmit, loading, error, setError }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    universityId: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Handle input changes
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (error) setError('');
    if (validationError) setValidationError('');
  };

  // Validate form before submission
  const validateForm = () => {
    // Check required fields
    if (!formData.fullName.trim()) {
      setValidationError('Full name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setValidationError('Email is required');
      return false;
    }
    if (!formData.password) {
      setValidationError('Password is required');
      return false;
    }
    if (!formData.confirmPassword) {
      setValidationError('Please confirm your password');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match');
      return false;
    }
    if (!formData.role) {
      setValidationError('Please select a role');
      return false;
    }
    // Password strength check
    if (formData.password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const response = await api.post('/auth/register', {
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        universityId: formData.role === 'student' ? formData.universityId : undefined
      });

      if (response.data.success) {
        onSubmit({
          success: true,
          message: 'Registration successful! Please login.'
        });
      } else {
        setError(response.data.message || 'Registration failed');
      }

      if (data.success) {
        // Registration successful - trigger login or redirect
        onSubmit({
          success: true,
          message: 'Registration successful! Please login.'
        });
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  // Show error alert
  const displayError = error || validationError;

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {/* Error Alert Box */}
      <AnimatePresence mode="wait">
        {displayError && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="
              flex items-start gap-3 p-4 
              bg-red-50 border border-red-100 rounded-xl
              shadow-sm
            "
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">
                {error ? 'Registration Failed' : 'Validation Error'}
              </p>
              <p className="text-xs text-red-600 mt-0.5">{displayError}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setError('');
                setValidationError('');
              }}
              className="ml-auto text-red-400 hover:text-red-600 transition-colors"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Message */}
      <AnimatePresence>
        {!displayError && !error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="
              flex items-center gap-3 p-4 
              bg-green-50 border border-green-100 rounded-xl
              shadow-sm
            "
          >
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-green-800">
              Registration successful! Please switch to Login tab.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Name Field */}
      <div className="space-y-2">
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
          Full Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <User className="h-5 w-5 text-gray-400" />
          </div>
          <motion.input
            whileFocus={{ scale: 1.01 }}
            transition={{ duration: 0.15 }}
            type="text"
            id="fullName"
            value={formData.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            required
            className="
              w-full pl-12 pr-4 py-3.5 
              bg-gray-50 border-2 border-gray-100 rounded-xl
              text-gray-900 placeholder-gray-400
              focus:outline-none focus:border-blue-500 focus:bg-white
              focus:ring-4 focus:ring-blue-500/10
              transition-all duration-200
              hover:border-gray-200
            "
            placeholder="John Doe"
          />
        </div>
      </div>

      {/* Email Field */}
      <div className="space-y-2">
        <label htmlFor="regEmail" className="block text-sm font-medium text-gray-700">
          Email Address <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <motion.input
            whileFocus={{ scale: 1.01 }}
            transition={{ duration: 0.15 }}
            type="email"
            id="regEmail"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            required
            className="
              w-full pl-12 pr-4 py-3.5 
              bg-gray-50 border-2 border-gray-100 rounded-xl
              text-gray-900 placeholder-gray-400
              focus:outline-none focus:border-blue-500 focus:bg-white
              focus:ring-4 focus:ring-blue-500/10
              transition-all duration-200
              hover:border-gray-200
            "
            placeholder="you@example.com"
          />
        </div>
      </div>

      {/* Role Selector */}
      <RoleSelector
        value={formData.role}
        onChange={(role) => handleChange('role', role)}
        error={!formData.role && validationError ? 'Please select a role' : ''}
      />

      {/* University ID - Only for Student */}
      <AnimatePresence>
        {formData.role === 'student' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            <label htmlFor="universityId" className="block text-sm font-medium text-gray-700">
              University ID <span className="text-gray-400">(Optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <GraduationCap className="h-5 w-5 text-gray-400" />
              </div>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                transition={{ duration: 0.15 }}
                type="text"
                id="universityId"
                value={formData.universityId}
                onChange={(e) => handleChange('universityId', e.target.value)}
                className="
                  w-full pl-12 pr-4 py-3.5 
                  bg-gray-50 border-2 border-gray-100 rounded-xl
                  text-gray-900 placeholder-gray-400
                  focus:outline-none focus:border-blue-500 focus:bg-white
                  focus:ring-4 focus:ring-blue-500/10
                  transition-all duration-200
                  hover:border-gray-200
                "
                placeholder="STU-2024-001234"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Password Field */}
      <div className="space-y-2">
        <label htmlFor="regPassword" className="block text-sm font-medium text-gray-700">
          Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <motion.input
            whileFocus={{ scale: 1.01 }}
            transition={{ duration: 0.15 }}
            type={showPassword ? "text" : "password"}
            id="regPassword"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            required
            className="
              w-full pl-12 pr-14 py-3.5 
              bg-gray-50 border-2 border-gray-100 rounded-xl
              text-gray-900 placeholder-gray-400
              focus:outline-none focus:border-blue-500 focus:bg-white
              focus:ring-4 focus:ring-blue-500/10
              transition-all duration-200
              hover:border-gray-200
            "
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirm Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <motion.input
            whileFocus={{ scale: 1.01 }}
            transition={{ duration: 0.15 }}
            type={showConfirmPassword ? "text" : "password"}
            id="confirmPassword"
            value={formData.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            required
            className="
              w-full pl-12 pr-14 py-3.5 
              bg-gray-50 border-2 border-gray-100 rounded-xl
              text-gray-900 placeholder-gray-400
              focus:outline-none focus:border-blue-500 focus:bg-white
              focus:ring-4 focus:ring-blue-500/10
              transition-all duration-200
              hover:border-gray-200
            "
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showConfirmPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <motion.button
        whileHover={{ scale: loading ? 1 : 1.01, y: loading ? 0 : -1 }}
        whileTap={{ scale: loading ? 1 : 0.99 }}
        type="submit"
        disabled={loading}
        className="
          w-full flex items-center justify-center gap-2
          py-3.5 px-6 
          bg-gradient-to-r from-blue-600 to-indigo-600 
          text-white font-semibold rounded-xl
          shadow-lg shadow-blue-600/25
          hover:shadow-xl hover:shadow-blue-600/30
          focus:outline-none focus:ring-4 focus:ring-blue-500/30
          transition-all duration-200
          disabled:opacity-70 disabled:cursor-not-allowed
          disabled:shadow-none
        "
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Creating account...</span>
          </>
        ) : (
          <span>Create Account</span>
        )}
      </motion.button>
    </motion.form>
  );
};

export default RegisterForm;

