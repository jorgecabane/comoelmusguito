import { expect, test as setup } from '@playwright/test';
import { USERS } from './fixtures';
import { login } from './helpers/ui';

for (const role of ['customer', 'buyer'] as const) {
  setup(`login ${role}`, async ({ page }) => {
    const user = USERS[role];
    await login(page, user.email, user.password);
    await expect(page).toHaveURL(/\/mi-cuenta/);
    await expect(page.getByRole('heading', { name: `Hola, ${user.name}` })).toBeVisible();
    await page.context().storageState({ path: `.auth/${role}.json` });
  });
}
