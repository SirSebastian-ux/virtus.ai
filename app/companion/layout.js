import {createClient} from "@/lib/supabase-server";
import Link from "next/link";
export const dynamic="force-dynamic";
export default async function CompanionLayout({children}){
 const db=await createClient();const {data:{user},error}=await db.auth.getUser();
 if(!error&&user&&!user.is_anonymous&&user.email_confirmed_at)return children;
 return <main className="virtus-interior min-h-screen p-6"><div className="virtus-interior-shell"><Link href="/" className="virtus-interior-brand"><img className="virtus-interior-brand-emblem" src="/virtus-aurum-emblem.svg" alt="Virtus AI"/><span className="virtus-interior-brand-name">Virtus <span>AI</span></span></Link><section className="virtus-interior-panel p-6"><h1 className="virtus-interior-title">Virtus AI Companionship</h1><p>Discover AI and human companionship. Create a free account to explore profiles or register as a companion. Payments are not enabled.</p><div className="mt-6 flex flex-wrap gap-3"><Link href="/login?mode=signup&next=%2Fcompanion" className="virtus-gold-button px-5 py-3">Create free account</Link><Link href="/login?next=%2Fcompanion" className="virtus-outline-button">Sign in</Link><Link href="/" className="virtus-outline-button">Return to Virtus AI</Link></div></section></div></main>;
}
