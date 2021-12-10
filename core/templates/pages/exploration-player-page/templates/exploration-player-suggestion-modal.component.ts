// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controller for exploration player suggestion modal.
 */

import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ExplorationEngineService } from '../services/exploration-engine.service';
import { PlayerPositionService } from '../services/player-position.service';
import { PlayerTranscriptService } from '../services/player-transcript.service';
import { StateCard } from 'domain/state_card/state-card.model';

@Component({
  selector: 'exploration-player-suggestion-modal',
  templateUrl: './exploration-player-suggestion-modal.component.html',
})
export class ExplorationPlayerSuggestionModalComponent implements OnInit {
  description: string = '';
  displayedCard: StateCard;
  originalHtml: string;
  showEditor: boolean = false;
  stateName: string;
  suggestionData: {
    suggestionHtml: string;
  };

  constructor(
      private ngbActiveModal: NgbActiveModal,
      private explorationEngineService: ExplorationEngineService,
      private playerPositionService: PlayerPositionService,
      private playerTranscriptService: PlayerTranscriptService
  ) {}

  ngOnInit(): void {
    this.stateName = this.playerPositionService.getCurrentStateName();
    this.displayedCard = this.playerTranscriptService.getCard(
      this.playerPositionService.getDisplayedCardIndex());
    this.originalHtml = this.displayedCard.getContentHtml();
    this.suggestionData = {
      suggestionHtml: this.originalHtml,
    };
    setTimeout(() => {
      this.showEditor = true;
    }, 500);
  }

  cancelSuggestion(): void {
    this.ngbActiveModal.dismiss('cancel');
  }

  updateValue(value: string): void {
    this.suggestionData.suggestionHtml = value;
  }

  submitSuggestion(): void {
    var data = {
      target_id: this.explorationEngineService.getExplorationId(),
      version: this.explorationEngineService.getExplorationVersion(),
      stateName: this.stateName,
      suggestion_type: 'edit_exploration_state_content',
      target_type: 'exploration',
      description: this.description,
      suggestionHtml: this.suggestionData.suggestionHtml,
    };
    this.ngbActiveModal.close(data);
  }
}
