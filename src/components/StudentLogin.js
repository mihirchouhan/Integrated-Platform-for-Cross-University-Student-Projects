import React from 'react'
import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

const StudentLogin = () => {
    const navigate = useNavigate();
    const [email,setEmail]=useState("")
    const [code,setCode]=useState("")
    const doit = async (e)=>{
        e.preventDefault();
        const api = await fetch("http://localhost:5000/sendotp", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({email:email,collegeCode:code})
        })
        const note = await api.json();
        console.log(note)
        if(note.success){
            navigate('/student/otp',{state:{
                email,code
            }})
        }
        else{
            alert("failed")
        }

    }


  return (
    <div style={{ maxWidth: 520, margin: "40px auto", padding: 16 }}>
      <h2>Student Signup (OTP)</h2>
      <p style={{ marginTop: 4, color: "#555" }}>
        Enter your college email and college code to receive OTP.
      </p>
      <div style={{ display: "grid", gap: 10 }}>
        <input
          type="email"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          placeholder="Enter your college email"
        />
        <input
          type="text"
          value={code}
          onChange={(ev) => setCode(ev.target.value)}
          placeholder="Enter your college code"
        />
        <button onClick={doit}>Request OTP</button>
        <div style={{ fontSize: 13 }}>
          Already registered? <Link to="/student/signin">Sign in</Link>
        </div>
      </div>
    </div>
  )
}

export default StudentLogin