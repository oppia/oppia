// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Topic dependency graph vizualization modal component.
 */

import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { StateGraphLayoutService, AugmentedLink, NodeDataDict } from 'components/graph-services/graph-layout.service';
import { GraphNodes, GraphLink, GraphData } from 'services/compute-graph.service';
import { AppConstants } from 'app.constants';
import { TruncatePipe } from 'filters/string-utility-filters/truncate.pipe';
import cloneDeep from 'lodash/cloneDeep';
import { TopicIdToPrerequisiteTopicIds } from '../existing-classroom.model';
import { TopicIdToTopicName } from '../existing-classroom.model';


interface NodeData {
  y0: number;
  x0: number;
  yLabel: number;
  xLabel: number;
  height: number;
  width: number;
  id: string;
  label: string;
}

@Component({
  selector: 'oppia-topics-dependency-graph',
  templateUrl: './topic-dependency-graph-viz-modal.component.html'
})
export class TopicsDependencyGraphModalComponent
  extends ConfirmOrCancelModal {
  constructor(
    private ngbActiveModal: NgbActiveModal,
    private stateGraphLayoutService: StateGraphLayoutService,
    private truncate: TruncatePipe,
  ) {
    super(ngbActiveModal);
  }

  graphBounds = {
    bottom: 0,
    left: 0,
    top: 0,
    right: 0
  };

  graphData!: GraphData;
  initStateId!: string;
  finalStateIds!: string[];
  nodeData!: NodeDataDict;
  GRAPH_WIDTH!: number;
  GRAPH_HEIGHT!: number;
  augmentedLinks: AugmentedLink[] | undefined = [];
  nodeList!: NodeData[];

  topicIdToPrerequisiteTopicIds: TopicIdToPrerequisiteTopicIds = {};
  topicIdToTopicName: TopicIdToTopicName = {};

  close(): void {
    this.ngbActiveModal.close();
  }

  ngOnInit(): void {
    this.normalizeTopicDependencyGraph();
    this.drawGraph(
      this.graphData.nodes, this.graphData.links,
      this.graphData.initStateId, this.graphData.finalStateIds
    );
  }

  drawGraph(
      nodes: GraphNodes, originalLinks: GraphLink[],
      initStateId: string, finalStateIds: string[]
  ): void {
    this.initStateId = initStateId;
    this.finalStateIds = finalStateIds;
    let links = cloneDeep(originalLinks);

    this.nodeData = this.stateGraphLayoutService.computeLayout(
      nodes, links, initStateId, cloneDeep(finalStateIds));

    this.GRAPH_WIDTH = this.stateGraphLayoutService.getGraphWidth(
      AppConstants.MAX_NODES_PER_ROW, AppConstants.MAX_NODE_LABEL_LENGTH);

    this.GRAPH_HEIGHT = this.stateGraphLayoutService.getGraphHeight(
      this.nodeData);

    this.nodeData = this.stateGraphLayoutService.modifyPositionValues(
      this.nodeData, this.GRAPH_WIDTH, this.GRAPH_HEIGHT);

    this.graphBounds = this.stateGraphLayoutService.getGraphBoundaries(
      this.nodeData);

    this.augmentedLinks = this.stateGraphLayoutService.getAugmentedLinks(
      this.nodeData, links);

    this.nodeList = [];
    for (let nodeId in this.nodeData) {
      this.nodeList.push(this.nodeData[nodeId]);
    }
  }

  getTruncatedLabel(nodeLabel: string): string {
    return this.truncate.transform(
      nodeLabel,
      AppConstants.MAX_NODE_LABEL_LENGTH);
  }

  normalizeTopicDependencyGraph(): void {
    const intialTopicIds = this.computeInitialTopicIds(
      this.topicIdToPrerequisiteTopicIds);
    const finalTopics = this.computeFinalTopicIds(
      this.topicIdToPrerequisiteTopicIds);
    const links = this.computeEdges(this.topicIdToPrerequisiteTopicIds);
    const nodes = this.topicIdToTopicName;

    this.graphData = {
      finalStateIds: finalTopics,
      initStateId: intialTopicIds[0],
      links: links,
      nodes: nodes
    };
  }

  computeInitialTopicIds(
      topicIdToPrerequisiteTopicIds: TopicIdToPrerequisiteTopicIds
  ): string[] {
    let initialTopicIds = [];
    for (let topicId in topicIdToPrerequisiteTopicIds) {
      if (topicIdToPrerequisiteTopicIds[topicId].length === 0) {
        initialTopicIds.push(topicId);
      }
    }
    if (initialTopicIds.length === 0) {
      initialTopicIds = Object.keys(this.topicIdToTopicName);
    }
    return initialTopicIds;
  }

  computeEdges(
      topicIdToPrerequisiteTopicIds: TopicIdToPrerequisiteTopicIds
  ): GraphLink[] {
    let edgeSet = [];
    for (let currentTopicId in topicIdToPrerequisiteTopicIds) {
      let prerequisiteTopics = (
        topicIdToPrerequisiteTopicIds[currentTopicId]);

      for (let topicId of prerequisiteTopics) {
        edgeSet.push(this.computeSingleEdge(
          topicId, currentTopicId));
      }
    }
    return edgeSet;
  }

  computeSingleEdge(sourceTopic: string, destTopic: string): GraphLink {
    return {
      source: sourceTopic,
      target: destTopic,
      linkProperty: null,
      connectsDestIfStuck: false
    };
  }

  computeFinalTopicIds(
      topicIdToPrerequisiteTopicIds: TopicIdToPrerequisiteTopicIds
  ): string[] {
    let prerequisitesOfAllTopics: string[] = [];
    let finalTopicIds = [];
    for (let topicId in topicIdToPrerequisiteTopicIds) {
      prerequisitesOfAllTopics = prerequisitesOfAllTopics.concat(
        topicIdToPrerequisiteTopicIds[topicId]);
    }

    for (let topicId in topicIdToPrerequisiteTopicIds) {
      let index = prerequisitesOfAllTopics.indexOf(topicId);

      if (index === -1) {
        finalTopicIds.push(topicId);
      }
    }

    return finalTopicIds;
  }
}
