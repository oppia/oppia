// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the graph-viz.
 */

import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { GraphVizComponent } from './graph-viz.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { GraphDetailService } from './graph-detail.service';
import { DeviceInfoService } from 'services/contextual/device-info.service';
import { PlayerPositionService } from 'pages/exploration-player-page/services/player-position.service';
import { EventEmitter } from '@angular/core';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';

describe('GraphVizComponent', () => {
  let component: GraphVizComponent;
  let graphDetailService: GraphDetailService;
  let deviceInfoService: DeviceInfoService;
  let playerPositionService: PlayerPositionService;
  let focusManagerService: FocusManagerService;
  let fixture: ComponentFixture<GraphVizComponent>;
  let i18nLanguageCodeService: I18nLanguageCodeService;

  let mockNewCardAvailableEmitter = new EventEmitter();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [GraphVizComponent, MockTranslatePipe],
      providers: [
        GraphDetailService,
        DeviceInfoService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    graphDetailService = TestBed.inject(GraphDetailService);
    deviceInfoService = TestBed.inject(DeviceInfoService);
    playerPositionService = TestBed.get(PlayerPositionService);
    focusManagerService = TestBed.inject(FocusManagerService);
    fixture = TestBed.createComponent(GraphVizComponent);
    component = fixture.componentInstance;
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);

    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true);

    // Graph visulization
    //      1
    // p----------p
    //          -
    //     1   -
    //      -
    //    -
    //  -        p
    // p
    //
    // Note: Here 'p' represents the points, '-' represents the line and the
    // number above the line represents it's weight.
    //
    // These values are random, however the values have been injected into the
    // code during execution via the console to test if the values are valid.
    // I have used round number for x. y to make the tests easier to
    // understand. There is one vertex with floating point number to make sure
    // that the tests do not fail when a floating point number is used.
    component.graph = {
      vertices: [
        {
          x: 150,
          y: 50,
          label: ''
        },
        {
          x: 200,
          y: 50,
          label: ''
        },
        {
          x: 150,
          y: 100,
          label: ''
        },
        {
          x: 196.60939025878906,
          y: 95.05902099609375,
          label: ''
        }
      ],
      isDirected: false,
      isWeighted: true,
      isLabeled: false,
      edges: [
        {
          src: 0,
          weight: 1,
          dst: 1
        },
        {
          src: 1,
          weight: 1,
          dst: 2
        }
      ]
    };

    component.canAddVertex = true;
    component.canDeleteVertex = true;
    component.canMoveVertex = true;
    component.canEditVertexLabel = true;
    component.canAddEdge = true;
    component.canDeleteEdge = true;
    component.canEditEdgeWeight = true;
    component.interactionIsActive = true;
    component.canEditOptions = true;
  });

  // This compoenent gets executed when a graph made is diaplyed in the editor
  // or the interaction in the player.
  it('should initialise component, when a graph is displayed', () => {
    component.ngOnInit();

    // Only the basic values are initialised in ngOnInit() function. The rest
    // of the values are initialised in ngAfterViewInit(), .i.e, after the
    // initialisation of the components view is completed.
    expect(component.VERTEX_RADIUS).toBe(graphDetailService.VERTEX_RADIUS);
    expect(component.EDGE_WIDTH).toBe(graphDetailService.EDGE_WIDTH);
    expect(component.selectedEdgeWeightValue).toBe(0);
    expect(component.shouldShowWrongWeightWarning).toBe(false);
    expect(component.isMobile).toBe(false);
  });

  it('should set isMobile to true on initailisation if device' +
  ' used by the user is a mobile', () => {
    spyOn(deviceInfoService, 'isMobileDevice').and.returnValue(true);

    component.ngOnInit();

    expect(component.isMobile).toBe(true);
  });

  it('should reset current mode when user submits answer', () => {
    spyOnProperty(playerPositionService, 'onNewCardAvailable').and.returnValue(
      mockNewCardAvailableEmitter);
    // Function ngOnInit is run to add the componentSubscriptions.
    component.ngOnInit();

    // Pre-check.
    expect(component.state.currentMode).toBe(0);

    mockNewCardAvailableEmitter.emit();

    expect(component.state.currentMode).toBeNull();
  });

  it('should get RTL language status correctly', () => {
    expect(component.isLanguageRTL()).toBeTrue();
  });

  it('should set graph properties after the view is initialized', () => {
    spyOn(Element.prototype, 'querySelectorAll').and.callFake(
      jasmine.createSpy('querySelectorAll').and
        .returnValue([{
          width: {
            baseVal: {
              value: 527
            }
          },
          getAttribute: (attr) => {
            if (attr === 'height') {
              return 250;
            }
          },
          getBBox: () => {
            return {
              height: 120,
              width: 527,
              x: 144,
              y: -14,
            };
          },
        }]));
    spyOn(component, 'init').and.stub();

    component.ngAfterViewInit();

    expect(component.graphOptions).toEqual([{
      text: 'Labeled',
      option: 'isLabeled'
    },
    {
      text: 'Directed',
      option: 'isDirected'
    },
    {
      text: 'Weighted',
      option: 'isWeighted'
    }]);
    expect(component.helpText).toBeNull();
    expect(component.svgViewBox).toBe('0 0 527 250');
    // Function init() is only called when the interaction is active.
    // Therefore, we verify that the value of interactionIsActive is true
    // before calling the function init().
    expect(component.interactionIsActive).toBe(true);
    expect(component.init).toHaveBeenCalled();
  });

  it('should not intialise buttons and help text if interaction is not active'
    , () => {
      spyOn(Element.prototype, 'querySelectorAll').and.callFake(
        jasmine.createSpy('querySelectorAll').and
          .returnValue([{
            width: {
              baseVal: {
                value: 120
              }
            },
            getAttribute: (attr) => {
              if (attr === 'height') {
                return 250;
              }
            },
            getBBox: () => {
              return {
                height: 120,
                width: 527,
                x: 144,
                y: -14,
              };
            },
          }]));
      spyOn(component, 'init').and.stub();
      component.interactionIsActive = false;

      component.ngAfterViewInit();

      // Function init() is only called when the interaction is active.
      // Therefore, we verify that the value of interactionIsActive is false
      // before verifying that the function init() is not called.
      expect(component.interactionIsActive).toBe(false);
      expect(component.init).not.toHaveBeenCalled();
    });

  it('should initialise buttons when interaction is initialised and is' +
  ' active', () => {
    expect(component.buttons).toEqual([]);

    component.initButtons();

    expect(component.buttons).toEqual([{
      text: '\uF0B2',
      description: 'I18N_INTERACTIONS_GRAPH_MOVE',
      mode: component._MODES.MOVE
    },
    {
      text: '\uF0C1',
      description: 'I18N_INTERACTIONS_GRAPH_ADD_EDGE',
      mode: component._MODES.ADD_EDGE
    },
    {
      text: '\uF067',
      description: 'I18N_INTERACTIONS_GRAPH_ADD_NODE',
      mode: component._MODES.ADD_VERTEX
    },
    {
      text: '\uF068',
      description: 'I18N_INTERACTIONS_GRAPH_DELETE',
      mode: component._MODES.DELETE
    }
    ]);
  });

  it('should not initialise buttons when all flags are false', () => {
    component.canMoveVertex = false;
    component.canAddEdge = false;
    component.canAddVertex = false;
    component.canDeleteVertex = false;
    component.canDeleteEdge = false;

    expect(component.buttons).toEqual([]);

    component.initButtons();

    expect(component.buttons).toEqual([]);
  });

  // Please note that the conditions where both canDeleteVertex
  // and canDeleteEdge are either true or false is tested above.
  it('should initialise delete button when canDeleteVertex' +
  ' flag is true', () => {
    component.canDeleteVertex = true;
    component.canDeleteEdge = false;

    expect(component.buttons).toEqual([]);

    component.initButtons();

    expect(component.buttons).toContain({
      text: '\uF068',
      description: 'I18N_INTERACTIONS_GRAPH_DELETE',
      mode: component._MODES.DELETE
    });
  });

  it('should initialise delete button when canDeleteEdge flag is true', () => {
    component.canDeleteVertex = false;
    component.canDeleteEdge = true;

    expect(component.buttons).toEqual([]);

    component.initButtons();

    expect(component.buttons).toContain({
      text: '\uF068',
      description: 'I18N_INTERACTIONS_GRAPH_DELETE',
      mode: component._MODES.DELETE
    });
  });

  // The init function is called after the ngAfterViewInit function is executed.
  it('should set help text when user in mobile and user can add edges', () => {
    spyOn(component, 'initButtons').and.callThrough();
    component.canMoveVertex = false;
    component.canAddEdge = true;
    component.canAddVertex = false;
    component.canDeleteVertex = false;
    component.canDeleteEdge = false;
    component.isMobile = true;
    component.helpText = null;

    expect(component.state.currentMode).toBe(component._MODES.MOVE);
    expect(component.buttons).toEqual([]);

    component.init();

    expect(component.initButtons).toHaveBeenCalled();
    expect(component.buttons[0]).toEqual({
      text: '\uF0C1',
      description: 'I18N_INTERACTIONS_GRAPH_ADD_EDGE',
      mode: component._MODES.ADD_EDGE
    });
    expect(component.state.currentMode).toBe(component._MODES.ADD_EDGE);
    expect(component.isMobile).toBe(true);
    expect(component.helpText)
      .toBe('I18N_INTERACTIONS_GRAPH_EDGE_INITIAL_HELPTEXT');
  });

  it('should set help text when user in mobile and user can move' +
  ' vertices in the graph', () => {
    spyOn(component, 'initButtons').and.callThrough();
    component.canMoveVertex = true;
    component.canAddEdge = false;
    component.canAddVertex = false;
    component.canDeleteVertex = false;
    component.canDeleteEdge = false;
    component.isMobile = true;
    component.helpText = null;
    component.state.currentMode = component._MODES.ADD_EDGE;

    expect(component.buttons).toEqual([]);

    component.init();

    expect(component.initButtons).toHaveBeenCalled();
    expect(component.buttons[0]).toEqual({
      text: '\uF0B2',
      description: 'I18N_INTERACTIONS_GRAPH_MOVE',
      mode: component._MODES.MOVE
    });
    expect(component.state.currentMode).toBe(component._MODES.MOVE);
    // The help text must be displayed only if the user is using a mobile.
    // Therefore we check that the value of isMobile is true.
    expect(component.isMobile).toBe(true);
    expect(component.helpText)
      .toBe('I18N_INTERACTIONS_GRAPH_MOVE_INITIAL_HELPTEXT');
  });

  it('should not set help text when user is in mobile and cannot move' +
  ' vertices and add edges', () => {
    spyOn(component, 'initButtons').and.callThrough();
    component.canAddEdge = false;
    component.canMoveVertex = false;
    component.isMobile = true;
    component.helpText = null;

    expect(component.buttons).toEqual([]);
    expect(component.state.currentMode).toBe(component._MODES.MOVE);

    component.init();

    expect(component.buttons[0]).toEqual({
      text: '\uF067',
      description: 'I18N_INTERACTIONS_GRAPH_ADD_NODE',
      mode: component._MODES.ADD_VERTEX
    });
    expect(component.state.currentMode).toBe(component._MODES.ADD_VERTEX);
    expect(component.initButtons).toHaveBeenCalled();
    // The help text must be displayed only if the user is using a mobile.
    // Therefore we check that the value of isMobile is true.
    expect(component.isMobile).toBe(true);
    expect(component.helpText).toBe('');
  });

  it('should not set help text when user is not in mobile', () => {
    spyOn(component, 'initButtons').and.callThrough();
    component.isMobile = false;
    component.helpText = null;

    component.init();

    expect(component.initButtons).toHaveBeenCalled();
    // The help text must be displayed only if the user is using a mobile.
    // Therefore we check that the value of isMobile is false to make sure that
    // the help text was not set.
    expect(component.isMobile).toBe(false);
    expect(component.helpText).toBe('');
  });

  it('should return default edge colour if interaction is not active', () => {
    component.interactionIsActive = false;

    expect(component.getEdgeColor(0)).toBe(component.DEFAULT_COLOR);
  });

  it('should return delete edge colour when mouse hovers over edge' +
  'to delete it', () => {
    component.interactionIsActive = true;
    component.state.hoveredEdge = 0;
    component.state.currentMode = component._MODES.DELETE;

    // Pre-check.
    expect(component.canDeleteEdge).toBe(true);

    expect(component.getEdgeColor(0)).toBe(component.DELETE_COLOR);
  });

  it('should return hover edge colour when mouse hovers over edge', () => {
    component.interactionIsActive = true;
    component.state.hoveredEdge = 0;

    // Pre-check.
    // This check is to make sure the first if condition is false.
    expect(component.state.currentMode).not.toBe(component._MODES.DELETE);
    expect(component.interactionIsActive).toBe(true);

    expect(component.getEdgeColor(0)).toBe(component.HOVER_COLOR);
  });

  it('should return select edge colour when mouse selects an edge', () => {
    component.interactionIsActive = true;
    component.state.selectedEdge = 0;

    // Pre-check.
    // This check is to make sure the first if condition is false.
    expect(component.state.currentMode).not.toBe(component._MODES.DELETE);
    expect(component.state.hoveredEdge).toBeNull();
    expect(component.interactionIsActive).toBe(true);

    expect(component.getEdgeColor(0)).toBe(component.SELECT_COLOR);
  });

  it('should return default edge colour when edge is not selected' +
  ' or hovered over', () => {
    component.interactionIsActive = true;
    component.state.selectedEdge = 0;

    // Pre-check.
    expect(component.state.hoveredEdge).toBeNull();
    expect(component.interactionIsActive).toBe(true);

    expect(component.getEdgeColor(1)).toBe(component.DEFAULT_COLOR);
  });

  // Tests for getVertexColor function.
  it('should return default vertex colour if interaction is not active', () => {
    component.interactionIsActive = false;

    expect(component.getVertexColor(0)).toBe(component.DEFAULT_COLOR);
  });

  it('should return delete vertex colour when mouse hovers over vertex' +
  'to delete it', () => {
    component.interactionIsActive = true;
    component.state.hoveredVertex = 0;
    component.state.currentMode = component._MODES.DELETE;

    // Pre-check.
    expect(component.canDeleteEdge).toBe(true);
    expect(component.interactionIsActive).toBe(true);

    expect(component.getVertexColor(0)).toBe(component.DELETE_COLOR);
  });

  it('should return hover vertex colour when mouse drags a vertex', () => {
    component.interactionIsActive = true;
    component.state.currentlyDraggedVertex = 0;

    // Pre-check.
    // This check is to make sure the first if condition is false.
    expect(component.state.currentMode).not.toBe(component._MODES.DELETE);
    expect(component.interactionIsActive).toBe(true);

    expect(component.getVertexColor(0)).toBe(component.HOVER_COLOR);
  });

  it('should return hover vertex colour when mouse hovers over vertex', () => {
    component.interactionIsActive = true;
    component.state.hoveredVertex = 0;

    // Pre-check.
    // This check is to make sure the first if condition is false.
    expect(component.state.currentMode).not.toBe(component._MODES.DELETE);
    expect(component.interactionIsActive).toBe(true);

    expect(component.getVertexColor(0)).toBe(component.HOVER_COLOR);
  });

  it('should return select vertex colour when mouse selects an vertex', () => {
    component.interactionIsActive = true;
    component.state.selectedVertex = 0;

    // Pre-check.
    // This check is to make sure the first if condition is false.
    expect(component.state.currentMode).not.toBe(component._MODES.DELETE);
    expect(component.state.hoveredVertex).toBeNull();
    expect(component.interactionIsActive).toBe(true);

    expect(component.getVertexColor(0)).toBe(component.SELECT_COLOR);
  });

  it('should return default vertex colour when vertex is not selected' +
  ' or hovered over', () => {
    component.interactionIsActive = true;
    component.state.selectedVertex = 0;

    // Pre-check.
    expect(component.state.hoveredVertex).toBeNull();
    expect(component.interactionIsActive).toBe(true);

    expect(component.getVertexColor(1)).toBe(component.DEFAULT_COLOR);
  });

  it('should return arrow points when directed option is selected in' +
  'the graph interaction', () => {
    spyOn(graphDetailService, 'getDirectedEdgeArrowPoints').and.callThrough();
    // Pre-check;
    expect(component.graph).toEqual({
      vertices: [
        {
          x: 150,
          y: 50,
          label: ''
        },
        {
          x: 200,
          y: 50,
          label: ''
        },
        {
          x: 150,
          y: 100,
          label: ''
        },
        {
          x: 196.60939025878906,
          y: 95.05902099609375,
          label: ''
        }
      ],
      isDirected: false,
      isWeighted: true,
      isLabeled: false,
      edges: [
        {
          src: 0,
          weight: 1,
          dst: 1
        },
        {
          src: 1,
          weight: 1,
          dst: 2
        }
      ]
    });

    expect(component.getDirectedEdgeArrowPoints(0))
      .toBe('196,50 186,45 186,55');
    expect(graphDetailService.getDirectedEdgeArrowPoints).toHaveBeenCalledWith(
      component.graph, 0);
  });

  it('should return edge center points when weighted option is selected in' +
  'the graph interaction', () => {
    spyOn(graphDetailService, 'getEdgeCentre').and.callThrough();
    // Pre-check;
    expect(component.graph).toEqual({
      vertices: [
        {
          x: 150,
          y: 50,
          label: ''
        },
        {
          x: 200,
          y: 50,
          label: ''
        },
        {
          x: 150,
          y: 100,
          label: ''
        },
        {
          x: 196.60939025878906,
          y: 95.05902099609375,
          label: ''
        }
      ],
      isDirected: false,
      isWeighted: true,
      isLabeled: false,
      edges: [
        {
          src: 0,
          weight: 1,
          dst: 1
        },
        {
          src: 1,
          weight: 1,
          dst: 2
        }
      ]
    });

    expect(component.getEdgeCentre(0)).toEqual({
      x: 175,
      y: 50
    });
    expect(graphDetailService.getEdgeCentre).toHaveBeenCalledWith(
      component.graph, 0);
  });

  it('should change location of vertex when dragged by mouse', () => {
    // These values are the coordinates of the mouse when the mouse event
    // was triggered.
    let dummyMouseEvent = new MouseEvent('mousemove', {
      clientX: 775,
      clientY: 307
    });
    spyOn(Element.prototype, 'querySelectorAll').and.callFake(
      jasmine.createSpy('querySelectorAll').and
        .returnValue([{
          width: {
            baseVal: {
              value: 120
            }
          },
          getAttribute: (attr) => {
            if (attr === 'height') {
              return 250;
            }
          },
          getBBox: () => {
            return {
              height: 120,
              width: 527,
              x: 144,
              y: -14,
            };
          },
          createSVGPoint: () => {
            return {
              matrixTransform: (matrix) => {
                return {
                  x: 775,
                  y: 307
                };
              },
              x: 0,
              y: 0
            };
          },
          getScreenCTM: () => {
            return {
              inverse: () => {
                return;
              }
            };
          },
        }]));
    spyOn(component, 'init').and.stub();
    component.state.currentlyDraggedVertex = 0;
    component.state.vertexDragStartX = 0;
    component.state.vertexDragStartY = 0;
    component.state.mouseDragStartX = 0;
    component.state.mouseDragStartY = 0;

    component.ngAfterViewInit();
    component.mousemoveGraphSVG(dummyMouseEvent);

    expect(component.state.mouseX).toBe(775);
    expect(component.state.mouseY).toBe(307);
    expect(component.graph.vertices[component.state.currentlyDraggedVertex])
      .toEqual({x: 775, y: 307, label: ''});
  });

  it('should not change position of vertex when interaction is not' +
  ' active', () => {
    component.state.currentlyDraggedVertex = 0;
    component.interactionIsActive = false;
    // These values are the coordinates of the mouse when the mouse event
    // was triggered.
    let dummyMouseEvent = new MouseEvent('mousemove', {
      clientX: 775,
      clientY: 307
    });

    component.mousemoveGraphSVG(dummyMouseEvent);

    expect(component.state.mouseX).toBe(0);
    expect(component.state.mouseY).toBe(0);
    expect(component.graph.vertices[component.state.currentlyDraggedVertex])
      .toEqual({
        x: 150,
        y: 50,
        label: ''
      });
  });

  it('should add vertex when graph is clicked and interaction is' +
  ' active', () => {
    component.state.currentMode = component._MODES.ADD_VERTEX;
    component.state.mouseX = 20;
    component.state.mouseY = 20;

    expect(component.graph.vertices).toEqual([
      {
        x: 150,
        y: 50,
        label: ''
      },
      {
        x: 200,
        y: 50,
        label: ''
      },
      {
        x: 150,
        y: 100,
        label: ''
      },
      {
        x: 196.60939025878906,
        y: 95.05902099609375,
        label: ''
      }
    ]);

    component.onClickGraphSVG();

    // Function onClickGraphSVG() must only run if the interaction is active.
    // Therefore the value of interactionIsActive is verified to be true before
    // the rest of the lines are executed.
    expect(component.interactionIsActive).toBe(true);
    expect(component.canAddEdge).toBe(true);
    expect(component.graph.vertices).toEqual([
      {
        x: 150,
        y: 50,
        label: ''
      },
      {
        x: 200,
        y: 50,
        label: ''
      },
      {
        x: 150,
        y: 100,
        label: ''
      },
      {
        x: 196.60939025878906,
        y: 95.05902099609375,
        label: ''
      },
      {
        x: 20,
        y: 20,
        label: ''
      }
    ]);
  });

  it('should not add vertex when the user is not allowed to add a' +
  ' vertex', () => {
    component.state.currentMode = component._MODES.ADD_VERTEX;
    component.state.mouseX = 20;
    component.state.mouseY = 20;
    component.interactionIsActive = true;
    component.canAddVertex = false;

    expect(component.graph.vertices).toEqual([
      {
        x: 150,
        y: 50,
        label: ''
      },
      {
        x: 200,
        y: 50,
        label: ''
      },
      {
        x: 150,
        y: 100,
        label: ''
      },
      {
        x: 196.60939025878906,
        y: 95.05902099609375,
        label: ''
      }
    ]);

    component.onClickGraphSVG();

    // Function onClickGraphSVG() must only run if the interaction is active.
    // Therefore the value of interactionIsActive is verified to be true before
    // the rest of the lines are executed.
    expect(component.interactionIsActive).toBe(true);
    expect(component.graph.vertices).toEqual([
      {
        x: 150,
        y: 50,
        label: ''
      },
      {
        x: 200,
        y: 50,
        label: ''
      },
      {
        x: 150,
        y: 100,
        label: ''
      },
      {
        x: 196.60939025878906,
        y: 95.05902099609375,
        label: ''
      }
    ]);
  });

  it('should not add vertex when interaction is not active', () => {
    component.state.currentMode = component._MODES.ADD_VERTEX;
    component.state.mouseX = 20;
    component.state.mouseY = 20;
    component.state.selectedVertex = 1;
    component.state.selectedEdge = 1;
    component.interactionIsActive = false;

    expect(component.graph.vertices).toEqual([
      {
        x: 150,
        y: 50,
        label: ''
      },
      {
        x: 200,
        y: 50,
        label: ''
      },
      {
        x: 150,
        y: 100,
        label: ''
      },
      {
        x: 196.60939025878906,
        y: 95.05902099609375,
        label: ''
      }
    ]);
    expect(component.state.selectedVertex).toBe(1);
    expect(component.state.selectedEdge).toBe(1);

    component.onClickGraphSVG();

    // Function onClickGraphSVG() must only run if the interaction is active.
    // Therefore the value of interactionIsActive is verified to be false before
    // testing if a vertice was not added.
    expect(component.interactionIsActive).toBe(false);
    expect(component.graph.vertices).toEqual([
      {
        x: 150,
        y: 50,
        label: ''
      },
      {
        x: 200,
        y: 50,
        label: ''
      },
      {
        x: 150,
        y: 100,
        label: ''
      },
      {
        x: 196.60939025878906,
        y: 95.05902099609375,
        label: ''
      }
    ]);
    expect(component.state.selectedVertex).toBe(1);
    expect(component.state.selectedEdge).toBe(1);
  });

  it('should set selectedVertex to null if hoveredVertex is null', () => {
    component.state.selectedVertex = 1;

    component.onClickGraphSVG();

    expect(component.interactionIsActive).toBe(true);
    // This to test the pre-condition for setting selectedVertex to null.
    expect(component.state.hoveredVertex).toBeNull();
    expect(component.state.selectedVertex).toBeNull();
  });

  it('should not set selectedVertex to null if hoveredVertex is not' +
  ' null', () => {
    component.state.selectedVertex = 1;
    component.state.hoveredVertex = 1;

    expect(component.state.selectedVertex).toBe(1);

    component.onClickGraphSVG();

    expect(component.interactionIsActive).toBe(true);
    // This to test the pre-condition for setting selectedVertex to null.
    expect(component.state.hoveredVertex).toBe(1);
    expect(component.state.selectedVertex).toBe(1);
  });

  it('should set selectedEdge to null if hoveredVertex is null', () => {
    component.state.selectedEdge = 1;

    component.onClickGraphSVG();

    expect(component.interactionIsActive).toBe(true);
    // This to test the pre-condition for setting selectedEdge to null.
    expect(component.state.hoveredEdge).toBeNull();
    expect(component.state.selectedEdge).toBeNull();
  });

  it('should not set selectedEdge to null if hoveredEdge is not' +
  ' null', () => {
    component.state.selectedEdge = 1;
    component.state.hoveredEdge = 1;

    expect(component.state.selectedEdge).toBe(1);

    component.onClickGraphSVG();

    expect(component.interactionIsActive).toBe(true);
    // This to test the pre-condition for setting selectedVertex to null.
    expect(component.state.hoveredEdge).toBe(1);
    expect(component.state.selectedEdge).toBe(1);
  });

  it('should toggle isLabeled flag when user selects Labeled option', () => {
    expect(component.graph.isLabeled).toBe(false);

    component.toggleGraphOption('isLabeled');

    expect(component.graph.isLabeled).toBe(true);

    component.toggleGraphOption('isLabeled');

    expect(component.graph.isLabeled).toBe(false);
  });

  it('should toggle isWeighted option when user selects' +
  ' Weighted option', () => {
    expect(component.graph.isWeighted).toBe(true);

    component.toggleGraphOption('isWeighted');

    expect(component.graph.isWeighted).toBe(false);

    component.toggleGraphOption('isWeighted');

    expect(component.graph.isWeighted).toBe(true);
  });

  it('should set isDirected to true when user selects Directed option', () => {
    expect(component.graph.isDirected).toBe(false);

    component.toggleGraphOption('isDirected');

    expect(component.graph.isDirected).toBe(true);
  });

  it('should set isDirected to false and extra edges are removed' +
  'when user deselects Directed option', () => {
    component.graph.isDirected = true;
    component.graph.edges.push({
      src: 2,
      weight: 1,
      dst: 1
    });

    component.toggleGraphOption('isDirected');

    expect(component.graph.isDirected).toBe(false);
    expect(component.graph.edges).toEqual([
      {
        src: 0,
        weight: 1,
        dst: 1
      },
      {
        src: 1,
        weight: 1,
        dst: 2
      }
    ]);
  });

  it('should set to move mode when move button is clicked', () => {
    spyOn(Event.prototype, 'preventDefault');
    component.state.addEdgeVertex = 1;
    component.state.selectedVertex = 1;
    component.state.selectedEdge = 1;
    component.state.currentlyDraggedVertex = 1;
    component.state.hoveredVertex = 1;
    component.state.currentMode = null;

    expect(component.helpText).toBe('');

    let dummyMouseEvent = new MouseEvent('click');

    component.onClickModeButton(component._MODES.MOVE, dummyMouseEvent);

    // This is a pre-condition for setting a mode.
    expect(component.interactionIsActive).toBe(true);
    expect(Event.prototype.preventDefault).toHaveBeenCalled();
    expect(component.state.currentMode).toBe(component._MODES.MOVE);
    expect(component.state.addEdgeVertex).toBeNull();
    expect(component.state.selectedVertex).toBeNull();
    expect(component.state.selectedEdge).toBeNull();
    expect(component.state.currentlyDraggedVertex).toBeNull();
    expect(component.state.hoveredVertex).toBeNull();
    // The value of help text changes only if user is using a mobile.
    expect(component.helpText).toBeNull();
  });

  it('should set helkp text for move button if user is using a mobile', () => {
    spyOn(Event.prototype, 'preventDefault');
    component.isMobile = true;

    expect(component.helpText).toBe('');

    let dummyMouseEvent = new MouseEvent('click');

    component.onClickModeButton(component._MODES.MOVE, dummyMouseEvent);

    // This is a pre-condition for setting a mode.
    expect(component.interactionIsActive).toBe(true);
    expect(Event.prototype.preventDefault).toHaveBeenCalled();
    expect(component.state.currentMode).toBe(component._MODES.MOVE);
    // The value of help text changes only if user is using a mobile.
    expect(component.helpText)
      .toBe('I18N_INTERACTIONS_GRAPH_MOVE_INITIAL_HELPTEXT');
  });

  it('should set to add edge mode when add edge button is clicked', () => {
    spyOn(Event.prototype, 'preventDefault');
    component.state.addEdgeVertex = 1;
    component.state.selectedVertex = 1;
    component.state.selectedEdge = 1;
    component.state.currentlyDraggedVertex = 1;
    component.state.hoveredVertex = 1;
    component.state.currentMode = null;

    expect(component.helpText).toBe('');

    let dummyMouseEvent = new MouseEvent('click');

    component.onClickModeButton(component._MODES.ADD_EDGE, dummyMouseEvent);

    // This is a pre-condition for setting a mode.
    expect(component.interactionIsActive).toBe(true);
    expect(Event.prototype.preventDefault).toHaveBeenCalled();
    expect(component.state.currentMode).toBe(component._MODES.ADD_EDGE);
    expect(component.state.addEdgeVertex).toBeNull();
    expect(component.state.selectedVertex).toBeNull();
    expect(component.state.selectedEdge).toBeNull();
    expect(component.state.currentlyDraggedVertex).toBeNull();
    expect(component.state.hoveredVertex).toBeNull();
    // The value of help text changes only if user is using a mobile.
    expect(component.helpText).toBeNull();
  });

  it('should set help text for add edge button if user is using mobile', () => {
    spyOn(Event.prototype, 'preventDefault');
    component.isMobile = true;

    expect(component.helpText).toBe('');

    let dummyMouseEvent = new MouseEvent('click');

    component.onClickModeButton(component._MODES.ADD_EDGE, dummyMouseEvent);

    // This is a pre-condition for setting a mode.
    expect(component.interactionIsActive).toBe(true);
    expect(Event.prototype.preventDefault).toHaveBeenCalled();
    expect(component.state.currentMode).toBe(component._MODES.ADD_EDGE);
    // The value of help text changes only if user is using a mobile.
    expect(component.helpText)
      .toBe('I18N_INTERACTIONS_GRAPH_EDGE_INITIAL_HELPTEXT');
  });

  it('should set to add edge mode when add edge button is clicked', () => {
    spyOn(Event.prototype, 'preventDefault');
    component.state.addEdgeVertex = 1;
    component.state.selectedVertex = 1;
    component.state.selectedEdge = 1;
    component.state.currentlyDraggedVertex = 1;
    component.state.hoveredVertex = 1;
    component.state.currentMode = null;

    expect(component.helpText).toBe('');

    let dummyMouseEvent = new MouseEvent('click');

    component.onClickModeButton(component._MODES.ADD_VERTEX, dummyMouseEvent);

    // This is a pre-condition for setting a mode.
    expect(component.interactionIsActive).toBe(true);
    expect(Event.prototype.preventDefault).toHaveBeenCalled();
    expect(component.state.currentMode).toBe(component._MODES.ADD_VERTEX);
    expect(component.state.addEdgeVertex).toBeNull();
    expect(component.state.selectedVertex).toBeNull();
    expect(component.state.selectedEdge).toBeNull();
    expect(component.state.currentlyDraggedVertex).toBeNull();
    expect(component.state.hoveredVertex).toBeNull();
    // The value of help text changes only if user is using a mobile.
    expect(component.helpText).toBeNull();
  });

  it('should set help text to null for add vertex button if user is' +
  ' using mobile', () => {
    spyOn(Event.prototype, 'preventDefault');
    component.isMobile = true;

    expect(component.helpText).toBe('');

    let dummyMouseEvent = new MouseEvent('click');

    component.onClickModeButton(component._MODES.ADD_VERTEX, dummyMouseEvent);

    // This is a pre-condition for setting a mode.
    expect(component.interactionIsActive).toBe(true);
    expect(Event.prototype.preventDefault).toHaveBeenCalled();
    expect(component.state.currentMode).toBe(component._MODES.ADD_VERTEX);
    // The value of help text changes only if user is using a mobile.
    expect(component.helpText).toBeNull();
  });

  it('should set to add delete mode when delete button is clicked', () => {
    spyOn(Event.prototype, 'preventDefault');
    component.state.addEdgeVertex = 1;
    component.state.selectedVertex = 1;
    component.state.selectedEdge = 1;
    component.state.currentlyDraggedVertex = 1;
    component.state.hoveredVertex = 1;
    component.state.currentMode = null;

    expect(component.helpText).toBe('');

    let dummyMouseEvent = new MouseEvent('click');

    component.onClickModeButton(component._MODES.DELETE, dummyMouseEvent);

    // This is a pre-condition for setting a mode.
    expect(component.interactionIsActive).toBe(true);
    expect(Event.prototype.preventDefault).toHaveBeenCalled();
    expect(component.state.currentMode).toBe(component._MODES.DELETE);
    expect(component.state.addEdgeVertex).toBeNull();
    expect(component.state.selectedVertex).toBeNull();
    expect(component.state.selectedEdge).toBeNull();
    expect(component.state.currentlyDraggedVertex).toBeNull();
    expect(component.state.hoveredVertex).toBeNull();
    // The value of help text changes only if user is using a mobile.
    expect(component.helpText).toBeNull();
  });

  it('should set help text to null for delete button if user is' +
  ' using mobile', () => {
    spyOn(Event.prototype, 'preventDefault');
    component.isMobile = true;

    expect(component.helpText).toBe('');

    let dummyMouseEvent = new MouseEvent('click');

    component.onClickModeButton(component._MODES.DELETE, dummyMouseEvent);

    // This is a pre-condition for setting a mode.
    expect(component.interactionIsActive).toBe(true);
    expect(Event.prototype.preventDefault).toHaveBeenCalled();
    expect(component.state.currentMode).toBe(component._MODES.DELETE);
    // The value of help text changes only if user is using a mobile.
    expect(component.helpText).toBeNull();
  });

  it('should set mode if interaction is not active', () => {
    spyOn(Event.prototype, 'preventDefault');
    spyOn(component, 'setMode');
    component.interactionIsActive = false;

    let dummyMouseEvent = new MouseEvent('click');

    component.onClickModeButton(component._MODES.DELETE, dummyMouseEvent);
    expect(component.setMode).not.toHaveBeenCalled();
  });

  it('should delete vertex when user clicks on the vertex', () => {
    component.state.currentMode = component._MODES.DELETE;
    spyOn(component, 'deleteVertex').and.callThrough();

    expect(component.graph.vertices).toEqual([{
      x: 150,
      y: 50,
      label: ''
    },
    {
      x: 200,
      y: 50,
      label: ''
    },
    {
      x: 150,
      y: 100,
      label: ''
    },
    {
      x: 196.60939025878906,
      y: 95.05902099609375,
      label: ''
    }]);

    component.onClickVertex(0);

    expect(component.deleteVertex).toHaveBeenCalledWith(0);
    expect(component.graph.vertices).toEqual([{
      x: 200,
      y: 50,
      label: ''
    },
    {
      x: 150,
      y: 100,
      label: ''
    },
    {
      x: 196.60939025878906,
      y: 95.05902099609375,
      label: ''
    }]);
  });

  it('should add vertex when user clicks on the graph', () => {
    component.state.currentMode = component._MODES.ADD_VERTEX;
    component.graph.isLabeled = true;
    spyOn(component, 'beginEditVertexLabel').and.callThrough();
    spyOn(focusManagerService, 'setFocus');

    expect(component.state.selectedVertex).toBeNull();

    component.onClickVertex(0);

    expect(component.beginEditVertexLabel).toHaveBeenCalledWith(0);
    expect(component.state.selectedVertex).toBe(0);
    expect(focusManagerService.setFocus)
      .toHaveBeenCalledWith('vertexLabelEditBegun');
  });

  it('should start adding edge when user clicks a vertex in a mobile', () => {
    component.state.currentMode = component._MODES.ADD_EDGE;
    component.isMobile = true;
    spyOn(component, 'onTouchInitialVertex').and.callThrough();
    spyOn(component, 'beginAddEdge').and.callThrough();

    expect(component.state.hoveredVertex).toBeNull();
    expect(component.state.addEdgeVertex).toBeNull();
    expect(component.helpText).toBe('');

    component.onClickVertex(0);

    expect(component.onTouchInitialVertex).toHaveBeenCalledWith(0);
    expect(component.state.hoveredVertex).toBe(0);
    expect(component.beginAddEdge).toHaveBeenCalledWith(0);
    expect(component.state.addEdgeVertex).toBe(0);
    expect(component.helpText)
      .toBe('I18N_INTERACTIONS_GRAPH_EDGE_FINAL_HELPTEXT');
  });

  it('should move vertex when user clicks a vertex in a mobile', () => {
    component.state.currentMode = component._MODES.MOVE;
    component.isMobile = true;
    component.state.mouseX = 20;
    component.state.mouseY = 20;
    spyOn(component, 'onTouchInitialVertex').and.callThrough();
    spyOn(component, 'beginDragVertex').and.callThrough();

    expect(component.state.currentlyDraggedVertex).toBeNull();
    expect(component.state.hoveredVertex).toBeNull();
    expect(component.state.vertexDragStartX).toBe(0);
    expect(component.state.vertexDragStartY).toBe(0);
    expect(component.state.mouseDragStartX).toBe(0);
    expect(component.state.mouseDragStartY).toBe(0);
    expect(component.helpText).toBe('');

    component.onClickVertex(0);

    expect(component.onTouchInitialVertex).toHaveBeenCalledWith(0);
    expect(component.state.hoveredVertex).toBe(0);
    expect(component.beginDragVertex).toHaveBeenCalledWith(0);
    expect(component.state.currentlyDraggedVertex).toBe(0);
    expect(component.state.vertexDragStartX).toBe(150);
    expect(component.state.vertexDragStartY).toBe(50);
    expect(component.state.mouseDragStartX).toBe(20);
    expect(component.state.mouseDragStartY).toBe(20);
    expect(component.helpText)
      .toBe('I18N_INTERACTIONS_GRAPH_MOVE_FINAL_HELPTEXT');
  });

  it('should show help text to start edge creation when a user is using a' +
  ' mobile', () => {
    component.state.addEdgeVertex = 0;
    component.state.hoveredVertex = 1;
    component.isMobile = true;

    expect(component.helpText).toBe('');

    component.onClickVertex(0);

    expect(component.state.hoveredVertex).toBeNull();
    expect(component.helpText)
      .toBe('I18N_INTERACTIONS_GRAPH_EDGE_INITIAL_HELPTEXT');
    expect(component.state.addEdgeVertex).toBeNull();
  });

  it('should stop moving vertex when user is using a mobile clicks on the' +
  ' graph', () => {
    component.state.currentMode = component._MODES.MOVE;
    component.state.addEdgeVertex = 1;
    component.state.hoveredVertex = 1;
    component.state.currentlyDraggedVertex = 1;
    component.isMobile = true;
    spyOn(component, 'onTouchFinalVertex').and.callThrough();
    spyOn(component, 'endDragVertex').and.callThrough();

    expect(component.helpText).toBe('');

    component.onClickVertex(0);

    expect(component.onTouchFinalVertex).toHaveBeenCalledWith(0);
    expect(component.helpText)
      .toBe('I18N_INTERACTIONS_GRAPH_MOVE_INITIAL_HELPTEXT');
    expect(component.endDragVertex).toHaveBeenCalled();
    expect(component.state.hoveredVertex).toBeNull();
  });

  it('should add an edge when user using a mobile clicks on the final' +
  ' vertex', () => {
    component.state.currentMode = component._MODES.ADD_EDGE;
    component.state.addEdgeVertex = 1;
    component.state.hoveredVertex = 1;
    component.state.currentlyDraggedVertex = 1;
    component.isMobile = true;
    spyOn(component, 'onTouchFinalVertex').and.callThrough();
    spyOn(component, 'tryAddEdge').and.callThrough();
    spyOn(component, 'endAddEdge').and.callThrough();

    expect(component.helpText).toBe('');

    component.onClickVertex(0);

    expect(component.onTouchFinalVertex).toHaveBeenCalledWith(0);
    expect(component.tryAddEdge).toHaveBeenCalledWith(1, 0);
    expect(component.endAddEdge).toHaveBeenCalled();
    expect(component.helpText)
      .toBe('I18N_INTERACTIONS_GRAPH_EDGE_INITIAL_HELPTEXT');
    expect(component.state.hoveredVertex).toBeNull();
  });

  it('should add edge when user presses mouse down.', () => {
    component.state.currentMode = component._MODES.ADD_EDGE;
    spyOn(component, 'beginAddEdge').and.callThrough();

    expect(component.state.addEdgeVertex).toBeNull();

    component.onMousedownVertex(0);

    expect(component.isMobile).toBe(false);
    expect(component.canAddEdge).toBe(true);
    expect(component.beginAddEdge).toHaveBeenCalledWith(0);
    expect(component.state.addEdgeVertex).toBe(0);
  });

  it('should drag vertex when user presses mouse down.', () => {
    component.state.currentMode = component._MODES.MOVE;
    component.state.mouseX = 20;
    component.state.mouseY = 20;
    spyOn(component, 'beginDragVertex').and.callThrough();

    expect(component.state.addEdgeVertex).toBeNull();
    expect(component.state.currentlyDraggedVertex).toBeNull();
    expect(component.state.vertexDragStartX).toBe(0);
    expect(component.state.vertexDragStartY).toBe(0);
    expect(component.state.mouseDragStartX).toBe(0);
    expect(component.state.mouseDragStartY).toBe(0);

    component.onMousedownVertex(0);

    expect(component.isMobile).toBe(false);
    expect(component.canMoveVertex).toBe(true);
    expect(component.beginDragVertex).toHaveBeenCalledWith(0);
    expect(component.state.currentlyDraggedVertex).toBe(0);
    expect(component.state.vertexDragStartX).toBe(150);
    expect(component.state.vertexDragStartY).toBe(50);
    expect(component.state.mouseDragStartX).toBe(20);
    expect(component.state.mouseDragStartY).toBe(20);
  });

  it('should not run onMousedownVertex when user uses a mobile phone', () => {
    component.isMobile = true;
    spyOn(component, 'beginAddEdge');
    spyOn(component, 'beginDragVertex');

    expect(component.state.addEdgeVertex).toBeNull();

    component.onMousedownVertex(0);

    expect(component.isMobile).toBe(true);
    expect(component.beginAddEdge).not.toHaveBeenCalled();
    expect(component.beginDragVertex).not.toHaveBeenCalled();
  });

  it('should not run onMouseleaveVertex when user uses a mobile phone', () => {
    component.isMobile = true;

    expect(component.state.hoveredVertex).toBeNull();

    component.onMouseleaveVertex(0);

    expect(component.state.hoveredVertex).toBeNull();
  });

  it('should set hoveredVertex to null from index when' +
  ' once user\'s mouse leaves vertex', () => {
    component.state.hoveredVertex = 0;

    component.onMouseleaveVertex(0);

    expect(component.state.hoveredVertex).toBeNull();
  });

  it('should edit vertex label when user clicks the label', () => {
    component.graph.isLabeled = true;
    spyOn(component, 'beginEditVertexLabel').and.callThrough();
    spyOn(focusManagerService, 'setFocus');

    expect(component.state.selectedVertex).toBeNull();

    component.onClickVertexLabel(0);

    expect(component.canEditVertexLabel).toBe(true);
    expect(component.state.hoveredVertex).toBeNull();
    expect(component.beginEditVertexLabel).toHaveBeenCalledWith(0);
    expect(focusManagerService.setFocus)
      .toHaveBeenCalledWith('vertexLabelEditBegun');
  });

  it('should delete edge when user clicks the edge', () => {
    component.state.currentMode = component._MODES.DELETE;
    component.state.hoveredEdge = 0;
    spyOn(component, 'deleteEdge').and.callThrough();

    expect(component.canDeleteEdge).toBe(true);
    expect(component.graph.edges).toEqual([
      {
        src: 0,
        weight: 1,
        dst: 1
      },
      {
        src: 1,
        weight: 1,
        dst: 2
      }
    ]);

    component.onClickEdge(0);

    expect(component.deleteEdge).toHaveBeenCalledWith(0);
    expect(component.state.hoveredEdge).toBeNull();
    expect(component.graph.edges).toEqual([
      {
        src: 1,
        weight: 1,
        dst: 2
      }
    ]);
  });

  it('should edit edge weight when user clicks the edge weight', () => {
    component.state.hoveredEdge = 0;
    spyOn(focusManagerService, 'setFocus');
    spyOn(component, 'beginEditEdgeWeight').and.callThrough();

    expect(component.canDeleteEdge).toBe(true);
    expect(component.state.selectedEdge).toBeNull();
    expect(component.selectedEdgeWeightValue).toBeUndefined();
    expect(component.shouldShowWrongWeightWarning).toBeUndefined();

    component.onClickEdge(0);

    expect(component.graph.isWeighted).toBe(true);
    expect(component.canEditEdgeWeight).toBe(true);
    expect(component.beginEditEdgeWeight).toHaveBeenCalledWith(0);
    expect(component.state.selectedEdge).toBe(0);
    expect(component.selectedEdgeWeightValue).toBe(1);
    expect(component.shouldShowWrongWeightWarning).toBe(false);
    expect(focusManagerService.setFocus)
      .toHaveBeenCalledWith('edgeWeightEditBegun');
  });

  // This function only executes on mouse actions.
  it('should not add edge when user is using a mobile', () => {
    component.isMobile = true;
    spyOn(component, 'tryAddEdge');
    spyOn(component, 'endAddEdge');
    spyOn(component, 'endDragVertex');

    component.onMouseupDocument();

    expect(component.tryAddEdge).not.toHaveBeenCalled();
    expect(component.endAddEdge).not.toHaveBeenCalled();
    expect(component.endDragVertex).not.toHaveBeenCalled();
  });

  it('should start adding edge when user\'s mouse button goes up',
    fakeAsync(() => {
      component.state.currentMode = component._MODES.ADD_EDGE;
      component.state.hoveredVertex = 2;
      component.state.addEdgeVertex = 0;
      spyOn(component, 'tryAddEdge').and.callThrough();

      expect(component.isMobile).toBe(false);
      expect(component.graph.edges).toEqual([
        {
          src: 0,
          weight: 1,
          dst: 1
        },
        {
          src: 1,
          weight: 1,
          dst: 2
        }
      ]);

      component.onMouseupDocument();
      tick(10);

      expect(component.tryAddEdge).toHaveBeenCalledWith(0, 2);
      expect(component.graph.edges).toEqual([
        {
          src: 0,
          weight: 1,
          dst: 1
        },
        {
          src: 1,
          weight: 1,
          dst: 2
        },
        {
          src: 0,
          weight: 1,
          dst: 2
        }
      ]);
    }));

  it('should not add edge if it is already present',
    fakeAsync(() => {
      component.state.currentMode = component._MODES.ADD_EDGE;
      component.state.hoveredVertex = 1;
      component.state.addEdgeVertex = 0;
      spyOn(component, 'tryAddEdge').and.callThrough();

      expect(component.isMobile).toBe(false);
      expect(component.graph.edges).toEqual([
        {
          src: 0,
          weight: 1,
          dst: 1
        },
        {
          src: 1,
          weight: 1,
          dst: 2
        }
      ]);

      component.onMouseupDocument();
      tick(10);

      expect(component.tryAddEdge).toHaveBeenCalledWith(0, 1);
      expect(component.graph.edges).toEqual([
        {
          src: 0,
          weight: 1,
          dst: 1
        },
        {
          src: 1,
          weight: 1,
          dst: 2
        }
      ]);
    }));

  it('should not add edge if the start and end are same',
    fakeAsync(() => {
      component.state.currentMode = component._MODES.ADD_EDGE;
      component.state.hoveredVertex = 0;
      component.state.addEdgeVertex = 0;
      spyOn(component, 'tryAddEdge').and.callThrough();

      expect(component.isMobile).toBe(false);
      expect(component.graph.edges).toEqual([
        {
          src: 0,
          weight: 1,
          dst: 1
        },
        {
          src: 1,
          weight: 1,
          dst: 2
        }
      ]);

      component.onMouseupDocument();
      tick(10);

      expect(component.tryAddEdge).toHaveBeenCalledWith(0, 0);
      expect(component.graph.edges).toEqual([
        {
          src: 0,
          weight: 1,
          dst: 1
        },
        {
          src: 1,
          weight: 1,
          dst: 2
        }
      ]);
    }));

  it('should not add edge if an edge is already present between' +
  'the destination and source for a non directed graph', fakeAsync(() => {
    component.state.currentMode = component._MODES.ADD_EDGE;
    component.state.hoveredVertex = 0;
    component.state.addEdgeVertex = 1;
    spyOn(component, 'tryAddEdge').and.callThrough();
    spyOn(component, 'endAddEdge').and.callThrough();

    expect(component.isMobile).toBe(false);
    expect(component.graph.edges).toEqual([
      {
        src: 0,
        weight: 1,
        dst: 1
      },
      {
        src: 1,
        weight: 1,
        dst: 2
      }
    ]);

    component.onMouseupDocument();
    tick(10);

    expect(component.tryAddEdge).toHaveBeenCalledWith(1, 0);
    expect(component.graph.edges).toEqual([
      {
        src: 0,
        weight: 1,
        dst: 1
      },
      {
        src: 1,
        weight: 1,
        dst: 2
      }
    ]);
    expect(component.endAddEdge).toHaveBeenCalled();
  }));

  it('should end add edge when user clicks anything other than a' +
  ' vertex', fakeAsync(() => {
    component.state.currentMode = component._MODES.ADD_EDGE;
    component.state.addEdgeVertex = 0;
    spyOn(component, 'endAddEdge').and.callThrough();

    component.onMouseupDocument();
    tick(10);

    expect(component.state.hoveredVertex).toBeNull();
    expect(component.endAddEdge).toHaveBeenCalled();
    expect(component.state.addEdgeVertex).toBeNull();
  }));

  it('should end moving vertex when user releases mouse button',
    fakeAsync(() => {
      component.state.currentMode = component._MODES.MOVE;
      component.state.currentlyDraggedVertex = 0;
      spyOn(component, 'endDragVertex').and.callThrough();

      component.onMouseupDocument();
      tick(10);

      expect(component.endDragVertex).toHaveBeenCalled();
      expect(component.state.currentlyDraggedVertex).toBeNull();
    }));

  it('should return selected vertex label when called', () => {
    component.state.selectedVertex = 0;
    component.graph.vertices[0].label = 'vertex_label';
    spyOnProperty(component, 'selectedVertexLabel', 'get').and.callThrough();

    expect(component.selectedVertexLabel).toBe('vertex_label');
  });

  it('should return empty string when no vertex is selected', () => {
    component.state.selectedVertex = null;
    component.graph.vertices[0].label = 'vertex_label';
    spyOnProperty(component, 'selectedVertexLabel', 'get').and.callThrough();

    expect(component.selectedVertexLabel).toBe('');
  });

  it('should set selected vertex label when called', () => {
    component.state.selectedVertex = 0;
    component.graph.vertices[0].label = 'vertex_label';
    spyOnProperty(component, 'selectedVertexLabel', 'set').and
      .callThrough();

    component.selectedVertexLabel = 'test';

    expect(component.graph.vertices[0].label).toBe('test');
  });

  it('should set selected edge weight when called', () => {
    component.selectedEdgeWeightValue = 0;
    spyOnProperty(component, 'selectedEdgeWeight', 'set').and
      .callThrough();

    component.selectedEdgeWeight = 2;

    expect(component.selectedEdgeWeightValue).toBe(2);
  });

  it('should set selected edge weight to an empty string when' +
  ' null is passed', () => {
    component.selectedEdgeWeightValue = 0;
    spyOnProperty(component, 'selectedEdgeWeight', 'set').and
      .callThrough();

    component.selectedEdgeWeight = null;

    expect(component.selectedEdgeWeightValue).toBe('');
  });

  it('should return selected edge weight when called', () => {
    component.state.selectedEdge = 0;
    component.selectedEdgeWeightValue = 1;
    spyOnProperty(component, 'selectedEdgeWeight', 'get').and.callThrough();

    expect(component.selectedEdgeWeight).toBe(1);
  });

  it('should return empty string when no edge is selected', () => {
    component.state.selectedEdge = null;
    spyOnProperty(component, 'selectedEdgeWeight', 'get').and.callThrough();

    expect(component.selectedEdgeWeight).toBe('');
  });

  it('should return true when weight value is valid', () => {
    component.selectedEdgeWeightValue = 1;
    spyOn(component, 'isValidEdgeWeight').and.callThrough();

    expect(component.isValidEdgeWeight()).toBe(true);
  });

  it('should return false when weight value is invalid', () => {
    component.selectedEdgeWeightValue = 'invalid_value';
    spyOn(component, 'isValidEdgeWeight').and.callThrough();

    expect(component.isValidEdgeWeight()).toBe(false);
  });

  it('should update edge weight when function is called', () => {
    component.selectedEdgeWeightValue = 2;
    component.state.selectedEdge = 0;

    expect(component.graph.edges[0].weight).toBe(1);

    component.onUpdateEdgeWeight();

    expect(component.graph.edges[0].weight).toBe(2);
    expect(component.state.selectedEdge).toBeNull();
  });

  it('should edit edge weight when user clicks the edge weight', () => {
    spyOn(focusManagerService, 'setFocus');
    spyOn(component, 'beginEditEdgeWeight').and.callThrough();

    expect(component.canDeleteEdge).toBe(true);
    expect(component.state.selectedEdge).toBeNull();
    expect(component.selectedEdgeWeightValue).toBeUndefined();
    expect(component.shouldShowWrongWeightWarning).toBeUndefined();

    component.onClickEdgeWeight(0);

    expect(component.graph.isWeighted).toBe(true);
    expect(component.canEditEdgeWeight).toBe(true);
    expect(component.beginEditEdgeWeight).toHaveBeenCalledWith(0);
    expect(component.state.selectedEdge).toBe(0);
    expect(component.selectedEdgeWeightValue).toBe(1);
    expect(component.shouldShowWrongWeightWarning).toBe(false);
    expect(focusManagerService.setFocus)
      .toHaveBeenCalledWith('edgeWeightEditBegun');
  });
});
