import { useEffect, useState } from 'react';

import {
  Button,
  Dropdown,
  Field,
  Option,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { FolderRegular } from '@fluentui/react-icons';

import { FeatureGate } from '@shared/features';
import { OUTPUT_TEMPLATES } from '@shared/naming';
import type { CompressionEstimate } from '@shared/tasks';
import type { CompressionLevel } from '@shared/types';

import { ActionBar } from '../../components/ActionBar';
import { AppShell } from '../../components/AppShell';
import { DropZone } from '../../components/DropZone';
import { OptionsPanel } from '../../components/OptionsPanel';
import { ResultSummary, TaskErrorBanner } from '../../components/ResultSummary';
import { UpsellBanner } from '../../components/UpsellBanner';
import { useI18n } from '../../i18n';
import type { MessageKey } from '../../i18n';
import { useAppStore } from '../../state/appStore';
import { useTaskStore } from '../../state/taskStore';
import { useCompressStore } from '../../state/compressStore';

/**
 * Công cụ Nén PDF (F-03).
 *
 * Ba mức nén theo đặc tả: Nhẹ, Vừa (mặc định) và Mạnh. Trước khi chạy, ứng
 * dụng ước lượng mức giảm để người dùng biết trước kết quả.
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
  estimate: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    padding: tokens.spacingVerticalM,
    paddingInline: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  estimateValue: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorPaletteGreenForeground2,
  },
});

/** Nhan hien thi cua tung muc nen. */
const LEVEL_LABELS: Record<CompressionLevel, MessageKey> = {
  light: 'compress.levelLight',
  medium: 'compress.levelMedium',
  strong: 'compress.levelStrong',
};

/** Goi y ngan cua tung muc nen. */
const LEVEL_HINTS: Record<CompressionLevel, MessageKey> = {
  light: 'compress.hintLight',
  medium: 'compress.hintMedium',
  strong: 'compress.hintStrong',
};

export function CompressScreen(): React.JSX.Element {
  const styles = useStyles();
  const { t, formatBytes } = useI18n();

  const file = useCompressStore((state) => state.file);
  const setFile = useCompressStore((state) => state.setFile);
  const clearFile = useCompressStore((state) => state.clear);

  const license = useAppStore((state) => state.license);
  const running = useTaskStore((state) => state.running);
  const progress = useTaskStore((state) => state.progress);
  const result = useTaskStore((state) => state.result);
  const error = useTaskStore((state) => state.error);
  const start = useTaskStore((state) => state.start);
  const cancel = useTaskStore((state) => state.cancel);
  const clearResult = useTaskStore((state) => state.clear);

  const [level, setLevel] = useState<CompressionLevel>('medium');
  const [outputDirectory, setOutputDirectory] = useState<string | null>(null);
  const [estimateState, setEstimateState] = useState<{
    key: string;
    value: CompressionEstimate | null;
  } | null>(null);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);

  const isRunning = running?.kind === 'compress';

  // Ước lượng lại mỗi khi đổi tệp hoặc đổi mức nén. Ước lượng được gắn
  // kèm khoá để không hiện nhầm kết quả của tệp trước đó.
  const estimateKey = file ? `${file.id}:${level}` : '';
  const estimate = estimateState?.key === estimateKey ? estimateState.value : null;

  useEffect(() => {
    if (!file) return;

    let cancelled = false;

    void window.optb.compress.estimate(file.path, level).then((value) => {
      if (cancelled) return;
      setEstimateState({ key: `${file.id}:${level}`, value });
    });

    return () => {
      cancelled = true;
    };
  }, [file, level]);

  const effectiveDirectory = (() => {
    if (outputDirectory) return outputDirectory;
    if (!file) return '';
    const separator = Math.max(file.path.lastIndexOf('\\'), file.path.lastIndexOf('/'));
    return separator > 0 ? file.path.slice(0, separator) : '';
  })();

  const pickDirectory = async (): Promise<void> => {
    const folder = await window.optb.files.pickFolder();
    if (folder) setOutputDirectory(folder);
  };

  const runCompress = async (): Promise<void> => {
    setLimitMessage(null);
    if (!file) return;

    const gate = FeatureGate.forLicense(license.isPro);
    const decision = gate.check('compress', {
      files: 1,
      level,
      inputBytes: file.size,
    });
    if (!decision.allowed) {
      setLimitMessage(decision.messageKey);
      return;
    }

    const baseName = file.name.replace(/\.pdf$/i, '');

    await start('compress', {
      path: file.path,
      level,
      outputDirectory: effectiveDirectory,
      outputName: OUTPUT_TEMPLATES.compressed.replace('{name}', baseName),
    });
  };

  const summary = file
    ? `${file.name} · ${t('files.pages', { count: file.pageCount ?? 0 })}`
    : undefined;

  const footer = result ? (
    <ResultSummary
      outputPath={result.outputPaths[0] ?? ''}
      outputDirectory={effectiveDirectory}
      pageCount={file?.pageCount ?? 0}
      onDismiss={clearResult}
    />
  ) : limitMessage ? (
    <UpsellBanner messageKey={limitMessage} />
  ) : null;

  return (
    <AppShell
      title={t('home.tool.compress')}
      onBack={() => {
        window.location.hash = '#/';
      }}
      options={
        <OptionsPanel>
          <div className={styles.field}>
            <span className={styles.label}>{t('compress.level')}</span>
            <Field>
              <Dropdown
                value={t(LEVEL_LABELS[level])}
                selectedOptions={[level]}
                onOptionSelect={(_event, data) => {
                  if (data.optionValue) setLevel(data.optionValue as CompressionLevel);
                }}
              >
                <Option value="light">{t('compress.levelLight')}</Option>
                <Option value="medium">{t('compress.levelMedium')}</Option>
                <Option value="strong">{t('compress.levelStrong')}</Option>
              </Dropdown>
            </Field>
            <span className={styles.hint}>{t(LEVEL_HINTS[level])}</span>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>{t('merge.outputFolder')}</span>
            <Text className={styles.value}>{effectiveDirectory || '—'}</Text>
            <Button size="small" icon={<FolderRegular />} onClick={() => void pickDirectory()}>
              {t('merge.chooseFolder')}
            </Button>
          </div>
        </OptionsPanel>
      }
      footer={
        footer ?? (
          <ActionBar
            actionLabel={t('compress.run')}
            onAction={() => void runCompress()}
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
          <div className={styles.current} data-testid="compress-file">
            {file.thumbnail ? (
              <img
                src={file.thumbnail}
                alt=""
                style={{ width: '48px', height: '64px', borderRadius: '4px' }}
              />
            ) : null}
            <span className={styles.currentName}>{file.name}</span>
            <Text className={styles.hint}>{formatBytes(file.size)}</Text>
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

        {estimate ? (
          <div className={styles.estimate} data-testid="compress-estimate">
            <Text className={styles.estimateValue}>
              {t('compress.estimate', {
                ratio: Math.round((1 - estimate.imageRatio) * 100),
              })}
            </Text>
            <Text className={styles.hint}>
              {t('compress.estimateDetail', {
                before: formatBytes(estimate.imageBytes),
                after: formatBytes(estimate.estimatedImageBytes),
                count: estimate.processableImages,
              })}
            </Text>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
