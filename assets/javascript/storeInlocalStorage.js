// => ||Store in localStorage||
// ------------------------------------------ //

// Fetch encrypted token from the server
async function getAndDecryptToken() {
  try {
    const response = await fetch(
      "http://192.168.211.134:8000/api/method/scope_app.api.get_encrypted_token"
    );
    const result = await response.json();

    const encrypted = result.message.encrypted_token;
    const key = result.message.decryption_key;

    // Decrypt the token using AES (ECB mode)
    const decrypted = CryptoJS.AES.decrypt(
      encrypted,
      CryptoJS.enc.Utf8.parse(key),
      {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7,
      }
    ).toString(CryptoJS.enc.Utf8);

    // Store in localStorage
    localStorage.setItem("secureToken", encrypted);

    console.log("Decrypted Token:", decrypted);
  } catch (error) {
    console.error("Failed to fetch or decrypt token:", error);
  }
}

// Call on page load
window.addEventListener("DOMContentLoaded", getAndDecryptToken);
// ------------------------------------------ //

// *** NOTE
// Use localStorage when:
// You’re building a single-page app (SPA) that does most things client-side
// You're storing non-sensitive or semi-sensitive data
// You want complete control over when data is sent
// You don’t want tokens to be sent automatically on every request

// Best for:
// UI preferences, temporary access flags, encrypted session cache
// Tokens that you manually attach to fetch/AJAX requests
