import React, { useState, useRef } from 'react';
import { AlertCircle, Download, Send, Plus, Edit3, Check, X, RotateCcw, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import productLineData from './product_line.json'; // 直接 import
import units   from './units.json'; // 直接 import
import salesCodes from './sales_codes.json';
import customerCodes from './customer_codes.json';
// ========== 簽名板組件 ==========
const SignaturePad = ({ onSave, onCancel, title = "請簽名" }) => {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [context, setContext] = useState(null);
  const [uploadMode, setUploadMode] = useState('draw');

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    
    const ctx = canvas.getContext('2d');
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setContext(ctx);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    setIsEmpty(false);
    const { x, y } = getCoordinates(e);
    context.beginPath();
    context.moveTo(x, y);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(false);
    context.closePath();
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, rect.width, rect.height);
    setIsEmpty(true);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          const rect = canvas.getBoundingClientRect();
          context.fillStyle = '#FFFFFF';
          context.fillRect(0, 0, rect.width, rect.height);
          
          const scale = Math.min(rect.width / img.width, rect.height / img.height);
          const x = (rect.width - img.width * scale) / 2;
          const y = (rect.height - img.height * scale) / 2;
          
          context.drawImage(img, x, y, img.width * scale, img.height * scale);
          setIsEmpty(false);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const saveSignature = () => {
    if (isEmpty) {
      alert('請先簽名或上傳圖片');
      return;
    }
    const canvas = canvasRef.current;
    const signatureData = canvas.toDataURL('image/png');
    onSave(signatureData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setUploadMode('draw')}
              className={`flex-1 py-2 px-4 rounded-lg transition ${
                uploadMode === 'draw' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Edit3 size={16} className="inline mr-2" />
              手寫簽名
            </button>
            <button
              onClick={() => setUploadMode('upload')}
              className={`flex-1 py-2 px-4 rounded-lg transition ${
                uploadMode === 'upload' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Upload size={16} className="inline mr-2" />
              上傳圖片
            </button>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full touch-none cursor-crosshair"
              style={{ height: '300px' }}
              onMouseDown={uploadMode === 'draw' ? startDrawing : undefined}
              onMouseMove={uploadMode === 'draw' ? draw : undefined}
              onMouseUp={uploadMode === 'draw' ? stopDrawing : undefined}
              onMouseLeave={uploadMode === 'draw' ? stopDrawing : undefined}
              onTouchStart={uploadMode === 'draw' ? startDrawing : undefined}
              onTouchMove={uploadMode === 'draw' ? draw : undefined}
              onTouchEnd={uploadMode === 'draw' ? stopDrawing : undefined}
            />
          </div>
          
          {uploadMode === 'draw' ? (
            <p className="text-sm text-gray-500 mt-2 text-center">
              💡 提示：使用滑鼠、觸控筆或手指在上方區域簽名
            </p>
          ) : (
            <div className="mt-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition text-blue-600 font-medium"
              >
                <Upload size={20} className="inline mr-2" />
                點擊選擇圖片檔案
              </button>
              <p className="text-sm text-gray-500 mt-2 text-center">
                支援 JPG、PNG 等圖片格式
              </p>
            </div>
          )}
        </div>
        
        <div className="border-t px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={clearSignature}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
          >
            <RotateCcw size={18} />
            清除
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            取消
          </button>
          <button
            onClick={saveSignature}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Check size={18} />
            確認簽名
          </button>
        </div>
      </div>
    </div>
  );
};

// ========== 步驟進度條組件 ==========

const validateEmail = (emailString) => {
  if (!emailString || !emailString.trim()) return false;
  

  const emails = emailString.split(/[,;]/).map(e => e.trim()).filter(e => e);
  

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return emails.length > 0 && emails.every(email => emailRegex.test(email));
};

const StepIndicator = ({ currentStep, steps }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${
                index + 1 < currentStep 
                  ? 'bg-green-500 text-white' 
                  : index + 1 === currentStep 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {index + 1 < currentStep ? <Check size={20} /> : index + 1}
              </div>
              <p className={`text-xs mt-2 text-center ${
                index + 1 === currentStep ? 'text-blue-600 font-semibold' : 'text-gray-500'
              }`}>
                {step}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div className={`h-1 flex-1 mx-2 transition ${
                index + 1 < currentStep ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// ========== 主表單組件 ==========
const TGIAOrderForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showOrgSuggestions, setShowOrgSuggestions] = useState(false);
  const [filteredOrgs, setFilteredOrgs] = useState([]);
  const [exportReady, setExportReady] = useState(false);
  // 🆕 Sample_Name 清理函數：只保留英文、數字、_、,、-
  const sanitizeSampleName = (name) => {
    if (!name) return '';
    return String(name).replace(/[^a-zA-Z0-9_,-]/g, '');
  };

  const [searchableDropdown, setSearchableDropdown] = useState({
    isOpen: false,
    searchTerm: '',
    activeIndex: null,
    targetKey: '' // 用來識別是哪個下拉選單
  });  
  
  const [isDragging, setIsDragging] = useState(false);
  // 🆕 拖拉處理函數（放在 handleExcelUpload 前面）
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // 檢查檔案類型
      if (!file.name.match(/\.(xlsx|xls)$/i)) {
        alert('請上傳 Excel 檔案 (.xlsx 或 .xls)');
        return;
      }
      
      // 建立一個假的 event 物件來呼叫現有的 handleExcelUpload
      const fakeEvent = {
        target: {
          files: [file],
          value: ''
        }
      };
      
      handleExcelUpload(fakeEvent);
    }
  };  
  const steps = ['基本驗證', '基本資訊', '委託內容', '送測樣品', '簽名確認', '預覽提交'];
  
  // const organizationOptions = [
  //   '國立陽明交通大學',
  //   '國立台灣大學',
  //   '國立成功大學'
  // ];
  const organizationOptions = units.organizations || units;
  
  const salesPersonOptions = [
    '請選擇業務人員',
    '施秉宏',
    '黃懷慧',
    '梁詩萍'
  ];

  const [formData, setFormData] = useState({
    salesCode: '',
    customerCode: '',    
    salesPerson: '',
    organization: '',
    principalInvestigator: '',
    contactPerson: '',
    contactPhone: '',
    email: '',
    address: '',
    invoiceTitle: '',
    taxId: '',
    invoiceCopies: '二聯式',
    dataDeliveryMethod: 'HDD由專人遞送',
    nchcAccount: '',
    deliveryAddress: '',
    recipient: '',
    recipientPhone: '',
    recipientEmail: '',
    isUrgent: false,  // 是否為急件，預設 false (正常件)
    sampleReturn: '不需要',  // 樣品返還，預設「不需要」    
    selectedServiceCategories: [],
    serviceItems: [{
      category: '請選擇服務類別',
      services: [{ service: '', quantity: '' }],
      libraryType: '無',
      seqSpec: ''
    }],
    sampleType: '無送樣',
    sampleTypeOther: '',
    libraryInfo: {
      concMethod: '',
      sampleSheet: [{
        no: 1,
        sampleName: '',
        tubeLabel: '',
        conc: '',
        vol: '',
        ngsConc: '',
        expectedSeq: '',
        note: ''
      }],
      runConfig: {
        sequencer: '不限',
        read1Length: '151bp',
        read2Length: '151bp',
        phiX: '1%'
      },
      librarySampleSheet: [{
        no: 1,
        sampleName: '',
        libraryPrepKit: '',
        indexAdapterKit: '',
        setWellPosition: '',
        index1Seq: '',
        index2Seq: '',
        note: '',
        library: ''
      }],
      gelImage: ''
    },
    sampleInfo: {
      concMethod: '',
      sampleSheet: [{
        no: 1,
        sampleName: '',
        tubeLabel: '',
        expectedSeq: '',
        conc: '',
        vol: '',
        ratio260280: '',
        ratio260230: '',
        dqnRqn: '',
        note: ''
      }]
    },
    preservationMethod: 'Nuclease-free H2O',
    preservationMethodOther: '',
    sampleCount: '',
    species: '物種請選擇',
    speciesOther: '',
    shippingMethod: '冷凍(乾冰)',
    shippingMethodOther: '',
    notes: '',
    signature: null
  });
// // 🆕 新增：客戶代碼驗證狀態
// const [customerCodeInput, setCustomerCodeInput] = useState('');
// const [customerCodeStatus, setCustomerCodeStatus] = useState('idle'); // 'idle' | 'checking' | 'valid' | 'invalid'
// const [customerInfo, setCustomerInfo] = useState(null);


  // 🆕 處理業務代碼選擇（保持不變）
  // 🆕 處理業務代碼輸入（即時檢查）
  const handleSalesCodeChange = (code) => {
    const upperCode = code.toUpperCase();
    const foundSales = salesCodes.find(s => s.code === upperCode);
    
    setFormData(prev => ({
      ...prev,
      salesCode: upperCode,
      salesPerson: foundSales ? foundSales.name : ''
    }));
  };

  // 🆕 處理客戶代碼輸入（即時檢查）
  const handleCustomerCodeChange = (code) => {
    if (!code.trim()) {
      setFormData(prev => ({ ...prev, customerCode: '' }));
      setMessage('');
      return;
    }
    
    const upperCode = code.toUpperCase();
    const foundCustomer = customerCodes.find(c => c.code === upperCode);
    
    if (foundCustomer) {
      setFormData(prev => ({
        ...prev,
        customerCode: upperCode,
        organization: foundCustomer.organization || '',
        principalInvestigator: foundCustomer.principalInvestigator || '',
        contactPerson: foundCustomer.contactPerson || '',
        contactPhone: foundCustomer.contactPhone || '',
        email: foundCustomer.email || '',
        address: foundCustomer.address || '',
        invoiceTitle: foundCustomer.invoiceTitle || '',
        taxId: foundCustomer.taxId || ''
      }));
      setMessage(`✓ 已帶入客戶資訊：${foundCustomer.organization}`);
      setTimeout(() => setMessage(''), 2000);
    } else {
      setFormData(prev => ({ ...prev, customerCode: upperCode }));
      setMessage('❌ 查無此客戶代碼，請在下一步手動填寫資訊');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // 🆕 清除客戶代碼
  // const handleCustomerCodeClear = () => {
  //   setCustomerCodeInput('');
  //   setCustomerCodeStatus('idle');
  //   setCustomerInfo(null);
    
  //   setFormData(prev => ({
  //     ...prev,
  //     customerCode: '',
  //     // 可選：是否要清除已帶入的資訊
  //     // organization: '',
  //     // principalInvestigator: '',
  //     // ...
  //   }));
    
  //   setMessage('已清除客戶代碼');
  //   setTimeout(() => setMessage(''), 2000);
  // };

  // // 🆕 處理 Enter 鍵驗證
  // const handleCustomerCodeKeyPress = (e) => {
  //   if (e.key === 'Enter') {
  //     handleCustomerCodeVerify();
  //   }
  // };


  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const [orderId, setOrderId] = useState('');
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteMode, setPasteMode] = useState('sampleSheet');
  const [pasteData, setPasteData] = useState('');
  const excelUploadRef = useRef(null);


  // 🆕 加入離開頁面警示
  React.useEffect(() => {
    // 只在表單有資料且尚未提交時警告
    const hasData = 
      formData.organization || 
      formData.contactPerson || 
      formData.email ||
      formData.selectedServiceCategories.length > 0;
    
    const handleBeforeUnload = (e) => {
      // 如果已提交或沒有資料，不顯示警告
      if (submitted || !hasData) {
        return;
      }
      
      // 標準的離開確認訊息
      e.preventDefault();
      e.returnValue = ''; // Chrome 需要設定 returnValue
      
      // 某些瀏覽器會顯示這個訊息，但大多數現代瀏覽器會顯示預設訊息
      return '您尚未完成訂單提交，離開此頁面將會遺失所有填寫的資料。確定要離開嗎？';
    };
    
    // 註冊事件監聽器
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // 清除事件監聽器
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [formData, submitted]); // 當 formData 或 submitted 改變時重新註冊

  const availableServiceCategories = [
    { id: 'qc', label: 'QC (Q)', value: 'QC (Q)' },
    { id: 'eq', label: '萃取/QC (EQ)', value: '萃取/QC (EQ)' },
    { id: 'library', label: '建庫服務 (L)', value: '建庫服務 (L)' },
    { id: 'sequencing', label: '定序服務 (S)', value: '定序服務 (S)' },
    { id: 'analysis', label: '分析服務 (A)', value: '分析服務 (A)' },
    { id: 'package', label: '套組產品 (AP)', value: '套組產品 (AP)' }
  ];


  // 1️⃣ 在開頭加入定序量對照表
  const sequencingDataMap = {
    'S-G000 二代定序 - 定序量購買':1, // 每 GB 計算
    'S-LN01 二代定序 - NoveSeq 6000, S4 包Lane 定序': 600,
    'S-LN02 二代定序 - NovaSeq X Plus, 10B 包Lane 定序': 350,
    'S-LN03 二代定序 - NovaSeq X Plus, 25B 包Lane 定序': 1000,
    'S-FC01 二代定序 - NoveSeq 6000, SP 包Run 定序': 0, // 需要補充
    'S-FC02 二代定序 - NovaSeq X Plus, 1.5B (100cycle) 包 Run 定序': 0 // 需要補充
  };

// 2️⃣ 加入計算函數
const calculateTotalSequencing = () => {
  let total = 0;
  formData.serviceItems.forEach(item => {
    if (item.category === '定序服務 (S)') {
      item.services.forEach(service => {
        const gbPerUnit = sequencingDataMap[service.service] || 0;
        const quantity = parseInt(service.quantity) || 0;
        total += gbPerUnit * quantity;
      });
    }
  });
  return total;
};


const calculateExpectedSequencing = () => {
  let total = 0;
  
  if (formData.sampleType === 'Library') {
    // Library: 計算 sampleSheet 的預期定序量
    formData.libraryInfo.sampleSheet.forEach(row => {
      const expectedSeq = parseFloat(row.expectedSeq) || 0;
      total += expectedSeq;
    });
  } else if (formData.sampleType !== '無送樣') {
    // Sample (DNA/RNA/Cell/Blood): 計算 sampleInfo.sampleSheet 的預期定序量
    formData.sampleInfo.sampleSheet.forEach(row => {
      const expectedSeq = parseFloat(row.expectedSeq) || 0;
      total += expectedSeq;
    });
  }
  
  return total;
};
// 🆕 1️⃣ 加入計算樣本數量的函數（放在 calculateExpectedSequencing 下方）
const calculateSampleCount = () => {
  let count = 0;
  
  if (formData.sampleType === 'Library') {
    // Library: 計算第一個 Sample Sheet 中有 sampleName 的行數
    count = formData.libraryInfo.sampleSheet.filter(row => 
      row.sampleName && row.sampleName.trim() !== ''
    ).length;
  } else if (formData.sampleType !== '無送樣') {
    // Sample (DNA/RNA/Cell/Blood): 計算 sampleSheet 中有 sampleName 的行數
    count = formData.sampleInfo.sampleSheet.filter(row => 
      row.sampleName && row.sampleName.trim() !== ''
    ).length;
  }
  
  return count;
};

// 🆕 2️⃣ 加入自動更新樣本數量的函數
const autoFillSampleCount = () => {
  const count = calculateSampleCount();
  setFormData(prev => ({ ...prev, sampleCount: count }));
  setMessage(`已自動計算：${count} 個樣本`);
  setTimeout(() => setMessage(''), 2000);
};
  const serviceCategories = [
    '請選擇服務類別',
    'QC (Q)',
    '萃取/QC (EQ)',
    '定序服務 (S)',
    '建庫服務 (L)',
    '分析服務 (A)',
    '套組產品 (AP)'
  ];
const serviceOptionsByCategory = productLineData;

// const serviceOptionsByCategory = {
//   '定序服務 (S)': [
//     { 
//       value: 'S-0000 無定序', 
//       description: '不進行定序服務' 
//     },
//     { 
//       value: 'S-G000 二代定序 - 定序量購買', 
//       description: '依實際需求購買定序數據量，彈性計價' 
//     },
//     { 
//       value: 'S-LN01 二代定序 - NoveSeq 6000, S4 包Lane 定序', 
//       description: 'NovaSeq 6000 平台，S4 flowcell，約 2-2.5B reads per lane，適合中大型專案' 
//     },
//     { 
//       value: 'S-LN02 二代定序 - NovaSeq X Plus, 10B 包Lane 定序', 
//       description: 'NovaSeq X Plus 平台，10B reads per lane，高通量定序' 
//     },
//     { 
//       value: 'S-LN03 二代定序 - NovaSeq X Plus, 25B 包Lane 定序', 
//       description: 'NovaSeq X Plus 平台，25B reads per lane，超高通量定序' 
//     },
//     { 
//       value: 'S-FC01 二代定序 - NoveSeq 6000, SP 包Run 定序', 
//       description: 'NovaSeq 6000 平台，SP flowcell 整片定序，約 800M-1.3B reads' 
//     },
//     { 
//       value: 'S-FC02 二代定序 - NovaSeq X Plus, 1.5B (100cycle) 包 Run 定序', 
//       description: 'NovaSeq X Plus 平台，1.5B reads，100 cycle，適合小型專案' 
//     },
//     { 
//       value: 'S-OS01 三代定序 - Pacbio, Sequel IIe 包片定序', 
//       description: 'PacBio Sequel IIe 平台，HiFi 長讀長定序，適合基因體組裝' 
//     },
//     { 
//       value: 'S-OS02 三代定序 - Pacbio, Revio 包片定序', 
//       description: 'PacBio Revio 平台，最新一代 HiFi 定序，高通量長讀長' 
//     },
//     { 
//       value: 'S-OS03 三代定序 - Pacbio, 16S rDNA定序', 
//       description: 'PacBio 16S rRNA 全長定序，微生物群落分析' 
//     }
//   ],
//   'QC (Q)': [
//     { value: 'Q-QC01 DNA QC', description: 'Qubit 濃度測定 + Nanodrop 純度檢測 + 膠體電泳完整性分析' },
//     { value: 'Q-QC02 DNA QC(PacBio)', description: 'PacBio 專用 DNA QC，含高分子量 DNA 完整性評估' },
//     { value: 'Q-QC03 RNA QC', description: 'Qubit 濃度測定 + Bioanalyzer RIN 值檢測' },
//     { value: 'Q-QC04 RNA QC(PacBio)', description: 'PacBio 專用 RNA QC，含 RNA 完整性評估' },
//     { value: 'Q-QC05 Library QC', description: 'Library 濃度測定 + Bioanalyzer 片段大小分析' },
//     { value: 'Q-QC06 Library QC(PacBio)', description: 'PacBio Library QC，含 SMRTbell 完整性檢測' }
//   ],
//   '萃取/QC (EQ)': [
//     { value: 'Q-ED01 DNA萃取+QC - 血液、Buffy coat DNA萃取', description: '從全血或 Buffy coat 萃取基因體 DNA，含 QC' },
//     { value: 'Q-ED02 DNA萃取+QC - 細胞 DNA萃取', description: '從培養細胞萃取基因體 DNA，含 QC' },
//     { value: 'Q-ED03 DNA萃取+QC - 組織 DNA萃取', description: '從新鮮或冷凍組織萃取基因體 DNA，含 QC' },
//     { value: 'Q-ED04 DNA萃取+QC - 石蠟包埋 (FFPE) DNA萃取', description: '從 FFPE 組織萃取 DNA，含 QC' },
//     { value: 'Q-ED05 DNA萃取+QC - 血清(漿) cfDNA萃取', description: '從血漿或血清萃取游離 DNA (cfDNA)，含 QC' },
//     { value: 'Q-ER01A RNA萃取+QC - 血液 RNA萃取 (Tempus 採血管)', description: '從 Tempus 採血管萃取 RNA，含 QC' },
//     { value: 'Q-ER01B RNA萃取+QC - 血液 RNA萃取 (PAXgene 採血管)', description: '從 PAXgene 採血管萃取 RNA，含 QC' },
//     { value: 'Q-ER02 RNA萃取+QC - 細胞 RNA萃取', description: '從培養細胞萃取 total RNA，含 QC' },
//     { value: 'Q-ER03 RNA萃取+QC - 組織 RNA萃取', description: '從新鮮或冷凍組織萃取 total RNA，含 QC' },
//     { value: 'Q-ER04 RNA萃取+QC - 石蠟包埋 (FFPE) RNA萃取', description: '從 FFPE 組織萃取 RNA，含 QC' },
//     { value: 'Q-ER05 RNA萃取+QC - 血清(漿) cfRNA萃取', description: '從血漿或血清萃取游離 RNA (cfRNA)，含 QC' }
//   ],
//   '建庫服務 (L)': [
//     { value: 'L-TA01 TAF 認證 - WGS, Illumina DNA PCR-Free Prep 建庫 (人類 DNA)', description: 'TAF 認證全基因體定序建庫，PCR-free 流程，人類 DNA 專用' },
//     { value: 'L-TA02 TAF 認證 - WES, Illumina DNA Prep with Enrichment, IDT v2 probe 建庫 (人類 DNA)', description: 'TAF 認證外顯子定序建庫，使用 IDT v2 probe，人類 DNA 專用' },
//     { value: 'L-WE01 WES - Roche, KAPA HyperPlus V1 建庫', description: 'KAPA HyperPlus V1 kit，適合 10ng-1μg DNA，需搭配 capture probe' },
//     { value: 'L-WE02 WES - Roche, KAPA HyperPlus V1 + mit 建庫', description: 'KAPA HyperPlus V1 + 粒線體富集，適合低覆蓋度需求' },
//     { value: 'L-WE03 WES - Roche, KAPA HyperPlus V2 建庫', description: 'KAPA HyperPlus V2 kit，適合 10ng-1μg DNA' },
//     { value: 'L-WE04 WES - Roche, KAPA EvoPlus V2 建庫', description: 'KAPA EvoPlus V2 kit，酶促建庫，適合降解 DNA' },
//     { value: 'L-WE05 WES - Roche, KAPA EvoPlus V2 + mit 建庫', description: 'KAPA EvoPlus V2 + 粒線體富集' },
//     { value: 'L-WE06 WES - QIAGEN, QIAseq Human Exome Kit 建庫', description: 'QIAGEN 外顯子建庫套組，含 capture probe' },
//     { value: 'L-WG01 WGS - Illumina, Illumina DNA PCR-Free Prep 建庫', description: 'PCR-free 建庫，適合高品質 DNA，減少 GC bias' },
//     { value: 'L-WG02 WMS - Illumina, Illumina DNA Prep 建庫', description: 'Tagmentation 快速建庫，適合一般基因體定序' },
//     { value: 'L-WG03 WGS - Roche, KAPA EvoPrep 建庫', description: 'KAPA EvoPrep 酶促建庫，適合降解或 FFPE DNA' },
//     { value: 'L-WG04 WGBS - IDT, xGen Methyl-Seq Library Prep 建庫', description: '全基因體甲基化定序建庫，含 bisulfite 轉換' },
//     { value: 'L-TS01 TSO500 - Illumina, TSO500 HT 建庫', description: 'TruSight Oncology 500 High-Throughput，腫瘤 523 基因 panel' },
//     { value: 'L-TS02 內部使用 - Illumina, TSO500 HT plus Velsera', description: 'TSO500 + Velsera 分析平台（內部使用）' },
//     { value: 'L-TS03 TSO500 - Illumina, TSO500 ctDNA v2 建庫', description: 'TSO500 ctDNA v2，循環腫瘤 DNA 檢測' },
//     { value: 'L-TS04 內部使用 - Illumina, TSO500 ctDNA v2 plus Velsera', description: 'TSO500 ctDNA + Velsera（內部使用）' },
//     { value: 'L-DN01 內部使用 - IDT, xGen ssDNA & Low-Input DNA Library Prep 建庫', description: '單股 DNA 或低量 DNA 建庫（內部使用）' },
//     { value: 'L-RN01 RNAseq - Illumina, Illumina Stranded mRNA 建庫', description: 'polyA 富集 mRNA 定序，保留鏈方向資訊' },
//     { value: 'L-RN02 RNAseq - Illumina, Illumina Stranded Total RNA Prep, Ligation with Ribo-Zero Plus 建庫', description: 'Total RNA 去除 rRNA，含非編碼 RNA' },
//     { value: 'L-RN03 RNAseq - Illumina, Illumina RNA Prep with Enrichment 建庫', description: 'RNA 建庫含富集功能，可搭配 panel' },
//     { value: 'L-RN04 RNAseq - Roche, KAPA mRNA HyperPrep 建庫', description: 'KAPA mRNA 建庫，polyA 富集' },
//     { value: 'L-RN05 RNAseq - Roche, KAPA RNA HyperPrep Kits with RiboErase (HMR) 建庫', description: 'KAPA RNA 去除 rRNA (Human/Mouse/Rat)' },
//     { value: 'L-RN06 RNAseq - Takara, SMART-Seq Stranded 建庫', description: 'SMART-Seq 全長轉錄本建庫，適合單細胞' },
//     { value: 'L-RN07 RNAseq - Takara, SMART-Seq mRNA LP 建庫', description: 'SMART-Seq 低投入量 mRNA 建庫' },
//     { value: 'L-RN08 RNAseq - QIAGEN, QIAseq miRNA Library Kit 建庫', description: 'miRNA 定序建庫，小片段 RNA' },
//     { value: 'L-PB01 PacBio - Human WGS with Standard Analysis', description: 'PacBio 人類全基因體定序，含標準分析' },
//     { value: 'L-PB02 PacBio - Human WGS with 5mC', description: 'PacBio 人類全基因體 + 5mC 甲基化檢測' },
//     { value: 'L-PB03 PacBio - De Novo Assembly-HiFi Reads (unknown)', description: 'PacBio HiFi 從頭組裝，物種未知' },
//     { value: 'L-PB04 PacBio - De Novo Assembly-HiFi Reads (unknown), with 5mC', description: 'PacBio HiFi 組裝 + 5mC 檢測' },
//     { value: 'L-PB05 PacBio - De Novo Assembly-CCS Reads (Microbial), 20 plex', description: 'PacBio 微生物組裝，20 樣本混合' },
//     { value: 'L-PB06 PacBio - PacBio CCS, Full Length 16S rRNA 8K Reads, 96 plex', description: 'PacBio 16S 全長定序，96 樣本混合' },
//     { value: 'L-OS01 10x - GEM-X Universal 5\' Gene Expression v3, 4 samples', description: '10x Genomics 5\' 單細胞基因表現，4 樣本' },
//     { value: 'L-OS02 10x - GEM-X Flex Gene Expression Mouse', description: '10x Flex 固定組織單細胞定序，小鼠' },
//     { value: 'L-OS03 10x - GEM-X Flex Gene Expression Human', description: '10x Flex 固定組織單細胞定序，人類' },
//     { value: 'L-OS04 10x - Visium HD, Mouse Transcriptome, 6.5 mm', description: '10x Visium HD 空間轉錄體，小鼠，6.5mm 捕獲區' },
//     { value: 'L-OS05 10x - Visium HD, Human Transcriptome, 6.5 mm', description: '10x Visium HD 空間轉錄體，人類，6.5mm 捕獲區' }
//   ],
//   '分析服務 (A)': [
//     { value: 'A101 1st - Non (不分析)', description: '不進行生資分析' },
//     { value: 'A102 1st - Fastq', description: '產出 Fastq 原始檔案' },
//     { value: 'A103 1st - BCL', description: '產出 BCL 原始檔案' },
//     { value: 'A104 1st - UMI', description: 'UMI 去重複分析' },
//     { value: 'A202 2nd - DRAGEN-Germline-XP', description: 'DRAGEN 加速運算平台，體細胞變異分析' },
//     { value: 'A203 2nd - DRAGEN-Somatic-XP', description: 'DRAGEN 加速運算平台，體細胞突變分析' },
//     { value: 'A204 2nd - RNAseq-Basic', description: 'RNA-Seq 基礎分析：比對、定量、QC' },
//     { value: 'A205 2nd - RNAseq-Advanced', description: 'RNA-Seq 進階分析：差異表現、GO/KEGG' },
//     { value: 'A206 2nd - TSO500-Tissue', description: 'TSO500 組織樣本分析報告' },
//     { value: 'A207 2nd - TSO500-ctDNA', description: 'TSO500 ctDNA 樣本分析報告' },
//     { value: 'A208 2nd - miRNA', description: 'miRNA 定序分析：比對、定量、目標基因預測' },
//     { value: 'A209 2nd - ChIPseq', description: 'ChIP-Seq 分析：peak calling、motif 分析' },
//     { value: 'A210 2nd - CellRanger', description: '10x Genomics Cell Ranger 標準分析' },
//     { value: 'A211 2nd - SpaceRanger', description: '10x Visium Space Ranger 空間分析' },
//     { value: 'A212 2nd - scRNAseq-Standard', description: '單細胞 RNA-Seq 標準分析' },
//     { value: 'A213 2nd - CeleScope', description: 'CeleScope 單細胞分析平台' },
//     { value: 'A214 2nd - PacBio-16S', description: 'PacBio 16S 微生物群落分析' },
//     { value: 'A215 2nd - PacBio-HumanWGS', description: 'PacBio 人類全基因體分析' },
//     { value: 'A216 2nd - Transcriptome-de-novo', description: '轉錄體從頭組裝分析' },
//     { value: 'A217 2nd - ServiceHour', description: '客製化分析服務（以小時計費）' },
//     { value: 'A218 2nd - DRAGEN-Germline-Server', description: 'DRAGEN Server 體細胞變異分析' },
//     { value: 'A219 2nd - DRAGEN-Somatic-Server', description: 'DRAGEN Server 體細胞突變分析' },
//     { value: 'A302 3rd - Geneyx-Report', description: 'Geneyx 變異解讀報告' },
//     { value: 'A303 3rd - Geneyx-Report&Annotation-Germline', description: 'Geneyx 報告 + 體細胞變異註解' },
//     { value: 'A304 3rd - Geneyx-Account', description: 'Geneyx 平台使用帳號' },
//     { value: 'A305 3rd - Annotation-Germline', description: '體細胞變異註解' },
//     { value: 'A306 3rd - Annotation-Germline&JointCalling', description: '體細胞變異註解 + Joint Calling' },
//     { value: 'A307 3rd - Annotation-Somatic', description: '體細胞突變註解' },
//     { value: 'A308 3rd - Annotation-Somatic-PCGR', description: '體細胞突變 PCGR 註解（癌症相關）' },
//     { value: 'A309 3rd - Annotation-Somatic-PCGR-maftools', description: 'PCGR + maftools 進階癌症註解' },
//     { value: 'A310 3rd - OGM-Geneyx-Report', description: 'OGM (光學基因體圖譜) Geneyx 報告' },
//     { value: 'A311 3rd - OGM-Geneyx-Account', description: 'OGM Geneyx 平台使用帳號' },
//     { value: 'A312 3rd - ICI-Report', description: 'ICI (免疫檢查點抑制劑) 療效預測報告' },
//     { value: 'A313 3rd - ICI-Account', description: 'ICI 分析平台使用帳號' },
//     { value: 'A314 3rd - MagicBison', description: 'MagicBison 整合分析平台' },
//     { value: 'A315 3rd - SangerReport', description: 'Sanger 定序分析報告' },
//     { value: 'A316 3rd - HLAtyping', description: 'HLA 分型分析' }
//   ],
//   '套組產品 (AP)': [
//     { value: '台基安WGS包套1', description: 'WGS 基礎套組：萃取 + QC + 建庫 + 定序' },
//     { value: '台基安WGS包套2', description: 'WGS 進階套組：包套1 + 基礎生資分析' },
//     { value: '台基安WGS包套3', description: 'WGS 完整套組：包套2 + 變異註解報告' },
//     { value: '台基安WES包套1', description: 'WES 基礎套組：萃取 + QC + 建庫 + 定序' },
//     { value: '台基安WES包套2', description: 'WES 進階套組：包套1 + 基礎生資分析' },
//     { value: '台基安WES包套3', description: 'WES 完整套組：包套2 + 變異註解報告' },
//     { value: 'RNAseq-Basic包套', description: 'RNA-Seq 基礎套組：萃取 + QC + 建庫 + 定序 + 基礎分析' },
//     { value: 'RNAseq-Advanced包套', description: 'RNA-Seq 進階套組：基礎包套 + 差異表現分析 + 功能註解' }
//   ]
// };


  // 處理服務類別勾選
// 處理服務類別勾選（含聯動邏輯）
// 處理服務類別勾選（含聯動和鎖定邏輯）
const handleServiceCategoryToggle = (categoryValue) => {
  setFormData(prev => {
    let newSelected = [...prev.selectedServiceCategories];
    
    if (newSelected.includes(categoryValue)) {
      // === 取消勾選 ===
      
      // 🔒 阻擋規則 1：如果勾選了「萃取/QC (EQ)」，不能取消「建庫服務 (L)」或「定序服務 (S)」
      if (categoryValue === '建庫服務 (L)' || categoryValue === '定序服務 (S)') {
        if (newSelected.includes('萃取/QC (EQ)')) {
          setMessage('❌ 已勾選「萃取/QC」，無法取消此項目');
          setTimeout(() => setMessage(''), 2000);
          return prev; // 不改變狀態
        }
      }
      
      // 🔒 阻擋規則 2：如果勾選了「建庫服務 (L)」，不能取消「定序服務 (S)」
      if (categoryValue === '定序服務 (S)') {
        if (newSelected.includes('建庫服務 (L)')) {
          setMessage('❌ 已勾選「建庫服務」，無法取消定序服務');
          setTimeout(() => setMessage(''), 2000);
          return prev; // 不改變狀態
        }
      }
      
      // 允許取消
      newSelected = newSelected.filter(c => c !== categoryValue);
      
    } else {
      // === 勾選 ===
      newSelected.push(categoryValue);
      
      // 聯動邏輯 1：勾選「萃取/QC (EQ)」→ 自動勾選「建庫服務 (L)」和「定序服務 (S)」
      if (categoryValue === '萃取/QC (EQ)') {
        const autoChecked = [];
        if (!newSelected.includes('建庫服務 (L)')) {
          newSelected.push('建庫服務 (L)');
          autoChecked.push('建庫服務');
        }
        if (!newSelected.includes('定序服務 (S)')) {
          newSelected.push('定序服務 (S)');
          autoChecked.push('定序服務');
        }
        if (autoChecked.length > 0) {
          setMessage(`✓ 已自動勾選：${autoChecked.join('、')}`);
          setTimeout(() => setMessage(''), 2000);
        }
      }
      
      // 聯動邏輯 2：勾選「建庫服務 (L)」→ 自動勾選「定序服務 (S)」
      if (categoryValue === '建庫服務 (L)') {
        if (!newSelected.includes('定序服務 (S)')) {
          newSelected.push('定序服務 (S)');
          setMessage('✓ 已自動勾選：定序服務');
          setTimeout(() => setMessage(''), 2000);
        }
      }
    }
    
    return { ...prev, selectedServiceCategories: newSelected };
  });
};

  // 驗證當前步驟必填欄位
  const validateStep = (step) => {
    switch(step) {
    case 0: // Step 0 驗證
      if (!formData.salesCode) {
        setMessage('請輸入業務代碼');
        return false;
      }
      
      // 檢查業務代碼是否存在
      const foundSales = salesCodes.find(s => s.code === formData.salesCode);
      if (!foundSales) {
        setMessage('❌ 業務代碼不存在，請確認後重新輸入');
        return false;
      }
      break;      
      case 1:
      // 🆕 檢查業務人員
        if (!formData.salesPerson || formData.salesPerson === '請選擇業務人員') {
          setMessage('請選擇業務人員');
          return false;
        }        
        if (!formData.organization || !formData.contactPerson || !formData.email) {
          setMessage('請填寫所有必填欄位（標 * 者）');
          return false;
        }
        //  email 格式
        if (!validateEmail(formData.email)) {
          setMessage('Email 格式不正確（例：user@example.com，多email使用","分隔）');
          return false;
        }        
        if (formData.selectedServiceCategories.length === 0) {
          setMessage('請至少勾選一個服務類別');
          return false;
        }
        break;
      case 2:
        // 驗證服務項目
        const hasEmptyService = formData.serviceItems.some(item => 
          !item.services.some(s => s.service && s.quantity)
        );
        if (hasEmptyService) {
          setMessage('請填寫所有服務品項與數量');
          return false;
        }
      // 🆕 檢查建庫服務是否與萃取類型匹配
      const extractionType = getExtractionType();
      const libraryItem = formData.serviceItems.find(item => item.category === '建庫服務 (L)');
      
      if (extractionType && libraryItem) {
        const hasInvalidLibrary = libraryItem.services.some(s => {
          if (!s.service) return false;
          
          if (extractionType === 'DNA') {
            // DNA 萃取不能選 L-RN 開頭
            return s.service.startsWith('L-RN');
          }
          if (extractionType === 'RNA') {
            // RNA 萃取只能選 L-RN 開頭
            return !s.service.startsWith('L-RN');
          }
          return false;
        });
        
        if (hasInvalidLibrary) {
          setMessage(`❌ 建庫服務與萃取類型不符！${extractionType === 'RNA' ? 'RNA 萃取只能選擇 L-RN 開頭的建庫服務' : 'DNA 萃取不能選擇 L-RN 開頭的建庫服務'}`);
          return false;
        }
      }
      break;        
      
        case 3:
          // 🆕 檢查 Sample_Name 是否重複TGIAOrderForm 
          if (formData.sampleType === 'Library') {
            // Library: 檢查兩個工作表
            
            // 檢查 Sample Sheet
            const sampleNames1 = formData.libraryInfo.sampleSheet
              .map(row => row.sampleName.trim())
              .filter(name => name); // 過濾空白
            
            const duplicates1 = sampleNames1.filter((name, index) => 
              sampleNames1.indexOf(name) !== index
            );
            
            if (duplicates1.length > 0) {
              const uniqueDuplicates1 = [...new Set(duplicates1)];
              setMessage(`❌ Library Sample Sheet 中有重複的 Sample_Name：${uniqueDuplicates1.join(', ')}`);
              return false;
            }
            
            // 檢查 Library Sample Sheet
            const sampleNames2 = formData.libraryInfo.librarySampleSheet
              .map(row => row.sampleName.trim())
              .filter(name => name);
            
            const duplicates2 = sampleNames2.filter((name, index) => 
              sampleNames2.indexOf(name) !== index
            );
            
            if (duplicates2.length > 0) {
              const uniqueDuplicates2 = [...new Set(duplicates2)];
              setMessage(`❌ Library Sample Sheet (第二個表格) 中有重複的 Sample_Name：${uniqueDuplicates2.join(', ')}`);
              return false;
            }
            
          } else if (formData.sampleType !== '無送樣') {
            // Sample (DNA/RNA/Cell/Blood): 檢查單一工作表
            const sampleNames = formData.sampleInfo.sampleSheet
              .map(row => row.sampleName.trim())
              .filter(name => name); // 過濾空白
            
            const duplicates = sampleNames.filter((name, index) => 
              sampleNames.indexOf(name) !== index
            );
            
            if (duplicates.length > 0) {
              const uniqueDuplicates = [...new Set(duplicates)];
              setMessage(`❌ Sample Sheet 中有重複的 Sample_Name：${uniqueDuplicates.join(', ')}`);
              return false;
            }
          }
          break;        
      case 4:
        if (!formData.signature) {
          setMessage('請先簽名確認訂單內容');
          return false;
        }
        break;
    }
    setMessage('');
    return true;
  };

const nextStep = () => {
  if (validateStep(currentStep)) {
    // 從步驟1到步驟2時，根據勾選的類別自動生成表單
    if (currentStep === 1 && formData.selectedServiceCategories.length > 0) {
      // 🆕 定義固定的服務類別順序
      const categoryOrder = [
        'QC (Q)',
        '萃取/QC (EQ)',
        '建庫服務 (L)',
        '定序服務 (S)',
        '分析服務 (A)',
        '套組產品 (AP)'
      ];
      
      // 🆕 根據預定義順序排序已選擇的類別
      const sortedCategories = categoryOrder.filter(cat => 
        formData.selectedServiceCategories.includes(cat)
      );
      
      const newServiceItems = sortedCategories.map(category => ({
        category: category,
        services: [{ service: '', quantity: '' }],
        libraryType: '無',
        seqSpec: ''
      }));
      
      setFormData(prev => ({ ...prev, serviceItems: newServiceItems }));
    }
    
    setCurrentStep(prev => Math.min(prev + 1, steps.length));
    window.scrollTo(0, 0);
  }
};


// 🆕 重新設計：根據具體萃取品項判斷類型
const getExtractionType = () => {
  const eqItem = formData.serviceItems.find(item => item.category === '萃取/QC (EQ)');
  if (!eqItem) return null;
  
  let hasDNA = false;
  let hasRNA = false;
  
  eqItem.services.forEach(s => {
    if (s.service) {
      // DNA 萃取服務：Q-ED 開頭或包含 DNA/cfDNA
      if (s.service.startsWith('Q-ED') || s.service.includes('cfDNA')) {
        hasDNA = true;
      }
      // RNA 萃取服務：Q-ER 開頭或包含 RNA/cfRNA
      if (s.service.startsWith('Q-ER') || s.service.includes('cfRNA')) {
        hasRNA = true;
      }
    }
  });
  
  if (hasDNA && !hasRNA) return 'DNA';
  if (hasRNA && !hasDNA) return 'RNA';
  if (hasDNA && hasRNA) return 'MIXED';
  return null;
};


// 🆕 根據萃取類型過濾建庫服務選項
const getFilteredLibraryServices = () => {
  const extractionType = getExtractionType();
  const allServices = serviceOptionsByCategory['建庫服務 (L)'] || [];
  
  if (!extractionType) {
    // 沒有萃取服務，顯示全部
    return allServices;
  }
  
  if (extractionType === 'MIXED') {
    // 混合類型，顯示全部
    return allServices;
  }
  
  if (extractionType === 'DNA') {
    // 只顯示 DNA 相關建庫（排除 L-RN 開頭）
    return allServices.filter(opt => !opt.value.startsWith('L-RN'));
  }
  
  if (extractionType === 'RNA') {
    // 只顯示 RNA 相關建庫（L-RN 開頭）
    return allServices.filter(opt => opt.value.startsWith('L-RN'));
  }
  
  return allServices;
};
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
    window.scrollTo(0, 0);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (name === 'organization') {
      const filtered = organizationOptions.filter(org =>
        org.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredOrgs(filtered);
      setShowOrgSuggestions(value.length > 0 && filtered.length > 0);
    }
  };

  const selectOrganization = (org) => {
    setFormData(prev => ({ ...prev, organization: org }));
    setShowOrgSuggestions(false);
  };

  const handleServiceItemChange = (index, field, value) => {
    const newItems = [...formData.serviceItems];
    newItems[index][field] = value;
    if (field === 'category') {
      newItems[index].services = [{ service: '', quantity: '' }];
    }
    setFormData(prev => ({ ...prev, serviceItems: newItems }));
  };

  const handleServiceChange = (itemIndex, serviceIndex, field, value) => {
    const newItems = [...formData.serviceItems];
    newItems[itemIndex].services[serviceIndex][field] = value;
    setFormData(prev => ({ ...prev, serviceItems: newItems }));
  };

  const addService = (itemIndex) => {
    const newItems = [...formData.serviceItems];
    newItems[itemIndex].services.push({ service: '', quantity: '' });
    setFormData(prev => ({ ...prev, serviceItems: newItems }));
  };

  const removeService = (itemIndex, serviceIndex) => {
    const newItems = [...formData.serviceItems];
    if (newItems[itemIndex].services.length === 1) {
      alert('至少需要保留一項服務品項');
      return;
    }
    newItems[itemIndex].services = newItems[itemIndex].services.filter((_, i) => i !== serviceIndex);
    setFormData(prev => ({ ...prev, serviceItems: newItems }));
  };

  const addServiceItem = () => {
    setFormData(prev => ({
      ...prev,
      serviceItems: [...prev.serviceItems, {
        category: '請選擇服務類別',
        services: [{ service: '', quantity: '' }],
        libraryType: '無',
        seqSpec: ''
      }]
    }));
  };

  const removeServiceItem = (index) => {
    if (formData.serviceItems.length === 1) {
      alert('至少需要保留一組服務類別');
      return;
    }
    const newItems = formData.serviceItems.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, serviceItems: newItems }));
  };

  const handleLibrarySampleSheetChange = (index, field, value) => {
    const newSampleSheet = [...formData.libraryInfo.sampleSheet];
    newSampleSheet[index][field] = field === 'sampleName' ? sanitizeSampleName(value) : value;
    
    // 🆕 自動計算樣本數量
    const count = newSampleSheet.filter(row => row.sampleName && row.sampleName.trim() !== '').length;
    
    setFormData(prev => ({
      ...prev,
      libraryInfo: {
        ...prev.libraryInfo,
        sampleSheet: newSampleSheet
      }
    }));
  };

  const handleTablePaste = (e, startIndex) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const rows = pastedText.split('\n').filter(row => row.trim());
    
    const newSampleSheet = [...formData.libraryInfo.sampleSheet];
    
    rows.forEach((row, rowIndex) => {
      const columns = row.split('\t');
      const targetIndex = startIndex + rowIndex;
      
      // 智能判斷：如果第一欄是數字，就跳過（認為是序號）
      //const startCol = /^\d+$/.test(columns[0]) ? 1 : 0;
      const startCol = 0 ;
      while (targetIndex >= newSampleSheet.length) {
        newSampleSheet.push({
          no: newSampleSheet.length + 1,
          sampleName: '',
          tubeLabel: '',
          conc: '',
          vol: '',
          ngsConc: '',
          expectedSeq: '',
          note: ''
        });
      }
      
      if (columns.length > startCol) {
        newSampleSheet[targetIndex] = {
          no: targetIndex + 1,
          sampleName: sanitizeSampleName(columns[startCol] || ''),  // 🆕 清理
          tubeLabel: columns[startCol + 1] || '',
          conc: columns[startCol + 2] || '',
          vol: columns[startCol + 3] || '',
          ngsConc: columns[startCol + 4] || '',
          expectedSeq: columns[startCol + 5] || '',
          note: columns[startCol + 6] || ''
        };
      }
    });
    
    setFormData(prev => ({
      ...prev,
      libraryInfo: {
        ...prev.libraryInfo,
        sampleSheet: newSampleSheet
      }
    }));
    
    setMessage(`已貼上 ${rows.length} 行資料`);
    setTimeout(() => setMessage(''), 2000);
  };

// 🆕 修改 addLibrarySampleSheetRow
const addLibrarySampleSheetRow = () => {
  const newRow = {
    no: formData.libraryInfo.sampleSheet.length + 1,
    sampleName: '',
    tubeLabel: '',
    conc: '',
    vol: '',
    ngsConc: '',
    expectedSeq: '',
    note: ''
  };
  const newSampleSheet = [...formData.libraryInfo.sampleSheet, newRow];
  
  // 🆕 計算樣本數量（新增時通常 sampleName 是空的，所以數量不變）
  const count = newSampleSheet.filter(row => row.sampleName && row.sampleName.trim() !== '').length;
  
  setFormData(prev => ({
    ...prev,
    libraryInfo: {
      ...prev.libraryInfo,
      sampleSheet: newSampleSheet
    },
    sampleCount: count  // 🆕 自動更新
  }));
};


// 🆕 修改 removeLibrarySampleSheetRow
const removeLibrarySampleSheetRow = (index) => {
  if (formData.libraryInfo.sampleSheet.length === 1) {
    alert('至少需要保留一行');
    return;
  }
  const newSampleSheet = formData.libraryInfo.sampleSheet.filter((_, i) => i !== index);
  
  // 🆕 自動計算樣本數量
  const count = newSampleSheet.filter(row => row.sampleName && row.sampleName.trim() !== '').length;
  
  setFormData(prev => ({
    ...prev,
    libraryInfo: {
      ...prev.libraryInfo,
      sampleSheet: newSampleSheet
    },
    sampleCount: count  // 🆕 自動更新
  }));
};

  const handleLibraryDetailChange = (index, field, value) => {
    const newLibrarySheet = [...formData.libraryInfo.librarySampleSheet];
    newLibrarySheet[index][field] = field === 'sampleName' ? sanitizeSampleName(value) : value;
    setFormData(prev => ({
      ...prev,
      libraryInfo: {
        ...prev.libraryInfo,
        librarySampleSheet: newLibrarySheet
      }
    }));
  };

  const handleLibraryDetailTablePaste = (e, startIndex) => {
  e.preventDefault();
  const pastedText = e.clipboardData.getData('text');
  const rows = pastedText.split('\n').filter(row => row.trim());
  
  const newLibrarySheet = [...formData.libraryInfo.librarySampleSheet];
  
  rows.forEach((row, rowIndex) => {
    const columns = row.split('\t');
    const targetIndex = startIndex + rowIndex;
    const startCol = /^\d+$/.test(columns[0]) ? 1 : 0;
    
    while (targetIndex >= newLibrarySheet.length) {
      newLibrarySheet.push({
        no: newLibrarySheet.length + 1,
        sampleName: '',
        libraryPrepKit: '',
        indexAdapterKit: '',
        setWellPosition: '',
        index1Seq: '',
        index2Seq: '',
        note: '',
        library: ''
      });
    }
    
    if (columns.length > startCol) {
      newLibrarySheet[targetIndex] = {
        no: targetIndex + 1,
        sampleName: sanitizeSampleName(columns[startCol] || ''),  // 🆕 清理
        libraryPrepKit: columns[startCol + 1] || '',
        indexAdapterKit: columns[startCol + 2] || '',
        setWellPosition: columns[startCol + 3] || '',
        index1Seq: columns[startCol + 4] || '',
        index2Seq: columns[startCol + 5] || '',
        note: columns[startCol + 6] || '',
        library: columns[startCol + 7] || ''
      };
    }
  });
  
  setFormData(prev => ({
    ...prev,
    libraryInfo: {
      ...prev.libraryInfo,
      librarySampleSheet: newLibrarySheet
    }
  }));
  
  setMessage(`已貼上 ${rows.length} 行資料`);
  setTimeout(() => setMessage(''), 2000);
};

  const addLibraryDetailRow = () => {
    const newRow = {
      no: formData.libraryInfo.librarySampleSheet.length + 1,
      sampleName: '',
      libraryPrepKit: '',
      indexAdapterKit: '',
      setWellPosition: '',
      index1Seq: '',
      index2Seq: '',
      note: '',
      library: ''
    };
    setFormData(prev => ({
      ...prev,
      libraryInfo: {
        ...prev.libraryInfo,
        librarySampleSheet: [...prev.libraryInfo.librarySampleSheet, newRow]
      }
    }));
  };

  const removeLibraryDetailRow = (index) => {
    if (formData.libraryInfo.librarySampleSheet.length === 1) {
      alert('至少需要保留一行');
      return;
    }
    const newLibrarySheet = formData.libraryInfo.librarySampleSheet.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      libraryInfo: {
        ...prev.libraryInfo,
        librarySampleSheet: newLibrarySheet
      }
    }));
  };

  // const downloadExcelTemplate = async () => {
  //   try {
  //     const XLSX = await import('xlsx');
      
  //     const sampleSheetData = [
  //       ['序號', 'Sample_Name', 'Tube Label', 'Conc (ng/ul)', 'Vol (uL)', 'NGS上機濃度 (pM)', '預期定序量', '備註'],
  //       [1, '', '', '', '', '', '', ''],
  //       [2, '', '', '', '', '', '', ''],
  //       [3, '', '', '', '', '', '', '']
  //     ];
      
  //     const librarySheetData = [
  //       ['序號', 'Sample_Name', 'Library Prep Kit', 'Index Adapter Kit', 'Set-Well Position', 'Index 1 (i7)', 'Index 2 (i5)', '備註', 'Library'],
  //       [1, '', '', '', '', '', '', '', ''],
  //       [2, '', '', '', '', '', '', '', ''],
  //       [3, '', '', '', '', '', '', '', '']
  //     ];
      
  //     const wb = XLSX.utils.book_new();
  //     const ws1 = XLSX.utils.aoa_to_sheet(sampleSheetData);
  //     const ws2 = XLSX.utils.aoa_to_sheet(librarySheetData);
      
  //     XLSX.utils.book_append_sheet(wb, ws1, 'Sample Sheet');
  //     XLSX.utils.book_append_sheet(wb, ws2, 'Library Sample Sheet');
      
  //     XLSX.writeFile(wb, 'Library_Template.xlsx');
  //     setMessage('Excel 範本已下載');
  //     setTimeout(() => setMessage(''), 2000);
  //   } catch (error) {
  //     alert('下載失敗：' + error.message);
  //   }
  // };

const handleExcelUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const XLSX = await import('xlsx');
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const fileName = file.name.toLowerCase();
    
    if (fileName.includes('library')) {
      // === Library 範本處理 ===
      console.log('📊 Library 工作表:', workbook.SheetNames);
      
      // 工作表1: Sample Sheet
      if (workbook.SheetNames[0]) {
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        console.log('📋 Sample Sheet 原始資料:', jsonData);
        
        const newSampleSheet = [];
        jsonData.forEach((row, index) => {
          // 🆕 從第 2 行開始（index > 1），跳過標題和範例行
          if (index > 1 && row && row.length > 1) {
            const hasSeqNum = typeof row[0] === 'number' || !isNaN(row[0]);
            const startIdx = hasSeqNum ? 1 : 0;
            
            const sampleName = sanitizeSampleName(row[startIdx] ?? '');
            
            // 🆕 過濾掉佔位符（Sample_Nam, Sample_Name 等）
            if (sampleName && 
                sampleName !== 'Sample_Name' && 
                !sampleName.startsWith('Sample_Nam')) {
              newSampleSheet.push({
                no: newSampleSheet.length + 1,
                sampleName: sampleName,
                tubeLabel: String(row[startIdx + 1] ?? ''),
                conc: String(row[startIdx + 2] ?? ''),
                vol: String(row[startIdx + 3] ?? ''),
                ngsConc: String(row[startIdx + 4] ?? ''),
                expectedSeq: String(row[startIdx + 5] ?? ''),
                note: String(row[startIdx + 6] ?? '')
              });
            }
          }
        });
        
        console.log('✅ 解析後的 Sample Sheet:', newSampleSheet);
        
        if (newSampleSheet.length > 0) {
          // 🆕 自動計算樣本數量
          const count = newSampleSheet.filter(row => row.sampleName && row.sampleName.trim() !== '').length;
          
          setFormData(prev => ({
            ...prev,
            libraryInfo: {
              ...prev.libraryInfo,
              sampleSheet: newSampleSheet
            },
            sampleCount: count
          }));
        }
      }
      
      // 工作表2: Library Sample Sheet
      if (workbook.SheetNames[1]) {
        const worksheet = workbook.Sheets[workbook.SheetNames[1]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        console.log('📋 Library Sample Sheet 原始資料:', jsonData);
        
        const newLibrarySheet = [];
        jsonData.forEach((row, index) => {
          // 🆕 從第 2 行開始（index > 1），跳過標題和範例行
          if (index > 1 && row && row.length > 1) {
            const hasSeqNum = typeof row[0] === 'number' || !isNaN(row[0]);
            const startIdx = hasSeqNum ? 1 : 0;
            
            const sampleName = sanitizeSampleName(row[startIdx] ?? '');
            
            // 🆕 過濾掉佔位符
            if (sampleName && 
                sampleName !== 'Sample_Name' && 
                !sampleName.startsWith('Sample_Nam')) {
              newLibrarySheet.push({
                no: newLibrarySheet.length + 1,
                sampleName: sampleName,
                libraryPrepKit: String(row[startIdx + 1] ?? ''),
                indexAdapterKit: String(row[startIdx + 2] ?? ''),
                setWellPosition: String(row[startIdx + 3] ?? ''),
                index1Seq: String(row[startIdx + 4] ?? ''),
                index2Seq: String(row[startIdx + 5] ?? ''),
                note: String(row[startIdx + 6] ?? ''),
                library: String(row[startIdx + 7] ?? '')
              });
            }
          }
        });
        
        console.log('✅ 解析後的 Library Sample Sheet:', newLibrarySheet);
        
        if (newLibrarySheet.length > 0) {
          setFormData(prev => ({
            ...prev,
            libraryInfo: {
              ...prev.libraryInfo,
              librarySampleSheet: newLibrarySheet
            }
          }));
        }
      }
      
      setMessage(`Library Excel 檔案已匯入`);
      
    } else if (fileName.includes('sample')) {
      // === Sample 範本處理 ===
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      console.log('📋 Sample 原始資料:', jsonData);
      
      const newSampleSheet = [];
      jsonData.forEach((row, index) => {
        // 🆕 從第 3 行開始（index > 2），因為 Sample 範本有大標題
        if (index > 2 && row && row.length > 1) {
          const hasSeqNum = typeof row[0] === 'number' || !isNaN(row[0]);
          const startIdx = hasSeqNum ? 1 : 0;
          
          const sampleName = sanitizeSampleName(row[startIdx] ?? '');
          
          // 🆕 過濾掉佔位符
          if (sampleName && 
              sampleName !== 'Sample_Name' && 
              !sampleName.startsWith('Sample_Nam')) {
            newSampleSheet.push({
              no: newSampleSheet.length + 1,
              sampleName: sampleName,
              tubeLabel: String(row[startIdx + 1] ?? ''),
              expectedSeq: String(row[startIdx + 2] ?? ''),
              conc: String(row[startIdx + 3] ?? ''),
              vol: String(row[startIdx + 4] ?? ''),
              ratio260280: String(row[startIdx + 5] ?? ''),
              ratio260230: String(row[startIdx + 6] ?? ''),
              dqnRqn: String(row[startIdx + 7] ?? ''),
              note: String(row[startIdx + 8] ?? '')
            });
          }
        }
      });
      
      console.log('✅ 解析後的 Sample:', newSampleSheet);
      
      if (newSampleSheet.length > 0) {
        // 🆕 自動計算樣本數量
        const count = newSampleSheet.filter(row => row.sampleName && row.sampleName.trim() !== '').length;
        
        setFormData(prev => ({
          ...prev,
          sampleInfo: {
            ...prev.sampleInfo,
            sampleSheet: newSampleSheet
          },
          sampleCount: count
        }));
        setMessage(`Sample Excel 檔案已匯入 (${count} 個樣本)`);
      } else {
        alert('未讀取到有效資料，請確認檔案格式');
      }
    } else {
      alert('檔案名稱必須包含 "library" 或 "sample"');
      return;
    }
    
    setTimeout(() => setMessage(''), 2000);
    e.target.value = '';
  } catch (error) {
    console.error('❌ 上傳錯誤:', error);
    alert('上傳失敗：' + error.message);
  }
};

  const clearSampleSheet = () => {
    if (window.confirm('確定要清空所有 Sample Sheet 資料嗎？')) {
      setFormData(prev => ({
        ...prev,
        libraryInfo: {
          ...prev.libraryInfo,
          sampleSheet: [{
            no: 1,
            sampleName: '',
            tubeLabel: '',
            conc: '',
            vol: '',
            ngsConc: '',
            expectedSeq: '',
            note: ''
          }]
        }
      }));
      setMessage('Sample Sheet 已清空');
      setTimeout(() => setMessage(''), 2000);
    }
  };

  const clearLibrarySheet = () => {
    if (window.confirm('確定要清空所有 Library Sample Sheet 資料嗎？')) {
      setFormData(prev => ({
        ...prev,
        libraryInfo: {
          ...prev.libraryInfo,
          librarySampleSheet: [{
            no: 1,
            sampleName: '',
            libraryPrepKit: '',
            indexAdapterKit: '',
            setWellPosition: '',
            index1Seq: '',
            index2Seq: '',
            note: '',
            library: ''
          }]
        }
      }));
      setMessage('Library Sample Sheet 已清空');
      setTimeout(() => setMessage(''), 2000);
    }
  };

  const clearSampleInfoSheet = () => {
    if (window.confirm('確定要清空所有 Sample 資料嗎？')) {
      setFormData(prev => ({
        ...prev,
        sampleInfo: {
          ...prev.sampleInfo,
          sampleSheet: [{
            no: 1,
            sampleName: '',
            tubeLabel: '',
            expectedSeq: '',
            conc: '',
            vol: '',
            ratio260280: '',
            ratio260230: '',
            dqnRqn: '',
            note: ''
          }]
        }
      }));
      setMessage('Sample 資料已清空');
      setTimeout(() => setMessage(''), 2000);
    }
  };
  
  // 🆕 修改 handleSampleSheetChange
  const handleSampleSheetChange = (index, field, value) => {
    const newSampleSheet = [...formData.sampleInfo.sampleSheet];
    newSampleSheet[index][field] = field === 'sampleName' ? sanitizeSampleName(value) : value;
    
    // 🆕 自動計算樣本數量
    const count = newSampleSheet.filter(row => row.sampleName && row.sampleName.trim() !== '').length;
    
    setFormData(prev => ({
      ...prev,
      sampleInfo: {
        ...prev.sampleInfo,
        sampleSheet: newSampleSheet
      },
      sampleCount: count  // 🆕 自動更新
    }));
  };

// 🆕 修改 handleSampleTablePaste (Sample)
const handleSampleTablePaste = (e, startIndex) => {
  e.preventDefault();
  const pastedText = e.clipboardData.getData('text');
  const rows = pastedText.split('\n').filter(row => row.trim());
  
  const newSampleSheet = [...formData.sampleInfo.sampleSheet];
  
  rows.forEach((row, rowIndex) => {
    const columns = row.split('\t');
    const targetIndex = startIndex + rowIndex;
    const startCol = /^\d+$/.test(columns[0]) ? 1 : 0;
    
    while (targetIndex >= newSampleSheet.length) {
      newSampleSheet.push({
        no: newSampleSheet.length + 1,
        sampleName: '',
        tubeLabel: '',
        expectedSeq: '',
        conc: '',
        vol: '',
        ratio260280: '',
        ratio260230: '',
        dqnRqn: '',
        note: ''
      });
    }
    
    if (columns.length > startCol) {
      newSampleSheet[targetIndex] = {
        no: targetIndex + 1,
        sampleName: sanitizeSampleName(columns[startCol] || ''),
        tubeLabel: columns[startCol + 1] || '',
        expectedSeq: columns[startCol + 2] || '',
        conc: columns[startCol + 3] || '',
        vol: columns[startCol + 4] || '',
        ratio260280: columns[startCol + 5] || '',
        ratio260230: columns[startCol + 6] || '',
        dqnRqn: columns[startCol + 7] || '',
        note: columns[startCol + 8] || ''
      };
    }
  });
  
  // 🆕 自動計算樣本數量
  const count = newSampleSheet.filter(row => row.sampleName && row.sampleName.trim() !== '').length;
  
  setFormData(prev => ({
    ...prev,
    sampleInfo: {
      ...prev.sampleInfo,
      sampleSheet: newSampleSheet
    },
    sampleCount: count  // 🆕 自動更新
  }));
  
  setMessage(`已貼上 ${rows.length} 行資料，樣本數量：${count}`);
  setTimeout(() => setMessage(''), 2000);
};

// 🆕 修改 addSampleSheetRow
const addSampleSheetRow = () => {
  const newRow = {
    no: formData.sampleInfo.sampleSheet.length + 1,
    sampleName: '',
    tubeLabel: '',
    expectedSeq: '',
    conc: '',
    vol: '',
    ratio260280: '',
    ratio260230: '',
    dqnRqn: '',
    note: ''
  };
  const newSampleSheet = [...formData.sampleInfo.sampleSheet, newRow];
  
  // 🆕 計算樣本數量
  const count = newSampleSheet.filter(row => row.sampleName && row.sampleName.trim() !== '').length;
  
  setFormData(prev => ({
    ...prev,
    sampleInfo: {
      ...prev.sampleInfo,
      sampleSheet: newSampleSheet
    },
    sampleCount: count  // 🆕 自動更新
  }));
};

// 🆕 修改 removeSampleSheetRow
const removeSampleSheetRow = (index) => {
  if (formData.sampleInfo.sampleSheet.length === 1) {
    alert('至少需要保留一行');
    return;
  }
  const newSampleSheet = formData.sampleInfo.sampleSheet.filter((_, i) => i !== index);
  
  // 🆕 自動計算樣本數量
  const count = newSampleSheet.filter(row => row.sampleName && row.sampleName.trim() !== '').length;
  
  setFormData(prev => ({
    ...prev,
    sampleInfo: {
      ...prev.sampleInfo,
      sampleSheet: newSampleSheet
    },
    sampleCount: count  // 🆕 自動更新
  }));
};
  const handleSignatureSave = (signatureData) => {
    setFormData(prev => ({ ...prev, signature: signatureData }));
    setShowSignaturePad(false);
    setMessage('簽名已保存');
    setTimeout(() => setMessage(''), 2000);
  };

  const handleSignatureCancel = () => {
    setShowSignaturePad(false);
  };

  const clearSignature = () => {
    setFormData(prev => ({ ...prev, signature: null }));
    setMessage('簽名已清除');
    setTimeout(() => setMessage(''), 2000);
  };
  // Library Sample Sheet 範本下載
  const downloadTemplate = async () => {
    try {
      const response = await fetch('/templates/library_templates.xlsx');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'library_templates.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setMessage('Library 範本已下載');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      alert('下載失敗：' + error.message);
    }
  };

  // Sample 範本下載（移除原本的 downloadLibraryDetailTemplate，統一用 downloadTemplate）
  const downloadSampleTemplate = async () => {
    try {
      const response = await fetch('/templates/sample_template.xlsx');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'sample_template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setMessage('Sample 範本已下載');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      alert('下載失敗：' + error.message);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      return;
    }
    
    try {
      const response = await fetch('http://192.168.60.62:3001/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSubmitted(true);
        setExportReady(true);
        setOrderId(result.orderId);
        setMessage(`需求單已成功提交！編號：${result.orderId}`);
        setTimeout(() => {
          setSubmitted(false);
        }, 5000);
      } else {
        setMessage('提交失敗：' + result.error);
      }
    } catch (error) {
      setMessage('提交失敗：' + error.message);
    }
  };

  const exportToExcel = async () => {
    if (!orderId) {
      setMessage('請先提交訂單才能匯出 Excel');
      return;
    }
    
    try {
      const response = await fetch(`http://192.168.60.62:3001/api/orders/${orderId}/export`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TGIA_Order_${orderId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setMessage('Excel 檔案下載成功');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      setMessage('匯出失敗：' + error.message);
    }
  };

  // 🆕 可搜尋的下拉選單組件
  const SearchableSelect = ({ value, options, onChange, placeholder, itemIndex, serviceIndex }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const dropdownRef = useRef(null);
    
    // 過濾選項
    const filteredOptions = options.filter(opt => 
      opt.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opt.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // 點擊外部關閉
    React.useEffect(() => {
      const handleClickOutside = (e) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    // 鍵盤操作
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      switch(e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredOptions[highlightedIndex]) {
            handleSelect(filteredOptions[highlightedIndex].value);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          break;
      }
    };
    
    const handleSelect = (selectedValue) => {
      onChange(selectedValue);
      setIsOpen(false);
      setSearchTerm('');
    };
    
    const displayValue = value ? options.find(opt => opt.value === value)?.value || value : '';
    
    return (
      <div ref={dropdownRef} className="relative">
        {/* 顯示/搜尋輸入框 */}
        <div className="relative">
          <input
            type="text"
            value={isOpen ? searchTerm : displayValue}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (!isOpen) setIsOpen(true);
              setHighlightedIndex(0);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 pr-8"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
            <ChevronRight 
              size={16} 
              className={`transform transition-transform ${isOpen ? 'rotate-90' : ''}`}
            />
          </div>
        </div>
        
        {/* 下拉選項列表 */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                找不到符合的選項
              </div>
            ) : (
              filteredOptions.map((opt, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelect(opt.value)}
                  className={`px-3 py-2 cursor-pointer transition ${
                    idx === highlightedIndex
                      ? 'bg-blue-100'
                      : 'hover:bg-blue-50'
                  } ${
                    opt.value === value ? 'bg-blue-50 font-semibold' : ''
                  }`}
                >
                  <div className="text-sm font-medium text-gray-800">
                    {opt.value}
                  </div>
                  {opt.description && (
                    <div className="text-xs text-gray-500 mt-1">
                      {opt.description}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };
  // 🆕 渲染步驟0：快速帶入（簡化版）
  const renderStep0 = () => {
    const salesExists = formData.salesCode && salesCodes.find(s => s.code === formData.salesCode);
    const customerExists = formData.customerCode && customerCodes.find(c => c.code === formData.customerCode);
    
    return (
      <div className="space-y-6">
        <div className="border-2 border-indigo-300 rounded-lg p-6 bg-gradient-to-br from-indigo-50 to-blue-50">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-2"></h3>
            <p className="text-sm text-gray-600">
              輸入業務代碼和客戶代碼
            </p>
          </div>

          {/* 業務代碼 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              業務代碼 <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.salesCode}
              onChange={(e) => handleSalesCodeChange(e.target.value)}
              placeholder="請輸入業務代碼"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            
            {formData.salesCode && salesExists && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  ✓ 業務人員：<span className="font-semibold">{salesExists.name}</span>
                  {salesExists.department && ` | ${salesExists.department}`}
                </p>
              </div>
            )}
            
            {formData.salesCode && !salesExists && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">
                  ❌ 查無此業務代碼，請確認後重新輸入
                </p>
              </div>
            )}
          </div>

          {/* 客戶代碼 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              客戶代碼 <span className="text-gray-500 text-xs">(選填)</span>
            </label>
            <input
              type="text"
              value={formData.customerCode}
              onChange={(e) => handleCustomerCodeChange(e.target.value)}
              placeholder="請輸入客戶代碼"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            
            {formData.customerCode && customerExists && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700 mb-1">
                  ✓ 已帶入客戶資訊：<span className="font-semibold">{customerExists.organization}</span>
                </p>
                <p className="text-xs text-green-600">
                  聯絡人：{customerExists.contactPerson} | 負責人：{customerExists.principalInvestigator}
                </p>
              </div>
            )}
            
            {formData.customerCode && !customerExists && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-700">
                  ⚠️ 查無此客戶代碼，請在下一步手動填寫客戶資訊
                </p>
              </div>
            )}
          </div>

          {/* 提示訊息 */}
          <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-semibold text-gray-800 mb-1">💡 使用說明</p>
                <ul className="space-y-1 ml-4">
                  <li>• <strong>業務代碼</strong>為必填，輸入正確的代碼才能進入下一步</li>
                  <li>• <strong>客戶代碼</strong>為選填，輸入後會自動帶入客戶資訊</li>
                  <li>• 若客戶代碼不存在，仍可進入下一步手動填寫</li>
                  <li>• 代碼會自動轉為大寫</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };


  // 渲染步驟1：基本資訊
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            業務人員 <span className="text-red-600">*</span>
          </label>
          {/* 🆕 改為唯讀顯示 */}
          <div className="w-full px-3 py-2 border-2 border-gray-300 rounded-md bg-gray-100 text-gray-700 font-medium">
            {formData.salesPerson || '未設定'}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            💡 由 Step0 業務代碼自動帶入
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            填寫日期
          </label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            defaultValue={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      {/* 委託人資訊 */}
      <div className="border-2 border-gray-300 rounded-lg p-6 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">委託人資訊</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              單位 <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="organization"
              value={formData.organization}
              onChange={handleInputChange}
              onFocus={() => {
                if (formData.organization) {
                  const filtered = organizationOptions.filter(org =>
                    org.toLowerCase().includes(formData.organization.toLowerCase())
                  );
                  setFilteredOrgs(filtered);
                  setShowOrgSuggestions(filtered.length > 0);
                }
              }}
              onBlur={() => setTimeout(() => setShowOrgSuggestions(false), 200)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="例：國立陽明交通大學"
            />
            {showOrgSuggestions && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {filteredOrgs.map((org, index) => (
                  <div
                    key={index}
                    onClick={() => selectOrganization(org)}
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                  >
                    {org}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              負責人/主持人 <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="principalInvestigator"
              value={formData.principalInvestigator}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              聯絡人 <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              聯絡電話 
            </label>
            <input
              type="tel"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="886-2-2826-7319"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="example@nycu.edu.tw"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              地址
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 發票資訊 */}
      <div className="border-2 border-gray-300 rounded-lg p-6 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">發票資訊</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              抬頭
            </label>
            <input
              type="text"
              name="invoiceTitle"
              value={formData.invoiceTitle}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              統編
            </label>
            <input
              type="text"
              name="taxId"
              value={formData.taxId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              maxLength={8}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              發票聯數
            </label>
            <select
              name="invoiceCopies"
              value={formData.invoiceCopies}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option>二聯式</option>
              <option>三聯式</option>
            </select>
          </div>
        </div>
      </div>

      {/* 數據交付資訊 */}
      <div className="border-2 border-gray-300 rounded-lg p-6 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">數據交付資訊</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              數據提供方式 <span className="text-red-600">*</span>
            </label>
            <select
              name="dataDeliveryMethod"
              value={formData.dataDeliveryMethod}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option>HDD由專人遞送</option>
              <option>國網中心下載</option>
              <option>雲端下載</option>
              <option>sFTP下載</option>
            </select>
          </div>
          
          {formData.dataDeliveryMethod === '國網中心下載' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                數據下載國網帳號
              </label>
              <input
                type="text"
                name="nchcAccount"
                value={formData.nchcAccount}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="請輸入國網中心帳號"
              />
            </div>
          )}
          
          {formData.dataDeliveryMethod === 'HDD由專人遞送' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  數據硬碟交貨地址
                </label>
                <input
                  type="text"
                  name="deliveryAddress"
                  value={formData.deliveryAddress}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="請填寫郵遞區號"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    收件人
                  </label>
                  <input
                    type="text"
                    name="recipient"
                    value={formData.recipient}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    電話
                  </label>
                  <input
                    type="tel"
                    name="recipientPhone"
                    value={formData.recipientPhone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="recipientEmail"
                    value={formData.recipientEmail}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>


      {/* 🆕 急件選擇 */}
      <div className="border-2 border-gray-300 rounded-lg p-6 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">急件選擇</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition hover:bg-gray-100">
            <input
              type="radio"
              name="isUrgent"
              value="false"
              checked={!formData.isUrgent}
              onChange={() => setFormData(prev => ({ ...prev, isUrgent: false }))}
              className="w-4 h-4 text-blue-600"
            />
            <div>
              <span className="font-medium text-gray-700">正常件</span>
              <p className="text-xs text-gray-500">標準處理時程</p>
            </div>
          </label>
          
          <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition hover:bg-gray-100">
            <input
              type="radio"
              name="isUrgent"
              value="true"
              checked={formData.isUrgent}
              onChange={() => setFormData(prev => ({ ...prev, isUrgent: true }))}
              className="w-4 h-4 text-blue-600"
            />
            <div>
              <span className="font-medium text-gray-700">急件</span>
              <p className="text-xs text-gray-500">
                <span className="text-red-600 font-semibold">費用加 10%</span> - 優先處理
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* 🆕 樣品返還選項 */}
      <div className="border-2 border-gray-300 rounded-lg p-6 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">樣品返還</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition hover:bg-gray-100">
            <input
              type="radio"
              name="sampleReturn"
              value="不需要"
              checked={formData.sampleReturn === '不需要'}
              onChange={handleInputChange}
              className="w-4 h-4 text-blue-600"
            />
            <span className="font-medium text-gray-700">不需要</span>
          </label>
          
          <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition hover:bg-gray-100">
            <input
              type="radio"
              name="sampleReturn"
              value="代寄(運費自負)"
              checked={formData.sampleReturn === '代寄(運費自負)'}
              onChange={handleInputChange}
              className="w-4 h-4 text-blue-600"
            />
            <div>
              <span className="font-medium text-gray-700">代寄(運費自負)</span>
              <p className="text-xs text-gray-500">由我們寄回，運費另計</p>
            </div>
          </label>
          
          <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition hover:bg-gray-100">
            <input
              type="radio"
              name="sampleReturn"
              value="自取(結案一個月內，逾期銷毀)"
              checked={formData.sampleReturn === '自取(結案一個月內，逾期銷毀)'}
              onChange={handleInputChange}
              className="w-4 h-4 text-blue-600"
            />
            <div>
              <span className="font-medium text-gray-700">自取(結案一個月內，逾期銷毀)</span>
              <p className="text-xs text-gray-500">請於結案一個月內自行取回</p>
            </div>
          </label>
        </div>
      </div>


      {/* 服務類別勾選 */}
      <div className="border-2 border-blue-300 rounded-lg p-6 bg-blue-50">
        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Check size={20} className="text-blue-600" />
          請勾選需要的服務類別 <span className="text-red-600">*</span>
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          💡 選擇後，下一步將自動帶入對應的表單項目
        </p>
        <div className="grid grid-cols-2 gap-3">
          {availableServiceCategories.map((category) => (
            <label
              key={category.id}
              className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                formData.selectedServiceCategories.includes(category.value)
                  ? 'border-blue-500 bg-blue-100'
                  : 'border-gray-300 bg-white hover:border-blue-300'
              }`}
            >
              <input
                type="checkbox"
                checked={formData.selectedServiceCategories.includes(category.value)}
                onChange={() => handleServiceCategoryToggle(category.value)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="font-medium text-gray-700">{category.label}</span>
            </label>
          ))}
        </div>
        {formData.selectedServiceCategories.length > 0 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">
              ✅ 已選擇 {formData.selectedServiceCategories.length} 個服務類別：
              <span className="font-semibold ml-2">
                {formData.selectedServiceCategories.join('、')}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // 渲染步驟2：委託內容
  // 3️⃣ 修改後的 renderStep2
// 修改 renderStep2 中的提示訊息
const renderStep2 = () => {
  const totalSequencing = calculateTotalSequencing();
  const extractionType = getExtractionType();
  
  return (
    <div className="space-y-6">
      <div className="border-2 border-blue-300 rounded-lg p-6 bg-blue-50">
        <h3 className="text-xl font-bold text-gray-800 mb-4">委託內容</h3>
        
        {/* 🆕 顯示萃取類型提示 */}
        {extractionType && (
          <div className={`mb-4 p-3 rounded-lg border-2 ${
            extractionType === 'DNA' 
              ? 'bg-blue-50 border-blue-300' 
              : extractionType === 'RNA'
              ? 'bg-green-50 border-green-300'
              : 'bg-yellow-50 border-yellow-300'
          }`}>
            <p className="text-sm font-medium">
              {extractionType === 'DNA' && (
                <>
                  🧬 已選擇 <span className="font-bold">DNA 萃取</span>，建庫服務將只顯示 DNA 相關選項（排除 L-RN 開頭）
                </>
              )}
              {extractionType === 'RNA' && (
                <>
                  🧬 已選擇 <span className="font-bold">RNA 萃取</span>（如 Q-ER03），建庫服務將只顯示 <span className="font-bold">L-RN 開頭</span>的 RNA 相關選項
                </>
              )}
              {extractionType === 'MIXED' && (
                <>
                  🧬 已選擇 <span className="font-bold">DNA 和 RNA 萃取</span>，建庫服務顯示全部選項
                </>
              )}
            </p>
          </div>
        )}
        
        <p className="text-sm text-gray-600 mb-6">
          📋 請填寫您在步驟1選擇的各項服務類別詳細資訊
        </p>
        
        {formData.serviceItems.map((item, index) => (
          <div key={index} className="mb-6 p-4 bg-white rounded-lg border-2 border-gray-200">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-blue-700">
                  {item.category}
                </h4>
              </div>
              <div className="h-px bg-gray-200 mb-4"></div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    服務品項與數量 <span className="text-red-600">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => addService(index)}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 px-3 py-1 rounded hover:bg-blue-50"
                  >
                    <Plus size={16} />
                    新增品項
                  </button>
                </div>
                
                {item.services.map((serviceItem, serviceIndex) => {
                  // 🆕 動態獲取當前可用的服務選項
                  const availableOptions = item.category === '建庫服務 (L)' 
                    ? getFilteredLibraryServices() 
                    : serviceOptionsByCategory[item.category] || [];
                  
                  // 🆕 檢查當前選擇的服務是否還在可用列表中
                  const isCurrentServiceAvailable = availableOptions.some(
                    opt => opt.value === serviceItem.service
                  );
                  
                  return (
                    <div key={serviceIndex} className="space-y-2">
                      <div className="flex gap-2 items-start bg-gray-50 p-3 rounded border border-gray-200">
                        <div className="flex-1">
  {/* 🆕 使用可搜尋的下拉選單 */}
  <SearchableSelect
    value={serviceItem.service}
    options={[
      { value: '', description: '請選擇服務品項' },
      ...availableOptions
    ]}
    onChange={(value) => handleServiceChange(index, serviceIndex, 'service', value)}
    placeholder="請輸入或選擇服務品項"
    itemIndex={index}
    serviceIndex={serviceIndex}
  />
                          
                          {/* 🆕 如果之前選擇的服務現在不可用，顯示警告 */}
                          {serviceItem.service && !isCurrentServiceAvailable && (
                            <p className="text-xs text-red-600 mt-1">
                              ⚠️ 此服務與目前選擇的萃取類型不符，請重新選擇
                            </p>
                          )}
                        </div>
                        <div className="w-32">
                          <input
                            type="number"
                            value={serviceItem.quantity}
                            onChange={(e) => handleServiceChange(index, serviceIndex, 'quantity', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            placeholder="數量"
                            min="1"
                          />
                        </div>
                        {item.services.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeService(index, serviceIndex)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded transition"
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>
                      
                      {/* 顯示選中服務的說明 */}
                      {serviceItem.service && isCurrentServiceAvailable && (
                        <div className="ml-3 px-3 py-2 bg-blue-50 border-l-4 border-blue-400 text-sm text-gray-700">
                          <span className="font-semibold text-blue-700">說明：</span>
                          {availableOptions.find(opt => opt.value === serviceItem.service)?.description || '無說明'}
                          
                          {/* 顯示單項定序量 */}
                          {item.category === '定序服務 (S)' && sequencingDataMap[serviceItem.service] && (
                            <div className="mt-2 pt-2 border-t border-blue-200">
                              <span className="font-semibold text-green-700">定序量：</span>
                              <span className="text-green-600 ml-2">
                                {sequencingDataMap[serviceItem.service]} GB/個 × {serviceItem.quantity || 0} = 
                                <span className="font-bold ml-1">
                                  {(sequencingDataMap[serviceItem.service] * (parseInt(serviceItem.quantity) || 0)).toLocaleString()} GB
                                </span>
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
        
        {/* 定序量總計顯示 */}
        {totalSequencing > 0 && (
          <div className="mt-6 border-2 border-green-400 rounded-lg p-4 bg-gradient-to-r from-green-50 to-emerald-50 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                  📊 總定序量
                </span>
                <p className="text-xs text-gray-600 mt-1">
                  根據您選擇的定序服務自動計算
                </p>
              </div>
              <span className="text-3xl font-bold text-green-600">
                {totalSequencing.toLocaleString()} GB
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

  // 渲染步驟3：送測樣品資訊 (因為太長，這裡簡化顯示部分內容)
  const renderStep3 = () => {
  const totalSequencing = calculateTotalSequencing(); // Step2 的總定序量
  const expectedSequencing = calculateExpectedSequencing(); // Step3 樣本的預期定序量
  const isOverLimit = expectedSequencing > totalSequencing; // 是否超過    
  
  return (
    <div className="space-y-6">
      <div className="border-2 border-green-300 rounded-lg p-6 bg-green-50">
        <h3 className="text-xl font-bold text-gray-800 mb-6">送測樣品資訊</h3>
        
        {/* 🆕 定序量比對顯示（放在最上方） */}
        {totalSequencing > 0 && formData.sampleType !== '無送樣' && (
          <div className={`mb-6 border-2 rounded-lg p-4 ${
            isOverLimit 
              ? 'bg-red-50 border-red-400' 
              : expectedSequencing > 0 
              ? 'bg-green-50 border-green-400' 
              : 'bg-gray-50 border-gray-300'
          }`}>
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              📊 定序量檢查
            </h4>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white p-3 rounded border">
                <div className="text-gray-600 mb-1">委託定序量（Step2）</div>
                <div className="text-2xl font-bold text-blue-600">
                  {totalSequencing.toLocaleString()} GB
                </div>
              </div>
              
              <div className="bg-white p-3 rounded border">
                <div className="text-gray-600 mb-1">樣本預期定序量</div>
                <div className={`text-2xl font-bold ${
                  isOverLimit ? 'text-red-600' : 'text-green-600'
                }`}>
                  {expectedSequencing.toLocaleString()} GB
                </div>
              </div>
            </div>
            
            {/* 狀態提示 */}
            {expectedSequencing === 0 ? (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-300 rounded text-sm text-yellow-800">
                ⚠️ 尚未填寫樣本的預期定序量
              </div>
            ) : isOverLimit ? (
              <div className="mt-3 p-3 bg-red-100 border border-red-400 rounded text-sm">
                <div className="font-semibold text-red-800 mb-1">
                  ❌ 預期定序量超過委託量！
                </div>
                <div className="text-red-700">
                  超出 <span className="font-bold">{(expectedSequencing - totalSequencing).toLocaleString()} GB</span>
                  ，請調整樣本預期定序量或增加 Step2 的定序服務數量。
                </div>
              </div>
            ) : (
              <div className="mt-3 p-3 bg-green-100 border border-green-400 rounded text-sm">
                <div className="font-semibold text-green-800 mb-1">
                  ✅ 定序量配置正常
                </div>
                <div className="text-green-700">
                  剩餘 <span className="font-bold">{(totalSequencing - expectedSequencing).toLocaleString()} GB</span> 可用
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* 原有的樣本資訊 */}
        <div className="flex items-center justify-between mb-3">
          <h5 className="font-semibold text-gray-700">樣本資訊</h5>
        </div>        
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            樣品類型 <span className="text-red-600">*</span>
          </label>
          <select
            name="sampleType"
            value={formData.sampleType}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option>無送樣</option>
            <option>Library</option>
            <option>DNA</option>
            <option>RNA</option>
            <option>Cell</option>
            <option>Blood</option>
            <option>其他</option>
          </select>
        {/* 🆕 當選擇「其他」時顯示輸入框 */}
        {formData.sampleType === '其他' && (
          <input
            type="text"
            name="sampleTypeOther"
            value={formData.sampleTypeOther}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 mt-2"
            placeholder="請說明樣品類型"
          />
        )}          
        </div>
        
        {/* Library 送件資訊 */}
        {formData.sampleType === 'Library' && (
          <div className="col-span-2 mt-4 border-2 border-blue-300 rounded-lg p-6 bg-blue-50">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-gray-800">Library 送件資訊</h4>
              <div className="flex gap-2">
                <input
                  ref={excelUploadRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="text-xs text-green-600 hover:text-green-800 flex items-center gap-1 px-3 py-2 rounded hover:bg-green-50 border border-green-300"
                >
                  <Download size={14} />
                  下載 Excel 範本
                </button>
                <button
                  type="button"
                  onClick={() => excelUploadRef.current?.click()}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 px-3 py-2 rounded hover:bg-blue-50 border border-blue-300"
                >
                  <Upload size={14} />
                  上傳 Excel
                </button>
              </div>
            </div>
          
            {/* 🆕 拖拉上傳區域 */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`mb-4 p-43 border-2 border-dashed rounded-lg transition-all ${
                isDragging 
                  ? 'border-blue-500 bg-blue-100 scale-105' 
                  : 'border-blue-300 bg-white hover:border-blue-400 hover:bg-blue-50'
              }`}
            >
              <div className="text-center">
                <Upload size={48} className={`mx-auto mb-2 ${isDragging ? 'text-blue-600' : 'text-blue-400'}`} />
                <p className="text-sm font-medium text-gray-700 mb-1">
                  {isDragging ? '放開以上傳檔案' : '拖曳 Excel 檔案到這裡'}
                </p>
                <p className="text-xs text-gray-500">
                  或點擊上方「上傳 Excel」按鈕選擇檔案
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  支援格式：.xlsx, .xls
                </p>
              </div>
    </div>            
            {/* 濃度測定方式 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                濃度測定方式 <span className="text-red-600">*</span>
              </label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 px-4 py-2 border-2 rounded-lg cursor-pointer transition hover:bg-blue-100">
                  <input
                    type="radio"
                    name="libraryConcMethod"
                    value="Qubit"
                    checked={formData.libraryInfo.concMethod === 'Qubit'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      libraryInfo: { ...prev.libraryInfo, concMethod: e.target.value }
                    }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium">Qubit</span>
                </label>
                
                <label className="flex items-center gap-2 px-4 py-2 border-2 rounded-lg cursor-pointer transition hover:bg-blue-100">
                  <input
                    type="radio"
                    name="libraryConcMethod"
                    value="qPCR"
                    checked={formData.libraryInfo.concMethod === 'qPCR'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      libraryInfo: { ...prev.libraryInfo, concMethod: e.target.value }
                    }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium">qPCR</span>
                </label>
                
                <label className="flex items-center gap-2 px-4 py-2 border-2 rounded-lg cursor-pointer transition hover:bg-blue-100">
                  <input
                    type="radio"
                    name="libraryConcMethod"
                    value="PicoGreen"
                    checked={formData.libraryInfo.concMethod === 'PicoGreen'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      libraryInfo: { ...prev.libraryInfo, concMethod: e.target.value }
                    }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium">PicoGreen</span>
                </label>
              </div>
            </div>
            
            <div className="mb-4 text-xs text-gray-600 bg-blue-50 p-2 rounded border border-blue-200">
              📌 使用說明：
              <br/>• 點擊「下載 Excel 範本」取得包含兩個工作表的範本檔案
              <br/>• 在範本中填寫 Sample Sheet 和 Library Sample Sheet 資料
              <br/>• 點擊「上傳 Excel」自動匯入兩個表格的資料
              <br/>• 也可以使用各表格上的「貼上資料」功能單獨匯入
            </div>
            
            {/* Sample Sheet */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-semibold text-gray-700">Sample Sheet</h5>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={clearSampleSheet}
                    className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 border border-red-300"
                  >
                    <RotateCcw size={14} />
                    清空
                  </button>
                  <button
                    type="button"
                    onClick={addLibrarySampleSheetRow}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-100 border border-blue-300"
                  >
                    <Plus size={14} />
                    新增樣本
                  </button>
                </div>
              </div>
              
              <div className="mb-2 text-xs text-gray-500 bg-yellow-50 p-2 rounded border border-yellow-200">
                💡 提示：
                <br/>• 複製 Excel 資料前，請先確認沒有合併的儲存格
                <br/>• 從 Sample_Name 欄位開始複製（不含序號和標題）
                <br/>• Library 欄位可輸入或從下拉選單選擇（建議來自 Sample Sheet 的 Sample Name）
                <br/>• 複製貼上時 Library 欄位也會自動填入
                <br/>• 點擊表格任一儲存格後按 Ctrl+V 貼上，系統會自動新增行數
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2">序號</th>
                      <th className="border p-2">Sample_Name*</th>
                      <th className="border p-2">Tube Label*</th>
                      <th className="border p-2">Conc* (ng/ul)</th>
                      <th className="border p-2">Vol* (uL)</th>
                      <th className="border p-2">NGS上機濃度 (pM)</th>
                      <th className="border p-2">預期定序量</th>
                      <th className="border p-2">備註</th>
                      <th className="border p-2">操作</th>
                    </tr>
                  </thead>
                  <tbody onPaste={(e) => handleTablePaste(e, 0)}>
                    {formData.libraryInfo.sampleSheet.map((row, idx) => (
                      <tr key={idx} className="bg-white">
                        <td className="border p-2 text-center">{idx + 1}</td>
                        <td className="border p-2">
                          <input
                            type="text"
                            value={row.sampleName}
                            onChange={(e) => handleLibrarySampleSheetChange(idx, 'sampleName', e.target.value)}
                            className="w-full px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="border p-2">
                          <input
                            type="text"
                            value={row.tubeLabel}
                            onChange={(e) => handleLibrarySampleSheetChange(idx, 'tubeLabel', e.target.value)}
                            className="w-full px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="border p-2">
                          <input
                            type="number"
                            value={row.conc}
                            onChange={(e) => handleLibrarySampleSheetChange(idx, 'conc', e.target.value)}
                            className="w-full px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="border p-2">
                          <input
                            type="number"
                            value={row.vol}
                            onChange={(e) => handleLibrarySampleSheetChange(idx, 'vol', e.target.value)}
                            className="w-full px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="border p-2">
                          <input
                            type="number"
                            value={row.ngsConc}
                            onChange={(e) => handleLibrarySampleSheetChange(idx, 'ngsConc', e.target.value)}
                            className="w-full px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="border p-2">
                          <input
                            type="number"
                            value={row.expectedSeq}
                            onChange={(e) => handleLibrarySampleSheetChange(idx, 'expectedSeq', e.target.value)}
                            className="w-full px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="border p-2">
                          <input
                            type="text"
                            value={row.note}
                            onChange={(e) => handleLibrarySampleSheetChange(idx, 'note', e.target.value)}
                            className="w-full px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="border p-2 text-center">
                          {formData.libraryInfo.sampleSheet.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeLibrarySampleSheetRow(idx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Library Sample Sheet */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-semibold text-gray-700">Library Sample Sheet</h5>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={clearLibrarySheet}
                    className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 border border-red-300"
                  >
                    <RotateCcw size={14} />
                    清空
                  </button>
                  <button
                    type="button"
                    onClick={addLibraryDetailRow}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-100 border border-blue-300"
                  >
                    <Plus size={14} />
                    新增Library Sample
                  </button>
                </div>
              </div>
              
              <div className="mb-2 text-xs text-gray-500 bg-yellow-50 p-2 rounded border border-yellow-200">
                💡 提示：
                <br/>• 複製 Excel 資料前，請先確認沒有合併的儲存格
                <br/>• 從 Sample_Name 欄位開始複製（不含序號和標題）
                <br/>• 點擊表格任一儲存格後按 Ctrl+V 貼上，系統會自動新增行數
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2">序號</th>
                      <th className="border p-2">Sample_Name*</th>
                      <th className="border p-2">Library Prep Kit*</th>
                      <th className="border p-2">Index Adapter Kit</th>
                      <th className="border p-2">Set-Well Position</th>
                      <th className="border p-2">Index 1 (i7)*</th>
                      <th className="border p-2">Index 2 (i5)*</th>
                      <th className="border p-2">備註</th>
                      <th className="border p-2">Library</th>
                      <th className="border p-2">操作</th>
                    </tr>
                  </thead>
                  <tbody onPaste={(e) => handleLibraryDetailTablePaste(e, 0)}>
                    {formData.libraryInfo.librarySampleSheet.map((row, idx) => (
                      <tr key={idx} className="bg-white">
                        <td className="border p-2 text-center">{idx + 1}</td>
                        <td className="border p-2">
                          <input
                            type="text"
                            value={row.sampleName}
                            onChange={(e) => handleLibraryDetailChange(idx, 'sampleName', e.target.value)}
                            className="w-full px-2 py-1 border rounded text-xs"
                          />
                        </td>
                        <td className="border p-2">
                          <input
                            type="text"
                            value={row.libraryPrepKit}
                            onChange={(e) => handleLibraryDetailChange(idx, 'libraryPrepKit', e.target.value)}
                            className="w-full px-2 py-1 border rounded text-xs"
                          />
                        </td>
                        <td className="border p-2">
                          <input
                            type="text"
                            value={row.indexAdapterKit}
                            onChange={(e) => handleLibraryDetailChange(idx, 'indexAdapterKit', e.target.value)}
                            className="w-full px-2 py-1 border rounded text-xs"
                          />
                        </td>
                        <td className="border p-2">
                          <input
                            type="text"
                            value={row.setWellPosition}
                            onChange={(e) => handleLibraryDetailChange(idx, 'setWellPosition', e.target.value)}
                            className="w-full px-2 py-1 border rounded text-xs"
                          />
                        </td>
                        <td className="border p-2">
                          <input
                            type="text"
                            value={row.index1Seq}
                            onChange={(e) => handleLibraryDetailChange(idx, 'index1Seq', e.target.value)}
                            className="w-full px-2 py-1 border rounded text-xs"
                          />
                        </td>
                        <td className="border p-2">
                          <input
                            type="text"
                            value={row.index2Seq}
                            onChange={(e) => handleLibraryDetailChange(idx, 'index2Seq', e.target.value)}
                            className="w-full px-2 py-1 border rounded text-xs"
                          />
                        </td>
                        <td className="border p-2">
                          <input
                            type="text"
                            value={row.note}
                            onChange={(e) => handleLibraryDetailChange(idx, 'note', e.target.value)}
                            className="w-full px-2 py-1 border rounded text-xs"
                          />
                        </td>
                        <td className="border p-2">
                          <input
                            type="text"
                            list={`library-options-${idx}`}
                            value={row.library}
                            onChange={(e) => handleLibraryDetailChange(idx, 'library', e.target.value)}
                            className="w-full px-2 py-1 border rounded text-xs"
                            placeholder="輸入或選擇"
                          />
                          <datalist id={`library-options-${idx}`}>
                            {formData.libraryInfo.sampleSheet.map((sample, sIdx) => (
                              sample.sampleName && (
                                <option key={sIdx} value={sample.sampleName} />
                              )
                            ))}
                          </datalist>
                        </td>
                        <td className="border p-2 text-center">
                          {formData.libraryInfo.librarySampleSheet.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeLibraryDetailRow(idx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 電泳膠圖 */}
            {/* <div>
              <h5 className="font-semibold text-gray-700 mb-3">電泳膠圖</h5>
              <textarea
                value={formData.libraryInfo.gelImage}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  libraryInfo: { ...prev.libraryInfo, gelImage: e.target.value }
                }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white"
                placeholder="請描述電泳膠圖資訊或上傳圖片連結"
              />
            </div> */}
          </div>
        )}

        {/* Sample 送件資訊 */}
        {formData.sampleType !== 'Library' && formData.sampleType !== '無送樣' && (
          <div className="col-span-2 mt-4 border-2 border-green-300 rounded-lg p-6 bg-green-50">
    <div className="flex items-center justify-between mb-4">
      <h4 className="text-lg font-bold text-gray-800">
        {formData.sampleType} 送件資訊
      </h4>

          <div className="flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={downloadSampleTemplate}
              className="text-sm px-3 py-2 border border-green-400 rounded-md text-green-700 hover:text-green-900 hover:bg-green-100 flex items-center gap-2 transition-all"
            >
              <Download size={16} />
              下載範本
            </button>
            <button
              type="button"
              onClick={() => excelUploadRef.current?.click()}
              className="text-sm px-3 py-2 border border-blue-400 rounded-md text-blue-700 hover:text-blue-900 hover:bg-blue-100 flex items-center gap-2 transition-all"
            >
              <Upload size={16} />
              上傳 Excel
            </button>
              </div>
              </div>

            <input
              ref={excelUploadRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelUpload}
              className="hidden"
            />
          {/* 🆕 拖拉上傳區域 */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`mb-4 p-6 border-2 border-dashed rounded-lg transition-all ${
              isDragging 
                ? 'border-green-500 bg-green-100 scale-105' 
                : 'border-green-300 bg-white hover:border-green-400 hover:bg-green-50'
            }`}
          >
            <div className="text-center">
              <Upload size={48} className={`mx-auto mb-2 ${isDragging ? 'text-green-600' : 'text-green-400'}`} />
              <p className="text-sm font-medium text-gray-700 mb-1">
                {isDragging ? '放開以上傳檔案' : '拖曳 Excel 檔案到這裡'}
              </p>
              <p className="text-xs text-gray-500 mb-2">
                或使用下方按鈕選擇檔案
              </p>
              <div className="flex gap-2 justify-center">      
              </div>
              <p className="text-xs text-gray-400 mt-2">
                支援格式：.xlsx, .xls
              </p>
            </div>
          </div>            
            <div className="mb-4 text-xs text-gray-500 bg-yellow-50 p-2 rounded border border-yellow-200">
              💡 提示：
              <br/>• Sample_Name 勿用數字開頭，不能空格，僅允許"-"、"_"符號
              <br/>• 測定方法請選擇 Qubit 或 Nanodrop
              <br/>• 點擊表格任一儲存格後按 Ctrl+V 貼上，系統會自動新增行數
            </div>

                     
            {/* 濃度測定方式 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                濃度測定方式 <span className="text-red-600">*</span>
              </label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 px-4 py-2 border-2 rounded-lg cursor-pointer transition hover:bg-green-100">
                  <input
                    type="radio"
                    name="sampleConcMethod"
                    value="Qubit"
                    checked={formData.sampleInfo.concMethod === 'Qubit'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      sampleInfo: { ...prev.sampleInfo, concMethod: e.target.value }
                    }))}
                    className="w-4 h-4 text-green-600"
                  />
                  <span className="text-sm font-medium">Qubit</span>
                </label>
                
                <label className="flex items-center gap-2 px-4 py-2 border-2 rounded-lg cursor-pointer transition hover:bg-green-100">
                  <input
                    type="radio"
                    name="sampleConcMethod"
                    value="Nanodrop"
                    checked={formData.sampleInfo.concMethod === 'Nanodrop'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      sampleInfo: { ...prev.sampleInfo, concMethod: e.target.value }
                    }))}
                    className="w-4 h-4 text-green-600"
                  />
                  <span className="text-sm font-medium">Nanodrop</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={downloadSampleTemplate}
                className="text-xs text-green-600 hover:text-green-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-green-50 border border-green-300"
              >
                <Download size={14} />
                下載範本
              </button>
              <button
                type="button"
                onClick={() => excelUploadRef.current?.click()}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 border border-blue-300"
              >
                <Upload size={14} />
                上傳 Excel
              </button>
              <button
                type="button"
                onClick={clearSampleInfoSheet}
                className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 border border-red-300"
              >
                <RotateCcw size={14} />
                清空
              </button>
              <button
                type="button"
                onClick={addSampleSheetRow}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-100 border border-blue-300"
              >
                <Plus size={14} />
                新增樣本
              </button>
            </div>
            <br/>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">序號</th>
                    <th className="border p-2">Sample_Name*</th>
                    <th className="border p-2">Tube Label*</th>
                    <th className="border p-2">預期定序量</th>
                    <th className="border p-2">Conc* (ng/ul)</th>
                    <th className="border p-2">Vol* (uL)</th>
                    <th className="border p-2">260/280</th>
                    <th className="border p-2">260/230</th>
                    <th className="border p-2">DQN/RQN</th>
                    <th className="border p-2">備註</th>
                    <th className="border p-2">操作</th>
                  </tr>
                </thead>
                <tbody onPaste={(e) => handleSampleTablePaste(e, 0)}>
                  {formData.sampleInfo.sampleSheet.map((row, idx) => (
                    <tr key={idx} className="bg-white">
                      <td className="border p-2 text-center">{idx + 1}</td>
                      <td className="border p-2">
                        <input
                          type="text"
                          value={row.sampleName}
                          onChange={(e) => handleSampleSheetChange(idx, 'sampleName', e.target.value)}
                          className="w-full px-2 py-1 border rounded"
                          placeholder="勿用數字開頭"
                        />
                      </td>
                      <td className="border p-2">
                        <input
                          type="text"
                          value={row.tubeLabel}
                          onChange={(e) => handleSampleSheetChange(idx, 'tubeLabel', e.target.value)}
                          className="w-full px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="border p-2">
                        <input
                          type="text"
                          value={row.expectedSeq}
                          onChange={(e) => handleSampleSheetChange(idx, 'expectedSeq', e.target.value)}
                          className="w-full px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="border p-2">
                        <input
                          type="number"
                          value={row.conc}
                          onChange={(e) => handleSampleSheetChange(idx, 'conc', e.target.value)}
                          className="w-full px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="border p-2">
                        <input
                          type="number"
                          value={row.vol}
                          onChange={(e) => handleSampleSheetChange(idx, 'vol', e.target.value)}
                          className="w-full px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="border p-2">
                        <input
                          type="number"
                          step="0.01"
                          value={row.ratio260280}
                          onChange={(e) => handleSampleSheetChange(idx, 'ratio260280', e.target.value)}
                          className="w-full px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="border p-2">
                        <input
                          type="number"
                          step="0.01"
                          value={row.ratio260230}
                          onChange={(e) => handleSampleSheetChange(idx, 'ratio260230', e.target.value)}
                          className="w-full px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="border p-2">
                        <input
                          type="number"
                          step="0.1"
                          value={row.dqnRqn}
                          onChange={(e) => handleSampleSheetChange(idx, 'dqnRqn', e.target.value)}
                          className="w-full px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="border p-2">
                        <input
                          type="text"
                          value={row.note}
                          onChange={(e) => handleSampleSheetChange(idx, 'note', e.target.value)}
                          className="w-full px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="border p-2 text-center">
                        {formData.sampleInfo.sampleSheet.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSampleSheetRow(idx)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 保存方式、樣品數量等 */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              保存方式 <span className="text-red-600">*</span>
            </label>
            <select
              name="preservationMethod"
              value={formData.preservationMethod}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option>Nuclease-free H2O</option>
              <option>Tris Buffer</option>
              <option>Trizol</option>
              <option>EDTA Tube(Blood)</option>
              <option>Tempus Tube(Blood)</option>
              <option>其他</option>
            </select>
          </div>
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    樣品數量 <span className="text-red-600">*</span>
  </label>
  <input
    type="number"
    name="sampleCount"
    value={formData.sampleCount}
    readOnly  // 🆕 唯讀，由系統自動計算
    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
    min="1"
  />
  <p className="text-xs text-gray-500 mt-1">
    💡 由系統自動計算（依據 Sample Sheet）
  </p>
</div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              物種 <span className="text-red-600"></span>
            </label>
            <select
              name="species"
              value={formData.species}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option>物種請選擇</option>
              <option>Human</option>
              <option>Mouse</option>
              <option>Rat</option>
              <option>其他</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              寄送方式 <span className="text-red-600">*</span>
            </label>
            <select
              name="shippingMethod"
              value={formData.shippingMethod}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option>冷凍(乾冰)</option>
              <option>冷藏</option>
              <option>常溫</option>
              <option>其他</option>
            </select>
          </div>
        </div>

        {/* 備註 */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            備註
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

  // 渲染步驟4：簽名確認
  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="border-2 border-purple-300 rounded-lg p-6 bg-purple-50">
        <h3 className="text-xl font-bold text-gray-800 mb-6">委託人簽名確認</h3>
        <div className="bg-white rounded-lg p-6 border-2 border-gray-200">
          {!formData.signature ? (
            <div className="text-center py-8">
              <div className="mb-4">
                <Edit3 size={48} className="mx-auto text-blue-600" />
              </div>
              <p className="text-gray-700 mb-2 font-medium">請簽名確認訂單內容無誤</p>
              <p className="text-sm text-gray-500 mb-6">
                支援手寫簽名 ✍️ 或上傳圖片 📤
              </p>
              <button
                type="button"
                onClick={() => setShowSignaturePad(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Edit3 size={20} />
                開始簽名
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-green-600 font-semibold flex items-center gap-2">
                  <Check size={24} />
                  已完成簽名
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSignaturePad(true)}
                    className="px-4 py-2 text-sm border-2 border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50"
                  >
                    重新簽名
                  </button>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="px-4 py-2 text-sm text-red-600 border-2 border-red-300 rounded-lg hover:bg-red-50"
                  >
                    清除簽名
                  </button>
                </div>
              </div>
              <div className="border-2 border-gray-300 rounded-lg p-4">
                <img 
                  src={formData.signature} 
                  alt="委託人簽名" 
                  className="max-w-full h-auto mx-auto"
                  style={{ maxHeight: '150px' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // 渲染步驟5：預覽與提交
// 渲染步驟5：預覽與提交
const renderStep5 = () => (
  <div className="space-y-6">
    <div className="border-2 border-indigo-300 rounded-lg p-6 bg-indigo-50">
      <h3 className="text-xl font-bold text-gray-800 mb-6">訂單預覽</h3>
      
      <div className="bg-white rounded-lg p-6 space-y-6">
        
        {/* 1. 基本資訊 */}
        <div className="border-b pb-4">
          <h4 className="font-semibold text-gray-700 mb-3 text-lg">📋 基本資訊</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-gray-600 font-medium">業務人員：</span>
              <span className="text-gray-800">{formData.salesPerson}</span>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-gray-600 font-medium">單位：</span>
              <span className="text-gray-800">{formData.organization}</span>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-gray-600 font-medium">負責人/主持人：</span>
              <span className="text-gray-800">{formData.principalInvestigator}</span>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-gray-600 font-medium">聯絡人：</span>
              <span className="text-gray-800">{formData.contactPerson}</span>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-gray-600 font-medium">聯絡電話：</span>
              <span className="text-gray-800">{formData.contactPhone || '未填寫'}</span>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-gray-600 font-medium">Email：</span>
              <span className="text-gray-800">{formData.email}</span>
            </div>
            {formData.address && (
              <div className="bg-gray-50 p-2 rounded col-span-2">
                <span className="text-gray-600 font-medium">地址：</span>
                <span className="text-gray-800">{formData.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* 2. 發票資訊 */}
        <div className="border-b pb-4">
          <h4 className="font-semibold text-gray-700 mb-3 text-lg">🧾 發票資訊</h4>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-gray-600 font-medium">抬頭：</span>
              <span className="text-gray-800">{formData.invoiceTitle || '未填寫'}</span>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-gray-600 font-medium">統編：</span>
              <span className="text-gray-800">{formData.taxId || '未填寫'}</span>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-gray-600 font-medium">發票聯數：</span>
              <span className="text-gray-800">{formData.invoiceCopies}</span>
            </div>
          </div>
        </div>

        {/* 3. 數據交付資訊 */}
        <div className="border-b pb-4">
          <h4 className="font-semibold text-gray-700 mb-3 text-lg">💾 數據交付資訊</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-gray-600 font-medium">提供方式：</span>
              <span className="text-gray-800">{formData.dataDeliveryMethod}</span>
            </div>
            {formData.dataDeliveryMethod === '國網中心下載' && formData.nchcAccount && (
              <div className="bg-gray-50 p-2 rounded">
                <span className="text-gray-600 font-medium">國網帳號：</span>
                <span className="text-gray-800">{formData.nchcAccount}</span>
              </div>
            )}
            {formData.dataDeliveryMethod === 'HDD由專人遞送' && (
              <>
                {formData.deliveryAddress && (
                  <div className="bg-gray-50 p-2 rounded col-span-2">
                    <span className="text-gray-600 font-medium">交貨地址：</span>
                    <span className="text-gray-800">{formData.deliveryAddress}</span>
                  </div>
                )}
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-600 font-medium">收件人：</span>
                  <span className="text-gray-800">{formData.recipient || '未填寫'}</span>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-600 font-medium">收件電話：</span>
                  <span className="text-gray-800">{formData.recipientPhone || '未填寫'}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 4. 急件與樣品返還 */}
        <div className="border-b pb-4">
          <h4 className="font-semibold text-gray-700 mb-3 text-lg">⚡ 急件與樣品返還</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className={`p-3 rounded border-2 ${formData.isUrgent ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200'}`}>
              <span className="text-gray-600 font-medium">急件狀態：</span>
              <span className={`font-bold ml-2 ${formData.isUrgent ? 'text-red-600' : 'text-green-600'}`}>
                {formData.isUrgent ? '急件（費用+10%）' : '正常件'}
              </span>
            </div>
            <div className="bg-gray-50 p-3 rounded border-2 border-gray-200">
              <span className="text-gray-600 font-medium">樣品返還：</span>
              <span className="text-gray-800 ml-2">{formData.sampleReturn}</span>
            </div>
          </div>
        </div>

        {/* 5. 委託內容 */}
        <div className="border-b pb-4">
          <h4 className="font-semibold text-gray-700 mb-3 text-lg">📦 委託內容</h4>
          <div className="space-y-3">
            {formData.serviceItems.map((item, idx) => (
              <div key={idx} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h5 className="font-semibold text-blue-800 mb-2">{item.category}</h5>
                <div className="space-y-2">
                  {item.services.map((service, sIdx) => (
                    service.service && (
                      <div key={sIdx} className="flex justify-between items-center text-sm bg-white p-2 rounded">
                        <span className="text-gray-700">{service.service}</span>
                        <span className="font-semibold text-blue-600">數量：{service.quantity}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. 送測樣品資訊 */}
        <div className="border-b pb-4">
          <h4 className="font-semibold text-gray-700 mb-3 text-lg">🧬 送測樣品資訊</h4>
          
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-gray-600 font-medium">樣品類型：</span>
              <span className="text-gray-800 font-semibold ml-2">{formData.sampleType}</span>
            </div>
            {formData.sampleType !== '無送樣' && (
              <>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-600 font-medium">樣品數量：</span>
                  <span className="text-gray-800 ml-2">{formData.sampleCount}</span>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-600 font-medium">保存方式：</span>
                  <span className="text-gray-800 ml-2">{formData.preservationMethod}</span>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-600 font-medium">物種：</span>
                  <span className="text-gray-800 ml-2">{formData.species}</span>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-600 font-medium">寄送方式：</span>
                  <span className="text-gray-800 ml-2">{formData.shippingMethod}</span>
                </div>
                {formData.sampleType === 'Library' && (
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="text-gray-600 font-medium">濃度測定：</span>
                    <span className="text-gray-800 ml-2">{formData.libraryInfo.concMethod}</span>
                  </div>
                )}
                {formData.sampleType !== 'Library' && formData.sampleType !== '無送樣' && (
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="text-gray-600 font-medium">濃度測定：</span>
                    <span className="text-gray-800 ml-2">{formData.sampleInfo.concMethod}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Library Sample Sheet 預覽 */}
          {formData.sampleType === 'Library' && formData.libraryInfo.sampleSheet.some(row => row.sampleName) && (
            <div className="mt-4">
              <h5 className="font-semibold text-gray-700 mb-2">Sample Sheet</h5>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-blue-100">
                      <th className="border p-2">序號</th>
                      <th className="border p-2">Sample_Name</th>
                      <th className="border p-2">Tube Label</th>
                      <th className="border p-2">Conc (ng/ul)</th>
                      <th className="border p-2">Vol (uL)</th>
                      <th className="border p-2">NGS上機濃度</th>
                      <th className="border p-2">預期定序量</th>
                      <th className="border p-2">備註</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.libraryInfo.sampleSheet
                      .filter(row => row.sampleName)
                      .map((row, idx) => (
                        <tr key={idx} className="bg-white">
                          <td className="border p-2 text-center">{idx + 1}</td>
                          <td className="border p-2">{row.sampleName}</td>
                          <td className="border p-2">{row.tubeLabel}</td>
                          <td className="border p-2">{row.conc}</td>
                          <td className="border p-2">{row.vol}</td>
                          <td className="border p-2">{row.ngsConc}</td>
                          <td className="border p-2">{row.expectedSeq}</td>
                          <td className="border p-2">{row.note}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {formData.libraryInfo.librarySampleSheet.some(row => row.sampleName) && (
                <div className="mt-4">
                  <h5 className="font-semibold text-gray-700 mb-2">Library Sample Sheet</h5>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-blue-100">
                          <th className="border p-2">序號</th>
                          <th className="border p-2">Sample_Name</th>
                          <th className="border p-2">Library Prep Kit</th>
                          <th className="border p-2">Index Adapter Kit</th>
                          <th className="border p-2">Set-Well Position</th>
                          <th className="border p-2">Index 1 (i7)</th>
                          <th className="border p-2">Index 2 (i5)</th>
                          <th className="border p-2">備註</th>
                          <th className="border p-2">Library</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.libraryInfo.librarySampleSheet
                          .filter(row => row.sampleName)
                          .map((row, idx) => (
                            <tr key={idx} className="bg-white">
                              <td className="border p-2 text-center">{idx + 1}</td>
                              <td className="border p-2">{row.sampleName}</td>
                              <td className="border p-2">{row.libraryPrepKit}</td>
                              <td className="border p-2">{row.indexAdapterKit}</td>
                              <td className="border p-2">{row.setWellPosition}</td>
                              <td className="border p-2">{row.index1Seq}</td>
                              <td className="border p-2">{row.index2Seq}</td>
                              <td className="border p-2">{row.note}</td>
                              <td className="border p-2">{row.library}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sample (DNA/RNA/Cell/Blood) Sheet 預覽 */}
          {formData.sampleType !== 'Library' && formData.sampleType !== '無送樣' && 
           formData.sampleInfo.sampleSheet.some(row => row.sampleName) && (
            <div className="mt-4">
              <h5 className="font-semibold text-gray-700 mb-2">Sample Sheet</h5>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-green-100">
                      <th className="border p-2">序號</th>
                      <th className="border p-2">Sample_Name</th>
                      <th className="border p-2">Tube Label</th>
                      <th className="border p-2">預期定序量</th>
                      <th className="border p-2">Conc (ng/ul)</th>
                      <th className="border p-2">Vol (uL)</th>
                      <th className="border p-2">260/280</th>
                      <th className="border p-2">260/230</th>
                      <th className="border p-2">DQN/RQN</th>
                      <th className="border p-2">備註</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.sampleInfo.sampleSheet
                      .filter(row => row.sampleName)
                      .map((row, idx) => (
                        <tr key={idx} className="bg-white">
                          <td className="border p-2 text-center">{idx + 1}</td>
                          <td className="border p-2">{row.sampleName}</td>
                          <td className="border p-2">{row.tubeLabel}</td>
                          <td className="border p-2">{row.expectedSeq}</td>
                          <td className="border p-2">{row.conc}</td>
                          <td className="border p-2">{row.vol}</td>
                          <td className="border p-2">{row.ratio260280}</td>
                          <td className="border p-2">{row.ratio260230}</td>
                          <td className="border p-2">{row.dqnRqn}</td>
                          <td className="border p-2">{row.note}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 備註 */}
          {formData.notes && (
            <div className="mt-4 bg-yellow-50 p-3 rounded border border-yellow-200">
              <span className="text-gray-600 font-medium">📝 備註：</span>
              <p className="text-gray-800 mt-1">{formData.notes}</p>
            </div>
          )}
        </div>

        {/* 7. 簽名確認 */}
        <div>
          <h4 className="font-semibold text-gray-700 mb-3 text-lg">✍️ 簽名確認</h4>
          {formData.signature ? (
            <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
              <div className="flex items-center gap-2 mb-2">
                <Check size={20} className="text-green-600" />
                <span className="text-green-600 font-semibold">已完成簽名</span>
              </div>
              <img 
                src={formData.signature} 
                alt="委託人簽名" 
                className="max-w-full h-auto border-2 border-gray-300 rounded bg-white p-2"
                style={{ maxHeight: '120px' }}
              />
            </div>
          ) : (
            <div className="border-2 border-red-300 rounded-lg p-4 bg-red-50 text-center">
              <AlertCircle size={24} className="mx-auto text-red-600 mb-2" />
              <span className="text-red-600 font-semibold">尚未簽名</span>
            </div>
          )}
        </div>

      </div>

      <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
        <p className="text-sm text-gray-700 flex items-center gap-2">
          <AlertCircle size={18} />
          ⚠️ 請確認所有資訊無誤後再提交訂單。提交後可匯出 Excel 檔案。
        </p>
      </div>
    </div>
  </div>
);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-2xl p-8">
        {/* 標題 */}
        <div className="text-center mb-8 border-b pb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            台基盟生技股份有限公司
          </h1>
          <h2 className="text-xl text-gray-600 mb-2">
            委託服務同意書/訂購確認單
          </h2>
          <p className="text-sm text-red-600">標 * 為必填之欄位</p>
        </div>

        {/* 步驟進度條 */}
        <StepIndicator currentStep={currentStep} steps={steps} />

        {/* 表單內容 */}
        <div className="min-h-[500px]">
          {currentStep === 0 && renderStep0()}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
        </div>

        {/* 導航按鈕 */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t">
          <button
            onClick={prevStep}
            disabled={currentStep === 0} 
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
              currentStep === 0 /* 🆕 改為 0 */
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-500 text-white hover:bg-gray-600'
            }`}
          >
            <ChevronLeft size={20} />
            上一步
          </button>

          <div className="text-sm text-gray-500">
            步驟 {currentStep + 1} / {steps.length} {/* 🆕 顯示時 +1 */}
          </div>

          {currentStep < steps.length - 1 ? ( 
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
            >
              下一步
              <ChevronRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition"
            >
              <Send size={20} />
              提交訂單
            </button>
          )}
        </div>

        {/* 訊息提示 */}
        {message && (
          <div className={`mt-4 p-4 rounded-lg flex items-center gap-2 ${
            submitted || message.includes('成功') 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-yellow-50 border border-yellow-200 text-yellow-800'
          }`}>
            <AlertCircle size={20} />
            <span>{message}</span>
          </div>
        )}

        {/* 匯出按鈕（提交後顯示） */}
        {exportReady && (
          <button
            onClick={exportToExcel}
            className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition"
          >
            <Download size={20} />
            匯出 Excel
          </button>
        )}
      </div>

      {/* 簽名板彈窗 */}
      {showSignaturePad && (
        <SignaturePad
          title="委託人簽名確認"
          onSave={handleSignatureSave}
          onCancel={handleSignatureCancel}
        />
      )}
    </div>
  );
};

export default TGIAOrderForm;