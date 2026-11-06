import { useState } from 'react';

import { Checkbox, Dropdown, Field, Input, MessageBar, MessageBarBody, Option } from '@fluentui/react-components';

import { FeatureGate } from '@shared/features';
import { OUTPUT_TEMPLATES } from '@shared/naming';

import { ActionBar } from '../../components/ActionBar';
import { AppShell } from '../../components/AppShell';
import { OptionsPanel } from '../../components/OptionsPanel';
import { ResultSummary, TaskErrorBanner } from '../../components/ResultSummary';
import { UpsellBanner } from '../../components/UpsellBanner';
import { useI18n } from '../../i18n';
import { useAppStore } from '../../state/appStore';
import { useTaskStore } from '../../state/taskStore';
import { SingleFilePicker, baseNameOf, directoryOf, useExtraStyles, useSinglePdf } from './shared';

/**
 * Công cụ đặt và gỡ mật khẩu (chỉ Pro). Mã hóa AES-256 bằng qpdf.
 */
export function ProtectScreen(): React.JSX.Element {
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

  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [noPrint, setNoPrint] = useState(false);
  const [noCopy, setNoCopy] = useState(false);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [mismatch, setMismatch] = useState(false);

  const isRunning = running?.kind === 'protect';
  const isPro = license.isPro;

  const run = async (): Promise<void> => {
    setLimitMessage(null);
    setMismatch(false);
    if (!file || password.length === 0) return;

    const decision = FeatureGate.forLicense(isPro).check('password');
    if (!decision.allowed) {
      setLimitMessage(decision.messageKey);
      return;
    }

    if (mode === 'encrypt' && password !== confirm) {
      setMismatch(true);
      return;
    }

    const template = mode === 'encrypt' ? OUTPUT_TEMPLATES.protected : OUTPUT_TEMPLATES.unlocked;
    await start('protect', {
      path: file.path,
      mode,
      password,
      disablePrinting: noPrint,
      disableCopying: noCopy,
      outputDirectory: directoryOf(file.path),
      outputName: template.replace('{name}', baseNameOf(file)),
    });
    // Xóa mật khẩu khỏi bộ nhớ giao diện ngay sau khi gửi đi.
    setPassword('');
    setConfirm('');
  };

  return (
    <AppShell
      title={t('home.tool.protect')}
      onBack={() => {
        window.location.hash = '#/';
      }}
      options={
        <OptionsPanel>
          <div className={styles.field}>
            <span className={styles.label}>{t('ex.protect.mode')}</span>
            <Field>
              <Dropdown
                aria-label={t('ex.protect.mode')}
                value={mode === 'encrypt' ? t('ex.protect.encrypt') : t('ex.protect.decrypt')}
                selectedOptions={[mode]}
                onOptionSelect={(_event, data) => {
                  if (data.optionValue) setMode(data.optionValue as 'encrypt' | 'decrypt');
                }}
              >
                <Option value="encrypt">{t('ex.protect.encrypt')}</Option>
                <Option value="decrypt">{t('ex.protect.decrypt')}</Option>
              </Dropdown>
            </Field>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>{t('ex.protect.password')}</span>
            <Input
              type="password"
              value={password}
              onChange={(_event, data) => setPassword(data.value)}
              data-testid="protect-password"
            />
          </div>

          {mode === 'encrypt' ? (
            <>
              <div className={styles.field}>
                <span className={styles.label}>{t('ex.protect.confirm')}</span>
                <Input
                  type="password"
                  value={confirm}
                  onChange={(_event, data) => setConfirm(data.value)}
                  data-testid="protect-confirm"
                />
              </div>
              <Checkbox
                checked={noPrint}
                onChange={(_event, data) => setNoPrint(Boolean(data.checked))}
                label={t('ex.protect.noPrint')}
              />
              <Checkbox
                checked={noCopy}
                onChange={(_event, data) => setNoCopy(Boolean(data.checked))}
                label={t('ex.protect.noCopy')}
              />
              <span className={styles.hint}>{t('ex.protect.warn')}</span>
            </>
          ) : null}
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
        ) : limitMessage ? (
          <UpsellBanner messageKey={limitMessage} />
        ) : (
          <ActionBar
            actionLabel={t('ex.protect.run')}
            onAction={() => void run()}
            disabled={!file || password.length === 0 || isRunning}
            running={isRunning}
            progressPercent={progress?.percent ?? 0}
            onCancel={() => void cancel()}
            summary={file ? file.name : undefined}
          />
        )
      }
    >
      <div className={styles.stack}>
        {!isPro ? (
          <MessageBar intent="warning">
            <MessageBarBody>{t('ex.proOnly')}</MessageBarBody>
          </MessageBar>
        ) : null}
        {error ? (
          <TaskErrorBanner messageKey={error.messageKey} files={error.files} onDismiss={clearResult} />
        ) : null}
        {mismatch ? <TaskErrorBanner messageKey="ex.protect.mismatch" onDismiss={() => setMismatch(false)} /> : null}
        <SingleFilePicker file={file} onPick={setFile} onClear={clear} testId="protect-file" />
      </div>
    </AppShell>
  );
}
