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
 * @fileoverview Component for the state graph visualization.
 */

import * as d3 from 'd3';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {AppConstants} from 'app.constants';
import cloneDeep from 'lodash/cloneDeep';
import {Subscription} from 'rxjs';
import {TruncatePipe} from 'filters/string-utility-filters/truncate.pipe';
import {
  AugmentedLink,
  NodeDataDict,
} from 'components/graph-services/graph-layout.service';
import {ExplorationStatesService} from 'pages/exploration-editor-page/services/exploration-states.service';
import {ExplorationWarningsService} from 'pages/exploration-editor-page/services/exploration-warnings.service';
import {GraphDataService} from 'pages/exploration-editor-page/services/graph-data.service';
import {GraphNodes, GraphLink, GraphData} from 'services/compute-graph.service';
import {RouterService} from 'pages/exploration-editor-page/services/router.service';
import {StateCardIsCheckpointService} from 'components/state-editor/state-editor-properties-services/state-card-is-checkpoint.service';
import {StateGraphLayoutService} from 'components/graph-services/graph-layout.service';
import {TranslationStatusService} from 'pages/exploration-editor-page/translation-tab/services/translation-status.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';

interface ElementDimensions {
  h: number;
  w: number;
}

export interface NodeTitle {
  secondaryLabel: string;
  label: string;
  reachableFromEnd: boolean;
  reachable: boolean;
}

interface NodeData {
  depth: number;
  offset: number;
  reachable: boolean;
  y0: number;
  x0: number;
  yLabel: number;
  xLabel: number;
  height: number;
  width: number;
  id: string;
  label: string;
  reachableFromEnd: boolean;
  style: string;
  secondaryLabel: string;
  nodeClass: string;
  canDelete: boolean;
}
interface NodeColors {
  [nodeId: string]: string;
}

interface NodeSecondaryLabels {
  [key: string]: string;
}

interface OpacityMap {
  [key: string]: number;
}

@Component({
  selector: 'state-graph-visualization',
  templateUrl: './state-graph-visualization.component.html',
})
export class StateGraphVisualization implements OnInit, OnDestroy {
  // Function called when node is clicked. Should take a parameter
  // node.id.
  @Output() onClickFunction = new EventEmitter<string>();
  @Output() onDeleteFunction = new EventEmitter<string>();
  @Output() onMaximizeFunction = new EventEmitter<void>();
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @ViewChild('MainScreen') mainScreen!: ElementRef;

  @Input() allowPanning!: boolean;
  @Input() centerAtCurrentState!: boolean;
  @Input() currentStateId!: string;
  // Id of a second initial state, which will be styled as an initial
  // state.
  @Input() initStateId2!: string;
  @Input() isEditable!: string;
  // Object which maps linkProperty to a style.
  @Input() linkPropertyMapping!: {
    added: string;
    deleted: string;
  };

  @Input() versionGraphData!: GraphData;
  @Input() maximize: boolean = false;
  // Object whose keys are node ids and whose values are node colors.
  @Input() nodeColors!: NodeColors;
  // A value which is the color of all nodes.
  @Input() nodeFill!: string;
  // Object whose keys are node ids with secondary labels and whose
  // values are secondary labels. If this is undefined, it means no nodes
  // have secondary labels.
  @Input() nodeSecondaryLabels!: NodeSecondaryLabels;
  // Object whose keys are ids of nodes, and whose values are the
  // corresponding node opacities.
  @Input() opacityMap!: OpacityMap;
  @Input() showWarningSign!: boolean;
  @Input() showTranslationWarnings!: boolean;

  initStateId!: string;
  finalStateIds!: string[];
  graphLoaded!: boolean;
  GRAPH_HEIGHT!: number;
  GRAPH_WIDTH!: number;
  VIEWPORT_WIDTH!: string;
  VIEWPORT_HEIGHT!: string;
  VIEWPORT_X!: string;
  VIEWPORT_Y!: string;
  nodeData!: NodeDataDict;
  augmentedLinks!: AugmentedLink[];
  nodeList!: NodeData[];
  graphData!: GraphData;
  overallTransformStr!: string;
  innerTransformStr!: string;
  directiveSubscriptions = new Subscription();
  graphBounds = {
    bottom: 0,
    left: 0,
    top: 0,
    right: 0,
  };

  // The translation applied when the graph is first loaded.
  origTranslations: number[] = [0, 0];
  switch: boolean = false;
  check: boolean = false;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private explorationStatesService: ExplorationStatesService,
    private explorationWarningsService: ExplorationWarningsService,
    private graphDataService: GraphDataService,
    private routerService: RouterService,
    private stateCardIsCheckpointService: StateCardIsCheckpointService,
    private stateGraphLayoutService: StateGraphLayoutService,
    private translationStatusService: TranslationStatusService,
    private truncate: TruncatePipe,
    private windowDimensionsService: WindowDimensionsService
  ) {}

  sendOnMaximizeFunction(): void {
    this.onMaximizeFunction.emit();
  }

  sendOnClickFunctionData(event: string): void {
    this.onClickFunction.emit(event);
  }

  redrawGraph(): void {
    if (this.graphData) {
      this.graphLoaded = false;
      this.drawGraph(
        this.graphData.nodes,
        this.graphData.links,
        this.graphData.initStateId,
        this.graphData.finalStateIds
      );

      // Wait for the graph to finish loading before showing it again.
      setTimeout(() => {
        this.graphLoaded = true;
      });
    }
  }

  makeGraphPannable(): void {
    setTimeout(() => {
      let dimensions = this.getElementDimensions();
      d3.selectAll('#pannableRect').call(
        // This throws "Object is possibly undefined." The type undefined
        // comes here from d3-zoom dependency. We need to suppress this
        // error because of strict type checking.
        // @ts-ignore
        d3
          .zoom()
          .scaleExtent([1, 1])
          .on('zoom', () => {
            if (this.graphBounds.right + this.graphBounds.left < dimensions.w) {
              d3.event.transform.x = 0;
            } else {
              d3.event.transform.x = this.clamp(
                d3.event.transform.x,
                dimensions.w -
                  this.graphBounds.right -
                  this.origTranslations[0],
                -this.graphBounds.left - this.origTranslations[0]
              );
            }

            if (this.graphBounds.bottom + this.graphBounds.top < dimensions.h) {
              d3.event.transform.y = 0;
            } else {
              d3.event.transform.y = this.clamp(
                d3.event.transform.y,
                dimensions.h -
                  this.graphBounds.bottom -
                  this.origTranslations[1],
                -this.graphBounds.top - this.origTranslations[1]
              );
            }

            // We need a separate layer here so that the translation
            // does not influence the panning event receivers.
            this.innerTransformStr =
              'translate(' +
              d3.event.transform.x +
              ',' +
              d3.event.transform.y +
              ')';
          })
      );
    });
  }

  // Returns the closest number to `value` in the range
  // [bound1, bound2].
  clamp(value: number, bound1: number, bound2: number): number {
    let minValue = Math.min(bound1, bound2);
    let maxValue = Math.max(bound1, bound2);

    return Math.min(Math.max(value, minValue), maxValue);
  }

  isCheckpoint(nodeId: string): boolean {
    let state = this.explorationStatesService.getState(nodeId);
    return !!state && state.cardIsCheckpoint;
  }

  getGraphHeightInPixels(): string {
    return String(Math.max(this.GRAPH_HEIGHT, 300)) + 'px';
  }

  getElementDimensions(): ElementDimensions {
    let height = this.mainScreen.nativeElement.height.baseVal;
    let width = this.mainScreen.nativeElement.width.baseVal;

    height.convertToSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PX);
    width.convertToSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PX);

    return {
      h: Number(height.valueInSpecifiedUnits),
      w: Number(width.valueInSpecifiedUnits),
    };
  }

  centerGraph(): void {
    if (this.graphData && this.centerAtCurrentState) {
      if (this.allowPanning) {
        this.makeGraphPannable();
      }

      setTimeout(() => {
        let dimensions = this.getElementDimensions();

        // Center the graph at the node representing the current state.
        if (!this.nodeData[this.currentStateId]) {
          return;
        }

        this.origTranslations[0] =
          dimensions.w / 2 -
          this.nodeData[this.currentStateId].x0 -
          this.nodeData[this.currentStateId].width / 2;

        this.origTranslations[1] =
          dimensions.h / 2 -
          this.nodeData[this.currentStateId].y0 -
          this.nodeData[this.currentStateId].height / 2;

        if (this.graphBounds.right - this.graphBounds.left < dimensions.w) {
          this.origTranslations[0] =
            dimensions.w / 2 -
            (this.graphBounds.right + this.graphBounds.left) / 2;
        } else {
          this.origTranslations[0] = this.clamp(
            this.origTranslations[0],
            dimensions.w - this.graphBounds.right,
            -this.graphBounds.left
          );
        }

        if (this.graphBounds.bottom - this.graphBounds.top < dimensions.h) {
          this.origTranslations[1] =
            dimensions.h / 2 -
            (this.graphBounds.bottom + this.graphBounds.top) / 2;
        } else {
          this.origTranslations[1] = this.clamp(
            this.origTranslations[1],
            dimensions.h - this.graphBounds.bottom,
            -this.graphBounds.top
          );
        }

        this.overallTransformStr = 'translate(' + this.origTranslations + ')';
      }, 20);
    }
  }

  getNodeStrokeWidth(nodeId: string): string {
    let currentNodeIsTerminal = this.finalStateIds.indexOf(nodeId) !== -1;
    return nodeId === this.currentStateId
      ? '3'
      : nodeId === this.initStateId2 || currentNodeIsTerminal
        ? '2'
        : '1';
  }

  getNodeFillOpacity(nodeId: string): number {
    return this.opacityMap ? this.opacityMap[nodeId] : 0.5;
  }

  getCenterGraph(): void {
    this.centerGraph();
  }

  getNodeTitle(node: NodeTitle): string {
    let warning: string | null = '';
    if (node.reachable === false) {
      warning = 'Warning: this state is unreachable.';
    } else if (node.reachableFromEnd === false) {
      warning = 'Warning: there is no path from this state to the END state.';
    } else {
      warning = this.getNodeErrorMessage(node.label);
    }

    let tooltip = node.label;

    if ('secondaryLabel' in node) {
      tooltip += ' ' + node.secondaryLabel;
    }

    if (warning) {
      tooltip += ' (' + warning + ')';
    }
    return tooltip;
  }

  onNodeDeletionClick(nodeId: string): void {
    if (nodeId !== this.initStateId) {
      this.onDeleteFunction.emit(nodeId);
    }
  }

  getHighlightTransform(x0: number, y0: number): string {
    return 'rotate(-10,' + (x0 - 10) + ',' + (y0 - 5) + ')';
  }

  getHighlightTextTransform(x0: number, y0: number): string {
    return 'rotate(-10,' + x0 + ',' + (y0 - 4) + ')';
  }

  canNavigateToNode(nodeId: string): boolean {
    return nodeId !== this.currentStateId;
  }

  getTruncatedLabel(nodeLabel: string): string {
    return this.truncate.transform(
      nodeLabel,
      AppConstants.MAX_NODE_LABEL_LENGTH
    );
  }

  drawGraph(
    nodes: GraphNodes,
    originalLinks: GraphLink[],
    initStateId: string,
    finalStateIds: string[]
  ): void {
    const that = this;
    this.initStateId = initStateId;
    this.finalStateIds = finalStateIds;
    let links = cloneDeep(originalLinks);

    this.nodeData = this.stateGraphLayoutService.computeLayout(
      nodes,
      links,
      initStateId,
      cloneDeep(finalStateIds)
    );

    this.GRAPH_WIDTH = this.stateGraphLayoutService.getGraphWidth(
      AppConstants.MAX_NODES_PER_ROW,
      AppConstants.MAX_NODE_LABEL_LENGTH
    );

    this.GRAPH_HEIGHT = this.stateGraphLayoutService.getGraphHeight(
      this.nodeData
    );

    this.nodeData = this.stateGraphLayoutService.modifyPositionValues(
      this.nodeData,
      this.GRAPH_WIDTH,
      this.GRAPH_HEIGHT
    );

    // These constants correspond to the rectangle that, when clicked
    // and dragged, translates the graph. Its height, width, and x and
    // y offsets are set to arbitrary large values so that the
    // draggable area extends beyond the graph.
    this.VIEWPORT_WIDTH = Math.max(10000, this.GRAPH_WIDTH * 5) + 'px';
    this.VIEWPORT_HEIGHT = Math.max(10000, this.GRAPH_HEIGHT * 5) + 'px';
    this.VIEWPORT_X = -Math.max(1000, this.GRAPH_WIDTH * 2) + 'px';
    this.VIEWPORT_Y = -Math.max(1000, this.GRAPH_HEIGHT * 2) + 'px';

    this.graphBounds = this.stateGraphLayoutService.getGraphBoundaries(
      this.nodeData
    );

    this.augmentedLinks = this.stateGraphLayoutService.getAugmentedLinks(
      this.nodeData,
      links
    );

    for (let i = 0; i < this.augmentedLinks.length; i++) {
      // Style links if link properties and style mappings are
      // provided.
      let linkProperty = links[i].linkProperty;
      if (
        'linkProperty' in links[i] &&
        linkProperty &&
        this.linkPropertyMapping
      ) {
        if (linkProperty in this.linkPropertyMapping) {
          this.augmentedLinks[i].style =
            this.linkPropertyMapping[
              linkProperty as keyof typeof that.linkPropertyMapping
            ];
        }
      }
    }

    // Update the nodes.
    this.nodeList = [];
    for (let nodeId in this.nodeData) {
      this.nodeData[nodeId].style =
        'stroke-width: ' +
        this.getNodeStrokeWidth(nodeId) +
        '; ' +
        'fill-opacity: ' +
        this.getNodeFillOpacity(nodeId) +
        ';';

      if (this.nodeFill) {
        this.nodeData[nodeId].style += 'fill: ' + this.nodeFill + '; ';
      }

      // ---- Color nodes ----
      let nodeColors = this.nodeColors;
      if (nodeColors) {
        this.nodeData[nodeId].style += 'fill: ' + nodeColors[nodeId] + '; ';
      }

      // Add secondary label if it exists.
      if (this.nodeSecondaryLabels) {
        if (nodeId in this.nodeSecondaryLabels) {
          this.nodeData[nodeId].secondaryLabel =
            this.nodeSecondaryLabels[nodeId];
          this.nodeData[nodeId].height *= 1.1;
        }
      }

      let currentNodeIsTerminal = this.finalStateIds.indexOf(nodeId) !== -1;

      this.nodeData[nodeId].nodeClass = currentNodeIsTerminal
        ? 'terminal-node'
        : nodeId === this.currentStateId
          ? 'current-node'
          : nodeId === initStateId
            ? 'init-node'
            : !(
                  this.nodeData[nodeId].reachable &&
                  this.nodeData[nodeId].reachableFromEnd
                )
              ? 'bad-node'
              : 'normal-node';

      this.nodeData[nodeId].canDelete = nodeId !== initStateId;
      this.nodeList.push(this.nodeData[nodeId]);
    }

    if (this.allowPanning) {
      this.makeGraphPannable();
    }

    if (this.centerAtCurrentState) {
      // SetTimeout is required to ensure code runs
      // once all the current call stack has finished execution.
      setTimeout(() => {
        this.centerGraph();
      });
    }
  }

  getNodeErrorMessage(nodeLabel: string): string | null {
    let warnings = null;
    if (this.showTranslationWarnings) {
      warnings = this.translationStatusService.getAllStatesNeedUpdatewarning();
    } else {
      warnings = this.explorationWarningsService.getAllStateRelatedWarnings();
    }

    if (nodeLabel in warnings) {
      let warning = warnings[nodeLabel][0];
      return warning.toString();
    }
    return null;
  }

  ngOnInit(): void {
    this.overallTransformStr = 'translate(0,0)';
    this.innerTransformStr = 'translate(0,0)';

    this.directiveSubscriptions.add(
      this.routerService.onCenterGraph.subscribe(() => {
        // SetTimeout is required to ensure code runs
        // once all the current call stack has finished execution.
        setTimeout(() => {
          this.centerGraph();
          this.redrawGraph();
        });
      })
    );

    this.directiveSubscriptions.add(
      this.windowDimensionsService.getResizeEvent().subscribe(evt => {
        this.redrawGraph();
      })
    );

    this.directiveSubscriptions.add(
      this.graphDataService.updateGraphData.subscribe(value => {
        if (value !== null && value !== undefined && value) {
          if (
            this.versionGraphData !== null &&
            this.versionGraphData &&
            this.versionGraphData !== undefined
          ) {
            return;
          }

          this.graphData = value;
          this.redrawGraph();
          this.centerGraph();
        }
      })
    );

    if (this.graphDataService.getGraphData() !== null) {
      this.graphData = this.graphDataService.getGraphData();

      if (
        this.versionGraphData !== null &&
        this.versionGraphData !== undefined
      ) {
        this.graphData = this.versionGraphData;
      }

      this.redrawGraph();
      this.centerGraph();
      this.switch = true;
      this.changeDetectorRef.detectChanges();
    }
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
