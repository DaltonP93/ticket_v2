import type { AudioProfile } from "@ticket-v2/contracts";

function resolveLanguage(locale: AudioProfile["locale"]) {
  if (locale === "en") {
    return "en-US";
  }

  if (locale === "pt") {
    return "pt-BR";
  }

  return "es-ES";
}

export function speakAnnouncement(text: string, profile: AudioProfile) {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !profile.enabled) {
    return;
  }

  const synth = window.speechSynthesis;
  synth.cancel();

  const lang = resolveLanguage(profile.locale);
  const voices = synth.getVoices();
  const matchingVoice = voices.find((voice) => {
    if (profile.voiceName && voice.name.includes(profile.voiceName)) {
      return true;
    }

    return voice.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase());
  });

  for (let index = 0; index < profile.repeat; index += 1) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.volume = profile.volume;
    utterance.rate = profile.rate;
    utterance.pitch = profile.pitch;

    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    synth.speak(utterance);
  }
}
