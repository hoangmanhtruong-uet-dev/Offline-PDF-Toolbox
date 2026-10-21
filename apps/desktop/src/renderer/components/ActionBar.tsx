import { Button, ProgressBar, makeStyles, tokens } from '@fluentui/react-components';

import { useI18n } from '../i18n';

/**
 * Thanh dưới của màn hình công cụ.
 *
 * Quy tắc: nút hành động chính là **một nút duy nhất**, có màu nhấn. Bên cạnh
 * là thông tin tóm tắt ("3 tệp, 42 trang") và nút Hủy khi đang chạy.
 */
const useStyles = makeStyles({
  bar: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalL,
    padding: tokens.spacingVerticalM,
    paddingInline: tokens.spacingHorizontalL,
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke2,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  summary: {
    flexGrow: 1,
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase300,
  },
  progress: {
    flexGrow: 1,
  },
});

export interface ActionBarProps {
  actionLabel: string;
  onAction: () => void;
  /** Tắt nút hành động chính, ví dụ khi chưa có tệp nào. */
  disabled?: boolean;
  /** Đang chạy: hiện tiến độ và nút Hủy. */
  running?: boolean;
  progressPercent?: number;
  onCancel?: () => void;
  summary?: string;
}

export function ActionBar({
  actionLabel,
  onAction,
  disabled = false,
  running = false,
  progressPercent = 0,
  onCancel,
  summary,
}: ActionBarProps): React.JSX.Element {
  const styles = useStyles();
  const { t } = useI18n();

  if (running) {
    return (
      <footer className={styles.bar} data-testid="action-bar">
        <ProgressBar className={styles.progress} value={progressPercent} />
        <span className={styles.summary}>{Math.round(progressPercent)}%</span>
        <Button appearance="secondary" onClick={onCancel}>
          {t('shell.cancel')}
        </Button>
      </footer>
    );
  }

  return (
    <footer className={styles.bar} data-testid="action-bar">
      <Button appearance="primary" onClick={onAction} disabled={disabled} data-testid="primary-action">
        {actionLabel}
      </Button>
      {summary ? <span className={styles.summary}>{summary}</span> : null}
    </footer>
  );
}
