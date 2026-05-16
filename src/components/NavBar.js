import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function NavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const auth = useMemo(() => {
    const studentToken = localStorage.getItem("studentToken");
    const studentEmail = localStorage.getItem("studentEmail");
    const collegeAdminToken = localStorage.getItem("collegeAdminToken");
    const collegeAdminCode = localStorage.getItem("collegeAdminCode");
    const recruiterToken = localStorage.getItem("recruiterToken");
    const recruiterCompany = localStorage.getItem("recruiterCompany");
    return {
      isStudent: !!studentToken,
      studentEmail,
      isCollegeAdmin: !!collegeAdminToken,
      collegeAdminCode,
      isRecruiter: !!recruiterToken,
      recruiterCompany,
    };
    // eslint-disable-next-line
  }, [location.pathname]);

  const [theme, setTheme] = useState(localStorage.getItem("app-theme") || "dark");

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("app-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  const logout = (keys, path = "/") => {
    keys.forEach((k) => localStorage.removeItem(k));
    navigate(path);
  };

  const navLink = (to, label) => {
    const active = location.pathname === to;
    return (
      <Link to={to} className={`navbar-link${active ? " active" : ""}`} onClick={() => setOpen(false)}>
        {label}
      </Link>
    );
  };

  return (
    <nav className="navbar" id="main-navbar">
      <div className={`navbar-inner${open ? " open" : ""}`}>
        <div className="d-flex align-items-center gap-3">
          <button className="navbar-toggle" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? "✕" : "☰"}
          </button>
          <Link to="/" className="navbar-brand" onClick={() => setOpen(false)}>
            <img src="/projecthub_logo.png" alt="ProjectHub Logo" className="brand-icon" style={{ height: "32px", width: "32px", objectFit: "cover", borderRadius: "50%", marginRight: "8px" }} />
            ProjectHub
          </Link>
        </div>

        <div className="navbar-links">
          {navLink("/", "Global")}
          {navLink("/projects", "All Projects")}
          {navLink("/marketplace", "Marketplace")}
          {(auth.isStudent || auth.isRecruiter) && navLink("/messages", "Messages")}
          {auth.isStudent && navLink("/project/upload", "Upload")}
          {auth.isStudent && navLink("/collaborate", "Code-Syncronix")}
        </div>

        <div className="navbar-actions">
          <button className="btn btn-sm btn-soft rounded-circle px-2" onClick={toggleTheme} title="Toggle Theme" style={{ fontSize: '1.2rem', padding: '4px 8px', marginRight: '8px' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          {/* Student auth */}
          {!auth.isStudent && !auth.isRecruiter && (
            <>
              {navLink("/student/signin", "Sign in")}
              {navLink("/student/signup", "Sign up")}
            </>
          )}
          {auth.isStudent && (
            <>
              <Link to="/profile" className="navbar-user" onClick={() => setOpen(false)}>
                👤 {auth.studentEmail}
              </Link>
              <button className="btn btn-sm btn-soft" onClick={() => logout(["studentToken", "studentEmail", "studentCollegeCode"])}>
                Logout
              </button>
            </>
          )}

          <span className="navbar-divider" />

          {/* College admin */}
          {!auth.isCollegeAdmin ? (
            <>
              {navLink("/college/register", "College Reg")}
              {navLink("/college/admin/login", "Admin")}
            </>
          ) : (
            <>
              {navLink("/college/admin/dashboard", `Dashboard (${auth.collegeAdminCode})`)}
              <button className="btn btn-sm btn-soft" onClick={() => logout(["collegeAdminToken", "collegeAdminCode"])}>
                Logout
              </button>
            </>
          )}

          <span className="navbar-divider" />

          {/* Recruiter */}
          {!auth.isRecruiter ? (
            navLink("/recruiter/login", "Recruiter")
          ) : (
            <>
              <Link to="/recruiter/dashboard" className="navbar-user" onClick={() => setOpen(false)}>
                🏢 {auth.recruiterCompany}
              </Link>
              <button className="btn btn-sm btn-soft" onClick={() => logout(["recruiterToken", "recruiterEmail", "recruiterCompany"])}>
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
