import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardFooter,
  CardHeader,
  MessageBar,
  MessageBarBody,
  ProgressBar,
  Text,
  Title3,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  ArrowLeftRegular,
  ArrowRepeatAllRegular,
  CheckmarkCircleRegular,
  SparkleRegular,
} from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';

import { useI18n } from '../../i18n';
import { useAppStore } from '../../state/appStore';

/**
 * Màn hình Nâng cấp Pro và Giấy phép (S-09).
 *
 * Mở hộp thoại thanh toán Microsoft Store qua StoreBridge.
 * Mở khóa ngay lập tức khi mua thành công, không cần khởi động lại.
 */
const useStyles = makeStyles({
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    maxWidth: '680px',
    margin: '0 auto',
    paddingBlock: tokens.spacingVerticalXL,
    paddingInline: tokens.spacingHorizontalL,
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  card: {
    padding: tokens.spacingVerticalL,
  },
  perksList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    marginBlock: tokens.spacingVerticalM,
    padding: 0,
    listStyleType: 'none',
  },
  perkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    fontSize: tokens.fontSizeBase400,
  },
  perkIcon: {
    color: tokens.colorPaletteGreenForeground1,
    fontSize: tokens.fontSizeBase500,
  },
  priceRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: tokens.spacingHorizontalS,
    marginBlock: tokens.spacingVerticalS,
  },
  price: {
    fontSize: tokens.fontSizeHero800,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
  },
  pricePeriod: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
    marginTop: tokens.spacingVerticalM,
  },
  ownedBox: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalL,
    padding: tokens.spacingVerticalL,
  },
  ownedIcon: {
    fontSize: '48px',
    color: tokens.colorPaletteGreenForeground1,
  },
});

export function ProScreen(): React.JSX.Element {
  const styles = useStyles();
  const { t } = useI18n();
  const navigate = useNavigate();

  const license = useAppStore((state) => state.license);
  const purchase = useAppStore((state) => state.purchase);
  const restore = useAppStore((state) => state.restore);

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ intent: 'success' | 'error' | 'info'; text: string } | null>(
    null,
  );

  const handlePurchase = async (): Promise<void> => {
    setLoading(true);
    setFeedback({ intent: 'info', text: t('pro.purchasing') });
    try {
      const res = await purchase();
      if (res.success) {
        setFeedback({ intent: 'success', text: t('pro.ownedSubtitle') });
      } else if (res.status === 'cancelled') {
        setFeedback(null);
      } else {
        setFeedback({
          intent: 'error',
          text: res.message ?? 'Purchase could not be completed.',
        });
      }
    } catch (err) {
      setFeedback({
        intent: 'error',
        text: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (): Promise<void> => {
    setLoading(true);
    setFeedback({ intent: 'info', text: t('pro.purchasing') });
    try {
      const updated = await restore();
      if (updated.isPro) {
        setFeedback({ intent: 'success', text: t('pro.restoreSuccess') });
      } else {
        setFeedback({ intent: 'info', text: t('pro.restoreNotFound') });
      }
    } catch {
      setFeedback({ intent: 'error', text: 'Could not contact Microsoft Store.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <Button
          appearance="subtle"
          icon={<ArrowLeftRegular />}
          onClick={() => navigate(-1)}
          aria-label="Back"
        />
        <Title3>{t('pro.title')}</Title3>
        {license.isPro ? (
          <Badge appearance="filled" color="success">
            PRO ACTIVE
          </Badge>
        ) : (
          <Badge appearance="tint">FREE TIER</Badge>
        )}
      </div>

      {feedback ? (
        <MessageBar intent={feedback.intent}>
          <MessageBarBody>{feedback.text}</MessageBarBody>
        </MessageBar>
      ) : null}

      {loading ? <ProgressBar /> : null}

      {license.isPro ? (
        <Card className={styles.card}>
          <div className={styles.ownedBox}>
            <CheckmarkCircleRegular className={styles.ownedIcon} />
            <div>
              <Text size={500} weight="semibold">
                {t('pro.ownedTitle')}
              </Text>
              <div>
                <Text size={300} style={{ color: tokens.colorNeutralForeground2 }}>
                  {t('pro.ownedSubtitle')}
                </Text>
              </div>
            </div>
          </div>
          <CardFooter>
            <Button appearance="primary" onClick={() => navigate('/')}>
              {t('nav.home')}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className={styles.card}>
          <CardHeader
            header={
              <div>
                <Text size={500} weight="semibold">
                  {t('pro.perksTitle')}
                </Text>
                <div>
                  <Text size={300} style={{ color: tokens.colorNeutralForeground2 }}>
                    {t('pro.comingSoon')}
                  </Text>
                </div>
              </div>
            }
          />

          <ul className={styles.perksList}>
            <li className={styles.perkItem}>
              <CheckmarkCircleRegular className={styles.perkIcon} />
              <Text>{t('pro.perk1')}</Text>
            </li>
            <li className={styles.perkItem}>
              <CheckmarkCircleRegular className={styles.perkIcon} />
              <Text>{t('pro.perk2')}</Text>
            </li>
            <li className={styles.perkItem}>
              <CheckmarkCircleRegular className={styles.perkIcon} />
              <Text>{t('pro.perk3')}</Text>
            </li>
            <li className={styles.perkItem}>
              <CheckmarkCircleRegular className={styles.perkIcon} />
              <Text>{t('pro.perk4')}</Text>
            </li>
          </ul>

          <div className={styles.priceRow}>
            <span className={styles.price}>$12.99</span>
            <span className={styles.pricePeriod}>/ one-time purchase &middot; lifetime</span>
          </div>

          <div className={styles.actions}>
            <Button
              appearance="primary"
              size="large"
              icon={<SparkleRegular />}
              disabled={loading}
              onClick={() => void handlePurchase()}
              data-testid="upgrade-pro-btn"
            >
              {t('pro.buyCta')}
            </Button>
            <Button
              appearance="secondary"
              size="large"
              icon={<ArrowRepeatAllRegular />}
              disabled={loading}
              onClick={() => void handleRestore()}
            >
              {t('pro.restoreCta')}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
