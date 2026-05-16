import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from "react-router-dom";
import './CollegeRegistration.css';

import API_BASE_URL from '../apiConfig';

const AppointmentForm = () => {


  const navigate = useNavigate();
  const [collegeCode, setCollegeCode] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const handleFormSubmit = async (e) => {
    e.preventDefault();


    const api = await fetch(`${API_BASE_URL}/registerCollege`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: collegeCode, Cname: collegeId, CollegeAdmin: adminEmail, CollegeAdminPassword: adminPassword })
    })
    const note = await api.json();

    if (note) {
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
    <div>
      <section id="appointment" className="appointment section-bg">
        <div className="container">
          <div className="section-title">
            <h2>College Registration Portal</h2>
            <p>Transforming Education Journeys: Seamlessly Register Your College on Our Platform and Join a Community Committed to Empowering Futures through Comprehensive Registration Solutions.</p>
          </div>

          <form onSubmit={handleFormSubmit} method="post" role="form" className="php-email-form">
            <div className="row">
              <div className="col-md-4 form-group">
                <input type="text" name="name" className="form-control" id="name" placeholder="College Name" data-rule="minlen:4" data-msg="Please enter at least 4 chars" />
                <div className="validate"></div>
              </div>
              <div className="col-md-4 form-group mt-3 mt-md-0">
                <input type="text " value={collegeId} onChange={ev => setCollegeId(ev.target.value)} className="form-control" name="email" id="email" placeholder="College Email Domain" data-rule="email" data-msg="Please enter a valid email" />
                <div className="validate"></div>
              </div>
              <div className="col-md-4 form-group mt-3 mt-md-0">

                <input type="password" value={adminPassword} onChange={ev => setAdminPassword(ev.target.value)} className="form-control" name="email" id="email" placeholder="Password" data-rule="minlen:4" data-msg="Please enter at least 4 chars" />

                <input type="text" value={adminPassword} onChange={ev => setAdminPassword(ev.target.value)} className="form-control" name="email" id="email" placeholder="Alternate Admin Email" data-rule="minlen:4" data-msg="Please enter at least 4 chars" />

                <div className="validate"></div>
              </div>
            </div>
            <div className="row">
              <div className="col-md-4 form-group mt-3">
                <input type="text" name="CollegeCode" value={collegeCode} onChange={ev => setCollegeCode(ev.target.value)} className="form-control" id="CollegeCode" placeholder="College Code " data-rule="minlen:4" data-msg="Please enter at least 4 chars" />
                <div className="validate"></div>
              </div>
              <div className="col-md-4 form-group mt-3">
                <input type="text" value={adminEmail} onChange={ev => setAdminEmail(ev.target.value)} className="form-control" name="CollegeAdminEmail" id="email" placeholder="College Admin Email" data-rule="email" data-msg="Please enter a valid email" />
                <div className="validate"></div>
              </div>
              <div className="col-md-4 form-group mt-3">
                <input type="text" className="form-control" name="CollegeLocation" id="location" placeholder="College Location" data-rule="minlen:4" data-msg="Please enter the college location" />

                <div className="validate"></div>
              </div>
            </div>

            <div className="form-group mt-3">
              <textarea className="form-control" name="message" rows="5" placeholder="Message (Optional)"></textarea>
              <div className="validate"></div>
            </div>
            {/* <div className="mb-3">
              <div className="loading">Loading</div>
              <div className="error-message"></div>
              <div className="sent-message">Your appointment request has been sent successfully. Thank you!</div>
            </div> */}
            <br />

            <div className="text-center"><button className='button' type="submit">Submit</button></div>
          </form>
        </div>
      </section>
    </div>
  );
};

export default AppointmentForm;
