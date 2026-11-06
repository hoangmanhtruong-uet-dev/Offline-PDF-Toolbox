import { useRef, useState } from 'react';

import { Dropdown, Field, Option } from '@fluentui/react-components';

import { FeatureGate } from '@shared/features';
import { OUTPUT_TEMPLATES } from '@shared/naming';
import type { ErrorPayload } from '@shared/types';

import { ActionBar } from '../../components/ActionBar';
import { AppShell } from '../../components/AppShell';
import { OptionsPanel } from '../../components/OptionsPanel';
import { ResultSummary, TaskErrorBanner } from '../../components/ResultSummary';
import { UpsellBanner } from '../../components/UpsellBanner';
import { useI18n } from '../../i18n';
import { pdfWorkerClient } from '../../services/pdfWorkerClient';
import { useAppStore } from '../../state/appStore';
import { SingleFilePicker, baseNameOf, directoryOf, useExtraStyles, useSinglePdf } from './shared';

/**
 * Công cụ PDF sang ảnh.
 *
 * Trang được vẽ ở renderer bằng PDF.js (cùng worker với hình thu nhỏ), rồi
 * gửi sang tiến trình chính để ghi vào một thư mục con mới cạnh tệp gốc.
 * Bản Free xuất tối đa 5 trang, rộng 1600 px; Pro không giới hạn trang và
 * xuất được tới 4000 px.
 */
const QUALITIES = [
  { value: '1600', key: 'ex.img.q.normal' },
  { value: '3200', key: 'ex.img.q.high' },
  { value: '4000', key: 'ex.img.q.max' },
] as const;

/** Tải một ảnh từ đường dẫn blob. */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('image-load'));
    image.src = url;
  });
}

export function PdfToImagesScreen(): React.JSX.Element {
  const styles = useExtraStyles();
  const { t } = useI18n();
  const { file, setFile, clear } = useSinglePdf();
  const license = useAppStore((state) => state.license);

  const [format, setFormat] = useState<'png' | 'jpg'>('png');
  const [width, setWidth] = useState('1600');
  const [running, setRunning] = useState(false);
  const [percent, setPercent] = useState(0);
  const [saved, setSaved] = useState<string[] | null>(null);
  const [error, setError] = useState<ErrorPayload | null>(null);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const cancelled = useRef(false);

  const run = async (): Promise<void> => {
    setLimitMessage(null);
    setError(null);
    if (!file || file.state !== 'ready') return;

    const pageCount = file.pageCount ?? 0;
    const decision = FeatureGate.forLicense(license.isPro).check('pdf2img', {
      pages: pageCount,
      width: Number(width),
    });
    if (!decision.allowed) {
      setLimitMessage(decision.messageKey);
      return;
    }

    cancelled.current = false;
    setRunning(true);
    setPercent(0);

    try {
      const images: Uint8Array[] = [];
      const mime = format === 'png' ? 'image/png' : 'image/jpeg';

      for (let page = 1; page <= pageCount; page += 1) {
        if (cancelled.current) return;

        const url = await pdfWorkerClient.renderThumbnail(file.id, page, Number(width));
        if (!url) throw new Error('render');

        const image = await loadImage(url);
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('canvas');

        // Nền trắng để JPG không bị đen ở vùng trong suốt.
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0);

        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, 0.92));
        if (!blob) throw new Error('encode');
        images.push(new Uint8Array(await blob.arrayBuffer()));

        setPercent((page / pageCount) * 90);
      }

      if (cancelled.current) return;

      const paths = await window.optb.files.saveImages({
        directory: directoryOf(file.path),
        folderName: OUTPUT_TEMPLATES.pageImages.replace('{name}', baseNameOf(file)),
        baseName: baseNameOf(file),
        format,
        images,
      });

      setPercent(100);
      setSaved(paths);
    } catch (caught) {
      setError({
        code: 'E_UNKNOWN',
        messageKey: 'errors.unknown',
        detail: caught instanceof Error ? caught.message : String(caught),
      });
    } finally {
      setRunning(false);
    }
  };

  const savedFolder = saved && saved[0] ? directoryOf(saved[0]) : '';

  const footer = saved ? (
    <ResultSummary
      outputPath={saved[0] ?? ''}
      outputPaths={saved}
      outputDirectory={savedFolder}
      note={t('ex.img.saved', { count: saved.length })}
      pageCount={saved.length}
      onDismiss={() => setSaved(null)}
    />
  ) : limitMessage ? (
    <UpsellBanner messageKey={limitMessage} vars={{ limit: FeatureGate.forLicense(false).limits.pdf2img.maxPages }} />
  ) : null;

  return (
    <AppShell
      title={t('home.tool.pdf2img')}
      onBack={() => {
        window.location.hash = '#/';
      }}
      options={
        <OptionsPanel>
          <div className={styles.field}>
            <span className={styles.label}>{t('ex.img.format')}</span>
            <Field>
              <Dropdown
                aria-label={t('ex.img.format')}
                value={format.toUpperCase()}
                selectedOptions={[format]}
                onOptionSelect={(_event, data) => {
                  if (data.optionValue) setFormat(data.optionValue as 'png' | 'jpg');
                }}
              >
                <Option value="png">PNG</Option>
                <Option value="jpg">JPG</Option>
              </Dropdown>
            </Field>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>{t('ex.img.quality')}</span>
            <Field>
              <Dropdown
                aria-label={t('ex.img.quality')}
                value={t(QUALITIES.find((item) => item.value === width)?.key ?? 'ex.img.q.normal')}
                selectedOptions={[width]}
                onOptionSelect={(_event, data) => {
                  if (data.optionValue) setWidth(data.optionValue);
                }}
              >
                {QUALITIES.map((item) => (
                  <Option key={item.value} value={item.value}>
                    {t(item.key)}
                  </Option>
                ))}
              </Dropdown>
            </Field>
          </div>
        </OptionsPanel>
      }
      footer={
        footer ?? (
          <ActionBar
            actionLabel={t('ex.img.run')}
            onAction={() => void run()}
            disabled={!file || file.state !== 'ready' || running}
            running={running}
            progressPercent={percent}
            onCancel={() => {
              cancelled.current = true;
              setRunning(false);
            }}
            summary={file ? `${file.name} · ${t('ex.pagesOf', { count: file.pageCount ?? 0 })}` : undefined}
          />
        )
      }
    >
      <div className={styles.stack}>
        {error ? (
          <TaskErrorBanner messageKey={error.messageKey} files={error.files} onDismiss={() => setError(null)} />
        ) : null}
        <SingleFilePicker file={file} onPick={setFile} onClear={clear} testId="pdf2img-file" />
      </div>
    </AppShell>
  );
}
