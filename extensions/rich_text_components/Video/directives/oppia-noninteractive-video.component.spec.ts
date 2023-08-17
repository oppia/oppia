// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the Video rich-text component.
 */

import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoninteractiveVideo } from './oppia-noninteractive-video.component';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { ContextService } from 'services/context.service';
import { NO_ERRORS_SCHEMA, SimpleChanges} from '@angular/core';
import { AutoplayedVideosService } from 'services/autoplayed-videos.service';
import { ServicesConstants } from 'services/services.constants';

describe('NoninteractiveVideo', () => {
  let component: NoninteractiveVideo;
  let fixture: ComponentFixture<NoninteractiveVideo>;
  let autoplayedVideosService: AutoplayedVideosService;
  let htmlEscaperService: HtmlEscaperService;
  let contextService: ContextService;
  let boundingClientRect = {
    x: -29968.005859375,
    y: -29941.130859375,
    width: 27.17013931274414,
    height: 16.54513931274414,
    top: 200,
    right: 200,
    bottom: 200,
    left: 200
  };
  let changes: SimpleChanges = {
    videoIdWithValue: {
      currentValue: 'video_id',
      previousValue: 'mCtXAVZGjwk',
      firstChange: false,
      isFirstChange: () => false}
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [NoninteractiveVideo],
      providers: [HtmlEscaperService, ContextService, AutoplayedVideosService],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    autoplayedVideosService = TestBed.inject(AutoplayedVideosService);
    htmlEscaperService = TestBed.inject(HtmlEscaperService);
    contextService = TestBed.get(ContextService);

    fixture = TestBed.createComponent(NoninteractiveVideo);
    component = fixture.componentInstance;
    component.autoplayWithValue = 'true';
    component.endWithValue = '100';
    component.startWithValue = '20';
    component.videoIdWithValue = '&quot;mCtXAVZGjwk&quot;';
  });

  it('should initialize component when video is added to the RTE', () => {
    spyOn(htmlEscaperService, 'escapedJsonToObj').and.callThrough();
    spyOn(contextService, 'isInExplorationEditorMode').and.returnValue(true);
    spyOnProperty(window, 'innerHeight', 'get').and.returnValue(1054);
    spyOnProperty(window, 'innerWidth', 'get').and.returnValue(1098);
    spyOn(Element.prototype, 'getBoundingClientRect').and.callFake(
      jasmine.createSpy('getBoundingClientRect').and
        .returnValue(boundingClientRect));

    component.ngOnInit();

    expect(htmlEscaperService.escapedJsonToObj).toHaveBeenCalledTimes(4);
    expect(component.start).toBe(20);
    expect(component.end).toBe(100);
    expect(component.videoId).toBe('mCtXAVZGjwk');
    expect(component.tabIndexVal).toBe(-1);
  });

  it('should enable video when not in exploration editor', () => {
    spyOn(htmlEscaperService, 'escapedJsonToObj').and.callThrough();
    spyOn(contextService, 'isInExplorationEditorMode').and.returnValue(false);
    spyOnProperty(window, 'innerHeight', 'get').and.returnValue(1054);
    spyOnProperty(window, 'innerWidth', 'get').and.returnValue(1098);
    spyOn(Element.prototype, 'getBoundingClientRect').and.callFake(
      jasmine.createSpy('getBoundingClientRect').and
        .returnValue(boundingClientRect));

    component.ngOnInit();

    expect(htmlEscaperService.escapedJsonToObj).toHaveBeenCalledTimes(4);
    expect(component.start).toBe(20);
    expect(component.end).toBe(100);
    expect(component.videoId).toBe('mCtXAVZGjwk');
    expect(component.tabIndexVal).toBeUndefined();
  });

  it('should autoplay video if user is in learner view and creator has' +
    ' specified to autoplay given video.', () => {
    spyOnProperty(window, 'innerHeight', 'get').and.returnValue(1054);
    spyOnProperty(window, 'innerWidth', 'get').and.returnValue(1098);
    spyOn(Element.prototype, 'getBoundingClientRect').and.callFake(
      jasmine.createSpy('getBoundingClientRect').and
        .returnValue(boundingClientRect));
    spyOn(autoplayedVideosService, 'hasVideoBeenAutoplayed').and
      .returnValue(false);
    spyOn(autoplayedVideosService, 'addAutoplayedVideo');
    spyOn(contextService, 'getPageContext').and
      .returnValue(ServicesConstants.PAGE_CONTEXT.EXPLORATION_PLAYER);

    expect(component.playerVars.autoplay).toBe(0);

    component.ngOnInit();

    expect(autoplayedVideosService.hasVideoBeenAutoplayed)
      .toHaveBeenCalledWith('mCtXAVZGjwk');
    expect(component.playerVars.autoplay).toBe(1);
    expect(autoplayedVideosService.addAutoplayedVideo)
      .toHaveBeenCalledWith('mCtXAVZGjwk');
  });

  it('should not autoplay video if user is in learner view and creator has' +
    ' not specified to autoplay given video.', () => {
    spyOnProperty(window, 'innerHeight', 'get').and.returnValue(1054);
    spyOnProperty(window, 'innerWidth', 'get').and.returnValue(1098);
    spyOn(Element.prototype, 'getBoundingClientRect').and.callFake(
      jasmine.createSpy('getBoundingClientRect').and
        .returnValue(boundingClientRect));
    spyOn(autoplayedVideosService, 'hasVideoBeenAutoplayed').and
      .returnValue(false);
    spyOn(autoplayedVideosService, 'addAutoplayedVideo');
    spyOn(contextService, 'getPageContext').and
      .returnValue(ServicesConstants.PAGE_CONTEXT.EXPLORATION_PLAYER);
    component.autoplayWithValue = 'false';

    component.ngOnInit();

    expect(component.playerVars.autoplay).toBe(0);
    expect(autoplayedVideosService.hasVideoBeenAutoplayed)
      .not.toHaveBeenCalledWith('mCtXAVZGjwk');
    expect(autoplayedVideosService.addAutoplayedVideo)
      .not.toHaveBeenCalledWith('mCtXAVZGjwk');
  });

  it('should update video view if user changes video parameters', () => {
    spyOnProperty(window, 'innerHeight', 'get').and.returnValue(1054);
    spyOnProperty(window, 'innerWidth', 'get').and.returnValue(1098);
    spyOn(Element.prototype, 'getBoundingClientRect').and.callFake(
      jasmine.createSpy('getBoundingClientRect').and
        .returnValue(boundingClientRect));
    spyOn(autoplayedVideosService, 'hasVideoBeenAutoplayed').and
      .returnValue(true);
    spyOn(autoplayedVideosService, 'addAutoplayedVideo');

    component.videoId = 'mCtXAVZGjwk';
    component.videoIdWithValue = '&quot;xyz&quot;';

    component.ngOnChanges(changes);

    expect(component.videoId).toBe('xyz');
  });

  it('should not update video view if atleast one video parameters' +
    ' is empty', () => {
    component.videoIdWithValue = '';
    spyOn(htmlEscaperService, 'escapedJsonToObj');

    component.ngOnInit();

    expect(htmlEscaperService.escapedJsonToObj).not.toHaveBeenCalled();
    expect(component.start).toBeUndefined();
    expect(component.end).toBeUndefined();
    expect(component.videoId).toBeUndefined();
    expect(component.tabIndexVal).toBeUndefined();
  });
});
