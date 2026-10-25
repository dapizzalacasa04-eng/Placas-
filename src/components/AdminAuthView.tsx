import React, { useState } from 'react';
import { Lock, Mail, Key, ShieldCheck, ArrowRight, AlertCircle, CheckCircle2, Radio, Eye, EyeOff, Sparkles, UserPlus, HelpCircle } from 'lucide-react';
import { signInOwner, signUpOwner, resetPasswordForOwner } from '../lib/auth';
import { getStoredSupabaseConfig } from '../lib/supabase';

interface AdminAuthViewProps {
  onAuthenticated: () => void;
  onReturnToPublic: () => void;
  onOpenSupabaseConfig?: () => void;
}

export const AdminAuthView: React.FC<AdminAuthViewProps> = ({
  onAuthenticated,
  onReturnToPublic,
  onOpenSupabaseConfig,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('victorsantos14566@gmail.com');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('Victor Santos');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isConnected = getStoredSupabaseConfig().isConnected;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        const { user, error: authError } = await signInOwner(email, password);
        if (authError) {
          setError(authError);
        } else if (user) {
          onAuthenticated();
        }
      } else if (mode === 'signup') {
        const { user, session, error: authError, message } = await signUpOwner(email, password, fullName);
        if (authError) {
          setError(authError);
        } else if (session) {
          setSuccessMessage(message || 'Administrador registrado e conectado com sucesso!');
          setTimeout(() => onAuthenticated(), 800);
        } else {
          setSuccessMessage(message || 'Conta criada no Supabase! Verifique seu e-mail caso a confirmação esteja ativada.');
          setMode('signin');
        }
      } else if (mode === 'forgot') {
        const { success, message } = await resetPasswordForOwner(email);
        if (success) {
          setSuccessMessage(message);
        } else {
          setError(message);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Ocorreu um erro: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060b17] text-white flex flex-col justify-center items-center p-4 selection:bg-blue-600 selection:text-white">
      {/* Background radial glow */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md bg-[#0b1528] border border-[#1b2f52] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-blue-950/80 relative z-10 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-950/60 text-white border border-blue-400/30">
            <Lock className="w-7 h-7 text-white" />
          </div>

          <div className="flex items-center gap-2 mt-2">
            <span className="font-heading text-xl font-extrabold tracking-tight text-white">
              GoldFlow NFC
            </span>
            <span className="text-blue-400 font-extrabold text-[10px] tracking-wider uppercase bg-blue-950 px-2 py-0.5 rounded-lg border border-blue-800/80">
              Painel Restrito
            </span>
          </div>

          <p className="text-xs text-slate-400">
            {mode === 'signin' && 'Autenticação exclusiva do proprietário via Supabase Auth'}
            {mode === 'signup' && 'Cadastrar credencial de administrador no Supabase'}
            {mode === 'forgot' && 'Recuperação de acesso administrativo'}
          </p>
        </div>

        {/* Supabase status warning if not connected */}
        {!isConnected && (
          <div className="p-3 bg-amber-950/50 border border-amber-700/60 rounded-2xl text-[11px] text-amber-200 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Supabase ainda não configurado</span>
            </div>
            <p className="text-amber-200/90 leading-relaxed">
              Para utilizar o Supabase Auth em produção, configure as variáveis de ambiente ou conecte seu projeto.
            </p>
            {onOpenSupabaseConfig && (
              <button
                type="button"
                onClick={onOpenSupabaseConfig}
                className="self-start text-[11px] font-bold text-amber-300 hover:text-white underline"
              >
                Configurar Supabase Agora
              </button>
            )}
          </div>
        )}

        {/* Error and Success banners */}
        {error && (
          <div className="p-3.5 bg-red-950/70 border border-red-800/80 rounded-2xl text-xs text-red-200 flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 bg-emerald-950/70 border border-emerald-800/80 rounded-2xl text-xs text-emerald-200 flex items-start gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{successMessage}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'signup' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-300">Nome do Administrador</label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nome completo"
                  required
                  className="w-full px-4 py-3 rounded-2xl bg-[#070d1a] border border-[#1b2f52] text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>E-mail do Administrador</span>
              <span className="text-[10px] text-slate-500 font-normal">Supabase Auth</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu-email@dominio.com"
                required
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#070d1a] border border-[#1b2f52] text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">Senha</label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-bold"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha secreta"
                  required
                  className="w-full pl-10 pr-11 py-3 rounded-2xl bg-[#070d1a] border border-[#1b2f52] text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {mode === 'signup' && (
                <span className="text-[11px] text-slate-400">Mínimo de 6 caracteres.</span>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-blue-950 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>
                  {mode === 'signin' && 'Entrar no Painel Privado'}
                  {mode === 'signup' && 'Criar Conta de Administrador'}
                  {mode === 'forgot' && 'Enviar Link de Recuperação'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Switch between signin / signup */}
        <div className="pt-2 border-t border-[#16243f] flex items-center justify-between text-xs text-slate-400">
          {mode === 'signin' ? (
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
                setSuccessMessage(null);
              }}
              className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Primeiro acesso? Cadastre-se</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
                setSuccessMessage(null);
              }}
              className="text-blue-400 hover:text-blue-300 font-bold"
            >
              Já possui conta? Fazer Login
            </button>
          )}

          <button
            type="button"
            onClick={onReturnToPublic}
            className="text-slate-400 hover:text-slate-200"
          >
            Voltar ao Site
          </button>
        </div>

        {/* Security badge footer */}
        <div className="p-3 bg-[#070d1a] border border-[#1b2f52] rounded-2xl flex items-center gap-2.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Sessão protegida por token criptografado e Row-Level Security (RLS) no Supabase.
          </span>
        </div>
      </div>
    </div>
  );
};
