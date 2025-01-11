//Canvas element initialization
var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");

//Image's variables setup
var img = new Image();
var imgCopy;
var selectionX, selectionY, selectionW, selectionH;
var scaleable = true;


// Load image from external source
document.getElementById("imageInput").addEventListener("change", e =>{

    let reader = new FileReader();
    reader.addEventListener("load", event => {
        img = new Image();
        img.src = event.target.result;

        // Create a copy of the image
        imgCopy = new Image();
        imgCopy.src = event.target.result;

        img.onload = () => {

            // Resize canvas based on image dimensions
            canvas.width = img.width;
            canvas.height = img.height;
            while (canvas.width > 750 || canvas.height > 750) {
                canvas.width *= 0.9;
                canvas.height *= 0.9;
            }

            // Display image dimensions
            document.getElementById("currentDimension").innerText = `Image dimensions: ${img.width} x ${img.height}`;
            
            // Draw image and reset selection
            context.drawImage(img, 0, 0, canvas.width, canvas.height);
            resetSelection();

            // Activate edit options
            document.getElementById("btnDownload").hidden = false;
            document.getElementById("selectionContainer").hidden = false;
            document.getElementById("effectContainer").hidden = false;
            document.getElementById("textContainer").hidden = false;
            document.getElementById("scaleContainer").hidden = false;

            // Display canvas container
            document.getElementById("canvasContainer").hidden = false;

            selectAll();
        };
    });
    reader.readAsDataURL(e.target.files[0]);
});

//EVENT HANDLING

// Button events for various actions
document.getElementById("btnSelectAll").addEventListener("click", selectAll);
document.getElementById("btnDeleteSelection").addEventListener("click", deleteSelection);
document.getElementById("btnCrop").addEventListener("click", cropSelection);
document.getElementById("btnRestore").addEventListener("click", restoreImage);
document.getElementById("btnMonochrome").addEventListener("click", getMonochromeEffect);
document.getElementById("btnAddText").addEventListener("click", addTextToCanvas);
document.getElementById("btnScale").addEventListener("click", scaleImage);
document.getElementById("btnDownload").addEventListener("click", downloadImg);

// Scaling events
document.getElementById("heightScaling").addEventListener("change", computeWidth);
document.getElementById("widthScaling").addEventListener("change", computeHeight);

// Mouse events for image selection
document.getElementById("canvas").addEventListener("mousedown", handleMouseDown);
document.getElementById("canvas").addEventListener("mousemove", handleMouseMove);
document.getElementById("canvas").addEventListener("mouseup", handleMouseUp);


// FUNCTIONS

// Reset selection to cover the full canvas
function selectAll() {
    context.drawImage(img, 0, 0, canvas.width, canvas.height);
    resetSelection();
    context.beginPath();
    context.strokeStyle = "cyan";
    context.lineWidth = 3;
    context.rect(selectionX, selectionY, selectionW, selectionH);
    context.stroke();
}

// Reset selection values to default (full canvas)
function resetSelection() {
    selectionX = 0;
    selectionY = 0;
    selectionW = canvas.width;
    selectionH = canvas.height;
}

// Restore the original image
function restoreImage() {
    img.src = imgCopy.src;
    img.width = imgCopy.width;
    img.height = imgCopy.height;

    // Resize canvas based on restored image size
    canvas.width = img.width;
    canvas.height = img.height;
    while (canvas.width > 750 || canvas.height > 750) {
        canvas.width *= 0.9;
        canvas.height *= 0.9;
    }
    selectAll();
}

// Crop the selected area of the image
function cropSelection() {
    if (selectionH < 50 && selectionW < 50) {
        alert("Selection is too small to crop.");
        return;
    }
    selectionPixels = context.getImageData(selectionX + 2, selectionY + 2, selectionW - 2, selectionH - 2);
    canvas.width = selectionW - 4;
    canvas.height = selectionH - 4;
    context.putImageData(selectionPixels, 0, 0);

    img.src = canvas.toDataURL();
    img.height = canvas.height;
    img.width = canvas.width;
    selectAll();

    document.getElementById("currentDimension").innerText = `Image dimensions: ${img.width} x ${img.height}`;
    document.getElementById("heightScaling").value = img.height;
    document.getElementById("widthScaling").value = img.width;
}

// Delete the selected area, replacing it with white pixels
function deleteSelection() {
    context.drawImage(img, 0, 0, canvas.width, canvas.height);
    pixelSelection = context.getImageData(selectionX, selectionY, selectionW, selectionH);
    for (i = 0; i < (selectionW) * (selectionH) * 4; i += 4) {
        pixelSelection.data[i + 0] = 256; // Set red channel to white
        pixelSelection.data[i + 1] = 256; // Set green channel to white
        pixelSelection.data[i + 2] = 256; // Set blue channel to white
    }
    context.putImageData(pixelSelection, selectionX, selectionY);
    img.src = canvas.toDataURL();
    selectAll();
}

// Apply monochrome effect (grayscale) to the selected area
function getMonochromeEffect() {
    context.drawImage(img, 0, 0, canvas.width, canvas.height);
    selectionPixels = context.getImageData(selectionX, selectionY, selectionW, selectionH);
    for (i = 0; i < (selectionW) * (selectionH) * 4; i += 4) {
        avg = (selectionPixels.data[i + 0] + selectionPixels.data[i + 1] + selectionPixels.data[i + 2]) / 3;
        selectionPixels.data[i + 0] = avg; // Apply grayscale to red channel
        selectionPixels.data[i + 1] = avg; // Apply grayscale to green channel
        selectionPixels.data[i + 2] = avg; // Apply grayscale to blue channel
    }
    context.putImageData(selectionPixels, selectionX, selectionY);
    img.src = canvas.toDataURL();
    selectAll();
}

//Add text from the user input to the canvas
function addTextToCanvas() {
    // Retrieve values from the form
    const text = document.getElementById("inputText").value;
    const size = parseInt(document.getElementById("textSize").value);
    const color = document.getElementById("textColor").value;
    const posX = parseInt(document.getElementById("textX").value);
    const posY = parseInt(document.getElementById("textY").value);

    // Check if the text is valid
    if (!text) {
        alert("Please enter desired text!");
        return;
    }

    // Redraw the image to reset any previous modifications
    context.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Set the text style and add the text to the canvas
    context.font = `${size}px Arial`;
    context.fillStyle = color;
    context.fillText(text, posX, posY);

    // Update the image with the added text
    img.src = canvas.toDataURL();
}

var isDown = false;
var startX, startY;

// Handle mouse down for selection starting point
function handleMouseDown(e) {
    e.preventDefault();
    e.stopPropagation();
    startX = e.offsetX;
    startY = e.offsetY;
    isDown = true;
}

// Handle mouse up for selection ending point and finalize the selection
function handleMouseUp(e) {
    e.preventDefault();
    e.stopPropagation();
    isDown = false;
    selectionX = startX;
    selectionY = startY;
    selectionW = e.offsetX - startX;
    selectionH = e.offsetY - startY;
    if (selectionW < 0) {
        selectionX += selectionW;
        selectionW *= -1;
    }
    if (selectionH < 0) {
        selectionY += selectionH;
        selectionH *= -1;
    }
}

// Handle mouse move for drawing the selection box
function handleMouseMove(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!isDown) return;

    // Compute the current mouse coordinates
    var mouseX = e.offsetX;
    var mouseY = e.offsetY;

    // Compute the size and position of the selection
    selectionX = Math.min(startX, mouseX);
    selectionY = Math.min(startY, mouseY);
    selectionW = Math.abs(mouseX - startX);
    selectionH = Math.abs(mouseY - startY);

    // Clear the canvas and redraw the image
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Draw the selection rectangle
    context.beginPath();
    context.strokeStyle = "cyan";
    context.lineWidth = 3;
    context.strokeRect(selectionX, selectionY, selectionW, selectionH);
    context.stroke();
}


// Compute width based on selected height 
function computeWidth() {
    if (document.getElementById("heightScaling").value < 50 || document.getElementById("heightScaling").value > 5000) {
        alert("Invalid dimensions!");
        scaleable = false;
        return;
    }
    scaleable = true;
    var newHeight = document.getElementById("heightScaling").value;
    var offset = newHeight / img.height;
    document.getElementById("widthScaling").value = Math.floor(img.width * offset);
}

// Compute height based on selected width 
function computeHeight() {
    if (document.getElementById("widthScaling").value < 50 || document.getElementById("widthScaling").value > 5000) {
        alert("Invalid dimensions!");
        scaleable = false;
        return;
    }
    scaleable = true;
    var newWidth = document.getElementById("widthScaling").value;
    var offset = newWidth / img.width;
    document.getElementById("heightScaling").value = Math.floor(img.height * offset);
}

// Apply scaling to the image based on selected width and height
function scaleImage() {
    if (!scaleable) {
        alert("Invalid dimensions!");
        return;
    }

    // Check if both width and height have been set to valid values
    const newWidth = document.getElementById("widthScaling").value;
    const newHeight = document.getElementById("heightScaling").value;

    if (newWidth <= 0 || newHeight <= 0) {
        alert("Please set both width and height to valid values before scaling!");
        return;
    }

    // Apply the scaling only if the dimensions are valid
    canvas.height = newHeight;
    canvas.width = newWidth;
    img.height = newHeight;
    img.width = newWidth;
    context.drawImage(img, 0, 0, canvas.width, canvas.height);
    document.getElementById("currentDimension").innerText = `Image dimensions: ${img.width} x ${img.height}`;

    // Save canvas changes to the image
    context.drawImage(img, 0, 0, canvas.width, canvas.height);
    img.src = canvas.toDataURL();
    selectAll();
}

// Download the current canvas as an image
function downloadImg() {
    document.getElementById("linkDownload").href = img.src;
}
