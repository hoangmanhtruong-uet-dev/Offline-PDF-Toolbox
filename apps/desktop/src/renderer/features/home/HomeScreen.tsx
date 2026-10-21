import { useEffect, useState } from 'react';

import { Button, Card, Text, Title2, makeStyles, tokens } from '@fluentui/react-components';
import { useNavigate } from 'react-router-dom';

import type { FileMeta, RecentFile } from '@shared/types';

import { DropZone } from '../../components/DropZone';
import { OfflineBadge } from '../../components/OfflineBadge';
import { useI18n } from '../../i18n';
import { TOOLS } from '../tools/tools';

/**
 * Màn hình chính S-01.
 *
 * Ba phần: lưới sáu ô công cụ, vùng kéo thả lớn, danh sách tệp gần đây.
 */
const useStyles = makeStyles({
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXL,
    maxWidth: '1080px',
    margin: '0 auto',
    paddingBlock: tokens.spacingVerticalXXL,
  },
  heading: {
    color: tokens.colorNeutralForeground1,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalL,
    flexWrap: 'wrap',
  },
  subtitle: {
    display: 'block',
    color: tokens.colorNeutralForeground3,
    maxWidth: '60ch',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: tokens.spacingHorizontalL,
    gapRow: tokens.spacingVerticalL,
  },
  tool: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalL,
    cursor: 'pointer',
    transitionProperty: 'border-color',
    transitionDuration: '120ms',
    ':hover': {
      borderTopColor: tokens.colorBrandStroke1,
      borderRightColor: tokens.colorBrandStroke1,
      borderBottomColor: tokens.colorBrandStroke1,
      borderLeftColor: tokens.colorBrandStroke1,
    },
  },
  toolIcon: {
    fontSize: tokens.fontSizeBase600,
    color: tokens.colorBrandForeground1,
  },
  toolName: {
    fontWeight: tokens.fontWeightSemibold,
  },
  toolFeature: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  recent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  recentRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalS,
    borderRadius: tokens.borderRadiusMedium,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3,
    },
  },
  recentName: {
    flexGrow: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  empty: {
    color: tokens.colorNeutralForeground3,
  },
});

export function HomeScreen(): React.JSX.Element {
  const styles = useStyles();
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const [recent, setRecent] = useState<RecentFile[]>([]);

  useEffect(() => {
    void window.optb.recent.get().then((files) => setRecent(files as RecentFile[]));
  }, []);

  const clearRecent = async (): Promise<void> => {
    await window.optb.recent.clear();
    setRecent([]);
  };

  const openTool = (toolId: string): void => {
    navigate(`/tools/${toolId}`);
  };

  const handleDropped = (_metas: FileMeta[]): void => {
    // Trang chính chỉ giới thiệu công cụ; thao tác thật diễn ra trong màn
    // hình của từng công cụ.
    openTool('merge');
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <Title2 className={styles.heading}>{t('home.heading')}</Title2>
          <Text className={styles.subtitle}>{t('home.subtitle')}</Text>
        </div>
        <OfflineBadge />
      </div>

      <DropZone onFiles={handleDropped} />

      <div className={styles.grid} data-testid="tool-grid">
        {TOOLS.map((tool) => (
          <Card
            key={tool.id}
            className={styles.tool}
            onClick={() => openTool(tool.id)}
            data-testid={`tool-${tool.id}`}
          >
            <tool.icon className={styles.toolIcon} />
            <div>
              <div className={styles.toolName}>{t(tool.nameKey)}</div>
              <div className={styles.toolFeature}>{tool.feature}</div>
            </div>
          </Card>
        ))}
      </div>

      <section className={styles.recent}>
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM }}>
          <Text weight="semibold">{t('home.recentTitle')}</Text>
          {recent.length > 0 ? (
            <Button size="small" appearance="subtle" onClick={() => void clearRecent()}>
              {t('home.recentClear')}
            </Button>
          ) : null}
        </div>

        {recent.length === 0 ? (
          <Text className={styles.empty}>{t('home.recentEmpty')}</Text>
        ) : (
          recent.map((file) => (
            <div key={file.path} className={styles.recentRow}>
              <span className={styles.recentName} title={file.path}>
                {file.name}
              </span>
              <Text size={200} className={styles.empty}>
                {new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(file.usedAt)}
              </Text>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
