const mongoose = require('mongoose')
const express = require('express');
const crypto = require('crypto');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { response } = require('express');
const app = express()
const port = 8080

// const DB = 'mongodb+srv://gameheist:gameheist@gameheistcluster1.gabkk.mongodb.net/sso?retryWrites=true&w=majority';
const DB = 'mongodb+srv://dbadmin:12478444@heistdata.sygrc.mongodb.net/MEANStackDB?retryWrites=true&w=majority';
mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
    }).then(() => {
        console.log("Connection to mongoDB successful")
    }).catch((err) => {
        console.log("Unable to connect mongoDB")
    })

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    dateCreated: {
        type: Date,
        default: Date.now
    },
    hash: String,
    salt: String
});

//method to hash password

userSchema.methods.setPassword = function(password){

// Creating a unique salt for a particular user 
this.salt = crypto.randomBytes(16).toString('hex');

// Hashing user's salt and password with 1000 iterations, 
this.hash = crypto.pbkdf2Sync(password, this.salt,1000, 64, `sha512`).toString(`hex`);
 };
// Method to check the entered password is correct or not 

//method to validate password
userSchema.methods.validPassword = function(password){
    var hash = crypto.pbkdf2Sync(password,  
        this.salt, 1000, 64, `sha512`).toString(`hex`); 
        return this.hash === hash; 
};

const User = new mongoose.model("User",userSchema);

module.exports.getUserbyId = function(id,callback){
    User.findById(id, callback);
}
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//middleware
app.use(function(req, res, next){
  res.header("Access-Control-Allow-Origin","*");
  res.header("Access-Control-Allow-Headers","Origin, X-Requested-With, Content-type, Accept");
  res.header("Access-Control-Allow-Methods","GET,PUT,POST,DELETE,OPTIONS");
  next();
});

app.use(passport.initialize());
app.use(passport.session());

require('./passport.js')(passport);

app.get('/', (req, res) => {
    res.send("Welcome to homepage");
})

// User login api 
app.post('/login', (req, res) => { 
    const email = req.body.email;
    const password = req.body.password;

    // Find user with requested email 
    User.findOne({ email : req.body.email }, function(err, user) { 
        if (user === null) { 
            return res.status(400).send({ 
                success: "false",
                message : "User not found."
            }); 
        } 
        else { 
            if (user.validPassword(req.body.password)) { 
                const token = jwt.sign({data:user}, '123456',{
                    expiresIn : 604800 //1 week
                });
                console.log(token);
                return res.status(201).send({   
                    success: "true",
                    token : "JWT "+token,
                    message : "User Logged In", 
                    user: {
                        id : user._id,
                        name : user.name,
                        email : user.email,
                        mobile: user.mobile
                    }
                }) 
            } 
            else { 
                return res.status(400).send({ 
                    success: "false",
                    message : "Wrong Password"
                }); 
            } 
        } 
    }); 
}); 

app.post('/signup', (req, res, next) => { 
    // Creating empty user object 
        let newUser = new User(); 
    
        // Initialize newUser object with request data 
        newUser.name = req.body.name,     
        newUser.email = req.body.email,  
        newUser.mobile = req.body.mobile,    
        newUser.password=req.body.password
    
        // Call setPassword function to hash password 
        newUser.setPassword(req.body.password); 
    
        // Save newUser object to database 
        newUser.save((err, User) => { 
            if (err) { 
                if(err.code===11000){
                    return res.status(400).send({
                        success: "false",
                        message: "Email address already registered"
                    });
                }
                else{
                console.log(err);
                return res.status(400).send({ 
                    success: "false",
                    message : "Some error Occurred, Kindly contact Admin"
                }); 
            }
            } 
            else { 
                return res.status(201).send({ 
                    success: "true",
                    message : "User added successfully."
                }); 
            } 
        }); 
    }); 

app.get('/profile', passport.authenticate('jwt',{session:false}), (req,res)=>{
res.send({user:req.user});
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})