const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// VerificationLog Model - tracks all certificate verification attempts
const VerificationLog = sequelize.define('verification_logs', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    certificate_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Certificate hash is required' }
        }
    },
    verified_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notNull: { msg: 'Verifier ID is required' },
            isInt: { msg: 'Verifier ID must be an integer' }
        }
    },
    verifier_type: {
        type: DataTypes.ENUM('user', 'verifier'),
        defaultValue: 'verifier'
    },
    verifier_wallet_address: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    verification_result: {
        type: DataTypes.ENUM('VALID', 'REVOKED', 'NOT_FOUND'),
        allowNull: false,
        validate: {
            isIn: [['VALID', 'REVOKED', 'NOT_FOUND']]
        }
    },
    ipfs_cid: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    issuer_name: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    student_name: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'timestamp'
    }
}, {
    timestamps: false,
    tableName: 'verification_logs',
    indexes: [
        { fields: ['certificate_hash'] },
        { fields: ['verified_by'] },
        { fields: ['verifier_type'] },
        { fields: ['verification_result'] },
        { fields: ['timestamp'] }
    ]
});

module.exports = VerificationLog;

