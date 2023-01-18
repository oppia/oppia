// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the content translation manager service.
 */

import { discardPeriodicTasks, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { InteractionObjectFactory } from 'domain/exploration/InteractionObjectFactory';
import { RecordedVoiceovers } from 'domain/exploration/recorded-voiceovers.model';
import { SubtitledUnicodeObjectFactory } from 'domain/exploration/SubtitledUnicodeObjectFactory';
import { StateCard } from 'domain/state_card/state-card.model';
import { ContentTranslationManagerService } from 'pages/exploration-player-page/services/content-translation-manager.service';
import { PlayerTranscriptService } from 'pages/exploration-player-page/services/player-transcript.service';
import { InteractionSpecsConstants } from 'pages/interaction-specs.constants';
import { ExplorationHtmlFormatterService } from 'services/exploration-html-formatter.service';
import { AudioTranslationLanguageService} from 'pages/exploration-player-page/services/audio-translation-language.service';
import { EntityTranslationBackendApiService } from 'pages/exploration-editor-page/services/entity-translation-backend-api.service';
import { EntityTranslation } from 'domain/translation/EntityTranslationObjectFactory';
import { TranslatedContent } from 'domain/exploration/TranslatedContentObjectFactory';
import { ImagePreloaderService } from 'pages/exploration-player-page/services/image-preloader.service';

describe('Content translation manager service', () => {
  let ctms: ContentTranslationManagerService;
  let ehfs: ExplorationHtmlFormatterService;
  let iof: InteractionObjectFactory;
  let pts: PlayerTranscriptService;
  let suof: SubtitledUnicodeObjectFactory;
  let atls: AudioTranslationLanguageService;
  let etbs: EntityTranslationBackendApiService;
  let entityTranslation: EntityTranslation;
  let imagePreloaderService: ImagePreloaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    }).compileComponents();
    ctms = TestBed.inject(ContentTranslationManagerService);
    ehfs = TestBed.inject(ExplorationHtmlFormatterService);
    iof = TestBed.inject(InteractionObjectFactory);
    pts = TestBed.inject(PlayerTranscriptService);
    suof = TestBed.inject(SubtitledUnicodeObjectFactory);
    atls = TestBed.inject(AudioTranslationLanguageService);
    etbs = TestBed.inject(EntityTranslationBackendApiService);
    imagePreloaderService = TestBed.inject(ImagePreloaderService);

    entityTranslation = EntityTranslation.createFromBackendDict({
      entity_id: 'exp',
      entity_type: 'exploration',
      entity_version: 5,
      language_code: 'fr',
      translations: {
        content: {
          content_format: 'html',
          content_value: '<p>fr content</p>',
          needs_update: false
        },
        hint_0: {
          content_format: 'html',
          content_value: '<p>fr hint</p>',
          needs_update: false
        },
        solution: {
          content_format: 'html',
          content_value: '<p>fr solution</p>',
          needs_update: false
        },
        ca_placeholder_0: {
          content_format: 'unicode',
          content_value: 'fr placeholder',
          needs_update: false
        },
        outcome_1: {
          content_format: 'html',
          content_value: '<p>fr feedback</p>',
          needs_update: false
        },
        default_outcome: {
          content_format: 'html',
          content_value: '<p>fr default outcome</p>',
          needs_update: false
        },
        rule_input_3: {
          content_format: 'set_of_normalized_string',
          content_value: ['fr rule input 1', 'fr rule input 2'],
          needs_update: false
        }
      }
    });
    spyOn(etbs, 'fetchEntityTranslationAsync').and.returnValue(
      Promise.resolve(entityTranslation)
    );
    spyOn(imagePreloaderService, 'restartImagePreloader').and.returnValue(
      undefined);

    let defaultOutcomeDict = {
      dest: 'dest_default',
      dest_if_really_stuck: null,
      feedback: {
        content_id: 'default_outcome',
        html: '<p>en default outcome</p>'
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null
    };
    let answerGroupsDict = [{
      rule_specs: [{
        inputs: {
          x: {
            contentId: 'rule_input_3',
            normalizedStrSet: ['InputString']
          }
        },
        rule_type: 'Equals'
      }],
      outcome: {
        dest: 'dest_1',
        dest_if_really_stuck: null,
        feedback: {
          content_id: 'outcome_1',
          html: '<p>en feedback</p>'
        },
        labelled_as_correct: false,
        param_changes: [],
        refresher_exploration_id: null,
        missing_prerequisite_skill_id: null
      },
      training_data: ['training_data'],
      tagged_skill_misconception_id: 'skill_id-1'
    }];
    let hintsDict = [
      {
        hint_content: {
          html: '<p>en hint</p>',
          content_id: 'hint_0'
        }
      }
    ];

    let solutionDict = {
      answer_is_exclusive: false,
      correct_answer: 'This is a correct answer!',
      explanation: {
        content_id: 'solution',
        html: '<p>en solution</p>'
      }
    };

    let interactionDict = {
      answer_groups: answerGroupsDict,
      confirmed_unclassified_answers: [],
      customization_args: {
        placeholder: {
          value: {
            content_id: 'ca_placeholder_0',
            unicode_str: 'en placeholder'
          }
        },
        rows: { value: 1 },
        catchMisspellings: {
          value: false
        }
      },
      default_outcome: defaultOutcomeDict,
      hints: hintsDict,
      id: 'TextInput',
      solution: solutionDict
    };

    const interaction = iof.createFromBackendDict(interactionDict);

    pts.addNewCard(
      StateCard.createNewCard(
        'State 1',
        '<p>en content</p>',
        ehfs.getInteractionHtml(
          interaction.id as string,
          interaction.customizationArgs,
          true,
          null,
          null
        ),
        interaction,
        RecordedVoiceovers.createEmpty(),
        'content',
        atls
      )
    );
  });

  it('should switch to a new language', fakeAsync(() => {
    ctms.setOriginalTranscript('en');
    ctms.displayTranslations('fr');
    tick();

    const card = pts.transcript[0];
    const interaction = card.getInteraction();
    const translatedCustomizationArgs = {
      placeholder: {
        value: suof.createFromBackendDict({
          unicode_str: 'fr placeholder',
          content_id: 'ca_placeholder_0'
        })
      },
      rows: {value: 1},
      catchMisspellings: {
        value: false
      }
    };

    expect(card.contentHtml).toBe('<p>fr content</p>');
    expect(interaction.hints[0].hintContent.html).toBe('<p>fr hint</p>');
    expect(interaction.solution?.explanation.html).toBe('<p>fr solution</p>');
    expect(interaction.customizationArgs).toEqual(translatedCustomizationArgs);
    expect(interaction.answerGroups[0].outcome.feedback.html).toBe(
      '<p>fr feedback</p>');
    expect(interaction.answerGroups[0].rules[0].inputs.x).toEqual({
      contentId: 'rule_input_3',
      normalizedStrSet: ['fr rule input 1', 'fr rule input 2']
    });
    expect(interaction.defaultOutcome?.feedback.html).toBe(
      '<p>fr default outcome</p>');
    discardPeriodicTasks();
  }));

  it('should switch to a new language expect invalid translations', fakeAsync(
    () => {
      ctms.setOriginalTranscript('en');
      const card = pts.transcript[0];
      const interaction = card.getInteraction();
      const translatedCustomizationArgs = {
        placeholder: {
          value: suof.createFromBackendDict({
            unicode_str: 'fr placeholder',
            content_id: 'ca_placeholder_0'
          })
        },
        rows: {value: 1},
        catchMisspellings: {
          value: false
        }
      };

      entityTranslation.markTranslationAsNeedingUpdate('hint_0');
      etbs.fetchEntityTranslationAsync = jasmine.createSpy().and.returnValue(
        Promise.resolve(entityTranslation)
      );
      ctms.displayTranslations('fr');
      tick();

      expect(card.contentHtml).toBe('<p>fr content</p>');
      expect(interaction.hints[0].hintContent.html).toBe('<p>fr hint</p>');
      expect(interaction.solution?.explanation.html).toBe('<p>fr solution</p>');
      expect(interaction.customizationArgs).toEqual(
        translatedCustomizationArgs);
      expect(interaction.answerGroups[0].outcome.feedback.html).toBe(
        '<p>fr feedback</p>');
      expect(interaction.answerGroups[0].rules[0].inputs.x).toEqual({
        contentId: 'rule_input_3',
        normalizedStrSet: ['fr rule input 1', 'fr rule input 2']
      });
      expect(interaction.defaultOutcome?.feedback.html).toBe(
        '<p>fr default outcome</p>');
      discardPeriodicTasks();
    }));

  it('should switch back to the original language', fakeAsync(() => {
    ctms.setOriginalTranscript('en');
    ctms.displayTranslations('fr');
    tick();
    ctms.displayTranslations('en');

    const card = pts.transcript[0];
    const interaction = card.getInteraction();
    const originalCustomizationArgs = {
      placeholder: {
        value: suof.createFromBackendDict({
          unicode_str: 'en placeholder',
          content_id: 'ca_placeholder_0'
        })
      },
      rows: {value: 1},
      catchMisspellings: {
        value: false
      }
    };

    expect(card.contentHtml).toBe('<p>en content</p>');
    expect(interaction.hints[0].hintContent.html).toBe('<p>en hint</p>');
    expect(interaction.solution?.explanation.html).toBe('<p>en solution</p>');
    expect(interaction.customizationArgs).toEqual(originalCustomizationArgs);
    expect(interaction.answerGroups[0].outcome.feedback.html).toBe(
      '<p>en feedback</p>');
    expect(interaction.answerGroups[0].rules[0].inputs.x).toEqual({
      contentId: 'rule_input_3',
      normalizedStrSet: ['InputString']
    });
    expect(interaction.defaultOutcome?.feedback.html).toBe(
      '<p>en default outcome</p>');
    discardPeriodicTasks();
  }));

  it('should emit to onStateCardContentUpdateEmitter when the ' +
     'language is changed', fakeAsync(() => {
    const onStateCardContentUpdate = spyOn(
      ctms.onStateCardContentUpdate, 'emit');
    ctms.setOriginalTranscript('en');
    ctms.displayTranslations('fr');
    tick();

    expect(onStateCardContentUpdate).toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('should not switch rules if the replacement is empty', () => {
    let newInteractionDict = {
      answer_groups: [{
        rule_specs: [{
          inputs: {
            x: {
              contentId: 'rule_input_3',
              normalizedStrSet: ['InputString']
            }
          },
          rule_type: 'Equals'
        }],
        outcome: {
          dest: 'dest_1',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'outcome_1',
            html: '<p>en feedback</p>'
          },
          labelled_as_correct: false,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null
        },
        training_data: [],
        tagged_skill_misconception_id: null
      }],
      confirmed_unclassified_answers: [],
      customization_args: {
        placeholder: {
          value: {
            content_id: 'ca_placeholder_0',
            unicode_str: 'en placeholder'
          }
        },
        rows: { value: 1 },
        catchMisspellings: {
          value: false
        }
      },
      default_outcome: null,
      hints: [],
      id: 'TextInput',
      solution: null
    };

    pts.init();
    const newInteraction = iof.createFromBackendDict(newInteractionDict);
    pts.addNewCard(
      StateCard.createNewCard(
        'State 1',
        '<p>en content</p>',
        ehfs.getInteractionHtml(
          newInteraction.id as string,
          newInteraction.customizationArgs,
          true,
          null,
          null),
        newInteraction,
        RecordedVoiceovers.createEmpty(),
        'content',
        atls
      )
    );

    ctms.setOriginalTranscript('en');
    ctms.displayTranslations('fr');
    expect(newInteraction.answerGroups[0].rules[0].inputs.x).toEqual({
      contentId: 'rule_input_3',
      normalizedStrSet: ['InputString']
    });
  });

  describe('with custom INTERACTION_SPECS cases', () => {
    beforeAll(() => {
      // This throws a error. We need to suppress this error because
      // "Property 'DummyInteraction' does not exist on type".
      // @ts-expect-error
      InteractionSpecsConstants.INTERACTION_SPECS.DummyInteraction = {
        customization_arg_specs: [{
          name: 'dummyCustArg',
          schema: {
            type: 'list',
            items: {
              type: 'dict',
              properties: [{
                name: 'content',
                schema: {
                  type: 'custom',
                  obj_type: 'SubtitledUnicode'
                }
              }, {
                name: 'show',
                schema: {
                  type: 'boolean'
                }
              }]
            }
          }
        }]
      };
    });

    afterAll(() => {
      // This throws a error. We need to suppress this error because
      // "Property 'DummyInteraction' does not exist on type".
      // @ts-expect-error
      delete InteractionSpecsConstants.INTERACTION_SPECS.DummyInteraction;
    });

    it('should replace translatable customization args', fakeAsync(() => {
      const card = pts.transcript[0];
      const interaction = card.getInteraction();

      entityTranslation.translationMapping.ca_0 = new TranslatedContent(
        'fr 1', 'unicode', false);
      entityTranslation.translationMapping.ca_1 = new TranslatedContent(
        'fr 2', 'unicode', false);

      etbs.fetchEntityTranslationAsync = jasmine.createSpy().and.returnValue(
        Promise.resolve(entityTranslation)
      );

      interaction.id = 'DummyInteraction';
      interaction.customizationArgs = {
        dummyCustArg: {value: [{
          content: suof.createFromBackendDict({
            unicode_str: 'first',
            content_id: 'ca_0'
          }),
          show: true
        },
        {
          content: suof.createFromBackendDict({
            unicode_str: 'first',
            content_id: 'ca_1'
          }),
          show: true
        }]}
      };

      ctms.setOriginalTranscript('en');
      ctms.displayTranslations('fr');
      tick();

      expect(interaction.customizationArgs).toEqual({
        dummyCustArg: {value: [{
          content: suof.createFromBackendDict({
            unicode_str: 'fr 1',
            content_id: 'ca_0'
          }),
          show: true
        },
        {
          content: suof.createFromBackendDict({
            unicode_str: 'fr 2',
            content_id: 'ca_1'
          }),
          show: true
        }]}
      });
      discardPeriodicTasks();
    }));
  });
});
