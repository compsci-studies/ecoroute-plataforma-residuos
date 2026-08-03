import { ArrowRight, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../stores/useAuthStore';

export function Features() {
  const { isAuthenticated, user } = useAuthStore();
  const isCustomer = isAuthenticated && user?.role === 'customer_admin';

  const features = [
    {
      label: 'Coleta',
      title: 'Solicitação sob demanda',
      description: isCustomer
        ? 'Cadastro de retirada residencial ou empresarial por tipo, peso e volume.'
        : 'Simulação pública de retirada por tipo, peso, volume e localização.',
      actionLabel: isCustomer ? 'Solicitar coleta' : 'Simular coleta',
      to: isCustomer ? '/upload-waste' : '/request-pickup#solicitacao',
    },
    {
      label: 'Mapa',
      title: 'Pontos reais de descarte',
      description: 'Consulta de locais oficiais por material, endereço e proximidade.',
      actionLabel: 'Ver pontos no mapa',
      to: '/request-pickup#pontos-de-descarte',
    },
    {
      label: 'Taxa',
      title: 'Estimativa automática',
      description: 'Cálculo por distância, peso, volume e complexidade da retirada.',
      actionLabel: 'Calcular taxa',
      to: '/request-pickup#calculo-da-taxa',
    },
    {
      label: 'Protocolo',
      title: 'Pedido rastreável',
      description: 'Geração de protocolo para acompanhar status e histórico da coleta.',
      actionLabel: isCustomer ? 'Solicitar coleta' : 'Entrar para solicitar',
      to: isCustomer ? '/upload-waste' : '/login',
      state: isCustomer ? undefined : { intent: 'pickup' },
    },
    {
      label: 'Operação',
      title: 'Painel administrativo',
      description: 'Organização de veículos, coletores, rotas e solicitações.',
      actionLabel: 'Abrir administração',
      to: '/demo/admin',
    },
    {
      label: 'Dados',
      title: 'Indicadores ambientais',
      description: 'Monitoramento de volumes, materiais coletados e eficiência das rotas.',
      actionLabel: 'Ver indicadores',
      to: '/demo/admin?to=%2Fadmin-dashboard%2Freports',
    },
  ];

  return (
    <section className="bg-white w-full py-20 md:py-28 px-6 md:px-16 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <h2 className="font-['Outfit'] font-bold text-primary text-3xl md:text-4xl mb-4">
            Módulos essenciais da EcoRoute
          </h2>
          <p className="text-primary/60 text-lg font-['Outfit']">
            O necessário para apresentar um webapp completo de coleta inteligente
          </p>
          <div className="mt-5 flex max-w-3xl items-start gap-2.5 text-sm leading-6 text-primary/60">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <p>
              Mapa, ecopontos e estimativa podem ser explorados sem login. Solicitações e protocolos ficam vinculados ao perfil de cliente; operação e indicadores abrem a administração demonstrativa.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.label}
              className="bg-accent/50 rounded-2xl p-8 flex flex-col justify-between min-h-[220px]"
            >
              <div>
                <span className="text-primary/50 font-['Outfit'] text-sm font-medium tracking-wide uppercase">
                  {feature.label}
                </span>
                <h3 className="text-primary font-['Outfit'] font-semibold text-xl mt-3 mb-3">
                  {feature.title}
                </h3>
                <p className="text-primary/60 font-['Outfit'] text-base leading-relaxed">
                  {feature.description}
                </p>
              </div>
              <div className="mt-6">
                <Link
                  to={feature.to}
                  state={feature.state}
                  aria-label={`${feature.actionLabel}: ${feature.title}`}
                  className="group/link inline-flex min-h-11 items-center gap-2 py-2 text-sm font-semibold text-primary transition-colors hover:text-primary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-4"
                >
                  {feature.actionLabel}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
