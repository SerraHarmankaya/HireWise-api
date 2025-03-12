const express = require('express');
const multer = require('multer')
const sharp = require('sharp')

const Post = require('../models/post');

// New Router
const router = new express.Router();

const auth = require('../middleware/auth');

// Helper Functions

const upload = multer({
    limit: {
        fileSize: 100000000
    }
})


// Posting experience

router.post('/posts', auth, async(req, res) => {
    const post = new Post({
        ...req.body,
        user: req.user._id
    })

    try {
        await post.save()
        res.status(201).send(post)
    }
    catch (error) {
        res.status(400).send(error)
    }
})

// Add Image to Post Route, Upload a picture for a post 

router.post('/uploadPostImage/:id', auth, upload.single('upload'), async(req, res) => {
    const post = await Post.findOne({ _id: req.params.id })
    console.log(req.params.id);


    if (!post) {
        throw new Error('Cannot find the post')
    }

    const buffer = await sharp(req.file.buffer).resize({ width: 350, height: 360 }).png().toBuffer()
    post.image = buffer
    
    console.log("Dönen Resim:", post.image);
 
    await post.save()
    res.send()

}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

// Fetching all posts 

router.get('/posts', async(req, res) => {

    try {
        const posts = await Post.find({})
        res.send(posts)
    }
    catch (e) {
        res.status(500).send(e)
    }
})

// Fetch Specific User's Posts (For their profiles)

router.get('/posts/:id', async(req, res) => {

    const _id = req.params.id

    try {
        const posts = await Post.find({ user: _id })

        if(!posts) {
            return res.status(404).send()
        }

        res.send(posts)
    }
    catch (e) {
        res.status(500).send(e)
    }
})

// Fetch Post Image (Display Image)

router.get('/posts/:id/image', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)

        if(!post && !post.image){
            throw new Error('Post image does not exist.')        
        }

        res.set('Content-Type', 'image/jpg')
        res.send(post.image)
    }
    catch (error) {
        res.status(404).send(error)
    }
});

// Like a Post Function

router.put('/posts/:id/like', auth, async (req, res) => {
    
    try {
        const post = await Post.findById(req.params.id)
        // control if the user already liked that post.
        if(!post.likes.includes(req.user.id)){
            await post.updateOne({ $push: { likes: req.user.id }})
            console.log("Buraya girmesi lazım")
            res.status(200).json('Post has been liked.')
        }
        else {
            res.status(403).json( 'you have already liked this post')
        }
    }
    catch (error) {
        res.status(500).json(error)
    }
})

// Unlike a Post

router.put('/posts/:id/unlike', auth, async(req, res) => {

    try {
        const post = await Post.findById(req.params.id)

        if(post.likes.includes(req.user.id)){
            await post.updateOne({ $pull: { likes: req.user.id }});
            res.status(200).json('Post has been unliked.')
        }
        else {
            res.status(403).json(`You can not unlike a post you haven't liked yet.`)
        }
    }
    catch (e) {
        res.status(500).json(e)
    }
})
module.exports = router;