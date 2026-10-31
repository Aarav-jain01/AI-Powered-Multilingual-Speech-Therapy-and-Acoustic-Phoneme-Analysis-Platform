export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en_IN', name: 'English (India)', nativeName: 'English' },
  { code: 'en_US', name: 'English (US)', nativeName: 'English' },
  { code: 'hi_IN', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ta_IN', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'bn_IN', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'es_ES', name: 'Spanish', nativeName: 'Español' },
];
