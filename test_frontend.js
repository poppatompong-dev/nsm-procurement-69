import { chromium } from 'playwright';

async function runTest() {
  console.log('🚀 เริ่มต้นการทดสอบเว็บอินเตอร์เฟสตรวจรับพัสดุ...');
  console.log('🔗 กำลังเปิดเบราว์เซอร์ไปที่: https://nsm-procurement-69.web.app/');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Track console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.message);
    console.error(`[Browser PageError]: ${err.stack}`);
  });

  try {
    // Navigate to the deployed site
    await page.goto('https://nsm-procurement-69.web.app/', { waitUntil: 'networkidle', timeout: 30000 });

    console.log('✅ หน้าเว็บโหลดเสร็จสมบูรณ์');

    // 1. Click on Items tab
    console.log('🖱️ กำลังสลับแท็บ "ตรวจรับพัสดุรายชิ้น"...');
    await page.click('button:has-text("ตรวจรับพัสดุรายชิ้น")');
    await page.waitForTimeout(1000);

    // Click on the first item card
    const cardLocator = page.locator('.premium-3d-card').first();
    const cardTitle = await cardLocator.locator('h4').textContent();
    console.log(`🖱️ กำลังคลิกพัสดุการ์ดแรก: "${cardTitle?.trim()}"`);
    
    await cardLocator.click();
    await page.waitForTimeout(1500);

    // Verify modal is open
    const modalTitle = await page.locator('h3').first().textContent();
    console.log(`📌 หน้าต่างพ๊อพพัพโหลดหัวข้อ: "${modalTitle?.trim()}"`);

    // Verify if we can click the checklist buttons inside the modal
    const buttonChecksCount = await page.locator('.premium-3d-card-inner + div button, div.bg-white button').count();
    console.log(`📌 พบหัวข้อเช็คลิสต์ตรวจงานย่อย (ปุ่มกด): ${buttonChecksCount} ข้อ`);
    
    // Attempt to close modal using "ยกเลิก" button
    console.log('🖱️ กำลังจำลองการคลิกปิดหน้าต่างพ๊อพพัพด้วยปุ่มยกเลิก...');
    await page.click('button:has-text("ยกเลิก")');
    await page.waitForTimeout(1000);
    console.log('✅ ปิดหน้าต่างพ๊อพพัพเสร็จสิ้น');

    // 4. Verify no critical Javascript runtime errors occurred
    if (consoleErrors.length === 0) {
      console.log('🛡️ [ผ่าน] ตรวจไม่พบบันทึกข้อผิดพลาด (Console Error) บนบราวเซอร์');
    } else {
      console.log(`🚨 [แจ้งเตือน] ตรวจพบข้อผิดพลาด Console Error ${consoleErrors.length} รายการ:`);
      consoleErrors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err}`);
      });
    }

    console.log('🎉 การทดสอบเสร็จสมบูรณ์เรียบร้อย!');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในขณะทำการรันการทดสอบ:', error);
  } finally {
    await browser.close();
  }
}

runTest();
