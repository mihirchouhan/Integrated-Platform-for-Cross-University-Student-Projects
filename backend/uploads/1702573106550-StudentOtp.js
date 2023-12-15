import React from 'react'
import {useLocation,} from 'react-router-dom'
import { useState } from 'react'
import '../styles/StudentOtp.css'


const StudentOtp = () => {


    const location = useLocation()
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const email = location.state.email
    const code = location.state.code

    const register = async (e)=>{
        e.preventDefault();
        const api = await fetch("http://localhost:5000/registerStudent", {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({email:email,collegeCode:code,password:password,otp:otp})
        })
        const note = await api.json();
        if(note.success){
            alert("registered")
            console.log("wowo")
        }
        else{
            alert(note.message)
        }
    }
    
    const handleOtpChange = (event) => {
      setOtp(event.target.value);
    };
    const handlePasswordChange = (event) => {
      setPassword(event.target.value);
    };


  return (
    <div>
        <h1>{location.state.email}</h1>
        <h1>{location.state.code}</h1>
      <label htmlFor="otp">OTP:</label>
      <input
        type="text"
        id="otp"
        value={otp}
        onChange={handleOtpChange}
        placeholder="Enter OTP"
      />

      <label htmlFor="password">Set Password:</label>
      <input
        type="password"
        id="password"
        value={password}
        onChange={handlePasswordChange}
        placeholder="Enter Set Password"
      />
        <button onClick={register}>Register </button>
    </div>
  )
}

export default StudentOtp