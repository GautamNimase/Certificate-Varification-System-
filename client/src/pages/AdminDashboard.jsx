import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../App';

// Reusable components
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>{children}</div>
);

const Button = ({ children, onClick, variant = "primary", disabled = false, className = "" }) => {
  const variants = {
    primary: "bg-primary-600 hover:bg-primary-700 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800"
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

function AdminDashboard() {
  const { user, logout, getToken, api, walletAddress, connectWallet } = useContext(AuthContext);
  
  const [activeTab, setActiveTab] = useState('issue');
  const [students, setStudents] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Form states
  const [selectedStudent, setSelectedStudent] = useState('');
  const [certificateName, setCertificateName] = useState('');
  const [certificateDescription, setCertificateDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  useEffect(() => {
    fetchStudents();
    fetchCertificates();
  }, []);

const fetchStudents = async () => {
  console.log("Fetching students...");  // 👈 add this

  try {
    const data = await api.get('/users/students', getToken());
    console.log("Students API response:", data); // 👈 add this

    if (data.success) {
      setStudents(data.data);
    }
  } catch (error) {
    console.error("Error fetching students:", error);
  }
};

  const fetchCertificates = async () => {
    try {
      const data = await api.get('/certificate/all', getToken());
      if (data.success) {
        const formattedData = data.data.map(cert => ({
          ...cert,
          createdAt: cert.created_at
        }));
        setCertificates(formattedData);
      }
    } catch (error) {
      console.error("Error fetching certificates:", error);
    }
  };

  const handleIssueCertificate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (!selectedStudent || !certificateName || !selectedFile) {
      setMessage({ type: 'error', text: 'Please fill all required fields' });
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('certificate', selectedFile);
    formData.append('studentId', selectedStudent);
    formData.append('certificateName', certificateName);
    formData.append('certificateDescription', certificateDescription);

    try {
      const data = await api.upload('/certificate/issue', formData, getToken());
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Certificate issued successfully!' });
        // Reset form
        setSelectedStudent('');
        setCertificateName('');
        setCertificateDescription('');
        setSelectedFile(null);
        fetchCertificates();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error issuing certificate' });
    }
    
    setLoading(false);
  };

  const handleRevokeCertificate = async (certificateId) => {
    if (!confirm('Are you sure you want to revoke this certificate?')) return;
    
    setLoading(true);
    try {
      const data = await api.post('/certificate/revoke', { certificateId }, getToken());
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Certificate revoked successfully!' });
        fetchCertificates();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error revoking certificate' });
    }
    
    setLoading(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type !== 'application/pdf') {
      setMessage({ type: 'error', text: 'Only PDF files are allowed' });
      return;
    }
    setSelectedFile(file);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">University Certificate Authority</p>
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
        {/* Wallet Connection */}
        {!walletAddress && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <p className="text-yellow-800">Connect your MetaMask wallet to issue certificates on the blockchain.</p>
              <Button onClick={connectWallet}>Connect Wallet</Button>
            </div>
          </div>
        )}

        {/* Message Alert */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('issue')}
              className={`py-3 px-6 font-medium ${activeTab === 'issue' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Issue Certificate
            </button>
            <button
              onClick={() => setActiveTab('view')}
              className={`py-3 px-6 font-medium ${activeTab === 'view' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              View Certificates
            </button>
          </div>
        </div>

        {/* Issue Certificate Tab */}
        {activeTab === 'issue' && (
          <Card>
            <h2 className="text-xl font-bold mb-6">Issue New Certificate</h2>
            <form onSubmit={handleIssueCertificate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Student *</label>
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">Select a student</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.name} ({student.email})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Certificate Name *</label>
                  <input
                    type="text"
                    value={certificateName}
                    onChange={(e) => setCertificateName(e.target.value)}
                    placeholder="e.g., Bachelor of Science in Computer Science"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={certificateDescription}
                  onChange={(e) => setCertificateDescription(e.target.value)}
                  rows={3}
                  placeholder="Additional details about the certificate"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Certificate PDF *</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">Only PDF files are allowed (max 10MB)</p>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Issuing...' : 'Issue Certificate'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* View Certificates Tab */}
        {activeTab === 'view' && (
          <div className="space-y-6">
            <Card>
              <h2 className="text-xl font-bold mb-4">All Issued Certificates</h2>

              {certificates.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No certificates issued yet
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Certificate
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Issued Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200">
                      {certificates.map(cert => (
                        <tr key={cert.id} className="hover:bg-gray-50">
                          
                          {/* Certificate */}
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900">
                              {cert.certificate_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {cert.certificate_hash?.substring(0, 20)}...
                            </p>
                          </td>

                          {/* Student */}
                          <td className="px-6 py-4">
                            <p className="text-gray-900">
                              {cert.student?.name || 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {cert.student?.email || 'N/A'}
                            </p>
                          </td>

                          {/* Issued Date */}
                          <td className="px-6 py-4 text-gray-500">
                            {cert.createdAt
                              ? new Date(cert.createdAt).toLocaleDateString()
                              : 'N/A'}
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                cert.revoked
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {cert.revoked ? 'Revoked' : 'Valid'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4">
                            {!cert.revoked && (
                              <Button
                                onClick={() => handleRevokeCertificate(cert.id)}
                                variant="danger"
                                className="text-sm"
                              >
                                Revoke
                              </Button>
                            )}
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
