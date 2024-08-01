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
 * @fileoverview Unit tests for DisplaySolutionModalComponent.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {StateCard} from 'domain/state_card/state-card.model';
import {HintsAndSolutionManagerService} from '../services/hints-and-solution-manager.service';
import {PlayerPositionService} from '../services/player-position.service';
import {PlayerTranscriptService} from '../services/player-transcript.service';
import {DisplaySolutionModalComponent} from './display-solution-modal.component';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {Interaction} from 'domain/exploration/InteractionObjectFactory';
import {AudioTranslationLanguageService} from '../services/audio-translation-language.service';
import {InteractionDisplayComponent} from 'components/interaction-display/interaction-display.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';

describe('Display Solution Modal', () => {
  let fixture: ComponentFixture<DisplaySolutionModalComponent>;
  let componentInstance: DisplaySolutionModalComponent;
  let playerTranscriptService: PlayerTranscriptService;
  let ngbActiveModal: NgbActiveModal;
  let contentId = 'content_id';
  let shortAnswerHtml: string = 'html';
  let solutionHtml: string = 'solution_html';

  class MockHintsAndSolutionManagerService {
    displaySolution(): object {
      return {
        explanation: {
          contentId: contentId,
          html: 'html',
        },
        getOppiaShortAnswerResponseHtml(): string {
          return shortAnswerHtml;
        },
        getOppiaSolutionExplanationResponseHtml(): string {
          return solutionHtml;
        },
      };
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        DisplaySolutionModalComponent,
        MockTranslatePipe,
        InteractionDisplayComponent,
      ],
      providers: [
        NgbActiveModal,
        {
          provide: HintsAndSolutionManagerService,
          useClass: MockHintsAndSolutionManagerService,
        },
        PlayerPositionService,
        PlayerTranscriptService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplaySolutionModalComponent);
    componentInstance = fixture.componentInstance;
    playerTranscriptService = TestBed.inject(PlayerTranscriptService);
    ngbActiveModal = TestBed.inject(NgbActiveModal);
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should intialize', () => {
    let contentId: string = 'content_id';
    let interaction = {} as Interaction;
    let audioTranslation = {} as AudioTranslationLanguageService;
    let displayedCard = new StateCard(
      'test_name',
      'content',
      'interaction',
      interaction,
      [],
      contentId,
      audioTranslation
    );
    spyOn(playerTranscriptService, 'getCard').and.returnValue(displayedCard);

    componentInstance.ngOnInit();

    expect(componentInstance.solutionContentId).toEqual(contentId);
    expect(componentInstance.displayedCard).toEqual(displayedCard);
    expect(componentInstance.interaction).toEqual(
      displayedCard.getInteraction()
    );
    expect(componentInstance.shortAnswerHtml).toEqual(shortAnswerHtml);
    expect(componentInstance.solutionExplanationHtml).toEqual(solutionHtml);
  });

  it('should close modal', () => {
    spyOn(ngbActiveModal, 'dismiss');
    componentInstance.closeModal();

    expect(ngbActiveModal.dismiss).toHaveBeenCalledWith('cancel');
  });
});
