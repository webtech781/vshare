// Password match logic
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const passwordMatchStatus = document.getElementById("passwordMatchStatus");
const submitButton = document.getElementById("submitButton");
let confirmPasswordTypingStarted = false;

function checkPasswordMatch() {
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  // Check if passwords match and indicate visually
  if (confirmPasswordTypingStarted && password && confirmPassword && password === confirmPassword) {
    passwordMatchStatus.innerHTML = '<i class="fa fa-check match"></i>';
    submitButton.disabled = false;
  } else if (confirmPasswordTypingStarted) {
    passwordMatchStatus.innerHTML = '<i class="fa fa-times mismatch"></i>';
    submitButton.disabled = true;
  }
}

confirmPasswordInput.addEventListener("input", function () {
  confirmPasswordTypingStarted = true;
  checkPasswordMatch();
});

passwordInput.addEventListener("input", checkPasswordMatch);



const uploadForm = document.getElementById('uploadForm');
const progressBar = document.getElementById('progressBar');
const progressContainer = document.getElementById('progressContainer');
const downloadLink = document.getElementById('downloadLink');
const fileUploadSection = document.getElementById('fileUploadSection');
const backToHomeButton = document.getElementById('backToHome');

uploadForm.addEventListener('submit', function (event) {
  event.preventDefault();

  const formData = new FormData(uploadForm);
  const xhr = new XMLHttpRequest();

  // Hide password, submit button, and the entire file upload section when progress starts
  passwordInput.style.display = 'none';
  submitButton.style.display = 'none';
  fileUploadSection.style.display = 'none';

  // Show the progress bar
  progressContainer.style.display = 'block';

  xhr.open('POST', '/upload', true);

  // Update progress bar
  xhr.upload.onprogress = function (event) {
    if (event.lengthComputable) {
      const percentComplete = Math.round((event.loaded / event.total) * 100);
      progressBar.style.width = percentComplete + '%';
      progressBar.textContent = percentComplete + '%';
    }
  };

  xhr.onload = function () {
    if (xhr.status === 200) {
      progressContainer.style.display = 'none';
      const response = JSON.parse(xhr.responseText);

      // Set the file link and display download link
      const fileLink = document.getElementById('fileLink');
      fileLink.href = response.fileLink;
      fileLink.textContent = 'Download File';
      downloadLink.style.display = 'block';

      // Show the copy button and set up the copy functionality
      const copyButton = document.getElementById('copyButton');
      copyButton.style.display = 'inline-block';
      copyButton.addEventListener('click', function (event) {
        event.preventDefault(); // Prevent default action
        event.stopPropagation(); // Stop bubbling up to the form
        copyToClipboard(response.fileLink);
      });

      // Generate and display the QR code for the download link
      generateQRCode(response.fileLink);

      // Show the back to home button
      backToHomeButton.style.display = 'block';
    } else {
      console.error('Upload failed.');
    }
  };

  xhr.onerror = function () {
    console.error('Error while uploading the file.');
  };

  xhr.send(formData);
});

// Function to copy link to clipboard
function copyToClipboard(text) {
  const tempInput = document.createElement('input');
  tempInput.style.position = 'absolute';
  tempInput.style.left = '-9999px';
  tempInput.value = text;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand('copy');
  document.body.removeChild(tempInput);
  alert('Link copied to clipboard!');
}

// Function to generate QR code
function generateQRCode(link) {
  const qrCodeContainer = document.getElementById('qrcode');
  qrCodeContainer.innerHTML = ''; // Clear any existing QR code
  new QRCode(qrCodeContainer, {
    text: link,
    width: 128,
    height: 128,
  });
}

// Back to home functionality
backToHomeButton.addEventListener('click', function() {
  window.location.href = '/';  // Redirects to home page
});


document.querySelectorAll('.drop-zone__input').forEach((inputElement) => {
  const dropZoneElement = inputElement.closest('.drop-zone');

  dropZoneElement.addEventListener('click', (e) => {
    inputElement.click();
  });

  inputElement.addEventListener('change', (e) => {
    if (inputElement.files.length) {
      updateThumbnail(dropZoneElement, inputElement.files[0]);
    }
  });

  dropZoneElement.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZoneElement.classList.add('drop-zone--over');
  });

  ['dragleave', 'dragend'].forEach((type) => {
    dropZoneElement.addEventListener(type, (e) => {
      dropZoneElement.classList.remove('drop-zone--over');
    });
  });

  dropZoneElement.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) {
      inputElement.files = e.dataTransfer.files;
      updateThumbnail(dropZoneElement, e.dataTransfer.files[0]);
    }
    dropZoneElement.classList.remove('drop-zone--over');
  });
});

function updateThumbnail(dropZoneElement, file) {
  let thumbnailElement = dropZoneElement.querySelector('.drop-zone__thumb');
  if (dropZoneElement.querySelector('.drop-zone__prompt')) {
    dropZoneElement.querySelector('.drop-zone__prompt').remove();
  }

  if (!thumbnailElement) {
    thumbnailElement = document.createElement('div');
    thumbnailElement.classList.add('drop-zone__thumb');
    dropZoneElement.appendChild(thumbnailElement);
  }

  thumbnailElement.dataset.label = file.name;
  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      thumbnailElement.style.backgroundImage = `url('${reader.result}')`;
    };
  } else {
    thumbnailElement.style.backgroundImage = null;
  }
}
