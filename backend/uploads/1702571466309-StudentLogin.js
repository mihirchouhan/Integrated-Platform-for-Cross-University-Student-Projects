import React from 'react'
import { useState } from 'react';
import { useNavigate } from "react-router-dom";
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
        if(note.succes){
            navigate('/enter',{state:{
                email,code
            }})
        }
        else{
            alert("failed")
        }

    }


  return (
    <div>
        <input type='email' value={email} onChange={ev=>setEmail(ev.target.value)} placeholder='enter your email'/>
        <input type='text' value={code} onChange={ev=>setCode(ev.target.value)} placeholder='enter your college code'/>
        <button onClick={doit}> req for otp</button>
    </div>
  )
}

export default StudentLogin