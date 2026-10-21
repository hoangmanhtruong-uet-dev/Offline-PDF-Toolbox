import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from '@playwright/test';
import type { Page } from 'playwright';

import { launchApp } from './helpers';

/**
 * Kiểm tra khả năng tiếp cận bằng axe-core.
 *
 * Bắt lỗi tương phản WCAG AA trên giao diện thật, cho cả chủ đề sáng và
 * tối. Bổ sung cho bài kiểm tra ở mức token
 * (`tests/scripts/contrast-check.mjs`), vốn chỉ kiểm tra các cặp màu trong
 * design token.
 *
 * axe được nạp bằng `addInitScript` (chèn ở tầng debugger) vì CSP của ứng
 * dụng cấm inline script — đúng như thiết kế bảo mật.
 */

/** Nạp mã axe-core từ node_modules (npm workspaces đặt ở thư mục gốc). */
const AXE_SOURCE = readFileSync(
  join(process.cwd(), '..', '..', 'node_modules', 'axe-core', 'axe.min.js'),
  'utf8',
);

/** Kết quả vi phạm của axe. */
interface AxeViolation {
  id: string;
  impact: string | null;
  nodes: unknown[];
}

/**
 * Quy tắc `aria-hidden-focus` bị tắt vì Fluent UI (Tabster) tự chèn các
 * phần tử giữ chỗ cho quản lý tiêu điểm: chúng có `aria-hidden="true"` nhưng
 * vẫn `tabindex="0"`. Đây là chi tiết bên trong thư viện, không phải nội
 * dung của ứng dụng — nên bù lại bằng kiểm tra riêng ở dưới.
 */
const AXE_OPTIONS = {
  runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
  rules: { 'aria-hidden-focus': { enabled: false } },
};

/** Chỉ giữ lỗi nghiêm trọng, vì đó là loại người dùng thật sự bị chặn. */
function serious(violations: AxeViolation[]): string[] {
  return violations
    .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
    .map((violation) => `${violation.id} (${violation.nodes.length} noi dung)`);
}

/** Nạp axe vào trang rồi chạy kiểm tra. */
async function runAxe(page: Page): Promise<AxeViolation[]> {
  const results = await page.evaluate(async (options) => {
    const axe = (
      window as unknown as {
        axe: { run: (context: unknown, opts: unknown) => Promise<{ violations: AxeViolation[] }> };
      }
    ).axe;
    return axe.run(document, options);
  }, AXE_OPTIONS);

  return results.violations;
}

/**
 * Kiểm tra riêng: không phần tử `aria-hidden` nào của **ứng dụng** chứa thành
 * phần tử có thể nhận tiêu điểm.
 *
 * Bổ sung cho quy tắc bị tắt ở trên, và chỉ bỏ qua các phần tử giữ chỗ
 * `data-tabster-dummy` của Fluent.
 */
async function findHiddenFocusable(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const focusable = 'a[href], button, input, select, textarea, [tabindex]';
    const problems: string[] = [];

    for (const element of Array.from(
      document.querySelectorAll('[aria-hidden="true"]:not([data-tabster-dummy])'),
    )) {
      const inner = element.querySelector(focusable);
      if (inner) {
        problems.push(
          `${element.tagName.toLowerCase()}.${element.className || '(khong co class)'} chua ${inner.tagName.toLowerCase()}`,
        );
      }
    }

    return problems;
  });
}

/** Điều hướng tới một màn hình và chờ nó hiện. */
async function goto(page: Page, hash: string, ready: () => Promise<unknown>): Promise<void> {
  await page.evaluate((target) => {
    window.location.hash = target;
  }, hash);
  await ready();
  await page.waitForTimeout(400);
}

test.describe('Khả năng tiếp cận (WCAG AA)', () => {
  for (const theme of ['light', 'dark'] as const) {
    test(`màn hình chính đạt WCAG AA ở chủ đề ${theme}`, async () => {
      const { app, page } = await launchApp();

      try {
        await page.getByTestId('tool-grid').waitFor();
        await page.evaluate(async (selected) => {
          await window.optb.settings.update({ theme: selected });
        }, theme);

        await page.addInitScript({ content: AXE_SOURCE });
        await page.reload();
        await page.getByTestId('tool-grid').waitFor();
        await page.waitForTimeout(500);

        expect(serious(await runAxe(page))).toEqual([]);
        expect(await findHiddenFocusable(page)).toEqual([]);
      } finally {
        await app.close();
      }
    });

    test(`màn hình Cài đặt đạt WCAG AA ở chủ đề ${theme}`, async () => {
      const { app, page } = await launchApp();

      try {
        await page.getByTestId('tool-grid').waitFor();
        await page.evaluate(async (selected) => {
          await window.optb.settings.update({ theme: selected });
        }, theme);

        await page.addInitScript({ content: AXE_SOURCE });
        await page.reload();
        await page.getByTestId('tool-grid').waitFor();

        await goto(page, '#/settings', async () => {
          await page.getByRole('heading', { level: 1 }).waitFor();
        });

        expect(serious(await runAxe(page))).toEqual([]);
        expect(await findHiddenFocusable(page)).toEqual([]);
      } finally {
        await app.close();
      }
    });
  }
});
