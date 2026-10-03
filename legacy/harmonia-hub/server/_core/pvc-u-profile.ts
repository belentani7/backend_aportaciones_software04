/**
 * Protocolo de Validación Universal (PVC-U) - Perfil de Validación para HARMONÍA Clipper
 * Implementa esferas de validación, subesferas de IA (4-A, 2-A) y Validation Envelopes.
 */

import crypto from 'crypto';

export interface ValidationEnvelope {
  envelopeId: string;
  timestamp: string;
  profileVersion: string;
  spheresChecked: number[];
  passed: boolean;
  violations: { sphere: string; code: string; message: string }[];
  inputHash: string;
  signature: string;
}

export class PVCUValidator {
  private profileVersion = '1.0.0';

  /**
   * Ejecuta la validación completa sobre el contenido extraído y metadatos de la URL.
   */
  public validateExtraction(url: string, title: string, htmlContent: string): ValidationEnvelope {
    const violations: { sphere: string; code: string; message: string }[] = [];
    const spheresChecked = [1, 2, 4, 4.1]; // Esferas activas para el Clipper

    // Esfera 1: Integridad y Tipos de Datos
    if (!url || typeof url !== 'string' || (!url.startsWith('http://') && !url.startsWith('https://'))) {
      violations.push({ sphere: 'Esfera-1', code: 'PVC-101', message: 'URL inválida o ausente' });
    }
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      violations.push({ sphere: 'Esfera-1', code: 'PVC-102', message: 'Título ausente o vacío' });
    }

    // Esfera 4: Seguridad y Contenido Sensible
    if (htmlContent.includes('<script') && htmlContent.includes('eval(')) {
      violations.push({ sphere: 'Esfera-4', code: 'PVC-401', message: 'Contenido HTML contiene patrones sospechosos de ejecución de código' });
    }

    // Subesfera 4-A: Validación de Entradas / Prevención de Inyección / Fuga
    const lowerHtml = htmlContent.toLowerCase();
    if (lowerHtml.includes('ignore previous instructions') || lowerHtml.includes('system prompt')) {
      violations.push({ sphere: 'Subesfera-4A', code: 'PVC-4A-001', message: 'Intento detectado de manipulación o inyección de prompt en el contenido web' });
    }

    // Subesfera 2-A: Semántica Inteligente (Longitud y Coherencia)
    if (htmlContent.length < 20) {
      violations.push({ sphere: 'Subesfera-2A', code: 'PVC-2A-001', message: 'Contenido extraído demasiado corto para ser un artículo válido' });
    }

    const passed = violations.length === 0;
    const inputHash = crypto.createHash('sha256').update(htmlContent + url).digest('hex');
    const envelopeId = `env_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const signature = crypto.createHmac('sha256', 'pvc-u-secret').update(envelopeId + inputHash).digest('hex');

    return {
      envelopeId,
      timestamp: new Date().toISOString(),
      profileVersion: this.profileVersion,
      spheresChecked,
      passed,
      violations,
      inputHash,
      signature,
    };
  }
}
