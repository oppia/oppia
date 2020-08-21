// Copyright 2019 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Player service for the interaction.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

export interface Note {
  midiValue: number;
  duration: number;
  start: number;
}

@Injectable({
  providedIn: 'root'
})
export class MusicPhrasePlayerService {
  _MIDI_CHANNEL: number = 0;
  _MIDI_VELOCITY: number = 127;
  _SECS_TO_MILLISECS: number = 1000.0;

  _playNote(
      midiValues: number[], durationInSecs: number, delayInSecs: number): void {
    setTimeout(() => {
      MIDI.chordOn(
        this._MIDI_CHANNEL, midiValues, this._MIDI_VELOCITY, 0);
      MIDI.chordOff(
        this._MIDI_CHANNEL, midiValues, durationInSecs);
    }, delayInSecs * this._SECS_TO_MILLISECS);
  }

  /**
   * Plays a music phrase. The input is given as an Array of notes. Each
   * note is represented as an object with three key-value pairs:
   * - midiValue: Integer. The midi value of the note.
   * - duration: Float. A decimal number representing the length of the note,
   *     in seconds.
   * - start: Float. A decimal number representing the time offset (after the
   *     beginning of the phrase) at which to start playing the note.
   */
  _playMusicPhrase(notes: Note[]): void {
    MIDI.Player.stop();

    for (var i: number = 0; i < notes.length; i++) {
      this._playNote(
        [notes[i].midiValue], notes[i].duration, notes[i].start);
    }
  }

  playMusicPhrase(notes: Note[]): void {
    this._playMusicPhrase(notes);
  }
}

angular.module('oppia').factory(
  'MusicPhrasePlayerService', downgradeInjectable(MusicPhrasePlayerService));
