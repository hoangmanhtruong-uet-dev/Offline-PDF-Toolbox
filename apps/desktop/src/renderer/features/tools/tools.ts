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
 * `feature` là mã trong đặc tả (F-01 … F-06), chỉ dùng nội bộ và trong tài
 * liệu — **không** hiển thị ra giao diện, vì người dùng không cần biết mã
 * nội bộ.
 */
export interface ToolDefinition {
  id: 'merge' | 'split' | 'compress' | 'rotate' | 'pages' | 'images';
  /** Mã tính năng trong đặc tả. */
  feature: string;
  nameKey: MessageKey;
  /** Mô tả một dòng hiện trên thẻ công cụ. */
  descriptionKey: MessageKey;
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
    descriptionKey: 'home.tool.mergeDesc',
    icon: LibraryRegular,
    accepts: 'pdf',
    ready: true,
  },
  {
    id: 'split',
    feature: 'F-02',
    nameKey: 'home.tool.split',
    descriptionKey: 'home.tool.splitDesc',
    icon: CutRegular,
    accepts: 'pdf',
    ready: true,
  },
  {
    id: 'compress',
    feature: 'F-03',
    nameKey: 'home.tool.compress',
    descriptionKey: 'home.tool.compressDesc',
    icon: ArrowMinimizeRegular,
    accepts: 'pdf',
    ready: true,
  },
  {
    id: 'rotate',
    feature: 'F-04',
    nameKey: 'home.tool.rotate',
    descriptionKey: 'home.tool.rotateDesc',
    icon: ArrowRotateClockwiseRegular,
    accepts: 'pdf',
    ready: true,
  },
  {
    id: 'pages',
    feature: 'F-05',
    nameKey: 'home.tool.pages',
    descriptionKey: 'home.tool.pagesDesc',
    icon: DocumentTableRegular,
    accepts: 'pdf',
    ready: false,
  },
  {
    id: 'images',
    feature: 'F-06',
    nameKey: 'home.tool.images',
    descriptionKey: 'home.tool.imagesDesc',
    icon: ImageRegular,
    accepts: 'image',
    ready: false,
  },
];

/** Tìm công cụ theo mã. */
export function findTool(id: string): ToolDefinition | undefined {
  return TOOLS.find((tool) => tool.id === id);
}
