import { useEffect } from 'react';
import { Audio } from 'expo-av';

export function useAudioSession() {
  useEffect(() => {
    async function setupAudio() {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        
        console.log('Audio session configured for background playback with media controls');
      } catch (error) {
        console.log('Error setting up audio mode:', error);
      }
    }
    
    setupAudio();
  }, []);
}
