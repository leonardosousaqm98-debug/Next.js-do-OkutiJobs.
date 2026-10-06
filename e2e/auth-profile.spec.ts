import { test, expect, type Page } from "@playwright/test";

const candidateEmail = process.env.E2E_CANDIDATE_EMAIL;
const candidatePassword = process.env.E2E_CANDIDATE_PASSWORD;
const runRegistration = process.env.E2E_RUN_REGISTRATION === "1";

async function login(page: Page, email: string, password: string) {
  await page.goto("/login?next=%2Fcandidato");
  await expect(page.locator('input[type="email"]').first()).toBeVisible();
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.getByRole("button", { name: /entrar na conta|iniciar sessão|entrar/i }).click();
  await page.waitForURL(/\/(candidato|empresa|dashboard)/, { timeout: 30_000 });
}

test.describe("autenticação e perfil internacional", () => {
  test("regista uma conta de candidato e entra no painel", async ({ page }) => {
    test.skip(!runRegistration, "Defina E2E_RUN_REGISTRATION=1 para criar uma conta de QA única.");
    const unique = Date.now();
    const email = `qa-candidate-${unique}@example.test`;
    const password = `QaProfile-${unique}!`;

    await page.goto("/login");
    await page.getByRole("tab", { name: "Criar conta" }).click();
    await page.getByRole("button", { name: /candidato/i }).click();
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').first().fill(password);
    await page.locator('input[type="password"]').nth(1).fill(password);
    await page.getByRole("button", { name: /criar a minha conta/i }).click();

    await page.waitForURL(/\/candidato/, { timeout: 30_000 });
    await expect(page.getByText(/verificação de email pendente/i)).toBeVisible();
  });

  test("edita e guarda dados essenciais do CV internacional", async ({ page }) => {
    test.skip(!candidateEmail || !candidatePassword, "Defina E2E_CANDIDATE_EMAIL e E2E_CANDIDATE_PASSWORD.");
    await login(page, candidateEmail!, candidatePassword!);
    await page.goto("/profile");
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByText(/CV internacional/i).first()).toBeVisible({ timeout: 30_000 });

    const fullName = page.getByLabel(/Nome completo/i).first();
    await expect(fullName).toBeVisible({ timeout: 30_000 });
    await fullName.fill("Candidato QA OkutiJobs");
    await page.locator("label").filter({ hasText: "País de residência" }).locator("select").selectOption("AO");
    await page.locator("label").filter({ hasText: "Província / estado" }).locator("select").selectOption({ label: "Luanda" });
    await page.locator("label").filter({ hasText: "Cidade" }).locator("select").selectOption({ label: "Luanda" });
    await page.getByLabel(/Resumo profissional/i).fill("Profissional de QA a validar o fluxo internacional de perfil, competências e oportunidades.");

    await page.getByRole("button", { name: /mobilidade e revisão/i }).click();
    await page.getByRole("button", { name: /guardar cv internacional/i }).click();
    await expect(page.getByText(/guardado|alterações guardadas/i)).toBeVisible({ timeout: 30_000 });

    const saved = await page.request.get("/api/profile");
    expect(saved.ok()).toBeTruthy();
    const data = await saved.json();
    expect(data.candidate?.full_name ?? data.profile?.fullName).toBeTruthy();
  });
});
