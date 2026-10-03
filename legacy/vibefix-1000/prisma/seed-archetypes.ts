import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedArchetypes() {
  console.log('Seeding archetypes...')
  
  // Import archetypes from the data files
  const { CTX_ARCHETYPES, ALUC_ARCHETYPES } = await import('../src/data/solutions/arch-contexto-alucinaciones.ts')
  const { ENT_ARCHETYPES, GIT_ARCHETYPES } = await import('../src/data/solutions/arch-entorno-git.ts')
  const { DEP_ARCHETYPES, SEG_ARCHETYPES } = await import('../src/data/solutions/arch-despliegue-seguridad.ts')
  const { PERF_ARCHETYPES, COST_ARCHETYPES } = await import('../src/data/solutions/arch-rendimiento-costes.ts')
  const { COLAB_ARCHETYPES, TEST_ARCHETYPES } = await import('../src/data/solutions/arch-colaboracion-pruebas.ts')

  const allArchetypes = [
    ...CTX_ARCHETYPES,
    ...ALUC_ARCHETYPES,
    ...ENT_ARCHETYPES,
    ...GIT_ARCHETYPES,
    ...DEP_ARCHETYPES,
    ...SEG_ARCHETYPES,
    ...PERF_ARCHETYPES,
    ...COST_ARCHETYPES,
    ...COLAB_ARCHETYPES,
    ...TEST_ARCHETYPES,
  ]

  console.log(`Found ${allArchetypes.length} archetypes`)

  for (const arch of allArchetypes) {
    await prisma.archetype.upsert({
      where: { archetypeId: arch.id },
      update: {
        domain: arch.domain,
        title: arch.title,
        problem: arch.problem,
        rootCause: arch.rootCause,
        steps: JSON.stringify(arch.steps),
        codeFix: arch.codeFix,
        prevention: arch.prevention,
        tags: JSON.stringify(arch.tags),
        severity: arch.severity,
        frequency: arch.frequency,
        source: arch.source,
      },
      create: {
        archetypeId: arch.id,
        domain: arch.domain,
        title: arch.title,
        problem: arch.problem,
        rootCause: arch.rootCause,
        steps: JSON.stringify(arch.steps),
        codeFix: arch.codeFix,
        prevention: arch.prevention,
        tags: JSON.stringify(arch.tags),
        severity: arch.severity,
        frequency: arch.frequency,
        source: arch.source,
      },
    })
    console.log(`  ✓ ${arch.id}: ${arch.title}`)
  }

  console.log('Archetypes seeded successfully!')
}

seedArchetypes()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })