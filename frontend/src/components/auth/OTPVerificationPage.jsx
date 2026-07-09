import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../utils/api';
import useAuthStore from '../../stores/useAuthStore';
import { ecorouteImages } from '../../assets/ecorouteImages';
import { getDashboardRoute } from '../../utils/roleRouting';

function OTPVerificationPage() {
  const navigate = useNavigate();
  const { loginWithOTP, isAuthenticated, user } = useAuthStore();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  
  const inputRefs = useRef([]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const dashboardRoute = getDashboardRoute(user.role);
      navigate(dashboardRoute, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Timer for resend OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    // Handle paste
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setOtp(newOtp);
    
    // Focus last filled input or last input
    const lastIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setError('Informe o código completo de 6 dígitos');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      // Get email from sessionStorage
      const email = sessionStorage.getItem('otpEmail');
      
      if (!email) {
        setError('E-mail não encontrado. Comece novamente.');
        navigate('/login');
        return;
      }

      // Verify OTP using Zustand store
      const result = await loginWithOTP(otpCode, email);
      
      if (result.success) {
        // Clear OTP email from sessionStorage
        sessionStorage.removeItem('otpEmail');
        
        // Navigate based on user role
        const dashboardRoute = getDashboardRoute(result.user.role);
        navigate(dashboardRoute, { replace: true });
      } else {
        setError(result.error || 'Código inválido. Tente novamente.');
        // Clear OTP on error
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Código inválido. Tente novamente.';
      setError(errorMessage);
      
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    setCanResend(false);
    setResendTimer(60);
    setError('');
    
    try {
      const email = sessionStorage.getItem('otpEmail');
      
      if (!email) {
        setError('E-mail não encontrado. Comece novamente.');
        navigate('/login');
        return;
      }

      // Request new OTP
      await authAPI.requestOTP(email);
      
      // Show success message
      alert('Novo código enviado para seu e-mail.');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Não foi possível reenviar o código. Tente novamente.';
      setError(errorMessage);
      setCanResend(true);
    }
  };

  return (
    <div className="bg-accent min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="w-full max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Left Side - OTP Form */}
          <div className="w-full max-w-xl mx-auto lg:mx-0">
            {/* Welcome Heading */}
            <h1 className="font-['Outfit',sans-serif] font-bold text-4xl sm:text-5xl lg:text-6xl text-primary mb-4">
              <span className="block leading-tight mb-2">
                Olá, <span className="text-primary">usuário</span>
              </span>
              <span className="block leading-tight">
                Confirme <span className="text-primary">seu acesso</span>
              </span>
            </h1>

            <p className="font-['Poppins',sans-serif] text-base sm:text-lg text-primary mb-8 sm:mb-10">
              Digite o código enviado para seu e-mail.
            </p>

            {/* OTP Input Boxes */}
            <div className="mb-8">
              <div className="flex gap-2 sm:gap-3 justify-start">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    disabled={isLoading}
                    className={`w-12 h-12 sm:w-14 sm:h-14 text-center text-xl sm:text-2xl font-['Poppins',sans-serif] font-semibold border-2 ${
                      error ? 'border-red-500' : 'border-primary'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-white text-primary`}
                    aria-label={`Dígito ${index + 1}`}
                  />
                ))}
              </div>

              {error && (
                <p className="text-red-500 text-sm mt-3 font-['Poppins',sans-serif]" role="alert">
                  {error}
                </p>
              )}
            </div>

            {/* Log In Button */}
            <button
              onClick={handleVerify}
              disabled={isLoading || otp.join('').length !== 6}
              className="bg-primary flex gap-3 h-12 sm:h-14 items-center justify-center px-8 sm:px-10 rounded-2xl hover:bg-brand-primary-hover transition-all active:scale-95 transform disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 shadow-md"
              aria-label="Verificar código e entrar"
            >
              <span className="font-['Inter',sans-serif] font-medium text-accent text-lg sm:text-xl">
                {isLoading ? 'Verificando...' : 'Entrar'}
              </span>
              {!isLoading && (
                <svg className="rotate-90 w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 22 22" aria-hidden="true">
                  <path 
                    d="M11 16.5V5.5M11 5.5L5.5 11M11 5.5L16.5 11" 
                    stroke="var(--app-surface)" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="1.5" 
                  />
                </svg>
              )}
            </button>

            {/* Resend Code */}
            <div className="mt-6 text-center">
              <p className="font-['Poppins',sans-serif] text-sm sm:text-base text-black/85">
                Não recebeu o código?{' '}
                {canResend ? (
                  <button 
                    onClick={handleResend}
                    className="font-['Poppins',sans-serif] font-semibold text-primary hover:text-brand-primary-hover underline focus:outline-none focus:ring-2 focus:ring-primary rounded-sm"
                  >
                    Reenviar código
                  </button>
                ) : (
                  <span className="font-['Poppins',sans-serif] font-semibold text-primary/55">
                    Reenviar em {resendTimer}s
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Right Side - Hero Image */}
          <div className="hidden lg:block">
            <div 
              className="relative w-full aspect-4/5 max-w-md xl:max-w-lg mx-auto"
              role="img"
              aria-label="Operação brasileira de coleta reciclável"
            >
              <img 
                alt="" 
                className="absolute inset-0 w-full h-full object-cover rounded-2xl shadow-2xl" 
                src={ecorouteImages.cooperativeSorting}
                loading="lazy"
              />
              <div 
                aria-hidden="true" 
                className="absolute inset-0 border-primary/40 border-8 sm:border-12 lg:border-16 rounded-2xl pointer-events-none" 
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default OTPVerificationPage;
