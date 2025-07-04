// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for concept-card.model.
 */

import {
  ConceptCardBackendDict,
  ConceptCard,
} from 'domain/skill/concept-card.model';
import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';
import {RecordedVoiceovers} from 'domain/exploration/recorded-voiceovers.model';

describe('Concept card object factory', () => {
  let conceptCardDict: ConceptCardBackendDict;

  beforeEach(() => {
    conceptCardDict = {
      explanation: {
        html: 'test explanation',
        content_id: 'explanation',
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          explanation: {},
        },
      },
    };
  });

  it('should create a new concept card from a backend dictionary', () => {
    let conceptCard = ConceptCard.createFromBackendDict(conceptCardDict);
    expect(conceptCard.getExplanation()).toEqual(
      SubtitledHtml.createDefault('test explanation', 'explanation')
    );
  });

  it('should set explanation', () => {
    let conceptCard = ConceptCard.createFromBackendDict(conceptCardDict);
    expect(conceptCard.getExplanation()).toEqual(
      SubtitledHtml.createDefault('test explanation', 'explanation')
    );
    conceptCard.setExplanation(SubtitledHtml.createDefault('test', 'test exp'));
    expect(conceptCard.getExplanation()).toEqual(
      SubtitledHtml.createDefault('test', 'test exp')
    );
  });

  it('should convert to a backend dictionary', () => {
    let conceptCard = ConceptCard.createFromBackendDict(conceptCardDict);
    expect(conceptCard.toBackendDict()).toEqual(conceptCardDict);
  });

  it('should return recorded voice overs when called', () => {
    let voiceover = {
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
      },
    };

    conceptCardDict.recorded_voiceovers = voiceover;
    let conceptCard = ConceptCard.createFromBackendDict(conceptCardDict);

    expect(conceptCard.getRecordedVoiceovers()).toEqual(
      RecordedVoiceovers.createFromBackendDict(voiceover)
    );
  });
});
