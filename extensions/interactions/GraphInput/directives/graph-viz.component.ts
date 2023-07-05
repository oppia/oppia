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
 * @fileoverview Directive for the graph-viz.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output
} from '@angular/core';
import { isNumber } from 'angular';
import { GraphAnswer } from 'interactions/answer-defs';
import { InteractionsExtensionsConstants } from 'interactions/interactions-extension.constants';
import { PlayerPositionService } from 'pages/exploration-player-page/services/player-position.service';
import { Subscription } from 'rxjs';
import { DeviceInfoService } from 'services/contextual/device-info.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { UtilsService } from 'services/utils.service';
import { EdgeCentre, GraphDetailService } from './graph-detail.service';
import { downgradeComponent } from '@angular/upgrade/static';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';

const debounce = (delay: number = 5): MethodDecorator => {
  return function(
      target: string, propertyKey: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value;
    const key = `__timeout__${propertyKey}`;

    descriptor.value = function(...args) {
      clearTimeout(this[key]);
      this[key] = setTimeout(() => original.apply(this, args), delay);
    };
    return descriptor;
  };
};

interface GraphButton {
  text: string;
  description: string;
  mode: number;
}

interface GraphOption {
  text: string;
  option: string;
}

@Component({
  selector: 'graph-viz',
  templateUrl: './graph-viz.component.html',
  styleUrls: []
})
export class GraphVizComponent implements OnInit, AfterViewInit {
  @Input() graph: GraphAnswer;
  @Input() canAddVertex: boolean;
  @Input() canDeleteVertex: boolean;
  @Input() canMoveVertex: boolean;
  @Input() canEditVertexLabel: boolean;
  @Input() canAddEdge: boolean;
  @Input() canDeleteEdge: boolean;
  @Input() canEditEdgeWeight: boolean;
  @Input() interactionIsActive: boolean;
  @Input() canEditOptions: boolean;

  @Output() graphChange: EventEmitter<GraphAnswer> = new EventEmitter();
  isMobile: boolean = false;
  helpText: string = '';
  _MODES = {
    MOVE: 0,
    ADD_EDGE: 1,
    ADD_VERTEX: 2,
    DELETE: 3
  };

  // Styling functions.
  DELETE_COLOR = 'red';
  HOVER_COLOR = 'aqua';
  SELECT_COLOR = 'orange';
  DEFAULT_COLOR = 'black';
  state = {
    currentMode: this._MODES.MOVE,
    // Vertex, edge, mode button, label currently being hovered over.
    hoveredVertex: null,
    hoveredEdge: null,
    hoveredModeButton: null,
    // If in ADD_EDGE mode, source vertex of the new edge, if it
    // exists.
    addEdgeVertex: null,
    // Currently dragged vertex.
    currentlyDraggedVertex: null,
    // Selected vertex for editing label.
    selectedVertex: null,
    // Selected edge for editing weight.
    selectedEdge: null,
    // Mouse position in SVG coordinates.
    mouseX: 0,
    mouseY: 0,
    // Original position of dragged vertex.
    vertexDragStartX: 0,
    vertexDragStartY: 0,
    // Original position of mouse when dragging started.
    mouseDragStartX: 0,
    mouseDragStartY: 0
  };

  selectedEdgeWeightValue: number | string;
  buttons: GraphButton[] = [];
  private vizContainer: SVGSVGElement[];
  componentSubscriptions: Subscription = new Subscription();
  shouldShowWrongWeightWarning: boolean;
  VERTEX_RADIUS: number;
  EDGE_WIDTH: number;
  graphOptions: GraphOption[];
  svgViewBox: string;
  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private deviceInfoService: DeviceInfoService,
    private element: ElementRef,
    private focusManagerService: FocusManagerService,
    private graphDetailService: GraphDetailService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private playerPositionService: PlayerPositionService,
    private utilsService: UtilsService
  ) {}

  ngOnInit(): void {
    this.componentSubscriptions.add(
      this.playerPositionService.onNewCardAvailable.subscribe(
        () => this.state.currentMode = null
      )
    );
    this.VERTEX_RADIUS = this.graphDetailService.VERTEX_RADIUS;
    this.EDGE_WIDTH = this.graphDetailService.EDGE_WIDTH;
    this.selectedEdgeWeightValue = 0;
    this.shouldShowWrongWeightWarning = false;

    this.isMobile = false;
    if (this.deviceInfoService.isMobileDevice()) {
      this.isMobile = true;
    }
  }

  ngAfterViewInit(): void {
    this.vizContainer = this.element.nativeElement.querySelectorAll(
      '.oppia-graph-viz-svg');

    this.graphOptions = [{
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
    }];
    this.helpText = null;
    const svgContainer = this.element.nativeElement.querySelectorAll(
      '.oppia-graph-viz-svg')[0];
    const boundingBox = svgContainer.getBBox();
    const viewBoxHeight = Math.max(
      boundingBox.height + boundingBox.y,
      svgContainer.getAttribute('height'));
    this.svgViewBox = (
      `0 0 ${svgContainer.width.baseVal.value} ${viewBoxHeight}`
    );

    // Initial value of SVG view box.
    if (this.interactionIsActive) {
      this.init();
    }
    this.changeDetectorRef.detectChanges();
  }

  getEdgeColor(index: number): string {
    if (!this.interactionIsActive) {
      return this.DEFAULT_COLOR;
    }
    if (this.state.currentMode === this._MODES.DELETE &&
        index === this.state.hoveredEdge &&
        this.canDeleteEdge) {
      return this.DELETE_COLOR;
    } else if (index === this.state.hoveredEdge) {
      return this.HOVER_COLOR;
    } else if (this.state.selectedEdge === index) {
      return this.SELECT_COLOR;
    } else {
      return this.DEFAULT_COLOR;
    }
  }

  isLanguageRTL(): boolean {
    return this.i18nLanguageCodeService.isCurrentLanguageRTL();
  }

  getVertexColor(index: number): string {
    if (!this.interactionIsActive) {
      return this.DEFAULT_COLOR;
    }
    if (this.state.currentMode === this._MODES.DELETE &&
        index === this.state.hoveredVertex &&
        this.canDeleteVertex) {
      return this.DELETE_COLOR;
    } else if (index === this.state.currentlyDraggedVertex) {
      return this.HOVER_COLOR;
    } else if (index === this.state.hoveredVertex) {
      return this.HOVER_COLOR;
    } else if (this.state.selectedVertex === index) {
      return this.SELECT_COLOR;
    } else {
      return this.DEFAULT_COLOR;
    }
  }

  getDirectedEdgeArrowPoints(index: number): string {
    return this.graphDetailService.getDirectedEdgeArrowPoints(
      this.graph, index);
  }

  getEdgeCentre(index: number): EdgeCentre {
    return this.graphDetailService.getEdgeCentre(this.graph, index);
  }

  mousemoveGraphSVG(event: MouseEvent): void {
    if (!this.interactionIsActive) {
      return;
    }
    // Note: Transform client (X, Y) to SVG (X, Y). This has to be
    // done so that changes due to viewBox attribute are
    // propagated nicely.
    const pt = this.vizContainer[0].createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const svgp = pt.matrixTransform(
      this.vizContainer[0].getScreenCTM().inverse());
    this.state.mouseX = svgp.x;
    this.state.mouseY = svgp.y;
    // We use vertexDragStartX/Y and mouseDragStartX/Y to make
    // mouse-dragging by label more natural, by moving the vertex
    // according to the difference from the original position.
    // Otherwise, mouse-dragging by label will make the vertex
    // awkwardly jump to the mouse.
    if (this.state.currentlyDraggedVertex !== null &&
        (this.state.mouseX > (
          InteractionsExtensionsConstants.GRAPH_INPUT_LEFT_MARGIN))) {
      this.graph.vertices[this.state.currentlyDraggedVertex].x = (
        this.state.vertexDragStartX + (
          this.state.mouseX - this.state.mouseDragStartX));
      this.graph.vertices[this.state.currentlyDraggedVertex].y = (
        this.state.vertexDragStartY + (
          this.state.mouseY - this.state.mouseDragStartY));
    }
  }

  onClickGraphSVG(): void {
    if (!this.interactionIsActive) {
      return;
    }
    if (this.state.currentMode === this._MODES.ADD_VERTEX &&
        this.canAddVertex) {
      this.graph.vertices.push({
        x: this.state.mouseX,
        y: this.state.mouseY,
        label: ''
      });
      this.graphChange.emit(this.graph);
    }
    if (this.state.hoveredVertex === null) {
      this.state.selectedVertex = null;
    }
    if (this.state.hoveredEdge === null) {
      this.state.selectedEdge = null;
    }
  }

  initButtons(): void {
    this.buttons = [];
    if (this.canMoveVertex) {
      this.buttons.push({
        text: '\uF0B2',
        description: 'I18N_INTERACTIONS_GRAPH_MOVE',
        mode: this._MODES.MOVE
      });
    }
    if (this.canAddEdge) {
      this.buttons.push({
        text: '\uF0C1',
        description: 'I18N_INTERACTIONS_GRAPH_ADD_EDGE',
        mode: this._MODES.ADD_EDGE
      });
    }
    if (this.canAddVertex) {
      this.buttons.push({
        text: '\uF067',
        description: 'I18N_INTERACTIONS_GRAPH_ADD_NODE',
        mode: this._MODES.ADD_VERTEX
      });
    }
    if (this.canDeleteVertex || this.canDeleteEdge) {
      this.buttons.push({
        text: '\uF068',
        description: 'I18N_INTERACTIONS_GRAPH_DELETE',
        mode: this._MODES.DELETE
      });
    }
  }

  init(): void {
    this.initButtons();
    this.state.currentMode = this.buttons[0].mode;
    if (this.isMobile) {
      if (this.state.currentMode === this._MODES.ADD_EDGE) {
        this.helpText =
          'I18N_INTERACTIONS_GRAPH_EDGE_INITIAL_HELPTEXT';
      } else if (this.state.currentMode === this._MODES.MOVE) {
        this.helpText =
          'I18N_INTERACTIONS_GRAPH_MOVE_INITIAL_HELPTEXT';
      } else {
        this.helpText = '';
      }
    } else {
      this.helpText = '';
    }
  }

  toggleGraphOption(option: string): void {
    // Handle the case when we have two edges s -> d and d -> s.
    if (option === 'isDirected' && this.graph[option]) {
      this._deleteRepeatedUndirectedEdges();
    }
    this.graph[option] = !this.graph[option];
    this.graphChange.emit(this.graph);
  }

  setMode(mode: number): void {
    this.state.currentMode = mode;
    if (this.isMobile) {
      if (this.state.currentMode === this._MODES.ADD_EDGE) {
        this.helpText =
          'I18N_INTERACTIONS_GRAPH_EDGE_INITIAL_HELPTEXT';
      } else if (this.state.currentMode === this._MODES.MOVE) {
        this.helpText =
          'I18N_INTERACTIONS_GRAPH_MOVE_INITIAL_HELPTEXT';
      } else {
        this.helpText = null;
      }
    } else {
      this.helpText = null;
    }
    this.state.addEdgeVertex = null;
    this.state.selectedVertex = null;
    this.state.selectedEdge = null;
    this.state.currentlyDraggedVertex = null;
    this.state.hoveredVertex = null;
  }

  onClickModeButton(mode: number, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.interactionIsActive) {
      this.setMode(mode);
    }
  }

  // TODO(#12104): Consider if there's a neat way to write a reset()
  // function to clear bits of this.state
  // (e.g. currentlyDraggedVertex, addEdgeVertex).

  // ---- Vertex events ----
  onClickVertex(index: number): void {
    if (this.state.currentMode === this._MODES.DELETE) {
      if (this.canDeleteVertex) {
        this.deleteVertex(index);
      }
    }
    if (this.state.currentMode !== this._MODES.DELETE &&
        this.graph.isLabeled &&
        this.canEditVertexLabel) {
      this.beginEditVertexLabel(index);
    }
    if (this.isMobile) {
      this.state.hoveredVertex = index;
      if (this.state.addEdgeVertex === null &&
          this.state.currentlyDraggedVertex === null) {
        this.onTouchInitialVertex(index);
      } else {
        if (this.state.addEdgeVertex === index) {
          this.state.hoveredVertex = null;
          this.helpText =
            'I18N_INTERACTIONS_GRAPH_EDGE_INITIAL_HELPTEXT';
          this.state.addEdgeVertex = null;
          return;
        }
        this.onTouchFinalVertex(index);
      }
    }
  }

  onTouchInitialVertex(index: number): void {
    if (this.state.currentMode === this._MODES.ADD_EDGE) {
      if (this.canAddEdge) {
        this.beginAddEdge(index);
        this.helpText = 'I18N_INTERACTIONS_GRAPH_EDGE_FINAL_HELPTEXT';
      }
    } else if (this.state.currentMode === this._MODES.MOVE) {
      if (this.canMoveVertex) {
        this.beginDragVertex(index);
        this.helpText = 'I18N_INTERACTIONS_GRAPH_MOVE_FINAL_HELPTEXT';
      }
    }
  }

  onTouchFinalVertex(index: number): void {
    if (this.state.currentMode === this._MODES.ADD_EDGE) {
      this.tryAddEdge(
        this.state.addEdgeVertex, index);
      this.endAddEdge();
      this.state.hoveredVertex = null;
      this.helpText = 'I18N_INTERACTIONS_GRAPH_EDGE_INITIAL_HELPTEXT';
    } else if (this.state.currentMode === this._MODES.MOVE) {
      if (this.state.currentlyDraggedVertex !== null) {
        this.endDragVertex();
        this.state.hoveredVertex = null;
        this.helpText =
          'I18N_INTERACTIONS_GRAPH_MOVE_INITIAL_HELPTEXT';
      }
    }
  }

  onMousedownVertex(index: number): void {
    if (this.isMobile) {
      return;
    }
    if (this.state.currentMode === this._MODES.ADD_EDGE) {
      if (this.canAddEdge) {
        this.beginAddEdge(index);
      }
    } else if (this.state.currentMode === this._MODES.MOVE) {
      if (this.canMoveVertex) {
        this.beginDragVertex(index);
      }
    }
  }

  onMouseleaveVertex(index: number): void {
    if (this.isMobile) {
      return;
    }
    this.state.hoveredVertex = (
      index === this.state.hoveredVertex) ?
      null : this.state.hoveredVertex;
  }

  onClickVertexLabel(index: number): void {
    if (this.graph.isLabeled && this.canEditVertexLabel) {
      this.beginEditVertexLabel(index);
    }
  }

  // ---- Edge events ----
  onClickEdge(index: number): void {
    if (this.state.currentMode === this._MODES.DELETE) {
      if (this.canDeleteEdge) {
        this.deleteEdge(index);
      }
    }
    if (this.state.currentMode !== this._MODES.DELETE &&
        this.graph.isWeighted &&
        this.canEditEdgeWeight) {
      this.beginEditEdgeWeight(index);
    }
  }

  onClickEdgeWeight(index: number): void {
    if (this.graph.isWeighted && this.canEditEdgeWeight) {
      this.beginEditEdgeWeight(index);
    }
  }

  // ---- Document event ----
  @HostListener('document:mouseup', ['$event'])
  @debounce()
  onMouseupDocument(): void {
    if (this.isMobile) {
      return;
    }
    if (this.state.currentMode === this._MODES.ADD_EDGE) {
      if (this.state.hoveredVertex !== null) {
        this.tryAddEdge(
          this.state.addEdgeVertex, this.state.hoveredVertex);
      }
      this.endAddEdge();
    } else if (this.state.currentMode === this._MODES.MOVE) {
      if (this.state.currentlyDraggedVertex !== null) {
        this.endDragVertex();
      }
    }
  }

  // ---- Actions ----
  beginAddEdge(startIndex: number): void {
    this.state.addEdgeVertex = startIndex;
  }

  endAddEdge(): void {
    this.state.addEdgeVertex = null;
  }

  tryAddEdge(startIndex: number, endIndex: number): void {
    if (
      startIndex === null ||
      endIndex === null ||
      startIndex === endIndex ||
      startIndex < 0 ||
      endIndex < 0 ||
      startIndex >= this.graph.vertices.length ||
      endIndex >= this.graph.vertices.length) {
      return;
    }
    for (let i = 0; i < this.graph.edges.length; i++) {
      if (startIndex === this.graph.edges[i].src &&
          endIndex === this.graph.edges[i].dst) {
        return;
      }
      if (!this.graph.isDirected) {
        if (startIndex === this.graph.edges[i].dst &&
            endIndex === this.graph.edges[i].src) {
          return;
        }
      }
    }
    this.graph.edges.push({
      src: startIndex,
      dst: endIndex,
      weight: 1
    });
    this.graphChange.emit(this.graph);
    return;
  }

  beginDragVertex(index: number): void {
    this.state.currentlyDraggedVertex = index;
    this.state.vertexDragStartX = this.graph.vertices[index].x;
    this.state.vertexDragStartY = this.graph.vertices[index].y;
    this.state.mouseDragStartX = this.state.mouseX;
    this.state.mouseDragStartY = this.state.mouseY;
  }

  endDragVertex(): void {
    this.state.currentlyDraggedVertex = null;
    this.state.vertexDragStartX = 0;
    this.state.vertexDragStartY = 0;
    this.state.mouseDragStartX = 0;
    this.state.mouseDragStartY = 0;
  }

  beginEditVertexLabel(index: number): void {
    this.state.selectedVertex = index;
    this.focusManagerService.setFocus('vertexLabelEditBegun');
  }

  beginEditEdgeWeight(index: number): void {
    this.state.selectedEdge = index;
    this.selectedEdgeWeightValue = (
      this.graph.edges[this.state.selectedEdge].weight);
    this.shouldShowWrongWeightWarning = false;
    this.focusManagerService.setFocus('edgeWeightEditBegun');
  }

  deleteEdge(index: number): void {
    this.graph.edges.splice(index, 1);
    this.graphChange.emit(this.graph);
    this.state.hoveredEdge = null;
  }

  private _deleteRepeatedUndirectedEdges(): void {
    for (let i = 0; i < this.graph.edges.length; i++) {
      const edge1 = this.graph.edges[i];
      for (let j = i + 1; j < this.graph.edges.length; j++) {
        const edge2 = this.graph.edges[j];
        if ((edge1.src === edge2.src && edge1.dst === edge2.dst) ||
            (edge1.src === edge2.dst && edge1.dst === edge2.src)) {
          this.deleteEdge(j);
          j--;
        }
      }
    }
  }

  deleteVertex(index: number): void {
    this.graph.edges = this.graph.edges.map((edge) => {
      if (edge.src === index || edge.dst === index) {
        return null;
      }
      if (edge.src > index) {
        edge.src--;
      }
      if (edge.dst > index) {
        edge.dst--;
      }
      return edge;
    });
    this.graph.edges = this.graph.edges.filter(edge => edge !== null);
    this.graph.vertices.splice(index, 1);
    this.graphChange.emit(this.graph);
    this.state.hoveredVertex = null;
  }

  get selectedVertexLabel(): string {
    if (this.state.selectedVertex === null) {
      return '';
    }
    return this.graph.vertices[this.state.selectedVertex].label;
  }

  set selectedVertexLabel(label: string) {
    if (this.utilsService.isDefined(label)) {
      this.graph.vertices[this.state.selectedVertex].label = label;
    }
  }

  get selectedEdgeWeight(): string | number {
    if (this.state.selectedEdge === null) {
      return '';
    }
    return this.selectedEdgeWeightValue;
  }

  set selectedEdgeWeight(weight: number | string | null) {
    if (weight === null) {
      this.selectedEdgeWeightValue = '';
    }
    if (isNumber(weight)) {
      this.selectedEdgeWeightValue = weight;
    }
  }

  isValidEdgeWeight(): boolean {
    return (typeof this.selectedEdgeWeightValue === 'number');
  }

  onUpdateEdgeWeight(): void {
    if (isNumber(this.selectedEdgeWeightValue)) {
      this.graph.edges[this.state.selectedEdge].weight = (
        this.selectedEdgeWeightValue);
      this.graphChange.emit(this.graph);
    }
    this.state.selectedEdge = null;
  }
}
angular.module('oppia').directive('graphViz', downgradeComponent({
  component: GraphVizComponent
}));
