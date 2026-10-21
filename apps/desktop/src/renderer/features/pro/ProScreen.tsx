import { Button, MessageBar, MessageBarBody, Text, Title3, makeStyles, tokens } from '@fluentui/react-components';
import { useNavigate } from 'react-router-dom';

import { FREE_LIMITS } from '@shared/features';

import { useI18n } from '../../i18n';

/**
 * Màn hình Nâng cấp Pro (S-09).
 *
 * Luồng mua thật sẽ nối vào Microsoft Store ở tuần 8 (xem LICENSING.md).
 * Ở bản nội bộ, màn hình này giải thích các giới hạn của bản Free.
 */
const useStyles = makeStyles({
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    maxWidth: '720px',
    margin: '0 auto',
    paddingBlock: tokens.spacingVerticalXXL,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    margin: 0,
    paddingInlineStart: tokens.spacingHorizontalL,
  },
});

export function ProScreen(): React.JSX.Element {
  const styles = useStyles();
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <Title3>{t('pro.title')}</Title3>

      <MessageBar intent="info">
        <MessageBarBody>{t('pro.comingSoon')}</MessageBarBody>
      </MessageBar>

      <Text weight="semibold">{t('pro.freeLimits')}</Text>
      <ul className={styles.list}>
        <li>{t('limits.maxFiles', { limit: FREE_LIMITS.merge.maxFiles })}</li>
        <li>{t('limits.maxPages', { limit: FREE_LIMITS.split.maxPages })}</li>
        <li>{t('limits.maxImages', { limit: FREE_LIMITS.images.maxImages })}</li>
      </ul>

      <Button appearance="primary" onClick={() => navigate('/')}>
        {t('nav.home')}
      </Button>
    </div>
  );
}
