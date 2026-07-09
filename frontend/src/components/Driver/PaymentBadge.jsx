import { Banknote, Smartphone, CheckCircle2, Clock, XCircle } from "lucide-react";

/**
 * Driver-facing payment status banner.
 * Tells the driver clearly: was it pre-paid online, or do they need to collect cash?
 */
export default function PaymentBadge({ pickup, compact = false }) {
  if (!pickup) return null;
  const method = pickup.paymentMethod || "cash";
  const status = pickup.paymentStatus || "UNPAID";
  const amount = pickup.estimatedPrice;
  const amountLabel = amount == null
    ? "--"
    : Number(amount).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });

  const isDigitalPayment = method === "esewa" || method === "pix";
  const isPaid = status === "PAID";
  const isFailed = status === "FAILED";
  const isPending = status === "PENDING";

  // Determine theme & message
  let theme, Icon, title, message;

  if (isDigitalPayment && isPaid) {
    theme = { bg: "bg-emerald-100", border: "border-emerald-400", text: "text-emerald-900", icon: "text-emerald-700" };
    Icon = CheckCircle2;
    title = "PAGO VIA PIX";
    message = "O cliente ja pagou. Não cobre dinheiro no local.";
  } else if (isDigitalPayment && isPending) {
    theme = { bg: "bg-amber-100", border: "border-amber-400", text: "text-amber-900", icon: "text-amber-700" };
    Icon = Clock;
    title = "PIX PENDENTE";
    message = "Aguardando confirmação. Não cobre dinheiro antes de conferir no app.";
  } else if (isDigitalPayment && isFailed) {
    theme = { bg: "bg-red-100", border: "border-red-400", text: "text-red-900", icon: "text-red-700" };
    Icon = XCircle;
    title = "PIX RECUSADO";
    message = "O pagamento não foi confirmado. Receba em dinheiro no local.";
  } else {
    // cash (default)
    Icon = isPaid ? CheckCircle2 : Banknote;
    theme = isPaid
      ? { bg: "bg-emerald-100", border: "border-emerald-400", text: "text-emerald-900", icon: "text-emerald-700" }
      : { bg: "bg-orange-100", border: "border-orange-400", text: "text-orange-900", icon: "text-orange-700" };
    title = isPaid ? "DINHEIRO RECEBIDO" : "PAGAMENTO NO LOCAL";
    message = isPaid
      ? "O valor foi confirmado e registrado na coleta."
      : `Receba ${amountLabel} do cliente e depois toque em Dinheiro recebido.`;
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 rounded-xl border-2 ${theme.bg} ${theme.border} px-3 py-2`}>
        <Icon size={16} className={theme.icon} />
        <div className="leading-tight">
          <p className={`text-[10px] font-extrabold uppercase tracking-wider ${theme.text}`}>{title}</p>
          <p className={`text-xs font-bold ${theme.text}`}>{amountLabel}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border-2 ${theme.bg} ${theme.border} p-4 flex items-start gap-3 shadow-sm`}>
      <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 border ${theme.border}`}>
        {isDigitalPayment ? <Smartphone size={20} className={theme.icon} /> : <Icon size={20} className={theme.icon} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className={`text-xs font-extrabold uppercase tracking-wider ${theme.text}`}>{title}</p>
          <p className={`text-sm font-extrabold ${theme.text}`}>{amountLabel}</p>
        </div>
        <p className={`text-xs font-semibold ${theme.text}`}>{message}</p>
      </div>
    </div>
  );
}
