let photosList = [];
let captionsList = [];

const photoInput = document.getElementById('photo');
const previewContainer = document.getElementById('previewContainer');
const previewBtn = document.getElementById('previewBtn');
const generatePDFBtn = document.getElementById('generatePDF');

photoInput.addEventListener('change', (e)=>{
    photosList = Array.from(e.target.files);
    captionsList = new Array(photosList.length).fill('');
    renderPreview();
});

function renderPreview(){
    previewContainer.innerHTML='';

    photosList.forEach((photo,index)=>{
        const wrapper=document.createElement('div');
        wrapper.classList.add('photo-wrapper');

        const img=document.createElement('img');
        img.src=URL.createObjectURL(photo);
        img.classList.add('preview-image');

        const caption=document.createElement('textarea');
        caption.classList.add('caption-input');
        caption.placeholder='Write your memory caption...';
        caption.addEventListener('input',(e)=>{
            captionsList[index]=e.target.value;
        });

        wrapper.appendChild(img);
        wrapper.appendChild(caption);
        previewContainer.appendChild(wrapper);
    });
}

previewBtn.addEventListener('click',()=>{
    renderPreview();
});

generatePDFBtn.addEventListener('click', async ()=>{
    const { jsPDF } = window.jspdf;
    const doc=new jsPDF();

    for(let i=0;i<photosList.length;i++){
        if(i>0) doc.addPage();

        const imgData=await toDataURL(photosList[i]);

        const pageWidth=doc.internal.pageSize.getWidth();
        const pageHeight=doc.internal.pageSize.getHeight();

        const imgProps=doc.getImageProperties(imgData);
        const ratio=imgProps.width/imgProps.height;

        let width=pageWidth-40;
        let height=width/ratio;

        if(height>pageHeight-120){
            height=pageHeight-120;
            width=height*ratio;
        }

        const x=(pageWidth-width)/2;
        const y=40;

        doc.addImage(imgData,'JPEG',x,y,width,height);
        doc.text(captionsList[i]||'',20,pageHeight-40);
    }

    doc.save('Valentine_Memory_Book.pdf');
});

function toDataURL(file){
    return new Promise((resolve,reject)=>{
        const reader=new FileReader();
        reader.onload=e=>resolve(e.target.result);
        reader.onerror=err=>reject(err);
        reader.readAsDataURL(file);
    });
}