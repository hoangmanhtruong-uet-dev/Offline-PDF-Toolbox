import {
  ArrowMinimizeRegular,
  ArrowRotateClockwiseRegular,
  CutRegular,
  DocumentTableRegular,
  ImageRegular,
  LibraryRegular,
} from '@fluentui/react-icons';

import type { MessageKey } from '../../i18n';

/**
 * Danh mục sáu công cụ trên màn hình chính.
 *
 * Mã `F-xx` trùng với đặc tả tính năng trong FEATURES.md.
 */
export interface ToolDefinition {
  id: 'merge' | 'split' | 'compress' | 'rotate' | 'pages' | 'images';
  /** Mã tính năng trong đặc tả. */
  feature: string;
  nameKey: MessageKey;
  icon: typeof LibraryRegular;
  /** Công cụ nhận danh sách tệp PDF hay ảnh. */
  accepts: 'pdf' | 'image';
  /** Bản 1.0 đã sẵn sàng hay chưa. */
  ready: boolean;
}

export const TOOLS: ToolDefinition[] = [
  {
    id: 'merge',
    feature: 'F-01',
    nameKey: 'home.tool.merge',
    icon: LibraryRegular,
    accepts: 'pdf',
    ready: false,
  },
  {
    id: 'split',
    feature: 'F-02',
    nameKey: 'home.tool.split',
    icon: CutRegular,
    accepts: 'pdf',
    ready: false,
  },
  {
    id: 'compress',
    feature: 'F-03',
    nameKey: 'home.tool.compress',
    icon: ArrowMinimizeRegular,
    accepts: 'pdf',
    ready: false,
  },
  {
    id: 'rotate',
    feature: 'F-04',
    nameKey: 'home.tool.rotate',
    icon: ArrowRotateClockwiseRegular,
    accepts: 'pdf',
    ready: false,
  },
  {
    id: 'pages',
    feature: 'F-05',
    nameKey: 'home.tool.pages',
    icon: DocumentTableRegular,
    accepts: 'pdf',
    ready: false,
  },
  {
    id: 'images',
    feature: 'F-06',
    nameKey: 'home.tool.images',
    icon: ImageRegular,
    accepts: 'image',
    ready: false,
  },
];

/** Tìm công cụ theo mã. */
export function findTool(id: string): ToolDefinition | undefined {
  return TOOLS.find((tool) => tool.id === id);
}
