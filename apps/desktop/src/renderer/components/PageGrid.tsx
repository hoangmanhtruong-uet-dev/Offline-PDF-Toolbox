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
    borderRadius: '10px',
    cursor: 'pointer',
    userSelect: 'none',
    ...shorthands.border('2px', 'solid', 'transparent'),
    transitionProperty: 'border-color, background-color, transform',
    transitionDuration: '120ms',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3,
      transform: 'translateY(-2px)',
    },
  },
  selected: {
    ...shorthands.borderColor(tokens.colorBrandStroke1),
    backgroundColor: tokens.colorBrandBackground,
    boxShadow: '0 4px 12px rgba(225, 29, 72, 0.1)',
  },
  over: {
    ...shorthands.borderColor(tokens.colorBrandStroke2),
  },
  thumb: {
    width: '100%',
    aspectRatio: '3 / 4',
    objectFit: 'contain',
    borderRadius: '6px',
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
  },
  placeholder: {
    width: '100%',
    aspectRatio: '3 / 4',
    borderRadius: '6px',
    backgroundColor: tokens.colorNeutralBackground3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  number: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
  },
  badge: {
    position: 'absolute',
    top: tokens.spacingVerticalXS,
    right: tokens.spacingVerticalXS,
    minWidth: '22px',
    height: '22px',
    borderRadius: '11px',
    backgroundColor: tokens.colorBrandStroke1,
    color: '#ffffff',
    fontWeight: tokens.fontWeightBold,
    fontSize: tokens.fontSizeBase100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingInline: '4px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
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
  /** Kéo thả để đổi thứ tự. */
  onReorder?: (from: number, to: number) => void;
  /** Hành động riêng cho từng ô. */
  renderActions?: (index: number) => React.ReactNode;
}

export function PageGrid({
  pages,
  selected,
  onSelectionChange,
  onPageVisible,
  thumbnailWidth = 120,
  onReorder,
  renderActions,
}: PageGridProps): React.JSX.Element {
  const styles = useStyles();
  const [lastClicked, setLastClicked] = useState<number | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
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
      {pages.map((page, index) => {
        const isSelected = selected.includes(page.pageNumber);

        return (
          <div
            key={page.pageNumber}
            ref={(element) => {
              if (element) cellRefs.current.set(index, element);
              else cellRefs.current.delete(index);
            }}
            className={`${styles.cell} ${isSelected ? styles.selected : ''} ${
              overIndex === index ? styles.over : ''
            }`}
            data-testid={`page-cell-${page.pageNumber}`}
            data-page={page.pageNumber}
            data-index={index}
            role="option"
            aria-selected={isSelected}
            tabIndex={0}
            draggable={Boolean(onReorder)}
            onDragStart={(event) => {
              setDragFrom(index);
              event.dataTransfer.effectAllowed = 'move';
              // Firefox cần dữ liệu để bắt đầu kéo thả.
              event.dataTransfer.setData('text/plain', String(index));
            }}
            onDragEnd={() => {
              setDragFrom(null);
              setOverIndex(null);
            }}
            onDragOver={(event) => {
              if (!onReorder) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
              setOverIndex(index);
            }}
            onDrop={(event) => {
              if (!onReorder) return;
              event.preventDefault();
              const from = dragFrom ?? Number.parseInt(event.dataTransfer.getData('text/plain'), 10);
              if (Number.isInteger(from) && from !== index) onReorder(from, index);
              setDragFrom(null);
              setOverIndex(null);
            }}
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

            {renderActions ? renderActions(index) : null}

            {isSelected ? <span className={styles.badge}>{selected.length}</span> : null}
          </div>
        );
      })}
    </div>
  );
}
