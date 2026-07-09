import { useState } from 'react';
import api from '../../utils/api';
import TruckLoader from './TruckLoader';

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Informe seu nome';
    if (!form.email.trim()) errs.email = 'Informe seu email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Informe um e-mail válido';
    if (!form.message.trim()) errs.message = 'Escreva sua mensagem';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError(null);
    try {
      await api.post('/contact/submit', form);
      setSubmitted(true);
      setForm({ name: '', email: '', message: '' });
      setErrors({});
    } catch (err) {
      setServerError(err.response?.data?.message || 'Não foi possível enviar a mensagem. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col items-center justify-center min-h-90 text-center">
        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="font-['Outfit',sans-serif] font-bold text-lg text-primary mb-2">
          Mensagem enviada
        </h3>
        <p className="text-gray-500 text-sm mb-6">
          A equipe EcoRoute retornara em breve.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="text-sm text-primary font-medium hover:underline"
        >
          Enviar outra mensagem
        </button>
      </div>
    );
  }

  const inputClass = (field) =>
    `w-full border ${errors[field] ? 'border-red-300' : 'border-gray-200'} rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition placeholder:text-gray-400`;

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
      <h3 className="font-['Outfit',sans-serif] font-bold text-xl text-primary mb-6">
        Envie uma mensagem
      </h3>

      {serverError && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
            Nome
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="Seu nome completo"
            className={inputClass('name')}
          />
          {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className={inputClass('email')}
          />
          {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1.5">
            Mensagem
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            value={form.message}
            onChange={handleChange}
            placeholder="Como podemos ajudar?"
            className={`${inputClass('message')} resize-none`}
          />
          {errors.message && <p className="mt-1.5 text-xs text-red-500">{errors.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-brand-primary-hover transition active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
        >
          {loading ? <TruckLoader /> : 'Enviar mensagem'}
        </button>
      </form>
    </div>
  );
}
