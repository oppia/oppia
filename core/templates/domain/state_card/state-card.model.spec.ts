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

import {TestBed} from '@angular/core/testing';

import {AudioTranslationLanguageService} from 'pages/exploration-player-page/services/audio-translation-language.service';
import {CamelCaseToHyphensPipe} from 'filters/string-utility-filters/camel-case-to-hyphens.pipe';
import {
  InteractionBackendDict,
  InteractionObjectFactory,
} from 'domain/exploration/InteractionObjectFactory';
import {StateCard} from 'domain/state_card/state-card.model';
import {SubtitledUnicode} from 'domain/exploration/SubtitledUnicodeObjectFactory';
import {RecordedVoiceovers} from 'domain/exploration/recorded-voiceovers.model';
import {Voiceover} from 'domain/exploration/voiceover.model';
import {InteractionCustomizationArgs} from 'interactions/customization-args-defs';
import {Hint} from 'domain/exploration/hint-object.model';
import {SolutionObjectFactory} from 'domain/exploration/SolutionObjectFactory';
import {InteractionAnswer} from 'interactions/answer-defs';

describe('State card object factory', () => {
  let interactionObjectFactory: InteractionObjectFactory;
  let solutionObjectFactory: SolutionObjectFactory;
  let audioTranslationLanguageService: AudioTranslationLanguageService;
  let _sampleCard1: StateCard;
  let _sampleCard2: StateCard;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CamelCaseToHyphensPipe],
    });

    interactionObjectFactory = TestBed.inject(InteractionObjectFactory);
    solutionObjectFactory = TestBed.inject(SolutionObjectFactory);
    audioTranslationLanguageService = TestBed.inject(
      AudioTranslationLanguageService
    );

    let interactionDict: InteractionBackendDict = {
      answer_groups: [],
      confirmed_unclassified_answers: [],
      customization_args: {
        rows: {
          value: 1,
        },
        placeholder: {
          value: {
            unicode_str: 'Type your answer here.',
            content_id: '',
          },
        },
        catchMisspellings: {
          value: false,
        },
      },
      default_outcome: {
        dest: '(untitled state)',
        dest_if_really_stuck: null,
        feedback: {
          content_id: 'default_outcome',
          html: '',
        },
        param_changes: [],
        labelled_as_correct: false,
        refresher_exploration_id: null,
        missing_prerequisite_skill_id: null,
      },
      hints: [
        {
          hint_content: {
            content_id: 'abc',
            html: 'hint 1',
          },
        },
      ],
      id: 'TextInput',
      solution: {
        answer_is_exclusive: true,
        correct_answer: 'correct answer',
        explanation: {
          content_id: 'pqr',
          html: 'solution explanation',
        },
      },
    };
    _sampleCard1 = StateCard.createNewCard(
      'State 1',
      '<p>Content</p>',
      '<interaction></interaction>',
      interactionObjectFactory.createFromBackendDict(interactionDict),
      RecordedVoiceovers.createFromBackendDict({
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
      }),
      'content',
      audioTranslationLanguageService
    );
    _sampleCard2 = StateCard.createNewCard(
      'State 2',
      '<p>Content</p>',
      '',
      // This throws "Type null is not assignable to type
      // 'Interaction'." We need to suppress this error
      // because of the need to test validations.
      // @ts-ignore
      null,
      // This throws "Type null is not assignable to type
      // 'Interaction'." We need to suppress this error
      // because of the need to test validations.
      // @ts-ignore
      null,
      'content',
      audioTranslationLanguageService
    );
  });

  it('should be able to get the various fields', () => {
    expect(_sampleCard1.getStateName()).toEqual('State 1');
    expect(_sampleCard2.getStateName()).toEqual('State 2');
    expect(_sampleCard1.getContentHtml()).toEqual('<p>Content</p>');
    expect(_sampleCard2.getContentHtml()).toEqual('<p>Content</p>');
    expect(_sampleCard1.getInteraction().id).toEqual('TextInput');
    expect(_sampleCard1.getInteractionHtml()).toEqual(
      '<interaction></interaction>'
    );
    expect(_sampleCard1.getInputResponsePairs()).toEqual([]);
    expect(_sampleCard1.getLastInputResponsePair()).toBeNull();
    expect(_sampleCard1.getLastOppiaResponse()).toBeNull();
    expect(
      _sampleCard1.getRecordedVoiceovers().getBindableVoiceovers('content')
    ).toEqual({
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
    expect(_sampleCard1.getVoiceovers()).toEqual({
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

    expect(_sampleCard1.getInteractionId()).toEqual('TextInput');
    expect(_sampleCard2.getInteractionId()).toBeNull();
    expect(_sampleCard1.isTerminal()).toBeFalse();
    expect(_sampleCard1.isInteractionInline()).toBeTrue();
    expect(_sampleCard2.isInteractionInline()).toBeTrue();
    expect(_sampleCard1.getInteractionInstructions()).toBeNull();
    expect(_sampleCard2.getInteractionInstructions()).toBeNull();
    expect(_sampleCard1.getInteractionCustomizationArgs()).toEqual({
      rows: {value: 1},
      placeholder: {value: new SubtitledUnicode('Type your answer here.', '')},
      catchMisspellings: {value: false},
    });
    expect(_sampleCard2.getInteractionCustomizationArgs()).toBeNull();
    expect(_sampleCard1.getInteractionHtml()).toEqual(
      '<interaction></interaction>'
    );

    _sampleCard1.addInputResponsePair({
      oppiaResponse: 'response',
      learnerInput: '',
      isHint: false,
    });

    expect(_sampleCard1.getOppiaResponse(0)).toEqual('response');
    expect(_sampleCard1.getLastOppiaResponse()).toEqual('response');
    expect(_sampleCard1.getLastInputResponsePair()).toEqual({
      oppiaResponse: 'response',
      learnerInput: '',
      isHint: false,
    });
  });

  it('should add input response pair', () => {
    const responsePair1 = {
      oppiaResponse: 'pair_1',
      learnerInput: '',
      isHint: false,
    };
    _sampleCard1.addInputResponsePair(responsePair1);
    expect(_sampleCard1.getInputResponsePairs()).toEqual([responsePair1]);
  });

  it('should add not add response if input response pair is empty', () => {
    _sampleCard1._inputResponsePairs = [];
    _sampleCard1.setLastOppiaResponse('response');
    expect(_sampleCard1.getInputResponsePairs()).toEqual([]);
  });

  it('should be able to set the various fields', () => {
    _sampleCard1.setInteractionHtml('<interaction_2></interaction_2>');
    expect(_sampleCard1.getInteractionHtml()).toEqual(
      '<interaction_2></interaction_2>'
    );

    _sampleCard1.addInputResponsePair({
      oppiaResponse: 'response',
      learnerInput: '',
      isHint: false,
    });

    _sampleCard1.setLastOppiaResponse('response_3');
    expect(_sampleCard1.getLastOppiaResponse()).toEqual('response_3');
    _sampleCard1.addToExistingFeedback('response_4');
    expect(_sampleCard1.getLastOppiaResponse()).toEqual(
      'response_3\nresponse_4'
    );
  });

  it('should get the last answer or null if there is no last answer', () => {
    expect(_sampleCard1.getLastAnswer()).toBeNull();

    _sampleCard1.addInputResponsePair({
      oppiaResponse: 'response',
      learnerInput: 'learner input',
      isHint: false,
    });

    expect(_sampleCard1.getLastAnswer()).toEqual('learner input');
  });

  it('should get voiceovers when calling', () => {
    const expectedResults = {
      en: new Voiceover('filename1.mp3', 100000, false, 10),
      hi: new Voiceover('filename2.mp3', 11000, false, 0.11),
    };
    expect(_sampleCard1.getVoiceovers()).toEqual(expectedResults);
    expect(_sampleCard2.getVoiceovers()).toEqual({});
  });

  it('should get current interaction id when calling', () => {
    expect(_sampleCard1.getInteractionId()).toEqual('TextInput');
  });

  it('should get interaction customization arguments', () => {
    const expectedResults = {
      rows: {
        value: 1,
      },
      placeholder: {
        value: new SubtitledUnicode('Type your answer here.', ''),
      },
      catchMisspellings: {
        value: false,
      },
    } as InteractionCustomizationArgs;
    expect(_sampleCard1.getInteractionCustomizationArgs()).toEqual(
      expectedResults
    );
  });

  it('should check whether content audio translation is available', () => {
    spyOn(
      audioTranslationLanguageService,
      'isAutogeneratedAudioAllowed'
    ).and.returnValue(false);

    expect(_sampleCard1.isContentAudioTranslationAvailable()).toBeTrue();
    expect(_sampleCard2.isContentAudioTranslationAvailable()).toBeFalse();
  });

  it('should get all the hints from interaction', () => {
    let expectedResult = [
      Hint.createFromBackendDict({
        hint_content: {
          content_id: 'abc',
          html: 'hint 1',
        },
      }),
    ];

    expect(_sampleCard1.getHints()).toEqual(expectedResult);
  });

  it('should get interaction solution', () => {
    let expectedResult = solutionObjectFactory.createFromBackendDict({
      answer_is_exclusive: true,
      correct_answer: 'correct answer',
      explanation: {
        content_id: 'pqr',
        html: 'solution explanation',
      },
    });

    expect(_sampleCard1.getSolution()).toEqual(expectedResult);
  });

  it('should check whether interaction supports hints', () => {
    expect(_sampleCard1.doesInteractionSupportHints()).toBeTrue();
    expect(_sampleCard2.doesInteractionSupportHints()).toBeFalse();
  });

  it('should mark and unmark interaction as completed', () => {
    expect(_sampleCard1.isCompleted()).toBeFalse();

    _sampleCard1.markAsCompleted();
    expect(_sampleCard1.isCompleted()).toBeTrue();

    _sampleCard1.markAsNotCompleted();
    expect(_sampleCard1.isCompleted()).toBeFalse();
  });

  it('should be able to get and set content html', () => {
    expect(_sampleCard1.contentHtml).toEqual('<p>Content</p>');
    expect(_sampleCard2.contentHtml).toEqual('<p>Content</p>');

    _sampleCard1.contentHtml = '<p>Content 2</p>';
    _sampleCard2.contentHtml = '<p>Content 3</p>';

    expect(_sampleCard1.contentHtml).toEqual('<p>Content 2</p>');
    expect(_sampleCard2.contentHtml).toEqual('<p>Content 3</p>');
  });

  it('should be able to get content id', () => {
    expect(_sampleCard1.contentId).toEqual('content');
    expect(_sampleCard2.contentId).toEqual('content');
  });

  it('should restore every property of a state card immutably', () => {
    expect(_sampleCard1.getStateName()).toEqual('State 1');
    expect(_sampleCard1.getInteractionHtml()).toEqual(
      '<interaction></interaction>'
    );
    expect(_sampleCard1.getInteractionId()).not.toBeNull();

    _sampleCard1.restoreImmutable(_sampleCard2);

    expect(_sampleCard1.getStateName()).toEqual('State 2');
    expect(_sampleCard1.getInteractionHtml()).toEqual('');
    expect(_sampleCard1.getInteractionId()).toBeNull();
  });

  it('should not show a "no response error" by default', () => {
    expect(_sampleCard1.getInteraction().currentAnswer).toBeNull();
    expect(_sampleCard1.getInteraction().submitClicked).toBeFalse();
    expect(_sampleCard1.showNoResponseError()).toBeFalse();
  });

  it('should update current answer and toggle submit clicked to false', () => {
    _sampleCard1.getInteraction().submitClicked = true;
    _sampleCard1.updateCurrentAnswer('answer');

    expect(_sampleCard1.getInteraction().currentAnswer).toEqual('answer');
    expect(_sampleCard1.getInteraction().submitClicked).toBeFalse();
  });

  it('should not toggle submit clicked for "Continue" interaction', () => {
    _sampleCard1.getInteraction().id = 'Continue';

    _sampleCard1.toggleSubmitClicked(true);

    expect(_sampleCard1.getInteraction().submitClicked).toBeFalse();
  });

  it('should enable no response correctly', () => {
    const simulateInteraction = (currentAnswer: InteractionAnswer | null) => {
      _sampleCard1.updateCurrentAnswer(currentAnswer);
      _sampleCard1.toggleSubmitClicked(true);
    };

    simulateInteraction(null);
    expect(_sampleCard1.showNoResponseError()).toBeTrue();

    simulateInteraction([]);
    expect(_sampleCard1.showNoResponseError()).toBeTrue();

    simulateInteraction(['']);
    expect(_sampleCard1.showNoResponseError()).toBeFalse();

    simulateInteraction('');
    expect(_sampleCard1.showNoResponseError()).toBeTrue();

    simulateInteraction('ans');
    expect(_sampleCard1.showNoResponseError()).toBeFalse();

    simulateInteraction(0);
    expect(_sampleCard1.showNoResponseError()).toBeFalse();

    simulateInteraction(-1);
    expect(_sampleCard1.showNoResponseError()).toBeFalse();
  });
});
