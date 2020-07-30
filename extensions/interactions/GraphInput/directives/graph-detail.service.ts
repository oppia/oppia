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

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { GraphAnswer } from 'interactions/answer-defs';

export interface EdgeCentre {
  x: number;
  y: number;
}

@Injectable({
  providedIn: 'root'
})
export class GraphDetailService {
  VERTEX_RADIUS: number = 6;
  EDGE_WIDTH: number = 3;

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
    ret +=
      endX + ',' +
      endY + ' ';
    ret +=
      (endX - ARROW_HEIGHT * dx + ARROW_WIDTH * dy) + ',' +
      (endY - ARROW_HEIGHT * dy - ARROW_WIDTH * dx) + ' ';
    ret +=
      (endX - ARROW_HEIGHT * dx - ARROW_WIDTH * dy) + ',' +
      (endY - ARROW_HEIGHT * dy + ARROW_WIDTH * dx);
    return ret;
  }

  getEdgeCentre(graph: GraphAnswer, index: number): EdgeCentre {
    var edge = graph.edges[index];
    var srcVertex = graph.vertices[edge.src];
    var dstVertex = graph.vertices[edge.dst];
    return {
      x: (srcVertex.x + dstVertex.x) / 2.0,
      y: (srcVertex.y + dstVertex.y) / 2.0
    };
  }
}

angular.module('oppia').factory(
  'GraphDetailService', downgradeInjectable(GraphDetailService));
