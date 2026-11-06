import {requireAdminPage} from "@/lib/admin-auth";
import Link from "next/link";
import CurriculaClient from "./CurriculaClient";
export const metadata={title:"EWS Curriculum Intelligence | Virtus AI"};
export default async function EwsCurriculaAdminPage(){
  await requireAdminPage();
  return <main className="min-h-screen bg-[#0c1412] px-5 py-10 text-[#f9f1e2]">
    <div className="mx-auto max-w-6xl">
      <Link href="/admin/library-manager" className="text-sm text-[#e5ca8c] underline underline-offset-4">Back to Virtus administration</Link>
      <p className="mt-8 text-xs font-bold uppercase tracking-[0.22em] text-[#d7b677]">Enhanced Wellness Solutions · Verified knowledge</p>
      <h1 className="mt-3 font-serif text-3xl sm:text-4xl">Curriculum Intelligence</h1>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-[#c7d2cb]">Map each original EWS leadership module and conscious-mind workbook to its verified library source. Every unit must be reviewed before the curriculum is approved. Nothing in this registry grants organization licences or exposes source material to company administrators.</p>
      <CurriculaClient/>
    </div>
  </main>;
}
