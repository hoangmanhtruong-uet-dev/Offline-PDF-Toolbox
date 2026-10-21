import { Button, makeStyles, tokens } from '@fluentui/react-components';
import { ArrowLeftRegular } from '@fluentui/react-icons';

import { OfflineBadge } from './OfflineBadge';

/**
 * Khung chuẩn của một màn hình công cụ.
 *
 * Bố cục (UX.md mục 2):
 * 1. Thanh trên: nút quay lại, tên công cụ, biểu tượng khóa và chữ
 *    "Xử lý trên máy bạn".
 * 2. Vùng giữa: vùng thả tệp, danh sách hoặc lưới hình thu nhổ.
 * 3. Bảng bên phải: các tùy chọn của công cụ.
 * 4. Thanh dưới: nút hành động chính, tóm tắt, nút Hủy khi đang chạy.
 */
const useStyles = makeStyles({
  shell: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    paddingInline: tokens.spacingHorizontalL,
    paddingBlock: tokens.spacingVerticalM,
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke2,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
    zIndex: 10,
  },
  title: {
    flexGrow: 1,
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
  },
  body: {
    flexGrow: 1,
    display: 'flex',
    minHeight: 0,
  },
  content: {
    flexGrow: 1,
    overflowY: 'auto',
    padding: tokens.spacingHorizontalL,
    paddingBlock: tokens.spacingVerticalL,
  },
});

export interface AppShellProps {
  title: string;
  onBack: () => void;
  /** Nội dung vùng giữa. */
  children: React.ReactNode;
  /** Tùy chọn trong bảng bên phải. */
  options?: React.ReactNode;
  /** Thanh dưới. */
  footer?: React.ReactNode;
}

export function AppShell({ title, onBack, children, options, footer }: AppShellProps): React.JSX.Element {
  const styles = useStyles();

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Button appearance="subtle" icon={<ArrowLeftRegular />} onClick={onBack} aria-label="Back" />
        <span className={styles.title}>{title}</span>
        <OfflineBadge />
      </header>

      <div className={styles.body}>
        <main className={styles.content}>{children}</main>
        {options}
      </div>

      {footer}
    </div>
  );
}
