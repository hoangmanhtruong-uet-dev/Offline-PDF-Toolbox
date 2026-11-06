import { Button, makeStyles, tokens } from '@fluentui/react-components';
import { ArrowLeftRegular } from '@fluentui/react-icons';

import { appTokens } from '../styles/tokens';
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
    backgroundColor: 'transparent',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    marginInline: tokens.spacingHorizontalL,
    marginBlockStart: tokens.spacingVerticalM,
    paddingInline: tokens.spacingHorizontalM,
    paddingBlock: tokens.spacingVerticalS,
    borderRadius: appTokens.radius.xl,
    backgroundColor: 'color-mix(in srgb, var(--colorNeutralBackground1) 74%, transparent)',
    backdropFilter: 'blur(18px) saturate(160%)',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    boxShadow: appTokens.shadow.md,
    zIndex: 10,
  },
  title: {
    flexGrow: 1,
    fontSize: appTokens.fontSize.lg,
    fontWeight: appTokens.fontWeight.bold,
    letterSpacing: '-0.02em',
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
    animationName: 'fadeIn',
    animationDuration: '260ms',
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
        <Button appearance="subtle" shape="circular" icon={<ArrowLeftRegular />} onClick={onBack} aria-label="Back" />
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
