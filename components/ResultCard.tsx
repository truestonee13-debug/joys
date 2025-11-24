
import React, { useState, useEffect } from 'react';
import { GeneratedPrompt, Language, Shot, Character } from '../types';
import { Copy, Check, RefreshCw, Trash2, Film, Layers, Edit3, Mic, Users, MessageSquare, Plus, X, Music, UserPlus, Clapperboard } from 'lucide-react';

interface ResultCardProps {
  result: GeneratedPrompt;
  onDelete: (id: string) => void;
  onRegenerate: (req: GeneratedPrompt['originalRequest']) => void;
  language: Language;
}

type ShotSubTab = 'visual' | 'characters' | 'dialogue' | 'audio';

export const ResultCard: React.FC<ResultCardProps> = ({ result, onDelete, onRegenerate, language }) => {
  const [activeTab, setActiveTab] = useState<'full' | 'shots' | 'narration' | 'characters' | 'notes'>('full');
  const [activeShotId, setActiveShotId] = useState<string>(result.shots[0]?.id || '');
  const [shotSubTab, setShotSubTab] = useState<ShotSubTab>('visual');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  
  // Local state for editable content
  const [editableShots, setEditableShots] = useState<Shot[]>(result.shots);
  const [editableNarration, setEditableNarration] = useState<string>(result.narration || '');
  const [editableCharacters, setEditableCharacters] = useState<Character[]>(result.characters || []);

  // Update local state if result changes (e.g. after translation)
  useEffect(() => {
    setEditableShots(result.shots);
    setEditableNarration(result.narration || '');
    setEditableCharacters(result.characters || []);
    if (result.shots.length > 0 && !result.shots.find(s => s.id === activeShotId)) {
      setActiveShotId(result.shots[0].id);
    }
  }, [result]);

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const getShotFullText = (shot: Shot) => {
    const labels = {
      visual: language === 'en' ? '[Visuals]' : '[장면 묘사]',
      tech: language === 'en' ? '[Technical]' : '[기술적 묘사]',
      char: language === 'en' ? '[Characters]' : '[등장인물]',
      dial: language === 'en' ? '[Dialogue]' : '[대사]',
      lip: language === 'en' ? '[Lip Sync (D-ID Optimized)]' : '[입모양 가이드 (D-ID 최적화)]',
      audio: language === 'en' ? '[Audio]' : '[오디오]',
      none: language === 'en' ? 'None' : '없음'
    };

    const charText = shot.characters.length > 0 
      ? shot.characters.map(c => `- ${c.name}: ${c.description}`).join('\n') 
      : labels.none;

    return `Shot ${shot.index} (${shot.duration})
----------------------------------------
${labels.visual}
${shot.visualPrompt}

${labels.tech}
${shot.technicalPrompt}

${labels.char}
${charText}

${labels.dial}
${shot.dialogue || labels.none}

${labels.lip}
${shot.lipSync || labels.none}

${labels.audio}
BGM: ${shot.bgm || labels.none}
SFX: ${shot.sfx || labels.none}`;
  };
  
  const getProductionNoteText = () => {
    const pn = result.productionNote;
    if (!pn) return "";
    return `[Director's Vision]
${pn.directorVision}

[Cinematography & Color]
${pn.cinematography}

[Art Direction]
${pn.artDirection}

[Sound Design]
${pn.soundDesign}

[Editing Style]
${pn.editingStyle}`;
  };

  // --- Handlers for Shots ---
  const handleShotEdit = (id: string, field: keyof Shot, value: any) => {
    setEditableShots(prev => prev.map(shot => 
      shot.id === id ? { ...shot, [field]: value } : shot
    ));
  };

  const handleShotCharacterEdit = (shotId: string, charIndex: number, field: keyof Character, value: string) => {
    setEditableShots(prev => prev.map(shot => {
      if (shot.id !== shotId) return shot;
      const newChars = [...shot.characters];
      newChars[charIndex] = { ...newChars[charIndex], [field]: value };
      return { ...shot, characters: newChars };
    }));
  };

  const handleAddShotCharacter = (shotId: string) => {
    setEditableShots(prev => prev.map(shot => {
      if (shot.id !== shotId) return shot;
      return { ...shot, characters: [...shot.characters, { name: '', description: '' }] };
    }));
  };

  const handleDeleteShotCharacter = (shotId: string, charIndex: number) => {
    setEditableShots(prev => prev.map(shot => {
      if (shot.id !== shotId) return shot;
      const newChars = shot.characters.filter((_, i) => i !== charIndex);
      return { ...shot, characters: newChars };
    }));
  };

  // --- Handlers for Global Characters ---
  const handleGlobalCharEdit = (index: number, field: keyof Character, value: string) => {
    setEditableCharacters(prev => {
      const newChars = [...prev];
      newChars[index] = { ...newChars[index], [field]: value };
      return newChars;
    });
  };

  const handleAddGlobalChar = () => {
    setEditableCharacters(prev => [...prev, { name: '', description: '' }]);
  };

  const handleDeleteGlobalChar = (index: number) => {
    setEditableCharacters(prev => prev.filter((_, i) => i !== index));
  };

  const activeShot = editableShots.find(s => s.id === activeShotId);

  const motionText = Array.isArray(result.originalRequest.motion) 
    ? result.originalRequest.motion.join(', ') : result.originalRequest.motion;
    
  const combinedPrompt = `${result.visualPrompt} --style ${result.originalRequest.style} --ar ${result.originalRequest.aspectRatio} --motion ${motionText}. Technical details: ${result.technicalPrompt}`;

  const labels = {
    en: {
      visualPrompt: "Visual Prompt",
      technicalDetails: "Technical Details",
      copyFull: "Copy Full Combined Prompt",
      copy: "Copy",
      copied: "Copied",
      tabFull: "Full Overview",
      tabShots: "Shot Breakdown",
      tabNarration: "Narration",
      tabCharacters: "Characters",
      tabNotes: "Production Notes",
      shot: "Shot",
      duration: "Duration",
      editPlaceholder: "Edit this prompt...",
      narrationLabel: "Voiceover Script (with Tone Tags)",
      subTabVisual: "Visuals",
      subTabCharacters: "Characters",
      subTabDialogue: "Dialogue",
      subTabAudio: "Audio / Sound",
      charName: "Name",
      charDesc: "Description",
      addChar: "Add Character",
      dialoguePlaceholder: "Enter dialogue e.g. 'John: [Happy] Hello!'...",
      lipSyncLabel: "Lip Sync & Facial Emphasis",
      lipSyncPlaceholder: "D-ID/HeyGen Optimized: e.g. 'Viseme O, lips rounded', 'Jaw drop for A'...",
      noDialogue: "No dialogue in this shot.",
      deleteChar: "Remove Character",
      bgmLabel: "BGM (Background Music)",
      sfxLabel: "SFX (Sound Effects)",
      bgmPlaceholder: "Describe the mood, genre, or tempo...",
      sfxPlaceholder: "Describe specific sound effects...",
      copyShotFull: "Copy All Shot Info",
      globalCharTitle: "Global Character Profiles",
      globalCharDesc: "Define the main characters here to ensure consistency across all shots. You can edit or add new ones.",
      addGlobalChar: "Add New Character",
      noteTitle: "Director & Crew Analysis",
      noteDesc: "Comprehensive production guide from the AI Creative Team."
    },
    ko: {
      visualPrompt: "비주얼 프롬프트",
      technicalDetails: "기술적 세부사항",
      copyFull: "전체 프롬프트 복사",
      copy: "복사",
      copied: "복사됨",
      tabFull: "전체 개요",
      tabShots: "컷별 편집 (Shots)",
      tabNarration: "나레이션",
      tabCharacters: "등장인물",
      tabNotes: "프로덕션 노트",
      shot: "샷",
      duration: "길이",
      editPlaceholder: "프롬프트 수정...",
      narrationLabel: "성우 스크립트 (감정 태그 포함)",
      subTabVisual: "장면 묘사",
      subTabCharacters: "등장인물",
      subTabDialogue: "대사",
      subTabAudio: "BGM / 음향효과",
      charName: "이름",
      charDesc: "외형 묘사",
      addChar: "인물 추가",
      dialoguePlaceholder: "대사를 입력하세요. 예: '철수: [기쁨] 안녕!'...",
      lipSyncLabel: "입모양 및 안면 근육 강조 (Lip Sync)",
      lipSyncPlaceholder: "D-ID/HeyGen 최적화: 예: '입술 둥글게(Viseme O)', '턱 벌림(Viseme A)', '미세한 미소'...",
      noDialogue: "이 샷에는 대사가 없습니다.",
      deleteChar: "인물 삭제",
      bgmLabel: "BGM (배경음악)",
      sfxLabel: "SFX (음향효과)",
      bgmPlaceholder: "분위기, 장르, 템포 등을 묘사하세요...",
      sfxPlaceholder: "구체적인 효과음을 묘사하세요...",
      copyShotFull: "샷 전체 정보 복사",
      globalCharTitle: "전체 등장인물 프로필",
      globalCharDesc: "영상 전체에 일관되게 등장하는 주요 인물들입니다. 자유롭게 수정하거나 추가할 수 있습니다.",
      addGlobalChar: "새 등장인물 추가",
      noteTitle: "감독 및 제작진 분석",
      noteDesc: "AI 크리에이티브 팀이 제안하는 종합 프로덕션 가이드입니다."
    }
  };

  const t = labels[language];

  return (
    <div className="w-full bg-surface rounded-2xl border border-white/10 overflow-hidden shadow-xl animate-fade-in">
      <div className="bg-gradient-to-r from-primary/20 to-secondary/10 p-4 border-b border-white/5 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-lg text-white">{result.title}</h3>
          <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{result.originalRequest.style} • {result.originalRequest.aspectRatio}</span>
        </div>
        <div className="flex gap-2">
             <button 
            onClick={() => onRegenerate(result.originalRequest)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
            title="Regenerate with same settings"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete(result.id)}
            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-gray-400 hover:text-red-400"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-white/5 bg-dark/20 overflow-x-auto">
        <button
          onClick={() => setActiveTab('full')}
          className={`flex-1 py-3 px-2 text-sm font-medium flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'full' 
              ? 'text-white border-b-2 border-primary bg-white/5' 
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          <Film className="w-4 h-4" />
          {t.tabFull}
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-3 px-2 text-sm font-medium flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'notes' 
              ? 'text-white border-b-2 border-orange-500 bg-white/5' 
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          <Clapperboard className="w-4 h-4" />
          {t.tabNotes}
        </button>
        <button
          onClick={() => setActiveTab('characters')}
          className={`flex-1 py-3 px-2 text-sm font-medium flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'characters' 
              ? 'text-white border-b-2 border-green-500 bg-white/5' 
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4" />
          {t.tabCharacters}
        </button>
        <button
          onClick={() => setActiveTab('shots')}
          className={`flex-1 py-3 px-2 text-sm font-medium flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'shots' 
              ? 'text-white border-b-2 border-secondary bg-white/5' 
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          <Layers className="w-4 h-4" />
          {t.tabShots}
        </button>
        <button
          onClick={() => setActiveTab('narration')}
          className={`flex-1 py-3 px-2 text-sm font-medium flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'narration' 
              ? 'text-white border-b-2 border-purple-500 bg-white/5' 
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          <Mic className="w-4 h-4" />
          {t.tabNarration}
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'full' && (
          // Full Overview Tab
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-primary uppercase tracking-wider">{t.visualPrompt}</label>
                <button 
                  onClick={() => handleCopy(result.visualPrompt, 'visual')}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  {copiedSection === 'visual' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  {copiedSection === 'visual' ? t.copied : t.copy}
                </button>
              </div>
              <p className="text-gray-200 leading-relaxed bg-dark/30 p-4 rounded-lg border border-white/5 text-sm">
                {result.visualPrompt}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">{t.technicalDetails}</label>
                 <button 
                  onClick={() => handleCopy(result.technicalPrompt, 'tech')}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                >
                   {copiedSection === 'tech' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  {copiedSection === 'tech' ? t.copied : t.copy}
                </button>
              </div>
               <p className="text-gray-400 leading-relaxed bg-dark/30 p-3 rounded-lg border border-white/5 text-xs font-mono">
                {result.technicalPrompt}
              </p>
            </div>

             <div className="pt-2 border-t border-white/5">
                <button
                    onClick={() => handleCopy(combinedPrompt, 'all')}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-all flex justify-center items-center gap-2 border border-white/10"
                >
                    {copiedSection === 'all' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    {t.copyFull}
                </button>
             </div>
          </div>
        )}
        
        {activeTab === 'notes' && (
          // Production Notes Tab (NEW)
          <div className="space-y-6 animate-fade-in">
             <div className="flex justify-between items-start">
               <div className="flex flex-col gap-2">
                 <h4 className="text-sm font-bold text-orange-400 uppercase tracking-wider flex items-center gap-2">
                   <Clapperboard className="w-4 h-4" /> {t.noteTitle}
                 </h4>
                 <p className="text-xs text-gray-400">{t.noteDesc}</p>
               </div>
               <button 
                  onClick={() => handleCopy(getProductionNoteText(), 'notes')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-lg text-orange-400 hover:text-white transition-colors text-xs font-medium"
                >
                  {copiedSection === 'notes' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {t.copy}
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.productionNote && Object.entries(result.productionNote).map(([key, value]) => (
                  <div key={key} className="bg-dark/30 border border-white/5 rounded-lg p-4 space-y-2">
                     <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                       {key.replace(/([A-Z])/g, ' $1').trim()}
                     </div>
                     <p className="text-sm text-gray-300 leading-relaxed">{value}</p>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'characters' && (
          // Global Characters Tab
          <div className="space-y-6 animate-fade-in">
             <div className="flex flex-col gap-2">
               <h4 className="text-sm font-bold text-green-400 uppercase tracking-wider flex items-center gap-2">
                 <Users className="w-4 h-4" /> {t.globalCharTitle}
               </h4>
               <p className="text-xs text-gray-400">{t.globalCharDesc}</p>
             </div>

             <div className="grid grid-cols-1 gap-4">
                {editableCharacters.map((char, idx) => (
                  <div key={idx} className="bg-dark/30 border border-white/5 rounded-lg p-4 space-y-3 shadow-sm relative">
                      <div className="flex justify-between items-start">
                        <div className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-1">{t.charName}</div>
                        <div className="flex gap-2">
                           <button 
                            onClick={() => handleCopy(`${char.name}: ${char.description}`, `global-char-${idx}`)}
                            className="text-gray-500 hover:text-white transition-colors p-1"
                            title="Copy Character Info"
                          >
                             {copiedSection === `global-char-${idx}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                          <button 
                            onClick={() => handleDeleteGlobalChar(idx)}
                            className="text-gray-600 hover:text-red-400 transition-colors p-1"
                            title={t.deleteChar}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <input 
                        type="text" 
                        value={char.name}
                        onChange={(e) => handleGlobalCharEdit(idx, 'name', e.target.value)}
                        className="w-full bg-dark/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:ring-2 focus:ring-green-500/50 outline-none"
                        placeholder="Character Name"
                      />
                      
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.charDesc}</div>
                      <textarea 
                        value={char.description}
                        onChange={(e) => handleGlobalCharEdit(idx, 'description', e.target.value)}
                        className="w-full h-24 bg-dark/50 border border-white/10 rounded px-3 py-2 text-sm text-gray-300 focus:ring-2 focus:ring-green-500/50 outline-none resize-none leading-relaxed"
                        placeholder="Description of appearance, clothing..."
                      />
                  </div>
                ))}
                
                <button 
                  onClick={handleAddGlobalChar}
                  className="w-full py-4 border border-dashed border-white/10 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2 hover:border-green-500/50"
                >
                  <UserPlus className="w-5 h-5" /> {t.addGlobalChar}
                </button>
             </div>
          </div>
        )}

        {activeTab === 'shots' && (
          // Shot Breakdown Tab
          <div className="space-y-6">
            {/* Shot Selection Tabs */}
            <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
              {editableShots.map((shot) => (
                <button
                  key={shot.id}
                  onClick={() => setActiveShotId(shot.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-medium transition-all border ${
                    activeShotId === shot.id
                      ? 'bg-secondary/20 border-secondary text-white'
                      : 'bg-dark/30 border-white/5 text-gray-400 hover:bg-dark/50'
                  }`}
                >
                  {t.shot} {shot.index}
                </button>
              ))}
            </div>

            {activeShot && (
              <div className="animate-fade-in space-y-5">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-gray-400">
                    <div className="flex items-center gap-3">
                      <span className="bg-white/5 px-2 py-1 rounded border border-white/5">{t.duration}: <span className="text-white font-semibold">{activeShot.duration}</span></span>
                      <button 
                        onClick={() => handleCopy(getShotFullText(activeShot), `full-shot-${activeShot.id}`)}
                        className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded text-primary hover:text-white transition-colors"
                        title={t.copyShotFull}
                      >
                        {copiedSection === `full-shot-${activeShot.id}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span className="hidden sm:inline">{t.copyShotFull}</span>
                      </button>
                    </div>
                    
                    {/* Sub-tabs for Active Shot */}
                    <div className="flex bg-dark/50 rounded-lg p-1 border border-white/5 overflow-x-auto">
                      <button 
                        onClick={() => setShotSubTab('visual')}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${shotSubTab === 'visual' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                      >
                        <Edit3 className="w-3 h-3" /> {t.subTabVisual}
                      </button>
                      <button 
                        onClick={() => setShotSubTab('characters')}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${shotSubTab === 'characters' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                      >
                        <Users className="w-3 h-3" /> {t.subTabCharacters}
                      </button>
                      <button 
                        onClick={() => setShotSubTab('dialogue')}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${shotSubTab === 'dialogue' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                      >
                        <MessageSquare className="w-3 h-3" /> {t.subTabDialogue}
                      </button>
                      <button 
                        onClick={() => setShotSubTab('audio')}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${shotSubTab === 'audio' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                      >
                        <Music className="w-3 h-3" /> {t.subTabAudio}
                      </button>
                    </div>
                 </div>

                {/* VISUAL SUB-TAB */}
                {shotSubTab === 'visual' && (
                  <div className="animate-fade-in space-y-4">
                    {/* Editable Visual Prompt */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
                           {t.visualPrompt}
                        </label>
                        <button 
                          onClick={() => handleCopy(`${activeShot.visualPrompt} ${activeShot.technicalPrompt}`, `shot-${activeShot.id}`)}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                        >
                          {copiedSection === `shot-${activeShot.id}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                          {copiedSection === `shot-${activeShot.id}` ? t.copied : t.copy}
                        </button>
                      </div>
                      <textarea 
                        value={activeShot.visualPrompt}
                        onChange={(e) => handleShotEdit(activeShot.id, 'visualPrompt', e.target.value)}
                        placeholder={t.editPlaceholder}
                        className="w-full h-32 bg-dark/30 border border-white/10 rounded-lg p-3 text-sm text-gray-200 focus:ring-2 focus:ring-primary/50 outline-none resize-none transition-all"
                      />
                    </div>

                    {/* Editable Technical Prompt */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="flex items-center gap-2 text-xs font-semibold text-secondary uppercase tracking-wider">
                           {t.technicalDetails}
                        </label>
                      </div>
                      <textarea 
                        value={activeShot.technicalPrompt}
                        onChange={(e) => handleShotEdit(activeShot.id, 'technicalPrompt', e.target.value)}
                        placeholder={t.editPlaceholder}
                        className="w-full h-20 bg-dark/30 border border-white/10 rounded-lg p-3 text-xs text-gray-400 font-mono focus:ring-2 focus:ring-secondary/50 outline-none resize-none transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* CHARACTERS SUB-TAB (Per Shot) */}
                {shotSubTab === 'characters' && (
                  <div className="animate-fade-in space-y-4">
                    {activeShot.characters.length === 0 ? (
                       <div className="text-center py-8 bg-dark/30 rounded-lg border border-dashed border-white/10">
                          <p className="text-gray-500 text-sm mb-3">{language === 'en' ? 'No characters listed for this shot.' : '이 샷에 등록된 등장인물이 없습니다.'}</p>
                          <button 
                            onClick={() => handleAddShotCharacter(activeShot.id)}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded text-xs text-gray-300 transition-colors inline-flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> {t.addChar}
                          </button>
                       </div>
                    ) : (
                      <div className="space-y-4">
                        {activeShot.characters.map((char, idx) => (
                          <div key={idx} className="bg-dark/30 border border-white/5 rounded-lg p-3 space-y-3 group">
                             <div className="flex justify-between items-start">
                                <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">{t.charName}</div>
                                <button 
                                  onClick={() => handleDeleteShotCharacter(activeShot.id, idx)}
                                  className="text-gray-600 hover:text-red-400 transition-colors p-1"
                                  title={t.deleteChar}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                             </div>
                             <input 
                                type="text" 
                                value={char.name}
                                onChange={(e) => handleShotCharacterEdit(activeShot.id, idx, 'name', e.target.value)}
                                className="w-full bg-dark/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                                placeholder="Character Name"
                             />
                             
                             <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.charDesc}</div>
                             <textarea 
                                value={char.description}
                                onChange={(e) => handleShotCharacterEdit(activeShot.id, idx, 'description', e.target.value)}
                                className="w-full h-20 bg-dark/50 border border-white/10 rounded px-3 py-2 text-sm text-gray-300 focus:ring-2 focus:ring-blue-500/50 outline-none resize-none"
                                placeholder="Description of appearance, clothing..."
                             />
                          </div>
                        ))}
                        <button 
                          onClick={() => handleAddShotCharacter(activeShot.id)}
                          className="w-full py-2 border border-dashed border-white/10 rounded-lg text-xs text-gray-500 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                        >
                          <Plus className="w-3 h-3" /> {t.addChar}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* DIALOGUE SUB-TAB */}
                {shotSubTab === 'dialogue' && (
                  <div className="animate-fade-in space-y-4">
                     {/* Spoken Dialogue */}
                     <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="flex items-center gap-2 text-xs font-semibold text-pink-400 uppercase tracking-wider">
                           {t.subTabDialogue}
                        </label>
                        <button 
                          onClick={() => handleCopy(activeShot.dialogue, `dialogue-${activeShot.id}`)}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                        >
                          {copiedSection === `dialogue-${activeShot.id}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                          {copiedSection === `dialogue-${activeShot.id}` ? t.copied : t.copy}
                        </button>
                      </div>
                      <textarea 
                        value={activeShot.dialogue}
                        onChange={(e) => handleShotEdit(activeShot.id, 'dialogue', e.target.value)}
                        placeholder={t.dialoguePlaceholder}
                        className="w-full h-32 bg-dark/30 border border-white/10 rounded-lg p-4 text-sm text-white focus:ring-2 focus:ring-pink-500/50 outline-none resize-none transition-all leading-relaxed"
                      />
                       <p className="text-xs text-gray-500 italic">
                         {activeShot.dialogue ? "" : t.noDialogue}
                       </p>
                    </div>

                     {/* Lip Sync Instruction (NEW) */}
                    <div className="space-y-2 border-t border-white/5 pt-4">
                      <div className="flex justify-between items-center">
                        <label className="flex items-center gap-2 text-xs font-semibold text-rose-400 uppercase tracking-wider">
                           {t.lipSyncLabel}
                        </label>
                         <button 
                          onClick={() => handleCopy(activeShot.lipSync, `lipsync-${activeShot.id}`)}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                        >
                          {copiedSection === `lipsync-${activeShot.id}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                          {copiedSection === `lipsync-${activeShot.id}` ? t.copied : t.copy}
                        </button>
                      </div>
                      <textarea 
                        value={activeShot.lipSync}
                        onChange={(e) => handleShotEdit(activeShot.id, 'lipSync', e.target.value)}
                        placeholder={t.lipSyncPlaceholder}
                        className="w-full h-20 bg-dark/30 border border-white/10 rounded-lg p-3 text-sm text-gray-300 focus:ring-2 focus:ring-rose-500/50 outline-none resize-none transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* AUDIO SUB-TAB */}
                {shotSubTab === 'audio' && (
                   <div className="animate-fade-in space-y-6">
                      {/* BGM Input */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="flex items-center gap-2 text-xs font-semibold text-yellow-400 uppercase tracking-wider">
                             {t.bgmLabel}
                          </label>
                          <button 
                            onClick={() => handleCopy(activeShot.bgm, `bgm-${activeShot.id}`)}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                          >
                            {copiedSection === `bgm-${activeShot.id}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                            {copiedSection === `bgm-${activeShot.id}` ? t.copied : t.copy}
                          </button>
                        </div>
                        <textarea 
                          value={activeShot.bgm}
                          onChange={(e) => handleShotEdit(activeShot.id, 'bgm', e.target.value)}
                          placeholder={t.bgmPlaceholder}
                          className="w-full h-20 bg-dark/30 border border-white/10 rounded-lg p-3 text-sm text-gray-200 focus:ring-2 focus:ring-yellow-500/50 outline-none resize-none transition-all"
                        />
                      </div>

                      {/* SFX Input */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="flex items-center gap-2 text-xs font-semibold text-orange-400 uppercase tracking-wider">
                             {t.sfxLabel}
                          </label>
                          <button 
                            onClick={() => handleCopy(activeShot.sfx, `sfx-${activeShot.id}`)}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                          >
                            {copiedSection === `sfx-${activeShot.id}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                            {copiedSection === `sfx-${activeShot.id}` ? t.copied : t.copy}
                          </button>
                        </div>
                        <textarea 
                          value={activeShot.sfx}
                          onChange={(e) => handleShotEdit(activeShot.id, 'sfx', e.target.value)}
                          placeholder={t.sfxPlaceholder}
                          className="w-full h-20 bg-dark/30 border border-white/10 rounded-lg p-3 text-sm text-gray-200 focus:ring-2 focus:ring-orange-500/50 outline-none resize-none transition-all"
                        />
                      </div>
                   </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'narration' && (
          // Narration Tab
          <div className="space-y-6 animate-fade-in">
             <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider">
                    <Mic className="w-3 h-3" /> {t.narrationLabel}
                  </label>
                  <button 
                    onClick={() => handleCopy(editableNarration, 'narration')}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    {copiedSection === 'narration' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    {copiedSection === 'narration' ? t.copied : t.copy}
                  </button>
                </div>
                <textarea 
                  value={editableNarration}
                  onChange={(e) => setEditableNarration(e.target.value)}
                  placeholder={t.editPlaceholder}
                  className="w-full h-64 bg-dark/30 border border-white/10 rounded-lg p-4 text-base text-gray-200 focus:ring-2 focus:ring-purple-500/50 outline-none resize-none transition-all leading-relaxed"
                />
                <p className="text-xs text-gray-500 italic">
                  * {language === 'en' ? 'Edit the script freely. Keep [Tags] for TTS engines.' : '스크립트를 자유롭게 수정하세요. [태그]는 TTS 엔진을 위해 유지하는 것이 좋습니다.'}
                </p>
              </div>
          </div>
        )}
      </div>
    </div>
  );
};
