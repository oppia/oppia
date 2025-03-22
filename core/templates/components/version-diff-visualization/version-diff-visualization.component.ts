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
 * @fileoverview Component for the visualization of the diff between two
 *   versions of an exploration.
 */

import {Component, Input, OnInit} from '@angular/core';
import {NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {State} from 'domain/state/StateObjectFactory';
import {StateDiffModalComponent} from 'pages/exploration-editor-page/modal-templates/state-diff-modal.component';
import {StateLink} from 'pages/exploration-editor-page/services/exploration-diff.service';

interface NodesData {
  [key: string]: {
    newestStateName: string;
    stateProperty: string;
    originalStateName: string;
  };
}

interface LegendGraph {
  nodes: Record<string, string>;
  links: {
    source: string;
    target: string;
    linkProperty: string;
  }[];
  finalStateIds: string[];
  initStateId: string;
}

export interface DiffNodeData {
  nodes: NodesData;
  v2States: Record<string, State>;
  v1States: Record<string, State>;
  finalStateIds: string[];
  v2InitStateId: number;
  links: StateLink[];
  v1InitStateId: number;
}

interface DIFF_GRAPH_LINK_PROPERTY_MAPPING {
  added: string;
  deleted: string;
}

interface LEGEND_GRAPH_COLORS {
  Added: string;
  Deleted: string;
  Changed: string;
  'Changed/renamed': string;
  Renamed: string;
  Unchanged: string;
}

interface LEGEND_GRAPH_LINK_PROPERTY_MAPPING {
  hidden: string;
}

interface LEGEND_GRAPH_SECONDARY_LABELS {
  'Changed/renamed': string;
  Renamed: string;
}

interface DiffGraphSecondaryLabels {
  [nodeId: string]: string;
}

interface DiffGraphNodeColors {
  [nodeId: string]: string;
}

interface DiffGraphData {
  nodes: object;
  links: StateLink[];
  initStateId: number;
  finalStateIds: string[];
}

@Component({
  selector: 'oppia-version-diff-visualization',
  templateUrl: './version-diff-visualization.component.html',
})
export class VersionDiffVisualizationComponent implements OnInit {
  // An object with the following properties:
  // - nodes: an object whose keys are state IDs and whoe value is an
  //     object with the following keys:
  //     - 'newestStateName': the latest name of the state
  //     - 'originalStateName': the first encountered name for the state
  //     - 'stateProperty': 'changed', 'unchanged', 'added' or 'deleted'
  // - links: a list of objects representing links in the diff graph. Each
  //     object represents one link, and has keys:
  //     - 'source': source state of link
  //     - 'target': target state of link
  //     - 'linkProperty': 'added', 'deleted' or 'unchanged'
  // - v1InitStateId: the id of the initial state in the earlier version
  // - v2InitStateId: the id of the initial state in the later version
  // - finalStateIds: whether a state is terminal in either the earlier or
  //     later version
  // - v1States: the states dict for the earlier version of the
  // exploration
  // - v2States: the states dict for the later version of the exploration.
  // This property is initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() diffData!: DiffNodeData;

  // The header for the pane of the state comparison modal corresponding
  // to the earlier version of the exploration.
  // This property is initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() earlierVersionHeader!: string;

  // The header for the pane of the state comparison modal corresponding
  // to the later version of the exploration.
  // This property is initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() laterVersionHeader!: string;

  // Constants for color of nodes in diff graph.
  COLOR_ADDED: string = '#4EA24E';
  COLOR_DELETED: string = '#DC143C';
  COLOR_CHANGED: string = '#1E90FF';
  COLOR_UNCHANGED: string = 'beige';
  COLOR_RENAMED_UNCHANGED: string = '#FFD700';

  // Constants for names in legend.
  NODE_TYPE_ADDED: string = 'Added';
  NODE_TYPE_DELETED: string = 'Deleted';
  NODE_TYPE_CHANGED: string = 'Changed';
  NODE_TYPE_CHANGED_RENAMED: string = 'Changed/renamed';
  NODE_TYPE_RENAMED: string = 'Renamed';
  NODE_TYPE_UNCHANGED: string = 'Unchanged';

  STATE_PROPERTY_ADDED: string = 'added';
  STATE_PROPERTY_DELETED: string = 'deleted';
  STATE_PROPERTY_CHANGED: string = 'changed';
  STATE_PROPERTY_UNCHANGED: string = 'unchanged';

  // Object whose keys are legend node names and whose values are
  // 'true' or false depending on whether the state property is used in
  // the diff graph. (Will be used to generate legend).
  _stateTypeUsed: Record<string, boolean> = {};
  diffGraphNodes: Record<string, string> = {};
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  nodesData!: NodesData;
  diffGraphData!: DiffGraphData;
  diffGraphNodeColors!: DiffGraphNodeColors;
  v1InitStateId!: number;
  diffGraphSecondaryLabels!: DiffGraphSecondaryLabels;
  DIFF_GRAPH_LINK_PROPERTY_MAPPING!: DIFF_GRAPH_LINK_PROPERTY_MAPPING;
  legendGraph!: LegendGraph;
  LEGEND_GRAPH_COLORS!: LEGEND_GRAPH_COLORS | Record<string, string>;
  LEGEND_GRAPH_SECONDARY_LABELS!:
    | LEGEND_GRAPH_SECONDARY_LABELS
    | Record<string, string>;

  LEGEND_GRAPH_LINK_PROPERTY_MAPPING!: LEGEND_GRAPH_LINK_PROPERTY_MAPPING;

  constructor(private ngbModal: NgbModal) {}

  // Opens the modal showing the history diff for a given state.
  // stateId is the unique ID assigned to a state during the
  // calculation of the state graph.
  onClickStateInDiffGraph(stateId: string): void {
    let oldStateName = null;
    if (
      this.nodesData[stateId].newestStateName !==
      this.nodesData[stateId].originalStateName
    ) {
      oldStateName = this.nodesData[stateId].originalStateName;
    }
    this.showStateDiffModal(
      this.nodesData[stateId].newestStateName,
      oldStateName,
      this.nodesData[stateId].stateProperty
    );
  }

  // Shows a modal comparing changes on a state between 2 versions.
  //
  // Arguments:
  // - stateName is the name of the state in the newer version.
  // - oldStateName is null if the name of the state is unchanged
  //     between the 2 versions, or the name of the state in the older
  //     version if the state name is changed.
  // - stateProperty is whether the state is added, changed, unchanged or
  //   deleted.
  showStateDiffModal(
    newStateName: string,
    oldStateName: string | null,
    stateProperty: string
  ): void {
    let modalRef: NgbModalRef = this.ngbModal.open(StateDiffModalComponent, {
      backdrop: true,
      windowClass: 'state-diff-modal',
      size: 'xl',
    });

    modalRef.componentInstance.newStateName = newStateName;
    modalRef.componentInstance.oldStateName = oldStateName;

    let newState = null;
    if (
      stateProperty !== this.STATE_PROPERTY_DELETED &&
      this.diffData.v2States.hasOwnProperty(newStateName)
    ) {
      newState = this.diffData.v2States[newStateName];
    }

    let oldState = null;
    let stateNameToRetrieve = oldStateName || newStateName;
    if (
      stateProperty !== this.STATE_PROPERTY_ADDED &&
      this.diffData.v1States.hasOwnProperty(stateNameToRetrieve)
    ) {
      oldState = this.diffData.v1States[stateNameToRetrieve];
    }

    modalRef.componentInstance.newState = newState;
    modalRef.componentInstance.oldState = oldState;
    modalRef.componentInstance.headers = {
      leftPane: this.earlierVersionHeader,
      rightPane: this.laterVersionHeader,
    };

    modalRef.result.then(
      () => {},
      () => {}
    );
  }

  ngOnInit(): void {
    this.nodesData = this.diffData.nodes;
    this._stateTypeUsed[this.NODE_TYPE_ADDED] = false;
    this._stateTypeUsed[this.NODE_TYPE_DELETED] = false;
    this._stateTypeUsed[this.NODE_TYPE_CHANGED] = false;
    this._stateTypeUsed[this.NODE_TYPE_UNCHANGED] = false;
    this._stateTypeUsed[this.NODE_TYPE_RENAMED] = false;
    this._stateTypeUsed[this.NODE_TYPE_CHANGED_RENAMED] = false;
    this.LEGEND_GRAPH_COLORS = {};
    this.LEGEND_GRAPH_COLORS[this.NODE_TYPE_ADDED] = this.COLOR_ADDED;
    this.LEGEND_GRAPH_COLORS[this.NODE_TYPE_DELETED] = this.COLOR_DELETED;
    this.LEGEND_GRAPH_COLORS[this.NODE_TYPE_CHANGED] = this.COLOR_CHANGED;
    this.LEGEND_GRAPH_COLORS[this.NODE_TYPE_UNCHANGED] = this.COLOR_UNCHANGED;
    this.LEGEND_GRAPH_COLORS[this.NODE_TYPE_RENAMED] =
      this.COLOR_RENAMED_UNCHANGED;
    this.LEGEND_GRAPH_COLORS[this.NODE_TYPE_CHANGED_RENAMED] =
      this.COLOR_CHANGED;

    this.LEGEND_GRAPH_SECONDARY_LABELS = {};
    this.LEGEND_GRAPH_SECONDARY_LABELS[this.NODE_TYPE_CHANGED_RENAMED] =
      '(was: Old name)';
    this.LEGEND_GRAPH_SECONDARY_LABELS[this.NODE_TYPE_RENAMED] =
      '(was: Old name)';
    this.LEGEND_GRAPH_LINK_PROPERTY_MAPPING = {
      hidden: 'stroke: none; marker-end: none;',
    };
    this.DIFF_GRAPH_LINK_PROPERTY_MAPPING = {
      added:
        'stroke: #1F7D1F; stroke-opacity: 0.8; ' +
        'marker-end: url(#arrowhead-green)',
      deleted:
        'stroke: #B22222; stroke-opacity: 0.8; ' +
        'marker-end: url(#arrowhead-red)',
    };
    this.diffGraphSecondaryLabels = {};
    this.diffGraphNodeColors = {};

    for (let nodeId in this.nodesData) {
      let nodeStateProperty = this.nodesData[nodeId].stateProperty;
      if (nodeStateProperty === this.STATE_PROPERTY_ADDED) {
        this.diffGraphNodes[nodeId] = this.nodesData[nodeId].newestStateName;
        this.diffGraphNodeColors[nodeId] = this.COLOR_ADDED;
        this._stateTypeUsed[this.NODE_TYPE_ADDED] = true;
      } else if (nodeStateProperty === this.STATE_PROPERTY_DELETED) {
        this.diffGraphNodes[nodeId] = this.nodesData[nodeId].originalStateName;
        this.diffGraphNodeColors[nodeId] = this.COLOR_DELETED;
        this._stateTypeUsed[this.NODE_TYPE_DELETED] = true;
      } else if (nodeStateProperty === this.STATE_PROPERTY_CHANGED) {
        this.diffGraphNodes[nodeId] = this.nodesData[nodeId].originalStateName;
        this.diffGraphNodeColors[nodeId] = this.COLOR_CHANGED;
        if (
          this.nodesData[nodeId].originalStateName !==
          this.nodesData[nodeId].newestStateName
        ) {
          this.diffGraphSecondaryLabels[nodeId] =
            '(was: ' + this.nodesData[nodeId].originalStateName + ')';
          this.diffGraphNodes[nodeId] = this.nodesData[nodeId].newestStateName;
          this._stateTypeUsed[this.NODE_TYPE_CHANGED_RENAMED] = true;
        } else {
          this._stateTypeUsed[this.NODE_TYPE_CHANGED] = true;
        }
      } else if (nodeStateProperty === this.STATE_PROPERTY_UNCHANGED) {
        this.diffGraphNodes[nodeId] = this.nodesData[nodeId].originalStateName;
        this.diffGraphNodeColors[nodeId] = this.COLOR_UNCHANGED;
        if (
          this.nodesData[nodeId].originalStateName !==
          this.nodesData[nodeId].newestStateName
        ) {
          this.diffGraphSecondaryLabels[nodeId] =
            '(was: ' + this.nodesData[nodeId].originalStateName + ')';
          this.diffGraphNodes[nodeId] = this.nodesData[nodeId].newestStateName;
          this.diffGraphNodeColors[nodeId] = this.COLOR_RENAMED_UNCHANGED;
          this._stateTypeUsed[this.NODE_TYPE_RENAMED] = true;
        } else {
          this._stateTypeUsed[this.NODE_TYPE_UNCHANGED] = true;
        }
      } else {
        throw new Error('Invalid state property.');
      }
    }

    this.v1InitStateId = this.diffData.v1InitStateId;

    this.diffGraphData = {
      nodes: this.diffGraphNodes,
      links: this.diffData.links,
      initStateId: this.diffData.v2InitStateId,
      finalStateIds: this.diffData.finalStateIds,
    };

    // Generate the legend graph.
    this.legendGraph = {
      nodes: {},
      links: [],
      finalStateIds: [],
      initStateId: '',
    };

    // Last used state type is null by default.
    let _lastUsedStateType: string | null = null;
    for (let stateProperty in this._stateTypeUsed) {
      if (this._stateTypeUsed[stateProperty]) {
        this.legendGraph.nodes[stateProperty] = stateProperty;
        if (_lastUsedStateType) {
          this.legendGraph.links.push({
            source: _lastUsedStateType,
            target: stateProperty,
            linkProperty: 'hidden',
          });
        }
        _lastUsedStateType = stateProperty;
        this.legendGraph.initStateId = stateProperty;
      }
    }
    if (_lastUsedStateType) {
      this.legendGraph.finalStateIds = [_lastUsedStateType];
    }
  }
}
