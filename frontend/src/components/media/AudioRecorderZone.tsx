import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, UploadCloud, Volume2, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AudioRecorderZoneProps {
  mediaUrls: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  helperText?: string;
}

export const AudioRecorderZone: React.FC<AudioRecorderZoneProps> = ({
  mediaUrls,
  onChange,
  label = 'Voice Report / Audio Evidence (Optional)',
  helperText = 'Record a voice description directly from your microphone or upload audio (.mp3, .wav, .m4a, .ogg, .webm).'
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
    };
  }, []);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    setMicError(null);
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            const dataUrl = e.target.result as string;
            onChange([...mediaUrls, dataUrl]);
          }
        };
        reader.readAsDataURL(audioBlob);

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access denied or error:', err);
      setMicError('Could not access microphone. Please check your browser permissions or upload an audio file below.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const dataUrl = e.target.result as string;
        onChange([...mediaUrls, dataUrl]);
      }
    };
    reader.readAsDataURL(file);
  };

  const togglePlayAudio = (url: string) => {
    if (previewAudioRef.current && previewAudioRef.current.src === url) {
      if (isPlayingPreview) {
        previewAudioRef.current.pause();
        setIsPlayingPreview(false);
      } else {
        previewAudioRef.current.play();
        setIsPlayingPreview(true);
      }
    } else {
      if (previewAudioRef.current) previewAudioRef.current.pause();
      const audio = new Audio(url);
      previewAudioRef.current = audio;
      audio.onended = () => setIsPlayingPreview(false);
      audio.play();
      setIsPlayingPreview(true);
    }
  };

  const isAudioUrl = (url: string) => {
    return (
      url.startsWith('data:audio') ||
      url.endsWith('.mp3') ||
      url.endsWith('.wav') ||
      url.endsWith('.ogg') ||
      url.endsWith('.m4a') ||
      url.endsWith('.webm')
    );
  };

  const audioAttachments = mediaUrls.filter(isAudioUrl);

  const removeAudioAttachment = (indexToRemove: number) => {
    const remaining = mediaUrls.filter((_, idx) => idx !== indexToRemove);
    onChange(remaining);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <Volume2 size={15} color="var(--color-primary)" />
        {label}
      </label>

      {micError && (
        <div style={{ fontSize: '0.78rem', color: 'var(--status-error-text)', background: 'var(--status-error-bg)', padding: '0.45rem 0.75rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--status-error-border)' }}>
          {micError}
        </div>
      )}

      {/* Recorder Card */}
      <div className={`audio-zone-container ${isRecording ? 'recording' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {isRecording ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="audio-pulse-indicator" />
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                  REC {formatTime(recordingDuration)}
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                <Radio size={16} color="var(--color-primary)" />
                <span>Record Voice Description</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isRecording ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                className="btn btn-primary btn-sm"
                onClick={stopRecording}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#C84B31' }}
              >
                <Square size={13} /> Stop & Attach Audio
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={startRecording}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Mic size={13} color="var(--color-primary)" /> Record with Mic
              </motion.button>
            )}

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => fileInputRef.current?.click()}
              style={{ fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <UploadCloud size={13} /> Upload Audio File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.ogg,.m4a,.webm"
              style={{ display: 'none' }}
              onChange={(e) => handleFileUpload(e.target.files)}
            />
          </div>

        </div>

        <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
          {helperText}
        </div>
      </div>

      {/* Audio Attachments List */}
      <AnimatePresence>
        {audioAttachments.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.25rem' }}>
            {mediaUrls.map((url, idx) => {
              if (!isAudioUrl(url)) return null;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="audio-player-card"
                >
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => togglePlayAudio(url)}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'var(--color-primary-subtle)',
                      color: 'var(--color-primary)',
                      border: '1px solid var(--border-orange)'
                    }}
                  >
                    {isPlayingPreview ? <Pause size={13} /> : <Play size={13} style={{ marginLeft: 2 }} />}
                  </button>

                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: 18 }}>
                      <div className="waveform-bar" style={{ animationDelay: '0s' }} />
                      <div className="waveform-bar" style={{ animationDelay: '0.2s' }} />
                      <div className="waveform-bar" style={{ animationDelay: '0.4s' }} />
                      <div className="waveform-bar" style={{ animationDelay: '0.1s' }} />
                      <div className="waveform-bar" style={{ animationDelay: '0.3s' }} />
                      <div className="waveform-bar" style={{ animationDelay: '0.5s' }} />
                    </div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      Audio Note #{idx + 1} Attached
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeAudioAttachment(idx)}
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--status-error-text)', padding: '0.2rem 0.4rem' }}
                    title="Remove audio attachment"
                  >
                    <Trash2 size={13} />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
