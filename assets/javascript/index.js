console.log("Script loaded!");

$(document).ready(function () {
  // Initialize variables
  let debounceTimer;
  let deletedRowData = null;
  let undoTimeout = null;

  // Initialize DataTable
  const dataTable = initializeDataTable();

  // Event listeners and actions
  handleSearchInput();
  handleRowActions();
  handleUndoDeletion();
  handleDropdownVisibility();

  // Initialize DataTable
  function initializeDataTable() {
    return $("#productTable").DataTable({
      responsive: true,
      pageLength: 5,
      columnDefs: [
        {
          targets: [1],
          createdCell: function (td) {
            $(td).attr("contenteditable", "true");
          },
        },
      ],
    });
  }

  // Live search handler
  function handleSearchInput() {
    $("#productSearch").on("input", function () {
      clearTimeout(debounceTimer);
      const searchTerm = $(this).val().trim().toLowerCase();

      if (searchTerm.length < 2) {
        $("#dropdownResults").hide();
        return;
      }

      debounceTimer = setTimeout(() => {
        lastSearchTerm = searchTerm;
        showLoadingIndicator();
        fetchSearchResults(searchTerm);
      }, 400);
    });
  }

  // Fetch search results from API
  function fetchSearchResults(searchTerm) {
    $.ajax({
      url: "https://erpnm.forrce.com/api/method/nmpub.api.v1.search.index",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify({ query: searchTerm }),
      success: function (response) {
        const products = response.message.items || [];
        displayDropdown(products);
      },
      error: function (err) {
        console.error("API request failed:", err);
        $("#dropdownResults").hide();
      },
    });
  }

  // Display dropdown with product results
  function displayDropdown(products) {
    if (!products.length) {
      $("#dropdownResults")
        .html(`<li class="list-group-item text-muted">No products found</li>`)
        .show();
      return;
    }

    const listHtml = products
      .map(
        (product) => `
        <li class="list-group-item"
            data-name="${product.item_name}"
            data-price="${product.price}"
            data-market="${product.market_price}">
          <strong>${product.item_name}</strong><br>
          <small>Price: ₹${product.price}, MRP: ₹${product.market_price}</small>
        </li>`
      )
      .join("");

    $("#dropdownResults").html(listHtml).show();
  }

  // Show loading indicator
  function showLoadingIndicator() {
    $("#dropdownResults")
      .html(
        `<li class="list-group-item text-muted">
          <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          Loading...
        </li>`
      )
      .show();
  }

  // Handle row actions like adding a product or changing quantity
  function handleRowActions() {
    // Add product to table
    $(document).on("click", "#dropdownResults li", function () {
      addProductToTable($(this));
      $("#productSearch").val("");
      $("#dropdownResults").hide();
      updateTotals();
    });

    // Handle quantity change
    $("#productTable tbody").on("input", ".qty-input", function () {
      updateRowData($(this));
    });

    // Handle delete row
    $("#productTable tbody").on("click", ".delete-btn", function () {
      deleteRow($(this));
    });
  }

  // Add a product to the table
  function addProductToTable($product) {
    const productName = $product.data("name");
    const price = parseFloat($product.data("price"));
    const marketPrice = parseFloat($product.data("market"));
    const qty = 1;
    const saving = marketPrice - price;

    const newRow = dataTable.row
      .add([
        dataTable.rows().count() + 1,
        productName,
        `<input type="number" class="form-control form-control-sm qty-input" value="${qty}" min="1">`,
        `₹${price.toFixed(2)}`,
        `₹${marketPrice.toFixed(2)}`,
        `₹${saving.toFixed(2)}`,
        `<button class="btn btn-sm btn-danger delete-btn"><i class="bi bi-trash"></i></button>`,
      ])
      .draw()
      .node();

    $(newRow).data({
      unitPrice: price,
      unitMarketPrice: marketPrice,
    });

    updateTotals();
  }

  // Update row data when quantity changes
  function updateRowData($input) {
    const qty = parseInt($input.val()) || 1;
    const $row = $input.closest("tr");
    const rowData = dataTable.row($row).data();

    const unitPrice = $row.data("unitPrice") || 0;
    const unitMarketPrice = $row.data("unitMarketPrice") || 0;

    const totalPrice = unitPrice * qty;
    const totalMarketPrice = unitMarketPrice * qty;
    const totalSaving = totalMarketPrice - totalPrice;

    dataTable
      .row($row)
      .data([
        rowData[0],
        rowData[1],
        `<input type="number" class="form-control form-control-sm qty-input" value="${qty}" min="1">`,
        `₹${totalPrice.toFixed(2)}`,
        `₹${totalMarketPrice.toFixed(2)}`,
        `₹${totalSaving.toFixed(2)}`,
        `<button class="btn btn-sm btn-danger delete-btn"><i class="bi bi-trash"></i></button>`,
      ])
      .draw(false);

    updateTotals();
  }

  // Delete a row with confirmation and undo option
  function deleteRow($button) {
    const $row = $button.closest("tr");
    const rowIndex = dataTable.row($row).index();
    const rowData = dataTable.row($row).data();

    if (!confirm("Are you sure you want to delete this row?")) return;

    deletedRowData = rowData;
    dataTable.row($row).remove().draw();
    updateSerialNumbers();
    updateTotals();

    showUndoNotification();
  }

  // Show undo notification
  function showUndoNotification() {
    $("#undoNotification").removeClass("d-none");

    if (undoTimeout) clearTimeout(undoTimeout);
    undoTimeout = setTimeout(() => {
      deletedRowData = null;
      $("#undoNotification").addClass("d-none");
    }, 5000);
  }

  // Undo deletion action
  function handleUndoDeletion() {
    $("#undoBtn").on("click", function () {
      if (deletedRowData) {
        restoreDeletedRow();
        updateTotals();
        $("#undoNotification").addClass("d-none");
        deletedRowData = null;
        clearTimeout(undoTimeout);
      }
    });
  }

  // Restore deleted row
  function restoreDeletedRow() {
    const newRow = dataTable.row.add(deletedRowData).draw().node();
    const qty = parseInt($(deletedRowData[2]).val()) || 1;
    const totalPrice = parseFloat(deletedRowData[3].replace(/[₹,]/g, "")) || 0;
    const unitPrice = totalPrice / qty;
    const totalMarketPrice =
      parseFloat(deletedRowData[4].replace(/[₹,]/g, "")) || 0;
    const unitMarketPrice = totalMarketPrice / qty;

    $(newRow).data({
      unitPrice: unitPrice,
      unitMarketPrice: unitMarketPrice,
    });

    updateSerialNumbers();
  }

  // Handle dropdown visibility
  function handleDropdownVisibility() {
    // Hide dropdown on outside click
    $(document).on("click", function (e) {
      if (!$(e.target).closest("#productSearch, #dropdownResults").length) {
        $("#dropdownResults").hide();
      }
    });

    // Prevent dropdown from closing on click inside
    $("#dropdownResults").on("mousedown", function (e) {
      e.preventDefault();
    });
  }

  // Recalculate serial numbers
  function updateSerialNumbers() {
    dataTable.rows().every(function (rowIdx) {
      const data = this.data();
      data[0] = rowIdx + 1;
      this.data(data);
    });
  }

  // Update totals (price and saving)
  function updateTotals() {
    let totalPrice = 0;
    let totalSaving = 0;

    dataTable.rows().every(function () {
      const row = this.node();
      const unitPrice = $(row).data("unitPrice") || 0;
      const unitMarketPrice = $(row).data("unitMarketPrice") || 0;
      const qty = parseInt($(row).find(".qty-input").val()) || 1;

      totalPrice += unitPrice * qty;
      totalSaving += (unitMarketPrice - unitPrice) * qty;
    });

    $("#totalPrice").text(totalPrice.toFixed(2));
    $("#totalSaving").text(totalSaving.toFixed(2));
  }
});

// Collect product data from the table
function collectTableData() {
  const items = [];

  $("#productTable tbody tr").each(function () {
    const $row = $(this);
    const itemName = $row.find("td").eq(1).text().trim();
    const qty = parseInt($row.find(".qty-input").val()) || 1;

    items.push({
      item_name: itemName,
      quantity: qty,
    });
  });

  return { items: items };
}

// Handle Submit button click
$("#submitBtn").on("click", function () {
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
});

// Show modal when submit button is clicked
document.getElementById("submitBtn").addEventListener("click", function () {
  var myModal = new bootstrap.Modal(document.getElementById("otpModal"));
  myModal.show();
});

// OTP Modal Logic
document.getElementById("sendOtpBtn").addEventListener("click", function () {
  document.getElementById("mobileNo").disabled = true;
  document.getElementById("otpSection").style.display = "block";
  document.getElementById("verifyOtpBtn").style.display = "inline-block";
});

// Verify OTP Button Logic
document.getElementById("verifyOtpBtn").addEventListener("click", function () {
  var otp =
    document.getElementById("otp1").value +
    document.getElementById("otp2").value +
    document.getElementById("otp3").value +
    document.getElementById("otp4").value;

  if (otp.length === 4) {
    alert("OTP Verified Successfully: " + otp);
    var myModal = bootstrap.Modal.getInstance(
      document.getElementById("otpModal")
    );
    myModal.hide();
  } else {
    alert("Please enter a complete OTP.");
  }
});
