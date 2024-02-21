// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for new lesson player sidebar component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { PlayerSidebarComponent } from './player-sidebar.component';
import { Pipe } from '@angular/core';
import { MobileMenuService } from '../new-lesson-player-services/mobile-menu.service';
import './player-sidebar.component.css';
import { I18nLanguageCodeService } from
  'services/i18n-language-code.service';
import { FetchExplorationBackendResponse, ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';
import { UrlService } from 'services/contextual/url.service';
import { RatingComputationService } from 'components/ratings/rating-computation/rating-computation.service';
import { NewLearnerViewRatingBackendApiService } from '../new-lesson-player-services/new-learner-view-rating-backend-api.service';
import { BehaviorSubject } from 'rxjs';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { TranslateService } from '@ngx-translate/core';
import { MockTranslateService } from 'components/forms/schema-based-editors/integration-tests/schema-based-editors.integration.spec';
import { ContextService } from 'services/context.service';

@Pipe({name: 'truncateAndCapitalize'})
class MockTruncteAndCapitalizePipe {
  transform(value: string, params: Object | undefined): string {
    return value;
  }
}

describe('PlayerSidebarComponent', () => {
  let component: PlayerSidebarComponent;
  let fixture: ComponentFixture<PlayerSidebarComponent>;
  let ratingComputationService: RatingComputationService;
  let newLearnerViewRatingBackendApiService:
    NewLearnerViewRatingBackendApiService;
  let mockMobileMenuService: Partial<MobileMenuService>;
  let contextService: ContextService;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let readOnlyExplorationBackendApiService:
    ReadOnlyExplorationBackendApiService;
  let urlService: UrlService;

  beforeEach(waitForAsync(() => {
    mockMobileMenuService = {
      getMenuVisibility: () =>
        new BehaviorSubject<boolean>(false).asObservable(),
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        PlayerSidebarComponent,
        MockTruncteAndCapitalizePipe,
        MockTranslatePipe,
      ],
      providers: [
        ReadOnlyExplorationBackendApiService,
        ContextService,
        I18nLanguageCodeService,
        UrlService,
        RatingComputationService,
        {
          provide: MobileMenuService,
          useValue: mockMobileMenuService
        },
        {
          provide: TranslateService,
          useClass: MockTranslateService
        }
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    ratingComputationService = TestBed.inject(RatingComputationService);
    newLearnerViewRatingBackendApiService = TestBed.inject(
      NewLearnerViewRatingBackendApiService);
    contextService = TestBed.inject(ContextService);
    readOnlyExplorationBackendApiService = TestBed.inject(
      ReadOnlyExplorationBackendApiService);
    urlService = TestBed.inject(UrlService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    fixture = TestBed.createComponent(PlayerSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize when component loads into view', fakeAsync(() => {
    let explorationId = 'expId';
    let explorationTitle = 'Exploration Title';
    let explorationObjective = 'Exploration Objective';

    spyOn(urlService, 'getPathname').and.returnValue('/lesson/');
    spyOn(contextService, 'getExplorationId').and.returnValue(explorationId);
    spyOn(readOnlyExplorationBackendApiService, 'fetchExplorationAsync')
      .and.returnValue(Promise.resolve({
        exploration: {
          title: explorationTitle,
          objective: explorationObjective
        }
      } as FetchExplorationBackendResponse));
    spyOn(urlService, 'getExplorationVersionFromUrl').and.returnValue(1);
    spyOn(urlService, 'getPidFromUrl').and.returnValue('');

    component.ngOnInit();
    tick();
    tick();

    expect(urlService.getPathname).toHaveBeenCalled();
    expect(urlService.getExplorationVersionFromUrl).toHaveBeenCalled();
    expect(urlService.getPidFromUrl).toHaveBeenCalled();
    expect(contextService.getExplorationId).toHaveBeenCalled();
    expect(readOnlyExplorationBackendApiService.fetchExplorationAsync)
      .toHaveBeenCalled();
    expect(component.setRatings).toHaveBeenCalled();
    expect(i18nLanguageCodeService.getExplorationTranslationKey)
      .toHaveBeenCalled();
  }));


  it('should toggle sidebar', () => {
    component.isExpanded = false;
    component.toggleSidebar();
    expect(component.isExpanded).toBe(true);
    component.toggleSidebar();
    expect(component.isExpanded).toBe(false);
  });

  it('should set ratings', fakeAsync(() => {
    let userRatingSpy = spyOn(
      newLearnerViewRatingBackendApiService, 'getUserRatingAsync')
      .and.resolveTo({
        user_rating: 2,
        overall_ratings: {
          1: 1,
          2: 2,
          3: 3,
          4: 4,
          5: 0
        }
      });
    tick();
    component.setRatings();
    tick();
    expect(userRatingSpy).toHaveBeenCalled();
    expect(component.ratings).toEqual({ 1: 1, 2: 2, 3: 3, 4: 4, 5: 0 });
    expect(component.avgRating).toBe(3);
    expect(component.fullStars).toBe(3);
    expect(component.blankStars).toBe(2);
  }));

  it('should check if hacky exp desc translation is displayed', () => {
    // Translation is only displayed if the language is not English
    // and it's hacky translation is available.
    let hackyExpDescTranslationIsDisplayed = (
      component.isHackyExpDescTranslationDisplayed());
    expect(hackyExpDescTranslationIsDisplayed).toBe(false);
  });

  it('should get average rating', fakeAsync(() => {
    component.ratings = {
      1: 1,
      2: 0,
      3: 0,
      4: 0,
      5: 1
    };
    const ratingsSpy = spyOn(
      ratingComputationService, 'computeAverageRating')
      .and.returnValue(3);

    let averageRating = component.getAverageRating();
    tick();
    fixture.detectChanges();

    expect(ratingsSpy).toHaveBeenCalled();
    expect(averageRating).toBe(3);
  }));

  it('should get range', () => {
    const range = component.getRange(5);
    expect(range).toEqual([0, 1, 2, 3, 4]);
  });
});
