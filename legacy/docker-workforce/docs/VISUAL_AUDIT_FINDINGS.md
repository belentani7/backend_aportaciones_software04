# Validação visual da reauditora

## Desktop — 1280x720

A rota `/` apresenta uma landing page real do Docker Workforce com marca Docker, identidade Veridian Green, navegação, mensagem principal, CTA e a imagem Duck Jewel/NoiaCore. A rota `/dashboard` apresenta acesso protegido com identidade coerente, linguagem PT-BR/EN e botão de autenticação.

## Mobile — 375x812

A landing page mantém hierarquia, contraste, CTAs e legibilidade em viewport estreita. O acesso protegido também conserva espaçamento, contraste e leitura do título.

## Limite observado

O dashboard autenticado não foi inspecionado com uma sessão real de usuário neste ciclo; a tela de login foi validada. Portanto, a experiência interna autenticada só pode ser certificada após uma sessão de teste autorizada ou após testes de UI autenticados.


## Atualização — Command Center autenticado

A screenshot mais recente do `/dashboard` com sessão persistida confirma que o Command Center usa a superfície Veridian Green em todo o fluxo, incluindo navegação lateral, cards operacionais, protocolo crítico, ledger e o CoverageHeatmap. O estado vazio do heatmap foi corrigido: não há mais bloco branco, e a interface informa que aguarda escalas publicadas.

## Bloqueador funcional ainda aberto

Quando não há tenant conectado ou dados operacionais, o Command Center ainda exibe `100%` no card de compliance e `-%` em cobertura. O `100%` é potencialmente enganoso porque parece um resultado verificado sem existir um conjunto de dados. O card deve mostrar `—` ou `Aguardando dados` até haver um snapshot real do tenant. Esse ajuste continua obrigatório antes de considerar utilidade, confiança e frontend como 10/10.


## Atualização — métricas sem dados corrigidas

Após a mudança no `AdminDashboard`, a screenshot autenticada mostra `—` nos cards de escalas, compliance, cobertura e zonas críticas quando não há registros operacionais. O texto diferencia `sem registros operacionais` de `aguardando dados verificáveis`, eliminando a interpretação enganosa de compliance 100%. O estado vazio do CoverageHeatmap permanece coerente com a identidade visual.
