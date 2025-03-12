const jwt = require('jsonwebtoken');
const User = require('../models/user')

const auth = async (req ,res ,next) => {

    // token = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NzQ1ZDFhYzgzOTc1N2U1NmZiOGUxZjEiLCJpYXQiOjE3MzI3NDU3MTd9.qj8cpmY-Xkp_Sm0ZR67avbGtR3jTQbDh-IHp5TLaSzU ' 
    // token is something like (the standard way) that but we do not want the baerer part when we authenticate the user. So for that we need to split the token int the above line.

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