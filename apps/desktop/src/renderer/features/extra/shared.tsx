import { useCallback, useEffect, useRef, useState } from 'react';

import { Button, Text, makeStyles, tokens } from '@fluentui/react-components';

import type { FileEntry, FileMeta } from '@shared/types';

import { DropZone } from '../../components/DropZone';
import { useI18n } from '../../i18n';
import { pdfWorkerClient } from '../../services/pdfWorkerClient';
import { readFileEntry } from '../../services/fileReader';
import { appTokens } from '../../styles/tokens';

/**
 * Phần dùng chung của các công cụ một tệp: đọc tệp trong worker, hiện thẻ
 * tệp đã chọn, và tính thư mục lưu mặc định.
 */

let counter = 0;

/** Giữ đúng một tệp PDF đang làm việc và đọc nó trong worker. */
export function useSinglePdf(): {
  file: FileEntry | null;
  setFile: (meta: FileMeta | null) => void;
  clear: () => void;
} {
  const [file, setFileState] = useState<FileEntry | null>(null);
  const currentId = useRef<string | null>(null);

  const release = useCallback(() => {
    if (currentId.current) void pdfWorkerClient.close(currentId.current);
    currentId.current = null;
  }, []);

  const setFile = useCallback(
    (meta: FileMeta | null) => {
      release();

      if (!meta) {
        setFileState(null);
        return;
      }

      counter += 1;
      const id = `extra-${Date.now().toString(36)}-${counter}`;
      currentId.current = id;
      setFileState({ ...meta, id, pageCount: null, state: 'reading' });

      void readFileEntry(meta, id).then((updated) => {
        if (currentId.current !== id) return;
        setFileState(updated);
      });
    },
    [release],
  );

  const clear = useCallback(() => setFile(null), [setFile]);

  // Giải phóng tài liệu trong worker khi rời màn hình.
  useEffect(() => release, [release]);

  return { file, setFile, clear };
}

/** Thư mục chứa một tệp. */
export function directoryOf(path: string): string {
  const separator = Math.max(path.lastIndexOf('\\'), path.lastIndexOf('/'));
  return separator > 0 ? path.slice(0, separator) : '';
}

/** Tên tệp không có phần mở rộng `.pdf`. */
export function baseNameOf(file: FileEntry): string {
  return file.name.replace(/\.pdf$/i, '');
}

export const useExtraStyles = makeStyles({
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
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
  },
  hint: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  fileCard: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalM,
    borderRadius: appTokens.radius.xl,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: appTokens.shadow.sm,
  },
  thumb: {
    width: '56px',
    height: '74px',
    objectFit: 'cover',
    borderRadius: appTokens.radius.sm,
    boxShadow: appTokens.shadow.sm,
  },
  preview: {
    display: 'flex',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXL,
    borderRadius: appTokens.radius.xl,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground3,
  },
  previewImage: {
    maxHeight: '520px',
    maxWidth: '100%',
    borderRadius: appTokens.radius.sm,
    boxShadow: appTokens.shadow.lg,
    backgroundColor: '#fff',
  },
  fileName: {
    fontWeight: tokens.fontWeightSemibold,
    flexGrow: 1,
    wordBreak: 'break-all',
  },
});

/** Thẻ hiển thị tệp đã chọn, hoặc vùng thả tệp khi chưa chọn. */
export function SingleFilePicker({
  file,
  onPick,
  onClear,
  testId,
}: {
  file: FileEntry | null;
  onPick: (meta: FileMeta | null) => void;
  onClear: () => void;
  testId: string;
}): React.JSX.Element {
  const styles = useExtraStyles();
  const { t } = useI18n();

  const [preview, setPreview] = useState<{ id: string; url: string } | null>(null);
  const fileId = file && file.state === 'ready' ? file.id : null;

  // Hình xem trước lớn của trang đầu, vẽ bằng cùng worker với hình thu nhỏ.
  useEffect(() => {
    if (!fileId) return;
    let alive = true;
    void pdfWorkerClient.renderThumbnail(fileId, 1, 640).then((url) => {
      if (alive && url) setPreview({ id: fileId, url });
    });
    return () => {
      alive = false;
    };
  }, [fileId]);

  if (!file) {
    return (
      <DropZone
        onFiles={(metas) => onPick(metas[0] ?? null)}
        title={t('files.add')}
        hint={t('home.dropHint')}
        compact
        multiple={false}
      />
    );
  }

  const bigPreview = preview && preview.id === file.id ? preview.url : null;

  return (
    <>
      <div className={styles.fileCard} data-testid={testId}>
        {file.thumbnail ? <img className={styles.thumb} src={file.thumbnail} alt="" /> : null}
        <span className={styles.fileName}>{file.name}</span>
        <Text className={styles.hint}>{t('ex.pagesOf', { count: file.pageCount ?? 0 })}</Text>
        <Button appearance="subtle" shape="circular" size="small" onClick={onClear}>
          {t('files.remove')}
        </Button>
      </div>
      {bigPreview ? (
        <div className={styles.preview}>
          <img className={styles.previewImage} src={bigPreview} alt="" />
        </div>
      ) : null}
    </>
  );
}
