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

from __future__ import annotations

import copy
import datetime
import enum
import os

from core.constants import constants

from typing import Callable, Dict, Final, List, TypedDict, Union

MYPY = False
if MYPY:  # pragma: no cover
    # Here, we are importing 'state_domain' only for type checking.
    from core.domain import state_domain

# The datastore model ID for the list of featured activity references. This
# value should not be changed.
ACTIVITY_REFERENCE_LIST_FEATURED = 'featured'
ALL_ACTIVITY_REFERENCE_LIST_TYPES = [ACTIVITY_REFERENCE_LIST_FEATURED]

# The values which a post_commit_status can have: public, private.
POST_COMMIT_STATUS_PUBLIC = 'public'
POST_COMMIT_STATUS_PRIVATE = 'private'


class ValidCmdDict(TypedDict):
    """Dictionary representing valid commands specs."""

    name: str
    required_attribute_names: List[str]
    optional_attribute_names: List[str]
    user_id_attribute_names: List[str]
    allowed_values: Dict[str, List[str]]
    deprecated_values: Dict[str, List[str]]


class RteTypeTextAngularDict(TypedDict):
    """Dict representing RTE_TYPE_TEXTANGULAR Dictionary."""

    ALLOWED_PARENT_LIST: Dict[str, List[str]]
    ALLOWED_TAG_LIST: List[str]


# Supported object types for ParamSpec.
SUPPORTED_OBJ_TYPES = {
    'UnicodeString',
}


# Whether to unconditionally log info messages.
DEBUG = False


def check_dev_mode_is_true() -> None:
    """When DEV_MODE is true check that we are running in development
    environment. The SERVER_SOFTWARE environment variable does not exist
    in Travis, hence the need for an explicit check.
    """
    if constants.DEV_MODE and os.getenv('SERVER_SOFTWARE'):
        server_software = os.getenv('SERVER_SOFTWARE')
        if (
                server_software and
                not server_software.startswith(('Development', 'gunicorn'))
        ):
            raise Exception('DEV_MODE can\'t be true on production.')


check_dev_mode_is_true()

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
INTERACTIONS_SPECS_FILE_PATH = (
    os.path.join(INTERACTIONS_DIR, 'interaction_specs.json'))
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

OBJECT_DEFAULT_VALUES_EXTENSIONS_MODULE_PATH = os.path.join(
    'objects', 'object_defaults.json')
RULES_DESCRIPTIONS_EXTENSIONS_MODULE_PATH = os.path.join(
    'interactions', 'rule_templates.json')
HTML_FIELD_TYPES_TO_RULE_SPECS_EXTENSIONS_MODULE_PATH = os.path.join(
    'interactions', 'html_field_types_to_rule_specs.json')
LEGACY_HTML_FIELD_TYPES_TO_RULE_SPECS_EXTENSIONS_MODULE_DIR = os.path.join(
    'interactions', 'legacy_html_field_types_to_rule_specs_by_state_version')


class ValidModelNames(enum.Enum):
    """Enum for valid model names."""

    ACTIVITY = 'activity'
    APP_FEEDBACK_REPORT = 'app_feedback_report'
    AUDIT = 'audit'
    BASE_MODEL = 'base_model'
    BEAM_JOB = 'beam_job'
    BLOG = 'blog'
    CLASSIFIER = 'classifier'
    CLASSROOM = 'classroom'
    COLLECTION = 'collection'
    CONFIG = 'CONFIG'
    EMAIL = 'email'
    EXPLORATION = 'exploration'
    FEEDBACK = 'feedback'
    IMPROVEMENTS = 'improvements'
    JOB = 'job'
    LEARNER_GROUP = 'learner_group'
    OPPORTUNITY = 'opportunity'
    QUESTION = 'question'
    RECOMMENDATIONS = 'recommendations'
    SKILL = 'skill'
    STATISTICS = 'statistics'
    AUTH = 'auth'
    STORY = 'story'
    SUBTOPIC = 'subtopic'
    SUGGESTION = 'suggestion'
    TOPIC = 'topic'
    TRANSLATION = 'translation'
    USER = 'user'


# A mapping of interaction ids to classifier properties.
# TODO(#10217): As of now we support only one algorithm per interaction.
# However, we do have the necessary storage infrastructure to support multiple
# algorithms per interaction. Hence, whenever we find a secondary algorithm
# candidate for any of the supported interactions, the logical functions to
# support multiple algorithms need to be implemented.


class ClassifierDict(TypedDict):
    """Representing INTERACTION_CLASSIFIER_MAPPING dict values."""

    algorithm_id: str
    algorithm_version: int


INTERACTION_CLASSIFIER_MAPPING: Dict[str, ClassifierDict] = {
    'TextInput': {
        'algorithm_id': 'TextClassifier',
        'algorithm_version': 1
    },
}

# Classifier job time to live (in mins).
CLASSIFIER_JOB_TTL_MINS = 5
TRAINING_JOB_STATUS_COMPLETE = 'COMPLETE'
TRAINING_JOB_STATUS_FAILED = 'FAILED'
TRAINING_JOB_STATUS_NEW = 'NEW'
TRAINING_JOB_STATUS_PENDING = 'PENDING'

ALLOWED_TRAINING_JOB_STATUSES: List[str] = [
    TRAINING_JOB_STATUS_COMPLETE,
    TRAINING_JOB_STATUS_FAILED,
    TRAINING_JOB_STATUS_NEW,
    TRAINING_JOB_STATUS_PENDING
]

# Allowed formats of how HTML is present in rule specs.
HTML_RULE_VARIABLE_FORMAT_SET = 'set'
HTML_RULE_VARIABLE_FORMAT_STRING = 'string'
HTML_RULE_VARIABLE_FORMAT_LIST_OF_SETS = 'listOfSets'

ALLOWED_HTML_RULE_VARIABLE_FORMATS = [
    HTML_RULE_VARIABLE_FORMAT_SET,
    HTML_RULE_VARIABLE_FORMAT_STRING,
    HTML_RULE_VARIABLE_FORMAT_LIST_OF_SETS
]

ANSWER_TYPE_LIST_OF_SETS_OF_HTML = 'ListOfSetsOfHtmlStrings'
ANSWER_TYPE_SET_OF_HTML = 'SetOfHtmlString'

# The maximum number of characters allowed for userbio length.
MAX_BIO_LENGTH_IN_CHARS = 2000

ALLOWED_TRAINING_JOB_STATUS_CHANGES: Dict[str, List[str]] = {
    TRAINING_JOB_STATUS_COMPLETE: [],
    TRAINING_JOB_STATUS_NEW: [TRAINING_JOB_STATUS_PENDING],
    TRAINING_JOB_STATUS_PENDING: [TRAINING_JOB_STATUS_COMPLETE,
                                  TRAINING_JOB_STATUS_FAILED],
    TRAINING_JOB_STATUS_FAILED: [TRAINING_JOB_STATUS_NEW]
}

# Allowed formats of how HTML is present in rule specs.
HTML_RULE_VARIABLE_FORMAT_SET = 'set'
HTML_RULE_VARIABLE_FORMAT_STRING = 'string'
HTML_RULE_VARIABLE_FORMAT_LIST_OF_SETS = 'listOfSets'

ALLOWED_HTML_RULE_VARIABLE_FORMATS = [
    HTML_RULE_VARIABLE_FORMAT_SET,
    HTML_RULE_VARIABLE_FORMAT_STRING,
    HTML_RULE_VARIABLE_FORMAT_LIST_OF_SETS
]

ANSWER_TYPE_LIST_OF_SETS_OF_HTML = 'ListOfSetsOfHtmlStrings'
ANSWER_TYPE_SET_OF_HTML = 'SetOfHtmlString'

ENTITY_TYPE_BLOG_POST = 'blog_post'
ENTITY_TYPE_EXPLORATION = 'exploration'
ENTITY_TYPE_TOPIC = 'topic'
ENTITY_TYPE_SKILL = 'skill'
ENTITY_TYPE_STORY = 'story'
ENTITY_TYPE_QUESTION = 'question'

DIAGNOSTIC_TEST_QUESTION_TYPE_MAIN = 'main_question'
DIAGNOSTIC_TEST_QUESTION_TYPE_BACKUP = 'backup_question'

IMAGE_CONTEXT_QUESTION_SUGGESTIONS = 'question_suggestions'
IMAGE_CONTEXT_EXPLORATION_SUGGESTIONS = 'exploration_suggestions'

MAX_TASK_MODELS_PER_FETCH = 25
MAX_TASK_MODELS_PER_HISTORY_PAGE = 10

PERIOD_TO_HARD_DELETE_MODELS_MARKED_AS_DELETED = datetime.timedelta(weeks=8)
PERIOD_TO_MARK_MODELS_AS_DELETED = datetime.timedelta(weeks=4)

# The maximum number of activities allowed in the playlist of the learner. This
# limit applies to both the explorations playlist and the collections playlist.
MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT = 10

# The maximum number of goals allowed in the learner goals of the learner.
MAX_CURRENT_GOALS_COUNT = 5

# The minimum number of training samples required for training a classifier.
MIN_TOTAL_TRAINING_EXAMPLES = 50

# The minimum number of assigned labels required for training a classifier.
MIN_ASSIGNED_LABELS = 2

# Default label for classification algorithms.
DEFAULT_CLASSIFIER_LABEL = '_default'

# The maximum number of results to retrieve in a datastore query.
DEFAULT_QUERY_LIMIT = 1000

# The maximum number of results to retrieve in a datastore query
# for suggestions.
DEFAULT_SUGGESTION_QUERY_LIMIT = 1000

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

# The maximum number of days a feedback report can be saved in storage before it
# must be scrubbed.
APP_FEEDBACK_REPORT_MAXIMUM_LIFESPAN = datetime.timedelta(days=90)

# The minimum version of the Android feedback report info blob schema.
MINIMUM_ANDROID_REPORT_SCHEMA_VERSION = 1

# The current version of the Android feedback report info blob schema.
CURRENT_ANDROID_REPORT_SCHEMA_VERSION = 1

# The current version of the web feedback report info blob schema.
MINIMUM_WEB_REPORT_SCHEMA_VERSION = 1

# The current version of the web feedback report info blob schema.
CURRENT_WEB_REPORT_SCHEMA_VERSION = 1

# The current version of the app feedback report daily stats blob schema.
CURRENT_FEEDBACK_REPORT_STATS_SCHEMA_VERSION = 1

# The minimum version of the app feedback report daily stats blob schema.
MINIMUM_FEEDBACK_REPORT_STATS_SCHEMA_VERSION = 1

# The current version of the dashboard stats blob schema. If any backward-
# incompatible changes are made to the stats blob schema in the data store,
# this version number must be changed.
CURRENT_DASHBOARD_STATS_SCHEMA_VERSION = 1

# The earliest supported version of the exploration states blob schema.
EARLIEST_SUPPORTED_STATE_SCHEMA_VERSION = 41

# The current version of the exploration states blob schema. If any backward-
# incompatible changes are made to the states blob schema in the data store,
# this version number must be changed and the exploration migration job
# executed.
CURRENT_STATE_SCHEMA_VERSION = 53

# The current version of the all collection blob schemas (such as the nodes
# structure within the Collection domain object). If any backward-incompatible
# changes are made to any of the blob schemas in the data store, this version
# number must be changed.
CURRENT_COLLECTION_SCHEMA_VERSION = 6

# The current version of story contents dict in the story schema.
CURRENT_STORY_CONTENTS_SCHEMA_VERSION = 5

# The current version of skill contents dict in the skill schema.
CURRENT_SKILL_CONTENTS_SCHEMA_VERSION = 4

# The current version of misconceptions dict in the skill schema.
CURRENT_MISCONCEPTIONS_SCHEMA_VERSION = 5

# The current version of rubric dict in the skill schema.
CURRENT_RUBRIC_SCHEMA_VERSION = 5

# The current version of subtopics dict in the topic schema.
CURRENT_SUBTOPIC_SCHEMA_VERSION = 4

# The current version of story reference dict in the topic schema.
CURRENT_STORY_REFERENCE_SCHEMA_VERSION = 1

# The current version of page_contents dict in the subtopic page schema.
CURRENT_SUBTOPIC_PAGE_CONTENTS_SCHEMA_VERSION = 4

# This value should be updated in the event of any
# StateAnswersModel.submitted_answer_list schema change.
CURRENT_STATE_ANSWERS_SCHEMA_VERSION = 1

# This value should be updated if the schema of LearnerAnswerInfo
# dict schema changes.
CURRENT_LEARNER_ANSWER_INFO_SCHEMA_VERSION = 1

# This value should be updated if the schema of PlatformParameterRule dict
# schema changes.
CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION = 1

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
# Content id assigned to rule inputs that do not match any interaction
# customization argument choices.
INVALID_CONTENT_ID = 'invalid_content_id'
# Default recorded_voiceovers dict for a default state template.
DEFAULT_RECORDED_VOICEOVERS: state_domain.RecordedVoiceoversDict = {
    'voiceovers_mapping': {
        'content': {},
        'default_outcome': {}
    }
}
# Default written_translations dict for a default state template.
DEFAULT_WRITTEN_TRANSLATIONS: state_domain.WrittenTranslationsDict = {
    'translations_mapping': {
        'content': {},
        'default_outcome': {}
    }
}
# The default content text for the initial state of an exploration.
DEFAULT_INIT_STATE_CONTENT_STR = ''

# Whether new explorations should have automatic text-to-speech enabled
# by default.
DEFAULT_AUTO_TTS_ENABLED = False
# Whether new explorations should have correctness-feedback enabled
# by default.
DEFAULT_CORRECTNESS_FEEDBACK_ENABLED = True

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
COMPRESSIBLE_IMAGE_FORMATS = [IMAGE_FORMAT_JPEG, IMAGE_FORMAT_PNG]

# An array containing the accepted audio extensions for uploaded files and
# the corresponding MIME types.
ACCEPTED_AUDIO_EXTENSIONS = {
    'mp3': ['audio/mp3']
}

# Prefix for data sent from the server to the client via JSON.
XSSI_PREFIX = b')]}\'\n'
# A regular expression for alphanumeric characters.
ALPHANUMERIC_REGEX = r'^[A-Za-z0-9]+$'

# These are here rather than in rating_services.py to avoid import
# circularities with exp_services.
# TODO(Jacob): Refactor exp_services to remove this problem.
_EMPTY_RATINGS = {'1': 0, '2': 0, '3': 0, '4': 0, '5': 0}


def get_empty_ratings() -> Dict[str, int]:
    """Returns a copy of the empty ratings object.

    Returns:
        dict. Copy of the '_EMPTY_RATINGS' dict object which contains the empty
        ratings.
    """
    return copy.deepcopy(_EMPTY_RATINGS)


# To use mailchimp email service.
BULK_EMAIL_SERVICE_PROVIDER_MAILCHIMP = 'mailchimp_email_service'
# Use GAE email service by default.
BULK_EMAIL_SERVICE_PROVIDER = BULK_EMAIL_SERVICE_PROVIDER_MAILCHIMP

# Empty scaled average rating as a float.
EMPTY_SCALED_AVERAGE_RATING = 0.0

# To use mailgun email service.
EMAIL_SERVICE_PROVIDER_MAILGUN = 'mailgun_email_service'
# Use GAE email service by default.
EMAIL_SERVICE_PROVIDER = EMAIL_SERVICE_PROVIDER_MAILGUN
# If the Mailgun email API is used, the "None" below should be replaced
# with the Mailgun API key.
MAILGUN_API_KEY = None
# If the Mailgun email API is used, the "None" below should be replaced
# with the Mailgun domain name (ending with mailgun.org).
MAILGUN_DOMAIN_NAME = None

# Audience ID of the mailing list for Oppia in Mailchimp.
MAILCHIMP_AUDIENCE_ID = None
# Mailchimp API Key.
MAILCHIMP_API_KEY = None
# Mailchimp username.
MAILCHIMP_USERNAME = None
# Mailchimp secret, used to authenticate webhook requests.
MAILCHIMP_WEBHOOK_SECRET = None
# Valid Mailchimp merge keys.
VALID_MAILCHIMP_FIELD_KEYS = ['NAME']
# Valid Mailchimp tags.
VALID_MAILCHIMP_TAGS = ['Android', 'Web']

ES_LOCALHOST_PORT = 9200
# NOTE TO RELEASE COORDINATORS: Replace this with the correct ElasticSearch
# auth information during deployment.
ES_CLOUD_ID = None
ES_USERNAME = None
ES_PASSWORD = None

# NOTE TO RELEASE COORDINATORS: Replace this with the correct Redis Host and
# Port when switching to prod server. Keep this in sync with redis.conf in the
# root folder. Specifically, REDISPORT should always be the same as the port in
# redis.conf.
REDISHOST = 'localhost'
REDISPORT = 6379

# The DB numbers for various Redis instances that Oppia uses. Do not reuse these
# if you're creating a new Redis client.
OPPIA_REDIS_DB_INDEX = 0
CLOUD_NDB_REDIS_DB_INDEX = 1
STORAGE_EMULATOR_REDIS_DB_INDEX = 2


# NOTE TO RELEASE COORDINATORS: Replace this project id with the correct oppia
# project id when switching to the prod server.
OPPIA_PROJECT_ID = 'dev-project-id'
GOOGLE_APP_ENGINE_REGION = 'us-central1'

# NOTE TO RELEASE COORDINATORS: Replace these GCS bucket paths with real prod
# buckets. It's OK for them to be the same.
DATAFLOW_TEMP_LOCATION = 'gs://todo/todo'
DATAFLOW_STAGING_LOCATION = 'gs://todo/todo'

OPPIA_VERSION = '3.2.8'
OPPIA_PYTHON_PACKAGE_PATH = './build/oppia-beam-job-%s.tar.gz' % OPPIA_VERSION

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
NUM_PRETEST_QUESTIONS = 0

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
EMAIL_INTENT_ADDRESS_CONTRIBUTOR_DASHBOARD_SUGGESTIONS = (
    'address_contributor_dashboard_suggestions'
)
EMAIL_INTENT_REVIEW_CREATOR_DASHBOARD_SUGGESTIONS = (
    'review_creator_dashboard_suggestions')
EMAIL_INTENT_REVIEW_CONTRIBUTOR_DASHBOARD_SUGGESTIONS = (
    'review_contributor_dashboard_suggestions'
)
EMAIL_INTENT_ADD_CONTRIBUTOR_DASHBOARD_REVIEWERS = (
    'add_contributor_dashboard_reviewers'
)
EMAIL_INTENT_ACCOUNT_DELETED = 'account_deleted'
EMAIL_INTENT_NOTIFY_CONTRIBUTOR_DASHBOARD_ACHIEVEMENTS = (
    'notify_contributor_dashboard_achievements'
)
# Possible intents for email sent in bulk.
BULK_EMAIL_INTENT_MARKETING = 'bulk_email_marketing'
BULK_EMAIL_INTENT_IMPROVE_EXPLORATION = 'bulk_email_improve_exploration'
BULK_EMAIL_INTENT_CREATE_EXPLORATION = 'bulk_email_create_exploration'
BULK_EMAIL_INTENT_CREATOR_REENGAGEMENT = 'bulk_email_creator_reengagement'
BULK_EMAIL_INTENT_LEARNER_REENGAGEMENT = 'bulk_email_learner_reengagement'
BULK_EMAIL_INTENT_ML_JOB_FAILURE = 'bulk_email_ml_job_failure'
BULK_EMAIL_INTENT_TEST = 'bulk_email_test'

MESSAGE_TYPE_FEEDBACK = 'feedback'
MESSAGE_TYPE_SUGGESTION = 'suggestion'

MODERATOR_ACTION_UNPUBLISH_EXPLORATION = 'unpublish_exploration'
DEFAULT_SALUTATION_HTML_FN: Callable[[str], str] = (
    lambda recipient_username: 'Hi %s,' % recipient_username)
DEFAULT_SIGNOFF_HTML_FN: Callable[[str], str] = (
    lambda sender_username: (
        'Thanks!<br>%s (Oppia moderator)' % sender_username))
DEFAULT_EMAIL_SUBJECT_FN: Callable[[str], str] = (
    lambda exp_title: (
        'Your Oppia exploration "%s" has been unpublished' % exp_title))

VALID_MODERATOR_ACTIONS: Dict[
    str,
    Dict[str, Union[str, Callable[[str], str]]]
] = {
    MODERATOR_ACTION_UNPUBLISH_EXPLORATION: {
        'email_config': 'unpublish_exploration_email_html_body',
        'email_subject_fn': DEFAULT_EMAIL_SUBJECT_FN,
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

# Timestamp in sec since epoch for Mar 1 2021 12:00:00 UTC for the earliest
# datetime that a report could be received.
EARLIEST_APP_FEEDBACK_REPORT_DATETIME = datetime.datetime.fromtimestamp(
    1614556800)

# The minimum and maximum package version codes for Oppia Android.
MINIMUM_ANDROID_PACKAGE_VERSION_CODE = 1

# We generate images for existing math rich text components in batches. This
# gives the maximum size for a batch of Math SVGs in bytes.
MAX_SIZE_OF_MATH_SVGS_BATCH_BYTES = 31 * 1024 * 1024

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

# The maximum number of blog post cards to be visible on each page in blog
# homepage.
MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE = 10

# The maximum number of blog post cards to be visible on each page in blog
# search results homepage.
MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_SEARCH_RESULTS_PAGE = 10

# The maximum number of blog post cards to be visible on each page in author
# specific blog post page.
MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_AUTHOR_PROFILE_PAGE = 12

# The maximum number of blog post cards to be visible as suggestions on the
# blog post page.
MAX_POSTS_TO_RECOMMEND_AT_END_OF_BLOG_POST = 2

# The prefix for an 'accepted suggestion' commit message.
COMMIT_MESSAGE_ACCEPTED_SUGGESTION_PREFIX = 'Accepted suggestion by'

# User id and username for exploration migration bot. Commits made by this bot
# are not reflected in the exploration summary models, but are recorded in the
# exploration commit log.
MIGRATION_BOT_USER_ID = 'OppiaMigrationBot'
MIGRATION_BOT_USERNAME = 'OppiaMigrationBot'

# User id for scrubber bot. This bot is used to represent the cron job that
# scrubs expired app feedback reports.
APP_FEEDBACK_REPORT_SCRUBBER_BOT_ID = 'AppFeedbackReportScrubberBot'
APP_FEEDBACK_REPORT_SCRUBBER_BOT_USERNAME = 'AppFeedbackReportScrubberBot'

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
    SUGGESTION_BOT_USER_ID: SUGGESTION_BOT_USERNAME,
    APP_FEEDBACK_REPORT_SCRUBBER_BOT_ID: (
        APP_FEEDBACK_REPORT_SCRUBBER_BOT_USERNAME)
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
    u'0': 'welcome',
    u'1': 'multiples.yaml',
    # Exploration with ID 2 was removed as it contained string values inside
    # NumericInput interaction.
    u'3': 'root_linear_coefficient_theorem',
    u'4': 'three_balls',
    # TODO(bhenning): Replace demo exploration '5' with a new exploration
    # described in #1376.
    u'6': 'boot_verbs.yaml',
    u'7': 'hola.yaml',
    # Exploration with ID 8 was removed as it contained string values inside
    # NumericInput interaction.
    u'9': 'pitch_perfect.yaml',
    u'10': 'test_interactions',
    u'11': 'modeling_graphs',
    u'12': 'protractor_test_1.yaml',
    u'13': 'solar_system',
    u'14': 'about_oppia.yaml',
    u'15': 'classifier_demo_exploration.yaml',
    u'16': 'all_interactions',
    u'17': 'audio_test',
    # Exploration with ID 18 was used for testing CodeClassifier functionality
    # which has been removed (#10060).
    u'19': 'example_exploration_in_collection1.yaml',
    u'20': 'example_exploration_in_collection2.yaml',
    u'21': 'example_exploration_in_collection3.yaml',
    u'22': 'protractor_mobile_test_exploration.yaml',
    u'23': 'rating_test.yaml',
    u'24': 'learner_flow_test.yaml',
    u'25': 'exploration_player_test.yaml',
    u'26': 'android_interactions',
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

# NOTE TO RELEASE COORDINATORS: External URL for the oppia production site.
# Change to the correct url for internal testing in the testing production
# environment.
# Change to the production URL when deploying to production site.
OPPIA_SITE_URL = 'http://localhost:8181'

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
TASK_URL_CONTRIBUTOR_DASHBOARD_ACHIEVEMENT_NOTIFICATION_EMAILS = (
    '%s/email/contributordashboardachievementnotificationemailhandler' % (
        TASKQUEUE_URL_PREFIX))
TASK_URL_DEFERRED = (
    '%s/deferredtaskshandler' % TASKQUEUE_URL_PREFIX)

# TODO(sll): Add all other URLs here.
ABOUT_FOUNDATION_PAGE_URL = '/about-foundation'
ADMIN_URL = '/admin'
ADMIN_ROLE_HANDLER_URL = '/adminrolehandler'
BLOG_ADMIN_PAGE_URL = '/blog-admin'
CLASSROOM_ADMIN_PAGE_URL = '/classroom-admin'
BLOG_ADMIN_ROLE_HANDLER_URL = '/blogadminrolehandler'
BLOG_DASHBOARD_DATA_URL = '/blogdashboardhandler/data'
BLOG_DASHBOARD_URL = '/blog-dashboard'
DIAGNOSTIC_TEST_PLAYER_PAGE_URL = '/diagnostic-test-player'
BLOG_EDITOR_DATA_URL_PREFIX = '/blogeditorhandler/data'
BULK_EMAIL_WEBHOOK_ENDPOINT = '/bulk_email_webhook_endpoint'
BLOG_HOMEPAGE_DATA_URL = '/blogdatahandler/data'
BLOG_HOMEPAGE_URL = '/blog'
BLOG_SEARCH_DATA_URL = '/blog/searchhandler/data'
BLOG_AUTHOR_PROFILE_PAGE_URL_PREFIX = '/blog/author'
BLOG_AUTHOR_PROFILE_PAGE_DATA_URL_PREFIX = '/blog/author/data'
CLASSROOM_DATA_HANDLER = '/classroom_data_handler'
COLLECTION_DATA_URL_PREFIX = '/collection_handler/data'
COLLECTION_EDITOR_DATA_URL_PREFIX = '/collection_editor_handler/data'
COLLECTION_SUMMARIES_DATA_URL = '/collectionsummarieshandler/data'
COLLECTION_RIGHTS_PREFIX = '/collection_editor_handler/rights'
COLLECTION_PUBLISH_PREFIX = '/collection_editor_handler/publish'
COLLECTION_UNPUBLISH_PREFIX = '/collection_editor_handler/unpublish'
COLLECTION_EDITOR_URL_PREFIX = '/collection_editor/create'
COLLECTION_URL_PREFIX = '/collection'
CONCEPT_CARD_DATA_URL_PREFIX = '/concept_card_handler'
CONTRIBUTOR_DASHBOARD_URL = '/contributor-dashboard'
CONTRIBUTOR_STATS_SUMMARIES_URL = '/contributorstatssummaries'
CONTRIBUTOR_ALL_STATS_SUMMARIES_URL = '/contributorallstatssummaries'
CONTRIBUTOR_DASHBOARD_ADMIN_URL = '/contributor-dashboard-admin'
CONTRIBUTOR_OPPORTUNITIES_DATA_URL = '/opportunitiessummaryhandler'
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
EXPLORATION_IMAGE_UPLOAD_PREFIX = '/createhandler/imageupload'
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
IMPROVEMENTS_URL_PREFIX = '/improvements'
IMPROVEMENTS_HISTORY_URL_PREFIX = '/improvements/history'
IMPROVEMENTS_CONFIG_URL_PREFIX = '/improvements/config'
LEARNER_ANSWER_INFO_HANDLER_URL = (
    '/learneranswerinfohandler/learner_answer_details')
LEARNER_ANSWER_DETAILS_SUBMIT_URL = '/learneranswerdetailshandler'
LEARNER_DASHBOARD_URL = '/learner-dashboard'
LEARNER_DASHBOARD_TOPIC_AND_STORY_DATA_URL = (
    '/learnerdashboardtopicsandstoriesprogresshandler/data')
LEARNER_COMPLETED_CHAPTERS_COUNT_DATA_URL = (
    '/learnercompletedchapterscounthandler/data')
LEARNER_DASHBOARD_COLLECTION_DATA_URL = (
    '/learnerdashboardcollectionsprogresshandler/data')
LEARNER_DASHBOARD_EXPLORATION_DATA_URL = (
    '/learnerdashboardexplorationsprogresshandler/data')
LEARNER_DASHBOARD_FEEDBACK_UPDATES_DATA_URL = (
    '/learnerdashboardfeedbackupdateshandler/data')
LEARNER_DASHBOARD_IDS_DATA_URL = '/learnerdashboardidshandler/data'
LEARNER_DASHBOARD_FEEDBACK_THREAD_DATA_URL = '/learnerdashboardthreadhandler'
LEARNER_GOALS_DATA_URL = '/learnergoalshandler'
LEARNER_PLAYLIST_DATA_URL = '/learnerplaylistactivityhandler'
LEARNER_INCOMPLETE_ACTIVITY_DATA_URL = '/learnerincompleteactivityhandler'
LIBRARY_GROUP_DATA_URL = '/librarygrouphandler'
LIBRARY_INDEX_URL = '/community-library'
LIBRARY_INDEX_DATA_URL = '/libraryindexhandler'
LIBRARY_RECENTLY_PUBLISHED_URL = '/community-library/recently-published'
LIBRARY_SEARCH_URL = '/search/find'
LIBRARY_SEARCH_DATA_URL = '/searchhandler/data'
LIBRARY_TOP_RATED_URL = '/community-library/top-rated'
MACHINE_TRANSLATION_DATA_URL = '/machine_translated_state_texts_handler'
MERGE_SKILLS_URL = '/merge_skills_handler'
METADATA_VERSION_HISTORY_URL_PREFIX = '/version_history_handler/metadata'
NEW_COLLECTION_URL = '/collection_editor_handler/create_new'
NEW_EXPLORATION_URL = '/contributehandler/create_new'
NEW_QUESTION_URL = '/question_editor_handler/create_new'
NEW_SKILL_URL = '/skill_editor_handler/create_new'
TOPIC_EDITOR_STORY_URL = '/topic_editor_story_handler'
TOPIC_EDITOR_QUESTION_URL = '/topic_editor_question_handler'
NEW_TOPIC_URL = '/topic_editor_handler/create_new'
PREFERENCES_URL = '/preferences'
PRACTICE_SESSION_URL_PREFIX = '/practice_session'
PRACTICE_SESSION_DATA_URL_PREFIX = '/practice_session/data'
PREFERENCES_DATA_URL = '/preferenceshandler/data'
QUESTION_EDITOR_DATA_URL_PREFIX = '/question_editor_handler/data'
QUESTION_SKILL_LINK_URL_PREFIX = '/manage_question_skill_link'
QUESTIONS_LIST_URL_PREFIX = '/questions_list_handler'
QUESTION_COUNT_URL_PREFIX = '/question_count_handler'
QUESTIONS_URL_PREFIX = '/question_player_handler'
RECENT_COMMITS_DATA_URL = '/recentcommitshandler/recent_commits'
RECENT_FEEDBACK_MESSAGES_DATA_URL = '/recent_feedback_messages'
DELETE_ACCOUNT_URL = '/delete-account'
DELETE_ACCOUNT_HANDLER_URL = '/delete-account-handler'
EXPORT_ACCOUNT_HANDLER_URL = '/export-account-handler'
PENDING_ACCOUNT_DELETION_URL = '/pending-account-deletion'
REVIEW_TEST_DATA_URL_PREFIX = '/review_test_handler/data'
REVIEW_TEST_URL_PREFIX = '/review_test'
REVIEWABLE_OPPORTUNITIES_URL = '/getreviewableopportunitieshandler'
ROBOTS_TXT_URL = '/robots.txt'
SITE_LANGUAGE_DATA_URL = '/save_site_language'
SIGNUP_DATA_URL = '/signuphandler/data'
SIGNUP_URL = '/signup'
SKILL_DASHBOARD_DATA_URL = '/skills_dashboard/data'
SKILL_DATA_URL_PREFIX = '/skill_data_handler'
SKILL_EDITOR_DATA_URL_PREFIX = '/skill_editor_handler/data'
SKILL_EDITOR_URL_PREFIX = '/skill_editor'
SKILL_EDITOR_QUESTION_URL = '/skill_editor_question_handler'
SKILL_MASTERY_DATA_URL = '/skill_mastery_handler/data'
SKILL_RIGHTS_URL_PREFIX = '/skill_editor_handler/rights'
SKILL_DESCRIPTION_HANDLER = '/skill_description_handler'
DIAGNOSTIC_TEST_SKILL_ASSIGNMENT_HANDLER = (
    '/diagnostic_test_skill_assignment_handler')
DIAGNOSTIC_TEST_QUESTIONS_HANDLER_URL = '/diagnostic_test_questions_handler_url'
STATE_VERSION_HISTORY_URL_PREFIX = '/version_history_handler/state'
STORY_DATA_HANDLER = '/story_data_handler'
STORY_EDITOR_URL_PREFIX = '/story_editor'
STORY_EDITOR_DATA_URL_PREFIX = '/story_editor_handler/data'
STORY_PROGRESS_URL_PREFIX = '/story_progress_handler'
STORY_PUBLISH_HANDLER = '/story_publish_handler'
STORY_URL_FRAGMENT_HANDLER = '/story_url_fragment_handler'
STORY_VIEWER_URL_PREFIX = '/story'
SUBTOPIC_DATA_HANDLER = '/subtopic_data_handler'
# This should be synchronized with SUBTOPIC_MASTERY_DATA_URL_TEMPLATE
# in app.constants.ts.
SUBTOPIC_MASTERY_DATA_URL = '/subtopic_mastery_handler/data'
SUBTOPIC_VIEWER_URL_PREFIX = '/subtopic'
SUGGESTION_ACTION_URL_PREFIX = '/suggestionactionhandler'
SUGGESTION_LIST_URL_PREFIX = '/suggestionlisthandler'
SUGGESTION_URL_PREFIX = '/suggestionhandler'
UPDATE_TRANSLATION_SUGGESTION_URL_PREFIX = (
    '/updatetranslationsuggestionhandler')
UPDATE_QUESTION_SUGGESTION_URL_PREFIX = (
    '/updatequestionsuggestionhandler')
SUBSCRIBE_URL_PREFIX = '/subscribehandler'
SUBTOPIC_PAGE_EDITOR_DATA_URL_PREFIX = '/subtopic_page_editor_handler/data'
TOPIC_VIEWER_URL_PREFIX = (
    '/learn/<classroom_url_fragment>/<topic_url_fragment>')
TOPIC_DATA_HANDLER = '/topic_data_handler'
TOPIC_ID_TO_TOPIC_NAME = '/topic_id_to_topic_name_handler'
TOPIC_EDITOR_DATA_URL_PREFIX = '/topic_editor_handler/data'
TOPIC_EDITOR_URL_PREFIX = '/topic_editor'
TOPIC_NAME_HANDLER = '/topic_name_handler'
TOPIC_RIGHTS_URL_PREFIX = '/rightshandler/get_topic_rights'
TOPIC_SEND_MAIL_URL_PREFIX = '/rightshandler/send_topic_publish_mail'
TOPIC_STATUS_URL_PREFIX = '/rightshandler/change_topic_status'
TOPIC_URL_FRAGMENT_HANDLER = '/topic_url_fragment_handler'
TOPICS_AND_SKILLS_DASHBOARD_DATA_URL = '/topics_and_skills_dashboard/data'
UNASSIGN_SKILL_DATA_HANDLER_URL = '/topics_and_skills_dashboard/unassign_skill'
TOPIC_ID_TO_DIAGNOSTIC_TEST_SKILL_IDS_HANDLER = (
    '/topic_id_to_diagnostic_test_skill_ids_handler')
TOPICS_AND_SKILLS_DASHBOARD_URL = '/topics-and-skills-dashboard'
UNSUBSCRIBE_URL_PREFIX = '/unsubscribehandler'
UPLOAD_EXPLORATION_URL = '/contributehandler/upload'
USER_EXPLORATION_EMAILS_PREFIX = '/createhandler/notificationpreferences'
USER_PERMISSIONS_URL_PREFIX = '/createhandler/permissions'
USERNAME_CHECK_DATA_URL = '/usernamehandler/data'
VALIDATE_STORY_EXPLORATIONS_URL_PREFIX = '/validate_story_explorations'
FACILITATOR_DASHBOARD_HANDLER = '/facilitator_dashboard_handler'
FACILITATOR_DASHBOARD_PAGE_URL = '/facilitator-dashboard'
LEARNER_DASHBOARD_LEARNER_GROUPS_HANDLER = (
    '/learner_dashboard_learner_groups_handler')
CREATE_LEARNER_GROUP_PAGE_URL = '/create-learner-group'
EDIT_LEARNER_GROUP_PAGE_URL = '/edit-learner-group'
CLASSROOM_ADMIN_DATA_HANDLER_URL = '/classroom_admin_data_handler'
CLASSROOM_ID_HANDLER_URL = '/classroom_id_handler'
CLASSROOM_HANDLER_URL = '/classroom'
CLASSROOM_URL_FRAGMENT_HANDLER = '/classroom_url_fragment_handler'

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
# NOTE TO DEVELOPERS: This should be synchronized with app.constants.ts.
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

ALLOWED_USER_QUERY_STATUSES = (
    USER_QUERY_STATUS_PROCESSING,
    USER_QUERY_STATUS_COMPLETED,
    USER_QUERY_STATUS_ARCHIVED,
    USER_QUERY_STATUS_FAILED
)

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
# TODO(#13388): The role id variable name doesn't match the string value,
# write a one-off job to update the string value in the datastore.
ROLE_ID_CURRICULUM_ADMIN = 'ADMIN'
ROLE_ID_BLOG_ADMIN = 'BLOG_ADMIN'
ROLE_ID_BLOG_POST_EDITOR = 'BLOG_POST_EDITOR'
ROLE_ID_COLLECTION_EDITOR = 'COLLECTION_EDITOR'
ROLE_ID_FULL_USER = 'EXPLORATION_EDITOR'
ROLE_ID_GUEST = 'GUEST'
ROLE_ID_MOBILE_LEARNER = 'LEARNER'
ROLE_ID_MODERATOR = 'MODERATOR'
ROLE_ID_QUESTION_ADMIN = 'QUESTION_ADMIN'
ROLE_ID_RELEASE_COORDINATOR = 'RELEASE_COORDINATOR'
ROLE_ID_TOPIC_MANAGER = 'TOPIC_MANAGER'
ROLE_ID_TRANSLATION_ADMIN = 'TRANSLATION_ADMIN'
ROLE_ID_VOICEOVER_ADMIN = 'VOICEOVER_ADMIN'

ALLOWED_DEFAULT_USER_ROLES_ON_REGISTRATION = [
    ROLE_ID_FULL_USER, ROLE_ID_MOBILE_LEARNER]

ALLOWED_USER_ROLES = [
    ROLE_ID_CURRICULUM_ADMIN,
    ROLE_ID_BLOG_ADMIN,
    ROLE_ID_BLOG_POST_EDITOR,
    ROLE_ID_COLLECTION_EDITOR,
    ROLE_ID_FULL_USER,
    ROLE_ID_GUEST,
    ROLE_ID_MOBILE_LEARNER,
    ROLE_ID_MODERATOR,
    ROLE_ID_QUESTION_ADMIN,
    ROLE_ID_RELEASE_COORDINATOR,
    ROLE_ID_TOPIC_MANAGER,
    ROLE_ID_TRANSLATION_ADMIN,
    ROLE_ID_VOICEOVER_ADMIN
]

# Intent of the User making query to role structure via admin interface. Used
# to store audit data regarding queries to role IDs.
ROLE_ACTION_ADD = 'add'
ROLE_ACTION_REMOVE = 'remove'
DEPRECATED_ROLE_ACTION_UPDATE = 'update'
ROLE_ACTION_VIEW_BY_USERNAME = 'view_by_username'
ROLE_ACTION_VIEW_BY_ROLE = 'view_by_role'

USER_FILTER_CRITERION_ROLE: Final = 'role'
USER_FILTER_CRITERION_USERNAME: Final = 'username'

# Max questions allowed in a session of practice questions.
QUESTION_BATCH_SIZE = 10

STATE_ANSWER_STATS_MIN_FREQUENCY = 2

RTE_FORMAT_TEXTANGULAR = 'text-angular'

RTE_FORMAT_CKEDITOR = 'ck-editor'

# RTE content specifications according to the type of the editor.
RTE_CONTENT_SPEC: Dict[str, RteTypeTextAngularDict] = {
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
            'oppia-noninteractive-tabs': ['b', 'i', 'li', 'p', 'pre']
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
            'oppia-noninteractive-tabs'
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
            'oppia-noninteractive-tabs'
        ]

    }
}

# Classroom page names for generating URLs. These need to be kept in sync with
# CLASSROOM_PAGES_DATA property in config_domain.
CLASSROOM_PAGES = ['math']

# Authentication method using GAE ID (google sign in).
GAE_AUTH_PROVIDER_ID = 'gae'
# Authentication method using Firebase authentication. Firebase signs its ID
# Tokens with iss='Firebase' (iss: issuer, public API refers to this as
# "provider id"), so using this naming convention helps us stay consistent with
# the status quo.
FIREBASE_AUTH_PROVIDER_ID = 'Firebase'
# Firebase-specific role specified for users with super admin privileges.
FIREBASE_ROLE_SUPER_ADMIN = 'super_admin'

# Firebase *explicitly* requires IDs to have at most 128 characters, and may
# contain any valid ASCII character:
# https://firebase.google.com/docs/auth/admin/manage-users#create_a_user
#
# After manually inspecting ~200 of them, however, we've found that they only
# use alpha-numeric characters, hence the tighter restriction.
FIREBASE_AUTH_ID_REGEX = '^[A-Za-z0-9]{1,128}$'

CLOUD_DATASTORE_EMULATOR_HOST = 'localhost'
CLOUD_DATASTORE_EMULATOR_PORT = 8089

FIREBASE_EMULATOR_CONFIG_PATH = '.firebase.json'
FIREBASE_EMULATOR_PORT = 9099

# The duration a session cookie from Firebase should remain valid for. After the
# duration expires, a new cookie will need to be generated. Generating a new
# cookie requires the user to sign-in _explicitly_.
FIREBASE_SESSION_COOKIE_MAX_AGE = datetime.timedelta(days=14)

# TODO(#10501): Once domain objects can be imported by the storage layer, move
# these back to appropriate places (rights_domain, topic_domain).
# The reserved prefix for keys that are automatically inserted into a
# commit_cmd dict by this model.
AUTOGENERATED_PREFIX = 'AUTO'

# The command string for a revert commit.
CMD_REVERT_COMMIT = '%s_revert_version_number' % AUTOGENERATED_PREFIX

# The command string for a delete commit.
CMD_DELETE_COMMIT = '%s_mark_deleted' % AUTOGENERATED_PREFIX

# IMPORTANT: Ensure that all changes to how these cmds are interpreted preserve
# backward-compatibility with previous exploration snapshots in the datastore.
# Do not modify the definitions of CMD keys that already exist.
CMD_CREATE_NEW = 'create_new'
CMD_CHANGE_ROLE = 'change_role'
CMD_REMOVE_ROLE = 'remove_role'
CMD_CHANGE_EXPLORATION_STATUS = 'change_exploration_status'
CMD_CHANGE_COLLECTION_STATUS = 'change_collection_status'
CMD_CHANGE_PRIVATE_VIEWABILITY = 'change_private_viewability'
CMD_RELEASE_OWNERSHIP = 'release_ownership'
CMD_UPDATE_FIRST_PUBLISHED_MSEC = 'update_first_published_msec'

# Roles used in collections and explorations.
ROLE_OWNER = 'owner'
ROLE_EDITOR = 'editor'
ROLE_VOICE_ARTIST = 'voice artist'
ROLE_VIEWER = 'viewer'
ROLE_NONE = 'none'

# The list of entity types that do not require entity specific access control
# when viewing respective suggestions.
ENTITY_TYPES_WITH_UNRESTRICTED_VIEW_SUGGESTION_ACCESS = [ENTITY_TYPE_SKILL]

# The allowed list of roles which can be used in change_role command.
ALLOWED_ACTIVITY_ROLES = [
    ROLE_OWNER, ROLE_EDITOR, ROLE_VOICE_ARTIST, ROLE_VIEWER]

# The allowed list of status which can be used in change_exploration_status
# and change_collection_status commands.
ALLOWED_ACTIVITY_STATUS = [
    constants.ACTIVITY_STATUS_PRIVATE, constants.ACTIVITY_STATUS_PUBLIC]

# Commands allowed in CollectionRightsChange and ExplorationRightsChange.
COMMON_RIGHTS_ALLOWED_COMMANDS: List[ValidCmdDict] = [{
    'name': CMD_CREATE_NEW,
    'required_attribute_names': [],
    'optional_attribute_names': [],
    'user_id_attribute_names': [],
    'allowed_values': {},
    'deprecated_values': {}
}, {
    'name': CMD_CHANGE_ROLE,
    'required_attribute_names': ['assignee_id', 'old_role', 'new_role'],
    'optional_attribute_names': [],
    'user_id_attribute_names': ['assignee_id'],
    'allowed_values': {
        'new_role': ALLOWED_ACTIVITY_ROLES, 'old_role': ALLOWED_ACTIVITY_ROLES
    },
    'deprecated_values': {}
}, {
    'name': CMD_REMOVE_ROLE,
    'required_attribute_names': ['removed_user_id', 'old_role'],
    'optional_attribute_names': [],
    'user_id_attribute_names': ['removed_user_id'],
    'allowed_values': {'old_role': ALLOWED_ACTIVITY_ROLES},
    'deprecated_values': {}
}, {
    'name': CMD_CHANGE_PRIVATE_VIEWABILITY,
    'required_attribute_names': [
        'old_viewable_if_private', 'new_viewable_if_private'],
    'optional_attribute_names': [],
    'user_id_attribute_names': [],
    'allowed_values': {},
    'deprecated_values': {}
}, {
    'name': CMD_RELEASE_OWNERSHIP,
    'required_attribute_names': [],
    'optional_attribute_names': [],
    'user_id_attribute_names': [],
    'allowed_values': {},
    'deprecated_values': {}
}, {
    'name': CMD_UPDATE_FIRST_PUBLISHED_MSEC,
    'required_attribute_names': [
        'old_first_published_msec', 'new_first_published_msec'],
    'optional_attribute_names': [],
    'user_id_attribute_names': [],
    'allowed_values': {},
    'deprecated_values': {}
}, {
    'name': CMD_DELETE_COMMIT,
    'required_attribute_names': [],
    'optional_attribute_names': [],
    'user_id_attribute_names': [],
    'allowed_values': {},
    'deprecated_values': {}
}]

COLLECTION_RIGHTS_CHANGE_ALLOWED_COMMANDS: List[ValidCmdDict] = copy.deepcopy(
    COMMON_RIGHTS_ALLOWED_COMMANDS
)
COLLECTION_RIGHTS_CHANGE_ALLOWED_COMMANDS.append({
    'name': CMD_CHANGE_COLLECTION_STATUS,
    'required_attribute_names': ['old_status', 'new_status'],
    'optional_attribute_names': [],
    'user_id_attribute_names': [],
    'allowed_values': {
        'old_status': ALLOWED_ACTIVITY_STATUS,
        'new_status': ALLOWED_ACTIVITY_STATUS
    },
    'deprecated_values': {}
})

EXPLORATION_RIGHTS_CHANGE_ALLOWED_COMMANDS = copy.deepcopy(
    COMMON_RIGHTS_ALLOWED_COMMANDS)
EXPLORATION_RIGHTS_CHANGE_ALLOWED_COMMANDS.append({
    'name': CMD_CHANGE_EXPLORATION_STATUS,
    'required_attribute_names': ['old_status', 'new_status'],
    'optional_attribute_names': [],
    'user_id_attribute_names': [],
    'allowed_values': {
        'old_status': ALLOWED_ACTIVITY_STATUS,
        'new_status': ALLOWED_ACTIVITY_STATUS
    },
    # TODO(#12991): Remove this once once we use the migration jobs to remove
    # the deprecated values from the server data.
    'deprecated_values': {
        'new_status': ['publicized']
    }
})

CMD_REMOVE_MANAGER_ROLE = 'remove_manager_role'
CMD_PUBLISH_TOPIC = 'publish_topic'
CMD_UNPUBLISH_TOPIC = 'unpublish_topic'

ROLE_MANAGER = 'manager'

# The allowed list of roles which can be used in TopicRightsChange change_role
# command.
ALLOWED_TOPIC_ROLES = [ROLE_NONE, ROLE_MANAGER]

# Commands allowed in TopicRightsChange.
TOPIC_RIGHTS_CHANGE_ALLOWED_COMMANDS: List[ValidCmdDict] = [{
    'name': CMD_CREATE_NEW,
    'required_attribute_names': [],
    'optional_attribute_names': [],
    'user_id_attribute_names': [],
    'allowed_values': {},
    'deprecated_values': {}
}, {
    'name': CMD_CHANGE_ROLE,
    'required_attribute_names': ['assignee_id', 'new_role', 'old_role'],
    'optional_attribute_names': [],
    'user_id_attribute_names': ['assignee_id'],
    'allowed_values': {
        'new_role': ALLOWED_TOPIC_ROLES, 'old_role': ALLOWED_TOPIC_ROLES
    },
    'deprecated_values': {}
}, {
    'name': CMD_REMOVE_MANAGER_ROLE,
    'required_attribute_names': ['removed_user_id'],
    'optional_attribute_names': [],
    'user_id_attribute_names': ['removed_user_id'],
    'allowed_values': {},
    'deprecated_values': {}
}, {
    'name': CMD_PUBLISH_TOPIC,
    'required_attribute_names': [],
    'optional_attribute_names': [],
    'user_id_attribute_names': [],
    'allowed_values': {},
    'deprecated_values': {}
}, {
    'name': CMD_UNPUBLISH_TOPIC,
    'required_attribute_names': [],
    'optional_attribute_names': [],
    'user_id_attribute_names': [],
    'allowed_values': {},
    'deprecated_values': {}
}, {
    'name': CMD_DELETE_COMMIT,
    'required_attribute_names': [],
    'optional_attribute_names': [],
    'user_id_attribute_names': [],
    'allowed_values': {},
    'deprecated_values': {}
}]

USER_ID_RANDOM_PART_LENGTH = 32
USER_ID_LENGTH = 36
USER_ID_REGEX = r'uid_[a-z]{%s}' % USER_ID_RANDOM_PART_LENGTH
PSEUDONYMOUS_ID_REGEX = r'pid_[a-z]{%s}' % USER_ID_RANDOM_PART_LENGTH

# Length of user PIN for different roles used on Android.
FULL_USER_PIN_LENGTH = 5
PROFILE_USER_PIN_LENGTH = 3

MAX_NUMBER_OF_OPS_IN_TRANSACTION = 25

# This is the maximum wait time for the task queue HTTP request. If the request
# takes longer than this value, an exception is raised. The default value
# of 5 seconds is too short and must be avoided because it can cause events
# to go unrecorded.
# https://cloud.google.com/appengine/docs/standard/python/outbound-requests#request_timeouts
DEFAULT_TASKQUEUE_TIMEOUT_SECONDS = 30

# Mapping from issue type to issue keyname in the issue customization dict. This
# mapping is useful to uniquely identify issues by the combination of their
# issue type and other type-specific information (such as the list of states
# involved).
CUSTOMIZATION_ARG_WHICH_IDENTIFIES_ISSUE = {
    'EarlyQuit': 'state_name',
    'MultipleIncorrectSubmissions': 'state_name',
    'CyclicStateTransitions': 'state_names'
}

# Constants defining various suggestion types.
SUGGESTION_TYPE_EDIT_STATE_CONTENT: Final = 'edit_exploration_state_content'
SUGGESTION_TYPE_TRANSLATE_CONTENT: Final = 'translate_content'
SUGGESTION_TYPE_ADD_QUESTION: Final = 'add_question'

CONTRIBUTION_TYPE_TRANSLATION: Final = 'translation'
CONTRIBUTION_TYPE_QUESTION: Final = 'question'
CONTRIBUTION_SUBTYPE_ACCEPTANCE: Final = 'acceptance'
CONTRIBUTION_SUBTYPE_REVIEW: Final = 'review'
CONTRIBUTION_SUBTYPE_EDIT: Final = 'edit'
CONTRIBUTION_SUBTYPE_SUBMISSION: Final = 'submission'

# Suggestion fields that can be queried.
ALLOWED_SUGGESTION_QUERY_FIELDS = [
    'suggestion_type', 'target_type', 'target_id', 'status', 'author_id',
    'final_reviewer_id', 'score_category', 'language_code'
]

# Possible targets that the suggestions can modify.
SUGGESTION_TARGET_TYPE_CHOICES = [
    ENTITY_TYPE_EXPLORATION,
    ENTITY_TYPE_QUESTION,
    ENTITY_TYPE_SKILL,
    ENTITY_TYPE_TOPIC
]

# Possible suggestion types.
SUGGESTION_TYPE_CHOICES = [
    SUGGESTION_TYPE_EDIT_STATE_CONTENT,
    SUGGESTION_TYPE_TRANSLATE_CONTENT,
    SUGGESTION_TYPE_ADD_QUESTION
]

# The types of suggestions that are offered on the Contributor Dashboard.
CONTRIBUTOR_DASHBOARD_SUGGESTION_TYPES = [
    SUGGESTION_TYPE_TRANSLATE_CONTENT,
    SUGGESTION_TYPE_ADD_QUESTION
]

# Prefix for all access validation handlers.
# The naming scheme for access validation handlers is
# '/access_validation_handler/<handler_name>'
# example '/access_validation_handler/validate_access_to_splash_page'.
ACCESS_VALIDATION_HANDLER_PREFIX = '/access_validation_handler'

# The possible commit types.
COMMIT_TYPE_CREATE = 'create'
COMMIT_TYPE_REVERT = 'revert'
COMMIT_TYPE_EDIT = 'edit'
COMMIT_TYPE_DELETE = 'delete'

# Interaction IDs of math related interactions.
MATH_INTERACTION_IDS = [
    'NumericExpressionInput', 'AlgebraicExpressionInput', 'MathEquationInput']

# The task entry ID template used by the task entry model.
TASK_ENTRY_ID_TEMPLATE = '%s.%s.%d.%s.%s.%s'

# The composite entity ID template used by the task entry model.
COMPOSITE_ENTITY_ID_TEMPLATE = '%s.%s.%d'

# The data type for the translated or translatable content in any
# BaseTranslatableObject.
ContentValueType = Union[str, List[str]]


class TranslatableEntityType(enum.Enum):
    """Represents all possible entity types which support new translations
    architecture.
    """

    EXPLORATION = 'exploration'
    QUESTION = 'question'


class TranslatedContentDict(TypedDict):
    """Dictionary representing TranslatedContent object."""

    content_value: ContentValueType
    needs_update: bool
