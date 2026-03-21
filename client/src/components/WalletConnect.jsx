import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, Loader2, Wallet, XCircle } from 'lucide-react';

/**
 * WalletConnect Component
 * Displays MetaMask wallet connection status with modern UI
 * Shows connection state, address, and connect/disconnect actions
 * 
 * Features:
 * - Helper message for MetaMask account selection
 * - Error message display
 * - Manual connect only (no auto-connect)
 */
const WalletConnect = ({ 
  walletAddress, 
  isMetaMaskInstalled, 
  isConnecting, 
  onConnect, 
  onDisconnect,
  error,
  onClearError
}) => {
  
  // Format wallet address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Get truncated address for display
  const displayAddress = walletAddress ? formatAddress(walletAddress) : '';

  // Check if error is about wallet already linked
  const isWalletLinkedError = error && error.toLowerCase().includes('already linked');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 border border-gray-200"
    >
      <div className="flex items-center justify-between">
        {/* Left: Wallet Icon and Label */}
        <div className="flex items-center gap-3">
          <div className={`
            p-2.5 rounded-xl transition-all duration-200
            ${isMetaMaskInstalled 
              ? 'bg-orange-100 text-orange-600' 
              : 'bg-gray-200 text-gray-400'
            }
          `}>
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">MetaMask Wallet</p>
            <p className="text-xs text-gray-500">
              {!isMetaMaskInstalled 
                ? 'Not installed' 
                : walletAddress 
                  ? 'Connected' 
                  : 'Not connected'
              }
            </p>
          </div>
        </div>

        {/* Right: Status and Action Button */}
        <div className="flex items-center gap-3">
          {isMetaMaskInstalled ? (
            walletAddress ? (
              // Connected State
              <div className="flex items-center gap-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1.5 bg-green-100 px-3 py-1.5 rounded-full"
                >
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-medium text-green-700">
                    {displayAddress}
                  </span>
                </motion.div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onDisconnect}
                  className="text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2"
                >
                  Disconnect
                </motion.button>
              </div>
            ) : (
              // Not Connected - Connect Button
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onConnect}
                disabled={isConnecting}
                className="
                  flex items-center gap-2 px-4 py-2 
                  bg-gradient-to-r from-blue-600 to-indigo-600 
                  text-white text-sm font-medium rounded-xl
                  shadow-md hover:shadow-lg
                  transition-all duration-200
                  disabled:opacity-70 disabled:cursor-not-allowed
                "
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4" />
                    <span>Connect Wallet</span>
                  </>
                )}
              </motion.button>
            )
          ) : (
            // MetaMask Not Installed
            <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-full">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-xs font-medium text-red-600">
                Not Installed
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Error Message Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className={`mt-3 p-3 rounded-lg ${
            isWalletLinkedError 
              ? 'bg-amber-50 border border-amber-200' 
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <div className="flex items-start gap-2">
            {isWalletLinkedError ? (
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`text-sm ${isWalletLinkedError ? 'text-amber-800' : 'text-red-800'}`}>
                {error}
              </p>
              {isWalletLinkedError && (
                <p className="text-xs text-amber-700 mt-1">
                  Please switch your MetaMask account before connecting.
                </p>
              )}
              {onClearError && (
                <button
                  onClick={onClearError}
                  className="text-xs text-gray-500 hover:text-gray-700 mt-2 underline"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Helper Message - Show when not connected and MetaMask is installed */}
      {isMetaMaskInstalled && !walletAddress && !isConnecting && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 pt-3 border-t border-gray-200"
        >
          <div className="flex items-start gap-2 text-blue-700 bg-blue-50 p-2 rounded-lg">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="text-xs">
              Make sure to select the correct MetaMask account before connecting. 
              If your wallet is linked to another account, switch accounts in MetaMask first.
            </p>
          </div>
        </motion.div>
      )}

      {/* Installation Hint */}
      {!isMetaMaskInstalled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 pt-3 border-t border-gray-200"
        >
          <p className="text-xs text-gray-500">
            Please install{' '}
            <a 
              href="https://metamask.io/download/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              MetaMask extension
            </a>{' '}
            to connect your wallet
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default WalletConnect;

