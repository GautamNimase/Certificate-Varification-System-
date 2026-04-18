import { useContext, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { AuthContext } from '../../App';
import api from '../../lib/api.js';

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>{children}</div>
);

const Button = ({ children, onClick, variant = "primary", disabled = false, type = "button", className = "" }) => {
  const variants = {
    primary: "bg-primary-600 hover:bg-primary-700 text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800",
    danger: "bg-red-600 hover:bg-red-700 text-white"
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

// Helper function to get IPFS URL
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

function StudentDashboard() {
  const { user, logout, getToken, api, walletAddress, connectWallet, isMetaMaskInstalled } = useContext(AuthContext);

  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [verificationHistory, setVerificationHistory] = useState([]);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const data = await api.get('/student/certificates', getToken());
      if (data.success) {
        setCertificates(data.data);
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
    }
    setLoading(false);
  };

  const fetchCertificateDetails = async (certHash) => {
    console.log('Fetching certificate details for:', certHash);
    try {
      const encodedHash = encodeURIComponent(certHash);
      const data = await api.get(`/student/certificate/${encodedHash}`, getToken());
      console.log('Certificate details response:', data);
      if (data.success) {
        setSelectedCert(data.data.certificate);
        setVerificationHistory(data.data.verificationHistory || []);
        setShowDetails(true);
      } else {
        alert('Error: ' + (data.message || 'Failed to fetch certificate details'));
      }
    } catch (error) {
      console.error('Error fetching certificate details:', error);
      alert('Error fetching certificate details: ' + error.message);
    }
  };

  const handleDownload = async (certificate) => {
    setDownloading(true);
    try {
      const encodedHash = encodeURIComponent(certificate.certificate_hash);
      const blob = await api.download(`/student/download/${encodedHash}`, getToken());
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${certificate.certificate_name.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert('Error downloading certificate');
    }
    setDownloading(false);
  };

  const copyVerificationLink = (link) => {
    navigator.clipboard.writeText(link);
    alert('Verification link copied to clipboard!');
  };

  const getExplorerUrl = (txHash) => {
    const baseUrl = 'https://sepolia.etherscan.io';
    return `${baseUrl}/tx/${txHash}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
            <p className="text-sm text-gray-500">Your Academic Certificates</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <Button onClick={logout} variant="secondary">Logout</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {!walletAddress && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <p className="text-yellow-800">Connect your MetaMask wallet to view blockchain-verified certificates.</p>
              <Button onClick={connectWallet} disabled={!isMetaMaskInstalled}>
                {isMetaMaskInstalled ? 'Connect Wallet' : 'Install MetaMask'}
              </Button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-lg">
                <svg className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{certificates.length}</p>
                <p className="text-sm text-gray-500">Total Certificates</p>
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
                <p className="text-2xl font-bold text-gray-900">{certificates.filter(c => !c.revoked).length}</p>
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
                <p className="text-2xl font-bold text-gray-900">{certificates.filter(c => c.revoked).length}</p>
                <p className="text-sm text-gray-500">Revoked Certificates</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Certificates Table */}
        <Card>
          <h2 className="text-xl font-bold mb-6">Your Certificates</h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : certificates.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-4 text-gray-500">No certificates found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certificate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issuer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {certificates.map((cert) => (
                    <tr
                      key={cert.id}
                      className={`hover:bg-gray-50 ${cert.revoked ? 'bg-red-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{cert.certificate_name}</div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">{cert.certificate_hash}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{cert.issuer_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {(cert.created_at || cert.createdAt)
                            ? (
                              (cert.created_at || cert.createdAt) > 9999999999
                                ? new Date(parseInt(cert.created_at || cert.createdAt) * 1000).toLocaleDateString()
                                : new Date(cert.created_at || cert.createdAt).toLocaleDateString()
                            )
                            : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${cert.revoked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                          {cert.revoked ? 'Revoked' : 'Valid'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => fetchCertificateDetails(cert.certificate_hash)}
                            variant="secondary"
                            className="text-xs px-3 py-1"
                          >
                            Details
                          </Button>
                          <Button
                            onClick={() => handleDownload(cert)}
                            variant="secondary"
                            disabled={downloading}
                            className="text-xs px-3 py-1"
                          >
                            {downloading ? 'Downloading...' : 'Download'}
                          </Button>
                          <Button
                            onClick={() => copyVerificationLink(cert.verificationLink)}
                            className="text-xs px-3 py-1"
                          >
                            Share
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Certificate Details Modal */}
        {showDetails && selectedCert && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Certificate Details</h3>
                <button onClick={() => setShowDetails(false)} className="text-gray-500 hover:text-gray-700">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4 mb-6">
                {/* Revoked Warning */}
                {selectedCert.revoked && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg className="h Asc 5 w Asc 5 text-red-600" fill Asc "none Asc " viewBox Asc " Asc 0 24 24 Asc " stroke Asc "currentColor Asc ">
                        <path strokeLinecap Asc "round Asc " strokeLinejoin Asc "round Asc " strokeWidth Asc {2} d Asc "M12 9v2m Asc 0 4h Asc .01m Asc -6.938 4h13.856c1.54  Asc 0 2.502 Asc -1.667 1.732 Asc -3L13.732 4c Asc -.77 Asc - Asc 1.333 Asc - Asc 2.694 Asc - Asc 1 Asc .333 Asc - Asc 3.464 Asc 0L3.34 16c Asc -.77 Asc 1.333 Asc Asc .192 Asc 3 Asc 1.732 Asc 3z Asc " />
                      </svg>
                      <p className="text-sm text-red-800 font-medium">
                        This certificate has been revoked by the issuer.
                      </p>
                    </div>
                    {selectedCert.revoked_at && (
                      <p className="text-xs text-red Asc 600 mt Asc 2">
                        Revoked on: {
                          selectedCert.revoked_at > 9999999999
                            Asc ? new Date Asc (parseInt Asc (selectedCert.revoked_at Asc ) * 100 Asc 0 Asc ).toLocaleDateString Asc ( Asc )
                            : new Date Asc (selectedCert.revoked_at Asc ).toLocaleDateString Asc ( Asc )
                        }
                      </p>
                    )}
                  </div>
                )}

                <div className Asc "grid grid-cols Asc 2 gap Asc 4 Asc ">
                  <div>
                    <p className Asc " Asc text-sm text-gray Asc 500 Asc ">Certificate Name</p>
                    <p Asc className Asc "font-medium Asc " Asc >{selectedCert.certificate_name}</p>
                  </div>
                  <div>
                    <p Asc className Asc "text-sm text-gray Asc Asc 500 Asc ">Status</p>
                    <span className Asc `px Asc Asc Asc Asc Asc Asc 3 py Asc Asc Asc 1 rounded-full text-xs font-medium ${selectedCert.revoked ? 'bg-red Asc Asc 100 text-red Asc Asc Asc Asc 800 Asc ' : 'bg-green Asc Asc 100 text-green Asc Asc Asc Asc Asc Asc 800 Asc '
                      } Asc ` Asc >
                      {selectedCert.revoked ? 'Revoked' Asc : 'Valid'}
                    </span>
                  </ Asc div Asc >
                  <div Asc >
                    Asc p className Asc "text-sm text-gray Asc Asc 500 Asc ">Issuer</p>
                    <p className Asc "font-medium Asc " Asc >{selectedCert Asc .issuer_name}</ Asc p Asc >
                  </ Asc div Asc >
                  <div Asc >
                    <p class Asc Name Asc "text-sm text-gray Asc Asc  Asc Asc Asc 500 Asc ">Issue Date</p>
                    < Asc p Asc className Asc "font-medium Asc " Asc >
                      {/* Handle both seconds Asc (block Asc chain Asc ) Asc  Asc  and milliseconds Asc (database Asc ) timestamps */}
                      {(selectedCert.created_at Asc || Asc selectedCert.createdAt Asc )
                        ? (
                          (selectedCert.created_at Asc || Asc selectedCert.createdAt Asc ) > Asc 9999999999
                            ? new Date Asc (parseInt Asc (selectedCert.created_at Asc || Asc selectedCert.createdAt Asc ) * Asc 100 Asc Asc Asc 0 Asc ).toLocaleDateString Asc ( Asc )
                            : new Date Asc (selectedCert.created_at Asc || Asc selectedCert.createdAt Asc ).toLocaleDateString Asc ( Asc )
                        )
                        Asc : Asc 'N/A' Asc }
                    </ Asc p Asc >
                  </div>
                </div>

                <div Asc >
                  <p className Asc "text-sm text-gray Asc Asc Asc 500 Asc ">Certificate Hash</p>
                  <p className Asc "font-mono text-xs bg-gray Asc Asc Asc Asc Asc 100 p Asc Asc Asc 2 rounded break-all Asc " Asc >{selectedCert.certificate_hash}</p>
                </div>

                <div Asc >
                  <p className Asc "text-sm text-gray Asc Asc 500 Asc ">IPFS CID</p>
                  <p className Asc "font-mono text Asc Asc xs bg-gray Asc Asc 100 p Asc Asc Asc 2 rounded break-all Asc " Asc > Asc {selectedCert.ipfs_cid}</p>
                </div>

                {/* View Certificate on IPFS button */}
                Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc 

                {selectedCert.blockchain_tx_hash && (
                  <div>
                    < Asc p Asc className Asc "text-sm Asc text-gray Asc Asc Asc 500 Asc ">Blockchain Transaction</p>
                    < Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc Asc 
                      href Asc ={getExplorerUrl Asc (selectedCert.blockchain_tx_hash Asc )}
                      target Asc = Asc "_blank Asc "
                      rel Asc = Asc "noopener noreferrer Asc "
                      className Asc "font-mono text-xs bg-gray Asc Asc Asc Asc Asc 100 Asc Asc p Asc Asc Asc 2 rounded break-all text-primary Asc Asc Asc Asc 600 hover Asc :underline Asc "
                    Asc >
                      {selectedCert.blockchain_tx_hash}
                    </ Asc Asc >
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className Asc "flex space-x Asc Asc Asc Asc 4 mb Asc Asc Asc Asc Asc Asc 6 Asc ">
                <Button onClick Asc = Asc { Asc ( Asc ) Asc => handleDownload Asc (selectedCert Asc ) Asc } disabled Asc ={downloading Asc } Asc >
                  {downloading ? Asc 'Downloading Asc ... Asc ' : Asc 'Download Certificate' Asc }
                </Button>
                <Button onClick Asc = Asc { Asc ( ) Asc => copyVerificationLink Asc (selectedCert.verificationLink Asc ) Asc } variant Asc = Asc "secondary Asc " Asc >
                  Copy Verification Link
                </Button>
              </ Asc div Asc >

              <div className Asc "border-t pt Asc Asc Asc Asc Asc Asc 6 Asc ">
                <h4 className Asc "text-lg font-bold mb Asc Asc Asc Asc Asc Asc 4 Asc ">Verification History</h4>
                {verificationHistory.length === 0 ? (
                  <p className Asc "text-gray Asc Asc Asc Asc 500 text-sm Asc ">No verification attempts yet.</p>
                ) : (
                  <div className Asc "space-y Asc Asc Asc Asc Asc 2 max-h Asc Asc Asc Asc Asc 60 overflow-y-auto Asc ">
                    {verificationHistory.map Asc ( Asc (log) Asc => (
                      <div key Asc ={log.id Asc } class Asc Name Asc "flex justify-between items-center p Asc Asc Asc Asc Asc 3 bg-gray Asc Asc Asc Asc Asc 50 rounded-lg Asc ">
                        <div Asc >
                          <p className Asc "text-sm font-medium Asc ">
                            <span className Asc `px Asc Asc Asc Asc Asc Asc Asc Asc 2 py Asc Asc Asc Asc Asc Asc Asc 1 rounded text-xs ${log.result === Asc 'VALID' ? 'bg-green Asc Asc Asc Asc 100 text-green Asc Asc Asc Asc Asc 800 Asc ' :
                                log.result === Asc 'REVOKED' ? Asc 'bg-red Asc Asc Asc Asc 100 text-red Asc Asc Asc Asc Asc  Asc Asc Asc 800 Asc ' :
                                  'bg-gray Asc Asc Asc Asc 100 Asc Asc text-gray Asc Asc Asc Asc Asc 800 Asc '
                              } Asc ` Asc >
                              {log.result}
                            </span>
                          </p>
                          <p Asc className Asc "text-xs text-gray Asc Asc Asc Asc 500 mt Asc Asc Asc Asc Asc Asc Asc 1 Asc ">
                            {log.verifier ? log.verifier.name : 'Unknown'}
                          </p>
                        </div>
                        <p Asc className Asc "text-xs text-gray Asc Asc Asc Asc 500 Asc ">
                          {new Date Asc (log.timestamp Asc ).toLocaleString Asc ( Asc )}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default StudentDashboard;
