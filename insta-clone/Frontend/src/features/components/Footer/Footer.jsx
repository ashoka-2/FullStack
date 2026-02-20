import React from 'react'
import { Link } from 'react-router'
import './style/footer.scss';

const Footer = () => {
  return (
    <div className='footer'>
      
        <div className="footer-inner">
            <div className="footer-links">
                <Link to="/">Meta</Link>
                <Link to="/">About</Link>
                <Link to="/">Blog</Link>
                <Link to="/">Jobs</Link>
                <Link to="/">Help</Link>
                <Link to="/">API</Link>
                <Link to="/">Privacy</Link>
                <Link to="/">Terms</Link>
                <Link to="/">Locations</Link>
                <Link to="/">Instagram Lite</Link>
                <Link to="/">Meta AI</Link>
                <Link to="/">Threads</Link>
                <Link to="/">Contact Uploading & Non-Users</Link>
                <Link to="/">Meta Verified</Link>

            </div>


            <div className="footer-copyright">
                <p>English <i className="ri-arrow-drop-down-line"></i></p>
                <p>© 2026 Instagram from Meta</p>
            </div>
            <div></div>
        </div>


    </div>
  )
}

export default Footer
