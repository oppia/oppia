// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the MusicNotesInput interaction.
 */

describe('MusicNotesInput interaction', function() {
  describe('MusicNotesInput tests', function() {
    var $httpBackend, $templateCache;
    var elt, scope, ctrlScope;

    beforeEach(module('directiveTemplates'));
    beforeEach(module(
      'oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS, function($provide) {
        $provide.value('ExplorationEngineService', {});
      }
    ));

    beforeEach(inject(function($compile, $rootScope, _$templateCache_) {
      $templateCache = _$templateCache_;
      var templatesHtml = $templateCache.get(
        '/extensions/interactions/MusicNotesInput/MusicNotesInput.html');
      $compile(templatesHtml)($rootScope);
      $rootScope.$digest();
    }));

    beforeEach(inject(function($compile, _$httpBackend_, $rootScope) {
      $httpBackend = _$httpBackend_;

      var TAG_NAME = 'oppia-interactive-music-notes-input';
      scope = $rootScope.$new();
      elt = angular.element(
        '<' + TAG_NAME + ' last-answer="null"></' + TAG_NAME + '>');
      $compile(elt)(scope);
      scope.$digest();
      ctrlScope = elt[0].isolateScope();
    }));

    afterEach(function() {
      scope.$apply();
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('loads the music staff template', function() {
      expect(elt.html()).toContain('oppia-music-input-valid-note-area');
      expect(elt.html()).toContain('I18N_INTERACTIONS_MUSIC_PLAY_SEQUENCE');
      expect(elt.html()).toContain('playCurrentSequence()');
    });

    it('loads the palette when initialized', function() {
      expect(elt.html()).toContain('oppia-music-input-natural-note');
    });

    it('adds notes to note sequence in the correct order', function() {
      expect(ctrlScope.noteSequence).toEqual([]);

      ctrlScope._addNoteToNoteSequence({
        baseNoteMidiNumber: 71,
        offset: 0,
        noteId: 'note_id_0',
        noteStart: {
          num: 1,
          den: 1
        }
      });
      expect(ctrlScope.noteSequence).toEqual([{
        note: {
          baseNoteMidiNumber: 71,
          offset: 0,
          noteId: 'note_id_0',
          noteStart: {
            num: 1,
            den: 1
          }
        }
      }]);

      ctrlScope._addNoteToNoteSequence({
        baseNoteMidiNumber: 72,
        offset: 0,
        noteId: 'note_id_1',
        noteStart: {
          num: 1,
          den: 1
        }
      });
      expect(ctrlScope.noteSequence).toEqual([{
        note: {
          baseNoteMidiNumber: 71,
          offset: 0,
          noteId: 'note_id_0',
          noteStart: {
            num: 1,
            den: 1
          }
        }
      }, {
        note: {
          baseNoteMidiNumber: 72,
          offset: 0,
          noteId: 'note_id_1',
          noteStart: {
            num: 1,
            den: 1
          }
        }
      }]);
    });

    it('clears the sequence', function() {
      expect(ctrlScope.noteSequence).toEqual([]);

      ctrlScope._addNoteToNoteSequence({
        baseNoteMidiNumber: 71,
        offset: 0,
        noteId: 'note_id_0'
      });
      ctrlScope._addNoteToNoteSequence({
        baseNoteMidiNumber: 72,
        offset: 0,
        noteId: 'note_id_1'
      });

      expect(ctrlScope.noteSequence.length).toEqual(2);

      ctrlScope.clearSequence();
      expect(ctrlScope.noteSequence).toEqual([]);
    });

    it('removes notes with particular ids', function() {
      expect(ctrlScope.noteSequence).toEqual([]);

      ctrlScope._addNoteToNoteSequence({
        baseNoteMidiNumber: 76,
        offset: 0,
        noteId: 'note_id_0'
      });
      ctrlScope._addNoteToNoteSequence({
        baseNoteMidiNumber: 81,
        offset: 0,
        noteId: 'note_id_1',
        noteStart: {
          num: 1,
          den: 1
        }
      });
      ctrlScope._removeNotesFromNoteSequenceWithId('note_id_0');
      expect(ctrlScope.noteSequence).toEqual([{
        note: {
          baseNoteMidiNumber: 81,
          offset: 0,
          noteId: 'note_id_1',
          noteStart: {
            num: 1,
            den: 1
          }
        }
      }]);
    });

    it('does not do anything when asked to remove a note that does not exist',
      function() {
        expect(ctrlScope.noteSequence).toEqual([]);

        ctrlScope._addNoteToNoteSequence({
          baseNoteMidiNumber: 64,
          offset: 0,
          noteId: 'note_id_0',
          noteStart: {
            num: 1,
            den: 1
          }
        });
        ctrlScope._removeNotesFromNoteSequenceWithId('note_id_1');
        expect(ctrlScope.noteSequence).toEqual([{
          note: {
            baseNoteMidiNumber: 64,
            offset: 0,
            noteId: 'note_id_0',
            noteStart: {
              num: 1,
              den: 1
            }
          }
        }]);
      }
    );

    it('correctly handles duplicate removals', function() {
      expect(ctrlScope.noteSequence).toEqual([]);

      ctrlScope._addNoteToNoteSequence({
        baseNoteMidiNumber: 72,
        offset: 0,
        noteId: 'note_id_0'
      });
      ctrlScope._removeNotesFromNoteSequenceWithId('note_id_0');
      ctrlScope._removeNotesFromNoteSequenceWithId('note_id_0');
      expect(ctrlScope.noteSequence).toEqual([]);
    });
  });
});

describe('Music phrase player service', function() {
  describe('music phrase player service', function() {
    var mpps = null;
    beforeEach(module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));
    beforeEach(inject(function($injector, $window) {
      mpps = $injector.get('musicPhrasePlayerService');
      // This is here so that, if the test environment is modified
      // to include MIDI in the future, we will remember to swap
      // it out with a dummy MIDI and back again after the test.
      if ($window.MIDI) {
        throw 'Expected MIDI library not to show up in tests.';
      }

      $window.MIDI = {
        Player: {
          stop: function() {}
        },
        chordOn: function() {},
        chordOff: function() {}
      };
      spyOn($window.MIDI.Player, 'stop');
      spyOn($window.MIDI, 'chordOn');
      spyOn($window.MIDI, 'chordOff');
    }));

    afterEach(inject(function($window) {
      $window.MIDI = undefined;
    }));

    it('should stop any existing playthroughs when a new play is requested',
      function() {
        mpps.playMusicPhrase([]);
        expect(MIDI.Player.stop).toHaveBeenCalled();
      }
    );

    it('should play all the notes in a music phrase',
      inject(function($timeout) {
        mpps.playMusicPhrase([{
          midiValue: 69,
          duration: 2,
          start: 1
        }, {
          midiValue: 77,
          duration: 1.5,
          start: 3
        }]);
        $timeout.flush();
        expect(MIDI.chordOn).toHaveBeenCalledWith(0, [69], 127, 0);
        expect(MIDI.chordOn).toHaveBeenCalledWith(0, [77], 127, 0);
        expect(MIDI.chordOff).toHaveBeenCalledWith(0, [69], 2);
        expect(MIDI.chordOff).toHaveBeenCalledWith(0, [77], 1.5);
      }));
  });
});
