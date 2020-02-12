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
import { UpgradedServices } from 'services/UpgradedServices';

require('pages/exploration-editor-page/services/graph-data.service');
require('pages/exploration-editor-page/services/exploration-property.service');
/* eslint-disable max-len */
require('pages/exploration-editor-page/services/exploration-init-state-name.service');
/* eslint-enable max-len */

describe('Graph Data Service', function() {
  var GraphDataService;
  var ExplorationInitStateNameService;
  var ExplorationStatesService;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.inject(function($injector) {
    GraphDataService = $injector.get('GraphDataService');
    ExplorationInitStateNameService = $injector.get(
      'ExplorationInitStateNameService');
    ExplorationStatesService = $injector.get('ExplorationStatesService');

    ExplorationStatesService.init({
      Hola: {
        content: {content_id: 'content', html: ''},
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {},
          },
        },
        param_changes: [],
        interaction: {
          answer_groups: [{
            rule_specs: [{rule_type: 'Contains', inputs: {x: 'hola'}}],
            outcome: {
              dest: 'Me Llamo',
              feedback: {
                content_id: 'feedback_1',
                html: 'buen trabajo!',
              },
              labelled_as_correct: true,
            },
          }],
          default_outcome: {
            dest: 'Hola',
            feedback: {
              content_id: 'default_outcome',
              html: 'try again!',
            },
            labelled_as_correct: false,
          },
          hints: [],
          id: 'TextInput',
          solution: null,
        },
        solicit_answer_details: false,
        written_translations: {
          translations_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {},
          },
        },
        classifier_model_id: 0,
      },
    });
  }));

  it('should recompute graph data', function() {
    var graphData = {
      finalStateIds: [],
      initStateId: 'property_1',
      links: [{
        source: 'Hola',
        target: 'Me Llamo'
      }, {
        source: 'Hola',
        target: 'Hola'
      }],
      nodes: { Hola: 'Hola' }
    };

    GraphDataService.recompute();
    expect(GraphDataService.getGraphData()).toBeNull();

    ExplorationInitStateNameService.init('property_1');
    GraphDataService.recompute();
    expect(GraphDataService.getGraphData()).toEqual(graphData);
  });
});
