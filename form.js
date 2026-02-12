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
    
    // Higher resolution for better quality
    const scale = 2;
    
    // Set font for measurement
    ctx.font = `${fontSize * scale}px Arial, "Segoe UI Emoji", sans-serif`;
    
    // Split text into lines based on maxWidth
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];
    
    for (let i = 1; i < words.length; i++) {
        const testLine = currentLine + ' ' + words[i];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth * scale && currentLine !== '') {
            lines.push(currentLine);
            currentLine = words[i];
        } else {
            currentLine = testLine;
        }
    }
    lines.push(currentLine);
    
    // Calculate canvas size
    const lineHeight = fontSize * 1.5;
    const canvasHeight = (lines.length * lineHeight + 20) * scale;
    canvas.width = (maxWidth + 40) * scale;
    canvas.height = canvasHeight;
    
    // Enable high quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Set rendering properties
    ctx.font = `${fontSize * scale}px Arial, "Segoe UI Emoji", sans-serif`;
    ctx.fillStyle = '#3c3c3c';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    // Draw each line
    lines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, (index * lineHeight + 10) * scale);
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
    doc.rect(0, 0, pageWidth, isMobile ? 80 : 100, 'F');
    
    // Heart decorations on cover
    doc.setFillColor(255, 105, 180);
    const heartSize = isMobile ? 10 : 14;
    const heartY = isMobile ? 40 : 50;
    doc.circle(isMobile ? 50 : 70, heartY, heartSize, 'F');
    doc.circle(pageWidth - (isMobile ? 50 : 70), heartY, heartSize, 'F');
    
    // Title with emoji support
    const titleWidth = pageWidth - (margin * 3);
    const titleY = isMobile ? 160 : 200;
    const titleImage = await renderTextWithEmojis(albumTitle, titleFontSize, titleWidth);
    const titleImgWidth = Math.min(titleWidth, isMobile ? 340 : 420);
    const titleImgHeight = isMobile ? 50 : 70;
    doc.addImage(titleImage, 'PNG', pageWidth / 2 - titleImgWidth / 2, titleY, titleImgWidth, titleImgHeight);
    
    // Decorative line
    doc.setDrawColor(220, 20, 60);
    doc.setLineWidth(2);
    const lineWidth = isMobile ? 120 : 160;
    const lineY = titleY + titleImgHeight + (isMobile ? 20 : 30);
    doc.line(pageWidth / 2 - lineWidth, lineY, pageWidth / 2 + lineWidth, lineY);
    
    // From/To section with box
    const boxWidth = Math.min(isMobile ? 300 : 360, pageWidth - margin * 2);
    const boxHeight = isMobile ? 100 : 120;
    const boxX = pageWidth / 2 - boxWidth / 2;
    const boxY = lineY + (isMobile ? 30 : 40);
    
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 8, 8, 'F');
    doc.setDrawColor(220, 20, 60);
    doc.setLineWidth(1);
    doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 8, 8, 'S');
    
    // Render names with emoji support
    const nameWidth = boxWidth - 30;
    const nameHeight = isMobile ? 28 : 35;
    const fromImage = await renderTextWithEmojis(`From: ${yourName}`, nameFontSize, nameWidth);
    const toImage = await renderTextWithEmojis(`To: ${partnerName}`, nameFontSize, nameWidth);
    doc.addImage(fromImage, 'PNG', boxX + 15, boxY + (isMobile ? 18 : 22), nameWidth, nameHeight);
    doc.addImage(toImage, 'PNG', boxX + 15, boxY + (isMobile ? 56 : 68), nameWidth, nameHeight);
    
    // Footer hearts
    const footerY = pageHeight - (isMobile ? 40 : 50);
    const footerHeartSize = isMobile ? 5 : 7;
    const heartSpacing = isMobile ? 20 : 28;
    doc.setFillColor(255, 182, 193);
    doc.circle(pageWidth / 2 - heartSpacing, footerY, footerHeartSize, 'F');
    doc.setFillColor(220, 20, 60);
    doc.circle(pageWidth / 2, footerY, footerHeartSize, 'F');
    doc.setFillColor(255, 182, 193);
    doc.circle(pageWidth / 2 + heartSpacing, footerY, footerHeartSize, 'F');
    
    // ===== PHOTO PAGES =====
    for (let i = 0; i < photosList.length; i++) {
        doc.addPage();
        
        // Page background
        doc.setFillColor(255, 250, 250);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        
        // Decorative top border
        doc.setFillColor(220, 20, 60);
        doc.rect(0, 0, pageWidth, 5, 'F');
        
        // Calculate responsive photo dimensions
        const photoMargin = isMobile ? 22 : 40;
        const frameWidth = pageWidth - (photoMargin * 2);
        const topSpace = isMobile ? 45 : 60;
        
        // Reserve space for caption at bottom
        const captionBoxHeight = isMobile ? 90 : 100;
        const bottomSpace = isMobile ? 60 : 70;
        const availableHeight = pageHeight - topSpace - captionBoxHeight - bottomSpace;
        
        // Calculate frame height (maintain aspect ratio but fit in available space)
        let frameHeight = frameWidth * 0.75; // 4:3 aspect ratio
        if (frameHeight > availableHeight) {
            frameHeight = availableHeight;
        }
        
        const frameX = photoMargin;
        const frameY = topSpace;
        
        // Shadow
        doc.setFillColor(200, 200, 200);
        doc.roundedRect(frameX + 2, frameY + 2, frameWidth, frameHeight, 3, 3, 'F');
        
        // White frame background
        const framePadding = isMobile ? 7 : 10;
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(frameX - framePadding, frameY - framePadding, 
                       frameWidth + framePadding * 2, frameHeight + framePadding * 2, 5, 5, 'F');
        
        // Add photo
        const img = photosList[i];
        const imgData = await toDataURL(img);
        doc.addImage(imgData, 'JPEG', frameX, frameY, frameWidth, frameHeight);
        
        // Frame border
        doc.setDrawColor(220, 20, 60);
        doc.setLineWidth(isMobile ? 1.2 : 1.8);
        doc.roundedRect(frameX - framePadding, frameY - framePadding, 
                       frameWidth + framePadding * 2, frameHeight + framePadding * 2, 5, 5, 'S');
        
        // Caption box - positioned below photo with good spacing
        const captionY = frameY + frameHeight + (isMobile ? 22 : 28);
        const captionBoxWidth = pageWidth - (photoMargin * 2);
        const captionBoxX = photoMargin;
        
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(captionBoxX, captionY, captionBoxWidth, captionBoxHeight, 8, 8, 'F');
        doc.setDrawColor(255, 182, 193);
        doc.setLineWidth(1.2);
        doc.roundedRect(captionBoxX, captionY, captionBoxWidth, captionBoxHeight, 8, 8, 'S');
        
        // Caption text with emoji support
        const caption = captionsList[i] || '';
        if (caption) {
            const captionPadding = isMobile ? 12 : 15;
            const captionMaxWidth = captionBoxWidth - (captionPadding * 2);
            const captionImgHeight = captionBoxHeight - (captionPadding * 2);
            const captionImage = await renderTextWithEmojis(caption, captionFontSize, captionMaxWidth);
            doc.addImage(captionImage, 'PNG', captionBoxX + captionPadding, 
                        captionY + captionPadding, captionMaxWidth, captionImgHeight);
        }
        
        // Page number at very bottom
        const pageNumY = pageHeight - (isMobile ? 12 : 15);
        doc.setFontSize(isMobile ? 8 : 9);
        doc.setTextColor(150, 150, 150);
        doc.text(`${i + 1}`, pageWidth / 2, pageNumY, { align: 'center' });
        
        // Small heart decoration above page number
        doc.setFillColor(255, 182, 193);
        doc.circle(pageWidth / 2, pageNumY - (isMobile ? 10 : 12), isMobile ? 2.5 : 3, 'F');
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
