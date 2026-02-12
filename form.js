// Global variables
let photosList = [];
let captionsList = [];

// DOM elements
const memoryForm = document.getElementById('memoryForm');
const photoInput = document.getElementById('photo');
const previewContainer = document.getElementById('previewContainer');
const previewBtn = document.getElementById('previewBtn');
const generatePDFBtn = document.getElementById('generatePDF');

// Handle photo selection
photoInput.addEventListener('change', (e) => {
    photosList = Array.from(e.target.files);
    captionsList = new Array(photosList.length).fill('');
    renderPreview();
});

// Render preview images and captions
function renderPreview() {
    previewContainer.innerHTML = ''; // Clear previous content

    photosList.forEach((photo, index) => {
        const wrapper = document.createElement('div');
        wrapper.classList.add('photo-wrapper');

        const img = document.createElement('img');
        img.src = URL.createObjectURL(photo);
        img.alt = `Photo ${index + 1}`;
        img.classList.add('preview-image');

        const captionInput = document.createElement('input');
        captionInput.type = 'text';
        captionInput.placeholder = 'Enter caption (emojis supported! 💕✨)';
        captionInput.classList.add('caption-input');
        captionInput.addEventListener('input', (e) => {
            captionsList[index] = e.target.value;
        });

        wrapper.appendChild(img);
        wrapper.appendChild(captionInput);
        previewContainer.appendChild(wrapper);
    });
}

// Preview button click
previewBtn.addEventListener('click',  () => {
    if (!photosList.length) {
        alert("Please upload at least one photo to preview.");
        return;
    }
    renderPreview();
    previewContainer.scrollIntoView({ behavior: 'smooth' });
});

// Helper function to render text with emojis as image
async function renderTextWithEmojis(text, fontSize, maxWidth) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set font for measurement
    ctx.font = `${fontSize}px Arial, sans-serif`;
    
    // Split text into lines based on maxWidth
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];
    
    for (let i = 1; i < words.length; i++) {
        const testLine = currentLine + ' ' + words[i];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine !== '') {
            lines.push(currentLine);
            currentLine = words[i];
        } else {
            currentLine = testLine;
        }
    }
    lines.push(currentLine);
    
    // Calculate canvas size
    const lineHeight = fontSize * 1.4;
    const canvasHeight = lines.length * lineHeight + 20;
    canvas.width = maxWidth + 40;
    canvas.height = canvasHeight;
    
    // Set rendering properties
    ctx.font = `${fontSize}px Arial, sans-serif`;
    ctx.fillStyle = '#3c3c3c';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    // Draw each line
    lines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, index * lineHeight + 10);
    });
    
    return canvas.toDataURL('image/png');
}

generatePDFBtn.addEventListener('click', async () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const albumTitle = document.getElementById('albumTitle').value;
    const yourName = document.getElementById('name').value;
    const partnerName = document.getElementById('partnerName').value;
    
    // Detect if mobile for responsive sizing
    const isMobile = window.innerWidth <= 768;
    
    // Responsive scaling factors
    const scale = isMobile ? 0.85 : 1;
    const margin = isMobile ? 25 : 40;
    const titleFontSize = isMobile ? 24 : 32;
    const nameFontSize = isMobile ? 16 : 20;
    const captionFontSize = isMobile ? 13 : 16;
    
    // ===== COVER PAGE =====
    // Background
    doc.setFillColor(255, 240, 245);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Decorative header bar
    doc.setFillColor(220, 20, 60);
    doc.rect(0, 0, pageWidth, 100 * scale, 'F');
    
    // Heart decorations on cover
    doc.setFillColor(255, 105, 180);
    const heartSize = 12 * scale;
    doc.circle(60 * scale, 50 * scale, heartSize, 'F');
    doc.circle(pageWidth - 60 * scale, 50 * scale, heartSize, 'F');
    
    // Title with emoji support
    const titleWidth = pageWidth - (margin * 4);
    const titleImage = await renderTextWithEmojis(albumTitle, titleFontSize, titleWidth);
    const titleImgWidth = Math.min(titleWidth, 400 * scale);
    const titleImgHeight = 60 * scale;
    doc.addImage(titleImage, 'PNG', pageWidth / 2 - titleImgWidth / 2, 180 * scale, titleImgWidth, titleImgHeight);
    
    // Decorative line
    doc.setDrawColor(220, 20, 60);
    doc.setLineWidth(2);
    const lineWidth = 150 * scale;
    doc.line(pageWidth / 2 - lineWidth, 260 * scale, pageWidth / 2 + lineWidth, 260 * scale);
    
    // From/To section with box
    const boxWidth = Math.min(360 * scale, pageWidth - margin * 2);
    const boxHeight = 110 * scale;
    const boxX = pageWidth / 2 - boxWidth / 2;
    const boxY = 300 * scale;
    
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 8, 8, 'F');
    doc.setDrawColor(220, 20, 60);
    doc.setLineWidth(1);
    doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 8, 8, 'S');
    
    // Render names with emoji support
    const nameWidth = boxWidth - 40;
    const fromImage = await renderTextWithEmojis(`From: ${yourName}`, nameFontSize, nameWidth);
    const toImage = await renderTextWithEmojis(`To: ${partnerName}`, nameFontSize, nameWidth);
    doc.addImage(fromImage, 'PNG', boxX + 20, boxY + 20, nameWidth, 30 * scale);
    doc.addImage(toImage, 'PNG', boxX + 20, boxY + 60, nameWidth, 30 * scale);
    
    // Footer hearts
    const footerY = pageHeight - 50 * scale;
    doc.setFillColor(255, 182, 193);
    doc.circle(pageWidth / 2 - 25 * scale, footerY, 6 * scale, 'F');
    doc.setFillColor(220, 20, 60);
    doc.circle(pageWidth / 2, footerY, 6 * scale, 'F');
    doc.setFillColor(255, 182, 193);
    doc.circle(pageWidth / 2 + 25 * scale, footerY, 6 * scale, 'F');
    
    // ===== PHOTO PAGES =====
    for (let i = 0; i < photosList.length; i++) {
        doc.addPage();
        
        // Page background
        doc.setFillColor(255, 250, 250);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        
        // Decorative top border
        doc.setFillColor(220, 20, 60);
        doc.rect(0, 0, pageWidth, 6, 'F');
        
        // Calculate responsive photo dimensions
        const photoMargin = margin * 1.5;
        const frameWidth = pageWidth - (photoMargin * 2);
        const frameHeight = frameWidth * 0.75; // 4:3 aspect ratio
        const frameX = photoMargin;
        const frameY = 70 * scale;
        
        // Ensure photo fits on page with room for caption
        const maxPhotoHeight = pageHeight - frameY - 150 * scale;
        const finalFrameHeight = Math.min(frameHeight, maxPhotoHeight);
        const finalFrameWidth = frameWidth;
        
        // Shadow
        doc.setFillColor(200, 200, 200);
        doc.roundedRect(frameX + 3, frameY + 3, finalFrameWidth, finalFrameHeight, 4, 4, 'F');
        
        // White frame background
        const framePadding = 8;
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(frameX - framePadding, frameY - framePadding, 
                       finalFrameWidth + framePadding * 2, finalFrameHeight + framePadding * 2, 4, 4, 'F');
        
        // Add photo
        const img = photosList[i];
        const imgData = await toDataURL(img);
        doc.addImage(imgData, 'JPEG', frameX, frameY, finalFrameWidth, finalFrameHeight);
        
        // Frame border
        doc.setDrawColor(220, 20, 60);
        doc.setLineWidth(1.5);
        doc.roundedRect(frameX - framePadding, frameY - framePadding, 
                       finalFrameWidth + framePadding * 2, finalFrameHeight + framePadding * 2, 4, 4, 'S');
        
        // Caption box
        const captionY = frameY + finalFrameHeight + 25;
        const captionBoxWidth = pageWidth - (margin * 2);
        const captionBoxHeight = 90 * scale;
        const captionBoxX = margin;
        
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(captionBoxX, captionY, captionBoxWidth, captionBoxHeight, 6, 6, 'F');
        doc.setDrawColor(255, 182, 193);
        doc.setLineWidth(1);
        doc.roundedRect(captionBoxX, captionY, captionBoxWidth, captionBoxHeight, 6, 6, 'S');
        
        // Caption text with emoji support
        const caption = captionsList[i] || '';
        if (caption) {
            const captionMaxWidth = captionBoxWidth - 30;
            const captionImage = await renderTextWithEmojis(caption, captionFontSize, captionMaxWidth);
            doc.addImage(captionImage, 'PNG', captionBoxX + 15, captionY + 20, captionMaxWidth, captionBoxHeight - 40);
        }
        
        // Page number
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(`${i + 1}`, pageWidth / 2, pageHeight - 20, { align: 'center' });
        
        // Small heart decoration
        doc.setFillColor(255, 182, 193);
        doc.circle(pageWidth / 2, pageHeight - 35, 3, 'F');
    }
    
    doc.save('Valentine_Memory_Book.pdf');
});

// Helper: Convert File to Data URL
function toDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
}
