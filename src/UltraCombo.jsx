import React, { useState, useEffect } from "react";
import { Trophy, RefreshCw, AlertCircle, Copy, CheckCircle, Sparkles, Flame } from "lucide-react";

export default function UltraCombo() {
  const [matches, setMatches] = useState([]);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchGithubData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Ajout d'un timestamp pour éviter la mise en cache navigateur
      const response = await fetch(`/data.json?t=${Date.now()}`);
      
      if (!response.ok) {
        throw new Error(`Fichier data.json introuvable sur GitHub (HTTP ${response.status})`);
      }

      const data = await response.json();
      const matchArray = data.matches || [];

      if (matchArray.length === 0) {
        throw new Error("Aucun match disponible dans data.json.");
      }

      setMatches(matchArray.map((m, i) => ({ ...m, id: m.id || `m-${i}`, selected: true })));
      setGeneratedAt(data.generatedAt || null);
    } catch (err) {
      console.error(err);
      setError(err.message || "Erreur lors de la récupération des données GitHub.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGithubData();
  }, []);

  const toggleSelect = (id) => {
    setMatches(prev => prev.map(m => m.id === id ? { ...m, selected: !m.selected } : m));
  };

  const handleCopy = () => {
    const selected = matches.filter(m => m.selected);
    if (!selected.length) return;

    let text = "🚀 *COMBINÉ DU JOUR - ULTRA COMBO* 🚀\n\n";
    selected.forEach((m) => {
      text += `⚽ *${m.homeTeam || m.home} vs ${m.awayTeam || m.away}*\n`;
      text += `🏆 ${m.league} (${m.time})\n`;
      text += `🎯 Pronostic : *${m.prediction}*\n`;
      text += `📊 Score estimé : ≈ ${m.expectedScore || m.estScore || 'N/A'}\n`;
      text += `🔥 Confiance : ${m.confidence}%\n\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Chargement des données GitHub en cours...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-100 mb-2">Données non disponibles</h2>
          <p className="text-sm text-slate-400 mb-6">{error}</p>
          <button 
            onClick={fetchGithubData}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl transition flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Actualiser la page
          </button>
        </div>
      </div>
    );
  }

  const selectedMatches = matches.filter(m => m.selected);
  const avgConfidence = selectedMatches.length > 0
    ? Math.round(selectedMatches.reduce((acc, m) => acc + Number(m.confidence || 0), 0) / selectedMatches.length)
    : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                ULTRA COMBO <Sparkles className="w-5 h-5 text-amber-400 inline" />
              </h1>
              <p className="text-xs text-slate-400">
                {generatedAt ? `Mis à jour le : ${new Date(generatedAt).toLocaleString('fr-FR')}` : 'Données GitHub Réelles'}
              </p>
            </div>
          </div>

          <button
            onClick={fetchGithubData}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl transition flex items-center gap-2 text-xs font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Actualiser</span>
          </button>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl text-center">
            <span className="text-xs text-slate-400 font-medium mb-1 block">Matchs Sélectionnés</span>
            <span className="text-2xl font-bold text-white">{selectedMatches.length} / {matches.length}</span>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl text-center">
            <span className="text-xs text-slate-400 font-medium mb-1 block">Confiance Moyenne</span>
            <span className="text-2xl font-bold text-emerald-400 flex items-center justify-center gap-1">
              <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
              {avgConfidence}%
            </span>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex items-center justify-center">
            <button
              onClick={handleCopy}
              disabled={selectedMatches.length === 0}
              className={`w-full h-full py-3 px-4 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 ${
                copied ? 'bg-emerald-500 text-slate-950' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
              }`}
            >
              {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              {copied ? 'Copié !' : 'Copier la Sélection'}
            </button>
          </div>
        </div>

        {/* Liste des matchs réels */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 px-1">
            Matchs Réels GitHub ({matches.length})
          </h2>

          {matches.map((m) => (
            <div 
              key={m.id}
              onClick={() => toggleSelect(m.id)}
              className={`cursor-pointer transition-all border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                m.selected ? 'bg-slate-900 border-emerald-500/40 shadow-sm' : 'bg-slate-900/40 border-slate-800/80 opacity-60'
              }`}
            >
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <input 
                  type="checkbox" 
                  checked={m.selected} 
                  onChange={() => {}} 
                  className="w-5 h-5 rounded border-slate-700 text-emerald-500 bg-slate-800"
                />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                      {m.league}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{m.time}</span>
                  </div>
                  <h3 className="text-base font-bold text-white">
                    {m.homeTeam || m.home} <span className="text-slate-500 font-normal">vs</span> {m.awayTeam || m.away}
                  </h3>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0">
                <div className="text-left sm:text-right">
                  <div className="text-xs text-slate-400">Pronostic</div>
                  <div className="text-sm font-bold text-emerald-400">{m.prediction}</div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-xs text-slate-400">Score Est.</div>
                  <div className="text-sm font-mono font-semibold text-slate-200">≈ {m.expectedScore || m.estScore || 'N/A'}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Confiance</div>
                  <div className="text-sm font-black text-amber-400">{m.confidence}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
