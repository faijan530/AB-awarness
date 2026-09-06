import { prisma } from '../config/database';
import { SourceType, CredibilityStatus } from '@prisma/client';

async function seedSources() {
  const count = await prisma.source.count();
  if (count > 0) {
    console.log(`Sources already seeded (${count} sources exist).`);
    return;
  }

  console.log('Seeding initial verified sources...');

  const sources = [
    {
      name: 'Press Information Bureau (PIB)',
      sourceType: SourceType.GOVERNMENT,
      url: 'https://pib.gov.in',
      description: 'Nodal agency of the Government of India for broadcasting official press communiques.',
      credibilityStatus: CredibilityStatus.VERIFIED,
    },
    {
      name: 'Jharkhand State Information Portal',
      sourceType: SourceType.OFFICIAL,
      url: 'https://jharkhand.gov.in',
      description: 'Official Government of Jharkhand portal for gazette releases and ministerial notices.',
      credibilityStatus: CredibilityStatus.VERIFIED,
    },
    {
      name: 'Palamu District Administration',
      sourceType: SourceType.OFFICIAL,
      url: 'https://palamu.nic.in',
      description: 'Deputy Commissioner & District Magistrate office official dispatches and notices.',
      credibilityStatus: CredibilityStatus.VERIFIED,
    },
    {
      name: 'Garhwa District Administration',
      sourceType: SourceType.OFFICIAL,
      url: 'https://garhwa.nic.in',
      description: 'District portal of Garhwa administration for local notifications and land acquisitions.',
      credibilityStatus: CredibilityStatus.VERIFIED,
    },
    {
      name: 'Press Trust of India (PTI)',
      sourceType: SourceType.NEWS_ORGANIZATION,
      url: 'https://ptinews.com',
      description: 'Premier Indian news wire agency transmitting verified national and regional dispatches.',
      credibilityStatus: CredibilityStatus.VERIFIED,
    },
  ];

  for (const s of sources) {
    await prisma.source.create({ data: s });
  }

  console.log('Initial sources successfully seeded!');
}

seedSources()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
