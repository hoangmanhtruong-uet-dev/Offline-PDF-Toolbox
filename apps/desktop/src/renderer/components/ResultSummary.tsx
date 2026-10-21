import { Button, MessageBar, MessageBarBody, MessageBarTitle, makeStyles, tokens } from '@fluentui/react-components';
import { CheckmarkCircleRegular } from '@fluentui/react-icons';

import { useI18n } from '../i18n';

/**
 * Tóm tắt kết quả sau khi tác vụ thành công.
 *
 * Ba nút theo đặc tả: Mở tệp, Mở thư mục, Làm việc khác.
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
  icon: {
    fontSize: tokens.fontSizeBase500,
    color: tokens.colorPaletteGreenForeground2,
  },
  summary: {
    flexGrow: 1,
    fontWeight: tokens.fontWeightSemibold,
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
  },
});

export interface ResultSummaryProps {
  /** Đường dẫn tệp đầu ra đầu tiên. */
  outputPath: string;
  /** Tất cả đường dẫn tệp đầu ra, dùng cho tách nhiều tệp. */
  outputPaths?: string[];
  /** Thư mục chứa tệp đầu ra. */
  outputDirectory: string;
  /** Số trang của tệp đầu ra. */
  pageCount?: number;
  /** Nội dung tóm tắt thêm, ví dụ số tệp bị bỏ qua. */
  note?: string;
  onDismiss: () => void;
}

export function ResultSummary({
  outputPath,
  outputPaths,
  outputDirectory,
  pageCount,
  note,
  onDismiss,
}: ResultSummaryProps): React.JSX.Element {
  const styles = useStyles();
  const { t } = useI18n();

  return (
    <div
      className={styles.bar}
      data-testid="result-summary"
      data-output-path={outputPath}
      data-output-paths={JSON.stringify(outputPaths ?? [outputPath])}
    >
      <CheckmarkCircleRegular className={styles.icon} />
      <span className={styles.summary}>
        {t('tasks.saved', { pages: pageCount ?? 0 })}
        {note ? ` · ${note}` : ''}
      </span>

      <span className={styles.actions}>
        <Button appearance="primary" onClick={() => void window.optb.files.reveal(outputPath)}>
          {t('shell.openFile')}
        </Button>
        <Button onClick={() => void window.optb.files.reveal(outputDirectory)}>
          {t('shell.openFolder')}
        </Button>
        <Button appearance="subtle" onClick={onDismiss}>
          {t('shell.continue')}
        </Button>
      </span>
    </div>
  );
}

/**
 * Cảnh báo lỗi của tác vụ.
 *
 * Thông báo luôn nói về việc người dùng cần làm, kèm danh sách tệp liên quan
 * nếu có.
 */
export function TaskErrorBanner({
  messageKey,
  files,
  onDismiss,
}: {
  messageKey: string;
  files?: string[];
  onDismiss: () => void;
}): React.JSX.Element {
  const { t } = useI18n();

  return (
    <MessageBar intent="error" data-testid="task-error">
      <MessageBarTitle>{t('errors.title')}</MessageBarTitle>
      <MessageBarBody>
        {t(messageKey as Parameters<typeof t>[0])}
        {files && files.length > 0 ? (
          <ul style={{ margin: '4px 0 0', paddingInlineStart: '20px' }}>
            {files.map((file) => (
              <li key={file}>{file}</li>
            ))}
          </ul>
        ) : null}
      </MessageBarBody>
      <Button appearance="subtle" size="small" onClick={onDismiss}>
        {t('common.close')}
      </Button>
    </MessageBar>
  );
}
