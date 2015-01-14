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
 *
 * @author sll@google.com (Sean Lip)
 */

describe('MusicNotesInput interaction', function() {
  describe('MusicNotesInput tests', function() {
    var $httpBackend, $templateCache;
    var elt, scope, ctrlScope;

    beforeEach(module('oppia'));
    beforeEach(module('directiveTemplates'));
    beforeEach(inject(function($compile, _$templateCache_, $rootScope) {
      $templateCache = _$templateCache_;
      var templatesHtml = $templateCache.get(
        'extensions/interactions/MusicNotesInput/MusicNotesInput.html');
      $compile(templatesHtml)($rootScope);
      $rootScope.$digest();
    }));

    beforeEach(inject(function($compile, $rootScope, _$httpBackend_) {
      $httpBackend = _$httpBackend_;

      var TAG_NAME = 'oppia-interactive-music-notes-input';
      scope = $rootScope.$new();
      elt = angular.element('<' + TAG_NAME + '></' + TAG_NAME + '>');
      $compile(elt)(scope);
      scope.$digest();
      ctrlScope = elt.isolateScope();
    }));

    afterEach(function() {
      scope.$apply();
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('loads the music staff template', function() {
      expect(elt.html()).toContain('oppia-music-input-valid-note-area');
      expect(elt.html()).toContain('Play Target Sequence');
      expect(elt.html()).toContain('Play Current Sequence');
    });

    it('loads the palette when initialized', function() {
      expect(elt.html()).toContain('oppia-music-input-natural-note');
    });

    it('adds notes to note sequence in the correct order', function() {
      expect(ctrlScope.noteSequence).toEqual([]);

      ctrlScope._addNoteToNoteSequence({
        baseNoteMidiNumber: 71,
        offset: 0,
        noteId: 'note_id_0'
      });
      expect(ctrlScope.noteSequence).toEqual([{
        note: {
          baseNoteMidiNumber: 71,
          offset: 0,
          noteId: 'note_id_0'
        }
      }]);

      ctrlScope._addNoteToNoteSequence({
        baseNoteMidiNumber: 72,
        offset: 0,
        noteId: 'note_id_1'
      });
      expect(ctrlScope.noteSequence).toEqual([{
        note: {
          baseNoteMidiNumber: 71,
          offset: 0,
          noteId: 'note_id_0'
        }
      }, {
        note: {
          baseNoteMidiNumber: 72,
          offset: 0,
          noteId: 'note_id_1'
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
        noteId: 'note_id_1'
      });
      ctrlScope._removeNotesFromNoteSequenceWithId('note_id_0');
      expect(ctrlScope.noteSequence).toEqual([{
        note: {
          baseNoteMidiNumber: 81,
          offset: 0,
          noteId: 'note_id_1'
        }
      }]);
    });

    it('does not do anything when asked to remove a note that does not exist',
       function() {
      expect(ctrlScope.noteSequence).toEqual([]);

      ctrlScope._addNoteToNoteSequence({
        baseNoteMidiNumber: 64,
        offset: 0,
        noteId: 'note_id_0'
      });
      ctrlScope._removeNotesFromNoteSequenceWithId('note_id_1');
      expect(ctrlScope.noteSequence).toEqual([{
        note: {
          baseNoteMidiNumber: 64,
          offset: 0,
          noteId: 'note_id_0'
        }
      }]);
    });

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
