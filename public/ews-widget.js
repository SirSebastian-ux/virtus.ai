/* Virtus AI: centrally managed EWS website chat widget */
(function () {
"use strict";
if (document.getElementById("virtus-ews-root")) return;
function init() {
if (document.getElementById("virtus-ews-root")) return;
const root=document.createElement("div");root.id="virtus-ews-root";
const sh=root.attachShadow({mode:"open"});
const css=document.createElement("style");
css.textContent=`
:host{all:initial;position:fixed;bottom:18px;right:18px;z-index:2147483000;font-family:Inter,Arial,Helvetica,sans-serif;color:#f5ebd6}
*{box-sizing:border-box}
button{font-family:inherit;cursor:pointer}
.launch{width:68px;height:68px;padding:7px;border:1px solid #d5b26a;border-radius:50%;background:radial-gradient(circle at 30% 20%,#0b5b47,#04221e 75%);box-shadow:0 0 0 3px #03261e,0 12px 30px #0008;display:grid;place-items:center;transition:transform .2s,box-shadow .2s}
.launch:hover{transform:translateY(-2px);box-shadow:0 0 0 3px #03261e,0 15px 36px #0009}
.launch img{width:49px;height:53px;object-fit:contain}
.panel{display:none;position:absolute;bottom:85px;right:0;width:min(410px,calc(100vw - 24px));height:min(620px,calc(100dvh - 110px));border:1px solid #c6a25a;border-radius:19px;background:#061b18;box-shadow:0 22px 60px #0009;overflow:hidden;flex-direction:column}
.panel.open{display:flex}
.header{display:flex;align-items:center;gap:11px;padding:15px;background:linear-gradient(120deg,#073e32,#061f1c 70%);color:#edcf8d;border-bottom:1px solid #9b793d;font-size:18px;font-weight:700}
.header-logo{width:40px;height:44px;object-fit:contain}
.brand{display:flex;flex-direction:column;gap:3px;flex:1}
.subtitle{font-size:11px;font-weight:400;color:#d5c5a3;letter-spacing:.4px}
.close{background:transparent;border:0;color:#f4d99c;font-size:25px;padding:2px 6px}
.messages{flex:1;min-height:0;overflow-y:auto;padding:17px 15px;display:flex;flex-direction:column;gap:13px;background:linear-gradient(160deg,#062b24,#071c1a 70%)}
.message{max-width:90%;padding:12px 14px;border-radius:16px;line-height:1.55;font-size:14px;white-space:pre-wrap;overflow-wrap:anywhere;border:1px solid #ffffff17}
.assistant{align-self:flex-start;background:#123e34;color:#f3f1e9;border-top-left-radius:5px}
.user{align-self:flex-end;background:linear-gradient(125deg,#dfc18a,#b99555);color:#1a211c;border-top-right-radius:5px;border-color:#f0d7a2}
.footer{padding:13px 14px;background:#061c19;border-top:1px solid #8b713d}
.form{display:flex;gap:8px}
.input{flex:1;min-width:0;border:1px solid #947c49;border-radius:11px;padding:12px;font-size:14px;background:#092e27;color:#fff;outline:0}
.input::placeholder{color:#b7c3bd}
.send{border:1px solid #d8b76f;border-radius:11px;background:linear-gradient(135deg,#e5c98e,#bb9650);color:#13221b;padding:10px 15px;font-size:14px;font-weight:700}
.send:disabled{opacity:.55;cursor:default}
.continue{display:block;text-align:center;text-decoration:none;background:linear-gradient(130deg,#e6cb93,#b8944d);color:#11251d;border-radius:11px;padding:12px;margin-top:11px;font-weight:700;font-size:14px}
.note{font-size:12px;color:#c7d0c9;margin-top:9px;text-align:center;line-height:1.5}
button:focus-visible,a:focus-visible,input:focus-visible{outline:3px solid #f0ce84;outline-offset:2px}
@media(max-width:480px){:host{bottom:12px;right:12px}.launch{width:59px;height:59px}.launch img{width:44px;height:46px}.panel{bottom:74px;height:min(620px,calc(100dvh - 95px))}}
`;
const launch=document.createElement("button");launch.className="launch";launch.innerHTML="<img src=\"https://virtusaiworld.com/virtus-aurum-emblem.svg\" alt=\"Virtus AI\" />";launch.setAttribute("aria-label","Open Virtus AI chat");
const panel=document.createElement("section");panel.className="panel";panel.setAttribute("role","dialog");panel.setAttribute("aria-label","Ask Virtus AI");
const header=document.createElement("div");header.className="header";header.innerHTML="<img class=\"header-logo\" src=\"https://virtusaiworld.com/virtus-aurum-emblem.svg\" alt=\"\" /><div class=\"brand\"><span>Virtus AI</span><span class=\"subtitle\">Life Coach · Trainer · Mentor</span></div>";
const close=document.createElement("button");close.className="close";close.type="button";close.textContent="×";close.setAttribute("aria-label","Close chat");header.append(close);
const messages=document.createElement("div");messages.className="messages";messages.setAttribute("aria-live","polite");
const footer=document.createElement("div");footer.className="footer";
const form=document.createElement("form");form.className="form";
const input=document.createElement("input");input.className="input";input.placeholder="Ask Virtus AI anything…";input.setAttribute("aria-label","Your message");input.maxLength=1800;
const send=document.createElement("button");send.className="send";send.type="submit";send.textContent="Send";
form.append(input,send);footer.append(form);panel.append(header,messages,footer);sh.append(css,panel,launch);document.body.append(root);
const storageKey="virtus_ews_preview_v1";let state={history:[],token:"",count:0};try{const saved=JSON.parse(localStorage.getItem(storageKey)||"null");if(saved&&Array.isArray(saved.history))state={history:saved.history.slice(-14),token:String(saved.token||""),count:Number(saved.count)||0};}catch{}
function persist(){try{localStorage.setItem(storageKey,JSON.stringify(state));}catch{}}
function add(role,content){const el=document.createElement("div");el.className="message "+role;el.textContent=content;messages.append(el);messages.scrollTop=messages.scrollHeight;return el;}
function handoff(){
 form.style.display="none";
 const info=document.createElement("div");info.className="note";info.textContent="Your seven-question website preview is complete. Continue with Virtus AI. New visitors can register for a trial; existing members can use their accounts.";footer.append(info);
 const link=document.createElement("a");link.className="continue";link.href="https://virtusaiworld.com/login?mode=signup&source=ews-widget";link.target="_blank";link.rel="noopener noreferrer";link.textContent="Continue with Virtus AI";footer.append(link);
 const app=document.createElement("div");app.className="note";app.textContent="You can also install Virtus AI when the app is available.";footer.append(app);
}
if(state.history.length){state.history.forEach(m=>add(m.role,m.content));}else{add("assistant","Welcome. I'm Virtus AI. What would you like to explore today?");}
if(state.count>=7)handoff();
launch.addEventListener("click",()=>{panel.classList.toggle("open");if(panel.classList.contains("open"))input.focus();});
close.addEventListener("click",()=>{panel.classList.remove("open");launch.focus();});
let busy=false;
form.addEventListener("submit",async(e)=>{
 e.preventDefault();const question=input.value.trim();if(!question||busy||state.count>=7)return;
 input.value="";busy=true;send.disabled=true;input.disabled=true;
 const prior=state.history.slice(-12);add("user",question);const waiting=add("assistant","Virtus AI is thinking…");
 try{
 const response=await fetch("https://virtusaiworld.com/api/ews-widget/chat",{method:"POST",mode:"cors",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:question,history:prior,token:state.token})});
 const data=await response.json();if(!response.ok)throw new Error(data.error||"Chat unavailable");
 if(data.limitReached&&!data.reply){waiting.textContent="Your website preview is complete.";state.count=7;persist();handoff();return;}
 waiting.textContent=data.reply||"Please try again.";
 state.history.push({role:"user",content:question},{role:"assistant",content:waiting.textContent});state.history=state.history.slice(-14);state.token=data.token||state.token;state.count=data.count||state.count;persist();
 if(state.count>=7)handoff();
 }catch(err){waiting.textContent=err.message||"Please try again.";input.value=question;}
 finally{busy=false;send.disabled=false;input.disabled=false;}
});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
