import Link from "next/link";
import { ORGANIZATION_PLAN } from "@/lib/organizational-mentorship";

const features = [
  ["Private AI mentorship", "Each employee receives a personal coaching space. Employers cannot read individual conversations."],
  ["Leadership Architecture", "Ten leadership modules with practical reflection and application exercises."],
  ["Architecture of the Conscious Mind", "Eight workbook volumes integrated into guided learning journeys."],
  ["Organization administration", "Corporate invitations, seat allocation and aggregate progress reporting are being prepared."],
];

export const metadata = {
  title: "Virtus AI for Organizations",
  description: "Private AI mentorship and structured leadership development for organizations.",
};

export default function OrganizationsPage() {
  return (
    <main style={{minHeight:"100vh",background:"#090a09",color:"#f6eedb",padding:"min(9vw,90px) 6vw",fontFamily:"inherit"}}>
      <div style={{maxWidth:1100,margin:"auto"}}>
        <Link href="/" style={{color:"#d9b777",textDecoration:"none"}}>← Virtus AI</Link>
        <p style={{marginTop:72,letterSpacing:4,color:"#d9b777",fontSize:12,textTransform:"uppercase"}}>Virtus AI · Organizations</p>
        <h1 style={{fontSize:"clamp(38px,6vw,78px)",lineHeight:1.07,letterSpacing:"-0.045em",maxWidth:850,margin:"20px 0"}}>Develop the individual.<br/>Strengthen the organization.</h1>
        <p style={{maxWidth:690,color:"#bdb9af",fontSize:19,lineHeight:1.7}}>Confidential AI mentorship, conscious leadership development, and practical learning programs for teams.</p>
        <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:18,marginTop:58}}>
          {features.map(([title,description])=><article key={title} style={{border:"1px solid #4b3d25",borderRadius:18,padding:27,background:"#141411"}}>
            <h2 style={{fontSize:20,color:"#e5c484"}}>{title}</h2>
            <p style={{lineHeight:1.65,color:"#bdb9af"}}>{description}</p>
          </article>)}
        </section>
        <section style={{borderTop:"1px solid #4b3d25",marginTop:65,paddingTop:35}}>
          <p style={{color:"#d9b777",fontSize:13,letterSpacing:2,textTransform:"uppercase"}}>Planned organizational membership</p>
          <p style={{fontSize:38,margin:"12px 0"}}>${(ORGANIZATION_PLAN.monthlySeatPriceCents/100).toFixed(2)} <span style={{fontSize:16,color:"#bdb9af"}}>/ active member / month</span></p>
          <p style={{color:"#bdb9af",maxWidth:650}}>Enrollment and payments are not yet open. No payment will be collected from this page until secure organizational billing and access controls are verified.</p>
        </section>
      </div>
    </main>
  );
}
