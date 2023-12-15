import React from 'react';
import TeamRegistration from './components/TeamRegistration';
import { BrowserRouter,Route,Routes } from 'react-router-dom';
import Admin from './components/Admin';
import CollegeRegistration from './components/CollegeRe';
import StudentLogin from './components/StudentLogin';
import StudentOtp from './components/StudentOtp';
import Project from './components/Project';
import ProjectList from './components/ProjectList';
import SignIn from './components/SignIn';
import "./App.css"
function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
            <Route path='/' element={<Admin/>} />
            {/* <Route path='/' element={<Project/>} /> */}
            <Route path='/project' element={<ProjectList/>} />
            <Route path='/CollegeRe' element={<CollegeRegistration/>} />
            <Route path='/Login' element={<StudentLogin/>} />
            <Route path='/enter' element={<StudentOtp/>} />
            <Route path='/signin' element={<SignIn/>} />
           

        </Routes> 
      </BrowserRouter>


      {/* <TeamRegistration /> */}
    </div>
  );
}

export default App;

