// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for Graph Input rules.
 *
 * @author wxyxinyu@gmail.com (Xinyu Wu)
 */

ddescribe('Graph Input service', function() {
  beforeEach(module('oppia'));

  var girs = null;
  beforeEach(inject(function($injector) {
    girs = $injector.get('graphInputRulesService');
  }));

  var emptyGraph = function() {
    return {
      vertices: [],
      edges: [],
      isDirected: false,
      isWeighted: false,
      isLabeled: false
    };
  };

  var nullGraph = function(numVertices) {
    var graph = emptyGraph();
    for (var i = 0; i < numVertices; i++) {
      graph.vertices.push({
        label: '',
        x: 0.0,
        y: 0.0
      });
    }
    return graph;
  };

  var cycleGraph = function(numVertices) {
    var graph = nullGraph(numVertices);
    if (numVertices == 1) {
      return graph;
    }
    for (var i = 0; i < numVertices; i++) {
      graph.edges.push({
        src: i,
        dst: (i + 1) % numVertices,
        weight: 1
      });
    }
    return graph;
  };

  var completeGraph = function(numVertices) {
    var graph = nullGraph(numVertices);
    for (var i = 0; i < numVertices; i++) {
      for (var j = i + 1; j < numVertices; j++) {
        graph.edges.push({
            src: i,
            dst: j,
            weight: 1
        });
      }
    }
    return graph;
  };

  it('should have a correct \'is isomorphic to\' rule', function() {
    expect(girs.IsIsomorphicTo(emptyGraph(), {g: emptyGraph()})).toBe(true);
    expect(girs.IsIsomorphicTo(cycleGraph(5), {g: cycleGraph(5)})).toBe(true);
    expect(girs.IsIsomorphicTo(cycleGraph(5), {g: {
      vertices: [
        {label: '', x: 1.0, y: 1.0},
        {label: '', x: 1.0, y: 1.0},
        {label: '', x: 1.0, y: 1.0},
        {label: '', x: 1.0, y: 1.0},
        {label: '', x: 1.0, y: 1.0}
      ],
      edges: [
        {src: 0, dst: 2, weight: 1},
        {src: 2, dst: 4, weight: 1},
        {src: 4, dst: 1, weight: 1},
        {src: 1, dst: 3, weight: 1},
        {src: 3, dst: 0, weight: 1}
      ],
      isDirected: false,
      isWeighted: false,
      isLabeled: false
    }})).toBe(true);
    expect(girs.IsIsomorphicTo({
      vertices: [
        {label: 'a', x: 1.0, y: 1.0},
        {label: 'b', x: 2.0, y: 2.0},
        {label: 'c', x: 3.0, y: 3.0}
      ],
      edges: [
        {src: 0, dst: 1, weight: 1},
      ],
      isDirected: false,
      isWeighted: false,
      isLabeled: true
    }, {g: {
      vertices: [
          {label: 'c', x: 1.0, y: 1.0},
          {label: 'a', x: 2.0, y: 2.0},
          {label: 'b', x: 3.0, y: 3.0}
      ],
      edges: [
          {src: 2, dst: 1, weight: 1},
      ],
      isDirected: false,
      isWeighted: false,
      isLabeled: true
    }})).toBe(true);
    expect(girs.IsIsomorphicTo({
      vertices: [
        {label: 'a', x: 1.0, y: 1.0},
        {label: 'b', x: 2.0, y: 2.0},
        {label: 'c', x: 3.0, y: 3.0}
      ],
      edges: [
        {src: 0, dst: 1, weight: 2},
        {src: 1, dst: 2, weight: 1}
      ],
      isDirected: false,
      isWeighted: true,
      isLabeled: true
    }, {g: {
      vertices: [
          {label: 'b', x: 1.0, y: 1.0},
          {label: 'a', x: 2.0, y: 2.0},
          {label: 'c', x: 3.0, y: 3.0}
      ],
      edges: [
          {src: 2, dst: 0, weight: 1},
          {src: 1, dst: 0, weight: 2}
      ],
      isDirected: false,
      isWeighted: true,
      isLabeled: true
    }})).toBe(true);
    expect(girs.IsIsomorphicTo({
      vertices: [
        {label: '', x: 1.0, y: 1.0},
        {label: '', x: 2.0, y: 2.0}
      ],
      edges: [
        {src: 0, dst: 1, weight: 1}
      ],
      isDirected: false,
      isWeighted: false,
      isLabeled: false
    }, {g: {
      vertices: [
          {label: '', x: 1.0, y: 1.0},
          {label: '', x: 2.0, y: 2.0}
      ],
      edges: [
          {src: 0, dst: 1, weight: 1},
          {src: 1, dst: 0, weight: 1}
      ],
      isDirected: true,
      isWeighted: false,
      isLabeled: false
    }})).toBe(true);

    expect(girs.IsIsomorphicTo(cycleGraph(5), {g: nullGraph(5)})).toBe(false);
    expect(girs.IsIsomorphicTo(nullGraph(5), {g: cycleGraph(5)})).toBe(false);
    expect(girs.IsIsomorphicTo(nullGraph(5), {g: nullGraph(6)})).toBe(false);
    expect(girs.IsIsomorphicTo(
      completeGraph(5), {g: cycleGraph(5)})).toBe(false);
    expect(girs.IsIsomorphicTo(
      cycleGraph(5), {g: completeGraph(5)})).toBe(false);
    expect(girs.IsIsomorphicTo({
      vertices: [
        {label: 'a', x: 1.0, y: 1.0},
        {label: 'b', x: 2.0, y: 2.0},
        {label: 'c', x: 3.0, y: 3.0}
      ],
      edges: [
        {src: 0, dst: 1, weight: 2},
        {src: 1, dst: 2, weight: 2}
      ],
      isDirected: false,
      isWeighted: true,
      isLabeled: true
    }, {g: {
      vertices: [
          {label: 'b', x: 1.0, y: 1.0},
          {label: 'a', x: 2.0, y: 2.0},
          {label: 'c', x: 3.0, y: 3.0}
      ],
      edges: [
          {src: 0, dst: 1, weight: 1},
          {src: 0, dst: 2, weight: 2}
      ],
      isDirected: false,
      isWeighted: true,
      isLabeled: true
    }})).toBe(false);
    expect(girs.IsIsomorphicTo({
      vertices: [
        {label: '', x: 1.0, y: 1.0},
        {label: '', x: 2.0, y: 2.0}
      ],
      edges: [
        {src: 0, dst: 1, weight: 1}
      ],
      isDirected: false,
      isWeighted: true,
      isLabeled: false
    }, {g: {
      vertices: [
          {label: '', x: 1.0, y: 1.0},
          {label: '', x: 2.0, y: 2.0}
      ],
      edges: [
          {src: 0, dst: 1, weight: 2}
      ],
      isDirected: false,
      isWeighted: true,
      isLabeled: false
    }})).toBe(false);
    expect(girs.IsIsomorphicTo({
      vertices: [
        {label: 'a', x: 1.0, y: 1.0},
        {label: 'b', x: 2.0, y: 2.0}
      ],
      edges: [
        {src: 0, dst: 1, weight: 2}
      ],
      isDirected: false,
      isWeighted: true,
      isLabeled: true
    }, {g: {
      vertices: [
          {label: 'a', x: 1.0, y: 1.0},
          {label: 'c', x: 2.0, y: 2.0}
      ],
      edges: [
          {src: 0, dst: 1, weight: 2},
      ],
      isDirected: false,
      isWeighted: true,
      isLabeled: true
    }})).toBe(false);
  });
});
