
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ResultCard } from './components/ResultCard';
import { 
  generateVideoPrompt, 
  generateDetailSuggestions, 
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
  Film
} from 'lucide-react';

// --- Translation Dictionaries ---

const TRANSLATIONS = {
  en: {
    title: "Scene Configuration",
    conceptLabel: "Core Concept / Subject",
    conceptPlaceholder: "e.g., A cyberpunk detective walking in rain, neon lights reflect on puddles...",
    styleLabel: "Visual Style",
    ratioLabel: "Aspect Ratio",
    motionLabel: "Camera Movement",
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
  },
  ko: {
    title: "장면 설정",
    conceptLabel: "핵심 컨셉 / 주제",
    conceptPlaceholder: "예: 빗속을 걷는 사이버펑크 형사, 웅덩이에 반사되는 네온 사인...",
    styleLabel: "비주얼 스타일",
    ratioLabel: "화면 비율",
    motionLabel: "카메라 무빙",
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
  // Basic
  [CameraMotion.Static]: { en: "Static", ko: "고정 (Static)" },
  [CameraMotion.Pan]: { en: "Pan", ko: "팬 (좌우 회전)" },
  [CameraMotion.Tilt]: { en: "Tilt", ko: "틸트 (상하 회전)" },
  [CameraMotion.ZoomIn]: { en: "Zoom In", ko: "줌 인" },
  [CameraMotion.ZoomOut]: { en: "Zoom Out", ko: "줌 아웃" },
  
  // Advanced
  [CameraMotion.DollyZoom]: { en: "Dolly Zoom", ko: "돌리 줌 (현기증 효과)" },
  [CameraMotion.TrackingShot]: { en: "Tracking Shot", ko: "트래킹 (피사체 추적)" },
  [CameraMotion.Truck]: { en: "Truck", ko: "트럭 (카메라 전체 좌우이동)" },
  [CameraMotion.Pedestal]: { en: "Pedestal", ko: "페데스탈 (카메라 전체 상하이동)" },
  [CameraMotion.Crane]: { en: "Crane / Jib", ko: "크레인 / 지브 샷" },
  [CameraMotion.Orbit]: { en: "Orbit / Arc", ko: "오빗 / 아크 (빙글 돌기)" },
  [CameraMotion.DutchAngle]: { en: "Dutch Angle", ko: "더치 앵글 (기울이기)" },
  [CameraMotion.WhipPan]: { en: "Whip Pan", ko: "휩 팬 (빠른 전환)" },
  [CameraMotion.CrashZoom]: { en: "Crash Zoom", ko: "크래시 줌 (급격한 줌)" },
  [CameraMotion.Roll]: { en: "Camera Roll", ko: "롤 (카메라 회전)" },
  
  // Dynamic
  [CameraMotion.Handheld]: { en: "Handheld", ko: "핸드헬드 (들고 찍기)" },
  [CameraMotion.ShakeyCam]: { en: "Shakey Cam", ko: "쉐이키 캠 (흔들림/혼란)" },
  [CameraMotion.DroneFlyover]: { en: "Drone Flyover", ko: "드론 비행 (상공)" },
  [CameraMotion.FPV]: { en: "FPV Speed Drone", ko: "FPV 드론 (1인칭 고속)" },
  [CameraMotion.BulletTime]: { en: "Bullet Time", ko: "불릿 타임 (매트릭스)" },
  [CameraMotion.FollowShot]: { en: "Follow Shot", ko: "팔로우 샷 (뒤따라가기)" },
  [CameraMotion.POV]: { en: "POV", ko: "1인칭 시점 (눈으로 보는 듯)" },
  
  // Time
  [CameraMotion.SlowMotion]: { en: "Slow Motion", ko: "슬로우 모션" },
  [CameraMotion.TimeLapse]: { en: "Time-Lapse", ko: "타임랩스 (빠른 시간)" },
  [CameraMotion.HyperLapse]: { en: "Hyper-Lapse", ko: "하이퍼랩스 (이동 타임랩스)" },
  [CameraMotion.Reverse]: { en: "Reverse", ko: "리버스 (역재생)" }
};

const App: React.FC = () => {
  // App State - Default to Korean ('ko') unless saved preference exists
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
  const [motion, setMotion] = useState<CameraMotion>(CameraMotion.DroneFlyover);
  
  // Initialized to empty string as per request
  const [totalDuration, setTotalDuration] = useState('');
  const [cutDuration, setCutDuration] = useState('');
  
  const [details, setDetails] = useState('');
  const [suggestLoading, setSuggestLoading] = useState(false);

  // Result State with LocalStorage Persistence and Migration Logic
  const [loading, setLoading] = useState<LoadingState>({ isLoading: false, message: '' });
  const [results, setResults] = useState<GeneratedPrompt[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('veoSparkHistory');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            // Robust Migration & Validation: Ensure items have critical fields
            return parsed.filter(item => item && item.id && item.originalRequest).map((item: any) => ({
              ...item,
              shots: Array.isArray(item.shots) ? item.shots : [], // Ensure shots is array
              narration: item.narration || "",
              bgm: item.bgm || "",
              sfx: item.sfx || ""
            }));
          }
        }
      } catch (e) {
        console.error('Failed to load history, corrupted data found.', e);
      }
    }
    return [];
  });
  const [error, setError] = useState<string | null>(null);

  // Persist results whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('veoSparkHistory', JSON.stringify(results));
    } catch (e) {
      console.error("Failed to save history", e);
    }
  }, [results]);

  // Persist language preference
  useEffect(() => {
    try {
      localStorage.setItem('veoSparkLanguage', language);
    } catch (e) {
      console.error("Failed to save language", e);
    }
  }, [language]);

  const t = TRANSLATIONS[language];

  const handleLanguageSwitch = async () => {
    const targetLang = language === 'en' ? 'ko' : 'en';
    setIsTranslating(true);

    try {
      // Translate inputs and existing results in parallel
      const [
        translatedTopic, 
        translatedDetails, 
        translatedResults
      ] = await Promise.all([
        translateText(topic, targetLang),
        translateText(details, targetLang),
        Promise.all(results.map(r => translatePromptResult(r, targetLang)))
      ]);

      setTopic(translatedTopic);
      setDetails(translatedDetails);
      setResults(translatedResults); 
      setLanguage(targetLang);
    } catch (e) {
      console.error("Translation failed", e);
      setLanguage(targetLang); // Switch UI even if API fails
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
       // Call service
       const result = await generateVideoPrompt(request, language);
       // Safety check for result integrity
       if (result && result.id && result.shots) {
         setResults(prev => [result, ...prev]);
       } else {
         throw new Error("Invalid response format");
       }
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
      setMotion(req.motion);
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

              {/* Camera Motion */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <Camera className="w-4 h-4 text-emerald-400" />
                  {t.motionLabel}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {Object.values(CameraMotion).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMotion(m)}
                      disabled={isTranslating}
                      className={`text-xs py-2 px-1 rounded-lg border transition-all ${
                        motion === m 
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
                          : 'bg-dark/30 border-white/5 text-gray-400 hover:bg-dark/50'
                      }`}
                    >
                      {MOTION_LABELS[m][language]}
                    </button>
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
