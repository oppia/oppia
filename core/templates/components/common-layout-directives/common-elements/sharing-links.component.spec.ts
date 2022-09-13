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

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ExplorationEmbedButtonModalComponent } from 'components/button-directives/exploration-embed-button-modal.component';
import { WindowRef } from 'services/contextual/window-ref.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { SharingLinksComponent } from './sharing-links.component';


/**
 * @fileoverview Unit tests for SharingLinksComponent.
 */

class MockWindowRef {
  _window = {
    location: {
      protocol: 'https:',
      host: 'www.oppia.org'
    },
    open: (url: string) => {},
    gtag: () => {}
  };

  get nativeWindow() {
    return this._window;
  }
}

export class MockNgbModalRef {
  componentInstance = {
    serverName: null,
    explorationId: null
  };
}

describe('SharingLinksComponent', () => {
  let component: SharingLinksComponent;
  let fixture: ComponentFixture<SharingLinksComponent>;
  let windowRef: MockWindowRef;
  let ngbModalRef: MockNgbModalRef = new MockNgbModalRef();
  let ngbModal: NgbModal;
  let siteAnalyticsService: SiteAnalyticsService;

  beforeEach(waitForAsync(() => {
    windowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      declarations: [SharingLinksComponent],
      providers: [
        {provide: WindowRef, useValue: windowRef}
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SharingLinksComponent);
    component = fixture.componentInstance;
    ngbModal = TestBed.inject(NgbModal);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
  });

  it('should set query fields for social platform APIs when an' +
    ' exploration is shared', () => {
    component.shareType = 'exploration';
    component.explorationId = 'exp1';

    component.ngOnInit();

    expect(component.activityId).toBe('exp1');
    expect(component.activityUrlFragment).toBe('explore');
    expect(component.serverName).toBe('https://www.oppia.org');
    expect(component.escapedTwitterText).toBe(
      'Check out this interactive lesson on Oppia - a free platform' +
      ' for teaching and learning!');
    expect(component.classroomUrl).toBe('/assets/images/general/classroom.png');
  });

  it('should set query fields for social platform APIs when a' +
    ' collection is shared', () => {
    component.shareType = 'collection';
    component.collectionId = 'col1';

    component.ngOnInit();

    expect(component.activityId).toBe('col1');
    expect(component.activityUrlFragment).toBe('collection');
    expect(component.serverName).toBe('https://www.oppia.org');
    expect(component.escapedTwitterText).toBe(
      'Check out this interactive lesson on Oppia - a free platform' +
      ' for teaching and learning!');
    expect(component.classroomUrl).toBe('/assets/images/general/classroom.png');
  });

  it('should set query fields for social platform APIs when a' +
    ' blog post is shared', () => {
    component.shareType = 'blog';
    component.blogPostUrl = 'sample-blog-post-url';

    component.ngOnInit();

    expect(component.serverName).toBe('https://www.oppia.org');
    expect(component.escapedTwitterText).toBe(
      'Check out this new blog post on Oppia!');
  });


  it('should throw an error when SharingLink component is used' +
    ' at any other place than exploration player, collection player or' +
    ' blog post page', () => {
    // This throws "Type '"not-exp-or-col"' is not assignable to type
    // 'ShareType'". We need to suppress this error because 'shareType' can
    // only be equal to 'exploration', 'collection' or 'blog', but we set an
    // invalid value in order to test validations.
    // @ts-expect-error
    component.shareType = 'not-exp-or-col';

    expect(() => component.ngOnInit()).toThrowError(
      'SharingLinks component can only be used in the collection player' +
      ', exploration player or the blog post page.');
  });

  it('should get font and flex class according to font size', () => {
    component.smallFont = true;
    component.layoutType = 'row';
    component.layoutAlignType = 'center end';

    expect(component.getFontAndFlexClass()).toBe(
      'font-small fx-row fx-main-center fx-cross-end');

    component.smallFont = false;
    component.layoutType = 'row-center';
    component.layoutAlignType = 'center';

    expect(component.getFontAndFlexClass()).toBe(
      'font-big fx-row-center fx-main-center');

    component.smallFont = true;
    component.layoutType = 'row-center';
    component.layoutAlignType = '';

    expect(component.getFontAndFlexClass()).toBe(
      'font-small fx-row-center');
  });

  it('should get social media URLs', () => {
    expect(component.getUrl('facebook')).toBe(
      'https://www.facebook.com/sharer/sharer.php?sdk=joey&u=undefined/undefined/undefined&display=popup&ref=plugin&src=share_button');
    expect(component.getUrl('twitter')).toBe(
      'https://twitter.com/share?text=undefined&url=undefined/undefined/undefined');
    expect(component.getUrl('classroom')).toBe(
      'https://classroom.google.com/share?url=undefined/undefined/undefined');

    component.serverName = 'https://www.oppia.org';
    component.activityUrlFragment = 'explore';
    component.activityId = 'exp1';
    component.escapedTwitterText = 'Check out this interactive' +
    ' lesson on Oppia - a free platform for teaching and learning!';

    expect(component.getUrl('facebook')).toBe(
      'https://www.facebook.com/sharer/sharer.php?sdk=joey&u=https://www.oppia.org/explore/exp1&display=popup&ref=plugin&src=share_button');
    expect(component.getUrl('twitter')).toBe(
      'https://twitter.com/share?text=Check out this interactive lesson on Oppia - a free platform for teaching and learning!&url=https://www.oppia.org/explore/exp1');
    expect(component.getUrl('classroom')).toBe(
      'https://classroom.google.com/share?url=https://www.oppia.org/explore/exp1');

    component.serverName = 'https://www.oppia.org';
    component.shareType = 'blog';
    component.blogPostUrl = 'sample-blog-post-url';
    component.escapedTwitterText = 'Check out this new blog post on Oppia - a' +
    ' free platform for teaching and learning!';
    expect(component.getUrl('facebook')).toBe(
      'https://www.facebook.com/sharer/sharer.php?sdk=joey&u=https://www.oppia.org/blog/sample-blog-post-url&display=popup&ref=plugin&src=share_button');
    expect(component.getUrl('twitter')).toBe(
      'https://twitter.com/share?text=Check out this new blog post on Oppia - a free platform for teaching and learning!&url=https://www.oppia.org/blog/sample-blog-post-url');
    expect(component.getUrl('linkedin')).toBe(
      'https://www.linkedin.com/sharing/share-offsite/?url=https://www.oppia.org/blog/sample-blog-post-url');
  });

  it('should show embed exploration modal when' +
    ' user clicks on \'Embed this Exploration\'', () => {
    component.serverName = 'https://www.oppia.org';
    component.explorationId = 'exp1';
    const modalSpy = spyOn(ngbModal, 'open').and.returnValue(
      ngbModalRef as NgbModalRef);

    component.showEmbedExplorationModal();

    expect(modalSpy).toHaveBeenCalledWith(
      ExplorationEmbedButtonModalComponent, {backdrop: true});
    expect(ngbModalRef.componentInstance.serverName).toBe(
      'https://www.oppia.org');
    expect(ngbModalRef.componentInstance.explorationId).toBe('exp1');
  });

  it('should register exploration share event when user clicks' +
    ' on a social media icon', () => {
    const shareExplorationEventSpy =
      spyOn(siteAnalyticsService, 'registerShareExplorationEvent');
    const windowRefSpy = spyOn(windowRef.nativeWindow, 'open');
    component.shareType = 'exploration';

    component.registerShareEvent('facebook');

    expect(shareExplorationEventSpy).toHaveBeenCalledWith('facebook');
    expect(windowRefSpy).toHaveBeenCalled();
  });

  it('should register collection share event when user clicks' +
    ' on a social media icon', () => {
    const shareCollectionEventSpy =
      spyOn(siteAnalyticsService, 'registerShareCollectionEvent');
    const windowRefSpy = spyOn(windowRef.nativeWindow, 'open');
    component.shareType = 'collection';

    component.registerShareEvent('twitter');

    expect(shareCollectionEventSpy).toHaveBeenCalledWith('twitter');
    expect(windowRefSpy).toHaveBeenCalled();
  });

  it('should register blog post share event when user clicks' +
    ' on a social media icon', () => {
    const shareBlogPostEventSpy =
      spyOn(siteAnalyticsService, 'registerShareBlogPostEvent');
    const windowRefSpy = spyOn(windowRef.nativeWindow, 'open');
    component.shareType = 'blog';

    component.registerShareEvent('twitter');

    expect(shareBlogPostEventSpy).toHaveBeenCalledWith('twitter');
    expect(windowRefSpy).toHaveBeenCalled();
  });
});
