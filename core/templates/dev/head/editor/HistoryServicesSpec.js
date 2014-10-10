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
 *
 * @author wxyxinyu@gmail.com (Xinyu Wu)
 */

describe('Versions tree service', function() {
  beforeEach(module('oppia'));

  describe('versions tree service', function() {
    var vts = null;
    var snapshots = [
      {
        'commit_type': 'create',
        'version_number': 1
      },
      {
        'commit_type': 'edit',
        'commit_cmds': [
          {
            'cmd': 'add_state',
            'state_name': 'B'
          },
          {
            'cmd': 'rename_state',
            'new_state_name': 'A',
            'old_state_name': 'First State'
          }
        ],
        'version_number': 2
      },
      {
        'commit_type': 'edit',
        'commit_cmds': [{
          'cmd': 'rename_state',
          'new_state_name': 'C',
          'old_state_name': 'B'
        }],
        'version_number': 3
      },
      {
        'commit_type': 'revert',
        'commit_cmds': [{
          'version_number': 2,
          'cmd': 'AUTO_revert_version_number'
        }],
        'version_number': 4
      },
      {
        'commit_type': 'edit',
        'commit_cmds': [
          {
            'cmd': 'delete_state',
            'state_name': 'B'
          },
          {
            'cmd': 'rename_state',
            'new_state_name': 'D',
            'old_state_name': 'A'
          }
        ],
        'version_number': 5
      },
      {
        'commit_type': 'revert',
        'commit_cmds': [{
          'version_number': 3,
          'cmd': 'AUTO_revert_version_number'
        }],
        'version_number': 6
      },
      {
        'commit_type': 'edit',
        'commit_cmds': [{
          'cmd': 'add_state',
          'state_name': 'D'
        }],
        'version_number': 7
      },
      {
        'commit_type': 'edit',
        'commit_cmds': [{
          'cmd': 'edit_state_property',
          'state_name': 'D',
          'new_value': {'type': 'text', 'value': 'Some text'},
          'old_value': {'type': 'text', 'value': ''}
        }],
        'version_number': 8
      }
    ];

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
      expect(vts.getChangeList(2)).toEqual([
        {
          'cmd': 'add_state',
          'state_name': 'B'
        },
        {
          'cmd': 'rename_state',
          'new_state_name': 'A',
          'old_state_name': 'First State'
        }
      ]);
      expect(vts.getChangeList(4)).toEqual([{
        'version_number': 2,
        'cmd': 'AUTO_revert_version_number'
      }]);
      expect(vts.getChangeList(5)).toEqual([
        {
          'cmd': 'delete_state',
          'state_name': 'B'
        },
        {
          'cmd': 'rename_state',
          'new_state_name': 'D',
          'old_state_name': 'A'
        }
      ]);
      expect(vts.getChangeList(8)).toEqual([{
        'cmd': 'edit_state_property',
        'state_name': 'D',
        'new_value': {'type': 'text', 'value': 'Some text'},
        'old_value': {'type': 'text', 'value': ''}
      }]);
    });
  });
});


describe('Compare versions service', function() {
  beforeEach(module('oppia'));

  describe('compare versions service', function() {
    var cvs = null,
        vts = null,
        treeParents = null,
        $httpBackend = null;

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

    var testSnapshots1 = [
      {
        'commit_type': 'create',
        'version_number': 1
      },
      {
        'commit_type': 'edit',
        'commit_cmds': [{
          'cmd': 'edit_state_property',
          'state_name': 'A',
          'new_value': {'type': 'text', 'value': 'Some text'},
          'old_value': {'type': 'text', 'value': ''}
        }],
        'version_number': 2
      },
      {
        'commit_type': 'edit',
        'commit_cmds': [{
          'cmd': 'rename_state',
          'new_state_name': 'B',
          'old_state_name': 'A'
        }],
        'version_number': 3
      },
      {
        'commit_type': 'edit',
        'commit_cmds': [{
          'cmd': 'rename_state',
          'new_state_name': 'A',
          'old_state_name': 'B'
        }],
        'version_number': 4
      },
      {
        'commit_type': 'edit',
        'commit_cmds': [{
          'cmd': 'add_state',
          'state_name': 'B'
        }],
        'version_number': 5
      },
      {
        'commit_type': 'edit',
        'commit_cmds': [{
          'cmd': 'rename_state',
          'new_state_name': 'C',
          'old_state_name': 'B'
        }],
        'version_number': 6
      },
      {
        'commit_type': 'edit',
        'commit_cmds': [{
          'cmd': 'edit_state_property',
          'state_name': 'C',
          'new_value': {'type': 'text', 'value': 'More text'},
          'old_value': {'type': 'text', 'value': ''}
        }],
        'version_number': 7
      },
      {
        'commit_type': 'edit',
        'commit_cmds': [{
          'cmd': 'add_state',
          'state_name': 'B'
        }],
        'version_number': 8
      },
      {
        'commit_type': 'edit',
        'commit_cmds': [{
          'cmd': 'delete_state',
          'state_name': 'B'
        }],
        'version_number': 9
      },
      {
        'commit_type': 'edit',
        'commit_cmds': [{
          'cmd': 'add_state',
          'state_name': 'B'
        }],
        'version_number': 10
      },
      {
        'commit_type': 'edit',
        'commit_cmds': [{
          'cmd': 'edit_state_property',
          'state_name': 'A',
          'new_value': {'type': 'text', 'value': ''},
          'old_value': {'type': 'text', 'value': 'Some text'}
        }],
        'version_number': 11
      },
      {
        'commit_type': 'edit',
        'commit_cmds': [{
          'cmd': 'rename_state',
          'new_state_name': 'D',
          'old_state_name': 'A'
        }],
        'version_number': 12
      },
      {
        'commit_type': 'edit',
        'commit_cmds': [{
          'cmd': 'delete_state',
          'state_name': 'D'
        }],
        'version_number': 13
      },
    ];

    // Mock state data for getStatesDiff(). The states are represented as
    // strings for simplicity.
    var testExplorationData1 = [
      {
        'states': {
          'A': 'dummy_state_data'
        }
      },
      {
        'states': {
          'A': 'new_dummy_state_data',
        }
      },
      {
        'states': {
          'B': 'new_dummy_state_data',
        }
      },
      {
        'states': {
          'A': 'new_dummy_state_data',
        }
      },
      {
        'states': {
          'A': 'new_dummy_state_data',
          'B': 'dummy_state_data'
        }
      },
      {
        'states': {
          'A': 'new_dummy_state_data',
          'C': 'dummy_state_data'
        }
      },
      {
        'states': {
          'A': 'new_dummy_state_data',
          'C': 'another_dummy_state_data'
        }
      },
      {
        'states': {
          'A': 'new_dummy_state_data',
          'B': 'some_dummy_state_data',
          'C': 'another_dummy_state_data'
        }
      },
      {
        'states': {
          'A': 'new_dummy_state_data',
          'C': 'another_dummy_state_data'
        }
      },
      {
        'states': {
          'A': 'new_dummy_state_data',
          'B': 'dummy_state_data',
          'C': 'another_dummy_state_data'
        }
      },
      {
        'states': {
          'A': 'dummy_state_data',
          'B': 'some_dummy_state_data',
          'C': 'another_dummy_state_data'
        }
      },
      {
        'states': {
          'B': 'some_dummy_state_data',
          'C': 'another_dummy_state_data',
          'D': 'dummy_state_data'
        }
      },
      {
        'states': {
          'B': 'some_dummy_state_data',
          'C': 'another_dummy_state_data',
        }
      }
    ];

    // Tests for getStatesDiff on linear commits
    it('should detect changed, renamed and added states', function() {
      $httpBackend.expect('GET', '/createhandler/data/0?v=1')
        .respond(testExplorationData1[0]);
      $httpBackend.expect('GET', '/createhandler/data/0?v=7')
        .respond(testExplorationData1[6]);
      vts.init(testSnapshots1);
      cvs.getStatesDiff(1, 7).then(function(data) {
        expect(data).toEqual({
          1: {
            'newestStateName': 'A',
            'stateProperty': 'changed',
            'originalStateName': 'A'
          },
          2: {
            'newestStateName': 'C',
            'stateProperty': 'added',
            'originalStateName': 'B'
          }
        });
      });
      $httpBackend.flush();
     });

    it('should add new state with same name as old name of renamed state', function() {
      $httpBackend.expect('GET', '/createhandler/data/0?v=5')
        .respond(testExplorationData1[4]);
      $httpBackend.expect('GET', '/createhandler/data/0?v=8')
        .respond(testExplorationData1[7]);
      vts.init(testSnapshots1);
      cvs.getStatesDiff(5, 8).then(function(data) {
        expect(data).toEqual({
          1: {
            'newestStateName': 'A',
            'stateProperty': 'unchanged',
            'originalStateName': 'A'
          },
          2: {
            'newestStateName': 'C',
            'stateProperty': 'changed',
            'originalStateName': 'B'
          },
          3: {
            'newestStateName': 'B',
            'stateProperty': 'added',
            'originalStateName': 'B'
          }
        });
      });
      $httpBackend.flush();
    });

    it('should mark added, then deleted state as changed', function() {
      $httpBackend.expect('GET', '/createhandler/data/0?v=7')
        .respond(testExplorationData1[6]);
      $httpBackend.expect('GET', '/createhandler/data/0?v=9')
        .respond(testExplorationData1[8]);
      vts.init(testSnapshots1);
      cvs.getStatesDiff(7, 9).then(function(data) {
        expect(data).toEqual({
          1: {
            'newestStateName': 'A',
            'stateProperty': 'unchanged',
            'originalStateName': 'A'
          },
          2: {
            'newestStateName': 'C',
            'stateProperty': 'unchanged',
            'originalStateName': 'C'
          },
          3: {
            'newestStateName': 'B',
            'stateProperty': 'changed',
            'originalStateName': 'B'
          }
        });
      });
      $httpBackend.flush();
    });

    it('should mark deleted then added states as changed', function() {
      $httpBackend.expect('GET', '/createhandler/data/0?v=8')
        .respond(testExplorationData1[7]);
      $httpBackend.expect('GET', '/createhandler/data/0?v=10')
        .respond(testExplorationData1[9]);
      vts.init(testSnapshots1);
      cvs.getStatesDiff(8, 10).then(function(data) {
        expect(data).toEqual({
          1: {
            'newestStateName': 'A',
            'stateProperty': 'unchanged',
            'originalStateName': 'A'
          },
          2: {
            'newestStateName': 'B',
            'stateProperty': 'changed',
            'originalStateName': 'B'
          },
          3: {
            'newestStateName': 'C',
            'stateProperty': 'unchanged',
            'originalStateName': 'C'
          }
        });
      });
      $httpBackend.flush();
    });

    it('should mark renamed then deleted states as deleted', function() {
      $httpBackend.expect('GET', '/createhandler/data/0?v=11')
        .respond(testExplorationData1[10]);
      $httpBackend.expect('GET', '/createhandler/data/0?v=13')
        .respond(testExplorationData1[12]);
      vts.init(testSnapshots1);
      cvs.getStatesDiff(11, 13).then(function(data) {
        expect(data).toEqual({
          1: {
            'newestStateName': 'D',
            'stateProperty': 'deleted',
            'originalStateName': 'A'
          },
          2: {
            'newestStateName': 'B',
            'stateProperty': 'unchanged',
            'originalStateName': 'B'
          },
          3: {
            'newestStateName': 'C',
            'stateProperty': 'unchanged',
            'originalStateName': 'C'
          }
        });
      });
      $httpBackend.flush();
    });

    it('should mark changed state as unchanged when name and content is same' +
       'on both versions', function() {
      $httpBackend.expect('GET', '/createhandler/data/0?v=1')
        .respond(testExplorationData1[0]);
      $httpBackend.expect('GET', '/createhandler/data/0?v=11')
        .respond(testExplorationData1[10]);
      vts.init(testSnapshots1);
      cvs.getStatesDiff(1, 11).then(function(data) {
        expect(data).toEqual({
          1: {
            'newestStateName': 'A',
            'stateProperty': 'unchanged',
            'originalStateName': 'A'
          },
          2: {
            'newestStateName': 'C',
            'stateProperty': 'added',
            'originalStateName': 'B'
          },
          3: {
            'newestStateName': 'B',
            'stateProperty': 'added',
            'originalStateName': 'B'
          }
        });
      });
      $httpBackend.flush();
    });

    it('should mark renamed state as not renamed when name is same on both versions',
        function() {
      $httpBackend.expect('GET', '/createhandler/data/0?v=2')
        .respond(testExplorationData1[1]);
      $httpBackend.expect('GET', '/createhandler/data/0?v=4')
        .respond(testExplorationData1[3]);
      vts.init(testSnapshots1);
      cvs.getStatesDiff(2, 4).then(function(data) {
        expect(data).toEqual({
          1: {
            'newestStateName': 'A',
            'stateProperty': 'unchanged',
            'originalStateName': 'A'
          }
        });
      });
      $httpBackend.flush();
    });

    it('should mark states correctly when a series of changes are applied',
        function() {
      $httpBackend.expect('GET', '/createhandler/data/0?v=1')
        .respond(testExplorationData1[0]);
      $httpBackend.expect('GET', '/createhandler/data/0?v=13')
        .respond(testExplorationData1[12]);
      vts.init(testSnapshots1);
      cvs.getStatesDiff(1, 13).then(function(data) {
        expect(data).toEqual({
          1: {
            'newestStateName': 'D',
            'stateProperty': 'deleted',
            'originalStateName': 'A'
          },
          2: {
            'newestStateName': 'C',
            'stateProperty': 'added',
            'originalStateName': 'B'
          },
          3: {
            'newestStateName': 'B',
            'stateProperty': 'added',
            'originalStateName': 'B'
          }
        });
      });
      $httpBackend.flush();
    });

    var testSnapshots2 = [
      {
        'commit_type': 'create',
        'version_number': 1
      },
      {
        'commit_type': 'edit',
        'commit_cmds': [{
          'cmd': 'add_state',
          'state_name': 'B'
        }],
        'version_number': 2
      },
      {
        'commit_type': 'edit',
        'commit_cmds': [{
          'cmd': 'rename_state',
          'new_state_name': 'C',
          'old_state_name': 'B'
        }],
        'version_number': 3
      },
      {
        'commit_type': 'revert',
        'commit_cmds': [{
          'version_number': 2,
          'cmd': 'AUTO_revert_version_number'
        }],
        'version_number': 4
      },
      {
        'commit_type': 'edit',
        'commit_cmds': [{
          'cmd': 'delete_state',
          'state_name': 'B'
        }],
        'version_number': 5
      },
      {
        'commit_type': 'revert',
        'commit_cmds': [{
          'version_number': 3,
          'cmd': 'AUTO_revert_version_number'
        }],
        'version_number': 6
      },
      {
        'commit_type': 'edit',
        'commit_cmds': [{
          'cmd': 'add_state',
          'state_name': 'D'
        }],
        'version_number': 7
      },
      {
        'commit_type': 'edit',
        'commit_cmds': [{
          'cmd': 'edit_state_property',
          'state_name': 'D',
          'new_value': {'type': 'text', 'value': 'Some text'},
          'old_value': {'type': 'text', 'value': ''}
        }],
        'version_number': 8
      }
    ];

    var testExplorationData2 = [
      {
        'states': {
          'A': 'dummy_state_data'
        }
      },
      {
        'states': {
          'A': 'dummy_state_data',
          'B': 'dummy_state_data'
        }
      },
      {
        'states': {
          'A': 'dummy_state_data',
          'C': 'dummy_state_data'
        }
      },
      {
        'states': {
          'A': 'dummy_state_data',
          'B': 'dummy_state_data'
        }
      },
      {
        'states': {
          'A': 'dummy_state_data',
        }
      },
      {
        'states': {
          'A': 'dummy_state_data',
          'C': 'dummy_state_data'
        }
      },
      {
        'states': {
          'A': 'dummy_state_data',
          'C': 'dummy_state_data',
          'D': 'dummy_state_data'
        }
      },
      {
        'states': {
          'A': 'dummy_state_data',
          'C': 'dummy_state_data',
          'D': 'new_dummy_state_data'
        }
      }
    ];

    // Tests for getStatesDiff with reversions
    it('should mark states correctly when there is 1 reversion', function() {
      $httpBackend.expect('GET', '/createhandler/data/0?v=1')
        .respond(testExplorationData2[0]);
      $httpBackend.expect('GET', '/createhandler/data/0?v=5')
        .respond(testExplorationData2[4]);
      vts.init(testSnapshots2);
      cvs.getStatesDiff(1, 5).then(function(data) {
        expect(data).toEqual({
          1: {
            'newestStateName': 'A',
            'stateProperty': 'unchanged',
            'originalStateName': 'A'
          },
          2: {
            'newestStateName': 'B',
            'stateProperty': 'changed',
            'originalStateName': 'B'
          }
        });
      });
      $httpBackend.flush();
    });

    it('should mark states correctly when there is 1 reversion to before v1', function() {
      $httpBackend.expect('GET', '/createhandler/data/0?v=3')
        .respond(testExplorationData2[2]);
      $httpBackend.expect('GET', '/createhandler/data/0?v=5')
        .respond(testExplorationData2[4]);
      vts.init(testSnapshots2);
      cvs.getStatesDiff(3, 5).then(function(data) {
        expect(data).toEqual({
          1: {
            'newestStateName': 'A',
            'stateProperty': 'unchanged',
            'originalStateName': 'A'
          },
          2: {
            'newestStateName': 'B',
            'stateProperty': 'deleted',
            'originalStateName': 'C'
          }
        });
      });
      $httpBackend.flush();
    });

    it('should mark states correctly when compared version is a reversion', function() {
      $httpBackend.expect('GET', '/createhandler/data/0?v=4')
        .respond(testExplorationData2[3]);
      $httpBackend.expect('GET', '/createhandler/data/0?v=5')
        .respond(testExplorationData2[4]);
      vts.init(testSnapshots2);
      cvs.getStatesDiff(4, 5).then(function(data) {
        expect(data).toEqual({
          1: {
            'newestStateName': 'A',
            'stateProperty': 'unchanged',
            'originalStateName': 'A'
          },
          2: {
            'newestStateName': 'B',
            'stateProperty': 'deleted',
            'originalStateName': 'B'
          }
        });
      });
      $httpBackend.flush();
    });

    it('should mark states correctly when there are 2 reversions', function() {
      $httpBackend.expect('GET', '/createhandler/data/0?v=5')
        .respond(testExplorationData2[4]);
      $httpBackend.expect('GET', '/createhandler/data/0?v=8')
        .respond(testExplorationData2[7]);
      vts.init(testSnapshots2);
      cvs.getStatesDiff(5, 8).then(function(data) {
        expect(data).toEqual({
          1: {
            'newestStateName': 'A',
            'stateProperty': 'unchanged',
            'originalStateName': 'A'
          },
          2: {
            'newestStateName': 'C',
            'stateProperty': 'added',
            'originalStateName': 'B'
          },
          3: {
            'newestStateName': 'D',
            'stateProperty': 'added',
            'originalStateName': 'D'
          }
        });
      });
      $httpBackend.flush();
    });
  });
});
