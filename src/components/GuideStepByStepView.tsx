import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Smartphone, 
  Radio, 
  QrCode, 
  Edit3, 
  Download, 
  Plus, 
  ArrowRight, 
  Copy, 
  Check, 
  ExternalLink,
  HelpCircle,
  Sparkles,
  Layers
} from 'lucide-react';
import { Plaque, UserRole } from '../types';

interface GuideStepByStepViewProps {
  plaques: Plaque[];
  userRole: UserRole;
  onOpenNewPlaqueModal: () => void;
  onOpenQrStudio: (plaque?: Plaque) => void;
  onOpenNfcSimulator: () => void;
  onGoToPlaques: () => void;
}

export const GuideStepByStepView: React.FC<GuideStepByStepViewProps> = ({
  plaques,
  userRole,
  onOpenNewPlaqueModal,
  onOpenQrStudio,
  onOpenNfcSimulator,
  onGoToPlaques,
}) => {
  const [activeGuide, setActiveGuide] = useState<'create' | 'edit_link' | 'qr_dynamic' | 'program_nfc'>('create');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const samplePlaque = plaques[0];
  const sampleUrl = samplePlaque
    ? `${window.location.origin}/r/${samplePlaque.slug}`
    : `${window.location.origin}/r/balcao-principal`;

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedSlug(url);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  const guides = [
    {
      id: 'create' as const,
      title: '1. Como Criar uma Placa',
      subtitle: 'Cadastre seu display físico em 3 passos',
      icon: Plus,
    },
    {
      id: 'edit_link' as const,
      title: '2. Como Trocar o Link',
      subtitle: 'Altere o destino sem regravar o chip',
      icon: Edit3,
    },
    {
      id: 'qr_dynamic' as const,
      title: '3. QR Code Dinâmico',
      subtitle: 'Baixe em alta qualidade para impressão',
      icon: QrCode,
    },
    {
      id: 'program_nfc' as const,
      title: '4. Gravar Chip NFC no Celular',
      subtitle: 'Passo a passo com o app gratuito NFC Tools',
      icon: Smartphone,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 pt-4 sm:pt-6 pb-28 flex flex-col gap-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0c1830] via-[#091224] to-[#060c18] border border-[#1e355b] p-6 sm:p-8 flex flex-col gap-4 shadow-2xl shadow-blue-950/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-2 text-xs font-bold text-blue-400 tracking-wider uppercase">
          <Sparkles className="w-4 h-4" />
          <span>Manual Prático e Fácil</span>
        </div>

        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Passo a Passo: Como Usar a GoldFlow NFC
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-1.5 max-w-2xl leading-relaxed">
            Aprenda a gerenciar seus displays de balcão, trocar links instantaneamente, baixar QR Codes profissionais e gravar tags NFC com seu próprio smartphone.
          </p>
        </div>

        {/* Quick Nav Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
          {guides.map((g) => {
            const Icon = g.icon;
            const isSelected = activeGuide === g.id;
            return (
              <button
                key={g.id}
                onClick={() => setActiveGuide(g.id)}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/60 ring-2 ring-blue-400/30'
                    : 'bg-[#0f1d38]/80 hover:bg-[#15274d] border-[#1e355b] text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-blue-400'}`} />
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </div>
                <div className="font-bold text-xs sm:text-sm leading-snug">
                  {g.title}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Guide Content Display */}
      <div className="rounded-3xl bg-[#0b1528] border border-[#1e355b] p-6 sm:p-8 flex flex-col gap-6 shadow-xl">
        {/* GUIDE 1: CRIAR UMA PLACA */}
        {activeGuide === 'create' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-[#1b2f52] pb-4">
              <div>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                  Guia Prático #1
                </span>
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-white">
                  Como Criar uma Nova Placa Inteligente
                </h2>
              </div>
              <button
                onClick={onOpenNewPlaqueModal}
                className="py-3 px-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-blue-950/60 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>Criar Placa Agora</span>
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {/* Step 1 */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#070d1a] border border-[#1a2d50] flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-extrabold flex items-center justify-center shrink-0 text-base shadow-md shadow-blue-950">
                  1
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-heading text-base font-bold text-white">
                    Defina o Nome e a Localização da Placa
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Dê um nome fácil de reconhecer, como <strong>"Totem Balcão Principal"</strong>, <strong>"Mesa 05"</strong> ou <strong>"Display Caixa"</strong>. Isso ajuda você e sua equipe a identificar onde o totem físico está instalado.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#070d1a] border border-[#1a2d50] flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-extrabold flex items-center justify-center shrink-0 text-base shadow-md shadow-blue-950">
                  2
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-heading text-base font-bold text-white">
                    Escolha o Destino Inicial
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Selecione para onde você quer que o cliente seja direcionado ao aproximar o celular:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                    <span className="p-2 rounded-xl bg-[#0f1d38] border border-[#1b2f52] text-xs font-semibold text-emerald-400 text-center">
                      💬 WhatsApp
                    </span>
                    <span className="p-2 rounded-xl bg-[#0f1d38] border border-[#1b2f52] text-xs font-semibold text-amber-400 text-center">
                      ⭐ Google Avaliações
                    </span>
                    <span className="p-2 rounded-xl bg-[#0f1d38] border border-[#1b2f52] text-xs font-semibold text-pink-400 text-center">
                      📸 Instagram
                    </span>
                    <span className="p-2 rounded-xl bg-[#0f1d38] border border-[#1b2f52] text-xs font-semibold text-sky-400 text-center">
                      📖 Cardápio / Site
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#070d1a] border border-[#1a2d50] flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-extrabold flex items-center justify-center shrink-0 text-base shadow-md shadow-blue-950">
                  3
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-heading text-base font-bold text-white">
                    Link Fixo Criado Automaticamente
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    O sistema gera um link curto permanente (exemplo: <code className="text-blue-400 font-mono">/r/meu-balcao</code>). É esse link que você grava no chip NFC. <strong>Você nunca precisará regravar o chip físico</strong>, pois o destino é trocado diretamente pelo painel!
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Action */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#070d1a] p-4 rounded-2xl border border-[#1a2d50]">
              <span className="text-xs text-slate-300">
                Pronto para cadastrar o seu primeiro display?
              </span>
              <button
                onClick={onOpenNewPlaqueModal}
                className="w-full sm:w-auto py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-950"
              >
                <span>Cadastrar Placa Agora</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* GUIDE 2: TROCAR O LINK */}
        {activeGuide === 'edit_link' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-[#1b2f52] pb-4">
              <div>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                  Guia Prático #2
                </span>
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-white">
                  Como Trocar o Destino Sem Mexer no Chip Físico
                </h2>
              </div>
              <button
                onClick={onGoToPlaques}
                className="py-3 px-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-blue-950/60 transition-all"
              >
                <Layers className="w-4 h-4" />
                <span>Ver Minhas Placas</span>
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-[#070d1a] border border-[#1a2d50] flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-extrabold flex items-center justify-center shrink-0 text-base">
                  1
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-heading text-base font-bold text-white">
                    Localize a Placa Desejada na Tela Principal
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Acesse a aba <strong>"Placas & Links"</strong>. Cada placa possui dois botões bem grandes e visíveis: <strong>"Trocar Link NFC"</strong> e <strong>"Trocar Link QR"</strong>.
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-[#070d1a] border border-[#1a2d50] flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-extrabold flex items-center justify-center shrink-0 text-base">
                  2
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-heading text-base font-bold text-white">
                    Cole o Novo Endereço ou Escolha um Atalho
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Quer enviar clientes para uma promoção relâmpago no WhatsApp? Ou pedir 5 estrelas no Google? Basta colar o novo link ou preencher o número do WhatsApp com a mensagem pronta.
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-[#070d1a] border border-[#1a2d50] flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-extrabold flex items-center justify-center shrink-0 text-base">
                  3
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-heading text-base font-bold text-white">
                    Clique em Salvar: A Mudança é Imediata
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    O próximo cliente que encostar o celular na placa já abrirá o novo destino na hora! Não precisa recolher totens, nem regravar o chip.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#070d1a] p-4 rounded-2xl border border-[#1a2d50]">
              <span className="text-xs text-slate-300">
                Quer alterar o link de uma de suas placas agora mesmo?
              </span>
              <button
                onClick={onGoToPlaques}
                className="w-full sm:w-auto py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-950"
              >
                <span>Acessar Lista de Placas</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* GUIDE 3: QR CODE DINÂMICO */}
        {activeGuide === 'qr_dynamic' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-[#1b2f52] pb-4">
              <div>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                  Guia Prático #3
                </span>
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-white">
                  Como Usar o QR Code Dinâmico GoldFlow
                </h2>
              </div>
              <button
                onClick={() => onOpenQrStudio()}
                className="py-3 px-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-blue-950/60 transition-all"
              >
                <QrCode className="w-4 h-4" />
                <span>Central de QR Codes</span>
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-[#070d1a] border border-[#1a2d50] flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-extrabold flex items-center justify-center shrink-0 text-base">
                  1
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-heading text-base font-bold text-white">
                    O que é um QR Code Dinâmico?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Diferente de um QR Code comum que fica preso ao link impresso para sempre, o <strong>QR Code Dinâmico GoldFlow</strong> aponta para um endereço inteligente permanente. Quando você troca o link no painel, o QR impresso no acrílico continua funcionando sem precisar reimprimir!
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-[#070d1a] border border-[#1a2d50] flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-extrabold flex items-center justify-center shrink-0 text-base">
                  2
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-heading text-base font-bold text-white">
                    Baixe em Alta Resolução (PNG 1024px ou Vetor SVG)
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Disponibilizamos dois formatos profissionais:
                  </p>
                  <ul className="text-xs sm:text-sm text-slate-300 list-disc list-inside mt-1 space-y-1">
                    <li><strong>PNG 1024px:</strong> Perfeito para artes digitais, adesivos e redes sociais.</li>
                    <li><strong>SVG Vetorial:</strong> Ideal para gráficas, serigrafia e corte/gravação a laser em acrílico ou metal.</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-[#070d1a] border border-[#1a2d50] flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-extrabold flex items-center justify-center shrink-0 text-base">
                  3
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-heading text-base font-bold text-white">
                    NFC e QR Code São Independentes
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Você pode configurar para a aproximação por aproximação NFC abrir o seu WhatsApp, enquanto a leitura da câmera do QR Code abre o cardápio ou o Google Avaliações. Total liberdade!
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#070d1a] p-4 rounded-2xl border border-[#1a2d50]">
              <span className="text-xs text-slate-300">
                Gere e baixe seu QR Code agora mesmo:
              </span>
              <button
                onClick={() => onOpenQrStudio()}
                className="w-full sm:w-auto py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-950"
              >
                <span>Abrir Gerador de QR Code</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* GUIDE 4: GRAVAR O CHIP NFC NO CELULAR */}
        {activeGuide === 'program_nfc' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-[#1b2f52] pb-4">
              <div>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                  Guia Prático #4
                </span>
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-white">
                  Como Gravar o Chip NFC Físico Usando seu Celular
                </h2>
              </div>
              <button
                onClick={onOpenNfcSimulator}
                className="py-3 px-5 rounded-2xl bg-[#1e355b] hover:bg-[#254373] text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all border border-blue-400/30"
              >
                <Smartphone className="w-4 h-4 text-blue-400" />
                <span>Simulador de Toque</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-blue-950/50 border border-blue-700/60 text-xs sm:text-sm text-blue-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-blue-400 shrink-0" />
                <span>
                  Chip recomendado: <strong>NTAG213</strong> (adesivo redondo de 25mm, custa ~R$ 1,50).
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-[#070d1a] border border-[#1a2d50] flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-extrabold flex items-center justify-center shrink-0 text-base">
                  1
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-heading text-base font-bold text-white">
                    Instale o App Grátis "NFC Tools"
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Disponível gratuitamente para <strong>iPhone (App Store)</strong> e <strong>Android (Google Play)</strong>. É o aplicativo padrão mais confiável do mundo para escrever em chips NFC.
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-[#070d1a] border border-[#1a2d50] flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-extrabold flex items-center justify-center shrink-0 text-base">
                  2
                </div>
                <div className="flex flex-col gap-1 w-full">
                  <h3 className="font-heading text-base font-bold text-white">
                    Copie o Link Permanente da sua Placa
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Você deve gravar o link curto permanente fornecido pela GoldFlow. Exemplo:
                  </p>
                  <div className="mt-2 p-3 rounded-xl bg-[#0f1d38] border border-[#1e355b] flex items-center justify-between gap-2">
                    <span className="font-mono text-xs sm:text-sm text-white truncate">
                      {sampleUrl}
                    </span>
                    <button
                      onClick={() => copyUrl(sampleUrl)}
                      className="py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
                    >
                      {copiedSlug ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSlug ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-[#070d1a] border border-[#1a2d50] flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-extrabold flex items-center justify-center shrink-0 text-base">
                  3
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-heading text-base font-bold text-white">
                    Grave a Tag com 1 Toque
                  </h3>
                  <ol className="text-xs sm:text-sm text-slate-300 list-decimal list-inside space-y-1 mt-1 leading-relaxed">
                    <li>Abra o <strong>NFC Tools</strong> no celular.</li>
                    <li>Toque em <strong>Escrever (Write)</strong> &gt; <strong>Adicionar um registro</strong>.</li>
                    <li>Escolha <strong>URL / URI</strong> e cole o link copiado no passo anterior.</li>
                    <li>Toque em <strong>Escrever (Write)</strong> e encoste a traseira do celular na placa física.</li>
                    <li>O app confirmará com uma marcação verde e som de sucesso!</li>
                  </ol>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-[#070d1a] border border-[#1a2d50] flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white font-extrabold flex items-center justify-center shrink-0 text-base">
                  ✓
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-heading text-base font-bold text-emerald-400">
                    Pronto! Tag Gravada Para Sempre
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    A partir de agora, qualquer cliente com iPhone ou Android que encostar no totem abrirá seu link. Quando você quiser trocar de WhatsApp para Google Avaliações, <strong>você só mexe aqui no painel GoldFlow</strong>!
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#070d1a] p-4 rounded-2xl border border-[#1a2d50]">
              <span className="text-xs text-slate-300">
                Quer testar agora como o cliente vê ao encostar o celular?
              </span>
              <button
                onClick={onOpenNfcSimulator}
                className="w-full sm:w-auto py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-950"
              >
                <span>Simular Aproximação no Celular</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
