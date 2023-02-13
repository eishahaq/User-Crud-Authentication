
const express = require('express')
const morgan = require('morgan')
const mongoose = require('mongoose');
require('dotenv').config();
const bodyParser = require('body-parser'); 
const UserRoute = require("./Routes/userRoute");
const createError = require('http-errors')
const { verifyAccessToken } = require('./helpers/jwt_helper')
const bcrypt = require('bcrypt')

const app = express()

mongoose.set("strictQuery", false);

mongoose.connect('mongodb+srv://Zenfit:Alfklb4BXq2X0hjQ@cluster0.0upkh00.mongodb.net/?retryWrites=true&w=majority');

mongoose.connection.on('error',err => {
    console.log('Connection failed'); 
});

mongoose.connection.on('connected',connected=>{
    console.log('Connected with database sucessfully'); 
})

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json()); 


app.use('/user', UserRoute);

app.get('/', verifyAccessToken, async (req, res, next) => {
    res.send("Hello from express")
});

app.use((err,req,res,next) => {
    res.status(err.status || 500);
    res.json({
        error: {
            status: err.status || 500,
            message: err.message,
        },
    })
})

module.exports = app;