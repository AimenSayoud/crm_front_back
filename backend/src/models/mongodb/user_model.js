const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String },
    password: { type: String, required: true },
    pin1: { type: String },
    pin2: { type: String },
    role: { 
        type: String, 
        enum: ['candidate', 'employer', 'employee', 'admin', 'superadmin'],
        default: 'candidate'
    },
    is_active: { type: Boolean, default: true },
    is_verified: { type: Boolean, default: false },
    profile_picture_url: { type: String },
    last_login: { type: Date },
    refreshToken: { type: String },
    refreshTokenExpiresAt: { type: Date },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

userSchema.pre('save', async function (next) {
    const user = this;
    try {
        const salt = await bcrypt.genSalt(10);
        
        if (user.isModified('password')) {
            user.password = await bcrypt.hash(user.password, salt);
        }
        
        if (user.pin1 && user.isModified('pin1')) {
            user.pin1 = await bcrypt.hash(user.pin1, salt);
        }
        
        if (user.pin2 && user.isModified('pin2')) {
            user.pin2 = await bcrypt.hash(user.pin2, salt);
        }
        
        next();
    } catch (error) {
        next(error);
    }
})

//* Method to compare password
userSchema.methods.isValidPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

//* Method to validate the PIN
userSchema.methods.isPinValid = async function (pin1, pin2) {
    const isPin1Match = await bcrypt.compare(pin1, this.pin1);
    const isPin2Match = await bcrypt.compare(pin2, this.pin2);
    return isPin1Match && isPin2Match;
};

const User = mongoose.models.User || mongoose.model('User', userSchema);
module.exports = User;
