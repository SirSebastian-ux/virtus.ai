import Link from "next/link";
import { ORGANIZATION_PLAN } from "@/lib/organizational-mentorship";

export const metadata = {
 title:"Virtus AI Organizations | Leadership Development & Private Mentorship",
 description:"Confidential employee mentorship and leadership development, with organizational administration and privacy-safe reporting."
};
const benefits=[
 {number:"01",title:"A private mentor for every employee",copy:"A confidential space to examine decisions, develop self-awareness, practice communication and strengthen personal responsibility."},
 {number:"02",title:"Leadership that becomes practice",copy:"Structured leadership training combines executive coaching, CBT-informed cognitive techniques, NLP-informed communication practice and guided exercises to turn insight into consistent workplace behavior."},
 {number:"03",title:"Organizational development intelligence",copy:"Equip HR and leadership teams with employee enrollment, training engagement, development indicators and executive summaries that inform targeted learning investments."}
];
const steps=[
 ["Register","Create your organization and verify ownership of its corporate email domain."],
 ["Invite","Allocate licensed seats and send secure invitations to eligible employees."],
 ["Develop","Employees enter their own private mentorship and guided leadership learning environment."],
 ["Understand","Review training participation, learning progress and eligible development trends to identify organizational strengths and priorities."]
];
export default function OrganizationsPage(){
 const price="9.99";
 return <main className="org-landing">
 <div className="org-shell">
 <header className="org-header"><Link href="/" className="org-brand"><span className="org-brand-mark">✦</span><span><strong>Virtus AI</strong><small>BY ENHANCED WELLNESS SOLUTIONS</small></span></Link><Link href="/organizations/workspace" className="org-header-link">Organization workspace <span aria-hidden="true">↗</span></Link></header>
 <section className="org-hero">
  <p className="org-kicker">VIRTUS AI <span>FOR ORGANIZATIONS</span></p>
  <div className="org-ornament" aria-hidden="true">✦</div>
  <h1>Develop the individual.<br/><em>Strengthen the organization.</em></h1>
  <p className="org-intro">Your people carry the decisions, conversations and pressures that shape your organization every day. Give them a confidential space to build awareness, emotional discipline and leadership capability.</p>
  <div className="org-hero-actions"><Link className="org-gold-button" href="/organizations/workspace">Enter organization workspace <span aria-hidden="true">→</span></Link><a className="org-outline-button" href="#how-it-works">Explore how it works</a></div>
  <p className="org-trust">Private employee mentorship · Structured leadership learning · Organizational development insights</p>
 </section>
 <section className="org-section" aria-labelledby="org-benefits"><p className="org-kicker">THE DEVELOPMENT MODEL</p><h2 id="org-benefits">Invest in the people behind the performance.</h2><p className="org-section-lead">A development environment designed around conscious decisions, practical exercises and sustainable professional growth.</p>
  <div className="org-card-grid">{benefits.map(b=><article className="org-card" key={b.number}><span className="org-card-number">{b.number}</span><h3>{b.title}</h3><p>{b.copy}</p></article>)}</div>
 </section>
 <section className="org-section org-process" id="how-it-works"><p className="org-kicker">A CLEAR PATH TO ENROLLMENT</p><h2>From enrollment to meaningful development.</h2><div className="org-step-grid">{steps.map(([title,copy],i)=><div className="org-step" key={title}><span>{String(i+1).padStart(2,"0")}</span><h3>{title}</h3><p>{copy}</p></div>)}</div></section>
 <section className="org-preview" id="platform-preview"><div className="org-preview-heading"><div><p className="org-kicker">INSIDE THE ORGANIZATIONAL PLATFORM</p><h2>Development intelligence for confident leadership decisions.</h2><p>Explore an executive view of learning participation, capability indicators and development priorities. The figures below are illustrative demonstration data.</p></div><span className="org-demo-label">ILLUSTRATIVE PREVIEW</span></div><div className="org-preview-frame"><div className="org-preview-top"><span>✦ Virtus AI <b> / Organizational Intelligence</b></span><span>DEMO COMPANY · 30 DAYS</span></div><div className="org-preview-stats"><div><small>Licensed employees</small><strong>50</strong></div><div><small>Active learners</small><strong>42</strong></div><div><small>Structured training</small><strong>186 h</strong></div><div><small>Module completion</small><strong>72%</strong></div></div><div className="org-preview-detail"><div className="org-preview-bars"><h3>Development indicators</h3><p>Illustrative group exercise results · not psychological diagnoses</p>{[["Awareness",78],["Metacognition",64],["Emotional intelligence",71],["Critical thinking",82],["Communication",67],["Leadership practice",74]].map(([name,value])=><div className="org-preview-bar" key={name}><div><span>{name}</span><b>{value}%</b></div><div className="org-preview-track"><span style={{width:value+"%"}}/></div></div>)}</div><div className="org-preview-report"><span className="org-kicker">EXECUTIVE LEARNING SUMMARY</span><h3>Development priorities</h3><p>Structured exercises suggest comparatively stronger performance in critical thinking and awareness. Future training can prioritize metacognitive reflection and communication scenarios.</p></div></div></div><div className="org-preview-caption">Illustrative reporting preview based on demonstration data.</div></section>
 <section className="org-proposal" aria-labelledby="org-proposal-heading">
 <div className="org-proposal-intro"><p className="org-kicker">AN ORGANIZATIONAL DEVELOPMENT PROPOSAL</p><h2 id="org-proposal-heading">A considered investment in your people.</h2><p>Build a sustained culture of professional development. Virtus AI Organizations brings together personalized AI mentorship, executive coaching methods, practical leadership training and measurable learning engagement in one environment.</p></div>
 <div className="org-proposal-grid">
 <article className="org-proposal-benefits"><h3>Included in your organization</h3><ul><li>Private AI mentorship for enrolled employees</li><li>Applied leadership development and executive coaching exercises</li><li>CBT-informed thinking practices, NLP-informed communication techniques and metacognitive training</li><li>Secure invitations and licensed-seat administration</li><li>Executive reporting on eligible development trends, learning participation and training priorities</li></ul><p className="org-proposal-note">A structured approach to awareness, emotional intelligence, critical thinking, communication and leadership behavior.</p></article>
 <article className="org-proposal-quote"><div className="org-quote-head"><span>PROPOSED MONTHLY INVESTMENT</span><span>USD</span></div><div className="org-quote-line"><div><strong>Employee mentorship license</strong><small>Per licensed employee, billed monthly</small></div><strong className="org-quote-amount">${price}</strong></div><div className="org-quote-line"><div><strong>Organizational onboarding</strong><small>Company registration and domain verification</small></div><span className="org-quote-pending">Included</span></div><p className="org-quote-footnote">Organizational platform: $199/month, plus $9.99/month per licensed employee.</p><Link href="/organizations/dashboard" className="org-gold-button">Explore organization setup <span aria-hidden="true">→</span></Link></article>
 </div></section>
  <section className="org-privacy"><span aria-hidden="true">✧</span><div><h2>Build capability. Measure participation. Guide development.</h2><p>Give your leadership team a clearer view of learning engagement, development patterns and organizational training priorities—supported by practical coaching and structured exercises.</p><p className="org-privacy-disclosure">Individual mentorship conversations and personal reflections remain confidential. Organizational reporting follows applicable privacy thresholds.</p></div></section>
 <footer className="org-footer"><span>Virtus AI · Enhanced Wellness Solutions</span><Link href="/organizations/dashboard">Organization workspace →</Link></footer>
 </div>
 <style>{`
 .org-privacy-disclosure{font-size:12px;opacity:.72;margin-top:20px}.org-landing{min-height:100vh;color:#f6edd6;background:radial-gradient(ellipse at 52% 8%,#0c4d3c 0%,#082c26 33%,#041713 70%,#030c0b 100%);font-family:inherit}
 .org-shell{max-width:1240px;margin:auto;padding:0 30px}.org-header{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:25px 0;border-bottom:1px solid #c5a26165}.org-brand{display:flex;align-items:center;gap:14px;color:#f8dd9b;text-decoration:none}.org-brand-mark{display:grid;place-items:center;width:54px;height:54px;border:1px solid #e4c17c;border-radius:15px;background:linear-gradient(145deg,#0a4939,#05211d);font-size:27px;box-shadow:0 0 20px #c9a25835}.org-brand strong{font:30px Georgia,serif;letter-spacing:.08em}.org-brand small{display:block;font-size:9px;letter-spacing:.15em;color:#ddc28b;margin-top:5px}.org-header-link,.org-footer a{color:#e9ca87;text-decoration:none;font-weight:650}.org-header-link:hover,.org-footer a:hover{text-decoration:underline}.org-hero{text-align:center;padding:105px 0 100px}.org-kicker{color:#e9c27c;letter-spacing:.23em;font-size:12px;font-weight:800}.org-kicker span{color:#fff1ce}.org-ornament{font-size:26px;color:#f5d28a;margin:20px}.org-hero h1{font:normal clamp(42px,6vw,82px)/1.12 Georgia,serif;letter-spacing:-.035em;margin:18px auto 26px;max-width:1050px;text-shadow:0 4px 28px #d8af4633}.org-hero h1 em{font-style:normal;background:linear-gradient(105deg,#fff4ce,#d8a74e,#ffe8a3,#b9863a);background-clip:text;-webkit-background-clip:text;color:transparent}.org-intro{font-size:clamp(17px,2vw,21px);line-height:1.75;color:#d1d6ca;max-width:790px;margin:auto}.org-hero-actions{display:flex;justify-content:center;gap:16px;flex-wrap:wrap;margin:36px 0 28px}.org-gold-button,.org-outline-button{display:inline-flex;justify-content:center;align-items:center;gap:16px;border-radius:13px;padding:17px 25px;text-decoration:none;font-weight:800;min-height:55px;transition:transform .22s,box-shadow .22s,filter .22s}.org-gold-button{position:relative;overflow:hidden;color:#1a160c;background:linear-gradient(125deg,#f8e3a3 0%,#d5a957 42%,#ffe4a0 65%,#b78a3f 100%);border:1px solid #ffdf9a;box-shadow:inset 0 2px 1px #fff7d6,0 7px 25px #0006,0 0 20px #d5a24a33}.org-gold-button:before{content:"";position:absolute;top:-60%;bottom:-60%;left:-65%;width:30%;transform:skewX(-25deg);background:linear-gradient(90deg,transparent,#fff9d8b0,transparent);transition:left .65s;pointer-events:none}.org-gold-button:hover:before{left:140%}.org-gold-button:hover,.org-outline-button:hover{transform:translateY(-3px);box-shadow:0 8px 35px #e4b66077;filter:brightness(1.07)}.org-outline-button{color:#f6dda3;border:1px solid #b99b5f;background:#0b3028}.org-trust{font-size:13px;color:#b7c6b7;line-height:1.7}.org-section{padding:76px 0;border-top:1px solid #bb9b5a50}.org-section h2,.org-price-panel h2,.org-privacy h2{font:normal clamp(30px,4vw,48px)/1.2 Georgia,serif;margin:12px 0 20px;color:#f7e8c7}.org-section-lead{color:#c4cfc2;max-width:710px;line-height:1.75}.org-card-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin-top:32px}.org-card,.org-step{border:1px solid #c7a36287;border-radius:20px;background:linear-gradient(145deg,#0d4536,#06231e);padding:30px;box-shadow:inset 0 1px 0 #f9dfaa22,0 16px 36px #0004}.org-card-number{font:28px Georgia,serif;color:#eac780}.org-card h3,.org-step h3{font:normal 25px Georgia,serif;color:#f5dcaa;margin:22px 0 12px}.org-card p,.org-step p,.org-price-panel p,.org-privacy p{color:#c9d0c4;line-height:1.75}.org-step-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:30px}.org-step{padding:22px}.org-step>span{color:#e5c27d;font-weight:800;letter-spacing:.1em}.org-step h3{margin:15px 0 8px}.org-price-panel{display:grid;grid-template-columns:1.2fr 1fr;gap:40px;align-items:center;margin:45px 0;padding:45px;border:1px solid #e4bc72;border-radius:24px;background:linear-gradient(120deg,#0d4637,#05231e);box-shadow:0 15px 55px #0006,inset 0 1px 0 #f7d99950}.org-price-block{padding:30px;border-radius:18px;border:1px solid #c2a067;background:#082d26}.org-price-block>div{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap}.org-price-block strong{font:58px Georgia,serif;color:#f7d58e}.org-price-block span{color:#d2c4a8}.org-price-block .org-gold-button{margin-top:12px}.org-privacy{display:flex;gap:28px;align-items:flex-start;max-width:900px;margin:85px auto}.org-privacy>span{font-size:48px;color:#e3bd73}.org-footer{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;border-top:1px solid #bfa26370;padding:30px 0 45px;color:#b9c6b7}.org-landing a:focus-visible{outline:3px solid #ffe4a5;outline-offset:4px}
 @media(max-width:800px){.org-proposal-grid,.org-preview-detail{grid-template-columns:1fr}.org-preview-stats{grid-template-columns:repeat(2,1fr)}.org-card-grid,.org-step-grid{grid-template-columns:1fr 1fr}.org-price-panel{grid-template-columns:1fr}.org-hero{padding:75px 0}.org-shell{padding:0 20px}}
 @media(max-width:540px){.org-proposal-benefits,.org-proposal-quote{padding:22px}.org-quote-line{align-items:flex-start}.org-card-grid,.org-step-grid{grid-template-columns:1fr}.org-header-link{font-size:12px}.org-brand strong{font-size:23px}.org-brand-mark{width:43px;height:43px}.org-hero{padding:62px 0}.org-price-panel{padding:23px}.org-privacy{margin:55px 0}.org-hero-actions>*{width:100%}}

 .org-preview{margin:58px 0 88px;padding:42px;border:1px solid #d5b5739c;border-radius:26px;background:linear-gradient(145deg,#0b3c30,#06231e 65%,#041a17);box-shadow:0 20px 65px #0007,inset 0 1px 0 #f6dba944}
 .org-preview-heading{display:flex;align-items:end;justify-content:space-between;gap:22px;margin-bottom:28px}
 .org-preview-heading h2,.org-proposal-intro h2{font:normal clamp(31px,4vw,49px)/1.16 Georgia,serif;color:#f7e7c5;margin:12px 0}
 .org-preview-heading p:not(.org-kicker),.org-proposal-intro>p:last-child{color:#c9d5ca;line-height:1.7;max-width:690px}
 .org-demo-label{flex-shrink:0;border:1px solid #d4b27177;border-radius:99px;padding:10px 15px;color:#ebce91;background:#0c3129;font-size:11px;font-weight:800;letter-spacing:.13em}
 .org-preview-frame{border:1px solid #cda96b75;border-radius:20px;overflow:hidden;background:linear-gradient(160deg,#062b24,#071b19);box-shadow:0 18px 40px #0005}
 .org-preview-top{display:flex;justify-content:space-between;gap:16px;align-items:center;padding:20px 25px;background:linear-gradient(110deg,#104d3b,#092e28);border-bottom:1px solid #c6a66b60;color:#f7dba2;font-size:13px;letter-spacing:.04em}
 .org-preview-top b{font-weight:500;color:#d1ded1}.org-preview-top>span:last-child{font-size:11px;color:#d4c5a1;letter-spacing:.1em}
 .org-preview-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;padding:23px}
 .org-preview-stats>div{display:flex;flex-direction:column;gap:12px;padding:22px;border:1px solid #c2a36b70;border-radius:15px;background:linear-gradient(145deg,#0b4033,#082920)}
 .org-preview-stats small{color:#b9cdbf;font-size:13px}.org-preview-stats strong{font:normal 36px Georgia,serif;color:#f5d58d}
 .org-preview-detail{display:grid;grid-template-columns:1.25fr 1fr;gap:20px;padding:0 23px 23px}
 .org-preview-bars,.org-preview-report{padding:27px;border:1px solid #b99c636e;border-radius:17px;background:#092820}
 .org-preview-bars h3,.org-preview-report h3{font:normal 27px Georgia,serif;color:#f7e2b4;margin:0 0 8px}
 .org-preview-bars>p,.org-preview-report>p{color:#bfcdc2;line-height:1.7;margin:0 0 23px}
 .org-preview-bar{margin:19px 0}.org-preview-bar>div:first-child{display:flex;justify-content:space-between;gap:12px;color:#e7e9d7;font-size:14px;margin-bottom:9px}.org-preview-bar b{color:#f6d18a}
 .org-preview-track{height:9px;border-radius:20px;background:#173c32;overflow:hidden;box-shadow:inset 0 1px 4px #0009}
 .org-preview-track>span{display:block;height:100%;border-radius:20px;background:linear-gradient(90deg,#9a7234,#eac87e,#fff1b7);box-shadow:0 0 12px #f4cb70aa}
 .org-preview-report{display:flex;flex-direction:column;justify-content:center;background:radial-gradient(ellipse at top,#164737,#08241f 75%)}
 .org-preview-report .org-kicker{font-size:11px}.org-preview-protection{margin-top:18px;padding:18px;border:1px solid #d4b16d66;border-radius:12px;color:#eed6a4;line-height:1.6;background:#0d392c}
 .org-preview-caption{padding:17px 5px 0;color:#aebfaf;font-size:12px;line-height:1.7}
 .org-proposal{padding:62px 0 82px;border-top:1px solid #c3a05f55}
 .org-proposal-intro{max-width:790px;margin-bottom:28px}
 .org-proposal-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px}
 .org-proposal-benefits,.org-proposal-quote{border:1px solid #d4ae6e8c;border-radius:22px;padding:34px;background:linear-gradient(145deg,#0e4435,#06251f);box-shadow:inset 0 1px 0 #f5dca838,0 20px 40px #0004}
 .org-proposal-benefits h3{font:normal 29px Georgia,serif;color:#f7dfa9;margin:0 0 23px}
 .org-proposal-benefits ul{list-style:none;margin:0;padding:0}
 .org-proposal-benefits li{position:relative;padding:0 0 17px 28px;margin-bottom:14px;border-bottom:1px solid #b49c6250;color:#e0e9db;line-height:1.5}
 .org-proposal-benefits li:before{content:"✦";position:absolute;left:0;color:#e9c580}
 .org-proposal-note,.org-quote-footnote{font-size:12px;line-height:1.75;color:#b8cbbd;margin:20px 0 0}
 .org-proposal-quote{background:linear-gradient(145deg,#123e31,#06221d)}
 .org-quote-head{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid #c5a46a77;padding-bottom:18px;font-size:11px;font-weight:800;letter-spacing:.15em;color:#f1d39a}
 .org-quote-line{display:flex;justify-content:space-between;align-items:center;gap:18px;padding:23px 0;border-bottom:1px solid #c5a46a50}
 .org-quote-line>div{display:flex;flex-direction:column;gap:7px}.org-quote-line strong{color:#f6e4bb}.org-quote-line small{color:#bacfc0;font-size:12px;line-height:1.5}
 .org-quote-line .org-quote-amount{font:normal 32px Georgia,serif;color:#f9d78b;white-space:nowrap}
 .org-quote-pending{max-width:170px;text-align:right;font-size:12px;color:#c9d3c2;line-height:1.5}
 .org-proposal-quote .org-gold-button{margin-top:24px}
 @media(max-width:800px){.org-proposal-grid,.org-preview-detail{grid-template-columns:1fr}.org-preview-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.org-preview-heading{align-items:start;flex-direction:column}.org-preview{padding:23px}}
 @media(max-width:540px){.org-preview{padding:16px}.org-preview-stats{gap:9px;padding:12px}.org-preview-stats>div{padding:15px}.org-preview-stats strong{font-size:27px}.org-preview-detail{padding:0 12px 12px}.org-preview-bars,.org-preview-report{padding:19px}.org-preview-top{padding:16px;flex-direction:column;align-items:flex-start}.org-proposal-benefits,.org-proposal-quote{padding:22px}}

/* Compact organizational presentation: preserve brand palette and structure. */
.org-shell{max-width:1120px;padding:0 20px}
.org-header{padding:12px 0;gap:12px}
.org-brand{gap:9px}.org-brand-mark{width:34px;height:34px;border-radius:9px;font-size:17px}
.org-brand strong{font-size:20px}.org-brand small{font-size:8px;margin-top:2px}
.org-header-link,.org-footer a{font-size:12px}
.org-hero{padding:45px 0 42px}.org-kicker{font-size:10px;letter-spacing:.16em}
.org-ornament{font-size:16px;margin:9px}
.org-hero h1{font-size:clamp(30px,4vw,46px);line-height:1.14;margin:10px auto 14px;max-width:780px}
.org-intro{font-size:clamp(14px,1.4vw,16px);line-height:1.55;max-width:670px}
.org-hero-actions{gap:10px;margin:20px 0 14px}
.org-gold-button,.org-outline-button{font-size:12px;gap:8px;border-radius:9px;padding:9px 15px;min-height:38px}
.org-trust{font-size:11px!important;line-height:1.5!important}
.org-section{padding-top:34px!important;padding-bottom:36px!important}
.org-section h2,.org-preview h2,.org-proposal h2,.org-privacy h2{font-size:clamp(23px,2.6vw,32px)!important;line-height:1.2!important}
.org-section-lead{font-size:13px!important;line-height:1.5!important}
.org-card-grid,.org-step-grid{gap:12px!important}
.org-card,.org-step{padding:18px!important;border-radius:12px!important}
.org-card h3,.org-step h3{font-size:17px!important;line-height:1.3!important;margin:8px 0!important}
.org-card p,.org-step p{font-size:12px!important;line-height:1.55!important}
.org-card-number{font-size:12px!important}
.org-preview{padding:24px!important;border-radius:15px!important;margin-top:22px!important;margin-bottom:24px!important}
.org-preview-heading{gap:12px!important;margin-bottom:16px!important}
.org-preview-heading p{font-size:12px!important;line-height:1.55!important}
.org-preview-frame{border-radius:12px!important}
.org-preview-top{padding:10px 15px!important;font-size:11px!important}
.org-preview-stats{gap:9px!important;padding:12px!important}
.org-preview-stats>div{padding:12px!important;border-radius:9px!important}
.org-preview-stats strong{font-size:24px!important}
.org-preview-stats small{font-size:11px!important}
.org-preview-detail{gap:10px!important;padding:0 12px 12px!important}
.org-preview-bars,.org-preview-report{padding:15px!important;border-radius:10px!important}
.org-preview-bars h3,.org-preview-report h3{font-size:17px!important}
.org-preview-bars p,.org-preview-report p{font-size:12px!important;line-height:1.5!important}
.org-preview-bar{margin-top:9px!important;font-size:11px!important}
.org-preview-caption{padding-top:8px;font-size:11px}
.org-proposal{padding:35px 0 40px!important}
.org-proposal-intro{margin-bottom:17px}
.org-proposal-intro>p{font-size:13px!important;line-height:1.55!important}
.org-proposal-grid{gap:12px}
.org-proposal-benefits,.org-proposal-quote{padding:18px!important;border-radius:12px!important}
.org-proposal-benefits h3{font-size:20px;margin-bottom:12px}
.org-proposal-benefits li{font-size:12px;line-height:1.45;padding:0 0 9px 19px;margin-bottom:8px}
.org-quote-head{padding-bottom:10px;font-size:10px}
.org-quote-line{padding:12px 0;gap:10px}
.org-quote-line strong{font-size:13px}
.org-quote-line .org-quote-amount{font-size:23px}
.org-quote-line small,.org-quote-pending{font-size:11px}
.org-proposal-note,.org-quote-footnote{margin-top:11px;line-height:1.5}
.org-proposal-quote .org-gold-button{margin-top:14px}
.org-privacy{padding:20px!important;gap:14px!important;margin:20px 0!important}
.org-privacy p{font-size:12px!important;line-height:1.5!important}
.org-privacy-disclosure{margin-top:9px}
.org-footer{padding:18px 0!important;font-size:11px}
@media(max-width:800px){.org-card-grid{grid-template-columns:1fr!important}.org-step-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.org-proposal-grid,.org-preview-detail{grid-template-columns:1fr!important}}
@media(max-width:540px){.org-shell{padding:0 14px}.org-hero{padding:30px 0}.org-hero h1{font-size:30px}.org-step-grid{grid-template-columns:1fr!important}.org-preview{padding:12px!important}.org-preview-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.org-brand strong{font-size:17px}.org-header-link{font-size:11px}}

 @media(prefers-reduced-motion:reduce){.org-gold-button,.org-gold-button:before,.org-outline-button{transition:none}}
 `}</style>
 </main>;
}
