# MeepleVerse audio

These WAV files are original procedural sounds generated for MeepleVerse by
`scripts/generate-audio.py` (Python standard library). No third-party samples,
commercial music recordings, or UNO audio assets are included. Regenerate them with:

```sh
python apps/meepleverse-user-web/scripts/generate-audio.py
```

`board-party-v2.wav` is a 16-bar, 124 BPM party loop (about 31 seconds),
with bright synth melodies, offbeat chords, bass, kick, snare and hi-hats.
Its sustained level is mastered separately from the short effects. The other files are short event cues, mastered to a similar RMS level
as the music (approximately -12 dBFS) with soft-limited peaks.
All assets are mono PCM, 22050 Hz, 16 bit. The repository owner may use and modify
these generated assets as part of MeepleVerse, including commercial distribution.
