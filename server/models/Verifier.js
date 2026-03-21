const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

// Verifier Model - represents external verifiers (employers, institutions)
const Verifier = sequelize.define('verifiers', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    organization_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Organization name is required' }
        }
    },
    verifier_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Verifier name is required' }
        }
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: { msg: 'Please provide a valid email' }
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Password is required' }
        }
    },
    wallet_address: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
            isEthereumAddress: { msg: 'Invalid Ethereum wallet address' }
        }
    }
}, {
    timestamps: true,
    underscored: true,
    tableName: 'verifiers',
    indexes: [
        {
            fields: ['email']
        },
        {
            fields: ['organization_name']
        }
    ],
    hooks: {
        beforeCreate: async (verifier) => {
            if (verifier.password) {
                const salt = await bcrypt.genSalt(10);
                verifier.password = await bcrypt.hash(verifier.password, salt);
            }
        },
        beforeUpdate: async (verifier) => {
            if (verifier.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                verifier.password = await bcrypt.hash(verifier.password, salt);
            }
        }
    }
});

// Method to compare password
Verifier.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to return safe object without password
Verifier.prototype.toSafeObject = function() {
    const { password, ...obj } = this.toJSON();
    return obj;
};

module.exports = Verifier;

