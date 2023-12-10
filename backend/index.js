const express = require("express");
 require("./db");
var cors = require('cors')
const app = express();
const PORT = 5000; 

app.use(cors());
app.use(express.json());

const College = require("./models/CollegeSchema");
const Student = require("./models/StudentSchema")

app.post('/registerCollege', async (req, res) => {
  try {
    const college = new College(req.body);
    await college.save();
    res.json(college);
    console.log("done")
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}); 

app.post('/registerStudent', async (req, res) => {
    try {
      const student = new Student(req.body);
      
      // Find the corresponding college
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
      console.log("student done")
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
 

