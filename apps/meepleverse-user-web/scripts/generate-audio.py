"""Original MeepleVerse procedural audio. Python standard library only; no samples.
Run from anywhere: python apps/meepleverse-user-web/scripts/generate-audio.py
"""
import math
import random
import wave
from array import array
from pathlib import Path

RATE = 22050
OUT = Path(__file__).resolve().parents[1] / 'public' / 'audio'
OUT.mkdir(parents=True, exist_ok=True)
rng = random.Random(74)

def note(midi):
    return 440 * 2 ** ((midi - 69) / 12)

def tone(buf, start, duration, midi, gain, soft=False, wrap=False):
    frequency = note(midi)
    offset = round(start * RATE)
    for i in range(round(duration * RATE)):
        t = i / RATE
        env = min(1, t / .012) * math.exp(-t * (2.4 if soft else 7)) * min(1, (duration - t) / .08)
        phase = 2 * math.pi * frequency * t
        value = (math.sin(phase) + .18 * math.sin(2 * phase) + .06 * math.sin(3 * phase)) * env * gain
        pos = offset + i
        if wrap: pos %= len(buf)
        if 0 <= pos < len(buf): buf[pos] += value

def noise(buf, start, duration, gain):
    offset = round(start * RATE)
    previous = 0
    for i in range(round(duration * RATE)):
        current = rng.uniform(-1, 1)
        value = (current - previous) * math.exp(-i / RATE * 35) * min(1, i / (RATE * .003)) * gain
        previous = current
        if offset + i < len(buf): buf[offset + i] += value

def save(name, buf, ceiling=.7):
    peak = max(abs(value) for value in buf) or 1
    scale = min(1, ceiling / peak)
    pcm = array('h', (round(max(-1, min(1, value * scale)) * 32767) for value in buf))
    with wave.open(str(OUT / (name + '.wav')), 'wb') as target:
        target.setnchannels(1)
        target.setsampwidth(2)
        target.setframerate(RATE)
        target.writeframes(pcm.tobytes())

# Sixteen bars at 124 BPM: bright party synths, offbeat chords and a dance beat.
# Every musical tail wraps into the opening so the track loops without a gap.
beat = 60 / 124
music = [0.] * round(16 * 4 * beat * RATE)
chords = [(48, 52, 55, 59), (55, 59, 62, 65), (57, 60, 64, 67), (53, 57, 60, 64)]
motifs = [(76, 79, 84, 79, 81, 79, 76, 74), (74, 79, 83, 86, 83, 79, 77, 74),
          (76, 81, 84, 88, 84, 81, 79, 76), (77, 81, 84, 81, 79, 77, 76, 72)]

def drum(start, kind, gain=1):
    duration = .28 if kind == 'kick' else .16 if kind == 'snare' else .065
    previous = 0
    for i in range(round(duration * RATE)):
        t = i / RATE
        attack = min(1, t / .002)
        if kind == 'kick':
            phase = 2 * math.pi * (48 * t + 65 * .018 * (1 - math.exp(-t / .018)))
            value = math.sin(phase) * math.exp(-t * 19) * .42
        else:
            current = rng.uniform(-1, 1)
            hiss = (current - previous) * .5
            previous = current
            value = (hiss * .19 + math.sin(2 * math.pi * 185 * t) * .09) * math.exp(-t * 27) if kind == 'snare' else hiss * .065 * math.exp(-t * 65)
        music[(round(start * RATE) + i) % len(music)] += value * attack * gain

for bar in range(16):
    chord = chords[bar % 4]
    origin = bar * 4 * beat
    for step in range(4):
        drum(origin + step * beat, 'kick')
        if step % 2: drum(origin + step * beat, 'snare')
        # Short, bright chord stabs on the upbeat leave space for card effects.
        for pitch in chord[1:]: tone(music, origin + (step + .5) * beat, .22, pitch + 12, .10, wrap=True)
    for step in range(8):
        drum(origin + (step + .5) * beat / 2, 'hat', .75 if step % 2 else 1)
        bass = chord[0] - 12 + (12 if step in (3, 7) else 0)
        tone(music, origin + (step + .5) * beat / 2, .22, bass, .24, wrap=True)
        # A repeated hook with a quieter answering phrase in alternate groups.
        pitch = motifs[bar % 4][step]
        if step in (0, 1, 3, 4, 6) or bar >= 8:
            tone(music, origin + step * beat / 2, .28, pitch, .15 if bar % 8 < 4 else .11, wrap=True)
    if bar % 4 == 3:
        for step in range(4): drum(origin + (3 + step / 4) * beat, 'snare', .35 + step * .12)

# Raise sustained loudness, then soft-limit peaks instead of simply clipping.
# The old loop only limited peaks and never raised quiet source material.
rms = math.sqrt(sum(value * value for value in music) / len(music))
drive = .29 / max(rms, 1e-9)
music = [.95 * math.tanh(value * drive) for value in music]
save('board-party-v2', music, .95)

specs = {
    'play': (.24, [(0, .18, 48, .2)]),
    'draw': (.28, [(0, .16, 72, .09)]),
    'skip': (.5, [(0, .13, 76, .17), (.16, .15, 76, .12)]),
    'reverse': (.65, [(0, .24, 67, .16), (.12, .24, 72, .16), (.26, .25, 67, .14)]),
    'wild': (.8, [(i * .075, .42, pitch, .14) for i, pitch in enumerate([72, 76, 79, 84])]),
    'penalty': (.55, [(0, .3, 48, .19), (.12, .3, 43, .14)]),
    'turn': (.72, [(0, .4, 79, .16), (.16, .4, 84, .12)]),
    'uno': (.9, [(0, .4, 72, .2), (.15, .5, 84, .19)]),
    'win': (1.8, [(i * .16, .6, pitch, .2) for i, pitch in enumerate([72, 76, 79, 84, 88, 91])]),
    'lose': (1.25, [(i * .2, .55, pitch, .12) for i, pitch in enumerate([76, 72, 67])]),
}
for name, (duration, notes) in specs.items():
    buf = [0.] * round(duration * RATE)
    for start, length, pitch, gain in notes: tone(buf, start, length, pitch, gain)
    if name in ('play', 'draw'): noise(buf, 0, .16, .15 if name == 'play' else .07)
    # Match the music's mastering level instead of leaving quiet raw effects.
    rms = math.sqrt(sum(value * value for value in buf) / len(buf))
    gain = .29 / max(rms, 1e-9)
    buf = [.95 * math.tanh(value * gain) for value in buf]
    save(name, buf, .95)
print(f'Generated {len(specs) + 1} original WAV assets in {OUT}')
