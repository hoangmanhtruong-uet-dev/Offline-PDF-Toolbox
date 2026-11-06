import { useState } from 'react';

import { Dropdown, Field, Input, Option, Slider } from '@fluentui/react-components';

import { FeatureGate } from '@shared/features';
import { OUTPUT_TEMPLATES } from '@shared/naming';
import type { PageNumberPosition } from '@shared/tasks';

import { ActionBar } from '../../components/ActionBar';
import { AppShell } from '../../components/AppShell';
import { OptionsPanel } from '../../components/OptionsPanel';
import { ResultSummary, TaskErrorBanner } from '../../components/ResultSummary';
import { UpsellBanner } from '../../components/UpsellBanner';
import { useI18n } from '../../i18n';
import type { MessageKey } from '../../i18n';
import { useAppStore } from '../../state/appStore';
import { useTaskStore } from '../../state/taskStore';
import { SingleFilePicker, baseNameOf, directoryOf, useExtraStyles, useSinglePdf } from './shared';

/**
 * Công cụ Đóng dấu chữ chìm và Đánh số trang.
 *
 * Bản Free xử lý tối đa 10 trang mỗi lần; Pro không giới hạn.
 */
const POSITIONS: PageNumberPosition[] = ['none', 'bottom-center', 'bottom-right', 'bottom-left', 'top-right'];

export function StampScreen(): React.JSX.Element {
  const styles = useExtraStyles();
  const { t } = useI18n();
  const { file, setFile, clear } = useSinglePdf();

  const license = useAppStore((state) => state.license);
  const running = useTaskStore((state) => state.running);
  const progress = useTaskStore((state) => state.progress);
  const result = useTaskStore((state) => state.result);
  const error = useTaskStore((state) => state.error);
  const start = useTaskStore((state) => state.start);
  const cancel = useTaskStore((state) => state.cancel);
  const clearResult = useTaskStore((state) => state.clear);

  const [text, setText] = useState('');
  const [opacity, setOpacity] = useState(25);
  const [position, setPosition] = useState<PageNumberPosition>('bottom-center');
  const [format, setFormat] = useState<'n' | 'n-of-total'>('n-of-total');
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [needInput, setNeedInput] = useState(false);

  const isRunning = running?.kind === 'stamp';

  const run = async (): Promise<void> => {
    setLimitMessage(null);
    setNeedInput(false);
    if (!file) return;

    if (text.trim().length === 0 && position === 'none') {
      setNeedInput(true);
      return;
    }

    const decision = FeatureGate.forLicense(license.isPro).check('stamp', { pages: file.pageCount ?? 0 });
    if (!decision.allowed) {
      setLimitMessage(decision.messageKey);
      return;
    }

    await start('stamp', {
      path: file.path,
      watermarkText: text,
      watermarkOpacity: opacity / 100,
      pageNumbers: position,
      pageNumberFormat: format,
      outputDirectory: directoryOf(file.path),
      outputName: OUTPUT_TEMPLATES.stamped.replace('{name}', baseNameOf(file)),
    });
  };

  const footer = result ? (
    <ResultSummary
      outputPath={result.outputPaths[0] ?? ''}
      outputDirectory={directoryOf(result.outputPaths[0] ?? '')}
      pageCount={file?.pageCount ?? 0}
      onDismiss={clearResult}
    />
  ) : limitMessage ? (
    <UpsellBanner messageKey={limitMessage} vars={{ limit: FeatureGate.forLicense(false).limits.stamp.maxPages }} />
  ) : null;

  return (
    <AppShell
      title={t('home.tool.stamp')}
      onBack={() => {
        window.location.hash = '#/';
      }}
      options={
        <OptionsPanel>
          <div className={styles.field}>
            <span className={styles.label}>{t('ex.stamp.watermark')}</span>
            <Input
              value={text}
              placeholder="CONFIDENTIAL"
              onChange={(_event, data) => setText(data.value)}
              data-testid="stamp-text"
            />
            <span className={styles.hint}>{t('ex.stamp.watermarkHint')}</span>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>{t('ex.stamp.opacity')}</span>
            <Slider
              min={5}
              max={100}
              step={5}
              value={opacity}
              onChange={(_event, data) => setOpacity(data.value)}
              aria-label={t('ex.stamp.opacity')}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>{t('ex.stamp.numbers')}</span>
            <Field>
              <Dropdown
                aria-label={t('ex.stamp.numbers')}
                value={t(`ex.stamp.pos.${position}` as MessageKey)}
                selectedOptions={[position]}
                onOptionSelect={(_event, data) => {
                  if (data.optionValue) setPosition(data.optionValue as PageNumberPosition);
                }}
              >
                {POSITIONS.map((item) => (
                  <Option key={item} value={item}>
                    {t(`ex.stamp.pos.${item}` as MessageKey)}
                  </Option>
                ))}
              </Dropdown>
            </Field>
          </div>

          {position !== 'none' ? (
            <div className={styles.field}>
              <span className={styles.label}>{t('ex.stamp.format')}</span>
              <Field>
                <Dropdown
                  aria-label={t('ex.stamp.format')}
                  value={format === 'n' ? t('ex.stamp.formatN') : t('ex.stamp.formatTotal')}
                  selectedOptions={[format]}
                  onOptionSelect={(_event, data) => {
                    if (data.optionValue) setFormat(data.optionValue as 'n' | 'n-of-total');
                  }}
                >
                  <Option value="n">{t('ex.stamp.formatN')}</Option>
                  <Option value="n-of-total">{t('ex.stamp.formatTotal')}</Option>
                </Dropdown>
              </Field>
            </div>
          ) : null}
        </OptionsPanel>
      }
      footer={
        footer ?? (
          <ActionBar
            actionLabel={t('ex.stamp.run')}
            onAction={() => void run()}
            disabled={!file || file.state !== 'ready' || isRunning}
            running={isRunning}
            progressPercent={progress?.percent ?? 0}
            onCancel={() => void cancel()}
            summary={file ? `${file.name} · ${t('ex.pagesOf', { count: file.pageCount ?? 0 })}` : undefined}
          />
        )
      }
    >
      <div className={styles.stack}>
        {error ? (
          <TaskErrorBanner messageKey={error.messageKey} files={error.files} onDismiss={clearResult} />
        ) : null}
        {needInput ? <TaskErrorBanner messageKey="ex.stamp.needInput" onDismiss={() => setNeedInput(false)} /> : null}
        <SingleFilePicker file={file} onPick={setFile} onClear={clear} testId="stamp-file" />
      </div>
    </AppShell>
  );
}
