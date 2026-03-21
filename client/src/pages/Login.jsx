import { useContext, useState } from 'react';
import { AuthContext } from '../App';

function Login() {
  const { 
    login, 
    connectWallet, 
    walletAddress, 
    isMetaMaskInstalled,
    walletError,
    setWalletError,
    isConnecting,
    disconnectWallet
  } = useContext(AuthContext);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    
    if (!result.success) {
      setError(result.message);
    }
    
    setLoading(false);
  };

  // Handle wallet connection with error handling
  const handleConnectWallet = async () => {
    setWalletError(null);
    await connectWallet();
  };

  // Handle wallet disconnect
  const handleDisconnectWallet = () => {
    disconnectWallet();
  };

  // Handle clearing wallet error
  const handleClearWalletError = () => {
    setWalletError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white rounded-xl shadow-2xl p-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
            <svg className="h-10 w-10 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Certificate Verification
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Blockchain-Based Academic Certificate System
          </p>
        </div>

        {/* MetaMask Connection Status */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">MetaMask Wallet</span>
            {isMetaMaskInstalled ? (
              walletAddress ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </span>
                  <button
                    onClick={handleDisconnectWallet}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                  className="text-xs text-primary-600 hover:text-primary-800 font-medium disabled:opacity-50"
                >
                  {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
              )
            ) : (
              <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">
                Not Installed
              </span>
            )}
          </div>
          
          {/* Error Message */}
          {walletError && (
            <div className={`mt-3 p-2 rounded-lg text-xs ${
              walletError.toLowerCase().includes('already linked')
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {walletError}
              {walletError.toLowerCase().includes('already linked') && (
                <p className="mt-1">Please switch your MetaMask account before connecting.</p>
              )}
              <button
                onClick={handleClearWalletError}
                className="text-xs text-gray-500 hover:text-gray-700 underline mt-1 block"
              >
                Dismiss
              </button>
            </div>
          )}
          
          {/* Helper Message */}
          {isMetaMaskInstalled && !walletAddress && !walletError && !isConnecting && (
            <p className="mt-2 text-xs text-gray-500">
              Make sure to select the correct MetaMask account. If your wallet is linked to another account, switch accounts in MetaMask first.
            </p>
          )}
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Demo Credentials</span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-gray-600">
              <div className="bg-gray-50 p-2 rounded text-center">
                <span className="block font-medium text-gray-800">Admin</span>
                <span className="block">admin@test.com</span>
              </div>
              <div className="bg-gray-50 p-2 rounded text-center">
                <span className="block font-medium text-gray-800">Student</span>
                <span className="block">student@test.com</span>
              </div>
              <div className="bg-gray-50 p-2 rounded text-center">
                <span className="block font-medium text-gray-800">Verifier</span>
                <span className="block">verifier@test.com</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-center text-gray-500">
              Passwords: Admin@123, Student@123, Verifier@123
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;

