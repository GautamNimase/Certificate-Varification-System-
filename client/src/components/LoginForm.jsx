import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { useState } from 'react';

/**
 * LoginForm Component
 * Modern login form with email and password fields
 * Features:
 * - Show/hide password toggle
 * - Animated error messages
 * - Loading state with spinner
 * - Smooth focus animations
 */
const LoginForm = ({ onSubmit, loading, error, setError }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Clear any previous errors
    setError('');
    onSubmit(email, password);
  };

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
        {error && (
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
            <div>
              <p className="text-sm font-medium text-red-800">Login Failed</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => setError('')}
              className="ml-auto text-red-400 hover:text-red-600 transition-colors"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Field */}
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
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
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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

      {/* Password Field */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password <span className="text-red-500">*</span>
          </label>
          <a 
            href="#" 
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Forgot password?
          </a>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <motion.input
            whileFocus={{ scale: 1.01 }}
            transition={{ duration: 0.15 }}
            type={showPassword ? "text" : "password"}
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            <span>Signing in...</span>
          </>
        ) : (
          <span>Sign In</span>
        )}
      </motion.button>
    </motion.form>
  );
};

export default LoginForm;

