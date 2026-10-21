import type { ReactNode } from 'react';

import { makeStyles, tokens } from '@fluentui/react-components';

import { appTokens } from '../styles/tokens';

/**
 * Tiêu đề trang dùng phần tử heading thật.
 *
 * `Title2`/`Title3` của Fluent UI hiển thị đúng kiểu chữ nhưng lại render
 * thành `<span>`, khiến trình đọc màn hình không nhận ra đâu là tiêu đề.
 * Component này dùng `<h1>`/`<h2>` thật và giữ nguyên thang chữ của Fluent.
 */
const useStyles = makeStyles({
  h1: {
    fontSize: appTokens.fontSize.xl,
    lineHeight: '34px',
    fontWeight: appTokens.fontWeight.semibold,
    color: tokens.colorNeutralForeground1,
    margin: 0,
  },
  h2: {
    fontSize: appTokens.fontSize.lg,
    lineHeight: '28px',
    fontWeight: appTokens.fontWeight.semibold,
    color: tokens.colorNeutralForeground1,
    margin: 0,
  },
  h3: {
    fontSize: appTokens.fontSize.md,
    lineHeight: '24px',
    fontWeight: appTokens.fontWeight.semibold,
    color: tokens.colorNeutralForeground1,
    margin: 0,
  },
});

export interface PageTitleProps {
  children: ReactNode;
  /** Cấp tiêu đề: 1 là tiêu đề chính của trang. */
  level?: 1 | 2 | 3;
}

export function PageTitle({ children, level = 1 }: PageTitleProps): React.JSX.Element {
  const styles = useStyles();

  if (level === 1) return <h1 className={styles.h1}>{children}</h1>;
  if (level === 2) return <h2 className={styles.h2}>{children}</h2>;
  return <h3 className={styles.h3}>{children}</h3>;
}
