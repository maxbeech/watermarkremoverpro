export interface TrustedByLogo {
  name: string
  url: string
  /** Public path under /logos/. Referenced directly rather than statically
   *  imported: there are 45 of these, harvested from sibling products' own
   *  brand assets, and a data table beats 45 import statements to keep in
   *  sync by hand. See public/logos/README.md for provenance. */
  logo: string
}

/**
 * The homepage "trusted by" wall. Every entry here is a live production
 * product built by the same team as this one; several ship their own real
 * icon mark (copied verbatim from that product's public/ directory), and the
 * rest render a generated monogram in the same rounded-square style so the
 * row reads as one visual family. See public/logos/README.md.
 */
export const TRUSTED_BY: TrustedByLogo[] = [
  { name: 'Ledgeur', url: 'https://ledgeur.com', logo: '/logos/ledgeur.png' },
  { name: 'Bill100', url: 'https://bill100.com', logo: '/logos/bill100.svg' },
  { name: 'Brandmity', url: 'https://brandmity.com', logo: '/logos/brandmity.svg' },
  { name: 'Chartely', url: 'https://chartely.com', logo: '/logos/chartely.svg' },
  { name: 'Contextely', url: 'https://www.contextely.com', logo: '/logos/contextely.svg' },
  { name: 'Contract10', url: 'https://contract10.com', logo: '/logos/contract10.svg' },
  { name: 'Denial7', url: 'https://www.denial7.com', logo: '/logos/denial7.svg' },
  { name: 'Duebay', url: 'https://duebay.com', logo: '/logos/duebay.svg' },
  { name: 'Feedlark', url: 'https://feedlark.com', logo: '/logos/feedlark.svg' },
  { name: 'Grannio', url: 'https://grannio.com', logo: '/logos/grannio.svg' },
  { name: 'JobPlumb', url: 'https://jobplumb.com', logo: '/logos/jobplumb.svg' },
  { name: 'Ledgerary', url: 'https://ledgerary.com', logo: '/logos/ledgerary.svg' },
  { name: 'Lugbird', url: 'https://lugbird.com', logo: '/logos/lugbird.svg' },
  { name: 'Patent77', url: 'https://patent77.com', logo: '/logos/patent77.svg' },
  { name: 'Patientary', url: 'https://patientary.com', logo: '/logos/patientary.svg' },
  { name: 'PermitBird', url: 'https://www.permitbird.com', logo: '/logos/permitbird.svg' },
  { name: 'PortRobin', url: 'https://portrobin.com', logo: '/logos/portrobin.svg' },
  { name: 'RenewBird', url: 'https://renewbird.com', logo: '/logos/renewbird.svg' },
  { name: 'Rigbird', url: 'https://rigbird.com', logo: '/logos/rigbird.svg' },
  { name: 'RotaBay', url: 'https://rotabay.com', logo: '/logos/rotabay.svg' },
  { name: 'Scoutern', url: 'https://scoutern.com', logo: '/logos/scoutern.svg' },
  { name: 'Sourceory', url: 'https://www.sourceory.com', logo: '/logos/sourceory.svg' },
  { name: 'TableHelm', url: 'https://tablehelm.com', logo: '/logos/tablehelm.svg' },
  { name: 'Underhaus', url: 'https://underhaus.com', logo: '/logos/underhaus.svg' },
  { name: 'Vouchity', url: 'https://vouchity.com', logo: '/logos/vouchity.svg' },
  { name: 'Hi Crafty', url: 'https://www.hicrafty.com', logo: '/logos/crafty.svg' },
  { name: 'GradeHack', url: 'https://www.gradehack.com', logo: '/logos/gradehack.svg' },
  { name: 'WillThisHappen', url: 'https://willthishappen.com', logo: '/logos/willthishappen.svg' },
  { name: 'Frifti', url: 'https://www.frifti.com', logo: '/logos/frifti.svg' },
  { name: 'Benefily', url: 'https://www.benefily.com', logo: '/logos/benefily.svg' },
  { name: 'Classify7', url: 'https://www.classify7.com', logo: '/logos/classify7.svg' },
  { name: 'Conformery', url: 'https://conformery.com', logo: '/logos/conformery.svg' },
  { name: 'DeckHelm', url: 'https://deckhelm.com', logo: '/logos/deckhelm.svg' },
  { name: 'Event70', url: 'https://event70.com', logo: '/logos/event70.svg' },
  { name: 'Job13', url: 'https://www.job13.com', logo: '/logos/job13.svg' },
  { name: 'Ledgerage', url: 'https://www.ledgerage.com', logo: '/logos/ledgerage.svg' },
  { name: 'Ledgerler', url: 'https://ledgerler.com', logo: '/logos/ledgerler.svg' },
  { name: 'Mealary', url: 'https://www.mealary.com', logo: '/logos/mealary.svg' },
  { name: 'Meterary', url: 'https://meterary.com', logo: '/logos/meterary.svg' },
  { name: 'ModelCharter', url: 'https://www.modelcharter.com', logo: '/logos/modelcharter.svg' },
  { name: 'RoofHelm', url: 'https://roofhelm.com', logo: '/logos/roofhelm.svg' },
  { name: 'Screen100', url: 'https://screen100.com', logo: '/logos/screen100.svg' },
  { name: 'Slopeify', url: 'https://slopeify.com', logo: '/logos/slopeify.svg' },
  { name: 'Spend7', url: 'https://spend7.com', logo: '/logos/spend7.svg' },
  { name: 'WageCoach', url: 'https://www.wagecoach.com', logo: '/logos/wagecoach.svg' },
]
