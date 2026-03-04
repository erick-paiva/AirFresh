import { useState } from 'react';
import React from 'react';
import { useStore } from '@/store';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '@/components/ui';
import { motion } from 'motion/react';
import { Fan } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, error, isLoading } = useStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      try {
        await login(email, password);
        navigate('/');
      } catch (err) {
        // Error is handled in store and displayed below
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-slate-100"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Fan className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Bem-vindo de volta</h1>
          <p className="text-slate-500">Acesse o painel do AirFresh CRM</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
            Entrar
          </Button>
        </form>
        
        <div className="mt-6 text-center text-xs text-slate-400">
          <p>Login integrado com Firebase Auth.</p>
        </div>
      </motion.div>
    </div>
  );
}
