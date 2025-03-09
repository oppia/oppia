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
 * @fileoverview Component for the concept cards viewer.
 */

import {Component, Input, OnInit} from '@angular/core';
import {ConceptCardBackendApiService} from 'domain/skill/concept-card-backend-api.service';
import {ConceptCard} from 'domain/skill/concept-card.model';

@Component({
  selector: 'oppia-concept-card',
  templateUrl: './concept-card.component.html',
})
export class ConceptCardComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() skillIds!: string[];
  @Input() index!: number;
  currentConceptCard!: ConceptCard;
  loadingMessage!: string;
  skillDeletedMessage!: string;
  conceptsCards: ConceptCard[] = [];
  numberOfWorkedExamplesShown: number = 0;
  explanationIsShown: boolean = false;

  constructor(
    private conceptCardBackendApiService: ConceptCardBackendApiService
  ) {}

  ngOnInit(): void {
    this.loadingMessage = 'Loading';
    this.conceptCardBackendApiService.loadConceptCardsAsync(this.skillIds).then(
      conceptCardObjects => {
        conceptCardObjects.forEach(conceptCardObject => {
          this.conceptsCards.push(conceptCardObject);
        });
        this.loadingMessage = '';
        this.currentConceptCard = this.conceptsCards[this.index];
        this.numberOfWorkedExamplesShown = 0;
        if (this.currentConceptCard.getWorkedExamples().length > 0) {
          this.numberOfWorkedExamplesShown = 1;
        }
      },
      errorResponse => {
        this.loadingMessage = '';
        this.skillDeletedMessage =
          'Oops, it looks like this skill has' + ' been deleted.';
      }
    );
  }

  isLastWorkedExample(): boolean {
    return (
      this.numberOfWorkedExamplesShown ===
      this.currentConceptCard.getWorkedExamples().length
    );
  }

  showMoreWorkedExamples(): void {
    this.explanationIsShown = false;
    this.numberOfWorkedExamplesShown++;
  }
}
