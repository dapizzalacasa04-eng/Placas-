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
  Sparkles,
  Globe,
  Download
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
  const [copiedNetlifyEnv, setCopiedNetlifyEnv] = useState(false);
  const [activeTab, setActiveTab] = useState<'credentials' | 'netlify' | 'sql' | 'costs'>('credentials');

  const downloadConfigFile = () => {
    const configData = {
      url: url.trim(),
      anonKey: anonKey.trim(),
    };
    const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = 'goldflow-config.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  };

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
      <div className="w-full sm:max-w-2xl bg-[#0b1528] border border-[#1e355b] rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto flex flex-col shadow-2xl shadow-blue-950/60">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#1b2f52] flex items-center justify-between sticky top-0 bg-[#0b1528] z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Database className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-white">
                Infraestrutura Supabase & Segurança RLS
              </h2>
              <p className="text-xs text-slate-400">
                PostgreSQL na nuvem com isolamento completo e seguro entre clientes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-[#15274d] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center border-b border-[#1b2f52] px-4 sm:px-6 bg-[#070d1a]">
          <button
            onClick={() => setActiveTab('credentials')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'credentials'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Conectar Projeto
          </button>
          <button
            onClick={() => setActiveTab('netlify')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'netlify'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Netlify (Produção)</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-blue-950 text-blue-300 rounded font-mono font-bold">
              QR Codes
            </span>
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'sql'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Script SQL (Tabelas + RLS)</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-emerald-950 text-emerald-300 rounded font-mono font-bold">
              Pronto
            </span>
          </button>
          <button
            onClick={() => setActiveTab('costs')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'costs'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Custos & Plano Gratuito
          </button>
        </div>

        <div className="p-5 sm:p-6 flex flex-col gap-5">
          {/* TAB 1: Credentials */}
          {activeTab === 'credentials' && (
            <form onSubmit={handleTestAndSave} className="flex flex-col gap-4">
              <div className="p-4 rounded-2xl bg-[#070d1a] border border-[#1b2f52] text-xs text-slate-300 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-white text-sm">
                    Modo Híbrido Ativo
                  </span>
                  <p className="text-slate-400 leading-relaxed text-xs">
                    A plataforma já opera 100% funcional com o motor local GoldFlow para testes imediatos. Ao preencher suas credenciais do Supabase, os dados serão sincronizados diretamente com seu PostgreSQL em nuvem.
                  </p>
                </div>
              </div>

              {testResult && (
                <div
                  className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2.5 ${
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
                <label className="text-xs text-slate-300 font-bold">
                  Project URL do Supabase:
                </label>
                <input
                  type="url"
                  placeholder="https://seu-projeto.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#070d1a] border border-[#1b2f52] text-sm text-white font-mono focus:outline-none focus:border-blue-500 mt-1"
                />
                <span className="text-[11px] text-slate-400">
                  Encontrado em: Supabase Dashboard &gt; Project Settings &gt; API
                </span>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold">
                  Supabase Anon Key (Public Key):
                </label>
                <input
                  type="text"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#070d1a] border border-[#1b2f52] text-sm text-white font-mono focus:outline-none focus:border-blue-500 mt-1"
                />
                <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-amber-400 font-semibold">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Apenas a chave pública <code className="font-mono font-bold">anon</code> é utilizada. <strong>Nunca insira</strong> a chave privada <code className="font-mono text-red-400">service_role</code>.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#1b2f52]">
                {currentConfig.isConnected ? (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="text-xs text-red-400 hover:text-red-300 font-bold"
                  >
                    Desconectar Projeto
                  </button>
                ) : (
                  <span className="text-xs text-slate-400">Status: Operando em modo de demonstração local</span>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 text-xs text-slate-400 hover:text-white font-bold"
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    disabled={testing}
                    className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-blue-950/60 disabled:opacity-50"
                  >
                    {testing ? 'Testando Conexão...' : 'Testar e Salvar Conexão'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: Netlify Production Settings */}
          {activeTab === 'netlify' && (
            <div className="flex flex-col gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-800/60 text-blue-200">
                <div className="flex items-center gap-2 font-bold text-white text-sm">
                  <Globe className="w-4 h-4 text-blue-400" />
                  <span>Por que configurar o Supabase no Netlify?</span>
                </div>
                <p className="mt-1 text-slate-300 text-[11px] leading-relaxed">
                  Quando um cliente escaneia o QR Code no restaurante ou empresa com o celular dele, o celular não tem os dados locais do seu navegador. 
                  Para que o link consulte o destino correto no Supabase em qualquer celular do mundo, configure estas duas variáveis no Netlify:
                </p>
              </div>

              {/* Variable 1 */}
              <div className="p-4 rounded-2xl bg-[#070d1a] border border-[#1b2f52] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-white text-xs">VITE_SUPABASE_URL</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(url.trim());
                      setCopiedNetlifyEnv(true);
                      setTimeout(() => setCopiedNetlifyEnv(false), 2000);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-blue-600/30 text-blue-300 hover:bg-blue-600/50 text-[10px] font-bold flex items-center gap-1 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedNetlifyEnv ? 'Copiado!' : 'Copiar Valor'}</span>
                  </button>
                </div>
                <div className="font-mono text-[11px] text-slate-400 truncate bg-[#0b1528] px-3 py-2 rounded-xl border border-[#1e355b]">
                  {url.trim() || 'https://seu-projeto.supabase.co'}
                </div>
              </div>

              {/* Variable 2 */}
              <div className="p-4 rounded-2xl bg-[#070d1a] border border-[#1b2f52] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-white text-xs">VITE_SUPABASE_ANON_KEY</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(anonKey.trim());
                      setCopiedNetlifyEnv(true);
                      setTimeout(() => setCopiedNetlifyEnv(false), 2000);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-blue-600/30 text-blue-300 hover:bg-blue-600/50 text-[10px] font-bold flex items-center gap-1 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copiar Valor</span>
                  </button>
                </div>
                <div className="font-mono text-[11px] text-slate-400 truncate bg-[#0b1528] px-3 py-2 rounded-xl border border-[#1e355b]">
                  {anonKey.trim() || 'sua-chave-anon-publica...'}
                </div>
              </div>

              {/* Direct File Download Option */}
              <div className="p-4 rounded-2xl bg-[#070d1a] border border-[#1b2f52] flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-xs">Alternativa sem Variáveis: Arquivo Estático</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Baixe o arquivo de configuração e coloque dentro da pasta <code className="font-mono text-blue-300">public/</code>
                    </p>
                  </div>
                  <button
                    onClick={downloadConfigFile}
                    disabled={!url || !anonKey}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-blue-950 shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar goldflow-config.json</span>
                  </button>
                </div>
              </div>

              {/* Netlify Steps */}
              <div className="p-4 rounded-2xl bg-[#070d1a] border border-[#1b2f52] text-slate-400 text-xs">
                <strong className="text-white block mb-1">Passos no Netlify Dashboard:</strong>
                <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                  <li>Abra o painel do seu site no Netlify (<a href="https://app.netlify.com" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">app.netlify.com</a>).</li>
                  <li>Acesse: <strong>Site configuration</strong> &gt; <strong>Environment variables</strong>.</li>
                  <li>Clique em <strong>Add a variable</strong> e adicione as duas variáveis acima (<code className="font-mono text-slate-300">VITE_SUPABASE_URL</code> e <code className="font-mono text-slate-300">VITE_SUPABASE_ANON_KEY</code>).</li>
                  <li>Na aba <strong>Deploys</strong>, clique em <strong>Trigger deploy</strong> &gt; <strong>Deploy site</strong> para aplicar.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: SQL Script */}
          {activeTab === 'sql' && (
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">
                    Script SQL Completo (PostgreSQL + RLS)
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Copie e cole diretamente no SQL Editor do seu projeto Supabase
                  </p>
                </div>
                <button
                  onClick={handleCopySql}
                  className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-blue-950"
                >
                  {copiedSql ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSql ? 'Copiado!' : 'Copiar Código SQL'}</span>
                </button>
              </div>

              <div className="rounded-2xl bg-[#070d1a] border border-[#1b2f52] p-4 max-h-72 overflow-y-auto">
                <pre className="text-[11px] font-mono text-slate-300 whitespace-pre">
                  {SUPABASE_SQL_SCHEMA}
                </pre>
              </div>

              <div className="p-4 rounded-2xl bg-[#070d1a] border border-[#1b2f52] text-xs text-slate-400">
                <strong className="text-white block mb-1">Passos no Supabase:</strong>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Acesse o painel do seu projeto no Supabase (<a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-0.5">supabase.com <ExternalLink className="w-3 h-3 inline" /></a>).</li>
                  <li>No menu esquerdo, clique em <strong>SQL Editor</strong>.</li>
                  <li>Clique em <strong>New Query</strong>, cole o código acima e clique em <strong>Run</strong>.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: Costs and Free Tier */}
          {activeTab === 'costs' && (
            <div className="flex flex-col gap-4 text-xs text-slate-300">
              <div className="rounded-2xl bg-[#070d1a] border border-[#1b2f52] p-5 flex flex-col gap-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  Estratégia de Custo Zero (Ferramentas 100% Gratuitas)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#0b1528] border border-[#1b2f52]">
                    <div className="font-bold text-white">Supabase Free Tier</div>
                    <div className="text-emerald-400 font-extrabold text-xs">R$ 0,00 / mês</div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      500MB de banco PostgreSQL, 50.000 usuários ativos por mês e 500k chamadas de API.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0b1528] border border-[#1b2f52]">
                    <div className="font-bold text-white">Hospedagem Frontend</div>
                    <div className="text-emerald-400 font-extrabold text-xs">R$ 0,00 / mês</div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Compatível com Vercel, Netlify, Cloud Run e GitHub Pages com SSL automático gratuito.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-900/60 text-amber-200 flex flex-col gap-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Atenção à Regra de Inatividade do Supabase (Free Tier)</span>
                </div>
                <p className="text-[11px] text-amber-300 leading-relaxed">
                  Projetos no plano gratuito do Supabase entram em pausa se ficarem 7 dias consecutivos sem requisições. 
                  Para manter seu banco 100% ativo para sempre sem pagar nada, basta configurar um ping semanal automático gratuito (via cron job do GitHub Actions ou UptimeRobot fazendo 1 requisição GET ao seu endpoint).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#070d1a] border border-[#1b2f52]">
                <strong className="text-white block mb-1">Custo Físico do Chip NFC:</strong>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Tags NFC modelo <strong>NTAG213</strong> custam aproximadamente <strong>R$ 1,20 a R$ 2,00 por adesivo</strong> em atacado. Como o link permanente da GoldFlow é curto (<code className="text-blue-400 font-mono">/r/slug</code>), o NTAG213 (144 bytes) é a opção mais econômica e confiável do mercado.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
