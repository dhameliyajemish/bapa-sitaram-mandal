import React, { useState, useContext } from 'react';
import { AppDataContext } from '../context/AppDataContext';
import { MdAdd, MdDownload, MdMessage, MdEmail } from 'react-icons/md';
import axios from 'axios';

const API_URL = import.meta.env.DEV ? 'http://localhost:5000/api' : '/api';

const MonthlyEntry = () => {
  const { members, entries, addEntry, settings } = useContext(AppDataContext);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    memberId: '', month: selectedMonth,
    hapto: '', upad: '', vyaj: '', creditVyaj: '', dand: ''
  });

  const [broadcastEmailLoading, setBroadcastEmailLoading] = useState(false);
  const [broadcastWhatsAppLoading, setBroadcastWhatsAppLoading] = useState(false);

  const calculateMemberBalanceUpTo = (memberId, targetMonth) => {
    const member = members.find(m => String(m._id) === String(memberId));
    const openingBalance = member ? Number(member.openingBalance || 0) : 0;

    const memberEntries = entries.filter(e =>
      String(e.memberId?._id || e.memberId) === String(memberId)
    );
    if (memberEntries.length === 0) return openingBalance;

    const sortedEntries = [...memberEntries].sort((a, b) => a.month.localeCompare(b.month));
    const minMonth = sortedEntries[0].month;

    if (targetMonth.localeCompare(minMonth) < 0) return openingBalance;

    const entryMap = {};
    sortedEntries.forEach(e => {
      if (!entryMap[e.month]) entryMap[e.month] = [];
      entryMap[e.month].push(e);
    });

    let balance = openingBalance;
    let currentMonth = minMonth;

    const creditRate = settings?.creditInterestRate ?? 1;
    const debitRate = settings?.debitInterestRate ?? 1;

    while (currentMonth.localeCompare(targetMonth) <= 0) {
      const mMonthEntries = entryMap[currentMonth] || [];
      const hasExplicitCreditVyaj = mMonthEntries.some(e => Number(e.creditVyaj || 0) > 0);

      if (balance > 0) {
        if (!hasExplicitCreditVyaj) {
          balance = balance * (1 + creditRate / 100);
        }
      } else if (balance < 0) {
        balance = balance * (1 + debitRate / 100);
      }

      let net = 0;
      mMonthEntries.forEach(e => {
        net += Number(e.hapto || 0) - Number(e.upad || 0) + Number(e.vyaj || 0) + Number(e.creditVyaj || 0) + Number(e.dand || 0);
      });
      balance += net;

      // increment month YYYY-MM
      let [yr, mo] = currentMonth.split('-').map(Number);
      mo++;
      if (mo > 12) {
        mo = 1;
        yr++;
      }
      currentMonth = `${yr}-${String(mo).padStart(2, '0')}`;
    }

    return Math.round(balance * 100) / 100;
  };

  const getPreviousMonth = (monthStr) => {
    if (!monthStr) return '';
    let [yr, mo] = monthStr.split('-').map(Number);
    mo--;
    if (mo === 0) {
      mo = 12;
      yr--;
    }
    return `${yr}-${String(mo).padStart(2, '0')}`;
  };

  const calculateAutoVyaj = (memberId, month, currentUpad = 0) => {
    if (!memberId || !month) return { creditVyaj: 0, debitVyaj: 0 };
    
    // 1. Calculate interest on previous month's outstanding balance
    const prevMonth = getPreviousMonth(month);
    const prevBalance = calculateMemberBalanceUpTo(memberId, prevMonth);
    
    let creditVyaj = 0;
    let debitVyaj = 0;
    
    if (prevBalance > 0) {
      const creditRate = settings?.creditInterestRate ?? 1;
      creditVyaj = Math.round(prevBalance * (creditRate / 100) * 100) / 100;
    } else if (prevBalance < 0) {
      const debitRate = settings?.debitInterestRate ?? 1;
      debitVyaj = Math.round(Math.abs(prevBalance) * (debitRate / 100) * 100) / 100;
    }
    
    // 2. Calculate interest on current month's new withdrawal
    const debitRate = settings?.debitInterestRate ?? 1;
    const newUpad = Number(currentUpad) || 0;
    debitVyaj += Math.round(newUpad * (debitRate / 100) * 100) / 100;
    debitVyaj = Math.round(debitVyaj * 100) / 100;
    
    return { creditVyaj, debitVyaj };
  };

  const handleOpenModal = () => {
    setFormData({ memberId: '', month: selectedMonth, hapto: '', upad: '', vyaj: '', creditVyaj: '', dand: '' });
    setShowModal(true);
  };

  const handleUpadChange = (val) => {
    const { creditVyaj, debitVyaj } = calculateAutoVyaj(formData.memberId, formData.month, val);
    setFormData({
      ...formData,
      upad: val,
      vyaj: debitVyaj || '',
      creditVyaj: creditVyaj || ''
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await addEntry({
        ...formData,
        hapto: Number(formData.hapto) || 0,
        upad:  Number(formData.upad)  || 0,
        vyaj:  Number(formData.vyaj)  || 0,
        creditVyaj: Number(formData.creditVyaj) || 0,
        dand:  Number(formData.dand)  || 0,
      });
      setShowModal(false);
      setFormData({ memberId: '', month: selectedMonth, hapto: '', upad: '', vyaj: '', creditVyaj: '', dand: '' });
    } catch (error) {
      console.error(error);
    }
  };

  const calculateTotal = (entry) => {
    return Number(entry.hapto || 0) - Number(entry.upad || 0) + Number(entry.vyaj || 0) + Number(entry.dand || 0);
  };

  const filteredEntries = entries
    .filter(e => e.month === selectedMonth)
    .sort((a, b) => {
      const memA = members.find(m => String(m._id) === String(a.memberId?._id || a.memberId));
      const memB = members.find(m => String(m._id) === String(b.memberId?._id || b.memberId));
      const fataA = memA ? memA.fataNo : '';
      const fataB = memB ? memB.fataNo : '';
      const numA = parseInt(fataA, 10);
      const numB = parseInt(fataB, 10);
      if (isNaN(numA) && isNaN(numB)) return (fataA || '').localeCompare(fataB || '');
      if (isNaN(numA)) return 1;
      if (isNaN(numB)) return -1;
      return numA - numB;
    });

  // Calculate summary totals
  const sumHapto = filteredEntries.reduce((sum, entry) => sum + Number(entry.hapto || 0), 0);
  const sumUpad = filteredEntries.reduce((sum, entry) => sum + Number(entry.upad || 0), 0);
  const sumCreditVyaj = filteredEntries.reduce((sum, entry) => sum + Number(entry.creditVyaj || 0), 0);
  const sumVyaj = filteredEntries.reduce((sum, entry) => sum + Number(entry.vyaj || 0), 0);
  const sumDand = filteredEntries.reduce((sum, entry) => sum + Number(entry.dand || 0), 0);
  const netTotal = sumHapto - sumUpad + sumVyaj + sumDand;

  const generatePDF = async (entry, member) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const balance = calculateMemberBalanceUpTo(member._id, entry.month);

    const htmlContent = `
      <html>
        <head>
          <title>રિસીપ્ટ - ${member.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Hind+Vadodara:wght@400;700&display=swap');
            * { box-sizing: border-box; }
            body {
              font-family: 'Hind Vadodara', 'Noto Sans Gujarati', sans-serif;
              margin: 30px;
              color: black;
              background-color: white;
              width: 210mm;
            }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #ddd; padding-bottom: 15px; }
            .header h1 { margin: 0 0 5px 0; color: #4f46e5; }
            .header p  { margin: 0; font-size: 14px; color: #666; }
            .info-grid { display: table; width: 100%; margin-bottom: 20px; }
            .info-left  { display: table-cell; width: 50%; vertical-align: top; }
            .info-right { display: table-cell; width: 50%; text-align: right; vertical-align: top; }
            .info-grid p { margin: 4px 0; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #bbb; padding: 10px; font-size: 14px; }
            th { background-color: #f0f4ff; font-weight: bold; }
            tfoot td { background-color: #f8fafc; font-weight: bold; font-size: 16px; }
            .total-val { color: #4f46e5; }
            .footer   { text-align: center; margin-top: 40px; color: #888; font-size: 12px; }
            @media print { body { margin: 15px; } }
          </style>
        </head>
        <body onload="setTimeout(() => { window.print(); setTimeout(() => window.close(), 500); }, 200);">
          <div class="header">
            <h1>બાપા સીતારામ મંડળ</h1>
            <p>માસિક એન્ટ્રી રિપોર્ટ (Monthly Entry Report)</p>
          </div>

          <div class="info-grid">
            <div class="info-left">
              <p><strong>ખાતા નં.:</strong> ${member.fataNo}</p>
              <p><strong>સભ્યનું નામ:</strong> ${member.name}</p>
              <p><strong>મોબાઈલ નંબર:</strong> ${member.mobile}</p>
            </div>
            <div class="info-right">
              <p><strong>મહિનો:</strong> ${entry.month}</p>
              <p><strong>તારીખ:</strong> ${new Date().toLocaleDateString('gu-IN')}</p>
              <p><strong>નોંધનો ક્રમાંક:</strong> ${entry._id}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 45%;">વિગત (Description)</th>
                <th style="width: 25%;">રકમ (Amount)</th>
                <th style="width: 30%;">ટીપા નોધ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>હપ્તો (Collection)</td>
                <td style="text-align: right;">₹${entry.hapto}</td>
                <td style="text-align: center; color: #888;">—</td>
              </tr>
              <tr>
                <td>ઉપાડ (Withdrawal)</td>
                <td style="text-align: right;">₹${entry.upad}</td>
                <td style="text-align: center; color: #888;">—</td>
              </tr>
              <tr>
                <td>જમા વ્યાજ (Credit Interest)</td>
                <td style="text-align: right;">₹${entry.creditVyaj || 0}</td>
                <td style="text-align: center; color: #888;">—</td>
              </tr>
              <tr>
                <td>ઉપાડ વ્યાજ (Debit Interest)</td>
                <td style="text-align: right;">₹${entry.vyaj || 0}</td>
                <td style="text-align: center; color: #888;">—</td>
              </tr>
              <tr>
                <td>દંડ (Penalty)</td>
                <td style="text-align: right;">₹${entry.dand}</td>
                <td style="text-align: center; color: #888;">—</td>
              </tr>
              <tfoot>
                <tr>
                  <td colspan="2">કુલ બચત સિલક (Total Balance)</td>
                  <td class="total-val" style="text-align: right;">₹${balance.toFixed(2)}</td>
                </tr>
              </tfoot>
            </tbody>
          </table>

          <div class="footer">
            <p>આ કોમ્પ્યુટર દ્વારા જનરેટ થયેલ રિપોર્ટ છે. (This is a computer-generated report.)</p>
            <p>બાપા સીતારામ મંડળ &nbsp;|&nbsp; મંડળ નં. ૩૬</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const generateAllMemberPDFs = () => {
    if (filteredEntries.length === 0) {
      alert('આ મહિના માટે કોઈ એન્ટ્રી નથી (No entries for this month)');
      return;
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const formatMonthLabel = (m) => {
      const [yr, mo] = m.split('-');
      const monthsGuj = ['જાન્યુઆરી','ફેબ્રુઆરી','માર્ચ','એપ્રિલ','મે','જૂન','જુલાઈ','ઓગસ્ટ','સપ્ટેમ્બર','ઓક્ટોબર','નવેમ્બર','ડિસેમ્બર'];
      return `${monthsGuj[parseInt(mo) - 1]} ${yr}`;
    };

    const allReceipts = filteredEntries.map((entry, idx) => {
      const member = members.find(m => m._id === entry.memberId?._id || m._id === entry.memberId);
      if (!member) return '';
      const balance = calculateMemberBalanceUpTo(member._id, entry.month);
      return `
        <div style="page-break-after: ${idx < filteredEntries.length - 1 ? 'always' : 'avoid'}; padding: 20px;">
          <div style="border: 2px solid #4f46e5; border-radius: 8px; padding: 24px; max-width: 700px; margin: 0 auto; font-family: 'Hind Vadodara', sans-serif;">
            <div style="text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 14px; margin-bottom: 18px;">
              <h2 style="margin: 0 0 4px 0; color: #4f46e5; font-size: 22px;">બાપા સીતારામ મંડળ</h2>
              <p style="margin: 0; color: #6b7280; font-size: 13px;">માસિક એન્ટ્રી રિસીપ્ટ | મંડળ નં. 36</p>
            </div>
            <div style="display: table; width: 100%; margin-bottom: 18px;">
              <div style="display: table-cell; width: 50%; vertical-align: top;">
                <p style="margin: 3px 0; font-size: 14px;"><strong>ખાતા નં.:</strong> ${member.fataNo}</p>
                <p style="margin: 3px 0; font-size: 14px;"><strong>સભ્યનું નામ:</strong> ${member.name}</p>
                <p style="margin: 3px 0; font-size: 14px;"><strong>મોબાઇલ:</strong> ${member.mobile || '-'}</p>
              </div>
              <div style="display: table-cell; width: 50%; text-align: right; vertical-align: top;">
                <p style="margin: 3px 0; font-size: 14px;"><strong>મહિનો:</strong> ${formatMonthLabel(entry.month)}</p>
                <p style="margin: 3px 0; font-size: 14px;"><strong>તારીખ:</strong> ${new Date().toLocaleDateString('gu-IN')}</p>
              </div>
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #ede9fe;">
                  <th style="border: 1px solid #c4b5fd; padding: 10px; text-align: left;">વિગત (Description)</th>
                  <th style="border: 1px solid #c4b5fd; padding: 10px; text-align: right;">રકમ (Amount)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="border: 1px solid #ddd; padding: 10px; color: #15803d;">⬆ હપ્તો (Collection)</td>
                  <td style="border: 1px solid #ddd; padding: 10px; text-align: right; color: #16a34a; font-weight: bold;">+₹${Number(entry.hapto || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #ddd; padding: 10px; color: #b91c1c;">⬇ ઉપાડ (Withdrawal)</td>
                  <td style="border: 1px solid #ddd; padding: 10px; text-align: right; color: #dc2626; font-weight: bold;">-₹${Number(entry.upad || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #ddd; padding: 10px; color: #0891b2;">જમા વ્યાજ (Credit Interest)</td>
                  <td style="border: 1px solid #ddd; padding: 10px; text-align: right; color: #0891b2; font-weight: bold;">₹${Number(entry.creditVyaj || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #ddd; padding: 10px; color: #d97706;">ઉપાડ વ્યાજ (Debit Interest)</td>
                  <td style="border: 1px solid #ddd; padding: 10px; text-align: right; color: #d97706; font-weight: bold;">₹${Number(entry.vyaj || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #ddd; padding: 10px; color: #b91c1c;">દંડ (Penalty)</td>
                  <td style="border: 1px solid #ddd; padding: 10px; text-align: right; color: #dc2626; font-weight: bold;">₹${Number(entry.dand || 0).toFixed(2)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr style="background-color: #f0fdf4;">
                  <td style="border: 2px solid #4f46e5; padding: 12px; font-weight: bold; font-size: 16px;">કુલ બચત સિલક (Total Balance)</td>
                  <td style="border: 2px solid #4f46e5; padding: 12px; text-align: right; font-weight: bold; font-size: 18px; color: #16a34a;">₹${balance.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
            <p style="text-align: center; font-size: 11px; color: #9ca3af; margin-top: 18px;">આ કોમ્પ્યુટર દ્વારા જનરેટ થયેલ રિસીપ્ટ છે. | બાપા સીતારામ મંડળ</p>
          </div>
        </div>
      `;
    }).join('');

    const html = `
      <html>
        <head>
          <title>બાપા સીતારામ મંડળ - બધા સભ્યોની રિસીપ્ટ - ${selectedMonth}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Hind+Vadodara:wght@400;700&display=swap');
            * { box-sizing: border-box; }
            body { font-family: 'Hind Vadodara', 'Noto Sans Gujarati', sans-serif; margin: 0; background: white; color: black; }
            @media print { @page { margin: 15mm; } }
          </style>
        </head>
        <body onload="window.print(); setTimeout(() => window.close(), 1000);">
          ${allReceipts}
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const generateBalanceReportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Group entries by month
    const monthGroups = {};
    entries.forEach(entry => {
      const key = entry.month;
      if (!monthGroups[key]) monthGroups[key] = [];
      monthGroups[key].push(entry);
    });

    const sortedMonths = Object.keys(monthGroups).sort();

    // Format month label
    const formatMonthLabel = (m) => {
      const [yr, mo] = m.split('-');
      const monthsGuj = ['જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન', 'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર'];
      return `${monthsGuj[parseInt(mo) - 1]} ${yr}`;
    };

    // Build one table body per month
    const allMonthTables = sortedMonths.map(month => {
      let mSumHapto = 0, mSumUpad = 0, mSumCreditVyaj = 0, mSumVyaj = 0, mSumDand = 0;
      const sortedMEntries = [...monthGroups[month]].sort((a, b) => {
        const memA = members.find(m => String(m._id) === String(a.memberId?._id || a.memberId));
        const memB = members.find(m => String(m._id) === String(b.memberId?._id || b.memberId));
        const fataA = memA ? memA.fataNo : '';
        const fataB = memB ? memB.fataNo : '';
        const numA = parseInt(fataA, 10);
        const numB = parseInt(fataB, 10);
        if (isNaN(numA) && isNaN(numB)) return (fataA || '').toString().localeCompare((fataB || '').toString());
        if (isNaN(numA)) return 1;
        if (isNaN(numB)) return -1;
        return numA - numB;
      });

      const rowsHtml = sortedMEntries.map(entry => {
        const member = members.find(m => m._id === entry.memberId?._id || m._id === entry.memberId);
        if (!member) return '';
        mSumHapto += Number(entry.hapto || 0);
        mSumUpad += Number(entry.upad || 0);
        mSumCreditVyaj += Number(entry.creditVyaj || 0);
        mSumVyaj += Number(entry.vyaj || 0);
        mSumDand += Number(entry.dand || 0);
        return `
          <tr>
            <td style="border: 1px solid #333; padding: 8px; text-align: center;">${member.fataNo || ''}</td>
            <td style="border: 1px solid #333; padding: 8px; text-align: left;">${member.name || ''}</td>
            <td style="border: 1px solid #333; padding: 8px; text-align: right;">₹${Number(entry.hapto || 0).toFixed(2)}</td>
            <td style="border: 1px solid #333; padding: 8px; text-align: right;">₹${Number(entry.upad || 0).toFixed(2)}</td>
            <td style="border: 1px solid #333; padding: 8px; text-align: right; color: #0891b2;">₹${Number(entry.creditVyaj || 0).toFixed(2)}</td>
            <td style="border: 1px solid #333; padding: 8px; text-align: right; color: #d97706;">₹${Number(entry.vyaj || 0).toFixed(2)}</td>
            <td style="border: 1px solid #333; padding: 8px; text-align: right;">₹${Number(entry.dand || 0).toFixed(2)}</td>
          </tr>
        `;
      }).join('');

      return `
        <div style="margin-bottom: 30px; page-break-before: ${sortedMonths.indexOf(month) > 1 ? 'always' : 'auto'}">
          <h3 style="text-align: center; margin-bottom: 5px; color: #333;">${formatMonthLabel(month)}</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 5px;">
            <thead>
              <tr style="background-color: #e8eaf6;">
                <th style="border: 1px solid #333; padding: 8px; text-align: center; width: 10%;">ખાતા નં.</th>
                <th style="border: 1px solid #333; padding: 8px; text-align: left; width: 30%;">નામ</th>
                <th style="border: 1px solid #333; padding: 8px; text-align: right; width: 12%;">હપ્તો</th>
                <th style="border: 1px solid #333; padding: 8px; text-align: right; width: 12%;">ઉપાડ</th>
                <th style="border: 1px solid #333; padding: 8px; text-align: right; width: 12%;">જમા વ્યાજ</th>
                <th style="border: 1px solid #333; padding: 8px; text-align: right; width: 12%;">ઉપાડ વ્યાજ</th>
                <th style="border: 1px solid #333; padding: 8px; text-align: right; width: 12%;">દંડ</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
            <tfoot>
              <tr style="background-color: #f5f5f5; font-weight: bold;">
                <td style="border: 1px solid #333; padding: 8px; text-align: center;" colspan="2">મહિનાનો કુલ (Total)</td>
                <td style="border: 1px solid #333; padding: 8px; text-align: right;">₹${mSumHapto.toFixed(2)}</td>
                <td style="border: 1px solid #333; padding: 8px; text-align: right;">₹${mSumUpad.toFixed(2)}</td>
                <td style="border: 1px solid #333; padding: 8px; text-align: right; color: #0891b2;">₹${mSumCreditVyaj.toFixed(2)}</td>
                <td style="border: 1px solid #333; padding: 8px; text-align: right; color: #d97706;">₹${mSumVyaj.toFixed(2)}</td>
                <td style="border: 1px solid #333; padding: 8px; text-align: right;">₹${mSumDand.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      `;
    }).join('');

    const grandHapto = entries.reduce((s, e) => s + Number(e.hapto || 0), 0);
    const grandUpad  = entries.reduce((s, e) => s + Number(e.upad  || 0), 0);
    const grandCreditVyaj = entries.reduce((s, e) => s + Number(e.creditVyaj || 0), 0);
    const grandVyaj  = entries.reduce((s, e) => s + Number(e.vyaj  || 0), 0);
    const grandDand  = entries.reduce((s, e) => s + Number(e.dand  || 0), 0);

    // Build per-member summary across ALL months
    const memberSummary = {};
    entries.forEach(entry => {
      const member = members.find(m => m._id === entry.memberId?._id || m._id === entry.memberId);
      if (!member) return;
      const key = member._id;
      if (!memberSummary[key]) {
        memberSummary[key] = { fataNo: member.fataNo, name: member.name, hapto: 0, upad: 0, creditVyaj: 0, vyaj: 0, dand: 0 };
      }
      memberSummary[key].hapto += Number(entry.hapto || 0);
      memberSummary[key].upad  += Number(entry.upad  || 0);
      memberSummary[key].creditVyaj += Number(entry.creditVyaj || 0);
      memberSummary[key].vyaj  += Number(entry.vyaj  || 0);
      memberSummary[key].dand  += Number(entry.dand  || 0);
    });

    const latestMonth = sortedMonths[sortedMonths.length - 1] || selectedMonth;

    const memberSummaryRows = Object.keys(memberSummary)
      .sort((a, b) => {
        const fataA = memberSummary[a].fataNo || '';
        const fataB = memberSummary[b].fataNo || '';
        const numA = parseInt(fataA, 10);
        const numB = parseInt(fataB, 10);
        if (isNaN(numA) && isNaN(numB)) return (fataA || '').toString().localeCompare((fataB || '').toString());
        if (isNaN(numA)) return 1;
        if (isNaN(numB)) return -1;
        return numA - numB;
      })
      .map(mId => {
        const ms = memberSummary[mId];
        const balance = calculateMemberBalanceUpTo(mId, latestMonth);
        return `
          <tr>
            <td style="border: 1px solid #333; padding: 8px; text-align: center;">${ms.fataNo || ''}</td>
            <td style="border: 1px solid #333; padding: 8px; text-align: left;">${ms.name}</td>
            <td style="border: 1px solid #333; padding: 8px; text-align: right;">₹${ms.hapto.toFixed(2)}</td>
            <td style="border: 1px solid #333; padding: 8px; text-align: right;">₹${ms.upad.toFixed(2)}</td>
            <td style="border: 1px solid #333; padding: 8px; text-align: right; color: #0891b2;">₹${ms.creditVyaj.toFixed(2)}</td>
            <td style="border: 1px solid #333; padding: 8px; text-align: right; color: #d97706;">₹${ms.vyaj.toFixed(2)}</td>
            <td style="border: 1px solid #333; padding: 8px; text-align: right;">₹${ms.dand.toFixed(2)}</td>
            <td style="border: 1px solid #333; padding: 8px; text-align: right; font-weight: bold; color: #1a237e;">₹${balance.toFixed(2)}</td>
          </tr>
        `;
      }).join('');

    const grandBalance = Object.keys(memberSummary).reduce((s, mId) => s + calculateMemberBalanceUpTo(mId, latestMonth), 0);

    const htmlContent = `
      <html>
        <head>
          <title>બાપા સીતારામ મંડળ - સંપૂર્ણ હિસાબ પત્ર</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Hind+Vadodara:wght@400;700&display=swap');
            * { box-sizing: border-box; }
            body {
              font-family: 'Hind Vadodara', 'Noto Sans Gujarati', sans-serif;
              margin: 30px;
              color: black;
              background-color: white;
            }
            h2  { text-align: center; margin: 0 0 5px 0; }
            h3  { margin: 10px 0 5px 0; border-bottom: 2px solid #333; padding-bottom: 3px; }
            .note { font-size: 12px; color: #555; text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #333; padding: 8px; font-size: 13px; }
            th { background-color: #e8eaf6; font-weight: bold; }
            tfoot tr { background-color: #f5f5f5; }
            .grand-total td { background-color: #c8cafc !important; font-weight: bold; font-size: 14px; }
            .member-summary-section { page-break-before: always; }
            @media print {
              body { margin: 15px; }
              button { display: none; }
            }
          </style>
        </head>
        <body onload="window.print(); setTimeout(() => window.close(), 1000);">
          <h2>બાપા સીતારામ મંડળ</h2>
          <p class="note">બધા મહિનાનો સંપૂર્ણ હિસાબ પત્ર (${sortedMonths.length === 0 ? 'No Data' : sortedMonths[0] + ' થી ' + sortedMonths[sortedMonths.length - 1]}) &nbsp;|&nbsp; તારીખ: ${new Date().toLocaleDateString('gu-IN')}</p>

          ${allMonthTables}

          <!-- Per-Member Grand Summary -->
          <div class="member-summary-section">
            <h3 style="border-bottom: 3px double #333; margin-top: 30px; text-align: center; color: #1a237e;">સભ્ય મુજબ કુલ સરવાળો (Member-wise Grand Total)</h3>
            <p style="text-align:center; font-size:12px; color:#555; margin-bottom:10px;">દરેક સભ્ય દ્વારા બધા મહિનામાં જમા થયેલ રકમ</p>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #c8cafc;">
                  <th style="border: 1px solid #333; padding: 8px; text-align: center; width: 10%;">ખાતા નં.</th>
                  <th style="border: 1px solid #333; padding: 8px; text-align: left; width: 24%;">સભ્યનું નામ</th>
                  <th style="border: 1px solid #333; padding: 8px; text-align: right; width: 11%;">કુલ હપ્તો</th>
                  <th style="border: 1px solid #333; padding: 8px; text-align: right; width: 11%;">કુલ ઉપાડ</th>
                  <th style="border: 1px solid #333; padding: 8px; text-align: right; width: 11%;">કુલ જમા વ્યાજ</th>
                  <th style="border: 1px solid #333; padding: 8px; text-align: right; width: 11%;">કુલ ઉપાડ વ્યાજ</th>
                  <th style="border: 1px solid #333; padding: 8px; text-align: right; width: 11%;">કુલ દંડ</th>
                  <th style="border: 1px solid #333; padding: 8px; text-align: right; width: 11%;">ચોખ્ખી રકમ</th>
                </tr>
              </thead>
              <tbody>
                ${memberSummaryRows}
              </tbody>
              <tfoot>
                <tr style="background-color: #c8cafc; font-weight: bold;">
                  <td style="border: 1px solid #333; padding: 8px; text-align: center;" colspan="2">બધા સભ્યો કુલ (Grand Total)</td>
                  <td style="border: 1px solid #333; padding: 8px; text-align: right;">₹${grandHapto.toFixed(2)}</td>
                  <td style="border: 1px solid #333; padding: 8px; text-align: right;">₹${grandUpad.toFixed(2)}</td>
                  <td style="border: 1px solid #333; padding: 8px; text-align: right; color: #0891b2;">₹${grandCreditVyaj.toFixed(2)}</td>
                  <td style="border: 1px solid #333; padding: 8px; text-align: right; color: #d97706;">₹${grandVyaj.toFixed(2)}</td>
                  <td style="border: 1px solid #333; padding: 8px; text-align: right;">₹${grandDand.toFixed(2)}</td>
                  <td style="border: 1px solid #333; padding: 8px; text-align: right;">₹${grandBalance.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <p style="text-align: center; font-size: 12px; color: #888; margin-top: 30px;">
            આ હિસાબ પત્ર કમ્પ્યુટર દ્વારા જનરેટ થયેલ છે. &nbsp;|&nbsp; આશિર્વાદ - બાપા સીતારામ મંડળ
          </p>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const sendWhatsApp = async (member, entry) => {
    try {
      const balance = calculateMemberBalanceUpTo(member._id, entry.month);
      const token = localStorage.getItem('mandal_token');
      const res = await axios.post(`${API_URL}/whatsapp/send`, {
        mobile: member.mobile,
        memberName: member.name,
        month: entry.month,
        hapto: entry.hapto,
        upad: entry.upad,
        vyaj: entry.vyaj,
        creditVyaj: entry.creditVyaj || 0,
        dand: entry.dand,
        total: balance
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.simulated) {
        // Fallback to wa.me if simulated (meaning no API credentials are in .env)
        const text = `નમસ્તે ${member.name},\nતમારો ${entry.month} નો રીપોર્ટ:\nહપ્તો: ₹${entry.hapto}\nઉપાડ: ₹${entry.upad}\nજમા વ્યાજ: ₹${entry.creditVyaj || 0}\nઉપાડ વ્યાજ: ₹${entry.vyaj || 0}\nદંડ: ₹${entry.dand}\nકુલ બચત સિલક: ₹${balance.toFixed(2)}\n\nઆભાર,\nબાપા સીતારામ મંડળ`;
        const url = `https://wa.me/91${member.mobile}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
      } else {
        alert("WhatsApp મેસેજ સફળતાપૂર્વક મોકલવામાં આવ્યો! (WhatsApp sent!)");
      }
    } catch (error) {
      console.error(error);
      alert("WhatsApp મોકલવામાં ભૂલ આવી (Error sending WhatsApp)");
    }
  };

  const handleSendAllEmails = async () => {
    if (filteredEntries.length === 0) {
      alert("આ મહિના માટે કોઈ એન્ટ્રી નથી (No entries for this month)");
      return;
    }

    const confirmSend = window.confirm(`શું તમે આ મહિનાના તમામ (${filteredEntries.length}) સભ્યોને હિસાબનો ઈમેલ મોકલવા માંગો છો?`);
    if (!confirmSend) return;

    setBroadcastEmailLoading(true);

    const reports = filteredEntries.map(entry => {
      const member = members.find(m => m._id === entry.memberId?._id || m._id === entry.memberId);
      const balance = calculateMemberBalanceUpTo(member?._id, entry.month);
      return {
        email: member?.email || '',
        fataNo: member?.fataNo || '',
        memberName: member?.name || 'Unknown',
        month: entry.month,
        hapto: entry.hapto,
        upad: entry.upad,
        vyaj: entry.vyaj,
        creditVyaj: entry.creditVyaj || 0,
        dand: entry.dand,
        total: balance
      };
    });

    const hasEmails = reports.some(r => r.email !== '');
    if (!hasEmails) {
      alert("કોઈપણ સભ્ય પાસે ઈમેલ એડ્રેસ સેટ કરેલ નથી (No members have email address set)");
      setBroadcastEmailLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('mandal_token');
      const res = await axios.post(`${API_URL}/email/send-all`, { reports }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`બ્રોડકાસ્ટ પૂર્ણ! ${res.data.successCount} ઈમેલ સફળતાપૂર્વક મોકલાયા, ${res.data.failCount} અસફળ.`);
    } catch (error) {
      console.error(error);
      alert("બધાને ઈમેલ મોકલવામાં ભૂલ આવી (Error broadcasting emails)");
    } finally {
      setBroadcastEmailLoading(false);
    }
  };

  const handleSendAllWhatsApp = async () => {
    if (filteredEntries.length === 0) {
      alert("આ મહિના માટે કોઈ એન્ટ્રી નથી (No entries for this month)");
      return;
    }

    const confirmSend = window.confirm(`શું તમે આ મહિનાના તમામ (${filteredEntries.length}) સભ્યોને WhatsApp પર રીપોર્ટ મોકલવા માંગો છો?`);
    if (!confirmSend) return;

    setBroadcastWhatsAppLoading(true);

    const reports = filteredEntries.map(entry => {
      const member = members.find(m => m._id === entry.memberId?._id || m._id === entry.memberId);
      const balance = calculateMemberBalanceUpTo(member?._id, entry.month);
      return {
        mobile: member?.mobile || '',
        memberName: member?.name || 'Unknown',
        month: entry.month,
        hapto: entry.hapto,
        upad: entry.upad,
        vyaj: entry.vyaj,
        creditVyaj: entry.creditVyaj || 0,
        dand: entry.dand,
        total: balance
      };
    }).filter(r => r.mobile !== '');

    try {
      const token = localStorage.getItem('mandal_token');
      const res = await axios.post(`${API_URL}/whatsapp/send-all`, { reports }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.simulated) {
        alert("દેમો મોડ: બધા સભ્યોના WhatsApp મેસેજ સર્વર કન્સોલમાં સફળતાપૂર્વક સિમ્યુલેટ (પ્રિન્ટ) થયા છે!");
        
        // Sequentially offer sending via wa.me to let them send manually
        for (const r of reports) {
          const text = `નમસ્તે ${r.memberName},\nતમારો ${r.month} નો રીપોર્ટ:\nહપ્તો: ₹${r.hapto}\nઉપાડ: ₹${r.upad}\nજમા વ્યાજ: ₹${r.creditVyaj || 0}\nઉપાડ વ્યાજ: ₹${r.vyaj || 0}\nદંડ: ₹${r.dand}\nકુલ બચત સિલક: ₹${r.total.toFixed(2)}\n\nઆભાર,\nબાપા સીતારામ મંડળ`;
          const url = `https://wa.me/91${r.mobile}?text=${encodeURIComponent(text)}`;
          window.open(url, '_blank');
        }
      } else {
        alert(`બ્રોડકાસ્ટ પૂર્ણ! ${res.data.successCount} સભ્યોને WhatsApp મોકલાયા, ${res.data.failCount} અસફળ.`);
      }
    } catch (error) {
      console.error(error);
      alert("WhatsApp મોકલવામાં ભૂલ આવી (Error broadcasting WhatsApp)");
    } finally {
      setBroadcastWhatsAppLoading(false);
    }
  };

  const sendEmail = async (member, entry) => {
    if (!member.email) {
      alert("આ સભ્ય માટે ઈમેલ સરનામું સેટ કરેલ નથી (Email not set for this member)");
      return;
    }
    
    const confirmSend = window.confirm(`શું તમે ${member.name} ને માસિક અહેવાલ ઈમેલ કરવા માંગો છો?`);
    if (!confirmSend) return;

    try {
      const balance = calculateMemberBalanceUpTo(member._id, entry.month);
      const token = localStorage.getItem('mandal_token');
      await axios.post(`${API_URL}/email/send`, {
        email: member.email,
        memberName: member.name,
        month: entry.month,
        hapto: entry.hapto,
        upad: entry.upad,
        vyaj: entry.vyaj,
        creditVyaj: entry.creditVyaj || 0,
        dand: entry.dand,
        total: balance
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('ઈમેલ સફળતાપૂર્વક મોકલવામાં આવ્યો! (Email sent successfully!)');
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'ઈમેલ મોકલવામાં ભૂલ આવી (Error sending email)');
    }
  };

  return (
    <div>
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>માસિક એન્ટ્રી (Monthly Entry)</h1>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn" style={{ backgroundColor: '#4f46e5', color: '#fff' }} onClick={generateBalanceReportPDF}>
            📄 બેલેન્સ રીપોર્ટ (PDF)
          </button>
          <button className="btn" style={{ backgroundColor: '#7c3aed', color: '#fff' }} onClick={generateAllMemberPDFs}>
            📥 બધાની રિસીપ્ટ PDF
          </button>
          <button className="btn" style={{ backgroundColor: '#10b981', color: '#fff' }} onClick={handleSendAllEmails} disabled={broadcastEmailLoading}>
            📬 {broadcastEmailLoading ? 'મોકલી રહ્યા છીએ...' : 'બધાને ઈમેલ'}
          </button>
          <button className="btn" style={{ backgroundColor: '#128c7e', color: '#fff' }} onClick={handleSendAllWhatsApp} disabled={broadcastWhatsAppLoading}>
            💬 {broadcastWhatsAppLoading ? 'મોકલી રહ્યા છીએ...' : 'બધાને WhatsApp'}
          </button>
          <button className="btn btn-primary" onClick={handleOpenModal}>
            <MdAdd /> નવી એન્ટ્રી
          </button>
        </div>
      </div>

       <div className="card" style={{ marginBottom: '1.5rem' }}>
         <div className="flex-between">
           <div className="input-group" style={{ marginBottom: 0, flexDirection: 'row', alignItems: 'center' }}>
             <label style={{ marginRight: '1rem' }}>મહિનો પસંદ કરો:</label>
             <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
           </div>
         </div>
       </div>
       
       {/* Summary Totals Section */}
       <div className="card" style={{ marginBottom: '1.5rem' }}>
         <h2 className="page-title" style={{ marginTop: 0, marginBottom: '1rem' }}>માસિક એન્ટ્રી બાપા (Monthly Summary)</h2>
         <div className="summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
           <div className="summary-card" style={{ backgroundColor: '#f0fdf4', border: '2px solid #86efac', borderRadius: '0.5rem', padding: '1rem', overflow: 'hidden' }}>
             <h3 style={{ margin: '0 0 0.5rem 0', color: '#15803d', fontSize: '0.9rem' }}>⬆ હપ્તો (Hapto)</h3>
             <p style={{ margin: '0', fontSize: 'clamp(1rem, 2.5vw, 1.8rem)', fontWeight: 'bold', color: '#16a34a', wordBreak: 'break-all' }}>+₹{sumHapto.toFixed(2)}</p>
           </div>
           <div className="summary-card" style={{ backgroundColor: '#fef2f2', border: '2px solid #fca5a5', borderRadius: '0.5rem', padding: '1rem', overflow: 'hidden' }}>
             <h3 style={{ margin: '0 0 0.5rem 0', color: '#b91c1c', fontSize: '0.9rem' }}>⬇ ઉપાડ (Upad)</h3>
             <p style={{ margin: '0', fontSize: 'clamp(1rem, 2.5vw, 1.8rem)', fontWeight: 'bold', color: '#dc2626', wordBreak: 'break-all' }}>-₹{sumUpad.toFixed(2)}</p>
           </div>
           <div className="summary-card" style={{ backgroundColor: '#e0f2fe', border: '2px solid #bae6fd', borderRadius: '0.5rem', padding: '1rem', overflow: 'hidden' }}>
             <h3 style={{ margin: '0 0 0.5rem 0', color: '#0369a1', fontSize: '0.9rem' }}>⬆ જમા વ્યાજ (Credit Interest)</h3>
             <p style={{ margin: '0', fontSize: 'clamp(1rem, 2.5vw, 1.8rem)', fontWeight: 'bold', color: '#0284c7', wordBreak: 'break-all' }}>+₹{sumCreditVyaj.toFixed(2)}</p>
           </div>
           <div className="summary-card" style={{ backgroundColor: '#fffbeb', border: '2px solid #fde68a', borderRadius: '0.5rem', padding: '1rem', overflow: 'hidden' }}>
             <h3 style={{ margin: '0 0 0.5rem 0', color: '#b45309', fontSize: '0.9rem' }}>⬆ ઉપાડ વ્યાજ (Debit Interest)</h3>
             <p style={{ margin: '0', fontSize: 'clamp(1rem, 2.5vw, 1.8rem)', fontWeight: 'bold', color: '#d97706', wordBreak: 'break-all' }}>+₹{sumVyaj.toFixed(2)}</p>
           </div>
           <div className="summary-card" style={{ backgroundColor: '#fef2f2', border: '2px solid #fca5a5', borderRadius: '0.5rem', padding: '1rem', overflow: 'hidden' }}>
             <h3 style={{ margin: '0 0 0.5rem 0', color: '#b91c1c', fontSize: '0.9rem' }}>⬇ દંડ (Dand)</h3>
             <p style={{ margin: '0', fontSize: 'clamp(1rem, 2.5vw, 1.8rem)', fontWeight: 'bold', color: '#dc2626', wordBreak: 'break-all' }}>-₹{sumDand.toFixed(2)}</p>
           </div>
           <div className="summary-card" style={{ backgroundColor: netTotal >= 0 ? '#f0fdf4' : '#fef2f2', border: `2px solid ${netTotal >= 0 ? '#86efac' : '#fca5a5'}`, borderRadius: '0.5rem', padding: '1rem', overflow: 'hidden' }}>
             <h3 style={{ margin: '0 0 0.5rem 0', color: netTotal >= 0 ? '#15803d' : '#b91c1c', fontSize: '0.9rem' }}>કુલ સરવાળો (Net Total)</h3>
             <p style={{ margin: '0', fontSize: 'clamp(1rem, 2.5vw, 1.8rem)', fontWeight: 'bold', color: netTotal >= 0 ? '#16a34a' : '#dc2626', wordBreak: 'break-all' }}>{netTotal >= 0 ? '+' : ''}₹{netTotal.toFixed(2)}</p>
           </div>
         </div>
       </div>

       <div className="card">
         <div className="table-container">
           <table>
             <thead>
               <tr>
                 <th>ખાતા નં.</th>
                 <th>સભ્યનું નામ (Name)</th>
                 <th style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>કુલ હપ્તો (All Months)</th>
                 <th style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}>કુલ ઉપાડ (All Months)</th>
                 <th>મહિનાનો હપ્તો (Hapto)</th>
                 <th>ઉપાડ (Upad)</th>
                 <th>જમા વ્યાજ (Credit Interest)</th>
                 <th>ઉપાડ વ્યાજ (Debit Interest)</th>
                 <th>દંડ (Dand)</th>
                 <th>કુલ બચત સિલક (Balance)</th>
                 <th>ક્રિયા (Action)</th>
               </tr>
             </thead>
             <tbody>
               {filteredEntries.map((entry) => {
                 const member = members.find(m => m._id === entry.memberId?._id || m._id === entry.memberId);
                 if (!member) return null;

                 // Cumulative hapto and upad across ALL months for this member
                 const allMemberEntries = entries.filter(e =>
                   (e.memberId?._id || e.memberId) === (member._id)
                 );
                 const totalHapto = allMemberEntries.reduce((sum, e) => sum + Number(e.hapto || 0), 0);
                 const totalUpad  = allMemberEntries.reduce((sum, e) => sum + Number(e.upad  || 0), 0);
                 const balance = calculateMemberBalanceUpTo(member._id, entry.month);

                 return (
                   <tr key={entry._id}>
                     <td>{member.fataNo}</td>
                     <td>{member.name}</td>
                     <td style={{ fontWeight: 'bold', color: '#16a34a', backgroundColor: '#f0fdf4' }}>
                       +₹{totalHapto.toFixed(2)}
                     </td>
                     <td style={{ fontWeight: 'bold', color: '#dc2626', backgroundColor: '#fef2f2' }}>
                       -₹{totalUpad.toFixed(2)}
                     </td>
                     <td style={{ color: '#16a34a', fontWeight: '600' }}>+₹{Number(entry.hapto || 0).toFixed(2)}</td>
                     <td style={{ color: '#dc2626', fontWeight: '600' }}>-₹{Number(entry.upad || 0).toFixed(2)}</td>
                     <td style={{ color: '#16a34a', fontWeight: '600' }}>₹{Number(entry.creditVyaj || 0).toFixed(2)}</td>
                     <td style={{ color: '#dc2626', fontWeight: '600' }}>₹{Number(entry.vyaj || 0).toFixed(2)}</td>
                     <td style={{ color: '#dc2626', fontWeight: '600' }}>₹{Number(entry.dand || 0).toFixed(2)}</td>
                     <td style={{ fontWeight: 'bold', color: '#1a237e' }}>
                       ₹{balance.toFixed(2)}
                     </td>
                     <td style={{ display: 'flex', gap: '0.5rem' }}>
                       <button className="btn" style={{ backgroundColor: '#e0e7ff', color: '#4f46e5' }} onClick={() => generatePDF(entry, member)} title="PDF ડાઉનલોડ">
                         <MdDownload />
                       </button>
                       <button className="btn" style={{ backgroundColor: '#dcf8c6', color: '#128c7e' }} onClick={() => sendWhatsApp(member, entry)} title="WhatsApp મેસેજ">
                         <MdMessage />
                       </button>
                       <button className="btn" style={{ backgroundColor: '#fee2e2', color: '#ef4444' }} onClick={() => sendEmail(member, entry)} title="Email મોકલો">
                         <MdEmail />
                       </button>
                     </td>
                   </tr>
                 );
               })}
               {filteredEntries.length === 0 && (
                 <tr>
                   <td colSpan="11" style={{ textAlign: 'center', padding: '2rem' }}>આ મહિના માટે કોઈ એન્ટ્રી નથી</td>
                 </tr>
               )}
             </tbody>
           </table>
         </div>
       </div>

       {showModal && (
         <div className="modal-overlay">
           <div className="modal">
             <div className="modal-header">
               <h2>નવી માસિક એન્ટ્રી</h2>
               <button className="btn" onClick={() => setShowModal(false)}>✕</button>
             </div>
             <form onSubmit={handleSave}>
               <div className="input-group">
                 <label>સભ્ય પસંદ કરો</label>
                 <select required value={formData.memberId} onChange={e => {
                    const selectedMemberId = e.target.value;
                    const computedVyaj = calculateAutoVyaj(selectedMemberId, formData.month, formData.upad);
                    setFormData({
                      ...formData,
                      memberId: selectedMemberId,
                      vyaj: computedVyaj || 0
                    });
                  }}>
                   <option value="">-- પસંદ કરો --</option>
                   {members.map(m => (
                     <option key={m._id} value={m._id}>{m.fataNo} - {m.name}</option>
                   ))}
                 </select>
               </div>
               <div className="input-group">
                 <label>મહિનો</label>
                 <input type="month" required value={formData.month} onChange={e => {
                      const selectedMonth = e.target.value;
                      const computedVyaj = calculateAutoVyaj(formData.memberId, selectedMonth, formData.upad);
                      setFormData({
                        ...formData,
                        month: selectedMonth,
                        vyaj: computedVyaj || 0
                      });
                    }} />
               </div>
               <div className="input-group">
                 <label>હપ્તો (કલેક્શન)</label>
                 <input type="number" required value={formData.hapto} onChange={e => setFormData({...formData, hapto: e.target.value})} />
               </div>
               <div className="input-group">
                 <label>ઉપાડ (Withdrawal)</label>
                 <input type="number" required value={formData.upad} onChange={e => handleUpadChange(e.target.value)} />
               </div>
               <div className="input-group">
                 <label>વ્યાજ (Interest)</label>
                 <input type="number" required value={formData.vyaj} onChange={e => setFormData({...formData, vyaj: e.target.value})} />
               </div>
               <div className="input-group">
                 <label>દંડ (Penalty)</label>
                 <input type="number" required value={formData.dand} onChange={e => setFormData({...formData, dand: e.target.value})} />
               </div>
               <div className="input-group" style={{ backgroundColor: '#f3f4f6', padding: '1rem', borderRadius: '0.5rem', marginTop: '1rem' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                   <span>કુલ (Total Calculation):</span>
                   <span>₹{calculateTotal(formData)}</span>
                 </div>
               </div>
               <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                 <button type="button" className="btn" onClick={() => setShowModal(false)}>રદ કરો</button>
                 <button type="submit" className="btn btn-primary">સેવ કરો</button>
               </div>
             </form>
           </div>
         </div>
       )}
    </div>
  );
};

export default MonthlyEntry;
