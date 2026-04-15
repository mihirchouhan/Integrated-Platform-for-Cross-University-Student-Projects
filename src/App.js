import React from 'react';
import { BrowserRouter,Route,Routes } from 'react-router-dom';
import Admin from './components/Admin';
import "./App.css"
import NavBar from "./components/NavBar";
import "./styles/ui.css";

import CollegeRegistration from './components/CollegeRe';
import StudentLogin from './components/StudentLogin';
import StudentOtp from './components/StudentOtp';
import Project from './components/Project';
import ProjectList from './components/ProjectList';
import SignIn from './components/SignIn';
import GlobalProjects from './components/GlobalProjects';
import CollegeAdminLogin from './components/CollegeAdminLogin';
import CollegeAdminDashboard from './components/CollegeAdminDashboard';
import ProjectDetails from "./components/ProjectDetails";
function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <NavBar />
        <Routes>

            {/* Global landing (public) */}
            <Route path='/' element={<GlobalProjects/>} />

            {/* Admin / college registration */}
            <Route path='/admin' element={<Admin/>} />
            <Route path='/college/register' element={<CollegeRegistration/>} />
            <Route path='/college/admin/login' element={<CollegeAdminLogin/>} />
            <Route path='/college/admin/dashboard' element={<CollegeAdminDashboard/>} />

            {/* Student auth */}
            <Route path='/student/signup' element={<StudentLogin/>} />
            <Route path='/student/otp' element={<StudentOtp/>} />
            <Route path='/student/signin' element={<SignIn/>} />

            {/* Project upload + list */}
            <Route path='/project/upload' element={<Project/>} />
            <Route path='/projects' element={<ProjectList/>} />
            <Route path='/projects/:id' element={<ProjectDetails/>} />
           

        </Routes> 
      </BrowserRouter>


      {/* <TeamRegistration /> */}
    </div>
  );
}

export default App;

