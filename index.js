const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const { Schema } = mongoose;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

let userSchema = new mongoose.Schema({
username : String });

let User = mongoose.model('User', userSchema);

let exerciseSchema = new mongoose.Schema({
  user_id: String,
  description : String,
  duration : Number,
  date : Date 
});

let Exercise = mongoose.model('Exercise', exerciseSchema);

app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get("/api/users", async (req, res)=>{
    let users = await User.find({}).select("_id username");
    if (!users) {
    res.send("No users");
    } else {
    res.json(users);
    }
  });

app.post("/api/users", async (req, res)=>{
    let userObj = new User({ username : req.body.username })
   
  try{
    const user = await userObj.save()
    console.log(user);
    res.json(user)
  }catch(err){
    console.log(err)
  }
})

app.post("/api/users/:_id/exercises", async (req, res)=>{
    let id = req.params._id;
    let { description, duration, date } = req.body;
   
try{
  const user = await User.findById(id)
    if (!user){
      res.send("Could not find user")
    } else {
      const exerciseObj = new Exercise({
        user_id: user._id,
        description,
        duration,
        date: date ? new Date(date) : new Date()
      })
const exercise = await exerciseObj.save()
      res.json({
        _id: user._id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString()
      })
    }
    }catch(err){
  console.log(err);
  res.send("There was an error saving the exercise")
}})

app.get("/api/users/:_id/logs", async (req, res)=>{
  const { from, to, limit} = req.query;
  const id = req.params._id;
  const user = await User.findById(id);
  if(!user){
    res.send("Could not find User")
    return;
  }
  
  let dateObj = {}
  if (from) {
    dateObj["$gte"] = new Date(from)
  }
  if (to) {
    dateObj["$lte"] = new Date(to)
  }

  let filter = {
    user_id: id
  }
  if(from || to){
  filter.date = dateObj;
  }

const exercises = await Exercise.find(filter).limit(+limit ?? 500)

const log = exercises.map(e => ({
  description : e.description,
  duration : e.duration,
  date: e.date.toDateString()
}))

res.json({
  username : user.username,
  count : exercises.length,
  _id:user._id,
  log
})
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

