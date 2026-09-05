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
 * @fileoverview Unit tests for card navigation control component.
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
import {TranslateService} from '@ngx-translate/core';
import {StateCard} from 'domain/state_card/state-card.model';
import {Interaction} from 'domain/exploration/interaction.model';
import {UrlService} from 'services/contextual/url.service';
import {PageContextService} from 'services/page-context.service';
import {ConversationFlowService} from 'pages/exploration-player-page/services/conversation-flow.service';
import {
  HelpCardEventResponse,
  PlayerPositionService,
} from '../../services/player-position.service';
import {PlayerTranscriptService} from '../../services/player-transcript.service';
import {CardNavigationControlComponent} from './card-navigation-control.component';

class MockTranslateService {
  instant(key: string): string {
    return key;
  }
}

describe('Card navigation control component', () => {
  let fixture: ComponentFixture<CardNavigationControlComponent>;
  let componentInstance: CardNavigationControlComponent;

  let urlService: UrlService;
  let playerPositionService: PlayerPositionService;
  let playerTranscriptService: PlayerTranscriptService;
  let pageContextService: PageContextService;
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
      imports: [HttpClientTestingModule],
      declarations: [CardNavigationControlComponent],
      providers: [
        PlayerPositionService,
        PlayerTranscriptService,
        UrlService,
        PageContextService,
        ConversationFlowService,
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardNavigationControlComponent);
    componentInstance = fixture.componentInstance;
    urlService = TestBed.inject(UrlService);
    playerPositionService = TestBed.inject(PlayerPositionService);
    playerTranscriptService = TestBed.inject(PlayerTranscriptService);
    pageContextService = TestBed.inject(PageContextService);
    conversationFlowService = TestBed.inject(ConversationFlowService);
  });

  afterEach(() => {
    componentInstance.ngOnDestroy();
  });

  it('should initialize when on a lesson page outside an embed', fakeAsync(() => {
    let isIframed = true;
    let mockOnHelpCardAvailableEventEmitter =
      new EventEmitter<HelpCardEventResponse>();

    spyOn(urlService, 'isIframed').and.returnValue(isIframed);
    spyOn(urlService, 'getPathname').and.returnValue(
      'http://localhost:8181/lesson/wZiXFx1iV5bz'
    );
    spyOn(pageContextService, 'isInDiagnosticTestPlayerPage').and.returnValue(
      false
    );
    spyOnProperty(playerPositionService, 'onHelpCardAvailable').and.returnValue(
      mockOnHelpCardAvailableEventEmitter
    );

    componentInstance.ngOnInit();
    mockOnHelpCardAvailableEventEmitter.emit({
      hasContinueButton: true,
    } as HelpCardEventResponse);
    tick();

    expect(componentInstance.isIframed).toEqual(isIframed);
    expect(componentInstance.navigationThroughCardHistoryIsEnabled).toBe(true);
    expect(componentInstance.progressTrackerIsVisible).toBe(true);
    expect(componentInstance.helpCardHasContinueButton).toBe(true);
  }));

  it('should not show the progress tracker when embedded', fakeAsync(() => {
    spyOn(urlService, 'isIframed').and.returnValue(true);
    spyOn(urlService, 'getPathname').and.returnValue(
      'http://localhost:8181/embed/lesson/wZiXFx1iV5bz'
    );
    spyOn(pageContextService, 'isInDiagnosticTestPlayerPage').and.returnValue(
      false
    );
    spyOnProperty(playerPositionService, 'onHelpCardAvailable').and.returnValue(
      new EventEmitter<HelpCardEventResponse>()
    );

    componentInstance.ngOnInit();
    tick();

    expect(componentInstance.progressTrackerIsVisible).toBe(false);
  }));

  it('should not show the progress tracker outside of the lesson page', fakeAsync(() => {
    spyOn(urlService, 'isIframed').and.returnValue(false);
    spyOn(urlService, 'getPathname').and.returnValue(
      'http://localhost:8181/create/wZiXFx1iV5bz'
    );
    spyOn(pageContextService, 'isInDiagnosticTestPlayerPage').and.returnValue(
      false
    );
    spyOnProperty(playerPositionService, 'onHelpCardAvailable').and.returnValue(
      new EventEmitter<HelpCardEventResponse>()
    );

    componentInstance.ngOnInit();
    tick();

    expect(componentInstance.progressTrackerIsVisible).toBe(false);
  }));

  it('should disable navigation through card history in the diagnostic test player', fakeAsync(() => {
    spyOn(urlService, 'isIframed').and.returnValue(false);
    spyOn(urlService, 'getPathname').and.returnValue(
      'http://localhost:8181/diagnostic-test-player'
    );
    spyOn(pageContextService, 'isInDiagnosticTestPlayerPage').and.returnValue(
      true
    );
    spyOnProperty(playerPositionService, 'onHelpCardAvailable').and.returnValue(
      new EventEmitter<HelpCardEventResponse>()
    );

    componentInstance.ngOnInit();
    tick();

    expect(componentInstance.navigationThroughCardHistoryIsEnabled).toBe(false);
  }));

  it('should update displayed card info when the displayed card changes', () => {
    spyOn(componentInstance, 'updateDisplayedCardInfo');
    componentInstance.lastDisplayedCard = mockDisplayedCard2;
    componentInstance.displayedCard = mockDisplayedCard;

    componentInstance.ngOnChanges();

    expect(componentInstance.lastDisplayedCard).toEqual(mockDisplayedCard);
    expect(componentInstance.updateDisplayedCardInfo).toHaveBeenCalled();
  });

  it('should not update displayed card info when the displayed card is unchanged', () => {
    spyOn(componentInstance, 'updateDisplayedCardInfo');
    componentInstance.lastDisplayedCard = mockDisplayedCard;
    componentInstance.displayedCard = mockDisplayedCard;

    componentInstance.ngOnChanges();

    expect(componentInstance.updateDisplayedCardInfo).not.toHaveBeenCalled();
  });

  it('should mark hasPrevious false and hasNext true on the first card', () => {
    spyOn(playerPositionService, 'getDisplayedCardIndex').and.returnValue(0);
    spyOn(playerTranscriptService, 'isLastCard').and.returnValue(false);

    componentInstance.updateDisplayedCardInfo();

    expect(playerPositionService.getDisplayedCardIndex).toHaveBeenCalled();
    expect(playerTranscriptService.isLastCard).toHaveBeenCalledWith(0);
    expect(componentInstance.hasPrevious).toBe(false);
    expect(componentInstance.hasNext).toBe(true);
  });

  it('should mark hasPrevious true and hasNext false on the last card', () => {
    spyOn(playerPositionService, 'getDisplayedCardIndex').and.returnValue(2);
    spyOn(playerTranscriptService, 'isLastCard').and.returnValue(true);

    componentInstance.updateDisplayedCardInfo();

    expect(componentInstance.hasPrevious).toBe(true);
    expect(componentInstance.hasNext).toBe(false);
  });

  it('should call moveForwardByOneCard on conversationFlowService', () => {
    spyOn(conversationFlowService, 'moveForwardByOneCard');
    componentInstance.moveForwardByOneCard();
    expect(conversationFlowService.moveForwardByOneCard).toHaveBeenCalled();
  });

  it('should call moveBackByOneCard on conversationFlowService', () => {
    spyOn(conversationFlowService, 'moveBackByOneCard');
    componentInstance.moveBackByOneCard();
    expect(conversationFlowService.moveBackByOneCard).toHaveBeenCalled();
  });
});
