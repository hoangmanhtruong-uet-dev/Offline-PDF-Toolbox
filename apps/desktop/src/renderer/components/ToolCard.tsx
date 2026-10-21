import { forwardRef } from 'react';

import { makeStyles, shorthands, tokens } from '@fluentui/react-components';

import { appTokens, toolColors } from '../styles/tokens';

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
    padding: appTokens.spacing.xl,
    textAlign: 'left',
    cursor: 'pointer',
    borderRadius: appTokens.radius.xl,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    transitionProperty: 'border-color, background-color, transform, box-shadow',
    transitionDuration: '220ms',
    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    position: 'relative',
    ':hover': {
      ...shorthands.borderColor(tokens.colorBrandStroke1),
      transform: 'translateY(-3px)',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
      backgroundColor: tokens.colorNeutralBackground1,
    },
    ':active': {
      backgroundColor: tokens.colorNeutralBackground2,
      transform: 'translateY(0)',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
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
    width: '46px',
    height: '46px',
    borderRadius: appTokens.radius.lg,
    transitionProperty: 'transform',
    transitionDuration: '200ms',
  },
  icon: {
    fontSize: '24px',
  },
  name: {
    fontSize: appTokens.fontSize.md,
    fontWeight: appTokens.fontWeight.bold,
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
    borderRadius: appTokens.radius.md,
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    paddingBlock: '2px',
    paddingInline: '7px',
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
}

/** Thẻ công cụ, dùng chung cho cả lưới 3x2. */
export const ToolCard = forwardRef<HTMLButtonElement, ToolCardProps>(function ToolCard(
  { icon: Icon, name, description, shortcut, testId, toolId, onSelect },
  ref,
) {
  const styles = useStyles();

  // Xác định màu sắc biểu tượng riêng cho từng công cụ
  const toolKey = (toolId || testId?.replace('tool-', '')) as keyof typeof toolColors;
  const customColor = toolColors[toolKey];
  const iconStyle = customColor
    ? { backgroundColor: customColor.bg, color: customColor.fg }
    : { backgroundColor: tokens.colorBrandBackground, color: tokens.colorBrandForeground1 };

  return (
    <button
      ref={ref}
      type="button"
      className={styles.card}
      onClick={onSelect}
      data-testid="tool-card"
      data-tool-id={testId}
    >
      <div className={styles.headerRow}>
        <span className={styles.iconBox} style={iconStyle} aria-hidden="true">
          <Icon className={styles.icon} focusable="false" />
        </span>
        {shortcut ? <span className={styles.shortcut}>{shortcut}</span> : null}
      </div>
      <span className={styles.name}>{name}</span>
      <span className={styles.description}>{description}</span>
      <div className={styles.footerRow} aria-hidden="true">
        <span>Bắt đầu &rarr;</span>
      </div>
    </button>
  );
});
