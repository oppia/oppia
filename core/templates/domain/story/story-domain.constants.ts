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
   * Palette used to colour arc header backgrounds and flag badges in both the
   * story-editor and topic-viewer pages.  Each entry has:
   *   headerBg  – light tint for the arc header card background
   *   headerBorder – border / rule colour
   *   flagBg    – solid colour for the circular flag badge
   *   rowAccent – left-border accent shown on chapter rows inside this arc
   *
   * At least 15 entries are required so arcs cycle through distinct colours.
   */
  ARC_COLOR_PALETTE: [
    {
      headerBg: '#eef7ef',
      headerBorder: '#b8dbbf',
      flagBg: '#27a844',
      rowAccent: '#27a844',
    },
    {
      headerBg: '#eef3fb',
      headerBorder: '#bdd0ed',
      flagBg: '#2c6ecb',
      rowAccent: '#2c6ecb',
    },
    {
      headerBg: '#fdf6e3',
      headerBorder: '#e8d28a',
      flagBg: '#c9860a',
      rowAccent: '#c9860a',
    },
    {
      headerBg: '#fef0f0',
      headerBorder: '#f0baba',
      flagBg: '#d63031',
      rowAccent: '#d63031',
    },
    {
      headerBg: '#f3eefb',
      headerBorder: '#cbb8e8',
      flagBg: '#6741c9',
      rowAccent: '#6741c9',
    },
    {
      headerBg: '#e8f7f5',
      headerBorder: '#9fd5cd',
      flagBg: '#00897b',
      rowAccent: '#00897b',
    },
    {
      headerBg: '#fef3ec',
      headerBorder: '#f0c898',
      flagBg: '#e07b12',
      rowAccent: '#e07b12',
    },
    {
      headerBg: '#edf0fb',
      headerBorder: '#b4beeb',
      flagBg: '#3949ab',
      rowAccent: '#3949ab',
    },
    {
      headerBg: '#f3f6e8',
      headerBorder: '#c4d180',
      flagBg: '#7b8c0e',
      rowAccent: '#7b8c0e',
    },
    {
      headerBg: '#fdeef3',
      headerBorder: '#e8b2c5',
      flagBg: '#b5174f',
      rowAccent: '#b5174f',
    },
    {
      headerBg: '#e4f8fc',
      headerBorder: '#8fd7e5',
      flagBg: '#0097a7',
      rowAccent: '#0097a7',
    },
    {
      headerBg: '#eef0f3',
      headerBorder: '#b6bfcc',
      flagBg: '#455a64',
      rowAccent: '#455a64',
    },
    {
      headerBg: '#fbeef8',
      headerBorder: '#dda8d5',
      flagBg: '#a0288e',
      rowAccent: '#a0288e',
    },
    {
      headerBg: '#f5ede8',
      headerBorder: '#d6a98a',
      flagBg: '#7b4719',
      rowAccent: '#7b4719',
    },
    {
      headerBg: '#e9f5ec',
      headerBorder: '#94c9a0',
      flagBg: '#2e7d32',
      rowAccent: '#2e7d32',
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
