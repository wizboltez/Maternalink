import { Platform } from 'react-native';
import Tts from 'react-native-tts';

export type LanguageCode = 'en' | 'es' | 'fr';

const SPEECH_STRINGS: Record<LanguageCode, Record<string, string>> = {
  en: {
    calibration_started: 'Calibration started. Please sit or lie comfortably and remain still.',
    please_remain_still: 'Please remain still. We are recording baseline readings.',
    calibration_completed: 'Calibration completed successfully. You may start monitoring.',
    calibration_failed: 'Calibration failed. Please adjust the belt and try again.',
    monitoring_started: 'Monitoring started. Live readings are active.',
    contraction_detected: 'Contraction detected.',
    please_confirm_contraction: 'Contraction recorded. Please confirm if needed.',
    high_intensity: 'High intensity detected. Please remain calm and breathe steadily.',
    recording_in_progress: 'Manual recording in progress.',
    contraction_ended: 'Contraction ended. Returning to baseline monitoring.',
    monitoring_resumed: 'Monitoring resumed.',
    monitoring_completed: 'Monitoring completed. Saving your session.',
  },
  es: {
    calibration_started: 'Calibración iniciada. Siéntese o acuéstese cómodamente y quédese quieta.',
    please_remain_still: 'Quédese quieta. Estamos registrando lecturas base.',
    calibration_completed: 'Calibración completada. Puede iniciar el monitoreo.',
    calibration_failed: 'Calibración fallida. Ajuste el cinturón e intente de nuevo.',
    monitoring_started: 'Monitoreo iniciado. Lecturas en vivo activas.',
    contraction_detected: 'Contracción detectada.',
    please_confirm_contraction: 'Contracción registrada. Confirme si es necesario.',
    high_intensity: 'Alta intensidad detectada. Mantenga la calma y respire.',
    recording_in_progress: 'Grabación manual en progreso.',
    contraction_ended: 'Contracción terminada. Volviendo al monitoreo base.',
    monitoring_resumed: 'Monitoreo reanudado.',
    monitoring_completed: 'Monitoreo completado. Guardando su sesión.',
  },
  fr: {
    calibration_started: 'Calibration commencée. Asseyez-vous ou allongez-vous confortablement.',
    please_remain_still: 'Restez immobile. Enregistrement des lectures de base.',
    calibration_completed: 'Calibration réussie. Vous pouvez démarrer la surveillance.',
    calibration_failed: 'Échec de calibration. Ajustez la ceinture et réessayez.',
    monitoring_started: 'Surveillance démarrée. Lectures en direct actives.',
    contraction_detected: 'Contraction détectée.',
    please_confirm_contraction: 'Contraction enregistrée. Confirmez si nécessaire.',
    high_intensity: 'Intensité élevée détectée. Restez calme et respirez.',
    recording_in_progress: 'Enregistrement manuel en cours.',
    contraction_ended: 'Contraction terminée. Retour à la surveillance de base.',
    monitoring_resumed: 'Surveillance reprise.',
    monitoring_completed: 'Surveillance terminée. Enregistrement de la session.',
  },
};

const LANG_MAP: Record<LanguageCode, string> = {
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
};

type WebSpeechWindow = typeof globalThis & {
  speechSynthesis?: { speak: (u: unknown) => void; cancel: () => void };
  SpeechSynthesisUtterance?: new (text: string) => { volume: number; lang: string };
};

function hasWebSpeech(): boolean {
  const webWindow = globalThis as WebSpeechWindow;
  return !!(webWindow.speechSynthesis && webWindow.SpeechSynthesisUtterance);
}

export class VoiceSpeechEngine {
  private static instance: VoiceSpeechEngine;
  private isMuted = false;
  private volume = 1.0;
  private currentLanguage: LanguageCode = 'en';
  private ttsReady = false;
  private speakQueue: string[] = [];
  private isSpeaking = false;

  private constructor() {
    this.initTts();
  }

  private async initTts() {
    if (hasWebSpeech()) {
      this.ttsReady = true;
      return;
    }
    if (Platform.OS === 'web') return;

    try {
      await Tts.getInitStatus();
      Tts.setDefaultRate(0.48);
      Tts.setDefaultPitch(1.0);
      Tts.addEventListener('tts-finish', () => {
        this.isSpeaking = false;
        this.processQueue();
      });
      Tts.addEventListener('tts-cancel', () => {
        this.isSpeaking = false;
        this.processQueue();
      });
      this.ttsReady = true;
      await Tts.setDefaultLanguage(LANG_MAP[this.currentLanguage]);
    } catch {
      this.ttsReady = false;
    }
  }

  public static getInstance(): VoiceSpeechEngine {
    if (!VoiceSpeechEngine.instance) {
      VoiceSpeechEngine.instance = new VoiceSpeechEngine();
    }
    return VoiceSpeechEngine.instance;
  }

  public setMute(mute: boolean) {
    this.isMuted = mute;
    if (mute) {
      try {
        if (hasWebSpeech()) {
          (globalThis as WebSpeechWindow).speechSynthesis?.cancel();
        } else {
          Tts.stop();
        }
      } catch {
        // native TTS may be unavailable
      }
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1.0, vol));
  }

  public async setLanguage(lang: LanguageCode) {
    this.currentLanguage = lang;
    if (this.ttsReady && !hasWebSpeech()) {
      try {
        await Tts.setDefaultLanguage(LANG_MAP[lang]);
      } catch {
        // language pack may be unavailable
      }
    }
  }

  public getMutedState(): boolean {
    return this.isMuted;
  }

  public getVolumeState(): number {
    return this.volume;
  }

  public getLanguageState(): LanguageCode {
    return this.currentLanguage;
  }

  private processQueue() {
    if (this.isSpeaking || this.speakQueue.length === 0 || this.isMuted) return;
    const next = this.speakQueue.shift();
    if (next) this.speakNow(next);
  }

  private speakNow(message: string) {
    if (hasWebSpeech()) {
      try {
        const webWindow = globalThis as WebSpeechWindow;
        webWindow.speechSynthesis!.cancel();
        const utterance = new webWindow.SpeechSynthesisUtterance!(message);
        utterance.volume = this.volume;
        utterance.lang = LANG_MAP[this.currentLanguage];
        webWindow.speechSynthesis!.speak(utterance);
      } catch {
        // Web Speech API unavailable at runtime
      }
      return;
    }

    if (!this.ttsReady) return;
    this.isSpeaking = true;
    try {
      Tts.stop();
      Tts.speak(message);
    } catch {
      this.isSpeaking = false;
    }
  }

  public speak(key: string) {
    if (this.isMuted) return;
    const message = SPEECH_STRINGS[this.currentLanguage][key] || key;
    this.speakQueue.push(message);
    this.processQueue();
  }
}

export default VoiceSpeechEngine.getInstance();
