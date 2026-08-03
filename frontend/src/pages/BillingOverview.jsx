import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeDollarSign,
  Building2,
  CheckCircle2,
  Clock3,
  CreditCard,
  RefreshCcw,
  Search,
  Truck,
  UserRound,
  Wallet,
  XCircle,
} from "lucide-react";
import api from "../utils/api";
import useAuthStore from "../stores/useAuthStore";
import { AdminEmptyState, TableSkeleton } from "../components/shared/AdminListStates";

const STATUS_CONFIG = {
  COMPLETED: {
    label: "Pago",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  PENDING: {
    label: "Aguardando pagamento",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  FAILED: {
    label: "Falhou",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  REFUNDED: {
    label: "Reembolsado",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  CANCELLED: {
    label: "Cancelado",
    className: "border-slate-200 bg-slate-50 text-slate-600",
  },
};

const METHOD_LABELS = {
  pix: "Pix",
  cash: "Dinheiro",
};

const CATEGORY_LABELS = {
  recyclable: "Recicláveis",
  "non-recyclable": "Não recicláveis",
  both: "Resíduos mistos",
};

const LEVEL_LABELS = {
  easy: "Retirada simples",
  medium: "Retirada média",
  hard: "Retirada complexa",
};

const formatCurrency = (value = 0, currency = "BRL") =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: currency || "BRL",
  });

const formatDate = (value) => {
  if (!value) return "Data não informada";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatProtocol = (payment) => {
  const raw = String(payment?.pickup?.id || payment?.pickupId || payment?.id || "");
  const suffix = raw.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase();
  return suffix ? `ECO-${suffix}` : "Sem protocolo";
};

const getStatus = (payment) => String(payment?.status || "PENDING").toUpperCase();

function PaymentStat({ icon: Icon, label, value, detail, tone = "primary" }) {
  const tones = {
    primary: "bg-primary/8 text-primary",
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
  };

  return (
    <div className="rounded-xl border border-primary/10 bg-white p-4 shadow-sm shadow-primary/5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary/45">{label}</p>
          <p className="mt-2 text-2xl font-bold text-primary">{value}</p>
          <p className="mt-1 text-xs text-primary/45">{detail}</p>
        </div>
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${tones[tone] || tones.primary}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

export default function BillingOverview() {
  const user = useAuthStore((state) => state.user);
  const isPlatformAdmin = user?.role === "super_admin";
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");

  const fetchPayments = useCallback(async ({ background = false } = {}) => {
    if (background) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const response = await api.get("/payments/all?limit=500");
      setPayments(response.data.payments || []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Não foi possível carregar os pagamentos das coletas."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    api
      .get("/payments/all?limit=500", { signal: controller.signal })
      .then((response) => setPayments(response.data.payments || []))
      .catch((requestError) => {
        if (requestError.name !== "CanceledError") {
          setError(
            requestError.response?.data?.message ||
              "Não foi possível carregar os pagamentos das coletas."
          );
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const summary = useMemo(() => {
    const completed = payments.filter((payment) => getStatus(payment) === "COMPLETED");
    const pending = payments.filter((payment) => getStatus(payment) === "PENDING");
    const attention = payments.filter((payment) =>
      ["FAILED", "REFUNDED", "CANCELLED"].includes(getStatus(payment))
    );
    const revenue = completed.reduce((total, payment) => total + Number(payment.amount || 0), 0);
    const pixRevenue = completed
      .filter((payment) => payment.method === "pix")
      .reduce((total, payment) => total + Number(payment.amount || 0), 0);
    const cashRevenue = completed
      .filter((payment) => payment.method === "cash")
      .reduce((total, payment) => total + Number(payment.amount || 0), 0);

    return {
      completed: completed.length,
      pending: pending.length,
      attention: attention.length,
      revenue,
      pixRevenue,
      cashRevenue,
    };
  }, [payments]);

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const status = getStatus(payment);
      if (statusFilter && status !== statusFilter) return false;
      if (methodFilter && payment.method !== methodFilter) return false;
      if (!query) return true;

      const searchable = [
        formatProtocol(payment),
        payment.customer?.name,
        payment.customer?.email,
        payment.driver?.name,
        payment.organization?.name,
        payment.pickup?.location?.address,
        CATEGORY_LABELS[payment.pickup?.category],
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [methodFilter, payments, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-primary/40">Financeiro</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary sm:text-3xl">
            Pagamentos de coletas
          </h1>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-primary/55">
            {isPlatformAdmin
              ? "Acompanhe os valores pagos pelos clientes pelos serviços realizados em toda a rede EcoRoute."
              : "Acompanhe os valores pagos pelos clientes pelas coletas atendidas pela sua operação."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchPayments({ background: true })}
          disabled={refreshing}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-primary/12 bg-white px-4 text-sm font-semibold text-primary transition hover:bg-primary/5 disabled:opacity-50"
        >
          <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Atualizando" : "Atualizar"}
        </button>
      </div>

      <section className="overflow-hidden rounded-xl border border-primary/10 bg-primary text-white shadow-sm">
        <div className="grid lg:grid-cols-[1.1fr_1fr]">
          <div className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/12">
                <BadgeDollarSign className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-bold">Quem paga pelo serviço?</h2>
                <p className="mt-1 text-sm leading-relaxed text-white/72">
                  O cliente paga cada coleta pelo valor calculado conforme material, peso ou volume,
                  complexidade e distância. Não existe mensalidade cobrada de gestores ou coletores.
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 border-t border-white/12 lg:border-l lg:border-t-0">
            <div className="border-r border-white/12 p-5">
              <UserRound className="h-5 w-5 text-emerald-300" />
              <p className="mt-3 text-sm font-bold">Gestor</p>
              <p className="mt-1 text-xs leading-relaxed text-white/60">Monitora pagamentos e coordena a operação.</p>
            </div>
            <div className="p-5">
              <Truck className="h-5 w-5 text-amber-300" />
              <p className="mt-3 text-sm font-bold">Coletor</p>
              <p className="mt-1 text-xs leading-relaxed text-white/60">Executa a coleta e confirma o recebimento em dinheiro.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PaymentStat
          icon={Wallet}
          label="Receita recebida"
          value={formatCurrency(summary.revenue)}
          detail={`${formatCurrency(summary.pixRevenue)} via Pix · ${formatCurrency(summary.cashRevenue)} em dinheiro`}
          tone="green"
        />
        <PaymentStat
          icon={CheckCircle2}
          label="Pagamentos concluídos"
          value={summary.completed}
          detail="Transações confirmadas"
          tone="green"
        />
        <PaymentStat
          icon={Clock3}
          label="Aguardando"
          value={summary.pending}
          detail="Pix pendente ou dinheiro na coleta"
          tone="amber"
        />
        <PaymentStat
          icon={XCircle}
          label="Exigem atenção"
          value={summary.attention}
          detail="Falhas, cancelamentos ou reembolsos"
          tone="red"
        />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-primary/10 bg-white p-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/35" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por protocolo, cliente, operador ou endereço"
            className="h-10 w-full rounded-lg border border-primary/12 bg-white pl-10 pr-4 text-sm text-primary outline-none transition placeholder:text-primary/30 focus:border-primary/30 focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-10 rounded-lg border border-primary/12 bg-white px-3 text-sm font-medium text-primary outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/10"
          aria-label="Filtrar por status do pagamento"
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_CONFIG).map(([value, config]) => (
            <option key={value} value={value}>{config.label}</option>
          ))}
        </select>
        <select
          value={methodFilter}
          onChange={(event) => setMethodFilter(event.target.value)}
          className="h-10 rounded-lg border border-primary/12 bg-white px-3 text-sm font-medium text-primary outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/10"
          aria-label="Filtrar por forma de pagamento"
        >
          <option value="">Todas as formas</option>
          <option value="pix">Pix</option>
          <option value="cash">Dinheiro</option>
        </select>
      </div>

      {loading ? (
        <TableSkeleton columns={7} rows={7} />
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <XCircle className="mx-auto h-8 w-8 text-red-500" />
          <p className="mt-3 text-sm font-semibold text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => fetchPayments()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
          >
            <RefreshCcw className="h-4 w-4" />
            Tentar novamente
          </button>
        </div>
      ) : filteredPayments.length === 0 ? (
        <AdminEmptyState
          icon={CreditCard}
          title={payments.length === 0 ? "Nenhum pagamento registrado" : "Nenhum resultado encontrado"}
          message={
            payments.length === 0
              ? "As transações aparecem aqui quando um cliente escolhe a forma de pagamento de uma coleta."
              : "Ajuste a busca ou os filtros para ampliar os resultados."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-primary/10 bg-white shadow-sm shadow-primary/5">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
              <thead>
                <tr className="border-b border-primary/8 bg-primary/[0.025]">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-primary/45">Coleta</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-primary/45">Cliente</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-primary/45">Operação</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-primary/45">Serviço</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-primary/45">Pagamento</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-primary/45">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary/45">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/6">
                {filteredPayments.map((payment) => {
                  const status = getStatus(payment);
                  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
                  return (
                    <tr key={payment.id || `${payment.pickupId}-${payment.createdAt}`} className="align-top transition hover:bg-primary/[0.02]">
                      <td className="px-4 py-4">
                        <p className="text-sm font-bold text-primary">{formatProtocol(payment)}</p>
                        <p className="mt-1 text-xs text-primary/40">{formatDate(payment.paidAt || payment.createdAt)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-primary">{payment.customer?.name || "Cliente não identificado"}</p>
                        <p className="mt-1 text-xs text-primary/40">{payment.customer?.email || "E-mail não informado"}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                          <Building2 className="h-3.5 w-3.5 text-primary/40" />
                          {payment.organization?.name || "Aguardando operador"}
                        </p>
                        <p className="mt-1 text-xs text-primary/40">{payment.driver?.name || "Coletor ainda não atribuído"}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-primary">{CATEGORY_LABELS[payment.pickup?.category] || "Material não informado"}</p>
                        <p className="mt-1 max-w-56 truncate text-xs text-primary/40" title={payment.pickup?.location?.address || ""}>
                          {LEVEL_LABELS[payment.pickup?.level] || "Complexidade não informada"}
                          {payment.pickup?.location?.address ? ` · ${payment.pickup.location.address}` : ""}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-primary/10 bg-primary/[0.03] px-2.5 py-1 text-xs font-semibold text-primary/65">
                          {payment.method === "cash" ? <Wallet className="h-3.5 w-3.5" /> : <CreditCard className="h-3.5 w-3.5" />}
                          {METHOD_LABELS[payment.method] || "Não informada"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold ${statusConfig.className}`}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <p className="text-sm font-bold text-primary">{formatCurrency(payment.amount, payment.currency)}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-primary/8 px-4 py-3 text-xs text-primary/45">
            <span>{filteredPayments.length} de {payments.length} pagamento{payments.length === 1 ? "" : "s"}</span>
            <span>Somente pagamentos vinculados a coletas</span>
          </div>
        </div>
      )}
    </div>
  );
}
