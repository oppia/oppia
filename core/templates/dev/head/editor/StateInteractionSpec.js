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
 * @fileoverview Unit tests for the controller of 'State Interactions'.
 *
 * @author bhenning@google.com (Ben Henning)
 */

describe('State Interaction controller', function() {

  describe('StateInteraction', function() {
    var scope, interCtrl, stateCtrl, ecs, cls, ess;

    beforeEach(function() {
      module('oppia');
    });

    beforeEach(inject(function($rootScope, $controller, $injector) {

      scope = $rootScope.$new();
      ecs = $injector.get('editorContextService');
      cls = $injector.get('changeListService');
      ess = $injector.get('explorationStatesService');

      ess.setStates({
        'First State': {
          content: [{
            type: 'text',
            value: 'First State Content'
          }],
          interaction: {
            id: 'TextInput',
            handlers: [{
              rule_specs: [{
                dest: 'End State'
              }]
            }]
          },
          param_changes: []
        },
        'End State': {
          content: [{
            type: 'text',
            value: ''
          }],
          interaction: {
            id: 'TextInput',
            handlers: [{
              rule_specs: [{
                dest: 'End State'
              }]
            }]
          },
          param_changes: []
        },
      });

      stateCtrl = $controller('StateEditor', {
        $scope: scope,
        editorContextService: ecs,
        changeListService: cls,
        explorationStatesService: ess,
        editabilityService: {
          isEditable: function() {
            return true;
          }
        },
        INTERACTION_SPECS: {
          TextInput: {
            display_mode: 'inline',
            is_terminal: false
          }
        }
      });

      interCtrl = $controller('StateInteraction', {
        $scope: scope,
        editorContextService: ecs,
        changeListService: cls,
        explorationStatesService: ess,
        editabilityService: {
          isEditable: function() {
            return true;
          }
        },
        INTERACTION_SPECS: {
          TextInput: {
            display_mode: 'inline',
            is_terminal: false
          }
        }
      });
    }));

    it('should keep non-empty content when setting EndExploration', function() {
      ecs.setActiveStateName('First State');
      scope.initStateEditor();
      
      var state = ess.getState('First State');
      state.interaction.id = 'EndExploration';
      ess.setState('First State', state);
      scope.updateEndExplorationDefaultContent(true);

      expect(ess.getState('First State').content[0].value).toEqual('First State Content');
      expect(ess.getState('First State').interaction.id).toEqual('EndExploration');
    });

    it('should change to default text when adding EndExploration', function() {
      ecs.setActiveStateName('End State');
      scope.initStateEditor();
      
      var state = ess.getState('End State');
      state.interaction.id = 'EndExploration';
      ess.setState('End State', state);
      scope.updateEndExplorationDefaultContent(true);

      expect(state.content[0].value).toEqual('');
      expect(ess.getState('End State').content[0].value).toEqual('Congratulations, you have finished!');
      expect(ess.getState('End State').interaction.id).toEqual('EndExploration');
    });
  });
});
