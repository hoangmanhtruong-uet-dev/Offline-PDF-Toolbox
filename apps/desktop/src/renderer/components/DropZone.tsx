import { useState } from 'react';
import type { DragEvent } from 'react';

import { Button, makeStyles, shorthands, tokens } from '@fluentui/react-components';

import type { FileMeta } from '@shared/types';

import { gradients } from '../styles/tokens';
import { useI18n } from '../i18n';

/**
 * Vùng thả tệp.
 *
 * Kéo thả là cách bắt đầu nhanh nhất: thả tệp PDF vào cửa sổ là bắt đầu
 * làm việc, không cần tạo tài khoản, không cần đăng nhập (đặc tả mục 3).
 */
const useStyles = makeStyles({
  zone: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingVerticalM,
    paddingBlock: '56px',
    paddingInline: tokens.spacingHorizontalXXL,
    borderRadius: '28px',
    ...shorthands.border('2px', 'dashed', tokens.colorBrandStroke1),
    backgroundImage: gradients.brandSoft,
    backgroundColor: tokens.colorNeutralBackground1,
    cursor: 'pointer',
    transitionProperty: 'border-color, background-color, transform, box-shadow',
    transitionDuration: '220ms',
    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    textAlign: 'center',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 16px 40px rgba(124, 58, 237, 0.18)',
    },
  },
  active: {
    transform: 'scale(1.02)',
    backgroundColor: tokens.colorBrandBackground2,
    boxShadow: '0 20px 50px rgba(124, 58, 237, 0.3)',
  },
  emoji: {
    fontSize: '44px',
    lineHeight: 1,
    animationName: 'floaty',
    animationDuration: '3s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'ease-in-out',
  },
  title: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightBold,
    letterSpacing: '-0.02em',
    color: tokens.colorNeutralForeground1,
  },
  hint: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground3,
  },
});

export interface DropZoneProps {
  onFiles: (metas: FileMeta[]) => void;
  title?: string;
  hint?: string;
  buttonLabel?: string;
  /** Cho phép thả nhiều tệp cùng lúc. */
  multiple?: boolean;
  compact?: boolean;
  /** Định dạng được chấp nhận. */
  accept?: 'pdf' | 'image' | 'any';
}

/** Phần mở rộng tệp theo định dạng được chấp nhận. */
const EXTENSIONS: Record<'pdf' | 'image' | 'any', string[]> = {
  pdf: ['pdf'],
  image: ['jpg', 'jpeg', 'png', 'tif', 'tiff', 'bmp'],
  any: [],
};

export function DropZone({
  onFiles,
  title,
  hint,
  buttonLabel,
  multiple = true,
  compact = false,
  accept = 'pdf',
}: DropZoneProps): React.JSX.Element {
  const styles = useStyles();
  const { t } = useI18n();
  const [dragging, setDragging] = useState(false);

  /** Chỉ giữ lại tệp đúng định dạng được chấp nhận. */
  const filterByKind = (metas: FileMeta[]): FileMeta[] => {
    const allowed = EXTENSIONS[accept];
    if (allowed.length === 0) return metas;
    return metas.filter((meta) => allowed.includes(meta.ext.toLowerCase()));
  };

  const pickFiles = async (): Promise<void> => {
    const metas = (await window.optb.files.pick(accept)) as FileMeta[];
    const selected = filterByKind(metas);
    const limited = multiple ? selected : selected.slice(0, 1);
    if (limited.length > 0) onFiles(limited);
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>): Promise<void> => {
    event.preventDefault();
    setDragging(false);

    const files = Array.from(event.dataTransfer.files);
    const paths = files
      .map((file) => {
        try {
          return window.optb.files.getPathForFile(file);
        } catch {
          return '';
        }
      })
      .filter((path) => path.length > 0);

    if (paths.length === 0) return;

    const metas = filterByKind((await window.optb.files.stat(paths)) as FileMeta[]);
    const selected = multiple ? metas : metas.slice(0, 1);
    if (selected.length > 0) onFiles(selected);
  };

  return (
    <div
      className={`${styles.zone} ${dragging ? styles.active : ''}`}
      data-testid="drop-zone"
      onClick={() => void pickFiles()}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          void pickFiles();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => void handleDrop(event)}
      role="button"
      tabIndex={0}
      style={compact ? { paddingBlock: tokens.spacingVerticalXL } : undefined}
    >
      <span className={styles.emoji} aria-hidden="true">📄</span>
      <span className={styles.title}>{title ?? t('home.dropTitle')}</span>
      <span className={styles.hint}>{hint ?? t('home.dropHint')}</span>
      <Button appearance="primary" shape="circular" size="large" onClick={(event) => { event.stopPropagation(); void pickFiles(); }}>
        {buttonLabel ?? t('home.browse')}
      </Button>
    </div>
  );
}
