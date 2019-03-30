angular.module('topicEditorPageModule', [
    'topicEditorNavbarBreadcrumbModule', 'topicEditorNavbarModule', 'subtopicsListTabModule',
    'questionsTabModule', 'mainTopicEditorModule']);

angular.module('topicEditorPageModule').constant('INTERACTION_SPECS', GLOBALS.INTERACTION_SPECS);
angular.module('topicEditorPageModule').constant(
  'EDITABLE_TOPIC_DATA_URL_TEMPLATE', '/topic_editor_handler/data/<topic_id>');
angular.module('topicEditorPageModule').constant(
  'TOPIC_MANAGER_RIGHTS_URL_TEMPLATE',
  '/rightshandler/assign_topic_manager/<topic_id>/<assignee_id>');
angular.module('topicEditorPageModule').constant(
  'TOPIC_RIGHTS_URL_TEMPLATE', '/rightshandler/get_topic_rights/<topic_id>');
angular.module('topicEditorPageModule').constant(
  'SUBTOPIC_PAGE_EDITOR_DATA_URL_TEMPLATE',
  '/subtopic_page_editor_handler/data/<topic_id>/<subtopic_id>');

angular.module('topicEditorPageModule').constant(
  'TOPIC_NAME_INPUT_FOCUS_LABEL', 'topicNameInputFocusLabel');
