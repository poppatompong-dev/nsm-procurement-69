/**
 * Automated Analytics Insight & Recommendation Engine for Government Procurement
 * Analytically processes the items database and extracts patterns, anomalies, risks, and suggestions.
 */
export const generateInsightsAndRecommendations = (items) => {
  const insights = [];
  const recommendations = [];

  const total = items.length;
  if (total === 0) return { insights, recommendations };

  const passed = items.filter(i => i.inspectStatus === 'passed').length;
  const pending = items.filter(i => i.inspectStatus === 'pending').length;
  const failed = items.filter(i => i.inspectStatus === 'failed').length;

  const passedPct = Math.round((passed / total) * 100);

  // 1. Critical & Warnings: Duplicate Serial Numbers Check
  const serialMap = {};
  items.forEach(item => {
    const sn = (item.serial_number || '').trim().toUpperCase();
    if (sn && sn !== 'N/A' && sn !== '-') {
      if (!serialMap[sn]) serialMap[sn] = [];
      serialMap[sn].push(item.id);
    }
  });

  const duplicateSerials = Object.entries(serialMap).filter(([_, ids]) => ids.length > 1);
  if (duplicateSerials.length > 0) {
    duplicateSerials.forEach(([sn, ids]) => {
      insights.push({
        type: 'critical',
        title: 'ตรวจพบหมายเลข Serial Number ซ้ำกันในระบบ',
        message: `หมายเลข S/N "${sn}" ถูกบันทึกซ้ำกันในพัสดุรหัส #${ids.join(', #')} ซึ่งอาจระบุเครื่องสลับกันหรือส่งของซ้ำซ้อน`,
        icon: 'AlertOctagon'
      });
    });
  }

  // 2. High-value pending inspection alerts
  const highValuePending = items.filter(i => i.inspectStatus === 'pending' && (i.qty * i.unit_price) >= 50000);
  if (highValuePending.length > 0) {
    insights.push({
      type: 'critical',
      title: 'มีพัสดุมูลค่าสูงตกค้างการตรวจสอบ',
      message: `พบพัสดุมูลค่างบประมาณสูงตั้งแต่ 50,000 บาทขึ้นไป จำนวน ${highValuePending.length} รายการ ที่ยังอยู่ระหว่างรอการตรวจรับหน้างาน`,
      icon: 'ShieldAlert'
    });
    
    // Add recommendations for high value items
    highValuePending.slice(0, 3).forEach(item => {
      recommendations.push({
        type: 'high-priority',
        targetId: item.id,
        title: `ควรเร่งตรวจสอบพัสดุ #${item.id} (${item.name.slice(0, 35)}...)`,
        description: `เป็นรายการงบจัดซื้อสูงรวม ${((item.qty * item.unit_price) / 1000).toFixed(1)}k บาท เพื่อปิดยอดความเสี่ยงโครงการก่อนครบกำหนด`
      });
    });
  }

  // 3. Incomplete Evidence (Missing Photos / Checklists)
  const missingPhotos = items.filter(i => {
    if (i.inspectStatus === 'passed') return false; // ignore already passed
    const hasImg = Object.values(i.images || {}).some(img => img && img !== '');
    return !hasImg;
  });

  if (missingPhotos.length > 0) {
    insights.push({
      type: 'warning',
      title: 'รายการพัสดุขาดภาพหลักฐานแนบท้าย',
      message: `พบพัสดุจัดซื้อจำนวน ${missingPhotos.length} รายการ ที่ยังไม่มีการอัปโหลดไฟล์รูปภาพหรือหลักฐานถ่ายสภาพหน้างานจริง`,
      icon: 'CameraOff'
    });
  }

  // 4. Missing Serial/MAC address for network/electronics categories
  const electronicsNeedsSerial = items.filter(i => 
    (i.category === 'connectivity' || i.category === 'electronics' || i.category === 'peripherals') &&
    !i.serial_number && 
    i.inspectStatus !== 'passed'
  );

  if (electronicsNeedsSerial.length > 0) {
    insights.push({
      type: 'warning',
      title: 'อุปกรณ์อิเล็กทรอนิกส์ยังไม่ลงทะเบียน Serial Number',
      message: `มีอุปกรณ์เชื่อมต่อ/อิเล็กทรอนิกส์ ${electronicsNeedsSerial.length} ชิ้น ที่ขาดหมายเลข S/N หรือ MAC Address ตามระเบียบราชการ`,
      icon: 'KeyRound'
    });
    
    electronicsNeedsSerial.slice(0, 2).forEach(item => {
      recommendations.push({
        type: 'normal',
        targetId: item.id,
        title: `บันทึกหมายเลข S/N ของ #${item.id}`,
        description: `อุปกรณ์ประเภท ${item.category === 'connectivity' ? 'เชื่อมต่อเน็ตเวิร์ก' : 'อิเล็กทรอนิกส์'} จำเป็นต้องลงทะเบียนระบุเลขอ้างอิงก่อนผ่านตรวจรับ`
      });
    });
  }

  // 5. Normal recommendations: notes to follow up
  const failedItems = items.filter(i => i.inspectStatus === 'failed');
  if (failedItems.length > 0) {
    insights.push({
      type: 'critical',
      title: 'มีรายการพัสดุที่ไม่ผ่านเกณฑ์มาตรฐาน TOR',
      message: `ตรวจพบพัสดุที่กรรมการปฏิเสธการรับมอบจำนวน ${failedItems.length} รายการ ซึ่งมีข้อสังเกตเรื่องสเปกไม่ตรงสัญญา`,
      icon: 'XCircle'
    });

    failedItems.forEach(item => {
      recommendations.push({
        type: 'critical-action',
        targetId: item.id,
        title: `ประสานงานปรับเปลี่ยนพัสดุ #${item.id}`,
        description: `พัสดุมีสเปกไม่ตรงตาม TOR สัญญา หรือชำรุดเสียหาย ต้องทำหนังสือส่งคืนผู้ขายพร้อมข้อสังเกต: "${item.notes || 'ไม่ระบุ'}"`
      });
    });
  }

  // 6. Category average cost analysis (Budget warning)
  const categoryBudgets = {};
  items.forEach(i => {
    categoryBudgets[i.category] = (categoryBudgets[i.category] || 0) + (i.qty * i.unit_price);
  });
  
  const topCategory = Object.entries(categoryBudgets).sort((a, b) => b[1] - a[1])[0];
  if (topCategory) {
    const catNames = {
      connectivity: '🔌 อุปกรณ์เชื่อมต่อ',
      storage: '💾 อุปกรณ์จัดเก็บ',
      peripherals: '🖱️ อุปกรณ์ต่อพ่วง',
      electronics: '🤖 อิเล็กทรอนิกส์',
      tools: '🛠️ เครื่องมือช่าง',
      organization: '📁 จัดระเบียบ',
      toner: '🖨️ หมึกพิมพ์',
      consumables: '🔋 วัสดุสิ้นเปลือง'
    };
    insights.push({
      type: 'info',
      title: 'หมวดหมู่ที่ใช้งบประมาณจัดซื้อสูงสุด',
      message: `หมวดหมู่ "${catNames[topCategory[0]] || topCategory[0]}" ใช้งบจัดสรรสูงสุดในโครงการรวม ${(topCategory[1] / 1000).toFixed(1)}k บาท`,
      icon: 'TrendingUp'
    });
  }

  // 7. General Progress insights
  if (passedPct === 100) {
    insights.push({
      type: 'info',
      title: 'โครงการผ่านการตรวจรับครบถ้วน 100%',
      message: 'พัสดุครุภัณฑ์คอมพิวเตอร์ทั้งหมดได้รับการสำรวจและบันทึกความก้าวหน้าเรียบร้อยแล้ว คณะกรรมการสามารถลงนามปิดเล่มตรวจงานได้',
      icon: 'Award'
    });
  } else {
    insights.push({
      type: 'info',
      title: 'ความคืบหน้าการทำงานภาพรวม',
      message: `โครงการตรวจรับไปแล้วคิดเป็น ${passedPct}% เหลือพัสดุอยู่ระหว่างรอการดำเนินการอีก ${pending} รายการ`,
      icon: 'PieChart'
    });
  }

  return {
    insights,
    recommendations: recommendations.slice(0, 5) // cap at top 5 recommendations
  };
};
