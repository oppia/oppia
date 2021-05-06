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
 * @fileoverview Unit tests for the subtopic viewer pre logo action
 */

import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { SubtopicViewerNavbarPreLogoActionComponent } from './subtopic-viewer-navbar-pre-logo-action.component';
import { UrlService } from 'services/contextual/url.service';

describe('subtopic viewer pre logo action component', () => {
  let component: SubtopicViewerNavbarPreLogoActionComponent;
  let fixture: ComponentFixture<SubtopicViewerNavbarPreLogoActionComponent>;
  let urlService: UrlService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SubtopicViewerNavbarPreLogoActionComponent],
    }).compileComponents();

    urlService = TestBed.get(UrlService);

    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl')
      .and.returnValue('url-fragment');
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl')
      .and.returnValue('math');
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      SubtopicViewerNavbarPreLogoActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should set topic url fragment from the URL correctly', () => {
    component.ngOnInit();
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      expect(component.topicUrlFragment).toBe('url-fragment');
    });
  });

  it('should set the topic url from the url fragment correctly', () => {
    component.ngOnInit();
    expect(component.topicUrl).toBe('/learn/math/url-fragment/revision');
  });
});
