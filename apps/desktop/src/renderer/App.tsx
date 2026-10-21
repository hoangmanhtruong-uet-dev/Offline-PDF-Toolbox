import { FluentProvider } from '@fluentui/react-components';
import { useEffect, useMemo } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';

import { DragOverlay } from './components/DragOverlay';
import { I18nProvider } from './i18n';
import { HomeScreen } from './features/home/HomeScreen';
import { ProScreen } from './features/pro/ProScreen';
import { SettingsScreen } from './features/settings/SettingsScreen';
import { ToolScreen } from './features/tools/ToolScreen';
import { resolveDarkMode, useAppStore } from './state/appStore';
import { buildTheme } from './styles/tokens';

/**
 * Gốc của ứng dụng giao diện.
 *
 * Chủ đề sáng/tối theo lựa chọn trong Cài đặt, mặc định theo hệ thống.
 */
export function App(): React.JSX.Element {
  const settings = useAppStore((state) => state.settings);
  const appInfo = useAppStore((state) => state.appInfo);
  const locale = useAppStore((state) => state.locale);
  const initialized = useAppStore((state) => state.initialized);
  const init = useAppStore((state) => state.init);

  useEffect(() => {
    void init();
  }, [init]);

  const dark = useMemo(
    () => resolveDarkMode(settings.theme, appInfo?.systemPrefersDark ?? false),
    [settings.theme, appInfo?.systemPrefersDark],
  );

  const theme = useMemo(() => buildTheme(dark), [dark]);

  if (!initialized) {
    return <FluentProvider theme={theme} />;
  }

  return (
    <FluentProvider theme={theme}>
      <I18nProvider locale={locale}>
        <HashRouter>
          <DragOverlay />
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/tools/:toolId" element={<ToolScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="/pro" element={<ProScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </I18nProvider>
    </FluentProvider>
  );
}
