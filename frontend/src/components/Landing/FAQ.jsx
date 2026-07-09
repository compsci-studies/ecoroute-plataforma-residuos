'use client';

import { useState } from 'react';
import { Leaf } from 'lucide-react';

function FAQItem({ question, answer, isOpen, onToggle }) {
  return (
    <div className="border-b border-primary/10">
      <button
        onClick={onToggle}
        className="w-full py-6 flex items-center justify-between gap-6 text-left cursor-pointer group"
      >
        <span className={`font-['Outfit'] font-medium text-lg transition-colors duration-300 ${isOpen ? 'text-primary' : 'text-primary/80 group-hover:text-primary'}`}>
          {question}
        </span>
        <Leaf
          className={`w-5 h-5 shrink-0 transition-all duration-300 ${
            isOpen ? 'text-primary rotate-45 scale-110' : 'text-primary/40 group-hover:text-primary/60'
          }`}
        />
      </button>

      {isOpen && (
        <div className="pb-6">
          <p className="font-['Outfit'] text-base text-primary/60 leading-relaxed">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      question: 'A EcoRoute e apenas um mapa?',
      answer:
        'Não. O mapa é uma função de apoio. A proposta principal é uma plataforma web para solicitar coleta, calcular taxa, gerar protocolo e gerenciar operações de resíduos urbanos.',
    },
    {
      question: 'Os pontos de descarte são reais?',
      answer:
        'Sim. A plataforma trabalha com uma base de pontos oficiais para São Paulo e pode integrar fontes públicas como GeoSampa, prefeitura e iniciativas de reciclagem.',
    },
    {
      question: 'Como a taxa de coleta e calculada?',
      answer:
        'A estimativa considera material, peso, volume, complexidade da retirada e distância entre a base operacional e o endereço informado.',
    },
    {
      question: 'Quais resíduos são suportados?',
      answer:
        'O fluxo contempla recicláveis, papel, plástico, metal, vidro, eletrônicos, pilhas, lâmpadas, óleo, móveis, eletrodomésticos e entulho.',
    },
    {
      question: 'A plataforma registra solicitações?',
      answer:
        'Sim. As solicitações geram protocolo, estimativa de taxa, status de atendimento e dados de retirada para acompanhamento operacional.',
    },
  ];

  return (
    <section className="bg-white w-full py-20 md:py-28 px-6 md:px-16 lg:px-24">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-['Outfit'] font-bold text-primary text-3xl md:text-4xl mb-4">
            Perguntas frequentes
          </h2>
          <p className="font-['Outfit'] text-primary/60 text-lg">
            Respostas diretas sobre a proposta e a parte pratica
          </p>
        </div>

        <div>
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onToggle={() =>
                setOpenIndex(openIndex === index ? null : index)
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}
