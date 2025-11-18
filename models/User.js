import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';


const UserSchema = new mongoose.Schema({
name: { type: String },
email: { type: String, required: true, unique: true },
password: { type: String, required: true },
resetToken: { type: String },
resetTokenExpiry: { type: Date }
});


// Hash password before save if modified
UserSchema.pre('save', async function (next) {
if (!this.isModified('password')) return next();
const salt = await bcrypt.genSalt(10);
this.password = await bcrypt.hash(this.password, salt);
next();
});


// Compare password helper
UserSchema.methods.comparePassword = function (candidate) {
return bcrypt.compare(candidate, this.password);
};


export default mongoose.model('User', UserSchema);