const mongoose = require('mongoose')
const express = require('express');
const { response } = require('express');
const app = express()
const port = 8080

const DB = 'mongodb+srv://gameheist:gameheist@gameheistcluster1.gabkk.mongodb.net/sso?retryWrites=true&w=majority';

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
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    dateCreated: {
        type: Date,
        default: Date.now
    }
})

const User = new mongoose.model("User",userSchema);

const createDocument = async(user,pass) => {
    try{
        const user1 = new User({
            username: user,
            password: pass
        })

        const result = await user1.save();
        console.log(result);
    }
    catch(err){
        console.log(err);
    }
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

app.get('/', (req, res) => {
    res.send("Welcome to homepage");
})

// app.get('/:username/', (req, res) => {
//     console.log(req.params.username)
//     let user = req.params.username;
//     User.findOne({ username: user }, (err, userData) => {
//         if (err){
//             console.log(err);
//             res.end();
//         }
//         else if(userData){
//             console.log("Result(s) : ", userData);
//             res.send("Welcome "+userData.username)
//         }
//         else{
//             res.send("Invalid user!");
//         }
//     });
// })

app.post('/login', (req, res) => {
    console.log(req.body)
    if(!req.body.username || !req.body.password){
        console.log("Username or password field can't be empty")
        res.redirect(401,'/login');
    }
    else{
        User.findOne({ username: req.body.username }, (err, userData) => {
            if(err){
                console.log(err);
                res.status(500);
            }
            else if(userData){
                console.log("Found one user: ", userData.username);
                if(userData.password === req.body.password){
                    console.log("User verified!");
                    res.redirect(200,'/');
                }
                else{
                    console.log("Invalid password!");
                    res.redirect(401,'/login');
                }
            }
            else{
                console.log("Username doesn't exist")
                res.redirect(401,'/login');
            }
        });
    }
});



app.post('/signup', (req, res) => {
    console.log(req.body)
    if(!req.body.username || !req.body.password){
        console.log("Username or password field can't be empty")
        res.redirect(401,'/signup');
    }
    else{
        User.findOne({ username: req.body.username }, (err, userData) => {
            if(err){
                console.log(err);
                res.status(500);
            }
            else if(userData){
                if(userData.username === req.body.username)
                {
                console.log("Username already exists");
                res.status(403).send("Username already exists");
                }
            }
            else{
                createDocument(req.body.username,req.body.password);
                res.redirect(200,'/');
            }
        });
    }
});





app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})