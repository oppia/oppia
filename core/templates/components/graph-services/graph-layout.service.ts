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
 * @fileoverview Directives for reusable data visualization components.
 */

import cloneDeep from 'lodash/cloneDeep';

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { AppConstants } from 'app.constants';
import { GraphLink, GraphNodes } from 'services/compute-graph.service';

export interface GraphBoundaries {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

interface NodePositionToId {
  nodeId: string;
  offset: number;
}

interface GraphAdjacencyLists {
  [node: string]: string[];
}

export interface AugmentedLink {
  source: NodeData;
  target: NodeData;
  d?: string;
  style?: string;
  connectsDestIfStuck: boolean;
}

export interface NodeData {
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

export interface NodeDataDict {
  [nodeId: string]: NodeData;
}

@Injectable({
  providedIn: 'root'
})
export class StateGraphLayoutService {
  MAX_INDENTATION_LEVEL = 2.5;

  // The last result of a call to computeLayout(). Used for determining the
  // order in which to specify states in rules.
  // If we haven't called the computeLayout() function
  // then it is expected to stay null.
  lastComputedArrangement: NodeDataDict | null = null;

  getGraphAsAdjacencyLists(
      nodes: GraphNodes, links: GraphLink[]): GraphAdjacencyLists {
    var adjacencyLists: GraphAdjacencyLists = {};

    for (var nodeId in nodes) {
      adjacencyLists[nodeId] = [];
    }
    for (var i = 0; i < links.length; i++) {
      if (
        links[i].source !== links[i].target &&
        adjacencyLists[links[i].source].indexOf(links[i].target) === -1
      ) {
        adjacencyLists[links[i].source].push(links[i].target);
      }
    }

    return adjacencyLists;
  }

  getIndentationLevels(
      adjacencyLists: GraphAdjacencyLists, trunkNodeIds: string[]): number[] {
    var indentationLevels: number[] = [];
    // Recursively find and indent the longest shortcut for the segment of
    // nodes ranging from trunkNodeIds[startInd] to trunkNodeIds[endInd]
    // (inclusive). It's possible that this shortcut starts from a trunk
    // node within this interval (A, say) and ends at a trunk node after
    // this interval, in which case we indent all nodes from A + 1 onwards.
    // NOTE: this mutates indentationLevels as a side-effect.
    var indentLongestShortcut = (startInd: number, endInd: number) => {
      if (startInd >= endInd ||
          indentationLevels[startInd] >= this.MAX_INDENTATION_LEVEL) {
        return;
      }

      var bestSourceInd = -1;
      var bestTargetInd = -1;

      for (var sourceInd = startInd; sourceInd < endInd; sourceInd++) {
        var sourceNodeId = trunkNodeIds[sourceInd];
        for (var i = 0; i < adjacencyLists[sourceNodeId].length; i++) {
          var possibleTargetInd = trunkNodeIds.indexOf(
            adjacencyLists[sourceNodeId][i]);
          if (possibleTargetInd !== -1 && sourceInd < possibleTargetInd) {
            var targetInd = Math.min(possibleTargetInd, endInd + 1);
            if (targetInd - sourceInd > bestTargetInd - bestSourceInd) {
              bestSourceInd = sourceInd;
              bestTargetInd = targetInd;
            }
          }
        }
      }

      if (bestTargetInd - bestSourceInd > 1) {
        // Indent nodes in [bestSourceInd + 1, bestTargetInd - 1].
        for (var i = bestSourceInd + 1; i < bestTargetInd; i++) {
          indentationLevels[i] += 0.5;
        }

        // Recursively attempt to indent nodes before, within and after this
        // interval.
        indentLongestShortcut(startInd, bestSourceInd);
        indentLongestShortcut(bestSourceInd + 1, bestTargetInd - 1);
        indentLongestShortcut(bestTargetInd, endInd);
      }
    };

    for (var i = 0; i < trunkNodeIds.length; i++) {
      indentationLevels.push(0);
    }
    indentLongestShortcut(0, trunkNodeIds.length - 1);
    return indentationLevels;
  }

  // Returns an object representing the nodes of the graph. The keys of the
  // object are the node labels. The corresponding values are objects with
  // the following keys:
  //   - x0: the x-position of the top-left corner of the node, measured
  //       as a fraction of the total width.
  //   - y0: the y-position of the top-left corner of the node, measured
  //       as a fraction of the total height.
  //   - width: the width of the node, measured as a fraction of the total
  //       width.
  //   - height: the height of the node, measured as a fraction of the total
  //       height.
  //   - xLabel: the x-position of the middle of the box containing
  //       the node label, measured as a fraction of the total width.
  //       The node label is centered horizontally within this box.
  //   - yLabel: the y-position of the middle of the box containing
  //       the node label, measured as a fraction of the total height.
  //       The node label is centered vertically within this box.
  //   - reachable: whether there is a path from the start node to this
  //       node.
  //   - reachableFromEnd: whether there is a path from this node to the
  //       END node.
  //   - id: a unique id for the node.
  //   - label: the full label of the node.
  computeLayout(
      nodes: GraphNodes, links: GraphLink[], initNodeId: string,
      finalNodeIds: string[]): NodeDataDict {
    var adjacencyLists = this.getGraphAsAdjacencyLists(nodes, links);

    // Find a long path through the graph from the initial state to a
    // terminal state via simple backtracking. Limit the algorithm to a
    // constant number of calls in order to ensure that the calculation
    // does not take too long.
    var MAX_BACKTRACKING_CALLS = 1000;
    var numBacktrackingCalls = 0;
    var bestPath = [initNodeId];
    // Note that this is a 'global variable' for the purposes of the
    // backtracking computation.
    var currentPath: string[] = [];

    var backtrack = (currentNodeId: string) => {
      currentPath.push(currentNodeId);

      // If the current node leads to no other nodes, we consider it a
      // 'terminal state'.
      if (adjacencyLists[currentNodeId].length === 0) {
        if (currentPath.length > bestPath.length) {
          bestPath = cloneDeep(currentPath);
        }
      } else {
        numBacktrackingCalls++;
        if (numBacktrackingCalls <= MAX_BACKTRACKING_CALLS) {
          for (var i = 0; i < adjacencyLists[currentNodeId].length; i++) {
            if (currentPath.indexOf(
              adjacencyLists[currentNodeId][i]) === -1) {
              backtrack(adjacencyLists[currentNodeId][i]);
            }
          }
        }
      }

      currentPath.pop();
    };

    backtrack(initNodeId);

    // In this implementation, nodes are aligned with a rectangular grid.
    // We calculate two additional internal variables for each node in
    // nodeData:
    //   - depth: its depth in the graph.
    //   - offset: its horizontal offset in the graph.
    // The depth and offset are measured in terms of grid squares.
    //
    // We first take the longest path through the graph (the 'trunk') and
    // find the longest possible shortcuts within that path, then indent
    // the nodes within those shortcuts and assign depths/offsets to them.
    // The indentation is done by only half a node width, so that the nodes
    // still feel 'close' together.
    //
    // After that, we traverse all remaining nodes via BFS and arrange them
    // such that nodes that are immediate descendants of nodes in the trunk
    // fall in the level just below their parent, and their children fall in
    // the next level, etc. All these nodes are placed to the right of the
    // trunk.
    //
    // NOTE: This algorithm does not work so well in clarifying articulation
    // points and 'subclusters' within a graph. For an illustration of this,
    // see the 'Parameterized Adventure' demo exploration.
    var SENTINEL_DEPTH = -1;
    var SENTINEL_OFFSET = -1;

    var nodeData: NodeDataDict = {};
    for (var nodeId in nodes) {
      nodeData[nodeId] = {} as NodeData;
      nodeData[nodeId].depth = SENTINEL_DEPTH;
      nodeData[nodeId].offset = SENTINEL_OFFSET;
      nodeData[nodeId].reachable = false;
      nodeData[nodeId].reachableFromEnd = false;
    }

    var maxDepth = 0;
    var maxOffsetInEachLevel: {[id: number]: number} = {
      0: 0
    };
    var trunkNodesIndentationLevels = this.getIndentationLevels(
      adjacencyLists, bestPath);

    for (var i = 0; i < bestPath.length; i++) {
      nodeData[bestPath[i]].depth = maxDepth;
      nodeData[bestPath[i]].offset = trunkNodesIndentationLevels[i];
      nodeData[bestPath[i]].reachable = true;
      maxOffsetInEachLevel[maxDepth] = trunkNodesIndentationLevels[i];
      maxDepth++;
    }

    // Do a breadth-first search to calculate the depths and offsets for
    // other nodes.
    var seenNodes = [initNodeId];
    var queue = [initNodeId];

    while (queue.length > 0) {
      var currNodeId = queue[0];
      queue.shift();

      nodeData[currNodeId].reachable = true;

      for (var i = 0; i < adjacencyLists[currNodeId].length; i++) {
        var linkTarget = adjacencyLists[currNodeId][i];

        // If the target node is a trunk node, but isn't at the correct
        // depth to process now, we ignore it for now and stick it back in
        // the queue to be processed later.
        if (
          bestPath.indexOf(linkTarget) !== -1 &&
          nodeData[linkTarget].depth !== nodeData[currNodeId].depth + 1
        ) {
          if (
            seenNodes.indexOf(linkTarget) === -1 &&
            queue.indexOf(linkTarget) === -1
          ) {
            queue.push(linkTarget);
          }
          continue;
        }

        // Assign depths and offsets to nodes only if we're processing them
        // for the first time.
        if (seenNodes.indexOf(linkTarget) === -1) {
          seenNodes.push(linkTarget);

          if (nodeData[linkTarget].depth === SENTINEL_DEPTH) {
            nodeData[linkTarget].depth = nodeData[currNodeId].depth + 1;
            nodeData[linkTarget].offset = (
              nodeData[linkTarget].depth in maxOffsetInEachLevel ?
              maxOffsetInEachLevel[nodeData[linkTarget].depth] + 1 : 0);

            maxDepth = Math.max(maxDepth, nodeData[linkTarget].depth);
            maxOffsetInEachLevel[nodeData[linkTarget].depth] = (
              nodeData[linkTarget].offset);
          }

          if (queue.indexOf(linkTarget) === -1) {
            queue.push(linkTarget);
          }
        }
      }
    }

    // Handle nodes that were not visited in the forward traversal.
    maxOffsetInEachLevel[maxDepth + 1] = 0;
    maxDepth += 1;
    var orphanedNodesExist = false;
    for (var nodeId in nodeData) {
      if (nodeData[nodeId].depth === SENTINEL_DEPTH) {
        orphanedNodesExist = true;
        nodeData[nodeId].depth = maxDepth;
        nodeData[nodeId].offset = maxOffsetInEachLevel[maxDepth];
        maxOffsetInEachLevel[maxDepth] += 1;
      }
    }
    if (orphanedNodesExist) {
      maxDepth++;
    }

    // Build the 'inverse index' -- for each row, store the (offset, nodeId)
    // pairs in ascending order of offset.
    var nodePositionsToIds: NodePositionToId[][] = [];
    for (var i = 0; i <= maxDepth; i++) {
      nodePositionsToIds.push([]);
    }
    for (var nodeId in nodeData) {
      if (nodeData[nodeId].depth !== SENTINEL_DEPTH) {
        nodePositionsToIds[nodeData[nodeId].depth].push({
          nodeId: nodeId,
          offset: nodeData[nodeId].offset
        });
      }
    }
    for (var i = 0; i <= maxDepth; i++) {
      nodePositionsToIds[i].sort((a, b) => {
        return a.offset - b.offset;
      });
    }

    // Recalculate the node depths and offsets, taking into account
    // MAX_NODES_PER_ROW. If there are too many nodes in a row, we overflow
    // them into the next one.
    var currentDepth = 0;
    var currentLeftMargin = 0;
    var currentLeftOffset = 0;
    for (var i = 0; i <= maxDepth; i++) {
      if (nodePositionsToIds[i].length > 0) {
        // The offset of the leftmost node at this depth. If there are too
        // many nodes in this depth, this variable is used to figure out
        // which offset to start the continuation rows from.
        currentLeftMargin = nodePositionsToIds[i][0].offset;
        // The offset of the current node under consideration.
        currentLeftOffset = currentLeftMargin;

        for (var j = 0; j < nodePositionsToIds[i].length; j++) {
          var computedOffset = currentLeftOffset;
          if (computedOffset >= AppConstants.MAX_NODES_PER_ROW) {
            currentDepth++;
            computedOffset = currentLeftMargin + 1;
            currentLeftOffset = computedOffset;
          }

          nodeData[nodePositionsToIds[i][j].nodeId].depth = currentDepth;
          nodeData[nodePositionsToIds[i][j].nodeId].offset = (
            currentLeftOffset);

          currentLeftOffset += 1;
        }
        currentDepth++;
      }
    }

    // Calculate the width and height of each grid rectangle.
    var totalRows = currentDepth;
    // Set totalColumns to be MAX_NODES_PER_ROW, so that the width of the
    // graph visualization can be calculated based on a fixed constant,
    // MAX_NODES_PER_ROW. Otherwise, the width of the individual nodes is
    // dependent on the number of nodes in the longest row, and this makes
    // the nodes too wide if, e.g., the overall graph is just a single
    // column wide.
    var totalColumns = AppConstants.MAX_NODES_PER_ROW;

    // Horizontal padding between the graph and the edge of the graph
    // visualization, measured as a fraction of the entire height.
    var HORIZONTAL_EDGE_PADDING_FRACTION = 0.05;
    // Vertical edge padding between the graph and the edge of the graph
    // visualization, measured as a fraction of the entire height.
    var VERTICAL_EDGE_PADDING_FRACTION = 0.1;

    // The vertical padding, measured as a fraction of the height of a grid
    // rectangle, between the top of the grid rectangle and the top of the
    // node. An equivalent amount of padding will be used for the space
    // between the bottom of the grid rectangle and the bottom of the node.
    var GRID_NODE_Y_PADDING_FRACTION = 0.2;
    // As above, but for the horizontal padding.
    var GRID_NODE_X_PADDING_FRACTION = 0.1;
    var X_LABEL_OFFSET_CHECKPOINT_ICON = 0.01;
    var WIDTH_OFFSET_CHECKPOINT_ICON = 0.02;

    // Helper function that returns a horizontal position, in terms of a
    // fraction of the total width, given a horizontal offset in terms of
    // grid rectangles.
    var getHorizontalPosition = (offsetInGridRectangles: number) => {
      var fractionalGridWidth = (
        (1.0 - HORIZONTAL_EDGE_PADDING_FRACTION * 2) / totalColumns);
      return (
        HORIZONTAL_EDGE_PADDING_FRACTION +
        fractionalGridWidth * offsetInGridRectangles);
    };

    // Helper function that returns a vertical position, in terms of a
    // fraction of the total height, given a vertical offset in terms of
    // grid rectangles.
    var getVerticalPosition = (offsetInGridRectangles: number) => {
      var fractionalGridHeight = (
        (1.0 - VERTICAL_EDGE_PADDING_FRACTION * 2) / totalRows);
      return (
        VERTICAL_EDGE_PADDING_FRACTION +
        fractionalGridHeight * offsetInGridRectangles);
    };

    for (var nodeId in nodeData) {
      nodeData[nodeId].y0 = getVerticalPosition(
        nodeData[nodeId].depth + GRID_NODE_Y_PADDING_FRACTION);
      nodeData[nodeId].x0 = getHorizontalPosition(
        nodeData[nodeId].offset + GRID_NODE_X_PADDING_FRACTION);

      nodeData[nodeId].yLabel = getVerticalPosition(
        nodeData[nodeId].depth + 0.5);
      nodeData[nodeId].xLabel = getHorizontalPosition(
        nodeData[nodeId].offset + 0.5) + X_LABEL_OFFSET_CHECKPOINT_ICON;

      nodeData[nodeId].height = (
        (1.0 - VERTICAL_EDGE_PADDING_FRACTION * 2) / totalRows
      ) * (1.0 - GRID_NODE_Y_PADDING_FRACTION * 2);
      nodeData[nodeId].width = (
        (1.0 - HORIZONTAL_EDGE_PADDING_FRACTION * 2) / totalColumns
      ) * (1.0 - GRID_NODE_X_PADDING_FRACTION * 2) +
      WIDTH_OFFSET_CHECKPOINT_ICON;
    }

    // Assign id and label to each node.
    for (var nodeId in nodeData) {
      nodeData[nodeId].id = nodeId;
      nodeData[nodeId].label = nodes[nodeId];
    }

    // Mark nodes that are reachable from any end state via backward links.
    queue = finalNodeIds;
    for (var i = 0; i < finalNodeIds.length; i++) {
      nodeData[finalNodeIds[i]].reachableFromEnd = true;
    }
    while (queue.length > 0) {
      var currNodeId = queue[0];
      queue.shift();

      for (var i = 0; i < links.length; i++) {
        if (links[i].target === currNodeId &&
            !nodeData[links[i].source].reachableFromEnd) {
          nodeData[links[i].source].reachableFromEnd = true;
          queue.push(links[i].source);
        }
      }
    }

    this.lastComputedArrangement = cloneDeep(nodeData);

    return nodeData;
  }

  // It is expected to return null if we haven't executed the
  // computeLayout() function.
  getLastComputedArrangement(): NodeDataDict | null {
    return cloneDeep(this.lastComputedArrangement);
  }

  getGraphBoundaries(nodeData: NodeDataDict): GraphBoundaries {
    var INFINITY = 1e30;
    var BORDER_PADDING = 5;

    var leftEdge = INFINITY;
    var topEdge = INFINITY;
    var bottomEdge = -INFINITY;
    var rightEdge = -INFINITY;

    for (var nodeId in nodeData) {
      leftEdge = Math.min(
        nodeData[nodeId].x0 - BORDER_PADDING, leftEdge);
      topEdge = Math.min(
        nodeData[nodeId].y0 - BORDER_PADDING, topEdge);
      rightEdge = Math.max(
        nodeData[nodeId].x0 + BORDER_PADDING + nodeData[nodeId].width,
        rightEdge);
      bottomEdge = Math.max(
        nodeData[nodeId].y0 + BORDER_PADDING + nodeData[nodeId].height,
        bottomEdge);
    }

    return {
      bottom: bottomEdge,
      left: leftEdge,
      right: rightEdge,
      top: topEdge
    };
  }

  /* We are expecting it to return undefined when
     State1.xLabel === State2.xLabel and State1.yLabel === State2.yLabel
     where State1 and State2 refers to objects inside nodeData. */
  getAugmentedLinks(
      nodeData: NodeDataDict,
      nodeLinks: GraphLink[]
  ): AugmentedLink[] {
    var links = cloneDeep(nodeLinks);
    var augmentedLinks: AugmentedLink[] = links.map(link => {
      return {
        source: cloneDeep(nodeData[link.source]),
        target: cloneDeep(nodeData[link.target]),
        connectsDestIfStuck: cloneDeep(link.connectsDestIfStuck)
      };
    });

    for (var i = 0; i < augmentedLinks.length; i++) {
      var link = augmentedLinks[i];
      if (link.source.label !== link.target.label) {
        var sourcex = link.source.xLabel;
        var sourcey = link.source.yLabel;
        var targetx = link.target.xLabel;
        var targety = link.target.yLabel;

        if (sourcex === targetx && sourcey === targety) {
          // TODO(sll): Investigate why this happens.
          return [];
        }

        var sourceWidth = link.source.width;
        var sourceHeight = link.source.height;
        var targetWidth = link.target.width;
        var targetHeight = link.target.height;

        var dx = targetx - sourcex;
        var dy = targety - sourcey;

        /* Fractional amount of truncation to be applied to the end of
           each link. */
        var startCutoff = (sourceWidth / 2) / Math.abs(dx);
        var endCutoff = (targetWidth / 2) / Math.abs(dx);
        if (dx === 0 || dy !== 0) {
          startCutoff = (
            (dx === 0) ? (sourceHeight / 2) / Math.abs(dy) :
            Math.min(startCutoff, (sourceHeight / 2) / Math.abs(dy)));
          endCutoff = (
            (dx === 0) ? (targetHeight / 2) / Math.abs(dy) :
            Math.min(endCutoff, (targetHeight / 2) / Math.abs(dy)));
        }

        var dxperp = targety - sourcey;
        var dyperp = sourcex - targetx;
        var norm = Math.sqrt(dxperp * dxperp + dyperp * dyperp);
        dxperp /= norm;
        dyperp /= norm;

        var midx = sourcex + dx / 2 + dxperp * (sourceHeight / 4);
        var midy = sourcey + dy / 2 + dyperp * (targetHeight / 4);
        var startx = sourcex + startCutoff * dx;
        var starty = sourcey + startCutoff * dy;
        var endx = targetx - endCutoff * dx;
        var endy = targety - endCutoff * dy;

        // Draw a quadratic bezier curve.
        augmentedLinks[i].d = (
          'M' + startx + ' ' + starty + ' Q ' + midx + ' ' + midy +
          ' ' + endx + ' ' + endy);
      }
    }
    return augmentedLinks;
  }

  modifyPositionValues(
      nodeData: NodeDataDict,
      graphWidth: number,
      graphHeight: number
  ): NodeDataDict {
    Object.keys(nodeData).forEach(nodeId => {
      nodeData[nodeId].x0 *= graphWidth;
      nodeData[nodeId].width *= graphWidth;
      nodeData[nodeId].xLabel *= graphWidth;
      nodeData[nodeId].y0 *= graphHeight;
      nodeData[nodeId].height *= graphHeight;
      nodeData[nodeId].yLabel *= graphHeight;
    });
    return nodeData;
  }

  getGraphWidth(maxNodesPerRow: number, maxNodeLabelLength: number): number {
    // A rough upper bound for the width of a single letter, in pixels,
    // to use as a scaling factor to determine the width of graph nodes.
    // This is not an entirely accurate description because it also takes
    // into account the horizontal whitespace between graph nodes.
    var letterWidthInPixels = 10.5;
    return maxNodesPerRow * maxNodeLabelLength * letterWidthInPixels;
  }

  getGraphHeight(nodeData: NodeDataDict): number {
    var maxDepth = 0;
    for (var nodeId in nodeData) {
      maxDepth = Math.max(maxDepth, nodeData[nodeId].depth);
    }
    return 70.0 * (maxDepth + 1);
  }
}

// Service for computing layout of state graph nodes.
angular.module('oppia').factory(
  'StateGraphLayoutService', downgradeInjectable(StateGraphLayoutService));
