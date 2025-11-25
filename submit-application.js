#!/usr/bin/env node

/**
 * Script to submit application to Windborne Systems
 * 
 * Usage:
 *   node submit-application.js
 * 
 * Make sure to update the variables below with your information!
 */

const APPLICATION_URL = 'https://windbornesystems.com/career_applications.json';

// TODO: Update these with your information!
const APPLICATION_DATA = {
  career_application: {
    name: "Your Name",
    email: "your.email@example.com",
    role: "Junior Web Developer",
    notes: "I chose the National Weather Service (NWS) alerts API because it provides real-time, comprehensive weather hazard data that directly relates to balloon flight safety. By combining live balloon positions with active weather alerts, we can identify potential risks to the constellation in real-time. This integration demonstrates practical value for operational decision-making while showcasing robust data handling of both structured and potentially corrupted datasets.",
    submission_url: "https://your-deployed-app-url.com", // Update with your deployed URL
    portfolio_url: "https://your-portfolio-project-url.com", // Update with your portfolio project URL
    resume_url: "https://your-resume-url.com", // Update with your resume URL
  }
};

async function submitApplication() {
  try {
    console.log('Submitting application to Windborne Systems...');
    console.log('Data:', JSON.stringify(APPLICATION_DATA, null, 2));
    
    const response = await fetch(APPLICATION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(APPLICATION_DATA),
    });

    const responseData = await response.json();
    
    if (response.status === 200) {
      console.log('✅ Success! Application submitted successfully.');
      console.log('Response:', JSON.stringify(responseData, null, 2));
    } else {
      console.error('❌ Error: Application was not accepted.');
      console.error('Status Code:', response.status);
      console.error('Response:', JSON.stringify(responseData, null, 2));
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error submitting application:', error.message);
    process.exit(1);
  }
}

submitApplication();

