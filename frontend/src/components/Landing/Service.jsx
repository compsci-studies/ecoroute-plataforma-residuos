import { ArrowRight } from 'lucide-react';
import { ecorouteImages } from '../../assets/ecorouteImages';

export function Services() {
  const services = [
    {
      title: 'Residências e condomínios',
      description: 'Solicitação de retirada para recicláveis, eletrônicos, móveis, óleo e outros materiais acumulados.',
      image: ecorouteImages.residentialPickup,
    },
    {
      title: 'Empresas e comércios',
      description: 'Pedidos com volume, peso e endereço definidos para precificar a retirada de forma transparente.',
      image: ecorouteImages.businessPickup,
    },
    {
      title: 'Entrega voluntária',
      description: 'Quando a coleta não for necessária, o sistema orienta o descarte em pontos reais e apropriados.',
      image: ecorouteImages.ecopontoDropoff,
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
              <button className="text-primary font-['Outfit'] text-sm font-medium flex items-center gap-2 hover:gap-3 transition-all">
                Solicitar coleta
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
