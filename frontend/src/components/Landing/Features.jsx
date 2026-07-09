import { ArrowRight } from 'lucide-react';

export function Features() {
  const features = [
    {
      label: 'Coleta',
      title: 'Solicitação sob demanda',
      description: 'Cadastro de retirada residencial ou empresarial por tipo, peso e volume.',
    },
    {
      label: 'Mapa',
      title: 'Pontos reais de descarte',
      description: 'Consulta de locais oficiais por material, endereço e proximidade.',
    },
    {
      label: 'Taxa',
      title: 'Estimativa automática',
      description: 'Cálculo por distância, peso, volume e complexidade da retirada.',
    },
    {
      label: 'Protocolo',
      title: 'Pedido rastreável',
      description: 'Geração de protocolo para acompanhar status e histórico da coleta.',
    },
    {
      label: 'Operação',
      title: 'Painel administrativo',
      description: 'Organização de veículos, coletores, rotas e solicitações.',
    },
    {
      label: 'Dados',
      title: 'Indicadores ambientais',
      description: 'Monitoramento de volumes, materiais coletados e eficiência das rotas.',
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
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
                <button className="text-primary font-['Outfit'] text-sm font-medium flex items-center gap-2 hover:gap-3 transition-all">
                  Ver módulo
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
