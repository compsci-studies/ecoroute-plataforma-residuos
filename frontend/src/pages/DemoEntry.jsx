import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import TruckLoader from "../components/shared/TruckLoader";
import useAuthStore from "../stores/useAuthStore";
import {
  DEMO_ADMIN_CREDENTIALS,
  DEMO_CREDENTIALS,
  DEMO_DRIVER_CREDENTIALS,
} from "../utils/demoAuth";
import { getDashboardRoute } from "../utils/roleRouting";

const PROFILE_CREDENTIALS = {
  admin: DEMO_ADMIN_CREDENTIALS,
  gestor: DEMO_ADMIN_CREDENTIALS,
  cliente: DEMO_CREDENTIALS,
  customer: DEMO_CREDENTIALS,
  coletor: DEMO_DRIVER_CREDENTIALS,
  prestador: DEMO_DRIVER_CREDENTIALS,
  driver: DEMO_DRIVER_CREDENTIALS,
};

const PROFILE_LABELS = {
  admin: "perfil de administração",
  gestor: "perfil de administração",
  cliente: "perfil do cliente",
  customer: "perfil do cliente",
  coletor: "perfil do coletor",
  prestador: "perfil do coletor",
  driver: "perfil do coletor",
};

const ALLOWED_DEMO_DESTINATIONS = {
  super_admin: new Set([
    "/admin-dashboard",
    "/admin-dashboard/pickup-stats",
    "/admin-dashboard/reports",
  ]),
};

function resolveDemoDestination(role, requestedDestination) {
  const allowedDestinations = ALLOWED_DEMO_DESTINATIONS[role];
  if (requestedDestination && allowedDestinations?.has(requestedDestination)) {
    return requestedDestination;
  }

  return getDashboardRoute(role);
}

export default function DemoEntry() {
  const { profile = "admin" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const startedRef = useRef(false);
  const [error, setError] = useState("");
  const profileKey = String(profile).toLowerCase();
  const credentials = PROFILE_CREDENTIALS[profileKey];
  const requestedDestination = new URLSearchParams(location.search).get("to");

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (!credentials) return;

    login(credentials.email, credentials.password).then((result) => {
      if (!result.success) {
        setError(result.error || "Não foi possível abrir o perfil de demonstração.");
        return;
      }

      navigate(resolveDemoDestination(result.user.role, requestedDestination), { replace: true });
    });
  }, [credentials, login, navigate, requestedDestination]);

  const visibleError = !credentials ? "Perfil de demonstração não encontrado." : error;

  if (visibleError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-accent px-4 text-center">
        <div className="max-w-md rounded-2xl border border-primary/10 bg-white p-8 shadow-xl shadow-primary/10">
          <h1 className="text-2xl font-bold text-primary">Demonstração indisponível</h1>
          <p className="mt-3 text-sm leading-relaxed text-primary/60">{visibleError}</p>
          <Link
            to="/login"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white transition hover:bg-brand-primary-hover"
          >
            Voltar ao login
          </Link>
        </div>
      </main>
    );
  }

  const label = PROFILE_LABELS[profileKey] || "perfil de administração";

  return (
    <main className="flex min-h-screen items-center justify-center bg-accent px-4 text-center">
      <div className="max-w-sm rounded-2xl border border-primary/10 bg-white p-8 shadow-xl shadow-primary/10">
        <TruckLoader text={`Abrindo ${label}...`} />
      </div>
    </main>
  );
}
