import React from 'react'
import { Link } from 'react-router-dom';

const Navbar = () => {
    return (
        <nav>
            <ul className="navbar">
                <Link to='/'>
                    <li className='link'>Home</li>
                </Link>
                <Link to='/games'>
                    <li className='link'>Games</li>
                </Link>
                <Link to='/about'>
                    <li className='link'>About</li>
                </Link>
            </ul>
        </nav>
    )
}

export default Navbar
