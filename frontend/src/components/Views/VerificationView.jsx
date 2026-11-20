import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  ClipboardCheck,
  Upload,
  Camera,
  CheckCircle2,
  AlertOctagon,
  RefreshCw,
  UserCheck,
  Send,
  Database
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function VerificationView() {
  const { inspectedPoint, locationName } = useAppStore();

  const [logs, setLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Form state
  const [lat, setLat] = useState(inspectedPoint?.lat || 35.1952);
  const [lon, setLon] = useState(inspectedPoint?.lon || 72.5641);
  const [regionId, setRegionId] = useState('swat');
  const [officerName, setOfficerName] = useState('Sub-Divisional Forest Officer (SDFO) Swat');
  const [status, setStatus] = useState('Confirmed Disturbance');
  const [cause, setCause] = useState('Illegal Logging / Tree Cutting');
  const [notes, setNotes] = useState('Ground ranger inspected fresh tree cutting near vehicular access track. Counted 14 mature cedar stumps.');
  const [confidence, setConfidence] = useState(5);
  const [photo, setPhoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (inspectedPoint) {
      setLat(inspectedPoint.lat);
      setLon(inspectedPoint.lon);
    }
  }, [inspectedPoint]);

  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const resp = await fetch('/api/verify');
      const data = await resp.json();
      setLogs(data.data || []);
    } catch {
      toast.error('Failed to load verification logs.');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('region_id', regionId);
      formData.append('latitude', lat);
      formData.append('longitude', lon);
      formData.append('detected_class', 'Forest Loss');
      formData.append('verification_status', status);
      formData.append('disturb_cause', cause);
      formData.append('notes', notes);
      formData.append('officer_name', officerName);
      formData.append('confidence_rating', confidence);
      if (photo) {
        formData.append('photo', photo);
      }

      const resp = await fetch('/api/verify', {
        method: 'POST',
        body: formData
      });
      const data = await resp.json();

      if (data.success) {
        toast.success(`Verification log #${data.id} stored in SQLite!`);
        setPhoto(null);
        fetchLogs();
      } else {
        toast.error(data.error || 'Failed to save log.');
      }
    } catch (err) {
      toast.error('Network error saving verification log.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalLogs = logs.length;
  const confirmedCount = logs.filter((l) => l.verification_status === 'Confirmed Disturbance').length;
  const falseAlarmCount = logs.filter((l) => l.verification_status.includes('False Alarm')).length;
  const confirmedPct = totalLogs > 0 ? ((confirmedCount / totalLogs) * 100).toFixed(0) : 0;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-forest-card border border-forest-border p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-guardian-400" />
            Field Verification & Ground Truth Feedback Loop
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Synchronizing satellite early warnings with physical ranger inspections to build localized ground truth datasets.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs bg-forest-dark px-3 py-1.5 rounded-xl border border-forest-border text-slate-300 font-mono flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-guardian-400" /> SQLite Database Active
          </span>
        </div>
      </div>

      {/* KPI Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-forest-card border border-forest-border p-4 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Ground Logs</span>
            <div className="text-2xl font-extrabold text-white font-mono">{totalLogs}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-forest-dark border border-forest-border flex items-center justify-center text-guardian-400">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-forest-card border border-forest-border p-4 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Confirmed Disturbance</span>
            <div className="text-2xl font-extrabold text-red-400 font-mono">{confirmedCount} <span className="text-xs font-normal text-slate-400">({confirmedPct}%)</span></div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-400">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-forest-card border border-forest-border p-4 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">False Alarms Filtered</span>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono">{falseAlarmCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Grid: Form + SQLite Log Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-5 bg-forest-card border border-forest-border p-5 rounded-2xl shadow-xl space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-1.5 border-b border-forest-border pb-3">
            <Camera className="w-4 h-4 text-guardian-400" /> Log Ranger Ground Inspection
          </h3>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block mb-1">Target Latitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value))}
                  className="w-full bg-forest-dark border border-forest-border rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-guardian-500"
                  required
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Target Longitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={lon}
                  onChange={(e) => setLon(parseFloat(e.target.value))}
                  className="w-full bg-forest-dark border border-forest-border rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-guardian-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Inspecting Officer / Ranger</label>
              <input
                type="text"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                className="w-full bg-forest-dark border border-forest-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-guardian-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block mb-1">Verification Outcome</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-forest-dark border border-forest-border rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-guardian-500"
                >
                  <option value="Confirmed Disturbance">Confirmed Disturbance</option>
                  <option value="False Alarm (Natural/Seasonal)">False Alarm (Seasonal Thinning)</option>
                  <option value="Inconclusive / Inaccessible">Inconclusive / Inaccessible</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Observed Cause</label>
                <select
                  value={cause}
                  onChange={(e) => setCause(e.target.value)}
                  className="w-full bg-forest-dark border border-forest-border rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-guardian-500"
                >
                  <option value="Illegal Logging / Tree Cutting">Illegal Logging / Tree Cutting</option>
                  <option value="Wildfire / Surface Burn">Wildfire / Surface Burn</option>
                  <option value="Landslide / Soil Slippage">Landslide / Soil Slippage</option>
                  <option value="Snow Damage / Windthrow">Snow Damage / Windthrow</option>
                  <option value="Seasonal Needlecast / Mistletoe">Seasonal Needlecast</option>
                  <option value="Encroachment / Road Construction">Encroachment</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Field Observations & Stump Count</label>
              <textarea
                rows="3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-forest-dark border border-forest-border rounded-xl p-3 text-white focus:outline-none focus:border-guardian-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Upload Ground Photo Evidence</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files[0])}
                className="w-full bg-forest-dark border border-forest-border rounded-xl p-2 text-slate-300 text-xs file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-guardian-600 file:text-white hover:file:bg-guardian-500 cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-guardian-600 to-guardian-700 hover:from-guardian-500 hover:to-guardian-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Saving to SQLite...' : 'Save Field Verification Log'}
            </button>
          </form>
        </div>

        {/* SQLite Logs Table Column */}
        <div className="lg:col-span-7 bg-forest-card border border-forest-border rounded-2xl p-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-forest-border pb-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-guardian-400" /> Ground Verification Audit Log
              </h3>
              <button
                onClick={fetchLogs}
                disabled={isLoadingLogs}
                className="text-xs text-guardian-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingLogs ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[440px] pr-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-forest-dark/80 border border-forest-border/80 rounded-xl p-3 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      #{log.id} &bull; {log.officer_name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        log.verification_status === 'Confirmed Disturbance'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {log.verification_status}
                    </span>
                  </div>

                  <p className="text-slate-300 text-[11px] font-medium pt-0.5">{log.notes}</p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-forest-border/60">
                    <span className="font-mono">{log.latitude.toFixed(4)}, {log.longitude.toFixed(4)} ({log.disturb_cause})</span>
                    <span>{log.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-forest-dark/70 rounded-xl p-3 border border-forest-border/70 text-[11px] text-slate-400 mt-3">
            <strong className="text-guardian-300">Continuous Model Feedback:</strong> Ground confirmation and false-alarm data recorded by officers feed back into quarterly Random Forest retraining to suppress future false positives.
          </div>
        </div>
      </div>
    </div>
  );
}
