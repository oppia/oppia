// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to get classroom data.
 */

import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {EventEmitter, Injectable} from '@angular/core';

import {ClassroomDomainConstants} from 'domain/classroom/classroom-domain.constants';
import {ClassroomData} from 'domain/classroom/classroom-data.model';
import {CreatorTopicSummaryBackendDict} from 'domain/topic/creator-topic-summary.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {ImageData} from 'pages/classroom-admin-page/existing-classroom.model';

export interface ClassroomDataBackendDict {
  classroom_id: string;
  name: string;
  url_fragment: string;
  topic_summary_dicts: CreatorTopicSummaryBackendDict[];
  course_details: string;
  teaser_text: string;
  topic_list_intro: string;
  is_published: boolean;
  is_diagnostic_test_enabled: boolean;
  thumbnail_data: ImageData;
  banner_data: ImageData;
  public_classrooms_count: number;
}

export interface classroomDisplayInfo {
  classroom_id: string;
  classroom_name: string;
  classroom_index: number;
}

interface classroomDisplayInfoBackendDict {
  classroom_display_info: classroomDisplayInfo[];
}

interface NewClassroomIdBackendDict {
  classroom_id: string;
}

interface ClassroomIdBackendDict {
  classroom_id: string;
}

export interface NewClassroomBackendDict {
  new_classroom_id: string;
}

export interface ClassroomBackendDict {
  classroom_id: string;
  name: string;
  url_fragment: string;
  course_details: string;
  teaser_text: string;
  topic_list_intro: string;
  topic_id_to_prerequisite_topic_ids: {
    [topicId: string]: string[];
  };
  is_published: boolean;
  is_diagnostic_test_enabled: boolean;
  thumbnail_data: ImageData;
  banner_data: ImageData;
}

export interface ClassroomDict {
  classroomId: string;
  name: string;
  urlFragment: string;
  courseDetails: string;
  teaserText: string;
  topicListIntro: string;
  topicIdToPrerequisiteTopicIds: {
    [topicId: string]: string[];
  };
  isPublished: boolean;
  isDiagnosticTestEnabled: boolean;
  thumbnailData: ImageData;
  bannerData: ImageData;
}

interface FetchClassroomDataBackendDict {
  classroom_dict: ClassroomBackendDict;
}

interface ClassroomDataResponse {
  classroomDict: ClassroomDict;
}

interface DoesClassroomWithUrlFragmentExistBackendResponse {
  classroom_url_fragment_exists: boolean;
}

export interface TopicClassroomRelationDict {
  topic_name: string;
  topic_id: string;
  classroom_name: string | null;
  classroom_url_fragment: string | null;
}

interface TopicsClassroomRelationBackendDict {
  topics_to_classrooms_relation: TopicClassroomRelationDict[];
}

export interface ClassroomSummaryDict {
  classroom_id: string;
  name: string;
  url_fragment: string;
  teaser_text: string;
  is_published: boolean;
  thumbnail_filename: string;
  thumbnail_bg_color: string;
}

interface AllClassroomsSummaryBackendDict {
  all_classrooms_summary: ClassroomSummaryDict[];
}

@Injectable({
  providedIn: 'root',
})
export class ClassroomBackendApiService {
  // This property is initialized using ClassroomData model and can be undefined
  // but not null so we need to do non-undefined assertion, for more
  // information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  classroomData!: ClassroomData;

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private http: HttpClient
  ) {}

  private _initializeTranslationEventEmitter = new EventEmitter<void>();

  _fetchClassroomData(
    classroomUrlFragment: string,
    successCallback: (value: ClassroomData) => void,
    errorCallback: (reason: string) => void
  ): void {
    let classroomDataUrl = this.urlInterpolationService.interpolateUrl(
      ClassroomDomainConstants.CLASSROOOM_DATA_URL_TEMPLATE,
      {
        classroom_url_fragment: classroomUrlFragment,
      }
    );
    this.http
      .get<ClassroomDataBackendDict>(classroomDataUrl)
      .toPromise()
      .then(
        response => {
          this.classroomData = ClassroomData.createFromBackendData(
            response.classroom_id,
            response.name,
            response.url_fragment,
            response.topic_summary_dicts,
            response.course_details,
            response.topic_list_intro,
            response.teaser_text,
            response.is_published,
            response.is_diagnostic_test_enabled,
            response.thumbnail_data,
            response.banner_data,
            response.public_classrooms_count
          );
          if (successCallback) {
            successCallback(this.classroomData);
          }
        },
        errorResponse => {
          if (errorCallback) {
            errorCallback(errorResponse?.error?.error);
          }
        }
      );
  }

  async fetchClassroomDataAsync(
    classroomUrlFragment: string
  ): Promise<ClassroomData> {
    return new Promise((resolve, reject) => {
      this._fetchClassroomData(classroomUrlFragment, resolve, reject);
    });
  }

  get onInitializeTranslation(): EventEmitter<void> {
    return this._initializeTranslationEventEmitter;
  }

  async getNewClassroomIdAsync(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.http
        .get<NewClassroomIdBackendDict>('/new_classroom_id_handler')
        .toPromise()
        .then(
          response => {
            resolve(response.classroom_id);
          },
          errorResponse => {
            reject(errorResponse?.error?.error);
          }
        );
    });
  }

  async getClassroomDataAsync(
    classroomId: string
  ): Promise<ClassroomDataResponse> {
    return new Promise((resolve, reject) => {
      let classroomUrl = this.urlInterpolationService.interpolateUrl(
        ClassroomDomainConstants.CLASSROOM_HANDLER_URL_TEMPLATE,
        {
          classroom_id: classroomId,
        }
      );

      this.http
        .get<FetchClassroomDataBackendDict>(classroomUrl)
        .toPromise()
        .then(
          response => {
            resolve({
              classroomDict: {
                classroomId: response.classroom_dict.classroom_id,
                name: response.classroom_dict.name,
                urlFragment: response.classroom_dict.url_fragment,
                courseDetails: response.classroom_dict.course_details,
                teaserText: response.classroom_dict.teaser_text,
                topicListIntro: response.classroom_dict.topic_list_intro,
                topicIdToPrerequisiteTopicIds:
                  response.classroom_dict.topic_id_to_prerequisite_topic_ids,
                isPublished: response.classroom_dict.is_published,
                isDiagnosticTestEnabled:
                  response.classroom_dict.is_diagnostic_test_enabled,
                thumbnailData: response.classroom_dict.thumbnail_data,
                bannerData: response.classroom_dict.banner_data,
              },
            });
          },
          errorResponse => {
            reject(errorResponse?.error?.error);
          }
        );
    });
  }

  async updateClassroomDataAsync(
    classroomId: string,
    classroomDict: ClassroomBackendDict
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let classroomUrl = this.urlInterpolationService.interpolateUrl(
        ClassroomDomainConstants.CLASSROOM_HANDLER_URL_TEMPLATE,
        {
          classroom_id: classroomId,
        }
      );
      let body = new FormData();
      body.append(
        'payload',
        JSON.stringify({
          classroom_dict: {
            classroom_id: classroomDict.classroom_id,
            name: classroomDict.name,
            url_fragment: classroomDict.url_fragment,
            course_details: classroomDict.course_details,
            topic_list_intro: classroomDict.topic_list_intro,
            topic_id_to_prerequisite_topic_ids:
              classroomDict.topic_id_to_prerequisite_topic_ids,
            teaser_text: classroomDict.teaser_text,
            is_published: classroomDict.is_published,
            is_diagnostic_test_enabled:
              classroomDict.is_diagnostic_test_enabled,
            thumbnail_data: {
              filename: classroomDict.thumbnail_data.filename,
              bg_color: classroomDict.thumbnail_data.bg_color,
              size_in_bytes: classroomDict.thumbnail_data.size_in_bytes,
            },
            banner_data: {
              filename: classroomDict.banner_data.filename,
              bg_color: classroomDict.banner_data.bg_color,
              size_in_bytes: classroomDict.banner_data.size_in_bytes,
            },
            index: 0,
          },
        })
      );
      body.append(
        'thumbnail_image',
        classroomDict.thumbnail_data.image_data ?? ''
      );
      body.append('banner_image', classroomDict.banner_data.image_data ?? '');

      this.http
        .put<void>(classroomUrl, body)
        .toPromise()
        .then(
          response => {
            resolve(response);
          },
          errorResponse => {
            reject(errorResponse?.error?.error);
          }
        );
    });
  }

  async createNewClassroomAsync(
    name: string,
    urlFragment: string
  ): Promise<NewClassroomBackendDict> {
    return new Promise((resolve, reject) => {
      let newClassroomUrl = ClassroomDomainConstants.NEW_CLASSROOM_HANDLER_URL;

      this.http
        .post<NewClassroomBackendDict>(newClassroomUrl, {
          name,
          url_fragment: urlFragment,
        })
        .toPromise()
        .then(
          response => {
            resolve(response);
          },
          errorResponse => {
            reject(errorResponse?.error?.error);
          }
        );
    });
  }

  async deleteClassroomAsync(classroomId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      let classroomUrl = this.urlInterpolationService.interpolateUrl(
        ClassroomDomainConstants.CLASSROOM_HANDLER_URL_TEMPLATE,
        {
          classroom_id: classroomId,
        }
      );

      this.http
        .delete<void>(classroomUrl)
        .toPromise()
        .then(
          response => {
            resolve(response);
          },
          errorResponse => {
            reject(errorResponse?.error?.error);
          }
        );
    });
  }

  async getAllClassroomDisplayInfoDictAsync(): Promise<classroomDisplayInfo[]> {
    return new Promise((resolve, reject) => {
      this.http
        .get<classroomDisplayInfoBackendDict>(
          ClassroomDomainConstants.CLASSROOM_DISPLAY_INFO_HANDLER_URL_TEMPLATE
        )
        .toPromise()
        .then(
          response => {
            resolve(response.classroom_display_info);
          },
          errorResponse => {
            reject(errorResponse?.error?.error);
          }
        );
    });
  }

  private _doesClassroomWithUrlFragmentExist(
    classroomUrlFragment: string,
    successCallback: (value: boolean) => void,
    errorCallback: (errorResponse: HttpErrorResponse) => void
  ): void {
    const classroomUrlFragmentUrl = this.urlInterpolationService.interpolateUrl(
      '/classroom_url_fragment_handler/<classroom_url_fragment>',
      {
        classroom_url_fragment: classroomUrlFragment,
      }
    );

    this.http
      .get<DoesClassroomWithUrlFragmentExistBackendResponse>(
        classroomUrlFragmentUrl
      )
      .toPromise()
      .then(
        response => {
          if (successCallback) {
            successCallback(response.classroom_url_fragment_exists);
          }
        },
        errorResponse => {
          errorCallback(errorResponse);
        }
      );
  }

  async doesClassroomWithUrlFragmentExistAsync(
    classroomUrlFragment: string
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this._doesClassroomWithUrlFragmentExist(
        classroomUrlFragment,
        resolve,
        reject
      );
    });
  }

  async getClassroomIdAsync(classroomUrlFragment: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const classroomIdUrl = this.urlInterpolationService.interpolateUrl(
        '/classroom_id_handler/<classroom_url_fragment>',
        {
          classroom_url_fragment: classroomUrlFragment,
        }
      );
      this.http
        .get<ClassroomIdBackendDict>(classroomIdUrl)
        .toPromise()
        .then(
          response => {
            resolve(response.classroom_id);
          },
          errorResponse => {
            reject(errorResponse?.error?.error);
          }
        );
    });
  }

  async getAllTopicsToClassroomRelation(): Promise<
    TopicClassroomRelationDict[]
  > {
    return new Promise((resolve, reject) => {
      const topicsClassroomInfoUrl =
        ClassroomDomainConstants.TOPICS_TO_CLASSROOM_RELATION_HANDLER_URL;

      this.http
        .get<TopicsClassroomRelationBackendDict>(topicsClassroomInfoUrl)
        .toPromise()
        .then(
          response => {
            resolve(response.topics_to_classrooms_relation);
          },
          errorResponse => {
            reject(errorResponse?.error?.error);
          }
        );
    });
  }

  async getAllClassroomsSummaryAsync(): Promise<ClassroomSummaryDict[]> {
    return new Promise((resolve, reject) => {
      const topicsClassroomInfoUrl =
        ClassroomDomainConstants.ALL_CLASSROOMS_SUMMARY_HANDLER_URL;

      this.http
        .get<AllClassroomsSummaryBackendDict>(topicsClassroomInfoUrl)
        .toPromise()
        .then(
          response => {
            resolve(response.all_classrooms_summary);
          },
          errorResponse => {
            reject(errorResponse?.error?.error);
          }
        );
    });
  }

  updateClassroomIndexMappingAsync(
    classroomDisplayInfoDicts: classroomDisplayInfo[]
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const body = new FormData();
      body.append(
        'payload',
        JSON.stringify({
          classroom_index_mappings: classroomDisplayInfoDicts,
        })
      );

      this.http
        .put<void>('/update_classrooms_order', body)
        .toPromise()
        .then(
          () => {
            resolve();
          },
          errorResponse => {
            reject(errorResponse?.error?.error);
          }
        );
    });
  }
}
