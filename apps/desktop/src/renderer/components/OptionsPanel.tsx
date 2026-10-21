import { Divider, makeStyles, tokens } from '@fluentui/react-components';

import { useI18n } from '../i18n';

/**
 * Bảng tùy chọn bên phải của màn hình công cụ.
 *
 * Chiều rộng cố định khoảng 320 điểm ảnh (UX.md mục 2).
 */
const useStyles = makeStyles({
  panel: {
    width: '320px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalL,
    paddingInline: tokens.spacingHorizontalL,
    borderInlineStartWidth: '1px',
    borderInlineStartStyle: 'solid',
    borderInlineStartColor: tokens.colorNeutralStroke2,
    backgroundColor: tokens.colorNeutralBackground2,
    overflowY: 'auto',
  },
  title: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  divider: {
    // Divider của Fluent mặc định co giãn để lấp chỗ trống; ở đây cần nó
    // chỉ chiếm đúng bề dày của nó.
    flexGrow: 0,
  },
});

export function OptionsPanel({ children }: { children: React.ReactNode }): React.JSX.Element {
  const styles = useStyles();
  const { t } = useI18n();

  return (
    <aside className={styles.panel} data-testid="options-panel">
      <span className={styles.title}>{t('shell.options')}</span>
      <Divider className={styles.divider} />
      {children}
    </aside>
  );
}
