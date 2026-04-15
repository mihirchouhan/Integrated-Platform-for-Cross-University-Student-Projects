import React, { useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function NavBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const auth = useMemo(() => {
    const studentToken = localStorage.getItem("studentToken");
    const studentEmail = localStorage.getItem("studentEmail");
    const collegeAdminToken = localStorage.getItem("collegeAdminToken");
    const collegeAdminCode = localStorage.getItem("collegeAdminCode");
    return {
      isStudent: !!studentToken,
      studentEmail,
      isCollegeAdmin: !!collegeAdminToken,
      collegeAdminCode,
    };
  }, [location.pathname]);

  const logoutStudent = () => {
    localStorage.removeItem("studentToken");
    localStorage.removeItem("studentEmail");
    localStorage.removeItem("studentCollegeCode");
    navigate("/");
  };

  const logoutCollegeAdmin = () => {
    localStorage.removeItem("collegeAdminToken");
    localStorage.removeItem("collegeAdminCode");
    navigate("/");
  };

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "#0b1220",
        color: "white",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link
            to="/"
            style={{
              color: "white",
              textDecoration: "none",
              fontWeight: 700,
              letterSpacing: 0.3,
            }}
          >
            SIH Project Platform
          </Link>
          <NavLink to="/">Global</NavLink>
          <NavLink to="/projects">All Projects</NavLink>
          <NavLink to="/project/upload">Upload</NavLink>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {!auth.isStudent ? (
            <>
              <NavLink to="/student/signup">Student Signup</NavLink>
              <NavLink to="/student/signin">Student Signin</NavLink>
            </>
          ) : (
            <>
              <span style={{ opacity: 0.9, fontSize: 13 }}>
                Student: {auth.studentEmail}
              </span>
              <button onClick={logoutStudent} style={btnStyle}>
                Logout
              </button>
            </>
          )}

          <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.2)" }} />

          {!auth.isCollegeAdmin ? (
            <>
              <NavLink to="/college/register">College Register</NavLink>
              <NavLink to="/college/admin/login">Admin Login</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/college/admin/dashboard">
                Dashboard ({auth.collegeAdminCode})
              </NavLink>
              <button onClick={logoutCollegeAdmin} style={btnStyle}>
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function NavLink({ to, children }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      style={{
        color: active ? "white" : "rgba(255,255,255,0.85)",
        textDecoration: "none",
        padding: "6px 10px",
        borderRadius: 8,
        background: active ? "rgba(255,255,255,0.12)" : "transparent",
        fontSize: 13,
      }}
    >
      {children}
    </Link>
  );
}

const btnStyle = {
  background: "rgba(255,255,255,0.12)",
  border: "1px solid rgba(255,255,255,0.18)",
  color: "white",
  padding: "6px 10px",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 13,
};

