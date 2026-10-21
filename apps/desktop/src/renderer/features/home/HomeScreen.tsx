import { useEffect, useMemo, useRef, useState } from 'react';

import { Button, Text, makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { useNavigate } from 'react-router-dom';

import type { FileMeta } from '@shared/types';

import { OfflineBadge } from '../../components/OfflineBadge';
import { PageTitle } from '../../components/PageTitle';
import { RecentFiles } from '../../components/RecentFiles';
import { ToolCard } from '../../components/ToolCard';
import { useI18n } from '../../i18n';
import { useShortcuts } from '../../hooks/useShortcuts';
import { useFilesStore } from '../../state/filesStore';
import { appTokens } from '../../styles/tokens';
import { TOOLS } from '../tools/tools';
import type { ToolDefinition } from '../tools/tools';

/**
 * Màn hình chính S-01.
 *
 * Luồng: **chọn công cụ trước, thả tệp sau**. Mỗi công cụ có vùng thả tệp
 * riêng ở màn hình của nó, chỉ nhận đúng định dạng (PDF cho năm công cụ đầu,
 * ảnh cho Images to PDF). Vì vậy ở đây không có vùng thả chung gây mơ hồ.
 *
 * Nếu người dùng vẫn thả tệp vào cửa sổ, ứng dụng hiện một bảng chọn
 * công cụ ngay tại chỗ — không phải hộp thoại bật lên — gợi ý đúng công cụ
 * theo số tệp đã thả.
 */
const useStyles = makeStyles({
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: appTokens.spacing.xxl,
    maxWidth: '1120px',
    margin: '0 auto',
    paddingBlock: appTokens.spacing.xxxl,
    paddingInline: appTokens.spacing.xl,
    width: '100%',
    animationName: 'fadeIn',
    animationDuration: '240ms',
    animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: appTokens.spacing.l,
    flexWrap: 'wrap',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: appTokens.spacing.m,
    flexWrap: 'wrap',
  },
  subtitle: {
    display: 'block',
    maxWidth: '62ch',
    marginTop: appTokens.spacing.xs,
    color: tokens.colorNeutralForeground2,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: appTokens.spacing.l,
    '@media (max-width: 900px)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },
    '@media (max-width: 620px)': {
      gridTemplateColumns: 'minmax(0, 1fr)',
    },
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: appTokens.spacing.m,
  },
  sectionTitle: {
    fontSize: appTokens.fontSize.md,
    fontWeight: appTokens.fontWeight.semibold,
    color: tokens.colorNeutralForeground1,
  },
  chooser: {
    display: 'flex',
    flexDirection: 'column',
    gap: appTokens.spacing.m,
    padding: appTokens.spacing.l,
    borderRadius: appTokens.radius.lg,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorBrandStroke1),
  },
  chooserHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: appTokens.spacing.m,
  },
  chooserTitle: {
    fontSize: appTokens.fontSize.base,
    fontWeight: appTokens.fontWeight.semibold,
    color: tokens.colorNeutralForeground1,
  },
  chooserList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: appTokens.spacing.s,
  },
  chooserButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: appTokens.spacing.s,
    padding: appTokens.spacing.s,
    paddingInline: appTokens.spacing.m,
    borderRadius: appTokens.radius.md,
    cursor: 'pointer',
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    ':hover': {
      ...shorthands.borderColor(tokens.colorBrandStroke1),
      backgroundColor: tokens.colorNeutralBackground2,
    },
    ':focus-visible': {
      ...shorthands.borderWidth('2px'),
      ...shorthands.borderColor(tokens.colorBrandStroke1),
      outlineStyle: 'none',
    },
  },
  hint: {
    color: tokens.colorNeutralForeground2,
  },
  shortcuts: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: appTokens.spacing.m,
    alignItems: 'center',
  },
  kbd: {
    fontFamily: 'Consolas, monospace',
    fontSize: appTokens.fontSize.xs,
    paddingBlock: '1px',
    paddingInline: '5px',
    borderRadius: appTokens.radius.sm,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    color: tokens.colorNeutralForeground2,
  },
});

/**
 * Các công cụ gợi ý khi người dùng thả tệp vào màn hình chính.
 *
 * Chỉ những công cụ **đã triển khai** mới được gợi ý: công cụ chưa xong thì
 * không dẫn người dùng tới một màn hình chỉ báo "sắp có".
 */
function suggestTools(count: number): ToolDefinition[] {
  const candidates =
    count > 1
      ? TOOLS.filter((tool) => tool.id === 'merge')
      : TOOLS.filter((tool) => ['split', 'compress', 'rotate', 'pages'].includes(tool.id));

  return candidates.filter((tool) => tool.ready);
}

export function HomeScreen(): React.JSX.Element {
  const styles = useStyles();
  const { t } = useI18n();
  const navigate = useNavigate();

  const addFiles = useFilesStore((state) => state.addFiles);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const [dropped, setDropped] = useState<FileMeta[]>([]);

  useShortcuts({
    onOpenFiles: () => {
      // Ctrl+O dùng chung bảng chọn công cụ với việc thả tệp: người dùng
      // chọn tệp rồi chọn công cụ, không đi thẳng sang Gộp.
      void window.optb.files.pick().then((metas) => {
        const list = metas as FileMeta[];
        if (list.length > 0) setDropped(list);
      });
    },
    onOpenTool: (toolId) => navigate(`/tools/${toolId}`),
    onOpenSettings: () => navigate('/settings'),
  });

  // Kéo tệp vào cửa sổ khi đang ở màn hình chính: hiện bảng chọn công cụ.
  useEffect(() => {
    const onDragOver = (event: DragEvent): void => {
      if (!Array.from(event.dataTransfer?.types ?? []).includes('Files')) return;
      event.preventDefault();
    };

    const onDrop = (event: DragEvent): void => {
      if (!Array.from(event.dataTransfer?.types ?? []).includes('Files')) return;
      event.preventDefault();

      const paths = Array.from(event.dataTransfer?.files ?? [])
        .map((file) => {
          try {
            return window.optb.files.getPathForFile(file);
          } catch {
            return '';
          }
        })
        .filter((path) => path.length > 0);

      if (paths.length === 0) return;

      void window.optb.files.stat(paths).then((metas) => {
        const list = metas as FileMeta[];
        if (list.length > 0) setDropped(list);
      });
    };

    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
    };
  }, []);

  const suggestions = useMemo(() => suggestTools(dropped.length), [dropped.length]);

  const startWithTool = (toolId: string): void => {
    addFiles(dropped);
    setDropped([]);
    navigate(`/tools/${toolId}`);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <PageTitle level={1}>{t('home.heading')}</PageTitle>
            <OfflineBadge />
          </div>
          <Text className={styles.subtitle}>{t('home.subtitle')}</Text>
        </div>

        <Button appearance="subtle" onClick={() => navigate('/settings')}>
          {t('nav.settings')}
        </Button>
      </header>

      {dropped.length > 0 ? (
        <section className={styles.chooser} data-testid="home-chooser">
          <div className={styles.chooserHeader}>
            <span className={styles.chooserTitle}>{t('home.chooserTitle')}</span>
            <Button
              appearance="subtle"
              size="small"
              onClick={() => setDropped([])}
              aria-label={t('common.close')}
            >
              {t('common.cancel')}
            </Button>
          </div>
          <Text className={styles.hint}>
            {t('home.chooserHint', { count: dropped.length })}
          </Text>
          <div className={styles.chooserList}>
            {suggestions.map((tool) => (
              <button
                key={tool.id}
                type="button"
                className={styles.chooserButton}
                onClick={() => startWithTool(tool.id)}
                data-testid={`chooser-${tool.id}`}
              >
                <tool.icon />
                {t(tool.nameKey)}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className={styles.section}>
        <span className={styles.sectionTitle}>{t('home.toolsTitle')}</span>
        <div className={styles.grid} ref={gridRef} data-testid="tool-grid">
          {TOOLS.map((tool, index) => (
            <ToolCard
              key={tool.id}
              icon={tool.icon}
              name={t(tool.nameKey)}
              description={t(tool.descriptionKey)}
              shortcut={`Ctrl+${index + 1}`}
              testId={tool.id}
              toolId={tool.id}
              onSelect={() => navigate(`/tools/${tool.id}`)}
            />
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <span className={styles.sectionTitle}>{t('home.shortcutsTitle')}</span>
        <div className={styles.shortcuts}>
          <span className={styles.hint}>{t('home.shortcutOpen')}</span>
          <kbd className={styles.kbd}>Ctrl+O</kbd>
          <span className={styles.hint}>{t('home.shortcutTool')}</span>
          <kbd className={styles.kbd}>Ctrl+1</kbd>
          <span className={styles.kbd}>…</span>
          <kbd className={styles.kbd}>Ctrl+6</kbd>
        </div>
      </section>

      <RecentFiles />
    </div>
  );
}
