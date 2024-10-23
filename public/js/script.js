// Password match logic
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const passwordMatchStatus = document.getElementById("passwordMatchStatus");
const submitButton = document.getElementById("submitButton");

function checkPasswordMatch() {
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  if (password && confirmPassword) {
    if (password === confirmPassword) {
      passwordMatchStatus.textContent = "Passwords match.";
      passwordMatchStatus.classList.remove("text-danger");
      passwordMatchStatus.classList.add("text-success");
      submitButton.disabled = false;
    } else {
      passwordMatchStatus.textContent = "Passwords do not match.";
      passwordMatchStatus.classList.remove("text-success");
      passwordMatchStatus.classList.add("text-danger");
      submitButton.disabled = true;
    }
  } else {
    passwordMatchStatus.textContent = "";
    submitButton.disabled = false;
  }
}

passwordInput.addEventListener("input", checkPasswordMatch);
confirmPasswordInput.addEventListener("input", checkPasswordMatch);

// Upload form submission logic
const uploadForm = document.getElementById("uploadForm");
const progressBar = document.getElementById("progressBar");
const progressContainer = document.getElementById("progressContainer");
const downloadSection = document.getElementById("downloadSection");
const fileLinkElement = document.getElementById("fileLink");
const copyButton = document.getElementById('copyButton');

uploadForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const formData = new FormData(uploadForm);
  const xhr = new XMLHttpRequest();

  uploadForm.style.display = "none";
  progressContainer.style.display = "block";

  xhr.open("POST", "/upload", true);

  xhr.upload.onprogress = function (event) {
    if (event.lengthComputable) {
      const percentComplete = Math.round((event.loaded / event.total) * 100);
      progressBar.style.width = percentComplete + "%";
      progressBar.textContent = `${percentComplete}%`; // Add percentage symbol

    // Apply the custom class for styling
    progressBar.classList.add("progress-bar-custom");
    }
  };

  xhr.onload = function () {
    if (xhr.status === 200) {
      progressContainer.style.display = "none";
      const response = JSON.parse(xhr.responseText);

      fileLinkElement.href = response.fileLink;
      downloadSection.style.display = "block";

      generateQRCode(response.fileLink);
    } else {
      console.error("Upload failed.");
      alert("An error occurred while uploading the file.");
    }
  };

  xhr.onerror = function () {
    console.error("Error while uploading the file.");
    alert("An error occurred while uploading the file.");
  };

  xhr.send(formData);
});

// Reset button functionality to reload the page
const resetButton = document.getElementById("resetButton");

resetButton.addEventListener("click", function () {
  location.reload(); // Reloads the page, clearing all form data and state
});

// QR code generation
function generateQRCode(link) {
  const qrCodeContainer = document.getElementById("qrcode");
  qrCodeContainer.innerHTML = "";
  new QRCode(qrCodeContainer, {
    text: link,
    width: 128,
    height: 128,
  });
}

// Drag-and-drop functionality
document.querySelectorAll(".drop-zone__input").forEach((inputElement) => {
  const dropZoneElement = inputElement.closest(".drop-zone");

  dropZoneElement.addEventListener("click", () => {
    inputElement.click();
  });

  inputElement.addEventListener("change", () => {
    if (inputElement.files.length) {
      updateThumbnail(dropZoneElement, inputElement.files[0]);
    }
  });

  dropZoneElement.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZoneElement.classList.add("drop-zone--over");
  });

  ["dragleave", "dragend"].forEach((type) => {
    dropZoneElement.addEventListener(type, () => {
      dropZoneElement.classList.remove("drop-zone--over");
    });
  });

  dropZoneElement.addEventListener("drop", (e) => {
    e.preventDefault();

    if (e.dataTransfer.files.length) {
      inputElement.files = e.dataTransfer.files;
      updateThumbnail(dropZoneElement, e.dataTransfer.files[0]);
    }

    dropZoneElement.classList.remove("drop-zone--over");
  });
});

// Update thumbnail in the drop zone
function updateThumbnail(dropZoneElement, file) {
  let thumbnailElement = dropZoneElement.querySelector(".drop-zone__thumb");

  if (dropZoneElement.querySelector(".drop-zone__prompt")) {
    dropZoneElement.querySelector(".drop-zone__prompt").remove();
  }

  if (!thumbnailElement) {
    thumbnailElement = document.createElement("div");
    thumbnailElement.classList.add("drop-zone__thumb");
    dropZoneElement.appendChild(thumbnailElement);
  }

  thumbnailElement.dataset.label = file.name;

  if (file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      thumbnailElement.style.backgroundImage = `url('${reader.result}')`;
    };
  } else {
    thumbnailElement.style.backgroundImage = "url('/img/file-icon.png')";
  }
}
const backToHomeButton = document.getElementById("backToHome");

backToHomeButton.addEventListener("click", () => {
  location.reload();  // Reloads the page to reset the form
});



// Copy link to clipboard
copyButton.addEventListener('click', function () {
  navigator.clipboard.writeText(fileLinkElement.href)
    .then(() => alert('Link copied to clipboard!'))
    .catch(err => console.error('Could not copy text: ', err));
});