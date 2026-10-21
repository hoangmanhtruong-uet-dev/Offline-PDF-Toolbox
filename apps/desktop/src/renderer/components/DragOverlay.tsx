import { useEffect, useState } from 'react';

import { makeStyles, tokens } from '@fluentui/react-components';
import { ArrowUploadRegular } from '@fluentui/react-icons';

import { useI18n } from '../i18n';
import { appTokens } from '../styles/tokens';

/**
 * Lớp phủ hiện khi kéo tệp vào cửa sổ.
 *
 * Lớp phủ **không chặn sự kiện** (`pointer-events: none`) nên tệp thả vào
 * vẫn tới đúng vùng thả bên dưới.
 */
const useStyles = makeStyles({
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    backgroundColor: 'rgba(11, 92, 171, 0.12)',
    ...{
      borderTopWidth: '3px',
      borderRightWidth: '3px',
      borderBottomWidth: '3px',
      borderLeftWidth: '3px',
      borderTopStyle: 'solid',
      borderRightStyle: 'solid',
      borderBottomStyle: 'solid',
      borderLeftStyle: 'solid',
      borderTopColor: tokens.colorBrandStroke1,
      borderRightColor: tokens.colorBrandStroke1,
      borderBottomColor: tokens.colorBrandStroke1,
      borderLeftColor: tokens.colorBrandStroke1,
    },
  },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: appTokens.spacing.m,
    paddingBlock: appTokens.spacing.xl,
    paddingInline: appTokens.spacing.xxl,
    borderRadius: appTokens.radius.lg,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: appTokens.shadow.overlay,
  },
  icon: {
    fontSize: '40px',
    color: tokens.colorBrandForeground1,
  },
  title: {
    fontSize: appTokens.fontSize.lg,
    fontWeight: appTokens.fontWeight.semibold,
    color: tokens.colorNeutralForeground1,
  },
  hint: {
    fontSize: appTokens.fontSize.base,
    color: tokens.colorNeutralForeground2,
  },
});

/** Định dạng tệp mà ứng dụng nhận. */
const ACCEPTED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'tif', 'tiff', 'bmp'];

export function DragOverlay(): React.JSX.Element | null {
  const styles = useStyles();
  const { t } = useI18n();
  const [dragging, setDragging] = useState(false);
  const [accepted, setAccepted] = useState(true);

  useEffect(() => {
    let depth = 0;

    const hasFiles = (event: DragEvent): boolean =>
      Array.from(event.dataTransfer?.types ?? []).includes('Files');

    const onDragEnter = (event: DragEvent): void => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth += 1;
      setDragging(true);
    };

    const onDragOver = (event: DragEvent): void => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    };

    const onDragLeave = (event: DragEvent): void => {
      if (!hasFiles(event)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragging(false);
    };

    const onDrop = (event: DragEvent): void => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth = 0;
      setDragging(false);
    };

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);

    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, []);

  // Kiểm tra phần mở rộng của tệp đang kéo để báo đúng thông báo.
  useEffect(() => {
    const onDragOver = (event: DragEvent): void => {
      const items = event.dataTransfer?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.kind !== 'file') continue;
        const name = item.getAsFile()?.name ?? '';
        const extension = name.split('.').pop()?.toLowerCase() ?? '';
        if (name && !ACCEPTED_EXTENSIONS.includes(extension)) {
          setAccepted(false);
          return;
        }
      }
      setAccepted(true);
    };

    window.addEventListener('dragover', onDragOver);
    return () => window.removeEventListener('dragover', onDragOver);
  }, []);

  if (!dragging) return null;

  return (
    <div className={styles.overlay} data-testid="drag-overlay">
      <div className={styles.panel}>
        <ArrowUploadRegular className={styles.icon} />
        <span className={styles.title}>
          {accepted ? t('home.dropTitle') : t('home.dropUnsupported')}
        </span>
        <span className={styles.hint}>
          {accepted ? t('home.dropHint') : t('home.dropSupportedFormats')}
        </span>
      </div>
    </div>
  );
}
