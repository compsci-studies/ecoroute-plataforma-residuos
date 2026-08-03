import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  History,
  MapPin,
  QrCode,
  Receipt,
  Wallet,
} from "lucide-react";
import api from "../../utils/api";
import usePaymentStore from "../../stores/usePaymentStore";
import { ecorouteImages } from "../../assets/ecorouteImages";
import { themeColor } from "../../utils/themeColors";

const DASHBOARD_BG = ecorouteImages.supportOperations;

const PAYMENT_STATUS = {
  UNPAID: {
    label: "Forma de pagamento pendente",
    color: themeColor("warning"),
    className: "border-amber-500/30 bg-amber-500/15",
    Icon: Clock3,
  },
  PENDING: {
    label: "Confirmação pendente",
    color: themeColor("info"),
    className: "border-blue-500/30 bg-blue-500/15",
    Icon: Wallet,
  },
  FAILED: {
    label: "Pagamento não concluído",
    color: themeColor("danger"),
    className: "border-red-500/30 bg-red-500/15",
    Icon: AlertTriangle,
  },
  PAID: {
    label: "Pago",
    color: themeColor("successStrong"),
    className: "border-emerald-500/30 bg-emerald-500/15",
    Icon: CheckCircle2,
  },
};

const CATEGORY_LABELS = {
  recyclable: "Recicláveis",
  "non-recyclable": "Não recicláveis",
  nonRecyclable: "Não recicláveis",
  mixed: "Resíduos mistos",
  both: "Resíduos mistos",
  electronic: "Eletrônicos",
  bulky: "Volumosos",
};

const PAYMENT_METHOD_LABELS = {
  pix: "Pix",
  cash: "Dinheiro",
};

function formatCurrency(value, currency = "BRL") {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency || "BRL",
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "Data não informada";
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getPickupId(pickup) {
  return pickup.id || pickup._id;
}

function getProtocol(pickup) {
  const id = String(getPickupId(pickup) || "");
  return id ? `ECO-${id.slice(-8).toUpperCase()}` : "ECO-PENDENTE";
}

function getPaymentState(pickup) {
  if (["CANCELLED", "REJECTED", "EXPIRED"].includes(pickup.status)) return null;
  if (PAYMENT_STATUS[pickup.paymentStatus]) return pickup.paymentStatus;
  if (pickup.status === "PAYMENT_REQUIRED" || !pickup.paymentMethod) return "UNPAID";
  return "PENDING";
}

function BillingPage() {
  const navigate = useNavigate();
  const { initiatePayment } = usePaymentStore();
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("open");
  const [paying, setPaying] = useState({ pickupId: null, method: null });
  const [notice, setNotice] = useState(null);

  const fetchPickups = useCallback(async ({ signal, showLoader = false } = {}) => {
    if (showLoader) setLoading(true);
    try {
      const response = await api.get("/pickups/my-pickups", { signal });
      setPickups(response.data.pickups || []);
      setError(null);
    } catch (requestError) {
      if (requestError.name !== "CanceledError") {
        setError(
          requestError.response?.data?.message ||
            "Não foi possível carregar os pagamentos das coletas.",
        );
      }
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchPickups({ signal: controller.signal, showLoader: true });
    return () => controller.abort();
  }, [fetchPickups]);

  useEffect(() => {
    const refetch = () => fetchPickups();
    const onVisible = () => {
      if (document.visibilityState === "visible") refetch();
    };
    window.addEventListener("focus", refetch);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", refetch);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetchPickups]);

  const paymentPickups = useMemo(
    () =>
      pickups
        .map((pickup) => ({ ...pickup, paymentState: getPaymentState(pickup) }))
        .filter(
          (pickup) =>
            pickup.paymentState && Number(pickup.estimatedPrice || 0) > 0,
        ),
    [pickups],
  );

  const openPayments = useMemo(
    () => paymentPickups.filter((pickup) => pickup.paymentState !== "PAID"),
    [paymentPickups],
  );
  const paidPayments = useMemo(
    () => paymentPickups.filter((pickup) => pickup.paymentState === "PAID"),
    [paymentPickups],
  );
  const outstandingValue = useMemo(
    () =>
      openPayments.reduce(
        (total, pickup) => total + Number(pickup.estimatedPrice || 0),
        0,
      ),
    [openPayments],
  );

  const handlePay = async (pickup, method) => {
    const pickupId = getPickupId(pickup);
    setPaying({ pickupId, method });
    setNotice(null);
    const result = await initiatePayment({ pickupId, method });
    if (result.redirecting) return;

    setPaying({ pickupId: null, method: null });
    if (!result.success) {
      setNotice({
        type: "error",
        message: result.error || "Não foi possível iniciar o pagamento.",
      });
      return;
    }

    const paidInDemo = method === "pix" && result.payment?.status === "COMPLETED";
    setPickups((current) =>
      current.map((item) =>
        getPickupId(item) === pickupId
          ? {
              ...item,
              paymentMethod: method,
              paymentStatus: paidInDemo ? "PAID" : "PENDING",
            }
          : item,
      ),
    );
    setNotice({
      type: "success",
      message:
        method === "cash"
          ? "Pagamento em dinheiro escolhido. O coletor confirmará o recebimento durante a coleta."
          : "Pagamento Pix registrado para esta coleta.",
    });
  };

  return (
    <div className="relative min-h-screen bg-black font-['Outfit',sans-serif]">
      <div
        className="fixed inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${DASHBOARD_BG})` }}
      />
      <div className="fixed inset-0 z-0 bg-black/90" />

      <main className="relative z-10 px-5 pb-20 pt-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <button
            type="button"
            onClick={() => navigate("/customer-dashboard")}
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-white/55 transition hover:text-white"
          >
            <ArrowLeft size={16} /> Voltar ao painel
          </button>

          <header className="mb-8 max-w-3xl">
            <span className="mb-3 block text-xs font-semibold uppercase tracking-widest text-white/45">
              Conta do cliente
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Pagamentos por coleta
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/55">
              Cada valor corresponde a uma solicitação específica. Clientes pagam o
              serviço de retirada; gestores e coletores não recebem mensalidades do
              sistema.
            </p>
          </header>

          <section className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SummaryCard
              icon={Receipt}
              label="Coletas com valor"
              value={paymentPickups.length}
              accent={themeColor("info")}
            />
            <SummaryCard
              icon={CheckCircle2}
              label="Pagamentos concluídos"
              value={paidPayments.length}
              accent={themeColor("successStrong")}
            />
            <SummaryCard
              icon={Clock3}
              label="Em aberto"
              value={openPayments.length}
              accent={themeColor("warning")}
            />
            <SummaryCard
              icon={CircleDollarSign}
              label="Valor em aberto"
              value={formatCurrency(outstandingValue)}
              accent={themeColor("danger")}
            />
          </section>

          {notice && (
            <div
              className={`mb-6 flex items-start justify-between gap-4 rounded-lg border px-4 py-3 text-sm font-semibold ${
                notice.type === "success"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                  : "border-red-500/30 bg-red-500/10 text-red-200"
              }`}
            >
              <span>{notice.message}</span>
              <button
                type="button"
                aria-label="Fechar aviso"
                onClick={() => setNotice(null)}
                className="text-lg leading-none text-white/50 hover:text-white"
              >
                &times;
              </button>
            </div>
          )}

          <div className="mb-6 inline-flex w-full rounded-lg border border-white/10 bg-white/5 p-1 sm:w-auto">
            {[
              { key: "open", label: "Em aberto", Icon: Wallet },
              { key: "history", label: "Histórico", Icon: History },
            ].map((tab) => (
              <button
                type="button"
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex flex-1 items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold transition sm:flex-none ${
                  activeTab === tab.key
                    ? "bg-white/15 text-white"
                    : "text-white/45 hover:text-white/75"
                }`}
              >
                <tab.Icon size={16} /> {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            </div>
          ) : error ? (
            <EmptyState
              icon={AlertTriangle}
              title="Não foi possível carregar os pagamentos"
              message={error}
            />
          ) : activeTab === "open" ? (
            openPayments.length ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {openPayments.map((pickup) => (
                  <PaymentCard
                    key={getPickupId(pickup)}
                    pickup={pickup}
                    paying={paying}
                    onPay={handlePay}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CheckCircle2}
                title="Nenhum pagamento em aberto"
                message="Quando uma coleta tiver valor pendente, ela aparecerá aqui com as opções Pix e dinheiro."
              />
            )
          ) : paidPayments.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {paidPayments.map((pickup) => (
                <PaymentCard key={getPickupId(pickup)} pickup={pickup} compact />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={History}
              title="Ainda não há pagamentos concluídos"
              message="O histórico será formado pelos pagamentos das coletas realizadas nesta conta."
            />
          )}
        </div>
      </main>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-md">
      <div
        className="mb-3 flex h-9 w-9 items-center justify-center rounded-md"
        style={{ backgroundColor: `${accent}20` }}
      >
        <Icon size={18} style={{ color: accent }} />
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs font-medium text-white/45">{label}</p>
    </div>
  );
}

function PaymentCard({ pickup, paying = {}, onPay, compact = false }) {
  const config = PAYMENT_STATUS[pickup.paymentState] || PAYMENT_STATUS.UNPAID;
  const pickupId = getPickupId(pickup);
  const isPaying = paying.pickupId === pickupId;
  const canChoosePayment = ["UNPAID", "FAILED"].includes(pickup.paymentState);
  const pendingMessage =
    pickup.paymentMethod === "cash"
      ? "Dinheiro escolhido. O coletor confirma o recebimento durante a retirada."
      : "Pix iniciado. A confirmação ocorre automaticamente pelo PagSeguro.";

  return (
    <article className="rounded-lg border border-white/10 bg-white/5 p-5 backdrop-blur-md transition hover:border-white/20">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
            {getProtocol(pickup)}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">
            {CATEGORY_LABELS[pickup.category] || "Serviço de coleta"}
          </h2>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${config.className}`}
          style={{ color: config.color }}
        >
          <config.Icon size={13} /> {config.label}
        </span>
      </div>

      <div className="mt-4 space-y-2 text-sm text-white/55">
        <p className="flex items-start gap-2">
          <MapPin size={15} className="mt-0.5 shrink-0" />
          <span>{pickup.location?.address || pickup.area || "Endereço não informado"}</span>
        </p>
        <p className="flex items-center gap-2">
          <CalendarDays size={15} />
          {formatDate(pickup.completedAt || pickup.createdAt)}
        </p>
        {pickup.paymentMethod && (
          <p className="flex items-center gap-2">
            {pickup.paymentMethod === "pix" ? <QrCode size={15} /> : <Wallet size={15} />}
            {PAYMENT_METHOD_LABELS[pickup.paymentMethod] || pickup.paymentMethod}
          </p>
        )}
      </div>

      <div className="mt-5 flex items-end justify-between gap-4 border-t border-white/10 pt-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/35">
            Valor da coleta
          </p>
          <p className="mt-1 text-2xl font-bold text-white">
            {formatCurrency(pickup.estimatedPrice, pickup.currency)}
          </p>
        </div>
      </div>

      {!compact && canChoosePayment && onPay && (
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            disabled={isPaying}
            onClick={() => onPay(pickup, "pix")}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <QrCode size={17} />
            {isPaying && paying.method === "pix" ? "Processando..." : "Pagar com Pix"}
          </button>
          <button
            type="button"
            disabled={isPaying}
            onClick={() => onPay(pickup, "cash")}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Wallet size={17} />
            {isPaying && paying.method === "cash" ? "Processando..." : "Pagar na coleta"}
          </button>
        </div>
      )}

      {!compact && pickup.paymentState === "PENDING" && (
        <p className="mt-4 rounded-md border border-blue-500/20 bg-blue-500/10 px-3 py-2.5 text-xs font-semibold leading-relaxed text-blue-200">
          {pendingMessage}
        </p>
      )}
    </article>
  );
}

function EmptyState({ icon: Icon, title, message }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center border-y border-white/10 px-5 text-center">
      <Icon size={32} className="mb-4 text-white/25" />
      <h2 className="text-lg font-semibold text-white/70">{title}</h2>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/40">{message}</p>
    </div>
  );
}

export default BillingPage;
