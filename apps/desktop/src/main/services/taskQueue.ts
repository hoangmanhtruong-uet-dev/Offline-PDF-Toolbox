import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import { cpus } from 'node:os';

import { toErrorPayload } from '@shared/errors';
import type { TaskDetails } from '@shared/tasks';
import type { TaskPhase, TaskResult, TaskState } from '@shared/types';

import type { TempManager } from './tempManager';

/**
 * Hàng đợi tác vụ.
 *
 * Quy tắc bắt buộc (ARCHITECTURE.md mục 5):
 * 1. Mỗi tác vụ có thư mục tạm riêng, xóa khi kết thúc.
 * 2. Ghi ra tệp tạm rồi kiểm tra lại trước khi đổi tên vào đích (việc kiểm
 *    tra nằm trong handler, hàng đợi chỉ bảo đảm vòng đời).
 * 3. Chạy ở luồng nền, không bao giờ trên luồng giao diện.
 * 4. Hủy được ở mọi lúc.
 * 5. Song song tối đa bằng số nhân CPU trừ một, không quá 4.
 */

/** Ngữ cảnh truyền cho handler của một tác vụ. */
export interface TaskContext {
  taskId: string;
  /** Bị kích hoạt khi người dùng hủy tác vụ. */
  signal: AbortSignal;
  /** Thư mục tạm riêng của tác vụ. */
  tempDir: string;
  /** Báo tiến độ. `percent` là số nguyên 0-100. */
  report(percent: number, phase: TaskPhase, messageKey?: string): void;
}

/** Handler của một tác vụ. */
export type TaskHandler = (context: TaskContext) => Promise<{
  outputPaths?: string[];
  /** Chi tiết riêng theo loại tác vụ, gửi kèm kết quả. */
  details?: TaskDetails;
}>;

interface TaskEntry {
  id: string;
  handler: TaskHandler;
  state: TaskState;
  controller: AbortController;
  tempDir?: string;
}

export interface TaskQueueOptions {
  tempManager: TempManager;
  /** Số tác vụ chạy song song tối đa. */
  concurrency?: number;
}

export class TaskQueue extends EventEmitter {
  private readonly tempManager: TempManager;
  private readonly concurrency: number;
  private readonly entries = new Map<string, TaskEntry>();
  private readonly pending: string[] = [];
  private active = 0;

  constructor(options: TaskQueueOptions) {
    super();
    this.tempManager = options.tempManager;
    this.concurrency = options.concurrency ?? defaultConcurrency();
  }

  /** Đưa một tác vụ vào hàng đợi và trả về mã tác vụ. */
  enqueue(handler: TaskHandler): string {
    const id = randomUUID();
    this.entries.set(id, {
      id,
      handler,
      state: 'queued',
      controller: new AbortController(),
    });
    this.pending.push(id);
    this.pump();
    return id;
  }

  /** Hủy một tác vụ. Hủy tác vụ đang chờ sẽ bỏ qua luôn. */
  cancel(taskId: string): boolean {
    const entry = this.entries.get(taskId);
    if (!entry) return false;
    if (entry.state === 'succeeded' || entry.state === 'failed' || entry.state === 'cancelled') {
      return false;
    }

    entry.controller.abort();

    if (entry.state === 'queued') {
      const index = this.pending.indexOf(taskId);
      if (index >= 0) this.pending.splice(index, 1);
      entry.state = 'cancelled';
      this.emitState(entry, { outputPaths: [] });
      void this.tempManager.removeTaskDir(entry.tempDir ?? '');
      this.entries.delete(taskId);
    }

    return true;
  }

  /** Trạng thái hiện tại của một tác vụ. */
  getState(taskId: string): TaskState | undefined {
    return this.entries.get(taskId)?.state;
  }

  /** Số tác vụ đang chạy. */
  get activeCount(): number {
    return this.active;
  }

  private pump(): void {
    while (this.active < this.concurrency && this.pending.length > 0) {
      const id = this.pending.shift();
      if (!id) return;
      const entry = this.entries.get(id);
      if (!entry || entry.state !== 'queued') continue;

      this.active += 1;
      entry.state = 'running';
      void this.run(entry);
    }
  }

  private async run(entry: TaskEntry): Promise<void> {
    entry.tempDir = await this.tempManager.createTaskDir(entry.id);

    const context: TaskContext = {
      taskId: entry.id,
      signal: entry.controller.signal,
      tempDir: entry.tempDir,
      report: (percent, phase, messageKey = 'tasks.progress') => {
        const clamped = Math.max(0, Math.min(100, Math.round(percent)));
        this.emit('progress', { taskId: entry.id, phase, percent: clamped, messageKey });
      },
    };

    let outputPaths: string[] = [];
    let error: TaskResult['error'];
    let details: TaskDetails | undefined;

    try {
      const result = await entry.handler(context);
      outputPaths = result.outputPaths ?? [];
      details = result.details;
      entry.state = entry.controller.signal.aborted ? 'cancelled' : 'succeeded';
    } catch (caught) {
      if (entry.controller.signal.aborted) {
        entry.state = 'cancelled';
      } else {
        entry.state = 'failed';
        error = toErrorPayload(caught);
      }
    }

    // Dọn thư mục tạm trước khi báo trạng thái: khi người dùng thấy
    // "thành công" thì tệp tạm đã không còn trên đĩa.
    await this.tempManager.removeTaskDir(entry.tempDir ?? '');
    this.entries.delete(entry.id);
    this.active -= 1;

    this.emitState(entry, { outputPaths, error, details });
    this.pump();
  }

  private emitState(
    entry: TaskEntry,
    extra: { outputPaths: string[]; error?: TaskResult['error']; details?: TaskDetails },
  ): void {
    const result: TaskResult = {
      taskId: entry.id,
      state: entry.state,
      outputPaths: extra.outputPaths,
      ...(extra.error ? { error: extra.error } : {}),
      ...(extra.details ? { details: extra.details } : {}),
    };
    this.emit('state', result);
  }
}

/**
 * Số tác vụ chạy song song mặc định: số nhân CPU trừ một, tối đa 4.
 */
export function defaultConcurrency(): number {
  const count = cpus()?.length ?? 2;
  return Math.max(1, Math.min(4, count - 1));
}
