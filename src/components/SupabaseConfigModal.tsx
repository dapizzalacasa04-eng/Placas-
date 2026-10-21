import React, { useState } from 'react';
import { 
  X, 
  Database, 
  ShieldCheck, 
  Check, 
  Copy, 
  AlertTriangle, 
  ExternalLink,
  Lock,
  Sparkles
} from 'lucide-react';
import { 
  getStoredSupabaseConfig, 
  saveStoredSupabaseConfig, 
  testSupabaseConnection, 
  SUPABASE_SQL_SCHEMA,
  resetSupabaseClient 
} from '../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionStatusChange: (connected: boolean) => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConnectionStatusChange,
}) => {
  if (!isOpen) return null;

  const currentConfig = getStoredSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'credentials' | 'sql' | 'costs'>('credentials');

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);

    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    const result = await testSupabaseConnection(cleanUrl, cleanKey);
    setTestResult(result);
    setTesting(false);

    if (result.success) {
      saveStoredSupabaseConfig({
        url: cleanUrl,
        anonKey: cleanKey,
        isConnected: true,
        lastChecked: new Date().toISOString(),
      });
      resetSupabaseClient();
      onConnectionStatusChange(true);
    }
  };

  const handleDisconnect = () => {
    saveStoredSupabaseConfig({
      url: '',
      anonKey: '',
      isConnected: false,
    });
    setUrl('');
    setAnonKey('');
    resetSupabaseClient();
    setTestResult(null);
    onConnectionStatusChange(false);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-2xl bg-[#121214] border border-[#27272a] rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-y-auto flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#27272a] flex items-center justify-between sticky top-0 bg-[#121214] z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/80">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-white">
                Infraestrutura Supabase & Segurança RLS
              </h2>
              <p className="text-xs text-zinc-400">
                PostgreSQL na nuvem com isolamento completo entre clientes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#1f1f23] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center border-b border-[#27272a] px-4 sm:px-6 bg-[#0e0e11]">
          <button
            onClick={() => setActiveTab('credentials')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'credentials'
                ? 'border-red-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Conectar Projeto
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'sql'
                ? 'border-red-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Script SQL (Tabelas + RLS)</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-emerald-950 text-emerald-300 rounded font-mono">
              Pronto
            </span>
          </button>
          <button
            onClick={() => setActiveTab('costs')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'costs'
                ? 'border-red-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Custos & Limitações Gratuitas
          </button>
        </div>

        <div className="p-4 sm:p-6 flex flex-col gap-5">
          {/* TAB 1: Credentials */}
          {activeTab === 'credentials' && (
            <form onSubmit={handleTestAndSave} className="flex flex-col gap-4">
              <div className="p-3.5 rounded-xl bg-[#0a0a0c] border border-[#27272a] text-xs text-zinc-300 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-white">
                    Modo Híbrido Ativo
                  </span>
                  <p className="text-zinc-400 leading-relaxed">
                    A plataforma já opera 100% funcional com o motor local GoldFlow para testes imediatos. Ao preencher suas credenciais do Supabase, os dados serão sincronizados diretamente com seu PostgreSQL em nuvem.
                  </p>
                </div>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-emerald-950/70 border-emerald-800 text-emerald-200'
                      : 'bg-red-950/70 border-red-800 text-red-200'
                  }`}
                >
                  {testResult.success ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              <div>
                <label className="text-xs text-zinc-300 font-medium">
                  Project URL do Supabase:
                </label>
                <input
                  type="url"
                  placeholder="https://seu-projeto.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-sm text-white font-mono focus:outline-none focus:border-red-500 mt-1"
                />
                <span className="text-[10px] text-zinc-400">
                  Encontrado em: Supabase Dashboard &gt; Project Settings &gt; API
                </span>
              </div>

              <div>
                <label className="text-xs text-zinc-300 font-medium">
                  Supabase Anon Key (Public Key):
                </label>
                <input
                  type="text"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0a0c] border border-[#27272a] text-sm text-white font-mono focus:outline-none focus:border-red-500 mt-1"
                />
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-amber-400">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Apenas a chave pública <code className="font-mono font-bold">anon</code> é utilizada. <strong>Nunca insira</strong> a chave <code className="font-mono text-red-400">service_role</code>.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#27272a]">
                {currentConfig.isConnected ? (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="text-xs text-red-400 hover:text-red-300 font-medium"
                  >
                    Desconectar Projeto
                  </button>
                ) : (
                  <span className="text-xs text-zinc-400">Status: Operando em modo de demonstração local</span>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-2 text-xs text-zinc-400 hover:text-white"
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    disabled={testing}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold text-xs transition-all shadow-lg shadow-red-950/40 disabled:opacity-50"
                  >
                    {testing ? 'Testando Conexão...' : 'Testar e Salvar Conexão'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: SQL Script */}
          {activeTab === 'sql' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white text-xs">
                    Script SQL Completo (PostgreSQL + RLS)
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    Copie e cole diretamente no SQL Editor do seu projeto Supabase
                  </p>
                </div>
                <button
                  onClick={handleCopySql}
                  className="py-1.5 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-red-950/30"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copiado para a Área de Transferência!' : 'Copiar Código SQL'}</span>
                </button>
              </div>

              <div className="rounded-xl bg-[#0a0a0c] border border-[#27272a] p-3 max-h-72 overflow-y-auto">
                <pre className="text-[11px] font-mono text-zinc-300 whitespace-pre">
                  {SUPABASE_SQL_SCHEMA}
                </pre>
              </div>

              <div className="p-3 rounded-xl bg-[#16161a] border border-[#27272a] text-xs text-zinc-400">
                <strong className="text-white block mb-1">Passos no Supabase:</strong>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Acesse o painel do seu projeto no Supabase (<a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-red-400 hover:underline inline-flex items-center gap-0.5">supabase.com <ExternalLink className="w-3 h-3 inline" /></a>).</li>
                  <li>No menu esquerdo, clique em <strong>SQL Editor</strong>.</li>
                  <li>Clique em <strong>New Query</strong>, cole o código acima e clique em <strong>Run</strong>.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: Costs and Free Tier */}
          {activeTab === 'costs' && (
            <div className="flex flex-col gap-4 text-xs text-zinc-300">
              <div className="rounded-xl bg-[#0a0a0c] border border-[#27272a] p-4 flex flex-col gap-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-red-500" />
                  Estratégia de Custo Zero (Ferramentas 100% Gratuitas)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-[#121214] border border-[#27272a]">
                    <div className="font-semibold text-white">Supabase Free Tier</div>
                    <div className="text-emerald-400 font-bold text-xs">R$ 0,00 / mês</div>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      500MB de banco PostgreSQL, 50.000 usuários ativos por mês e 500k chamadas de API.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#121214] border border-[#27272a]">
                    <div className="font-semibold text-white">Hospedagem Frontend</div>
                    <div className="text-emerald-400 font-bold text-xs">R$ 0,00 / mês</div>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Compatível com Vercel, Netlify, Cloud Run e GitHub Pages com SSL automático.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-900/60 text-amber-200 flex flex-col gap-2">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Atenção à Regra de Inatividade do Supabase (Free Tier)</span>
                </div>
                <p className="text-[11px] text-amber-300 leading-relaxed">
                  Projetos no plano gratuito do Supabase entram em pausa se ficarem 7 dias consecutivos sem requisições. 
                  Para manter seu banco 100% ativo para sempre sem pagar nada, basta configurar um ping semanal automático gratuito (via cron job do GitHub Actions ou UptimeRobot fazendo 1 requisição GET ao seu endpoint).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#0a0a0c] border border-[#27272a]">
                <strong className="text-white block mb-1">Custo Físico do Chip NFC:</strong>
                <p className="text-[11px] text-zinc-400">
                  Tags NFC modelo <strong>NTAG213</strong> custam aproximadamente <strong>R$ 1,20 a R$ 2,00 por adesivo</strong> em atacado. Como o link permanente da GoldFlow é curto (<code className="text-red-400">/r/slug</code>), o NTAG213 (144 bytes) é a opção mais econômica e confiável do mercado.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
