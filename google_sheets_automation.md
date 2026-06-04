# 📊 Google Sheets + WhatsApp + Email Automation Guide (Gujarati)

આ માર્ગદર્શિકા ગુગલ શીટ્સ (Google Sheets) નો ઉપયોગ કરીને ખૂબ જ ઓછા ખર્ચે (નહિવત ખર્ચે) પીડીએફ રિપોર્ટ જનરેટ કરવા અને તેને ઓટોમેટિક WhatsApp અને ઈમેલ પર મોકલવા માટેની રીત દર્શાવે છે.

---

## 🛠️ ઓટોમેશન કઈ રીતે કામ કરશે?
1. તમે **Google Sheet** માં સભ્યની વિગત (નામ, હપ્તો, ઉપાડ, દંડ વગેરે) લખશો.
2. શીટમાં એક **"રિપોર્ટ મોકલો"** બટન હશે. તેના પર ક્લિક કરતા જ:
   * Google Apps Script દરેક રો (Row) નો ડેટા રીડ કરશે.
   * આપમેળે સુંદર **PDF Receipt** બનાવીને તમારા Google Drive માં સેવ કરશે.
   * સભ્યના રજીસ્ટર્ડ **ઈમેલ પર PDF મોકલશે** (તદ્દન મફત).
   * સભ્યના **WhatsApp પર મેસેજ** અને પીડીએફની લિંક મોકલશે.

---

## 📝 1. Google Sheet ની બનાવટ (Columns)
તમારી ગૂગલ શીટમાં નીચે મુજબની કોલમ્સ બનાવો:

| A (Fata No) | B (Name) | C (Mobile) | D (Email) | E (Hapto) | F (Upad) | G (Dand) | H (Total) | I (Status) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| ૧૦૧ | રમેશભાઈ | 9876543210 | ramesh@mail.com | 1000 | 0 | 50 | =E2-F2+G2 | `Pending` |

> [!TIP]
> `Total` કોલમમાં ફોર્મ્યુલા વાપરો: `=E2-F2+G2` જેથી ઓટોમેટિક ગણતરી થાય.

---

## 📄 2. ગૂગલ ડોક ટેમ્પલેટ (Google Doc Template)
ગૂગલ ડ્રાઇવમાં એક નવું ગૂગલ ડોક્યુમેન્ટ બનાવો અને તેમાં તમારું બિલ/રસીદનું સુંદર ફોર્મેટ ડિઝાઇન કરો. જેમાં નીચે મુજબના ટેગ્સ લખો:

```text
==================================================
              બાપા સીતારામ મંડળ
==================================================
ખાતા નંબર: {{FataNo}}
સભ્યનું નામ: {{Name}}
તારીખ: {{Date}}
--------------------------------------------------
૧. માસિક હપ્તો: ₹{{Hapto}}
૨. ઉપાડ રકમ: ₹{{Upad}}
૩. વ્યાજ / દંડ: ₹{{Dand}}
--------------------------------------------------
કુલ જમા રકમ: ₹{{Total}}
==================================================
આભાર સહ,
બાપા સીતારામ મંડળ મેનેજમેન્ટ
```
*નોંધ: આ ફાઇલ આઈડી (File ID) ને કોપી કરી લો (લિંકમાંથી `https://docs.google.com/document/d/[FILE_ID]/edit`).*

---

## ⚙️ 3. Google Apps Script (કોડ ફાઈલ)
તમારી ગુગલ શીટમાં જઈને **Extensions > Apps Script** પર ક્લિક કરો અને નીચેનો કોડ પેસ્ટ કરો:

```javascript
// CONFIGURATION
const DOC_TEMPLATE_ID = 'તમારો_GOOGLE_DOC_TEMPLATE_ID'; // અહિયાં ઉપરની ફાઈલનો આઈડી લખો
const FOLDER_ID = 'તમારો_GOOGLE_DRIVE_FOLDER_ID_WHERE_PDFS_SAVE'; // ડ્રાઈવના ફોલ્ડરનો આઈડી
const GMAIL_USER = 'your-email@gmail.com'; 

// WhatsApp Cloud API configuration (જો વાપરવું હોય તો)
const WHATSAPP_API_TOKEN = 'YOUR_META_WHATSAPP_TOKEN';
const WHATSAPP_PHONE_ID = 'YOUR_PHONE_NUMBER_ID';

function generateAndSendReports() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  // A2 થી ડેટા રીડ કરવાનું શરૂ કરીશું (પહેલી રો હેડર છે)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const fataNo = row[0];
    const name = row[1];
    const mobile = row[2];
    const email = row[3];
    const hapto = row[4];
    const upad = row[5];
    const dand = row[6];
    const total = row[7];
    const status = row[8];
    
    // જો સ્ટેટસ 'Pending' હોય તો જ મોકલવું
    if (status === 'Pending') {
      try {
        const pdfFile = createPDFReceipt(fataNo, name, hapto, upad, dand, total);
        
        // ૧. ઈમેલ ઓટોમેશન (તદ્દન મફત)
        if (email) {
          sendEmailWithAttachment(email, name, pdfFile);
        }
        
        // ૨. WhatsApp ઓટોમેશન
        if (mobile) {
          sendWhatsAppMessage(mobile, name, hapto, upad, dand, total, pdfFile.getUrl());
        }
        
        // મોકલાઈ ગયા પછી સ્ટેટસ 'Sent' કરવું
        sheet.getRange(i + 1, 9).setValue('Sent');
        SpreadsheetApp.flush();
      } catch (err) {
        Logger.log('Error processing row ' + (i+1) + ': ' + err.message);
        sheet.getRange(i + 1, 9).setValue('Error');
      }
    }
  }
}

// PDF બનાવવાનું ફંક્શન
function createPDFReceipt(fataNo, name, hapto, upad, dand, total) {
  const tempDocFile = DriveApp.getFileById(DOC_TEMPLATE_ID).makeCopy('Temp_' + name, DriveApp.getFolderById(FOLDER_ID));
  const doc = DocumentApp.openById(tempDocFile.getId());
  const body = doc.getBody();
  
  // ટેમ્પલેટ ટેગ્સ બદલવા
  body.replaceText('{{FataNo}}', fataNo);
  body.replaceText('{{Name}}', name);
  body.replaceText('{{Hapto}}', hapto);
  body.replaceText('{{Upad}}', upad);
  body.replaceText('{{Dand}}', dand);
  body.replaceText('{{Total}}', total);
  body.replaceText('{{Date}}', Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd-MM-yyyy'));
  
  doc.saveAndClose();
  
  // PDF માં કન્વર્ટ કરો
  const pdfBlob = tempDocFile.getAs(MimeType.PDF);
  const pdfFile = DriveApp.getFolderById(FOLDER_ID).createFile(pdfBlob).setName(name + '_Receipt.pdf');
  
  // કામચલાઉ ફાઈલ ડીલીટ કરવી
  tempDocFile.setTrashed(true);
  
  // PDF ફાઈલને પબ્લિકલી વ્યુ કરી શકાય તેવી બનાવવી (WhatsApp પર મોકલવા માટે)
  pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  return pdfFile;
}

// ઈમેલ મોકલવા માટે
function sendEmailWithAttachment(toEmail, name, pdfFile) {
  const subject = "બાપા સીતારામ મંડળ - માસિક અહેવાલ";
  const body = "આદરણીય સભ્યશ્રી " + name + ",\n\nબાપા સીતારામ મંડળ તરફથી આપનો ચાલુ મહિનાનો વિગતવાર હિસાબ બિડાણ PDF સ્વરૂપે મોકલેલ છે. આપ નીચે આપેલ પીડીએફ લિંક દ્વારા અથવા ડાઉનલોડ કરીને જોઈ શકો છો.\n\nઆભાર,\nબાપા સીતારામ મંડળ";
  
  MailApp.sendEmail({
    to: toEmail,
    subject: subject,
    body: body,
    attachments: [pdfFile.getAs(MimeType.PDF)]
  });
}

// WhatsApp મોકલવા માટે
function sendWhatsAppMessage(mobile, name, hapto, upad, dand, total, pdfUrl) {
  const text = `નમસ્તે ${name},\nતમારો હિસાબ:\nહપ્તો: ₹${hapto}\nઉપાડ: ₹${upad}\nદંડ: ₹${dand}\nકુલ જમા: ₹${total}\nપીડીએફ ડાઉનલોડ કરો: ${pdfUrl}\n\nઆભાર,\nબાપા સીતારામ મંડળ`;
  
  if (WHATSAPP_API_TOKEN && WHATSAPP_PHONE_ID) {
    const url = `https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_ID}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      to: "91" + mobile,
      type: "text",
      text: { body: text }
    };
    
    const options = {
      method: "post",
      contentType: "application/json",
      headers: { Authorization: "Bearer " + WHATSAPP_API_TOKEN },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    UrlFetchApp.fetch(url, options);
  } else {
    // ફ્રી વિકલ્પ: લોગ માં પ્રિન્ટ કરવું અથવા Web Link જનરેટ કરવી
    Logger.log("WhatsApp Link for Manual click: https://wa.me/91" + mobile + "?text=" + encodeURIComponent(text));
  }
}
```

---

## 🚀 આ સિસ્ટમના ફાયદા અને ખર્ચ
1. **સર્વર કોસ્ટ = ₹0 (Zero Server Cost)**: આ સિસ્ટમ સીધી ગૂગલ ક્લાઉડ પર ફ્રી ચાલે છે. તમારે કોઈ હોસ્ટિંગના પૈસા ચૂકવવાના રહેતા નથી.
2. **ઈમેલ કોસ્ટ = ₹0 (Free Emails)**: ગૂગલ દરરોજના ૫૦૦ ઈમેલ તદ્દન ફ્રી મોકલવા દે છે.
3. **ઓછી કડાકૂટ**: નોન-ટેકનિકલ યુઝર્સ માટે ડાયરેક્ટ એક્સેલ/ગૂગલ શીટમાં ટાઈપ કરવું ઘણું સહેલું પડે છે.
