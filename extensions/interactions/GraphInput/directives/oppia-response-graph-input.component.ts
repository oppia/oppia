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
 * @fileoverview Directive for the GraphInput response.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

require('domain/utilities/url-interpolation.service.ts');
require('interactions/GraphInput/directives/graph-detail.service.ts');
require('services/html-escaper.service.ts');

import 'interactions/interactions-extension.constants';
import {Component, Input} from '@angular/core';
import {GraphAnswer} from 'interactions/answer-defs';
import {HtmlEscaperService} from 'services/html-escaper.service';
import {EdgeCentre, GraphDetailService} from './graph-detail.service';
import {InteractionsExtensionsConstants} from 'interactions/interactions-extension.constants';
@Component({
  selector: 'oppia-response-graph-input',
  templateUrl: './graph-input-response.component.html',
  styleUrls: [],
})
export class ResponseGraphInput {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() answer!: string;
  graph!: GraphAnswer;
  VERTEX_RADIUS_PX!: number;
  EDGE_WIDTH_PX!: number;
  MIN_MARGIN_PX!: number;
  minX!: number;
  minY!: number;
  WIDTH: number = 250;
  HEIGHT: number = 250;

  GRAPH_INPUT_LEFT_MARGIN =
    InteractionsExtensionsConstants.GRAPH_INPUT_LEFT_MARGIN;

  constructor(
    private graphDetailService: GraphDetailService,
    private htmlEscaperService: HtmlEscaperService
  ) {}

  ngOnInit(): void {
    this.graph = this.htmlEscaperService.escapedJsonToObj(
      this.answer
    ) as GraphAnswer;
    this.VERTEX_RADIUS_PX = this.graphDetailService.VERTEX_RADIUS_PX;
    this.EDGE_WIDTH_PX = this.graphDetailService.EDGE_WIDTH_PX;

    this.MIN_MARGIN_PX = this.graphDetailService.getMinMargin(this.graph);
    this.minX = this.graphDetailService.getMinX(this.graph);
    this.minY = this.graphDetailService.getMinY(this.graph);

    this.reduceGraph();
  }

  removeWhiteSpace(): void {
    // The first vertex should be at (MIN_MARGIN_PX, MIN_MARGIN_PX).
    this.graph.vertices = this.graph.vertices.map(vertex => {
      return {
        x: vertex.x - this.minX + this.MIN_MARGIN_PX,
        y: vertex.y - this.minY + this.MIN_MARGIN_PX,
        label: vertex.label,
      };
    });
  }

  reduceGraph(): void {
    this.removeWhiteSpace();

    var scale = this.getScale();
    if (scale === 1) {
      return;
    }

    // If the scale is not 1, resize the graph with the scale factor.
    this.graph.vertices = this.graph.vertices.map(vertex => {
      return {
        x: vertex.x * scale,
        y: vertex.y * scale,
        label: vertex.label,
      };
    });
  }

  getMaxX(): number {
    return Math.max(...this.graph.vertices.map(vertex => vertex.x));
  }

  getMaxY(): number {
    return Math.max(...this.graph.vertices.map(vertex => vertex.y));
  }

  // This function calculates the scale factor required to fit the graph within the display area.
  getScale(): number {
    var scale = 1;

    var maxY = this.getMaxY();
    if (this.HEIGHT < maxY) {
      // Only apply the scale if the graph is larger than the display area.
      scale = this.HEIGHT / (maxY + this.MIN_MARGIN_PX);
    }

    var maxX = this.getMaxX();
    if (this.WIDTH < maxX) {
      // Only apply the scale if the graph is larger than the display area.
      var scaleX = this.WIDTH / (maxX + this.MIN_MARGIN_PX);
      if (scaleX < scale) {
        // If the graph is larger than the display area in both dimensions,
        // we need to scale it down uniformly by the smaller scale factor.
        scale = scaleX;
      }
    }

    return scale;
  }

  getDirectedEdgeArrowPoints(index: number): string {
    return this.graphDetailService.getDirectedEdgeArrowPoints(
      this.graph,
      index
    );
  }

  getEdgeCenter(index: number): EdgeCentre {
    return this.graphDetailService.getEdgeCentre(this.graph, index);
  }
}
