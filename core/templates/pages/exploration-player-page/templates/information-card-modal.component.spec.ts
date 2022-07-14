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
 * @fileoverview Unit tests for information card component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Pipe, PipeTransform } from '@angular/core';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { RatingComputationService } from 'components/ratings/rating-computation/rating-computation.service';
import { ExplorationRatings } from 'domain/summary/learner-exploration-summary.model';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { DateTimeFormatService } from 'services/date-time-format.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { InformationCardModalComponent } from './information-card-modal.component';

@Pipe({name: 'summarizeNonnegativeNumber'})
export class MockSummarizeNonnegativeNumberPipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

@Pipe({name: 'truncateAndCapitalize'})
export class MockTruncateAndCapitalizePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

@Pipe({name: 'limitTo'})
export class MockLimitToPipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe('Information card modal component', () => {
  let fixture: ComponentFixture<InformationCardModalComponent>;
  let componentInstance: InformationCardModalComponent;
  let dateTimeFormatService: DateTimeFormatService;
  let ratingComputationService: RatingComputationService;
  let urlInterpolationService: UrlInterpolationService;
  let i18nLanguageCodeService: I18nLanguageCodeService;

  let expId = 'expId';
  let expTitle = 'Exploration Title';
  let rating: ExplorationRatings;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [
        InformationCardModalComponent,
        MockTranslatePipe,
        MockSummarizeNonnegativeNumberPipe,
        MockTruncateAndCapitalizePipe,
        MockLimitToPipe
      ],
      providers: [
        NgbActiveModal,
        DateTimeFormatService,
        RatingComputationService,
        UrlInterpolationService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InformationCardModalComponent);
    componentInstance = fixture.componentInstance;
    componentInstance.expInfo = {
      category: '',
      community_owned: true,
      activity_type: '',
      last_updated_msec: 0,
      ratings: rating,
      id: expId,
      created_on_msec: 2,
      human_readable_contributors_summary: {
        'contributer 1': {
          num_commits: 2
        },
        'contributer 2': {
          num_commits: 2
        }
      },
      language_code: '',
      num_views: 3,
      objective: '',
      status: 'private',
      tags: [],
      thumbnail_bg_color: '',
      thumbnail_icon_url: '',
      title: expTitle
    };
    dateTimeFormatService = TestBed.inject(DateTimeFormatService);
    ratingComputationService = TestBed.inject(RatingComputationService);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);

    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true);
  });

  it('should initialize', () => {
    let averageRating = 4.5;
    spyOn(ratingComputationService, 'computeAverageRating').and.returnValue(
      averageRating);
    spyOn(componentInstance, 'getExplorationTagsSummary').and.returnValue({
      tagsToShow: [],
      tagsInTooltip: []
    });
    spyOn(componentInstance, 'getLastUpdatedString').and.returnValue('');
    componentInstance.ngOnInit();
    expect(componentInstance.explorationId).toEqual(expId);
    expect(componentInstance.explorationTitle).toEqual(expTitle);
    expect(componentInstance.explorationIsPrivate).toBeTrue();
  });

  it('should get exploration tags summary', () => {
    let arrayOfTags = ['tag1', 'tag2'];
    expect(componentInstance.getExplorationTagsSummary(['tag1', 'tag2']))
      .toEqual({
        tagsToShow: arrayOfTags,
        tagsInTooltip: []
      });

    arrayOfTags = [
      'this is a long tag.', 'this is also a long tag',
      'this exceeds 45 characters'];
    expect(componentInstance.getExplorationTagsSummary(arrayOfTags)).toEqual({
      tagsToShow: [arrayOfTags[0], arrayOfTags[1]],
      tagsInTooltip: [arrayOfTags[2]]
    });
  });

  it('should get updated string', () => {
    let dateTimeString = 'datetime_string';
    spyOn(dateTimeFormatService, 'getLocaleAbbreviatedDatetimeString')
      .and.returnValue(dateTimeString);
    expect(componentInstance.getLastUpdatedString(12)).toEqual(dateTimeString);
  });

  it('should provide title wrapper', () => {
    let titleHeight = 20;
    spyOn(document, 'querySelectorAll').and.returnValue([{
      clientWidth: titleHeight + 20
    }] as unknown as NodeListOf<Element>);
    expect(componentInstance.titleWrapper()).toEqual({
      'word-wrap': 'break-word',
      width: titleHeight.toString()
    });
  });

  it('should get static image url', () => {
    let staticImageUrl = 'static_image_url';
    spyOn(urlInterpolationService, 'getStaticImageUrl').and.returnValue(
      staticImageUrl);
    expect(componentInstance.getStaticImageUrl('')).toEqual(staticImageUrl);
  });
});
