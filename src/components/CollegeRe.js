import React, { useState } from "react";

export default function CollegeRegistration() {
  const [code, setCode] = useState("");
  const [Cname, setCname] = useState("");
  const [CollegeAdmin, setCollegeAdmin] = useState("");
  const [CollegeAdminPassword, setCollegeAdminPassword] = useState("");
  const [status, setStatus] = useState("");

  const registerCollege = async (e) => {
    e.preventDefault();
    setStatus("Registering...");
    try {
      const res = await fetch("http://localhost:5000/registerCollege", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, Cname, CollegeAdmin, CollegeAdminPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data?.error || data?.message || "Registration failed");
        return;
      }
      setStatus("College registered successfully");
      setCode("");
      setCname("");
      setCollegeAdmin("");
      setCollegeAdminPassword("");
    } catch (err) {
      setStatus(err?.message || "Registration failed");
    }
  };

  return (
    <div className="app-page">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="app-card">
            <div className="app-card-body">
              <h2 className="mb-1">College Registration</h2>
              <p className="app-muted mb-4">
                Register your institute and create a college admin account.
              </p>

              <form onSubmit={registerCollege} className="d-grid gap-3">
                <div>
                  <label className="form-label">College Code</label>
                  <input
                    className="form-control"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. C-36075"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">College Domain</label>
                  <input
                    className="form-control"
                    value={Cname}
                    onChange={(e) => setCname(e.target.value)}
                    placeholder="e.g. iitd.ac.in"
                    required
                  />
                  <div className="form-text">
                    Student emails must match this domain after @.
                  </div>
                </div>

                <div>
                  <label className="form-label">College Admin Email</label>
                  <input
                    className="form-control"
                    value={CollegeAdmin}
                    onChange={(e) => setCollegeAdmin(e.target.value)}
                    placeholder="admin@iitd.ac.in"
                    type="email"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">College Admin Password</label>
                  <input
                    className="form-control"
                    value={CollegeAdminPassword}
                    onChange={(e) => setCollegeAdminPassword(e.target.value)}
                    placeholder="Create a strong password"
                    type="password"
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary">
                  Register College
                </button>

                {status ? (
                  <div className="alert alert-info mb-0" role="alert">
                    {status}
                  </div>
                ) : null}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

