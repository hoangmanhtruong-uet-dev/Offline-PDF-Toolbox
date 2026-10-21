import { create } from 'zustand';

/**
 * Danh sách ảnh của công cụ Ảnh sang PDF (F-06).
 *
 * Mỗi ảnh giữ đường dẫn và góc xoay. Thứ tự trong mảng là thứ tự
 * xuất hiện trong tệp PDF.
 */

/** Một ảnh trong danh sách. */
export interface ImageEntry {
  /** Định danh duy nhất trong phiên làm việc. */
  id: string;
  path: string;
  name: string;
  /** Góc xoay của ảnh, tính bằng độ. */
  rotation: 0 | 90 | 180 | 270;
  /** Chiều rộng ảnh gốc, tính bằng pixel. */
  width: number;
  /** Chiều cao ảnh gốc, tính bằng pixel. */
  height: number;
  /** Hình thu nhổ, nếu đã vẽ. */
  thumbnail?: string;
}

interface ImagesState {
  images: ImageEntry[];
  /** Thêm ảnh vào danh sách. */
  addImages: (paths: string[], names: string[]) => Promise<void>;
  /** Xóa một ảnh. */
  removeImage: (index: number) => void;
  /** Xoay thêm 90 độ một ảnh. */
  rotateImage: (index: number) => void;
  /** Chuyển một ảnh từ vị trí này sang vị trí khác. */
  moveImage: (from: number, to: number) => void;
  /** Vẽ hình thu nhổ cho một ảnh nếu chưa có. */
  loadThumbnail: (index: number) => Promise<void>;
  /** Xóa toàn bộ danh sách. */
  clear: () => void;
}

let idCounter = 0;

function nextId(): string {
  idCounter += 1;
  return `image-${Date.now().toString(36)}-${idCounter}`;
}

export const useImagesStore = create<ImagesState>((set, get) => ({
  images: [],

  addImages: async (paths, names) => {
    const entries: ImageEntry[] = [];

    for (let index = 0; index < paths.length; index += 1) {
      const path = paths[index] as string;
      const name = names[index] ?? path;

      try {
        // Việc đọc ảnh nằm ở tiến trình chính vì sharp là module native.
        const info = await window.optb.files.imageInfo(path);
        if (!info) continue;

        entries.push({
          id: nextId(),
          path,
          name,
          rotation: 0,
          width: info.width,
          height: info.height,
        });
      } catch {
        // Bỏ qua ảnh không đọc được; các ảnh còn lại vẫn dùng được.
      }
    }

    if (entries.length > 0) {
      set({ images: [...get().images, ...entries] });
    }
  },

  removeImage: (index) => {
    set({ images: get().images.filter((_image, position) => position !== index) });
  },

  rotateImage: (index) => {
    set({
      images: get().images.map((image, position) =>
        position === index
          ? { ...image, rotation: (((image.rotation + 90) % 360) as ImageEntry['rotation']) }
          : image,
      ),
    });
  },

  moveImage: (from, to) => {
    const images = [...get().images];
    if (from < 0 || from >= images.length || to < 0 || to >= images.length) return;
    const [moved] = images.splice(from, 1);
    if (!moved) return;
    images.splice(to, 0, moved);
    set({ images });
  },

  loadThumbnail: async (index) => {
    const image = get().images[index];
    if (!image || image.thumbnail) return;

    try {
      const url = await window.optb.files.imageThumbnail(image.path, image.rotation);
      if (!url) return;

      set({
        images: get().images.map((item, position) =>
          position === index ? { ...item, thumbnail: url } : item,
        ),
      });
    } catch {
      // Không vẽ được hình thu nhổ thì vẫn dùng được ảnh trong tệp PDF.
    }
  },

  clear: () => {
    set({ images: [] });
  },
}));
