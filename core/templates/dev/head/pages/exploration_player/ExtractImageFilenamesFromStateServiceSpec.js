// Copyright 2017 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for the extracting image files in state service.
 */

describe('Extracting Image file names in the state service', function() {
  beforeEach(function() {
    module('oppia');
    // Set a global value for INTERACTION_SPECS that will be used by all the
    // descendant dependencies.
    module(function($provide) {
      $provide.constant('INTERACTION_SPECS', {
        TextInput: {
          is_terminal: false
        },
        ItemSelectionInput: {
          is_terminal: false
        },
        MultipleChoiceInput: {
          is_terminal: false
        },
        Continue: {
          is_terminal: false
        },
        EndExploration: {
          is_terminal: true
        }
      });
    });
  });

  var eifss, eof, ecs;
  var $rootScope = null;
  beforeEach(inject(function($injector) {
    eof = $injector.get('ExplorationObjectFactory');
    ecs = $injector.get('ExplorationContextService');
    eifss = $injector.get('ExtractImageFilenamesFromStateService');
    spyOn(ecs, 'getExplorationId').and.returnValue('1');
    $rootScope = $injector.get('$rootScope');
  }));

  it('should get all the filenames of the images in a state',
    function() {
      var exploration = eof.createFromBackendDict(explorationDict);
      var states = exploration.getStates();
      var stateNames = states.getStateNames();
      stateNames.forEach(function(statename) {
        var filenamesInState = eifss.getImageFilenamesInState(states
          .getState(statename));
        filenamesInState.forEach(function(filename){
          expect(ImageFilenamesInExploration[statename]).toContain(filename);
        });
      });
    });
});
