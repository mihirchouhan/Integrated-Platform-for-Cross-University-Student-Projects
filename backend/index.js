const express = require("express");
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require("./db");
var cors = require('cors')
const app = express();
const PORT = 5000;

const multer = require('multer');
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.json());

const College = require("./models/CollegeSchema");
const Student = require("./models/StudentSchema");
const Project = require("./models/ProjectSchema")

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
let otpMap = {};
app.post('/sendotp', async (req, res) => {
  try {
    const student = new Student(req.body);
    const email = req.body.email;
    const existingStudent = await Student.findOne({ email });

    if (existingStudent) {
      return res.status(409).json({ error: 'Email already exists. Please use a different email.' });
    }


    const collegeCname = collegeCodeMap.get(student.collegeCode);
    const emailDomain = student.email.split('@')[1];
    console.log(collegeCname)
    console.log(emailDomain)
    if (collegeCname.toLowerCase() == emailDomain.toLowerCase()) {
      var otp = generateOTP();
      console.log(otpMap)
      otpMap[student.email] = otp.toString();
      console.log(otpMap)
      await sendOTP(student.email, otp);
      res.json({ message: 'OTP sent successfully', succes: true });
    }
    else {
      res.json("wrong Credentails")
    }

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

app.post('/registerStudent', async (req, res) => {

  const email = req.body.email;
  const existingStudent = await Student.findOne({ email });

    if(existingStudent)
    {
      return res.status(409).json({ message: 'Email already exists. Please use a different email.' });
    }     


  await transporter.sendMail(mailOptions);
}

app.post('/registerStudent', async (req, res) => {


  const enteredOtp = req.body.otp;
  const em = req.body.email;
  // const em = "insanegaming5587@gmail.com"
  const student = new Student(req.body);

  const storedOtp = otpMap[em];
  console.log(storedOtp)

  
  if (!storedOtp) {
    return res.status(400).json({ message: 'Email not registered. Please register first.' });
  }
  
  const collegeCname = collegeCodeMap.get(student.collegeCode);
  if (!collegeCname) {
    res.status(404).json({ message: 'College not found for the given collegeCode.' });
    return;
  }
  
   if(enteredOtp == storedOtp){


  // if (!storedOtp) {
  //   return res.status(400).json({ error: 'Email not registered. Please register first.' });
  // }

  // const collegeCname = collegeCodeMap.get(student.collegeCode);
  // if (!collegeCname) {
  //   res.status(404).json({ error: 'College not found for the given collegeCode.' });
  //   return;
  // }


  if (enteredOtp == storedOtp) {


    const college = await College.findOne({ code: student.collegeCode });
    console.log(college)
    if (college != null) {
      const { collegeCode, password } = req.body

      college.students.push(student._id);
      await college.save();
      // await student.save(); 
      const newUser = new Student({ email: em, password: password, collegeCode: collegeCode })
      await newUser.save();
      console.log(`Registration successful for email: ${em}`);
      res.json({ success: true, message: 'Registration successful!' });
    }
    else {
      res.json({ error: "nothing found" })
    }

  }
  else {
    res.json("incorect oopt")
  }

}


})


app.post('/Studentlogin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user with the provided email
    const user = await Student.findOne({ email });

    // If the user is not found, or the password is incorrect, return an error
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    res.json({ success: true, message: 'Login successful!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// All Project apis
// const path = require('path');
// const static_path = path.join(__dirname, "/upload");
// console.log(static_path)  
// app.use(express.static(static_path)) 
// app.use(express.static("upload")) 
 
// Set up Multer for file uploads

// const storage = multer.diskStorage({
//   destination: "upload",
//   filename: (req, file, cb) => {
//       cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname))
//   }
// })
// const upload = multer({ storage: storage })  

// app.post('/upload', upload.single('pdf'), (req, res) => {
//   const { Projectname,Description } = req.body;
//   const pdfPath = req.file.filename;

//   // Save project details to MongoDB
//   const newProject = new Project({
//     Projectname: Projectname, 
//     // Tag: Tag,        
//     Description: Description,  
//     pdfPath: pdfPath
//   });

//   newProject.save()
//   .then(() => {
//     res.send('Project uploaded successfully!');
//   })
//   .catch(err => {
//     console.error(err);
//     res.send("not done")
//   });

// });



const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('file'), async (req, res) => {
  const { name, description ,tag,url } = req.body;
  const filePath = req.file.path;
  isGlobal = false; 
  CollegeCode = "2020";

  const newFile = new Project({filePath,name,description ,tag,isGlobal,CollegeCode,url });
   
  try {
    await newFile.save();
    res.status(201).send('File uploaded successfully');
  } catch (err) {
    res.status(500).send(err.message);
  }
});


app.get('/projects/', async (req, res) => {
  try {
    const projects = await Project.find();
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/projects/:collegeCode', async (req, res) => {
  const { collegeCode } = req.params;

  try {
    const projects = await Project.find({ CollegeCode: collegeCode });
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




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
