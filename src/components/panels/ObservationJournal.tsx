'use client';

/**
 * ObservationJournal.tsx
 * Diario de observaciones astronómicas con persistencia en localStorage.
 * - Pre-rellena con el objeto seleccionado en la app
 * - Exportable como CSV o texto plano
 * - Compatible con night mode
 * - Sin dependencias externas
 */

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';

interface ObsEntry {
    id: string;
    objectName: string;
    objectType: 'star' | 'planet' | 'dso' | 'other';
    date: string;        // ISO string
    lat: number;
    lon: number;
    seeing: number;      // 1–5 (5=excelente)
    darkness: number;    // 1–5 (5=cielo más oscuro)
    equipment: string;
    notes: string;
}

const STORAGE_KEY = 'cosmos-atlas-journal-v1';

function loadEntries(): ObsEntry[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function saveEntries(entries: ObsEntry[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {}
}

function newId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

const SEEING_LABELS = ['', 'Turbulento', 'Inestable', 'Regular', 'Bueno', 'Excelente'];
const DARK_LABELS   = ['', 'Ciudad', 'Suburbio', 'Rural', 'Bueno', 'Pristino'];
const TYPE_ICONS: Record<ObsEntry['objectType'], string> = {
    star: '⭐', planet: '🪐', dso: '🌌', other: '🔭',
};

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-ES', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function exportCSV(entries: ObsEntry[]) {
    const header = 'id,objeto,tipo,fecha,lat,lon,seeing,oscuridad,equipo,notas';
    const rows = entries.map(e =>
        [e.id, `"${e.objectName}"`, e.objectType, e.date, e.lat, e.lon,
         e.seeing, e.darkness, `"${e.equipment}"`, `"${e.notes.replace(/"/g, '""')}"`
        ].join(',')
    );
    const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `cosmos-atlas-diario-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
}

export default function ObservationJournal() {
    const selectedObject = useAppStore((s) => s.selectedObject);
    const observer       = useAppStore((s) => s.observer);
    const nightMode      = useAppStore((s) => s.settings.nightMode);

    const [entries, setEntries] = useState<ObsEntry[]>(() => loadEntries());
    const [view, setView]       = useState<'list' | 'add'>('list');
    const [expanded, setExpanded] = useState<string | null>(null);

    // Formulario de nueva entrada
    const [form, setForm] = useState<Omit<ObsEntry, 'id'>>({
        objectName: '',
        objectType: 'star',
        date: new Date().toISOString().slice(0, 16),
        lat: observer.lat,
        lon: observer.lon,
        seeing: 3,
        darkness: 3,
        equipment: '',
        notes: '',
    });


    // Pre-rellenar cuando cambia el objeto seleccionado
    useEffect(() => {
        if (!selectedObject) return;
        const type: ObsEntry['objectType'] =
            'kind' in selectedObject && selectedObject.kind === 'planet' ? 'planet'
            : 'type' in selectedObject ? 'dso'
            : 'star';
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm(f => ({
            ...f,
            objectName: selectedObject.name,
            objectType: type,
            date: new Date().toISOString().slice(0, 16),
            lat: observer.lat,
            lon: observer.lon,
        }));
    }, [selectedObject, observer]);

    const handleAdd = useCallback(() => {
        const entry: ObsEntry = { ...form, id: newId() };
        const updated = [entry, ...entries];
        setEntries(updated);
        saveEntries(updated);
        setView('list');
        setForm(f => ({ ...f, notes: '', date: new Date().toISOString().slice(0,16) }));
    }, [form, entries]);

    const handleDelete = useCallback((id: string) => {
        const updated = entries.filter(e => e.id !== id);
        setEntries(updated);
        saveEntries(updated);
    }, [entries]);

    const accent = nightMode ? '#ff4444' : '#60a5fa';
    const dim    = nightMode ? 'rgba(255,100,100,0.4)' : 'rgba(148,163,184,0.5)';
    const cardBg = nightMode ? 'rgba(50,0,0,0.35)' : 'rgba(255,255,255,0.04)';
    const cardBorder = nightMode ? 'rgba(255,68,68,0.15)' : 'rgba(255,255,255,0.07)';

    // ── Formulario de nueva observación ───────────────────────────────────────
    if (view === 'add') {
        return (
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: accent }}>
                        Nueva observación
                    </span>
                    <button onClick={() => setView('list')} className="text-[9px]" style={{ color: dim }}>
                        ← Volver
                    </button>
                </div>

                {/* Objeto */}
                <div className="flex gap-1.5">
                    <input
                        value={form.objectName}
                        onChange={e => setForm(f => ({ ...f, objectName: e.target.value }))}
                        placeholder="Nombre del objeto"
                        className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-[10px] text-white/80 font-mono outline-none focus:border-blue-400/40"
                        style={{ borderColor: cardBorder }}
                    />
                    <select
                        value={form.objectType}
                        onChange={e => setForm(f => ({ ...f, objectType: e.target.value as ObsEntry['objectType'] }))}
                        className="bg-white/5 border rounded px-1.5 py-1 text-[10px] text-white/60 font-mono outline-none"
                        style={{ borderColor: cardBorder }}
                    >
                        <option value="star">⭐ Estrella</option>
                        <option value="planet">🪐 Planeta</option>
                        <option value="dso">🌌 DSO</option>
                        <option value="other">🔭 Otro</option>
                    </select>
                </div>

                {/* Fecha */}
                <input
                    type="datetime-local"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="bg-white/5 border rounded px-2 py-1 text-[10px] text-white/60 font-mono outline-none"
                    style={{ borderColor: cardBorder }}
                />

                {/* Seeing / Oscuridad */}
                <div className="flex gap-3">
                    <div className="flex-1">
                        <div className="text-[9px] mb-1" style={{ color: dim }}>Seeing {seeing_icon(form.seeing)}</div>
                        <div className="flex gap-1">
                            {[1,2,3,4,5].map(v => (
                                <button key={v} onClick={() => setForm(f => ({ ...f, seeing: v }))}
                                    className="flex-1 h-5 rounded text-[8px] font-mono transition-colors"
                                    style={{
                                        background: form.seeing >= v ? accent : cardBg,
                                        color: form.seeing >= v ? '#000' : dim,
                                        border: `1px solid ${cardBorder}`,
                                    }}>
                                    {v}
                                </button>
                            ))}
                        </div>
                        <div className="text-[8px] mt-0.5 text-center" style={{ color: dim }}>
                            {SEEING_LABELS[form.seeing]}
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="text-[9px] mb-1" style={{ color: dim }}>Oscuridad {dark_icon(form.darkness)}</div>
                        <div className="flex gap-1">
                            {[1,2,3,4,5].map(v => (
                                <button key={v} onClick={() => setForm(f => ({ ...f, darkness: v }))}
                                    className="flex-1 h-5 rounded text-[8px] font-mono transition-colors"
                                    style={{
                                        background: form.darkness >= v ? '#8855ff' : cardBg,
                                        color: form.darkness >= v ? '#fff' : dim,
                                        border: `1px solid ${cardBorder}`,
                                    }}>
                                    {v}
                                </button>
                            ))}
                        </div>
                        <div className="text-[8px] mt-0.5 text-center" style={{ color: dim }}>
                            {DARK_LABELS[form.darkness]}
                        </div>
                    </div>
                </div>

                {/* Equipo */}
                <input
                    value={form.equipment}
                    onChange={e => setForm(f => ({ ...f, equipment: e.target.value }))}
                    placeholder="Equipo (ej: 10x50 binoculares)"
                    className="bg-white/5 border rounded px-2 py-1 text-[10px] text-white/60 font-mono outline-none"
                    style={{ borderColor: cardBorder }}
                />

                {/* Notas */}
                <textarea
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Notas de la observación…"
                    rows={3}
                    className="bg-white/5 border rounded px-2 py-1 text-[10px] text-white/70 font-mono outline-none resize-none"
                    style={{ borderColor: cardBorder }}
                />

                <button
                    onClick={handleAdd}
                    disabled={!form.objectName.trim()}
                    className="w-full py-2 rounded font-mono font-bold text-[10px] tracking-widest uppercase transition-all disabled:opacity-30"
                    style={{ background: accent, color: '#000' }}
                >
                    Guardar observación
                </button>
            </div>
        );
    }

    // ── Lista de observaciones ─────────────────────────────────────────────────
    return (
        <div className="flex flex-col gap-2">
            {/* Cabecera con botones */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setView('add')}
                    className="flex-1 py-1.5 rounded font-mono font-bold text-[9px] tracking-widest uppercase border transition-all"
                    style={{ borderColor: accent, color: accent }}
                >
                    + Nueva observación
                </button>
                {entries.length > 0 && (
                    <button
                        onClick={() => exportCSV(entries)}
                        className="px-2.5 py-1.5 rounded font-mono text-[9px] border transition-all"
                        style={{ borderColor: cardBorder, color: dim }}
                        title="Exportar como CSV"
                    >
                        ↓ CSV
                    </button>
                )}
            </div>

            {/* Entradas */}
            {entries.length === 0 ? (
                <div className="text-center py-4 text-[10px]" style={{ color: dim }}>
                    Sin observaciones aún.<br />
                    <span className="opacity-60">{'Selecciona un objeto y pulsa "+ Nueva observación"'}</span>
                </div>
            ) : (
                entries.map(e => (
                    <div
                        key={e.id}
                        className="rounded-lg border overflow-hidden"
                        style={{ background: cardBg, borderColor: cardBorder }}
                    >
                        <button
                            className="w-full flex items-center gap-2.5 px-2.5 py-2 text-left"
                            onClick={() => setExpanded(prev => prev === e.id ? null : e.id)}
                        >
                            <span className="text-[14px] leading-none shrink-0">{TYPE_ICONS[e.objectType]}</span>
                            <div className="flex-1 min-w-0">
                                <div className="text-[10px] font-bold font-mono truncate" style={{ color: accent }}>
                                    {e.objectName}
                                </div>
                                <div className="text-[8px] font-mono" style={{ color: dim }}>
                                    {formatDate(e.date)}
                                </div>
                            </div>
                            <div className="flex gap-1 shrink-0 text-[8px]" style={{ color: dim }}>
                                <span title="Seeing">👁{e.seeing}</span>
                                <span title="Oscuridad">🌑{e.darkness}</span>
                            </div>
                        </button>

                        {expanded === e.id && (
                            <div className="px-2.5 pb-2.5 pt-0 border-t text-[9px] font-mono" style={{ borderColor: cardBorder }}>
                                {e.equipment && (
                                    <div className="mt-1.5" style={{ color: dim }}>
                                        🔭 {e.equipment}
                                    </div>
                                )}
                                {e.notes && (
                                    <div className="mt-1.5 text-white/55 leading-relaxed whitespace-pre-wrap">
                                        {e.notes}
                                    </div>
                                )}
                                <div className="mt-2 flex justify-between items-center">
                                    <span style={{ color: dim }}>{e.lat.toFixed(2)}°, {e.lon.toFixed(2)}°</span>
                                    <button
                                        onClick={() => handleDelete(e.id)}
                                        className="text-red-400/50 hover:text-red-400/80 transition-colors text-[8px]"
                                    >
                                        🗑 borrar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
}

function seeing_icon(v: number) { return ['','⚡','〰️','〰️','✦','✦✦'][v] ?? ''; }
function dark_icon(v: number)   { return ['','🌆','🌇','🌃','🌌','🌠'][v] ?? ''; }