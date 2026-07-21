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
      headerBg: '#EAF4FB',
      headerBorder: '#8CBEDC',
      flagBg: '#0072B2',
      rowAccent: '#0072B2',
    },
    {
      headerBg: '#FBEFD9',
      headerBorder: '#E4B44E',
      flagBg: '#E69F00',
      rowAccent: '#E69F00',
    },
    {
      headerBg: '#EAF7F3',
      headerBorder: '#83CBB6',
      flagBg: '#009E73',
      rowAccent: '#009E73',
    },
    {
      headerBg: '#FDEBEC',
      headerBorder: '#E39CA5',
      flagBg: '#D55E00',
      rowAccent: '#D55E00',
    },
    {
      headerBg: '#F7EEF8',
      headerBorder: '#CDA3D5',
      flagBg: '#CC79A7',
      rowAccent: '#CC79A7',
    },
    {
      headerBg: '#F2F3F5',
      headerBorder: '#BCC3CC',
      flagBg: '#4D4D4D',
      rowAccent: '#4D4D4D',
    },
    {
      headerBg: '#EEF6FE',
      headerBorder: '#9CC7F0',
      flagBg: '#56B4E9',
      rowAccent: '#56B4E9',
    },
    {
      headerBg: '#F2F0FC',
      headerBorder: '#B8AFE7',
      flagBg: '#6A5ACD',
      rowAccent: '#6A5ACD',
    },
    {
      headerBg: '#EDF8F5',
      headerBorder: '#9BD9CA',
      flagBg: '#20B2AA',
      rowAccent: '#20B2AA',
    },
    {
      headerBg: '#FEF4E8',
      headerBorder: '#F0BF73',
      flagBg: '#F28E2B',
      rowAccent: '#F28E2B',
    },
    {
      headerBg: '#F7EEF2',
      headerBorder: '#D7A9BC',
      flagBg: '#C2185B',
      rowAccent: '#C2185B',
    },
    {
      headerBg: '#EEF4F8',
      headerBorder: '#A9C0D6',
      flagBg: '#5B8DB8',
      rowAccent: '#5B8DB8',
    },
    {
      headerBg: '#F5F7EA',
      headerBorder: '#C4D48C',
      flagBg: '#7A9A01',
      rowAccent: '#7A9A01',
    },
    {
      headerBg: '#F6F2EA',
      headerBorder: '#D4BA94',
      flagBg: '#8C6D31',
      rowAccent: '#8C6D31',
    },
    {
      headerBg: '#F3EEF6',
      headerBorder: '#C6B3DA',
      flagBg: '#7B5BA7',
      rowAccent: '#7B5BA7',
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
