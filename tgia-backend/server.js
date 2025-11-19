const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const os = require('os');
const ExcelJS = require('exceljs');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

const ordersDir = path.join(os.homedir(), 'Desktop', 'TGIA_Orders');
const templatesDir = path.join(__dirname, 'templates');
const configDir = path.join(__dirname, 'config');  

if (!fs.existsSync(ordersDir)) {
  fs.mkdirSync(ordersDir, { recursive: true });
}

if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}


// 讀取設定黨
let emailConfig, salesConfig;

try {
  emailConfig = JSON.parse(
    fs.readFileSync(path.join(configDir, 'email.config.json'), 'utf-8')
  );
  console.log('✅ email 設定已經載入');
} catch (error) {
  console.error('❌ 設定載入失敗:', error.message);
  emailConfig = null;
}

try {
  salesConfig = JSON.parse(
    fs.readFileSync(path.join(configDir, 'sales.config.json'), 'utf-8')
  );
  console.log(`✅ 業務人員設定已經載入 (${salesConfig.length} 人)`);
} catch (error) {
  console.error('❌ 務人員設定無法載入:', error.message);
  salesConfig = [];
}


let transporter = null;

if (emailConfig && emailConfig.smtp) {
  transporter = nodemailer.createTransport({
    host: emailConfig.smtp.host,
    port: emailConfig.smtp.port,
    secure: emailConfig.smtp.secure,
    auth: {
      user: emailConfig.smtp.auth.user,
      pass: emailConfig.smtp.auth.pass
    }
  });

  // 測試
  transporter.verify((error, success) => {
    if (error) {
      console.log('❌ Server連結失敗:', error.message);
    } else {
      console.log('✅ Server連結成功 (Office365)');
    }
  });
} else {
  console.log('⚠️ 郵件配置不完全，無法建立傳輸器');
}

// 🆕 根据业务代码或姓名查找邮箱
function getSalesEmail(identifier) {
  if (!identifier || !salesConfig) return null;
  
  let sales = salesConfig.find(s => s.code === identifier);
  

  if (!sales) {
    sales = salesConfig.find(s => s.name === identifier);
  }
  
  if (sales) {
    console.log(`✅ 對應業務人員: ${sales.name} (${sales.code}) - ${sales.email}`);
    return sales;  
  }
  
  console.log(`⚠️ 業務人員異常: ${identifier}`);
  return null;
}

// ⭐⭐⭐ 新增：複製行格式的輔助函數 ⭐⭐⭐
function copyRowStyle(worksheet, sourceRow, targetRow, startCol, endCol) {
  for (let col = startCol; col <= endCol; col++) {
    const sourceCell = worksheet.getRow(sourceRow).getCell(col);
    const targetCell = worksheet.getRow(targetRow).getCell(col);
    
   
    if (sourceCell.style) {
      targetCell.style = {
        font: sourceCell.font ? { ...sourceCell.font } : undefined,
        alignment: sourceCell.alignment ? { ...sourceCell.alignment } : undefined,
        border: sourceCell.border ? {
          top: sourceCell.border.top ? { ...sourceCell.border.top } : undefined,
          left: sourceCell.border.left ? { ...sourceCell.border.left } : undefined,
          bottom: sourceCell.border.bottom ? { ...sourceCell.border.bottom } : undefined,
          right: sourceCell.border.right ? { ...sourceCell.border.right } : undefined
        } : undefined,
        fill: sourceCell.fill ? { ...sourceCell.fill } : undefined,
        numFmt: sourceCell.numFmt
      };
    }
    
    // 複製列高
    const sourceRowObj = worksheet.getRow(sourceRow);
    const targetRowObj = worksheet.getRow(targetRow);
    if (sourceRowObj.height) {
      targetRowObj.height = sourceRowObj.height;
    }
  }
}

// 插入新列並複製樣式
function insertRowWithStyle(worksheet, templateRow, targetRow, startCol, endCol) {
  // 1) 先插入一列（空的）
  worksheet.insertRow(targetRow, []);

  // 2) 再把模板列的樣式複製過去
  copyRowStyle(worksheet, templateRow, targetRow, startCol, endCol);
}


app.post('/api/orders', (req, res) => {
  try {
    const formData = req.body;
    const orderId = `TGIA-${Date.now()}`;
    const orderFile = path.join(ordersDir, `${orderId}.json`);

    // 🆕 建一個有 emailSent flag 的物件
    const orderDataToSave = {
      ...formData,
      emailSent: false,          
      createdAt: new Date().toISOString()
    };

    fs.writeFileSync(orderFile, JSON.stringify(orderDataToSave, null, 2));

    console.log(`✅ 訂單已保存: ${orderId}`);
    res.json({ success: true, orderId });
  } catch (error) {
    console.error('❌ 保存訂單失敗:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


app.get('/api/orders/:orderId/export', async (req, res) => {
  try {
    const { orderId } = req.params;
    const orderFile = path.join(ordersDir, `${orderId}.json`);
    
    if (!fs.existsSync(orderFile)) {
      return res.status(404).json({ error: '訂單不存在' });
    }
    
    const orderData = JSON.parse(fs.readFileSync(orderFile, 'utf-8'));

      // 舊有訂單可能沒有 emailSent，統一補成 false
  if (typeof orderData.emailSent === 'undefined') {
    orderData.emailSent = false;
  }

    const templatePath = path.join(templatesDir, 'order_template.xlsx');
    
    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({ error: '模板檔案不存在' });
    }
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);
    
    // 清除具名範圍
    try {
      if (workbook.definedNames) {
        workbook.definedNames.removeAllNames();
      }
    } catch (e) {
      console.log('⚠️ 無具名範圍需要清除');
    }
    
    // ============ 填入「訂購單」工作表 ============
    const sheet1 = workbook.getWorksheet('訂購單');
    
    if (orderData.customerPO) sheet1.getCell('B4').value = orderData.customerPO;
    if (orderData.salesPerson) sheet1.getCell('E4').value = orderData.salesPerson;
    sheet1.getCell('B5').value = orderId;
    sheet1.getCell('E5').value = new Date().toLocaleDateString('zh-TW');
    
    if (orderData.organization) sheet1.getCell('B7').value = orderData.organization;
    if (orderData.principalInvestigator) sheet1.getCell('D7').value = orderData.principalInvestigator;
    if (orderData.contactPerson) sheet1.getCell('G7').value = orderData.contactPerson;
    if (orderData.contactPhone) sheet1.getCell('I7').value = orderData.contactPhone;
    if (orderData.address) sheet1.getCell('B8').value = orderData.address;
    if (orderData.email) sheet1.getCell('G8').value = orderData.email;
    
    if (orderData.invoiceTitle) sheet1.getCell('C9').value = orderData.invoiceTitle;
    if (orderData.taxId) sheet1.getCell('C10').value = orderData.taxId;
    if (orderData.invoiceCopies) sheet1.getCell('C11').value = orderData.invoiceCopies;
    
    if (orderData.dataDeliveryMethod) sheet1.getCell('C12').value = orderData.dataDeliveryMethod;
    if (orderData.nchcAccount) sheet1.getCell('C13').value = orderData.nchcAccount;
    if (orderData.deliveryAddress) sheet1.getCell('C14').value = orderData.deliveryAddress;
    if (orderData.recipient) sheet1.getCell('C15').value = orderData.recipient;
    if (orderData.recipientPhone) sheet1.getCell('C16').value = orderData.recipientPhone;
    if (orderData.recipientEmail) sheet1.getCell('C17').value = orderData.recipientEmail;
    
    sheet1.getCell('I1').value = orderData.isUrgent ? '急件' : '正常單';
    
    // ⭐⭐⭐ 服務品項（修正版：自動複製格式）⭐⭐⭐
    // ⭐⭐⭐ 服務品項（修正版：加入序號）⭐⭐s⭐
    const serviceTemplateRow = 22;
    let currentRow = serviceTemplateRow;
    let serviceIndex = 1;

    orderData.serviceItems.forEach((item) => {
      item.services.forEach((service) => {
        if (service.service) {
          if (serviceIndex === 1) {
            // 第一筆：直接用模板列
            // 不插入，只填值
          } else {
            // 之後的每一筆：在 currentRow 下插入新列 + 複製樣式
            const targetRow = currentRow + 1;
            insertRowWithStyle(sheet1, serviceTemplateRow, targetRow, 1, 3);
            currentRow = targetRow;
          }

          sheet1.getCell(`A${currentRow}`).value = serviceIndex;
          sheet1.getCell(`B${currentRow}`).value = service.service;
          sheet1.getCell(`C${currentRow}`).value = parseInt(service.quantity) || 0;

          serviceIndex++;
        }
      });
    }); // 👈 這邊一定要有

    console.log(`✅ 服務品項已寫入 ${serviceIndex - 1} 行`);
    const serviceRows = serviceIndex - 1;              // 真實服務筆數
    const extraRows = serviceRows > 0 ? serviceRows - 1 : 0;  // 多插入的列數  

    const rowSampleType     = 29 + extraRows;  // 樣本類型 / 保存方式
    const rowSampleCount    = 31 + extraRows;  // 樣本數 / 物種
    const rowSampleReturn   = 33 + extraRows;  // 是否退樣 / 運送方式
    const rowNotes          = 34 + extraRows;  // 備註    

    let sampleTypeValue = orderData.sampleType || '';
    if (sampleTypeValue === '其他' && orderData.sampleTypeOther) {
      sampleTypeValue = orderData.sampleTypeOther;
    }
    if (sampleTypeValue) sheet1.getCell(`B${rowSampleType}`).value = sampleTypeValue;

    let preservationValue = orderData.preservationMethod || '';
    if (preservationValue === '其他' && orderData.preservationMethodOther) {
      preservationValue = preservationValue.sampleTypeOther;
    }
    if (preservationValue) sheet1.getCell(`F${rowSampleType}`).value = preservationValue;

    if (orderData.sampleCount) {
      sheet1.getCell(`B${rowSampleCount}`).value = parseInt(orderData.sampleCount);
    }

    let speciesValue = orderData.species || '';
    if (speciesValue === '其他' && orderData.speciesOther) {
      speciesValue = orderData.speciesOther;
    }
    if (speciesValue) sheet1.getCell(`D${rowSampleCount}`).value = speciesValue;

    if (orderData.sampleReturn) {
      sheet1.getCell(`B${rowSampleReturn}`).value = orderData.sampleReturn;
    }

    let shippingValue = orderData.shippingMethod || '';
    if (shippingValue === '其他' && orderData.shippingMethodOther) {
      shippingValue = orderData.shippingMethodOther;
    }
    if (shippingValue) sheet1.getCell(`F${rowSampleReturn}`).value = shippingValue;

    if (orderData.notes) {
      sheet1.getCell(`B${rowNotes}`).value = orderData.notes;
    }
    
    // // 簽名插入
    // if (orderData.signature) {
    //   try {
    //     const base64Data = orderData.signature.replace(/^data:image\/\w+;base64,/, '');
    //     const imageBuffer = Buffer.from(base64Data, 'base64');
        
    //     const imageId = workbook.addImage({
    //       buffer: imageBuffer,
    //       extension: 'png',
    //     });
        
    //     sheet1.addImage(imageId, {
    //       tl: { col: 1, row: 36 },
    //       br: { col: 3.5, row: 39 },
    //       editAs: 'oneCell'
    //     });
        
    //     console.log('✅ 簽名圖片已插入');
    //   } catch (imgError) {
    //     console.error('❌ 簽名圖片插入失敗:', imgError);
    //   }
    // }
    
    // ============ 填入對應的樣本工作表 ============
    
    if (orderData.sampleType === 'Library') {
      const sheet3 = workbook.getWorksheet('Library');
      
      if (orderData.customerPO) sheet3.getCell('B4').value = orderData.customerPO;
      if (orderData.salesPerson) sheet3.getCell('E4').value = orderData.salesPerson;
      sheet3.getCell('B5').value = orderId;
      sheet3.getCell('E5').value = new Date().toLocaleDateString('zh-TW');
      if (orderData.organization) sheet3.getCell('B7').value = orderData.organization;
      if (orderData.principalInvestigator) sheet3.getCell('D7').value = orderData.principalInvestigator;
      if (orderData.contactPerson) sheet3.getCell('G7').value = orderData.contactPerson;
      if (orderData.contactPhone) sheet3.getCell('I7').value = orderData.contactPhone;
      
      if (orderData.libraryInfo && orderData.libraryInfo.concMethod) {
        sheet3.getCell('E11').value = orderData.libraryInfo.concMethod;
      }
      
      // ⭐⭐⭐ Library Sample Sheet（第一個表格）⭐⭐⭐
      if (orderData.libraryInfo && orderData.libraryInfo.sampleSheet) {
        const sampleSheetTemplateRow = 12;
        let currentRow = sampleSheetTemplateRow;

        orderData.libraryInfo.sampleSheet.forEach((row, idx) => {
          if (!row.sampleName) return;

          if (idx === 0) {
            // 用模板
          } else {
            const targetRow = currentRow + 1;
            insertRowWithStyle(sheet3, sampleSheetTemplateRow, targetRow, 1, 9);
            currentRow = targetRow;
          }

          sheet3.getCell(`A${currentRow}`).value = idx + 1;
          sheet3.getCell(`B${currentRow}`).value = row.sampleName;
          if (row.tubeLabel) sheet3.getCell(`C${currentRow}`).value = row.tubeLabel;
          if (row.conc) sheet3.getCell(`E${currentRow}`).value = row.conc;
          if (row.vol) sheet3.getCell(`F${currentRow}`).value = row.vol;
          if (row.ngsConc) sheet3.getCell(`G${currentRow}`).value = row.ngsConc;
          if (row.expectedSeq) sheet3.getCell(`H${currentRow}`).value = row.expectedSeq;
          if (row.note) sheet3.getCell(`I${currentRow}`).value = row.note;
        });

        console.log(`✅ Library Sample Sheet 已寫入 ${orderData.libraryInfo.sampleSheet.length} 行`);
      }
            
      // if (orderData.libraryInfo && orderData.libraryInfo.runConfig) {
      //   const config = orderData.libraryInfo.runConfig;
      //   if (config.sequencer) sheet3.getCell('C24').value = config.sequencer;
      //   if (config.read1Length) sheet3.getCell('C25').value = config.read1Length;
      //   #if (config.read2Length) sheet3.getCell('C26').value = config.read2Length;
      //   #if (config.phiX) sheet3.getCell('C27').value = config.phiX;
      // }
      
// ⭐⭐⭐ Library Sample Sheet（第二個表格）⭐⭐⭐
if (orderData.libraryInfo && orderData.libraryInfo.librarySampleSheet) {
  let librarySampleSheetTemplateRow = null;        
  
  sheet3.eachRow((row, rowNumber) => {
    const cellValue = row.getCell(1).value;
    if (cellValue && cellValue.toString().includes('5. Library Sample Sheet')) {
      librarySampleSheetTemplateRow = rowNumber + 4;
      return false;
    }
  });
  
  if (!librarySampleSheetTemplateRow) {
    console.warn('⚠️ 未找到 "5. Library Sample Sheet" 標題，使用預設行號 40');
    librarySampleSheetTemplateRow = 40;
  }

  let currentRow = librarySampleSheetTemplateRow;

  orderData.libraryInfo.librarySampleSheet.forEach((row, idx) => {
    if (!row.sampleName) return;

    if (idx === 0) {
      // 第一列：用模板本身
    } else {
      const targetRow = currentRow + 1;
      insertRowWithStyle(sheet3, librarySampleSheetTemplateRow, targetRow, 1, 10);  // 🔑 改回 10
      currentRow = targetRow;
    }
    
    sheet3.getCell(`A${currentRow}`).value = idx + 1;
    sheet3.getCell(`B${currentRow}`).value = row.sampleName;
    if (row.libraryPrepKit) sheet3.getCell(`C${currentRow}`).value = row.libraryPrepKit;
    if (row.indexAdapterKit) sheet3.getCell(`D${currentRow}`).value = row.indexAdapterKit;
    if (row.setWellPosition) sheet3.getCell(`E${currentRow}`).value = row.setWellPosition;
    if (row.index1Seq) sheet3.getCell(`F${currentRow}`).value = row.index1Seq;
    if (row.index2Seq) sheet3.getCell(`G${currentRow}`).value = row.index2Seq;
    if (row.note) sheet3.getCell(`H${currentRow}`).value = row.note;
    if (row.library) sheet3.getCell(`I${currentRow}`).value = row.library;
    
    
    console.log(`🔍 第 ${idx + 1} 行:`, {
      sampleName: row.sampleName,
      library: row.library,
      tubeName: row.tubeName,
      hasTubeName: !!row.tubeName
    });
    
    if (row.tubeName) {
      sheet3.getCell(`J${currentRow}`).value = row.tubeName;  // 🔑 只写 J 欄
      console.log(`✅ 已寫入 J${currentRow} = ${row.tubeName}`);
    } else {
      console.log(`⚠️ 第 ${idx + 1} 行沒有 tubeName`);
    }
  });
  
  console.log(`✅ Library Sample Sheet (第二表) 已寫入 ${orderData.libraryInfo.librarySampleSheet.length} 行`);
}  
    } else if (orderData.sampleType !== '無送樣') {
      const sheet2 = workbook.getWorksheet('Cell Blood DNA RNA');
      
      if (orderData.customerPO) sheet2.getCell('B4').value = orderData.customerPO;
      if (orderData.salesPerson) sheet2.getCell('E4').value = orderData.salesPerson;
      sheet2.getCell('B5').value = orderId;
      sheet2.getCell('E5').value = new Date().toLocaleDateString('zh-TW');
      if (orderData.organization) sheet2.getCell('B7').value = orderData.organization;
      if (orderData.principalInvestigator) sheet2.getCell('D7').value = orderData.principalInvestigator;
      if (orderData.contactPerson) sheet2.getCell('F7').value = orderData.contactPerson;
      if (orderData.contactPhone) sheet2.getCell('H7').value = orderData.contactPhone;
      
      if (orderData.sampleInfo && orderData.sampleInfo.concMethod) {
        sheet2.getCell('E11').value = orderData.sampleInfo.concMethod;
      }
      
      // ⭐⭐⭐ Sample Sheet（DNA/RNA/Cell/Blood）⭐⭐⭐
      if (orderData.sampleInfo && orderData.sampleInfo.sampleSheet) {
        const sampleSheetTemplateRow = 12;
        let currentRow = sampleSheetTemplateRow;

        orderData.sampleInfo.sampleSheet.forEach((row, idx) => {
          if (!row.sampleName) return;

          if (idx === 0) {
            // 第一列：直接用模板
          } else {
            const targetRow = currentRow + 1;
            insertRowWithStyle(sheet2, sampleSheetTemplateRow, targetRow, 1, 10);
            currentRow = targetRow;
          }

          sheet2.getCell(`A${currentRow}`).value = idx + 1;
          sheet2.getCell(`B${currentRow}`).value = row.sampleName;
          if (row.tubeLabel) sheet2.getCell(`C${currentRow}`).value = row.tubeLabel;
          if (row.expectedSeq) sheet2.getCell(`D${currentRow}`).value = row.expectedSeq;
          if (row.conc) sheet2.getCell(`E${currentRow}`).value = row.conc;
          if (row.vol) sheet2.getCell(`F${currentRow}`).value = row.vol;
          if (row.ratio260280) sheet2.getCell(`G${currentRow}`).value = row.ratio260280;
          if (row.ratio260230) sheet2.getCell(`H${currentRow}`).value = row.ratio260230;
          if (row.dqnRqn) sheet2.getCell(`I${currentRow}`).value = row.dqnRqn;
          if (row.note) sheet2.getCell(`J${currentRow}`).value = row.note;
        });

        console.log(`✅ Sample Sheet 已寫入 ${orderData.sampleInfo.sampleSheet.length} 行`);
      }
      
      if (orderData.sampleInfo && orderData.sampleInfo.runConfig) {
        const config = orderData.sampleInfo.runConfig;
        if (config.sequencer) sheet2.getCell('C24').value = config.sequencer;
        if (config.read1Length) sheet2.getCell('C25').value = config.read1Length;
        if (config.read2Length) sheet2.getCell('C26').value = config.read2Length;
        if (config.phiX) sheet2.getCell('C27').value = config.phiX;
      }
    }
    
    const buffer = await workbook.xlsx.writeBuffer();
    
    // ============ 發送確認郵件 ============
    if (!orderData.emailSent) {    
    if (transporter && emailConfig) {
      try {
        const emailAddresses = [];
        
        // 1. 订单内的客户邮箱
        if (orderData.email && typeof orderData.email === 'string') {
          emailAddresses.push(orderData.email);
          console.log(`📧 客户邮箱: ${orderData.email}`);
        }
        
        if (orderData.recipientEmail && 
            typeof orderData.recipientEmail === 'string' && 
            orderData.recipientEmail !== orderData.email) {
          emailAddresses.push(orderData.recipientEmail);
          console.log(`📧 收件人邮箱: ${orderData.recipientEmail}`);
        }
        
        // 2. 固定收件人邮箱
        if (emailConfig.fixedRecipients && Array.isArray(emailConfig.fixedRecipients)) {
          emailConfig.fixedRecipients.forEach(email => {
            if (email && typeof email === 'string') {
              emailAddresses.push(email);
              console.log(`📧 固定收件人: ${email}`);
            } else if (email) {
              console.log(`⚠️ 跳过无效的固定收件人:`, email, typeof email);
            }
          });
        }
        
        // 3. 根据业务人员姓名或代码查找邮箱
        let salesPerson = null;
        if (orderData.salesPerson) {
          salesPerson = getSalesEmail(orderData.salesPerson);
          if (salesPerson && salesPerson.email && typeof salesPerson.email === 'string') {
            emailAddresses.push(salesPerson.email);
            console.log(`📧 業務: ${salesPerson.name} (${salesPerson.code}) - ${salesPerson.email}`);
          } else if (salesPerson) {
            console.log(`⚠️ 业务人员邮箱无效:`, salesPerson);
          }
        }
        
        // 🔑 測試 => 確認所有的mails
        console.log(`🔍 Mail List (共 ${emailAddresses.length} 个):`);
        emailAddresses.forEach((email, idx) => {
          console.log(`   [${idx}] ${typeof email}: ${email}`);
        });
        
        // 取Unique Maile
        const uniqueEmails = [...new Set(emailAddresses)]
          .filter(email => {
            // 确保是字符串类型
            if (typeof email !== 'string') {
              console.log(`⚠️ Email 格式確認 (${typeof email}):`, email);
              return false;
            }
            // 检查是否为有效邮箱
            const isValid = email && email.trim() && email.includes('@');
            if (!isValid) {
              console.log(`⚠️ 跳过无效邮箱:`, email);
            }
            return isValid;
          });
        
        if (uniqueEmails.length > 0) {
          
          uniqueEmails.forEach(email => console.log(`   ✉️  ${email}`));
          
          const mailOptions = {
            from: `"${emailConfig.sender.name}" <${emailConfig.sender.email}>`,
            to: uniqueEmails.join(', '),
            subject: `TGIA 訂單需求 - ${orderId} - ${orderData.organization || '-'} - ${orderData.principalInvestigator || '-'}`,
            html: `
              <div style="font-family: 'Microsoft JhengHei', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">TGIA 訂購需求確認</h1>
                  <p style="color: #e0e7ff; margin: 10px 0 0 0;">Taiwan Genomics Institute Alliance</p>
                </div>
                
              
                <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
                  <p style="color: #374151; font-size: 16px; line-height: 1.6;">您好，</p>
                  
                  <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                    感謝您的信任！您的服務需求單已成功建立，詳細資訊如下：
                  </p>
                  
                  <!-- 订单信息卡片 -->
                  <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3b82f6;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 120px;">需求編號</td>
                        <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: bold;">${orderId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">機構名稱</td>
                        <td style="padding: 8px 0; color: #111827; font-size: 14px;">${orderData.organization || '-'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">計畫主持人</td>
                        <td style="padding: 8px 0; color: #111827; font-size: 14px;">${orderData.principalInvestigator || '-'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">聯絡人</td>
                        <td style="padding: 8px 0; color: #111827; font-size: 14px;">${orderData.contactPerson || '-'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">聯絡電話</td>
                        <td style="padding: 8px 0; color: #111827; font-size: 14px;">${orderData.contactPhone || '-'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">樣品類型</td>
                        <td style="padding: 8px 0; color: #111827; font-size: 14px;">${orderData.sampleType || '-'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">送樣數量</td>
                        <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: bold; color: #3b82f6;">${orderData.sampleCount || 0} </td>
                      </tr>
                      ${salesPerson ? `
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">業務代表</td>
                        <td style="padding: 8px 0; color: #111827; font-size: 14px;">${salesPerson.name} (${salesPerson.code})</td>
                      </tr>
                      ` : ''}
                    </table>
                  </div>
                  
                  <!-- 附件提示 -->
                  <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b;">
                    <p style="margin: 0; color: #92400e; font-size: 14px;">
                      <span style="font-size: 20px; margin-right: 10px;">📎</span>
                      <strong>訂單詳細資料請參閱附件 Excel 檔案</strong>
                    </p>
                  </div>
                  
                  <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 25px;">
                    如有任何問題，歡迎隨時與我們聯繫。
                  </p>
                  
                  ${salesPerson ? `
                  <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-top: 25px;">
                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px;">您的專屬業務代表：</p>
                    <p style="margin: 0; color: #111827; font-size: 14px;">
                      <strong>${salesPerson.name}</strong><br>
                      📧 ${salesPerson.email}<br>
                      📱 ${salesPerson.phone}
                    </p>
                  </div>
                  ` : ''}
                </div>
                
                <!-- 页脚 -->
                <div style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none; text-align: center;">
                  <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px 0;">
                    此為系統自動發送的郵件，請勿直接回覆
                  </p>
                  <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                    © ${new Date().getFullYear()} Taiwan Genomics Institute Alliance (TGIA)<br>
                    All rights reserved.
                  </p>
                </div>
              </div>
            `,
            attachments: [
              {
                filename: `TGIA_Order_${orderId}.xlsx`,
                content: buffer,
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              }
            ]
          };
          
          await transporter.sendMail(mailOptions);
          console.log(`✅ 信件成功發送 ${uniqueEmails.length} 位收件人`);
          orderData.emailSent = true;
          fs.writeFileSync(orderFile, JSON.stringify(orderData, null, 2));
          console.log(`✅ 已更新 emailSent 標記為 true (${orderId})`);          
        } else {
          console.log('⚠️ 沒有有效信箱');
        }
      } catch (emailError) {
        console.error('❌ 發送失敗:', emailError.message);
        console.error('   失敗原因:', emailError);
        
      }
    } else {
      console.log('⚠️ 郵件功能異常');
    }
} else {
  console.log(`⚠️ 訂單 ${orderId} 已經寄過信，這次只提供 Excel 下載，不再重寄`);
}    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=TGIA_Order_${orderId}.xlsx`);
    res.send(buffer);
    
    console.log(`📥 Excel已匯出: ${orderId}`);
  } catch (error) {
    console.error('❌ 匯出失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 後端服務器運行於 http://0.0.0.0:${PORT}`);
  console.log(`🌐 外部訪問: http://192.168.60.62:${PORT}`);
  console.log(`📁 訂單儲存位置: ${ordersDir}`);
  console.log(`📋 Excel模板位置: ${templatesDir}`);
});