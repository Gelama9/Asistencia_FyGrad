import { getPayrollSummary } from '../app/reports-data';

async function testPayroll() {
  console.log('Testing getPayrollSummary with Drizzle...');
  try {
    const date = new Date();
    const data = await getPayrollSummary(date);
    console.log(`Fetched payroll summary for ${data.length} users.`);
    if (data.length > 0) {
      console.log('First user payroll:', JSON.stringify(data[0], null, 2));
    }
  } catch (error) {
    console.error('Payroll fetch failed:', error);
  }
}

testPayroll();
