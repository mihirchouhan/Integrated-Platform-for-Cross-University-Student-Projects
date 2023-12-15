    import * as React from 'react';
    import { useState } from 'react';
    import { useNavigate } from "react-router-dom";
    import { useEffect } from 'react';
    const Admin = () => {
        const [email, setEmail] = useState("")
        const [password, setPassword] = useState("")
        const [emailError, setEmailError] = useState('');
        const [passwordError, setPasswordError] = useState('');
        
        const navigate = useNavigate();
            
        const validateForm = () => {
            let isValid = true;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email) {
              setEmailError('Email is required');
              isValid = false;
            } else if (!emailRegex.test(email)) {
                setEmailError('Please Enter Correct Email');
                isValid = false;
            }
             else {
              setEmailError('');
            }
        
            if (!password) {
              setPasswordError('Password is required');
              isValid = false;
            } else {
              setPasswordError('');
            }
        
            return isValid;
          };
        
          const onButtonClick = (e) => {
            e.preventDefault();
        
            if (validateForm()) {
              // Proceed with login logic
              if (email === 'Amin999@gmail.com' && password === '9595') {
                navigate('/CollegeRe');
              } else {
                console.log('bad');
              }
            }
          };
    return (
        <>
    <div className={"mainContainer"}>
            <div className={"titleContainer"}>
                <div>Admin Login</div>
            </div>
            <br />
            <div className={"inputContainer"}>
                <input
                    value={email}
                    placeholder="Enter your email here"
                    onChange={ev => setEmail(ev.target.value)}
                    className={"inputBox"} type='email'
                    autoComplete="off"  required />
                    <label className="errorLabel">{emailError}</label>
            </div>
            <br />
            <div className={"inputContainer"}>
                <input type='password'
                    value={password}
                    placeholder="Enter your password here"
                    onChange={ev => setPassword(ev.target.value)}
                    className={"inputBox"}
                    autoComplete="new-password" required />
                      <label className="errorLabel">{passwordError}</label>

            </div>
            <br />
            <div className={"inputContainer"}>
                <input
                    className={"inputButton"}
                    type="button"
                    onClick={onButtonClick}
                    value={"Log in"} />
            </div>
        </div>



        </>
    )
    }

    export default Admin