import { describe, it, expect } from 'vitest';
import { PVCUValidator } from '../server/_core/pvc-u-profile';
import { PVCULedger } from '../server/_core/pvc-u-ledger';

describe('Full-Stack Integration & PVC-U Protocol Test', () => {
  it('should execute end-to-end PVC-U validation and ledger append', () => {
    const validator = new PVCUValidator();
    const ledger = new PVCULedger();

    const envelope = validator.validateExtraction(
      'https://api.belentani.io/v1/sync',
      'Full-Stack Sync',
      '<p>Valid payload for enterprise CRM and automation sync.</p>'
    );

    expect(envelope.passed).toBe(true);
    
    const record = ledger.append('wf_full_stack_1', envelope);
    expect(record.sequenceId).toBe(1);
    expect(ledger.verifyIntegrity()).toBe(true);
  });
});
