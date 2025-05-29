// // encryptDecrypt.js

// // Utility to set cookie manually in JS (optional if Frappe sets it already)
// function setCookie(name, value, days) {
//   let expires = "";
//   if (days) {
//     const date = new Date();
//     date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
//     expires = "; expires=" + date.toUTCString();
//   }
//   document.cookie = name + "=" + value + expires + "; path=/; SameSite=Strict";
// }

// // Retrieve cookie by name
// function getCookie(name) {
//   const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
//   return match ? match[2] : null;
// }

// // Call backend to get token
// async function getToken() {
//   try {
//     const res = await fetch(
//       "http://192.168.211.134:8000/api/method/scope_app.cookiecrypt.issue_token",
//       {
//         method: "POST",
//         credentials: "include", // Important to send/receive cookies
//       }
//     );

//     const data = await res.json();
//     const token = data.message?.token;

//     if (token) {
//       console.log("Encrypted Token:", token);
//       setCookie("x_auth_token", token, 1); // Store in cookie for 1 day
//     } else {
//       console.warn("No token received");
//     }
//   } catch (err) {
//     console.error("Failed to get token:", err);
//   }
// }

// // Call backend to validate token
// async function decryptToken() {
//   try {
//     const response = await fetch(
//       "http://192.168.211.134:8000/api/method/scope_app.cookiecrypt.validate_token",
//       {
//         method: "POST",
//         credentials: "include", // 🔥 Must include this line to send cookies!
//         headers: {
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     const data = await response.json();
//     console.log("Decryption Response:", data);
//   } catch (error) {
//     console.error("Decryption Error:", error);
//   }
// }

// Assuming you're making a fetch request to get the token
function getToken() {
  fetch(
    "http://192.168.211.134:8000/api/method/scope_app.cookiecrypt.issue_token",
    {
      method: "GET", // Or POST, depending on your setup
      credentials: "include", // Ensure cookies are included with the request
    }
  )
    .then((response) => response.json())
    .then((data) => {
      console.log("Token received:", data);
    })
    .catch((error) => console.error("Error getting token:", error));
}

// Assuming you're making a fetch request to validate the token
function decryptToken() {
  // Log the cookies before making the request
  console.log("Cookies before decrypt:", document.cookie);

  fetch(
    "http://192.168.211.134:8000/api/method/scope_app.cookiecrypt.validate_token",
    {
      method: "GET",
      credentials: "include", // Ensure cookies are included with the request
    }
  )
    .then((response) => response.json())
    .then((data) => {
      console.log("Decryption Response:", data);
    })
    .catch((error) => console.error("Error decrypting token:", error));
}
