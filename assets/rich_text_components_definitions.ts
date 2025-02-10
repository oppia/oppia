/* eslint-disable */
/* Don't modify anything outside the {} brackets.
 * The contents of the {} brackets should be formatted as a JSON object.
 * JSON rules:
 * 1. All keys and string values must be enclosed in double quotes.
 * 2. Each key/value pair should be on a new line.
 * 3. All values and keys must be constant, you can't use any JavaScript
 *    functions.
 */

/**
 * @fileoverview Definitions for rich text components.
 *
 * NOTE TO DEVELOPERS: If a new inline element is added (i.e 'is_block_element'
 * is false), then make sure to add .cke_widget_<element id> {display: inline;}
 * style to the element's directive HTML and add a CSS style similar to
 * oppia-noninteractive-link in oppia.css for the new directive.
 */

export default {
  "Collapsible": {
    "backend_id": "Collapsible",
    "category": "Basic Input",
    "description": "A collapsible block of HTML.",
    "frontend_id": "collapsible",
    "tooltip": "Insert collapsible block",
    "icon_data_url": "/rich_text_components/Collapsible/Collapsible.png",
    "is_complex": true,
    "requires_internet": false,
    "requires_fs": false,
    "is_block_element": true,
    "customization_arg_specs": [{
      "name": "heading",
      "description": "The heading for the collapsible block",
      "schema": {
        "type": "unicode"
      },
      "default_value_obtainable_from_highlight": false,
      "default_value": "Sample Header"
    }, {
      "name": "content",
      "description": "The content of the collapsible block",
      "schema": {
        "type": "html",
        "ui_config": {
          "hide_complex_extensions": true
        }
      },
      "default_value_obtainable_from_highlight": false,
      "default_value": "You have opened the collapsible block."
    }]
  },
  "Image": {
    "backend_id": "Image",
    "category": "Basic Input",
    "description": "An image.",
    "frontend_id": "image",
    "tooltip": "Insert image",
    "icon_data_url": "/rich_text_components/Image/Image.png",
    "is_complex": false,
    "requires_internet": true,
    "requires_fs": true,
    "is_block_element": true,
    "customization_arg_specs": [{
      "name": "filepath",
      "description": "The image (Allowed extensions: gif, jpeg, jpg, png, svg)",
      "schema": {
        "type": "custom",
        "obj_type": "Filepath"
      },
      "default_value_obtainable_from_highlight": false,
      "default_value": ""
    }, {
      "name": "caption",
      "description": "Caption for image (optional)",
      "schema": {
        "type": "unicode",
        "validators": [{
          "id": "has_length_at_most",
          "max_value": 500
        }]
      },
      "default_value_obtainable_from_highlight": false,
      "default_value": ""
    }, {
      "name": "alt",
      "description": "Briefly explain this image to a visually impaired learner",
      "schema": {
        "type": "unicode",
        "validators": [{
          "id": "has_length_at_least",
          "min_value": 5
        }],
        "ui_config": {
          "placeholder": "Description of Image (Example : George Handel, 18th century baroque composer)",
          "rows": 3
        }
      },
      "default_value_obtainable_from_highlight": false,
      "default_value": ""
    }]
  },
  "Link": {
    "backend_id": "Link",
    "category": "Basic Input",
    "description": "A link to a URL.",
    "frontend_id": "link",
    "tooltip": "Insert link",
    "icon_data_url": "/rich_text_components/Link/Link.png",
    "is_complex": false,
    "requires_internet": false,
    "requires_fs": false,
    "is_block_element": false,
    "customization_arg_specs": [{
      "name": "url",
      "description": "The link URL. If no protocol is specified, HTTPS will be used.",
      "schema": {
        "type": "custom",
        "obj_type": "SanitizedUrl"
      },
      "default_value_obtainable_from_highlight": false,
      "default_value": ""
    }, {
      "name": "text",
      "description": "The link text. If left blank, the link URL will be used.",
      "schema": {
        "type": "unicode"
      },
      "default_value_obtainable_from_highlight": false,
      "default_value": ""
    }]
  },
  "Math": {
    "backend_id": "Math",
    "category": "Basic Input",
    "description": "A math formula.",
    "frontend_id": "math",
    "tooltip": "Insert mathematical formula",
    "icon_data_url": "/rich_text_components/Math/Math.png",
    "is_complex": false,
    "requires_internet": true,
    "requires_fs": false,
    "is_block_element": false,
    "customization_arg_specs": [{
      "name": "math_content",
      "description": "The Math Expression to be displayed.",
      "schema": {
        "type": "custom",
        "obj_type": "MathExpressionContent"
      },
      "default_value_obtainable_from_highlight": false,
      "default_value": {
        "raw_latex": "",
        "svg_filename": ""
      }
    }]
  },
  "Skillreview": {
    "backend_id": "skillreview",
    "category": "Basic Input",
    "description": "A link to the concept card of the linked skill.",
    "frontend_id": "skillreview",
    "tooltip": "Insert Concept Card Link",
    "icon_data_url": "/rich_text_components/Skillreview/Skillreview.png",
    "is_complex": false,
    "requires_internet": true,
    "requires_fs": false,
    "is_block_element": false,
    "customization_arg_specs": [{
      "name": "text",
      "description": "The text to be displayed",
      "schema": {
        "type": "unicode",
        "validators": [{
          "id": "is_nonempty"
        }]
      },
      "default_value_obtainable_from_highlight": true,
      "default_value": "concept card"
    }, {
      "name": "skill_id",
      "description": "The skill that this link refers to",
      "schema": {
        "type": "custom",
        "obj_type": "SkillSelector"
      },
      "default_value_obtainable_from_highlight": false,
      "default_value": ""
    }]
  },
  "Tabs": {
    "backend_id": "Tabs",
    "category": "Basic Input",
    "description": "A series of tabs.",
    "frontend_id": "tabs",
    "tooltip": "Insert tabs (e.g. for hints)",
    "icon_data_url": "/rich_text_components/Tabs/Tabs.png",
    "is_complex": true,
    "requires_internet": false,
    "requires_fs": false,
    "is_block_element": true,
    "customization_arg_specs": [{
      "name": "tab_contents",
      "description": "The tab titles and contents.",
      "schema": {
        "type": "custom",
        "obj_type": "ListOfTabs"
      },
      "default_value_obtainable_from_highlight": false,
      "default_value": [{
        "title": "Hint introduction",
        "content": "This set of tabs shows some hints. Click on the other tabs to display the relevant hints."
      }, {
        "title": "Hint 1",
        "content": "This is a first hint."
      }]
    }]
  },
  "Video": {
    "backend_id": "Video",
    "category": "Basic Input",
    "description": "A YouTube video.",
    "frontend_id": "video",
    "tooltip": "Insert video",
    "icon_data_url": "/rich_text_components/Video/Video.png",
    "is_complex": false,
    "requires_internet": true,
    "requires_fs": false,
    "is_block_element": true,
    "customization_arg_specs": [{
      "name": "video_id",
      "description": "The Youtube URL or the YouTube id for this video. (The Youtube id is the 11-character string after \"v=\" in the video URL.)",
      "schema": {
        "type": "unicode"
      },
      "default_value_obtainable_from_highlight": false,
      "default_value": ""
    }, {
      "name": "start",
      "description": "Video start time in seconds: (leave at 0 to start at the beginning.)",
      "schema": {
        "type": "int",
        "validators": [{
          "id": "is_at_least",
          "min_value": 0
        }]
      },
      "default_value_obtainable_from_highlight": false,
      "default_value": 0
    }, {
      "name": "end",
      "description": "Video end time in seconds: (leave at 0 to play until the end.)",
      "schema": {
        "type": "int",
          "validators": [{
            "id": "is_at_least",
            "min_value": 0
          }]
      },
      "default_value_obtainable_from_highlight": false,
      "default_value": 0
    }, {
      "name": "autoplay",
      "description": "Autoplay this video once the question has loaded?",
      "schema": {
        "type": "bool"
      },
      "default_value_obtainable_from_highlight": false,
      "default_value": false
    }]
  }
} as const;
