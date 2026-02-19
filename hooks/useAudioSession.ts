import { useEffect } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

/**
 * Configures the audio session for background playback and handles audio
 * interruptions gracefully (phone calls, other apps taking focus, etc.).
 *
 * Key fix: On Android, DUCK_OTHERS lets music lower volume during calls
 * instead of crashing. DO_NOT_MIX (the old default) throws an error when
 * the phone call already holds audio focus.
 */
export function useAudioSession() {
  useEffect(() => {
    let isMounted = true;

    async function setupAudio() {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          // iOS: pause music when a call comes in, resume after
          interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
          // Android: duck (lower) volume during calls instead of failing
          shouldDuckAndroid: true,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        // Non-fatal: some environments don't support all options
        console.log('[AudioSession] setup warning:', error);
      }
    }

    setupAudio();

    // Re-apply audio session when the app comes back to foreground
    // (after a phone call ends the session may have been deactivated)
    const handleAppStateChange = async (nextState: AppStateStatus) => {
      if (!isMounted) return;
      if (nextState === 'active') {
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            staysActiveInBackground: true,
            playsInSilentModeIOS: true,
            interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
            shouldDuckAndroid: true,
            interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
            playThroughEarpieceAndroid: false,
          });
        } catch (_) { }
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      isMounted = false;
      sub.remove();
    };
  }, []);
}
