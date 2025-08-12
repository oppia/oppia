// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for DisplayNewHintModalComponent.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {SubtitledHtml} from '../../../../../domain/exploration/subtitled-html.model';
import {StateCard} from '../../../../../domain/state_card/state-card.model';
import {HintsAndSolutionManagerService} from '../../../services/hints-and-solution-manager.service';
import {PlayerPositionService} from '../../../services/player-position.service';
import {PlayerTranscriptService} from '../../../services/player-transcript.service';
import {DisplayNewHintModalComponent} from './display-new-hint-modal.component';
import {MockTranslatePipe} from '../../../../../tests/unit-test-utils';
import {Interaction} from '../../../../../domain/exploration/interaction.model';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';

describe('DisplayNewHintModalComponent', () => {
  let fixture: ComponentFixture<DisplayNewHintModalComponent>;
  let componentInstance: DisplayNewHintModalComponent;
  let hintsAndSolutionManagerService: HintsAndSolutionManagerService;
  let playerTranscriptService: PlayerTranscriptService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [DisplayNewHintModalComponent, MockTranslatePipe],
      providers: [
        HintsAndSolutionManagerService,
        PlayerPositionService,
        PlayerTranscriptService,
        {
          provide: NgbActiveModal,
          useValue: {dismiss: jasmine.createSpy('dismiss')},
        },
        {provide: MatBottomSheetRef, useValue: null},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayNewHintModalComponent);
    componentInstance = fixture.componentInstance;
    hintsAndSolutionManagerService = TestBed.inject(
      HintsAndSolutionManagerService
    );
    playerTranscriptService = TestBed.inject(PlayerTranscriptService);
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should initialize', () => {
    const contentId = 'content_id';
    const hint = new SubtitledHtml('html', contentId);
    const displayedCard = new StateCard(
      'test_name',
      'content',
      'interaction',
      {} as Interaction,
      [],
      contentId
    );

    spyOn(hintsAndSolutionManagerService, 'displayHint').and.returnValue(hint);
    spyOn(playerTranscriptService, 'getCard').and.returnValue(displayedCard);

    componentInstance.ngOnInit();

    expect(componentInstance.hint).toEqual(hint);
    expect(componentInstance.displayedCard).toEqual(displayedCard);
    expect(componentInstance.hintContentId).toEqual(contentId);
  });

  it('should throw error if displayHint is null', () => {
    spyOn(hintsAndSolutionManagerService, 'displayHint').and.returnValue(null);

    expect(() => {
      componentInstance.ngOnInit();
    }).toThrowError('Hint not found.');
  });

  it('should throw error if hint content ID is null', () => {
    const hint = new SubtitledHtml('html', null);
    const displayedCard = new StateCard(
      'test_name',
      'content',
      'interaction',
      {} as Interaction,
      [],
      'some_id'
    );

    spyOn(hintsAndSolutionManagerService, 'displayHint').and.returnValue(hint);
    spyOn(playerTranscriptService, 'getCard').and.returnValue(displayedCard);

    expect(() => {
      componentInstance.ngOnInit();
    }).toThrowError('Content id not found.');
  });
});

describe('DisplayNewHintModalComponent using NgbActiveModal', () => {
  let fixture: ComponentFixture<DisplayNewHintModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [DisplayNewHintModalComponent, MockTranslatePipe],
      providers: [
        {
          provide: NgbActiveModal,
          useValue: {dismiss: jasmine.createSpy('dismiss')},
        },
        {provide: MatBottomSheetRef, useValue: null},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  it('should close modal using ngbActiveModal', () => {
    fixture = TestBed.createComponent(DisplayNewHintModalComponent);
    const component = fixture.componentInstance;
    const ngbActiveModal = TestBed.inject(NgbActiveModal);

    component.closeModal();
    expect(ngbActiveModal.dismiss).toHaveBeenCalledWith('cancel');
  });
});

describe('DisplayNewHintModalComponent using BottomSheetRef', () => {
  let fixture: ComponentFixture<DisplayNewHintModalComponent>;
  let component: DisplayNewHintModalComponent;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [DisplayNewHintModalComponent, MockTranslatePipe],
      providers: [
        {provide: NgbActiveModal, useValue: null},
        {
          provide: MatBottomSheetRef,
          useValue: {dismiss: jasmine.createSpy('dismiss')},
        },
        {
          provide: MAT_BOTTOM_SHEET_DATA,
          useValue: {activeHintIndex: 2},
        },
        HintsAndSolutionManagerService,
        PlayerTranscriptService,
        PlayerPositionService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayNewHintModalComponent);
    component = fixture.componentInstance;

    const hint = new SubtitledHtml('hint html', 'content_2');
    const stateCard = new StateCard(
      'stateName',
      'content',
      'interaction',
      {},
      [],
      'content_2'
    );

    const hintService = TestBed.inject(HintsAndSolutionManagerService);
    const transcriptService = TestBed.inject(PlayerTranscriptService);
    const positionService = TestBed.inject(PlayerPositionService);

    spyOn(hintService, 'displayHint').and.returnValue(hint);
    spyOn(transcriptService, 'getCard').and.returnValue(stateCard);
    spyOn(positionService, 'getDisplayedCardIndex').and.returnValue(0);
  });

  it('should set activeHintIndex from data if provided', () => {
    component.ngOnInit();
    expect(component.activeHintIndex).toBe(2);
    expect(component.hint.contentId).toBe('content_2');
  });

  it('should close modal using bottomSheetRef', () => {
    const bottomSheetRef = TestBed.inject(MatBottomSheetRef);
    component.closeModal();
    expect(bottomSheetRef.dismiss).toHaveBeenCalled();
  });
});
