// Show OTP modal on submit button click
document.getElementById("submitBtn").addEventListener("click", function () {
  const myModal = new bootstrap.Modal(document.getElementById("otpModal"));
  myModal.show();
});

// Handle "Verify Mobile Number" button click
document
  .getElementById("verifyMobileNumberBtn")
  .addEventListener("click", function () {
    const mobileNo = document.getElementById("mobileNo").value.trim();

    if (!mobileNo.match(/^\d{10}$/)) {
      alert("Enter a valid 10-digit mobile number.");
      return;
    }

    // Disable button and show countdown
    const button = this;
    let waitTime = 10; // Customize time
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = `Processing... (${waitTime}s)`;

    const interval = setInterval(() => {
      waitTime--;
      if (waitTime > 0) {
        button.textContent = `Processing... (${waitTime}s)`;
      } else {
        clearInterval(interval);
        button.disabled = false;
        button.textContent = originalText;
      }
    }, 1000);

    console.log("Sending OTP to:", mobileNo);

    fetch("https://erpnm.forrce.com/api/method/nmpub.api.v1.send_otp.index", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: mobileNo }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("OTP Send Response:", data);
        if (data.message?.success_key === 1) {
          document.getElementById("mobileNo").disabled = false;
          document.getElementById("otpSection").style.display = "block";
          document.getElementById("verifyOtpBtn").style.display =
            "inline-block";
        } else {
          alert(
            "Failed to send OTP: " + (data.message?.message || "Unknown error")
          );
        }
      })
      .catch((err) => {
        console.error("OTP send error:", err);
        alert("Error sending OTP.");
      });
  });

// Handle OTP verification
document.getElementById("verifyOtpBtn").addEventListener("click", function () {
  const otp = ["otp1", "otp2", "otp3", "otp4"]
    .map((id) => document.getElementById(id).value)
    .join("");

  const phone = document.getElementById("mobileNo").value;

  if (otp.length !== 4) {
    alert("Enter 4-digit OTP.");
    return;
  }

  // Verify OTP
  fetch("https://erpnm.forrce.com/api/method/nmpub.api.v1.verify_otp.index", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: phone, otp: otp }),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("OTP Verification Response:", data);
      if (data.message?.validated === "Yes") {
        // Blur focused element before hiding modal
        document.activeElement.blur();

        // Hide OTP modal after successful verification
        const myModal = bootstrap.Modal.getInstance(
          document.getElementById("otpModal")
        );
        myModal.hide();

        // Collect product data and phone number
        const payload = collectTableData();
        console.log("Payload being sent to /mylist:", payload);

        // Send final order payload
        fetch("https://erpnm.forrce.com/api/method/nmpub.api.v1.mylist.index", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
          .then((res) => res.json())
          .then((orderResponse) => {
            console.log("Order API Response:", orderResponse);

            // Show success modal after successful order
            const successModal = new bootstrap.Modal(
              document.getElementById("orderSuccessModal")
            );
            successModal.show();
          })
          .catch((err) => {
            console.error("Failed to submit order payload:", err);
            alert("Something went wrong while submitting your order.");
          });
      } else {
        alert("Invalid OTP. Please try again.");
      }
    })
    .catch((err) => {
      console.error("OTP verification failed:", err);
      alert("Something went wrong during OTP verification.");
    });
});

// Reset everything on modal close
document
  .getElementById("orderSuccessModal")
  .addEventListener("hidden.bs.modal", function () {
    const tableBody = document.querySelector("#productTable tbody");
    tableBody.innerHTML = "";

    document.getElementById("totalPrice").textContent = "0.00";
    document.getElementById("totalSaving").textContent = "0.00";

    document.getElementById("mobileNo").disabled = false;
    document.getElementById("mobileNo").value = "";
    document.getElementById("otpSection").style.display = "none";
    document.getElementById("verifyOtpBtn").style.display = "none";

    ["otp1", "otp2", "otp3", "otp4"].forEach((id) => {
      document.getElementById(id).value = "";
    });

    location.reload();
  });

// Collect product data from the table for payload
function collectTableData() {
  const items = [];

  $("#productTable tbody tr").each(function () {
    const $row = $(this);
    const itemName = $row.find("td").eq(1).text().trim();
    const qty = parseInt($row.find(".qty-input").val()) || 1;

    const unitPrice = $row.data("unitPrice") || 0;
    const unitMarketPrice = $row.data("unitMarketPrice") || 0;

    items.push({
      item_name: itemName,
      item_code: itemName, // Item_code if available
      price: unitPrice,
      market_price: unitMarketPrice,
      quantity: qty,
    });
  });

  const phone = document.getElementById("mobileNo").value.trim();

  return {
    phone: phone,
    items: items,
  };
}

// Auto-focus between OTP inputs
document.querySelectorAll(".otp-input").forEach((input, index, inputs) => {
  input.addEventListener("input", function () {
    if (this.value.length === this.maxLength) {
      const nextInput = inputs[index + 1];
      if (nextInput) {
        nextInput.focus();
      }
    } else if (this.value.length === 0) {
      const prevInput = inputs[index - 1];
      if (prevInput) {
        prevInput.focus();
      }
    }
  });
});

// Restrict OTP input to numbers only
document.querySelectorAll(".otp-input").forEach((input) => {
  input.addEventListener("input", function () {
    this.value = this.value.replace(/\D/g, "");
  });
});
