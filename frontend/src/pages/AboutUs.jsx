import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Truck,
  BarChart3,
  Users,
  ArrowRight,
  Recycle,
  Leaf,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { ecorouteImages } from '../assets/ecorouteImages';

const IMAGES = {
  hero: ecorouteImages.brazilCollectionHero,
  mission: ecorouteImages.cooperativeSorting,
  team: ecorouteImages.teamPlanning,
  operations: ecorouteImages.businessPickup,
  city: ecorouteImages.cityCollection,
  green: ecorouteImages.ecopontoDropoff,
};

const DEFAULT_OBSERVER_OPTIONS = {};

/* ── Viewport observer ── */
function useInView(options = DEFAULT_OBSERVER_OPTIONS) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.unobserve(el);
        }
      },
      { threshold: 0.12, ...options },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [options]);
  return [ref, inView];
}

function Reveal({ children, delay = 0, className = '' }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-600 ease-out ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ── Animated counter ── */
function Counter({ end, suffix = '' }) {
  const [count, setCount] = useState(0);
  const [ref, inView] = useInView();

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1600;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, end]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

/* ── Data ── */

const stats = [
  { value: 129, suffix: '+', label: 'Pontos oficiais' },
  { value: 12, suffix: '+', label: 'Tipos de resíduos' },
  { value: 24, suffix: 'h', label: 'Janela de coleta' },
  { value: 3, suffix: '', label: 'Camadas do sistema' },
];

const values = [
  {
    icon: Leaf,
    title: 'Sustentabilidade prática',
    description:
      'A plataforma orienta descarte correto e reduz deslocamentos desnecessários ao combinar coleta sob demanda com pontos reais.',
  },
  {
    icon: ShieldCheck,
    title: 'Dados verificáveis',
    description:
      'Os pontos de descarte são tratados como informação operacional, com fonte e categoria de material expostas ao usuário.',
  },
  {
    icon: Users,
    title: 'Uso urbano real',
    description:
      'O fluxo atende moradores, condomínios e empresas que precisam resolver descarte ou retirada no endereço.',
  },
  {
    icon: Clock,
    title: 'Operação eficiente',
    description:
      'A taxa estimada e o protocolo reduzem atendimento manual e deixam a solicitação mais transparente.',
  },
];

const tools = [
  {
    icon: MapPin,
    label: 'Mapa',
    title: 'Pontos reais de descarte',
    description:
      'Consulta pontos apropriados por material e proximidade em São Paulo.',
  },
  {
    icon: Truck,
    label: 'Coleta',
    title: 'Solicitação de retirada',
    description:
      'Registra nome, contato, endereço, material, peso, volume e observações.',
  },
  {
    icon: Recycle,
    label: 'Taxa',
    title: 'Precificação automática',
    description:
      'Calcula estimativa em BRL por distância, peso, volume e complexidade.',
  },
  {
    icon: Users,
    label: 'Gestão',
    title: 'Painel operacional',
    description:
      'Organiza usuários, coletores, veículos, áreas e solicitações.',
  },
  {
    icon: Clock,
    label: 'Status',
    title: 'Protocolo rastreável',
    description:
      'Gera identificador de pedido e acompanha o status da coleta.',
  },
  {
    icon: BarChart3,
    label: 'Indicadores',
    title: 'Análise ambiental',
    description:
      'Consolida volumes, tipos de materiais e desempenho operacional.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Usuário informa o resíduo',
    description:
      'Residência ou empresa escolhe material, peso, volume e dificuldade da retirada.',
  },
  {
    number: '02',
    title: 'Endereço e mapa entram no fluxo',
    description:
      'O sistema localiza o endereço, consulta pontos próximos e calcula distância.',
  },
  {
    number: '03',
    title: 'Taxa e protocolo são gerados',
    description:
      'A API retorna estimativa e cria um protocolo de solicitação.',
  },
  {
    number: '04',
    title: 'Gestão acompanha a operação',
    description:
      'O painel administrativo acompanha pedidos, rotas, coletores e indicadores.',
  },
];

/* ── Page ── */

export default function AboutUs() {
  return (
    <div className="bg-secondary min-h-screen font-['Outfit',sans-serif]">
      {/* ── 1. Hero with background image & integrated stats ── */}
      <section className="relative w-full min-h-screen flex items-center overflow-hidden pt-24 pb-12">
        <img
          src={IMAGES.hero}
          alt="Operação de coleta e descarte"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/75 to-black/50" />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-16 lg:px-24 flex flex-col justify-center">
          <div className="max-w-3xl mb-16 md:mb-24 mt-10">
            <Reveal>
              <span className="inline-block text-white/60 text-sm font-semibold tracking-widest uppercase mb-4">
                Sobre a EcoRoute
              </span>
              <h1 className="font-bold text-white text-4xl md:text-5xl lg:text-[3.5rem] leading-[1.1] tracking-tight">
                Plataforma web para coleta e descarte inteligente de resíduos urbanos
              </h1>
            </Reveal>
            <Reveal delay={120}>
              <p className="mt-6 text-white/70 text-lg md:text-xl leading-relaxed max-w-xl">
                A EcoRoute reune solicitação de coleta, precificação, protocolo e mapa
                de pontos reais em uma experiência única para moradores, empresas e operação.
              </p>
            </Reveal>
          </div>

          <div className="w-full pt-8 border-t border-white/10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center md:text-left">
              {stats.map((stat, i) => (
                <Reveal key={stat.label} delay={i * 100}>
                  <div>
                    <p className="text-3xl sm:text-4xl font-bold text-white">
                      <Counter end={stat.value} suffix={stat.suffix} />
                    </p>
                    <p className="text-white/60 text-sm mt-1 font-medium">
                      {stat.label}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Mission — image + text ── */}
      <section className="py-16 sm:py-24 px-6 md:px-16 lg:px-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <img
                src={IMAGES.mission}
                alt="Green city planning"
                className="w-full h-[350px] lg:h-[420px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent" />
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div>
              <span className="text-primary/40 text-xs font-semibold tracking-widest uppercase">
                Missao
              </span>
              <h2 className="font-bold text-primary text-3xl sm:text-4xl mt-3 mb-5 leading-tight">
                Reduzir descarte indevido com tecnologia aplicável
              </h2>
              <p className="text-primary/70 text-lg leading-relaxed mb-4">
                O descarte irregular acontece quando o cidadão não sabe onde levar o material
                ou quando a retirada e dificil de solicitar. A EcoRoute resolve as duas pontas:
                mostra destinos apropriados e permite pedir coleta no próprio endereço.
              </p>
              <p className="text-primary/50 text-base leading-relaxed">
                A operação combina base de pontos reais, estimativa de coleta e registro
                de protocolos para reduzir descarte indevido.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 4. Our Values ── */}
      <section className="py-16 sm:py-24 px-6 md:px-16 lg:px-24 bg-white">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-14">
              <span className="text-primary/40 text-xs font-semibold tracking-widest uppercase">
                Principios
              </span>
              <h2 className="font-bold text-primary text-3xl sm:text-4xl mt-3">
                O que orienta o projeto
              </h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 80}>
                <div className="bg-secondary/60 rounded-2xl p-7 text-center hover:shadow-lg transition-shadow duration-300 h-full">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                    <v.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-primary font-semibold text-lg mb-2">
                    {v.title}
                  </h3>
                  <p className="text-primary/55 text-sm leading-relaxed">
                    {v.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Six Tools — with icons ── */}
      <section className="py-16 sm:py-24 px-6 md:px-16 lg:px-24">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="mb-12">
              <span className="text-primary/40 text-xs font-semibold tracking-widest uppercase">
                Plataforma
              </span>
              <h2 className="font-bold text-primary text-3xl sm:text-4xl mt-3 mb-3">
                Seis módulos para a operação
              </h2>
              <p className="text-primary/55 text-lg max-w-2xl">
                Cada módulo representa uma parte do ciclo de coleta e descarte, da busca
                por ponto real até a geração do protocolo.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tools.map((tool, i) => (
              <Reveal key={tool.label} delay={i * 70}>
                <div className="bg-white rounded-xl p-7 flex flex-col min-h-[210px] hover:shadow-lg transition-shadow duration-300 border border-primary/5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <tool.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-primary/40 text-xs font-semibold tracking-widest uppercase">
                    {tool.label}
                  </span>
                  <h3 className="text-primary font-semibold text-lg mt-2 mb-2">
                    {tool.title}
                  </h3>
                  <p className="text-primary/55 text-sm leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Operations image band ── */}
      <section className="relative h-[40vh] min-h-[300px] overflow-hidden">
        <img
          src={IMAGES.city}
          alt="City skyline"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-primary/60" />
        <div className="relative z-10 flex items-center justify-center h-full px-6">
          <Reveal>
            <h2 className="text-white font-bold text-2xl sm:text-3xl md:text-4xl text-center max-w-2xl leading-snug">
              Tecnologia para conectar descarte correto, coleta sob demanda e gestão urbana
            </h2>
          </Reveal>
        </div>
      </section>

      {/* ── 7. How It Works — with connecting line ── */}
      <section className="py-16 sm:py-24 px-6 md:px-16 lg:px-24 bg-white">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="mb-12 text-center">
              <span className="text-primary/40 text-xs font-semibold tracking-widest uppercase">
                Processo
              </span>
              <h2 className="font-bold text-primary text-3xl sm:text-4xl mt-3 mb-3">
                Como funciona
              </h2>
              <p className="text-primary/55 text-lg max-w-2xl mx-auto">
                Da informação do resíduo ao protocolo em quatro etapas.
              </p>
            </div>
          </Reveal>

          <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* connecting line (desktop) */}
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-primary/10" />
            {steps.map((step, i) => (
              <Reveal key={step.number} delay={i * 90}>
                <div className="relative text-center">
                  <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold mx-auto mb-5 relative z-10">
                    {step.number}
                  </div>
                  <h3 className="text-primary font-semibold text-base mb-2">
                    {step.title}
                  </h3>
                  <p className="text-primary/55 text-sm leading-relaxed max-w-[240px] mx-auto">
                    {step.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. Team image + text ── */}
      <section className="py-16 sm:py-24 px-6 md:px-16 lg:px-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <Reveal delay={100}>
            <div>
              <span className="text-primary/40 text-xs font-semibold tracking-widest uppercase">
                Equipe
              </span>
              <h2 className="font-bold text-primary text-3xl sm:text-4xl mt-3 mb-5 leading-tight">
                Pessoas focadas em uma solução apresentável e funcional
              </h2>
              <p className="text-primary/70 text-lg leading-relaxed mb-4">
                A proposta combina levantamento de pontos reais, fluxo de coleta,
                precificação e painel administrativo para sustentar uma solução completa.
              </p>
              <p className="text-primary/50 text-base leading-relaxed">
                A implementação privilegia o que o usuário precisa ver: onde descartar,
                como solicitar retirada e como acompanhar o pedido.
              </p>
            </div>
          </Reveal>
          <Reveal>
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <img
                src={IMAGES.team}
                alt="Team collaboration"
                className="w-full h-[350px] lg:h-[420px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 9. Sustainability image band ── */}
      <section className="py-16 sm:py-24 px-6 md:px-16 lg:px-24 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <img
                src={IMAGES.green}
                alt="Sustainability and nature"
                className="w-full h-[350px] lg:h-[400px] object-cover"
              />
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div>
              <span className="text-primary/40 text-xs font-semibold tracking-widest uppercase">
                Sustentabilidade
              </span>
              <h2 className="font-bold text-primary text-3xl sm:text-4xl mt-3 mb-5 leading-tight">
                Coleta inteligente como apoio ao descarte correto
              </h2>
              <p className="text-primary/70 text-lg leading-relaxed mb-4">
                A plataforma evita que resíduos recicláveis, eletrônicos e volumosos
                sejam descartados em locais inadequados. Quando a pessoa não consegue
                levar o material, o sistema transforma a necessidade em um pedido de coleta.
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                {['Menos descarte indevido', 'Pontos reais', 'Coleta sob demanda', 'Dados operacionais'].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="bg-primary/10 text-primary text-xs font-semibold px-4 py-2 rounded-full"
                    >
                      {tag}
                    </span>
                  ),
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 10. CTA ── */}
      <section className="relative py-20 sm:py-28 px-6 md:px-16 lg:px-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/80" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <Reveal>
            <h2 className="font-bold text-white text-2xl sm:text-3xl md:text-4xl mb-4 leading-snug">
              Pronto para apresentar a EcoRoute?
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="text-white/60 text-lg leading-relaxed mb-10 max-w-xl mx-auto">
              O projeto mostra a jornada completa: landing, login, pedido de coleta,
              mapa funcional, estimativa e protocolo.
            </p>
          </Reveal>
          <Reveal delay={180}>
            <Link
              to="/contact-us"
              className="inline-flex items-center gap-2 bg-white text-primary font-medium text-sm px-8 py-4 rounded-full hover:bg-accent transition-colors duration-200"
            >
              Falar com a EcoRoute
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
