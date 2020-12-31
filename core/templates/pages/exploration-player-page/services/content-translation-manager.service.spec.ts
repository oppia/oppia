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

import { TestBed } from '@angular/core/testing';

import { InteractionObjectFactory } from
  'domain/exploration/InteractionObjectFactory';
import { WrittenTranslationsObjectFactory } from
  'domain/exploration/WrittenTranslationsObjectFactory';
import { StateCardObjectFactory } from
  'domain/state_card/StateCardObjectFactory';
import { ContentTranslationManagerService } from
  'pages/exploration-player-page/services/content-translation-manager.service';
import { PlayerTranscriptService } from
  'pages/exploration-player-page/services/player-transcript.service';
import {ExplorationHtmlFormatterService} from
  'services/exploration-html-formatter.service'

describe('Content translation manager service', () => {
  let ctms: ContentTranslationManagerService;
  let ehfs: ExplorationHtmlFormatterService;
  let iof: InteractionObjectFactory;
  let pts: PlayerTranscriptService;
  let scof: StateCardObjectFactory;
  let wtof: WrittenTranslationsObjectFactory;

  const interactionHtml = (
    '<oppia-interactive-text-input ' +
    'placeholder-with-value="{&amp;quot;unicode_str&amp;quot;:&amp;quot;' +
    'enter here&amp;quot;,&amp;quot;content_id&amp;quot;:&amp;quot;&amp;' +
    'quot;}" rows-with-value="1" last-answer="lastAnswer">' +
    '</oppia-interactive-text-input>');

  beforeEach(() => {
    ctms = TestBed.get(ContentTranslationManagerService);
    ehfs = TestBed.get(ExplorationHtmlFormatterService);
    iof = TestBed.get(InteractionObjectFactory);
    pts = TestBed.get(PlayerTranscriptService);
    scof = TestBed.get(StateCardObjectFactory);
    wtof = TestBed.get(WrittenTranslationsObjectFactory);

    let defaultOutcomeDict = {
      dest: 'dest_default',
      feedback: {
        content_id: 'default_outcome',
        html: ''
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null
    };
    let answerGroupsDict = [{
      rule_specs: [],
      outcome: {
        dest: 'dest_1',
        feedback: {
          content_id: 'outcome_1',
          html: ''
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
          html: '<p>First Hint</p>',
          content_id: 'content_id1'
        }
      },
      {
        hint_content: {
          html: '<p>Second Hint</p>',
          content_id: 'content_id2'
        }
      }
    ];

    let solutionDict = {
      answer_is_exclusive: false,
      correct_answer: 'This is a correct answer!',
      explanation: {
        content_id: 'solution',
        html: 'This is the explanation to the answer'
      }
    };

    let interactionDict = {
      answer_groups: answerGroupsDict,
      confirmed_unclassified_answers: [],
      customization_args: {
        placeholder: {
          value: {
            content_id: 'ca_placeholder_0',
            unicode_str: 'Enter text'
          }
        },
        rows: { value: 1 }
      },
      default_outcome: defaultOutcomeDict,
      hints: hintsDict,
      id: 'TextInput',
      solution: solutionDict
    };

    let writtenTranslations = wtof.createFromBackendDict({
      translations_mapping: {
        content_1: {
          'hi-en': {
            data_format: 'html',
            translation: '',
            needs_update: false
          }
        }
      }
    });

    const interaction = iof.createFromBackendDict(interactionDict)

    pts.transcript = [
      scof.createNewCard(
        'State 1',
        '<p>en html</p>',
        ehfs.getInteractionHtml(
          interaction.id, interaction.customizationArgs, true, null),
        interaction,
        null,
        writtenTranslations,
        'content'
      )
    ];
  });

  it('should initialize the exploration language code', () => {
    ctms.init('en');
    expect(ctms._explorationLanguageCode).toBe('en');
  });

  it('should switch to a new language', () => {

  });

  it('should switch back to the original language', () => {

  });
});
