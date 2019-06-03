oppia.constant(
  'INTERACTION_SPECS', GLOBALS.INTERACTION_SPECS);

oppia.constant(
  'EXPLORATION_TITLE_INPUT_FOCUS_LABEL',
  'explorationTitleInputFocusLabel');
oppia.constant(
  'EXPLORATION_DATA_URL_TEMPLATE',
  '/explorehandler/init/<exploration_id>');
oppia.constant(
  'EXPLORATION_VERSION_DATA_URL_TEMPLATE',
  '/explorehandler/init/<exploration_id>?v=<version>');
oppia.constant(
  'EDITABLE_EXPLORATION_DATA_URL_TEMPLATE',
  '/createhandler/data/<exploration_id>');
oppia.constant(
  'VOICEOVER_EXPLORATION_DATA_URL_TEMPLATE',
  '/createhandler/voiceover/<exploration_id>');
  oppia.constant(
  'EDITABLE_EXPLORATION_DATA_DRAFT_URL_TEMPLATE',
  '/createhandler/data/<exploration_id>?apply_draft=<apply_draft>');

oppia.constant(
  'EVENT_EXPLORATION_PROPERTY_CHANGED', 'explorationPropertyChanged');
  
oppia.constant(
  'PARAM_ACTION_GET', 'get');

oppia.constant(
  'PARAM_ACTION_SET', 'set');

oppia.constant(
  'VOICEOVER_MODE', 'voiceoverMode');

oppia.constant(
  'TRANSLATION_MODE', 'translationMode');

// When an unresolved answer's frequency exceeds this threshold, an exploration
// will be blocked from being published until the answer is resolved.
oppia.constant(
  'UNRESOLVED_ANSWER_FREQUENCY_THRESHOLD', 5);

// Constant for audio recording time limit.
oppia.constant(
  'RECORDING_TIME_LIMIT', 300);

oppia.constant(
  'IMPROVE_TYPE_INCOMPLETE', 'incomplete');

oppia.constant('DEFAULT_AUDIO_LANGUAGE', 'en');
