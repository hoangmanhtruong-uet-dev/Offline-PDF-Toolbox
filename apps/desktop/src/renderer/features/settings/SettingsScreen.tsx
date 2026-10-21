import {
  Button,
  Card,
  CardHeader,
  CardFooter,
  Dropdown,
  Field,
  Option,
  Switch,
  Text,
  Title3,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { useNavigate } from 'react-router-dom';

import type { SupportedLanguage, ThemePreference } from '@shared/types';

import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES, useI18n } from '../../i18n';
import { useAppStore } from '../../state/appStore';

/**
 * Màn hình Cài đặt và Giới thiệu (S-10).
 */
const useStyles = makeStyles({
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    maxWidth: '720px',
    margin: '0 auto',
    paddingBlock: tokens.spacingVerticalXXL,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalL,
  },
  privacy: {
    color: tokens.colorNeutralForeground2,
  },
  version: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
});

export function SettingsScreen(): React.JSX.Element {
  const styles = useStyles();
  const { t } = useI18n();
  const navigate = useNavigate();
  const settings = useAppStore((state) => state.settings);
  const appInfo = useAppStore((state) => state.appInfo);
  const updateSettings = useAppStore((state) => state.updateSettings);

  return (
    <div className={styles.page}>
      <Title3>{t('settings.title')}</Title3>

      <Card>
        <CardHeader header={<Text weight="semibold">{t('settings.language')}</Text>} />
        <CardFooter>
          <Field>
            <Dropdown
              value={settings.language}
              selectedOptions={[settings.language]}
              onOptionSelect={(_event, data) => {
                if (data.optionValue) {
                  void updateSettings({ language: data.optionValue as SupportedLanguage });
                }
              }}
            >
              {SUPPORTED_LANGUAGES.map((code) => (
                <Option key={code} value={code}>
                  {LANGUAGE_NAMES[code]}
                </Option>
              ))}
            </Dropdown>
          </Field>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader header={<Text weight="semibold">{t('settings.theme')}</Text>} />
        <CardFooter>
          <Field>
            <Dropdown
              value={settings.theme}
              selectedOptions={[settings.theme]}
              onOptionSelect={(_event, data) => {
                if (data.optionValue) {
                  void updateSettings({ theme: data.optionValue as ThemePreference });
                }
              }}
            >
              <Option value="system">{t('settings.themeSystem')}</Option>
              <Option value="light">{t('settings.themeLight')}</Option>
              <Option value="dark">{t('settings.themeDark')}</Option>
            </Dropdown>
          </Field>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader header={<Text weight="semibold">{t('settings.showRecent')}</Text>} />
        <CardFooter>
          <div className={styles.row}>
            <Switch
              checked={settings.showRecentFiles}
              onChange={(_event, data) => {
                void updateSettings({ showRecentFiles: data.checked });
              }}
            />
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader header={<Text weight="semibold">{t('settings.privacy')}</Text>} />
        <CardFooter>
          <Text className={styles.privacy}>{t('settings.privacy')}</Text>
        </CardFooter>
      </Card>

      <div className={styles.row}>
        <Button appearance="subtle" onClick={() => navigate('/')}>
          {t('nav.home')}
        </Button>
        <span className={styles.version}>
          {t('settings.version')} {appInfo?.appVersion ?? '-'}
        </span>
      </div>
    </div>
  );
}
