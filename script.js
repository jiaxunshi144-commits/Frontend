const backendUrl = "https://backend-2h3r.onrender.com"; // your Render backend

document.getElementById("uploadBtn").addEventListener("click", async () => {
  const fileInput = document.getElementById("fileInput");
  if (!fileInput.files.length) {
    alert("Please select a file first!");
    return;
  }

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  try {
    const res = await fetch(`${backendUrl}/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (data.success) {
      document.getElementById("result").classList.remove("hidden");
      document.getElementById("fileHash").textContent = data.fileHash;
      document.getElementById("txLink").href = data.transactionLink;

      document.getElementById("qrCodeContainer").innerHTML =
        `<img src="${data.qrCode}" alt="QR Code" />`;
    } else {
      alert("Registration failed: " + data.error);
    }
  } catch (err) {
    alert("Server connection failed. Please check backend.");
  }
});

function scrollToUpload() {
  document.querySelector(".container").scrollIntoView({ behavior: "smooth" });
}
