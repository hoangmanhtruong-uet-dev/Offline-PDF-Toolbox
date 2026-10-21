import { useMemo, useState } from 'react';

import {
  Button,
  Checkbox,
  Input,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { FolderRegular } from '@fluentui/react-icons';

import { FeatureGate } from '@shared/features';
import { OUTPUT_TEMPLATES } from '@shared/naming';

import { ActionBar } from '../../components/ActionBar';
import { AppShell } from '../../components/AppShell';
import { DropZone } from '../../components/DropZone';
import { FileList } from '../../components/FileList';
import { OptionsPanel } from '../../components/OptionsPanel';
import { ResultSummary, TaskErrorBanner } from '../../components/ResultSummary';
import { UpsellBanner } from '../../components/UpsellBanner';
import { useI18n } from '../../i18n';
import { useAppStore } from '../../state/appStore';
import { useFilesStore } from '../../state/filesStore';
import { useTaskStore } from '../../state/taskStore';

/**
 * Công cụ Gộp PDF (F-01).
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
  sortRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    flexWrap: 'wrap',
  },
});

/** Ngày hiện tại theo định dạng `YYYY-MM-DD`, dùng cho mẫu tên tệp. */
function today(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function MergeScreen(): React.JSX.Element {
  const styles = useStyles();
  const { t } = useI18n();
  const files = useFilesStore((state) => state.files);
  const addFiles = useFilesStore((state) => state.addFiles);
  const removeFile = useFilesStore((state) => state.removeFile);
  const clearFiles = useFilesStore((state) => state.clear);
  const moveFile = useFilesStore((state) => state.moveFile);
  const setPageRange = useFilesStore((state) => state.setPageRange);
  const sortBy = useFilesStore((state) => state.sortBy);

  const license = useAppStore((state) => state.license);
  const running = useTaskStore((state) => state.running);
  const progress = useTaskStore((state) => state.progress);
  const result = useTaskStore((state) => state.result);
  const error = useTaskStore((state) => state.error);
  const start = useTaskStore((state) => state.start);
  const cancel = useTaskStore((state) => state.cancel);
  const clearResult = useTaskStore((state) => state.clear);

  const [outputDirectory, setOutputDirectory] = useState<string | null>(null);
  const [outputName, setOutputName] = useState<string>(OUTPUT_TEMPLATES.merged);
  const [skipBroken, setSkipBroken] = useState<boolean>(false);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [signatureWarning, setSignatureWarning] = useState(false);

  const isRunning = running?.kind === 'merge';

  const totalPages = files.reduce((sum, file) => sum + (file.pageCount ?? 0), 0);
  const summary =
    files.length === 0
      ? undefined
      : `${t('files.count', { count: files.length })} · ${t('files.pages', { count: totalPages })}`;

  /** Thư mục lưu: mặc định là cạnh tệp gốc đầu tiên. */
  const effectiveDirectory = useMemo(() => {
    if (outputDirectory) return outputDirectory;
    const first = files[0];
    if (!first) return '';
    const separator = first.path.lastIndexOf('\\');
    const slash = first.path.lastIndexOf('/');
    const index = Math.max(separator, slash);
    return index > 0 ? first.path.slice(0, index) : '';
  }, [outputDirectory, files]);

  const resolvedName = outputName.replace(/\{date\}/g, today()).replace(/\{time\}/g, '');

  const pickDirectory = async (): Promise<void> => {
    const folder = await window.optb.files.pickFolder();
    if (folder) setOutputDirectory(folder);
  };

  const runMerge = async (): Promise<void> => {
    setLimitMessage(null);

    const gate = FeatureGate.forLicense(license.isPro);
    const decision = gate.check('merge', { files: files.length });
    if (!decision.allowed) {
      setLimitMessage(decision.messageKey);
      return;
    }

    if (files.some((file) => file.hasSignature) && !signatureWarning) {
      setSignatureWarning(true);
      return;
    }

    const payload = {
      files: files.map((file) => ({
        path: file.path,
        ...(file.pageRange ? { pageRange: file.pageRange } : {}),
      })),
      outputDirectory: effectiveDirectory,
      outputName: resolvedName,
      skipBroken,
    };

    await start('merge', payload);
  };

  const footer = result ? (
    <ResultSummary
      outputPath={result.outputPaths[0] ?? ''}
      outputDirectory={effectiveDirectory}
      pageCount={totalPages}
      onDismiss={clearResult}
    />
  ) : limitMessage ? (
    <UpsellBanner messageKey={limitMessage} />
  ) : null;

  return (
    <AppShell
      title={t('home.tool.merge')}
      onBack={() => window.location.hash = '#/'}
      options={
        <OptionsPanel>
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
            <span className={styles.hint}>{`${resolvedName}.pdf`}</span>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>{t('merge.sortBy')}</span>
            <div className={styles.sortRow}>
              <Button size="small" onClick={() => sortBy('name')}>
                {t('merge.sortName')}
              </Button>
              <Button size="small" onClick={() => sortBy('modifiedAt')}>
                {t('merge.sortDate')}
              </Button>
              <Button size="small" onClick={() => sortBy('size')}>
                {t('merge.sortSize')}
              </Button>
            </div>
          </div>

          <Checkbox
            checked={skipBroken}
            label={t('merge.skipBroken')}
            onChange={(_event, data) => setSkipBroken(data.checked === true)}
          />
        </OptionsPanel>
      }
      footer={
        footer ?? (
          <ActionBar
            actionLabel={t('shell.run')}
            onAction={() => void runMerge()}
            disabled={files.length === 0 || isRunning}
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

        {signatureWarning ? (
          <div className={styles.stack}>
            <TaskErrorBanner messageKey="signature.warning" onDismiss={() => setSignatureWarning(false)} />
            <Button appearance="primary" onClick={() => void runMerge()}>
              {t('signature.continue')}
            </Button>
          </div>
        ) : null}

        <DropZone onFiles={addFiles} title={t('files.add')} hint={t('merge.rangeHint')} compact />

        {files.length > 0 ? (
          <FileList
            files={files}
            onRemove={removeFile}
            onMove={moveFile}
            onPageRangeChange={setPageRange}
            showPageRange
            reorderable
          />
        ) : null}

        {files.length > 0 ? (
          <Button appearance="subtle" onClick={clearFiles}>
            {t('files.clear')}
          </Button>
        ) : null}
      </div>
    </AppShell>
  );
}
