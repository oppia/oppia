// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit test for the page title service.
 */

import {PageTitleService} from 'services/page-title.service';
import {TestBed} from '@angular/core/testing';
import {Title, Meta} from '@angular/platform-browser';

describe('Page title service', () => {
  let pts: PageTitleService;
  let titleService: Title;
  let metaTagService: Meta;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PageTitleService, Title, Meta],
    });
    titleService = TestBed.inject(Title);
    metaTagService = TestBed.inject(Meta);
    pts = TestBed.inject(PageTitleService);
  });

  it('should correctly set the page title', () => {
    pts.setDocumentTitle('First Title');
    expect(titleService.getTitle()).toEqual('First Title');

    pts.setDocumentTitle('Second Title');
    expect(titleService.getTitle()).toEqual('Second Title');
  });

  it('should correctly get the page title', () => {
    titleService.setTitle('First Title');
    expect(pts.getDocumentTitle()).toEqual('First Title');

    titleService.setTitle('Second Title');
    expect(pts.getDocumentTitle()).toEqual('Second Title');
  });

  it('should correctly set the page title for mobile view', () => {
    pts.setNavbarTitleForMobileView('First Title');
    expect(pts.getNavbarTitleForMobileView()).toEqual('First Title');

    pts.setNavbarTitleForMobileView('Second Title');
    expect(pts.getNavbarTitleForMobileView()).toEqual('Second Title');
  });

  it('should correctly set the page subtitle for mobile view', () => {
    pts.setNavbarSubtitleForMobileView('First Subtitle');
    expect(pts.getNavbarSubtitleForMobileView()).toEqual('First Subtitle');

    pts.setNavbarSubtitleForMobileView('Second Subtitle');
    expect(pts.getNavbarSubtitleForMobileView()).toEqual('Second Subtitle');
  });

  it('should correctly update the description meta tags', () => {
    let updateTagSpy = spyOn(metaTagService, 'updateTag').and.callThrough();
    pts.updateMetaTag('description_text');

    expect(updateTagSpy).toHaveBeenCalledTimes(3);
    expect(updateTagSpy).toHaveBeenCalledWith({
      name: 'description',
      content: 'description_text',
    });
    expect(updateTagSpy).toHaveBeenCalledWith({
      itemprop: 'description',
      content: 'description_text',
    });
    expect(updateTagSpy).toHaveBeenCalledWith({
      property: 'og:description',
      content: 'description_text',
    });
  });

  it('should correctly add meta tag', () => {
    let metaTagContent = {
      name: 'keywords',
      content: 'blog, oppia, maths',
    };
    spyOn(metaTagService, 'addTag').and.callThrough();

    pts.addMetaTag(metaTagContent);

    expect(metaTagService.addTag).toHaveBeenCalledWith(metaTagContent);
  });
});
