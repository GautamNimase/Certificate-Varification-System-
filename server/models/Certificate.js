const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Certificate Model - represents academic certificates stored on blockchain and database
const Certificate = sequelize.define('certificates', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    certificate_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: { msg: 'Certificate hash is required' }
        }
    },
    ipfs_cid: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'IPFS CID is required' }
        }
    },
    student_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notNull: { msg: 'Student ID is required' },
            isInt: { msg: 'Student ID must be an integer' }
        }
    },
    issuer_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Issuer name is required' }
        }
    },
    issuer_wallet_address: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Issuer wallet address is required' }
        }
    },
    blockchain_tx: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    blockchain_tx_hash: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    certificate_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Certificate name is required' }
        }
    },
    certificate_description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    file_path: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    revoked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    revoked_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    timestamps: true,
    underscored: true,
    tableName: 'certificates',
    indexes: [
        {
            fields: ['certificate_hash']
        },
        {
            fields: ['student_id']
        },
        {
            fields: ['revoked']
        }
    ]
});

// Method to check if certificate is valid (not revoked)
Certificate.prototype.isValid = function() {
    return !this.revoked;
};

// Method to mark certificate as revoked
Certificate.prototype.markAsRevoked = async function() {
    this.revoked = true;
    this.revoked_at = new Date();
    return await this.save();
};

module.exports = Certificate;

