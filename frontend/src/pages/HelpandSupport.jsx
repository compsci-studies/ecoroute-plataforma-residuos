import React, { useState, useMemo } from "react";
import {
  Search,
  Rocket,
  User,
  CreditCard,
  Settings,
  Shield,
  Code,
  HelpCircle,
  ChevronRight,
  Mail,
  MessageSquare,
  Phone,
} from "lucide-react";
import { ecorouteImages } from "../assets/ecorouteImages";

const ICON_MAP = {
  Rocket: Rocket,
  User: User,
  CreditCard: CreditCard,
  Settings: Settings,
  Shield: Shield,
  Code: Code,
};

const helpTopics = [
  { id: 1, category: "Início", title: "Como usar a EcoRoute?", description: "Entenda como solicitar coleta, consultar pontos reais e acompanhar protocolos.", icon: "Rocket" },
  { id: 2, category: "Conta", title: "Cadastro e acesso", description: "Use seu e-mail para entrar, receber código e acessar o painel da plataforma.", icon: "User" },
  { id: 3, category: "Cobrança", title: "Taxas de coleta", description: "Veja como peso, volume, material, complexidade e distância influenciam a estimativa.", icon: "CreditCard" },
  { id: 4, category: "Operação", title: "Atualizações do pedido", description: "Acompanhe status, janela de retirada e protocolo gerado pelo sistema.", icon: "Settings" },
  { id: 5, category: "Segurança", title: "Privacidade dos dados", description: "A plataforma separa informações de contato, endereço e registros operacionais.", icon: "Shield" },
  { id: 6, category: "Técnico", title: "Tecnologia da plataforma", description: "A EcoRoute organiza solicitações, pontos de descarte, estimativas e protocolos em uma operação integrada.", icon: "Code" },
];

export default function HelpSupportPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTopics = useMemo(() => {
    return helpTopics.filter(
      (topic) =>
        topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-accent text-primary font-sans flex flex-col">
      {/* Hero Section */}
      <section className="bg-linear-to-br from-black/95 to-black/85 pt-32 pb-24 px-4 text-center rounded-b-[2rem] md:rounded-b-[4rem] relative overflow-hidden shrink-0">
        <div
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay"
          style={{ backgroundImage: `url(${ecorouteImages.supportOperations})` }}
        ></div>
        <div className="relative max-w-4xl mx-auto z-10">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Ajuda e suporte
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            Busque orientações sobre coleta, pontos de descarte, taxa estimada e acesso ao sistema.
          </p>

          <div className="relative max-w-2xl mx-auto group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/50 w-6 h-6 transition-colors group-focus-within:text-primary" />
            <input
              type="text"
              placeholder="Buscar na central de ajuda..."
              className="w-full py-4 pl-14 pr-4 rounded-2xl shadow-lg border-2 border-transparent focus:border-primary/20 focus:ring-4 focus:ring-primary/10 text-lg bg-white text-primary placeholder:text-primary/40 transition-all outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Topics Grid */}
      <main className="flex-grow max-w-6xl mx-auto py-16 px-4 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <h2 className="text-2xl md:text-3xl font-bold text-primary">
            {searchQuery
              ? `Resultados para "${searchQuery}"`
              : "Tópicos principais"}
          </h2>
          <span className="text-primary/70 font-bold px-4 py-1.5 bg-primary/5 rounded-full text-sm shrink-0">
            {filteredTopics.length} tópicos encontrados
          </span>
        </div>

        {filteredTopics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTopics.map((topic) => {
              const IconComponent = ICON_MAP[topic.icon] || HelpCircle;
              return (
                <div
                  key={topic.id}
                  className="bg-white p-8 rounded-[2rem] shadow-sm border border-primary/5 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer group hover:-translate-y-1 flex flex-col"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-4 bg-accent/80 text-primary rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                      <IconComponent size={24} />
                    </div>
                    <span className="text-xs font-bold text-primary/70 uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-full group-hover:bg-primary/10 transition-colors duration-300">
                      {topic.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-primary group-hover:text-primary/80 transition-colors">
                    {topic.title}
                  </h3>
                  <p className="text-primary/70 mb-8 line-clamp-3 leading-relaxed flex-grow">
                    {topic.description}
                  </p>
                  <div className="flex items-center text-primary font-bold text-sm tracking-wide mt-auto">
                    Ler mais{" "}
                    <ChevronRight
                      size={18}
                      className="ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-primary/20 shadow-sm">
            <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
              <HelpCircle size={40} className="text-primary/40" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-primary">Nenhum resultado encontrado</h3>
            <p className="text-primary/60 max-w-md mx-auto mb-8">
              Não encontramos nada para "{searchQuery}". Tente outro termo ou navegue pelos tópicos.
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="px-8 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-brand-primary-hover active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
            >
              Limpar busca
            </button>
          </div>
        )}
      </main>

      {/* Contact Section */}
      <section className="bg-white py-24 px-4 relative mt-auto border-t border-primary/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-5">Ainda precisa de ajuda?</h2>
            <p className="text-primary/60 text-lg max-w-xl mx-auto">
              Escolha um canal para tirar dúvidas sobre a plataforma e o fluxo de coleta.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="flex flex-col items-center text-center p-10 bg-accent/30 rounded-[2rem] border border-primary/5 hover:bg-white hover:shadow-2xl hover:border-primary/10 transition-all duration-300 group">
              <div className="w-16 h-16 bg-white shadow-sm flex items-center justify-center text-primary rounded-2xl mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                <Mail size={28} />
              </div>
              <h4 className="text-xl font-bold text-primary mb-2">E-mail</h4>
              <p className="text-primary/60 mb-6 font-medium">
                Resposta em até 24 horas
              </p>
              <a
                href="mailto:support@ecoroute.com"
                className="text-primary font-bold hover:underline decoration-2 underline-offset-4"
              >
                support@ecoroute.com
              </a>
            </div>

            <div className="flex flex-col items-center text-center p-10 bg-accent/30 rounded-[2rem] border border-primary/5 hover:bg-white hover:shadow-2xl hover:border-primary/10 transition-all duration-300 group">
              <div className="w-16 h-16 bg-white shadow-sm flex items-center justify-center text-primary rounded-2xl mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                <MessageSquare size={28} />
              </div>
              <h4 className="text-xl font-bold text-primary mb-2">Chat</h4>
              <p className="text-primary/60 mb-6 font-medium">
                Disponível de segunda a sexta, 9h às 18h
              </p>
              <button className="text-primary font-bold hover:underline decoration-2 underline-offset-4">
                Iniciar conversa
              </button>
            </div>

            <div className="flex flex-col items-center text-center p-10 bg-accent/30 rounded-[2rem] border border-primary/5 hover:bg-white hover:shadow-2xl hover:border-primary/10 transition-all duration-300 group">
              <div className="w-16 h-16 bg-white shadow-sm flex items-center justify-center text-primary rounded-2xl mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                <Phone size={28} />
              </div>
              <h4 className="text-xl font-bold text-primary mb-2">Telefone</h4>
              <p className="text-primary/60 mb-6 font-medium">
                Atendimento comercial
              </p>
              <a
                href="tel:+551130000000"
                className="text-primary font-bold hover:underline decoration-2 underline-offset-4"
              >
                +55 11 3000-0000
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
