const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jsonwebtoken = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if(!validator.isEmail(value)) {
                throw new Error('Invalid email!')
            }  
        }
    },
    password: {
        type: String,
        required: true,
        minLength: 8,
        trim: true,
        validate(value) {
            if(value.toLowerCase().includes('password')) {
                throw new Error('Password cannot contain "password"')
            }
            if(this.minlength < 8) {
                throw new Error("password should include min 8 characters ")
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: false
        }
    }],
    avatar: {
        type: Buffer,
    },
    avatarExists: {
        type: Boolean
    },
    bio: {
        type: String,

    },
    website: {
        type: String
    },
    location: {
        type: String
    },
    followers: {
        type: Array,
        default: []
    },
    following: {
        type: Array,
        default: []
    }
});

// The relationship between the posts and the user

userSchema.virtual('post', {
    ref: 'Post',
    localField: '_id',
    foreignField: 'user'
}) 

// The relationship between the sender and the notification

userSchema.virtual('notificationSent', {
    ref: 'Notification',
    localField: '_id',
    foreignField: 'notSenderId'
})

// The relationship between the receiver and the notification

userSchema.virtual('notificationReceived', {
    ref: 'Notification',
    localField: '_id',
    foreignField: 'notReceiverId'
})


//userSchema.plugin(AutoIncrement, { inc_field: 'seq' });

// Hide password for 3rd parties 

userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()

    delete userObject.password

    return userObject
}

//To Hash the password

userSchema.pre('save', async function(next){
    const user = this

    if (user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

// Create Tokens

userSchema.methods.generateAuthToken = async function() {
    const user = this
    const token = jsonwebtoken.sign({ _id: user._id.toString() }, 'hirewiseapplication') // hirewiseapplication is the secret key. In the whole project this is going to be the secret key.

    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}

// Authentication Check 

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email})

    if (!user) {
        throw new Error('Unable to Login')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new Error('Unable to Login')
    }

    return user
}

// Bu kısmı çıkarabilirsin

userSchema.plugin(AutoIncrement, {inc_field: 'seq'});

//

const User = mongoose.model('User', userSchema)

module.exports = User