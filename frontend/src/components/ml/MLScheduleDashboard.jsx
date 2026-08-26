import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleOff,
  RefreshCcw,
  Sparkles,
  Truck,
} from "lucide-react";
import useAuthStore from "../../stores/useAuthStore";
import useMLScheduleStore from "../../stores/useMLScheduleStore";
import api from "../../utils/api";
import AreaPredictionCard from "./AreaPredictionCard";

const STATUS_STYLES = {
  draft: "border-slate-200 bg-slate-50 text-slate-700",
  confirmed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  completed: "border-sky-200 bg-sky-50 text-sky-700",
  cancelled: "border-rose-200 bg-rose-50 text-rose-700",
};

const STATUS_LABELS = {
  draft: "Rascunho",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const PLAN_LEGEND = [
  { label: "Pronta", dot: "bg-emerald-500", text: "Área com cobertura de coleta atribuída." },
  { label: "Reduzida", dot: "bg-amber-500", text: "Área com cobertura parcial ou limitada." },
  { label: "Exige ação", dot: "bg-rose-500", text: "Área precisa de recurso ou reprocessamento." },
];

const WASTE_LEGEND = [
  { label: "Baixo", dot: "bg-emerald-500" },
  { label: "Médio", dot: "bg-sky-500" },
  { label: "Alto", dot: "bg-amber-500" },
  { label: "Crítico", dot: "bg-rose-500" },
];

const formatDate = (date) => {
  if (!date) return "Sem data";
  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(String(date))
    ? new Date(`${date}T12:00:00`)
    : new Date(date);
  return parsedDate.toLocaleDateString("pt-BR", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
};

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 });

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const StatCard = ({ label, value, detail, tone = "default" }) => (
  <div className="rounded-lg border border-primary/10 bg-white p-4">
    <p className="text-xs font-medium uppercase tracking-wide text-primary/45">{label}</p>
    <p className={`mt-2 text-2xl font-bold text-primary ${tone !== "default" ? tone : ""}`}>{value}</p>
    {detail && <p className="mt-2 text-xs text-primary/50">{detail}</p>}
  </div>
);

const Guide = ({ isSuperAdmin }) => (
  <section className="rounded-lg border border-primary/10 bg-white p-5">
    <div>
      <h2 className="text-base font-semibold text-primary">Como funciona o planejamento assistido</h2>
      <p className="mt-1 max-w-4xl text-sm leading-6 text-primary/55">
        {isSuperAdmin
          ? "A Administração EcoRoute solicita a geração da proposta e decide se ela será confirmada para despacho."
          : "Você consulta somente as áreas do seu operador. A Administração EcoRoute gera e confirma o planejamento geral."}
        {" "}O sistema não cria pedidos de clientes nem despacha veículos sozinho.
      </p>
    </div>

    <ol className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {[
        {
          step: "1",
          title: "Solicitação administrativa",
          text: "A administração escolhe a data e aciona Gerar planejamento.",
          icon: CalendarDays,
        },
        {
          step: "2",
          title: "Previsão por área",
          text: "O motor estima os quilogramas de resíduos a partir do histórico e do perfil de cada área.",
          icon: BrainCircuit,
        },
        {
          step: "3",
          title: "Sugestão de recursos",
          text: "O sistema combina volume previsto, capacidade dos veículos e coletores disponíveis.",
          icon: Truck,
        },
        {
          step: "4",
          title: "Revisão humana",
          text: "A administração confere pendências e confirma. Só então as atribuições chegam aos coletores.",
          icon: CheckCircle2,
        },
      ].map(({ step, title, text, icon: Icon }) => (
        <li key={step} className="rounded-lg border border-primary/8 bg-primary/[0.025] p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-xs font-bold text-white">{step}</span>
            <Icon className="h-4 w-4 text-primary/55" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-primary">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-primary/55">{text}</p>
        </li>
      ))}
    </ol>

    <div className="mt-4 grid gap-3 lg:grid-cols-2">
      <div className="rounded-lg border border-primary/8 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary/45">Situação da cobertura</p>
        <div className="mt-2 space-y-2">
          {PLAN_LEGEND.map((item) => (
            <div key={item.label} className="flex items-start gap-2 text-xs text-primary/60">
              <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${item.dot}`} />
              <span><strong className="text-primary">{item.label}:</strong> {item.text}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-primary/8 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary/45">Faixa de volume previsto</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {WASTE_LEGEND.map((item) => (
            <span key={item.label} className="inline-flex items-center gap-2 rounded-full border border-primary/10 px-3 py-1.5 text-xs font-semibold text-primary/65">
              <span className={`h-2 w-2 rounded-full ${item.dot}`} />
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  </section>
);

const MLScheduleDashboard = () => {
  const {
    currentSchedule,
    schedules,
    mlHealth,
    loading,
    error,
    generateSchedule,
    confirmSchedule,
    checkMLHealth,
    clearCurrentSchedule,
    clearError,
  } = useMLScheduleStore();

  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === "super_admin";

  const [selectedDate, setSelectedDate] = useState(() => getLocalDateString());
  const [showGenerator, setShowGenerator] = useState(false);
  const [previewSchedule, setPreviewSchedule] = useState(null);

  const loadTodaySchedule = useCallback(async (date) => {
    try {
      const res = await api.get(`/ml-schedule?date=${date}&limit=1`);
      const todaySchedules = res.data.data || [];
      if (todaySchedules.length > 0) {
        useMLScheduleStore.setState({ currentSchedule: todaySchedules[0], schedules: todaySchedules });
      } else {
        useMLScheduleStore.setState({ currentSchedule: null, schedules: [] });
      }
    } catch {
      useMLScheduleStore.setState({ currentSchedule: null, schedules: [] });
    }
  }, []);

  useEffect(() => {
    checkMLHealth();
    loadTodaySchedule(getLocalDateString());
  }, [checkMLHealth, loadTodaySchedule]);

  const displaySchedule = currentSchedule;
  const summary = displaySchedule?.summary || {};
  const areas = useMemo(() => displaySchedule?.areas || [], [displaySchedule]);
  const isOnline = mlHealth?.status === "ok";

  const groupedAreas = useMemo(
    () => ({
      dispatch: areas.filter((area) => area.action === "dispatch"),
      reduced: areas.filter((area) => area.action === "reduced"),
      skip: areas.filter((area) => area.action === "skip"),
    }),
    [areas]
  );

  const totalAreas = summary.totalAreas || areas.length;
  const coveredAreas = (summary.dispatched || groupedAreas.dispatch.length) + (summary.reduced || groupedAreas.reduced.length);
  const coveragePercent = totalAreas ? Math.round((coveredAreas / totalAreas) * 100) : 0;
  const attentionAreas = summary.skipped || groupedAreas.skip.length;

  const handleGenerate = async () => {
    clearError();
    const result = await generateSchedule(selectedDate);
    if (!result) return;

    const today = getLocalDateString();
    if (selectedDate === today) {
      setPreviewSchedule(null);
    } else {
      setPreviewSchedule(result);
      loadTodaySchedule(today);
    }
  };

  const handleConfirmCurrent = async () => {
    if (!displaySchedule?._id) return;
    await confirmSchedule(displaySchedule._id);
  };

  const handleConfirmPreview = async () => {
    if (!previewSchedule?._id) return;
    await confirmSchedule(previewSchedule._id);
    setPreviewSchedule(null);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-primary/10 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/8 text-primary">
                <BrainCircuit className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-primary">Planejamento diário de rotas</h1>
                <p className="text-sm text-primary/55">A administração gera uma proposta de recursos; a confirmação humana ocorre antes do despacho.</p>
              </div>
            </div>

            {displaySchedule && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-lg border border-primary/10 bg-primary/[0.03] px-3 py-1.5 text-sm font-medium text-primary/70">
                  <CalendarDays className="h-4 w-4" />
                  {displaySchedule.dayName}, {formatDate(displaySchedule.date)}
                </span>
                <span className={`inline-flex rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize ${STATUS_STYLES[displaySchedule.status] || STATUS_STYLES.draft}`}>
                  {STATUS_LABELS[displaySchedule.status] || "Rascunho"}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${
                isOnline
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-rose-500"}`} />
              {isOnline ? "Motor de planejamento disponível" : "Estratégia de contingência ativa"}
            </span>

            <button
              type="button"
              onClick={() => checkMLHealth()}
              className="grid h-9 w-9 place-items-center rounded-lg border border-primary/10 text-primary/60 transition hover:bg-primary/5 hover:text-primary"
              aria-label="Atualizar motor de otimização"
            >
              <RefreshCcw className="h-4 w-4" />
            </button>

            {isSuperAdmin && displaySchedule?.status === "draft" && (
              <button
                type="button"
                onClick={handleConfirmCurrent}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                Confirmar
              </button>
            )}
          </div>
        </div>
      </section>

      <Guide isSuperAdmin={isSuperAdmin} />

      {error && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
          <p className="text-sm text-rose-700">{error}</p>
          <button type="button" onClick={clearError} className="text-xs font-semibold text-rose-700 underline">
            Dispensar
          </button>
        </div>
      )}

      {displaySchedule && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Resíduo previsto" value={`${formatNumber(displaySchedule.totalPredictedWasteKg)} kg`} detail={`Soma estimada para ${totalAreas} áreas antes da coleta.`} />
            <StatCard label="Cobertura sugerida" value={`${coveragePercent}%`} detail={`${coveredAreas} de ${totalAreas} áreas receberam recursos na proposta.`} tone={coveragePercent < 80 ? "text-amber-700" : "text-emerald-700"} />
            <StatCard label="Veículos sugeridos" value={summary.totalTrucksAssigned || 0} detail={`Selecionados entre ${summary.totalTrucksAvailable || 0} veículos disponíveis com coletor.`} />
            <StatCard
              label="Pendências para revisão"
              value={attentionAreas + Number(summary.driverlessTrucks || 0)}
              detail={`${attentionAreas} ${attentionAreas === 1 ? "área" : "áreas"} sem cobertura e ${summary.driverlessTrucks || 0} ${Number(summary.driverlessTrucks || 0) === 1 ? "veículo" : "veículos"} sem coletor.`}
              tone="text-rose-700"
            />
          </div>

          {(summary.skipped > 0 || summary.driverlessTrucks > 0) && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                <p className="text-sm text-amber-700">
                  {attentionAreas} {attentionAreas === 1 ? "área precisa" : "áreas precisam"} de atenção.
                  {summary.driverlessTrucks > 0
                    ? ` ${summary.driverlessTrucks} ${summary.driverlessTrucks === 1 ? "veículo está" : "veículos estão"} sem coletor atribuído.`
                    : ""}
                </p>
              </div>
            </div>
          )}

          <section className="space-y-5">
            {[
              { title: "Prontas", icon: CheckCircle2, areas: groupedAreas.dispatch },
              { title: "Reduzidas", icon: AlertCircle, areas: groupedAreas.reduced },
              { title: "Exigem ação", icon: CircleOff, areas: groupedAreas.skip },
            ].map(({ title, icon, areas: sectionAreas }) => (
              sectionAreas.length > 0 && (
                <div key={title}>
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-primary/65">
                    {React.createElement(icon, { className: "h-4 w-4" })}
                    {title} ({sectionAreas.length})
                  </h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {sectionAreas.map((areaItem) => (
                      <AreaPredictionCard key={`${areaItem.area}-${areaItem.action}`} area={areaItem} scheduleId={displaySchedule._id} />
                    ))}
                  </div>
                </div>
              )
            ))}
          </section>
        </>
      )}

      {!displaySchedule && !loading && schedules.length > 0 && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-sm text-emerald-700">
            Último planejamento: {formatDate(schedules[0].date)} / {schedules[0].areas?.length || 0} áreas /{" "}
            {formatNumber(schedules[0].totalPredictedWasteKg)} kg previstos.
          </p>
        </div>
      )}

      {!displaySchedule && !loading && schedules.length === 0 && (
        <section className="rounded-lg border border-primary/10 bg-white py-14 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-primary/8 text-primary/50">
            <BrainCircuit className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-primary">Sem planejamento para hoje</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-primary/50">Gere uma proposta de distribuição para revisar áreas, frota e prioridades.</p>
        </section>
      )}

      {isSuperAdmin && (
        <section className="rounded-lg border border-primary/10 bg-white">
          <button
            type="button"
            onClick={() => setShowGenerator((value) => !value)}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-primary/[0.03]"
          >
            <div>
              <h3 className="text-sm font-semibold text-primary">Gerar proposta administrativa</h3>
              <p className="mt-0.5 text-sm text-primary/50">Escolha a data para estimar volumes e sugerir veículo e coletor por área.</p>
            </div>
            <ChevronDown className={`h-5 w-5 text-primary/45 transition-transform ${showGenerator ? "rotate-180" : ""}`} />
          </button>

          {showGenerator && (
            <div className="space-y-4 border-t border-primary/8 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary/45">Data</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="h-10 rounded-lg border border-primary/10 bg-white px-3 text-sm text-primary outline-none transition focus:border-primary/30"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {loading ? "Gerando..." : "Gerar proposta"}
                </button>

                {displaySchedule && (
                  <button
                    type="button"
                    onClick={() => {
                      clearCurrentSchedule();
                      setPreviewSchedule(null);
                    }}
                    className="h-10 rounded-lg border border-primary/10 px-4 text-sm font-medium text-primary/60 transition hover:bg-primary/5 hover:text-primary"
                  >
                    Limpar visualização
                  </button>
                )}
              </div>

              {!isOnline && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  O motor de otimização está offline; o sistema usará a estratégia de contingência para gerar o plano.
                </p>
              )}

              {previewSchedule && (
                <div className="rounded-lg border border-primary/10 bg-primary/[0.025] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary/45">Prévia</p>
                      <h3 className="mt-1 text-base font-semibold text-primary">
                        {previewSchedule.dayName}, {formatDate(previewSchedule.date)}
                      </h3>
                      <p className="mt-1 text-sm text-primary/55">
                        {previewSchedule.areas?.length || 0} áreas / {formatNumber(previewSchedule.totalPredictedWasteKg)} kg previstos.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {previewSchedule.status === "draft" && (
                        <button
                          type="button"
                          onClick={handleConfirmPreview}
                          disabled={loading}
                          className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
                        >
                          Confirmar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setPreviewSchedule(null)}
                        className="rounded-lg border border-primary/10 px-3 py-2 text-sm font-medium text-primary/60 transition hover:bg-white"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default MLScheduleDashboard;
