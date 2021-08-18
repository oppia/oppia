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
 * @fileoverview Tests for state-card.model.ts.
 */

import { TestBed } from '@angular/core/testing';

import { AudioTranslationLanguageService } from
  'pages/exploration-player-page/services/audio-translation-language.service';
import { CamelCaseToHyphensPipe } from
  'filters/string-utility-filters/camel-case-to-hyphens.pipe';
import { InteractionBackendDict, InteractionObjectFactory } from
  'domain/exploration/InteractionObjectFactory';
import { StateCard } from
  'domain/state_card/state-card.model';
import { SubtitledUnicode } from
  'domain/exploration/SubtitledUnicodeObjectFactory';
import { WrittenTranslationsObjectFactory } from
  'domain/exploration/WrittenTranslationsObjectFactory';
import { RecordedVoiceovers } from 'domain/exploration/recorded-voiceovers.model';
import { Voiceover } from 'domain/exploration/voiceover.model';


describe('State card object factory', () => {
  let interactionObjectFactory: InteractionObjectFactory;
  let writtenTranslationsObjectFactory: WrittenTranslationsObjectFactory;
  let audioTranslationLanguageService: AudioTranslationLanguageService;
  let _sampleCard = null;
  let _sampleCard2 = null;


  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CamelCaseToHyphensPipe]
    });

    interactionObjectFactory = TestBed.inject(InteractionObjectFactory);
    writtenTranslationsObjectFactory = TestBed.inject(
      WrittenTranslationsObjectFactory);
    audioTranslationLanguageService = TestBed.inject(
      AudioTranslationLanguageService);

    let interactionDict: InteractionBackendDict = {
      answer_groups: [],
      confirmed_unclassified_answers: [],
      customization_args: {
        rows: {
          value: 1
        },
        placeholder: {
          value: {
            unicode_str: 'Type your answer here.',
            content_id: ''
          }
        }
      },
      default_outcome: {
        dest: '(untitled state)',
        feedback: {
          content_id: 'default_outcome',
          html: ''
        },
        param_changes: [],
        labelled_as_correct: false,
        refresher_exploration_id: null,
        missing_prerequisite_skill_id: null
      },
      hints: [],
      id: 'TextInput',
      solution: null
    };
    _sampleCard = StateCard.createNewCard(
      'State 1', '<p>Content</p>', '<interaction></interaction>',
      interactionObjectFactory.createFromBackendDict(interactionDict),
      RecordedVoiceovers.createFromBackendDict({
        voiceovers_mapping: {
          content: {
            en: {
              filename: 'filename1.mp3',
              file_size_bytes: 100000,
              needs_update: false,
              duration_secs: 10.0
            },
            hi: {
              filename: 'filename2.mp3',
              file_size_bytes: 11000,
              needs_update: false,
              duration_secs: 0.11
            }
          }
        }
      }),
      writtenTranslationsObjectFactory.createEmpty(),
      'content', audioTranslationLanguageService);

    _sampleCard2 = new StateCard(
      null, null, null, null,
      [{
        learnerInput: 'learnerInput',
        oppiaResponse: 'response',
        isHint: true
      }], null, null, null, null);
  });

  it('should be able to get the various fields', () => {
    expect(_sampleCard.getStateName()).toEqual('State 1');
    expect(_sampleCard.getContentHtml()).toEqual('<p>Content</p>');
    expect(_sampleCard.getInteraction().id).toEqual('TextInput');
    expect(_sampleCard.getInteractionHtml()).toEqual(
      '<interaction></interaction>');
    expect(_sampleCard.getInputResponsePairs()).toEqual([]);
    expect(_sampleCard.getLastInputResponsePair()).toEqual(null);
    expect(_sampleCard.getLastOppiaResponse()).toEqual(null);
    expect(_sampleCard.getRecordedVoiceovers().getBindableVoiceovers(
      'content')).toEqual({
      en: Voiceover.createFromBackendDict({
        filename: 'filename1.mp3',
        file_size_bytes: 100000,
        needs_update: false,
        duration_secs: 10.0
      }),
      hi: Voiceover.createFromBackendDict({
        filename: 'filename2.mp3',
        file_size_bytes: 11000,
        needs_update: false,
        duration_secs: 0.11
      })
    });
    expect(_sampleCard.getVoiceovers()).toEqual({
      en: Voiceover.createFromBackendDict({
        filename: 'filename1.mp3',
        file_size_bytes: 100000,
        needs_update: false,
        duration_secs: 10.0
      }),
      hi: Voiceover.createFromBackendDict({
        filename: 'filename2.mp3',
        file_size_bytes: 11000,
        needs_update: false,
        duration_secs: 0.11
      })
    });

    expect(_sampleCard.getInteractionId()).toEqual('TextInput');
    expect(_sampleCard.isTerminal()).toEqual(false);
    expect(_sampleCard.isInteractionInline()).toEqual(true);
    expect(_sampleCard.getInteractionInstructions()).toEqual(null);
    expect(_sampleCard.getInteractionCustomizationArgs()).toEqual({
      rows: {value: 1},
      placeholder: {value: new SubtitledUnicode('Type your answer here.', '')}
    });
    expect(_sampleCard.getInteractionHtml()).toEqual(
      '<interaction></interaction>'
    );

    _sampleCard.addInputResponsePair({
      oppiaResponse: 'response',
      learnerInput: '',
      isHint: false
    });

    expect(_sampleCard.getOppiaResponse(0)).toEqual('response');
    expect(_sampleCard.getLastOppiaResponse()).toEqual('response');
    expect(_sampleCard.getLastInputResponsePair()).toEqual({
      oppiaResponse: 'response',
      learnerInput: '',
      isHint: false
    });
  });

  it('should add input response pair', () => {
    const responsePair1 = {
      oppiaResponse: 'pair_1',
      learnerInput: '',
      isHint: false
    };
    _sampleCard.addInputResponsePair(responsePair1);
    expect(_sampleCard.getInputResponsePairs()).toEqual([responsePair1]);
  });

  it('should add not add response if input response pair is empty', () => {
    _sampleCard._inputResponsePairs = [];
    _sampleCard.setLastOppiaResponse('response');
    expect(_sampleCard.getInputResponsePairs()).toEqual([]);
  });

  it('should be able to set the various fields', () => {
    _sampleCard.setInteractionHtml('<interaction_2></interaction_2>');
    expect(_sampleCard.getInteractionHtml()).toEqual(
      '<interaction_2></interaction_2>');

    _sampleCard.addInputResponsePair({
      oppiaResponse: 'response',
      learnerInput: '',
      isHint: false
    });

    _sampleCard.setLastOppiaResponse('response_3');
    expect(_sampleCard.getLastOppiaResponse()).toEqual('response_3');
  });

  it('should return last answer when calling ' +
    '\'getLastAnswer\'', () => {
    expect(_sampleCard2.getLastAnswer()).toEqual('learnerInput');
  });

  it('should return empty dict when calling \'getVoiceovers\' ' +
    'if there are no voice overs', () => {
    expect(_sampleCard2.getVoiceovers()).toEqual({});
  });

  it('should return null when calling \'getInteractionId\' ' +
    'if there are no interactions', () => {
    expect(_sampleCard2.getInteractionId()).toEqual(null);
  });

  it('should return null when calling \'getInteractionCustomizationArgs\' ' +
    'if there are no interactions', () => {
    expect(_sampleCard2.getInteractionCustomizationArgs()).toEqual(null);
  });
});
