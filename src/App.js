import React from 'react';
import TeamRegistration from './components/TeamRegistration';
import { BrowserRouter,Route,Routes } from 'react-router-dom';
import Admin from './components/Admin';
import "./App.css"
import CollegeRegistration from './components/CollegeRe';
import StudentLogin from './components/StudentLogin';
import StudentOtp from './components/StudentOtp';
function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
            <Route path='/' element={<CollegeRegistration/>} />
            <Route path='/CollegeR' element={<CollegeRegistration/>} />
            <Route path='/Login' element={<StudentLogin/>} />
            <Route path='/enter' element={<StudentOtp/>} />
           

        </Routes> 
      </BrowserRouter>


      {/* <TeamRegistration /> */}
    </div>
  );
}

export default App;

