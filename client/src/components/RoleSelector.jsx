import { motion } from 'framer-motion';
import { ChevronDown, GraduationCap, Search, Shield } from 'lucide-react';
import React from 'react';

/**
 * RoleSelector Component
 * A modern dropdown for selecting user roles (Admin, Student, Verifier)
 * with custom icons and smooth animations
 */
const RoleSelector = ({ value, onChange, error }) => {
  const roles = [
    {
      id: 'admin',
      label: 'Admin',
      icon: Shield,
      description: 'System administrator',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'student',
      label: 'Student',
      icon: GraduationCap,
      description: 'Certificate recipient',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      id: 'verifier',
      label: 'Verifier',
      icon: Search,
      description: 'Verify certificates',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  const [isOpen, setIsOpen] = React.useState(false);
  const selectedRole = roles.find((r) => r.id === value);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Select Role <span className="text-red-500">*</span>
      </label>
      
      <div className="relative">
        {/* Custom Dropdown Trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full flex items-center justify-between px-4 py-3 
            bg-white border-2 rounded-xl transition-all duration-200
            ${error 
              ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100' 
              : 'border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
            }
            focus:outline-none
          `}
        >
          {selectedRole ? (
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${selectedRole.bgColor}`}>
                <selectedRole.icon className={`w-5 h-5 ${selectedRole.color}`} />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">{selectedRole.label}</p>
                <p className="text-xs text-gray-500">{selectedRole.description}</p>
              </div>
            </div>
          ) : (
            <span className="text-gray-400">Choose your role</span>
          )}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </motion.div>
        </button>

        {/* Dropdown Options */}
        <motion.div
          initial={false}
          animate={{ 
            opacity: isOpen ? 1 : 0,
            y: isOpen ? 0 : -10,
            pointerEvents: isOpen ? 'auto' : 'none'
          }}
          transition={{ duration: 0.15 }}
          className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-100 rounded-xl shadow-lg overflow-hidden"
        >
          {roles.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => {
                onChange(role.id);
                setIsOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 
                transition-colors duration-150
                ${value === role.id 
                  ? 'bg-blue-50' 
                  : 'hover:bg-gray-50'
                }
              `}
            >
              <div className={`p-2 rounded-lg ${role.bgColor}`}>
                <role.icon className={`w-5 h-5 ${role.color}`} />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">{role.label}</p>
                <p className="text-xs text-gray-500">{role.description}</p>
              </div>
            </button>
          ))}
        </motion.div>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-500"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};


export default RoleSelector;

