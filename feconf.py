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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import copy
import datetime
import os

from constants import constants

# The datastore model ID for the list of featured activity references. This
# value should not be changed.
ACTIVITY_REFERENCE_LIST_FEATURED = 'featured'
ALL_ACTIVITY_REFERENCE_LIST_TYPES = [ACTIVITY_REFERENCE_LIST_FEATURED]

# The values which a post_commit_status can have: public, private.
POST_COMMIT_STATUS_PUBLIC = 'public'
POST_COMMIT_STATUS_PRIVATE = 'private'

# Whether to unconditionally log info messages.
DEBUG = False

# When DEV_MODE is true check that we are running in development environment.
# The SERVER_SOFTWARE environment variable does not exist in Travis, hence the
# need for an explicit check.
if (constants.DEV_MODE and os.getenv('SERVER_SOFTWARE') and
        not os.getenv('SERVER_SOFTWARE', default='').startswith('Development')):
    raise Exception('DEV_MODE can\'t be true on production.')

CLASSIFIERS_DIR = os.path.join('extensions', 'classifiers')
TESTS_DATA_DIR = os.path.join('core', 'tests', 'data')
SAMPLE_EXPLORATIONS_DIR = os.path.join('data', 'explorations')
SAMPLE_COLLECTIONS_DIR = os.path.join('data', 'collections')
CONTENT_VALIDATION_DIR = os.path.join('core', 'domain')

# backend_prod_files contain processed JS and HTML files that are served by
# Jinja, we are moving away from Jinja so this folder might not be needed later
# (#6964)
EXTENSIONS_DIR_PREFIX = (
    'backend_prod_files' if not constants.DEV_MODE else '')
ACTIONS_DIR = (
    os.path.join(EXTENSIONS_DIR_PREFIX, 'extensions', 'actions'))
ISSUES_DIR = (
    os.path.join(EXTENSIONS_DIR_PREFIX, 'extensions', 'issues'))
INTERACTIONS_DIR = (
    os.path.join('extensions', 'interactions'))
RTE_EXTENSIONS_DIR = (
    os.path.join(EXTENSIONS_DIR_PREFIX, 'extensions', 'rich_text_components'))
RTE_EXTENSIONS_DEFINITIONS_PATH = (
    os.path.join('assets', 'rich_text_components_definitions.ts'))

OBJECT_TEMPLATES_DIR = os.path.join('extensions', 'objects', 'templates')

# Choose production templates folder when we are in production mode.
FRONTEND_TEMPLATES_DIR = (
    os.path.join('webpack_bundles') if constants.DEV_MODE else
    os.path.join('backend_prod_files', 'webpack_bundles'))
DEPENDENCIES_TEMPLATES_DIR = (
    os.path.join(EXTENSIONS_DIR_PREFIX, 'extensions', 'dependencies'))

VALUE_GENERATORS_DIR_FOR_JS = os.path.join(
    'local_compiled_js', 'extensions', 'value_generators')
VALUE_GENERATORS_DIR = os.path.join('extensions', 'value_generators')

VISUALIZATIONS_DIR = os.path.join(
    'extensions', 'visualizations')
VISUALIZATIONS_DIR_FOR_JS = os.path.join(
    'local_compiled_js', 'extensions', 'visualizations')

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

ENTITY_TYPE_EXPLORATION = 'exploration'
ENTITY_TYPE_TOPIC = 'topic'
ENTITY_TYPE_SKILL = 'skill'
ENTITY_TYPE_STORY = 'story'
ENTITY_TYPE_SUBTOPIC = 'subtopic'
ENTITY_TYPE_QUESTION = 'question'
ENTITY_TYPE_VOICEOVER_APPLICATION = 'voiceover_application'

MAX_TASK_MODELS_PER_FETCH = 25
MAX_TASK_MODELS_PER_HISTORY_PAGE = 10

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
CURRENT_STATE_SCHEMA_VERSION = 33

# The current version of the all collection blob schemas (such as the nodes
# structure within the Collection domain object). If any backward-incompatible
# changes are made to any of the blob schemas in the data store, this version
# number must be changed.
CURRENT_COLLECTION_SCHEMA_VERSION = 6

# The current version of story contents dict in the story schema.
CURRENT_STORY_CONTENTS_SCHEMA_VERSION = 3

# The current version of skill contents dict in the skill schema.
CURRENT_SKILL_CONTENTS_SCHEMA_VERSION = 1

# The current version of misconceptions dict in the skill schema.
CURRENT_MISCONCEPTIONS_SCHEMA_VERSION = 2

# The current version of rubric dict in the skill schema.
CURRENT_RUBRIC_SCHEMA_VERSION = 2

# The current version of subtopics dict in the topic schema.
CURRENT_SUBTOPIC_SCHEMA_VERSION = 2

# The current version of story reference dict in the topic schema.
CURRENT_STORY_REFERENCE_SCHEMA_VERSION = 1

# The current version of page_contents dict in the subtopic page schema.
CURRENT_SUBTOPIC_PAGE_CONTENTS_SCHEMA_VERSION = 1

# This value should be updated in the event of any
# StateAnswersModel.submitted_answer_list schema change.
CURRENT_STATE_ANSWERS_SCHEMA_VERSION = 1

# This value should be updated if the schema of LearnerAnswerInfo
# dict schema changes.
CURRENT_LEARNER_ANSWER_INFO_SCHEMA_VERSION = 1

# The default number of exploration tiles to load at a time in the search
# results page.
SEARCH_RESULTS_PAGE_SIZE = 20

# The default number of commits to show on a page in the exploration history
# tab.
COMMIT_LIST_PAGE_SIZE = 50

# The default number of items to show on a page in the exploration feedback
# tab.
FEEDBACK_TAB_PAGE_SIZE = 20

# The default number of opportunities to show on community dashboard page.
OPPORTUNITIES_PAGE_SIZE = 20

# The maximum number of top unresolved answers which should be aggregated
# from all of the submitted answers.
TOP_UNRESOLVED_ANSWERS_LIMIT = 20

# Default title for a newly-minted exploration.
DEFAULT_EXPLORATION_TITLE = ''
# Default category for a newly-minted exploration.
DEFAULT_EXPLORATION_CATEGORY = ''
# Default objective for a newly-minted exploration.
DEFAULT_EXPLORATION_OBJECTIVE = ''

# NOTE TO DEVELOPERS: If any of the 5 constants below are modified, the
# corresponding field in NEW_STATE_TEMPLATE in constants.js also has to be
# modified.

# Default name for the initial state of an exploration.
DEFAULT_INIT_STATE_NAME = 'Introduction'
# Default content id for the state's content.
DEFAULT_NEW_STATE_CONTENT_ID = 'content'
# Default content id for the interaction's default outcome.
DEFAULT_OUTCOME_CONTENT_ID = 'default_outcome'
# Default content id for the explanation in the concept card of a skill.
DEFAULT_EXPLANATION_CONTENT_ID = 'explanation'
# Default recorded_voiceovers dict for a default state template.
DEFAULT_RECORDED_VOICEOVERS = {
    'voiceovers_mapping': {
        'content': {},
        'default_outcome': {}
    }
}
# Default written_translations dict for a default state template.
DEFAULT_WRITTEN_TRANSLATIONS = {
    'translations_mapping': {
        'content': {},
        'default_outcome': {}
    }
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
# Default content_id for explanation subtitled html.
DEFAULT_SKILL_EXPLANATION_CONTENT_ID = 'explanation'

# Default description for a newly-minted topic.
DEFAULT_TOPIC_DESCRIPTION = ''
# Default abbreviated name for a newly-minted topic.
DEFAULT_ABBREVIATED_TOPIC_NAME = ''
# Default content id for the subtopic page's content.
DEFAULT_SUBTOPIC_PAGE_CONTENT_ID = 'content'

# Default ID of VM which is used for training classifier.
DEFAULT_VM_ID = 'vm_default'
# Shared secret key for default VM.
DEFAULT_VM_SHARED_SECRET = '1a2b3c4e'

IMAGE_FORMAT_JPEG = 'jpeg'
IMAGE_FORMAT_PNG = 'png'
IMAGE_FORMAT_GIF = 'gif'
IMAGE_FORMAT_SVG = 'svg'

# An array containing the accepted image formats (as determined by the imghdr
# module) and the corresponding allowed extensions in the filenames of uploaded
# images.
ACCEPTED_IMAGE_FORMATS_AND_EXTENSIONS = {
    IMAGE_FORMAT_JPEG: ['jpg', 'jpeg'],
    IMAGE_FORMAT_PNG: ['png'],
    IMAGE_FORMAT_GIF: ['gif'],
    IMAGE_FORMAT_SVG: ['svg']
}

# An array containing the image formats that can be compressed.
COMPRESSIBLE_IMAGE_FORMATS = [
    IMAGE_FORMAT_JPEG, IMAGE_FORMAT_PNG, IMAGE_FORMAT_GIF]

# An array containing the accepted audio extensions for uploaded files and
# the corresponding MIME types.
ACCEPTED_AUDIO_EXTENSIONS = {
    'mp3': ['audio/mp3']
}

# Prefix for data sent from the server to the client via JSON.
XSSI_PREFIX = ')]}\'\n'
# A regular expression for alphanumeric characters.
ALPHANUMERIC_REGEX = r'^[A-Za-z0-9]+$'

# These are here rather than in rating_services.py to avoid import
# circularities with exp_services.
# TODO(Jacob): Refactor exp_services to remove this problem.
_EMPTY_RATINGS = {'1': 0, '2': 0, '3': 0, '4': 0, '5': 0}


def get_empty_ratings():
    """Returns a copy of the empty ratings object.

    Returns:
        dict. Copy of the '_EMPTY_RATINGS' dict object which contains the empty
            ratings.
    """
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

# Committer id for system actions. The username for the system committer
# (i.e. admin) is also 'admin'.
SYSTEM_COMMITTER_ID = 'admin'
# Domain name for email address.
INCOMING_EMAILS_DOMAIN_NAME = 'example.com'
SYSTEM_EMAIL_ADDRESS = 'system@example.com'
SYSTEM_EMAIL_NAME = '.'
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
# Whether to enable maintenance mode on the site. For non-admins, this redirects
# all HTTP requests to the maintenance page. This is the only check which
# determines whether the site is in maintenance mode to avoid queries to the
# database by non-admins.
ENABLE_MAINTENANCE_MODE = False

# Whether community dashboard is ready to use for contributors.
COMMUNITY_DASHBOARD_ENABLED = False

# The interactions permissible for a question.
ALLOWED_QUESTION_INTERACTION_IDS = [
    'TextInput', 'MultipleChoiceInput', 'NumericInput']

# Flag to disable sending emails related to reviews for suggestions. To be
# flipped after deciding (and implementing) whether a user should be scored
# only for curated lessons.
SEND_SUGGESTION_REVIEW_RELATED_EMAILS = False
# To prevent recording scores for users until details like whether to score
# users for only curated lessons is confirmed.
ENABLE_RECORDING_OF_SCORES = False

# No. of pretest questions to display.
NUM_PRETEST_QUESTIONS = 3

# Whether to automatically accept suggestions after a threshold time.
ENABLE_AUTO_ACCEPT_OF_SUGGESTIONS = False

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
EMAIL_INTENT_ONBOARD_REVIEWER = 'onboard_reviewer'
EMAIL_INTENT_REMOVE_REVIEWER = 'remove_reviewer'
EMAIL_INTENT_REVIEW_SUGGESTIONS = 'review_suggestions'
EMAIL_INTENT_VOICEOVER_APPLICATION_UPDATES = 'voiceover_application_updates'
EMAIL_INTENT_ACCOUNT_DELETED = 'account_deleted'
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

# The maximum number of questions to be fetched at one time.
MAX_QUESTIONS_FETCHABLE_AT_ONE_TIME = 20

# The minimum score required for a user to review suggestions of a particular
# category.
MINIMUM_SCORE_REQUIRED_TO_REVIEW = 10

# The maximum number of skills to be requested at one time when fetching
# questions.
MAX_NUMBER_OF_SKILL_IDS = 20

# The prefix for an 'accepted suggestion' commit message.
COMMIT_MESSAGE_ACCEPTED_SUGGESTION_PREFIX = 'Accepted suggestion by'

# User id and username for exploration migration bot. Commits made by this bot
# are not reflected in the exploration summary models, but are recorded in the
# exploration commit log.
MIGRATION_BOT_USER_ID = 'OppiaMigrationBot'
MIGRATION_BOT_USERNAME = 'OppiaMigrationBot'

# User id and username for suggestion bot. This bot will be used to accept
# suggestions automatically after a threshold time.
SUGGESTION_BOT_USER_ID = 'OppiaSuggestionBot'
SUGGESTION_BOT_USERNAME = 'OppiaSuggestionBot'

# The system usernames are reserved usernames. Before adding new value to this
# dict, make sure that there aren't any similar usernames in the datastore.
# Note: All bot user IDs and usernames should start with "Oppia" and end with
# "Bot".
SYSTEM_USERS = {
    SYSTEM_COMMITTER_ID: SYSTEM_COMMITTER_ID,
    MIGRATION_BOT_USER_ID: MIGRATION_BOT_USERNAME,
    SUGGESTION_BOT_USER_ID: SUGGESTION_BOT_USERNAME
}

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
    'Svgdiagram': {
        'dir': os.path.join(RTE_EXTENSIONS_DIR, 'svgdiagram')
    },
    'Tabs': {
        'dir': os.path.join(RTE_EXTENSIONS_DIR, 'Tabs')
    },
    'Video': {
        'dir': os.path.join(RTE_EXTENSIONS_DIR, 'Video')
    },
}

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
    u'22': 'protractor_mobile_test_exploration.yaml',
    u'23': 'rating_test.yaml',
    u'24': 'learner_flow_test.yaml',
    u'25': 'exploration_player_test.yaml',
}

DEMO_COLLECTIONS = {
    u'0': 'welcome_to_collections.yaml',
    u'1': 'learner_flow_test_collection.yaml'
}

# IDs of explorations which should not be displayable in either the learner or
# editor views.
DISABLED_EXPLORATION_IDS = ['5']

# Oppia Google Group URL.
GOOGLE_GROUP_URL = (
    'https://groups.google.com/forum/?place=forum/oppia#!forum/oppia')

# External URL for the Foundation site.
FOUNDATION_SITE_URL = 'http://oppiafoundation.org'

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
CLASSROOM_DATA_HANDLER = '/classroom_data_handler'
COLLECTION_DATA_URL_PREFIX = '/collection_handler/data'
COLLECTION_EDITOR_DATA_URL_PREFIX = '/collection_editor_handler/data'
COLLECTION_SUMMARIES_DATA_URL = '/collectionsummarieshandler/data'
COLLECTION_RIGHTS_PREFIX = '/collection_editor_handler/rights'
COLLECTION_PUBLISH_PREFIX = '/collection_editor_handler/publish'
COLLECTION_UNPUBLISH_PREFIX = '/collection_editor_handler/unpublish'
COLLECTION_EDITOR_URL_PREFIX = '/collection_editor/create'
COLLECTION_URL_PREFIX = '/collection'
COMMUNITY_OPPORTUNITIES_DATA_URL = '/opportunitiessummaryhandler'
COMMUNITY_DASHBOARD_URL = '/community-dashboard'
CONCEPT_CARD_DATA_URL_PREFIX = '/concept_card_handler'
CREATOR_DASHBOARD_DATA_URL = '/creatordashboardhandler/data'
CREATOR_DASHBOARD_URL = '/creator-dashboard'
CSRF_HANDLER_URL = '/csrfhandler'
CUSTOM_NONPROFITS_LANDING_PAGE_URL = '/nonprofits'
CUSTOM_PARENTS_LANDING_PAGE_URL = '/parents'
CUSTOM_PARTNERS_LANDING_PAGE_URL = '/partners'
CUSTOM_TEACHERS_LANDING_PAGE_URL = '/teachers'
CUSTOM_VOLUNTEERS_LANDING_PAGE_URL = '/volunteers'
DASHBOARD_CREATE_MODE_URL = '%s?mode=create' % CREATOR_DASHBOARD_URL
EDITOR_URL_PREFIX = '/create'
EXPLORATION_DATA_PREFIX = '/createhandler/data'
EXPLORATION_FEATURES_PREFIX = '/explorehandler/features'
EXPLORATION_INIT_URL_PREFIX = '/explorehandler/init'
EXPLORATION_LEARNER_ANSWER_DETAILS = (
    '/learneranswerinfohandler/learner_answer_details')
EXPLORATION_METADATA_SEARCH_URL = '/exploration/metadata_search'
EXPLORATION_PRETESTS_URL_PREFIX = '/pretest_handler'
EXPLORATION_RIGHTS_PREFIX = '/createhandler/rights'
EXPLORATION_STATE_ANSWER_STATS_PREFIX = '/createhandler/state_answer_stats'
EXPLORATION_STATUS_PREFIX = '/createhandler/status'
EXPLORATION_SUMMARIES_DATA_URL = '/explorationsummarieshandler/data'
EXPLORATION_URL_PREFIX = '/explore'
EXPLORATION_URL_EMBED_PREFIX = '/embed/exploration'
FEEDBACK_STATS_URL_PREFIX = '/feedbackstatshandler'
FEEDBACK_THREAD_URL_PREFIX = '/threadhandler'
FEEDBACK_THREADLIST_URL_PREFIX = '/threadlisthandler'
FEEDBACK_THREADLIST_URL_PREFIX_FOR_TOPICS = '/threadlisthandlerfortopic'
FEEDBACK_THREAD_VIEW_EVENT_URL = '/feedbackhandler/thread_view_event'
FETCH_SKILLS_URL_PREFIX = '/fetch_skills'
FLAG_EXPLORATION_URL_PREFIX = '/flagexplorationhandler'
FRACTIONS_LANDING_PAGE_URL = '/fractions'
LEARNER_ANSWER_INFO_HANDLER_URL = (
    '/learneranswerinfohandler/learner_answer_details')
LEARNER_ANSWER_DETAILS_SUBMIT_URL = '/learneranswerdetailshandler'
LEARNER_DASHBOARD_URL = '/learner-dashboard'
LEARNER_DASHBOARD_DATA_URL = '/learnerdashboardhandler/data'
LEARNER_DASHBOARD_IDS_DATA_URL = '/learnerdashboardidshandler/data'
LEARNER_DASHBOARD_FEEDBACK_THREAD_DATA_URL = '/learnerdashboardthreadhandler'
LEARNER_PLAYLIST_DATA_URL = '/learnerplaylistactivityhandler'
LEARNER_INCOMPLETE_ACTIVITY_DATA_URL = '/learnerincompleteactivityhandler'
LIBRARY_GROUP_DATA_URL = '/librarygrouphandler'
LIBRARY_INDEX_URL = '/community-library'
LIBRARY_INDEX_DATA_URL = '/libraryindexhandler'
LIBRARY_RECENTLY_PUBLISHED_URL = '/community-library/recently-published'
LIBRARY_SEARCH_URL = '/search/find'
LIBRARY_SEARCH_DATA_URL = '/searchhandler/data'
LIBRARY_TOP_RATED_URL = '/community-library/top-rated'
MERGE_SKILLS_URL = '/merge_skills_handler'
NEW_COLLECTION_URL = '/collection_editor_handler/create_new'
NEW_EXPLORATION_URL = '/contributehandler/create_new'
NEW_QUESTION_URL = '/question_editor_handler/create_new'
NEW_SKILL_URL = '/skill_editor_handler/create_new'
TOPIC_EDITOR_STORY_URL = '/topic_editor_story_handler'
TOPIC_EDITOR_QUESTION_URL = '/topic_editor_question_handler'
NEW_TOPIC_URL = '/topic_editor_handler/create_new'
NOTIFICATIONS_DASHBOARD_URL = '/notifications'
PREFERENCES_URL = '/preferences'
PRACTICE_SESSION_URL_PREFIX = '/practice_session'
PRACTICE_SESSION_DATA_URL_PREFIX = '/practice_session/data'
PREFERENCES_DATA_URL = '/preferenceshandler/data'
QUESTION_EDITOR_DATA_URL_PREFIX = '/question_editor_handler/data'
QUESTION_SKILL_LINK_URL_PREFIX = '/manage_question_skill_link'
QUESTIONS_LIST_URL_PREFIX = '/questions_list_handler'
QUESTIONS_URL_PREFIX = '/question_player_handler'
RECENT_COMMITS_DATA_URL = '/recentcommitshandler/recent_commits'
RECENT_FEEDBACK_MESSAGES_DATA_URL = '/recent_feedback_messages'
DELETE_ACCOUNT_URL = '/delete-account'
DELETE_ACCOUNT_HANDLER_URL = '/delete-account-handler'
EXPORT_ACCOUNT_HANDLER_URL = '/export-account-handler'
PENDING_ACCOUNT_DELETION_URL = '/pending-account-deletion'
REVIEW_TEST_DATA_URL_PREFIX = '/review_test_handler/data'
REVIEW_TEST_URL_PREFIX = '/review_test'
ROBOTS_TXT_URL = '/robots.txt'
SITE_LANGUAGE_DATA_URL = '/save_site_language'
SIGNUP_DATA_URL = '/signuphandler/data'
SIGNUP_URL = '/signup'
SKILL_DATA_URL_PREFIX = '/skill_data_handler'
SKILL_EDITOR_DATA_URL_PREFIX = '/skill_editor_handler/data'
SKILL_EDITOR_URL_PREFIX = '/skill_editor'
SKILL_EDITOR_QUESTION_URL = '/skill_editor_question_handler'
SKILL_MASTERY_DATA_URL = '/skill_mastery_handler/data'
SKILL_RIGHTS_URL_PREFIX = '/skill_editor_handler/rights'
STORY_DATA_HANDLER = '/story_data_handler'
STORY_EDITOR_URL_PREFIX = '/story_editor'
STORY_EDITOR_DATA_URL_PREFIX = '/story_editor_handler/data'
STORY_PROGRESS_URL_PREFIX = '/story_progress_handler'
STORY_PUBLISH_HANDLER = '/story_publish_handler'
STORY_VIEWER_URL_PREFIX = '/story'
SUBTOPIC_DATA_HANDLER = '/subtopic_data_handler'
SUBTOPIC_VIEWER_URL_PREFIX = '/subtopic'
SUGGESTION_ACTION_URL_PREFIX = '/suggestionactionhandler'
SUGGESTION_LIST_URL_PREFIX = '/suggestionlisthandler'
SUGGESTION_URL_PREFIX = '/suggestionhandler'
SUBSCRIBE_URL_PREFIX = '/subscribehandler'
SUBTOPIC_PAGE_EDITOR_DATA_URL_PREFIX = '/subtopic_page_editor_handler/data'
TOPIC_VIEWER_URL_PREFIX = '/topic'
TOPIC_DATA_HANDLER = '/topic_data_handler'
TOPIC_EDITOR_DATA_URL_PREFIX = '/topic_editor_handler/data'
TOPIC_EDITOR_URL_PREFIX = '/topic_editor'
TOPIC_RIGHTS_URL_PREFIX = '/rightshandler/get_topic_rights'
TOPIC_SEND_MAIL_URL_PREFIX = '/rightshandler/send_topic_publish_mail'
TOPIC_STATUS_URL_PREFIX = '/rightshandler/change_topic_status'
TOPICS_AND_SKILLS_DASHBOARD_DATA_URL = '/topics_and_skills_dashboard/data'
TOPICS_AND_SKILLS_DASHBOARD_URL = '/topics-and-skills-dashboard'
UNSUBSCRIBE_URL_PREFIX = '/unsubscribehandler'
UPLOAD_EXPLORATION_URL = '/contributehandler/upload'
USER_EXPLORATION_EMAILS_PREFIX = '/createhandler/notificationpreferences'
USER_PERMISSIONS_URL_PREFIX = '/createhandler/permissions'
USERNAME_CHECK_DATA_URL = '/usernamehandler/data'
VALIDATE_STORY_EXPLORATIONS_URL_PREFIX = '/validate_story_explorations'

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

# Max number of playthroughs for an issue.
MAX_PLAYTHROUGHS_FOR_ISSUE = 5

# Number of unresolved answers to be displayed in the dashboard for each
# exploration.
TOP_UNRESOLVED_ANSWERS_COUNT_DASHBOARD = 3
# Number of open feedback to be displayed in the dashboard for each exploration.
OPEN_FEEDBACK_COUNT_DASHBOARD = 3
# NOTE TO DEVELOPERS: This should be synchronized with App.js.
ENABLE_ML_CLASSIFIERS = False

# The regular expression used to identify whether a string contains float value.
# The regex must match with regex that is stored in vmconf.py file of Oppia-ml.
# If this regex needs to be modified then first of all shutdown Oppia-ml VM.
# Then update the regex constant in here and Oppia both.
# Run any migration job that is required to migrate existing trained models
# before starting Oppia-ml again.
FLOAT_VERIFIER_REGEX = (
    '^([-+]?\\d*\\.\\d+)$|^([-+]?(\\d*\\.?\\d+|\\d+\\.?\\d*)e[-+]?\\d*)$')

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
LIBRARY_GROUP_RECENTLY_PUBLISHED = 'recently-published'
# The group name that appears at the end of the url for the top rated page.
LIBRARY_GROUP_TOP_RATED = 'top-rated'

# Defaults for topic similarities.
DEFAULT_TOPIC_SIMILARITY = 0.5
SAME_TOPIC_SIMILARITY = 1.0

# The type of the response returned by a handler when an exception is raised.
HANDLER_TYPE_HTML = 'html'
HANDLER_TYPE_JSON = 'json'
HANDLER_TYPE_DOWNLOADABLE = 'downloadable'

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

USER_FILTER_CRITERION_ROLE = 'role'
USER_FILTER_CRITERION_USERNAME = 'username'

QUESTION_BATCH_SIZE = 10

STATE_ANSWER_STATS_MIN_FREQUENCY = 2

RTE_FORMAT_TEXTANGULAR = 'text-angular'

RTE_FORMAT_CKEDITOR = 'ck-editor'

# RTE content specifications according to the type of the editor.
RTE_CONTENT_SPEC = {
    'RTE_TYPE_TEXTANGULAR': {
        # Valid parent-child relation in TextAngular.
        'ALLOWED_PARENT_LIST': {
            'p': ['blockquote', 'div', 'pre', '[document]', 'ol', 'ul', 'li'],
            'b': ['i', 'li', 'p', 'pre'],
            'br': ['b', 'i', 'li', 'p'],
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
            'oppia-noninteractive-tabs': ['b', 'i', 'li', 'p', 'pre'],
            'oppia-noninteractive-svgdiagram': ['b', 'i', 'li', 'p', 'pre']
        },
        # Valid html tags in TextAngular.
        'ALLOWED_TAG_LIST': [
            'p',
            'b',
            'br',
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
            'oppia-noninteractive-tabs',
            'oppia-noninteractive-svgdiagram'
        ]
    },
    'RTE_TYPE_CKEDITOR': {
        # Valid parent-child relation in CKEditor.
        'ALLOWED_PARENT_LIST': {
            'p': ['blockquote', '[document]', 'li'],
            'strong': ['em', 'li', 'p', 'pre'],
            'em': ['strong', 'li', 'p', 'pre'],
            'br': ['strong', 'em', 'li', 'p'],
            'li': ['ol', 'ul'],
            'ol': ['li', 'blockquote', 'pre', '[document]'],
            'ul': ['li', 'blockquote', 'pre', '[document]'],
            'pre': ['ol', 'ul', 'blockquote', 'li', '[document]'],
            'blockquote': ['blockquote', '[document]'],
            'oppia-noninteractive-link': ['strong', 'em', 'li', 'p', 'pre'],
            'oppia-noninteractive-math': ['strong', 'em', 'li', 'p', 'pre'],
            'oppia-noninteractive-image': ['blockquote', 'li', '[document]'],
            'oppia-noninteractive-svgdiagram': [
                'blockquote', 'li', '[document]'
            ],
            'oppia-noninteractive-collapsible': [
                'blockquote', 'li', '[document]'
            ],
            'oppia-noninteractive-video': ['blockquote', 'li', '[document]'],
            'oppia-noninteractive-tabs': ['blockquote', 'li', '[document]']
        },
        # Valid html tags in CKEditor.
        'ALLOWED_TAG_LIST': [
            'p',
            'strong',
            'br',
            'em',
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
            'oppia-noninteractive-tabs',
            'oppia-noninteractive-svgdiagram'
        ]

    }
}

# A dict representing available landing pages, having subject as a key and list
# of topics as the value.
# Note: This dict needs to be keep in sync with frontend TOPIC_LANDING_PAGE_DATA
# oppia constant defined in
# core/templates/pages/landing-pages/TopicLandingPage.js file.
AVAILABLE_LANDING_PAGES = {
    'math': ['fractions', 'negative-numbers', 'ratios']
}

# Classroom page names for generating URLs. These need to be kept in sync with
# TOPIC_IDS_FOR_CLASSROOM_PAGES property in config_domain.
CLASSROOM_PAGES = ['math']
