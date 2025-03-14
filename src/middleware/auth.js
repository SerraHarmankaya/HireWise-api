const jwt = require('jsonwebtoken');
const User = require('../models/user')

const auth = async (req ,res ,next) => {

    

    try {
        const token = req.header('Authorization').replace('Bearer ', '')

        const decoded = jwt.verify(token, 'hirewiseapplication')

        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })

        if (!user) {
         throw new Error('User does not exist!')
        }

        req.token = token
        req.user = user
        next()
    }
    catch(err) {
        // console.log(req.header('Authorization'));

        res.status(401).send({ error: 'Please Authenticate'})
    }
}

module.exports = auth