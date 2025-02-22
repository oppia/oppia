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
 * @fileoverview Detail service for the interaction.
 */

import {Injectable} from '@angular/core';

import {GraphAnswer} from 'interactions/answer-defs';

export interface EdgeCentre {
  x: number;
  y: number;
}

@Injectable({
  providedIn: 'root',
})
export class GraphDetailService {
  VERTEX_RADIUS_PX: number = 6;
  EDGE_WIDTH_PX: number = 3;

  // The minimum margin to the left and top of the display.
  // The first vertex should be at (MIN_MARGIN_PX, MIN_MARGIN_PX).
  // This value should not be 0 because only half of the vertex will be shown.
  MIN_MARGIN_PX: number = 10;

  getMinMargin(graph: GraphAnswer): number {
    if (!graph.isLabeled) {
      return this.MIN_MARGIN_PX;
    }
    // If the graph is labeled, the label's size should be taken into account
    // because in Arabic, the labels will be shown on the left side of the vertex.
    return Math.max(
      ...graph.vertices.map(
        vertex => vertex.label.length * (this.MIN_MARGIN_PX / 2)
      )
    );
  }

  getMinX(graph: GraphAnswer): number {
    return Math.min(...graph.vertices.map(vertex => vertex.x));
  }

  getMinY(graph: GraphAnswer): number {
    return Math.min(...graph.vertices.map(vertex => vertex.y));
  }

  getDirectedEdgeArrowPoints(graph: GraphAnswer, index: number): string {
    var ARROW_WIDTH = 5;
    var ARROW_HEIGHT = 10;

    var edge = graph.edges[index];
    var srcVertex = graph.vertices[edge.src];
    var dstVertex = graph.vertices[edge.dst];
    var dx = dstVertex.x - srcVertex.x;
    var dy = dstVertex.y - srcVertex.y;
    var length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) {
      return '';
    }
    dx /= length;
    dy /= length;

    var endX = dstVertex.x - 4 * dx;
    var endY = dstVertex.y - 4 * dy;

    var ret = '';
    ret += endX + ',' + endY + ' ';
    ret +=
      endX -
      ARROW_HEIGHT * dx +
      ARROW_WIDTH * dy +
      ',' +
      (endY - ARROW_HEIGHT * dy - ARROW_WIDTH * dx) +
      ' ';
    ret +=
      endX -
      ARROW_HEIGHT * dx -
      ARROW_WIDTH * dy +
      ',' +
      (endY - ARROW_HEIGHT * dy + ARROW_WIDTH * dx);
    return ret;
  }

  getEdgeCentre(graph: GraphAnswer, index: number): EdgeCentre {
    var edge = graph.edges[index];
    var srcVertex = graph.vertices[edge.src];
    var dstVertex = graph.vertices[edge.dst];
    return {
      x: (srcVertex.x + dstVertex.x) / 2.0,
      y: (srcVertex.y + dstVertex.y) / 2.0,
    };
  }
}
