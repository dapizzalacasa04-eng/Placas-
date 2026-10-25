import React, { useState } from 'react';
import { 
  Radio, 
  Smartphone, 
  QrCode, 
  Star, 
  ShieldCheck, 
  ExternalLink, 
  Check, 
  MessageSquare, 
  Sparkles, 
  Zap, 
  Layers, 
  HelpCircle,
  ArrowRight,
  Clock,
  Award
} from 'lucide-react';
import { Product, AppSettings, Plaque } from '../types';

interface PublicCatalogViewProps {
  products: Product[];
  settings: AppSettings;
  samplePlaques?: Plaque[];
  onTestPublicRoute?: (slug: string, source: 'qr' | 'nfc') => void;
}

export const PublicCatalogView: React.FC<PublicCatalogViewProps> = ({
  products,
  settings,
  samplePlaques = [],
  onTestPublicRoute,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [testSlugInput, setTestSlugInput] = useState('');

  const activeProducts = products.filter((p) => p.isActive);
  const filteredProducts = selectedCategory === 'all'
    ? activeProducts
    : activeProducts.filter((p) => p.category === selectedCategory);

  const cleanPhone = (settings.contactWhatsapp || '5511999999999').replace(/\D/g, '');

  const openWhatsAppOrder = (productName: string, price: number) => {
    const formattedPrice = price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const text = encodeURIComponent(
      `Olá! Tenho interesse na *${productName}* (${formattedPrice}) da GoldFlow NFC. Gostaria de saber como personalizar com o logo da minha empresa!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#060b17] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Public Header (Zero Admin Buttons for Visitors) */}
      <header className="sticky top-0 z-40 bg-[#060b17]/95 backdrop-blur-md border-b border-[#1b2f52] px-4 md:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Wordmark */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-950/60 text-white font-bold border border-blue-400/30">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-heading text-lg sm:text-xl font-extrabold tracking-tight text-white">
                  GoldFlow
                </span>
                <span className="text-blue-400 font-extrabold text-[11px] tracking-wider uppercase bg-blue-950 px-2 py-0.5 rounded-lg border border-blue-800/80">
                  NFC
                </span>
              </div>
              <span className="text-[11px] text-slate-400 hidden xs:block">
                Placas Inteligentes & QR Codes Dinâmicos
              </span>
            </div>
          </div>

          {/* Navigation links for visitors */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-300">
            <a href="#produtos" className="hover:text-blue-400 transition-colors">
              Modelos & Preços
            </a>
            <a href="#como-funciona" className="hover:text-blue-400 transition-colors">
              Como Funciona
            </a>
            <a href="#tecnologia" className="hover:text-blue-400 transition-colors">
              Tecnologia NFC
            </a>
            <a href="#demonstracao" className="hover:text-blue-400 transition-colors">
              Testar QR Code
            </a>
          </nav>

          {/* Direct WhatsApp Call to Action */}
          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent('Olá! Gostaria de fazer um pedido de Placas Inteligentes GoldFlow NFC.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Fazer Pedido</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 sm:pt-16 pb-12 sm:pb-20 px-4 md:px-8 border-b border-[#1b2f52]">
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center -z-10">
          <div className="w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px]" />
        </div>

        <div className="max-w-5xl mx-auto flex flex-col items-center text-center gap-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/70 border border-blue-800 text-blue-300 text-xs font-bold animate-in fade-in">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Tecnologia de Aproximação NFC + QR Code Permanente Gravado a Laser</span>
          </div>

          <h1 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight max-w-4xl leading-[1.15]">
            Multiplique Avaliações e Clientes no Seu Balcão
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            Placas acrílicas elegantes para recepções, mesas e caixas. O cliente apenas encosta o celular ou escaneia o QR Code — sem baixar aplicativos e sem complicações.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="#produtos"
              className="py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm flex items-center gap-2 shadow-xl shadow-blue-950 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Ver Modelos e Preços</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href="#como-funciona"
              className="py-3.5 px-6 rounded-2xl bg-[#0b1528] hover:bg-[#12213d] text-slate-200 font-bold text-sm border border-[#1b2f52] transition-colors"
            >
              Como Funciona
            </a>
          </div>

          {/* Quick value badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-4xl pt-6">
            <div className="p-3.5 rounded-2xl bg-[#0b1528]/80 border border-[#1b2f52] flex items-center gap-3 text-left">
              <Zap className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">Zero Bateria</div>
                <div className="text-[11px] text-slate-400">Funciona para sempre</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0b1528]/80 border border-[#1b2f52] flex items-center gap-3 text-left">
              <Smartphone className="w-5 h-5 text-blue-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">iPhone & Android</div>
                <div className="text-[11px] text-slate-400">100% de compatibilidade</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0b1528]/80 border border-[#1b2f52] flex items-center gap-3 text-left">
              <QrCode className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">QR Dinâmico</div>
                <div className="text-[11px] text-slate-400">Altere o link sem trocar placa</div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0b1528]/80 border border-[#1b2f52] flex items-center gap-3 text-left">
              <Award className="w-5 h-5 text-purple-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">Garantia 1 Ano</div>
                <div className="text-[11px] text-slate-400">Acrílico espelhado luxo</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Products & Prices */}
      <section id="produtos" className="py-12 sm:py-20 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col items-center text-center gap-3 mb-10">
          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-400 bg-blue-950 px-3 py-1 rounded-full border border-blue-800">
            Catálogo Oficial
          </span>
          <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-white">
            Nossos Modelos de Placas Inteligentes
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Valores à vista com personalização inclusa. Escolha o modelo que melhor se adapta à sua empresa.
          </p>

          {/* Filter tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#0b1528] rounded-2xl border border-[#1b2f52] mt-4 flex-wrap justify-center">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({activeProducts.length})
            </button>
            <button
              onClick={() => setSelectedCategory('google_review')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === 'google_review'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Google Avaliações
            </button>
            <button
              onClick={() => setSelectedCategory('whatsapp')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === 'whatsapp'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              WhatsApp
            </button>
            <button
              onClick={() => setSelectedCategory('instagram')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === 'instagram'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Instagram
            </button>
            <button
              onClick={() => setSelectedCategory('menu')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === 'menu'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Cardápios
            </button>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="rounded-3xl bg-[#0b1528] border border-[#1b2f52] p-6 flex flex-col justify-between gap-5 shadow-xl hover:border-blue-500/50 transition-all group"
            >
              <div className="flex flex-col gap-3.5">
                {/* Header badge & title */}
                <div className="flex items-start justify-between gap-2">
                  <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-blue-950 text-blue-300 border border-blue-800">
                    {product.badge || 'NFC + QR Code'}
                  </span>
                  <div className="text-right">
                    {product.originalPrice && (
                      <span className="text-xs text-slate-500 line-through block">
                        {product.originalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    )}
                    <span className="font-heading text-xl font-black text-emerald-400">
                      {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-heading text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Specs Box */}
                <div className="p-3 bg-[#070d1a] border border-[#1b2f52] rounded-2xl text-[11px] text-slate-300 flex flex-col gap-1">
                  <div><strong className="text-white">Material:</strong> {product.material}</div>
                  <div><strong className="text-white">Tamanho:</strong> {product.dimensions}</div>
                </div>

                {/* Feature checklist */}
                <div className="flex flex-col gap-1.5 pt-1">
                  {product.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Button */}
              <button
                onClick={() => openWhatsAppOrder(product.name, product.price)}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Pedir no WhatsApp ({product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* How it works Section */}
      <section id="como-funciona" className="py-14 sm:py-20 px-4 md:px-8 bg-[#070d1a] border-y border-[#1b2f52]">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center gap-10">
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Simplicidade Extrema</span>
            <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-white">Como Funciona no Seu Estabelecimento</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg">
              Em apenas 3 passos sua empresa começa a coletar avaliações e direcionar clientes no balcão.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
            <div className="p-6 rounded-3xl bg-[#0b1528] border border-[#1b2f52] flex flex-col gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 font-black flex items-center justify-center text-base">
                1
              </div>
              <h3 className="font-heading text-base font-bold text-white">Coloque no Balcão ou Mesa</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                A placa vem pronta com base de encaixe firme e acabamento espelhado de luxo. Não precisa ligar na tomada nem recarregar bateria.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#0b1528] border border-[#1b2f52] flex flex-col gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 font-black flex items-center justify-center text-base">
                2
              </div>
              <h3 className="font-heading text-base font-bold text-white">O Cliente Aproxima o Celular</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Ao aproximar o topo do smartphone ou apontar a câmera para o QR Code permanente, o destino oficial abre em menos de 1 segundo.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#0b1528] border border-[#1b2f52] flex flex-col gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-400 font-black flex items-center justify-center text-base">
                3
              </div>
              <h3 className="font-heading text-base font-bold text-white">Link Dinâmico Permanente</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Se você mudar de endereço, rede social ou promoção, o destino é alterado digitalmente pelo sistema sem jamais reimprimir o QR Code.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demonstration Section */}
      <section id="demonstracao" className="py-14 sm:py-20 px-4 md:px-8 max-w-4xl mx-auto w-full">
        <div className="rounded-3xl bg-gradient-to-br from-[#0c1830] to-[#070e1c] border border-[#1b2f52] p-6 sm:p-10 flex flex-col items-center text-center gap-6 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
            <QrCode className="w-7 h-7 text-blue-400" />
          </div>

          <div>
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
              Teste o Redirecionamento Dinâmico
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mt-2 leading-relaxed">
              Veja na prática a velocidade de redirecionamento de uma placa inteligente ativa. Teste o link demonstrativo ou informe o código da sua plaquinha.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
            <input
              type="text"
              placeholder="Ex: kao ou codigo-da-placa"
              value={testSlugInput}
              onChange={(e) => setTestSlugInput(e.target.value)}
              className="flex-1 w-full px-4 py-3 rounded-2xl bg-[#070d1a] border border-[#1b2f52] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => {
                const targetSlug = testSlugInput.trim() || 'kao';
                if (onTestPublicRoute) {
                  onTestPublicRoute(targetSlug, 'qr');
                } else {
                  window.location.href = `/q/${targetSlug}`;
                }
              }}
              className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-blue-950 transition-colors"
            >
              <span>Testar Rota /q/</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick sample chips */}
          <div className="flex items-center gap-2 flex-wrap justify-center text-xs text-slate-400">
            <span>Link de demonstração ativo:</span>
            <button
              onClick={() => {
                if (onTestPublicRoute) {
                  onTestPublicRoute('kao', 'qr');
                } else {
                  window.location.href = '/q/kao';
                }
              }}
              className="font-mono text-blue-400 hover:underline bg-[#070d1a] px-2.5 py-1 rounded-lg border border-[#1b2f52]"
            >
              /q/kao
            </button>
          </div>
        </div>
      </section>

      {/* Public Footer */}
      <footer className="mt-auto border-t border-[#1b2f52] bg-[#040812] py-8 px-4 md:px-8 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-heading font-extrabold text-white text-sm">GoldFlow NFC</span>
            <span className="text-slate-600">|</span>
            <span>Placas Inteligentes de Alta Precisão</span>
          </div>

          <div className="text-slate-400 text-[11px]">
            © {new Date().getFullYear()} GoldFlow. Todos os direitos reservados.
          </div>

          <div>
            <a
              href={`https://wa.me/${cleanPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline font-bold"
            >
              Atendimento WhatsApp Oficial
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
