let photosList = [];
let captionsList = [];

const photoInput = document.getElementById('photo');
const previewContainer = document.getElementById('previewContainer');
const previewBtn = document.getElementById('previewBtn');
const generatePDFBtn = document.getElementById('generatePDF');

photoInput.addEventListener('change', (e) => {
    photosList = Array.from(e.target.files);
    captionsList = new Array(photosList.length).fill('');
    renderPreview();
});

function renderPreview() {
    previewContainer.innerHTML = '';
    photosList.forEach((photo, index) => {
        const wrapper = document.createElement('div');
        wrapper.classList.add('photo-wrapper');

        const img = document.createElement('img');
        img.src = URL.createObjectURL(photo);
        img.classList.add('preview-image');

        const caption = document.createElement('textarea');
        caption.classList.add('caption-input');
        caption.placeholder = 'Write a romantic note... ❤️';
        caption.value = captionsList[index];
        caption.addEventListener('input', (e) => {
            captionsList[index] = e.target.value;
        });

        wrapper.appendChild(img);
        wrapper.appendChild(caption);
        previewContainer.appendChild(wrapper);
    });
}

previewBtn.addEventListener('click', () => {
    if (!photosList.length) {
        alert("Upload some memories first! 💕");
        return;
    }
    renderPreview();
    previewContainer.scrollIntoView({ behavior: 'smooth' });
});

// --- HELPER: HIGH QUALITY TEXT & EMOJIS ---
async function renderTextWithEmojis(text, fontSize, maxWidth, color = '#3c3c3c') {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const scale = 3; // Ultra-high resolution
    
    ctx.font = `${fontSize * scale}px "Poppins", Arial, "Segoe UI Emoji", sans-serif`;
    
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0] || '';
    
    for (let i = 1; i < words.length; i++) {
        const testLine = currentLine + ' ' + words[i];
        if (ctx.measureText(testLine).width > maxWidth * scale) {
            lines.push(currentLine);
            currentLine = words[i];
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) lines.push(currentLine);
    
    const lineHeight = fontSize * 1.6;
    canvas.width = (maxWidth + 40) * scale;
    canvas.height = (lines.length * lineHeight + 20) * scale;
    
    ctx.scale(scale, scale);
    ctx.font = `${fontSize}px "Poppins", Arial, "Segoe UI Emoji", sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    lines.forEach((line, index) => {
        ctx.fillText(line, (maxWidth + 40) / 2, index * lineHeight + 10);
    });
    
    return canvas.toDataURL('image/png');
}

// --- HELPER: IMAGE DIMENSIONS ---
function getImageDimensions(file) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.src = URL.createObjectURL(file);
    });
}

function toDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = err => reject(err);
        reader.readAsDataURL(file);
    });
}

// --- MAIN GENERATION ---
generatePDFBtn.addEventListener('click', async () => {
    if (!photosList.length) {
        alert("Please upload at least one photo.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const isMobile = window.innerWidth <= 768;

    // Decoration Helper: Hearts
    const drawHeart = (x, y, size, opacity = 1) => {
        doc.setGState(new doc.GState({ opacity: opacity }));
        doc.setFillColor(220, 20, 60);
        doc.circle(x, y, size, 'F');
        doc.circle(x + size, y, size, 'F');
        doc.triangle(x - size, y + size/2, x + size*2, y + size/2, x + size/2, y + size*2.5, 'F');
        doc.setGState(new doc.GState({ opacity: 1 }));
    };

    // --- PAGE 1: SUPER ROMANTIC COVER ---
    doc.setFillColor(255, 240, 245); // Soft blush background
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Decorative border
    doc.setDrawColor(220, 20, 60);
    doc.setLineWidth(1.5);
    doc.rect(40, 40, pageWidth - 80, pageHeight - 80, 'S');

    // Title
    const albumTitle = document.getElementById('albumTitle')?.value || 'Our Journey';
    const titleImg = await renderTextWithEmojis(albumTitle, 40, pageWidth - 140, '#dc143c');
    doc.addImage(titleImg, 'PNG', 70, 160, pageWidth - 140, 100);

    // Subtitle
    doc.setFontSize(14);
    doc.setTextColor(220, 20, 60);
    doc.text("Every moment is a treasure with you.", pageWidth/2, 280, { align: 'center' });

    // Names
    const yourName = document.getElementById('name')?.value || 'Me';
    const partnerName = document.getElementById('partnerName')?.value || 'You';
    const namesImg = await renderTextWithEmojis(`${yourName} ❤️ ${partnerName}`, 22, pageWidth - 100);
    doc.addImage(namesImg, 'PNG', 50, 360, pageWidth - 100, 60);

    drawHeart(pageWidth/2 - 5, pageHeight - 150, 10, 0.8);

    // --- PHOTO PAGES ---
    for (let i = 0; i < photosList.length; i++) {
        doc.addPage();
        doc.setFillColor(255, 252, 252);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        
        // Scattered background hearts
        drawHeart(50, 50, 4, 0.1);
        drawHeart(pageWidth-70, 120, 6, 0.1);
        drawHeart(60, pageHeight-100, 5, 0.1);

        const imgData = await toDataURL(photosList[i]);
        const dims = await getImageDimensions(photosList[i]);
        const aspectRatio = dims.width / dims.height;
        
        const photoMargin = 60;
        const frameWidth = pageWidth - (photoMargin * 2);
        const availableHeight = pageHeight - 280;
        
        let drawWidth = frameWidth;
        let drawHeight = frameWidth / aspectRatio;

        // FIXED LOGIC: Preserve aspect ratio and fit to page
        if (drawHeight > availableHeight) {
            drawHeight = availableHeight;
            drawWidth = drawHeight * aspectRatio;
        }

        const xPos = (pageWidth - drawWidth) / 2;
        const yPos = 80;

        // Shadow & Frame
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(xPos + 5, yPos + 5, drawWidth, drawHeight, 5, 5, 'F');
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(xPos - 10, yPos - 10, drawWidth + 20, drawHeight + 60, 2, 2, 'F');
        
        doc.addImage(imgData, 'JPEG', xPos, yPos, drawWidth, drawHeight);

        // Caption
        const caption = captionsList[i] || 'Forever & Always... ❤️';
        const captionImg = await renderTextWithEmojis(caption, 17, frameWidth - 10);
        doc.addImage(captionImg, 'PNG', photoMargin + 5, yPos + drawHeight + 10, frameWidth - 10, 50);

        // Page numbering
        doc.setFontSize(9);
        doc.setTextColor(200, 200, 200);
        doc.text(`${i + 1}`, pageWidth / 2, pageHeight - 40, { align: 'center' });
    }

    // --- FINAL PAGE: THE CLOSURE ---
    doc.addPage();
    doc.setFillColor(220, 20, 60); // Crimson
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // We render white text for the final page
    const finalImg = await renderTextWithEmojis("To be continued...", 30, pageWidth - 120, '#ffffff');
    doc.addImage(finalImg, 'PNG', 60, pageHeight/2 - 40, pageWidth - 120, 80);
    drawHeart(pageWidth/2 - 10, pageHeight/2 + 60, 15, 1);

    doc.save(`${partnerName}_Our_Memories.pdf`);
});
