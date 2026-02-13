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
        caption.addEventListener('input', (e) => { captionsList[index] = e.target.value; });
        wrapper.appendChild(img);
        wrapper.appendChild(caption);
        previewContainer.appendChild(wrapper);
    });
}

previewBtn.addEventListener('click', () => {
    if (!photosList.length) return alert("Upload some memories first! 💕");
    renderPreview();
    previewContainer.scrollIntoView({ behavior: 'smooth' });
});

// --- ENHANCED TEXT RENDERER ---
async function renderTextWithEmojis(text, fontSize, maxWidth, color = '#3c3c3c', italic = false) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const scale = 3; 
    const style = italic ? 'italic ' : '';
    ctx.font = `${style}${fontSize * scale}px "Poppins", Arial, "Segoe UI Emoji", sans-serif`;
    
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
    canvas.width = (maxWidth + 60) * scale;
    canvas.height = (lines.length * lineHeight + 40) * scale;
    
    ctx.scale(scale, scale);
    ctx.font = `${style}${fontSize}px "Poppins", Arial, "Segoe UI Emoji", sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    lines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / (2 * scale), index * lineHeight + 20);
    });
    return canvas.toDataURL('image/png');
}

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
    if (!photosList.length) return alert("Please upload at least one photo.");

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Helper: Draw Washi Tape
    const drawTape = (x, y, angle) => {
        doc.setGState(new doc.GState({ opacity: 0.6 }));
        doc.setFillColor(255, 182, 193);
        doc.save();
        doc.setTransform(1, 0, 0, 1, x, y);
        doc.rotate(angle);
        doc.rect(-30, -10, 60, 20, 'F');
        doc.restore();
        doc.setGState(new doc.GState({ opacity: 1 }));
    };

    // --- COVER PAGE: ARTISTIC SCRAPBOOK ---
    doc.setFillColor(255, 248, 248); 
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Aesthetic Dots Pattern
    doc.setFillColor(255, 192, 203);
    for(let i=0; i<pageWidth; i+=40) {
        for(let j=0; j<pageHeight; j+=40) {
            doc.circle(i, j, 0.5, 'F');
        }
    }

    // Large Center Ribbon
    doc.setFillColor(220, 20, 60);
    doc.rect(0, 180, pageWidth, 120, 'F');
    
    const albumTitle = document.getElementById('albumTitle')?.value || 'Our Story';
    const titleImg = await renderTextWithEmojis(albumTitle, 45, pageWidth - 100, '#ffffff');
    doc.addImage(titleImg, 'PNG', 50, 195, pageWidth - 100, 90);

    const yourName = document.getElementById('name')?.value || 'Me';
    const partnerName = document.getElementById('partnerName')?.value || 'You';
    const namesImg = await renderTextWithEmojis(`Created with love by ${yourName} for ${partnerName}`, 16, pageWidth - 100, '#dc143c', true);
    doc.addImage(namesImg, 'PNG', 50, 310, pageWidth - 100, 40);

    // --- PHOTO PAGES ---
    for (let i = 0; i < photosList.length; i++) {
        doc.addPage();
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

        // Decorative Side Bar
        doc.setFillColor(255, 240, 245);
        doc.rect(0, 0, 40, pageHeight, 'F');

        const imgData = await toDataURL(photosList[i]);
        const dims = await getImageDimensions(photosList[i]);
        const aspectRatio = dims.width / dims.height;
        
        const frameWidth = pageWidth - 160;
        const availableHeight = pageHeight - 300;
        let drawWidth = frameWidth;
        let drawHeight = frameWidth / aspectRatio;

        if (drawHeight > availableHeight) {
            drawHeight = availableHeight;
            drawWidth = drawHeight * aspectRatio;
        }

        const xPos = (pageWidth - drawWidth) / 2 + 20;
        const yPos = 100;

        // Photo Frame with Shadow
        doc.setDrawColor(240, 240, 240);
        doc.rect(xPos - 5, yPos - 5, drawWidth + 10, drawHeight + 10, 'S');
        doc.addImage(imgData, 'JPEG', xPos, yPos, drawWidth, drawHeight);

        // Aesthetic Tape
        drawTape(xPos, yPos, -15);
        drawTape(xPos + drawWidth, yPos + drawHeight, -15);

        // Caption - Placed like a post-it note
        const caption = captionsList[i] || 'Forever yours...';
        const captionImg = await renderTextWithEmojis(caption, 18, frameWidth, '#333', true);
        doc.addImage(captionImg, 'PNG', xPos - 20, yPos + drawHeight + 40, drawWidth + 40, 60);

        // Page Heart
        doc.setFillColor(220, 20, 60);
        doc.circle(pageWidth - 40, pageHeight - 40, 5, 'F');
    }

    // --- END PAGE ---
    doc.addPage();
    doc.setFillColor(30, 30, 30); // Deep elegant black/charcoal
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    const finalImg = await renderTextWithEmojis("This is just the beginning...", 24, pageWidth - 120, '#ffffff', true);
    doc.addImage(finalImg, 'PNG', 60, pageHeight/2 - 30, pageWidth - 120, 60);

    doc.save(`Memory_Book.pdf`);
});
