/* eslint-disable */
/* Don't modify anything outside the {} brackets.
 * The contents of the {} brackets should be formatted as a JSON object.
 * JSON rules:
 * 1. All keys and string values must be enclosed in double quotes.
 * 2. Each key/value pair should be on a new line.
 * 3. All values and keys must be constant, you can't use any JavaScript
 *    functions.
 */
var richTextComponents = {
  "Collapsible": {
    "backend_id": "Collapsible",
    "category": "Basic Input",
    "description": "A collapsible block of HTML.",
    "frontend_id": "collapsible",
    "tooltip": "Insert collapsible block",
    "icon_data_url": "/rich_text_components/Collapsible/Collapsible.png",
    "preview_url_template": "/rich_text_components/Collapsible/CollapsiblePreview.png",
    "is_complex": true,
    "requires_fs": false,
    "is_block_element": true,
    "customization_arg_specs": [{
      "name": "heading",
      "description": "The heading for the collapsible block",
      "schema": {
        "type": "unicode"
      },
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
    "preview_url_template": "/imagehandler/<[explorationId]>/<[filepath.name]>",
    "is_complex": false,
    "requires_fs": true,
    "is_block_element": true,
    "customization_arg_specs": [{
      "name": "filepath",
      "description": "The image (Allowed extensions: gif, jpeg, jpg, png)",
      "schema": {
        "type": "custom",
        "obj_type": "Filepath"
      },
      "default_value": ""
    }, {
      "name": "caption",
      "description": "Caption for image (optional)",
      "schema": {
        "type": "unicode"
      },
      "default_value": ""
    }, {
      "name": "alt",
      "description": "Briefly explain this image to a visually impaired learner",
      "schema": {
        "type": "unicode",
        "validators": [{
          "id": "is_nonempty"
        }],
        "ui_config": {
          "placeholder": "Description of Image (Example : George Handel, 18th century baroque composer)"
        }
      },
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
    "preview_url_template": "/rich_text_components/Link/LinkPreview.png",
    "is_complex": false,
    "requires_fs": false,
    "is_block_element": false,
    "customization_arg_specs": [{
      "name": "url",
      "description": "The link URL. If no protocol is specified, HTTPS will be used.",
      "schema": {
        "type": "custom",
        "obj_type": "SanitizedUrl"
      },
      "default_value": "https://www.example.com"
    }, {
      "name": "text",
      "description": "The link text. If left blank, the link URL will be used.",
      "schema": {
        "type": "unicode"
      },
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
    "preview_url_template": "/rich_text_components/Math/MathPreview.png",
    "is_complex": false,
    "requires_fs": false,
    "is_block_element": false,
    "customization_arg_specs": [{
      "name": "raw_latex",
      "description": "The raw string to be displayed as LaTeX.",
      "schema": {
        "type": "custom",
        "obj_type": "MathLatexString"
      },
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
    "preview_url_template": "/rich_text_components/Tabs/TabsPreview.png",
    "is_complex": true,
    "requires_fs": false,
    "is_block_element": true,
    "customization_arg_specs": [{
      "name": "tab_contents",
      "description": "The tab titles and contents.",
      "schema": {
        "type": "list",
        "items": {
          "type": "dict",
          "properties": [{
            "name": "title",
            "description": "Tab title",
            "schema": {
              "type": "unicode",
              "validators": [{
                "id": "is_nonempty"
              }]
            }
          }, {
            "name": "content",
            "description": "Tab content",
            "schema": {
              "type": "html",
              "ui_config": {
                "hide_complex_extensions": true
              }
            }
          }]
        },
        "ui_config": {
          "add_element_text": "Add new tab"
        }
      },
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
    "preview_url_template": "https://img.youtube.com/vi/<[video_id]>/hqdefault.jpg",
    "is_complex": false,
    "requires_fs": false,
    "is_block_element": true,
    "customization_arg_specs": [{
      "name": "video_id",
      "description": "The YouTube id for this video. This is the 11-character string after \"v=\" in the video URL.",
      "schema": {
        "type": "unicode"
      },
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
      "default_value": 0
    }, {
      "name": "autoplay",
      "description": "Autoplay this video once the question has loaded?",
      "schema": {
        "type": "bool"
      },
      "default_value": false
    }]
  }
};
