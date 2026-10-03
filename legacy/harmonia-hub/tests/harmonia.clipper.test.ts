import { describe, it, expect } from 'vitest';
import { HarmoniaClipperWorkflow } from '../server/_core/harmonia-clipper';

describe('HARMONÍA Clipper Workflow (Three-Phase Protocol)', () => {
  it('should initialize workflow in pending state with correct hash and idempotency key', () => {
    const clipper = new HarmoniaClipperWorkflow(
      'https://example.com/article',
      'Test Article',
      '<html><body><h1>Hello World</h1><p>This is a test article.</p></body></html>'
    );

    const state = clipper.getState();
    expect(state.workflowId).toBeDefined();
    expect(state.phase).toBe('prepare');
    expect(state.status).toBe('pending');
    expect(state.inputHash).toBeDefined();
    expect(state.idempotencyKey).toBeDefined();
    expect(state.wordCount).toBeGreaterThan(0);
  });

  it('should transition through Phase A (Prepare) to awaiting_confirmation', () => {
    const clipper = new HarmoniaClipperWorkflow(
      'https://example.com/article',
      'Test Article',
      '<p>Sample content</p>'
    );

    const preparedState = clipper.prepare();
    expect(preparedState.phase).toBe('prepare');
    expect(preparedState.status).toBe('awaiting_confirmation');
    expect(preparedState.auditTrail.some(e => e.event === 'phase_prepare_completed')).toBe(true);
  });

  it('should execute Phase B (Confirm - Approved) and transition to executing', () => {
    const clipper = new HarmoniaClipperWorkflow(
      'https://example.com/article',
      'Test Article',
      '<p>Sample content</p>'
    );

    clipper.prepare();
    const confirmedState = clipper.confirm(true);

    expect(confirmedState.phase).toBe('confirm');
    expect(confirmedState.approved).toBe(true);
    expect(confirmedState.status).toBe('executing');
    expect(confirmedState.auditTrail.some(e => e.event === 'phase_confirm_approved')).toBe(true);
  });

  it('should execute Phase B (Confirm - Rejected) and transition to cancelled', () => {
    const clipper = new HarmoniaClipperWorkflow(
      'https://example.com/article',
      'Test Article',
      '<p>Sample content</p>'
    );

    clipper.prepare();
    const rejectedState = clipper.confirm(false);

    expect(rejectedState.phase).toBe('confirm');
    expect(rejectedState.approved).toBe(false);
    expect(rejectedState.status).toBe('cancelled');
    expect(rejectedState.auditTrail.some(e => e.event === 'phase_confirm_rejected')).toBe(true);
  });

  it('should execute Phase C (Commit) successfully after approval', () => {
    const clipper = new HarmoniaClipperWorkflow(
      'https://example.com/article',
      'Test Article',
      '<p>Sample content</p>'
    );

    clipper.prepare();
    clipper.confirm(true);
    const result = clipper.commit();

    expect(result.success).toBe(true);
    expect(result.state.phase).toBe('commit');
    expect(result.state.status).toBe('succeeded');
    expect(result.fileContent).toContain('Test Article');
    expect(result.state.auditTrail.some(e => e.event === 'phase_commit_succeeded')).toBe(true);
  });

  it('should reject commit if not approved', () => {
    const clipper = new HarmoniaClipperWorkflow(
      'https://example.com/article',
      'Test Article',
      '<p>Sample content</p>'
    );

    clipper.prepare();
    clipper.confirm(false);

    expect(() => clipper.commit()).toThrow();
  });

  it('should maintain deterministic input hash for identical content and URL', () => {
    const html = '<p>Identical content</p>';
    const clipper1 = new HarmoniaClipperWorkflow('https://a.com', 'Title', html);
    const clipper2 = new HarmoniaClipperWorkflow('https://a.com', 'Title', html);

    expect(clipper1.getState().inputHash).toBe(clipper2.getState().inputHash);
    expect(clipper1.getState().idempotencyKey).not.toBe(clipper2.getState().idempotencyKey);
  });
});
