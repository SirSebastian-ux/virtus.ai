import {createClient} from "@/lib/supabase-server";
import {isAdminUser} from "@/lib/admin-auth";
import Link from "next/link";
export const dynamic="force-dynamic";
export default async function CompanionLayout({children}){
 const db=await createClient();
 const {data:{user}}=await db.auth.getUser();
 if(isAdminUser(user))return children;
 return <main className="virtus-interior min-h-screen p-6"><div className="virtus-interior-shell"><Link href="/" className="virtus-interior-brand"><img className="virtus-interior-brand-emblem" src="/virtus-aurum-emblem.svg" alt="Virtus AI"/><span className="virtus-interior-brand-name">Virtus <span>AI</span></span></Link><section className="virtus-interior-panel p-6"><h1 className="virtus-interior-title">Virtus AI Companionship</h1><p>Discover meaningful conversations with AI and human companions. The marketplace is currently in controlled testing. Public bookings and payments are not yet available.</p><div className="mt-6 flex flex-wrap gap-3">{!user&&<Link href="/login?next=%2Fcompanion" className="virtus-gold-button px-5 py-3">Sign in to Virtus AI</Link>}<Link href="/" className="virtus-outline-button">Return to Virtus AI</Link></div></section></div></main>;
}
