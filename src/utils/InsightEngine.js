import { inspectionRepository } from './inspectionRepository';

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

  // Load active template information
  const projectConfig = inspectionRepository.getProjectConfig();
  const template = inspectionRepository.getTemplateById(projectConfig.templateId);

  // 1. Critical & Warnings: Duplicate Values Check for unique fields
  // In IT computer we look for duplicate serial number. In general, we look for duplicate values of any key starting with "serial" or "code" or "asset".
  const uniqueFields = template.fields.filter(f => f.key.includes('serial') || f.key.includes('asset') || f.key.includes('number') || f.key.includes('lot'));
  
  uniqueFields.forEach(field => {
    const valueMap = {};
    items.forEach(item => {
      const val = (item[field.key] || '').trim().toUpperCase();
      if (val && val !== 'N/A' && val !== '-' && val !== 'ไม่มี') {
        if (!valueMap[val]) valueMap[val] = [];
        valueMap[val].push(item.id);
      }
    });

    const duplicates = Object.entries(valueMap).filter(([_, ids]) => ids.length > 1);
    if (duplicates.length > 0) {
      duplicates.forEach(([val, ids]) => {
        insights.push({
          type: 'critical',
          title: `ตรวจพบค่าซ้ำในฟิลด์ ${field.label}`,
          message: `ข้อมูล "${val}" ถูกบันทึกซ้ำกันในพัสดุรหัส #${ids.join(', #')} ซึ่งปกติควรเป็นค่าเฉพาะชิ้น (Unique)`,
          icon: 'AlertOctagon'
        });
      });
    }
  });

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
        description: `เป็นรายการงบจัดซื้อสูงรวม ${((item.qty * item.unit_price) / 1000).toFixed(1)}k บาท เพื่อระงับความเสี่ยงโครงการตรวจงานก่อนล่าช้า`
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
      message: `พบรายการสิ่งส่งมอบจำนวน ${missingPhotos.length} รายการ ที่ยังไม่ได้อัปโหลดไฟล์รูปถ่ายยืนยันสภาพพัสดุจริงหรือไฟล์เอกสารแนบ`,
      icon: 'CameraOff'
    });
  }

  // 4. Missing required template fields
  const requiredFields = template.fields.filter(f => f.required);
  const incompleteFieldsItems = items.filter(i => 
    i.inspectStatus !== 'passed' && requiredFields.some(f => !i[f.key])
  );

  if (incompleteFieldsItems.length > 0 && requiredFields.length > 0) {
    insights.push({
      type: 'warning',
      title: 'ข้อมูลฟิลด์ที่จำเป็นตามแบบฟอร์มยังกรอกไม่ครบ',
      message: `มีรายการตรวจรับ ${incompleteFieldsItems.length} ชิ้น ที่ขาดข้อมูลฟิลด์บังคับในเกณฑ์ของ ${template.name}`,
      icon: 'KeyRound'
    });
    
    incompleteFieldsItems.slice(0, 2).forEach(item => {
      const missingFieldName = requiredFields.find(f => !item[f.key])?.label || 'รายละเอียดพัสดุ';
      recommendations.push({
        type: 'normal',
        targetId: item.id,
        title: `กรอกข้อมูล "${missingFieldName}" ของ #${item.id}`,
        description: `จำเป็นต้องระบุตามแม่แบบการตรวจรับประเภท ${template.name} ก่อนอนุมัติผ่าน`
      });
    });
  }

  // 5. Incomplete checklist checks for active items
  const incompleteChecklistCount = items.filter(i => {
    if (i.inspectStatus === 'passed') return false;
    const checkedLength = Object.values(i.checklist || {}).filter(Boolean).length;
    return checkedLength < template.checklist.length;
  }).length;

  if (incompleteChecklistCount > 0) {
    insights.push({
      type: 'warning',
      title: 'เช็คลิสต์การตรวจเช็คย่อยยังทำไม่ครบ',
      message: `พบรายการสิ่งของ ${incompleteChecklistCount} รายการ ที่คณะกรรมการยังตรวจสอบหัวข้อเกณฑ์ย่อย Checklist ไม่ครบถ้วน`,
      icon: 'CheckSquare'
    });
  }

  // 6. Normal recommendations: notes to follow up
  const failedItems = items.filter(i => i.inspectStatus === 'failed');
  if (failedItems.length > 0) {
    insights.push({
      type: 'critical',
      title: 'มีพัสดุประเมินไม่ผ่านเกณฑ์ส่งมอบ',
      message: `ตรวจพบรายการตรวจรับมีสถานะชำรุด/ต้องแก้ไขจำนวน ${failedItems.length} รายการ จากความเห็นของคณะกรรมการร่วมกัน`,
      icon: 'XCircle'
    });

    failedItems.forEach(item => {
      recommendations.push({
        type: 'critical-action',
        targetId: item.id,
        title: `ติดตามงานแก้ไขและส่งตรวจซ้ำ #${item.id}`,
        description: `พัสดุขัดแย้งกับสเปกสัญญาก่อสร้าง/TOR ต้องส่งหนังสือแจ้งผู้ขายตามหมายเหตุ: "${item.notes || 'ชำรุดเสียหาย/ไม่พบหมายเลขเครื่อง'}"`
      });
    });
  }

  // 7. Category average cost analysis (Budget warning)
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
    const categoryLabel = catNames[topCategory[0]] || `หมวด ${topCategory[0]}`;
    insights.push({
      type: 'info',
      title: 'หมวดหมู่การใช้งบประมาณจัดสรรสูงสุด',
      message: `หมวดหมู่ "${categoryLabel}" มีการใช้งบจัดจัดซื้อรวมสูงสุดในระบบที่ ${(topCategory[1] / 1000).toFixed(1)}k บาท`,
      icon: 'TrendingUp'
    });
  }

  // 8. General Progress insights
  if (passedPct === 100) {
    insights.push({
      type: 'info',
      title: 'โครงการผ่านการตรวจรับครบถ้วน 100%',
      message: `พัสดุและรายการตรวจในสัญญาทั้งหมดได้รับการประเมินตามแม่แบบ ${template.name} เรียบร้อย ครบถ้วน พร้อมเซ็นหนังสือส่งมอบปิดงบ`,
      icon: 'Award'
    });
  } else {
    insights.push({
      type: 'info',
      title: 'ความคืบหน้าภาพรวมโครงการ',
      message: `โครงการตรวจรับสำเร็จไปแล้วคิดเป็น ${passedPct}% เหลือรายการที่อยู่ระหว่างรอการดำเนินการตรวจสอบอีก ${pending} รายการ`,
      icon: 'PieChart'
    });
  }

  return {
    insights,
    recommendations: recommendations.slice(0, 5) // cap at top 5 recommendations
  };
};
