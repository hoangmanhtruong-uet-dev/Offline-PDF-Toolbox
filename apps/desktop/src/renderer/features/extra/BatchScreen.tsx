import { useState } from 'react';

import {
  Button,
  Dropdown,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Option,
  Slider,
  makeStyles,
  tokens,
} from '@fluentui/react-components';

import { FeatureGate } from '@shared/features';
import type { BatchOperation, PageNumberPosition } from '@shared/tasks';
import type { CompressionLevel, FileMeta } from '@shared/types';

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
import { appTokens } from '../../styles/tokens';
import { directoryOf, useExtraStyles } from './shared';

/**
 * Xử lý hàng loạt và preset (chỉ Pro).
 *
 * Chọn nhiều tệp PDF, chọn một thao tác, chạy lần lượt cho cả lô. Cấu hình
 * thao tác có thể lưu thành preset để dùng lại; preset nằm trong bộ nhớ cục
 * bộ của ứng dụng trên máy này, không gửi đi đâu.
 */
type OperationKind = BatchOperation['kind'];

interface PresetConfig {
  kind: OperationKind;
  level: CompressionLevel;
  watermark: string;
  opacity: number;
  position: PageNumberPosition;
}

interface Preset {
  id: string;
  name: string;
  config: PresetConfig;
}

const STORAGE_KEY = 'optb.presets.v1';
const KINDS: OperationKind[] = ['compress', 'rotate', 'stamp', 'privacy', 'protect'];
const LEVELS: CompressionLevel[] = ['light', 'medium', 'strong'];

function loadPresets(): Preset[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Preset[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePresets(presets: Preset[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch {
    // Bộ nhớ cục bộ bị chặn: preset chỉ tồn tại trong phiên này.
  }
}

const useStyles = makeStyles({
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalS,
    paddingInline: tokens.spacingHorizontalL,
    borderRadius: appTokens.radius.lg,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  rowName: {
    flexGrow: 1,
    fontWeight: tokens.fontWeightSemibold,
    wordBreak: 'break-all',
  },
  presetRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
});

export function BatchScreen(): React.JSX.Element {
  const styles = useStyles();
  const shared = useExtraStyles();
  const { t } = useI18n();

  const license = useAppStore((state) => state.license);
  const running = useTaskStore((state) => state.running);
  const progress = useTaskStore((state) => state.progress);
  const result = useTaskStore((state) => state.result);
  const error = useTaskStore((state) => state.error);
  const start = useTaskStore((state) => state.start);
  const cancel = useTaskStore((state) => state.cancel);
  const clearResult = useTaskStore((state) => state.clear);

  const [files, setFiles] = useState<FileMeta[]>([]);
  const [kind, setKind] = useState<OperationKind>('compress');
  const [level, setLevel] = useState<CompressionLevel>('medium');
  const [watermark, setWatermark] = useState('');
  const [opacity, setOpacity] = useState(25);
  const [position, setPosition] = useState<PageNumberPosition>('bottom-center');
  const [password, setPassword] = useState('');
  const [outputDirectory, setOutputDirectory] = useState('');
  const [presets, setPresets] = useState<Preset[]>(loadPresets);
  const [presetName, setPresetName] = useState('');
  const [limitMessage, setLimitMessage] = useState<string | null>(null);

  const isRunning = running?.kind === 'batch';
  const isPro = license.isPro;

  const addFiles = (metas: FileMeta[]): void => {
    setFiles((current) => {
      const known = new Set(current.map((item) => item.path));
      return [...current, ...metas.filter((meta) => !known.has(meta.path))];
    });
  };

  const buildOperation = (): BatchOperation => {
    switch (kind) {
      case 'compress':
        return { kind, level };
      case 'rotate':
        return { kind, angle: 90 };
      case 'stamp':
        return { kind, watermarkText: watermark, watermarkOpacity: opacity / 100, pageNumbers: position };
      case 'privacy':
        return { kind };
      case 'protect':
        return { kind, password };
    }
  };

  const canRun =
    files.length > 0 &&
    !isRunning &&
    (kind !== 'protect' || password.length > 0) &&
    (kind !== 'stamp' || watermark.trim().length > 0 || position !== 'none');

  const run = async (): Promise<void> => {
    setLimitMessage(null);
    const decision = FeatureGate.forLicense(isPro).check('batch');
    if (!decision.allowed) {
      setLimitMessage(decision.messageKey);
      return;
    }
    await start('batch', {
      paths: files.map((item) => item.path),
      operation: buildOperation(),
      outputDirectory,
    });
    setPassword('');
  };

  const chooseFolder = async (): Promise<void> => {
    const folder = await window.optb.files.pickFolder();
    if (folder) setOutputDirectory(folder);
  };

  const saveCurrentPreset = (): void => {
    const decision = FeatureGate.forLicense(isPro).check('presets');
    if (!decision.allowed) {
      setLimitMessage(decision.messageKey);
      return;
    }
    const name = presetName.trim();
    if (!name) return;

    const next: Preset[] = [
      ...presets,
      {
        id: `${Date.now().toString(36)}-${presets.length}`,
        name,
        // Mật khẩu không bao giờ được lưu trong preset.
        config: { kind, level, watermark, opacity, position },
      },
    ];
    setPresets(next);
    savePresets(next);
    setPresetName('');
  };

  const applyPreset = (preset: Preset): void => {
    setKind(preset.config.kind);
    setLevel(preset.config.level);
    setWatermark(preset.config.watermark);
    setOpacity(preset.config.opacity);
    setPosition(preset.config.position);
  };

  const deletePreset = (id: string): void => {
    const next = presets.filter((item) => item.id !== id);
    setPresets(next);
    savePresets(next);
  };

  const footer = result ? (
    <ResultSummary
      outputPath={result.outputPaths[0] ?? ''}
      outputPaths={result.outputPaths}
      outputDirectory={directoryOf(result.outputPaths[0] ?? '')}
      pageCount={result.outputPaths.length}
      note={
        files.length > result.outputPaths.length
          ? t('ex.batch.skipped', { count: files.length - result.outputPaths.length })
          : undefined
      }
      onDismiss={clearResult}
    />
  ) : limitMessage ? (
    <UpsellBanner messageKey={limitMessage} />
  ) : null;

  return (
    <AppShell
      title={t('home.tool.batch')}
      onBack={() => {
        window.location.hash = '#/';
      }}
      options={
        <OptionsPanel>
          <div className={shared.field}>
            <span className={shared.label}>{t('ex.batch.action')}</span>
            <Field>
              <Dropdown
                aria-label={t('ex.batch.action')}
                value={t(`ex.batch.${kind}` as MessageKey)}
                selectedOptions={[kind]}
                onOptionSelect={(_event, data) => {
                  if (data.optionValue) setKind(data.optionValue as OperationKind);
                }}
              >
                {KINDS.map((item) => (
                  <Option key={item} value={item}>
                    {t(`ex.batch.${item}` as MessageKey)}
                  </Option>
                ))}
              </Dropdown>
            </Field>
          </div>

          {kind === 'compress' ? (
            <div className={shared.field}>
              <span className={shared.label}>{t('ex.batch.level')}</span>
              <Field>
                <Dropdown
                  aria-label={t('ex.batch.level')}
                  value={t(`ex.batch.level.${level}` as MessageKey)}
                  selectedOptions={[level]}
                  onOptionSelect={(_event, data) => {
                    if (data.optionValue) setLevel(data.optionValue as CompressionLevel);
                  }}
                >
                  {LEVELS.map((item) => (
                    <Option key={item} value={item}>
                      {t(`ex.batch.level.${item}` as MessageKey)}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
            </div>
          ) : null}

          {kind === 'stamp' ? (
            <>
              <div className={shared.field}>
                <span className={shared.label}>{t('ex.stamp.watermark')}</span>
                <Input value={watermark} onChange={(_event, data) => setWatermark(data.value)} />
              </div>
              <div className={shared.field}>
                <span className={shared.label}>{t('ex.stamp.opacity')}</span>
                <Slider
                  min={5}
                  max={100}
                  step={5}
                  value={opacity}
                  onChange={(_event, data) => setOpacity(data.value)}
                  aria-label={t('ex.stamp.opacity')}
                />
              </div>
              <div className={shared.field}>
                <span className={shared.label}>{t('ex.stamp.numbers')}</span>
                <Field>
                  <Dropdown
                    aria-label={t('ex.stamp.numbers')}
                    value={t(`ex.stamp.pos.${position}` as MessageKey)}
                    selectedOptions={[position]}
                    onOptionSelect={(_event, data) => {
                      if (data.optionValue) setPosition(data.optionValue as PageNumberPosition);
                    }}
                  >
                    {(['none', 'bottom-center', 'bottom-right', 'bottom-left', 'top-right'] as const).map((item) => (
                      <Option key={item} value={item}>
                        {t(`ex.stamp.pos.${item}` as MessageKey)}
                      </Option>
                    ))}
                  </Dropdown>
                </Field>
              </div>
            </>
          ) : null}

          {kind === 'protect' ? (
            <div className={shared.field}>
              <span className={shared.label}>{t('ex.protect.password')}</span>
              <Input type="password" value={password} onChange={(_event, data) => setPassword(data.value)} />
              <span className={shared.hint}>{t('ex.protect.warn')}</span>
            </div>
          ) : null}

          <div className={shared.field}>
            <span className={shared.label}>{t('ex.batch.outputFolder')}</span>
            <span className={shared.hint}>{outputDirectory || t('ex.batch.sameFolder')}</span>
            <div className={styles.presetRow}>
              <Button size="small" shape="circular" onClick={() => void chooseFolder()}>
                {t('ex.batch.chooseFolder')}
              </Button>
              {outputDirectory ? (
                <Button size="small" shape="circular" appearance="subtle" onClick={() => setOutputDirectory('')}>
                  {t('common.close')}
                </Button>
              ) : null}
            </div>
          </div>

          <div className={shared.field}>
            <span className={shared.label}>{t('ex.batch.presets')}</span>
            {presets.length === 0 ? <span className={shared.hint}>{t('ex.batch.presetEmpty')}</span> : null}
            {presets.map((preset) => (
              <div key={preset.id} className={styles.presetRow} data-testid="preset-row">
                <span className={styles.rowName}>{preset.name}</span>
                <Button size="small" shape="circular" onClick={() => applyPreset(preset)}>
                  {t('ex.batch.presetApply')}
                </Button>
                <Button size="small" shape="circular" appearance="subtle" onClick={() => deletePreset(preset.id)}>
                  {t('ex.batch.presetDelete')}
                </Button>
              </div>
            ))}
            <Input
              value={presetName}
              placeholder={t('ex.batch.presetName')}
              onChange={(_event, data) => setPresetName(data.value)}
              data-testid="preset-name"
            />
            <Button size="small" shape="circular" onClick={saveCurrentPreset} disabled={presetName.trim().length === 0}>
              {t('ex.batch.presetSave')}
            </Button>
          </div>
        </OptionsPanel>
      }
      footer={
        footer ?? (
          <ActionBar
            actionLabel={t('ex.batch.run')}
            onAction={() => void run()}
            disabled={!canRun}
            running={isRunning}
            progressPercent={progress?.percent ?? 0}
            onCancel={() => void cancel()}
            summary={files.length > 0 ? t('ex.batch.files', { count: files.length }) : undefined}
          />
        )
      }
    >
      <div className={shared.stack}>
        {!isPro ? (
          <MessageBar intent="warning">
            <MessageBarBody>{t('ex.proOnly')}</MessageBarBody>
          </MessageBar>
        ) : null}
        {error ? (
          <TaskErrorBanner messageKey={error.messageKey} files={error.files} onDismiss={clearResult} />
        ) : null}

        {files.length === 0 ? (
          <DropZone
            onFiles={addFiles}
            title={t('ex.batch.add')}
            hint={t('ex.batch.empty')}
            compact
          />
        ) : (
          <>
            <div className={styles.list} data-testid="batch-list">
              {files.map((item) => (
                <div key={item.path} className={styles.row}>
                  <span className={styles.rowName}>{item.name}</span>
                  <Button
                    appearance="subtle"
                    size="small"
                    shape="circular"
                    onClick={() => setFiles((current) => current.filter((entry) => entry.path !== item.path))}
                  >
                    {t('files.remove')}
                  </Button>
                </div>
              ))}
            </div>
            <DropZone onFiles={addFiles} title={t('ex.batch.add')} hint={t('home.dropHint')} compact />
          </>
        )}
      </div>
    </AppShell>
  );
}
