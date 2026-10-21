import { useCallback, useEffect, useRef, useState } from 'react';

import { makeStyles, shorthands, tokens } from '@fluentui/react-components';

/**
 * Lưới hình thu nhổ trang.
 *
 * Dùng chung cho F-02 (tách), F-04 (xoay) và F-05 (sắp xếp trang).
 *
 * Hình thu nhổ được vẽ **theo yêu cầu**: ô nào lọt vào vùng nhìn thấy thì mới
 * vẽ, ô nào rời khỏi vùng nhìn thấy thì huỷ yêu cầu đang chờ. Bộ đệm ảnh
 * nằm ở lớp dịch vụ, giới hạn 200 ảnh.
 */
const useStyles = makeStyles({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: tokens.spacingHorizontalM,
    gapRow: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalS,
  },
  cell: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalXS,
    padding: tokens.spacingVerticalXS,
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    userSelect: 'none',
    ...shorthands.border('2px', 'solid', 'transparent'),
  },
  selected: {
    ...shorthands.borderColor(tokens.colorBrandStroke1),
    backgroundColor: tokens.colorNeutralBackground3,
  },
  thumb: {
    width: '100%',
    aspectRatio: '3 / 4',
    objectFit: 'contain',
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground3,
  },
  placeholder: {
    width: '100%',
    aspectRatio: '3 / 4',
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  number: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },
  badge: {
    position: 'absolute',
    top: tokens.spacingVerticalXS,
    right: tokens.spacingVerticalXS,
    minWidth: '20px',
    height: '20px',
    borderRadius: '10px',
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    fontSize: tokens.fontSizeBase100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingInline: '4px',
  },
});

/** Một ô trang trong lưới. */
export interface PageGridItem {
  /** Số trang, bắt đầu từ 1. */
  pageNumber: number;
  /** Hình thu nhổ, nếu đã vẽ xong. */
  thumbnail?: string;
}

export interface PageGridProps {
  pages: PageGridItem[];
  /** Các trang đang được chọn. */
  selected: number[];
  onSelectionChange: (selected: number[]) => void;
  /** Được gọi khi một ô lọt vào vùng nhìn thấy, để vẽ hình thu nhổ. */
  onPageVisible?: (pageNumber: number) => void;
  /** Chiều rộng hình thu nhổ tính bằng pixel. */
  thumbnailWidth?: number;
}

export function PageGrid({
  pages,
  selected,
  onSelectionChange,
  onPageVisible,
  thumbnailWidth = 120,
}: PageGridProps): React.JSX.Element {
  const styles = useStyles();
  const [lastClicked, setLastClicked] = useState<number | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const cellRefs = useRef(new Map<number, HTMLDivElement>());

  // Quan sát các ô để vẽ hình thu nhổ đúng lúc người dùng cần.
  useEffect(() => {
    observer.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const element = entry.target as HTMLElement;
          const pageNumber = Number(element.dataset.page);
          if (Number.isFinite(pageNumber)) onPageVisible?.(pageNumber);
        }
      },
      { rootMargin: '200px' },
    );

    for (const element of cellRefs.current.values()) {
      observer.current.observe(element);
    }

    return () => observer.current?.disconnect();
  }, [pages, onPageVisible]);

  const selectRange = useCallback(
    (from: number, to: number) => {
      const start = Math.min(from, to);
      const end = Math.max(from, to);
      const range = pages
        .map((page) => page.pageNumber)
        .filter((pageNumber) => pageNumber >= start && pageNumber <= end);

      onSelectionChange([...new Set([...selected, ...range])].sort((a, b) => a - b));
    },
    [pages, selected, onSelectionChange],
  );

  const handleClick = (pageNumber: number, event: React.MouseEvent): void => {
    if (event.shiftKey && lastClicked !== null) {
      selectRange(lastClicked, pageNumber);
      setLastClicked(pageNumber);
      return;
    }

    if (event.ctrlKey || event.metaKey) {
      const next = selected.includes(pageNumber)
        ? selected.filter((page) => page !== pageNumber)
        : [...selected, pageNumber].sort((a, b) => a - b);
      onSelectionChange(next);
      setLastClicked(pageNumber);
      return;
    }

    onSelectionChange([pageNumber]);
    setLastClicked(pageNumber);
  };

  return (
    <div className={styles.grid} data-testid="page-grid">
      {pages.map((page) => {
        const isSelected = selected.includes(page.pageNumber);

        return (
          <div
            key={page.pageNumber}
            ref={(element) => {
              if (element) cellRefs.current.set(page.pageNumber, element);
              else cellRefs.current.delete(page.pageNumber);
            }}
            data-page={page.pageNumber}
            data-testid={`page-cell-${page.pageNumber}`}
            className={`${styles.cell} ${isSelected ? styles.selected : ''}`}
            role="option"
            aria-selected={isSelected}
            tabIndex={0}
            onClick={(event) => handleClick(page.pageNumber, event)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleClick(page.pageNumber, event as unknown as React.MouseEvent);
              }
            }}
          >
            {page.thumbnail ? (
              <img
                className={styles.thumb}
                src={page.thumbnail}
                alt=""
                style={{ width: thumbnailWidth }}
              />
            ) : (
              <span className={styles.placeholder} style={{ width: thumbnailWidth }}>
                {page.pageNumber}
              </span>
            )}
            <span className={styles.number}>{page.pageNumber}</span>
            {isSelected ? <span className={styles.badge}>{selected.length}</span> : null}
          </div>
        );
      })}
    </div>
  );
}
