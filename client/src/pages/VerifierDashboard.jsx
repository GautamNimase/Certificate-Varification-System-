import { useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from '../App';

// Helper function to format date in DD MMM YYYY format
const formatDate = (dateValue) => {
  // Handle null/undefined
  if (!dateValue || dateValue === 0 || dateValue === '0') return 'N/A';

  let date;

  // If it's a number, treat as Unix timestamp (seconds or milliseconds)
  if (typeof dateValue === 'number') {
    // Check if it's seconds (10 digits) or milliseconds (13 digits)
    const timestamp = dateValue < 10000000000 ? dateValue * 1000 : dateValue;
    date = new Date(timestamp);
  }
  // If it's a string
  else if (typeof dateValue === 'string') {
    // Try parsing as number first
    const num = parseInt(dateValue);
    if (!isNaN(num)) {
      const timestamp = num < 10000000000 ? num * 1000 : num;
      date = new Date(timestamp);
    } else {
      // Try parsing as date string
      date = new Date(dateValue);
    }
  }
  // If it's already a Date object
  else if (dateValue instanceof Date) {
    date = dateValue;
  }

  // Check if date is valid
  if (!date || isNaN(date.getTime())) return 'N/A';

  // Format as DD MMM YYYY
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
};

// Reusable components
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>{children}</div>
);

const Button = ({ children, onClick, variant = "primary", disabled = false, type = "button", className = "" }) => {
  const variants = {
    primary: "bg-primary-600 hover:bg-primary-700 text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    success: "bg-green-600 hover:bg-green-700 text-white"
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

// QR Scanner Component
const QRScanner = ({ onScan, onClose }) => {
  const scannerRef = useRef(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (scannerRef.current) return;

    setScanning(true);
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      /* verbose= */ false
    );

    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        // QR code scanned successfully
        scanner.clear();
        scannerRef.current = null;
        onScan(decodedText);
      },
      (error) => {
        // QR code scan error - ignore most errors as they're expected when no QR is visible
        console.log("QR scan error:", error);
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [onScan]);

  const handleManualEntry = () => {
    const result = prompt('Enter verification URL or hash from QR code:');
    if (result) {
      onScan(result);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Scan QR Code</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div id="qr-reader" className="w-full rounded-lg overflow-hidden"></div>

        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        <p className="text-sm text-gray-600 text-center mb-4">
          Position the QR code within the frame to scan
        </p>

        <Button onClick={handleManualEntry} variant="secondary" className="w-full">
          Enter Manually Instead
        </Button>
      </div>
    </div>
  );
};

// Verification Result Card Component
const VerificationResultCard = ({ result, onClose }) => {
  if (!result) return null;

  const getStatusColor = () => {
    switch (result.result) {
      case 'VALID': return 'bg-green-50 border-green-200';
      case 'REVOKED': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (result.result) {
      case 'VALID':
        return (
          <svg className="h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'REVOKED':
        return (
          <svg className="h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="h-16 w-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getStatusText = () => {
    switch (result.result) {
      case 'VALID': return 'Certificate is Valid';
      case 'REVOKED': return 'Certificate has been Revoked';
      default: return 'Certificate Not Found';
    }
  };

  const getIPFSUrl = (cid) => {
    if (!cid) return null;
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
  };

  // Check if CID is valid (not mock or empty)
  const isValidIPFSCID = (cid) => {
    if (!cid) return false;
    // Check for common mock CID patterns
    const mockPatterns = ['mock', 'test', 'example', 'placeholder', 'demo', ''];
    const cidString = String(cid).toLowerCase().trim();
    return !mockPatterns.some(pattern => cidString === pattern || cidString.includes(pattern));
  };

  return (
    <div className={`rounded-xl p-6 ${getStatusColor()} border`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-4">
          {getStatusIcon()}
          <div>
            <h3 className={`text-xl font-bold ${result.result === 'VALID' ? 'text-green-700' :
              result.result === 'REVOKED' ? 'text-red-700' : 'text-gray-700'
              }`}>
              {getStatusText()}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{result.message}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {result.certificate && (
        <div className="mt-4 bg-white rounded-lg p-4">
          <h4 className="font-medium text-gray-900 border-b pb-2 mb-3">Certificate Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 block">Certificate Name</span>
              <span className="font-medium">{result.certificate.certificateName || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Student Name</span>
              <span className="font-medium">{result.certificate.student?.name || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Issuer University</span>
              <span className="font-medium">{result.certificate.issuerName || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Issue Date</span>
              <span className="font-medium">
                {
                  formatDate(
                    result.certificate.issueDate ||
                    result.certificate.created_at ||
                    result.certificate.createdAt
                  )
                }
              </span>
            </div>
            <div className="md:col-span-2">
              <span className="text-gray-500 block">Certificate Hash</span>
              <span className="font-mono text-xs bg-gray-100 p-2 rounded break-all">
                {result.certificate.certificateHash}
              </span>
            </div>
            {result.certificate.ipfsCID && (
              <div className="md:col-span-2">
                <span className="text-gray-500 block">IPFS CID</span>
                <span className="font-mono text-xs bg-gray-100 p-2 rounded break-all">
                  {result.certificate.ipfsCID}
                </span>
              </div>
            )}
            {/* Also check for ipfs_cid in case API returns snake_case */}
            {result.certificate.ipfs_cid && !result.certificate.ipfsCID && (
              <div className="md:col-span-2">
                <span className="text-gray-500 block">IPFS CID</span>
                <span className="font-mono text-xs bg-gray-100 p-2 rounded break-all">
                  {result.certificate.ipfs_cid}
                </span>
              </div>
            )}
            {result.certificate.blockchainTxHash && (
              <div className="md:col-span-2">
                <span className="text-gray-500 block">Blockchain Transaction</span>
                <a
                  href={`https://sepolia.etherscan.io/tx/${result.certificate.blockchainTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-primary-600 break-all hover:underline"
                >
                  {result.certificate.blockchainTxHash}
                </a>
              </div>
            )}
            {/* Check for valid CID and show button - handles both camelCase and snake_case */}
            {result.result === 'VALID' && isValidIPFSCID(result.certificate.ipfsCID || result.certificate.ipfs_cid) && (
              <div className="md:col-span-2 mt-2">
                <a
                  href={getIPFSUrl(result.certificate.ipfsCID || result.certificate.ipfs_cid)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Certificate on IPFS
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// History Table Component
const HistoryTable = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No verification history yet
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Certificate Hash
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Result
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Student
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Issuer
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {history.map((log) => (
            <tr key={log.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="font-mono text-xs text-gray-600 truncate max-w-xs block">
                  {log.certificate_hash}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${log.verification_result === 'VALID' ? 'bg-green-100 text-green-800' :
                  log.verification_result === 'REVOKED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                  {log.verification_result}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {formatDate(log.timestamp)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {log.student_name || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {log.issuer_name || 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Main Verifier Dashboard Component
function VerifierDashboard() {
  const { user, logout, getToken } = useContext(AuthContext);
  const API_URL = import.meta.env.VITE_API_URL;
  
  const [certificateHash, setCertificateHash] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [stats, setStats] = useState({
    totalVerifications: 0,
    validVerifications: 0,
    revokedDetected: 0,
    notFound: 0
  });
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('verify');

  useEffect(() => {
    fetchStats();
    fetchHistory();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/verifier/stats`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/verifier/history?limit=50`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setHistory(data.data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const handleVerifyByHash = async (hash = certificateHash) => {
    if (!hash) {
      setError('Please provide a certificate hash');
      return;
    }

    setLoading(true);
    setError('');
    setVerificationResult(null);

    try {
      // Extract hash from URL if verification link is provided
      let certHash = hash;
      if (hash.includes('verify?hash=')) {
        const url = new URL(hash);
        certHash = url.searchParams.get('hash');
      }

      const response = await fetch(`${API_URL}/verify/by-hash-auth`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ certificateHash: certHash })
      });

      const data = await response.json();

      if (data.success) {
        setVerificationResult(data);
        fetchStats();
        fetchHistory();
      } else {
        setError(data.message || 'Verification failed');
      }
    } catch (err) {
      setError('Error verifying certificate. Please try again.');
    }

    setLoading(false);
  };

  const handleVerifyByFile = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      setError('Please select a certificate file');
      return;
    }

    setLoading(true);
    setError('');
    setVerificationResult(null);

    const formData = new FormData();
    formData.append('certificate', selectedFile);

    try {
      const response = await fetch(`${API_URL}/verify/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setVerificationResult(data);
        fetchStats();
        fetchHistory();
      } else {
        setError(data.message || 'Verification failed');
      }
    } catch (err) {
      setError('Error verifying certificate');
    }

    setLoading(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type !== 'application/pdf') {
      setError('Only PDF files are allowed');
      return;
    }
    setSelectedFile(file);
    setError('');
    setVerificationResult(null);
  };

  const handleQRScan = (data) => {
    setShowQRScanner(false);
    handleVerifyByHash(data);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Verifier Dashboard</h1>
            <p className="text-sm text-gray-500">Blockchain-Based Academic Certificate Verification</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.verifier_name || user?.name}</p>
              <p className="text-xs text-gray-500">{user?.organization_name || user?.email}</p>
            </div>
            <Button onClick={logout} variant="secondary">Logout</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-lg">
                <svg className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalVerifications}</p>
                <p className="text-sm text-gray-500">Total Verifications</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.validVerifications}</p>
                <p className="text-sm text-gray-500">Valid Certificates</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.revokedDetected}</p>
                <p className="text-sm text-gray-500">Revoked Certificates</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="p-3 bg-gray-100 rounded-lg">
                <svg className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.notFound}</p>
                <p className="text-sm text-gray-500">Not Found</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('verify')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'verify'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Verify Certificate
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'history'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Verification History
            </button>
          </nav>
        </div>

        {/* Verify Certificate Tab */}
        {activeTab === 'verify' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Verification Form */}
            <Card>
              <h2 className="text-xl font-bold mb-6">Certificate Verification</h2>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              {/* Verify by Hash */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verify by Certificate Hash or Link
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={certificateHash}
                    onChange={(e) => setCertificateHash(e.target.value)}
                    placeholder="Enter hash or verification link"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <Button
                    onClick={() => handleVerifyByHash()}
                    disabled={loading}
                  >
                    Verify
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Example: https://app.com/verify?hash=certificateHash
                </p>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">OR</span>
                </div>
              </div>

              {/* Verify by File Upload */}
              <form onSubmit={handleVerifyByFile} className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Certificate PDF
                </label>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="verify-upload"
                    />
                    <label htmlFor="verify-upload" className="cursor-pointer">
                      {selectedFile ? (
                        <div>
                          <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="mt-2 text-sm text-gray-900 font-medium">{selectedFile.name}</p>
                        </div>
                      ) : (
                        <div>
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="mt-2 text-sm text-gray-600">
                            <span className="font-medium text-primary-600">Click to upload</span> PDF
                          </p>
                        </div>
                      )}
                    </label>
                  </div>

                  <Button
                    type="submit"
                    disabled={!selectedFile || loading}
                    className="w-full"
                  >
                    {loading ? 'Verifying...' : 'Verify Certificate'}
                  </Button>
                </div>
              </form>

              {/* QR Code Verification */}
              <div className="border-t pt-6">
                <Button
                  onClick={() => setShowQRScanner(true)}
                  variant="secondary"
                  className="w-full"
                >
                  <svg className="h-5 w-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  Scan QR Code
                </Button>
              </div>
            </Card>

            {/* Verification Result */}
            <div>
              {loading ? (
                <Card>
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
                    <p className="text-gray-500">Verifying certificate...</p>
                  </div>
                </Card>
              ) : verificationResult ? (
                <VerificationResultCard
                  result={verificationResult}
                  onClose={() => setVerificationResult(null)}
                />
              ) : (
                <Card>
                  <div className="text-center py-12 text-gray-500">
                    <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <p className="mt-4">Enter a certificate hash or upload a PDF to verify</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <Card>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Verification History</h2>
              <Button onClick={fetchHistory} variant="secondary">
                Refresh
              </Button>
            </div>
            <HistoryTable history={history} />
          </Card>
        )}

        {/* QR Scanner Modal */}
        {showQRScanner && (
          <QRScanner
            onScan={handleQRScan}
            onClose={() => setShowQRScanner(false)}
          />
        )}
      </main>
    </div>
  );
}

export default VerifierDashboard;

