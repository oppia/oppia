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
import { Component, Input } from '@angular/core';
import { GraphAnswer } from 'interactions/answer-defs';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { EdgeCentre, GraphDetailService } from './graph-detail.service';
import { InteractionsExtensionsConstants } from 'interactions/interactions-extension.constants';
import { downgradeComponent } from '@angular/upgrade/static';
@Component({
  selector: 'oppia-response-graph-input',
  templateUrl: './graph-input-response.component.html',
  styleUrls: []
})
export class ResponseGraphInput {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() answer!: string;
  graph!: GraphAnswer;
  VERTEX_RADIUS!: number;
  EDGE_WIDTH!: number;
  GRAPH_INPUT_LEFT_MARGIN = (
    InteractionsExtensionsConstants.GRAPH_INPUT_LEFT_MARGIN);

  constructor(
    private graphDetailService: GraphDetailService,
    private htmlEscaperService: HtmlEscaperService,
  ) {}

  ngOnInit(): void {
    this.graph = (
      this.htmlEscaperService.escapedJsonToObj(this.answer) as GraphAnswer);
    this.VERTEX_RADIUS = this.graphDetailService.VERTEX_RADIUS;
    this.EDGE_WIDTH = this.graphDetailService.EDGE_WIDTH;
  }

  getDirectedEdgeArrowPoints(index: number): string {
    return this.graphDetailService.getDirectedEdgeArrowPoints(
      this.graph, index
    );
  }

  getEdgeCenter(index: number): EdgeCentre {
    return this.graphDetailService.getEdgeCentre(this.graph, index);
  }
}
angular.module('oppia').directive(
  'oppiaResponseGraphInput', downgradeComponent(
    {component: ResponseGraphInput}) as angular.IDirectiveFactory);
