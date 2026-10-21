import { forwardRef } from 'react';

import { makeStyles, shorthands, tokens } from '@fluentui/react-components';

import { appTokens } from '../styles/tokens';

/**
 * Thẻ công cụ trên màn hình chính.
 *
 * Là một nút thật nên có sẵn: điều hướng bằng Tab, kích hoạt bằng Enter và
 * Space, có viền tập trung rõ ràng, và có trạng thái hover/pressed.
 */
const useStyles = makeStyles({
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: appTokens.spacing.m,
    width: '100%',
    height: '100%',
    padding: appTokens.spacing.l,
    textAlign: 'left',
    cursor: 'pointer',
    borderRadius: appTokens.radius.lg,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    transitionProperty: 'border-color, background-color, transform',
    transitionDuration: `${appTokens.motion.fast}ms`,
    ':hover': {
      ...shorthands.borderColor(tokens.colorBrandStroke1),
      backgroundColor: tokens.colorNeutralBackground2,
    },
    ':active': {
      backgroundColor: tokens.colorNeutralBackground3,
      transform: 'translateY(1px)',
    },
    ':focus-visible': {
      ...shorthands.borderWidth('2px'),
      ...shorthands.borderColor(tokens.colorBrandStroke1),
      outlineStyle: 'none',
    },
  },
  iconBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    borderRadius: appTokens.radius.md,
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorBrandForeground1,
  },
  icon: {
    fontSize: '26px',
  },
  name: {
    fontSize: appTokens.fontSize.md,
    fontWeight: appTokens.fontWeight.semibold,
    color: tokens.colorNeutralForeground1,
  },
  description: {
    fontSize: appTokens.fontSize.sm,
    lineHeight: '18px',
    color: tokens.colorNeutralForeground2,
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 1,
    overflow: 'hidden',
  },
  shortcut: {
    marginInlineStart: 'auto',
    fontSize: appTokens.fontSize.xs,
    color: tokens.colorNeutralForeground3,
    borderRadius: appTokens.radius.sm,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    paddingBlock: '0',
    paddingInline: '4px',
  },
});

export interface ToolCardProps {
  /** Icon của công cụ. */
  icon: React.ComponentType<{ className?: string }>;
  /** Tên công cụ. */
  name: string;
  /** Mô tả một dòng. */
  description: string;
  /** Số phím tắt, ví dụ `Ctrl+1`. */
  shortcut?: string;
  /** Mã định danh để kiểm thử, ví dụ `tool-merge`. */
  testId?: string;
  onSelect: () => void;
}

/** Thẻ công cụ, dùng chung cho cả lưới 3x2. */
export const ToolCard = forwardRef<HTMLButtonElement, ToolCardProps>(function ToolCard(
  { icon: Icon, name, description, shortcut, testId, onSelect },
  ref,
) {
  const styles = useStyles();

  return (
    <button
      ref={ref}
      type="button"
      className={styles.card}
      onClick={onSelect}
      data-testid="tool-card"
      data-tool-id={testId}
    >
      <span className={styles.iconBox} aria-hidden="true">
        <Icon className={styles.icon} />
      </span>
      <span className={styles.name}>{name}</span>
      <span className={styles.description}>{description}</span>
      {shortcut ? <span className={styles.shortcut}>{shortcut}</span> : null}
    </button>
  );
});
