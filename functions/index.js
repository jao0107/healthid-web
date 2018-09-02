
const express = require("express");
const accountSid = 'AC3ba710b2135ba0534ff328be5efe7558'; // Your Account SID from www.twilio.com/console
const authToken = 'd32c96a6df72ce7db781d16189e77f98';   // Your Auth Token from www.twilio.com/console
const twilio = require('twilio');
const admin = require("firebase-admin");
const serviceAccount = require("../service-account.json");
const app = express();                 // define our app using express
const bodyParser = require('body-parser');
const client = new twilio(accountSid, authToken);
id = "01"
resolvedKey = "resolved"
// initialization  
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://adb-utltrahack.firebaseio.com"
});

const db = admin.database();
const ref = db.ref("/healthid");
app.post("/message",(request,response) =>{
    message = ""
    if (request.body.message){
      message = request.body.message
      message(message)
      response.sendStatus(200)
    } else{
      response.send({ 
        error:"message content is empty"
      })
    }
})

app.get("/prescription/current/:userId",(request,response) =>{
 singlePrescritionListener(request.params.userId,(err,val)=>{
   if (!err){
    response.send(val)
   }else{
     response.sendStatus(500)
   }
 })
})

app.put("/prescription/current/:userId",(request,response) =>{
  ref.child("/patients/"+request.params.userId+"/active_prescription").set(request.body)
  response.send(200)
 })

 app.get("/patient/:userId/fhir",(request,response) =>{

  singleListener("/patients/"+request.params.userId,(err,data)=>{
    fhir = {}
    fhir['resourceType'] = 'Patient'
    fhir['name'] = data.name
    fhir['contact'] = {
      telecom:data.telephone
    }
    console.log(data)
    response.send(fhir)
  })

 })
 


// Helper Functions
function message(content){

    client.messages.create({
        body: content,
        to: '+639159915329',  // Text this number
        from: '+14702803160' // From a valid Twilio number
    })
    .then((message) => console.log(message.sid));
}

function accessListener(id){
  
  // Attach an asynchronous callback to read the data at our posts reference
  ref.child("/access").on("value", function(snapshot) {

   console.log(snapshot.val());
   message("Confirmation Code: 99AC")

    // console.log(snapshot.val());
  }, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
  });
}

function prescritionListener(id){
  
  // Attach an asynchronous callback to read the data at our posts reference
  ref.child("/patients/+"+id+"/active_prescription").on("value", function(snapshot) {

   console.log(snapshot.val());
    if (snapshot.val() != "none"){
      prescriptionMessage = "You have a new prescription added at " + new Date() + ". Please show this link to participating Pharmacies. https://health-id-pharma.herokuapp.com/"
      message(prescriptionMessage)
      console.log(prescriptionMessage)
    } 
    snapshot.forEach(function(childSnapshot){
      if (childSnapshot.val().status == resolvedKey){
        ref.child("/patients/"+id+"/active_prescription/"+childSnapshot.key).set(null)
        ref.child("/patients/"+id+"/records/"+childSnapshot.val().recordId+"/prescription/status").set(resolvedKey)
        console.log("/patients/"+id+"/records/"+childSnapshot.val().recordId+"/prescription/status")
      }
    })

    // console.log(snapshot.val());
  }, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
  });
}

function singlePrescritionListener(id,callback){

  ref.child("/patients/"+id+"/active_prescription").once("value", function(snapshot) {
    console.log(snapshot.val());
    callback(null,snapshot.val())
  }, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
    callback("error",null)
  });

}

function singleListener(uri,callback){

  ref.child(uri).once("value", function(snapshot) {
    console.log(snapshot.val());
    callback(null,snapshot.val())
  }, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
    callback("error",null)
  });

}





// App Export
app.listen(8018);
prescritionListener("01")
accessListener("01")
module.exports = {app}