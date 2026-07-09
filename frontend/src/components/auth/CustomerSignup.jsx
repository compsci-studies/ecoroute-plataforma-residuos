import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, CalendarDays, Sprout, Recycle } from 'lucide-react';
import useAuthStore from '../../stores/useAuthStore';
import { ecorouteImages } from '../../assets/ecorouteImages';
import { getDashboardRoute } from '../../utils/roleRouting';
import OTPModal from './OTPModal';
import TruckLoader from '../shared/TruckLoader';

function CustomerSignUpPage() {
  const navigate = useNavigate();
  const { signup, isAuthenticated, user } = useAuthStore();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [locationStatus, setLocationStatus] = useState('idle'); // idle | loading | success | denied | unavailable | error
  const requestInFlightRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getDashboardRoute(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const fetchLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocationStatus('unavailable');
      return;
    }
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { 'Accept': 'application/json' } }
          );
          const data = await res.json();
          const addr = data?.display_name || '';
          if (addr) {
            setFormData((prev) => ({ ...prev, address: prev.address || addr }));
            setErrors((prev) => ({ ...prev, address: '' }));
            setLocationStatus('success');
          } else {
            setLocationStatus('error');
          }
        } catch {
          setLocationStatus('error');
        }
      },
      (err) => {
        setLocationStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Nome obrigatório';
    else if (formData.name.trim().length < 2) errs.name = 'Informe pelo menos 2 caracteres';

    if (!formData.email.trim()) errs.email = 'E-mail obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'Informe um e-mail válido';

    if (!formData.phone.trim()) errs.phone = 'Telefone obrigatório';
    else if (!/^[0-9]{10,15}$/.test(formData.phone.replace(/[\s-]/g, ''))) errs.phone = 'Informe um telefone válido';

    if (!formData.address.trim()) errs.address = 'Endereço obrigatório';
    else if (formData.address.trim().length < 10) errs.address = 'Informe um endereço completo';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (requestInFlightRef.current || isLoading) return;
    if (!validateForm()) return;

    requestInFlightRef.current = true;
    setIsLoading(true);
    try {
      const result = await signup({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
      });

      if (result.success) {
        if (result.requireOtp) {
          sessionStorage.setItem('otpEmail', formData.email);
          setShowOTP(true);
        } else {
          navigate(getDashboardRoute(result.user.role), { replace: true });
        }
      } else {
        setErrors({ submit: result.error || 'Não foi possível criar a conta. Tente novamente.' });
      }
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || 'Não foi possível criar a conta. Tente novamente.' });
    } finally {
      requestInFlightRef.current = false;
      setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) handleSubmit();
  };

  const fields = [
    { id: 'name', label: 'Nome completo', type: 'text', placeholder: 'Marina Almeida' },
    { id: 'email', label: 'E-mail', type: 'email', placeholder: 'você@email.com' },
    { id: 'phone', label: 'Telefone', type: 'tel', placeholder: '11980000000' },
  ];

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
      <div className="relative z-10 w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-150 border border-white/10">
        {/* Left — Welcome panel */}
        <div className="relative md:w-5/12 hidden md:flex flex-col justify-center px-12 py-14 md:py-20 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${ecorouteImages.residentialPickup})`,
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
              Comece pela coleta
            </h1>
            <p className="text-white/70 text-base md:text-lg leading-relaxed mb-10">
              Crie sua conta para solicitar retirada, acompanhar protocolo e consultar alternativas de descarte.
            </p>
            <div className="space-y-4">
              {[
                { icon: <Zap className="w-5 h-5 text-white/90" />, text: 'Cadastro em poucos minutos' },
                { icon: <CalendarDays className="w-5 h-5 text-white/90" />, text: 'Solicitação de coleta com protocolo' },
                { icon: <Sprout className="w-5 h-5 text-white/90" />, text: 'Pontos reais como apoio ao descarte' },
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
        <div className="md:w-7/12 bg-white flex flex-col justify-center px-10 sm:px-14 py-12 md:py-16">
          <h2 className="font-bold text-3xl text-primary mb-2">Criar conta</h2>
          <p className="text-primary/50 text-base mb-8">
            Informe seus dados para acessar a plataforma EcoRoute
          </p>

          <div className="space-y-5">
            {/* Name + Email row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {fields.slice(0, 2).map(({ id, label, type, placeholder }) => (
                <div key={id}>
                  <label
                    htmlFor={id}
                    className="block text-base font-medium text-primary/80 mb-2"
                  >
                    {label}
                  </label>
                  <input
                    id={id}
                    type={type}
                    value={formData[id]}
                    onChange={(e) => handleChange(id, e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={placeholder}
                    disabled={isLoading}
                    aria-invalid={errors[id] ? 'true' : 'false'}
                    aria-describedby={errors[id] ? `${id}-error` : undefined}
                    className={`w-full h-12 rounded-xl border px-4 text-base text-primary
                      bg-accent/40 placeholder:text-primary/30 transition-all
                      ${errors[id] ? 'border-red-400' : 'border-primary/10 hover:border-primary/25'}
                      focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 focus:bg-white
                      disabled:opacity-50 disabled:cursor-not-allowed`}
                  />
                  {errors[id] && (
                    <p id={`${id}-error`} className="text-red-500 text-sm mt-1" role="alert">
                      {errors[id]}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="block text-base font-medium text-primary/80 mb-2"
              >
                Telefone
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="9800000000"
                disabled={isLoading}
                aria-invalid={errors.phone ? 'true' : 'false'}
                aria-describedby={errors.phone ? 'phone-error' : undefined}
                className={`w-full h-12 rounded-xl border px-4 text-base text-primary
                  bg-accent/40 placeholder:text-primary/30 transition-all
                  ${errors.phone ? 'border-red-400' : 'border-primary/10 hover:border-primary/25'}
                  focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 focus:bg-white
                  disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              {errors.phone && (
                <p id="phone-error" className="text-red-500 text-sm mt-1" role="alert">
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Address */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="address"
                  className="block text-base font-medium text-primary/80"
                >
                  Endereço
                </label>
                <button
                  type="button"
                  onClick={fetchLocation}
                  disabled={locationStatus === 'loading'}
                  className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
                >
                  {locationStatus === 'loading' ? 'Detectando...' : 'Usar minha localização'}
                </button>
              </div>
              {locationStatus === 'denied' && (
                <p className="text-amber-600 text-xs mb-2">
                  Permissão de localização negada. Informe o endereço manualmente.
                </p>
              )}
              {(locationStatus === 'error' || locationStatus === 'unavailable') && (
                <p className="text-amber-600 text-xs mb-2">
                  Não foi possível detectar sua localização. Informe o endereço manualmente.
                </p>
              )}
              {locationStatus === 'success' && (
                <p className="text-green-600 text-xs mb-2">
                  Endereço preenchido pela localização. Edite se necessário.
                </p>
              )}
              <textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Informe seu endereço completo"
                disabled={isLoading}
                rows="2"
                aria-invalid={errors.address ? 'true' : 'false'}
                aria-describedby={errors.address ? 'address-error' : undefined}
                className={`w-full rounded-xl border px-4 py-3 text-base text-primary
                  bg-accent/40 placeholder:text-primary/30 transition-all resize-none
                  ${errors.address ? 'border-red-400' : 'border-primary/10 hover:border-primary/25'}
                  focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 focus:bg-white
                  disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              {errors.address && (
                <p id="address-error" className="text-red-500 text-sm mt-1" role="alert">
                  {errors.address}
                </p>
              )}
            </div>

            {/* Submit error */}
            {errors.submit && (
              <p className="text-red-500 text-sm" role="alert">
                {errors.submit}
              </p>
            )}

            {isLoading && <TruckLoader />}

            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full h-13 bg-primary text-white font-semibold text-base rounded-xl
                hover:bg-brand-primary-hover active:scale-[0.98] transition-all shadow-lg shadow-primary/20
                disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {isLoading ? 'Criando conta...' : 'Criar conta'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-primary/10" />
              <span className="text-sm text-primary/40">ou</span>
              <div className="flex-1 h-px bg-primary/10" />
            </div>

            {/* Login link */}
            <p className="text-center text-base text-primary/60">
              Já tem conta?{' '}
              <Link
                to="/login"
                className="font-semibold text-primary hover:text-brand-primary-hover transition-colors"
              >
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      <OTPModal
        isOpen={showOTP}
        onClose={() => setShowOTP(false)}
        email={formData.email}
      />
    </div>
  );
}

export default CustomerSignUpPage;
