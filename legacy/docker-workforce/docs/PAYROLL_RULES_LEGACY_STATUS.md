# `payrollRules`: status legado e critério de ativação

## Status atual

A tabela `payrollRules` faz parte do schema Drizzle do Docker Workforce por compatibilidade com a estrutura legada do banco. Ela contém regras parametrizadas por tenant para conceitos de remuneração, dedução ou isenção, incluindo condição, fórmula, prioridade e estado ativo.

A tabela está **estruturalmente disponível**, mas não deve ser apresentada como motor fiscal oficial enquanto não existir uma camada de interpretação versionada, revisão por responsável de folha e testes de regressão para cada jurisdição. O cálculo atual de pré-folha continua sendo uma **estimativa configurável**, conforme documentado em `payrollService.ts`, e não substitui a validação contábil, fiscal ou a transmissão oficial ao eSocial.

## Critério para ativação operacional

A utilização de `payrollRules` em cálculo produtivo só pode ser habilitada quando quatro condições forem satisfeitas: cada regra possuir `tenantId`, `ruleType`, condição e fórmula validadas; houver versionamento e trilha de auditoria para criação, alteração e ativação; existir aprovação de um responsável autorizado pelo tenant; e a execução estiver coberta por testes determinísticos que comprovem o resultado para remuneração, dedução e isenção.

A ativação deve ocorrer por feature flag ou configuração explícita do tenant, nunca por interpretação automática de registros legados. Regras sem fórmula válida, sem jurisdição declarada ou sem aprovação devem permanecer inativas.

## Limites de conformidade

`payrollRules` não é uma fonte normativa. As regras legais devem continuar versionadas no motor de compliance, com referência a fontes oficiais brasileiras e aos parâmetros aplicáveis. A tabela pode auxiliar a parametrização operacional, mas não pode alterar silenciosamente uma regra legal, criar alíquota fiscal presumida ou gerar um evento eSocial sem validação do fluxo oficial.

## Próximo passo técnico

Quando o produto receber a camada de execução aprovada, ela deverá ler somente regras ativas do tenant, registrar a versão aplicada no `payrollData`, escrever um evento imutável no ledger e permitir a reprodução do cálculo. Até lá, a tabela permanece como **compatibilidade estrutural preparada, porém não ativada como fonte automática de cálculo**.
