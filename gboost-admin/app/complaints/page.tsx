"use client";
import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase, DBComplaint } from "@/lib/supabase";
import clsx from "clsx";

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<DBComplaint[]>([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState<DBComplaint | null>(null);
  const [filter, setFilter]         = useState("all");
  const [resolution, setResolution] = useState("");
  const [toast, setToast]           = useState<{msg:string;type:"success"|"error"}|null>(null);
  const [session, setSession]       = useState<any>(null);

  useEffect(() => {
    const s = localStorage.getItem("gboost_admin_session");
    if (s) setSession(JSON.parse(s));
    fetchComplaints();
    const channel = supabase
      .channel("complaints-changes")
      .on("postgres_changes", {event:"*",schema:"public",table:"complaints"}, fetchComplaints)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("complaints").select("*").order("created_at", {ascending:false});
    if (!error && data) setComplaints(data);
    setLoading(false);
  };

  const showToast = (msg:string, type:"success"|"error"="success") => {
    setToast({msg,type}); setTimeout(()=>setToast(null),3000);
  };

  const updateStatus = async (id:string, status:string, res:string) => {
    if (!res.trim()) { showToast("Qaror/sabab yozing!", "error"); return; }
    const { error } = await supabase
      .from("complaints")
      .update({
        status,
        resolved_by: session?.name || "Admin",
        resolution: res,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) { showToast("Xatolik!", "error"); return; }
    setSelected(null); setResolution("");
    showToast(status==="resolved" ? "✅ Shikoyat hal qilindi!" : "❌ Shikoyat rad etildi.");
    fetchComplaints();
  };

  const startReview = async (id:string) => {
    await supabase.from("complaints")
      .update({ status:"reviewing", updated_at: new Date().toISOString() })
      .eq("id", id);
    showToast("🔍 Ko'rib chiqilmoqda.");
    fetchComplaints();
  };

  const filtered = filter==="all" ? complaints : complaints.filter(c=>c.status===filter);
  const statusMap: Record<string,{label:string;cls:string}> = {
    new:       {label:"🆕 Yangi",        cls:"abadge-red"  },
    reviewing: {label:"🔍 Ko'rilmoqda",  cls:"abadge-gold" },
    resolved:  {label:"✅ Hal qilindi",  cls:"abadge-green"},
    rejected:  {label:"❌ Rad etildi",   cls:"abadge-red"  },
  };
  const typeMap: Record<string,string> = {
    fraud:"🚨 Firibgarlik", incomplete:"⚠️ Bajarilmagan", other:"📋 Boshqa",
  };
  const counts: Record<string,number> = {
    all:       complaints.length,
    new:       complaints.filter(c=>c.status==="new").length,
    reviewing: complaints.filter(c=>c.status==="reviewing").length,
    resolved:  complaints.filter(c=>c.status==="resolved").length,
    rejected:  complaints.filter(c=>c.status==="rejected").length,
  };

  return (
    <AdminLayout>
      {toast && (
        <div className={clsx("fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-white font-semibold text-sm shadow-xl",
          toast.type==="success"?"bg-green":"bg-red")}>{toast.msg}</div>
      )}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white mb-1">⚠️ Shikoyatlar</h1>
        <p className="text-text-gray text-sm">Supabase real-time • Foydalanuvchilardan kelgan shikoyatlar</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {Object.entries(counts).map(([key,count]) => (
          <button key={key} onClick={()=>setFilter(key)}
            className={clsx("text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all flex items-center gap-1.5",
              filter===key?"bg-cyan/20 border-cyan/40 text-cyan":"bg-card border-border text-text-gray hover:text-text-light")}>
            {key==="all"?"Barchasi":key==="new"?"🆕 Yangi":key==="reviewing"?"🔍 Ko'rilmoqda":
             key==="resolved"?"✅ Hal qilindi":"❌ Rad etildi"}
            <span className={clsx("w-5 h-5 rounded-full flex items-center justify-center text-xs font-black",
              filter===key?"bg-cyan text-bg":"bg-border text-text-gray")}>{count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-cyan/30 border-t-cyan rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.length===0 ? (
            <div className="acard text-center py-12 text-text-gray">Shikoyat topilmadi</div>
          ) : filtered.map(c => (
            <div key={c.id} className="acard">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className={statusMap[c.status]?.cls}>{statusMap[c.status]?.label}</span>
                    <span className="abadge-purple">{typeMap[c.type]}</span>
                    <span className="text-text-gray text-xs">{new Date(c.created_at).toLocaleDateString("uz-UZ")}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-white font-bold text-sm">{c.from_user}</span>
                    <span className="text-text-gray text-xs">→ shikoyat →</span>
                    <span className="text-red font-semibold text-sm">{c.against_user}</span>
                  </div>
                  <p className="text-text-gray text-sm line-clamp-2 leading-relaxed">{c.description}</p>
                  {c.resolution && (
                    <div className="mt-2 p-2.5 bg-green/10 border border-green/20 rounded-xl">
                      <p className="text-green text-xs font-semibold">Qaror: {c.resolution}</p>
                      <p className="text-text-gray text-xs">— {c.resolved_by}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap shrink-0">
                  {c.status==="new" && (
                    <button onClick={()=>startReview(c.id)}
                      className="text-xs bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 px-3 py-1.5 rounded-xl font-semibold">
                      🔍 Ko'rib chiqish
                    </button>
                  )}
                  {(c.status==="new"||c.status==="reviewing") && (
                    <button onClick={()=>setSelected(c)}
                      className="text-xs bg-purple/20 border border-purple/30 text-purple hover:bg-purple/30 px-3 py-1.5 rounded-xl font-semibold">
                      Qaror berish
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-white text-lg">⚖️ Qaror Berish</h3>
              <button onClick={()=>{setSelected(null);setResolution("");}} className="text-text-gray hover:text-white text-xl">✕</button>
            </div>
            <div className="bg-bg border border-border rounded-xl p-4 mb-4">
              <div className="flex gap-2 flex-wrap mb-2">
                <span className={statusMap[selected.status]?.cls}>{statusMap[selected.status]?.label}</span>
                <span className="abadge-purple">{typeMap[selected.type]}</span>
              </div>
              <p className="text-white text-sm font-semibold mb-1">{selected.from_user} → {selected.against_user}</p>
              <p className="text-text-gray text-sm leading-relaxed">{selected.description}</p>
            </div>
            <div className="mb-4">
              <label className="text-text-gray text-xs mb-1.5 block">Qaror / Yechim (majburiy)</label>
              <textarea value={resolution} onChange={e=>setResolution(e.target.value)}
                placeholder="Tekshiruv natijasi va qabul qilingan qaror..." rows={3}
                className="ainput resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={()=>updateStatus(selected.id,"resolved",resolution)}
                className="bg-green/15 border border-green/30 text-green hover:bg-green/25 py-3 rounded-xl text-sm font-bold">
                ✅ Hal qilindi
              </button>
              <button onClick={()=>updateStatus(selected.id,"rejected",resolution)}
                className="bg-red/15 border border-red/30 text-red hover:bg-red/25 py-3 rounded-xl text-sm font-bold">
                ❌ Rad etish
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
