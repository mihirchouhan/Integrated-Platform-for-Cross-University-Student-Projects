const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');
require("./db");
const College = require("./models/CollegeSchema");
const Student = require("./models/StudentSchema");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors()); 

let otpMap = {};

app.post('/register', async (req, res) => {
  try {
    const email = req.body.email;
    const existingStudent = await Student.findOne({ email });

    if(existingStudent)
    {
      return res.status(409).json({ error: 'Email already exists. Please use a different email.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    otpMap[email] = otp.toString();

    console.log(`Generated OTP ${otp} for email ${email}`);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: "pradhumntahekar@gmail.com",
        pass: "sjbsmemdzryhtzlv"
      }
    });

    const mailOptions = {
      from: 'pradhumntahekar@gmail.com',
      to: email,
      subject: 'OTP for Registration',
      text: `Your OTP for registration is: ${otp}`
    };

    await transporter.sendMail(mailOptions);

    console.log(`Sent OTP email to ${email}`);

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/verify', async (req, res) => {
  try {
    const email = req.body.email;
    const enteredOtp = req.body.otp;

    
    const storedOtp = otpMap[email];

    console.log(`Entered OTP: ${enteredOtp} and Entered email: ${email}, Stored OTP: ${storedOtp} for email: ${email}`);

    if (!storedOtp) {
      return res.status(400).json({ error: 'Email not registered. Please register first.' });
    }
 
    if (enteredOtp === storedOtp) {
      try {
        const student = new Student(req.body);

        // Find the corresponding college
        const college = await College.findOne({ code: student.collegeCode });

        if (college != null) {
          college.students.push(student._id);
          await college.save();
          await student.save();
          res.json(student);
        } else {
          res.json({ error: "College not found" });
        }
        console.log("student done");
      } catch (error) {
        res.status(500).json({ error: error.message });
      }

      console.log(`Registration successful for email: ${email}`);
      res.json({ success: true, message: 'Registration successful!' });
    } else {
      console.log(`Incorrect OTP entered for email: ${email}`);
      res.status(400).json({ error: 'Incorrect OTP' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
