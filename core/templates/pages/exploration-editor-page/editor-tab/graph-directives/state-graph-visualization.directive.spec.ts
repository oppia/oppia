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
 * @fileoverview Unit tests for State Graph Visualization directive.
 */

import { EventEmitter } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { StateGraphLayoutService } from
  'components/graph-services/graph-layout.service';
import { AnswerGroupsCacheService } from
  // eslint-disable-next-line max-len
  'pages/exploration-editor-page/editor-tab/services/answer-groups-cache.service';
import { TextInputRulesService } from
  'interactions/TextInput/directives/text-input-rules.service';
import { OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { StateSolutionService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-solution.service';
import { StateCustomizationArgsService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-customization-args.service';
import { StateInteractionIdService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { AngularNameService } from
  'pages/exploration-editor-page/services/angular-name.service';
import { StateRecordedVoiceoversService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-recorded-voiceovers.service';
import { StateWrittenTranslationsService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-written-translations.service';

import * as d3 from 'd3';
import { of } from 'rxjs';

require('pages/exploration-editor-page/editor-tab/graph-directives/' +
  'state-graph-visualization.directive.ts');
require('pages/exploration-editor-page/services/router.service.ts');

describe('State Graph Visualization directive', function() {
  var ctrl = null;
  var $element = null;
  var $flushPendingTasks = null;
  var $rootScope = null;
  var $scope = null;
  var explorationWarningsService = null;
  var routerService = null;
  var stateGraphLayoutService = null;
  var translationStatusService = null;
  var mockCenterGraphEventEmitter = null;
  var nodes = {
    state_1: {
      depth: 2,
      offset: 0,
      reachable: false,
      y0: 10,
      x0: 10,
      yLabel: 5,
      xLabel: 5,
      height: 10,
      width: 100,
      id: 'node_1',
      label: 'This is a label for node 1',
      secondaryLabel: 'Second label for node 1',
      reachableFromEnd: true
    },
    state_3: {
      depth: 3,
      offset: 0,
      reachable: true,
      y0: 10,
      x0: 10,
      yLabel: 5,
      xLabel: 5,
      height: 10,
      width: 100,
      id: 'node_1',
      label: 'This is a label for node 3',
      reachableFromEnd: false
    }
  };

  beforeEach(angular.mock.module('directiveTemplates'));
  beforeEach(function() {
    stateGraphLayoutService = TestBed.get(StateGraphLayoutService);
  });
  beforeEach(angular.mock.module('oppia', function($provide) {
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
    $provide.value('StateRecordedVoiceoversService',
      TestBed.get(StateRecordedVoiceoversService));
    $provide.value('StateSolutionService', TestBed.get(StateSolutionService));
    $provide.value('StateWrittenTranslationsService',
      TestBed.get(StateWrittenTranslationsService));
    $provide.value('WindowDimensionsService', {
      getResizeEvent: function() {
        return of(new Event('resize'));
      }
    });
    mockCenterGraphEventEmitter = new EventEmitter();
    $provide.value(
      'RouterService', {
        onCenterGraph: mockCenterGraphEventEmitter
      });
  }));
  beforeEach(angular.mock.inject(function($injector) {
    $flushPendingTasks = $injector.get('$flushPendingTasks');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    explorationWarningsService = $injector.get('ExplorationWarningsService');
    routerService = $injector.get('RouterService');
    translationStatusService = $injector.get('TranslationStatusService');

    spyOn(stateGraphLayoutService, 'computeLayout').and.returnValue(nodes);
    spyOn(stateGraphLayoutService, 'getAugmentedLinks').and.returnValue([{
      style: ''
    }]);

    $scope.allowPanning = true;
    $scope.centerAtCurrentState = true;
    $scope.currentStateId = () => 'state_1';
    $scope.graphData = () => ({
      nodes: {
        State1: 'State 1 Node'
      },
      links: [{
        linkProperty: 'link_1',
        source: {
          label: 'a',
          xLabel: 30,
          yLabel: 30,
          width: 100,
          height: 100,
        },
        target: {
          label: 'b',
          xLabel: 20,
          yLabel: 20,
          width: 100,
          height: 100,
        }
      }],
      initStateId: 'state_1',
      finalStateIds: []
    });
    $scope.initStateId2 = 'state_2';
    $scope.linkPropertyMapping = {
      link_1: 'background-color: red; '
    };
    $scope.getNodeColors = () => ({
      state_1: '#000',
      state_2: '#ff0',
      state_3: '#fff'
    });
    $scope.nodeFill = '#fff';
    $scope.nodeSecondaryLabels = {
      state_3: 'This is a secondary label for state_3'
    };
    $scope.onDeleteFunction = jasmine.createSpy('delete', () => {});
    $scope.showTranslationWarnings = true;

    $element = angular.element(
      '<div state-graph-visualization allowPanning="true"></div>');
    var directive = $injector.get('stateGraphVisualizationDirective')[0];

    ctrl = $injector.instantiate(directive.controller, {
      $element: $element,
      $scope: $scope,
      StateGraphLayoutService: stateGraphLayoutService
    });
    ctrl.$onInit();
  }));

  afterEach(function() {
    ctrl.$onDestroy();
  });

  describe('when graph is redrawed after redrawGraph flag is broadcasted',
    function() {
      beforeEach(function() {
        $rootScope.$broadcast('redrawGraph');
        $flushPendingTasks();
      });

      it('should evaluate $scope properties', function() {
        expect($scope.graphLoaded).toBe(true);
        expect($scope.GRAPH_WIDTH).toBe(630);
        expect($scope.GRAPH_HEIGHT).toBe(280);
        expect($scope.VIEWPORT_WIDTH).toBe(10000);
        expect($scope.VIEWPORT_HEIGHT).toBe(10000);
        expect($scope.VIEWPORT_X).toBe(-1260);
        expect($scope.VIEWPORT_Y).toBe(-1000);

        expect($scope.getGraphHeightInPixels()).toBe(300);

        expect($scope.augmentedLinks[0].style).toBe(
          'background-color: red; ');
        expect($scope.nodeList.length).toBe(2);
      });

      it('should get highlight transform css value based on provided values',
        function() {
          expect($scope.getHighlightTransform(20, 10)).toBe('rotate(-10,10,5)');
          expect($scope.getHighlightTextTransform(20, 10)).toBe(
            'rotate(-10,20,6)');
        });

      it('should check if can navigate to node whenever node id is equal to' +
        ' current state id', function() {
        expect($scope.canNavigateToNode('state_1')).toBe(false);
        expect($scope.canNavigateToNode('state_3')).toBe(true);
      });

      it('should call deleteFunction when deleting a non initial node',
        function() {
          $scope.onNodeDeletionClick('state_3');
          expect($scope.onDeleteFunction).toHaveBeenCalled();
        });

      it('should call deleteFunction when deleting a initial node', function() {
        $scope.onNodeDeletionClick('state_1');
        expect($scope.onDeleteFunction).not.toHaveBeenCalled();
      });

      it('should get node complete title with its secondary label and' +
        ' warnings', function() {
        expect($scope.getNodeTitle(nodes.state_1)).toBe(
          'This is a label for node 1 Second label for node 1 ' +
          '(Warning: this state is unreachable.)');
        expect($scope.getNodeTitle(nodes.state_3)).toBe(
          'This is a label for node 3 This is a secondary label for ' +
          'state_3 (Warning: there is no path from this state to the ' +
          'END state.)');
      });

      it('should get truncated label with truncate filter', function() {
        expect($scope.getTruncatedLabel('This is a label for node 3')).toBe(
          'This is a la...');
      });

      it('should get node error message from node label when' +
        ' showTranslationWarnings is true', function() {
        var nodeErrorMessage = 'Node 1 error message';
        spyOn(translationStatusService, 'getAllStatesNeedUpdatewarning').and
          .returnValue({
            'This is a label for node 1': [nodeErrorMessage]
          });
        expect($scope.getNodeErrorMessage('This is a label for node 1')).toBe(
          nodeErrorMessage);
      });

      it('should get node error message from node label when' +
        ' showTranslationWarnings is false', function() {
        $scope.showTranslationWarnings = false;
        var nodeErrorMessage = 'Node 1 error message from exploration warnings';
        spyOn(explorationWarningsService, 'getAllStateRelatedWarnings').and
          .returnValue({
            'This is a label for node 1': [nodeErrorMessage]
          });
        expect($scope.getNodeErrorMessage('This is a label for node 1')).toBe(
          nodeErrorMessage);
      });
    });

  it('should redraw graph when resizing page', function() {
    expect($scope.graphLoaded).toBe(false);

    angular.element(window).triggerHandler('resize');
    $flushPendingTasks();

    expect($scope.graphLoaded).toBe(true);
  });

  it('should center graph when centerGraph flag is broadcasted and transform' +
    ' x and y axis to 0', function() {
    // Spies for element dimensions.
    spyOn($element, 'height').and.returnValue(100);
    spyOn($element, 'width').and.returnValue(100);

    spyOn(stateGraphLayoutService, 'getGraphBoundaries').and.returnValue({
      bottom: 20,
      left: 10,
      top: 10,
      right: 20
    });

    $rootScope.$broadcast('redrawGraph');
    $flushPendingTasks();

    // Spies for d3 library.
    var zoomSpy = jasmine.createSpy('zoom').and.returnValue({
      scaleExtent: () => ({
        on: (evt, callback) => callback()
      })
    });
    spyOnProperty(d3, 'zoom').and.returnValue(zoomSpy);
    spyOnProperty(d3, 'event').and.returnValue({
      transform: {
        x: 10,
        y: 20
      }
    });

    routerService.onCenterGraph.emit();
    $flushPendingTasks();

    expect(d3.event.transform.x).toBe(0);
    expect(d3.event.transform.y).toBe(0);
    expect($scope.overallTransformStr).toBe('translate(35,35)');
  });

  it('should center graph when centerGraph flag is broadcasted and transform' +
  ' x and y axis to custom value', function() {
    spyOn($element, 'height').and.returnValue(10);
    spyOn($element, 'width').and.returnValue(10);
    spyOn(stateGraphLayoutService, 'getGraphBoundaries').and.returnValue({
      bottom: 30,
      left: 10,
      top: 10,
      right: 30
    });
    $rootScope.$broadcast('redrawGraph');
    $flushPendingTasks();
    var zoomSpy = jasmine.createSpy('zoom').and.returnValue({
      scaleExtent: () => ({
        on: (evt, callback) => callback()
      })
    });
    spyOnProperty(d3, 'zoom').and.returnValue(zoomSpy);
    spyOnProperty(d3, 'event').and.returnValue({
      transform: {
        x: 10,
        y: 20
      }
    });

    routerService.onCenterGraph.emit();
    $flushPendingTasks();

    expect(d3.event.transform.x).toBe(10);
    expect(d3.event.transform.y).toBe(10);
    expect($scope.overallTransformStr).toBe('translate(-20,-20)');
  });
});
