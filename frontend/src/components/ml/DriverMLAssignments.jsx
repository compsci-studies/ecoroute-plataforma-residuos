import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, MapPin, Weight, Truck, Calendar, RefreshCw,
  CheckCircle, Clock, AlertTriangle, Loader2, Route, CheckCheck,
} from "lucide-react";
import useMLScheduleStore from "../../stores/useMLScheduleStore";
import TruckLoader from "../shared/TruckLoader";

const WASTE_COLORS = {
  low:      { bg: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  medium:   { bg: "bg-amber-50",    text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-500" },
  high:     { bg: "bg-orange-50",   text: "text-orange-700",  border: "border-orange-200",   dot: "bg-orange-500" },
  critical: { bg: "bg-red-50",      text: "text-red-700",     border: "border-red-200",      dot: "bg-red-500" },
  none:     { bg: "bg-gray-50",     text: "text-gray-600",    border: "border-gray-200",     dot: "bg-gray-400" },
};

const STATUS_CONFIG = {
  confirmed:  { bg: "bg-emerald-500", text: "text-white", Icon: CheckCircle, label: "Confirmada" },
  completed:  { bg: "bg-blue-500",    text: "text-white", Icon: CheckCheck,  label: "Concluída" },
  draft:      { bg: "bg-amber-500",   text: "text-white", Icon: Clock,       label: "Rascunho" },
  pending:    { bg: "bg-blue-500",    text: "text-white", Icon: Clock,       label: "Pendente" },
};

const DAY_NAME_LABELS = {
  Monday: "segunda-feira",
  Tuesday: "terca-feira",
  Wednesday: "quarta-feira",
  Thursday: "quinta-feira",
  Friday: "sexta-feira",
  Saturday: "sabado",
  Sunday: "domingo",
};

const AREA_TYPE_LABELS = {
  residential: "residencial",
  commercial: "comercial",
  industrial: "industrial",
  mixed: "mista",
};

const WASTE_CATEGORY_LABELS = {
  low: "baixo",
  medium: "médio",
  high: "alto",
  critical: "crítico",
  none: "sem previsão",
};

const DriverMLAssignments = () => {
  const navigate = useNavigate();
  const { driverScheduleData, loading, error, fetchDriverAssignments, completeAssignment } = useMLScheduleStore();
  const [activeDay, setActiveDay] = useState("today");
  const [completing, setCompleting] = useState(null); // area name being completed
  const [confirmArea, setConfirmArea] = useState(null); // area to confirm completion
  const [actualWasteKg, setActualWasteKg] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => { fetchDriverAssignments(); }, [fetchDriverAssignments]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const todayData = driverScheduleData?.today;
  const tomorrowData = driverScheduleData?.tomorrow;
  const currentData = activeDay === "today" ? todayData : tomorrowData;
  const assignments = currentData?.assignments || [];

  const todayCount = todayData?.assignments?.length || 0;
  const tomorrowCount = tomorrowData?.assignments?.length || 0;

  const todayLabel = new Date().toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowLabel = tomorrowDate.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });

  const statusCfg = STATUS_CONFIG[currentData?.status] || STATUS_CONFIG.pending;
  const currentDayName = DAY_NAME_LABELS[currentData?.dayName] || currentData?.dayName || (activeDay === "today" ? "hoje" : "amanhã");

  const handleComplete = async (area) => {
    const measuredKg = Number(actualWasteKg);
    if (!Number.isFinite(measuredKg) || measuredKg < 0) {
      setToast({ type: "error", message: "Informe o resíduo coletado em kg" });
      return;
    }
    setConfirmArea(null);
    setCompleting(area);
    const result = await completeAssignment(currentData.scheduleId, area, measuredKg);
    setCompleting(null);
    if (result) {
      setActualWasteKg("");
      setToast({ type: "success", message: result.message || `${area} marcada como concluída.` });
    } else {
      setToast({ type: "error", message: "Não foi possível concluir a area" });
    }
  };

  return (
    <div className="min-h-screen bg-brand-surface-warm pb-24">
      <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-linear-to-br from-primary to-brand-primary-hover px-5 sm:px-8 pt-8 pb-10 sm:rounded-b-3xl">
        <button onClick={() => navigate("/driver-dashboard")} className="flex items-center gap-2 text-white/70 hover:text-white mb-4 transition">
          <ArrowLeft size={18} /> Voltar
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Agenda de coleta</h1>
            <p className="text-sm text-white/50 mt-0.5">Áreas de coleta atribuídas ao coletor</p>
          </div>
          <button
            onClick={fetchDriverAssignments}
            disabled={loading}
            className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-white/25 disabled:opacity-40 transition"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="px-5 sm:px-8 -mt-5 space-y-4 max-w-2xl">
        {/* Day Toggle */}
        <div className="flex gap-1 bg-white rounded-2xl shadow-sm border border-primary/8 p-1.5">
          {[
            { key: "today", label: todayLabel, count: todayCount, sub: "Hoje" },
            { key: "tomorrow", label: tomorrowLabel, count: tomorrowCount, sub: "Amanhã" },
          ].map((d) => (
            <button
              key={d.key}
              onClick={() => setActiveDay(d.key)}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                activeDay === d.key
                  ? "bg-primary text-white shadow-md"
                  : "text-primary/50 hover:text-primary/70 hover:bg-primary/5"
              }`}
            >
              <span className="block text-[10px] font-medium opacity-70 uppercase tracking-wider mb-0.5">{d.sub}</span>
              <span className="text-xs">{d.label}</span>
              {d.count > 0 && (
                <span className={`ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                  activeDay === d.key ? "bg-white/20 text-white" : "bg-primary/10 text-primary/60"
                }`}>
                  {d.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle size={16} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && !completing && (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-sm">
            <TruckLoader text="Sincronizando atribuições..." />
          </div>
        )}

        {/* Schedule Status Bar */}
        {!loading && currentData && (
          <div className="bg-white rounded-2xl shadow-sm border border-primary/8 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-primary">
                  Agenda de {currentDayName}
                </p>
                <p className="text-xs text-primary/50 mt-0.5">
                  {assignments.length} área{assignments.length !== 1 ? "s" : ""} atribuída{assignments.length !== 1 ? "s" : ""}
                  {currentData.totalPredictedWasteKg && (
                    <> - {currentData.totalPredictedWasteKg.toLocaleString("pt-BR")} kg no total</>
                  )}
                </p>
              </div>
              <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusCfg.bg} ${statusCfg.text}`}>
                <statusCfg.Icon size={12} />
                {statusCfg.label}
              </span>
            </div>
          </div>
        )}

        {/* Assignment Cards */}
        {!loading && assignments.length > 0 && (
          <div className="space-y-3">
            {assignments.map((a, idx) => {
              const waste = WASTE_COLORS[a.wasteCategory] || WASTE_COLORS.none;
              const isCompleted = a.completionStatus === "completed";
              const isCompleting = completing === a.area;
              const isConfirmedSchedule = currentData?.status === "confirmed" || currentData?.status === "completed";

              return (
                <div
                  key={idx}
                  className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${
                    isCompleted ? "border-emerald-300 bg-emerald-50/30" : "border-primary/8"
                  }`}
                >
                  {/* Completed Banner */}
                  {isCompleted && (
                    <div className="bg-emerald-500 px-5 py-2 flex items-center gap-2 text-white">
                      <CheckCheck size={14} />
                      <span className="text-xs font-bold uppercase tracking-wider">Concluída</span>
                      {a.completedAt && (
                        <span className="text-xs text-white/70 ml-auto">
                          {new Date(a.completedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Card Header */}
                  <div className="p-5 pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${isCompleted ? "bg-emerald-100" : waste.bg} flex items-center justify-center shrink-0`}>
                          {isCompleted
                            ? <CheckCircle size={18} className="text-emerald-600" />
                            : <MapPin size={18} className={waste.text} />
                          }
                        </div>
                        <div>
                          <h3 className={`text-base font-bold ${isCompleted ? "text-emerald-800" : "text-primary"}`}>{a.area}</h3>
                          <p className="text-xs text-primary/40 capitalize">
                            Área {AREA_TYPE_LABELS[a.areaType] || a.areaType || "operacional"}{a.orgName ? ` - ${a.orgName}` : ""}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${waste.bg} ${waste.text}`}>
                        {WASTE_CATEGORY_LABELS[a.wasteCategory] || a.wasteCategory}
                      </span>
                    </div>

                    {a.isHoliday && (
                      <div className="mt-3 ml-13 px-3 py-1.5 rounded-lg bg-red-50 border border-red-100 inline-flex items-center gap-1.5">
                        <AlertTriangle size={12} className="text-red-500" />
                        <p className="text-xs text-red-600 font-medium">
                          Feriado: {a.holidayName || "feriado"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="px-5 pb-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-brand-surface-warm p-3.5 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center">
                        <Weight size={16} className="text-primary/50" />
                      </div>
                      <div>
                        <p className="text-[10px] text-primary/40 uppercase tracking-wider font-medium">Previsto</p>
                        <p className="text-base font-bold text-primary">
                          {a.predictedWasteKg?.toLocaleString("pt-BR")}<span className="text-xs font-normal text-primary/40 ml-0.5">kg</span>
                        </p>
                      </div>
                    </div>
                    {a.truck && (
                      <div className="rounded-xl bg-blue-50 p-3.5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Truck size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-[10px] text-blue-600/60 uppercase tracking-wider font-medium">Veículo</p>
                          <p className="text-sm font-bold text-blue-700">{a.truck.licensePlate}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Recommendation */}
                  {a.recommendation && (
                    <div className="px-5 pb-3">
                      <p className="text-xs text-primary/45 leading-relaxed">{a.recommendation}</p>
                    </div>
                  )}

                  {/* Action Footer */}
                  {isCompleted ? (
                    <div className="px-5 py-3 bg-emerald-50 border-t border-emerald-200 text-xs font-semibold text-emerald-700 flex items-center gap-2">
                      <CheckCheck size={12} /> Coleta concluída
                    </div>
                  ) : (
                    <div className={`border-t ${
                      a.action === "dispatch"
                        ? "border-emerald-100"
                        : a.action === "reduced"
                        ? "border-amber-100"
                        : "border-gray-100"
                    }`}>
                      <div className={`px-5 py-3 text-xs font-semibold flex items-center gap-2 ${
                        a.action === "dispatch"
                          ? "bg-emerald-50 text-emerald-700"
                          : a.action === "reduced"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-gray-50 text-gray-500"
                      }`}>
                        {a.action === "dispatch" ? <><Route size={12} /> Despachada - área atribuída a você</> :
                         a.action === "reduced" ? <><AlertTriangle size={12} /> Cobertura reduzida</> :
                         <><Clock size={12} /> Atribuição pendente</>}
                      </div>

                      {/* Mark Complete Button — only for confirmed schedules */}
                      {isConfirmedSchedule && (a.action === "dispatch" || a.action === "reduced") && (
                        <div className="px-5 py-3 bg-white">
                          <button
                            onClick={() => {
                              setActualWasteKg(a.predictedWasteKg ? String(Math.round(a.predictedWasteKg)) : "");
                              setConfirmArea(a.area);
                            }}
                            disabled={isCompleting}
                            className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-brand-primary-hover active:scale-[0.98] transition-all disabled:opacity-50"
                          >
                            {isCompleting ? (
                              <><Loader2 size={16} className="animate-spin" /> Registrando...</>
                            ) : (
                              <><CheckCircle size={16} /> Marcar como concluída</>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && assignments.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-primary/8">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <Calendar size={28} className="text-blue-400" />
            </div>
            <h3 className="text-base font-semibold text-primary/70 mb-1">
              {!currentData
                ? `Sem agenda para ${activeDay === "today" ? "hoje" : "amanhã"}`
                : "Nenhuma área atribuída"
              }
            </h3>
            <p className="text-sm text-primary/40 max-w-xs mx-auto">
              {!currentData
                ? "A administração ainda não gerou a agenda. Verifique novamente mais tarde."
                : "Nenhuma área foi atribuída a você neste dia."
              }
            </p>
          </div>
        )}
      </div>
      </div>

      {/* Confirmation Modal */}
      {confirmArea && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-6">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in slide-in-from-bottom-4">
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-primary mb-2">Confirmar conclusão</h3>
              <p className="text-sm text-primary/60">
                Marcar a coleta de <span className="font-semibold text-primary">{confirmArea}</span> como concluída?
              </p>
              <label className="block mt-5 text-left text-xs font-semibold text-primary/60">
                Resíduo coletado (kg)
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={actualWasteKg}
                  onChange={(e) => setActualWasteKg(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-primary/15 px-4 py-3 text-sm font-semibold text-primary outline-none focus:border-primary/40"
                />
              </label>
            </div>
            <div className="flex gap-3 p-4 pt-0">
              <button
                onClick={() => {
                  setConfirmArea(null);
                  setActualWasteKg("");
                }}
                className="flex-1 py-3 rounded-xl border border-primary/15 text-sm font-semibold text-primary/60 hover:bg-primary/5 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleComplete(confirmArea)}
                className="flex-1 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition"
              >
                Sim, concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full px-4`}>
          <div className={`rounded-2xl shadow-lg px-5 py-4 flex items-center gap-3 ${
            toast.type === "success"
              ? "bg-emerald-500 text-white"
              : "bg-red-500 text-white"
          }`}>
            {toast.type === "success"
              ? <CheckCheck size={20} />
              : <AlertTriangle size={20} />
            }
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button onClick={() => setToast(null)} className="text-white/70 hover:text-white text-lg leading-none">&times;</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverMLAssignments;
