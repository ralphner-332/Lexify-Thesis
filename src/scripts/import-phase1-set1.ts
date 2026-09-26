import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const PHASE1_SET1_QUESTIONS = [
  {
    code: 'PHASE1-SET1-Q01',
    title: 'Partnership Formation: Lending Agreement vs. Capital Contribution',
    scenario:
      'Alyssa Valdez gave Bam Aquino ₱1,000,000 to finance his lending business under a written agreement requiring him to pay her a fixed monthly amount as interest and return the principal upon demand. Alyssa did not participate in managing the business, bind Bam in transactions, or agree to share in its losses. When Bam later failed to return the ₱1,000,000, he claimed that the amount was a capital contribution and that Alyssa was his partner. Was a partnership created between Alyssa and Bam?',
    modelAnswer: `Answer:
No. A partnership was not created between Alyssa and Bam.

Rule:
Under Article 1767 of the Civil Code, a partnership requires an agreement to contribute money, property, or industry to a common fund with the intention of dividing profits. In Santiago v. Garcia, G.R. No. 228356, March 9, 2020, the Supreme Court held that there must be an unmistakable intention to form a partnership and that the absence of profit sharing and mutual agency militates against its existence.

Application:
Here, Alyssa was entitled only to fixed monthly interest and the return of her principal. She did not agree to share profits or losses and had no authority to bind Bam in the ordinary course of the lending business. These circumstances do not show an intention to form a partnership.

Conclusion:
Thus, Alyssa and Bam did not form a partnership.`,
    statutoryElements: JSON.stringify([
      'Agreement to contribute money, property, or industry to a common fund (Art. 1767)',
      'Intention of dividing profits among the parties',
      'Unmistakable intention to form a partnership and mutual agency',
      'Absence of profit sharing and lack of management authority negates partnership existence',
    ]),
    relevantProvisions: JSON.stringify([
      'Article 1767 of the Civil Code (Definition and Essential Requisites of Partnership)',
      'Santiago v. Garcia, G.R. No. 228356, March 9, 2020 (Intent to form partnership; absence of profit sharing and mutual agency)',
    ]),
    conceptVariations: JSON.stringify([
      'lending agreement vs capital contribution',
      'fixed interest vs profit sharing',
      'mutual agency',
      'intention to form a partnership',
    ]),
    orderIndex: 1,
    isActive: true,
    isDemo: false,
  },
  {
    code: 'PHASE1-SET1-Q02',
    title: 'Co-Ownership vs. Partnership: Sharing Payments from Inherited Land',
    scenario:
      'A, B, and C inherited an undivided parcel of land in the Philippines. Without agreeing to contribute the land to a common fund or to operate a business together, they allowed D to use the property as a parking area in exchange for monthly payments. A, B, and C divided the payments according to their respective ownership shares. A later claimed that their receipt and division of the payments established a partnership, while B and C maintained that they remained co-owners of the land. Was a partnership formed among A, B, and C by reason of their co-ownership and division of the payments derived from the property?',
    modelAnswer: `Answer:
No, a partnership was not formed among A, B, and C by reason of their co-ownership and division of the payments derived from the property.

Rule:
Under Article 1769(2) of the Civil Code, co-ownership or co-possession does not by itself establish a partnership, regardless of whether the co-owners or co-possessors share any profits made from the use of the property.

Application:
Here, A, B, and C inherited the land as co-owners and allowed D to use it as a parking area. They divided the resulting payments according to their respective ownership shares. They did not agree to contribute the land to a common fund or to operate a business as partners. Therefore, their co-ownership and division of the payments did not by themselves establish a partnership.

Conclusion:
Thus, A, B, and C remained co-owners of the land, and no partnership arose from their sharing of the payments derived from its use.`,
    statutoryElements: JSON.stringify([
      'Co-ownership or co-possession does not by itself establish a partnership (Art. 1769[2])',
      'Sharing of gross returns or proceeds does not of itself establish partnership',
      'Absence of clear agreement to form a common fund or conduct a business as partners',
    ]),
    relevantProvisions: JSON.stringify([
      'Article 1769, Paragraph 2 of the Civil Code (Rules in Determining Existence of Partnership; Co-ownership)',
    ]),
    conceptVariations: JSON.stringify([
      'co-ownership does not establish partnership',
      'sharing of rental/parking payments',
      'undivided parcel of land',
      'absence of common fund',
    ]),
    orderIndex: 2,
    isActive: true,
    isDemo: false,
  },
  {
    code: 'PHASE1-SET1-Q03',
    title: 'Secret Articles of Partnership: Lack of Juridical Personality',
    scenario:
      'A, B, and C agreed to conduct a trading activity in the Philippines under articles that they kept secret among themselves. Their agreement authorized any member to enter into contracts with third persons in that member’s own name. Acting under the agreement, A entered into a supply contract with D in A’s own name. B and C later claimed that their association possessed a juridical personality separate from its members. Is the association a juridical person separate and distinct from A, B, and C?',
    modelAnswer: `Answer:
No, the association has no juridical personality separate and distinct from A, B, and C.

Rule:
Under Article 1775 of the Civil Code, associations and societies whose articles are kept secret among the members, and wherein any member may contract in his or her own name with third persons, have no juridical personality and are governed by the provisions relating to co-ownership.

Application:
Here, A, B, and C kept the articles governing their association secret among themselves. Their agreement also authorized any member to contract with third persons in that member’s own name, as A did when contracting with D. These circumstances bring the association within Article 1775.

Conclusion:
Thus, the association has no juridical personality separate and distinct from A, B, and C and is governed by the provisions relating to co-ownership.`,
    statutoryElements: JSON.stringify([
      'Articles kept secret among the members (Art. 1775)',
      'Members authorized to contract with third persons in their own name',
      'Deprivation of separate juridical personality and governance under co-ownership rules',
    ]),
    relevantProvisions: JSON.stringify([
      'Article 1775 of the Civil Code (Secret Associations and Absence of Juridical Personality)',
    ]),
    conceptVariations: JSON.stringify([
      'secret articles of association',
      'contracting in own name',
      'lack of separate juridical personality',
      'governed by co-ownership rules',
    ]),
    orderIndex: 3,
    isActive: true,
    isDemo: false,
  },
  {
    code: 'PHASE1-SET1-Q04',
    title: 'Partnership Formation: Agreement to Share Losses',
    scenario:
      'Aira Villegas and Camille Villar each contributed ₱600,000 to open a specialty food business in Quezon City. Their agreement provided that they would divide net profits equally and shoulder business losses in the same proportion. When the venture later suffered substantial losses, Camille claimed that their arrangement was not a partnership because the agreement expressly required them to share losses. Was a partnership formed between Aira and Camille?',
    modelAnswer: `Answer:
Yes. A partnership was formed between Aira and Camille.

Rule:
Under Article 1767 of the Civil Code, a partnership exists when two or more persons contribute money, property, or industry to a common fund with the intention of dividing profits among themselves. In Jarantilla, Jr. v. Jarantilla, G.R. No. 154486, December 1, 2010, the Supreme Court stated that a partnership inter se generally involves an intent to form a partnership and participation in both profits and losses.

Application:
Here, both parties contributed money to a common business, agreed to divide profits equally, and likewise agreed to share losses. Far from negating the partnership, the provision on losses is consistent with their intention to operate the venture as partners.

Conclusion:
Thus, a partnership was formed between Aira and Camille.`,
    statutoryElements: JSON.stringify([
      'Contribution of money, property, or industry to a common fund (Art. 1767)',
      'Intention of dividing profits among themselves',
      'Agreement to share business losses as consistent with partnership intent (Jarantilla v. Jarantilla)',
    ]),
    relevantProvisions: JSON.stringify([
      'Article 1767 of the Civil Code (Definition and Essential Requisites of Partnership)',
      'Jarantilla, Jr. v. Jarantilla, G.R. No. 154486, December 1, 2010 (Intent to form partnership and participation in profits and losses)',
    ]),
    conceptVariations: JSON.stringify([
      'sharing of losses consistent with partnership',
      'contribution of capital to common fund',
      'intent to form partnership',
      'Jarantilla doctrine',
    ]),
    orderIndex: 4,
    isActive: true,
    isDemo: false,
  },
  {
    code: 'PHASE1-SET1-Q05',
    title: 'Delectus Personae: Transfer of Partnership Interest',
    scenario:
      'A restaurant partnership formed by Mikee Quintos, Gretchen Ho, and Erwan Heussaff required the unanimous consent of the partners before admitting anyone new. Erwan later transferred his entire partnership interest to Kiefer Ravena without obtaining the consent of the other two. Kiefer then demanded access to the partnership records and insisted on participating in the restaurant\'s management as a partner. Did Kiefer become a partner by virtue of the transfer?',
    modelAnswer: `Answer:
No. Kiefer did not become a partner by virtue of the transfer.

Rule:
Under the principle of delectus personae, partnership is founded on the partners' mutual choice of the persons with whom they associate. Consistent with this principle, Article 1804 of the Civil Code provides that a partner may associate another person with him in his share, but that person cannot be admitted into the partnership without the consent of all the other partners. Article 1813 further provides that the transfer of a partner's entire interest does not, by itself, entitle the transferee to participate in the management or administration of the partnership.

Application:
Here, Erwan transferred his partnership interest to Kiefer without the consent of Mikee and Gretchen. Under delectus personae, Kiefer cannot compel them to accept him as a partner merely because he acquired Erwan's partnership interest. The transfer may give Kiefer the economic benefits attached to the assigned interest, but it does not confer partnership status or management rights.

Conclusion:
Thus, Kiefer did not become a partner because delectus personae requires the consent of the existing partners to the admission of a new partner.`,
    statutoryElements: JSON.stringify([
      'Principle of delectus personae requiring consent of all partners for admission (Art. 1804)',
      'Transfer of entire interest under Art. 1813 does not entitle transferee to management or administration rights',
      'Transferee receives only economic rights to profits and surplus upon dissolution',
    ]),
    relevantProvisions: JSON.stringify([
      'Article 1804 of the Civil Code (Sub-partner and Admission of Associate)',
      'Article 1813 of the Civil Code (Rights of Assignee/Transferee of Partner\'s Interest)',
      'Principle of Delectus Personae',
    ]),
    conceptVariations: JSON.stringify([
      'delectus personae',
      'transfer of partnership interest',
      'assignee rights vs partner rights',
      'management participation denial',
    ]),
    orderIndex: 5,
    isActive: true,
    isDemo: false,
  },
  {
    code: 'PHASE1-SET1-Q06',
    title: 'Mutual Agency: Authority of Partner in Ordinary Course of Business',
    scenario:
      'During the construction of a commercial building in Makati, Atom Araullo, Gretchen Fullido, and EJObiena operated the project through a partnership. Their partnership agreement neither assigned particular management duties to any partner nor required unanimous approval for ordinary business transactions. When the project needed additional construction machinery, Atom leased the necessary equipment from a local supplier in the partnership’s name. Gretchen later refused to honor the lease, arguing that Atom could not bind the partnership without first securing the approval of the other partners. Did Atom have authority to bind the partnership to the equipment lease?',
    modelAnswer: `Answer:
Yes. Atom had authority to bind the partnership to the equipment lease.

Rule:
Under Article 1818 of the Civil Code, every partner is an agent of the partnership for the purpose of its business. In Mendoza v. Paule, G.R. No. 175885, February 13, 2009, the Supreme Court stated that every partner is an agent of the partnership for its business and that each partner may separately execute acts of administration unless their respective duties have been specified or the partners have stipulated that one may not act without the consent of all the others.

Application:
Here, the partnership agreement did not assign specific management duties or require the consent of all partners before entering into ordinary business transactions. Atom leased construction machinery needed for the partnership’s ongoing construction project. Since the lease was an act of administration connected with the partnership business, Atom could undertake it as an agent of the partnership without first obtaining Gretchen’s and EJ’s approval.

Conclusion:
Thus, Atom had authority to bind the partnership to the equipment lease under the mutual agency rule.`,
    statutoryElements: JSON.stringify([
      'Every partner is an agent of the partnership for the purpose of its business (Art. 1818)',
      'Authority to execute acts of administration in the ordinary course of business',
      'Absence of management stipulation requiring unanimous consent (Mendoza v. Paule)',
    ]),
    relevantProvisions: JSON.stringify([
      'Article 1818 of the Civil Code (Mutual Agency and Binding Power of Partner)',
      'Mendoza v. Paule, G.R. No. 175885, February 13, 2009 (Acts of administration and mutual agency)',
    ]),
    conceptVariations: JSON.stringify([
      'mutual agency',
      'act of administration',
      'ordinary course of partnership business',
      'binding effect of partner acts',
    ]),
    orderIndex: 6,
    isActive: true,
    isDemo: false,
  },
  {
    code: 'PHASE1-SET1-Q07',
    title: 'Contribution of Immovable Property: Public Instrument and Inventory Requirement',
    scenario:
      'Pia Gutierrez and Scottie Thompson agreed to develop and sell residential lots, with Pia contributing a titled parcel of land and Scottie contributing money and services. They signed a private agreement, agreed to share profits, and began operating the venture, but they never executed a public instrument and never prepared or attached a signed inventory of the land. When a creditor later sought payment, Scottie argued that although no de jure partnership existed because the statutory formalities were not followed, their actual operation of the business nevertheless created a de facto partnership. Is Scottie correct?',
    modelAnswer: `Answer:
No. Scottie is not correct. Neither a de jure nor a valid de facto partnership was created.

Rule:
Under Articles 1771 and 1773 of the Civil Code, when immovable property is contributed to a partnership, the agreement must appear in a public instrument, and an inventory of the property must be made, signed by the parties, and attached to that instrument. Failure to comply with the inventory requirement renders the partnership contract void.

Application:
Here, the parties actually operated the venture and shared profits, circumstances that might ordinarily suggest a de facto partnership. However, Pia contributed immovable property, and the parties failed to comply with the mandatory public-instrument and inventory requirements. Since Article 1773 expressly renders the partnership contract void, their actual operation cannot cure the defect or create a valid de facto partnership.

Conclusion:
Thus, no valid de facto partnership arose despite the parties' actual operation of the business.`,
    statutoryElements: JSON.stringify([
      'Contribution of immovable property requires public instrument and signed inventory (Arts. 1771, 1773)',
      'Failure to attach signed inventory renders partnership contract void ab initio',
      'Actual operation cannot cure void status or create valid de facto partnership',
    ]),
    relevantProvisions: JSON.stringify([
      'Article 1771 of the Civil Code (Form of Partnership Contract)',
      'Article 1773 of the Civil Code (Void Status of Partnership with Immovable Property without Inventory)',
    ]),
    conceptVariations: JSON.stringify([
      'immovable property contribution',
      'signed inventory requirement',
      'void contract under Art. 1773',
      'de facto partnership negated',
    ]),
    orderIndex: 7,
    isActive: true,
    isDemo: false,
  },
  {
    code: 'PHASE1-SET1-Q08',
    title: 'Universal Partnership of All Present Property: Requisites and Effects',
    scenario:
      'Before starting their joint real estate venture in Cebu City, Hidilyn Diaz and Vico Sotto agreed to place in a common fund all the properties they already owned. Hidilyn contributed her residential house and lot, while Vico contributed his commercial building and lot. Their agreement provided that the existing properties would become common property and that they would divide both the properties and the profits generated from them. Did Hidilyn and Vico create a universal partnership of all present property?',
    modelAnswer: `Answer:
Yes. Hidilyn and Vico created a universal partnership of all present property.

Rule:
Under Article 1778 of the Civil Code, a universal partnership of all present property exists when the partners contribute all the property that actually belongs to them to a common fund, with the intention of dividing the same among themselves, as well as all the profits they may acquire therewith. Article 1779 further provides that the property belonging to each partner at the time the partnership is constituted becomes common property of all the partners, together with the profits they may acquire therewith.

Application:
Here, Hidilyn and Vico agreed to place in a common fund all the properties they already owned when the partnership was constituted. They further agreed that these properties would become common property and that they would divide both the properties and the profits generated from them. Their agreement therefore contains the characteristics of a universal partnership of all present property under Articles 1778 and 1779.

Conclusion:
Thus, Hidilyn and Vico created a universal partnership of all present property.`,
    statutoryElements: JSON.stringify([
      'Contribution of all property actually belonging to partners to a common fund (Art. 1778)',
      'Intention of dividing property and profits acquired therewith',
      'Existing property becoming common property of all partners under Art. 1779',
    ]),
    relevantProvisions: JSON.stringify([
      'Article 1778 of the Civil Code (Universal Partnership of All Present Property Definition)',
      'Article 1779 of the Civil Code (Effects of Universal Partnership of All Present Property)',
    ]),
    conceptVariations: JSON.stringify([
      'universal partnership of all present property',
      'common fund of existing properties',
      'division of properties and profits',
      'Article 1778 and Article 1779',
    ]),
    orderIndex: 8,
    isActive: true,
    isDemo: false,
  },
  {
    code: 'PHASE1-SET1-Q09',
    title: 'Universal Partnership Between Spouses: Statutory Prohibition',
    scenario:
      'During their marriage, Kathryn Bernardo and Alden Richards agreed to establish a universal partnership of all present property, under which all property presently owned by either spouse would become common partnership property and all profits acquired from those properties would be divided between them. Kathryn maintains that their agreement is valid because they both voluntarily consented to the arrangement, while Alden later questions its validity solely because they are legally married to each other. Is their universal partnership of all present property valid?',
    modelAnswer: `Answer:
No. Their universal partnership of all present property is not valid.

Rule:
Under Article 1782 of the Civil Code, persons who are prohibited from giving each other any donation or advantage cannot enter into a universal partnership. Article 87 of the Family Code prohibits every donation or grant of gratuitous advantage, direct or indirect, between spouses during the marriage, except moderate gifts which the spouses may give each other on the occasion of any family rejoicing.

Application:
Here, Kathryn and Alden are legally married to each other and agreed to establish a universal partnership of all present property. Since spouses are prohibited from giving each other donations or gratuitous advantages during the marriage, they fall within the prohibition under Article 1782 against persons who cannot enter into a universal partnership. Their mutual consent to the arrangement does not remove that statutory prohibition.

Conclusion:
Thus, Kathryn and Alden cannot validly establish a universal partnership of all present property because they are spouses prohibited by law from entering into a universal partnership.`,
    statutoryElements: JSON.stringify([
      'Prohibition against entering universal partnership for persons prohibited from giving donations (Art. 1782)',
      'Prohibition of donations between spouses during marriage (Art. 87 Family Code)',
      'Inability of mutual consent to override statutory prohibition',
    ]),
    relevantProvisions: JSON.stringify([
      'Article 1782 of the Civil Code (Prohibition against entering universal partnership)',
      'Article 87 of the Family Code (Prohibition of donations between spouses)',
    ]),
    conceptVariations: JSON.stringify([
      'universal partnership between spouses',
      'prohibition against donations',
      'Article 1782 Civil Code',
      'Article 87 Family Code',
    ]),
    orderIndex: 9,
    isActive: true,
    isDemo: false,
  },
  {
    code: 'PHASE1-SET1-Q10',
    title: 'Universal Partnership: Profits vs. All Present Property Presumption',
    scenario:
      'While operating separate businesses, Brent Manalo and Mika Salamanca agreed to combine and divide equally all profits they would earn from their businesses and personal industry during the existence of their partnership. At the time of the agreement, Brent already owned a commercial warehouse, while Mika already owned several delivery vans used in her business. Their agreement did not provide that ownership of these existing properties would pass to the partnership, and each continued to own and possess the respective property while allowing its use in the business. After the partnership ended, Mika claimed that the warehouse and delivery vans had become common partnership property because their agreement created a universal partnership. Was their agreement a universal partnership of all present property rather than a universal partnership of profits?',
    modelAnswer: `Answer:
No. Their agreement created a universal partnership of profits, not a universal partnership of all present property.

Rule:
Under Article 1780 of the Civil Code, a universal partnership of profits comprises all that the partners may acquire by their industry or work during the existence of the partnership. Movable or immovable property that each partner possessed when the contract was celebrated continues to belong exclusively to each partner, although its usufruct passes to the partnership. Under Article 1781, if the articles of universal partnership do not specify its nature, the partnership constitutes only a universal partnership of profits.

Application:
Here, Brent and Mika agreed to combine and divide the profits they would earn from their respective businesses and personal industry. Brent already owned the warehouse and Mika already owned the delivery vans when they entered into the partnership, and they did not agree to transfer ownership of those properties to the partnership. Under Article 1780, the existing properties therefore remained exclusively theirs, respectively, even though their use could benefit the partnership.

Conclusion:
Thus, Brent and Mika created a universal partnership of profits, not a universal partnership of all present property, and ownership of the warehouse and delivery vans remained with their respective owners.`,
    statutoryElements: JSON.stringify([
      'Universal partnership of profits comprises industry/work profits (Art. 1780)',
      'Ownership of existing properties remains exclusively with each partner, usufruct passes to partnership',
      'Presumption in favor of universal partnership of profits when nature is unspecified (Art. 1781)',
    ]),
    relevantProvisions: JSON.stringify([
      'Article 1780 of the Civil Code (Universal Partnership of Profits Definition and Scope)',
      'Article 1781 of the Civil Code (Presumption in favor of Universal Partnership of Profits)',
    ]),
    conceptVariations: JSON.stringify([
      'universal partnership of profits',
      'usufruct vs ownership',
      'Article 1780 and Article 1781',
      'presumption of partnership of profits',
    ]),
    orderIndex: 10,
    isActive: true,
    isDemo: false,
  },
];

export async function importPhase1Set1Questions() {
  console.log('📦 Starting Phase 1 Set 1 (Civil Law - Partnership) Question Bank Import...');

  // Set existing demo questions to isActive: false so only Phase 1 Set 1 is active for new assessments
  await prisma.question.updateMany({
    where: {
      code: {
        in: ['CRIM1-Q01', 'CRIM1-Q02'],
      },
    },
    data: {
      isActive: false,
    },
  });

  // Idempotent upsert of the 10 Phase 1 Set 1 questions
  const results = [];
  for (const q of PHASE1_SET1_QUESTIONS) {
    const record = await prisma.question.upsert({
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
      create: {
        code: q.code,
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
    });
    results.push(record);
    console.log(`   ✓ [${record.code}] (Order: ${record.orderIndex}) ${record.title}`);
  }

  console.log(`\n✅ Successfully imported/updated ${results.length} Phase 1 Set 1 questions.`);
  return results;
}

if (require.main === module) {
  importPhase1Set1Questions()
    .catch((err) => {
      console.error('❌ Import failed:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
