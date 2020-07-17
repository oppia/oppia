// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for CustomizeInteractionModalController.
 */

import { StateInteractionIdService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { TestBed } from '@angular/core/testing';

import { InteractionDetailsCacheService } from
  // eslint-disable-next-line max-len
  'pages/exploration-editor-page/editor-tab/services/interaction-details-cache.service.ts';
import { StateCustomizationArgsService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-customization-args.service';
import { StateEditorService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-editor.service';
import { StateNextContentIdIndexService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-next-content-id-index.service';
import { EditorFirstTimeEventsService } from
  'pages/exploration-editor-page/services/editor-first-time-events.service';
import { ImageClickInputValidationService } from
  // eslint-disable-next-line max-len
  'interactions/ImageClickInput/directives/image-click-input-validation.service';
import { InteractionObjectFactory } from
  'domain/exploration/InteractionObjectFactory';

fdescribe('Customize Interaction Modal Controller', function() {
  var $injector = null;
  var $scope = null;
  var $uibModalInstance = null;
  var imageClickInputValidationService = null;
  var editorFirstTimeEventsService = null;
  var interactionDetailsCacheService = null;
  var interactionObjectFactory = null;
  var stateCustomizationArgsService = null;
  var stateEditorService = null;
  var stateInteractionIdService = null;
  var stateNextContentIdIndexService = null;

  var stateName = 'Introduction';

  beforeEach(angular.mock.module('oppia'));

  beforeEach(function() {
    editorFirstTimeEventsService = TestBed.get(EditorFirstTimeEventsService);
    imageClickInputValidationService = TestBed.get(
      ImageClickInputValidationService);
    interactionDetailsCacheService = TestBed.get(
      InteractionDetailsCacheService);
    interactionObjectFactory = TestBed.get(InteractionObjectFactory);
    stateCustomizationArgsService = TestBed.get(StateCustomizationArgsService);
    stateEditorService = TestBed.get(StateEditorService);
    stateInteractionIdService = TestBed.get(StateInteractionIdService);
    stateNextContentIdIndexService = TestBed.get(
      StateNextContentIdIndexService);
  });

  fdescribe('when state editor is in question mode', function() {
    beforeEach(angular.mock.inject(function(_$injector_, $controller) {
      $injector = _$injector_;
      var $rootScope = $injector.get('$rootScope');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      spyOn(stateEditorService, 'isInQuestionMode').and.returnValue(true);
      stateCustomizationArgsService.init(stateName, {});
      stateInteractionIdService.init(stateName, 'ImageClickInput');

      $scope = $rootScope.$new();
      spyOn($scope, '$broadcast').and.callThrough();

      $controller('CustomizeInteractionModalController', {
        $injector: $injector,
        $scope: $scope,
        $uibModalInstance: $uibModalInstance,
        EditorFirstTimeEventsService: editorFirstTimeEventsService,
        imageClickInputValidationService: imageClickInputValidationService,
        InteractionDetailsCacheService: interactionDetailsCacheService,
        InteractionObjectFactory: interactionObjectFactory,
        StateCustomizationArgsService: stateCustomizationArgsService,
        StateEditorService: stateEditorService,
        StateInteractionIdService: stateInteractionIdService,
        StateNextContentIdIndexService: stateNextContentIdIndexService
      });
    }));

    fit('should evaluate scope variable values correctly', function() {
      expect($scope.customizationModalReopened).toBe(true);
      // Image Click Input has 2 arg specs.
      expect($scope.customizationArgSpecs.length).toBe(2);
      console.log(stateCustomizationArgsService.displayed)
      expect(stateCustomizationArgsService.displayed).toEqual({
        imageAndRegions: {
          value: {
            imagePath: '',
            labeledRegions: []
          }
        },
        highlightRegionsOnHover: {
          value: false
        }
      });

      expect($scope.$broadcast).toHaveBeenCalledWith('schemaBasedFormsShown');
      expect($scope.form).toEqual({});
      expect($scope.hasCustomizationArgs).toBe(true);
    });

    it('should get interaction thumbnail image url', function() {
      var interactionId = 'i1';
      expect($scope.getInteractionThumbnailImageUrl(interactionId)).toBe(
        '/extensions/interactions/i1/static/i1.png');
    });

    it('should get a customization args warning message when' +
      ' customization args warning message button has no value', function() {
      stateCustomizationArgsService.displayed = {
        imageAndRegions: {
          value: ''
        }
      };
      stateCustomizationArgsService.saveDisplayedValue();

      var injectorSpy = spyOn($injector, 'get');
      injectorSpy.withArgs('ImageClickInputValidationService').and
        .returnValue(imageClickInputValidationService);

      expect($scope.getCustomizationArgsWarningMessage()).toBe(
        'Please add an image for the learner to click on.');
      injectorSpy.and.callThrough();

      // Change customizationArgs to the older one in order to not affect other
      // specs.
      stateCustomizationArgsService.displayed = {};
    });

    it('should set state customization args when changing interaction id that' +
      ' is not in cache', function() {
      $scope.onChangeInteractionId('LogicProof');

      expect($scope.customizationArgSpecs.length).toBe(1);
      expect(stateCustomizationArgsService.displayed).toEqual({
        question: {
          value: {
            assumptions: [{
              arguments: [],
              top_kind_name: 'variable',
              dummies: [],
              top_operator_name: 'p'
            }],
            results: [{
              arguments: [],
              top_kind_name: 'variable',
              dummies: [],
              top_operator_name: 'p'
            }],
            default_proof_string: ''
          }
        }
      });
      expect($scope.hasCustomizationArgs).toBe(true);

      // Change interactionId to the older one in order to not affect other
      // specs.
      stateInteractionIdService.displayed = 'Continue';
      $scope.returnToInteractionSelector();
      // Remove logicProof from cache in order to not affect other specs.
      interactionDetailsCacheService.removeDetails('LogicProof');
    });

    it('should save interaction if there is no customization args left',
      function() {
        spyOn(
          editorFirstTimeEventsService, 'registerFirstSaveInteractionEvent')
          .and.callThrough();
        // Number with units has no customization args.
        $scope.onChangeInteractionId('NumberWithUnits');

        expect($scope.customizationArgSpecs).toEqual([]);
        expect(stateCustomizationArgsService.displayed).toEqual({});
        expect($scope.hasCustomizationArgs).toBe(false);

        expect(
          editorFirstTimeEventsService.registerFirstSaveInteractionEvent)
          .toHaveBeenCalled();
        expect($uibModalInstance.close).toHaveBeenCalled();

        // Change interactionId to the older one in order to not affect other
        // specs.
        stateInteractionIdService.displayed = 'Continue';
        $scope.returnToInteractionSelector();
        // Remove numberWithUnits from cache in order to not affect other specs.
        interactionDetailsCacheService.removeDetails('NumberWithUnits');
      });

    it('should set state customization args when changing interaction id that' +
      ' is in cache', function() {
      // Save logicProof on cache.
      stateInteractionIdService.displayed = 'LogicProof';
      $scope.returnToInteractionSelector();

      $scope.onChangeInteractionId('LogicProof');

      expect($scope.customizationArgSpecs.length).toBe(1);
      expect($scope.hasCustomizationArgs).toBe(true);

      // Change interactionId to the older one in order to not affect other
      // specs.
      stateInteractionIdService.displayed = 'Continue';
      $scope.returnToInteractionSelector();
      // Remove logicProof from cache in order to not affect other specs.
      interactionDetailsCacheService.removeDetails('LogicProof');
    });

    it('should have save interaction button enabled and return warning' +
      ' message', function() {
      $scope.form.schemaForm = {
        $valid: true
      };
      stateCustomizationArgsService.displayed = {
        imageAndRegions: {
          value: ''
        }
      };
      stateCustomizationArgsService.saveDisplayedValue();

      var injectorSpy = spyOn($injector, 'get');
      injectorSpy.withArgs('ImageClickInputValidationService').and
        .returnValue(imageClickInputValidationService);

      expect($scope.getSaveInteractionButtonTooltip()).toBe(
        'Please add an image for the learner to click on.');
      injectorSpy.and.callThrough();
      expect($scope.isSaveInteractionButtonEnabled()).toBe(false);
    });

    it('should have save interaction button disabled when form entries' +
      ' are invalid', function() {
      stateCustomizationArgsService.displayed = {
        imageAndRegions: {
          value: {
            imagePath: 'imagepath',
            labeledRegions: [{
              label: 'abc'
            }]
          }
        }
      };
      stateCustomizationArgsService.saveDisplayedValue();

      $scope.form.schemaForm = {
        $invalid: true
      };
      var injectorSpy = spyOn($injector, 'get');

      injectorSpy.withArgs('ImageClickInputValidationService').and
        .returnValue(imageClickInputValidationService);

      expect($scope.getSaveInteractionButtonTooltip()).toBe(
        'Some of the form entries are invalid.');
      injectorSpy.and.callThrough();
      expect($scope.isSaveInteractionButtonEnabled()).toBe(false);
    });

    it('should have save interaction button enabled when there is no' +
      ' warning message', function() {
      stateCustomizationArgsService.displayed = {
        imageAndRegions: {
          value: {
            imagePath: 'imagepath',
            labeledRegions: [{
              label: 'abc'
            }]
          }
        }
      };
      stateCustomizationArgsService.saveDisplayedValue();
      $scope.form.schemaForm = {
        $invalid: false,
        $valid: true
      };

      var injectorSpy = spyOn($injector, 'get');
      injectorSpy.withArgs('ImageClickInputValidationService').and
        .returnValue(imageClickInputValidationService);

      expect($scope.getSaveInteractionButtonTooltip()).toBe('');
      injectorSpy.and.callThrough();
      expect($scope.isSaveInteractionButtonEnabled()).toBe(true);
    });
  });

  describe('when state editor is not in question mode', function() {
    beforeEach(angular.mock.inject(function($injector, $controller) {
      var $rootScope = $injector.get('$rootScope');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      spyOn(stateEditorService, 'isInQuestionMode').and.returnValue(false);

      $scope = $rootScope.$new();
      $controller('CustomizeInteractionModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance,
        InteractionDetailsCacheService: interactionDetailsCacheService,
        InteractionObjectFactory: interactionObjectFactory,
        StateCustomizationArgsService: stateCustomizationArgsService,
        StateEditorService: stateEditorService,
        StateInteractionIdService: stateInteractionIdService,
        StateNextContentIdIndexService: stateNextContentIdIndexService
      });
    }));

    it('should have save interaction button disabled when there is no' +
      ' customization arg', function() {
      expect($scope.getSaveInteractionButtonTooltip()).toBe(
        'No customization arguments');
      expect($scope.isSaveInteractionButtonEnabled()).toBe(false);
    });

    it('should have save interaction button disabled when there is no' +
      ' interaction being displayed', function() {
      // Change customization args.
      stateCustomizationArgsService.displayed = {
        imageAndRegions: {}
      };
      // Save logicProof on cache.
      stateInteractionIdService.displayed = 'LogicProof';
      $scope.returnToInteractionSelector();

      // Save customization args.
      $scope.onChangeInteractionId('LogicProof');

      expect($scope.customizationArgSpecs.length).toBe(1);
      expect($scope.hasCustomizationArgs).toBe(true);

      // Change interactionId  as empty.
      stateInteractionIdService.displayed = null;
      $scope.returnToInteractionSelector();

      expect($scope.isSaveInteractionButtonEnabled()).toBe(false);
      expect($scope.getSaveInteractionButtonTooltip()).toBe(
        'No interaction being displayed');

      // Remove logicProof from cache in order to not affect other specs.
      interactionDetailsCacheService.removeDetails('LogicProof');
    });
  });
});
