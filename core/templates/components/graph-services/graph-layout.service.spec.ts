// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit test for StateGraphLayoutService.
 */

import { TestBed } from '@angular/core/testing';
import { AppConstants } from 'app.constants';
import cloneDeep from 'lodash/cloneDeep';

import { GraphLink, GraphNodes } from 'services/compute-graph.service';
import { StateGraphLayoutService } from './graph-layout.service';

describe('Graph Layout Service', () => {
  let sgls: StateGraphLayoutService = null;

  // Represents the nodes of a graph, with node labels as keys, and the
  // following structure:
  //
  //   ┌────────┬───────────────State1───────────────┬───────┐
  //   │        │               │ │ │                │       │
  //   │        │        ┌──────┘ │ └──────┐         │       │
  //   ▼        ▼        ▼        ▼        ▼         ▼       ▼
  // State2   State3   State5   State6   State7   State8◄──State9
  //   │         │                                   │
  //   │         └────────────────┐                  │
  //   │                          ▼                  │
  //   └───────────────────────►State4◄──────────────┘
  //
  //                           Orphaned.
  // The corresponding value of labels are objects with the following keys
  // (only which are used in this spec file):
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

  let nodeData1 = {
    State1: {
      depth: 0,
      offset: 0,
      reachable: true,
      x0: 0.07250000000000001,
      y0: 0.12666666666666668,
      xLabel: 0.1625,
      yLabel: 0.16666666666666669,
      id: 'State1',
      label: 'State1',
      height: 0.08,
      width: 0.18000000000000002,
      reachableFromEnd: true
    },
    State2: {
      depth: 1,
      offset: 1.5,
      reachable: true,
      x0: 0.41000000000000003,
      y0: 0.26,
      xLabel: 0.5,
      yLabel: 0.30000000000000004,
      id: 'State2',
      label: 'State2',
      height: 0.08,
      width: 0.18000000000000002,
      reachableFromEnd: true
    },
    State3: {
      depth: 1,
      offset: 2.5,
      reachable: true,
      x0: 0.6350000000000001,
      y0: 0.26,
      xLabel: 0.7250000000000001,
      yLabel: 0.30000000000000004,
      id: 'State3',
      label: 'State3',
      height: 0.08,
      width: 0.18000000000000002,
      reachableFromEnd: true
    },
    State4: {
      depth: 4,
      offset: 0,
      reachable: true,
      x0: 0.07250000000000001,
      y0: 0.66,
      xLabel: 0.1625,
      yLabel: 0.7,
      id: 'State4',
      label: 'State4',
      height: 0.08,
      width: 0.18000000000000002,
      reachableFromEnd: true
    },
    State5: {
      depth: 1,
      offset: 3.5,
      reachable: true,
      x0: 0.8600000000000001,
      y0: 0.26,
      xLabel: 0.9500000000000001,
      yLabel: 0.30000000000000004,
      id: 'State5',
      label: 'State5',
      height: 0.08,
      width: 0.18000000000000002,
      reachableFromEnd: false
    },
    State6: {
      depth: 2,
      offset: 1.5,
      reachable: true,
      x0: 0.41000000000000003,
      y0: 0.3933333333333333,
      xLabel: 0.5,
      yLabel: 0.43333333333333335,
      id: 'State6',
      label: 'State6',
      height: 0.08,
      width: 0.18000000000000002,
      reachableFromEnd: false
    },
    State7: {
      depth: 2,
      offset: 2.5,
      reachable: true,
      x0: 0.6350000000000001,
      y0: 0.3933333333333333,
      xLabel: 0.7250000000000001,
      yLabel: 0.43333333333333335,
      id: 'State7',
      label: 'State7',
      height: 0.08,
      width: 0.18000000000000002,
      reachableFromEnd: false
    },
    State8: {
      depth: 3,
      offset: 0,
      reachable: true,
      x0: 0.07250000000000001,
      y0: 0.5266666666666667,
      xLabel: 0.1625,
      yLabel: 0.5666666666666667,
      id: 'State8',
      label: 'State8',
      height: 0.08,
      width: 0.18000000000000002,
      reachableFromEnd: true
    },
    State9: {
      depth: 1,
      offset: 0.5,
      reachable: true,
      x0: 0.185,
      y0: 0.26,
      xLabel: 0.275,
      yLabel: 0.30000000000000004,
      id: 'State9',
      label: 'State9',
      height: 0.08,
      width: 0.18000000000000002,
      reachableFromEnd: true
    },
    Orphaned: {
      depth: 5,
      offset: 0,
      reachable: false,
      x0: 0.07250000000000001,
      y0: 0.7933333333333333,
      xLabel: 0.1625,
      yLabel: 0.8333333333333333,
      id: 'Orphaned',
      label: 'Orphaned',
      height: 0.08,
      width: 0.18000000000000002,
      reachableFromEnd: false
    }
  };
  let links1: GraphLink[] = [
    {
      source: 'State1',
      target: 'State1'
    },
    {
      source: 'State1',
      target: 'State2'
    },
    {
      source: 'State1',
      target: 'State3'
    },
    {
      source: 'State1',
      target: 'State5'
    },
    {
      source: 'State1',
      target: 'State6'
    },
    {
      source: 'State1',
      target: 'State7'
    },
    {
      source: 'State1',
      target: 'State8'
    },
    {
      source: 'State1',
      target: 'State9'
    },
    {
      source: 'State2',
      target: 'State4'
    },
    {
      source: 'State3',
      target: 'State4'
    },
    {
      source: 'State9',
      target: 'State8'
    },
    {
      source: 'State8',
      target: 'State4'
    },
  ];

  let links2: GraphLink[] = [
    {
      source: 'State1',
      target: 'State1'
    },
    {
      source: 'State1',
      target: 'State2'
    },
    {
      source: 'State1',
      target: 'State3'
    },
    {
      source: 'State2',
      target: 'State4'
    },
    {
      source: 'State3',
      target: 'State4'
    },
  ];

  beforeEach(() => {
    sgls = TestBed.inject(StateGraphLayoutService);
  });

  it('should create adjacency lists', () => {
    let nodes: GraphNodes = {
      State1: 'State1',
      State2: 'State2',
      State3: 'State3',
      State4: 'State4',
    };
    let expectedAdjacencyLists = {
      State1: ['State2', 'State3'],
      State2: ['State4'],
      State3: ['State4'],
      State4: []
    };

    expect(sgls.getGraphAsAdjacencyLists(nodes, links2))
      .toEqual(expectedAdjacencyLists);
  });

  it('should return indentation levels for a segment of nodes', () => {
    let adjacencyLists = {
      State1: ['State2', 'State3', 'State4'],
      State2: ['State3', 'State4'],
      State3: ['State4', 'State5'],
      State4: ['State5'],
      State5: []
    };

    let longestPathIds: string[] = [
      'State1',
      'State2',
      'State3',
      'State4',
      'State5'
    ];

    expect(sgls.getIndentationLevels(adjacencyLists, longestPathIds)).toEqual(
      [0, 0.5, 1, 0, 0]);

    let shortestPathIds: string[] = [
      'State1',
      'State4',
      'State5'
    ];
    expect(sgls.getIndentationLevels(adjacencyLists, shortestPathIds)).toEqual(
      [0, 0, 0]);
  });

  it('should not return indentation level greater' +
    ' than MAX_INDENTATION_LEVEL', () => {
    let adjacencyLists = {
      State1: ['State2', 'State3'],
      State2: ['State3', 'State6'],
      State6: ['State3', 'State8'],
      State8: ['State3', 'State7'],
      State7: ['State3', 'State9'],
      State9: ['State3', 'State10'],
      State10: ['State3'],
      State3: ['State5'],
      State5: []
    };

    let trunkNodeIds: string[] = [
      'State1',
      'State2',
      'State6',
      'State8',
      'State7',
      'State9',
      'State10',
      'State3',
      'State5'
    ];

    let returnedIndentationLevels = sgls.getIndentationLevels(
      adjacencyLists, trunkNodeIds);
    returnedIndentationLevels.forEach(indentationLevel => {
      expect(indentationLevel).toBeLessThanOrEqual(sgls.MAX_INDENTATION_LEVEL);
    });
  });

  it('should return augmented links with bezier curves', () => {
    let nodeData = {
      State1: {
        depth: 0,
        offset: 0,
        reachable: true,
        x0: 0.07250000000000001,
        y0: 0.15333333333333335,
        xLabel: 0.1625,
        yLabel: 0.23333333333333334,
        id: 'State1',
        label: 'State1',
        height: 0.16,
        width: 0.18000000000000002,
        reachableFromEnd: false
      },
      State2: {
        depth: 1,
        offset: 0,
        reachable: true,
        x0: 0.07250000000000001,
        y0: 0.42000000000000004,
        xLabel: 0.1625,
        yLabel: 0.5,
        id: 'State2',
        label: 'State2',
        height: 0.16,
        width: 0.18000000000000002,
        reachableFromEnd: false
      },
      State3: {
        depth: 1,
        offset: 1,
        reachable: true,
        x0: 0.29750000000000004,
        y0: 0.42000000000000004,
        xLabel: 0.3875,
        yLabel: 0.5,
        id: 'State3',
        label: 'State3',
        height: 0.16,
        width: 0.18000000000000002,
        reachableFromEnd: false
      },
      State4: {
        depth: 2,
        offset: 0,
        reachable: true,
        x0: 0.07250000000000001,
        y0: 0.6866666666666666,
        xLabel: 0.1625,
        yLabel: 0.7666666666666666,
        id: 'State4',
        label: 'State4',
        height: 0.16,
        width: 0.18000000000000002,
        reachableFromEnd: false
      }
    };

    // Here, bezier curve follows the format 'M%f %f Q %f %f %f %f'. The
    // floating point values are caluclated with the help of the position values
    // of source and target nodes (in links2) and nodeData.
    let expectedBezierCurveValues = [
      'M0.1625 0.31333333333333335 Q 0.2025 0.3666666666666667 0.1625 0.42',
      'M0.23 0.31333333333333335 Q 0.30557165934031566' +
          ' 0.3408718290982754 0.32 0.42',
      'M0.1625 0.5800000000000001 Q 0.2025 0.6333333333333333' +
          ' 0.1625 0.6866666666666665',
      'M0.32 0.5800000000000001 Q 0.30557165934031566' +
          ' 0.6591281709017246 0.23000000000000004 0.6866666666666665'
    ];

    let returnedAugmentedLinks = sgls.getAugmentedLinks(nodeData, links2);
    let returnedBezierCurveValues = [];

    // Starting with index 1 as, links2 has first link with same source and
    // target node. SO, first augmentedLink will not have a Bezier curve.
    for (var i = 1; i < returnedAugmentedLinks.length; i++) {
      returnedBezierCurveValues.push(returnedAugmentedLinks[i].d);
    }

    // Check if the returned augmented links have a bezier curve
    // which is equal to the expected value.
    expect(returnedBezierCurveValues).toEqual(expectedBezierCurveValues);
  });

  it('should return undefined when source and target nodes overlap' +
    ' while processing augmented links', () => {
    // The nodes State1 and State2 overlap as State1.xLabel === State2.xLabel
    // and State1.yLabel === State2.yLabel .
    let nodeData = {
      State1: {
        depth: 0,
        offset: 0,
        reachable: true,
        x0: 0.07250000000000001,
        y0: 0.15333333333333335,
        xLabel: 0.1625,
        yLabel: 0.23333333333333334,
        id: 'State1',
        label: 'State1',
        height: 0.16,
        width: 0.18000000000000002,
        reachableFromEnd: false
      },
      State2: {
        depth: 1,
        offset: 0,
        reachable: true,
        x0: 0.07250000000000001,
        y0: 0.42000000000000004,
        xLabel: 0.1625,
        yLabel: 0.23333333333333334,
        id: 'State2',
        label: 'State2',
        height: 0.16,
        width: 0.18000000000000002,
        reachableFromEnd: false
      }
    };

    let links = [
      {
        source: 'State1',
        target: 'State2'
      }
    ];

    expect(sgls.getAugmentedLinks(nodeData, links)).toBeUndefined();
  });

  it('should get correct graph width and height', () => {
    let nodeData = {
      State1: {
        depth: 1,
        offset: 0,
        reachable: true,
        x0: 0.07250000000000001,
        y0: 0.42000000000000004,
        xLabel: 0.1625,
        yLabel: 0.5,
        id: 'State1',
        label: 'State1',
        height: 0.16,
        width: 0.18000000000000002,
        reachableFromEnd: false
      },
      Introduction: {
        depth: 0,
        offset: 0,
        reachable: true,
        x0: 0.07250000000000001,
        y0: 0.15333333333333335,
        xLabel: 0.1625,
        yLabel: 0.23333333333333334,
        id: 'Introduction',
        label: 'Introduction',
        height: 0.16,
        width: 0.18000000000000002,
        reachableFromEnd: false
      },
      End: {
        depth: 2,
        offset: 0,
        reachable: true,
        x0: 0.07250000000000001,
        y0: 0.6866666666666666,
        xLabel: 0.1625,
        yLabel: 0.7666666666666666,
        id: 'End',
        label: 'End',
        height: 0.16,
        width: 0.18000000000000002,
        reachableFromEnd: false
      },
      State2: {
        depth: 1,
        offset: 1,
        reachable: true,
        x0: 0.29750000000000004,
        y0: 0.42000000000000004,
        xLabel: 0.3875,
        yLabel: 0.5,
        id: 'State2',
        label: 'State2',
        height: 0.16,
        width: 0.18000000000000002,
        reachableFromEnd: false
      }
    };

    let graphWidthUpperBound = sgls.getGraphWidth(
      AppConstants.MAX_NODES_PER_ROW, AppConstants.MAX_NODE_LABEL_LENGTH);
    let graphHeight = sgls.getGraphHeight(nodeData);

    // 10.5 is a rough upper bound for the width of a single letter in pixels,
    // used as a scaling factor to determine width of graph nodes.
    expect(graphWidthUpperBound).toBe(
      AppConstants.MAX_NODES_PER_ROW * AppConstants.MAX_NODE_LABEL_LENGTH * 10.5
    );
    // Here, graphHeight = 70 * (maxDepth + 1), here maxDepth is 2.
    expect(graphHeight).toBe(210);
  });

  it('should get graph width and height when nodes' +
    ' overflow to next row', () => {
    let graphWidth = sgls.getGraphWidth(
      AppConstants.MAX_NODES_PER_ROW, AppConstants.MAX_NODE_LABEL_LENGTH);
    let graphHeight = sgls.getGraphHeight(nodeData1);

    // 10.5 is a rough upper bound for the width of a single letter in pixels,
    // used as a scaling factor to determine width of graph nodes.
    expect(graphWidth).toBe(
      AppConstants.MAX_NODES_PER_ROW * AppConstants.MAX_NODE_LABEL_LENGTH * 10.5
    );

    // Here, graphHeight = 70 * (maxDepth + 1), here maxDepth is 5.
    expect(graphHeight).toBe(420);
  });


  it('should compute graph layout', () => {
    let nodes: GraphNodes = {
      State1: 'State1',
      State2: 'State2',
      State3: 'State3',
      State4: 'State4',
      State5: 'State5',
      State6: 'State6',
      State7: 'State7',
      State8: 'State8',
      State9: 'State9',
      Orphaned: 'Orphaned'
    };

    let initNodeId: string = 'State1';
    let finalNodeIds: string[] = ['State4'];

    expect(sgls.computeLayout(nodes, links1, initNodeId, finalNodeIds)).toEqual(
      nodeData1);
  });

  it('should overflow nodes to next row if there are' +
    ' too many nodes at a depth', () => {
    let MAX_NODES_PER_ROW = AppConstants.MAX_NODES_PER_ROW;
    let nodes: GraphNodes = {
      State0: 'State0',
      End: 'End'
    };

    let initNodeId: string = 'State0';
    let finalNodeIds: string[] = ['End'];
    let links = [];

    for (let i = 1; i <= MAX_NODES_PER_ROW + 1; i++) {
      let stateName = 'State' + (i + 1);
      nodes[stateName] = stateName;

      links.push({
        source: 'State0',
        target: stateName
      });
      links.push({
        source: stateName,
        target: 'End'
      });
    }

    let returnedLayoutNodeData = sgls.computeLayout(
      nodes, links, initNodeId, finalNodeIds);
    let countNodesDepthOne: number = 0;
    for (let nodeId in nodes) {
      if (returnedLayoutNodeData[nodeId].depth === 1) {
        countNodesDepthOne++;
      }
    }

    expect(countNodesDepthOne).toEqual(MAX_NODES_PER_ROW);
  });

  it('should place orhpaned node at max depth while computing layout', () => {
    let nodes = {
      End: 'End',
      State0: 'State0',
      Orphan: 'Orphan',
      State1: 'State1',
      State2: 'State2',
      State3: 'State3',
      State4: 'State4',
      State5: 'State5'
    };

    let links = [
      {
        source: 'State5',
        target: 'End'
      },
      {
        source: 'State4',
        target: 'End'
      },
      {
        source: 'State3',
        target: 'End'
      },
      {
        source: 'State2',
        target: 'End'
      },
      {
        source: 'State1',
        target: 'End'
      },
      {
        source: 'State0',
        target: 'State1'
      },
      {
        source: 'State0',
        target: 'State2'
      },
      {
        source: 'State0',
        target: 'State3'
      },
      {
        source: 'State0',
        target: 'State4'
      },
      {
        source: 'State0',
        target: 'State5'
      },
      {
        source: 'State0',
        target: 'State0'
      }
    ];
    let initNodeId = 'State0';
    let finalNodeIds = ['End'];

    let returnedLayout = sgls.computeLayout(
      nodes, links, initNodeId, finalNodeIds);

    expect(returnedLayout.End.depth).toBe(3);
    expect(returnedLayout.Orphan.depth).toBe(4);
  });

  it('should get last computed layout', () => {
    let nodes: GraphNodes = {
      State1: 'State1',
      State2: 'State2',
      State3: 'State3',
      State4: 'State4',
      State5: 'State5',
      State6: 'State6',
      State7: 'State7',
      State8: 'State8',
      State9: 'State9',
      Orphaned: 'Orphaned'
    };

    let initNodeId: string = 'State1';
    let finalNodeIds: string[] = ['State4'];

    expect(sgls.getLastComputedArrangement()).toBe(null);

    let computedLayout = sgls.computeLayout(
      nodes, links1, initNodeId, finalNodeIds);

    expect(sgls.getLastComputedArrangement()).toEqual(computedLayout);
  });

  it('should return graph boundaries with width less than equal to' +
    ' maximum allowed graph width', () => {
    // Here, nodeDataWithPositionValueInPixel1 ans 2 has position values
    // (x0, xLabel, width etc.) in terms of pixels.
    // nodeDataWithPositionInPixel1, 2 and 3 are node data of graphs with
    // MAX_NODE_PER_ROW - 1, MAX_NODE_PER_ROW and MAX_NODE_PER_ROW + 1 nodes in
    // a row. Right now, MAX_NODE_PER_ROW is 4.
    let nodeDataWithPositionValueInPixel1 = {
      State1: {
        depth: 1,
        offset: 0,
        reachable: true,
        x0: 45.675000000000004,
        y0: 81.19999999999999,
        xLabel: 102.375,
        yLabel: 98.00000000000001,
        id: 'State1',
        label: 'State1',
        height: 33.6,
        width: 113.40000000000002,
        reachableFromEnd: false
      },
      State2: {
        depth: 1,
        offset: 1,
        reachable: true,
        x0: 187.42500000000004,
        y0: 81.19999999999999,
        xLabel: 244.125,
        yLabel: 98.00000000000001,
        id: 'State2',
        label: 'State2',
        height: 33.6,
        width: 113.40000000000002,
        reachableFromEnd: false
      },
      State3: {
        depth: 1,
        offset: 2,
        reachable: true,
        x0: 329.17500000000007,
        y0: 81.19999999999999,
        xLabel: 385.875,
        yLabel: 98.00000000000001,
        id: 'State3',
        label: 'State3',
        height: 33.6,
        width: 113.40000000000002,
        reachableFromEnd: false
      },
      Introduction: {
        depth: 0,
        offset: 0,
        reachable: true,
        x0: 45.675000000000004,
        y0: 25.200000000000003,
        xLabel: 102.375,
        yLabel: 42.00000000000001,
        id: 'Introduction',
        label: 'Introduction',
        height: 33.6,
        width: 113.40000000000002,
        reachableFromEnd: false
      }
    };
    let nodeDataWithPositionValueInPixel2 = {
      State1: {
        depth: 1,
        offset: 0,
        reachable: true,
        x0: 45.675000000000004,
        y0: 81.19999999999999,
        xLabel: 102.375,
        yLabel: 98.00000000000001,
        id: 'State1',
        label: 'State1',
        height: 33.6,
        width: 113.40000000000002,
        reachableFromEnd: false
      },
      State2: {
        depth: 1,
        offset: 1,
        reachable: true,
        x0: 187.42500000000004,
        y0: 81.19999999999999,
        xLabel: 244.125,
        yLabel: 98.00000000000001,
        id: 'State2',
        label: 'State2',
        height: 33.6,
        width: 113.40000000000002,
        reachableFromEnd: false
      },
      State3: {
        depth: 1,
        offset: 2,
        reachable: true,
        x0: 329.17500000000007,
        y0: 81.19999999999999,
        xLabel: 385.875,
        yLabel: 98.00000000000001,
        id: 'State3',
        label: 'State3',
        height: 33.6,
        width: 113.40000000000002,
        reachableFromEnd: false
      },
      Introduction: {
        depth: 0,
        offset: 0,
        reachable: true,
        x0: 45.675000000000004,
        y0: 25.200000000000003,
        xLabel: 102.375,
        yLabel: 42.00000000000001,
        id: 'Introduction',
        label: 'Introduction',
        height: 33.6,
        width: 113.40000000000002,
        reachableFromEnd: false
      },
      State4: {
        depth: 1,
        offset: 3,
        reachable: true,
        x0: 470.925,
        y0: 81.19999999999999,
        xLabel: 527.625,
        yLabel: 98.00000000000001,
        id: 'State4',
        label: 'State4',
        height: 33.6,
        width: 113.40000000000002,
        reachableFromEnd: false
      }
    };
    let nodeDataWithPositionValueInPixel3 = {
      State1: {
        depth: 1,
        offset: 0,
        reachable: true,
        x0: 45.675000000000004,
        y0: 88.2,
        xLabel: 102.375,
        yLabel: 105,
        id: 'State1',
        label: 'State1',
        height: 33.6,
        width: 113.40000000000002,
        reachableFromEnd: false
      },
      State2: {
        depth: 1,
        offset: 1,
        reachable: true,
        x0: 187.42500000000004,
        y0: 88.2,
        xLabel: 244.125,
        yLabel: 105,
        id: 'State2',
        label: 'State2',
        height: 33.6,
        width: 113.40000000000002,
        reachableFromEnd: false
      },
      State3: {
        depth: 1,
        offset: 2,
        reachable: true,
        x0: 329.17500000000007,
        y0: 88.2,
        xLabel: 385.875,
        yLabel: 105,
        id: 'State3',
        label: 'State3',
        height: 33.6,
        width: 113.40000000000002,
        reachableFromEnd: false
      },
      Introduction: {
        depth: 0,
        offset: 0,
        reachable: true,
        x0: 45.675000000000004,
        y0: 32.2,
        xLabel: 102.375,
        yLabel: 49,
        id: 'Introduction',
        label: 'Introduction',
        height: 33.6,
        width: 113.40000000000002,
        reachableFromEnd: false
      },
      State4: {
        depth: 1,
        offset: 3,
        reachable: true,
        x0: 470.925,
        y0: 88.2,
        xLabel: 527.625,
        yLabel: 105,
        id: 'State4',
        label: 'State4',
        height: 33.6,
        width: 113.40000000000002,
        reachableFromEnd: false
      },
      State5: {
        depth: 2,
        offset: 1,
        reachable: true,
        x0: 187.42500000000004,
        y0: 144.2,
        xLabel: 244.125,
        yLabel: 161,
        id: 'State5',
        label: 'State5',
        height: 33.6,
        width: 113.40000000000002,
        reachableFromEnd: false
      }
    };
    // The expectedGraphBoundaries are calculated from the x0 and y0 values from
    // nodeDataWithPositionValueInPixel, where leftEdge is
    // minimum(nodeDataWithPositionValueInPixel[nodeId].x0 - BORDER_PADDING)
    // of all nodes, and rightEdge is
    // maximum(nodeDataWithPositionValueInPixel[nodeId].x0 + BORDER_PADDING +
    // nodeDataWithPositionValueInPixel[nodeId].width) of all nodes. Similarly,
    // bottomEdge and topEdge are calculated using y0 and node height.
    let expectedGraphBoundaries1 = sgls.getGraphBoundaries(
      nodeDataWithPositionValueInPixel1);
    let expectedGraphBoundaries2 = sgls.getGraphBoundaries(
      nodeDataWithPositionValueInPixel2);
    let expectedGraphBoundaries3 = sgls.getGraphBoundaries(
      nodeDataWithPositionValueInPixel3);

    // The width of graph calculated as difference b/w left and right edge.
    let expectedWidth1 = expectedGraphBoundaries1.right -
      expectedGraphBoundaries1.left;
    let expectedWidth2 = expectedGraphBoundaries2.right -
      expectedGraphBoundaries2.left;
    let expectedWidth3 = expectedGraphBoundaries3.right -
      expectedGraphBoundaries3.left;

    // This is the maximum upperbound for graph witdh taking padding fraction
    // into consideration.
    let widthUpperBound = 548.6500000000001;

    // The height of graph calculated as difference b/w bottom and right top.
    let expectedHeight1 = expectedGraphBoundaries1.bottom -
    expectedGraphBoundaries1.top;
    let expectedHeight2 = expectedGraphBoundaries2.bottom -
      expectedGraphBoundaries2.top;
    let expectedHeight3 = expectedGraphBoundaries3.bottom -
      expectedGraphBoundaries3.top;

    // Here, we see that for 3 nodes the graph width is less than
    // the upper bound, for  4 nodes the graph width is equal to the
    // upper bound and the width becomes constant for nodes > 4.
    expect(expectedWidth1).toBeLessThan(expectedWidth2);
    expect(expectedWidth2).toEqual(widthUpperBound);
    expect(expectedWidth3).toEqual(widthUpperBound);

    // As height does not have an upper bound, it increases as a node overflows
    // to the next row.

    expect(expectedHeight1).toEqual(expectedHeight2);
    expect(expectedHeight2).toBeLessThan(expectedHeight3);
  });

  it('should return graph boundaries with height equal to' +
  ' the graph height', () => {
    let nodeData = {
      State1: {
        depth: 1,
        offset: 0,
        reachable: true,
        x0: 0.07250000000000001,
        y0: 0.42000000000000004,
        xLabel: 0.1625,
        yLabel: 0.5,
        id: 'State1',
        label: 'State1',
        height: 0.16,
        width: 0.18000000000000002,
        reachableFromEnd: false
      },
      Introduction: {
        depth: 0,
        offset: 0,
        reachable: true,
        x0: 0.07250000000000001,
        y0: 0.15333333333333335,
        xLabel: 0.1625,
        yLabel: 0.23333333333333334,
        id: 'Introduction',
        label: 'Introduction',
        height: 0.16,
        width: 0.18000000000000002,
        reachableFromEnd: false
      },
      End: {
        depth: 2,
        offset: 0,
        reachable: true,
        x0: 0.07250000000000001,
        y0: 0.6866666666666666,
        xLabel: 0.1625,
        yLabel: 0.7666666666666666,
        id: 'End',
        label: 'End',
        height: 0.16,
        width: 0.18000000000000002,
        reachableFromEnd: false
      },
      State2: {
        depth: 1,
        offset: 1,
        reachable: true,
        x0: 0.29750000000000004,
        y0: 0.42000000000000004,
        xLabel: 0.3875,
        yLabel: 0.5,
        id: 'State2',
        label: 'State2',
        height: 0.16,
        width: 0.18000000000000002,
        reachableFromEnd: false
      }
    };
    let graphWidth = sgls.getGraphWidth(
      AppConstants.MAX_NODES_PER_ROW, AppConstants.MAX_NODE_LABEL_LENGTH);
    let graphHeight = sgls.getGraphHeight(nodeData);
    let nodeDataWithPositionValueInPixel = sgls.modifyPositionValues(
      nodeData, graphWidth, graphHeight);

    let expectedGraphBoundaries = {
      bottom: 182.79999999999998,
      left: 40.675000000000004,
      right: 305.82500000000005,
      top: 27.200000000000003
    };

    let expectedHeight = expectedGraphBoundaries.bottom -
      expectedGraphBoundaries.top;

    expect(expectedHeight).toBeLessThanOrEqual(graphHeight);
    expect(sgls.getGraphBoundaries(nodeDataWithPositionValueInPixel))
      .toEqual(expectedGraphBoundaries);
  });

  it('should modify position values in node data to use pixels', () => {
    let nodeData = {
      State1: {
        depth: 0,
        offset: 0,
        reachable: true,
        x0: 0.07250000000000001,
        y0: 0.12666666666666668,
        xLabel: 0.1625,
        yLabel: 0.16666666666666669,
        id: 'State1',
        label: 'State1',
        height: 0.08,
        width: 0.18000000000000002,
        reachableFromEnd: true
      },
      State2: {
        depth: 1,
        offset: 1.5,
        reachable: true,
        x0: 0.41000000000000003,
        y0: 0.26,
        xLabel: 0.5,
        yLabel: 0.30000000000000004,
        id: 'State2',
        label: 'State2',
        height: 0.08,
        width: 0.18000000000000002,
        reachableFromEnd: true
      },
      State3: {
        depth: 1,
        offset: 2.5,
        reachable: true,
        x0: 0.6350000000000001,
        y0: 0.26,
        xLabel: 0.7250000000000001,
        yLabel: 0.30000000000000004,
        id: 'State3',
        label: 'State3',
        height: 0.08,
        width: 0.18000000000000002,
        reachableFromEnd: true
      },
      State4: {
        depth: 4,
        offset: 0,
        reachable: true,
        x0: 0.07250000000000001,
        y0: 0.66,
        xLabel: 0.1625,
        yLabel: 0.7,
        id: 'State4',
        label: 'State4',
        height: 0.08,
        width: 0.18000000000000002,
        reachableFromEnd: true
      },
      State5: {
        depth: 1,
        offset: 3.5,
        reachable: true,
        x0: 0.8600000000000001,
        y0: 0.26,
        xLabel: 0.9500000000000001,
        yLabel: 0.30000000000000004,
        id: 'State5',
        label: 'State5',
        height: 0.08,
        width: 0.18000000000000002,
        reachableFromEnd: false
      },
      State6: {
        depth: 2,
        offset: 1.5,
        reachable: true,
        x0: 0.41000000000000003,
        y0: 0.3933333333333333,
        xLabel: 0.5,
        yLabel: 0.43333333333333335,
        id: 'State6',
        label: 'State6',
        height: 0.08,
        width: 0.18000000000000002,
        reachableFromEnd: false
      },
      State7: {
        depth: 2,
        offset: 2.5,
        reachable: true,
        x0: 0.6350000000000001,
        y0: 0.3933333333333333,
        xLabel: 0.7250000000000001,
        yLabel: 0.43333333333333335,
        id: 'State7',
        label: 'State7',
        height: 0.08,
        width: 0.18000000000000002,
        reachableFromEnd: false
      },
      State8: {
        depth: 3,
        offset: 0,
        reachable: true,
        x0: 0.07250000000000001,
        y0: 0.5266666666666667,
        xLabel: 0.1625,
        yLabel: 0.5666666666666667,
        id: 'State8',
        label: 'State8',
        height: 0.08,
        width: 0.18000000000000002,
        reachableFromEnd: true
      },
      State9: {
        depth: 1,
        offset: 0.5,
        reachable: true,
        x0: 0.185,
        y0: 0.26,
        xLabel: 0.275,
        yLabel: 0.30000000000000004,
        id: 'State9',
        label: 'State9',
        height: 0.08,
        width: 0.18000000000000002,
        reachableFromEnd: true
      },
      Orphaned: {
        depth: 5,
        offset: 0,
        reachable: false,
        x0: 0.07250000000000001,
        y0: 0.7933333333333333,
        xLabel: 0.1625,
        yLabel: 0.8333333333333333,
        id: 'Orphaned',
        label: 'Orphaned',
        height: 0.08,
        width: 0.18000000000000002,
        reachableFromEnd: false
      }
    };
    let nodeData1 = cloneDeep(nodeData);

    let graphWidthUpperBound = sgls.getGraphWidth(
      AppConstants.MAX_NODES_PER_ROW, AppConstants.MAX_NODE_LABEL_LENGTH);
    let graphHeight = sgls.getGraphHeight(nodeData1);

    // Here, modifiedNodeData is nodeData with position values in pixels.
    // For ex, nodeData.State1.x0 = 0.07250000000000001 which is expressed
    // in fraction of graph width. It can be converted to pixels by multiplying
    // with graph width. So, modifiedNodeDate.State1.x0 = 0.07250000000000001 *
    // graphWidthUpperBound (630) = 47.675.
    let modifiedNodeData = sgls.modifyPositionValues(
      nodeData, graphWidthUpperBound, graphHeight);

    // Verifying the position values of State1.
    expect(modifiedNodeData.State1.x0).toEqual(nodeData.State1.x0);
    expect(modifiedNodeData.State1.y0).toEqual(nodeData.State1.y0);
    expect(modifiedNodeData.State1.xLabel).toEqual(nodeData.State1.xLabel);
    expect(modifiedNodeData.State1.yLabel).toEqual(nodeData.State1.yLabel);
    expect(modifiedNodeData.State1.width).toEqual(nodeData.State1.width);
    expect(modifiedNodeData.State1.height).toEqual(nodeData.State1.height);
  });
});
