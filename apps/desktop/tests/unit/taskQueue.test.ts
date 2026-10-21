import { mkdtemp, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { TaskProgress, TaskResult } from '@shared/types';

import { TempManager } from '../../src/main/services/tempManager';
import { TaskQueue } from '../../src/main/services/taskQueue';

async function tempRoot(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'optb-queue-'));
}

describe('TaskQueue', () => {
  it('chạy tác vụ và báo trạng thái thành công', async () => {
    const tempManager = new TempManager(await tempRoot());
    await tempManager.init();

    const queue = new TaskQueue({ tempManager, concurrency: 1 });
    const states: TaskResult[] = [];
    queue.on('state', (result: TaskResult) => states.push(result));

    const taskId = queue.enqueue(async () => ({ outputPaths: ['/tmp/a.pdf'] }));

    await new Promise<void>((resolve) => queue.once('state', () => resolve()));

    expect(states).toHaveLength(1);
    expect(states[0].taskId).toBe(taskId);
    expect(states[0].state).toBe('succeeded');
    expect(states[0].outputPaths).toEqual(['/tmp/a.pdf']);
  });

  it('báo tiến độ trong khoảng 0-100', async () => {
    const tempManager = new TempManager(await tempRoot());
    await tempManager.init();

    const queue = new TaskQueue({ tempManager, concurrency: 1 });
    const progress: TaskProgress[] = [];
    queue.on('progress', (value: TaskProgress) => progress.push(value));

    queue.enqueue(async (context) => {
      context.report(42, 'processing');
      context.report(120, 'writing');
      context.report(-5, 'writing');
      return { outputPaths: [] };
    });

    await new Promise<void>((resolve) => queue.once('state', () => resolve()));

    expect(progress.map((item) => item.percent)).toEqual([42, 100, 0]);
  });

  it('báo lỗi có mã khi tác vụ thất bại', async () => {
    const tempManager = new TempManager(await tempRoot());
    await tempManager.init();

    const queue = new TaskQueue({ tempManager, concurrency: 1 });
    const states: TaskResult[] = [];
    queue.on('state', (result: TaskResult) => states.push(result));

    queue.enqueue(async () => {
      throw new Error('loi');
    });

    await new Promise<void>((resolve) => queue.once('state', () => resolve()));

    expect(states[0].state).toBe('failed');
    expect(states[0].error?.code).toBe('E_UNKNOWN');
  });

  it('cho phép hủy tác vụ đang chạy và dọn thư mục tạm', async () => {
    const root = await tempRoot();
    const tempManager = new TempManager(root);
    await tempManager.init();

    const queue = new TaskQueue({ tempManager, concurrency: 1 });
    const states: TaskResult[] = [];
    queue.on('state', (result: TaskResult) => states.push(result));

    const taskId = queue.enqueue(async (context) => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      if (context.signal.aborted) throw new Error('da huy');
      return { outputPaths: [] };
    });

    queue.cancel(taskId);

    await new Promise<void>((resolve) => queue.once('state', () => resolve()));

    expect(states[0].state).toBe('cancelled');
    expect(await readdir(root)).toHaveLength(0);
  });

  it('hủy được tác vụ đang chờ mà không chạy nó', async () => {
    const tempManager = new TempManager(await tempRoot());
    await tempManager.init();

    const queue = new TaskQueue({ tempManager, concurrency: 1 });
    const states: TaskResult[] = [];
    queue.on('state', (result: TaskResult) => states.push(result));

    let ran = false;
    const blocking = queue.enqueue(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
      return { outputPaths: [] };
    });
    const waiting = queue.enqueue(async () => {
      ran = true;
      return { outputPaths: [] };
    });

    queue.cancel(waiting);
    await new Promise<void>((resolve) => queue.once('state', () => resolve()));

    expect(ran).toBe(false);
    expect(states.some((item) => item.taskId === waiting && item.state === 'cancelled')).toBe(true);
    expect(blocking).toBeTruthy();
  });

  it('chạy song song không vượt quá giới hạn', async () => {
    const tempManager = new TempManager(await tempRoot());
    await tempManager.init();

    const queue = new TaskQueue({ tempManager, concurrency: 2 });
    let active = 0;
    let peak = 0;

    const task = async (): Promise<{ outputPaths: string[] }> => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 20));
      active -= 1;
      return { outputPaths: [] };
    };

    for (let i = 0; i < 6; i += 1) queue.enqueue(task);

    await new Promise<void>((resolve) => {
      let finished = 0;
      queue.on('state', () => {
        finished += 1;
        if (finished === 6) resolve();
      });
    });

    expect(peak).toBeLessThanOrEqual(2);
  });

  it('dọn thư mục tạm sau khi tác vụ kết thúc', async () => {
    const root = await tempRoot();
    const tempManager = new TempManager(root);
    await tempManager.init();

    const queue = new TaskQueue({ tempManager, concurrency: 1 });
    queue.enqueue(async () => ({ outputPaths: [] }));

    await new Promise<void>((resolve) => queue.once('state', () => resolve()));

    expect(await readdir(root)).toHaveLength(0);
  });
});
