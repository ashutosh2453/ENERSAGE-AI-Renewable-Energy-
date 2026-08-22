import React, { useState, useCallback } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { projectAPI, dataAPI } from '../services/api';
import { Upload, File, X, Check, AlertTriangle, Plus, FolderOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FIELD_OPTIONS = [
  { value: '', label: '— Skip —' },
  { value: 'timestamp', label: 'Timestamp' },
  { value: 'solarGeneration', label: 'Solar Generation (kW)' },
  { value: 'windGeneration', label: 'Wind Generation (kW)' },
  { value: 'energyDemand', label: 'Energy Demand (kW)' },
  { value: 'batterySOC', label: 'Battery SOC (%)' },
  { value: 'batteryCapacity', label: 'Battery Capacity (kWh)' },
  { value: 'gridPrice', label: 'Grid Price ($/kWh)' },
  { value: 'temperature', label: 'Temperature (°C)' },
  { value: 'solarIrradiance', label: 'Solar Irradiance (W/m²)' },
  { value: 'cloudCoverage', label: 'Cloud Coverage (%)' },
  { value: 'humidity', label: 'Humidity (%)' },
  { value: 'windSpeed', label: 'Wind Speed (m/s)' },
  { value: 'windDirection', label: 'Wind Direction (°)' },
  { value: 'rainProbability', label: 'Rain Probability (%)' },
];

const UploadPage = () => {
  const { currentProject, projects, fetchProjects } = useProject();
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [columnMap, setColumnMap] = useState({});
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [targetProject, setTargetProject] = useState(currentProject || '');
  const [creatingProject, setCreatingProject] = useState(false);

  const parseHeaders = (f) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const firstLine = e.target.result.split('\n')[0];
      const headers = firstLine.split(',').map(h => h.trim().replace(/['"]/g, ''));
      setCsvHeaders(headers);
      // Auto-map headers that match field names
      const autoMap = {};
      headers.forEach(h => {
        const match = FIELD_OPTIONS.find(opt => opt.value === h || opt.value.toLowerCase() === h.toLowerCase());
        if (match) autoMap[h] = match.value;
        else autoMap[h] = '';
      });
      setColumnMap(autoMap);
    };
    reader.readAsText(f.slice(0, 2048));
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith('.csv')) {
      setFile(f);
      setUploadResult(null);
      setError('');
      parseHeaders(f);
    } else {
      setError('Please upload a CSV file.');
    }
  }, []);

  const onFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setUploadResult(null);
      setError('');
      parseHeaders(f);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    setCreatingProject(true);
    try {
      const res = await projectAPI.create({ name: newProjectName.trim(), description: 'Uploaded dataset' });
      await fetchProjects();
      setTargetProject(res.data._id);
      setNewProjectName('');
    } catch (err) {
      setError('Failed to create project.');
    } finally {
      setCreatingProject(false);
    }
  };

  const handleUpload = async () => {
    if (!file || !targetProject) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      // Append column mapping
      formData.append('columnMap', JSON.stringify(columnMap));
      const res = await dataAPI.uploadCSV(targetProject, formData);
      setUploadResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
          <Upload className="text-energy-cyan" size={24} />
          Upload Energy Data
        </h1>
        <p className="text-slate-400 text-sm">Import your CSV data with automatic column detection and field mapping</p>
      </div>

      {/* Project selector */}
      <div className="glass p-5 space-y-4">
        <h2 className="text-white font-semibold text-sm flex items-center gap-2"><FolderOpen size={14} className="text-energy-cyan" />Target Project</h2>
        <div className="flex gap-3">
          <select
            value={targetProject}
            onChange={e => setTargetProject(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-energy-cyan/50"
          >
            <option value="">Select a project...</option>
            {(projects || []).map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Or create new project..."
            value={newProjectName}
            onChange={e => setNewProjectName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateProject()}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-energy-cyan/50"
          />
          <button onClick={handleCreateProject} disabled={!newProjectName.trim() || creatingProject}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-energy-cyan/10 border border-energy-cyan/30 text-energy-cyan text-sm hover:bg-energy-cyan/20 transition-colors disabled:opacity-50">
            {creatingProject ? <div className="w-4 h-4 border-2 border-energy-cyan/30 border-t-energy-cyan rounded-full animate-spin" /> : <Plus size={14} />}
            Create
          </button>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`glass border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
          dragOver ? 'border-energy-cyan bg-energy-cyan/5 glow-cyan' : 'border-white/10 hover:border-energy-cyan/40'
        }`}
        onClick={() => document.getElementById('csv-input').click()}
      >
        <input id="csv-input" type="file" accept=".csv" onChange={onFileChange} className="hidden" />
        <AnimatePresence mode="wait">
          {file ? (
            <motion.div key="file" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-energy-cyan/10 flex items-center justify-center"><File className="text-energy-cyan" size={28} /></div>
              <p className="text-white font-semibold">{file.name}</p>
              <p className="text-slate-400 text-sm">{(file.size / 1024).toFixed(1)} KB — {csvHeaders.length} columns detected</p>
              <button onClick={e => { e.stopPropagation(); setFile(null); setCsvHeaders([]); setColumnMap({}); }}
                className="text-slate-500 hover:text-red-400 text-xs flex items-center gap-1 transition-colors">
                <X size={12} />Remove
              </button>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${dragOver ? 'bg-energy-cyan/20' : 'bg-white/5'}`}>
                <Upload className={dragOver ? 'text-energy-cyan' : 'text-slate-500'} size={28} />
              </div>
              <p className="text-white font-medium">Drop your CSV file here</p>
              <p className="text-slate-400 text-sm">or click to browse — supports any column naming convention</p>
              <p className="text-slate-600 text-xs mt-1">Expected columns: timestamp, solarGeneration, windGeneration, energyDemand, batterySOC...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Column mapper */}
      {csvHeaders.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass p-5 space-y-4">
          <h2 className="text-white font-semibold text-sm">Column Mapping</h2>
          <p className="text-slate-400 text-xs">Map your CSV columns to ENER SAGE AI fields. Columns marked as "Skip" will be ignored.</p>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {csvHeaders.map(header => (
              <div key={header} className="flex items-center gap-3">
                <span className="flex-1 text-slate-300 text-sm font-mono bg-white/5 rounded px-2 py-1 truncate">{header}</span>
                <span className="text-slate-600 text-xs">→</span>
                <select
                  value={columnMap[header] || ''}
                  onChange={e => setColumnMap(prev => ({ ...prev, [header]: e.target.value }))}
                  className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-energy-cyan/50"
                >
                  {FIELD_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-400/10 border border-red-400/20 text-red-400 text-sm">
          <AlertTriangle size={14} />
          {error}
        </div>
      )}

      {/* Upload result */}
      {uploadResult && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass p-5 border border-energy-green/20 bg-energy-green/5">
          <div className="flex items-center gap-2 mb-3">
            <Check className="text-energy-green" size={18} />
            <span className="text-energy-green font-semibold">Upload Successful</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-2xl font-bold text-white">{uploadResult.inserted}</p><p className="text-slate-400 text-xs">Records Inserted</p></div>
            <div><p className="text-2xl font-bold text-white">{uploadResult.columns?.length || 0}</p><p className="text-slate-400 text-xs">Columns Detected</p></div>
            <div><p className="text-2xl font-bold text-white">{uploadResult.missingFields?.length || 0}</p><p className="text-slate-400 text-xs">Missing Fields</p></div>
          </div>
          {uploadResult.missingFields?.length > 0 && (
            <p className="mt-3 text-amber-400 text-xs flex items-center gap-1">
              <AlertTriangle size={12} />
              Missing fields (defaults used): {uploadResult.missingFields.join(', ')}
            </p>
          )}
        </motion.div>
      )}

      {/* Upload button */}
      {file && !uploadResult && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleUpload}
          disabled={uploading || !targetProject}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-energy-cyan to-energy-green text-bg-space font-bold text-sm glow-cyan hover:opacity-90 transition-all disabled:opacity-60"
        >
          {uploading ? (
            <><div className="w-4 h-4 border-2 border-bg-space/30 border-t-bg-space rounded-full animate-spin" />Uploading & Validating...</>
          ) : (
            <><Upload size={16} />Upload {csvHeaders.length} Columns to {targetProject ? 'Project' : '(Select a project first)'}</>
          )}
        </motion.button>
      )}
    </div>
  );
};

export default UploadPage;
