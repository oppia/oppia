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
 * @fileoverview Unit tests for GraphDataService.
 */
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { GraphDataService } from 'pages/exploration-editor-page/services/graph-data.service';
import { ExplorationInitStateNameService } from 'pages/exploration-editor-page/services/exploration-init-state-name.service';
import { ExplorationStatesService } from 'pages/exploration-editor-page/services/exploration-states.service';


describe('Graph Data Service', () => {
  let graphDataService: GraphDataService;
  let explorationInitStateNameService: ExplorationInitStateNameService;
  let explorationStatesService: ExplorationStatesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    graphDataService = TestBed.get(GraphDataService);
    explorationInitStateNameService = TestBed.get(
      ExplorationInitStateNameService);
    explorationStatesService = TestBed.get(ExplorationStatesService);

    explorationStatesService.init({
      Hola: {
        content: {content_id: 'content', html: ''},
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {},
            rule_input: {}
          },
        },
        param_changes: [],
        interaction: {
          confirmed_unclassified_answers: [],
          answer_groups: [{
            rule_specs: [{
              rule_type: 'Contains',
              inputs: {
                x: {
                  contentId: 'rule_input',
                  normalizedStrSet: ['hola']
                }
              }
            }],
            outcome: {
              dest: 'Me Llamo',
              dest_if_really_stuck: 'Me Llamo',
              feedback: {
                content_id: 'feedback_1',
                html: 'buen trabajo!',
              },
              labelled_as_correct: true,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null
            },
            training_data: [],
            tagged_skill_misconception_id: null
          }],
          customization_args: {
            placeholder: {
              value: {
                content_id: 'ca_placeholder_0',
                unicode_str: ''
              }
            },
            rows: { value: 1 },
            catchMisspellings: {
              value: false
            }
          },
          default_outcome: {
            dest: 'Hola',
            dest_if_really_stuck: 'Hola',
            feedback: {
              content_id: 'default_outcome',
              html: 'try again!',
            },
            labelled_as_correct: true,
            param_changes: [],
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null
          },
          hints: [],
          id: 'TextInput',
          solution: null,
        },
        linked_skill_id: null,
        solicit_answer_details: false,
        classifier_model_id: '0',
        card_is_checkpoint: false,
      },
    }, false);
  });

  it('should recompute graph data', () => {
    var graphData = {
      finalStateIds: [],
      initStateId: 'property_1',
      links: [{
        source: 'Hola',
        target: 'Me Llamo',
        linkProperty: null,
        connectsDestIfStuck: false
      }, {
        source: 'Hola',
        target: 'Me Llamo',
        linkProperty: null,
        connectsDestIfStuck: true
      }, {
        source: 'Hola',
        target: 'Hola',
        linkProperty: null,
        connectsDestIfStuck: false
      }, {
        source: 'Hola',
        target: 'Hola',
        linkProperty: null,
        connectsDestIfStuck: true
      }],
      nodes: { Hola: 'Hola' }
    };

    graphDataService.recompute();
    expect(graphDataService.getGraphData()).toBeUndefined();

    explorationInitStateNameService.init('property_1');
    graphDataService.recompute();
    expect(graphDataService.getGraphData()).toEqual(graphData);
  });
});
