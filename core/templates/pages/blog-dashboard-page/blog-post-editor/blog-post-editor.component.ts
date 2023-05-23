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
 * @fileoverview Component for a blog dashboard card.
 */

interface EditorSchema {
  type: string;
  'ui_config': object;
}

import { AppConstants } from 'app.constants';
import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { AlertsService } from 'services/alerts.service';
import { BlogPostEditorData, BlogPostEditorBackendApiService } from 'domain/blog/blog-post-editor-backend-api.service';
import { BlogPostUpdateService } from 'domain/blog/blog-post-update.service';
import { BlogDashboardPageConstants } from 'pages/blog-dashboard-page/blog-dashboard-page.constants';
import { BlogDashboardPageService } from 'pages/blog-dashboard-page/services/blog-dashboard-page.service';
import { BlogPostData } from 'domain/blog/blog-post.model';
import { LoaderService } from 'services/loader.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BlogPostActionConfirmationModalComponent } from 'pages/blog-dashboard-page/blog-post-action-confirmation/blog-post-action-confirmation.component';
import { UploadBlogPostThumbnailModalComponent } from 'pages/blog-dashboard-page/modal-templates/upload-blog-post-thumbnail-modal.component';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import dayjs from 'dayjs';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { BlogCardPreviewModalComponent } from 'pages/blog-dashboard-page/modal-templates/blog-card-preview-modal.component';
import { PreventPageUnloadEventService } from 'services/prevent-page-unload-event.service';
import { UserService } from 'services/user.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
@Component({
  selector: 'oppia-blog-post-editor',
  templateUrl: './blog-post-editor.component.html'
})
export class BlogPostEditorComponent implements OnInit {
  @ViewChild('titleInput') titleInput!: ElementRef;
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  blogPostData!: BlogPostData;
  blogPostId!: string;
  authorProfilePicPngUrl!: string;
  authorProfilePicWebpUrl!: string;
  uploadedImageDataUrl!: string;
  title!: string;
  defaultTagsList!: string[];
  maxAllowedTags!: number;
  username!: string | null;
  localEditedContent!: string;
  thumbnailDataUrl!: string;
  MAX_CHARS_IN_BLOG_POST_TITLE!: number;
  MIN_CHARS_IN_BLOG_POST_TITLE!: number;
  dateTimeLastSaved: string = '';
  authorName: string = '';
  windowIsNarrow: boolean = false;
  contentEditorIsActive: boolean = false;
  invalidImageWarningIsShown: boolean = false;
  newChangesAreMade: boolean = false;
  lastChangesWerePublished: boolean = false;
  saveInProgress: boolean = false;
  publishingInProgress: boolean = false;
  titleEditorIsActive: boolean = false;
  HTML_SCHEMA: EditorSchema = {
    type: 'html',
    ui_config: {
      hide_complex_extensions: false,
      startupFocusEnabled: false
    }
  };

  BLOG_POST_TITLE_PATTERN: string = AppConstants.VALID_BLOG_POST_TITLE_REGEX;

  constructor(
    private alertsService: AlertsService,
    private assetsBackendApiService: AssetsBackendApiService,
    private blogDashboardPageService: BlogDashboardPageService,
    private blogPostEditorBackendService: BlogPostEditorBackendApiService,
    private blogPostUpdateService: BlogPostUpdateService,
    private changeDetectorRef: ChangeDetectorRef,
    private imageLocalStorageService: ImageLocalStorageService,
    private loaderService: LoaderService,
    private ngbModal: NgbModal,
    private windowDimensionService: WindowDimensionsService,
    private preventPageUnloadEventService: PreventPageUnloadEventService,
    private userService: UserService,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  async getUserInfoAsync(): Promise<void> {
    const userInfo = await this.userService.getUserInfoAsync();
    this.username = userInfo.getUsername();
    if (this.username !== null) {
      [this.authorProfilePicPngUrl, this.authorProfilePicWebpUrl] = (
        this.userService.getProfileImageDataUrl(this.username));
    } else {
      this.authorProfilePicWebpUrl = (
        this.urlInterpolationService.getStaticImageUrl(
          AppConstants.DEFAULT_PROFILE_IMAGE_WEBP_PATH));
      this.authorProfilePicPngUrl = (
        this.urlInterpolationService.getStaticImageUrl(
          AppConstants.DEFAULT_PROFILE_IMAGE_PNG_PATH));
    }
  }

  ngOnInit(): void {
    this.loaderService.showLoadingScreen('Loading');
    this.getUserInfoAsync();
    this.blogPostId = this.blogDashboardPageService.blogPostId;
    this.initEditor();
    this.MAX_CHARS_IN_BLOG_POST_TITLE = (
      AppConstants.MAX_CHARS_IN_BLOG_POST_TITLE);
    this.MIN_CHARS_IN_BLOG_POST_TITLE = (
      AppConstants.MIN_CHARS_IN_BLOG_POST_TITLE);
    this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();
    this.windowDimensionService.getResizeEvent().subscribe(() => {
      this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();
      if (this.windowIsNarrow && this.uploadedImageDataUrl) {
        this.blogDashboardPageService.imageUploaderIsNarrow = true;
      }
    });
  }

  getSchema(): EditorSchema {
    return this.HTML_SCHEMA;
  }

  initEditor(): void {
    this.blogPostEditorBackendService.fetchBlogPostEditorData(this.blogPostId)
      .then(
        (editorData: BlogPostEditorData) => {
          this.blogPostData = editorData.blogPostDict;
          this.authorName = editorData.displayedAuthorName;
          this.defaultTagsList = editorData.listOfDefaulTags;
          this.maxAllowedTags = editorData.maxNumOfTags;
          this.title = this.blogPostData.title;
          if (this.title.length === 0) {
            this.titleEditorIsActive = true;
          }
          let lastUpdated = this.blogPostData.lastUpdated;
          if (lastUpdated) {
            this.dateTimeLastSaved = this.getDateStringInWords(lastUpdated);
          }
          this.contentEditorIsActive = Boolean(
            this.blogPostData.content.length === 0);
          if (this.blogPostData.thumbnailFilename) {
            this.thumbnailDataUrl = this.assetsBackendApiService
              .getThumbnailUrlForPreview(
                AppConstants.ENTITY_TYPE.BLOG_POST, this.blogPostId,
                this.blogPostData.thumbnailFilename);
            if (this.windowIsNarrow) {
              this.blogDashboardPageService.imageUploaderIsNarrow = true;
            }
          }
          if (this.blogPostData.publishedOn && this.blogPostData.lastUpdated) {
            if (this.blogPostData.lastUpdated.slice(0, -8) === (
              this.blogPostData.publishedOn.slice(0, -8))) {
              this.lastChangesWerePublished = true;
            }
          }
          this.blogDashboardPageService.setNavTitle(
            this.lastChangesWerePublished, this.title);
          this.newChangesAreMade = false;
          this.preventPageUnloadEventService.removeListener();
          this.loaderService.hideLoadingScreen();
        }, (errorResponse) => {
          if (
            AppConstants.FATAL_ERROR_CODES.indexOf(
              errorResponse) !== -1) {
            this.alertsService.addWarning(
              'Failed to get Blog Post Data. The Blog Post was either' +
              ' deleted or the Blog Post ID is invalid.');
            this.blogDashboardPageService.navigateToMainTab();
          }
        });
  }

  getDateStringInWords(naiveDateTime: string): string {
    let datestring = naiveDateTime.substring(0, naiveDateTime.length - 7);
    return dayjs(
      datestring, 'MM-DD-YYYY, HH:mm:ss').format('MMMM D, YYYY [at] hh:mm A');
  }

  updateLocalTitleValue(): void {
    this.blogPostUpdateService.setBlogPostTitle(
      this.blogPostData, this.title
    );
    this.titleEditorIsActive = false;
    if (
      this.isTitlePatternValid() &&
      this.title.length <= this.MAX_CHARS_IN_BLOG_POST_TITLE &&
      this.title.length >= this.MIN_CHARS_IN_BLOG_POST_TITLE
    ) {
      this.blogPostEditorBackendService.doesPostWithGivenTitleAlreadyExistAsync(
        this.blogPostId, this.title
      ).then((response: boolean) => {
        if (!response) {
          this.blogPostData.titleIsDuplicate = false;
          this.newChangesAreMade = true;
          this.blogDashboardPageService.setNavTitle(
            this.lastChangesWerePublished, this.title
          );
        } else {
          this.blogPostData.titleIsDuplicate = true;
          this.alertsService.addWarning(
            'Blog Post with the given title exists already. Please use a ' +
            'different title.'
          );
        }
      }, error => {
        this.alertsService.addWarning(
          `Failed to check if title is unique. Internal Error: ${error}`
        );
      });
      this.preventPageUnloadEventService.addListener();
    }
  }

  isTitlePatternValid(): boolean {
    let titleRegex: RegExp = new RegExp(this.BLOG_POST_TITLE_PATTERN);
    return titleRegex.test(this.title);
  }

  cancelEdit(): void {
    if (this.blogPostData.content.length > 0) {
      this.contentEditorIsActive = false;
    }
  }

  updateLocalEditedContent($event: string): void {
    if (this.localEditedContent !== $event) {
      this.localEditedContent = $event;
      this.changeDetectorRef.detectChanges();
    }
  }

  activateTitleEditor(): void {
    this.titleInput.nativeElement.focus();
    this.titleEditorIsActive = true;
  }

  updateContentValue(): void {
    this.blogPostUpdateService.setBlogPostContent(
      this.blogPostData, this.localEditedContent);
    if (this.blogPostData.content.length > 0) {
      this.contentEditorIsActive = false;
    }
    this.newChangesAreMade = true;
    this.preventPageUnloadEventService.addListener();
  }

  saveDraft(): void {
    this.saveInProgress = true;
    let issues = this.blogPostData.validate();
    if (issues.length === 0) {
      this.updateBlogPostData(false);
    } else {
      this.alertsService.addWarning(
        'Please fix the errors.'
      );
      this.saveInProgress = false;
    }
  }

  publishBlogPost(): void {
    this.publishingInProgress = true;
    let issues = this.blogPostData.prepublishValidate(this.maxAllowedTags);
    if (issues.length === 0) {
      this.blogDashboardPageService.blogPostAction = (
        BlogDashboardPageConstants.BLOG_POST_ACTIONS.PUBLISH);
      this.ngbModal.open(BlogPostActionConfirmationModalComponent, {
        backdrop: 'static',
        keyboard: false,
      }).result.then(() => {
        this.updateBlogPostData(true);
      }, () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        this.publishingInProgress = false;
      });
    }
  }

  updateBlogPostData(isBlogPostPublished: boolean): void {
    this.blogPostUpdateService.setBlogPostTags(
      this.blogPostData, this.blogPostData.tags);
    let changeDict = this.blogPostUpdateService.getBlogPostChangeDict();
    this.blogPostEditorBackendService.updateBlogPostDataAsync(
      this.blogPostId, isBlogPostPublished, changeDict).then(
      () => {
        if (isBlogPostPublished) {
          this.alertsService.addSuccessMessage(
            'Blog Post Saved and Published Successfully.'
          );
          this.lastChangesWerePublished = true;
          this.publishingInProgress = false;
        } else {
          this.alertsService.addSuccessMessage(
            'Blog Post Saved Successfully.');
          this.lastChangesWerePublished = false;
          this.saveInProgress = false;
        }
        this.newChangesAreMade = false;
        this.blogDashboardPageService.setNavTitle(
          this.lastChangesWerePublished, this.title);
        this.preventPageUnloadEventService.removeListener();
      }, (errorResponse) => {
        this.alertsService.addWarning(
          `Failed to save Blog Post. Internal Error: ${errorResponse}`);
        this.saveInProgress = false;
        this.publishingInProgress = false;
      }
    );
  }

  postImageDataToServer(): void {
    let imagesData = this.imageLocalStorageService.getStoredImagesData();
    this.blogPostUpdateService.setBlogPostThumbnail(
      this.blogPostData, imagesData);
    this.blogPostEditorBackendService.postThumbnailDataAsync(
      this.blogPostId, imagesData).then(
      () => {
        if (this.windowIsNarrow) {
          this.blogDashboardPageService.imageUploaderIsNarrow = true;
        }
        this.alertsService.addSuccessMessage(
          'Thumbnail Saved Successfully.');
      }, (errorResponse) => {
        this.alertsService.addWarning(
          `Failed to save thumbnail data. Internal Error: ${errorResponse}`
        );
        this.imageLocalStorageService.flushStoredImagesData();
        this.thumbnailDataUrl = '';
      });
  }

  deleteBlogPost(): void {
    this.blogDashboardPageService.blogPostAction = 'delete';
    this.ngbModal.open(BlogPostActionConfirmationModalComponent, {
      backdrop: 'static',
      keyboard: false,
    }).result.then(() => {
      this.blogDashboardPageService.deleteBlogPost();
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  onTagChange(tag: string): void {
    if ((this.blogPostData.tags).includes(tag)) {
      this.blogPostData.removeTag(tag);
    } else if ((this.blogPostData.tags).length < this.maxAllowedTags) {
      this.blogPostData.addTag(tag);
    }
    this.newChangesAreMade = true;
    this.preventPageUnloadEventService.addListener();
  }

  showuploadThumbnailModal(): void {
    let modalRef = this.ngbModal.open(UploadBlogPostThumbnailModalComponent, {
      backdrop: 'static'
    });
    if (this.thumbnailDataUrl) {
      this.imageLocalStorageService.flushStoredImagesData();
    }
    modalRef.result.then((imageDataUrl) => {
      this.saveBlogPostThumbnail(imageDataUrl);
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  saveBlogPostThumbnail(thumbnailDataUrl: string): void {
    this.thumbnailDataUrl = thumbnailDataUrl;
    this.postImageDataToServer();
    this.newChangesAreMade = true;
    this.preventPageUnloadEventService.addListener();
  }

  showPreview(): void {
    this.blogDashboardPageService.blogPostData = this.blogPostData;
    this.ngbModal.open(BlogCardPreviewModalComponent, {
      backdrop: 'static'
    });
  }

  isPublishButtonDisabled(): boolean {
    if (this.blogPostData.titleIsDuplicate) {
      return true;
    } else if (
      this.blogPostData.prepublishValidate(this.maxAllowedTags).length > 0
    ) {
      return true;
    } else if (this.newChangesAreMade) {
      return false;
    } else if (!this.lastChangesWerePublished) {
      return false;
    } else {
      return true;
    }
  }
}

angular.module('oppia').directive('oppiaBlogPostEditor',
    downgradeComponent({
      component: BlogPostEditorComponent
    }) as angular.IDirectiveFactory);
