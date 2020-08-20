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
import { StateEditorRefreshService } from
  'pages/exploration-editor-page/services/state-editor-refresh.service';

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
    $provide.value('StateEditorRefreshService',
      TestBed.get(StateEditorRefreshService));
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
