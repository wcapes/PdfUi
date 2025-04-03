import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/LandingPage.css'; // Optional for styling
import styles from '../styles/LandingPage.css'; // Import the CSS module

const LandingPage = () => {
  return (
    <div className="landing-container">
      <h1>NegativeZero Pdf</h1>

<h2 className={styles.heading}>Unlock the Power of Your Documents with AI</h2>
<p className={styles.paragraph}>Are you tired of spending hours searching through PDFs for specific information? Our platform transforms the way you interact with your documents. We scan your PDFs, extract key data, and integrate it into a cutting-edge Retrieval-Augmented Generation (RAG) model powered by advanced Large Language Models (LLMs). This allows you to ask natural English questions about your data and receive precise answers, complete with references to the document, page, and even line number.</p>

<h2 className={styles.heading}>Why Join Us?</h2>
<p className={styles.paragraph}>Save Time: No more manual searches—get instant answers from your documents.</p>
<p className={styles.paragraph}>Accuracy You Can Trust: Every answer is backed by clear citations, ensuring transparency and reliability.</p>
<p className={styles.paragraph}>Simplify Complex Data: Query your documents in plain English and let our AI handle the heavy lifting.</p>

<h2 className={styles.heading}>Get Started Today!</h2>
<p className={styles.paragraph}>Whether you're a researcher, business professional, or student, our platform is designed to make your life easier. Sign up now and experience the future of document management.</p>

<div className="buttons">
  <Link to="/login" className="btn">Login</Link>
  <Link to="/register" className="btn">Register</Link>
</div>

<p className={styles.paragraph}>Let us help you turn your documents into actionable insights!</p>

    </div>
  );
};

export default LandingPage;
