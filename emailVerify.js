var express=require('express');
var bodyParser= require('body-parser')
var ejs= require('ejs')
var mongoose = require('mongoose')
var nodemailer = require("nodemailer");
const session = require('express-session')
const flash=require('express-flash-messages') 
var spawn = require("child_process").spawn; 

const app=express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(flash());
app.use(session({
    secret: 'secret'
  }))

mongoose.connect('mongodb://localhost:27017/cureMeet', {useNewUrlParser: true});


const userSchema = new mongoose.Schema({

  email : String  , 
  status : Boolean
})

const User = mongoose.model("User" , userSchema)


var smtpTransport  = nodemailer.createTransport({      
    host: "smtp.gmail.com",
    auth: {
      type: "login", // default
      user: "ramneek983@gmail.com",
      pass: "// write the password here"
    }
  });
var rand,mailOptions,host,link;
/*------------------SMTP Over-----------------------------*/

/*------------------Routing Started ------------------------*/

app.get('/',function(req,res){
    res.render("tabs.ejs")
});

app.post('/signUp', async  function(req,res){
  const tempUser= await   User.findOne({email : req.body.email} )
   if(tempUser)
    {
        req.flash('notify', 'This Email Already Exists')
        res.render("tabs.ejs")
    }
     
        else
        {
            rand=Math.floor((Math.random() * 100) + 54);
            host=req.get('host');
            link="http://"+req.get('host')+"/verify?id="+rand;
            mailOptions={
                to : req.body.email,
                subject : "Please confirm your Email account",
                html : "Hello,<br> Please Click on the link to verify your email.<br><a href="+link+">Click here to verify</a>" 
            }
            console.log(mailOptions);
            smtpTransport.sendMail(mailOptions, function(error, response){
             if(error){
                    console.log(error);
                    req.flash('notify', 'Some Error Occured While Sending The Mail')
                    res.render("tabs.ejs")
              //  res.end("error");
             }else{
                 
                    console.log("Message sent: " + response.message);
                    req.flash('notify', 'Verification Mail Sent')
                    res.render("tabs.ejs")
              //  res.end("sent");
                 }
        });
        }
    
       
});
app.post('/login' , function(req, res)
{
    User.findOne({email : req.body.email} , function(item)
    {
        if(item)
        {
            var process = spawn('python',["./meeting.py", 
            req.body.email , req.body.password] ); 
        }
        else
        {
            req.flash('notify', 'This Email ID Does Not Exsist PLease Signup Before You Login')
            res.render("tabs.ejs")
        }
    })
})

app.get('/verify',function(req,res){
console.log(req.protocol+":/"+req.get('host'));
if((req.protocol+"://"+req.get('host'))==("http://"+host))
{
    console.log("Domain is matched. Information is from Authentic email");
    if(req.query.id==rand)
    {
        console.log("email is verified");
        var newuser= new User ({
            email : mailOptions.to
        })
        console.log(newuser)
        newuser.save()
        req.flash('notify', 'Signed Up Successfully , Please continue to Login')
        res.render("tabs.ejs")
       // res.end("<h1>Email "+mailOptions.to+" is been Successfully verified");
    }
    else
    {

        console.log("email is not verified");
        req.flash('notify', 'No Gmail Account Exsists With this Email ID , Please Retry')
        res.render("tabs.ejs")
        //res.end("<h1>Bad Request</h1>");
    }
}
else
{
    res.end("<h1>Request is from unknown source");
}
});

/*--------------------Routing Over----------------------------*/

app.listen(3000,function(){
    console.log("Express Started on Port 3000");
});