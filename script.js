/* Supply a secure backend URL that accepts JSON and only returns success after persisting the lead. Do not put API secrets here. */
const FORM_ENDPOINT=''; // REQUIRED: Set to your verified lead-capture API URL before advertising
const EMAIL='yourfriends@coalesceeventz.com';
const track=(event,params={})=>{window.dataLayer=window.dataLayer||[];window.dataLayer.push({event,...params});};

document.querySelectorAll('.track-call').forEach(a=>a.addEventListener('click',()=>track('click_to_call',{link_url:a.href})));
document.querySelectorAll('.track-whatsapp').forEach(a=>a.addEventListener('click',()=>track('click_whatsapp',{link_url:a.href})));

const menu=document.querySelector('#menu-btn'),mobile=document.querySelector('#mobile-nav');
menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!open));mobile.hidden=open;});
mobile?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{mobile.hidden=true;menu.setAttribute('aria-expanded','false');}));

document.querySelectorAll('.service-jump').forEach(link=>{
  link.addEventListener('click',e=>{
    const service=e.currentTarget.dataset.service;
    const select=document.querySelector('#service-select');
    if(select) select.value=service;
  });
});

const imgs=[...document.querySelectorAll('.work-card')].map(el=>({src:el.querySelector('img').src,alt:el.querySelector('img').alt}));
const dialog=document.querySelector('#lightbox');
let active=0;
function openPhoto(i){
  active=(i+imgs.length)%imgs.length;
  document.querySelector('#lightbox-image').src=imgs[active].src;
  document.querySelector('#lightbox-image').alt=imgs[active].alt;
  document.querySelector('#lightbox-caption').textContent=imgs[active].alt;
  if(!dialog.open)dialog.showModal();
}
document.querySelectorAll('.work-card').forEach((el,i)=>el.addEventListener('click',()=>openPhoto(i)));
document.querySelector('#close-lightbox')?.addEventListener('click',()=>dialog.close());
document.querySelector('#prev-lightbox')?.addEventListener('click',()=>openPhoto(active-1));
document.querySelector('#next-lightbox')?.addEventListener('click',()=>openPhoto(active+1));
dialog?.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
document.addEventListener('keydown',e=>{if(!dialog?.open)return;if(e.key==='ArrowLeft')openPhoto(active-1);if(e.key==='ArrowRight')openPhoto(active+1)});

const form=document.querySelector('#lead-form');
// Capture Google Ads click IDs and campaign parameters with each enquiry.
const attributionKeys=['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','gbraid','wbraid'];
const urlParams=new URLSearchParams(window.location.search);
for(const key of attributionKeys){
  const incoming=urlParams.get(key);
  if(incoming) sessionStorage.setItem('coalesce_attr_'+key,incoming.slice(0,300));
  const field=form?.querySelector(`[name="${key}"]`);
  if(field) field.value=sessionStorage.getItem('coalesce_attr_'+key)||'';
}
const status=document.querySelector('#form-status');
form?.addEventListener('submit',async e=>{
  e.preventDefault();
  if(!form.reportValidity()) return;
  const data=Object.fromEntries(new FormData(form).entries());
  if(data.website) return;
  delete data.website;
  delete data.consent;
  if(!FORM_ENDPOINT){
    status.className='form-status info';
    status.textContent='Your email app will open with your event enquiry. Please send the email to complete your request. No form submission has occurred.';
    track('email_draft_opened',{form_id:'lead-form'});
    const body=Object.entries(data).map(([k,v])=>`${k}: ${v}`).join('\n');
    window.location.href=`mailto:${EMAIL}?subject=${encodeURIComponent('Event Management Enquiry — '+data.company)}&body=${encodeURIComponent(body)}`;
    return;
  }
  const btn=form.querySelector('[type=submit]');
  btn.disabled=true;
  btn.textContent='SENDING…';
  try{
    const res=await fetch(FORM_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    if(!res.ok) throw new Error('Failed');
    sessionStorage.setItem('coalesce_v10_lead','yes');
    window.location.href='thank-you.html';
  }catch{
    status.className='form-status error';
    status.textContent='Could not submit your enquiry. Please call +91 84228 90579.';
  }finally{
    btn.disabled=false;
    btn.textContent='Request My Event Quote  ↗';
  }
});

const observer='IntersectionObserver' in window ? new IntersectionObserver(entries=>entries.forEach(x=>{if(x.isIntersecting){x.target.classList.add('visible');observer.unobserve(x.target);}}),{threshold:.12}) : null;
document.querySelectorAll('.reveal').forEach(el=>observer?observer.observe(el):el.classList.add('visible'));

function animateCounter(el){
  const target=Number(el.dataset.target||0);
  const suffix=el.dataset.suffix||'';
  const duration=1300;
  const start=performance.now();
  function tick(now){
    const progress=Math.min((now-start)/duration,1);
    const eased=1-Math.pow(1-progress,3);
    const value=Math.round(target*eased);
    el.innerHTML=`${value}<span class="suffix">${suffix}</span>`;
    if(progress<1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
const counters=document.querySelectorAll('.count-up');
if(counters.length){
  const counterObserver='IntersectionObserver' in window ? new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){ animateCounter(entry.target); counterObserver.unobserve(entry.target); }
  }),{threshold:.45}) : null;
  counters.forEach(counter=> counterObserver ? counterObserver.observe(counter) : animateCounter(counter));
}

document.querySelectorAll('#year').forEach(el=>{el.textContent=new Date().getFullYear();});


// V15: scroll progress and staggered section entrances; no external libraries.
(()=>{
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(reduce)return;
 const progress=document.querySelector('.lp-progress');
 let pending=false;
 function updateProgress(){const max=document.documentElement.scrollHeight-window.innerHeight; if(progress)progress.style.transform=`scaleX(${max>0?Math.min(1,Math.max(0,window.scrollY/max)):0})`;pending=false;}
 window.addEventListener('scroll',()=>{if(!pending){pending=true;requestAnimationFrame(updateProgress)}},{passive:true});
 window.addEventListener('resize',updateProgress,{passive:true});updateProgress();
 const targets=document.querySelectorAll('.event-category-tile,.work-card,.steps article,.faq-grid > *, .why-section .reveal, .contact-section .form-card');
 targets.forEach((el,i)=>{if(el.classList.contains('reveal'))return;el.classList.add('lp-animate');el.style.setProperty('--lp-delay',`${(i%4)*85}ms`)});
 if(!('IntersectionObserver' in window)){targets.forEach(el=>el.classList.add('lp-in'));return;}
 const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('lp-in');observer.unobserve(entry.target)}})},{threshold:.08,rootMargin:'0px 0px 40px 0px'});
 targets.forEach(el=>observer.observe(el));
})();
