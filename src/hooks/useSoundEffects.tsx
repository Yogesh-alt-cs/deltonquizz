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
  tick: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  readyUp: 'https://assets.mixkit.co/active_storage/sfx/2005/2005-preview.mp3',
  timeout: 'https://assets.mixkit.co/active_storage/sfx/2028/2028-preview.mp3',
  go: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  streakUp: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
  whoosh: 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3',
};

// Background music (looping ambient quiz music)
const MUSIC = {
  quiz: 'https://assets.mixkit.co/active_storage/sfx/2515/2515-preview.mp3',
};

export function useSoundEffects() {
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const timeoutRefs = useRef<{ [key: string]: ReturnType<typeof setTimeout> }>({});
  const soundEnabled = useRef(true);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const musicEnabled = useRef(false);

  const playSound = useCallback((soundName: keyof typeof SOUNDS, maxDuration?: number) => {
    if (!soundEnabled.current) return;

    try {
      if (timeoutRefs.current[soundName]) {
        clearTimeout(timeoutRefs.current[soundName]);
      }

      if (!audioRefs.current[soundName]) {
        audioRefs.current[soundName] = new Audio(SOUNDS[soundName]);
        audioRefs.current[soundName].volume = 0.5;
      }
      
      const audio = audioRefs.current[soundName];
      audio.currentTime = 0;
      audio.play().catch(console.error);

      if (maxDuration) {
        timeoutRefs.current[soundName] = setTimeout(() => {
          audio.pause();
          audio.currentTime = 0;
        }, maxDuration * 1000);
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, []);

  const startMusic = useCallback(() => {
    if (!soundEnabled.current) return;
    try {
      if (!musicRef.current) {
        musicRef.current = new Audio(MUSIC.quiz);
        musicRef.current.loop = true;
        musicRef.current.volume = 0.15;
      }
      musicRef.current.play().catch(() => {});
      musicEnabled.current = true;
    } catch {}
  }, []);

  const stopMusic = useCallback(() => {
    if (musicRef.current) {
      musicRef.current.pause();
      musicRef.current.currentTime = 0;
    }
    musicEnabled.current = false;
  }, []);

  const toggleSound = useCallback(() => {
    soundEnabled.current = !soundEnabled.current;
    if (!soundEnabled.current) stopMusic();
    return soundEnabled.current;
  }, [stopMusic]);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    soundEnabled.current = enabled;
    if (!enabled) stopMusic();
  }, [stopMusic]);

  return {
    playCorrect: () => playSound('correct'),
    playIncorrect: () => playSound('incorrect'),
    playCombo: () => playSound('combo'),
    playLevelUp: () => playSound('levelUp'),
    playGameOver: () => playSound('gameOver', 3),
    playClick: () => playSound('click'),
    playCountdown: () => playSound('countdown'),
    playVictory: () => playSound('victory', 3),
    playTick: () => playSound('tick', 1),
    playReadyUp: () => playSound('readyUp', 2),
    playTimeout: () => playSound('timeout', 3),
    playGo: () => playSound('go', 2),
    playStreakUp: () => playSound('streakUp', 2),
    playWhoosh: () => playSound('whoosh', 1),
    startMusic,
    stopMusic,
    toggleSound,
    setSoundEnabled,
    isSoundEnabled: () => soundEnabled.current,
  };
}
