import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

/**
 * AuthCard Component
 * The main centered authentication card
 * Contains: Logo, Title, Subtitle, Tab Switcher, Form Content
 */
const AuthCard = ({ children, activeTab, onTabChange }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.4, 
        ease: [0.25, 0.1, 0.25, 1] 
      }}
      className="
        w-full max-w-md mx-4
        bg-white rounded-3xl
        shadow-2xl shadow-gray-200/50
        border border-gray-100
        overflow-hidden
      "
    >
      {/* Header Section with Logo */}
      <div className="px-8 pt-8 pb-6 text-center bg-gradient-to-b from-gray-50 to-white">
        {/* Logo Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-600/30"
        >
          <ShieldCheck className="w-9 h-9 text-white" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-gray-900 mb-2"
        >
          Certificate Verification
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="text-sm text-gray-500"
        >
          Blockchain-Based Academic Certificate System
        </motion.p>
      </div>

      {/* Tab Switcher */}
      <div className="px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex p-1.5 bg-gray-100 rounded-xl"
        >
          <button
            type="button"
            onClick={() => onTabChange('login')}
            className={`
              flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg
              transition-all duration-200
              ${activeTab === 'login'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => onTabChange('register')}
            className={`
              flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg
              transition-all duration-200
              ${activeTab === 'register'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            Register
          </button>
        </motion.div>
      </div>

      {/* Form Content */}
      <div className="px-8 py-6">
        {children}
      </div>
    </motion.div>
  );
};

export default AuthCard;

