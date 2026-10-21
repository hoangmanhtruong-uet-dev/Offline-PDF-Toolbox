import { Button, MessageBar, MessageBarBody, Text, makeStyles, tokens } from '@fluentui/react-components';
import { useNavigate, useParams } from 'react-router-dom';

import type { FileMeta } from '@shared/types';

import { ActionBar } from '../../components/ActionBar';
import { AppShell } from '../../components/AppShell';
import { DropZone } from '../../components/DropZone';
import { FileList } from '../../components/FileList';
import { OptionsPanel } from '../../components/OptionsPanel';
import { useI18n } from '../../i18n';
import { useFilesStore } from '../../state/filesStore';
import { findTool } from './tools';

/**
 * Màn hình công cụ (S-02 … S-08).
 *
 * Dùng chung một bố cục cho mọi công cụ: thanh trên, vùng giữa, bảng tùy chọn
 * bên phải, thanh hành động dưới (UX.md mục 2).
 */
const useStyles = makeStyles({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  hint: {
    color: tokens.colorNeutralForeground3,
  },
});

export function ToolScreen(): React.JSX.Element {
  const styles = useStyles();
  const { t } = useI18n();
  const navigate = useNavigate();
  const params = useParams<{ toolId: string }>();
  const tool = findTool(params.toolId ?? '');

  const files = useFilesStore((state) => state.files);
  const addFiles = useFilesStore((state) => state.addFiles);
  const removeFile = useFilesStore((state) => state.removeFile);
  const clearFiles = useFilesStore((state) => state.clear);
  const moveFile = useFilesStore((state) => state.moveFile);

  if (!tool) {
    return (
      <AppShell title={t('errors.title')} onBack={() => navigate('/')}>
        <MessageBar intent="error">
          <MessageBarBody>{t('errors.unknown')}</MessageBarBody>
        </MessageBar>
      </AppShell>
    );
  }

  const title = t(tool.nameKey);
  const totalPages = files.reduce((sum, file) => sum + (file.pageCount ?? 0), 0);
  const summary =
    files.length === 0
      ? undefined
      : `${t('files.count', { count: files.length })} · ${t('files.pages', { count: totalPages })}`;

  const handleFiles = (metas: FileMeta[]): void => {
    addFiles(metas);
  };

  return (
    <AppShell
      title={title}
      onBack={() => navigate('/')}
      options={
        <OptionsPanel>
          <Text className={styles.hint}>{tool.feature}</Text>
          {files.length > 0 ? (
            <Button appearance="subtle" size="small" onClick={clearFiles}>
              {t('files.clear')}
            </Button>
          ) : null}
        </OptionsPanel>
      }
      footer={
        <ActionBar
          actionLabel={t('shell.run')}
          onAction={() => undefined}
          disabled={files.length === 0}
          summary={summary}
        />
      }
    >
      <div className={styles.stack}>
        <MessageBar intent="info">
          <MessageBarBody>{t('shell.comingSoon')}</MessageBarBody>
        </MessageBar>

        <DropZone onFiles={handleFiles} title={t('files.add')} hint={t('home.dropHint')} compact />

        {files.length > 0 ? (
          <FileList files={files} onRemove={removeFile} onMove={moveFile} />
        ) : null}
      </div>
    </AppShell>
  );
}
