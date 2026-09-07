import React, { useState, useEffect, useCallback } from "react";
import { Check, X, Copy, ChevronDown, ChevronRight, RotateCcw } from "lucide-react";

const STORAGE_KEY = "ultra-combo-data";

const LEAGUES = [
  "Premier League", "Ligue 1", "La Liga", "Serie A", "Bundesliga",
  "Championship", "Eredivisie", "Eliteserien", "Süper Lig", "Pro League", "Saudi Pro League"
];

const TEAMS_BY_LEAGUE = {
  "Premier League": ["Arsenal", "Aston Villa", "Bournemouth", "Brentford", "Brighton", "Chelsea", "Coventry City", "Crystal Palace", "Everton", "Fulham", "Hull City", "Ipswich Town", "Leeds United", "Liverpool", "Manchester City", "Manchester United", "Newcastle United", "Nottingham Forest", "Sunderland", "Tottenham Hotspur"],
  "Ligue 1": ["AJ Auxerre", "Angers SCO", "AS Monaco", "FC Lorient", "Le Havre AC", "Le Mans FC", "LOSC Lille", "OGC Nice", "Olympique Lyonnais", "Olympique de Marseille", "Paris FC", "Paris Saint-Germain", "RC Lens", "RC Strasbourg", "Stade Brestois", "Stade Rennais", "Toulouse FC", "Troyes"],
  "La Liga": ["Athletic Bilbao", "Atlético de Madrid", "CA Osasuna", "Celta de Vigo", "Deportivo Alavés", "Deportivo La Corogne", "Elche CF", "FC Barcelone", "Getafe CF", "Levante UD", "Málaga CF", "Racing de Santander", "Rayo Vallecano", "RCD Espanyol", "Real Betis", "Real Madrid", "Real Sociedad", "Sevilla FC", "Valencia CF", "Villarreal CF"],
  "Serie A": ["AC Milan", "AC Monza", "ACF Fiorentina", "AS Roma", "Atalanta Bergame", "Bologna FC", "Cagliari Calcio", "Como 1907", "Frosinone Calcio", "Genoa CFC", "Inter Milan", "Juventus", "Parma Calcio", "SS Lazio", "SSC Napoli", "Torino FC", "Udinese Calcio", "US Lecce", "US Sassuolo", "Venezia FC"],
  "Bundesliga": ["Bayer Leverkusen", "Bayern Munich", "Borussia Dortmund", "Borussia Mönchengladbach", "Eintracht Frankfurt", "FC Augsburg", "FC St. Pauli", "Hamburger SV", "Holstein Kiel", "Mainz 05", "RB Leipzig", "SC Freiburg", "TSG Hoffenheim", "Union Berlin", "VfB Stuttgart", "VfL Bochum", "VfL Wolfsburg", "Werder Bremen"],
  "Championship": ["Sheffield United", "Burnley", "Luton Town", "West Brom", "Coventry City", "Middlesbrough", "Norwich City", "Watford", "Blackburn Rovers", "Millwall", "Bristol City", "Swansea City", "Preston North End", "Plymouth Argyle", "Stoke City", "QPR", "Portsmouth", "Derby County", "Oxford United", "Sheffield Wednesday"],
  "Eredivisie": ["PSV Eindhoven", "Feyenoord", "Ajax Amsterdam", "AZ Alkmaar", "FC Twente", "FC Utrecht", "Go Ahead Eagles", "Sparta Rotterdam", "NEC Nijmegen", "SC Heerenveen", "PEC Zwolle", "Fortuna Sittard", "Heracles Almelo", "RKC Waalwijk", "NAC Breda", "Willem II", "FC Groningen"],
  "Eliteserien": ["Bodø/Glimt", "Molde FK", "SK Brann", "Viking FK", "Rosenborg BK", "Lillestrøm SK", "Tromsø IL", "Fredrikstad FK", "KFUM Oslo", "Sarpsborg 08", "Strømsgodset", "Odds BK", "HamKam", "Haugesund", "Sandefjord"],
  "Süper Lig": ["Galatasaray", "Fenerbahçe", "Beşiktaş", "Trabzonspor", "Istanbul Başakşehir", "Kasimpasa", "Sivasspor", "Alanyaspor", "Rizespor", "Antalyaspor", "Gaziantep FK", "Konyaspor", "Samsunspor", "Kayserispor"],
  "Pro League": ["Club Brugge", "Royale Union SG", "RSC Anderlecht", "KAA Gent", "KRC Genk", "Cercle Brugge", "Royal Antwerp", "KV Mechelen", "Sint-Truiden", "Standard Liège", "Westerlo", "OH Leuven", "Charleroi", "Kortrijk"],
  "Saudi Pro League": ["Al-Hilal", "Al-Nassr", "Al-Ittihad", "Al-Ahli", "Al-Ettifaq", "Al-Shabab", "Al-Taawoun", "Al-Fateh", "Al-Fayha", "Al-Khaleej", "Al-Raed", "Damac FC"]
};

const ESTIMATED_SCORES = ["2-1", "1-1", "0-2", "1-0", "2-0", "1-2", "3-1", "0-0", "2-2", "3-0"];

function pad(n) { return n < 10 ? `0${n}` : `${n}`; }
function dateStr(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function addDays(base, n) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}
function displayDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffled(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function makeMatch(idx) {
  const league = pick(LEAGUES);
  const teams = shuffled(TEAMS_BY_LEAGUE[league] || TEAMS_BY_LEAGUE["Premier League"]);
  const home = teams[0];
  const away = teams[1] || teams[0];
  const hour = 13 + Math.floor(Math.random() * 8);
  const minute = pick([0, 15, 30, 45]);
  const confidence = 64 + Math.floor(Math.random() * 30);
  const dcSide = pick(["1X", "X2", "12"]);
  const prediction = Math.random() > 0.45 ? "GG (BTTS)" : `${dcSide} + GG`;
  return {
    id: `m${Date.now()}-${idx}-${Math.floor(Math.random() * 100000)}`,
    time: `${pad(hour)}:${pad(minute)}`,
    league,
    home,
    away,
    prediction,
    estScore: pick(ESTIMATED_SCORES),
    confidence,
    selected: true,
    result: "Pending",
  };
}

function makeCoupon(iso, resolved) {
  const count = 20 + Math.floor(Math.random() * 4);
  const matches = Array.from({ length: count }, (_, i) => {
    const m = makeMatch(i);
    if (resolved) m.result = Math.random() > 0.28 ? "Won" : "Lost";
    return m;
  });
  return { date: iso, matches };
}

function couponStatus(coupon) {
  const results = coupon.matches.filter((m) => m.selected).map((m) => m.result);
  if (results.some((r) => r === "Lost")) return "Lost";
  if (results.every((r) => r === "Won")) return "Won";
  return "Pending";
}

function seedHistory() {
  const out = [];
  const now = new Date();
  for (let i = 1; i <= 6; i++) {
    out.push(makeCoupon(dateStr(addDays(now, -i)), true));
  }
  return out;
}

const statusColors = {
  Won: "text-emerald-400 bg-emerald-950/80 border-emerald-700",
  Lost: "text-rose-400 bg-rose-950/80 border-rose-700",
  Pending: "text-zinc-300 bg-[#1E293B] border-[#2C3E5A]",
};
const statusLabel = { Won: "Gagnant", Lost: "Perdu", Pending: "En attente" };

function confidenceTier(c) {
  if (c >= 82) return { border: "border-emerald-400", text: "text-emerald-400" };
  if (c >= 72) return { border: "border-cyan-400", text: "text-cyan-400" };
  return { border: "border-zinc-600", text: "text-zinc-400" };
}

async function safeGetStorage(key) {
  try {
    if (typeof window !== "undefined" && window.storage && typeof window.storage.get === "function") {
      const res = await window.storage.get(key, false);
      if (res && res.value) return JSON.parse(res.value);
    }
    const local = localStorage.getItem(key);
    if (local) return JSON.parse(local);
  } catch (e) {
    console.error("Erreur de lecture storage:", e);
  }
  return null;
}

async function safeSetStorage(key, value) {
  try {
    if (typeof window !== "undefined" && window.storage && typeof window.storage.set === "function") {
      await window.storage.set(key, JSON.stringify(value), false);
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Erreur d'écriture storage:", e);
  }
}

export default function UltraCombo() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("home");
  const [selectedDate, setSelectedDate] = useState(() => dateStr(new Date()));
  const [openId, setOpenId] = useState(null);
  const [toast, setToast] = useState("");

  const persist = useCallback(async (next) => {
    setData(next);
    await safeSetStorage(STORAGE_KEY, next);
  }, []);

  useEffect(() => {
    (async () => {
      let loaded = await safeGetStorage(STORAGE_KEY);
      const now = new Date();
      const upcoming = [dateStr(now), dateStr(addDays(now, 1)), dateStr(addDays(now, 2))];

      if (!loaded) {
        loaded = { coupons: [...upcoming.map((d) => makeCoupon(d, false)), ...seedHistory()] };
      } else {
        const missing = upcoming.filter((d) => !loaded.coupons.some((c) => c.date === d));
        if (missing.length) {
          loaded = { coupons: [...missing.map((d) => makeCoupon(d, false)), ...loaded.coupons] };
        }
      }
      setData(loaded);
      setLoading(false);
      await safeSetStorage(STORAGE_KEY, loaded);
    })();
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-zinc-300 flex items-center justify-center text-sm font-medium">
        Chargement du coupon…
      </div>
    );
  }

  const today = dateStr(new Date());
  const tomorrow = dateStr(addDays(new Date(), 1));
  const dayPlus2 = dateStr(addDays(new Date(), 2));
  const upcomingDates = [today, tomorrow, dayPlus2];

  const selectedCoupon = data.coupons.find((c) => c.date === selectedDate);
  const history = data.coupons
    .filter((c) => !upcomingDates.includes(c.date))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  function updateMatches(date, updater) {
    const nextCoupons = data.coupons.map((c) =>
      c.date === date ? { ...c, matches: updater(c.matches) } : c
    );
    persist({ ...data, coupons: nextCoupons });
  }

  function toggleSelect(id) {
    updateMatches(selectedDate, (matches) =>
      matches.map((m) => (m.id === id ? { ...m, selected: !m.selected } : m))
    );
  }

  function removeMatch(id) {
    updateMatches(selectedDate, (matches) => matches.filter((m) => m.id !== id));
  }

  function regenerate() {
    const nextCoupons = data.coupons.map((c) =>
      c.date === selectedDate ? makeCoupon(selectedDate, false) : c
    );
    persist({ ...data, coupons: nextCoupons });
  }

  function cycleResult(couponDate, matchId) {
    const order = { Pending: "Won", Won: "Lost", Lost: "Pending" };
    const nextCoupons = data.coupons.map((c) => {
      if (c.date !== couponDate) return c;
      return {
        ...c,
        matches: c.matches.map((m) =>
          m.id === matchId ? { ...m, result: order[m.result] } : m
        ),
      };
    });
    persist({ ...data, coupons: nextCoupons });
  }

  async function copySelection() {
    if (!selectedCoupon) return;
    const selected = selectedCoupon.matches.filter((m) => m.selected);
    const text = selected
      .map((m) => `${m.time} ${m.league} — ${m.home} vs ${m.away} : ${m.prediction} (${m.confidence}%, score est. ${m.estScore})`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setToast("Sélection copiée");
      setTimeout(() => setToast(""), 1800);
    } catch (e) {
      setToast("Copie impossible sur cet appareil");
      setTimeout(() => setToast(""), 1800);
    }
  }

  async function resetAll() {
    const now = new Date();
    const fresh = {
      coupons: [
        makeCoupon(dateStr(now), false),
        makeCoupon(dateStr(addDays(now, 1)), false),
        makeCoupon(dateStr(addDays(now, 2)), false),
        ...seedHistory(),
      ],
    };
    setSelectedDate(dateStr(now));
    await persist(fresh);
  }

  const selectedCount = selectedCoupon ? selectedCoupon.matches.filter((m) => m.selected).length : 0;
  const avgConfidence = selectedCoupon && selectedCoupon.matches.length
    ? Math.round(
        selectedCoupon.matches.filter((m) => m.selected).reduce((s, m) => s + m.confidence, 0) /
          Math.max(selectedCount, 1)
      )
    : 0;
  const outOfRange = selectedCount < 20 || selectedCount > 23;

  const dateTabs = [
    { date: today, label: "Aujourd'hui" },
    { date: tomorrow, label: "Demain" },
    { date: dayPlus2, label: "J+2" },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white w-full" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div className="max-w-xl mx-auto px-4 pt-6 pb-16">
        <div className="flex items-baseline justify-between mb-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#10B981]" style={{ fontFamily: "ui-monospace, monospace" }}>
            Ultra-Combo
          </h1>
          <span className="text-xs text-zinc-400">Suivi de combinés GG</span>
        </div>
        <div className="border-b border-dashed border-[#1E293B] mb-4" />

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab("home")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
              tab === "home" ? "bg-white text-[#0B0F19] border-white font-semibold" : "bg-[#161E2E] text-zinc-300 border-[#1E293B] hover:text-white"
            }`}
          >
            Coupon du jour
          </button>
          <button
            onClick={() => setTab("history")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
              tab === "history" ? "bg-white text-[#0B0F19] border-white font-semibold" : "bg-[#161E2E] text-zinc-300 border-[#1E293B] hover:text-white"
            }`}
          >
            Historique
          </button>
        </div>

        {tab === "home" && (
          <div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {dateTabs.map((d) => {
                const active = selectedDate === d.date;
                return (
                  <button
                    key={d.date}
                    onClick={() => setSelectedDate(d.date)}
                    className={`rounded-lg py-1.5 text-center transition-colors ${
                      active
                        ? "bg-[#06B6D4] text-[#0B0F19] font-semibold"
                        : "bg-[#161E2E] border border-[#1E293B] text-zinc-300 hover:text-white"
                    }`}
                  >
                    <div className="text-sm font-semibold leading-tight">{d.label}</div>
                    <div className={`text-[10px] leading-tight ${active ? "text-[#0B0F19]/80 font-medium" : "text-zinc-400"}`}>
                      {displayDate(d.date)}
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedCoupon ? (
              <>
                <div className="bg-[#161E2E] border border-[#1E293B] rounded-xl p-3.5 mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm text-zinc-400">{displayDate(selectedDate)}</div>
                      <div className="text-lg font-semibold text-white">
                        <span className={outOfRange ? "text-rose-400 font-bold" : "text-white font-bold"}>{selectedCount}</span>
                        <span className="text-zinc-400 text-sm"> / {selectedCoupon.matches.length} matchs sélectionnés</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-zinc-400">Confiance moy.</div>
                      <div className="text-lg font-bold text-[#10B981]" style={{ fontFamily: "ui-monospace, monospace" }}>
                        {avgConfidence}%
                      </div>
                    </div>
                  </div>
                  {outOfRange && (
                    <div className="text-xs text-rose-400 font-medium mb-3">
                      La stratégie vise 20 à 23 matchs — ajuste ta sélection.
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={copySelection}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#10B981] text-[#0B0F19] rounded-lg py-2 text-sm font-bold hover:bg-emerald-400 transition-colors"
                    >
                      <Copy size={15} /> Copier la sélection
                    </button>
                    <button
                      onClick={regenerate}
                      title="Simule la génération automatique de 09h00"
                      className="px-3 rounded-lg border border-[#06B6D4]/50 text-[#06B6D4] hover:bg-[#06B6D4]/10 transition-colors flex items-center justify-center"
                    >
                      <RotateCcw size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {selectedCoupon.matches.map((m) => {
                    const tier = confidenceTier(m.confidence);
                    return (
                      <div
                        key={m.id}
                        className={`flex items-center gap-2 bg-[#161E2E] border-l-4 ${tier.border} border-t border-r border-b border-[#1E293B] rounded-lg pl-2 pr-2.5 py-1.5 ${
                          !m.selected ? "opacity-35" : ""
                        }`}
                      >
                        <button
                          onClick={() => toggleSelect(m.id)}
                          className={`shrink-0 w-5 h-5 rounded-md flex items-center justify-center border ${
                            m.selected ? "bg-[#10B981] border-[#10B981] text-[#0B0F19]" : "border-zinc-500 text-transparent"
                          }`}
                        >
                          <Check size={12} strokeWidth={3} />
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                            <span className="font-mono text-zinc-300">{m.time}</span>
                            <span className="truncate">{m.league}</span>
                          </div>
                          <div className="text-sm font-semibold truncate leading-snug text-white">
                            {m.home} <span className="text-zinc-500 font-normal">vs</span> {m.away}
                          </div>
                          <div className="text-[11px] font-medium text-[#06B6D4] truncate">{m.prediction}</div>
                        </div>

                        <div
                          className="shrink-0 text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30"
                          title="Score estimé"
                        >
                          ≈ {m.estScore}
                        </div>

                        <div className="text-right shrink-0 w-10">
                          <div className={`text-sm font-mono font-bold ${tier.text}`}>
                            {m.confidence}%
                          </div>
                        </div>

                        <button onClick={() => removeMatch(m.id)} className="shrink-0 text-zinc-500 hover:text-rose-400 p-1">
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                  {selectedCoupon.matches.length === 0 && (
                    <div className="text-center text-sm text-zinc-400 py-8 bg-[#161E2E] rounded-xl border border-[#1E293B]">
                      Plus aucun match dans cette sélection.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center text-sm text-zinc-400 py-10 bg-[#161E2E] border border-[#1E293B] rounded-xl">
                Aucun coupon pour cette date pour le moment.
              </div>
            )}

            {toast && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white text-[#0B0F19] text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                {toast}
              </div>
            )}
          </div>
        )}

        {tab === "history" && (
          <div className="space-y-2">
            {history.map((c) => {
              const status = couponStatus(c);
              const won = c.matches.filter((m) => m.result === "Won").length;
              const lost = c.matches.filter((m) => m.result === "Lost").length;
              const total = c.matches.length;
              const isOpen = openId === c.date;
              return (
                <div key={c.date} className="bg-[#161E2E] border border-[#1E293B] rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenId(isOpen ? null : c.date)}
                    className="w-full flex items-center justify-between px-4 py-3"
                  >
                    <div className="text-left">
                      <div className="text-sm font-semibold text-white">{displayDate(c.date)}</div>
                      <div className="text-xs text-zinc-400">
                        {total} matchs · {won}/{total} verts{lost ? `, ${lost} rouges` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColors[status]}`}>
                        {statusLabel[status]}
                      </span>
                      {isOpen ? <ChevronDown size={16} className="text-[#06B6D4]" /> : <ChevronRight size={16} className="text-zinc-400" />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="border-t border-dashed border-[#1E293B] px-3 py-2 space-y-1.5">
                      {c.matches.map((m) => (
                        <div key={m.id} className="flex items-center gap-2 py-1 border-b border-[#1E293B]/40 last:border-none">
                          <button
                            onClick={() => cycleResult(c.date, m.id)}
                            className={`shrink-0 w-3.5 h-3.5 rounded-full ${
                              m.result === "Won" ? "bg-emerald-400" : m.result === "Lost" ? "bg-rose-500" : "bg-zinc-500"
                            }`}
                            title="Touche pour changer le résultat"
                          />
                          <span className="text-xs text-zinc-400 font-mono w-11 shrink-0">{m.time}</span>
                          <span className="text-sm font-medium flex-1 truncate text-zinc-200">{m.home} vs {m.away}</span>
                          <span className="text-xs text-cyan-400 font-mono shrink-0">≈ {m.estScore}</span>
                          <span className="text-xs text-zinc-400 shrink-0 font-medium">{m.prediction}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <button onClick={resetAll} className="w-full text-xs text-zinc-500 hover:text-zinc-300 py-4 font-medium transition-colors">
              Réinitialiser toutes les données (démo)
            </button>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-dashed border-[#1E293B] text-xs text-zinc-400 leading-relaxed">
          Pariez de façon responsable. Un combiné de 20 à 23 sélections a une probabilité de succès très faible même
          si chaque pari pris isolément est favorable — les taux de confiance sont indicatifs, pas des garanties.
        </div>
      </div>
    </div>
  );
}
