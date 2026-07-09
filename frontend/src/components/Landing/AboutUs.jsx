export function AboutSection() {
  return (
    <section className="bg-white w-full py-10 md:py-16 px-8 md:px-16 lg:px-24">
      <div className="max-w-360 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="font-['Outfit'] font-bold text-primary text-3xl md:text-4xl mb-6">
              Gestão ambiental com dados reais{' '}
              <span className="bg-linear-to-r from-brand-success to-primary bg-clip-text" style={{ WebkitTextFillColor: 'transparent' }}>
                para residências e empresas
              </span>
            </h2>
          </div>
          <div>
            <p className="text-black text-lg md:text-xl font-['Outfit'] leading-relaxed">
              A EcoRoute combina solicitação de coleta, cálculo de taxa por tipo, peso, volume e distância, e pontos reais de descarte para orientar cada resíduo ao destino correto.
            </p>
          </div>
        </div>
        
        {/* Gradient divider */}
        <div className="mt-12">
          <div className="h-1.75 w-full bg-linear-to-r from-brand-success to-primary rounded-full"></div>
        </div>
      </div>
    </section>
  );
}
