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
 * @fileoverview Unit tests for the services of the history page.
 */

describe('Versions tree service', function() {
  beforeEach(module('oppia'));

  describe('versions tree service', function() {
    var vts = null;
    var snapshots = [{
      commit_type: 'create',
      version_number: 1
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'add_state',
        state_name: 'B'
      }, {
        cmd: 'rename_state',
        new_state_name: 'A',
        old_state_name: 'First State'
      }],
      version_number: 2
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'rename_state',
        new_state_name: 'C',
        old_state_name: 'B'
      }],
      version_number: 3
    }, {
      commit_type: 'revert',
      commit_cmds: [{
        version_number: 2,
        cmd: 'AUTO_revert_version_number'
      }],
      version_number: 4
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'delete_state',
        state_name: 'B'
      }, {
        cmd: 'rename_state',
        new_state_name: 'D',
        old_state_name: 'A'
      }],
      version_number: 5
    }, {
      commit_type: 'revert',
      commit_cmds: [{
        version_number: 3,
        cmd: 'AUTO_revert_version_number'
      }],
      version_number: 6
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'add_state',
        state_name: 'D'
      }],
      version_number: 7
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'edit_state_property',
        state_name: 'D',
        new_value: {
          type: 'text',
          value: 'Some text'
        },
        old_value: {
          type: 'text',
          value: ''
        }
      }],
      version_number: 8
    }];

    beforeEach(inject(function($injector) {
      vts = $injector.get('versionsTreeService');
    }));

    it('should get correct list of parents', function() {
      vts.init(snapshots);
      var expectedParents = {
        1: -1,
        2: 1,
        3: 2,
        4: 2,
        5: 4,
        6: 3,
        7: 6,
        8: 7
      };
      expect(vts.getVersionTree()).toEqual(expectedParents);
    });

    it('should find correct LCA', function() {
      vts.init(snapshots);
      expect(vts.findLCA(1, 6)).toBe(1);
      expect(vts.findLCA(3, 5)).toBe(2);
      expect(vts.findLCA(3, 8)).toBe(3);
      expect(vts.findLCA(3, 4)).toBe(2);
      expect(vts.findLCA(3, 3)).toBe(3);
      expect(vts.findLCA(2, 4)).toBe(2);
    });

    it('should get correct change list', function() {
      vts.init(snapshots);
      expect(function() {
        vts.getChangeList(1);
      }).toThrow(new Error('Tried to retrieve change list of version 1'));
      expect(vts.getChangeList(2)).toEqual([{
        cmd: 'add_state',
        state_name: 'B'
      }, {
        cmd: 'rename_state',
        new_state_name: 'A',
        old_state_name: 'First State'
      }]);
      expect(vts.getChangeList(4)).toEqual([{
        cmd: 'AUTO_revert_version_number',
        version_number: 2
      }]);
      expect(vts.getChangeList(5)).toEqual([{
        cmd: 'delete_state',
        state_name: 'B'
      }, {
        cmd: 'rename_state',
        new_state_name: 'D',
        old_state_name: 'A'
      }]);
      expect(vts.getChangeList(8)).toEqual([{
        cmd: 'edit_state_property',
        state_name: 'D',
        new_value: {
          type: 'text',
          value: 'Some text'
        },
        old_value: {
          type: 'text',
          value: ''
        }
      }]);
    });
  });
});

describe('Compare versions service', function() {
  beforeEach(module('oppia'));

  describe('compare versions service', function() {
    var cvs = null;
    var vts = null;
    var treeParents = null;
    var $httpBackend = null;

    beforeEach(module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));
    beforeEach(function() {
      mockExplorationData = {
        explorationId: 0
      };
      module(function($provide) {
        $provide.value('explorationData', mockExplorationData);
      });
    });

    beforeEach(inject(function($injector) {
      cvs = $injector.get('compareVersionsService');
      vts = $injector.get('versionsTreeService');
      $httpBackend = $injector.get('$httpBackend');
    }));

    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    // Helper function to get states data to pass to getDiffGraphData().
    // states is an object whose keys are state names and whose values are
    //  - contentStr: string which is the text content of the state
    //  - ruleDests: a list of strings which are state names of destinations of
    //    links
    // Only information accessed by getDiffGraphData is included in the return
    // value
    var _getStatesData = function(statesDetails) {
      var statesData = {
        states: {}
      };
      for (var stateName in statesDetails) {
        var newStateData = {
          content: [{
            type: 'text',
            value: statesDetails[stateName].contentStr
          }],
          interaction: {
            answer_groups: []
          }
        };
        newStateData.interaction.answer_groups =
          statesDetails[stateName].ruleDests.map(function(ruleDestName) {
            return {
              outcome: {
                dest: ruleDestName
              }
            };
          });
        statesData.states[stateName] = newStateData;
      }
      return statesData;
    };

    var testSnapshots1 = [{
      commit_type: 'create',
      version_number: 1
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'edit_state_property',
        state_name: 'A',
        new_value: {
          type: 'text',
          value: 'Some text'
        },
        old_value: {
          type: 'text',
          value: ''
        }
      }],
      version_number: 2
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'rename_state',
        new_state_name: 'B',
        old_state_name: 'A'
      }],
      version_number: 3
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'rename_state',
        new_state_name: 'A',
        old_state_name: 'B'
      }],
      version_number: 4
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'add_state',
        state_name: 'B'
      }],
      version_number: 5
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'rename_state',
        new_state_name: 'C',
        old_state_name: 'B'
      }],
      version_number: 6
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'edit_state_property',
        state_name: 'C',
        new_value: {
          type: 'text',
          value: 'More text'
        },
        old_value: {
          type: 'text',
          value: ''
        }
      }],
      version_number: 7
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'add_state',
        state_name: 'B'
      }],
      version_number: 8
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'delete_state',
        state_name: 'B'
      }],
      version_number: 9
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'add_state',
        state_name: 'B'
      }],
      version_number: 10
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'edit_state_property',
        state_name: 'A',
        new_value: {
          type: 'text',
          value: ''
        },
        old_value: {
          type: 'text',
          value: 'Some text'
        }
      }],
      version_number: 11
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'rename_state',
        new_state_name: 'D',
        old_state_name: 'A'
      }],
      version_number: 12
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'delete_state',
        state_name: 'D'
      }],
      version_number: 13
    }];

    // Information for mock state data for getDiffGraphData() to be passed to
    // _getStatesData
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

    // Tests for getDiffGraphData on linear commits
    it('should detect changed, renamed and added states', function() {
      $httpBackend.expect('GET', '/createhandler/data/0?v=1')
        .respond(_getStatesData(testExplorationData1[0]));
      $httpBackend.expect('GET', '/createhandler/data/0?v=7')
        .respond(_getStatesData(testExplorationData1[6]));
      vts.init(testSnapshots1);
      var nodeData = null;
      cvs.getDiffGraphData(1, 7).then(function(data) {
        nodeData = data.nodes;
      });
      $httpBackend.flush();
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

    it('should add new state with same name as old name of renamed state',
        function() {
      $httpBackend.expect('GET', '/createhandler/data/0?v=5')
        .respond(_getStatesData(testExplorationData1[4]));
      $httpBackend.expect('GET', '/createhandler/data/0?v=8')
        .respond(_getStatesData(testExplorationData1[7]));
      vts.init(testSnapshots1);
      var nodeData = null;
      cvs.getDiffGraphData(5, 8).then(function(data) {
        nodeData = data.nodes;
      });
      $httpBackend.flush();
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

    it('should not include added, then deleted state', function() {
      $httpBackend.expect('GET', '/createhandler/data/0?v=7')
        .respond(_getStatesData(testExplorationData1[6]));
      $httpBackend.expect('GET', '/createhandler/data/0?v=9')
        .respond(_getStatesData(testExplorationData1[8]));
      vts.init(testSnapshots1);
      var nodeData = null;
      cvs.getDiffGraphData(7, 9).then(function(data) {
        nodeData = data.nodes;
      });
      $httpBackend.flush();
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

    it('should mark deleted then added states as changed', function() {
      $httpBackend.expect('GET', '/createhandler/data/0?v=8')
        .respond(_getStatesData(testExplorationData1[7]));
      $httpBackend.expect('GET', '/createhandler/data/0?v=10')
        .respond(_getStatesData(testExplorationData1[9]));
      vts.init(testSnapshots1);
      var nodeData = null;
      cvs.getDiffGraphData(8, 10).then(function(data) {
        nodeData = data.nodes;
      });
      $httpBackend.flush();
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

    it('should mark renamed then deleted states as deleted', function() {
      $httpBackend.expect('GET', '/createhandler/data/0?v=11')
        .respond(_getStatesData(testExplorationData1[10]));
      $httpBackend.expect('GET', '/createhandler/data/0?v=13')
        .respond(_getStatesData(testExplorationData1[12]));
      vts.init(testSnapshots1);
      var nodeData = null;
      cvs.getDiffGraphData(11, 13).then(function(data) {
        nodeData = data.nodes;
      });
      $httpBackend.flush();
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

    it('should mark changed state as unchanged when name and content is same' +
       'on both versions', function() {
      $httpBackend.expect('GET', '/createhandler/data/0?v=1')
        .respond(_getStatesData(testExplorationData1[0]));
      $httpBackend.expect('GET', '/createhandler/data/0?v=11')
        .respond(_getStatesData(testExplorationData1[10]));
      vts.init(testSnapshots1);
      var nodeData = null;
      cvs.getDiffGraphData(1, 11).then(function(data) {
        nodeData = data.nodes;
      });
      $httpBackend.flush();
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

    it('should mark renamed state as not renamed when name is same on both ' +
       'versions', function() {
      $httpBackend.expect('GET', '/createhandler/data/0?v=2')
        .respond(_getStatesData(testExplorationData1[1]));
      $httpBackend.expect('GET', '/createhandler/data/0?v=4')
        .respond(_getStatesData(testExplorationData1[3]));
      vts.init(testSnapshots1);
      var nodeData = null;
      cvs.getDiffGraphData(2, 4).then(function(data) {
        nodeData = data.nodes;
      });
      $httpBackend.flush();
      expect(nodeData).toEqual({
        1: {
          newestStateName: 'A',
          stateProperty: 'unchanged',
          originalStateName: 'A'
        }
      });
    });

    it('should mark states correctly when a series of changes are applied',
        function() {
      $httpBackend.expect('GET', '/createhandler/data/0?v=1')
        .respond(_getStatesData(testExplorationData1[0]));
      $httpBackend.expect('GET', '/createhandler/data/0?v=13')
        .respond(_getStatesData(testExplorationData1[12]));
      vts.init(testSnapshots1);
      var nodeData = null;
      cvs.getDiffGraphData(1, 13).then(function(data) {
        nodeData = data.nodes;
      });
      $httpBackend.flush();
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

    var testSnapshots2 = [{
      commit_type: 'create',
      version_number: 1
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'add_state',
        state_name: 'B'
      }],
      version_number: 2
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'rename_state',
        new_state_name: 'C',
        old_state_name: 'B'
      }],
      version_number: 3
    }, {
      commit_type: 'revert',
      commit_cmds: [{
        cmd: 'AUTO_revert_version_number',
        version_number: 2
      }],
      version_number: 4
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'delete_state',
        state_name: 'B'
      }],
      version_number: 5
    }, {
      commit_type: 'revert',
      commit_cmds: [{
        cmd: 'AUTO_revert_version_number',
        version_number: 3
      }],
      version_number: 6
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'add_state',
        state_name: 'D'
      }],
      version_number: 7
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'edit_state_property',
        state_name: 'D',
        new_value: {
          type: 'text',
          value: 'Some text'
        },
        old_value: {
          type: 'text',
          value: ''
        }
      }],
      version_number: 8
    }];

    // Information for mock state data for getDiffGraphData() to be passed to
    // _getStatesData
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

    // Tests for getDiffGraphData with reversions
    it('should mark states correctly when there is 1 reversion', function() {
      $httpBackend.expect('GET', '/createhandler/data/0?v=1')
        .respond(_getStatesData(testExplorationData2[0]));
      $httpBackend.expect('GET', '/createhandler/data/0?v=5')
        .respond(_getStatesData(testExplorationData2[4]));
      vts.init(testSnapshots2);
      var nodeData = null;
      cvs.getDiffGraphData(1, 5).then(function(data) {
        nodeData = data.nodes;
      });
      $httpBackend.flush();
      expect(nodeData).toEqual({
        1: {
          newestStateName: 'A',
          stateProperty: 'unchanged',
          originalStateName: 'A'
        }
      });
    });

    it('should mark states correctly when there is 1 reversion to before v1',
        function() {
      $httpBackend.expect('GET', '/createhandler/data/0?v=3')
        .respond(_getStatesData(testExplorationData2[2]));
      $httpBackend.expect('GET', '/createhandler/data/0?v=5')
        .respond(_getStatesData(testExplorationData2[4]));
      vts.init(testSnapshots2);
      var nodeData = null;
      cvs.getDiffGraphData(3, 5).then(function(data) {
        nodeData = data.nodes;
      });
      $httpBackend.flush();
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

    it('should mark states correctly when compared version is a reversion',
        function() {
      $httpBackend.expect('GET', '/createhandler/data/0?v=4')
        .respond(_getStatesData(testExplorationData2[3]));
      $httpBackend.expect('GET', '/createhandler/data/0?v=5')
        .respond(_getStatesData(testExplorationData2[4]));
      vts.init(testSnapshots2);
      var nodeData = null;
      cvs.getDiffGraphData(4, 5).then(function(data) {
        nodeData = data.nodes;
      });
      $httpBackend.flush();
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

    it('should mark states correctly when there are 2 reversions', function() {
      $httpBackend.expect('GET', '/createhandler/data/0?v=5')
        .respond(_getStatesData(testExplorationData2[4]));
      $httpBackend.expect('GET', '/createhandler/data/0?v=8')
        .respond(_getStatesData(testExplorationData2[7]));
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
      $httpBackend.flush();
    });

    // Represents snapshots and exploration data for tests for links
    // Only includes information accessed by getDiffGraphData()
    var testSnapshots3 = [{
      commit_type: 'create',
      version_number: 1
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'add_state',
        state_name: 'B'
      }],
      version_number: 2
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'add_state',
        state_name: 'C'
      }],
      version_number: 3
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'rename_state',
        old_state_name: 'C',
        new_state_name: 'D'
      }],
      version_number: 4
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'edit_state_property',
        state_name: 'D'
      }],
      version_number: 5
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'edit_state_property',
        state_name: 'D'
      }],
      version_number: 6
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'delete_state',
        state_name: 'D'
      }],
      version_number: 7
    }, {
      commit_type: 'edit',
      commit_cmds: [{
        cmd: 'add_state',
        state_name: 'D'
      }],
      version_number: 8
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

    it('should correctly display added links', function() {
      $httpBackend.expect('GET', '/createhandler/data/0?v=1')
        .respond(_getStatesData(testExplorationData3[0]));
      $httpBackend.expect('GET', '/createhandler/data/0?v=2')
        .respond(_getStatesData(testExplorationData3[1]));
      vts.init(testSnapshots3);
      var linkData = null;
      cvs.getDiffGraphData(1, 2).then(function(data) {
        linkData = data.links;
      });
      $httpBackend.flush();
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

    it('should correctly display deleted links', function() {
      $httpBackend.expect('GET', '/createhandler/data/0?v=5')
        .respond(_getStatesData(testExplorationData3[4]));
      $httpBackend.expect('GET', '/createhandler/data/0?v=6')
        .respond(_getStatesData(testExplorationData3[5]));
      vts.init(testSnapshots3);
      var linkData = null;
      cvs.getDiffGraphData(5, 6).then(function(data) {
        linkData = data.links;
      });
      $httpBackend.flush();
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

    it('should correctly display links on renamed states', function() {
      $httpBackend.expect('GET', '/createhandler/data/0?v=3')
        .respond(_getStatesData(testExplorationData3[2]));
      $httpBackend.expect('GET', '/createhandler/data/0?v=5')
        .respond(_getStatesData(testExplorationData3[4]));
      vts.init(testSnapshots3);
      var linkData = null;
      cvs.getDiffGraphData(3, 5).then(function(data) {
        linkData = data.links;
      });
      $httpBackend.flush();
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

    it('should correctly display added, then deleted links', function() {
      $httpBackend.expect('GET', '/createhandler/data/0?v=2')
        .respond(_getStatesData(testExplorationData3[1]));
      $httpBackend.expect('GET', '/createhandler/data/0?v=7')
        .respond(_getStatesData(testExplorationData3[6]));
      vts.init(testSnapshots3);
      var linkData = null;
      cvs.getDiffGraphData(2, 7).then(function(data) {
        linkData = data.links;
      });
      $httpBackend.flush();
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

    it('should correctly display deleted, then added links', function() {
      $httpBackend.expect('GET', '/createhandler/data/0?v=6')
        .respond(_getStatesData(testExplorationData3[5]));
      $httpBackend.expect('GET', '/createhandler/data/0?v=8')
        .respond(_getStatesData(testExplorationData3[7]));
      vts.init(testSnapshots3);
      var linkData = null;
      cvs.getDiffGraphData(6, 8).then(function(data) {
        linkData = data.links;
      });
      $httpBackend.flush();
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
  });
});
