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

import { GraphLink, GraphNodes } from 'services/compute-graph.service';
import { StateGraphLayoutService } from './graph-layout.service';

fdescribe('Graph Layout Service', () => {
  let sgls: StateGraphLayoutService = null;
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

  it('should get correct indentation level', () => {
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
      'State1': ['State2','State3'],
      'State2': ['State3','State6'],
      'State6': ['State3','State8'],
      'State8': ['State3','State7'],
      'State7': ['State3','State9'],
      'State9': ['State3','State10'],
      'State10': ['State3'],
      'State3': ['State5'],
      'State5':[]
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

  it('should return correct augmented links with bezier curve', () => {
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

    let expectedAugmentedLinks = [
      {
        source: {
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
        target: {
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
        }
      },
      {
        source: {
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
        target: {
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
        d: 'M0.1625 0.31333333333333335 Q 0.2025 0.3666666666666667 0.1625 0.42'
      },
      {
        source: {
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
        target: {
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
        d: 'M0.23 0.31333333333333335 Q 0.30557165934031566' +
          ' 0.3408718290982754 0.32 0.42'
      },
      {
        source: {
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
        target: {
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
        },
        d: 'M0.1625 0.5800000000000001 Q 0.2025 0.6333333333333333' +
          ' 0.1625 0.6866666666666665'
      },
      {
        source: {
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
        target: {
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
        },
        d: 'M0.32 0.5800000000000001 Q 0.30557165934031566' +
          ' 0.6591281709017246 0.23000000000000004 0.6866666666666665'
      }
    ];

    let returnedAugmentedLinks = sgls.getAugmentedLinks(nodeData, links2);
    for (var i = 0; i < returnedAugmentedLinks.length; i++) {
      expect(returnedAugmentedLinks[i].d).toBe(expectedAugmentedLinks[i].d);
    }
  });

  it('should return undefined when source and target nodes overlap' +
    ' while processing augmented links', () => {
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

    expect(sgls.getAugmentedLinks(nodeData, links2)).toBeUndefined();
  });

  it('should get correct graph width and height ', () => {
    let nodeData = {
      State1: {
        depth: 1,
        offset: 0,
        reachable: true,
        x0: 0.07250000000000001,
        y0: 0.42000000000000004,
        xLabel: 0.1625,
        yLabel: 0.5,
        id: "State1",
        label: "State1",
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
        id: "Introduction",
        label: "Introduction",
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
        id: "End",
        label: "End",
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
        id: "State2",
        label: "State2",
        height: 0.16,
        width: 0.18000000000000002,
        reachableFromEnd: false
      }
    };

    let graphWidthUpperBound = sgls.getGraphWidth(
      AppConstants.MAX_NODES_PER_ROW, AppConstants.MAX_NODE_LABEL_LENGTH);
    let graphHeight = sgls.getGraphHeight(nodeData);

    expect(graphWidthUpperBound).toBe(630);
    expect(graphHeight).toBe(210);
  });

  it('should get graph width and height when nodes' +
    ' overflow to next row', () => {
    let graphWidth = sgls.getGraphWidth(
      AppConstants.MAX_NODES_PER_ROW, AppConstants.MAX_NODE_LABEL_LENGTH);
    let graphHeight = sgls.getGraphHeight(nodeData1);

    expect(graphWidth).toBe(630);
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

    for(let i = 1; i <= MAX_NODES_PER_ROW+1; i++) {
      let stateName = 'State' + (i+1);
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
    for(let nodeId in nodes) {
      if(returnedLayoutNodeData[nodeId].depth === 1) {
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
        'source':'State5',
        'target':'End'
      },
      {
        'source':'State4',
        'target':'End'
      },
      {
        'source':'State3',
        'target':'End'
      },
      {
        'source':'State2',
        'target':'End'
      },
      {
        'source':'State1',
        'target':'End'
      },
      {
        'source':'State0',
        'target':'State1'
      },
      {
        'source':'State0',
        'target':'State2'
      },
      {
        'source':'State0',
        'target':'State3'
      },
      {
        'source':'State0',
        'target':'State4'
      },
      {
        'source':'State0',
        'target':'State5'
      },
      {
        'source':'State0',
        'target':'State0'
      }
    ];
    let initNodeId = 'State0';
    let finalNodeIds = ['End'];

    let returnedLayout = sgls.computeLayout(
      nodes, links, initNodeId, finalNodeIds);

    expect(returnedLayout['End'].depth).toBe(3);
    expect(returnedLayout['Orphan'].depth).toBe(4);
  })

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

    expect(sgls.getLastComputedArrangement()).toBe(computedLayout);
  });

  it('should return graph boundaries with width less than equal to' +
    ' maximum allowed graph width', () => {
    let nodeData = {
      State5: {
        depth: 2,
        offset: 1,
        reachable: true,
        x0: 0.29750000000000004,
        y0: 0.54,
        xLabel: 0.3875,
        yLabel: 0.6,
        id: "State5",
        label: "State5",
        height: 0.12,
        width: 0.18000000000000002,
        reachableFromEnd: false
      },
      State4: {
        depth: 1,
        offset: 3,
        reachable: true,
        x0: 0.7475,
        y0: 0.33999999999999997,
        xLabel: 0.8375,
        yLabel: 0.4,
        id: "State4",
        label: "State4",
        height: 0.12,
        width: 0.18000000000000002,
        reachableFromEnd: false
      },
      State3: {
        depth: 1,
        offset: 2,
        reachable: true,
        x0: 0.5225000000000001,
        y0: 0.33999999999999997,
        xLabel: 0.6125,
        yLabel: 0.4,
        id: "State3",
        label: "State3",
        height: 0.12,
        width: 0.18000000000000002,
        reachableFromEnd: false
      },
      State2: {
        depth: 1,
        offset: 1,
        reachable: true,
        x0: 0.29750000000000004,
        y0: 0.33999999999999997,
        xLabel: 0.3875,
        yLabel: 0.4,
        id: "State2",
        label: "State2",
        height: 0.12,
        width: 0.18000000000000002,
        reachableFromEnd: false
      },
      State1: {
        depth: 1,
        offset: 0,
        reachable: true,
        x0: 0.07250000000000001,
        y0: 0.33999999999999997,
        xLabel: 0.1625,
        yLabel: 0.4,
        id: "State1",
        label: "State1",
        height: 0.12,
        width: 0.18000000000000002,
        reachableFromEnd: false
      },
      Introduction: {
        depth: 0,
        offset: 0,
        reachable: true,
        x0: 0.07250000000000001,
        y0: 0.14,
        xLabel: 0.1625,
        yLabel: 0.2,
        id: "Introduction",
        label: "Introduction",
        height: 0.12,
        width: 0.18000000000000002,
        reachableFromEnd: false
      },
      End: {
        depth: 3,
        offset: 0,
        reachable: true,
        x0: 0.07250000000000001,
        y0: 0.7400000000000001,
        xLabel: 0.1625,
        yLabel: 0.8,
        id: "End",
        label: "End",
        height: 0.12,
        width: 0.18000000000000002,
        reachableFromEnd: false
      }
    };
    let expectedGraphBoundaries = {
      'bottom': 245.8,
      'left': 40.675000000000004,
      'right': 589.325,
      'top': 34.2
    };

    let expectedWidth = expectedGraphBoundaries.bottom +
      expectedGraphBoundaries.top;

    expect(expectedWidth).toBeLessThanOrEqual(sgls.getGraphWidth(
      AppConstants.MAX_NODES_PER_ROW, AppConstants.MAX_NODE_LABEL_LENGTH));
    expect(sgls.getGraphBoundaries(nodeData)).toEqual(expectedGraphBoundaries);
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
      id: "State1",
      label: "State1",
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
      id: "Introduction",
      label: "Introduction",
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
      id: "End",
      label: "End",
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
      id: "State2",
      label: "State2",
      height: 0.16,
      width: 0.18000000000000002,
      reachableFromEnd: false
    }
  };
  let expectedGraphBoundaries = {
    bottom: 182.79999999999998,
    left: 40.675000000000004,
    right: 305.82500000000005,
    top: 27.200000000000003
  };

  let expectedHeight = expectedGraphBoundaries.bottom +
    expectedGraphBoundaries.top;

  expect(expectedHeight).toBeLessThanOrEqual(sgls.getGraphHeight(nodeData));
  expect(sgls.getGraphBoundaries(nodeData)).toEqual(expectedGraphBoundaries);
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
    let modifiedNodeDta = {
      State1: {
        depth: 0,
        offset: 0,
        reachable: true,
        x0: 0.07250000000000001,
        y0: 0.25333333333333335,
        xLabel: 0.1625,
        yLabel: 0.33333333333333337,
        id: 'State1',
        label: 'State1',
        height: 0.16,
        width: 0.18000000000000002,
        reachableFromEnd: true
      },
      State2: {
        depth: 1,
        offset: 1.5,
        reachable: true,
        x0: 0.41000000000000003,
        y0: 0.52,
        xLabel: 0.5,
        yLabel: 0.6000000000000001,
        id: 'State2',
        label: 'State2',
        height: 0.16,
        width: 0.18000000000000002,
        reachableFromEnd: true
      },
      State3: {
        depth: 1,
        offset: 2.5,
        reachable: true,
        x0: 0.6350000000000001,
        y0: 0.52,
        xLabel: 0.7250000000000001,
        yLabel: 0.6000000000000001,
        id: 'State3',
        label: 'State3',
        height: 0.16,
        width: 0.18000000000000002,
        reachableFromEnd: true
      },
      State4: {
        depth: 4,
        offset: 0,
        reachable: true,
        x0: 0.07250000000000001,
        y0: 1.32,
        xLabel: 0.1625,
        yLabel: 1.4,
        id: 'State4',
        label: 'State4',
        height: 0.16,
        width: 0.18000000000000002,
        reachableFromEnd: true
      },
      State5: {
        depth: 1,
        offset: 3.5,
        reachable: true,
        x0: 0.8600000000000001,
        y0: 0.52,
        xLabel: 0.9500000000000001,
        yLabel: 0.6000000000000001,
        id: 'State5',
        label: 'State5',
        height: 0.16,
        width: 0.18000000000000002,
        reachableFromEnd: false
      },
      State6: {
        depth: 2,
        offset: 1.5,
        reachable: true,
        x0: 0.41000000000000003,
        y0: 0.7866666666666666,
        xLabel: 0.5,
        yLabel: 0.8666666666666667,
        id: 'State6',
        label: 'State6',
        height: 0.16,
        width: 0.18000000000000002,
        reachableFromEnd: false
      },
      State7: {
        depth: 2,
        offset: 2.5,
        reachable: true,
        x0: 0.6350000000000001,
        y0: 0.7866666666666666,
        xLabel: 0.7250000000000001,
        yLabel: 0.8666666666666667,
        id: 'State7',
        label: 'State7',
        height: 0.16,
        width: 0.18000000000000002,
        reachableFromEnd: false
      },
      State8: {
        depth: 3,
        offset: 0,
        reachable: true,
        x0: 0.07250000000000001,
        y0: 1.0533333333333335,
        xLabel: 0.1625,
        yLabel: 1.1333333333333333,
        id: 'State8',
        label: 'State8',
        height: 0.16,
        width: 0.18000000000000002,
        reachableFromEnd: true
      },
      State9: {
        depth: 1,
        offset: 0.5,
        reachable: true,
        x0: 0.185,
        y0: 0.52,
        xLabel: 0.275,
        yLabel: 0.6000000000000001,
        id: 'State9',
        label: 'State9',
        height: 0.16,
        width: 0.18000000000000002,
        reachableFromEnd: true
      },
      Orphaned: {
        depth: 5,
        offset: 0,
        reachable: false,
        x0: 0.07250000000000001,
        y0: 1.5866666666666667,
        xLabel: 0.1625,
        yLabel: 1.6666666666666665,
        id: 'Orphaned',
        label: 'Orphaned',
        height: 0.16,
        width: 0.18000000000000002,
        reachableFromEnd: false
      }
    };

    let graphWidth = sgls.getGraphWidth(
      AppConstants.MAX_NODES_PER_ROW, AppConstants.MAX_NODE_LABEL_LENGTH);
    let graphHeight = sgls.getGraphHeight(nodeData);

    let expectedNodeData = sgls.modifyPositionValues(
      nodeData, graphWidth, graphHeight);

    expect(expectedNodeData['State1'].x0).toEqual(
      expectedNodeData['State1'].x0 * graphWidth);
    expect(expectedNodeData['State1'].width).toEqual(
      expectedNodeData['State1'].width * graphWidth);
    expect(expectedNodeData['State1'].xLabel).toEqual(
      expectedNodeData['State1'].xLabel * graphWidth);

    expect(expectedNodeData['State1'].y0).toEqual(
      expectedNodeData['State1'].y0 * graphHeight);
    expect(expectedNodeData['State1'].height).toEqual(
      expectedNodeData['State1'].height * graphWidth);
    expect(expectedNodeData['State1'].yLabel).toEqual(
      expectedNodeData['State1'].yLabel * graphWidth);

    expect(expectedNodeData).not.toEqual(nodeData1);
    expect(expectedNodeData).toEqual(modifiedNodeDta);
  });
});
