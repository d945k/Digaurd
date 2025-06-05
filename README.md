
<p align="center">
  <img src="icons/icon128.png" alt="DiGuard Icon" width="128">
</p>


DiGuard is a Chrome extension developed to enhance browsing safety by detecting and blocking access to malicious or restricted websites. It first checks visited domains in real time against a dynamic blacklist stored in Google Sheets. If the domain is not found there, it is then verified using the VirusTotal API. If VirusTotal identifies the domain as malicious, it is automatically added to the DiGuard blacklist and immediately flagged. When a threat is detected, the user is redirected to a warning page with the option to proceed or cancel navigation.

🔍 Features

Real-time monitoring of visited domains
Dynamic blacklist powered by Google Sheets
VirusTotal API integration for secondary threat analysis
IndexedDB caching for improved performance and reduced API calls
Customizable warning page with domain-specific messages
Secure handling of API keys (not committed to version control)

🚀 Getting Started

1- Clone the repository:(https://github.com/d945k/Digaurd.git)
2- Load the extension in Chrome:
Go to chrome://extensions/
Enable Developer mode
Click Load unpacked and select the project directory (digaurd) 

🛠️ How It Works

Background Script (background.js)
Listens for tab updates and fetches the current domain
Checks the domain against:
A dynamic Google Sheets blacklist
VirusTotal API for threat scoring
Redirects the user to warning.html if a threat is detected
Warning Page (warning.html)
Displays a threat message and the option to proceed or cancel
Pulls data from the Sheet and VirusTotal response
Local Caching (IndexedDB)
Used to cache scanned domains and their status
Improves performance and reduces repeated API calls

🧠 Usage

Once loaded, the extension runs in the background. When the user visits a URL:

It checks against the Google Sheets blacklist
Then queries VirusTotal if its not found in the blacklist for a secondary layer of security
If flagged, the user is shown a warning with the option to proceed or return

🔐 Security Considerations

API keys are stored in credentials.js
No personal data is stored or transmitted

🤝 Contributing

Contributions are welcome!
To contribute:

Fork the repo
Create a feature branch
Push your changes
Open a pull request with a clear description

📄 License

This project is licensed under the MIT License.

📬 Contact

For questions or feedback, please contact: dania.sameer.kamal@gmail.com
