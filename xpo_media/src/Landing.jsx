import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AOS from "aos";
import logo from "./images/Logo/logo.jpg"
import { GraduationCap, Settings, BusFront, User, Users, School } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [backdrop, setBackdrop] = useState(false);

  useEffect(() => {
    AOS.init({ duration: 1000, easing: "ease-in-out", once: true, offset: 150 });
  }, []);

  const handleNavigation = (path) => {
    setBackdrop(true);
    setTimeout(() => {
      navigate(path);
      setBackdrop(false);
    }, 300);
  };

  return (
    <div className="landing-page">
      {backdrop && (
        <div className="backdrop-overlay">
          <div className="backdrop-spinner"></div>
        </div>
      )}
      
      <style>{`
        /* Importing Poppins for the main text */
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap');
        
        /* Importing Inter font as a general fallback and for main text */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        
        
        @import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&display=swap');


        /* Including Bootstrap CSS from CDN */
        @import url('https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css');
        /* Including AOS CSS from CDN */
        @import url('https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.css');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html, body {
          width: 100vw;
          min-height: 100vh;
          overflow-x: hidden;
          overflow: -moz-scrollbars-none;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        html::-webkit-scrollbar, 
        body::-webkit-scrollbar {
          display: none;
        }

        body {
          margin: 0;
          font-family: 'Poppins', 'Inter', sans-serif;
          color: #1B2B4F;
          background: #fff;
        }

        .landing-page {
          width: 100vw;
          min-height: 90vh;
          overflow-y: hidden;
          position: relative;
          overflow-x: hidden;
        }

        /* Backdrop Overlay */
        .backdrop-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .backdrop-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid #4285F4;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .navbar-custom {
          background-color: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(10px);
          height: 10vh;
          min-height: 60px;
          border-bottom: 1px solid #4285F4;
          width: 100vw;
          position: fixed;
          top: 0; /* Stick to the top of the viewport */
          z-index: 1030; /* Ensure it's above other content */
        }
        
        .navbar-custom .container-fluid {
          padding: 0 1rem;
          width: 100%;
          max-width: none;
        }
        
        .navbar-brand-custom {
          font-weight: 400;
          font-size: clamp(1.2rem, 4vw, 2rem);
          cursor: pointer;
          color: #1B2B4F;
          text-decoration: none;
          display: flex; /* Use flexbox to align logo and text */
          align-items: center;
          gap: 10px;
          letter-spacing: 1px;
          font-family: 'Algerian', sans-serif;
        }
        
        /* Style for the logo image in the navbar */
        .navbar-brand-custom .logo-circle {
          height: clamp(30px, 5vw, 40px);
          width: clamp(30px, 5vw, 40px);
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #4285F4;
        }

        .hero-section {
          width: 100vw;
          min-height: 100vh;
          background: linear-gradient(135deg, #EAF1FC 0%, #DCEBFB 100%);
          border-bottom: 2px solid #062969;
          border-bottom-left-radius: clamp(20px, 5vw, 50px);
          border-bottom-right-radius: clamp(20px, 5vw, 50px);
          padding: clamp(2rem, 8vh, 8rem) 1rem;
          text-align: center;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        
        .hero-section::before, .hero-section::after {
          content: '';
          position: absolute;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 50px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          filter: blur(2px);
          z-index: 0;
        }
        
        .hero-section::before {
          width: clamp(150px, 25vw, 250px);
          height: clamp(100px, 18vw, 180px);
          top: 10%;
          left: 5%;
          transform: rotate(-15deg);
        }
        
        .hero-section::after {
          width: clamp(200px, 35vw, 350px);
          height: clamp(150px, 25vw, 250px);
          bottom: -10%;
          right: 5%;
          transform: rotate(25deg);
        }

        .landing-page::before, .landing-page::after {
          content: '';
          position: absolute;
          background: rgba(156, 196, 250, 0.4);
          filter: blur(50px);
          z-index: -1;
          opacity: 0.8;
          border-radius: 50%;
        }

        .landing-page::before {
          width: clamp(200px, 40vw, 400px);
          height: clamp(200px, 40vw, 400px);
          top: -150px;
          left: -150px;
        }

        .landing-page::after {
          width: clamp(150px, 30vw, 300px);
          height: clamp(150px, 30vw, 300px);
          bottom: -100px;
          right: -100px;
          background: rgba(168, 207, 255, 0.4);
        }
        
        .hero-title {
          font-family: 'Times New Roman', Times, serif;
          font-size: clamp(1.8rem, 6vw, 5rem);
          font-weight: 600;
          z-index: 1;
          position: relative;
          color: #1B2B4F;
          margin-bottom: 1rem;
          line-height: 1.2;
          max-width: 100%;
          word-wrap: break-word;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 10px;
        }
        
        /* Style for the logo image in the hero section */
        .hero-title .logo-img {
          height: clamp(40px, 8vw, 80px);
          width: clamp(40px, 8vw, 80px);
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #4285F4;
        }
        
        /* New class to apply the font to 'XPO Media' within the hero title */
        .hero-title .brand-name {
          font-family: 'Algerian', sans-serif;
          font-weight: 400; 
          font-size: clamp(2rem, 6vw, 5rem); 
          letter-spacing: 2px;
        }

        .hero-subtitle {
          font-size: clamp(0.9rem, 2.5vw, 1.5rem);
          color: #3b4a6b;
          max-width: 100vw;
          margin: 1.5rem auto;
          z-index: 1;
          position: relative;
          line-height: 1.4;
        }

        /* Login Buttons Container */
        .login-buttons-container {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          justify-content: center;
          margin: 2rem 0;
          z-index: 1;
          position: relative;
        }

        .login-btn {
          padding: clamp(0.8rem, 2vw, 1rem) clamp(1.2rem, 3vw, 1.8rem);
          background-color: #4285F4;
          color: #fff;
          font-weight: 600;
          border-radius: 12px;
          border: none;
          font-size: clamp(0.8rem, 1.8vw, 0.95rem);
          cursor: pointer;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
          min-width: 140px;
          justify-content: center;
        }

        .login-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(66, 133, 244, 0.3);
        }

        .login-btn.admin {
          background: linear-gradient(135deg, #4285F4, #34A853);
        }

        .login-btn.teacher {
          background: linear-gradient(135deg, #FBBC05, #EA4335);
        }

        .login-btn.student {
          background: linear-gradient(135deg, #34A853, #4285F4);
        }

        .login-btn .btn-icon {
          width: 18px;
          height: 18px;
        }
        
        .btn.btn-main {
          padding: clamp(0.6rem, 2vw, 0.8rem) clamp(1.5rem, 5vw, 2.5rem);
          background-color: #4285F4;
          color: #fff;
          font-weight: 700;
          border-radius: 50px;
          border: none;
          z-index: 1;
          position: relative;
          font-size: clamp(0.9rem, 2vw, 1rem);
          cursor: pointer;
          white-space: nowrap;
        }
        .btn.btn-main {
          transition: all 0.3s linear;
        }
        .btn.btn-main:hover {
          background-color: #fff;
          color: #357ae8;
          transform: translateY(-5px);
          box-shadow: 0 8px 15px rgba(0, 13, 255, 0.1);
        }

        .features-section {
          width: 100vw;
          padding: clamp(3rem, 8vw, 6rem) 1rem;
        }
        
        .features-section .container {
          max-width: 100%;
          padding: 0;
        }
        
        .feature-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          padding: clamp(1.5rem, 4vw, 2.5rem);
          border-radius: 1.5rem;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
          transition: all 0.4s ease;
          height: 100%;
          border: 1px solid rgba(255, 255, 255, 0.4);
          margin-bottom: 1.5rem;
        }
        
        .feature-card:hover {
          transform: translateY(-15px);
          box-shadow: 0 20px 40px #a2c4fa;
          border-color: #4285F4;
        }
        
        .feature-icon {
          margin-bottom: 1rem;
          display: inline-block;
          padding: 0.75rem;
          background-color: rgba(66, 133, 244, 0.1);
          border-radius: 1rem;
        }
        
        .feature-icon svg {
          width: clamp(24px, 5vw, 32px);
          height: clamp(24px, 5vw, 32px);
        }
        
        .feature-title {
          font-size: clamp(1.1rem, 3vw, 1.5rem);
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        
        .feature-card p {
          font-size: clamp(0.85rem, 2vw, 1rem);
          line-height: 1.4;
        }

        .cta-section {
          position: relative;
          background: linear-gradient(135deg, #4285F4, #2b6de0);
          color: #fff;
          padding: clamp(3rem, 8vw, 5rem) 1rem;
          text-align: center;
          border-radius: clamp(20px, 5vw, 50px);
          border-top: 1px solid #fff;
          overflow: hidden;
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
          width: 100vw;
        }

        .cta-section::before,
        .cta-section::after {
          content: '';
          position: absolute;
          border-radius: 50%;
          filter: blur(50px);
          opacity: 0.4;
          z-index: 0;
        }

        .cta-section::before {
          width: clamp(150px, 30vw, 300px);
          height: clamp(150px, 30vw, 300px);
          background: rgba(255, 255, 255, 0.25);
          top: -100px;
          left: -100px;
        }

        .cta-section::after {
          width: clamp(125px, 25vw, 250px);
          height: clamp(125px, 25vw, 250px);
          background: rgba(255, 255, 255, 0.15);
          bottom: -80px;
          right: -80px;
        }

        .cta-section h2 {
          font-weight: 800;
          font-size: clamp(1.5rem, 5vw, 3rem);
          position: relative;
          z-index: 1;
          margin-bottom: 1rem;
          line-height: 1.2;
        }

        .cta-section p,
        .cta-section button {
          position: relative;
          z-index: 1;
        }

        .cta-section p {
          font-size: clamp(0.9rem, 2.5vw, 1.2rem);
          line-height: 1.4;
        }

        /* Bootstrap Grid Responsive Adjustments */
        .row {
          margin: 0;
          width: 100%;
        }
        
        .row > * {
          padding-right: 0.75rem;
          padding-left: 0.75rem;
        }

        /* Mobile First Responsive Design */
        @media (max-width: 575px) {
          .navbar-custom {
            height: 8vh;
            min-height: 50px;
          }
          
          .navbar-custom .container-fluid {
            padding: 0 0.5rem;
          }
          
          .hero-section {
            min-height: 100vh;
            padding: 2rem 0.5rem;
            border-bottom-left-radius: 20px;
            border-bottom-right-radius: 20px;
          }
          
          .hero-title {
            font-size: 1.8rem;
            margin-bottom: 0.5rem;
          }
          
          .hero-subtitle {
            font-size: 0.9rem;
            max-width: 95vw;
            margin: 1rem auto;
          }

          .login-buttons-container {
            gap: 0.5rem;
            margin: 1.5rem 0;
          }

          .login-btn {
            min-width: 120px;
            padding: 0.7rem 1rem;
            font-size: 0.8rem;
          }
          
          .features-section {
            padding: 2rem 0.5rem;
          }
          
          .feature-card {
            padding: 1.5rem;
            margin-bottom: 1rem;
          }
          
          .cta-section {
            padding: 2rem 0.5rem;
            border-radius: 20px;
          }
          
          .cta-section h2 {
            font-size: 1.4rem;
          }
          
          .row > * {
            padding-right: 0.5rem;
            padding-left: 0.5rem;
          }
        }
        
        @media (max-width: 350px) {
          .hero-title span,
          .hero-title .brand-name,
          .hero-title u {
            display: block;
          }

          .login-buttons-container {
            flex-direction: column;
            align-items: center;
          }

          .login-btn {
            width: 100%;
            max-width: 200px;
          }
        }

        /* Tablet */
        @media (min-width: 576px) and (max-width: 991px) {
          .hero-section {
            min-height: 100vh;
            padding: 4rem 1rem;
          }
          
          .hero-title {
            font-size: 2.5rem;
          }
          
          .hero-subtitle {
            font-size: 1.2rem;
            max-width: 80vw;
          }
          
          .features-section {
            padding: 4rem 1rem;
          }
          
          .feature-card {
            padding: 2rem;
          }
          
          .cta-section {
            padding: 4rem 2rem;
          }
        }

        /* Desktop */
        @media (min-width: 992px) {
          .hero-section {
            min-height: 100vh;
            padding: 6rem 2rem;
          }
          
          .features-section {
            padding: 6rem 2rem;
          }
          
          .cta-section {
            padding: 5rem 2rem;
          }
        }

        /* Large Desktop */
        @media (min-width: 1500px) {
        .hero-section {
            min-height: 100vh;
            padding: 6rem 1rem;
          }

          .hero-title {
            font-size: 4rem;
          }
          
          .hero-subtitle {
            font-size: 1.4rem;
            max-width: 800px;
          }
          
          .feature-card {
            padding: 3rem;
          }
        }

        /* Landscape Mobile */
        @media (max-height: 600px) and (orientation: landscape) {
          .hero-section {
            min-height: 100vh;
            padding: 2rem 1rem;
          }
          
          .navbar-custom {
            height: 60px;
          }
        }

      `}</style>


      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-custom sticky-top">
        <div className="container-fluid">
          <button
            className="navbar-brand navbar-brand-custom btn btn-link p-0 border-0 bg-transparent"
            onClick={() => handleNavigation("/admin/login")}
          >
            <img src={logo} alt="XPO Media Logo" className="logo-circle" />
            <span>XPO Media</span>
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-section" data-aos="fade-down">
        <h1 className="hero-title">
          Welcome to <img src={logo} alt="XPO Media Logo" className="logo-img" />
          <span className="brand-name">
            <u>XPO Media</u>
          </span>{" "}
          School ERP
        </h1>
        <p className="hero-subtitle">
          Manage students, teachers, schedules, and more — all from one powerful
          platform.
        </p>
        
        {/* Quick Login Buttons */}
        <div className="login-buttons-container">
          <button 
            className="login-btn admin"
            onClick={() => handleNavigation("/login")}
          >
            <School className="btn-icon" />
            School Admin
          </button>
          <button 
            className="login-btn teacher"
            onClick={() => handleNavigation("/teacherlogin")}
          >
            <Users className="btn-icon" />
            Teacher Login
          </button>
          <button 
            className="login-btn student"
            onClick={() => handleNavigation("/studentlogin")}
          >
            <User className="btn-icon" />
            Student Login
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="container">
          <div className="row g-5">
            <div className="col-md-4" data-aos="fade-up">
              <div className="feature-card">
                <div className="feature-icon">
                  <GraduationCap />
                </div>
                <h5 className="feature-title">
                  Student & Teacher Management
                </h5>
                <p>
                  Track student and teacher records, attendance, and performance
                  seamlessly.
                </p>
              </div>
            </div>
            <div className="col-md-4" data-aos="fade-up" data-aos-delay="200">
              <div className="feature-card">
                <div className="feature-icon">
                  <Settings />
                </div>
                <h5 className="feature-title">Administration Management</h5>
                <p>
                  Streamline administrative tasks, reporting, and school-wide
                  processes with ease.
                </p>
              </div>
            </div>
            <div className="col-md-4" data-aos="fade-up" data-aos-delay="400">
              <div className="feature-card">
                <div className="feature-icon">
                  <BusFront />
                </div>
                <h5 className="feature-title">Transport Management</h5>
                <p>
                  Effortlessly manage vehicle routes, student tracking, and
                  driver schedules.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section" data-aos="zoom-in">
        <h2>📚 Simplify Your School Management Today</h2>
        <p className="mt-4">
          Log in and take control of your school operations.
        </p>
        <button
          onClick={() => handleNavigation("/login")}
          className="btn btn-main mt-4"
        >
          Admin Login
        </button>
      </section>
    </div>
  );
}