const { sequelize } = require('../config/database');
const User = require('./User');
const Certificate = require('./Certificate');
const VerificationLog = require('./VerificationLog');
const Verifier = require('./Verifier');

// Define associations between models

// User (Admin/Student/Verifier) -> Certificates (issued to student)
User.hasMany(Certificate, { 
    foreignKey: 'student_id', 
    as: 'certificates',
    onDelete: 'CASCADE'
});
Certificate.belongsTo(User, { 
    foreignKey: 'student_id', 
    as: 'student',
    onDelete: 'CASCADE'
});

// User (Verifier) -> VerificationLogs
User.hasMany(VerificationLog, { 
    foreignKey: 'verified_by', 
    as: 'verificationLogs',
    onDelete: 'CASCADE'
});
VerificationLog.belongsTo(User, { 
    foreignKey: 'verified_by', 
    as: 'user',
    onDelete: 'CASCADE'
});

// Verifier -> VerificationLogs
Verifier.hasMany(VerificationLog, { 
    foreignKey: 'verified_by', 
    as: 'verificationLogs',
    onDelete: 'CASCADE'
});
VerificationLog.belongsTo(Verifier, { 
    foreignKey: 'verified_by', 
    as: 'verifier',
    onDelete: 'CASCADE'
});

// Note: We do NOT create a foreign key from VerificationLog to Certificate
// because verification_logs can contain certificate hashes that don't exist
// in the certificates table (for NOT_FOUND verification results)

// Export all models
module.exports = {
    sequelize,
    User,
    Certificate,
    VerificationLog,
    Verifier
};
