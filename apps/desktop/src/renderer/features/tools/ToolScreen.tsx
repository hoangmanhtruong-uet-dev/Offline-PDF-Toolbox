import { MessageBar, MessageBarBody } from '@fluentui/react-components';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { AppShell } from '../../components/AppShell';
import { useI18n } from '../../i18n';
import { CompressScreen } from '../compress/CompressScreen';
import { MergeScreen } from '../merge/MergeScreen';
import { RotateScreen } from '../rotate/RotateScreen';
import { SplitScreen } from '../split/SplitScreen';
import { useTaskStore } from '../../state/taskStore';
import { findTool } from './tools';

/**
 * Điều hướng tới màn hình của từng công cụ.
 *
 * Công cụ chưa có ở bản hiện tại hiển thị thông báo "sắp có"; công cụ đã
 * có dùng bố cục chuẩn của màn hình công cụ.
 */
export function ToolScreen(): React.JSX.Element {
  const { t } = useI18n();
  const navigate = useNavigate();
  const params = useParams<{ toolId: string }>();
  const tool = findTool(params.toolId ?? '');
  const clearResult = useTaskStore((state) => state.clear);

  // Kết quả của tác vụ trước không được hiện lại ở công cụ khác.
  useEffect(() => {
    clearResult();
  }, [clearResult, params.toolId]);

  if (!tool) {
    return (
      <AppShell title={t('errors.title')} onBack={() => navigate('/')}>
        <MessageBar intent="error">
          <MessageBarBody>{t('errors.unknown')}</MessageBarBody>
        </MessageBar>
      </AppShell>
    );
  }

  switch (tool.id) {
    case 'merge':
      return <MergeScreen />;
    case 'rotate':
      return <RotateScreen />;
    case 'split':
      return <SplitScreen />;
    case 'compress':
      return <CompressScreen />;
    default:
      return (
        <AppShell title={t(tool.nameKey)} onBack={() => navigate('/')}>
          <MessageBar intent="info">
            <MessageBarBody>{t('shell.comingSoon')}</MessageBarBody>
          </MessageBar>
        </AppShell>
      );
  }
}
