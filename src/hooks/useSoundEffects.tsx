import { useCallback, useRef } from 'react';

// Sound URLs (using free sound effects)
const SOUNDS = {
  correct: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
  incorrect: 'https://assets.mixkit.co/active_storage/sfx/2001/2001-preview.mp3',
  combo: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  levelUp: 'https://assets.mixkit.co/active_storage/sfx/1997/1997-preview.mp3',
  gameOver: 'https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3',
  click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  countdown: 'https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3',
  victory: 'https://assets.mixkit.co/active_storage/sfx/1996/1996-preview.mp3',
};

export function useSoundEffects() {
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const soundEnabled = useRef(true);

  const playSound = useCallback((soundName: keyof typeof SOUNDS) => {
    if (!soundEnabled.current) return;

    try {
      if (!audioRefs.current[soundName]) {
        audioRefs.current[soundName] = new Audio(SOUNDS[soundName]);
        audioRefs.current[soundName].volume = 0.5;
      }
      
      const audio = audioRefs.current[soundName];
      audio.currentTime = 0;
      audio.play().catch(console.error);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, []);

  const toggleSound = useCallback(() => {
    soundEnabled.current = !soundEnabled.current;
    return soundEnabled.current;
  }, []);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    soundEnabled.current = enabled;
  }, []);

  return {
    playCorrect: () => playSound('correct'),
    playIncorrect: () => playSound('incorrect'),
    playCombo: () => playSound('combo'),
    playLevelUp: () => playSound('levelUp'),
    playGameOver: () => playSound('gameOver'),
    playClick: () => playSound('click'),
    playCountdown: () => playSound('countdown'),
    playVictory: () => playSound('victory'),
    toggleSound,
    setSoundEnabled,
    isSoundEnabled: () => soundEnabled.current,
  };
}
