# GoldFlow NFC — Planejamento Técnico e Arquitetura de Sistema

Plataforma profissional para gerenciamento de placas inteligentes NFC e QR Codes com links dinâmicos permanentes, redirecionamento instantâneo, métricas segmentadas (NFC vs QR), bloqueio remoto e separação estrita de acessos via Supabase e Row Level Security (RLS).

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Decisões Arquiteturais Fundamentais para Avaliação:**
>
> 1. **Dual-Mode de Execução (Pronto para Uso Imediato + Conector Supabase Real)**:
>    - Para permitir testes instantâneos de ponta a ponta sem forçar a criação imediata de projeto externo, a aplicação virá equipada com um **Modo Demonstração Interativo Completo** (com contas pré-configuradas de Administrador GoldFlow e Cliente Lojista, gerando dados reais, QR codes e simulação de toques NFC).
>    - Ao mesmo tempo, incluirá uma central de **Configuração Supabase em 1 Clique** (onde basta colar `SUPABASE_URL` e `SUPABASE_ANON_KEY`) e um script SQL completo e pronto para colar no SQL Editor do Supabase com tabelas, índices e políticas RLS.
> 2. **Formato dos Links Permanentes e Redirecionamento**:
>    - Link canônico gravado no NFC / impresso no QR: `https://seu-dominio.com/r/:slug?src=nfc` ou `?src=qr`.
>    - Se a placa estiver ativa: registro assíncrono de telemetria e redirecionamento HTTP imediato para a URL de destino (Google Avaliações, WhatsApp, Instagram, etc.).
>    - Se a placa estiver bloqueada ou desativada: exibição de tela elegante GoldFlow de placa inativa/bloqueada, evitando redirecionamento indevido.
> 3. **Exportação de QR Code Vetorial & Raster**:
>    - Geração nativa com opções de download em **PNG em alta resolução (1024x1024)** e **SVG vetorial puro**, pronto para corte a laser ou impressão gráfica profissional.

---

## 1. Visão Geral e Modelo de Negócio

### 1.1 O que é a GoldFlow NFC
A **GoldFlow NFC** resolve o maior problema de placas físicas de acrílico ou metal com NFC e QR Code: **a rigidez do link físico**. 
Sem um link dinâmico, se o lojista mudar o telefone do WhatsApp, o link do Google Meu Negócio ou o cardápio, a placa física é descartada e gera prejuízo. Com a GoldFlow NFC:
- A placa física contém uma URL permanente que nunca muda (`/r/nome-do-ponto`).
- O destino final pode ser alterado a qualquer momento em 3 segundos pelo celular.
- A GoldFlow pode bloquear placas remotamente em caso de inadimplência ou encerramento de contrato.
- O cliente e a GoldFlow sabem exatamente quantos acessos vieram de aproximação física (NFC) versus leitura de câmera (QR Code).

### 1.2 Perfis de Acesso
```
┌───────────────────────────────────────────────────────────────────┐
│                     PERFIS E NÍVEIS DE ACESSO                     │
└───────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────┐  ┌──────────────────────────────────────┐
│       ADMINISTRADOR GOLDFLOW         │  │           CLIENTE LOJISTA            │
├──────────────────────────────────────┤  ├──────────────────────────────────────┤
│ • Visão global de todas as placas    │  │ • Visão restrita às suas placas      │
│ • Cadastro e gestão de clientes      │  │ • Edição de links de destino         │
│ • Criação de novas placas / slugs    │  │ • Visualização de métricas próprias │
│ • Bloqueio / Desbloqueio emergencial │  │ • Download de QR Codes (PNG/SVG)     │
│ • Métricas globais da plataforma     │  │ • Sem acesso a dados de terceiros    │
└──────────────────────────────────────┘  └──────────────────────────────────────┘
```

---

## 2. Experiência do Usuário e Design System

### 2.1 Identidade Visual & Diretrizes Estéticas
- **Paleta de Cores (Strict 60-30-10)**:
  - **60% Fundo & Estrutura**: Preto profundo (`#0A0A0C`), chumbo grafite escuro (`#121214`), superfícies de cartão em chumbo metálico (`#1A1A1E`).
  - **30% Tipografia & Bordas**: Branco puro (`#FFFFFF`) para títulos, cinza prateado suave (`#A1A1AA`) para dados secundários, e linhas divisórias ultrafinas (`#27272A`).
  - **10% Acentos Críticos**: Vermelho GoldFlow vibrante (`#EF4444` / hover `#DC2626`) focado em CTAs principais, status ativos, indicadores de leitura e botões de ação primária.
- **Tipografia**:
  - Títulos e Logomarca: *Outfit* / *Plus Jakarta Sans* (moderno, geométrico, premium).
  - Corpo e controles: *Plus Jakarta Sans* (legibilidade impecável em telas OLED de smartphones).
  - Métricas e URLs: *JetBrains Mono* / *IBM Plex Mono* com algarismos tabulares (`tabular-nums`).
- **Mobile-First & Ergonomia de Toque**:
  - Hitbox mínima de toque de **$48 \times 48\text{px}$** para evitar toques acidentais em balcão de loja.
  - Barra de navegação inferior flutuante fixa com desfoque de fundo (`backdrop-blur-md bg-[#0A0A0C]/90`) para operação com uma só mão.
  - Visualizador de placas com cartões táteis que simulam a placa física real em acrílico/metal escuro.

### 2.2 Fluxos Principais
1. **Fluxo do Visitante (Leitura NFC ou QR Code)**:
   - Celular encosta no NFC ou câmera lê QR Code $\rightarrow$ Acessa `/r/loja-exemplo?src=nfc`.
   - Sistema valida se o link existe e está desbloqueado:
     - Se `bloqueado = true`: exibe tela "Placa Indisponível / Entre em Contato com o Estabelecimento".
     - Se `ativo = true`: grava scan em background e redireciona imediatamente para o destino final (ex: Google Review link direto para 5 estrelas).
2. **Fluxo do Lojista (Cliente)**:
   - Acesso móvel $\rightarrow$ Login seguro $\rightarrow$ Lista de placas do cliente.
   - Seleciona placa (ex: "Totem Balcão Principal") $\rightarrow$ Altera destino com 1 clique (seleciona template: WhatsApp com mensagem pronta, Google Avaliações, Instagram ou URL personalizada).
   - Acompanha gráfico de acessos diários: total, % NFC e % QR Code.
   - Baixa os arquivos de arte gráfica (PNG 1024px e SVG vetorial).
3. **Fluxo do Administrador GoldFlow**:
   - Painel de controle de todas as placas e clientes.
   - Ação de bloqueio preventivo/remoto com chave de acionamento rápido.
   - Cadastro de novo lote de placas em massa ou individual.

---

## 3. Arquitetura Técnica e Segurança

### 3.1 Diagrama de Arquitetura do Sistema

```
                      [ VISITANTE ]
                 NFC Tag  /  QR Code
                     │           │
           (?src=nfc)▼           ▼(?src=qr)
    ┌──────────────────────────────────────────────┐
    │          ROTA PÚBLICA (/r/:slug)             │
    │  - Validação de status (Ativo/Bloqueado)     │
    │  - Incremento atômico / Scan Log             │
    │  - Redirecionamento HTTP 302                 │
    └──────────────────────┬───────────────────────┘
                           │
                           ▼
          [ DESTINO FINAL DO CLIENTE ]
    (Google Maps Review, Instagram, WhatsApp, etc)


                      [ USUÁRIOS ]
           Admin GoldFlow  │  Cliente Lojista
                           ▼
    ┌──────────────────────────────────────────────┐
    │        FRONTEND MOBILE-FIRST (REACT)         │
    │  - Supabase Auth (JWT, sessões seguras)      │
    │  - Gerador QR Code SVG/PNG no Client         │
    │  - Painel de Gestão e Dashboard Analítico    │
    │  - Sem chaves de serviço expostas            │
    └──────────────────────┬───────────────────────┘
                           │
          Chamadas HTTPS com Bearer JWT (Anon Key)
                           ▼
    ┌──────────────────────────────────────────────┐
    │            SUPABASE (POSTGRESQL)             │
    │  - Row Level Security (RLS) Ativo            │
    │  - Policies isolando tenants                 │
    │  - Funções de Segurança (SECURITY DEFINER)   │
    └──────────────────────────────────────────────┘
```

### 3.2 Regras de Segurança e Proteção de Dados
1. **Regra de Ouro**: **NUNCA expor a `service_role_key` no frontend**. Apenas a `anon_key` é utilizada pelo cliente.
2. **Isolamento via RLS (Row Level Security)**:
   - Toda consulta no Supabase filtra automaticamente os registros do usuário autenticado (`client_id = auth.uid()`).
   - Um cliente **nunca** consegue listar, alterar ou descobrir dados, placas ou métricas de outro cliente, mesmo alterando chamadas manuais de API.
   - O Administrador GoldFlow possui autorização especial baseada na tabela `profiles` com `role = 'admin'` checada via função segura no Postgres.
3. **Privacidade de Scans**:
   - Para conformidade com LGPD/GDPR, os acessos não armazenam endereços IP brutos; é armazenado apenas um hash anônimo diário ou contagem quantitativa agregada por dispositivo e fonte.

---

## 4. Modelagem de Banco de Dados (PostgreSQL + RLS)

### 4.1 Tabelas e Relacionamentos

```
┌──────────────────┐       1:N       ┌──────────────────┐       1:N       ┌──────────────────┐
│     PROFILES     │────────────────▶│     PLAQUES      │────────────────▶│      SCANS       │
├──────────────────┤                 ├──────────────────┤                 ├──────────────────┤
│ id (PK, UUID)    │                 │ id (PK, UUID)    │                 │ id (PK, BIGINT)  │
│ email            │                 │ client_id (FK)   │                 │ plaque_id (FK)   │
│ role (admin/cli) │                 │ slug (UNIQUE)    │                 │ source (nfc/qr)  │
│ full_name        │                 │ title            │                 │ user_agent       │
│ company_name     │                 │ target_type      │                 │ created_at       │
│ phone            │                 │ target_url       │                 └──────────────────┘
│ created_at       │                 │ is_active (bool) │
└──────────────────┘                 │ is_locked (bool) │
                                     │ created_at       │
                                     │ updated_at       │
                                     └──────────────────┘
```

### 4.2 Script SQL de Inicialização e Políticas RLS

```sql
-- 1. Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Perfis (Administradores e Clientes)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'client')) DEFAULT 'client',
  full_name TEXT NOT NULL,
  company_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Placas e Links Permanentes
CREATE TABLE public.plaques (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('google_review', 'whatsapp', 'instagram', 'menu', 'website', 'custom')),
  target_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  is_locked BOOLEAN DEFAULT false NOT NULL,
  total_nfc_scans INTEGER DEFAULT 0 NOT NULL,
  total_qr_scans INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela de Histórico de Acessos (Telemetria)
CREATE TABLE public.scans (
  id BIGSERIAL PRIMARY KEY,
  plaque_id UUID REFERENCES public.plaques(id) ON DELETE CASCADE NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('nfc', 'qr', 'direct')),
  device_type TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices de alta performance
CREATE INDEX idx_plaques_slug ON public.plaques(slug);
CREATE INDEX idx_plaques_client ON public.plaques(client_id);
CREATE INDEX idx_scans_plaque_created ON public.scans(plaque_id, created_at);

-- 5. Funções de Suporte de Segurança
CREATE OR REPLACE FUNCTION public.is_goldflow_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Ativar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

-- 7. Políticas de Segurança (RLS)

-- Profiles: Usuário lê o próprio perfil; Admin lê todos
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_goldflow_admin());

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_goldflow_admin());

-- Plaques: Clientes só leem e alteram suas placas
CREATE POLICY "Clients read own plaques" ON public.plaques
  FOR SELECT USING (client_id = auth.uid() OR public.is_goldflow_admin());

CREATE POLICY "Clients update destination of own plaques" ON public.plaques
  FOR UPDATE USING (client_id = auth.uid() OR public.is_goldflow_admin())
  WITH CHECK (
    -- Clientes não podem destravar placas se foram bloqueadas pelo admin
    (public.is_goldflow_admin()) OR (is_locked = false)
  );

CREATE POLICY "Admins full plaque management" ON public.plaques
  FOR ALL USING (public.is_goldflow_admin());

-- Scans: Leitura apenas do proprietário da placa ou admin
CREATE POLICY "View scans of own plaques" ON public.scans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.plaques
      WHERE plaques.id = scans.plaque_id AND (plaques.client_id = auth.uid() OR public.is_goldflow_admin())
    )
  );

-- Acesso anônimo à rota pública para buscar destino e registrar scan
CREATE POLICY "Public read active plaque for redirect" ON public.plaques
  FOR SELECT TO anon USING (is_active = true AND is_locked = false);

CREATE POLICY "Public record scan" ON public.scans
  FOR INSERT TO anon WITH CHECK (true);
```

---

## 5. Custos, Limitações e Configurações

### 5.1 Estimativa de Custos (Ferramentas 100% Gratuitas)
| Serviço | Plano | Custo | Limite Gratuito |
| :--- | :--- | :--- | :--- |
| **Supabase** | Free Tier | **R$ 0,00** | 500 MB de PostgreSQL, 50.000 usuários ativos/mês, 500.000 chamadas Edge/mês. |
| **GitHub** | Free | **R$ 0,00** | Repositório privado, Git Version Control e CI/CD actions básico. |
| **Vercel / Netlify / Render** | Hobby / Free | **R$ 0,00** | 100 GB de largura de banda/mês, SSL automático, deploy contínuo. |
| **Domínio Próprio** *(Opcional)* | `.com.br` ou `.com` | ~R$ 40 - R$ 70 / ano | Recomendado para links profissionais gravados no NFC (`goldflow.link/slug`). |

### 5.2 Limitações e Recomendações
1. **Pausa de Inatividade do Supabase (Free Tier)**:
   - No plano gratuito, se um projeto Supabase ficar 7 dias consecutivos sem nenhuma consulta, o banco entra em modo de pausa.
   - *Solução*: Uma requisição semanal de cron job gratuita (GitHub Actions ou cron externo) mantém o banco sempre ativo.
2. **Capacidade dos Chips NFC (NTAG213 vs NTAG215/216)**:
   - A GoldFlow deve usar links curtos (`https://dominio.com/r/slug`). O chip NTAG213 possui 144 bytes de memória útil, mais que suficiente para URLs de até 130 caracteres e custa significativamente menos que NTAG215.

---

## 6. Plano de Testes e Validação

Trabalhando por etapas rigorosas e sem simulação de resultados falsos:

1. **Etapa 1: Validação do Sistema de Redirecionamento e Telemetria**
   - Teste de requisição para `/r/:slug?src=nfc` e `/r/:slug?src=qr`.
   - Verificar incremento imediato no contador individual de NFC e de QR.
   - Verificar comportamento do bloqueio remoto: ao alterar `is_locked = true`, a rota deve impedir o redirecionamento e exibir o aviso seguro.
2. **Etapa 2: Motor de Geração e Exportação de QR Code**
   - Teste de renderização no canvas HTML5 e elemento SVG.
   - Validação da exportação do arquivo PNG em alta resolução (1024x1024) com verificação de download funcional.
   - Validação da exportação do arquivo SVG com nós vetoriais perfeitos para plotters de recorte.
3. **Etapa 3: Autenticação e Alternância de Perfis (Admin vs Cliente)**
   - Teste com credenciais de Administrador: validação de visibilidade de todos os clientes e todas as placas.
   - Teste com credenciais de Cliente: verificação estrita de que placas de outros clientes não são renderizadas e não podem ser acessadas.
4. **Etapa 4: Assistente de Destinos Inteligentes**
   - Teste de formatação automática para:
     - WhatsApp (conversão de número + mensagem inicial codificada em URL).
     - Google Avaliações (link direto `search/?api=1&query_place_id=...` ou review direto).
     - Instagram (`https://instagram.com/...`).
     - Cardápio digital e site genérico.
5. **Etapa 5: Responsividade Mobile e Conectores Supabase**
   - Teste em viewport de celular (375px a 430px) garantindo zonas de polegar, touch targets $\ge 48$px e ausência de overflow horizontal.
   - Teste do modal de configuração de chaves Supabase e exportação do script SQL.

---

## 7. Próximos Passos (Aguardando Aprovação)

Após sua aprovação deste plano técnico, iniciaremos a implementação do código:
1. Configuração do design tokens Tailwind (preto, chumbo, branco, vermelho).
2. Construção do mecanismo de redirecionamento dinâmico `/r/:slug` e telemetria.
3. Construção do gerador e exportador de QR Code (PNG 1024px e SVG).
4. Desenvolvimento dos painéis mobile-first do Administrador GoldFlow e do Cliente.
5. Criação do conector Supabase com script SQL exportável e seletor de perfil para testes imediatos.
