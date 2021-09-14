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
 * @fileoverview Unit tests for the Compare versions Service.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// compare-versions.service.ts is upgraded to Angular 8.
import { ExplorationSnapshot, VersionTreeService } from
  'pages/exploration-editor-page/history-tab/services/version-tree.service';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
// ^^^ This block is to be removed.
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { TranslatorProviderForTests } from 'tests/unit-test-utils.ajs';

require(
  'pages/exploration-editor-page/history-tab/services/' +
  'compare-versions.service.ts');

describe('Compare versions service', function() {
  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  describe('compare versions service', function() {
    var cvs = null;
    let vts: VersionTreeService = null;
    var $httpBackend = null;
    var mockExplorationData = null;
    let httpTestingController: HttpTestingController;

    beforeEach(
      angular.mock.module('oppia', TranslatorProviderForTests));
    beforeEach(function() {
      mockExplorationData = {
        explorationId: '0'
      };
      angular.mock.module(function($provide) {
        $provide.value('ExplorationDataService', [mockExplorationData][0]);
      });
    });

    beforeEach(angular.mock.inject(function($injector) {
      cvs = $injector.get('CompareVersionsService');
      vts = $injector.get('VersionTreeService');
      $httpBackend = $injector.get('$httpBackend');
      httpTestingController = TestBed.get(HttpTestingController);
    }));

    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
      httpTestingController.verify();
    });

    // Helper function to get states data to pass to getDiffGraphData().
    // states is an object whose keys are state names and whose values are
    //  - contentStr: string which is the text content of the state
    //  - ruleDests: a list of strings which are state names of destinations of
    //    links
    // Only information accessed by getDiffGraphData is included in the return
    // value.
    var _getStatesData = function(statesDetails) {
      var statesData = {};
      for (var stateName in statesDetails) {
        var newStateData = {
          content: {
            content_id: 'content',
            html: statesDetails[stateName].contentStr
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
            }
          },
          interaction: {
            id: 'EndExploration',
            answer_groups: [],
            default_outcome: {
              dest: 'default',
              feedback: {
                content_id: 'default_outcome',
                html: ''
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
            },
            hints: []
          },
          param_changes: [],
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {}
            }
          },
        };
        newStateData.interaction.answer_groups =
          statesDetails[stateName].ruleDests.map(function(ruleDestName) {
            return {
              outcome: {
                dest: ruleDestName,
                feedback: [],
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null
              },
              rule_specs: [],
            };
          });
        statesData[stateName] = newStateData;
      }
      return {
        exploration: {
          states: statesData
        }
      };
    };

    const testSnapshots1: ExplorationSnapshot[] = [{
      commit_type: 'create',
      version_number: 1,
      committer_id: 'admin',
      commit_message: 'Commit message',
      created_on_ms: 1592229964515.148,
      commit_cmds: []
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'edit_state_property',
        state_name: 'A',
        new_value: {
          content_id: 'content',
          html: 'Some text'
        },
        old_value: {
          content_id: 'content',
          html: ''
        },
        property_name: 'property'
      }],
      version_number: 2,
      committer_id: 'admin',
      commit_message: 'Commit message',
      created_on_ms: 1592229964515.148,
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'rename_state',
        new_state_name: 'B',
        old_state_name: 'A'
      }],
      version_number: 3,
      committer_id: 'admin',
      commit_message: 'Commit message',
      created_on_ms: 1592229964515.148,
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'rename_state',
        new_state_name: 'A',
        old_state_name: 'B'
      }],
      version_number: 4,
      committer_id: 'admin',
      commit_message: 'Commit message',
      created_on_ms: 1592229964515.148,
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'add_state',
        state_name: 'B'
      }],
      version_number: 5,
      committer_id: 'admin',
      commit_message: 'Commit message',
      created_on_ms: 1592229964515.148,
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'rename_state',
        new_state_name: 'C',
        old_state_name: 'B'
      }],
      version_number: 6,
      committer_id: 'admin',
      commit_message: 'Commit message',
      created_on_ms: 1592229964515.148,
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'edit_state_property',
        state_name: 'C',
        new_value: {
          content_id: 'content',
          html: 'More text'
        },
        old_value: {
          content_id: 'content',
          html: ''
        },
        property_name: 'property'
      }],
      version_number: 7,
      committer_id: 'admin',
      commit_message: 'Commit message',
      created_on_ms: 1592229964515.148,
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'add_state',
        state_name: 'B'
      }],
      version_number: 8,
      committer_id: 'admin',
      commit_message: 'Commit message',
      created_on_ms: 1592229964515.148,
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'delete_state',
        state_name: 'B'
      }],
      version_number: 9,
      committer_id: 'admin',
      commit_message: 'Commit message',
      created_on_ms: 1592229964515.148,
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'add_state',
        state_name: 'B'
      }],
      version_number: 10,
      committer_id: 'admin',
      commit_message: 'Commit message',
      created_on_ms: 1592229964515.148,
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'edit_state_property',
        state_name: 'A',
        new_value: {
          content_id: 'content',
          html: ''
        },
        old_value: {
          content_id: 'content',
          html: 'Some text'
        },
        property_name: 'property'
      }],
      version_number: 11,
      committer_id: 'admin',
      commit_message: 'Commit message',
      created_on_ms: 1592229964515.148,
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'rename_state',
        new_state_name: 'D',
        old_state_name: 'A'
      }],
      version_number: 12,
      committer_id: 'admin',
      commit_message: 'Commit message',
      created_on_ms: 1592229964515.148,
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'delete_state',
        state_name: 'D'
      }],
      version_number: 13,
      committer_id: 'admin',
      commit_message: 'Commit message',
      created_on_ms: 1592229964515.148,
    }];

    // Information for mock state data for getDiffGraphData() to be passed to
    // _getStatesData.
    var testExplorationData1 = [{
      A: {
        contentStr: '',
        ruleDests: ['A']
      }
    }, {
      A: {
        contentStr: 'Some text',
        ruleDests: ['A']
      }
    }, {
      B: {
        contentStr: 'Some text',
        ruleDests: ['B']
      }
    }, {
      A: {
        contentStr: 'Some text',
        ruleDests: ['A']
      }
    }, {
      A: {
        contentStr: 'Some text',
        ruleDests: ['A']
      },
      B: {
        contentStr: '',
        ruleDests: ['B']
      }
    }, {
      A: {
        contentStr: 'Some text',
        ruleDests: ['A']
      },
      C: {
        contentStr: '',
        ruleDests: ['C']
      }
    }, {
      A: {
        contentStr: 'Some text',
        ruleDests: ['A']
      },
      C: {
        contentStr: 'More text',
        ruleDests: ['C']
      }
    }, {
      A: {
        contentStr: 'Some text',
        ruleDests: ['A']
      },
      B: {
        contentStr: '',
        ruleDests: ['B']
      },
      C: {
        contentStr: 'More text',
        ruleDests: ['C']
      }
    }, {
      A: {
        contentStr: 'Some text',
        ruleDests: ['A']
      },
      C: {
        contentStr: 'More text',
        ruleDests: ['C']
      }
    }, {
      A: {
        contentStr: 'Some text',
        ruleDests: ['A']
      },
      B: {
        contentStr: 'Added text',
        ruleDests: ['B']
      },
      C: {
        contentStr: 'More text',
        ruleDests: ['C']
      }
    }, {
      A: {
        contentStr: '',
        ruleDests: ['A']
      },
      B: {
        contentStr: 'Added text',
        ruleDests: ['B']
      },
      C: {
        contentStr: 'More text',
        ruleDests: ['C']
      }
    }, {
      B: {
        contentStr: 'Added text',
        ruleDests: ['B']
      },
      C: {
        contentStr: 'More text',
        ruleDests: ['C']
      },
      D: {
        contentStr: '',
        ruleDests: ['D']
      }
    }, {
      B: {
        contentStr: 'Added text',
        ruleDests: ['B']
      },
      C: {
        contentStr: 'More text',
        ruleDests: ['C']
      }
    }];

    // Tests for getDiffGraphData on linear commits.
    it('should detect changed, renamed and added states', fakeAsync(() => {
      vts.init(testSnapshots1);
      var nodeData = null;
      cvs.getDiffGraphData(1, 7).then(function(data) {
        nodeData = data.nodes;
        expect(nodeData).toEqual({
          1: {
            newestStateName: 'A',
            stateProperty: 'changed',
            originalStateName: 'A'
          },
          2: {
            newestStateName: 'C',
            stateProperty: 'added',
            originalStateName: 'B'
          }
        });
      });

      const req = httpTestingController.expectOne('/explorehandler/init/0?v=1');
      expect(req.request.method).toEqual('GET');
      req.flush(_getStatesData(testExplorationData1[0]));

      const req2 = httpTestingController.expectOne(
        '/explorehandler/init/0?v=7');
      expect(req2.request.method).toEqual('GET');
      req2.flush(_getStatesData(testExplorationData1[6]));

      flushMicrotasks();
    }));

    it('should add new state with same name as old name of renamed state',
      fakeAsync(() => {
        vts.init(testSnapshots1);
        var nodeData = null;
        cvs.getDiffGraphData(5, 8).then(function(data) {
          nodeData = data.nodes;
          expect(nodeData).toEqual({
            1: {
              newestStateName: 'A',
              stateProperty: 'unchanged',
              originalStateName: 'A'
            },
            2: {
              newestStateName: 'C',
              stateProperty: 'changed',
              originalStateName: 'B'
            },
            3: {
              newestStateName: 'B',
              stateProperty: 'added',
              originalStateName: 'B'
            }
          });
        });

        const req = httpTestingController.expectOne(
          '/explorehandler/init/0?v=5');
        expect(req.request.method).toEqual('GET');
        req.flush(_getStatesData(testExplorationData1[4]));

        const req2 = httpTestingController.expectOne(
          '/explorehandler/init/0?v=8');
        expect(req2.request.method).toEqual('GET');
        req2.flush(_getStatesData(testExplorationData1[7]));

        flushMicrotasks();
      }));

    it('should not include added, then deleted state', fakeAsync(() => {
      vts.init(testSnapshots1);
      var nodeData = null;
      cvs.getDiffGraphData(7, 9).then(function(data) {
        nodeData = data.nodes;
        expect(nodeData).toEqual({
          1: {
            newestStateName: 'A',
            stateProperty: 'unchanged',
            originalStateName: 'A'
          },
          2: {
            newestStateName: 'C',
            stateProperty: 'unchanged',
            originalStateName: 'C'
          }
        });
      });

      const req = httpTestingController.expectOne('/explorehandler/init/0?v=7');
      expect(req.request.method).toEqual('GET');
      req.flush(_getStatesData(testExplorationData1[6]));

      const req2 = httpTestingController.expectOne(
        '/explorehandler/init/0?v=9');
      expect(req2.request.method).toEqual('GET');
      req2.flush(_getStatesData(testExplorationData1[8]));

      flushMicrotasks();
    }));

    it('should mark deleted then added states as changed', fakeAsync(() => {
      vts.init(testSnapshots1);
      var nodeData = null;
      cvs.getDiffGraphData(8, 10).then(function(data) {
        nodeData = data.nodes;
        expect(nodeData).toEqual({
          1: {
            newestStateName: 'A',
            stateProperty: 'unchanged',
            originalStateName: 'A'
          },
          2: {
            newestStateName: 'B',
            stateProperty: 'changed',
            originalStateName: 'B'
          },
          3: {
            newestStateName: 'C',
            stateProperty: 'unchanged',
            originalStateName: 'C'
          }
        });
      });

      const req = httpTestingController.expectOne('/explorehandler/init/0?v=8');
      expect(req.request.method).toEqual('GET');
      req.flush(_getStatesData(testExplorationData1[7]));

      const req2 = httpTestingController.expectOne(
        '/explorehandler/init/0?v=10');
      expect(req2.request.method).toEqual('GET');
      req2.flush(_getStatesData(testExplorationData1[9]));

      flushMicrotasks();
    }));

    it('should mark renamed then deleted states as deleted', fakeAsync(() => {
      vts.init(testSnapshots1);
      var nodeData = null;
      cvs.getDiffGraphData(11, 13).then(function(data) {
        nodeData = data.nodes;
        expect(nodeData).toEqual({
          1: {
            newestStateName: 'D',
            stateProperty: 'deleted',
            originalStateName: 'A'
          },
          2: {
            newestStateName: 'B',
            stateProperty: 'unchanged',
            originalStateName: 'B'
          },
          3: {
            newestStateName: 'C',
            stateProperty: 'unchanged',
            originalStateName: 'C'
          }
        });
      });

      const req = httpTestingController.expectOne(
        '/explorehandler/init/0?v=11');
      expect(req.request.method).toEqual('GET');
      req.flush(_getStatesData(testExplorationData1[10]));

      const req2 = httpTestingController.expectOne(
        '/explorehandler/init/0?v=13');
      expect(req2.request.method).toEqual('GET');
      req2.flush(_getStatesData(testExplorationData1[12]));

      flushMicrotasks();
    }));

    it('should mark changed state as unchanged when name and content is same' +
       'on both versions', fakeAsync(() => {
      vts.init(testSnapshots1);
      var nodeData = null;
      cvs.getDiffGraphData(1, 11).then(function(data) {
        nodeData = data.nodes;
        expect(nodeData).toEqual({
          1: {
            newestStateName: 'A',
            stateProperty: 'unchanged',
            originalStateName: 'A'
          },
          2: {
            newestStateName: 'C',
            stateProperty: 'added',
            originalStateName: 'B'
          },
          3: {
            newestStateName: 'B',
            stateProperty: 'added',
            originalStateName: 'B'
          }
        });
      });

      const req = httpTestingController.expectOne('/explorehandler/init/0?v=1');
      expect(req.request.method).toEqual('GET');
      req.flush(_getStatesData(testExplorationData1[0]));

      const req2 = httpTestingController.expectOne(
        '/explorehandler/init/0?v=11');
      expect(req2.request.method).toEqual('GET');
      req2.flush(_getStatesData(testExplorationData1[10]));

      flushMicrotasks();
    }));

    it('should mark renamed state as not renamed when name is same on both ' +
       'versions', fakeAsync(() => {
      vts.init(testSnapshots1);
      var nodeData = null;
      cvs.getDiffGraphData(2, 4).then(function(data) {
        nodeData = data.nodes;
        expect(nodeData).toEqual({
          1: {
            newestStateName: 'A',
            stateProperty: 'unchanged',
            originalStateName: 'A'
          }
        });
      });

      const req = httpTestingController.expectOne('/explorehandler/init/0?v=2');
      expect(req.request.method).toEqual('GET');
      req.flush(_getStatesData(testExplorationData1[1]));

      const req2 = httpTestingController.expectOne(
        '/explorehandler/init/0?v=4');
      expect(req2.request.method).toEqual('GET');
      req2.flush(_getStatesData(testExplorationData1[3]));

      flushMicrotasks();
    }));

    it('should mark states correctly when a series of changes are applied',
      fakeAsync(() => {
        vts.init(testSnapshots1);
        var nodeData = null;
        cvs.getDiffGraphData(1, 13).then(function(data) {
          nodeData = data.nodes;
          expect(nodeData).toEqual({
            1: {
              newestStateName: 'D',
              stateProperty: 'deleted',
              originalStateName: 'A'
            },
            2: {
              newestStateName: 'C',
              stateProperty: 'added',
              originalStateName: 'B'
            },
            3: {
              newestStateName: 'B',
              stateProperty: 'added',
              originalStateName: 'B'
            }
          });
        });

        const req = httpTestingController.expectOne(
          '/explorehandler/init/0?v=1');
        expect(req.request.method).toEqual('GET');
        req.flush(_getStatesData(testExplorationData1[0]));

        const req2 = httpTestingController.expectOne(
          '/explorehandler/init/0?v=13');
        expect(req2.request.method).toEqual('GET');
        req2.flush(_getStatesData(testExplorationData1[12]));

        flushMicrotasks();
      }));

    var testSnapshots2: ExplorationSnapshot[] = [{
      commit_type: 'create',
      version_number: 1,
      committer_id: 'admin',
      commit_message: 'Commit message',
      created_on_ms: 1592229964515.148,
      commit_cmds: []
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'add_state',
        state_name: 'B'
      }],
      version_number: 2,
      committer_id: 'admin',
      commit_message: 'Commit message',
      created_on_ms: 1592229964515.148,
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'rename_state',
        new_state_name: 'C',
        old_state_name: 'B'
      }],
      version_number: 3,
      committer_id: 'admin',
      commit_message: 'Commit message',
      created_on_ms: 1592229964515.148,
    }, {
      commit_type: 'revert',
      commit_cmds: [{
        cmd: 'AUTO_revert_version_number',
        version_number: 2
      }],
      version_number: 4,
      committer_id: 'admin',
      commit_message: 'Commit message',
      created_on_ms: 1592229964515.148,
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'delete_state',
        state_name: 'B'
      }],
      version_number: 5,
      committer_id: 'admin',
      commit_message: 'Commit message',
      created_on_ms: 1592229964515.148,
    }, {
      commit_type: 'revert',
      commit_cmds: [{
        cmd: 'AUTO_revert_version_number',
        version_number: 3
      }],
      version_number: 6,
      committer_id: 'admin',
      commit_message: 'Commit message',
      created_on_ms: 1592229964515.148,
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'add_state',
        state_name: 'D'
      }],
      version_number: 7,
      committer_id: 'admin',
      commit_message: 'Commit message',
      created_on_ms: 1592229964515.148,
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'edit_state_property',
        state_name: 'D',
        new_value: {
          content_id: 'content',
          html: 'Some text'
        },
        old_value: {
          content_id: 'content',
          html: ''
        },
        property_name: 'property'
      }],
      version_number: 8,
      committer_id: 'admin',
      commit_message: 'Commit message',
      created_on_ms: 1592229964515.148,
    }];

    // Information for mock state data for getDiffGraphData() to be passed to
    // _getStatesData.
    var testExplorationData2 = [{
      A: {
        contentStr: '',
        ruleDests: ['A']
      }
    }, {
      A: {
        contentStr: '',
        ruleDests: ['A']
      },
      B: {
        contentStr: '',
        ruleDests: ['B']
      }
    }, {
      A: {
        contentStr: '',
        ruleDests: ['A']
      },
      C: {
        contentStr: '',
        ruleDests: ['C']
      }
    }, {
      A: {
        contentStr: '',
        ruleDests: ['A']
      },
      B: {
        contentStr: '',
        ruleDests: ['B']
      }
    }, {
      A: {
        contentStr: '',
        ruleDests: ['A']
      }
    }, {
      A: {
        contentStr: '',
        ruleDests: ['A']
      },
      C: {
        contentStr: '',
        ruleDests: ['C']
      }
    }, {
      A: {
        contentStr: '',
        ruleDests: ['A']
      },
      C: {
        contentStr: '',
        ruleDests: ['C']
      },
      D: {
        contentStr: '',
        ruleDests: ['D']
      }
    }, {
      A: {
        contentStr: '',
        ruleDests: ['A']
      },
      C: {
        contentStr: '',
        ruleDests: ['C']
      },
      D: {
        contentStr: 'Some text',
        ruleDests: ['D']
      }
    }];

    // Tests for getDiffGraphData with reversions.
    it(
      'should mark states correctly when there is 1 reversion',
      fakeAsync(() => {
        vts.init(testSnapshots2);
        var nodeData = null;
        cvs.getDiffGraphData(1, 5).then(function(data) {
          nodeData = data.nodes;
          expect(nodeData).toEqual({
            1: {
              newestStateName: 'A',
              stateProperty: 'unchanged',
              originalStateName: 'A'
            }
          });
        });

        const req = httpTestingController.expectOne(
          '/explorehandler/init/0?v=1');
        expect(req.request.method).toEqual('GET');
        req.flush(_getStatesData(testExplorationData2[0]));

        const req2 = httpTestingController.expectOne(
          '/explorehandler/init/0?v=5');
        expect(req2.request.method).toEqual('GET');
        req2.flush(_getStatesData(testExplorationData2[4]));

        flushMicrotasks();
      }));

    it('should mark states correctly when there is 1 reversion to before v1',
      fakeAsync(() => {
        vts.init(testSnapshots2);
        var nodeData = null;
        cvs.getDiffGraphData(3, 5).then(function(data) {
          nodeData = data.nodes;
          expect(nodeData).toEqual({
            1: {
              newestStateName: 'A',
              stateProperty: 'unchanged',
              originalStateName: 'A'
            },
            2: {
              newestStateName: 'B',
              stateProperty: 'deleted',
              originalStateName: 'C'
            }
          });
        });

        const req = httpTestingController.expectOne(
          '/explorehandler/init/0?v=3');
        expect(req.request.method).toEqual('GET');
        req.flush(_getStatesData(testExplorationData2[2]));

        const req2 = httpTestingController.expectOne(
          '/explorehandler/init/0?v=5');
        expect(req2.request.method).toEqual('GET');
        req2.flush(_getStatesData(testExplorationData2[4]));

        flushMicrotasks();
      }));

    it('should mark states correctly when compared version is a reversion',
      fakeAsync(() => {
        vts.init(testSnapshots2);
        var nodeData = null;
        cvs.getDiffGraphData(4, 5).then(function(data) {
          nodeData = data.nodes;
          expect(nodeData).toEqual({
            1: {
              newestStateName: 'A',
              stateProperty: 'unchanged',
              originalStateName: 'A'
            },
            2: {
              newestStateName: 'B',
              stateProperty: 'deleted',
              originalStateName: 'B'
            }
          });
        });

        const req = httpTestingController.expectOne(
          '/explorehandler/init/0?v=4');
        expect(req.request.method).toEqual('GET');
        req.flush(_getStatesData(testExplorationData2[3]));

        const req2 = httpTestingController.expectOne(
          '/explorehandler/init/0?v=5');
        expect(req2.request.method).toEqual('GET');
        req2.flush(_getStatesData(testExplorationData2[4]));

        flushMicrotasks();
      }));

    it(
      'should mark states correctly when there are 2 reversions',
      fakeAsync(() => {
        vts.init(testSnapshots2);
        cvs.getDiffGraphData(5, 8).then(function(data) {
          expect(data.nodes).toEqual({
            1: {
              newestStateName: 'A',
              stateProperty: 'unchanged',
              originalStateName: 'A'
            },
            2: {
              newestStateName: 'C',
              stateProperty: 'added',
              originalStateName: 'B'
            },
            3: {
              newestStateName: 'D',
              stateProperty: 'added',
              originalStateName: 'D'
            }
          });
        });

        const req = httpTestingController.expectOne(
          '/explorehandler/init/0?v=5');
        expect(req.request.method).toEqual('GET');
        req.flush(_getStatesData(testExplorationData2[4]));

        const req2 = httpTestingController.expectOne(
          '/explorehandler/init/0?v=8');
        expect(req2.request.method).toEqual('GET');
        req2.flush(_getStatesData(testExplorationData2[7]));

        flushMicrotasks();
      }));

    // Represents snapshots and exploration data for tests for links
    // Only includes information accessed by getDiffGraphData().
    var testSnapshots3: ExplorationSnapshot[] = [{
      commit_type: 'create',
      version_number: 1,
      committer_id: 'admin',
      commit_message: 'Commit message',
      created_on_ms: 1592229964515.148,
      commit_cmds: []
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'add_state',
        state_name: 'B'
      }],
      version_number: 2,
      committer_id: 'admin',
      commit_message: 'Commit message',
      created_on_ms: 1592229964515.148,
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'add_state',
        state_name: 'C'
      }],
      version_number: 3,
      committer_id: 'admin',
      commit_message: 'Commit message',
      created_on_ms: 1592229964515.148,
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'rename_state',
        old_state_name: 'C',
        new_state_name: 'D'
      }],
      version_number: 4,
      committer_id: 'admin',
      commit_message: 'Commit message',
      created_on_ms: 1592229964515.148,
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'edit_state_property',
        state_name: 'D',
        new_value: {
          content_id: 'content',
          html: 'Some text'
        },
        old_value: {
          content_id: 'content',
          html: ''
        },
        property_name: 'property'
      }],
      version_number: 5,
      committer_id: 'admin',
      commit_message: 'Commit message',
      created_on_ms: 1592229964515.148,
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'edit_state_property',
        state_name: 'D',
        new_value: {
          content_id: 'content',
          html: 'Some text'
        },
        old_value: {
          content_id: 'content',
          html: ''
        },
        property_name: 'property'
      }],
      version_number: 6,
      committer_id: 'admin',
      commit_message: 'Commit message',
      created_on_ms: 1592229964515.148,
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'delete_state',
        state_name: 'D'
      }],
      version_number: 7,
      committer_id: 'admin',
      commit_message: 'Commit message',
      created_on_ms: 1592229964515.148,
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'add_state',
        state_name: 'D'
      }],
      version_number: 8,
      committer_id: 'admin',
      commit_message: 'Commit message',
      created_on_ms: 1592229964515.148,
    }];

    var testExplorationData3 = [{
      A: {
        contentStr: '',
        ruleDests: ['A']
      },
      END: {
        contentStr: '',
        ruleDests: ['END']
      }
    }, {
      A: {
        contentStr: '',
        ruleDests: ['B']
      },
      B: {
        contentStr: '',
        ruleDests: ['END']
      },
      END: {
        contentStr: '',
        ruleDests: ['END']
      }
    }, {
      A: {
        contentStr: '',
        ruleDests: ['B', 'C']
      },
      B: {
        contentStr: '',
        ruleDests: ['END']
      },
      C: {
        contentStr: '',
        ruleDests: ['A']
      },
      END: {
        contentStr: '',
        ruleDests: ['END']
      }
    }, {
      A: {
        contentStr: '',
        ruleDests: ['B', 'D']
      },
      B: {
        contentStr: '',
        ruleDests: ['END']
      },
      D: {
        contentStr: '',
        ruleDests: ['A']
      },
      END: {
        contentStr: '',
        ruleDests: ['END']
      }
    }, {
      A: {
        contentStr: '',
        ruleDests: ['B', 'D']
      },
      B: {
        contentStr: '',
        ruleDests: ['D', 'END']
      },
      D: {
        contentStr: '',
        ruleDests: ['A']
      },
      END: {
        contentStr: '',
        ruleDests: ['END']
      }
    }, {
      A: {
        contentStr: '',
        ruleDests: ['B']
      },
      B: {
        contentStr: '',
        ruleDests: ['D', 'END']
      },
      D: {
        contentStr: '',
        ruleDests: ['A']
      },
      END: {
        contentStr: '',
        ruleDests: ['END']
      }
    }, {
      A: {
        contentStr: '',
        ruleDests: ['B']
      },
      B: {
        contentStr: '',
        ruleDests: ['END']
      },
      END: {
        contentStr: '',
        ruleDests: ['END']
      }
    }, {
      A: {
        contentStr: '',
        ruleDests: ['B']
      },
      B: {
        contentStr: '',
        ruleDests: ['D', 'END']
      },
      D: {
        contentStr: '',
        ruleDests: ['B']
      },
      END: {
        contentStr: '',
        ruleDests: ['END']
      }
    }];

    it('should correctly display added links', fakeAsync(() => {
      vts.init(testSnapshots3);
      var linkData = null;
      cvs.getDiffGraphData(1, 2).then(function(data) {
        linkData = data.links;
        expect(linkData).toEqual([{
          source: 1,
          target: 3,
          linkProperty: 'added'
        }, {
          source: 3,
          target: 2,
          linkProperty: 'added'
        }]);
      });

      const req = httpTestingController.expectOne('/explorehandler/init/0?v=1');
      expect(req.request.method).toEqual('GET');
      req.flush(_getStatesData(testExplorationData3[0]));

      const req2 = httpTestingController.expectOne(
        '/explorehandler/init/0?v=2');
      expect(req2.request.method).toEqual('GET');
      req2.flush(_getStatesData(testExplorationData3[1]));

      flushMicrotasks();
    }));

    it('should correctly display deleted links', fakeAsync(() => {
      vts.init(testSnapshots3);
      var linkData = null;
      cvs.getDiffGraphData(5, 6).then(function(data) {
        linkData = data.links;
        expect(linkData).toEqual([{
          source: 1,
          target: 2,
          linkProperty: 'unchanged'
        }, {
          source: 1,
          target: 3,
          linkProperty: 'deleted'
        }, {
          source: 2,
          target: 3,
          linkProperty: 'unchanged'
        }, {
          source: 2,
          target: 4,
          linkProperty: 'unchanged'
        }, {
          source: 3,
          target: 1,
          linkProperty: 'unchanged'
        }]);
      });

      const req = httpTestingController.expectOne('/explorehandler/init/0?v=5');
      expect(req.request.method).toEqual('GET');
      req.flush(_getStatesData(testExplorationData3[4]));

      const req2 = httpTestingController.expectOne(
        '/explorehandler/init/0?v=6');
      expect(req2.request.method).toEqual('GET');
      req2.flush(_getStatesData(testExplorationData3[5]));

      flushMicrotasks();
    }));

    it('should correctly display links on renamed states', fakeAsync(() => {
      vts.init(testSnapshots3);
      var linkData = null;
      cvs.getDiffGraphData(3, 5).then(function(data) {
        linkData = data.links;
        expect(linkData).toEqual([{
          source: 1,
          target: 2,
          linkProperty: 'unchanged'
        }, {
          source: 1,
          target: 3,
          linkProperty: 'unchanged'
        }, {
          source: 2,
          target: 3,
          linkProperty: 'added'
        }, {
          source: 2,
          target: 4,
          linkProperty: 'unchanged'
        }, {
          source: 3,
          target: 1,
          linkProperty: 'unchanged'
        }]);
      });

      const req = httpTestingController.expectOne('/explorehandler/init/0?v=3');
      expect(req.request.method).toEqual('GET');
      req.flush(_getStatesData(testExplorationData3[2]));

      const req2 = httpTestingController.expectOne(
        '/explorehandler/init/0?v=5');
      expect(req2.request.method).toEqual('GET');
      req2.flush(_getStatesData(testExplorationData3[4]));

      flushMicrotasks();
    }));

    it('should correctly display added, then deleted links', fakeAsync(() => {
      vts.init(testSnapshots3);
      var linkData = null;
      cvs.getDiffGraphData(2, 7).then(function(data) {
        linkData = data.links;
        expect(linkData).toEqual([{
          source: 1,
          target: 2,
          linkProperty: 'unchanged'
        }, {
          source: 2,
          target: 3,
          linkProperty: 'unchanged'
        }]);
      });

      const req = httpTestingController.expectOne('/explorehandler/init/0?v=2');
      expect(req.request.method).toEqual('GET');
      req.flush(_getStatesData(testExplorationData3[1]));

      const req2 = httpTestingController.expectOne(
        '/explorehandler/init/0?v=7');
      expect(req2.request.method).toEqual('GET');
      req2.flush(_getStatesData(testExplorationData3[6]));

      flushMicrotasks();
    }));

    it('should correctly display deleted, then added links', fakeAsync(() => {
      vts.init(testSnapshots3);
      var linkData = null;
      cvs.getDiffGraphData(6, 8).then(function(data) {
        linkData = data.links;
        expect(linkData).toEqual([{
          source: 1,
          target: 2,
          linkProperty: 'unchanged'
        }, {
          source: 2,
          target: 3,
          linkProperty: 'unchanged'
        }, {
          source: 2,
          target: 4,
          linkProperty: 'unchanged'
        }, {
          source: 3,
          target: 1,
          linkProperty: 'deleted'
        }, {
          source: 3,
          target: 2,
          linkProperty: 'added'
        }]);
      });

      const req = httpTestingController.expectOne('/explorehandler/init/0?v=6');
      expect(req.request.method).toEqual('GET');
      req.flush(_getStatesData(testExplorationData3[5]));

      const req2 = httpTestingController.expectOne(
        '/explorehandler/init/0?v=8');
      expect(req2.request.method).toEqual('GET');
      req2.flush(_getStatesData(testExplorationData3[7]));

      flushMicrotasks();
    }));

    it('should not compare versions if v1 > v2.', function() {
      expect(function() {
        cvs.getDiffGraphData(8, 5);
      }).toThrowError('Tried to compare v1 > v2.');
    });
  });
});
