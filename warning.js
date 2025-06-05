// Retry mechanism to fetch data from chrome.storage.local
function loadData(retries = 5) {
    chrome.storage.local.get(['category', 'domainDescription', 'originalUrl'], (items) => {
        if (chrome.runtime.lastError) {
            console.error("Error retrieving data:", chrome.runtime.lastError);
            return;
        }
        // Check if we got valid values
        if (!items.category && !items.domainDescription && retries > 0) {
            console.log("Data not available yet, retrying...");
            setTimeout(() => loadData(retries - 1), 1000);
        } else {
            // Update the page content
            document.getElementById('category').textContent = items.category || 'Unknown Category';
            document.getElementById('domainDescription').textContent = items.domainDescription || 'No description provided';
        }
    });
}

document.addEventListener('DOMContentLoaded', loadData);

// "Proceed Anyway" button: store an override flag and navigate to the original URL.
document.getElementById('proceed').addEventListener('click', () => {
    chrome.storage.local.get(['originalUrl'], (items) => {
        if (items.originalUrl) {
            // Set an override flag for this URL.
            chrome.storage.local.set({ proceedOverride: items.originalUrl }, () => {
                window.location.href = items.originalUrl;
            });
        }
    });
});

// "Cancel" button: close the current tab or redirect to a safe page.
document.getElementById('cancel').addEventListener('click', () => {
    chrome.tabs.getCurrent((tab) => {
        if (tab && tab.id) {
            chrome.tabs.remove(tab.id);
        } else {
            window.location.href = "https://www.google.com";
        }
    });
});