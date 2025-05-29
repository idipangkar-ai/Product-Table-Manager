// => ||Store in Cokkie 🍪||
// ------------------------------------------ //

// Fetch the encrypted token from Frappe backend and store it as a cookie
async function fetchAndStoreEncryptedTokenAsCookie(apiUrl) {
  try {
    const response = await fetch(apiUrl);
    const result = await response.json();

    const encryptedToken = result.message.encrypted_token;

    // Store encrypted token in cookie
    document.cookie = `secureToken=${encryptedToken}; path=/; SameSite=Strict`;

    console.log("Encrypted token stored as cookie:", encryptedToken);
  } catch (error) {
    console.error("Failed to fetch or store token:", error);
  }
}

// Helper: Read cookie by name
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

// Run when page is ready
window.addEventListener("DOMContentLoaded", () => {
  fetchAndStoreEncryptedTokenAsCookie(
    "http://192.168.211.134:8000/api/method/scope_app.api.get_encrypted_token"
  );

  // Optional: test retrieval from cookie
  setTimeout(() => {
    const token = getCookie("secureToken");
    console.log("Token from cookie:", token);
  }, 1000);
});
// ------------------------------------------ //

// *** Note:
// Use cookies when:
// You want the token to be automatically included in all requests
// You want to secure the token from JavaScript (with HttpOnly)
// You want to integrate with server-side sessions or login flow
// You need to share auth between tabs/windows without JS logic

// Best for:
// Login/authentication tokens
// Session identifiers
// Server-side protected routes
// CSRF tokens with form submissions
