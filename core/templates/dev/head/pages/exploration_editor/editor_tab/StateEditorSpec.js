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
 * @fileoverview Unit tests for the controller of the 'State Editor'.
 */

describe('State Editor controller', function() {
  describe('StateEditor', function() {
    var scope, ecs, ess, scs;

    beforeEach(module('oppia'));
    beforeEach(inject(function($controller, $injector, $rootScope) {
      scope = $rootScope.$new();
      ecs = $injector.get('EditorStateService');
      ess = $injector.get('ExplorationStatesService');
      scs = $injector.get('StateContentService');

      ess.init({
        'First State': {
          content: {
            html: 'First State Content',
            audio_translations: {}
          },
          interaction: {
            id: 'TextInput',
            answer_groups: [{
              rule_specs: [],
              outcome: {
                dest: 'unused',
                feedback: [],
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null
              }
            }],
            default_outcome: {
              dest: 'default',
              feedback: [],
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
            },
            hints: []
          },
          param_changes: []
        },
        'Second State': {
          content: {
            html: 'Second State Content',
            audio_translations: {}
          },
          interaction: {
            id: 'TextInput',
            answer_groups: [{
              rule_specs: [],
              outcome: {
                dest: 'unused',
                feedback: [],
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null
              }
            }],
            default_outcome: {
              dest: 'default',
              feedback: [],
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
            },
            hints: []
          },
          param_changes: []
        },
        'Third State': {
          content: {
            html: 'This is some content.',
            audio_translations: {}
          },
          interaction: {
            id: 'TextInput',
            answer_groups: [{
              rule_specs: [],
              outcome: {
                dest: 'unused',
                feedback: [],
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null
              }
            }],
            default_outcome: {
              dest: 'default',
              feedback: [],
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
            },
            hints: []
          },
          param_changes: [{
            name: 'comparison',
            generator_id: 'Copier',
            customization_args: {
              value: 'something clever',
              parse_with_jinja: false
            }
          }]
        }
      });

      $controller('StateEditor', {
        $scope: scope,
        ExplorationStatesService: ess
      });
    }));

    it('should initialize the state name and related properties', function() {
      ecs.setActiveStateName('Third State');
      scope.initStateEditor();
      expect(scs.savedMemento.getHtml()).toEqual('This is some content.');
    });
  });
});
