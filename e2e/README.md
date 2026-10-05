# Teste end-to-end do fluxo de vagas

O teste `job-publishing.spec.ts` cobre:

1. Entrada numa conta empresarial.
2. Preenchimento automático do anúncio através da IA.
3. Revisão dos campos e publicação da vaga.
4. Execução automática do matching após publicação.
5. Confirmação de que a vaga aparece no feed.
6. Consulta das notificações na conta do candidato.

As credenciais nunca ficam no código. Para execução local:

```bash
export E2E_BASE_URL=https://www.okutijobs.com
export E2E_COMPANY_EMAIL='conta-empresarial-de-teste'
export E2E_COMPANY_PASSWORD='palavra-passe-da-conta-de-teste'
export E2E_CANDIDATE_EMAIL='conta-candidato-de-teste'
export E2E_CANDIDATE_PASSWORD='palavra-passe-da-conta-de-teste'
pnpm exec playwright install chromium
pnpm test:e2e
```

O workflow manual `.github/workflows/e2e-job-flow.yml` usa os mesmos nomes como **GitHub Actions Secrets**. Por segurança, `E2E_EXPECT_EMAIL` fica desactivado por defeito: a validação do email deve usar uma caixa de teste controlada e uma confirmação explícita do endereço destinatário.
