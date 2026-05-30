# Design System Kynovia

## Objetivo
Base visual única para páginas institucionais, produtos e modelos, mantendo o estilo premium escuro com destaque azul.

## Tokens principais

### Cores
- `--kyn-bg`: fundo principal
- `--kyn-bg-2`: superfície de cards e seções
- `--kyn-bg-3`: variação de superfície
- `--kyn-text`: texto principal
- `--kyn-text-2`: texto secundário
- `--kyn-text-3`: texto discreto
- `--kyn-blue`: cor primária de ação
- `--kyn-blue-hover`: estado hover
- `--kyn-blue-light`, `--kyn-blue-xl`, `--kyn-blue-2xl`: escalas de destaque
- `--kyn-border`: borda padrão
- `--kyn-border-strong`: borda de ênfase

### Tipografia
- Fonte base: `Inter`
- Fonte técnica: `JetBrains Mono`
- Classes:
  - `.kyn-h1`, `.kyn-h2`, `.kyn-h3`
  - `.kyn-body-lg`, `.kyn-body`, `.kyn-small`
  - `.kyn-label`

### Espaçamento e raio
- Escala de espaçamento: `--kyn-space-1` até `--kyn-space-6` (8px a 64px)
- Radius:
  - cards: `--kyn-radius-card`
  - botões: `--kyn-radius-btn`

## Componentes base
- Navegação: `.kyn-navbar`
- Container responsivo: `.kyn-container`
- Card: `.kyn-card`
- Botões:
  - primário: `.kyn-btn .kyn-btn-primary`
  - secundário: `.kyn-btn .kyn-btn-secondary`
- Hero:
  - bloco: `.kyn-hero`
  - overlay: `.kyn-grid-overlay`

## Uso rápido
1. Inclua em qualquer HTML:
```html
<link rel="stylesheet" href="/caminho/brand/design-system.css" />
```
2. Estruture seções com `.kyn-container` e `.kyn-card`.
3. Use `.kyn-btn-primary` para CTA principal e `.kyn-btn-secondary` para ação de apoio.

## Diretrizes de copy (resumo)
- Linguagem direta, sem jargão.
- Foco em operação e resultado.
- CTAs padrão:
  - `Solicitar demonstração`
  - `Falar com especialista`
