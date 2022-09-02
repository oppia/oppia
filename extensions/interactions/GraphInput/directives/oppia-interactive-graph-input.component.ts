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
 * @fileoverview Directive for the GraphInput interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { GraphAnswer } from 'interactions/answer-defs';
import { GraphInputCustomizationArgs } from 'interactions/customization-args-defs';
import { InteractionAttributesExtractorService } from 'interactions/interaction-attributes-extractor.service';
import cloneDeep from 'lodash/cloneDeep';
import { CurrentInteractionService } from 'pages/exploration-player-page/services/current-interaction.service';
import { PlayerPositionService } from 'pages/exploration-player-page/services/player-position.service';
import { Subscription } from 'rxjs';
import { GraphInputRulesService } from './graph-input-rules.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';

@Component({
  selector: 'oppia-interactive-graph-input',
  templateUrl: './graph-input-interaction.component.html',
  styleUrls: []
})
export class InteractiveGraphInput implements OnInit, OnDestroy {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() graphWithValue!: string;
  @Input() canAddVertexWithValue!: string;
  @Input() canDeleteVertexWithValue!: string;
  @Input() canMoveVertexWithValue!: string;
  @Input() canEditVertexLabelWithValue!: string;
  @Input() canAddEdgeWithValue!: string;
  @Input() canDeleteEdgeWithValue!: string;
  @Input() canEditEdgeWeightWithValue!: string;
  // Last answer is null if graph is submitted for the first time.
  @Input() lastAnswer!: GraphAnswer | null;

  graph!: GraphAnswer;
  canAddVertex: boolean = false;
  canDeleteVertex: boolean = false;
  canMoveVertex: boolean = true;
  canEditVertexLabel: boolean = false;
  canAddEdge: boolean = true;
  canDeleteEdge: boolean = true;
  canEditEdgeWeight: boolean = false;

  componentSubscriptions = new Subscription();
  interactionIsActive: boolean = false;
  errorMessage: string = '';

  constructor(
    private currentInteractionService: CurrentInteractionService,
    private graphInputRulesService: GraphInputRulesService,
    private interactionAttributesExtractorService:
      InteractionAttributesExtractorService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private playerPositionService: PlayerPositionService
  ) {}

  ngOnInit(): void {
    this.componentSubscriptions.add(
      this.playerPositionService.onNewCardAvailable.subscribe(
        () => {
          this.interactionIsActive = false;
          this.canAddVertex = false;
          this.canDeleteVertex = false;
          this.canEditVertexLabel = false;
          this.canMoveVertex = false;
          this.canAddEdge = false;
          this.canDeleteEdge = false;
          this.canEditEdgeWeight = false;
        }
      )
    );

    this.errorMessage = '';
    this.graph = {
      vertices: [],
      edges: [],
      isDirected: false,
      isWeighted: false,
      isLabeled: false
    };
    this.interactionIsActive = this.lastAnswer === null;

    this.currentInteractionService.registerCurrentInteraction(
      () => this.submitGraph(), () => this.validityCheckFn());

    if (!this.interactionIsActive && this.lastAnswer !== null) {
      this.graph = this.lastAnswer;
    } else {
      this.resetGraph();
    }
    const {
      canAddVertex,
      canDeleteVertex,
      canEditVertexLabel,
      canMoveVertex,
      canAddEdge,
      canDeleteEdge,
      canEditEdgeWeight
    } = this.interactionAttributesExtractorService.getValuesFromAttributes(
      'GraphInput',
      this._getAttrs()
    ) as GraphInputCustomizationArgs;
    this.canAddVertex = this.interactionIsActive ? canAddVertex.value : false;
    this.canDeleteVertex = this.interactionIsActive ?
      canDeleteVertex.value : false;
    this.canEditVertexLabel = this.interactionIsActive ?
      canEditVertexLabel.value : false;
    this.canMoveVertex = this.interactionIsActive ?
      canMoveVertex.value : false;
    this.canAddEdge = this.interactionIsActive ?
      canAddEdge.value : false;
    this.canDeleteEdge = this.interactionIsActive ?
      canDeleteEdge.value : false;
    this.canEditEdgeWeight = this.interactionIsActive ?
      canEditEdgeWeight.value : false;
  }

  private _getAttrs() {
    return {
      graphWithValue: this.graphWithValue,
      canAddVertexWithValue: this.canAddVertexWithValue,
      canDeleteVertexWithValue: this.canDeleteVertexWithValue,
      canMoveVertexWithValue: this.canMoveVertexWithValue,
      canEditVertexLabelWithValue: this.canEditVertexLabelWithValue,
      canAddEdgeWithValue: this.canAddEdgeWithValue,
      canDeleteEdgeWithValue: this.canDeleteEdgeWithValue,
      canEditEdgeWeightWithValue: this.canEditEdgeWeightWithValue
    };
  }

  submitGraph(): void {
    this.currentInteractionService.onSubmit(
      cloneDeep<GraphAnswer>(this.graph), this.graphInputRulesService);
  }

  isLanguageRTL(): boolean {
    return this.i18nLanguageCodeService.isCurrentLanguageRTL();
  }

  resetGraph(): void {
    const {
      graph
    } = this.interactionAttributesExtractorService.getValuesFromAttributes(
      'GraphInput',
      this._getAttrs()
    ) as GraphInputCustomizationArgs;
    let parsedGraph = graph.value;
    if (this.checkValidGraph(parsedGraph)) {
      this.graph = parsedGraph;
    } else {
      this.errorMessage = 'I18N_INTERACTIONS_GRAPH_ERROR_INVALID';
    }
  }

  // TODO(#12104): Write this function.
  checkValidGraph(graph: GraphAnswer): boolean {
    return Boolean(graph);
  }

  validityCheckFn(): boolean {
    return this.checkValidGraph(this.graph);
  }

  ngOnDestroy(): void {
    this.componentSubscriptions.unsubscribe();
  }
}
angular.module('oppia').directive(
  'oppiaInteractiveGraphInput', downgradeComponent({
    component: InteractiveGraphInput
  }) as angular.IDirectiveFactory);
