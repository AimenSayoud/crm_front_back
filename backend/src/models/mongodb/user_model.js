const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    // firstName: { type: String, required: true },
    // lastName: { type: String, required: true },
    // username: { type: String, required: true },
    // email: { type: String, required: true, unique: true },
    // phoneNumber: { type: String, required: true },
    // password: { type: String, required: true },
    // pin1: { type: String, required: true },
    // pin2: { type: String, required: true },
    // //accessToken: { type: String },
    // refreshToken: { type: String },
    // //accessTokenExpiresAt: { type: Date },
    // refreshTokenExpiresAt: { type: Date },
});

userSchema.pre('save', async function (next) {
    const user = this;
    if (!user.isModified('password')) return next();
    if (!user.isModified('pin1') && !user.isModified('pin2')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        user.pin1 = await bcrypt.hash(user.pin1, salt);
        user.pin2 = await bcrypt.hash(user.pin2, salt);
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

const User = mongoose.model('User', userSchema);
module.exports = User;
