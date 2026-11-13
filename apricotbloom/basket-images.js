const viewer=document.createElement('dialog');
viewer.id='basket-image-viewer';
viewer.setAttribute('aria-label','Larger basket product image');
viewer.innerHTML='<button type="button" class="basket-image-close" aria-label="Close larger image">Close&nbsp; ×</button><figure><img alt=""></figure>';
document.body.append(viewer);
let image=viewer.querySelector('img'),request=0,trigger=null;
for(const button of document.querySelectorAll('.basket-image-preview')){
 button.addEventListener('click',async()=>{
  const current=++request,thumbnail=button.querySelector('img'),next=new Image();
  next.alt=thumbnail.alt;next.src=thumbnail.currentSrc||thumbnail.src;
  // Decode the selected photo before opening; never paint the last photo.
  try{await next.decode();}catch{if(!next.complete||!next.naturalWidth)return;}
  if(current!==request)return;
  trigger=button;image.replaceWith(next);image=next;viewer.showModal();
 });
}
viewer.querySelector('button').addEventListener('click',()=>viewer.close());
viewer.addEventListener('click',event=>{if(event.target===viewer)viewer.close();});
viewer.addEventListener('close',()=>{
 request++;image.removeAttribute('src');image.alt='';
 trigger?.focus({preventScroll:true});
});
