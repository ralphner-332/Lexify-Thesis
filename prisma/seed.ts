import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting YAWA database seeding...');

  // 1. Seed Users
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const users = [
    {
      email: 'student@yawa.local',
      name: 'Maria Santos (Law Student)',
      role: 'STUDENT',
      isDemo: true,
    },
    {
      email: 'expert@yawa.local',
      name: 'Atty. Eduardo Reyes (Legal Expert)',
      role: 'EXPERT',
      isDemo: true,
    },
    {
      email: 'admin@yawa.local',
      name: 'Prof. Carlos Mendoza (Lead Researcher)',
      role: 'ADMIN',
      isDemo: true,
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        isDemo: u.isDemo,
        passwordHash,
      },
      create: {
        email: u.email,
        name: u.name,
        role: u.role,
        passwordHash,
        isDemo: u.isDemo,
      },
    });
  }
  console.log('✅ Seeded default users (Student, Expert, Admin)');

  // 2. Seed Predetermined Criminal Law I Questions
  const questions = [
    {
      code: 'CRIM1-Q01',
      title: 'Justifying Circumstances: Self-Defense Analysis',
      scenario:
        'A, while walking along a dimly lit street, was suddenly confronted by B, who was brandishing a knife and shouted, "Give me your wallet or I will kill you!" B thrust the knife towards A. A, who was carrying a licensed firearm, quickly drew it and shot B once in the chest, fatally wounding him. Can A invoke self-defense under Article 11, paragraph 1 of the Revised Penal Code? Explain thoroughly using legal elements.',
      modelAnswer:
        'Yes, A can validly invoke self-defense under Article 11, Paragraph 1 of the Revised Penal Code. To successfully claim self-defense, three essential requisites must concur: First, unlawful aggression on the part of the victim. Here, B brandished a knife and thrust it towards A with a threat to kill, constituting actual, sudden, and imminent physical assault without provocation. Second, reasonable necessity of the means employed to prevent or repel it. Given that B used a deadly weapon (knife) in close proximity, A\'s response with a single gunshot to repel the mortal threat was reasonably proportionate under the doctrine of rational equivalence. Third, lack of sufficient provocation on the part of the person defending himself. A was merely walking along the street when assaulted, offering no provocation whatsoever. Thus, all three elements concur and A is exempt from criminal liability.',
      statutoryElements: JSON.stringify([
        'Unlawful aggression (essential and primary requisite)',
        'Reasonable necessity of the means employed to prevent or repel it',
        'Lack of sufficient provocation on the part of the person defending himself',
      ]),
      relevantProvisions: JSON.stringify([
        'Article 11, Paragraph 1, Revised Penal Code (Self-Defense)',
        'People v. Boholst-Caballero (Doctrine on rational necessity of means)',
      ]),
      conceptVariations: JSON.stringify([
        'imminent peril',
        'rational equivalence of weapon',
        'absence of provocation',
        'deadly assault',
      ]),
      orderIndex: 1,
      isActive: true,
      isDemo: true,
    },
    {
      code: 'CRIM1-Q02',
      title: 'Criminal Liability: Praeter Intentionem vs Aberratio Ictus',
      scenario:
        'X intended to slap Y during a heated argument. However, when X swung his hand, Y abruptly ducked, causing X\'s hand to strike Z, an elderly bystander standing behind Y. Z lost his balance, fell against a concrete curb, sustained a skull fracture, and died three hours later. What is the criminal liability of X, if any, under the Revised Penal Code? Analyze the proximate cause and applicable legal doctrines.',
      modelAnswer:
        'X is criminally liable for Homicide under Article 4, Paragraph 1 of the Revised Penal Code, which provides that criminal liability is incurred by any person committing a felony although the wrongful act done be different from that which he intended (aberratio ictus or mistake in the blow). Here, X was performing an unlawful act (slight physical injuries or assault against Y). His unlawful blow missed Y and hit Z, causing Z to fall and suffer a fatal skull fracture. Under the proximate cause doctrine, X is liable for all the natural and logical consequences of his initial felonious act, even if the death was greater than intended. However, X is entitled to the mitigating circumstance of lack of intention to commit so grave a wrong (praeter intentionem) under Article 13, Paragraph 3 of the Revised Penal Code.',
      statutoryElements: JSON.stringify([
        'Commission of an initial intentional felony',
        'Direct, natural, and logical consequence resulting in a different or greater felony (proximate cause)',
        'Mistake in the blow (aberratio ictus)',
        'Mitigating circumstance of praeter intentionem (Art. 13, Par. 3)',
      ]),
      relevantProvisions: JSON.stringify([
        'Article 4, Paragraph 1, Revised Penal Code (Criminal liability for unintended consequences)',
        'Article 13, Paragraph 3, Revised Penal Code (Praeter intentionem)',
        'Article 249, Revised Penal Code (Homicide)',
      ]),
      conceptVariations: JSON.stringify([
        'aberratio ictus',
        'mistake in the blow',
        'proximate cause',
        'praeter intentionem',
        'natural and logical consequence',
      ]),
      orderIndex: 2,
      isActive: true,
      isDemo: true,
    },
  ];

  for (const q of questions) {
    await prisma.question.upsert({
      where: { code: q.code },
      update: {
        title: q.title,
        scenario: q.scenario,
        modelAnswer: q.modelAnswer,
        statutoryElements: q.statutoryElements,
        relevantProvisions: q.relevantProvisions,
        conceptVariations: q.conceptVariations,
        orderIndex: q.orderIndex,
        isActive: q.isActive,
        isDemo: q.isDemo,
      },
      create: q,
    });
  }
  console.log('✅ Seeded predetermined Criminal Law I questions');

  // 3. Seed Scoring Rubric
  const defaultRubric = await prisma.rubric.upsert({
    where: { id: 'default-criminal-law-rubric' },
    update: {
      name: 'Criminal Law I Analytical Essay Rubric',
      description:
        'Standard 5-criterion rubric evaluating legal accuracy, statutory elements, legal reasoning (IRAC), application to facts, and terminology.',
      isDefault: true,
      isDemo: true,
    },
    create: {
      id: 'default-criminal-law-rubric',
      name: 'Criminal Law I Analytical Essay Rubric',
      description:
        'Standard 5-criterion rubric evaluating legal accuracy, statutory elements, legal reasoning (IRAC), application to facts, and terminology.',
      isDefault: true,
      isDemo: true,
    },
  });

  const criteria = [
    {
      rubricId: defaultRubric.id,
      name: 'Legal Accuracy & Rule Formulation',
      description:
        'Correctly cites, identifies, and explains applicable Revised Penal Code articles, legal doctrines, and statutory principles.',
      weightPercent: 25.0,
      maxPoints: 25.0,
      orderIndex: 1,
    },
    {
      rubricId: defaultRubric.id,
      name: 'Identification of Statutory Elements',
      description:
        'Comprehensive breakdown and identification of all required elements, qualifying, mitigating, or exempting circumstances.',
      weightPercent: 25.0,
      maxPoints: 25.0,
      orderIndex: 2,
    },
    {
      rubricId: defaultRubric.id,
      name: 'Legal Reasoning & IRAC Structure',
      description:
        'Logical progression from Issue and Rule to Analysis and Conclusion; soundness and clarity of deductive legal reasoning.',
      weightPercent: 25.0,
      maxPoints: 25.0,
      orderIndex: 3,
    },
    {
      rubricId: defaultRubric.id,
      name: 'Application of Law to Facts',
      description:
        'Synthesizes specific factual scenario nuances directly with statutory elements rather than abstract restatements.',
      weightPercent: 15.0,
      maxPoints: 15.0,
      orderIndex: 4,
    },
    {
      rubricId: defaultRubric.id,
      name: 'Legal Terminology & Precision',
      description:
        'Appropriate use of Philippine criminal law terms, Latin maxims, and recognized conceptual equivalents.',
      weightPercent: 10.0,
      maxPoints: 10.0,
      orderIndex: 5,
    },
  ];

  // Clean and re-seed criteria for this default rubric
  await prisma.rubricCriterion.deleteMany({ where: { rubricId: defaultRubric.id } });
  for (const c of criteria) {
    await prisma.rubricCriterion.create({ data: c });
  }
  console.log('✅ Seeded default Criminal Law I scoring rubric & criteria');

  // 4. Seed Baseline Agent Version (V1)
  await prisma.agentVersion.upsert({
    where: { versionTag: 'V1' },
    update: {
      label: 'Agent Version 1.0 (Baseline Evaluator)',
      description:
        'Initial baseline evaluator prompt grounded in RPC statutory elements and reference answers.',
      systemInstructions:
        'You are an academic legal evaluation assistant supporting legal research at FSUU College of Law in Criminal Law I. Evaluate the student essay answer against the model reference answer and approved rubric. Do not rely on exact keyword matching; evaluate conceptual accuracy, legal elements, and reasoning. Do not invent legal rules or external cases.',
      skillsDefinition: JSON.stringify({
        statutoryElementExtraction: true,
        iracStructureValidation: true,
        conceptEquivalenceMapping: true,
      }),
      rubricSnapshot: JSON.stringify(criteria),
      evaluationPatterns: JSON.stringify({
        scoringScale: '0-100',
        confidenceThreshold: 0.75,
        iracWeighting: { issue: 0.1, rule: 0.3, analysis: 0.4, conclusion: 0.2 },
      }),
      modelConfig: JSON.stringify({
        provider: 'google',
        modelId: 'gemini-2.0-flash',
        temperature: 0.2,
        topP: 0.95,
        maxOutputTokens: 2048,
      }),
      isLocked: true,
      isActive: true,
      lockedAt: new Date(),
    },
    create: {
      versionTag: 'V1',
      label: 'Agent Version 1.0 (Baseline Evaluator)',
      description:
        'Initial baseline evaluator prompt grounded in RPC statutory elements and reference answers.',
      systemInstructions:
        'You are an academic legal evaluation assistant supporting legal research at FSUU College of Law in Criminal Law I. Evaluate the student essay answer against the model reference answer and approved rubric. Do not rely on exact keyword matching; evaluate conceptual accuracy, legal elements, and reasoning. Do not invent legal rules or external cases.',
      skillsDefinition: JSON.stringify({
        statutoryElementExtraction: true,
        iracStructureValidation: true,
        conceptEquivalenceMapping: true,
      }),
      rubricSnapshot: JSON.stringify(criteria),
      evaluationPatterns: JSON.stringify({
        scoringScale: '0-100',
        confidenceThreshold: 0.75,
        iracWeighting: { issue: 0.1, rule: 0.3, analysis: 0.4, conclusion: 0.2 },
      }),
      modelConfig: JSON.stringify({
        provider: 'google',
        modelId: 'gemini-2.0-flash',
        temperature: 0.2,
        topP: 0.95,
        maxOutputTokens: 2048,
      }),
      isLocked: true,
      isActive: true,
      lockedAt: new Date(),
    },
  });
  console.log('✅ Seeded baseline Agent Version (V1 - Locked)');

  // 5. Seed Initial Audit Log
  await prisma.auditLog.create({
    data: {
      userEmail: 'system@yawa.local',
      action: 'SYSTEM_SEED',
      entityType: 'SYSTEM',
      entityId: 'initial-setup',
      details: JSON.stringify({
        seededUsers: users.map((u) => u.email),
        seededQuestions: questions.map((q) => q.code),
        seededRubric: defaultRubric.id,
        seededAgentVersion: 'V1',
      }),
      isDemo: true,
    },
  });
  console.log('✅ Recorded initial system seed in append-only AuditLog');
  console.log('✨ YAWA database setup complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
