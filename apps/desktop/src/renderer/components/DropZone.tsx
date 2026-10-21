import { useState } from 'react';
import type { DragEvent } from 'react';

import { Button, makeStyles, shorthands, tokens } from '@fluentui/react-components';

import type { FileMeta } from '@shared/types';

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
    paddingBlock: tokens.spacingVerticalXXL,
    paddingInline: tokens.spacingHorizontalXXL,
    borderRadius: tokens.borderRadiusXLarge,
    ...shorthands.border('2px', 'dashed', tokens.colorNeutralStroke2),
    backgroundColor: tokens.colorNeutralBackground1,
    cursor: 'pointer',
    transitionProperty: 'border-color, background-color',
    transitionDuration: '120ms',
    textAlign: 'center',
  },
  active: {
    borderTopColor: tokens.colorBrandStroke1,
    borderRightColor: tokens.colorBrandStroke1,
    borderBottomColor: tokens.colorBrandStroke1,
    borderLeftColor: tokens.colorBrandStroke1,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  title: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
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
      <span className={styles.title}>{title ?? t('home.dropTitle')}</span>
      <span className={styles.hint}>{hint ?? t('home.dropHint')}</span>
      <Button appearance="primary" onClick={(event) => { event.stopPropagation(); void pickFiles(); }}>
        {buttonLabel ?? t('home.browse')}
      </Button>
    </div>
  );
}
