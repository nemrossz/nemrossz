import React, { useRef, useState, useEffect } from 'react';
import { NewsItem } from '../types';
import { ExternalLink, Calendar, Facebook, Instagram, Image as ImageIcon } from 'lucide-react';

interface NewsCardProps {
  item: NewsItem;
  layout?: 'compact' | 'standard' | 'hero' | 'text-hero';
  onTagClick: (tag: string) => void;
  alignment?: 'left' | 'right' | 'center';
}

const SAFE_CHAR_LIMIT = 3000;

const getFallbackImage = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    }
    return `https://picsum.photos/seed/${Math.abs(hash)}/800/600`;
};

export const NewsCard: React.FC<NewsCardProps> = ({ item, layout = 'standard', onTagClick, alignment = 'left' }) => {
  const [maxHeightStyle, setMaxHeightStyle] = useState<string>('80vh');
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState(item.image);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      setImgSrc(item.image);
      setIsImageLoaded(false);
  }, [item.image]);

  const handleImageError = () => {
      const fallback = getFallbackImage(item.title);
      if (imgSrc !== fallback) {
          setImgSrc(fallback);
      }
  };

  const firstSentence = item.content.split(/[.!?]/)[0] + '.';
  const contentLength = item.content.length;
  const isContentTooLong = contentLength > SAFE_CHAR_LIMIT;
  
  const displayContent = isContentTooLong 
    ? item.content.substring(0, SAFE_CHAR_LIMIT) + "..." 
    : item.content;

  const isPriority = layout === 'text-hero' || layout === 'hero';

  const handleMouseEnter = () => {
      if (cardRef.current) {
          const rect = cardRef.current.getBoundingClientRect();
          const safeTopOffset = 120;
          const availableHeight = rect.bottom - safeTopOffset;
          const finalHeight = Math.max(250, availableHeight);
          const maxWindowHeight = window.innerHeight - 140; 
          setMaxHeightStyle(`${Math.min(finalHeight, maxWindowHeight)}px`);
      }
  };

  const handleShare = (platform: 'facebook' | 'instagram', e: React.MouseEvent) => {
      e.stopPropagation();
      const url = encodeURIComponent(item.sourceLink);
      if (platform === 'facebook') {
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
      } else if (platform === 'instagram') {
          navigator.clipboard.writeText(item.sourceLink);
          alert('Link másolva a vágólapra! (Instagramon illeszd be sztoriba vagy üzenetbe)');
      }
  };

  // --- Layout: Text Hero ---
  if (layout === 'text-hero') {
    return (
        <div className="w-full bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-xl p-6 flex flex-col md:flex-row gap-6 hover:border-[var(--color-secondary)] transition-colors z-0 group shadow-lg">
             <div className="w-full md:w-1/5 flex flex-col gap-3 flex-shrink-0">
                <div className="w-full rounded-lg overflow-hidden border border-[var(--border-main)] relative bg-[var(--bg-page)] aspect-square flex items-center justify-center">
                    {!isImageLoaded && <ImageIcon className="text-zinc-700 animate-pulse absolute" size={24} />}
                    <img 
                        src={imgSrc} 
                        alt={item.title} 
                        loading="eager" 
                        fetchPriority="high"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        onLoad={() => setIsImageLoaded(true)}
                        onError={handleImageError}
                        className={`w-full h-full object-cover block grayscale-[20%] group-hover:grayscale-0 transition-all duration-500 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    />
                </div>
                <a href={item.sourceLink} target="_blank" rel="noreferrer" className="text-sm font-bold text-[var(--text-muted)] hover:text-white transition-colors flex items-center justify-center gap-1 py-2 bg-[var(--bg-page)] rounded border border-[var(--border-main)] hover:border-[var(--color-primary)]">
                    FORRÁS <ExternalLink size={14} />
                </a>
             </div>
             <div className="w-full md:w-4/5 flex flex-col">
                 <div className="flex items-center gap-3 mb-3">
                     <span className="text-[var(--text-muted)] text-base font-bold uppercase tracking-widest flex items-center gap-1">
                        <Calendar size={16} />
                        {new Date(item.date).toLocaleDateString()}
                     </span>
                 </div>
                 <h2 className="text-[34px] font-black text-[var(--text-main)] mb-4 leading-none tracking-tight group-hover:text-[var(--color-secondary)] transition-colors">{item.title}</h2>
                 <div className="text-[var(--text-main)] text-lg leading-relaxed whitespace-pre-line mb-2">{item.content}</div>
                 <div className="flex flex-wrap gap-2 mt-4">
                    {item.tags.map(tag => (
                        <button key={tag} onClick={(e) => { e.stopPropagation(); onTagClick(tag); }} className="text-[11px] font-bold uppercase text-[var(--tag-text)] bg-[var(--color-tertiary)] hover:bg-opacity-80 px-3 py-1.5 rounded transition-colors">
                            {tag}
                        </button>
                    ))}
                </div>
             </div>
        </div>
    );
  }

  // --- POPOVER SETUP ---
  const isLongText = displayContent.length > 300;
  let popoverSizeClass = "w-full"; 
  let popoverPosClass = "left-0 transform translate-y-4 group-hover:translate-y-0";

  if (alignment === 'right') {
     popoverPosClass = "right-0 left-auto origin-top-right transform translate-y-4 group-hover:translate-y-0";
  } else if (alignment === 'center') {
     popoverPosClass = "left-1/2 -translate-x-1/2 origin-top transform translate-y-4 group-hover:translate-y-0";
  }

  if (layout === 'compact' && isLongText) {
      popoverSizeClass = "w-[250%] max-w-[90vw]"; 
  } else if (layout === 'standard' && isLongText) {
      popoverSizeClass = "w-[125%] max-w-[90vw]";
      if (alignment === 'left') popoverPosClass += " -ml-[12.5%]"; 
      else if (alignment === 'right') popoverPosClass += " -mr-[12.5%]";
  }

  // Use inline style for gradient to handle opacity with CSS variables easily if needed, but classes work fine with rgb fallback
  const gradientClass = layout === 'standard'
    ? "bg-gradient-to-b from-[var(--bg-panel)] via-[var(--bg-panel)]/50 to-transparent"
    : "bg-gradient-to-t from-[var(--bg-panel)] via-[var(--bg-panel)]/50 to-transparent";

  return (
    <div 
        ref={cardRef}
        onMouseEnter={handleMouseEnter}
        className={`relative group w-full h-full hover:z-[80] transition-all duration-300`}
    >
      <div className="absolute inset-0 rounded-xl overflow-hidden bg-[var(--bg-panel)] border border-[var(--border-main)] group-hover:border-[var(--color-primary)] group-hover:shadow-[0_0_20px_rgba(0,0,0,0.3)] transition-all duration-300 z-10">
          <div className="absolute inset-0 z-0 bg-[var(--bg-page)] flex items-center justify-center">
             {!isImageLoaded && <ImageIcon className="text-zinc-800 animate-pulse" size={48} />}
             <img 
                src={imgSrc} 
                alt={item.title}
                loading={isPriority ? "eager" : "lazy"}
                fetchPriority={isPriority ? "high" : "auto"}
                decoding="async"
                referrerPolicy="no-referrer"
                onLoad={() => setIsImageLoaded(true)}
                onError={handleImageError}
                className={`w-full h-full object-cover transition-all duration-700 ease-in-out group-hover:scale-105 grayscale-[20%] group-hover:grayscale-0 absolute inset-0 ${
                    isImageLoaded ? 'opacity-60 group-hover:opacity-100' : 'opacity-0' 
                }`}
             />
             <div className={`absolute inset-0 ${gradientClass}`}></div>
             <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-panel)] via-transparent to-transparent opacity-90"></div>
          </div>

          {layout === 'standard' ? (
              <div className="relative z-10 h-full p-6 flex flex-col justify-between">
                  <div>
                       <h3 className="text-[22px] font-black leading-tight mb-3 text-[var(--text-main)] drop-shadow-lg group-hover:text-[var(--color-secondary)] transition-colors">{item.title}</h3>
                       <p className="text-[var(--text-main)] text-lg font-medium leading-relaxed line-clamp-3">{item.content}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-4">
                     <div className="flex flex-wrap gap-1">
                        {item.tags.map(tag => (
                            <button key={tag} onClick={(e) => { e.stopPropagation(); onTagClick(tag); }} className="bg-[var(--color-tertiary)] hover:bg-opacity-80 text-[var(--tag-text)] text-[11px] font-bold px-3 py-1 rounded uppercase tracking-wider transition-colors">
                                {tag}
                            </button>
                        ))}
                    </div>
                     <div className="flex items-center text-sm font-bold text-[var(--text-muted)] bg-[var(--bg-page)] px-2 py-1 rounded border border-[var(--border-main)]">
                         <Calendar size={14} className="mr-1" />
                         {new Date(item.date).toLocaleDateString()}
                    </div>
                  </div>
              </div>
          ) : (
              <div className="absolute bottom-0 left-0 w-full p-5 z-10 text-[var(--text-main)] flex flex-col items-start bg-gradient-to-t from-[var(--bg-panel)] via-[var(--bg-panel)]/80 to-transparent pt-12">
                 <div className="flex flex-wrap items-center gap-2 mb-2">
                     <div className="flex flex-wrap gap-1">
                        {item.tags.map(tag => (
                            <button key={tag} onClick={(e) => { e.stopPropagation(); onTagClick(tag); }} className="bg-[var(--color-tertiary)] hover:bg-opacity-80 text-[var(--tag-text)] text-[11px] font-bold px-2 py-1 rounded uppercase tracking-wider transition-colors">
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
                <h3 className="text-[18px] font-black leading-tight mb-2 text-[var(--text-main)] shadow-black drop-shadow-md group-hover:text-[var(--color-secondary)] transition-colors">{item.title}</h3>
                 <p className="text-[var(--text-main)] text-base line-clamp-2 mb-1 opacity-90 font-medium leading-relaxed max-w-prose">{firstSentence}</p>
              </div>
          )}
      </div>

      {/* POPOVER */}
      <div 
        className={`absolute bottom-4 ${popoverPosClass} ${popoverSizeClass} opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out z-[100] pointer-events-none group-hover:pointer-events-auto px-4`}
        style={{ 
            maxHeight: maxHeightStyle,
            bottom: '1rem' 
        }}
      >
            <div className="bg-[var(--bg-panel)] p-6 rounded-xl text-[var(--text-main)] border border-[var(--color-primary)] shadow-2xl shadow-black h-full overflow-y-auto custom-scrollbar flex flex-col">
                <p className="text-lg leading-relaxed font-medium mb-4 text-[var(--text-main)] whitespace-pre-line flex-grow">
                    {displayContent}
                </p>
                <div className="flex justify-between items-center border-t border-[var(--border-main)] pt-3 flex-shrink-0 mt-auto">
                    <span className="text-sm text-[var(--text-muted)] font-bold uppercase">{new Date(item.date).toLocaleDateString()}</span>
                    
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 pr-3 border-r border-[var(--border-main)]">
                             <button onClick={(e) => handleShare('facebook', e)} className="text-[var(--color-primary)] hover:text-[var(--color-tertiary)] transition-colors">
                                <Facebook size={20} />
                             </button>
                             <button onClick={(e) => handleShare('instagram', e)} className="text-[var(--color-primary)] hover:text-[var(--color-tertiary)] transition-colors">
                                <Instagram size={20} />
                             </button>
                        </div>
                        <a href={item.sourceLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-bold text-[var(--color-primary)] hover:text-white transition-colors uppercase">
                            FORRÁS <ExternalLink size={16} />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};