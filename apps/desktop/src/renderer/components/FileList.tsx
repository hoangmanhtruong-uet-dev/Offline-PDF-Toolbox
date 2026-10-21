import { Button, Spinner, Text, makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { ArrowDownRegular, ArrowUpRegular, DismissRegular } from '@fluentui/react-icons';

import type { FileEntry } from '@shared/types';

import { useErrorMessage, useI18n } from '../i18n';

/**
 * Danh sách tệp của công cụ.
 *
 * Mỗi dòng có tên, số trang, dung lượng, hình thu nhổ trang đầu; có nút xóa
 * và nút di chuyển lên/xuống để dùng được bằng bàn phím (F-01, F-04).
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
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
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
}

export function FileList({ files, onRemove, onMove }: FileListProps): React.JSX.Element {
  const styles = useStyles();
  const { t, formatBytes } = useI18n();
  const errorText = useErrorMessage();

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
        <li key={file.id} className={styles.row} data-testid="file-row">
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
              </span>
            )}
          </span>

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
