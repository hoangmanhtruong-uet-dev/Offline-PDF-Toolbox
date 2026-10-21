import { useState } from 'react';

import { Button, Dropdown, Field, Input, Option, Text, makeStyles, tokens } from '@fluentui/react-components';

import { FeatureGate } from '@shared/features';
import { OUTPUT_TEMPLATES } from '@shared/naming';
import type { PageSelection, RotateAngle } from '@shared/tasks';

import { ActionBar } from '../../components/ActionBar';
import { AppShell } from '../../components/AppShell';
import { DropZone } from '../../components/DropZone';
import { OptionsPanel } from '../../components/OptionsPanel';
import { ResultSummary, TaskErrorBanner } from '../../components/ResultSummary';
import { UpsellBanner } from '../../components/UpsellBanner';
import { useI18n } from '../../i18n';
import type { MessageKey } from '../../i18n';
import { useAppStore } from '../../state/appStore';
import { useRotateStore } from '../../state/rotateStore';
import { useTaskStore } from '../../state/taskStore';

/**
 * Công cụ Xoay PDF (F-04).
 *
 * Xoay được thực hiện bằng thuộc tính `/Rotate` của trang: góc được cộng
 * vào giá trị sẵn có theo modulo 360, nên nội dung trang không thay đổi.
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
});

/** Các kiểu chọn trang. */
type SelectionKind = PageSelection['kind'];

/** Nhãn hiển thị của từng kiểu chọn trang. */
const SELECTION_LABELS: Record<SelectionKind, MessageKey> = {
  all: 'rotate.all',
  odd: 'rotate.odd',
  even: 'rotate.even',
  range: 'rotate.range',
};

export function RotateScreen(): React.JSX.Element {
  const styles = useStyles();
  const { t } = useI18n();
  const file = useRotateStore((state) => state.file);
  const setFile = useRotateStore((state) => state.setFile);
  const clearFile = useRotateStore((state) => state.clear);

  const license = useAppStore((state) => state.license);
  const running = useTaskStore((state) => state.running);
  const progress = useTaskStore((state) => state.progress);
  const result = useTaskStore((state) => state.result);
  const error = useTaskStore((state) => state.error);
  const start = useTaskStore((state) => state.start);
  const cancel = useTaskStore((state) => state.cancel);
  const clearResult = useTaskStore((state) => state.clear);

  const [selectionKind, setSelectionKind] = useState<SelectionKind>('all');
  const [range, setRange] = useState('');
  const [angle, setAngle] = useState<RotateAngle>(90);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [signatureWarning, setSignatureWarning] = useState(false);

  const isRunning = running?.kind === 'rotate';

  const summary = file
    ? `${file.name} · ${t('files.pages', { count: file.pageCount ?? 0 })}`
    : undefined;

  const runRotate = async (): Promise<void> => {
    setLimitMessage(null);

    if (!file) return;

    const gate = FeatureGate.forLicense(license.isPro);
    const decision = gate.check('rotate', {
      files: 1,
      pages: file.pageCount ?? 0,
    });
    if (!decision.allowed) {
      setLimitMessage(decision.messageKey);
      return;
    }

    if (file.hasSignature && !signatureWarning) {
      setSignatureWarning(true);
      return;
    }

    const pageSelection: PageSelection =
      selectionKind === 'range' ? { kind: 'range', range } : { kind: selectionKind };

    const separator = Math.max(file.path.lastIndexOf('\\'), file.path.lastIndexOf('/'));

    await start('rotate', {
      path: file.path,
      pageSelection,
      angle,
      outputDirectory: separator > 0 ? file.path.slice(0, separator) : '',
      outputName: OUTPUT_TEMPLATES.rotated.replace('{name}', file.name.replace(/\.pdf$/i, '')),
    });
  };

  const footer = result ? (
    <ResultSummary
      outputPath={result.outputPaths[0] ?? ''}
      outputDirectory=""
      pageCount={file?.pageCount ?? 0}
      onDismiss={clearResult}
    />
  ) : limitMessage ? (
    <UpsellBanner messageKey={limitMessage} />
  ) : null;

  return (
    <AppShell
      title={t('home.tool.rotate')}
      onBack={() => {
        window.location.hash = '#/';
      }}
      options={
        <OptionsPanel>
          <div className={styles.field}>
            <span className={styles.label}>{t('rotate.selection')}</span>
            <Field>
              <Dropdown
                aria-label={t('rotate.selection')}
                value={t(SELECTION_LABELS[selectionKind])}
                selectedOptions={[selectionKind]}
                onOptionSelect={(_event, data) => {
                  if (data.optionValue) setSelectionKind(data.optionValue as SelectionKind);
                }}
              >
                <Option value="all">{t('rotate.all')}</Option>
                <Option value="odd">{t('rotate.odd')}</Option>
                <Option value="even">{t('rotate.even')}</Option>
                <Option value="range">{t('rotate.range')}</Option>
              </Dropdown>
            </Field>
          </div>

          {selectionKind === 'range' ? (
            <div className={styles.field}>
              <span className={styles.label}>{t('rotate.range')}</span>
              <Input
                value={range}
                placeholder="1-3, 7"
                onChange={(_event, data) => setRange(data.value)}
                data-testid="rotate-range"
              />
              <span className={styles.hint}>{t('merge.rangeHint')}</span>
            </div>
          ) : null}

          <div className={styles.field}>
            <span className={styles.label}>{t('rotate.angle')}</span>
            <Field>
              <Dropdown
                aria-label={t('rotate.angle')}
                value={String(angle)}
                selectedOptions={[String(angle)]}
                onOptionSelect={(_event, data) => {
                  if (data.optionValue) setAngle(Number(data.optionValue) as RotateAngle);
                }}
              >
                <Option value="90">{t('rotate.angle90')}</Option>
                <Option value="180">{t('rotate.angle180')}</Option>
                <Option value="270">{t('rotate.angle270')}</Option>
              </Dropdown>
            </Field>
          </div>
        </OptionsPanel>
      }
      footer={
        footer ?? (
          <ActionBar
            actionLabel={t('rotate.run')}
            onAction={() => void runRotate()}
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
            <Button appearance="primary" onClick={() => void runRotate()}>
              {t('signature.continue')}
            </Button>
          </div>
        ) : null}

        {file ? (
          <div className={styles.current} data-testid="rotate-file">
            {file.thumbnail ? (
              <img
                src={file.thumbnail}
                alt=""
                style={{ width: '48px', height: '64px', borderRadius: '4px' }}
              />
            ) : null}
            <span className={styles.currentName}>{file.name}</span>
            <Text className={styles.hint}>{t('files.pages', { count: file.pageCount ?? 0 })}</Text>
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
      </div>
    </AppShell>
  );
}
