# Digaurd
DiGuard - Chrome Extension
Overview
DiGuard is a Chrome extension designed to protect users from visiting potentially harmful or restricted websites. It monitors user navigation in real-time and checks visited domains against a list of restricted domains stored in a Google Sheet. If a restricted domain is detected, the user is redirected to a warning page where they can choose to proceed or cancel navigation.

Table of Contents
Features
Prerequisites
Setup Instructions
How It Works
Code Structure
Usage
Security Considerations
Contributing
License
Features
Real-time monitoring of visited domains.
Integration with Google Sheets to manage restricted domains dynamically.
Customizable warning messages for restricted domains.
Options for users to either proceed or cancel navigation to restricted domains.
Secure storage of API keys to prevent unauthorized access.
Prerequisites
Before setting up the DiGuard extension, ensure you have the following:

Google Cloud Project :
A Google Cloud project with the Google Sheets API enabled.
An API key generated for the project.
Google Sheet :
A Google Sheet containing two columns: Domain (e.g., example.com) and Description (e.g., "This site contains malicious links").
Chrome Browser :
The latest version of Google Chrome installed on your system.
Setup Instructions
Step 1: Create a Google Cloud Project
Go to the Google Cloud Console .
Create a new project or select an existing one.
Enable the Google Sheets API for your project.
Generate an API key under APIs & Services > Credentials .
Restrict the API key to only allow access to your specific Google Sheet.
Step 2: Prepare the Google Sheet
Create a Google Sheet with two columns:
Column A : Domain (e.g., example.com)
Column B : Description (e.g., "This site contains phishing links")
Share the Google Sheet with the email address associated with your API key.
Step 3: Clone the Repository
Clone the repository containing the DiGuard source code:

bash
Copy
1
2
git clone https://github.com/your-repo/di-guard.git
cd di-guard
Step 4: Add API Key
Create a file named credentials.js in the root directory.
Add the following content to credentials.js:
javascript
Copy
1
2
export const googleSheetApiKey = 'YOUR_GOOGLE_SHEETS_API_KEY';
export const googleSheetId = 'YOUR_GOOGLE_SHEET_ID';
Replace YOUR_GOOGLE_SHEETS_API_KEY and YOUR_GOOGLE_SHEET_ID with your actual API key and sheet ID.
Note : Do not commit credentials.js to version control. Add it to .gitignore to ensure it remains secure. 

Step 5: Load the Extension
Open Chrome and navigate to chrome://extensions/.
Enable Developer Mode using the toggle in the top-right corner.
Click Load unpacked and select the root directory of the cloned repository.
Step 6: Test the Extension
Visit a domain listed in your Google Sheet.
Verify that the warning page appears with the correct description.
Test both the "Proceed" and "Cancel" options to ensure they function as expected.
How It Works
Background Script (background.js) :
Monitors navigation events using chrome.tabs.onUpdated.
Fetches restricted domains from the Google Sheet using the Google Sheets API.
Redirects the user to the warning.html page if the domain is restricted.
Warning Page (warning.html) :
Displays a warning message with domain-specific information fetched from the Google Sheet.
Provides two buttons:
Proceed : Navigates back to the original URL.
Cancel : Navigates back to the previous page.
Google Sheets Integration :
The Google Sheet serves as the central database for restricted domains and their descriptions.
The extension fetches this data dynamically using the Google Sheets API.
Code Structure
The project follows a modular structure:

icons/
Contains icon files for the extension.
manifest.json
Configuration file for the Chrome extension.
background.js
Background script to monitor navigation and check restricted domains.
warning.html
Warning page displayed to the user for restricted domains.
redirect.html
Optional intermediate redirection page.
credentials.js
Securely stores the Google Sheets API key and sheet ID.
README.md
Documentation explaining the extension and its functionality.

Usage
Install the extension by loading the unpacked folder in Chrome.
Navigate to any website. If the domain is listed in your Google Sheet, the warning page will appear.
On the warning page:
Click Proceed to continue navigating to the restricted domain.
Click Cancel to navigate back to the previous page.
Security Considerations
API Key Protection :
Never hardcode API keys in the extension's code.
Use a separate file (credentials.js) to store API keys and restrict access to trusted developers.
Do not commit credentials.js to version control. Add it to .gitignore.
Rate Limiting :
Implement rate limiting on API calls to prevent abuse and ensure smooth performance.
User Privacy :
Avoid storing sensitive user data without explicit consent.
Ensure that all data transmitted between the extension and external services is encrypted.
Contributing
If you'd like to contribute to the DiGuard project, follow these steps:

Fork the repository.
Create a new branch for your feature or bug fix.
Commit your changes and push them to your fork.
Submit a pull request detailing your changes.
License
This project is licensed under the MIT License. See the LICENSE file for more details.

Contact
For questions, feedback, or support, please contact the project maintainer at your-email@example.com .
