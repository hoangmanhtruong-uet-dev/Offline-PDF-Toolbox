import { create } from 'zustand';

import type { ErrorPayload, TaskProgress, TaskResult } from '@shared/types';
import type { TaskKind } from '@shared/tasks';

/**
 * Trạng thái của tác vụ đang chạy.
 *
 * Tiến độ và kết quả được đẩy từ tiến trình chính qua preload.
 */

interface TaskState {
  /** Tác vụ đang chạy. */
  running: { taskId: string; kind: TaskKind } | null;
  /** Tiến độ gần nhất. */
  progress: TaskProgress | null;
  /** Kết quả của tác vụ vừa hoàn thành. */
  result: (TaskResult & { kind: TaskKind }) | null;
  /** Lỗi của tác vụ vừa thất bại. */
  error: ErrorPayload | null;
  /** Bắt đầu một tác vụ. */
  start: (kind: TaskKind, payload: unknown) => Promise<string | null>;
  /** Hủy tác vụ đang chạy. */
  cancel: () => Promise<void>;
  /** Xóa kết quả và lỗi. */
  clear: () => void;
}

let unsubscribeProgress: (() => void) | null = null;

/** Gắn trình nghe sự kiện từ tiến trình chính (chỉ gọi một lần). */
function ensureListeners(store: {
  setState: (partial: Partial<TaskState>) => void;
  getState: () => TaskState;
}): void {
  if (unsubscribeProgress) return;

  unsubscribeProgress = window.optb.onTaskProgress((progress) => {
    store.setState({ progress: progress as TaskProgress });
  });

  window.optb.onTaskState((result) => {
    const taskResult = result as TaskResult;
    const current = store.getState();

    if (taskResult.state === 'failed' && taskResult.error) {
      store.setState({ running: null, progress: null, error: taskResult.error, result: null });
      return;
    }

    if (taskResult.state === 'cancelled') {
      store.setState({ running: null, progress: null });
      return;
    }

    store.setState({
      running: null,
      progress: null,
      error: null,
      result: { ...taskResult, kind: current.running?.kind ?? 'merge' },
    });
  });
}

export const useTaskStore = create<TaskState>((set, get) => ({
  running: null,
  progress: null,
  result: null,
  error: null,

  start: async (kind, payload) => {
    ensureListeners({ setState: set, getState: get });

    set({ running: null, progress: null, result: null, error: null });

    try {
      const taskId = await window.optb.tasks.start({ kind, payload });
      set({ running: { taskId, kind } });
      return taskId;
    } catch (error) {
      set({
        error: {
          code: 'E_UNKNOWN',
          messageKey: 'errors.unknown',
          detail: error instanceof Error ? error.message : String(error),
        },
      });
      return null;
    }
  },

  cancel: async () => {
    const running = get().running;
    if (!running) return;
    await window.optb.tasks.cancel(running.taskId);
  },

  clear: () => set({ result: null, error: null, progress: null }),
}));
