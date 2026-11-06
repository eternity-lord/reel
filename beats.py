#!/usr/bin/env python3
"""Beat map for a reel.
Usage: python tools/beats.py ref_audio.wav > beats.json
Output: bpm, beat times, bar (downbeat) times, onsets, loudest moment ("drop"), duration. All in seconds.
Sanity-check bpm against the reference's scene-cut spacing (beat trackers sometimes return half/double tempo)."""
import sys, json
import numpy as np
import librosa

y, sr = librosa.load(sys.argv[1], sr=22050, mono=True)
hop = 512
oenv = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
tempo, beat_frames = librosa.beat.beat_track(onset_envelope=oenv, sr=sr, hop_length=hop)
beats = librosa.frames_to_time(beat_frames, sr=sr, hop_length=hop)
onsets = librosa.onset.onset_detect(onset_envelope=oenv, sr=sr, hop_length=hop, units="time")

# Downbeat phase guess: which beat index (mod 4) carries the most onset energy.
strength = oenv[beat_frames] if len(beat_frames) else np.array([])
phase = int(np.argmax([strength[i::4].sum() for i in range(4)])) if len(strength) >= 4 else 0
bars = beats[phase::4]

# Loudest 1-second window = likely drop / climax.
rms = librosa.feature.rms(y=y, hop_length=hop)[0]
t_rms = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=hop)
win = max(int(sr / hop), 1)
loudest = float(t_rms[int(np.argmax(np.convolve(rms, np.ones(win), "valid")))]) if len(rms) > win else 0.0

r3 = lambda a: [round(float(t), 3) for t in a]
print(json.dumps({
    "bpm": round(float(np.atleast_1d(tempo)[0]), 2),
    "beats": r3(beats), "bars": r3(bars), "onsets": r3(onsets),
    "loudest_at": round(loudest, 2), "duration": round(len(y) / sr, 2),
}, indent=1))
