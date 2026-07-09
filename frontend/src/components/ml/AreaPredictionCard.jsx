import React, { useState } from "react";
import { X, RefreshCcw, Truck, UserRound } from "lucide-react";
import useAuthStore from "../../stores/useAuthStore";
import useMLScheduleStore from "../../stores/useMLScheduleStore";

const STATUS = {
  dispatch: {
    label: "Pronta",
    dot: "bg-emerald-500",
    card: "border-emerald-200 bg-emerald-50/45",
    text: "text-emerald-700",
    help: "Esta área tem veículo atribuído e está pronta para coleta.",
  },
  reduced: {
    label: "Reduzida",
    dot: "bg-amber-500",
    card: "border-amber-200 bg-amber-50/45",
    text: "text-amber-700",
    help: "Esta área tem cobertura parcial. Confira os veículos antes do despacho.",
  },
  skip: {
    label: "Exige ação",
    dot: "bg-rose-500",
    card: "border-rose-200 bg-rose-50/45",
    text: "text-rose-700",
    help: "Esta área ainda não está coberta. Atribua recursos ou reprocesse a agenda.",
  },
};

const WASTE_LABELS = {
  none: "Sem risco",
  low: "Baixo",
  medium: "Médio",
  high: "Alto",
  critical: "Crítico",
};

const AREA_TYPE_LABELS = {
  commercial: "Comercial",
  residential: "Residencial",
  suburban: "Bairro",
  rural: "Rural",
};

const WASTE_DOTS = {
  none: "bg-slate-400",
  low: "bg-emerald-500",
  medium: "bg-sky-500",
  high: "bg-amber-500",
  critical: "bg-rose-500",
};

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 });

const AreaPredictionCard = ({ area, scheduleId }) => {
  const user = useAuthStore((s) => s.user);
  const redispatchArea = useMLScheduleStore((s) => s.redispatchArea);
  const [showHelp, setShowHelp] = useState(false);
  const [redispatching, setRedispatching] = useState(false);
  const [redispatchError, setRedispatchError] = useState(null);

  const style = STATUS[area.action] || STATUS.dispatch;
  const trucks = area.assignedTrucks || [];
  const firstTruck = trucks[0];
  const canRedispatch =
    (area.action === "skip" || (area.action === "reduced" && trucks.length === 0)) &&
    scheduleId &&
    (user?.role === "admin" || user?.role === "super_admin");

  const handleRedispatch = async () => {
    setRedispatching(true);
    setRedispatchError(null);
    const result = await redispatchArea(scheduleId, area.area);
    setRedispatching(false);
    if (!result) {
      setRedispatchError(useMLScheduleStore.getState().error || "Não foi possível reprocessar a área");
    }
  };

  return (
    <article
      className={`relative rounded-lg border p-4 ${style.card} dark:border-[var(--dash-border)] dark:bg-[var(--dash-card)]`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} />
            <h3 className="truncate text-base font-semibold text-primary">{area.area}</h3>
          </div>
          <p className="mt-1 truncate text-xs text-primary/50">
            {[AREA_TYPE_LABELS[area.areaType] || area.areaType, area.orgName].filter(Boolean).join(" / ") || "Área de coleta"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowHelp((value) => !value)}
          className="shrink-0 rounded-lg border border-primary/10 bg-white/70 px-3 py-1.5 text-xs font-semibold text-primary/60 transition hover:bg-white hover:text-primary dark:bg-primary/5 dark:hover:bg-primary/10"
          aria-label="Mostrar ajuda de status"
          aria-expanded={showHelp}
        >
          Ajuda
        </button>
      </div>

      {showHelp && (
        <div className="absolute right-4 top-14 z-20 w-[min(20rem,calc(100%-2rem))] rounded-lg border border-primary/12 bg-white p-4 shadow-xl dark:bg-[var(--dash-card-soft)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-primary">{style.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-primary/60">{style.help}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-primary/45 transition hover:bg-primary/8 hover:text-primary"
              aria-label="Fechar ajuda"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {area.recommendation && (
            <div className="mt-3 rounded-lg border border-primary/8 bg-primary/[0.03] px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/45">Recomendação</p>
              <p className="mt-1 text-xs leading-relaxed text-primary/60">{area.recommendation}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-primary/45">Resíduo</p>
          <p className="mt-1 text-lg font-bold text-primary">
            {formatNumber(area.predictedWasteKg)}
            <span className="ml-1 text-xs font-medium text-primary/45">kg</span>
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-primary/45">Veículos</p>
          <p className="mt-1 text-lg font-bold text-primary">{trucks.length}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-primary/45">Nível</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold capitalize text-primary">
            <span className={`h-2 w-2 rounded-full ${WASTE_DOTS[area.wasteCategory] || WASTE_DOTS.none}`} />
            {WASTE_LABELS[area.wasteCategory] || "Sem risco"}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2 rounded-lg border border-primary/8 bg-white/55 p-3 text-xs text-primary/60 dark:border-[var(--dash-border)] dark:bg-[var(--dash-card-soft)] dark:text-primary/70">
        <p className="flex items-center gap-2">
          <Truck className="h-3.5 w-3.5" />
          {firstTruck ? `${firstTruck.licensePlate} / ${formatNumber(firstTruck.capacity)} kg` : "Sem veículo atribuído"}
        </p>
        <p className="flex items-center gap-2">
          <UserRound className="h-3.5 w-3.5" />
          {firstTruck?.driverName && firstTruck.driverName !== "Unassigned" ? firstTruck.driverName : "Sem coletor atribuído"}
        </p>
      </div>

      {area.skipReason && (
        <p className={`mt-3 text-xs font-medium ${style.text}`}>{area.skipReason}</p>
      )}

      {area.isHoliday && (
        <p className="mt-3 rounded-lg border border-rose-100 bg-white/65 px-3 py-2 text-xs text-rose-700">
          Feriado: {area.holidayName || "Feriado"}
        </p>
      )}

      {canRedispatch && (
        <div className="mt-4">
          {redispatchError && <p className="mb-2 text-xs text-rose-600">{redispatchError}</p>}
          <button
            type="button"
            onClick={handleRedispatch}
            disabled={redispatching}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${redispatching ? "animate-spin" : ""}`} />
            {redispatching ? "Reprocessando..." : "Reprocessar área"}
          </button>
        </div>
      )}
    </article>
  );
};

export default AreaPredictionCard;
