"use client";
const input={width:68,textAlign:"center",padding:"11px 6px",border:"1px solid #bd9a58",borderRadius:8,background:"#072b23",color:"#fff4dc",fontSize:16,fontWeight:700,appearance:"textfield"};
const button={width:42,height:42,border:"1px solid #e4c483",borderRadius:10,background:"linear-gradient(140deg,#17493b,#0a3027)",color:"#f9dfa8",fontSize:22,fontWeight:600,cursor:"pointer"};
export default function LicenseQuantity({value,onChange,min=1,max=10000,id,label}){
 const change=v=>{if(Number.isSafeInteger(v)&&v>=min&&v<=max)onChange(v)};
 return <div style={{display:"inline-flex",gap:10,alignItems:"center",flexWrap:"nowrap"}} aria-label={label||"Number of employee licenses"}>
  <button type="button" style={{...button,opacity:value<=min?.42:1}} onClick={()=>change(value-1)} disabled={value<=min} aria-label="Remove one license">-</button>
  <input id={id} aria-label={label||"Number of licenses"} inputMode="numeric" pattern="[0-9]*" type="text" style={input} value={value} onChange={e=>{if(/^[0-9]{1,5}$/.test(e.target.value))change(Number(e.target.value))}} />
  <button type="button" style={{...button,opacity:value>=max?.42:1}} onClick={()=>change(value+1)} disabled={value>=max} aria-label="Add one license">+</button>
 </div>;
}
