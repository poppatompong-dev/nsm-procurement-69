# ระบบตรวจสอบและรายงานพัสดุคอมพิวเตอร์ (49 รายการ) - เทศบาลนครนครสวรรค์
**กองยุทธศาสตร์และงบประมาณ เทศบาลนครนครสวรรค์ (คำสั่งเทศบาลนครนครสวรรค์ ที่ ๘๖๔/๒๕๖๙)**

ระบบเว็บแอปพลิเคชันอำนวยความสะดวกในการตรวจรับพัสดุคอมพิวเตอร์ เชื่อมรูปภาพหลักฐานพัสดุจริง (Photo Evidence) ออกรายงานสรุปผลพร้อมภาพถ่ายประกอบ และส่งออกไฟล์ PDF/Excel สอดคล้องตามระเบียบพัสดุภาครัฐ

---

## 🔗 ลิงก์เข้าใช้งานและ Repository (Production Links)

*   **🌐 Live Web Application:** [https://nsm-procurement-69.web.app](https://nsm-procurement-69.web.app)
*   **💻 GitHub Repository:** [https://github.com/poppatompong-dev/nsm-procurement-69](https://github.com/poppatompong-dev/nsm-procurement-69)
*   **🏠 Local Development Server:** `http://localhost:5173/`

---

## 🛠️ เทคโนโลยีที่ใช้ในโครงการ (Tech Stack & Architecture)

| ส่วนประกอบ (Component) | เทคโนโลยี / ไลบรารี (Technology) | รายละเอียด (Description) |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19 + Vite 8** | สถาปัตยกรรม SPA ประสิทธิภาพสูง โหลดเร็ว แสดงผลทันที |
| **Styling & UI** | **Tailwind CSS v4 + Lucide Icons** | ออกแบบ UI แบบ Modern Dashboard, Responsive รองรับมือถือและ A4 Print Mode |
| **Backend & Cloud Services** | **Firebase Hosting + Cloud Firestore** | โฮสติ้งความเร็วสูงและฐานข้อมูล Real-time Sync ข้อมูลข้ามอุปกรณ์ |
| **State & Offline Storage** | **LocalStorage + Cloud Sync Engine** | ทำงานได้แม้ไม่มีอินเทอร์เน็ต (Offline-first) พร้อม Auto-sync เมื่อเชื่อมต่อ |
| **Data Processing & Export** | **SheetJS (xlsx) + Canvas API** | นำเข้า/ส่งออก Excel (.xlsx) และย่อขนาดภาพถ่ายอัตโนมัติก่อนซิงค์ Cloud |
| **Code Quality & Build** | **Oxlint + Vite Builder** | เครื่องมือ Linting ความเร็วสูง พร้อมระบบคอมไพล์โปรดักชัน |

---

## ⚡ คุณลักษณะเด่นของระบบ (Core Features - v1.2.0)

1.  **📋 บันทึกตรวจรับพัสดุรายชิ้น (Inspection Management):**
    *   แสดงรายการพัสดุคอมพิวเตอร์ 49 รายการพร้อมรูปถ่ายจริงขนาดใหญ่
    *   ปุ่มกดเลือกผลการตรวจรับด่วน 1-Click: 🟢 **ผ่าน** / 🔴 **ไม่ผ่าน** / 🟡 **รอตรวจ**
    *   ระบบค้นหาด่วน (Instant Search) และตัวกรองตามกลุ่มงาน/สถานะ/หมวดหมู่
2.  **📄 ระบบออกรายงานสรุปพร้อมรูปภาพหลักฐาน (Official Report & Photo Annex):**
    *   แสดงหนังสือรายงานสรุปผลการตรวจรับทางการ ตารางงบประมาณ และช่องลงนามคณะกรรมการ
    *   ระบบ **"ภาคผนวกรูปภาพหลักฐานพัสดุจริง"** จัดเรียง 2 คอลัมน์ เหมาะสำหรับกระดาษ A4
    *   ปุ่มสั่งพิมพ์ PDF / ส่งออกไฟล์ Excel (.xlsx / .csv) / JSON
3.  **⚙️ ตั้งค่าโครงการ & คณะกรรมการ (Project & Committee Settings):**
    *   จัดการรายชื่อคณะกรรมการตรวจรับ 3 ท่าน
    *   ระบบจัดจับคู่รูปภาพพัสดุอัตโนมัติ (Image Mapping Audit)
    *   เครื่องมือนำเข้าตารางรายการจัดซื้อจากไฟล์ Excel

---

## 💻 การติดตั้งและรันโครงการ (Local Development)

```bash
# 1. ติดตั้ง Dependencies
npm install

# 2. รันคำสั่งสำหรับนักพัฒนา (Dev Server)
npm run dev
# เปิดใช้งานที่ http://localhost:5173/

# 3. สั่งคอมไพล์โปรดักชันบิลด์ (Production Build)
npm run build

# 4. Deploy ขึ้น Firebase Hosting
npx firebase-tools deploy --only hosting
```

---

## 📂 โครงสร้างเอกสารโครงการ (Documentation Index)

*   **[docs/CHANGELOG.md](file:///d:/วัสดุคอม 49 รายการ 200769/docs/CHANGELOG.md):** ประวัติการอัปเดตระบบแต่ละเวอร์ชัน (v1.0.0 -> v1.2.0)
*   **[docs/PROJECT_OVERVIEW.md](file:///d:/วัสดุคอม 49 รายการ 200769/docs/PROJECT_OVERVIEW.md):** วัตถุประสงค์และภาพรวมโครงการ
*   **[docs/SYSTEM_ARCHITECTURE.md](file:///d:/วัสดุคอม 49 รายการ 200769/docs/SYSTEM_ARCHITECTURE.md):** โครงสร้างโค้ด สถาปัตยกรรม React+Vite และ LocalStorage Manager
*   **[docs/DATABASE.md](file:///d:/วัสดุคอม 49 รายการ 200769/docs/DATABASE.md):** พจนานุกรมข้อมูล (Data Dictionary) พัสดุ 49 รายการ
*   **[docs/USER_GUIDE.md](file:///d:/วัสดุคอม 49 รายการ 200769/docs/USER_GUIDE.md):** คู่มือการใช้งานสำหรับคณะกรรมการตรวจรับ
