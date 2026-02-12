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

        const page = document.createElement('div');
        page.classList.add('album-page');

        const frame = document.createElement('div');
        frame.classList.add('photo-frame');

        const img = document.createElement('img');
        img.src = URL.createObjectURL(photo);
        img.classList.add('preview-image');

        const caption = document.createElement('textarea');
        caption.classList.add('caption-input');
        caption.placeholder = "Write your memory here 💕";
        caption.addEventListener('input', (e) => {
            captionsList[index] = e.target.value;
        });

        frame.appendChild(img);
        page.appendChild(frame);
        page.appendChild(caption);

        previewContainer.appendChild(page);
    });
}

previewBtn.addEventListener('click', renderPreview);

/* ===== PDF ===== */

generatePDFBtn.addEventListener('click', async () => {

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p','pt','a4');

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const albumTitle = document.getElementById('albumTitle').value;
    const yourName = document.getElementById('name').value;
    const partnerName = document.getElementById('partnerName').value;

    /* COVER */
    doc.setFillColor(255,240,245);
    doc.rect(0,0,pageWidth,pageHeight,'F');

    doc.setFontSize(34);
    doc.text(albumTitle,pageWidth/2,150,{align:'center'});

    doc.setFontSize(20);
    doc.text(`From: ${yourName}`,pageWidth/2,210,{align:'center'});
    doc.text(`To: ${partnerName}`,pageWidth/2,240,{align:'center'});

    /* PHOTO PAGES */
    for(let i=0;i<photosList.length;i++){
        doc.addPage();

        const imgData = await toDataURL(photosList[i]);

        const imgProps = doc.getImageProperties(imgData);

        const ratio = imgProps.width / imgProps.height;

        let imgWidth = pageWidth - 80;
        let imgHeight = imgWidth / ratio;

        if(imgHeight > pageHeight - 220){
            imgHeight = pageHeight - 220;
            imgWidth = imgHeight * ratio;
        }

        const x = (pageWidth - imgWidth) / 2;

        doc.addImage(imgData,'JPEG',x,60,imgWidth,imgHeight);

        doc.setFontSize(14);
        doc.text(captionsList[i] || '',40,imgHeight + 120);
    }

    doc.save("Valentine_Memory_Book.pdf");
});

function toDataURL(file){
    return new Promise((resolve,reject)=>{
        const reader=new FileReader();
        reader.onload=e=>resolve(e.target.result);
        reader.onerror=err=>reject(err);
        reader.readAsDataURL(file);
    });
}