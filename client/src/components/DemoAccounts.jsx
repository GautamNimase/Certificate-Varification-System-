import { motion } from 'framer-motion';
import { Check, GraduationCap, Search, Shield } from 'lucide-react';
import React from 'react';

/**
 * DemoAccounts Component
 * Displays demo account credentials in styled cards
 * Shows Admin, Student, and Verifier demo accounts
 */
const DemoAccounts = () => {
  const [copiedIndex, setCopiedIndex] = React.useState(null);

  const accounts = [
    {
      role: 'Admin',
      email: 'admin@test.com',
      password: 'Admin@123',
      icon: Shield,
      color: 'blue',
    },
    {
      role: 'Student',
      email: 'student@test.com',
      password: 'Student@123',
      icon: GraduationCap,
      color: 'emerald',
    },
    {
      role: 'Verifier',
      email: 'verifier@test.com',
      password: 'Verifier@123',
      icon: Search,
      color: 'purple',
    },
  ];

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      ring: 'ring-blue-100',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      ring: 'ring-emerald-100',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      ring: 'ring-purple-100',
    },
  };

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mt-8"
    >
      {/* Section Title */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="h-px bg-gray-200 flex-1 max-w-[60px]" />
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          Demo Accounts
        </span>
        <div className="h-px bg-gray-200 flex-1 max-w-[60px]" />
      </div>

      {/* Account Cards */}
      <div className="grid grid-cols-3 gap-2">
        {accounts.map((account, index) => {
          const colors = colorClasses[account.color];
          const Icon = account.icon;
          
          return (
            <motion.div
              key={account.role}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className={`
                p-3 rounded-xl border border-gray-100 
                bg-white shadow-sm hover:shadow-md
                transition-shadow duration-200
                text-center group
              `}
            >
              {/* Icon */}
              <div className={`
                inline-flex items-center justify-center w-8 h-8 
                rounded-lg ${colors.bg} mb-2
              `}>
                <Icon className={`w-4 h-4 ${colors.text}`} />
              </div>
              
              {/* Role Label */}
              <p className="text-xs font-semibold text-gray-700 mb-1">
                {account.role}
              </p>
              
              {/* Email */}
              <div className="flex items-center justify-center gap-1">
                <button
                  onClick={() => handleCopy(account.email, index * 2)}
                  className="text-[10px] text-gray-500 hover:text-gray-700 truncate max-w-[80px]"
                  title="Click to copy"
                >
                  {account.email}
                </button>
                {copiedIndex === index * 2 && (
                  <Check className="w-3 h-3 text-green-500" />
                )}
              </div>

              {/* Password */}
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <button
                  onClick={() => handleCopy(account.password, index * 2 + 1)}
                  className="text-[10px] text-gray-400 truncate max-w-[80px]"
                  title="Click to copy"
                >
                  {account.password}
                </button>
                {copiedIndex === index * 2 + 1 && (
                  <Check className="w-3 h-3 text-green-500" />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Hint Text */}
      <p className="text-center text-[10px] text-gray-400 mt-3">
        Click to copy credentials
      </p>
    </motion.div>
  );
};

export default DemoAccounts;

