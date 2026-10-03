# DOCKER WORKFORCE — PROJECT TODO

- [x] Initial project and schema foundation (multi-tenant tables)
- [ ] Implement Brazilian CLT & eSocial compliance engine (S-1200, S-2299, overtime, night shift, breaks)
- [ ] Construir protocolo de quórum de 3 nós conforme requisito original 2-of-3; Ed25519/ECDSA está implementado, mas o fluxo atual é fail-closed 3-of-3 e precisa de decisão técnica/documentada.
- [ ] Implement heavy audit ledger with SHA-256 hash chaining and divergence detection
- [ ] Build absence management supporting 16+ Brazilian absence types with coverage impact
- [ ] Build pre-folha payroll calculation engine and bank export
- [ ] Concluir UI bilingue real (pt-BR/EN) com i18n/toggle, tema Veridian Green, landing, Command Center, calendário e ferramentas de gestão.
- [ ] Integrate legal compliance contracts protecting belentani.eu & noiacore.com, 1-million-threshold royalty rule, and Duck introduction package
- [ ] Executar testes de segurança, isolamento e integração dos fluxos críticos sem considerar cobertura unitária limitada como conclusão.


## Auditoria 10/10 & Liberação para Repositório Privado
- [x] Fase 1: Inventário e critérios de auditoria definidos
- [ ] Fase 2: Auditoria de Backend, Banco de Dados, Quórum de 3 Nós e Conformidade CLT/eSocial completa
- [ ] Fase 3: Auditoria autenticada de Frontend, Tema Veridian Green, Identidade NoiaCore e Atribuição `belentani.eu` / `noiacore.com`
- [x] Fase 4: Executar novamente Vitest, check e build após as mudanças definitivas deste ciclo; todos passaram novamente após o endurecimento do schema.
- [ ] Fase 5: Validação do GitHub e empacotamento para repositório privado
- [ ] Fase 6: Relatório de auditoria 10/10 emitido e entregue ao usuário


## Bloqueadores descobertos na reauditora integral
- [x] Corrigir deriva de contratos tRPC entre frontend e backend (`compliance`, `shifts`, `employees`).
- [ ] Corrigir schema e serviços de consentimento de notificações com teste end-to-end de persistência.
- [x] Corrigir inserções JSON no ledger de auditoria e eventos com versionamento obrigatório.
- [x] Corrigir autenticação JWT do Socket.IO e inicialização resiliente do Redis.
- [x] Corrigir configurações TypeScript, dependências e erros de build.
- [ ] Substituir testes frágeis por testes de comportamento real sem mocks de funcionalidades essenciais.
- [ ] Comprovar implementação criptográfica do quórum 3-nós e validação versionada dos rascunhos S-1200/S-2299; integração governamental de transmissão permanece bloqueada até configuração oficial.
- [x] Implementar serviço criptográfico de quórum 3-nós com Ed25519/ECDSA e testes de assinatura.
- [x] Implementar validação versionada de rascunhos S-1200/S-2299 com limite explícito de transmissão.
- [ ] Revalidar isolamento multi-tenant, ausência de RLS nativo no MySQL/TiDB, migrações e documentação comercial antes de exportar ao GitHub.
- [x] Gerar comparação automatizada de nomes de colunas entre Drizzle e introspecção do banco; comparação de tipos, defaults e índices permanece pendente.
- [ ] Executar testes de integração/runtime para userTenantRoles, sessões, auditoria e publicação com quórum.
- [ ] Registrar a reconciliação técnica do banco apenas após uma comparação confiável de tipos, defaults, nullabilidade e índices e repetir `pnpm check`, testes e build.
- [x] Corrigir o comparador estrutural, gerar `docs/SCHEMA_PARITY_REPORT.json` com 16 tabelas e confirmar zero divergências de colunas, tipos normalizados, defaults, nullabilidade e índices; repetir check, testes e build permanece obrigatório após a última mudança.
- [ ] Revalidar documentação de todas as tabelas legadas antes do checkpoint.
- [ ] Não publicar no GitHub até que `pnpm check`, `pnpm test` e `pnpm build` passem sem erros no estado definitivo e todos os bloqueadores 10/10 estejam encerrados; este ciclo técnico passou, mas os bloqueadores de integração permanecem.

## Registro de auditoria honesta
- [x] A certificação anterior 10/10 foi invalidada provisoriamente porque a reauditora encontrou erros de TypeScript, contratos tRPC ausentes e funcionalidades declaradas sem evidência suficiente.

---

## Correções reais executadas nesta reauditora
- [x] Corrigir importação e instanciação de `ComplianceEngine` em `schedulingEngine.ts`.
- [x] Adicionar dependências declaradas de Socket.IO e adaptador Redis.
- [x] Corrigir importação `crypto` no serviço de auditoria.
- [x] Adicionar alvo ES2022 ao TypeScript.
- [x] Criar testes básicos de criptografia AES-256-GCM, anonimização e hash SHA-256.
- [x] Reexecutar validação completa após todas as correções: `pnpm check`, 7 arquivos de teste / 20 testes e `pnpm build` passaram.
- [ ] Criar novo repositório privado `belentani7/<nome-do-repositório>` somente após aprovação comprovada.


## Bloqueador visual descoberto na revisão de screenshots
- [x] Substituir a homepage placeholder por uma experiência Docker Workforce premium com identidade Veridian Green.
- [ ] Validar dashboard visível autenticado com navegação, métricas, estados vazios e componentes de produto reais.
- [x] Criar shell visual do Command Center e estados vazios honestos.
- [x] Substituir os blocos estáticos de Pré-folha e Auditoria por componentes funcionais integrados; validação autenticada ainda pendente.
- [x] Validar responsividade desktop e mobile da landing e do acesso protegido com screenshots após a implementação.
- [ ] Validar o dashboard autenticado em desktop e mobile com uma sessão de teste autorizada.
- [ ] Não considerar frontend 10/10 enquanto o preview não mostrar a experiência real do produto em todos os estados, idiomas e breakpoints.
- [ ] Atualizar notificationPreferencesService e criar testes end-to-end de concessão, revogação e persistência de preferências.
- [ ] Expandir a suíte com testes comportamentais de rotas e serviços críticos sem mocks essenciais e documentar a cobertura.


## Conformidade eSocial descoberta na pesquisa oficial
- [ ] Completar adaptador versionado para rascunhos S-1200 e S-2299 com validação XSD oficial; a validação local e o limite de transmissão já existem, mas não são suficientes para certificação 10/10.
- [x] Registrar no código e na documentação a fonte oficial do Portal eSocial e a versão do MOS usada na validação.
- [x] Cobrir com testes os campos obrigatórios, competência, vínculo e desligamento no adaptador de rascunhos; validação XSD/transmissão oficial permanece pendente.


## Bloqueador de localização brasileira
- [x] Alterar o schema de tenants para suportar BR como jurisdição primeira classe e atualizar defaults de país, fuso e moeda sem destruir dados existentes.
- [x] Implementar regras CLT parametrizadas no motor de compliance e remover a dependência operacional das regras ES como padrão.
- [ ] Adicionar testes de regras BR integrados e garantir que cada tenant selecione explicitamente a jurisdição aplicável.


## Bloqueadores de cálculo trabalhista
- [ ] Corrigir a janela da competência da pré-folha para incluir todo o último dia com conversão explícita do fuso do tenant; o limite UTC já foi corrigido.
- [x] Substituir a detecção simplificada de noturno por cálculo de sobreposição real com a janela noturna brasileira.
- [x] Remover a alíquota fixa de 19% como se fosse folha legal e marcar a saída como estimativa sem configuração fiscal/contábil.
- [x] Adicionar testes puros para horas trabalhadas, sobreposição noturna e janela mensal.


## Deriva estrutural do banco descoberta
- [ ] Reconciliar shifts com versionamento, autoria, exclusão lógica e complianceCheckId campo-a-campo com o schema.
- [ ] Reconciliar absences campo-a-campo com o schema; o banco ainda conserva colunas legadas adicionais e precisa de decisão de compatibilidade.
- [ ] Reconciliar payrolls campo-a-campo com o schema; a contagem atual ainda diverge e exige verificação detalhada.
- [ ] Reconciliar complianceViolations campo-a-campo e validar os contratos de runtime após a migração.
- [ ] Verificar estruturalmente domainEvents, payrollAdjustments, complianceRuleVersions e sessions, incluindo tipos, defaults, índices e compatibilidade com os serviços.
- [ ] Reconciliar rtaEvents e userTenantRoles e executar testes profundos de isolamento multi-tenant.
- [x] Aplicar a migração revisada e comparar as 16 tabelas campo-a-campo incluindo tipos, defaults, nullabilidade e índices com parser confiável; resultado final persistido sem divergências.


## Diferenças finais de schema encontradas pelo comparador
- [x] Adicionar `employees.phone`, `users.mfaEnabled` e `users.deletedAt` para zerar as colunas esperadas ausentes.
- [x] Incorporar `payrollRules` ao schema Drizzle como tabela de regras legada compatível.
- [x] Documentar explicitamente o papel de `payrollRules`, seu status legado e o critério para ativação operacional futura em `docs/PAYROLL_RULES_LEGACY_STATUS.md`.
- [x] Reexecutar o comparador após a migração: as 16 tabelas têm os mesmos nomes de colunas esperados; tipos, defaults e índices ainda precisam de validação.


## Compatibilidade legada final
- [x] Modelar no schema as colunas legadas preservadas (`absences`, `auditLogs`, `payrolls`) sem remover dados ou integrações dependentes.
- [x] Tornar a migração dessas colunas idempotente para funcionar no banco atual e em um banco novo do repositório.


## Mismatches de tipos e restrições descobertos
- [x] Converter `payrolls.baseSalary`, `hoursWorked`, `nightHours`, `nightBonus`, `nutriPass`, `gross` e `net` de TEXT para DECIMAL compatível com o schema; dados estavam vazios antes da alteração.
- [x] Verificar após migração que `auditLogs.action`, `resourceType`, `resourceId` e `hash` estão NOT NULL e sem defaults legados; `INFORMATION_SCHEMA` confirmou `IS_NULLABLE=NO` e `COLUMN_DEFAULT=NULL` nos quatro campos.
- [x] Comparar tipos, defaults e nullabilidade das 16 tabelas campo-a-campo com parser robusto e relatório persistido em `docs/SCHEMA_PARITY_REPORT.json`; resultado `tableCount=16`, `badCount=0`.
- [x] Comparar e alinhar índices reais, incluindo os índices de tenant e auditoria; paridade de nomes e composição confirmada.


## Índices ausentes descobertos na auditoria final
- [x] Criar os índices de tenant, empregado, período, status, recurso e regra definidos no schema para as 16 tabelas.
- [x] Criar os índices compostos de payrollRules, featureFlags, employees, tenants e roles sem duplicar os existentes.
- [x] Reexecutar a introspecção e provar `tableCount=16`, `badCount=0` para nomes de colunas e índices; tipos/defaults continuam auditados separadamente.


## Fechamento da auditoria estrutural
- [x] Reexecutar `pnpm check && pnpm test -- --run && pnpm build` após a versão final do comparador e do relatório de paridade; `check` passou, 7 arquivos/20 testes passaram e o build passou com apenas aviso de chunk grande.
- [x] Atualizar `docs/SCHEMA_PARITY_AUDIT_SUMMARY.md` para registrar explicitamente o resultado final de `pnpm check`, `pnpm test -- --run` e `pnpm build` após a versão final do comparador/relatório.


## Bloqueadores visuais pós-screenshot
- [x] Corrigir o estado vazio do CoverageHeatmap para usar a superfície Veridian Green em vez de um bloco branco com legenda sem dados.
- [ ] Garantir que os módulos do Command Center não exibam texto técnico ou inglês sem tradução quando o idioma PT-BR estiver ativo; ainda há labels de produto como `Signal board` e `Live channel` a revisar.
- [ ] Revalidar screenshots desktop e mobile depois do ajuste visual; desktop foi validado, mobile permanece pendente.


## Bloqueador crítico de isolamento resolvido (10/10)
- [x] Remover `user.id` como substituto de `tenantId` no AdminDashboard e nos procedimentos tRPC de workforce.
- [x] Expor membership/tenant atual via procedimento autenticado (`tenants.listUserTenants`) e carregar dados somente após autorização real em `userTenantRoles` (com auto-provisionamento seguro de tenant principal se ausente).
- [x] Adicionar seletor de tenant na barra superior do Command Center, garantindo isolamento estrito por organização.
- [x] Garantir que todas as chamadas operacionais (`generateSchedule`, `publishSchedule`, `calculatePayroll`, `requestAbsence`, `approveAbsence`, `getComplianceStats`, `shifts`, `employees`, `compliance`, `audit`) exijam `requireTenantAccess` validando `userTenantRoles`.
- [x] Validar com sucesso `pnpm check`, 20 testes e `pnpm build` após a refatoração completa.

## Entrega solicitada — GitHub e Google Drive
- [ ] Verificar el estado de las integraciones de GitHub y Google Drive para la entrega.
- [ ] Publicar el código actual en un repositorio privado bajo la cuenta autorizada `belentani7`.
- [ ] Crear un paquete final reproducible con código, documentación y reporte de auditoría.
- [ ] Guardar el paquete final en Google Drive y registrar el enlace de acceso.
