import { useMemo, useState } from 'react';

import {
  Button,
  Dropdown,
  Field,
  Input,
  Option,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { FolderRegular } from '@fluentui/react-icons';

import { FeatureGate } from '@shared/features';
import { OUTPUT_TEMPLATES } from '@shared/naming';
import type { SplitMode, SplitTaskPayload } from '@shared/tasks';

import { ActionBar } from '../../components/ActionBar';
import { AppShell } from '../../components/AppShell';
import { DropZone } from '../../components/DropZone';
import { OptionsPanel } from '../../components/OptionsPanel';
import { PageGrid } from '../../components/PageGrid';
import { PasswordPrompt } from '../../components/PasswordPrompt';
import { ResultSummary, TaskErrorBanner } from '../../components/ResultSummary';
import { UpsellBanner } from '../../components/UpsellBanner';
import { useI18n } from '../../i18n';
import type { MessageKey } from '../../i18n';
import { usePageThumbnails } from '../../hooks/usePageThumbnails';
import { useAppStore } from '../../state/appStore';
import { useSplitStore } from '../../state/splitStore';
import { useTaskStore } from '../../state/taskStore';

/**
 * Công cụ Tách PDF (F-02).
 *
 * Sáu chế độ theo đặc tả: theo khoảng trang, mỗi N trang, mỗi trang một tệp,
 * theo dấu trang cấp 1, theo dung lượng tối đa, và trích trang.
 */
const useStyles = makeStyles({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  label: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },
  hint: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  value: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground1,
    wordBreak: 'break-all',
  },
  current: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalM,
    paddingInline: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  currentName: {
    fontWeight: tokens.fontWeightSemibold,
  },
  bookmarkList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    maxHeight: '240px',
    overflowY: 'auto',
  },
});

/** Nhãn hiển thị của từng chế độ tách. */
const MODE_LABELS: Record<SplitMode, MessageKey> = {
  ranges: 'split.modeRanges',
  everyN: 'split.modeEveryN',
  eachPage: 'split.modeEachPage',
  bookmarks: 'split.modeBookmarks',
  maxSize: 'split.modeMaxSize',
  extract: 'split.modeExtract',
};

export function SplitScreen(): React.JSX.Element {
  const styles = useStyles();
  const { t } = useI18n();
  const file = useSplitStore((state) => state.file);
  const setFile = useSplitStore((state) => state.setFile);
  const clearFile = useSplitStore((state) => state.clear);

  const license = useAppStore((state) => state.license);
  const running = useTaskStore((state) => state.running);
  const progress = useTaskStore((state) => state.progress);
  const result = useTaskStore((state) => state.result);
  const error = useTaskStore((state) => state.error);
  const start = useTaskStore((state) => state.start);
  const cancel = useTaskStore((state) => state.cancel);
  const clearResult = useTaskStore((state) => state.clear);

  const [mode, setMode] = useState<SplitMode>('ranges');
  const [ranges, setRanges] = useState('');
  const [everyN, setEveryN] = useState(10);
  const [maxMegabytes, setMaxMegabytes] = useState(10);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [outputDirectory, setOutputDirectory] = useState<string | null>(null);
  const [outputName, setOutputName] = useState<string>(OUTPUT_TEMPLATES.split);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [password, setPassword] = useState<string | undefined>(undefined);

  const isRunning = running?.kind === 'split';
  const pageCount = file?.pageCount ?? 0;

  const { thumbnails, requestPage } = usePageThumbnails(file?.id ?? null, pageCount);

  const pages = useMemo(
    () =>
      Array.from({ length: pageCount }, (_unused, index) => ({
        pageNumber: index + 1,
        thumbnail: thumbnails[index + 1],
      })),
    [pageCount, thumbnails],
  );

  const effectiveDirectory = useMemo(() => {
    if (outputDirectory) return outputDirectory;
    if (!file) return '';
    const separator = Math.max(file.path.lastIndexOf('\\'), file.path.lastIndexOf('/'));
    return separator > 0 ? file.path.slice(0, separator) : '';
  }, [outputDirectory, file]);

  const bookmarkPages = useMemo(
    () => (file?.outline ?? []).map((entry) => entry.page),
    [file?.outline],
  );

  const pickDirectory = async (): Promise<void> => {
    const folder = await window.optb.files.pickFolder();
    if (folder) setOutputDirectory(folder);
  };

  const buildPayload = (): SplitTaskPayload => {
    const baseName = file?.name.replace(/\.pdf$/i, '') ?? 'document';

    return {
      path: file?.path ?? '',
      mode,
      ...(mode === 'ranges' ? { ranges } : {}),
      ...(mode === 'everyN' ? { everyN } : {}),
      ...(mode === 'maxSize' ? { maxBytes: maxMegabytes * 1024 * 1024 } : {}),
      ...(mode === 'extract' ? { pages: selectedPages } : {}),
      ...(mode === 'bookmarks' ? { bookmarkPages } : {}),
      outputDirectory: effectiveDirectory,
      outputSubfolder: `${baseName}_split`,
      outputNameTemplate: outputName,
      ...(password ? { password } : {}),
    };
  };

  const runSplit = async (): Promise<void> => {
    setLimitMessage(null);
    if (!file) return;

    const gate = FeatureGate.forLicense(license.isPro);
    const decision = gate.check('split', {
      pages: mode === 'extract' ? selectedPages.length : pageCount,
    });
    if (!decision.allowed) {
      setLimitMessage(decision.messageKey);
      return;
    }

    // Tệp có mật khẩu: hỏi người dùng trước khi chạy.
    if (file.state === 'error' && file.errorCode === 'E_AUTH' && password === undefined) {
      setPasswordOpen(true);
      return;
    }

    await start('split', buildPayload());
  };

  const summary = file
    ? `${file.name} · ${t('files.pages', { count: pageCount })}`
    : undefined;

  const footer = result ? (
    <ResultSummary
      outputPath={result.outputPaths[0] ?? ''}
      outputPaths={result.outputPaths}
      outputDirectory={effectiveDirectory}
      pageCount={file?.pageCount ?? 0}
      note={
        result.outputPaths.length > 1
          ? t('split.filesCount', { count: result.outputPaths.length })
          : undefined
      }
      onDismiss={clearResult}
    />
  ) : limitMessage ? (
    <UpsellBanner messageKey={limitMessage} />
  ) : null;

  return (
    <AppShell
      title={t('home.tool.split')}
      onBack={() => {
        window.location.hash = '#/';
      }}
      options={
        <OptionsPanel>
          <div className={styles.field}>
            <span className={styles.label}>{t('split.mode')}</span>
            <Field>
              <Dropdown
                value={t(MODE_LABELS[mode])}
                selectedOptions={[mode]}
                onOptionSelect={(_event, data) => {
                  if (data.optionValue) setMode(data.optionValue as SplitMode);
                }}
              >
                <Option value="ranges">{t('split.modeRanges')}</Option>
                <Option value="everyN">{t('split.modeEveryN')}</Option>
                <Option value="eachPage">{t('split.modeEachPage')}</Option>
                <Option value="bookmarks">{t('split.modeBookmarks')}</Option>
                <Option value="maxSize">{t('split.modeMaxSize')}</Option>
                <Option value="extract">{t('split.modeExtract')}</Option>
              </Dropdown>
            </Field>
          </div>

          {mode === 'ranges' ? (
            <div className={styles.field}>
              <span className={styles.label}>{t('split.ranges')}</span>
              <Input
                value={ranges}
                placeholder="1-3, 5, 8-10"
                onChange={(_event, data) => setRanges(data.value)}
                data-testid="split-ranges"
              />
              <span className={styles.hint}>{t('merge.rangeHint')}</span>
            </div>
          ) : null}

          {mode === 'everyN' ? (
            <div className={styles.field}>
              <span className={styles.label}>{t('split.everyN')}</span>
              <Input
                type="number"
                value={String(everyN)}
                min={1}
                onChange={(_event, data) => setEveryN(Math.max(1, Number(data.value) || 1))}
                data-testid="split-every-n"
              />
            </div>
          ) : null}

          {mode === 'maxSize' ? (
            <div className={styles.field}>
              <span className={styles.label}>{t('split.maxSize')}</span>
              <Input
                type="number"
                value={String(maxMegabytes)}
                min={1}
                onChange={(_event, data) => setMaxMegabytes(Math.max(1, Number(data.value) || 1))}
                data-testid="split-max-size"
              />
              <span className={styles.hint}>{t('split.maxSizeHint')}</span>
            </div>
          ) : null}

          {mode === 'bookmarks' ? (
            <div className={styles.field}>
              <span className={styles.label}>{t('split.bookmarks')}</span>
              {bookmarkPages.length === 0 ? (
                <span className={styles.hint}>{t('split.noBookmarks')}</span>
              ) : (
                <div className={styles.bookmarkList}>
                  {(file?.outline ?? []).map((entry) => (
                    <Text key={`${entry.page}-${entry.title}`} size={200}>
                      {entry.title} — {t('files.page', { count: entry.page })}
                    </Text>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {mode === 'extract' ? (
            <div className={styles.field}>
              <span className={styles.label}>{t('split.selectedPages')}</span>
              <span className={styles.value}>
                {t('files.selected', { count: selectedPages.length })}
              </span>
            </div>
          ) : null}

          <div className={styles.field}>
            <span className={styles.label}>{t('merge.outputFolder')}</span>
            <Text className={styles.value}>{effectiveDirectory || '—'}</Text>
            <Button size="small" icon={<FolderRegular />} onClick={() => void pickDirectory()}>
              {t('merge.chooseFolder')}
            </Button>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>{t('merge.outputName')}</span>
            <Input
              value={outputName}
              onChange={(_event, data) => setOutputName(data.value)}
              data-testid="output-name"
            />
          </div>
        </OptionsPanel>
      }
      footer={
        footer ?? (
          <ActionBar
            actionLabel={t('split.run')}
            onAction={() => void runSplit()}
            disabled={!file || isRunning}
            running={isRunning}
            progressPercent={progress?.percent ?? 0}
            onCancel={() => void cancel()}
            summary={summary}
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

        {file ? (
          <div className={styles.current} data-testid="split-file">
            {file.thumbnail ? (
              <img
                src={file.thumbnail}
                alt=""
                style={{ width: '48px', height: '64px', borderRadius: '4px' }}
              />
            ) : null}
            <span className={styles.currentName}>{file.name}</span>
            <Text className={styles.hint}>{t('files.pages', { count: pageCount })}</Text>
            <Button appearance="subtle" size="small" onClick={clearFile}>
              {t('files.remove')}
            </Button>
          </div>
        ) : (
          <DropZone
            onFiles={(metas) => setFile(metas[0] ?? null)}
            title={t('files.add')}
            hint={t('home.dropHint')}
            compact
            multiple={false}
          />
        )}

        {mode === 'extract' && file ? (
          <PageGrid
            pages={pages}
            selected={selectedPages}
            onSelectionChange={setSelectedPages}
            onPageVisible={requestPage}
          />
        ) : null}
      </div>

      <PasswordPrompt
        open={passwordOpen}
        fileName={file?.name ?? ''}
        submitLabel={t('split.run')}
        onCancel={() => setPasswordOpen(false)}
        onSubmit={(value) => {
          setPassword(value);
          setPasswordOpen(false);
          void start('split', { ...buildPayload(), password: value });
        }}
      />
    </AppShell>
  );
}
