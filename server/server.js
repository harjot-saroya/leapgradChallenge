const express = require("express");
const cors = require("cors");
const bodyparser = require("body-parser");
const mongoose = require("mongoose");
const app = express();

//app.use(multer);

// Things to do:
// Not use var, let
// Use Terinary if statements instead of if, else
// Shorten code by using built in functions and remove unecessary loops
// Write out pseudocode before you code
// Look up ES6 Syntax
// Review your own code
// Get Peer Review

mongoose.connect("mongodb+srv://harjot:PJxUKeLGf5W1susl@cluster0.69dag.mongodb.net/leapgrad-data?retryWrites=true&w=majority", {
  useNewUrlParser: true
});
const conn = mongoose.connection;

const userSchema = new mongoose.Schema({
  id: { type: Number },
});

const quizSchema = new mongoose.Schema({
  uid: {type:Number},
  qid: {type:Number},
  questions: {type: Array, required: true}
});

const solutionSchema = new mongoose.Schema({
  uid: {type:Number},
  qid: {type:Number},
  solutions: {type: Array}
});

const quizAttempt = new mongoose.Schema({
  uid: {type:Number},
  uqid: {type:Number},
  qid: {type:Number},
  completed: {type:Number}
});

const quizStat = new mongoose.Schema({
  uid: {type:Number},
  uqid: { type:Number},
  qid: {type:Number},
  score: {type:Number}
});

app.use(cors());
app.use(bodyparser.urlencoded({ extended: true }));


app.get("/", (req, res) => {
  res.send("Get request recieved");
});

const userExists = async(uid) => {
  var db = await conn.collection('users')
  let result = await db.findOne({id: uid})
  return Boolean(result)
}

const quizExists = async(id,qid) => {
  const db = await conn.collection('quizzes')
  const result = await db.findOne({uid: id,qid: qid})
  return result
}

app.post("/createuser/:id", async(req, res) => {
  // Creates user if they don't already exist
  const cid = parseInt(req.params.id)
  res.send("Get request recieved");
  const searched = await userExists(cid)
  if (searched){
    console.log('User exists')
  }
  else {
    const user = mongoose.model('user', userSchema);
    const db = conn.collection('users')
    const test = new user({id:cid})
    db.insertOne(test)
    console.log('User Created')
  }

});

app.get("/quiz/all", async(req, res) => {
  // Allows us to view all submitted quizzes
  res.send("Get request recieved")
  const db = conn.collection('quizzes')
  const result = await db.find().toArray()
  console.log("SUBMITTED QUIZZES")
  result.forEach(element => {
    console.log("Author id: "+ element.uid + " Quiz id: "+ element.qid)
    console.log(element.questions)
    console.log('------------------------')
  })
});

app.get("/:id/stats", async(req, res) => {
  // Allows us to view stats of submitted quizzes
  const id = parseInt(req.params.id)
  res.send("Get request recieved")
  const db = conn.collection('stats')
  const result = await db.find({uid:id}).toArray()
  console.log("STATS FOR USER ID: " + id)
  const db2 = conn.collection('quizattempts')

  for (const element of result) {
    const count = await db2.count({uid:element.uid,qid:element.qid})
    console.log("Author ID: "+ element.uqid +" Quiz id: "+ element.qid + " Total Quiz attempts : "+ count)
    console.log("Score: "+ element.score)
    console.log('------------------------')
  }
});

app.post("/:id/quiz/add/:qid/", async(req, res) => {
  // Allows us to add ONE question to a quiz
  // curl -d '{{"hello":[1]},{"uid":[1]},{"uqid":13}' 'http://localhost:8888/1/quiz/add/13'
  // Change to req.body.uid and req.body.qid

  const uid = parseInt(req.body.uid)
  const qid = parseInt(req.body.qid)

  let inp_quiz = JSON.parse(req.body.quiz)
  const db = conn.collection('quizzes')
  const db2 = conn.collection('quizsolutions')
  let searched = await quizExists(uid,qid)
  if (!searched){
    console.log("Quiz ID not found")
  }
  else
  {
    const query1 = await db.find({uid:uid,qid:qid}).toArray()
    const query2 = await db2.find({uid:uid,qid:qid}).toArray()
    const questions = query1[0].questions
    const solutions = query2[0].solutions
    let key = Object.keys(inp_quiz)
    questions.push(key[0])
    solutions.push(inp_quiz[key][0])
    const newQuiz = await db.updateOne({uid,qid},{$set:{questions}})
    await db2.updateOne({uid,qid},{$set:{solutions}})
    console.log("Succesfuly added item(s)" + newQuiz)
  }
  res.send("Success");
  
});

// let question2 = []
// if(swagBoolean){
//   question2.push(1)
// }
// else{
//   question2.push(2)
// }

// const question2 = swagBoolean ? [1] : [2]

// delete request
app.post("/:id/quiz/deleteitem/:qid/", async(req, res) => {
  // Allows us to delete a question in a quiz
  // Example:
  // curl -XPOST -H "Content-type: application/json" -d '{"what is 1+1":[2]}' 'http://localhost:8888/1/quiz/deleteitem/12'
  // NOTE: This deletes one item at a time 
  // /current user id/quiz/deleteitem/quiz id/ input array here 
  const uid = parseInt(req.params.id)
  const qid = parseInt(req.params.qid)
  const inp_item = req.body
  const db = conn.collection('quizzes')
  const db2 = conn.collection('quizsolutions')
  const searched = await quizExists(uid,qid)
  let curr = null;

  if (!searched){
    console.log("Quiz ID not found")
  }
  else
  {
    const query1 = await db.find({uid:uid,qid:qid}).toArray()
    const query2 = await db2.find({uid:uid,qid:qid}).toArray()
    const questions = query1[0].questions
    const solutions = query2[0].solutions
    curr = Object.keys(inp_item)
    if (query1[0].questions.indexOf(curr[0]) != -1)
    { 
      let ind = query1[0].questions.indexOf(curr[0])
      questions.splice(ind,1)
      solutions.splice(ind,1)
    }
    db.updateOne({uid:uid,qid:qid},{$set:{questions:questions}})
    db2.updateOne({uid:uid,qid:qid},{$set:{solutions:solutions}})
    console.log('Succesfully deleted item')
  }
  res.send("Success");
});

app.delete("/quiz/remove/", async(req, res) => {
  // Allows us to remove a quiz
  // http://localhost:8888/1/quiz/remove/3
  const uid = parseInt(req.body.uid)
  const qid = parseInt(req.body.qid)
  
  const db = conn.collection('quizzes')
  const db2 = conn.collection('quizsolutions')
  const searched = await quizExists(uid,qid)

  if (!searched){
    return console.log("Quiz ID not found")
  }
  db.removeOne({uid:uid,qid:qid})
  db2.removeOne({uid:uid,qid:qid})
  console.log("Quiz removed")

  res.send("Success");
  
});

app.post("/quiz/create/", async(req, res) => {
  // hash must be defined like '{"question":[answers]}'
  // Example:
  // curl -XPOST -H "Content-type: application/json" -d '{"what is 1+1":[2]}' 'http://localhost:8888/1/quiz/create/12'
  // Creates quiz with one question
  // /current user id/quiz/create/new quiz id/ array of hashes
  // Only can create one question
  // Cannot be empty or you'll get a url error
  const uid = parseInt(req.body.uid)
  const qid = parseInt(req.body.qid)
  const inp_quiz = JSON.parse(req.body.quiz)
  console.log(inp_quiz)
  const questions = Object.keys(inp_quiz)
  let solutions = []
  Object.keys(inp_quiz).forEach(element => {solutions.push(inp_quiz[element][0])})
  const searched = await quizExists(uid,qid)
  if (searched){
    console.log('The input Quiz ID already exists under this user ID')
  }
  else {
    const quizModel = mongoose.model('quiz', quizSchema);
    const db = conn.collection('quizzes')
    const quiz = new quizModel({uid, qid, questions})
    const db2= conn.collection('quizsolutions')
    const solutionModel = mongoose.model('soln', solutionSchema);
    const soln = new solutionModel({uid, qid, solutions})
    db.insertOne(quiz)
    db2.insertOne(soln)
    console.log('Quiz Created')
  }
  res.send("success")
});

app.post("/quiz/answer/", async(req, res) => {
  // Allows us to answer solutions to a quiz
  // NOTE: quiz array must be input as so
  // curl -XPOST -d '[4,4,5]' 'http://localhost:8888/1/quiz/answer/1/3'
  // uqid is the id of the user who made the quiz and qid is the quiz id of the quiz you want
  // made by this same user
  // Cannot be empty or you'll get a url error
  
  const uid = parseInt(req.body.uid)
  const qid = parseInt(req.body.qid)

  const uqid = parseInt(req.body.uqid)
  const ans = JSON.parse(req.body.ans)
  const quizcheck = await quizExists(uid,qid)
  const usercheck = await userExists(uid)
  const numQues = quizcheck.questions.length
  // add completed mongodb check
  const correct = 0,completed = 0
  if (usercheck && quizcheck){
    const db = conn.collection('quizsolutions') 
    const result = await db.find({uid:uqid,qid:qid}).toArray()
    const total = ans.filter((element, index) => element == result[0].solutions[index])
    if (total.length == numQues){
      const statModel = mongoose.model('stat', quizStat);
      const db = conn.collection('stats')
      const stat = new statModel({uid:uid, qid:qid, uqid:uqid, score: correct/numQues * 100})
      const attemptModel = mongoose.model('attempt', quizAttempt);
      const db2 = conn.collection('quizattempts')
      const attempt = new attemptModel({uid:uid, qid:qid, uqid:uqid, completed: completed/numQues * 100})
      db.insertOne(stat)
      db2.insertOne(attempt)
      console.log("Quiz succesfully completed")
    }
    else {
      // Build non completed quiz continuation
      console.log("Quiz was not completed, come back later to complete it!")
    }
  }
  else
  {
    console.log("Quiz not found")
  }
  res.send("Success");
  
});

var listener = app.listen(8888, () => console.log("listening on port "+ listener.address().port));
