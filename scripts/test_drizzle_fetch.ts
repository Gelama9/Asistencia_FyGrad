import { getMonthlyData } from '../app/reports-data';

async function testFetch() {
  console.log('Testing getMonthlyData with Drizzle...');
  try {
    const date = new Date();
    const data = await getMonthlyData(date);
    console.log(`Fetched data for ${data.length} users.`);
    if (data.length > 0) {
      console.log('First user summary:', JSON.stringify({
        userId: data[0].userId,
        displayName: data[0].displayName,
        totalPayment: data[0].totalPayment,
        dayCount: Object.keys(data[0].days).length
      }, null, 2));
    }
  } catch (error) {
    console.error('Fetch failed:', error);
  }
}

testFetch();
