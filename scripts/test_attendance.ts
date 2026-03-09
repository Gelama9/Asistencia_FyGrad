import { db } from '@/db/index';
import { attendance, devices } from '@/db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';

async function testAttendanceFlow() {
  console.log('--- Starting Attendance Flow Test ---');
  
  const testDeviceId = 'test-device-' + Date.now();
  
  try {
    // 1. Setup Test Device
    console.log(`Setting up test device: ${testDeviceId}`);
    await db.insert(devices).values({
      deviceId: testDeviceId,
      displayName: 'Test Runner',
      salaryPerBlock: '50.00'
    });

    // 2. Simulate ENTRADA
    console.log('\nTesting ENTRADA...');
    const entryResponse = await fetch('http://localhost:3001/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: testDeviceId,
        action: 'ENTRADA',
        bssid: 'test-wifi'
      })
    });
    
    const entryData = await entryResponse.json();
    console.log('ENTRADA Response:', JSON.stringify(entryData, null, 2));

    if (entryData.success && entryData.isCheckedIn === true) {
      console.log('✅ ENTRADA successful and state is CheckedIn');
    } else {
      console.log('❌ ENTRADA failed');
    }

    // 3. Test DUPLICATE prevention (cooldown)
    console.log('\nTesting DUPLICATE (cooldown)...');
    const dupResponse = await fetch('http://localhost:3001/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: testDeviceId,
        action: 'ENTRADA',
        bssid: 'test-wifi'
      })
    });
    const dupData = await dupResponse.json();
    console.log('Duplicate Response:', dupData.message);
    if (dupData.message?.includes('duplicado ignorado')) {
      console.log('✅ Duplicate prevention working (60s cooldown)');
    } else {
      console.log('❌ Duplicate prevention failed');
    }

    // 4. Test CONFLICT (Already checked in, but after cooldown)
    // For this test we wait or manually bypass if we could, but here we just check logic
    // Let's try to SALIDA
    console.log('\nTesting SALIDA...');
    const exitResponse = await fetch('http://localhost:3001/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: testDeviceId,
        action: 'SALIDA',
        bssid: 'test-wifi'
      })
    });
    const exitData = await exitResponse.json();
    console.log('SALIDA Response:', JSON.stringify(exitData, null, 2));
    
    if (exitData.success && exitData.isCheckedIn === false) {
      console.log('✅ SALIDA successful and state is CheckedOut');
    } else {
      // It might fail due to the 60s cooldown if run too fast
      console.log('⚠️ SALIDA result:', exitData.message || exitData.error);
    }

    // 5. Cleanup
    console.log('\nCleaning up test data...');
    await db.delete(attendance).where(eq(attendance.deviceId, testDeviceId));
    await db.delete(devices).where(eq(devices.deviceId, testDeviceId));
    console.log('✅ Cleanup finished');

  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

testAttendanceFlow().catch(console.error);
