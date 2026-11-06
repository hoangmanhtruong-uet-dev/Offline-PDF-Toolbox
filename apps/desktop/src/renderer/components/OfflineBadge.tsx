import { LockClosedRegular } from '@fluentui/react-icons';
import { makeStyles, tokens } from '@fluentui/react-components';

import { gradients } from '../styles/tokens';
import { useI18n } from '../i18n';

/**
 * Dấu hiệu "Xử lý trên máy bạn".
 *
 * Đây là bằng chứng trực quan cho lời hứa offline (UX.md mục 2). Không được
 * bỏ khỏi thanh trên của màn hình công cụ.
 */
const useStyles = makeStyles({
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    paddingInline: '10px',
    paddingBlock: '3px',
    borderRadius: '999px',
    backgroundImage: gradients.brandSoft,
    color: tokens.colorBrandForeground1,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    whiteSpace: 'nowrap',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  icon: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorBrandForeground1,
  },
});

export function OfflineBadge(): React.JSX.Element {
  const styles = useStyles();
  const { t } = useI18n();

  return (
    <span className={styles.badge} data-testid="offline-badge">
      <LockClosedRegular className={styles.icon} />
      {t('app.offlineBadge')}
    </span>
  );
}
