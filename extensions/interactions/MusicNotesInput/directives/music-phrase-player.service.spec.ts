// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests service for the interaction.
 */

import { MusicPhrasePlayerService } from 'interactions/MusicNotesInput/directives/music-phrase-player.service';
import { fakeAsync, flush, TestBed } from '@angular/core/testing';

describe('MusicPhrasePlayerService', () => {
  let musicPhrasePlayerService: MusicPhrasePlayerService;

  beforeEach(() => {
    musicPhrasePlayerService = TestBed.get(MusicPhrasePlayerService);

    window.MIDI = {
      // This throws "Type '{ stop: () => void; }' is missing the following
      // properties from type 'MidiPlayer': BPM, currentTime, endTime, playing,
      // and 13 more." We need to suppress this error because we only need the
      // functions given below for testing.
      // @ts-expect-error
      Player: {
        stop: function() {}
      },
      chordOn: function() {},
      chordOff: function() {}
    };
  });

  it('should play music phrases when user clicks play', fakeAsync(() => {
    spyOn(window.MIDI.Player, 'stop').and.stub();
    let chordOn = spyOn(window.MIDI, 'chordOn').and.stub();
    let chordOff = spyOn(window.MIDI, 'chordOff').and.stub();
    let notes = [{
      midiValue: 69,
      duration: 1,
      start: 0
    }, {
      midiValue: 71,
      duration: 1,
      start: 1
    }];

    musicPhrasePlayerService.playMusicPhrase(notes);
    flush();

    expect(MIDI.Player.stop).toHaveBeenCalled();
    expect(chordOn).toHaveBeenCalledTimes(2);
    expect(chordOn.calls.all()[0].args).toEqual([0, [69], 127, 0]);
    expect(chordOn.calls.all()[1].args).toEqual([0, [71], 127, 0]);
    expect(chordOff).toHaveBeenCalledTimes(2);
    expect(chordOff.calls.all()[0].args).toEqual([0, [69], 1]);
    expect(chordOff.calls.all()[1].args).toEqual([0, [71], 1]);
  }));
});
