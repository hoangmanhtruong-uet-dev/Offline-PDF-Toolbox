import { forwardRef } from 'react';

import { makeStyles, shorthands, tokens } from '@fluentui/react-components';

import { useI18n } from '../i18n';
import { appTokens, gradients, toolColors } from '../styles/tokens';

/**
 * Thẻ công cụ trên màn hình chính với phong cách Bright Fluent Modern.
 *
 * Là một nút thật nên có sẵn: điều hướng bằng Tab, kích hoạt bằng Enter và
 * Space, có viền tập trung rõ ràng, và có trạng thái hover nâng nhẹ nổi khối.
 */
const useStyles = makeStyles({
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: appTokens.spacing.m,
    width: '100%',
    height: '100%',
    minHeight: '190px',
    padding: appTokens.spacing.xl,
    textAlign: 'left',
    cursor: 'pointer',
    overflow: 'hidden',
    borderRadius: '28px',
    backgroundColor: 'color-mix(in srgb, var(--colorNeutralBackground1) 80%, transparent)',
    backdropFilter: 'blur(12px)',
    boxShadow: '0 4px 20px rgba(80, 40, 160, 0.07)',
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    transitionProperty: 'border-color, transform, box-shadow',
    transitionDuration: '260ms',
    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    position: 'relative',
    animationName: 'popIn',
    animationDuration: '420ms',
    animationFillMode: 'backwards',
    animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    ':hover': {
      ...shorthands.borderColor(tokens.colorBrandStroke1),
      transform: 'translateY(-6px) rotate(-0.4deg)',
      boxShadow: '0 22px 44px -10px rgba(124, 58, 237, 0.3)',
    },
    ':active': {
      transform: 'translateY(-1px) scale(0.985)',
    },
    ':focus-visible': {
      ...shorthands.borderWidth('2px'),
      ...shorthands.borderColor(tokens.colorBrandStroke1),
      outlineStyle: 'none',
    },
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  iconBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '56px',
    height: '56px',
    borderRadius: '20px',
    color: '#fff',
  },
  icon: {
    fontSize: '28px',
  },
  name: {
    fontSize: appTokens.fontSize.lg,
    fontWeight: appTokens.fontWeight.bold,
    letterSpacing: '-0.02em',
    color: tokens.colorNeutralForeground1,
  },
  description: {
    fontSize: appTokens.fontSize.sm,
    lineHeight: '20px',
    color: tokens.colorNeutralForeground2,
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 2,
    overflow: 'hidden',
  },
  shortcut: {
    fontSize: appTokens.fontSize.xs,
    fontWeight: appTokens.fontWeight.semibold,
    color: tokens.colorNeutralForeground3,
    borderRadius: appTokens.radius.pill,
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    paddingBlock: '2px',
    paddingInline: '7px',
  },
  proBadge: {
    fontSize: appTokens.fontSize.xs,
    fontWeight: appTokens.fontWeight.bold,
    letterSpacing: '0.06em',
    color: '#fff',
    backgroundImage: gradients.brand,
    borderRadius: appTokens.radius.pill,
    paddingBlock: '2px',
    paddingInline: '8px',
  },
  badges: {
    display: 'flex',
    alignItems: 'center',
    gap: appTokens.spacing.xs,
  },
  footerRow: {
    marginTop: 'auto',
    paddingTop: appTokens.spacing.s,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    fontSize: appTokens.fontSize.xs,
    fontWeight: appTokens.fontWeight.semibold,
    color: tokens.colorBrandForeground1,
  },
});

export interface ToolCardProps {
  /** Icon của công cụ. */
  icon: React.ComponentType<{ className?: string; focusable?: 'false' | 'true' }>;
  /** Tên công cụ. */
  name: string;
  /** Mô tả một dòng. */
  description: string;
  /** Số phím tắt, ví dụ `Ctrl+1`. */
  shortcut?: string;
  /** Mã định danh để kiểm thử, ví dụ `tool-merge`. */
  testId?: string;
  /** Khóa công cụ để gán mã màu (merge, split, compress, rotate, pages, images). */
  toolId?: keyof typeof toolColors | string;
  onSelect: () => void;
  /** Công cụ dành cho gói Pro. */
  pro?: boolean;
  /** Độ trễ xuất hiện (ms) để các thẻ hiện lần lượt. */
  delay?: number;
}

/** Thẻ công cụ, dùng chung cho cả lưới 3x2. */
export const ToolCard = forwardRef<HTMLButtonElement, ToolCardProps>(function ToolCard(
  { icon: Icon, name, description, shortcut, testId, toolId, onSelect, pro = false, delay = 0 },
  ref,
) {
  const styles = useStyles();
  const { t } = useI18n();

  // Xác định màu sắc biểu tượng riêng cho từng công cụ
  const toolKey = (toolId || testId?.replace('tool-', '')) as keyof typeof toolColors;
  const customColor = toolColors[toolKey];
  const iconStyle = customColor
    ? { backgroundImage: customColor.gradient, boxShadow: `0 10px 24px -6px ${customColor.glow}` }
    : { backgroundImage: gradients.brand, boxShadow: '0 10px 24px -6px rgba(124,58,237,0.4)' };

  return (
    <button
      ref={ref}
      type="button"
      className={styles.card}
      onClick={onSelect}
      style={{ animationDelay: `${delay}ms` }}
      data-testid="tool-card"
      data-tool-id={testId}
    >
      <div className={styles.headerRow}>
        <span className={styles.iconBox} style={iconStyle} aria-hidden="true">
          <Icon className={styles.icon} focusable="false" />
        </span>
        <span className={styles.badges}>
          {pro ? <span className={styles.proBadge}>PRO</span> : null}
          {shortcut ? <span className={styles.shortcut}>{shortcut}</span> : null}
        </span>
      </div>
      <span className={styles.name}>{name}</span>
      <span className={styles.description}>{description}</span>
      <div className={styles.footerRow} aria-hidden="true">
        <span>{t('home.start')} &rarr;</span>
      </div>
    </button>
  );
});
