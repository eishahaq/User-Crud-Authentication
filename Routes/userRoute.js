const express = require('express');
const router = express.Router();
const User = require('../Models/User');
const createError = require('http-errors')
const mongoose = require('mongoose');
const { authorizationSchema } = require('../helpers/validation')
const { signAccessToken, signRefreshToken, verifyRefreshToken, verifyAccessToken } = require('../helpers/jwt_helper')

//GET REQUEST

router.get('/',(req,res,next) => {
  User.find()
  .then(result => {
    res.status(200).json({
      data:result
    });        
  })
  .catch(err => {
    res.status(500).json({
      error:err
    })
  });
});

//PUT REQUEST 

router.put('/:Userid', verifyAccessToken,async(req,res,next) => {
  const result = await authorizationSchema.validateAsync(req.body) 
  bcrypt.hash(req.body.password, 10, (err, hash) => {
    if (err) {
      return res.status(500).json({
        error: err
      })
    }
    else {
      User.findOneAndUpdate({ _id: req.params.Userid }, {
        $set: {
          firstName: result.firstName,
          lastName: result.lastName,
          password: hash,
          email: result.email
        }
      })
      .then(result => {
        res.status(200).json({
          updated_User: result
        })
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({
          error: err
        });
      });
    }
  });
});

//DELETE REQUEST

router.delete('/:Userid', verifyAccessToken, async (req, res, next) => {
  User.findOneAndUpdate({ _id: req.params.Userid }, {
    $set: {
      status: "INACTIVE"
    }
  })
  .then(result => {
    res.status(200).json({
      updated_user: result
    });
  })
  .catch(err => {
    console.log(err);
    res.status(500).json({
      error: err
    });
  });
});

//POST REQUEST SIGNUP

router.post('/signup', async (req, res, next) => {
  try {
    const result = await authorizationSchema.validateAsync(req.body)
    const doesExist = await User.findOne({ email: result.email })
    if (doesExist) throw createError.Conflict(`${result.email} has already been registered`)
    
    const user = new User({
      firstName:req.body.firstName,
      lastName:req.body.lastName,
      password: req.body.password,
      email:req.body.email,
      status:"ACTIVE" 
    })
    const savedUser = await user.save()
    const accessToken = await signAccessToken(savedUser.id)
    const refreshToken = await signRefreshToken(savedUser.id)
    res.send({ accessToken,refreshToken })
  } catch (error) {
    if (error.isJoi === true) error.status = 422
    next(error)
  }
});



//POST REQUEST LOGIN

router.post('/login', async (req, res, next) => {
  try {
    const result = await authorizationSchema.validateAsync(req.body)
    const user = await User.findOne({ email:result.email })
    
    if (!user) throw createError.NotFound('User not registered')
    if (user.status == "InActive") throw createError.NotFound('User has been deleted')

    const isMatch = await user.isValidPassword(result.password)
    if (!isMatch) throw createError.Unauthorized('Username/password not valid')

    const accessToken = await signAccessToken(user.id)
    const refreshToken = await signRefreshToken(user.id)
    res.send({ accessToken, refreshToken })
  
  } catch (error) {
    if (error.isJoi === true)
    return next(createError.BadRequest("Invalid Username/Password"))
    next(error)
  }
});

router.post('/refresh-token', async (req, res, next) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) throw createError.BadRequest()
    const userId = await verifyRefreshToken(refreshToken)

    const accessToken = await signAccessToken(userId)
    const refToken = await signRefreshToken(userId)
    res.send({ accessToken: accessToken, refreshToken: refToken })
  
  } catch (error) {
    next(error)
  }
});


module.exports = router;