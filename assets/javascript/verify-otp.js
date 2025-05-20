$("#verifyOtpBtn").on("click", function () {
  const otp =
    $("#otp1").val() + $("#otp2").val() + $("#otp3").val() + $("#otp4").val();
  const mobile = $("#mobileNo").val();

  if (otp.length !== 4) {
    alert("Please enter all 4 digits of the OTP.");
    return;
  }

  // 🔧 Mock API response until real one is available
  const mockApiResponse = { success: true }; // change to false to test failure

  if (mockApiResponse.success) {
    // ✅ Close modal
    const modalInstance = bootstrap.Modal.getInstance(
      document.getElementById("otpModal")
    );
    modalInstance.hide();

    // ✅ Collect and submit data
    const payload = collectTableData();

    $.ajax({
      url: "https://erpnm.forrce.com/api/method/nmpub.api.v1.mylist.index",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify(payload),
      success: function (response) {
        alert("Data submitted successfully!");
        console.log("Response:", response);
      },
      error: function (xhr) {
        alert("Submission failed. See console for details.");
        console.error("Error:", xhr.responseText);
      },
    });
  } else {
    alert("OTP verification failed.");
  }
});

$.ajax({
  url: "https://your-otp-api.com/verify",
  method: "POST",
  contentType: "application/json",
  data: JSON.stringify({ mobile, otp }),
  success: function (response) {
    if (response.success) {
      // proceed
    } else {
      alert("OTP verification failed.");
    }
  },
  error: function () {
    alert("Error contacting OTP service.");
  },
});
