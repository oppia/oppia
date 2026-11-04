// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for card interaction controls component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {TranslateModule} from '@ngx-translate/core';
import {StateCard} from 'domain/state_card/state-card.model';
import {Interaction} from 'domain/exploration/interaction.model';
import {UrlService} from 'services/contextual/url.service';
import {PageContextService} from 'services/page-context.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {SchemaFormSubmittedService} from 'services/schema-form-submitted.service';
import {ConversationFlowService} from 'pages/exploration-player-page/services/conversation-flow.service';
import {ExplorationModeService} from '../../services/exploration-mode.service';
import {
  HelpCardEventResponse,
  PlayerPositionService,
} from '../../services/player-position.service';
import {ContentTranslationManagerService} from '../../services/content-translation-manager.service';
import {CardInteractionControlsComponent} from './card-interaction-controls.component';
import {ContinueCustomizationArgs} from 'interactions/customization-args-defs';
import {SubtitledUnicode} from 'domain/exploration/subtitled-unicode.model.ts';

describe('Card interaction controls component', () => {
  let fixture: ComponentFixture<CardInteractionControlsComponent>;
  let componentInstance: CardInteractionControlsComponent;
  let playerPositionService: PlayerPositionService;
  let explorationModeService: ExplorationModeService;
  let focusManagerService: FocusManagerService;
  let pageContextService: PageContextService;
  let schemaFormSubmittedService: SchemaFormSubmittedService;
  let contentTranslationManagerService: ContentTranslationManagerService;
  let conversationFlowService: ConversationFlowService;

  let mockDisplayedCard = new StateCard('', '', '', {} as Interaction, [], '');
  let mockDisplayedCard2 = new StateCard(
    'state',
    'name',
    'html',
    {} as Interaction,
    [],
    ''
  );

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, TranslateModule.forRoot()],
      declarations: [CardInteractionControlsComponent],
      providers: [
        ExplorationModeService,
        FocusManagerService,
        PlayerPositionService,
        UrlService,
        PageContextService,
        ConversationFlowService,
        SchemaFormSubmittedService,
        ContentTranslationManagerService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardInteractionControlsComponent);
    componentInstance = fixture.componentInstance;
    playerPositionService = TestBed.inject(PlayerPositionService);
    explorationModeService = TestBed.inject(ExplorationModeService);
    focusManagerService = TestBed.inject(FocusManagerService);
    pageContextService = TestBed.inject(PageContextService);
    schemaFormSubmittedService = TestBed.inject(SchemaFormSubmittedService);
    contentTranslationManagerService = TestBed.inject(
      ContentTranslationManagerService
    );
    conversationFlowService = TestBed.inject(ConversationFlowService);
  });

  afterEach(() => {
    componentInstance.ngOnDestroy();
  });

  it('should initialize and show the skip button in the diagnostic test player', fakeAsync(() => {
    let mockOnHelpCardAvailableEventEmitter =
      new EventEmitter<HelpCardEventResponse>();
    let mockSchemaFormSubmittedEventEmitter = new EventEmitter<void>();

    spyOn(pageContextService, 'isInDiagnosticTestPlayerPage').and.returnValue(
      true
    );
    spyOn(componentInstance.submit, 'emit');
    spyOnProperty(playerPositionService, 'onHelpCardAvailable').and.returnValue(
      mockOnHelpCardAvailableEventEmitter
    );
    spyOnProperty(
      schemaFormSubmittedService,
      'onSubmittedSchemaBasedForm'
    ).and.returnValue(mockSchemaFormSubmittedEventEmitter);
    spyOnProperty(
      contentTranslationManagerService,
      'onStateCardContentUpdate'
    ).and.returnValue(new EventEmitter<void>());

    componentInstance.ngOnInit();
    mockOnHelpCardAvailableEventEmitter.emit({
      hasContinueButton: true,
    } as HelpCardEventResponse);
    mockSchemaFormSubmittedEventEmitter.emit();
    tick();

    expect(componentInstance.skipButtonIsShown).toBe(true);
    expect(componentInstance.helpCardHasContinueButton).toBe(true);
    expect(componentInstance.submit.emit).toHaveBeenCalled();
  }));

  it('should not show the skip button outside the diagnostic test player', fakeAsync(() => {
    spyOn(pageContextService, 'isInDiagnosticTestPlayerPage').and.returnValue(
      false
    );
    spyOnProperty(playerPositionService, 'onHelpCardAvailable').and.returnValue(
      new EventEmitter<HelpCardEventResponse>()
    );
    spyOnProperty(
      schemaFormSubmittedService,
      'onSubmittedSchemaBasedForm'
    ).and.returnValue(new EventEmitter<void>());
    spyOnProperty(
      contentTranslationManagerService,
      'onStateCardContentUpdate'
    ).and.returnValue(new EventEmitter<void>());

    componentInstance.ngOnInit();
    tick();

    expect(componentInstance.skipButtonIsShown).toBe(false);
  }));

  it('should call updateDisplayedCardInfo on state card content update', fakeAsync(() => {
    let mockOnStateCardContentUpdate = new EventEmitter<void>();

    spyOn(pageContextService, 'isInDiagnosticTestPlayerPage').and.returnValue(
      false
    );
    spyOn(componentInstance, 'updateDisplayedCardInfo');
    spyOnProperty(playerPositionService, 'onHelpCardAvailable').and.returnValue(
      new EventEmitter<HelpCardEventResponse>()
    );
    spyOnProperty(
      schemaFormSubmittedService,
      'onSubmittedSchemaBasedForm'
    ).and.returnValue(new EventEmitter<void>());
    spyOnProperty(
      contentTranslationManagerService,
      'onStateCardContentUpdate'
    ).and.returnValue(mockOnStateCardContentUpdate);

    componentInstance.ngOnInit();
    tick();
    expect(componentInstance.updateDisplayedCardInfo).not.toHaveBeenCalled();

    mockOnStateCardContentUpdate.emit();
    tick();

    expect(componentInstance.updateDisplayedCardInfo).toHaveBeenCalled();
  }));

  it('should update displayed card info when view updates', () => {
    spyOn(componentInstance, 'updateDisplayedCardInfo');
    componentInstance.lastDisplayedCard = mockDisplayedCard2;
    componentInstance.displayedCard = mockDisplayedCard;

    componentInstance.ngOnChanges();

    expect(componentInstance.lastDisplayedCard).toEqual(mockDisplayedCard);
    expect(componentInstance.updateDisplayedCardInfo).toHaveBeenCalled();
  });

  it('should not update displayed card info when the card is unchanged', () => {
    spyOn(componentInstance, 'updateDisplayedCardInfo');
    componentInstance.lastDisplayedCard = mockDisplayedCard;
    componentInstance.displayedCard = mockDisplayedCard;

    componentInstance.ngOnChanges();

    expect(componentInstance.updateDisplayedCardInfo).not.toHaveBeenCalled();
  });

  it('should mark concept card as being shown when state name is null and not in question mode', () => {
    spyOn(
      explorationModeService,
      'isPresentingIsolatedQuestions'
    ).and.returnValue(false);
    componentInstance.displayedCard = mockDisplayedCard;
    spyOn(mockDisplayedCard, 'getStateName').and.returnValue(null);

    componentInstance.updateDisplayedCardInfo();

    expect(componentInstance.conceptCardIsBeingShown).toBe(true);
    expect(componentInstance.helpCardHasContinueButton).toBe(false);
  });

  it('should update interaction info when a concept card is not being shown', fakeAsync(() => {
    spyOn(
      explorationModeService,
      'isPresentingIsolatedQuestions'
    ).and.returnValue(true);
    spyOn(focusManagerService, 'setFocusWithoutScroll');
    componentInstance.displayedCard = mockDisplayedCard;
    spyOn(mockDisplayedCard, 'getStateName').and.returnValue(null);
    spyOn(mockDisplayedCard, 'getInteractionId').and.returnValue('Continue');

    componentInstance.updateDisplayedCardInfo();
    tick();

    expect(componentInstance.conceptCardIsBeingShown).toBe(false);
    expect(componentInstance.interactionIsInline).toEqual(
      mockDisplayedCard.isInteractionInline()
    );
    expect(componentInstance.interactionCustomizationArgs).toEqual(
      mockDisplayedCard.getInteractionCustomizationArgs()
    );
    expect(componentInstance.interactionId).toEqual('Continue');
    expect(focusManagerService.setFocusWithoutScroll).toHaveBeenCalledWith(
      'continue-btn'
    );
  }));

  it('should not set focus when interaction is not Continue', fakeAsync(() => {
    spyOn(
      explorationModeService,
      'isPresentingIsolatedQuestions'
    ).and.returnValue(true);
    spyOn(focusManagerService, 'setFocusWithoutScroll');
    componentInstance.displayedCard = mockDisplayedCard;
    spyOn(mockDisplayedCard, 'getStateName').and.returnValue(null);
    spyOn(mockDisplayedCard, 'getInteractionId').and.returnValue('TextInput');

    componentInstance.updateDisplayedCardInfo();
    tick();

    expect(focusManagerService.setFocusWithoutScroll).not.toHaveBeenCalled();
  }));

  it('should be able to skip the question', () => {
    spyOn(componentInstance.skipQuestion, 'emit');

    componentInstance.skipCurrentQuestion();

    expect(componentInstance.skipQuestion.emit).toHaveBeenCalled();
  });

  it('should tell if interaction has a nav submit button', () => {
    componentInstance.interactionId = 'ImageClickInput';

    expect(componentInstance.doesInteractionHaveNavSubmitButton()).toBe(false);
  });

  it('should throw and annotate the error when the interaction id is invalid', () => {
    componentInstance.interactionId = 'not_valid';

    expect(() => {
      componentInstance.doesInteractionHaveNavSubmitButton();
    }).toThrowError();
  });

  it('should show continue button when concept card is being shown', () => {
    componentInstance.conceptCardIsBeingShown = true;

    expect(componentInstance.shouldContinueButtonBeShown()).toBe(true);
  });

  it('should not show continue button when interaction is not inline', () => {
    componentInstance.conceptCardIsBeingShown = false;
    componentInstance.interactionIsInline = false;

    expect(componentInstance.shouldContinueButtonBeShown()).toBe(false);
  });

  it('should show continue button when interaction is inline, completed, and has a response', () => {
    componentInstance.conceptCardIsBeingShown = false;
    componentInstance.interactionIsInline = true;
    componentInstance.displayedCard = mockDisplayedCard;
    spyOn(mockDisplayedCard, 'isCompleted').and.returnValue(true);
    spyOn(mockDisplayedCard, 'getLastOppiaResponse').and.returnValue(
      '<p>Some response</p>'
    );

    expect(componentInstance.shouldContinueButtonBeShown()).toBe(true);
  });

  it('should not show continue button when card is not completed', () => {
    componentInstance.conceptCardIsBeingShown = false;
    componentInstance.interactionIsInline = true;
    componentInstance.displayedCard = mockDisplayedCard;
    spyOn(mockDisplayedCard, 'isCompleted').and.returnValue(false);
    spyOn(mockDisplayedCard, 'getLastOppiaResponse').and.returnValue('');

    expect(componentInstance.shouldContinueButtonBeShown()).toBe(false);
  });

  it('should show the upcoming card when continue button is clicked', () => {
    spyOn(conversationFlowService, 'showUpcomingCard');

    componentInstance.onClickContinueButton();

    expect(conversationFlowService.showUpcomingCard).toHaveBeenCalled();
  });

  it('should return continue button customization args', () => {
    const mockArgs = {
      buttonText: {
        value: new SubtitledUnicode('Continue', 'ca_buttonText_0'),
      },
    };
    componentInstance.interactionCustomizationArgs =
      mockArgs as ContinueCustomizationArgs;
    expect(componentInstance.continueButtonCustomizationArgs).toEqual(mockArgs);
  });
});
