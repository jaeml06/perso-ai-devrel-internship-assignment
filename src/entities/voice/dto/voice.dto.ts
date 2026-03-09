export type VoiceGender = 'male' | 'female';
export type VoiceAgeGroup = 'young' | 'middle';

export interface Voice {
  id: string;
  name: string;
  gender: VoiceGender;
  ageGroup: VoiceAgeGroup;
  previewUrl: string;
  description: string;
}

export interface VoiceListResponse {
  voices: Voice[];
}
