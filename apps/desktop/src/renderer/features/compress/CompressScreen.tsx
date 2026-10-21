import { useEffect, useState } from 'react';

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
import { useCompressStore } from '../../state/compressStore';
import { useTaskStore } from '../../state/taskStore';

/**
 * Công cụ Nén PDF (F-03).
 *
 * Ba mức nén theo đặc tả: Nhẹ, Vừa (mặc định) và Mạnh; thêm chế độ
 * **dung lượng đích** — ứng dụng thử lần lượt các mức cho tới khi đạt.
 *
 * Trước khi chạy, ứng dụng ước lượng mức giảm để người dùng biết trước kết quả.
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
  table: {
    display: 'grid',
    gridTemplateColumns: 'auto auto auto',
    gap: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalL}`,
    padding: tokens.spacingVerticalM,
    paddingInline: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  cell: {
    fontSize: tokens.fontSizeBase300,
  },
  header: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
  },
  saving: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorPaletteGreenForeground2,
  },
});

/** Nhãn hiển thị của từng mức nén. */
const LEVEL_LABELS: Record<CompressionLevel, MessageKey> = {
  light: 'compress.levelLight',
  medium: 'compress.levelMedium',
  strong: 'compress.levelStrong',
};

/** Gợi ý ngắn của từng mức nén. */
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
  const [useTarget, setUseTarget] = useState(false);
  const [targetMegabytes, setTargetMegabytes] = useState(1);
  const [outputDirectory, setOutputDirectory] = useState<string | null>(null);
  const [estimateState, setEstimateState] = useState<{
    key: string;
    value: CompressionEstimate | null;
  } | null>(null);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [signatureWarning, setSignatureWarning] = useState(false);

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

    // Tệp có chữ ký số: hỏi trước khi ghi tệp mới.
    if (file.hasSignature && !signatureWarning) {
      setSignatureWarning(true);
      return;
    }

    const baseName = file.name.replace(/\.pdf$/i, '');

    await start('compress', {
      path: file.path,
      level,
      ...(useTarget ? { targetBytes: Math.max(1, targetMegabytes) * 1024 * 1024 } : {}),
      outputDirectory: effectiveDirectory,
      outputName: OUTPUT_TEMPLATES.compressed.replace('{name}', baseName),
    });
  };

  const summary = file
    ? `${file.name} · ${t('files.pages', { count: file.pageCount ?? 0 })}`
    : undefined;

  const details = result?.details;
  const saving =
    details?.originalBytes && details.newBytes
      ? Math.round((1 - details.newBytes / details.originalBytes) * 100)
      : null;

  const footer = result ? (
    <ResultSummary
      outputPath={result.outputPaths[0] ?? ''}
      outputPaths={result.outputPaths}
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
                aria-label={t('compress.level')}
                value={t(LEVEL_LABELS[level])}
                selectedOptions={[level]}
                disabled={useTarget}
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
            <span className={styles.label}>{t('compress.targetSize')}</span>
            <Input
              type="number"
              value={String(targetMegabytes)}
              min={1}
              disabled={!useTarget}
              onChange={(_event, data) => setTargetMegabytes(Math.max(1, Number(data.value) || 1))}
              data-testid="compress-target-size"
            />
            <span className={styles.hint}>{t('compress.targetSizeHint')}</span>
            <Button
              size="small"
              appearance={useTarget ? 'primary' : 'subtle'}
              onClick={() => setUseTarget((value) => !value)}
              data-testid="compress-target-toggle"
            >
              {useTarget ? t('compress.targetOn') : t('compress.targetOff')}
            </Button>
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

        {signatureWarning ? (
          <div className={styles.stack}>
            <TaskErrorBanner
              messageKey="signature.warning"
              onDismiss={() => setSignatureWarning(false)}
            />
            <Button appearance="primary" onClick={() => void runCompress()}>
              {t('signature.continue')}
            </Button>
          </div>
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

        {estimate && !result ? (
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

        {details ? (
          <div className={styles.table} data-testid="compress-result-table">
            <span className={`${styles.cell} ${styles.header}`}>{t('compress.tableMetric')}</span>
            <span className={`${styles.cell} ${styles.header}`}>{t('compress.tableBefore')}</span>
            <span className={`${styles.cell} ${styles.header}`}>{t('compress.tableAfter')}</span>

            <span className={styles.cell}>{t('compress.tableSize')}</span>
            <span className={styles.cell}>{formatBytes(details.originalBytes ?? 0)}</span>
            <span className={styles.cell}>{formatBytes(details.newBytes ?? 0)}</span>

            <span className={styles.cell}>{t('compress.tablePages')}</span>
            <span className={styles.cell}>{file?.pageCount ?? details.pageCount ?? 0}</span>
            <span className={styles.cell}>{details.pageCount ?? 0}</span>

            <span className={styles.cell}>{t('compress.tableImages')}</span>
            <span className={styles.cell}>{t('compress.tableImagesTotal')}</span>
            <span className={styles.cell}>{details.imagesProcessed ?? 0}</span>

            {saving !== null ? (
              <>
                <span className={styles.cell}>{t('compress.tableSaving')}</span>
                <span className={styles.cell} />
                <span className={`${styles.cell} ${styles.saving}`}>{saving}%</span>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
