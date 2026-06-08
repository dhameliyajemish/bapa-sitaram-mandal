import React, { useState, useEffect, useContext } from 'react';
import { AppDataContext } from '../context/AppDataContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import { MdSettings, MdSave, MdTrendingUp, MdTrendingDown, MdBackup, MdCloudDownload, MdCloudUpload } from 'react-icons/md';

const API_URL = import.meta.env.DEV ? 'http://localhost:5000/api' : '/api';

const SettingsPage = () => {
  const { settings, updateSettings, fetchData } = useContext(AppDataContext);
  const [creditRate, setCreditRate] = useState(1);
  const [debitRate, setDebitRate] = useState(1);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (settings) {
      setCreditRate(settings.creditInterestRate ?? 1);
      setDebitRate(settings.debitInterestRate ?? 1);
    }
  }, [settings]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('mandal_token');
      const response = await axios.get(`${API_URL}/settings/backup/export`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/octet-stream' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `bapa_sitaram_mandal_backup_${new Date().toISOString().slice(0, 10)}.db`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('ડેટાબેઝ બેકઅપ સફળતાપૂર્વક ડાઉનલોડ થયો! (Database exported!)');
    } catch (err) {
      console.error(err);
      toast.error('બેકઅપ નિકાસ કરવામાં ભૂલ આવી! (Error exporting database)');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    e.target.value = '';

    const confirmRestore = window.confirm(
      "⚠️ શું તમે ખરેખર બેકઅપ રીસ્ટોર કરવા માંગો છો?\nઆયાત કરવાથી ચાલુ તમામ ડેટા (સભ્યો, હપ્તા, વ્યવહારો) ઓવરરાઈટ થઈ જશે અને પાછો નહીં મળે!"
    );
    if (!confirmRestore) return;

    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('mandal_token');
      await axios.post(`${API_URL}/settings/backup/import`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      toast.success('ડેટાબેઝ સફળતાપૂર્વક રીસ્ટોર થયો! (Database restored!)');
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'ડેટાબેઝ આયાત કરવામાં ભૂલ આવી! (Error importing database)');
    } finally {
      setImporting(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings({
        creditInterestRate: Number(creditRate),
        debitInterestRate: Number(debitRate)
      });
      toast.success('સેટિંગ્સ સફળતાપૂર્વક અપડેટ થયા! (Settings updated!)');
    } catch (err) {
      console.error(err);
      toast.error('સેટિંગ્સ સેવ કરવામાં ભૂલ આવી! (Error saving settings)');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="d-flex align-items-center gap-2 mb-4">
        <h4 className="fw-bold mb-0">⚙️ સિસ્ટમ સેટિંગ્સ (Settings)</h4>
      </div>

      <div className="card border-0 shadow-sm p-4 mb-4">
        <form onSubmit={handleSave}>
          <div className="row g-4">
            
            {}
            <div className="col-md-6">
              <div className="p-3 border rounded-3 bg-light bg-opacity-50 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-center gap-2 text-success mb-2">
                    <MdTrendingUp size={24} />
                    <h5 className="fw-bold mb-0">જમા વ્યાજ દર (Credit Interest)</h5>
                  </div>
                  <p className="text-muted small">
                    સભ્યોના જમા બેલેન્સ પર દર મહિને ગણાતું વ્યાજ (દા.ત. ૧% વ્યાજ દર નક્કી કર્યો હોય, તો બેલેન્સ ૧.૦૧ ગણું થશે).
                  </p>
                </div>
                <div className="input-group mt-3">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="form-control"
                    required
                    value={creditRate}
                    onChange={(e) => setCreditRate(e.target.value)}
                  />
                  <span className="input-group-text">%</span>
                </div>
              </div>
            </div>

            {}
            <div className="col-md-6">
              <div className="p-3 border rounded-3 bg-light bg-opacity-50 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-center gap-2 text-danger mb-2">
                    <MdTrendingDown size={24} />
                    <h5 className="fw-bold mb-0">ઉપાડ વ્યાજ દર (Debit Interest)</h5>
                  </div>
                  <p className="text-muted small">
                    સભ્યો દ્વારા લેવામાં આવેલ ઉપાડ (Withdrawal) પર ચાર્જ થતું વ્યાજ (દા.ત. ૧% વ્યાજ દર હોય, તો ઉપાડની રકમ પર ૧% વ્યાજ ગણાશે).
                  </p>
                </div>
                <div className="input-group mt-3">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="form-control"
                    required
                    value={debitRate}
                    onChange={(e) => setDebitRate(e.target.value)}
                  />
                  <span className="input-group-text">%</span>
                </div>
              </div>
            </div>

          </div>

          <div className="d-flex justify-content-end mt-4 pt-3 border-top">
            <button
              type="submit"
              className="btn btn-primary px-4 d-flex align-items-center gap-2"
              disabled={saving}
            >
              <MdSave />
              {saving ? 'સેવ થઈ રહ્યું છે...' : '💾 સેટિંગ્સ સેવ કરો'}
            </button>
          </div>
        </form>
      </div>

      {}
      <div className="card border-0 shadow-sm p-4 mb-4">
        <div className="d-flex align-items-center gap-2 mb-3">
          <MdBackup size={24} className="text-primary" />
          <h5 className="fw-bold mb-0">📁 ડેટા બેકઅપ અને રીસ્ટોર (Backup & Restore)</h5>
        </div>
        <p className="text-muted small mb-4">
          તમારી મંડળની માહિતી સુરક્ષિત રાખવા માટે તેનો બેકઅપ ડાઉનલોડ કરો અથવા કોઈ બીજા ડિવાઇસમાંથી ડેટા લાવવા માટે બેકઅપ ફાઈલ (.db) અહીં અપલોડ કરો.
        </p>

        <div className="row g-4">
          
          {}
          <div className="col-md-6">
            <div className="p-3 border rounded-3 bg-light bg-opacity-50 h-100 d-flex flex-column justify-content-between">
              <div>
                <h6 className="fw-bold mb-2">📥 ડેટા નિકાસ કરો (Export Backup)</h6>
                <p className="text-muted small mb-3">
                  તમામ સભ્યો, હપ્તા અને વ્યવહારોની વિગતો ધરાવતી નવીનતમ બેકઅપ ફાઈલ (.db) તમારા કમ્પ્યુટરમાં ડાઉનલોડ કરો.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2"
                onClick={handleExport}
                disabled={exporting || importing}
              >
                <MdCloudDownload size={20} />
                {exporting ? 'નિકાસ થઈ રહ્યું છે...' : 'ડાઉનલોડ કરો (Export)'}
              </button>
            </div>
          </div>

          {}
          <div className="col-md-6">
            <div className="p-3 border rounded-3 bg-light bg-opacity-50 h-100 d-flex flex-column justify-content-between">
              <div>
                <h6 className="fw-bold mb-2 text-danger">📤 ડેટા આયાત કરો (Import Backup)</h6>
                <p className="text-muted small mb-3">
                  તમારા પહેલાં લીધેલ બેકઅપ ફાઈલ (.db) અપલોડ કરીને ડેટા રીસ્ટોર કરો. <strong>(નોંધ: આનાથી ચાલુ ડેટા બદલાઈ જશે)</strong>.
                </p>
              </div>
              <div>
                <label
                  htmlFor="import-db-input"
                  className={`btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2 ${importing || exporting ? 'disabled' : ''}`}
                  style={{ cursor: 'pointer' }}
                >
                  <MdCloudUpload size={20} />
                  {importing ? 'આયાત થઈ રહ્યું છે...' : 'ફાઇલ અપલોડ કરો (Import)'}
                </label>
                <input
                  id="import-db-input"
                  type="file"
                  accept=".db"
                  style={{ display: 'none' }}
                  onChange={handleImport}
                  disabled={importing || exporting}
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="card border-0 shadow-sm p-3 bg-warning bg-opacity-10 text-warning-emphasis">
        <small>
          <strong>💡 નોંધ:</strong> સેટિંગ્સ બદલ્યા પછી તમામ માસિક રિપોર્ટ અને બેલેન્સની ગણતરી આપોઆપ નવા નક્કી કરેલા વ્યાજ દરો અનુસાર અપડેટ થઈ જશે.
        </small>
      </div>
    </div>
  );
};

export default SettingsPage;
