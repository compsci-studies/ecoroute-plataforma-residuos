import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  MapPin,
  Package,
  ReceiptText,
  RefreshCcw,
  ShieldCheck,
  Truck,
  XCircle,
} from "lucide-react";

import ScheduleBg from "../../assets/schedule_truck.jpg";
import api from "../../utils/api";
import { getSocket } from "../../utils/socket";
import TruckLoader from "../shared/TruckLoader";

const ACTIVE_STATUSES = new Set([
  "PAYMENT_REQUIRED",
  "PENDING",
  "ASSIGNED",
  "EN_ROUTE",
  "ARRIVED",
  "COLLECTING",
]);
const SERVICE_STATUSES = new Set(["PENDING", "ASSIGNED", "EN_ROUTE", "ARRIVED", "COLLECTING"]);
const STATUSES_WITH_COLLECTOR = new Set(["ASSIGNED", "EN_ROUTE", "ARRIVED", "COLLECTING", "COMPLETED"]);

const STATUS = {
  PAYMENT_REQUIRED: {
    label: "Pagamento pendente",
    description: "Escolha a forma de pagamento para liberar o pedido aos coletores.",
    className: "border-amber-400/30 bg-amber-400/10 text-amber-200",
    icon: CreditCard,
  },
  PENDING: {
    label: "Aguardando coletor",
    description: "O pedido foi liberado e está disponível para aceite.",
    className: "border-yellow-400/30 bg-yellow-400/10 text-yellow-100",
    icon: Clock3,
  },
  ASSIGNED: {
    label: "Coletor atribuído",
    description: "Um coletor aceitou a solicitação e prepara o deslocamento.",
    className: "border-blue-400/30 bg-blue-400/10 text-blue-100",
    icon: Truck,
  },
  EN_ROUTE: {
    label: "Em deslocamento",
    description: "O coletor está a caminho do endereço informado.",
    className: "border-indigo-400/30 bg-indigo-400/10 text-indigo-100",
    icon: Truck,
  },
  ARRIVED: {
    label: "No local",
    description: "O coletor chegou ao endereço da retirada.",
    className: "border-violet-400/30 bg-violet-400/10 text-violet-100",
    icon: MapPin,
  },
  COLLECTING: {
    label: "Coletando",
    description: "A retirada do material está em andamento.",
    className: "border-cyan-400/30 bg-cyan-400/10 text-cyan-100",
    icon: Package,
  },
  COMPLETED: {
    label: "Concluída",
    description: "A retirada foi finalizada e registrada no histórico.",
    className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Cancelada",
    description: "A solicitação foi cancelada e não será executada.",
    className: "border-rose-400/30 bg-rose-400/10 text-rose-100",
    icon: XCircle,
  },
  EXPIRED: {
    label: "Expirada",
    description: "O prazo de aceite terminou sem disponibilidade de coletor.",
    className: "border-slate-400/30 bg-slate-400/10 text-slate-200",
    icon: AlertCircle,
  },
  REJECTED: {
    label: "Não atendida",
    description: "A solicitação não pôde ser atendida nas condições informadas.",
    className: "border-rose-400/30 bg-rose-400/10 text-rose-100",
    icon: AlertCircle,
  },
};

const CATEGORY_LABELS = {
  recyclable: "Recicláveis",
  "non-recyclable": "Não recicláveis",
  both: "Materiais mistos",
  mixed: "Materiais mistos",
};

const LEVEL_LABELS = {
  easy: "Retirada leve",
  medium: "Retirada média",
  hard: "Retirada alta",
};

const FILTERS = [
  { id: "active", label: "Pendentes e em andamento" },
  { id: "completed", label: "Concluídas" },
  { id: "cancelled", label: "Encerradas sem coleta" },
  { id: "all", label: "Todas" },
];

function formatDate(value) {
  if (!value) return "Data não informada";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(value, currency = "BRL") {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: currency || "BRL",
  });
}

function pickupMatchesFilter(pickup, filter) {
  if (filter === "all") return true;
  if (filter === "active") return ACTIVE_STATUSES.has(pickup.status);
  if (filter === "completed") return pickup.status === "COMPLETED";
  return ["CANCELLED", "EXPIRED", "REJECTED"].includes(pickup.status);
}

function SummaryCard({ icon: Icon, label, value, detail }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/10 text-white/75">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-sm font-semibold text-white/70">{label}</p>
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-white/40">{detail}</p>
    </div>
  );
}

function PickupCard({ pickup, onOpen }) {
  const status = STATUS[pickup.status] || STATUS.PENDING;
  const StatusIcon = status.icon;
  const pickupId = pickup.id || pickup._id;
  const canOpen = ACTIVE_STATUSES.has(pickup.status);

  return (
    <article className="rounded-xl border border-white/10 bg-black/35 p-5 backdrop-blur-md transition hover:border-white/20 hover:bg-black/45">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35">Protocolo</p>
          <h2 className="mt-1 truncate text-lg font-bold text-white">{pickupId}</h2>
          <p className="mt-1 text-sm text-white/45">Solicitada em {formatDate(pickup.createdAt)}</p>
        </div>
        <span className={`inline-flex w-fit items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${status.className}`}>
          <StatusIcon className="h-4 w-4" />
          {status.label}
        </span>
      </div>

      <div className="mt-5 grid gap-4 border-y border-white/10 py-4 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/35">Endereço da retirada</p>
          <p className="mt-1 flex items-start gap-2 text-sm leading-6 text-white/75">
            <MapPin className="mt-1 h-4 w-4 shrink-0 text-white/40" />
            <span>{pickup.location?.address || pickup.area || "Endereço não informado"}</span>
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-white/35">Material</p>
          <p className="mt-2 text-sm font-semibold text-white/75">{CATEGORY_LABELS[pickup.category] || "Não informado"}</p>
          <p className="mt-1 text-xs text-white/40">{LEVEL_LABELS[pickup.level] || "Complexidade não informada"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-white/35">Valor estimado</p>
          <p className="mt-2 text-lg font-bold text-white">{formatCurrency(pickup.estimatedPrice, pickup.currency)}</p>
          <p className="mt-1 text-xs text-white/40">{pickup.paymentStatus === "PAID" ? "Pagamento confirmado" : "Consulte o status do pagamento"}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-white/75">{status.description}</p>
          {STATUSES_WITH_COLLECTOR.has(pickup.status) && pickup.driverInfo?.name && (
            <p className="mt-1 text-xs text-white/45">
              Coletor: {pickup.driverInfo.name}{pickup.driverInfo.licensePlate ? ` · Veículo ${pickup.driverInfo.licensePlate}` : ""}
            </p>
          )}
        </div>
        {canOpen && (
          <button
            type="button"
            onClick={() => onOpen(pickup)}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            {pickup.status === "PAYMENT_REQUIRED" ? <CreditCard className="h-4 w-4" /> : <ReceiptText className="h-4 w-4" />}
            {pickup.status === "PAYMENT_REQUIRED" ? "Concluir pagamento" : "Acompanhar pedido"}
          </button>
        )}
      </div>
    </article>
  );
}

function SchedulePage() {
  const navigate = useNavigate();
  const [pickups, setPickups] = useState([]);
  const [filter, setFilter] = useState("active");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPickups = useCallback(async ({ showLoader = false } = {}) => {
    if (showLoader) setLoading(true);
    try {
      const response = await api.get("/pickups/my-pickups");
      setPickups(response.data.pickups || []);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Não foi possível carregar suas coletas.");
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPickups({ showLoader: true });
  }, [loadPickups]);

  useEffect(() => {
    const socket = getSocket();
    const refresh = () => loadPickups();
    socket.on("pickup:statusUpdate", refresh);
    socket.on("pickup:accepted", refresh);
    socket.on("pickup:created", refresh);
    socket.on("pickup:cancelled", refresh);
    socket.on("payment:updated", refresh);
    return () => {
      socket.off("pickup:statusUpdate", refresh);
      socket.off("pickup:accepted", refresh);
      socket.off("pickup:created", refresh);
      socket.off("pickup:cancelled", refresh);
      socket.off("payment:updated", refresh);
    };
  }, [loadPickups]);

  const filteredPickups = useMemo(
    () => pickups.filter((pickup) => pickupMatchesFilter(pickup, filter)),
    [filter, pickups],
  );

  const counts = useMemo(() => ({
    active: pickups.filter((pickup) => SERVICE_STATUSES.has(pickup.status)).length,
    payment: pickups.filter((pickup) => pickup.status === "PAYMENT_REQUIRED").length,
    completed: pickups.filter((pickup) => pickup.status === "COMPLETED").length,
    total: pickups.length,
  }), [pickups]);

  const openPickup = (pickup) => {
    const pickupId = pickup.id || pickup._id;
    navigate(`/searching?pickupId=${encodeURIComponent(pickupId)}`);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-black font-['Outfit',sans-serif]">
      <div className="fixed inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${ScheduleBg})` }} />
      <div className="fixed inset-0 bg-black/90 backdrop-blur-xs" />

      <div className="relative z-10 px-5 pb-16 pt-28 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">Área do cliente</span>
              <h1 className="mt-3 text-4xl font-bold text-white sm:text-5xl">Minhas coletas</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/55">
                Consulte somente as solicitações vinculadas à sua conta, do pagamento até a conclusão da retirada.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/upload-waste")}
              className="inline-flex min-h-12 w-fit items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              <Package className="h-4 w-4" />
              Solicitar nova coleta
            </button>
          </div>

          <div className="mt-8 flex items-start gap-3 border-y border-white/10 py-5">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
            <div>
              <p className="text-sm font-semibold text-white">O que aparece nesta página</p>
              <p className="mt-1 max-w-4xl text-sm leading-6 text-white/45">
                Você vê endereço, material, valor, pagamento e andamento dos seus próprios pedidos. Previsões por bairro, veículos disponíveis e planejamento de rotas são dados operacionais restritos à administração e aos gestores dos operadores.
              </p>
            </div>
          </div>

          <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumo das coletas do cliente">
            <SummaryCard icon={Truck} label="Em atendimento" value={counts.active} detail="Pedidos já liberados para aceite ou execução pelos coletores." />
            <SummaryCard icon={CreditCard} label="Aguardando pagamento" value={counts.payment} detail="Pedidos que ainda precisam da forma de pagamento." />
            <SummaryCard icon={CheckCircle2} label="Concluídas" value={counts.completed} detail="Retiradas finalizadas e registradas no histórico." />
            <SummaryCard icon={CalendarDays} label="Total de solicitações" value={counts.total} detail="Todos os pedidos vinculados a esta conta." />
          </section>

          <section className="mt-8" aria-labelledby="pickup-list-title">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 id="pickup-list-title" className="text-xl font-bold text-white">Histórico e acompanhamento</h2>
                <p className="mt-1 text-sm text-white/40">Selecione um filtro para localizar rapidamente cada solicitação.</p>
              </div>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filtros de coletas">
                {FILTERS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFilter(item.id)}
                    className={`min-h-10 rounded-lg border px-3 text-xs font-semibold transition ${
                      filter === item.id
                        ? "border-white bg-white text-black"
                        : "border-white/10 bg-white/5 text-white/55 hover:border-white/25 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-72 flex-col items-center justify-center gap-4">
                <TruckLoader />
                <p className="text-sm text-white/45">Carregando suas coletas...</p>
              </div>
            ) : error ? (
              <div className="mt-6 flex min-h-64 flex-col items-center justify-center rounded-xl border border-rose-400/20 bg-rose-400/10 px-5 text-center">
                <AlertCircle className="h-8 w-8 text-rose-200" />
                <p className="mt-3 font-semibold text-rose-100">{error}</p>
                <button type="button" onClick={() => loadPickups({ showLoader: true })} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black">
                  <RefreshCcw className="h-4 w-4" />
                  Tentar novamente
                </button>
              </div>
            ) : filteredPickups.length > 0 ? (
              <div className="mt-6 space-y-4">
                {filteredPickups.map((pickup) => (
                  <PickupCard key={pickup.id || pickup._id} pickup={pickup} onOpen={openPickup} />
                ))}
              </div>
            ) : (
              <div className="mt-6 flex min-h-64 flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-5 text-center">
                <Package className="h-9 w-9 text-white/25" />
                <p className="mt-4 text-lg font-semibold text-white">Nenhuma coleta neste filtro</p>
                <p className="mt-1 text-sm text-white/40">Escolha outro filtro ou registre uma nova solicitação.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

export default SchedulePage;
