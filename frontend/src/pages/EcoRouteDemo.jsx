import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  Calculator,
  CalendarCheck,
  ChevronDown,
  Clock,
  ExternalLink,
  LocateFixed,
  LogIn,
  MapPin,
  PackageCheck,
  RefreshCw,
  Route,
  Scale,
  Search,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import LocationPickerMap from "../components/shared/LocationPickerMap";
import PickupBg from "../assets/ourteam.webp";
import useAuthStore from "../stores/useAuthStore";
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

const VOLUME_DIMENSIONS = [
  { key: "length", label: "Comprimento", placeholder: "1,0" },
  { key: "width", label: "Largura", placeholder: "0,6" },
  { key: "height", label: "Altura", placeholder: "0,5" },
];

function formatCurrency(value, currency = "BRL") {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency || "BRL",
  }).format(Number(value || 0));
}

function parseLocalizedDecimal(value) {
  const parsed = Number(String(value).trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatVolume(value) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  }).format(value);
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
  const routeLocation = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const isCustomer = isAuthenticated && user?.role === "customer_admin";
  const resultRef = useRef(null);
  const [material, setMaterial] = useState("reciclaveis");
  const [materialOptions, setMaterialOptions] = useState([]);
  const [points, setPoints] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [source, setSource] = useState("ecoroute-official-cache");
  const [metrics, setMetrics] = useState(null);
  const [location, setLocation] = useState({ latitude: null, longitude: null, address: "" });
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [estimate, setEstimate] = useState(null);
  const [error, setError] = useState("");
  const [showVolumeCalculator, setShowVolumeCalculator] = useState(false);
  const [volumeDimensions, setVolumeDimensions] = useState({
    length: "",
    width: "",
    height: "",
  });
  const [form, setForm] = useState({
    weightKg: 24,
    volumeM3: 0.3,
    level: "easy",
  });

  const sourceLabel = source === "recicla-sampa-live" ? "Recicla Sampa" : "Base oficial de pontos";
  const selectedMaterialLabel = MATERIAL_LABELS[material] || material;
  const materialButtons = materialOptions.length > 0 ? materialOptions : FALLBACK_MATERIALS;
  const calculatedVolume = useMemo(() => {
    const dimensions = VOLUME_DIMENSIONS.map(({ key }) => parseLocalizedDecimal(volumeDimensions[key]));
    if (dimensions.some((dimension) => dimension <= 0)) return null;
    return dimensions.reduce((total, dimension) => total * dimension, 1);
  }, [volumeDimensions]);

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
  }, []);

  useEffect(() => {
    const targetId = routeLocation.hash.slice(1);
    if (!targetId) return undefined;

    const frame = window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [routeLocation.hash]);

  useEffect(() => {
    if (!estimate) return undefined;

    const frame = window.requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [estimate]);

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

  const handleStartPickup = () => {
    if (isCustomer) {
      navigate("/upload-waste");
      return;
    }

    navigate("/login", { state: { intent: "pickup" } });
  };

  const applyCalculatedVolume = () => {
    if (!calculatedVolume) return;

    setForm((current) => ({
      ...current,
      volumeM3: Number(calculatedVolume.toFixed(3)),
    }));
    setEstimate(null);
    setShowVolumeCalculator(false);
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
                Consulta pública
              </span>

              <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.2rem]">
                Simule uma coleta e consulte pontos de descarte
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-white/60 sm:text-lg">
                Sem login, você pode estimar a taxa e localizar ecopontos reais. Para registrar
                o pedido e gerar um protocolo, entre com um perfil de cliente.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <MetricPill icon={CalendarCheck} label="Coleta" value="24h a 48h" />
            <MetricPill icon={MapPin} label="Pontos reais" value={metrics?.dropoffPoints || points.length || "-"} />
            <MetricPill icon={PackageCheck} label="Materiais" value={metrics?.materialOptions || materialButtons.length} />
            </div>
          </div>
        </section>

        <section id="solicitacao" className="mt-7 scroll-mt-24 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
          <div className="mx-auto grid max-w-[90rem] overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl xl:grid-cols-[minmax(20rem,0.72fr)_minmax(0,1.6fr)]">
            <aside className="relative hidden min-h-[620px] overflow-hidden bg-primary px-10 py-8 text-white xl:block">
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
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Simulação pública</p>
                    <p className="text-2xl font-bold tracking-tight">EcoRoute</p>
                  </div>
                </div>

                <div className="mt-10">
                  <h2 className="text-4xl font-bold leading-tight tracking-tight">
                    Planeje a retirada antes de solicitar.
                  </h2>
                  <p className="mt-5 text-base leading-7 text-white/60">
                    Consulte material, peso, volume, rota e pontos de descarte sem criar um pedido.
                    A solicitação real fica vinculada à conta do cliente.
                  </p>
                </div>

                <div className="mt-9 space-y-6">
                  <StepRow number="1" title="Material e volume" text="Identifique o resíduo, o peso aproximado, o volume e a dificuldade da retirada." />
                  <StepRow number="2" title="Endereço de referência" text="Posicione o local no mapa e confira pontos de descarte próximos." />
                  <StepRow number="3" title="Taxa e acesso" text="Calcule a estimativa e entre como cliente para registrar a coleta e gerar o protocolo." />
                </div>

              </div>
            </aside>

            <section className="min-w-0 bg-[#f8faf6] px-5 py-6 text-primary sm:px-8 xl:px-10">
              <div className="flex flex-col gap-4 border-b border-primary/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/40">Simulação de coleta</p>
                  <h2 className="mt-1 text-3xl font-bold tracking-tight text-primary">Dados para estimativa</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-primary shadow-sm">
                    <ShieldCheck size={14} />
                    Nenhum pedido é criado
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-primary shadow-sm">
                    <LocateFixed size={14} />
                    {sourceLabel}
                  </span>
                </div>
              </div>

              <div className="grid min-w-0 gap-6 py-6 2xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
                <div className="min-w-0 space-y-6">
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
                    <Field label="Peso kg">
                      <input
                        type="number"
                        min="0"
                        value={form.weightKg}
                        onChange={(event) => {
                          setForm({ ...form, weightKg: event.target.value });
                          setEstimate(null);
                        }}
                        className="h-12 w-full rounded-2xl border border-primary/12 bg-white px-4 text-sm outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/10"
                      />
                    </Field>
                    <Field label="Volume aproximado">
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.volumeM3}
                          onChange={(event) => {
                            setForm({ ...form, volumeM3: event.target.value });
                            setEstimate(null);
                          }}
                          aria-describedby="volume-help"
                          className="h-12 w-full rounded-2xl border border-primary/12 bg-white px-4 pr-12 text-sm outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/10"
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-bold text-primary/45">
                          m³
                        </span>
                      </div>
                      <span id="volume-help" className="mt-2 block text-xs leading-5 text-primary/55">
                        Espaço total ocupado. Ex.: 1,0 m × 0,6 m × 0,5 m = 0,30 m³.
                      </span>
                    </Field>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-primary/10 bg-white/70">
                    <button
                      type="button"
                      onClick={() => setShowVolumeCalculator((current) => !current)}
                      aria-expanded={showVolumeCalculator}
                      aria-controls="volume-calculator"
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left outline-none transition hover:bg-primary/[0.03] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/20"
                    >
                      <span className="flex items-center gap-3 text-sm font-bold text-primary">
                        <Calculator size={17} />
                        Não sabe o volume? Calcule pelas medidas
                      </span>
                      <ChevronDown
                        size={17}
                        className={`shrink-0 text-primary/45 transition ${showVolumeCalculator ? "rotate-180" : ""}`}
                      />
                    </button>

                    {showVolumeCalculator && (
                      <div id="volume-calculator" className="border-t border-primary/10 px-4 py-4">
                        <p className="text-xs leading-5 text-primary/55">
                          Meça em metros a menor caixa imaginária que comportaria todo o material.
                        </p>

                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                          {VOLUME_DIMENSIONS.map(({ key, label, placeholder }) => (
                            <label key={key} className="block">
                              <span className="mb-1.5 block text-[11px] font-semibold text-primary/55">
                                {label}
                              </span>
                              <span className="relative block">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={volumeDimensions[key]}
                                  onChange={(event) => {
                                    const nextValue = event.target.value.replace(/[^0-9.,]/g, "");
                                    setVolumeDimensions((current) => ({ ...current, [key]: nextValue }));
                                  }}
                                  placeholder={placeholder}
                                  className="h-11 w-full rounded-xl border border-primary/12 bg-white px-3 pr-7 text-sm outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/10"
                                />
                                <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-[11px] font-bold text-primary/40">
                                  m
                                </span>
                              </span>
                            </label>
                          ))}
                        </div>

                        <div className="mt-4 flex flex-col gap-3 rounded-xl bg-primary/[0.04] p-3 sm:flex-row sm:items-center sm:justify-between">
                          <div aria-live="polite">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary/45">
                              Volume calculado
                            </p>
                            <p className="mt-0.5 text-lg font-extrabold text-primary">
                              {calculatedVolume ? `${formatVolume(calculatedVolume)} m³` : "Preencha as três medidas"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={applyCalculatedVolume}
                            disabled={!calculatedVolume}
                            aria-label={calculatedVolume ? `Usar volume de ${formatVolume(calculatedVolume)} metros cúbicos` : "Usar volume calculado"}
                            className="min-h-11 whitespace-nowrap rounded-xl bg-primary px-3 text-xs font-bold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Usar volume
                          </button>
                        </div>
                      </div>
                    )}
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

                  {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                      {error}
                    </div>
                  )}
                </div>

                <div className="min-w-0 space-y-5">
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

                  <div id="pontos-de-descarte" className="scroll-mt-28">
                    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/40">Alternativa pública</p>
                        <h3 className="mt-1 text-xl font-extrabold">Pontos reais próximos</h3>
                      </div>
                      {selectedPoint && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${selectedPoint.latitude},${selectedPoint.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-primary px-3 py-2 text-xs font-bold text-white transition hover:bg-primary/90"
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

              <div className="grid gap-3 border-t border-primary/10 pt-5 lg:grid-cols-2 lg:items-center 2xl:grid-cols-[1fr_1fr_auto]">
                <button
                  id="calculo-da-taxa"
                  type="button"
                  onClick={handleEstimate}
                  disabled={estimating}
                  className="inline-flex h-12 scroll-mt-28 items-center justify-center gap-2 rounded-full border border-primary/15 bg-white px-5 text-sm font-extrabold text-primary transition hover:border-primary/35 disabled:opacity-60"
                >
                  {estimating ? <RefreshCw size={17} className="animate-spin" /> : <Search size={17} />}
                  Calcular taxa
                </button>

                <button
                  id="geracao-de-protocolo"
                  type="button"
                  onClick={handleStartPickup}
                  className="inline-flex h-12 scroll-mt-28 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-extrabold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90"
                >
                  {isCustomer ? <Truck size={17} /> : <LogIn size={17} />}
                  {isCustomer ? "Continuar solicitação" : "Entrar para solicitar"}
                </button>

                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-primary/45 lg:col-span-2 2xl:col-span-1 2xl:justify-end">
                  <Scale size={14} />
                  Peso, volume e rota
                  <BadgeCheck size={14} />
                </div>
              </div>

              {estimate && (
                <section
                  ref={resultRef}
                  aria-live="polite"
                  aria-label="Resultado da simulação"
                  className="mt-5 scroll-mt-28 overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-sm"
                >
                  <div className="flex flex-col gap-3 border-b border-primary/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary/40">
                        Resultado da simulação
                      </p>
                      <h3 className="mt-1 text-xl font-extrabold text-primary">
                        Estimativa pronta para revisão
                      </h3>
                    </div>
                    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                      <BadgeCheck size={14} />
                      Dados calculados
                    </span>
                  </div>

                  <div className="p-5 sm:p-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <p className="text-xs font-semibold text-primary/45">Taxa estimada</p>
                            <p className="mt-1 text-4xl font-extrabold tracking-tight text-primary">
                              {formatCurrency(estimate.estimatedPrice, estimate.currency)}
                            </p>
                          </div>
                          <span className="w-fit rounded-full border border-primary/10 bg-[#f8faf6] px-3 py-2 text-xs font-bold text-primary/65">
                            {selectedMaterialLabel}
                          </span>
                        </div>

                        <dl className="mt-5 grid border-y border-primary/10 sm:grid-cols-3 sm:divide-x sm:divide-primary/10">
                          <div className="py-4 sm:pr-4">
                            <dt className="flex items-center gap-2 text-xs font-semibold text-primary/45">
                              <Route size={14} />
                              Distância
                            </dt>
                            <dd className="mt-1 text-base font-extrabold text-primary">{estimate.distanceKm} km</dd>
                          </div>
                          <div className="border-t border-primary/10 py-4 sm:border-t-0 sm:px-4">
                            <dt className="flex items-center gap-2 text-xs font-semibold text-primary/45">
                              <Clock size={14} />
                              Tempo de rota
                            </dt>
                            <dd className="mt-1 text-base font-extrabold text-primary">
                              {Math.round(estimate.durationMinutes)} min
                            </dd>
                          </div>
                          <div className="border-t border-primary/10 py-4 sm:border-t-0 sm:pl-4">
                            <dt className="flex items-center gap-2 text-xs font-semibold text-primary/45">
                              <CalendarCheck size={14} />
                              Janela de coleta
                            </dt>
                            <dd className="mt-1 text-base font-extrabold text-primary">{estimate.pickupWindow}</dd>
                          </div>
                        </dl>

                        <p className="mt-4 text-xs leading-5 text-primary/45">
                          Esta estimativa não cria um pedido. Entre como cliente para registrar a coleta,
                          escolher o pagamento e acompanhar o protocolo.
                        </p>
                  </div>
                </section>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
