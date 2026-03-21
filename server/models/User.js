const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

// User Model - represents students, admins, and verifiers
const User = sequelize.define('users', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Name is required' },
            len: [2, 255]
        }
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: { msg: 'Email is required' },
            isEmail: { msg: 'Please provide a valid email address' }
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Password is required' }
        }
    },
    role: {
        type: DataTypes.ENUM('admin', 'student', 'verifier'),
        defaultValue: 'student',
        validate: {
            isIn: [['admin', 'student', 'verifier']]
        }
    },
    wallet_address: {
        type: DataTypes.STRING(255),
        unique: true,
        allowNull: true,
        validate: {
            isEthereumAddress: function(value) {
                if (value && !/^0x[a-fA-F0-9]{40}$/.test(value)) {
                    throw new Error('Invalid Ethereum wallet address');
                }
            }
        }
    }
}, {
    timestamps: true,
    underscored: true,
    tableName: 'users',
    hooks: {
        // Hash password before creating user
        beforeCreate: async (user) => {
            if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        },
        // Hash password before updating if changed
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        }
    }
});

// Method to compare passwords
User.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to return safe user object (without password)
User.prototype.toSafeObject = function() {
    const { password, ...user } = this.toJSON();
    return user;
};

module.exports = User;

