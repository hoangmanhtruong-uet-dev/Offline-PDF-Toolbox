import { useState } from 'react';

import {
  Button,
  Dropdown,
  Field,
  Input,
  Option,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { ArrowRotateClockwiseRegular, DeleteRegular } from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';

import { FeatureGate } from '@shared/features';

import { ActionBar } from '../../components/ActionBar';
import { AppShell } from '../../components/AppShell';
import { DropZone } from '../../components/DropZone';
import { OptionsPanel } from '../../components/OptionsPanel';
import { ResultSummary, TaskErrorBanner } from '../../components/ResultSummary';
import { UpsellBanner } from '../../components/UpsellBanner';
import { useI18n } from '../../i18n';
import type { MessageKey } from '../../i18n';
import { useShortcuts } from '../../hooks/useShortcuts';
import { useAppStore } from '../../state/appStore';
import { useImagesStore } from '../../state/imagesStore';
import { useTaskStore } from '../../state/taskStore';
import { appTokens } from '../../styles/tokens';

/**
 * Công cụ Ảnh sang PDF (F-06).
 *
 * Người dùng thêm ảnh, sắp xếp thứ tự, chọn khổ giấy và lề, rồi lưu thành
 * một tệp PDF — mỗi ảnh một trang, giữ nguyên tỷ lệ.
 */
const useStyles = makeStyles({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: appTokens.spacing.l,
  },
  list: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
    gap: appTokens.spacing.m,
  },
  item: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: appTokens.spacing.xs,
    padding: appTokens.spacing.s,
    borderRadius: appTokens.radius.md,
    backgroundColor: tokens.colorNeutralBackground1,
    cursor: 'grab',
  },
  thumb: {
    width: '100%',
    maxWidth: '120px',
    aspectRatio: '3 / 4',
    objectFit: 'contain',
    borderRadius: appTokens.radius.sm,
    backgroundColor: tokens.colorNeutralBackground3,
  },
  name: {
    fontSize: appTokens.fontSize.sm,
    color: tokens.colorNeutralForeground1,
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  meta: {
    fontSize: appTokens.fontSize.xs,
    color: tokens.colorNeutralForeground3,
  },
  actions: {
    display: 'flex',
    gap: appTokens.spacing.xxs,
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
});

/** Nhãn của từng lựa chọn. */
const PAPER_LABELS = {
  fit: 'images.paperFit',
  a4: 'images.paperA4',
  letter: 'images.paperLetter',
} as const;

const MARGIN_LABELS = {
  0: 'images.margin0',
  10: 'images.margin10',
  20: 'images.margin20',
} as const;

const QUALITY_LABELS = {
  original: 'images.qualityOriginal',
  compressed: 'images.qualityCompressed',
} as const;

export function ImagesScreen(): React.JSX.Element {
  const styles = useStyles();
  const { t } = useI18n();
  const navigate = useNavigate();

  const images = useImagesStore((state) => state.images);
  const addImages = useImagesStore((state) => state.addImages);
  const removeImage = useImagesStore((state) => state.removeImage);
  const rotateImage = useImagesStore((state) => state.rotateImage);
  const moveImage = useImagesStore((state) => state.moveImage);
  const loadThumbnail = useImagesStore((state) => state.loadThumbnail);
  const clear = useImagesStore((state) => state.clear);

  const license = useAppStore((state) => state.license);
  const appInfo = useAppStore((state) => state.appInfo);
  const running = useTaskStore((state) => state.running);
  const progress = useTaskStore((state) => state.progress);
  const result = useTaskStore((state) => state.result);
  const error = useTaskStore((state) => state.error);
  const start = useTaskStore((state) => state.start);
  const cancel = useTaskStore((state) => state.cancel);
  const clearResult = useTaskStore((state) => state.clear);

  const [paperSize, setPaperSize] = useState<'fit' | 'a4' | 'letter'>('a4');
  const [marginMm, setMarginMm] = useState<0 | 10 | 20>(10);
  const [quality, setQuality] = useState<'original' | 'compressed'>('original');
  const [outputName, setOutputName] = useState('Images');
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);

  const isRunning = running?.kind === 'images';

  useShortcuts({
    onOpenFiles: () => {
      void window.optb.files.pick().then((metas) => {
        const list = metas as { path: string; name: string }[];
        void addImages(
          list.map((item) => item.path),
          list.map((item) => item.name),
        );
      });
    },
    onOpenTool: (toolId) => navigate(`/tools/${toolId}`),
    onOpenSettings: () => navigate('/settings'),
  });

  const convert = async (): Promise<void> => {
    setLimitMessage(null);

    const gate = FeatureGate.forLicense(license.isPro);
    const decision = gate.check('images', { images: images.length });
    if (!decision.allowed) {
      setLimitMessage(decision.messageKey);
      return;
    }

    const directory = images[0]?.path
      ? images[0].path.slice(0, Math.max(images[0].path.lastIndexOf('\\'), images[0].path.lastIndexOf('/')))
      : '';

    await start('images', {
      images: images.map((image) => ({ path: image.path, rotation: image.rotation })),
      paperSize,
      marginMm,
      quality,
      outputDirectory: directory,
      outputName: outputName.trim() || 'Images',
    });
  };

  const footer = result ? (
    <ResultSummary
      outputPath={result.outputPaths[0] ?? ''}
      outputDirectory=""
      pageCount={result.details?.pageCount ?? images.length}
      onDismiss={clearResult}
    />
  ) : limitMessage ? (
    <UpsellBanner messageKey={limitMessage} />
  ) : null;

  return (
    <AppShell
      title={t('home.tool.images')}
      onBack={() => navigate('/')}
      options={
        <OptionsPanel>
          <div className={styles.field}>
            <span className={styles.label}>{t('images.paper')}</span>
            <Field>
              <Dropdown
                aria-label={t('images.paper')}
                value={t(PAPER_LABELS[paperSize] as MessageKey)}
                selectedOptions={[paperSize]}
                onOptionSelect={(_event, data) => {
                  if (data.optionValue) {
                    setPaperSize(data.optionValue as 'fit' | 'a4' | 'letter');
                  }
                }}
              >
                <Option value="fit">{t('images.paperFit')}</Option>
                <Option value="a4">{t('images.paperA4')}</Option>
                <Option value="letter">{t('images.paperLetter')}</Option>
              </Dropdown>
            </Field>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>{t('images.margin')}</span>
            <Field>
              <Dropdown
                aria-label={t('images.margin')}
                value={t(MARGIN_LABELS[marginMm] as MessageKey)}
                selectedOptions={[String(marginMm)]}
                onOptionSelect={(_event, data) => {
                  const value = Number(data.optionValue);
                  if (value === 0 || value === 10 || value === 20) setMarginMm(value);
                }}
              >
                <Option value="0">{t('images.margin0')}</Option>
                <Option value="10">{t('images.margin10')}</Option>
                <Option value="20">{t('images.margin20')}</Option>
              </Dropdown>
            </Field>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>{t('images.quality')}</span>
            <Field>
              <Dropdown
                aria-label={t('images.quality')}
                value={t(QUALITY_LABELS[quality] as MessageKey)}
                selectedOptions={[quality]}
                onOptionSelect={(_event, data) => {
                  if (data.optionValue) {
                    setQuality(data.optionValue as 'original' | 'compressed');
                  }
                }}
              >
                <Option value="original">{t('images.qualityOriginal')}</Option>
                <Option value="compressed">{t('images.qualityCompressed')}</Option>
              </Dropdown>
            </Field>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>{t('merge.outputName')}</span>
            <Input
              value={outputName}
              onChange={(_event, data) => setOutputName(data.value)}
              data-testid="output-name"
            />
          </div>

          <span className={styles.hint}>
            {t('images.hint', { version: appInfo?.appVersion ?? '-' })}
          </span>
        </OptionsPanel>
      }
      footer={
        footer ?? (
          <ActionBar
            actionLabel={t('images.run')}
            onAction={() => void convert()}
            disabled={images.length === 0 || isRunning}
            running={isRunning}
            progressPercent={progress?.percent ?? 0}
            onCancel={() => void cancel()}
            summary={
              images.length > 0 ? t('files.selected', { count: images.length }) : undefined
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

        {images.length === 0 ? (
          <DropZone
            onFiles={(metas) => {
              void addImages(
                metas.map((meta) => meta.path),
                metas.map((meta) => meta.name),
              );
            }}
            title={t('images.add')}
            hint={t('images.accept')}
            compact
            accept="image"
          />
        ) : (
          <>
            <div className={styles.list} data-testid="image-list">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className={styles.item}
                  data-testid={`image-item-${index + 1}`}
                  draggable
                  onDragStart={(event) => {
                    setDragFrom(index);
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', String(index));
                  }}
                  onDragEnd={() => setDragFrom(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const from = dragFrom ?? Number.parseInt(event.dataTransfer.getData('text/plain'), 10);
                    if (Number.isInteger(from) && from !== index) moveImage(from, index);
                    setDragFrom(null);
                  }}
                  ref={() => void loadThumbnail(index)}
                >
                  {image.thumbnail ? (
                    <img className={styles.thumb} src={image.thumbnail} alt="" />
                  ) : (
                    <span className={styles.thumb} />
                  )}
                  <span className={styles.name} title={image.path}>
                    {image.name}
                  </span>
                  <span className={styles.meta}>
                    {image.width}×{image.height}
                    {image.rotation ? ` · ${image.rotation}°` : ''}
                  </span>
                  <span className={styles.actions}>
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<ArrowRotateClockwiseRegular />}
                      aria-label={t('images.rotate')}
                      onClick={(event) => {
                        event.stopPropagation();
                        rotateImage(index);
                      }}
                      data-testid={`rotate-image-${index + 1}`}
                    />
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<DeleteRegular />}
                      aria-label={t('images.remove')}
                      onClick={(event) => {
                        event.stopPropagation();
                        removeImage(index);
                      }}
                      data-testid={`remove-image-${index + 1}`}
                    />
                  </span>
                </div>
              ))}
            </div>

            <Button appearance="subtle" onClick={clear}>
              {t('files.clear')}
            </Button>
          </>
        )}
      </div>
    </AppShell>
  );
}
