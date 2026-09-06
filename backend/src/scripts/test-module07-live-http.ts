import http from 'http';
import dotenv from 'dotenv';
dotenv.config();

async function makeRequest(options: http.RequestOptions, postData?: any): Promise<{ statusCode: number; body: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let rawData = '';
      res.on('data', (chunk) => {
        rawData += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = rawData ? JSON.parse(rawData) : null;
          resolve({ statusCode: res.statusCode || 0, body: parsed });
        } catch {
          resolve({ statusCode: res.statusCode || 0, body: rawData });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runLiveHttpTests() {
  console.log('\n===============================================================');
  console.log(' MODULE 7: LIVE HTTP API END-TO-END VERIFICATION');
  console.log(' Target: http://localhost:5000/api/v1');
  console.log('===============================================================\n');

  // STEP 1: Authenticate Super Admin via HTTP POST
  console.log('▶ [1/7] Authenticating Super Admin via POST /api/v1/auth/login...');
  const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@abmedia.in';
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD || 'AdminPassword123!';

  const loginRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: adminEmail, password: adminPassword }
  );

  if (loginRes.statusCode !== 200 || !loginRes.body?.data?.accessToken) {
    throw new Error(`Login failed with status ${loginRes.statusCode}: ${JSON.stringify(loginRes.body)}`);
  }
  const token = loginRes.body.data.accessToken;
  const user = loginRes.body.data.user;
  console.log(`✅ Logged in as: ${user.fullName} (${user.roles.join(', ')}) [Status: ${loginRes.statusCode}]`);

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // STEP 2: Query Public Sources via HTTP GET
  console.log('\n▶ [2/7] Fetching Official Sources via GET /api/v1/sources...');
  const sourcesRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/sources',
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (sourcesRes.statusCode !== 200 || !Array.isArray(sourcesRes.body?.data)) {
    throw new Error(`Failed to fetch sources: ${JSON.stringify(sourcesRes.body)}`);
  }
  console.log(`✅ Sources Endpoint OK [Status: ${sourcesRes.statusCode}]`);
  console.log(`   ↳ Found ${sourcesRes.body.data.length} official sources in registry.`);
  console.log(`   ↳ First source: "${sourcesRes.body.data[0]?.name}" (${sourcesRes.body.data[0]?.credibilityStatus})`);

  // STEP 3: Create Source via HTTP POST (Admin Only)
  console.log('\n▶ [3/7] Creating Verified Source via POST /api/v1/admin/sources...');
  const newSourceRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/admin/sources',
      method: 'POST',
      headers: authHeaders,
    },
    {
      name: 'Jharkhand State Disaster Management Authority',
      sourceType: 'GOVERNMENT',
      url: 'https://jsdma.jharkhand.gov.in',
      description: 'Official emergency communiques and flood alert bulletins.',
      credibilityStatus: 'VERIFIED',
    }
  );

  if (newSourceRes.statusCode !== 201) {
    throw new Error(`Failed to create source: ${JSON.stringify(newSourceRes.body)}`);
  }
  const createdSourceId = newSourceRes.body.data.id;
  console.log(`✅ Admin Source Created OK [Status: ${newSourceRes.statusCode}]`);
  console.log(`   ↳ Source ID: ${createdSourceId}`);

  // STEP 4: Query Media Registry via HTTP GET (Admin Desk)
  console.log('\n▶ [4/7] Querying Media Desk via GET /api/v1/admin/media...');
  const mediaRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/admin/media?limit=5',
    method: 'GET',
    headers: authHeaders,
  });

  if (mediaRes.statusCode !== 200) {
    throw new Error(`Failed to list admin media: ${JSON.stringify(mediaRes.body)}`);
  }
  console.log(`✅ Admin Media Registry OK [Status: ${mediaRes.statusCode}]`);
  console.log(`   ↳ Total Assets: ${mediaRes.body.meta?.total || 0}`);

  // STEP 5: Create a Draft News Story via HTTP POST
  console.log('\n▶ [5/7] Submitting Story with Source via POST /api/v1/news...');
  const newsRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/news',
      method: 'POST',
      headers: authHeaders,
    },
    {
      title: 'Jharkhand Power Grid Expands 400kV Transmission Capacity in 2026',
      shortDescription: 'State energy taskforce certified new substation in Latehar district.',
      content:
        'The Department of Energy verified 400kV transmission link completion on 29 August 2026. Chief Engineer verified zero power interruptions.',
      sources: [
        {
          sourceId: createdSourceId,
          referenceUrl: 'https://jsdma.jharkhand.gov.in/bulletin-42',
          sourceNote: 'Certified bulletin released by State Energy Secretary.',
        },
      ],
    }
  );

  if (newsRes.statusCode !== 201) {
    throw new Error(`Failed to create news draft: ${JSON.stringify(newsRes.body)}`);
  }
  const newsArticle = newsRes.body.data;
  console.log(`✅ News Story Draft Created OK [Status: ${newsRes.statusCode}]`);
  console.log(`   ↳ Story ID: ${newsArticle.id} ("${newsArticle.title}")`);

  // STEP 6: Request Verification via HTTP POST /api/v1/verification/request
  console.log('\n▶ [6/7] Requesting Automated Verification via POST /api/v1/verification/request...');
  const verifyReqRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/verification/request',
      method: 'POST',
      headers: authHeaders,
    },
    {
      newsId: newsArticle.id,
      verificationType: 'FACT_CHECK',
    }
  );

  if (verifyReqRes.statusCode !== 201 && verifyReqRes.statusCode !== 200) {
    throw new Error(`Failed to request verification: ${JSON.stringify(verifyReqRes.body)}`);
  }
  const verificationRecord = verifyReqRes.body.data;
  console.log(`✅ Verification Processed OK [Status: ${verifyReqRes.statusCode}]`);
  console.log(`   ↳ Record ID: ${verificationRecord.id}`);
  console.log(`   ↳ Originality: ${verificationRecord.scores?.originality}%`);
  console.log(`   ↳ Fact Support: ${verificationRecord.scores?.factSupport}%`);
  console.log(`   ↳ Overall Score: ${verificationRecord.scores?.overallScore}%`);

  // STEP 7: Super Admin Editorial Decision via HTTP POST
  console.log('\n▶ [7/7] Submitting Editorial Decision via POST /api/v1/admin/verification/:id/decision...');
  const decisionRes = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/v1/admin/verification/${verificationRecord.id}/decision`,
      method: 'POST',
      headers: authHeaders,
    },
    {
      decision: 'APPROVE',
      rationale: 'Verified primary source documentation attached from state government portal.',
    }
  );

  if (decisionRes.statusCode !== 200) {
    throw new Error(`Failed to submit decision: ${JSON.stringify(decisionRes.body)}`);
  }
  console.log(`✅ Editorial Decision Submitted OK [Status: ${decisionRes.statusCode}]`);
  console.log(`   ↳ Status: ${decisionRes.body.data.status}`);
  console.log(`   ↳ News Status: ${decisionRes.body.data.news?.status || 'PUBLISHED'}`);

  console.log('\n===============================================================');
  console.log(' 🎉 ALL 7 LIVE HTTP ENDPOINTS TESTED AND VERIFIED SUCCESSFULLY!');
  console.log('===============================================================\n');
}

runLiveHttpTests().catch((err) => {
  console.error('HTTP Test Failed:', err);
  process.exit(1);
});
