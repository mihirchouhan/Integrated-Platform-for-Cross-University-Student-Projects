import React from 'react'
import {useLocation,} from 'react-router-dom'
import { useState } from 'react'
import '../styles/StudentOtp.css'
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";


const StudentOtp = () => {

  const navigate = useNavigate();
    const location = useLocation()
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState('');
    const email = location.state.email
    const code = location.state.code

    const register = async (e)=>{
        e.preventDefault();
        setStatus("Registering...");
        const api = await fetch("http://localhost:5000/registerStudent", {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({email:email,collegeCode:code,password:password,otp:otp})
        })
        const note = await api.json();
        if(note.success){
          navigate('/student/signin')
            setStatus("Registered successfully. Please sign in.");
            
        }
        else{
            setStatus(note.message || "Registration failed")
        }
    }
    
    const handleOtpChange = (event) => {
      setOtp(event.target.value);
    };
    const handlePasswordChange = (event) => {
      setPassword(event.target.value);
    };


  return (
    <div className="app-page">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="app-card">
            <div className="app-card-body">
              <h2 className="mb-1">Verify OTP</h2>
              <p className="app-muted mb-3">
                Email: <strong>{email}</strong> • College code: <strong>{code}</strong>
              </p>

              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label" htmlFor="otp">
                    OTP
                  </label>
                  <input
                    className="form-control"
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={handleOtpChange}
                    placeholder="Enter OTP"
                  />
                </div>

                <div className="col-12">
                  <label className="form-label" htmlFor="password">
                    Set password
                  </label>
                  <input
                    className="form-control"
                    type="password"
                    id="password"
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="Create a password"
                  />
                </div>

                <div className="col-12 d-flex justify-content-between align-items-center">
                  <Link to="/student/signup" className="btn btn-soft">
                    Back
                  </Link>
                  <button className="btn btn-primary" onClick={register}>
                    Register
                  </button>
                </div>
              </div>

              {status ? (
                <div className="alert alert-info mt-3 mb-0" role="alert">
                  {status}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentOtp