import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, CalendarDays, Recycle, LockKeyhole, ShieldCheck } from 'lucide-react';
import { authAPI } from '../../utils/api';
import useAuthStore from '../../stores/useAuthStore';
import { DEMO_ADMIN_CREDENTIALS, DEMO_CREDENTIALS, DEMO_DRIVER_CREDENTIALS } from '../../utils/demoAuth';
import { ecorouteImages } from '../../assets/ecorouteImages';
import { getDashboardRoute } from '../../utils/roleRouting';
import OTPModal from './OTPModal';
import TruckLoader from '../shared/TruckLoader';

function CustomerLoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loadingAction, setLoadingAction] = useState(null);
  const [showOTP, setShowOTP] = useState(false);
  const requestInFlightRef = useRef(false);
  const isLoading = Boolean(loadingAction);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getDashboardRoute(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handlePasswordLogin = async () => {
    if (requestInFlightRef.current || isLoading) return;
    setError('');
    if (!email.trim()) { setError('Informe seu e-mail'); return; }
    if (!validateEmail(email)) { setError('Informe um e-mail válido'); return; }
    if (!password) { setError('Informe sua senha'); return; }

    requestInFlightRef.current = true;
    setLoadingAction('password');
    try {
      const result = await login(email.trim(), password);
      if (!result.success) {
        setError(result.error || 'Não foi possível entrar. Verifique os dados.');
        return;
      }
      navigate(getDashboardRoute(result.user.role), { replace: true });
    } finally {
      requestInFlightRef.current = false;
      setLoadingAction(null);
    }
  };

  const handleOtpLogin = async () => {
    if (requestInFlightRef.current || isLoading) return;
    setError('');
    if (!email.trim()) { setError('Informe seu e-mail'); return; }
    if (!validateEmail(email)) { setError('Informe um e-mail válido'); return; }

    requestInFlightRef.current = true;
    setLoadingAction('otp');
    try {
      await authAPI.requestOTP(email);
      sessionStorage.setItem('otpEmail', email);
      setShowOTP(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível enviar o código. Tente novamente.');
    } finally {
      requestInFlightRef.current = false;
      setLoadingAction(null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) handlePasswordLogin();
  };

  const fillDemoCredentials = (credentials) => {
    setEmail(credentials.email);
    setPassword(credentials.password);
    setError('');
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 pt-28 pb-10 md:pt-32">
      {/* Page Background */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${ecorouteImages.authCollection})`,
        }}
      />
      <div className="absolute inset-0 z-0 bg-black/70 backdrop-blur-xs" />

      {/* Split card */}
      <div className="relative z-10 w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-135 border border-white/10">
        {/* Left — Welcome panel */}
        <div className="relative md:w-1/2 hidden md:flex flex-col justify-center px-12 py-14 md:py-20 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${ecorouteImages.brazilCollectionHero})`,
            }}
          />
          <div className="absolute inset-0 bg-linear-to-br from-primary/90 to-brand-primary-deep/85" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
                <Recycle className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-2xl text-white tracking-tight">EcoRoute</span>
            </div>
            <h1 className="font-bold text-4xl md:text-5xl text-white leading-tight mb-5">
              Acesse sua operação
            </h1>
            <p className="text-white/70 text-base md:text-lg leading-relaxed mb-10">
              Entre para solicitar coletas, acompanhar protocolos e consultar rotas de descarte na mesma plataforma.
            </p>
            <div className="space-y-4">
              {[
                { icon: <MapPin className="w-5 h-5 text-white/90" />, text: 'Coleta residencial ou empresarial' },
                { icon: <CalendarDays className="w-5 h-5 text-white/90" />, text: 'Agendamento e protocolo' },
                { icon: <Recycle className="w-5 h-5 text-white/90" />, text: 'Pontos reais de descarte' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  {icon}
                  <span className="text-white/80 text-base">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Form panel */}
        <div className="md:w-1/2 bg-white flex flex-col justify-center px-10 sm:px-14 py-14 md:py-20">
          <h2 className="font-bold text-3xl text-primary mb-2">Entrar</h2>
          <p className="text-primary/50 text-base mb-10">
            Acesse sua conta para acompanhar coletas, valores e histórico
          </p>

          <div className="space-y-6">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-base font-medium text-primary/80 mb-2"
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                onKeyDown={handleKeyPress}
                placeholder="você@email.com"
                disabled={isLoading}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? 'login-error' : undefined}
                className={`w-full h-13 rounded-xl border px-4 text-base text-primary
                  bg-accent/40 placeholder:text-primary/30 transition-all
                  ${error ? 'border-red-400' : 'border-primary/10 hover:border-primary/25'}
                  focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 focus:bg-white
                  disabled:opacity-50 disabled:cursor-not-allowed`}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-base font-medium text-primary/80 mb-2"
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                onKeyDown={handleKeyPress}
                placeholder="Digite sua senha"
                disabled={isLoading}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? 'login-error' : undefined}
                className={`w-full h-13 rounded-xl border px-4 text-base text-primary
                  bg-accent/40 placeholder:text-primary/30 transition-all
                  ${error ? 'border-red-400' : 'border-primary/10 hover:border-primary/25'}
                  focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 focus:bg-white
                  disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              {error && (
                <p id="login-error" className="text-red-500 text-sm mt-1.5" role="alert">
                  {error}
                </p>
              )}
            </div>

            {isLoading && <TruckLoader />}

            {/* Submit */}
            <button
              type="button"
              onClick={handlePasswordLogin}
              disabled={isLoading}
              className="w-full h-13 bg-primary text-white font-semibold text-base rounded-xl
                hover:bg-brand-primary-hover active:scale-[0.98] transition-all shadow-lg shadow-primary/20
                disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {loadingAction === 'password' ? 'Entrando...' : 'Entrar com senha'}
            </button>

            <div className="rounded-2xl border border-primary/10 bg-accent/50 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-primary">Perfis de apresentação</p>
                  <p className="mt-1 text-xs leading-relaxed text-primary/60">
                    Cliente, prestador e administração com dados demonstrativos preenchidos.
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  onClick={() => fillDemoCredentials(DEMO_CREDENTIALS)}
                  disabled={isLoading}
                  className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-primary/15 bg-white px-3 py-2 text-left text-sm font-semibold text-primary transition-all hover:border-primary/30 hover:bg-primary/5 disabled:opacity-50"
                >
                  <span className="inline-flex items-center gap-2">
                    <LockKeyhole className="h-4 w-4" />
                    Cliente demo
                  </span>
                  <span className="text-xs font-medium text-primary/45">{DEMO_CREDENTIALS.email}</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoCredentials(DEMO_DRIVER_CREDENTIALS)}
                  disabled={isLoading}
                  className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-primary/15 bg-white px-3 py-2 text-left text-sm font-semibold text-primary transition-all hover:border-primary/30 hover:bg-primary/5 disabled:opacity-50"
                >
                  <span className="inline-flex items-center gap-2">
                    <LockKeyhole className="h-4 w-4" />
                    Prestador demo
                  </span>
                  <span className="text-xs font-medium text-primary/45">{DEMO_DRIVER_CREDENTIALS.email}</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoCredentials(DEMO_ADMIN_CREDENTIALS)}
                  disabled={isLoading}
                  className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-primary/15 bg-white px-3 py-2 text-left text-sm font-semibold text-primary transition-all hover:border-primary/30 hover:bg-primary/5 disabled:opacity-50"
                >
                  <span className="inline-flex items-center gap-2">
                    <LockKeyhole className="h-4 w-4" />
                    Administração demo
                  </span>
                  <span className="text-xs font-medium text-primary/45">{DEMO_ADMIN_CREDENTIALS.email}</span>
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-primary/10" />
              <span className="text-sm text-primary/40">ou</span>
              <div className="flex-1 h-px bg-primary/10" />
            </div>

            <button
              type="button"
              onClick={handleOtpLogin}
              disabled={isLoading}
              className="w-full h-12 rounded-xl border border-primary/15 bg-white text-primary font-semibold text-sm
                hover:bg-accent/60 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loadingAction === 'otp' ? 'Enviando código...' : 'Receber código por e-mail'}
            </button>

            {/* Sign up link */}
            <p className="text-center text-base text-primary/60">
              Ainda não tem conta?{' '}
              <Link
                to="/signup"
                className="font-semibold text-primary hover:text-brand-primary-hover transition-colors"
              >
                Criar cadastro
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      <OTPModal
        isOpen={showOTP}
        onClose={() => setShowOTP(false)}
        email={email}
      />
    </div>
  );
}

export default CustomerLoginPage;
