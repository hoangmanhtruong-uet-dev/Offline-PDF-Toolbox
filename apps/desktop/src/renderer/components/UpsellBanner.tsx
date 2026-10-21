import { Button, MessageBar, MessageBarBody, makeStyles, tokens } from '@fluentui/react-components';
import { useNavigate } from 'react-router-dom';

import { useI18n } from '../i18n';

/**
 * Dải thông báo nhắc nâng cấp.
 *
 * Quy tắc bắt buộc (UX.md mục 4):
 * - Không dùng hộp thoại bật lên giữa lúc người dùng đang làm việc.
 * - Chỉ hiện ở thanh dưới.
 * - Tối đa một lần mỗi phiên làm việc cho cùng một giới hạn.
 * - Không xóa dữ liệu người dùng đang làm.
 */
const useStyles = makeStyles({
  bar: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalL,
    padding: tokens.spacingVerticalS,
    paddingInline: tokens.spacingHorizontalL,
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke2,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  message: {
    flexGrow: 1,
  },
});

export interface UpsellBannerProps {
  /** Khoá chuỗi thông báo giới hạn. */
  messageKey: string;
  /** Các biến cần thay thế trong thông báo. */
  vars?: Record<string, string | number>;
}

export function UpsellBanner({ messageKey, vars }: UpsellBannerProps): React.JSX.Element {
  const styles = useStyles();
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <div className={styles.bar} data-testid="upsell-banner">
      <MessageBar className={styles.message} intent="warning">
        <MessageBarBody>{t(messageKey as Parameters<typeof t>[0], vars)}</MessageBarBody>
      </MessageBar>
      <Button appearance="primary" onClick={() => navigate('/pro')}>
        {t('limits.upgrade')}
      </Button>
    </div>
  );
}
