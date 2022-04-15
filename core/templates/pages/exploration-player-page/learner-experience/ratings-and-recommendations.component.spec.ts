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
 * @fileoverview Unit tests for ratings and recommendations component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { AlertsService } from 'services/alerts.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { UserService } from 'services/user.service';
import { LearnerViewRatingService } from '../services/learner-view-rating.service';
import { MockLimitToPipe } from '../templates/information-card-modal.component.spec';
import { RatingsAndRecommendationsComponent } from './ratings-and-recommendations.component';

describe('Ratings and recommendations component', () => {
  let fixture: ComponentFixture<RatingsAndRecommendationsComponent>;
  let componentInstance: RatingsAndRecommendationsComponent;
  let alertsService: AlertsService;
  let learnerViewRatingService: LearnerViewRatingService;
  let urlService: UrlService;
  let userService: UserService;

  const mockNgbPopover = jasmine.createSpyObj(
    'NgbPopover', ['close', 'toggle']);


  class MockWindowRef {
    nativeWindow = {
      location: {
        search: '',
        pathname: '/path/name',
        reload: () => {}
      }
    };
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        NgbPopoverModule
      ],
      declarations: [
        RatingsAndRecommendationsComponent,
        MockLimitToPipe
      ],
      providers: [
        AlertsService,
        LearnerViewRatingService,
        UrlService,
        UserService,
        {
          provide: WindowRef,
          useClass: MockWindowRef
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RatingsAndRecommendationsComponent);
    componentInstance = fixture.componentInstance;
    alertsService = TestBed.inject(AlertsService);
    learnerViewRatingService = TestBed.inject(LearnerViewRatingService);
    urlService = TestBed.inject(UrlService);
    userService = TestBed.inject(UserService);
  });

  it('should populate internal properties and subscribe to event' +
    ' listeners on initialize', fakeAsync(() => {
    let collectionId = 'collection_id';
    let userRating = 5;
    let mockOnRatingUpdated = new EventEmitter<void>();

    spyOn(urlService, 'getCollectionIdFromExplorationUrl').and.returnValue(
      collectionId);
    spyOn(learnerViewRatingService, 'getUserRating').and.returnValue(
      userRating);
    spyOn(alertsService, 'addSuccessMessage');
    spyOn(learnerViewRatingService, 'init').and.callFake(
      (callb: (rating: number) => void) => {
        callb(userRating);
      });
    spyOnProperty(learnerViewRatingService, 'onRatingUpdated').and.returnValue(
      mockOnRatingUpdated);

    componentInstance.questionPlayerConfig = null;

    componentInstance.ngOnInit();
    mockOnRatingUpdated.emit();
    tick();

    expect(componentInstance.userRating).toEqual(userRating);
    expect(alertsService.addSuccessMessage).toHaveBeenCalled();
    expect(learnerViewRatingService.getUserRating).toHaveBeenCalled();
    expect(componentInstance.collectionId).toEqual(collectionId);
  }));

  it('should toggle popover when user clicks on rating stars', () => {
    componentInstance.feedbackPopOver = mockNgbPopover;

    componentInstance.togglePopover();

    // Using feedback popover directly here breaks the principle of
    // independent unit tests. Hence, mock is used here.
    // The mock doesn't allow us to check its final state.
    // So, using a spy on function toggle instead.
    expect(componentInstance.feedbackPopOver.toggle).toHaveBeenCalled();
  });

  it('should close popover when user clicks on cancel button', () => {
    componentInstance.feedbackPopOver = mockNgbPopover;

    componentInstance.closePopover();

    // Using feedback popover directly here breaks the principle of
    // independent unit tests. Hence, mock is used here.
    // The mock doesn't allow us to check its final state.
    // So, using a spy on function toggle instead.
    expect(componentInstance.feedbackPopOver.close).toHaveBeenCalled();
  });

  it('should submit user rating when user clicks on rating star', () => {
    spyOn(learnerViewRatingService, 'submitUserRating');
    const userRating = 5;

    componentInstance.submitUserRating(userRating);

    expect(learnerViewRatingService.submitUserRating).toHaveBeenCalledWith(
      userRating);
  });

  it('should redirect to sign in page when user clicks on signin button',
    fakeAsync(() => {
      spyOn(userService, 'getLoginUrlAsync').and.returnValue(
        Promise.resolve('login_url'));

      componentInstance.signIn();
      tick();

      expect(userService.getLoginUrlAsync).toHaveBeenCalled();
    }));

  it('should reload the page if user clicks on signin button and ' +
    'login url is not available', fakeAsync(() => {
    spyOn(userService, 'getLoginUrlAsync').and.returnValue(
      Promise.resolve(''));

    componentInstance.signIn();
    tick();

    expect(userService.getLoginUrlAsync).toHaveBeenCalled();
  }));
});
