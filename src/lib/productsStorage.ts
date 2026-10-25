import { Product, AppSettings } from '../types';
import { getSupabaseClient } from './supabase';
import { generateUuid } from './storage';

const PRODUCTS_STORAGE_KEY = 'goldflow_products_v1';
const SETTINGS_STORAGE_KEY = 'goldflow_settings_v1';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    name: 'Placa Balcão Google Avaliações 5 Estrelas',
    description: 'Aumente o faturamento da sua empresa coletando avaliações reais de 5 estrelas no Google Meu Negócio por aproximação de celular ou leitura de QR Code permanente.',
    price: 79.9,
    originalPrice: 99.9,
    category: 'google_review',
    material: 'Acrílico Espelhado Dourado Premium 3mm com base',
    dimensions: '12 x 15 cm',
    badge: 'Mais Vendida ⭐',
    features: [
      'Chip NFC NTAG213 resistente à água embutido',
      'QR Code de alta precisão gravado a laser',
      'Compatível com iPhone e Android sem instalar app',
      'Destino 100% dinâmico atualizável pelo painel',
      'Sem mensalidades obrigatórias',
    ],
    isActive: true,
    orderIndex: 1,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'prod-002',
    name: 'Placa Balcão WhatsApp Comercial & Atendimento',
    description: 'Direcione clientes do seu balcão físico diretamente para o seu WhatsApp comercial com mensagem personalizada de pedido ou suporte.',
    price: 89.9,
    originalPrice: 109.9,
    category: 'whatsapp',
    material: 'Acrílico Black Piano com Dourado Espelhado',
    dimensions: '12 x 15 cm',
    badge: 'Alta Conversão 💬',
    features: [
      'Abre conversa no WhatsApp em 1 segundo',
      'Mensagem inicial personalizada automática',
      'NFC de longo alcance + QR Code dinâmico',
      'Ideal para recepções, caixas e mesas',
    ],
    isActive: true,
    orderIndex: 2,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'prod-003',
    name: 'Placa Redes Sociais Instagram & TikTok',
    description: 'Conquiste novos seguidores e engajamento orgânico no ponto de venda com aproximação direta para o seu perfil do Instagram.',
    price: 89.9,
    originalPrice: 109.9,
    category: 'instagram',
    material: 'Acrílico Rosé Gold / Espelhado Dourado',
    dimensions: '12 x 15 cm',
    badge: 'Tendência 📸',
    features: [
      'Abre direto no app do Instagram',
      'Design sofisticado que decora o ambiente',
      'Link nunca expira — mude de @ quando quiser',
      'Acabamento premium resistente a riscos',
    ],
    isActive: true,
    orderIndex: 3,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'prod-004',
    name: 'Placa Cardápio Digital & Menu Interativo',
    description: 'Substitua cardápios impressos por uma experiência digital rápida por aproximação ou QR Code dinâmico. Atualize preços e pratos sem reimprimir.',
    price: 74.9,
    originalPrice: 89.9,
    category: 'menu',
    material: 'Acrílico Cristal Anti-reflexo 3mm',
    dimensions: '10 x 14 cm',
    badge: 'Restaurantes & Bares 🍽️',
    features: [
      'Abre cardápio PDF, iFood ou link web',
      'Totalmente higiênica e fácil de limpar',
      'Reduz custos constantes de impressão gráfica',
      'Métrica de acessos por mesa ou garçom',
    ],
    isActive: true,
    orderIndex: 4,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'prod-005',
    name: 'Placa Pix & Pagamento Instantâneo',
    description: 'Facilite recebimentos no balcão com QR Code dinâmico de pagamento Pix e chave por aproximação de smartphone.',
    price: 84.9,
    originalPrice: 99.9,
    category: 'pix',
    material: 'Acrílico Dourado Espelhado com Base Preta',
    dimensions: '12 x 15 cm',
    badge: 'Agilidade no Caixa ⚡',
    features: [
      'Reduz filas e erros de digitação de chave',
      'QR Code protegido contra desgaste por atrito',
      'Chave Pix alterável a qualquer momento',
      'Design profissional e elegante',
    ],
    isActive: true,
    orderIndex: 5,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'prod-006',
    name: 'Totem Dupla Face Luxo GoldFlow',
    description: 'Modelo topo de linha com duas faces ativas: de um lado Google Avaliações, do outro Instagram ou WhatsApp.',
    price: 139.9,
    originalPrice: 169.9,
    category: 'custom',
    material: 'Acrílico Cast Maciço 5mm com Detalhes Ouro',
    dimensions: '15 x 20 cm',
    badge: 'Edição Especial 👑',
    features: [
      'Dois chips NFC independentes integrados',
      'Dois QR Codes dinâmicos com links separados',
      'Visibilidade 360° no balcão de atendimento',
      'Garantia total de 1 ano contra defeitos',
    ],
    isActive: true,
    orderIndex: 6,
    createdAt: '2026-01-01T00:00:00Z',
  },
];

export const DEFAULT_APP_SETTINGS: AppSettings = {
  contactWhatsapp: '5511999999999',
  businessName: 'GoldFlow NFC',
  supportEmail: 'contato@goldflow.com.br',
  allowPublicRedirectTesting: true,
  heroHeadline: 'Placas Inteligentes NFC & QR Code Dinâmico',
  heroSubtitle: 'Conecte seus clientes ao seu Google Meu Negócio, WhatsApp e Redes Sociais com apenas uma aproximação de celular. Altere os links a qualquer momento sem reimprimir.',
};

function getLocalStored<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(`Error loading ${key}`, e);
  }
  localStorage.setItem(key, JSON.stringify(defaultValue));
  return defaultValue;
}

function saveLocalStored<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key}`, e);
  }
}

// Fetch products with Supabase sync and local fallback
export async function fetchProducts(): Promise<Product[]> {
  const localProducts = getLocalStored<Product[]>(PRODUCTS_STORAGE_KEY, INITIAL_PRODUCTS);
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('order_index', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped: Product[] = data.map((d: any) => ({
          id: d.id,
          name: d.name,
          description: d.description || '',
          price: Number(d.price) || 0,
          originalPrice: d.original_price ? Number(d.original_price) : undefined,
          category: d.category || 'custom',
          material: d.material || 'Acrílico Premium',
          dimensions: d.dimensions || '12 x 15 cm',
          badge: d.badge || undefined,
          features: Array.isArray(d.features) ? d.features : [],
          isActive: d.is_active !== false,
          orderIndex: d.order_index || 0,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));

        saveLocalStored(PRODUCTS_STORAGE_KEY, mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase fetchProducts notice:', e);
    }
  }

  return localProducts;
}

// Owner creates a new product (Protected by Supabase Auth and RLS)
export async function createProduct(
  data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Product> {
  const allProducts = getLocalStored<Product[]>(PRODUCTS_STORAGE_KEY, INITIAL_PRODUCTS);
  const newId = generateUuid();

  const newProduct: Product = {
    ...data,
    id: newId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updatedList = [...allProducts, newProduct];
  saveLocalStored(PRODUCTS_STORAGE_KEY, updatedList);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.from('products').insert({
        id: newProduct.id,
        name: newProduct.name,
        description: newProduct.description,
        price: newProduct.price,
        original_price: newProduct.originalPrice || null,
        category: newProduct.category,
        material: newProduct.material,
        dimensions: newProduct.dimensions,
        badge: newProduct.badge || null,
        features: newProduct.features,
        is_active: newProduct.isActive,
        order_index: newProduct.orderIndex,
      });

      if (error) {
        console.warn('Supabase createProduct warning:', error);
        if (error.code === '42501') {
          throw new Error('Acesso negado (RLS): Apenas o proprietário autenticado pode criar produtos.');
        }
      }
    } catch (e: any) {
      if (e?.message?.includes('RLS') || e?.message?.includes('Acesso negado')) throw e;
    }
  }

  return newProduct;
}

// Owner updates an existing product or price (Protected by Supabase Auth and RLS)
export async function updateProduct(
  id: string,
  patch: Partial<Omit<Product, 'id'>>
): Promise<Product> {
  const allProducts = getLocalStored<Product[]>(PRODUCTS_STORAGE_KEY, INITIAL_PRODUCTS);
  const index = allProducts.findIndex((p) => p.id === id);
  if (index === -1) throw new Error('Produto não encontrado.');

  const updated: Product = {
    ...allProducts[index],
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  allProducts[index] = updated;
  saveLocalStored(PRODUCTS_STORAGE_KEY, allProducts);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const payload: Record<string, any> = {
        name: updated.name,
        description: updated.description,
        price: updated.price,
        original_price: updated.originalPrice || null,
        category: updated.category,
        material: updated.material,
        dimensions: updated.dimensions,
        badge: updated.badge || null,
        features: updated.features,
        is_active: updated.isActive,
        order_index: updated.orderIndex,
        updated_at: updated.updatedAt,
      };

      const { error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', id);

      if (error) {
        console.warn('Supabase updateProduct warning:', error);
        if (error.code === '42501') {
          throw new Error('Acesso negado (RLS): Apenas o proprietário autenticado pode alterar produtos e preços.');
        }
      }
    } catch (e: any) {
      if (e?.message?.includes('RLS') || e?.message?.includes('Acesso negado')) throw e;
    }
  }

  return updated;
}

// Owner deletes a product (Protected by Supabase Auth and RLS)
export async function deleteProduct(id: string): Promise<void> {
  const allProducts = getLocalStored<Product[]>(PRODUCTS_STORAGE_KEY, INITIAL_PRODUCTS);
  const remaining = allProducts.filter((p) => p.id !== id);
  saveLocalStored(PRODUCTS_STORAGE_KEY, remaining);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        console.warn('Supabase deleteProduct warning:', error);
        if (error.code === '42501') {
          throw new Error('Acesso negado (RLS): Apenas o proprietário autenticado pode excluir produtos.');
        }
      }
    } catch (e: any) {
      if (e?.message?.includes('RLS') || e?.message?.includes('Acesso negado')) throw e;
    }
  }
}

// App Settings (Business configurations)
export async function fetchAppSettings(): Promise<AppSettings> {
  const local = getLocalStored<AppSettings>(SETTINGS_STORAGE_KEY, DEFAULT_APP_SETTINGS);
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', 'general')
        .limit(1);

      if (!error && Array.isArray(data) && data.length > 0 && data[0].value) {
        const merged = { ...local, ...data[0].value };
        saveLocalStored(SETTINGS_STORAGE_KEY, merged);
        return merged;
      }
    } catch {}
  }

  return local;
}

export async function saveAppSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const current = await fetchAppSettings();
  const updated: AppSettings = { ...current, ...settings };
  saveLocalStored(SETTINGS_STORAGE_KEY, updated);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.from('app_settings').upsert(
        {
          key: 'general',
          value: updated,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );
      if (error && error.code === '42501') {
        throw new Error('Acesso negado (RLS): Apenas o proprietário autenticado pode alterar as configurações.');
      }
    } catch (e: any) {
      if (e?.message?.includes('RLS') || e?.message?.includes('Acesso negado')) throw e;
    }
  }

  return updated;
}
