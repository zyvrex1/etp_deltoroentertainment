import { Link } from "react-router-dom"

const Navbar = ({ openSignup, openLogin }) => {
  return (
    <header>
      <div className="container">
        <Link to="/">
          <h1>Landing Page</h1>
        </Link>

        <nav>
           <button onClick={openLogin}>Login</button>
          <button onClick={openSignup}>Signup</button>
        </nav>
      </div>
    </header>
  )
}

export default Navbar