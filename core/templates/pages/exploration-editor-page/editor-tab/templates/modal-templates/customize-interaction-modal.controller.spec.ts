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

import { Subscription } from 'rxjs';

import { StateInteractionIdService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { TestBed } from '@angular/core/testing';

import { InteractionDetailsCacheService } from
  // eslint-disable-next-line max-len
  'pages/exploration-editor-page/editor-tab/services/interaction-details-cache.service';
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
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { SubtitledUnicode } from
  'domain/exploration/SubtitledUnicodeObjectFactory';
import { ContextService } from 'services/context.service';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

describe('Customize Interaction Modal Controller', function() {
  var $injector = null;
  var $scope = null;
  var $uibModal = null;
  var $q = null;
  var $uibModalInstance = null;
  var contextService = null;
  var imageClickInputValidationService = null;
  var editorFirstTimeEventsService = null;
  var interactionDetailsCacheService = null;
  var interactionObjectFactory = null;
  var stateCustomizationArgsService = null;
  var stateEditorService = null;
  var stateInteractionIdService = null;
  var stateNextContentIdIndexService = null;
  var testSubscriptions: Subscription;
  const schemaBasedFormsSpy = jasmine.createSpy(
    'schemaBasedFormsSpy');

  var stateName = 'Introduction';

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();
  beforeEach(function() {
    contextService = TestBed.get(ContextService);
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

  beforeEach(() => {
    testSubscriptions = new Subscription();
    testSubscriptions.add(
      stateCustomizationArgsService.onSchemaBasedFormsShown.subscribe(
        schemaBasedFormsSpy));
  });

  afterEach(() => {
    testSubscriptions.unsubscribe();
  });

  describe('when state editor is in story mode', function() {
    beforeEach(angular.mock.inject(function(_$injector_, $controller) {
      $injector = _$injector_;
      var $rootScope = $injector.get('$rootScope');
      $uibModal = $injector.get('$uibModal');
      $q = $injector.get('$q');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      spyOn(contextService, 'isExplorationLinkedToStory').and.returnValue(true);
      stateCustomizationArgsService.init(stateName, {
        imageAndRegions: {value: {
          imagePath: '',
          labeledRegions: []
        }},
        highlightRegionsOnHover: {value: false}
      });
      stateInteractionIdService.init(stateName, 'ImageClickInput');

      $scope = $rootScope.$new();

      $controller('CustomizeInteractionModalController', {
        $injector: $injector,
        $scope: $scope,
        $uibModal: $uibModal,
        $uibModalInstance: $uibModalInstance,
        ContextService: contextService,
        EditorFirstTimeEventsService: editorFirstTimeEventsService,
        imageClickInputValidationService: imageClickInputValidationService,
        InteractionDetailsCacheService: interactionDetailsCacheService,
        InteractionObjectFactory: interactionObjectFactory,
        StateCustomizationArgsService: stateCustomizationArgsService,
        StateEditorService: stateEditorService,
        StateInteractionIdService: stateInteractionIdService,
        StateNextContentIdIndexService: stateNextContentIdIndexService,
        showMarkAllAudioAsNeedingUpdateModalIfRequired: () => {}
      });
    }));

    it('should initialize $scope properties after controller is initialized',
      function() {
        expect($scope.ALLOWED_INTERACTION_CATEGORIES.length).toBe(2);
        expect(
          $scope.ALLOWED_INTERACTION_CATEGORIES[0].interaction_ids.length
        ).toBe(7);
        expect(
          $scope.ALLOWED_INTERACTION_CATEGORIES[1].interaction_ids.length
        ).toBe(6);
      });
  });

  describe('when state editor is in question mode', function() {
    beforeEach(angular.mock.inject(function(_$injector_, $controller) {
      $injector = _$injector_;
      var $rootScope = $injector.get('$rootScope');
      $uibModal = $injector.get('$uibModal');
      $q = $injector.get('$q');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      spyOn(stateEditorService, 'isInQuestionMode').and.returnValue(true);
      stateCustomizationArgsService.init(stateName, {
        imageAndRegions: {value: {
          imagePath: '',
          labeledRegions: []
        }},
        highlightRegionsOnHover: {value: false}
      });
      stateInteractionIdService.init(stateName, 'ImageClickInput');

      $scope = $rootScope.$new();

      $controller('CustomizeInteractionModalController', {
        $injector: $injector,
        $scope: $scope,
        $uibModal: $uibModal,
        $uibModalInstance: $uibModalInstance,
        EditorFirstTimeEventsService: editorFirstTimeEventsService,
        imageClickInputValidationService: imageClickInputValidationService,
        InteractionDetailsCacheService: interactionDetailsCacheService,
        InteractionObjectFactory: interactionObjectFactory,
        StateCustomizationArgsService: stateCustomizationArgsService,
        StateEditorService: stateEditorService,
        StateInteractionIdService: stateInteractionIdService,
        StateNextContentIdIndexService: stateNextContentIdIndexService,
        showMarkAllAudioAsNeedingUpdateModalIfRequired: () => {}
      });
    }));

    it('should initialize $scope properties after controller is initialized',
      function() {
        expect($scope.customizationModalReopened).toBe(true);
        // Image Click Input has 2 arg specs.
        expect($scope.customizationArgSpecs.length).toBe(2);
        expect(stateCustomizationArgsService.displayed).toEqual({
          imageAndRegions: {
            value: {
              imagePath: '',
              labeledRegions: []
            }
          },
          highlightRegionsOnHover: {value: false}
        });

        expect(schemaBasedFormsSpy).toHaveBeenCalled();
        expect($scope.form).toEqual({});
        expect($scope.hasCustomizationArgs).toBe(true);
      });

    it('should get complete interaction thumbnail icon path corresponding to' +
      ' a given relative path', function() {
      var interactionId = 'i1';
      expect($scope.getInteractionThumbnailImageUrl(interactionId)).toBe(
        '/extensions/interactions/i1/static/i1.png');
    });

    it('should return the hyphenated category name as expected', function() {
      var categoryName = 'Camel Case CATEGORY Name With Spaces';
      expect($scope.getHyphenatedLowercaseCategoryName(categoryName)).toBe(
        'camel-case-category-name-with-spaces');
    });

    it('should get a customization args warning message when' +
      ' customization args warning message button has no value', function() {
      stateCustomizationArgsService.displayed = {
        imageAndRegions: {value: ''},
        highlightRegionsOnHover: {value: false}
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

    it('should update state customization args when changing interaction id' +
      ' that is not in cache', function() {
      $scope.onChangeInteractionId('GraphInput');

      expect($scope.customizationArgSpecs.length).toBe(8);
      expect(stateCustomizationArgsService.displayed).toEqual({
        graph: {value: {
          isWeighted: false,
          edges: [{
            src: 0,
            dst: 1,
            weight: 1
          }, {
            src: 1,
            dst: 2,
            weight: 1
          }],
          isDirected: false,
          vertices: [{
            x: 150,
            y: 50,
            label: ''
          }, {
            x: 200,
            y: 50,
            label: ''
          }, {
            x: 150,
            y: 100,
            label: ''
          }],
          isLabeled: false,
        }},
        canAddVertex: { value: false },
        canDeleteVertex: { value: false },
        canMoveVertex: { value: true },
        canEditVertexLabel: { value: false },
        canAddEdge: { value: true },
        canDeleteEdge: { value: true },
        canEditEdgeWeight: { value: false }
      });
      expect($scope.hasCustomizationArgs).toBe(true);

      // Change interactionId to the older one in order to not affect other
      // specs.
      stateInteractionIdService.displayed = 'Continue';
      $scope.returnToInteractionSelector();
      // Remove GraphInput from cache in order to not affect other specs.
      interactionDetailsCacheService.removeDetails('GraphInput');
    });

    it('should save interaction when there are no customization args left',
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

    it('should update state customization args when changing interaction id' +
      ' that is in cache', function() {
      // Save GraphInput on cache.
      stateInteractionIdService.displayed = 'GraphInput';
      $scope.returnToInteractionSelector();

      $scope.onChangeInteractionId('GraphInput');

      expect($scope.customizationArgSpecs.length).toBe(8);
      expect($scope.hasCustomizationArgs).toBe(true);

      // Change interactionId to the older one in order to not affect other
      // specs.
      stateInteractionIdService.displayed = 'Continue';
      $scope.returnToInteractionSelector();
      // Remove GraphInput from cache in order to not affect other specs.
      interactionDetailsCacheService.removeDetails('GraphInput');
    });

    it('should have save interaction button enabled and return warning' +
      ' message when image is not provided', function() {
      $scope.form.schemaForm = {
        $valid: true
      };
      stateCustomizationArgsService.displayed = {
        imageAndRegions: {value: ''},
        highlightRegionsOnHover: {value: false}
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
        imageAndRegions: {value: {
          imagePath: 'imagepath',
          labeledRegions: [{
            label: 'abc'
          }]
        }}
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
        imageAndRegions: {value: {
          imagePath: 'imagepath',
          labeledRegions: [{
            label: 'abc'
          }]
        }},
        highlightRegionsOnHover: {value: false}
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

    it('should open a confirmation modal with resolution', function() {
      angular.element(document.querySelector('.modal-title')).remove();

      var mockDiv = document.createElement('div');
      mockDiv.setAttribute('class', 'modal-title');
      mockDiv.textContent = 'Title';
      var $document = angular.element(document);
      $document.find('body').append(mockDiv.outerHTML);
      let modalSpy = spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve()
      });

      $scope.cancelWithConfirm();
      $scope.$apply();
      expect(modalSpy).toHaveBeenCalled();

      angular.element(document.querySelector('.modal-title')).remove();
    });

    it('should open a confirmation modal with rejection', function() {
      angular.element(document.querySelector('.modal-title')).remove();

      var mockDiv = document.createElement('div');
      mockDiv.setAttribute('class', 'modal-title');
      mockDiv.textContent = 'Title';
      var $document = angular.element(document);
      $document.find('body').append(mockDiv.outerHTML);
      let modalSpy = spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve()
      });

      $scope.cancelWithConfirm();
      $scope.$apply();
      expect(modalSpy).toHaveBeenCalled();

      angular.element(document.querySelector('.modal-title')).remove();
    });

    it('should not open a new confirmation modal if one is already open',
      function() {
        angular.element(document.querySelector('.modal-title')).remove();

        var mockDiv = document.createElement('div');
        mockDiv.setAttribute('class', 'modal-title');
        mockDiv.textContent = 'Confirmation Required';
        var $document = angular.element(document);
        $document.find('body').append(mockDiv.outerHTML);

        $scope.cancelWithConfirm();
        $scope.$apply();
        expect($uibModalInstance.dismiss).not.toHaveBeenCalledWith('cancel');

        angular.element(document.querySelector('.modal-title')).remove();
      }
    );
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
        StateNextContentIdIndexService: stateNextContentIdIndexService,
        showMarkAllAudioAsNeedingUpdateModalIfRequired: () => {}
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
        imageAndRegions: {value: null},
        highlightRegionsOnHover: {value: false}
      };
      // Save GraphInput on cache.
      stateInteractionIdService.displayed = 'GraphInput';
      $scope.returnToInteractionSelector();

      // Save customization args.
      $scope.onChangeInteractionId('GraphInput');

      expect($scope.customizationArgSpecs.length).toBe(8);
      expect($scope.hasCustomizationArgs).toBe(true);

      // Change interactionId  as empty.
      stateInteractionIdService.displayed = null;
      $scope.returnToInteractionSelector();

      expect($scope.isSaveInteractionButtonEnabled()).toBe(false);
      expect($scope.getSaveInteractionButtonTooltip()).toBe(
        'No interaction being displayed');

      // Remove GraphInput from cache in order to not affect other specs.
      interactionDetailsCacheService.removeDetails('GraphInput');
    });

    it('should correctly populate null content ids on save', () => {
      stateNextContentIdIndexService.displayed = 0;
      stateInteractionIdService.displayed = 'MultipleChoiceInput';
      stateCustomizationArgsService.displayed = {
        choices: {value: [
          new SubtitledHtml('<p>1</p>', null),
          new SubtitledHtml('<p>2</p>', null)
        ]},
        showChoicesInShuffledOrder: {value: false}
      };

      $scope.save();
      expect(stateCustomizationArgsService.displayed).toEqual({
        choices: {value: [
          new SubtitledHtml('<p>1</p>', 'ca_choices_0'),
          new SubtitledHtml('<p>2</p>', 'ca_choices_1')
        ]},
        showChoicesInShuffledOrder: {value: false}
      });
      expect(stateNextContentIdIndexService.displayed).toEqual(2);
    });
  });

  it('should error when a saved customization arg is missing', () => {
    angular.mock.inject(function($injector, $controller) {
      var $rootScope = $injector.get('$rootScope');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      spyOn(stateEditorService, 'isInQuestionMode').and.returnValue(false);

      stateCustomizationArgsService.init(stateName, {
        imageAndRegions: { value: {
          imagePath: '',
          labeledRegions: []
        } }
      });
      stateInteractionIdService.init(stateName, 'ImageClickInput');

      $scope = $rootScope.$new();
      expect(() => {
        $controller('CustomizeInteractionModalController', {
          $scope: $scope,
          $uibModalInstance: $uibModalInstance,
          InteractionDetailsCacheService: interactionDetailsCacheService,
          InteractionObjectFactory: interactionObjectFactory,
          StateCustomizationArgsService: stateCustomizationArgsService,
          StateEditorService: stateEditorService,
          StateInteractionIdService: stateInteractionIdService,
          StateNextContentIdIndexService: stateNextContentIdIndexService,
          showMarkAllAudioAsNeedingUpdateModalIfRequired: () => {}
        });
      }).toThrowError(
        'Interaction is missing customization argument highlightRegionsOnHover'
      );
    });
    // Change customizationArgs to the older one in order to not affect other
    // specs.
    stateCustomizationArgsService.displayed = {};
  });

  it('should correctly populate null content ids of complex nested ' +
     'customization arguments on save', () => {
    // While no interaction currently contains a dictionary in the customization
    // arguments, we test dictionaries and more complex nested forms of
    // customization arguments for future changes.

    angular.mock.inject(function($injector, $controller) {
      var $rootScope = $injector.get('$rootScope');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      spyOn(stateEditorService, 'isInQuestionMode').and.returnValue(false);

      stateCustomizationArgsService.init(stateName, {
        dummyCustArg: {value: [{
          content: new SubtitledUnicode('first', null),
          show: true
        },
        {
          content: new SubtitledUnicode('second', null),
          show: true
        }]}
      });
      stateInteractionIdService.init(stateName, 'DummyInteraction');

      const INTERACTION_SPECS = {
        DummyInteraction: {
          customization_arg_specs: [{
            name: 'dummyCustArg',
            schema: {
              type: 'list',
              items: {
                type: 'dict',
                properties: [{
                  name: 'content',
                  schema: {
                    type: 'custom',
                    obj_type: 'SubtitledUnicode'
                  }
                }, {
                  name: 'show',
                  schema: {
                    type: 'boolean'
                  }
                }]
              }
            }
          }]
        }
      };

      $scope = $rootScope.$new();

      $controller('CustomizeInteractionModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance,
        InteractionDetailsCacheService: interactionDetailsCacheService,
        InteractionObjectFactory: interactionObjectFactory,
        StateCustomizationArgsService: stateCustomizationArgsService,
        StateEditorService: stateEditorService,
        StateInteractionIdService: stateInteractionIdService,
        StateNextContentIdIndexService: stateNextContentIdIndexService,
        INTERACTION_SPECS: INTERACTION_SPECS,
        showMarkAllAudioAsNeedingUpdateModalIfRequired: () => {}
      });
    });
    stateNextContentIdIndexService.displayed = 0;
    $scope.save();
    expect(stateCustomizationArgsService.displayed).toEqual({
      dummyCustArg: {value: [{
        content:
          new SubtitledUnicode('first', 'ca_dummyCustArg_content_0'),
        show: true
      },
      {
        content:
          new SubtitledUnicode('second', 'ca_dummyCustArg_content_1'),
        show: true
      }]}
    });
    expect(stateNextContentIdIndexService.displayed).toEqual(2);

    // Change customizationArgs to the older one in order to not affect other
    // specs.
    stateCustomizationArgsService.displayed = {};
  });

  it('should call showMarkAllAudioAsNeedingUpdateModalIfRequired ' +
     'on updated customization arguments when saving', () => {
    const mockShowMarkAllAudioAsNeedingUpdateModalIfRequired = (
      jasmine.createSpy());

    angular.mock.inject(function($injector, $controller) {
      var $rootScope = $injector.get('$rootScope');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      spyOn(stateEditorService, 'isInQuestionMode').and.returnValue(false);

      stateCustomizationArgsService.init(stateName, {
        placeholder: {
          value: new SubtitledUnicode('old value', 'ca_placeholder')
        },
        rows: {value: 1}
      });
      stateInteractionIdService.init(stateName, 'TextInput');

      $scope = $rootScope.$new();

      $controller('CustomizeInteractionModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance,
        InteractionDetailsCacheService: interactionDetailsCacheService,
        InteractionObjectFactory: interactionObjectFactory,
        StateCustomizationArgsService: stateCustomizationArgsService,
        StateEditorService: stateEditorService,
        StateInteractionIdService: stateInteractionIdService,
        StateNextContentIdIndexService: stateNextContentIdIndexService,
        showMarkAllAudioAsNeedingUpdateModalIfRequired:
          mockShowMarkAllAudioAsNeedingUpdateModalIfRequired
      });
    });
    stateNextContentIdIndexService.displayed = 0;
    stateCustomizationArgsService.displayed = {
      placeholder: {
        value: new SubtitledUnicode('new value', 'ca_placeholder')
      },
      rows: {value: 1}
    };

    $scope.save();
    expect(
      mockShowMarkAllAudioAsNeedingUpdateModalIfRequired
    ).toHaveBeenCalledWith(['ca_placeholder']);

    // Change customizationArgs to the older one in order to not affect other
    // specs.
    stateCustomizationArgsService.displayed = {};
  });
});
