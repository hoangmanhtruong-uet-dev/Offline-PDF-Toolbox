import { ipcMain } from 'electron';

import { IPC } from '@shared/ipc';
import type { MergeTaskPayload, RotateTaskPayload, SplitTaskPayload } from '@shared/tasks';

import { runMerge, runRotate } from '../services/pdfTasks';
import type { QpdfRunner } from '../services/qpdfRunner';
import { runSplit } from '../services/splitTask';
import type { TaskQueue } from '../services/taskQueue';

/**
 * Đăng ký các lệnh chạy tác vụ.
 *
 * Mọi tác vụ đi qua hàng đợi chung, nên số tác vụ chạy song song bị giới hạn
 * và mỗi tác vụ có thư mục tạm riêng.
 */
export function registerTaskHandlers(queue: TaskQueue, qpdf: QpdfRunner): void {
  ipcMain.handle(
    IPC.taskStart,
    async (
      _event,
      request:
        | { kind: 'merge'; payload: MergeTaskPayload }
        | { kind: 'rotate'; payload: RotateTaskPayload }
        | { kind: 'split'; payload: SplitTaskPayload },
    ): Promise<string> => {
      switch (request.kind) {
        case 'merge':
          return queue.enqueue((context) => runMerge(context, request.payload, qpdf));
        case 'rotate':
          return queue.enqueue((context) => runRotate(context, request.payload, qpdf));
        case 'split':
          return queue.enqueue((context) => runSplit(context, request.payload, qpdf));
        default:
          throw new Error(`Loai tac vu khong duoc ho tro`);
      }
    },
  );

  ipcMain.handle(IPC.taskCancel, (_event, payload: { taskId: string }): boolean => {
    return queue.cancel(payload.taskId);
  });
}
