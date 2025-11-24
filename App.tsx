
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ResultCard } from './components/ResultCard';
import { 
  generateVideoPrompt, 
  generateDetailSuggestions,
  generateCinematicDesign, // Imported new service
  translateText, 
  translatePromptResult 
} from './services/geminiService';
import { 
  VideoStyle, 
  VideoAspectRatio, 
  CameraMotion, 
  PromptRequest, 
  GeneratedPrompt, 
  LoadingState,
  Language
} from './types';
import { 
  Wand2, 
  Loader2, 
  Video, 
  Camera, 
  Maximize, 
  AlignLeft, 
  History,
  Sparkles,
  Timer,
  Scissors,
  Film,
  Clapperboard
} from 'lucide-react';

// --- Translation Dictionaries ---
// (Reuse existing huge translation object, abbreviating for clarity in update)
const TRANSLATIONS = {
  en: {
    title: "Scene Configuration",
    conceptLabel: "Core Concept / Subject",
    conceptPlaceholder: "e.g., A cyberpunk detective walking in rain, neon lights reflect on puddles...",
    styleLabel: "Visual Style",
    ratioLabel: "Aspect Ratio",
    motionLabel: "Camera Setup (Multi-select)",
    totalDurationLabel: "Total Duration",
    cutDurationLabel: "Cut Length",
    durationPlaceholder: "e.g., 10s",
    cutPlaceholder: "e.g., 3s",
    detailsLabel: "Extra Details (Optional)",
    detailsPlaceholder: "Specific lighting, mood, or colors...",
    suggestBtn: "AI Suggest",
    suggesting: "Thinking...",
    generateBtn: "Generate Pro Prompt",
    generatingBtn: "Designing Scene...",
    thinkingBtn: "Calculating Lighting...",
    historyTitle: "Generated Prompts",
    resultsCount: "results",
    emptyTitle: "Ready to Create",
    emptyDesc: "Enter your concept on the left to generate professional-grade prompts optimized for Sora, Veo, and other AI video models.",
    errorGeneral: "An unexpected error occurred.",
    errorApi: "Failed to generate prompt. Please check your API key or internet connection.",
    autoDesignBtn: "AI Director Auto-Design",
    autoDesigning: "Consulting World-Class Crew...",
  },
  ko: {
    title: "장면 설정",
    conceptLabel: "핵심 컨셉 / 주제",
    conceptPlaceholder: "예: 빗속을 걷는 사이버펑크 형사, 웅덩이에 반사되는 네온 사인...",
    styleLabel: "비주얼 스타일",
    ratioLabel: "화면 비율",
    motionLabel: "카메라 무빙 & 구도 (다중 선택 가능)",
    totalDurationLabel: "영상 총 길이",
    cutDurationLabel: "컷 길이",
    durationPlaceholder: "예: 10초",
    cutPlaceholder: "예: 3초",
    detailsLabel: "추가 세부사항 (선택)",
    detailsPlaceholder: "조명, 분위기, 색감 등...",
    suggestBtn: "AI 추천",
    suggesting: "생성 중...",
    generateBtn: "프로 프롬프트 생성",
    generatingBtn: "장면 설계 중...",
    thinkingBtn: "조명 및 물리 계산 중...",
    historyTitle: "생성된 프롬프트",
    resultsCount: "개 결과",
    emptyTitle: "제작 준비 완료",
    emptyDesc: "왼쪽에 컨셉을 입력하여 Sora, Veo 등의 AI 비디오 모델에 최적화된 전문가급 프롬프트를 생성하세요.",
    errorGeneral: "알 수 없는 오류가 발생했습니다.",
    errorApi: "프롬프트 생성 실패. API 키나 인터넷 연결을 확인해주세요.",
    autoDesignBtn: "AI 감독 자동 설계",
    autoDesigning: "세계적 제작진과 협의 중...",
  }
};

const STYLE_LABELS: Record<VideoStyle, { en: string; ko: string }> = {
  // Cinematic
  [VideoStyle.Cinematic]: { en: "Cinematic", ko: "시네마틱 (영화 같은)" },
  [VideoStyle.Photorealistic]: { en: "Photorealistic", ko: "포토리얼리스틱 (초현실적 실사)" },
  [VideoStyle.Vintage_Film]: { en: "Vintage Film", ko: "빈티지 필름 (레트로)" },
  [VideoStyle.Noir]: { en: "Film Noir", ko: "필름 누아르 (흑백/범죄)" },
  [VideoStyle.Documentary]: { en: "Documentary", ko: "다큐멘터리" },
  [VideoStyle.WesAnderson]: { en: "Wes Anderson Style", ko: "웨스 앤더슨 스타일 (파스텔/대칭)" },
  [VideoStyle.Tarantino]: { en: "Tarantino Style", ko: "타란티노 스타일 (강렬함)" },
  [VideoStyle.Blockbuster]: { en: "Hollywood Blockbuster", ko: "할리우드 블록버스터" },
  [VideoStyle.IndieFilm]: { en: "Indie Film", ko: "인디 영화 감성" },
  [VideoStyle.SilentMovie]: { en: "Silent Movie", ko: "무성 영화 (1920년대)" },
  [VideoStyle.VHS]: { en: "VHS Tape", ko: "VHS 비디오 테이프" },

  // Animation & Art
  [VideoStyle.Anime]: { en: "Anime", ko: "일본 애니메이션" },
  [VideoStyle.Ghibli]: { en: "Studio Ghibli Style", ko: "지브리 스튜디오 스타일" },
  [VideoStyle.DisneyPixar]: { en: "Disney/Pixar Style", ko: "디즈니/픽사 3D 스타일" },
  [VideoStyle.ThreeD_Animation]: { en: "3D Animation", ko: "3D 애니메이션" },
  [VideoStyle.Claymation]: { en: "Claymation", ko: "클레이 애니메이션 (스톱모션)" },
  [VideoStyle.Cyberpunk]: { en: "Cyberpunk", ko: "사이버펑크" },
  [VideoStyle.Steampunk]: { en: "Steampunk", ko: "스팀펑크" },
  [VideoStyle.Fantasy]: { en: "Fantasy", ko: "판타지" },
  [VideoStyle.SciFi]: { en: "Sci-Fi", ko: "SF (공상과학)" },
  [VideoStyle.OilPainting]: { en: "Oil Painting", ko: "유화 (움직이는 명화)" },
  [VideoStyle.Watercolor]: { en: "Watercolor", ko: "수채화" },
  [VideoStyle.Sketch]: { en: "Pencil Sketch", ko: "연필 스케치" },
  [VideoStyle.PixelArt]: { en: "Pixel Art", ko: "픽셀 아트 (8-bit)" },
  [VideoStyle.ComicBook]: { en: "Comic Book", ko: "미국 만화책 스타일" },
  [VideoStyle.LowPoly]: { en: "Low Poly", ko: "로우 폴리곤" },
  [VideoStyle.UkiyoE]: { en: "Ukiyo-e", ko: "우키요에 (일본 판화)" },

  // Modern & Abstract
  [VideoStyle.Glitch]: { en: "Glitch Art", ko: "글리치 아트 (디지털 오류)" },
  [VideoStyle.Vaporwave]: { en: "Vaporwave", ko: "베이퍼웨이브" },
  [VideoStyle.Surrealism]: { en: "Surrealism", ko: "초현실주의" },
  [VideoStyle.Abstract]: { en: "Abstract", ko: "추상 예술" },
  [VideoStyle.Minimalist]: { en: "Minimalist", ko: "미니멀리즘" },
  [VideoStyle.GoPro]: { en: "GoPro Action", ko: "고프로 액션캠" },
  [VideoStyle.CCTV]: { en: "CCTV Footage", ko: "CCTV (보안카메라)" },
  [VideoStyle.UnrealEngine]: { en: "Unreal Engine 5", ko: "언리얼 엔진 5" },
  [VideoStyle.Isometric]: { en: "Isometric 3D", ko: "아이소메트릭 (쿼터뷰)" },
  [VideoStyle.Macro]: { en: "Macro Photography", ko: "초근접 촬영 (매크로)" }
};

const MOTION_LABELS: Record<CameraMotion, { en: string; ko: string }> = {
  // 1. Basic Movement
  [CameraMotion.Static]: { en: "Static", ko: "고정 (Static)" },
  [CameraMotion.Pan]: { en: "Pan", ko: "팬 (좌우 회전)" },
  [CameraMotion.Tilt]: { en: "Tilt", ko: "틸트 (상하 회전)" },
  [CameraMotion.ZoomIn]: { en: "Zoom In", ko: "줌 인" },
  [CameraMotion.ZoomOut]: { en: "Zoom Out", ko: "줌 아웃" },
  [CameraMotion.Pedestal]: { en: "Pedestal", ko: "페데스탈 (상하 수직이동)" },
  [CameraMotion.Truck]: { en: "Truck", ko: "트럭 (좌우 수평이동)" },
  [CameraMotion.Roll]: { en: "Camera Roll", ko: "롤 (카메라 회전)" },

  // 2. Framing & Angles
  [CameraMotion.ExtremeCloseUp]: { en: "Extreme Close-Up", ko: "익스트림 클로즈업 (초근접)" },
  [CameraMotion.CloseUp]: { en: "Close-Up", ko: "클로즈업 (인물/사물 강조)" },
  [CameraMotion.MediumShot]: { en: "Medium Shot", ko: "미디엄 샷 (상반신)" },
  [CameraMotion.WideShot]: { en: "Wide Shot", ko: "와이드 샷 (배경 포함)" },
  [CameraMotion.EstablishingShot]: { en: "Establishing Shot", ko: "이스타블리싱 샷 (설정)" },
  [CameraMotion.LowAngle]: { en: "Low Angle", ko: "로우 앵글 (아래에서 위로)" },
  [CameraMotion.HighAngle]: { en: "High Angle", ko: "하이 앵글 (위에서 아래로)" },
  [CameraMotion.Overhead]: { en: "Overhead View", ko: "오버헤드 (수직 부감)" },
  [CameraMotion.WormsEye]: { en: "Worm's Eye", ko: "웜즈 아이 (바닥 시점)" },
  [CameraMotion.EyeLevel]: { en: "Eye Level", ko: "아이 레벨 (눈높이)" },
  [CameraMotion.DutchAngle]: { en: "Dutch Angle", ko: "더치 앵글 (기울이기)" },

  // 3. Advanced & Dynamic
  [CameraMotion.DollyZoom]: { en: "Dolly Zoom", ko: "돌리 줌 (현기증 효과)" },
  [CameraMotion.TrackingShot]: { en: "Tracking Shot", ko: "트래킹 (피사체 추적)" },
  [CameraMotion.Crane]: { en: "Crane / Jib", ko: "크레인 / 지브 샷" },
  [CameraMotion.Orbit]: { en: "Orbit / Arc", ko: "오빗 / 아크 (빙글 돌기)" },
  [CameraMotion.Handheld]: { en: "Handheld", ko: "핸드헬드 (들고 찍기)" },
  [CameraMotion.ShakeyCam]: { en: "Shakey Cam", ko: "쉐이키 캠 (심한 흔들림)" },
  [CameraMotion.DroneFlyover]: { en: "Drone Flyover", ko: "드론 비행 (상공)" },
  [CameraMotion.FPV]: { en: "FPV Drone", ko: "FPV 드론 (1인칭 고속)" },
  [CameraMotion.FollowShot]: { en: "Follow Shot", ko: "팔로우 샷 (뒤따라가기)" },
  [CameraMotion.POV]: { en: "POV", ko: "1인칭 시점 (주인공 시선)" },
  [CameraMotion.Gimbal]: { en: "Gimbal Smooth", ko: "짐벌 (흔들림 없는)" },
  [CameraMotion.Steadicam]: { en: "Steadicam", ko: "스테디캠 (부드러운 이동)" },
  [CameraMotion.WhipPan]: { en: "Whip Pan", ko: "휩 팬 (빠른 전환)" },
  [CameraMotion.CrashZoom]: { en: "Crash Zoom", ko: "크래시 줌 (급격한 줌)" },

  // 4. Lens & Effects
  [CameraMotion.RackFocus]: { en: "Rack Focus", ko: "랙 포커스 (초점 이동)" },
  [CameraMotion.DeepFocus]: { en: "Deep Focus", ko: "딥 포커스 (전체 선명)" },
  [CameraMotion.ShallowFocus]: { en: "Shallow Focus", ko: "쉘로우 포커스 (아웃포커싱)" },
  [CameraMotion.FishEye]: { en: "Fish Eye", ko: "어안 렌즈 (왜곡)" },
  [CameraMotion.BulletTime]: { en: "Bullet Time", ko: "불릿 타임 (매트릭스 효과)" },

  // 5. Time & Speed
  [CameraMotion.SlowMotion]: { en: "Slow Motion", ko: "슬로우 모션" },
  [CameraMotion.TimeLapse]: { en: "Time-Lapse", ko: "타임랩스 (빠른 시간)" },
  [CameraMotion.HyperLapse]: { en: "Hyper-Lapse", ko: "하이퍼랩스 (이동 타임랩스)" },
  [CameraMotion.Reverse]: { en: "Reverse", ko: "리버스 (역재생)" }
};

// Grouping for UI
const MOTION_CATEGORIES = {
  "Basic Movement": [
    CameraMotion.Static, CameraMotion.Pan, CameraMotion.Tilt, 
    CameraMotion.ZoomIn, CameraMotion.ZoomOut, CameraMotion.Pedestal, 
    CameraMotion.Truck, CameraMotion.Roll
  ],
  "Framing & Angles": [
    CameraMotion.ExtremeCloseUp, CameraMotion.CloseUp, CameraMotion.MediumShot,
    CameraMotion.WideShot, CameraMotion.EstablishingShot, CameraMotion.LowAngle,
    CameraMotion.HighAngle, CameraMotion.Overhead, CameraMotion.WormsEye,
    CameraMotion.EyeLevel, CameraMotion.DutchAngle
  ],
  "Dynamic & Action": [
    CameraMotion.Handheld, CameraMotion.ShakeyCam, CameraMotion.DroneFlyover,
    CameraMotion.FPV, CameraMotion.FollowShot, CameraMotion.POV,
    CameraMotion.Gimbal, CameraMotion.Steadicam, CameraMotion.WhipPan,
    CameraMotion.CrashZoom, CameraMotion.TrackingShot, CameraMotion.Crane, 
    CameraMotion.Orbit, CameraMotion.DollyZoom
  ],
  "Lens, Effect & Time": [
    CameraMotion.RackFocus, CameraMotion.ShallowFocus, CameraMotion.DeepFocus,
    CameraMotion.FishEye, CameraMotion.BulletTime,
    CameraMotion.SlowMotion, CameraMotion.TimeLapse, 
    CameraMotion.HyperLapse, CameraMotion.Reverse
  ]
};

const App: React.FC = () => {
  // App State - Default to Korean ('ko')
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedLang = localStorage.getItem('veoSparkLanguage');
        return (savedLang === 'en' || savedLang === 'ko') ? savedLang : 'ko';
      } catch (e) { return 'ko'; }
    }
    return 'ko';
  });

  const [isTranslating, setIsTranslating] = useState(false);

  // Form State
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState<VideoStyle>(VideoStyle.Cinematic);
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>(VideoAspectRatio.Wide_16_9);
  const [motion, setMotion] = useState<CameraMotion[]>([CameraMotion.DroneFlyover]);
  
  const [totalDuration, setTotalDuration] = useState('');
  const [cutDuration, setCutDuration] = useState('');
  
  const [details, setDetails] = useState('');
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [autoDesignLoading, setAutoDesignLoading] = useState(false); // NEW STATE

  // Result State with Robust Migration
  const [loading, setLoading] = useState<LoadingState>({ isLoading: false, message: '' });
  const [results, setResults] = useState<GeneratedPrompt[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('veoSparkHistory');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed.map((item: any) => {
               // Defensive migration: Ensure basic fields exist
               if (!item.id || !item.originalRequest) return null;
               
               // Fix motion if it was a string (old format)
               let safeMotion = item.originalRequest.motion;
               if (!Array.isArray(safeMotion)) {
                 safeMotion = safeMotion ? [safeMotion] : [CameraMotion.Static];
               }
               
               return {
                 ...item,
                 originalRequest: {
                   ...item.originalRequest,
                   motion: safeMotion
                 },
                 characters: Array.isArray(item.characters) ? item.characters : [],
                 shots: Array.isArray(item.shots) ? item.shots : [],
                 narration: item.narration || "",
                 productionNote: item.productionNote || { 
                   directorVision: "N/A", cinematography: "N/A", artDirection: "N/A", soundDesign: "N/A", editingStyle: "N/A" 
                 }
               };
            }).filter(Boolean) as GeneratedPrompt[]; // Remove nulls
          }
        }
      } catch (e) {
        console.error('Failed to load history', e);
      }
    }
    return [];
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('veoSparkHistory', JSON.stringify(results));
    } catch (e) {
      console.error("Failed to save history", e);
    }
  }, [results]);

  useEffect(() => {
    try {
      localStorage.setItem('veoSparkLanguage', language);
    } catch (e) {
      console.error("Failed to save language", e);
    }
  }, [language]);

  const t = TRANSLATIONS[language];

  const toggleMotion = (m: CameraMotion) => {
    setMotion(prev => {
      if (prev.includes(m)) {
        if (prev.length === 1) return prev;
        return prev.filter(item => item !== m);
      } else {
        return [...prev, m];
      }
    });
  };

  const handleLanguageSwitch = async () => {
    const targetLang = language === 'en' ? 'ko' : 'en';
    setIsTranslating(true);

    try {
      const [translatedTopic, translatedDetails] = await Promise.all([
        translateText(topic, targetLang),
        translateText(details, targetLang),
      ]);
      
      // Translate most recent 5 results to avoid API limits, keep others as is
      const recentResults = results.slice(0, 5);
      const olderResults = results.slice(5);
      
      const translatedRecent = await Promise.all(recentResults.map(r => translatePromptResult(r, targetLang)));
      
      setTopic(translatedTopic);
      setDetails(translatedDetails);
      setResults([...translatedRecent, ...olderResults]);
      setLanguage(targetLang);
    } catch (e) {
      console.error("Translation failed", e);
      setLanguage(targetLang);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim()) return;

    setLoading({ isLoading: true, message: t.generatingBtn });
    setError(null);

    const request: PromptRequest = {
      topic,
      style,
      aspectRatio,
      motion,
      totalDuration,
      cutDuration,
      details
    };

    try {
       setLoading({ isLoading: true, message: t.thinkingBtn });
       const result = await generateVideoPrompt(request, language);
       setResults(prev => [result, ...prev]);
    } catch (err) {
       console.error(err);
       setError(t.errorApi);
    } finally {
       setLoading({ isLoading: false, message: '' });
    }
  };

  const handleRegenerate = (req: PromptRequest) => {
      setTopic(req.topic);
      setStyle(req.style);
      setAspectRatio(req.aspectRatio);
      setMotion(Array.isArray(req.motion) ? req.motion : [req.motion]);
      setTotalDuration(req.totalDuration);
      setCutDuration(req.cutDuration);
      setDetails(req.details || '');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    setResults(prev => prev.filter(r => r.id !== id));
  };

  const handleSuggestDetails = async () => {
    if (!topic.trim()) return;
    setSuggestLoading(true);
    try {
      const suggestion = await generateDetailSuggestions(topic, style, language);
      if (suggestion) {
        setDetails(prev => {
          const cleanPrev = prev.trim();
          return cleanPrev ? `${cleanPrev}, ${suggestion}` : suggestion;
        });
      }
    } catch (error) {
      console.error("Failed to suggest", error);
    } finally {
      setSuggestLoading(false);
    }
  };
  
  // NEW: Auto Design Handler
  const handleAutoDesign = async () => {
    if (!topic.trim()) return;
    setAutoDesignLoading(true);
    try {
      const design = await generateCinematicDesign(topic, style, language);
      if (design.details) setDetails(design.details);
      if (design.motion && design.motion.length > 0) setMotion(design.motion);
    } catch (error) {
       console.error("Auto design failed", error);
    } finally {
       setAutoDesignLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark text-slate-200 font-sans selection:bg-primary/30">
      <Header 
        language={language} 
        onToggleLanguage={handleLanguageSwitch} 
        isTranslating={isTranslating}
      />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Input Form */}
        <section className="lg:col-span-5 space-y-6">
          <div className="bg-surface border border-white/5 rounded-2xl p-6 md:p-8 shadow-2xl sticky top-24">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-8 w-1 bg-primary rounded-full"></div>
              <h2 className="text-xl font-bold text-white">{t.title}</h2>
            </div>
            
            <form onSubmit={handleGenerate} className="space-y-6">
              
              {/* Topic Input */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <AlignLeft className="w-4 h-4 text-primary" />
                  {t.conceptLabel}
                </label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={t.conceptPlaceholder}
                  className="w-full bg-dark/50 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary/50 focus:border-transparent outline-none transition-all resize-none h-32"
                  required
                  disabled={isTranslating}
                />
              </div>

              {/* Selectors Grid 1: Style & Ratio */}
              <div className="grid grid-cols-2 gap-4">
                {/* Style */}
                <div className="space-y-2">
                   <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <Film className="w-4 h-4 text-secondary" />
                    {t.styleLabel}
                  </label>
                  <div className="relative">
                    <select 
                      value={style}
                      onChange={(e) => setStyle(e.target.value as VideoStyle)}
                      className="w-full appearance-none bg-dark/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-secondary/50 outline-none"
                      disabled={isTranslating}
                    >
                      {Object.values(VideoStyle).map((s) => (
                        <option key={s} value={s}>{STYLE_LABELS[s][language]}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                      ▼
                    </div>
                  </div>
                </div>

                {/* Aspect Ratio */}
                <div className="space-y-2">
                   <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <Maximize className="w-4 h-4 text-blue-400" />
                    {t.ratioLabel}
                  </label>
                   <div className="relative">
                    <select 
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value as VideoAspectRatio)}
                      className="w-full appearance-none bg-dark/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                      disabled={isTranslating}
                    >
                      {Object.values(VideoAspectRatio).map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                      ▼
                    </div>
                  </div>
                </div>
              </div>

              {/* Selectors Grid 2: Duration Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <Timer className="w-4 h-4 text-orange-400" />
                    {t.totalDurationLabel}
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={totalDuration}
                    onChange={(e) => setTotalDuration(e.target.value)}
                    placeholder={t.durationPlaceholder}
                    required
                    disabled={isTranslating}
                    className="w-full bg-dark/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500/50 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <Scissors className="w-4 h-4 text-pink-400" />
                    {t.cutDurationLabel}
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={cutDuration}
                    onChange={(e) => setCutDuration(e.target.value)}
                    placeholder={t.cutPlaceholder}
                    required
                    disabled={isTranslating}
                    className="w-full bg-dark/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-pink-500/50 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
              
              {/* NEW: AI Auto Design Button */}
              <button
                type="button"
                onClick={handleAutoDesign}
                disabled={!topic.trim() || autoDesignLoading || isTranslating}
                className={`w-full py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all border border-dashed ${
                   !topic.trim() ? 'border-gray-600 text-gray-600 bg-transparent cursor-not-allowed' :
                   autoDesignLoading ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 cursor-wait' :
                   'border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500 hover:text-emerald-300'
                }`}
              >
                {autoDesignLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clapperboard className="w-4 h-4" />}
                {autoDesignLoading ? t.autoDesigning : t.autoDesignBtn}
              </button>

              {/* Camera Motion (Grouped by Category) */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <Camera className="w-4 h-4 text-emerald-400" />
                  {t.motionLabel}
                </label>
                <div className="bg-dark/30 border border-white/10 rounded-xl p-2 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                   {Object.entries(MOTION_CATEGORIES).map(([category, motions]) => (
                      <div key={category} className="mb-4 last:mb-0">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-1 tracking-wider">{category}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {motions.map((m) => {
                            const isSelected = motion.includes(m);
                            return (
                              <button
                                key={m}
                                type="button"
                                onClick={() => toggleMotion(m)}
                                disabled={isTranslating}
                                className={`text-xs py-2 px-2 rounded-lg border transition-all text-left truncate relative ${
                                  isSelected 
                                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-medium ring-1 ring-emerald-500/50' 
                                    : 'bg-dark/50 border-white/5 text-gray-400 hover:bg-dark/80 hover:text-gray-200'
                                }`}
                                title={MOTION_LABELS[m][language]}
                              >
                                {MOTION_LABELS[m][language]}
                                {isSelected && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                   ))}
                </div>
              </div>

              {/* Additional Details with AI Suggestion */}
               <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <Wand2 className="w-4 h-4 text-purple-400" />
                    {t.detailsLabel}
                  </label>
                </div>
                
                <div className="relative">
                  <input
                    type="text"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder={t.detailsPlaceholder}
                    disabled={isTranslating}
                    className="w-full bg-dark/50 border border-white/10 rounded-xl pl-4 pr-28 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent outline-none transition-all"
                  />
                   <button
                    type="button"
                    onClick={handleSuggestDetails}
                    disabled={!topic.trim() || suggestLoading || isTranslating}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      !topic.trim() || isTranslating
                        ? 'bg-white/5 text-gray-500 border-white/5 cursor-not-allowed'
                        : suggestLoading
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/30 cursor-wait'
                          : 'bg-purple-500/20 text-purple-300 border-purple-500/50 hover:bg-purple-500/30 hover:text-white'
                    }`}
                  >
                    {suggestLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    {suggestLoading ? t.suggesting : t.suggestBtn}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading.isLoading || !topic.trim() || isTranslating}
                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all transform active:scale-95 ${
                  loading.isLoading || !topic.trim() || isTranslating
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary via-secondary to-purple-600 text-white hover:shadow-primary/25 hover:brightness-110'
                }`}
              >
                {loading.isLoading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    {loading.message}
                  </>
                ) : (
                  <>
                    <Video className="w-5 h-5" />
                    {t.generateBtn}
                  </>
                )}
              </button>
              {error && (
                <p className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded border border-red-900/50">{error}</p>
              )}
            </form>
          </div>
        </section>

        {/* Right Column: Results */}
        <section className="lg:col-span-7 space-y-6">
           <div className="flex items-center justify-between mb-2">
             <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-gray-400" />
                <h2 className="text-xl font-bold text-white">{t.historyTitle}</h2>
             </div>
             <div className="flex items-center gap-3">
               <span className="text-sm text-gray-500">{results.length} {t.resultsCount}</span>
             </div>
           </div>

          {results.length === 0 ? (
            <div className="h-[500px] flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl bg-white/5 p-8 text-center">
               <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mb-6">
                  <Video className="w-10 h-10 text-gray-500" />
               </div>
               <h3 className="text-xl font-bold text-white mb-2">{t.emptyTitle}</h3>
               <p className="text-gray-400 max-w-md">
                 {t.emptyDesc}
               </p>
            </div>
          ) : (
            <div className="space-y-6">
              {results.map((result) => (
                <ResultCard 
                  key={result.id} 
                  result={result} 
                  onDelete={handleDelete}
                  onRegenerate={handleRegenerate}
                  language={language}
                />
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
};

export default App;
