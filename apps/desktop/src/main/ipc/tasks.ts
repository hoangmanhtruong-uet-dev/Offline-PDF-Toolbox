import { ipcMain } from 'electron';

import { IPC } from '@shared/ipc';
import type { MergeTaskPayload, RotateTaskPayload } from '@shared/tasks';

import { runMerge, runRotate } from '../services/pdfTasks';
import type { QpdfRunner } from '../services/qpdfRunner';
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
      request: { kind: 'merge'; payload: MergeTaskPayload } | { kind: 'rotate'; payload: RotateTaskPayload },
    ): Promise<string> => {
      if (request.kind === 'merge') {
        return queue.enqueue((context) => runMerge(context, request.payload, qpdf));
      }
      return queue.enqueue((context) => runRotate(context, request.payload, qpdf));
    },
  );

  ipcMain.handle(IPC.taskCancel, (_event, payload: { taskId: string }): boolean => {
    return queue.cancel(payload.taskId);
  });
}
