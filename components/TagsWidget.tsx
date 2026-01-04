import React from 'react';
import { Tag } from 'lucide-react';

interface TagsWidgetProps {
    onTagClick: (tag: string) => void;
    activeTags: string[];
    availableTags: string[];
}

export const TagsWidget: React.FC<TagsWidgetProps> = ({ onTagClick, activeTags, availableTags }) => {
    
    if (!availableTags || availableTags.length === 0) {
        return (
            <div className="bg-[var(--bg-panel)] rounded-xl shadow-lg border border-[var(--border-main)] p-5 mb-6">
                <h3 className="font-black text-[var(--text-main)] mb-4 flex items-center gap-2 uppercase tracking-wide text-sm">
                    <Tag className="text-[var(--color-tertiary)]" size={18} />
                    Címkék
                </h3>
                <p className="text-xs text-[var(--text-muted)] italic">Címkék betöltése...</p>
            </div>
        );
    }

    return (
        <div className="bg-[var(--bg-panel)] rounded-xl shadow-lg border border-[var(--border-main)] p-5 mb-6 hover:border-[var(--color-primary)] transition-colors">
             <h3 className="font-black text-[var(--text-main)] mb-4 flex items-center gap-2 uppercase tracking-wide text-sm">
                <Tag className="text-[var(--color-tertiary)]" size={18} />
                Címkék
            </h3>
            <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => {
                    const isActive = activeTags.includes(tag);
                    return (
                        <button
                            key={tag}
                            onClick={() => onTagClick(tag)}
                            className={`text-[13px] px-3 py-1.5 rounded-full border transition-all duration-200 font-bold uppercase tracking-wider ${
                                isActive
                                ? 'bg-[var(--color-tertiary)] text-[var(--tag-text)] border-[var(--color-tertiary)]'
                                : 'bg-[var(--bg-page)] text-[var(--text-muted)] border-[var(--border-main)] hover:border-[var(--color-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-panel)]'
                            }`}
                        >
                            {tag}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};