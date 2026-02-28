// index.tsx
import { useState } from "react";
import BASE_URL from "../../config/ApiConfig";
import type { UserLoginData } from "../../models";
import { useNavigate } from "react-router-dom";
import './index.css';

const LOGO_URL = "/assets/images/logo-smart.png"; 

export default function AuthScreen() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submitLogin = async () => {
    // if (!email.trim() || !password.trim()) {
    //   alert("Veuillez remplir tous les champs");
    //   return;
    // }

    console.log({email,password})

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      const dataLogin: UserLoginData = await response.json();
      console.log(dataLogin)

      if (dataLogin.success) {
        localStorage.setItem("token", dataLogin.data.token);
        localStorage.setItem("user", JSON.stringify(dataLogin.data.user));
        navigate("/dashboard", { state: { user: dataLogin.data.user } });
      } else {
        alert(dataLogin.message || "Erreur de connexion");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="login-card">
        {/* Logo */}
        <div className="logo-container">
          <img
            src={LOGO_URL}
            alt="Smart Business - Unipour la Digitalisation"
            className="logo"
          />
          <h1 className="brand-title">Smart Business</h1>
        </div>

        <h2 className="login-title">Connexion</h2>

        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            placeholder="exemple@smartbusiness.mg"
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password" className="form-label">
            Mot de passe
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>

        <button
          onClick={submitLogin}
          disabled={loading}
          className={`login-button ${loading ? "loading" : ""}`}
        >
          {loading ? "Connexion en cours..." : "Se connecter"}
        </button>

        <div className="forgot-password">
          <a href="/forgot-password" className="forgot-link">
            Mot de passe oublié ?
          </a>
        </div>
      </div>
    </div>
  );
}