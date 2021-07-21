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
 * @fileoverview File for declaring types for Blog interface.
 */

import { BlogPostData } from 'domain/blog/BlogPostObjectFactory';
import { BlogPostSummary } from 'domain/blog/blog-post-summary.model';

declare namespace Blog {
  interface BlogPostSummaryBackendDict {
    'id': string;
    'title': string;
    'summary': string;
    'author_username': string;
    'tags': string[];
    'url_fragment': string;
    'thumbnail_filename': string | null;
    'published_on'?: number;
    'last_updated': number;
  }

  interface BlogPostChangeDict {
    'title'?: string,
    'thumbnail_filename'?: string,
    'content'?: string,
    'tags'?: string[],
  }

  interface BlogPostUpdateBackendDict {
    'blog_post': BlogPostBackendDict;
  }

  interface BlogPostBackendDict {
    'id': string;
    'author_username': string;
    'title': string;
    'content': string;
    'thumbnail_filename': string | null;
    'tags': string[];
    'url_fragment': string;
    'last_updated'?: number;
    'published_on'?: number;
  }

  interface BlogPostEditorBackendResponse {
    'blog_post_dict': BlogPostBackendDict;
    'username': string;
    'profile_picture_data_url': string;
    'max_no_of_tags': number;
    'list_of_default_tags': string[];
  }

  interface BlogDashboardBackendResponse {
    'username': string;
    'profile_picture_data_url': string;
    'no_of_published_blog_posts': number;
    'no_of_draft_blog_posts': number;
    'published_blog_post_summary_dicts': BlogPostSummaryBackendDict[];
    'draft_blog_post_summary_dicts': BlogPostSummaryBackendDict[];
  }

  interface NewBlogPostBackendResponse {
    'blog_post_id': string
  }

  interface ImageData {
    filename: string,
    imageBlob: Blob
  }

  interface BlogPostUpdatedData {
    blogPostDict: BlogPostData
  }

  interface DeleteBlogPostBackendResponse {
    status: number;
  }

  interface BlogPostEditorData {
    blogPostDict: BlogPostData;
    username: string;
    profilePictureDataUrl: string;
    maxNumOfTags: number;
    listOfDefaulTags: string[];
  }

  interface BlogDashboardData {
    username: string;
    profilePictureDataUrl: string;
    numOfPublishedBlogPosts: number;
    numOfDraftBlogPosts: number;
    publishedBlogPostSummaryDicts: BlogPostSummary[];
    draftBlogPostSummaryDicts: BlogPostSummary[]
  }
}
