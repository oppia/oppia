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

import {EventEmitter, NO_ERRORS_SCHEMA, Pipe} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {StateGraphLayoutService} from 'components/graph-services/graph-layout.service';
import * as d3 from 'd3';
import {of} from 'rxjs';
import {ExplorationStatesService} from 'pages/exploration-editor-page/services/exploration-states.service';
import {ExplorationWarningsService} from 'pages/exploration-editor-page/services/exploration-warnings.service';
import {RouterService} from 'pages/exploration-editor-page/services/router.service';
import {TranslationStatusService} from 'pages/exploration-editor-page/translation-tab/services/translation-status.service';
import {
  NodeTitle,
  StateGraphVisualization,
} from './state-graph-visualization.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {GraphDataService} from 'pages/exploration-editor-page/services/graph-data.service';

class MockNgbModal {
  open() {
    return {
      result: Promise.resolve(),
    };
  }
}

class MockWindowDimensionsService {
  getResizeEvent() {
    return of(new Event('resize'));
  }
}

class MockRouterService {
  onCenterGraph = of(new Event('resize'));
}

@Pipe({name: 'truncate'})
class MockTruncatePipe {
  transform(value: string, params: number): string {
    return value;
  }
}

describe('State Graph Visualization Component when graph is redrawn', () => {
  let component: StateGraphVisualization;
  let fixture: ComponentFixture<StateGraphVisualization>;
  var explorationWarningsService: ExplorationWarningsService;
  var explorationStatesService: ExplorationStatesService;
  var stateGraphLayoutService: StateGraphLayoutService;
  var translationStatusService: TranslationStatusService;
  var mockUpdateGraphDataEmitter = new EventEmitter();
  var graphData = {
    nodes: {
      State1: 'State 1 Node',
    },
    links: [
      {
        connectsDestIfStuck: false,
        linkProperty: 'added',
        source: '',
        target: '',
      },
    ],
    initStateId: 'state_1',
    finalStateIds: [],
  };
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
      reachableFromEnd: true,
      style: 'string',
      nodeClass: 'string',
      canDelete: true,
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
      reachableFromEnd: false,
      secondaryLabel: '2nd',
      style: 'string',
      nodeClass: 'string',
      canDelete: true,
    },
    state_4: {
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
      label: 'This is a label for node 4',
      reachableFromEnd: true,
      secondaryLabel: '2nd',
      style: 'string',
      nodeClass: 'string',
      canDelete: true,
    },
  };

  class MockGraphDataService {
    getGraphData() {
      return graphData;
    }

    updateGraphData = mockUpdateGraphDataEmitter;
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [StateGraphVisualization, MockTruncatePipe],
      providers: [
        {
          provide: NgbModal,
          useClass: MockNgbModal,
        },
        ExplorationWarningsService,
        ExplorationStatesService,
        {
          provide: RouterService,
          useClass: MockRouterService,
        },
        StateGraphLayoutService,
        TranslationStatusService,
        {
          provide: GraphDataService,
          useClass: MockGraphDataService,
        },
        {
          provide: WindowDimensionsService,
          useClass: MockWindowDimensionsService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(StateGraphVisualization);
    component = fixture.componentInstance;

    stateGraphLayoutService = TestBed.inject(StateGraphLayoutService);
    explorationWarningsService = TestBed.inject(ExplorationWarningsService);
    translationStatusService = TestBed.inject(TranslationStatusService);
    explorationStatesService = TestBed.inject(ExplorationStatesService);

    component.allowPanning = true;
    component.centerAtCurrentState = true;
    component.currentStateId = 'state_1';
    component.initStateId2 = 'state_2';
    component.linkPropertyMapping = {
      added: 'background-color: red; ',
      deleted: 'background-color: red; ',
    };
    component.nodeColors = {
      state_1: '#000',
      state_2: '#ff0',
      state_3: '#fff',
    };
    component.nodeFill = '#fff';
    component.nodeSecondaryLabels = {
      state_3: 'This is a secondary label for state_3',
    };
    component.showTranslationWarnings = true;
    component.mainScreen = {
      nativeElement: {
        height: {
          baseVal: {
            convertToSpecifiedUnits(value: number) {
              return 1000;
            },
          },
        },
        width: {
          baseVal: {
            convertToSpecifiedUnits(value: number) {
              return 1000;
            },
          },
        },
      },
    };

    // This throws "Type 'null' is not assignable to parameter of
    // type 'State'." We need to suppress this error because of
    // the need to test validations. This error is thrown because
    // the state name is null.
    // @ts-ignore
    spyOn(explorationStatesService, 'getState').and.returnValue(null);
    spyOn(stateGraphLayoutService, 'computeLayout').and.returnValue(nodes);
    spyOn(
      translationStatusService,
      'getAllStatesNeedUpdatewarning'
    ).and.returnValue({
      'This is a label for node 1': ['red', 'green'],
    });
    spyOn(stateGraphLayoutService, 'getAugmentedLinks').and.returnValue([
      {
        // This throws "Type 'null' is not assignable to parameter of
        // type 'NodeData'." We need to suppress this error
        // because of the need to test validations. This error is
        // thrown because the source and target are null.
        // @ts-ignore
        source: null,
        // This throws "Type 'null' is not assignable to parameter of
        // type 'NodeData'." We need to suppress this error
        // because of the need to test validations. This error is
        // thrown because the source and target are null.
        // @ts-ignore
        target: null,
        // This throws "Type 'null' is not assignable to parameter of
        // type 'NodeData'." We need to suppress this error
        // because of the need to test validations. This error is
        // thrown because the source and target are null.
        // @ts-ignore
        d: null,
        style: '',
        connectsDestIfStuck: false,
      },
    ]);

    component.linkPropertyMapping = {
      added: 'string',
      deleted: 'string',
    };
    component.currentStateId = 'state_1';
    component.ngOnInit();
    tick();
    flush();
  }));

  afterEach(fakeAsync(() => {
    component.ngOnDestroy();
    flush();
    fixture.destroy();
  }));

  it('should call redrawGraph when graphData has updated', fakeAsync(() => {
    spyOn(component, 'redrawGraph').and.stub();

    // This throws "Type 'null' is not assignable to parameter of type
    // 'GraphData'." We need to suppress this error
    // because of the need to test validations. This error is
    // thrown because the graphData is null.
    // @ts-ignore
    component.versionGraphData = null;
    mockUpdateGraphDataEmitter.emit(graphData);
    tick();

    component.versionGraphData = graphData;
    mockUpdateGraphDataEmitter.emit(graphData);
    tick();

    expect(component.redrawGraph).toHaveBeenCalledTimes(1);

    flush();
  }));

  it('should initialize component properties after component is initialized', fakeAsync(() => {
    component.versionGraphData = graphData;
    component.ngOnInit();
    tick();

    expect(component.graphLoaded).toBeTrue();
    expect(component.GRAPH_WIDTH).toBe(630);
    expect(component.GRAPH_HEIGHT).toBe(280);
    expect(component.VIEWPORT_WIDTH).toBe('10000px');
    expect(component.VIEWPORT_HEIGHT).toBe('10000px');
    expect(component.VIEWPORT_X).toBe('-1260px');
    expect(component.VIEWPORT_Y).toBe('-1000px');

    expect(component.getGraphHeightInPixels()).toBe('300px');

    expect(component.augmentedLinks[0].style).toBe('string');
    expect(component.nodeList.length).toBe(3);

    flush();
  }));

  it(
    'should check if can navigate to node whenever node id is equal to' +
      ' current state id',
    fakeAsync(() => {
      spyOn(component, 'centerGraph');
      component.initStateId = 'nodeId';
      component.onNodeDeletionClick('nodeId2');
      component.getCenterGraph();
      tick();

      expect(component.centerGraph).toHaveBeenCalled();
      expect(component.canNavigateToNode('state_1')).toBe(false);
      expect(component.canNavigateToNode('state_3')).toBe(true);
    })
  );

  it(
    'should get node complete title with its secondary label and' + ' warnings',
    () => {
      spyOn(component, 'getNodeErrorMessage').and.returnValue('warning');

      expect(component.getNodeTitle(nodes.state_1)).toBe(
        'This is a label for node 1 Second label for node 1 ' +
          '(Warning: this state is unreachable.)'
      );

      expect(component.getNodeTitle(nodes.state_3 as NodeTitle)).toBe(
        'This is a label for node 3 This is a secondary label for ' +
          'state_3 (Warning: there is no path from this state to the ' +
          'END state.)'
      );

      expect(component.getNodeTitle(nodes.state_4)).toBe(
        'This is a label for node 4 2nd (warning)'
      );
    }
  );

  it('should get truncated label with truncate filter', () => {
    component.sendOnMaximizeFunction();
    component.sendOnClickFunctionData('');
    expect(component.getTruncatedLabel('This is a label for node 3')).toBe(
      'This is a la...'
    );
  });

  it(
    'should get node error message from node label when' +
      ' showTranslationWarnings is false',
    () => {
      component.showTranslationWarnings = false;
      var nodeErrorMessage = 'Node 1 error message from exploration warnings';
      spyOn(
        explorationWarningsService,
        'getAllStateRelatedWarnings'
      ).and.returnValue({
        'This is a label for node 1': [nodeErrorMessage],
      });
      expect(component.getNodeErrorMessage('This is a label for node 1')).toBe(
        nodeErrorMessage
      );
    }
  );

  it('should center the graph', fakeAsync(() => {
    component.ngOnInit();
    tick();

    component.graphData = graphData;
    component.centerAtCurrentState = true;
    component.graphBounds = {
      right: 30,
      left: 40,
      bottom: 5,
      top: 20,
    };

    component.centerGraph();
    tick();

    expect(component.overallTransformStr).toBe('translate(0,0)');

    flush();
  }));

  it('should throw error', fakeAsync(() => {
    component.currentStateId = 'currentStateId';
    component.centerAtCurrentState = true;
    component.allowPanning = false;
    component.origTranslations = [0, 0];
    component.nodeData = {
      data: {
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
        reachableFromEnd: false,
        secondaryLabel: '2nd',
        style: 'string',
        nodeClass: 'string',
        canDelete: true,
      },
    };
    component.centerGraph();
    tick();

    expect(component.origTranslations).toEqual([0, 0]);
    flush();
  }));

  it(
    'should center graph when centerGraph flag is broadcasted and transform' +
      ' x and y axis to 0',
    fakeAsync(() => {
      spyOn(component, 'getElementDimensions').and.returnValue({
        w: 1000,
        h: 1000,
      });

      component.ngOnInit();
      tick();

      spyOn(stateGraphLayoutService, 'getGraphBoundaries').and.returnValue({
        bottom: 20,
        left: 10,
        top: 10,
        right: 20,
      });
      flush();
      // Spies for d3 library.
      var zoomSpy = jasmine.createSpy('zoom').and.returnValue({
        scaleExtent: () => ({
          on: (evt: string, callback: () => void) => {
            callback();
            return {
              apply: () => {},
            };
          },
        }),
      });
      spyOnProperty(d3, 'zoom').and.returnValue(zoomSpy);
      spyOnProperty(d3, 'event').and.returnValue({
        transform: {
          x: 10,
          y: 20,
        },
      });

      component.makeGraphPannable();
      tick();
      flush();

      expect(component.innerTransformStr).toBe('translate(10,20)');
    })
  );

  it(
    'should center graph when centerGraph flag is broadcasted and transform' +
      ' x and y axis to 10, 20',
    fakeAsync(() => {
      component.ngOnInit();
      tick();

      spyOn(component, 'getElementDimensions').and.returnValue({
        w: 1000,
        h: 1000,
      });

      jasmine.createSpy('apply').and.stub();
      spyOn(stateGraphLayoutService, 'getGraphBoundaries').and.returnValue({
        bottom: 20,
        left: 10,
        top: 10,
        right: 20,
      });
      component.graphBounds = {
        right: 30,
        left: 40,
        bottom: 5,
        top: 20,
      };

      flush();
      // Spies for d3 library.
      var zoomSpy = jasmine.createSpy('zoom').and.returnValue({
        scaleExtent: () => ({
          on: (evt: string, callback: () => void) => {
            callback();
            return {
              apply: () => {},
            };
          },
        }),
      });
      spyOnProperty(d3, 'zoom').and.returnValue(zoomSpy);
      spyOnProperty(d3, 'event').and.returnValue({
        transform: {
          x: 10,
          y: 20,
        },
      });

      component.makeGraphPannable();
      tick();
      flush();

      expect(d3.event.transform.x).toBe(0);
      expect(d3.event.transform.y).toBe(0);
      expect(component.overallTransformStr).toBe('translate(465,487.5)');
    })
  );
});
