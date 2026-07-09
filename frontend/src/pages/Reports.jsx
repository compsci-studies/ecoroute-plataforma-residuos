import React, { useEffect, useMemo, useState } from "react";
import useMLScheduleStore from "../stores/useMLScheduleStore";
import useAuthStore from "../stores/useAuthStore";
import { BarChart3, AlertTriangle, Truck } from "lucide-react";
import LazyChart from "../components/charts/LazyChart";
import { alpha, themeColor } from "../utils/themeColors";
import TruckLoader from "../components/shared/TruckLoader";

const REASON_COLORS = {
  "No trucks with assigned drivers available": themeColor("danger"),
  "Insufficient truck capacity for this area": themeColor("orange"),
  "No truck/driver available": themeColor("dangerStrong"),
  "Skipped by ML model": themeColor("muted"),
};

const REASON_LABELS = {
  "No trucks with assigned drivers available": "Sem veículos com coletores vinculados",
  "Insufficient truck capacity for this area": "Capacidade insuficiente para a área",
  "No truck/driver available": "Sem veículo ou coletor disponível",
  "Skipped by ML model": "Prioridade baixa pelo modelo preditivo",
};

const STATUS_LABELS = {
  draft: "Rascunho",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const ACTION_LABELS = {
  dispatch: "Despachar coleta",
  skip: "Não despachar",
  reduced: "Rota reduzida",
};

const WASTE_LEVEL_LABELS = {
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

const Reports = () => {
  const { mlAnalytics, loading, error, fetchMLAnalytics } = useMLScheduleStore();
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => { fetchMLAnalytics(); }, [fetchMLAnalytics]);

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: themeColor("primary"),
          font: { family: "'Inter', sans-serif", size: 12, weight: "500" },
          usePointStyle: true, padding: 20,
        },
      },
      tooltip: {
        backgroundColor: alpha(themeColor("primary"), 0.92),
        titleFont: { family: "'Inter', sans-serif", size: 14 },
        bodyFont: { family: "'Inter', sans-serif", size: 13 },
        padding: 12, cornerRadius: 8, displayColors: true,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: "'Inter', sans-serif" }, color: themeColor("primary") } },
      y: { border: { dash: [4, 4] }, grid: { color: themeColor("chartGrid") }, ticks: { font: { family: "'Inter', sans-serif" }, color: themeColor("primary") }, beginAtZero: true },
    },
  };

  const pieBaseOptions = { ...commonOptions, scales: { x: { display: false }, y: { display: false } } };
  const doughnutBaseOptions = { ...pieBaseOptions, cutout: "65%" };

  const analytics = useMemo(() => mlAnalytics || {}, [mlAnalytics]);
  const totalSchedules = analytics.totalSchedules || 0;
  const modelInfo = analytics.modelInfo || { model: "Modelo não identificado", r2Score: null };
  const r2Label = Number.isFinite(Number(modelInfo.r2Score))
    ? `${(Number(modelInfo.r2Score) * 100).toFixed(1)}%`
    : "n/a";

  const wc = analytics.weeklyComparison || {};
  const thisWeekWaste = wc.thisWeekWaste || 0;
  const lastWeekWaste = wc.lastWeekWaste || 0;
  const weeklyChange = wc.changePercent || 0;
  const weeklyChangeIsGood = Number(weeklyChange) <= 0;

  const wasteTrend = useMemo(() => analytics.wasteTrend || [], [analytics.wasteTrend]);
  const trendDates = wasteTrend.map((t) => t.date);
  const trendValues = wasteTrend.map((t) => t.totalWasteKg);

  const areaBreakdown = useMemo(() => analytics.areaBreakdown || [], [analytics.areaBreakdown]);
  const categoryDist = useMemo(() => analytics.categoryDistribution || [], [analytics.categoryDistribution]);
  const scheduleStats = useMemo(() => analytics.scheduleStats || [], [analytics.scheduleStats]);
  const actionDist = useMemo(() => analytics.actionDistribution || [], [analytics.actionDistribution]);

  const incompleteAreas = useMemo(() => analytics.incompleteAreas || [], [analytics.incompleteAreas]);
  const reasonBreakdown = useMemo(() => analytics.reasonBreakdown || [], [analytics.reasonBreakdown]);
  const driverlessTruckStats = useMemo(() => analytics.driverlessTruckStats || [], [analytics.driverlessTruckStats]);

  const avgDispatched = wasteTrend.length > 0
    ? (wasteTrend.reduce((sum, t) => sum + (t.dispatched || 0), 0) / wasteTrend.length).toFixed(1)
    : 0;

  const trendChartData = useMemo(() => ({
    labels: trendDates.map((d) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })),
    datasets: [{
      label: "Resíduo previsto (kg)",
      data: trendValues,
      borderColor: themeColor("primary"), backgroundColor: alpha(themeColor("primary"), 0.1),
      tension: 0.4, fill: true, pointBackgroundColor: themeColor("primary"), pointRadius: 2, pointHoverRadius: 5,
    }],
  }), [trendDates, trendValues]);

  const areaChartData = useMemo(() => ({
    labels: areaBreakdown.map((d) => d.area),
    datasets: [{
      label: "Média prevista (kg)", data: areaBreakdown.map((d) => d.avgWasteKg),
      backgroundColor: alpha(themeColor("primary"), 0.7), borderRadius: 6,
    }],
  }), [areaBreakdown]);

  const categoryChartData = useMemo(() => ({
    labels: categoryDist.map((c) => WASTE_LEVEL_LABELS[c.category] || c.category),
    datasets: [{
      data: categoryDist.map((c) => c.count),
      backgroundColor: categoryDist.map((c) => ({ none: themeColor("muted"), low: themeColor("greenSoft"), medium: themeColor("warning"), high: themeColor("orange"), critical: themeColor("danger") })[c.category] || themeColor("chartGrid")),
      hoverOffset: 4,
    }],
  }), [categoryDist]);

  const statusChartData = useMemo(() => ({
    labels: scheduleStats.map((s) => STATUS_LABELS[s.status] || s.status),
    datasets: [{
      data: scheduleStats.map((s) => s.count),
      backgroundColor: scheduleStats.map((s) => ({ draft: themeColor("muted"), confirmed: themeColor("greenSoft"), completed: themeColor("info"), cancelled: themeColor("danger") })[s.status] || themeColor("chartGrid")),
      borderWidth: 0, hoverOffset: 4,
    }],
  }), [scheduleStats]);

  const actionChartData = useMemo(() => ({
    labels: actionDist.map((a) => ACTION_LABELS[a.action] || a.action),
    datasets: [{
      data: actionDist.map((a) => a.count),
      backgroundColor: actionDist.map((a) => ({ dispatch: themeColor("primary"), skip: themeColor("danger"), reduced: themeColor("warning") })[a.action] || themeColor("chartGrid")),
      borderWidth: 0, hoverOffset: 4,
    }],
  }), [actionDist]);

  const reasonChartData = useMemo(() => ({
    labels: reasonBreakdown.map((r) => {
      const label = REASON_LABELS[r.reason] || r.reason;
      return label.length > 30 ? `${label.slice(0, 30)}...` : label;
    }),
    datasets: [{
      data: reasonBreakdown.map((r) => r.count),
      backgroundColor: reasonBreakdown.map((r) => REASON_COLORS[r.reason] || themeColor("muted")),
      borderWidth: 0, hoverOffset: 4,
    }],
  }), [reasonBreakdown]);

  const driverlessChartData = useMemo(() => ({
    labels: driverlessTruckStats.map((d) => new Date(d.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })),
    datasets: [
      {
        label: "Veículos sem coletor",
        data: driverlessTruckStats.map((d) => d.driverlessTrucks),
        borderColor: themeColor("danger"), backgroundColor: alpha(themeColor("danger"), 0.15),
        tension: 0.4, fill: true, pointBackgroundColor: themeColor("danger"), pointRadius: 3,
      },
      {
        label: "Total de veículos",
        data: driverlessTruckStats.map((d) => d.totalTrucks),
        borderColor: themeColor("primary"), backgroundColor: alpha(themeColor("primary"), 0.05),
        tension: 0.4, fill: false, pointBackgroundColor: themeColor("primary"), pointRadius: 3, borderDash: [5, 5],
      },
    ],
  }), [driverlessTruckStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-primary/10">
        <TruckLoader text="Analisando roteiros e preparando relatórios..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 bg-white rounded-2xl border border-red-200">
        <p className="text-red-600 text-sm text-center">
          {user?.role !== "super_admin"
            ? "Relatórios disponíveis apenas para a gestão geral."
            : `Erro ao carregar relatórios: ${error}`
          }
        </p>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Visão geral", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "incomplete", label: "Áreas pendentes", icon: <AlertTriangle className="w-4 h-4" />, count: incompleteAreas.length },
    { id: "resources", label: "Gargalos de frota", icon: <Truck className="w-4 h-4" />, count: driverlessTruckStats.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary tracking-tight">
            Relatórios operacionais EcoRoute
          </h2>
          <p className="text-sm text-primary/50 mt-1">
            Indicadores, previsões e gargalos para a coleta inteligente de resíduos
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/10 text-xs font-semibold text-primary">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          {modelInfo.model} &middot; R&sup2; {r2Label}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-primary/10 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-primary/40 hover:text-primary/70"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === tab.id ? "bg-primary text-white" : "bg-red-500 text-white"
              }`}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
            <div className="bg-white rounded-2xl border border-primary/10 shadow-sm p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary/50">Roteiros gerados</p>
              <h3 className="mt-1 text-2xl font-bold text-primary">{totalSchedules}</h3>
            </div>
            <div className="bg-white rounded-2xl border border-primary/10 shadow-sm p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary/50">Esta semana</p>
              <h3 className="mt-1 text-2xl font-bold text-primary">{thisWeekWaste.toLocaleString()} kg</h3>
              <span className={`text-xs font-semibold ${weeklyChangeIsGood ? "text-green-600" : "text-red-600"}`}>
                {weeklyChange > 0 ? "+" : ""}{weeklyChange}%
              </span>
            </div>
            <div className="bg-white rounded-2xl border border-primary/10 shadow-sm p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary/50">Média despachada/dia</p>
              <h3 className="mt-1 text-2xl font-bold text-primary">{avgDispatched}</h3>
            </div>
            <div className="bg-white rounded-2xl border border-primary/10 shadow-sm p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary/50">Precisão do modelo</p>
              <h3 className="mt-1 text-2xl font-bold text-primary">{r2Label}</h3>
            </div>
            <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-5 bg-red-50/50">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-600/80">Áreas pendentes</p>
              <h3 className="mt-1 text-2xl font-bold text-red-600">{incompleteAreas.length}</h3>
              <span className="text-xs text-red-500">Exige ação</span>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-primary/10 shadow-sm p-6">
              <h3 className="text-base font-bold text-primary mb-1">Tendência de geração de resíduos</h3>
              <p className="text-sm text-primary/50 mb-4">Últimos 30 dias</p>
              <div className="h-72 w-full">
                {trendValues.length > 0 ? <LazyChart type="line" data={trendChartData} options={{ ...commonOptions, interaction: { mode: "index", intersect: false } }} /> : <p className="text-primary/40 flex items-center justify-center h-full text-sm">Sem dados</p>}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-primary/10 shadow-sm p-6">
              <h3 className="text-base font-bold text-primary mb-1">Comparativo por área</h3>
              <p className="text-sm text-primary/50 mb-4">Média de resíduos prevista por região</p>
              <div className="h-72 w-full">
                {areaBreakdown.length > 0 ? <LazyChart type="bar" data={areaChartData} options={{ ...commonOptions, indexAxis: "y", plugins: { ...commonOptions.plugins, legend: { display: false } } }} /> : <p className="text-primary/40 flex items-center justify-center h-full text-sm">Sem dados</p>}
              </div>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-primary/10 shadow-sm p-6">
              <h3 className="text-base font-bold text-primary mb-1">Níveis de resíduo</h3>
              <p className="text-sm text-primary/50 mb-4">Distribuição por criticidade</p>
              <div className="h-64 w-full flex justify-center">
                {categoryDist.length > 0 ? <LazyChart type="pie" data={categoryChartData} options={pieBaseOptions} /> : <p className="text-primary/40 flex items-center h-full text-sm">Sem dados</p>}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-primary/10 shadow-sm p-6">
              <h3 className="text-base font-bold text-primary mb-1">Status dos roteiros</h3>
              <p className="text-sm text-primary/50 mb-4">Distribuição por etapa operacional</p>
              <div className="h-64 w-full flex justify-center">
                {scheduleStats.length > 0 ? <LazyChart type="doughnut" data={statusChartData} options={doughnutBaseOptions} /> : <p className="text-primary/40 flex items-center h-full text-sm">Sem dados</p>}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-primary/10 shadow-sm p-6">
              <h3 className="text-base font-bold text-primary mb-1">Decisões do sistema</h3>
              <p className="text-sm text-primary/50 mb-4">Despacho, rota reduzida ou não atendimento</p>
              <div className="h-64 w-full flex justify-center">
                {actionDist.length > 0 ? <LazyChart type="doughnut" data={actionChartData} options={doughnutBaseOptions} /> : <p className="text-primary/40 flex items-center h-full text-sm">Sem dados</p>}
              </div>
            </div>
          </div>

          {/* Weekly Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-primary/10 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-primary">Esta semana</h3>
                <span className="text-xs font-medium text-primary/40 uppercase">Atual</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-sm text-primary/60">Resíduo previsto</span><span className="font-bold text-primary">{thisWeekWaste.toLocaleString()} kg</span></div>
                <div className="flex justify-between"><span className="text-sm text-primary/60">Roteiros</span><span className="font-bold text-primary">{wc.thisWeekSchedules || 0}</span></div>
                <div className="flex justify-between"><span className="text-sm text-primary/60">Variação</span><span className={`font-bold ${weeklyChangeIsGood ? "text-green-600" : "text-red-600"}`}>{weeklyChange > 0 ? "+" : ""}{weeklyChange}%</span></div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-primary/10 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-primary">Semana anterior</h3>
                <span className="text-xs font-medium text-primary/40 uppercase">Comparação</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-sm text-primary/60">Resíduo previsto</span><span className="font-bold text-primary">{lastWeekWaste.toLocaleString()} kg</span></div>
                <div className="flex justify-between"><span className="text-sm text-primary/60">Roteiros</span><span className="font-bold text-primary">{wc.lastWeekSchedules || 0}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INCOMPLETE AREAS TAB */}
      {activeTab === "incomplete" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-primary/10 shadow-sm p-6">
              <h3 className="text-base font-bold text-primary mb-1">Motivos de não atendimento</h3>
              <p className="text-sm text-primary/50 mb-4">Por que algumas áreas ficaram fora do roteiro</p>
              <div className="h-64 w-full flex justify-center">
                {reasonBreakdown.length > 0 ? (
                  <LazyChart type="doughnut" data={reasonChartData} options={doughnutBaseOptions} />
                ) : (
                  <p className="text-green-600 flex items-center h-full text-sm font-medium">Todas as áreas atendidas.</p>
                )}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-primary/10 shadow-sm p-6">
              <h3 className="text-base font-bold text-primary mb-1">Resumo executivo</h3>
              <div className="space-y-4 mt-4">
                <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                  <p className="text-sm font-bold text-red-700">{incompleteAreas.length} áreas não atendidas</p>
                  <p className="text-xs text-red-600/70 mt-1">Áreas ignoradas por falta de recurso ou baixa prioridade operacional.</p>
                </div>
                {reasonBreakdown.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-primary/2">
                    <span className="text-sm text-primary/70 max-w-[70%]">{REASON_LABELS[r.reason] || r.reason}</span>
                    <span className="text-lg font-bold text-red-600">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Incomplete Areas Table */}
          <div className="bg-white rounded-2xl border border-primary/10 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-primary/10">
              <h3 className="text-base font-bold text-primary">Registro de áreas pendentes</h3>
              <p className="text-sm text-primary/50">Regiões não atendidas que exigem ajuste operacional</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-primary/8 bg-primary/3">
                    <th className="px-5 py-3.5 text-xs font-semibold text-primary/50 uppercase">Data</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-primary/50 uppercase">Área</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-primary/50 uppercase">Tipo</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-primary/50 uppercase">Resíduo previsto</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-primary/50 uppercase">Nível</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-primary/50 uppercase">Ação</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-primary/50 uppercase">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {incompleteAreas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-green-600 text-sm font-medium">
                        Todas as áreas foram atendidas.
                      </td>
                    </tr>
                  ) : (
                    incompleteAreas.map((d, i) => (
                      <tr key={i} className="border-b border-primary/5 hover:bg-primary/2 transition-colors">
                        <td className="px-5 py-3 text-sm text-primary/60">{d.date}</td>
                        <td className="px-5 py-3 font-semibold text-primary text-sm">{d.area}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            { commercial: "bg-blue-100 text-blue-700", residential: "bg-purple-100 text-purple-700", suburban: "bg-teal-100 text-teal-700", rural: "bg-emerald-100 text-emerald-700" }[d.areaType] || "bg-gray-100 text-gray-700"
                          }`}>{AREA_TYPE_LABELS[d.areaType] || d.areaType}</span>
                        </td>
                        <td className="px-5 py-3 text-sm font-medium text-primary">{d.predictedWasteKg?.toLocaleString()} kg</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            { none: "bg-gray-100 text-gray-600", low: "bg-green-100 text-green-700", medium: "bg-amber-100 text-amber-700", high: "bg-orange-100 text-orange-700", critical: "bg-red-100 text-red-700" }[d.wasteCategory] || "bg-gray-100 text-gray-600"
                          }`}>{WASTE_LEVEL_LABELS[d.wasteCategory] || d.wasteCategory}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            d.action === "skip" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                          }`}>{ACTION_LABELS[d.action] || d.action}</span>
                        </td>
                        <td className="px-5 py-3 text-xs text-red-600 font-medium max-w-50">{REASON_LABELS[d.reason] || d.reason}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RESOURCE ISSUES TAB */}
      {activeTab === "resources" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-primary/10 shadow-sm p-6">
            <h3 className="text-base font-bold text-primary mb-1">Veículos sem coletor ao longo do tempo</h3>
            <p className="text-sm text-primary/50 mb-4">Veículos sem responsável em cada roteiro planejado</p>
            <div className="h-72 w-full">
              {driverlessTruckStats.length > 0 ? (
                <LazyChart type="line" data={driverlessChartData} options={{ ...commonOptions, interaction: { mode: "index", intersect: false } }} />
              ) : (
                <p className="text-green-600 flex items-center justify-center h-full text-sm font-medium">Todos os veículos têm coletores atribuídos.</p>
              )}
            </div>
          </div>

          {/* Resource Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-5 bg-red-50/30">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-600/80">Roteiros sem coletor</p>
              <h3 className="mt-2 text-3xl font-bold text-red-600">{driverlessTruckStats.length}</h3>
              <p className="text-xs text-red-500 mt-1">De {totalSchedules} roteiros totais</p>
            </div>
            <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5 bg-amber-50/30">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-600/80">Não atendidas por recurso</p>
              <h3 className="mt-2 text-3xl font-bold text-amber-600">
                {incompleteAreas.filter(d => d.reason?.includes("No truck") || d.reason?.includes("driver")).length}
              </h3>
              <p className="text-xs text-amber-500 mt-1">Falta de veículo ou coletor</p>
            </div>
            <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-5 bg-blue-50/30">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600/80">Não atendidas por previsão</p>
              <h3 className="mt-2 text-3xl font-bold text-blue-600">
                {incompleteAreas.filter(d => d.reason === "Skipped by ML model").length}
              </h3>
              <p className="text-xs text-blue-500 mt-1">Baixa geração prevista</p>
            </div>
          </div>

          {/* Action Items */}
          <div className="bg-white rounded-2xl border border-primary/10 shadow-sm p-6">
            <h3 className="text-base font-bold text-primary mb-4">Ações recomendadas</h3>
            <div className="space-y-3">
              {driverlessTruckStats.length > 0 && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                  <Truck className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-red-700">Atribuir coletores aos veículos</p>
                    <p className="text-xs text-red-600/70 mt-1">Vincule coletores disponíveis aos veículos para ampliar a cobertura dos roteiros.</p>
                  </div>
                </div>
              )}
              {incompleteAreas.filter(d => d.reason?.includes("capacity")).length > 0 && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-amber-700">Reforçar capacidade de coleta</p>
                    <p className="text-xs text-amber-600/70 mt-1">Algumas áreas ficaram pendentes porque a capacidade disponível não comporta o volume previsto.</p>
                  </div>
                </div>
              )}
              {incompleteAreas.length > 0 && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <BarChart3 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-blue-700">Reprocessar roteiro inteligente</p>
                    <p className="text-xs text-blue-600/70 mt-1">Após ajustar recursos, gere novamente o roteiro para redistribuir as áreas pendentes.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
