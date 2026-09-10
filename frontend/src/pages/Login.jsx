import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./login.css";

function Login({ setToken }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

const handleLogin = async () => {
  try {
    const { data } = await axios.post(
      "/api/auth/login",
      formData
    );

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data));
    setToken(data.token);

    navigate("/");
  } catch (error) {
    alert(error.response?.data?.message || "Login failed");
  }
};


  return (
    <div className="auth-page">

      <div className="auth-card">

        <div className="auth-header">
          <div className="logo-badge">LB</div>
          <h2>Welcome Back</h2>
          <p>Login to access your dashboard</p>
        </div>

        <div className="auth-form">

          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />

          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />

          <button onClick={handleLogin}>
            Login
          </button>

          <p className="auth-switch">
            Don’t have an account? <Link to="/signup">Sign Up</Link>
          </p>

        </div>
      </div>
    </div>
  );
}

export default Login;
