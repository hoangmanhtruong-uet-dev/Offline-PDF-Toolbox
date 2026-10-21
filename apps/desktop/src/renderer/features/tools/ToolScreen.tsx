import { MessageBar, MessageBarBody } from '@fluentui/react-components';
import { useNavigate, useParams } from 'react-router-dom';

import { AppShell } from '../../components/AppShell';
import { useI18n } from '../../i18n';
import { MergeScreen } from '../merge/MergeScreen';
import { RotateScreen } from '../rotate/RotateScreen';
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
