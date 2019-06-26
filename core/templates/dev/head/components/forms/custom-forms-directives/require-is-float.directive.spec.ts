// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for Directive for requiring "isFloat" filter.
 */
require('domain/classifier/AnswerClassificationResultObjectFactory.ts');
require('domain/exploration/OutcomeObjectFactory.ts');
require(
  'pages/exploration-player-page/services/answer-classification.service.ts');

require(
  'components/forms/custom-forms-directives/' +
  'require-is-float.directive.ts');
  require('components/forms/validators/is-at-least.filter.ts');
  require('components/forms/validators/is-at-most.filter.ts');
  require('pages/exploration-editor-page/services/change-list.service.ts');
  require('pages/exploration-editor-page/services/exploration-title.service.ts');
  require(
    'components/state-editor/state-editor-properties-services/' +
    'state-editor.service.ts');
    require('domain/collection/GuestCollectionProgressObjectFactory.ts');

  
describe('Testing requireIsFloat directive', function() {
  var $compile, scope, testInput;
  var filterName = 'isAtLeast';

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($compile, $rootScope) {
    scope = $rootScope.$new();
    var element = '<form name="testForm">' +
      '<input name="floatValue" type="number" ng-model="localValue" ' +
      'require-is-float apply-validation>' +
      '</form>';
    scope.validators = function() {
      return [{
        id: 'isFloat'
      }];
    };
    $compile(element)(scope);
    testInput = scope.testForm.floatValue;
  }));

  it('should validate if value is a float', function() {
    testInput.$setViewValue('2');
    scope.$digest();
    expect(testInput.$valid).toEqual(true);

    testInput.$setViewValue('2.0');
    scope.$digest();
    expect(testInput.$valid).toEqual(true);

    testInput.$setViewValue('3.5');
    scope.$digest();
    expect(testInput.$valid).toEqual(true);

    testInput.$setViewValue('-3.5');
    scope.$digest();
    expect(testInput.$valid).toEqual(true);
  });

  it('should invalidate if value is not a float', function() {
    testInput.$setViewValue('-abc');
    scope.$digest();
    expect(testInput.$valid).toEqual(false);

    testInput.$setViewValue('3..5');
    scope.$digest();
    expect(testInput.$valid).toEqual(false);

    testInput.$setViewValue('-2.abc');
    scope.$digest();
    expect(testInput.$valid).toEqual(false);

    testInput.$setViewValue('0.3.5');
    scope.$digest();
    expect(testInput.$valid).toEqual(false);

    testInput.$setViewValue(undefined);
    scope.$digest();
    expect(testInput.$valid).toEqual(false);
  });
  var filterName = 'isAtMost';

  it('should have the relevant filters', angular.mock.inject(function($filter) {
    expect($filter(filterName)).not.toEqual(null);
  }));

  it('should impose minimum bounds', angular.mock.inject(function($filter) {
    var filter = $filter('isAtLeast');
    var args = {
      minValue: -2.0
    };
    expect(filter(1.23, args)).toBe(true);
    expect(filter(-1.23, args)).toBe(true);
    expect(filter(-1.99, args)).toBe(true);
    expect(filter(-2, args)).toBe(true);
    expect(filter(-2.01, args)).toBe(false);
    expect(filter(-3, args)).toBe(false);
  }));
  it('should have the relevant filters', angular.mock.inject(function($filter) {
    expect($filter(filterName)).not.toEqual(null);
  }));

  it('should impose maximum bounds', angular.mock.inject(function($filter) {
    var filter = $filter('isAtMost');
    var args = {
      maxValue: -2.0
    };
    expect(filter(-2, args)).toBe(true);
    expect(filter(-2.01, args)).toBe(true);
    expect(filter(-3, args)).toBe(true);
    expect(filter(1.23, args)).toBe(false);
    expect(filter(-1.23, args)).toBe(false);
    expect(filter(-1.99, args)).toBe(false);
  }));
});

describe('Change list service', function() {
  beforeEach(angular.mock.module('oppia'));

  describe('change list service', function() {
    var cls = null;
    var $httpBackend = null;
    var mockWarningsData;
    var mockExplorationData;

    var autosaveDraftUrl = 'createhandler/autosave_draft/0';
    var validAutosaveResponse = {
      is_version_of_draft_valid: true
    };

    beforeEach(function() {
      mockWarningsData = {
        addWarning: function() {}
      };
      angular.mock.module(function($provide) {
        $provide.value('AlertsService', [mockWarningsData][0]);
      });
      spyOn(mockWarningsData, 'addWarning');
      mockExplorationData = {
        explorationId: 0,
        autosaveChangeList: function() {},
        discardDraft: function() {}
      };
      angular.mock.module(function($provide) {
        $provide.value('ExplorationDataService', [mockExplorationData][0]);
      });
      spyOn(mockExplorationData, 'autosaveChangeList');
    });

    beforeEach(angular.mock.inject(function($injector) {
      cls = $injector.get('ChangeListService');
      $httpBackend = $injector.get('$httpBackend');
    }));

    it('should correctly get and save changes', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.addState('newState');
      expect(cls.getChangeList()).not.toBe([]);
      expect(mockWarningsData.addWarning).not.toHaveBeenCalled();
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    });

    it('should correctly add a new state', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.addState('newState');
      expect(cls.getChangeList()).toEqual([{
        cmd: 'add_state',
        state_name: 'newState'
      }]);
      expect(mockWarningsData.addWarning).not.toHaveBeenCalled();
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    });

    it('should correctly rename a state', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.renameState('newName', 'oldName');
      expect(cls.getChangeList()).toEqual([{
        cmd: 'rename_state',
        old_state_name: 'oldName',
        new_state_name: 'newName'
      }]);
      expect(mockWarningsData.addWarning).not.toHaveBeenCalled();
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    });

    it('should correctly delete a state', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.deleteState('deletedState');
      expect(cls.getChangeList()).toEqual([{
        cmd: 'delete_state',
        state_name: 'deletedState'
      }]);
      expect(mockWarningsData.addWarning).not.toHaveBeenCalled();
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    });

    it('should correctly edit an exploration property', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.editExplorationProperty('title', 'newTitle', 'oldTitle');
      expect(cls.getChangeList()).toEqual([{
        cmd: 'edit_exploration_property',
        property_name: 'title',
        new_value: 'newTitle',
        old_value: 'oldTitle'
      }]);
      expect(mockWarningsData.addWarning).not.toHaveBeenCalled();
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    });

    it('should detect invalid exploration properties', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.editExplorationProperty('fake_property', 'newThing', 'oldThing');
      expect(mockWarningsData.addWarning).toHaveBeenCalledWith(
        'Invalid exploration property: fake_property');
      expect(mockExplorationData.autosaveChangeList).not.toHaveBeenCalled();
    });

    it('should correctly edit a state property', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.editStateProperty('stateName', 'content', 'newC', 'oldC');
      expect(cls.getChangeList()).toEqual([{
        cmd: 'edit_state_property',
        state_name: 'stateName',
        property_name: 'content',
        new_value: 'newC',
        old_value: 'oldC'
      }]);
      expect(mockWarningsData.addWarning).not.toHaveBeenCalled();
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    });

    it('should detect invalid exploration properties', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.editStateProperty(
        'stateName', 'fake_property', 'newThing', 'oldThing');
      expect(mockWarningsData.addWarning).toHaveBeenCalledWith(
        'Invalid state property: fake_property');
      expect(mockExplorationData.autosaveChangeList).not.toHaveBeenCalled();
    });

    it('should correctly discard all changes', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.addState('newState');
      expect(cls.getChangeList()).not.toBe([]);
      cls.discardAllChanges();
      expect(cls.getChangeList()).toEqual([]);
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    });

    it('should correctly handle multiple changes in succession', function() {
      expect(cls.getChangeList()).toEqual([]);

      cls.addState('newState1');
      cls.addState('newState2');
      expect(cls.getChangeList()).toEqual([{
        cmd: 'add_state',
        state_name: 'newState1'
      }, {
        cmd: 'add_state',
        state_name: 'newState2'
      }]);
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    });

    it('should correctly undo changes', function() {
      expect(cls.getChangeList()).toEqual([]);

      cls.addState('newState1');
      cls.addState('newState2');
      expect(cls.getChangeList()).toEqual([{
        cmd: 'add_state',
        state_name: 'newState1'
      }, {
        cmd: 'add_state',
        state_name: 'newState2'
      }]);

      cls.undoLastChange();
      expect(cls.getChangeList()).toEqual([{
        cmd: 'add_state',
        state_name: 'newState1'
      }]);

      cls.undoLastChange();
      expect(cls.getChangeList()).toEqual([]);
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    });
  });
});

describe('Exploration title service', function() {
  beforeEach(angular.mock.module('oppia'));

  describe('exploration title service', function() {
    var ets = null;
    var $httpBackend = null;
    var mockExplorationData;

    var autosaveDraftUrl = 'createhandler/autosave_draft/0';
    var validAutosaveResponse = {
      is_version_of_draft_valid: true
    };

    beforeEach(function() {
      mockExplorationData = {
        explorationId: 0,
        autosaveChangeList: function() {}
      };
      angular.mock.module(function($provide) {
        $provide.value('ExplorationDataService', [mockExplorationData][0]);
        $provide.constant('INVALID_NAME_CHARS', '#@&^%$');
      });
      spyOn(mockExplorationData, 'autosaveChangeList');
    });

    beforeEach(angular.mock.inject(function($injector) {
      ets = $injector.get('ExplorationTitleService');
      $httpBackend = $injector.get('$httpBackend');
    }));

    it('correctly initializes the service', function() {
      expect(ets.displayed).toBeUndefined();
      expect(ets.savedMemento).toBeUndefined();
      ets.init('A title');
      expect(ets.displayed).toEqual('A title');
      expect(ets.savedMemento).toEqual('A title');
    });

    it('updates only the title and not the memento', function() {
      ets.init('A title');
      ets.displayed = 'New title';
      expect(ets.displayed).toEqual('New title');
      expect(ets.savedMemento).toEqual('A title');
      expect(mockExplorationData.autosaveChangeList).not.toHaveBeenCalled();
    });

    it('restores correctly from the memento', function() {
      ets.init('A title');
      ets.displayed = 'New title';
      ets.restoreFromMemento();
      expect(ets.displayed).toEqual('A title');
      expect(ets.savedMemento).toEqual('A title');
    });

    it('updates the memento with the displayed title', function() {
      ets.init('A title');
      ets.displayed = 'New title';
      expect(ets.savedMemento).toEqual('A title');
      ets.saveDisplayedValue();
      expect(ets.savedMemento).toEqual('New title');
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    });

    it('reports whether the title has changed since it was saved', function() {
      ets.init('A title');
      expect(ets.hasChanged()).toBe(false);
      ets.displayed = 'A title';
      expect(ets.hasChanged()).toBe(false);
      ets.displayed = 'New title';
      expect(ets.hasChanged()).toBe(true);
      ets.displayed = 'A title';
      expect(ets.hasChanged()).toBe(false);

      ets.saveDisplayedValue();
      expect(mockExplorationData.autosaveChangeList).not.toHaveBeenCalled();
      expect(ets.hasChanged()).toBe(false);
    });
  });
});

describe('Editor state service', function() {
  beforeEach(angular.mock.module('oppia'));

  describe('editor state service', function() {
    var ecs = null;

    beforeEach(angular.mock.inject(function($injector) {
      ecs = $injector.get('StateEditorService');
    }));

    it('should correctly set and get state names', function() {
      ecs.setActiveStateName('A State');
      expect(ecs.getActiveStateName()).toBe('A State');
    });

    it('should not allow invalid state names to be set', function() {
      ecs.setActiveStateName('');
      expect(ecs.getActiveStateName()).toBeNull();

      ecs.setActiveStateName(null);
      expect(ecs.getActiveStateName()).toBeNull();
    });

    it('should correctly set and get solicitAnswerDetails', function() {
      expect(ecs.getSolicitAnswerDetails()).toBeNull();
      ecs.setSolicitAnswerDetails(false);
      expect(ecs.getSolicitAnswerDetails()).toEqual(false);
      ecs.setSolicitAnswerDetails(true);
      expect(ecs.getSolicitAnswerDetails()).toEqual(true);
    });

    it('should correctly return answer choices for interaction', function() {
      var customizationArgsForMultipleChoiceInput = {
        choices: {
          value: [
            'Choice 1',
            'Choice 2'
          ]
        }
      };
      expect(
        ecs.getAnswerChoices(
          'MultipleChoiceInput', customizationArgsForMultipleChoiceInput)
      ).toEqual([{
        val: 0,
        label: 'Choice 1',
      }, {
        val: 1,
        label: 'Choice 2',
      }]);

      var customizationArgsForImageClickInput = {
        imageAndRegions: {
          value: {
            labeledRegions: [{
              label: 'Label 1'
            }, {
              label: 'Label 2'
            }]
          }
        }
      };
      expect(
        ecs.getAnswerChoices(
          'ImageClickInput', customizationArgsForImageClickInput)
      ).toEqual([{
        val: 'Label 1',
        label: 'Label 1',
      }, {
        val: 'Label 2',
        label: 'Label 2',
      }]);

      var customizationArgsForItemSelectionAndDragAndDropInput = {
        choices: {
          value: [
            'Choice 1',
            'Choice 2'
          ]
        }
      };
      expect(
        ecs.getAnswerChoices(
          'ItemSelectionInput',
          customizationArgsForItemSelectionAndDragAndDropInput)
      ).toEqual([{
        val: 'Choice 1',
        label: 'Choice 1',
      }, {
        val: 'Choice 2',
        label: 'Choice 2',
      }]);
      expect(
        ecs.getAnswerChoices(
          'DragAndDropSortInput',
          customizationArgsForItemSelectionAndDragAndDropInput)
      ).toEqual([{
        val: 'Choice 1',
        label: 'Choice 1',
      }, {
        val: 'Choice 2',
        label: 'Choice 2',
      }]);
    });
  });
});

describe('Answer classification result object factory', function() {
  var oof, acrof;
  var DEFAULT_OUTCOME_CLASSIFICATION;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    acrof = $injector.get('AnswerClassificationResultObjectFactory');
    oof = $injector.get('OutcomeObjectFactory');
    DEFAULT_OUTCOME_CLASSIFICATION = $injector.get(
      'DEFAULT_OUTCOME_CLASSIFICATION');
  }));

  it('should create a new result', function() {
    var answerClassificationResult = acrof.createNew(
      oof.createNew('default', '', []), 1, 0, DEFAULT_OUTCOME_CLASSIFICATION
    );

    expect(answerClassificationResult.outcome).toEqual(
      oof.createNew('default', '', []));
    expect(answerClassificationResult.answerGroupIndex).toEqual(1);
    expect(answerClassificationResult.ruleIndex).toEqual(0);
    expect(answerClassificationResult.classificationCategorization).toEqual(
      DEFAULT_OUTCOME_CLASSIFICATION);
  });
});

describe('Guest collection progress object factory', function() {
  var GuestCollectionProgressObjectFactory = null;
  var _collectionId0 = null;
  var _collectionId1 = null;
  var _expId0 = null;
  var _expId1 = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    GuestCollectionProgressObjectFactory = (
      $injector.get('GuestCollectionProgressObjectFactory'));

    _collectionId0 = 'collection_id0';
    _collectionId1 = 'collection_id1';
    _expId0 = 'exploration_id0';
    _expId1 = 'exploration_id1';
  }));

  var _createEmptyProgressObject = function() {
    return GuestCollectionProgressObjectFactory.createFromJson(null);
  };

  describe('hasCompletionProgress', function() {
    it('should initially have no progress', function() {
      var guestCollectionProgress = _createEmptyProgressObject();
      expect(guestCollectionProgress.hasCompletionProgress(
        _collectionId0)).toBe(false);
    });

    it('should have progress after recording an exploration', function() {
      var guestCollectionProgress = _createEmptyProgressObject();
      guestCollectionProgress.addCompletedExplorationId(
        _collectionId0, _expId0);
      expect(guestCollectionProgress.hasCompletionProgress(
        _collectionId0)).toBe(true);
    });

    it('should have no progress for an unknown exploration', function() {
      var guestCollectionProgress = _createEmptyProgressObject();
      guestCollectionProgress.addCompletedExplorationId(
        _collectionId1, _expId0);
      expect(guestCollectionProgress.hasCompletionProgress(
        _collectionId0)).toBe(false);
    });
  });

  describe('getCompletedExplorationIds', function() {
    it('should initially have no completed exploration IDs', function() {
      var guestCollectionProgress = _createEmptyProgressObject();
      expect(guestCollectionProgress.getCompletedExplorationIds(
        _collectionId0)).toEqual([]);
    });

    it('should provide completed exploration ID', function() {
      var guestCollectionProgress = _createEmptyProgressObject();
      guestCollectionProgress.addCompletedExplorationId(
        _collectionId0, _expId0);
      expect(guestCollectionProgress.getCompletedExplorationIds(
        _collectionId0)).toEqual([_expId0]);
    });

    it('should not provide completed exp ID for other collection', function() {
      var guestCollectionProgress = _createEmptyProgressObject();
      guestCollectionProgress.addCompletedExplorationId(
        _collectionId1, _expId0);
      expect(guestCollectionProgress.getCompletedExplorationIds(
        _collectionId0)).toEqual([]);
    });

    it('should provide all completed exploration IDs in order', function() {
      var guestCollectionProgress = _createEmptyProgressObject();
      guestCollectionProgress.addCompletedExplorationId(
        _collectionId0, _expId1);
      guestCollectionProgress.addCompletedExplorationId(
        _collectionId1, _expId0);
      guestCollectionProgress.addCompletedExplorationId(
        _collectionId0, _expId0);
      expect(guestCollectionProgress.getCompletedExplorationIds(
        _collectionId0)).toEqual([_expId1, _expId0]);
    });
  });

  describe('addCompletedExplorationId', function() {
    it('should successfully add exploration to empty collection', function() {
      var guestCollectionProgress = _createEmptyProgressObject();
      expect(guestCollectionProgress.addCompletedExplorationId(
        _collectionId0, _expId0)).toBe(true);
    });

    it('should fail to re-add exploration to collection', function() {
      var guestCollectionProgress = _createEmptyProgressObject();
      guestCollectionProgress.addCompletedExplorationId(
        _collectionId0, _expId0);
      expect(guestCollectionProgress.addCompletedExplorationId(
        _collectionId0, _expId0)).toBe(false);
    });

    it('should successfully add exploration to second collection', function() {
      var guestCollectionProgress = _createEmptyProgressObject();
      guestCollectionProgress.addCompletedExplorationId(
        _collectionId0, _expId0);
      expect(guestCollectionProgress.addCompletedExplorationId(
        _collectionId1, _expId0)).toBe(true);
    });
  });

  describe('toJson', function() {
    it('should convert an empty progress object to simple JSON', function() {
      expect(_createEmptyProgressObject().toJson()).toEqual('{}');
    });

    it('should convert progress for one collection to JSON', function() {
      var guestCollectionProgress = _createEmptyProgressObject();
      guestCollectionProgress.addCompletedExplorationId(
        _collectionId0, _expId0);

      expect(guestCollectionProgress.toJson()).toEqual(
        '{"collection_id0":["exploration_id0"]}');
    });

    it('should convert progress for multiple collections to JSON', function() {
      var guestCollectionProgress = _createEmptyProgressObject();
      guestCollectionProgress.addCompletedExplorationId(
        _collectionId1, _expId1);
      guestCollectionProgress.addCompletedExplorationId(
        _collectionId0, _expId1);
      guestCollectionProgress.addCompletedExplorationId(
        _collectionId1, _expId0);

      expect(guestCollectionProgress.toJson()).toEqual(
        '{"collection_id1":["exploration_id1","exploration_id0"],' +
        '"collection_id0":["exploration_id1"]}');
    });
  });

  describe('createFromJson', function() {
    it('should create a new empty progress object from JSON', function() {
      var guestCollectionProgress = (
        GuestCollectionProgressObjectFactory.createFromJson('{}'));
      expect(guestCollectionProgress).toEqual(_createEmptyProgressObject());
    });

    it('should create a progress object from some progress JSON', function() {
      var expectedCollectionProgress = _createEmptyProgressObject();
      expectedCollectionProgress.addCompletedExplorationId(
        _collectionId0, _expId0);

      var guestCollectionProgress = (
        GuestCollectionProgressObjectFactory.createFromJson(
          '{"collection_id0": ["exploration_id0"]}'));

      expect(guestCollectionProgress).toEqual(expectedCollectionProgress);
    });

    it('should create a progress object for multiple collections', function() {
      var expectedCollectionProgress = _createEmptyProgressObject();
      expectedCollectionProgress.addCompletedExplorationId(
        _collectionId1, _expId1);
      expectedCollectionProgress.addCompletedExplorationId(
        _collectionId0, _expId1);
      expectedCollectionProgress.addCompletedExplorationId(
        _collectionId1, _expId0);

      var guestCollectionProgress = (
        GuestCollectionProgressObjectFactory.createFromJson(
          '{"collection_id1": ["exploration_id1", "exploration_id0"], ' +
          '"collection_id0": ["exploration_id1"]}'));

      expect(guestCollectionProgress).toEqual(expectedCollectionProgress);
    });
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for GuestCollectionProgressService.
 */

require('domain/collection/CollectionNodeObjectFactory.ts');
require('domain/collection/CollectionObjectFactory.ts');
require('domain/collection/GuestCollectionProgressService.ts');

describe('Guest collection progress service', function() {
  var GuestCollectionProgressService = null;
  var CollectionObjectFactory = null;
  var CollectionNodeObjectFactory = null;
  var _collectionId0 = null;
  var _collectionId1 = null;
  var _expId0 = null;
  var _expTitle0 = null;
  var _expId1 = null;
  var _expTitle1 = null;
  var _expId2 = null;
  var _expTitle2 = null;
  var _collection0 = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    GuestCollectionProgressService = $injector.get(
      'GuestCollectionProgressService');
    CollectionObjectFactory = $injector.get('CollectionObjectFactory');
    CollectionNodeObjectFactory = $injector.get('CollectionNodeObjectFactory');

    _collectionId0 = 'sample_collection_id0';
    _collectionId1 = 'sample_collection_id1';
    _expId0 = 'exp_id0';
    _expTitle0 = 'Exp 0';
    _expId1 = 'exp_id1';
    _expTitle1 = 'Exp 1';
    _expId2 = 'exp_id2';
    _expTitle2 = 'Exp 2';
    _collection0 = _createCollection(_collectionId0, 'a title');
    _collection0.addCollectionNode(
      CollectionNodeObjectFactory.createFromExplorationId(_expId0));
  }));

  afterEach(function() {
    // Reset localStorage to ensure state is not shared between the tests.
    window.localStorage.clear();
  });

  var _createCollection = function(collectionId, title) {
    var collectionBackendObject = {
      id: collectionId,
      title: title,
      objective: 'an objective',
      category: 'a category',
      version: '1',
      nodes: []
    };
    return CollectionObjectFactory.create(collectionBackendObject);
  };

  var _createCollectionNode = function(expId, expTitle) {
    var collectionNodeBackendObject = {
      exploration_id: expId,
      exploration_summary: {
        title: expTitle,
        category: 'exp category',
        objective: 'exp objective'
      }
    };
    return CollectionNodeObjectFactory.create(collectionNodeBackendObject);
  };


  // TODO(bhenning): Find a way to de-duplicate & share this with
  // CollectionLinearizerServiceSpec.
  // The linear order of explorations is: exp_id0 -> exp_id1 -> exp_id2
  var _createLinearCollection = function(collectionId) {
    var collection = _createCollection(collectionId, 'Collection title');

    var collectionNode0 = _createCollectionNode(_expId0, _expTitle0);
    var collectionNode1 = _createCollectionNode(_expId1, _expTitle1);
    var collectionNode2 = _createCollectionNode(_expId2, _expTitle2);

    collection.addCollectionNode(collectionNode0);
    collection.addCollectionNode(collectionNode1);
    collection.addCollectionNode(collectionNode2);
    return collection;
  };

  describe('hasCompletedSomeExploration', function() {
    it('should initially not have any stored progress', function() {
      var hasProgress = (
        GuestCollectionProgressService.hasCompletedSomeExploration(
          _collectionId0));
      expect(hasProgress).toBe(false);
    });

    it('should have progress after recording an exploration', function() {
      GuestCollectionProgressService.recordExplorationCompletedInCollection(
        _collectionId0, _expId0);
      var hasProgress = (
        GuestCollectionProgressService.hasCompletedSomeExploration(
          _collectionId0));
      expect(hasProgress).toBe(true);
    });

    it('should not have progress after exp completed for another collection',
      function() {
        GuestCollectionProgressService.recordExplorationCompletedInCollection(
          _collectionId1, _expId0);
        var hasProgress = (
          GuestCollectionProgressService.hasCompletedSomeExploration(
            _collectionId0));
        expect(hasProgress).toBe(false);
      }
    );
  });

  describe('getCompletedExplorationIds', function() {
    it('should initially provide no completed exploration ids', function() {
      var completedIds = (
        GuestCollectionProgressService.getCompletedExplorationIds(
          _collection0));
      expect(completedIds).toEqual([]);
    });

    it('should provide completed exploration ID after completion', function() {
      GuestCollectionProgressService.recordExplorationCompletedInCollection(
        _collectionId0, _expId0);
      var completedIds = (
        GuestCollectionProgressService.getCompletedExplorationIds(
          _collection0));
      expect(completedIds).toEqual([_expId0]);
    });

    it('should not provide completed ID for exp not in collection', function() {
      GuestCollectionProgressService.recordExplorationCompletedInCollection(
        _collectionId0, _expId1);
      var completedIds = (
        GuestCollectionProgressService.getCompletedExplorationIds(
          _collection0));
      expect(completedIds).toEqual([]);
    });

    it('should provide multiple completed exploration IDs', function() {
      var collection = _createLinearCollection(_collectionId1);
      GuestCollectionProgressService.recordExplorationCompletedInCollection(
        _collectionId1, _expId0);
      GuestCollectionProgressService.recordExplorationCompletedInCollection(
        _collectionId1, _expId2);
      var completedIds = (
        GuestCollectionProgressService.getCompletedExplorationIds(collection));
      expect(completedIds).toEqual([_expId0, _expId2]);
    });
  });

  describe('getNextExplorationId', function() {
    it('should provide the first exploration ID with no progress', function() {
      var collection = _createLinearCollection(_collectionId1);
      var nextExplorationId = (
        GuestCollectionProgressService.getNextExplorationId(collection, []));
      expect(nextExplorationId).toEqual(_expId0);
    });

    it('should provide the third exp ID with first two exps done', function() {
      var collection = _createLinearCollection(_collectionId1);
      var nextExplorationId = (
        GuestCollectionProgressService.getNextExplorationId(
          collection, [_expId0, _expId1]));

      // First two explorations are completed, so return the third.
      expect(nextExplorationId).toEqual(_expId2);
    });

    it('should return null for fully completed collection', function() {
      var collection = _createLinearCollection(_collectionId1);
      var nextExplorationId = (
        GuestCollectionProgressService.getNextExplorationId(
          collection, [_expId0, _expId1, _expId2]));

      // There are no explorations left to play.
      expect(nextExplorationId).toEqual(null);
    });
  });
});
// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for Validator to check if input is float.
 */

require('components/forms/validators/is-float.filter.ts');

describe('Normalizer tests', function() {
  var filterName = 'isFloat';

  beforeEach(angular.mock.module('oppia'));

  it('should have the relevant filters', angular.mock.inject(function($filter) {
    expect($filter(filterName)).not.toEqual(null);
  }));

  it('should validate floats correctly', angular.mock.inject(function($filter) {
    var filter = $filter('isFloat');
    expect(filter('1.23')).toEqual(1.23);
    expect(filter('-1.23')).toEqual(-1.23);
    expect(filter('0')).toEqual(0);
    expect(filter('-1')).toEqual(-1);
    expect(filter('-1.0')).toEqual(-1);
    expect(filter('1,5')).toEqual(1.5);
    expect(filter('1%')).toEqual(0.01);
    expect(filter('1.5%')).toEqual(0.015);
    expect(filter('-5%')).toEqual(-0.05);
    expect(filter('.35')).toEqual(0.35);
    expect(filter(',3')).toEqual(0.3);
    expect(filter('.3%')).toEqual(0.003);
    expect(filter('2,5%')).toEqual(0.025);
    expect(filter('3.2% ')).toEqual(0.032);
    expect(filter(' 3.2% ')).toEqual(0.032);
    expect(filter('0.')).toEqual(0);

    expect(filter('3%%')).toBeUndefined();
    expect(filter('-')).toBeUndefined();
    expect(filter('.')).toBeUndefined();
    expect(filter(',')).toBeUndefined();
    expect(filter('5%,')).toBeUndefined();
    expect(filter('')).toBeUndefined();
    expect(filter('1.23a')).toBeUndefined();
    expect(filter('abc')).toBeUndefined();
    expect(filter('2+3')).toBeUndefined();
    expect(filter('--1.23')).toBeUndefined();
    expect(filter('=1.23')).toBeUndefined();
    expect(filter(undefined)).toBeUndefined();
  }));
});
// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for Validator to check if input is integer.
 */

require('components/forms/validators/is-integer.filter.ts');

describe('Normalizer tests', function() {
  var filterName = 'isInteger';

  beforeEach(angular.mock.module('oppia'));

  it('should have the relevant filters', angular.mock.inject(function($filter) {
    expect($filter(filterName)).not.toEqual(null);
  }));

  it('should validate integers', angular.mock.inject(function($filter) {
    var filter = $filter('isInteger');
    expect(filter('3')).toBe(true);
    expect(filter('-3')).toBe(true);
    expect(filter('3.0')).toBe(true);
    expect(filter('3.5')).toBe(false);
  }));
});
// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for Validator to check if input is nonempty.
 */

require('components/forms/validators/is-nonempty.filter.ts');

describe('Normalizer tests', function() {
  var filterName = 'isNonempty';

  beforeEach(angular.mock.module('oppia'));

  it('should have the relevant filters', angular.mock.inject(function($filter) {
    expect($filter(filterName)).not.toEqual(null);
  }));

  it('should validate non-emptiness', angular.mock.inject(function($filter) {
    var filter = $filter('isNonempty');
    expect(filter('a')).toBe(true);
    expect(filter('')).toBe(false);
  }));
});
// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the question player state service.
 */

require(
  'components/question-directives/question-player/services/' +
  'question-player-state.service.ts');

describe('Question player state service', function() {
  var qpservice;
  var questionId = 'question_1';

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    qpservice = $injector.get('QuestionPlayerStateService');
  }));

  it('should return an empty question state dictionary', function() {
    expect(qpservice.getQuestionPlayerStateData()).toEqual({});
  });

  it('should add a hint to the question state data', function() {
    qpservice.hintUsed(questionId);
    var stateData = qpservice.getQuestionPlayerStateData();
    expect(stateData[questionId]).toBeTruthy();
    expect(stateData[questionId].usedHints).toBeDefined();
    expect(stateData[questionId].usedHints.length).toEqual(1);
    expect(stateData[questionId].usedHints[0].timestamp).toBeDefined();
    expect(stateData[questionId].usedHints[0].timestamp).toBeGreaterThan(0);
  });

  it('should record a wrong answer was submitted to the question state data',
    function() {
      qpservice.answerSubmitted(questionId, false);
      var stateData = qpservice.getQuestionPlayerStateData();
      expect(stateData[questionId]).toBeTruthy();
      expect(stateData[questionId].answers).toBeDefined();
      expect(stateData[questionId].answers.length).toEqual(1);
      expect(stateData[questionId].answers[0].isCorrect).toEqual(false);
      expect(stateData[questionId].answers[0].timestamp).toBeGreaterThan(0);
    });

  it('should record a right answer was submitted to the question state data',
    function() {
      qpservice.answerSubmitted(questionId, true);
      var stateData = qpservice.getQuestionPlayerStateData();
      expect(stateData[questionId]).toBeTruthy();
      expect(stateData[questionId].answers).toBeDefined();
      expect(stateData[questionId].answers.length).toEqual(1);
      expect(stateData[questionId].answers[0].isCorrect).toEqual(true);
      expect(stateData[questionId].answers[0].timestamp).toBeGreaterThan(0);
    });

  it('should record that a solution was viewed',
    function() {
      qpservice.solutionViewed(questionId);
      var stateData = qpservice.getQuestionPlayerStateData();
      expect(stateData[questionId]).toBeTruthy();
      expect(stateData[questionId].viewedSolution).toBeDefined();
      expect(stateData[questionId].viewedSolution.timestamp).toBeDefined();
      expect(
        stateData[questionId].viewedSolution.timestamp).toBeGreaterThan(0);
    });

  it('should shouldn\'t record a correct answer if a solution was viewed',
    function() {
      qpservice.solutionViewed(questionId);
      var stateData = qpservice.getQuestionPlayerStateData();
      expect(stateData[questionId]).toBeTruthy();
      expect(stateData[questionId].viewedSolution).toBeDefined();
      expect(stateData[questionId].viewedSolution.timestamp).toBeDefined();
      expect(
        stateData[questionId].viewedSolution.timestamp).toBeGreaterThan(0);
      qpservice.answerSubmitted(questionId, true);
      expect(stateData[questionId]).toBeTruthy();
      expect(stateData[questionId].answers.length).toEqual(0);
    });
});
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
 * @fileoverview Tests that average ratings are being computed correctly.
 */

require('components/ratings/rating-computation/rating-computation.service.ts');

describe('Rating computation service', function() {
  var RatingComputationService;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector) {
    RatingComputationService = $injector.get('RatingComputationService');
  }));

  it(
    'should show an average rating only if there are enough individual ones',
    function() {
      // Don't show an average rating if there are too few ratings.
      expect(RatingComputationService.computeAverageRating({
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      })).toBe(undefined);

      // Show an average rating once the minimum is reached.
      expect(RatingComputationService.computeAverageRating({
        1: 1,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      })).toBe(1.0);

      // Continue showing an average rating if additional ratings are added.
      expect(RatingComputationService.computeAverageRating({
        1: 1,
        2: 0,
        3: 0,
        4: 0,
        5: 1
      })).toBe(3.0);
    }
  );

  it('should compute average ratings correctly', function() {
    expect(RatingComputationService.computeAverageRating({
      1: 6,
      2: 3,
      3: 8,
      4: 12,
      5: 11
    })).toBe(3.475);
  });
});
// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the ClassifierObjectFactory.
 */

require('domain/classifier/ClassifierObjectFactory.ts');

describe('Classifier Object Factory', function() {
  var ClassifierObjectFactory;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    ClassifierObjectFactory = $injector.get('ClassifierObjectFactory');
  }));

  it('should create a new classifier', function() {
    var classifierObject = (
      ClassifierObjectFactory.create('TestClassifier', {}, 1));

    expect(classifierObject.algorithmId).toEqual('TestClassifier');
    expect(classifierObject.classifierData).toEqual({});
    expect(classifierObject.dataSchemaVersion).toEqual(1);
  });
});
// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for CollectionNodeObjectFactory.
 */

require('domain/collection/CollectionNodeObjectFactory.ts');

describe('Collection node object factory', function() {
  var CollectionNodeObjectFactory = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    CollectionNodeObjectFactory = $injector.get('CollectionNodeObjectFactory');
  }));

  var _createEmptyCollectionNode = function(explorationId) {
    return CollectionNodeObjectFactory.create({
      exploration_id: explorationId,
      exploration_summary: {
        title: 'Title',
        status: 'private'
      }
    });
  };

  it('should provide an immutable exploration summary', function() {
    var explorationSummaryBackendObject = {
      title: 'exp title',
      category: 'exp category',
      objective: 'exp objective'
    };
    var collectionNodeBackendObject = {
      exploration_id: 'exp_id0',
      exploration_summary: explorationSummaryBackendObject
    };

    var collectionNode = CollectionNodeObjectFactory.create(
      collectionNodeBackendObject);
    expect(collectionNode.getExplorationId()).toEqual('exp_id0');
    expect(collectionNode.getExplorationTitle()).toEqual('exp title');

    var summaryObject = collectionNode.getExplorationSummaryObject();
    expect(summaryObject).toEqual(explorationSummaryBackendObject);

    delete summaryObject.category;
    expect(summaryObject).not.toEqual(
      collectionNode.getExplorationSummaryObject());
  });

  it('should be able to create a new collection node by exploration ID',
    function() {
      var collectionNode = CollectionNodeObjectFactory.createFromExplorationId(
        'exp_id0');
      expect(collectionNode.getExplorationId()).toEqual('exp_id0');
      expect(collectionNode.doesExplorationExist()).toBe(false);
    }
  );
});
// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for CollectionObjectFactory.
 */

require('domain/collection/CollectionNodeObjectFactory.ts');
require('domain/collection/CollectionObjectFactory.ts');

describe('Collection object factory', function() {
  var CollectionObjectFactory = null;
  var CollectionNodeObjectFactory = null;
  var _sampleCollection = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    CollectionObjectFactory = $injector.get('CollectionObjectFactory');
    CollectionNodeObjectFactory = $injector.get('CollectionNodeObjectFactory');


    var sampleCollectionBackendObject = {
      id: 'sample_collection_id',
      title: 'a title',
      objective: 'an objective',
      category: 'a category',
      version: '1',
      nodes: [],
    };
    _sampleCollection = CollectionObjectFactory.create(
      sampleCollectionBackendObject);
  }));

  var _addCollectionNode = function(explorationId) {
    var collectionNodeBackendObject = {
      exploration_id: explorationId,
      exploration: {}
    };
    return _sampleCollection.addCollectionNode(
      CollectionNodeObjectFactory.create(collectionNodeBackendObject));
  };

  var _getCollectionNode = function(explorationId) {
    return _sampleCollection.getCollectionNodeByExplorationId(explorationId);
  };

  it('should be able to create an empty collection object', function() {
    var collection = CollectionObjectFactory.createEmptyCollection();
    expect(collection.getId()).toBeUndefined();
    expect(collection.getTitle()).toBeUndefined();
    expect(collection.getCategory()).toBeUndefined();
    expect(collection.getObjective()).toBeUndefined();
    expect(collection.getLanguageCode()).toBeUndefined();
    expect(collection.getTags()).toBeUndefined();
    expect(collection.getVersion()).toBeUndefined();
    expect(collection.getCollectionNodes()).toEqual([]);
  });

  it('should contain a collection node defined in the backend object',
    function() {
      var collectionNodeBackendObject = {
        exploration_id: 'exp_id0',
        exploration: {}
      };
      var collection = CollectionObjectFactory.create({
        id: 'collection_id',
        nodes: [collectionNodeBackendObject]
      });
      expect(collection.containsCollectionNode('exp_id0')).toBe(true);
      expect(collection.getCollectionNodes()).toEqual([
        CollectionNodeObjectFactory.create(collectionNodeBackendObject)
      ]);
    }
  );

  it('should contain added explorations and not contain removed ones',
    function() {
      expect(_sampleCollection.containsCollectionNode('exp_id0')).toBe(false);
      expect(_sampleCollection.getCollectionNodeCount()).toEqual(0);

      var collectionNodeBackendObject = {
        exploration_id: 'exp_id0',
        exploration: {}
      };
      var collectionNode = CollectionNodeObjectFactory.create(
        collectionNodeBackendObject);

      expect(_sampleCollection.addCollectionNode(collectionNode)).toBe(true);
      expect(_sampleCollection.containsCollectionNode('exp_id0')).toBe(true);
      expect(_sampleCollection.getCollectionNodes()).toEqual([
        CollectionNodeObjectFactory.create(collectionNodeBackendObject)
      ]);
      expect(_sampleCollection.getCollectionNodeCount()).toEqual(1);

      expect(_sampleCollection.deleteCollectionNode('exp_id0')).toBe(true);
      expect(_sampleCollection.containsCollectionNode('exp_id0')).toBe(false);
      expect(_sampleCollection.getCollectionNodeCount()).toEqual(0);
    }
  );

  it('should not add duplicate explorations', function() {
    var collectionNodeBackendObject = {
      exploration_id: 'exp_id0',
      exploration: {}
    };
    var collectionNode = CollectionNodeObjectFactory.create(
      collectionNodeBackendObject);

    expect(_sampleCollection.addCollectionNode(collectionNode)).toBe(true);
    expect(_sampleCollection.addCollectionNode(collectionNode)).toBe(false);
  });

  it('should fail to delete nonexistent explorations', function() {
    expect(_sampleCollection.deleteCollectionNode('fake_exp_id')).toBe(false);
  });

  it('should be able to clear all nodes from a collection', function() {
    expect(_sampleCollection.getCollectionNodeCount()).toEqual(0);

    var collectionNodeBackendObject1 = {
      exploration_id: 'exp_id0',
      exploration: {}
    };
    var collectionNodeBackendObject2 = {
      exploration_id: 'exp_id1',
      exploration: {}
    };
    var collectionNode1 = CollectionNodeObjectFactory.create(
      collectionNodeBackendObject1);
    var collectionNode2 = CollectionNodeObjectFactory.create(
      collectionNodeBackendObject2);

    _sampleCollection.addCollectionNode(collectionNode1);
    expect(_sampleCollection.getCollectionNodeCount()).toEqual(1);
    expect(_sampleCollection.containsCollectionNode('exp_id0')).toBe(true);

    _sampleCollection.clearCollectionNodes();
    expect(_sampleCollection.getCollectionNodeCount()).toEqual(0);
    expect(_sampleCollection.containsCollectionNode('exp_id0')).toBe(false);
    expect(_sampleCollection.getCollectionNodes()).toEqual([]);

    _sampleCollection.addCollectionNode(collectionNode2);
    expect(_sampleCollection.getCollectionNodeCount()).toEqual(1);
    expect(_sampleCollection.containsCollectionNode('exp_id1')).toBe(true);
  });

  it('should be able to retrieve a mutable collection node by exploration id',
    function() {
      expect(_getCollectionNode('exp_id0')).toBeUndefined();
      var collectionNodeBackendObject = {
        exploration_id: 'exp_id0',
        exploration: {}
      };
      _sampleCollection.addCollectionNode(
        CollectionNodeObjectFactory.create(collectionNodeBackendObject));

      var collectionNodeBefore = _getCollectionNode('exp_id0');
      expect(collectionNodeBefore).toEqual(CollectionNodeObjectFactory.create(
        collectionNodeBackendObject));
    }
  );

  it('should return a list of collection nodes in the order they were added',
    function() {
      _addCollectionNode('c_exp_id0');
      _addCollectionNode('a_exp_id1');
      _addCollectionNode('b_exp_id2');

      var collectionNodes = _sampleCollection.getCollectionNodes();
      expect(collectionNodes[0].getExplorationId()).toEqual('c_exp_id0');
      expect(collectionNodes[1].getExplorationId()).toEqual('a_exp_id1');
      expect(collectionNodes[2].getExplorationId()).toEqual('b_exp_id2');

      _sampleCollection.deleteCollectionNode('a_exp_id1');
      collectionNodes = _sampleCollection.getCollectionNodes();
      expect(collectionNodes[0].getExplorationId()).toEqual('c_exp_id0');
      expect(collectionNodes[1].getExplorationId()).toEqual('b_exp_id2');
    }
  );

  it('should ignore changes to the list of returned collection nodes',
    function() {
      _addCollectionNode('exp_id0');
      _addCollectionNode('exp_id1');
      expect(_sampleCollection.getCollectionNodeCount()).toEqual(2);

      // Ensure the array itself cannot be mutated and then reflected in the
      // collection object.
      var collectionNodes = _sampleCollection.getCollectionNodes();
      collectionNodes.splice(0, 1);

      expect(
        _sampleCollection.getCollectionNodes()).not.toEqual(collectionNodes);
      expect(_sampleCollection.getCollectionNodeCount()).toEqual(2);

      // Ensure contained collection nodes can be mutated and reflected in the
      // collection object.
      collectionNodes = _sampleCollection.getBindableCollectionNodes();
      expect(_sampleCollection.getBindableCollectionNodes()).toEqual(
        collectionNodes);
      expect(_getCollectionNode('exp_id1')).toEqual(collectionNodes[1]);
    }
  );

  it('should accept changes to the bindable list of collection nodes',
    function() {
      _addCollectionNode('exp_id0');
      _addCollectionNode('exp_id1');
      expect(_sampleCollection.getCollectionNodeCount()).toEqual(2);

      // The array itself can be mutated.
      var collectionNodes = _sampleCollection.getBindableCollectionNodes();
      collectionNodes.splice(0, 1);
      expect(_sampleCollection.getCollectionNodeCount()).toEqual(1);

      // Collection nodes can be mutated and reflected in the collection object.
      collectionNodes = _sampleCollection.getBindableCollectionNodes();
      expect(_sampleCollection.getBindableCollectionNodes()).toEqual(
        collectionNodes);
      expect(_getCollectionNode('exp_id1')).toEqual(collectionNodes[1]);
    }
  );

  it('should return a list of referenced exporation IDs', function() {
    _addCollectionNode('exp_id0');
    _addCollectionNode('exp_id1');
    _addCollectionNode('exp_id2');

    expect(_sampleCollection.getExplorationIds()).toEqual([
      'exp_id0', 'exp_id1', 'exp_id2'
    ]);

    _sampleCollection.deleteCollectionNode('exp_id1');

    expect(_sampleCollection.getExplorationIds()).toEqual([
      'exp_id0', 'exp_id2'
    ]);
  });

  it('should be able to copy from another collection', function() {
    var secondCollection = CollectionObjectFactory.create({
      id: 'col_id0',
      title: 'Another title',
      objective: 'Another objective',
      category: 'Another category',
      language_code: 'en',
      version: '15',
      nodes: [],
    });
    secondCollection.addCollectionNode(CollectionNodeObjectFactory.create({
      exploration_id: 'exp_id5',
      exploration: {}
    }));

    _addCollectionNode('exp_id0');
    _addCollectionNode('exp_id1');

    expect(_sampleCollection).not.toBe(secondCollection);
    expect(_sampleCollection).not.toEqual(secondCollection);

    _sampleCollection.copyFromCollection(secondCollection);
    expect(_sampleCollection).not.toBe(secondCollection);
    expect(_sampleCollection).toEqual(secondCollection);
  });
});
// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for CollectionRightsBackendApiService.
 */

require('domain/collection/CollectionRightsBackendApiService.ts');
require('pages/collection-editor-page/collection-editor-page.directive.ts');

describe('Collection rights backend API service', function() {
  var CollectionRightsBackendApiService = null;
  var sampleDataResults = null;
  var $rootScope = null;
  var $scope = null;
  var $httpBackend = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module(
    'oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

  beforeEach(angular.mock.inject(function($injector) {
    CollectionRightsBackendApiService = $injector.get(
      'CollectionRightsBackendApiService');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $httpBackend = $injector.get('$httpBackend');
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully set a collection to be public', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    // TODO(bhenning): Figure out how to test the actual payload sent with the
    // PUT request. The typical expect() syntax with a passed-in object payload
    // does not seem to be working correctly.
    $httpBackend.expect(
      'PUT', '/collection_editor_handler/publish/0').respond(200);
    CollectionRightsBackendApiService.setCollectionPublic('0', 1).then(
      successHandler, failHandler);
    $httpBackend.flush();
    $rootScope.$digest();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should call the provided fail handler on HTTP failure', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    $httpBackend.expect(
      'PUT', '/collection_editor_handler/publish/0').respond(
      500, 'Error loading collection 0.');
    CollectionRightsBackendApiService.setCollectionPublic('0', 1).then(
      successHandler, failHandler);
    $httpBackend.flush();
    $rootScope.$digest();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  });

  it('should report a cached collection rights after caching it', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    // The collection should not currently be cached.
    expect(CollectionRightsBackendApiService.isCached('0')).toBe(false);

    // Cache a collection.
    CollectionRightsBackendApiService.cacheCollectionRights('0', {
      collection_id: 0,
      can_edit: true,
      can_unpublish: false,
      is_private: true,
      owner_names: ['A']
    });

    // It should now be cached.
    expect(CollectionRightsBackendApiService.isCached('0')).toBe(true);

    // A new collection should not have been fetched from the backend. Also,
    // the returned collection should match the expected collection object.
    CollectionRightsBackendApiService.loadCollectionRights('0').then(
      successHandler, failHandler);

    // http://brianmcd.com/2014/03/27/
    // a-tip-for-angular-unit-tests-with-promises.html
    $rootScope.$digest();

    expect(successHandler).toHaveBeenCalledWith({
      collection_id: 0,
      can_edit: true,
      can_unpublish: false,
      is_private: true,
      owner_names: ['A']
    });
    expect(failHandler).not.toHaveBeenCalled();
  });
});
// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for CollectionRightsObjectFactory.
 */

require('domain/collection/CollectionRightsObjectFactory.ts');

describe('Collection rights object factory', function() {
  var CollectionRightsObjectFactory = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    CollectionRightsObjectFactory = $injector.get(
      'CollectionRightsObjectFactory');
  }));

  it('should not be able to modify owner names', function() {
    var initialCollectionRightsBackendObject = {
      collection_id: 0,
      can_edit: true,
      can_unpublish: false,
      is_private: true,
      owner_names: ['A']
    };

    var sampleCollectionRights = CollectionRightsObjectFactory.create(
      initialCollectionRightsBackendObject);
    var ownerNames = sampleCollectionRights.getOwnerNames();
    ownerNames.push('B');

    expect(sampleCollectionRights.getOwnerNames()).toEqual(['A']);
  });

  it('should accept accept changes to the bindable list of collection nodes',
    function() {
      var initialCollectionRightsBackendObject = {
        collection_id: 0,
        can_edit: true,
        can_unpublish: false,
        is_private: true,
        owner_names: ['A']
      };

      var sampleCollectionRights = CollectionRightsObjectFactory.create(
        initialCollectionRightsBackendObject);
      var ownerNames = sampleCollectionRights.getBindableOwnerNames();
      ownerNames.push('B');

      expect(sampleCollectionRights.getOwnerNames()).toEqual(['A', 'B']);
    }
  );

  it('should be able to set public when canEdit is true', function() {
    var initialCollectionRightsBackendObject = {
      collection_id: 0,
      can_edit: true,
      can_unpublish: false,
      is_private: true,
      owner_names: ['A']
    };

    var sampleCollectionRights = CollectionRightsObjectFactory.create(
      initialCollectionRightsBackendObject);
    expect(sampleCollectionRights.isPrivate()).toBe(true);
    expect(sampleCollectionRights.isPublic()).toBe(false);

    sampleCollectionRights.setPublic();
    expect(sampleCollectionRights.isPrivate()).toBe(false);
    expect(sampleCollectionRights.isPublic()).toBe(true);
  });

  it('should throw error and not be able to set public when canEdit is false',
    function() {
      var initialCollectionRightsBackendObject = {
        collection_id: 0,
        can_edit: false,
        can_unpublish: false,
        is_private: true,
        owner_names: ['A']
      };

      var sampleCollectionRights = CollectionRightsObjectFactory.create(
        initialCollectionRightsBackendObject);
      expect(sampleCollectionRights.isPrivate()).toBe(true);
      expect(sampleCollectionRights.isPublic()).toBe(false);

      expect(function() {
        sampleCollectionRights.setPublic();
      }).toThrow(new Error('User is not allowed to edit this collection.'));
      expect(sampleCollectionRights.isPrivate()).toBe(true);
      expect(sampleCollectionRights.isPublic()).toBe(false);
    }
  );

  it('should be able to set private when canUnpublish is true', function() {
    var initialCollectionRightsBackendObject = {
      collection_id: 0,
      can_edit: true,
      can_unpublish: true,
      is_private: false,
      owner_names: ['A']
    };

    var sampleCollectionRights = CollectionRightsObjectFactory.create(
      initialCollectionRightsBackendObject);
    expect(sampleCollectionRights.isPrivate()).toBe(false);
    expect(sampleCollectionRights.isPublic()).toBe(true);

    sampleCollectionRights.setPrivate();
    expect(sampleCollectionRights.isPrivate()).toBe(true);
    expect(sampleCollectionRights.isPublic()).toBe(false);
  });

  it('should throw error when when canUnpublish is false during unpublishing',
    function() {
      var noUnpublishCollectionRightsBackendObject = {
        collection_id: 0,
        can_edit: true,
        can_unpublish: false,
        is_private: false,
        owner_names: ['A']
      };

      var sampleCollectionRights = CollectionRightsObjectFactory.create(
        noUnpublishCollectionRightsBackendObject);
      expect(sampleCollectionRights.isPrivate()).toBe(false);
      expect(sampleCollectionRights.isPublic()).toBe(true);

      expect(function() {
        sampleCollectionRights.setPrivate();
      }).toThrow(
        new Error('User is not allowed to unpublish this collection.'));

      // Verify that the status remains unchanged.
      expect(sampleCollectionRights.isPrivate()).toBe(false);
      expect(sampleCollectionRights.isPublic()).toBe(true);
    }
  );

  it('should create an empty collection rights object', function() {
    var emptyCollectionRightsBackendObject = (
      CollectionRightsObjectFactory.createEmptyCollectionRights());

    expect(
      emptyCollectionRightsBackendObject.getCollectionId()).toBeUndefined();
    expect(emptyCollectionRightsBackendObject.canEdit()).toBeUndefined();
    expect(emptyCollectionRightsBackendObject.canUnpublish()).toBeUndefined();
    expect(emptyCollectionRightsBackendObject.isPrivate()).toBeUndefined();
    expect(emptyCollectionRightsBackendObject.getOwnerNames()).toEqual([]);
  });

  it('should make a copy from another collection rights', function() {
    var noUnpublishCollectionRightsBackendObject = {
      collection_id: 0,
      can_edit: true,
      can_unpublish: false,
      is_private: false,
      owner_names: ['A']
    };

    var sampleCollectionRights = CollectionRightsObjectFactory.create(
      noUnpublishCollectionRightsBackendObject);

    var emptyCollectionRightsBackendObject = (
      CollectionRightsObjectFactory.createEmptyCollectionRights());

    emptyCollectionRightsBackendObject.copyFromCollectionRights(
      sampleCollectionRights);
    expect(emptyCollectionRightsBackendObject.getCollectionId()).toEqual(0);
    expect(emptyCollectionRightsBackendObject.canEdit()).toBe(true);
    expect(emptyCollectionRightsBackendObject.canUnpublish()).toBe(false);
    expect(emptyCollectionRightsBackendObject.isPrivate()).toBe(false);
    expect(emptyCollectionRightsBackendObject.getOwnerNames()).toEqual(['A']);
  });
});
// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for Collection update service.
 */

require('domain/collection/CollectionObjectFactory.ts');
require('domain/collection/CollectionUpdateService.ts');
require('domain/editor/undo_redo/UndoRedoService.ts');

describe('Collection update service', function() {
  var CollectionUpdateService = null;
  var CollectionObjectFactory = null;
  var UndoRedoService = null;
  var _sampleCollection = null;
  var _sampleExplorationSummaryBackendObject = {
    title: 'Title',
    status: 'public'
  };

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    CollectionUpdateService = $injector.get('CollectionUpdateService');
    CollectionObjectFactory = $injector.get('CollectionObjectFactory');
    UndoRedoService = $injector.get('UndoRedoService');

    var sampleCollectionBackendObject = {
      id: 'collection_id',
      title: 'a title',
      objective: 'an objective',
      language_code: 'en',
      tags: [],
      category: 'a category',
      version: '1',
      nodes: [{
        exploration_id: 'exp_id0',
        exploration: {}
      }]
    };
    _sampleCollection = CollectionObjectFactory.create(
      sampleCollectionBackendObject);
  }));

  var _getCollectionNode = function(expId) {
    return _sampleCollection.getCollectionNodeByExplorationId(expId);
  };

  it('should add/remove a new collection node to/from a collection',
    function() {
      expect(_sampleCollection.getExplorationIds()).toEqual(['exp_id0']);
      CollectionUpdateService.addCollectionNode(
        _sampleCollection, 'exp_id1', _sampleExplorationSummaryBackendObject);
      expect(_sampleCollection.getExplorationIds()).toEqual([
        'exp_id0', 'exp_id1'
      ]);

      UndoRedoService.undoChange(_sampleCollection);
      expect(_sampleCollection.getExplorationIds()).toEqual(['exp_id0']);
    }
  );

  it('should create a proper backend change dict for adding collection nodes',
    function() {
      CollectionUpdateService.addCollectionNode(
        _sampleCollection, 'exp_id1', _sampleExplorationSummaryBackendObject);
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'add_collection_node',
        exploration_id: 'exp_id1'
      }]);
    }
  );

  it('should remove/add a collection node from/to a collection', function() {
    expect(_sampleCollection.getExplorationIds()).toEqual(['exp_id0']);
    CollectionUpdateService.deleteCollectionNode(_sampleCollection, 'exp_id0');
    expect(_sampleCollection.getExplorationIds()).toEqual([]);

    UndoRedoService.undoChange(_sampleCollection);
    expect(_sampleCollection.getExplorationIds()).toEqual(['exp_id0']);
  });

  it('should create a proper backend change dict for deleting collection nodes',
    function() {
      CollectionUpdateService
        .deleteCollectionNode(_sampleCollection, 'exp_id0');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'delete_collection_node',
        exploration_id: 'exp_id0'
      }]);
    }
  );

  it('should set/unset changes to a collection\'s title', function() {
    expect(_sampleCollection.getTitle()).toEqual('a title');
    CollectionUpdateService.setCollectionTitle(_sampleCollection, 'new title');
    expect(_sampleCollection.getTitle()).toEqual('new title');

    UndoRedoService.undoChange(_sampleCollection);
    expect(_sampleCollection.getTitle()).toEqual('a title');
  });

  it('should create a proper backend change dict for changing titles',
    function() {
      CollectionUpdateService
        .setCollectionTitle(_sampleCollection, 'new title');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'edit_collection_property',
        property_name: 'title',
        new_value: 'new title',
        old_value: 'a title'
      }]);
    }
  );

  it('should set/unset changes to a collection\'s category', function() {
    expect(_sampleCollection.getCategory()).toEqual('a category');
    CollectionUpdateService.setCollectionCategory(
      _sampleCollection, 'new category');
    expect(_sampleCollection.getCategory()).toEqual('new category');

    UndoRedoService.undoChange(_sampleCollection);
    expect(_sampleCollection.getCategory()).toEqual('a category');
  });

  it('should create a proper backend change dict for changing categories',
    function() {
      CollectionUpdateService.setCollectionCategory(
        _sampleCollection, 'new category');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'edit_collection_property',
        property_name: 'category',
        new_value: 'new category',
        old_value: 'a category'
      }]);
    }
  );

  it('should set/unset changes to a collection\'s objective', function() {
    expect(_sampleCollection.getObjective()).toEqual('an objective');
    CollectionUpdateService.setCollectionObjective(
      _sampleCollection, 'new objective');
    expect(_sampleCollection.getObjective()).toEqual('new objective');

    UndoRedoService.undoChange(_sampleCollection);
    expect(_sampleCollection.getObjective()).toEqual('an objective');
  });

  it('should create a proper backend change dict for changing objectives',
    function() {
      CollectionUpdateService.setCollectionObjective(
        _sampleCollection, 'new objective');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'edit_collection_property',
        property_name: 'objective',
        new_value: 'new objective',
        old_value: 'an objective'
      }]);
    }
  );

  it('should set/unset changes to a collection\'s language code', function() {
    expect(_sampleCollection.getLanguageCode()).toEqual('en');
    CollectionUpdateService.setCollectionLanguageCode(_sampleCollection, 'fi');
    expect(_sampleCollection.getLanguageCode()).toEqual('fi');

    UndoRedoService.undoChange(_sampleCollection);
    expect(_sampleCollection.getLanguageCode()).toEqual('en');
  });

  it('should create a proper backend change dict for changing language codes',
    function() {
      CollectionUpdateService
        .setCollectionLanguageCode(_sampleCollection, 'fi');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'edit_collection_property',
        property_name: 'language_code',
        new_value: 'fi',
        old_value: 'en'
      }]);
    }
  );

  it('should set/unset changes to a collection\'s tags', function() {
    expect(_sampleCollection.getTags()).toEqual([]);
    CollectionUpdateService.setCollectionTags(_sampleCollection, ['test']);
    expect(_sampleCollection.getTags()).toEqual(['test']);

    UndoRedoService.undoChange(_sampleCollection);
    expect(_sampleCollection.getTags()).toEqual([]);
  });

  it('should create a proper backend change dict for changing tags',
    function() {
      CollectionUpdateService.setCollectionTags(_sampleCollection, ['test']);
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'edit_collection_property',
        property_name: 'tags',
        new_value: ['test'],
        old_value: []
      }]);
    });
});
// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for CollectionValidationService.
 */

require('domain/collection/CollectionNodeObjectFactory.ts');
require('domain/collection/CollectionObjectFactory.ts');
require('domain/collection/CollectionValidationService.ts');

describe('Collection validation service', function() {
  var CollectionValidationService = null;
  var CollectionObjectFactory = null;
  var CollectionNodeObjectFactory = null;
  var sampleCollectionBackendObject = null;
  var _sampleCollection = null;

  var EXISTS = true;
  var DOES_NOT_EXIST = false;
  var PUBLIC_STATUS = true;
  var PRIVATE_STATUS = false;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    CollectionValidationService = $injector.get('CollectionValidationService');
    CollectionObjectFactory = $injector.get('CollectionObjectFactory');
    CollectionNodeObjectFactory = $injector.get('CollectionNodeObjectFactory');

    sampleCollectionBackendObject = {
      id: 'sample_collection_id',
      title: 'a title',
      objective: 'an objective',
      category: 'a category',
      version: '1',
      nodes: []
    };
    _sampleCollection = CollectionObjectFactory.create(
      sampleCollectionBackendObject);
    _addCollectionNode('exp_id0', EXISTS, PRIVATE_STATUS);
  }));

  var _addCollectionNode = function(explorationId, exists, isPublic) {
    var collectionNode = CollectionNodeObjectFactory.createFromExplorationId(
      explorationId);
    if (exists) {
      collectionNode.setExplorationSummaryObject({
        status: isPublic ? 'public' : 'private'
      });
    }
    return _sampleCollection.addCollectionNode(collectionNode);
  };

  var _getCollectionNode = function(explorationId) {
    return _sampleCollection.getCollectionNodeByExplorationId(explorationId);
  };

  var _findPrivateValidationIssues = function() {
    return CollectionValidationService.findValidationIssuesForPrivateCollection(
      _sampleCollection);
  };

  var _findPublicValidationIssues = function() {
    return CollectionValidationService.findValidationIssuesForPublicCollection(
      _sampleCollection);
  };

  it('should not find issues with a collection with one node', function() {
    var issues = _findPrivateValidationIssues();
    expect(issues).toEqual([]);
  });

  it('should expect at least one collection node', function() {
    expect(_sampleCollection.deleteCollectionNode('exp_id0')).toBe(true);
    expect(_sampleCollection.getCollectionNodeCount()).toEqual(0);

    var issues = _findPrivateValidationIssues();
    expect(issues).toEqual([
      'There should be at least 1 exploration in the collection.']);
  });

  it('should detect nonexistent/inaccessible explorations', function() {
    expect(_addCollectionNode(
      'exp_id1', DOES_NOT_EXIST, PRIVATE_STATUS)).toBe(true);
    var node0 = _getCollectionNode('exp_id0');
    var node1 = _getCollectionNode('exp_id1');

    var issues = _findPrivateValidationIssues();
    expect(issues).toEqual([
      'The following exploration(s) either do not exist, or you do not have ' +
      'edit access to add them to this collection: exp_id1'
    ]);
  });

  it('should allow private and public explorations in a private collection',
    function() {
      expect(_addCollectionNode('exp_id1', EXISTS, PRIVATE_STATUS)).toBe(true);
      expect(_addCollectionNode('exp_id2', EXISTS, PUBLIC_STATUS)).toBe(true);
      var node0 = _getCollectionNode('exp_id0');
      var node1 = _getCollectionNode('exp_id1');
      var node2 = _getCollectionNode('exp_id2');

      var issues = _findPrivateValidationIssues();
      expect(issues).toEqual([]);
    }
  );

  it('should not allow private explorations in a public collection',
    function() {
      expect(_addCollectionNode('exp_id1', EXISTS, PUBLIC_STATUS)).toBe(true);
      var node1 = _getCollectionNode('exp_id1');
      var node0 = _getCollectionNode('exp_id0');

      var issues = _findPublicValidationIssues();
      expect(issues).toEqual([
        'Private explorations cannot be added to a public collection: exp_id0'
      ]);

      expect(_sampleCollection.deleteCollectionNode('exp_id0')).toBe(true);
      issues = _findPublicValidationIssues();
      expect(issues).toEqual([]);
    }
  );

  it('should be able to detect multiple validation issues', function() {
    expect(_addCollectionNode('exp_id1', EXISTS, PUBLIC_STATUS)).toBe(true);
    expect(_addCollectionNode('exp_id2', EXISTS, PRIVATE_STATUS)).toBe(true);

    var node0 = _getCollectionNode('exp_id0');
    var node1 = _getCollectionNode('exp_id1');
    var node2 = _getCollectionNode('exp_id2');

    var issues = _findPublicValidationIssues();
    expect(issues).toEqual([
      'Private explorations cannot be added to a public collection: ' +
      'exp_id0, exp_id2'
    ]);
  });

  it('should return false if the tags are not valid', function() {
    expect(CollectionValidationService.isTagValid(['test'])).toBe(true);
    expect(CollectionValidationService.isTagValid(['test', 'math'])).toBe(true);

    expect(CollectionValidationService.isTagValid(
      ['test', 'test'])).toBe(false);
    expect(CollectionValidationService.isTagValid(
      ['test '])).toBe(false);
  });
});
// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for EditableCollectionBackendApiService.
 */

require('domain/collection/EditableCollectionBackendApiService.ts');
require('domain/editor/undo_redo/UndoRedoService.ts');

describe('Editable collection backend API service', function() {
  var EditableCollectionBackendApiService = null;
  var sampleDataResults = null;
  var $rootScope = null;
  var $scope = null;
  var $httpBackend = null;
  var UndoRedoService = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module(
    'oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

  beforeEach(angular.mock.inject(function($injector) {
    EditableCollectionBackendApiService = $injector.get(
      'EditableCollectionBackendApiService');
    UndoRedoService = $injector.get('UndoRedoService');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $httpBackend = $injector.get('$httpBackend');

    // Sample collection object returnable from the backend
    sampleDataResults = {
      collection: {
        id: '0',
        title: 'Collection Under Test',
        category: 'Test',
        objective: 'To pass',
        version: '1',
        nodes: [{
          exploration_id: '0'
        }],
        next_exploration_ids: [],
        completed_exploration_ids: []
      }
    };
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully fetch an existing collection from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', '/collection_editor_handler/data/0').respond(
        sampleDataResults);
      EditableCollectionBackendApiService.fetchCollection('0').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(sampleDataResults.collection);
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it('should use the rejection handler if the backend request failed',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      // Loading a collection the first time should fetch it from the backend.
      $httpBackend.expect('GET', '/collection_editor_handler/data/1').respond(
        500, 'Error loading collection 1.');
      EditableCollectionBackendApiService.fetchCollection('1').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error loading collection 1.');
    }
  );

  it('should update a collection after fetching it from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      var collection = null;

      // Loading a collection the first time should fetch it from the backend.
      $httpBackend.expect('GET', '/collection_editor_handler/data/0').respond(
        sampleDataResults);

      EditableCollectionBackendApiService.fetchCollection('0').then(
        function(data) {
          collection = data;
        });
      $httpBackend.flush();

      collection.title = 'New Title';
      collection.version = '2';
      var collectionWrapper = {
        collection: collection
      };

      $httpBackend.expect('PUT', '/collection_editor_handler/data/0').respond(
        collectionWrapper);

      // Send a request to update collection
      EditableCollectionBackendApiService.updateCollection(
        collection.id, collection.version, collection.title, []
      ).then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(collection);
      expect(failHandler).not.toHaveBeenCalled();
    }
  );
});

// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for ReadOnlyCollectionBackendApiService.
 */

require('domain/collection/ReadOnlyCollectionBackendApiService.ts');

describe('Read only collection backend API service', function() {
  var ReadOnlyCollectionBackendApiService = null;
  var sampleDataResults = null;
  var $rootScope = null;
  var $scope = null;
  var $httpBackend = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module(
    'oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

  beforeEach(angular.mock.inject(function($injector) {
    ReadOnlyCollectionBackendApiService = $injector.get(
      'ReadOnlyCollectionBackendApiService');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $httpBackend = $injector.get('$httpBackend');

    // Sample collection object returnable from the backend
    sampleDataResults = {
      collection: {
        id: '0',
        title: 'Collection Under Test',
        category: 'Test',
        objective: 'To pass',
        schema_version: '1',
        nodes: [{
          exploration_id: '0'
        }],
        next_exploration_ids: [],
        completed_exploration_ids: []
      }
    };
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully fetch an existing collection from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', '/collection_handler/data/0').respond(
        sampleDataResults);
      ReadOnlyCollectionBackendApiService.fetchCollection('0').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(sampleDataResults.collection);
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it('should load a cached collection after fetching it from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      // Loading a collection the first time should fetch it from the backend.
      $httpBackend.expect('GET', '/collection_handler/data/0').respond(
        sampleDataResults);
      ReadOnlyCollectionBackendApiService.loadCollection('0').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(sampleDataResults.collection);
      expect(failHandler).not.toHaveBeenCalled();

      // Loading a collection the second time should not fetch it.
      ReadOnlyCollectionBackendApiService.loadCollection('0').then(
        successHandler, failHandler);

      expect(successHandler).toHaveBeenCalledWith(sampleDataResults.collection);
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it('should use the rejection handler if the backend request failed',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      // Loading a collection the first time should fetch it from the backend.
      $httpBackend.expect('GET', '/collection_handler/data/0').respond(
        500, 'Error loading collection 0.');
      ReadOnlyCollectionBackendApiService.loadCollection('0').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error loading collection 0.');
    }
  );

  it('should report caching and support clearing the cache', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    // The collection should not currently be cached.
    expect(ReadOnlyCollectionBackendApiService.isCached('0')).toBeFalsy();

    // Loading a collection the first time should fetch it from the backend.
    $httpBackend.expect('GET', '/collection_handler/data/0').respond(
      sampleDataResults);
    ReadOnlyCollectionBackendApiService.loadCollection('0').then(
      successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith(sampleDataResults.collection);
    expect(failHandler).not.toHaveBeenCalled();

    // The collection should now be cached.
    expect(ReadOnlyCollectionBackendApiService.isCached('0')).toBeTruthy();

    // The collection should be loadable from the cache.
    ReadOnlyCollectionBackendApiService.loadCollection('0').then(
      successHandler, failHandler);
    expect(successHandler).toHaveBeenCalledWith(sampleDataResults.collection);
    expect(failHandler).not.toHaveBeenCalled();

    // Resetting the cache will cause another fetch from the backend.
    ReadOnlyCollectionBackendApiService.clearCollectionCache();
    expect(ReadOnlyCollectionBackendApiService.isCached('0')).toBeFalsy();

    $httpBackend.expect('GET', '/collection_handler/data/0').respond(
      sampleDataResults);
    ReadOnlyCollectionBackendApiService.loadCollection('0').then(
      successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith(sampleDataResults.collection);
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should report a cached collection after caching it', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    // The collection should not currently be cached.
    expect(ReadOnlyCollectionBackendApiService.isCached('0')).toBeFalsy();

    // Cache a collection.
    ReadOnlyCollectionBackendApiService.cacheCollection('0', {
      id: '0',
      nodes: []
    });

    // It should now be cached.
    expect(ReadOnlyCollectionBackendApiService.isCached('0')).toBeTruthy();

    // A new collection should not have been fetched from the backend. Also,
    // the returned collection should match the expected collection object.
    ReadOnlyCollectionBackendApiService.loadCollection('0').then(
      successHandler, failHandler);

    // http://brianmcd.com/2014/03/27/
    // a-tip-for-angular-unit-tests-with-promises.html
    $rootScope.$digest();

    expect(successHandler).toHaveBeenCalledWith({
      id: '0',
      nodes: []
    });
    expect(failHandler).not.toHaveBeenCalled();
  });
});
// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for SearchExplorationsBackendApiService.
 */

require('domain/collection/SearchExplorationsBackendApiService.ts');

describe('Exploration search backend API service', function() {
  var SearchExplorationsBackendApiService = null;
  var $rootScope = null;
  var $scope = null;
  var $httpBackend = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module(
    'oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

  beforeEach(angular.mock.inject(function($injector) {
    SearchExplorationsBackendApiService = $injector.get(
      'SearchExplorationsBackendApiService');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $httpBackend = $injector.get('$httpBackend');
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should call the provided success handler on HTTP success', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');
    var query = escape(btoa('three'));

    $httpBackend.expect('GET', '/exploration/metadata_search?q=' + query)
      .respond(200, {collection_node_metadata_list: []});
    SearchExplorationsBackendApiService.fetchExplorations('three')
      .then(successHandler, failHandler);
    $httpBackend.flush();
    $rootScope.$digest();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should search for explorations from the backend', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');
    var query = escape(btoa('count'));

    // Search result object returnable from the backend
    var searchResults = {
      collection_node_metadata_list: [{
        id: '12',
        objective:
        'learn how to count permutations accurately and systematically',
        title: 'Protractor Test'
      }, {
        id: '4',
        objective:
        'learn how to count permutations accurately and systematically',
        title: 'Three Balls'
      }]
    };

    $httpBackend
      .expect('GET', '/exploration/metadata_search?q=' + query)
      .respond(200, searchResults);
    SearchExplorationsBackendApiService.fetchExplorations('count')
      .then(successHandler, failHandler);
    $httpBackend.flush();
    $rootScope.$digest();

    expect(successHandler).toHaveBeenCalledWith(searchResults);
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should call the provided fail handler on HTTP failure', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');
    var query = escape(btoa('oppia'));

    $httpBackend
      .expect('GET', '/exploration/metadata_search?q=' + query).respond(500);
    SearchExplorationsBackendApiService.fetchExplorations('oppia')
      .then(successHandler, failHandler);
    $httpBackend.flush();
    $rootScope.$digest();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  });
});
// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for CreatorDashboardBackendApiService.
 */

require('domain/creator_dashboard/CreatorDashboardBackendApiService.ts');
require('domain/utilities/UrlInterpolationService.ts');

describe('Creator Dashboard backend API service', function() {
  var CreatorDashboardBackendApiService = null;
  var $httpBackend = null;
  var UrlInterpolationService = null;
  var SAMPLE_EXP_ID = 'hyuy4GUlvTqJ';

  var sampleDataResults = {
    explorations_list: [{
      id: SAMPLE_EXP_ID,
      title: 'Sample Title',
      activity_type: 'exploration',
      category: 'Computing',
      objective: 'Sample objective',
      language_code: 'en',
      created_on_msec: 1466178691847.67,
      last_updated_msec: 1466178759209.839,
      status: 'public',
      rating: {
        5: 0,
        4: 1,
        3: 0,
        2: 0,
        1: 0
      },
      community_owned: false,
      tags: '',
      thumbnail_icon_url: '/subjects/Computing.svg',
      thumbnail_bg_color: '#bb8b2f',
      num_views: 2,
      num_open_threads: 0,
      num_total_threads: 0
    }],
    collections_list: [],
    dashboard_stats: {
      total_plays: 10,
      num_ratings: 1,
      average_ratings: 4.0,
      total_open_feedback: 5
    },
    last_week_stats: {
      total_plays: 2,
      average_ratings: 3.5,
      num_ratings: 3,
      total_open_feedback: 1
    }
  };

  var CREATOR_DASHBOARD_DATA_URL = '/creatordashboardhandler/data';
  var ERROR_STATUS_CODE = 500;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module(
    'oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

  beforeEach(angular.mock.inject(function($injector) {
    CreatorDashboardBackendApiService = $injector.get(
      'CreatorDashboardBackendApiService');
    UrlInterpolationService = $injector.get('UrlInterpolationService');
    $httpBackend = $injector.get('$httpBackend');
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully fetch an creator dashboard data from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', CREATOR_DASHBOARD_DATA_URL).respond(
        sampleDataResults);
      CreatorDashboardBackendApiService.fetchDashboardData().then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it('should use rejection handler if dashboard data backend request failed',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', CREATOR_DASHBOARD_DATA_URL).respond(
        ERROR_STATUS_CODE, 'Error loading dashboard data.');
      CreatorDashboardBackendApiService.fetchDashboardData().then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    }
  );
});
// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for ChangeObjectFactory.
 */

require('domain/editor/undo_redo/ChangeObjectFactory.ts');

describe('Factory for Change domain objects', function() {
  var ChangeObjectFactory = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    ChangeObjectFactory = $injector.get('ChangeObjectFactory');
  }));

  it('should invoke no callbacks after creation', function() {
    var applyFunc = jasmine.createSpy('applyChange');
    var reverseFunc = jasmine.createSpy('reverseChange');

    var backendChangeObject = {
      property_name: 'value'
    };
    ChangeObjectFactory.create(backendChangeObject, applyFunc, reverseFunc);

    expect(applyFunc).not.toHaveBeenCalled();
    expect(reverseFunc).not.toHaveBeenCalled();
  });

  it('should invoke the apply callback when applied', function() {
    var applyFunc = jasmine.createSpy('applyChange');
    var reverseFunc = jasmine.createSpy('reverseChange');

    var backendChangeObject = {
      property_name: 'value'
    };
    var changeDomainObject = ChangeObjectFactory.create(
      backendChangeObject, applyFunc, reverseFunc);

    var fakeDomainObject = {
      domain_property_name: 'fake value'
    };
    changeDomainObject.applyChange(fakeDomainObject);

    expect(applyFunc).toHaveBeenCalledWith(
      backendChangeObject, fakeDomainObject);
    expect(reverseFunc).not.toHaveBeenCalled();
  });

  it('should invoke the reverse callback when reversed', function() {
    var applyFunc = jasmine.createSpy('applyChange');
    var reverseFunc = jasmine.createSpy('reverseChange');

    var backendChangeObject = {
      property_name: 'value'
    };
    var changeDomainObject = ChangeObjectFactory.create(
      backendChangeObject, applyFunc, reverseFunc);

    var fakeDomainObject = {
      domain_property_name: 'fake value'
    };
    changeDomainObject.reverseChange(fakeDomainObject);

    expect(reverseFunc).toHaveBeenCalledWith(
      backendChangeObject, fakeDomainObject);
    expect(applyFunc).not.toHaveBeenCalled();
  });

  it('should not receive changes to the provided change backend object',
    function() {
      var backendChangeObject = {
        property_name: 'value'
      };
      var changeDomainObject = ChangeObjectFactory.create(
        backendChangeObject, function() {}, function() {});

      var returnedBackendObject = changeDomainObject.getBackendChangeObject();
      returnedBackendObject.property_name = 'new value';

      expect(changeDomainObject.getBackendChangeObject()).toEqual({
        property_name: 'value'
      });
    }
  );
});
// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for UndoRedoService.
 */

require('domain/editor/undo_redo/ChangeObjectFactory.ts');
require('domain/editor/undo_redo/UndoRedoService.ts');

describe('Undo/Redo Service', function() {
  var UndoRedoService = null;
  var ChangeObjectFactory = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    UndoRedoService = $injector.get('UndoRedoService');
    ChangeObjectFactory = $injector.get('ChangeObjectFactory');
  }));

  var _createBackendChangeObject = function(value) {
    return {
      roperty_name: value
    };
  };

  var _createChangeDomainObject = function(
      backendObj, applyFunc = function() {}, reverseFunc = function() {}) {
    return ChangeObjectFactory.create(backendObj, applyFunc, reverseFunc);
  };

  var _createNoOpChangeDomainObject = function(value) {
    var backendObject = _createBackendChangeObject(value);
    return _createChangeDomainObject(backendObject);
  };

  it('should apply a single change', function() {
    var applyFunc = jasmine.createSpy('applyChange');

    expect(UndoRedoService.hasChanges()).toBeFalsy();

    var fakeDomainObject = {
      domain_property_name: 'fake value'
    };
    var backendChangeObject = _createBackendChangeObject('value');
    var changeDomainObject = _createChangeDomainObject(
      backendChangeObject, applyFunc, function() {});
    UndoRedoService.applyChange(changeDomainObject, fakeDomainObject);

    expect(UndoRedoService.hasChanges()).toBeTruthy();
    expect(applyFunc).toHaveBeenCalledWith(
      backendChangeObject, fakeDomainObject);
  });

  it('should be able to undo an applied change', function() {
    var applyFunc = jasmine.createSpy('applyChange');
    var reverseFunc = jasmine.createSpy('reverseChange');

    expect(UndoRedoService.hasChanges()).toBeFalsy();

    // Apply the initial change.
    var fakeDomainObject = {
      domain_property_name: 'fake value'
    };
    var backendChangeObject = _createBackendChangeObject('value');
    var changeDomainObject = _createChangeDomainObject(
      backendChangeObject, applyFunc, reverseFunc);
    UndoRedoService.applyChange(changeDomainObject, fakeDomainObject);

    expect(UndoRedoService.hasChanges()).toBeTruthy();
    expect(applyFunc).toHaveBeenCalledWith(
      backendChangeObject, fakeDomainObject);

    expect(UndoRedoService.undoChange(fakeDomainObject)).toBeTruthy();
    expect(UndoRedoService.hasChanges()).toBeFalsy();
    expect(reverseFunc).toHaveBeenCalledWith(
      backendChangeObject, fakeDomainObject);
  });

  it('should be able to redo an undone change', function() {
    var applyFunc = jasmine.createSpy('applyChange');
    var reverseFunc = jasmine.createSpy('reverseChange');

    expect(UndoRedoService.hasChanges()).toBeFalsy();

    // Apply the initial change.
    var fakeDomainObject = {
      domain_property_name: 'fake value'
    };
    var backendChangeObject = _createBackendChangeObject('value');
    var changeDomainObject = _createChangeDomainObject(
      backendChangeObject, applyFunc, reverseFunc);
    UndoRedoService.applyChange(changeDomainObject, fakeDomainObject);
    expect(UndoRedoService.undoChange(fakeDomainObject)).toBeTruthy();

    expect(reverseFunc).toHaveBeenCalledWith(
      backendChangeObject, fakeDomainObject);
    expect(UndoRedoService.hasChanges()).toBeFalsy();

    expect(UndoRedoService.redoChange(fakeDomainObject)).toBeTruthy();
    expect(UndoRedoService.hasChanges()).toBeTruthy();
    expect(applyFunc).toHaveBeenCalledWith(
      backendChangeObject, fakeDomainObject);

    // Apply must be called twice (once for the first apply and once for redo).
    expect(applyFunc.calls.count()).toEqual(2);
  });

  it('should not undo anything if no changes are applied', function() {
    var fakeDomainObject = {
      domain_property_name: 'fake value'
    };

    expect(UndoRedoService.hasChanges()).toBeFalsy();
    expect(UndoRedoService.undoChange(fakeDomainObject)).toBeFalsy();
  });

  it('should not redo anything if no changes are undone', function() {
    var fakeDomainObject = {
      domain_property_name: 'fake value'
    };

    expect(UndoRedoService.hasChanges()).toBeFalsy();
    expect(UndoRedoService.redoChange(fakeDomainObject)).toBeFalsy();

    var changeDomainObject = _createNoOpChangeDomainObject('value');
    UndoRedoService.applyChange(changeDomainObject, fakeDomainObject);
    expect(UndoRedoService.redoChange(fakeDomainObject)).toBeFalsy();
  });

  it('should only clear the list on clear and not undo changes', function() {
    var applyFunc = jasmine.createSpy('applyChange');
    var reverseFunc = jasmine.createSpy('reverseChange');

    var fakeDomainObject = {
      domain_property_name: 'fake value'
    };
    var backendChangeObject = _createBackendChangeObject('value');
    var changeDomainObject = _createChangeDomainObject(
      backendChangeObject, applyFunc, reverseFunc);

    expect(UndoRedoService.getChangeCount()).toEqual(0);

    UndoRedoService.applyChange(changeDomainObject, fakeDomainObject);
    expect(UndoRedoService.getChangeCount()).toEqual(1);

    UndoRedoService.clearChanges();
    expect(UndoRedoService.getChangeCount()).toEqual(0);

    expect(applyFunc).toHaveBeenCalled();
    expect(reverseFunc).not.toHaveBeenCalled();
    expect(applyFunc.calls.count()).toEqual(1);
  });

  it('should undo changes in the reverse order of applying', function() {
    var appliedChanges = [];
    var reversedChanges = [];

    var fakeDomainObject = {
      domain_property_name: 'fake value'
    };
    var backendChangeObject1 = _createBackendChangeObject('value1');
    var changeDomainObject1 = _createChangeDomainObject(
      backendChangeObject1, function() {
        appliedChanges.push('change1');
      }, function() {
        reversedChanges.push('change1');
      });

    var backendChangeObject2 = _createBackendChangeObject('value2');
    var changeDomainObject2 = _createChangeDomainObject(
      backendChangeObject2, function() {
        appliedChanges.push('change2');
      }, function() {
        reversedChanges.push('change2');
      });

    var backendChangeObject3 = _createBackendChangeObject('value3');
    var changeDomainObject3 = _createChangeDomainObject(
      backendChangeObject3, function() {
        appliedChanges.push('change3');
      }, function() {
        reversedChanges.push('change3');
      });

    expect(appliedChanges).toEqual([]);
    expect(reversedChanges).toEqual([]);

    UndoRedoService.applyChange(changeDomainObject1, fakeDomainObject);
    UndoRedoService.applyChange(changeDomainObject2, fakeDomainObject);
    UndoRedoService.applyChange(changeDomainObject3, fakeDomainObject);

    expect(appliedChanges).toEqual(['change1', 'change2', 'change3']);
    expect(reversedChanges).toEqual([]);
    expect(UndoRedoService.getChangeCount()).toEqual(3);

    expect(UndoRedoService.undoChange(fakeDomainObject)).toBeTruthy();
    expect(UndoRedoService.undoChange(fakeDomainObject)).toBeTruthy();
    expect(UndoRedoService.undoChange(fakeDomainObject)).toBeTruthy();

    expect(appliedChanges).toEqual(['change1', 'change2', 'change3']);
    expect(reversedChanges).toEqual(['change3', 'change2', 'change1']);
    expect(UndoRedoService.getChangeCount()).toEqual(0);
  });

  it('should not be able to redo after applying a new change after undo',
    function() {
      expect(UndoRedoService.getChangeCount()).toEqual(0);

      var fakeDomainObject = {
        domain_property_name: 'fake value'
      };
      var changeDomainObject1 = _createNoOpChangeDomainObject('value1');
      var changeDomainObject2 = _createNoOpChangeDomainObject('value2');
      var changeDomainObject3 = _createNoOpChangeDomainObject('value3');

      UndoRedoService.applyChange(changeDomainObject1, fakeDomainObject);
      UndoRedoService.applyChange(changeDomainObject2, fakeDomainObject);
      expect(UndoRedoService.undoChange(fakeDomainObject)).toBeTruthy();

      UndoRedoService.applyChange(changeDomainObject3, fakeDomainObject);
      expect(UndoRedoService.redoChange(fakeDomainObject)).toBeFalsy();

      expect(UndoRedoService.getChangeCount()).toEqual(2);
    }
  );

  it('should have an empty change list with no changes', function() {
    expect(UndoRedoService.hasChanges()).toBeFalsy();
    expect(UndoRedoService.getChangeList()).toEqual([]);
  });

  it('should build a change list from only applied changes', function() {
    expect(UndoRedoService.getChangeCount()).toEqual(0);

    var fakeDomainObject = {
      domain_property_name: 'fake value'
    };
    var changeDomainObject1 = _createNoOpChangeDomainObject('value1');
    var changeDomainObject2 = _createNoOpChangeDomainObject('value2');
    var changeDomainObject3 = _createNoOpChangeDomainObject('value3');

    UndoRedoService.applyChange(changeDomainObject2, fakeDomainObject);
    UndoRedoService.applyChange(changeDomainObject3, fakeDomainObject);
    expect(UndoRedoService.undoChange(fakeDomainObject)).toBeTruthy();

    UndoRedoService.applyChange(changeDomainObject1, fakeDomainObject);
    expect(UndoRedoService.getChangeCount()).toEqual(2);

    var changeList = UndoRedoService.getChangeList();
    expect(changeList).toEqual([changeDomainObject2, changeDomainObject1]);
  });

  it('should return a change list whose mutations do not change the service',
    function() {
      var fakeDomainObject = {
        domain_property_name: 'fake value'
      };
      var changeDomainObject1 = _createNoOpChangeDomainObject('value1');
      var changeDomainObject2 = _createNoOpChangeDomainObject('value2');

      UndoRedoService.applyChange(changeDomainObject1, fakeDomainObject);
      UndoRedoService.applyChange(changeDomainObject2, fakeDomainObject);

      var changeList = UndoRedoService.getChangeList();
      expect(changeList).toEqual([changeDomainObject1, changeDomainObject2]);
      expect(UndoRedoService.getChangeCount()).toEqual(2);

      // Change the returned change list, which should be a copy.
      changeList.splice(0, 1);
      expect(UndoRedoService.getChangeCount()).toEqual(2);

      var origChangeList = UndoRedoService.getChangeList();
      expect(origChangeList)
        .toEqual([changeDomainObject1, changeDomainObject2]);
    }
  );

  it('should build a committable change list with one change', function() {
    var fakeDomainObject = {
      domain_property_name: 'fake value'
    };
    var backendChangeObject = _createBackendChangeObject('value');
    var changeDomainObject = _createChangeDomainObject(backendChangeObject);

    expect(UndoRedoService.getCommittableChangeList()).toEqual([]);

    UndoRedoService.applyChange(changeDomainObject, fakeDomainObject);
    expect(UndoRedoService.getCommittableChangeList()).toEqual([
      backendChangeObject
    ]);
  });

  it('should build a committable change list in the order of applied changes',
    function() {
      // Perform a series of complex operations to build the committable change
      // list. Apply 3 changes, undo two, redo one, and apply one.
      var fakeDomainObject = {
        domain_property_name: 'fake value'
      };
      var backendChangeObject1 = _createBackendChangeObject('value1');
      var backendChangeObject2 = _createBackendChangeObject('value2');
      var backendChangeObject3 = _createBackendChangeObject('value3');
      var backendChangeObject4 = _createBackendChangeObject('value4');
      var changeDomainObject1 = _createChangeDomainObject(backendChangeObject1);
      var changeDomainObject2 = _createChangeDomainObject(backendChangeObject2);
      var changeDomainObject3 = _createChangeDomainObject(backendChangeObject3);
      var changeDomainObject4 = _createChangeDomainObject(backendChangeObject4);

      expect(UndoRedoService.getChangeCount()).toEqual(0);

      UndoRedoService.applyChange(changeDomainObject4, fakeDomainObject);
      UndoRedoService.applyChange(changeDomainObject2, fakeDomainObject);
      UndoRedoService.applyChange(changeDomainObject3, fakeDomainObject);

      expect(UndoRedoService.undoChange(fakeDomainObject)).toBeTruthy();
      expect(UndoRedoService.undoChange(fakeDomainObject)).toBeTruthy();
      expect(UndoRedoService.redoChange(fakeDomainObject)).toBeTruthy();

      UndoRedoService.applyChange(changeDomainObject1, fakeDomainObject);
      expect(UndoRedoService.getChangeCount()).toEqual(3);

      expect(UndoRedoService.getCommittableChangeList()).toEqual([
        backendChangeObject4, backendChangeObject2, backendChangeObject1
      ]);
    }
  );
});
// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the AudioTranslation object factory.
 */

require('domain/exploration/AudioTranslationObjectFactory.ts');

describe('AudioTranslation object factory', function() {
  beforeEach(angular.mock.module('oppia'));

  describe('AudioTranslationObjectFactory', function() {
    var scope, atof, audioTranslation;

    beforeEach(angular.mock.inject(function($injector, $rootScope) {
      scope = $rootScope.$new();
      atof = $injector.get('AudioTranslationObjectFactory');
      audioTranslation = atof.createFromBackendDict({
        filename: 'a.mp3',
        file_size_bytes: 200000,
        needs_update: false
      });
    }));

    it('should correctly mark audio as needing update', angular.mock.inject(
      function() {
        audioTranslation.markAsNeedingUpdate();
        expect(audioTranslation).toEqual(atof.createFromBackendDict({
          filename: 'a.mp3',
          file_size_bytes: 200000,
          needs_update: true
        }));
      }));

    it('should toggle needs update attribute correctly', angular.mock.inject(
      function() {
        audioTranslation.toggleNeedsUpdateAttribute();
        expect(audioTranslation).toEqual(atof.createFromBackendDict({
          filename: 'a.mp3',
          file_size_bytes: 200000,
          needs_update: true
        }));

        audioTranslation.toggleNeedsUpdateAttribute();
        expect(audioTranslation).toEqual(atof.createFromBackendDict({
          filename: 'a.mp3',
          file_size_bytes: 200000,
          needs_update: false
        }));
      }));

    it('should convert to backend dict correctly', angular.mock.inject(
      function() {
        expect(audioTranslation.toBackendDict()).toEqual({
          filename: 'a.mp3',
          file_size_bytes: 200000,
          needs_update: false
        });
      }));

    it('should create a new audio translation', angular.mock.inject(function() {
      expect(atof.createNew('filename.mp3', 100000)).toEqual(
        atof.createFromBackendDict({
          filename: 'filename.mp3',
          file_size_bytes: 100000,
          needs_update: false
        })
      );
    }));

    it('should get the correct file size in MB', angular.mock.inject(
      function() {
        var NUM_BYTES_IN_MB = 1 << 20;
        expect(audioTranslation.getFileSizeMB()).toEqual(
          200000 / NUM_BYTES_IN_MB);
      }));
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for ContentIdsToAudioTranslations object factory.
 */

require('App.ts');
require('domain/exploration/AudioTranslationObjectFactory.ts');
require('domain/exploration/ContentIdsToAudioTranslationsObjectFactory.ts');

describe('ContentIdsToAudioTranslations object factory', function() {
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('LanguageUtilService', {
      getAudioLanguagesCount: function() {
        return 2;
      }
    });
  }));

  describe('ContentIdsToAudioTranslationsObjectFactory', function() {
    var citatof = null;
    var atof = null;
    var citat = null;
    var citatDict = {
      content: {
        en: {
          filename: 'filename1.mp3',
          file_size_bytes: 100000,
          needs_update: false
        },
        hi: {
          filename: 'filename2.mp3',
          file_size_bytes: 11000,
          needs_update: false
        }
      },
      default_outcome: {
        en: {
          filename: 'filename3.mp3',
          file_size_bytes: 3000,
          needs_update: false
        },
        hi: {
          filename: 'filename4.mp3',
          file_size_bytes: 5000,
          needs_update: false
        }
      },
      feedback_1: {
        en: {
          filename: 'filename5.mp3',
          file_size_bytes: 2000,
          needs_update: false
        },
        hi: {
          filename: 'filename6.mp3',
          file_size_bytes: 9000,
          needs_update: false
        }
      },
      feedback_2: {
        en: {
          filename: 'filename7.mp3',
          file_size_bytes: 1000,
          needs_update: false
        },
        hi: {
          filename: 'filename8.mp3',
          file_size_bytes: 600,
          needs_update: false
        }
      },
      hint_1: {
        en: {
          filename: 'filename9.mp3',
          file_size_bytes: 104000,
          needs_update: false
        },
        hi: {
          filename: 'filename10.mp3',
          file_size_bytes: 1000,
          needs_update: true
        }
      },
      hint_2: {},
      solution: {
        en: {
          filename: 'filename13.mp3',
          file_size_bytes: 15080,
          needs_update: false
        },
        hi: {
          filename: 'filename14.mp3',
          file_size_bytes: 10500,
          needs_update: false
        }
      }
    };

    beforeEach(angular.mock.inject(function($injector) {
      citatof = $injector.get('ContentIdsToAudioTranslationsObjectFactory');
      atof = $injector.get('AudioTranslationObjectFactory');
      citat = citatof.createFromBackendDict(citatDict);
    }));

    it('should get all content id', function() {
      var contentIdList = [
        'content', 'default_outcome', 'feedback_1', 'feedback_2', 'hint_1',
        'hint_2', 'solution'];
      expect(citat.getAllContentId()).toEqual(contentIdList);
    });

    it('should correctly get all bindable audio translations', function() {
      expect(citat.getBindableAudioTranslations('content')).toEqual({
        en: atof.createFromBackendDict({
          filename: 'filename1.mp3',
          file_size_bytes: 100000,
          needs_update: false
        }),
        hi: atof.createFromBackendDict({
          filename: 'filename2.mp3',
          file_size_bytes: 11000,
          needs_update: false
        })
      });
    });

    it('should get correct audio translation', function() {
      expect(citat.getAudioTranslation('hint_1', 'en')).toEqual(
        atof.createFromBackendDict({
          filename: 'filename9.mp3',
          file_size_bytes: 104000,
          needs_update: false
        }));
    });

    it('should make all audio needs update for a give content id', function() {
      citat.markAllAudioAsNeedingUpdate('content');
      expect(citat.getBindableAudioTranslations('content')).toEqual({
        en: atof.createFromBackendDict({
          filename: 'filename1.mp3',
          file_size_bytes: 100000,
          needs_update: true
        }),
        hi: atof.createFromBackendDict({
          filename: 'filename2.mp3',
          file_size_bytes: 11000,
          needs_update: true
        })
      });
    });

    it('should get all language code for a given content id', function() {
      var LanguageCodeList = ['en', 'hi'];
      expect(citat.getAudioLanguageCodes('hint_1')).toEqual(LanguageCodeList);
    });

    it('should correctly check content id has audio translations', function() {
      expect(citat.hasAudioTranslations('content')).toBe(true);
      expect(citat.hasAudioTranslations('hint_2')).toBe(false);
    });

    it('should correctly check content id has unflagged audio translations',
      function() {
        expect(citat.hasUnflaggedAudioTranslations('content')).toBe(true);
        citat.markAllAudioAsNeedingUpdate('solution');
        expect(citat.hasUnflaggedAudioTranslations('solution')).toBe(false);
      });

    it('should add a given content id', function() {
      citat.addContentId('feedback_3');
      expect(citat.getBindableAudioTranslations('feedback_3')).toEqual({});
      expect(function() {
        citat.addContentId('content');
      }).toThrowError('Trying to add duplicate content id.');
    });

    it('should delete a given content id', function() {
      citat.deleteContentId('feedback_1');
      var contentIdList = [
        'content', 'default_outcome', 'feedback_2', 'hint_1', 'hint_2',
        'solution'];
      expect(citat.getAllContentId()).toEqual(contentIdList);
      expect(function() {
        citat.deleteContentId('feedback_3');
      }).toThrowError('Unable to find the given content id.');
    });

    it('should check whether the text is fully translated', angular.mock.inject(
      function() {
        expect(citat.isFullyTranslated('content')).toBe(true);
        citat.deleteAudioTranslation('content', 'hi');
        expect(citat.isFullyTranslated('content')).toBe(false);
        citat.deleteAudioTranslation('content', 'en');
        expect(citat.isFullyTranslated('content')).toBe(false);
        expect(function() {
          citat.deleteAudioTranslation('content', 'hi-en');
        }).toThrowError(
          'Trying to remove non-existing translation for ' +
          'language code hi-en');
      }));

    it('should add audio translation in a given content id', function() {
      citat.addAudioTranslation('hint_2', 'en', 'filename11.mp3', 1000);
      expect(citat.getBindableAudioTranslations('hint_2')).toEqual({
        en: atof.createFromBackendDict({
          filename: 'filename11.mp3',
          file_size_bytes: 1000,
          needs_update: false
        })
      });
      expect(function() {
        citat.addAudioTranslation('content', 'en', 'filename.mp3', 1000);
      }).toThrowError('Trying to add duplicate language code.');
    });

    it('should delete audio translation in a given content id', function() {
      citat.deleteAudioTranslation('content', 'hi');
      expect(citat.getBindableAudioTranslations('content')).toEqual({
        en: atof.createFromBackendDict({
          filename: 'filename1.mp3',
          file_size_bytes: 100000,
          needs_update: false
        })
      });
    });

    it(
      'should toggle needs update attribute in a given content id', function() {
        citat.toggleNeedsUpdateAttribute('content', 'hi');
        expect(citat.getAudioTranslation('content', 'hi')).toEqual(
          atof.createFromBackendDict({
            filename: 'filename2.mp3',
            file_size_bytes: 11000,
            needs_update: true
          }));
      });

    it('should correctly convert to backend dict', function() {
      expect(citat.toBackendDict()).toEqual(citatDict);
    });
  });
});
// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for EditableExplorationBackendApiService.
 */

require('domain/exploration/EditableExplorationBackendApiService.ts');
require('domain/exploration/ReadOnlyExplorationBackendApiService.ts');

describe('Editable exploration backend API service', function() {
  var EditableExplorationBackendApiService = null;
  var ReadOnlyExplorationBackendApiService = null;
  var sampleDataResults = null;
  var $rootScope = null;
  var $scope = null;
  var $httpBackend = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module(
    'oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

  beforeEach(angular.mock.inject(function($injector) {
    EditableExplorationBackendApiService = $injector.get(
      'EditableExplorationBackendApiService');
    ReadOnlyExplorationBackendApiService = $injector.get(
      'ReadOnlyExplorationBackendApiService');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $httpBackend = $injector.get('$httpBackend');

    // Sample exploration object returnable from the backend
    sampleDataResults = {
      exploration_id: '0',
      init_state_name: 'Introduction',
      language_code: 'en',
      states: {
        Introduction: {
          param_changes: [],
          content: {
            html: '',
            audio_translations: {}
          },
          unresolved_answers: {},
          interaction: {
            customization_args: {},
            answer_groups: [],
            default_outcome: {
              param_changes: [],
              dest: 'Introduction',
              feedback: {
                html: '',
                audio_translations: {}
              }
            },
            confirmed_unclassified_answers: [],
            id: null
          }
        }
      },
      username: 'test',
      user_email: 'test@example.com',
      version: 1
    };
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully fetch an existing exploration from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', '/createhandler/data/0').respond(
        sampleDataResults);
      EditableExplorationBackendApiService.fetchExploration('0').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it('should fetch and apply the draft of an exploration',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      // Loading a exploration the first time should fetch it from the backend.
      $httpBackend.expect(
        'GET', '/createhandler/data/0?apply_draft=true').respond(
        sampleDataResults);

      EditableExplorationBackendApiService.fetchApplyDraftExploration(
        '0').then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it('should use the rejection handler if the backend request failed',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      // Loading a exploration the first time should fetch it from the backend.
      $httpBackend.expect('GET', '/createhandler/data/1').respond(
        500, 'Error loading exploration 1.');
      EditableExplorationBackendApiService.fetchExploration('1').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error loading exploration 1.');
    }
  );

  it('should update a exploration after fetching it from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      var exploration = null;

      // Loading a exploration the first time should fetch it from the backend.
      $httpBackend.expect('GET', '/createhandler/data/0').respond(
        sampleDataResults);

      EditableExplorationBackendApiService.fetchExploration('0').then(
        function(data) {
          exploration = data;
        });
      $httpBackend.flush();

      exploration.title = 'New Title';
      exploration.version = '2';

      $httpBackend.expect('PUT', '/createhandler/data/0').respond(
        exploration);

      // Send a request to update exploration
      EditableExplorationBackendApiService.updateExploration(
        exploration.exploration_id, exploration.version,
        exploration.title, []
      ).then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(exploration);
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it('should not cache exploration from backend into read only service',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      var exploration = null;

      $httpBackend.expect('GET', '/explorehandler/init/0')
        .respond(sampleDataResults);

      ReadOnlyExplorationBackendApiService.loadLatestExploration('0', null)
        .then(function(data) {
          exploration = data;
        });
      $httpBackend.flush();

      expect(ReadOnlyExplorationBackendApiService.isCached('0')).toBe(true);

      exploration.title = 'New Title';
      exploration.version = '2';

      $httpBackend.expect('PUT', '/createhandler/data/0')
        .respond(exploration);

      // Send a request to update exploration
      EditableExplorationBackendApiService.updateExploration(
        exploration.exploration_id,
        exploration.version,
        exploration.title, []
      ).then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(exploration);
      expect(failHandler).not.toHaveBeenCalled();

      expect(ReadOnlyExplorationBackendApiService.isCached('0')).toBe(false);
    }
  );

  it('should delete exploration from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      var exploration = null;

      $httpBackend.expect('GET', '/createhandler/data/0')
        .respond(sampleDataResults);

      EditableExplorationBackendApiService.fetchExploration('0')
        .then(function(data) {
          exploration = data;
        });
      $httpBackend.flush();

      exploration.title = 'New Title';
      exploration.version = '2';

      $httpBackend.expect('PUT', '/createhandler/data/0')
        .respond(exploration);

      // Send a request to update exploration
      EditableExplorationBackendApiService.updateExploration(
        exploration.exploration_id,
        exploration.version,
        'Minor edits', []
      ).then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(exploration);
      expect(failHandler).not.toHaveBeenCalled();

      $httpBackend.expect('DELETE', '/createhandler/data/0')
        .respond({});
      EditableExplorationBackendApiService
        .deleteExploration(exploration.exploration_id)
        .then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith({});
      expect(failHandler).not.toHaveBeenCalled();

      expect(ReadOnlyExplorationBackendApiService.isCached('0')).toBe(false);
    }
  );
});
// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview unit tests for the local save services.
 */

require('domain/exploration/ExplorationDraftObjectFactory.ts');

describe('ExplorationDraftObjectFactory', function() {
  beforeEach(angular.mock.module('oppia'));

  describe('exploration draft object factory', function() {
    var ExplorationDraftObjectFactory = null;
    var explorationId = '100';
    var draftChangeListId = 2;
    var changeList = [];
    var draftDict = {
      draftChanges: changeList,
      draftChangeListId: draftChangeListId
    };
    var draft = null;

    beforeEach(angular.mock.inject(function($injector) {
      ExplorationDraftObjectFactory = $injector.get(
        'ExplorationDraftObjectFactory');
      draft = (
        ExplorationDraftObjectFactory.createFromLocalStorageDict(
          draftDict));
    }));

    it('should determine if the draft is valid', function() {
      expect(draft.isValid(
        draftChangeListId)).toBeTruthy();
      expect(draft.isValid(
        draftChangeListId + 1)).toBeFalsy();
    });

    it('should return the correct changeList', function() {
      expect(draft.getChanges()).toEqual(changeList);
    });

    it('should create a valid local storage dict', function() {
      expect(ExplorationDraftObjectFactory.toLocalStorageDict(
        changeList, draftChangeListId)).toEqual(draftDict);
    });
  });
});
// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the Exploration object factory.
 */

require('domain/exploration/AudioTranslationObjectFactory.ts');
require('domain/exploration/ExplorationObjectFactory.ts');
require('domain/exploration/VoiceoverObjectFactory.ts');
require('domain/state/StateObjectFactory.ts');

describe('Exploration object factory', function() {
  beforeEach(angular.mock.module('oppia'));

  describe('ExplorationObjectFactory', function() {
    var scope, eof, atof, sof, explorationDict, exploration, vof;
    beforeEach(angular.mock.inject(function($injector, $rootScope) {
      scope = $rootScope.$new();
      eof = $injector.get('ExplorationObjectFactory');
      sof = $injector.get('StateObjectFactory');
      vof = $injector.get('VoiceoverObjectFactory');

      var statesDict = {
        'first state': {
          content: {
            content_id: 'content',
            html: 'content'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {
                en: {
                  filename: 'myfile1.mp3',
                  file_size_bytes: 210000,
                  needs_update: false
                },
                'hi-en': {
                  filename: 'myfile3.mp3',
                  file_size_bytes: 430000,
                  needs_update: false
                }
              },
              default_outcome: {}
            }
          },
          interaction: {
            answer_groups: [],
            confirmed_unclassified_answers: [],
            customization_args: {},
            default_outcome: {
              dest: 'new state',
              feedback: [],
              param_changes: []
            },
            hints: [],
            id: 'TextInput'
          },
          param_changes: [],
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {}
            }
          },
        },
        'second state': {
          content: {
            content_id: 'content',
            html: 'more content'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {
                'hi-en': {
                  filename: 'myfile2.mp3',
                  file_size_bytes: 120000,
                  needs_update: false
                }
              },
              default_outcome: {}
            }
          },
          interaction: {
            answer_groups: [],
            confirmed_unclassified_answers: [],
            customization_args: {},
            default_outcome: {
              dest: 'new state',
              feedback: [],
              param_changes: []
            },
            hints: [],
            id: 'TextInput'
          },
          param_changes: [],
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {}
            }
          },
        }
      };

      explorationDict = {
        id: 1,
        title: 'My Title',
        category: 'Art',
        objective: 'Your objective',
        tags: [],
        blurb: '',
        author_notes: '',
        states_schema_version: 15,
        init_state_name: 'Introduction',
        states: statesDict,
        param_specs: {},
        param_changes: [],
        version: 1
      };

      exploration = eof.createFromBackendDict(explorationDict);
      exploration.setInitialStateName('first state');
    }));

    it('should get all language codes of an exploration', function() {
      expect(exploration.getAllVoiceoverLanguageCodes())
        .toEqual(['en', 'hi-en']);
    });

    it('should correctly get the content html', function() {
      expect(exploration.getUninterpolatedContentHtml('first state'))
        .toEqual('content');
    });

    it('should correctly get audio translations from an exploration',
      function() {
        expect(exploration.getAllVoiceovers('hi-en')).toEqual({
          'first state': [vof.createFromBackendDict({
            filename: 'myfile3.mp3',
            file_size_bytes: 430000,
            needs_update: false
          })],
          'second state': [vof.createFromBackendDict({
            filename: 'myfile2.mp3',
            file_size_bytes: 120000,
            needs_update: false
          })]
        });
        expect(exploration.getAllVoiceovers('en')).toEqual({
          'first state': [vof.createFromBackendDict({
            filename: 'myfile1.mp3',
            file_size_bytes: 210000,
            needs_update: false
          })],
          'second state': []
        });
      });
  });
});
// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for hint object factory.
 */

require('domain/exploration/HintObjectFactory.ts');

describe('Hint object factory', function() {
  beforeEach(angular.mock.module('oppia'));
  var hof = null;

  beforeEach(angular.mock.inject(function($injector) {
    hof = $injector.get('HintObjectFactory');
  }));

  it('should create a Hint from dict and convert a Hint Object to' +
     'backend dict correctly', inject(function() {
    var testHint = hof.createNew('content_id', '<p>Some Hint</p>');
    expect(testHint.toBackendDict()).toEqual({
      hint_content: {
        html: '<p>Some Hint</p>',
        content_id: 'content_id'
      }
    });
    expect(hof.createFromBackendDict({
      hint_content: {
        html: '<p>Some Hint</p>',
        content_id: 'content_id'
      }
    })).toEqual(hof.createNew('content_id', '<p>Some Hint</p>'));
  }));

  it('should be able to create a new hint object', inject(function() {
    expect(hof.createNew('content_id', '<p>Some Hint</p>')).toEqual(
      hof.createFromBackendDict({
        hint_content: {
          html: '<p>Some Hint</p>',
          content_id: 'content_id'
        }
      })
    );
  }));
});
// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for Interaction object factory.
 */

require('domain/exploration/AnswerGroupObjectFactory.ts');
require('domain/exploration/HintObjectFactory.ts');
require('domain/exploration/InteractionObjectFactory.ts');
require('domain/exploration/OutcomeObjectFactory.ts');
require('domain/exploration/SolutionObjectFactory.ts');

describe('Interaction object factory', function() {
  var iof = null;
  var oof = null;
  var agof = null;
  var hof = null;
  var sof = null;
  var testInteraction = null;
  var answerGroupsDict = null;
  var defaultOutcomeDict = null;
  var solutionDict = null;
  var hintsDict = null;
  var interactionDict = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    iof = $injector.get('InteractionObjectFactory');
    oof = $injector.get('OutcomeObjectFactory');
    agof = $injector.get('AnswerGroupObjectFactory');
    hof = $injector.get('HintObjectFactory');
    sof = $injector.get('SolutionObjectFactory');
    defaultOutcomeDict = {
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
    answerGroupsDict = [{
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
      tagged_misconception_id: 1
    }];
    hintsDict = [
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

    solutionDict = {
      answer_is_exclusive: false,
      correct_answer: 'This is a correct answer!',
      explanation: {
        content_id: 'solution',
        html: 'This is the explanation to the answer'
      }
    };

    interactionDict = {
      answer_groups: answerGroupsDict,
      confirmed_unclassified_answers: [],
      customization_args: {
        customArg: {
          value: 'custom_value'
        }
      },
      default_outcome: defaultOutcomeDict,
      hints: hintsDict,
      id: 'interaction_id',
      solution: solutionDict
    };

    testInteraction = iof.createFromBackendDict(interactionDict);
  }));

  it('should correctly set the new ID', function() {
    expect(testInteraction.id).toEqual('interaction_id');
    testInteraction.setId('new_interaction_id');
    expect(testInteraction.id).toEqual('new_interaction_id');
  });

  it('should correctly set the new answer group', function() {
    var newAnswerGroup = {
      rule_specs: [],
      outcome: {
        dest: 'dest_3',
        feedback: {
          content_id: 'outcome_3',
          html: ''
        },
        labelled_as_correct: false,
        param_changes: [],
        refresher_exploration_id: null,
        missing_prerequisite_skill_id: null
      },
      training_data: ['training_data'],
      tagged_misconception_id: 1
    };
    expect(testInteraction.answerGroups).toEqual([agof.createFromBackendDict({
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
      tagged_misconception_id: 1
    })]);
    newAnswerGroup = agof.createFromBackendDict(newAnswerGroup);
    testInteraction.setAnswerGroups([newAnswerGroup]);
    expect(testInteraction.answerGroups).toEqual([newAnswerGroup]);
  });

  it('should correctly set the new default outcome', function() {
    var newDefaultOutcomeDict = {
      dest: 'dest_default_new',
      feedback: {
        content_id: 'default_outcome_new',
        html: ''
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null
    };
    var newDefaultOutcome = oof.createFromBackendDict(newDefaultOutcomeDict);
    expect(testInteraction.defaultOutcome).toEqual(
      oof.createFromBackendDict({
        dest: 'dest_default',
        feedback: {
          content_id: 'default_outcome',
          html: ''
        },
        labelled_as_correct: false,
        param_changes: [],
        refresher_exploration_id: null,
        missing_prerequisite_skill_id: null
      }));
    testInteraction.setDefaultOutcome(newDefaultOutcome);
    expect(testInteraction.defaultOutcome).toEqual(newDefaultOutcome);
  });

  it('should correctly set the new customization args', function() {
    var newCustomizationArgs = {
      customArgNew: {
        value: 'custom_value_new'
      }
    };
    expect(testInteraction.customizationArgs).toEqual({
      customArg: {
        value: 'custom_value'
      }
    });
    testInteraction.setCustomizationArgs(newCustomizationArgs);
    expect(testInteraction.customizationArgs).toEqual(newCustomizationArgs);
  });

  it('should correctly set the new solution', function() {
    var newSolutionDict = {
      answer_is_exclusive: false,
      correct_answer: 'This is a new correct answer!',
      explanation: {
        content_id: 'solution_new',
        html: 'This is the new explanation to the answer'
      }
    };
    var newSolution = sof.createFromBackendDict(newSolutionDict);
    expect(testInteraction.solution).toEqual(
      sof.createFromBackendDict({
        answer_is_exclusive: false,
        correct_answer: 'This is a correct answer!',
        explanation: {
          content_id: 'solution',
          html: 'This is the explanation to the answer'
        }
      }));
    testInteraction.setSolution(newSolution);
    expect(testInteraction.solution).toEqual(newSolution);
  });

  it('should correctly set the new hint', function() {
    var newHintDict = {
      hint_content: {
        html: '<p>New Hint</p>',
        content_id: 'content_id_new'
      }
    };
    var newHint = hof.createFromBackendDict(newHintDict);
    expect(testInteraction.hints).toEqual(hintsDict.map(function(hintDict) {
      return hof.createFromBackendDict(hintDict);
    }));
    testInteraction.setHints([newHint]);
    expect(testInteraction.hints).toEqual([newHint]);
  });

  it('should correctly copy from other interaction', function() {
    var newAnswerGroups = [{
      rule_specs: [],
      outcome: {
        dest: 'dest_1_new',
        feedback: {
          content_id: 'outcome_1_new',
          html: ''
        },
        labelled_as_correct: false,
        param_changes: [],
        refresher_exploration_id: null,
        missing_prerequisite_skill_id: null
      },
      training_data: ['training_data_new'],
      tagged_misconception_id: 2
    }];
    var newDefaultOutcome = {
      dest: 'dest_default_new',
      feedback: {
        content_id: 'default_outcome_new',
        html: ''
      },
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
      missing_prerequisite_skill_id: null
    };
    var newHintDict = [
      {
        hint_content: {
          html: '<p>New Hint</p>',
          content_id: 'content_id1_new'
        }
      }
    ];
    var newSolutionDict = {
      answer_is_exclusive: false,
      correct_answer: 'This is a new correct answer!',
      explanation: {
        content_id: 'solution_new',
        html: 'This is the new explanation to the answer'
      }
    };
    var otherInteractionDict = {
      answer_groups: newAnswerGroups,
      confirmed_unclassified_answers: [],
      customization_args: {
        customArg: {
          value: 'custom_arg'
        }
      },
      default_outcome: newDefaultOutcome,
      hints: newHintDict,
      id: 'interaction_id_new',
      solution: newSolutionDict
    };
    var otherInteraction = iof.createFromBackendDict(otherInteractionDict);
    testInteraction.copy(otherInteraction);
    expect(testInteraction).toEqual(otherInteraction);
    otherInteraction.customizationArgs.customArg.value = 'custom_arg_new';
    expect(testInteraction).toEqual(iof.createFromBackendDict({
      answer_groups: newAnswerGroups,
      confirmed_unclassified_answers: [],
      customization_args: {
        customArg: {
          value: 'custom_arg'
        }
      },
      default_outcome: newDefaultOutcome,
      hints: newHintDict,
      id: 'interaction_id_new',
      solution: newSolutionDict
    }));
  });
});
// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview unit tests for outcome object factory.
 */

require('domain/exploration/OutcomeObjectFactory.ts');

describe('Outcome object factory', function() {
  var oof;
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector) {
    oof = $injector.get('OutcomeObjectFactory');
  }));

  it(
    'should correctly determine if an outcome is confusing given a ' +
    'source state',
    function() {
      var currentState = 'A';
      var testOutcome1 = oof.createNew('B', 'feedback_1', 'feedback', []);
      var testOutcome2 = oof.createNew('B', 'feedback_2', '', []);
      var testOutcome3 = oof.createNew('A', 'feedback_3', 'feedback', []);
      var testOutcome4 = oof.createNew('A', 'feedback_4', '', []);
      var testOutcome5 = oof.createNew('A', 'feedback_5', '   ', []);
      expect(testOutcome1.isConfusing(currentState)).toBe(false);
      expect(testOutcome2.isConfusing(currentState)).toBe(false);
      expect(testOutcome3.isConfusing(currentState)).toBe(false);
      expect(testOutcome4.isConfusing(currentState)).toBe(true);
      expect(testOutcome5.isConfusing(currentState)).toBe(true);
    }
  );

  it('should correctly output whether an outcome has nonempty feedback',
    function() {
      var testOutcome1 = oof.createNew('A', 'feedback_1', 'feedback', []);
      var testOutcome2 = oof.createNew('A', 'feedback_2', '', []);
      var testOutcome3 = oof.createNew('A', 'feedback_3', '   ', []);
      expect(testOutcome1.hasNonemptyFeedback()).toBe(true);
      expect(testOutcome2.hasNonemptyFeedback()).toBe(false);
      expect(testOutcome3.hasNonemptyFeedback()).toBe(false);
    }
  );

  it('should correctly set the destination of an outcome',
    function() {
      var testOutcome = oof.createNew('A', 'feedback_1', 'feedback', []);
      testOutcome.setDestination('B');
      expect(testOutcome.dest).toEqual('B');
    }
  );
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for ParamMetadataObjectFactory.
 */

require('domain/exploration/ParamMetadataObjectFactory.ts');

describe('ParameterMetadata object factory', function() {
  var parameterMetadata = null;
  var pmof = null;
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector) {
    pmof = $injector.get('ParamMetadataObjectFactory');
  }));

  it('should have correct metadata for SET action', function() {
    parameterMetadata = pmof.createWithSetAction('answer', 'param_changes', 1);
    expect(parameterMetadata.action).toEqual('set');
    expect(parameterMetadata.paramName).toEqual('answer');
    expect(parameterMetadata.source).toEqual('param_changes');
    expect(parameterMetadata.sourceInd).toEqual(1);
  });

  it('should have correct metadata for GET action', function() {
    parameterMetadata = pmof.createWithGetAction('x', 'content', 5);
    expect(parameterMetadata.action).toEqual('get');
    expect(parameterMetadata.paramName).toEqual('x');
    expect(parameterMetadata.source).toEqual('content');
    expect(parameterMetadata.sourceInd).toEqual(5);
  });
});
// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the Param Specs object factory.
 */

require('domain/exploration/ParamSpecObjectFactory.ts');
require('domain/exploration/ParamSpecsObjectFactory.ts');

describe('ParamSpecs', function() {
  var ParamSpecsObjectFactory = null;
  var ParamSpecObjectFactory = null;
  var emptyParamSpecs = null;
  var paramName = 'x';

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector) {
    ParamSpecsObjectFactory = $injector.get('ParamSpecsObjectFactory');
    ParamSpecObjectFactory = $injector.get('ParamSpecObjectFactory');
    emptyParamSpecs = ParamSpecsObjectFactory.createFromBackendDict({});
  }));

  it('should be undefined for missing param names', function() {
    expect(emptyParamSpecs.getParamDict()[paramName]).not.toBeDefined();
  });

  it('should add param when missing', function() {
    var paramSpec = ParamSpecObjectFactory.createDefault();

    expect(emptyParamSpecs.addParamIfNew(paramName, paramSpec)).toBe(true);
    // No longer empty.
    expect(emptyParamSpecs.getParamDict()[paramName]).toBe(paramSpec);
  });

  it('should not overwrite existing params', function() {
    var oldParamSpec = ParamSpecObjectFactory.createDefault();
    expect(emptyParamSpecs.addParamIfNew(paramName, oldParamSpec)).toBe(true);
    // No longer empty.
    expect(emptyParamSpecs.getParamDict()[paramName]).toBe(oldParamSpec);

    var newParamSpec = ParamSpecObjectFactory.createDefault();
    expect(emptyParamSpecs.addParamIfNew(paramName, newParamSpec)).toBe(false);
    expect(emptyParamSpecs.getParamDict()[paramName]).not.toBe(newParamSpec);
    expect(emptyParamSpecs.getParamDict()[paramName]).toBe(oldParamSpec);
  });
});
// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Description of this file.
 */

require('domain/exploration/ParamTypeObjectFactory.ts');

describe('ParamType objects', function() {
  var ParamType = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector) {
    ParamType = $injector.get('ParamTypeObjectFactory');
  }));

  it('should have its registry frozen', function() {
    expect(Object.isFrozen(ParamType.registry)).toBe(true);
  });

  it('should use UnicodeString as default type', function() {
    expect(ParamType.getDefaultType()).toBe(ParamType.registry.UnicodeString);
  });

  it('should throw for non-existant types', function() {
    expect(function() {
      ParamType.getTypeFromBackendName('MissingType');
    })
      .toThrowError(/not a registered parameter type/);
  });

  it('should not allow invalid default values', function() {
    expect(function() {
      // Defines a "Natural Number" type but gives it a negative default value.
      new ParamType({
        validate: function(v) {
          return v >= 0;
        },
        default_value: -1,
      });
    }).toThrowError(/default value is invalid/);
  });

  describe('UnicodeString', function() {
    var UnicodeString = null;

    beforeEach(function() {
      UnicodeString = ParamType.registry.UnicodeString;
    });

    it('should be frozen', function() {
      expect(Object.isFrozen(UnicodeString)).toBe(true);
    });

    it('should give an empty string by default', function() {
      expect(UnicodeString.createDefaultValue()).toEqual('');
    });

    it('should be named correctly', function() {
      expect(UnicodeString.getName()).toEqual('UnicodeString');
    });

    it('should be able to tell whether or not values are strings', function() {
      expect(UnicodeString.valueIsValid('abc')).toBe(true);
      expect(UnicodeString.valueIsValid(3)).toBe(false);
      expect(UnicodeString.valueIsValid([1, 2])).toBe(false);
    });
  });
});
// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for ReadOnlyExplorationBackendApiService.
 */

require('domain/exploration/ReadOnlyExplorationBackendApiService.ts');
require('domain/exploration/SubtitledHtmlObjectFactory.ts');

describe('Read only exploration backend API service', function() {
  var ReadOnlyExplorationBackendApiService = null;
  var sampleDataResults = null;
  var $rootScope = null;
  var $scope = null;
  var $httpBackend = null;
  var shof;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module(
    'oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

  beforeEach(angular.mock.inject(function($injector) {
    ReadOnlyExplorationBackendApiService = $injector.get(
      'ReadOnlyExplorationBackendApiService');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $httpBackend = $injector.get('$httpBackend');
    shof = $injector.get('SubtitledHtmlObjectFactory');

    // Sample exploration object returnable from the backend
    sampleDataResults = {
      exploration_id: '0',
      is_logged_in: true,
      session_id: 'KERH',
      exploration: {
        init_state_name: 'Introduction',
        states: {
          Introduction: {
            param_changes: [],
            content: {
              html: '',
              audio_translations: {}
            },
            unresolved_answers: {},
            interaction: {
              customization_args: {},
              answer_groups: [],
              default_outcome: {
                param_changes: [],
                dest: 'Introduction',
                feedback: {
                  html: '',
                  audio_translations: {}
                }
              },
              confirmed_unclassified_answers: [],
              id: null
            }
          }
        }
      },
      version: 1,
      state_classifier_mapping: {}
    };
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully fetch an existing exploration from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', '/explorehandler/init/0').respond(
        sampleDataResults);
      ReadOnlyExplorationBackendApiService.fetchExploration(
        '0', null).then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it('should load a cached exploration after fetching it from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      // Loading a exploration the first time should fetch it from the backend.
      $httpBackend.expect('GET', '/explorehandler/init/0').respond(
        sampleDataResults);
      ReadOnlyExplorationBackendApiService.loadExploration(
        '0', null).then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
      expect(failHandler).not.toHaveBeenCalled();

      // Loading a exploration the second time should not fetch it.
      ReadOnlyExplorationBackendApiService.loadExploration(
        '0', null).then(successHandler, failHandler);

      expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it('should use the rejection handler if the backend request failed',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      // Loading a exploration the first time should fetch it from the backend.
      $httpBackend.expect('GET', '/explorehandler/init/0').respond(
        500, 'Error loading exploration 0.');
      ReadOnlyExplorationBackendApiService.loadExploration(
        '0', null).then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error loading exploration 0.');
    }
  );

  it('should report caching and support clearing the cache', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    // The exploration should not currently be cached.
    expect(ReadOnlyExplorationBackendApiService.isCached('0')).toBe(false);

    // Loading a exploration the first time should fetch it from the backend.
    $httpBackend.expect('GET', '/explorehandler/init/0').respond(
      sampleDataResults);
    ReadOnlyExplorationBackendApiService.loadLatestExploration('0').then(
      successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
    expect(failHandler).not.toHaveBeenCalled();

    // The exploration should now be cached.
    expect(ReadOnlyExplorationBackendApiService.isCached('0')).toBe(true);

    // The exploration should be loadable from the cache.
    ReadOnlyExplorationBackendApiService.loadLatestExploration('0').then(
      successHandler, failHandler);
    expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
    expect(failHandler).not.toHaveBeenCalled();

    // Resetting the cache will cause another fetch from the backend.
    ReadOnlyExplorationBackendApiService.clearExplorationCache();
    expect(ReadOnlyExplorationBackendApiService.isCached('0')).toBe(false);

    $httpBackend.expect('GET', '/explorehandler/init/0').respond(
      sampleDataResults);
    ReadOnlyExplorationBackendApiService.loadLatestExploration('0').then(
      successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should report a cached exploration after caching it', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    // The exploration should not currently be cached.
    expect(ReadOnlyExplorationBackendApiService.isCached('0')).toBe(false);

    // Cache a exploration.
    ReadOnlyExplorationBackendApiService.cacheExploration('0', {
      id: '0',
      nodes: []
    });

    // It should now be cached.
    expect(ReadOnlyExplorationBackendApiService.isCached('0')).toBe(true);

    // A new exploration should not have been fetched from the backend. Also,
    // the returned exploration should match the expected exploration object.
    ReadOnlyExplorationBackendApiService.loadLatestExploration('0').then(
      successHandler, failHandler);

    // http://brianmcd.com/2014/03/27/
    // a-tip-for-angular-unit-tests-with-promises.html
    $rootScope.$digest();

    expect(successHandler).toHaveBeenCalledWith({
      id: '0',
      nodes: []
    });
    expect(failHandler).not.toHaveBeenCalled();
  });
});
// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for RecordedVoiceovers object factory.
 */

require('domain/exploration/RecordedVoiceoversObjectFactory.ts');
require('domain/exploration/VoiceoverObjectFactory.ts');

describe('RecordedVoiceovers object factory', function() {
  var rvof = null;
  var vof = null;
  var rv = null;
  var rvDict = {
    voiceovers_mapping: {
      content: {
        en: {
          filename: 'filename1.mp3',
          file_size_bytes: 100000,
          needs_update: false
        },
        hi: {
          filename: 'filename2.mp3',
          file_size_bytes: 11000,
          needs_update: false
        }
      },
      default_outcome: {
        en: {
          filename: 'filename3.mp3',
          file_size_bytes: 3000,
          needs_update: false
        },
        hi: {
          filename: 'filename4.mp3',
          file_size_bytes: 5000,
          needs_update: false
        }
      },
      feedback_1: {
        en: {
          filename: 'filename5.mp3',
          file_size_bytes: 2000,
          needs_update: false
        },
        hi: {
          filename: 'filename6.mp3',
          file_size_bytes: 9000,
          needs_update: false
        }
      },
      feedback_2: {
        en: {
          filename: 'filename7.mp3',
          file_size_bytes: 1000,
          needs_update: false
        },
        hi: {
          filename: 'filename8.mp3',
          file_size_bytes: 600,
          needs_update: false
        }
      },
      hint_1: {
        en: {
          filename: 'filename9.mp3',
          file_size_bytes: 104000,
          needs_update: false
        },
        hi: {
          filename: 'filename10.mp3',
          file_size_bytes: 1000,
          needs_update: true
        }
      },
      hint_2: {},
      solution: {
        en: {
          filename: 'filename13.mp3',
          file_size_bytes: 15080,
          needs_update: false
        },
        hi: {
          filename: 'filename14.mp3',
          file_size_bytes: 10500,
          needs_update: false
        }
      }
    }
  };

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    vof = $injector.get('VoiceoverObjectFactory');
    rvof = $injector.get('RecordedVoiceoversObjectFactory');
    rv = rvof.createFromBackendDict(rvDict);
  }));

  it('should get all content id', function() {
    var contentIdList = [
      'content', 'default_outcome', 'feedback_1', 'feedback_2', 'hint_1',
      'hint_2', 'solution'];
    expect(rv.getAllContentId()).toEqual(contentIdList);
  });

  it('should correctly get all bindable audio voiceovers', function() {
    expect(rv.getBindableVoiceovers('content')).toEqual({
      en: vof.createFromBackendDict({
        filename: 'filename1.mp3',
        file_size_bytes: 100000,
        needs_update: false
      }),
      hi: vof.createFromBackendDict({
        filename: 'filename2.mp3',
        file_size_bytes: 11000,
        needs_update: false
      })
    });
  });

  it('should return a correct voiceover for a given content id and language',
    function() {
      expect(rv.getVoiceover('hint_1', 'en')).toEqual(
        vof.createFromBackendDict({
          filename: 'filename9.mp3',
          file_size_bytes: 104000,
          needs_update: false
        }));
    });

  it('should make all audio needs update for a give content id', function() {
    rv.markAllVoiceoversAsNeedingUpdate('content');
    expect(rv.getBindableVoiceovers('content')).toEqual({
      en: vof.createFromBackendDict({
        filename: 'filename1.mp3',
        file_size_bytes: 100000,
        needs_update: true
      }),
      hi: vof.createFromBackendDict({
        filename: 'filename2.mp3',
        file_size_bytes: 11000,
        needs_update: true
      })
    });
  });

  it('should get all language code for a given content id', function() {
    var LanguageCodeList = ['en', 'hi'];
    expect(rv.getVoiceoverLanguageCodes('hint_1')).toEqual(LanguageCodeList);
  });

  it('should correctly check content id has voiceovers', function() {
    expect(rv.hasVoiceovers('content')).toBe(true);
    expect(rv.hasVoiceovers('hint_2')).toBe(false);
  });

  it('should correctly check content id has unflagged voiceovers', function() {
    expect(rv.hasUnflaggedVoiceovers('content')).toBe(true);
    rv.markAllVoiceoversAsNeedingUpdate('solution');
    expect(rv.hasUnflaggedVoiceovers('solution')).toBe(false);
  });

  it('should add a given content id', function() {
    rv.addContentId('feedback_3');
    expect(rv.getBindableVoiceovers('feedback_3')).toEqual({});
    expect(function() {
      rv.addContentId('content');
    }).toThrowError('Trying to add duplicate content id.');
  });

  it('should delete a given content id', function() {
    rv.deleteContentId('feedback_1');
    var contentIdList = [
      'content', 'default_outcome', 'feedback_2', 'hint_1', 'hint_2',
      'solution'];
    expect(rv.getAllContentId()).toEqual(contentIdList);
    expect(function() {
      rv.deleteContentId('feedback_3');
    }).toThrowError('Unable to find the given content id.');
  });

  it('should add voiceovers in a given content id', function() {
    rv.addVoiceover('hint_2', 'en', 'filename11.mp3', 1000);
    expect(rv.getBindableVoiceovers('hint_2')).toEqual({
      en: vof.createFromBackendDict({
        filename: 'filename11.mp3',
        file_size_bytes: 1000,
        needs_update: false
      })
    });
    expect(function() {
      rv.addVoiceover('content', 'en', 'filename.mp3', 1000);
    }).toThrowError('Trying to add duplicate language code.');
  });

  it('should delete voiceovers in a given content id', function() {
    rv.deleteVoiceover('content', 'hi');
    expect(rv.getBindableVoiceovers('content')).toEqual({
      en: vof.createFromBackendDict({
        filename: 'filename1.mp3',
        file_size_bytes: 100000,
        needs_update: false
      })
    });
  });

  it(
    'should toggle needs update attribute in a given content id', function() {
      rv.toggleNeedsUpdateAttribute('content', 'hi');
      expect(rv.getVoiceover('content', 'hi')).toEqual(
        vof.createFromBackendDict({
          filename: 'filename2.mp3',
          file_size_bytes: 11000,
          needs_update: true
        }));
    });

  it('should correctly convert to backend dict', function() {
    expect(rv.toBackendDict()).toEqual(rvDict);
  });
});
// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the Solution object factory.
 */

require('domain/exploration/SolutionObjectFactory.ts');

describe('Solution object factory', function() {
  beforeEach(angular.mock.module('oppia'));

  describe('SolutionObjectFactory', function() {
    var scope, sof, solution;
    beforeEach(angular.mock.inject(function($injector, $rootScope) {
      scope = $rootScope.$new();
      sof = $injector.get('SolutionObjectFactory');
      solution = sof.createFromBackendDict({
        answer_is_exclusive: false,
        correct_answer: 'This is a correct answer!',
        explanation: {
          content_id: 'solution',
          html: 'This is the explanation to the answer'
        }
      });
    }));


    it('should create a new solution', function() {
      expect(solution.toBackendDict()).toEqual({
        answer_is_exclusive: false,
        correct_answer: 'This is a correct answer!',
        explanation: {
          content_id: 'solution',
          html: 'This is the explanation to the answer'
        }
      });
    });

    it('should create summary correctly', function() {
      expect(solution.getSummary('TextInput')).toEqual(
        'One solution is "&quot;This is a correct answer!&quot;". ' +
        'This is the explanation to the answer.');

      solution.setCorrectAnswer({
        ascii: 'one',
        latex: 'one'
      });
      expect(solution.getSummary('MathExpressionInput')).toEqual(
        'One solution is "one". This is the explanation to the answer.');

      solution.setCorrectAnswer({
        code: 'a=10',
        error: '',
        evaluation: '',
        output: ''
      });
      expect(solution.getSummary('CodeRepl')).toEqual(
        'One solution is "a=10". This is the explanation to the answer.');

      solution.setCorrectAnswer({
        isNegative: false,
        wholeNumber: 0,
        numerator: 1,
        denominator: 6
      });
      expect(solution.getSummary('FractionInput')).toEqual(
        'One solution is "1/6". This is the explanation to the answer.');
    });
  });
});
// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the Solution object factory.
 */

require('domain/exploration/SolutionObjectFactory.ts');

describe('Solution object factory', function() {
  beforeEach(angular.mock.module('oppia'));

  describe('SolutionObjectFactory', function() {
    var scope, sof, solution;
    beforeEach(angular.mock.inject(function($injector, $rootScope) {
      scope = $rootScope.$new();
      sof = $injector.get('SolutionObjectFactory');
      solution = sof.createFromBackendDict({
        answer_is_exclusive: false,
        correct_answer: 'This is a correct answer!',
        explanation: {
          content_id: 'solution',
          html: 'This is the explanation to the answer'
        }
      });
    }));


    it('should create a new solution', function() {
      expect(solution.toBackendDict()).toEqual({
        answer_is_exclusive: false,
        correct_answer: 'This is a correct answer!',
        explanation: {
          content_id: 'solution',
          html: 'This is the explanation to the answer'
        }
      });
    });

    it('should create summary correctly', function() {
      expect(solution.getSummary('TextInput')).toEqual(
        'One solution is "&quot;This is a correct answer!&quot;". ' +
        'This is the explanation to the answer.');

      solution.setCorrectAnswer({
        ascii: 'one',
        latex: 'one'
      });
      expect(solution.getSummary('MathExpressionInput')).toEqual(
        'One solution is "one". This is the explanation to the answer.');

      solution.setCorrectAnswer({
        code: 'a=10',
        error: '',
        evaluation: '',
        output: ''
      });
      expect(solution.getSummary('CodeRepl')).toEqual(
        'One solution is "a=10". This is the explanation to the answer.');

      solution.setCorrectAnswer({
        isNegative: false,
        wholeNumber: 0,
        numerator: 1,
        denominator: 6
      });
      expect(solution.getSummary('FractionInput')).toEqual(
        'One solution is "1/6". This is the explanation to the answer.');
    });
  });
});
// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the SubtitledHtml object factory.
 */

require('domain/exploration/SubtitledHtmlObjectFactory.ts');

describe('SubtitledHtml object factory', function() {
  beforeEach(angular.mock.module('oppia'));

  describe('SubtitledHtmlObjectFactory', function() {
    var scope, shof, lus, subtitledHtml;

    beforeEach(angular.mock.inject(function($injector, $rootScope) {
      scope = $rootScope.$new();
      shof = $injector.get('SubtitledHtmlObjectFactory');

      subtitledHtml = shof.createFromBackendDict({
        content_id: 'content_id',
        html: '<p>some html</p>'
      });
    }));

    it('should get and set HTML correctly', angular.mock.inject(function() {
      expect(subtitledHtml.getHtml()).toEqual('<p>some html</p>');
      subtitledHtml.setHtml('new html');
      expect(subtitledHtml.getHtml()).toEqual('new html');
    }));

    it('should get contentId correctly', angular.mock.inject(function() {
      expect(subtitledHtml.getContentId()).toEqual('content_id');
    }));

    it('should correctly check existence of HTML', angular.mock.inject(
      function() {
        expect(subtitledHtml.hasNoHtml()).toBe(false);
        subtitledHtml.setHtml('');
        expect(subtitledHtml.hasNoHtml()).toBe(true);
      }));

    it('should correctly check emptiness', angular.mock.inject(function() {
      expect(subtitledHtml.isEmpty()).toBe(false);

      subtitledHtml.setHtml('');
      expect(subtitledHtml.isEmpty()).toBe(true);

      subtitledHtml.setHtml('hello');
      expect(subtitledHtml.isEmpty()).toBe(false);
    }));

    it('should convert to backend dict correctly', angular.mock.inject(
      function() {
        expect(subtitledHtml.toBackendDict()).toEqual({
          content_id: 'content_id',
          html: '<p>some html</p>'
        });
      }));

    it('should create default object', angular.mock.inject(function() {
      var defaultSubtitledHtml = shof.createDefault('test html', 'content_id');
      expect(defaultSubtitledHtml.getHtml()).toEqual('test html');
      expect(defaultSubtitledHtml.getContentId()).toEqual('content_id');
    }));
  });
});
// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the Voiceover object factory.
 */

require('domain/exploration/VoiceoverObjectFactory.ts');

describe('Voiceover object factory', function() {
  beforeEach(angular.mock.module('oppia'));

  var scope = null;
  var vof = null;
  var voiceover = null;

  beforeEach(angular.mock.inject(function($injector) {
    vof = $injector.get('VoiceoverObjectFactory');
    voiceover = vof.createFromBackendDict({
      filename: 'a.mp3',
      file_size_bytes: 200000,
      needs_update: false
    });
  }));

  it('should correctly mark voiceover as needing update', function() {
    voiceover.markAsNeedingUpdate();
    expect(voiceover).toEqual(vof.createFromBackendDict({
      filename: 'a.mp3',
      file_size_bytes: 200000,
      needs_update: true
    }));
  });

  it('should toggle needs update attribute correctly', function() {
    voiceover.toggleNeedsUpdateAttribute();
    expect(voiceover).toEqual(vof.createFromBackendDict({
      filename: 'a.mp3',
      file_size_bytes: 200000,
      needs_update: true
    }));

    voiceover.toggleNeedsUpdateAttribute();
    expect(voiceover).toEqual(vof.createFromBackendDict({
      filename: 'a.mp3',
      file_size_bytes: 200000,
      needs_update: false
    }));
  });

  it('should convert to backend dict correctly', function() {
    expect(voiceover.toBackendDict()).toEqual({
      filename: 'a.mp3',
      file_size_bytes: 200000,
      needs_update: false
    });
  });

  it('should create a new voiceover object', function() {
    expect(vof.createNew('filename.mp3', 100000)).toEqual(
      vof.createFromBackendDict({
        filename: 'filename.mp3',
        file_size_bytes: 100000,
        needs_update: false
      })
    );
  });

  it('should get the correct file size in MB', function() {
    var NUM_BYTES_IN_MB = 1 << 20;
    expect(voiceover.getFileSizeMB()).toEqual(
      200000 / NUM_BYTES_IN_MB);
  });
});
// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the WrittenTranslation object factory.
 */

require('domain/exploration/WrittenTranslationObjectFactory.ts');

describe('WrittenTranslation object factory', function() {
  beforeEach(angular.mock.module('oppia'));

  describe('WrittenTranslationObjectFactory', function() {
    var wtof = null;
    var writtenTranslation = null;

    beforeEach(angular.mock.inject(function($injector) {
      wtof = $injector.get('WrittenTranslationObjectFactory');
      writtenTranslation = wtof.createFromBackendDict({
        html: '<p>HTML</p>',
        needs_update: false
      });
    }));

    it('should set and get html value correctly', function() {
      expect(writtenTranslation).toEqual(wtof.createFromBackendDict({
        html: '<p>HTML</p>',
        needs_update: false
      }));
      expect(writtenTranslation.getHtml()).toEqual('<p>HTML</p>');
      writtenTranslation.setHtml('<p>New HTML</p>');
      expect(writtenTranslation.getHtml()).toEqual('<p>New HTML</p>');
      expect(writtenTranslation).toEqual(wtof.createFromBackendDict({
        html: '<p>New HTML</p>',
        needs_update: false
      }));
    });

    it('should correctly mark written translation as needing update',
      function() {
        expect(writtenTranslation).toEqual(wtof.createFromBackendDict({
          html: '<p>HTML</p>',
          needs_update: false
        }));
        writtenTranslation.markAsNeedingUpdate();
        expect(writtenTranslation).toEqual(wtof.createFromBackendDict({
          html: '<p>HTML</p>',
          needs_update: true
        }));
      });

    it('should toggle needs update attribute correctly', function() {
      expect(writtenTranslation).toEqual(wtof.createFromBackendDict({
        html: '<p>HTML</p>',
        needs_update: false
      }));
      writtenTranslation.toggleNeedsUpdateAttribute();
      expect(writtenTranslation).toEqual(wtof.createFromBackendDict({
        html: '<p>HTML</p>',
        needs_update: true
      }));

      writtenTranslation.toggleNeedsUpdateAttribute();
      expect(writtenTranslation).toEqual(wtof.createFromBackendDict({
        html: '<p>HTML</p>',
        needs_update: false
      }));
    });

    it('should convert to backend dict correctly', function() {
      expect(writtenTranslation.toBackendDict()).toEqual({
        html: '<p>HTML</p>',
        needs_update: false
      });
    });

    it('should create a new written translation translation', function() {
      expect(wtof.createNew('New')).toEqual(
        wtof.createFromBackendDict({
          html: 'New',
          needs_update: false
        })
      );
    });
  });
});
// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for FeedbackMessageSummaryObjectFactory.
 */

require('domain/feedback_message/FeedbackMessageSummaryObjectFactory.ts');

describe('Feedback message object factory', function() {
  var FeedbackMessageSummaryObjectFactory = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    FeedbackMessageSummaryObjectFactory = $injector.get(
      'FeedbackMessageSummaryObjectFactory');
  }));

  it('should create a new message', function() {
    var feedbackMessageSummary = (
      FeedbackMessageSummaryObjectFactory.createNewMessage(
        0, 'Sample message', 'Test user', 'profile_picture_url'));

    expect(feedbackMessageSummary.messageId).toEqual(0);
    expect(feedbackMessageSummary.text).toEqual('Sample message');
    expect(feedbackMessageSummary.authorUsername).toEqual('Test user');
    expect(feedbackMessageSummary.authorPictureDataUrl).toEqual(
      'profile_picture_url');
  });

  it('should fetch the feedback message domain object from the backend ' +
     'summary dict', function() {
    var messageSummary = {
      messageId: 0,
      text: 'Sample text',
      updatedStatus: null,
      author_username: 'User 1',
      author_picture_data_url: 'sample_picture_url_1',
      created_on: 1000
    };

    var feedbackMessageSummary = (
      FeedbackMessageSummaryObjectFactory.createFromBackendDict(
        messageSummary));

    expect(feedbackMessageSummary.text).toEqual('Sample text');
    expect(feedbackMessageSummary.authorUsername).toEqual('User 1');
    expect(feedbackMessageSummary.authorPictureDataUrl).toEqual(
      'sample_picture_url_1');
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for FeedbackThreadObjectFactory.
 */

require('domain/feedback_thread/FeedbackThreadObjectFactory.ts');

describe('Feedback thread object factory', function() {
  beforeEach(angular.mock.module('oppia'));
  var FeedbackThreadObjectFactory = null;

  beforeEach(angular.mock.inject(function($injector) {
    FeedbackThreadObjectFactory = $injector.get('FeedbackThreadObjectFactory');
  }));

  it('should create a new feedback thread from a backend dict.', function() {
    var feedbackThreadBackendDict = {
      last_updated: 1000,
      original_author_username: 'author',
      status: 'accepted',
      subject: 'sample subject',
      summary: 'sample summary',
      message_count: 10,
      state_name: 'state 1',
      thread_id: 'exp1.thread1'
    };

    var feedbackThread = FeedbackThreadObjectFactory.createFromBackendDict(
      feedbackThreadBackendDict);
    expect(feedbackThread.status).toEqual('accepted');
    expect(feedbackThread.subject).toEqual('sample subject');
    expect(feedbackThread.summary).toEqual('sample summary');
    expect(feedbackThread.originalAuthorName).toEqual('author');
    expect(feedbackThread.lastUpdated).toEqual(1000);
    expect(feedbackThread.messageCount).toEqual(10);
    expect(feedbackThread.stateName).toEqual('state 1');
    expect(feedbackThread.threadId).toEqual('exp1.thread1');
    expect(feedbackThread.isSuggestionThread()).toEqual(false);

    var messages = [{
      text: 'message1'
    }, {
      text: 'message2'
    }];
    feedbackThread.setMessages(messages);
    expect(feedbackThread.messages).toEqual(messages);
  });
});
// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for FeedbackThreadSummaryObjectFactory.
 */

require('domain/feedback_thread/FeedbackThreadSummaryObjectFactory.ts');

describe('Feedback thread object factory', function() {
  var FeedbackThreadSummaryObjectFactory = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    FeedbackThreadSummaryObjectFactory = $injector.get(
      'FeedbackThreadSummaryObjectFactory');
  }));

  it('should update the summary of the thread on addition of a ' +
     ' message', function() {
    var feedbackThreadSummary = FeedbackThreadSummaryObjectFactory.create(
      'open', 'Test user 1', new Date(), 'last message', 2, false, false,
      'Test user 2', 'Test user 2', 'Test exploration name', '0', 'thread_id');

    feedbackThreadSummary.appendNewMessage(
      'Looks good!', 'Test user 3');
    expect(feedbackThreadSummary.authorLastMessage).toEqual('Test user 3');
    expect(feedbackThreadSummary.lastMessageText).toEqual('Looks good!');
    expect(feedbackThreadSummary.totalMessageCount).toEqual(3);
  });

  it('should fetch the feedback thread domain object from the backend ' +
     'summary dict', function() {
    var threadSummary = {
      status: 'open',
      original_author_id: 'Test user 1',
      last_updated: 1000,
      last_message_text: 'last message',
      total_message_count: 2,
      last_message_read: false,
      second_last_message_read: true,
      author_last_message: 'Test user 2',
      author_second_last_message: 'Test user 1',
      exploration_title: 'Sample exploration 1',
      exploration_id: '0',
      thread_id: 'thread_id_1'
    };

    var feedbackThreadSummary = (
      FeedbackThreadSummaryObjectFactory.createFromBackendDict(threadSummary));

    expect(feedbackThreadSummary.explorationTitle).toEqual(
      'Sample exploration 1');
    expect(feedbackThreadSummary.originalAuthorId).toEqual(
      'Test user 1');
    expect(feedbackThreadSummary.lastMessageText).toEqual(
      'last message');
    expect(feedbackThreadSummary.totalMessageCount).toEqual(2);
  });
});
// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for LearnerDashboardActivityIdsObjectFactory.
 */

require('domain/learner_dashboard/LearnerDashboardActivityIdsObjectFactory.ts');

describe('Learner dashboard activity ids object factory', function() {
  var LearnerDashboardActivityIdsObjectFactory = null;
  var learnerDashboardActivityIdsDict = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector) {
    LearnerDashboardActivityIdsObjectFactory = $injector.get(
      'LearnerDashboardActivityIdsObjectFactory');
    learnerDashboardActivityIdsDict = {
      incomplete_exploration_ids: ['0', '1'],
      incomplete_collection_ids: ['2', '3'],
      completed_exploration_ids: ['4', '5'],
      completed_collection_ids: ['6', '7'],
      exploration_playlist_ids: ['8', '9'],
      collection_playlist_ids: ['10', '11']
    };
  }));

  it('should check if activity id is present among learner dashboard ' +
     ' activity ids', function() {
    var learnerDashboardActivityIds = (
      LearnerDashboardActivityIdsObjectFactory.createFromBackendDict(
        learnerDashboardActivityIdsDict));

    expect(learnerDashboardActivityIds.includesActivity('0')).toEqual(true);
    expect(learnerDashboardActivityIds.includesActivity('1')).toEqual(true);
    expect(learnerDashboardActivityIds.includesActivity('8')).toEqual(true);

    expect(learnerDashboardActivityIds.includesActivity('12')).toEqual(false);
    expect(learnerDashboardActivityIds.includesActivity('13')).toEqual(false);
    expect(learnerDashboardActivityIds.includesActivity('14')).toEqual(false);
  });


  it('should add exploration to learner playlist', function() {
    var learnerDashboardActivityIds = (
      LearnerDashboardActivityIdsObjectFactory.createFromBackendDict(
        learnerDashboardActivityIdsDict));

    learnerDashboardActivityIds.addToExplorationLearnerPlaylist('12');
    expect(learnerDashboardActivityIds.explorationPlaylistIds).toEqual(
      ['8', '9', '12']);

    learnerDashboardActivityIds.addToExplorationLearnerPlaylist('13');
    expect(learnerDashboardActivityIds.explorationPlaylistIds).toEqual(
      ['8', '9', '12', '13']);
  });

  it('should add collection to learner playlist', function() {
    var learnerDashboardActivityIds = (
      LearnerDashboardActivityIdsObjectFactory.createFromBackendDict(
        learnerDashboardActivityIdsDict));

    learnerDashboardActivityIds.addToCollectionLearnerPlaylist('12');
    expect(learnerDashboardActivityIds.collectionPlaylistIds).toEqual(
      ['10', '11', '12']);

    learnerDashboardActivityIds.addToCollectionLearnerPlaylist('13');
    expect(learnerDashboardActivityIds.collectionPlaylistIds).toEqual(
      ['10', '11', '12', '13']);
  });

  it('should remove exploration from learner playlist', function() {
    var learnerDashboardActivityIds = (
      LearnerDashboardActivityIdsObjectFactory.createFromBackendDict(
        learnerDashboardActivityIdsDict));

    learnerDashboardActivityIds.removeFromExplorationLearnerPlaylist('9');
    expect(learnerDashboardActivityIds.explorationPlaylistIds).toEqual(
      ['8']);

    learnerDashboardActivityIds.removeFromExplorationLearnerPlaylist('8');
    expect(learnerDashboardActivityIds.explorationPlaylistIds).toEqual([]);
  });

  it('should remove collection from learner playlist', function() {
    var learnerDashboardActivityIds = (
      LearnerDashboardActivityIdsObjectFactory.createFromBackendDict(
        learnerDashboardActivityIdsDict));

    learnerDashboardActivityIds.removeFromCollectionLearnerPlaylist('11');
    expect(learnerDashboardActivityIds.collectionPlaylistIds).toEqual(
      ['10']);

    learnerDashboardActivityIds.removeFromCollectionLearnerPlaylist('10');
    expect(learnerDashboardActivityIds.collectionPlaylistIds).toEqual([]);
  });

  it('should fetch the learner dashboard activity ids domain object from the ' +
     ' backend summary dict', function() {
    var learnerDashboardActivityIdsDict = {
      incomplete_exploration_ids: ['0', '1'],
      incomplete_collection_ids: ['2', '3'],
      completed_exploration_ids: ['4', '5'],
      completed_collection_ids: ['6', '7'],
      exploration_playlist_ids: ['8', '9'],
      collection_playlist_ids: ['10', '11']
    };

    var learnerDashboardActivityIds = (
      LearnerDashboardActivityIdsObjectFactory.createFromBackendDict(
        learnerDashboardActivityIdsDict));

    expect(learnerDashboardActivityIds.incompleteExplorationIds).toEqual(
      ['0', '1']);
    expect(learnerDashboardActivityIds.incompleteCollectionIds).toEqual(
      ['2', '3']);
    expect(learnerDashboardActivityIds.completedExplorationIds).toEqual(
      ['4', '5']);
    expect(learnerDashboardActivityIds.completedCollectionIds).toEqual(
      ['6', '7']);
    expect(learnerDashboardActivityIds.explorationPlaylistIds).toEqual(
      ['8', '9']);
    expect(learnerDashboardActivityIds.collectionPlaylistIds).toEqual(
      ['10', '11']);
  });
});
// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for LearnerDashboardBackendApiService.
 */

require('domain/learner_dashboard/LearnerDashboardBackendApiService.ts');

describe('Learner Dashboard Backend API Service', function() {
  var LearnerDashboardBackendApiService = null;
  var $httpBackend = null;

  var sampleDataResults = {
    username: 'test',
    number_of_unread_threads: 0,
    completed_to_incomplete_collections: [],
    is_admin: false,
    profile_picture_data_url: 'TestURL',
    exploration_playlist: [],
    user_email: 'test@example.com',
    collection_playlist: [],
    is_moderator: false,
    number_of_nonexistent_activities: {
      completed_collections: 0,
      incomplete_collections: 0,
      collection_playlist: 0,
      incomplete_explorations: 0,
      exploration_playlist: 0,
      completed_explorations: 0
    },
    incomplete_collections_list: [],
    thread_summaries: [],
    incomplete_explorations_list: [],
    subscription_list: [],
    completed_explorations_list: [],
    is_super_admin: false,
    completed_collections_list: []
  };

  var LEARNER_DASHBOARD_DATA_URL = '/learnerdashboardhandler/data';
  var ERROR_STATUS_CODE = 500;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(
    angular.mock.module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

  beforeEach(angular.mock.inject(function($injector) {
    LearnerDashboardBackendApiService = $injector.get(
      'LearnerDashboardBackendApiService');
    $httpBackend = $injector.get('$httpBackend');
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully fetch learner dashboard data from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', LEARNER_DASHBOARD_DATA_URL).respond(
        sampleDataResults);
      LearnerDashboardBackendApiService.fetchLearnerDashboardData().then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(jasmine.objectContaining(
        {data: sampleDataResults}));
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it(
    'should use rejection handler if learner dashboard data ' +
    'backend request failed',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', LEARNER_DASHBOARD_DATA_URL).respond(
        ERROR_STATUS_CODE, 'Error loading dashboard data.');
      LearnerDashboardBackendApiService.fetchLearnerDashboardData().then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(jasmine.objectContaining(
        {data: 'Error loading dashboard data.'}));
    });
});
// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for LearnerDashboardIdsBackendApiService.
 */

require('domain/learner_dashboard/LearnerDashboardIdsBackendApiService.ts');
require('domain/utilities/UrlInterpolationService.ts');

describe('Learner Dashboard Backend API Service', function() {
  var LearnerDashboardIdsBackendApiService = null;
  var $httpBackend = null;
  var UrlInterpolationService = null;

  var sampleDataResults = {
    username: 'test',
    profile_picture_data_url: 'TestURL',
    learner_dashboard_activity_ids: {
      completed_exploration_ids: [],
      exploration_playlist_ids: [],
      completed_collection_ids: [],
      incomplete_exploration_ids: [],
      collection_playlist_ids: [],
      incomplete_collection_ids: []
    },
    user_email: 'test@example.com',
    is_admin: false,
    is_super_admin: false,
    is_moderator: false
  };

  var LEARNER_DASHBOARD_IDS_DATA_URL = '/learnerdashboardidshandler/data';
  var ERROR_STATUS_CODE = 500;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(
    angular.mock.module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

  beforeEach(angular.mock.inject(function($injector) {
    LearnerDashboardIdsBackendApiService = $injector.get(
      'LearnerDashboardIdsBackendApiService');
    UrlInterpolationService = $injector.get('UrlInterpolationService');
    $httpBackend = $injector.get('$httpBackend');
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully fetch learner dashboard IDs data from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', LEARNER_DASHBOARD_IDS_DATA_URL).respond(
        sampleDataResults);
      LearnerDashboardIdsBackendApiService.fetchLearnerDashboardIds().then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(jasmine.objectContaining(
        {data: sampleDataResults}));
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it(
    'should use rejection handler if learner dashboard IDs' +
    ' data backend request failed',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', LEARNER_DASHBOARD_IDS_DATA_URL).respond(
        ERROR_STATUS_CODE, 'Error loading dashboard IDs data.');
      LearnerDashboardIdsBackendApiService.fetchLearnerDashboardIds().then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(jasmine.objectContaining(
        {data: 'Error loading dashboard IDs data.'}));
    });
});
// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for LearnerPlaylistService.js.
 */

require('domain/learner_dashboard/LearnerPlaylistService.ts');
require('domain/utilities/UrlInterpolationService.ts');

describe('Learner playlist service factory', function() {
  var LearnerPlaylistService = null;
  var $httpBackend = null;
  var $rootScope = null;
  var activityType = constants.ACTIVITY_TYPE_EXPLORATION;
  var UrlInterpolationService = null;
  var activityId = '1';
  var addToLearnerPlaylistUrl = '';
  var AlertsService = null;
  var spyInfoMessage = null;
  var spySuccessMessage = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(
    angular.mock.module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

  beforeEach(angular.mock.inject(function($injector) {
    $httpBackend = $injector.get('$httpBackend');
    LearnerPlaylistService = $injector.get(
      'LearnerPlaylistService');
    $rootScope = $injector.get('$rootScope');
    UrlInterpolationService = $injector.get('UrlInterpolationService');
    AlertsService = $injector.get('AlertsService');
    spyOn(AlertsService, 'addInfoMessage').and.callThrough();
    spyOn(AlertsService, 'addSuccessMessage').and.callThrough();
  }));

  beforeEach(function() {
    addToLearnerPlaylistUrl = (
      UrlInterpolationService.interpolateUrl(
        '/learnerplaylistactivityhandler/<activityType>/<activityId>', {
          activityType: activityType,
          activityId: activityId
        }));
  });
  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully add playlist to play later list', function() {
    var response = {
      belongs_to_completed_or_incomplete_list: false,
      belongs_to_subscribed_activities: false,
      playlist_limit_exceeded: false
    };
    $httpBackend.expectPOST(addToLearnerPlaylistUrl).respond(
      JSON.stringify(response));
    LearnerPlaylistService.addToLearnerPlaylist(activityId, activityType);

    $httpBackend.flush();
    $rootScope.$digest();
    expect(AlertsService.addSuccessMessage).toHaveBeenCalledWith(
      'Successfully added to your \'Play Later\' list.');
    expect(AlertsService.addInfoMessage).not.toHaveBeenCalled();
  });

  it('should not add playlist to play later list' +
    'and show belongs to completed or incomplete list', function() {
    var response = {
      belongs_to_completed_or_incomplete_list: true,
      belongs_to_subscribed_activities: false,
      playlist_limit_exceeded: false
    };
    $httpBackend.expectPOST(addToLearnerPlaylistUrl).respond(
      JSON.stringify(response));
    LearnerPlaylistService.addToLearnerPlaylist(activityId, activityType);

    $httpBackend.flush();
    $rootScope.$digest();
    expect(AlertsService.addInfoMessage).toHaveBeenCalledWith(
      'You have already completed or are completing this activity.');
    expect(AlertsService.addSuccessMessage).not.toHaveBeenCalled();
  });

  it('should not add playlist to play later list' +
    'and show belongs to subscribed activities', function() {
    var response = {
      belongs_to_completed_or_incomplete_list: false,
      belongs_to_subscribed_activities: true,
      playlist_limit_exceeded: false
    };
    $httpBackend.expectPOST(addToLearnerPlaylistUrl).respond(
      JSON.stringify(response));
    LearnerPlaylistService.addToLearnerPlaylist(activityId, activityType);

    $httpBackend.flush();
    $rootScope.$digest();
    expect(AlertsService.addInfoMessage).toHaveBeenCalledWith(
      'This is present in your creator dashboard');
    expect(AlertsService.addSuccessMessage).not.toHaveBeenCalled();
  });

  it('should not add playlist to play later list' +
    'and show playlist limit exceeded', function() {
    var response = {
      belongs_to_completed_or_incomplete_list: false,
      belongs_to_subscribed_activities: false,
      playlist_limit_exceeded: true
    };
    $httpBackend.expectPOST(addToLearnerPlaylistUrl).respond(
      JSON.stringify(response));
    LearnerPlaylistService.addToLearnerPlaylist(activityId, activityType);

    $httpBackend.flush();
    $rootScope.$digest();
    expect(AlertsService.addInfoMessage).toHaveBeenCalledWith(
      'Your \'Play Later\' list is full!  Either you can ' +
      'complete some or you can head to the learner dashboard ' +
      'and remove some.');
    expect(AlertsService.addSuccessMessage).not.toHaveBeenCalled();
  });
});
// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview unit tests for the fraction object type factory service.
 */

require('domain/objects/FractionObjectFactory.ts');

describe('FractionObjectFactory', function() {
  beforeEach(angular.mock.module('oppia'));

  describe('fraction object factory', function() {
    var errors = null;
    var Fraction = null;

    beforeEach(angular.mock.inject(function($injector) {
      errors = $injector.get('FRACTION_PARSING_ERRORS');
      Fraction = $injector.get('FractionObjectFactory');
    }));

    it('should convert itself to a string in fraction format', function() {
      expect(new Fraction(true, 1, 2, 3).toString()).toBe('-1 2/3');
      expect(new Fraction(false, 1, 2, 3).toString()).toBe('1 2/3');
      expect(new Fraction(true, 0, 2, 3).toString()).toBe('-2/3');
      expect(new Fraction(false, 0, 2, 3).toString()).toBe('2/3');
      expect(new Fraction(true, 1, 0, 3).toString()).toBe('-1');
      expect(new Fraction(false, 1, 0, 3).toString()).toBe('1');
      expect(new Fraction(true, 0, 0, 3).toString()).toBe('0');
      expect(new Fraction(false, 0, 0, 3).toString()).toBe('0');
    });

    it('should return the correct integer part', function() {
      expect(new Fraction(true, 1, 2, 3).getIntegerPart()).toBe(-1);
      expect(new Fraction(false, 1, 2, 3).getIntegerPart()).toBe(1);
      expect(new Fraction(true, 0, 2, 3).getIntegerPart()).toBe(0);
      expect(new Fraction(false, 0, 2, 3).getIntegerPart()).toBe(0);
      expect(new Fraction(true, 1, 0, 3).getIntegerPart()).toBe(-1);
      expect(new Fraction(false, 1, 0, 3).getIntegerPart()).toBe(1);
      expect(new Fraction(true, 0, 0, 3).getIntegerPart()).toBe(0);
      expect(new Fraction(false, 0, 0, 3).getIntegerPart()).toBe(0);
    });

    it('should parse valid strings', function() {
      expect(Fraction.fromRawInputString('10/ 2').toDict()).toEqual(
        new Fraction(false, 0, 10, 2).toDict());
      expect(Fraction.fromRawInputString('10/20').toDict()).toEqual(
        new Fraction(false, 0, 10, 20).toDict());
      expect(Fraction.fromRawInputString('1   1/ 2').toDict()).toEqual(
        new Fraction(false, 1, 1, 2).toDict());
      expect(Fraction.fromRawInputString('- 1 1 /2').toDict()).toEqual(
        new Fraction(true, 1, 1, 2).toDict());
      expect(Fraction.fromRawInputString('1      ').toDict()).toEqual(
        new Fraction(false, 1, 0, 1).toDict());
      expect(Fraction.fromRawInputString('  - 1').toDict()).toEqual(
        new Fraction(true, 1, 0, 1).toDict());
      expect(Fraction.fromRawInputString('1  /  22').toDict()).toEqual(
        new Fraction(false, 0, 1, 22).toDict());
      expect(Fraction.fromRawInputString(' -1 /2').toDict()).toEqual(
        new Fraction(true, 0, 1, 2).toDict());
      expect(Fraction.fromRawInputString('0  1/2').toDict()).toEqual(
        new Fraction(false, 0, 1, 2).toDict());
      expect(Fraction.fromRawInputString('1 0 /2').toDict()).toEqual(
        new Fraction(false, 1, 0, 2).toDict());
    });

    it('should throw errors for invalid fractions', function() {
      // Invalid characters.
      expect(function() {
        Fraction.fromRawInputString('3 \ b');
      }).toThrow(new Error(errors.INVALID_CHARS));
      expect(function() {
        Fraction.fromRawInputString('a 3/5');
      }).toThrow(new Error(errors.INVALID_CHARS));
      expect(function() {
        Fraction.fromRawInputString('5 b/c');
      }).toThrow(new Error(errors.INVALID_CHARS));
      expect(function() {
        Fraction.fromRawInputString('a b/c');
      }).toThrow(new Error(errors.INVALID_CHARS));
      // Invalid format.
      expect(function() {
        Fraction.fromRawInputString('1 / -3');
      }).toThrow(new Error(errors.INVALID_FORMAT));
      expect(function() {
        Fraction.fromRawInputString('-1 -3/2');
      }).toThrow(new Error(errors.INVALID_FORMAT));
      expect(function() {
        Fraction.fromRawInputString('3 -');
      }).toThrow(new Error(errors.INVALID_FORMAT));
      expect(function() {
        Fraction.fromRawInputString('1  1');
      }).toThrow(new Error(errors.INVALID_FORMAT));
      expect(function() {
        Fraction.fromRawInputString('1/3 1/2');
      }).toThrow(new Error(errors.INVALID_FORMAT));
      expect(function() {
        Fraction.fromRawInputString('1 2 3 / 4');
      }).toThrow(new Error(errors.INVALID_FORMAT));
      expect(function() {
        Fraction.fromRawInputString('1 / 2 3');
      }).toThrow(new Error(errors.INVALID_FORMAT));
      expect(function() {
        Fraction.fromRawInputString('- / 3');
      }).toThrow(new Error(errors.INVALID_FORMAT));
      expect(function() {
        Fraction.fromRawInputString('/ 3');
      }).toThrow(new Error(errors.INVALID_FORMAT));
      // Division by zero.
      expect(function() {
        Fraction.fromRawInputString(' 1/0');
      }).toThrow(new Error(errors.DIVISION_BY_ZERO));
      expect(function() {
        Fraction.fromRawInputString('1 2 /0');
      }).toThrow(new Error(errors.DIVISION_BY_ZERO));
    });

    it('should convert to the correct float value', function() {
      expect(Fraction.fromRawInputString('1').toFloat()).toEqual(1);
      expect(Fraction.fromRawInputString('1 0/5').toFloat()).toEqual(1);
      expect(Fraction.fromRawInputString('1 4/5').toFloat()).toEqual(1.8);
      expect(Fraction.fromRawInputString('0 4/5').toFloat()).toEqual(0.8);
      expect(Fraction.fromRawInputString('-10/10').toFloat()).toEqual(-1);
      expect(Fraction.fromRawInputString('0 40/50').toFloat()).toEqual(0.8);
      expect(Fraction.fromRawInputString('0 2/3').toFloat()).toEqual(2 / 3);
      expect(Fraction.fromRawInputString('0 25/5').toFloat()).toEqual(5);
      expect(Fraction.fromRawInputString('4 1/3').toFloat()).toEqual(13 / 3);
    });

    it('should correctly detect nonzero integer part', function() {
      expect(
        Fraction.fromRawInputString('0').hasNonzeroIntegerPart()).toBe(false);
      expect(
        Fraction.fromRawInputString('1').hasNonzeroIntegerPart()).toBe(true);
      expect(
        Fraction.fromRawInputString('1 0/5').hasNonzeroIntegerPart()
      ).toBe(true);
      expect(
        Fraction.fromRawInputString('1 3/5').hasNonzeroIntegerPart()
      ).toBe(true);
      expect(
        Fraction.fromRawInputString('7/5').hasNonzeroIntegerPart()).toBe(false);
      expect(
        Fraction.fromRawInputString('2/5').hasNonzeroIntegerPart()).toBe(false);
    });

    it('should correctly detect improper fractions', function() {
      expect(Fraction.fromRawInputString('0').isImproperFraction()).toBe(false);
      expect(Fraction.fromRawInputString('1').isImproperFraction()).toBe(false);
      expect(
        Fraction.fromRawInputString('1 0/5').isImproperFraction()
      ).toBe(false);
      expect(
        Fraction.fromRawInputString('1 3/5').isImproperFraction()
      ).toBe(false);
      expect(
        Fraction.fromRawInputString('2/5').isImproperFraction()).toBe(false);
      expect(
        Fraction.fromRawInputString('7/5').isImproperFraction()).toBe(true);
      expect(
        Fraction.fromRawInputString('5/5').isImproperFraction()).toBe(true);
    });
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview unit tests for number with units object type factory service.
 */

require('domain/objects/FractionObjectFactory.ts');
require('domain/objects/NumberWithUnitsObjectFactory.ts');
require('domain/objects/UnitsObjectFactory.ts');

describe('NumberWithUnitsObjectFactory', function() {
  beforeEach(angular.mock.module('oppia'));

  describe('number with units object factory', function() {
    var NumberWithUnits = null;
    var Units = null;
    var Fraction = null;
    var errors = null;

    beforeEach(angular.mock.inject(function($injector) {
      NumberWithUnits = $injector.get('NumberWithUnitsObjectFactory');
      Units = $injector.get('UnitsObjectFactory');
      Fraction = $injector.get('FractionObjectFactory');
      errors = $injector.get('NUMBER_WITH_UNITS_PARSING_ERRORS');
    }));

    it('should convert units to list format', function() {
      expect(Units.fromStringToList('kg / kg^2 K mol / (N m s^2) K s')).toEqual(
        [{exponent: -1, unit: 'kg'}, {exponent: 2, unit: 'K'},
          {exponent: 1, unit: 'mol'}, {exponent: -1, unit: 'N'},
          {exponent: -1, unit: 'm'}, {exponent: -1, unit: 's'}]);
      expect(Units.fromStringToList('mol/(kg / (N m / s^2)')).toEqual(
        [{exponent: 1, unit: 'mol'}, {exponent: -1, unit: 'kg'},
          {exponent: 1, unit: 'N'}, {exponent: 1, unit: 'm'},
          {exponent: -2, unit: 's'}]);
      expect(Units.fromStringToList('kg per kg^2 K mol per (N m s^2) K s'
      )).toEqual([{exponent: -1, unit: 'kg'}, {exponent: 2, unit: 'K'},
        {exponent: 1, unit: 'mol'}, {exponent: -1, unit: 'N'},
        {exponent: -1, unit: 'm'}, {exponent: -1, unit: 's'}]);
    });

    it('should convert units from list to string format', function() {
      expect(new Units(
        [{exponent: -1, unit: 'kg'}, {exponent: 2, unit: 'K'},
          {exponent: 1, unit: 'mol'}, {exponent: -1, unit: 'N'},
          {exponent: -1, unit: 'm'}, {exponent: -1, unit: 's'}]
      ).toString()).toBe('kg^-1 K^2 mol N^-1 m^-1 s^-1');
      expect(new Units(
        [{exponent: 1, unit: 'mol'}, {exponent: -1, unit: 'kg'},
          {exponent: 1, unit: 'N'}, {exponent: 1, unit: 'm'},
          {exponent: -2, unit: 's'}]).toString()).toBe(
        'mol kg^-1 N m s^-2');
    });

    it('should convert units from string to lexical format', function() {
      expect(Units.stringToLexical('kg per kg^2 K mol / (N m s^2) K s'
      )).toEqual(
        ['kg', '/', 'kg^2', '*', 'K', '*', 'mol', '/', '(', 'N', '*', 'm', '*',
          's^2', ')', 'K', '*', 's']);
      expect(Units.stringToLexical('kg (K mol) m/s^2 r t / (l/ n) / o'
      )).toEqual(
        ['kg', '(', 'K', '*', 'mol', ')', 'm', '/', 's^2', '*', 'r', '*', 't',
          '/', '(', 'l', '/', 'n', ')', '/', 'o']);
      expect(Units.stringToLexical('mol per (kg per (N m per s^2)*K)'
      )).toEqual(
        ['mol', '/', '(', 'kg', '/', '(', 'N', '*', 'm', '/', 's^2', ')', '*',
          'K', ')']);
    });

    it('should convert number with units object to a string', function() {
      expect(new NumberWithUnits('real', 2.02, new Fraction(false, 0, 0, 1
      ), Units.fromRawInputString('m / s^2')).toString()).toBe('2.02 m s^-2');
      expect(new NumberWithUnits('real', 2.02, new Fraction(false, 0, 0, 1
      ), Units.fromRawInputString('Rs')).toString()).toBe('Rs 2.02');
      expect(new NumberWithUnits('real', 2, new Fraction(false, 0, 0, 1
      ), Units.fromRawInputString('')).toString()).toBe('2');
      expect(new NumberWithUnits('fraction', 0, new Fraction(true, 0, 4, 3
      ), Units.fromRawInputString('m / s^2')).toString()).toBe('-4/3 m s^-2');
      expect(new NumberWithUnits('fraction', 0, new Fraction(
        false, 0, 4, 3), Units.fromRawInputString('$ per hour')).toString(
      )).toBe('$ 4/3 hour^-1');
      expect(new NumberWithUnits('real', 40, new Fraction(
        false, 0, 0, 1), Units.fromRawInputString('Rs per hour')).toString(
      )).toBe('Rs 40 hour^-1');
    });

    it('should parse valid units strings', function() {
      expect(Units.fromRawInputString('kg per (K mol^-2)')).toEqual(
        new Units(Units.fromStringToList('kg / (K mol^-2)')));
      expect(Units.fromRawInputString('kg / (K mol^-2) N / m^2')).toEqual(
        new Units(Units.fromStringToList('kg / (K mol^-2) N / m^2')));
    });

    it('should parse valid number with units strings', function() {
      expect(NumberWithUnits.fromRawInputString('2.02 kg / m^3')).toEqual(
        new NumberWithUnits('real', 2.02, new Fraction(
          false, 0, 0, 1), Units.fromRawInputString('kg / m^3')));
      expect(NumberWithUnits.fromRawInputString('2 / 3 kg / m^3')).toEqual(
        new NumberWithUnits('fraction', 0, new Fraction(
          false, 0, 2, 3), Units.fromRawInputString('kg / m^3')));
      expect(NumberWithUnits.fromRawInputString('2')).toEqual(
        new NumberWithUnits('real', 2, new Fraction(
          false, 0, 0, 1), Units.fromRawInputString('')));
      expect(NumberWithUnits.fromRawInputString('2 / 3')).toEqual(
        new NumberWithUnits('fraction', 0, new Fraction(
          false, 0, 2, 3), Units.fromRawInputString('')));
      expect(NumberWithUnits.fromRawInputString('$ 2.02')).toEqual(
        new NumberWithUnits('real', 2.02, new Fraction(
          false, 0, 0, 1), Units.fromRawInputString('$')));
      expect(NumberWithUnits.fromRawInputString('Rs 2 / 3 per hour')).toEqual(
        new NumberWithUnits('fraction', 0, new Fraction(
          false, 0, 2, 3), Units.fromRawInputString('Rs / hour')));
    });

    it('should throw errors for invalid number with units', function() {
      expect(function() {
        NumberWithUnits.fromRawInputString('3* kg');
      }).toThrow(new Error(errors.INVALID_VALUE));
      expect(function() {
        NumberWithUnits.fromRawInputString('$ 3*');
      }).toThrow(new Error(errors.INVALID_VALUE));
      expect(function() {
        NumberWithUnits.fromRawInputString('Rs 3^');
      }).toThrow(new Error(errors.INVALID_VALUE));
      expect(function() {
        NumberWithUnits.fromRawInputString('3# m/s');
      }).toThrow(new Error(errors.INVALID_VALUE));
      expect(function() {
        NumberWithUnits.fromRawInputString('3 $');
      }).toThrow(new Error(errors.INVALID_CURRENCY_FORMAT));
      expect(function() {
        NumberWithUnits.fromRawInputString('Rs5');
      }).toThrow(new Error(errors.INVALID_CURRENCY));
      expect(function() {
        NumberWithUnits.fromRawInputString('$');
      }).toThrow(new Error(errors.INVALID_CURRENCY));
      expect(function() {
        NumberWithUnits.fromRawInputString('kg 2 s^2');
      }).toThrow(new Error(errors.INVALID_CURRENCY));
      expect(function() {
        NumberWithUnits.fromRawInputString('2 m/s#');
      }).toThrow(new Error(errors.INVALID_UNIT_CHARS));
      expect(function() {
        NumberWithUnits.fromRawInputString('@ 2');
      }).toThrow(new Error(errors.INVALID_CURRENCY));
      expect(function() {
        NumberWithUnits.fromRawInputString('2 / 3 kg&^-2');
      }).toThrow(new Error(errors.INVALID_UNIT_CHARS));
      expect(function() {
        NumberWithUnits.fromRawInputString('2 m**2');
      }).toThrow(new Error('SyntaxError: Unexpected "*" in "m**2" at index 2'));
      expect(function() {
        NumberWithUnits.fromRawInputString('2 kg / m^(2)');
      }).toThrow(new Error('SyntaxError: In "kg / m^(2)", "^" must be ' +
      'followed by a floating-point number'));
    });
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for EditableQuestionBackendApiService.
 */

require('domain/question/EditableQuestionBackendApiService.ts');

describe('Editable question backend API service', function() {
  var EditableQuestionBackendApiService = null;
  var sampleDataResults = null;
  var $rootScope = null;
  var $scope = null;
  var $httpBackend = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module(
    'oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

  beforeEach(angular.mock.inject(function($injector) {
    EditableQuestionBackendApiService = $injector.get(
      'EditableQuestionBackendApiService');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $httpBackend = $injector.get('$httpBackend');

    // Sample question object returnable from the backend
    sampleDataResults = {
      question_dict: {
        id: '0',
        question_state_data: {
          content: {
            html: 'Question 1'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {}
          },
          interaction: {
            answer_groups: [],
            confirmed_unclassified_answers: [],
            customization_args: {},
            default_outcome: {
              dest: null,
              feedback: {
                html: 'Correct Answer'
              },
              param_changes: [],
              labelled_as_correct: true
            },
            hints: [
              {
                hint_content: {
                  html: 'Hint 1'
                }
              }
            ],
            solution: {
              correct_answer: 'This is the correct answer',
              answer_is_exclusive: false,
              explanation: {
                html: 'Solution explanation'
              }
            },
            id: 'TextInput'
          },
          param_changes: [],
          solicit_answer_details: false
        },
        language_code: 'en',
        version: 1
      },
      associated_skill_dicts: []
    };
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully fetch an existing question from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', '/question_editor_handler/data/0').respond(
        sampleDataResults);
      EditableQuestionBackendApiService.fetchQuestion('0').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(
        sampleDataResults);
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it('should use the rejection handler if the backend request failed',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', '/question_editor_handler/data/1').respond(
        500, 'Error loading question 1.');
      EditableQuestionBackendApiService.fetchQuestion('1').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error loading question 1.');
    }
  );

  it('should update a question after fetching it from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      var question = null;

      // Loading a question the first time should fetch it from the backend.
      $httpBackend.expect('GET', '/question_editor_handler/data/0').respond(
        sampleDataResults);

      EditableQuestionBackendApiService.fetchQuestion('0').then(
        function(data) {
          question = data.question_dict;
        });
      $httpBackend.flush();
      question.question_state_data.content.html = 'New Question Content';
      question.version = '2';
      var questionWrapper = {
        question_dict: question
      };

      $httpBackend.expect('PUT', '/question_editor_handler/data/0').respond(
        questionWrapper);

      // Send a request to update question
      EditableQuestionBackendApiService.updateQuestion(
        question.id, question.version, 'Question Data is updated', []
      ).then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(question);
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it('should use the rejection handler if the question to update ' +
     'doesn\'t exist', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    // Loading a question the first time should fetch it from the backend.
    $httpBackend.expect('PUT', '/question_editor_handler/data/1').respond(
      404, 'Question with given id doesn\'t exist.');

    EditableQuestionBackendApiService.updateQuestion(
      '1', '1', 'Update an invalid question.', []
    ).then(successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'Question with given id doesn\'t exist.');
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for PretestQuestionBackendApiService.
 */

require('domain/question/PretestQuestionBackendApiService.ts');

describe('Pretest question backend API service', function() {
  var PretestQuestionBackendApiService = null;
  var sampleDataResults = null;
  var $rootScope = null;
  var $scope = null;
  var $httpBackend = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module(
    'oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

  beforeEach(angular.mock.inject(function($injector) {
    PretestQuestionBackendApiService = $injector.get(
      'PretestQuestionBackendApiService');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $httpBackend = $injector.get('$httpBackend');

    // Sample question object returnable from the backend
    sampleDataResults = {
      pretest_question_dicts: [{
        id: '0',
        question_state_data: {
          content: {
            html: 'Question 1'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {}
          },
          interaction: {
            answer_groups: [],
            confirmed_unclassified_answers: [],
            customization_args: {},
            default_outcome: {
              dest: null,
              feedback: {
                html: 'Correct Answer'
              },
              param_changes: [],
              labelled_as_correct: true
            },
            hints: [
              {
                hint_content: {
                  html: 'Hint 1'
                }
              }
            ],
            solution: {
              correct_answer: 'This is the correct answer',
              answer_is_exclusive: false,
              explanation: {
                html: 'Solution explanation'
              }
            },
            id: 'TextInput'
          },
          param_changes: [],
          solicit_answer_details: false
        },
        language_code: 'en',
        version: 1
      }],
      next_start_cursor: null
    };
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully fetch pretest questions from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect(
        'GET', '/pretest_handler/expId?story_id=storyId&cursor=').respond(
        sampleDataResults);
      PretestQuestionBackendApiService.fetchPretestQuestions(
        'expId', 'storyId').then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(
        sampleDataResults.pretest_question_dicts);
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it('should use the rejection handler if the backend request failed',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect(
        'GET', '/pretest_handler/expId?story_id=storyId&cursor=').respond(
        500, 'Error loading pretest questions.');
      PretestQuestionBackendApiService.fetchPretestQuestions(
        'expId', 'storyId').then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'Error loading pretest questions.');
    }
  );
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for QuestionContentsObjectFactory.
 */

require('domain/question/QuestionObjectFactory.ts');
require('domain/skill/MisconceptionObjectFactory.ts');

describe('Question object factory', function() {
  var QuestionObjectFactory = null;
  var _sampleQuestion = null;
  var _sampleQuestionBackendDict = null;
  var MisconceptionObjectFactory = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(function() {
    angular.mock.module(function($provide) {
      $provide.constant('INTERACTION_SPECS', {
        TextInput: {
          can_have_solution: true
        }
      });
    });
  });

  beforeEach(angular.mock.inject(function($injector) {
    QuestionObjectFactory = $injector.get('QuestionObjectFactory');
    MisconceptionObjectFactory = $injector.get('MisconceptionObjectFactory');

    _sampleQuestionBackendDict = {
      id: 'question_id',
      question_state_data: {
        content: {
          html: 'Question 1',
          content_id: 'content_1'
        },
        interaction: {
          answer_groups: [{
            outcome: {
              dest: 'outcome 1',
              feedback: {
                content_id: 'content_5',
                html: ''
              },
              labelled_as_correct: true,
              param_changes: [],
              refresher_exploration_id: null
            },
            rule_specs: [{
              inputs: {
                x: 10
              },
              rule_type: 'Equals'
            }],
          }],
          confirmed_unclassified_answers: [],
          customization_args: {},
          default_outcome: {
            dest: null,
            feedback: {
              html: 'Correct Answer',
              content_id: 'content_2'
            },
            param_changes: [],
            labelled_as_correct: false
          },
          hints: [
            {
              hint_content: {
                html: 'Hint 1',
                content_id: 'content_3'
              }
            }
          ],
          solution: {
            correct_answer: 'This is the correct answer',
            answer_is_exclusive: false,
            explanation: {
              html: 'Solution explanation',
              content_id: 'content_4'
            }
          },
          id: 'TextInput'
        },
        param_changes: [],
        recorded_voiceovers: {
          voiceovers_mapping: {
            content_1: {},
            content_2: {},
            content_3: {},
            content_4: {},
            content_5: {}
          }
        },
        written_translations: {
          translations_mapping: {
            content_1: {},
            content_2: {},
            content_3: {},
            content_4: {},
            content_5: {}
          }
        },
        solicit_answer_details: false
      },
      language_code: 'en',
      version: 1
    };
    _sampleQuestion = QuestionObjectFactory.createFromBackendDict(
      _sampleQuestionBackendDict);
  }));

  it('should correctly get various fields of the question', function() {
    expect(_sampleQuestion.getId()).toEqual('question_id');
    expect(_sampleQuestion.getLanguageCode()).toEqual('en');
    var stateData = _sampleQuestion.getStateData();
    expect(stateData.name).toEqual('question');
    expect(stateData.content.getHtml()).toEqual('Question 1');
    var interaction = stateData.interaction;
    expect(interaction.id).toEqual('TextInput');
    expect(interaction.hints[0].hintContent.getHtml()).toEqual('Hint 1');
    expect(interaction.solution.explanation.getHtml()).toEqual(
      'Solution explanation');
    expect(interaction.solution.correctAnswer).toEqual(
      'This is the correct answer');
    var defaultOutcome = interaction.defaultOutcome;
    expect(defaultOutcome.labelledAsCorrect).toEqual(false);
    expect(defaultOutcome.feedback.getHtml()).toEqual('Correct Answer');
  });

  it('should correctly get backend dict', function() {
    expect(_sampleQuestion.toBackendDict(true).id).toEqual(null);
    expect(_sampleQuestion.toBackendDict(false).id).toEqual('question_id');
  });

  it('should correctly validate question', function() {
    var interaction = _sampleQuestion.getStateData().interaction;
    var misconception1 = MisconceptionObjectFactory.create(
      'id', 'name', 'notes', 'feedback');
    var misconception2 = MisconceptionObjectFactory.create(
      'id_2', 'name_2', 'notes', 'feedback');
    expect(
      _sampleQuestion.validate([misconception1, misconception2])).toEqual(
      'The following misconceptions should also be caught: name, name_2.' +
      ' Click on (or create) an answer that is neither marked correct nor ' +
      'is a default answer (marked above as [All other answers]) to tag a ' +
      'misconception to that answer group.');

    interaction.answerGroups[0].outcome.labelledAsCorrect = false;
    expect(_sampleQuestion.validate([])).toEqual(
      'At least one answer should be marked correct');

    interaction.solution = null;
    expect(_sampleQuestion.validate([])).toEqual(
      'A solution must be specified');

    interaction.hints = [];
    expect(_sampleQuestion.validate([])).toEqual(
      'At least 1 hint should be specfied');
  });
});
// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for QuestionPlayerBackendApiService.
 */

require('domain/question/QuestionPlayerBackendApiService.ts');

describe('Question Player backend Api service', function() {
  var QuestionPlayerBackendApiService = null;
  var sampleDataResults = null;
  var $httpBackend = null;
  var $rootScope = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(
    angular.mock.module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

  beforeEach(angular.mock.inject(function($injector) {
    QuestionPlayerBackendApiService = $injector.get(
      'QuestionPlayerBackendApiService');
    $httpBackend = $injector.get('$httpBackend');
    $rootScope = $injector.get('$rootScope');

    // Sample question object returnable from the backend
    sampleDataResults = {
      question_dicts: [{
        id: '0',
        question_state_data: {
          content: {
            html: 'Question 1'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {}
          },
          interaction: {
            answer_groups: [],
            confirmed_unclassified_answers: [],
            customization_args: {},
            default_outcome: {
              dest: null,
              feedback: {
                html: 'Correct Answer'
              },
              param_changes: [],
              labelled_as_correct: true
            },
            hints: [{
              hint_content: {
                html: 'Hint 1'
              }
            }],
            solution: {
              correct_answer: 'This is the correct answer',
              answer_is_exclusive: false,
              explanation: {
                html: 'Solution explanation'
              }
            },
            id: 'TextInput'
          },
          param_changes: [],
          solicit_answer_details: false
        },
        language_code: 'en',
        version: 1
      }]
    };
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully fetch questions from the backend', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    $httpBackend.expect(
      'GET', '/question_player_handler?skill_ids=1&question_count=1').respond(
      sampleDataResults);
    QuestionPlayerBackendApiService.fetchQuestions(
      ['1'], 1).then(successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith(
      sampleDataResults.question_dicts);
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should successfully fetch questions from the backend with given cursor',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      var sampleDataResultsWithCursor = sampleDataResults;
      sampleDataResultsWithCursor.next_start_cursor = '1';

      $httpBackend.expect(
        'GET', '/question_player_handler?skill_ids=1&question_count=1').respond(
        sampleDataResultsWithCursor);
      QuestionPlayerBackendApiService.fetchQuestions(
        ['1'], 1).then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(
        sampleDataResultsWithCursor.question_dicts);
      expect(failHandler).not.toHaveBeenCalled();

      $httpBackend.expect(
        'GET', '/question_player_handler?skill_ids=1&question_count=1').respond(
        sampleDataResults);

      // Here we don't want to reset history, thus we pass false
      QuestionPlayerBackendApiService.fetchQuestions(
        ['1'], 1).then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(
        sampleDataResults.question_dicts);
      expect(failHandler).not.toHaveBeenCalled();
    });

  it('should successfully fetch questions with no blank start cursor if ' +
  'resetHistory flag is set as true',
  function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    var sampleDataResultsWithCursor = sampleDataResults;
    sampleDataResultsWithCursor.next_start_cursor = '1';

    $httpBackend.expect(
      'GET', '/question_player_handler?skill_ids=1&question_count=1').respond(
      sampleDataResultsWithCursor);
    QuestionPlayerBackendApiService.fetchQuestions(
      ['1'], 1).then(successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith(
      sampleDataResultsWithCursor.question_dicts);
    expect(failHandler).not.toHaveBeenCalled();

    $httpBackend.expect(
      'GET', '/question_player_handler?skill_ids=1&question_count=1').respond(
      sampleDataResults);

    // Here we want to reset history, thus we pass true
    QuestionPlayerBackendApiService.fetchQuestions(
      ['1'], 1).then(successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith(
      sampleDataResults.question_dicts);
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should use the fail handler if the backend request failed',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect(
        'GET', '/question_player_handler?skill_ids=1&question_count=1').respond(
        500, 'Error loading questions.');
      QuestionPlayerBackendApiService.fetchQuestions(
        ['1'], 1).then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'Error loading questions.');
    }
  );

  it('should use the fail handler if question count is in invalid format',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      QuestionPlayerBackendApiService.fetchQuestions(
        ['1'], 'abc').then(successHandler, failHandler);
      $rootScope.$digest();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Question count has to be a ' +
        'positive integer');
    }
  );

  it('should use the fail handler if question count is negative',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      QuestionPlayerBackendApiService.fetchQuestions(
        ['1'], -1).then(successHandler, failHandler);
      $rootScope.$digest();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Question count has to be a ' +
        'positive integer');
    }
  );

  it('should use the fail handler if question count is not an integer',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      QuestionPlayerBackendApiService.fetchQuestions(
        ['1'], 1.5).then(successHandler, failHandler);
      $rootScope.$digest();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Question count has to be a ' +
        'positive integer');
    }
  );

  it('should use the fail handler if skill ids is not a list',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      QuestionPlayerBackendApiService.fetchQuestions(
        'x', 1).then(successHandler, failHandler);
      $rootScope.$digest();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Skill ids should be a list of' +
      ' strings');
    }
  );

  it('should use the fail handler if skill ids is not a list of strings',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      QuestionPlayerBackendApiService.fetchQuestions(
        [1, 2], 1).then(successHandler, failHandler);
      $rootScope.$digest();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Skill ids should be a list of' +
      ' strings');
    }
  );

  it('should use the fail handler if skill ids is sent as null',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      QuestionPlayerBackendApiService.fetchQuestions(
        null, 1).then(successHandler, failHandler);
      $rootScope.$digest();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Skill ids should be a list of' +
      ' strings');
    }
  );

  it('should use the fail handler if question count is sent as null',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      QuestionPlayerBackendApiService.fetchQuestions(
        ['1'], null).then(successHandler, failHandler);
      $rootScope.$digest();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Question count has to be a ' +
        'positive integer');
    }
  );
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for question update service.
 */

require('App.ts');
require('domain/editor/undo_redo/QuestionUndoRedoService.ts');
require('domain/exploration/SubtitledHtmlObjectFactory.ts');
require('domain/question/QuestionObjectFactory.ts');
require('domain/question/QuestionUpdateService.ts');
require('domain/state/StateObjectFactory.ts');
require(
  'components/question-directives/question-editor/' +
  'question-editor.directive.ts');

describe('Question update service', function() {
  var QuestionUpdateService = null;
  var QuestionObjectFactory = null;
  var QuestionUndoRedoService = null;
  var StateObjectFactory = null;
  var SubtitledHtmlObjectFactory = null;
  var sampleQuestion = null;
  var sampleStateTwo = null;
  var sampleStateDict = null;
  var expectedOutputStateDict = null;
  var expectedOutputState = null;
  var sampleQuestionBackendObject = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    QuestionUpdateService = $injector.get('QuestionUpdateService');
    QuestionObjectFactory = $injector.get('QuestionObjectFactory');
    QuestionUndoRedoService = $injector.get('QuestionUndoRedoService');
    StateObjectFactory = $injector.get('StateObjectFactory');
    SubtitledHtmlObjectFactory = $injector.get('SubtitledHtmlObjectFactory');

    sampleStateDict = {
      name: 'question',
      classifier_model_id: 0,
      content: {
        html: 'old content',
        content_id: 'content'
      },
      param_changes: [],
      interaction: {
        answer_groups: [{
          rule_specs: [{rule_type: 'Contains', inputs: {x: 'hola'}}],
          outcome: {
            dest: 'Me Llamo',
            feedback: {
              content_id: 'feedback_1',
              html: 'buen trabajo!'
            },
            labelled_as_correct: true
          }
        }],
        default_outcome: {
          dest: 'Hola',
          feedback: {
            content_id: 'default_outcome',
            html: 'try again!'
          },
          labelled_as_correct: false
        },
        hints: [],
        id: 'TextInput',
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {}
        }
      },
      solicit_answer_details: false,
      written_translations: {
        translations_mapping: {
          content: {},
          default_outcome: {}
        }
      }
    };

    expectedOutputStateDict = {
      name: 'question',
      classifier_model_id: 0,
      content: {
        html: 'test content',
        content_id: 'content'
      },
      param_changes: [],
      interaction: {
        answer_groups: [{
          rule_specs: [{rule_type: 'Contains', inputs: {x: 'hola'}}],
          outcome: {
            dest: 'Me Llamo',
            feedback: {
              content_id: 'feedback_1',
              html: 'buen trabajo!'
            },
            labelled_as_correct: true
          }
        }],
        default_outcome: {
          dest: 'Hola',
          feedback: {
            content_id: 'default_outcome',
            html: 'try again!'
          },
          labelled_as_correct: false
        },
        hints: [],
        id: 'TextInput',
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {}
        }
      },
      solicit_answer_details: false,
      written_translations: {
        translations_mapping: {
          content: {},
          default_outcome: {}
        }
      }
    };

    expectedOutputState = StateObjectFactory.createFromBackendDict(
      'question', expectedOutputStateDict);

    sampleQuestionBackendObject = {
      id: '0',
      question_state_data: sampleStateDict,
      language_code: 'en',
      version: 1
    };
    sampleQuestion = QuestionObjectFactory.createFromBackendDict(
      sampleQuestionBackendObject);
  }));

  it('should update the language code of the question', function() {
    expect(sampleQuestion.getLanguageCode()).toEqual('en');
    QuestionUpdateService.setQuestionLanguageCode(sampleQuestion, 'zh');
    expect(sampleQuestion.getLanguageCode()).toEqual('zh');
    QuestionUndoRedoService.undoChange(sampleQuestion);
    expect(sampleQuestion.getLanguageCode()).toEqual('en');
  });

  it('should update the state data of the question', function() {
    var oldStateData = angular.copy(sampleQuestion.getStateData());
    var updateFunction = function() {
      var stateData = sampleQuestion.getStateData();
      stateData.content = SubtitledHtmlObjectFactory.createDefault(
        'test content', 'content');
    };
    QuestionUpdateService.setQuestionStateData(
      sampleQuestion, updateFunction);
    expect(sampleQuestion.getStateData()).toEqual(expectedOutputState);
    QuestionUndoRedoService.undoChange(sampleQuestion);
    expect(sampleQuestion.getStateData()).toEqual(oldStateData);
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for SidebarStatusService.
 */

require('domain/sidebar/SidebarStatusService.ts');

describe('SidebarStatusService', function() {
  var SidebarStatusService, $window;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector, _$window_) {
    $window = _$window_;
    $window.innerWidth = 600;
    SidebarStatusService = $injector.get('SidebarStatusService');
  }));

  it('should open the sidebar if its not open', function() {
    SidebarStatusService.openSidebar();
    expect(SidebarStatusService.isSidebarShown()).toBe(true);
  });

  it('should close the sidebar when its open', function() {
    SidebarStatusService.openSidebar();
    SidebarStatusService.closeSidebar();
    expect(SidebarStatusService.isSidebarShown()).toBe(false);
  });

  it('should toggle the sidebar to open and then close', function() {
    SidebarStatusService.toggleSidebar();
    expect(SidebarStatusService.isSidebarShown()).toBe(true);
    SidebarStatusService.toggleSidebar();
    expect(SidebarStatusService.isSidebarShown()).toBe(false);
  });


  it('should falsify pendingSidebarClick on document click', function() {
    SidebarStatusService.openSidebar();
    SidebarStatusService.onDocumentClick();
    expect(SidebarStatusService.isSidebarShown()).toBe(true);
    SidebarStatusService.onDocumentClick();
    expect(SidebarStatusService.isSidebarShown()).toBe(false);
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for ConceptCardBackendApiService.
 */

require('domain/skill/ConceptCardBackendApiService.ts');

describe('Concept card backend API service', function() {
  var ConceptCardBackendApiService = null;
  var $httpBackend = null;
  var sampleResponse = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    ConceptCardBackendApiService = $injector.get(
      'ConceptCardBackendApiService');
    $httpBackend = $injector.get('$httpBackend');

    var conceptCardDict = {
      explanation: 'test explanation',
      worked_examples: ['test worked example 1', 'test worked example 2']
    };

    sampleResponse = {
      concept_card_dict: conceptCardDict
    };
  }));


  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should succesfully fetch a concept card from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', '/concept_card_handler/1').respond(
        sampleResponse);
      ConceptCardBackendApiService.fetchConceptCard('1').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(
        sampleResponse.concept_card_dict);
      expect(failHandler).not.toHaveBeenCalled();
    });

  it('should use the rejection handler if backend request failed',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', '/concept_card_handler/1').respond(
        500, 'Error loading skill 1.');
      ConceptCardBackendApiService.fetchConceptCard('1').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error loading skill 1.');
    });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for ConceptCardObjectFactory.
 */

require('App.ts');
require('domain/exploration/SubtitledHtmlObjectFactory.ts');
require('domain/skill/ConceptCardObjectFactory.ts');

describe('Concept card object factory', function() {
  beforeEach(angular.mock.module('oppia'));

  describe('ConceptCardObjectFactory', function() {
    var ConceptCardObjectFactory;
    var conceptCardDict;
    var SubtitledHtmlObjectFactory;

    beforeEach(angular.mock.inject(function($injector) {
      ConceptCardObjectFactory = $injector.get('ConceptCardObjectFactory');
      SubtitledHtmlObjectFactory = $injector.get('SubtitledHtmlObjectFactory');

      conceptCardDict = {
        explanation: SubtitledHtmlObjectFactory.createDefault(
          'test explanation', 'explanation'),
        worked_examples: [
          SubtitledHtmlObjectFactory.createDefault(
            'worked example 1', 'worked_example_1'),
          SubtitledHtmlObjectFactory.createDefault(
            'worked example 2', 'worked_example_2')
        ]
      };

      conceptCardDict = {
        explanation: {
          html: 'test explanation',
          content_id: 'explanation',
        },
        worked_examples: [
          {
            html: 'worked example 1',
            content_id: 'worked_example_1'
          },
          {
            html: 'worked example 2',
            content_id: 'worked_example_2'
          }
        ],
        content_ids_to_audio_translations: {
          explanation: {},
          worked_example_1: {},
          worked_example_2: {}
        }
      };
    }));

    it('should create a new concept card from a backend dictionary',
      function() {
        var conceptCard =
          ConceptCardObjectFactory.createFromBackendDict(conceptCardDict);
        expect(conceptCard.getExplanation()).toEqual(
          SubtitledHtmlObjectFactory.createDefault(
            'test explanation', 'explanation'));
        expect(conceptCard.getWorkedExamples()).toEqual(
          [SubtitledHtmlObjectFactory.createDefault(
            'worked example 1', 'worked_example_1'),
          SubtitledHtmlObjectFactory.createDefault(
            'worked example 2', 'worked_example_2')]);
      });

    it('should convert to a backend dictionary', function() {
      var conceptCard =
        ConceptCardObjectFactory.createFromBackendDict(conceptCardDict);
      expect(conceptCard.toBackendDict()).toEqual(conceptCardDict);
    });

    it('should create an interstitial concept card', function() {
      var conceptCard =
        ConceptCardObjectFactory.createInterstitialConceptCard();
      expect(conceptCard.getExplanation()).toEqual(
        SubtitledHtmlObjectFactory.createDefault(
          'Loading review material', 'explanation'));
      expect(conceptCard.getWorkedExamples()).toEqual([]);
    });
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for EditableSkillBackendApiService.
 */

require('domain/editor/undo_redo/UndoRedoService.ts');
require('domain/skill/EditableSkillBackendApiService.ts');

describe('Editable skill backend API service', function() {
  var EditableSkillBackendApiService = null;
  var UndoRedoService = null;
  var $httpBackend = null;
  var sampleResponse = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    EditableSkillBackendApiService = $injector.get(
      'EditableSkillBackendApiService');
    UndoRedoService = $injector.get('UndoRedoService');
    $httpBackend = $injector.get('$httpBackend');

    var misconceptionDict1 = {
      id: '2',
      name: 'test name',
      notes: 'test notes',
      feedback: 'test feedback'
    };

    var misconceptionDict2 = {
      id: '4',
      name: 'test name',
      notes: 'test notes',
      feedback: 'test feedback'
    };

    var skillContentsDict = {
      explanation: 'test explanation',
      worked_examples: ['test worked example 1', 'test worked example 2']
    };

    var skillDict = {
      id: '1',
      description: 'test description',
      misconceptions: [misconceptionDict1, misconceptionDict2],
      skill_contents: skillContentsDict,
      language_code: 'en',
      version: 3
    };

    sampleResponse = {
      skill: skillDict
    };
  }));


  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should succesfully fetch an existing skill from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', '/skill_editor_handler/data/1').respond(
        sampleResponse);
      EditableSkillBackendApiService.fetchSkill('1').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(sampleResponse.skill);
      expect(failHandler).not.toHaveBeenCalled();
    });

  it('should use the rejection handler if backend request failed',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', '/skill_editor_handler/data/1').respond(
        500, 'Error loading skill 1.');
      EditableSkillBackendApiService.fetchSkill('1').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error loading skill 1.');
    });

  it('should make a request to update the skill in the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', '/skill_editor_handler/data/1').respond(
        sampleResponse);

      var skillDict = null;
      EditableSkillBackendApiService.fetchSkill('1').then(
        function(data) {
          skillDict = data;
        });
      $httpBackend.flush();

      $httpBackend.expect('PUT', '/skill_editor_handler/data/1')
        .respond({
          skill: skillDict
        });

      EditableSkillBackendApiService.updateSkill(
        skillDict.id, skillDict.version, 'commit message', []
      ).then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(skillDict);
      expect(failHandler).not.toHaveBeenCalled();
    });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for MisconceptionObjectFacfory.
 */

require('domain/skill/MisconceptionObjectFactory.ts');

describe('Misconception object factory', function() {
  beforeEach(angular.mock.module('oppia'));

  describe('MisconceptionObjectFacfory', function() {
    var MisconceptionObjectFactory;
    var misconceptionDict;

    beforeEach(angular.mock.inject(function($injector) {
      MisconceptionObjectFactory = $injector.get('MisconceptionObjectFactory');
      misconceptionDict = {
        id: '1',
        name: 'test name',
        notes: 'test notes',
        feedback: 'test feedback'
      };
    }));

    it('should create a new misconception', function() {
      var misconception =
        MisconceptionObjectFactory.createFromBackendDict(misconceptionDict);
      expect(misconception.getId()).toEqual('1');
      expect(misconception.getName()).toEqual('test name');
      expect(misconception.getNotes()).toEqual('test notes');
      expect(misconception.getFeedback()).toEqual('test feedback');
    });

    it('should convert to a backend dictionary', function() {
      var misconception =
        MisconceptionObjectFactory.createFromBackendDict(misconceptionDict);
      expect(misconception.toBackendDict()).toEqual(misconceptionDict);
    });
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for SkillObjectFactory.
 */

require('App.ts');
require('domain/skill/ConceptCardObjectFactory.ts');
require('domain/skill/MisconceptionObjectFactory.ts');
require('domain/skill/SkillObjectFactory.ts');

describe('Skill object factory', function() {
  beforeEach(angular.mock.module('oppia'));

  describe('SkillObjectFactory', function() {
    var SkillObjectFactory = null;
    var MisconceptionObjectFactory = null;
    var ConceptCardObjectFactory = null;
    var misconceptionDict1 = null;
    var misconceptionDict2 = null;
    var skillContentsDict = null;
    var skillDict = null;

    beforeEach(angular.mock.inject(function($injector) {
      SkillObjectFactory = $injector.get('SkillObjectFactory');
      MisconceptionObjectFactory = $injector.get('MisconceptionObjectFactory');
      ConceptCardObjectFactory = $injector.get('ConceptCardObjectFactory');

      misconceptionDict1 = {
        id: 2,
        name: 'test name',
        notes: 'test notes',
        feedback: 'test feedback'
      };

      misconceptionDict2 = {
        id: 4,
        name: 'test name',
        notes: 'test notes',
        feedback: 'test feedback'
      };

      skillContentsDict = {
        explanation: {
          html: 'test explanation',
          content_id: 'explanation',
        },
        worked_examples: [
          {
            html: 'test worked example 1',
            content_id: 'worked_example_1',
          },
          {
            html: 'test worked example 2',
            content_id: 'worked_example_2'
          }
        ],
        content_ids_to_audio_translations: {
          explanation: {},
          worked_example_1: {},
          worked_example_2: {}
        }
      };

      skillDict = {
        id: '1',
        description: 'test description',
        misconceptions: [misconceptionDict1, misconceptionDict2],
        skill_contents: skillContentsDict,
        language_code: 'en',
        version: 3,
        next_misconception_id: 6,
        superseding_skill_id: '2',
        all_questions_merged: false
      };
    }));

    it('should create a new skill from a backend dictionary', function() {
      var skill = SkillObjectFactory.createFromBackendDict(skillDict);
      expect(skill.getId()).toEqual('1');
      expect(skill.getDescription()).toEqual('test description');
      expect(skill.getMisconceptions()).toEqual(
        [MisconceptionObjectFactory.createFromBackendDict(
          misconceptionDict1),
        MisconceptionObjectFactory.createFromBackendDict(
          misconceptionDict2)]);
      expect(skill.getConceptCard()).toEqual(
        ConceptCardObjectFactory.createFromBackendDict(skillContentsDict));
      expect(skill.getLanguageCode()).toEqual('en');
      expect(skill.getVersion()).toEqual(3);
      expect(skill.getSupersedingSkillId()).toEqual('2');
      expect(skill.getAllQuestionsMerged()).toEqual(false);
    });

    it('should delete a misconception given its id', function() {
      var skill = SkillObjectFactory.createFromBackendDict(skillDict);
      skill.deleteMisconception(2);
      expect(skill.getMisconceptions()).toEqual(
        [MisconceptionObjectFactory.createFromBackendDict(
          misconceptionDict2)]);
    });

    it('should get the correct next misconception id', function() {
      var skill = SkillObjectFactory.createFromBackendDict(skillDict);
      expect(skill.getNextMisconceptionId()).toEqual(6);
      skill.deleteMisconception(4);
      expect(skill.getNextMisconceptionId()).toEqual(6);

      var misconceptionToAdd1 = MisconceptionObjectFactory
        .createFromBackendDict({
          id: skill.getNextMisconceptionId(),
          name: 'test name',
          notes: 'test notes',
          feedback: 'test feedback',
        });

      skill.appendMisconception(misconceptionToAdd1);
      expect(skill.getNextMisconceptionId()).toEqual(7);
      skill.deleteMisconception(6);
      expect(skill.getNextMisconceptionId()).toEqual(7);
    });

    it('should convert to a backend dictionary', function() {
      var skill = SkillObjectFactory.createFromBackendDict(skillDict);
      expect(skill.toBackendDict()).toEqual(skillDict);
    });

    it('should be able to create an interstitial skill', function() {
      var skill = SkillObjectFactory.createInterstitialSkill();
      expect(skill.getId()).toEqual(null);
      expect(skill.getDescription()).toEqual('Skill description loading');
      expect(skill.getMisconceptions()).toEqual([]);
      expect(skill.getConceptCard()).toEqual(
        ConceptCardObjectFactory.createInterstitialConceptCard());
      expect(skill.getLanguageCode()).toEqual('en');
      expect(skill.getVersion()).toEqual(1);
      expect(skill.getSupersedingSkillId()).toEqual(null);
      expect(skill.getAllQuestionsMerged()).toEqual(false);
    });
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for SkillRightsBackendApiService.
 */

require('App.ts');
require('domain/skill/SkillRightsBackendApiService.ts');
require('pages/skill-editor-page/skill-editor-page.controller.ts');

describe('Skill rights backend API service', function() {
  var SkillRightsBackendApiService = null;
  var $rootScope = null;
  var $scope = null;
  var $httpBackend = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    SkillRightsBackendApiService = $injector.get(
      'SkillRightsBackendApiService');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $httpBackend = $injector.get('$httpBackend');
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully set a skill to be public', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    $httpBackend.expect(
      'PUT', '/skill_editor_handler/publish_skill/0').respond(200);
    SkillRightsBackendApiService.setSkillPublic('0', 1).then(
      successHandler, failHandler);
    $httpBackend.flush();
    $rootScope.$digest();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should call the provided fail handler on HTTP failure', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    $httpBackend.expect(
      'PUT', '/skill_editor_handler/publish_skill/0').respond(
      500, 'Error loading skill 0.');
    SkillRightsBackendApiService.setSkillPublic('0', 1).then(
      successHandler, failHandler);
    $httpBackend.flush();
    $rootScope.$digest();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  });

  it('should report a cached skill rights after caching it', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    // The skill should not currently be cached.
    expect(SkillRightsBackendApiService.isCached('0')).toBe(false);
    // Cache a skill.
    SkillRightsBackendApiService.cacheSkillRights('0', {
      skill_id: '0',
      can_edit_skill: true,
      skill_is_private: true,
      creator_id: 'a'
    });

    // It should now be cached.
    expect(SkillRightsBackendApiService.isCached('0')).toBe(true);

    // A new skill should not have been fetched from the backend. Also,
    // the returned skill should match the expected skill object.
    SkillRightsBackendApiService.loadSkillRights('0').then(
      successHandler, failHandler);
    $rootScope.$digest();

    expect(successHandler).toHaveBeenCalledWith({
      skill_id: '0',
      can_edit_skill: true,
      skill_is_private: true,
      creator_id: 'a'
    });
    expect(failHandler).not.toHaveBeenCalled();
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for SkillRightsObjectFactory.
 */

require('domain/skill/SkillRightsObjectFactory.ts');

describe('Skill rights object factory', function() {
  var SkillRightsObjectFactory = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    SkillRightsObjectFactory = $injector.get('SkillRightsObjectFactory');
  }));

  it('should be able to set public', function() {
    var initialSkillRightsBackendObject = {
      skill_id: 0,
      can_edit_skill_description: true,
      creator_id: 0,
      skill_is_private: true
    };

    var skillRights = SkillRightsObjectFactory.createFromBackendDict(
      initialSkillRightsBackendObject);

    expect(skillRights.isPublic()).toBe(false);
    expect(skillRights.isPrivate()).toBe(true);

    skillRights.setPublic();

    expect(skillRights.isPublic()).toBe(true);
    expect(skillRights.isPrivate()).toBe(false);
  });

  it('should create an interstitial skill rights object', function() {
    var interstitialSkillRights =
      SkillRightsObjectFactory.createInterstitialSkillRights();

    expect(interstitialSkillRights.getSkillId()).toEqual(null);
    expect(interstitialSkillRights.getCreatorId()).toEqual(null);
    expect(interstitialSkillRights.isPrivate()).toBe(true);
    expect(interstitialSkillRights.canEditSkillDescription()).toBe(false);
  });

  it('should make a copy from another skill rights object', function() {
    var sampleSkillRightsObject = {
      skill_id: '1',
      can_edit_skill_description: true,
      creator_id: '2',
      skill_is_private: false
    };

    var sampleSkillRights = SkillRightsObjectFactory.createFromBackendDict(
      sampleSkillRightsObject);

    var interstitialSkillRights =
      SkillRightsObjectFactory.createInterstitialSkillRights();

    interstitialSkillRights.copyFromSkillRights(sampleSkillRights);
    expect(interstitialSkillRights.getSkillId()).toEqual('1');
    expect(interstitialSkillRights.getCreatorId()).toEqual('2');
    expect(interstitialSkillRights.canEditSkillDescription()).toBe(true);
    expect(interstitialSkillRights.isPrivate()).toBe(false);
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for SkillSummaryObjectFactory.
 */

require('domain/skill/SkillSummaryObjectFactory.ts');

describe('Skill summary object factory', function() {
  var SkillSummaryObjectFactory = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    SkillSummaryObjectFactory = $injector.get('SkillSummaryObjectFactory');
  }));

  it('should be able to create a skill summary object',
    function() {
      var skillSummary = SkillSummaryObjectFactory.create(
        'skill_1', 'Description 1');
      expect(skillSummary.getId()).toBe('skill_1');
      expect(skillSummary.getDescription()).toBe('Description 1');
    });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for SkillUpdateService.
 */

require('App.ts');
require('domain/editor/undo_redo/UndoRedoService.ts');
require('domain/exploration/SubtitledHtmlObjectFactory.ts');
require('domain/skill/MisconceptionObjectFactory.ts');
require('domain/skill/SkillObjectFactory.ts');
require('domain/skill/SkillUpdateService.ts');

describe('Skill update service', function() {
  var SkillUpdateService,
    SubtitledHtmlObjectFactory,
    SkillObjectFactory,
    MisconceptionObjectFactory,
    UndoRedoService;
  var skillDict;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    SkillUpdateService = $injector.get('SkillUpdateService');
    SkillObjectFactory = $injector.get('SkillObjectFactory');
    SubtitledHtmlObjectFactory = $injector.get('SubtitledHtmlObjectFactory');
    MisconceptionObjectFactory = $injector.get('MisconceptionObjectFactory');
    UndoRedoService = $injector.get('UndoRedoService');

    var misconceptionDict1 = {
      id: '2',
      name: 'test name',
      notes: 'test notes',
      feedback: 'test feedback'
    };

    var misconceptionDict2 = {
      id: '4',
      name: 'test name',
      notes: 'test notes',
      feedback: 'test feedback'
    };

    var skillContentsDict = {
      explanation: {
        html: 'test explanation',
        content_id: 'explanation',
      },
      worked_examples: [
        {
          html: 'test worked example 1',
          content_id: 'worked_example_1',
        },
        {
          html: 'test worked example 2',
          content_id: 'worked_example_2'
        }
      ],
      content_ids_to_audio_translations: {
        explanation: {},
        worked_example_1: {},
        worked_example_2: {}
      }
    };

    skillDict = {
      id: '1',
      description: 'test description',
      misconceptions: [misconceptionDict1, misconceptionDict2],
      skill_contents: skillContentsDict,
      language_code: 'en',
      version: 3
    };
  }));

  it('should set/unset the skill description', function() {
    var skill = SkillObjectFactory.createFromBackendDict(skillDict);
    SkillUpdateService.setSkillDescription(skill, 'new description');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_skill_property',
      property_name: 'description',
      old_value: 'test description',
      new_value: 'new description'
    }]);
    expect(skill.getDescription()).toEqual('new description');
    UndoRedoService.undoChange(skill);
    expect(skill.getDescription()).toEqual('test description');
  });

  it('should set/unset the concept card explanation', function() {
    var skill = SkillObjectFactory.createFromBackendDict(skillDict);
    SkillUpdateService.setConceptCardExplanation(
      skill, SubtitledHtmlObjectFactory.createDefault(
        'new explanation', 'explanation'));
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_skill_contents_property',
      property_name: 'explanation',
      old_value: {
        html: 'test explanation',
        content_id: 'explanation'
      },
      new_value: {
        html: 'new explanation',
        content_id: 'explanation'
      }
    }]);
    expect(skill.getConceptCard().getExplanation()).toEqual(
      SubtitledHtmlObjectFactory.createDefault(
        'new explanation', 'explanation'));
    UndoRedoService.undoChange(skill);
    expect(skill.getConceptCard().getExplanation()).toEqual(
      SubtitledHtmlObjectFactory.createDefault(
        'test explanation', 'explanation'));
  });

  it('should add a misconception', function() {
    var skill = SkillObjectFactory.createFromBackendDict(skillDict);
    var aNewMisconceptionDict = {
      id: '7',
      name: 'test name 3',
      notes: 'test notes 3',
      feedback: 'test feedback 3'
    };
    var aNewMisconception =
      MisconceptionObjectFactory.createFromBackendDict(aNewMisconceptionDict);
    SkillUpdateService.addMisconception(skill, aNewMisconception);
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'add_skill_misconception',
      new_misconception_dict: aNewMisconceptionDict
    }]);
    expect(skill.getMisconceptions().length).toEqual(3);
    UndoRedoService.undoChange(skill);
    expect(skill.getMisconceptions().length).toEqual(2);
  });

  it('should delete a misconception', function() {
    var skill = SkillObjectFactory.createFromBackendDict(skillDict);
    SkillUpdateService.deleteMisconception(skill, '2');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'delete_skill_misconception',
      misconception_id: '2'
    }]);
    expect(skill.getMisconceptions().length).toEqual(1);
    UndoRedoService.undoChange(skill);
    expect(skill.getMisconceptions().length).toEqual(2);
  });

  it('should update the name of a misconception', function() {
    var skill = SkillObjectFactory.createFromBackendDict(skillDict);
    SkillUpdateService.updateMisconceptionName(
      skill, '2', skill.findMisconceptionById('2').getName(), 'new name');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_skill_misconceptions_property',
      property_name: 'name',
      old_value: 'test name',
      new_value: 'new name',
      misconception_id: '2'
    }]);
    expect(skill.findMisconceptionById('2').getName()).toEqual('new name');
    UndoRedoService.undoChange(skill);
    expect(skill.findMisconceptionById('2').getName()).toEqual('test name');
  });

  it('should update the notes of a misconception', function() {
    var skill = SkillObjectFactory.createFromBackendDict(skillDict);
    SkillUpdateService.updateMisconceptionNotes(
      skill, '2', skill.findMisconceptionById('2').getNotes(), 'new notes');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_skill_misconceptions_property',
      property_name: 'notes',
      old_value: 'test notes',
      new_value: 'new notes',
      misconception_id: '2'
    }]);
    expect(skill.findMisconceptionById('2').getNotes()).toEqual('new notes');
    UndoRedoService.undoChange(skill);
    expect(skill.findMisconceptionById('2').getNotes()).toEqual('test notes');
  });

  it('should update the feedback of a misconception', function() {
    var skill = SkillObjectFactory.createFromBackendDict(skillDict);
    SkillUpdateService.updateMisconceptionFeedback(
      skill,
      '2',
      skill.findMisconceptionById('2').getFeedback(),
      'new feedback');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_skill_misconceptions_property',
      property_name: 'feedback',
      old_value: 'test feedback',
      new_value: 'new feedback',
      misconception_id: '2'
    }]);
    expect(skill.findMisconceptionById('2').getFeedback())
      .toEqual('new feedback');
    UndoRedoService.undoChange(skill);
    expect(skill.findMisconceptionById('2').getFeedback())
      .toEqual('test feedback');
  });

  it('should add a worked example', function() {
    var skill = SkillObjectFactory.createFromBackendDict(skillDict);
    SkillUpdateService.addWorkedExample(skill,
      SubtitledHtmlObjectFactory.createDefault(
        'a new worked example', 'worked_example_3'));
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_skill_contents_property',
      property_name: 'worked_examples',
      old_value: [
        {
          html: 'test worked example 1',
          content_id: 'worked_example_1',
        },
        {
          html: 'test worked example 2',
          content_id: 'worked_example_2'
        }],
      new_value: [
        {
          html: 'test worked example 1',
          content_id: 'worked_example_1',
        },
        {
          html: 'test worked example 2',
          content_id: 'worked_example_2'
        },
        {
          html: 'a new worked example',
          content_id: 'worked_example_3'
        }]
    }]);
    expect(skill.getConceptCard().getWorkedExamples()).toEqual([
      SubtitledHtmlObjectFactory.createDefault(
        'test worked example 1', 'worked_example_1'),
      SubtitledHtmlObjectFactory.createDefault(
        'test worked example 2', 'worked_example_2'),
      SubtitledHtmlObjectFactory.createDefault(
        'a new worked example', 'worked_example_3')]);
    UndoRedoService.undoChange(skill);
    expect(skill.getConceptCard().getWorkedExamples()).toEqual([
      SubtitledHtmlObjectFactory.createDefault(
        'test worked example 1', 'worked_example_1'),
      SubtitledHtmlObjectFactory.createDefault(
        'test worked example 2', 'worked_example_2')]);
  });

  it('shoud delete a worked example', function() {
    var skill = SkillObjectFactory.createFromBackendDict(skillDict);
    SkillUpdateService.deleteWorkedExample(skill, 0);
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_skill_contents_property',
      property_name: 'worked_examples',
      old_value: [
        {
          html: 'test worked example 1',
          content_id: 'worked_example_1',
        },
        {
          html: 'test worked example 2',
          content_id: 'worked_example_2'
        }
      ],
      new_value: [
        {
          html: 'test worked example 2',
          content_id: 'worked_example_2'
        }
      ]
    }]);
    expect(skill.getConceptCard().getWorkedExamples()).toEqual([
      SubtitledHtmlObjectFactory.createDefault(
        'test worked example 2', 'worked_example_2')]);
    UndoRedoService.undoChange(skill);
    expect(skill.getConceptCard().getWorkedExamples()).toEqual([
      SubtitledHtmlObjectFactory.createDefault(
        'test worked example 1', 'worked_example_1'),
      SubtitledHtmlObjectFactory.createDefault(
        'test worked example 2', 'worked_example_2')]);
  });

  it('should update a worked example', function() {
    var skill = SkillObjectFactory.createFromBackendDict(skillDict);
    SkillUpdateService.updateWorkedExample(skill, 0, 'new content');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_skill_contents_property',
      property_name: 'worked_examples',
      old_value: [
        {
          html: 'test worked example 1',
          content_id: 'worked_example_1',
        },
        {
          html: 'test worked example 2',
          content_id: 'worked_example_2'
        }],
      new_value: [
        {
          html: 'new content',
          content_id: 'worked_example_1',
        },
        {
          html: 'test worked example 2',
          content_id: 'worked_example_2'
        }]
    }]);
    expect(skill.getConceptCard().getWorkedExamples()).toEqual([
      SubtitledHtmlObjectFactory.createDefault(
        'new content', 'worked_example_1'),
      SubtitledHtmlObjectFactory.createDefault(
        'test worked example 2', 'worked_example_2')]);
    UndoRedoService.undoChange(skill);
    expect(skill.getConceptCard().getWorkedExamples()).toEqual([
      SubtitledHtmlObjectFactory.createDefault(
        'test worked example 1', 'worked_example_1'),
      SubtitledHtmlObjectFactory.createDefault(
        'test worked example 2', 'worked_example_2')]);
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for StateCardObjectFactory.
 */

require('domain/exploration/AudioTranslationObjectFactory.ts');
require('domain/exploration/ContentIdsToAudioTranslationsObjectFactory.ts');
require('domain/exploration/InteractionObjectFactory.ts');
require('domain/exploration/RecordedVoiceoversObjectFactory.ts');
require('domain/exploration/VoiceoverObjectFactory.ts');
require('domain/state_card/StateCardObjectFactory.ts');
require(
  'components/question-directives/question-editor/' +
  'question-editor.directive.ts');

describe('State card object factory', function() {
  var StateCardObjectFactory = null;
  var InteractionObjectFactory = null;
  var RecordedVoiceovers = null;
  var RecordedVoiceoversObjectFactory = null;
  var VoiceoverObjectFactory = null;
  var _sampleCard = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    StateCardObjectFactory = $injector.get('StateCardObjectFactory');
    InteractionObjectFactory = $injector.get('InteractionObjectFactory');
    RecordedVoiceoversObjectFactory = (
      $injector.get('RecordedVoiceoversObjectFactory'));
    VoiceoverObjectFactory =
      $injector.get('VoiceoverObjectFactory');

    var interactionDict = {
      answer_groups: [],
      confirmed_unclassified_answers: [],
      customization_args: {
        rows: {
          value: 1
        },
        placeholder: {
          value: 'Type your answer here.'
        }
      },
      default_outcome: {
        dest: '(untitled state)',
        feedback: {
          content_id: 'default_outcome',
          html: ''
        },
        param_changes: []
      },
      hints: [],
      id: 'TextInput'
    };
    _sampleCard = StateCardObjectFactory.createNewCard(
      'State 1', '<p>Content</p>', '<interaction></interaction>',
      InteractionObjectFactory.createFromBackendDict(interactionDict),
      RecordedVoiceoversObjectFactory.createFromBackendDict({
        voiceovers_mapping: {
          content: {
            en: {
              filename: 'filename1.mp3',
              file_size_bytes: 100000,
              needs_update: false
            },
            hi: {
              filename: 'filename2.mp3',
              file_size_bytes: 11000,
              needs_update: false
            }
          }
        }
      }),
      'content');
  }));

  it('should be able to get the various fields', function() {
    expect(_sampleCard.getStateName()).toEqual('State 1');
    expect(_sampleCard.getContentHtml()).toEqual('<p>Content</p>');
    expect(_sampleCard.getInteraction().id).toEqual('TextInput');
    expect(_sampleCard.getInteractionHtml()).toEqual(
      '<interaction></interaction>');
    expect(_sampleCard.getInputResponsePairs()).toEqual([]);
    expect(_sampleCard.getLastInputResponsePair()).toEqual(null);
    expect(_sampleCard.getLastOppiaResponse()).toEqual(null);
    expect(_sampleCard.getRecordedVoiceovers().getBindableVoiceovers(
      'content')).toEqual({
      en: VoiceoverObjectFactory.createFromBackendDict({
        filename: 'filename1.mp3',
        file_size_bytes: 100000,
        needs_update: false
      }),
      hi: VoiceoverObjectFactory.createFromBackendDict({
        filename: 'filename2.mp3',
        file_size_bytes: 11000,
        needs_update: false
      })
    });
    expect(_sampleCard.getVoiceovers()).toEqual({
      en: VoiceoverObjectFactory.createFromBackendDict({
        filename: 'filename1.mp3',
        file_size_bytes: 100000,
        needs_update: false
      }),
      hi: VoiceoverObjectFactory.createFromBackendDict({
        filename: 'filename2.mp3',
        file_size_bytes: 11000,
        needs_update: false
      })
    });

    expect(_sampleCard.getInteractionId()).toEqual('TextInput');
    expect(_sampleCard.isTerminal()).toEqual(false);
    expect(_sampleCard.isInteractionInline()).toEqual(true);
    expect(_sampleCard.getInteractionInstructions()).toEqual(null);
    expect(_sampleCard.getInteractionCustomizationArgs()).toEqual({
      rows: {
        value: 1
      },
      placeholder: {
        value: 'Type your answer here.'
      }
    });
    expect(_sampleCard.getInteractionHtml()).toEqual(
      '<interaction></interaction>'
    );

    _sampleCard.addInputResponsePair({
      oppiaResponse: 'response'
    });

    expect(_sampleCard.getOppiaResponse(0)).toEqual('response');
    expect(_sampleCard.getLastOppiaResponse()).toEqual('response');
    expect(_sampleCard.getLastInputResponsePair()).toEqual({
      oppiaResponse: 'response'
    });
  });

  it('should add input response pair', function() {
    _sampleCard.addInputResponsePair('pair 1');
    expect(_sampleCard.getInputResponsePairs()).toEqual(['pair 1']);
  });

  it('should add not add response if input response pair is empty', function() {
    _sampleCard._inputResponsePairs = [];
    _sampleCard.setLastOppiaResponse('response');
    expect(_sampleCard.getInputResponsePairs()).toEqual([]);
  });

  it('should be able to set the various fields', function() {
    _sampleCard.setInteractionHtml('<interaction_2></interaction_2>');
    expect(_sampleCard.getInteractionHtml()).toEqual(
      '<interaction_2></interaction_2>');

    _sampleCard.addInputResponsePair({
      oppiaResponse: 'response'
    });

    _sampleCard.setLastOppiaResponse('response_3');
    expect(_sampleCard.getLastOppiaResponse()).toEqual('response_3');
  });
});
// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the ImprovementActionButtonObjectFactory.
 */

require('domain/statistics/ImprovementActionButtonObjectFactory.ts');

describe('ImprovementActionButtonObjectFactory', function() {
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector) {
    this.ImprovementActionButtonObjectFactory =
      $injector.get('ImprovementActionButtonObjectFactory');
  }));

  describe('.createNew', function() {
    it('stores the name and action', function() {
      var flagToSetOnCallback = false;
      var improvementAction =
        this.ImprovementActionButtonObjectFactory.createNew('Test', function() {
          flagToSetOnCallback = true;
        }, 'btn-success');

      expect(improvementAction.getText()).toEqual('Test');
      expect(improvementAction.getCssClass()).toEqual('btn-success');
      expect(flagToSetOnCallback).toBe(false);
      improvementAction.execute();
      expect(flagToSetOnCallback).toBe(true);
    });

    it('uses btn-default as class by default', function() {
      var improvementAction =
        this.ImprovementActionButtonObjectFactory.createNew('Test', function() {
        });

      expect(improvementAction.getCssClass()).toEqual('btn-default');
    });
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the LearnerActionObjectFactory.
 */

require('domain/statistics/LearnerActionObjectFactory.ts');

describe('Learner Action Object Factory', function() {
  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    this.LearnerActionObjectFactory =
        $injector.get('LearnerActionObjectFactory');
    this.LEARNER_ACTION_SCHEMA_LATEST_VERSION =
      $injector.get('LEARNER_ACTION_SCHEMA_LATEST_VERSION');
  }));

  it('should create a new learner action', function() {
    var learnerActionObject =
        this.LearnerActionObjectFactory.createNew('AnswerSubmit', {});

    expect(learnerActionObject.actionType).toEqual('AnswerSubmit');
    expect(learnerActionObject.actionCustomizationArgs).toEqual({});
    expect(learnerActionObject.schemaVersion)
      .toEqual(this.LEARNER_ACTION_SCHEMA_LATEST_VERSION);
  });

  it('should throw if the schema version is not a positive int', function() {
    var LearnerActionObjectFactoryLocalReference =
        this.LearnerActionObjectFactory;

    expect(function() {
      return LearnerActionObjectFactoryLocalReference.createNew(
        'AnswerSubmit', {}, -1);
    }).toThrow(new Error('given invalid schema version'));
  });

  it('should use a specific schema version if provided', function() {
    var learnerActionObject =
        this.LearnerActionObjectFactory.createNew('AnswerSubmit', {}, 99);

    expect(learnerActionObject.schemaVersion).toEqual(99);
  });

  it('should create a new learner action from a backend dict', function() {
    var learnerActionObject =
        this.LearnerActionObjectFactory.createFromBackendDict({
          action_type: 'AnswerSubmit',
          action_customization_args: {},
          schema_version: 1
        });

    expect(learnerActionObject.actionType).toEqual('AnswerSubmit');
    expect(learnerActionObject.actionCustomizationArgs).toEqual({});
    expect(learnerActionObject.schemaVersion).toEqual(1);
  });

  it('should convert a learner action to a backend dict', function() {
    var learnerActionObject =
        this.LearnerActionObjectFactory.createNew('AnswerSubmit', {}, 1);

    var learnerActionDict = learnerActionObject.toBackendDict();
    expect(learnerActionDict).toEqual({
      action_type: 'AnswerSubmit',
      action_customization_args: {},
      schema_version: 1
    });
  });
});
// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the PlaythroughImprovementCardObjectFactory.
 */

require('domain/statistics/PlaythroughImprovementCardObjectFactory.ts');
require('domain/statistics/PlaythroughIssueObjectFactory.ts');

describe('PlaythroughImprovementCardObjectFactory', function() {
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector) {
    this.PlaythroughImprovementCardObjectFactory =
      $injector.get('PlaythroughImprovementCardObjectFactory');
    this.PlaythroughIssueObjectFactory =
      $injector.get('PlaythroughIssueObjectFactory');
    this.PLAYTHROUGH_IMPROVEMENT_CARD_TYPE =
      $injector.get('PLAYTHROUGH_IMPROVEMENT_CARD_TYPE');

    var expId = '7';
    var expVersion = 1;
    this.PlaythroughIssuesService = $injector.get('PlaythroughIssuesService');
    this.PlaythroughIssuesService.initSession(expId, expVersion);
  }));

  describe('.createNew', function() {
    it('retrieves data from passed issue', function() {
      var issue = this.PlaythroughIssueObjectFactory.createFromBackendDict({
        issue_type: 'EarlyQuit',
        issue_customization_args: {
          state_name: {value: 'Hola'},
          time_spent_in_exp_in_msecs: {value: 5000},
        },
        playthrough_ids: ['1', '2'],
        schema_version: 1,
        is_valid: true,
      });

      var card = this.PlaythroughImprovementCardObjectFactory.createNew(issue);

      expect(card.getTitle()).toEqual(
        this.PlaythroughIssuesService.renderIssueStatement(issue));
      expect(card.getDirectiveData()).toEqual({
        suggestions:
          this.PlaythroughIssuesService.renderIssueSuggestions(issue),
        playthroughIds: ['1', '2'],
      });
      expect(card.getDirectiveType()).toEqual(
        this.PLAYTHROUGH_IMPROVEMENT_CARD_TYPE);
    });
  });

  describe('.fetchCards', function() {
    it('returns a card for each existing issue', function(done) {
      var earlyQuitIssue =
        this.PlaythroughIssueObjectFactory.createFromBackendDict({
          issue_type: 'EarlyQuit',
          issue_customization_args: {
            state_name: {value: 'Hola'},
            time_spent_in_exp_in_msecs: {value: 5000},
          },
          playthrough_ids: [],
          schema_version: 1,
          is_valid: true,
        });
      var earlyQuitCardTitle =
        this.PlaythroughIssuesService.renderIssueStatement(earlyQuitIssue);

      var multipleIncorrectSubmissionsIssue =
        this.PlaythroughIssueObjectFactory.createFromBackendDict({
          issue_type: 'MultipleIncorrectSubmissions',
          issue_customization_args: {
            state_name: {value: 'Hola'},
            num_times_answered_incorrectly: {value: 4},
          },
          playthrough_ids: [],
          schema_version: 1,
          is_valid: true,
        });
      var multipleIncorrectSubmissionsCardTitle =
        this.PlaythroughIssuesService.renderIssueStatement(
          multipleIncorrectSubmissionsIssue);

      var cyclicTransitionsIssue =
        this.PlaythroughIssueObjectFactory.createFromBackendDict({
          issue_type: 'CyclicTransitions',
          issue_customization_args: {
            state_names: {value: ['Hola', 'Me Llamo', 'Hola']},
          },
          playthrough_ids: [],
          schema_version: 1,
          is_valid: true,
        });
      var cyclicTransitionsCardTitle =
        this.PlaythroughIssuesService.renderIssueStatement(
          cyclicTransitionsIssue);

      spyOn(this.PlaythroughIssuesService, 'getIssues').and.returnValue(
        Promise.resolve([
          earlyQuitIssue,
          multipleIncorrectSubmissionsIssue,
          cyclicTransitionsIssue,
        ]));

      this.PlaythroughImprovementCardObjectFactory.fetchCards()
        .then(function(cards) {
          expect(cards.length).toEqual(3);
          expect(cards[0].getTitle()).toEqual(earlyQuitCardTitle);
          expect(cards[1].getTitle())
            .toEqual(multipleIncorrectSubmissionsCardTitle);
          expect(cards[2].getTitle()).toEqual(cyclicTransitionsCardTitle);
        }).then(done, done.fail);
    });
  });

  describe('PlaythroughImprovementCard', function() {
    beforeEach(function() {
      this.issue = this.PlaythroughIssueObjectFactory.createFromBackendDict({
        issue_type: 'EarlyQuit',
        issue_customization_args: {
          state_name: {value: 'Hola'},
          time_spent_in_exp_in_msecs: {value: 5000},
        },
        playthrough_ids: [],
        schema_version: 1,
        is_valid: true,
      });
      this.card =
        this.PlaythroughImprovementCardObjectFactory.createNew(this.issue);
    });

    describe('.getActionButtons', function() {
      it('contains a specific sequence of buttons', function() {
        expect(this.card.getActionButtons().length).toEqual(1);
        expect(this.card.getActionButtons()[0].getText()).toEqual('Discard');
      });
    });

    describe('Discard Action Button', function() {
      beforeEach(angular.mock.inject(function($injector) {
        this.$uibModal = $injector.get('$uibModal');
      }));

      it('marks the card as resolved after confirmation', function(done) {
        var card = this.card;
        var issue = this.issue;
        var discardActionButton = card.getActionButtons()[0];
        var resolveIssueSpy =
          spyOn(this.PlaythroughIssuesService, 'resolveIssue').and.stub();

        spyOn(this.$uibModal, 'open').and.returnValue({
          result: Promise.resolve(), // Returned when confirm button is pressed.
        });

        expect(card.isOpen()).toBe(true);
        discardActionButton.execute().then(function() {
          expect(resolveIssueSpy).toHaveBeenCalledWith(issue);
          expect(card.isOpen()).toBe(false);
          done();
        }, function() {
          done.fail('dismiss button unexpectedly failed.');
        });
      });

      it('keeps the card after cancel', function(done) {
        var card = this.card;
        var issue = this.issue;
        var discardActionButton = card.getActionButtons()[0];
        var resolveIssueSpy =
          spyOn(this.PlaythroughIssuesService, 'resolveIssue').and.stub();

        spyOn(this.$uibModal, 'open').and.returnValue({
          result: Promise.reject(), // Returned when cancel button is pressed.
        });

        expect(card.isOpen()).toBe(true);
        discardActionButton.execute().then(function() {
          done.fail('dismiss button unexpectedly succeeded.');
        }, function() {
          expect(resolveIssueSpy).not.toHaveBeenCalled();
          expect(card.isOpen()).toBe(true);
          done();
        });
      });
    });
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the PlaythroughIssueObjectFactory.
 */

require('domain/statistics/PlaythroughIssueObjectFactory.ts');

describe('Playthrough Issue Object Factory', function() {
  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    this.piof = $injector.get('PlaythroughIssueObjectFactory');
  }));

  it('should create a new exploration issue', function() {
    var explorationIssueObject = new this.piof('EarlyQuit', {}, [], 1, true);

    expect(explorationIssueObject.issueType).toEqual('EarlyQuit');
    expect(explorationIssueObject.issueCustomizationArgs).toEqual({});
    expect(explorationIssueObject.playthroughIds).toEqual([]);
    expect(explorationIssueObject.schemaVersion).toEqual(1);
    expect(explorationIssueObject.isValid).toEqual(true);
  });

  it('should create a new exploration issue from a backend dict', function() {
    var explorationIssueObject = this.piof.createFromBackendDict({
      issue_type: 'EarlyQuit',
      issue_customization_args: {},
      playthrough_ids: [],
      schema_version: 1,
      is_valid: true
    });

    expect(explorationIssueObject.issueType).toEqual('EarlyQuit');
    expect(explorationIssueObject.issueCustomizationArgs).toEqual({});
    expect(explorationIssueObject.playthroughIds).toEqual([]);
    expect(explorationIssueObject.schemaVersion).toEqual(1);
    expect(explorationIssueObject.isValid).toEqual(true);
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the PlaythroughObjectFactory.
 */

require('domain/statistics/LearnerActionObjectFactory.ts');
require('domain/statistics/PlaythroughObjectFactory.ts');

describe('Playthrough Object Factory', function() {
  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    this.pof = $injector.get('PlaythroughObjectFactory');
    this.laof = $injector.get('LearnerActionObjectFactory');
  }));

  it('should create a new playthrough', function() {
    var actions = [this.laof.createNew('AnswerSubmit', {}, 1)];
    var playthroughObject = this.pof.createNew(
      'playthroughId1', 'expId1', 1, 'EarlyQuit', {}, actions);

    expect(playthroughObject.playthroughId).toEqual('playthroughId1');
    expect(playthroughObject.expId).toEqual('expId1');
    expect(playthroughObject.expVersion).toEqual(1);
    expect(playthroughObject.issueType).toEqual('EarlyQuit');
    expect(playthroughObject.issueCustomizationArgs).toEqual({});
    expect(playthroughObject.actions).toEqual(actions);
  });

  it('should create a new playthrough from a backend dict', function() {
    var playthroughObject = this.pof.createFromBackendDict(
      {
        playthrough_id: 'playthroughId1',
        exp_id: 'expId1',
        exp_version: 1,
        issue_type: 'EarlyQuit',
        issue_customization_args: {},
        actions: [{
          action_type: 'AnswerSubmit',
          action_customization_args: {},
          schema_version: 1
        }]
      }
    );

    expect(playthroughObject.playthroughId).toEqual('playthroughId1');
    expect(playthroughObject.expId).toEqual('expId1');
    expect(playthroughObject.expVersion).toEqual(1);
    expect(playthroughObject.issueType).toEqual('EarlyQuit');
    expect(playthroughObject.issueCustomizationArgs).toEqual({});
    expect(playthroughObject.actions).toEqual([this.laof.createNew(
      'AnswerSubmit', {}, 1)]);
  });

  it('should convert a playthrough to a backend dict', function() {
    var actions = [this.laof.createNew('AnswerSubmit', {}, 1)];
    var playthroughObject = this.pof.createNew(
      'playthroughId1', 'expId1', 1, 'EarlyQuit', {}, actions);

    var playthroughDict = playthroughObject.toBackendDict();
    expect(playthroughDict).toEqual({
      id: 'playthroughId1',
      exp_id: 'expId1',
      exp_version: 1,
      issue_type: 'EarlyQuit',
      issue_customization_args: {},
      actions: [{
        action_type: 'AnswerSubmit',
        action_customization_args: {},
        schema_version: 1
      }]
    });
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for ReadOnlyStoryNodeObjectFactory.
 */

require('domain/story_viewer/ReadOnlyStoryNodeObjectFactory.ts');

describe('Read only story node object factory', function() {
  var ReadOnlyStoryNodeObjectFactory = null;
  var _sampleSubtopic = null;
  var _sampleStoryNode = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    ReadOnlyStoryNodeObjectFactory = $injector.get(
      'ReadOnlyStoryNodeObjectFactory');

    var sampleReadOnlyStoryNodeBackendDict = {
      id: 'node_1',
      title: 'Title 1',
      prerequisite_skill_ids: ['skill_1'],
      acquired_skill_ids: ['skill_2'],
      destination_node_ids: ['node_2'],
      outline: 'Outline',
      exploration_id: 'exp_id',
      outline_is_finalized: false,
      exp_summary_dict: {
        title: 'Title',
        status: 'private'
      },
      completed: true
    };
    _sampleStoryNode = ReadOnlyStoryNodeObjectFactory.createFromBackendDict(
      sampleReadOnlyStoryNodeBackendDict);
  }));

  it('should correctly return all the values', function() {
    expect(_sampleStoryNode.getId()).toEqual('node_1');
    expect(_sampleStoryNode.getTitle()).toEqual('Title 1');
    expect(_sampleStoryNode.getExplorationId()).toEqual('exp_id');
    expect(_sampleStoryNode.isCompleted()).toEqual(true);
    expect(_sampleStoryNode.getExplorationSummaryObject()).toEqual({
      title: 'Title',
      status: 'private'
    });
    expect(_sampleStoryNode.getOutline()).toEqual('Outline');
    expect(_sampleStoryNode.getOutlineStatus()).toEqual(false);
    expect(_sampleStoryNode.getOutlineStatus()).toEqual(false);
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for StoryPlaythroughObjectFactory.
 */

require('domain/story_viewer/StoryPlaythroughObjectFactory.ts');

describe('Story playthrough object factory', function() {
  var StoryPlaythroughObjectFactory = null;
  var _sampleSubtopic = null;
  var _sampleStoryNode = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    StoryPlaythroughObjectFactory = $injector.get(
      'StoryPlaythroughObjectFactory');

    var firstSampleReadOnlyStoryNodeBackendDict = {
      id: 'node_1',
      title: 'Title 1',
      prerequisite_skill_ids: [],
      acquired_skill_ids: [],
      destination_node_ids: ['node_2'],
      outline: 'Outline',
      exploration_id: 'exp_id',
      outline_is_finalized: false,
      exp_summary_dict: {
        title: 'Title',
        status: 'private'
      },
      completed: true
    };
    var secondSampleReadOnlyStoryNodeBackendDict = {
      id: 'node_2',
      title: 'Title 2',
      prerequisite_skill_ids: [],
      acquired_skill_ids: [],
      destination_node_ids: ['node_3'],
      outline: 'Outline',
      exploration_id: 'exp_id',
      outline_is_finalized: false,
      exp_summary_dict: {
        title: 'Title',
        status: 'private'
      },
      completed: false
    };
    var storyPlaythroughBackendObject = {
      story_nodes: [
        firstSampleReadOnlyStoryNodeBackendDict,
        secondSampleReadOnlyStoryNodeBackendDict]
    };
    _samplePlaythroughObject =
      StoryPlaythroughObjectFactory.createFromBackendDict(
        storyPlaythroughBackendObject);
  }));

  it('should correctly return all the values', function() {
    expect(_samplePlaythroughObject.getInitialNode().getId()).toEqual('node_1');
    expect(_samplePlaythroughObject.getStoryNodeCount()).toEqual(2);
    expect(
      _samplePlaythroughObject.getStoryNodes()[0].getId()).toEqual('node_1');
    expect(
      _samplePlaythroughObject.getStoryNodes()[1].getId()).toEqual('node_2');
    expect(_samplePlaythroughObject.hasFinishedStory()).toEqual(false);
    expect(_samplePlaythroughObject.getNextPendingNodeId()).toEqual('node_2');
    expect(_samplePlaythroughObject.hasStartedStory()).toEqual(true);
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for StoryViewerBackendApiService.
 */

require('domain/story_viewer/StoryViewerBackendApiService.ts');

describe('Story viewer backend API service', function() {
  var StoryViewerBackendApiService = null;
  var sampleDataResults = null;
  var $rootScope = null;
  var $scope = null;
  var $httpBackend = null;
  var UndoRedoService = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    StoryViewerBackendApiService = $injector.get(
      'StoryViewerBackendApiService');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $httpBackend = $injector.get('$httpBackend');

    // Sample story object returnable from the backend
    sampleDataResults = {
      story_title: 'Story title',
      story_description: 'Story description',
      completed_nodes: [],
      pending_nodes: []
    };
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully fetch an existing story from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', '/story_data_handler/0').respond(
        sampleDataResults);
      StoryViewerBackendApiService.fetchStoryData('0').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it('should successfully complete an existing story node', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    $httpBackend.expect(
      'POST', '/story_node_completion_handler/0/1').respond(200);
    StoryViewerBackendApiService.recordStoryNodeCompletion('0', '1').then(
      successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should fail to complete a node when it does not exist', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    $httpBackend.expect(
      'POST', '/story_node_completion_handler/0/1').respond(404);
    StoryViewerBackendApiService.recordStoryNodeCompletion('0', '1').then(
      successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for EditableStoryBackendApiService.
 */

require('domain/editor/undo_redo/UndoRedoService.ts');
require('domain/story/EditableStoryBackendApiService.ts');

describe('Editable story backend API service', function() {
  var EditableStoryBackendApiService = null;
  var sampleDataResults = null;
  var $rootScope = null;
  var $scope = null;
  var $httpBackend = null;
  var UndoRedoService = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(
    angular.mock.module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

  beforeEach(angular.mock.inject(function($injector) {
    EditableStoryBackendApiService = $injector.get(
      'EditableStoryBackendApiService');
    UndoRedoService = $injector.get('UndoRedoService');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $httpBackend = $injector.get('$httpBackend');

    // Sample story object returnable from the backend
    sampleDataResults = {
      story: {
        id: 'storyId',
        title: 'Story title',
        description: 'Story description',
        notes: 'Notes',
        version: 1,
        story_contents: {
          initial_node_id: 'node_1',
          nodes: [{
            id: 'node_1',
            prerequisite_skill_ids: [],
            acquired_skill_ids: [],
            destination_node_ids: [],
            outline: 'Outline',
            exploration_id: null,
            outline_is_finalized: false
          }],
          next_node_id: 'node_3'
        },
        language_code: 'en'
      },
      topic_name: 'Topic Name'
    };
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully fetch an existing story from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect(
        'GET', '/story_editor_handler/data/topicId/storyId').respond(
        sampleDataResults);
      EditableStoryBackendApiService.fetchStory('topicId', 'storyId').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith({
        story: sampleDataResults.story,
        topicName: sampleDataResults.topic_name
      });
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it('should successfully delete a story from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect(
        'DELETE', '/story_editor_handler/data/topicId/storyId').respond(200);
      EditableStoryBackendApiService.deleteStory('topicId', 'storyId').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it('should use the rejection handler if the backend request failed',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect(
        'GET', '/story_editor_handler/data/topicId/2').respond(
        500, 'Error loading story 2.');
      EditableStoryBackendApiService.fetchStory('topicId', '2').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error loading story 2.');
    }
  );

  it('should update a story after fetching it from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      var story = null;

      // Loading a story the first time should fetch it from the backend.
      $httpBackend.expect(
        'GET', '/story_editor_handler/data/topicId/storyId').respond(
        sampleDataResults);

      EditableStoryBackendApiService.fetchStory('topicId', 'storyId').then(
        function(data) {
          story = data.story;
        });
      $httpBackend.flush();

      story.title = 'New Title';
      story.version = '2';
      var storyWrapper = {
        story: story
      };

      $httpBackend.expect(
        'PUT', '/story_editor_handler/data/topicId/storyId').respond(
        storyWrapper);

      // Send a request to update story
      EditableStoryBackendApiService.updateStory(
        'topicId', story.id, story.version, 'Title is updated', []
      ).then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(story);
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it('should use the rejection handler if the story to update doesn\'t exist',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      // Loading a story the first time should fetch it from the backend.
      $httpBackend.expect(
        'PUT', '/story_editor_handler/data/topicId/storyId_1').respond(
        404, 'Story with given id doesn\'t exist.');

      EditableStoryBackendApiService.updateStory(
        'topicId', 'storyId_1', '1', 'Update an invalid Story.', []
      ).then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'Story with given id doesn\'t exist.');
    }
  );
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for StoryContentsObjectFactory.
 */

require('domain/story/StoryContentsObjectFactory.ts');

describe('Story contents object factory', function() {
  var StoryContentsObjectFactory = null;
  var _sampleSubtopic = null;
  var _sampleStoryContents = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    StoryContentsObjectFactory = $injector.get('StoryContentsObjectFactory');

    var sampleStoryContentsBackendDict = {
      initial_node_id: 'node_1',
      nodes: [
        {
          id: 'node_1',
          title: 'Title 1',
          prerequisite_skill_ids: ['skill_1'],
          acquired_skill_ids: ['skill_2'],
          destination_node_ids: ['node_2'],
          outline: 'Outline',
          exploration_id: null,
          outline_is_finalized: false
        }, {
          id: 'node_2',
          title: 'Title 2',
          prerequisite_skill_ids: ['skill_2'],
          acquired_skill_ids: ['skill_3', 'skill_4'],
          destination_node_ids: [],
          outline: 'Outline 2',
          exploration_id: 'exp_1',
          outline_is_finalized: true
        }],
      next_node_id: 'node_3'
    };
    _sampleStoryContents = StoryContentsObjectFactory.createFromBackendDict(
      sampleStoryContentsBackendDict);
  }));

  it('should correctly return index of node (or -1, if not present) ' +
     'based on id', function() {
    expect(_sampleStoryContents.getNodeIndex('node_1')).toEqual(0);
    expect(_sampleStoryContents.getNodeIndex('node_10')).toEqual(-1);
  });

  it('should correctly correctly return the id to title map for story ' +
    'nodes', function() {
    expect(
      _sampleStoryContents.getNodeIdsToTitleMap(['node_1', 'node_2'])
    ).toEqual({
      node_1: 'Title 1',
      node_2: 'Title 2'
    });

    expect(function() {
      _sampleStoryContents.getNodeIdsToTitleMap(['node_1', 'node_2', 'node_3']);
    }).toThrow();
  });

  it('should correctly correctly validate valid story contents', function() {
    expect(_sampleStoryContents.validate()).toEqual([]);
  });

  it('should correctly set initial node id when first node is ' +
    'created', function() {
    var sampleStoryContentsBackendDict = {
      initial_node_id: null,
      nodes: [],
      next_node_id: 'node_1'
    };
    var storyContents = StoryContentsObjectFactory.createFromBackendDict(
      sampleStoryContentsBackendDict);
    storyContents.addNode('Title 1');
    expect(storyContents.getInitialNodeId()).toEqual('node_1');
    expect(storyContents.getNodes()[0].getTitle()).toEqual('Title 1');
  });

  it('should correctly correctly validate case where prerequisite skills ' +
     'are not acquired by the user', function() {
    _sampleStoryContents.addNode('Title 2');
    _sampleStoryContents.addDestinationNodeIdToNode('node_1', 'node_3');
    _sampleStoryContents.addPrerequisiteSkillIdToNode('node_3', 'skill_3');
    expect(_sampleStoryContents.validate()).toEqual([
      'The prerequisite skill with id skill_3 was not completed before node ' +
      'with id node_3 was unlocked'
    ]);
  });

  it('should correctly correctly validate the case where the story graph ' +
    'has loops', function() {
    _sampleStoryContents.addNode('Title 2');
    _sampleStoryContents.addDestinationNodeIdToNode('node_2', 'node_3');
    _sampleStoryContents.addDestinationNodeIdToNode('node_3', 'node_1');
    expect(_sampleStoryContents.validate()).toEqual([
      'Loops are not allowed in the node graph'
    ]);
  });

  it('should correctly correctly validate the case where the story graph is' +
    ' disconnected.', function() {
    _sampleStoryContents.addNode('Title 3');
    expect(_sampleStoryContents.validate()).toEqual([
      'There is no way to get to the chapter with title Title 3 from any ' +
      'other chapter'
    ]);
  });

  it('should correctly throw error when node id is invalid for any function',
    function() {
      expect(function() {
        _sampleStoryContents.setInitialNodeId('node_5');
      }).toThrow();
      expect(function() {
        _sampleStoryContents.deleteNode('node_5');
      }).toThrow();
      expect(function() {
        _sampleStoryContents.setNodeExplorationId('node_5', 'id');
      }).toThrow();
      expect(function() {
        _sampleStoryContents.setNodeOutline('node_5', 'Outline');
      }).toThrow();
      expect(function() {
        _sampleStoryContents.markNodeOutlineAsFinalized('node_5');
      }).toThrow();
      expect(function() {
        _sampleStoryContents.markNodeOutlineAsNotFinalized('node_5');
      }).toThrow();
      expect(function() {
        _sampleStoryContents.setNodeTitle('node_5', 'Title 3');
      }).toThrow();
      expect(function() {
        _sampleStoryContents.addPrerequisiteSkillIdToNode('node_5', 'skill_1');
      }).toThrow();
      expect(function() {
        _sampleStoryContents.removePrerequisiteSkillIdFromNode(
          'node_5', 'skill_1');
      }).toThrow();
      expect(function() {
        _sampleStoryContents.addAcquiredSkillIdToNode('node_5', 'skill_1');
      }).toThrow();
      expect(function() {
        _sampleStoryContents.removeAcquiredSkillIdFromNode('node_5', 'skill_1');
      }).toThrow();
      expect(function() {
        _sampleStoryContents.addDestinationNodeIdToNode('node_5', 'node_1');
      }).toThrow();
      expect(function() {
        _sampleStoryContents.removeDestinationNodeIdFromNode(
          'node_5', 'node_1');
      }).toThrow();
    });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for StoryNodeObjectFactory.
 */

require('domain/story/StoryNodeObjectFactory.ts');

describe('Story node object factory', function() {
  var StoryNodeObjectFactory = null;
  var _sampleSubtopic = null;
  var _sampleStoryNode = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    StoryNodeObjectFactory = $injector.get('StoryNodeObjectFactory');

    var sampleStoryNodeBackendDict = {
      id: 'node_1',
      title: 'Title 1',
      prerequisite_skill_ids: ['skill_1'],
      acquired_skill_ids: ['skill_2'],
      destination_node_ids: ['node_2'],
      outline: 'Outline',
      exploration_id: null,
      outline_is_finalized: false
    };
    _sampleStoryNode = StoryNodeObjectFactory.createFromBackendDict(
      sampleStoryNodeBackendDict);
  }));

  it('should correctly create a node from node id alone', function() {
    var storyNode = StoryNodeObjectFactory.createFromIdAndTitle(
      'node_1', 'Title 1');
    expect(storyNode.getId()).toEqual('node_1');
    expect(storyNode.getTitle()).toEqual('Title 1');
    expect(storyNode.getDestinationNodeIds()).toEqual([]);
    expect(storyNode.getPrerequisiteSkillIds()).toEqual([]);
    expect(storyNode.getAcquiredSkillIds()).toEqual([]);
    expect(storyNode.getOutline()).toEqual('');
    expect(storyNode.getOutlineStatus()).toEqual(false);
    expect(storyNode.getExplorationId()).toEqual(null);
  });

  it('should correctly validate a valid story node', function() {
    expect(_sampleStoryNode.validate()).toEqual([]);
  });

  it('should correctly validate story nodes', function() {
    _sampleStoryNode.addPrerequisiteSkillId('skill_2');
    _sampleStoryNode.addDestinationNodeId('node_1');

    expect(_sampleStoryNode.validate()).toEqual([
      'The skill with id skill_2 is common to both the acquired and' +
      ' prerequisite skill id list in node with id node_1',
      'The destination node id of node with id node_1 points to itself.'
    ]);
  });

  it('should correctly throw error when duplicate values are added to arrays',
    function() {
      expect(function() {
        _sampleStoryNode.addDestinationNodeId('node_2');
      }).toThrow();
      expect(function() {
        _sampleStoryNode.addPrerequisiteSkillId('skill_1');
      }).toThrow();
      expect(function() {
        _sampleStoryNode.addAcquiredSkillId('skill_2');
      }).toThrow();
    });

  it('should correctly throw error when invalid values are deleted from arrays',
    function() {
      expect(function() {
        _sampleStoryNode.removeDestinationNodeId('node_5');
      }).toThrow();
      expect(function() {
        _sampleStoryNode.removePrerequisiteSkillId('skill_4');
      }).toThrow();
      expect(function() {
        _sampleStoryNode.removeAcquiredSkillId('skill_4');
      }).toThrow();
    });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for StoryObjectFactory.
 */

require('domain/story/StoryObjectFactory.ts');

describe('Story object factory', function() {
  var StoryObjectFactory = null;
  var _sampleStory = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    StoryObjectFactory = $injector.get('StoryObjectFactory');

    var sampleStoryBackendDict = {
      id: 'sample_story_id',
      title: 'Story title',
      description: 'Story description',
      notes: 'Notes',
      version: 1,
      story_contents: {
        initial_node_id: 'node_1',
        nodes: [{
          id: 'node_1',
          title: 'Title 1',
          prerequisite_skill_ids: [],
          acquired_skill_ids: [],
          destination_node_ids: [],
          outline: 'Outline',
          exploration_id: null,
          outline_is_finalized: false
        }],
        next_node_id: 'node_3'
      },
      language_code: 'en'
    };
    _sampleStory = StoryObjectFactory.createFromBackendDict(
      sampleStoryBackendDict);
  }));

  it('should be able to create an interstitial story object', function() {
    var story = StoryObjectFactory.createInterstitialStory();
    expect(story.getId()).toEqual(null);
    expect(story.getTitle()).toEqual('Story title loading');
    expect(story.getDescription()).toEqual('Story description loading');
    expect(story.getLanguageCode()).toBe('en');
    expect(story.getStoryContents()).toEqual(null);
    expect(story.getNotes()).toEqual('Story notes loading');
  });

  it('should correctly validate a valid story', function() {
    expect(_sampleStory.validate()).toEqual([]);
  });

  it('should correctly validate a story', function() {
    _sampleStory.setTitle('');
    expect(_sampleStory.validate()).toEqual([
      'Story title should not be empty'
    ]);
  });

  it('should be able to copy from another story', function() {
    var secondStory = StoryObjectFactory.createFromBackendDict({
      id: 'sample_story_id_2s',
      title: 'Story title 2',
      description: 'Story description 2',
      notes: 'Notes 2',
      version: 1,
      story_contents: {
        initial_node_id: 'node_2',
        nodes: [{
          id: 'node_2',
          title: 'Title 2',
          prerequisite_skill_ids: [],
          acquired_skill_ids: [],
          destination_node_ids: [],
          outline: 'Outline',
          exploration_id: null,
          outline_is_finalized: false
        }],
        next_node_id: 'node_3'
      },
      language_code: 'en'
    });

    expect(_sampleStory).not.toBe(secondStory);
    expect(_sampleStory).not.toEqual(secondStory);

    _sampleStory.copyFromStory(secondStory);
    expect(_sampleStory).not.toBe(secondStory);
    expect(_sampleStory).toEqual(secondStory);
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for Story update service.
 */

require('domain/editor/undo_redo/UndoRedoService.ts');
require('domain/story/StoryObjectFactory.ts');
require('domain/story/StoryUpdateService.ts');

describe('Story update service', function() {
  var StoryUpdateService = null;
  var StoryObjectFactory = null;
  var UndoRedoService = null;
  var _sampleStory = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    StoryUpdateService = $injector.get('StoryUpdateService');
    StoryObjectFactory = $injector.get('StoryObjectFactory');
    UndoRedoService = $injector.get('UndoRedoService');

    var sampleStoryBackendObject = {
      id: 'sample_story_id',
      title: 'Story title',
      description: 'Story description',
      notes: 'Story notes',
      version: 1,
      story_contents: {
        initial_node_id: 'node_2',
        nodes: [
          {
            id: 'node_1',
            title: 'Title 1',
            prerequisite_skill_ids: ['skill_1'],
            acquired_skill_ids: ['skill_2'],
            destination_node_ids: [],
            outline: 'Outline',
            exploration_id: null,
            outline_is_finalized: false
          }, {
            id: 'node_2',
            title: 'Title 2',
            prerequisite_skill_ids: ['skill_3'],
            acquired_skill_ids: ['skill_4'],
            destination_node_ids: ['node_1'],
            outline: 'Outline 2',
            exploration_id: 'exp_1',
            outline_is_finalized: true
          }],
        next_node_id: 'node_3'
      },
      language_code: 'en'
    };
    _sampleStory = StoryObjectFactory.createFromBackendDict(
      sampleStoryBackendObject);
  }));

  it('should add/remove a prerequisite skill id to/from a node in the story',
    function() {
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getPrerequisiteSkillIds()
      ).toEqual(['skill_1']);
      StoryUpdateService.addPrerequisiteSkillIdToNode(
        _sampleStory, 'node_1', 'skill_3');
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getPrerequisiteSkillIds()
      ).toEqual(['skill_1', 'skill_3']);

      UndoRedoService.undoChange(_sampleStory);
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getPrerequisiteSkillIds()
      ).toEqual(['skill_1']);
    }
  );

  it('should create a proper backend change dict for adding a prerequisite ' +
    'skill id to a node',
  function() {
    StoryUpdateService.addPrerequisiteSkillIdToNode(
      _sampleStory, 'node_1', 'skill_3');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_story_node_property',
      property_name: 'prerequisite_skill_ids',
      new_value: ['skill_1', 'skill_3'],
      old_value: ['skill_1'],
      node_id: 'node_1'
    }]);
  });

  it('should add/remove an acquired skill id to/from a node in the story',
    function() {
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getAcquiredSkillIds()
      ).toEqual(['skill_2']);
      StoryUpdateService.addAcquiredSkillIdToNode(
        _sampleStory, 'node_1', 'skill_4');
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getAcquiredSkillIds()
      ).toEqual(['skill_2', 'skill_4']);

      UndoRedoService.undoChange(_sampleStory);
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getAcquiredSkillIds()
      ).toEqual(['skill_2']);
    }
  );

  it('should create a proper backend change dict for adding an acquired ' +
    'skill id to a node',
  function() {
    StoryUpdateService.addAcquiredSkillIdToNode(
      _sampleStory, 'node_1', 'skill_4');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_story_node_property',
      property_name: 'acquired_skill_ids',
      new_value: ['skill_2', 'skill_4'],
      old_value: ['skill_2'],
      node_id: 'node_1'
    }]);
  });

  it('should add/remove a destination node id to/from a node in the story',
    function() {
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getDestinationNodeIds()
      ).toEqual([]);
      StoryUpdateService.addDestinationNodeIdToNode(
        _sampleStory, 'node_1', 'node_2');

      // Adding an invalid destination node id should throw an error.
      expect(function() {
        StoryUpdateService.addDestinationNodeIdToNode(
          _sampleStory, 'node_1', 'node_5');
      }).toThrow();

      expect(
        _sampleStory.getStoryContents().getNodes()[0].getDestinationNodeIds()
      ).toEqual(['node_2']);

      UndoRedoService.undoChange(_sampleStory);
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getDestinationNodeIds()
      ).toEqual([]);
    }
  );

  it('should create a proper backend change dict for adding a destination ' +
    'node id to a node',
  function() {
    StoryUpdateService.addDestinationNodeIdToNode(
      _sampleStory, 'node_1', 'node_2');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_story_node_property',
      property_name: 'destination_node_ids',
      new_value: ['node_2'],
      old_value: [],
      node_id: 'node_1'
    }]);
  });

  it('should remove/add a prerequisite skill id from/to a node in the story',
    function() {
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getPrerequisiteSkillIds()
      ).toEqual(['skill_1']);
      StoryUpdateService.removePrerequisiteSkillIdFromNode(
        _sampleStory, 'node_1', 'skill_1');
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getPrerequisiteSkillIds()
      ).toEqual([]);

      UndoRedoService.undoChange(_sampleStory);
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getPrerequisiteSkillIds()
      ).toEqual(['skill_1']);
    }
  );

  it('should create a proper backend change dict for removing a prerequisite ' +
    'skill id from a node',
  function() {
    StoryUpdateService.removePrerequisiteSkillIdFromNode(
      _sampleStory, 'node_1', 'skill_1');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_story_node_property',
      property_name: 'prerequisite_skill_ids',
      new_value: [],
      old_value: ['skill_1'],
      node_id: 'node_1'
    }]);
  });

  it('should remove/add an acquired skill id from/to a node in the story',
    function() {
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getAcquiredSkillIds()
      ).toEqual(['skill_2']);
      StoryUpdateService.removeAcquiredSkillIdFromNode(
        _sampleStory, 'node_1', 'skill_2');
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getAcquiredSkillIds()
      ).toEqual([]);

      UndoRedoService.undoChange(_sampleStory);
      expect(
        _sampleStory.getStoryContents().getNodes()[0].getAcquiredSkillIds()
      ).toEqual(['skill_2']);
    }
  );

  it('should create a proper backend change dict for removing an acquired ' +
    'skill id from a node',
  function() {
    StoryUpdateService.removeAcquiredSkillIdFromNode(
      _sampleStory, 'node_1', 'skill_2');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_story_node_property',
      property_name: 'acquired_skill_ids',
      new_value: [],
      old_value: ['skill_2'],
      node_id: 'node_1'
    }]);
  });

  it('should remove/add a destination node id from/to a node in the story',
    function() {
      expect(
        _sampleStory.getStoryContents().getNodes()[1].getDestinationNodeIds()
      ).toEqual(['node_1']);
      StoryUpdateService.removeDestinationNodeIdFromNode(
        _sampleStory, 'node_2', 'node_1');

      expect(
        _sampleStory.getStoryContents().getNodes()[1].getDestinationNodeIds()
      ).toEqual([]);

      UndoRedoService.undoChange(_sampleStory);
      expect(
        _sampleStory.getStoryContents().getNodes()[1].getDestinationNodeIds()
      ).toEqual(['node_1']);
    }
  );

  it('should create a proper backend change dict for removing a destination ' +
    'node id from a node',
  function() {
    StoryUpdateService.removeDestinationNodeIdFromNode(
      _sampleStory, 'node_2', 'node_1');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_story_node_property',
      property_name: 'destination_node_ids',
      new_value: [],
      old_value: ['node_1'],
      node_id: 'node_2'
    }]);
  });

  it('should add/remove a story node', function() {
    expect(_sampleStory.getStoryContents().getNodes().length).toEqual(2);
    StoryUpdateService.addStoryNode(_sampleStory, 'Title 2');
    expect(_sampleStory.getStoryContents().getNodes().length).toEqual(3);
    expect(_sampleStory.getStoryContents().getNextNodeId()).toEqual('node_4');
    expect(
      _sampleStory.getStoryContents().getNodes()[2].getId()).toEqual('node_3');
    expect(
      _sampleStory.getStoryContents().getNodes()[2].getTitle()).toEqual(
      'Title 2');

    UndoRedoService.undoChange(_sampleStory);
    expect(_sampleStory.getStoryContents().getNodes().length).toEqual(2);
  });

  it('should create a proper backend change dict for adding a story node',
    function() {
      StoryUpdateService.addStoryNode(_sampleStory, 'Title 2');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'add_story_node',
        node_id: 'node_3',
        title: 'Title 2'
      }]);
    }
  );

  it('should remove/add a story node', function() {
    expect(function() {
      StoryUpdateService.deleteStoryNode(_sampleStory, 'node_2');
    }).toThrow();
    expect(_sampleStory.getStoryContents().getNodes().length).toEqual(2);
    expect(
      _sampleStory.getStoryContents().getNodes()[1].getDestinationNodeIds()
    ).toEqual(['node_1']);
    StoryUpdateService.deleteStoryNode(_sampleStory, 'node_1');
    // Initial node should not be deleted.
    StoryUpdateService.deleteStoryNode(_sampleStory, 'node_2');
    expect(_sampleStory.getStoryContents().getInitialNodeId()).toEqual(null);
    expect(_sampleStory.getStoryContents().getNodes().length).toEqual(0);

    expect(function() {
      UndoRedoService.undoChange(_sampleStory);
    }).toThrow();
  });

  it('should create a proper backend change dict for removing a story node',
    function() {
      StoryUpdateService.deleteStoryNode(_sampleStory, 'node_1');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'delete_story_node',
        node_id: 'node_1'
      }]);
    }
  );

  it('should finalize a story node outline', function() {
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getOutlineStatus()
    ).toBe(false);
    StoryUpdateService.finalizeStoryNodeOutline(_sampleStory, 'node_1');
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getOutlineStatus()
    ).toBe(true);

    UndoRedoService.undoChange(_sampleStory);
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getOutlineStatus()
    ).toBe(false);
  });

  it('should create a proper backend change dict for finalizing a node outline',
    function() {
      StoryUpdateService.finalizeStoryNodeOutline(_sampleStory, 'node_1');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_story_node_outline_status',
        new_value: true,
        old_value: false,
        node_id: 'node_1'
      }]);
    }
  );

  it('should unfinalize a story node outline', function() {
    expect(
      _sampleStory.getStoryContents().getNodes()[1].getOutlineStatus()
    ).toBe(true);
    StoryUpdateService.unfinalizeStoryNodeOutline(_sampleStory, 'node_2');
    expect(
      _sampleStory.getStoryContents().getNodes()[1].getOutlineStatus()
    ).toBe(false);

    UndoRedoService.undoChange(_sampleStory);
    expect(
      _sampleStory.getStoryContents().getNodes()[1].getOutlineStatus()
    ).toBe(true);
  });

  it('should create a proper backend change dict for unfinalizing a node ' +
    'outline', function() {
    StoryUpdateService.unfinalizeStoryNodeOutline(_sampleStory, 'node_2');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_story_node_outline_status',
      new_value: false,
      old_value: true,
      node_id: 'node_2'
    }]);
  });

  it('should set a story node outline', function() {
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getOutline()
    ).toBe('Outline');
    StoryUpdateService.setStoryNodeOutline(
      _sampleStory, 'node_1', 'new outline');
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getOutline()
    ).toBe('new outline');

    UndoRedoService.undoChange(_sampleStory);
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getOutline()
    ).toBe('Outline');
  });

  it('should create a proper backend change dict for setting a node outline',
    function() {
      StoryUpdateService.setStoryNodeOutline(
        _sampleStory, 'node_1', 'new outline');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_story_node_property',
        property_name: 'outline',
        new_value: 'new outline',
        old_value: 'Outline',
        node_id: 'node_1'
      }]);
    }
  );

  it('should set a story node title', function() {
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getTitle()
    ).toBe('Title 1');
    StoryUpdateService.setStoryNodeTitle(
      _sampleStory, 'node_1', 'new title');
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getTitle()
    ).toBe('new title');

    UndoRedoService.undoChange(_sampleStory);
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getTitle()
    ).toBe('Title 1');
  });

  it('should create a proper backend change dict for setting a node title',
    function() {
      StoryUpdateService.setStoryNodeTitle(
        _sampleStory, 'node_1', 'new title');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_story_node_property',
        property_name: 'title',
        new_value: 'new title',
        old_value: 'Title 1',
        node_id: 'node_1'
      }]);
    }
  );

  it('should set the exploration id of a story node', function() {
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getExplorationId()
    ).toBe(null);
    StoryUpdateService.setStoryNodeExplorationId(
      _sampleStory, 'node_1', 'exp_2');
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getExplorationId()
    ).toBe('exp_2');

    // Adding an already existing exploration in the story should throw an
    // error.
    expect(function() {
      StoryUpdateService.setStoryNodeExplorationId(
        _sampleStory, 'node_1', 'exp_1');
    }).toThrow();

    UndoRedoService.undoChange(_sampleStory);
    expect(
      _sampleStory.getStoryContents().getNodes()[0].getExplorationId()
    ).toBe(null);
  });

  it('should create a proper backend change dict for setting the exploration ' +
    'id of a node', function() {
    StoryUpdateService.setStoryNodeExplorationId(
      _sampleStory, 'node_1', 'exp_2');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_story_node_property',
      property_name: 'exploration_id',
      new_value: 'exp_2',
      old_value: null,
      node_id: 'node_1'
    }]);
  });

  it('should set/unset the initial node of the story', function() {
    expect(
      _sampleStory.getStoryContents().getInitialNodeId()).toEqual('node_2');
    StoryUpdateService.setInitialNodeId(_sampleStory, 'node_1');
    expect(
      _sampleStory.getStoryContents().getInitialNodeId()).toEqual('node_1');

    UndoRedoService.undoChange(_sampleStory);
    expect(
      _sampleStory.getStoryContents().getInitialNodeId()).toEqual('node_2');
  });

  it('should create a proper backend change dict for setting initial node',
    function() {
      StoryUpdateService.setInitialNodeId(_sampleStory, 'node_1');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_story_contents_property',
        property_name: 'initial_node_id',
        new_value: 'node_1',
        old_value: 'node_2'
      }]);
    }
  );

  it('should set/unset changes to a story\'s title', function() {
    expect(_sampleStory.getTitle()).toEqual('Story title');
    StoryUpdateService.setStoryTitle(_sampleStory, 'new title');
    expect(_sampleStory.getTitle()).toEqual('new title');

    UndoRedoService.undoChange(_sampleStory);
    expect(_sampleStory.getTitle()).toEqual('Story title');
  });

  it('should create a proper backend change dict for changing title',
    function() {
      StoryUpdateService.setStoryTitle(_sampleStory, 'new title');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_story_property',
        property_name: 'title',
        new_value: 'new title',
        old_value: 'Story title'
      }]);
    }
  );

  it('should set/unset changes to a story\'s description', function() {
    expect(_sampleStory.getDescription()).toEqual('Story description');
    StoryUpdateService.setStoryDescription(_sampleStory, 'new description');
    expect(_sampleStory.getDescription()).toEqual('new description');

    UndoRedoService.undoChange(_sampleStory);
    expect(_sampleStory.getDescription()).toEqual('Story description');
  });

  it('should create a proper backend change dict for changing descriptions',
    function() {
      StoryUpdateService.setStoryDescription(_sampleStory, 'new description');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_story_property',
        property_name: 'description',
        new_value: 'new description',
        old_value: 'Story description'
      }]);
    }
  );

  it('should set/unset changes to a story\'s notes', function() {
    expect(_sampleStory.getNotes()).toEqual('Story notes');
    StoryUpdateService.setStoryNotes(_sampleStory, 'new notes');
    expect(_sampleStory.getNotes()).toEqual('new notes');

    UndoRedoService.undoChange(_sampleStory);
    expect(_sampleStory.getNotes()).toEqual('Story notes');
  });

  it('should create a proper backend change dict for changing notes',
    function() {
      StoryUpdateService.setStoryNotes(_sampleStory, 'new notes');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_story_property',
        property_name: 'notes',
        new_value: 'new notes',
        old_value: 'Story notes'
      }]);
    }
  );

  it('should set/unset changes to a story\'s language code', function() {
    expect(_sampleStory.getLanguageCode()).toEqual('en');
    StoryUpdateService.setStoryLanguageCode(_sampleStory, 'fi');
    expect(_sampleStory.getLanguageCode()).toEqual('fi');

    UndoRedoService.undoChange(_sampleStory);
    expect(_sampleStory.getLanguageCode()).toEqual('en');
  });

  it('should create a proper backend change dict for changing language codes',
    function() {
      StoryUpdateService.setStoryLanguageCode(_sampleStory, 'fi');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_story_property',
        property_name: 'language_code',
        new_value: 'fi',
        old_value: 'en'
      }]);
    }
  );
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for SuggestionObjectFactory.
 */

require('domain/suggestion/SuggestionObjectFactory.ts');

describe('Suggestion object factory', function() {
  beforeEach(function() {
    angular.mock.module('oppia');
  });

  var SuggestionObjectFactory = null;

  beforeEach(angular.mock.inject(function($injector) {
    SuggestionObjectFactory = $injector.get('SuggestionObjectFactory');
  }));

  it('should create a new suggestion from a backend dict.', function() {
    var suggestionBackendDict = {
      suggestion_id: 'exploration.exp1.thread1',
      suggestion_type: 'edit_exploration_state_content',
      target_type: 'exploration',
      target_id: 'exp1',
      target_version_at_submission: 1,
      status: 'accepted',
      author_name: 'author',
      change: {
        cmd: 'edit_state_property',
        property_name: 'content',
        state_name: 'state_1',
        new_value: 'new suggestion content',
        old_value: 'old suggestion content'
      },
      last_updated: 1000
    };
    var suggestion = SuggestionObjectFactory.createFromBackendDict(
      suggestionBackendDict);
    expect(suggestion.suggestionType).toEqual('edit_exploration_state_content');
    expect(suggestion.targetType).toEqual('exploration');
    expect(suggestion.targetId).toEqual('exp1');
    expect(suggestion.suggestionId).toEqual('exploration.exp1.thread1');
    expect(suggestion.status).toEqual('accepted');
    expect(suggestion.authorName).toEqual('author');
    expect(suggestion.stateName).toEqual('state_1');
    expect(suggestion.newValue).toEqual('new suggestion content');
    expect(suggestion.oldValue).toEqual('old suggestion content');
    expect(suggestion.lastUpdated).toEqual(1000);
    expect(suggestion.getThreadId()).toEqual('exploration.exp1.thread1');
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for SuggestionThreadObjectFactory.
 */

require('domain/suggestion/SuggestionObjectFactory.ts');
require('domain/suggestion/SuggestionThreadObjectFactory.ts');

describe('Suggestion thread object factory', function() {
  beforeEach(function() {
    angular.mock.module('oppia');
  });
  var SuggestionThreadObjectFactory = null;
  var SuggestionObjectFactory = null;

  beforeEach(angular.mock.inject(function($injector) {
    SuggestionThreadObjectFactory = $injector.get(
      'SuggestionThreadObjectFactory');
    SuggestionObjectFactory = $injector.get('SuggestionObjectFactory');
  }));

  it('should create a new suggestion thread from a backend dict.', function() {
    var suggestionThreadBackendDict = {
      last_updated: 1000,
      original_author_username: 'author',
      status: 'accepted',
      subject: 'sample subject',
      summary: 'sample summary',
      message_count: 10,
      state_name: 'state 1',
      thread_id: 'exploration.exp1.thread1'
    };

    var suggestionBackendDict = {
      suggestion_id: 'exploration.exp1.thread1',
      suggestion_type: 'edit_exploration_state_content',
      target_type: 'exploration',
      target_id: 'exp1',
      target_version_at_submission: 1,
      status: 'accepted',
      author_name: 'author',
      change: {
        cmd: 'edit_state_property',
        property_name: 'content',
        state_name: 'state_1',
        new_value: {
          html: 'new suggestion content'
        },
        old_value: {
          html: 'old suggestion content'
        }
      },
      last_updated: 1000
    };
    var suggestionThread = SuggestionThreadObjectFactory.createFromBackendDicts(
      suggestionThreadBackendDict, suggestionBackendDict);
    expect(suggestionThread.status).toEqual('accepted');
    expect(suggestionThread.subject).toEqual('sample subject');
    expect(suggestionThread.summary).toEqual('sample summary');
    expect(suggestionThread.originalAuthorName).toEqual('author');
    expect(suggestionThread.lastUpdated).toEqual(1000);
    expect(suggestionThread.messageCount).toEqual(10);
    expect(suggestionThread.threadId).toEqual('exploration.exp1.thread1');
    expect(suggestionThread.suggestion.suggestionType).toEqual(
      'edit_exploration_state_content');
    expect(suggestionThread.suggestion.targetType).toEqual('exploration');
    expect(suggestionThread.suggestion.targetId).toEqual('exp1');
    expect(suggestionThread.suggestion.suggestionId).toEqual(
      'exploration.exp1.thread1');
    expect(suggestionThread.suggestion.status).toEqual('accepted');
    expect(suggestionThread.suggestion.authorName).toEqual('author');
    expect(suggestionThread.suggestion.newValue.html).toEqual(
      'new suggestion content');
    expect(suggestionThread.suggestion.oldValue.html).toEqual(
      'old suggestion content');
    expect(suggestionThread.suggestion.lastUpdated).toEqual(1000);
    expect(suggestionThread.suggestion.getThreadId()).toEqual(
      'exploration.exp1.thread1');
    expect(suggestionThread.isSuggestionThread()).toEqual(true);
    expect(suggestionThread.isSuggestionHandled()).toEqual(true);
    suggestionThread.suggestion.status = 'review';
    expect(suggestionThread.isSuggestionHandled()).toEqual(false);
    expect(suggestionThread.getSuggestionStatus()).toEqual('review');
    expect(suggestionThread.getSuggestionStateName()).toEqual('state_1');
    expect(suggestionThread.getReplacementHtmlFromSuggestion()).toEqual(
      'new suggestion content');

    var messages = [{
      text: 'message1'
    }, {
      text: 'message2'
    }];
    suggestionThread.setMessages(messages);
    expect(suggestionThread.messages).toEqual(messages);
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for TopicViewerBackendApiService.
 */

require('domain/topic_viewer/TopicViewerBackendApiService.ts');

describe('Topic viewer backend API service', function() {
  var TopicViewerBackendApiService = null;
  var sampleDataResults = null;
  var $rootScope = null;
  var $scope = null;
  var $httpBackend = null;
  var UndoRedoService = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    TopicViewerBackendApiService = $injector.get(
      'TopicViewerBackendApiService');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $httpBackend = $injector.get('$httpBackend');

    // Sample topic object returnable from the backend
    sampleDataResults = {
      topic_name: 'topic_name',
      canonical_story_dicts: {
        id: '0',
        title: 'Story Title',
        description: 'Story Description',
      },
      additional_story_dicts: {
        id: '1',
        title: 'Story Title',
        description: 'Story Description',
      }
    };
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully fetch an existing topic from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', '/topic_data_handler/0').respond(
        sampleDataResults);
      TopicViewerBackendApiService.fetchTopicData('0').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
      expect(failHandler).not.toHaveBeenCalled();
    }
  );
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for EditableTopicBackendApiService.
 */

require('domain/editor/undo_redo/UndoRedoService.ts');
require('domain/topic/EditableTopicBackendApiService.ts');

describe('Editable topic backend API service', function() {
  var EditableTopicBackendApiService = null;
  var sampleDataResults = null;
  var $rootScope = null;
  var $scope = null;
  var $httpBackend = null;
  var UndoRedoService = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(
    angular.mock.module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

  beforeEach(angular.mock.inject(function($injector) {
    EditableTopicBackendApiService = $injector.get(
      'EditableTopicBackendApiService');
    UndoRedoService = $injector.get('UndoRedoService');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $httpBackend = $injector.get('$httpBackend');

    // Sample topic object returnable from the backend
    sampleDataResults = {
      topic_dict: {
        id: '0',
        name: 'Topic Name',
        description: 'Topic Description',
        version: '1',
        canonical_story_ids: ['story_id_1'],
        additional_story_ids: ['story_id_2'],
        uncategorized_skill_ids: ['skill_id_1'],
        subtopics: [],
        language_code: 'en'
      },
      skill_id_to_description_dict: {
        skill_id_1: 'Description 1'
      },
      subtopic_page: {
        id: 'topicId-1',
        topicId: 'topicId',
        page_contents: {
          subtitled_html: {
            html: '<p>Data</p>',
            content_id: 'content'
          },
          content_ids_to_audio_translations: {
            content: {}
          },
        },
        language_code: 'en'
      }
    };
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully fetch an existing topic from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', '/topic_editor_handler/data/0').respond(
        sampleDataResults);
      EditableTopicBackendApiService.fetchTopic('0').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith({
        topicDict: sampleDataResults.topic_dict,
        skillIdToDescriptionDict: sampleDataResults.skill_id_to_description_dict
      });
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it('should successfully fetch an existing subtopic page from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect(
        'GET', '/subtopic_page_editor_handler/data/topicId/1').respond(
        sampleDataResults);
      EditableTopicBackendApiService.fetchSubtopicPage('topicId', 1).then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(
        sampleDataResults.subtopic_page);
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it('should use the rejection handler if the backend request failed',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', '/topic_editor_handler/data/1').respond(
        500, 'Error loading topic 1.');
      EditableTopicBackendApiService.fetchTopic('1').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error loading topic 1.');
    }
  );

  it('should update a topic after fetching it from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      var topic = null;

      // Loading a topic the first time should fetch it from the backend.
      $httpBackend.expect('GET', '/topic_editor_handler/data/0').respond(
        sampleDataResults);

      EditableTopicBackendApiService.fetchTopic('0').then(
        function(data) {
          topic = data.topicDict;
        });
      $httpBackend.flush();

      topic.name = 'New Name';
      topic.version = '2';
      var topicWrapper = {
        topic_dict: topic,
        skill_id_to_description_dict: {
          skill_id_1: 'Description 1'
        }
      };

      $httpBackend.expect('PUT', '/topic_editor_handler/data/0').respond(
        topicWrapper);

      // Send a request to update topic
      EditableTopicBackendApiService.updateTopic(
        topic.id, topic.version, 'Name is updated', []
      ).then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith({
        topicDict: topic,
        skillIdToDescriptionDict: sampleDataResults.skill_id_to_description_dict
      });
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it('should use the rejection handler if the topic to update doesn\'t exist',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      // Loading a topic the first time should fetch it from the backend.
      $httpBackend.expect('PUT', '/topic_editor_handler/data/1').respond(
        404, 'Topic with given id doesn\'t exist.');

      EditableTopicBackendApiService.updateTopic(
        '1', '1', 'Update an invalid topic.', []
      ).then(successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'Topic with given id doesn\'t exist.');
    }
  );
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for SubtopicObjectFactory.
 */

require('domain/topic/SubtopicObjectFactory.ts');

describe('Subtopic object factory', function() {
  var SubtopicObjectFactory = null;
  var _sampleSubtopic = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    SubtopicObjectFactory = $injector.get('SubtopicObjectFactory');

    var sampleSubtopicBackendObject = {
      id: 1,
      title: 'Title',
      skill_ids: ['skill_1', 'skill_2']
    };
    var sampleSkillIdToDesriptionMap = {
      skill_1: 'Description 1',
      skill_2: 'Description 2'
    };
    _sampleSubtopic = SubtopicObjectFactory.create(
      sampleSubtopicBackendObject, sampleSkillIdToDesriptionMap);
  }));

  it('should not find issues with a valid subtopic', function() {
    expect(_sampleSubtopic.validate()).toEqual([]);
  });

  it('should validate the subtopic', function() {
    _sampleSubtopic.setTitle('');

    expect(
      _sampleSubtopic.validate()
    ).toEqual(['Subtopic title should not be empty']);
  });

  it('should be able to create a subtopic object with given title and id',
    function() {
      var subtopic = SubtopicObjectFactory.createFromTitle(2, 'Title2');
      expect(subtopic.getId()).toBe(2);
      expect(subtopic.getTitle()).toBe('Title2');
      expect(subtopic.getSkillSummaries()).toEqual([]);
    });

  it('should not add duplicate elements to skill ids list', function() {
    expect(_sampleSubtopic.addSkill('skill_1', 'Description 1')).toEqual(false);
  });

  it('should correctly remove a skill id', function() {
    _sampleSubtopic.removeSkill('skill_1');
    expect(_sampleSubtopic.getSkillSummaries().length).toEqual(1);
    expect(_sampleSubtopic.getSkillSummaries()[0].getId()).toEqual('skill_2');
    expect(
      _sampleSubtopic.getSkillSummaries()[0].getDescription()
    ).toEqual('Description 2');
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for SubtopicPageContentsObjectFactory.
 */

require('domain/topic/SubtopicPageContentsObjectFactory.ts');

describe('Subtopic page contents object factory', function() {
  var SubtopicPageContentsObjectFactory = null;

  var expectedDefaultObject = {
    subtitled_html: {
      html: '',
      content_id: 'content'
    },
    content_ids_to_audio_translations: {
      content: {}
    }
  };

  var backendDict = {
    subtitled_html: {
      html: 'test content',
      content_id: 'content'
    },
    content_ids_to_audio_translations: {
      content: {
        en: {
          filename: 'test.mp3',
          file_size_bytes: 100,
          needs_update: false
        }
      }
    }
  };

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    SubtopicPageContentsObjectFactory =
      $injector.get('SubtopicPageContentsObjectFactory');
  }));

  it('should be able to create a default object', function() {
    var defaultObject = SubtopicPageContentsObjectFactory.createDefault();
    expect(defaultObject.toBackendDict()).toEqual(expectedDefaultObject);
  });

  it('should convert from a backend dictionary', function() {
    var sampleSubtopicPageContents =
      SubtopicPageContentsObjectFactory.createFromBackendDict(backendDict);
    expect(sampleSubtopicPageContents.getSubtitledHtml().getHtml())
      .toEqual('test content');
    expect(sampleSubtopicPageContents.getSubtitledHtml().getContentId())
      .toEqual('content');
    expect(sampleSubtopicPageContents.getContentIdsToAudioTranslations()
      .getAudioTranslation('content', 'en').toBackendDict())
      .toEqual({
        filename: 'test.mp3',
        file_size_bytes: 100,
        needs_update: false
      });
  });

  it('should convert from a backend dictionary', function() {
    var sampleSubtopicPageContents =
      SubtopicPageContentsObjectFactory.createFromBackendDict(backendDict);
    expect(sampleSubtopicPageContents.toBackendDict()).toEqual(backendDict);
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for SubtopicPageObjectFactory.
 */

require('domain/topic/SubtopicPageObjectFactory.ts');

describe('Subtopic page object factory', function() {
  var SubtopicPageObjectFactory = null;
  var _sampleSubtopic = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    SubtopicPageObjectFactory = $injector.get('SubtopicPageObjectFactory');
  }));

  it('should be able to create a subtopic page object with given topic and ' +
    'subtopic id', function() {
    var subtopicPage = SubtopicPageObjectFactory.createDefault(
      'topic_id', 2);
    expect(subtopicPage.getId()).toBe('topic_id-2');
    expect(subtopicPage.getTopicId()).toBe('topic_id');
    expect(subtopicPage.getPageContents().getHtml()).toEqual('');
    expect(subtopicPage.getLanguageCode()).toEqual('en');
  });

  it('should be able to create an interstitial subtopic page object',
    function() {
      var subtopicPage =
        SubtopicPageObjectFactory.createInterstitialSubtopicPage();
      expect(subtopicPage.getId()).toEqual(null);
      expect(subtopicPage.getTopicId()).toEqual(null);
      expect(subtopicPage.getPageContents()).toEqual(null);
      expect(subtopicPage.getLanguageCode()).toBe('en');
    });

  it('should be able to copy from another subtopic page', function() {
    var firstSubtopicPage = SubtopicPageObjectFactory.createFromBackendDict({
      id: 'topic_id-1',
      topic_id: 'topic_id',
      page_contents: {
        subtitled_html: {
          html: '<p>Data</p>',
          content_id: 'content'
        },
        content_ids_to_audio_translations: {
          content: {}
        }
      },
      language_code: 'en'
    });

    var secondSubtopicPage = SubtopicPageObjectFactory.createFromBackendDict({
      id: 'topic_id2-2',
      topic_id: 'topic_id2',
      page_contents: {
        subtitled_html: {
          html: '<p>Data2</p>',
          content_id: 'content'
        },
        content_ids_to_audio_translations: {
          content: {}
        }
      },
      language_code: 'en'
    });

    expect(firstSubtopicPage).not.toBe(secondSubtopicPage);
    expect(firstSubtopicPage).not.toEqual(secondSubtopicPage);

    firstSubtopicPage.copyFromSubtopicPage(secondSubtopicPage);
    expect(firstSubtopicPage).not.toBe(secondSubtopicPage);
    expect(firstSubtopicPage).toEqual(secondSubtopicPage);
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for TopicObjectFactory.
 */

require('domain/topic/TopicObjectFactory.ts');

describe('Topic object factory', function() {
  var TopicObjectFactory = null;
  var _sampleTopic = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    TopicObjectFactory = $injector.get('TopicObjectFactory');

    var sampleTopicBackendObject = {
      id: 'sample_topic_id',
      name: 'Topic name',
      description: 'Topic description',
      version: 1,
      uncategorized_skill_ids: ['skill_1', 'skill_2'],
      canonical_story_ids: ['story_1', 'story_4'],
      additional_story_ids: ['story_2', 'story_3'],
      subtopics: [{
        id: 1,
        title: 'Title',
        skill_ids: ['skill_3']
      }],
      next_subtopic_id: 1,
      language_code: 'en'
    };
    var skillIdToDescriptionDict = {
      skill_1: 'Description 1',
      skill_2: 'Description 2',
      skill_3: 'Description 3'
    };
    _sampleTopic = TopicObjectFactory.create(
      sampleTopicBackendObject, skillIdToDescriptionDict);
  }));

  it('should not find issues with a valid topic', function() {
    expect(_sampleTopic.validate()).toEqual([]);
  });

  it('should validate the topic', function() {
    _sampleTopic.setName('');
    _sampleTopic.addCanonicalStoryId('story_2');
    _sampleTopic.getSubtopics()[0].addSkill('skill_1');

    expect(_sampleTopic.validate()).toEqual([
      'Topic name should not be empty.',
      'The story with id story_2 is present in both canonical ' +
      'and additional stories.',
      'The skill with id skill_1 is duplicated in the topic'
    ]);
  });

  it('should be able to create an interstitial topic object', function() {
    var topic = TopicObjectFactory.createInterstitialTopic();
    expect(topic.getId()).toEqual(null);
    expect(topic.getName()).toEqual('Topic name loading');
    expect(topic.getDescription()).toEqual('Topic description loading');
    expect(topic.getLanguageCode()).toBe('en');
    expect(topic.getSubtopics()).toEqual([]);
    expect(topic.getAdditionalStoryIds()).toEqual([]);
    expect(topic.getCanonicalStoryIds()).toEqual([]);
    expect(topic.getUncategorizedSkillSummaries()).toEqual([]);
  });

  it('should correctly remove the various array elements', function() {
    _sampleTopic.removeCanonicalStoryId('story_1');
    _sampleTopic.removeAdditionalStoryId('story_2');
    _sampleTopic.removeUncategorizedSkill('skill_1');
    expect(_sampleTopic.getAdditionalStoryIds()).toEqual(['story_3']);
    expect(_sampleTopic.getCanonicalStoryIds()).toEqual(['story_4']);
    expect(_sampleTopic.getUncategorizedSkillSummaries().length).toEqual(1);
    expect(
      _sampleTopic.getUncategorizedSkillSummaries()[0].getId()
    ).toEqual('skill_2');
    expect(
      _sampleTopic.getUncategorizedSkillSummaries()[0].getDescription()
    ).toEqual('Description 2');
  });

  it('should be able to copy from another topic', function() {
    var secondTopic = TopicObjectFactory.create({
      id: 'topic_id_2',
      name: 'Another name',
      description: 'Another description',
      language_code: 'en',
      version: '15',
      additional_story_ids: ['story_10'],
      canonical_story_ids: ['story_5'],
      uncategorized_skill_ids: ['skill_2', 'skill_3'],
      next_subtopic_id: 2,
      subtopics: [{
        id: 1,
        title: 'Title',
        skill_ids: ['skill_1']
      }]
    }, {
      skill_1: 'Description 1',
      skill_2: 'Description 2',
      skill_3: 'Description 3'
    });

    expect(_sampleTopic).not.toBe(secondTopic);
    expect(_sampleTopic).not.toEqual(secondTopic);

    _sampleTopic.copyFromTopic(secondTopic);
    expect(_sampleTopic).not.toBe(secondTopic);
    expect(_sampleTopic).toEqual(secondTopic);
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for TopicRightsBackendApiService.
 */

require('domain/topic/TopicRightsBackendApiService.ts');

describe('Topic rights backend API service', function() {
  var TopicRightsBackendApiService = null;
  var $rootScope = null;
  var $scope = null;
  var $httpBackend = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(
    angular.mock.module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

  beforeEach(angular.mock.inject(function($injector) {
    TopicRightsBackendApiService = $injector.get(
      'TopicRightsBackendApiService');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $httpBackend = $injector.get('$httpBackend');
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully publish and unpublish a topic', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    $httpBackend.expect(
      'PUT', '/rightshandler/change_topic_status/0').respond(200);
    TopicRightsBackendApiService.publishTopic('0').then(
      successHandler, failHandler);
    $httpBackend.flush();
    $rootScope.$digest();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();

    $httpBackend.expect(
      'PUT', '/rightshandler/change_topic_status/0').respond(200);
    TopicRightsBackendApiService.unpublishTopic('0').then(
      successHandler, failHandler);
    $httpBackend.flush();
    $rootScope.$digest();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should call the provided fail handler on HTTP failure', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    $httpBackend.expect(
      'PUT', '/rightshandler/change_topic_status/0').respond(
      404, 'Topic doesn\'t not exist.');
    TopicRightsBackendApiService.publishTopic('0').then(
      successHandler, failHandler);
    $httpBackend.flush();
    $rootScope.$digest();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  });

  it('should report an uncached topic rights after caching it', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    $httpBackend.expect(
      'GET', '/rightshandler/get_topic_rights/0').respond(200, {
      topic_id: 0,
      topic_is_published: true,
      manager_ids: ['user_id']
    });
    // The topic should not currently be cached.
    expect(TopicRightsBackendApiService.isCached('0')).toBe(false);

    // A new topic should be fetched from the backend. Also,
    // the returned topic should match the expected topic object.
    TopicRightsBackendApiService.loadTopicRights('0').then(
      successHandler, failHandler);

    $httpBackend.flush();
    $rootScope.$digest();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
    // It should now be cached.
    expect(TopicRightsBackendApiService.isCached('0')).toBe(true);
  });

  it('should report a cached topic rights after caching it', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    // The topic should not currently be cached.
    expect(TopicRightsBackendApiService.isCached('0')).toBe(false);

    // Cache a topic rights object.
    TopicRightsBackendApiService.cacheTopicRights('0', {
      topic_id: 0,
      topic_is_published: true,
      manager_ids: ['user_id']
    });

    // It should now be cached.
    expect(TopicRightsBackendApiService.isCached('0')).toBe(true);

    // A new topic should not have been fetched from the backend. Also,
    // the returned topic should match the expected topic object.
    TopicRightsBackendApiService.loadTopicRights('0').then(
      successHandler, failHandler);

    // http://brianmcd.com/2014/03/27/
    // a-tip-for-angular-unit-tests-with-promises.html
    $rootScope.$digest();

    expect(successHandler).toHaveBeenCalledWith({
      topic_id: 0,
      topic_is_published: true,
      manager_ids: ['user_id']
    });
    expect(failHandler).not.toHaveBeenCalled();
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for TopicRightsObjectFactory.
 */

require('domain/topic/TopicRightsObjectFactory.ts');

describe('Topic rights object factory', function() {
  var TopicRightsObjectFactory = null;
  var sampleTopicRights = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    TopicRightsObjectFactory = $injector.get('TopicRightsObjectFactory');
    var initialTopicRightsBackendObject = {
      published: false,
      can_edit_topic: true,
      can_publish_topic: true
    };

    sampleTopicRights = TopicRightsObjectFactory.createFromBackendDict(
      initialTopicRightsBackendObject);
  }));

  it('should be able to publish and unpublish topic when user can edit it',
    function() {
      expect(sampleTopicRights.isPublished()).toBe(false);

      sampleTopicRights.markTopicAsPublished();
      expect(sampleTopicRights.isPublished()).toBe(true);

      sampleTopicRights.markTopicAsUnpublished();
      expect(sampleTopicRights.isPublished()).toBe(false);
    });

  it('should throw error and not be able to publish or unpublish topic when ' +
    'user cannot edit topic',
  function() {
    expect(sampleTopicRights.isPublished()).toBe(false);

    var exampleTopicRightsBackendObject = {
      is_published: false,
      can_edit_topic: true,
      can_publish_topic: false
    };

    var exampleTopicRights = TopicRightsObjectFactory.createFromBackendDict(
      exampleTopicRightsBackendObject);

    expect(function() {
      exampleTopicRights.markTopicAsPublished();
    }).toThrow(new Error('User is not allowed to publish this topic.'));

    expect(function() {
      exampleTopicRights.markTopicAsUnpublished();
    }).toThrow(new Error('User is not allowed to unpublish this topic.'));
  });

  it('should create an empty topic rights object', function() {
    var emptyTopicRightsBackendObject = (
      TopicRightsObjectFactory.createInterstitialRights());

    expect(emptyTopicRightsBackendObject.isPublished()).toEqual(false);
    expect(emptyTopicRightsBackendObject.canEditTopic()).toEqual(false);
    expect(emptyTopicRightsBackendObject.canPublishTopic()).toEqual(false);
  });

  it('should make a copy from another topic rights', function() {
    var emptyTopicRightsBackendObject = (
      TopicRightsObjectFactory.createInterstitialRights());

    emptyTopicRightsBackendObject.copyFromTopicRights(sampleTopicRights);

    expect(emptyTopicRightsBackendObject.isPublished()).toEqual(false);
    expect(emptyTopicRightsBackendObject.canEditTopic()).toEqual(true);
    expect(emptyTopicRightsBackendObject.canPublishTopic()).toEqual(true);
    expect(emptyTopicRightsBackendObject.canEditName()).toEqual(true);
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for Topic update service.
 */

require('App.ts');
require('domain/editor/undo_redo/UndoRedoService.ts');
require('domain/exploration/AudioTranslationObjectFactory.ts');
require('domain/exploration/ContentIdsToAudioTranslationsObjectFactory.ts');
require('domain/exploration/SubtitledHtmlObjectFactory.ts');
require('domain/skill/SkillSummaryObjectFactory.ts');
require('domain/topic/SubtopicObjectFactory.ts');
require('domain/topic/SubtopicPageContentsObjectFactory.ts');
require('domain/topic/SubtopicPageObjectFactory.ts');
require('domain/topic/TopicObjectFactory.ts');
require('domain/topic/TopicUpdateService.ts');

describe('Topic update service', function() {
  var ContentIdsToAudioTranslationsObjectFactory = null;
  var TopicUpdateService = null;
  var TopicObjectFactory = null;
  var SubtopicObjectFactory = null;
  var SkillSummaryObjectFactory = null;
  var SubtitledHtmlObjectFactory = null;
  var SubtopicPageObjectFactory = null;
  var SubtopicPageContentsObjectFactory = null;
  var UndoRedoService = null;
  var _sampleTopic = null;
  var _firstSkillSummary = null;
  var _secondSkillSummary = null;
  var _thirdSkillSummary = null;
  var _sampleSubtopicPage = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    ContentIdsToAudioTranslationsObjectFactory = $injector.get(
      'ContentIdsToAudioTranslationsObjectFactory');
    TopicUpdateService = $injector.get('TopicUpdateService');
    TopicObjectFactory = $injector.get('TopicObjectFactory');
    SubtitledHtmlObjectFactory = $injector.get('SubtitledHtmlObjectFactory');
    SubtopicObjectFactory = $injector.get('SubtopicObjectFactory');
    SubtopicPageObjectFactory = $injector.get('SubtopicPageObjectFactory');
    SubtopicPageContentsObjectFactory =
      $injector.get('SubtopicPageContentsObjectFactory');
    UndoRedoService = $injector.get('UndoRedoService');
    SkillSummaryObjectFactory = $injector.get('SkillSummaryObjectFactory');

    var sampleTopicBackendObject = {
      topicDict: {
        id: 'sample_topic_id',
        name: 'Topic name',
        description: 'Topic description',
        version: 1,
        uncategorized_skill_ids: ['skill_1'],
        canonical_story_ids: ['story_1'],
        additional_story_ids: ['story_2'],
        subtopics: [{
          id: 1,
          title: 'Title',
          skill_ids: ['skill_2']
        }],
        next_subtopic_id: 2,
        language_code: 'en'
      },
      skillIdToDescriptionDict: {
        skill_1: 'Description 1',
        skill_2: 'Description 2'
      }
    };
    var sampleSubtopicPageObject = {
      id: 'topic_id-1',
      topic_id: 'topic_id',
      page_contents: {
        subtitled_html: {
          html: 'test content',
          content_id: 'content'
        },
        content_ids_to_audio_translations: {
          content: {
            en: {
              filename: 'test.mp3',
              file_size_bytes: 100,
              needs_update: false
            }
          }
        }
      },
      language_code: 'en'
    };
    _firstSkillSummary = SkillSummaryObjectFactory.create(
      'skill_1', 'Description 1');
    _secondSkillSummary = SkillSummaryObjectFactory.create(
      'skill_2', 'Description 2');
    _thirdSkillSummary = SkillSummaryObjectFactory.create(
      'skill_3', 'Description 3');

    _sampleSubtopicPage = SubtopicPageObjectFactory.createFromBackendDict(
      sampleSubtopicPageObject);
    _sampleTopic = TopicObjectFactory.create(
      sampleTopicBackendObject.topicDict,
      sampleTopicBackendObject.skillIdToDescriptionDict);
  }));

  it('should add/remove an additional story id to/from a topic',
    function() {
      expect(_sampleTopic.getAdditionalStoryIds()).toEqual(['story_2']);
      TopicUpdateService.addAdditionalStoryId(_sampleTopic, 'story_3');
      expect(_sampleTopic.getAdditionalStoryIds()).toEqual([
        'story_2', 'story_3'
      ]);

      UndoRedoService.undoChange(_sampleTopic);
      expect(_sampleTopic.getAdditionalStoryIds()).toEqual(['story_2']);
    }
  );

  it('should create a proper backend change dict for adding an additional ' +
    'story id',
  function() {
    TopicUpdateService.addAdditionalStoryId(_sampleTopic, 'story_3');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_topic_property',
      property_name: 'additional_story_ids',
      new_value: ['story_2', 'story_3'],
      old_value: ['story_2']
    }]);
  });

  it('should not create a backend change dict for adding an additional ' +
    'story id when an error is encountered',
  function() {
    expect(function() {
      TopicUpdateService.addAdditionalStoryId(_sampleTopic, 'story_2');
    }).toThrow();
    expect(UndoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should remove/add an additional story id from/to a topic',
    function() {
      expect(_sampleTopic.getAdditionalStoryIds()).toEqual(['story_2']);
      TopicUpdateService.removeAdditionalStoryId(_sampleTopic, 'story_2');
      expect(_sampleTopic.getAdditionalStoryIds()).toEqual([]);

      UndoRedoService.undoChange(_sampleTopic);
      expect(_sampleTopic.getAdditionalStoryIds()).toEqual(['story_2']);
    }
  );

  it('should create a proper backend change dict for removing an additional ' +
    'story id',
  function() {
    TopicUpdateService.removeAdditionalStoryId(_sampleTopic, 'story_2');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_topic_property',
      property_name: 'additional_story_ids',
      new_value: [],
      old_value: ['story_2']
    }]);
  });

  it('should not create a backend change dict for removing an additional ' +
    'story id when an error is encountered',
  function() {
    expect(function() {
      TopicUpdateService.removeAdditionalStoryId(_sampleTopic, 'story_5');
    }).toThrow();
    expect(UndoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should add/remove a canonical story id to/from a topic',
    function() {
      expect(_sampleTopic.getCanonicalStoryIds()).toEqual(['story_1']);
      TopicUpdateService.addCanonicalStoryId(_sampleTopic, 'story_3');
      expect(_sampleTopic.getCanonicalStoryIds()).toEqual([
        'story_1', 'story_3'
      ]);

      UndoRedoService.undoChange(_sampleTopic);
      expect(_sampleTopic.getCanonicalStoryIds()).toEqual(['story_1']);
    }
  );

  it('should create a proper backend change dict for adding a canonical ' +
    'story id',
  function() {
    TopicUpdateService.addCanonicalStoryId(_sampleTopic, 'story_3');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_topic_property',
      property_name: 'canonical_story_ids',
      new_value: ['story_1', 'story_3'],
      old_value: ['story_1']
    }]);
  });

  it('should not create a backend change dict for adding a canonical ' +
    'story id when an error is encountered',
  function() {
    expect(function() {
      TopicUpdateService.addCanonicalStoryId(_sampleTopic, 'story_1');
    }).toThrow();
    expect(UndoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should remove/add a canonical story id from/to a topic',
    function() {
      expect(_sampleTopic.getCanonicalStoryIds()).toEqual(['story_1']);
      TopicUpdateService.removeCanonicalStoryId(_sampleTopic, 'story_1');
      expect(_sampleTopic.getCanonicalStoryIds()).toEqual([]);

      UndoRedoService.undoChange(_sampleTopic);
      expect(_sampleTopic.getCanonicalStoryIds()).toEqual(['story_1']);
    }
  );

  it('should create a proper backend change dict for removing a canonical ' +
    'story id',
  function() {
    TopicUpdateService.removeCanonicalStoryId(_sampleTopic, 'story_1');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_topic_property',
      property_name: 'canonical_story_ids',
      new_value: [],
      old_value: ['story_1']
    }]);
  });

  it('should not create a backend change dict for removing a canonical ' +
    'story id when an error is encountered',
  function() {
    expect(function() {
      TopicUpdateService.removeCanonicalStoryId(_sampleTopic, 'story_10');
    }).toThrow();
    expect(UndoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should add/remove an uncategorized skill id to/from a topic',
    function() {
      expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([
        _firstSkillSummary
      ]);
      TopicUpdateService.addUncategorizedSkill(
        _sampleTopic, _thirdSkillSummary);
      expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([
        _firstSkillSummary, _thirdSkillSummary
      ]);

      UndoRedoService.undoChange(_sampleTopic);
      expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([
        _firstSkillSummary
      ]);
    }
  );

  it('should create a proper backend change dict for adding an uncategorized ' +
    'skill id',
  function() {
    TopicUpdateService.addUncategorizedSkill(
      _sampleTopic, _thirdSkillSummary);
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'add_uncategorized_skill_id',
      new_uncategorized_skill_id: 'skill_3'
    }]);
  });

  it('should not create a backend change dict for adding an uncategorized ' +
    'skill id when an error is encountered',
  function() {
    expect(function() {
      TopicUpdateService.addUncategorizedSkill(
        _sampleTopic, _firstSkillSummary);
    }).toThrow();
    expect(UndoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should remove/add an uncategorized skill id from/to a topic',
    function() {
      expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([
        _firstSkillSummary
      ]);
      TopicUpdateService.removeUncategorizedSkill(
        _sampleTopic, _firstSkillSummary
      );
      expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([]);

      UndoRedoService.undoChange(_sampleTopic);
      expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([
        _firstSkillSummary
      ]);
    }
  );

  it('should create a proper backend change dict for removing an ' +
    'uncategorized skill id',
  function() {
    TopicUpdateService.removeUncategorizedSkill(
      _sampleTopic, _firstSkillSummary);
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'remove_uncategorized_skill_id',
      uncategorized_skill_id: 'skill_1'
    }]);
  });

  it('should not create a backend change dict for removing an uncategorized ' +
    'skill id when an error is encountered',
  function() {
    expect(function() {
      TopicUpdateService.removeUncategorizedSkill(_sampleTopic, 'skill_10');
    }).toThrow();
    expect(UndoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should set/unset changes to a topic\'s name', function() {
    expect(_sampleTopic.getName()).toEqual('Topic name');
    TopicUpdateService.setTopicName(_sampleTopic, 'new name');
    expect(_sampleTopic.getName()).toEqual('new name');

    UndoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getName()).toEqual('Topic name');
  });

  it('should create a proper backend change dict for changing names',
    function() {
      TopicUpdateService.setTopicName(_sampleTopic, 'new name');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_topic_property',
        property_name: 'name',
        new_value: 'new name',
        old_value: 'Topic name'
      }]);
    }
  );

  it('should set/unset changes to a topic\'s description', function() {
    expect(_sampleTopic.getDescription()).toEqual('Topic description');
    TopicUpdateService.setTopicDescription(_sampleTopic, 'new description');
    expect(_sampleTopic.getDescription()).toEqual('new description');

    UndoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getDescription()).toEqual('Topic description');
  });

  it('should create a proper backend change dict for changing descriptions',
    function() {
      TopicUpdateService.setTopicDescription(_sampleTopic, 'new description');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_topic_property',
        property_name: 'description',
        new_value: 'new description',
        old_value: 'Topic description'
      }]);
    }
  );

  it('should set/unset changes to a subtopic\'s title', function() {
    expect(_sampleTopic.getSubtopics()[0].getTitle()).toEqual('Title');
    TopicUpdateService.setSubtopicTitle(_sampleTopic, 1, 'new title');
    expect(_sampleTopic.getSubtopics()[0].getTitle()).toEqual('new title');

    UndoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getSubtopics()[0].getTitle()).toEqual('Title');
  });

  it('should create a proper backend change dict for changing subtopic title',
    function() {
      TopicUpdateService.setSubtopicTitle(_sampleTopic, 1, 'new title');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_subtopic_property',
        subtopic_id: 1,
        property_name: 'title',
        new_value: 'new title',
        old_value: 'Title'
      }]);
    }
  );

  it('should not create a backend change dict for changing subtopic title ' +
    'when an error is encountered',
  function() {
    expect(function() {
      TopicUpdateService.setSubtopicTitle(_sampleTopic, 10, 'title2');
    }).toThrow();
    expect(UndoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should add/remove a subtopic', function() {
    expect(_sampleTopic.getSubtopics().length).toEqual(1);
    TopicUpdateService.addSubtopic(_sampleTopic, 'Title2');
    expect(_sampleTopic.getSubtopics().length).toEqual(2);
    expect(_sampleTopic.getNextSubtopicId()).toEqual(3);
    expect(_sampleTopic.getSubtopics()[1].getTitle()).toEqual('Title2');
    expect(_sampleTopic.getSubtopics()[1].getId()).toEqual(2);

    UndoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getSubtopics().length).toEqual(1);
  });

  it('should create a proper backend change dict for adding a subtopic',
    function() {
      TopicUpdateService.addSubtopic(_sampleTopic, 'Title2');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'add_subtopic',
        subtopic_id: 2,
        title: 'Title2'
      }]);
    }
  );

  it('should remove/add a subtopic', function() {
    expect(_sampleTopic.getSubtopics().length).toEqual(1);
    TopicUpdateService.deleteSubtopic(_sampleTopic, 1);
    expect(_sampleTopic.getSubtopics()).toEqual([]);
    expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([
      _firstSkillSummary, _secondSkillSummary
    ]);

    expect(function() {
      UndoRedoService.undoChange(_sampleTopic);
    }).toThrow();
  });

  it('should properly remove/add a newly created subtopic', function() {
    TopicUpdateService.addSubtopic(_sampleTopic, 'Title2');
    TopicUpdateService.addSubtopic(_sampleTopic, 'Title3');
    expect(_sampleTopic.getSubtopics()[1].getId()).toEqual(2);
    expect(_sampleTopic.getSubtopics()[2].getId()).toEqual(3);
    expect(_sampleTopic.getNextSubtopicId()).toEqual(4);

    TopicUpdateService.deleteSubtopic(_sampleTopic, 2);
    expect(_sampleTopic.getSubtopics().length).toEqual(2);
    expect(_sampleTopic.getSubtopics()[1].getTitle()).toEqual('Title3');
    expect(_sampleTopic.getSubtopics()[1].getId()).toEqual(2);
    expect(_sampleTopic.getNextSubtopicId()).toEqual(3);

    expect(UndoRedoService.getChangeCount()).toEqual(1);
  });

  it('should create a proper backend change dict for deleting a subtopic',
    function() {
      TopicUpdateService.deleteSubtopic(_sampleTopic, 1);
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'delete_subtopic',
        subtopic_id: 1
      }]);
    }
  );

  it('should not create a backend change dict for deleting a subtopic ' +
    'when an error is encountered',
  function() {
    expect(function() {
      TopicUpdateService.deleteSubtopic(_sampleTopic, 10);
    }).toThrow();
    expect(UndoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should move a skill id to a subtopic', function() {
    expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([
      _firstSkillSummary
    ]);
    expect(_sampleTopic.getSubtopics()[0].getSkillSummaries()).toEqual([
      _secondSkillSummary
    ]);
    TopicUpdateService.moveSkillToSubtopic(
      _sampleTopic, null, 1, _firstSkillSummary);
    expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([]);
    expect(_sampleTopic.getSubtopics()[0].getSkillSummaries()).toEqual([
      _secondSkillSummary, _firstSkillSummary
    ]);

    UndoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([
      _firstSkillSummary
    ]);
    expect(_sampleTopic.getSubtopics()[0].getSkillSummaries()).toEqual([
      _secondSkillSummary
    ]);
  });

  it('should correctly create changelists when moving a skill to a newly ' +
    'created subtopic that has since been deleted', function() {
    TopicUpdateService.addSubtopic(_sampleTopic, 'Title 2');
    TopicUpdateService.moveSkillToSubtopic(
      _sampleTopic, null, 2, _firstSkillSummary
    );
    TopicUpdateService.removeSkillFromSubtopic(
      _sampleTopic, 2, _firstSkillSummary
    );
    TopicUpdateService.deleteSubtopic(_sampleTopic, 2);
    expect(UndoRedoService.getCommittableChangeList()).toEqual([]);

    TopicUpdateService.addSubtopic(_sampleTopic, 'Title 2');
    TopicUpdateService.moveSkillToSubtopic(
      _sampleTopic, 1, 2, _secondSkillSummary
    );
    TopicUpdateService.moveSkillToSubtopic(
      _sampleTopic, 2, 1, _secondSkillSummary
    );
    TopicUpdateService.deleteSubtopic(_sampleTopic, 2);
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'remove_skill_id_from_subtopic',
      skill_id: 'skill_2',
      subtopic_id: 1
    }, {
      cmd: 'move_skill_id_to_subtopic',
      skill_id: 'skill_2',
      new_subtopic_id: 1,
      old_subtopic_id: null
    }]);
    UndoRedoService.clearChanges();

    TopicUpdateService.addSubtopic(_sampleTopic, 'Title 2');
    TopicUpdateService.moveSkillToSubtopic(
      _sampleTopic, null, 2, _firstSkillSummary
    );
    TopicUpdateService.moveSkillToSubtopic(
      _sampleTopic, 1, 2, _secondSkillSummary
    );
    TopicUpdateService.deleteSubtopic(_sampleTopic, 2);
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'remove_skill_id_from_subtopic',
      skill_id: 'skill_2',
      subtopic_id: 1
    }]);
  });

  it('should create properly decrement subtopic ids of later subtopics when ' +
    'a newly created subtopic is deleted', function() {
    TopicUpdateService.addSubtopic(_sampleTopic, 'Title 2');
    TopicUpdateService.addSubtopic(_sampleTopic, 'Title 3');
    TopicUpdateService.moveSkillToSubtopic(
      _sampleTopic, 1, 3, _secondSkillSummary
    );
    TopicUpdateService.deleteSubtopic(_sampleTopic, 2);
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'add_subtopic',
      title: 'Title 3',
      subtopic_id: 2
    }, {
      cmd: 'move_skill_id_to_subtopic',
      old_subtopic_id: 1,
      new_subtopic_id: 2,
      skill_id: 'skill_2'
    }]);
  });

  it('should create a proper backend change dict for moving a skill id to a ' +
    'subtopic',
  function() {
    TopicUpdateService.moveSkillToSubtopic(
      _sampleTopic, null, 1, _firstSkillSummary);
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'move_skill_id_to_subtopic',
      old_subtopic_id: null,
      new_subtopic_id: 1,
      skill_id: 'skill_1'
    }]);
  });

  it('should not create a backend change dict for moving a skill id to a' +
    'subtopic when an error is encountered',
  function() {
    expect(function() {
      TopicUpdateService.moveSkillToSubtopic(
        _sampleTopic, null, 1, _secondSkillSummary);
    }).toThrow();
    expect(function() {
      TopicUpdateService.moveSkillToSubtopic(
        _sampleTopic, 1, 2, _secondSkillSummary);
    }).toThrow();
    expect(UndoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should remove a skill id from a subtopic', function() {
    expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([
      _firstSkillSummary
    ]);
    expect(_sampleTopic.getSubtopics()[0].getSkillSummaries()).toEqual([
      _secondSkillSummary
    ]);
    TopicUpdateService.removeSkillFromSubtopic(
      _sampleTopic, 1, _secondSkillSummary);
    expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([
      _firstSkillSummary, _secondSkillSummary
    ]);
    expect(_sampleTopic.getSubtopics()[0].getSkillSummaries()).toEqual([]);

    UndoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([
      _firstSkillSummary
    ]);
    expect(_sampleTopic.getSubtopics()[0].getSkillSummaries()).toEqual([
      _secondSkillSummary
    ]);
  });

  it('should create a proper backend change dict for removing a skill id ' +
    'from a subtopic',
  function() {
    TopicUpdateService.removeSkillFromSubtopic(
      _sampleTopic, 1, _secondSkillSummary);
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'remove_skill_id_from_subtopic',
      subtopic_id: 1,
      skill_id: 'skill_2'
    }]);
  });

  it('should not create a backend change dict for removing a skill id from a' +
    'subtopic when an error is encountered',
  function() {
    expect(function() {
      TopicUpdateService.removeSkillFromSubtopic(
        _sampleTopic, 1, _firstSkillSummary);
    }).toThrow();
    expect(UndoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should set/unset changes to a topic\'s language code', function() {
    expect(_sampleTopic.getLanguageCode()).toEqual('en');
    TopicUpdateService.setTopicLanguageCode(_sampleTopic, 'fi');
    expect(_sampleTopic.getLanguageCode()).toEqual('fi');

    UndoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getLanguageCode()).toEqual('en');
  });

  it('should create a proper backend change dict for changing language codes',
    function() {
      TopicUpdateService.setTopicLanguageCode(_sampleTopic, 'fi');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_topic_property',
        property_name: 'language_code',
        new_value: 'fi',
        old_value: 'en'
      }]);
    }
  );

  it('should set/unset changes to a subtopic page\'s page content', function() {
    var newSampleSubtitledHtmlDict = {
      html: 'new content',
      content_id: 'content'
    };
    var newSampleSubtitledHtml =
      SubtitledHtmlObjectFactory.createFromBackendDict(
        newSampleSubtitledHtmlDict);
    expect(_sampleSubtopicPage.getPageContents().toBackendDict()).toEqual({
      subtitled_html: {
        html: 'test content',
        content_id: 'content'
      },
      content_ids_to_audio_translations: {
        content: {
          en: {
            filename: 'test.mp3',
            file_size_bytes: 100,
            needs_update: false
          }
        }
      }
    });
    TopicUpdateService.setSubtopicPageContentsHtml(
      _sampleSubtopicPage, 1, newSampleSubtitledHtml);
    expect(_sampleSubtopicPage.getPageContents().toBackendDict()).toEqual({
      subtitled_html: {
        html: 'new content',
        content_id: 'content'
      },
      content_ids_to_audio_translations: {
        content: {
          en: {
            filename: 'test.mp3',
            file_size_bytes: 100,
            needs_update: false
          }
        }
      }
    });

    UndoRedoService.undoChange(_sampleSubtopicPage);
    expect(_sampleSubtopicPage.getPageContents().toBackendDict()).toEqual({
      subtitled_html: {
        html: 'test content',
        content_id: 'content'
      },
      content_ids_to_audio_translations: {
        content: {
          en: {
            filename: 'test.mp3',
            file_size_bytes: 100,
            needs_update: false
          }
        }
      }
    });
  });

  it('should create a proper backend change dict for changing html data',
    function() {
      var newSampleSubtitledHtmlDict = {
        html: 'new content',
        content_id: 'content'
      };
      var newSampleSubtitledHtml =
        SubtitledHtmlObjectFactory.createFromBackendDict(
          newSampleSubtitledHtmlDict);
      TopicUpdateService.setSubtopicPageContentsHtml(
        _sampleSubtopicPage, 1, newSampleSubtitledHtml);
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_subtopic_page_property',
        property_name: 'page_contents_html',
        subtopic_id: 1,
        new_value: newSampleSubtitledHtml.toBackendDict(),
        old_value: {
          html: 'test content',
          content_id: 'content'
        }
      }]);
    }
  );

  it('should create a proper backend change dict for changing subtopic ' +
     'page audio data',
  function() {
    var newSampleAudioDict = {
      content: {
        en: {
          filename: 'test_2.mp3',
          file_size_bytes: 1000,
          needs_update: false
        }
      },
    };
    var newSampleAudio =
      ContentIdsToAudioTranslationsObjectFactory
        .createFromBackendDict(newSampleAudioDict);
    TopicUpdateService.setSubtopicPageContentsAudio(
      _sampleSubtopicPage, 1, newSampleAudio);
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_subtopic_page_property',
      property_name: 'page_contents_audio',
      subtopic_id: 1,
      new_value: newSampleAudio.toBackendDict(),
      old_value: {
        content: {
          en: {
            filename: 'test.mp3',
            file_size_bytes: 100,
            needs_update: false
          }
        }
      }
    }]);
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for CreatorDashboardBackendApiService.
 */

require(
  'domain/topics_and_skills_dashboard/' +
  'TopicsAndSkillsDashboardBackendApiService.ts'
);
require('domain/utilities/UrlInterpolationService.ts');

describe('Topics and Skills Dashboard backend API service', function() {
  var TopicsAndSkillsDashboardBackendApiService = null;
  var $httpBackend = null;
  var UrlInterpolationService = null;
  var SAMPLE_TOPIC_ID = 'hyuy4GUlvTqJ';

  var sampleDataResults = {
    topic_summary_dicts: [{
      id: SAMPLE_TOPIC_ID,
      name: 'Sample Name',
      language_code: 'en',
      version: 1,
      canonical_story_count: 3,
      additional_story_count: 0,
      uncategorized_skill_count: 3,
      subtopic_count: 3,
      topic_model_created_on: 1466178691847.67,
      topic_model_last_updated: 1466178759209.839
    }],
    skill_summary_dicts: []
  };

  var TOPICS_AND_SKILLS_DASHBOARD_DATA_URL =
    '/topics_and_skills_dashboard/data';
  var ERROR_STATUS_CODE = 500;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(
    angular.mock.module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

  beforeEach(angular.mock.inject(function($injector) {
    TopicsAndSkillsDashboardBackendApiService = $injector.get(
      'TopicsAndSkillsDashboardBackendApiService');
    UrlInterpolationService = $injector.get('UrlInterpolationService');
    $httpBackend = $injector.get('$httpBackend');
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully fetch topics and skills dashboard data from the ' +
      'backend',
  function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    $httpBackend.expect('GET', TOPICS_AND_SKILLS_DASHBOARD_DATA_URL).respond(
      sampleDataResults);
    TopicsAndSkillsDashboardBackendApiService.fetchDashboardData().then(
      successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should use rejection handler if dashboard data backend request failed',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', TOPICS_AND_SKILLS_DASHBOARD_DATA_URL).respond(
        ERROR_STATUS_CODE, 'Error loading dashboard data.');
      TopicsAndSkillsDashboardBackendApiService.fetchDashboardData().then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    }
  );
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for CreatorDashboardBackendApiService.
 */

require('domain/user/UserInfoObjectFactory.ts');

describe('User info factory', function() {
  var UserInfoObjectFactory = null;

  var sampleUserInfoBackendObject = {
    is_moderator: true,
    is_admin: false,
    is_super_admin: false,
    is_topic_manager: false,
    can_create_collections: true,
    preferred_site_language_code: 'en',
    username: 'tester',
    user_is_logged_in: true
  };

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    UserInfoObjectFactory = $injector.get('UserInfoObjectFactory');
  }));

  it('should create correct UserInfo obeject from backend dict', function() {
    var userInfo = UserInfoObjectFactory.createFromBackendDict(
      sampleUserInfoBackendObject);

    expect(userInfo.isModerator()).toBe(true);
    expect(userInfo.isAdmin()).toBe(false);
    expect(userInfo.isSuperAdmin()).toBe(false);
    expect(userInfo.isTopicManager()).toBe(false);
    expect(userInfo.canCreateCollections()).toBe(true);
    expect(userInfo.getPreferredSiteLanguageCode()).toBe('en');
    expect(userInfo.getUsername()).toBe('tester');
    expect(userInfo.isLoggedIn()).toBe(true);
  });

  it('should create correct default UserInfo object', function() {
    var userInfo = UserInfoObjectFactory.createDefault();
    expect(userInfo.isModerator()).toBe(false);
    expect(userInfo.isAdmin()).toBe(false);
    expect(userInfo.isSuperAdmin()).toBe(false);
    expect(userInfo.isTopicManager()).toBe(false);
    expect(userInfo.canCreateCollections()).toBe(false);
    expect(userInfo.getPreferredSiteLanguageCode()).toBeNull();
    expect(userInfo.getUsername()).toBeNull();
    expect(userInfo.isLoggedIn()).toBe(false);
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for AudioLanguageObjectFactory.
 */

require('domain/utilities/AudioLanguageObjectFactory.ts');

describe('AudioLanguage object factory', function() {
  var audioLanguage = null;
  var alof = null;
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector) {
    alof = $injector.get('AudioLanguageObjectFactory');

    audioLanguage = alof.createFromDict({
      id: 'a',
      description: 'a description',
      related_languages: 'English',
    });
  }));

  it('should set attributes correctly', function() {
    expect(audioLanguage.id).toEqual('a');
    expect(audioLanguage.description).toEqual('a description');
    expect(audioLanguage.relatedLanguages).toEqual('English');
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for AutogeneratedAudioLanguageObjectFactory.
 */

require('domain/utilities/AutogeneratedAudioLanguageObjectFactory.ts');

describe('AutogeneratedAudioLanguage object factory', function() {
  var autogenAudioLanguage = null;
  var aalof = null;
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector) {
    aalof = $injector.get('AutogeneratedAudioLanguageObjectFactory');

    autogenAudioLanguage = aalof.createFromDict({
      id: 'a',
      description: 'a description',
      exploration_language: 'English',
      speech_synthesis_code: '1',
      speech_synthesis_code_mobile: '2'
    });
  }));

  it('should set attributes correctly', function() {
    expect(autogenAudioLanguage.id).toEqual('a');
    expect(autogenAudioLanguage.description).toEqual('a description');
    expect(autogenAudioLanguage.explorationLanguage).toEqual('English');
    expect(autogenAudioLanguage.speechSynthesisCode).toEqual('1');
    expect(autogenAudioLanguage.speechSynthesisCodeMobile).toEqual('2');
  });
});
// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for LanguageUtilService
 */

require('domain/utilities/LanguageUtilService.ts');

describe('Language util service', function() {
  var lus = null;
  var mockAutogeneratedAudioLanguages = null;
  beforeEach(function() {
    angular.mock.module('oppia', function($provide) {
      var mockAllLanguageCodes = [{
        code: 'en',
        description: 'English'
      }, {
        code: 'ar',
        description: 'العربية (Arabic)'
      }, {
        code: 'bg',
        description: 'български (Bulgarian)'
      }];
      mockAutogeneratedAudioLanguages = [{
        id: 'en-auto',
        description: 'English (auto)',
        exploration_language: 'en',
        speech_synthesis_code: 'en-GB',
        speech_synthesis_code_mobile: 'en_US'
      }];
      var mockSupportedAudioLanguages = [{
        id: 'en',
        description: 'English',
        related_languages: ['en']
      }, {
        id: 'hi-en',
        description: 'Hinglish',
        related_languages: ['hi', 'en']
      }, {
        id: 'es',
        description: 'Spanish',
        related_languages: ['es']
      }];
      $provide.constant('ALL_LANGUAGE_CODES',
        mockAllLanguageCodes);
      $provide.constant('AUTOGENERATED_AUDIO_LANGUAGES',
        mockAutogeneratedAudioLanguages);
      $provide.constant('SUPPORTED_AUDIO_LANGUAGES',
        mockSupportedAudioLanguages);
      // Chrome loads voices asynchronously.
      // https://stackoverflow.com/questions/21513706/
      window.speechSynthesis.onvoiceschanged = function() {
        $provide.value('BrowserCheckerService'), {
          supportsSpeechSynthesis: function() {
            return true;
          }
        };
      };
    });
  });

  beforeEach(angular.mock.inject(function($injector) {
    lus = $injector.get('LanguageUtilService');
  }));

  it('should get the correct language count', function() {
    expect(lus.getAudioLanguagesCount()).toEqual(3);
  });

  it('should get the correct description given an audio language code',
    function() {
      expect(lus.getAudioLanguageDescription('en')).toEqual('English');
      expect(lus.getAudioLanguageDescription('hi-en')).toEqual('Hinglish');
      expect(lus.getAudioLanguageDescription('es')).toEqual('Spanish');
    }
  );

  it('should correctly compute the complement languages', function() {
    expect(lus.getComplementAudioLanguageCodes([]))
      .toEqual(['en', 'hi-en', 'es']);
    expect(lus.getComplementAudioLanguageCodes(['en']))
      .toEqual(['hi-en', 'es']);
    expect(lus.getComplementAudioLanguageCodes(['hi-en']))
      .toEqual(['en', 'es']);
    expect(lus.getComplementAudioLanguageCodes(['hi-en', 'en']))
      .toEqual(['es']);
    expect(lus.getComplementAudioLanguageCodes(['abcdefg'])).toEqual([
      'en', 'hi-en', 'es']);
  });

  it('should correctly get related language code given audio language code',
    function() {
      expect(lus.getLanguageCodesRelatedToAudioLanguageCode('en')).
        toEqual(['en']);
      expect(lus.getLanguageCodesRelatedToAudioLanguageCode('hi-en')).
        toEqual(['hi', 'en']);
      expect(lus.getLanguageCodesRelatedToAudioLanguageCode('es')).
        toEqual(['es']);
    });

  it('should correctly check if language supports autogenerated audio',
    function() {
      // Chrome loads voices asynchronously.
      // https://stackoverflow.com/questions/21513706/
      window.speechSynthesis.onvoiceschanged = function() {
        expect(lus.supportsAutogeneratedAudio('hi')).toEqual(false);
        expect(lus.supportsAutogeneratedAudio('en')).toEqual(true);
      };
    });

  it('should correctly check if audio language is autogenerated', function() {
    expect(lus.isAutogeneratedAudioLanguage('en')).toEqual(false);
    expect(lus.isAutogeneratedAudioLanguage('en-auto')).toEqual(true);
  });

  it('should get correct autogenerated audio language with given code',
    function() {
      expect(Object.values(lus.getAutogeneratedAudioLanguage('en'))).toEqual(
        Object.values(mockAutogeneratedAudioLanguages[0]));
    });

  it('should correctly get all languge ids and text', function() {
    expect(lus.getLanguageIdsAndTexts()).toEqual([{
      id: 'en',
      text: 'English'
    }, {
      id: 'ar',
      text: 'العربية'
    }, {
      id: 'bg',
      text: 'български'
    }]);
  });
});
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
 * @fileoverview Unit tests for StopwatchObjectFactory.
 */

require('domain/utilities/StopwatchObjectFactory.ts');

describe('Stopwatch object factory', function() {
  beforeEach(angular.mock.module('oppia'));

  describe('stopwatch object factory', function() {
    var StopwatchObjectFactory = null;
    var errorLog = [];

    beforeEach(angular.mock.inject(function($injector) {
      StopwatchObjectFactory = $injector.get('StopwatchObjectFactory');
      spyOn($injector.get('$log'), 'error').and.callFake(
        function(errorMessage) {
          errorLog.push(errorMessage);
        }
      );
    }));

    var changeCurrentTime = function(stopwatch, desiredCurrentTime) {
      stopwatch._getCurrentTime = function() {
        return desiredCurrentTime;
      };
    };

    it('should correctly record time intervals', function() {
      var stopwatch = StopwatchObjectFactory.create();
      changeCurrentTime(stopwatch, 0);
      stopwatch.reset();
      changeCurrentTime(stopwatch, 500);
      expect(stopwatch.getTimeInSecs()).toEqual(0.5);
    });

    it('should not reset stopwatch when current time is retrieved', function() {
      var stopwatch = StopwatchObjectFactory.create();
      changeCurrentTime(stopwatch, 0);
      stopwatch.reset();
      changeCurrentTime(stopwatch, 500);
      expect(stopwatch.getTimeInSecs()).toEqual(0.5);
      expect(stopwatch.getTimeInSecs()).toEqual(0.5);
    });

    it('should correctly reset the stopwatch', function() {
      var stopwatch = StopwatchObjectFactory.create();
      changeCurrentTime(stopwatch, 0);
      stopwatch.reset();
      changeCurrentTime(stopwatch, 500);
      expect(stopwatch.getTimeInSecs()).toEqual(0.5);
      stopwatch.reset();
      expect(stopwatch.getTimeInSecs()).toEqual(0);
      changeCurrentTime(stopwatch, 800);
      expect(stopwatch.getTimeInSecs()).toEqual(0.3);
    });

    it('should error if getTimeInSecs() is called before reset()', function() {
      var stopwatch = StopwatchObjectFactory.create();
      changeCurrentTime(stopwatch, 29);
      expect(stopwatch.getTimeInSecs()).toBeNull();
      expect(errorLog).toEqual([
        'Tried to retrieve the elapsed time, but no start time was set.']);
    });

    it('should instantiate independent stopwatches', function() {
      var stopwatch1 = StopwatchObjectFactory.create();
      var stopwatch2 = StopwatchObjectFactory.create();

      changeCurrentTime(stopwatch1, 0);
      changeCurrentTime(stopwatch2, 0);
      stopwatch1.reset();

      changeCurrentTime(stopwatch1, 50);
      changeCurrentTime(stopwatch2, 50);
      stopwatch2.reset();

      changeCurrentTime(stopwatch1, 100);
      changeCurrentTime(stopwatch2, 100);
      expect(stopwatch1.getTimeInSecs()).toEqual(0.1);
      expect(stopwatch2.getTimeInSecs()).toEqual(0.05);
    });
  });
});
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
 * @fileoverview Unit tests for StopwatchObjectFactory.
 */

require('domain/utilities/StopwatchObjectFactory.ts');

describe('Stopwatch object factory', function() {
  beforeEach(angular.mock.module('oppia'));

  describe('stopwatch object factory', function() {
    var StopwatchObjectFactory = null;
    var errorLog = [];

    beforeEach(angular.mock.inject(function($injector) {
      StopwatchObjectFactory = $injector.get('StopwatchObjectFactory');
      spyOn($injector.get('$log'), 'error').and.callFake(
        function(errorMessage) {
          errorLog.push(errorMessage);
        }
      );
    }));

    var changeCurrentTime = function(stopwatch, desiredCurrentTime) {
      stopwatch._getCurrentTime = function() {
        return desiredCurrentTime;
      };
    };

    it('should correctly record time intervals', function() {
      var stopwatch = StopwatchObjectFactory.create();
      changeCurrentTime(stopwatch, 0);
      stopwatch.reset();
      changeCurrentTime(stopwatch, 500);
      expect(stopwatch.getTimeInSecs()).toEqual(0.5);
    });

    it('should not reset stopwatch when current time is retrieved', function() {
      var stopwatch = StopwatchObjectFactory.create();
      changeCurrentTime(stopwatch, 0);
      stopwatch.reset();
      changeCurrentTime(stopwatch, 500);
      expect(stopwatch.getTimeInSecs()).toEqual(0.5);
      expect(stopwatch.getTimeInSecs()).toEqual(0.5);
    });

    it('should correctly reset the stopwatch', function() {
      var stopwatch = StopwatchObjectFactory.create();
      changeCurrentTime(stopwatch, 0);
      stopwatch.reset();
      changeCurrentTime(stopwatch, 500);
      expect(stopwatch.getTimeInSecs()).toEqual(0.5);
      stopwatch.reset();
      expect(stopwatch.getTimeInSecs()).toEqual(0);
      changeCurrentTime(stopwatch, 800);
      expect(stopwatch.getTimeInSecs()).toEqual(0.3);
    });

    it('should error if getTimeInSecs() is called before reset()', function() {
      var stopwatch = StopwatchObjectFactory.create();
      changeCurrentTime(stopwatch, 29);
      expect(stopwatch.getTimeInSecs()).toBeNull();
      expect(errorLog).toEqual([
        'Tried to retrieve the elapsed time, but no start time was set.']);
    });

    it('should instantiate independent stopwatches', function() {
      var stopwatch1 = StopwatchObjectFactory.create();
      var stopwatch2 = StopwatchObjectFactory.create();

      changeCurrentTime(stopwatch1, 0);
      changeCurrentTime(stopwatch2, 0);
      stopwatch1.reset();

      changeCurrentTime(stopwatch1, 50);
      changeCurrentTime(stopwatch2, 50);
      stopwatch2.reset();

      changeCurrentTime(stopwatch1, 100);
      changeCurrentTime(stopwatch2, 100);
      expect(stopwatch1.getTimeInSecs()).toEqual(0.1);
      expect(stopwatch2.getTimeInSecs()).toEqual(0.05);
    });
  });
});
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

// This file defines the evaluation engine as well as the system operators.
// The evaluator takes the output of the parser (i.e. parse tree) as defined in
// parser.pegjs and produces a javaScript primitive value when the evaluation is
// performed correctly.
// Two cases that can throw an exception (i.e. an Error object):
// - Variable look-up ('#' operator) failure. (ExprUndefinedVarError)
// - Wrong number of arguments in the node for the given operator.
//   (ExprWrongNumArgsError)
// Both errors are children of ExpressionError, so caller can use
// ExpressionError to catch only these expected error cases.
//
// An expression is evaluated in a context consisting of predefined system
// variables, system operators, and system functions. In the input language,
// operators are predefined set of characters in infix, postfix, or ternary
// format (there is currently no postfix operators) while functions have the
// form of function calls (e.g. "abs(10)"). In the parse tree, there is no
// difference between operators and functions. User defined parameters may
// override the meaning of system variables and functions (but not operators).
// Users also can define parameters with new names. Referencing a variable which
// is not defined as a system variable, system function, or user parameter will
// result in ExprUndefinedVarError to be thrown.
//
// All system variables, system operators, and system functions are defined
// as 'system' variable in this file.
//
// TODO(kashida): Split the following section into two:
//     - A general overview of operators (including some concrete examples)
//     - A numbered sequence of steps which a new contributor should follow in
//         order to define a new operator.
// Defining new operators and functions:
// Operators and functions are given an array of arguments which are already all
// evaluated. E.g. for an expression "1 + 2 * 3", the "+" plus operator receives
// values 1 and 6 (i.e. "2 * 3" already evaluated).
// The operators and functions should verify that the argument array
// has the required number of arguments. Operators and functions can coerse the
// input arguments to the desired typed values, or throw an exception if wrong
// type of argument is given.
// type of inputs. This does not prevent operators to eror on wrong parameter
// values (e.g. getting negative number for an index).
// When successful, operators and functions may return any valid JavaScript
// values. In general, an operator always returns the same type of value, but
// there are exceptions (e.g. "+" operator may return a number or a string
// depending on the types of the input arguments).
// Constraints on the input arguments (number, types, and any other
// constraints) as well as the output value and type should be documented.

/**
 * @fileoverview Service for expression evaluation.
 */

require('expressions/ExpressionParserService.js');
require('expressions/ExpressionSyntaxTreeService.ts');

// Service for expression evaluation.
var oppia = require('AppInit.ts').moduleName;

oppia.factory('ExpressionEvaluatorService', [
  '$log', 'ExpressionParserService', 'ExpressionSyntaxTreeService',
  function($log, ExpressionParserService, ExpressionSyntaxTreeService) {
    var evaluateExpression = function(expression, envs) {
      return ExpressionSyntaxTreeService.applyFunctionToParseTree(
        ExpressionParserService.parse(expression), envs, evaluate);
    };

    /**
     * @param {*} parsed Parse output from the parser. See parser.pegjs for
     *     the data structure.
     * @param {!Array.<!Object>} envs Represents a nested name space
     *     environment to look up the name in. The first element is looked up
     *     first (i.e. has higher precedence).
     */
    var evaluate = function(parsed, envs) {
      // The intermediate nodes of the parse tree are arrays. The terminal
      // nodes are JavaScript primitives (as described in the "Parser output"
      // section of parser.pegjs).
      if (parsed instanceof Array) {
        if (parsed.length === 0) {
          throw 'Parser generated an intermediate node with zero children';
        }

        if (parsed[0] === '#') {
          return ExpressionSyntaxTreeService.lookupEnvs(parsed[1], envs);
        }

        // Evaluate rest of the elements, i.e. the arguments.
        var args = parsed.slice(1).map(function(item) {
          return evaluate(item, envs);
        });
        // The first element should be a function name.
        return ExpressionSyntaxTreeService.lookupEnvs(
          parsed[0], envs).eval(args);
      }

      // This should be a terminal node with the actual value.
      return parsed;
    };

    return {
      evaluate: evaluate,
      evaluateExpression: evaluateExpression,
    };
  }
]);
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
 * @fileoverview Unit tests for Expression Evaluator Service.
 */

require('App.ts');
require('expressions/ExpressionEvaluatorService.ts');
require('expressions/ExpressionParserService.js');
require('expressions/ExpressionSyntaxTreeService.ts');
require('services/UtilsService.ts');

describe('Expression evaluator service', function() {
  beforeEach(angular.mock.module('oppia'));

  var ees = null;
  var eps = null;
  var ests = null;
  var isString = null;
  beforeEach(angular.mock.inject(function($injector) {
    ees = $injector.get('ExpressionEvaluatorService');
    eps = $injector.get('ExpressionParserService');
    ests = $injector.get('ExpressionSyntaxTreeService');
    isString = $injector.get('UtilsService').isString;
  }));

  var ENVS = [
    {
      numZero: 0,
      boolTrue: true,
      strXYZ: 'XYZ',
      num100_001: 100.001,
      boolFalse: false,
      strNull: ''
    }
  ];

  it('should get params used in expressions', function() {
    [
      ['numZero', ['numZero']],
      ['b + a', ['a', 'b']],
      ['a + b + a', ['a', 'b']],
      ['+10', []],
      ['2   + 10', []],
      ['num100_001   + numZero', ['num100_001', 'numZero']],
      ['20 - num100_001', ['num100_001']],
      ['0x100 - 256', []],
      ['!strNull', ['strNull']],
      ['1 - 2 * 3', []],
      ['num100_001 / 0.1', ['num100_001']],
      ['floor((numZero + num100_001)/2)', ['num100_001', 'numZero']],
      ['23 % 5', []],
      ['1 <= numZero || 1 >= numZero', ['numZero']],
      ['100 < num100_001 && 1 > num100_001', ['num100_001']],
      ['boolTrue == boolFalse', ['boolFalse', 'boolTrue']],
      ['strNull != strXYZ', ['strNull', 'strXYZ']],
      ['if boolFalse then boolTrue else numZero', [
        'boolFalse', 'boolTrue', 'numZero']],
      ['num100_001 / 0', ['num100_001']],
      ['abs(-3)', []],
      ['pow(num100_001, numZero)', ['num100_001', 'numZero']],
      ['log(9, 3)', []],
      ['numZero + numOne', ['numOne', 'numZero']]
    ].forEach(function(test) {
      var expression = test[0];
      var expectedParams = test[1];

      var parsed = (
        isString(expression) ? eps.parse(expression) : expression);
      var parsedJson = JSON.stringify(parsed);
      var failed = false;

      var recordFailure = function(params, exception) {
        console.error('input           : ' + expression);
        console.error('parsed          : ' + parsedJson);
        console.error('expected        : ' + JSON.stringify(expectedParams));
        if (params !== undefined) {
          console.error('evaluated       : ' + params);
        } else {
          console.error('exception       : ' + exception);
        }
        failed = true;
      };

      try {
        var params = ests.getParamsUsedInExpression(expression);
        if (!angular.equals(params, expectedParams)) {
          recordFailure(params, undefined);
        }
      } catch (e) {
        recordFailure(undefined, e);
      }
      expect(failed).toBe(false);
    });
  });

  it('should evaluate to correct values', function() {
    [
      ['numZero', 0],
      ['+10', 10],
      ['2   + 10', 12],
      ['num100_001   + numZero', 100.001],
      ['20 - num100_001', -80.001],
      ['0x100 - 256', 0],
      ['!strNull', true],
      ['1 - 2 * 3', -5],
      ['num100_001 / 0.1', 1000.01],
      ['floor((numZero + num100_001)/2)', 50],
      ['23 % 5', 3],
      ['1 <= numZero || 1 >= numZero', true],
      ['100 < num100_001 && 1 > num100_001', false],
      ['boolTrue == boolFalse', false],
      ['strNull != strXYZ', true],
      ['if boolFalse then boolTrue else numZero', 0],
      ['num100_001 / 0', Infinity],
      ['abs(-3)', 3],
      ['pow(num100_001, numZero)', 1],
      ['log(9, 3)', 2],
      ['numZero + numOne', ests.ExprUndefinedVarError],
      [['+', 10, 20, 30], ests.ExprWrongNumArgsError],
      [['==', true], ests.ExprWrongNumArgsError],
      [['+', 'abc', 1], ests.ExprWrongArgTypeError]
    ].forEach(function(test) {
      var expression = test[0];
      var expected = test[1];

      // 'expected' should be either a JavaScript primitive value that would be
      // the result of evaluation 'expression', or an exception that is
      // expected to be thrown.
      // 'expression' is either a string (in which case parsed) or an array
      // (representing a parse tree).
      var parsed = (
        isString(expression) ? eps.parse(expression) : expression);
      var parsedJson = JSON.stringify(parsed);
      var failed = false;

      var recordFailure = function(result, exception) {
        console.error('input     : ' + expression);
        console.error('parsed    : ' + parsedJson);
        if (result !== undefined) {
          console.error('evaluated : ' + result);
          console.error('expected  : ' + expected);
        }
        if (exception !== undefined) {
          console.error('exception : ' + exception);
          console.error('expected  : (exception)');
        }
        failed = true;
      };

      try {
        var evaled = ests.applyFunctionToParseTree(parsed, ENVS, ees.evaluate);
        if (expected instanceof Error || evaled !== expected) {
          recordFailure(evaled, undefined);
        }
      } catch (e) {
        if (!(e instanceof expected)) {
          // Wrong or unexpected exception.
          recordFailure(undefined, e);
        }
      }
      expect(failed).toBe(false);

      if (typeof expression !== 'string') {
        return;
      }

      failed = false;
      try {
        evaled = ees.evaluateExpression(expression, ENVS);
        if (expected instanceof Error || evaled !== expected) {
          recordFailure(evaled, undefined);
        }
      } catch (e) {
        if (!(e instanceof expected)) {
          // Wrong or unexpected exception.
          recordFailure(undefined, e);
        }
      }
      expect(failed).toBe(false);
    });
  });
});
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
 * @fileoverview Unit tests for ExpressionInterpolationService.
 */

require('App.ts');
require('expressions/ExpressionInterpolationService.ts');

describe('Expression interpolation service', function() {
  beforeEach(angular.mock.module('oppia'));

  describe('expression interpolation service', function() {
    var ExpressionInterpolationService = null;

    beforeEach(angular.mock.inject(function($injector) {
      ExpressionInterpolationService = $injector.get(
        'ExpressionInterpolationService');
    }));

    it('should correctly interpolate and escape HTML strings', function() {
      expect(ExpressionInterpolationService.processHtml('abc', [{}])).toEqual(
        'abc');
      expect(ExpressionInterpolationService.processHtml('abc{{a}}', [{
        a: 'b'
      }])).toEqual('abcb');
      expect(ExpressionInterpolationService.processHtml('abc{{a}}', [{
        a: '<script></script>'
      }])).toEqual('abc&lt;script&gt;&lt;/script&gt;');
      expect(ExpressionInterpolationService.processHtml(
        'abc{{a}}', [{}])
      ).toEqual('abc<oppia-expression-error-tag></oppia-expression-error-tag>');
      expect(ExpressionInterpolationService.processHtml('abc{{a{{b}}}}', [{
        a: '1',
        b: '2'
      }])).toEqual(
        'abc<oppia-expression-error-tag></oppia-expression-error-tag>}}');

      expect(ExpressionInterpolationService.processHtml('abc{{a+b}}', [{
        a: '1',
        b: '2'
      }])).toEqual('abc3');
      expect(ExpressionInterpolationService.processHtml('abc{{a+b}}', [{
        a: '1',
        b: 'hello'
      }])).toEqual(
        'abc<oppia-expression-error-tag></oppia-expression-error-tag>');
    });

    it('should correctly interpolate unicode strings', function() {
      expect(ExpressionInterpolationService.processUnicode(
        'abc', [{}])).toEqual('abc');
      expect(ExpressionInterpolationService.processUnicode('abc{{a}}', [{
        a: 'b'
      }])).toEqual('abcb');
      expect(ExpressionInterpolationService.processUnicode('abc{{a}}', [{
        a: '<script></script>'
      }])).toEqual('abc<script></script>');
      expect(ExpressionInterpolationService.processUnicode(
        'abc{{a}}', [{}])).toBeNull();

      expect(ExpressionInterpolationService.processUnicode('abc{{a+b}}', [{
        a: '1',
        b: '2'
      }])).toEqual('abc3');
      expect(ExpressionInterpolationService.processUnicode('abc{{a+b}}', [{
        a: '1',
        b: 'hello'
      }])).toBeNull();
    });

    it('should correctly get params from strings', function() {
      expect(ExpressionInterpolationService.getParamsFromString(
        'abc')).toEqual([]);
      expect(ExpressionInterpolationService.getParamsFromString(
        'abc{{a}}')).toEqual(['a']);
      expect(ExpressionInterpolationService.getParamsFromString(
        'abc{{a+b}}')).toEqual(['a', 'b']);
    });
  });
});
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
 * @fileoverview Unit tests for Expression Parser Service.
 */

require('expressions/ExpressionParserService.js');

describe('Expression parser service', function() {
  beforeEach(angular.mock.module('oppia'));

  var eps = null;
  beforeEach(angular.mock.inject(function($injector) {
    eps = $injector.get('ExpressionParserService');
  }));

  it('should parse to a correct tree', function() {
    [
      [10, '10'],
      [32, '0x20'],
      [10.1, '10.1'],
      [0.001, '1e-3'],
      [0.35, '.35'],
      ['abc', '"abc"'],
      ['a\'b\'c', '"a\'b\'c"'],
      [null, 'null'],
      [true, 'true'],
      [false, 'false'],

      [['#', 'abc'],
        'abc'],
      [['#', 'あいうえお'],
        'あいうえお'],
      [['abc'],
        'abc()'],
      [['abc', 1],
        'abc(1)'],
      [['abc', 1, 2],
        'abc(1, 2)'],
      [[[['abc', 1, 2]], 3],
        'abc(1, 2)()(3)'],

      [['+', 10],
        '+10'],
      [['-', ['#', 'abc']],
        '-abc'],
      [['-', 0.35], '-.35'],

      [['+', 1, 2], '1     +    2'],
      // There is a double width space after '+'.
      [['+', 1, 2], '\t1 +　2 '],

      [['*', ['/', 3, 4], 5],
        '3 / 4 * 5'],
      [['-', ['+', 2, ['*', ['/', 3, 4], 5]], 6],
        '2 + 3 / 4 * 5 - 6'],

      [['||', ['&&', ['<', 2, 3], ['==', 4, 6]], true],
        '2 < 3 && 4 == 6 || true'],

      // Expected to produce parser error.
      [undefined, 'a1a-'],
      [undefined, '0.3.4'],
      [undefined, 'abc()('],
      [undefined, '()'],
      [undefined, '*100']
    ].forEach(function(test) {
      // 'expected' should be either a JavaScript primitive value that would be
      //   the result of evaluating 'expression', or undefined (which means
      //   that the parser is expected to fail).
      // 'expression' is the expression string to be parsed.
      var expected = test[0];
      var expression = test[1];

      var failed = false;
      try {
        var parsed = eps.parse(expression);
        var parsedJson = JSON.stringify(parsed);
        var expectedJson = JSON.stringify(expected);
        if (expected === undefined || parsedJson !== expectedJson) {
          console.error('input    : ' + expression);
          console.error('parsed   : ' + parsedJson);
          console.error('expected : ' + expectedJson);
          failed = true;
        }
      } catch (e) {
        if (expected !== undefined || !(e instanceof eps.SyntaxError)) {
          // Wrong or unexpected exception.
          console.error('input     : ' + expression);
          console.error('exception : ' + e);
          console.error('expected  : ' + expected);
          failed = true;
        }
      }
      expect(failed).toBe(false);
    });
  });
});
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
 * @fileoverview Unit tests for ExpressionSyntaxTreeService.ts
 */

require('App.ts');
require('expressions/ExpressionSyntaxTreeService.ts');

describe('Expression syntax tree service', () => {
  beforeEach(angular.mock.module('oppia'));

  describe('expression syntax tree service', () => {
    let ExpressionSyntaxTreeService = null;

    beforeEach(angular.mock.inject(($injector) => {
      ExpressionSyntaxTreeService =
          $injector.get('ExpressionSyntaxTreeService');
    }));

    it('should throw if environment is not found', () => {
      expect(() => ExpressionSyntaxTreeService.lookupEnvs('', [])).toThrow();
    });

    it('should return the correct environment if exists', () => {
      const expected = 'bar';
      const actual =
          ExpressionSyntaxTreeService.lookupEnvs('foo', [{foo: 'bar'}]);

      expect(expected).toBe(actual);
    });
  });
});
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
 * @fileoverview Unit tests for Expression Type Parser Service.
 */

require('expressions/ExpressionParserService.js');
require('expressions/ExpressionSyntaxTreeService.ts');

var oppia = require('AppInit.ts').moduleName;

oppia.factory('ExpressionTypeParserService', [
  '$log', 'ExpressionParserService', 'ExpressionSyntaxTreeService',
  'PARAMETER_TYPES',
  function(
      $log, ExpressionParserService, ExpressionSyntaxTreeService,
      PARAMETER_TYPES) {
    var getExpressionOutputType = function(expression, envs) {
      return ExpressionSyntaxTreeService.applyFunctionToParseTree(
        ExpressionParserService.parse(expression), envs, getType);
    };

    /**
     * @param {*} parsed Parse output from the parser. See parser.pegjs for
     *     the data structure.
     * @param {!Array.<!Object>} envs Represents a nested name space
     *     environment to look up the name in. The first element is looked
     *     up first (i.e. has higher precedence). The values of each Object
     *     are strings representing a parameter type (i.e. they are equal to
     *     values in the PARAMETER_TYPES object).
     */
    var getType = function(parsed, envs) {
      // The intermediate nodes of the parse tree are arrays. The terminal
      // nodes are JavaScript primitives (as described in the "Parser output"
      // section of parser.pegjs).
      if (parsed instanceof Array) {
        if (parsed.length === 0) {
          throw 'Parser generated an intermediate node with zero children';
        }

        if (parsed[0] === '#') {
          return ExpressionSyntaxTreeService.lookupEnvs(parsed[1], envs);
        }

        // Get the types of the arguments.
        var args = parsed.slice(1).map(function(item) {
          return getType(item, envs);
        });

        // The first element should be a function name.
        return ExpressionSyntaxTreeService.lookupEnvs(
          parsed[0], envs).getType(args);
      }

      // If 'parsed' is not an array, it should be a terminal node with the
      // actual value.
      return (
        isNaN(+parsed) ?
          PARAMETER_TYPES.UNICODE_STRING :
          PARAMETER_TYPES.REAL);
    };

    return {
      getType: getType,
      getExpressionOutputType: getExpressionOutputType
    };
  }
]);
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
 * @fileoverview Unit tests for Expression Type Parser Service.
 */

require('App.ts');
require('expressions/ExpressionParserService.js');
require('expressions/ExpressionSyntaxTreeService.ts');
require('expressions/ExpressionTypeParserService.ts');
require('services/UtilsService.ts');

describe('Expression type parser service', function() {
  beforeEach(angular.mock.module('oppia'));

  var etps = null;
  var eps = null;
  var ests = null;
  var isString = null;
  beforeEach(angular.mock.inject(function($injector) {
    etps = $injector.get('ExpressionTypeParserService');
    eps = $injector.get('ExpressionParserService');
    ests = $injector.get('ExpressionSyntaxTreeService');
    isString = $injector.get('UtilsService').isString;
  }));

  var ENVS = [
    {
      numZero: 'Real',
      boolTrue: 'UnicodeString',
      strXYZ: 'UnicodeString',
      num100_001: 'Real',
      boolFalse: 'UnicodeString',
      strNull: 'UnicodeString'
    }
  ];

  it('should determine the correct types for the expressions', function() {
    [
      ['2', 'Real'],
      ['numZero', 'Real'],
      ['boolTrue', 'UnicodeString'],
      ['+10', 'Real'],
      ['2   + 10', 'Real'],
      ['num100_001   + numZero', 'Real'],
      ['20 - num100_001', 'Real'],
      ['0x100 - 256', 'Real'],
      ['!strNull', 'UnicodeString'],
      ['1 - 2 * 3', 'Real'],
      ['num100_001 / 0.1', 'Real'],
      ['floor((numZero + num100_001)/2)', 'Real'],
      ['23 % 5', 'Real'],
      ['1 <= numZero || 1 >= numZero', 'UnicodeString'],
      ['100 < num100_001 && 1 > num100_001', 'UnicodeString'],
      ['boolTrue == boolFalse', 'UnicodeString'],
      ['strNull != strXYZ', 'UnicodeString'],
      ['if boolFalse then 8 else numZero', 'Real'],
      ['if boolFalse then 8 else strXYZ', ests.ExprWrongArgTypeError,
        'ExprWrongArgTypeError: Type Real does not match expected type ' +
       'UnicodeString'],
      ['strXYZ * 2', ests.ExprWrongArgTypeError,
        'ExprWrongArgTypeError: Type UnicodeString does not match expected ' +
       'type Real'],
      ['num100_001 / 0', 'Real'],
      ['abs(-3)', 'Real'],
      ['pow(num100_001, numZero)', 'Real'],
      ['log(9, 3)', 'Real']
    ].forEach(function(test) {
      var expression = test[0];
      var expected = test[1];
      if (test.length > 2) {
        var errorString = test[2];
      }

      // 'expected' should be either a JavaScript primitive value that would be
      // the result of evaluation 'expression', or an exception that is
      // expected to be thrown.
      // 'expression' is either a string (in which case parsed) or an array
      // (representing a parse tree).
      var parsed = isString(expression) ? eps.parse(expression) : expression;
      var parsedJson = JSON.stringify(parsed);
      var failed = false;

      var recordFailure = function(result, exception) {
        console.error('input     : ' + expression);
        console.error('parsed    : ' + parsedJson);
        if (result !== undefined) {
          console.error('evaluated : ' + result);
          console.error('expected  : ' + expected);
        }
        if (exception !== undefined) {
          console.error('exception : ' + exception);
          console.error('expected  : (exception)');
        }
        failed = true;
      };

      try {
        var evaled = ests.applyFunctionToParseTree(
          parsed, ENVS, etps.getType);
        if (expected instanceof Error || evaled !== expected) {
          recordFailure(evaled, undefined);
        }
      } catch (e) {
        if (!(e instanceof expected)) {
          // Wrong or unexpected exception.
          recordFailure(undefined, e);
        } else {
          if (errorString !== e.toString()) {
            // Wrong error string.
            recordFailure(errorString, e.toString());
          }
        }
      }
      expect(failed).toBe(false);

      if (typeof (expression) !== 'string') {
        return;
      }

      failed = false;
      try {
        evaled = etps.getExpressionOutputType(expression, ENVS);
        if (expected instanceof Error || evaled !== expected) {
          recordFailure(evaled, undefined);
        }
      } catch (e) {
        if (!(e instanceof expected)) {
          // Wrong or unexpected exception.
          recordFailure(undefined, e);
        }
      }
      expect(failed).toBe(false);
    });
  });
});
// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for the convert HTML to unicode filter.
 */

require(
  'filters/convert-html-to-unicode.filter.ts');

describe('HTML to text', function() {
  beforeEach(angular.mock.module('oppia'));

  var htmlUnicodeHtmlPairings = [
    ['abc', 'abc', 'abc'],
    ['&lt;a&copy;&deg;', '<a©°', '&lt;a&#169;&#176;'],
    ['<b>a</b>', 'a', 'a'],
    ['<br>a', 'a', 'a'],
    ['<br/>a', 'a', 'a'],
    ['<br></br>a', 'a', 'a'],
    ['abc  a', 'abc  a', 'abc  a']
  ];

  it('should convert HTML to and from raw text correctly', angular.mock.inject(
    function($filter) {
      htmlUnicodeHtmlPairings.forEach(function(pairing) {
        expect($filter('convertHtmlToUnicode')(pairing[0])).toEqual(pairing[1]);
      });
    }
  ));
});
// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for the convert unicode to html filter.
 */

require('filters/convert-unicode-to-html.filter.ts');

describe('HTML to text', function() {
  beforeEach(angular.mock.module('oppia'));

  var htmlUnicodeHtmlPairings = [
    ['abc', 'abc', 'abc'],
    ['&lt;a&copy;&deg;', '<a©°', '&lt;a&#169;&#176;'],
    ['<b>a</b>', 'a', 'a'],
    ['<br>a', 'a', 'a'],
    ['<br/>a', 'a', 'a'],
    ['<br></br>a', 'a', 'a'],
    ['abc  a', 'abc  a', 'abc  a']
  ];

  it('should convert HTML from raw text correctly', angular.mock.inject(
    function($filter) {
      htmlUnicodeHtmlPairings.forEach(function(pairing) {
        expect($filter('convertUnicodeToHtml')(pairing[1])).toEqual(pairing[2]);
      });
    }
  ));
});
// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for the convert unicode with params to html filter.
 */

require(
  'filters/convert-unicode-with-params-to-html.filter.ts');

describe('HTML to text', function() {
  beforeEach(angular.mock.module('oppia'));

  var invalidUnicodeStrings = [
    '{}',
    '}}abc{{',
    '\\{{a}}',
    '{{a\\}}',
    '{{a}\\}'
  ];

  it('should detect invalid unicode strings', angular.mock.inject(
    function($filter) {
      invalidUnicodeStrings.forEach(function(s) {
        var fn = function() {
          return $filter('convertUnicodeWithParamsToHtml')(s);
        };
        expect(fn).toThrow();
      });
    }));

  var validUnicodeStrings = [
    '{{}}',
    '{{abc}}',
    '\\\\{{abc}}',
    '\\{{{abc}}'
  ];

  it('should detect valid unicode strings', angular.mock.inject(
    function($filter) {
      var results = [
        '<oppia-parameter></oppia-parameter>',
        '<oppia-parameter>abc</oppia-parameter>',
        '\\<oppia-parameter>abc</oppia-parameter>',
        '{<oppia-parameter>abc</oppia-parameter>',
      ];
      validUnicodeStrings.forEach(function(s, i) {
        var fn = (function() {
          return $filter('convertUnicodeWithParamsToHtml')(s);
        })();
        expect(fn).toEqual(results[i]);
      });
    }));
});
// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for FormatRtePreview filter for Oppia.
 */

require('filters/format-rte-preview.filter.ts');

describe('Testing filters', function() {
  var filterName = 'formatRtePreview';
  beforeEach(angular.mock.module('oppia'));

  it('should have all expected filters', angular.mock.inject(function($filter) {
    expect($filter(filterName)).not.toEqual(null);
  }));

  it('should get correct list of RTE components from HTML input',
    angular.mock.inject(function($filter) {
      var filter = $filter('formatRtePreview');
      expect(
        filter('<p>Text input</p>')
      ).toEqual('Text input');
      expect(
        filter('<p><oppia-noninteractive-math attr1=value1>' +
        '</oppia-noninteractive-math>Text input</p>')
      ).toEqual('[Math] Text input');
      expect(
        filter('<p><oppia-noninteractive-math></oppia-noninteractive-math>' +
        'Text input<oppia-noninteractive-collapsible>' +
        '</oppia-noninteractive-collapsible>Text input 2</p>')
      ).toEqual('[Math] Text input [Collapsible] Text input 2');
      expect(
        filter('<p><oppia-noninteractive-math></oppia-noninteractive-math>' +
        'Text&nbsp;input<sample_tag><oppia-noninteractive-collapsible>' +
        '</oppia-noninteractive-collapsible><a><sample_tag>Text input 2' +
        '</sample_tag></a></p>')
      ).toEqual('[Math] Text input [Collapsible] Text input 2');
      expect(
        filter('<oppia-noninteractive-math></oppia-noninteractive-math>' +
        'Text input<oppia-noninteractive-collapsible>' +
        '</oppia-noninteractive-collapsible>Text input 2' +
        '<oppia-noninteractive-image>' +
        '</oppia-noninteractive-image> Text Input 3 ')
      ).toEqual('[Math] Text input [Collapsible] Text input 2 [Image]  ' +
      'Text Input 3');
    }));
});
// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for ParameterizeRuleDescription filter for Oppia.
 */

require('filters/parameterize-rule-description.filter.ts');
require('filters/string-utility-filters/convert-to-plain-text.filter.ts');

describe('Testing filters', function() {
  var filterName = 'parameterizeRuleDescription';
  beforeEach(angular.mock.module('oppia'));

  it('should have all expected filters', angular.mock.inject(function($filter) {
    expect($filter(filterName)).not.toEqual(null);
  }));

  it('should correctly parameterize rule description filter',
    angular.mock.inject(function($filter) {
      var ruleMultipleChoice = {
        type: 'Equals',
        inputs: {
          x: 0
        }
      };
      var interactionIdMultipleChoice = 'TextInput';
      var choicesMultipleChoice = [
        {
          label: '$10 should not become $$10',
          val: 0
        }
      ];
      expect($filter('parameterizeRuleDescription')(ruleMultipleChoice,
        interactionIdMultipleChoice, choicesMultipleChoice)
      ).toEqual('is equal to \'$10 should not become $$10\'');

      choicesMultipleChoice = [
        {
          label: '$xyz should not become $$xyz',
          val: 0
        }
      ];
      expect($filter('parameterizeRuleDescription')(ruleMultipleChoice,
        interactionIdMultipleChoice, choicesMultipleChoice)
      ).toEqual('is equal to \'$xyz should not become $$xyz\'');
    }));

  it('should correctly display RTE components in Answer Group Header',
    angular.mock.inject(function($filter) {
      var ruleMath = {
        type: 'Equals',
        inputs: {
          x: 2
        }
      };
      var interactionIdMath = 'TextInput';
      var choicesMath = [
        {
          label: '<oppia-noninteractive-math raw_latex-with-value="&amp;quot;' +
            'x^3 - a x^2 - b x - c&amp;quot;"></oppia-noninteractive-math>',
          val: 0
        }, {
          label: '<oppia-noninteractive-math raw_latex-with-value="&amp;quot;' +
            'x^3 + (a+b+c)x^2 + (ab+bc+ca)x + abc&amp;quot;">' +
            '</oppia-noninteractive-math>',
          val: 1
        }, {
          label: '<oppia-noninteractive-math raw_latex-with-value="&amp;quot;' +
            'x^3 - (a+b+c)x^2 + (ab+bc+ca)x - abc&amp;quot;">' +
            '</oppia-noninteractive-math>',
          val: 2
        }, {
          label: '<oppia-noninteractive-math raw_latex-with-value="&amp;quot;' +
            'x^3 + (a+b+c)x^2 - (ab+bc+ca)x + abc&amp;quot;">' +
            '</oppia-noninteractive-math>',
          val: 3
        },
      ];

      var ruleMixed = {
        type: 'Equals',
        inputs: {
          x: 0
        }
      };
      var interactionIdMixed = 'TextInput';
      var choicesMixed = [
        {
          label: '<p><oppia-noninteractive-image alt-with-value="&amp;' +
            'quot;f&amp;quot;" caption-with-value="&amp;quot;&amp;quot;"' +
            'filepath-with-value="&amp;quot;img_20180112_170413_5jxq15ngmd' +
            '.png&amp;quot;"></oppia-noninteractive-image>This is a text ' +
            'input.</p><p><oppia-noninteractive-image alt-with-value="&amp;' +
            'quot;f&amp;quot;" caption-with-value="&amp;quot;&amp;quot;"' +
            'filepath-with-value="&amp;quot;img_20180112_170436_k7sz3xtvyy.' +
            'png&amp;quot;"></oppia-noninteractive-image></p><p><oppia-' +
            'noninteractive-link text-with-value="&amp;quot;&amp;quot;"' +
            'url-with-value="&amp;quot;https://www.example.com&amp;quot;">' +
            '</oppia-noninteractive-link><br><br></p>',
          val: 0
        }, {
          label: '<p><oppia-noninteractive-image alt-with-value="&amp;quot;' +
            'g&amp;quot;" caption-with-value="&amp;quot;&amp;quot;" filepath-' +
            'with-value="&amp;quot;img_20180112_170500_926cssn398.png&amp;' +
            'quot;"></oppia-noninteractive-image><br></p>',
          val: 1
        }
      ];

      expect($filter('convertToPlainText')($filter('formatRtePreview')(
        $filter('parameterizeRuleDescription')(ruleMath, interactionIdMath,
          choicesMath)))
      ).toEqual('is ' + 'equal to \'[Math]\'');

      expect($filter('convertToPlainText')($filter('formatRtePreview')(
        $filter('parameterizeRuleDescription')(ruleMixed, interactionIdMixed,
          choicesMixed)))
      ).toEqual('is ' + 'equal to \'[Image] This is a text ' +
        'input. [Image]  [Link]\'');
    })
  );
});
// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for CamelCaseToHyphens filter for Oppia.
 */

require('filters/string-utility-filters/camel-case-to-hyphens.filter.ts');

describe('Testing filters', function() {
  var filterName = 'camelCaseToHyphens';
  beforeEach(angular.mock.module('oppia'));

  it('should have all expected filters', angular.mock.inject(function($filter) {
    expect($filter(filterName)).not.toEqual(null);
  }));

  it('should convert camelCase to hyphens properly', angular.mock.inject(
    function($filter) {
      var filter = $filter('camelCaseToHyphens');
      expect(filter('test')).toEqual('test');
      expect(filter('testTest')).toEqual('test-test');
      expect(filter('testTestTest')).toEqual('test-test-test');
      expect(filter('aBaBCa')).toEqual('a-ba-b-ca');
      expect(filter('AbcDefGhi')).toEqual('abc-def-ghi');
    }
  ));
});
// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for Capitalize filter for Oppia.
 */

require('filters/string-utility-filters/capitalize.filter.ts');

describe('Testing filters', function() {
  var filterName = 'capitalize';
  beforeEach(angular.mock.module('oppia'));

  it('should have all expected filters', angular.mock.inject(function($filter) {
    expect($filter(filterName)).not.toEqual(null);
  }));

  it('should correctly capitalize strings', angular.mock.inject(
    function($filter) {
      var filter = $filter('capitalize');

      expect(filter('')).toEqual('');
      expect(filter(null)).toEqual(null);
      expect(filter(undefined)).toEqual(undefined);

      expect(filter('a')).toEqual('A');
      expect(filter('a  ')).toEqual('A');
      expect(filter('  a')).toEqual('A');
      expect(filter('  a  ')).toEqual('A');

      expect(filter('a  b ')).toEqual('A  b');
      expect(filter('  a  b ')).toEqual('A  b');
      expect(filter('  ab c ')).toEqual('Ab c');
      expect(filter('  only First lettEr is  Affected ')).toEqual(
        'Only First lettEr is  Affected');
    }
  ));
});
// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for GetAbbreviatedText filter for Oppia.
 */

require('filters/string-utility-filters/get-abbreviated-text.filter.ts');

describe('Testing filters', function() {
  var filterName = 'getAbbreviatedText';
  beforeEach(angular.mock.module('oppia'));

  it('should have all expected filters', angular.mock.inject(function($filter) {
    expect($filter(filterName)).not.toEqual(null);
  }));

  it('should not shorten the length of text', angular.mock.inject(
    function($filter) {
      expect($filter('getAbbreviatedText')('It will remain unchanged.', 50))
        .toBe('It will remain unchanged.');
      expect($filter('getAbbreviatedText')(
        'Itisjustaverylongsinglewordfortesting',
        50)).toBe('Itisjustaverylongsinglewordfortesting');
    }
  ));

  it('should shorten the length of text', angular.mock.inject(
    function($filter) {
      expect($filter('getAbbreviatedText')(
        'It has to convert to a substring as it exceeds the character limit.',
        50)).toBe('It has to convert to a substring as it exceeds...');
      expect($filter('getAbbreviatedText')(
        'ItisjustaverylongsinglewordfortestinggetAbbreviatedText',
        50)).toBe('ItisjustaverylongsinglewordfortestinggetAbbreviate...');
      expect($filter('getAbbreviatedText')(
        'â, ??î or ôu🕧� n☁i✑💴++$-💯 ♓!🇪🚑🌚‼⁉4⃣od; /⏬®;😁☕😁:☝)😁😁😍1!@#',
        50)).toBe('â, ??î or ôu🕧� n☁i✑💴++$-💯 ♓!🇪🚑🌚‼⁉4⃣od;...');
      expect($filter('getAbbreviatedText')(
        'It is just a very long singlewordfortestinggetAbbreviatedText',
        50)).toBe('It is just a very long...');
    }
  ));
});
// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for NormalizeWhitespace filter for Oppia.
 */

require('filters/string-utility-filters/normalize-whitespace.filter.ts');

describe('Testing filters', function() {
  var filterName = 'normalizeWhitespace';
  beforeEach(angular.mock.module('oppia'));

  it('should have all expected filters', angular.mock.inject(function($filter) {
    expect($filter(filterName)).not.toEqual(null);
  }));

  it('should correctly normalize whitespace', angular.mock.inject(
    function($filter) {
      var filter = $filter('normalizeWhitespace');

      expect(filter('')).toEqual('');
      expect(filter(null)).toEqual(null);
      expect(filter(undefined)).toEqual(undefined);

      expect(filter('a')).toEqual('a');
      expect(filter('a  ')).toEqual('a');
      expect(filter('  a')).toEqual('a');
      expect(filter('  a  ')).toEqual('a');

      expect(filter('a  b ')).toEqual('a b');
      expect(filter('  a  b ')).toEqual('a b');
      expect(filter('  ab c ')).toEqual('ab c');
    }
  ));
});
// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for ReplaceInputsWithEllipses filter for Oppia.
 */

require(
  'filters/string-utility-filters/replace-inputs-with-ellipses.filter.ts');

describe('Testing filters', function() {
  var filterName = 'replaceInputsWithEllipses';
  beforeEach(angular.mock.module('oppia'));

  it('should have all expected filters', angular.mock.inject(function($filter) {
    expect($filter(filterName)).not.toEqual(null);
  }));

  it('should convert {{...}} tags to ...', angular.mock.inject(
    function($filter) {
      var filter = $filter('replaceInputsWithEllipses');

      expect(filter('')).toEqual('');
      expect(filter(null)).toEqual('');
      expect(filter(undefined)).toEqual('');

      expect(filter('hello')).toEqual('hello');
      expect(filter('{{hello}}')).toEqual('...');
      expect(filter('{{hello}} and {{goodbye}}')).toEqual('... and ...');
      expect(filter('{{}}{{hello}}')).toEqual('{{}}...');
    }
  ));
});
// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for TruncateAndCapitalize filter for Oppia.
 */

require('filters/string-utility-filters/truncate-and-capitalize.filter.ts');

describe('Testing filters', function() {
  var filterName = 'truncateAndCapitalize';
  beforeEach(angular.mock.module('oppia'));

  it('should have all expected filters', angular.mock.inject(function($filter) {
    expect($filter(filterName)).not.toEqual(null);
  }));

  it(
    'should capitalize first letter and truncate string at a word break',
    angular.mock.inject(function($filter) {
      var filter = $filter('truncateAndCapitalize');

      // The first word always appears in the result.
      expect(filter('  remove new Line', 4)).toEqual('Remove...');
      expect(filter('remove New line', 4)).toEqual('Remove...');

      expect(filter('remove New line', 6)).toEqual('Remove...');

      expect(filter('  remove new Line', 10)).toEqual('Remove new...');
      expect(filter('remove New line', 10)).toEqual('Remove New...');

      expect(filter('  remove new Line', 15)).toEqual('Remove new Line');
      expect(filter('remove New line', 15)).toEqual('Remove New line');

      // Strings starting with digits are not affected by the capitalization.
      expect(filter(' 123456 a bc d', 12)).toEqual('123456 a bc...');

      // If the maximum number of characters is not specified, return
      // the whole input string with the first letter capitalized.
      expect(filter('capitalize first letter and truncate')).toEqual(
        'Capitalize first letter and truncate');
      expect(filter(
        'a single sentence with more than twenty one characters', 21
      )).toEqual('A single sentence...');

      expect(filter(
        'a single sentence with more than 21 characters and all will be shown'
      )).toEqual(
        'A single sentence with more than 21 characters and all will be shown');

      // If maximum characters is greater than objective length
      // return whole objective.
      expect(filter('please do not test empty string', 100)).toEqual(
        'Please do not test empty string');
    })
  );
});
// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for TruncateAtFirstEllipsis filter for Oppia.
 */

require('filters/string-utility-filters/truncate-at-first-ellipsis.filter.ts');

describe('Testing filters', function() {
  var filterName = 'truncateAtFirstEllipsis';
  beforeEach(angular.mock.module('oppia'));

  it('should have all expected filters', angular.mock.inject(function($filter) {
    expect($filter(filterName)).not.toEqual(null);
  }));

  it('should truncate a string when it first sees a \'...\'',
    angular.mock.inject(function($filter) {
      var filter = $filter('truncateAtFirstEllipsis');

      expect(filter('')).toEqual('');
      expect(filter(null)).toEqual('');
      expect(filter(undefined)).toEqual('');

      expect(filter('hello')).toEqual('hello');
      expect(filter('...')).toEqual('');
      expect(filter('say ... and ...')).toEqual('say ');
      expect(filter('... and ...')).toEqual('');
      expect(filter('{{}}...')).toEqual('{{}}');
    }));
});
// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for TruncateAtFirstLine filter for Oppia.
 */

require('filters/string-utility-filters/truncate-at-first-line.filter.ts');

describe('Testing filters', function() {
  var filterName = 'truncateAtFirstLine';
  beforeEach(angular.mock.module('oppia'));

  it('should have all expected filters', angular.mock.inject(function($filter) {
    expect($filter(filterName)).not.toEqual(null);
  }));

  it('should truncate multi-line text to the first non-empty line',
    angular.mock.inject(function($filter) {
      var filter = $filter('truncateAtFirstLine');

      expect(filter('')).toEqual('');
      expect(filter(null)).toEqual(null);
      expect(filter(undefined)).toEqual(undefined);

      expect(filter(' A   single line with spaces at either end. ')).toEqual(
        ' A   single line with spaces at either end. ');
      expect(filter('a\nb\nc')).toEqual('a...');
      expect(filter('Removes newline at end\n')).toEqual(
        'Removes newline at end');
      expect(filter('\nRemoves newline at beginning.')).toEqual(
        'Removes newline at beginning.');

      expect(filter('\n')).toEqual('');
      expect(filter('\n\n\n')).toEqual('');

      // Windows
      expect(filter('Single line\r\nWindows EOL')).toEqual('Single line...');
      expect(filter('Single line\u000D\u000AEOL')).toEqual('Single line...');
      expect(filter('Single line\x0D\x0AEOL')).toEqual('Single line...');
      expect(filter('Single line\u000D\x0AEOL')).toEqual('Single line...');
      expect(filter('Single line\x0D\u000AEOL')).toEqual('Single line...');

      // Mac
      expect(filter('Single line\rEOL')).toEqual('Single line...');
      expect(filter('Single line\u000DEOL')).toEqual('Single line...');
      expect(filter('Single line\x0DEOL')).toEqual('Single line...');

      // Linux
      expect(filter('Single line\nEOL')).toEqual('Single line...');
      expect(filter('Single line\u000AEOL')).toEqual('Single line...');
      expect(filter('Single line\x0AEOL')).toEqual('Single line...');

      // Vertical Tab
      expect(filter('Vertical Tab\vEOL')).toEqual('Vertical Tab...');
      expect(filter('Vertical Tab\u000BEOL')).toEqual('Vertical Tab...');
      expect(filter('Vertical Tab\x0BEOL')).toEqual('Vertical Tab...');

      // Form Feed
      expect(filter('Form Feed\fEOL')).toEqual('Form Feed...');
      expect(filter('Form Feed\u000CEOL')).toEqual('Form Feed...');
      expect(filter('Form Feed\x0CEOL')).toEqual('Form Feed...');

      // Next Line
      expect(filter('Next Line\u0085EOL')).toEqual('Next Line...');
      expect(filter('Next Line\x85EOL')).toEqual('Next Line...');

      // Line Separator
      expect(filter('Line Separator\u2028EOL')).toEqual('Line Separator...');

      // Paragraph Separator
      expect(filter('Paragraph Separator\u2029EOL')).toEqual(
        'Paragraph Separator...');
    }));
});
// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for Truncate filter for Oppia.
 */

require('filters/string-utility-filters/truncate.filter.ts');

describe('Testing filters', function() {
  var filterName = 'truncate';
  beforeEach(angular.mock.module('oppia'));

  it('should have all expected filters', angular.mock.inject(function($filter) {
    expect($filter(filterName)).not.toEqual(null);
  }));
});
// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for UnderscoresToCamelCase filter for Oppia.
 */

require('filters/string-utility-filters/underscores-to-camel-case.filter.ts');

describe('Testing filters', function() {
  var filterName = 'underscoresToCamelCase';
  beforeEach(angular.mock.module('oppia'));

  it('should have all expected filters', angular.mock.inject(function($filter) {
    expect($filter(filterName)).not.toEqual(null);
  }));

  it('should convert underscores to camelCase properly', angular.mock.inject(
    function($filter) {
      var filter = $filter('underscoresToCamelCase');
      expect(filter('Test')).toEqual('Test');
      expect(filter('test')).toEqual('test');
      expect(filter('test_app')).toEqual('testApp');
      expect(filter('Test_App_Two')).toEqual('TestAppTwo');
      expect(filter('test_App_Two')).toEqual('testAppTwo');
      expect(filter('test_app_two')).toEqual('testAppTwo');
      expect(filter('test__App')).toEqual('testApp');
      // Trailing underscores at the beginning and end should never happen --
      // they will give weird results.
      expect(filter('_test_App')).toEqual('TestApp');
      expect(filter('__Test_ App_')).toEqual('Test App_');
    }
  ));
});
// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for the WrapTextWithEllipsis filter for Oppia.
 */

require('filters/string-utility-filters/wrap-text-with-ellipsis.filter.ts');

describe('Testing filters', function() {
  var filterName = 'wrapTextWithEllipsis';
  beforeEach(angular.mock.module('oppia'));

  it('should have all expected filters', angular.mock.inject(function($filter) {
    expect($filter(filterName)).not.toEqual(null);
  }));

  it('should wrap text with ellipses based on its length', angular.mock.inject(
    function($filter) {
      var filter = $filter('wrapTextWithEllipsis');

      expect(filter('', 0)).toEqual('');
      expect(filter(null, 0)).toEqual(null);
      expect(filter(undefined, 0)).toEqual(undefined);

      expect(filter('testing', 0)).toEqual('testing');
      expect(filter('testing', 1)).toEqual('testing');
      expect(filter('testing', 2)).toEqual('testing');
      expect(filter('testing', 3)).toEqual('...');
      expect(filter('testing', 4)).toEqual('t...');
      expect(filter('testing', 7)).toEqual('testing');
      expect(filter('Long sentence which goes on and on.', 80)).toEqual(
        'Long sentence which goes on and on.');
      expect(filter('Long sentence which goes on and on.', 20)).toEqual(
        'Long sentence whi...');
      expect(filter('Sentence     with     long     spacing.', 20)).toEqual(
        'Sentence with lon...');
      expect(filter('With space before ellipsis.', 21)).toEqual(
        'With space before...');
    }
  ));
});
// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for SummarizeNonnegativeNumber filter for Oppia.
 */

require('filters/summarize-nonnegative-number.filter.ts');

describe('Testing filters', function() {
  var filterName = 'summarizeNonnegativeNumber';
  beforeEach(angular.mock.module('oppia'));

  it('should have all expected filters', angular.mock.inject(function($filter) {
    expect($filter(filterName)).not.toEqual(null);
  }));

  it(
    'should summarize large number to at most 4 s.f. and append metric prefix',
    angular.mock.inject(function($filter) {
      var filter = $filter('summarizeNonnegativeNumber');

      expect(filter(100)).toEqual(100);
      expect(filter(1720)).toEqual('1.7K');
      expect(filter(2306200)).toEqual('2.3M');

      expect(filter(12389654281)).toEqual('12.4B');
      expect(filter(897978581123)).toEqual('898.0B');
      expect(filter(476678)).toEqual('476.7K');
    })
  );
});
// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for AdminRouterService.
 */

require('pages/admin-page/services/admin-router.service.ts');

describe('Admin router service', function() {
  var AdminRouterService = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    AdminRouterService = $injector.get('AdminRouterService');
  }));

  it('should initially be routed to the activities tab', function() {
    expect(AdminRouterService.isActivitiesTabOpen()).toBe(true);
    expect(AdminRouterService.isConfigTabOpen()).toBe(false);
    expect(AdminRouterService.isRolesTabOpen()).toBe(false);
    expect(AdminRouterService.isJobsTabOpen()).toBe(false);
    expect(AdminRouterService.isMiscTabOpen()).toBe(false);
  });

  it('should be able to navigate to the activities tab', function() {
    // Navigate away from the activities tab (relying on other tests to verify
    // this works correctly) in order to navigate back.
    AdminRouterService.showTab('#jobs');

    expect(AdminRouterService.isActivitiesTabOpen()).toBe(false);
    AdminRouterService.showTab('#activities');
    expect(AdminRouterService.isActivitiesTabOpen()).toBe(true);
    expect(AdminRouterService.isConfigTabOpen()).toBe(false);
    expect(AdminRouterService.isRolesTabOpen()).toBe(false);
    expect(AdminRouterService.isJobsTabOpen()).toBe(false);
    expect(AdminRouterService.isMiscTabOpen()).toBe(false);
  });

  it('should be able to navigate to the config tab', function() {
    expect(AdminRouterService.isConfigTabOpen()).toBe(false);
    AdminRouterService.showTab('#config');
    expect(AdminRouterService.isActivitiesTabOpen()).toBe(false);
    expect(AdminRouterService.isConfigTabOpen()).toBe(true);
    expect(AdminRouterService.isRolesTabOpen()).toBe(false);
    expect(AdminRouterService.isJobsTabOpen()).toBe(false);
    expect(AdminRouterService.isMiscTabOpen()).toBe(false);
  });

  it('should be able to navigate to the roles tab', function() {
    expect(AdminRouterService.isRolesTabOpen()).toBe(false);
    AdminRouterService.showTab('#roles');
    expect(AdminRouterService.isActivitiesTabOpen()).toBe(false);
    expect(AdminRouterService.isConfigTabOpen()).toBe(false);
    expect(AdminRouterService.isRolesTabOpen()).toBe(true);
    expect(AdminRouterService.isJobsTabOpen()).toBe(false);
    expect(AdminRouterService.isMiscTabOpen()).toBe(false);
  });

  it('should be able to navigate to the jobs tab', function() {
    expect(AdminRouterService.isJobsTabOpen()).toBe(false);
    AdminRouterService.showTab('#jobs');
    expect(AdminRouterService.isActivitiesTabOpen()).toBe(false);
    expect(AdminRouterService.isConfigTabOpen()).toBe(false);
    expect(AdminRouterService.isRolesTabOpen()).toBe(false);
    expect(AdminRouterService.isJobsTabOpen()).toBe(true);
    expect(AdminRouterService.isMiscTabOpen()).toBe(false);
  });

  it('should be able to navigate to the misc tab', function() {
    expect(AdminRouterService.isMiscTabOpen()).toBe(false);
    AdminRouterService.showTab('#misc');
    expect(AdminRouterService.isActivitiesTabOpen()).toBe(false);
    expect(AdminRouterService.isConfigTabOpen()).toBe(false);
    expect(AdminRouterService.isRolesTabOpen()).toBe(false);
    expect(AdminRouterService.isJobsTabOpen()).toBe(false);
    expect(AdminRouterService.isMiscTabOpen()).toBe(true);
  });

  it('should be able to navigate to the same tab twice', function() {
    expect(AdminRouterService.isJobsTabOpen()).toBe(false);

    AdminRouterService.showTab('#jobs');
    expect(AdminRouterService.isJobsTabOpen()).toBe(true);

    AdminRouterService.showTab('#jobs');
    expect(AdminRouterService.isActivitiesTabOpen()).toBe(false);
    expect(AdminRouterService.isConfigTabOpen()).toBe(false);
    expect(AdminRouterService.isRolesTabOpen()).toBe(false);
    expect(AdminRouterService.isJobsTabOpen()).toBe(true);
    expect(AdminRouterService.isMiscTabOpen()).toBe(false);
  });

  it('should stay on the current tab if an invalid tab is shown', function() {
    AdminRouterService.showTab('#jobs');

    expect(AdminRouterService.isJobsTabOpen()).toBe(true);
    AdminRouterService.showTab('#unknown');
    expect(AdminRouterService.isJobsTabOpen()).toBe(true);
  });
});
// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for AdminTaskManagerService.
 */

require('pages/admin-page/services/admin-task-manager.service.ts');

describe('Admin task manager service', function() {
  var AdminTaskManagerService = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    AdminTaskManagerService = $injector.get('AdminTaskManagerService');
  }));

  it('should initially have no tasks running', function() {
    expect(AdminTaskManagerService.isTaskRunning()).toBe(false);
  });

  it('should be able to start a task and record it as running', function() {
    expect(AdminTaskManagerService.isTaskRunning()).toBe(false);
    AdminTaskManagerService.startTask();
    expect(AdminTaskManagerService.isTaskRunning()).toBe(true);
  });

  it('should not change running state when stopping no tasks', function() {
    expect(AdminTaskManagerService.isTaskRunning()).toBe(false);
    AdminTaskManagerService.finishTask();
    expect(AdminTaskManagerService.isTaskRunning()).toBe(false);
  });

  it('should be able to stop a running task', function() {
    AdminTaskManagerService.startTask();

    expect(AdminTaskManagerService.isTaskRunning()).toBe(true);
    AdminTaskManagerService.finishTask();
    expect(AdminTaskManagerService.isTaskRunning()).toBe(false);
  });

  it('should be able to start a task twice and stop it once', function() {
    AdminTaskManagerService.startTask();
    AdminTaskManagerService.startTask();
    expect(AdminTaskManagerService.isTaskRunning()).toBe(true);

    AdminTaskManagerService.finishTask();
    expect(AdminTaskManagerService.isTaskRunning()).toBe(false);
  });
});
// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for CollectionEditorStateService.
 */

require('domain/collection/CollectionNodeObjectFactory.ts');
require('domain/collection/CollectionObjectFactory.ts');
require('domain/collection/CollectionRightsObjectFactory.ts');
require('domain/collection/CollectionUpdateService.ts');
require(
  'pages/collection-editor-page/services/collection-editor-state.service.ts');

describe('Collection editor state service', function() {
  var CollectionEditorStateService = null;
  var CollectionObjectFactory = null;
  var CollectionRightsObjectFactory = null;
  var CollectionUpdateService = null;
  var fakeEditableCollectionBackendApiService = null;
  var fakeCollectionRightsBackendApiService = null;
  var secondBackendCollectionObject = null;
  var unpublishablePublicCollectionRightsObject = null;
  var $rootScope = null;
  var $scope = null;
  var $q = null;

  // TODO(bhenning): Consider moving this to a more shareable location.
  var FakeEditableCollectionBackendApiService = function() {
    var self = {
      newBackendCollectionObject: null,
      failure: null,
      fetchCollection: null,
      updateCollection: null
    };

    var _fetchOrUpdateCollection = function() {
      return $q(function(resolve, reject) {
        if (!self.failure) {
          resolve(self.newBackendCollectionObject);
        } else {
          reject();
        }
      });
    };

    self.newBackendCollectionObject = {};
    self.failure = null;
    self.fetchCollection = _fetchOrUpdateCollection;
    self.updateCollection = _fetchOrUpdateCollection;

    return self;
  };

  var FakeCollectionRightsBackendApiService = function() {
    var self = {
      backendCollectionRightsObject: null,
      failure: null,
      fetchCollectionRights: null,
    };

    var _fetchCollectionRights = function() {
      return $q(function(resolve, reject) {
        if (!self.failure) {
          resolve(self.backendCollectionRightsObject);
        } else {
          reject();
        }
      });
    };

    self.backendCollectionRightsObject = {};
    self.failure = null;
    self.fetchCollectionRights = _fetchCollectionRights;

    return self;
  };

  beforeEach(angular.mock.module('oppia'));
  beforeEach(
    angular.mock.module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));
  beforeEach(angular.mock.module('oppia', function($provide) {
    fakeEditableCollectionBackendApiService = (
      FakeEditableCollectionBackendApiService());
    $provide.value(
      'EditableCollectionBackendApiService',
      [fakeEditableCollectionBackendApiService][0]);

    fakeCollectionRightsBackendApiService = (
      FakeCollectionRightsBackendApiService());
    $provide.value(
      'CollectionRightsBackendApiService',
      [fakeCollectionRightsBackendApiService][0]);
  }));

  beforeEach(angular.mock.inject(function($injector) {
    CollectionEditorStateService = $injector.get(
      'CollectionEditorStateService');
    CollectionObjectFactory = $injector.get('CollectionObjectFactory');
    CollectionRightsObjectFactory = $injector.get(
      'CollectionRightsObjectFactory');
    CollectionUpdateService = $injector.get('CollectionUpdateService');
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();

    fakeEditableCollectionBackendApiService.newBackendCollectionObject = {
      id: '0',
      title: 'Collection Under Test',
      category: 'Test',
      objective: 'To pass',
      language_code: 'en',
      schema_version: '3',
      version: '1',
      nodes: [{
        exploration_id: '0'
      }, {
        exploration_id: '1'
      }]
    };
    secondBackendCollectionObject = {
      id: '5',
      title: 'Interesting collection',
      category: 'Test',
      objective: 'To be interesting',
      language_code: 'en',
      tags: [],
      schema_version: '3',
      version: '3',
      nodes: [{
        exploration_id: '0'
      }]
    };

    var privateCollectionRightsObject = {
      collection_id: '5',
      can_edit: 'true',
      can_unpublish: 'false',
      is_private: 'true',
      owner_names: ['A']
    };
    fakeCollectionRightsBackendApiService.backendCollectionRightsObject = (
      privateCollectionRightsObject);

    unpublishablePublicCollectionRightsObject = {
      collection_id: '5',
      can_edit: 'true',
      can_unpublish: 'true',
      is_private: 'false',
      owner_names: ['A']
    };
  }));

  it('should request to load the collection from the backend', function() {
    spyOn(
      fakeEditableCollectionBackendApiService,
      'fetchCollection').and.callThrough();

    CollectionEditorStateService.loadCollection(5);
    expect(fakeEditableCollectionBackendApiService.fetchCollection)
      .toHaveBeenCalled();
  });

  it('should request to load the collection rights from the backend',
    function() {
      spyOn(fakeCollectionRightsBackendApiService, 'fetchCollectionRights')
        .and.callThrough();

      CollectionEditorStateService.loadCollection(5);
      expect(fakeCollectionRightsBackendApiService.fetchCollectionRights)
        .toHaveBeenCalled();
    }
  );

  it('should fire an init event after loading the first collection',
    function() {
      spyOn($rootScope, '$broadcast').and.callThrough();

      CollectionEditorStateService.loadCollection(5);
      $rootScope.$apply();

      expect($rootScope.$broadcast).toHaveBeenCalledWith(
        'collectionInitialized');
    }
  );

  it('should fire an update event after loading more collections', function() {
    // Load initial collection.
    CollectionEditorStateService.loadCollection(5);
    $rootScope.$apply();

    spyOn($rootScope, '$broadcast').and.callThrough();

    // Load a second collection.
    CollectionEditorStateService.loadCollection(1);
    $rootScope.$apply();

    expect($rootScope.$broadcast).toHaveBeenCalledWith(
      'collectionReinitialized');
  });

  it('should track whether it is currently loading the collection', function() {
    expect(CollectionEditorStateService.isLoadingCollection()).toBe(false);

    CollectionEditorStateService.loadCollection(5);
    expect(CollectionEditorStateService.isLoadingCollection()).toBe(true);

    $rootScope.$apply();
    expect(CollectionEditorStateService.isLoadingCollection()).toBe(false);
  });

  it('should indicate a collection is no longer loading after an error',
    function() {
      expect(CollectionEditorStateService.isLoadingCollection()).toBe(false);
      fakeEditableCollectionBackendApiService.failure = 'Internal 500 error';

      CollectionEditorStateService.loadCollection(5);
      expect(CollectionEditorStateService.isLoadingCollection()).toBe(true);

      $rootScope.$apply();
      expect(CollectionEditorStateService.isLoadingCollection()).toBe(false);
    }
  );

  it('it should report that a collection has loaded through loadCollection()',
    function() {
      expect(CollectionEditorStateService.hasLoadedCollection()).toBe(false);

      CollectionEditorStateService.loadCollection(5);
      expect(CollectionEditorStateService.hasLoadedCollection()).toBe(false);

      $rootScope.$apply();
      expect(CollectionEditorStateService.hasLoadedCollection()).toBe(true);
    }
  );

  it('it should report that a collection has loaded through setCollection()',
    function() {
      expect(CollectionEditorStateService.hasLoadedCollection()).toBe(false);

      var newCollection = CollectionObjectFactory.create(
        secondBackendCollectionObject);
      CollectionEditorStateService.setCollection(newCollection);
      expect(CollectionEditorStateService.hasLoadedCollection()).toBe(true);
    }
  );

  it('should initially return an empty collection', function() {
    var collection = CollectionEditorStateService.getCollection();
    expect(collection.getId()).toBeUndefined();
    expect(collection.getTitle()).toBeUndefined();
    expect(collection.getObjective()).toBeUndefined();
    expect(collection.getCategory()).toBeUndefined();
    expect(collection.getCollectionNodes()).toEqual([]);
  });

  it('should initially return an empty collection rights', function() {
    var collectionRights = CollectionEditorStateService.getCollectionRights();
    expect(collectionRights.getCollectionId()).toBeUndefined();
    expect(collectionRights.canEdit()).toBeUndefined();
    expect(collectionRights.canUnpublish()).toBeUndefined();
    expect(collectionRights.isPrivate()).toBeUndefined();
    expect(collectionRights.getOwnerNames()).toEqual([]);
  });

  it('should return the last collection loaded as the same object', function() {
    var previousCollection = CollectionEditorStateService.getCollection();
    var expectedCollection = CollectionObjectFactory.create(
      fakeEditableCollectionBackendApiService.newBackendCollectionObject);
    expect(previousCollection).not.toEqual(expectedCollection);

    CollectionEditorStateService.loadCollection(5);
    $rootScope.$apply();

    var actualCollection = CollectionEditorStateService.getCollection();
    expect(actualCollection).toEqual(expectedCollection);

    // Although the actual collection equals the expected collection, they are
    // different objects. Ensure that the actual collection is still the same
    // object from before loading it, however.
    expect(actualCollection).toBe(previousCollection);
    expect(actualCollection).not.toBe(expectedCollection);
  });

  it('should return the last collection rights loaded as the same object',
    function() {
      var previousCollectionRights = (
        CollectionEditorStateService.getCollectionRights());
      var expectedCollectionRights = CollectionRightsObjectFactory.create(
        fakeCollectionRightsBackendApiService.backendCollectionRightsObject);
      expect(previousCollectionRights).not.toEqual(expectedCollectionRights);

      CollectionEditorStateService.loadCollection(5);
      $rootScope.$apply();

      var actualCollectionRights = (
        CollectionEditorStateService.getCollectionRights());
      expect(actualCollectionRights).toEqual(expectedCollectionRights);

      // Although the actual collection rights equals the expected collection
      // rights, they are different objects. Ensure that the actual collection
      // rights is still the same object from before loading it, however.
      expect(actualCollectionRights).toBe(previousCollectionRights);
      expect(actualCollectionRights).not.toBe(expectedCollectionRights);
    }
  );

  it('should be able to set a new collection with an in-place copy',
    function() {
      var previousCollection = CollectionEditorStateService.getCollection();
      var expectedCollection = CollectionObjectFactory.create(
        secondBackendCollectionObject);
      expect(previousCollection).not.toEqual(expectedCollection);

      CollectionEditorStateService.setCollection(expectedCollection);

      var actualCollection = CollectionEditorStateService.getCollection();
      expect(actualCollection).toEqual(expectedCollection);

      // Although the actual collection equals the expected collection, they are
      // different objects. Ensure that the actual collection is still the same
      // object from before loading it, however.
      expect(actualCollection).toBe(previousCollection);
      expect(actualCollection).not.toBe(expectedCollection);
    }
  );

  it('should be able to set a new collection rights with an in-place copy',
    function() {
      var previousCollectionRights = (
        CollectionEditorStateService.getCollectionRights());
      var expectedCollectionRights = CollectionRightsObjectFactory.create(
        unpublishablePublicCollectionRightsObject);
      expect(previousCollectionRights).not.toEqual(expectedCollectionRights);

      CollectionEditorStateService.setCollectionRights(
        expectedCollectionRights);

      var actualCollectionRights = (
        CollectionEditorStateService.getCollectionRights());
      expect(actualCollectionRights).toEqual(expectedCollectionRights);

      // Although the actual collection rights equals the expected collection
      // rights, they are different objects. Ensure that the actual collection
      // rights is still the same object from before loading it, however.
      expect(actualCollectionRights).toBe(previousCollectionRights);
      expect(actualCollectionRights).not.toBe(expectedCollectionRights);
    }
  );

  it('should fire an update event after setting the new collection',
    function() {
      // Load initial collection.
      CollectionEditorStateService.loadCollection(5);
      $rootScope.$apply();

      spyOn($rootScope, '$broadcast').and.callThrough();

      var newCollection = CollectionObjectFactory.create(
        secondBackendCollectionObject);
      CollectionEditorStateService.setCollection(newCollection);

      expect($rootScope.$broadcast).toHaveBeenCalledWith(
        'collectionReinitialized');
    }
  );

  it('should fail to save the collection without first loading one',
    function() {
      expect(function() {
        CollectionEditorStateService.saveCollection('Commit message');
      }).toThrow();
    }
  );

  it('should not save the collection if there are no pending changes',
    function() {
      CollectionEditorStateService.loadCollection(5);
      $rootScope.$apply();

      spyOn($rootScope, '$broadcast').and.callThrough();
      expect(CollectionEditorStateService.saveCollection(
        'Commit message')).toBe(false);
      expect($rootScope.$broadcast).not.toHaveBeenCalled();
    }
  );

  it('should be able to save the collection and pending changes', function() {
    spyOn(
      fakeEditableCollectionBackendApiService,
      'updateCollection').and.callThrough();

    CollectionEditorStateService.loadCollection(0);
    CollectionUpdateService.setCollectionTitle(
      CollectionEditorStateService.getCollection(), 'New title');
    $rootScope.$apply();

    expect(CollectionEditorStateService.saveCollection(
      'Commit message')).toBe(true);
    $rootScope.$apply();

    var expectedId = '0';
    var expectedVersion = '1';
    var expectedCommitMessage = 'Commit message';
    var updateCollectionSpy = (
      fakeEditableCollectionBackendApiService.updateCollection);
    expect(updateCollectionSpy).toHaveBeenCalledWith(
      expectedId, expectedVersion, expectedCommitMessage, jasmine.any(Object));
  });

  it('should fire an update event after saving the collection', function() {
    CollectionEditorStateService.loadCollection(5);
    CollectionUpdateService.setCollectionTitle(
      CollectionEditorStateService.getCollection(), 'New title');
    $rootScope.$apply();

    spyOn($rootScope, '$broadcast').and.callThrough();
    CollectionEditorStateService.saveCollection('Commit message');
    $rootScope.$apply();

    expect($rootScope.$broadcast).toHaveBeenCalledWith(
      'collectionReinitialized');
  });

  it('should track whether it is currently saving the collection', function() {
    CollectionEditorStateService.loadCollection(5);
    CollectionUpdateService.setCollectionTitle(
      CollectionEditorStateService.getCollection(), 'New title');
    $rootScope.$apply();

    expect(CollectionEditorStateService.isSavingCollection()).toBe(false);
    CollectionEditorStateService.saveCollection('Commit message');
    expect(CollectionEditorStateService.isSavingCollection()).toBe(true);

    $rootScope.$apply();
    expect(CollectionEditorStateService.isSavingCollection()).toBe(false);
  });

  it('should indicate a collection is no longer saving after an error',
    function() {
      CollectionEditorStateService.loadCollection(5);
      CollectionUpdateService.setCollectionTitle(
        CollectionEditorStateService.getCollection(), 'New title');
      $rootScope.$apply();

      expect(CollectionEditorStateService.isSavingCollection()).toBe(false);
      fakeEditableCollectionBackendApiService.failure = 'Internal 500 error';

      CollectionEditorStateService.saveCollection('Commit message');
      expect(CollectionEditorStateService.isSavingCollection()).toBe(true);

      $rootScope.$apply();
      expect(CollectionEditorStateService.isSavingCollection()).toBe(false);
    }
  );
});
// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for CollectionLinearizerService.
 */

require('domain/collection/CollectionNodeObjectFactory.ts');
require('domain/collection/CollectionObjectFactory.ts');
require(
  'pages/collection-editor-page/services/collection-linearizer.service.ts');

describe('Collection linearizer service', function() {
  var CollectionObjectFactory = null;
  var CollectionNodeObjectFactory = null;
  var CollectionLinearizerService = null;

  var firstCollectionNode = null;
  var secondCollectionNode = null;
  var thirdCollectionNode = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    CollectionObjectFactory = $injector.get('CollectionObjectFactory');
    CollectionNodeObjectFactory = $injector.get('CollectionNodeObjectFactory');
    CollectionLinearizerService = $injector.get('CollectionLinearizerService');

    var firstCollectionNodeBackendObject = {
      exploration_id: 'exp_id0',
      exploration_summary: {
        title: 'exp title0',
        category: 'exp category',
        objective: 'exp objective'
      }
    };
    firstCollectionNode = CollectionNodeObjectFactory.create(
      firstCollectionNodeBackendObject);

    var secondCollectionNodeBackendObject = {
      exploration_id: 'exp_id1',
      exploration_summary: {
        title: 'exp title1',
        category: 'exp category',
        objective: 'exp objective'
      }
    };
    secondCollectionNode = CollectionNodeObjectFactory.create(
      secondCollectionNodeBackendObject);

    var thirdCollectionNodeBackendObject = {
      exploration_id: 'exp_id2',
      exploration_summary: {
        title: 'exp title2',
        category: 'exp category',
        objective: 'exp objective'
      }
    };
    thirdCollectionNode = CollectionNodeObjectFactory.create(
      thirdCollectionNodeBackendObject);
  }));

  // The linear order of explorations is: exp_id0 -> exp_id1 -> exp_id2
  var createLinearCollection = function() {
    var collection = CollectionObjectFactory.createEmptyCollection();

    // Add collections in a different order from which they will be displayed
    // by the linearizer for robustness.
    collection.addCollectionNode(firstCollectionNode);
    collection.addCollectionNode(secondCollectionNode);
    collection.addCollectionNode(thirdCollectionNode);
    return collection;
  };

  describe('removeCollectionNode()', function() {
    it('should not remove a non-existent node from a single node collection',
      function() {
        var collection = CollectionObjectFactory.createEmptyCollection();
        collection.addCollectionNode(firstCollectionNode);
        expect(collection.containsCollectionNode('exp_id0')).toBe(true);
        expect(
          CollectionLinearizerService.removeCollectionNode(
            collection, 'non_existent')).toBe(false);
        expect(collection.containsCollectionNode('exp_id0')).toBe(true);
        expect(
          CollectionLinearizerService.getCollectionNodesInPlayableOrder(
            collection)).toEqual([firstCollectionNode]);
      }
    );

    it('should not remove a non-existent node from a multiple nodes collection',
      function() {
        var collection = createLinearCollection();
        expect(
          CollectionLinearizerService.getCollectionNodesInPlayableOrder(
            collection)).toEqual(
          [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
        expect(
          CollectionLinearizerService.removeCollectionNode(
            collection, 'non_existent')).toBe(false);
        expect(
          CollectionLinearizerService.getCollectionNodesInPlayableOrder(
            collection)).toEqual(
          [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      }
    );

    it('should correctly remove a node from a single node collection',
      function() {
        var collection = CollectionObjectFactory.createEmptyCollection();
        collection.addCollectionNode(firstCollectionNode);
        expect(collection.containsCollectionNode('exp_id0')).toBe(true);
        expect(
          CollectionLinearizerService.removeCollectionNode(
            collection, 'exp_id0')).toBe(true);
        expect(collection.containsCollectionNode('exp_id0')).toBe(false);
        expect(
          CollectionLinearizerService.getCollectionNodesInPlayableOrder(
            collection)).toEqual([]);
      }
    );

    it('should correctly remove the first node from a collection', function() {
      var collection = createLinearCollection();
      expect(collection.containsCollectionNode('exp_id0')).toBe(true);
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      expect(
        CollectionLinearizerService.removeCollectionNode(
          collection, 'exp_id0')).toBe(true);
      expect(collection.containsCollectionNode('exp_id0')).toBe(false);
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual([secondCollectionNode, thirdCollectionNode]);
    });

    it('should correctly remove the last node from a collection', function() {
      var collection = createLinearCollection();
      expect(collection.containsCollectionNode('exp_id2')).toBe(true);
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      expect(
        CollectionLinearizerService.removeCollectionNode(
          collection, 'exp_id2')).toBe(true);
      expect(collection.containsCollectionNode('exp_id2')).toBe(false);
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual([firstCollectionNode, secondCollectionNode]);
    });

    it('should correctly remove a middle node from a collection', function() {
      var collection = createLinearCollection();
      expect(collection.containsCollectionNode('exp_id1')).toBe(true);
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      expect(
        CollectionLinearizerService.removeCollectionNode(
          collection, 'exp_id1')).toBe(true);
      expect(collection.containsCollectionNode('exp_id1')).toBe(false);
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual([firstCollectionNode, thirdCollectionNode]);
    });
  });

  describe('appendCollectionNode()', function() {
    it('should correctly append a node to an empty collection', function() {
      var collection = CollectionObjectFactory.createEmptyCollection();
      expect(collection.containsCollectionNode('exp_id0')).toBe(false);
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual([]);
      CollectionLinearizerService.appendCollectionNode(
        collection,
        'exp_id0',
        firstCollectionNode.getExplorationSummaryObject());
      firstCollectionNode = collection.getCollectionNodeByExplorationId(
        'exp_id0');
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual([firstCollectionNode]);
    });

    it('should correctly append a node to a non-empty collection', function() {
      var collection = createLinearCollection();
      var newCollectionNodeBackendObject = {
        exploration_id: 'exp_id3',
        exploration_summary: {
          title: 'exp title3',
          category: 'exp category',
          objective: 'exp objective'
        }
      };
      var newCollectionNode = CollectionNodeObjectFactory.create(
        newCollectionNodeBackendObject);
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      CollectionLinearizerService.appendCollectionNode(
        collection, 'exp_id3', newCollectionNode.getExplorationSummaryObject());
      newCollectionNode = collection.getCollectionNodeByExplorationId(
        'exp_id3');
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual([
        collection.getCollectionNodeByExplorationId('exp_id0'),
        collection.getCollectionNodeByExplorationId('exp_id1'),
        collection.getCollectionNodeByExplorationId('exp_id2'),
        collection.getCollectionNodeByExplorationId('exp_id3')]);
    });
  });

  describe('shiftNodeLeft()', function() {
    it('should correctly shift a node in a single node collection',
      function() {
        var collection = CollectionObjectFactory.createEmptyCollection();
        collection.addCollectionNode(firstCollectionNode);
        expect(
          CollectionLinearizerService.getCollectionNodesInPlayableOrder(
            collection)).toEqual([firstCollectionNode]);
        expect(
          CollectionLinearizerService.shiftNodeLeft(
            collection, 'exp_id0')).toBe(true);
        expect(
          CollectionLinearizerService.getCollectionNodesInPlayableOrder(
            collection)).toEqual([firstCollectionNode]);
      }
    );

    it('should not shift a non-existent node', function() {
      var collection = createLinearCollection();
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      expect(CollectionLinearizerService.shiftNodeLeft(
        collection, 'non_existent')).toBe(false);
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
    });

    it('should correctly shift the first node', function() {
      var collection = createLinearCollection();
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      expect(
        CollectionLinearizerService.shiftNodeLeft(
          collection, 'exp_id0')).toBe(true);
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
    });

    it('should correctly shift the last node', function() {
      var collection = createLinearCollection();
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      expect(
        CollectionLinearizerService.shiftNodeLeft(
          collection, 'exp_id2')).toBe(true);
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, thirdCollectionNode, secondCollectionNode]);
    });

    it('should correctly shift a middle node', function() {
      var collection = createLinearCollection();
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      expect(
        CollectionLinearizerService.shiftNodeLeft(
          collection, 'exp_id1')).toBe(true);
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [secondCollectionNode, firstCollectionNode, thirdCollectionNode]);
    });
  });

  describe('shiftNodeRight()', function() {
    it('should correctly shift a node in a single node collection',
      function() {
        var collection = CollectionObjectFactory.createEmptyCollection();
        collection.addCollectionNode(firstCollectionNode);
        expect(
          CollectionLinearizerService.getCollectionNodesInPlayableOrder(
            collection)).toEqual([firstCollectionNode]);
        expect(
          CollectionLinearizerService.shiftNodeRight(
            collection, 'exp_id0')).toBe(true);
        expect(
          CollectionLinearizerService.getCollectionNodesInPlayableOrder(
            collection)).toEqual([firstCollectionNode]);
      }
    );

    it('should not shift a non-existent node', function() {
      var collection = createLinearCollection();
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      expect(
        CollectionLinearizerService.shiftNodeRight(
          collection, 'non_existent')).toBe(false);
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
    });

    it('should correctly shift the first node', function() {
      var collection = createLinearCollection();
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      expect(
        CollectionLinearizerService.shiftNodeRight(
          collection, 'exp_id0')).toBe(true);
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [secondCollectionNode, firstCollectionNode, thirdCollectionNode]);
    });

    it('should correctly shift the last node', function() {
      var collection = createLinearCollection();
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      expect(
        CollectionLinearizerService.shiftNodeRight(
          collection, 'exp_id2')).toBe(true);
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
    });

    it('should correctly shift middle node', function() {
      var collection = createLinearCollection();
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      expect(
        CollectionLinearizerService.shiftNodeRight(
          collection, 'exp_id1')).toBe(true);
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, thirdCollectionNode, secondCollectionNode]);
    });
  });

  describe('getNextExplorationId()', function() {
    it('should return no exploration ids for a completed linear collection',
      function() {
        var collection = createLinearCollection();
        expect(
          CollectionLinearizerService.getNextExplorationId(
            collection, ['exp_id0', 'exp_id1', 'exp_id2'])).toEqual(null);
      }
    );

    it('should return next exploration id for a partially completed collection',
      function() {
        var collection = createLinearCollection();
        expect(
          CollectionLinearizerService.getNextExplorationId(
            collection, ['exp_id0', 'exp_id1'])).toEqual('exp_id2');
      }
    );
  });

  describe('getCollectionNodesInPlayableOrder()', function() {
    it('should correctly return an empty list for an empty collection',
      function() {
        var collection = CollectionObjectFactory.createEmptyCollection();
        expect(
          CollectionLinearizerService.getCollectionNodesInPlayableOrder(
            collection)).toEqual([]);
      }
    );

    it('should correctly return a list for a collection with a single node',
      function() {
        var collection = CollectionObjectFactory.createEmptyCollection();
        collection.addCollectionNode(firstCollectionNode);
        expect(
          CollectionLinearizerService.getCollectionNodesInPlayableOrder(
            collection)).toEqual([firstCollectionNode]);
      }
    );

    it('should correctly return a list for a collection with multiple nodes',
      function() {
        var collection = createLinearCollection();
        expect(
          CollectionLinearizerService.getCollectionNodesInPlayableOrder(
            collection)).toEqual(
          [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      }
    );
  });
});
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
 * @fileoverview Unit tests for the controller of the page showing the
 * user's explorations.
 */

require('pages/creator-dashboard-page/creator-dashboard-page.controller.ts');

describe('Creator dashboard controller', function() {
  describe('CreatorDashboard', function() {
    var ctrl, $httpBackend, componentController;
    var CREATOR_DASHBOARD_DATA_URL = '/creatordashboardhandler/data';
    var dashboardData = {
      explorations_list: [{
        category: 'Featured category',
        id: 'featured_exp_id',
        num_open_threads: 2,
        num_total_threads: 3,
        status: 'public',
        title: 'Featured exploration'
      }, {
        category: 'Private category',
        id: 'private_exp_id',
        num_open_threads: 0,
        num_total_threads: 0,
        status: 'private',
        title: 'Private exploration'
      }],
      collections_list: [],
      dashboard_stats: {
        total_plays: 2,
        average_ratings: 3,
        num_ratings: 2,
        total_open_feedback: 1
      },
      last_week_stats: {
        total_plays: 1,
        average_ratings: 4,
        num_ratings: 1,
        total_open_feedback: 0
      }
    };
    var sampleUserInfoBackendObject = {
      is_moderator: false,
      is_admin: false,
      is_super_admin: false,
      is_topic_manager: false,
      can_create_collections: true,
      preferred_site_language_code: null,
      username: 'tester',
      user_is_logged_in: true
    };

    // beforeEach(
    //   angular.mock.module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

    beforeEach(function() {
      // angular.mock.module(function($provide) {
      //   // $provide.service('CreatorDashboardBackendApiService', function() {
      //   //   jasmine.createSpy('fetchDashboardData').and.callThrough();
      //   // });
      //   // $provide.service('UrlInterpolationService', function() {
      //   //   jasmine.createSpy('getDirectiveTemplateUrl').and.callThrough();
      //   // })
      //   $provide.value('CreatorDashboardBackendApiService', CreatorDashboardBackendApiService)
      // });
      angular.mock.module('oppia');
    });

    beforeEach(inject(['$componentController', function(
        $componentController) {
      componentController = $componentController;
    }]));

    beforeEach(angular.mock.inject(function($injector) {
      $httpBackend = $injector.get('$httpBackend');
    }));

    beforeEach(angular.mock.inject(
      function(CreatorDashboardBackendApiService, UrlInterpolationService) {
        $httpBackend.expect('GET', '/userinfohandler').respond(
          200, sampleUserInfoBackendObject);
        $httpBackend.expect('GET', CREATOR_DASHBOARD_DATA_URL).respond(
          dashboardData);
        ctrl = componentController('creatorDashboardPage', null, {
          AlertsService: null,
          CreatorDashboardBackendApiService: CreatorDashboardBackendApiService
        });
      }
    ));

    it('should have the correct data for creator dashboard', function() {
      $httpBackend.flush();
      expect(ctrl.explorationsList).toEqual(dashboardData.explorations_list);
      expect(ctrl.collectionsList).toEqual(dashboardData.collections_list);
      expect(ctrl.dashboardStats).toEqual(dashboardData.dashboard_stats);
      expect(ctrl.lastWeekStats).toEqual(dashboardData.last_week_stats);
    });
  });
});
// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the email dashboard page.
 */

require('pages/email-dashboard-pages/email-dashboard-data.service.ts');

describe('Email Dashboard Services', function() {
  beforeEach(angular.mock.module('emailDashboardPage'));

  describe('Email Dashboard Services', function() {
    var service, $httpBackend, recentQueries;

    beforeEach(angular.mock.inject(function($injector) {
      $httpBackend = $injector.get('$httpBackend');
      service = $injector.get('EmailDashboardDataService');
    }));

    it('should fetch correct data from backend', function() {
      var recentQueries = [{
        id: 'q123',
        status: 'processing'
      },
      {
        id: 'q456',
        status: 'processing'
      }];
      $httpBackend.expectGET(/.*?emaildashboarddatahandler?.*/g).respond({
        recent_queries: recentQueries,
        cursor: null
      });
      service.getNextQueries();
      $httpBackend.flush();
      expect(service.getQueries().length).toEqual(2);
      expect(service.getQueries()).toEqual(recentQueries);
      expect(service.getCurrentPageIndex()).toEqual(0);
      expect(service.getLatestCursor()).toBe(null);
    });

    it('should post correct data to backend', function() {
      var data = {
        param1: 'value1',
        param2: 'value2'
      };
      var queryData = {
        id: 'qnew',
        status: 'processing'
      };
      var expectedQueries = [queryData];

      $httpBackend.expectPOST('/emaildashboarddatahandler').respond({
        query: queryData
      });
      service.submitQuery(data);
      $httpBackend.flush();
      expect(service.getQueries().length).toEqual(1);
      expect(service.getQueries()).toEqual(expectedQueries);
    });

    it('should replace correct query in queries list', function() {
      var recentQueries = [{
        id: 'q123',
        status: 'processing'
      },
      {
        id: 'q456',
        status: 'processing'
      }];
      var expectedQueries = [{
        id: 'q123',
        status: 'completed'
      },
      {
        id: 'q456',
        status: 'processing'
      }];

      $httpBackend.expectGET(/.*?emaildashboarddatahandler?.*/g).respond({
        recent_queries: recentQueries,
        cursor: null
      });
      service.getNextQueries();
      $httpBackend.flush();
      expect(service.getQueries().length).toEqual(2);
      expect(service.getQueries()).toEqual(recentQueries);

      $httpBackend.expectGET(/.*?querystatuscheck?.*/g).respond({
        query: {
          id: 'q123',
          status: 'completed'
        }
      });
      service.fetchQuery('q123').then(function(query) {
        expect(query.id).toEqual('q123');
        expect(query.status).toEqual('completed');
      });
      $httpBackend.flush();

      expect(service.getQueries().length).toEqual(2);
      expect(service.getQueries()).toEqual(expectedQueries);
    });

    it('should check simulation', function() {
      // Get next page of queries.
      $httpBackend.expectGET(/.*?emaildashboarddatahandler?.*/g).respond({
        recent_queries: [],
        cursor: null
      });
      service.getNextQueries();
      $httpBackend.flush();
      expect(service.getQueries().length).toEqual(0);
      expect(service.getQueries()).toEqual([]);
      expect(service.getCurrentPageIndex()).toEqual(0);

      var data = {
        param1: 'value1',
        param2: 'value2'
      };
      // Maintain list of all submitted queries for cross checking.
      var totalQueries = [];
      // Submit 25 new queries.
      for (var i = 0; i < 25; i++) {
        var queryData = {
          id: 'q' + i,
          status: 'processing'
        };
        $httpBackend.expectPOST('/emaildashboarddatahandler').respond({
          query: queryData
        });
        service.submitQuery(data);
        totalQueries.unshift(queryData);
        $httpBackend.flush();
      }
      expect(service.getQueries().length).toEqual(25);
      expect(service.getCurrentPageIndex()).toEqual(0);
      expect(service.getQueries()).toEqual(totalQueries);

      // Check that queries on page 1 are correct.
      service.getNextQueries().then(function(queries) {
        expect(queries.length).toEqual(10);
        expect(queries).toEqual(totalQueries.slice(10, 20));
      });
      expect(service.getCurrentPageIndex()).toEqual(1);

      // Check that queries on page 2 are correct.
      service.getNextQueries().then(function(queries) {
        expect(queries.length).toEqual(5);
        expect(queries).toEqual(totalQueries.slice(20, 25));
      });
      expect(service.getCurrentPageIndex()).toEqual(2);

      // Go back to page 1 and check again.
      expect(service.getPreviousQueries()).toEqual(totalQueries.slice(10, 20));
      expect(service.getCurrentPageIndex()).toEqual(1);

      // Submit a new query.
      var queryData = {
        id: 'q25',
        status: 'processing'
      };
      $httpBackend.expectPOST('/emaildashboarddatahandler').respond({
        query: queryData
      });
      service.submitQuery(data);
      $httpBackend.flush();
      totalQueries.unshift(queryData);
      expect(service.getQueries().length).toEqual(26);
      expect(service.getQueries()).toEqual(totalQueries);

      // Check that new query is added on the top of fetched queries.
      expect(service.getQueries()[0]).toEqual(queryData);

      // Check queries on page 2.
      service.getNextQueries().then(function(queries) {
        expect(queries.length).toEqual(6);
        expect(queries).toEqual(totalQueries.slice(20, 26));
      });
      expect(service.getCurrentPageIndex()).toEqual(2);

      // Check queries on page 1.
      expect(service.getPreviousQueries()).toEqual(totalQueries.slice(10, 20));
      expect(service.getCurrentPageIndex()).toEqual(1);

      // Check queries on page 0.
      expect(service.getPreviousQueries()).toEqual(totalQueries.slice(0, 10));
      expect(service.getCurrentPageIndex()).toEqual(0);
    });
  });
});
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

require('App.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require(
  'pages/exploration-editor-page/editor-tab/' +
  'exploration-editor-tab.directive.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-content.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');

describe('Exploration editor tab controller', function() {
  describe('ExplorationEditorTab', function() {
    var ecs, ess, scs, rootScope, $componentController;
    var explorationEditorTabCtrl;

    beforeEach(angular.mock.module('oppia'));
    beforeEach(angular.mock.inject(function(
        _$componentController_, $injector, $rootScope) {
      $componentController = _$componentController_;
      rootScope = $injector.get('$rootScope');
      spyOn(rootScope, '$broadcast');
      ecs = $injector.get('StateEditorService');
      ess = $injector.get('ExplorationStatesService');
      scs = $injector.get('StateContentService');

      ess.init({
        'First State': {
          content: {
            content_id: 'content',
            html: 'First State Content'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {}
            }
          },
          interaction: {
            id: 'TextInput',
            answer_groups: [{
              rule_specs: [],
              outcome: {
                dest: 'unused',
                feedback: {
                  content_id: 'feedback_1',
                  html: ''
                },
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null
              }
            }],
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
              default_outcome: {},
              feedback_1: {}
            }
          }
        },
        'Second State': {
          content: {
            content_id: 'content',
            html: 'Second State Content'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {}
            }
          },
          interaction: {
            id: 'TextInput',
            answer_groups: [{
              rule_specs: [],
              outcome: {
                dest: 'unused',
                feedback: {
                  content_id: 'feedback_1',
                  html: ''
                },
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null
              }
            }],
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
              default_outcome: {},
              feedback_1: {}
            }
          }
        },
        'Third State': {
          content: {
            content_id: 'content',
            html: 'This is some content.'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {}
            }
          },
          interaction: {
            id: 'TextInput',
            answer_groups: [{
              rule_specs: [],
              outcome: {
                dest: 'unused',
                feedback: {
                  content_id: 'feedback_1',
                  html: ''
                },
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null
              }
            }],
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
          param_changes: [{
            name: 'comparison',
            generator_id: 'Copier',
            customization_args: {
              value: 'something clever',
              parse_with_jinja: false
            }
          }],
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {}
            }
          }
        }
      });

      explorationEditorTabCtrl = $componentController('explorationEditorTab', {
        ExplorationStatesService: ess
      }, {});
    }));

    it('should correctly broadcast the stateEditorInitialized flag with ' +
       'the state data', function() {
      ecs.setActiveStateName('Third State');
      explorationEditorTabCtrl.initStateEditor();
      expect(
        rootScope.$broadcast
      ).toHaveBeenCalledWith(
        'stateEditorInitialized', ess.getState('Third State')
      );
    });
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for Answer Groups Cache Service.
 */

require(
  'pages/exploration-editor-page/editor-tab/services/' +
  'answer-groups-cache.service.ts');

describe('Answer Groups Cache Service', function() {
  describe('AnswerGroupsCache', function() {
    beforeEach(function() {
      angular.mock.module('oppia');
    });


    var answerGroup = {
      rule_specs: [],
      outcome: {
        dest: 'default',
        feedback: {
          content_id: 'feedback_1',
          html: ''
        },
        labelled_as_correct: false,
        param_changes: [],
        refresher_exploration_id: null
      }
    };

    var scope, agcs;
    beforeEach(angular.mock.inject(function($injector, $rootScope) {
      scope = $rootScope.$new();
      agcs = $injector.get('AnswerGroupsCacheService');
    }));

    it('sets a value in the cache', function() {
      agcs.set('InteractionId', answerGroup);
      expect(agcs.contains('InteractionId')).toBe(true);
    });

    it('returns null when value isnt available in the cache', function() {
      expect(agcs.get('NonPresentInteractionId')).toEqual(null);
    });

    it('gets a value from the cache', function() {
      agcs.set('InteractionId', answerGroup);
      expect(agcs.get('InteractionId')).toEqual(answerGroup);
    });

    it('successfully checks if the value is available in cache', function() {
      agcs.set('InteractionId', answerGroup);
      expect(agcs.contains('InteractionId')).toBe(true);
      expect(agcs.contains('NonPresentInteractionId')).toBe(false);
      expect(agcs.contains('')).toBe(false);
      expect(agcs.contains(1)).toBe(false);
    });

    it('resets the cache', function() {
      agcs.set('InteractionId', answerGroup);
      expect(agcs.contains('InteractionId')).toBe(true);
      agcs.reset();
      expect(agcs.contains('InteractionId')).toBe(false);
    });
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for Interaction Details Cache Service.
 */

require(
  'pages/exploration-editor-page/editor-tab/services/' +
  'interaction-details-cache.service.ts');

describe('Interaction Details Cache Service', function() {
  describe('InteractionDetailsCache', function() {
    beforeEach(function() {
      angular.mock.module('oppia');
    });

    var interactionCustomizationArgs = {
      choices: {
        value: 'SampleChoice'
      }
    };

    var interaction = {
      customization: interactionCustomizationArgs
    };

    var scope = null, idcs = null;
    beforeEach(angular.mock.inject(function($injector, $rootScope) {
      scope = $rootScope.$new();
      idcs = $injector.get('InteractionDetailsCacheService');
    }));

    it('should add interaction in the cache', function() {
      idcs.set('InteractionId', interactionCustomizationArgs);
      expect(idcs.contains('InteractionId')).toBe(true);
    });

    it('should return null if interaction isnt present in cache', function() {
      expect(idcs.get('NonPresentInteractionId')).toEqual(null);
    });

    it('should get interaction details from the cache', function() {
      idcs.set('InteractionId', interactionCustomizationArgs);
      expect(idcs.get('InteractionId')).toEqual(interaction);
    });

    it('should successfully check if interaction is in cache', function() {
      idcs.set('InteractionId', interactionCustomizationArgs);
      expect(idcs.contains('InteractionId')).toBe(true);
      expect(idcs.contains('NonPresentInteractionId')).toBe(false);
      expect(idcs.contains('')).toBe(false);
      expect(idcs.contains(1)).toBe(false);
    });

    it('should remove the interaction from the cache', function() {
      idcs.set('InteractionId', interactionCustomizationArgs);
      expect(idcs.contains('InteractionId')).toBe(true);
      idcs.removeDetails('InteractionId');
      expect(idcs.contains('InteractionId')).toBe(false);
    });

    it('should reset the cache', function() {
      idcs.set('InteractionId', interactionCustomizationArgs);
      expect(idcs.contains('InteractionId')).toBe(true);
      idcs.reset();
      expect(idcs.contains('InteractionId')).toBe(false);
    });
  });
});
// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for Solution Validity Service.
 */

require(
  'pages/exploration-editor-page/editor-tab/services/' +
  'solution-validity.service.ts');

describe('Solution Validity Service', function() {
  describe('SolutionValidityService', function() {
    beforeEach(function() {
      angular.mock.module('oppia');
    });

    var scope, svs;

    beforeEach(angular.mock.inject(function($injector, $rootScope) {
      scope = $rootScope.$new();
      svs = $injector.get('SolutionValidityService');

      it('should store validity of the solution correctly',
        function() {
          // Initialize SolutionValidityService.
          svs.init();

          svs.updateValidity('State 1', true);
          expect(svs.isSolutionValid('State 1')).toBe(true);

          svs.deleteSolutionValidity('State 1');
          expect(Object.keys(svs.getAllValidities())).toEqual([]);

          svs.updateValidity('State 1', false);
          expect(svs.isSolutionValid('State 1')).toBe(false);
        });
    }));
  });
});
// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for Solution Verification Service.
 */

require('App.ts');
require('domain/exploration/SolutionObjectFactory.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require(
  'pages/exploration-editor-page/editor-tab/services/' +
  'interaction-details-cache.service.ts');
require(
  'pages/exploration-editor-page/editor-tab/services/' +
  'solution-verification.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-customization-args.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-interaction-id.service.ts');

describe('Solution Verification Service', function() {
  beforeEach(function() {
    angular.mock.module('oppia');
    // Set a global value for INTERACTION_SPECS that will be used by all the
    // descendant dependencies.
    angular.mock.module(function($provide) {
      $provide.constant('INTERACTION_SPECS', {
        TextInput: {
          display_mode: 'inline',
          is_terminal: false
        },
        TerminalInteraction: {
          display_mode: 'inline',
          is_terminal: true
        }
      });
    });
  });

  var ess, siis, scas, idc, sof, svs, see, IS, mockFunctions;
  var rootScope;
  var mockExplorationData;
  var successCallbackSpy, errorCallbackSpy;

  beforeEach(function() {
    mockExplorationData = {
      explorationId: 0,
      autosaveChangeList: function() {}
    };
    angular.mock.module(function($provide) {
      $provide.value('ExplorationDataService', [mockExplorationData][0]);
    });
    spyOn(mockExplorationData, 'autosaveChangeList');
  });

  beforeEach(angular.mock.inject(function($injector) {
    ess = $injector.get('ExplorationStatesService');
    siis = $injector.get('StateInteractionIdService');
    scas = $injector.get('StateCustomizationArgsService');
    idc = $injector.get('InteractionDetailsCacheService');
    sof = $injector.get('SolutionObjectFactory');
    see = $injector.get('StateEditorService');
    svs = $injector.get('SolutionVerificationService');
    IS = $injector.get('INTERACTION_SPECS');
    rootScope = $injector.get('$rootScope');

    ess.init({
      'First State': {
        content: {
          content_id: 'content',
          html: 'First State Content'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {},
            hint_1: {},
            hint_2: {}
          }
        },
        interaction: {
          id: 'TextInput',
          answer_groups: [{
            outcome: {
              dest: 'End State',
              feedback: {
                content_id: 'feedback_1',
                html: ''
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
            },
            rule_specs: [{
              inputs: {x: 'abc'},
              rule_type: 'Contains'
            }]
          }],
          default_outcome: {
            dest: 'First State',
            feedback: {
              content_id: 'default_outcome',
              html: ''
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null
          },
          hints: [{
            hint_content: {
              content_id: 'hint_1',
              html: 'one'
            }
          }, {
            hint_content: {
              content_id: 'hint_2',
              html: 'two'
            }
          }]
        },
        param_changes: [],
        solicit_answer_details: false,
        written_translations: {
          translations_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {},
            hint_1: {},
            hint_2: {}
          }
        }
      },
      'End State': {
        content: {
          content_id: 'content',
          html: ''
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {}
          }
        },
        interaction: {
          id: 'TextInput',
          answer_groups: [{
            rule_specs: [],
            outcome: {
              dest: 'default',
              feedback: {
                content_id: 'feedback_1',
                html: ''
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
            }
          }],
          default_outcome: {
            dest: 'default',
            feedback: {
              content_id: 'default_outcome',
              html: ''
            },
            param_changes: []
          },
          hints: []
        },
        param_changes: [],
        solicit_answer_details: false,
        written_translations: {
          translations_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {}
          }
        }
      }
    });
  }));

  describe('Success case', function() {
    it('should verify a correct solution', function() {
      var state = ess.getState('First State');
      siis.init(
        'First State', state.interaction.id, state.interaction, 'widget_id');
      scas.init(
        'First State', state.interaction.customizationArgs,
        state.interaction, 'widget_customization_args');

      siis.savedMemento = 'TextInput';
      ess.saveSolution('First State', sof.createNew(false, 'abc', 'nothing'));

      expect(
        svs.verifySolution('First State', state.interaction,
          ess.getState('First State').interaction.solution.correctAnswer)
      ).toBe(true);

      see.setInQuestionMode(true);
      state.interaction.answerGroups[0].outcome.dest = 'First State';
      state.interaction.answerGroups[0].outcome.labelledAsCorrect = true;
      expect(
        svs.verifySolution('First State', state.interaction,
          ess.getState('First State').interaction.solution.correctAnswer)
      ).toBe(true);
    });
  });

  describe('Failure case', function() {
    it('should verify an incorrect solution', function() {
      var state = ess.getState('First State');
      siis.init(
        'First State', state.interaction.id, state.interaction, 'widget_id');
      scas.init(
        'First State', state.interaction.customizationArgs,
        state.interaction, 'widget_customization_args');

      siis.savedMemento = 'TextInput';
      ess.saveSolution('First State', sof.createNew(false, 'xyz', 'nothing'));

      expect(
        svs.verifySolution('First State', state.interaction,
          ess.getState('First State').interaction.solution.correctAnswer)
      ).toBe(false);
    });
  });
});
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

require('App.ts');
require('domain/utilities/UrlInterpolationService.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require(
  'pages/exploration-editor-page/editor-tab/state-name-editor/' +
  'state-name-editor.directive.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require('services/stateful/FocusManagerService.ts');

describe('Sidebar state name controller', function() {
  describe('SidebarStateName', function() {
    var scope, filter, ctrl, ecs, fs, ess, rootScope, outerScope;
    var $httpBackend;
    var mockExplorationData;

    var autosaveDraftUrl = 'createhandler/autosave_draft/0';
    var validAutosaveResponse = {
      is_version_of_draft_valid: true
    };

    beforeEach(angular.mock.module('directiveTemplates'));
    beforeEach(function() {
      angular.mock.module('oppia');
    });

    beforeEach(function() {
      mockExplorationData = {
        explorationId: 0,
        autosaveChangeList: function() {}
      };
      angular.mock.module(function($provide) {
        $provide.value('ExplorationDataService', [mockExplorationData][0]);
        $provide.constant('INVALID_NAME_CHARS', '#@&^%$');
      });
      spyOn(mockExplorationData, 'autosaveChangeList');
    });

    beforeEach(angular.mock.inject(function(
        $compile, $filter, $injector, $rootScope, $templateCache) {
      filter = $filter;
      rootScope = $rootScope;
      ecs = $injector.get('StateEditorService');
      fs = $injector.get('FocusManagerService');
      ess = $injector.get('ExplorationStatesService');
      $httpBackend = $injector.get('$httpBackend');

      ess.init({
        'First State': {
          content: {
            content_id: 'content',
            html: 'First State Content'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {}
            }
          },
          interaction: {
            answer_groups: [],
            default_outcome: {
              dest: 'Second State',
              feedback: {
                content_id: 'default_outcome',
                html: ''
              },
              param_changes: []
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
        },
        'Second State': {
          content: {
            content_id: 'content',
            html: 'Second State Content'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {}
            }
          },
          interaction: {
            answer_groups: [],
            default_outcome: {
              dest: 'Second State',
              feedback: {
                content_id: 'default_outcome',
                html: ''
              },
              param_changes: []
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
        },
        'Third State': {
          content: {
            content_id: 'content',
            html: 'This is some content.'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {}
            }
          },
          interaction: {
            answer_groups: [],
            default_outcome: {
              dest: 'Second State',
              feedback: {
                content_id: 'default_outcome',
                html: ''
              },
              param_changes: []
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
          }],
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {}
            }
          },
        }
      });

      outerScope = $rootScope.$new();
      var elem = angular.element(
        '<state-name-editor></state-name-editor>');
      var compiledElem = $compile(elem)(outerScope);
      outerScope.$digest();
      scope = compiledElem[0].getControllerScope();
    }));

    it('should correctly normalize whitespace in a state name', function() {
      expect(scope._getNormalizedStateName('   First     State  '))
        .toEqual('First State');
      expect(scope._getNormalizedStateName('Fourth     State       '))
        .toEqual('Fourth State');
      expect(scope._getNormalizedStateName('Fourth State'))
        .toEqual('Fourth State');
      expect(scope._getNormalizedStateName('    ')).toEqual('');
      expect(scope._getNormalizedStateName('Z    ')).toEqual('Z');
      expect(scope._getNormalizedStateName('    .')).toEqual('.');
    });

    it('should not save state names longer than 50 characters', function() {
      expect(
        scope.saveStateName(
          'babababababababababababababababababababababababababab')
      ).toBe(false);
    });

    it('should not save invalid names', function() {
      ecs.setActiveStateName('Third State');
      scope.initStateNameEditor();
      expect(scope.saveStateName('#')).toBe(false);
      expect(ecs.getActiveStateName()).toBe('Third State');
    });

    it('should not save duplicate state names', function() {
      expect(scope.saveStateName('Second State')).toBe(false);
    });

    it('should check that state names are changeable', function() {
      ecs.setActiveStateName('First State');
      scope.initStateNameEditor();
      expect(scope.stateName).toEqual('First State');
      expect(ecs.getActiveStateName()).toEqual('First State');

      scope.saveStateName('Fourth State');
      expect(scope.stateName).toEqual('Fourth State');
      expect(ecs.getActiveStateName()).toEqual('Fourth State');
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);

      scope.saveStateName('Fifth State');
      expect(scope.stateName).toEqual('Fifth State');
      expect(ecs.getActiveStateName()).toEqual('Fifth State');
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    });

    it('should allow state names to be variations of \'END\'', function() {
      ecs.setActiveStateName('First State');
      scope.initStateNameEditor();

      expect(scope.saveStateName('END')).toBe(true);
      expect(scope.saveStateName('enD')).toBe(true);
      expect(scope.saveStateName('end')).toBe(true);
    });

    it('should check that state name edits are independent', function() {
      ecs.setActiveStateName('Third State');
      scope.saveStateName('Fourth State');
      expect(ecs.getActiveStateName()).toEqual('Fourth State');
      expect(ess.getState('Fourth State')).toBeTruthy();
      expect(ess.getState('Third State')).toBeFalsy();

      ecs.setActiveStateName('First State');
      scope.saveStateName('Fifth State');
      expect(ess.getState('Fifth State')).toBeTruthy();
      expect(ess.getState('First State')).toBeFalsy();
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    });

    it('should not re-save unedited state names', function() {
      ecs.setActiveStateName('Second State');
      scope.initStateNameEditor();
      scope.openStateNameEditor();
      expect(scope.saveStateName('Second State')).toBe(false);
    });

    it('should not change state name if state name edits fail', function() {
      ecs.setActiveStateName('Third State');
      scope.initStateNameEditor();
      scope.openStateNameEditor();

      // This is not a valid state name.
      scope.saveStateName('#!% State');
      expect(ecs.getActiveStateName()).toEqual('Third State');
      expect(mockExplorationData.autosaveChangeList).not.toHaveBeenCalled();

      // Long state names will not save.
      scope.saveStateName(
        'This state name is too long to be saved. Try to be brief next time.'
      );
      expect(ecs.getActiveStateName()).toEqual('Third State');
      expect(mockExplorationData.autosaveChangeList).not.toHaveBeenCalled();

      // This will not save because it is an already existing state name.
      scope.saveStateName('First State');
      expect(ecs.getActiveStateName()).toEqual('Third State');
      expect(mockExplorationData.autosaveChangeList).not.toHaveBeenCalled();

      // Will not save because the memento is the same as the new state name.
      scope.saveStateName('Third State');
      expect(ecs.getActiveStateName()).toEqual('Third State');
      expect(mockExplorationData.autosaveChangeList).not.toHaveBeenCalled();
    });
  });
});
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
 * @fileoverview Unit tests for the training data service.
 */

require('App.ts');
require('domain/exploration/OutcomeObjectFactory.ts');
require('pages/exploration-editor-page/services/change-list.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require(
  'pages/exploration-editor-page/editor-tab/services/responses.service.ts');
require(
  'pages/exploration-editor-page/editor-tab/training-panel/' +
  'training-data.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-interaction-id.service.ts');

describe('TrainingDataService', function() {
  var $httpBackend;
  var scope, siis, ecs, cls, rs, tds, ess, IS, oof;
  var mockExplorationData;

  beforeEach(
    angular.mock.module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

  beforeEach(function() {
    angular.mock.module('oppia');
    // Set a global value for INTERACTION_SPECS that will be used by all the
    // descendant dependencies.
    angular.mock.module(function($provide) {
      $provide.constant('INTERACTION_SPECS', {
        TextInput: {
          display_mode: 'inline',
          is_terminal: false
        }
      });
    });
    mockExplorationData = {
      explorationId: 0,
      autosaveChangeList: function() {}
    };
    angular.mock.module(function($provide) {
      $provide.value('ExplorationDataService', [mockExplorationData][0]);
    });
    spyOn(mockExplorationData, 'autosaveChangeList');
  });

  beforeEach(angular.mock.inject(function($injector, $rootScope) {
    scope = $rootScope.$new();
    $httpBackend = $injector.get('$httpBackend');
    siis = $injector.get('StateInteractionIdService');
    ecs = $injector.get('StateEditorService');
    cls = $injector.get('ChangeListService');
    ess = $injector.get('ExplorationStatesService');
    rs = $injector.get('ResponsesService');
    tds = $injector.get('TrainingDataService');
    IS = $injector.get('INTERACTION_SPECS');
    oof = $injector.get('OutcomeObjectFactory');

    // Set the currently loaded interaction ID.
    siis.savedMemento = 'TextInput';

    ess.init({
      State: {
        content: {
          content_id: 'content',
          html: 'State Content'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {}
          }
        },
        interaction: {
          id: 'TextInput',
          answer_groups: [{
            rule_specs: [{
              rule_type: 'Contains',
              inputs: {
                x: 'Test'
              }
            }],
            outcome: {
              dest: 'State',
              feedback: {
                content_id: 'feedback_1',
                html: 'Feedback'
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null
            },
            training_data: [],
            tagged_misconception_id: null
          }],
          default_outcome: {
            dest: 'State',
            feedback: {
              content_id: 'default_outcome',
              html: 'Default'
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null
          },
          hints: [],
          confirmed_unclassified_answers: []
        },
        param_changes: [],
        solicit_answer_details: false,
        written_translations: {
          translations_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {}
          }
        },
      }
    });

    var state = ess.getState('State');
    rs.init({
      answerGroups: state.interaction.answerGroups,
      defaultOutcome: state.interaction.defaultOutcome,
      confirmedUnclassifiedAnswers: (
        state.interaction.confirmedUnclassifiedAnswers)
    });

    ecs.setActiveStateName('State');
  }));

  it('should be able to train answer groups and the default response',
    function() {
      // Training the first answer of a group should add a new classifier.
      tds.associateWithAnswerGroup(0, 'text answer');
      var state = ess.getState('State');
      expect(state.interaction.answerGroups[0].trainingData).toEqual([
        'text answer'
      ]);

      // Training a second answer to the same group should append the answer
      // to the training data.
      tds.associateWithAnswerGroup(0, 'second answer');
      state = ess.getState('State');
      expect(state.interaction.answerGroups[0].trainingData).toEqual([
        'text answer', 'second answer'
      ]);

      // Training the default response should add information to the confirmed
      // unclassified answers.
      tds.associateWithDefaultResponse('third answer');
      state = ess.getState('State');
      expect(state.interaction.confirmedUnclassifiedAnswers).toEqual([
        'third answer'
      ]);
    }
  );

  it('should be able to retrain answers between answer groups and the ' +
      'default outcome', function() {
    // Retraining an answer from the answer group to the default outcome
    // should remove it from the first, then add it to the second.
    tds.associateWithAnswerGroup(0, 'text answer');
    tds.associateWithAnswerGroup(0, 'second answer');
    tds.associateWithDefaultResponse('third answer');

    // Verify initial state.
    var state = ess.getState('State');
    expect(state.interaction.answerGroups[0].trainingData).toEqual([
      'text answer', 'second answer'
    ]);
    expect(state.interaction.confirmedUnclassifiedAnswers).toEqual([
      'third answer'
    ]);

    // Try to retrain the second answer (answer group -> default response).
    tds.associateWithDefaultResponse('second answer');
    state = ess.getState('State');
    expect(state.interaction.answerGroups[0].trainingData).toEqual([
      'text answer'
    ]);
    expect(state.interaction.confirmedUnclassifiedAnswers).toEqual([
      'third answer', 'second answer'
    ]);

    // Try to retrain the third answer (default response -> answer group).
    tds.associateWithAnswerGroup(0, 'third answer');
    state = ess.getState('State');
    expect(state.interaction.answerGroups[0].trainingData).toEqual([
      'text answer', 'third answer'
    ]);
    expect(state.interaction.confirmedUnclassifiedAnswers).toEqual([
      'second answer'
    ]);
  });

  it('should not be able to train duplicated answers', function() {
    tds.associateWithAnswerGroup(0, 'text answer');
    tds.associateWithDefaultResponse('second answer');

    // Verify initial state.
    var state = ess.getState('State');
    expect(state.interaction.answerGroups[0].trainingData).toEqual([
      'text answer'
    ]);
    expect(state.interaction.confirmedUnclassifiedAnswers).toEqual([
      'second answer'
    ]);

    // Training a duplicate answer for the answer group should change nothing.
    tds.associateWithAnswerGroup(0, 'text answer');
    state = ess.getState('State');
    expect(state.interaction.answerGroups[0].trainingData).toEqual([
      'text answer'
    ]);

    // Training a duplicate answer for the default response should change
    // nothing.
    tds.associateWithDefaultResponse('second answer');
    state = ess.getState('State');
    expect(state.interaction.answerGroups[0].trainingData).toEqual([
      'text answer'
    ]);
  });

  it('should get all potential outcomes of an interaction', function() {
    // First the answer group's outcome is listed, then the default.
    expect(tds.getAllPotentialOutcomes(ess.getState('State'))).toEqual([
      oof.createNew('State', 'feedback_1', 'Feedback', []),
      oof.createNew('State', 'default_outcome', 'Default', [])]);
  });

  it('should remove answer from training data associated with given answer ' +
      'group', function() {
    tds.associateWithAnswerGroup(0, 'text answer');
    tds.associateWithAnswerGroup(0, 'second answer');
    tds.associateWithAnswerGroup(0, 'another answer');

    var state = ess.getState('State');
    expect(state.interaction.answerGroups[0].trainingData).toEqual([
      'text answer', 'second answer', 'another answer'
    ]);

    tds.removeAnswerFromAnswerGroupTrainingData('second answer', 0);

    state = ess.getState('State');
    expect(state.interaction.answerGroups[0].trainingData).toEqual([
      'text answer', 'another answer'
    ]);
  });

  it('should correctly check whether answer is in confirmed unclassified ' +
      'answers', function() {
    tds.associateWithAnswerGroup(0, 'text answer');
    tds.associateWithAnswerGroup(0, 'another answer');
    tds.associateWithDefaultResponse('second answer');

    var state = ess.getState('State');
    expect(state.interaction.answerGroups[0].trainingData).toEqual([
      'text answer', 'another answer'
    ]);
    expect(state.interaction.confirmedUnclassifiedAnswers).toEqual([
      'second answer'
    ]);

    expect(tds.isConfirmedUnclassifiedAnswer('text answer')).toBe(false);
    expect(tds.isConfirmedUnclassifiedAnswer('second answer')).toBe(true);
  });

  it('should get all the training data answers', function() {
    tds.associateWithAnswerGroup(0, 'text answer');
    tds.associateWithAnswerGroup(0, 'another answer');
    tds.associateWithDefaultResponse('second answer');
    expect(tds.getTrainingDataAnswers()).toEqual([{
      answerGroupIndex: 0,
      answers: ['text answer', 'another answer']
    }]);
  });
});
// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for ThreadDataService, which retrieves thread
 * data for the feedback tab of the exploration editor.
 */

require(
  'pages/exploration-editor-page/feedback-tab/services/thread-data.service.ts');

describe('retrieving threads service', function() {
  var expId = '12345';
  beforeEach(
    angular.mock.module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));
  beforeEach(function() {
    angular.mock.module('oppia');
    angular.mock.module(function($provide) {
      $provide.value('ExplorationDataService', {
        explorationId: expId
      });
    });
  });

  var ThreadDataService, httpBackend;
  beforeEach(angular.mock.inject(function($httpBackend, _ThreadDataService_) {
    ThreadDataService = _ThreadDataService_;
    httpBackend = $httpBackend;
  }));

  it('should retrieve feedback threads', function() {
    var mockFeedbackThreads = [
      {
        last_updated: 1441870501230.642,
        original_author_username: 'test_learner',
        state_name: null,
        status: 'open',
        subject: 'Feedback from a learner',
        summary: null,
        thread_id: 'abc1'
      },
      {
        last_updated: 1441870501231.642,
        original_author_username: 'test_learner',
        state_name: null,
        status: 'open',
        subject: 'Feedback from a learner',
        summary: null,
        thread_id: 'abc2'
      }
    ];

    var mockGeneralSuggestionThreads = [
      {
        assigned_reviewer_id: null,
        author_name: 'author_1',
        change_cmd: {
          new_value: {
            html: 'new content html',
            audio_translation: {}
          },
          old_value: null,
          cmd: 'edit_state_property',
          state_name: 'state_1',
          property_name: 'content'
        },
        final_reviewer_id: null,
        last_updated: 1528564605944.896,
        score_category: 'content.Algebra',
        status: 'received',
        suggestion_id: 'exploration.exp_1.1234',
        suggestion_type: 'edit_exploration_state_content',
        target_id: 'exp_1',
        target_type: 'exploration',
        target_version_at_submission: 1,
        thread_id: 'exp_1.1234'
      }
    ];
    var feedbackThreadsForSuggestionThreads = [
      {
        description: 'Suggestion',
        last_updated: 1441870501231.642,
        original_author_username: 'test_learner',
        state_name: null,
        status: 'open',
        subject: 'Suggestion from a learner',
        summary: null,
        thread_id: 'exp_1.1234'
      }
    ];
    httpBackend.whenGET('/threadlisthandler/' + expId).respond({
      threads: mockFeedbackThreads.concat(feedbackThreadsForSuggestionThreads)
    });

    httpBackend.whenGET(
      '/generalsuggestionlisthandler?target_type=exploration' +
      '&target_id=' + expId).respond({
      suggestions: mockGeneralSuggestionThreads
    });

    ThreadDataService.fetchThreads(function() {
      for (var i = 0; i < mockFeedbackThreads.length; i++) {
        expect(ThreadDataService.data.feedbackThreads).toContain(
          mockFeedbackThreads[i]);
      }

      for (var i = 0; i < mockGeneralSuggestionThreads.length; i++) {
        expect(ThreadDataService.data.suggestionThreads).toContain(
          mockGeneralSuggestionThreads[i]);
      }
    });
    httpBackend.flush();
  });
});
// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for ThreadStatusDisplayService, that provides
 * information about how to display the status label for a thread in the
 * feedback tab of the exploration editor.
 */

require(
  'pages/exploration-editor-page/feedback-tab/services/' +
  'thread-status-display.service.ts');

describe('Thread Status Display Service', function() {
  beforeEach(
    angular.mock.module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));
  var ThreadStatusDisplayService;
  beforeEach(angular.mock.inject(function(_ThreadStatusDisplayService_) {
    ThreadStatusDisplayService = _ThreadStatusDisplayService_;
  }));

  it('should give human readable status for status choice', function() {
    var mockStatusChoices = ThreadStatusDisplayService.STATUS_CHOICES;

    for (var i = 0; i < mockStatusChoices.length; i++) {
      mockStatusID = mockStatusChoices[i].id;
      expect(
        ThreadStatusDisplayService.getHumanReadableStatus(
          mockStatusID)).toBe(mockStatusChoices[i].text);
    }

    var mockStatusID = 'INVALID_STATUS';
    expect(
      ThreadStatusDisplayService.getHumanReadableStatus(
        mockStatusID)).toBe('');
  });

  it('should give appropriate label class for status id', function() {
    var mockStatusID = 'open';
    expect(ThreadStatusDisplayService.getLabelClass(mockStatusID)).toBe(
      'label label-info');

    mockStatusID = 'fixed';
    expect(ThreadStatusDisplayService.getLabelClass(mockStatusID)).toBe(
      'label label-default');

    mockStatusID = 'ignored';
    expect(ThreadStatusDisplayService.getLabelClass(mockStatusID)).toBe(
      'label label-default');

    mockStatusID = 'not_actionable';
    expect(ThreadStatusDisplayService.getLabelClass(mockStatusID)).toBe(
      'label label-default');

    mockStatusID = 'compliment';
    expect(ThreadStatusDisplayService.getLabelClass(mockStatusID)).toBe(
      'label label-success');
  });
});
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
 * @fileoverview Unit tests for the exploration history tab.
 */

require('pages/exploration-editor-page/history-tab/history-tab.directive.ts');

describe('HistoryTab controller', function() {
  beforeEach(angular.mock.module('oppia'));

  describe('HistoryTab', function() {
    var $componentController, historyTabCtrl;

    beforeEach(angular.mock.inject(function(_$componentController_) {
      $componentController = _$componentController_;
      historyTabCtrl = $componentController('historyTab', null, {});
    }));

    it('should get version numbers of revisions to be displayed',
      function() {
        historyTabCtrl.displayedCurrentPageNumber = 1;
        historyTabCtrl.versionCheckboxArray = [
          {vnum: 32, selected: false},
          {vnum: 31, selected: true},
          {vnum: 30, selected: false},
          {vnum: 29, selected: false},
          {vnum: 28, selected: false},
          {vnum: 27, selected: false},
          {vnum: 26, selected: false},
          {vnum: 25, selected: false},
          {vnum: 24, selected: false},
          {vnum: 23, selected: false},
          {vnum: 22, selected: false},
          {vnum: 21, selected: false},
          {vnum: 20, selected: false},
          {vnum: 19, selected: false},
          {vnum: 18, selected: false},
          {vnum: 17, selected: false},
          {vnum: 16, selected: false},
          {vnum: 15, selected: false},
          {vnum: 14, selected: true},
          {vnum: 13, selected: false},
          {vnum: 12, selected: false},
          {vnum: 11, selected: false},
          {vnum: 10, selected: false},
          {vnum: 9, selected: false},
          {vnum: 8, selected: false},
          {vnum: 7, selected: false},
          {vnum: 6, selected: false},
          {vnum: 5, selected: false},
          {vnum: 4, selected: false},
          {vnum: 3, selected: false},
          {vnum: 2, selected: false},
          {vnum: 1, selected: false}
        ];
        historyTabCtrl.computeVersionsToDisplay();
        expect(historyTabCtrl.versionNumbersToDisplay).toEqual([
          32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16,
          15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3]);
        historyTabCtrl.displayedCurrentPageNumber = 2;
        historyTabCtrl.computeVersionsToDisplay();
        expect(historyTabCtrl.versionNumbersToDisplay).toEqual([2, 1]);
      }
    );
  });
});
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

require(
  'pages/exploration-editor-page/history-tab/services/' +
  'compare-versions.service.ts');
require(
  'pages/exploration-editor-page/history-tab/services/version-tree.service.ts');

describe('Compare versions service', function() {
  beforeEach(angular.mock.module('oppia'));

  describe('compare versions service', function() {
    var cvs = null;
    var vts = null;
    var treeParents = null;
    var $httpBackend = null;
    var mockExplorationData = null;

    beforeEach(
      angular.mock.module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));
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
              rule_specs: []
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

    var testSnapshots1 = [{
      commit_type: 'create',
      version_number: 1
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
          content_id: 'content',
          html: 'More text'
        },
        old_value: {
          content_id: 'content',
          html: ''
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
          content_id: 'content',
          html: ''
        },
        old_value: {
          content_id: 'content',
          html: 'Some text'
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
      $httpBackend.expect('GET', '/explorehandler/init/0?v=1')
        .respond(_getStatesData(testExplorationData1[0]));
      $httpBackend.expect('GET', '/explorehandler/init/0?v=7')
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
        $httpBackend.expect('GET', '/explorehandler/init/0?v=5')
          .respond(_getStatesData(testExplorationData1[4]));
        $httpBackend.expect('GET', '/explorehandler/init/0?v=8')
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
      }
    );

    it('should not include added, then deleted state', function() {
      $httpBackend.expect('GET', '/explorehandler/init/0?v=7')
        .respond(_getStatesData(testExplorationData1[6]));
      $httpBackend.expect('GET', '/explorehandler/init/0?v=9')
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
      $httpBackend.expect('GET', '/explorehandler/init/0?v=8')
        .respond(_getStatesData(testExplorationData1[7]));
      $httpBackend.expect('GET', '/explorehandler/init/0?v=10')
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
      $httpBackend.expect('GET', '/explorehandler/init/0?v=11')
        .respond(_getStatesData(testExplorationData1[10]));
      $httpBackend.expect('GET', '/explorehandler/init/0?v=13')
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
      $httpBackend.expect('GET', '/explorehandler/init/0?v=1')
        .respond(_getStatesData(testExplorationData1[0]));
      $httpBackend.expect('GET', '/explorehandler/init/0?v=11')
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
      $httpBackend.expect('GET', '/explorehandler/init/0?v=2')
        .respond(_getStatesData(testExplorationData1[1]));
      $httpBackend.expect('GET', '/explorehandler/init/0?v=4')
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
        $httpBackend.expect('GET', '/explorehandler/init/0?v=1')
          .respond(_getStatesData(testExplorationData1[0]));
        $httpBackend.expect('GET', '/explorehandler/init/0?v=13')
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
      }
    );

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
          content_id: 'content',
          html: 'Some text'
        },
        old_value: {
          content_id: 'content',
          html: ''
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
      $httpBackend.expect('GET', '/explorehandler/init/0?v=1')
        .respond(_getStatesData(testExplorationData2[0]));
      $httpBackend.expect('GET', '/explorehandler/init/0?v=5')
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
        $httpBackend.expect('GET', '/explorehandler/init/0?v=3')
          .respond(_getStatesData(testExplorationData2[2]));
        $httpBackend.expect('GET', '/explorehandler/init/0?v=5')
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
      }
    );

    it('should mark states correctly when compared version is a reversion',
      function() {
        $httpBackend.expect('GET', '/explorehandler/init/0?v=4')
          .respond(_getStatesData(testExplorationData2[3]));
        $httpBackend.expect('GET', '/explorehandler/init/0?v=5')
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
      }
    );

    it('should mark states correctly when there are 2 reversions', function() {
      $httpBackend.expect('GET', '/explorehandler/init/0?v=5')
        .respond(_getStatesData(testExplorationData2[4]));
      $httpBackend.expect('GET', '/explorehandler/init/0?v=8')
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
      $httpBackend.expect('GET', '/explorehandler/init/0?v=1')
        .respond(_getStatesData(testExplorationData3[0]));
      $httpBackend.expect('GET', '/explorehandler/init/0?v=2')
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
      $httpBackend.expect('GET', '/explorehandler/init/0?v=5')
        .respond(_getStatesData(testExplorationData3[4]));
      $httpBackend.expect('GET', '/explorehandler/init/0?v=6')
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
      $httpBackend.expect('GET', '/explorehandler/init/0?v=3')
        .respond(_getStatesData(testExplorationData3[2]));
      $httpBackend.expect('GET', '/explorehandler/init/0?v=5')
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
      $httpBackend.expect('GET', '/explorehandler/init/0?v=2')
        .respond(_getStatesData(testExplorationData3[1]));
      $httpBackend.expect('GET', '/explorehandler/init/0?v=7')
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
      $httpBackend.expect('GET', '/explorehandler/init/0?v=6')
        .respond(_getStatesData(testExplorationData3[5]));
      $httpBackend.expect('GET', '/explorehandler/init/0?v=8')
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
 * @fileoverview Unit tests for the Versions Tree Service.
 */

require(
  'pages/exploration-editor-page/history-tab/services/version-tree.service.ts');

describe('Versions tree service', function() {
  beforeEach(angular.mock.module('oppia'));

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
          html: 'Some text',
          audio_translations: {}
        },
        old_value: {
          html: '',
          audio_translations: {}
        }
      }],
      version_number: 8
    }];

    beforeEach(angular.mock.inject(function($injector) {
      vts = $injector.get('VersionTreeService');
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
          html: 'Some text',
          audio_translations: {}
        },
        old_value: {
          html: '',
          audio_translations: {}
        }
      }]);
    });
  });
});
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
 * @fileoverview Unit test for the Angular names service.
 */

require('pages/exploration-editor-page/services/angular-name.service.ts');

describe('Angular names service', function() {
  beforeEach(angular.mock.module('oppia'));

  describe('angular name service', function() {
    var ans = null;

    beforeEach(angular.mock.inject(function($injector) {
      ans = $injector.get('AngularNameService');
    }));

    it('should map interaction ID to correct RulesService', function() {
      expect(ans.getNameOfInteractionRulesService('TextInput')).toEqual(
        'TextInputRulesService');
    });
  });
});
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
 * @fileoverview Unit tests for the Exploration data service.
 */

require('pages/exploration-editor-page/services/exploration-data.service.ts');

describe('Exploration data service', function() {
  beforeEach(angular.mock.module('oppia'));

  describe('getData local save', function() {
    var eds = null;
    var mockBackendApiService = null;
    var mockLocalStorageService = null;
    var mockUrlService = null;
    var responseWhenDraftChangesAreValid = null;
    var responseWhenDraftChangesAreInvalid = null;
    var $q = null;

    beforeEach(function() {
      angular.mock.module(function($provide) {
        $provide.value(
          'LocalStorageService', [mockLocalStorageService][0]);
      });
      angular.mock.module(function($provide) {
        $provide.value(
          'EditableExplorationBackendApiService', [mockBackendApiService][0]);
      });
      angular.mock.module(function($provide) {
        $provide.value(
          'UrlService', [mockUrlService][0]);
      });
    });

    beforeEach(function() {
      mockUrlService = {
        getPathname: function() {}
      };

      mockBackendApiService = {
        fetchApplyDraftExploration: function() {}
      };

      mockLocalStorageService = {
        getExplorationDraft: function() {},
        removeExplorationDraft: function() {}
      };
      spyOn(mockUrlService, 'getPathname').and.returnValue('/create/exp_id');
    });

    beforeEach(angular.mock.inject(function($injector) {
      eds = $injector.get('ExplorationDataService');
      $q = $injector.get('$q');
    }));

    beforeEach(function() {
      var expDataResponse = {
        draft_change_list_id: 3,
      };

      responseWhenDraftChangesAreValid = {
        isValid: function() {
          return true;
        },
        getChanges: function() {
          return [];
        }
      };

      responseWhenDraftChangesAreInvalid = {
        isValid: function() {
          return false;
        },
        getChanges: function() {
          return [];
        }
      };

      spyOn(mockBackendApiService, 'fetchApplyDraftExploration').
        and.returnValue($q.when(expDataResponse));
      spyOn(eds, 'autosaveChangeList');
    });


    it('should autosave draft changes when draft ids match', function() {
      var errorCallback = function() {};
      spyOn(mockLocalStorageService, 'getExplorationDraft').
        and.returnValue(responseWhenDraftChangesAreValid);
      eds.getData(errorCallback).then(function(data) {
        expect(eds.autosaveChangeList()).toHaveBeenCalled();
      });
    });

    it('should call error callback when draft ids do not match', function() {
      var errorCallback = function() {};
      spyOn(mockLocalStorageService, 'getExplorationDraft').
        and.returnValue(responseWhenDraftChangesAreInvalid);
      eds.getData(errorCallback).then(function(data) {
        expect(errorCallback()).toHaveBeenCalled();
      });
    });
  });
});
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
 * @fileoverview Unit tests for the exploration rights service
 * of the exploration editor page.
 */

require('pages/exploration-editor-page/services/exploration-rights.service.ts');

describe('Exploration rights service', function() {
  beforeEach(angular.mock.module('oppia'));

  describe('exploration rights service', function() {
    var ers = null;

    beforeEach(angular.mock.inject(function($injector) {
      ers = $injector.get('ExplorationRightsService');
    }));

    it('correctly initializes the service', function() {
      expect(ers.ownerNames).toBeUndefined();
      expect(ers.editorNames).toBeUndefined();
      expect(ers.voiceArtistNames).toBeUndefined();
      expect(ers.viewerNames).toBeUndefined();
      expect(ers._status).toBeUndefined();
      expect(ers._clonedFrom).toBeUndefined();
      expect(ers._isCommunityOwned).toBeUndefined();
      expect(ers._viewableIfPrivate).toBeUndefined();

      ers.init(['abc'], [], [], [], 'private', 'e1234', true, true);

      expect(ers.ownerNames).toEqual(['abc']);
      expect(ers.editorNames).toEqual([]);
      expect(ers.voiceArtistNames).toEqual([]);
      expect(ers.viewerNames).toEqual([]);
      expect(ers._status).toEqual('private');
      expect(ers._clonedFrom).toEqual('e1234');
      expect(ers._isCommunityOwned).toBe(true);
      expect(ers._viewableIfPrivate).toBe(true);
    });

    it('reports the correct cloning status', function() {
      ers.init(['abc'], [], [], [], 'public', '1234', true);
      expect(ers.isCloned()).toBe(true);
      expect(ers.clonedFrom()).toEqual('1234');

      ers.init(['abc'], [], [], [], 'public', null, true);
      expect(ers.isCloned()).toBe(false);
      expect(ers.clonedFrom()).toBeNull();
    });

    it('reports the correct community-owned status', function() {
      ers.init(['abc'], [], [], [], 'public', '1234', false);
      expect(ers.isCommunityOwned()).toBe(false);

      ers.init(['abc'], [], [], [], 'public', '1234', true);
      expect(ers.isCommunityOwned()).toBe(true);
    });

    it('reports the correct derived statuses', function() {
      ers.init(['abc'], [], [], [], 'private', 'e1234', true);
      expect(ers.isPrivate()).toBe(true);
      expect(ers.isPublic()).toBe(false);

      ers.init(['abc'], [], [], [], 'public', 'e1234', true);
      expect(ers.isPrivate()).toBe(false);
      expect(ers.isPublic()).toBe(true);
    });
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for ExplorationStatesService.
 */

require('components/state-editor/state-editor-properties-services/' +
  'state-solicit-answer-details.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');

describe('ExplorationStatesService', function() {
  var $q = null;
  var $rootScope = null;
  var $uibModal = null;
  var ChangeListService = null;
  var ContextService = null;
  var ExplorationStatesService = null;
  var StateSolicitAnswerDetailsService = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function(
      _$q_, _$rootScope_, _$uibModal_, _ChangeListService_, _ContextService_,
      _ExplorationStatesService_, _StateSolicitAnswerDetailsService_) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    $uibModal = _$uibModal_;
    ChangeListService = _ChangeListService_;
    ContextService = _ContextService_;
    ExplorationStatesService = _ExplorationStatesService_;
    StateSolicitAnswerDetailsService = _StateSolicitAnswerDetailsService_;
  }));

  beforeEach(function() {
    this.EXP_ID = '7';
    spyOn(ContextService, 'getExplorationId').and.returnValue(this.EXP_ID);

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
  });

  describe('Callback Registration', function() {
    describe('.registerOnStateAddedCallback', function() {
      it('callsback when a new state is added', function() {
        var spy = jasmine.createSpy('callback');
        spyOn(ChangeListService, 'addState');

        ExplorationStatesService.registerOnStateAddedCallback(spy);
        ExplorationStatesService.addState('Me Llamo');

        expect(spy).toHaveBeenCalledWith('Me Llamo');
      });
    });

    describe('.registerOnStateDeletedCallback', function() {
      it('callsback when a state is deleted', function(done) {
        spyOn($uibModal, 'open').and.callFake(function() {
          return {result: $q.resolve()};
        });
        spyOn(ChangeListService, 'deleteState');

        var spy = jasmine.createSpy('callback');
        ExplorationStatesService.registerOnStateDeletedCallback(spy);

        ExplorationStatesService.deleteState('Hola').then(function() {
          expect(spy).toHaveBeenCalledWith('Hola');
        }).then(done, done.fail);
        $rootScope.$digest();
      });
    });

    describe('.registerOnStateRenamedCallback', function() {
      it('callsback when a state is renamed', function() {
        var spy = jasmine.createSpy('callback');
        spyOn(ChangeListService, 'renameState');

        ExplorationStatesService.registerOnStateRenamedCallback(spy);
        ExplorationStatesService.renameState('Hola', 'Bonjour');

        expect(spy).toHaveBeenCalledWith('Hola', 'Bonjour');
      });
    });

    describe('.registerOnStateInteractionSaved', function() {
      it('callsback when answer groups of a state are saved', function() {
        var spy = jasmine.createSpy('callback');
        spyOn(ChangeListService, 'editStateProperty');

        ExplorationStatesService.registerOnStateInteractionSavedCallback(spy);
        ExplorationStatesService.saveInteractionAnswerGroups('Hola', []);

        expect(spy).toHaveBeenCalledWith('Hola');
      });
    });
  });

  it('should save the solicitAnswerDetails correctly', function() {
    expect(
      ExplorationStatesService.getSolicitAnswerDetailsMemento(
        'Hola', 'solicit_answer_details')).toEqual(false);
    spyOn(ChangeListService, 'editStateProperty');
    ExplorationStatesService.saveSolicitAnswerDetails('Hola', true);
    expect(ChangeListService.editStateProperty).toHaveBeenCalledWith(
      'Hola', 'solicit_answer_details', true, false);
    expect(ExplorationStatesService.getSolicitAnswerDetailsMemento(
      'Hola', 'solicit_answer_details')).toEqual(true);
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the learner action render service.
 *
 * NOTE: To make tests shorter, we skip some elements and simply check
 * jasmine.any(Object).
 */

require('domain/statistics/LearnerActionObjectFactory.ts');
require(
  'pages/exploration-editor-page/statistics-tab/services/' +
  'learner-action-render.service.ts');
require('services/ExplorationFeaturesService.ts');
require('services/PlaythroughService.ts');

describe('Learner Action Render Service', function() {
  beforeEach(angular.mock.module('oppia'));

  describe('Test learner action render service functions', function() {
    beforeEach(angular.mock.inject(function($injector) {
      this.$sce = $injector.get('$sce');
      this.LearnerActionObjectFactory =
        $injector.get('LearnerActionObjectFactory');
      this.PlaythroughService = $injector.get('PlaythroughService');
      this.ExplorationFeaturesService =
        $injector.get('ExplorationFeaturesService');
      this.PlaythroughService.initSession('expId1', 1, 1.0);
      spyOn(this.ExplorationFeaturesService, 'isPlaythroughRecordingEnabled')
        .and.returnValue(true);

      this.LearnerActionRenderService =
        $injector.get('LearnerActionRenderService');
    }));

    it('should split up EarlyQuit learner actions into display blocks.',
      function() {
        this.PlaythroughService.recordExplorationStartAction('stateName1');
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName2', 'Continue', '', 'Welcome', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName2', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordExplorationQuitAction('stateName2', 120);

        var learnerActions = this.PlaythroughService.getPlaythrough().actions;
        var displayBlocks =
          this.LearnerActionRenderService.getDisplayBlocks(learnerActions);

        expect(displayBlocks).toEqual([[
          this.LearnerActionObjectFactory.createNew(
            'ExplorationStart', {
              state_name: {
                value: 'stateName1'
              }
            }, 1
          ),
          jasmine.any(Object),
          jasmine.any(Object),
          this.LearnerActionObjectFactory.createNew(
            'ExplorationQuit', {
              state_name: {
                value: 'stateName2'
              },
              time_spent_in_state_in_msecs: {
                value: 120
              }
            }, 1
          )
        ]]);
      });

    it('should split up many learner actions into different display blocks.',
      function() {
        this.PlaythroughService.recordExplorationStartAction('stateName1');
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName2', 'stateName3', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName3', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName2', 'stateName3', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName3', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName2', 'stateName3', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName3', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordExplorationQuitAction('stateName1', 120);

        var learnerActions = this.PlaythroughService.getPlaythrough().actions;
        var displayBlocks =
          this.LearnerActionRenderService.getDisplayBlocks(learnerActions);

        expect(displayBlocks).toEqual([
          [
            this.LearnerActionObjectFactory.createNew(
              'AnswerSubmit', {
                state_name: {
                  value: 'stateName1'
                },
                dest_state_name: {
                  value: 'stateName2'
                },
                interaction_id: {
                  value: 'TextInput'
                },
                submitted_answer: {
                  value: 'Hello'
                },
                feedback: {
                  value: 'Try again'
                },
                time_spent_state_in_msecs: {
                  value: 30
                }
              }, 1
            ),
            jasmine.any(Object),
            jasmine.any(Object),
            this.LearnerActionObjectFactory.createNew(
              'ExplorationQuit', {
                state_name: {
                  value: 'stateName1'
                },
                time_spent_in_state_in_msecs: {
                  value: 120
                }
              }, 1
            )
          ],
          [
            this.LearnerActionObjectFactory.createNew(
              'AnswerSubmit', {
                state_name: {
                  value: 'stateName3'
                },
                dest_state_name: {
                  value: 'stateName1'
                },
                interaction_id: {
                  value: 'TextInput'
                },
                submitted_answer: {
                  value: 'Hello'
                },
                feedback: {
                  value: 'Try again'
                },
                time_spent_state_in_msecs: {
                  value: 30
                }
              }, 1
            ),
            jasmine.any(Object),
            jasmine.any(Object),
            this.LearnerActionObjectFactory.createNew(
              'AnswerSubmit', {
                state_name: {
                  value: 'stateName3'
                },
                dest_state_name: {
                  value: 'stateName1'
                },
                interaction_id: {
                  value: 'TextInput'
                },
                submitted_answer: {
                  value: 'Hello'
                },
                feedback: {
                  value: 'Try again'
                },
                time_spent_state_in_msecs: {
                  value: 30
                }
              }, 1
            )
          ],
          [
            this.LearnerActionObjectFactory.createNew(
              'ExplorationStart', {
                state_name: {
                  value: 'stateName1'
                }
              }, 1
            ),
            jasmine.any(Object),
            this.LearnerActionObjectFactory.createNew(
              'AnswerSubmit', {
                state_name: {
                  value: 'stateName2'
                },
                dest_state_name: {
                  value: 'stateName3'
                },
                interaction_id: {
                  value: 'TextInput'
                },
                submitted_answer: {
                  value: 'Hello'
                },
                feedback: {
                  value: 'Try again'
                },
                time_spent_state_in_msecs: {
                  value: 30
                }
              }, 1
            )
          ]
        ]);
      });

    it('should assign multiple learner actions at same state to same block.',
      function() {
        this.PlaythroughService.recordExplorationStartAction('stateName1');
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordExplorationQuitAction('stateName1', 120);

        var learnerActions = this.PlaythroughService.getPlaythrough().actions;
        var displayBlocks =
          this.LearnerActionRenderService.getDisplayBlocks(learnerActions);

        expect(displayBlocks).toEqual([[
          this.LearnerActionObjectFactory.createNew(
            'ExplorationStart', {
              state_name: {
                value: 'stateName1'
              }
            }, 1
          ),
          jasmine.any(Object),
          jasmine.any(Object),
          jasmine.any(Object),
          jasmine.any(Object),
          jasmine.any(Object),
          jasmine.any(Object),
          this.LearnerActionObjectFactory.createNew(
            'ExplorationQuit', {
              state_name: {
                value: 'stateName1'
              },
              time_spent_in_state_in_msecs: {
                value: 120
              }
            }, 1
          )
        ]]);
      });

    it('should render tables for MultipleIncorrectSubmissions issue block.',
      function() {
        var feedback = {
          _html: 'Try again'
        };
        this.PlaythroughService.recordExplorationStartAction('stateName1');
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', feedback, 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', feedback, 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', feedback, 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', feedback, 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', feedback, 30);
        this.PlaythroughService.recordExplorationQuitAction('stateName1', 120);

        var learnerActions = this.PlaythroughService.getPlaythrough().actions;
        var displayBlocks =
          this.LearnerActionRenderService.getDisplayBlocks(learnerActions);

        expect(displayBlocks.length).toEqual(1);

        var finalBlockHTML =
          this.LearnerActionRenderService
            .renderFinalDisplayBlockForMISIssueHTML(displayBlocks[0], 1);

        expect(this.$sce.getTrustedHtml(finalBlockHTML)).toEqual(
          '<span class="oppia-issues-learner-action">1. Started exploration ' +
          'at card "stateName1".</span>' +
          '<span class="oppia-issues-learner-action">2. Submitted the ' +
          'following answers in card "stateName1"</span>' +
          '<table class="oppia-issues-learner-action-table"><tr><th>Answer' +
          '</th><th>Feedback</th></tr>' +
          '<tr><td>Hello</td><td>Try again</td></tr>' +
          '<tr><td>Hello</td><td>Try again</td></tr>' +
          '<tr><td>Hello</td><td>Try again</td></tr>' +
          '<tr><td>Hello</td><td>Try again</td></tr>' +
          '<tr><td>Hello</td><td>Try again</td></tr></table>' +
          '<span class="oppia-issues-learner-action">3. Left the exploration ' +
          'after spending a total of 120 seconds on card "stateName1".</span>'
        );
      });

    it('should render HTML for learner action display blocks.', function() {
      this.PlaythroughService.recordExplorationStartAction('stateName1');
      this.PlaythroughService.recordAnswerSubmitAction(
        'stateName1', 'stateName2', 'Continue', '', 'Welcome', 30);
      this.PlaythroughService.recordAnswerSubmitAction(
        'stateName2', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
      this.PlaythroughService.recordExplorationQuitAction('stateName2', 120);

      var learnerActions = this.PlaythroughService.getPlaythrough().actions;
      var displayBlocks =
        this.LearnerActionRenderService.getDisplayBlocks(learnerActions);

      expect(displayBlocks.length).toEqual(1);

      var blockHTML = this.LearnerActionRenderService.renderDisplayBlockHTML(
        displayBlocks[0], 1);

      expect(this.$sce.getTrustedHtml(blockHTML)).toEqual(
        '<span class="oppia-issues-learner-action">1. Started exploration at ' +
        'card "stateName1".</span>' +
        '<span class="oppia-issues-learner-action">2. Pressed "Continue" to ' +
        'move to card "stateName2" after 30 seconds.</span>' +
        '<span class="oppia-issues-learner-action">3. Submitted answer ' +
        '"Hello" in card "stateName2".</span>' +
        '<span class="oppia-issues-learner-action">4. Left the exploration ' +
        'after spending a total of 120 seconds on card "stateName2".</span>'
      );
    });
  });
});
// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for statistics services.
 */

require('domain/exploration/StatesObjectFactory.ts');
require(
  'pages/exploration-editor-page/statistics-tab/services/' +
  'state-improvement-suggestion.service.ts'
);
require(
  'pages/exploration-editor-page/statistics-tab/statistics-tab.directive.ts');

describe('StateImprovementSuggestionService', function() {
  beforeEach(angular.mock.module('oppia'));

  // TODO(bhenning): These tests were ported from the backend tests. More tests
  // should be added to make sure getStateImprovements() is thoroughly tested.

  describe('getStateImprovements', function() {
    var IMPROVE_TYPE_INCOMPLETE = 'incomplete';

    var siss;
    var ssof;

    // A self-looping state.
    var statesDict1 = {
      state: {
        content: {
          content_id: 'content',
          html: 'content'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {}
          }
        },
        interaction: {
          id: 'RuleTest',
          answer_groups: [{
            outcome: {
              dest: 'unused',
              feedback: {
                content_id: 'feedback_1',
                html: ''
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
            },
            rule_specs: [{
              inputs: {
                x: 10
              },
              rule_type: 'Equals'
            }],
          }],
          default_outcome: {
            dest: 'state',
            feedback: {
              content_id: 'default_outcome',
              html: ''
            },
            param_changes: []
          },
          hints: []
        },
        param_changes: [],
        solicit_answer_details: false,
        written_translations: {
          translations_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {}
          }
        }
      }
    };

    // A non-looping state.
    var statesDict2 = {
      initial: {
        content: {
          content_id: 'content',
          html: 'content'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {}
          }
        },
        interaction: {
          id: 'RuleTest',
          answer_groups: [{
            outcome: {
              dest: 'unused',
              feedback: {
                content_id: 'feedback_1',
                html: ''
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
            },
            rule_specs: [{
              inputs: {
                x: 10
              },
              rule_type: 'Equals'
            }]
          }],
          default_outcome: {
            dest: 'end',
            feedback: {
              content_id: 'default_outcome',
              html: ''
            },
            param_changes: []
          },
          hints: []
        },
        param_changes: [],
        solicit_answer_details: false,
        written_translations: {
          translations_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {}
          }
        },
      },
      end: {
        content: {
          content_id: 'content',
          html: 'content'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {}
          }
        },
        interaction: {
          id: 'RuleTest',
          answer_groups: [{
            outcome: {
              dest: 'unused',
              feedback: {
                content_id: 'feedback_1',
                html: ''
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
            },
            rule_specs: [{
              inputs: {
                x: 10
              },
              rule_type: 'Equals'
            }]
          }],
          default_outcome: {
            dest: null,
            feedback: {
              content_id: 'default_outcome',
              html: ''
            },
            param_changes: []
          },
          hints: []
        },
        param_changes: [],
        solicit_answer_details: false,
        written_translations: {
          translations_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {}
          }
        },
      }
    };

    // 2 states that are both self-looping
    var statesDict3 = {
      'State 1': {
        content: {
          content_id: 'content',
          html: 'content'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {}
          }
        },
        interaction: {
          id: 'RuleTest',
          answer_groups: [{
            outcome: {
              dest: 'next state',
              feedback: {
                content_id: 'feedback_1',
                html: ''
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
            },
            rule_specs: [{
              inputs: {
                x: 10
              },
              rule_type: 'Equals'
            }]
          }],
          default_outcome: {
            dest: 'State 1',
            feedback: {
              content_id: 'default_outcome',
              html: ''
            },
            param_changes: []
          },
          hints: []
        },
        param_changes: [],
        solicit_answer_details: false,
        written_translations: {
          translations_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {}
          }
        },
      },
      'State 2': {
        content: {
          content_id: 'content',
          html: 'content'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {}
          }
        },
        interaction: {
          id: 'RuleTest',
          answer_groups: [{
            outcome: {
              dest: 'next state',
              feedback: {
                content_id: 'feedback_1',
                html: ''
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
            },
            rule_specs: [{
              inputs: {
                x: 10
              },
              rule_type: 'Equals'
            }]
          }],
          default_outcome: {
            dest: 'State 2',
            feedback: {
              content_id: 'default_outcome',
              html: ''
            },
            param_changes: []
          },
          hints: []
        },
        param_changes: [],
        solicit_answer_details: false,
        written_translations: {
          translations_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {}
          }
        },
      }
    };

    var _createState = function(destStateName) {
      // Only a partial state definition is needed for these tests.
      if (destStateName) {
        return {
          interaction: {
            default_outcome: {
              dest: destStateName
            }
          }
        };
      } else {
        // Create an end state, which has no default_outcome.
        return {
          interaction: { }
        };
      }
    };

    var _createDefaultStateStats = function() {
      return {
        total_entry_count: 0,
        no_submitted_answer_count: 0
      };
    };

    var _enterStateWithoutAnswer = function(stateStats) {
      stateStats.total_entry_count++;
    };
    var _answerIncorrectly = function(stateStats) {
      stateStats.total_entry_count++;
      stateStats.no_submitted_answer_count++;
    };
    var _answerDefaultOutcome = function(stateStats) {
      stateStats.total_entry_count++;
    };

    beforeEach(angular.mock.inject(function($injector) {
      siss = $injector.get('StateImprovementSuggestionService');
      ssof = $injector.get('StatesObjectFactory');
    }));

    it('should not suggest improvements for non-default answers', function() {
      // Create a non-looping state for testing, similar to
      // save_new_valid_exploration.
      var states = ssof.createFromBackendDict(statesDict2);

      // Submit an answer to an answer group rather than the default answer.
      // The end state does not have any relevant stats, either.
      var stateStats = {
        initial: _createDefaultStateStats(),
        end: _createDefaultStateStats()
      };
      _enterStateWithoutAnswer(stateStats.initial);

      // No improvements should be suggested for this situation.
      var improvements = siss.getStateImprovements(states, stateStats);
      expect(improvements).toEqual([]);
    });

    it('should suggest incomplete improvements depending on unsubmitted ' +
       'answer counts', function() {
      // Create a looping state, similar to create_default_exploration.
      var states = ssof.createFromBackendDict(statesDict1);

      // These stats represent failing to answer something twice and hitting the
      // default outcome once.
      var stateStats = {
        state: _createDefaultStateStats(),
      };
      _answerIncorrectly(stateStats.state);
      _answerIncorrectly(stateStats.state);
      _answerDefaultOutcome(stateStats.state);

      // The result should be an improvement recommendation due to the state
      // being potentially confusing.
      var improvements = siss.getStateImprovements(states, stateStats);
      expect(improvements).toEqual([{
        rank: 2,
        stateName: 'state',
        type: IMPROVE_TYPE_INCOMPLETE
      }]);
    });
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit test for the Translation language service.
 */

require(
  'pages/exploration-editor-page/translation-tab/services/' +
  'translation-language.service.ts');

describe('Translation language service', function() {
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('LanguageUtilService', {
      getAllVoiceoverLanguageCodes: function() {
        return ['en', 'hi'];
      }
    });
  }));

  describe('Translation language service', function() {
    var tls = null;

    beforeEach(angular.mock.inject(function($injector) {
      tls = $injector.get('TranslationLanguageService');
    }));

    it('should correctly set and get state names', function() {
      tls.setActiveLanguageCode('en');
      expect(tls.getActiveLanguageCode()).toBe('en');
    });

    it('should not allow invalid state names to be set', function() {
      tls.setActiveLanguageCode('eng');
      expect(tls.getActiveLanguageCode()).toBeNull();

      tls.setActiveLanguageCode(null);
      expect(tls.getActiveLanguageCode()).toBeNull();
    });
  });
});
// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit test for the Translation status service.
 */

require('pages/exploration-editor-page/services/exploration-states.service.ts');
require(
  'pages/exploration-editor-page/translation-tab/services/' +
  'translation-language.service.ts');
require(
  'pages/exploration-editor-page/translation-tab/services/' +
  'translation-status.service.ts');
require(
  'pages/exploration-editor-page/translation-tab/services/' +
  'translation-tab-active-mode.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-written-translations.service.ts');

describe('Translation status service', function() {
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('LanguageUtilService', {
      getAllVoiceoverLanguageCodes: function() {
        return ['en', 'hi'];
      }
    });

    $provide.constant('INTERACTION_SPECS', {
      MultipleChoiceInput: {
        is_linear: false,
        is_terminal: false
      },
      EndExploration: {
        is_linear: true,
        is_terminal: true
      }
    });
  }));

  describe('Translation status service', function() {
    var ess = null;
    var srvs = null;
    var swts = null;
    var tss = null;
    var ttams = null;
    var tls = null;
    var ALL_ASSETS_AVAILABLE_COLOR = '#16A765';
    var FEW_ASSETS_AVAILABLE_COLOR = '#E9B330';
    var NO_ASSETS_AVAILABLE_COLOR = '#D14836';
    var statesWithAudioDict = null;
    var mockExplorationData;

    beforeEach(function() {
      mockExplorationData = {
        explorationId: 0,
        autosaveChangeList: function() {},
        discardDraft: function() {}
      };
      angular.mock.module(function($provide) {
        $provide.value('ExplorationDataService', [mockExplorationData][0]);
      });
      spyOn(mockExplorationData, 'autosaveChangeList');
    });

    beforeEach(angular.mock.inject(function($injector) {
      tss = $injector.get('TranslationStatusService');
      ess = $injector.get('ExplorationStatesService');
      ttams = $injector.get('TranslationTabActiveModeService');
      tls = $injector.get('TranslationLanguageService');
      srvs = $injector.get('StateRecordedVoiceoversService');
      swts = $injector.get('StateWrittenTranslationsService');

      statesWithAudioDict = {
        First: {
          content: {
            html: '<p>This is first card.</p>',
            content_id: 'content'
          },
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
              feedback_2: {
                hi: {
                  html: '<p>This is feedback 1.</p>',
                  needs_update: false
                }
              },
              feedback_1: {
                hi: {
                  html: '<p>This is first card.</p>',
                  needs_update: false
                }
              }
            }
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
              feedback_2: {
                en: {
                  needs_update: false,
                  filename: 'filename1.mp3',
                  file_size_bytes: 43467
                }
              },
              feedback_1: {}
            }
          },
          interaction: {
            answer_groups: [{
              tagged_misconception_id: null,
              outcome: {
                refresher_exploration_id: null,
                param_changes: [],
                labelled_as_correct: false,
                feedback: {
                  html: '<p>This is feedback1</p>',
                  content_id: 'feedback_1'
                },
                missing_prerequisite_skill_id: null,
                dest: 'Second'
              },
              rule_specs: [{
                inputs: {
                  x: 0
                },
                rule_type: 'Equals'
              }],
              training_data: []
            },
            {
              tagged_misconception_id: null,
              outcome: {
                refresher_exploration_id: null,
                param_changes: [],
                labelled_as_correct: false,
                feedback: {
                  html: '<p>This is feedback2</p>',
                  content_id: 'feedback_2'
                },
                missing_prerequisite_skill_id: null,
                dest: 'First'
              },
              rule_specs: [{
                inputs: {
                  x: 1
                },
                rule_type: 'Equals'
              }],
              training_data: []
            }],
            solution: null,
            hints: [],
            id: 'MultipleChoiceInput',
            customization_args: {
              choices: {
                value: ['<p>1</p>', '<p>2</p>']
              }
            },
            default_outcome: {
              refresher_exploration_id: null,
              param_changes: [],
              labelled_as_correct: false,
              feedback: {
                html: '',
                content_id: 'default_outcome'
              },
              missing_prerequisite_skill_id: null,
              dest: 'First'
            },
            confirmed_unclassified_answers: []
          },
          solicit_answer_details: false,
          classifier_model_id: null,
          param_changes: []
        },
        Second: {
          content: {
            html: '<p>This is second card</p>',
            content_id: 'content'
          },
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {}
            }
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {}
            }
          },
          interaction: {
            answer_groups: [{
              tagged_misconception_id: null,
              outcome: {
                refresher_exploration_id: null,
                param_changes: [],
                labelled_as_correct: false,
                feedback: {
                  html: '',
                  content_id: 'feedback_1'
                },
                missing_prerequisite_skill_id: null,
                dest: 'Third'
              },
              rule_specs: [{
                inputs: {
                  x: 0
                },
                rule_type: 'Equals'
              }],
              training_data: []
            }],
            solution: null,
            hints: [],
            id: 'MultipleChoiceInput',
            customization_args: {
              choices: {
                value: ['<p>1</p>']
              }
            },
            default_outcome: {
              refresher_exploration_id: null,
              param_changes: [],
              labelled_as_correct: false,
              feedback: {
                html: '',
                content_id: 'default_outcome'
              },
              missing_prerequisite_skill_id: null,
              dest: 'Second'
            },
            confirmed_unclassified_answers: []
          },
          solicit_answer_details: false,
          classifier_model_id: null,
          param_changes: []
        },
        Third: {
          content: {
            html: 'Congratulations, you have finished!',
            content_id: 'content'
          },
          written_translations: {
            translations_mapping: {
              content: {}
            }
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {
                en: {
                  needs_update: false,
                  filename: 'content-en-s86jb5zajs.mp3',
                  file_size_bytes: 38870
                }
              }
            }
          },
          interaction: {
            answer_groups: [],
            solution: null,
            hints: [],
            id: 'EndExploration',
            customization_args: {
              recommendedExplorationIds: {
                value: []
              }
            },
            default_outcome: null,
            confirmed_unclassified_answers: []
          },
          solicit_answer_details: false,
          classifier_model_id: null,
          param_changes: []
        }
      };
      ess.init(statesWithAudioDict);
      ttams.activateVoiceoverMode();
      tls.setActiveLanguageCode('en');
      tss.refresh();
    }));

    it('should return a correct list of state names for which audio needs ' +
      'update', function() {
      ttams.activateVoiceoverMode();
      var statesNeedingAudioUpdate = tss.getAllStatesNeedUpdatewarning();
      // To check that initially no state contains audio that needs update.
      expect(Object.keys(statesNeedingAudioUpdate).length).toBe(0);
      srvs.init('First', ess.getRecordedVoiceoversMemento('First'));
      var value = srvs.displayed;
      value.toggleNeedsUpdateAttribute('feedback_2', 'en');
      srvs.saveDisplayedValue();
      ess.saveRecordedVoiceovers('First', value);
      tss.refresh();

      statesNeedingAudioUpdate = tss.getAllStatesNeedUpdatewarning();
      // To check that "First" state contains audio that needs update.
      expect(Object.keys(statesNeedingAudioUpdate).length).toBe(1);
      expect(Object.keys(statesNeedingAudioUpdate)[0]).toBe('First');
      expect(statesNeedingAudioUpdate.First.indexOf(
        'Audio needs update!')).toBe(0);
    });

    it('should return a correct list of state names for which translation ' +
      'needs update', function() {
      ttams.activateTranslationMode();
      tls.setActiveLanguageCode('hi');
      var statesNeedingTranslationUpdate = tss.getAllStatesNeedUpdatewarning();
      expect(Object.keys(statesNeedingTranslationUpdate).length).toBe(0);

      swts.init('First', ess.getWrittenTranslationsMemento('First'));
      swts.displayed.toggleNeedsUpdateAttribute('feedback_1', 'hi');
      swts.displayed.toggleNeedsUpdateAttribute('feedback_2', 'hi');
      ess.saveWrittenTranslations('First', swts.displayed);
      tss.refresh();

      statesNeedingTranslationUpdate = tss.getAllStatesNeedUpdatewarning();
      expect(Object.keys(statesNeedingTranslationUpdate).length).toBe(1);
      expect(Object.keys(statesNeedingTranslationUpdate)[0]).toBe('First');
      expect(statesNeedingTranslationUpdate.First.indexOf(
        'Translation needs update!')).toBe(0);
    });

    it('should return a correct count of audio and translations required in ' +
      'an exploration', function() {
      ttams.activateVoiceoverMode();
      var explorationAudioRequiredCount = (
        tss.getExplorationContentRequiredCount());
      expect(explorationAudioRequiredCount).toBe(8);

      ttams.activateTranslationMode();
      tls.setActiveLanguageCode('hi');
      var explorationTranslationsRequiredCount = (
        tss.getExplorationContentRequiredCount());
      expect(explorationTranslationsRequiredCount).toBe(8);

      // To test changes after adding a new state.
      ess.addState('Fourth');
      ess.saveInteractionId('Third', 'MultipleChoiceInput');
      ess.saveInteractionId('Fourth', 'EndExploration');
      tss.refresh();

      ttams.activateVoiceoverMode();
      tls.setActiveLanguageCode('en');
      var explorationAudioRequiredCount = (
        tss.getExplorationContentRequiredCount());
      expect(explorationAudioRequiredCount).toBe(9);

      ttams.activateTranslationMode();
      tls.setActiveLanguageCode('hi');
      var explorationTranslationsRequiredCount = (
        tss.getExplorationContentRequiredCount());
      expect(explorationTranslationsRequiredCount).toBe(9);
    });

    it('should return a correct count of audio not available in an exploration',
      function() {
        ttams.activateVoiceoverMode();
        var explorationAudioNotAvailableCount = tss
          .getExplorationContentNotAvailableCount();
        expect(explorationAudioNotAvailableCount).toBe(6);

        ess.addState('Fourth');
        ess.saveInteractionId('Third', 'MultipleChoiceInput');
        ess.saveInteractionId('Fourth', 'EndExploration');
        tss.refresh();

        explorationAudioNotAvailableCount = (
          tss.getExplorationContentNotAvailableCount());
        expect(explorationAudioNotAvailableCount).toBe(7);
      });

    it('should return a correct count of translations not available in an ' +
      'exploration', function() {
      ttams.activateTranslationMode();
      tls.setActiveLanguageCode('hi');
      var explorationTranslationNotAvailableCount = (
        tss.getExplorationContentNotAvailableCount());
      expect(explorationTranslationNotAvailableCount).toBe(6);

      ess.addState('Fourth');
      ess.saveInteractionId('Third', 'MultipleChoiceInput');
      ess.saveInteractionId('Fourth', 'EndExploration');
      tss.refresh();

      explorationTranslationNotAvailableCount = (
        tss.getExplorationContentNotAvailableCount());
      expect(explorationTranslationNotAvailableCount).toBe(7);
    });

    it('should correctly return an object containing status colors of audio ' +
      'for all states in the exploration', function() {
      ttams.activateVoiceoverMode();
      var stateWiseStatusColor = tss.getAllStateStatusColors();
      expect(stateWiseStatusColor.First).toBe(FEW_ASSETS_AVAILABLE_COLOR);
      expect(stateWiseStatusColor.Second).toBe(NO_ASSETS_AVAILABLE_COLOR);
      expect(stateWiseStatusColor.Third).toBe(ALL_ASSETS_AVAILABLE_COLOR);
      srvs.init('Second', ess.getRecordedVoiceoversMemento('Second'));
      var value = srvs.displayed;
      value.addVoiceover('content', 'en', 'file.mp3', 1000);
      srvs.saveDisplayedValue();
      ess.saveRecordedVoiceovers('Second', value);
      tss.refresh();
      stateWiseStatusColor = tss.getAllStateStatusColors();
      expect(stateWiseStatusColor.Second).toBe(FEW_ASSETS_AVAILABLE_COLOR);
    });

    it('should correctly return an object containing status colors of ' +
      'translations for all states in the exploration', function() {
      ttams.activateTranslationMode();
      tls.setActiveLanguageCode('hi');
      tss.refresh();
      swts.init('Second', ess.getWrittenTranslationsMemento('Second'));
      var stateWiseStatusColor = tss.getAllStateStatusColors();
      expect(stateWiseStatusColor.First).toBe(FEW_ASSETS_AVAILABLE_COLOR);
      expect(stateWiseStatusColor.Second).toBe(NO_ASSETS_AVAILABLE_COLOR);
      expect(stateWiseStatusColor.Third).toBe(NO_ASSETS_AVAILABLE_COLOR);

      swts.displayed.addWrittenTranslation('content', 'hi', 'content');
      ess.saveWrittenTranslations('Second', swts.displayed);

      tss.refresh();
      stateWiseStatusColor = tss.getAllStateStatusColors();
      expect(stateWiseStatusColor.Second).toBe(FEW_ASSETS_AVAILABLE_COLOR);
    });

    it('should return correct status color for audio availability in the ' +
      'active state components', function() {
      ttams.activateVoiceoverMode();
      srvs.init('First', ess.getRecordedVoiceoversMemento('First'));
      var activeStateComponentStatus = tss
        .getActiveStateComponentStatusColor('content');
      expect(activeStateComponentStatus).toBe(NO_ASSETS_AVAILABLE_COLOR);
      activeStateComponentStatus = tss
        .getActiveStateComponentStatusColor('feedback');
      expect(activeStateComponentStatus).toBe(FEW_ASSETS_AVAILABLE_COLOR);
      // To test changes after adding an audio translation to "content"
      // in the first state.
      srvs.displayed.addVoiceover('content', 'en', 'file.mp3', 1000);
      srvs.saveDisplayedValue();
      var value = srvs.displayed;
      ess.saveRecordedVoiceovers('First', value);
      activeStateComponentStatus = tss
        .getActiveStateComponentStatusColor('content');
      expect(activeStateComponentStatus).toBe(ALL_ASSETS_AVAILABLE_COLOR);
      srvs.init('Second', ess.getRecordedVoiceoversMemento('Second'));
      activeStateComponentStatus = tss
        .getActiveStateComponentStatusColor('content');
      expect(activeStateComponentStatus).toBe(NO_ASSETS_AVAILABLE_COLOR);
      activeStateComponentStatus = tss
        .getActiveStateComponentStatusColor('feedback');
      expect(activeStateComponentStatus).toBe(NO_ASSETS_AVAILABLE_COLOR);
      srvs.init('Third', ess.getRecordedVoiceoversMemento('Third'));
      activeStateComponentStatus = tss
        .getActiveStateComponentStatusColor('content');
      expect(activeStateComponentStatus).toBe(ALL_ASSETS_AVAILABLE_COLOR);
    });

    it('should return correct status color for translations availability in ' +
      'the active state components', function() {
      ttams.activateTranslationMode();
      tls.setActiveLanguageCode('hi');

      swts.init('First', ess.getWrittenTranslationsMemento('First'));
      var activeStateComponentStatus = (
        tss.getActiveStateComponentStatusColor('content'));
      expect(activeStateComponentStatus).toBe(NO_ASSETS_AVAILABLE_COLOR);
      activeStateComponentStatus = (
        tss.getActiveStateComponentStatusColor('feedback'));
      expect(activeStateComponentStatus).toBe(FEW_ASSETS_AVAILABLE_COLOR);

      swts.displayed.addWrittenTranslation('content', 'hi', 'Content');

      activeStateComponentStatus = (
        tss.getActiveStateComponentStatusColor('content'));
      expect(activeStateComponentStatus).toBe(ALL_ASSETS_AVAILABLE_COLOR);
      activeStateComponentStatus = (
        tss.getActiveStateComponentStatusColor('feedback'));
      expect(activeStateComponentStatus).toBe(FEW_ASSETS_AVAILABLE_COLOR);
    });

    it('should correctly return whether active state component audio needs ' +
      'update', function() {
      ttams.activateVoiceoverMode();
      srvs.init('First', ess.getRecordedVoiceoversMemento('First'));
      var activeStateComponentNeedsUpdateStatus = tss
        .getActiveStateComponentNeedsUpdateStatus('feedback');
        // To check that initially the state component "feedback" does not
        // contain audio that needs update.
      expect(activeStateComponentNeedsUpdateStatus).toBe(false);
      var value = srvs.displayed;
      // To test changes after changing "needs update" status of an audio.
      value.toggleNeedsUpdateAttribute('feedback_2', 'en');
      srvs.saveDisplayedValue();
      ess.saveRecordedVoiceovers('First', value);
      activeStateComponentNeedsUpdateStatus = tss
        .getActiveStateComponentNeedsUpdateStatus('feedback');
      // To check that the state component "feedback" contains audio that
      // needs update.
      expect(activeStateComponentNeedsUpdateStatus).toBe(true);
    });

    it('should correctly return whether active state component translation ' +
      'needs update', function() {
      ttams.activateTranslationMode();
      tls.setActiveLanguageCode('hi');

      swts.init('First', ess.getWrittenTranslationsMemento('First'));
      var activeStateComponentNeedsUpdateStatus = (
        tss.getActiveStateComponentNeedsUpdateStatus('feedback'));
      expect(activeStateComponentNeedsUpdateStatus).toBe(false);

      swts.displayed.toggleNeedsUpdateAttribute('feedback_2', 'hi');

      activeStateComponentNeedsUpdateStatus = (
        tss.getActiveStateComponentNeedsUpdateStatus('feedback'));
      expect(activeStateComponentNeedsUpdateStatus).toBe(true);
    });

    it('should return correct audio availability status color of a contentId ' +
      'of active state', function() {
      ttams.activateVoiceoverMode();
      srvs.init('First', ess.getRecordedVoiceoversMemento('First'));
      var activeStateContentIdStatusColor = tss
        .getActiveStateContentIdStatusColor('content');
      expect(activeStateContentIdStatusColor).toBe(NO_ASSETS_AVAILABLE_COLOR);
      activeStateContentIdStatusColor = tss
        .getActiveStateContentIdStatusColor('feedback_1');
      expect(activeStateContentIdStatusColor).toBe(NO_ASSETS_AVAILABLE_COLOR);
      activeStateContentIdStatusColor = tss
        .getActiveStateContentIdStatusColor('feedback_2');
      expect(activeStateContentIdStatusColor).toBe(ALL_ASSETS_AVAILABLE_COLOR);
      var value = srvs.displayed;
      // To test changes after adding an audio translation to "content"
      // in the first state.
      value.addVoiceover('content', 'en', 'file.mp3', 1000);
      srvs.saveDisplayedValue();
      ess.saveRecordedVoiceovers('First', value);
      activeStateContentIdStatusColor = tss
        .getActiveStateContentIdStatusColor('content');
      expect(activeStateContentIdStatusColor).toBe(ALL_ASSETS_AVAILABLE_COLOR);
      srvs.init('Second', ess.getRecordedVoiceoversMemento('Second'));
      activeStateContentIdStatusColor = tss
        .getActiveStateContentIdStatusColor('content');
      expect(activeStateContentIdStatusColor).toBe(NO_ASSETS_AVAILABLE_COLOR);
      activeStateContentIdStatusColor = tss
        .getActiveStateContentIdStatusColor('feedback_1');
      expect(activeStateContentIdStatusColor).toBe(NO_ASSETS_AVAILABLE_COLOR);
      srvs.init('Third', ess.getRecordedVoiceoversMemento('Third'));
      activeStateContentIdStatusColor = tss
        .getActiveStateContentIdStatusColor('content');
      expect(activeStateContentIdStatusColor).toBe(ALL_ASSETS_AVAILABLE_COLOR);
    });

    it('should return correct translation availability status color of a ' +
      'contentId of active state', function() {
      ttams.activateTranslationMode();
      tls.setActiveLanguageCode('hi');

      swts.init('First', ess.getWrittenTranslationsMemento('First'));
      var activeStateContentIdStatusColor = (
        tss.getActiveStateContentIdStatusColor('content'));
      expect(activeStateContentIdStatusColor).toBe(NO_ASSETS_AVAILABLE_COLOR);
      activeStateContentIdStatusColor = (
        tss.getActiveStateContentIdStatusColor('feedback_1'));
      expect(activeStateContentIdStatusColor).toBe(
        ALL_ASSETS_AVAILABLE_COLOR);
      activeStateContentIdStatusColor = (
        tss.getActiveStateContentIdStatusColor('feedback_2'));
      expect(activeStateContentIdStatusColor).toBe(
        ALL_ASSETS_AVAILABLE_COLOR);

      swts.displayed.addWrittenTranslation('content', 'hi', '<p>Content</p>');

      activeStateContentIdStatusColor = (
        tss.getActiveStateContentIdStatusColor('content'));
      expect(activeStateContentIdStatusColor).toBe(
        ALL_ASSETS_AVAILABLE_COLOR);
      activeStateContentIdStatusColor = (
        tss.getActiveStateContentIdStatusColor('feedback_1'));
      expect(activeStateContentIdStatusColor).toBe(
        ALL_ASSETS_AVAILABLE_COLOR);
      activeStateContentIdStatusColor = (
        tss.getActiveStateContentIdStatusColor('feedback_2'));
      expect(activeStateContentIdStatusColor).toBe(
        ALL_ASSETS_AVAILABLE_COLOR);
    });

    it('should return correct needs update status of voice-over of active ' +
      'state contentId', function() {
      ttams.activateVoiceoverMode();
      srvs.init('First', ess.getRecordedVoiceoversMemento('First'));
      var activeStateContentIdNeedsUpdateStatus = tss
        .getActiveStateContentIdNeedsUpdateStatus('feedback_2');
      // To check that initially the state content id "feedback" does not
      // contain audio that needs update.
      expect(activeStateContentIdNeedsUpdateStatus).toBe(false);

      var value = srvs.displayed;
      value.toggleNeedsUpdateAttribute('feedback_2', 'en');
      srvs.saveDisplayedValue();
      activeStateContentIdNeedsUpdateStatus = (
        tss.getActiveStateContentIdNeedsUpdateStatus('feedback_2'));
      // To check that the state content id "feedback" contains audio that
      // needs update.
      expect(activeStateContentIdNeedsUpdateStatus).toBe(true);
    });

    it('should return correct needs update status of translation of active ' +
      'state contentId', function() {
      ttams.activateTranslationMode();
      tls.setActiveLanguageCode('hi');
      swts.init('First', ess.getWrittenTranslationsMemento('First'));
      var activeStateContentIdNeedsUpdateStatus = (
        tss.getActiveStateContentIdNeedsUpdateStatus('feedback_2'));
      expect(activeStateContentIdNeedsUpdateStatus).toBe(false);

      swts.displayed.toggleNeedsUpdateAttribute('feedback_2', 'hi');

      activeStateContentIdNeedsUpdateStatus = (
        tss.getActiveStateContentIdNeedsUpdateStatus('feedback_2'));
      expect(activeStateContentIdNeedsUpdateStatus).toBe(true);
    });
  });
});
// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit test for the Translation tab active content id service.
 */

require(
  'pages/exploration-editor-page/translation-tab/services/' +
  'translation-tab-active-content-id.service.ts');

describe('Translation tab active content id service', function() {
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('StateRecordedVoiceoversService', {
      displayed: {
        getAllContentId: function() {
          return ['content', 'feedback_1'];
        }
      }
    });
  }));
  var ttacis = null;

  beforeEach(angular.mock.inject(function($injector) {
    ttacis = $injector.get('TranslationTabActiveContentIdService');
  }));

  it('should correctly set and get active content id', function() {
    expect(ttacis.getActiveContentId()).toBeNull();
    ttacis.setActiveContentId('content');
    expect(ttacis.getActiveContentId()).toBe('content');
  });

  it('should throw error on setting invalid content id', function() {
    expect(function() {
      ttacis.setActiveContentId('feedback_2');
    }).toThrowError(
      'Invalid active content id: feedback_2');
  });
});
// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit test for the Translation tab active mode service.
 */

require(
  'pages/exploration-editor-page/translation-tab/services/' +
  'translation-tab-active-mode.service.ts');

describe('Translation tab active mode service', function() {
  beforeEach(angular.mock.module('oppia'));
  var ttams = null;

  beforeEach(angular.mock.inject(function($injector) {
    ttams = $injector.get('TranslationTabActiveModeService');
  }));

  it('should correctly activate translation mode', function() {
    expect(ttams.isTranslationModeActive()).toBeFalsy();
    ttams.activateTranslationMode();
    expect(ttams.isTranslationModeActive()).toBeTruthy();
  });

  it('should correctly activate voiceover mode', function() {
    expect(ttams.isVoiceoverModeActive()).toBeFalsy();
    ttams.activateVoiceoverMode();
    expect(ttams.isVoiceoverModeActive()).toBeTruthy();
  });

  it('should correctly report the active mode', function() {
    expect(ttams.isVoiceoverModeActive()).toBeFalsy();
    expect(ttams.isTranslationModeActive()).toBeFalsy();

    ttams.activateVoiceoverMode();

    expect(ttams.isVoiceoverModeActive()).toBeTruthy();
    expect(ttams.isTranslationModeActive()).toBeFalsy();

    ttams.activateTranslationMode();

    expect(ttams.isVoiceoverModeActive()).toBeFalsy();
    expect(ttams.isTranslationModeActive()).toBeTruthy();
  });
});
// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the answer classification service
 */

require('domain/classifier/AnswerClassificationResultObjectFactory.ts');
require('domain/exploration/OutcomeObjectFactory.ts');
require('domain/exploration/StatesObjectFactory.ts');
require(
  'pages/exploration-player-page/services/answer-classification.service.ts');

describe('Answer classification service with string classifier disabled',
  function() {
    beforeEach(angular.mock.module('oppia'));

    beforeEach(function() {
      angular.mock.module(function($provide) {
        $provide.constant('INTERACTION_SPECS', {
          RuleTest: {
            is_trainable: false
          }
        });
        $provide.constant('ENABLE_ML_CLASSIFIERS', false);
      });
    });

    beforeEach(
      angular.mock.module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

    var EXPLICIT_CLASSIFICATION, DEFAULT_OUTCOME_CLASSIFICATION;
    var acs, sof, oof, acrof, stateName, state;
    beforeEach(angular.mock.inject(function($injector) {
      acs = $injector.get('AnswerClassificationService');
      sof = $injector.get('StateObjectFactory');
      oof = $injector.get('OutcomeObjectFactory');
      acrof = $injector.get('AnswerClassificationResultObjectFactory');
      EXPLICIT_CLASSIFICATION = $injector.get('EXPLICIT_CLASSIFICATION');
      DEFAULT_OUTCOME_CLASSIFICATION = $injector.get(
        'DEFAULT_OUTCOME_CLASSIFICATION');

      stateName = 'stateName';
      state = sof.createFromBackendDict(stateName, {
        content: {
          content_id: 'content',
          html: 'content'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {},
            feedback_2: {}
          }
        },
        interaction: {
          id: 'RuleTest',
          answer_groups: [{
            outcome: {
              dest: 'outcome 1',
              feedback: {
                content_id: 'feedback_1',
                html: ''
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null
            },
            rule_specs: [{
              inputs: {
                x: 10
              },
              rule_type: 'Equals'
            }]
          }, {
            outcome: {
              dest: 'outcome 2',
              feedback: {
                content_id: 'feedback_2',
                html: ''
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null
            },
            rule_specs: [{
              inputs: {
                x: 5
              },
              rule_type: 'Equals'
            }, {
              inputs: {
                x: 7
              },
              rule_type: 'NotEquals'
            }, {
              inputs: {
                x: 6
              },
              rule_type: 'Equals'
            }]
          }],
          default_outcome: {
            dest: 'default',
            feedback: {
              content_id: 'default_outcome',
              html: ''
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null
          },
          hints: []
        },
        param_changes: [],
        solicit_answer_details: false,
        written_translations: {
          translations_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {},
            feedback_2: {}
          }
        }
      });
    }));

    var explorationId = 'exploration';

    var rules = {
      Equals: function(answer, inputs) {
        return inputs.x === answer;
      },
      NotEquals: function(answer, inputs) {
        return inputs.x !== answer;
      }
    };

    it('should fail if no frontend rules are provided', function() {
      expect(function() {
        acs.getMatchingClassificationResult(stateName, state.interaction, 0);
      }).toThrow();
    });

    it('should return the first matching answer group and first matching rule' +
       'spec', function() {
      expect(
        acs.getMatchingClassificationResult(
          stateName, state.interaction, 10, rules)
      ).toEqual(acrof.createNew(
        oof.createNew('outcome 1', 'feedback_1', '', []), 0, 0,
        EXPLICIT_CLASSIFICATION)
      );

      expect(
        acs.getMatchingClassificationResult(
          stateName, state.interaction, 5, rules)
      ).toEqual(acrof.createNew(
        oof.createNew('outcome 2', 'feedback_2', '', []), 1, 0,
        EXPLICIT_CLASSIFICATION)
      );

      expect(
        acs.getMatchingClassificationResult(
          stateName, state.interaction, 6, rules)
      ).toEqual(acrof.createNew(
        oof.createNew('outcome 2', 'feedback_2', '', []), 1, 1,
        EXPLICIT_CLASSIFICATION)
      );
    });

    it('should return the default rule if no answer group matches', function() {
      expect(
        acs.getMatchingClassificationResult(
          stateName, state.interaction, 7, rules)
      ).toEqual(acrof.createNew(
        oof.createNew('default', 'default_outcome', '', []), 2, 0,
        DEFAULT_OUTCOME_CLASSIFICATION)
      );
    });

    it('should fail if no answer group matches and no default rule is ' +
       'provided', function() {
      var state2 = sof.createFromBackendDict(stateName, {
        content: {
          content_id: 'content',
          html: 'content'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {}
          }
        },
        interaction: {
          id: 'RuleTest',
          answer_groups: [{
            outcome: {
              dest: 'outcome 1',
              feedback: {
                content_id: 'feedback_1',
                html: ''
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null
            },
            rule_specs: [{
              inputs: {
                x: 10
              },
              rule_type: 'Equals'
            }]
          }],
          default_outcome: {
            dest: 'default',
            feedback: {
              content_id: 'default_outcome',
              html: ''
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null
          },
          hints: []
        },
        param_changes: [],
        solicit_answer_details: false,
        written_translations: {
          translations_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {}
          }
        }
      });

      expect(function() {
        acs.getMatchingClassificationResult(
          stateName, state.interaction, 0);
      }).toThrow();
    });
  });

describe('Answer classification service with string classifier enabled',
  function() {
    beforeEach(angular.mock.module('oppia'));

    beforeEach(function() {
      angular.mock.module(function($provide) {
        $provide.constant('INTERACTION_SPECS', {
          TrainableInteraction: {
            is_trainable: true
          },
          UntrainableInteraction: {
            is_trainable: false
          }
        });
        $provide.constant('ENABLE_ML_CLASSIFIERS', true);
        $provide.factory('PredictionSampleService', [function() {
          return {
            predict: function(classifierData, answer) {
              return 1;
            }
          };
        }]);
      });
    });

    beforeEach(
      angular.mock.module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

    var EXPLICIT_CLASSIFICATION, DEFAULT_OUTCOME_CLASSIFICATION,
      STATISTICAL_CLASSIFICATION;
    var acs, scms, sof, oof, acrof, stateName, state, state2,
      registryService, stateClassifierMapping;
    beforeEach(angular.mock.inject(function($injector) {
      acs = $injector.get('AnswerClassificationService');
      scms = $injector.get('StateClassifierMappingService');
      sof = $injector.get('StateObjectFactory');
      oof = $injector.get('OutcomeObjectFactory');
      acrof = $injector.get('AnswerClassificationResultObjectFactory');
      EXPLICIT_CLASSIFICATION = $injector.get('EXPLICIT_CLASSIFICATION');
      DEFAULT_OUTCOME_CLASSIFICATION = $injector.get(
        'DEFAULT_OUTCOME_CLASSIFICATION');
      STATISTICAL_CLASSIFICATION = $injector.get('STATISTICAL_CLASSIFICATION');
      registryService = $injector.get('PredictionAlgorithmRegistryService');

      stateName = 'stateName';
      state = sof.createFromBackendDict(stateName, {
        content: {
          content_id: 'content',
          html: 'content'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {},
            feedback_2: {}
          }
        },
        interaction: {
          id: 'TrainableInteraction',
          answer_groups: [{
            outcome: {
              dest: 'outcome 1',
              feedback: {
                content_id: 'feedback_1',
                html: ''
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null
            },
            rule_specs: [{
              inputs: {
                x: 10
              },
              rule_type: 'Equals'
            }]
          }, {
            outcome: {
              dest: 'outcome 2',
              feedback: {
                content_id: 'feedback_2',
                html: ''
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null
            },
            rule_specs: [{
              inputs: {
                x: 5
              },
              rule_type: 'Equals'
            }, {
              inputs: {
                x: 7
              },
              rule_type: 'Equals'
            }]
          }],
          default_outcome: {
            dest: 'default',
            feedback: {
              content_id: 'default_outcome',
              html: ''
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null
          },
          hints: []
        },
        param_changes: [],
        solicit_answer_details: false,
        written_translations: {
          translations_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {},
            feedback_2: {}
          }
        }
      });

      stateClassifierMapping = {
        stateName: {
          algorithm_id: 'TestClassifier',
          classifier_data: {},
          data_schema_version: 1
        }
      };
      scms.init(stateClassifierMapping);

      registryService.setMapping({
        TestClassifier: {
          v1: 'PredictionSampleService'
        }
      });

      state2 = angular.copy(state);
      state2.interaction.id = 'UntrainableInteraction';
    }));

    var explorationId = 'exploration';

    var rules = {
      Equals: function(answer, inputs) {
        return inputs.x === answer;
      },
      NotEquals: function(answer, inputs) {
        return inputs.x !== answer;
      }
    };

    it('should query the prediction service if no answer group matches and ' +
       'interaction is trainable', function() {
      // The prediction result is the same as default until there is a mapping
      // in PredictionAlgorithmRegistryService.
      expect(
        acs.getMatchingClassificationResult(
          stateName, state.interaction, 0, rules)
      ).toEqual(
        acrof.createNew(
          state.interaction.answerGroups[1].outcome, 1, null,
          STATISTICAL_CLASSIFICATION)
      );
    });

    it('should return the default rule if no answer group matches and ' +
       'interaction is not trainable', function() {
      expect(
        acs.getMatchingClassificationResult(
          stateName, state2.interaction, 0, rules)
      ).toEqual(acrof.createNew(
        oof.createNew('default', 'default_outcome', '', []), 2, 0,
        DEFAULT_OUTCOME_CLASSIFICATION)
      );
    });
  }
);

describe('Answer classification service with training data classification',
  function() {
    beforeEach(angular.mock.module('oppia'));

    beforeEach(function() {
      angular.mock.module(function($provide) {
        $provide.constant('INTERACTION_SPECS', {
          TrainableInteraction: {
            is_trainable: true
          }
        });
        $provide.constant('ENABLE_ML_CLASSIFIERS', true);
        $provide.constant('ENABLE_TRAINING_DATA_CLASSIFICATION', true);
      });
    });

    beforeEach(
      angular.mock.module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

    var EXPLICIT_CLASSIFICATION, TRAINING_DATA_CLASSIFICATION;
    var acs, sof, oof, acrof, stateName, state, state2,
      registryService, stateClassifierMapping;
    beforeEach(angular.mock.inject(function($injector) {
      acs = $injector.get('AnswerClassificationService');
      sof = $injector.get('StateObjectFactory');
      oof = $injector.get('OutcomeObjectFactory');
      acrof = $injector.get('AnswerClassificationResultObjectFactory');
      TRAINING_DATA_CLASSIFICATION = $injector.get(
        'TRAINING_DATA_CLASSIFICATION');
      EXPLICIT_CLASSIFICATION = $injector.get('EXPLICIT_CLASSIFICATION');

      stateName = 'stateName';
      state = sof.createFromBackendDict(stateName, {
        content: {
          content_id: 'content',
          html: 'content'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {},
            feedback_2: {}
          }
        },
        interaction: {
          id: 'TrainableInteraction',
          answer_groups: [{
            outcome: {
              dest: 'outcome 1',
              feedback: {
                content_id: 'feedback_1',
                html: ''
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null
            },
            training_data: ['abc', 'input'],
            rule_specs: [{
              inputs: {
                x: 'equal'
              },
              rule_type: 'Equals'
            }]
          }, {
            outcome: {
              dest: 'outcome 2',
              feedback: {
                content_id: 'feedback_2',
                html: ''
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null
            },
            training_data: ['xyz'],
            rule_specs: [{
              inputs: {
                x: 'npu'
              },
              rule_type: 'Contains'
            }]
          }],
          default_outcome: {
            dest: 'default',
            feedback: {
              content_id: 'default_outcome',
              html: ''
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null
          },
          hints: []
        },
        param_changes: [],
        solicit_answer_details: false,
        written_translations: {
          translations_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {},
            feedback_2: {}
          }
        }
      });
    }));

    var explorationId = 'exploration';

    var rules = {
      Equals: function(answer, input) {
        return answer === input;
      },
      Contains: function(answer, input) {
        return answer.toLowerCase().indexOf(
          input.x.toLowerCase()) !== -1;
      }
    };

    it('should use training data classification if no answer group matches ' +
       'and interaction is trainable', function() {
      expect(
        acs.getMatchingClassificationResult(
          stateName, state.interaction, 'abc', rules)
      ).toEqual(
        acrof.createNew(
          state.interaction.answerGroups[0].outcome, 0, null,
          TRAINING_DATA_CLASSIFICATION)
      );

      expect(
        acs.getMatchingClassificationResult(
          stateName, state.interaction, 'xyz', rules)
      ).toEqual(
        acrof.createNew(
          state.interaction.answerGroups[1].outcome, 1, null,
          TRAINING_DATA_CLASSIFICATION)
      );
    });

    it('should perform explicit classification before doing training data ' +
      'classification', function() {
      expect(
        acs.getMatchingClassificationResult(
          stateName, state.interaction, 'input', rules)
      ).toEqual(
        acrof.createNew(
          state.interaction.answerGroups[1].outcome, 1, 0,
          EXPLICIT_CLASSIFICATION)
      );
    });
  }
);
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
 * @fileoverview Unit tests for the audio preloader service.
 */

require('domain/exploration/ExplorationObjectFactory.ts');
require('domain/utilities/UrlInterpolationService.ts');
require('pages/exploration-player-page/services/audio-preloader.service.ts');
require(
  'pages/exploration-player-page/services/' +
  'audio-translation-language.service.ts');
require('services/ContextService.ts');

describe('Audio preloader service', function() {
  beforeEach(function() {
    angular.mock.module('oppia');
    // Set a global value for INTERACTION_SPECS that will be used by all the
    // descendant dependencies.
    angular.mock.module(function($provide) {
      $provide.constant('INTERACTION_SPECS', {
        TextInput: {
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

  var aps, atls, eof, ecs;
  var $httpBackend = null;
  var UrlInterpolationService = null;
  var $rootScope = null;
  var explorationDict;
  var requestUrl1, requestUrl2, requestUrl3, requestUrl4;
  beforeEach(angular.mock.inject(function($injector) {
    $httpBackend = $injector.get('$httpBackend');
    UrlInterpolationService = $injector.get('UrlInterpolationService');
    aps = $injector.get('AudioPreloaderService');
    atls = $injector.get('AudioTranslationLanguageService');
    eof = $injector.get('ExplorationObjectFactory');
    ecs = $injector.get('ContextService');
    spyOn(ecs, 'getExplorationId').and.returnValue('1');
    $rootScope = $injector.get('$rootScope');
    explorationDict = {
      id: 1,
      title: 'My Title',
      category: 'Art',
      objective: 'Your objective',
      tags: [],
      blurb: '',
      author_notes: '',
      states_schema_version: 15,
      init_state_name: 'Introduction',
      states: {
        'State 1': {
          param_changes: [],
          content: {
            content_id: 'content',
            html: '<p>State 1 Content</p>'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {
                en: {
                  filename: 'en-1.mp3',
                  file_size_bytes: 120000,
                  needs_update: false
                }
              },
              default_outcome: {}
            }
          },
          interaction: {
            id: 'Continue',
            default_outcome: {
              feedback: {
                content_id: 'default_outcome',
                html: ''
              },
              dest: 'State 3',
              param_changes: []
            },
            confirmed_unclassified_answers: [],
            customization_args: {
              buttonText: {
                value: 'Continue'
              }
            },
            solution: null,
            answer_groups: [],
            hints: []
          },
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {}
            }
          },
          classifier_model_id: null
        },
        'State 3': {
          param_changes: [],
          content: {
            content_id: 'content',
            html: 'Congratulations, you have finished!',
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {
                en: {
                  filename: 'en-3.mp3',
                  file_size_bytes: 120000,
                  needs_update: false
                }
              }
            }
          },
          interaction: {
            id: 'EndExploration',
            default_outcome: null,
            confirmed_unclassified_answers: [],
            customization_args: {
              recommendedExplorationIds: {
                value: []
              }
            },
            solution: null,
            answer_groups: [],
            hints: []
          },
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              content: {}
            }
          },
          classifier_model_id: null
        },
        'State 2': {
          param_changes: [],
          content: {
            content_id: 'content',
            html: '<p>State 2 Content</p>'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {
                en: {
                  filename: 'en-2.mp3',
                  file_size_bytes: 120000,
                  needs_update: false
                }
              },
              default_outcome: {}
            }
          },
          interaction: {
            id: 'Continue',
            default_outcome: {
              feedback: {
                content_id: 'default_outcome',
                html: ''
              },
              dest: 'State 3',
              param_changes: []
            },
            confirmed_unclassified_answers: [],
            customization_args: {
              buttonText: {
                value: 'Continue'
              }
            },
            solution: null,
            answer_groups: [],
            hints: []
          },
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {}
            }
          },
          classifier_model_id: null
        },
        Introduction: {
          param_changes: [],
          content: {
            content_id: 'content',
            html: '<p>Introduction Content</p>',
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {
                en: {
                  filename: 'en-0.mp3',
                  file_size_bytes: 120000,
                  needs_update: false
                }
              },
              default_outcome: {},
              feedback_1: {}
            }
          },
          interaction: {
            id: 'TextInput',
            default_outcome: {
              dest: 'Introduction',
              feedback: {
                content_id: 'default_outcome',
                html: '<p>Try again.</p>'
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
            },
            confirmed_unclassified_answers: [],
            customization_args: {
              rows: {
                value: 1
              },
              placeholder: {
                value: ''
              }
            },
            solution: null,
            answer_groups: [{
              rule_specs: [{
                inputs: {
                  x: '1'
                },
                rule_type: 'Contains'
              }],
              outcome: {
                dest: 'State 1',
                feedback: {
                  content_id: 'feedback_1',
                  html: "<p>Let's go to State 1</p>"
                },
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null
              }
            }, {
              rule_specs: [{
                inputs: {
                  x: '2'
                },
                rule_type: 'Contains'
              }],
              outcome: {
                dest: 'State 2',
                feedback: {
                  content_id: 'feedback_2',
                  html: "<p>Let's go to State 2</p>"
                },
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null
              }
            }],
            hints: []
          },
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {}
            }
          },
          classifier_model_id: null
        }
      },
      param_specs: {},
      param_changes: [],
      version: 1
    };

    requestUrl1 = UrlInterpolationService.interpolateUrl(
      '/assetsdevhandler/<exploration_id>/assets/audio/<filename>', {
        exploration_id: '1',
        filename: 'en-0.mp3'
      });
    requestUrl2 = UrlInterpolationService.interpolateUrl(
      '/assetsdevhandler/<exploration_id>/assets/audio/<filename>', {
        exploration_id: '1',
        filename: 'en-1.mp3'
      });
    requestUrl3 = UrlInterpolationService.interpolateUrl(
      '/assetsdevhandler/<exploration_id>/assets/audio/<filename>', {
        exploration_id: '1',
        filename: 'en-2.mp3'
      });
    requestUrl4 = UrlInterpolationService.interpolateUrl(
      '/assetsdevhandler/<exploration_id>/assets/audio/<filename>', {
        exploration_id: '1',
        filename: 'en-3.mp3'
      });
  }));

  it('should maintain the correct number of download requests in queue',
    function() {
      $httpBackend.expect('GET', requestUrl1).respond(201, 'audio data 1');
      $httpBackend.expect('GET', requestUrl2).respond(201, 'audio data 2');
      $httpBackend.expect('GET', requestUrl3).respond(201, 'audio data 3');
      $httpBackend.expect('GET', requestUrl4).respond(201, 'audio data 4');
      var exploration = eof.createFromBackendDict(explorationDict);
      aps.init(exploration);
      atls.init(['en'], 'en', 'en');
      aps.kickOffAudioPreloader(exploration.getInitialState().name);

      expect(aps.getFilenamesOfAudioCurrentlyDownloading().length).toBe(3);
      expect(aps.isLoadingAudioFile('en-0.mp3')).toBe(true);
      expect(aps.isLoadingAudioFile('en-1.mp3')).toBe(true);
      expect(aps.isLoadingAudioFile('en-2.mp3')).toBe(true);
      expect(aps.isLoadingAudioFile('en-3.mp3')).toBe(false);
      $httpBackend.flush(1);
      expect(aps.getFilenamesOfAudioCurrentlyDownloading().length).toBe(3);
      $httpBackend.flush(1);
      expect(aps.getFilenamesOfAudioCurrentlyDownloading().length).toBe(2);
      $httpBackend.flush(1);
      expect(aps.getFilenamesOfAudioCurrentlyDownloading().length).toBe(1);
      expect(aps.isLoadingAudioFile('en-0.mp3')).toBe(false);
      expect(aps.isLoadingAudioFile('en-1.mp3')).toBe(false);
      expect(aps.isLoadingAudioFile('en-2.mp3')).toBe(false);
      expect(aps.isLoadingAudioFile('en-3.mp3')).toBe(true);
      $httpBackend.flush(1);
      expect(aps.getFilenamesOfAudioCurrentlyDownloading().length).toBe(0);
    });

  it('should properly restart pre-loading from a new state', function() {
    var exploration = eof.createFromBackendDict(explorationDict);
    aps.init(exploration);
    atls.init(['en'], 'en', 'en');
    aps.kickOffAudioPreloader(exploration.getInitialState().name);
    expect(aps.getFilenamesOfAudioCurrentlyDownloading().length).toBe(3);
    aps.restartAudioPreloader('State 3');
    expect(aps.getFilenamesOfAudioCurrentlyDownloading().length).toBe(1);
    expect(aps.isLoadingAudioFile('en-3.mp3')).toBe(true);
    aps.restartAudioPreloader('State 2');
    expect(aps.getFilenamesOfAudioCurrentlyDownloading().length).toBe(2);
    expect(aps.isLoadingAudioFile('en-2.mp3')).toBe(true);
    expect(aps.isLoadingAudioFile('en-3.mp3')).toBe(true);
  });
});
// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the audio translation language service.
 */

require(
  'pages/exploration-player-page/services/' +
  'audio-translation-language.service.ts');

describe('Audio translation language service', function() {
  beforeEach(angular.mock.module('oppia'));

  var atls;
  beforeEach(angular.mock.inject(function($injector) {
    atls = $injector.get('AudioTranslationLanguageService');
  }));

  it('should properly initialize the current audio language when ' +
     'a preferred language is set', function() {
    var allAudioLanguageCodesInExploration = ['hi-en', 'en'];
    var preferredLanguageCode = 'hi-en';
    var explorationLanguageCode = 'hi';
    atls.init(allAudioLanguageCodesInExploration, preferredLanguageCode,
      explorationLanguageCode);
    expect(atls.getCurrentAudioLanguageCode()).toEqual('hi-en');
    atls.clearCurrentAudioLanguageCode();

    allAudioLanguageCodesInExploration = ['hi-en', 'en'];
    preferredLanguageCode = 'en';
    explorationLanguageCode = 'hi';
    atls.init(allAudioLanguageCodesInExploration, preferredLanguageCode,
      explorationLanguageCode);
    expect(atls.getCurrentAudioLanguageCode()).toEqual('en');
    atls.clearCurrentAudioLanguageCode();

    allAudioLanguageCodesInExploration = ['hi-en'];
    preferredLanguageCode = 'en';
    explorationLanguageCode = 'hi';
    atls.init(['hi-en'], preferredLanguageCode,
      explorationLanguageCode);
    expect(atls.getCurrentAudioLanguageCode()).toEqual('hi-en');
  });

  it('should initialize the current audio language when ' +
     'no preferred language is set and the exploration contains an audio ' +
     'language that is related to the exploration language', function() {
    var allAudioLanguageCodesInExploration = ['hi-en', 'en'];
    var preferredLanguageCode = null;
    var explorationLanguageCode = 'hi';
    atls.init(allAudioLanguageCodesInExploration, preferredLanguageCode,
      explorationLanguageCode);
    expect(atls.getCurrentAudioLanguageCode()).toEqual('hi-en');
  });

  it('should initialize the current audio language to the most ' +
     'relevant language when multiple audio languages are related ' +
     'to the exploration language', function() {
    var allAudioLanguageCodesInExploration = ['hi-en', 'en'];
    var preferredLanguageCode = null;
    var explorationLanguageCode = 'en';
    atls.init(allAudioLanguageCodesInExploration, preferredLanguageCode,
      explorationLanguageCode);
    expect(atls.getCurrentAudioLanguageCode()).toEqual('en');
  });

  it('should not have any audio language option when no audio is available ' +
     'and automatic Text-to-speech is disabled in an exploration', function() {
    var allAudioLanguageCodesInExploration = [];
    var explorationLanguageCode = 'en';
    var automaticTextToSpeechEnabled = false;

    // When preferredLanguageCode is set.
    var preferredLanguageCode = 'hi';
    atls.init(allAudioLanguageCodesInExploration, preferredLanguageCode,
      explorationLanguageCode, automaticTextToSpeechEnabled);
    expect(atls.getLanguageOptionsForDropdown()).toEqual([]);

    // When preferredLanguageCode is not set.
    preferredLanguageCode = null;
    atls.init(allAudioLanguageCodesInExploration, preferredLanguageCode,
      explorationLanguageCode, automaticTextToSpeechEnabled);
    expect(atls.getLanguageOptionsForDropdown()).toEqual([]);
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the audio translation manager service.
 */

require('domain/exploration/AudioTranslationObjectFactory.ts');
require('domain/exploration/VoiceoverObjectFactory.ts');
require(
  'pages/exploration-player-page/services/' +
  'audio-translation-manager.service.ts');

describe('Audio translation manager service', function() {
  beforeEach(angular.mock.module('oppia'));

  var atms, vof;
  var testAudioTranslations;
  var testAudioTranslations2;
  beforeEach(angular.mock.inject(function($injector) {
    atms = $injector.get('AudioTranslationManagerService');
    vof = $injector.get('VoiceoverObjectFactory');

    testAudioTranslations = {
      en: vof.createFromBackendDict({
        filename: 'audio-en.mp3',
        file_size_bytes: 0.5,
        needs_update: false
      }),
      es: vof.createFromBackendDict({
        filename: 'audio-es.mp3',
        file_size_bytes: 0.5,
        needs_update: false
      })
    };

    testAudioTranslations2 = {
      zh: vof.createFromBackendDict({
        filename: 'audio-zh.mp3',
        file_size_bytes: 0.5,
        needs_update: false
      }),
      'hi-en': vof.createFromBackendDict({
        filename: 'audio-hi-en.mp3',
        file_size_bytes: 0.5,
        needs_update: false
      })
    };
  }));

  it('should properly set primary and secondary audio translations',
    function() {
      atms.setContentAudioTranslations(testAudioTranslations);
      expect(atms.getCurrentAudioTranslations()).toEqual({
        en: vof.createFromBackendDict({
          filename: 'audio-en.mp3',
          file_size_bytes: 0.5,
          needs_update: false
        }),
        es: vof.createFromBackendDict({
          filename: 'audio-es.mp3',
          file_size_bytes: 0.5,
          needs_update: false
        })
      });
      atms.setSecondaryAudioTranslations(testAudioTranslations2);
      expect(atms.getCurrentAudioTranslations()).toEqual({
        zh: vof.createFromBackendDict({
          filename: 'audio-zh.mp3',
          file_size_bytes: 0.5,
          needs_update: false
        }),
        'hi-en': vof.createFromBackendDict({
          filename: 'audio-hi-en.mp3',
          file_size_bytes: 0.5,
          needs_update: false
        })
      });
      atms.clearSecondaryAudioTranslations();
      expect(atms.getCurrentAudioTranslations()).toEqual({
        en: vof.createFromBackendDict({
          filename: 'audio-en.mp3',
          file_size_bytes: 0.5,
          needs_update: false
        }),
        es: vof.createFromBackendDict({
          filename: 'audio-es.mp3',
          file_size_bytes: 0.5,
          needs_update: false
        })
      });
    });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for CurrentInteractionService.
 */

require(
  'pages/exploration-player-page/services/current-interaction.service.ts');

describe('Current Interaction Service', function() {
  beforeEach(angular.mock.module('oppia'));

  var DUMMY_ANSWER = 'dummy_answer';

  var CurrentInteractionService;
  beforeEach(angular.mock.inject(function($injector) {
    CurrentInteractionService = $injector.get('CurrentInteractionService');
  }));

  it('should properly register onSubmitFn and submitAnswerFn', function() {
    var answerState = null;
    var dummyOnSubmitFn = function(answer, interactionRulesService) {
      answerState = answer;
    };

    CurrentInteractionService.setOnSubmitFn(dummyOnSubmitFn);
    CurrentInteractionService.onSubmit(DUMMY_ANSWER, null);
    expect(answerState).toEqual(DUMMY_ANSWER);

    answerState = null;
    var dummySubmitAnswerFn = function() {
      CurrentInteractionService.onSubmit(DUMMY_ANSWER, null);
    };
    CurrentInteractionService.registerCurrentInteraction(
      dummySubmitAnswerFn, null);
    CurrentInteractionService.submitAnswer();
    expect(answerState).toEqual(DUMMY_ANSWER);
  });

  it('should properly register validityCheckFn', function() {
    var dummyValidityCheckFn = function() {
      return false;
    };
    CurrentInteractionService.registerCurrentInteraction(
      null, dummyValidityCheckFn);
    expect(CurrentInteractionService.isSubmitButtonDisabled()).toBe(
      !dummyValidityCheckFn());
  });

  it('should handle case where validityCheckFn is null', function() {
    CurrentInteractionService.registerCurrentInteraction(null, null);
    expect(CurrentInteractionService.isSubmitButtonDisabled()).toBe(false);
  });

  it('should properly register and clear presubmit hooks', function() {
    var hookStateA = 0;
    var hookStateB = 1;
    var hookA = function() {
      hookStateA = hookStateA + 1;
    };
    var hookB = function() {
      hookStateB = hookStateB * 3;
    };

    CurrentInteractionService.registerPresubmitHook(hookA);
    CurrentInteractionService.registerPresubmitHook(hookB);

    CurrentInteractionService.setOnSubmitFn(function() {});
    CurrentInteractionService.onSubmit(null, null);

    expect(hookStateA).toEqual(1);
    expect(hookStateB).toEqual(3);

    CurrentInteractionService.clearPresubmitHooks();
    CurrentInteractionService.onSubmit(null, null);

    expect(hookStateA).toEqual(1);
    expect(hookStateB).toEqual(3);
  });
});
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

require('domain/exploration/ExplorationObjectFactory.ts');
require(
  'pages/exploration-player-page/services/' +
  'extract-image-filenames-from-state.service.ts');
require('services/ContextService.ts');

describe('Extracting Image file names in the state service', function() {
  beforeEach(function() {
    angular.mock.module('oppia');
    // Set a global value for INTERACTION_SPECS that will be used by all the
    // descendant dependencies.
    angular.mock.module(function($provide) {
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
  var explorationDict;
  var ImageFilenamesInExploration;
  beforeEach(angular.mock.inject(function($injector) {
    eof = $injector.get('ExplorationObjectFactory');
    ecs = $injector.get('ContextService');
    eifss = $injector.get('ExtractImageFilenamesFromStateService');
    spyOn(ecs, 'getExplorationId').and.returnValue('1');
    $rootScope = $injector.get('$rootScope');
    explorationDict = {
      id: 1,
      title: 'My Title',
      category: 'Art',
      objective: 'Your objective',
      tags: [],
      blurb: '',
      author_notes: '',
      states_schema_version: 15,
      init_state_name: 'Introduction',
      states: {
        'State 1': {
          param_changes: [],
          content: {
            content_id: 'content',
            html: ''
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {}
            }
          },
          interaction: {
            id: 'Continue',
            default_outcome: {
              feedback: {
                content_id: 'default_outcome',
                html: ''
              },
              dest: 'State 3',
              param_changes: []
            },
            confirmed_unclassified_answers: [],
            customization_args: {
              buttonText: {
                value: 'Continue'
              }
            },
            solution: null,
            answer_groups: [],
            hints: []
          },
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {}
            }
          },
          classifier_model_id: null
        },
        'State 3': {
          param_changes: [],
          content: {
            content_id: 'content',
            html: 'Congratulations, you have finished!'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {}
            }
          },
          interaction: {
            id: 'EndExploration',
            default_outcome: null,
            confirmed_unclassified_answers: [],
            customization_args: {
              recommendedExplorationIds: {
                value: []
              }
            },
            solution: null,
            answer_groups: [],
            hints: []
          },
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {}
            }
          },
          classifier_model_id: null
        },
        Introduction: {
          classifier_model_id: null,
          param_changes: [],
          content: {
            content_id: 'content',
            html: 'Multiple Choice'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {},
              feedback_2: {}
            }
          },
          interaction: {
            id: 'MultipleChoiceInput',
            default_outcome: {
              dest: 'Introduction',
              feedback: {
                content_id: 'default_outcome',
                html: 'Try Again!'
              }
            },
            confirmed_unclassified_answers: [],
            customization_args: {
              choices: {
                value: [
                  '<p> Go to ItemSelection <oppia-noninteractive-image' +
                  ' filepath-with-value="&amp;quot;sIMultipleChoice1.png&amp;' +
                  'quot;"></oppia-noninteractive-image></p>',
                  '<p> Go to ImageAndRegion<oppia-noninteractive-image' +
                  ' filepath-with-value="&amp;quot;sIMultipleChoice2.png&amp;' +
                  'quot;"></oppia-noninteractive-image></p>'
                ]
              }
            },
            answer_groups: [
              {
                labelled_as_correct: false,
                outcome: {
                  dest: 'State 4',
                  feedback: {
                    content_id: 'feedback_1',
                    html: '<p>We are going to ItemSelection' +
                          '<oppia-noninteractive-image filepath-with-value=' +
                          '"&amp;quot;sIOutcomeFeedback.png&amp;quot;">' +
                          '</oppia-noninteractive-image></p>'
                  },
                  param_changes: [],
                  refresher_exploration_id: null
                },
                rule_specs: [
                  {
                    inputs: {
                      x: 0
                    },
                    rule_type: 'Equals'
                  }
                ]
              },
              {
                labelled_as_correct: false,
                outcome: {
                  dest: 'State 5',
                  feedback: {
                    content_id: 'feedback_2',
                    html: "Let's go to state 5 ImageAndRegion"
                  },
                  param_changes: [],
                  refresher_exploration_id: null
                },
                rule_specs: [
                  {
                    inputs: {
                      x: 1
                    },
                    rule_type: 'Equals'
                  }
                ]
              }
            ],
            hints: [],
            solution: null
          },
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {},
              feedback_2: {}
            }
          }
        },
        'State 4': {
          param_changes: [],
          content: {
            content_id: 'content',
            html: '<p><oppia-noninteractive-image filepath-with-value="&amp;' +
                  'quot;s4Content.png&amp;quot;">' +
                  '</oppia-noninteractive-image></p>'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {},
              feedback_2: {}
            }
          },
          interaction: {
            id: 'ItemSelectionInput',
            default_outcome: {
              feedback: {
                content_id: 'content',
                html: '<p>Try Again! <oppia-noninteractive-image' +
                      'filepath-with-value="&amp;quot;' +
                      's4DefaultOutcomeFeedback.png&amp;quot;">' +
                      '</oppia-noninteractive-image></p>'
              },
              dest: 'State 4',
              param_changes: []
            },
            confirmed_unclassifies_answers: [],
            customization_args: {
              minAllowableSelectionCount: {
                value: 1
              },
              maxAllowableSelectionCount: {
                value: 2
              },
              choices: {
                value: [
                  '<p><oppia-noninteractive-image filepath-with-value="&amp;' +
                  'quot;s4Choice1.png&amp;quot;">' +
                  '</oppia-noninteractive-image></p>',
                  '<p><oppia-noninteractive-image filepath-with-value="&amp;' +
                  'quot;s4Choice2.png&amp;quot;">' +
                  '</oppia-noninteractive-image></p>']
              }
            },
            hints: [],
            solution: null,
            answer_groups: [
              {
                labelled_as_correct: false,
                outcome: {
                  dest: 'State 6',
                  feedback: {
                    content_id: 'feedback_1',
                    html: "It is choice number 1. Let's go to the Text Input"
                  },
                  param_changes: [],
                  refresher_exploration_id: null
                },
                rule_specs: [
                  {
                    inputs: {
                      x: [
                        '<p><oppia-noninteractive-image filepath-with-value=' +
                        '"&amp;quot;s4Choice1.png&amp;quot;">' +
                        '</oppia-noninteractive-image></p>'
                      ]
                    },
                    rule_type: 'Equals'
                  }
                ]
              },
              {
                labelled_as_correct: true,
                outcome: {
                  dest: 'State 1',
                  feedback: {
                    content_id: 'feedback_2',
                    html: 'It is choice number 2'
                  },
                  param_changes: [],
                  refresher_exploration_id: null
                },
                rule_specs: [
                  {
                    inputs: {
                      x: [
                        '<p><oppia-noninteractive-image filepath-with-value=' +
                        '"&amp;quot;s4Choice2.png&amp;quot;">' +
                        '</oppia-noninteractive-image></p>'
                      ]
                    },
                    rule_type: 'Equals'
                  }
                ]
              }
            ]
          },
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {},
              feedback_2: {}
            }
          }
        },
        'State 5': {
          classifier_model_id: null,
          param_changes: [],
          content: {
            content_id: 'content',
            html: ''
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {},
              feedback_2: {},
              feedback_3: {},
              feedback_4: {},
              feedback_5: {}
            }
          },
          interaction: {
            id: 'ImageClickInput',
            confirmed_unclassified_answers: [],
            default_outcome: {
              dest: 'State 5',
              feedback: {
                content_id: 'content',
                html: 'Try Again!'
              }
            },
            answer_groups: [
              {
                labelled_as_correct: false,
                outcome: {
                  dest: 'State 5',
                  feedback: {
                    content_id: 'feeedback_1',
                    html: '<p>That is the class definition. Try again.</p>'
                  },
                  param_changes: [],
                  refresher_exploration_id: null
                },
                rule_specs: [{
                  inputs: {
                    x: 'classdef'
                  },
                  rule_type: 'IsInRegion'
                }]
              },
              {
                labelled_as_correct: false,
                outcome: {
                  dest: 'State 5',
                  feedback: {
                    content_id: 'feeedback_2',
                    html: '<p>That is a function, which is close to what you' +
                          'are looking for. Try again!</p>'
                  },
                  param_changes: [],
                  refresher_exploration_id: null
                },
                rule_specs: [{
                  inputs: {
                    x: 'instancefunc'
                  },
                  rule_type: 'IsInRegion'
                }]
              },
              {
                labelled_as_correct: false,
                outcome: {
                  dest: 'State 5',
                  feedback: {
                    content_id: 'feeedback_3',
                    html: '<p>That is the class docstring. Try again.</p>'
                  },
                  param_changes: [],
                  refresher_exploration_id: null
                },
                rule_specs: [{
                  inputs: {
                    x: 'docstring'
                  },
                  rule_type: 'IsInRegion'
                }]
              },
              {
                labelled_as_correct: false,
                outcome: {
                  dest: 'State 5',
                  feedback: {
                    content_id: 'feeedback_4',
                    html: "<p>That's a classmethod. It does execute code," +
                          "but it doesn't construct anything. Try again!</p>"
                  },
                  param_changes: [],
                  refresher_exploration_id: null
                },
                rule_specs: [{
                  inputs: {
                    x: 'classfunc'
                  },
                  rule_type: 'IsInRegion'
                }]
              },
              {
                labelled_as_correct: false,
                outcome: {
                  dest: 'State 1',
                  feedback: {
                    content_id: 'feeedback_5',
                    html: '<p>You found it! This is the code responsible for' +
                          'constructing a new class object.</p>'
                  },
                  param_changes: [],
                  refresher_exploration_id: null
                },
                rule_specs: [{
                  inputs: {
                    x: 'ctor'
                  },
                  rule_type: 'IsInRegion'
                }]
              }
            ],
            customization_args: {
              highlightRegionsOnHover: {
                value: true
              },
              imageAndRegions: {
                value: {
                  imagePath: 's5ImagePath.png',
                  labeledRegions: [{
                    label: 'classdef',
                    region: {
                      area: [
                        [0.004291845493562232, 0.004692192192192192],
                        [0.40987124463519314, 0.05874624624624625]
                      ],
                      regionType: 'Rectangle'
                    }
                  },
                  {
                    label: 'docstring',
                    region: {
                      area: [
                        [0.07296137339055794, 0.06475225225225226],
                        [0.9892703862660944, 0.1218093093093093]
                      ],
                      regionType: 'Rectangle'
                    }
                  },
                  {
                    label: 'instancefunc',
                    region: {
                      area: [
                        [0.07296137339055794, 0.15183933933933935],
                        [0.6995708154506438, 0.44012762762762764]
                      ],
                      regionType: 'Rectangle'
                    }
                  },
                  {
                    label: 'classfunc',
                    region: {
                      area: [
                        [0.06866952789699571, 0.46114864864864863],
                        [0.6931330472103004, 0.776463963963964]
                      ],
                      regionType: 'Rectangle'
                    }
                  },
                  {
                    label: 'ctor',
                    region: {
                      area: [
                        [0.06437768240343347, 0.821509009009009],
                        [0.740343347639485, 0.9926801801801802]
                      ],
                      regionType: 'Rectangle'
                    }
                  }]
                }
              }
            },
            hints: [],
            solution: null
          },
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {},
              feedback_2: {},
              feedback_3: {},
              feedback_4: {},
              feedback_5: {}
            }
          }
        },
        'State 6': {
          param_changes: [],
          content: {
            content_id: 'content',
            html: '<p>Text Input Content</p>'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {},
              feedback_2: {},
              hint_1: {},
              solution: {}
            }
          },
          interaction: {
            id: 'TextInput',
            default_outcome: {
              dest: 'State 6',
              feedback: {
                content_id: 'default_outcome',
                html: '<p>Try again.</p>'
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
            },
            confirmed_unclassified_answers: [],
            customization_args: {
              rows: {
                value: 1
              },
              placeholder: {
                value: ''
              }
            },
            answer_groups: [{
              rule_specs: [{
                inputs: {
                  x: '1'
                },
                rule_type: 'Contains'
              }],
              outcome: {
                dest: 'State 1',
                feedback: {
                  content_id: 'feedback_1',
                  html: "<p>Let's go to State 1</p>"
                },
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null
              }
            }, {
              rule_specs: [{
                inputs: {
                  x: '2'
                },
                rule_type: 'Contains'
              }],
              outcome: {
                dest: 'State 1',
                feedback: {
                  content_id: 'feedback_2',
                  html: "<p>Let's go to State 1</p>"
                },
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null
              }
            }],
            hints: [{
              hint_content: {
                content_id: 'hint_1',
                html: '<p><oppia-noninteractive-image filepath-with-value="' +
                      '&amp;quot;s6Hint1.png&amp;quot;">' +
                      '</oppia-noninteractive-image></p>'
              }
            }],
            solution: {
              answer_is_exclusive: false,
              correct_answer: 'cat',
              explanation: {
                content_id: 'solution',
                html: '<p><oppia-noninteractive-image filepath-with-value="' +
                      '&amp;quot;s6SolutionExplanation.png&amp;quot;">' +
                      '</oppia-noninteractive-image></p>'
              }
            },
          },
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {},
              feedback_2: {},
              hint_1: {},
              solution: {}
            }
          },
          classifier_model_id: null
        }
      },
      param_specs: {},
      param_changes: [],
      version: 1
    };

    ImageFilenamesInExploration = {
      'State 1': [],
      'State 3': [],
      'State 4': ['s4Content.png', 's4Choice1.png', 's4Choice2.png',
        's4DefaultOutcomeFeedback.png'],
      'State 5': ['s5ImagePath.png'],
      'State 6': ['s6Hint1.png', 's6SolutionExplanation.png'],
      Introduction: ['sIMultipleChoice1.png', 'sIMultipleChoice2.png',
        'sIOutcomeFeedback.png']
    };
  }));

  it('should get all the filenames of the images in a state',
    function() {
      var exploration = eof.createFromBackendDict(explorationDict);
      var states = exploration.getStates();
      var stateNames = states.getStateNames();
      stateNames.forEach(function(statename) {
        var filenamesInState = (
          eifss.getImageFilenamesInState(states.getState(statename)));
        filenamesInState.forEach(function(filename) {
          expect(ImageFilenamesInExploration[statename]).toContain(filename);
        });
      });
    });
});
// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the Hints/Solution Manager service.
 */

require('domain/exploration/HintObjectFactory.ts');
require('domain/exploration/SolutionObjectFactory.ts');
require(
  'pages/exploration-player-page/services/' +
  'hints-and-solution-manager.service.ts');

describe('HintsAndSolutionManager service', function() {
  var $timeout;
  var $rootScope;
  var hasms;
  var hof;
  var sof;
  var EVENT_NEW_CARD_AVAILABLE;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector) {
    $timeout = $injector.get('$timeout');
    $rootScope = $injector.get('$rootScope');
    hasms = $injector.get('HintsAndSolutionManagerService');
    hof = $injector.get('HintObjectFactory');
    sof = $injector.get('SolutionObjectFactory');
    EVENT_NEW_CARD_AVAILABLE = $injector.get('EVENT_NEW_CARD_AVAILABLE');

    // Initialize the service with two hints and a solution.
    hasms.reset([
      hof.createFromBackendDict({
        hint_content: {
          html: 'one',
          audio_translations: {}
        }
      }), hof.createFromBackendDict({
        hint_content: {
          html: 'two',
          audio_translations: {}
        }
      })
    ], sof.createFromBackendDict({
      answer_is_exclusive: false,
      correct_answer: 'This is a correct answer!',
      explanation: {
        html: 'This is the explanation to the answer',
        audio_translations: {}
      }
    }));
  }));

  it('should display hints at the right times', function() {
    expect(hasms.isHintViewable(0)).toBe(false);
    expect(hasms.isHintViewable(1)).toBe(false);
    expect(hasms.isSolutionViewable()).toBe(false);

    $timeout.flush();

    // The first hint becomes viewable.
    expect(hasms.isHintViewable(0)).toBe(true);
    expect(hasms.isHintViewable(1)).toBe(false);
    expect(hasms.isSolutionViewable()).toBe(false);

    // No additional hints become viewable because the first hint has not been
    // consumed yet.

    expect(hasms.isHintViewable(0)).toBe(true);
    expect(hasms.isHintViewable(1)).toBe(false);
    expect(hasms.isSolutionViewable()).toBe(false);

    // The first hint is consumed, but a delay is needed for the second hint to
    // be viewable.
    expect(hasms.displayHint(0).getHtml()).toBe('one');
    expect(hasms.isHintViewable(0)).toBe(true);
    expect(hasms.isHintViewable(1)).toBe(false);
    expect(hasms.isSolutionViewable()).toBe(false);

    $timeout.flush();

    // The second hint is now available, but has not been consumed yet.
    expect(hasms.isHintViewable(0)).toBe(true);
    expect(hasms.isHintViewable(1)).toBe(true);
    expect(hasms.isSolutionViewable()).toBe(false);

    // The second hint is consumed, but a delay is needed for the solution to
    // be viewable. Previous hints are still viewable, too.
    expect(hasms.displayHint(1).getHtml()).toBe('two');
    expect(hasms.displayHint(0).getHtml()).toBe('one');
    expect(hasms.isHintViewable(0)).toBe(true);
    expect(hasms.isHintViewable(1)).toBe(true);
    expect(hasms.isSolutionViewable()).toBe(false);

    $timeout.flush();

    // The solution is now viewable.
    expect(hasms.isSolutionViewable()).toBe(true);
  });

  it('should not continue to display hints after after a correct answer is' +
     'submitted', function() {
    expect(hasms.isHintViewable(0)).toBe(false);
    expect(hasms.isHintViewable(1)).toBe(false);
    expect(hasms.isSolutionViewable()).toBe(false);

    $timeout.flush();
    // The first hint becomes viewable.
    expect(hasms.isHintViewable(0)).toBe(true);
    expect(hasms.isHintViewable(1)).toBe(false);
    expect(hasms.isSolutionViewable()).toBe(false);

    // The first hint is consumed, but a delay is needed for the second hint
    // to be viewable.
    expect(hasms.displayHint(0).getHtml()).toBe('one');
    expect(hasms.isHintViewable(0)).toBe(true);
    expect(hasms.isHintViewable(1)).toBe(false);
    expect(hasms.isSolutionViewable()).toBe(false);

    $rootScope.$broadcast(EVENT_NEW_CARD_AVAILABLE);
    $timeout.flush();

    // Because a correct answer was submitted, the next hint should not be
    // available.
    expect(hasms.isHintViewable(0)).toBe(true);
    expect(hasms.isHintViewable(1)).toBe(false);
    expect(hasms.isSolutionViewable()).toBe(false);

    $timeout.verifyNoPendingTasks();
  });

  it('should show the correct number of hints', function() {
    expect(hasms.getNumHints()).toBe(2);
  });

  it('should correctly retrieve the solution', function() {
    expect(hasms.isSolutionConsumed()).toBe(false);
    expect(hasms.displaySolution().correctAnswer).toBe(
      'This is a correct answer!');
    expect(hasms.isSolutionConsumed()).toBe(true);
  });
});
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
 * @fileoverview Unit tests for the image preloader service.
 */

require('domain/exploration/ExplorationObjectFactory.ts');
require('domain/utilities/UrlInterpolationService.ts');
require('pages/exploration-player-page/services/image-preloader.service.ts');
require('services/AssetsBackendApiService.ts');
require('services/ContextService.ts');

describe('Image preloader service', function() {
  beforeEach(function() {
    angular.mock.module('oppia');
    // Set a global value for INTERACTION_SPECS that will be used by all the
    // descendant dependencies.
    angular.mock.module(function($provide) {
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

  var abas, ips, eof, ecs;
  var $httpBackend = null;
  var UrlInterpolationService;
  var $rootScope = null;
  var explorationDict;
  var requestUrl1, requestUrl2, requestUrl3, requestUrl4, requestUrl5;
  beforeEach(angular.mock.inject(function($injector) {
    $httpBackend = $injector.get('$httpBackend');
    UrlInterpolationService = $injector.get('UrlInterpolationService');
    ips = $injector.get('ImagePreloaderService');
    eof = $injector.get('ExplorationObjectFactory');
    ecs = $injector.get('ContextService');
    abas = $injector.get('AssetsBackendApiService');
    spyOn(ecs, 'getExplorationId').and.returnValue('1');
    $rootScope = $injector.get('$rootScope');
    explorationDict = {
      id: 1,
      title: 'My Title',
      category: 'Art',
      objective: 'Your objective',
      tags: [],
      blurb: '',
      author_notes: '',
      states_schema_version: 15,
      init_state_name: 'Introduction',
      states: {
        'State 1': {
          param_changes: [],
          content: {
            html: '',
            content_id: 'content'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {}
            }
          },
          interaction: {
            id: 'Continue',
            default_outcome: {
              feedback: {
                content_id: 'default_outcome',
                html: ''
              },
              dest: 'State 3',
              param_changes: []
            },
            confirmed_unclassified_answers: [],
            customization_args: {
              buttonText: {
                value: 'Continue'
              }
            },
            solution: null,
            answer_groups: [],
            hints: []
          },
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {}
            }
          },
          classifier_model_id: null
        },
        'State 3': {
          param_changes: [],
          content: {
            content_id: 'content',
            html: 'Congratulations, you have finished!'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {}
            }
          },
          interaction: {
            id: 'EndExploration',
            default_outcome: null,
            confirmed_unclassified_answers: [],
            customization_args: {
              recommendedExplorationIds: {
                value: []
              }
            },
            solution: null,
            answer_groups: [],
            hints: []
          },
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              content: {}
            }
          },
          classifier_model_id: null
        },
        Introduction: {
          classifier_model_id: null,
          param_changes: [],
          content: {
            content_id: 'content',
            html: 'Multiple Choice'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {},
              feedback_2: {}
            }
          },
          interaction: {
            id: 'MultipleChoiceInput',
            default_outcome: {
              dest: 'Introduction',
              feedback: {
                content_id: 'default_outcome',
                html: 'Try Again!'
              }
            },
            confirmed_unclassified_answers: [],
            customization_args: {
              choices: {
                value: [
                  '<p> Go to ItemSelection <oppia-noninteractive-image' +
                  ' filepath-with-value="&amp;quot;' +
                  'sIMChoice1_height_32_width_42.png&amp;' +
                  'quot;"></oppia-noninteractive-image></p>',
                  '<p> Go to ImageAndRegion<oppia-noninteractive-image' +
                  ' filepath-with-value="&amp;quot;' +
                  'sIMChoice2_height_30_width_40.png&amp;' +
                  'quot;"></oppia-noninteractive-image></p>'
                ]
              }
            },
            answer_groups: [
              {
                labelled_as_correct: false,
                outcome: {
                  dest: 'State 6',
                  feedback: {
                    content_id: 'feedback_1',
                    html: '<p>We are going to ItemSelection' +
                          '<oppia-noninteractive-image filepath-with-value=' +
                          '"&amp;quot;sIOFeedback_height_50_width_50.png' +
                          '&amp;quot;"></oppia-noninteractive-image></p>'
                  },
                  param_changes: [],
                  refresher_exploration_id: null,
                  missing_prerequisite_skill_id: null
                },
                rule_specs: [
                  {
                    inputs: {
                      x: 0
                    },
                    rule_type: 'Equals'
                  }
                ]
              },
              {
                labelled_as_correct: false,
                outcome: {
                  dest: 'State 1',
                  feedback: {
                    content_id: 'feedback_2',
                    html: "Let's go to state 1 ImageAndRegion"
                  },
                  param_changes: [],
                  refresher_exploration_id: null,
                  missing_prerequisite_skill_id: null
                },
                rule_specs: [
                  {
                    inputs: {
                      x: 1
                    },
                    rule_type: 'Equals'
                  }
                ]
              }
            ],
            hints: [],
            solution: null
          },
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {},
              feedback_2: {}
            }
          }
        },
        'State 6': {
          param_changes: [],
          content: {
            content_id: 'content',
            html: '<p>Text Input Content</p>'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {},
              feedback_2: {},
              hint_1: {}
            }
          },
          interaction: {
            id: 'TextInput',
            default_outcome: {
              dest: 'State 6',
              feedback: {
                content_id: 'default_outcome',
                html: ''
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null
            },
            confirmed_unclassified_answers: [],
            customization_args: {
              rows: {
                value: 1
              },
              placeholder: {
                value: ''
              }
            },
            answer_groups: [{
              rule_specs: [{
                inputs: {
                  x: '1'
                },
                rule_type: 'Contains'
              }],
              outcome: {
                dest: 'State 1',
                feedback: {
                  content_id: 'feedback_1',
                  html: "<p>Let's go to State 1</p>"
                },
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null,
                missing_prerequisite_skill_id: null
              }
            }, {
              rule_specs: [{
                inputs: {
                  x: '2'
                },
                rule_type: 'Contains'
              }],
              outcome: {
                dest: 'State 1',
                feedback: {
                  content_id: 'feedback_2',
                  html: "<p>Let's go to State 1</p>"
                },
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null,
                missing_prerequisite_skill_id: null
              }
            }],
            hints: [{
              hint_content: {
                content_id: 'hint_1',
                html: '<p><oppia-noninteractive-image filepath-with-value="' +
                      '&amp;quot;s6Hint1_height_60_width_60.png&amp;quot;">' +
                      '</oppia-noninteractive-image></p>'
              }
            }],
            solution: null,
          },
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {},
              feedback_2: {},
              hint_1: {}
            }
          },
          classifier_model_id: null
        }
      },
      param_specs: {},
      param_changes: [],
      version: 1
    };

    requestUrl1 = UrlInterpolationService.interpolateUrl(
      '/assetsdevhandler/<exploration_id>/assets/image/<filename>', {
        exploration_id: '1',
        filename: 'sIMChoice1_height_32_width_42.png'
      });
    requestUrl2 = UrlInterpolationService.interpolateUrl(
      '/assetsdevhandler/<exploration_id>/assets/image/<filename>', {
        exploration_id: '1',
        filename: 'sIMChoice2_height_30_width_40.png'
      });
    requestUrl3 = UrlInterpolationService.interpolateUrl(
      '/assetsdevhandler/<exploration_id>/assets/image/<filename>', {
        exploration_id: '1',
        filename: 'sIOFeedback_height_50_width_50.png'
      });
    requestUrl4 = UrlInterpolationService.interpolateUrl(
      '/assetsdevhandler/<exploration_id>/assets/image/<filename>', {
        exploration_id: '1',
        filename: 's6Hint1_height_60_width_60.png'
      });

    var exploration = eof.createFromBackendDict(explorationDict);
    ips.init(exploration);
    ips.kickOffImagePreloader(exploration.getInitialState().name);
  }));

  it('should maintain the correct number of download requests in queue',
    function() {
      $httpBackend.expect('GET', requestUrl1).respond(201, 'image data 1');
      $httpBackend.expect('GET', requestUrl2).respond(201, 'image data 2');
      $httpBackend.expect('GET', requestUrl3).respond(201, 'image data 3');
      $httpBackend.expect('GET', requestUrl4).respond(201, 'image data 4');
      expect(ips.getFilenamesOfImageCurrentlyDownloading().length).toBe(3);
      expect(ips.isLoadingImageFile(
        'sIMChoice1_height_32_width_42.png')).toBe(true);
      expect(ips.isLoadingImageFile(
        'sIMChoice2_height_30_width_40.png')).toBe(true);
      expect(ips.isLoadingImageFile(
        'sIOFeedback_height_50_width_50.png')).toBe(true);
      expect(ips.isLoadingImageFile(
        's6Hint1_height_60_width_60.png')).toBe(false);
      $httpBackend.flush(1);
      expect(ips.getFilenamesOfImageCurrentlyDownloading().length).toBe(3);
      $httpBackend.flush(1);
      expect(ips.getFilenamesOfImageCurrentlyDownloading().length).toBe(2);
      $httpBackend.flush(1);
      expect(ips.getFilenamesOfImageCurrentlyDownloading().length).toBe(1);
      $httpBackend.flush(1);
      expect(ips.getFilenamesOfImageCurrentlyDownloading().length).toBe(0);
      expect(ips.isLoadingImageFile(
        'sIMChoice1_height_32_width_42.png')).toBe(false);
      expect(ips.isLoadingImageFile(
        'sIMChoice2_height_30_width_40.png')).toBe(false);
      expect(ips.isLoadingImageFile(
        'sIOFeedback_height_50_width_50.png')).toBe(false);
      expect(ips.isLoadingImageFile(
        's6Hint1_height_60_width_60.png')).toBe(false);
    });

  it('should properly restart pre-loading from a new state', function() {
    expect(ips.getFilenamesOfImageCurrentlyDownloading().length).toBe(3);
    ips.restartImagePreloader('State 6');
    expect(ips.getFilenamesOfImageCurrentlyDownloading().length).toBe(1);
    expect(ips.isLoadingImageFile(
      's6Hint1_height_60_width_60.png')).toBe(true);
  });

  it('should verify that preloader starts when state changes', function() {
    expect(ips.getFilenamesOfImageCurrentlyDownloading().length).toBe(3);
    expect(ips.isLoadingImageFile(
      's6Hint1_height_60_width_60.png')).toBe(false);
    ips.onStateChange('State 6');
    expect(ips.getFilenamesOfImageCurrentlyDownloading().length).toBe(1);
    expect(ips.isLoadingImageFile(
      's6Hint1_height_60_width_60.png')).toBe(true);
  });

  it('should check that there is sync between AssetsBackendApi Service and' +
    'ImagePreloader Service', function() {
    var filenamesOfImageCurrentlyDownloading = (
      ips.getFilenamesOfImageCurrentlyDownloading());
    var imageFilesCurrentlyBeingRequested = (
      abas.getAssetsFilesCurrentlyBeingRequested().image
    );
    $httpBackend.expect('GET', requestUrl1).respond(201, 'image data 1');
    for (var x in filenamesOfImageCurrentlyDownloading) {
      expect(filenamesOfImageCurrentlyDownloading[x]).toBe(
        imageFilesCurrentlyBeingRequested[x].filename);
    }
  });

  it('should maintain the filenames of image which failed to download',
    function() {
      $httpBackend.expect('GET', requestUrl1).respond(201, 'image data 1');
      $httpBackend.expect('GET', requestUrl2).respond(201, 'image data 2');
      $httpBackend.expect('GET', requestUrl3).respond(404);
      $httpBackend.expect('GET', requestUrl4).respond(408);
      expect(ips.getFilenamesOfImageCurrentlyDownloading().length).toBe(3);
      $httpBackend.flush(3);
      expect(ips.isInFailedDownload(
        'sIOFeedback_height_50_width_50.png')).toBe(true);
      expect(ips.getFilenamesOfImageCurrentlyDownloading().length).toBe(1);
      $httpBackend.flush(1);
      expect(ips.isInFailedDownload(
        's6Hint1_height_60_width_60.png')).toBe(true);
      ips.restartImagePreloader('State 6');
      expect(ips.isInFailedDownload(
        's6Hint1_height_60_width_60.png')).toBe(false);
    });

  it('should calculate the dimensions of the image file', function() {
    var dimensions1 = ips.getDimensionsOfImage(
      'sIOFeedback_height_50_width_50.png');
    expect(dimensions1.width).toBe(50);
    expect(dimensions1.height).toBe(50);
    var dimensions2 = ips.getDimensionsOfImage(
      'sIOFeedback_height_30_width_45_height_56_width_56.png');
    expect(dimensions2.width).toBe(56);
    expect(dimensions2.height).toBe(56);
    expect(function() {
      ips.getDimensionsOfImage(
        's6Hint1_height_width_60.png');
    }).toThrowError(
      /it does not contain dimensions/);
    expect(function() {
      ips.getDimensionsOfImage(
        'sol_height_ds_width_60.png');
    }).toThrowError(
      /it does not contain dimensions/);
  });
});
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
 * @fileoverview Unit tests for the learner parameters service.
 */

require('domain/classifier/AnswerClassificationResultObjectFactory.ts');
require('domain/exploration/ExplorationObjectFactory.ts');
require('domain/exploration/SolutionObjectFactory.ts');
require('domain/utilities/UrlInterpolationService.ts');
require('pages/exploration-player-page/services/image-preloader.service.ts');
require('pages/exploration-player-page/services/learner-params.service.ts');

describe('Learner parameters service', function() {
  beforeEach(angular.mock.module('oppia'));

  describe('learner params service', function() {
    var LearnerParamsService = null;

    beforeEach(angular.mock.inject(function($injector) {
      LearnerParamsService = $injector.get('LearnerParamsService');
    }));

    it('should correctly initialize parameters', function() {
      expect(LearnerParamsService.getAllParams()).toEqual({});
      LearnerParamsService.init({
        a: 'b'
      });
      expect(LearnerParamsService.getAllParams()).toEqual({
        a: 'b'
      });
    });

    it('should correctly get and set parameters', function() {
      LearnerParamsService.init({
        a: 'b'
      });
      expect(LearnerParamsService.getValue('a')).toEqual('b');
      LearnerParamsService.setValue('a', 'c');
      expect(LearnerParamsService.getValue('a')).toEqual('c');
    });

    it('should not get an invalid parameter', function() {
      LearnerParamsService.init({
        a: 'b'
      });
      expect(function() {
        LearnerParamsService.getValue('b');
      }).toThrow('Invalid parameter name: b');
    });

    it('should not set an invalid parameter', function() {
      LearnerParamsService.init({
        a: 'b'
      });
      expect(function() {
        LearnerParamsService.setValue('b', 'c');
      }).toThrow('Cannot set unknown parameter: b');
    });
  });
});
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
 * @fileoverview Unit tests for the number attempts service.
 */

require('pages/exploration-player-page/services/number-attempts.service.ts');

describe('Number attempts service', function() {
  beforeEach(angular.mock.module('oppia'));

  var NumberAttemptsService = null;
  beforeEach(angular.mock.inject(function($injector) {
    NumberAttemptsService = $injector.get('NumberAttemptsService');
  }));

  it('should increment number of attempts correctly', function() {
    NumberAttemptsService.reset();
    expect(NumberAttemptsService.getNumberAttempts()).toEqual(0);
    NumberAttemptsService.submitAttempt();
    expect(NumberAttemptsService.getNumberAttempts()).toEqual(1);
  });

  it('should properly reset the number of attempts to zero', function() {
    NumberAttemptsService.submitAttempt();
    NumberAttemptsService.reset();
    expect(NumberAttemptsService.getNumberAttempts()).toEqual(0);
  });
});
// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the player position service.
 */

require('domain/state_card/StateCardObjectFactory.ts');
require('pages/exploration-player-page/services/player-position.service.ts');
require('pages/exploration-player-page/services/player-transcript.service.ts');

describe('Player position service', function() {
  beforeEach(angular.mock.module('oppia'));

  var pts = null;
  var pps = null;
  var scof = null;
  beforeEach(angular.mock.inject(function($injector) {
    pts = $injector.get('PlayerTranscriptService');
    pps = $injector.get('PlayerPositionService');
    scof = $injector.get('StateCardObjectFactory');
  }));

  it('should record answer submission as true', function() {
    expect(pps.hasLearnerJustSubmittedAnAnswer()).toBe(false);
    pps.recordAnswerSubmission();
    expect(pps.hasLearnerJustSubmittedAnAnswer()).toBe(true);
  });

  it('should record answer submission by the learner as false', function() {
    expect(pps.hasLearnerJustSubmittedAnAnswer()).toBe(false);
    pps.recordAnswerSubmission();
    expect(pps.hasLearnerJustSubmittedAnAnswer()).toBe(true);
    pps.recordNavigationButtonClick();
    expect(pps.hasLearnerJustSubmittedAnAnswer()).toBe(false);
  });

  it('should set displayed index card to given value', function() {
    var callBack = function() {};
    expect(pps.getDisplayedCardIndex()).toBe(null);
    pps.init(callBack);
    pps.setDisplayedCardIndex(4);
    expect(pps.getDisplayedCardIndex()).toBe(4);
  });

  it('should get current state name', function() {
    pts.addNewCard(scof.createNewCard(
      'First state', 'Content HTML',
      '<oppia-text-input-html></oppia-text-input-html>'));
    pts.addNewCard(scof.createNewCard(
      'Second state', 'Content HTML',
      '<oppia-text-input-html></oppia-text-input-html>'));
    var callBack = function() {};
    pps.init(callBack);
    pps.setDisplayedCardIndex(0);
    expect(pps.getCurrentStateName()).toBe('First state');
    pps.setDisplayedCardIndex(1);
    expect(pps.getCurrentStateName()).toBe('Second state');
  });

  it('should not change displayed card index if it is the same as the' +
     'previously displayed card index', function() {
    var callBack = function() {};
    expect(pps.getDisplayedCardIndex()).toBe(null);
    pps.init(callBack);
    pps.setDisplayedCardIndex(4);
    pps.setDisplayedCardIndex(4);
    expect(pps.getDisplayedCardIndex()).toBe(4);
    pps.setDisplayedCardIndex(5);
    expect(pps.getDisplayedCardIndex()).toBe(5);
  });
});
// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the player transcript service.
 */

require('domain/state_card/StateCardObjectFactory.ts');
require('pages/exploration-player-page/services/player-transcript.service.ts');

describe('Player transcript service', function() {
  beforeEach(angular.mock.module('oppia'));

  var pts;
  var scof;
  beforeEach(angular.mock.inject(function($injector) {
    pts = $injector.get('PlayerTranscriptService');
    scof = $injector.get('StateCardObjectFactory');
  }));

  it('should reset the transcript correctly', function() {
    pts.addNewCard(scof.createNewCard(
      'First state', 'Content HTML',
      '<oppia-text-input-html></oppia-text-input-html>'));
    pts.addNewCard(scof.createNewCard(
      'Second state', 'Content HTML',
      '<oppia-text-input-html></oppia-text-input-html>'));

    expect(pts.getNumCards()).toBe(2);

    pts.init();
    expect(pts.getNumCards()).toBe(0);
    pts.addNewCard(scof.createNewCard(
      'Third state', 'Content HTML',
      '<oppia-text-input-html></oppia-text-input-html>'));
    expect(pts.getCard(0).getStateName()).toBe('Third state');
  });

  it(
    'should correctly check whether a state have been encountered before',
    function() {
      pts.addNewCard(scof.createNewCard(
        'First state', 'Content HTML',
        '<oppia-text-input-html></oppia-text-input-html>'));
      pts.addNewCard(scof.createNewCard(
        'Second state', 'Content HTML',
        '<oppia-text-input-html></oppia-text-input-html>'));
      pts.addNewCard(scof.createNewCard(
        'First state', 'Content HTML',
        '<oppia-text-input-html></oppia-text-input-html>'));
      expect(pts.hasEncounteredStateBefore('First state')).toEqual(true);
      expect(pts.hasEncounteredStateBefore('Third state')).toEqual(false);
    });

  it('should add a new card correctly', function() {
    pts.addNewCard(scof.createNewCard(
      'First state', 'Content HTML',
      '<oppia-text-input-html></oppia-text-input-html>'));

    var firstCard = pts.getCard(0);
    expect(firstCard.getStateName()).toEqual('First state');
    expect(firstCard.getContentHtml()).toEqual('Content HTML');
    expect(firstCard.getInteractionHtml()).toEqual(
      '<oppia-text-input-html></oppia-text-input-html>');
  });

  it('should add a previous card correctly', function() {
    pts.addNewCard(scof.createNewCard(
      'First state', 'Content HTML',
      '<oppia-text-input-html></oppia-text-input-html>'));
    pts.addNewCard(scof.createNewCard(
      'Second state', 'Content HTML',
      '<oppia-text-input-html></oppia-text-input-html>'));
    pts.addPreviousCard();

    expect(pts.getNumCards()).toEqual(3);
    expect(pts.getCard([0]).getStateName()).toEqual('First state');
    expect(pts.getCard([1]).getStateName()).toEqual('Second state');
    expect(pts.getCard([2]).getStateName()).toEqual('First state');
  });

  it('should set lastAnswer correctly', function() {
    pts.addNewCard(scof.createNewCard(
      'First state', 'Content HTML',
      '<oppia-text-input-html></oppia-text-input-html>'));
    var lastAnswer = pts.getLastAnswerOnDisplayedCard(0);
    expect(lastAnswer).toEqual(null);

    pts.addNewInput('first answer', false);
    pts.addNewCard(scof.createNewCard(
      'Second state', 'Content HTML',
      '<oppia-text-input-html></oppia-text-input-html>'));
    lastAnswer = pts.getLastAnswerOnDisplayedCard(0);
    expect(lastAnswer).toEqual('first answer');

    pts.addNewCard(scof.createNewCard(
      'Third state', 'Content HTML',
      '<oppia-text-input-html></oppia-text-input-html>'));
    // lastAnswer should be null as no answers were provided in the second
    // state.
    lastAnswer = pts.getLastAnswerOnDisplayedCard(1);
    expect(lastAnswer).toEqual(null);
  });

  it('should record answer/feedback pairs in the correct order', function() {
    pts.addNewCard(scof.createNewCard(
      'First state', 'Content HTML',
      '<oppia-text-input-html></oppia-text-input-html>'));
    pts.addNewInput('first answer', false);
    expect(function() {
      pts.addNewInput('invalid answer');
    }).toThrow(
      new Error(
        'Trying to add an input before the response for the previous ' +
        'input has been received.'));

    pts.addNewResponse('feedback');
    pts.addNewInput('second answer', true);

    var firstCard = pts.getCard(0);
    expect(firstCard.getInputResponsePairs()).toEqual([{
      learnerInput: 'first answer',
      oppiaResponse: 'feedback',
      isHint: false
    }, {
      learnerInput: 'second answer',
      oppiaResponse: null,
      isHint: true
    }]);
    expect(pts.getNumSubmitsForLastCard()).toBe(1);
  });

  it('should retrieve the last card of the transcript correctly', function() {
    pts.addNewCard(scof.createNewCard(
      'First state', 'Content HTML',
      '<oppia-text-input-html></oppia-text-input-html>'));
    pts.addNewCard(scof.createNewCard(
      'Second state', 'Content HTML',
      '<oppia-text-input-html></oppia-text-input-html>'));
    expect(pts.getNumCards()).toBe(2);
    expect(pts.getLastCard().getStateName()).toBe('Second state');
    expect(pts.isLastCard(0)).toBe(false);
    expect(pts.isLastCard(1)).toBe(true);
    expect(pts.isLastCard(2)).toBe(false);
    expect(pts.getLastStateName()).toBe('Second state');

    expect(pts.getNumSubmitsForLastCard()).toBe(0);
    pts.addNewInput('first answer', false);
    expect(pts.getNumSubmitsForLastCard()).toBe(1);
    pts.addNewResponse('first feedback');
    expect(pts.getNumSubmitsForLastCard()).toBe(1);
    pts.addNewInput('second answer', false);
    expect(pts.getNumSubmitsForLastCard()).toBe(2);
  });
});
// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the prediction algorithm registry service.
 */

require(
  'pages/exploration-player-page/services/' +
  'prediction-algorithm-registry.service.ts');

describe('Prediction algorithm registry service', function() {
  beforeEach(angular.mock.module('oppia'));

  describe('Test prediction algorithm registry functions', function() {
    var registryService, predictionService;

    beforeEach(function() {
      angular.mock.module(function($provide) {
        $provide.factory('PredictionSampleService', [function() {
          return {
            predict: function(classifierData, answer) {
              return 1;
            }
          };
        }]);
      });
    });

    beforeEach(angular.mock.inject(function($injector) {
      registryService = $injector.get('PredictionAlgorithmRegistryService');
      predictionService = $injector.get('PredictionSampleService');

      registryService.setMapping({
        TestClassifier: {
          v1: 'PredictionSampleService'
        }
      });
    }));

    it('should return correct prediction algorithm service.', function() {
      var algorithmId = 'TestClassifier';
      var dataSchemaVersion = 1;
      var generatedPredictionService = registryService.getPredictionService(
        algorithmId, dataSchemaVersion);

      expect(generatedPredictionService.toString()).toEqual(
        predictionService.toString());
    });
  });
});
// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the State classifier mapping service.
 */

require(
  'pages/exploration-player-page/services/state-classifier-mapping.service.ts');

describe('State classifier mapping service', function() {
  beforeEach(angular.mock.module('oppia'));

  describe('Test correct retrieval of classifier details', function() {
    var mappingService;
    beforeEach(angular.mock.inject(function($injector) {
      mappingService = $injector.get('StateClassifierMappingService');

      mappingService.init({
        stateName1: {
          algorithm_id: 'TestClassifier',
          classifier_data: {},
          data_schema_version: 1
        }
      });
    }));

    it('should return correct classifier details.', function() {
      var stateName = 'stateName1';
      var retrievedClassifier = mappingService.getClassifier(stateName);

      expect(retrievedClassifier.algorithmId).toEqual('TestClassifier');
      expect(retrievedClassifier.classifierData).toEqual({});
      expect(retrievedClassifier.dataSchemaVersion).toEqual(1);
    });
  });
});
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
 * @fileoverview Unit tests for the controller of the library page.
 */

require('pages/library-page/library-page.directive.ts');

describe('Library controller', function() {
  beforeEach(angular.mock.module('oppia'));

  describe('Library', function() {
    var scope, ctrl, $httpBackend;
    var $componentController;

    beforeEach(function() {
      angular.mock.module('ui.bootstrap');
    });

    beforeEach(
      angular.mock.module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

    beforeEach(angular.mock.inject(function(
        _$componentController_, _$httpBackend_) {
      $componentController = _$componentController_;
      $httpBackend = _$httpBackend_;
      $httpBackend.expectGET('/searchhandler/data').respond({
        allow_yaml_file_upload: false,
        explorations_list: [{
          id: '3',
          title: 'Geography 2',
          category: 'Geography',
          objective: 'can view more maps',
          language: 'español',
          last_updated: 12345678912345,
          community_owned: false,
          status: 'featured'
        }, {
          id: '5',
          title: 'Landmarks',
          category: 'Geography',
          objective: 'can view maps',
          language: 'English',
          last_updated: 12345678911111,
          community_owned: false,
          status: 'public'
        }, {
          id: '6',
          title: 'My Exploration',
          category: 'Personal',
          objective: 'can be for myself',
          language: 'English',
          last_updated: 12345678954322,
          community_owned: false,
          status: 'public'
        }],
        preferred_language_codes: ['en']
      });

      ctrl = $componentController('libraryPage', {
        AlertsService: null,
        DateTimeFormatService: null
      }, {});
    }));

    it('should show correct explorations', function() {
      // TODO(sll): Write tests for the library pages.
    });
  });
});
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
 * @fileoverview Unit tests for the Preferences page.
 */

require('pages/preferences-page/preferences-page.controller.ts');

describe('Preferences Controller', function() {
  describe('PreferencesCtrl', function() {
    var ctrl, $httpBackend, mockAlertsService, SUPPORTED_AUDIO_LANGUAGES;
    var $componentController;

    beforeEach(function() {
      angular.mock.module('oppia');
    });

    beforeEach(
      angular.mock.module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

    beforeEach(angular.mock.inject(function(
        _$componentController_, $http, _$httpBackend_, $rootScope) {
      $componentController = _$componentController_;
      $httpBackend = _$httpBackend_;
      $httpBackend.expectGET('/preferenceshandler/data').respond({
        can_receive_email_updates: false,
        can_receive_editor_role_email: true,
        can_receive_feedback_message_email: true
      });

      mockAlertsService = {};

      ctrl = $componentController('preferencesPage', null, {
        $http: $http,
        $rootScope: $rootScope,
        AlertsService: mockAlertsService
      });
    }));

    it('should show that editor role notifications checkbox is true by default',
      function() {
        $httpBackend.flush();
        expect(ctrl.canReceiveEditorRoleEmail).toBe(true);
      });

    it('should show that feedback message notifications checkbox is true' +
      'by default',
    function() {
      $httpBackend.flush();
      expect(ctrl.canReceiveFeedbackMessageEmail).toBe(true);
    });

    it('should map SUPPORTED_AUDIO_LANGUAGES correctly to ' +
       'AUDIO_LANGUAGE_CHOICES to support select2 plugin',
    function() {
      var numberOfAudioLanguageChoices = ctrl.AUDIO_LANGUAGE_CHOICES.length;
      expect(numberOfAudioLanguageChoices > 0).toBe(true);
      for (var index = 0; index < numberOfAudioLanguageChoices; index++) {
        expect(Object.keys(ctrl.AUDIO_LANGUAGE_CHOICES[index])).toEqual(
          ['id', 'text']);
      }
    });
  });
});
// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the review tests.
 */
require('pages/review-test-page/review-test-engine.service.ts');

describe('Review test engine service', function() {
  beforeEach(angular.mock.module('oppia'));
  var ReviewTestEngineService = null;

  beforeEach(angular.mock.inject(function($injector) {
    ReviewTestEngineService = $injector.get('ReviewTestEngineService');
  }));

  it('should return the correct count of review test questions', function() {
    expect(ReviewTestEngineService.getReviewTestQuestionCount(-2)).toEqual(0);
    expect(ReviewTestEngineService.getReviewTestQuestionCount(0)).toEqual(0);
    expect(ReviewTestEngineService.getReviewTestQuestionCount(3)).toEqual(9);
    expect(ReviewTestEngineService.getReviewTestQuestionCount(8)).toEqual(16);
    expect(ReviewTestEngineService.getReviewTestQuestionCount(12)).toEqual(12);
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for SkillEditorStateService.js
 */

require('domain/skill/SkillObjectFactory.ts');
require('domain/skill/SkillRightsObjectFactory.ts');
require('domain/skill/SkillUpdateService.ts');
require('pages/skill-editor-page/services/skill-editor-state.service.ts');

describe('Skill editor state service', function() {
  var SkillEditorStateService, $q, $rootScope,
    SkillObjectFactory, SkillUpdateService,
    SkillRightsObjectFactory;
  var fakeEditableSkillBackendApiService = null;
  var fakeSkillRightsBackendApiService = null;
  var skillRightsObject = null;

  var FakeEditableSkillBackendApiService = function() {
    var self = {
      newBackendSkillObject: null,
      failure: null,
      fetchSkill: null,
      updateSkill: null
    };

    var _fetchOrUpdateSkill = function() {
      return $q(function(resolve, reject) {
        if (!self.failure) {
          resolve(self.newBackendSkillObject);
        } else {
          reject();
        }
      });
    };

    self.newBackendSkillObject = {};
    self.failure = null;
    self.fetchSkill = _fetchOrUpdateSkill;
    self.updateSkill = _fetchOrUpdateSkill;

    return self;
  };

  var FakeSkillRightsBackendApiService = function() {
    var self = {
      backendSkillRightsObject: null,
      failure: null,
      fetchSkillRights: null
    };

    var _fetchSkillRights = function() {
      return $q(function(resolve, reject) {
        if (!self.failure) {
          resolve(self.backendSkillRightsObject);
        } else {
          reject();
        }
      });
    };

    self.backendSkillRightsObject = {};
    self.failure = null;
    self.fetchSkillRights = _fetchSkillRights;

    return self;
  };

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    fakeEditableSkillBackendApiService = (
      FakeEditableSkillBackendApiService());
    $provide.value(
      'EditableSkillBackendApiService',
      [fakeEditableSkillBackendApiService][0]);

    fakeSkillRightsBackendApiService = (
      FakeSkillRightsBackendApiService());
    $provide.value(
      'SkillRightsBackendApiService',
      [fakeSkillRightsBackendApiService][0]);
  }));

  beforeEach(angular.mock.inject(function($injector) {
    SkillEditorStateService = $injector.get(
      'SkillEditorStateService');
    SkillObjectFactory = $injector.get('SkillObjectFactory');
    SkillRightsObjectFactory = $injector.get('SkillRightsObjectFactory');
    SkillUpdateService = $injector.get('SkillUpdateService');
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');

    var misconceptionDict1 = {
      id: '2',
      name: 'test name',
      notes: 'test notes',
      feedback: 'test feedback'
    };

    var misconceptionDict2 = {
      id: '4',
      name: 'test name',
      notes: 'test notes',
      feedback: 'test feedback'
    };


    var skillContentsDict = {
      explanation: {
        html: 'test explanation',
        content_id: 'explanation',
      },
      worked_examples: [
        {
          html: 'worked example 1',
          content_id: 'worked_example_1'
        },
        {
          html: 'worked example 2',
          content_id: 'worked_example_2'
        }
      ],
      content_ids_to_audio_translations: {
        explanation: {},
        worked_example_1: {},
        worked_example_2: {}
      }
    };

    var skillDict = {
      id: '1',
      description: 'test description',
      misconceptions: [misconceptionDict1, misconceptionDict2],
      skill_contents: skillContentsDict,
      language_code: 'en',
      version: 3
    };

    skillRightsObject = {
      skill_id: '1',
      creator_id: '0',
      skill_is_private: true,
      can_edit_skill_description: true
    };
    fakeSkillRightsBackendApiService.backendSkillRightsObject = (
      skillRightsObject);

    fakeEditableSkillBackendApiService.newBackendSkillObject = skillDict;
  }));

  it('should request to load the skill from the backend', function() {
    spyOn(fakeEditableSkillBackendApiService, 'fetchSkill').and.callThrough();
    SkillEditorStateService.loadSkill('1');
    expect(fakeEditableSkillBackendApiService.fetchSkill)
      .toHaveBeenCalled();
  });

  it('should track whether it is currently loading the skill', function() {
    expect(SkillEditorStateService.isLoadingSkill()).toBe(false);
    SkillEditorStateService.loadSkill('1');
    expect(SkillEditorStateService.isLoadingSkill()).toBe(true);
    $rootScope.$apply();
    expect(SkillEditorStateService.isLoadingSkill()).toBe(false);
  });

  it('should indicate a collection is no longer loading after an error',
    function() {
      expect(SkillEditorStateService.isLoadingSkill()).toBe(false);
      fakeEditableSkillBackendApiService.failure = 'Internal 500 error';
      SkillEditorStateService.loadSkill('1');
      expect(SkillEditorStateService.isLoadingSkill()).toBe(true);
      $rootScope.$apply();
      expect(SkillEditorStateService.isLoadingSkill()).toBe(false);
    });

  it('should report that a skill has loaded through loadSkill()', function() {
    expect(SkillEditorStateService.hasLoadedSkill()).toBe(false);
    var newSkill = SkillEditorStateService.loadSkill('1');
    expect(SkillEditorStateService.hasLoadedSkill()).toBe(false);
    $rootScope.$apply();
    expect(SkillEditorStateService.hasLoadedSkill()).toBe(true);
  });

  it('should return the last skill loaded as the same object', function() {
    var previousSkill = SkillEditorStateService.getSkill();
    var expectedSkill = SkillObjectFactory.createFromBackendDict(
      fakeEditableSkillBackendApiService.newBackendSkillObject);
    expect(previousSkill).not.toEqual(expectedSkill);
    SkillEditorStateService.loadSkill('1');
    $rootScope.$apply();
    var actualSkill = SkillEditorStateService.getSkill();
    expect(actualSkill).toEqual(expectedSkill);
    expect(actualSkill).toBe(previousSkill);
    expect(actualSkill).not.toBe(expectedSkill);
  });

  it('should fail to load a skill without first loading one',
    function() {
      expect(function() {
        SkillEditorStateService.saveSkill('commit message');
      }).toThrow();
    });

  it('should not save the skill if there are no pending changes',
    function() {
      SkillEditorStateService.loadSkill('1');
      $rootScope.$apply();
      expect(SkillEditorStateService.saveSkill(
        'commit message')).toBe(false);
    });

  it('should be able to save the collection and pending changes',
    function() {
      spyOn(fakeEditableSkillBackendApiService,
        'updateSkill').and.callThrough();

      SkillEditorStateService.loadSkill('1');
      SkillUpdateService.setSkillDescription(
        SkillEditorStateService.getSkill(), 'new description');
      $rootScope.$apply();

      expect(SkillEditorStateService.saveSkill(
        'commit message')).toBe(true);
      $rootScope.$apply();

      var expectedId = '1';
      var expectedVersion = 3;
      var expectedCommitMessage = 'commit message';
      var updateSkillSpy = (
        fakeEditableSkillBackendApiService.updateSkill);
      expect(updateSkillSpy).toHaveBeenCalledWith(
        expectedId, expectedVersion, expectedCommitMessage,
        jasmine.any(Object));
    });

  it('should track whether it is currently saving the skill',
    function() {
      SkillEditorStateService.loadSkill('1');
      SkillUpdateService.setSkillDescription(
        SkillEditorStateService.getSkill(), 'new description');
      $rootScope.$apply();

      expect(SkillEditorStateService.isSavingSkill()).toBe(false);
      SkillEditorStateService.saveSkill('commit message');
      expect(SkillEditorStateService.isSavingSkill()).toBe(true);

      $rootScope.$apply();
      expect(SkillEditorStateService.isSavingSkill()).toBe(false);
    });

  it('should indicate a skill is no longer saving after an error',
    function() {
      SkillEditorStateService.loadSkill('1');
      SkillUpdateService.setSkillDescription(
        SkillEditorStateService.getSkill(), 'new description');
      $rootScope.$apply();

      expect(SkillEditorStateService.isSavingSkill()).toBe(false);
      fakeEditableSkillBackendApiService.failure = 'Internal 500 error';

      SkillEditorStateService.saveSkill('commit message');
      expect(SkillEditorStateService.isSavingSkill()).toBe(true);

      $rootScope.$apply();
      expect(SkillEditorStateService.isSavingSkill()).toBe(false);
    });

  it('should request to load the skill rights from the backend',
    function() {
      spyOn(fakeSkillRightsBackendApiService, 'fetchSkillRights')
        .and.callThrough();

      SkillEditorStateService.loadSkill('1');
      expect(fakeSkillRightsBackendApiService.fetchSkillRights)
        .toHaveBeenCalled();
    });

  it('should initially return an interstitial skill rights object', function() {
    var skillRights = SkillEditorStateService.getSkillRights();
    expect(skillRights.getSkillId()).toEqual(null);
    expect(skillRights.getCreatorId()).toEqual(null);
    expect(skillRights.isPrivate()).toEqual(true);
    expect(skillRights.canEditSkillDescription()).toEqual(false);
  });

  it('should be able to set a new skill rights with an in-place copy',
    function() {
      var previousSkillRights = SkillEditorStateService.getSkillRights();
      var expectedSkillRights = SkillRightsObjectFactory.createFromBackendDict(
        skillRightsObject);
      expect(previousSkillRights).not.toEqual(expectedSkillRights);

      SkillEditorStateService.setSkillRights(expectedSkillRights);

      var actualSkillRights = SkillEditorStateService.getSkillRights();
      expect(actualSkillRights).toEqual(expectedSkillRights);

      expect(actualSkillRights).toBe(previousSkillRights);
      expect(actualSkillRights).not.toBe(expectedSkillRights);
    }
  );
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for StoryEditorStateService.
 */

require('domain/story/StoryObjectFactory.ts');
require('domain/story/StoryUpdateService.ts');
require('pages/story-editor-page/services/story-editor-state.service.ts');

describe('Story editor state service', function() {
  var StoryEditorStateService = null;
  var StoryObjectFactory = null;
  var StoryUpdateService = null;
  var fakeEditableStoryBackendApiService = null;
  var secondBackendStoryObject = null;
  var $rootScope = null;
  var $scope = null;
  var $q = null;

  var FakeEditableStoryBackendApiService = function() {
    var self = {
      newBackendStoryObject: null,
      failure: null,
      fetchStory: null,
      updateStory: null
    };

    var _fetchStory = function() {
      return $q(function(resolve, reject) {
        if (!self.failure) {
          resolve({
            story: self.newBackendStoryObject,
            topicName: 'Topic Name'
          });
        } else {
          reject();
        }
      });
    };

    var _updateStory = function() {
      return $q(function(resolve, reject) {
        if (!self.failure) {
          resolve(self.newBackendStoryObject);
        } else {
          reject();
        }
      });
    };

    self.newBackendStoryObject = {};
    self.failure = null;
    self.fetchStory = _fetchStory;
    self.updateStory = _updateStory;
    return self;
  };

  beforeEach(angular.mock.module('oppia'));
  beforeEach(
    angular.mock.module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));
  beforeEach(angular.mock.module('oppia', function($provide) {
    fakeEditableStoryBackendApiService = (
      FakeEditableStoryBackendApiService());
    $provide.value(
      'EditableStoryBackendApiService',
      [fakeEditableStoryBackendApiService][0]);
  }));

  beforeEach(angular.mock.inject(function($injector) {
    StoryEditorStateService = $injector.get(
      'StoryEditorStateService');
    StoryObjectFactory = $injector.get('StoryObjectFactory');
    StoryUpdateService = $injector.get('StoryUpdateService');
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();

    fakeEditableStoryBackendApiService.newBackendStoryObject = {
      id: 'storyId_0',
      title: 'Story title',
      description: 'Story Description',
      notes: '<p>Notes/p>',
      story_contents: {
        initial_node_id: 'node_1',
        next_node_id: 'node_2',
        nodes: []
      },
      language_code: 'en',
      story_contents_schema_version: '1',
      version: '1'
    };

    secondBackendStoryObject = {
      id: 'storyId_1',
      title: 'Story title  2',
      description: 'Story Description 2',
      notes: '<p>Notes 2/p>',
      story_contents: {
        initial_node_id: 'node_2',
        next_node_id: 'node_1',
        nodes: []
      },
      language_code: 'en',
      story_contents_schema_version: '1',
      version: '1'
    };
  }));

  it('should request to load the story from the backend', function() {
    spyOn(
      fakeEditableStoryBackendApiService, 'fetchStory').and.callThrough();

    StoryEditorStateService.loadStory('topicId', 'storyId_0');
    expect(fakeEditableStoryBackendApiService.fetchStory).toHaveBeenCalled();
  });

  it(
    'should fire an init event and set the topic name after loading the ' +
    'first story', function() {
      spyOn($rootScope, '$broadcast').and.callThrough();

      StoryEditorStateService.loadStory('topicId', 'storyId_0');
      $rootScope.$apply();
      expect(StoryEditorStateService.getTopicName()).toEqual('Topic Name');
      expect($rootScope.$broadcast).toHaveBeenCalledWith('storyInitialized');
    }
  );

  it('should fire an update event after loading more stories', function() {
    // Load initial story.
    StoryEditorStateService.loadStory('topicId', 'storyId_0');
    $rootScope.$apply();

    spyOn($rootScope, '$broadcast').and.callThrough();

    // Load a second story.
    StoryEditorStateService.loadStory('topicId', 'storyId_1');
    $rootScope.$apply();

    expect($rootScope.$broadcast).toHaveBeenCalledWith('storyReinitialized');
  });

  it('should track whether it is currently loading the story', function() {
    expect(StoryEditorStateService.isLoadingStory()).toBe(false);

    StoryEditorStateService.loadStory('topicId', 'storyId_0');
    expect(StoryEditorStateService.isLoadingStory()).toBe(true);

    $rootScope.$apply();
    expect(StoryEditorStateService.isLoadingStory()).toBe(false);
  });

  it('should indicate a story is no longer loading after an error',
    function() {
      expect(StoryEditorStateService.isLoadingStory()).toBe(false);
      fakeEditableStoryBackendApiService.failure = 'Internal 500 error';

      StoryEditorStateService.loadStory('topicId', 'storyId_0');
      expect(StoryEditorStateService.isLoadingStory()).toBe(true);

      $rootScope.$apply();
      expect(StoryEditorStateService.isLoadingStory()).toBe(false);
    }
  );

  it('it should report that a story has loaded through loadStory()',
    function() {
      expect(StoryEditorStateService.hasLoadedStory()).toBe(false);

      StoryEditorStateService.loadStory('topicId', 'storyId_0');
      expect(StoryEditorStateService.hasLoadedStory()).toBe(false);

      $rootScope.$apply();
      expect(StoryEditorStateService.hasLoadedStory()).toBe(true);
    }
  );

  it('it should report that a story has loaded through setStory()',
    function() {
      expect(StoryEditorStateService.hasLoadedStory()).toBe(false);

      var newStory = StoryObjectFactory.createFromBackendDict(
        secondBackendStoryObject);
      StoryEditorStateService.setStory(newStory);
      expect(StoryEditorStateService.hasLoadedStory()).toBe(true);
    }
  );

  it('should initially return an interstitial story', function() {
    var story = StoryEditorStateService.getStory();
    expect(story.getId()).toEqual(null);
    expect(story.getTitle()).toEqual('Story title loading');
    expect(story.getDescription()).toEqual('Story description loading');
    expect(story.getNotes()).toEqual('Story notes loading');
    expect(story.getStoryContents()).toEqual(null);
  });

  it('should be able to set a new story with an in-place copy',
    function() {
      var previousStory = StoryEditorStateService.getStory();
      var expectedStory = StoryObjectFactory.createFromBackendDict(
        secondBackendStoryObject);
      expect(previousStory).not.toEqual(expectedStory);

      StoryEditorStateService.setStory(expectedStory);

      var actualStory = StoryEditorStateService.getStory();
      expect(actualStory).toEqual(expectedStory);

      expect(actualStory).toBe(previousStory);
      expect(actualStory).not.toBe(expectedStory);
    }
  );

  it('should fail to save the story without first loading one',
    function() {
      expect(function() {
        StoryEditorStateService.saveStory('topicId', 'Commit message');
      }).toThrow();
    }
  );

  it('should not save the story if there are no pending changes',
    function() {
      StoryEditorStateService.loadStory('topicId', 'storyId_0');
      $rootScope.$apply();

      spyOn($rootScope, '$broadcast').and.callThrough();
      expect(StoryEditorStateService.saveStory('topicId',
        'Commit message')).toBe(false);
      expect($rootScope.$broadcast).not.toHaveBeenCalled();
    }
  );

  it('should be able to save the story and pending changes', function() {
    spyOn(
      fakeEditableStoryBackendApiService,
      'updateStory').and.callThrough();

    StoryEditorStateService.loadStory('topicId_1', 'storyId_0');
    StoryUpdateService.setStoryTitle(
      StoryEditorStateService.getStory(), 'New title');
    $rootScope.$apply();

    expect(
      StoryEditorStateService.saveStory('topicId_1', 'Commit message')
    ).toBe(true);
    $rootScope.$apply();

    var expectedId = 'storyId_0';
    var expectedTopicId = 'topicId_1';
    var expectedVersion = '1';
    var expectedCommitMessage = 'Commit message';
    var updateStorySpy = (
      fakeEditableStoryBackendApiService.updateStory);
    expect(updateStorySpy).toHaveBeenCalledWith(
      expectedTopicId, expectedId, expectedVersion,
      expectedCommitMessage, jasmine.any(Object));
  });

  it('should fire an update event after saving the story', function() {
    StoryEditorStateService.loadStory('topicId', 'storyId_0');
    StoryUpdateService.setStoryTitle(
      StoryEditorStateService.getStory(), 'New title');
    $rootScope.$apply();

    spyOn($rootScope, '$broadcast').and.callThrough();
    StoryEditorStateService.saveStory('topicId', 'Commit message');
    $rootScope.$apply();

    expect($rootScope.$broadcast).toHaveBeenCalledWith(
      'storyReinitialized');
  });

  it('should track whether it is currently saving the story', function() {
    StoryEditorStateService.loadStory('topicId', 'storyId_0');
    StoryUpdateService.setStoryTitle(
      StoryEditorStateService.getStory(), 'New title');
    $rootScope.$apply();

    expect(StoryEditorStateService.isSavingStory()).toBe(false);
    StoryEditorStateService.saveStory('topicId', 'Commit message');
    expect(StoryEditorStateService.isSavingStory()).toBe(true);

    $rootScope.$apply();
    expect(StoryEditorStateService.isSavingStory()).toBe(false);
  });

  it('should indicate a story is no longer saving after an error',
    function() {
      StoryEditorStateService.loadStory('topicId', 'storyId_0');
      StoryUpdateService.setStoryTitle(
        StoryEditorStateService.getStory(), 'New title');
      $rootScope.$apply();

      expect(StoryEditorStateService.isSavingStory()).toBe(false);
      fakeEditableStoryBackendApiService.failure = 'Internal 500 error';

      StoryEditorStateService.saveStory('topicId', 'Commit message');
      expect(StoryEditorStateService.isSavingStory()).toBe(true);

      $rootScope.$apply();
      expect(StoryEditorStateService.isSavingStory()).toBe(false);
    }
  );
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for TopicEditorStateService.
 */

require('domain/topic/SubtopicPageObjectFactory.ts');
require('domain/topic/TopicObjectFactory.ts');
require('domain/topic/TopicRightsObjectFactory.ts');
require('domain/topic/TopicUpdateService.ts');
require('pages/topic-editor-page/services/topic-editor-state.service.ts');

describe('Topic editor state service', function() {
  var TopicEditorStateService = null;
  var TopicObjectFactory = null;
  var SubtopicPageObjectFactory = null;
  var TopicRightsObjectFactory = null;
  var TopicUpdateService = null;
  var fakeEditableTopicBackendApiService = null;
  var fakeTopicRightsBackendApiService = null;
  var secondSubtopicPageObject = null;
  var secondBackendTopicObject = null;
  var secondTopicRightsObject = null;
  var $rootScope = null;
  var $scope = null;
  var $q = null;

  var FakeEditableTopicBackendApiService = function() {
    var self = {
      newBackendSubtopicPageObject: null,
      newBackendTopicObject: null,
      backendStorySummariesObject: null,
      failure: null,
      fetchTopic: null,
      fetchSubtopicPage: null,
      updateTopic: null,
      fetchStories: null
    };

    var _fetchOrUpdateTopic = function() {
      return $q(function(resolve, reject) {
        if (!self.failure) {
          resolve(self.newBackendTopicObject);
        } else {
          reject();
        }
      });
    };

    var _fetchStories = function() {
      return $q(function(resolve, reject) {
        if (!self.failure) {
          resolve(self.backendStorySummariesObject);
        } else {
          reject();
        }
      });
    };

    var _fetchSubtopicPage = function() {
      return $q(function(resolve, reject) {
        if (!self.failure) {
          resolve(self.newBackendSubtopicPageObject);
        } else {
          reject();
        }
      });
    };

    self.newBackendSubtopicPageObject = {};
    self.newBackendTopicObject = {};
    self.backendStorySummariesObject = [];
    self.failure = null;
    self.fetchTopic = _fetchOrUpdateTopic;
    self.fetchSubtopicPage = _fetchSubtopicPage;
    self.updateTopic = _fetchOrUpdateTopic;
    self.fetchStories = _fetchStories;

    return self;
  };

  var FakeTopicRightsBackendApiService = function() {
    var self = {
      backendTopicRightsObject: null,
      failure: null,
      fetchTopicRights: null
    };

    var _fetchTopicRights = function() {
      return $q(function(resolve, reject) {
        if (!self.failure) {
          resolve(self.backendTopicRightsObject);
        } else {
          reject();
        }
      });
    };

    self.backendTopicRightsObject = {};
    self.failure = null;
    self.fetchTopicRights = _fetchTopicRights;

    return self;
  };

  beforeEach(angular.mock.module('oppia'));
  beforeEach(
    angular.mock.module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));
  beforeEach(angular.mock.module('oppia', function($provide) {
    fakeEditableTopicBackendApiService = (
      FakeEditableTopicBackendApiService());
    $provide.value(
      'EditableTopicBackendApiService',
      [fakeEditableTopicBackendApiService][0]);

    fakeTopicRightsBackendApiService = (
      FakeTopicRightsBackendApiService());
    $provide.value(
      'TopicRightsBackendApiService',
      [fakeTopicRightsBackendApiService][0]);
  }));

  beforeEach(angular.mock.inject(function($injector) {
    TopicEditorStateService = $injector.get(
      'TopicEditorStateService');
    TopicObjectFactory = $injector.get('TopicObjectFactory');
    SubtopicPageObjectFactory = $injector.get('SubtopicPageObjectFactory');
    TopicRightsObjectFactory = $injector.get(
      'TopicRightsObjectFactory');
    TopicUpdateService = $injector.get('TopicUpdateService');
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();

    fakeEditableTopicBackendApiService.newBackendTopicObject = {
      topicDict: {
        id: '0',
        name: 'Topic Name',
        description: 'Topic Description',
        canonical_story_ids: ['story_1'],
        additional_story_ids: ['story_2'],
        uncategorized_skill_ids: ['skill_1'],
        subtopics: [],
        language_code: 'en',
        next_subtopic_id: 1,
        subtopic_schema_version: '1',
        version: '1'
      },
      skillIdToDescriptionDict: {
        skill_1: 'Description 1'
      }
    };

    secondBackendTopicObject = {
      topicDict: {
        id: '0',
        name: 'Topic Name 2',
        description: 'Topic Description 2',
        canonical_story_ids: ['story_3'],
        additional_story_ids: ['story_4'],
        uncategorized_skill_ids: ['skill_5'],
        subtopics: [
          {
            id: 1,
            title: 'Title',
            skill_ids: ['skill_2']
          }, {
            id: 2,
            title: 'Title 2',
            skill_ids: ['skill_3']
          }
        ],
        language_code: 'en',
        next_subtopic_id: 3,
        subtopic_schema_version: '1',
        version: '1'
      },
      skillIdToDescriptionDict: {
        skill_2: 'Description 2',
        skill_3: 'Description 3',
        skill_5: 'Description 5'
      }
    };

    var topicRightsObject = {
      id: '0',
      can_edit_topic: 'true',
      is_published: 'true',
      can_publish_topic: 'true'
    };
    fakeTopicRightsBackendApiService.backendTopicRightsObject = (
      topicRightsObject);

    secondTopicRightsObject = {
      id: '0',
      can_edit_topic: 'true',
      is_published: 'false',
      can_publish_topic: 'false'
    };

    var subtopicPageObject = {
      id: 'validTopicId-0',
      topic_id: 'validTopicId',
      page_contents: {
        subtitled_html: {
          html: '<p>Data</p>',
          content_id: 'content'
        },
        content_ids_to_audio_translations: {
          content: {}
        }
      },
      language_code: 'en'
    };
    fakeEditableTopicBackendApiService.newBackendSubtopicPageObject = (
      subtopicPageObject);

    secondSubtopicPageObject = {
      id: 'validTopicId-0',
      topic_id: 'validTopicId',
      page_contents: {
        subtitled_html: {
          html: '<p>Data</p>',
          content_id: 'content'
        },
        content_ids_to_audio_translations: {
          content: {}
        }
      },
      language_code: 'en'
    };
  }));

  it('should request to load the topic from the backend', function() {
    spyOn(
      fakeEditableTopicBackendApiService, 'fetchTopic').and.callThrough();

    TopicEditorStateService.loadTopic(5);
    expect(fakeEditableTopicBackendApiService.fetchTopic).toHaveBeenCalled();
  });

  it('should request to load the subtopic page from the backend', function() {
    spyOn(
      fakeEditableTopicBackendApiService, 'fetchSubtopicPage'
    ).and.callThrough();

    TopicEditorStateService.loadSubtopicPage('validTopicId', 1);
    expect(
      fakeEditableTopicBackendApiService.fetchSubtopicPage).toHaveBeenCalled();
  });

  it('should not request to load the subtopic page from the backend after ' +
     'loading it once', function() {
    spyOn(
      fakeEditableTopicBackendApiService, 'fetchSubtopicPage'
    ).and.callThrough();

    var subtopicPage = SubtopicPageObjectFactory.createFromBackendDict(
      secondSubtopicPageObject);
    TopicEditorStateService.setSubtopicPage(subtopicPage);
    TopicEditorStateService.loadSubtopicPage('validTopicId', 0);
    expect(
      fakeEditableTopicBackendApiService.fetchSubtopicPage
    ).not.toHaveBeenCalled();
  });

  it('should not add duplicate subtopic pages to the local cache', function() {
    var subtopicPage = SubtopicPageObjectFactory.createFromBackendDict(
      secondSubtopicPageObject);
    TopicEditorStateService.setSubtopicPage(subtopicPage);
    expect(TopicEditorStateService.getCachedSubtopicPages().length).toEqual(1);
    subtopicPage.getPageContents().setHtml('<p>New Data</p>');
    TopicEditorStateService.setSubtopicPage(subtopicPage);
    expect(TopicEditorStateService.getCachedSubtopicPages().length).toEqual(1);
    expect(
      TopicEditorStateService.getSubtopicPage().getPageContents().getHtml()
    ).toEqual('<p>New Data</p>');
  });

  it('should correctly delete newly created subtopic pages from the ' +
    'local cache', function() {
    var subtopicPage = SubtopicPageObjectFactory.createFromBackendDict(
      secondSubtopicPageObject);
    TopicEditorStateService.setSubtopicPage(subtopicPage);
    subtopicPage.setId('validTopicId-1');
    subtopicPage.getPageContents().setHtml('<p>Data 1</p>');
    TopicEditorStateService.setSubtopicPage(subtopicPage);
    subtopicPage.setId('validTopicId-2');
    subtopicPage.getPageContents().setHtml('<p>Data 2</p>');
    TopicEditorStateService.setSubtopicPage(subtopicPage);
    expect(TopicEditorStateService.getCachedSubtopicPages().length).toEqual(3);
    TopicEditorStateService.deleteSubtopicPage('validTopicId', 1);
    expect(TopicEditorStateService.getCachedSubtopicPages().length).toEqual(2);

    expect(
      TopicEditorStateService.getCachedSubtopicPages()[0].getId()
    ).toEqual('validTopicId-0');
    expect(
      TopicEditorStateService.getCachedSubtopicPages()[0].getPageContents()
        .getHtml()
    ).toEqual('<p>Data</p>');
    expect(
      TopicEditorStateService.getCachedSubtopicPages()[1].getId()
    ).toEqual('validTopicId-1');
    expect(
      TopicEditorStateService.getCachedSubtopicPages()[1].getPageContents()
        .getHtml()
    ).toEqual('<p>Data 2</p>');
  });

  it('should correctly delete new subtopic pages without changing already ' +
    'existing subtopic pages from the local cache', function() {
    spyOn($rootScope, '$broadcast').and.callThrough();

    var subtopicPage = SubtopicPageObjectFactory.createFromBackendDict(
      secondSubtopicPageObject);
    subtopicPage.setId('validTopicId-1');
    subtopicPage.getPageContents().setHtml('<p>Data 1</p>');
    TopicEditorStateService.setSubtopicPage(subtopicPage);
    TopicEditorStateService.loadSubtopicPage('validTopicId', 0);
    $rootScope.$apply();
    expect($rootScope.$broadcast).toHaveBeenCalledWith('subtopicPageLoaded');
    expect(TopicEditorStateService.getCachedSubtopicPages().length).toBe(2);
    TopicEditorStateService.deleteSubtopicPage('validTopicId', 1);

    expect(TopicEditorStateService.getCachedSubtopicPages().length).toEqual(1);
    expect(
      TopicEditorStateService.getCachedSubtopicPages()[0].getId()
    ).toEqual('validTopicId-0');
    expect(
      TopicEditorStateService.getCachedSubtopicPages()[0].getPageContents()
        .getHtml()
    ).toEqual('<p>Data</p>');
  });

  it('should correctly delete already existing subtopic pages without ' +
    'changing newly created subtopic pages from the local cache', function() {
    spyOn($rootScope, '$broadcast').and.callThrough();

    var subtopicPage = SubtopicPageObjectFactory.createFromBackendDict(
      secondSubtopicPageObject);
    subtopicPage.setId('validTopicId-1');
    subtopicPage.getPageContents().setHtml('<p>Data 1</p>');
    TopicEditorStateService.setSubtopicPage(subtopicPage);
    TopicEditorStateService.loadSubtopicPage('validTopicId', 0);
    $rootScope.$apply();
    expect($rootScope.$broadcast).toHaveBeenCalledWith('subtopicPageLoaded');
    expect(TopicEditorStateService.getCachedSubtopicPages().length).toBe(2);
    TopicEditorStateService.deleteSubtopicPage('validTopicId', 0);

    expect(TopicEditorStateService.getCachedSubtopicPages().length).toEqual(1);
    expect(
      TopicEditorStateService.getCachedSubtopicPages()[0].getId()
    ).toEqual('validTopicId-1');
    expect(
      TopicEditorStateService.getCachedSubtopicPages()[0].getPageContents()
        .getHtml()
    ).toEqual('<p>Data 1</p>');
  });

  it('should request to load the topic rights from the backend',
    function() {
      spyOn(fakeTopicRightsBackendApiService, 'fetchTopicRights')
        .and.callThrough();

      TopicEditorStateService.loadTopic(5);
      expect(fakeTopicRightsBackendApiService.fetchTopicRights)
        .toHaveBeenCalled();
    }
  );

  it('should fire an init event after loading the first topic',
    function() {
      spyOn($rootScope, '$broadcast').and.callThrough();

      TopicEditorStateService.loadTopic(5);
      $rootScope.$apply();

      expect($rootScope.$broadcast).toHaveBeenCalledWith('topicInitialized');
    }
  );

  it('should fire a loaded event after loading a new subtopic page',
    function() {
      spyOn($rootScope, '$broadcast').and.callThrough();

      TopicEditorStateService.loadSubtopicPage('validTopicId', 1);
      $rootScope.$apply();

      expect($rootScope.$broadcast).toHaveBeenCalledWith('subtopicPageLoaded');
    }
  );

  it('should fire an update event after loading more topics', function() {
    // Load initial topic.
    TopicEditorStateService.loadTopic(5);
    $rootScope.$apply();

    spyOn($rootScope, '$broadcast').and.callThrough();

    // Load a second topic.
    TopicEditorStateService.loadTopic(1);
    $rootScope.$apply();

    expect($rootScope.$broadcast).toHaveBeenCalledWith('topicReinitialized');
  });

  it('should track whether it is currently loading the topic', function() {
    expect(TopicEditorStateService.isLoadingTopic()).toBe(false);

    TopicEditorStateService.loadTopic(5);
    expect(TopicEditorStateService.isLoadingTopic()).toBe(true);

    $rootScope.$apply();
    expect(TopicEditorStateService.isLoadingTopic()).toBe(false);
  });

  it('should indicate a topic is no longer loading after an error',
    function() {
      expect(TopicEditorStateService.isLoadingTopic()).toBe(false);
      fakeEditableTopicBackendApiService.failure = 'Internal 500 error';

      TopicEditorStateService.loadTopic(5);
      expect(TopicEditorStateService.isLoadingTopic()).toBe(true);

      $rootScope.$apply();
      expect(TopicEditorStateService.isLoadingTopic()).toBe(false);
    }
  );

  it('it should report that a topic has loaded through loadTopic()',
    function() {
      expect(TopicEditorStateService.hasLoadedTopic()).toBe(false);

      TopicEditorStateService.loadTopic(5);
      expect(TopicEditorStateService.hasLoadedTopic()).toBe(false);

      $rootScope.$apply();
      expect(TopicEditorStateService.hasLoadedTopic()).toBe(true);
    }
  );

  it('it should report that a topic has loaded through setTopic()',
    function() {
      expect(TopicEditorStateService.hasLoadedTopic()).toBe(false);

      var newTopic = TopicObjectFactory.create(
        secondBackendTopicObject.topicDict,
        secondBackendTopicObject.skillIdToDescriptionDict);
      TopicEditorStateService.setTopic(newTopic);
      expect(TopicEditorStateService.hasLoadedTopic()).toBe(true);
    }
  );

  it('should initially return an interstitial topic', function() {
    var topic = TopicEditorStateService.getTopic();
    expect(topic.getId()).toEqual(null);
    expect(topic.getName()).toEqual('Topic name loading');
    expect(topic.getDescription()).toEqual('Topic description loading');
    expect(topic.getCanonicalStoryIds()).toEqual([]);
    expect(topic.getAdditionalStoryIds()).toEqual([]);
    expect(topic.getUncategorizedSkillSummaries()).toEqual([]);
    expect(topic.getSubtopics()).toEqual([]);
  });

  it('should initially return an interstitial subtopic page', function() {
    var subtopicPage = TopicEditorStateService.getSubtopicPage();
    expect(subtopicPage.getId()).toEqual(null);
    expect(subtopicPage.getTopicId()).toEqual(null);
    expect(subtopicPage.getPageContents()).toEqual(null);
    expect(subtopicPage.getLanguageCode()).toEqual('en');
  });

  it('should initially return an interstitial topic rights object', function() {
    var topicRights = TopicEditorStateService.getTopicRights();
    expect(topicRights.isPublished()).toEqual(false);
    expect(topicRights.canEditTopic()).toEqual(false);
    expect(topicRights.canPublishTopic()).toEqual(false);
  });

  it('should be able to set a new topic with an in-place copy',
    function() {
      var previousTopic = TopicEditorStateService.getTopic();
      var expectedTopic = TopicObjectFactory.create(
        secondBackendTopicObject.topicDict,
        secondBackendTopicObject.skillIdToDescriptionDict
      );
      expect(previousTopic).not.toEqual(expectedTopic);

      TopicEditorStateService.setTopic(expectedTopic);

      var actualTopic = TopicEditorStateService.getTopic();
      expect(actualTopic).toEqual(expectedTopic);

      expect(actualTopic).toBe(previousTopic);
      expect(actualTopic).not.toBe(expectedTopic);
    }
  );

  it('should be able to set a new topic rights with an in-place copy',
    function() {
      var previousTopicRights = TopicEditorStateService.getTopicRights();
      var expectedTopicRights = TopicRightsObjectFactory.createFromBackendDict(
        secondTopicRightsObject);
      expect(previousTopicRights).not.toEqual(expectedTopicRights);

      TopicEditorStateService.setTopicRights(expectedTopicRights);

      var actualTopicRights = TopicEditorStateService.getTopicRights();
      expect(actualTopicRights).toEqual(expectedTopicRights);

      expect(actualTopicRights).toBe(previousTopicRights);
      expect(actualTopicRights).not.toBe(expectedTopicRights);
    }
  );

  it('should fail to save the topic without first loading one',
    function() {
      expect(function() {
        TopicEditorStateService.saveTopic('Commit message');
      }).toThrow();
    }
  );

  it('should not save the topic if there are no pending changes',
    function() {
      TopicEditorStateService.loadTopic(5);
      $rootScope.$apply();

      spyOn($rootScope, '$broadcast').and.callThrough();
      expect(TopicEditorStateService.saveTopic(
        'Commit message')).toBe(false);
      expect($rootScope.$broadcast).not.toHaveBeenCalled();
    }
  );

  it('should be able to save the topic and pending changes', function() {
    spyOn(
      fakeEditableTopicBackendApiService,
      'updateTopic').and.callThrough();

    TopicEditorStateService.loadTopic(0);
    TopicUpdateService.setTopicName(
      TopicEditorStateService.getTopic(), 'New name');
    $rootScope.$apply();

    expect(TopicEditorStateService.saveTopic(
      'Commit message')).toBe(true);
    $rootScope.$apply();

    var expectedId = '0';
    var expectedVersion = '1';
    var expectedCommitMessage = 'Commit message';
    var updateTopicSpy = (
      fakeEditableTopicBackendApiService.updateTopic);
    expect(updateTopicSpy).toHaveBeenCalledWith(
      expectedId, expectedVersion, expectedCommitMessage, jasmine.any(Object));
  });

  it('should fire an update event after saving the topic', function() {
    TopicEditorStateService.loadTopic(5);
    TopicUpdateService.setTopicName(
      TopicEditorStateService.getTopic(), 'New name');
    $rootScope.$apply();

    spyOn($rootScope, '$broadcast').and.callThrough();
    TopicEditorStateService.saveTopic('Commit message');
    $rootScope.$apply();

    expect($rootScope.$broadcast).toHaveBeenCalledWith(
      'topicReinitialized');
  });

  it('should track whether it is currently saving the topic', function() {
    TopicEditorStateService.loadTopic(5);
    TopicUpdateService.setTopicName(
      TopicEditorStateService.getTopic(), 'New name');
    $rootScope.$apply();

    expect(TopicEditorStateService.isSavingTopic()).toBe(false);
    TopicEditorStateService.saveTopic('Commit message');
    expect(TopicEditorStateService.isSavingTopic()).toBe(true);

    $rootScope.$apply();
    expect(TopicEditorStateService.isSavingTopic()).toBe(false);
  });

  it('should indicate a topic is no longer saving after an error',
    function() {
      TopicEditorStateService.loadTopic(5);
      TopicUpdateService.setTopicName(
        TopicEditorStateService.getTopic(), 'New name');
      $rootScope.$apply();

      expect(TopicEditorStateService.isSavingTopic()).toBe(false);
      fakeEditableTopicBackendApiService.failure = 'Internal 500 error';

      TopicEditorStateService.saveTopic('Commit message');
      expect(TopicEditorStateService.isSavingTopic()).toBe(true);

      $rootScope.$apply();
      expect(TopicEditorStateService.isSavingTopic()).toBe(false);
    }
  );
});
// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the Alerts Service.
 */

require('services/AlertsService.ts');

describe('Alerts Service', function() {
  var AlertsService;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector) {
    AlertsService = $injector.get('AlertsService');
  }));

  describe('Warnings', function() {
    it('should add a warning', function() {
      expect(AlertsService.warnings.length).toBe(0);
      AlertsService.addWarning('Warning 1');
      expect(AlertsService.warnings.length).toBe(1);
    });

    it('should delete a warning (no duplicates)', function() {
      var warning = 'Warning 1';
      // Warning message to be deleted
      AlertsService.addWarning(warning);
      // Add a few other warning message
      AlertsService.addWarning('Warning 2');
      AlertsService.addWarning('Warning 3');

      expect(AlertsService.warnings.length).toBe(3);
      AlertsService.deleteWarning({
        type: 'warning',
        content: warning
      });
      expect(AlertsService.warnings.length).toBe(2);

      // Search for the deleted warning message
      var found = false;
      for (var i = 0; i < AlertsService.warnings.length; i++) {
        if (AlertsService.warnings[i].content === warning) {
          found = true;
        }
      }
      expect(found).toBe(false);
      expect(AlertsService.warnings[0].content).toBe('Warning 2');
      expect(AlertsService.warnings[1].content).toBe('Warning 3');
    });

    it('should delete a warning (with duplicates)', function() {
      var warning = 'Warning 1';
      // Warning message to be deleted
      AlertsService.addWarning(warning);
      // Add a few other warning message
      AlertsService.addWarning('Warning 2');
      AlertsService.addWarning(warning);
      AlertsService.addWarning('Warning 3');

      expect(AlertsService.warnings.length).toBe(4);
      AlertsService.deleteWarning({
        type: 'warning',
        content: warning
      });
      expect(AlertsService.warnings.length).toBe(2);

      // Search for the deleted warning message
      var found = false;
      for (var i = 0; i < AlertsService.warnings.length; i++) {
        if (AlertsService.warnings[i].content === warning) {
          found = true;
        }
      }
      expect(found).toBe(false);
      expect(AlertsService.warnings[0].content).toBe('Warning 2');
      expect(AlertsService.warnings[1].content).toBe('Warning 3');
    });

    it('should not add more than 10 warnings', function() {
      var warning = 'Warning ';
      for (var i = 1; i < 15; i++) {
        AlertsService.addWarning(warning + i);
      }
      expect(AlertsService.warnings.length).toBe(10);
    });

    it('should clear all the warning messages', function() {
      AlertsService.addWarning('Warning 1');
      AlertsService.addWarning('Warning 2');
      AlertsService.addWarning('Warning 3');
      AlertsService.clearWarnings();
      expect(AlertsService.warnings.length).toBe(0);
    });
  });

  describe('Messages', function() {
    it('should add an info message', function() {
      var message = 'Info 1';
      expect(AlertsService.messages.length).toBe(0);
      AlertsService.addInfoMessage(message);
      expect(AlertsService.messages.length).toBe(1);
      expect(AlertsService.messages[0].type).toBe('info');
      expect(AlertsService.messages[0].content).toBe(message);
    });

    it('should add a success message', function() {
      var message = 'Success 1';
      expect(AlertsService.messages.length).toBe(0);
      AlertsService.addSuccessMessage(message);
      AlertsService.addInfoMessage('Info 1');
      expect(AlertsService.messages.length).toBe(2);
      expect(AlertsService.messages[0].type).toBe('success');
      expect(AlertsService.messages[0].content).toBe(message);
    });

    it('should delete a message (no duplicates)', function() {
      var message = 'Info 1';
      // Info Message to be deleted
      AlertsService.addInfoMessage(message);
      // Add a few other messages
      AlertsService.addInfoMessage('Info 2');
      AlertsService.addSuccessMessage('Success 1');

      expect(AlertsService.messages.length).toBe(3);
      AlertsService.deleteMessage({
        type: 'info',
        content: message
      });
      expect(AlertsService.messages.length).toBe(2);

      // Search for the message
      var found = false;
      for (var i = 0; i < AlertsService.messages.length; i++) {
        if (AlertsService.messages[i].content === message &&
            AlertsService.messages[i].type === 'info') {
          found = true;
        }
      }
      expect(found).toBe(false);
      expect(AlertsService.messages[0].content).toBe('Info 2');
      expect(AlertsService.messages[1].content).toBe('Success 1');
    });

    it('should delete a message (with duplicates)', function() {
      var message = 'Info 1';
      // Info Message to be deleted
      AlertsService.addInfoMessage(message);
      // Add a few other messages
      AlertsService.addInfoMessage('Info 2');
      AlertsService.addSuccessMessage('Success 1');
      AlertsService.addInfoMessage(message);

      expect(AlertsService.messages.length).toBe(4);
      AlertsService.deleteMessage({
        type: 'info',
        content: message
      });
      expect(AlertsService.messages.length).toBe(2);

      // Search for the message
      var found = false;
      for (var i = 0; i < AlertsService.messages.length; i++) {
        if (AlertsService.messages[i].content === message &&
            AlertsService.messages[i].type === 'info') {
          found = true;
        }
      }
      expect(found).toBe(false);
      expect(AlertsService.messages[0].content).toBe('Info 2');
      expect(AlertsService.messages[1].content).toBe('Success 1');
    });

    it('should not add more than 10 messages', function() {
      var message = 'Info ';
      for (var i = 1; i < 15; i++) {
        AlertsService.addInfoMessage(message + i);
      }
      AlertsService.addSuccessMessage('Success 1');
      expect(AlertsService.messages.length).toBe(10);
    });

    it('should clear all the messages', function() {
      AlertsService.addInfoMessage('Info 1');
      AlertsService.addInfoMessage('Info 2');
      AlertsService.addSuccessMessage('Success 1');
      AlertsService.clearMessages();
      expect(AlertsService.messages.length).toBe(0);
    });
  });
});
// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for AssetsBackendApiService
 */

require('domain/utilities/FileDownloadRequestObjectFactory.ts');
require('domain/utilities/UrlInterpolationService.ts');
require('services/AssetsBackendApiService.ts');

describe('Assets Backend API Service', function() {
  var AssetsBackendApiService = null;
  var FileDownloadRequestObjectFactory = null;
  var UrlInterpolationService = null;
  var $httpBackend = null;
  var $rootScope = null;
  var $q = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    AssetsBackendApiService = $injector.get(
      'AssetsBackendApiService');
    FileDownloadRequestObjectFactory = $injector.get(
      'FileDownloadRequestObjectFactory');
    UrlInterpolationService = $injector.get(
      'UrlInterpolationService');
    $httpBackend = $injector.get('$httpBackend');
    $rootScope = $injector.get('$rootScope');
    $q = $injector.get('$q');
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should correctly formulate the download URL', function() {
    // TODO(sll): Find a way to substitute out constants.DEV_MODE so that we
    // can test the production URL, too.
    expect(
      AssetsBackendApiService.getAudioDownloadUrl('expid12345', 'a.mp3')
    ).toEqual('/assetsdevhandler/expid12345/assets/audio/a.mp3');
  });

  it('should successfully fetch and cache audio', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    var requestUrl = UrlInterpolationService.interpolateUrl(
      '/assetsdevhandler/<exploration_id>/assets/audio/<filename>', {
        exploration_id: '0',
        filename: 'myfile.mp3'
      });

    $httpBackend.expect('GET', requestUrl).respond(201, 'audio data');
    expect(AssetsBackendApiService.isCached('myfile.mp3')).toBe(false);


    AssetsBackendApiService.loadAudio('0', 'myfile.mp3').then(
      successHandler, failHandler);
    expect((AssetsBackendApiService.getAssetsFilesCurrentlyBeingRequested())
      .audio.length).toBe(1);
    $httpBackend.flush();
    expect((AssetsBackendApiService.getAssetsFilesCurrentlyBeingRequested())
      .audio.length).toBe(0);
    expect(AssetsBackendApiService.isCached('myfile.mp3')).toBe(true);
    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
    $httpBackend.verifyNoOutstandingExpectation();
  });

  it('should successfully fetch and cache image', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    var requestUrl = UrlInterpolationService.interpolateUrl(
      '/assetsdevhandler/<exploration_id>/assets/image/<filename>', {
        exploration_id: '0',
        filename: 'myfile.png'
      });

    $httpBackend.expect('GET', requestUrl).respond(201, 'image data');
    expect(AssetsBackendApiService.isCached('myfile.png')).toBe(false);


    AssetsBackendApiService.loadImage('0', 'myfile.png').then(
      successHandler, failHandler);
    expect((AssetsBackendApiService.getAssetsFilesCurrentlyBeingRequested())
      .image.length).toBe(1);
    $httpBackend.flush();
    expect((AssetsBackendApiService.getAssetsFilesCurrentlyBeingRequested())
      .image.length).toBe(0);
    expect(AssetsBackendApiService.isCached('myfile.png')).toBe(true);
    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
    $httpBackend.verifyNoOutstandingExpectation();
  });

  it('should call the provided failure handler on HTTP failure for an audio',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      var requestUrl = UrlInterpolationService.interpolateUrl(
        '/assetsdevhandler/<exploration_id>/assets/audio/<filename>', {
          exploration_id: '0',
          filename: 'myfile.mp3'
        });

      $httpBackend.expect('GET', requestUrl).respond(500, 'MutagenError');
      AssetsBackendApiService.loadAudio('0', 'myfile.mp3').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
      $httpBackend.verifyNoOutstandingExpectation();
    });

  it('should call the provided failure handler on HTTP failure for an image',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      var requestUrl = UrlInterpolationService.interpolateUrl(
        '/assetsdevhandler/<exploration_id>/assets/image/<filename>', {
          exploration_id: '0',
          filename: 'myfile.png'
        });

      $httpBackend.expect('GET', requestUrl).respond(500, 'Error');
      AssetsBackendApiService.loadImage('0', 'myfile.png').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
      $httpBackend.verifyNoOutstandingExpectation();
    });

  it('should successfully abort the download of all the audio files',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      var requestUrl = UrlInterpolationService.interpolateUrl(
        '/assetsdevhandler/<exploration_id>/assets/audio/<filename>', {
          exploration_id: '0',
          filename: 'myfile.mp3'
        });

      $httpBackend.expect('GET', requestUrl).respond(201, 'audio data');

      AssetsBackendApiService.loadAudio('0', 'myfile.mp3').then(
        successHandler, failHandler);

      expect(AssetsBackendApiService.getAssetsFilesCurrentlyBeingRequested()
        .audio.length).toBe(1);

      AssetsBackendApiService.abortAllCurrentAudioDownloads();
      $httpBackend.verifyNoOutstandingRequest();
      expect(AssetsBackendApiService.getAssetsFilesCurrentlyBeingRequested()
        .audio.length).toBe(0);
      expect(AssetsBackendApiService.isCached('myfile.mp3')).toBe(false);
    });

  it('should successfully abort the download of the all the image files',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      var requestUrl = UrlInterpolationService.interpolateUrl(
        'assetsdevhandler/<exploration_id>/assets/image/<filename>', {
          exploration_id: '0',
          filename: 'myfile.png'
        });

      $httpBackend.expect('GET', requestUrl).respond(201, 'image data');

      AssetsBackendApiService.loadImage('0', 'myfile.png').then(
        successHandler, failHandler);

      expect(AssetsBackendApiService.getAssetsFilesCurrentlyBeingRequested()
        .image.length).toBe(1);

      AssetsBackendApiService.abortAllCurrentImageDownloads();
      $httpBackend.verifyNoOutstandingRequest();
      expect(AssetsBackendApiService.getAssetsFilesCurrentlyBeingRequested()
        .image.length).toBe(0);
      expect(AssetsBackendApiService.isCached('myfile.png')).toBe(false);
    });

  it('should use the correct blob type for audio assets', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    var requestUrl = UrlInterpolationService.interpolateUrl(
      '/assetsdevhandler/<exploration_id>/assets/audio/<filename>', {
        exploration_id: '0',
        filename: 'myfile.mp3'
      });

    $httpBackend.expect('GET', requestUrl).respond(201, 'audio data');
    AssetsBackendApiService.loadAudio('0', 'myfile.mp3').then(
      successHandler, failHandler);
    expect((AssetsBackendApiService.getAssetsFilesCurrentlyBeingRequested())
      .audio.length).toBe(1);
    $httpBackend.flush();
    expect((AssetsBackendApiService.getAssetsFilesCurrentlyBeingRequested())
      .audio.length).toBe(0);

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
    expect(successHandler.calls.first().args[0].data.type).toBe('audio/mpeg');
    $httpBackend.verifyNoOutstandingExpectation();
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for AutoplayedVideosService.
 */

require('services/AutoplayedVideosService.ts');

describe('AutoplayedVideosService', function() {
  var AutoplayedVideosService = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector) {
    AutoplayedVideosService = $injector.get('AutoplayedVideosService');
  }));

  it('should add video to a list of autoplayed videos', function() {
    AutoplayedVideosService.addAutoplayedVideo('Ntcw0H0hwPU');
    expect(AutoplayedVideosService.hasVideoBeenAutoplayed('Ntcw0H0hwPU')).
      toBe(true);
  });

  it('should test video not yet played', function() {
    expect(AutoplayedVideosService.hasVideoBeenAutoplayed('Ntcw0H0hwPU')).
      toBe(false);
  });
});
// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the Code Normalizer Service.
 */

require('services/CodeNormalizerService.ts');

describe('Code Normalization', function() {
  beforeEach(angular.mock.module('oppia'));

  var cns = null;
  beforeEach(angular.mock.inject(function($injector) {
    cns = $injector.get('CodeNormalizerService');
  }));

  it('should not modify contents of code', function() {
    expect(cns.getNormalizedCode(
      'def x():\n' +
      '    y = 345'
    )).toBe(
      'def x():\n' +
      '    y = 345'
    );
  });

  it('should convert indentation to 4 spaces, remove trailing whitespace ' +
      'and empty lines', function() {
    expect(cns.getNormalizedCode(
      'def x():         \n' +
      '    \n' +
      '  y = 345\n' +
      '            \n' +
      '       '
    )).toBe(
      'def x():\n' +
      '    y = 345'
    );
  });

  it('should remove full-line comments, but not comments in the middle ' +
     'of a line', function() {
    expect(cns.getNormalizedCode(
      '# This is a comment.\n' +
      '  # This is a comment with some spaces before it.\n' +
      'def x():   # And a comment with some code before it.\n' +
      '  y = \'#string with hashes#\''
    )).toBe(
      'def x(): # And a comment with some code before it.\n' +
      '    y = \'#string with hashes#\''
    );
  });

  it('should handle complex indentation', function() {
    expect(cns.getNormalizedCode(
      'abcdefg\n' +
      '    hij\n' +
      '              ppppp\n' +
      'x\n' +
      '  abc\n' +
      '  abc\n' +
      '    bcd\n' +
      '  cde\n' +
      '              xxxxx\n' +
      '  y\n' +
      ' z'
    )).toBe(
      'abcdefg\n' +
      '    hij\n' +
      '        ppppp\n' +
      'x\n' +
      '    abc\n' +
      '    abc\n' +
      '        bcd\n' +
      '    cde\n' +
      '        xxxxx\n' +
      '    y\n' +
      'z'
    );
  });

  it('should handle shortfall lines', function() {
    expect(cns.getNormalizedCode(
      'abcdefg\n' +
      '    hij\n' +
      '              ppppp\n' +
      '      x\n' +
      '  abc\n' +
      '    bcd\n' +
      '  cde'
    )).toBe(
      'abcdefg\n' +
      '    hij\n' +
      '        ppppp\n' +
      '    x\n' +
      'abc\n' +
      '    bcd\n' +
      'cde'
    );
  });

  it('should normalize multiple spaces within a line', function() {
    expect(cns.getNormalizedCode(
      'abcdefg\n' +
      '    hij    klm\n' +
      '    ab "cde fgh"\n'
    )).toBe(
      'abcdefg\n' +
      '    hij klm\n' +
      '    ab "cde fgh"'
    );
  });
});
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
 * @fileoverview Unit tests for the services and controllers of the
 *   editor page.
 */

require('services/ContextService.ts');

describe('Context service', function() {
  beforeEach(angular.mock.module('oppia'));

  describe('behavior in the exploration learner view', function() {
    var ecs = null;

    beforeEach(function() {
      angular.mock.module(function($provide) {
        $provide.value('UrlService', {
          getPathname: function() {
            return '/explore/123';
          }
        });
      });
    });

    beforeEach(
      angular.mock.module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

    beforeEach(angular.mock.inject(function($injector) {
      ecs = $injector.get('ContextService');
    }));

    it('should correctly set editor context to exploration editor', function() {
      ecs.init('exploration_editor');
      expect(ecs.getEditorContext()).toBe('exploration_editor');
    });

    it('should correctly retrieve the exploration id', function() {
      expect(ecs.getExplorationId()).toBe('123');
    });

    it('should correctly retrieve the page context', function() {
      expect(ecs.getPageContext()).toBe('learner');
    });
  });

  describe('behavior in the exploration editor view', function() {
    var ecs = null;

    beforeEach(function() {
      angular.mock.module(function($provide) {
        $provide.value('UrlService', {
          getPathname: function() {
            return '/create/123';
          },
          getHash: function() {
            return '#/gui';
          }
        });
      });
    });

    beforeEach(angular.mock.inject(function($injector) {
      ecs = $injector.get('ContextService');
    }));

    it('should correctly retrieve the exploration id', function() {
      expect(ecs.getExplorationId()).toBe('123');
    });

    it('should correctly retrieve the page context', function() {
      expect(ecs.getPageContext()).toBe('editor');
    });

    it('should correctly retrieve exploration editor mode', function() {
      expect(ecs.isInExplorationEditorMode()).toBe(true);
    });
  });

  describe('behavior in the question editor view', function() {
    var ecs = null;

    beforeEach(function() {
      angular.mock.module(function($provide) {
        $provide.value('UrlService', {
          getPathname: function() {
            return '/question_editor/123';
          }
        });
      });
    });

    beforeEach(angular.mock.inject(function($injector) {
      ecs = $injector.get('ContextService');
    }));

    it('should correctly set editor context to question editor', function() {
      ecs.init('question_editor');
      expect(ecs.getEditorContext()).toBe('question_editor');
    });

    it('should correctly retrieve the question id', function() {
      expect(ecs.getQuestionId()).toBe('123');
    });

    it('should correctly retrieve the page context', function() {
      expect(ecs.getPageContext()).toBe('question_editor');
    });

    it('should correctly tell the question editor context', function() {
      expect(ecs.isInQuestionContext()).toBe(true);
    });
  });

  describe('behavior in other pages', function() {
    var ecs = null;

    beforeEach(function() {
      angular.mock.module(function($provide) {
        $provide.value('UrlService', {
          getPathname: function() {
            return '/about';
          }
        });
      });
    });

    beforeEach(angular.mock.inject(function($injector) {
      ecs = $injector.get('ContextService');
    }));

    it('should throw an error when trying to retrieve the exploration id',
      function() {
        expect(ecs.getExplorationId).toThrow();
      }
    );

    it('should throw an error when trying to retrieve the question id',
      function() {
        expect(ecs.getQuestionId).toThrow();
      }
    );

    it('should retrieve other as page context',
      function() {
        expect(ecs.getPageContext()).toBe('other');
      }
    );
  });
});
// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the BackgroundMaskService.
 */

require('services/contextual/UrlService.ts');

describe('Url Service', function() {
  var UrlService = null;
  var sampleHash = 'sampleHash';
  var pathname = '/embed';
  var mockLocation = null;
  var origin = 'http://sample.com';

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector) {
    mockLocation = {
      href: origin + pathname,
      origin: origin,
      pathname: pathname,
      hash: sampleHash,
      search: ''
    };

    UrlService = $injector.get('UrlService');
    spyOn(UrlService, 'getCurrentLocation').and.returnValue(mockLocation);
  }));

  it('should return correct query value list for each query field', function() {
    expect(UrlService.getQueryFieldValuesAsList('field1')).toEqual([]);

    mockLocation.search = '?field1=value1&' +
      'field2=value2&field1=value3&field1=value4&field2=value5&' +
      'field1=value6&field1=value%3F%3D%20%266';
    var expectedList1 = ['value1', 'value3', 'value4', 'value6', 'value?= &6'];
    var expectedList2 = ['value2', 'value5'];
    expect(
      UrlService.getQueryFieldValuesAsList('field1')).toEqual(expectedList1);
    expect(
      UrlService.getQueryFieldValuesAsList('field2')).toEqual(expectedList2);
  });

  it('should correctly decode special characters in query value in url',
    function() {
      var expectedObject = {
        field1: '?value=1',
        field2: '?value&1'
      };
      mockLocation.search = '?field1=%3Fvalue%3D1&field2=%3Fvalue%261';
      expect(UrlService.getUrlParams()).toEqual(expectedObject);
    });

  it('should correctly encode and add query field and value to url',
    function() {
      var queryValue = '&value=1?';
      var queryField = 'field 1';
      var baseUrl = '/sample';
      var expectedUrl1 = baseUrl + '?field%201=%26value%3D1%3F';
      expect(
        UrlService.addField(baseUrl, queryField, queryValue)).toBe(
        expectedUrl1);

      baseUrl = '/sample?field=value';
      var expectedUrl2 = baseUrl + '&field%201=%26value%3D1%3F';
      expect(
        UrlService.addField(baseUrl, queryField, queryValue)).toBe(
        expectedUrl2);
    });

  it('should correctly return true if embed present in pathname', function() {
    expect(UrlService.isIframed()).toBe(true);
  });

  it('should correctly return false if embed not in pathname', function() {
    mockLocation.pathname = '/sample.com';
    expect(UrlService.isIframed()).toBe(false);
  });

  it('should correctly return hash value of window.location', function() {
    expect(UrlService.getHash()).toBe(sampleHash);
  });

  it('should correctly return the origin of window.location', function() {
    expect(UrlService.getOrigin()).toBe('http://sample.com');
  });

  it('should correctly retrieve topic id from url', function() {
    mockLocation.pathname = '/topic_editor/abcdefgijklm';
    expect(
      UrlService.getTopicIdFromUrl()
    ).toBe('abcdefgijklm');
    mockLocation.pathname = '/topic_editor/abcdefgij';
    expect(function() {
      UrlService.getTopicIdFromUrl();
    }).toThrow();

    mockLocation.pathname = '/topiceditor/abcdefgijklm';
    expect(function() {
      UrlService.getTopicIdFromUrl();
    }).toThrow();

    mockLocation.pathname = '/topic_editor';
    expect(function() {
      UrlService.getTopicIdFromUrl();
    }).toThrow();
  });

  it('should correctly retrieve topic name from url', function() {
    mockLocation.pathname = '/topic/abcdefgijklm';
    expect(
      UrlService.getTopicNameFromLearnerUrl()
    ).toBe('abcdefgijklm');
    mockLocation.pathname = '/topic/topic%20name';
    expect(
      UrlService.getTopicNameFromLearnerUrl()
    ).toBe('topic name');
    mockLocation.pathname = '/practice_session/topic%20name';
    expect(
      UrlService.getTopicNameFromLearnerUrl()
    ).toBe('topic name');
    mockLocation.pathname = '/topc/abcdefgijklm';
    expect(function() {
      UrlService.getTopicNameFromLearnerUrl();
    }).toThrowError('Invalid URL for topic');
  });

  it('should correctly retrieve story id from url', function() {
    mockLocation.pathname = '/story_editor/abcdefgijklm';
    expect(function() {
      UrlService.getStoryIdFromUrl();
    }).toThrow();

    mockLocation.pathname = '/storyeditor/abcdefgijklm/012345678901';
    expect(function() {
      UrlService.getStoryIdFromUrl();
    }).toThrow();

    mockLocation.pathname = '/story_editor/abcdefgijlm/012345678901';
    expect(function() {
      UrlService.getStoryIdFromUrl();
    }).toThrow();

    mockLocation.pathname = '/story_editor/abcdefgijklm/01234578901';
    expect(function() {
      UrlService.getStoryIdFromUrl();
    }).toThrow();

    mockLocation.pathname = '/story_editor/abcdefgijklm/012345678901';
    expect(
      UrlService.getStoryIdFromUrl()
    ).toEqual('012345678901');

    mockLocation.pathname = '/review_test/012345678901';
    expect(
      UrlService.getStoryIdFromUrl()
    ).toEqual('012345678901');
  });

  it('should correctly retrieve story id from story viewer url', function() {
    mockLocation.pathname = '/story_viewer/abcdefgijklm';
    expect(function() {
      UrlService.getStoryIdFromViewerUrl();
    }).toThrow();

    mockLocation.pathname = '/story/abcdefg';
    expect(function() {
      UrlService.getStoryIdFromViewerUrl();
    }).toThrow();

    mockLocation.pathname = '/story/abcdefgijklm';
    expect(
      UrlService.getStoryIdFromViewerUrl()
    ).toEqual('abcdefgijklm');
  });

  it('should correctly retrieve skill id from url', function() {
    mockLocation.pathname = '/skill_editor/abcdefghijkl';
    expect(
      UrlService.getSkillIdFromUrl()
    ).toBe('abcdefghijkl');
    mockLocation.pathname = '/skill_editor/abcdefghijk';
    expect(function() {
      UrlService.getSkillIdFromUrl();
    }).toThrow();
  });

  it('should correctly retrieve story id from url in player', function() {
    mockLocation.search = '?story_id=mnopqrstuvwx';
    expect(
      UrlService.getStoryIdInPlayer()
    ).toBe('mnopqrstuvwx');
    mockLocation.search = '?story=mnopqrstuvwx';
    expect(
      UrlService.getStoryIdInPlayer()
    ).toBe(null);
  });
});
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
 * @fileoverview Unit test for DateTimeFormatService.
 */

require('services/DateTimeFormatService.ts');

describe('Datetime Formatter', function() {
  beforeEach(angular.mock.module('oppia'));

  describe('datetimeformatter', function() {
    // This corresponds to Fri, 21 Nov 2014 09:45:00 GMT.
    var NOW_MILLIS = 1416563100000;
    var df = null;
    var OldDate = Date;

    beforeEach(angular.mock.inject(function($injector) {
      df = $injector.get('DateTimeFormatService');

      // Mock Date() to give a time of NOW_MILLIS in GMT. (Unfortunately, there
      // doesn't seem to be a good way to set the timezone locale directly.)
      spyOn(window, 'Date').and.callFake(function() {
        return new OldDate(NOW_MILLIS);
      });
    }));

    it('should correctly indicate recency', function() {
      // 1 second ago is recent.
      expect(df.isRecent(NOW_MILLIS - 1)).toBe(true);
      // 72 hours ago is recent.
      expect(df.isRecent(NOW_MILLIS - 72 * 60 * 60 * 1000)).toBe(true);
      // 8 days ago is not recent.
      expect(df.isRecent(NOW_MILLIS - 8 * 24 * 60 * 60 * 1000)).toBe(false);
    });
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for EditabilityService.
 */

require('services/EditabilityService.ts');

describe('EditabilityService', function() {
  var EditabilityService = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    EditabilityService = $injector.get('EditabilityService');
  }));

  it('should allow to edit an exploration after the tutorial ends', function() {
    EditabilityService.onEndTutorial();
    EditabilityService.markEditable();
    expect(EditabilityService.isEditable()).toBe(true);
  });

  it('should allow to translate an exploration after the tutorial ends',
    function() {
      EditabilityService.onEndTutorial();
      EditabilityService.markTranslatable();
      expect(EditabilityService.isTranslatable()).toBe(true);
    });

  it('should allow to edit an exploration outside the tutorial mode',
    function() {
      EditabilityService.markEditable();
      expect(EditabilityService.isEditableOutsideTutorialMode()).toBe(true);
    });

  it('should not allow to edit an exploration during tutorial mode',
    function() {
      EditabilityService.onStartTutorial();
      expect(EditabilityService.isEditable()).toBe(false);
    });

  it('should not allow to edit an uneditable exploration', function() {
    EditabilityService.markNotEditable();
    expect(EditabilityService.isEditable()).toBe(false);
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for fetching the features the exploration editor is
 * configured to support.
 */

require('services/services.constants.ts');

var oppia = require('AppInit.ts').moduleName;

oppia.factory('ExplorationFeaturesBackendApiService', [
  '$http', 'UrlInterpolationService', 'EXPLORATION_FEATURES_URL',
  function($http, UrlInterpolationService, EXPLORATION_FEATURES_URL) {
    return {
      /**
       * Retrieves data regarding the features the given exploration supports.
       *
       * NOTE: This service requires play-access for the Exploration so that the
       * features can be fetched in both the exploration player and editor.
       *
       * @returns {Object.<string, *>} - Describes the features the given
       *     exploration supports.
       */
      fetchExplorationFeatures: function(explorationId) {
        return $http.get(
          UrlInterpolationService.interpolateUrl(
            EXPLORATION_FEATURES_URL, {exploration_id: explorationId})
        ).then(function(response) {
          return response.data;
        });
      },
    };
  }]);
// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for services for explorations which may be shared
 * by both the learner and editor views
 */

require('services/ExplorationHtmlFormatterService.ts');

describe('Exploration Html Formatter Service', function() {
  beforeEach(angular.mock.module('oppia'));
  var ehfs = null;

  beforeEach(angular.mock.module(function($provide) {
    $provide.constant('INTERACTION_SPECS', {
      sampleId: {
        show_generic_submit_button: true
      },
    });
  }));

  beforeEach(angular.mock.inject(function($injector) {
    ehfs = $injector.get('ExplorationHtmlFormatterService');
  }));

  it('should correctly set interaction HTML when it is in editor mode',
    function() {
      var interactionId = 'sampleId';
      var expectedHtmlTag = '<oppia-interactive-sample-id ' +
        'last-answer="lastAnswer"' +
        '></oppia-interactive-sample-id>';
      expect(ehfs.getInteractionHtml(interactionId, null, true, null))
        .toBe(expectedHtmlTag);
    });

  it('should correctly set interaction HTML when it is in player mode',
    function() {
      var interactionId = 'sampleId';
      var focusLabel = 'sampleLabel';
      var expectedHtmlTag = '<oppia-interactive-sample-id ' +
        'last-answer="null" label-for-focus-target="' + focusLabel + '">' +
        '</oppia-interactive-sample-id>';
      expect(ehfs.getInteractionHtml(interactionId, null, false, focusLabel)
      ).toBe(expectedHtmlTag);
    });

  it('should set answer HTML correctly', function() {
    var interactionId = 'sampleId';
    var answer = 'sampleAnswer';
    var interactionCustomizationArgs = {
      choices: {
        value: 'sampleChoice'
      }
    };
    var expectedHtmlTag = '<oppia-response-sample-id ' +
      'answer="&amp;quot;' + answer + '&amp;quot;" ' +
      'choices="&amp;quot;' + interactionCustomizationArgs.choices.value +
      '&amp;quot;"></oppia-response-sample-id>';
    expect(ehfs.getAnswerHtml(answer, interactionId,
      interactionCustomizationArgs)
    ).toBe(expectedHtmlTag);
  });

  it('should set short answer HTML correctly', function() {
    var interactionId = 'sampleId';
    var answer = 'sampleAnswer';
    var interactionCustomizationArgs = {
      choices: {
        value: 'sampleChoice'
      }
    };
    var expectedHtmlTag = '<oppia-short-response-sample-id ' +
      'answer="&amp;quot;' + answer + '&amp;quot;" ' +
      'choices="&amp;quot;' + interactionCustomizationArgs.choices.value +
      '&amp;quot;"></oppia-short-response-sample-id>';
    expect(ehfs.getShortAnswerHtml(answer, interactionId,
      interactionCustomizationArgs)
    ).toBe(expectedHtmlTag);
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for GenerateContentIdService.
 */

require('domain/exploration/ContentIdsToAudioTranslationsObjectFactory.ts');
require('services/GenerateContentIdService.ts');

describe('GenerateContentIdService', function() {
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('COMPONENT_NAME_FEEDBACK', 'feedback');
    $provide.value('COMPONENT_NAME_HINT', 'hint');
    $provide.value('COMPONENT_NAME_WORKED_EXAMPLE', 'worked_example');
  }));
  var gcis = null;

  beforeEach(angular.mock.inject(function($injector) {
    gcis = $injector.get('GenerateContentIdService');
  }));

  it('should generate content id for new feedbacks', function() {
    expect(
      gcis.getNextId(['feedback_1'], 'feedback')).toEqual(
      'feedback_2');
  });

  it('should generate content id for new hint', function() {
    expect(
      gcis.getNextId(['hint_1'], 'hint')).toEqual(
      'hint_2');
  });

  it('should generate content id for new worked example', function() {
    expect(gcis.getNextId(['worked_example_1'], 'worked_example')).toEqual(
      'worked_example_2');
  });

  it('should throw error for unknown content id', function() {
    expect(function() {
      gcis.getNextId('xyz');
    }).toThrowError('Unknown component name provided.');
  });
});
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
 * @fileoverview Unit tests for HTML serialization and escaping services.
 */

require('services/HtmlEscaperService.ts');

describe('HTML escaper', function() {
  beforeEach(angular.mock.module('oppia'));

  describe('HTML escaper service', function() {
    var ohe = null;

    beforeEach(angular.mock.inject(function($injector) {
      ohe = $injector.get('HtmlEscaperService');
    }));

    it('should correctly translate between escaped and unescaped strings',
      function() {
        var strs = ['abc', 'a&b<html>', '&&&&&'];
        for (var i = 0; i < strs.length; i++) {
          expect(ohe.escapedStrToUnescapedStr(
            ohe.unescapedStrToEscapedStr(strs[i]))).toEqual(strs[i]);
        }
      }
    );

    it('should correctly escape and unescape JSON', function() {
      var objs = [{
        a: 'b'
      }, ['a', 'b'], 2, true, 'abc'];
      for (var i = 0; i < objs.length; i++) {
        expect(ohe.escapedJsonToObj(
          ohe.objToEscapedJson(objs[i]))).toEqual(objs[i]);
      }
    });
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for IdGenerationService.
 */

require('services/IdGenerationService.ts');

describe('IdGenerationService', function() {
  var IdGenerationService = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector) {
    IdGenerationService = $injector.get('IdGenerationService');
  }));

  it('should generate a random id of fixed length', function() {
    expect(IdGenerationService.generateNewId()).toMatch(/^[a-z0-9]{10}$/);
  });

  it('should generate two different ids', function() {
    var id1 = IdGenerationService.generateNewId();
    var id2 = IdGenerationService.generateNewId();
    expect(id1).not.toEqual(id2);
  });
});
// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the ImprovementCardService.
 */

require('domain/statistics/PlaythroughImprovementCardObjectFactory.ts');
require('services/ImprovementCardService.ts');

describe('ImprovementCardService', function() {
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector) {
    this.ImprovementCardService = $injector.get('ImprovementCardService');
    this.PlaythroughImprovementCardObjectFactory =
      $injector.get('PlaythroughImprovementCardObjectFactory');

    this.expectedFactories = [
      this.PlaythroughImprovementCardObjectFactory,
    ];
  }));

  describe('.getImprovementCardObjectFactoryRegistry', function() {
    it('contains all known improvement card object factories', function() {
      var actualFactories =
        this.ImprovementCardService.getImprovementCardObjectFactoryRegistry();

      // The registry should not be modifiable.
      expect(Object.isFrozen(actualFactories)).toBe(true);

      // Ordering isn't important, so allow the checks to be flexible.
      expect(actualFactories.length).toEqual(this.expectedFactories.length);
      this.expectedFactories.forEach(function(expectedFactory) {
        expect(actualFactories).toContain(expectedFactory);
      });
    });
  });

  describe('.fetchCards', function() {
    // Each individual factory should test their own fetchCards function.

    describe('from factories which all return empty cards', function() {
      beforeEach(function() {
        this.expectedFactories.forEach(function(factory) {
          spyOn(factory, 'fetchCards').and.callFake(function() {
            return Promise.resolve([]);
          });
        });
      });

      it('returns an empty list', function(done) {
        var onSuccess = function(cards) {
          expect(cards).toEqual([]);
          done();
        };
        var onFailure = function(error) {
          done.fail(error);
        };

        this.ImprovementCardService.fetchCards().then(onSuccess, onFailure);
      });
    });
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for improvements service.
 */

require('services/ImprovementsService.ts');

describe('ImprovementsService', function() {
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector) {
    this.ImprovementsService = $injector.get('ImprovementsService');
  }));

  describe('.isStateForcedToResolveOutstandingUnaddressedAnswers', function() {
    it('returns true for states with TextInput interactions', function() {
      var mockState = {interaction: {id: 'TextInput'}};

      expect(
        this.ImprovementsService
          .isStateForcedToResolveOutstandingUnaddressedAnswers(mockState)
      ).toBe(true);
    });

    it('returns false for states with FractionInput interactions', function() {
      var mockState = {interaction: {id: 'FractionInput'}};

      expect(
        this.ImprovementsService
          .isStateForcedToResolveOutstandingUnaddressedAnswers(mockState)
      ).toBe(false);
    });
  });
});
// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview unit tests for the local save services.
 */

require('domain/exploration/ExplorationDraftObjectFactory.ts');
require('services/LocalStorageService.ts');

describe('LocalStorageService', function() {
  beforeEach(angular.mock.module('oppia'));

  describe('behavior in editor', function() {
    var LocalStorageService = null;
    var ExplorationDraftObjectFactory = null;
    var explorationIdOne = '100';
    var draftChangeListIdOne = 2;
    var changeList = [];
    var explorationIdTwo = '101';
    var draftChangeListIdTwo = 1;
    var draftDictOne = {
      draftChanges: changeList,
      draftChangeListId: draftChangeListIdOne
    };
    var draftDictTwo = {
      draftChanges: changeList,
      draftChangeListId: draftChangeListIdTwo
    };
    var draftOne = null;
    var draftTwo = null;

    beforeEach(angular.mock.inject(function($injector) {
      LocalStorageService = $injector.get('LocalStorageService');
      ExplorationDraftObjectFactory = $injector.get(
        'ExplorationDraftObjectFactory');
      draftOne = ExplorationDraftObjectFactory.createFromLocalStorageDict(
        draftDictOne);
      draftTwo = ExplorationDraftObjectFactory.createFromLocalStorageDict(
        draftDictTwo);
    }));

    it('should correctly save the draft', function() {
      LocalStorageService.saveExplorationDraft(explorationIdOne,
        changeList, draftChangeListIdOne);
      LocalStorageService.saveExplorationDraft(explorationIdTwo,
        changeList, draftChangeListIdTwo);
      expect(LocalStorageService.getExplorationDraft(
        explorationIdOne)).toEqual(draftOne);
      expect(LocalStorageService.getExplorationDraft(
        explorationIdTwo)).toEqual(draftTwo);
    });

    it('should correctly remove the draft', function() {
      LocalStorageService.saveExplorationDraft(explorationIdTwo,
        changeList, draftChangeListIdTwo);
      LocalStorageService.removeExplorationDraft(explorationIdTwo);
      expect(LocalStorageService.getExplorationDraft(
        explorationIdTwo)).toBeNull();
    });
  });
});
// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit test for the page title service.
 */

require('services/PageTitleService.ts');

describe('Page title service', function() {
  beforeEach(angular.mock.module('oppia'));
  var pts = null;
  var $document = null;

  beforeEach(angular.mock.inject(function($injector) {
    $document = $injector.get('$document');
    pts = $injector.get('PageTitleService');
  }));

  it('should correctly set the page title', function() {
    pts.setPageTitle('First Title');
    expect($document[0].title).toEqual('First Title');

    pts.setPageTitle('Second Title');
    expect($document[0].title).toEqual('Second Title');
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the issues backend api service.
 */

require('domain/statistics/PlaythroughObjectFactory.ts');
require('domain/statistics/PlaythroughIssueObjectFactory.ts');
require('services/PlaythroughIssuesBackendApiService.ts');

describe('PlaythroughIssuesBackendApiService', function() {
  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    this.PlaythroughIssuesBackendApiService =
      $injector.get('PlaythroughIssuesBackendApiService');
    this.$httpBackend = $injector.get('$httpBackend');
    this.piof = $injector.get('PlaythroughIssueObjectFactory');
    this.pof = $injector.get('PlaythroughObjectFactory');
  }));

  afterEach(function() {
    this.$httpBackend.verifyNoOutstandingExpectation();
    this.$httpBackend.verifyNoOutstandingRequest();
  });

  describe('.fetch', function() {
    it('returns the issues data provided by the backend', function() {
      var backendIssues = [{
        issue_type: 'EarlyQuit',
        issue_customization_args: {
          state_name: {
            value: 'state_name1'
          },
          time_spent_in_exp_in_msecs: {
            value: 200
          }
        },
        playthrough_ids: ['playthrough_id1'],
        schema_version: 1,
        is_valid: true
      }, {
        issue_type: 'MultipleIncorrectSubmissions',
        issue_customization_args: {
          state_name: {
            value: 'state_name1'
          },
          num_times_answered_incorrectly: {
            value: 7
          }
        },
        playthrough_ids: ['playthrough_id2'],
        schema_version: 1,
        is_valid: true
      }];

      var successHandler = jasmine.createSpy('success');
      var failureHandler = jasmine.createSpy('failure');
      this.$httpBackend.expectGET(
        '/issuesdatahandler/7?exp_version=1'
      ).respond(backendIssues);

      this.PlaythroughIssuesBackendApiService.fetchIssues('7', 1).then(
        successHandler, failureHandler);
      this.$httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(
        backendIssues.map(this.piof.createFromBackendDict));
      expect(failureHandler).not.toHaveBeenCalled();
    });

    it('returns the playthrough data provided by the backend', function() {
      var backendPlaythrough = {
        exp_id: 'exp_id1',
        exp_version: 1,
        issue_type: 'EarlyQuit',
        issue_customization_args: {
          state_name: {
            value: 'state_name1'
          },
          time_spent_in_exp_in_msecs: {
            value: 200
          }
        },
        actions: [{
          action_type: 'ExplorationStart',
          action_customization_args: {
            state_name: {
              value: 'state_name1'
            }
          },
          schema_version: 1
        }]
      };

      var successHandler = jasmine.createSpy('success');
      var failureHandler = jasmine.createSpy('failure');
      this.$httpBackend.expectGET(
        '/playthroughdatahandler/7/1'
      ).respond(backendPlaythrough);

      this.PlaythroughIssuesBackendApiService.fetchPlaythrough('7', '1').then(
        successHandler, failureHandler);
      this.$httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(
        this.pof.createFromBackendDict(backendPlaythrough));
      expect(failureHandler).not.toHaveBeenCalled();
    });
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the playthrough service.
 */

require('App.ts');
require('domain/statistics/LearnerActionObjectFactory.ts');
require('services/ExplorationFeaturesService.ts');
require('services/PlaythroughService.ts');

describe('PlaythroughService', function() {
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector) {
    this.PlaythroughService = $injector.get('PlaythroughService');
    this.LearnerActionObjectFactory =
      $injector.get('LearnerActionObjectFactory');
    this.ExplorationFeaturesService =
      $injector.get('ExplorationFeaturesService');
  }));

  describe('.initSession()', function() {
    it('stores the correct values', function() {
      this.expId = 'expId';
      this.expVersion = 1;
      this.playthroughRecordingProbability = 1.0;

      this.PlaythroughService.initSession(
        this.expId, this.expVersion, this.playthroughRecordingProbability);

      var playthrough = this.PlaythroughService.getPlaythrough();
      expect(playthrough.expId).toEqual(this.expId);
      expect(playthrough.expVersion).toEqual(this.expVersion);
      expect(playthrough.actions).toEqual([]);
      expect(playthrough.issueCustomizationArgs).toEqual({});
    });
  });

  describe('recording exploration playthroughs', function() {
    beforeEach(function() {
      this.expId = 'expId';
      this.expVersion = 1;
      this.playthroughRecordingProbability = 1.0;

      this.PlaythroughService.initSession(
        this.expId, this.expVersion, this.playthroughRecordingProbability);
      spyOn(this.ExplorationFeaturesService, 'isPlaythroughRecordingEnabled')
        .and.returnValue(true);
    });

    describe('.recordExplorationStartAction()', function() {
      it('adds a learner action object to the actions array', function() {
        this.PlaythroughService.recordExplorationStartAction('initStateName1');

        var playthrough = this.PlaythroughService.getPlaythrough();
        expect(playthrough.actions).toEqual([
          this.LearnerActionObjectFactory.createNew('ExplorationStart', {
            state_name: {value: 'initStateName1'},
          }),
        ]);
      });
    });

    describe('.recordAnswerSubmitAction()', function() {
      it('adds a learner action object to the actions array', function() {
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);

        var playthrough = this.PlaythroughService.getPlaythrough();
        expect(playthrough.actions).toEqual([
          this.LearnerActionObjectFactory.createNew('AnswerSubmit', {
            state_name: {value: 'stateName1'},
            dest_state_name: {value: 'stateName2'},
            interaction_id: {value: 'TextInput'},
            submitted_answer: {value: 'Hello'},
            feedback: {value: 'Try again'},
            time_spent_state_in_msecs: {value: 30},
          }),
        ]);
      });
    });

    describe('.recordAnswerSubmitAction()', function() {
      it('adds a learner action object to the actions array', function() {
        this.PlaythroughService.recordExplorationQuitAction('stateName1', 120);

        var playthrough = this.PlaythroughService.getPlaythrough();
        expect(playthrough.actions).toEqual([
          this.LearnerActionObjectFactory.createNew('ExplorationQuit', {
            state_name: {value: 'stateName1'},
            time_spent_in_state_in_msecs: {value: 120}
          }),
        ]);
      });
    });

    describe('.recordPlaythrough()', function() {
      it('identifies multiple incorrect submissions', function() {
        this.PlaythroughService.recordExplorationStartAction('stateName1');
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);

        this.PlaythroughService.recordPlaythrough();

        var playthrough = this.PlaythroughService.getPlaythrough();
        expect(playthrough.issueType).toEqual('MultipleIncorrectSubmissions');
        expect(playthrough.issueCustomizationArgs).toEqual({
          state_name: {value: 'stateName1'},
          num_times_answered_incorrectly: {value: 5}
        });
      });

      it('identifies early quits', function() {
        this.PlaythroughService.recordExplorationStartAction('stateName1');
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordExplorationQuitAction('stateName1', 60);

        this.PlaythroughService.recordPlaythrough();

        var playthrough = this.PlaythroughService.getPlaythrough();
        expect(playthrough.issueType).toEqual('EarlyQuit');
        // We don't check the time spent issue customization arg because it is
        // flaky between tests.
        expect(playthrough.issueCustomizationArgs).toEqual(
          jasmine.objectContaining({state_name: {value: 'stateName1'}}));
      });

      it('identifies cyclic state transitions', function() {
        this.PlaythroughService.recordExplorationStartAction('stateName1');
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName2', 'stateName3', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName3', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName2', 'stateName3', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName3', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName2', 'stateName3', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName3', 'stateName1', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordExplorationQuitAction('stateName1', 30);

        this.PlaythroughService.recordPlaythrough();

        var playthrough = this.PlaythroughService.getPlaythrough();
        expect(playthrough.issueType).toEqual('CyclicStateTransitions');
        expect(playthrough.issueCustomizationArgs).toEqual({
          state_names: {
            value: ['stateName1', 'stateName2', 'stateName3', 'stateName1']
          },
        });
      });

      it('identifies p-shaped cyclic state transitions', function() {
        // A p-shaped cycle looks like:
        // [1] -> [2] -> [3] -> [4]
        //                ^      v
        //               [6] <- [5]
        // 1, 2, 3, 4, 5, 6, 3, 4, 5, 6, 3, 4, 5, 6...

        this.PlaythroughService.recordExplorationStartAction('stateName1');
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName2', 'stateName3', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName3', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName2', 'stateName3', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName3', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName2', 'stateName3', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordAnswerSubmitAction(
          'stateName3', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
        this.PlaythroughService.recordExplorationQuitAction('stateName2', 60);

        this.PlaythroughService.recordPlaythrough();

        var playthrough = this.PlaythroughService.getPlaythrough();
        expect(playthrough.issueType).toEqual('CyclicStateTransitions');
        // The cycle is stateName2->stateName3->stateName2.
        expect(playthrough.issueCustomizationArgs).toEqual({
          state_names: {value: ['stateName2', 'stateName3', 'stateName2']},
        });
      });
    });
  });

  describe('disabling recording playthroughs for an exploration', function() {
    it('should not record learner actions', function() {
      this.expId = 'expId';
      this.expVersion = 1;
      this.playthroughRecordingProbability = 1.0;
      this.PlaythroughService.initSession(
        this.expId, this.expVersion, this.playthroughRecordingProbability);
      spyOn(this.ExplorationFeaturesService, 'isPlaythroughRecordingEnabled')
        .and.returnValue(false);

      this.PlaythroughService.recordExplorationStartAction('initStateName1');
      this.PlaythroughService.recordAnswerSubmitAction(
        'stateName1', 'stateName2', 'TextInput', 'Hello', 'Try again', 30);
      this.PlaythroughService.recordExplorationQuitAction('stateName1', 120);

      var playthrough = this.PlaythroughService.getPlaythrough();
      expect(playthrough.actions).toEqual([]);
    });
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests that the resource service is working as expected.
 */

require('App.ts');
require('services/PromoBarService.ts');

describe('Promo bar Service', function() {
  var PromoBarService, $httpBackend;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector) {
    PromoBarService = $injector.get('PromoBarService');
    $httpBackend = $injector.get('$httpBackend');
  }));

  it('should return promo bar data', function() {
    var requestUrl = '/promo_bar_handler';
    $httpBackend.expect('GET', requestUrl).respond(200, {
      promo_bar_enabled: true,
      promo_bar_message: 'test message'
    });

    PromoBarService.getPromoBarData().then(function(data) {
      expect(data.promoBarEnabled).toBe(true);
      expect(data.promoBarMessage).toBe('test message');
    });
    $httpBackend.flush();
  });
});
// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests that average ratings are being computed correctly.
 */

require('services/SearchService.ts');

describe('Search service', function() {
  var SearchService;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector) {
    SearchService = $injector.get('SearchService');
  }));

  it('should find two categories and two languages if given in url search',
    function() {
      var results = {
        categories: {
          description: '',
          itemsName: 'categories',
          masterList: [],
          numSelections: 0,
          selections: {},
          summary: ''
        },
        languageCodes: {
          description: '',
          itemsName: 'languages',
          masterList: [],
          numSelections: 0,
          selections: {},
          summary: ''
        }
      };
      var urlComponent = '?q=test&category=("Architecture"%20OR%20' +
                         '"Mathematics")&language_code=("en"%20OR%20"ar")';
      expect(SearchService.updateSearchFieldsBasedOnUrlQuery(urlComponent,
        results)).toBe('test');
      expect(results.languageCodes.selections).toEqual({
        ar: true,
        en: true
      });
      expect(results.categories.selections).toEqual({
        Architecture: true,
        Mathematics: true
      });
    });

  it('should find one category and two languages if given in url search',
    function() {
      var results = {
        categories: {
          description: '',
          itemsName: 'categories',
          masterList: [],
          numSelections: 0,
          selections: {},
          summary: ''
        },
        languageCodes: {
          description: '',
          itemsName: 'languages',
          masterList: [],
          numSelections: 0,
          selections: {},
          summary: ''
        }
      };
      var urlComponent = '?q=test&category=("Mathematics")&' +
                         'language_code=("en"%20OR%20"ar")';
      expect(SearchService.updateSearchFieldsBasedOnUrlQuery(urlComponent,
        results)).toBe('test');
      expect(results.languageCodes.selections).toEqual({
        ar: true,
        en: true
      });
      expect(results.categories.selections).toEqual({
        Mathematics: true
      });
    }
  );

  it('should find one category and one language if given in url search',
    function() {
      var results = {
        categories: {
          description: '',
          itemsName: 'categories',
          masterList: [],
          numSelections: 0,
          selections: {},
          summary: ''
        },
        languageCodes: {
          description: '',
          itemsName: 'languages',
          masterList: [],
          numSelections: 0,
          selections: {},
          summary: ''
        }
      };
      var urlComponent =
        '?q=test&category=("Mathematics")&language_code=("en")';
      expect(SearchService.updateSearchFieldsBasedOnUrlQuery(urlComponent,
        results)).toBe('test');
      expect(results.languageCodes.selections).toEqual({
        en: true
      });
      expect(results.categories.selections).toEqual({
        Mathematics: true
      });
    }
  );

  it('should find no categories and one language if given in url search',
    function() {
      var results = {
        categories: {
          description: '',
          itemsName: 'categories',
          masterList: [],
          numSelections: 0,
          selections: {},
          summary: ''
        },
        languageCodes: {
          description: '',
          itemsName: 'languages',
          masterList: [],
          numSelections: 0,
          selections: {},
          summary: ''
        }
      };
      var urlComponent = '?q=test&language_code=("en")';
      expect(SearchService.updateSearchFieldsBasedOnUrlQuery(urlComponent,
        results)).toBe('test');
      expect(results.languageCodes.selections).toEqual({
        en: true
      });
      expect(results.categories.selections).toEqual({});
    }
  );

  it('should find as many keywords as provided in search query',
    function() {
      var results = {
        categories: {
          description: '',
          itemsName: 'categories',
          masterList: [],
          numSelections: 0,
          selections: {},
          summary: ''
        },
        languageCodes: {
          description: '',
          itemsName: 'languages',
          masterList: [],
          numSelections: 0,
          selections: {},
          summary: ''
        }
      };
      var urlComponent = '?q=protractor%20test&language_code=("en")';
      expect(SearchService.updateSearchFieldsBasedOnUrlQuery(urlComponent,
        results)).toBe('protractor test');
      expect(results.languageCodes.selections).toEqual({
        en: true
      });
      expect(results.categories.selections).toEqual({});
    }
  );

  it('should not find languages nor categories when ampersand is escaped',
    function() {
      var results = {
        categories: {
          description: '',
          itemsName: 'categories',
          masterList: [],
          numSelections: 0,
          selections: {},
          summary: ''
        },
        languageCodes: {
          description: '',
          itemsName: 'languages',
          masterList: [],
          numSelections: 0,
          selections: {},
          summary: ''
        }
      };
      var urlComponent = '?q=protractor%20test%26category=("Mathematics")' +
                         '%26language_code=("en"%20OR%20"ar")';
      expect(SearchService.updateSearchFieldsBasedOnUrlQuery(urlComponent,
        results)).toBe('protractor test&category=("Mathematics")' +
                       '&language_code=("en" OR "ar")');
      expect(results.languageCodes.selections).toEqual({});
      expect(results.categories.selections).toEqual({});
    }
  );

  it('should only use correct fields when ampersand is not escaped anywhere',
    function() {
      var results = {
        categories: {
          description: '',
          itemsName: 'categories',
          masterList: [],
          numSelections: 0,
          selections: {},
          summary: ''
        },
        languageCodes: {
          description: '',
          itemsName: 'languages',
          masterList: [],
          numSelections: 0,
          selections: {},
          summary: ''
        }
      };
      var urlComponent = '?q=protractor&test&category=("Mathematics")' +
                         '&language_code=("en"%20OR%20"ar")';
      expect(
        SearchService.updateSearchFieldsBasedOnUrlQuery(urlComponent, results)
      ).toBe('protractor');
      expect(results.languageCodes.selections).toEqual({
        en: true,
        ar: true
      });
      expect(results.categories.selections).toEqual({Mathematics: true});
    }
  );

  it('should error when category selection url component is malformed',
    function() {
      var results = {
        categories: {
          description: '',
          itemsName: 'categories',
          masterList: [],
          numSelections: 0,
          selections: {},
          summary: ''
        },
        languageCodes: {
          description: '',
          itemsName: 'languages',
          masterList: [],
          numSelections: 0,
          selections: {},
          summary: ''
        }
      };
      var urlComponent = '?q=protractor%20test&category=(("Mathematics")' +
                         '&language_code=("en"%20OR%20"ar")';
      expect(function() {
        SearchService.updateSearchFieldsBasedOnUrlQuery(urlComponent, results);
      }).toThrow(new Error('Invalid search query url fragment for ' +
                           'categories: category=(("Mathematics")'));
      expect(results.languageCodes.selections).toEqual({});
      expect(results.categories.selections).toEqual({});

      var urlComponent = '?q=protractor%20test&category=("Mathematics"' +
                         '&language_code=("en"%20OR%20"ar")';
      expect(function() {
        SearchService.updateSearchFieldsBasedOnUrlQuery(urlComponent, results);
      }).toThrow(new Error('Invalid search query url fragment for ' +
                           'categories: category=("Mathematics"'));
      expect(results.languageCodes.selections).toEqual({});
      expect(results.categories.selections).toEqual({});
    }
  );

  it('should error when language selection url component is malformed',
    function() {
      var results = {
        categories: {
          description: '',
          itemsName: 'categories',
          masterList: [],
          numSelections: 0,
          selections: {},
          summary: ''
        },
        languageCodes: {
          description: '',
          itemsName: 'languages',
          masterList: [],
          numSelections: 0,
          selections: {},
          summary: ''
        }
      };
      var urlComponent = '?q=protractor%20test&category=("Mathematics")' +
                         '&language_code="en" OR "ar")';
      expect(function() {
        SearchService.updateSearchFieldsBasedOnUrlQuery(urlComponent, results);
      }).toThrow(new Error('Invalid search query url fragment for ' +
                           'languageCodes: language_code="en" OR "ar")'));
      expect(results.languageCodes.selections).toEqual({});
      expect(results.categories.selections).toEqual({
        Mathematics: true
      });

      var urlComponent = '?q=protractor%20test&category=("Mathematics")' +
                         '&language_code="en" OR "ar"';
      expect(function() {
        SearchService.updateSearchFieldsBasedOnUrlQuery(urlComponent, results);
      }).toThrow(new Error('Invalid search query url fragment for ' +
                           'languageCodes: language_code="en" OR "ar"'));
      expect(results.languageCodes.selections).toEqual({});
      expect(results.categories.selections).toEqual({
        Mathematics: true
      });
    }
  );
});
// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for SpeechSynthesisChunkerService.
 */

require('services/RteHelperService.ts');
require('services/SpeechSynthesisChunkerService.ts');

describe('Speech Synthesis Chunker Service', function() {
  var SpeechSynthesisChunkerService = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    SpeechSynthesisChunkerService = $injector.get(
      'SpeechSynthesisChunkerService');
  }));

  it('Should properly convert subtraction in LaTeX to speakable text',
    function() {
      var latex1 = '5-3';
      var latex2 = 'i-j';
      var speakableLatex1 =
        SpeechSynthesisChunkerService.formatLatexToSpeakableText(latex1);
      var speakableLatex2 =
        SpeechSynthesisChunkerService.formatLatexToSpeakableText(latex2);
      expect(speakableLatex1).toEqual('5 minus 3');
      expect(speakableLatex2).toEqual('i minus j');
    }
  );

  it('Should properly convert fractions in LaTeX to speakable text',
    function() {
      var latex1 = '\\\\frac{2}{3}';
      var latex2 = '\\\\frac{abc}{xyz}';
      var latex3 = '\\\\frac{3n}{5}';
      var latex4 = '\\\\frac{ijk}{5xy}';
      var speakableLatex1 =
        SpeechSynthesisChunkerService.formatLatexToSpeakableText(latex1);
      var speakableLatex2 =
        SpeechSynthesisChunkerService.formatLatexToSpeakableText(latex2);
      var speakableLatex3 =
        SpeechSynthesisChunkerService.formatLatexToSpeakableText(latex3);
      var speakableLatex4 =
        SpeechSynthesisChunkerService.formatLatexToSpeakableText(latex4);
      expect(speakableLatex1).toEqual('2/3');
      expect(speakableLatex2).toEqual('a b c over x y z');
      expect(speakableLatex3).toEqual('3n over 5');
      expect(speakableLatex4).toEqual('i j k over 5x y');
    }
  );

  it('Should properly convert square roots in LaTeX to speakable text',
    function() {
      var latex1 = '\\\\sqrt{3}';
      var latex2 = '\\\\sqrt{xy}';
      var speakableLatex1 =
        SpeechSynthesisChunkerService.formatLatexToSpeakableText(latex1);
      var speakableLatex2 =
        SpeechSynthesisChunkerService.formatLatexToSpeakableText(latex2);
      expect(speakableLatex1).toEqual('the square root of 3');
      expect(speakableLatex2).toEqual('the square root of x y');
    }
  );

  it('Should properly convert exponents in LaTeX to speakable text',
    function() {
      var latex1 = 'x^2';
      var latex2 = '42^4';
      var latex3 = 'x^62';
      var latex4 = '3n^4x';
      var speakableLatex1 =
        SpeechSynthesisChunkerService.formatLatexToSpeakableText(latex1);
      var speakableLatex2 =
        SpeechSynthesisChunkerService.formatLatexToSpeakableText(latex2);
      var speakableLatex3 =
        SpeechSynthesisChunkerService.formatLatexToSpeakableText(latex3);
      var speakableLatex4 =
        SpeechSynthesisChunkerService.formatLatexToSpeakableText(latex4);
      expect(speakableLatex1).toEqual('x^2');
      expect(speakableLatex2).toEqual('42 to the power of 4');
      expect(speakableLatex3).toEqual('x to the power of 62');
      expect(speakableLatex4).toEqual('3n to the power of 4x');
    }
  );

  it ('Should properly convert trigonometric functions in LaTeX to ' +
      'speakable text', function() {
    var latex1 = '\\\\sin{90}';
    var latex2 = '\\\\cos{0}';
    var latex3 = '\\\\tan{uv}';
    var speakableLatex1 =
        SpeechSynthesisChunkerService.formatLatexToSpeakableText(latex1);
    var speakableLatex2 =
        SpeechSynthesisChunkerService.formatLatexToSpeakableText(latex2);
    var speakableLatex3 =
        SpeechSynthesisChunkerService.formatLatexToSpeakableText(latex3);
    expect(speakableLatex1).toEqual('the sine of 90');
    expect(speakableLatex2).toEqual('the cosine of 0');
    expect(speakableLatex3).toEqual('the tangent of u v');
  });
});
// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the BackgroundMaskService.
 */

require('services/stateful/BackgroundMaskService.ts');

describe('Background Mask Service', function() {
  var BackgroundMaskService;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector) {
    BackgroundMaskService = $injector.get('BackgroundMaskService');
  }));

  it('should activate mask', function() {
    BackgroundMaskService.activateMask();
    expect(BackgroundMaskService.isMaskActive()).toBe(true);
  });

  it('should deactivate mask', function() {
    BackgroundMaskService.deactivateMask();
    expect(BackgroundMaskService.isMaskActive()).toBe(false);
  });
});
// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the FocusManagerService.
 */

require('App.ts');
require('services/IdGenerationService.ts');
require('services/contextual/DeviceInfoService.ts');
require('services/stateful/FocusManagerService.ts');

describe('Focus Manager Service', function() {
  var FocusManagerService;
  var DeviceInfoService;
  var IdGenerationService;
  var rootScope;
  var $timeout;
  var clearLabel;
  var focusLabel = 'FocusLabel';
  var focusLabelTwo = 'FocusLabelTwo';

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector) {
    clearLabel = $injector.get('LABEL_FOR_CLEARING_FOCUS');
    FocusManagerService = $injector.get('FocusManagerService');
    DeviceInfoService = $injector.get('DeviceInfoService');
    IdGenerationService = $injector.get('IdGenerationService');
    rootScope = $injector.get('$rootScope');
    $timeout = $injector.get('$timeout');
    spyOn(rootScope, '$broadcast');
  }));

  it('should generate a random string for focus label', function() {
    spyOn(IdGenerationService, 'generateNewId');
    FocusManagerService.generateFocusLabel();
    expect(IdGenerationService.generateNewId).toHaveBeenCalled();
  });

  it('should set focus label and broadcast it', function() {
    FocusManagerService.setFocus(focusLabel);
    $timeout(function() {
      expect(rootScope.$broadcast).toHaveBeenCalledWith('focusOn', focusLabel);
    });
    $timeout.flush();
  });

  it('should not set focus label if _nextLabelToFocusOn is set', function() {
    FocusManagerService.setFocus(focusLabel);
    expect(FocusManagerService.setFocus(focusLabelTwo)).toEqual(undefined);
    $timeout.flush();
    $timeout.verifyNoPendingTasks();
    expect(rootScope.$broadcast).toHaveBeenCalledWith('focusOn', focusLabel);
  });

  it('should set label to clear focus and broadcast it', function() {
    FocusManagerService.clearFocus();
    $timeout(function() {
      expect(rootScope.$broadcast).toHaveBeenCalledWith('focusOn', clearLabel);
    });
    $timeout.flush();
  });

  it('should set focus label if on desktop and broadcast it', function() {
    FocusManagerService.setFocusIfOnDesktop(focusLabel);
    if (!DeviceInfoService.isMobileDevice()) {
      $timeout(function() {
        expect(rootScope.$broadcast).toHaveBeenCalledWith(
          'focusOn', focusLabel);
      });
      $timeout.flush();
    }
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for state rules stats service.
 */

require('App.ts');
require('services/StateRulesStatsService.ts');

describe('State Rules Stats Service', function() {
  var StateRulesStatsService = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector) {
    StateRulesStatsService = $injector.get('StateRulesStatsService');
  }));

  it(
    'should claim text-input interaction states support issues overview',
    function() {
      // Only including properties required to identify supported states.
      var TEXT_INPUT_STATE = {interaction: {id: 'TextInput'}};

      expect(
        StateRulesStatsService.stateSupportsImprovementsOverview(
          TEXT_INPUT_STATE)
      ).toBe(true);
    });

  describe('Stats Computation', function() {
    var $httpBackend = null;
    beforeEach(angular.mock.inject(function($injector) {
      $httpBackend = $injector.get('$httpBackend');
    }));
    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    var EXPLORATION_ID = '7';
    beforeEach(angular.mock.inject(function(ContextService) {
      spyOn(
        ContextService, 'getExplorationId'
      ).and.returnValue(EXPLORATION_ID);
    }));

    it('should respond with answer frequencies', function() {
      // Only including properties required for stat computation.
      var HOLA_STATE = {name: 'Hola', interaction: {id: 'TextInput'}};
      // Only including properties required for stat computation.
      var HOLA_STATE_RULES_STATS_RESPONSE = {
        visualizations_info: [{
          data: [
            {answer: 'Ni Hao', frequency: 5},
            {answer: 'Aloha', frequency: 3},
            {answer: 'Hola', frequency: 1}
          ]
        }]
      };
      var successHandler = jasmine.createSpy('success');
      var failureHandler = jasmine.createSpy('failure');
      $httpBackend.expectGET('/createhandler/state_rules_stats/7/Hola').respond(
        HOLA_STATE_RULES_STATS_RESPONSE
      );

      StateRulesStatsService.computeStateRulesStats(
        HOLA_STATE
      ).then(successHandler, failureHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(
        jasmine.objectContaining({
          visualizations_info: [jasmine.objectContaining({
            data: [
              {answer: 'Ni Hao', frequency: 5},
              {answer: 'Aloha', frequency: 3},
              {answer: 'Hola', frequency: 1}
            ]
          })]
        })
      );
      expect(failureHandler).not.toHaveBeenCalled();
    });

    it('should handle addressed info for TextInput', function() {
      // Only including properties required for stat computation.
      var HOLA_STATE = {
        name: 'Hola',
        interaction: {
          answerGroups: [{
            rules: [{type: 'Equals', inputs: {x: 'hola!'}}],
            outcome: {dest: 'Me Llamo'}
          }, {
            rules: [{type: 'Contains', inputs: {x: 'hola'}}],
            outcome: {dest: 'Me Llamo'}
          }, {
            rules: [{type: 'FuzzyEquals', inputs: {x: 'hola'}}],
            outcome: {dest: 'Hola'}
          }],
          defaultOutcome: {dest: 'Hola'},
          id: 'TextInput'
        }
      };
      // Only including properties required for stat computation.
      var HOLA_STATE_RULES_STATS_RESPONSE = {
        visualizations_info: [{
          data: [{answer: 'Ni Hao'}, {answer: 'Aloha'}, {answer: 'Hola'}],
          addressed_info_is_supported: true
        }]
      };
      var successHandler = jasmine.createSpy('success');
      var failureHandler = jasmine.createSpy('failure');
      $httpBackend.expectGET('/createhandler/state_rules_stats/7/Hola').respond(
        HOLA_STATE_RULES_STATS_RESPONSE);

      StateRulesStatsService.computeStateRulesStats(HOLA_STATE).then(
        successHandler, failureHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(
        jasmine.objectContaining({
          visualizations_info: [jasmine.objectContaining({
            data: [
              jasmine.objectContaining({answer: 'Ni Hao', is_addressed: false}),
              jasmine.objectContaining({answer: 'Aloha', is_addressed: false}),
              jasmine.objectContaining({answer: 'Hola', is_addressed: true})
            ]
          })]
        })
      );
      expect(failureHandler).not.toHaveBeenCalled();
    });

    it('should convert FractionInput into readable strings', function() {
      var successHandler = jasmine.createSpy('success');
      var failureHandler = jasmine.createSpy('failure');

      $httpBackend.expectGET(
        '/createhandler/state_rules_stats/7/Fraction').respond(
        {visualizations_info: [{
          data: [
            {
              answer: {
                isNegative: false,
                wholeNumber: 0,
                numerator: 1,
                denominator: 2
              },
              frequency: 3
            },
            {
              answer: {
                isNegative: false,
                wholeNumber: 0,
                numerator: 0,
                denominator: 1
              },
              frequency: 5
            }]
        }]});

      StateRulesStatsService.computeStateRulesStats(
        {name: 'Fraction', interaction: {id: 'FractionInput'}}).then(
        successHandler, failureHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(
        jasmine.objectContaining({
          visualizations_info: [jasmine.objectContaining({
            data: [
              jasmine.objectContaining({ answer: '1/2' }),
              jasmine.objectContaining({ answer: '0' })
            ]
          })]
        })
      );
    });

    it('should not fetch or return answers for null interactions', function() {
      var MOCK_STATE = {name: 'Hola', interaction: {id: null}};
      var successHandler = jasmine.createSpy('success');
      var failureHandler = jasmine.createSpy('failure');

      StateRulesStatsService.computeStateRulesStats(MOCK_STATE)
        .then(successHandler, failureHandler);

      expect($httpBackend.flush).toThrowError(/No pending request to flush/);
      expect(successHandler).toHaveBeenCalledWith(jasmine.objectContaining({
        visualizations_info: [],
      }));
      expect(failureHandler).not.toHaveBeenCalled();
    });
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for StateTopAnswersStatsBackendApiService.
 */

require('services/StateTopAnswersStatsBackendApiService.ts');

describe('StateTopAnswersStatsBackendApiService', function() {
  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    this.StateTopAnswersStatsBackendApiService =
      $injector.get('StateTopAnswersStatsBackendApiService');
    this.$httpBackend = $injector.get('$httpBackend');
  }));

  afterEach(function() {
    this.$httpBackend.verifyNoOutstandingExpectation();
    this.$httpBackend.verifyNoOutstandingRequest();
  });

  describe('.fetchStats', function() {
    it('returns the data provided by the backend.', function() {
      var backendDict = {
        answers: {
          Hola: [
            {answer: 'hola', frequency: 7},
            {answer: 'adios', frequency: 5},
            {answer: 'que?', frequency: 2},
          ]
        },
        interaction_ids: {Hola: 'TextInput'},
      };
      var successHandler = jasmine.createSpy('success');
      var failureHandler = jasmine.createSpy('failure');
      this.$httpBackend.expectGET(
        '/createhandler/state_answer_stats/7'
      ).respond(backendDict);

      this.StateTopAnswersStatsBackendApiService.fetchStats('7').then(
        successHandler, failureHandler);
      this.$httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(backendDict);
      expect(failureHandler).not.toHaveBeenCalled();
    });
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for domain object which holds the list of top answer
 * statistics for a particular state.
 */

require('App.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require('services/StateTopAnswersStatsService.ts');

var joC = jasmine.objectContaining;

describe('StateTopAnswersStatsService', function() {
  var $q = null;
  var $rootScope = null;
  var $uibModal = null;
  var ChangeListService = null;
  var ContextService = null;
  var ExplorationStatesService = null;
  var RuleObjectFactory = null;
  var StateTopAnswersStatsService = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function(
      _$q_, _$rootScope_, _$uibModal_, _ChangeListService_, _ContextService_,
      _ExplorationStatesService_, _RuleObjectFactory_,
      _StateTopAnswersStatsService_) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    $uibModal = _$uibModal_;
    ChangeListService = _ChangeListService_;
    ContextService = _ContextService_;
    ExplorationStatesService = _ExplorationStatesService_;
    RuleObjectFactory = _RuleObjectFactory_;
    StateTopAnswersStatsService = _StateTopAnswersStatsService_;

    ExplorationStatesService.init({
      Hola: {
        content: {content_id: 'content', html: ''},
        param_changes: [],
        interaction: {
          answer_groups: [{
            rule_specs: [{rule_type: 'Contains', inputs: {x: 'hola'}}],
            outcome: {
              dest: 'Me Llamo',
              feedback: {content_id: 'feedback_1', html: 'buen trabajo!'},
              labelled_as_correct: true,
            },
          }],
          default_outcome: {
            dest: 'Hola',
            feedback: {content_id: 'default_outcome', html: 'try again!'},
            labelled_as_correct: false,
          },
          hints: [],
          id: 'TextInput',
        },
        classifier_model_id: 0,
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {},
          },
        },
        solicit_answer_details: false,
        written_translations: {
          translations_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {},
          },
        },
      },
    });

    spyOn(ContextService, 'getExplorationId').and.returnValue('7');
  }));

  describe('.isInitialized', function() {
    it('begins uninitialized', function() {
      expect(StateTopAnswersStatsService.isInitialized()).toBe(false);
    });

    it('is true after call to .init', function() {
      StateTopAnswersStatsService.init({answers: {}, interaction_ids: {}});

      expect(StateTopAnswersStatsService.isInitialized()).toBe(true);
    });
  });

  describe('.init', function() {
    it('correctly identifies unaddressed issues', function() {
      StateTopAnswersStatsService.init({
        answers: {
          Hola: [
            {answer: 'hola', frequency: 7},
            {answer: 'adios', frequency: 4},
            {answer: 'que?', frequency: 2},
          ]
        },
        interaction_ids: {Hola: 'TextInput'},
      });

      var stateStats = StateTopAnswersStatsService.getStateStats('Hola');
      expect(stateStats).toContain(joC({answer: 'hola', isAddressed: true}));
      expect(stateStats).toContain(joC({answer: 'adios', isAddressed: false}));
      expect(stateStats).toContain(joC({answer: 'que?', isAddressed: false}));
    });

    it('maintains frequency in order', function() {
      StateTopAnswersStatsService.init({
        answers: {
          Hola: [
            {answer: 'hola', frequency: 7},
            {answer: 'adios', frequency: 4},
            {answer: 'que?', frequency: 2},
          ]
        },
        interaction_ids: {Hola: 'TextInput'},
      });

      expect(StateTopAnswersStatsService.getStateStats('Hola')).toEqual([
        joC({answer: 'hola', frequency: 7}),
        joC({answer: 'adios', frequency: 4}),
        joC({answer: 'que?', frequency: 2}),
      ]);
    });

    it('throws when fetching stats about non-existent states', function() {
      expect(function() {
        StateTopAnswersStatsService.getStateStats('Me Llamo');
      }).toThrow();
    });

    it('registers handlers to ExplorationStatesService', function() {
      var expectedRegistrationFunctions = [
        spyOn(ExplorationStatesService, 'registerOnStateAddedCallback'),
        spyOn(ExplorationStatesService, 'registerOnStateDeletedCallback'),
        spyOn(ExplorationStatesService, 'registerOnStateRenamedCallback'),
        spyOn(ExplorationStatesService,
          'registerOnStateInteractionSavedCallback')
      ];

      StateTopAnswersStatsService.init({answers: {}, interaction_ids: {}});

      expectedRegistrationFunctions.forEach(function(registrationFunction) {
        expect(registrationFunction).toHaveBeenCalled();
      });
    });

    it('does not register duplicate handlers if called again', function() {
      var expectedRegistrationFunctions = [
        spyOn(ExplorationStatesService, 'registerOnStateAddedCallback'),
        spyOn(ExplorationStatesService, 'registerOnStateDeletedCallback'),
        spyOn(ExplorationStatesService, 'registerOnStateRenamedCallback'),
        spyOn(ExplorationStatesService,
          'registerOnStateInteractionSavedCallback')
      ];

      StateTopAnswersStatsService.init({answers: {}, interaction_ids: {}});
      // Second call should not add more callbacks.
      StateTopAnswersStatsService.init({answers: {}, interaction_ids: {}});

      expectedRegistrationFunctions.forEach(function(registrationFunction) {
        expect(registrationFunction.calls.count()).toEqual(1);
      });
    });
  });

  describe('.hasStateStats', function() {
    it('is false when uninitialized', function() {
      expect(StateTopAnswersStatsService.isInitialized()).toBe(false);
      expect(StateTopAnswersStatsService.hasStateStats('Hola')).toBe(false);
    });

    it('is true when the state contains answers', function() {
      StateTopAnswersStatsService.init({
        answers: {Hola: [{answer: 'hola', frequency: 3}]},
        interaction_ids: {Hola: 'TextInput'},
      });

      expect(StateTopAnswersStatsService.hasStateStats('Hola')).toBe(true);
    });

    it('is true even when the state contains no answers', function() {
      StateTopAnswersStatsService.init(
        {answers: {Hola: []}, interaction_ids: {Hola: 'TextInput'}}
      );

      expect(StateTopAnswersStatsService.hasStateStats('Hola')).toBe(true);
    });

    it('is false when the state does not exist', function() {
      StateTopAnswersStatsService.init({
        answers: {Hola: [{answer: 'hola', frequency: 3}]},
        interaction_ids: {Hola: 'TextInput'},
      });

      expect(StateTopAnswersStatsService.hasStateStats('Me Llamo')).toBe(false);
    });
  });

  describe('.getStateNamesWithStats', function() {
    it('only returns state names that have stats', function() {
      StateTopAnswersStatsService.init({
        answers: {Hola: [{answer: 'hola', frequency: 3}]},
        interaction_ids: {Hola: 'TextInput'},
      });

      expect(StateTopAnswersStatsService.getStateNamesWithStats())
        .toEqual(['Hola']);
    });
  });

  describe('Cache Maintenance', function() {
    beforeEach(function() {
      StateTopAnswersStatsService.init({
        answers: {
          Hola: [
            {answer: 'hola', frequency: 7},
            {answer: 'adios', frequency: 4},
            {answer: 'que?', frequency: 2},
          ]
        },
        interaction_ids: {Hola: 'TextInput'},
      });
    });

    describe('State Addition', function() {
      it('creates a new empty list of stats for the new state', function() {
        spyOn(ChangeListService, 'addState');
        expect(function() {
          StateTopAnswersStatsService.getStateStats('Me Llamo');
        }).toThrow();

        ExplorationStatesService.addState('Me Llamo');

        expect(StateTopAnswersStatsService.getStateStats('Me Llamo'))
          .toEqual([]);
      });
    });

    describe('State Deletion', function() {
      it('throws an error after deleting the stats', function(done) {
        spyOn($uibModal, 'open').and.callFake(function() {
          return {result: $q.resolve()};
        });
        spyOn(ChangeListService, 'deleteState');

        ExplorationStatesService.deleteState('Hola').then(function() {
          expect(function() {
            StateTopAnswersStatsService.getStateStats('Hola');
          }).toThrow();
        }).then(done, done.fail);
        $rootScope.$digest();
      });
    });

    describe('State Renaming', function() {
      it('only recognizes the renamed state', function() {
        spyOn(ChangeListService, 'renameState');
        var oldStats = StateTopAnswersStatsService.getStateStats('Hola');

        ExplorationStatesService.renameState('Hola', 'Bonjour');

        expect(StateTopAnswersStatsService.getStateStats('Bonjour'))
          .toBe(oldStats);

        expect(function() {
          StateTopAnswersStatsService.getStateStats('Hola');
        }).toThrow();
      });
    });

    describe('State Answer Groups Changes', function() {
      beforeEach(function() {
        spyOn(ChangeListService, 'editStateProperty');
      });

      it('recognizes newly resolved answers', function() {
        expect(StateTopAnswersStatsService.getUnresolvedStateStats('Hola'))
          .toContain(joC({answer: 'adios'}));

        var newAnswerGroups = angular.copy(
          ExplorationStatesService.getState('Hola').interaction.answerGroups);
        newAnswerGroups[0].rules = [
          RuleObjectFactory.createNew('Contains', {x: 'adios'})
        ];
        ExplorationStatesService.saveInteractionAnswerGroups(
          'Hola', newAnswerGroups);

        expect(StateTopAnswersStatsService.getUnresolvedStateStats('Hola'))
          .not.toContain(joC({answer: 'adios'}));
      });

      it('recognizes newly unresolved answers', function() {
        expect(StateTopAnswersStatsService.getUnresolvedStateStats('Hola'))
          .not.toContain(joC({answer: 'hola'}));

        var newAnswerGroups = angular.copy(
          ExplorationStatesService.getState('Hola').interaction.answerGroups);
        newAnswerGroups[0].rules = [
          RuleObjectFactory.createNew('Contains', {x: 'bonjour'})
        ];
        ExplorationStatesService.saveInteractionAnswerGroups(
          'Hola', newAnswerGroups);

        expect(StateTopAnswersStatsService.getUnresolvedStateStats('Hola'))
          .toContain(joC({answer: 'hola'}));
      });

      it('removes stat answers when interaction changes', function() {
        expect(StateTopAnswersStatsService.getStateStats('Hola').length)
          .toBeGreaterThan(0);

        ExplorationStatesService.saveInteractionId('Hola', 'FractionInput');
        ExplorationStatesService.saveInteractionCustomizationArgs('Hola', {
          requireSimplestForm: false,
          allowImproperFraction: true,
          allowNonzeroIntegerPart: true,
          customPlaceholder: '',
        });

        expect(StateTopAnswersStatsService.getStateStats('Hola').length)
          .toEqual(0);
      });

      it('permits null interaction ids', function() {
        expect(StateTopAnswersStatsService.getStateStats('Hola').length)
          .toBeGreaterThan(0);

        ExplorationStatesService.saveInteractionId('Hola', null);
        ExplorationStatesService.saveInteractionCustomizationArgs('Hola', {});

        expect(StateTopAnswersStatsService.getStateStats('Hola').length)
          .toEqual(0);
      });
    });
  });
});
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests that the user service is working as expected.
 */

require('domain/utilities/UrlInterpolationService.ts');
require('services/UserService.ts');

describe('User Service', function() {
  var UserService, $httpBackend, UrlInterpolationService;
  var UserInfoObjectFactory;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector) {
    UserService = $injector.get('UserService');
    UrlInterpolationService = $injector.get(
      'UrlInterpolationService');
    UserInfoObjectFactory = $injector.get(
      'UserInfoObjectFactory');
    $httpBackend = $injector.get('$httpBackend');
  }));

  it('should return userInfo data', function() {
    // creating a test user for checking profile picture of user.
    var sampleUserInfoBackendObject = {
      is_moderator: false,
      is_admin: false,
      is_super_admin: false,
      is_topic_manager: false,
      can_create_collections: true,
      preferred_site_language_code: null,
      username: 'tester',
      user_is_logged_in: true
    };

    $httpBackend.expect('GET', '/userinfohandler').respond(
      200, sampleUserInfoBackendObject);

    var sampleUserInfo = UserInfoObjectFactory.createFromBackendDict(
      sampleUserInfoBackendObject);

    UserService.getUserInfoAsync().then(function(userInfo) {
      expect(userInfo.isAdmin()).toBe(sampleUserInfo.isAdmin());
      expect(userInfo.isSuperAdmin()).toBe(sampleUserInfo.isSuperAdmin());
      expect(userInfo.isModerator()).toBe(sampleUserInfo.isModerator());
      expect(userInfo.isTopicManager()).toBe(sampleUserInfo.isTopicManager());
      expect(userInfo.isLoggedIn()).toBe(
        sampleUserInfo.isLoggedIn());
      expect(userInfo.canCreateCollections()).toBe(
        sampleUserInfo.canCreateCollections());
      expect(userInfo.getUsername()).toBe(sampleUserInfo.getUsername());
      expect(userInfo.getPreferredSiteLanguageCode()).toBe(
        sampleUserInfo.getPreferredSiteLanguageCode());
    });

    $httpBackend.flush();
  });

  it('should return image data', function() {
    var requestUrl = '/preferenceshandler/profile_picture';
    // Create a test user for checking profile picture of user.
    var sampleUserInfoBackendObject = {
      is_moderator: false,
      is_admin: false,
      is_super_admin: false,
      is_topic_manager: false,
      can_create_collections: true,
      preferred_site_language_code: null,
      username: 'tester',
      user_is_logged_in: true
    };
    $httpBackend.expect('GET', '/userinfohandler').respond(
      200, sampleUserInfoBackendObject);

    $httpBackend.expect('GET', requestUrl).respond(
      200, {profile_picture_data_url: 'image data'});

    UserService.getProfileImageDataUrlAsync().then(function(dataUrl) {
      expect(dataUrl).toBe('image data');
    });
    $httpBackend.flush();

    $httpBackend.when('GET', '/userinfohandler').respond(
      200, sampleUserInfoBackendObject);
    $httpBackend.when('GET', requestUrl).respond(404);

    UserService.getProfileImageDataUrlAsync().then(function(dataUrl) {
      expect(dataUrl).toBe(UrlInterpolationService.getStaticImageUrl(
        '/avatar/user_blue_72px.png'));
    });
    $httpBackend.flush();
  });
});
