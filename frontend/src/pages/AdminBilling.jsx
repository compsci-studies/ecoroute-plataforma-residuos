import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  Ban,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  History,
  Receipt,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import useBillingStore from "../stores/useBillingStore";
import useAuthStore from "../stores/useAuthStore";

const STATUS_CONFIG = {
  UNPAID: { label: "Em aberto", icon: Clock, badge: "bg-amber-50 text-amber-700 border-amber-200/60", accent: "text-amber-600", iconBg: "bg-amber-100" },
  CASH_PENDING: { label: "Dinheiro pendente", icon: Wallet, badge: "bg-blue-50 text-blue-700 border-blue-200/60", accent: "text-blue-600", iconBg: "bg-blue-100" },
  OVERDUE: { label: "Vencida", icon: AlertTriangle, badge: "bg-red-50 text-red-700 border-red-200/60", accent: "text-red-600", iconBg: "bg-red-100" },
  PAID: { label: "Paga", icon: CheckCircle2, badge: "bg-green-50 text-green-700 border-green-200/60", accent: "text-green-600", iconBg: "bg-green-100" },
  WAIVED: { label: "Isenta", icon: Ban, badge: "bg-violet-50 text-violet-700 border-violet-200/60", accent: "text-violet-600", iconBg: "bg-violet-100" },
};

const PAYMENT_METHOD_LABELS = {
  cash: "dinheiro",
  pix: "Pix",
  card: "cartão",
};

function formatPeriod(month, year) {
  const d = new Date(year, month - 1);
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function formatCurrency(value) {
  return `R$ ${Number(value || 0).toLocaleString("pt-BR")}`;
}

function formatDate(value) {
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminBilling() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { bills, summary, loading, error, fetchMyBills, payBill } = useBillingStore();
  const [activeTab, setActiveTab] = useState("current");
  const [payingId, setPayingId] = useState(null);
  const [payMethod, setPayMethod] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchMyBills({ signal: controller.signal });
    return () => controller.abort();
  }, [fetchMyBills]);

  useEffect(() => {
    const refetch = () => fetchMyBills();
    const onVisible = () => {
      if (document.visibilityState === "visible") refetch();
    };
    window.addEventListener("focus", refetch);
    document.addEventListener("visibilitychange", onVisible);
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") refetch();
    }, 60000);
    return () => {
      window.removeEventListener("focus", refetch);
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(interval);
    };
  }, [fetchMyBills]);

  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "success") {
      queueMicrotask(() => {
        setNotice({ type: "success", text: "Pagamento recebido. Esta mensalidade agora aparece como paga para os administradores da cooperativa." });
        setActiveTab("history");
      });
      fetchMyBills();
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("payment");
      nextParams.delete("billingId");
      setSearchParams(nextParams, { replace: true });
    } else if (payment === "failed") {
      const reason = searchParams.get("reason");
      queueMicrotask(() => {
        setNotice({ type: "error", text: `Pagamento recusado${reason ? ` (${reason.replace(/_/g, " ")})` : ""}. Tente novamente.` });
      });
      fetchMyBills();
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("payment");
      nextParams.delete("reason");
      setSearchParams(nextParams, { replace: true });
    }
  }, [fetchMyBills, searchParams, setSearchParams]);

  const handlePay = async (billingId, method) => {
    setPayingId(billingId);
    setPayMethod(method);
    const result = await payBill(billingId, method);
    if (result.redirecting) return;
    setPayingId(null);
    setPayMethod(null);
    if (!result.success) {
      setNotice({ type: "error", text: result.error || "Pagamento recusado. Tente novamente." });
    } else {
      setNotice({
        type: "success",
        text: method === "cash"
          ? "Pagamento em dinheiro registrado. A baixa ocorre após confirmação financeira."
          : "Pagamento registrado para os administradores da cooperativa.",
      });
      if (method !== "cash") setActiveTab("history");
    }
  };

  const openBills = useMemo(
    () =>
      bills
        .filter((bill) => ["UNPAID", "OVERDUE", "CASH_PENDING"].includes(bill.status))
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)),
    [bills]
  );
  const resolvedBills = useMemo(
    () =>
      bills
        .filter((bill) => bill.status === "PAID" || bill.status === "WAIVED")
        .sort((a, b) => {
          const bTime = new Date(b.paidAt || b.updatedAt || b.dueDate).getTime();
          const aTime = new Date(a.paidAt || a.updatedAt || a.dueDate).getTime();
          return bTime - aTime;
        }),
    [bills]
  );
  const oldestOpenBill = openBills[0];
  const totalDue = useMemo(
    () => openBills.reduce((sum, bill) => sum + (bill.amount || 0), 0),
    [openBills]
  );
  const overdueCount = useMemo(
    () => openBills.filter((bill) => bill.status === "OVERDUE").length,
    [openBills]
  );
  const orgName = user?.orgId?.name || user?.organization?.name || "Sua cooperativa";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary tracking-tight">Cobranças administrativas</h2>
          <p className="text-sm text-primary/50 mt-1">
            Acompanhe as mensalidades administrativas da {orgName}. Cada mes e cobrado separadamente no dia 1.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-xl border border-primary/10 bg-white px-4 py-2 text-sm font-semibold text-primary/70">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          Cobrança compartilhada da cooperativa
        </div>
      </div>

      {notice && (
        <div className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
          notice.type === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-red-200 bg-red-50 text-red-700"
        }`}>
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-current/60 hover:text-current">
            &times;
          </button>
        </div>
      )}

      {openBills.length > 1 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-800">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-bold">Há mais de uma mensalidade administrativa pendente</p>
                <p className="mt-0.5 text-sm text-amber-700">
                  Quite o mês mais antigo primeiro. As parcelas ficam separadas para manter o saldo correto.
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase text-amber-700">
              {openBills.length} meses pendentes
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={Receipt} label="Cobranças" value={summary?.total || 0} color="text-primary" bg="bg-primary/8" />
        <SummaryCard icon={CheckCircle2} label="Pagas" value={summary?.paid || 0} color="text-green-600" bg="bg-green-100" />
        <SummaryCard icon={Clock} label="Em aberto" value={summary?.unpaid || 0} color="text-amber-600" bg="bg-amber-100" />
        <SummaryCard icon={DollarSign} label="Saldo devido" value={formatCurrency(totalDue)} color="text-red-600" bg="bg-red-100" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.5fr)]">
        <section className="rounded-2xl border border-primary/10 bg-white p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary">Mensalidade aberta mais antiga</h3>
              <p className="text-xs text-primary/45">Quite os meses em ordem cronologica. Uma mensalidade paga cobre todos os administradores da cooperativa naquele mês.</p>
            </div>
          </div>

          {loading ? (
            <Loader />
          ) : error ? (
            <ErrorState message={error} />
          ) : oldestOpenBill ? (
            <CurrentBill
              bill={oldestOpenBill}
              totalDue={totalDue}
              openCount={openBills.length}
              overdueCount={overdueCount}
              payingId={payingId}
              payMethod={payMethod}
              onPay={handlePay}
            />
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title={bills.length === 0 ? "Nenhuma cobrança emitida" : "Sem cobranças pendentes"}
              message={bills.length === 0 ? "As mensalidades administrativas geradas aparecerao aqui." : "Os administradores da cooperativa estão em dia nos periodos visiveis."}
            />
          )}
        </section>

        <section className="rounded-2xl border border-primary/10 bg-white overflow-hidden">
          <div className="flex gap-1 border-b border-primary/10 bg-primary/[0.03] p-1.5">
            {[
              { id: "current", label: "Em aberto", icon: Wallet },
              { id: "history", label: "Histórico de pagamentos", icon: History },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-white text-primary shadow-sm"
                    : "text-primary/45 hover:text-primary"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {loading ? (
              <Loader />
            ) : error ? (
              <ErrorState message={error} />
            ) : activeTab === "current" ? (
              openBills.length > 0 ? (
                <div className="space-y-3">
                  {openBills.map((bill) => (
                    <BillRow
                      key={bill._id}
                      bill={bill}
                      payingId={payingId}
                      payMethod={payMethod}
                      onPay={handlePay}
                      showActions
                    />
                  ))}
                </div>
              ) : (
                <EmptyState icon={CheckCircle2} title="Tudo em dia" message="Não há mensalidades administrativas em aberto. A próxima cobrança aparece no dia 1 do mês seguinte." />
              )
            ) : resolvedBills.length > 0 ? (
              <div className="space-y-3">
                {resolvedBills.map((bill) => (
                  <BillRow key={bill._id} bill={bill} />
                ))}
              </div>
            ) : (
              <EmptyState icon={History} title="Histórico vazio" message="Cobranças pagas e isentas aparecerao aqui." />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function CurrentBill({ bill, totalDue, openCount, overdueCount, payingId, payMethod, onPay }) {
  const config = STATUS_CONFIG[bill.status] || STATUS_CONFIG.UNPAID;
  const isPaying = payingId === bill._id;
  const canPay = bill.status === "UNPAID" || bill.status === "OVERDUE";

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-primary/10 bg-primary/[0.03] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary/50">Período da cobrança</p>
            <p className="mt-1 text-2xl font-bold text-primary">{formatPeriod(bill.billingMonth, bill.billingYear)}</p>
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-primary/45">
              <Calendar className="h-4 w-4" />
              Vence em {formatDate(bill.dueDate)}
            </p>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase ${config.badge}`}>
            <config.icon className="h-3.5 w-3.5" />
            {config.label}
          </span>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-primary/45">Este mês</p>
            <p className="text-3xl font-bold text-primary">{formatCurrency(bill.amount)}</p>
          </div>
          <div className="rounded-xl border border-primary/10 bg-white p-4">
            <p className="text-xs font-bold uppercase text-primary/40">Saldo aberto total</p>
            <p className="mt-1 text-2xl font-bold text-red-600">{formatCurrency(totalDue)}</p>
            <p className="mt-1 text-xs text-primary/45">
              {openCount} mes{openCount === 1 ? "" : "es"} em aberto
              {overdueCount > 0 ? `, ${overdueCount} vencida${overdueCount === 1 ? "" : "s"}` : ""}
            </p>
          </div>
        </div>
      </div>

      {canPay ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onPay(bill._id, "pix")}
            disabled={isPaying}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            <CreditCard className="h-4 w-4" />
            {isPaying && payMethod === "pix" ? "Processando..." : "Pagar com Pix"}
          </button>
          <button
            type="button"
            onClick={() => onPay(bill._id, "cash")}
            disabled={isPaying}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/15 bg-white px-4 py-3 text-sm font-bold text-primary transition hover:bg-primary/5 disabled:opacity-50"
          >
            <Wallet className="h-4 w-4" />
            {isPaying && payMethod === "cash" ? "Processando..." : "Registrar pagamento em dinheiro"}
          </button>
        </div>
      ) : (
        <p className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
          Pagamento em dinheiro registrado. Aguardando confirmação financeira.
        </p>
      )}
    </div>
  );
}

function BillRow({ bill, payingId, payMethod, onPay, showActions = false }) {
  const config = STATUS_CONFIG[bill.status] || STATUS_CONFIG.UNPAID;
  const isOpen = bill.status === "UNPAID" || bill.status === "OVERDUE";
  const isPaying = payingId === bill._id;

  return (
    <div className="rounded-xl border border-primary/10 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.iconBg}`}>
            <config.icon className={`h-5 w-5 ${config.accent}`} />
          </div>
          <div>
            <p className="text-sm font-bold text-primary">{formatPeriod(bill.billingMonth, bill.billingYear)}</p>
            <p className="text-xs text-primary/45">
              {bill.paidAt
                ? `Pago em ${formatDate(bill.paidAt)}`
                : `Vence em ${formatDate(bill.dueDate)}`}
              {bill.paymentMethod ? ` via ${PAYMENT_METHOD_LABELS[bill.paymentMethod] || bill.paymentMethod}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
          <p className="text-sm font-bold text-primary">{formatCurrency(bill.amount)}</p>
          <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase ${config.badge}`}>
            {config.label}
          </span>
        </div>
      </div>

      {showActions && isOpen && (
        <div className="mt-4 grid grid-cols-1 gap-2 border-t border-primary/10 pt-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onPay(bill._id, "pix")}
            disabled={isPaying}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            <CreditCard className="h-4 w-4" />
            {isPaying && payMethod === "pix" ? "Processando..." : "Pagar com Pix"}
          </button>
          <button
            type="button"
            onClick={() => onPay(bill._id, "cash")}
            disabled={isPaying}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary/15 bg-white px-3 py-2.5 text-xs font-bold text-primary transition hover:bg-primary/5 disabled:opacity-50"
          >
            <Wallet className="h-4 w-4" />
            {isPaying && payMethod === "cash" ? "Processando..." : "Paguei em dinheiro"}
          </button>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value, color, bg }) {
  const IconComponent = icon;

  return (
    <div className="rounded-2xl border border-primary/10 bg-white p-4">
      <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${bg}`}>
        <IconComponent className={`h-4.5 w-4.5 ${color}`} />
      </div>
      <p className="text-xl font-bold text-primary">{value}</p>
      <p className="mt-0.5 text-[10px] font-medium uppercase text-primary/40">{label}</p>
    </div>
  );
}

function Loader() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <AlertTriangle className="mb-3 h-10 w-10 text-red-400" />
      <p className="text-sm font-medium text-red-600">{message}</p>
    </div>
  );
}

function EmptyState({ icon, title, message }) {
  const IconComponent = icon;

  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/5">
        <IconComponent className="h-7 w-7 text-primary/25" />
      </div>
      <p className="text-base font-bold text-primary/70">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-primary/40">{message}</p>
    </div>
  );
}
