import { describe, it, expect } from 'vitest';
import { HarmoniaClipperWorkflow } from '../server/_core/harmonia-clipper';
import { HarmoniaDurableStore } from '../server/_core/harmonia-durable-store';

describe('HARMONÍA Durable Store & Idempotency (10/10 Standard)', () => {
  it('should store and verify record integrity durably', () => {
    const clipper = new HarmoniaClipperWorkflow(
      'https://example.com/durable-test',
      'Durable Test',
      '<p>Content for durable store test.</p>'
    );

    clipper.prepare();
    clipper.confirm(true);
    const result = clipper.commit();

    const store = new HarmoniaDurableStore();
    const record = store.save(result.state, clipper.getState().validationEnvelope!);

    expect(record.idempotencyKey).toBe(result.state.idempotencyKey);
    expect(store.verifyRecordIntegrity(record.idempotencyKey)).toBe(true);
  });

  it('should detect checksum corruption or tampering in durable store', () => {
    const clipper = new HarmoniaClipperWorkflow(
      'https://example.com/tamper-test',
      'Tamper Test',
      '<p>Content for tamper test.</p>'
    );

    const store = new HarmoniaDurableStore();
    const record = store.save(clipper.getState(), clipper.getState().validationEnvelope!);

    // Tamper with state manually
    record.workflowState.title = 'Tampered Title';

    expect(store.verifyRecordIntegrity(record.idempotencyKey)).toBe(false);
  });
});
