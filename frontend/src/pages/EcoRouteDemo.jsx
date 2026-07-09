import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CalendarCheck,
  Clock,
  ExternalLink,
  FileText,
  LocateFixed,
  MapPin,
  PackageCheck,
  RefreshCw,
  Route,
  Scale,
  Search,
  ShieldCheck,
  Truck,
} from "lucide-react";

import LocationPickerMap from "../components/shared/LocationPickerMap";
import PickupBg from "../assets/ourteam.webp";
import api from "../utils/api";

const MATERIAL_LABELS = {
  reciclaveis: "Recicláveis",
  eletronicos: "Eletrônicos",
  eletrodomesticos: "Eletrodomésticos",
  entulho: "Entulho",
  moveis: "Móveis",
  oleo: "Óleo de cozinha",
  papel: "Papel e papelão",
  plastico: "Plástico",
  metal: "Metal",
  vidro: "Vidro",
  pilhas: "Pilhas",
  lampadas: "Lâmpadas",
};

const LEVELS = [
  { id: "easy", label: "Leve", detail: "até 35 kg" },
  { id: "medium", label: "Média", detail: "35 a 120 kg" },
  { id: "hard", label: "Alta", detail: "acima de 120 kg" },
];

const FALLBACK_MATERIALS = [
  { id: "reciclaveis" },
  { id: "eletronicos" },
  { id: "entulho" },
  { id: "moveis" },
  { id: "oleo" },
  { id: "vidro" },
];

function formatCurrency(value, currency = "BRL") {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency || "BRL",
  }).format(Number(value || 0));
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/45">
        {label}
      </span>
      {children}
    </label>
  );
}

function MetricPill({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-white/45">{label}</p>
          <p className="truncate text-base font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function StepRow({ number, title, text }) {
  return (
    <div className="flex gap-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sm font-bold text-white">
        {number}
      </span>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-1 text-sm leading-6 text-white/55">{text}</p>
      </div>
    </div>
  );
}

function PointRow({ point, active, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(point)}
      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
        active
          ? "border-primary/35 bg-primary text-white shadow-lg shadow-primary/20"
          : "border-primary/10 bg-white hover:border-primary/25"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`truncate text-sm font-bold ${active ? "text-white" : "text-primary"}`}>
            {point.name}
          </p>
          <p className={`mt-1 line-clamp-2 text-xs leading-relaxed ${active ? "text-white/65" : "text-primary/55"}`}>
            {point.address}
          </p>
        </div>
        {point.distanceKm !== undefined && (
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${active ? "bg-white/15 text-white" : "bg-primary/8 text-primary"}`}>
            {point.distanceKm} km
          </span>
        )}
      </div>
    </button>
  );
}

export default function EcoRouteDemo() {
  const [material, setMaterial] = useState("reciclaveis");
  const [materialOptions, setMaterialOptions] = useState([]);
  const [points, setPoints] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [source, setSource] = useState("ecoroute-official-cache");
  const [metrics, setMetrics] = useState(null);
  const [location, setLocation] = useState({ latitude: null, longitude: null, address: "" });
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [estimate, setEstimate] = useState(null);
  const [requestResult, setRequestResult] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    requesterName: "Cliente EcoRoute",
    contact: "cliente@ecoroute.com.br",
    weightKg: 24,
    volumeM3: 0.3,
    level: "easy",
    notes: "",
  });

  const sourceLabel = source === "recicla-sampa-live" ? "Recicla Sampa" : "Base oficial de pontos";
  const selectedMaterialLabel = MATERIAL_LABELS[material] || material;
  const materialButtons = materialOptions.length > 0 ? materialOptions : FALLBACK_MATERIALS;

  const loadPoints = useCallback(async () => {
    setLoadingPoints(true);
    setError("");
    try {
      const params = new URLSearchParams({ material, limit: "8" });
      if (location.latitude && location.longitude) {
        params.set("latitude", location.latitude);
        params.set("longitude", location.longitude);
      }
      if (location.address) params.set("address", location.address);

      const response = await api.get(`/demo/dropoff-points?${params.toString()}`);
      const nextPoints = response.data.points || [];
      setPoints(nextPoints);
      setMaterialOptions(response.data.materialOptions || []);
      setSource(response.data.source || "ecoroute-official-cache");
      setSelectedPoint((current) => nextPoints.find((point) => point.id === current?.id) || nextPoints[0] || null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Falha ao carregar pontos.");
    } finally {
      setLoadingPoints(false);
    }
  }, [location.address, location.latitude, location.longitude, material]);

  useEffect(() => {
    loadPoints();
  }, [loadPoints]);

  useEffect(() => {
    api.get("/demo/metrics")
      .then((response) => setMetrics(response.data.metrics))
      .catch(() => setMetrics(null));
  }, [requestResult?.id]);

  const estimatePayload = useMemo(() => ({
    latitude: location.latitude,
    longitude: location.longitude,
    address: location.address,
    material,
    weightKg: Number(form.weightKg) || 0,
    volumeM3: Number(form.volumeM3) || 0,
    level: form.level,
  }), [form.level, form.volumeM3, form.weightKg, location.address, location.latitude, location.longitude, material]);

  const handleEstimate = async () => {
    if (!location.latitude || !location.longitude) {
      setError("Selecione o endereço de retirada para calcular a coleta.");
      return null;
    }

    setEstimating(true);
    setError("");
    setRequestResult(null);
    try {
      const response = await api.post("/demo/pickup-estimate", estimatePayload);
      setEstimate(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Falha ao calcular coleta.");
      return null;
    } finally {
      setEstimating(false);
    }
  };

  const handleCreateRequest = async () => {
    let currentEstimate = estimate;
    if (!currentEstimate) {
      currentEstimate = await handleEstimate();
      if (!currentEstimate) return;
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await api.post("/demo/pickup-requests", {
        ...estimatePayload,
        requesterName: form.requesterName,
        contact: form.contact,
        notes: form.notes,
      });
      setRequestResult(response.data.request);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Falha ao criar solicitação.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-black font-['Outfit',sans-serif] text-white">
      <div
        className="fixed inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${PickupBg})` }}
      />
      <div className="fixed inset-0 z-0 bg-black/88 backdrop-blur-xs" />

      <div className="relative z-10 pt-24 pb-14">
        <section className="px-6 md:px-16 lg:px-24">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
                <Truck size={14} />
                EcoRoute coleta sob demanda
              </span>

              <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.2rem]">
                Solicitar coleta de resíduos
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-white/60 sm:text-lg">
                Informe o material, o volume e o endereço de retirada. A EcoRoute calcula a taxa,
                registra o protocolo e indica pontos de descarte próximos quando fizer sentido.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <MetricPill icon={CalendarCheck} label="Coleta" value="24h a 48h" />
            <MetricPill icon={MapPin} label="Pontos reais" value={metrics?.dropoffPoints || points.length || "-"} />
            <MetricPill icon={PackageCheck} label="Materiais" value={metrics?.materialOptions || materialButtons.length} />
            </div>
          </div>
        </section>

        <section className="mt-7 px-5 md:px-10 lg:px-16">
          <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl lg:grid-cols-[0.9fr_1.35fr]">
            <aside className="relative hidden min-h-[620px] overflow-hidden bg-primary px-7 py-8 text-white sm:px-10 lg:block lg:px-12">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-30"
                style={{ backgroundImage: `url(${PickupBg})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/90 to-black/80" />

              <div className="relative z-10 flex h-full flex-col">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/12">
                    <Truck className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Fluxo de coleta</p>
                    <p className="text-2xl font-bold tracking-tight">EcoRoute</p>
                  </div>
                </div>

                <div className="mt-10">
                  <h2 className="text-4xl font-bold leading-tight tracking-tight">
                    Coleta sob demanda com rastreio e pontos de apoio.
                  </h2>
                  <p className="mt-5 text-base leading-7 text-white/60">
                    Centralize solicitações residenciais e empresariais, precifique a retirada por peso,
                    volume e rota, e mantenha alternativas reais de descarte no mesmo atendimento.
                  </p>
                </div>

                <div className="mt-9 space-y-6">
                  <StepRow number="1" title="Material e volume" text="Identifique o resíduo, o peso aproximado, o volume e a dificuldade da retirada." />
                  <StepRow number="2" title="Endereço de coleta" text="Posicione o local de retirada e confira pontos próximos no mapa." />
                  <StepRow number="3" title="Taxa e protocolo" text="Calcule a taxa estimada e gere um protocolo rastreável para acompanhamento." />
                </div>

                <div className="mt-auto pt-9">
                  {estimate ? (
                    <div className="rounded-2xl border border-emerald-300/25 bg-emerald-300/10 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100/70">Estimativa atual</p>
                      <div className="mt-3 flex items-end justify-between gap-4">
                        <p className="text-4xl font-extrabold text-white">
                          {formatCurrency(estimate.estimatedPrice, estimate.currency)}
                        </p>
                        <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-bold text-white">
                          {estimate.distanceKm} km
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-white/70">
                        <span className="rounded-xl bg-white/8 px-3 py-2">
                          <Clock className="mr-1 inline h-3.5 w-3.5" />
                          {estimate.pickupWindow}
                        </span>
                        <span className="rounded-xl bg-white/8 px-3 py-2">
                          <Route className="mr-1 inline h-3.5 w-3.5" />
                          {Math.round(estimate.durationMinutes)} min
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                      <p className="text-sm font-semibold text-white">Preencha endereço e material</p>
                      <p className="mt-2 text-sm leading-6 text-white/55">
                        A estimativa aparece aqui antes da geração do protocolo.
                      </p>
                    </div>
                  )}

                  {requestResult && (
                    <div className="mt-4 rounded-2xl border border-blue-300/25 bg-blue-300/10 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100/70">Protocolo gerado</p>
                      <p className="mt-2 text-2xl font-extrabold text-white">{requestResult.id}</p>
                      <p className="mt-2 text-sm text-white/60">Status: {requestResult.status}</p>
                    </div>
                  )}
                </div>
              </div>
            </aside>

            <section className="bg-[#f8faf6] px-5 py-6 text-primary sm:px-8 lg:px-10">
              <div className="flex flex-col gap-4 border-b border-primary/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/40">Pedido de coleta</p>
                  <h2 className="mt-1 text-3xl font-bold tracking-tight text-primary">Dados da solicitação</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-primary shadow-sm">
                    <ShieldCheck size={14} />
                    Protocolo digital
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-primary shadow-sm">
                    <LocateFixed size={14} />
                    {sourceLabel}
                  </span>
                </div>
              </div>

              <div className="grid gap-6 py-6 xl:grid-cols-[0.92fr_1.08fr]">
                <div className="space-y-6">
                  <div>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/40">Material</p>
                        <p className="mt-1 text-xl font-extrabold">{selectedMaterialLabel}</p>
                      </div>
                      <button
                        type="button"
                        onClick={loadPoints}
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white transition hover:bg-primary/90"
                        aria-label="Atualizar pontos"
                      >
                        <RefreshCw size={17} className={loadingPoints ? "animate-spin" : ""} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {materialButtons.slice(0, 8).map((option) => {
                        const active = material === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => {
                              setMaterial(option.id);
                              setEstimate(null);
                              setRequestResult(null);
                            }}
                            className={`min-h-12 rounded-2xl border px-3 py-2 text-left text-xs font-bold transition ${
                              active
                                ? "border-primary bg-primary text-white shadow-lg shadow-primary/15"
                                : "border-primary/10 bg-white text-primary/65 hover:border-primary/25"
                            }`}
                          >
                            {MATERIAL_LABELS[option.id] || option.label || option.id}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Nome">
                      <input
                        value={form.requesterName}
                        onChange={(event) => setForm({ ...form, requesterName: event.target.value })}
                        className="h-12 w-full rounded-2xl border border-primary/12 bg-white px-4 text-sm outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/10"
                      />
                    </Field>
                    <Field label="Contato">
                      <input
                        value={form.contact}
                        onChange={(event) => setForm({ ...form, contact: event.target.value })}
                        className="h-12 w-full rounded-2xl border border-primary/12 bg-white px-4 text-sm outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/10"
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Peso kg">
                      <input
                        type="number"
                        min="0"
                        value={form.weightKg}
                        onChange={(event) => {
                          setForm({ ...form, weightKg: event.target.value });
                          setEstimate(null);
                          setRequestResult(null);
                        }}
                        className="h-12 w-full rounded-2xl border border-primary/12 bg-white px-4 text-sm outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/10"
                      />
                    </Field>
                    <Field label="Volume m3">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={form.volumeM3}
                        onChange={(event) => {
                          setForm({ ...form, volumeM3: event.target.value });
                          setEstimate(null);
                          setRequestResult(null);
                        }}
                        className="h-12 w-full rounded-2xl border border-primary/12 bg-white px-4 text-sm outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/10"
                      />
                    </Field>
                  </div>

                  <div>
                    <p className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/45">
                      Complexidade da retirada
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {LEVELS.map((level) => {
                        const active = form.level === level.id;
                        return (
                          <button
                            key={level.id}
                            type="button"
                            onClick={() => {
                              setForm({ ...form, level: level.id });
                              setEstimate(null);
                              setRequestResult(null);
                            }}
                            className={`rounded-2xl border px-3 py-3 text-center transition ${
                              active
                                ? "border-emerald-500 bg-emerald-50"
                                : "border-primary/10 bg-white hover:border-primary/25"
                            }`}
                          >
                            <span className="block text-xs font-extrabold text-primary">{level.label}</span>
                            <span className="block text-[10px] text-primary/45">{level.detail}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Field label="Observações">
                    <textarea
                      rows={3}
                      value={form.notes}
                      onChange={(event) => setForm({ ...form, notes: event.target.value })}
                      className="w-full resize-none rounded-2xl border border-primary/12 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/10"
                      placeholder="Ex.: retirar na portaria comercial"
                    />
                  </Field>

                  {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                      {error}
                    </div>
                  )}
                </div>

                <div className="space-y-5">
                  <div>
                    <div className="mb-3 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/40">Endereço e mapa</p>
                        <h3 className="mt-1 text-xl font-extrabold">Local de retirada</h3>
                      </div>
                      <span className="hidden items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-primary shadow-sm sm:inline-flex">
                        <MapPin size={14} />
                        São Paulo
                      </span>
                    </div>

                    <LocationPickerMap
                      value={location}
                      onChange={(nextLocation) => {
                        setLocation(nextLocation);
                        setEstimate(null);
                        setRequestResult(null);
                      }}
                      height="360px"
                      label=""
                      placeholder="Digite o endereço de retirada"
                      defaultCenter={selectedPoint ? [selectedPoint.latitude, selectedPoint.longitude] : [-23.55052, -46.63331]}
                      defaultZoom={12}
                      countryCodes="br"
                      markers={points}
                      onMarkerClick={setSelectedPoint}
                    />
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/40">Alternativa pública</p>
                        <h3 className="mt-1 text-xl font-extrabold">Pontos reais próximos</h3>
                      </div>
                      {selectedPoint && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${selectedPoint.latitude},${selectedPoint.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-2 text-xs font-bold text-white transition hover:bg-primary/90"
                        >
                          Abrir rota
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>

                    <div className="grid max-h-52 gap-2 overflow-y-auto pr-1">
                      {loadingPoints && (
                        <div className="rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm text-primary/55">
                          Carregando pontos...
                        </div>
                      )}
                      {!loadingPoints && points.map((point) => (
                        <PointRow
                          key={point.id}
                          point={point}
                          active={selectedPoint?.id === point.id}
                          onClick={setSelectedPoint}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 border-t border-primary/10 pt-5 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
                <button
                  type="button"
                  onClick={handleEstimate}
                  disabled={estimating}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-primary/15 bg-white px-5 text-sm font-extrabold text-primary transition hover:border-primary/35 disabled:opacity-60"
                >
                  {estimating ? <RefreshCw size={17} className="animate-spin" /> : <Search size={17} />}
                  Calcular taxa
                </button>

                <button
                  type="button"
                  onClick={handleCreateRequest}
                  disabled={submitting || estimating}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-extrabold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:opacity-60"
                >
                  {submitting ? <RefreshCw size={17} className="animate-spin" /> : <FileText size={17} />}
                  Gerar protocolo
                </button>

                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-primary/45 sm:justify-end">
                  <Scale size={14} />
                  Peso, volume e rota
                  <BadgeCheck size={14} />
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
