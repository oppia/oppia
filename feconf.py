# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Stores various configuration options and constants for Oppia."""

import copy
import datetime
import os

# Whether to unconditionally log info messages.
DEBUG = False

# The platform for the storage backend. This is used in the model-switching
# code in core/platform.
PLATFORM = 'gae'

# This variable is for serving minified resources
# when set to True. It reflects we are emulating running Oppia in a production
# environment.
FORCE_PROD_MODE = False

# Whether we should serve the development or production experience.
# DEV_MODE should only be changed to False in the production environment,
# or if you want to use minified resources in the development environment.

if PLATFORM == 'gae':
    DEV_MODE = (
        (not os.environ.get('SERVER_SOFTWARE') or
         os.environ['SERVER_SOFTWARE'].startswith('Development')) and
        not FORCE_PROD_MODE)
else:
    raise Exception('Invalid platform: expected one of [\'gae\']')

CLASSIFIERS_DIR = os.path.join('extensions', 'classifiers')
TESTS_DATA_DIR = os.path.join('core', 'tests', 'data')
SAMPLE_EXPLORATIONS_DIR = os.path.join('data', 'explorations')
SAMPLE_COLLECTIONS_DIR = os.path.join('data', 'collections')
CONTENT_VALIDATION_DIR = os.path.join('core', 'domain')

EXTENSIONS_DIR_PREFIX = (
    'backend_prod_files' if not DEV_MODE else '')
ACTIONS_DIR = (
    os.path.join(EXTENSIONS_DIR_PREFIX, 'extensions', 'actions'))
ISSUES_DIR = (
    os.path.join(EXTENSIONS_DIR_PREFIX, 'extensions', 'issues'))
INTERACTIONS_DIR = (
    os.path.join(EXTENSIONS_DIR_PREFIX, 'extensions', 'interactions'))
RTE_EXTENSIONS_DIR = (
    os.path.join(EXTENSIONS_DIR_PREFIX, 'extensions', 'rich_text_components'))
RTE_EXTENSIONS_DEFINITIONS_PATH = (
    os.path.join('assets', 'rich_text_components_definitions.js'))

OBJECT_TEMPLATES_DIR = os.path.join('extensions', 'objects', 'templates')

# Choose production templates folder when we are in production mode.
if not DEV_MODE:
    FRONTEND_TEMPLATES_DIR = (
        os.path.join('backend_prod_files', 'templates', 'head'))
else:
    FRONTEND_TEMPLATES_DIR = os.path.join('core', 'templates', 'dev', 'head')
DEPENDENCIES_TEMPLATES_DIR = (
    os.path.join(EXTENSIONS_DIR_PREFIX, 'extensions', 'dependencies'))
VALUE_GENERATORS_DIR = os.path.join('extensions', 'value_generators')
VISUALIZATIONS_DIR = os.path.join('extensions', 'visualizations')
OBJECT_DEFAULT_VALUES_FILE_PATH = os.path.join(
    'extensions', 'objects', 'object_defaults.json')
RULES_DESCRIPTIONS_FILE_PATH = os.path.join(
    os.getcwd(), 'extensions', 'interactions', 'rule_templates.json')

# A mapping of interaction ids to classifier properties.
INTERACTION_CLASSIFIER_MAPPING = {
    'TextInput': {
        'algorithm_id': 'TextClassifier',
        'current_data_schema_version': 1
    },
    'CodeRepl': {
        'algorithm_id': 'CodeClassifier',
        'current_data_schema_version': 1
    }
}
# Classifier job time to live (in mins).
CLASSIFIER_JOB_TTL_MINS = 5
TRAINING_JOB_STATUS_COMPLETE = 'COMPLETE'
TRAINING_JOB_STATUS_FAILED = 'FAILED'
TRAINING_JOB_STATUS_NEW = 'NEW'
TRAINING_JOB_STATUS_PENDING = 'PENDING'

ALLOWED_TRAINING_JOB_STATUSES = [
    TRAINING_JOB_STATUS_COMPLETE,
    TRAINING_JOB_STATUS_FAILED,
    TRAINING_JOB_STATUS_NEW,
    TRAINING_JOB_STATUS_PENDING
]

# The maximum number of characters allowed for userbio length.
MAX_BIO_LENGTH_IN_CHARS = 2000

ALLOWED_TRAINING_JOB_STATUS_CHANGES = {
    TRAINING_JOB_STATUS_COMPLETE: [],
    TRAINING_JOB_STATUS_NEW: [TRAINING_JOB_STATUS_PENDING],
    TRAINING_JOB_STATUS_PENDING: [TRAINING_JOB_STATUS_COMPLETE,
                                  TRAINING_JOB_STATUS_FAILED],
    TRAINING_JOB_STATUS_FAILED: [TRAINING_JOB_STATUS_NEW]
}

# The maximum number of activities allowed in the playlist of the learner. This
# limit applies to both the explorations playlist and the collections playlist.
MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT = 10

# The minimum number of training samples required for training a classifier.
MIN_TOTAL_TRAINING_EXAMPLES = 50

# The minimum number of assigned labels required for training a classifier.
MIN_ASSIGNED_LABELS = 2

# Default label for classification algorithms.
DEFAULT_CLASSIFIER_LABEL = '_default'

# The maximum number of results to retrieve in a datastore query.
DEFAULT_QUERY_LIMIT = 1000

# The maximum number of results to retrieve in a datastore query
# for top rated published explorations in /library page.
NUMBER_OF_TOP_RATED_EXPLORATIONS_FOR_LIBRARY_PAGE = 8

# The maximum number of results to retrieve in a datastore query
# for recently published explorations in /library page.
RECENTLY_PUBLISHED_QUERY_LIMIT_FOR_LIBRARY_PAGE = 8

# The maximum number of results to retrieve in a datastore query
# for top rated published explorations in /library/top_rated page.
NUMBER_OF_TOP_RATED_EXPLORATIONS_FULL_PAGE = 20

# The maximum number of results to retrieve in a datastore query
# for recently published explorations in /library/recently_published page.
RECENTLY_PUBLISHED_QUERY_LIMIT_FULL_PAGE = 20

# The current version of the dashboard stats blob schema. If any backward-
# incompatible changes are made to the stats blob schema in the data store,
# this version number must be changed.
CURRENT_DASHBOARD_STATS_SCHEMA_VERSION = 1

# The current version of the exploration states blob schema. If any backward-
# incompatible changes are made to the states blob schema in the data store,
# this version number must be changed and the exploration migration job
# executed.
CURRENT_EXPLORATION_STATES_SCHEMA_VERSION = 21

# The current version of the all collection blob schemas (such as the nodes
# structure within the Collection domain object). If any backward-incompatible
# changes are made to any of the blob schemas in the data store, this version
# number must be changed.
CURRENT_COLLECTION_SCHEMA_VERSION = 6

# The current version of story contents dict in the story schema.
CURRENT_STORY_CONTENTS_SCHEMA_VERSION = 1

# The current version of skill contents dict in the skill schema.
CURRENT_SKILL_CONTENTS_SCHEMA_VERSION = 1

# The current version of misconceptions dict in the skill schema.
CURRENT_MISCONCEPTIONS_SCHEMA_VERSION = 1

# The current version of subtopics dict in the topic schema.
CURRENT_SUBTOPIC_SCHEMA_VERSION = 1

# The current version of the question schema.
CURRENT_QUESTION_SCHEMA_VERSION = 1

# This value should be updated in the event of any
# StateAnswersModel.submitted_answer_list schema change.
CURRENT_STATE_ANSWERS_SCHEMA_VERSION = 1

# The default number of exploration tiles to load at a time in the search
# results page.
SEARCH_RESULTS_PAGE_SIZE = 20

# The default number of commits to show on a page in the exploration history
# tab.
COMMIT_LIST_PAGE_SIZE = 50

# The default number of items to show on a page in the exploration feedback
# tab.
FEEDBACK_TAB_PAGE_SIZE = 20

# The maximum number of top unresolved answers which should be aggregated
# from all of the submitted answers.
TOP_UNRESOLVED_ANSWERS_LIMIT = 20

# Default title for a newly-minted exploration.
DEFAULT_EXPLORATION_TITLE = ''
# Default category for a newly-minted exploration.
DEFAULT_EXPLORATION_CATEGORY = ''
# Default objective for a newly-minted exploration.
DEFAULT_EXPLORATION_OBJECTIVE = ''

# Default name for the initial state of an exploration.
DEFAULT_INIT_STATE_NAME = 'Introduction'
# Default content id for the state's content.
DEFAULT_NEW_STATE_CONTENT_ID = 'content'
# Default content id for the interaction's default outcome.
DEFAULT_OUTCOME_CONTENT_ID = 'default_outcome'
# Default content_ids_to_audio_translations dict for a default state template.
DEFAULT_CONTENT_IDS_TO_AUDIO_TRANSLATIONS = {
    'content': {},
    'default_outcome': {}
}
# The default content text for the initial state of an exploration.
DEFAULT_INIT_STATE_CONTENT_STR = ''

# Whether new explorations should have automatic text-to-speech enabled
# by default.
DEFAULT_AUTO_TTS_ENABLED = True

# Default title for a newly-minted collection.
DEFAULT_COLLECTION_TITLE = ''
# Default category for a newly-minted collection.
DEFAULT_COLLECTION_CATEGORY = ''
# Default objective for a newly-minted collection.
DEFAULT_COLLECTION_OBJECTIVE = ''

# Default description for a newly-minted story.
DEFAULT_STORY_DESCRIPTION = ''
# Default notes for a newly-minted story.
DEFAULT_STORY_NOTES = ''

# Default explanation for a newly-minted skill.
DEFAULT_SKILL_EXPLANATION = ''
# Default name for a newly-minted misconception.
DEFAULT_MISCONCEPTION_NAME = ''
# Default notes for a newly-minted misconception.
DEFAULT_MISCONCEPTION_NOTES = ''
# Default feedback for a newly-minted misconception.
DEFAULT_MISCONCEPTION_FEEDBACK = ''

# Default description for a newly-minted topic.
DEFAULT_TOPIC_DESCRIPTION = ''

# Default ID of VM which is used for training classifier.
DEFAULT_VM_ID = 'vm_default'
# Shared secret key for default VM.
DEFAULT_VM_SHARED_SECRET = '1a2b3c4e'

# An array containing the accepted image formats (as determined by the imghdr
# module) and the corresponding allowed extensions in the filenames of uploaded
# images.
ACCEPTED_IMAGE_FORMATS_AND_EXTENSIONS = {
    'jpeg': ['jpg', 'jpeg'],
    'png': ['png'],
    'gif': ['gif'],
}

# An array containing the accepted audio extensions for uploaded files and
# the corresponding MIME types.
ACCEPTED_AUDIO_EXTENSIONS = {
    'mp3': ['audio/mp3']
}


# A string containing the disallowed characters in state or exploration names.
# The underscore is needed because spaces in names must be converted to
# underscores when displayed as part of a URL or key. The other conventions
# here are derived from the Wikipedia guidelines for naming articles.
INVALID_NAME_CHARS = u':#/|_%<>[]{}\ufffd\\' + chr(127)
for ind in range(32):
    INVALID_NAME_CHARS += chr(ind)
# Prefix for data sent from the server to the client via JSON.
XSSI_PREFIX = ')]}\'\n'
# A regular expression for alphanumeric characters.
ALPHANUMERIC_REGEX = r'^[A-Za-z0-9]+$'
# A regular expression for tags.
TAG_REGEX = r'^[a-z ]+$'

# Invalid names for parameters used in expressions.
AUTOMATICALLY_SET_PARAMETER_NAMES = ['answer', 'choices']
INVALID_PARAMETER_NAMES = AUTOMATICALLY_SET_PARAMETER_NAMES + [
    'abs', 'all', 'and', 'any', 'else', 'floor', 'if', 'log', 'or',
    'pow', 'round', 'then']

# These are here rather than in rating_services.py to avoid import
# circularities with exp_services.
# TODO (Jacob) Refactor exp_services to remove this problem.
_EMPTY_RATINGS = {'1': 0, '2': 0, '3': 0, '4': 0, '5': 0}


def get_empty_ratings():
    return copy.deepcopy(_EMPTY_RATINGS)


# Empty scaled average rating as a float.
EMPTY_SCALED_AVERAGE_RATING = 0.0

# To use GAE email service.
EMAIL_SERVICE_PROVIDER_GAE = 'gae_email_service'
# To use mailgun email service.
EMAIL_SERVICE_PROVIDER_MAILGUN = 'mailgun_email_service'
# Use GAE email service by default.
EMAIL_SERVICE_PROVIDER = EMAIL_SERVICE_PROVIDER_GAE
# If the Mailgun email API is used, the "None" below should be replaced
# with the Mailgun API key.
MAILGUN_API_KEY = None
# If the Mailgun email API is used, the "None" below should be replaced
# with the Mailgun domain name (ending with mailgun.org).
MAILGUN_DOMAIN_NAME = None
# Domain name for email address.
INCOMING_EMAILS_DOMAIN_NAME = 'example.com'
# Committer id for system actions.
SYSTEM_COMMITTER_ID = 'admin'
SYSTEM_EMAIL_ADDRESS = 'system@example.com'
ADMIN_EMAIL_ADDRESS = 'testadmin@example.com'
NOREPLY_EMAIL_ADDRESS = 'noreply@example.com'
# Ensure that SYSTEM_EMAIL_ADDRESS and ADMIN_EMAIL_ADDRESS are both valid and
# correspond to owners of the app before setting this to True. If
# SYSTEM_EMAIL_ADDRESS is not that of an app owner, email messages from this
# address cannot be sent. If True then emails can be sent to any user.
CAN_SEND_EMAILS = False
# If you want to turn on this facility please check the email templates in the
# send_role_notification_email() function in email_manager.py and modify them
# accordingly.
CAN_SEND_EDITOR_ROLE_EMAILS = False
# If enabled then emails will be sent to creators for feedback messages.
CAN_SEND_FEEDBACK_MESSAGE_EMAILS = False
# If enabled subscription emails will be sent to that user.
CAN_SEND_SUBSCRIPTION_EMAILS = False
# Time to wait before sending feedback message emails (currently set to 1
# hour).
DEFAULT_FEEDBACK_MESSAGE_EMAIL_COUNTDOWN_SECS = 3600
# Whether to send an email when new feedback message is received for
# an exploration.
DEFAULT_FEEDBACK_MESSAGE_EMAIL_PREFERENCE = True
# Whether to send an email to all the creator's subscribers when he/she
# publishes an exploration.
DEFAULT_SUBSCRIPTION_EMAIL_PREFERENCE = True
# Whether exploration feedback emails are muted,
# when the user has not specified a preference.
DEFAULT_FEEDBACK_NOTIFICATIONS_MUTED_PREFERENCE = False
# Whether exploration suggestion emails are muted,
# when the user has not specified a preference.
DEFAULT_SUGGESTION_NOTIFICATIONS_MUTED_PREFERENCE = False
# Whether to send email updates to a user who has not specified a preference.
DEFAULT_EMAIL_UPDATES_PREFERENCE = False
# Whether to send an invitation email when the user is granted
# new role permissions in an exploration.
DEFAULT_EDITOR_ROLE_EMAIL_PREFERENCE = True
# Whether to require an email to be sent, following a moderator action.
REQUIRE_EMAIL_ON_MODERATOR_ACTION = False
# Timespan in minutes before allowing duplicate emails.
DUPLICATE_EMAIL_INTERVAL_MINS = 2
# Number of digits after decimal to which the average ratings value in the
# dashboard is rounded off to.
AVERAGE_RATINGS_DASHBOARD_PRECISION = 2
# Whether to enable the promo bar functionality. This does not actually turn on
# the promo bar, as that is gated by a config value (see config_domain). This
# merely avoids checking for whether the promo bar is enabled for every Oppia
# page visited.
ENABLE_PROMO_BAR = True
# Whether to enable maintenance mode on the site. For non-admins, this redirects
# all HTTP requests to the maintenance page. This is the only check which
# determines whether the site is in maintenance mode to avoid queries to the
# database by non-admins.
ENABLE_MAINTENANCE_MODE = False

# Disables all the new structures' pages, till they are completed.
ENABLE_NEW_STRUCTURES = False

EMAIL_INTENT_SIGNUP = 'signup'
EMAIL_INTENT_DAILY_BATCH = 'daily_batch'
EMAIL_INTENT_EDITOR_ROLE_NOTIFICATION = 'editor_role_notification'
EMAIL_INTENT_FEEDBACK_MESSAGE_NOTIFICATION = 'feedback_message_notification'
EMAIL_INTENT_SUBSCRIPTION_NOTIFICATION = 'subscription_notification'
EMAIL_INTENT_SUGGESTION_NOTIFICATION = 'suggestion_notification'
EMAIL_INTENT_REPORT_BAD_CONTENT = 'report_bad_content'
EMAIL_INTENT_MARKETING = 'marketing'
EMAIL_INTENT_UNPUBLISH_EXPLORATION = 'unpublish_exploration'
EMAIL_INTENT_DELETE_EXPLORATION = 'delete_exploration'
EMAIL_INTENT_QUERY_STATUS_NOTIFICATION = 'query_status_notification'
# Possible intents for email sent in bulk.
BULK_EMAIL_INTENT_MARKETING = 'bulk_email_marketing'
BULK_EMAIL_INTENT_IMPROVE_EXPLORATION = 'bulk_email_improve_exploration'
BULK_EMAIL_INTENT_CREATE_EXPLORATION = 'bulk_email_create_exploration'
BULK_EMAIL_INTENT_CREATOR_REENGAGEMENT = 'bulk_email_creator_reengagement'
BULK_EMAIL_INTENT_LEARNER_REENGAGEMENT = 'bulk_email_learner_reengagement'
BULK_EMAIL_INTENT_TEST = 'bulk_email_test'

MESSAGE_TYPE_FEEDBACK = 'feedback'
MESSAGE_TYPE_SUGGESTION = 'suggestion'

MODERATOR_ACTION_UNPUBLISH_EXPLORATION = 'unpublish_exploration'
DEFAULT_SALUTATION_HTML_FN = (
    lambda recipient_username: 'Hi %s,' % recipient_username)
DEFAULT_SIGNOFF_HTML_FN = (
    lambda sender_username: (
        'Thanks!<br>%s (Oppia moderator)' % sender_username))

VALID_MODERATOR_ACTIONS = {
    MODERATOR_ACTION_UNPUBLISH_EXPLORATION: {
        'email_config': 'unpublish_exploration_email_html_body',
        'email_subject_fn': (
            lambda exp_title: (
                'Your Oppia exploration "%s" has been unpublished' % exp_title)
        ),
        'email_intent': 'unpublish_exploration',
        'email_salutation_html_fn': DEFAULT_SALUTATION_HTML_FN,
        'email_signoff_html_fn': DEFAULT_SIGNOFF_HTML_FN,
    },
}

# When the site terms were last updated, in UTC.
REGISTRATION_PAGE_LAST_UPDATED_UTC = datetime.datetime(2015, 10, 14, 2, 40, 0)

# Format of string for dashboard statistics logs.
# NOTE TO DEVELOPERS: This format should not be changed, since it is used in
# the existing storage models for UserStatsModel.
DASHBOARD_STATS_DATETIME_STRING_FORMAT = '%Y-%m-%d'

# The maximum size of an uploaded file, in bytes.
MAX_FILE_SIZE_BYTES = 1048576

# The maximum playback length of an audio file, in seconds.
MAX_AUDIO_FILE_LENGTH_SEC = 300

# The prefix for an 'accepted suggestion' commit message.
COMMIT_MESSAGE_ACCEPTED_SUGGESTION_PREFIX = 'Accepted suggestion by'

# User id and username for exploration migration bot. Commits made by this bot
# are not reflected in the exploration summary models, but are recorded in the
# exploration commit log.
MIGRATION_BOT_USER_ID = 'OppiaMigrationBot'
MIGRATION_BOT_USERNAME = 'OppiaMigrationBot'

# Ids and locations of the permitted extensions.
ALLOWED_RTE_EXTENSIONS = {
    'Collapsible': {
        'dir': os.path.join(RTE_EXTENSIONS_DIR, 'Collapsible')
    },
    'Image': {
        'dir': os.path.join(RTE_EXTENSIONS_DIR, 'Image')
    },
    'Link': {
        'dir': os.path.join(RTE_EXTENSIONS_DIR, 'Link')
    },
    'Math': {
        'dir': os.path.join(RTE_EXTENSIONS_DIR, 'Math')
    },
    'Tabs': {
        'dir': os.path.join(RTE_EXTENSIONS_DIR, 'Tabs')
    },
    'Video': {
        'dir': os.path.join(RTE_EXTENSIONS_DIR, 'Video')
    },
}

# These categories and interactions are displayed in the order in which they
# appear in the interaction selector.
ALLOWED_INTERACTION_CATEGORIES = [{
    'name': 'General',
    'interaction_ids': [
        'Continue',
        'EndExploration',
        'ImageClickInput',
        'ItemSelectionInput',
        'MultipleChoiceInput',
        'TextInput'
    ],
}, {
    'name': 'Math',
    'interaction_ids': [
        'FractionInput',
        'GraphInput',
        'LogicProof',
        'NumericInput',
        'SetInput',
        'MathExpressionInput',
    ]
}, {
    'name': 'Programming',
    'interaction_ids': [
        'CodeRepl',
        'PencilCodeEditor',
    ],
}, {
    'name': 'Music',
    'interaction_ids': [
        'MusicNotesInput'
    ],
}, {
    'name': 'Geography',
    'interaction_ids': [
        'InteractiveMap'
    ],
}]

# The list of interaction IDs which correspond to interactions that set their
# is_linear property to true. Linear interactions do not support branching and
# thus only allow for default answer classification. This value is guarded by a
# test in extensions.interactions.base_test.
LINEAR_INTERACTION_IDS = ['Continue']

# Demo explorations to load through the admin panel. The id assigned to each
# exploration is based on the key of the exploration in this dict, so ensure it
# doesn't change once it's in the list. Only integer-based indices should be
# used in this list, as it maintains backward compatibility with how demo
# explorations used to be assigned IDs. The value of each entry in this dict is
# either a YAML file or a directory (depending on whether it ends in .yaml).
# These explorations can be found under data/explorations.
DEMO_EXPLORATIONS = {
    u'0': 'welcome.yaml',
    u'1': 'multiples.yaml',
    u'2': 'binary_search',
    u'3': 'root_linear_coefficient_theorem.yaml',
    u'4': 'three_balls',
    # TODO(bhenning): Replace demo exploration '5' with a new exploration
    # described in #1376.
    u'6': 'boot_verbs.yaml',
    u'7': 'hola.yaml',
    u'8': 'adventure.yaml',
    u'9': 'pitch_perfect.yaml',
    u'10': 'test_interactions',
    u'11': 'modeling_graphs',
    u'12': 'protractor_test_1.yaml',
    u'13': 'solar_system',
    u'14': 'about_oppia.yaml',
    u'15': 'classifier_demo_exploration.yaml',
    u'16': 'all_interactions',
    u'17': 'audio_test',
    u'18': 'code_classifier_test.yaml',
    u'19': 'example_exploration_in_collection1.yaml',
    u'20': 'example_exploration_in_collection2.yaml',
    u'21': 'example_exploration_in_collection3.yaml',
}

DEMO_COLLECTIONS = {
    u'0': 'welcome_to_collections.yaml'
}

# IDs of explorations which should not be displayable in either the learner or
# editor views.
DISABLED_EXPLORATION_IDS = ['5']

# Google Group embed URL for the Forum page.
EMBEDDED_GOOGLE_GROUP_URL = (
    'https://groups.google.com/forum/embed/?place=forum/oppia')

# External URL for the Foundation site.
FOUNDATION_SITE_URL = 'http://oppiafoundation.org'

# Whether to allow YAML file uploads.
ALLOW_YAML_FILE_UPLOAD = False

# Prefix for all taskqueue-related URLs.
TASKQUEUE_URL_PREFIX = '/task'
TASK_URL_FEEDBACK_MESSAGE_EMAILS = (
    '%s/email/batchfeedbackmessageemailhandler' % TASKQUEUE_URL_PREFIX)
TASK_URL_FEEDBACK_STATUS_EMAILS = (
    '%s/email/feedbackthreadstatuschangeemailhandler' % TASKQUEUE_URL_PREFIX)
TASK_URL_FLAG_EXPLORATION_EMAILS = (
    '%s/email/flagexplorationemailhandler' % TASKQUEUE_URL_PREFIX)
TASK_URL_INSTANT_FEEDBACK_EMAILS = (
    '%s/email/instantfeedbackmessageemailhandler' % TASKQUEUE_URL_PREFIX)
TASK_URL_SUGGESTION_EMAILS = (
    '%s/email/suggestionemailhandler' % TASKQUEUE_URL_PREFIX)

# TODO(sll): Add all other URLs here.
ADMIN_URL = '/admin'
ADMIN_ROLE_HANDLER_URL = '/adminrolehandler'
COLLECTION_DATA_URL_PREFIX = '/collection_handler/data'
COLLECTION_EDITOR_DATA_URL_PREFIX = '/collection_editor_handler/data'
COLLECTION_SUMMARIES_DATA_URL = '/collectionsummarieshandler/data'
COLLECTION_RIGHTS_PREFIX = '/collection_editor_handler/rights'
COLLECTION_PUBLISH_PREFIX = '/collection_editor_handler/publish'
COLLECTION_UNPUBLISH_PREFIX = '/collection_editor_handler/unpublish'
COLLECTION_EDITOR_URL_PREFIX = '/collection_editor/create'
COLLECTION_URL_PREFIX = '/collection'
CREATOR_DASHBOARD_DATA_URL = '/creatordashboardhandler/data'
CREATOR_DASHBOARD_URL = '/creator_dashboard'
DASHBOARD_CREATE_MODE_URL = '%s?mode=create' % CREATOR_DASHBOARD_URL
EDITOR_URL_PREFIX = '/create'
EXPLORATION_DATA_PREFIX = '/createhandler/data'
EXPLORATION_INIT_URL_PREFIX = '/explorehandler/init'
EXPLORATION_METADATA_SEARCH_URL = '/exploration/metadata_search'
EXPLORATION_RIGHTS_PREFIX = '/createhandler/rights'
EXPLORATION_STATUS_PREFIX = '/createhandler/status'
EXPLORATION_SUMMARIES_DATA_URL = '/explorationsummarieshandler/data'
EXPLORATION_URL_PREFIX = '/explore'
EXPLORATION_URL_EMBED_PREFIX = '/embed/exploration'
FEEDBACK_STATS_URL_PREFIX = '/feedbackstatshandler'
FEEDBACK_THREAD_URL_PREFIX = '/threadhandler'
FEEDBACK_THREADLIST_URL_PREFIX = '/threadlisthandler'
FEEDBACK_THREAD_VIEW_EVENT_URL = '/feedbackhandler/thread_view_event'
FLAG_EXPLORATION_URL_PREFIX = '/flagexplorationhandler'
FRACTIONS_LANDING_PAGE_URL = '/fractions'
LEARNER_DASHBOARD_URL = '/learner_dashboard'
LEARNER_DASHBOARD_DATA_URL = '/learnerdashboardhandler/data'
LEARNER_DASHBOARD_IDS_DATA_URL = '/learnerdashboardidshandler/data'
LEARNER_DASHBOARD_FEEDBACK_THREAD_DATA_URL = '/learnerdashboardthreadhandler'
LEARNER_PLAYLIST_DATA_URL = '/learnerplaylistactivityhandler'
LEARNER_INCOMPLETE_ACTIVITY_DATA_URL = '/learnerincompleteactivityhandler'
LIBRARY_GROUP_DATA_URL = '/librarygrouphandler'
LIBRARY_INDEX_URL = '/library'
LIBRARY_INDEX_DATA_URL = '/libraryindexhandler'
LIBRARY_RECENTLY_PUBLISHED_URL = '/library/recently_published'
LIBRARY_SEARCH_URL = '/search/find'
LIBRARY_SEARCH_DATA_URL = '/searchhandler/data'
LIBRARY_TOP_RATED_URL = '/library/top_rated'
NEW_COLLECTION_URL = '/collection_editor_handler/create_new'
NEW_EXPLORATION_URL = '/contributehandler/create_new'
NEW_SKILL_URL = '/skill_editor_handler/create_new'
NEW_STORY_URL = '/story_editor_handler/create_new'
NEW_TOPIC_URL = '/topic_editor_handler/create_new'
PREFERENCES_DATA_URL = '/preferenceshandler/data'
QUESTION_DATA_URL = '/questionhandler'
QUESTION_MANAGER_URL = '/questionmanagerhandler'
QUESTION_CREATION_URL = '/questioncreationhandler'
RECENT_COMMITS_DATA_URL = '/recentcommitshandler/recent_commits'
RECENT_FEEDBACK_MESSAGES_DATA_URL = '/recent_feedback_messages'
ROBOTS_TXT_URL = '/robots.txt'
SITE_FEEDBACK_FORM_URL = ''
SITE_LANGUAGE_DATA_URL = '/save_site_language'
SIGNUP_DATA_URL = '/signuphandler/data'
SIGNUP_URL = '/signup'
SKILL_EDITOR_DATA_URL_PREFIX = '/skill_editor_handler/data'
SKILL_EDITOR_URL_PREFIX = '/skill_editor'
SPLASH_URL = '/splash'
STORY_EDITOR_URL_PREFIX = '/story_editor'
STORY_EDITOR_DATA_URL_PREFIX = '/story_editor_handler/data'
SUGGESTION_ACTION_URL_PREFIX = '/suggestionactionhandler'
SUGGESTION_LIST_URL_PREFIX = '/suggestionlisthandler'
SUGGESTION_URL_PREFIX = '/suggestionhandler'
SUBSCRIBE_URL_PREFIX = '/subscribehandler'
SUBTOPIC_PAGE_EDITOR_DATA_URL_PREFIX = '/subtopic_page_editor_handler/data'
TOPIC_EDITOR_DATA_URL_PREFIX = '/topic_editor_handler/data'
TOPIC_EDITOR_URL_PREFIX = '/topic_editor'
TOPIC_MANAGER_RIGHTS_URL_PREFIX = '/rightshandler/assign_topic_manager'
TOPICS_AND_SKILLS_DASHBOARD_URL = '/topics_and_skills_dashboard'
UNSUBSCRIBE_URL_PREFIX = '/unsubscribehandler'
UPLOAD_EXPLORATION_URL = '/contributehandler/upload'
USER_EXPLORATION_EMAILS_PREFIX = '/createhandler/notificationpreferences'
USERNAME_CHECK_DATA_URL = '/usernamehandler/data'

NAV_MODE_ABOUT = 'about'
NAV_MODE_GET_STARTED = 'get_started'
NAV_MODE_COLLECTION = 'collection'
NAV_MODE_CONTACT = 'contact'
NAV_MODE_CREATE = 'create'
NAV_MODE_CREATOR_DASHBOARD = 'creator_dashboard'
NAV_MODE_DONATE = 'donate'
NAV_MODE_EXPLORE = 'explore'
NAV_MODE_LEARNER_DASHBOARD = 'learner_dashboard'
NAV_MODE_LIBRARY = 'library'
NAV_MODE_PROFILE = 'profile'
NAV_MODE_SIGNUP = 'signup'
NAV_MODE_SPLASH = 'splash'
NAV_MODE_TEACH = 'teach'
NAV_MODE_THANKS = 'thanks'
NAV_MODE_TOPICS_AND_SKILLS_DASHBOARD = 'topics_and_skills_dashboard'

# Event types.
EVENT_TYPE_ALL_STATS = 'all_stats'
EVENT_TYPE_STATE_HIT = 'state_hit'
EVENT_TYPE_STATE_COMPLETED = 'state_complete'
EVENT_TYPE_ANSWER_SUBMITTED = 'answer_submitted'
EVENT_TYPE_DEFAULT_ANSWER_RESOLVED = 'default_answer_resolved'
EVENT_TYPE_NEW_THREAD_CREATED = 'feedback_thread_created'
EVENT_TYPE_THREAD_STATUS_CHANGED = 'feedback_thread_status_changed'
EVENT_TYPE_RATE_EXPLORATION = 'rate_exploration'
EVENT_TYPE_SOLUTION_HIT = 'solution_hit'
EVENT_TYPE_LEAVE_FOR_REFRESHER_EXP = 'leave_for_refresher_exp'
# The values for these event types should be left as-is for backwards
# compatibility.
EVENT_TYPE_START_EXPLORATION = 'start'
EVENT_TYPE_ACTUAL_START_EXPLORATION = 'actual_start'
EVENT_TYPE_MAYBE_LEAVE_EXPLORATION = 'leave'
EVENT_TYPE_COMPLETE_EXPLORATION = 'complete'

ACTIVITY_STATUS_PRIVATE = 'private'
ACTIVITY_STATUS_PUBLIC = 'public'

# Play type constants.
PLAY_TYPE_PLAYTEST = 'playtest'
PLAY_TYPE_NORMAL = 'normal'

# Predefined commit messages.
COMMIT_MESSAGE_EXPLORATION_DELETED = 'Exploration deleted.'
COMMIT_MESSAGE_COLLECTION_DELETED = 'Collection deleted.'
COMMIT_MESSAGE_QUESTION_DELETED = 'Question deleted.'
COMMIT_MESSAGE_SKILL_DELETED = 'Skill deleted.'
COMMIT_MESSAGE_STORY_DELETED = 'Story deleted.'
COMMIT_MESSAGE_SUBTOPIC_PAGE_DELETED = 'Subtopic page deleted.'
COMMIT_MESSAGE_TOPIC_DELETED = 'Topic deleted.'

# Whether learner playthroughs visualization framework should be enabled.
ENABLE_PLAYTHROUGHS = False
# Threshold for early quit playthrough.
EARLY_QUIT_THRESHOLD_IN_SECS = 45
# Threshold for multiple incorrect answers playthrough.
NUM_INCORRECT_ANSWERS_THRESHOLD = 5
# Threshold for repeated cyclic state transitions playthrough.
NUM_REPEATED_CYCLES_THRESHOLD = 3
# Max number of playthroughs for an issue.
MAX_PLAYTHROUGHS_FOR_ISSUE = 5
# Probability of recording a playthrough.
RECORD_PLAYTHROUGH_PROBABILITY = 0.2

# Unfinished features.
SHOW_TRAINABLE_UNRESOLVED_ANSWERS = False
# Number of unresolved answers to be displayed in the dashboard for each
# exploration.
TOP_UNRESOLVED_ANSWERS_COUNT_DASHBOARD = 3
# Number of open feedback to be displayed in the dashboard for each exploration.
OPEN_FEEDBACK_COUNT_DASHBOARD = 3
# NOTE TO DEVELOPERS: This should be synchronized with app.js.
ENABLE_ML_CLASSIFIERS = False
SHOW_COLLECTION_NAVIGATION_TAB_HISTORY = False
SHOW_COLLECTION_NAVIGATION_TAB_STATS = False
# Whether state id mapping model should be generated and stored when exploration
# is created or updated.
ENABLE_STATE_ID_MAPPING = False

# Current event models schema version. All event models with an
# event_schema_version of 1 are the events collected before the rework of the
# statistics framework which brought about the recording of new event models;
# these models include all models recorded before Feb 2018.
CURRENT_EVENT_MODELS_SCHEMA_VERSION = 2

# Output formats of downloaded explorations.
OUTPUT_FORMAT_JSON = 'json'
OUTPUT_FORMAT_ZIP = 'zip'

# Types of updates shown in the 'recent updates' table in the dashboard page.
UPDATE_TYPE_EXPLORATION_COMMIT = 'exploration_commit'
UPDATE_TYPE_COLLECTION_COMMIT = 'collection_commit'
UPDATE_TYPE_FEEDBACK_MESSAGE = 'feedback_thread'

# Possible values for user query status.
# Valid status transitions are: processing --> completed --> archived
# or processing --> failed.
USER_QUERY_STATUS_PROCESSING = 'processing'
USER_QUERY_STATUS_COMPLETED = 'completed'
USER_QUERY_STATUS_ARCHIVED = 'archived'
USER_QUERY_STATUS_FAILED = 'failed'

# The time difference between which to consider two login events "close". This
# is taken to be 12 hours.
PROXIMAL_TIMEDELTA_SECS = 12 * 60 * 60

# These categories are shown in the library navbar.
SEARCH_DROPDOWN_CATEGORIES = sorted([
    'Mathematics',
    'Statistics',
    'Algorithms',
    'Programming',
    'Biology',
    'Chemistry',
    'Physics',
    'Medicine',
    'English',
    'Architecture',
    'Art',
    'Music',
    'Reading',
    'Business',
    'Economics',
    'Geography',
    'History',
])

# The i18n id for the header of the "Featured Activities" category in the
# library index page.
LIBRARY_CATEGORY_FEATURED_ACTIVITIES = 'I18N_LIBRARY_GROUPS_FEATURED_ACTIVITIES'
# The i18n id for the header of the "Top Rated Explorations" category in the
# library index page.
LIBRARY_CATEGORY_TOP_RATED_EXPLORATIONS = (
    'I18N_LIBRARY_GROUPS_TOP_RATED_EXPLORATIONS')
# The i18n id for the header of the "Recently Published" category in the
# library index page.
LIBRARY_CATEGORY_RECENTLY_PUBLISHED = 'I18N_LIBRARY_GROUPS_RECENTLY_PUBLISHED'

# The group name that appears at the end of the url for the recently published
# page.
LIBRARY_GROUP_RECENTLY_PUBLISHED = 'recently_published'
# The group name that appears at the end of the url for the top rated page.
LIBRARY_GROUP_TOP_RATED = 'top_rated'

# NOTE TO DEVELOPERS: The LIBRARY_PAGE_MODE constants defined below should have
# the same value as the ones defined in LIBRARY_PAGE_MODES in Library.js. For
# example LIBRARY_PAGE_MODE_GROUP should have the same value as
# LIBRARY_PAGE_MODES.GROUP.
# Page mode for the group pages such as top rated and recently published
# explorations.
LIBRARY_PAGE_MODE_GROUP = 'group'
# Page mode for the main library page.
LIBRARY_PAGE_MODE_INDEX = 'index'
# Page mode for the search results page.
LIBRARY_PAGE_MODE_SEARCH = 'search'

# Defaults for topic similarities.
DEFAULT_TOPIC_SIMILARITY = 0.5
SAME_TOPIC_SIMILARITY = 1.0

SYSTEM_USERNAMES = [SYSTEM_COMMITTER_ID, MIGRATION_BOT_USERNAME]
SYSTEM_USER_IDS = [SYSTEM_COMMITTER_ID, MIGRATION_BOT_USERNAME]

# The following are all page descriptions for the meta tag.
ABOUT_PAGE_DESCRIPTION = (
    'Oppia is an open source learning platform that connects a community of '
    'teachers and learners. You can use this site to create 1-1 learning '
    'scenarios for others.')
GET_STARTED_PAGE_DESCRIPTION = (
    'Learn how to get started using Oppia.')
CONTACT_PAGE_DESCRIPTION = (
    'Contact the Oppia team, submit feedback, and learn how to get involved '
    'with the Oppia project.')
CREATE_PAGE_DESCRIPTION = (
    'Help others learn new things. Create lessons through explorations and '
    'share your knowledge with the community.')
CREATOR_DASHBOARD_PAGE_DESCRIPTION = (
    'Keep track of the lessons you have created, as well as feedback from '
    'learners.')
DONATE_PAGE_DESCRIPTION = (
    'Donate to The Oppia Foundation.')
FORUM_PAGE_DESCRIPTION = (
    'Engage with the Oppia community by discussing questions, bugs and '
    'explorations in the forum.')
LIBRARY_GROUP_PAGE_DESCRIPTION = (
    'Discover top-rated or recently-published explorations on Oppia. Learn '
    'from these explorations or help improve an existing one for the '
    'community.')
LIBRARY_PAGE_DESCRIPTION = (
    'Looking to learn something new? Find explorations created by professors, '
    'teachers and Oppia users in a subject you\'re interested in, and start '
    'exploring!')
PREFERENCES_PAGE_DESCRIPTION = (
    'Change your Oppia profile settings and preferences')
SEARCH_PAGE_DESCRIPTION = (
    'Discover a new exploration to learn from, or help improve an existing '
    'one for the community.')
SIGNUP_PAGE_DESCRIPTION = (
    'Sign up for Oppia and begin exploring a new subject.')
SPLASH_PAGE_DESCRIPTION = (
    'Oppia is a free site for sharing knowledge via interactive lessons '
    'called \'explorations\'. Learn from user-created explorations, or teach '
    'and create your own.')
TEACH_PAGE_DESCRIPTION = (
    'The Oppia library is full of user-created lessons called \'explorations\'.'
    ' Read about how to participate in the community and begin creating '
    'explorations.')
TERMS_PAGE_DESCRIPTION = (
    'Oppia is a 501(c)(3) registered non-profit open-source e-learning '
    'platform. Learn about our terms and conditions for creating and '
    'distributing learning material.')
THANKS_PAGE_DESCRIPTION = (
    'Thank you for donating to The Oppia Foundation.')
SITE_NAME = 'Oppia.org'

# The type of the response returned by a handler when an exception is raised.
HANDLER_TYPE_HTML = 'html'
HANDLER_TYPE_JSON = 'json'

# Following are the constants for the role IDs.
ROLE_ID_GUEST = 'GUEST'
ROLE_ID_BANNED_USER = 'BANNED_USER'
ROLE_ID_EXPLORATION_EDITOR = 'EXPLORATION_EDITOR'
ROLE_ID_COLLECTION_EDITOR = 'COLLECTION_EDITOR'
ROLE_ID_TOPIC_MANAGER = 'TOPIC_MANAGER'
ROLE_ID_MODERATOR = 'MODERATOR'
ROLE_ID_ADMIN = 'ADMIN'

# Intent of the User making query to role structure via admin interface. Used
# to store audit data regarding queries to role IDs.
ROLE_ACTION_UPDATE = 'update'
ROLE_ACTION_VIEW_BY_USERNAME = 'view_by_username'
ROLE_ACTION_VIEW_BY_ROLE = 'view_by_role'

VIEW_METHOD_ROLE = 'role'
VIEW_METHOD_USERNAME = 'username'

QUESTION_BATCH_SIZE = 10

STATE_ANSWER_STATS_MIN_FREQUENCY = 2

# RTE content specifications according to the type of the editor.
RTE_CONTENT_SPEC = {
    'RTE_TYPE_TEXTANGULAR': {
        # Valid parent-child relation in TextAngular.
        'ALLOWED_PARENT_LIST': {
            'p': ['blockquote', 'div', 'pre', '[document]', 'ol', 'ul', 'li'],
            'b': ['i', 'li', 'p', 'pre'],
            'br': ['b', 'i', 'li', 'p'],
            'div': ['blockquote'],
            'i': ['b', 'li', 'p', 'pre'],
            'li': ['ol', 'ul'],
            'ol': ['ol', 'ul', 'blockquote', 'li', 'pre', 'div', '[document]'],
            'ul': ['ol', 'ul', 'blockquote', 'li', 'pre', 'div', '[document]'],
            'pre': ['ol', 'ul', 'blockquote', '[document]'],
            'blockquote': ['blockquote', '[document]'],
            'oppia-noninteractive-link': ['b', 'i', 'li', 'p', 'pre'],
            'oppia-noninteractive-math': ['b', 'i', 'li', 'p', 'pre'],
            'oppia-noninteractive-image': ['b', 'i', 'li', 'p', 'pre'],
            'oppia-noninteractive-collapsible': ['b', 'i', 'li', 'p', 'pre'],
            'oppia-noninteractive-video': ['b', 'i', 'li', 'p', 'pre'],
            'oppia-noninteractive-tabs': ['b', 'i', 'li', 'p', 'pre']
        },
        # Valid html tags in TextAngular.
        'ALLOWED_TAG_LIST': [
            'p',
            'b',
            'br',
            'div',
            'i',
            'li',
            'ol',
            'ul',
            'pre',
            'blockquote',
            'oppia-noninteractive-link',
            'oppia-noninteractive-math',
            'oppia-noninteractive-image',
            'oppia-noninteractive-collapsible',
            'oppia-noninteractive-video',
            'oppia-noninteractive-tabs'
        ]
    }
}
