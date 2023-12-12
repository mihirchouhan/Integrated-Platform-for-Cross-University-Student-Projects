import React from 'react'
import bgImg from '../images/img1.jpg';
import './CollegeRegistration.css';
import { useState } from 'react';
import { useNavigate } from "react-router-dom";
const CollegeRegistration = () => {

    const navigate = useNavigate();
    const [collegeCode, setCollegeCode] = useState('');
    const [collegeId, setCollegeId] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');

    const handleFormSubmit = async (e) => {
        e.preventDefault();


        const api = await fetch("http://localhost:5000/registerCollege", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({code:collegeCode, Cname:collegeId, CollegeAdmin: adminEmail, CollegeAdminPassword:adminPassword })
        })
        const note = await api.json();

        if(note){
            navigate('/Login')
            console.log("good")
        }








        setCollegeCode('');
        setCollegeId('');
        setAdminEmail('');
        setAdminPassword('');
        console.log('Form submitted:', { collegeCode, collegeId, adminEmail, adminPassword });
    };


    return (
        <div className='App'>

            <div className="register">
                <div className="col-1">
                    {/* <h2>Sign In</h2> */}
                    <span>Register Colleges</span>

                    <form id='form' className='flex flex-col' onSubmit={handleFormSubmit}>
                        <input type="text" name="collegeCode"
                            value={collegeCode}
                            onChange={ev => setCollegeCode(ev.target.value)}
                            placeholder='College Code' />

                        <input type="text"
                            value={collegeId}
                            onChange={ev => setCollegeId(ev.target.value)}
                            placeholder='College Id example- xyz.com' />

                        <input type="email"
                            value={adminEmail}
                            onChange={ev => setAdminEmail(ev.target.value)}
                            placeholder='College Admin Email' />

                        <input type="password"
                            value={adminPassword}
                            onChange={ev => setAdminPassword(ev.target.value)}
                            placeholder='Create Admin Password' />

                        <button className='btn'>Register</button>
                    </form>

                </div>
                <div className="col-2">
                    <img src={bgImg} alt="" />
                </div>
            </div>


        </div>
    )
}

export default CollegeRegistration