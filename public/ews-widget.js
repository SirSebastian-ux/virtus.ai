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
:host{all:initial;position:fixed;bottom:18px;right:18px;z-index:2147483000;font-family:Arial,Helvetica,sans-serif;color:#1b2723}
*{box-sizing:border-box}
button{font-family:inherit;cursor:pointer}
.launch{border:1px solid #d6b369;background:#12382e;color:#f3d594;border-radius:999px;padding:14px 20px;font-size:14px;font-weight:700;box-shadow:0 8px 25px #0003}
.panel{display:none;position:absolute;bottom:65px;right:0;width:min(390px,calc(100vw - 28px));height:min(580px,calc(100dvh - 110px));border:1px solid #caa65d;border-radius:17px;background:#fff;box-shadow:0 14px 44px #0004;overflow:hidden;flex-direction:column}
.panel.open{display:flex}
.header{display:flex;align-items:center;justify-content:space-between;padding:17px 16px;background:#12382e;color:#f5d99d;font-size:16px;font-weight:700}
.close{background:none;border:0;color:white;font-size:23px;padding:0 4px}
.messages{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;background:#faf9f5}
.message{max-width:88%;padding:11px 13px;border-radius:13px;line-height:1.5;font-size:14px;white-space:pre-wrap;overflow-wrap:anywhere}
.assistant{align-self:flex-start;background:#e9eee9;color:#1a3027}
.user{align-self:flex-end;background:#12382e;color:#fff}
.footer{padding:12px;background:#fff;border-top:1px solid #e8e8e8}
.form{display:flex;gap:8px}
.input{flex:1;min-width:0;border:1px solid #c9c9c9;border-radius:9px;padding:11px;font-size:14px}
.send{border:0;border-radius:9px;background:#12382e;color:#fff;padding:10px 13px;font-size:14px}
.send:disabled{opacity:.55;cursor:default}
.continue{display:block;text-align:center;text-decoration:none;background:#12382e;color:#f5d99d;border-radius:9px;padding:12px;margin-top:10px;font-weight:700;font-size:14px}
.note{font-size:12px;color:#657169;margin-top:8px;text-align:center}
button:focus-visible,a:focus-visible,input:focus-visible{outline:3px solid #c9a65d;outline-offset:2px}
@media(max-width:480px){:host{bottom:12px;right:12px}.panel{bottom:60px;height:min(570px,calc(100dvh - 88px))}}
`;
const launch=document.createElement("button");launch.className="launch";launch.textContent="✦ Ask Virtus AI";launch.setAttribute("aria-label","Open Virtus AI chat");
const panel=document.createElement("section");panel.className="panel";panel.setAttribute("role","dialog");panel.setAttribute("aria-label","Ask Virtus AI");
const header=document.createElement("div");header.className="header";header.textContent="Ask Virtus AI";
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
 const info=document.createElement("div");info.className="note";info.textContent="Your seven-question website preview is complete. Continue with Virtus AI for your 3-day trial.";footer.append(info);
 const link=document.createElement("a");link.className="continue";link.href="https://virtusaiworld.com/login?mode=signup";link.target="_blank";link.rel="noopener noreferrer";link.textContent="Register to continue with Virtus AI";footer.append(link);
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
