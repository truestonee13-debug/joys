
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
  // 1. Basic Movement
  Static = "Static",
  Pan = "Pan",
  Tilt = "Tilt",
  ZoomIn = "Zoom In",
  ZoomOut = "Zoom Out",
  Pedestal = "Pedestal (Up/Down)",
  Truck = "Truck (Left/Right)",
  Roll = "Camera Roll",

  // 2. Framing & Angles (New)
  ExtremeCloseUp = "Extreme Close-Up",
  CloseUp = "Close-Up",
  MediumShot = "Medium Shot",
  WideShot = "Wide Shot",
  EstablishingShot = "Establishing Shot",
  LowAngle = "Low Angle",
  HighAngle = "High Angle",
  Overhead = "Overhead / God's Eye",
  WormsEye = "Worm's Eye View",
  EyeLevel = "Eye Level",
  DutchAngle = "Dutch Angle",

  // 3. Advanced & Dynamic
  DollyZoom = "Dolly Zoom",
  TrackingShot = "Tracking Shot",
  Crane = "Crane / Jib Shot",
  Orbit = "Orbit / Arc",
  Handheld = "Handheld",
  ShakeyCam = "Shakey Cam (Chaos)",
  DroneFlyover = "Drone Flyover",
  FPV = "FPV Speed Drone",
  FollowShot = "Follow Shot (Behind)",
  POV = "First Person View (POV)",
  Gimbal = "Gimbal Smooth",
  Steadicam = "Steadicam",
  WhipPan = "Whip Pan",
  CrashZoom = "Crash Zoom",

  // 4. Lens & Effects (New)
  RackFocus = "Rack Focus",
  DeepFocus = "Deep Focus",
  ShallowFocus = "Shallow Focus (Bokeh)",
  FishEye = "Fish Eye Lens",
  BulletTime = "Bullet Time",

  // 5. Time & Speed
  SlowMotion = "Slow Motion",
  TimeLapse = "Time-Lapse",
  HyperLapse = "Hyper-Lapse",
  Reverse = "Reverse Motion"
}

export interface PromptRequest {
  topic: string;
  style: VideoStyle;
  aspectRatio: VideoAspectRatio;
  motion: CameraMotion[]; // Updated to Array
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
  lipSync: string; // New field: Visual instruction for mouth movement
  bgm: string; // Background Music recommendation
  sfx: string; // Sound Effects recommendation
}

export interface ProductionNote {
  directorVision: string; // Overall direction style (e.g. Nolan-esque)
  cinematography: string; // Lighting, Lens choices, Color Palette
  artDirection: string; // Set design, props, textures
  soundDesign: string; // Audio atmosphere philosophy
  editingStyle: string; // Pacing and rhythm
}

export interface GeneratedPrompt {
  id: string;
  title: string;
  visualPrompt: string;
  technicalPrompt: string; // Camera settings, lighting, render engine
  negativePrompt?: string;
  narration: string; // Voiceover script with emotion tags
  characters: Character[]; // Global list of main characters
  productionNote: ProductionNote; // New field for expert analysis
  shots: Shot[]; // Array of individual cuts
  timestamp: number;
  originalRequest: PromptRequest;
}

export interface LoadingState {
  isLoading: boolean;
  message: string;
}

export type Language = 'en' | 'ko';
