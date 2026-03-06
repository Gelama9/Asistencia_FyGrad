import { saveStatusOverride } from '../app/reports-actions';

async function testActions() {
  console.log('Testing saveStatusOverride with Drizzle...');
  try {
    const formData = new FormData();
    formData.append('userId', '905ea91b658ef10b');
    formData.append('dateKey', '2026-03-06');
    formData.append('blockType', 'morning');
    formData.append('status', 'Permiso');
    formData.append('notes', 'Test Drizzle Note ' + new Date().toLocaleTimeString());
    formData.append('paymentAmount', '10.00'); // S/. 10 discount, pay S/. 36

    const res = await saveStatusOverride(formData);
    console.log('Action result:', JSON.stringify(res, null, 2));
    
    // Verify by listing again (optional, we saw it worked for read)
  } catch (error) {
    console.error('Action failed:', error);
  }
}

testActions();
