import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Upload,
  CalendarDays,
  ArrowRight,
  Receipt,
  Truck,
  AlertTriangle,
} from "lucide-react";
import api from "../../utils/api";
import useAuthStore from "../../stores/useAuthStore";
import useBillingStore from "../../stores/useBillingStore";
import TruckLoader from "../shared/TruckLoader";
import { getSocket } from "../../utils/socket";
import LazyChart from "../charts/LazyChart";
import { ecorouteImages } from "../../assets/ecorouteImages";
import { alpha, themeColor } from "../../utils/themeColors";

/* ── Viewport observer (same pattern as OurTeam / SchedulePage) ── */

function useInView() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.unobserve(el);
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

function FadeIn({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

/* ── Constants ── */

const DASHBOARD_BG = ecorouteImages.cooperativeSorting;

const STATUS_COLORS = {
  PAYMENT_REQUIRED: themeColor("orange"),
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

const STATUS_LABELS = {
  PAYMENT_REQUIRED: "Pagamento pendente",
  PENDING: "Pendente",
  ASSIGNED: "Atribuída",
  EN_ROUTE: "Em rota",
  ARRIVED: "No local",
  COLLECTING: "Coletando",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
  EXPIRED: "Expirada",
  REJECTED: "Rejeitada",
};

const CATEGORY_LABELS = {
  recyclable: "Recicláveis",
  "non-recyclable": "Não recicláveis",
  both: "Mistos",
};

const LEVEL_LABELS = {
  easy: "Leve",
  medium: "Média",
  hard: "Alta",
};

const DEMO_DASHBOARD_DATA = {
  stats: {
    total: 8,
    totalSpent: 426,
    statusCounts: {
      COMPLETED: 4,
      PENDING: 2,
      ASSIGNED: 1,
      CANCELLED: 1,
    },
    categoryCounts: {
      recyclable: 4,
      "non-recyclable": 1,
      both: 3,
    },
    levelCounts: {
      easy: 4,
      medium: 3,
      hard: 1,
    },
    monthly: [
      { month: "2026-03", created: 1, completed: 1, cancelled: 0 },
      { month: "2026-04", created: 2, completed: 1, cancelled: 0 },
      { month: "2026-05", created: 2, completed: 1, cancelled: 1 },
      { month: "2026-06", created: 3, completed: 1, cancelled: 0 },
    ],
  },
  pickups: [
    {
      id: "ECO-2048",
      status: "PENDING",
      category: "recyclable",
      level: "easy",
      createdAt: "2026-07-05T14:00:00.000Z",
      location: { address: "Rua Augusta, 1200 - Consolação, São Paulo" },
    },
    {
      id: "ECO-1981",
      status: "ASSIGNED",
      category: "both",
      level: "medium",
      createdAt: "2026-07-02T10:00:00.000Z",
      location: { address: "Av. Paulista, 900 - Bela Vista, São Paulo" },
    },
    {
      id: "ECO-1872",
      status: "COMPLETED",
      category: "recyclable",
      level: "easy",
      createdAt: "2026-06-24T09:30:00.000Z",
      location: { address: "Rua Vergueiro, 3100 - Vila Mariana, São Paulo" },
    },
  ],
};

/* ── Stat card ── */

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="group bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 text-center hover:bg-white/10 hover:border-white/20 transition-all duration-300">
      <div
        className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center"
        style={{ backgroundColor: `${accent}20` }}
      >
        <Icon size={20} style={{ color: accent }} />
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-white">{value}</p>
      <p className="text-white/50 text-sm mt-1 font-medium">{label}</p>
    </div>
  );
}

/* ── Chart card (glassmorphism) ── */

function ChartCard({ title, children, className = "" }) {
  return (
    <div
      className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 sm:p-6 hover:border-white/15 transition-all duration-300 ${className}`}
    >
      <h3 className="mb-4 text-xs font-semibold text-white/40 uppercase tracking-widest flex items-center gap-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

/* ── Recent pickup row ── */

function RecentPickupRow({ pickup, onCancel, onCompletePayment }) {
  const statusColor = STATUS_COLORS[pickup.status] || themeColor("muted");
  const [cancelling, setCancelling] = useState(false);
  const pickupId = pickup.id || pickup._id;
  const needsPayment = pickup.status === "PAYMENT_REQUIRED";
  const canCancel =
    needsPayment || pickup.status === "PENDING" || pickup.status === "ASSIGNED";

  const handleCancel = async (e) => {
    e.stopPropagation();
    if (!window.confirm("Cancelar esta solicitação de coleta?")) return;
    setCancelling(true);
    try {
      await api.post(`/pickups/${pickup.id}/cancel`);
      onCancel?.(pickup.id);
    } catch (err) {
      alert(err.response?.data?.message || "Não foi possível cancelar a coleta");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="group flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white truncate font-['Outfit',sans-serif]">
          {pickup.location?.address || pickup.area || "Solicitação de coleta"}
        </p>
        <p className="text-xs text-white/40 mt-0.5 font-['Outfit',sans-serif]">
          {new Date(pickup.createdAt).toLocaleDateString("pt-BR", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
          {" · "}
          {CATEGORY_LABELS[pickup.category] || pickup.category}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {needsPayment && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCompletePayment?.(pickupId);
            }}
            className="rounded-lg px-2.5 py-1 text-[11px] font-semibold border border-orange-500/30 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20 transition"
          >
            Pagar
          </button>
        )}
        {canCancel && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="rounded-lg px-2.5 py-1 text-[11px] font-semibold border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelling ? "Cancelando..." : "Cancelar"}
          </button>
        )}
        <span
          className="rounded-lg px-2.5 py-1 text-[11px] font-semibold border"
          style={{
            color: statusColor,
            backgroundColor: `${statusColor}15`,
            borderColor: `${statusColor}30`,
          }}
        >
          {STATUS_LABELS[pickup.status] || pickup.status}
        </span>
      </div>
    </div>
  );
}

/* ── Empty chart placeholder ── */

function EmptyChart({ message }) {
  return (
    <div className="flex h-52 items-center justify-center">
      <p className="text-sm text-white/30 font-['Outfit',sans-serif]">
        {message}
      </p>
    </div>
  );
}

/* ── Main component ── */

function CustomerDashboard({ previewMode = false, previewUser = null }) {
  const navigate = useNavigate();
  const { user: authUser } = useAuthStore();
  const user = previewUser || authUser;
  const {
    bills,
    summary: billingSummary,
    fetchMyBills,
    payBill,
  } = useBillingStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [billingPayingId, setBillingPayingId] = useState(null);
  const demoPreview =
    previewMode ||
    (import.meta.env.DEV && localStorage.getItem("ecoroute-demo-auth") === "1");

  // Single source of truth for fetching dashboard data.
  // Stable across renders so socket / focus listeners can call it without
  // re-registering, and so that we never patch stats locally and drift out
  // of sync with the server (which caused "stats reset after payment" since
  // the old socket handler only updated statusCounts and not totalSpent /
  // monthly / category / level / total).
  const fetchDashboard = useRef(null);
  fetchDashboard.current = async ({ showLoader = false } = {}) => {
    try {
      if (showLoader) setLoading(true);
      if (demoPreview) {
        setData(DEMO_DASHBOARD_DATA);
        setError(null);
        return;
      }
      const res = await api.get("/pickups/my-pickups");
      setData(res.data);
      setError(null);
    } catch (err) {
      if (import.meta.env.DEV) {
        setData(DEMO_DASHBOARD_DATA);
        setError(null);
        return;
      }
      setError(err.response?.data?.message || "Não foi possível carregar o painel");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDashboard.current({ showLoader: true });
    if (!demoPreview) fetchMyBills();
  }, [demoPreview, fetchMyBills]);

  // ── Realtime: keep dashboard in sync via WebSocket ───────────────────────
  // Any pickup event that could affect this customer's stats triggers a full
  // refetch. This is cheaper than reasoning about partial patches and
  // guarantees totalSpent / monthly / category / level / status counts all
  // stay consistent with the server (especially after payment completion).
  useEffect(() => {
    if (demoPreview) return undefined;

    const socket = getSocket();
    const refetch = () => fetchDashboard.current();

    socket.on("pickup:statusUpdate", refetch);
    socket.on("pickup:accepted", refetch);
    socket.on("pickup:created", refetch);
    socket.on("pickup:cancelled", refetch);
    socket.on("payment:updated", refetch);

    return () => {
      socket.off("pickup:statusUpdate", refetch);
      socket.off("pickup:accepted", refetch);
      socket.off("pickup:created", refetch);
      socket.off("pickup:cancelled", refetch);
      socket.off("payment:updated", refetch);
    };
  }, [demoPreview]);

  // Refetch when the tab regains focus / becomes visible.
  // This catches the Pix redirect flow: customer leaves the SPA for the
  // hosted checkout, comes back to /payment-success, then to the dashboard.
  // Without this, any cached dashboard state would look stale ("reset").
  useEffect(() => {
    const onFocus = () => {
      fetchDashboard.current();
      if (!demoPreview) fetchMyBills();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        fetchDashboard.current();
        if (!demoPreview) fetchMyBills();
      }
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [demoPreview, fetchMyBills]);

  const stats = data?.stats;
  const pickups = data?.pickups || [];

  // Chart data
  const statusChartData = useMemo(() => {
    if (!stats?.statusCounts) return null;
    const entries = Object.entries(stats.statusCounts);
    return {
      labels: entries.map(([k]) => STATUS_LABELS[k] || k),
      datasets: [
        {
          data: entries.map(([, v]) => v),
          backgroundColor: entries.map(([k]) => STATUS_COLORS[k] || themeColor("muted")),
          borderWidth: 0,
          spacing: 3,
        },
      ],
    };
  }, [stats]);

  const categoryChartData = useMemo(() => {
    if (!stats?.categoryCounts) return null;
    const entries = Object.entries(stats.categoryCounts);
    return {
      labels: entries.map(([k]) => CATEGORY_LABELS[k] || k),
      datasets: [
        {
          data: entries.map(([, v]) => v),
          backgroundColor: entries.map(
            ([k]) => CATEGORY_COLORS[k] || themeColor("muted"),
          ),
          borderWidth: 0,
          spacing: 3,
        },
      ],
    };
  }, [stats]);

  const levelChartData = useMemo(() => {
    if (!stats?.levelCounts) return null;
    const entries = Object.entries(stats.levelCounts);
    return {
      labels: entries.map(([k]) => LEVEL_LABELS[k] || k),
      datasets: [
        {
          data: entries.map(([, v]) => v),
          backgroundColor: entries.map(([k]) => LEVEL_COLORS[k] || themeColor("muted")),
          borderWidth: 0,
          spacing: 3,
        },
      ],
    };
  }, [stats]);

  const monthlyChartData = useMemo(() => {
    if (!stats?.monthly?.length) return null;
    const months = stats.monthly.map((m) => {
      const [y, mo] = m.month.split("-");
      return new Date(y, mo - 1).toLocaleDateString("pt-BR", {
        month: "short",
      });
    });
    return {
      labels: months,
      datasets: [
        {
          label: "Criadas",
          data: stats.monthly.map((m) => m.created),
          borderColor: themeColor("info"),
          backgroundColor: alpha(themeColor("info"), 0.1),
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: themeColor("info"),
        },
        {
          label: "Concluídas",
          data: stats.monthly.map((m) => m.completed),
          borderColor: themeColor("successStrong"),
          backgroundColor: alpha(themeColor("successStrong"), 0.1),
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: themeColor("successStrong"),
        },
        {
          label: "Canceladas",
          data: stats.monthly.map((m) => m.cancelled),
          borderColor: themeColor("danger"),
          backgroundColor: alpha(themeColor("danger"), 0.08),
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: themeColor("danger"),
        },
      ],
    };
  }, [stats]);

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "65%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 10,
          font: { size: 12, family: "'Outfit', sans-serif" },
          color: alpha(themeColor("white"), 0.5),
        },
      },
    },
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 10,
          font: { size: 12, family: "'Outfit', sans-serif" },
          color: alpha(themeColor("white"), 0.5),
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 12, family: "'Outfit', sans-serif" },
          color: alpha(themeColor("white"), 0.35),
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: { size: 12, family: "'Outfit', sans-serif" },
          color: alpha(themeColor("white"), 0.35),
        },
        grid: { color: alpha(themeColor("white"), 0.05) },
      },
    },
  };

  // Loading state
  if (loading) {
    return (
      <div className="relative min-h-screen font-['Outfit',sans-serif] bg-black">
        <div
          className="fixed inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${DASHBOARD_BG})` }}
        />
        <div className="fixed inset-0 z-0 bg-black/90 backdrop-blur-xs" />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <TruckLoader />
            <p className="text-sm text-white/50 font-medium">
              Carregando painel...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="relative min-h-screen font-['Outfit',sans-serif] bg-black">
        <div
          className="fixed inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${DASHBOARD_BG})` }}
        />
        <div className="fixed inset-0 z-0 bg-black/90 backdrop-blur-xs" />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen gap-4 px-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-red-400" />
          </div>
          <div className="text-center">
            <p className="text-red-300 text-lg font-semibold mb-1">
              Não foi possível carregar o painel
            </p>
            <p className="text-red-400/60 text-sm max-w-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const completed = stats?.statusCounts?.COMPLETED || 0;
  const cancelled = stats?.statusCounts?.CANCELLED || 0;
  const pending = stats?.statusCounts?.PENDING || 0;
  const active =
    (stats?.statusCounts?.ASSIGNED || 0) +
    (stats?.statusCounts?.EN_ROUTE || 0) +
    (stats?.statusCounts?.ARRIVED || 0) +
    (stats?.statusCounts?.COLLECTING || 0);

  return (
    <div className="relative min-h-screen font-['Outfit',sans-serif] bg-black">
      {/* ── Dynamic Background ── */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${DASHBOARD_BG})` }}
      />
      <div className="fixed inset-0 z-0 bg-black/90 backdrop-blur-xs" />

      {/* ── Content ── */}
      <div className="relative z-10 pt-24">
        {/* ── Hero header ── */}
        <section className="pb-8 sm:pb-12 px-6 md:px-16 lg:px-24 text-center">
          <FadeIn>
            <span className="inline-block text-white/50 text-xs font-semibold tracking-widest uppercase mb-4">
              Painel do cliente
            </span>
          </FadeIn>

          <FadeIn delay={100}>
            <h1 className="font-bold text-white text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.1] tracking-tight mb-6 drop-shadow-md">
              Olá, {user?.name?.split(" ")[0] || "cliente"}
            </h1>
          </FadeIn>

          <FadeIn delay={200}>
            <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed mb-6">
              Acompanhe suas solicitações de coleta, pagamentos e indicadores em um único lugar.
            </p>
          </FadeIn>

          {/* Quick actions */}
          <FadeIn delay={250}>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => navigate("/upload-waste")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg cursor-pointer"
              >
                <Upload size={16} />
                Solicitar coleta
              </button>
              <button
                onClick={() => navigate("/schedule")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
              >
                <CalendarDays size={16} />
                Ver agenda
              </button>
              <button
                onClick={() => navigate("/billing")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
              >
                <Receipt size={16} />
                Ver cobranças
              </button>
            </div>
          </FadeIn>
        </section>

        {/* ── Stat cards ── */}
        <section className="pb-8 px-6 md:px-16 lg:px-24">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              {
                icon: Package,
                value: stats?.total || 0,
                label: "Total de pedidos",
                accent: themeColor("info"),
              },
              {
                icon: CheckCircle2,
                value: completed,
                label: "Concluídas",
                accent: themeColor("successStrong"),
              },
              {
                icon: Truck,
                value: active,
                label: "Em andamento",
                accent: themeColor("indigo"),
              },
              {
                icon: Clock,
                value: pending,
                label: "Pendentes",
                accent: themeColor("warning"),
              },
              {
                icon: XCircle,
                value: cancelled,
                label: "Canceladas",
                accent: themeColor("danger"),
              },
            ].map((stat, i) => (
              <FadeIn key={stat.label} delay={300 + i * 80}>
                <StatCard {...stat} />
              </FadeIn>
            ))}
          </div>
        </section>

        {/* ── Billing Summary ── */}
        {billingSummary && billingSummary.unpaid > 0 && (
          <section className="pb-6 px-6 md:px-16 lg:px-24">
            <div className="max-w-5xl mx-auto">
              <FadeIn delay={450}>
                <div className="bg-white/5 backdrop-blur-md border border-amber-500/20 rounded-2xl p-5 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest flex items-center gap-2">
                      <Receipt size={14} /> Cobranças pendentes
                    </h3>
                    <button
                      onClick={() => navigate("/billing")}
                      className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition flex items-center gap-1"
                    >
                      Ver todas <ArrowRight size={12} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-amber-400">
                        {billingSummary.unpaid}
                      </p>
                      <p className="text-xs text-white/40 mt-0.5">
                        Cobranças abertas
                      </p>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-red-400">
                        R$ {(billingSummary.totalDue || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-white/40 mt-0.5">Total devido</p>
                    </div>
                  </div>

                  {/* Show up to 3 unpaid bills with quick-pay */}
                  <div className="space-y-2">
                    {bills
                      .filter(
                        (b) => ["UNPAID", "OVERDUE", "CASH_PENDING"].includes(b.status),
                      )
                      .slice(0, 3)
                      .map((bill) => {
                        const isOverdue = bill.status === "OVERDUE";
                        const isCashPending = bill.status === "CASH_PENDING";
                        const isPaying = billingPayingId === bill._id;
                        return (
                          <div
                            key={bill._id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10 transition-all"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-white">
                                {new Date(
                                  bill.billingYear,
                                  bill.billingMonth - 1,
                                ).toLocaleDateString("pt-BR", {
                                  month: "long",
                                  year: "numeric",
                                })}
                              </p>
                              <p className="text-xs text-white/40 mt-0.5">
                                Vencimento:{" "}
                                {new Date(bill.dueDate).toLocaleDateString(
                                  "pt-BR",
                                  { month: "short", day: "numeric" },
                                )}
                                {isOverdue && (
                                  <span className="text-red-400 ml-2 font-semibold">
                                    VENCIDA
                                  </span>
                                )}
                                {isCashPending && (
                                  <span className="text-blue-300 ml-2 font-semibold">
                                    DINHEIRO PENDENTE
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-white font-bold text-sm">
                                R$ {bill.amount.toLocaleString()}
                              </span>
                              {isCashPending ? (
                                <span className="rounded-lg px-3 py-1.5 text-[11px] font-semibold bg-blue-500/20 text-blue-200">
                                  Aguardando admin
                                </span>
                              ) : (
                                <button
                                  onClick={async () => {
                                    setBillingPayingId(bill._id);
                                    const result = await payBill(
                                      bill._id,
                                      "esewa",
                                    );
                                    if (result.redirecting) return;
                                    setBillingPayingId(null);
                                    if (!result.success)
                                      alert(result.error || "Pagamento falhou");
                                    else if (!demoPreview) fetchMyBills();
                                  }}
                                  disabled={isPaying}
                                  className="rounded-lg px-3 py-1.5 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isPaying ? "Processando..." : "Pagar com Pix"}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </FadeIn>
            </div>
          </section>
        )}

        {/* ── Charts row 1: Monthly trend + Status ── */}
        <section className="pb-6 px-6 md:px-16 lg:px-24">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
            <FadeIn delay={500} className="lg:col-span-2">
              <ChartCard title="Tendência mensal">
                {monthlyChartData ? (
                  <div className="h-64">
                    <LazyChart type="line" data={monthlyChartData} options={lineOptions} />
                  </div>
                ) : (
                  <EmptyChart message="Ainda sem dados mensais" />
                )}
              </ChartCard>
            </FadeIn>

            <FadeIn delay={580}>
              <ChartCard title="Status dos pedidos">
                {statusChartData ? (
                  <div className="h-64 flex items-center justify-center">
                    <LazyChart
                      type="doughnut"
                      data={statusChartData}
                      options={doughnutOptions}
                    />
                  </div>
                ) : (
                  <EmptyChart message="Ainda sem coletas" />
                )}
              </ChartCard>
            </FadeIn>
          </div>
        </section>

        {/* ── Charts row 2: Category + Level + Spending ── */}
        <section className="pb-6 px-6 md:px-16 lg:px-24">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            <FadeIn delay={620}>
              <ChartCard title="Por material">
                {categoryChartData ? (
                  <div className="h-52 flex items-center justify-center">
                    <LazyChart
                      type="doughnut"
                      data={categoryChartData}
                      options={doughnutOptions}
                    />
                  </div>
                ) : (
                  <EmptyChart message="Sem dados" />
                )}
              </ChartCard>
            </FadeIn>

            <FadeIn delay={660}>
              <ChartCard title="Por complexidade">
                {levelChartData ? (
                  <div className="h-52 flex items-center justify-center">
                    <LazyChart type="doughnut" data={levelChartData} options={doughnutOptions} />
                  </div>
                ) : (
                  <EmptyChart message="Sem dados" />
                )}
              </ChartCard>
            </FadeIn>

            <FadeIn delay={700}>
              <ChartCard title="Total gasto">
                <div className="flex h-52 flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                    <TrendingUp size={28} className="text-emerald-400/60" />
                  </div>
                  <p className="text-3xl font-bold text-white">
                    R$ {(stats?.totalSpent || 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-white/40 mt-1">
                    em coletas concluídas
                  </p>
                </div>
              </ChartCard>
            </FadeIn>
          </div>
        </section>

        {/* ── Recent pickups ── */}
        <section className="px-6 md:px-16 lg:px-24 pb-20">
          <div className="max-w-7xl mx-auto">
            <FadeIn delay={750}>
              <ChartCard title="Coletas recentes">
                {pickups.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {pickups.map((p) => (
                      <RecentPickupRow
                        key={p.id}
                        pickup={p}
                        onCancel={() => fetchDashboard.current()}
                        onCompletePayment={(id) =>
                          navigate(
                            `/searching?pickupId=${encodeURIComponent(id)}`,
                          )
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center mb-4">
                      <Package size={32} className="text-white/30" />
                    </div>
                    <p className="text-white/60 font-semibold text-lg mb-1">
                      Nenhuma coleta ainda
                    </p>
                    <p className="text-sm text-white/40 mb-6 max-w-md">
                      Solicite a primeira coleta para acompanhar a atividade aqui.
                    </p>
                    <button
                      onClick={() => navigate("/upload-waste")}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg cursor-pointer"
                    >
                      Solicitar coleta <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </ChartCard>
            </FadeIn>
          </div>
        </section>
      </div>
    </div>
  );
}

export default CustomerDashboard;
