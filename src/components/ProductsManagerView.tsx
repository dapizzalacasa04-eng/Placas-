import React, { useState } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Tag, 
  DollarSign, 
  Check, 
  Save, 
  X, 
  AlertCircle, 
  Sparkles, 
  Layers, 
  ShoppingBag,
  Settings as SettingsIcon,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { Product, AppSettings } from '../types';

interface ProductsManagerViewProps {
  products: Product[];
  settings: AppSettings;
  onCreateProduct: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateProduct: (id: string, patch: Partial<Omit<Product, 'id'>>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onSaveSettings: (settings: Partial<AppSettings>) => Promise<void>;
}

export const ProductsManagerView: React.FC<ProductsManagerViewProps> = ({
  products,
  settings,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
  onSaveSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'settings'>('products');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Settings form state
  const [contactWhatsapp, setContactWhatsapp] = useState(settings.contactWhatsapp || '');
  const [businessName, setBusinessName] = useState(settings.businessName || 'GoldFlow NFC');
  const [supportEmail, setSupportEmail] = useState(settings.supportEmail || '');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // New product form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('79.90');
  const [originalPrice, setOriginalPrice] = useState('99.90');
  const [category, setCategory] = useState<Product['category']>('google_review');
  const [material, setMaterial] = useState('Acrílico Espelhado Dourado 3mm com base');
  const [dimensions, setDimensions] = useState('12 x 15 cm');
  const [badge, setBadge] = useState('Mais Vendida ⭐');
  const [featuresText, setFeaturesText] = useState(
    'Chip NFC NTAG213 embutido\nQR Code gravado a laser\nSem necessidade de app ou bateria\nDestino 100% dinâmico'
  );

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setDescription(p.description);
    setPrice(p.price.toString());
    setOriginalPrice(p.originalPrice ? p.originalPrice.toString() : '');
    setCategory(p.category);
    setMaterial(p.material);
    setDimensions(p.dimensions);
    setBadge(p.badge || '');
    setFeaturesText(p.features.join('\n'));
    setError(null);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setPrice('89.90');
    setOriginalPrice('109.90');
    setCategory('google_review');
    setMaterial('Acrílico Espelhado Dourado 3mm');
    setDimensions('12 x 15 cm');
    setBadge('Novo Modelo');
    setFeaturesText('Chip NFC NTAG213 embutido\nQR Code dinâmico a laser\nCompatível com iPhone e Android');
    setError(null);
    setIsCreateOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedPrice = parseFloat(price.replace(',', '.'));
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError('Por favor, informe um preço numérico válido.');
      return;
    }

    const parsedOriginal = originalPrice ? parseFloat(originalPrice.replace(',', '.')) : undefined;
    const feats = featuresText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    setSaving(true);
    try {
      if (editingProduct) {
        await onUpdateProduct(editingProduct.id, {
          name: name.trim(),
          description: description.trim(),
          price: parsedPrice,
          originalPrice: parsedOriginal,
          category,
          material: material.trim(),
          dimensions: dimensions.trim(),
          badge: badge.trim() || undefined,
          features: feats,
        });
        setEditingProduct(null);
      } else {
        await onCreateProduct({
          name: name.trim(),
          description: description.trim(),
          price: parsedPrice,
          originalPrice: parsedOriginal,
          category,
          material: material.trim(),
          dimensions: dimensions.trim(),
          badge: badge.trim() || undefined,
          features: feats,
          isActive: true,
          orderIndex: products.length + 1,
        });
        setIsCreateOpen(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (p: Product) => {
    try {
      await onUpdateProduct(p.id, { isActive: !p.isActive });
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, productName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o produto "${productName}" do catálogo público?`)) {
      try {
        await onDeleteProduct(id);
      } catch (err: unknown) {
        console.error(err);
      }
    }
  };

  const handleSaveStoreSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess(false);

    try {
      await onSaveSettings({
        contactWhatsapp: contactWhatsapp.trim(),
        businessName: businessName.trim(),
        supportEmail: supportEmail.trim(),
      });
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 pt-4 sm:pt-6 pb-28 flex flex-col gap-6">
      {/* Top Banner & Header */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0c1830] via-[#091224] to-[#070e1c] border border-[#1b2f52] p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="font-heading font-extrabold text-white text-base sm:text-lg">
              Gestão de Produtos, Preços & Configurações
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              Área exclusiva do proprietário protegida por Row-Level Security (RLS) e Supabase Auth
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 sm:flex-initial py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'products'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
                : 'bg-[#0b1528] text-slate-300 hover:text-white border border-[#1b2f52]'
            }`}
          >
            Produtos ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 sm:flex-initial py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
                : 'bg-[#0b1528] text-slate-300 hover:text-white border border-[#1b2f52]'
            }`}
          >
            Configurações
          </button>
        </div>
      </div>

      {/* TAB 1: Products and Prices */}
      {activeTab === 'products' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-white text-base">
              Catálogo de Placas e Preços Exibidos aos Visitantes
            </h3>
            <button
              onClick={openCreateModal}
              className="py-2.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-950 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Produto</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((p) => (
              <div
                key={p.id}
                className={`rounded-3xl bg-[#0b1528] border p-5 flex flex-col justify-between gap-4 shadow-xl transition-all ${
                  p.isActive ? 'border-[#1b2f52]' : 'border-red-900/40 opacity-70'
                }`}
              >
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                        {p.badge || 'NFC + QR'}
                      </span>
                      {!p.isActive && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950 text-red-400 border border-red-800">
                          Oculto
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      {p.originalPrice && (
                        <span className="text-[11px] text-slate-500 line-through block">
                          {p.originalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      )}
                      <span className="font-heading text-lg font-black text-emerald-400">
                        {p.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-heading font-extrabold text-white text-base">
                      {p.name}
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                      {p.description}
                    </p>
                  </div>

                  <div className="p-3 bg-[#070d1a] border border-[#1b2f52] rounded-2xl text-[11px] text-slate-300 flex flex-col gap-1">
                    <div><strong className="text-white">Material:</strong> {p.material}</div>
                    <div><strong className="text-white">Dimensões:</strong> {p.dimensions}</div>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <span>{p.features.length} benefícios cadastrados</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#14233e]">
                  <button
                    onClick={() => handleToggleActive(p)}
                    className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5"
                    title={p.isActive ? 'Ocultar do site público' : 'Ativar no site público'}
                  >
                    {p.isActive ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-emerald-400" />
                        <span>Ativo</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-slate-500" />
                        <span>Inativo</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(p)}
                      className="py-2 px-3 rounded-xl bg-[#12213d] hover:bg-[#1a3058] text-white text-xs font-bold border border-[#1b2f52] flex items-center gap-1 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Editar Preço</span>
                    </button>

                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/60 transition-colors"
                      title="Excluir produto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: General Settings */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveStoreSettings} className="p-6 rounded-3xl bg-[#0b1528] border border-[#1b2f52] flex flex-col gap-5 shadow-xl">
          <div className="flex items-center gap-2 pb-3 border-b border-[#1b2f52]">
            <SettingsIcon className="w-5 h-5 text-blue-400" />
            <h3 className="font-heading font-bold text-white text-base">
              Configurações Gerais da Loja & Atendimento
            </h3>
          </div>

          {settingsSuccess && (
            <div className="p-3 bg-emerald-950/70 border border-emerald-800 text-xs text-emerald-200 rounded-2xl flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Configurações salvas e aplicadas com sucesso no Supabase!</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-300">WhatsApp de Atendimento para Pedidos</label>
              <input
                type="text"
                value={contactWhatsapp}
                onChange={(e) => setContactWhatsapp(e.target.value)}
                placeholder="Ex: 5511999999999 (com DDI e DDD)"
                className="w-full px-4 py-2.5 rounded-2xl bg-[#070d1a] border border-[#1b2f52] text-xs text-white focus:outline-none focus:border-blue-500"
              />
              <span className="text-[11px] text-slate-500">
                Os botões &quot;Fazer Pedido&quot; dos produtos abrirão conversa com este número.
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-300">Nome Oficial da Marca</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="GoldFlow NFC"
                className="w-full px-4 py-2.5 rounded-2xl bg-[#070d1a] border border-[#1b2f52] text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-300">E-mail de Suporte Técnico</label>
            <input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              placeholder="contato@goldflow.com.br"
              className="w-full px-4 py-2.5 rounded-2xl bg-[#070d1a] border border-[#1b2f52] text-xs text-white focus:outline-none focus:border-blue-500 max-w-md"
            />
          </div>

          <button
            type="submit"
            disabled={savingSettings}
            className="self-start py-3 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-950 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <Save className="w-4 h-4" />
            <span>{savingSettings ? 'Salvando...' : 'Salvar Configurações'}</span>
          </button>
        </form>
      )}

      {/* Modal: Create or Edit Product */}
      {(isCreateOpen || editingProduct) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-[#0b1528] border border-[#1b2f52] rounded-3xl p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#1b2f52]">
              <div className="flex items-center gap-2 font-heading font-extrabold text-white text-base">
                <Tag className="w-4 h-4 text-blue-400" />
                <span>{editingProduct ? 'Editar Produto & Preço' : 'Cadastrar Novo Modelo'}</span>
              </div>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingProduct(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-[#12213d]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-950/70 border border-red-800 text-xs text-red-200 rounded-2xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="flex flex-col gap-3.5 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-300">Nome do Modelo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Placa Balcão Google Avaliações 5 Estrelas"
                  required
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#070d1a] border border-[#1b2f52] text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-300">Preço Atual (R$)</label>
                  <input
                    type="text"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="79.90"
                    required
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#070d1a] border border-[#1b2f52] text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-300">Preço De/Riscado (R$)</label>
                  <input
                    type="text"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="99.90 (opcional)"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#070d1a] border border-[#1b2f52] text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-300">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-[#070d1a] border border-[#1b2f52] text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="google_review">Google Avaliações</option>
                    <option value="whatsapp">WhatsApp Comercial</option>
                    <option value="instagram">Instagram / Redes</option>
                    <option value="menu">Cardápio Digital</option>
                    <option value="pix">Pix / Pagamentos</option>
                    <option value="custom">Outro / Especial</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-300">Etiqueta / Badge</label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="Ex: Mais Vendida ⭐"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#070d1a] border border-[#1b2f52] text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-300">Descrição Comercial</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Texto explicativo para o cliente..."
                  className="w-full px-3.5 py-2 rounded-2xl bg-[#070d1a] border border-[#1b2f52] text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-300">Material</label>
                  <input
                    type="text"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    placeholder="Acrílico Espelhado Dourado 3mm"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#070d1a] border border-[#1b2f52] text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-300">Dimensões</label>
                  <input
                    type="text"
                    value={dimensions}
                    onChange={(e) => setDimensions(e.target.value)}
                    placeholder="12 x 15 cm com base"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#070d1a] border border-[#1b2f52] text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-300">Benefícios (um por linha)</label>
                <textarea
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  rows={3}
                  placeholder="Chip NFC NTAG213 embutido..."
                  className="w-full px-3.5 py-2 rounded-2xl bg-[#070d1a] border border-[#1b2f52] text-xs text-white focus:outline-none focus:border-blue-500 font-mono resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1b2f52]">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingProduct(null);
                  }}
                  className="py-2.5 px-4 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="py-2.5 px-5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-blue-950 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Salvando...' : 'Salvar Produto'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
