import { useState } from 'react';
import { Icon, Card, SectionHeader } from '../shared';
import { formatDate } from '../../utils/format';
import type { ClientDoc } from '../../types';

interface TabDokumenteProps {
    documents: ClientDoc[];
}

export function TabDokumente({ documents }: TabDokumenteProps) {
    const [isDragging, setIsDragging] = useState(false);

    return (
        <div className="flex flex-col gap-4">
            {/* Upload-Zone */}
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                }}
                onClick={() => document.getElementById('file-input')?.click()}
                className={`border-2 border-dashed rounded-[10px] p-7 text-center cursor-pointer transition-all duration-150 ${
                    isDragging
                        ? 'border-accent bg-accent/[0.04]'
                        : 'border-border-strong bg-surface'
                }`}
            >
                <input
                    id="file-input"
                    type="file"
                    accept=".pdf,.docx"
                    multiple
                    className="hidden"
                />
                <div className="w-10 h-10 rounded-[10px] bg-accent/8 flex items-center justify-center mx-auto mb-3">
                    <Icon
                        name="upload"
                        size={18}
                        stroke={1.75}
                        color="var(--accent)"
                    />
                </div>
                <p className="text-[13.5px] font-medium text-text mb-1">
                    {isDragging
                        ? 'Loslassen zum Hochladen'
                        : 'Datei hierher ziehen oder klicken'}
                </p>
                <p className="text-xs text-muted">PDF oder DOCX · max. 10 MB</p>
            </div>

            {/* Datei-Liste */}
            <Card>
                <div className="px-5 py-3 border-b border-border">
                    <SectionHeader title={`Dokumente (${documents.length})`} />
                </div>
                {documents.length === 0 ? (
                    <p className="px-5 py-8 text-center text-[13px] text-muted m-0">
                        Noch keine Dokumente hochgeladen.
                    </p>
                ) : (
                    documents.map((doc, i) => (
                        <div
                            key={doc.id}
                            className={`px-5 py-3 flex items-center gap-3.5 ${i > 0 ? 'border-t border-border' : ''}`}
                        >
                            <div
                                className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                                    doc.fileType === 'pdf'
                                        ? 'bg-red-500/8'
                                        : 'bg-accent/8'
                                }`}
                            >
                                <Icon
                                    name={
                                        doc.fileType === 'pdf' ? 'pdf' : 'file'
                                    }
                                    size={16}
                                    stroke={1.75}
                                    color={
                                        doc.fileType === 'pdf'
                                            ? '#dc2626'
                                            : '#6366f1'
                                    }
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[13px] font-medium text-text mb-0.5">
                                    {doc.fileName}
                                </div>
                                <div className="text-[11.5px] text-muted">
                                    {doc.size} ·{' '}
                                    {formatDate(doc.uploadedAt, {
                                        dateOnly: true,
                                    })}
                                    {doc.description
                                        ? ` · ${doc.description}`
                                        : ''}
                                </div>
                            </div>
                            <div className="flex gap-0.5 shrink-0">
                                <button className="bg-transparent border-none cursor-pointer text-muted p-1.5 rounded-md hover:bg-surface-hover transition-colors duration-100">
                                    <Icon
                                        name="download"
                                        size={15}
                                        stroke={1.75}
                                    />
                                </button>
                                <button className="bg-transparent border-none cursor-pointer text-muted p-1.5 rounded-md hover:bg-surface-hover transition-colors duration-100">
                                    <Icon
                                        name="trash"
                                        size={15}
                                        stroke={1.75}
                                    />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </Card>
        </div>
    );
}
