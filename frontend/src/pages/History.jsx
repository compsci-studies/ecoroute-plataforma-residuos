import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";
import useMLScheduleStore from "../stores/useMLScheduleStore";
import api from "../utils/api";

const STATUS_COLORS = {
  COMPLETED: "bg-emerald-100 text-emerald-700",
  ASSIGNED: "bg-blue-100 text-blue-700",
  EN_ROUTE: "bg-indigo-100 text-indigo-700",
  ARRIVED: "bg-purple-100 text-purple-700",
  COLLECTING: "bg-amber-100 text-amber-700",
  CANCELLED: "bg-red-100 text-red-700",
  EXPIRED: "bg-gray-100 text-gray-500",
  PENDING: "bg-yellow-100 text-yellow-700",
};

const STATUS_LABELS = {
  COMPLETED: "Concluída",
  ASSIGNED: "Atribuída",
  EN_ROUTE: "Em rota",
  ARRIVED: "No local",
  COLLECTING: "Coletando",
  CANCELLED: "Cancelada",
  EXPIRED: "Expirada",
  PENDING: "Pendente",
  CREATED: "Criada",
  ACCEPTED: "Aceita",
  REJECTED: "Recusada",
};

const LEVEL_COLORS = {
  hard: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  easy: "bg-green-100 text-green-700",
};

const LEVEL_LABELS = {
  hard: "Alta",
  medium: "Média",
  easy: "Baixa",
};

const CATEGORY_LABELS = {
  recyclable: "Reciclável",
  "non-recyclable": "Rejeito",
  both: "Misto",
};

const AREA_TYPE_LABELS = {
  commercial: "Comercial",
  residential: "Residencial",
  suburban: "Bairro",
  rural: "Rural",
};

const ROLE_LABELS = {
  super_admin: "gestão geral",
  org_admin: "cooperativa",
  driver: "coletor",
  customer: "cliente",
  system: "sistema",
};

const TABS = [
  { id: "pickups", label: "Histórico de coletas" },
  { id: "completions", label: "Roteiros concluídos" },
  { id: "customers", label: "Clientes" },
  { id: "drivers", label: "Coletores" },
];

const fmt = (ms) => {
  if (!ms) return "--";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m < 60) return `${m}m ${rem}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
};

const History = () => {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === "super_admin";

  const [activeTab, setActiveTab] = useState("pickups");
  const [loading, setLoading] = useState(true);

  // Pickup history state
  const [pickups, setPickups] = useState([]);
  const [pickupStats, setPickupStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Customer history state
  const [customers, setCustomers] = useState([]);
  const [customerTotals, setCustomerTotals] = useState({});

  // Driver history state
  const [drivers, setDrivers] = useState([]);
  const [driverTotals, setDriverTotals] = useState({});

  // ML Schedule completions
  const { completions, fetchCompletions, loading: mlLoading } = useMLScheduleStore();

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  // Expanded row for audit trail
  const [expandedPickup, setExpandedPickup] = useState(null);
  const [auditEvents, setAuditEvents] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // Fetch pickup history
  useEffect(() => {
    if (activeTab !== "pickups") return;
    setLoading(true);
    const params = new URLSearchParams({ page: currentPage, limit: 10 });
    if (statusFilter) params.set("status", statusFilter);
    if (categoryFilter) params.set("category", categoryFilter);

    api.get(`/history/pickups?${params}`)
      .then((res) => {
        if (res.data.success) {
          setPickups(res.data.data.pickups);
          setPickupStats(res.data.data.stats);
          setPagination(res.data.data.pagination);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeTab, currentPage, statusFilter, categoryFilter]);

  // Fetch customer history
  useEffect(() => {
    if (activeTab !== "customers") return;
    setLoading(true);
    api.get('/history/customers')
      .then((res) => {
        if (res.data.success) {
          setCustomers(res.data.data.customers);
          setCustomerTotals({
            totalCustomers: res.data.data.totalCustomers,
            totalPickups: res.data.data.totalPickups,
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeTab]);

  // Fetch driver history
  useEffect(() => {
    if (activeTab !== "drivers") return;
    setLoading(true);
    api.get('/history/drivers')
      .then((res) => {
        if (res.data.success) {
          setDrivers(res.data.data.drivers);
          setDriverTotals({
            totalDrivers: res.data.data.totalDrivers,
            totalPickups: res.data.data.totalPickups,
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeTab]);

  // Fetch ML schedule completions
  useEffect(() => {
    if (activeTab !== "completions") return;
    fetchCompletions();
  }, [activeTab, fetchCompletions]);

  // Fetch audit trail for a pickup
  const fetchAuditTrail = useCallback(async (pickupId) => {
    if (expandedPickup === pickupId) {
      setExpandedPickup(null);
      return;
    }
    setExpandedPickup(pickupId);
    setAuditLoading(true);
    try {
      const res = await api.get(`/pickups/${pickupId}/events`);
      if (res.data.success) setAuditEvents(res.data.data);
    } catch (err) {
      console.error("Failed to fetch audit trail:", err);
    } finally {
      setAuditLoading(false);
    }
  }, [expandedPickup]);

  const filteredCustomers = customers.filter(
    (c) =>
      !searchTerm ||
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDrivers = drivers.filter(
    (d) =>
      !searchTerm ||
      d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">Histórico operacional</h1>
        <p className="text-sm text-primary/60 mt-1">
          {isSuperAdmin ? "Coletas, roteiros e desempenho consolidado das cooperativas" : "Histórico de coletas da sua cooperativa"}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-primary/4 rounded-2xl p-1.5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSearchTerm(""); }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.id ? "bg-white text-primary shadow-sm" : "text-primary/50 hover:text-primary/70"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════ PICKUP HISTORY TAB ═══════ */}
      {activeTab === "pickups" && (
        <>
          {/* Stats Cards */}
          {pickupStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {[
                { label: "Total", value: pickupStats.total, color: "text-primary", bg: "bg-white" },
                { label: "Concluídas", value: pickupStats.completed, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Ativas", value: pickupStats.active, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Canceladas", value: pickupStats.cancelled, color: "text-red-500", bg: "bg-red-50" },
                { label: "Expiradas", value: pickupStats.expired, color: "text-gray-500", bg: "bg-gray-50" },
                { label: "Sucesso", value: `${pickupStats.completionRate || 0}%`, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Resp. média", value: fmt(pickupStats.avgResponseMs), color: "text-purple-600", bg: "bg-purple-50" },
                { label: "Tempo médio", value: fmt(pickupStats.avgTaskDurationMs), color: "text-amber-600", bg: "bg-amber-50" },
              ].map((s) => (
                <div key={s.label} className={`${s.bg} rounded-2xl border border-primary/10 p-4 text-center`}>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-primary/50 font-medium mt-1 uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-4 py-2.5 rounded-xl border border-primary/15 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 text-primary bg-white"
            >
              <option value="">Todos os status</option>
              {["COMPLETED", "ASSIGNED", "EN_ROUTE", "ARRIVED", "COLLECTING", "CANCELLED", "EXPIRED", "PENDING"].map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="px-4 py-2.5 rounded-xl border border-primary/15 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 text-primary bg-white"
            >
              <option value="">Todos os materiais</option>
              <option value="recyclable">Reciclável</option>
              <option value="non-recyclable">Rejeito</option>
              <option value="both">Misto</option>
            </select>
            {pagination.total > 0 && (
              <span className="text-xs text-primary/40 ml-auto">
                Exibindo {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
              </span>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-accent rounded-full animate-spin" />
            </div>
          )}

          {/* Pickup Table */}
          {!loading && pickups.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-primary/10">
              <p className="text-4xl mb-3 opacity-40">&#x1F4ED;</p>
              <h3 className="text-lg font-semibold text-primary/70 mb-1">Nenhuma coleta encontrada</h3>
              <p className="text-sm text-primary/50">
                {statusFilter || categoryFilter ? "Ajuste os filtros para ampliar a busca." : "O histórico aparecerá quando houver solicitações de coleta."}
              </p>
            </div>
          )}

          {!loading && pickups.length > 0 && (
            <div className="bg-white rounded-2xl border border-primary/10 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-primary/3 border-b border-primary/10">
                      <th className="px-4 py-3 text-xs font-semibold text-primary/60 uppercase tracking-wider">Data</th>
                      <th className="px-4 py-3 text-xs font-semibold text-primary/60 uppercase tracking-wider">Cliente</th>
                      <th className="px-4 py-3 text-xs font-semibold text-primary/60 uppercase tracking-wider">Coletor</th>
                      <th className="px-4 py-3 text-xs font-semibold text-primary/60 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-xs font-semibold text-primary/60 uppercase tracking-wider">Material</th>
                      <th className="px-4 py-3 text-xs font-semibold text-primary/60 uppercase tracking-wider">Complexidade</th>
                      <th className="px-4 py-3 text-xs font-semibold text-primary/60 uppercase tracking-wider">Resposta</th>
                      <th className="px-4 py-3 text-xs font-semibold text-primary/60 uppercase tracking-wider">Duração</th>
                      <th className="px-4 py-3 text-xs font-semibold text-primary/60 uppercase tracking-wider">Local</th>
                      {isSuperAdmin && (
                        <th className="px-4 py-3 text-xs font-semibold text-primary/60 uppercase tracking-wider">Coop.</th>
                      )}
                      <th className="px-4 py-3 text-xs font-semibold text-primary/60 uppercase tracking-wider w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/5">
                    {pickups.map((p) => (
                      <React.Fragment key={p._id}>
                        <tr className={`hover:bg-primary/2 transition cursor-pointer ${expandedPickup === p._id ? "bg-primary/3" : ""}`} onClick={() => fetchAuditTrail(p._id)}>
                          <td className="px-4 py-3 text-sm text-primary/70 whitespace-nowrap">
                            {new Date(p.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                            <br />
                            <span className="text-xs text-primary/40">
                              {new Date(p.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-primary">
                                {p.customer?.name?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-primary">{p.customer?.name || "Cliente não identificado"}</p>
                                <p className="text-[10px] text-primary/40">{p.customer?.phone || ""}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {p.driver ? (
                              <div>
                                <p className="text-sm font-medium text-primary">{p.driver.name}</p>
                                <p className="text-[10px] text-primary/40">{p.driver.phone || ""}</p>
                              </div>
                            ) : (
                              <span className="text-xs text-primary/30 italic">Sem coletor</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${STATUS_COLORS[p.status] || "bg-gray-100 text-gray-600"}`}>
                              {STATUS_LABELS[p.status] || p.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-primary/70">{CATEGORY_LABELS[p.category] || p.category}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${LEVEL_COLORS[p.level] || "bg-gray-100 text-gray-600"}`}>
                              {LEVEL_LABELS[p.level] || p.level}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-purple-600 whitespace-nowrap">{fmt(p.responseTimeMs)}</td>
                          <td className="px-4 py-3 text-sm font-medium text-amber-600 whitespace-nowrap">{fmt(p.taskDurationMs)}</td>
                          <td className="px-4 py-3 text-sm text-primary/70 max-w-32 truncate">
                            {p.area || p.location?.address || "\u2014"}
                          </td>
                          {isSuperAdmin && (
                            <td className="px-4 py-3 text-sm text-primary/60">{p.organization}</td>
                          )}
                          <td className="px-4 py-3">
                            <svg className={`w-4 h-4 text-primary/30 transition-transform ${expandedPickup === p._id ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </td>
                        </tr>
                        {/* Expanded Audit Trail */}
                        {expandedPickup === p._id && (
                          <tr>
                            <td colSpan={isSuperAdmin ? 11 : 10} className="px-0 py-0">
                              <div className="bg-primary/2 border-t border-b border-primary/10 px-6 py-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Linha do tempo da coleta</h4>
                                  {p.cancelledAt && (
                                    <span className="text-xs text-red-500">
                                      Cancelada por {p.cancelledBy?.name || "não identificado"} ({ROLE_LABELS[p.cancelledBy?.role] || p.cancelledBy?.role || "?"})
                                    </span>
                                  )}
                                </div>

                                {/* Timestamps Row */}
                                <div className="flex flex-wrap gap-3 mb-4">
                                  {[
                                    { label: "Criada", time: p.createdAt, color: "border-yellow-400" },
                                    { label: "Atribuída", time: p.assignedAt, color: "border-blue-400" },
                                    { label: "Concluída", time: p.completedAt, color: "border-emerald-400" },
                                    { label: "Cancelada", time: p.cancelledAt, color: "border-red-400" },
                                  ].filter((t) => t.time).map((t) => (
                                    <div key={t.label} className={`px-3 py-2 bg-white rounded-xl border-l-4 ${t.color}`}>
                                      <p className="text-[10px] text-primary/40 uppercase font-medium">{t.label}</p>
                                      <p className="text-xs text-primary font-medium">
                                        {new Date(t.time).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                      </p>
                                    </div>
                                  ))}
                                  {p.responseTimeMs && (
                                    <div className="px-3 py-2 bg-purple-50 rounded-xl">
                                      <p className="text-[10px] text-purple-500 uppercase font-medium">Tempo de resposta</p>
                                      <p className="text-xs text-purple-700 font-bold">{fmt(p.responseTimeMs)}</p>
                                    </div>
                                  )}
                                  {p.taskDurationMs && (
                                    <div className="px-3 py-2 bg-amber-50 rounded-xl">
                                      <p className="text-[10px] text-amber-500 uppercase font-medium">Duração da coleta</p>
                                      <p className="text-xs text-amber-700 font-bold">{fmt(p.taskDurationMs)}</p>
                                    </div>
                                  )}
                                </div>

                                {/* Audit Events */}
                                {auditLoading ? (
                                  <div className="flex items-center gap-2 text-xs text-primary/40">
                                    <div className="w-4 h-4 border-2 border-primary/20 border-t-accent rounded-full animate-spin" />
                                    Carregando linha do tempo...
                                  </div>
                                ) : auditEvents.length > 0 ? (
                                  <div className="relative pl-4 space-y-3">
                                    <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-primary/10" />
                                    {auditEvents.map((ev, i) => (
                                      <div key={ev._id || i} className="relative flex items-start gap-3">
                                        <div className={`w-3 h-3 rounded-full shrink-0 mt-0.5 border-2 border-white z-10 ${
                                          ev.event === "COMPLETED" ? "bg-emerald-500" :
                                          ev.event === "CANCELLED" ? "bg-red-500" :
                                          ev.event === "ACCEPTED" ? "bg-blue-500" :
                                          ev.event === "CREATED" ? "bg-yellow-500" :
                                          ev.event === "REJECTED" ? "bg-orange-500" :
                                          "bg-gray-400"
                                        }`} />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-primary">{STATUS_LABELS[ev.event] || ev.event}</span>
                                            {ev.fromStatus && ev.toStatus && ev.fromStatus !== ev.toStatus && (
                                              <span className="text-[10px] text-primary/40">{STATUS_LABELS[ev.fromStatus] || ev.fromStatus} &rarr; {STATUS_LABELS[ev.toStatus] || ev.toStatus}</span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-primary/50">
                                              por {ev.performedBy?.name || ROLE_LABELS[ev.performedBy?.role] || "sistema"}
                                              {ev.performedBy?.role && ` (${ROLE_LABELS[ev.performedBy.role] || ev.performedBy.role})`}
                                            </span>
                                            <span className="text-[10px] text-primary/30">
                                              {new Date(ev.timestamp).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit", month: "short", day: "numeric" })}
                                            </span>
                                          </div>
                                          {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                                            <div className="mt-1 text-[10px] text-primary/40 bg-white rounded-lg px-2 py-1 inline-block">
                                              {ev.metadata.reason && <span>Motivo: {ev.metadata.reason}</span>}
                                              {ev.metadata.matchedCount && <span>{ev.metadata.matchedCount} coletores compatíveis</span>}
                                              {ev.metadata.responseTimeMs && <span>Resposta: {fmt(ev.metadata.responseTimeMs)}</span>}
                                              {ev.metadata.taskDurationMs && <span>Duração: {fmt(ev.metadata.taskDurationMs)}</span>}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-primary/40">Nenhum evento registrado.</p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-primary/10">
                  <p className="text-xs text-primary/50">
                    Página {pagination.page} de {pagination.pages}
                  </p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-primary/15 hover:bg-primary/5 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      Anterior
                    </button>
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      let pageNum;
                      if (pagination.pages <= 5) pageNum = i + 1;
                      else if (currentPage <= 3) pageNum = i + 1;
                      else if (currentPage >= pagination.pages - 2) pageNum = pagination.pages - 4 + i;
                      else pageNum = currentPage - 2 + i;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-xs font-medium transition ${
                            currentPage === pageNum ? "bg-accent text-primary font-bold" : "border border-primary/15 hover:bg-primary/5"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(pagination.pages, p + 1))}
                      disabled={currentPage === pagination.pages}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-primary/15 hover:bg-primary/5 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ═══════ CUSTOMER STATS TAB ═══════ */}
      {activeTab === "customers" && (
        <>
          {/* Customer Summary */}
          {customerTotals.totalCustomers !== undefined && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl border border-primary/10 p-5 text-center">
                <p className="text-3xl font-bold text-primary">{customerTotals.totalCustomers}</p>
                <p className="text-xs text-primary/50 font-medium mt-1">Clientes cadastrados</p>
              </div>
              <div className="bg-emerald-50 rounded-2xl border border-primary/10 p-5 text-center">
                <p className="text-3xl font-bold text-emerald-600">{customerTotals.totalPickups}</p>
                <p className="text-xs text-primary/50 font-medium mt-1">Coletas solicitadas</p>
              </div>
              <div className="bg-purple-50 rounded-2xl border border-primary/10 p-5 text-center">
                <p className="text-3xl font-bold text-purple-600">
                  {customerTotals.totalCustomers > 0 ? (customerTotals.totalPickups / customerTotals.totalCustomers).toFixed(1) : 0}
                </p>
                <p className="text-xs text-primary/50 font-medium mt-1">Média por cliente</p>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary/15 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 text-primary"
            />
          </div>

          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-accent rounded-full animate-spin" />
            </div>
          )}

          {!loading && filteredCustomers.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-primary/10">
              <p className="text-4xl mb-3 opacity-40">&#x1F465;</p>
              <h3 className="text-lg font-semibold text-primary/70 mb-1">Nenhum cliente encontrado</h3>
            </div>
          )}

          {!loading && filteredCustomers.length > 0 && (
            <div className="grid grid-cols-1 gap-4">
              {filteredCustomers.map((c, idx) => (
                <div key={c.customerId} className="bg-white rounded-2xl border border-primary/10 p-5 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? "bg-amber-100 text-amber-700" :
                        idx === 1 ? "bg-gray-200 text-gray-600" :
                        idx === 2 ? "bg-orange-100 text-orange-700" :
                        "bg-primary/5 text-primary/50"
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold text-primary">
                        {c.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-primary truncate">{c.name}</p>
                        <p className="text-xs text-primary/40 truncate">{c.email}</p>
                        {c.phone && <p className="text-xs text-primary/40">{c.phone}</p>}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 sm:ml-auto">
                      {[
                        { label: "Total", value: c.totalPickups, color: "text-primary", bg: "bg-primary/4" },
                        { label: "Concl.", value: c.completed, color: "text-emerald-600", bg: "bg-emerald-50" },
                        { label: "Canc.", value: c.cancelled, color: "text-red-500", bg: "bg-red-50" },
                        { label: "Ativas", value: c.active, color: "text-blue-600", bg: "bg-blue-50" },
                      ].map((s) => (
                        <div key={s.label} className={`px-3 py-1.5 rounded-xl ${s.bg} text-center min-w-16`}>
                          <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                          <p className="text-[10px] text-primary/50 font-medium uppercase">{s.label}</p>
                        </div>
                      ))}
                      {c.avgResponseMs > 0 && (
                        <div className="px-3 py-1.5 rounded-xl bg-purple-50 text-center min-w-16">
                          <p className="text-lg font-bold text-purple-600">{fmt(c.avgResponseMs)}</p>
                          <p className="text-[10px] text-purple-500/70 font-medium uppercase">Resp.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-primary/5">
                    <div className="flex gap-1.5">
                      {c.categories.recyclable > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                          {c.categories.recyclable} recicláveis
                        </span>
                      )}
                      {c.categories["non-recyclable"] > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">
                          {c.categories["non-recyclable"]} rejeitos
                        </span>
                      )}
                      {c.categories.both > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700">
                          {c.categories.both} mistos
                        </span>
                      )}
                    </div>
                    <div className="ml-auto flex items-center gap-3">
                      {c.totalPickups > 0 && (
                        <span className="text-[10px] text-primary/40">
                          {Math.round((c.completed / c.totalPickups) * 100)}% concluídas
                        </span>
                      )}
                      {c.lastPickupAt && (
                        <span className="text-[10px] text-primary/40">
                          Última: {new Date(c.lastPickupAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ═══════ DRIVER STATS TAB ═══════ */}
      {activeTab === "drivers" && (
        <>
          {/* Driver Summary */}
          {driverTotals.totalDrivers !== undefined && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-2xl border border-primary/10 p-5 text-center">
                <p className="text-3xl font-bold text-primary">{driverTotals.totalDrivers}</p>
                <p className="text-xs text-primary/50 font-medium mt-1">Coletores cadastrados</p>
              </div>
              <div className="bg-blue-50 rounded-2xl border border-primary/10 p-5 text-center">
                <p className="text-3xl font-bold text-blue-600">{driverTotals.totalPickups}</p>
                <p className="text-xs text-primary/50 font-medium mt-1">Coletas atribuídas</p>
              </div>
              <div className="bg-emerald-50 rounded-2xl border border-primary/10 p-5 text-center">
                <p className="text-3xl font-bold text-emerald-600">
                  {driverTotals.totalDrivers > 0 ? (driverTotals.totalPickups / driverTotals.totalDrivers).toFixed(1) : 0}
                </p>
                <p className="text-xs text-primary/50 font-medium mt-1">Média por coletor</p>
              </div>
              <div className="bg-purple-50 rounded-2xl border border-primary/10 p-5 text-center">
                <p className="text-3xl font-bold text-purple-600">
                  {drivers.length > 0
                    ? `${Math.round(drivers.reduce((s, d) => s + (d.completionRate || 0), 0) / drivers.length)}%`
                    : "0%"}
                </p>
                <p className="text-xs text-primary/50 font-medium mt-1">Conclusão média</p>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar coletores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary/15 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 text-primary"
            />
          </div>

          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-accent rounded-full animate-spin" />
            </div>
          )}

          {!loading && filteredDrivers.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-primary/10">
              <p className="text-4xl mb-3 opacity-40">&#x1F69B;</p>
              <h3 className="text-lg font-semibold text-primary/70 mb-1">Nenhum coletor encontrado</h3>
            </div>
          )}

          {!loading && filteredDrivers.length > 0 && (
            <div className="grid grid-cols-1 gap-4">
              {filteredDrivers.map((d, idx) => (
                <div
                  key={d.driverId || d.userId}
                  className="bg-white rounded-2xl border border-primary/10 p-5 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/admin-dashboard/drivers/${d.driverId || d.userId}`)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? "bg-amber-100 text-amber-700" :
                        idx === 1 ? "bg-gray-200 text-gray-600" :
                        idx === 2 ? "bg-orange-100 text-orange-700" :
                        "bg-primary/5 text-primary/50"
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
                        {d.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-primary truncate">{d.name}</p>
                        <p className="text-xs text-primary/40 truncate">{d.email}</p>
                        {d.phone && <p className="text-xs text-primary/40">{d.phone}</p>}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 sm:ml-auto">
                      {[
                        { label: "Total", value: d.totalPickups, color: "text-primary", bg: "bg-primary/4" },
                        { label: "Concl.", value: d.completed, color: "text-emerald-600", bg: "bg-emerald-50" },
                        { label: "Canc.", value: d.cancelled, color: "text-red-500", bg: "bg-red-50" },
                        { label: "Ativas", value: d.active, color: "text-blue-600", bg: "bg-blue-50" },
                      ].map((s) => (
                        <div key={s.label} className={`px-3 py-1.5 rounded-xl ${s.bg} text-center min-w-16`}>
                          <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                          <p className="text-[10px] text-primary/50 font-medium uppercase">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Performance metrics + category breakdown */}
                  <div className="mt-3 pt-3 border-t border-primary/5">
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Performance badges */}
                      <div className="flex gap-2">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50">
                          <span className="text-[10px] text-emerald-600 font-medium">{d.completionRate || 0}% concluídas</span>
                        </div>
                        {d.avgResponseMs > 0 && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50">
                            <span className="text-[10px] text-purple-600 font-medium">Resposta: {fmt(d.avgResponseMs)}</span>
                          </div>
                        )}
                        {d.avgTaskDurationMs > 0 && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50">
                            <span className="text-[10px] text-amber-600 font-medium">Coleta: {fmt(d.avgTaskDurationMs)}</span>
                          </div>
                        )}
                      </div>

                      {/* Categories */}
                      <div className="flex gap-1.5 ml-auto">
                        {d.categories.recyclable > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                            {d.categories.recyclable} recicláveis
                          </span>
                        )}
                        {d.categories["non-recyclable"] > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">
                            {d.categories["non-recyclable"]} rejeitos
                          </span>
                        )}
                        {d.categories.both > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700">
                            {d.categories.both} mistos
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Completion progress bar */}
                    <div className="mt-2">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            (d.completionRate || 0) >= 75 ? "bg-emerald-500" :
                            (d.completionRate || 0) >= 50 ? "bg-amber-500" :
                            "bg-red-400"
                          }`}
                          style={{ width: `${d.completionRate || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Last pickup + nav arrow */}
                  <div className="flex items-center justify-between mt-2">
                    {d.lastPickupAt && (
                      <span className="text-[10px] text-primary/40">
                        Última coleta: {new Date(d.lastPickupAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      </span>
                    )}
                    <svg className="w-4 h-4 text-primary/30 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ═══════ SCHEDULE COMPLETIONS TAB ═══════ */}
      {activeTab === "completions" && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-emerald-50 rounded-2xl border border-primary/10 p-5 text-center">
              <p className="text-3xl font-bold text-emerald-600">{completions.length}</p>
              <p className="text-xs text-primary/50 font-medium mt-1">Roteiros concluídos</p>
            </div>
            <div className="bg-white rounded-2xl border border-primary/10 p-5 text-center">
              <p className="text-3xl font-bold text-primary">
                {[...new Set(completions.map(c => c.area))].length}
              </p>
              <p className="text-xs text-primary/50 font-medium mt-1">Áreas atendidas</p>
            </div>
            <div className="bg-blue-50 rounded-2xl border border-primary/10 p-5 text-center">
              <p className="text-3xl font-bold text-blue-600">
                {[...new Set(completions.map(c => c.date))].length}
              </p>
              <p className="text-xs text-primary/50 font-medium mt-1">Dias com operação</p>
            </div>
            <div className="bg-purple-50 rounded-2xl border border-primary/10 p-5 text-center">
              <p className="text-3xl font-bold text-purple-600">
                {completions.reduce((sum, c) => sum + (c.predictedWasteKg || 0), 0).toLocaleString()}
              </p>
              <p className="text-xs text-primary/50 font-medium mt-1">Resíduos estimados (kg)</p>
            </div>
          </div>

          {/* Loading */}
          {mlLoading && (
            <div className="flex items-center justify-center py-16 bg-white rounded-2xl">
              <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          )}

          {/* Empty state */}
          {!mlLoading && completions.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-primary/10">
              <p className="text-lg font-semibold text-primary/70 mb-1">Nenhum roteiro concluído</p>
              <p className="text-sm text-primary/40">As rotas finalizadas pelas cooperativas aparecerão aqui.</p>
            </div>
          )}

          {/* Completions Table */}
          {!mlLoading && completions.length > 0 && (
            <div className="bg-white rounded-2xl border border-primary/10 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-primary/8 bg-primary/3">
                      <th className="px-5 py-3.5 text-xs font-semibold text-primary/50 uppercase">Data</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-primary/50 uppercase">Área</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-primary/50 uppercase">Tipo</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-primary/50 uppercase">Resíduo</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-primary/50 uppercase">Nível</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-primary/50 uppercase">Coletor</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-primary/50 uppercase">Veículo</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-primary/50 uppercase">Concluído em</th>
                      {isSuperAdmin && <th className="px-5 py-3.5 text-xs font-semibold text-primary/50 uppercase">Coop.</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {completions.map((c, i) => (
                      <tr key={i} className="border-b border-primary/5 hover:bg-primary/2 transition-colors">
                        <td className="px-5 py-3 text-sm text-primary/60">{c.date}</td>
                        <td className="px-5 py-3 font-semibold text-primary text-sm">{c.area}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            { commercial: "bg-blue-100 text-blue-700", residential: "bg-purple-100 text-purple-700", suburban: "bg-teal-100 text-teal-700", rural: "bg-emerald-100 text-emerald-700" }[c.areaType] || "bg-gray-100 text-gray-700"
                          }`}>{AREA_TYPE_LABELS[c.areaType] || c.areaType}</span>
                        </td>
                        <td className="px-5 py-3 text-sm font-medium text-primary">{c.predictedWasteKg?.toLocaleString()} kg</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            { none: "bg-gray-100 text-gray-600", low: "bg-green-100 text-green-700", medium: "bg-amber-100 text-amber-700", high: "bg-orange-100 text-orange-700", critical: "bg-red-100 text-red-700" }[c.wasteCategory] || "bg-gray-100 text-gray-600"
                          }`}>{LEVEL_LABELS[c.wasteCategory] || { none: "Sem risco", low: "Baixo", high: "Alto", critical: "Crítico" }[c.wasteCategory] || c.wasteCategory}</span>
                        </td>
                        <td className="px-5 py-3 text-sm text-primary/70">{c.driverName}</td>
                        <td className="px-5 py-3 text-sm text-primary/70">{c.truck?.licensePlate}</td>
                        <td className="px-5 py-3 text-xs text-primary/50">
                          {c.completedAt ? new Date(c.completedAt).toLocaleString("pt-BR", {
                            day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                          }) : "--"}
                        </td>
                        {isSuperAdmin && <td className="px-5 py-3 text-xs text-primary/50">{c.orgName || "--"}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default History;
