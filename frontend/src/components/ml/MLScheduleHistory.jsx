import React, { useEffect, useState } from "react";
import useMLScheduleStore from "../../stores/useMLScheduleStore";
import PaginationControls from "../shared/PaginationControls";
import TruckLoader from "../shared/TruckLoader";

const STATUS_BADGES = {
  draft: { bg: "bg-gray-100", text: "text-gray-700", label: "Rascunho" },
  confirmed: { bg: "bg-green-100", text: "text-green-700", label: "Confirmado" },
  completed: { bg: "bg-blue-100", text: "text-blue-700", label: "Concluído" },
  cancelled: { bg: "bg-red-100", text: "text-red-700", label: "Cancelado" },
};

const WASTE_LABELS = {
  none: "Sem risco",
  low: "Baixo",
  medium: "Médio",
  high: "Alto",
  critical: "Crítico",
};

const ACTION_LABELS = {
  dispatch: "Despachar",
  reduced: "Reduzida",
  skip: "Não atender",
};

const AREA_TYPE_LABELS = {
  commercial: "Comercial",
  residential: "Residencial",
  suburban: "Bairro",
  rural: "Rural",
};

const MLScheduleHistory = () => {
  const {
    schedules,
    schedulePagination,
    loading,
    error,
    fetchSchedules,
    fetchScheduleById,
    currentSchedule,
    clearCurrentSchedule,
  } = useMLScheduleStore();

  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [viewingId, setViewingId] = useState(null);

  useEffect(() => {
    fetchSchedules({ status: statusFilter || undefined, page, limit: 10 });
  }, [fetchSchedules, statusFilter, page]);

  const handleView = async (id) => {
    setViewingId(id);
    await fetchScheduleById(id);
  };

  const handleStatusFilterChange = (nextStatus) => {
    setStatusFilter(nextStatus);
    setPage(1);
  };

  const handleBack = () => {
    setViewingId(null);
    clearCurrentSchedule();
  };

  // Detail view
  if (viewingId && currentSchedule) {
    const badge = STATUS_BADGES[currentSchedule.status] || STATUS_BADGES.draft;
    return (
      <div className="space-y-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-primary/60 hover:text-primary transition"
        >
          <span>←</span> Voltar ao histórico
        </button>

        <div className="bg-white rounded-2xl border border-primary/10 p-5">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <h2 className="text-xl font-bold text-primary">
              {currentSchedule.dayName}, {new Date(currentSchedule.date).toLocaleDateString("pt-BR", {
                year: "numeric", month: "long", day: "numeric"
              })}
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
              {badge.label}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="text-center p-3 rounded-xl bg-gray-50">
              <p className="text-lg font-bold text-primary">
                {currentSchedule.totalPredictedWasteKg?.toLocaleString("pt-BR")} kg
              </p>
              <p className="text-xs text-primary/50">Resíduo previsto</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-green-50">
              <p className="text-lg font-bold text-green-700">{currentSchedule.summary?.dispatched || 0}</p>
              <p className="text-xs text-green-600/70">Despachadas</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-gray-50">
              <p className="text-lg font-bold text-gray-500">{currentSchedule.summary?.skipped || 0}</p>
              <p className="text-xs text-gray-500/70">Não atendidas</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-blue-50">
              <p className="text-lg font-bold text-blue-700">{currentSchedule.summary?.totalTrucksAssigned || 0}</p>
              <p className="text-xs text-blue-600/70">Veículos</p>
            </div>
          </div>

          {currentSchedule.generatedBy && (
            <p className="text-xs text-primary/40 mb-1">
              Gerado por: {currentSchedule.generatedBy.name || currentSchedule.generatedBy.email}
            </p>
          )}
          {currentSchedule.confirmedBy && (
            <p className="text-xs text-primary/40">
              Confirmado por: {currentSchedule.confirmedBy.name || currentSchedule.confirmedBy.email}
              {currentSchedule.confirmedAt && (
                <span> em {new Date(currentSchedule.confirmedAt).toLocaleString("pt-BR")}</span>
              )}
            </p>
          )}
        </div>

        {/* Area breakdown */}
        <div className="bg-white rounded-2xl border border-primary/10 overflow-hidden">
          <div className="px-5 py-3 border-b border-primary/10">
            <h3 className="font-semibold text-primary">Detalhamento por área</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-primary/50 uppercase">Área</th>
                  <th className="px-5 py-3 text-xs font-semibold text-primary/50 uppercase">Tipo</th>
                  <th className="px-5 py-3 text-xs font-semibold text-primary/50 uppercase">Previsto</th>
                  <th className="px-5 py-3 text-xs font-semibold text-primary/50 uppercase">Nível</th>
                  <th className="px-5 py-3 text-xs font-semibold text-primary/50 uppercase">Ação</th>
                  <th className="px-5 py-3 text-xs font-semibold text-primary/50 uppercase">Veículos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {currentSchedule.areas?.map((d) => (
                    <tr key={d.area} className={d.action === "skip" ? "opacity-50" : ""}>
                      <td className="px-5 py-3 font-medium text-primary">
                        {d.area}
                        {d.isHoliday && <span className="ml-1.5">🎉</span>}
                      </td>
                      <td className="px-5 py-3 text-primary/60">{AREA_TYPE_LABELS[d.areaType] || d.areaType}</td>
                      <td className="px-5 py-3 font-semibold text-primary">
                        {d.predictedWasteKg?.toLocaleString("pt-BR")} kg
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                          ${d.wasteCategory === "critical" ? "bg-red-100 text-red-700" :
                            d.wasteCategory === "high" ? "bg-orange-100 text-orange-700" :
                            d.wasteCategory === "medium" ? "bg-amber-100 text-amber-700" :
                            d.wasteCategory === "low" ? "bg-green-100 text-green-700" :
                            "bg-gray-100 text-gray-600"}`}>
                          {WASTE_LABELS[d.wasteCategory] || d.wasteCategory}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                          ${d.action === "dispatch" ? "bg-green-100 text-green-700" :
                            d.action === "reduced" ? "bg-amber-100 text-amber-700" :
                            "bg-gray-100 text-gray-500"}`}>
                          {ACTION_LABELS[d.action] || d.action}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-primary/60">
                        {d.assignedTrucks?.map((t) => t.licensePlate || t.truckId).join(", ") || "—"}
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">
            Histórico da agenda inteligente
          </h1>
          <p className="text-sm text-primary/60 mt-1">
            Roteiros de coleta gerados pela IA e pelo fallback operacional
          </p>
        </div>

        {/* Filter */}
        <select
          value={statusFilter}
          onChange={(e) => handleStatusFilterChange(e.target.value)}
          className="px-4 py-2 rounded-xl border border-primary/15 text-sm
                     focus:outline-none focus:ring-2 focus:ring-accent/30
                     text-primary"
        >
          <option value="">Todos os status</option>
          <option value="draft">Rascunho</option>
          <option value="confirmed">Confirmado</option>
          <option value="completed">Concluído</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <TruckLoader text="Carregando histórico da agenda..." />
        </div>
      )}

      {/* Schedule List */}
      {!loading && schedules.length > 0 && (
        <div className="bg-white rounded-2xl border border-primary/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-primary/50 uppercase">Data</th>
                  <th className="px-5 py-3 text-xs font-semibold text-primary/50 uppercase">Dia</th>
                  <th className="px-5 py-3 text-xs font-semibold text-primary/50 uppercase">Resíduo previsto</th>
                  <th className="px-5 py-3 text-xs font-semibold text-primary/50 uppercase">Despachadas</th>
                  <th className="px-5 py-3 text-xs font-semibold text-primary/50 uppercase">Veículos</th>
                  <th className="px-5 py-3 text-xs font-semibold text-primary/50 uppercase">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold text-primary/50 uppercase">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {schedules.map((s) => {
                  const badge = STATUS_BADGES[s.status] || STATUS_BADGES.draft;
                  return (
                    <tr key={s._id} className="hover:bg-gray-50/50 transition">
                      <td className="px-5 py-3 font-medium text-primary">
                        {new Date(s.date).toLocaleDateString("pt-BR", {
                          year: "numeric", month: "short", day: "numeric"
                        })}
                      </td>
                      <td className="px-5 py-3 text-primary/60">{s.dayName}</td>
                      <td className="px-5 py-3 font-semibold text-primary">
                        {s.totalPredictedWasteKg?.toLocaleString("pt-BR")} kg
                      </td>
                      <td className="px-5 py-3 text-primary/70">
                        {s.summary?.dispatched || 0} / {s.summary?.totalAreas || 10}
                      </td>
                      <td className="px-5 py-3 text-primary/70">
                        {s.summary?.totalTrucksAssigned || 0}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => handleView(s._id)}
                          className="text-xs font-medium text-accent hover:underline"
                        >
                          Ver detalhes
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <PaginationControls
            pagination={schedulePagination}
            onPageChange={setPage}
            itemLabel="agendas"
          />
        </div>
      )}

      {/* Empty State */}
      {!loading && schedules.length === 0 && (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">📋</p>
          <h3 className="text-lg font-semibold text-primary/70 mb-2">
            Nenhuma agenda encontrada
          </h3>
          <p className="text-sm text-primary/50">
            {statusFilter
              ? `Nenhuma agenda com status "${STATUS_BADGES[statusFilter]?.label || statusFilter}". Tente outro filtro.`
              : "Gere a primeira agenda inteligente na página Agenda IA."}
          </p>
        </div>
      )}
    </div>
  );
};

export default MLScheduleHistory;
