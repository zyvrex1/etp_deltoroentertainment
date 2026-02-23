import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLogin } from "../admincomponents/hooks/useLogin"
import { useAuthContext } from "../admincomponents/hooks/useAuthContext"

const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const { login, error, isLoading } = useLogin()
    const { user } = useAuthContext();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault()

       await login(email, password)
    }

  

     useEffect(() => {
        if (user) {
        if (user.role === "admin") {
            navigate("/admin");
        } else if (user.role === "promoter") {
            navigate("/promoter");
        } else if (user.role === "customer") {
            navigate("/customer"); 
        } else if (user.role === "sponsor") {
            navigate("/sponsor");
        }
        }
    }, [user, navigate]);

    return (
        <form className="login" onSubmit={handleSubmit}>
            <h3>Login</h3>

            <label>Email:</label>
            <input
            type="email"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            />
            <label>Password:</label>
            <input
            type="password"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            />
            <button>Login</button>
            {error && <div className="error">{error}</div>}
        </form>
    )
}

export default Login