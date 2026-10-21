import { useEffect } from 'react';

import { useI18n } from '../i18n';
import { TOOLS } from '../features/tools/tools';

/**
 * Phím tắt toàn cục.
 *
 * - `Ctrl+O`: mở hộp thoại chọn tệp.
 * - `Ctrl+1` … `Ctrl+6`: mở công cụ tương ứng theo thứ tự trên màn hình chính.
 * - `Ctrl+,`: mở Cài đặt.
 *
 * Phím tắt chỉ hoạt động khi người dùng không đang gõ trong ô nhập.
 */
export function useShortcuts(handlers: {
  onOpenFiles: () => void;
  onOpenTool: (toolId: string) => void;
  onOpenSettings: () => void;
}): void {
  const { t } = useI18n();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (!event.ctrlKey || event.altKey || event.metaKey) return;

      const target = event.target as HTMLElement | null;
      const isTyping =
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);
      if (isTyping) return;

      if (event.key === 'o' || event.key === 'O') {
        event.preventDefault();
        handlers.onOpenFiles();
        return;
      }

      if (event.key === ',') {
        event.preventDefault();
        handlers.onOpenSettings();
        return;
      }

      const index = Number.parseInt(event.key, 10);
      if (Number.isInteger(index) && index >= 1 && index <= TOOLS.length) {
        event.preventDefault();
        const tool = TOOLS[index - 1];
        if (tool) handlers.onOpenTool(tool.id);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // `t` không dùng trong nội dung hàm, chỉ để ghi nhớ chuỗi phím tắt.
  }, [handlers, t]);
}
