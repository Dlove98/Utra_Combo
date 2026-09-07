import React, { useState, useEffect } from 'react';
import { 
  Trophy, Flame, CheckCircle, RefreshCw, Copy, RotateCcw, 
  ChevronDown, ChevronUp, AlertCircle, Info, Sparkles 
} from 'lucide-react';

const STORAGE_KEY = "ultra-combo-data-v2";

export default function UltraCombo() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Charger les données avec contournement du cache du navigateur (?t=Date.now())
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Le paramètre ?t=... force le navigateur à télécharger le fichier fraîchement généré par Python
      const res = await fetch(`/data.json?t=${Date.now()}`);
      if (!res.ok) {
        throw new Error(`Impossible de charger public/data.json (Statut HTTP ${res.status})`);
      }
      const jsonData = await res.json();
      
      // Sauvegarder dans l'état et local storage
      setData(jsonData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(jsonData));
    } catch (err) {
      console.warn("Erreur chargement public/data.json, tentative de récupération via LocalStorage", err);
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          setData(JSON.parse(saved));
        } catch (e) {
          setError(err.message);
        }
      } else {
        setError("Fichier data.json introuvable. Assurez-vous d'avoir exécuté votre script Python pour créer public/data.json.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Réinitialiser les données en rechargeant directement public/data.json
  const handleReset = () => {
    if (window.confirm("Voulez-vous forcer le rechargement depuis public/data.json ?")) {
      localStorage.removeItem(STORAGE_KEY);
      loadData();
    }
  };

  // Basculer la sélection d'un match
  const toggleSelectMatch = (matchId) => {
    if (!data || !data.matches) return;
    const updatedMatches = data.matches.map(m => 
      m.id === matchId ? { ...m, selected: !m.selected } : m
    );
    const updatedData = { ...data, matches: updatedMatches };
    setData(updatedData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
  };

  // Copier la sélection dans le presse-papier
  const handleCopyCombo = () => {
    if (!data || !data.matches) return;
    const selectedMatches = data.matches.filter(m => m.selected !== false);
    if (selectedMatches.length === 0) return;

    let text = "🚀 *COMBINÉ DU JOUR - ULTRA COMBO* 🚀\n\n";
    selectedMatches.forEach((m) => {
      text += `⚽ *${m.homeTeam} vs ${m.awayTeam}*\n`;
      text += `🏆 ${m.league} (${m.time})\n`;
      text += `🎯 Pronostic : *${m.prediction}*\n`;
      text += `📊 Score estimé : ≈ ${m.expectedScore || 'N/A'}\n`;
      text += `🔥 Confiance : ${m.confidence}%\n\n`;
    });
    text += " Good luck ! 🍀";

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Chargement des derniers pronostics...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-6 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-100 mb-2">Erreur de chargement</h2>
          <p className="text-sm text-slate-400 mb-6">{error}</p>
          <button 
            onClick={loadData}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl transition flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Réessayer
          </button>
        </div>
      </div>
    );
  }

  const matches = data?.matches || [];
  const selectedMatches = matches.filter(m => m.selected !== false);
  const avgConfidence = selectedMatches.length > 0 
    ? Math.round(selectedMatches.reduce((acc, m) => acc + (m.confidence || 0), 0) / selectedMatches.length)
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
                Généré le : {data?.generatedAt ? new Date(data.generatedAt).toLocaleString('fr-FR') : 'Aujourd\'hui'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={loadData}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl transition flex items-center gap-2 text-xs font-semibold"
              title="Rafraîchir depuis public/data.json"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Rafraîchir</span>
            </button>
            <button
              onClick={handleReset}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl transition flex items-center gap-2 text-xs font-semibold"
              title="Réinitialiser"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </header>

        {/* Stats Summary Card */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex flex-col items-center justify-center text-center">
            <span className="text-xs text-slate-400 font-medium mb-1">Matchs sélectionnés</span>
            <span className="text-2xl font-bold text-white">{selectedMatches.length} / {matches.length}</span>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex flex-col items-center justify-center text-center">
            <span className="text-xs text-slate-400 font-medium mb-1">Indice de Confiance Moven</span>
            <span className="text-2xl font-bold text-emerald-400 flex items-center gap-1">
              <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
              {avgConfidence}%
            </span>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex items-center justify-center">
            <button
              onClick={handleCopyCombo}
              disabled={selectedMatches.length === 0}
              className={`w-full h-full py-3 px-4 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 ${
                copied 
                  ? 'bg-emerald-500 text-slate-950' 
                  : selectedMatches.length > 0 
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              {copied ? 'Copié dans le presse-papier !' : 'Copier le Combiné'}
            </button>
          </div>
        </div>

        {/* List of Matches */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 px-1">
            Sélection des Matchs du Jour ({matches.length})
          </h2>

          {matches.length === 0 ? (
            <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
              Aucun match disponible dans public/data.json pour le moment.
            </div>
          ) : (
            matches.map((m) => {
              const isSelected = m.selected !== false;
              return (
                <div 
                  key={m.id || m.homeTeam}
                  onClick={() => toggleSelectMatch(m.id)}
                  className={`cursor-pointer transition-all border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isSelected 
                      ? 'bg-slate-900 border-emerald-500/40 shadow-sm' 
                      : 'bg-slate-900/40 border-slate-800/80 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <input 
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // géré par le clic sur le conteneur
                      className="w-5 h-5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-800"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                          {m.league}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">{m.time}</span>
                      </div>
                      <h3 className="text-base font-bold text-white">
                        {m.homeTeam} <span className="text-slate-500 font-normal">vs</span> {m.awayTeam}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <div className="text-xs text-slate-400">Pronostic</div>
                      <div className="text-sm font-bold text-emerald-400">{m.prediction}</div>
                    </div>

                    {m.expectedScore && (
                      <div className="text-left sm:text-right">
                        <div className="text-xs text-slate-400">Score Est.</div>
                        <div className="text-sm font-mono font-semibold text-slate-200">≈ {m.expectedScore}</div>
                      </div>
                    )}

                    <div className="text-right">
                      <div className="text-xs text-slate-400">Confiance</div>
                      <div className="text-sm font-black text-amber-400">{m.confidence}%</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
