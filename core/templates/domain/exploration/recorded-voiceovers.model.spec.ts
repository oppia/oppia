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
 * @fileoverview Unit tests for recorded-voiceovers model.
 */

import {TestBed} from '@angular/core/testing';
import {RecordedVoiceovers} from 'domain/exploration/recorded-voiceovers.model';
import {Voiceover} from 'domain/exploration/voiceover.model';

describe('RecordedVoiceovers object factory', () => {
  let rv: RecordedVoiceovers;
  let rvDict = {
    voiceovers_mapping: {
      content: {
        en: {
          filename: 'filename1.mp3',
          file_size_bytes: 100000,
          needs_update: false,
          duration_secs: 10.0,
        },
        hi: {
          filename: 'filename2.mp3',
          file_size_bytes: 11000,
          needs_update: false,
          duration_secs: 0.11,
        },
      },
      default_outcome: {
        en: {
          filename: 'filename3.mp3',
          file_size_bytes: 3000,
          needs_update: false,
          duration_secs: 0.33,
        },
        hi: {
          filename: 'filename4.mp3',
          file_size_bytes: 5000,
          needs_update: false,
          duration_secs: 0.5,
        },
      },
      feedback_1: {
        en: {
          filename: 'filename5.mp3',
          file_size_bytes: 2000,
          needs_update: false,
          duration_secs: 0.2,
        },
        hi: {
          filename: 'filename6.mp3',
          file_size_bytes: 9000,
          needs_update: false,
          duration_secs: 0.9,
        },
      },
      feedback_2: {
        en: {
          filename: 'filename7.mp3',
          file_size_bytes: 1000,
          needs_update: false,
          duration_secs: 0.1,
        },
        hi: {
          filename: 'filename8.mp3',
          file_size_bytes: 600,
          needs_update: false,
          duration_secs: 0.06,
        },
      },
      hint_1: {
        en: {
          filename: 'filename9.mp3',
          file_size_bytes: 104000,
          needs_update: false,
          duration_secs: 10.4,
        },
        hi: {
          filename: 'filename10.mp3',
          file_size_bytes: 1000,
          needs_update: true,
          duration_secs: 0.1,
        },
      },
      hint_2: {},
      solution: {
        en: {
          filename: 'filename13.mp3',
          file_size_bytes: 15080,
          needs_update: false,
          duration_secs: 1.5,
        },
        hi: {
          filename: 'filename14.mp3',
          file_size_bytes: 10500,
          needs_update: false,
          duration_secs: 1.05,
        },
      },
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RecordedVoiceovers],
    });

    rv = RecordedVoiceovers.createFromBackendDict(rvDict);
  });

  it('should get all content id', () => {
    let contentIdList = [
      'content',
      'default_outcome',
      'feedback_1',
      'feedback_2',
      'hint_1',
      'hint_2',
      'solution',
    ];
    expect(rv.getAllContentIds()).toEqual(contentIdList);
  });

  it('should correctly get all bindable audio voiceovers', () => {
    expect(rv.getBindableVoiceovers('content')).toEqual({
      en: Voiceover.createFromBackendDict({
        filename: 'filename1.mp3',
        file_size_bytes: 100000,
        needs_update: false,
        duration_secs: 10.0,
      }),
      hi: Voiceover.createFromBackendDict({
        filename: 'filename2.mp3',
        file_size_bytes: 11000,
        needs_update: false,
        duration_secs: 0.11,
      }),
    });
  });

  it(
    'should return a correct voiceover for a given content ' +
      'id and language',
    () => {
      expect(rv.getVoiceover('hint_1', 'en')).toEqual(
        Voiceover.createFromBackendDict({
          filename: 'filename9.mp3',
          file_size_bytes: 104000,
          needs_update: false,
          duration_secs: 10.4,
        })
      );
    }
  );

  it('should make all audio needs update for a give content id', () => {
    rv.markAllVoiceoversAsNeedingUpdate('content');
    expect(rv.getBindableVoiceovers('content')).toEqual({
      en: Voiceover.createFromBackendDict({
        filename: 'filename1.mp3',
        file_size_bytes: 100000,
        needs_update: true,
        duration_secs: 10.0,
      }),
      hi: Voiceover.createFromBackendDict({
        filename: 'filename2.mp3',
        file_size_bytes: 11000,
        needs_update: true,
        duration_secs: 0.11,
      }),
    });
  });

  it('should get all language code for a given content id', () => {
    let LanguageCodeList = ['en', 'hi'];
    expect(rv.getLanguageCodes('hint_1')).toEqual(LanguageCodeList);
  });

  it('should correctly check content id has voiceovers', () => {
    expect(rv.hasVoiceovers('content')).toBe(true);
    expect(rv.hasVoiceovers('hint_2')).toBe(false);
  });

  it('should correctly check content id has unflagged voiceovers', () => {
    expect(rv.hasUnflaggedVoiceovers('content')).toBe(true);
    rv.markAllVoiceoversAsNeedingUpdate('solution');
    expect(rv.hasUnflaggedVoiceovers('solution')).toBe(false);
  });

  it('should add a given content id', () => {
    rv.addContentId('feedback_3');
    expect(rv.getBindableVoiceovers('feedback_3')).toEqual({});
    expect(() => {
      rv.addContentId('content');
    }).toThrowError('Trying to add duplicate content id.');
  });

  it('should delete a given content id', () => {
    rv.deleteContentId('feedback_1');
    let contentIdList = [
      'content',
      'default_outcome',
      'feedback_2',
      'hint_1',
      'hint_2',
      'solution',
    ];
    expect(rv.getAllContentIds()).toEqual(contentIdList);
    expect(() => {
      rv.deleteContentId('feedback_3');
    }).toThrowError('Unable to find the given content id.');
  });

  it('should add voiceovers in a given content id', () => {
    rv.addVoiceover('hint_2', 'en', 'filename11.mp3', 1000, 0.1);
    expect(rv.getBindableVoiceovers('hint_2')).toEqual({
      en: Voiceover.createFromBackendDict({
        filename: 'filename11.mp3',
        file_size_bytes: 1000,
        needs_update: false,
        duration_secs: 0.1,
      }),
    });
    expect(() => {
      rv.addVoiceover('content', 'en', 'filename.mp3', 1000, 0.1);
    }).toThrowError('Trying to add duplicate language code.');
  });

  it('should delete voiceovers in a given content id', () => {
    rv.deleteVoiceover('content', 'hi');
    expect(rv.getBindableVoiceovers('content')).toEqual({
      en: Voiceover.createFromBackendDict({
        filename: 'filename1.mp3',
        file_size_bytes: 100000,
        needs_update: false,
        duration_secs: 10.0,
      }),
    });
  });

  it('should throw error when deleting non-existent voiceover', () => {
    expect(() => rv.deleteVoiceover('content', 'zz')).toThrowError(
      'Trying to remove non-existing translation for language code zz'
    );
  });

  it('should toggle needs update attribute in a given ' + 'content id', () => {
    rv.toggleNeedsUpdateAttribute('content', 'hi');
    expect(rv.getVoiceover('content', 'hi')).toEqual(
      Voiceover.createFromBackendDict({
        filename: 'filename2.mp3',
        file_size_bytes: 11000,
        needs_update: true,
        duration_secs: 0.11,
      })
    );
  });

  it('should correctly convert to backend dict', () => {
    expect(rv.toBackendDict()).toEqual(rvDict);
  });
});
