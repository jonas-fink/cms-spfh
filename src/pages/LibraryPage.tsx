import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, Icon, SectionHeader } from '../components/shared';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatFileSize } from '../utils/format';
import type { LibraryDoc } from '../types';

type FileFilter = 'alle' | 'pdf' | 'docx';

const MAX_BYTES = 10 * 1024 * 1024;
const CONTENT_TYPES: Record<'pdf' | 'docx', string> = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

function getFileType(file: File): 'pdf' | 'docx' | null {
    const name = file.name.toLowerCase();
    if (name.endsWith('.pdf')) return 'pdf';
    if (name.endsWith('.docx')) return 'docx';
    return null;
}

function FilterTab({
    label,
    active,
    onClick,
    count,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
    count?: number;
}) {
    return (
        <button
            onClick={onClick}
            className={[
                'px-3 h-8 text-[12.5px] rounded-md border transition-colors duration-100',
                active
                    ? 'bg-accent/10 border-accent/30 text-accent font-medium'
                    : 'bg-bg border-border text-muted hover:text-text',
            ].join(' ')}
        >
            {label}
            {count !== undefined && (
                <span className="ml-1.5 tabular-nums">{count}</span>
            )}
        </button>
    );
}

export default function LibraryPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const [docs, setDocs] = useState<LibraryDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [fileFilter, setFileFilter] = useState<FileFilter>('alle');
    const [selected, setSelected] = useState<{
        category: string | null;
        subfolder: string | null;
    }>({ category: null, subfolder: null });

    const [uploadOpen, setUploadOpen] = useState(false);
    const [upCategory, setUpCategory] = useState('');
    const [upSubfolder, setUpSubfolder] = useState('');
    const [upBusy, setUpBusy] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const [preview, setPreview] = useState<LibraryDoc | null>(null);

    async function load() {
        try {
            setError(null);
            const data = await api.get<LibraryDoc[]>('/library');
            setDocs(data);
        } catch (err) {
            setError((err as Error).message ?? 'Fehler beim Laden');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void load();
    }, []);

    // Ordnerbaum aus den Daten ableiten: Kategorie → Unterordner
    const tree = useMemo(() => {
        const m = new Map<string, Set<string>>();
        for (const d of docs) {
            if (!m.has(d.category)) m.set(d.category, new Set());
            if (d.subfolder) m.get(d.category)!.add(d.subfolder);
        }
        return Array.from(m.entries())
            .sort((a, b) => a[0].localeCompare(b[0], 'de'))
            .map(([cat, subs]) => ({
                category: cat,
                subfolders: Array.from(subs).sort((a, b) =>
                    a.localeCompare(b, 'de'),
                ),
            }));
    }, [docs]);

    const categories = useMemo(() => tree.map((t) => t.category), [tree]);
    const allSubfolders = useMemo(() => {
        const s = new Set<string>();
        for (const d of docs) if (d.subfolder) s.add(d.subfolder);
        return Array.from(s).sort((a, b) => a.localeCompare(b, 'de'));
    }, [docs]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return docs.filter((d) => {
            if (selected.category && d.category !== selected.category)
                return false;
            if (selected.subfolder && d.subfolder !== selected.subfolder)
                return false;
            if (fileFilter !== 'alle' && d.fileType !== fileFilter)
                return false;
            if (q) {
                const hay = [
                    d.fileName,
                    d.description ?? '',
                    d.category,
                    d.subfolder ?? '',
                ]
                    .join(' ')
                    .toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [docs, search, fileFilter, selected]);

    // Upload-Flow: presigned URL → PUT zu S3 → confirm (wie TabDokumente)
    async function uploadOne(file: File) {
        const fileType = getFileType(file);
        if (!fileType) {
            setUpBusy(null);
            alert('Nur PDF oder DOCX erlaubt');
            return;
        }
        if (file.size > MAX_BYTES) {
            setUpBusy(null);
            alert('Datei darf maximal 10 MB groß sein');
            return;
        }
        if (!upCategory.trim()) {
            setUpBusy(null);
            alert('Bitte eine Kategorie angeben');
            return;
        }

        setUpBusy(file.name);
        try {
            const { presignedUrl, documentId } = await api.post<{
                presignedUrl: string;
                documentId: string;
            }>('/library/upload-url', {
                fileName: file.name,
                fileType,
                fileSizeBytes: file.size,
                category: upCategory.trim(),
                subfolder: upSubfolder.trim() || undefined,
            });

            const putRes = await fetch(presignedUrl, {
                method: 'PUT',
                headers: { 'Content-Type': CONTENT_TYPES[fileType] },
                body: file,
            });
            if (!putRes.ok)
                throw new Error(`S3-Upload fehlgeschlagen (${putRes.status})`);

            await api.patch(`/library/${documentId}/confirm`);
            await load();
            setUploadOpen(false);
        } catch (err) {
            alert((err as Error).message);
        } finally {
            setUpBusy(null);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Dokument wirklich löschen?')) return;
        try {
            await api.delete(`/library/${id}`);
            await load();
        } catch (err) {
            alert((err as Error).message);
        }
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-[50vh] text-[13px] text-red-600">
                {error}
            </div>
        );
    }
    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh] text-[13px] text-muted">
                Lade Wissensbasis…
            </div>
        );
    }

    const pdfCount = docs.filter((d) => d.fileType === 'pdf').length;
    const docxCount = docs.filter((d) => d.fileType === 'docx').length;

    return (
        <div>
            <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-[24px] font-semibold text-text tracking-[-0.02em]">
                        Wissensbasis
                    </h1>
                    <p className="text-[13px] text-muted mt-0.5">
                        Gemeinsame Vorlagen, Protokolle &amp; Richtlinien ·{' '}
                        {docs.length} Dokumente
                    </p>
                </div>
                <button
                    onClick={() => setUploadOpen((o) => !o)}
                    className="h-9 px-3.5 rounded-md bg-accent text-white text-[13px] font-medium flex items-center gap-2 shrink-0"
                >
                    <Icon name="upload" size={15} stroke={2} color="#fff" />
                    Hochladen
                </button>
            </div>

            {uploadOpen && (
                <Card className="mb-4">
                    <div className="p-4 flex flex-wrap items-end gap-3">
                        <label className="flex flex-col gap-1 min-w-44 md:max-w-max w-full">
                            <span className="text-[11.5px] font-medium text-muted">
                                Kategorie
                            </span>
                            <input
                                list="lib-categories"
                                value={upCategory}
                                onChange={(e) => setUpCategory(e.target.value)}
                                placeholder="z. B. Vorlagen"
                                className="h-8 px-2.5 rounded-md bg-bg border border-border text-[12.5px] text-text outline-none focus:border-accent"
                            />
                            <datalist id="lib-categories">
                                {categories.map((c) => (
                                    <option key={c} value={c} />
                                ))}
                            </datalist>
                        </label>
                        <label className="flex flex-col gap-1 min-w-44 md:max-w-max w-full">
                            <span className="text-[11.5px] font-medium text-muted">
                                Unterordner (optional)
                            </span>
                            <input
                                list="lib-subfolders"
                                value={upSubfolder}
                                onChange={(e) => setUpSubfolder(e.target.value)}
                                placeholder="z. B. Jugendamt"
                                className="h-8 px-2.5 rounded-md bg-bg border border-border text-[12.5px] text-text outline-none focus:border-accent"
                            />
                            <datalist id="lib-subfolders">
                                {allSubfolders.map((s) => (
                                    <option key={s} value={s} />
                                ))}
                            </datalist>
                        </label>
                        <input
                            ref={fileRef}
                            type="file"
                            accept=".pdf,.docx"
                            className="hidden"
                            onChange={(e) => {
                                const f = e.target.files?.[0];
                                e.target.value = '';
                                if (f) void uploadOne(f);
                            }}
                        />
                        <button
                            disabled={!!upBusy}
                            onClick={() => fileRef.current?.click()}
                            className="h-8 px-3.5 rounded-md border border-border bg-bg text-[12.5px] text-text hover:border-accent disabled:opacity-50 md:max-w-max w-full"
                        >
                            {upBusy
                                ? `Lädt hoch… (${upBusy})`
                                : 'Datei wählen (PDF/DOCX · max. 10 MB)'}
                        </button>
                    </div>
                </Card>
            )}

            <div className="flex md:flex-row flex-col gap-4">
                {/* Ordnerbaum */}
                <div className="md:w-56 w-full shrink-0">
                    <Card>
                        <div className="px-4 py-3 border-b border-border">
                            <SectionHeader title="Ordner" />
                        </div>
                        <button
                            onClick={() =>
                                setSelected({ category: null, subfolder: null })
                            }
                            className={[
                                'w-full text-left px-4 py-2 text-[13px] flex items-center gap-2',
                                !selected.category
                                    ? 'text-accent font-medium bg-accent/5'
                                    : 'text-text hover:bg-surface-hover',
                            ].join(' ')}
                        >
                            <Icon name="file" size={14} />
                            Alle ({docs.length})
                        </button>
                        {tree.map((t) => {
                            const catActive =
                                selected.category === t.category &&
                                !selected.subfolder;
                            const count = docs.filter(
                                (d) => d.category === t.category,
                            ).length;
                            return (
                                <div key={t.category}>
                                    <button
                                        onClick={() =>
                                            setSelected({
                                                category: t.category,
                                                subfolder: null,
                                            })
                                        }
                                        className={[
                                            'w-full text-left px-4 py-2 text-[13px] flex items-center gap-2 border-t border-border',
                                            catActive
                                                ? 'text-accent font-medium bg-accent/5'
                                                : 'text-text hover:bg-surface-hover',
                                        ].join(' ')}
                                    >
                                        <Icon name="file" size={14} />
                                        <span className="flex-1 truncate">
                                            {t.category}
                                        </span>
                                        <span className="text-[11px] text-muted tabular-nums">
                                            {count}
                                        </span>
                                    </button>
                                    {t.subfolders.map((sub) => (
                                        <button
                                            key={sub}
                                            onClick={() =>
                                                setSelected({
                                                    category: t.category,
                                                    subfolder: sub,
                                                })
                                            }
                                            className={[
                                                'w-full text-left pl-10 pr-4 py-1.5 text-[12.5px] flex items-center gap-2',
                                                selected.category ===
                                                    t.category &&
                                                selected.subfolder === sub
                                                    ? 'text-accent font-medium bg-accent/5'
                                                    : 'text-muted hover:bg-surface-hover hover:text-text',
                                            ].join(' ')}
                                        >
                                            <Icon name="file" size={12} />
                                            <span className="truncate">
                                                {sub}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            );
                        })}
                    </Card>
                </div>

                {/* Dokumentenliste */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                        <FilterTab
                            label="Alle"
                            active={fileFilter === 'alle'}
                            onClick={() => setFileFilter('alle')}
                            count={docs.length}
                        />
                        <FilterTab
                            label="PDF"
                            active={fileFilter === 'pdf'}
                            onClick={() => setFileFilter('pdf')}
                            count={pdfCount}
                        />
                        <FilterTab
                            label="DOCX"
                            active={fileFilter === 'docx'}
                            onClick={() => setFileFilter('docx')}
                            count={docxCount}
                        />
                        <div className="flex-1 min-w-40" />
                        <input
                            type="search"
                            placeholder="Datei, Beschreibung suchen…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-8 px-3 rounded-md bg-bg border border-border text-[12.5px] text-text outline-none focus:border-accent md:w-70 w-full"
                        />
                    </div>

                    <Card>
                        <div className="px-4 py-3 border-b border-border">
                            <SectionHeader
                                title={
                                    selected.subfolder ??
                                    selected.category ??
                                    'Alle Dokumente'
                                }
                                sub={`${filtered.length} angezeigt`}
                            />
                        </div>

                        {filtered.length === 0 ? (
                            <div className="px-4 py-10 text-center text-[13px] text-muted">
                                Keine Dokumente gefunden.
                            </div>
                        ) : (
                            filtered.map((d, i) => {
                                const canDelete =
                                    isAdmin || d.uploadedBy?._id === user?.id;
                                return (
                                    <div
                                        key={d.id}
                                        className={`px-4 py-3 flex items-center gap-3.5 ${i > 0 ? 'border-t border-border' : ''}`}
                                    >
                                        <div
                                            className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                                            style={{
                                                background:
                                                    d.fileType === 'pdf'
                                                        ? 'rgba(220,38,38,0.08)'
                                                        : 'rgba(37,99,235,0.08)',
                                                color:
                                                    d.fileType === 'pdf'
                                                        ? '#dc2626'
                                                        : '#2563eb',
                                            }}
                                        >
                                            <Icon
                                                name={
                                                    d.fileType === 'pdf'
                                                        ? 'pdf'
                                                        : 'file'
                                                }
                                                size={16}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[13px] font-medium text-text truncate">
                                                {d.fileName}
                                            </div>
                                            <div className="text-[11.5px] text-muted truncate">
                                                {d.category}
                                                {d.subfolder
                                                    ? ` / ${d.subfolder}`
                                                    : ''}{' '}
                                                ·{' '}
                                                {formatFileSize(
                                                    d.fileSizeBytes,
                                                )}{' '}
                                                ·{' '}
                                                {formatDate(d.createdAt, {
                                                    dateOnly: true,
                                                })}
                                                {d.description
                                                    ? ` · ${d.description}`
                                                    : ''}
                                            </div>
                                        </div>
                                        <div className="flex gap-0.5 shrink-0">
                                            {d.fileType === 'pdf' && (
                                                <button
                                                    onClick={() =>
                                                        setPreview(d)
                                                    }
                                                    title="Vorschau"
                                                    className="text-muted p-1.5 rounded-md hover:bg-surface-hover transition-colors"
                                                >
                                                    <Icon
                                                        name="search"
                                                        size={15}
                                                        stroke={1.75}
                                                    />
                                                </button>
                                            )}
                                            <a
                                                href={d.downloadUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-muted p-1.5 rounded-md hover:bg-surface-hover transition-colors"
                                            >
                                                <Icon
                                                    name="download"
                                                    size={15}
                                                    stroke={1.75}
                                                />
                                            </a>
                                            {canDelete && (
                                                <button
                                                    onClick={() =>
                                                        handleDelete(d.id)
                                                    }
                                                    className="text-muted p-1.5 rounded-md hover:bg-surface-hover transition-colors"
                                                >
                                                    <Icon
                                                        name="trash"
                                                        size={15}
                                                        stroke={1.75}
                                                    />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </Card>
                </div>
            </div>

            {/* PDF-Vorschau: inline via presigned URL, kein Download nötig */}
            {preview && (
                <div
                    onClick={() => setPreview(null)}
                    className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-surface rounded-lg overflow-hidden w-full max-w-4xl h-[85vh] flex flex-col"
                    >
                        <div className="px-4 py-2.5 border-b border-border flex items-center gap-3 shrink-0">
                            <Icon name="pdf" size={16} color="#dc2626" />
                            <span className="flex-1 text-[13px] font-medium text-text truncate">
                                {preview.fileName}
                            </span>
                            <a
                                href={preview.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Herunterladen"
                                className="text-muted p-1.5 rounded-md hover:bg-surface-hover transition-colors"
                            >
                                <Icon name="download" size={15} stroke={1.75} />
                            </a>
                            <button
                                onClick={() => setPreview(null)}
                                title="Schließen"
                                className="text-muted p-1.5 rounded-md hover:bg-surface-hover transition-colors"
                            >
                                <Icon name="x" size={16} stroke={1.75} />
                            </button>
                        </div>
                        <iframe
                            src={preview.downloadUrl}
                            title={preview.fileName}
                            className="flex-1 w-full border-0"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
