import {mountPouchViewer} from './product/viewer.js?v=mobile-pan-119';
const reduce=false;document.body.classList.add('motion-enabled');
const touchDevice=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;let interacting=false;
const pouch=document.querySelector('#pouch');
let viewer;mountPouchViewer(pouch).then(v=>{viewer=v;viewer.setInteraction(true);pouch.classList.remove("touch-scroll");pouch.classList.add("touch-rubber");render()}).catch(e=>{console.error(e);pouch.innerHTML='<img src="assets/optimized/model-image-0.png" alt="Coffeeblackcat label" style="width:100%;height:100%;object-fit:contain">';});
const dialog=document.querySelector('#order'),preorderBar=document.querySelector('.preorder');let basketAnimation=null,lockedScrollY=0,bodyLockSnapshot=null;function lockPageScroll(){if(bodyLockSnapshot)return;lockedScrollY=window.scrollY;const body=document.body;bodyLockSnapshot={position:body.style.position,top:body.style.top,left:body.style.left,right:body.style.right,width:body.style.width};document.documentElement.classList.add('dialog-scroll-locked');body.classList.add('dialog-scroll-locked');body.style.position='fixed';body.style.top=`-${lockedScrollY}px`;body.style.left='0';body.style.right='0';body.style.width='100%';}function unlockPageScroll(){if(!bodyLockSnapshot)return;const body=document.body;Object.assign(body.style,bodyLockSnapshot);body.classList.remove('dialog-scroll-locked');document.documentElement.classList.remove('dialog-scroll-locked');const y=lockedScrollY;bodyLockSnapshot=null;window.scrollTo(0,y);}function openOrder(){if(dialog.open)return;window.refreshShopifyCheckout?.();const originHeight=preorderBar.getBoundingClientRect().height;dialog.style.setProperty('--basket-origin-height',`${originHeight}px`);dialog.style.height=`${originHeight}px`;dialog.classList.remove('is-expanded');if(matchMedia('(min-width:701px)').matches){dialog.show();}else{lockPageScroll();dialog.showModal();}const basketContent=dialog.querySelector('.basket-scroll');const targetHeight=Math.min(basketContent.scrollHeight+2,window.innerHeight-32);if(matchMedia('(prefers-reduced-motion: reduce)').matches){dialog.style.height=`${targetHeight}px`;dialog.classList.add('is-expanded');return;}requestAnimationFrame(()=>{if(!dialog.open)return;if(typeof dialog.animate==='function'){basketAnimation=dialog.animate([{height:`${originHeight}px`},{height:`${targetHeight}px`}],{duration:680,easing:'cubic-bezier(.22,1,.36,1)'});basketAnimation.onfinish=()=>{if(!dialog.open)return;dialog.style.height=`${targetHeight}px`;dialog.classList.add('is-expanded');basketAnimation=null;};}else{dialog.classList.add('is-expanded');}});}document.querySelectorAll('.order-summary,.order-button').forEach(b=>b.onclick=openOrder);window.refreshShopifyCheckout?.();document.querySelector('.close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{if(basketAnimation){basketAnimation.cancel();basketAnimation=null;}dialog.classList.remove('is-expanded');dialog.style.height='';unlockPageScroll();});dialog.addEventListener('wheel',event=>{if(dialog.open)event.preventDefault();},{passive:false});dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientY<r.top||e.clientX<r.left||e.clientX>r.right)dialog.close();}});
// One timeline drives camera and copy. Layout dimensions stay fixed while scrolling.
const storyUnderlay=document.querySelector('.scroll-story');
const hero=document.querySelector('.hero'),stage=document.querySelector('.hero-stage');
const title=document.querySelector('h1'),caption=document.querySelector('.hero-caption');
const taste=document.querySelector('.taste'),track=document.querySelector('.taste-track');

const clamp=v=>Math.max(0,Math.min(1,v));
let current=0,lastProgress=-1;
function render(){
 const rect=hero.getBoundingClientRect();
 const top=parseFloat(getComputedStyle(stage).top)||0;
 const pinDistance=Math.max(1,hero.offsetHeight-stage.offsetHeight-top);
 const sceneProgress=clamp(-rect.top/pinDistance);
 // Finish before the pin releases, leaving a still final composition.
 const target=clamp(sceneProgress/.78);
 current+=.14*(target-current);
 if(Math.abs(target-current)<.0001||sceneProgress>=.88)current=target;
 if(viewer&&!interacting&&Math.abs(current-lastProgress)>.00001){viewer.setScrollProgress(current);lastProgress=current;}
 title.style.transform=`translateY(${-Math.max(0,-rect.top)}px)`;
 const textProgress=clamp((current-.25)/.75);
 
 caption.style.opacity=1-clamp(current*2.5);
 const tasteInner=document.querySelector('.taste-inner');
 const tasteWindow=document.querySelector('.taste-window');
 const tasteStyle=getComputedStyle(taste);
 const paddingTop=parseFloat(tasteStyle.paddingTop)||0;
 const paddingBottom=parseFloat(tasteStyle.paddingBottom)||0;
 const paddingLeft=parseFloat(tasteStyle.paddingLeft)||0;
 const paddingRight=parseFloat(tasteStyle.paddingRight)||0;
 const sectionRect=taste.getBoundingClientRect();
 const contentWidth=taste.clientWidth-paddingLeft-paddingRight;
 tasteInner.style.width=`${contentWidth}px`;
 const visibleBottom=innerHeight-document.querySelector('.preorder').offsetHeight;
 const panelCenter=(78+visibleBottom)/2;
 const pinTop=Math.min(95,panelCenter-tasteWindow.offsetTop-tasteWindow.offsetHeight/2);
 const horizontalTravel=Math.max(0,track.scrollWidth-tasteWindow.clientWidth);
 // Keep the horizontal story moving, with a shorter handoff into Origin.
 const runway=Math.max(innerHeight*.58,horizontalTravel*.58);
 const compositionHeight=Math.max(tasteInner.offsetHeight,innerHeight-pinTop);
 const sectionHeight=paddingTop+compositionHeight+paddingBottom+runway;
 if(Math.abs(taste.offsetHeight-sectionHeight)>1)taste.style.height=`${sectionHeight}px`;
 const consumed=pinTop-sectionRect.top-paddingTop;
 const tasteProgress=clamp(consumed/runway);
 // Explicitly lock the composition while vertical scroll drives only its X offset.
 if(consumed>=0&&consumed<=runway){
  tasteInner.style.position='fixed';tasteInner.style.top=`${pinTop}px`;
  tasteInner.style.left=`${sectionRect.left+paddingLeft}px`;
 }else{
  tasteInner.style.position='absolute';
  tasteInner.style.top=`${paddingTop+(consumed>runway?runway:0)}px`;
  tasteInner.style.left=`${paddingLeft}px`;
 }
 const tasteOffset=-tasteProgress*horizontalTravel;
 track.style.transform=`translateX(${tasteOffset}px)`;
 track.style.setProperty('--taste-offset',`${tasteOffset}px`);

}
function frame(time){render();animateCat(time);requestAnimationFrame(frame)}
requestAnimationFrame(frame);
addEventListener('resize',()=>{lastProgress=-1});

// Animate SVG attributes directly for consistent playback on mobile Safari.
const eyeWhites=document.querySelector('.cat-eye-whites');

const catPupils=document.querySelector('.cat-pupils');
const eyeBounds=eyeWhites.getBBox();
const eyeCentreY=eyeBounds.y+eyeBounds.height/2;
const glances=[[0,0,0],[2,0,0],[2.7,5,-2],[5,5,-2],[5.7,0,0],[9,0,0],[9.7,-5,2],[12,-5,2],[12.7,0,0],[14,0,0],[14.7,2,-3],[16,2,-3],[17,0,0]];
function animateCat(time){
 const blinkTime=time%9700;
 let openness=1;
 for(const start of [3300,7200,7800]){
  const phase=(blinkTime-start)/180;
  if(phase>=0&&phase<=1)openness=1-.97*Math.sin(phase*Math.PI);
 }
 const blink=`translate(0 ${eyeCentreY}) scale(1 ${openness}) translate(0 ${-eyeCentreY})`;
 eyeWhites.setAttribute('transform',blink);
 catPupils.setAttribute('opacity',String(Math.max(0,Math.min(1,(openness-.55)/.35))));
 const t=(time/1000)%17;
 for(let i=1;i<glances.length;i++){
  const b=glances[i],a=glances[i-1];if(t>b[0])continue;
  const q=(t-a[0])/(b[0]-a[0]),ease=q*q*(3-2*q);
  catPupils.setAttribute('transform',`translate(${a[1]+(b[1]-a[1])*ease} ${a[2]+(b[2]-a[2])*ease})`);break;
 }
}

const preorderOpensButton=document.querySelector('.shopify-closed');
function nudgePreorderButton(){
 preorderOpensButton.classList.remove('is-tapped');
 void preorderOpensButton.offsetWidth;
 preorderOpensButton.classList.add('is-tapped');
}
preorderOpensButton?.addEventListener('touchstart',nudgePreorderButton,{passive:true});
preorderOpensButton?.addEventListener('pointerdown',event=>{
 if(event.pointerType!=='touch')nudgePreorderButton();
},{passive:true});
preorderOpensButton?.addEventListener('keydown',event=>{
 if(event.key==='Enter'||event.key===' ')nudgePreorderButton();
});
preorderOpensButton?.addEventListener('animationend',()=>preorderOpensButton.classList.remove('is-tapped'));

const originRail=document.querySelector('.origin-rail');
const originSlides=[...originRail.querySelectorAll('.origin-slide')];
const originPrev=document.querySelector('.origin-prev'),originNext=document.querySelector('.origin-next');
let originIndex=0;
function updateOriginGallery(){
 const step=originSlides[1].offsetLeft-originSlides[0].offsetLeft;
 originIndex=Math.max(0,Math.min(originSlides.length-1,Math.round(originRail.scrollLeft/step)));
 document.querySelector('.origin-count').textContent=`${originIndex+1} / ${originSlides.length}`;
 originPrev.disabled=originIndex===0;originNext.disabled=originIndex===originSlides.length-1;
}
function moveOrigin(direction){
 const next=Math.max(0,Math.min(originSlides.length-1,originIndex+direction));
 originRail.scrollTo({left:originSlides[next].offsetLeft-originSlides[0].offsetLeft,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
}
originPrev.onclick=()=>moveOrigin(-1);originNext.onclick=()=>moveOrigin(1);
originRail.addEventListener('scroll',updateOriginGallery,{passive:true});
originRail.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();moveOrigin(e.key==='ArrowRight'?1:-1);}});
addEventListener('resize',updateOriginGallery);

// Explicit CET offset makes this the same instant in every visitor's timezone.
const preorderLaunch=Date.parse('2026-11-06T19:00:00+01:00');
const preorderCountdown=document.querySelector('.countdown-label');
function formatPreorderCountdown(now){
 const seconds=Math.max(0,Math.ceil((preorderLaunch-now)/1000));
 if(seconds===0)return 'Now';
 const days=Math.floor(seconds/86400);
 const hours=Math.floor(seconds%86400/3600);
 const minutes=Math.floor(seconds%3600/60);
 const remainder=seconds%60;
 return `${days}d ${String(hours).padStart(2,'0')}h ${String(minutes).padStart(2,'0')}m ${String(remainder).padStart(2,'0')}s`;
}
function updatePreorderCountdown(){preorderCountdown.textContent=formatPreorderCountdown(Date.now());}
updatePreorderCountdown();setInterval(updatePreorderCountdown,1000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)updatePreorderCountdown();});



const legalPolicyText={
privacy:`Last updated: October 31, 2026

Cofbla operates this store and website, including all related information, content, features, tools, products and services, in order to provide you, the customer, with a curated shopping experience (the "Services"). Cofbla is powered by Shopify, which enables us to provide the Services to you. This Privacy Policy describes how we collect, use, and disclose your personal information when you visit, use, or make a purchase or other transaction using the Services or otherwise communicate with us. If there is a conflict between our Terms of Service and this Privacy Policy, this Privacy Policy controls with respect to the collection, processing, and disclosure of your personal information.

Please read this Privacy Policy carefully. By using and accessing any of the Services, you acknowledge that you have read this Privacy Policy and understand the collection, use, and disclosure of your information as described in this Privacy Policy.

Personal Information We Collect or Process
When we use the term "personal information," we are referring to information that identifies or can reasonably be linked to you or another person. Personal information does not include information that is collected anonymously or that has been de-identified, so that it cannot identify or be reasonably linked to you. We may collect or process the following categories of personal information, including inferences drawn from this personal information, depending on how you interact with the Services, where you live, and as permitted or required by applicable law:
• Contact details including your name, address, billing address, shipping address, phone number, and email address.
• Financial information including credit card, debit card, and financial account numbers, payment card information, financial account information, transaction details, form of payment, payment confirmation and other payment details.
• Account information including your username, password, security questions, preferences and settings.
• Transaction information including the items you view, put in your cart, add to your wishlist, or purchase, return, exchange or cancel and your past transactions.
• Communications with us including the information you include in communications with us, for example, when sending a customer support inquiry.
• Device information including information about your device, browser, or network connection, your IP address, and other unique identifiers.
• Usage information including information regarding your interaction with the Services, including how and when you interact with or navigate the Services.

Personal Information Sources
We may collect personal information from the following sources:
• Directly from you including when you create an account, visit or use the Services, communicate with us, or otherwise provide us with your personal information;
• Automatically through the Services including from your device when you use our products or services or visit our websites, and through the use of cookies and similar technologies;
• From our service providers including when we engage them to enable certain technology and when they collect or process your personal information on our behalf;
• From our partners or other third parties.

How We Use Your Personal Information
Depending on how you interact with us or which of the Services you use, we may use personal information for the following purposes:
• Provide, Tailor, and Improve the Services. We use your personal information to provide you with the Services, including to perform our contract with you, to process your payments, to fulfill your orders, to remember your preferences and items you are interested in, to send notifications to you related to your account, to process purchases, returns, exchanges or other transactions, to create, maintain and otherwise manage your account, to arrange for shipping, to facilitate any returns and exchanges, to enable you to post reviews, and to create a customized shopping experience for you, such as recommending products related to your purchases. This may include using your personal information to better tailor and improve the Services.
• Marketing and Advertising. We use your personal information for marketing and promotional purposes, such as to send marketing, advertising and promotional communications by email, text message or postal mail, and to show you online advertisements for products or services on the Services or other websites, including based on items you previously have purchased or added to your cart and other activity on the Services.
• Security and Fraud Prevention. We use your personal information to authenticate your account, to provide a secure payment and shopping experience, detect, investigate or take action regarding possible fraudulent, illegal, unsafe, or malicious activity, protect public safety, and to secure our services. If you choose to use the Services and register an account, you are responsible for keeping your account credentials safe. We highly recommend that you do not share your username, password or other access details with anyone else.
• Communicating with You. We use your personal information to provide you with customer support, to be responsive to you, to provide effective services to you and to maintain our business relationship with you.
• Legal Reasons. We use your personal information to comply with applicable law or respond to valid legal process, including requests from law enforcement or government agencies, to investigate or participate in civil discovery, potential or actual litigation, or other adversarial legal proceedings, and to enforce or investigate potential violations of our terms or policies.

How We Disclose Personal Information
In certain circumstances, we may disclose your personal information to third parties for legitimate purposes subject to this Privacy Policy. Such circumstances may include:
• With Shopify, vendors and other third parties who perform services on our behalf (e.g. IT management, payment processing, data analytics, customer support, cloud storage, fulfillment and shipping).
• With business and marketing partners to provide marketing services and advertise to you. For example, we use Shopify to support personalized advertising with third-party services based on your online activity with different merchants and websites. Our business and marketing partners will use your information in accordance with their own privacy notices. Depending on where you reside, you may have a right to direct us not to share information about you to show you targeted advertisements and marketing based on your online activity with different merchants and websites.
• When you direct, request us or otherwise consent to our disclosure of certain information to third parties, such as to ship you products or through your use of social media widgets or login integrations.
• With our affiliates or otherwise within our corporate group.
• In connection with a business transaction such as a merger or bankruptcy, to comply with any applicable legal obligations (including to respond to subpoenas, search warrants and similar requests), to enforce any applicable terms of service or policies, and to protect or defend the Services, our rights, and the rights of our users or others.

Relationship with Shopify
The Services are hosted by Shopify, which collects and processes personal information about your access to and use of the Services in order to provide and improve the Services for you. Information you submit to the Services will be transmitted to and shared with Shopify as well as third parties that may be located in countries other than where you reside, in order to provide and improve the Services. In addition, to help protect, grow, and improve our business, we use certain Shopify enhanced features that incorporate data and information obtained from your interactions with our Store, along with other merchants and with Shopify. To provide these enhanced features, Shopify may make use of personal information collected about your interactions with our store, along with other merchants, and with Shopify. In these circumstances, Shopify is responsible for the processing of your personal information, including for responding to your requests to exercise your rights over use of your personal information for these purposes. To learn more about how Shopify uses your personal information and any rights you may have, you can visit the Shopify Consumer Privacy Policy. Depending on where you live, you may exercise certain rights with respect to your personal information through the Shopify Privacy Portal.

Third Party Websites and Links
The Services may provide links to websites or other online platforms operated by third parties. If you follow links to sites not affiliated or controlled by us, you should review their privacy and security policies and other terms and conditions. We do not guarantee and are not responsible for the privacy or security of such sites, including the accuracy, completeness, or reliability of information found on them. Information you provide on public or semi-public venues, including information you share on third-party social networking platforms may also be viewable by other users of the Services and/or users of those third-party platforms without limitation as to its use by us or by a third party. Our inclusion of such links does not, by itself, imply any endorsement of the content on such platforms or of their owners or operators, except as disclosed on the Services.

Children's Data
The Services are not intended to be used by children, and we do not knowingly collect any personal information about children under the age of majority in your jurisdiction. If you are the parent or guardian of a child who has provided us with their personal information, you may contact us using the contact details set out below to request that it be deleted. As of the Effective Date of this Privacy Policy, we do not have actual knowledge that we "share" or "sell" (as those terms are defined in applicable law) personal information of individuals under 16 years of age.

Security and Retention of Your Information
Please be aware that no security measures are perfect or impenetrable, and we cannot guarantee "perfect security." In addition, any information you send may not be secure while in transit. We recommend that you do not use unsecure channels to communicate sensitive or confidential information to us.

How long we retain your personal information depends on different factors, such as whether we need the information to maintain your account, provide you with Services, comply with legal obligations, resolve disputes or enforce applicable contracts and policies.

Your Rights and Choices
Depending on where you live, you may have some or all of the rights listed below in relation to your personal information. These rights are not absolute, may apply only in certain circumstances and, in certain cases, we may decline your request as permitted or required by law.
• Right to Access / Know. You may have a right to request access to personal information that we hold about you.
• Right to Delete. You may have a right to request that we delete personal information we maintain about you.
• Right to Correct. You may have a right to request that we correct inaccurate personal information we maintain about you.
• Right of Portability. You may have a right to receive a copy of personal information we hold about you and to request that we transfer it to a third party, in certain circumstances and with certain exceptions.
• Managing Communication Preferences. We may send promotional emails, and you may opt out at any time using the unsubscribe option in our emails. If you opt out, we may still send non-promotional emails about your account or orders.

If you reside in the UK or European Economic Area, subject to exceptions and limitations in local law, you may also have these rights:
• Objection to Processing and Restriction of Processing: You may have the right to ask us to stop or restrict processing for certain purposes.
• Withdrawal of Consent: Where we rely on consent, you have the right to withdraw it. Withdrawal does not affect the lawfulness of processing before withdrawal.

You may exercise these rights where indicated on the Services or by contacting us. To learn how Shopify uses your personal information and about rights for data processed by Shopify, visit the Shopify Privacy Portal. We will not discriminate against you for exercising rights. We may verify your identity. You may designate an authorized agent; before accepting a request from an agent, we may require proof of authorization and may verify your identity directly. We will respond in a timely manner as required by applicable law.

Complaints
If you have complaints about how we process personal information, contact us. Depending on where you live, you may have the right to appeal or lodge a complaint with your local data protection authority. For the EEA, a list of responsible supervisory authorities is available from the European Data Protection Board.

International Transfers
We may transfer, store and process personal information outside your country. If we transfer personal information outside the EEA or UK, we rely on recognized transfer mechanisms like the European Commission's Standard Contractual Clauses, equivalent contracts issued by the competent UK authority, or an adequacy decision.

Changes to This Privacy Policy
We may update this Privacy Policy from time to time, including to reflect changes to practices or operational, legal or regulatory reasons. We will post the revised Privacy Policy, update the "Last updated" date and provide notice as required by law.

Contact
Should you have questions about privacy practices or this Privacy Policy, or would like to exercise rights, email orders@cofbla.com. For applicable data protection laws, Cofbla is the data controller of your personal information.`,
terms:`Last updated: October 31, 2026

Overview
Welcome to Cofbla! The terms "we", "us" and "our" refer to Cofbla. Cofbla operates this store and website, including all related information, content, features, tools, products and services in order to provide you, the customer, with a curated shopping experience (the "Services"). Cofbla is powered by Shopify Inc., Shopify Commerce Singapore Pte. Ltd or Shopify International Limited, depending on where Cofbla is located, which enables us to provide the Services to you.

The below terms and conditions, together with any policies referenced herein (these "Terms of Service") describe your rights and responsibilities when you use the Services. Please read these Terms of Service carefully, as they include important information about your legal rights and cover areas such as warranty disclaimers and limitations of liability.

By visiting, interacting with or using our Services, you agree to be bound by these Terms of Service and our privacy policy. If you do not agree to these Terms of Service or Privacy Policy, you should not use or access our Services. These Terms do not limit any rights you may have under applicable consumer protection laws or any other non-waivable statutory rights.

1. Access and account
By agreeing to these Terms of Service, you represent that you are at least the age of majority in your state or province of residence, and you have given us your consent to allow any of your minor dependents to use the Services on devices you own, purchase or manage. To use the Services, including accessing or browsing our online stores or purchasing any products or services we offer, you may be asked to provide certain information, such as your email address, billing, payment, and shipping information. You represent and warrant that all information you provide is correct, current and complete and that you have all rights necessary to provide it. You are solely responsible for maintaining the security of your account credentials and for all account activity. You may not transfer, sell, assign, or license your account to any other person.

2. Our products
We have made every effort to provide an accurate representation of our products and services in our online stores. However, colors or product appearance may differ from how they may appear on your screen due to the type of device you use and your device settings and configuration. We do not warrant that the appearance or quality of products or services purchased by you will meet your expectations or be the same as depicted in our online stores. All product descriptions are subject to change at any time without notice at our discretion. We reserve the right to discontinue a product at any time and may limit quantities offered to any person, geographic region or jurisdiction, case by case.

3. Orders
When you place an order, you make an offer to purchase and authorize us and our payment processors to charge your selected payment method for the total. Cofbla may accept or decline your order for any reason at its discretion, subject to law. Your order is not accepted until Cofbla confirms acceptance. We must receive and process payment before acceptance. Review your order carefully before submitting, as Cofbla may be unable to accommodate cancellation requests after acceptance. If we do not accept, change or cancel an order, we may attempt to notify you by contacting the email, billing address and/or phone number provided. Purchases are subject to return or exchange solely in accordance with our return and refund policy. This does not limit rights under applicable law. You warrant that purchases are for personal or household use and not commercial resale or export.

4. Prices and billing
Prices, discounts and promotions may change without notice. The price charged is the price in effect when the order is placed and is set out in your order confirmation email. Unless expressly stated, posted prices do not include taxes, shipping, handling, customs or import charges. Prices in our online stores may differ from physical stores or third-party stores. Promotions may have separate terms; if they conflict with these Terms, the promotion terms govern. You agree to provide current, complete and accurate purchase, payment and account information and promptly update it. You warrant that you are authorized to use the payment method, information is true and complete, charges will be honored by the provider, and you will pay charges at posted prices including shipping and taxes.

5. Shipping and delivery
Except as otherwise stated, we are not liable for shipping and delivery delays. Delivery times are estimates only and not guaranteed. We are not responsible for carrier delays, customs processing, or events outside our control. To the fullest extent permitted by law, title and risk of loss pass when products are transferred to the carrier, unless law provides otherwise. We are not responsible for delays or failures caused by events beyond reasonable control, including carrier or customs delays, natural disasters, severe weather, labor disputes, supply shortages, utility or telecommunications outages, cyber incidents, governmental actions or similar events. See our shipping policy for more details.

6. Intellectual property
Our Services, including trademarks, brands, text, images, graphics, product reviews, video and audio, are owned by Cofbla, affiliates or licensors and protected by intellectual property laws. Product listings are managed and owned by Cofbla. Purchase or delivery does not grant intellectual property rights in a product, design, software or technology. These Terms permit personal, non-commercial use only. You must not reproduce, distribute, modify, create derivative works, publicly display, publicly perform, republish, download, store or transmit any material without prior written consent. Nothing grants a license or rights under any patent, trademark, copyright or other intellectual property except as expressly provided. Unauthorized use may violate laws. Cofbla names, logos, product and service names, designs and slogans are trademarks of Cofbla or its licensors. Shopify names, logos, product and service names, designs and slogans are trademarks of Shopify. All other names and marks are trademarks of their respective owners.

7. Optional tools
You may be provided access to customer tools offered by third parties that we neither monitor nor control. You acknowledge that such tools are provided "as is" and "as available" without warranties, representations, conditions or endorsement. We have no liability arising from or relating to your use of optional tools. Use is at your own risk and discretion; ensure you know and approve the provider's terms. New features and tools will also be part of the Services and subject to these Terms.

8. Third-party links
The Services may contain materials and hyperlinks to websites provided or operated by third parties, including embedded third-party functionality. We are not responsible for examining or evaluating their content or accuracy. If you access third-party sites, you do so at your own risk. We are not liable for harm or damages related to access or purchases, services, resources or content on third-party websites. Review their policies and practices before engaging in a transaction. Complaints, claims, concerns or questions regarding third-party products and services should be directed to the third party.

9. Relationship with Shopify
Cofbla is powered by Shopify, which enables us to provide the Services. When you use the Services, your device communicates with Shopify's systems. However, sales and purchases in our Store are directly with Cofbla. Shopify is not responsible for any aspect of sales between you and Cofbla, including injury, damage or loss resulting from purchased products and services. You expressly release Shopify and its affiliates from claims, damages and liabilities arising from purchases and transactions with Cofbla.

10. Privacy policy
Our privacy policy explains how we may collect, use and disclose personal information from your use of the Services. By using the Services, you acknowledge that you have read it. Because Shopify hosts the Services, Shopify collects, uses, processes and stores information about your access and use, including transaction information, to provide, secure and improve the Services and help prevent fraud. Browsing information is transmitted to and shared with Shopify and third parties in other countries to provide Services. Review our privacy policy and Shopify's privacy policy for details.

11. Feedback
If you submit, upload, post, email or otherwise transmit ideas, suggestions, feedback, reviews, proposals, plans or other content ("Feedback"), you grant us a perpetual, worldwide, sublicensable, royalty-free license to use, reproduce, modify, publish, distribute and display it in any medium for any purpose, including commercial use. You warrant that you own or have necessary rights, have disclosed compensation or incentives, and Feedback complies with these Terms. We have no obligation to keep Feedback confidential, pay compensation or respond. We may monitor, edit or remove content we determine is unlawful, offensive, threatening, libelous, defamatory, pornographic, obscene, objectionable or infringing. You warrant Feedback does not violate third-party rights or contain unlawful, abusive or obscene material or malware. You may not use a false email address, impersonate another person or mislead others about its origin. You are solely responsible for Feedback and its accuracy.

12. Errors, inaccuracies and omissions
Information in the Services may contain typographical errors, inaccuracies or omissions related to product descriptions, pricing, promotions, offers, shipping charges, transit times and availability. We reserve the right to correct errors, inaccuracies or omissions, update information or cancel orders if information is inaccurate, including after submission. If we cancel after payment, we will issue any refund required by law.

13. Prohibited uses
You may access and use the Services for lawful purposes only. You may not use them for unlawful or malicious purposes; violate international, federal, provincial, state or local laws; infringe intellectual property; harass, abuse, insult, harm, defame, slander, disparage or intimidate; transmit false or misleading information; knowingly send or receive material that does not comply with these Terms; send spam; impersonate another person; or engage in conduct that restricts others' use or exposes Cofbla, Shopify or users to liability. You also agree not to transmit malicious code; reproduce, duplicate, copy, extract, sell, resell or exploit any portion; collect or track personal information; spam, phish, pharm or pretext; use robots, spiders, scraping, data gathering or automated processes to access the Services; or interfere with, bypass or circumvent security and authorization features. We may suspend, disable or terminate access without notice if we determine you violated any part of these Terms.

14. Agents
This section applies if you use, allow, enable or cause an Agent to access, use or interact with the Services. An Agent means software or a service that takes autonomous or semi-autonomous action on behalf of a person or entity without direct supervision. No Agent may interact unless it identifies itself in HTTP/HTTPS requests using an "Agent/[agent name]" user-agent string; does not conceal or obfuscate that it is automated, including by mimicking human behavior or circumventing CAPTCHAs; responds truthfully if asked whether interactions are automated; and does not avoid measures intended to block, limit, modify or control access. We may limit whether and how an Agent accesses or interacts with the Services.

15. Termination
We may terminate this agreement or your access to the Services at our discretion at any time without notice. You remain liable for amounts due through the termination date. Sections concerning intellectual property, feedback, termination, disclaimers, liability, indemnification, severability, waiver, governing law, privacy and other provisions that by nature should survive will continue to apply.

16. Disclaimer of warranties
Information in the Services is for general information. We do not warrant accuracy, completeness or usefulness. Reliance is at your own risk. Except as expressly stated by Cofbla, Services and products are provided "as is" and "as available" without express or implied warranties or conditions, including merchantability, merchantable quality, fitness for a particular purpose, durability, title and non-infringement. We do not guarantee uninterrupted, timely, secure or error-free use. Some jurisdictions limit disclaimers, so they may not apply to you.

17. Limitation of liability
To the fullest extent provided by law, Cofbla and its partners, directors, officers, employees, affiliates, agents, contractors, service providers and licensors, and those of Shopify and its affiliates, are not liable for injury, loss, claims, or direct, indirect, incidental, punitive, special or consequential damages, including lost profits, lost revenue, lost savings, loss of data or replacement costs, arising from your use of the Services or products, regardless of contract, tort, negligence or strict liability, even if advised of their possibility. Nothing excludes or limits liability that cannot be excluded or limited under applicable law.

18. Indemnification
You agree to indemnify, defend and hold harmless Cofbla, Shopify and their affiliates, partners, officers, directors, employees, agents, contractors, licensors and service providers from losses, damages, liabilities or third-party claims, including reasonable attorneys' fees, due to your breach of these Terms, violation of law or third-party rights, or access to and use of the Services. We will notify you of a claim; failure to promptly notify will not relieve obligations unless materially prejudicial. We may control the defense and settlement at your expense but will not settle a claim requiring non-monetary obligations without consent. You will cooperate in the defense, including by providing documents.

19. Severability
If any provision is unlawful, void or unenforceable, it will be enforced to the fullest extent permitted or severed without affecting remaining provisions. Nothing limits rights under consumer protection laws or other laws that cannot be waived. Where any part conflicts with those rights, the rights apply.

20. Waiver; entire agreement
Failure to exercise or enforce a right is not a waiver. These Terms and policies posted by us constitute the entire agreement governing use of the Services and supersede prior or contemporaneous agreements, communications and proposals. Ambiguities will not be construed against the drafting party.

21. Assignment
You may not delegate, transfer or assign this Agreement or any rights or obligations without prior written consent; any attempt is null and void. We may transfer, assign or delegate our rights and obligations without consent or notice.

22. Governing law
These Terms are governed by the laws of the jurisdiction where Cofbla is headquartered or incorporated, without regard to conflict-of-law principles. You and Cofbla consent to the courts located in that jurisdiction, except where prohibited. Nothing limits rights to bring claims in local courts or rely on mandatory laws in your place of residence.

23. Translations
The Terms may be available in other languages. If translated Terms conflict with the most current English version, the English version prevails unless applicable law requires otherwise. Disputes will be resolved in English unless Cofbla determines otherwise or law requires another language.

24. Headings
Headings are included for convenience only and do not limit or otherwise affect these Terms.

25. Electronic communications
By using the Services or placing an order, you agree that we may send transactional and service-related communications electronically, including by email, in-account notice or posting on the Services. These communications may relate to orders, accounts, purchases, returns, these Terms or other Services matters. Keep your contact information current.

26. Changes to Terms of Service
You can review the most current Terms at any time. We may update, change or replace any part by posting updates. It is your responsibility to check periodically. We will notify you of material changes as required by law and changes take effect on the date specified.

27. Contact information
Questions about the Terms should be sent to orders@cofbla.com. Our contact information is posted in the contact information policy.`,
shipping:`Last updated: October 31, 2026

Thank you for shopping with Cofbla. This policy explains how we ship your order, what it costs, and what to expect after you buy.

Order Processing
Except as otherwise stated on our website, orders are processed within 1 business day (excluding holidays).

Orders placed after noon or on weekends and holidays may begin processing the next business day.

You'll receive a confirmation email with tracking as soon as your order ships, if the shipping method supports it.

Shipping Methods & Delivery Times
Available shipping methods and estimated delivery times are shown at checkout. Delivery times are estimates, not guarantees, and begin once your order ships. They may be affected by carrier delays, weather, or other events outside our control.

Shipping costs
Shipping charges are calculated at checkout based on your destination, order weight, and selected shipping method. Free standard shipping may be available on selected orders as displayed at checkout.

United Kingdom customs, taxes and other applicable fees
For orders shipped to the United Kingdom, taxes, duties, and import fees may apply. Where available, these charges will be calculated and collected at checkout. If taxes or duties are collected at checkout, they will be shown before you place your order. If these charges are not collected at checkout, they may be due before or at delivery and are the customer's responsibility unless otherwise stated.

In some cases, additional import charges, customs duties, VAT, brokerage fees, or carrier handling fees may be due when your order arrives in the United Kingdom. These charges are determined by UK customs authorities and/or the carrier and are the customer's responsibility unless we expressly state at checkout that duties and taxes are prepaid.

Customs processing may also affect delivery times. We recommend checking your local import rules before placing an order.

European Union customs, taxes and other applicable fees
Orders shipped to countries in the European Union may be subject to VAT, customs duties, import taxes, and carrier brokerage or handling fees. Where available, applicable taxes, duties, and import fees will be calculated and shown at checkout before you place your order. If these charges are not collected at checkout, they may be due before or at delivery and are the customer's responsibility unless otherwise stated.

If checkout states that duties and taxes are prepaid, your order will be shipped with those charges prepaid and you should not be asked to pay additional import charges at delivery. If checkout does not state that duties and taxes are prepaid, you may be required to pay VAT, customs duties, import taxes, brokerage fees, or carrier handling fees before or at delivery.

Import charges are determined by EU customs authorities and/or the carrier and may vary based on destination country, product classification, product value, country of origin, and shipping method. Customs processing may also affect delivery times.

Order Tracking
Once your order ships, we'll email you a confirmation with a tracking number and link, if applicable. Please note tracking information may take time to update after you receive it.

Shipping destinations
We currently ship to Netherlands.

International orders may be subject to customs duties, import taxes, fees, and customs delays. Any applicable charges collected at checkout will be shown before you complete your purchase.

Address accuracy
Please check your shipping address at checkout. Contact us as soon as possible if you need to correct it.

Lost, damaged, or delayed packages
If your order is lost, damaged, or delayed, contact us and we will help you work with the carrier.

Order Changes & Cancellations
Need to change or cancel your order? Contact us as soon as possible. We may be able to accommodate changes before your order ships, but once it's in transit we're unable to modify it. Refunds for cancelled or delayed orders will be processed promptly to the original payment method where possible.

Questions?
Contact our team at orders@cofbla.com or use the contact details in our contact information policy.`,
returns:`Last updated: October 31, 2026

Returns and cancellations
Return eligibility depends on the items in your order.

Where returns are accepted, items must be returned in the same condition they were received, unworn or unused, with tags, and in their original packaging or as otherwise indicated in the return instructions. We may reduce your refund if the item has been used, damaged, or handled more than necessary.

You may request a return within 14 days after the last item on your order is delivered.

Return shipping is free, and we will provide a return label.

You can request cancellation or removal of items from your order until the item is shipped.

How to start a return or cancellation
Whether return or cancellation requests are accepted depends on the terms above and your rights under applicable law.

Start your return or cancellation request by logging into your account.

If your return is approved, we will provide you instructions on how and where to send your package to complete your return.

Items sent back without first requesting a return will not be accepted.

Damages and issues
Please inspect your order when you receive it and contact us immediately if an item is defective or damaged, or if you received the wrong item.

Exceptions and non-returnable items
Some items may not be eligible for return, as stated in the return terms above or on the product listing, website, or in-store at the time of purchase.

Contact us if you have questions about whether a specific item can be returned.

Exchanges
Contact us to ask about exchange options before returning your item.

European Union returns and cancellations
If you are a consumer in the European Union and purchase goods online, you may have the right to cancel your order within 14 days after the day you receive your goods for any reason, unless an exemption applies.

After you notify us that you wish to cancel, you must return the goods within 14 days.

We will refund eligible cancelled orders within 14 days after we are informed of your cancellation, but we may withhold the refund until we receive the goods back or receive evidence that you have sent them back.

For eligible cancellations, we will refund the product price and the cost of standard delivery, if you paid for delivery. We are not required to refund any additional amount paid for express or premium delivery beyond the cost of standard delivery.

To request a return, follow the instructions above under how to start a return. To request a cancellation, contact us.

United Kingdom returns and cancellations
If you are a consumer in the United Kingdom and purchase goods online, you may have the right to cancel your order within 14 days after the day you receive your goods, unless an exemption applies.

After you tell us you wish to cancel, you must return the goods to us within 14 days.

We will refund eligible cancelled orders within 14 days after we receive the returned goods or receive evidence that you have sent them back.

For eligible cancellations, we will refund the product price and the cost of standard delivery, if you paid for delivery. We may not refund any additional amount paid for express or premium delivery beyond the cost of standard delivery.

To request a return, follow the instructions above under how to start a return. To request a cancellation, contact us.

Refunds
We will notify you after we receive and inspect your return and let you know whether the refund was approved. If approved, you will be refunded to your original payment method, unless otherwise stated. Your bank or payment provider may need additional time to process and post the refund.

If you do not see your refund within a reasonable period of time since your refund was approved, contact us.

This policy does not limit any rights you may have under applicable consumer protection laws, including rights that may apply if goods are defective, not as described, not delivered within the required or agreed timeframe, or otherwise do not comply with applicable law.

Contact
To request a cancellation, start a return, inquire about a return, ask about an exchange or report damaged items, please contact us at orders@cofbla.com or use the contact details in our contact information policy.`,
contact:`Merchant Name: Cofbla
Customer Support Contact: orders@cofbla.com`
};
const legalPolicyDialog=document.querySelector('#legal-policy');
const legalPolicyScroll=document.querySelector('.legal-policy-scroll');
const legalPolicyTitle=document.querySelector('#legal-policy-title');
function selectLegalPolicy(tab){
 const id=tab.dataset.policyId;
 legalPolicyTitle.textContent=tab.dataset.policyTitle;legalPolicyScroll.setAttribute('aria-labelledby',tab.id);
 legalPolicyScroll.textContent=legalPolicyText[id]||'';
 legalPolicyScroll.scrollTop=0;
 document.querySelectorAll('.legal-policy-tabs [role="tab"]').forEach(item=>{
  const selected=item===tab;
  item.setAttribute('aria-selected',String(selected));
  item.tabIndex=selected?0:-1;
 });
}
const legalPolicyTabs=[...document.querySelectorAll('.legal-policy-tabs [role="tab"]')];
legalPolicyTabs.forEach(tab=>tab.addEventListener('click',()=>selectLegalPolicy(tab)));
document.querySelector('.legal-policy-tabs').addEventListener('keydown',event=>{
 const current=legalPolicyTabs.indexOf(document.activeElement);
 if(current<0)return;
 let next=current;
 if(event.key==='ArrowRight')next=(current+1)%legalPolicyTabs.length;
 else if(event.key==='ArrowLeft')next=(current-1+legalPolicyTabs.length)%legalPolicyTabs.length;
 else if(event.key==='Home')next=0;
 else if(event.key==='End')next=legalPolicyTabs.length-1;
 else return;
 event.preventDefault();
 legalPolicyTabs[next].focus();
 selectLegalPolicy(legalPolicyTabs[next]);
});
document.querySelector('[data-policy-open]').addEventListener('click',()=>{
 selectLegalPolicy(legalPolicyTabs[0]);
 legalPolicyDialog.showModal();
});
document.querySelector('.legal-policy-close').addEventListener('click',event=>{event.preventDefault();legalPolicyDialog.close();});
legalPolicyDialog.addEventListener('click',event=>{if(event.target===legalPolicyDialog)legalPolicyDialog.close()});
