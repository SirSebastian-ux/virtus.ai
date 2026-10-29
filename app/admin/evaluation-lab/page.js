import { requireAdminPage } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-admin";
const roles=[["life_coach","Life Coach"],["trainer","Trainer"],["mentor","Mentor"]];
const dimensions=["Accuracy","Coaching appropriateness","Communication","Practical usefulness","Safety","Context continuity"];
export const dynamic="force-dynamic";
export default async function EvaluationLab(){
 await requireAdminPage();
 const db=createAdminClient();
 const {data,error}=await db.from("virtus_evaluation_results").select("role,dimension,score,created_at").order("created_at",{ascending:false}).limit(2000);
 const results=error?[]:data||[];
 return <main className="min-h-screen bg-[#061b17] text-[#f6e9cc] p-6 md:p-12"><div className="mx-auto max-w-6xl space-y-8">
 <header className="border-b border-[#b89d60]/40 pb-7"><p className="text-xs uppercase tracking-[.3em] text-[#d9b66f]">Virtus AI · Administrator</p><h1 className="mt-3 text-4xl font-semibold">Evaluation Lab</h1><p className="mt-3 max-w-3xl text-[#c4d1c8]">Evidence-based assessment of Life Coach, Trainer, and Mentor. No user conversations or personal details are collected by this dashboard.</p></header>
 <section className="grid gap-4 md:grid-cols-3">{roles.map(([key,name])=>{const items=results.filter(x=>x.role===key);const average=items.length?items.reduce((n,x)=>n+x.score,0)/items.length:null;return <article key={key} className="rounded-2xl border border-[#967c4b]/50 bg-[#0b2a24] p-6"><h2 className="text-xl text-[#eed39b]">{name}</h2><p className="mt-5 text-3xl font-semibold">{average===null?"Not evaluated":(average/5*100).toFixed(1)+"%"}</p><p className="mt-2 text-sm text-[#b6c9be]">{items.length} scored dimensions · provisional rubric result, not a validated success rate</p></article>})}</section>
 <section className="rounded-2xl border border-[#967c4b]/40 bg-[#0b2923] p-6"><h2 className="text-xl text-[#eed39b]">Evaluation dimensions</h2><div className="mt-5 grid gap-3 md:grid-cols-2">{dimensions.map(x=><div key={x} className="rounded-lg bg-[#13372e] p-3">{x}</div>)}</div><p className="mt-5 text-sm text-[#c1d1c6]">Scores require controlled cases, an explicit rubric, human review, and safety-failure tracking before they represent a professional reliability estimate.</p></section>
 <section className="rounded-2xl border border-[#967c4b]/40 p-6"><h2 className="text-xl text-[#eed39b]">Behavioral learning controls</h2><p className="mt-3 text-[#c1d1c6]">Cross-user behavioral learning is disabled. No automatic extraction of personal information, no self-modifying instructions, and no unreviewed behavioral proposals are enabled. Future collection requires informed opt-in, aggregation, and administrator approval.</p><p className="mt-3 text-sm text-[#d9b66f]">Phase 1: evaluation foundation only.</p></section>
 <a className="inline-block text-[#eed39b] underline" href="/admin/library-manager">Knowledge Library Manager</a>
 </div></main>;
}
