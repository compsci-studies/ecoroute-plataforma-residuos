import React, { useMemo } from "react";
import { useDashboardTheme } from "../../hooks/useDashboardTheme";
import { CircleHelp } from "lucide-react";
import LazyChart from "../charts/LazyChart";
import { alpha, themeColor } from "../../utils/themeColors";

/* ── Color palettes (match the rest of the app) ── */

const STATUS_COLORS = {
  PENDING: themeColor("warning"),
  ASSIGNED: themeColor("info"),
  EN_ROUTE: themeColor("indigo"),
  ARRIVED: themeColor("violet"),
  COLLECTING: themeColor("cyan"),
  COMPLETED: themeColor("successStrong"),
  CANCELLED: themeColor("danger"),
  EXPIRED: themeColor("muted"),
  REJECTED: themeColor("dangerStrong"),
};

const CATEGORY_COLORS = {
  recyclable: themeColor("successStrong"),
  "non-recyclable": themeColor("warning"),
  both: themeColor("indigo"),
};

const LEVEL_COLORS = {
  easy: themeColor("successStrong"),
  medium: themeColor("warning"),
  hard: themeColor("danger"),
};

const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

const STATUS_LABELS = {
  PENDING: "Pendente",
  ASSIGNED: "Atribuída",
  EN_ROUTE: "Em rota",
  ARRIVED: "No local",
  COLLECTING: "Coletando",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
  EXPIRED: "Expirada",
  REJECTED: "Recusada",
};

const CATEGORY_LABELS = {
  recyclable: "Reciclável",
  "non-recyclable": "Não reciclável",
  both: "Misto",
};

const LEVEL_LABELS = {
  easy: "Simples",
  medium: "Média",
  hard: "Complexa",
};

/* ── Shared chart options ── */

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        color: themeColor("chartText"),
        font: { family: "'Inter', sans-serif", size: 12, weight: "500" },
        usePointStyle: true,
        padding: 16,
      },
    },
    tooltip: {
      backgroundColor: alpha(themeColor("inkStrong"), 0.92),
      titleFont: { family: "'Inter', sans-serif", size: 13 },
      bodyFont: { family: "'Inter', sans-serif", size: 12 },
      padding: 10,
      cornerRadius: 8,
    },
  },
};

const cartesianOptions = {
  ...baseOptions,
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { family: "'Inter', sans-serif" }, color: themeColor("chartMuted") },
    },
    y: {
      border: { dash: [4, 4] },
      grid: { color: themeColor("chartGrid") },
      ticks: { font: { family: "'Inter', sans-serif" }, color: themeColor("chartMuted") },
      beginAtZero: true,
    },
  },
};

const doughnutOptions = {
  ...baseOptions,
  cutout: "62%",
};

/* ── Card wrapper (same look as Dashboard.jsx cards) ── */

function InfoHint({ text }) {
  if (!text) return null;
  return (
    <span className="group/help relative inline-flex">
      <CircleHelp className="h-4 w-4 text-primary/35 transition-colors hover:text-primary/65" aria-hidden />
      <span className="pointer-events-none absolute right-0 top-6 z-30 w-56 rounded-lg border border-(--dash-border) bg-(--dash-card) px-3 py-2 text-xs font-medium leading-relaxed text-primary/75 opacity-0 shadow-xl shadow-black/10 transition-opacity group-hover/help:opacity-100">
        {text}
      </span>
    </span>
  );
}

function ChartCard({ title, subtitle, hint, children, className = "" }) {
  return (
    <div className={`dash-interactive-card bg-(--dash-card) rounded-2xl border shadow-sm shadow-primary/5 p-6 ${className}`}>
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-primary">{title}</h3>
            {subtitle && <p className="text-sm text-primary/60">{subtitle}</p>}
          </div>
          <InfoHint text={hint} />
        </div>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex h-full min-h-50 items-center justify-center">
      <p className="text-sm text-primary/50">{message}</p>
    </div>
  );
}

function KpiCard({ label, value, valueClass = "text-primary", hint }) {
  return (
    <div className="dash-interactive-card bg-(--dash-card) rounded-2xl border p-4 shadow-sm shadow-primary/5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-primary/55 uppercase tracking-wider">{label}</p>
        <InfoHint text={hint} />
      </div>
      <p className={`text-2xl font-bold mt-1 ${valueClass}`}>{value}</p>
    </div>
  );
}

/* ── Helpers ── */

function formatDuration(ms) {
  if (!ms || ms <= 0) return "—";
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remMin = minutes % 60;
  return `${hours}h ${remMin}m`;
}

function shortDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function shortMonth(monthKey) {
  const d = new Date(`${monthKey}-01T00:00:00`);
  return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

function formatBillingRole(role) {
  if (role === "customer_admin") return "Clientes";
  if (role === "admin") return "Administradores";
  return "Desconhecido";
}

function formatBRL(value = 0) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/* ── Main component ──
 *
 * `mode` = "super_admin" | "admin"
 *   - super_admin: shows orgBreakdown bar chart
 *   - admin:       shows areaBreakdown bar chart
 *
 * Reads the unified analytics shape returned by buildPickupAnalytics():
 *   - statusDistribution, categoryDistribution, levelDistribution
 *   - dailyTrend, hourlyDistribution, topDrivers
 *   - orgBreakdown OR areaBreakdown
 */
function AnalyticsCharts({ analyticsData, billingSummary = EMPTY_OBJECT, mode = "super_admin" }) {
  const { theme } = useDashboardTheme();
  const isDark = theme === "dark";
  const chartText = isDark ? themeColor("chartDarkText") : themeColor("chartText");
  const chartMuted = isDark ? themeColor("chartDarkMuted") : themeColor("chartMuted");
  const chartGrid = isDark ? alpha(themeColor("chartDarkText"), 0.12) : themeColor("chartGrid");

  const {
    statusDistribution = EMPTY_ARRAY,
    categoryDistribution = EMPTY_ARRAY,
    levelDistribution = EMPTY_ARRAY,
    dailyTrend = EMPTY_ARRAY,
    monthlyRevenue = EMPTY_ARRAY,
    hourlyDistribution = EMPTY_ARRAY,
    topDrivers = EMPTY_ARRAY,
    orgBreakdown = EMPTY_ARRAY,
    areaBreakdown = EMPTY_ARRAY,
    ecosystemStats = EMPTY_OBJECT,
    scheduleAnalytics = EMPTY_OBJECT,
  } = analyticsData || EMPTY_OBJECT;

  const isSuperAdmin = mode === "super_admin";
  const breakdown = isSuperAdmin ? orgBreakdown : areaBreakdown;
  const monthlyBillRevenue = billingSummary?.monthlyRevenue || EMPTY_ARRAY;
  const billRoleRevenue = billingSummary?.roleRevenue || EMPTY_ARRAY;
  const scheduleSummary = scheduleAnalytics.summary || EMPTY_OBJECT;
  const scheduleTrend = scheduleAnalytics.dailyTrend || EMPTY_ARRAY;
  const scheduledAreas = scheduleAnalytics.areaBreakdown || EMPTY_ARRAY;
  const scheduledDrivers = scheduleAnalytics.topDrivers || EMPTY_ARRAY;
  const hasScheduleData = (scheduleSummary.totalAssignments || 0) > 0 || scheduleTrend.length > 0;

  /* ── Daily trend (line) ── */
  const trendData = useMemo(() => ({
    labels: dailyTrend.map((d) => shortDate(d.date)),
    datasets: [
      {
        label: "Criadas",
        data: dailyTrend.map((d) => d.created),
        borderColor: themeColor("info"),
        backgroundColor: alpha(themeColor("info"), 0.12),
        fill: true,
        tension: 0.4,
        pointRadius: 3,
      },
      {
        label: "Concluídas",
        data: dailyTrend.map((d) => d.completed),
        borderColor: themeColor("successStrong"),
        backgroundColor: alpha(themeColor("successStrong"), 0.12),
        fill: true,
        tension: 0.4,
        pointRadius: 3,
      },
      {
        label: "Canceladas",
        data: dailyTrend.map((d) => d.cancelled),
        borderColor: themeColor("danger"),
        backgroundColor: alpha(themeColor("danger"), 0.1),
        fill: true,
        tension: 0.4,
        pointRadius: 3,
      },
    ],
  }), [dailyTrend]);

  /* ── Status doughnut ── */
  const statusData = useMemo(() => ({
    labels: statusDistribution.map((s) => STATUS_LABELS[s.status] || s.status),
    datasets: [
      {
        data: statusDistribution.map((s) => s.count),
        backgroundColor: statusDistribution.map((s) => STATUS_COLORS[s.status] || themeColor("muted")),
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  }), [statusDistribution]);

  /* ── Category doughnut ── */
  const categoryData = useMemo(() => ({
    labels: categoryDistribution.map((c) =>
      CATEGORY_LABELS[c.category] || "Desconhecido"
    ),
    datasets: [
      {
        data: categoryDistribution.map((c) => c.count),
        backgroundColor: categoryDistribution.map((c) => CATEGORY_COLORS[c.category] || themeColor("muted")),
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  }), [categoryDistribution]);

  /* ── Level doughnut ── */
  const levelData = useMemo(() => ({
    labels: levelDistribution.map((l) =>
      LEVEL_LABELS[l.level] || "Desconhecido"
    ),
    datasets: [
      {
        data: levelDistribution.map((l) => l.count),
        backgroundColor: levelDistribution.map((l) => LEVEL_COLORS[l.level] || themeColor("muted")),
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  }), [levelDistribution]);

  /* ── Hour-of-day bar ── */
  const hourlyData = useMemo(() => {
    const byHour = Array(24).fill(0);
    hourlyDistribution.forEach((h) => { byHour[h.hour] = h.count; });
    return {
      labels: byHour.map((_, i) => `${i.toString().padStart(2, "0")}:00`),
      datasets: [
        {
          label: "Coletas",
          data: byHour,
          backgroundColor: themeColor("primary"),
          borderRadius: 4,
        },
      ],
    };
  }, [hourlyDistribution]);

  /* ── Breakdown bar (orgs OR areas) ── */
  const breakdownData = useMemo(() => ({
    labels: breakdown.map((b) => b.name || "Sem nome"),
    datasets: [
      {
        label: "Coletas totais",
        data: breakdown.map((b) => b.total),
        backgroundColor: themeColor("info"),
        borderRadius: 6,
      },
      {
        label: "Concluídas",
        data: breakdown.map((b) => b.completed),
        backgroundColor: themeColor("successStrong"),
        borderRadius: 6,
      },
    ],
  }), [breakdown]);

  const orgRevenueData = useMemo(() => ({
    labels: orgBreakdown.map((org) => org.name || "Sem nome"),
    datasets: [
      {
        label: "Receita",
        data: orgBreakdown.map((org) => org.revenue || 0),
        backgroundColor: themeColor("success"),
        borderRadius: 6,
      },
    ],
  }), [orgBreakdown]);

  const monthlyRevenueData = useMemo(() => ({
    labels: monthlyRevenue.map((row) => shortMonth(row.month)),
    datasets: [
      {
        label: "Receita",
        data: monthlyRevenue.map((row) => row.revenue || 0),
        borderColor: themeColor("success"),
        backgroundColor: alpha(themeColor("success"), 0.14),
        fill: true,
        tension: 0.35,
        pointRadius: 3,
      },
    ],
  }), [monthlyRevenue]);

  const revenueComparisonData = useMemo(() => {
    const monthKeys = Array.from(
      new Set([
        ...monthlyRevenue.map((row) => row.month),
        ...monthlyBillRevenue.map((row) => row.month),
      ])
    ).sort();
    const pickupByMonth = new Map(monthlyRevenue.map((row) => [row.month, row.revenue || 0]));
    const billByMonth = new Map(monthlyBillRevenue.map((row) => [row.month, row.revenue || 0]));

    return {
      labels: monthKeys.map((month) => shortMonth(month)),
      datasets: [
        {
          label: "Receita de coletas",
          data: monthKeys.map((month) => pickupByMonth.get(month) || 0),
          borderColor: themeColor("success"),
          backgroundColor: alpha(themeColor("success"), 0.12),
          fill: true,
          tension: 0.35,
          pointRadius: 3,
        },
        {
          label: "Mensalidades",
          data: monthKeys.map((month) => billByMonth.get(month) || 0),
          borderColor: themeColor("info"),
          backgroundColor: alpha(themeColor("info"), 0.1),
          fill: true,
          tension: 0.35,
          pointRadius: 3,
        },
      ],
    };
  }, [monthlyRevenue, monthlyBillRevenue]);

  const billRoleRevenueData = useMemo(() => ({
    labels: billRoleRevenue.map((row) => formatBillingRole(row.role)),
    datasets: [
      {
        label: "Receita mensal",
        data: billRoleRevenue.map((row) => row.revenue || 0),
        backgroundColor: [themeColor("info"), themeColor("violet"), themeColor("muted")],
        borderRadius: 6,
      },
    ],
  }), [billRoleRevenue]);

  const revenueOptions = {
    ...cartesianOptions,
    plugins: {
      ...cartesianOptions.plugins,
      legend: {
        ...cartesianOptions.plugins.legend,
        labels: {
          ...cartesianOptions.plugins.legend.labels,
          color: chartText,
        },
      },
      tooltip: {
        ...cartesianOptions.plugins.tooltip,
        callbacks: {
          label: (ctx) => `Receita: ${formatBRL(ctx.raw || 0)}`,
        },
      },
    },
    scales: {
      x: {
        ...cartesianOptions.scales.x,
        ticks: { ...cartesianOptions.scales.x.ticks, color: chartMuted },
      },
      y: {
        ...cartesianOptions.scales.y,
        grid: { ...cartesianOptions.scales.y.grid, color: chartGrid },
        ticks: {
          ...cartesianOptions.scales.y.ticks,
          color: chartMuted,
          callback: (value) => formatBRL(value),
        },
      },
    },
  };

  const orgRevenueOptions = {
    ...revenueOptions,
    indexAxis: "y",
    scales: {
      x: {
        ...revenueOptions.scales.x,
        grid: { ...cartesianOptions.scales.y.grid, color: chartGrid },
        ticks: {
          ...revenueOptions.scales.x.ticks,
          color: chartMuted,
          callback: (value) => formatBRL(value),
        },
      },
      y: {
        ...revenueOptions.scales.y,
        grid: { display: false },
        ticks: { ...cartesianOptions.scales.y.ticks, color: chartMuted },
      },
    },
  };

  const billRoleRevenueOptions = {
    ...orgRevenueOptions,
    plugins: {
      ...orgRevenueOptions.plugins,
      tooltip: {
        ...orgRevenueOptions.plugins.tooltip,
        callbacks: {
          label: (ctx) => {
            const row = billRoleRevenue[ctx.dataIndex];
            const paidBills = row?.paidBills || 0;
            return `Receita: ${formatBRL(ctx.raw || 0)} (${paidBills} cobranças pagas)`;
          },
        },
      },
    },
  };

  const horizontalBarOptions = {
    ...cartesianOptions,
    plugins: {
      ...cartesianOptions.plugins,
      legend: {
        ...cartesianOptions.plugins.legend,
        labels: {
          ...cartesianOptions.plugins.legend.labels,
          color: chartText,
        },
      },
    },
    scales: {
      x: {
        ...cartesianOptions.scales.x,
        ticks: { ...cartesianOptions.scales.x.ticks, color: chartMuted },
      },
      y: {
        ...cartesianOptions.scales.y,
        grid: { ...cartesianOptions.scales.y.grid, color: chartGrid },
        ticks: { ...cartesianOptions.scales.y.ticks, color: chartMuted },
      },
    },
    indexAxis: "y",
  };

  const themedCartesianOptions = {
    ...cartesianOptions,
    plugins: {
      ...cartesianOptions.plugins,
      legend: {
        ...cartesianOptions.plugins.legend,
        labels: {
          ...cartesianOptions.plugins.legend.labels,
          color: chartText,
        },
      },
    },
    scales: {
      x: {
        ...cartesianOptions.scales.x,
        ticks: { ...cartesianOptions.scales.x.ticks, color: chartMuted },
      },
      y: {
        ...cartesianOptions.scales.y,
        grid: { ...cartesianOptions.scales.y.grid, color: chartGrid },
        ticks: { ...cartesianOptions.scales.y.ticks, color: chartMuted },
      },
    },
  };

  const themedDoughnutOptions = {
    ...doughnutOptions,
    plugins: {
      ...doughnutOptions.plugins,
      legend: {
        ...doughnutOptions.plugins.legend,
        labels: {
          ...doughnutOptions.plugins.legend.labels,
          color: chartText,
        },
      },
    },
  };

  /* Scheduled collection trend from MLSchedule assignments */
  const scheduleTrendData = useMemo(() => ({
    labels: scheduleTrend.map((d) => shortDate(d.date)),
    datasets: [
      {
        label: "Atribuídas",
        data: scheduleTrend.map((d) => d.assigned || 0),
        backgroundColor: themeColor("info"),
        borderRadius: 6,
      },
      {
        label: "Concluídas",
        data: scheduleTrend.map((d) => d.completed || 0),
        backgroundColor: themeColor("successStrong"),
        borderRadius: 6,
      },
    ],
  }), [scheduleTrend]);

  const scheduledAreaData = useMemo(() => ({
    labels: scheduledAreas.map((a) => a.name || "Sem nome"),
    datasets: [
      {
        label: "Atribuídas",
        data: scheduledAreas.map((a) => a.assigned || 0),
        backgroundColor: themeColor("info"),
        borderRadius: 6,
      },
      {
        label: "Concluídas",
        data: scheduledAreas.map((a) => a.completed || 0),
        backgroundColor: themeColor("successStrong"),
        borderRadius: 6,
      },
    ],
  }), [scheduledAreas]);

  /* ── Render ── */
  return (
    <div className="space-y-6">
      {/* Headline KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Receita de coletas" value={formatBRL(ecosystemStats.totalRevenue || 0)} hint="Receita contabilizada apenas em coletas concluídas." />
        <KpiCard label="Receita mensal" value={formatBRL(billingSummary?.totalRevenue || 0)} valueClass="text-blue-600" hint="Receita recebida de mensalidades pagas." />
        <KpiCard label="Cobranças em aberto" value={formatBRL(billingSummary?.totalOutstanding || 0)} valueClass="text-amber-600" hint="Valor ainda em aberto em cobranças não pagas, vencidas ou pendentes." />
        <KpiCard label="Taxa de conclusão" value={`${ecosystemStats.completionRate || 0}%`} valueClass="text-emerald-600" hint="Coletas concluídas divididas pelo total criado." />
        <KpiCard label="Resposta média" value={formatDuration(ecosystemStats.avgResponseMs)} valueClass="text-violet-600" hint="Tempo médio entre criação do pedido e resposta do coletor." />
        <KpiCard label="Duração média" value={formatDuration(ecosystemStats.avgTaskDurationMs)} valueClass="text-cyan-600" hint="Tempo médio entre aceite e conclusão da coleta." />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)] gap-6">
        <ChartCard
          title="Receita por coletas e mensalidades"
          subtitle="Compara coletas pagas e cobranças mensais pagas"
          hint="Compara as duas fontes de receita do painel por mês."
        >
          <div className="h-72">
            {monthlyRevenue.length > 0 || monthlyBillRevenue.length > 0 ? (
              <LazyChart type="line" data={revenueComparisonData} options={revenueOptions} />
            ) : (
              <EmptyState message="Sem receita de coletas ou mensalidades ainda" />
            )}
          </div>
        </ChartCard>

        <ChartCard
          title="Receita mensal"
          subtitle="Cobranças pagas por perfil"
          hint="Mostra de onde vem a receita mensal paga."
        >
          <div className="h-72">
            {billRoleRevenue.some((row) => (row.revenue || 0) > 0) ? (
              <LazyChart type="bar" data={billRoleRevenueData} options={billRoleRevenueOptions} />
            ) : (
              <EmptyState message="Sem mensalidades pagas ainda" />
            )}
          </div>
        </ChartCard>
      </div>

      {/* Scheduled collection work from ML schedule assignments */}
      {hasScheduleData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label="Serviços agendados" value={(scheduleSummary.totalAssignments || 0).toLocaleString()} hint="Atribuições de coletor criadas pela agenda IA." />
            <KpiCard label="Agenda concluída" value={(scheduleSummary.completedAssignments || 0).toLocaleString()} valueClass="text-emerald-600" hint="Atribuições marcadas como concluídas." />
            <KpiCard label="Taxa da agenda" value={`${scheduleSummary.completionRate || 0}%`} valueClass="text-blue-600" hint="Atribuições concluídas em relação ao total agendado." />
            <KpiCard label="Resíduo previsto" value={`${(scheduleSummary.predictedWasteKg || 0).toLocaleString()} kg`} valueClass="text-violet-600" hint="Total de resíduos previsto nas áreas da agenda IA." />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Tendência das coletas agendadas"
              subtitle="Atribuídas vs concluídas pela agenda IA"
              hint="Compara o trabalho gerado pela IA com o volume finalizado por dia."
            >
              <div className="h-72">
                {scheduleTrend.length > 0 ? (
                  <LazyChart type="bar" data={scheduleTrendData} options={themedCartesianOptions} />
                ) : (
                  <EmptyState message="Sem trabalho agendado nos últimos 30 dias" />
                )}
              </div>
            </ChartCard>

            <ChartCard
              title="Areas agendadas"
              subtitle="Onde as coletas planejadas foram concluídas"
              hint="Mostra as áreas que recebem trabalho agendado e quanto foi concluído."
            >
              <div className="h-72">
                {scheduledAreas.length > 0 ? (
                  <LazyChart type="bar" data={scheduledAreaData} options={horizontalBarOptions} />
                ) : (
                  <EmptyState message="Sem conclusões por área ainda" />
                )}
              </div>
            </ChartCard>
          </div>

          {scheduledDrivers.length > 0 && topDrivers.length === 0 && (
            <ChartCard title="Conclusões por coletor" subtitle="Por áreas agendadas concluídas" hint="Ordena coletores pelas áreas agendadas concluídas.">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-primary/50 uppercase tracking-wider border-b border-primary/10">
                      <th className="pb-3 pr-4">#</th>
                      <th className="pb-3 pr-4">Coletor</th>
                      <th className="pb-3 pr-4 text-right">Atribuídas</th>
                      <th className="pb-3 text-right">Concluídas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduledDrivers.map((d, i) => (
                      <tr key={d.driverId || d.name || i} className="border-b border-primary/5 last:border-0">
                        <td className="py-3 pr-4 text-primary/50 font-medium">{i + 1}</td>
                        <td className="py-3 pr-4 font-semibold text-primary">{d.name}</td>
                        <td className="py-3 pr-4 text-right text-primary/70">{d.assigned || 0}</td>
                        <td className="py-3 text-right font-semibold text-primary">{d.completed || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          )}
        </div>
      )}

      {/* Daily trend (full width) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard
          title="Tendência diária de coletas"
          subtitle="Criadas vs concluídas vs canceladas - últimos 30 dias"
          hint="Acompanha volume diário e resultado das coletas para encontrar quedas ou cancelamentos."
        >
          <div className="h-72 w-full">
            {dailyTrend.length > 0 ? (
              <LazyChart type="line" data={trendData} options={themedCartesianOptions} />
            ) : (
              <EmptyState message="Sem atividade de coletas nos últimos 30 dias" />
            )}
          </div>
        </ChartCard>

        {isSuperAdmin ? (
          <ChartCard
            title="Receita por cooperativa"
            subtitle="Receita de coletas pagas concluídas por organização"
            hint="Ordena cooperativas pela receita gerada em coletas pagas concluídas."
          >
            <div className="h-72">
              {orgBreakdown.some((org) => (org.revenue || 0) > 0) ? (
                <LazyChart type="bar" data={orgRevenueData} options={orgRevenueOptions} />
              ) : (
                <EmptyState message="Sem receita por cooperativa ainda" />
              )}
            </div>
          </ChartCard>
        ) : (
          <ChartCard
            title="Receita mensal"
            subtitle="Receita de coletas pagas concluídas da sua organização"
            hint="Mostra a receita mensal gerada pela sua operação."
          >
            <div className="h-72">
              {monthlyRevenue.length > 0 ? (
                <LazyChart type="line" data={monthlyRevenueData} options={revenueOptions} />
              ) : (
                <EmptyState message="Sem receita mensal ainda" />
              )}
            </div>
          </ChartCard>
        )}
      </div>

      {/* Status + Category + Level doughnuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ChartCard title="Distribuição por status" subtitle="Onde as coletas estão agora" hint="Distribuição das coletas pelo status atual do fluxo.">
          <div className="h-60">
            {statusDistribution.length > 0 ? (
              <LazyChart type="doughnut" data={statusData} options={themedDoughnutOptions} />
            ) : (
              <EmptyState message="Sem coletas ainda" />
            )}
          </div>
        </ChartCard>

        <ChartCard title="Por tipo" subtitle="Reciclável vs não reciclável" hint="Como os clientes classificam resíduos ao solicitar coleta.">
          <div className="h-60">
            {categoryDistribution.length > 0 ? (
              <LazyChart type="doughnut" data={categoryData} options={themedDoughnutOptions} />
            ) : (
              <EmptyState message="Sem dados por tipo" />
            )}
          </div>
        </ChartCard>

        <ChartCard title="Por complexidade" subtitle="Simples / média / complexa" hint="Mix de dificuldade das coletas para planejar carga de trabalho e coletores.">
          <div className="h-60">
            {levelDistribution.length > 0 ? (
              <LazyChart type="doughnut" data={levelData} options={themedDoughnutOptions} />
            ) : (
              <EmptyState message="Sem dados de complexidade" />
            )}
          </div>
        </ChartCard>
      </div>

      {/* Hourly distribution + breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Atividade por hora"
          subtitle="Quando os clientes solicitam coletas (24h)"
          hint="Mostra os horários de maior demanda ao longo do dia."
        >
          <div className="h-72">
            {hourlyDistribution.length > 0 ? (
              <LazyChart type="bar" data={hourlyData} options={themedCartesianOptions} />
            ) : (
              <EmptyState message="Sem dados por hora" />
            )}
          </div>
        </ChartCard>

        <ChartCard
          title={isSuperAdmin ? "Top cooperativas" : "Top áreas"}
          subtitle={isSuperAdmin ? "Volume de coletas por organização" : "Volume de coletas por área"}
          hint={isSuperAdmin ? "Ordena organizações por atividade de coleta." : "Ordena áreas de atendimento por atividade de coleta."}
        >
          <div className="h-72">
            {breakdown.length > 0 ? (
              <LazyChart type="bar" data={breakdownData} options={horizontalBarOptions} />
            ) : (
              <EmptyState message={isSuperAdmin ? "Sem cooperativas com coletas" : "Sem dados por área"} />
            )}
          </div>
        </ChartCard>
      </div>

      {/* Top drivers leaderboard */}
      <ChartCard title="Top coletores" subtitle="Por coletas concluídas" hint="Coletores com maior volume de coletas concluídas, receita e médias de tempo.">
        {topDrivers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-primary/50 uppercase tracking-wider border-b border-primary/10">
                  <th className="pb-3 pr-4">#</th>
                  <th className="pb-3 pr-4">Coletor</th>
                  <th className="pb-3 pr-4 text-right">Concluídas</th>
                  <th className="pb-3 pr-4 text-right">Receita</th>
                  <th className="pb-3 pr-4 text-right">Resposta média</th>
                  <th className="pb-3 text-right">Duração média</th>
                </tr>
              </thead>
              <tbody>
                {topDrivers.map((d, i) => (
                  <tr key={d.driverId || i} className="border-b border-primary/5 last:border-0">
                    <td className="py-3 pr-4 text-primary/50 font-medium">{i + 1}</td>
                    <td className="py-3 pr-4">
                      <p className="font-semibold text-primary">{d.name}</p>
                      {d.email && <p className="text-xs text-primary/50">{d.email}</p>}
                    </td>
                    <td className="py-3 pr-4 text-right font-semibold text-primary">{d.completed}</td>
                    <td className="py-3 pr-4 text-right text-primary/70">{formatBRL(d.revenue || 0)}</td>
                    <td className="py-3 pr-4 text-right text-primary/70">{formatDuration(d.avgResponseMs)}</td>
                    <td className="py-3 text-right text-primary/70">{formatDuration(d.avgTaskDurationMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="Sem atividade de coletores ainda" />
        )}
      </ChartCard>
    </div>
  );
}

export default AnalyticsCharts;
