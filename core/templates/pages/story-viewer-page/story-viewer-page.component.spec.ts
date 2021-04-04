// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for storyViewerPage.
 */

import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { StoryNode } from 'domain/story/story-node.model';
import { StoryPlaythrough, StoryPlaythroughBackendDict } from 'domain/story_viewer/story-playthrough.model';
import { StoryViewerPageComponent } from './story-viewer-page.component';
import { Pipe } from '@angular/core';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { UserService } from 'services/user.service';
import { StoryViewerBackendApiService } from 'domain/story_viewer/story-viewer-backend-api.service';
import { AlertsService } from 'services/alerts.service';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { UrlService } from 'services/contextual/url.service';
import { PageTitleService } from 'services/page-title.service';
import { UserInfo } from 'domain/user/user-info.model';
import { WindowRef } from 'services/contextual/window-ref.service';

 @Pipe({name: 'translate'})
class MockTranslatePipe {
   transform(value: string): string {
     return value;
   }
 }

class MockAssetsBackendApiService {
  getThumbnailUrlForPreview() {
    return 'thumbnail-url';
  }
}

fdescribe('Story Viewer Page component', () => {
  let httpTestingController = null;
  let component: StoryViewerPageComponent;
  let fixture: ComponentFixture<StoryViewerPageComponent>;
  let alertsService = null;
  let assetsBackendApiService: AssetsBackendApiService;
  let storyViewerBackendApiService: StoryViewerBackendApiService;
  let urlService: UrlService = null;
  let userService: UserService = null;
  let pageTitleService: PageTitleService = null;
  let windowRef: WindowRef;

  let topicUrlFragment = 'topic_1';
  let storyUrlFragment = 'story_1';


  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        StoryViewerPageComponent,
        MockTranslatePipe
      ],
      providers: [
        {
          provide: userService,
          useClass: UserService
        },
        {
          provide: assetsBackendApiService,
          useClass: MockAssetsBackendApiService
        },
        {
          provide: urlService,
          useClass: UrlService
        },
        {
          provide: pageTitleService,
          useClass: PageTitleService
        },
        { provide: StoryViewerBackendApiService,
          useValue: {
            fetchStoryDataAsync: () => (
              new Promise((resolve) => {
                resolve(
                  StoryPlaythrough.createFromBackendDict({
                    story_id: 'id',
                    story_nodes: [{
                      id: 'node_1',
                      title: 'Title 1',
                      description: 'Description 1',
                      destination_node_ids: [],
                      prerequisite_skill_ids: ['skill_1'],
                      acquired_skill_ids: ['skill_2'],
                      outline: 'Outline',
                      outline_is_finalized: false,
                      exploration_id: null,
                      exp_summary_dict: {
                        category: 'Welcome',
                        created_on_msec: 1564183471833.675,
                        community_owned: true,
                        thumbnail_bg_color: '#992a2b',
                        title: 'Welcome to Oppia!',
                        num_views: 14897,
                        tags: [],
                        last_updated_msec: 1571653541705.924,
                        human_readable_contributors_summary: {},
                        status: 'public',
                        language_code: 'en',
                        objective: "become familiar with Oppia's capabilities",
                        thumbnail_icon_url: '/subjects/Welcome.svg',
                        ratings: {
                          1: 1,
                          2: 1,
                          3: 3,
                          4: 24,
                          5: 46
                        },
                        id: '0',
                        activity_type: 'exploration'
                      },
                      completed: true,
                      thumbnail_bg_color: '#fff',
                      thumbnail_filename: 'story.svg'
                    }, {
                      id: 'node_2',
                      title: 'Title 2',
                      description: 'Description 2',
                      destination_node_ids: [],
                      prerequisite_skill_ids: ['skill_1'],
                      acquired_skill_ids: ['skill_2'],
                      outline: 'Outline',
                      outline_is_finalized: false,
                      exploration_id: null,
                      exp_summary_dict: {
                        category: 'Welcome',
                        created_on_msec: 1564183471833.675,
                        community_owned: true,
                        thumbnail_bg_color: '#992a2b',
                        title: 'Welcome to Oppia! 2',
                        num_views: 14897,
                        tags: [],
                        last_updated_msec: 1571653541705.924,
                        human_readable_contributors_summary: {},
                        status: 'public',
                        language_code: 'en',
                        objective:
                         "become familiar with Oppia's capabilities 2",
                        thumbnail_icon_url: '/subjects/Welcome.svg',
                        ratings: {
                          1: 1,
                          2: 1,
                          3: 3,
                          4: 24,
                          5: 46
                        },
                        id: '0',
                        activity_type: 'exploration'
                      },
                      completed: false,
                      thumbnail_bg_color: '#000',
                      thumbnail_filename: 'story.svg'
                    }],
                    story_title: 'Story Title 1',
                    story_description: 'Story Description 1',
                    topic_name: 'Topic 1',
                    meta_tag_content: 'Story Meta Tag Content'
                  }));
              })
            )
          }
        },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents().then(() => {
      fixture = TestBed.createComponent(
        StoryViewerPageComponent);
      component = fixture.componentInstance;
    });
    httpTestingController = TestBed.get(HttpTestingController);
    pageTitleService = TestBed.get(PageTitleService);
    assetsBackendApiService = TestBed.get(AssetsBackendApiService);
    storyViewerBackendApiService =
      TestBed.get(StoryViewerBackendApiService);
    windowRef = TestBed.get(WindowRef);
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      location: {
        reload: ()=>{},
        href: '/home'
      }
    });
  }));

  beforeEach(() => {
    urlService = TestBed.get(UrlService);
    userService = TestBed.get(UserService);
    alertsService = TestBed.get(AlertsService);

    spyOn(assetsBackendApiService, 'getThumbnailUrlForPreview').and
      .returnValue('thumbnail-url');

    const UserInfoObject = {
      is_moderator: false,
      is_admin: false,
      is_super_admin: false,
      is_topic_manager: false,
      can_create_collections: true,
      preferred_site_language_code: null,
      username: 'tester',
      email: 'test@test.com',
      user_is_logged_in: false
    };

    spyOn(userService, 'getUserInfoAsync').and.returnValue(Promise.resolve(
      UserInfo.createFromBackendDict(UserInfoObject))
    );

    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      topicUrlFragment);
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl')
      .and.returnValue('math');
    spyOn(
      urlService, 'getStoryUrlFragmentFromLearnerUrl').and.returnValue(
      'story');
  });

  afterEach(() => {
    httpTestingController.verify();
  });


  it('should get complete exploration url when clicking on svg element',
    () => {
      let node = StoryNode.createFromIdAndTitle(
        '1', 'Story node title');
      expect(component.getExplorationUrl(node)).toBe(
        '/explore/null?topic_url_fragment=topic_1&' +
         'classroom_url_fragment=math&story_url_fragment=story&' +
         'node_id=1');
    });

  it('should get complete image path corresponding to a given' +
    ' relative path', () => {
    let imagePath = '/path/to/image.png';
    expect(component.getStaticImageUrl(imagePath)).toBe(
      '/assets/images/path/to/image.png');
  });

  it('should not show story\'s chapters when story has no chapters',
    () => {
      spyOn(
        storyViewerBackendApiService, 'fetchStoryDataAsync').and.returnValue(
        Promise.resolve(StoryPlaythrough.createFromBackendDict({
          story_nodes: [],
          story_title: 'Story Title 1',
          story_description: 'Story Description 1',
          topic_name: 'topic_1',
        } as StoryPlaythroughBackendDict)));

      component.ngOnInit();

      expect(component.showChapters()).toBeFalse();
    });

  it('should sign in correctly', fakeAsync(() => {
    spyOn(userService, 'getLoginUrlAsync').and.resolveTo('/home');
    component.signIn();
    flushMicrotasks();
    expect(windowRef.nativeWindow.location.href).toBe('/home');
  }));

  it('should refresh page if login url is not provided when login button is' +
  ' clicked', fakeAsync(() => {
    const reloadSpy = spyOn(windowRef.nativeWindow.location, 'reload');
    spyOn(userService, 'getLoginUrlAsync')
      .and.resolveTo(null);
    component.signIn();
    flushMicrotasks();

    expect(reloadSpy).toHaveBeenCalled();
  }));

  // it('should use reject handler when fetching subtopic data fails',
  //   fakeAsync(() => {
  //     spyOn(alertsService, 'addWarning').and.callThrough();

  //     component.ngOnInit();
  //     let req = httpTestingController.expectOne(
  //       `/topic_data_handler/math/${topicUrlFragment}`);
  //     let errorObject = { status: 404, statusText: 'Not Found' };
  //     req.flush({ error: errorObject }, errorObject);
  //     flushMicrotasks();

  //     expect(alertsService.addWarning).toHaveBeenCalledWith(
  //       'Failed to get dashboard data');
  //   }));

  it('should show warnings when fetching story data fails',
    fakeAsync(() => {
      spyOn(alertsService, 'addWarning').and.callThrough();
      component.ngOnInit();

      let req = httpTestingController.expectOne(
        `/story_data_handler/classroom_1/topic_1/${storyUrlFragment}`);
      let errorObject = { status: 404, statusText: 'Not Found' };
      req.flush({ error: errorObject }, errorObject);

      flushMicrotasks();
      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Failed to get dashboard data');
      expect(component.pathIconParameters).toEqual([]);
    }));

  it('should show story\'s chapters when story has chapters', () => {
    spyOn(
      storyViewerBackendApiService, 'fetchStoryDataAsync').and.returnValue(
      Promise.resolve(StoryPlaythrough.createFromBackendDict({
        story_id: 'id',
        story_nodes: [{
          id: 'node_1',
          title: 'Title 1',
          description: 'Description 1',
          destination_node_ids: [],
          prerequisite_skill_ids: ['skill_1'],
          acquired_skill_ids: ['skill_2'],
          outline: 'Outline',
          outline_is_finalized: false,
          exploration_id: null,
          exp_summary_dict: {
            category: 'Welcome',
            created_on_msec: 1564183471833.675,
            community_owned: true,
            thumbnail_bg_color: '#992a2b',
            title: 'Welcome to Oppia!',
            num_views: 14897,
            tags: [],
            last_updated_msec: 1571653541705.924,
            human_readable_contributors_summary: {},
            status: 'public',
            language_code: 'en',
            objective: "become familiar with Oppia's capabilities",
            thumbnail_icon_url: '/subjects/Welcome.svg',
            ratings: {
              1: 1,
              2: 1,
              3: 3,
              4: 24,
              5: 46
            },
            id: '0',
            activity_type: 'exploration'
          },
          completed: true,
          thumbnail_bg_color: '#fff',
          thumbnail_filename: 'story.svg'
        }, {
          id: 'node_2',
          title: 'Title 2',
          description: 'Description 2',
          destination_node_ids: [],
          prerequisite_skill_ids: ['skill_1'],
          acquired_skill_ids: ['skill_2'],
          outline: 'Outline',
          outline_is_finalized: false,
          exploration_id: null,
          exp_summary_dict: {
            category: 'Welcome',
            created_on_msec: 1564183471833.675,
            community_owned: true,
            thumbnail_bg_color: '#992a2b',
            title: 'Welcome to Oppia! 2',
            num_views: 14897,
            tags: [],
            last_updated_msec: 1571653541705.924,
            human_readable_contributors_summary: {},
            status: 'public',
            language_code: 'en',
            objective:
                         "become familiar with Oppia's capabilities 2",
            thumbnail_icon_url: '/subjects/Welcome.svg',
            ratings: {
              1: 1,
              2: 1,
              3: 3,
              4: 24,
              5: 46
            },
            id: '0',
            activity_type: 'exploration'
          },
          completed: false,
          thumbnail_bg_color: '#000',
          thumbnail_filename: 'story.svg'
        }],
        story_title: 'Story Title 1',
        story_description: 'Story Description 1',
        topic_name: 'Topic 1',
        meta_tag_content: 'Story Meta Tag Content'
      })));
    component.ngOnInit();
    expect(component.showChapters()).toBeTrue();
  });
});
