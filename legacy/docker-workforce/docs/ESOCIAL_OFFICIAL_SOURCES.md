# Fontes oficiais eSocial usadas na reauditora

A implementação não deve afirmar transmissão oficial ao eSocial sem credenciais, certificado digital, ambiente configurado e validação contra os leiautes/XSD vigentes.

## Fontes consultadas

- Portal de documentação técnica do eSocial: https://www.gov.br/esocial/pt-br/documentacao-tecnica
- Manual de Orientação do eSocial Simplificado S-1.3, consolidado até a NO S-1.3 07/2026: https://www.gov.br/esocial/pt-br/documentacao-tecnica/manuais/mos-s-1-3-consolidada-ate-a-no-s-1-3-07-2026.pdf
- Manual eSocial Web Geral — Empresas: https://www.gov.br/esocial/pt-br/empresas/manual-web-geral

## Fatos confirmados na documentação oficial

O Portal gov.br publica notas técnicas e notas orientativas que alteram leiautes e regras do eSocial. A versão vigente deve ser configurada e revisada antes de qualquer transmissão.

O Manual Web Geral descreve o eSocial como um sistema de unificação, validação, armazenamento e distribuição de informações fiscais, previdenciárias e trabalhistas. O módulo Web Geral é uma ferramenta auxiliar para contingência e não substitui o sistema próprio da empresa.

O Manual Web Geral lista o S-1200 como evento de remuneração de trabalhador vinculado ao Regime Geral de Previdência Social e o S-2299 como evento de desligamento. O Docker Workforce mantém esses eventos como rascunhos versionados e validação local; a etapa de transmissão permanece deliberadamente bloqueada até haver certificado, ambiente, leiaute/XSD e credenciais oficiais configurados.

## Limite de conformidade

As regras de jornada do motor não podem ser descritas como parecer jurídico. Cada tenant deve parametrizar jurisdição, convenção coletiva, jornada contratual e regras internas, e a implantação deve ser revisada por profissional trabalhista/contábil brasileiro. A fonte oficial do eSocial não é uma autorização para enviar eventos automaticamente.
