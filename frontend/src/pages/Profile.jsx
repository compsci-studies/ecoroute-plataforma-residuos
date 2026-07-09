import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut, Mail, Phone, Shield, MapPin, Truck, Building2,
  ChevronRight, Package, Calendar, Clock, CheckCircle,
  XCircle, ArrowLeft, Weight, User, History, Receipt,
  CreditCard, Wallet, Ban,
} from "lucide-react";
import useAuthStore from "../stores/useAuthStore";
import useBillingStore from "../stores/useBillingStore";
import { getDashboardRoute } from "../utils/roleRouting";
import api from "../utils/api";

const ROLE_LABELS = {
  customer_admin: "Cliente",
  driver: "Coletor",
  admin: "Administrador",
  organization_admin: "Gestor de cooperativa",
};

const STATUS_LABELS = {
  PENDING: "Pendente",
  ACCEPTED: "Aceita",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
  PAYMENT_REQUIRED: "Pagamento pendente",
  PAID: "Pago",
  OVERDUE: "Vencido",
};

const CATEGORY_LABELS = {
  organic: "Orgânico",
  recyclable: "Reciclável",
  electronic: "Eletrônico",
  hazardous: "Perigoso",
  bulky: "Volumoso",
  mixed: "Misto",
  waste: "Resíduo",
};

const PAYMENT_METHOD_LABELS = {
  pix: "Pix",
  wallet: "Carteira",
  cash: "Dinheiro",
  card: "Cartão",
};

const formatCurrency = (amount = 0) =>
  Number(amount).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const formatDate = (value, options = { day: "2-digit", month: "short", year: "numeric" }) => {
  if (!value) return "--";
  return new Date(value).toLocaleDateString("pt-BR", options);
};

const formatMonthYear = (year, month) =>
  new Date(year, month - 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

export default function Profile() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("info");
  const [driverProfile, setDriverProfile] = useState(null);
  const [pickupHistory, setPickupHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const isDriver = user?.role === "driver";
  const isCustomer = user?.role === "customer_admin";
  const { history: billingHistory, fetchPaymentHistory } = useBillingStore();

  // Fetch driver profile with truck & org
  useEffect(() => {
    if (!isDriver) return;
    (async () => {
      try {
        const res = await api.get("/driver/me");
        setDriverProfile(res.data.driver);
      } catch (error) {
        console.warn("Failed to load driver profile", error);
      }
    })();
  }, [isDriver]);

  // Fetch billing history for customers
  useEffect(() => {
    if (!isCustomer || activeTab !== "billing") return;
    fetchPaymentHistory();
  }, [isCustomer, activeTab, fetchPaymentHistory]);

  // Fetch pickup history for drivers and customers
  useEffect(() => {
    if ((!isDriver && !isCustomer) || activeTab !== "history") return;
    if (pickupHistory.length > 0) return;
    (async () => {
      setHistoryLoading(true);
      try {
        const endpoint = isCustomer ? "/pickups/my-pickups" : "/pickups/my-history";
        const res = await api.get(endpoint);
        setPickupHistory(res.data.pickups || []);
      } catch (error) {
        console.warn("Failed to load pickup history", error);
        if (isDriver) {
          // Fallback: try to fetch active pickup at least
          try {
            const res = await api.get("/pickups/active");
            if (res.data.pickup) setPickupHistory([res.data.pickup]);
          } catch (fallbackError) {
            console.warn("Failed to load active pickup fallback", fallbackError);
          }
        }
      } finally {
        setHistoryLoading(false);
      }
    })();
  }, [isDriver, isCustomer, activeTab, pickupHistory.length]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  if (!user) {
    navigate("/login", { replace: true });
    return null;
  }

  const initials = (user.name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const displayAddress = user.address || user.location?.address || null;
  const truck = driverProfile?.truck;
  const org = driverProfile?.organization;

  const tabs = isDriver
    ? [
        { key: "info", label: "Dados", Icon: User },
        { key: "truck", label: "Veículo", Icon: Truck },
        { key: "history", label: "Histórico", Icon: History },
      ]
    : isCustomer
    ? [
        { key: "info", label: "Dados", Icon: User },
        { key: "history", label: "Histórico", Icon: History },
        { key: "billing", label: "Pagamentos", Icon: Receipt },
      ]
    : [];

  return (
    <div className="min-h-screen bg-brand-surface-warm pb-24">
      <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-brand-primary-hover px-5 sm:px-8 pt-8 pb-16 sm:rounded-b-3xl">
        <button
          onClick={() => navigate(getDashboardRoute(user.role))}
          className="flex items-center gap-2 text-white/70 hover:text-white mb-6 transition"
        >
          <ArrowLeft size={18} /> Voltar
        </button>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white text-xl font-bold border border-white/20">
            {initials}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{user.name}</h1>
            <span className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 bg-white/15 rounded-full text-xs font-semibold text-white/80 capitalize">
              <Shield size={10} />
              {ROLE_LABELS[user.role] || user.role?.replace("_", " ")}
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 sm:px-8 -mt-8 space-y-4 max-w-2xl">

        {/* Tabs for drivers & customers */}
        {(isDriver || isCustomer) && tabs.length > 0 && (
          <div className="flex gap-1 bg-white rounded-2xl shadow-sm border border-primary/8 p-1.5">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === t.key
                    ? "bg-primary text-white shadow-md"
                    : "text-primary/50 hover:text-primary/70 hover:bg-primary/5"
                }`}
              >
                <t.Icon size={14} />
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* INFO TAB */}
        {(activeTab === "info" || (!isDriver && !isCustomer)) && (
          <div className="space-y-4">
            {/* Contact Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-primary/8 overflow-hidden">
              <div className="p-5 space-y-4">
                {user.email && (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <Mail size={16} className="text-blue-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-primary/40 uppercase tracking-wider font-medium">Email</p>
                      <p className="text-sm font-medium text-primary">{user.email}</p>
                    </div>
                  </div>
                )}
                {user.phone && (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                      <Phone size={16} className="text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-primary/40 uppercase tracking-wider font-medium">Telefone</p>
                      <p className="text-sm font-medium text-primary">{user.phone}</p>
                    </div>
                  </div>
                )}
                {displayAddress && (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                      <MapPin size={16} className="text-violet-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-primary/40 uppercase tracking-wider font-medium">Endereço</p>
                      <p className="text-sm font-medium text-primary">{displayAddress}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Organization Card (drivers) */}
            {isDriver && org && (
              <div className="bg-white rounded-2xl shadow-sm border border-primary/8 overflow-hidden">
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                      <Building2 size={18} className="text-teal-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-primary/40 uppercase tracking-wider font-medium">Organização</p>
                      <p className="text-base font-bold text-primary">{org.name}</p>
                    </div>
                  </div>
                  {org.address && (
                    <div className="rounded-xl bg-brand-surface-warm p-3 flex items-center gap-2">
                      <MapPin size={14} className="text-primary/30 shrink-0" />
                      <p className="text-xs text-primary/50">{org.address}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {!isDriver && (
                <button
                  onClick={() => navigate(getDashboardRoute(user.role))}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-2xl hover:opacity-95 transition active:scale-[0.98] text-sm"
                >
                  Ir para o painel
                </button>
              )}
              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-red-400 text-red-500 font-semibold rounded-2xl hover:bg-red-50 transition active:scale-[0.98] text-sm"
              >
                <LogOut size={16} />
                Sair
              </button>
            </div>
          </div>
        )}

        {/* BILLING TAB (customers only) */}
        {isCustomer && activeTab === "billing" && (
          <div className="space-y-4">
            {billingHistory.length > 0 ? (
              billingHistory.map((bill) => {
                const isPaid = bill.status === "PAID";
                return (
                  <div key={bill._id} className="bg-white rounded-2xl shadow-sm border border-primary/8 p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isPaid ? "bg-emerald-50" : "bg-violet-50"
                      }`}>
                        {isPaid ? <CheckCircle size={18} className="text-emerald-600" /> :
                         <Ban size={18} className="text-violet-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-primary">
                            {formatMonthYear(bill.billingYear, bill.billingMonth)}
                          </p>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isPaid ? "bg-emerald-100 text-emerald-700" : "bg-violet-100 text-violet-700"
                          }`}>
                            {STATUS_LABELS[bill.status] || bill.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-primary/45">
                          <span className="flex items-center gap-1 font-semibold text-primary/70">
                            {formatCurrency(bill.amount)}
                          </span>
                          {bill.paidAt && (
                            <span className="flex items-center gap-1">
                              <Calendar size={11} />
                              {formatDate(bill.paidAt)}
                            </span>
                          )}
                          {bill.paymentMethod && (
                            <span className="flex items-center gap-1">
                              {bill.paymentMethod === "pix" ? <CreditCard size={11} /> : <Wallet size={11} />}
                              {PAYMENT_METHOD_LABELS[bill.paymentMethod] || bill.paymentMethod}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-primary/8 p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-4">
                  <Receipt size={28} className="text-primary/25" />
                </div>
                <h3 className="text-base font-semibold text-primary/70 mb-1">Nenhum pagamento registrado</h3>
                <p className="text-sm text-primary/40 max-w-xs mx-auto">
                  Seus comprovantes aparecem aqui depois da primeira cobrança da EcoRoute.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TRUCK TAB (drivers only) */}
        {isDriver && activeTab === "truck" && (
          <div className="space-y-4">
            {truck ? (
              <>
                {/* Truck Visual */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <Truck size={24} className="text-white/80" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-white/60 font-medium">Placa</p>
                      <p className="text-2xl font-bold tracking-wider">{truck.licensePlate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${truck.isAvailable ? "bg-emerald-300" : "bg-amber-300"}`} />
                    <span className="text-sm font-medium text-white/80">
                      {truck.isAvailable ? "Disponível" : "Em rota"}
                    </span>
                  </div>
                </div>

                {/* Truck Details */}
                <div className="bg-white rounded-2xl shadow-sm border border-primary/8 p-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl bg-brand-surface-warm p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Weight size={14} className="text-primary/40" />
                        <p className="text-[10px] text-primary/40 uppercase tracking-wider font-medium">Capacidade</p>
                      </div>
                      <p className="text-xl font-bold text-primary">
                        {truck.capacity?.toLocaleString()}<span className="text-xs font-normal text-primary/40 ml-0.5">kg</span>
                      </p>
                    </div>
                    <div className="rounded-xl bg-brand-surface-warm p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield size={14} className="text-primary/40" />
                        <p className="text-[10px] text-primary/40 uppercase tracking-wider font-medium">Classe</p>
                      </div>
                      <DutyBadge duty={truck.dutyType} />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-primary/8 p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                  <Truck size={28} className="text-blue-400" />
                </div>
                <h3 className="text-base font-semibold text-primary/70 mb-1">Nenhum veículo atribuído</h3>
                <p className="text-sm text-primary/40">Fale com o administrador para vincular um veículo.</p>
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB (drivers and customers) */}
        {(isDriver || isCustomer) && activeTab === "history" && (
          <div className="space-y-4">
            {historyLoading && (
              <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-sm">
                <div className="w-10 h-10 border-4 border-primary/15 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-primary/50 mt-3">Carregando histórico...</p>
              </div>
            )}

            {!historyLoading && pickupHistory.length > 0 && (
              pickupHistory.map((p, idx) => {
                const status = p.status || "PENDING";
                const isCompleted = status === "COMPLETED";
                const isCancelled = status === "CANCELLED";
                const isPaymentRequired = status === "PAYMENT_REQUIRED";
                const pickupDate = p.completedAt || p.cancelledAt || p.createdAt;
                const driverName = p.driverInfo?.name || p.driver?.name;
                return (
                  <div key={p._id || p.id || idx} className="bg-white rounded-2xl shadow-sm border border-primary/8 p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isCompleted ? "bg-emerald-50" : isCancelled ? "bg-red-50" : isPaymentRequired ? "bg-orange-50" : "bg-amber-50"
                      }`}>
                        {isCompleted ? <CheckCircle size={18} className="text-emerald-600" /> :
                         isCancelled ? <XCircle size={18} className="text-red-500" /> :
                         isPaymentRequired ? <Receipt size={18} className="text-orange-500" /> :
                         <Clock size={18} className="text-amber-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-primary truncate">
                            {p.location?.address || "Solicitação de coleta"}
                          </p>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isCompleted ? "bg-emerald-100 text-emerald-700" :
                            isCancelled ? "bg-red-100 text-red-700" :
                            isPaymentRequired ? "bg-orange-100 text-orange-700" :
                            "bg-amber-100 text-amber-700"
                          }`}>
                            {STATUS_LABELS[status] || status.replace("_", " ")}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-primary/45">
                          <span className="flex items-center gap-1">
                            <Package size={11} /> {CATEGORY_LABELS[p.category] || p.category || "Resíduo"}
                          </span>
                          {p.level && (
                            <span className="flex items-center gap-1">
                              <Shield size={11} /> {p.level}
                            </span>
                          )}
                          {p.createdAt && (
                            <span className="flex items-center gap-1">
                              <Clock size={11} />
                              {formatDate(pickupDate)}
                            </span>
                          )}
                          {driverName && (
                            <span className="flex items-center gap-1">
                              <Truck size={11} />
                              {driverName}
                            </span>
                          )}
                          {p.estimatedPrice && (
                            <span className="flex items-center gap-1 font-semibold text-primary/60">
                              {formatCurrency(p.estimatedPrice)}
                              {p.paymentStatus ? ` (${STATUS_LABELS[p.paymentStatus] || p.paymentStatus})` : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {!historyLoading && pickupHistory.length === 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-primary/8 p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-4">
                  <History size={28} className="text-primary/25" />
                </div>
                <h3 className="text-base font-semibold text-primary/70 mb-1">Nenhum histórico ainda</h3>
                <p className="text-sm text-primary/40 max-w-xs mx-auto">
                  Suas solicitações aparecem aqui depois do primeiro pedido de coleta.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

function DutyBadge({ duty }) {
  const config = {
    "light duty":  { bg: "bg-blue-100", text: "text-blue-700", label: "Leve" },
    "medium duty": { bg: "bg-amber-100", text: "text-amber-700", label: "Média" },
    "heavy duty":  { bg: "bg-red-100", text: "text-red-700", label: "Pesada" },
  };
  const c = config[duty] || { bg: "bg-gray-100", text: "text-gray-600", label: duty || "--" };
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}
