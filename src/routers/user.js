const express = require('express');

const User = require('../models/user')

const multer = require('multer');

const sharp = require('sharp')

const auth = require('../middleware/auth')

// Original Router
const router = new express.Router();

// Helper (Multer vs...)

const upload = multer({
   limit: {
      fileSize: 100000000
   }
})



// Endpoints 

// Create a new user

router.post('/users', async (req, res) => {
     const user = new User(req.body)

     try {
        await user.save()

        res.status(201).send(user)
     }
     catch(e) {
        res.status(400).send(e)
     }

})

// Fetch the users

router.get('/users', async (req, res) => {
      
   try {
      const users = await User.find({})
      res.send(users)
   }
   catch (e) {
      res.status(500).send(e)
   }
})

// Login User Routers

router.post('/users/login', async (req, res) => {
   try {
      const user = await User.findByCredentials(req.body.email, req.body.password)
      const token = await user.generateAuthToken()
      res.send({user, token})
   }
   catch(e){
      res.status(500).send(e)
   }

})

// Delete User Router

router.delete('/users/:id', async (req, res) => {
   try {

      const user = await User.findByIdAndDelete(req.params.id)
      if (!user) {
         return res.status(400).send()
      }

      res.send()

   } catch (error) {
      res.status(500).send(error)
   }
})

// Fetch a single User

router.get('/users/:id', async (req, res) => {
   try {
      const _id = req.params.id

      const user = await User.findById(_id)

      if(!user) {
         return res.status(404).send()
      }
      
      res.send(user)
   }
   catch (error) {
      res.status(500).send(error)
   }
})

// Post User Profile Image
                             // auth and upload.single are middleware. They run first and then this code block runs. 
router.post('/users/:id/avatar', auth, upload.single('avatar'), async (req, res) => {
   // do not want to keep the photo as PNG. We want keep it as the code that makes up the image  
   const buf = await sharp(req.file.buffer).resize({ width: 200, height: 200}).jpeg().toBuffer()

   if (req.user.avatar != null) {
      req.user.avatar = null
      req.user.avatarExists = false
   }
   
   req.user.avatar = buf
   req.user.avatarExists = true
   await req.user.save() 

   res.send(buf)
}, (error, req, res, next) => {
   res.status(400).send({error: error.message})
})

//

router.get('/users/:id/avatar', async (req, res) => {
   try {
      const user = await User.findById(req.params.id) 

   
      if(!user || !user.avatar) {
         throw new Error(`The user doesn't exist.`)
      }
      
      // since we are not returning a JSON we need to specify the type.
      
      res.set('Content-Type', 'image/jpg')
      res.send(user.avatar)
   }
   catch (error) {
      res.status(404).send(error)
   }
})

// Route for Follow Function

router.put('/users/:id/follow', auth, async(req, res) => {

   if(req.user.id != req.params.id) {
      try {
         const user = await User.findById(req.params.id)
         const currentUser = await User.findById(req.user.id);
         if(!user.followers.includes(req.user.id)) {
            await user.updateOne({ $push: { followers: req.user.id }})
            await currentUser.updateOne({ $push: { following: req.params.id }})
            res.status(200).json('user has been followed')
         }
         else {
            res.status(403).json('you already following this user')
         }
      }
      catch(e) {
         res.status(500).json(e)
      }
   }
   else {
      res.status(403).json('you cannot follow yourself')
   }
})

// Route for Unfollow a user

router.put('/users/:id/unfollow', auth, async(req, res) => {

   if(req.user.id != req.params.id) {
      try {
         const user = await User.findById(req.params.id)  
         const currentUser = await User.findById(req.user.id)

         if(req.user.following.includes(req.params.id)){
            await user.updateOne( { $pull: { followers: req.user.id } })
            await currentUser.updateOne( { $pull: { following: user.id }})
            res.status(200).json('user has been unfollowed')
         }

         else {
            res.status(403).json('you already do NOT following this user')
         }
      }
      catch(e){
         res.status(500).json(e)
      }
   }
   else {
      res.status(403).json('you cannot unfollow yourself')
   }
})

// Edit profile
    // PUT yerine PATCH kullanıyoruz çünkü kaynağı yalnızca 'kısmen' değiştirmek istiyoruz.

router.patch('/users/:id', auth, async (req, res) => {

   const updates = Object.keys(req.body)
   console.log(updates)

   const allowedUpdates = ['name', 'email', 'password', 'avatar', 'bio', 'website', 'location']

   const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

   if(!isValidOperation) {
      return res.status(400).send({
         error: 'Invalid request'
      })
   }

   try {

      const user = req.user

      updates.forEach((update) => {user[update] = req.body[update]})

      await user.save()

      res.send(user)

   }
   catch(e) {
      res.status(400).send(e)
   }

})


module.exports = router