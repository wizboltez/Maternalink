import { Platform } from 'react-native';

export type LanguageCode = 'en' | 'es' | 'fr';

const SPEECH_STRINGS: Record<LanguageCode, Record<string, string>> = {
  en: {
    calibration_started: 'Calibration started. Please sit or lie comfortably and remain still.',
    please_remain_still: 'Please remain still. We are analyzing baseline readings.',
    calibration_completed: 'Calibration completed successfully. Ready to start monitoring.',
    calibration_failed: 'Calibration failed. Please adjust the belt positioning and try again.',
    monitoring_started: 'Monitoring started. Live readings are active.',
    contraction_detected: 'Contraction detected. Please confirm your contraction.',
    please_confirm_contraction: 'Please confirm if you are experiencing a contraction.',
    recording_in_progress: 'Recording in progress.',
    contraction_ended: 'Contraction ended. Resuming normal baseline monitoring.',
    monitoring_resumed: 'Monitoring resumed.',
    monitoring_completed: 'Monitoring completed. Saving session details.',
  },
  es: {
    calibration_started: 'Calibración iniciada. Por favor, siéntese o acuéstese cómodamente y quédese quieta.',
    please_remain_still: 'Por favor, quédese quieta. Estamos analizando las lecturas iniciales.',
    calibration_completed: 'Calibración completada con éxito. Listo para iniciar monitoreo.',
    calibration_failed: 'Calibración fallida. Por favor, ajuste el cinturón e intente de nuevo.',
    monitoring_started: 'Monitoreo iniciado. Lecturas en vivo activas.',
    contraction_detected: 'Contracción detectada. Por favor, confirme su contracción.',
    please_confirm_contraction: 'Por favor confirme si está experimentando una contracción.',
    recording_in_progress: 'Grabación en progreso.',
    contraction_ended: 'Contracción terminada. Reanudando monitoreo normal.',
    monitoring_resumed: 'Monitoreo reanudado.',
    monitoring_completed: 'Monitoreo completado. Guardando detalles de la sesión.',
  },
  fr: {
    calibration_started: 'Calibration commencée. Veuillez vous asseoir ou vous allonger confortablement et rester immobile.',
    please_remain_still: 'Veuillez rester immobile. Nous analysons les lectures de base.',
    calibration_completed: 'Calibration réussie. Prêt à démarrer la surveillance.',
    calibration_failed: 'Échec de la calibration. Veuillez ajuster la ceinture et réessayer.',
    monitoring_started: 'Surveillance démarrée. Les lectures en direct sont actives.',
    contraction_detected: 'Contraction détectée. Veuillez confirmer votre contraction.',
    please_confirm_contraction: 'Veuillez confirmer si vous ressentez une contraction.',
    recording_in_progress: 'Enregistrement en cours.',
    contraction_ended: 'Contraction terminée. Reprise de la surveillance de base.',
    monitoring_resumed: 'Surveillance reprise.',
    monitoring_completed: 'Surveillance terminée. Enregistrement des détails de la session.',
  }
};

export class VoiceSpeechEngine {
  private static instance: VoiceSpeechEngine;
  private isMuted = false;
  private volume = 1.0; // scale of 0 to 1
  private currentLanguage: LanguageCode = 'en';

  private constructor() {}

  public static getInstance(): VoiceSpeechEngine {
    if (!VoiceSpeechEngine.instance) {
      VoiceSpeechEngine.instance = new VoiceSpeechEngine();
    }
    return VoiceSpeechEngine.instance;
  }

  public setMute(mute: boolean) {
    this.isMuted = mute;
    console.log(`🔊 Voice Guidance Mute state set to: ${mute}`);
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1.0, vol));
    console.log(`🔊 Voice Guidance Volume set to: ${this.volume}`);
  }

  public setLanguage(lang: LanguageCode) {
    this.currentLanguage = lang;
    console.log(`🔊 Voice Guidance Language switched to: ${lang}`);
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

  /**
   * Speaks the localized string corresponding to a key
   */
  public speak(key: string) {
    if (this.isMuted) return;

    const message = SPEECH_STRINGS[this.currentLanguage][key] || key;
    console.log(`🗣️ Speaking audio cue (${this.currentLanguage}) [Volume: ${this.volume}]: "${message}"`);

    // In a real Expo or bare React Native project, we integrate standard Text-To-Speech:
    // import * as Speech from 'expo-speech';
    // Speech.speak(message, { volume: this.volume, language: this.currentLanguage });
    // Or in React Native bare:
    // Tts.speak(message);
    
    // We supply a cross-platform mock-fallback inside JS console as safety:
    if (Platform.OS === 'web') {
      const webWindow = globalThis as typeof globalThis & {
        speechSynthesis?: { speak: (u: unknown) => void };
        SpeechSynthesisUtterance?: new (text: string) => {
          volume: number;
          lang: string;
        };
      };
      if (webWindow.speechSynthesis && webWindow.SpeechSynthesisUtterance) {
        const utterance = new webWindow.SpeechSynthesisUtterance(message);
        utterance.volume = this.volume;
        utterance.lang = this.currentLanguage === 'en' ? 'en-US' : this.currentLanguage === 'es' ? 'es-ES' : 'fr-FR';
        webWindow.speechSynthesis.speak(utterance);
      }
    }
  }
}

export default VoiceSpeechEngine.getInstance();
