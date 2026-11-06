import { useState } from 'react';

import { MessageBar, MessageBarBody } from '@fluentui/react-components';

import { OUTPUT_TEMPLATES } from '@shared/naming';

import { ActionBar } from '../../components/ActionBar';
import { AppShell } from '../../components/AppShell';
import { OptionsPanel } from '../../components/OptionsPanel';
import { ResultSummary, TaskErrorBanner } from '../../components/ResultSummary';
import { useI18n } from '../../i18n';
import { useTaskStore } from '../../state/taskStore';
import { SingleFilePicker, baseNameOf, directoryOf, useExtraStyles, useSinglePdf } from './shared';

/**
 * Công cụ xóa thông tin ẩn (siêu dữ liệu) trước khi chia sẻ tệp.
 */
export function PrivacyScreen(): React.JSX.Element {
  const styles = useExtraStyles();
  const { t } = useI18n();
  const { file, setFile, clear } = useSinglePdf();

  const running = useTaskStore((state) => state.running);
  const progress = useTaskStore((state) => state.progress);
  const result = useTaskStore((state) => state.result);
  const error = useTaskStore((state) => state.error);
  const start = useTaskStore((state) => state.start);
  const cancel = useTaskStore((state) => state.cancel);
  const clearResult = useTaskStore((state) => state.clear);

  const [, setTick] = useState(0);
  const isRunning = running?.kind === 'privacy';

  const run = async (): Promise<void> => {
    if (!file) return;
    setTick((value) => value + 1);
    await start('privacy', {
      path: file.path,
      outputDirectory: directoryOf(file.path),
      outputName: OUTPUT_TEMPLATES.cleaned.replace('{name}', baseNameOf(file)),
    });
  };

  return (
    <AppShell
      title={t('home.tool.privacy')}
      onBack={() => {
        window.location.hash = '#/';
      }}
      options={
        <OptionsPanel>
          <span className={styles.hint}>{t('ex.privacy.about')}</span>
        </OptionsPanel>
      }
      footer={
        result ? (
          <ResultSummary
            outputPath={result.outputPaths[0] ?? ''}
            outputDirectory={directoryOf(result.outputPaths[0] ?? '')}
            pageCount={file?.pageCount ?? 0}
            onDismiss={clearResult}
          />
        ) : (
          <ActionBar
            actionLabel={t('ex.privacy.run')}
            onAction={() => void run()}
            disabled={!file || file.state !== 'ready' || isRunning}
            running={isRunning}
            progressPercent={progress?.percent ?? 0}
            onCancel={() => void cancel()}
            summary={file ? file.name : undefined}
          />
        )
      }
    >
      <div className={styles.stack}>
        {error ? (
          <TaskErrorBanner messageKey={error.messageKey} files={error.files} onDismiss={clearResult} />
        ) : null}
        <MessageBar intent="info">
          <MessageBarBody>{t('ex.privacy.about')}</MessageBarBody>
        </MessageBar>
        <SingleFilePicker file={file} onPick={setFile} onClear={clear} testId="privacy-file" />
      </div>
    </AppShell>
  );
}
