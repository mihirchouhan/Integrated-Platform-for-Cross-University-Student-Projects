const express = require("express");
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require("./db");
var cors = require('cors')
const app = express();
const PORT = 5000; 

app.use(cors());
app.use(express.json());

const College = require("./models/CollegeSchema");
const Student = require("./models/StudentSchema");

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'njain5587@gmail.com',
    pass: 'lwpz kkyp syzo ifdl',
  },
});


// Create a dynamic map to store the relationship between college code and Cname
const collegeCodeMap = new Map();

// Populate the map when the server starts
(async () => {
  try {
    const colleges = await College.find();
    colleges.forEach(college => {
      collegeCodeMap.set(college.code, college.Cname);
      console.log(collegeCodeMap)
    });
  } catch (error) {
    console.error("Error populating collegeCodeMap:", error.message);
  }
})();


app.post('/registerCollege', async (req, res) => {
  try {
    const college = new College(req.body);
    await college.save();

    collegeCodeMap.set(college.code, college.Cname);
    console.log(collegeCodeMap)

    res.json(college);
    console.log("done")
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}); 

app.post('/registerStudent', async (req, res) => {
    try {
      const student = new Student(req.body);
      const collegeCname = collegeCodeMap.get(student.collegeCode);
      if (!collegeCname) {
        res.status(404).json({ error: 'College not found for the given collegeCode.' });
        return;
      }

      var otp = generateOTP();
    await sendOTP(student.email, otp);
    student.otp = otp


      const emailDomain = student.email.split('@')[1];

      // if(collegeCname.toLowerCase()==emailDomain.toLowerCase()){
        
      const college = await College.findOne({ code: student.collegeCode });
      console.log(college)
      if(college!=null){
        
        college.students.push(student._id);
        await college.save(); 
        await student.save();
        res.json(student);
      }
      else{
        res.json({error:"nothing found"})
      }
  

    // }
    // else{
    //   res.json("wrong Credentails")
    // }

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });


  function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  
  // Function to send OTP via email
  async function sendOTP(email, otp) {
    const mailOptions = {
      from: 'njain5587@gmail.com',
      to: email,
      subject: 'Otp functinality bhi implement ker di hai',
      text: `Your OTP is: ${otp}`,
    };
  
    await transporter.sendMail(mailOptions);
  }

app.get('/otp',(req,res)=>{
  const s = new Student(req.body);
  const student = Student.find({otp:s.otp})
  console.log(student)
  if(student){
    res.json("otp matched wowo")
    // res.json({student})
  }
  else{
    res.json("not found")
  }
})

app.get('/students/:collegeCode', async (req, res) => {
  try {
    const collegeCode = req.params.collegeCode;
    const college = await College.findOne({ code: collegeCode }).populate('students');
    if (!college) {
      res.status(404).json({ error: 'College not found.' });
      return; 
    }
    res.json(college.students);
    console.log(college.students)
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
