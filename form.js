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
    
    // Decorative header bar - larger and more prominent
    const headerHeight = isMobile ? 120 : 140;
    doc.setFillColor(220, 20, 60);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');
    
    // Heart decorations on cover - positioned in header
    doc.setFillColor(255, 105, 180);
    const heartSize = isMobile ? 18 : 22;
    const heartY = headerHeight / 2;
    doc.circle(isMobile ? 60 : 80, heartY, heartSize, 'F');
    doc.circle(pageWidth - (isMobile ? 60 : 80), heartY, heartSize, 'F');
    
    // Add decorative small hearts
    doc.setFillColor(255, 182, 193);
    const smallHeartSize = isMobile ? 8 : 10;
    doc.circle(pageWidth / 4, heartY - 20, smallHeartSize, 'F');
    doc.circle((pageWidth / 4) * 3, heartY - 20, smallHeartSize, 'F');
    doc.circle(pageWidth / 4, heartY + 20, smallHeartSize, 'F');
    doc.circle((pageWidth / 4) * 3, heartY + 20, smallHeartSize, 'F');
    
    // Title section - larger and more prominent
    const titleY = headerHeight + (isMobile ? 60 : 80);
    const titleWidth = pageWidth - (margin * 2);
    const titleImage = await renderTextWithEmojis(albumTitle, isMobile ? 28 : 36, titleWidth);
    const titleImgWidth = titleWidth;
    const titleImgHeight = isMobile ? 70 : 90;
    doc.addImage(titleImage, 'PNG', margin, titleY, titleImgWidth, titleImgHeight);
    
    // Decorative line under title - thicker and more visible
    doc.setDrawColor(220, 20, 60);
    doc.setLineWidth(3);
    const lineWidth = isMobile ? 140 : 180;
    const lineY = titleY + titleImgHeight + (isMobile ? 25 : 35);
    doc.line(pageWidth / 2 - lineWidth, lineY, pageWidth / 2 + lineWidth, lineY);
    
    // Decorative dots on line
    doc.setFillColor(220, 20, 60);
    doc.circle(pageWidth / 2 - lineWidth - 10, lineY, 4, 'F');
    doc.circle(pageWidth / 2 + lineWidth + 10, lineY, 4, 'F');
    
    // From/To section with box - larger and more centered
    const boxWidth = Math.min(isMobile ? 340 : 400, pageWidth - margin * 2);
    const boxHeight = isMobile ? 130 : 150;
    const boxX = pageWidth / 2 - boxWidth / 2;
    const boxY = lineY + (isMobile ? 45 : 60);
    
    // Box shadow
    doc.setFillColor(200, 200, 200);
    doc.roundedRect(boxX + 3, boxY + 3, boxWidth, boxHeight, 10, 10, 'F');
    
    // White box background
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 10, 10, 'F');
    doc.setDrawColor(220, 20, 60);
    doc.setLineWidth(2);
    doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 10, 10, 'S');
    
    // Small decorative hearts on corners of box
    doc.setFillColor(255, 105, 180);
    const cornerHeartSize = isMobile ? 6 : 8;
    doc.circle(boxX - 5, boxY - 5, cornerHeartSize, 'F');
    doc.circle(boxX + boxWidth + 5, boxY - 5, cornerHeartSize, 'F');
    doc.circle(boxX - 5, boxY + boxHeight + 5, cornerHeartSize, 'F');
    doc.circle(boxX + boxWidth + 5, boxY + boxHeight + 5, cornerHeartSize, 'F');
    
    // Render names with emoji support - larger text
    const nameWidth = boxWidth - 40;
    const nameHeight = isMobile ? 38 : 45;
    const fromImage = await renderTextWithEmojis(`From: ${yourName}`, isMobile ? 18 : 22, nameWidth);
    const toImage = await renderTextWithEmojis(`To: ${partnerName}`, isMobile ? 18 : 22, nameWidth);
    doc.addImage(fromImage, 'PNG', boxX + 20, boxY + (isMobile ? 25 : 30), nameWidth, nameHeight);
    doc.addImage(toImage, 'PNG', boxX + 20, boxY + (isMobile ? 72 : 85), nameWidth, nameHeight);
    
    // Decorative divider between names
    doc.setDrawColor(255, 182, 193);
    doc.setLineWidth(1);
    const dividerMargin = isMobile ? 60 : 80;
    doc.line(boxX + dividerMargin, boxY + boxHeight / 2, 
             boxX + boxWidth - dividerMargin, boxY + boxHeight / 2);
    
    // Footer section with hearts and decorative elements
    const footerY = pageHeight - (isMobile ? 80 : 100);
    
    // Decorative curved line above hearts
    doc.setDrawColor(255, 182, 193);
    doc.setLineWidth(1.5);
    const curveMargin = isMobile ? 80 : 120;
    doc.line(curveMargin, footerY - 25, pageWidth - curveMargin, footerY - 25);
    
    // Footer hearts - larger and more visible
    const footerHeartSize = isMobile ? 10 : 12;
    const heartSpacing = isMobile ? 30 : 40;
    doc.setFillColor(255, 182, 193);
    doc.circle(pageWidth / 2 - heartSpacing, footerY, footerHeartSize, 'F');
    doc.setFillColor(220, 20, 60);
    doc.circle(pageWidth / 2, footerY, footerHeartSize * 1.3, 'F');
    doc.setFillColor(255, 182, 193);
    doc.circle(pageWidth / 2 + heartSpacing, footerY, footerHeartSize, 'F');
    
    // Small decorative hearts around main hearts
    doc.setFillColor(255, 182, 193);
    const tinyHeartSize = isMobile ? 4 : 5;
    doc.circle(pageWidth / 2 - heartSpacing * 1.8, footerY, tinyHeartSize, 'F');
    doc.circle(pageWidth / 2 + heartSpacing * 1.8, footerY, tinyHeartSize, 'F');
    doc.circle(pageWidth / 2 - heartSpacing * 0.5, footerY - 18, tinyHeartSize, 'F');
    doc.circle(pageWidth / 2 + heartSpacing * 0.5, footerY - 18, tinyHeartSize, 'F');
    
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
