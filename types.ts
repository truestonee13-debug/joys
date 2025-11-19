
export enum VideoAspectRatio {
  Wide_16_9 = "16:9",
  Portrait_9_16 = "9:16",
  Square_1_1 = "1:1",
  Cinema_21_9 = "21:9",
  Classic_4_3 = "4:3",
  IMAX_1_43_1 = "1.43:1",
  Ultrawide_32_9 = "32:9"
}

export enum VideoStyle {
  // Cinematic & Film
  Cinematic = "Cinematic",
  Photorealistic = "Photorealistic",
  Vintage_Film = "Vintage Film",
  Noir = "Film Noir",
  Documentary = "Documentary",
  WesAnderson = "Wes Anderson Style",
  Tarantino = "Tarantino Style",
  Blockbuster = "Hollywood Blockbuster",
  IndieFilm = "Indie Film",
  SilentMovie = "Silent Movie",
  VHS = "VHS Tape",

  // Animation & Art
  Anime = "Anime",
  Ghibli = "Studio Ghibli Style",
  DisneyPixar = "Disney/Pixar Style",
  ThreeD_Animation = "3D Animation",
  Claymation = "Claymation (Stop Motion)",
  Cyberpunk = "Cyberpunk",
  Steampunk = "Steampunk",
  Fantasy = "Fantasy",
  SciFi = "Sci-Fi",
  OilPainting = "Oil Painting",
  Watercolor = "Watercolor",
  Sketch = "Pencil Sketch",
  PixelArt = "Pixel Art",
  ComicBook = "Comic Book / Graphic Novel",
  LowPoly = "Low Poly 3D",
  UkiyoE = "Ukiyo-e",
  
  // Modern & Abstract
  Glitch = "Glitch Art",
  Vaporwave = "Vaporwave",
  Surrealism = "Surrealism",
  Abstract = "Abstract",
  Minimalist = "Minimalist",
  GoPro = "GoPro Action",
  CCTV = "CCTV Footage",
  UnrealEngine = "Unreal Engine 5",
  Isometric = "Isometric 3D",
  Macro = "Macro Photography"
}

export enum CameraMotion {
  // Basic
  Static = "Static",
  Pan = "Pan",
  Tilt = "Tilt",
  ZoomIn = "Zoom In",
  ZoomOut = "Zoom Out",
  
  // Advanced Cinematic
  DollyZoom = "Dolly Zoom",
  TrackingShot = "Tracking Shot",
  Truck = "Truck (Left/Right)",
  Pedestal = "Pedestal (Up/Down)",
  Crane = "Crane / Jib Shot",
  Orbit = "Orbit / Arc",
  DutchAngle = "Dutch Angle",
  WhipPan = "Whip Pan",
  CrashZoom = "Crash Zoom",
  Roll = "Camera Roll",
  
  // Dynamic / Action
  Handheld = "Handheld",
  ShakeyCam = "Shakey Cam (Chaos)",
  DroneFlyover = "Drone Flyover",
  FPV = "FPV Speed Drone",
  BulletTime = "Bullet Time",
  FollowShot = "Follow Shot (Behind)",
  POV = "First Person View (POV)",
  
  // Time
  SlowMotion = "Slow Motion",
  TimeLapse = "Time-Lapse",
  HyperLapse = "Hyper-Lapse",
  Reverse = "Reverse Motion"
}

export interface PromptRequest {
  topic: string;
  style: VideoStyle;
  aspectRatio: VideoAspectRatio;
  motion: CameraMotion;
  totalDuration: string;
  cutDuration: string;
  details?: string;
}

export interface Character {
  name: string;
  description: string;
}

export interface Shot {
  id: string;
  index: number;
  visualPrompt: string;
  technicalPrompt: string;
  duration: string;
  characters: Character[];
  dialogue: string;
  bgm: string; // Background Music recommendation
  sfx: string; // Sound Effects recommendation
}

export interface GeneratedPrompt {
  id: string;
  title: string;
  visualPrompt: string;
  technicalPrompt: string; // Camera settings, lighting, render engine
  negativePrompt?: string;
  narration: string; // Voiceover script with emotion tags
  shots: Shot[]; // Array of individual cuts
  timestamp: number;
  originalRequest: PromptRequest;
}

export interface LoadingState {
  isLoading: boolean;
  message: string;
}

export type Language = 'en' | 'ko';
