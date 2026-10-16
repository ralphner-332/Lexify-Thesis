import { prisma } from '../lib/prisma';

export interface OfficialQuestionData {
  orderIndex: number;
  testSet: 'TEST_1' | 'TEST_2' | 'TEST_3' | 'TEST_4';
  code: string;
  legacyCode?: string;
  title: string;
  scenario: string;
  answerText: string;
  ruleText: string;
  applicationText: string;
  conclusionText: string;
  relevantProvisions: string[];
  statutoryElements: string[];
  conceptVariations: string[];
}

export const OFFICIAL_40_QUESTIONS: OfficialQuestionData[] = [
  // =========================================================================
  // TEST 1 (Questions 1–10)
  // =========================================================================
  {
    orderIndex: 1,
    testSet: 'TEST_1',
    code: 'TEST1-Q01',
    legacyCode: 'PHASE1-SET1-Q01',
    title: 'Partnership Formation: Lending Agreement vs. Capital Contribution',
    scenario:
      'Alyssa Valdez gave Bam Aquino ₱1,000,000 to finance his lending business under a written agreement requiring him to pay her a fixed monthly amount as interest and return the principal upon demand. Alyssa did not participate in managing the business, bind Bam in transactions, or agree to share in its losses. When Bam later failed to return the ₱1,000,000, he claimed that the amount was a capital contribution and that Alyssa was his partner. Was a partnership created between Alyssa and Bam?',
    answerText: 'No. A partnership was not created between Alyssa and Bam.',
    ruleText:
      'Under Article 1767 of the Civil Code, a partnership requires an agreement to contribute money, property, or industry to a common fund with the intention of dividing profits. In Santiago v. Garcia, G.R. No. 228356, March 9, 2020, the Supreme Court held that there must be an unmistakable intention to form a partnership and that the absence of profit sharing and mutual agency militates against its existence.',
    applicationText:
      'Here, Alyssa was entitled only to fixed monthly interest and the return of her principal. She did not agree to share profits or losses and had no authority to bind Bam in the ordinary course of the lending business. These circumstances do not show an intention to form a partnership.',
    conclusionText: 'Thus, Alyssa and Bam did not form a partnership.',
    relevantProvisions: ['Article 1767', 'Santiago v. Garcia, G.R. No. 228356 (2020)'],
    statutoryElements: [
      'Agreement to contribute money, property, or industry to a common fund (Article 1767)',
      'Intention of dividing profits among partners',
      'Unmistakable intention to form partnership',
      'Absence of profit sharing and mutual agency militates against partnership (Santiago v. Garcia)',
    ],
    conceptVariations: ['Creditor-debtor loan agreement vs partnership', 'Fixed interest return not profit sharing'],
  },
  {
    orderIndex: 2,
    testSet: 'TEST_1',
    code: 'TEST1-Q02',
    legacyCode: 'PHASE1-SET1-Q02',
    title: 'Co-Ownership vs. Partnership: Sharing Payments from Inherited Land',
    scenario:
      'A, B, and C inherited an undivided parcel of land in the Philippines. Without agreeing to contribute the land to a common fund or to operate a business together, they allowed D to use the property as a parking area in exchange for monthly payments. A, B, and C divided the payments according to their respective ownership shares. A later claimed that their receipt and division of the payments established a partnership, while B and C maintained that they remained co-owners of the land. Was a partnership formed among A, B, and C by reason of their co-ownership and division of the payments derived from the property?',
    answerText:
      'No, a partnership was not formed among A, B, and C by reason of their co-ownership and division of the payments derived from the property.',
    ruleText:
      'Under Article 1769(2) of the Civil Code, co-ownership or co-possession does not by itself establish a partnership, regardless of whether the co-owners or co-possessors share any profits made from the use of the property.',
    applicationText:
      'Here, A, B, and C inherited the land as co-owners and allowed D to use it as a parking area. They divided the resulting payments according to their respective ownership shares. They did not agree to contribute the land to a common fund or to operate a business as partners. Therefore, their co-ownership and division of the payments did not by themselves establish a partnership.',
    conclusionText:
      'Thus, A, B, and C remained co-owners of the land, and no partnership arose from their sharing of the payments derived from its use.',
    relevantProvisions: ['Article 1769(2)'],
    statutoryElements: [
      'Co-ownership or co-possession does not by itself establish a partnership (Article 1769(2))',
      'Sharing profits or returns from property does not create partnership',
      'Absence of agreement to contribute to common fund or operate business as partners',
    ],
    conceptVariations: ['Inherited land co-ownership', 'Sharing lease proceeds as co-owners'],
  },
  {
    orderIndex: 3,
    testSet: 'TEST_1',
    code: 'TEST1-Q03',
    legacyCode: 'PHASE1-SET1-Q03',
    title: 'Secret Articles of Partnership: Lack of Juridical Personality',
    scenario:
      'A, B, and C agreed to conduct a trading activity in the Philippines under articles that they kept secret among themselves. Their agreement authorized any member to enter into contracts with third persons in that member’s own name. Acting under the agreement, A entered into a supply contract with D in A’s own name. B and C later claimed that their association possessed a juridical personality separate from its members. Is the association a juridical person separate and distinct from A, B, and C?',
    answerText: 'No, the association has no juridical personality separate and distinct from A, B, and C.',
    ruleText:
      'Under Article 1775 of the Civil Code, associations and societies whose articles are kept secret among the members, and wherein any member may contract in his or her own name with third persons, have no juridical personality and are governed by the provisions relating to co-ownership.',
    applicationText:
      'Here, A, B, and C kept the articles governing their association secret among themselves. Their agreement also authorized any member to contract with third persons in that member’s own name, as A did when contracting with D. These circumstances bring the association within Article 1775.',
    conclusionText:
      'Thus, the association has no juridical personality separate and distinct from A, B, and C and is governed by the provisions relating to co-ownership.',
    relevantProvisions: ['Article 1775'],
    statutoryElements: [
      'Articles kept secret among members (Article 1775)',
      'Members authorized to contract in own name with third persons',
      'No separate and distinct juridical personality',
      'Governed by provisions relating to co-ownership',
    ],
    conceptVariations: ['Secret articles of association', 'Lack of juridical entity under Article 1775'],
  },
  {
    orderIndex: 4,
    testSet: 'TEST_1',
    code: 'TEST1-Q04',
    legacyCode: 'PHASE1-SET1-Q04',
    title: 'Partnership Formation: Agreement to Share Losses',
    scenario:
      'Aira Villegas and Camille Villar each contributed ₱600,000 to open a specialty food business in Quezon City. Their agreement provided that they would divide net profits equally and shoulder business losses in the same proportion. When the venture later suffered substantial losses, Camille claimed that their arrangement was not a partnership because the agreement expressly required them to share losses. Was a partnership formed between Aira and Camille?',
    answerText: 'Yes. A partnership was formed between Aira and Camille.',
    ruleText:
      'Under Article 1767 of the Civil Code, a partnership exists when two or more persons contribute money, property, or industry to a common fund with the intention of dividing profits among themselves. In Jarantilla, Jr. v. Jarantilla, G.R. No. 154486, December 1, 2010, the Supreme Court stated that a partnership inter se generally involves an intent to form a partnership and participation in both profits and losses.',
    applicationText:
      'Here, both parties contributed money to a common business, agreed to divide profits equally, and likewise agreed to share losses. Far from negating the partnership, the provision on losses is consistent with their intention to operate the venture as partners.',
    conclusionText: 'Thus, a partnership was formed between Aira and Camille.',
    relevantProvisions: ['Article 1767', 'Jarantilla, Jr. v. Jarantilla, G.R. No. 154486 (2010)'],
    statutoryElements: [
      'Contribution of money to common fund (Article 1767)',
      'Agreement to divide net profits equally',
      'Agreement to participate in both profits and losses (Jarantilla v. Jarantilla)',
    ],
    conceptVariations: ['Loss-sharing clause validates partnership', 'Partnership inter se intent'],
  },
  {
    orderIndex: 5,
    testSet: 'TEST_1',
    code: 'TEST1-Q05',
    legacyCode: 'PHASE1-SET1-Q05',
    title: 'Delectus Personae: Transfer of Partnership Interest',
    scenario:
      'A restaurant partnership formed by Mikee Quintos, Gretchen Ho, and Erwan Heussaff required the unanimous consent of the partners before admitting anyone new. Erwan later transferred his entire partnership interest to Kiefer Ravena without obtaining the consent of the other two. Kiefer then demanded access to the partnership records and insisted on participating in the restaurant\'s management as a partner. Did Kiefer become a partner by virtue of the transfer?',
    answerText: 'No. Kiefer did not become a partner by virtue of the transfer.',
    ruleText:
      'Under the principle of delectus personae, partnership is founded on the partners\' mutual choice of the persons with whom they associate. Consistent with this principle, Article 1804 of the Civil Code provides that a partner may associate another person with him in his share, but that person cannot be admitted into the partnership without the consent of all the other partners. Article 1813 further provides that the transfer of a partner\'s entire interest does not, by itself, entitle the transferee to participate in the management or administration of the partnership.',
    applicationText:
      'Here, Erwan transferred his partnership interest to Kiefer without the consent of Mikee and Gretchen. Under delectus personae, Kiefer cannot compel them to accept him as a partner merely because he acquired Erwan\'s partnership interest. The transfer may give Kiefer the economic benefits attached to the assigned interest, but it does not confer partnership status or management rights.',
    conclusionText:
      'Thus, Kiefer did not become a partner because delectus personae requires the consent of the existing partners to the admission of a new partner.',
    relevantProvisions: ['Article 1804', 'Article 1813', 'Principle of Delectus Personae'],
    statutoryElements: [
      'Principle of delectus personae: mutual choice of associates',
      'Article 1804 Consent of all partners required for admission of new partner',
      'Article 1813 Transfer of interest does not confer management or inspection rights',
    ],
    conceptVariations: ['Assignment of partnership interest', 'Transferee rights limited to profits'],
  },
  {
    orderIndex: 6,
    testSet: 'TEST_1',
    code: 'TEST1-Q06',
    legacyCode: 'PHASE1-SET1-Q06',
    title: 'Mutual Agency: Authority of Partner in Ordinary Course of Business',
    scenario:
      'During the construction of a commercial building in Makati, Atom Araullo, Gretchen Fullido, and EJ Obiena operated the project through a partnership. Their partnership agreement neither assigned particular management duties to any partner nor required unanimous approval for ordinary business transactions. When the project needed additional construction machinery, Atom leased the necessary equipment from a local supplier in the partnership’s name. Gretchen later refused to honor the lease, arguing that Atom could not bind the partnership without first securing the approval of the other partners. Did Atom have authority to bind the partnership to the equipment lease?',
    answerText: 'Yes. Atom had authority to bind the partnership to the equipment lease.',
    ruleText:
      'Under Article 1818 of the Civil Code, every partner is an agent of the partnership for the purpose of its business. In Mendoza v. Paule, G.R. No. 175885, February 13, 2009, the Supreme Court stated that every partner is an agent of the partnership for its business and that each partner may separately execute acts of administration unless their respective duties have been specified or the partners have stipulated that one may not act without the consent of all the others.',
    applicationText:
      'Here, the partnership agreement did not assign specific management duties or require the consent of all partners before entering into ordinary business transactions. Atom leased construction machinery needed for the partnership’s ongoing construction project. Since the lease was an act of administration connected with the partnership business, Atom could undertake it as an agent of the partnership without first obtaining Gretchen’s and EJ’s approval.',
    conclusionText:
      'Thus, Atom had authority to bind the partnership to the equipment lease under the mutual agency rule.',
    relevantProvisions: ['Article 1818', 'Mendoza v. Paule, G.R. No. 175885 (2009)'],
    statutoryElements: [
      'Article 1818 Every partner is an agent of the partnership',
      'Acts of administration in ordinary course of business bind the partnership',
      'Separate execution of management acts absent contrary stipulation (Mendoza v. Paule)',
    ],
    conceptVariations: ['Mutual agency in ordinary business', 'Acts of administration by any partner'],
  },
  {
    orderIndex: 7,
    testSet: 'TEST_1',
    code: 'TEST1-Q07',
    legacyCode: 'PHASE1-SET1-Q07',
    title: 'Contribution of Immovable Property: Public Instrument and Inventory Requirement',
    scenario:
      'Pia Gutierrez and Scottie Thompson agreed to develop and sell residential lots, with Pia contributing a titled parcel of land and Scottie contributing money and services. They signed a private agreement, agreed to share profits, and began operating the venture, but they never executed a public instrument and never prepared or attached a signed inventory of the land. When a creditor later sought payment, Scottie argued that although no de jure partnership existed because the statutory formalities were not followed, their actual operation of the business nevertheless created a de facto partnership. Is Scottie correct?',
    answerText:
      'No. Scottie is not correct. Neither a de jure nor a valid de facto partnership was created.',
    ruleText:
      'Under Articles 1771 and 1773 of the Civil Code, when immovable property is contributed to a partnership, the agreement must appear in a public instrument, and an inventory of the property must be made, signed by the parties, and attached to that instrument. Failure to comply with the inventory requirement renders the partnership contract void.',
    applicationText:
      'Here, the parties actually operated the venture and shared profits, circumstances that might ordinarily suggest a de facto partnership. However, Pia contributed immovable property, and the parties failed to comply with the mandatory public-instrument and inventory requirements. Since Article 1773 expressly renders the partnership contract void, their actual operation cannot cure the defect or create a valid de facto partnership.',
    conclusionText:
      'Thus, no valid de facto partnership arose despite the parties\' actual operation of the business.',
    relevantProvisions: ['Article 1771', 'Article 1773'],
    statutoryElements: [
      'Article 1771 Public instrument requirement for contribution of immovable property',
      'Article 1773 Signed inventory of immovable property attached to public instrument',
      'Failure to comply with inventory requirement renders partnership contract void ab initio',
      'Cannot create de facto partnership from a void contract',
    ],
    conceptVariations: ['Mandatory inventory under Article 1773', 'Void contract cannot create de facto entity'],
  },
  {
    orderIndex: 8,
    testSet: 'TEST_1',
    code: 'TEST1-Q08',
    legacyCode: 'PHASE1-SET1-Q08',
    title: 'Universal Partnership of All Present Property: Requisites and Effects',
    scenario:
      'Before starting their joint real estate venture in Cebu City, Hidilyn Diaz and Vico Sotto agreed to place in a common fund all the properties they already owned. Hidilyn contributed her residential house and lot, while Vico contributed his commercial building and lot. Their agreement provided that the existing properties would become common property and that they would divide both the properties and the profits generated from them. Did Hidilyn and Vico create a universal partnership of all present property?',
    answerText: 'Yes. Hidilyn and Vico created a universal partnership of all present property.',
    ruleText:
      'Under Article 1778 of the Civil Code, a universal partnership of all present property exists when the partners contribute all the property that actually belongs to them to a common fund, with the intention of dividing the same among themselves, as well as all the profits they may acquire therewith. Article 1779 further provides that the property belonging to each partner at the time the partnership is constituted becomes common property of all the partners, together with the profits they may acquire therewith.',
    applicationText:
      'Here, Hidilyn and Vico agreed to place in a common fund all the properties they already owned when the partnership was constituted. They further agreed that these properties would become common property and that they would divide both the properties and the profits generated from them. Their agreement therefore contains the characteristics of a universal partnership of all present property under Articles 1778 and 1779.',
    conclusionText: 'Thus, Hidilyn and Vico created a universal partnership of all present property.',
    relevantProvisions: ['Article 1778', 'Article 1779'],
    statutoryElements: [
      'Article 1778 Universal partnership of all present property definition',
      'Contribution of all property actually belonging to partners to common fund',
      'Article 1779 Existing properties become common property of all partners',
      'Division of existing properties and profits acquired therewith',
    ],
    conceptVariations: ['Universal partnership of all present property', 'Common ownership of present property'],
  },
  {
    orderIndex: 9,
    testSet: 'TEST_1',
    code: 'TEST1-Q09',
    legacyCode: 'PHASE1-SET1-Q09',
    title: 'Universal Partnership Between Spouses: Statutory Prohibition',
    scenario:
      'During their marriage, Kathryn Bernardo and Alden Richards agreed to establish a universal partnership of all present property, under which all property presently owned by either spouse would become common partnership property and all profits acquired from those properties would be divided between them. Kathryn maintains that their agreement is valid because they both voluntarily consented to the arrangement, while Alden later questions its validity solely because they are legally married to each other. Is their universal partnership of all present property valid?',
    answerText: 'No. Their universal partnership of all present property is not valid.',
    ruleText:
      'Under Article 1782 of the Civil Code, persons who are prohibited from giving each other any donation or advantage cannot enter into a universal partnership. Article 87 of the Family Code prohibits every donation or grant of gratuitous advantage, direct or indirect, between spouses during the marriage, except moderate gifts which the spouses may give each other on the occasion of any family rejoicing.',
    applicationText:
      'Here, Kathryn and Alden are legally married to each other and agreed to establish a universal partnership of all present property. Since spouses are prohibited from giving each other donations or gratuitous advantages during the marriage, they fall within the prohibition under Article 1782 against persons who cannot enter into a universal partnership. Their mutual consent to the arrangement does not remove that statutory prohibition.',
    conclusionText:
      'Thus, Kathryn and Alden cannot validly establish a universal partnership of all present property because they are spouses prohibited by law from entering into a universal partnership.',
    relevantProvisions: ['Article 1782', 'Article 87 Family Code'],
    statutoryElements: [
      'Article 1782 Prohibition of universal partnership between persons prohibited from donating',
      'Article 87 Family Code prohibition of donations between spouses during marriage',
      'Nullity of universal partnership between legally married spouses',
    ],
    conceptVariations: ['Spousal prohibition against universal partnership', 'Incapacity under Article 1782'],
  },
  {
    orderIndex: 10,
    testSet: 'TEST_1',
    code: 'TEST1-Q10',
    legacyCode: 'PHASE1-SET1-Q10',
    title: 'Universal Partnership: Profits vs. All Present Property Presumption',
    scenario:
      'While operating separate businesses, Brent Manalo and Mika Salamanca agreed to combine and divide equally all profits they would earn from their businesses and personal industry during the existence of their partnership. At the time of the agreement, Brent already owned a commercial warehouse, while Mika already owned several delivery vans used in her business. Their agreement did not provide that ownership of these existing properties would pass to the partnership, and each continued to own and possess the respective property while allowing its use in the business. After the partnership ended, Mika claimed that the warehouse and delivery vans had become common partnership property because their agreement created a universal partnership. Was their agreement a universal partnership of all present property rather than a universal partnership of profits?',
    answerText:
      'No. Their agreement created a universal partnership of profits, not a universal partnership of all present property.',
    ruleText:
      'Under Article 1780 of the Civil Code, a universal partnership of profits comprises all that the partners may acquire by their industry or work during the existence of the partnership. Movable or immovable property that each partner possessed when the contract was celebrated continues to belong exclusively to each partner, although its usufruct passes to the partnership. Under Article 1781, if the articles of universal partnership do not specify its nature, the partnership constitutes only a universal partnership of profits.',
    applicationText:
      'Here, Brent and Mika agreed to combine and divide the profits they would earn from their respective businesses and personal industry. Brent already owned the warehouse and Mika already owned the delivery vans when they entered into the partnership, and they did not agree to transfer ownership of those properties to the partnership. Under Article 1780, the existing properties therefore remained exclusively theirs, respectively, even though their use could benefit the partnership.',
    conclusionText:
      'Thus, Brent and Mika created a universal partnership of profits, not a universal partnership of all present property, and ownership of the warehouse and delivery vans remained with their respective owners.',
    relevantProvisions: ['Article 1780', 'Article 1781'],
    statutoryElements: [
      'Article 1780 Universal partnership of profits definition',
      'Ownership of existing properties remains exclusively with each partner',
      'Usufruct of existing properties passes to partnership',
      'Article 1781 Presumption in favor of universal partnership of profits',
    ],
    conceptVariations: ['Universal partnership of profits presumption', 'Usufruct vs ownership of property'],
  },

  // =========================================================================
  // TEST 2 (Questions 11–20)
  // =========================================================================
  {
    orderIndex: 11,
    testSet: 'TEST_2',
    code: 'TEST2-Q01',
    legacyCode: 'TEST2-Q11',
    title: 'Particular Partnership: Development of a Single Parcel of Land',
    scenario:
      'A and B executed a public instrument establishing a partnership to develop and sell a single parcel of land in the Philippines, with a signed inventory of the contributed land attached to the instrument. A contributed the land, while B contributed the funds required for surveying, construction, and marketing. They agreed to divide the net proceeds from the sale of the completed units. After completing the project, A claimed that their agreement could not establish a particular partnership because it involved only one real-estate project. Is the development and sale of the parcel a specific undertaking that may constitute the object of a particular partnership?',
    answerText:
      'Yes, the development and sale of the parcel is a specific undertaking that may constitute the object of a particular partnership.',
    ruleText:
      'Under Article 1783 of the Civil Code, a particular partnership has for its object determinate things, their use or fruits, a specific undertaking, or the exercise of a profession or vocation.',
    applicationText:
      'Here, A and B agreed to undertake one defined project: the development and sale of a particular parcel of land. A contributed the land, while B contributed the funds necessary to complete and market the project. The limitation of their venture to a single real-estate project does not prevent the formation of a particular partnership because Article 1783 expressly recognizes a specific undertaking as its proper object.',
    conclusionText:
      'Thus, A and B may form a particular partnership for the specific undertaking of developing and selling the parcel of land.',
    relevantProvisions: ['Article 1783'],
    statutoryElements: [
      'Article 1783 Object of particular partnership',
      'Specific undertaking as valid partnership object',
      'Single real-estate project as determinate undertaking',
    ],
    conceptVariations: ['Particular partnership for specific project', 'Determinate undertaking under Article 1783'],
  },
  {
    orderIndex: 12,
    testSet: 'TEST_2',
    code: 'TEST2-Q02',
    legacyCode: 'TEST2-Q12',
    title: 'Separate Juridical Personality of Partnership',
    scenario:
      'While operating a construction venture in Quezon City, Belle Mariano and Donny Pangilinan formed a partnership that entered into a ₱4,000,000 supply contract in the partnership’s own name. Both partners personally negotiated with the supplier, signed several delivery receipts, and later used their individual bank accounts to advance partial payments when partnership funds were temporarily insufficient. After the partnership defaulted, the supplier sued Belle and Donny directly, arguing that their personal participation in the transaction showed that the partnership was merely their business arrangement and had no separate legal existence. Donny agreed and insisted that only the individual partners could be treated as parties to the contract. Is Donny correct?',
    answerText:
      'No. Donny is not correct because the partnership has a juridical personality separate and distinct from its partners.',
    ruleText:
      'Under Article 1768 of the Civil Code, the partnership has a juridical personality separate and distinct from that of each partner. In Saludo, Jr. v. Philippine National Bank, G.R. No. 193138, August 20, 2018, the Supreme Court held that “[t]he perfection and validity of a contract of partnership brings about the creation of a juridical person separate and distinct from the individuals comprising the partnership.”',
    applicationText:
      'Here, the supply contract was executed in the partnership’s own name. Although Belle and Donny personally negotiated with the supplier, signed delivery receipts, and advanced payments from their individual accounts, those circumstances do not erase the partnership’s separate juridical personality. The partnership remained a juridical person distinct from the individuals composing it.',
    conclusionText:
      'Thus, Donny is not correct. The partnership has a juridical personality separate and distinct from Belle and Donny.',
    relevantProvisions: ['Article 1768', 'Saludo, Jr. v. Philippine National Bank, G.R. No. 193138 (2018)'],
    statutoryElements: [
      'Article 1768 Separate juridical personality of partnership',
      'Creation of juridical person separate and distinct from partners (Saludo v. PNB)',
      'Personal acts and advances do not extinguish separate personality',
    ],
    conceptVariations: ['Separate juridical personality', 'Partnership as distinct legal person'],
  },
  {
    orderIndex: 13,
    testSet: 'TEST_2',
    code: 'TEST2-Q03',
    legacyCode: 'TEST2-Q13',
    title: 'Limited Partnership: Subsidiary Liability of General Partner',
    scenario:
      'Amid a financing arrangement for a limited partnership engaged in hardware distribution, Gretchen Barretto served as the general partner while Manny Pacquiao was the limited partner. The partnership borrowed ₱2,000,000 for its operations but later defaulted. The creditor obtained judgment and immediately sought to levy on Gretchen’s personally owned condominium even though the partnership still had equipment and receivables available to satisfy the debt. Gretchen objected, arguing that her personal property could not yet be reached while partnership assets remained unexhausted. Is Gretchen correct?',
    answerText: 'Yes. Gretchen is correct that her personal property cannot yet be reached.',
    ruleText:
      'Under Article 1850 of the Civil Code, a general partner in a limited partnership is subject to the liabilities of a partner in a partnership without limited partners. Under Article 1816, such liability is subsidiary and arises only after partnership assets have been exhausted. In Guy v. Gacott, G.R. No. 206147, January 13, 2016, the Supreme Court held that resort to a partner’s personal property may be made only after efforts to exhaust partnership assets have failed or when such assets are insufficient.',
    applicationText:
      'Here, Gretchen is the general partner and may ultimately answer with her personal property for the partnership debt. However, the partnership still has equipment and receivables available to satisfy the obligation. Her subsidiary liability therefore cannot yet be enforced against her separate property.',
    conclusionText:
      'Thus, Gretchen’s personal property cannot yet be levied upon because the partnership assets must first be exhausted or shown to be insufficient.',
    relevantProvisions: ['Article 1850', 'Article 1816', 'Guy v. Gacott, G.R. No. 206147 (2016)'],
    statutoryElements: [
      'Article 1850 General partner in limited partnership subject to general partner liabilities',
      'Article 1816 Subsidiary liability requiring prior exhaustion of partnership assets',
      'Exhaustion doctrine under Guy v. Gacott',
    ],
    conceptVariations: ['Subsidiary liability of partners', 'Exhaustion of partnership assets prerequisite'],
  },
  {
    orderIndex: 14,
    testSet: 'TEST_2',
    code: 'TEST2-Q04',
    legacyCode: 'TEST2-Q14',
    title: 'Liability of Silent Partner for Partnership Contracts',
    scenario:
      'Following the establishment of a restaurant partnership in Makati City, Sherlock Holmes, Jay Gatsby, and Atticus Finch agreed to contribute capital to the business. Sherlock and Gatsby actively managed the restaurant, while Atticus took no part in management, never negotiated with suppliers, and remained undisclosed in the partnership’s dealings with third persons. The partnership later incurred an unpaid obligation under a supply contract executed in the partnership’s name, and the supplier sought to hold Atticus liable as a partner. Atticus argued that he could not be liable because he was merely a silent partner who neither managed the business nor dealt with the supplier. Is Atticus correct?',
    answerText:
      'No. Atticus is not correct because his status as a silent partner does not, by itself, exempt him from liability for the partnership obligation.',
    ruleText:
      'Under Article 1816 of the Civil Code, “[a]ll partners, including industrial ones, shall be liable pro rata with all their property and after all the partnership assets have been exhausted, for the contracts which may be entered into in the name and for the account of the partnership, under its signature and by a person authorized to act for the partnership.”',
    applicationText:
      'Here, Atticus is a partner who contributed capital to the restaurant partnership. Although he did not participate in management, negotiate with the supplier, or appear in the partnership’s dealings with third persons, Article 1816 expressly applies to all partners. Accordingly, Atticus may be held liable pro rata with his property for the contractual obligation after the partnership assets have been exhausted.',
    conclusionText:
      'Thus, Atticus is not exempt from liability merely because he was a silent partner who did not participate in the management or dealings of the partnership.',
    relevantProvisions: ['Article 1816'],
    statutoryElements: [
      'Article 1816 All partners liable pro rata with personal property',
      'Application of contractual liability to silent/undisclosed general partners',
      'Liability for contracts entered in name and for account of partnership',
    ],
    conceptVariations: ['Silent partner pro rata liability', 'Undisclosed partner contractual liability'],
  },
  {
    orderIndex: 15,
    testSet: 'TEST_2',
    code: 'TEST2-Q05',
    legacyCode: 'TEST2-Q15',
    title: 'Limited Partnership: General Partner Contravening Certificate',
    scenario:
      'A and B formed a limited partnership in which A was the general partner and B was the sole limited partner. The partnership certificate stated that its business was limited to the sale of medical supplies and that it would not engage in real-estate development. Without B’s written consent or ratification, A used partnership funds to acquire land for a real-estate development project and signed documents in the partnership’s name for that purpose. Did A have authority to undertake the real-estate development project on behalf of the limited partnership without B’s written consent or ratification?',
    answerText:
      'No, A had no authority to undertake the real-estate development project on behalf of the limited partnership without B’s written consent or ratification.',
    ruleText:
      'Under Article 1850(1) of the Civil Code, a general partner has no authority, without the written consent or ratification of all the limited partners, to do any act in contravention of the certificate of limited partnership.',
    applicationText:
      'Here, the certificate expressly limited the partnership’s business to the sale of medical supplies and prohibited it from engaging in real-estate development. Nevertheless, A used partnership funds to acquire land and signed documents in the partnership’s name for a real-estate development project. Because these acts contravened the partnership certificate, A could not undertake them without the written consent or ratification of B, the sole limited partner.',
    conclusionText:
      'Thus, A had no authority to undertake the real-estate development project on behalf of the limited partnership without B’s written consent or ratification.',
    relevantProvisions: ['Article 1850(1)'],
    statutoryElements: [
      'Article 1850(1) General partner restriction in limited partnership',
      'Requirement of written consent or ratification of all limited partners',
      'Prohibition of acts in contravention of certificate of limited partnership',
    ],
    conceptVariations: ['Acts in contravention of limited partnership certificate', 'Ultra vires act of general partner'],
  },
  {
    orderIndex: 16,
    testSet: 'TEST_2',
    code: 'TEST2-Q06',
    legacyCode: 'TEST2-Q16',
    title: 'Prohibition Against Capitalist Partner Engaging in Competing Business',
    scenario:
      'A and B formed a limited partnership in the Philippines to operate a wholesale medical-supply business. A contributed money to the partnership and was designated as the general partner, while B was the limited partner. During the partnership’s existence, A independently established another wholesale medical-supply business in the same city and operated it for A’s own account. The partnership agreement did not permit A to engage in a competing business, although A did not use partnership property for the separate enterprise. Did A violate the statutory prohibition against engaging for one’s own account in the same kind of business as the partnership?',
    answerText:
      'Yes, A violated the statutory prohibition against engaging for A’s own account in the same kind of business as the partnership.',
    ruleText:
      'Under Article 1850 of the Civil Code, a general partner in a limited partnership is subject to the restrictions and liabilities of a partner in a partnership without limited partners. Under Article 1808, capitalist partners cannot engage for their own account in any operation of the kind of business in which the partnership is engaged, unless there is a stipulation to the contrary.',
    applicationText:
      'Here, A contributed money to the partnership and was therefore a capitalist partner. While the partnership was engaged in the wholesale medical-supply business, A operated another wholesale medical-supply business for A’s own account in the same city. The partnership agreement did not contain a stipulation permitting A to engage in the competing business. A’s failure to use partnership property does not remove the prohibition because Article 1808 applies to engaging for one’s own account in the same kind of business.',
    conclusionText:
      'Thus, A violated Article 1808 by operating a competing wholesale medical-supply business for A’s own account without a stipulation permitting it.',
    relevantProvisions: ['Article 1850', 'Article 1808'],
    statutoryElements: [
      'Article 1850 General partner subject to general partner restrictions',
      'Article 1808 Capitalist partner prohibition against competing business',
      'Engaging for own account in same kind of business absent stipulation permitting it',
    ],
    conceptVariations: ['Capitalist partner competing business prohibition', 'Article 1808 non-compete duty'],
  },
  {
    orderIndex: 17,
    testSet: 'TEST_2',
    code: 'TEST2-Q07',
    legacyCode: 'TEST2-Q17',
    title: 'Industrial Partner Engaging in Separate Business: Remedies of Capitalist Partners',
    scenario:
      'A and B contributed capital, while C contributed industry, to a partnership formed in the Philippines to operate a retail pharmacy. Without the partnership’s express permission, C opened and operated a separate retail pharmacy for C’s own account and earned profits from it. Upon discovering C’s separate business, A and B proposed either to exclude C from the partnership or to avail themselves of the profits C had earned, with damages in either case. Is their proposed election authorized under the Civil Code?',
    answerText:
      'Yes, A and B may either exclude C from the partnership or avail themselves of the profits C earned from the separate pharmacy, with a right to damages in either case.',
    ruleText:
      'Under Article 1789 of the Civil Code, an industrial partner cannot engage in business for himself or herself unless the partnership expressly permits it. If the industrial partner does so, the capitalist partners may either exclude the industrial partner from the partnership or avail themselves of the benefits obtained in violation of the prohibition, with a right to damages in either case.',
    applicationText:
      'Here, C was the industrial partner and operated a separate retail pharmacy for C’s own account without the partnership’s express permission. C therefore violated the prohibition under Article 1789. Consequently, A and B, as the capitalist partners, may either exclude C from the partnership or avail themselves of the profits C obtained from the separate pharmacy. They may also claim damages under either remedy.',
    conclusionText:
      'Thus, A and B may either exclude C from the partnership or avail themselves of the profits C earned from the separate pharmacy, with a right to damages in either case.',
    relevantProvisions: ['Article 1789'],
    statutoryElements: [
      'Article 1789 Industrial partner absolute prohibition against engaging in any business',
      'Express permission requirement',
      'Alternative remedies: exclusion or appropriation of benefits/profits',
      'Right to damages under either remedy',
    ],
    conceptVariations: ['Industrial partner business prohibition', 'Remedies of capitalist partners under Article 1789'],
  },
  {
    orderIndex: 18,
    testSet: 'TEST_2',
    code: 'TEST2-Q08',
    legacyCode: 'TEST2-Q18',
    title: 'Restriction on Managing Partner’s Authority: Third Party with Knowledge',
    scenario:
      'A, B, and C formed a partnership in the Philippines to distribute agricultural equipment. Their partnership agreement appointed A as manager but prohibited A from selling partnership equipment below a stated minimum price without the consent of B and C. Despite this restriction, A sold several units to D at a substantially lower price without obtaining the required consent. Before completing the transaction, D knew that A’s authority was subject to the minimum-price restriction. Was the partnership bound by A’s sale to D?',
    answerText: 'No, the partnership was not bound by A’s sale to D.',
    ruleText:
      'Under Article 1818 of the Civil Code, no act of a partner performed in contravention of a restriction on authority shall bind the partnership with respect to persons having knowledge of the restriction.',
    applicationText:
      'Here, A’s authority as manager was expressly restricted because A could not sell partnership equipment below the stated minimum price without the consent of B and C. A nevertheless sold several units to D below that price without obtaining the required consent. Because D knew of the restriction before completing the transaction, A’s unauthorized sale did not bind the partnership as against D.',
    conclusionText:
      'Thus, the partnership was not bound by A’s sale because A violated a restriction on authority of which D had knowledge.',
    relevantProvisions: ['Article 1818'],
    statutoryElements: [
      'Article 1818 Third-party knowledge of restriction on partner\'s authority',
      'Contravention of express limitation on management authority',
      'Partnership is not bound where third person acted with knowledge of restriction',
    ],
    conceptVariations: ['Third party with knowledge of restriction', 'Article 1818 limitation on authority'],
  },
  {
    orderIndex: 19,
    testSet: 'TEST_2',
    code: 'TEST2-Q09',
    legacyCode: 'TEST2-Q19',
    title: 'Partner’s Liability for Damages Caused by Fault / Negligence',
    scenario:
      'A, B, and C formed a partnership in the Philippines to operate a cold-storage facility. The partnership assigned A to supervise and maintain its refrigeration equipment. Despite repeated warnings that one refrigeration unit required immediate repair, A neither arranged the repair nor took measures to protect the goods stored in the facility. The unit subsequently malfunctioned, causing damage to the partnership’s goods and resulting in financial loss. A denied responsibility and argued that the malfunction was an unavoidable equipment failure. Is A liable to the partnership for the resulting loss?',
    answerText: 'Yes, A is liable to the partnership for the loss caused by A’s fault.',
    ruleText:
      'Under Article 1794 of the Civil Code, every partner is responsible to the partnership for damages suffered by it through the partner’s fault. The partner cannot compensate such damages with the profits and benefits earned for the partnership through the partner’s industry.',
    applicationText:
      'Here, A was responsible for supervising and maintaining the refrigeration equipment. Despite repeated warnings that the unit required immediate repair, A failed to arrange the repair or take measures to protect the stored goods. The unit then malfunctioned and damaged the partnership’s goods. A’s claim that the malfunction was unavoidable fails because A had received prior warnings and could have acted to repair the unit or protect the goods.',
    conclusionText:
      'Thus, A is liable to the partnership under Article 1794 for the financial loss caused by A’s failure to act despite the repeated warnings.',
    relevantProvisions: ['Article 1794'],
    statutoryElements: [
      'Article 1794 Responsibility of partner for damages caused by partner\'s fault',
      'Prohibition against compensating damages with profits/benefits of industry',
      'Liability for negligent supervision or failure to take preventative measures',
    ],
    conceptVariations: ['Partner liability for fault under Article 1794', 'No compensation of damages with industry profits'],
  },
  {
    orderIndex: 20,
    testSet: 'TEST_2',
    code: 'TEST2-Q10',
    legacyCode: 'TEST2-Q20',
    title: 'Partnership by Estoppel: Liability of Apparent Partner',
    scenario:
      'A and B operated a business in the Philippines under the name “A and B Trading,” although no actual partnership existed between them. They represented to C, a supplier, that they were partners in the business. Relying on that representation, C delivered merchandise on credit to the apparent partnership. After the obligation became due, A and B failed to pay, and A denied liability on the ground that no partnership had been formally organized. Is A liable to C as a partner by estoppel?',
    answerText: 'Yes, A is liable to C as a partner by estoppel.',
    ruleText:
      'Under Article 1825 of the Civil Code, a person who represents himself or herself, or consents to being represented, as a partner in an existing partnership or with persons who are not actual partners is liable to anyone to whom the representation is made and who, relying on it, gives credit to the actual or apparent partnership.',
    applicationText:
      'Here, A represented to C that A and B were partners in “A and B Trading.” C relied on that representation and delivered merchandise to the apparent partnership on credit. Because A’s representation induced C to extend credit, A cannot avoid liability by claiming that no actual partnership had been formally organized.',
    conclusionText:
      'Thus, A is liable to C as a partner by estoppel for the unpaid merchandise delivered on credit.',
    relevantProvisions: ['Article 1825'],
    statutoryElements: [
      'Article 1825 Partnership by estoppel',
      'Representation or consent to representation as partner',
      'Reliance by third party extending credit to apparent partnership',
      'Liability as partner notwithstanding absence of formal partnership agreement',
    ],
    conceptVariations: ['Partnership by estoppel', 'Apparent partner liability under Article 1825'],
  },

  // =========================================================================
  // TEST 3 (Questions 21–30)
  // =========================================================================
  {
    orderIndex: 21,
    testSet: 'TEST_3',
    code: 'TEST3-Q01',
    legacyCode: 'TEST3-Q21',
    title: 'Mutual Agency: Undisclosed Internal Credit Restriction',
    scenario:
      'A and B are partners in a Philippine business that regularly purchases office supplies for resale. Their partnership agreement placed an internal limit on the amount of credit purchases that either partner could make without the other partner’s consent, but this restriction was not disclosed to third persons. Acting in the partnership’s name, A entered into a credit agreement with C, a supplier, to purchase office supplies for resale in an amount exceeding the internal limit. C had no knowledge that A’s authority was restricted. After the partnership failed to pay, B argued that the agreement did not bind the partnership because A had exceeded the internal limitation. Was the partnership bound by A’s credit agreement with C?',
    answerText: 'Yes, the partnership was bound by A’s credit agreement with C.',
    ruleText:
      'Under Article 1818 of the Civil Code, every partner is an agent of the partnership for the purpose of its business. An act of a partner that apparently carries on the partnership business in the usual way binds the partnership unless the partner had no authority to act in the particular matter and the person dealing with the partner knew that the partner lacked authority.',
    applicationText:
      'Here, the partnership regularly purchased office supplies for resale, and A entered into the credit agreement in the partnership’s name for the same purpose. The transaction therefore apparently carried on the partnership’s business in the usual way. Although A exceeded the internal limitation on credit purchases, C had no knowledge of that restriction. Consequently, the undisclosed limitation did not prevent A’s act from binding the partnership as to C.',
    conclusionText:
      'Thus, the partnership was bound by A’s credit agreement with C because the transaction was within the usual course of its business and C had no knowledge of the restriction on A’s authority.',
    relevantProvisions: ['Article 1818'],
    statutoryElements: [
      'Article 1818 Partner as agent carrying on business in usual way',
      'Transaction apparently carrying on partnership business binds partnership',
      'Undisclosed internal restrictions do not affect third parties without knowledge',
    ],
    conceptVariations: ['Undisclosed restriction on authority', 'Apparent authority in usual course of business'],
  },
  {
    orderIndex: 22,
    testSet: 'TEST_3',
    code: 'TEST3-Q02',
    legacyCode: 'TEST3-Q22',
    title: 'Duty to Render Full and True Information',
    scenario:
      'A, B, and C formed a partnership in the Philippines to operate a wholesale agricultural-supply business. A managed the partnership’s finances and learned that the partnership had substantial unpaid debts, overdue taxes, and insufficient funds to meet its obligations. B demanded complete information concerning the partnership’s financial condition, but A disclosed only its sales figures and concealed its debts and tax liabilities. Relying on the incomplete disclosure, B approved an additional inventory purchase on credit. Whether A violated the duty to render true and full information concerning matters affecting the partnership?',
    answerText:
      'Yes, A violated the duty to render true and full information concerning matters affecting the partnership.',
    ruleText:
      'Under Article 1806 of the Civil Code, partners shall render, on demand, true and full information of all things affecting the partnership to any partner or the legal representative of a deceased partner or of a partner under legal disability.',
    applicationText:
      'Here, B demanded complete information concerning the partnership’s financial condition. Its substantial unpaid debts, overdue taxes, and insufficient funds directly affected the partnership. A disclosed only the partnership’s sales figures while concealing its debts and tax liabilities. Because the disclosure was incomplete, A failed to render the true and full information demanded by B.',
    conclusionText:
      'Thus, A violated Article 1806 by withholding material information concerning the partnership’s financial condition from B.',
    relevantProvisions: ['Article 1806'],
    statutoryElements: [
      'Article 1806 Duty of partners to render true and full information on demand',
      'Obligation applies to all things affecting the partnership',
      'Concealment of debts/liabilities violates disclosure duty',
    ],
    conceptVariations: ['Duty of full financial disclosure', 'Article 1806 information duty'],
  },
  {
    orderIndex: 23,
    testSet: 'TEST_3',
    code: 'TEST3-Q03',
    legacyCode: 'TEST3-Q23',
    title: 'Validity of Oral Partnership: Absence of SEC Registration',
    scenario:
      'A and B orally agreed in the Philippines to operate a food-delivery business. A contributed money, while B contributed delivery equipment and services. They agreed to combine their contributions for the business, divide the profits equally, and thereafter began operations. They did not execute a written partnership agreement or register the partnership with the Securities and Exchange Commission. After the business became profitable, A claimed that no partnership existed because their agreement was oral and unregistered. Was a valid partnership formed between A and B?',
    answerText:
      'Yes, a valid partnership was formed between A and B despite the absence of a written agreement and registration with the Securities and Exchange Commission.',
    ruleText:
      'Under Article 1767 of the Civil Code, a partnership exists when two or more persons bind themselves to contribute money, property, or industry to a common fund with the intention of dividing the profits among themselves. Under Article 1771, a partnership may be constituted in any form unless immovable property or real rights are contributed, in which case a public instrument is necessary. Under Article 1768, a partnership has a juridical personality separate and distinct from that of each partner even when the requirements of the first paragraph of Article 1772 concerning a public instrument and registration with the Securities and Exchange Commission are not complied with.',
    applicationText:
      'Here, A contributed money, while B contributed delivery equipment and services to their common food-delivery business. They also agreed to divide the profits equally and began operating the business. These facts satisfy the requirements of Article 1767. Because neither partner contributed immovable property or real rights, their oral agreement was sufficient under Article 1771. Their failure to register the partnership with the Securities and Exchange Commission did not prevent the partnership from acquiring a juridical personality under Article 1768.',
    conclusionText:
      'Thus, a valid partnership was formed between A and B despite their oral agreement and failure to register the partnership with the Securities and Exchange Commission.',
    relevantProvisions: ['Article 1767', 'Article 1771', 'Article 1768', 'Article 1772'],
    statutoryElements: [
      'Article 1767 Essential elements of partnership',
      'Article 1771 Partnership may be constituted in any form absent immovable property',
      'Article 1768 Juridical personality acquired despite failure to register with SEC under Article 1772',
    ],
    conceptVariations: ['Validity of oral partnership', 'Article 1768 personality despite non-registration'],
  },
  {
    orderIndex: 24,
    testSet: 'TEST_3',
    code: 'TEST3-Q04',
    legacyCode: 'TEST3-Q24',
    title: 'Continuation of Partnership Beyond Fixed Term: Partnership at Will',
    scenario:
      'A, B, and C formed a partnership in the Philippines to complete a construction project within a fixed term of two years. After the term expired and the project was completed, they continued using the partnership’s equipment, collecting receivables, and undertaking additional construction work without executing a new agreement or settling and liquidating the partnership’s affairs. A later claimed that the partnership and the partners’ existing rights and duties ended upon the expiration of the original term. Was the partnership continued as a partnership at will despite the absence of an express agreement?',
    answerText:
      'Yes, the partnership was continued as a partnership at will despite the absence of an express agreement.',
    ruleText:
      'Under Article 1785 of the Civil Code, when a partnership for a fixed term or particular undertaking is continued after the termination of the term or undertaking without an express agreement, the partners’ rights and duties remain the same as they were at the time of termination, insofar as they are consistent with a partnership at will. The partners’ continuation of the business without any settlement or liquidation of the partnership affairs is prima facie evidence that the partnership continued.',
    applicationText:
      'Here, A, B, and C continued using the partnership’s equipment, collecting receivables, and undertaking additional construction work after the two-year term expired and the original project was completed. They did so without executing a new agreement or settling and liquidating the partnership’s affairs. Their conduct constitutes prima facie evidence that they continued the partnership. Accordingly, their existing rights and duties remained the same insofar as they were consistent with a partnership at will.',
    conclusionText:
      'Thus, the partnership continued as a partnership at will, and the partners’ rights and duties remained the same insofar as consistent with that form of partnership.',
    relevantProvisions: ['Article 1785'],
    statutoryElements: [
      'Article 1785 Continuation of fixed term partnership without express agreement',
      'Continuation of business without settlement is prima facie evidence of continuation',
      'Partnership converted to partnership at will with rights and duties preserved',
    ],
    conceptVariations: ['Partnership at will conversion', 'Article 1785 continuation presumption'],
  },
  {
    orderIndex: 25,
    testSet: 'TEST_3',
    code: 'TEST3-Q05',
    legacyCode: 'TEST3-Q25',
    title: 'Partner as Debtor for Promised Specific Contribution',
    scenario:
      'A and B formed a partnership in the Philippines to operate a food-processing business. Under their written partnership agreement, A promised to contribute a specific delivery vehicle, while B promised to contribute money. A failed to deliver the vehicle and argued that the partnership could not require its delivery because it remained registered in A’s name. The partnership demanded that A comply with the promised contribution. Is A a debtor of the partnership for the delivery vehicle?',
    answerText:
      'Yes, A is a debtor of the partnership for the delivery vehicle that A promised to contribute.',
    ruleText:
      'Under Article 1786 of the Civil Code, every partner is a debtor of the partnership for whatever the partner has promised to contribute to it.',
    applicationText:
      'Here, A expressly promised in the written partnership agreement to contribute the specific delivery vehicle. That promise made A a debtor of the partnership for the vehicle. The fact that the vehicle remained registered in A’s name did not extinguish A’s obligation to make the promised contribution.',
    conclusionText:
      'Thus, A is a debtor of the partnership for the delivery vehicle and must comply with the promised contribution.',
    relevantProvisions: ['Article 1786'],
    statutoryElements: [
      'Article 1786 Partner is a debtor of the partnership for promised contribution',
      'Obligation to deliver specific promised property',
      'Title or registration in partner\'s name does not extinguish contribution duty',
    ],
    conceptVariations: ['Partner as debtor of promised capital', 'Article 1786 contribution duty'],
  },
  {
    orderIndex: 26,
    testSet: 'TEST_3',
    code: 'TEST3-Q06',
    legacyCode: 'TEST3-Q26',
    title: 'Appraisal of Goods Contributed and Subsequent Increase in Value',
    scenario:
      'A, B, and C formed a partnership in the Philippines to operate a rice-trading business. Under their partnership agreement, A promised to contribute rice stocks as part of the partnership capital, but the agreement did not prescribe a method for appraising them. A proposed using the price at which A had acquired the stocks, while B and C insisted that experts chosen by the partners should appraise them according to current prices. After A contributed the rice stocks, their market price increased, and A claimed that the increase should accrue solely to A as their original owner. Is the appraisal method proposed by B and C correct, and is the subsequent increase in value for the account of the partnership?',
    answerText:
      'Yes, the rice stocks must be appraised by experts chosen by the partners according to current prices, and the subsequent increase in value is for the account of the partnership.',
    ruleText:
      'Under Article 1787 of the Civil Code, when all or part of a partner’s capital contribution consists of goods, the goods must be appraised in the manner prescribed by the partnership agreement. In the absence of a stipulation, experts chosen by the partners must appraise the goods according to current prices, and subsequent changes in their value are for the account of the partnership.',
    applicationText:
      'Here, A’s contribution consisted of rice stocks, which are goods, and the partnership agreement did not prescribe an appraisal method. Therefore, experts chosen by A, B, and C must appraise the stocks according to current prices. After the rice stocks were contributed, the subsequent increase in their market value became for the account of the partnership and did not accrue solely to A.',
    conclusionText:
      'Thus, the appraisal method proposed by B and C is correct, and the subsequent increase in the value of the rice stocks is for the account of the partnership.',
    relevantProvisions: ['Article 1787'],
    statutoryElements: [
      'Article 1787 Appraisal of goods contribution',
      'Appraisal by experts chosen by partners at current prices absent stipulation',
      'Subsequent changes or increases in value accrue to partnership account',
    ],
    conceptVariations: ['Appraisal of goods contribution', 'Article 1787 subsequent price increase'],
  },
  {
    orderIndex: 27,
    testSet: 'TEST_3',
    code: 'TEST3-Q07',
    legacyCode: 'TEST3-Q27',
    title: 'Liability for Interest and Damages on Unpaid Contribution and Withdrawn Funds',
    scenario:
      'A and B formed a partnership in the Philippines to operate a construction-supply business. Under their partnership agreement, A undertook to contribute ₱500,000.00 on January 1 but failed to do so. On March 1, A also withdrew ₱100,000.00 from the partnership coffers and used it for a personal expense. The partnership demanded payment of the promised contribution and the return of the amount withdrawn, together with the corresponding interest and damages. Is A liable for interest and damages on the unpaid contribution beginning January 1 and on the amount withdrawn beginning March 1?',
    answerText:
      'Yes, A is liable for interest and damages on the unpaid contribution beginning January 1 and on the amount withdrawn beginning March 1.',
    ruleText:
      'Under Article 1788 of the Civil Code, a partner who undertakes to contribute a sum of money and fails to do so becomes liable for interest and damages from the time the partner should have complied with the obligation. The same rule applies to any amount taken from the partnership coffers, with liability beginning from the time the partner converted the amount to personal use.',
    applicationText:
      'Here, A undertook to contribute ₱500,000.00 on January 1 but failed to make the contribution. A therefore became liable for interest and damages on that amount beginning January 1. A also withdrew ₱100,000.00 from the partnership coffers and used it for a personal expense on March 1. Consequently, A became liable for interest and damages on the withdrawn amount beginning March 1.',
    conclusionText:
      'Thus, A is liable for interest and damages on the unpaid ₱500,000.00 contribution beginning January 1 and on the ₱100,000.00 withdrawn from the partnership coffers beginning March 1.',
    relevantProvisions: ['Article 1788'],
    statutoryElements: [
      'Article 1788 Liability for interest and damages on money contribution from due date',
      'Liability for converted partnership funds from date of conversion',
      'No need of prior demand for interest to accrue',
    ],
    conceptVariations: ['Interest on unpaid money contribution', 'Article 1788 converted funds liability'],
  },
  {
    orderIndex: 28,
    testSet: 'TEST_3',
    code: 'TEST3-Q08',
    legacyCode: 'TEST3-Q28',
    title: 'Presumption of Equal Capital Contributions',
    scenario:
      'A, B, and C formed a partnership in the Philippines to operate a bakery. Their partnership agreement fixed the partnership capital at ₱900,000.00 but did not specify how much each partner would contribute. A contributed ₱300,000.00, while B contributed ₱150,000.00 and C contributed ₱100,000.00. B and C claimed that they were not required to contribute the same amount as A because the agreement did not expressly require equal contributions. Is each partner required to contribute ₱300,000.00 to the partnership capital?',
    answerText: 'Yes, each partner is required to contribute ₱300,000.00 to the partnership capital.',
    ruleText:
      'Under Article 1790 of the Civil Code, unless there is a stipulation to the contrary, the partners shall contribute equal shares to the capital of the partnership.',
    applicationText:
      'Here, the partnership agreement fixed the total capital at ₱900,000.00 but did not allocate unequal contributions among A, B, and C. In the absence of a contrary stipulation, the three partners must contribute equal shares. Dividing the ₱900,000.00 capital equally among them requires each partner to contribute ₱300,000.00. Therefore, B and C must complete their respective contributions to reach that amount.',
    conclusionText: 'Thus, A, B, and C must each contribute ₱300,000.00 to the partnership capital.',
    relevantProvisions: ['Article 1790'],
    statutoryElements: [
      'Article 1790 Presumption of equal shares in partnership capital',
      'Absence of stipulation to the contrary requires equal contributions',
      'Duty to contribute pro-rata equal amount of fixed partnership capital',
    ],
    conceptVariations: ['Presumption of equal capital shares', 'Article 1790 equal contribution rule'],
  },
  {
    orderIndex: 29,
    testSet: 'TEST_3',
    code: 'TEST3-Q09',
    legacyCode: 'TEST3-Q29',
    title: 'Refusal of Capitalist Partner to Contribute Additional Capital to Save Venture',
    scenario:
      'A, B, and C formed a partnership in the Philippines to operate a printing business. A and B were capitalist partners who contributed money, while C was an industrial partner who contributed services. When the partnership suffered substantial losses and faced the imminent loss of its business, A proposed that each capitalist partner contribute an additional ₱200,000.00 to save the venture. The partnership agreement contained no stipulation excusing any capitalist partner from making an additional contribution under such circumstances. A contributed the additional amount, but B refused. Is B obliged to sell B’s partnership interest to the other partners?',
    answerText: 'Yes, B is obliged to sell B’s partnership interest to the other partners.',
    ruleText:
      'Under Article 1791 of the Civil Code, in the absence of an agreement to the contrary, any partner who refuses to contribute an additional share to the capital to save the venture from an imminent loss of the partnership business must sell that partner’s interest to the other partners. This rule does not apply to an industrial partner.',
    applicationText:
      'Here, the partnership faced the imminent loss of its printing business, and an additional capital contribution was required to save the venture. B, a capitalist partner, refused to contribute the additional ₱200,000.00 despite the absence of an agreement excusing B from doing so. Because B was not an industrial partner, B falls within the rule under Article 1791.',
    conclusionText:
      'Thus, B is obliged to sell B’s partnership interest to the other partners because B refused to make the additional capital contribution needed to save the venture.',
    relevantProvisions: ['Article 1791'],
    statutoryElements: [
      'Article 1791 Obligation to contribute additional capital to save venture from imminent loss',
      'Refusal of capitalist partner creates obligation to sell interest to other partners',
      'Industrial partners are expressly exempted from additional contribution duty',
    ],
    conceptVariations: ['Imminent loss of partnership venture', 'Obligation to sell interest upon refusal to contribute'],
  },
  {
    orderIndex: 30,
    testSet: 'TEST_3',
    code: 'TEST3-Q10',
    legacyCode: 'TEST3-Q30',
    title: 'Managing Partner Collecting Individual Credit from Partnership Debtor',
    scenario:
      'A, B, and C formed a partnership in the Philippines, with A authorized to manage its affairs. D owed A ₱40,000.00 under a personal loan and owed the partnership ₱80,000.00 for goods purchased on credit, with both obligations already demandable. A collected ₱40,000.00 from D and issued a receipt stating that the payment was for A’s personal loan. D did not exercise any right to designate the obligation to which the payment should be applied. Is the entire ₱40,000.00 collection applicable to A’s personal credit?',
    answerText:
      'No, the entire ₱40,000.00 collection is not applicable to A’s personal credit. It must be applied proportionately to A’s credit and the partnership’s credit.',
    ruleText:
      'Under Article 1792 of the Civil Code, when a partner authorized to manage collects a demandable sum owed to that partner in a personal capacity from a person who also owes the partnership another demandable sum, the amount collected must be applied to both credits in proportion to their respective amounts, even if the partner issued a receipt for the personal credit alone. If the receipt was issued for the partnership credit, the entire amount must be applied to that credit.',
    applicationText:
      'Here, A was authorized to manage the partnership and collected ₱40,000.00 from D, who owed A ₱40,000.00 personally and the partnership ₱80,000.00. Both obligations were demandable, and D did not designate the application of the payment. The two credits had a total value of ₱120,000.00. A’s personal credit represented one-third of the total, while the partnership’s credit represented two-thirds. Therefore, ₱13,333.33 must be applied to A’s personal credit and ₱26,666.67 to the partnership’s credit, notwithstanding the receipt issued solely for A’s credit.',
    conclusionText:
      'Thus, the ₱40,000.00 collection must be applied proportionately, with ₱13,333.33 credited to A’s personal loan and ₱26,666.67 credited to the partnership’s receivable.',
    relevantProvisions: ['Article 1792'],
    statutoryElements: [
      'Article 1792 Managing partner collecting personal credit from partnership debtor',
      'Both personal and partnership debts are demandable',
      'Proportionate application between personal and partnership credits',
      'Personal receipt does not defeat statutory proportionate distribution',
    ],
    conceptVariations: ['Managing partner collecting dual debt', 'Proportionate application of payment under Article 1792'],
  },

  // =========================================================================
  // TEST 4 (Questions 31–40)
  // =========================================================================
  {
    orderIndex: 31,
    testSet: 'TEST_4',
    code: 'TEST4-Q01',
    legacyCode: 'TEST4-Q31',
    title: 'Partner Receiving Share of Partnership Credit: Debtor Becoming Insolvent',
    scenario:
      'A, B, and C are partners in a Philippine trading partnership that held a demandable credit of ₱300,000.00 against D. Each partner was entitled to collect a ₱100,000.00 share of the partnership credit. Before B and C collected their shares, A received ₱100,000.00 from D and issued a receipt covering A’s share alone. D thereafter became insolvent and could no longer pay the remaining balance. A claimed that A was entitled to retain the amount because the receipt identified only A’s share. Is A obliged to bring the ₱100,000.00 received from D to the partnership capital?',
    answerText: 'Yes, A is obliged to bring the ₱100,000.00 received from D to the partnership capital.',
    ruleText:
      'Under Article 1793 of the Civil Code, a partner who receives all or part of that partner’s share of a partnership credit before the other partners have collected their shares must bring the amount received to the partnership capital if the debtor thereafter becomes insolvent. This obligation applies even if the partner issued a receipt for that partner’s share alone.',
    applicationText:
      'Here, A received ₱100,000.00 representing A’s share of the partnership credit before B and C collected their respective shares. D thereafter became insolvent and could no longer pay the remaining balance. Therefore, A must bring the amount received to the partnership capital notwithstanding the receipt covering A’s share alone.',
    conclusionText: 'Thus, A must bring the ₱100,000.00 received from D to the partnership capital.',
    relevantProvisions: ['Article 1793'],
    statutoryElements: [
      'Article 1793 Partner collecting separate share of partnership credit',
      'Subsequent insolvency of debtor before other partners collect their shares',
      'Obligation to bring collected share to partnership capital',
      'Receipt for own share alone does not prevent restitution to capital',
    ],
    conceptVariations: ['Insolvent partnership debtor', 'Article 1793 duty to return collected share'],
  },
  {
    orderIndex: 32,
    testSet: 'TEST_4',
    code: 'TEST4-Q02',
    legacyCode: 'TEST4-Q32',
    title: 'Dissolution vs. Termination: Partner Withdrawal',
    scenario:
      'A, B, and C formed a partnership in the Philippines to operate a construction-supply business. After a disagreement, C expressly withdrew from the partnership and ceased to be associated with A and B in carrying on its business. A and B thereafter collected receivables, paid existing obligations, and sold the remaining inventory solely to settle the partnership’s affairs. C claimed that the partnership was immediately terminated upon C’s withdrawal. Was the partnership dissolved by C’s withdrawal but continued until the winding up of its affairs was completed?',
    answerText:
      'Yes, the partnership was dissolved by C’s withdrawal but continued until the winding up of its affairs was completed.',
    ruleText:
      'Under Article 1828 of the Civil Code, dissolution is the change in the relationship of the partners caused by any partner ceasing to be associated in carrying on the partnership business, as distinguished from winding up the business. Under Article 1829, dissolution does not terminate the partnership, which continues until the winding up of its affairs is completed.',
    applicationText:
      'Here, C expressly withdrew and ceased to be associated with A and B in carrying on the partnership business. This change in their relationship caused the partnership’s dissolution. However, A and B continued collecting receivables, paying existing obligations, and selling the remaining inventory solely to settle its affairs. These were acts of winding up, during which the partnership continued to exist.',
    conclusionText:
      'Thus, C’s withdrawal dissolved the partnership but did not immediately terminate it. The partnership continued until the winding up of its affairs was completed.',
    relevantProvisions: ['Article 1828', 'Article 1829'],
    statutoryElements: [
      'Article 1828 Definition of dissolution: change in partner relationship',
      'Distinction between dissolution, winding up, and termination',
      'Article 1829 Dissolution does not terminate partnership entity',
    ],
    conceptVariations: ['Dissolution vs termination', 'Article 1828 change in partner association'],
  },
  {
    orderIndex: 33,
    testSet: 'TEST_4',
    code: 'TEST4-Q03',
    legacyCode: 'TEST4-Q33',
    title: 'Effect of Dissolution: Non-Termination of Partnership Entity',
    scenario:
      'A, B, and C formed a partnership in the Philippines to operate a construction-supply business. After a dispute, C expressly withdrew from the partnership, causing its dissolution. A and B thereafter collected receivables, paid existing partnership obligations, and sold the remaining inventory solely to settle the partnership’s affairs. C claimed that the dissolution immediately terminated the partnership and deprived A and B of authority to complete the winding up. Was the partnership immediately terminated upon its dissolution?',
    answerText: 'No, the partnership was not immediately terminated upon its dissolution.',
    ruleText:
      'Under Article 1829 of the Civil Code, dissolution does not terminate the partnership. The partnership continues until the winding up of its affairs is completed.',
    applicationText:
      'Here, C’s withdrawal dissolved the partnership, but its affairs had not yet been completely wound up. A and B were still collecting receivables, paying existing obligations, and selling the remaining inventory to settle the partnership’s affairs. Therefore, the partnership continued to exist for purposes of winding up despite its dissolution.',
    conclusionText:
      'Thus, the partnership was not immediately terminated upon its dissolution but continued until the winding up of its affairs was completed.',
    relevantProvisions: ['Article 1829'],
    statutoryElements: [
      'Article 1829 Partnership entity continues after dissolution',
      'Continuation until winding up of affairs is completed',
      'Authority of partners to liquidate and wind up affairs',
    ],
    conceptVariations: ['Non-termination upon dissolution', 'Winding up authority under Article 1829'],
  },
  {
    orderIndex: 34,
    testSet: 'TEST_4',
    code: 'TEST4-Q04',
    legacyCode: 'TEST4-Q34',
    title: 'Dissolution by Loss of Specific Thing Contributed',
    scenario:
      'A, B, and C formed a partnership in the Philippines. Under their partnership agreement, A promised to contribute the use and enjoyment of a specifically identified delivery truck while expressly reserving ownership of it. Before A delivered the truck to the partnership, it was destroyed by fire. B and C claimed that the loss dissolved the partnership, while A maintained that the partnership should continue. Was the partnership dissolved by the destruction of the delivery truck?',
    answerText: 'Yes, the partnership was dissolved by the destruction of the delivery truck.',
    ruleText:
      'Under Article 1830(4) of the Civil Code, a partnership is dissolved when a specific thing that a partner promised to contribute perishes before delivery. It is also dissolved by the loss of the thing when the contributing partner reserved ownership and transferred only its use or enjoyment to the partnership.',
    applicationText:
      'Here, A promised to contribute the use and enjoyment of a specifically identified delivery truck while reserving ownership of it. The truck was destroyed before its delivery to the partnership. Its loss therefore falls within Article 1830(4) because the specific thing perished before delivery and A had reserved ownership while promising only its use and enjoyment.',
    conclusionText: 'Thus, the partnership was dissolved by the destruction of the delivery truck.',
    relevantProvisions: ['Article 1830(4)'],
    statutoryElements: [
      'Article 1830(4) Dissolution by loss of specific thing promised before delivery',
      'Loss of thing where partner reserved ownership and promised use/enjoyment',
      'Automatic dissolution upon perishing of specific determinate property',
    ],
    conceptVariations: ['Perishing of specific contribution', 'Article 1830(4) loss of contributed thing'],
  },
  {
    orderIndex: 35,
    testSet: 'TEST_4',
    code: 'TEST4-Q05',
    legacyCode: 'TEST4-Q35',
    title: 'Post-Dissolution Liability: Partner Acting with Knowledge of Dissolution',
    scenario:
      'A, B, and C were partners in a Philippine construction-supply business. A expressly notified B and C that A was dissolving the partnership, and both received notice of the dissolution. Despite having knowledge of the dissolution, B entered into a ₱500,000.00 supply contract in the partnership’s name. The supplier delivered the goods, and the partnership became liable under the contract. After B paid the resulting obligation, B demanded that C reimburse C’s proportionate share. Is C liable to B for a share of the liability created by B after B acquired knowledge of the dissolution?',
    answerText:
      'No, C is not liable to B for a share of the liability created by B after B acquired knowledge of the dissolution.',
    ruleText:
      'Under Article 1833 of the Civil Code, when dissolution is caused by the act of a partner, each partner is liable to the co-partners for that partner’s share of any liability created by another partner acting for the partnership as if it had not been dissolved. This rule does not apply when the partner who created the liability had knowledge of the dissolution.',
    applicationText:
      'Here, A caused the dissolution and notified B and C of it. B therefore knew of the dissolution before entering into the supply contract in the partnership’s name. Although the contract created a liability for the partnership, the exception under Article 1833 applies because B acted with knowledge of the dissolution. Consequently, B cannot require C to bear a proportionate share of the liability created by B’s post-dissolution act.',
    conclusionText:
      'Thus, C is not liable to B for a share of the partnership liability because B knew of the dissolution when B entered into the supply contract.',
    relevantProvisions: ['Article 1833'],
    statutoryElements: [
      'Article 1833 Partner liability for co-partner post-dissolution acts',
      'Exception: partner creating liability with knowledge of dissolution',
      'No right of reimbursement/contribution from co-partners',
    ],
    conceptVariations: ['Post-dissolution contract with knowledge', 'Article 1833 knowledge exception'],
  },
  {
    orderIndex: 36,
    testSet: 'TEST_4',
    code: 'TEST4-Q06',
    legacyCode: 'TEST4-Q36',
    title: 'Binding Effect of Post-Dissolution Transactions: Prior Creditor Without Notice',
    scenario:
      'A, B, and C were partners in a Philippine hardware business. The partnership was dissolved after A withdrew. Before the dissolution, D had extended credit to the partnership for construction materials. After the dissolution, B purchased additional construction materials from D on credit in the partnership’s name, a transaction that would have bound the partnership if it had not been dissolved. D had no knowledge or notice of the dissolution. A and C refused to recognize the transaction, claiming that B could no longer bind the partnership. Was the partnership bound by B’s post-dissolution transaction with D?',
    answerText: 'Yes, the partnership was bound by B’s post-dissolution transaction with D.',
    ruleText:
      'Under Article 1834(2)(a) of the Civil Code, after dissolution, a partner may bind the partnership through a transaction that would have bound it if dissolution had not occurred, provided that the other party had extended credit to the partnership before dissolution and had no knowledge or notice of the dissolution.',
    applicationText:
      'Here, B purchased construction materials on credit in the partnership’s name, and the transaction would have bound the partnership had dissolution not occurred. D had extended credit to the partnership before its dissolution and had no knowledge or notice of the dissolution when the subsequent transaction was made. Therefore, the requirements of Article 1834(2)(a) were satisfied.',
    conclusionText:
      'Thus, the partnership was bound by B’s post-dissolution transaction with D.',
    relevantProvisions: ['Article 1834(2)(a)'],
    statutoryElements: [
      'Article 1834(2)(a) Binding effect of post-dissolution acts on partnership',
      'Prior creditor who had extended credit before dissolution',
      'Absence of knowledge or notice of dissolution binds partnership',
    ],
    conceptVariations: ['Prior creditor without notice of dissolution', 'Article 1834 apparent authority after dissolution'],
  },
  {
    orderIndex: 37,
    testSet: 'TEST_4',
    code: 'TEST4-Q07',
    legacyCode: 'TEST4-Q37',
    title: 'Discharge of Partner’s Existing Liability Upon Dissolution',
    scenario:
      'A, B, and C were partners in a Philippine construction-supply business. Before the partnership was dissolved, it incurred a ₱600,000.00 debt to D. After the dissolution, B and C continued the business, while A claimed that the dissolution automatically discharged A from liability for the existing debt. D did not agree with A, B, C, or the continuing business to discharge A, and no course of dealing existed from which such a discharge could be inferred. Was A discharged from liability for the existing debt solely because the partnership was dissolved?',
    answerText:
      'No, A was not discharged from liability for the existing debt solely because the partnership was dissolved.',
    ruleText:
      'Under Article 1835 of the Civil Code, dissolution of a partnership does not by itself discharge the existing liability of any partner. A partner may be discharged through an agreement among the partner, the partnership creditor, and the person or partnership continuing the business. The agreement may also be inferred from the course of dealing between a creditor who knows of the dissolution and the person or partnership continuing the business.',
    applicationText:
      'Here, the partnership incurred the ₱600,000.00 debt to D before its dissolution. D did not agree to discharge A, and no course of dealing existed from which a discharge could be inferred. The fact that B and C continued the business did not, by itself, release A from liability for the existing debt.',
    conclusionText:
      'Thus, A remained liable for the partnership’s existing ₱600,000.00 debt to D because dissolution alone did not discharge A’s liability.',
    relevantProvisions: ['Article 1835'],
    statutoryElements: [
      'Article 1835 Dissolution does not by itself discharge existing liability of any partner',
      'Discharge requires agreement with creditor or inferred course of dealing',
      'Continuing business by remaining partners does not release withdrawing partner',
    ],
    conceptVariations: ['Pre-existing debt liability upon dissolution', 'Article 1835 non-discharge rule'],
  },
  {
    orderIndex: 38,
    testSet: 'TEST_4',
    code: 'TEST4-Q08',
    legacyCode: 'TEST4-Q38',
    title: 'Right to Wind Up Partnership Affairs',
    scenario:
      'A, B, and C were partners in a Philippine construction-supply business. C caused the dissolution of the partnership in violation of the partnership agreement, while A and B did not wrongfully cause the dissolution. Afterward, A and B sought to collect receivables, pay partnership creditors, and dispose of the remaining inventory to settle the partnership’s affairs. C objected and claimed the exclusive right to conduct the winding up. The partners had no agreement designating C or any other person to perform that task. Is the right to wind up the partnership’s affairs vested in A and B despite C’s objection?',
    answerText:
      'Yes, the right to wind up the partnership’s affairs is vested in A and B despite C’s objection.',
    ruleText:
      'Under Article 1836 of the Civil Code, unless otherwise agreed, the partners who have not wrongfully dissolved the partnership have the right to wind up its affairs. Upon cause shown, any partner or the partner’s legal representative or assignee may obtain winding up by the court.',
    applicationText:
      'Here, C wrongfully caused the dissolution, while A and B did not. The partners had no agreement designating C or another person to conduct the winding up. Therefore, A and B have the right to collect receivables, pay partnership creditors, and dispose of the remaining inventory as part of winding up the partnership’s affairs. C’s objection does not deprive them of that right.',
    conclusionText:
      'Thus, A and B have the right to wind up the partnership’s affairs despite C’s objection.',
    relevantProvisions: ['Article 1836'],
    statutoryElements: [
      'Article 1836 Right to wind up partnership affairs',
      'Vested in partners who have not wrongfully dissolved partnership',
      'Partner wrongfully dissolving partnership has no right to control winding up',
    ],
    conceptVariations: ['Right of innocent partners to wind up', 'Article 1836 wrongful dissolution exclusion'],
  },
  {
    orderIndex: 39,
    testSet: 'TEST_4',
    code: 'TEST4-Q09',
    legacyCode: 'TEST4-Q39',
    title: 'Accrual of Partner’s Right to an Account of Interest',
    scenario:
      'A, B, and C formed a partnership in the Philippines to operate a commercial laundry service. The partnership was dissolved on January 1, after which B and C began winding up its affairs. The partners had no agreement postponing or otherwise altering their right to an accounting. On February 1, A demanded an account of A’s partnership interest, but B and C refused, arguing that the right would arise only after the winding up had been completed. Was A’s right to an account of A’s partnership interest established on the date of dissolution?',
    answerText:
      'Yes, A’s right to an account of A’s partnership interest was established on the date of dissolution.',
    ruleText:
      'Under Article 1842 of the Civil Code, in the absence of an agreement to the contrary, a partner’s right to an account of that partner’s interest accrues on the date of dissolution as against the winding-up partners, surviving partners, or the person or partnership continuing the business.',
    applicationText:
      'Here, the partnership was dissolved on January 1, and no agreement postponed or altered A’s right to an account. Consequently, A’s right accrued on January 1 against B and C as the partners winding up the partnership’s affairs. Their continued winding up did not postpone the accrual of A’s right until its completion.',
    conclusionText:
      'Thus, A’s right to an account of A’s partnership interest accrued on January 1, the date of dissolution.',
    relevantProvisions: ['Article 1842'],
    statutoryElements: [
      'Article 1842 Partner\'s right to an account accrues on the date of dissolution',
      'Accrues against winding up partners, surviving partners, or continuing business',
      'Completion of winding up is not a condition precedent to accrual of right to account',
    ],
    conceptVariations: ['Accrual of right to account upon dissolution', 'Article 1842 accounting rights'],
  },
  {
    orderIndex: 40,
    testSet: 'TEST_4',
    code: 'TEST4-Q10',
    legacyCode: 'TEST4-Q40',
    title: 'Limited Partnership: Admission of Additional Limited Partner',
    scenario:
      'A and B formed a limited partnership in the Philippines and filed its original certificate with the Securities and Exchange Commission. After its formation, C agreed to contribute ₱500,000.00 as an additional limited partner. A and B accepted C’s contribution but did not file an amendment to the original certificate. C claimed that the acceptance of the contribution alone admitted C as an additional limited partner. Was C admitted as an additional limited partner despite the absence of an amendment to the original certificate?',
    answerText: 'No, C was not admitted as an additional limited partner.',
    ruleText:
      'Under Article 1849 of the Civil Code, after the formation of a limited partnership, an additional limited partner may be admitted upon the filing of an amendment to the original certificate in accordance with Article 1865.',
    applicationText:
      'Here, the limited partnership had already been formed when C agreed to contribute ₱500,000.00 as an additional limited partner. Although A and B accepted C’s contribution, they did not file the required amendment to the original certificate. The acceptance of C’s contribution alone did not satisfy Article 1849.',
    conclusionText:
      'Thus, C was not admitted as an additional limited partner because no amendment to the original certificate was filed.',
    relevantProvisions: ['Article 1849', 'Article 1865'],
    statutoryElements: [
      'Article 1849 Admission of additional limited partner after formation',
      'Mandatory requirement of filing amendment to certificate with SEC under Article 1865',
      'Acceptance of contribution alone does not confer limited partner status without amendment',
    ],
    conceptVariations: ['Admission of additional limited partner', 'Article 1849 certificate amendment requirement'],
  },
];

export async function seedOfficial40Questions() {
  console.log('🏛️  Seeding Official 40 Commercial Law (Partnership) Questions into Question Bank...\n');

  let updatedCount = 0;
  let createdCount = 0;

  for (const q of OFFICIAL_40_QUESTIONS) {
    const fullModelAnswer = `Answer:
${q.answerText}

Rule:
${q.ruleText}

Application:
${q.applicationText}

Conclusion:
${q.conclusionText}`;

    // 1. Check if question exists by exact code
    let existing = await prisma.question.findUnique({
      where: { code: q.code },
    });

    // 2. If not found by exact code, check if it exists under legacy code (e.g. PHASE1-SET1-Q01, TEST2-Q11)
    if (!existing && q.legacyCode) {
      existing = await prisma.question.findUnique({
        where: { code: q.legacyCode },
      });
    }

    // 3. If still not found, check if it exists by orderIndex (preserving existing DB IDs & FKs)
    if (!existing) {
      existing = await prisma.question.findFirst({
        where: { orderIndex: q.orderIndex },
      });
    }

    if (existing) {
      // Update existing record safely in place
      await prisma.question.update({
        where: { id: existing.id },
        data: {
          code: q.code,
          title: q.title,
          scenario: q.scenario,
          modelAnswer: fullModelAnswer,
          statutoryElements: JSON.stringify(q.statutoryElements),
          relevantProvisions: JSON.stringify(q.relevantProvisions),
          conceptVariations: JSON.stringify(q.conceptVariations),
          testSet: q.testSet,
          orderIndex: q.orderIndex,
          isActive: true,
          isDemo: false,
        },
      });
      updatedCount++;
      console.log(`  ✓ Updated Q${q.orderIndex.toString().padStart(2, '0')} [${q.testSet}]: ${q.code} — "${q.title}"`);
    } else {
      // Create new record
      await prisma.question.create({
        data: {
          code: q.code,
          title: q.title,
          scenario: q.scenario,
          modelAnswer: fullModelAnswer,
          statutoryElements: JSON.stringify(q.statutoryElements),
          relevantProvisions: JSON.stringify(q.relevantProvisions),
          conceptVariations: JSON.stringify(q.conceptVariations),
          testSet: q.testSet,
          orderIndex: q.orderIndex,
          isActive: true,
          isDemo: false,
        },
      });
      createdCount++;
      console.log(`  ✓ Created Q${q.orderIndex.toString().padStart(2, '0')} [${q.testSet}]: ${q.code} — "${q.title}"`);
    }
  }


  // Deactivate any legacy non-official test questions (e.g. TEST-QB-*, CRIM1-*)
  const officialCodes = OFFICIAL_40_QUESTIONS.map((q) => q.code);
  const deactivated = await prisma.question.updateMany({
    where: {
      code: { notIn: officialCodes },
    },
    data: {
      isActive: false,
      testSet: null,
    },
  });

  if (deactivated.count > 0) {
    console.log(`\n  ℹ️ Deactivated ${deactivated.count} legacy/test question(s) not in official 40 roster.`);
  }

  console.log(`\n✅ Finished Seeding: ${createdCount} created, ${updatedCount} updated.`);
}

if (require.main === module) {
  seedOfficial40Questions()
    .catch((err) => {
      console.error('Error seeding 40 official questions:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
