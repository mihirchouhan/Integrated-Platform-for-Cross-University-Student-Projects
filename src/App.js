import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import "./styles/ui.css";

import NavBar from "./components/NavBar";
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
import RecruiterSignup from './components/RecruiterSignup';
import RecruiterLogin from './components/RecruiterLogin';
import RecruiterDashboard from './components/RecruiterDashboard';
import Marketplace from './components/Marketplace';
import StudentProfile from './components/StudentProfile';
import CodeSyncronix from './components/CodeSyncronix';
import DirectMessages from './components/DirectMessages';
import ForgotPassword from './components/ForgotPassword';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <NavBar />
        <Routes>

          {/* Global landing (public) */}
          <Route path='/' element={<GlobalProjects />} />

          {/* Admin / college registration */}
          <Route path='/college/register' element={<CollegeRegistration />} />
          <Route path='/college/admin/login' element={<CollegeAdminLogin />} />
          <Route path='/college/admin/dashboard' element={<CollegeAdminDashboard />} />

          {/* Student auth */}
          <Route path='/student/signup' element={<StudentLogin />} />
          <Route path='/student/otp' element={<StudentOtp />} />
          <Route path='/student/signin' element={<SignIn />} />

          {/* Student profile */}
          <Route path='/profile' element={<StudentProfile />} />

          {/* Project upload + list */}
          <Route path='/project/upload' element={<Project />} />
          <Route path='/projects' element={<ProjectList />} />
          <Route path='/projects/:id' element={<ProjectDetails />} />

          {/* Recruiter */}
          <Route path='/recruiter/signup' element={<RecruiterSignup />} />
          <Route path='/recruiter/login' element={<RecruiterLogin />} />
          <Route path='/recruiter/dashboard' element={<RecruiterDashboard />} />

          {/* Marketplace */}
          <Route path='/marketplace' element={<Marketplace />} />

          {/* Code-Syncronix collaboration */}
          <Route path='/collaborate' element={<CodeSyncronix />} />

          {/* Direct Messages */}
          <Route path='/messages' element={<DirectMessages />} />

          {/* Password Reset */}
          <Route path='/forgot-password' element={<ForgotPassword />} />

        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
