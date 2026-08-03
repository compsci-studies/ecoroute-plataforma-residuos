import { ArrowRight, LockKeyhole } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ecorouteImages } from '../../assets/ecorouteImages';
import useAuthStore from '../../stores/useAuthStore';

export function Services() {
  const { isAuthenticated, user } = useAuthStore();
  const isCustomer = isAuthenticated && user?.role === 'customer_admin';
  const pickupAction = isCustomer
    ? { label: 'Solicitar coleta', to: '/upload-waste' }
    : isAuthenticated
      ? { label: 'Ver fluxo de coleta', to: '/request-pickup#solicitacao' }
      : { label: 'Entrar para solicitar', to: '/login', state: { intent: 'pickup' } };
  const accessMessage = isCustomer
    ? 'As solicitações serão registradas na sua conta. A consulta aos pontos de descarte é pública.'
    : isAuthenticated
      ? 'A solicitação é registrada pelo perfil de cliente. A consulta aos pontos de descarte é pública.'
      : 'Para solicitar e acompanhar uma coleta, entre ou crie uma conta. A consulta aos pontos de descarte é pública.';

  const services = [
    {
      title: 'Residências e condomínios',
      description: 'Solicitação de retirada para recicláveis, eletrônicos, móveis, óleo e outros materiais acumulados.',
      image: ecorouteImages.residentialPickup,
      action: pickupAction,
    },
    {
      title: 'Empresas e comércios',
      description: 'Pedidos com volume, peso e endereço definidos para precificar a retirada de forma transparente.',
      image: ecorouteImages.businessPickup,
      action: pickupAction,
    },
    {
      title: 'Entrega voluntária',
      description: 'Quando a coleta não for necessária, o sistema orienta o descarte em pontos reais e apropriados.',
      image: ecorouteImages.ecopontoDropoff,
      action: {
        label: 'Ver pontos de descarte',
        to: '/request-pickup#pontos-de-descarte',
      },
    },
  ];

  return (
    <section className="w-full py-20 md:py-28 px-6 md:px-16 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <h2 className="font-['Outfit'] font-bold text-primary text-3xl md:text-4xl mb-4">
            Onde a plataforma atua
          </h2>
          <p className="text-primary/60 text-lg font-['Outfit']">
            Coleta e descarte orientados por tipo de material, localização e volume
          </p>
          <div className="mt-5 flex max-w-2xl items-start gap-2.5 text-sm leading-6 text-primary/60">
            <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <p>{accessMessage}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div key={index} className="group">
              <div className="rounded-2xl overflow-hidden mb-6 aspect-[4/3]">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-primary font-['Outfit'] font-semibold text-xl mb-3">
                {service.title}
              </h3>
              <p className="text-primary/60 font-['Outfit'] text-base leading-relaxed mb-5">
                {service.description}
              </p>
              <Link
                to={service.action.to}
                state={service.action.state}
                aria-label={`${service.action.label}: ${service.title}`}
                className="group/link inline-flex min-h-11 items-center gap-2 py-2 text-sm font-semibold text-primary transition-colors hover:text-primary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-4"
              >
                {service.action.label}
                <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
