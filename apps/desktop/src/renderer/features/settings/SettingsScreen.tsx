import { useState } from 'react';

import {
  Button,
  Card,
  CardFooter,
  CardHeader,
  Dropdown,
  Field,
  MessageBar,
  MessageBarBody,
  Option,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { FolderRegular } from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';

import type { SupportedLanguage, ThemePreference } from '@shared/types';

import { PageTitle } from '../../components/PageTitle';
import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES, useI18n } from '../../i18n';
import { useAppStore } from '../../state/appStore';
import { useRecentStore } from '../../state/recentStore';
import { appTokens } from '../../styles/tokens';

/**
 * Màn hình Cài đặt và Giới thiệu (S-10).
 *
 * Bốn nhóm: ngôn ngữ, giao diện, thư mục lưu mặc định, và xóa lịch sử tệp
 * gần đây.
 */
const useStyles = makeStyles({
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: appTokens.spacing.xl,
    maxWidth: '760px',
    margin: '0 auto',
    paddingBlock: appTokens.spacing.xxxl,
    paddingInline: appTokens.spacing.xl,
    width: '100%',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: appTokens.spacing.m,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: appTokens.spacing.s,
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
  value: {
    fontSize: appTokens.fontSize.sm,
    color: tokens.colorNeutralForeground1,
    wordBreak: 'break-all',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: appTokens.spacing.m,
    flexWrap: 'wrap',
  },
  privacy: {
    color: tokens.colorNeutralForeground2,
  },
  version: {
    color: tokens.colorNeutralForeground3,
    fontSize: appTokens.fontSize.sm,
  },
});

/** Nhãn của từng chủ đề. */
const THEME_LABELS: Record<ThemePreference, 'settings.themeSystem' | 'settings.themeLight' | 'settings.themeDark'> = {
  system: 'settings.themeSystem',
  light: 'settings.themeLight',
  dark: 'settings.themeDark',
};

export function SettingsScreen(): React.JSX.Element {
  const styles = useStyles();
  const { t } = useI18n();
  const navigate = useNavigate();
  const settings = useAppStore((state) => state.settings);
  const appInfo = useAppStore((state) => state.appInfo);
  const updateSettings = useAppStore((state) => state.updateSettings);

  const clearRecent = useRecentStore((state) => state.clear);
  const recentCount = useRecentStore((state) => state.files.length);
  const [cleared, setCleared] = useState(false);

  const pickOutputFolder = async (): Promise<void> => {
    const folder = await window.optb.files.pickFolder();
    if (folder) void updateSettings({ outputDirectory: folder });
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <PageTitle level={1}>{t('settings.title')}</PageTitle>
        <Button appearance="subtle" onClick={() => navigate('/')}>
          {t('nav.home')}
        </Button>
      </div>

      <section className={styles.section}>
        <span className={styles.label}>{t('settings.languageSection')}</span>

        <Card>
          <CardHeader header={<Text weight="semibold">{t('settings.language')}</Text>} />
          <CardFooter>
            <Field>
              <Dropdown
                aria-label={t('settings.language')}
                value={LANGUAGE_NAMES[settings.language]}
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
                aria-label={t('settings.theme')}
                value={t(THEME_LABELS[settings.theme])}
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
      </section>

      <section className={styles.section}>
        <span className={styles.label}>{t('settings.dataSection')}</span>

        <Card>
          <CardHeader header={<Text weight="semibold">{t('settings.outputFolder')}</Text>} />
          <CardFooter>
            <div className={styles.field}>
              <Text className={styles.value}>
                {settings.outputDirectory ?? t('settings.outputFolderEmpty')}
              </Text>
              <div className={styles.row}>
                <Button size="small" icon={<FolderRegular />} onClick={() => void pickOutputFolder()}>
                  {t('settings.chooseFolder')}
                </Button>
              </div>
              <span className={styles.hint}>{t('settings.outputFolderHint')}</span>
            </div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader header={<Text weight="semibold">{t('settings.clearHistory')}</Text>} />
          <CardFooter>
            <div className={styles.field}>
              <span className={styles.hint}>{t('settings.clearHistoryHint')}</span>
              <div className={styles.row}>
                <Button
                  size="small"
                  disabled={recentCount === 0}
                  onClick={() => {
                    void clearRecent();
                    setCleared(true);
                  }}
                  data-testid="clear-history"
                >
                  {t('settings.clearHistoryAction')}
                </Button>
                <span className={styles.version}>
                  {t('home.recentTitle')}: {recentCount}
                </span>
              </div>
              {cleared ? (
                <MessageBar intent="success">
                  <MessageBarBody>{t('settings.clearHistoryDone')}</MessageBarBody>
                </MessageBar>
              ) : null}
            </div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader header={<Text weight="semibold">{t('settings.privacyTitle')}</Text>} />
          <CardFooter>
            <Text className={styles.privacy}>{t('settings.privacy')}</Text>
          </CardFooter>
        </Card>
      </section>

      <span className={styles.version}>
        {t('settings.version')} {appInfo?.appVersion ?? '-'}
      </span>
    </div>
  );
}
