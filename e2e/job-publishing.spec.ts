import { test, expect, type Page, type BrowserContext } from "@playwright/test";

const companyEmail = process.env.E2E_COMPANY_EMAIL;
const companyPassword = process.env.E2E_COMPANY_PASSWORD;
const candidateEmail = process.env.E2E_CANDIDATE_EMAIL;
const candidatePassword = process.env.E2E_CANDIDATE_PASSWORD;

test.skip(!companyEmail || !companyPassword, "Defina E2E_COMPANY_EMAIL e E2E_COMPANY_PASSWORD para executar o teste real.");

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  const emailInput = page.locator('input[type="email"]').first();
  await expect(emailInput).toBeVisible();
  await emailInput.fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.getByRole("button", { name: /iniciar sessão|entrar|continuar/i }).last().click();
  await page.waitForURL(/\/(empresa|candidato|admin)/, { timeout: 30_000 });
}

async function getJson(page: Page, path: string) {
  const response = await page.request.get(path);
  expect(response.ok(), `${path} devolveu ${response.status()}`).toBeTruthy();
  return response.json();
}

test("IA preenche, publica uma vaga e executa o matching automático", async ({ page }) => {
  // A página de criação é renderizada antes da hidratação da sessão; autenticar
  // explicitamente evita que o POST chegue ao servidor sem o cookie Supabase.
  await login(page, companyEmail!, companyPassword!);
  await page.goto("/empresa/vagas/nova");
  await expect(page.getByRole("heading", { name: /Encontre a pessoa certa/i })).toBeVisible();
  await expect(page.getByText("É necessário iniciar sessão.")).toHaveCount(0);

  const uniqueTitle = `Teste E2E — Especialista de Recrutamento ${Date.now()}`;
  const aiBrief = `Criar uma vaga para ${uniqueTitle}, em Luanda, Angola, presencial, contrato a tempo inteiro. Procuramos uma pessoa com licenciatura, 3 anos de experiência, Excel e inglês. Disponibilidade imediata.`;
  await page.getByPlaceholder(/briefing|ex\.: procuramos/i).fill(aiBrief);
  await page.getByRole("button", { name: /preencher com ia/i }).click();
  await expect(page.getByText(/IA preencheu|preenchimento automático/i).last()).toBeVisible({ timeout: 90_000 });

  const title = page.locator('input[list="job-titles"]');
  await title.fill(uniqueTitle);
  await page.getByLabel(/descrição/i).last().fill(`Descrição oficial da vaga ${uniqueTitle}. A pessoa seleccionada irá apoiar a equipa de recrutamento e acompanhar processos de talento.`);
  await page.getByLabel(/requisitos/i).last().fill("Licenciatura, 3 anos de experiência, Excel, Inglês e disponibilidade imediata.");
  await page.getByLabel(/província/i).selectOption({ label: "Luanda" });
  await page.getByLabel(/cidade/i).selectOption({ label: "Luanda" });

  let publishPayload: any = null;
  page.on("response", async (response) => {
    if (response.url().endsWith("/api/jobs") && response.request().method() === "POST") {
      publishPayload = await response.json().catch(() => null);
    }
  });
  await page.getByRole("button", { name: /publicar vaga/i }).click();
  await expect(page.getByText(/vaga publicada com sucesso/i)).toBeVisible({ timeout: 30_000 });
  expect(publishPayload?.ok).toBeTruthy();
  expect(publishPayload?.job?.status).toBe("published");
  expect(publishPayload?.matching).toBeTruthy();

  const feed = await getJson(page, `/api/jobs?q=${encodeURIComponent(uniqueTitle)}`);
  expect(feed.jobs.some((job: any) => job.title === uniqueTitle)).toBeTruthy();

  if (process.env.E2E_EXPECT_MATCH === "1") {
    expect(publishPayload.matching.matches).toBeGreaterThan(0);
    expect(publishPayload.matching.notificationsSent).toBeGreaterThan(0);
  }
  if (process.env.E2E_EXPECT_EMAIL === "1") {
    expect(publishPayload.matching.emailsAttempted).toBeGreaterThan(0);
  }
});

test("o candidato autenticado recebe a notificação de matching", async ({ browser }) => {
  test.skip(!candidateEmail || !candidatePassword, "Defina E2E_CANDIDATE_EMAIL e E2E_CANDIDATE_PASSWORD para validar a notificação.");
  const context: BrowserContext = await browser.newContext();
  const page = await context.newPage();
  await login(page, candidateEmail!, candidatePassword!);
  const data = await getJson(page, "/api/notifications");
  expect(data.notifications).toEqual(expect.arrayContaining([
    expect.objectContaining({ kind: expect.stringMatching(/^job_match_/) }),
  ]));
  await context.close();
});
