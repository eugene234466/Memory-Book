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
        caption.placeholder = 'Type a memory here... ✨';
        caption.value = captionsList[index];
        caption.addEventListener('input', (e) => { captionsList[index] = e.target.value; });
        wrapper.appendChild(img);
        wrapper.appendChild(caption);
        previewContainer.appendChild(wrapper);
    });
}

previewBtn.addEventListener('click', () => {
    if (!photosList.length) return alert("Add some photos first! 📸");
    renderPreview();
    previewContainer.scrollIntoView({ behavior: 'smooth' });
});

// --- ELITE TEXT RENDERER (Supports Rotation & Emojis) ---
async function renderText(text, fontSize, maxWidth, color = '#3c3c3c', italic = false) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const scale = 4; // Extra crisp
    const style = italic ? 'italic ' : '';
    ctx.font = `${style}${fontSize * scale}px "Poppins", "Georgia", serif`;
    
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
    
    const lineHeight = fontSize * 1.4;
    canvas.width = (maxWidth + 60) * scale;
    canvas.height = (lines.length * lineHeight + 60) * scale;
    
    ctx.scale(scale, scale);
    ctx.font = `${style}${fontSize}px "Poppins", serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    lines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / (2 * scale), index * lineHeight + 30);
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
    if (!photosList.length) return alert("Please upload photos.");

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Decoration: Soft Floral/Circle accents
    const drawDecor = (x, y, size, col) => {
        doc.setGState(new doc.GState({ opacity: 0.2 }));
        doc.setFillColor(col);
        doc.circle(x, y, size, 'F');
        doc.setGState(new doc.GState({ opacity: 1 }));
    };

    // --- COVER: VOGUE STYLE ---
    doc.setFillColor(255, 250, 240); // Floral White
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    drawDecor(0, 0, 150, '#ffb6c1'); // Top corner glow
    drawDecor(pageWidth, pageHeight, 200, '#ffc0cb'); // Bottom corner glow

    const albumTitle = document.getElementById('albumTitle')?.value || 'The Chapters of Us';
    const titleImg = await renderText(albumTitle.toUpperCase(), 35, pageWidth - 120, '#2d2d2d');
    doc.addImage(titleImg, 'PNG', 60, 220, pageWidth - 120, 100);

    doc.setDrawColor(45, 45, 45);
    doc.setLineWidth(0.5);
    doc.line(pageWidth/2 - 40, 310, pageWidth/2 + 40, 310);

    const names = `${document.getElementById('name')?.value || 'Me'} & ${document.getElementById('partnerName')?.value || 'You'}`;
    const namesImg = await renderText(names, 18, pageWidth - 100, '#dc143c', true);
    doc.addImage(namesImg, 'PNG', 50, 330, pageWidth - 100, 40);

    // --- PHOTO PAGES: EDITORIAL LAYOUT ---
    for (let i = 0; i < photosList.length; i++) {
        doc.addPage();
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

        const imgData = await toDataURL(photosList[i]);
        const dims = await getImageDimensions(photosList[i]);
        const aspectRatio = dims.width / dims.height;
        
        // Large Editorial Image
        const frameWidth = pageWidth - 100;
        const availableHeight = pageHeight - 350;
        let dW = frameWidth;
        let dH = frameWidth / aspectRatio;

        if (dH > availableHeight) {
            dH = availableHeight;
            dW = dH * aspectRatio;
        }

        const x = (pageWidth - dW) / 2;
        const y = 80;

        // Soft Border & Image
        doc.setDrawColor(230, 230, 230);
        doc.rect(x - 1, y - 1, dW + 2, dH + 2, 'S');
        doc.addImage(imgData, 'JPEG', x, y, dW, dH);

        // Date Stamp (Bottom Right of Photo)
        doc.setFontSize(8);
        doc.setTextColor(180, 180, 180);
        const today = new Date().toLocaleDateString();
        doc.text(today, x + dW - 5, y + dH + 15, { align: 'right' });

        // Romantic Caption - "Polaroid" Style Note
        const caption = captionsList[i] || 'No words, just feelings.';
        const capImg = await renderText(caption, 16, dW - 20, '#444', true);
        doc.addImage(capImg, 'PNG', x + 10, y + dH + 40, dW - 20, 80);

        // Bottom Page Number with Heart
        doc.setFillColor(220, 20, 60);
        doc.circle(pageWidth/2, pageHeight - 50, 2, 'F');
        doc.setFontSize(7);
        doc.text(`${i + 1}`, pageWidth/2, pageHeight - 35, { align: 'center' });
    }

    // --- THE "ENCORE" PAGE ---
    doc.addPage();
    doc.setFillColor(45, 45, 45); 
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    const finalImg = await renderText("Our story is my favorite book.", 22, pageWidth - 150, '#ffffff', true);
    doc.addImage(finalImg, 'PNG', 75, pageHeight/2 - 40, pageWidth - 150, 80);

    doc.save(`Our_Memory_Book.pdf`);
});let photosList = [];
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
        caption.placeholder = 'Type a memory here... ✨';
        caption.value = captionsList[index];
        caption.addEventListener('input', (e) => { captionsList[index] = e.target.value; });
        wrapper.appendChild(img);
        wrapper.appendChild(caption);
        previewContainer.appendChild(wrapper);
    });
}

previewBtn.addEventListener('click', () => {
    if (!photosList.length) return alert("Add some photos first! 📸");
    renderPreview();
    previewContainer.scrollIntoView({ behavior: 'smooth' });
});

// --- ELITE TEXT RENDERER (Supports Rotation & Emojis) ---
async function renderText(text, fontSize, maxWidth, color = '#3c3c3c', italic = false) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const scale = 4; // Extra crisp
    const style = italic ? 'italic ' : '';
    ctx.font = `${style}${fontSize * scale}px "Poppins", "Georgia", serif`;
    
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
    
    const lineHeight = fontSize * 1.4;
    canvas.width = (maxWidth + 60) * scale;
    canvas.height = (lines.length * lineHeight + 60) * scale;
    
    ctx.scale(scale, scale);
    ctx.font = `${style}${fontSize}px "Poppins", serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    lines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / (2 * scale), index * lineHeight + 30);
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
    if (!photosList.length) return alert("Please upload photos.");

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Decoration: Soft Floral/Circle accents
    const drawDecor = (x, y, size, col) => {
        doc.setGState(new doc.GState({ opacity: 0.2 }));
        doc.setFillColor(col);
        doc.circle(x, y, size, 'F');
        doc.setGState(new doc.GState({ opacity: 1 }));
    };

    // --- COVER: VOGUE STYLE ---
    doc.setFillColor(255, 250, 240); // Floral White
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    drawDecor(0, 0, 150, '#ffb6c1'); // Top corner glow
    drawDecor(pageWidth, pageHeight, 200, '#ffc0cb'); // Bottom corner glow

    const albumTitle = document.getElementById('albumTitle')?.value || 'The Chapters of Us';
    const titleImg = await renderText(albumTitle.toUpperCase(), 35, pageWidth - 120, '#2d2d2d');
    doc.addImage(titleImg, 'PNG', 60, 220, pageWidth - 120, 100);

    doc.setDrawColor(45, 45, 45);
    doc.setLineWidth(0.5);
    doc.line(pageWidth/2 - 40, 310, pageWidth/2 + 40, 310);

    const names = `${document.getElementById('name')?.value || 'Me'} & ${document.getElementById('partnerName')?.value || 'You'}`;
    const namesImg = await renderText(names, 18, pageWidth - 100, '#dc143c', true);
    doc.addImage(namesImg, 'PNG', 50, 330, pageWidth - 100, 40);

    // --- PHOTO PAGES: EDITORIAL LAYOUT ---
    for (let i = 0; i < photosList.length; i++) {
        doc.addPage();
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

        const imgData = await toDataURL(photosList[i]);
        const dims = await getImageDimensions(photosList[i]);
        const aspectRatio = dims.width / dims.height;
        
        // Large Editorial Image
        const frameWidth = pageWidth - 100;
        const availableHeight = pageHeight - 350;
        let dW = frameWidth;
        let dH = frameWidth / aspectRatio;

        if (dH > availableHeight) {
            dH = availableHeight;
            dW = dH * aspectRatio;
        }

        const x = (pageWidth - dW) / 2;
        const y = 80;

        // Soft Border & Image
        doc.setDrawColor(230, 230, 230);
        doc.rect(x - 1, y - 1, dW + 2, dH + 2, 'S');
        doc.addImage(imgData, 'JPEG', x, y, dW, dH);

        // Date Stamp (Bottom Right of Photo)
        doc.setFontSize(8);
        doc.setTextColor(180, 180, 180);
        const today = new Date().toLocaleDateString();
        doc.text(today, x + dW - 5, y + dH + 15, { align: 'right' });

        // Romantic Caption - "Polaroid" Style Note
        const caption = captionsList[i] || 'No words, just feelings.';
        const capImg = await renderText(caption, 16, dW - 20, '#444', true);
        doc.addImage(capImg, 'PNG', x + 10, y + dH + 40, dW - 20, 80);

        // Bottom Page Number with Heart
        doc.setFillColor(220, 20, 60);
        doc.circle(pageWidth/2, pageHeight - 50, 2, 'F');
        doc.setFontSize(7);
        doc.text(`${i + 1}`, pageWidth/2, pageHeight - 35, { align: 'center' });
    }

    // --- THE "ENCORE" PAGE ---
    doc.addPage();
    doc.setFillColor(45, 45, 45); 
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    const finalImg = await renderText("Our story is my favorite book.", 22, pageWidth - 150, '#ffffff', true);
    doc.addImage(finalImg, 'PNG', 75, pageHeight/2 - 40, pageWidth - 150, 80);

    doc.save(`Our_Memory_Book.pdf`);
});
