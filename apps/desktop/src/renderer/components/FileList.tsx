import { useState } from 'react';

import {
  Button,
  Input,
  Spinner,
  Text,
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import { ArrowDownRegular, ArrowUpRegular, DismissRegular } from '@fluentui/react-icons';

import type { FileEntry } from '@shared/types';

import { useErrorMessage, useI18n } from '../i18n';

/**
 * Danh sách tệp của công cụ.
 *
 * Mỗi dòng có tên, số trang, dung lượng, hình thu nhổ trang đầu; có nút xóa
 * và nút di chuyển lên/xuống để dùng được bằng bàn phím (F-01, F-04).
 *
 * Với công cụ gộp, mỗi dòng có thêm ô dải trang để chọn trang của riêng tệp
 * đó.
 */
const useStyles = makeStyles({
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    listStyleType: 'none',
    margin: 0,
    padding: 0,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalS,
    paddingInline: tokens.spacingHorizontalM,
    borderRadius: '10px',
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
    transitionProperty: 'border-color, box-shadow, transform',
    transitionDuration: '150ms',
    ':hover': {
      ...shorthands.borderColor(tokens.colorBrandStroke1),
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    },
  },
  dragging: {
    opacity: 0.5,
    ...shorthands.border('1px', 'solid', tokens.colorBrandStroke1),
  },
  thumbnail: {
    width: '48px',
    height: '64px',
    flexShrink: 0,
    borderRadius: tokens.borderRadiusSmall,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    backgroundColor: tokens.colorNeutralBackground3,
    objectFit: 'cover',
  },
  placeholder: {
    width: '48px',
    height: '64px',
    flexShrink: 0,
    borderRadius: tokens.borderRadiusSmall,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  info: {
    flexGrow: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  name: {
    fontWeight: tokens.fontWeightSemibold,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  meta: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  error: {
    color: tokens.colorPaletteRedForeground2,
    fontSize: tokens.fontSizeBase200,
  },
  range: {
    width: '140px',
    flexShrink: 0,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  empty: {
    padding: tokens.spacingVerticalL,
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
  },
});

export interface FileListProps {
  files: FileEntry[];
  onRemove: (id: string) => void;
  onMove: (from: number, to: number) => void;
  /** Hiện ô nhập dải trang cho từng tệp. */
  showPageRange?: boolean;
  onPageRangeChange?: (id: string, range: string) => void;
  /** Cho phép kéo thả để đổi thứ tự. */
  reorderable?: boolean;
}

export function FileList({
  files,
  onRemove,
  onMove,
  showPageRange = false,
  onPageRangeChange,
  reorderable = false,
}: FileListProps): React.JSX.Element {
  const styles = useStyles();
  const { t, formatBytes } = useI18n();
  const errorText = useErrorMessage();
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  if (files.length === 0) {
    return (
      <Text className={styles.empty} data-testid="file-list-empty">
        {t('files.empty')}
      </Text>
    );
  }

  return (
    <ul className={styles.list} data-testid="file-list">
      {files.map((file, index) => (
        <li
          key={file.id}
          className={`${styles.row} ${draggingIndex === index ? styles.dragging : ''}`}
          data-testid="file-row"
          draggable={reorderable}
          onDragStart={() => setDraggingIndex(index)}
          onDragEnd={() => {
            setDraggingIndex(null);
          }}
          onDragOver={(event) => {
            if (!reorderable) return;
            event.preventDefault();
          }}
          onDrop={(event) => {
            if (!reorderable) return;
            event.preventDefault();
            if (draggingIndex !== null && draggingIndex !== index) {
              onMove(draggingIndex, index);
            }
            setDraggingIndex(null);
          }}
        >
          {file.thumbnail ? (
            <img className={styles.thumbnail} src={file.thumbnail} alt="" />
          ) : (
            <span className={styles.placeholder}>
              {file.state === 'reading' ? <Spinner size="tiny" /> : 'PDF'}
            </span>
          )}

          <span className={styles.info}>
            <span className={styles.name} title={file.path}>
              {file.name}
            </span>
            {file.state === 'error' ? (
              <span className={styles.error}>{errorText(file.errorCode ?? 'E_UNKNOWN')}</span>
            ) : file.state === 'reading' ? (
              <span className={styles.meta}>{t('files.reading')}</span>
            ) : (
              <span className={styles.meta}>
                {file.pageCount !== null ? `${t('files.pages', { count: file.pageCount })} · ` : ''}
                {formatBytes(file.size)}
                {file.hasSignature ? ` · ${t('files.signed')}` : ''}
              </span>
            )}
          </span>

          {showPageRange ? (
            <Input
              className={styles.range}
              size="small"
              placeholder={t('files.rangePlaceholder')}
              value={file.pageRange ?? ''}
              onChange={(_event, data) => onPageRangeChange?.(file.id, data.value)}
              aria-label={t('files.rangeLabel')}
              data-testid={`range-${file.name}`}
            />
          ) : null}

          <span className={styles.actions}>
            <Button
              appearance="subtle"
              size="small"
              icon={<ArrowUpRegular />}
              disabled={index === 0}
              onClick={() => onMove(index, index - 1)}
              aria-label={t('files.moveUp')}
            />
            <Button
              appearance="subtle"
              size="small"
              icon={<ArrowDownRegular />}
              disabled={index === files.length - 1}
              onClick={() => onMove(index, index + 1)}
              aria-label={t('files.moveDown')}
            />
            <Button
              appearance="subtle"
              size="small"
              icon={<DismissRegular />}
              onClick={() => onRemove(file.id)}
              aria-label={t('files.remove')}
              data-testid={`remove-${file.name}`}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}
