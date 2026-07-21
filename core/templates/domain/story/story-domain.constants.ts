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
 * @fileoverview Constants for story domain.
 */

export const StoryDomainConstants = {
  EDITABLE_STORY_DATA_URL_TEMPLATE: '/story_editor_handler/data/<story_id>',

  STORY_URL_FRAGMENT_HANDLER_URL_TEMPLATE:
    '/story_url_fragment_handler/<story_url_fragment>',

  STORY_PUBLISH_URL_TEMPLATE: '/story_publish_handler/<story_id>',

  VALIDATE_EXPLORATIONS_URL_TEMPLATE: '/validate_story_explorations/<story_id>',

  // These should match the constants defined in core.domain.story_domain.
  CMD_ADD_STORY_NODE: 'add_story_node',
  CMD_DELETE_STORY_NODE: 'delete_story_node',
  CMD_UPDATE_STORY_NODE_OUTLINE_STATUS: 'update_story_node_outline_status',

  CMD_UPDATE_STORY_PROPERTY: 'update_story_property',
  CMD_UPDATE_STORY_NODE_PROPERTY: 'update_story_node_property',
  CMD_UPDATE_STORY_CONTENTS_PROPERTY: 'update_story_contents_property',

  STORY_PROPERTY_TITLE: 'title',
  STORY_PROPERTY_THUMBNAIL_FILENAME: 'thumbnail_filename',
  STORY_PROPERTY_THUMBNAIL_BG_COLOR: 'thumbnail_bg_color',
  STORY_PROPERTY_DESCRIPTION: 'description',
  STORY_PROPERTY_NOTES: 'notes',
  STORY_PROPERTY_LANGUAGE_CODE: 'language_code',
  STORY_PROPERTY_URL_FRAGMENT: 'url_fragment',
  STORY_PROPERTY_META_TAG_CONTENT: 'meta_tag_content',

  CMD_CREATE_ARC: 'create_arc',
  CMD_DELETE_ARC: 'delete_arc',
  CMD_RENAME_ARC: 'rename_arc',
  CMD_REARRANGE_ARCS: 'rearrange_arcs',
  CMD_MOVE_NODE_TO_ARC: 'move_node_to_arc',
  CMD_UPDATE_ARC_PROPERTY: 'update_arc_property',

  ARC_PROPERTY_TITLE: 'title',
  ARC_PROPERTY_DESCRIPTION: 'description',

  INITIAL_NODE_ID: 'initial_node_id',
  NODE: 'node',

  /**
   * Palette used to colour arc header backgrounds and book badges in both the
   * story-editor and topic-viewer pages.  Each entry has:
   *   headerBg  – light tint for the arc header card background
   *   headerBorder – border / rule colour
   *   bookBg    – solid colour for the circular book badge
   *   rowAccent – left-border accent shown on chapter rows inside this arc
   *
   * At least 15 entries are required so arcs cycle through distinct colours.
   */
  ARC_COLOR_PALETTE: [
    {
      headerBg: '#eaf4fb',
      headerBorder: '#8cbedc',
      bookBg: '#0072b2',
      rowAccent: '#0072b2',
    },
    {
      headerBg: '#fbefd9',
      headerBorder: '#e4b44e',
      bookBg: '#e69f00',
      rowAccent: '#e69f00',
    },
    {
      headerBg: '#eaf7f3',
      headerBorder: '#83cbb6',
      bookBg: '#009e73',
      rowAccent: '#009e73',
    },
    {
      headerBg: '#fdebec',
      headerBorder: '#e39ca5',
      bookBg: '#d55e00',
      rowAccent: '#d55e00',
    },
    {
      headerBg: '#f7eef8',
      headerBorder: '#cda3d5',
      bookBg: '#cc79a7',
      rowAccent: '#cc79a7',
    },
    {
      headerBg: '#f2f3f5',
      headerBorder: '#bcc3cc',
      bookBg: '#4d4d4d',
      rowAccent: '#4d4d4d',
    },
    {
      headerBg: '#eef6fe',
      headerBorder: '#9cc7f0',
      bookBg: '#56b4e9',
      rowAccent: '#56b4e9',
    },
    {
      headerBg: '#f2f0fc',
      headerBorder: '#b8afe7',
      bookBg: '#6a5acd',
      rowAccent: '#6a5acd',
    },
    {
      headerBg: '#edf8f5',
      headerBorder: '#9bd9ca',
      bookBg: '#20b2aa',
      rowAccent: '#20b2aa',
    },
    {
      headerBg: '#fef4e8',
      headerBorder: '#f0bf73',
      bookBg: '#f28e2b',
      rowAccent: '#f28e2b',
    },
    {
      headerBg: '#f7eef2',
      headerBorder: '#d7a9bc',
      bookBg: '#c2185b',
      rowAccent: '#c2185b',
    },
    {
      headerBg: '#eef4f8',
      headerBorder: '#a9c0d6',
      bookBg: '#5b8db8',
      rowAccent: '#5b8db8',
    },
    {
      headerBg: '#f5f7ea',
      headerBorder: '#c4d48c',
      bookBg: '#7a9a01',
      rowAccent: '#7a9a01',
    },
    {
      headerBg: '#f6f2ea',
      headerBorder: '#d4ba94',
      bookBg: '#8c6d31',
      rowAccent: '#8c6d31',
    },
    {
      headerBg: '#f3eef6',
      headerBorder: '#c6b3da',
      bookBg: '#7b5ba7',
      rowAccent: '#7b5ba7',
    },
  ] as const,

  STORY_NODE_PROPERTY_TITLE: 'title',
  STORY_NODE_PROPERTY_DESCRIPTION: 'description',
  STORY_NODE_PROPERTY_THUMBNAIL_FILENAME: 'thumbnail_filename',
  STORY_NODE_PROPERTY_THUMBNAIL_BG_COLOR: 'thumbnail_bg_color',
  STORY_NODE_PROPERTY_OUTLINE: 'outline',
  STORY_NODE_PROPERTY_EXPLORATION_ID: 'exploration_id',
  STORY_NODE_PROPERTY_DESTINATION_NODE_IDS: 'destination_node_ids',
  STORY_NODE_PROPERTY_ACQUIRED_SKILL_IDS: 'acquired_skill_ids',
  STORY_NODE_PROPERTY_PREREQUISITE_SKILL_IDS: 'prerequisite_skill_ids',
  STORY_NODE_PROPERTY_STATUS: 'status',
  STORY_NODE_PROPERTY_PLANNED_PUBLICATION_DATE_MSECS:
    'planned_publication_date_msecs',
  STORY_NODE_PROPERTY_LAST_MODIFIED_MSECS: 'last_modified_msecs',
  STORY_NODE_PROPERTY_FIRST_PUBLICATION_DATE_MSECS:
    'first_publication_date_msecs',
  STORY_NODE_PROPERTY_UNPUBLISHING_REASON: 'unpublishing_reason',
} as const;
