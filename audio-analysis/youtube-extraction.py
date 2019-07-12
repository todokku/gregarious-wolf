# -*- coding: utf-8 -*-

from __future__ import unicode_literals
from os import path
from pydub import AudioSegment
from SimpleAudioIndexer import SimpleAudioIndexer as sai
import youtube_dl
import pyaudio
import speech_recognition as sr
import pocketsphinx
import matplotlib.pyplot as plt
from textblob import TextBlob

ydl_opts = {
    'format': 'bestaudio/best',
    'postprocessors': [{
        'key': 'FFmpegExtractAudio',
        'preferredcodec': 'mp3',
        'preferredquality': '192',
    }],
}
with youtube_dl.YoutubeDL(ydl_opts) as ydl:
    # Url of the youtube video - and the audio for that video will be downloaded as an mp3 in the current directory.
    ydl.download(['https://www.youtube.com/watch?v=JZRXESV3R74'])

# Set-up for converting the input mp3 to a wav.
src = "Donald Trump - The Art of the Insult-JZRXESV3R74.mp3"
dst = "test.wav"

# Convert .mp3 to .wav .                                                          
sound = AudioSegment.from_mp3(src)
sound.export(dst, format="wav")

# We can use .wav .aiff or .flac with this lib.
AUDIO_FILE = path.join(path.dirname(path.realpath(__file__)), "test.wav")

# Uses AUDIO-FILE to do a speech to text.
r = sr.Recognizer()
framerate = 0.1
words = []
subjectivityScores = []

with sr.AudioFile(AUDIO_FILE) as source:
    audio = r.record(source)  # read the entire audio file
    decoder = r.recognize_sphinx(audio, show_all=True)
    print(decoder.seg())
    
    # Prints out all the words and their start and end timestamps.
    for seg in decoder.seg():
        print(seg.word, seg.start_frame, seg.end_frame)
        words.append(seg.word)
        subjectivityScores.append(TextBlob(seg.word).sentiment.polarity)
        # Run a test where the word stupid gets saved as a new audio file.
        if (seg.word == 'stupid'):
            print('******', seg.word)
            print('******', seg.start_frame, seg.end_frame)
            t1 = (seg.start_frame -50) * 10
            t2 = (seg.end_frame + 300) * 10

            stupidAudio = AudioSegment.from_wav(AUDIO_FILE)
            stupidAudio = stupidAudio[t1:t2]
            stupidAudio.export('newStupid.wav', format='wav') # exports a wav to the current path

plt.bar(words, subjectivityScores)
plt.show()