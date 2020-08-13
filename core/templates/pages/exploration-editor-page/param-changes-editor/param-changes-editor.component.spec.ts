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
 * @fileoverview Unit tests for paramChangesEditor.
 */

import { TestBed } from '@angular/core/testing';
import { ParamChangeObjectFactory } from
  'domain/exploration/ParamChangeObjectFactory';
import { AngularNameService } from
  'pages/exploration-editor-page/services/angular-name.service';
import { AnswerGroupsCacheService } from
  // eslint-disable-next-line max-len
  'pages/exploration-editor-page/editor-tab/services/answer-groups-cache.service';
import { TextInputRulesService } from
  'interactions/TextInput/directives/text-input-rules.service';
import { OutcomeObjectFactory } from 'domain/exploration/OutcomeObjectFactory';
import { StateInteractionIdService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { StateSolutionService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-solution.service';
import { StateParamChangesService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-param-changes.service';
import { AlertsService } from 'services/alerts.service';
import { ParamSpecsObjectFactory } from
  'domain/exploration/ParamSpecsObjectFactory';
import { StateCustomizationArgsService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-customization-args.service';

describe('Param Changes Editor Component', function() {
  var ctrl = null;
  var $rootScope = null;
  var $scope = null;
  var alertsService = null;
  var editabilityService = null;
  var explorationParamSpecsService = null;
  var explorationStatesService = null;
  var paramChangeObjectFactory = null;
  var paramSpecsObjectFactory = null;
  var stateParamChangesService = null;

  var postSaveHookSpy = jasmine.createSpy('postSaveHook', () => {});

  beforeEach(angular.mock.module('oppia'));

  beforeEach(function() {
    alertsService = TestBed.get(AlertsService);
    paramChangeObjectFactory = TestBed.get(ParamChangeObjectFactory);
    paramSpecsObjectFactory = TestBed.get(ParamSpecsObjectFactory);
    stateParamChangesService = TestBed.get(StateParamChangesService);
  });
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('ExplorationDataService', {
      autosaveChangeList: function() {}
    });

    $provide.value('AngularNameService', TestBed.get(AngularNameService));
    $provide.value(
      'AnswerGroupsCacheService', TestBed.get(AnswerGroupsCacheService));
    $provide.value(
      'TextInputRulesService',
      TestBed.get(TextInputRulesService));
    $provide.value(
      'OutcomeObjectFactory', TestBed.get(OutcomeObjectFactory));
    $provide.value(
      'StateCustomizationArgsService',
      TestBed.get(StateCustomizationArgsService));
    $provide.value('StateInteractionIdService',
      TestBed.get(StateInteractionIdService));
    $provide.value('StateSolutionService',
      TestBed.get(StateSolutionService));
  }));
  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $rootScope = $injector.get('$rootScope');
    editabilityService = $injector.get('EditabilityService');
    explorationParamSpecsService = $injector.get(
      'ExplorationParamSpecsService');
    explorationStatesService = $injector.get('ExplorationStatesService');

    explorationParamSpecsService.init(
      paramSpecsObjectFactory.createFromBackendDict({
        y: {
          obj_type: 'UnicodeString'
        },
        a: {
          obj_type: 'UnicodeString'
        }
      }));
    stateParamChangesService.init('', []);

    $scope = $rootScope.$new();
    ctrl = $componentController('paramChangesEditor', {
      $scope: $scope,
      AlertsService: alertsService,
      ParamChangeObjectFactory: paramChangeObjectFactory
    }, {
      paramChangesService: stateParamChangesService,
      postSaveHook: postSaveHookSpy,
      isCurrentlyInSettingsTab: () => false
    });
    ctrl.$onInit();
  }));

  it('should evaluate $scope properties after controller initialization',
    function() {
      expect($scope.isParamChangesEditorOpen).toBe(false);
      expect($scope.warningText).toBe('');
      expect($scope.paramNameChoices).toEqual([]);
    });

  it('should reset customization args from param change when change generator' +
    ' type', function() {
    var paramChange = paramChangeObjectFactory.createFromBackendDict({
      customization_args: {
        list_of_values: ['first value', 'second value']
      },
      generator_id: 'RandomSelector',
      name: 'a'
    });

    $scope.onChangeGeneratorType(paramChange);

    expect(paramChange.customizationArgs).toEqual({
      list_of_values: ['sample value']
    });
  });

  it('should get static image url', function() {
    expect($scope.getStaticImageUrl('/path/to/image.png')).toBe(
      '/assets/images/path/to/image.png');
  });

  it('should save param changes when externalSave is broadcasted', function() {
    spyOn(editabilityService, 'isEditable').and.returnValue(true);
    var saveParamChangesSpy = spyOn(
      explorationStatesService, 'saveStateParamChanges').and.callFake(() => {});
    $scope.addParamChange();
    $scope.openParamChangesEditor();

    $rootScope.$broadcast('externalSave');

    expect(saveParamChangesSpy).toHaveBeenCalled();
    expect(postSaveHookSpy).toHaveBeenCalled();
  });

  it('should add a new param change when there are no param changes displayed',
    function() {
      expect(ctrl.paramChangesService.displayed.length).toBe(0);
      $scope.addParamChange();

      expect($scope.paramNameChoices).toEqual([{
        id: 'a',
        text: 'a'
      }, {
        id: 'x',
        text: 'x'
      }, {
        id: 'y',
        text: 'y'
      }]);
      expect(ctrl.paramChangesService.displayed.length).toBe(1);
    });

  it('should not open param changes editor when it is not editable',
    function() {
      spyOn(editabilityService, 'isEditable').and.returnValue(false);

      expect(ctrl.paramChangesService.displayed.length).toBe(0);
      $scope.openParamChangesEditor();

      expect($scope.isParamChangesEditorOpen).toBe(false);
      expect(ctrl.paramChangesService.displayed.length).toBe(0);
    });

  it('should open param changes editor and cancel edit', function() {
    spyOn(editabilityService, 'isEditable').and.returnValue(true);
    expect(ctrl.paramChangesService.displayed.length).toBe(0);

    $scope.openParamChangesEditor();

    expect($scope.isParamChangesEditorOpen).toBe(true);
    expect(ctrl.paramChangesService.displayed.length).toBe(1);

    $scope.cancelEdit();

    expect($scope.isParamChangesEditorOpen).toBe(false);
    expect(ctrl.paramChangesService.displayed.length).toBe(0);
  });

  it('should open param changes editor and add a param change', function() {
    spyOn(editabilityService, 'isEditable').and.returnValue(true);

    expect(ctrl.paramChangesService.displayed.length).toBe(0);
    $scope.openParamChangesEditor();

    expect($scope.isParamChangesEditorOpen).toBe(true);
    expect($scope.paramNameChoices).toEqual([{
      id: 'a',
      text: 'a'
    }, {
      id: 'y',
      text: 'y'
    }]);
    expect(ctrl.paramChangesService.displayed.length).toBe(1);
  });

  it('should check when param changes are valid', function() {
    $scope.addParamChange();

    expect($scope.areDisplayedParamChangesValid()).toBe(true);
    expect($scope.warningText).toBe('');
  });

  it('should check param changes as invalid when it has an empty parameter' +
    ' name', function() {
    ctrl.paramChangesService.displayed = [
      paramChangeObjectFactory.createDefault('')];

    expect($scope.areDisplayedParamChangesValid()).toBe(false);
    expect($scope.warningText).toBe('Please pick a non-empty parameter name.');
  });

  it('should check param changes as invalid when it has a reserved parameter' +
    ' name', function() {
    ctrl.paramChangesService.displayed = [
      paramChangeObjectFactory.createDefault('answer')];

    expect($scope.areDisplayedParamChangesValid()).toBe(false);
    expect($scope.warningText).toBe(
      'The parameter name \'answer\' is reserved.');
  });

  it('should check param changes as invalid when it has non alphabetic' +
    ' characters in parameter name', function() {
    ctrl.paramChangesService.displayed = [
      paramChangeObjectFactory.createDefault('123')];

    expect($scope.areDisplayedParamChangesValid()).toBe(false);
    expect($scope.warningText).toBe(
      'Parameter names should use only alphabetic characters.');
  });

  it('should check param changes as invalid when it has no default' +
    ' generator id', function() {
    ctrl.paramChangesService.displayed = [
      paramChangeObjectFactory.createFromBackendDict({
        customization_args: {},
        generator_id: '',
        name: 'a'
      })];

    $scope.areDisplayedParamChangesValid();
    expect($scope.areDisplayedParamChangesValid()).toBe(false);
    expect($scope.warningText).toBe(
      'Each parameter should have a generator id.');
  });

  it('should check param changes as invalid when it has no values and its' +
    ' generator id is RandomSelector', function() {
    ctrl.paramChangesService.displayed = [
      paramChangeObjectFactory.createFromBackendDict({
        customization_args: {
          list_of_values: []
        },
        generator_id: 'RandomSelector',
        name: 'a'
      })];

    $scope.areDisplayedParamChangesValid();
    expect($scope.areDisplayedParamChangesValid()).toBe(false);
    expect($scope.warningText).toBe(
      'Each parameter should have at least one possible value.');
  });

  it('should not save param changes when it is invalid', function() {
    spyOn(alertsService, 'addWarning');
    ctrl.paramChangesService.displayed = [
      paramChangeObjectFactory.createDefault('123')];
    $scope.saveParamChanges();

    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Invalid parameter changes.');
  });

  it('should save param changes successfully', function() {
    var saveParamChangesSpy = spyOn(
      explorationStatesService, 'saveStateParamChanges').and.callFake(() => {});
    $scope.addParamChange();
    $scope.saveParamChanges();

    expect(saveParamChangesSpy).toHaveBeenCalled();
    expect(postSaveHookSpy).toHaveBeenCalled();
  });

  it('should not delete a param change if index is less than 0', function() {
    $scope.addParamChange();
    expect(ctrl.paramChangesService.displayed.length).toBe(1);

    spyOn(alertsService, 'addWarning');
    $scope.deleteParamChange(-1);
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Cannot delete parameter change at position -1: index out of range');
  });

  it('should not delete a param change if index is greather than param' +
    ' changes length', function() {
    $scope.addParamChange();
    expect(ctrl.paramChangesService.displayed.length).toBe(1);

    spyOn(alertsService, 'addWarning');
    $scope.deleteParamChange(5);
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Cannot delete parameter change at position 5: index out of range');
  });

  it('should delete a param change successfully', function() {
    $scope.addParamChange();
    expect(ctrl.paramChangesService.displayed.length).toBe(1);

    $scope.deleteParamChange(0);
    expect(ctrl.paramChangesService.displayed.length).toBe(0);
  });

  it('should change customization args values to be human readable',
    function() {
      expect($scope.HUMAN_READABLE_ARGS_RENDERERS.Copier({
        value: 'Copier value'
      })).toBe('to Copier value');

      expect($scope.HUMAN_READABLE_ARGS_RENDERERS.RandomSelector({
        list_of_values: ['first value', 'second value']
      })).toBe('to one of [first value, second value] at random');
    });

  it('should start param change list to be sortable', function() {
    var pladeholderHeightSpy = jasmine.createSpy('placeholderHeight', () => {});
    var itemHeightSpy = jasmine.createSpy('itemHeight', () => {});
    var ui = {
      placeholder: {
        height: pladeholderHeightSpy
      },
      item: {
        height: itemHeightSpy
      }
    };
    $scope.PARAM_CHANGE_LIST_SORTABLE_OPTIONS.start(null, ui);

    expect(pladeholderHeightSpy).toHaveBeenCalled();
    expect(itemHeightSpy).toHaveBeenCalled();
  });

  it('should stop param change list to be sortable', function() {
    $scope.addParamChange();

    $scope.PARAM_CHANGE_LIST_SORTABLE_OPTIONS.stop();
    expect($scope.paramNameChoices).toEqual([{
      id: 'a',
      text: 'a'
    }, {
      id: 'x',
      text: 'x'
    }, {
      id: 'y',
      text: 'y'
    }]);
  });
});
