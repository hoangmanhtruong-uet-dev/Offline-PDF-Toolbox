import { useEffect, useRef, useState } from 'react';

import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Text,
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import {
  DeleteRegular,
  DismissRegular,
  FolderRegular,
  OpenRegular,
} from '@fluentui/react-icons';

import { useI18n } from '../i18n';
import { useRecentStore } from '../state/recentStore';
import { appTokens } from '../styles/tokens';

/**
 * Danh sách tệp gần đây.
 *
 * Mỗi dòng có hình thu nhổ trang đầu, số trang, dung lượng, thời gian
 * tương đối, và ba thao tác: Mở, Hiện trong thư mục, Xóa khỏi danh sách.
 *
 * Danh sách giới hạn ở `COLLAPSED_COUNT` dòng, kèm nút "Xem tất cả".
 */
const COLLAPSED_COUNT = 5;

const useStyles = makeStyles({
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: appTokens.spacing.m,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: appTokens.spacing.m,
  },
  title: {
    fontSize: appTokens.fontSize.md,
    fontWeight: appTokens.fontWeight.semibold,
    color: tokens.colorNeutralForeground1,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    listStyleType: 'none',
    margin: 0,
    padding: appTokens.spacing.xs,
    borderRadius: appTokens.radius.lg,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: appTokens.spacing.m,
    padding: appTokens.spacing.s,
    paddingInline: appTokens.spacing.m,
    borderRadius: appTokens.radius.md,
    transitionProperty: 'background-color',
    transitionDuration: '150ms',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground2,
    },
  },
  thumbnail: {
    width: '34px',
    height: '44px',
    flexShrink: 0,
    objectFit: 'cover',
    borderRadius: appTokens.radius.sm,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    backgroundColor: tokens.colorNeutralBackground3,
  },
  thumbPlaceholder: {
    width: '34px',
    height: '44px',
    flexShrink: 0,
    borderRadius: appTokens.radius.sm,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    backgroundColor: tokens.colorNeutralBackground3,
  },
  info: {
    flexGrow: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
  },
  name: {
    fontSize: appTokens.fontSize.base,
    fontWeight: appTokens.fontWeight.semibold,
    color: tokens.colorNeutralForeground1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  meta: {
    fontSize: appTokens.fontSize.sm,
    color: tokens.colorNeutralForeground2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: appTokens.spacing.xxs,
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: appTokens.spacing.s,
    padding: appTokens.spacing.xl,
    borderRadius: appTokens.radius.lg,
    ...shorthands.border('1px', 'dashed', tokens.colorNeutralStroke2),
    color: tokens.colorNeutralForeground2,
  },
  footer: {
    display: 'flex',
    justifyContent: 'center',
  },
});

export interface RecentFilesProps {
  /** Số dòng hiển thị thu gọn. */
  collapsedCount?: number;
}

export function RecentFiles({ collapsedCount = COLLAPSED_COUNT }: RecentFilesProps): React.JSX.Element {
  const styles = useStyles();
  const { t, formatBytes, relativeTime } = useI18n();

  const files = useRecentStore((state) => state.files);
  const details = useRecentStore((state) => state.details);
  const load = useRecentStore((state) => state.load);
  const remove = useRecentStore((state) => state.remove);
  const clear = useRecentStore((state) => state.clear);
  const enrich = useRecentStore((state) => state.enrich);

  const [expanded, setExpanded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const rowRefs = useRef(new Map<string, HTMLLIElement>());

  useEffect(() => {
    void load();
  }, [load]);

  // Chỉ đọc tệp khi dòng đó lọt vào vùng nhìn thấy.
  useEffect(() => {
    observer.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const path = (entry.target as HTMLElement).dataset.path;
          const file = files.find((item) => item.path === path);
          if (file) void enrich(file);
        }
      },
      { rootMargin: '120px' },
    );

    for (const element of rowRefs.current.values()) {
      observer.current.observe(element);
    }

    return () => observer.current?.disconnect();
  }, [files, enrich]);

  const visible = expanded ? files : files.slice(0, collapsedCount);
  const hiddenCount = files.length - visible.length;

  if (files.length === 0) {
    return (
      <section className={styles.section} data-testid="recent-files">
        <div className={styles.header}>
          <span className={styles.title}>{t('home.recentTitle')}</span>
        </div>
        <div className={styles.empty} data-testid="recent-empty">
          <DismissRegular style={{ fontSize: 24 }} />
          <Text>{t('home.recentEmpty')}</Text>
          <Text style={{ fontSize: appTokens.fontSize.sm }}>
            {t('home.recentEmptyHint')}
          </Text>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section} data-testid="recent-files">
      <div className={styles.header}>
        <span className={styles.title}>{t('home.recentTitle')}</span>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <Button size="small" appearance="subtle" icon={<DeleteRegular />}>
              {t('home.recentMenu')}
            </Button>
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem
                onClick={() => {
                  setExpanded(true);
                }}
              >
                {t('home.recentShowAll')}
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setConfirmOpen(true);
                }}
              >
                {t('home.recentClear')}
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      </div>

      <ul className={styles.list}>
        {visible.map((file) => {
          const detail = details[file.path];

          return (
            <li
              key={file.path}
              className={styles.row}
              data-path={file.path}
              data-testid={`recent-row-${file.name}`}
              ref={(element) => {
                if (element) rowRefs.current.set(file.path, element);
                else rowRefs.current.delete(file.path);
              }}
            >
              {detail?.thumbnail ? (
                <img className={styles.thumbnail} src={detail.thumbnail} alt="" />
              ) : (
                <span className={styles.thumbPlaceholder} />
              )}

              <span className={styles.info}>
                <span className={styles.name} title={file.path}>
                  {file.name}
                </span>
                <span className={styles.meta}>
                  {[
                    detail?.pageCount !== undefined
                      ? t('files.pages', { count: detail.pageCount })
                      : undefined,
                    file.size ? formatBytes(file.size) : undefined,
                    relativeTime(file.usedAt),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </span>

              <span className={styles.actions}>
                <Button
                  appearance="subtle"
                  size="small"
                  icon={<OpenRegular />}
                  title={t('recent.open')}
                  aria-label={t('recent.open')}
                  onClick={() => void window.optb.files.open(file.path)}
                />
                <Button
                  appearance="subtle"
                  size="small"
                  icon={<FolderRegular />}
                  title={t('recent.reveal')}
                  aria-label={t('recent.reveal')}
                  onClick={() => void window.optb.files.reveal(file.path)}
                />
                <Button
                  appearance="subtle"
                  size="small"
                  icon={<DismissRegular />}
                  title={t('recent.remove')}
                  aria-label={t('recent.remove')}
                  onClick={() => void remove(file.path)}
                />
              </span>
            </li>
          );
        })}
      </ul>

      {hiddenCount > 0 ? (
        <div className={styles.footer}>
          <Button size="small" appearance="subtle" onClick={() => setExpanded(true)}>
            {t('home.recentSeeAll', { count: hiddenCount })}
          </Button>
        </div>
      ) : null}

      <Dialog
        open={confirmOpen}
        onOpenChange={(_event, data) => setConfirmOpen(data.open)}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>{t('home.recentClearTitle')}</DialogTitle>
            <DialogContent>{t('home.recentClearDescription')}</DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setConfirmOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                appearance="primary"
                onClick={() => {
                  void clear();
                  setConfirmOpen(false);
                  setExpanded(false);
                }}
              >
                {t('home.recentClearConfirm')}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </section>
  );
}
