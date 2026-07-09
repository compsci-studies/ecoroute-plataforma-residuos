import { Facebook, Instagram, Linkedin, Youtube, X } from "lucide-react";

function SocialIcon({ Icon, label }) {
  if (!Icon) return null;

  return (
    <button
      aria-label={label}
      className="w-6 h-6 hover:opacity-70 transition-opacity text-accent"
      type="button"
    >
      <Icon className="w-full h-full" />
    </button>
  );
}

export function Footer() {
  return (
    <footer className="relative z-10 bg-primary w-full py-16 md:py-20">
      <div className="mx-auto max-w-360 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-14 md:mb-16">
          <div className="text-left">
            <h3 className="text-accent font-semibold text-base mb-4">Produto</h3>
            <ul className="space-y-2">
              {["Painel", "Mapa", "Coleta", "Precificação", "Operação"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-accent text-sm hover:opacity-70 transition-opacity">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-left">
            <h3 className="text-accent font-semibold text-base mb-4">Suporte</h3>
            <ul className="space-y-2">
              {["Contato", "Ajuda", "Base legal", "Fontes", "Relatórios"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-accent text-sm hover:opacity-70 transition-opacity">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-left">
            <h3 className="text-accent font-semibold text-base mb-4">Guias</h3>
            <ul className="space-y-2">
              {["API", "Documentação", "Status", "Comunidade", "LGPD"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-accent text-sm hover:opacity-70 transition-opacity">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-left">
            <h3 className="text-accent font-semibold text-base mb-4">Atualizações</h3>
            <p className="text-accent text-base mb-6 max-w-md">
              Receba alertas de novos pontos, mudancas de rota e melhorias da plataforma.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-3">
              <input
                type="email"
                placeholder="Email"
                className="w-full sm:flex-1 bg-transparent border border-accent px-4 py-3 text-accent placeholder:text-accent/60 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                className="border border-accent text-accent px-6 py-3 sm:py-3.5 hover:bg-accent hover:text-primary transition-all"
                type="button"
              >
                Entrar
              </button>
            </div>
            <p className="text-accent text-xs">
              Comunicações objetivas sobre operação e descarte correto.
            </p>
          </div>
        </div>

        <div className="border-t border-accent/70 mb-8" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-accent text-sm">
             <p>© {new Date().getFullYear()} EcoRoute. Todos os direitos reservados.</p>
            <a href="#" className="underline hover:opacity-70 transition-opacity">Privacidade</a>
            <a href="#" className="underline hover:opacity-70 transition-opacity">Termos</a>
            <a href="#" className="underline hover:opacity-70 transition-opacity">Cookies</a>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <SocialIcon Icon={Facebook} label="Facebook" />
            <SocialIcon Icon={Instagram} label="Instagram" />
            <SocialIcon Icon={X} label="X" />
            <SocialIcon Icon={Linkedin} label="LinkedIn" />
            <SocialIcon Icon={Youtube} label="YouTube" />
          </div>
        </div>
      </div>
    </footer>
  );
}
