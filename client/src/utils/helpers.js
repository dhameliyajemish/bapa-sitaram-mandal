export default {
  monthLabel(m) {
    const [, mo] = m.split('-');
    const M = ['જાન્યુઆરી','ફેબ્રુઆરી','માર્ચ','એપ્રિલ','મે','જૂન','જુલાઈ','ઓગસ્ટ','સપ્ટેમ્બર','ઓક્ટોબર','નવેમ્બર','ડિસેમ્બર'];
    return `${M[+mo - 1]} ${m.split('-')[0]}`;
  },

  fmt(n) { return `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
  fmt0(n) { return `₹${Number(n || 0).toFixed(2)}` },

  getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  },

  emi(P, annualRate, n) {
    if (!P || !n) return 0;
    const r = annualRate / 12 / 100;
    if (r === 0) return +P / n;
    return (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  },

  getLast12Months() {
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return months;
  },
};
