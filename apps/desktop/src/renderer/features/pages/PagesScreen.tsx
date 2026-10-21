import { useMemo, useState } from 'react';

import { Button, Input, makeStyles, tokens } from '@fluentui/react-components';
import { ArrowRotateClockwiseRegular, DeleteRegular } from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';

import { FeatureGate } from '@shared/features';

import { ActionBar } from '../../components/ActionBar';
import { AppShell } from '../../components/AppShell';
import { DropZone } from '../../components/DropZone';
import { OptionsPanel } from '../../components/OptionsPanel';
import { PageGrid } from '../../components/PageGrid';
import { ResultSummary, TaskErrorBanner } from '../../components/ResultSummary';
import { UpsellBanner } from '../../components/UpsellBanner';
import { useI18n } from '../../i18n';
import { useShortcuts } from '../../hooks/useShortcuts';
import { useAppStore } from '../../state/appStore';
import { useTaskStore } from '../../state/taskStore';
import { appTokens } from '../../styles/tokens';
import { usePagesStore } from '../../state/pagesStore';

/**
 * Công cụ Sắp xếp trang (F-05).
 *
 * Người dùng xem lưới hình thu nhổ mọi trang, kéo thả để đổi thứ tự, xoay
 * hoặc xóa từng trang, rồi lưu thành một tệp mới.
 */
const useStyles = makeStyles({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: appTokens.spacing.l,
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: appTokens.spacing.s,
    flexWrap: 'wrap',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: appTokens.spacing.xs,
  },
  label: {
    fontSize: appTokens.fontSize.base,
    fontWeight: appTokens.fontWeight.semibold,
    color: tokens.colorNeutralForeground1,
  },
  hint: {
    fontSize: appTokens.fontSize.sm,
    color: tokens.colorNeutralForeground2,
  },
  value: {
    fontSize: appTokens.fontSize.sm,
    color: tokens.colorNeutralForeground1,
    wordBreak: 'break-all',
  },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    gap: appTokens.spacing.m,
  },
  pageActions: {
    display: 'flex',
    alignItems: 'center',
    gap: appTokens.spacing.xs,
  },
});

export function PagesScreen(): React.JSX.Element {
  const styles = useStyles();
  const { t } = useI18n();
  const navigate = useNavigate();

  const pages = usePagesStore((state) => state.pages);
  const addFile = usePagesStore((state) => state.addFile);
  const removePage = usePagesStore((state) => state.removePage);
  const rotatePage = usePagesStore((state) => state.rotatePage);
  const movePage = usePagesStore((state) => state.movePage);
  const clear = usePagesStore((state) => state.clear);

  const license = useAppStore((state) => state.license);
  const running = useTaskStore((state) => state.running);
  const progress = useTaskStore((state) => state.progress);
  const result = useTaskStore((state) => state.result);
  const error = useTaskStore((state) => state.error);
  const start = useTaskStore((state) => state.start);
  const cancel = useTaskStore((state) => state.cancel);
  const clearResult = useTaskStore((state) => state.clear);

  const [selected, setSelected] = useState<number[]>([]);
  const [outputName, setOutputName] = useState('');
  const [limitMessage, setLimitMessage] = useState<string | null>(null);

  const isRunning = running?.kind === 'pages';

  useShortcuts({
    onOpenFiles: () => {
      void window.optb.files.pick().then((metas) => {
        const list = metas as { path: string; name: string }[];
        for (const meta of list) addFile(meta.path);
      });
    },
    onOpenTool: (toolId) => navigate(`/tools/${toolId}`),
    onOpenSettings: () => navigate('/settings'),
  });

  const pageItems = useMemo(
    () =>
      pages.map((page) => ({
        pageNumber: page.pageNumber,
        thumbnail: page.thumbnail,
      })),
    [pages],
  );

  const selectedIds = useMemo(
    () => selected.map((index) => pages[index]?.id).filter(Boolean) as string[],
    [selected, pages],
  );

  const save = async (): Promise<void> => {
    setLimitMessage(null);

    const gate = FeatureGate.forLicense(license.isPro);
    const decision = gate.check('pages', { pages: pages.length });
    if (!decision.allowed) {
      setLimitMessage(decision.messageKey);
      return;
    }

    const name = outputName.trim() || 'pages';

    await start('pages', {
      pages: pages.map((page) => ({
        path: page.path,
        pageNumber: page.pageNumber,
        rotationDelta: page.rotationDelta,
      })),
      outputDirectory: pages[0]?.directory ?? '',
      outputName: name,
      selectedPageIds: selectedIds.length > 0 ? selectedIds : undefined,
    });
  };

  const footer = result ? (
    <ResultSummary
      outputPath={result.outputPaths[0] ?? ''}
      outputDirectory={pages[0]?.directory ?? ''}
      pageCount={result.details?.pageCount ?? pages.length}
      onDismiss={clearResult}
    />
  ) : limitMessage ? (
    <UpsellBanner messageKey={limitMessage} />
  ) : null;

  return (
    <AppShell
      title={t('home.tool.pages')}
      onBack={() => navigate('/')}
      options={
        <OptionsPanel>
          <div className={styles.field}>
            <span className={styles.label}>{t('merge.outputName')}</span>
            <Input
              value={outputName}
              placeholder={t('pages.defaultName')}
              onChange={(_event, data) => setOutputName(data.value)}
              data-testid="output-name"
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>{t('pages.selected')}</span>
            <span className={styles.value}>
              {t('files.selected', { count: selected.length })}
            </span>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>{t('pages.actions')}</span>
            <div className={styles.toolbar}>
              <Button
                size="small"
                icon={<ArrowRotateClockwiseRegular />}
                disabled={selected.length === 0}
                onClick={() => {
                  for (const index of selected) rotatePage(index);
                }}
                data-testid="rotate-selected"
              >
                {t('pages.rotate')}
              </Button>
              <Button
                size="small"
                icon={<DeleteRegular />}
                disabled={selected.length === 0}
                onClick={() => {
                  for (const index of [...selected].sort((a, b) => b - a)) removePage(index);
                  setSelected([]);
                }}
                data-testid="delete-selected"
              >
                {t('pages.delete')}
              </Button>
            </div>
          </div>
        </OptionsPanel>
      }
      footer={
        footer ?? (
          <ActionBar
            actionLabel={t('pages.save')}
            onAction={() => void save()}
            disabled={pages.length === 0 || isRunning}
            running={isRunning}
            progressPercent={progress?.percent ?? 0}
            onCancel={() => void cancel()}
            summary={
              pages.length > 0
                ? `${t('files.pages', { count: pages.length })}`
                : undefined
            }
          />
        )
      }
    >
      <div className={styles.stack}>
        {error ? (
          <TaskErrorBanner
            messageKey={error.messageKey}
            files={error.files}
            onDismiss={clearResult}
          />
        ) : null}

        {pages.length === 0 ? (
          <DropZone
            onFiles={(metas) => {
              for (const meta of metas) addFile(meta.path);
            }}
            title={t('files.add')}
            hint={t('home.dropHint')}
            compact
            accept="pdf"
          />
        ) : (
          <>
            <div className={styles.toolbar}>
              <Button size="small" appearance="subtle" onClick={clear}>
                {t('files.clear')}
              </Button>
            </div>
            <PageGrid
              pages={pageItems}
              selected={selected}
              onSelectionChange={setSelected}
              onPageVisible={(pageNumber) => {
                const index = pages.findIndex((page) => page.pageNumber === pageNumber);
                if (index >= 0) usePagesStore.getState().loadThumbnail(index);
              }}
              onReorder={(from, to) => movePage(from, to)}
              renderActions={(index) => (
                <span className={styles.pageActions}>
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<ArrowRotateClockwiseRegular />}
                    aria-label={t('pages.rotate')}
                    onClick={(event) => {
                      event.stopPropagation();
                      rotatePage(index);
                    }}
                    data-testid={`rotate-page-${index + 1}`}
                  />
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<DeleteRegular />}
                    aria-label={t('pages.delete')}
                    onClick={(event) => {
                      event.stopPropagation();
                      removePage(index);
                    }}
                    data-testid={`delete-page-${index + 1}`}
                  />
                </span>
              )}
            />
          </>
        )}
      </div>
    </AppShell>
  );
}
