import { getMonthlyData } from '@/app/reports-data';
import { db } from '@/db/index';
import { devices, attendance } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function testReportLogic() {
  console.log('--- Starting Report Logic Test ---');
  
  const testDate = new Date(); // Today
  
  try {
    console.log('Fetching report data for current month...');
    const data = await getMonthlyData(testDate);
    
    console.log(`Found ${data.length} users in report.`);
    
    data.forEach(user => {
      const daysWorked = Object.keys(user.days).filter(k => 
        user.days[k].morning?.in || user.days[k].afternoon?.in
      );
      
      console.log(`\nUser: ${user.displayName} (${user.userId})`);
      console.log(`- Blocks with activity: ${daysWorked.length}`);
      console.log(`- Total Payment: ${user.totalPayment}`);
      
      daysWorked.forEach(dateKey => {
        const day = user.days[dateKey];
        if (day.morning?.in) {
          console.log(`  [${dateKey}] Morning IN: ${day.morning.in} | Pay: ${day.morning.payment}`);
        }
        if (day.afternoon?.in) {
          console.log(`  [${dateKey}] Afternoon IN: ${day.afternoon.in} | Pay: ${day.afternoon.payment}`);
        }
      });
    });

    console.log('\n✅ Report logic test completed.');
  } catch (error) {
    console.error('❌ Report test failed:', error);
  }
}

testReportLogic().catch(console.error);
