from datetime import datetime, timezone
"""Stores various configuration options and constants for Oppia."""
from __future__ import annotations
import copy
import datetime
import enum
import os
from core.constants import constants
from core.storage.base_model.gae_models import from_milliseconds_utc
from typing import Callable, Dict, Final, List, TypedDict, Union
ACTIVITY_REFERENCE_LIST_FEATURED = 'featured'
ALL_ACTIVITY_REFERENCE_LIST_TYPES = [ACTIVITY_REFERENCE_LIST_FEATURED]
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


SUPPORTED_OBJ_TYPES = {'UnicodeString'}
DEBUG = False


def check_dev_mode_is_true() ->None:
    """When DEV_MODE is true check that we are running in development
    environment. The SERVER_SOFTWARE environment variable does not exist
    in Travis, hence the need for an explicit check.
    """
    if constants.DEV_MODE and os.getenv('SERVER_SOFTWARE'):
        server_software = os.getenv('SERVER_SOFTWARE')
        if server_software and not server_software.startswith((
            'Development', 'gunicorn')):
            raise Exception("DEV_MODE can't be true on production.")


check_dev_mode_is_true()
OPPIA_IS_DOCKERIZED = bool(os.environ.get('OPPIA_IS_DOCKERIZED', False))
TESTS_DATA_DIR = os.path.join('core', 'tests', 'data')
SAMPLE_EXPLORATIONS_DIR = os.path.join('data', 'explorations')
SAMPLE_COLLECTIONS_DIR = os.path.join('data', 'collections')
CONTENT_VALIDATION_DIR = os.path.join('core', 'domain')
VOICEOVERS_DATA_DIR = os.path.join('data', 'voiceovers')
EXTENSIONS_DIR_PREFIX = 'build' if not constants.DEV_MODE else ''
ACTIONS_DIR = os.path.join(EXTENSIONS_DIR_PREFIX, 'extensions', 'actions')
ISSUES_DIR = os.path.join(EXTENSIONS_DIR_PREFIX, 'extensions', 'issues')
INTERACTIONS_DIR = os.path.join('extensions', 'interactions')
INTERACTIONS_SPECS_FILE_PATH = os.path.join(INTERACTIONS_DIR,
    'interaction_specs.json')
RTE_EXTENSIONS_DIR = os.path.join(EXTENSIONS_DIR_PREFIX, 'extensions',
    'rich_text_components')
RTE_EXTENSIONS_DEFINITIONS_PATH = os.path.join('assets',
    'rich_text_components_definitions.ts')
OBJECT_TEMPLATES_DIR = os.path.join('extensions', 'objects', 'templates')
FRONTEND_TEMPLATES_DIR = os.path.join('webpack_bundles'
    ) if constants.DEV_MODE else os.path.join('build', 'webpack_bundles')
FRONTEND_AOT_DIR = os.path.join('dist', 'oppia-angular'
    ) if constants.DEV_MODE else os.path.join('dist', 'oppia-angular-prod')
DEPENDENCIES_TEMPLATES_DIR = os.path.join(EXTENSIONS_DIR_PREFIX,
    'extensions', 'dependencies')
VALUE_GENERATORS_DIR_FOR_JS = os.path.join('local_compiled_js',
    'extensions', 'value_generators')
VALUE_GENERATORS_DIR = os.path.join('extensions', 'value_generators')
VISUALIZATIONS_DIR = os.path.join('extensions', 'visualizations')
VISUALIZATIONS_DIR_FOR_JS = os.path.join('local_compiled_js', 'extensions',
    'visualizations')
OBJECT_DEFAULT_VALUES_EXTENSIONS_MODULE_PATH = os.path.join('objects',
    'object_defaults.json')
RULES_DESCRIPTIONS_EXTENSIONS_MODULE_PATH = os.path.join('interactions',
    'rule_templates.json')
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
    BLOG_STATISTICS = 'blog_statistics'
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
    VOICEOVER = 'voiceover'


HTML_RULE_VARIABLE_FORMAT_SET = 'set'
HTML_RULE_VARIABLE_FORMAT_STRING = 'string'
HTML_RULE_VARIABLE_FORMAT_LIST_OF_SETS = 'listOfSets'
ALLOWED_HTML_RULE_VARIABLE_FORMATS = [HTML_RULE_VARIABLE_FORMAT_SET,
    HTML_RULE_VARIABLE_FORMAT_STRING, HTML_RULE_VARIABLE_FORMAT_LIST_OF_SETS]
ANSWER_TYPE_LIST_OF_SETS_OF_HTML = 'ListOfSetsOfHtmlStrings'
ANSWER_TYPE_SET_OF_HTML = 'SetOfHtmlString'
MAX_BIO_LENGTH_IN_CHARS = 2000
MAX_CHARS_IN_BLOG_POST_URL = constants.MAX_CHARS_IN_BLOG_POST_TITLE + len('-'
    ) + constants.BLOG_POST_ID_LENGTH
HTML_RULE_VARIABLE_FORMAT_SET = 'set'
HTML_RULE_VARIABLE_FORMAT_STRING = 'string'
HTML_RULE_VARIABLE_FORMAT_LIST_OF_SETS = 'listOfSets'
ALLOWED_HTML_RULE_VARIABLE_FORMATS = [HTML_RULE_VARIABLE_FORMAT_SET,
    HTML_RULE_VARIABLE_FORMAT_STRING, HTML_RULE_VARIABLE_FORMAT_LIST_OF_SETS]
ANSWER_TYPE_LIST_OF_SETS_OF_HTML = 'ListOfSetsOfHtmlStrings'
ANSWER_TYPE_SET_OF_HTML = 'SetOfHtmlString'
ENTITY_TYPE_BLOG_POST = 'blog_post'
ENTITY_TYPE_EXPLORATION = 'exploration'
ENTITY_TYPE_TOPIC = 'topic'
ENTITY_TYPE_SKILL = 'skill'
ENTITY_TYPE_STORY = 'story'
ENTITY_TYPE_QUESTION = 'question'
ENTITY_TYPE_USER = 'user'
ENTITY_TYPE_CLASSROOM = 'classroom'
DIAGNOSTIC_TEST_QUESTION_TYPE_MAIN = 'main_question'
DIAGNOSTIC_TEST_QUESTION_TYPE_BACKUP = 'backup_question'
IMAGE_CONTEXT_QUESTION_SUGGESTIONS = 'question_suggestions'
IMAGE_CONTEXT_EXPLORATION_SUGGESTIONS = 'exploration_suggestions'
MAX_TASK_MODELS_PER_FETCH = 25
MAX_TASK_MODELS_PER_HISTORY_PAGE = 10
PERIOD_TO_HARD_DELETE_MODELS_MARKED_AS_DELETED = datetime.timedelta(weeks=8)
MAX_LEARNER_PLAYLIST_ACTIVITY_COUNT = 10
MAX_CURRENT_GOALS_COUNT = 5
DEFAULT_QUERY_LIMIT = 1000
DEFAULT_SUGGESTION_QUERY_LIMIT = 1000
NUMBER_OF_TOP_RATED_EXPLORATIONS_FOR_LIBRARY_PAGE = 8
RECENTLY_PUBLISHED_QUERY_LIMIT_FOR_LIBRARY_PAGE = 8
NUMBER_OF_TOP_RATED_EXPLORATIONS_FULL_PAGE = 20
RECENTLY_PUBLISHED_QUERY_LIMIT_FULL_PAGE = 20
APP_FEEDBACK_REPORT_MAXIMUM_LIFESPAN = datetime.timedelta(days=90)
MINIMUM_ANDROID_REPORT_SCHEMA_VERSION = 1
CURRENT_ANDROID_REPORT_SCHEMA_VERSION = 1
MINIMUM_WEB_REPORT_SCHEMA_VERSION = 1
CURRENT_WEB_REPORT_SCHEMA_VERSION = 1
CURRENT_FEEDBACK_REPORT_STATS_SCHEMA_VERSION = 1
MINIMUM_FEEDBACK_REPORT_STATS_SCHEMA_VERSION = 1
CURRENT_DASHBOARD_STATS_SCHEMA_VERSION = 1
EARLIEST_SUPPORTED_STATE_SCHEMA_VERSION = 41
CURRENT_STATE_SCHEMA_VERSION = 56
CURRENT_COLLECTION_SCHEMA_VERSION = 6
CURRENT_STORY_CONTENTS_SCHEMA_VERSION = 5
CURRENT_SKILL_CONTENTS_SCHEMA_VERSION = 4
CURRENT_MISCONCEPTIONS_SCHEMA_VERSION = 5
CURRENT_RUBRIC_SCHEMA_VERSION = 5
CURRENT_SUBTOPIC_SCHEMA_VERSION = 4
CURRENT_STORY_REFERENCE_SCHEMA_VERSION = 1
CURRENT_SUBTOPIC_PAGE_CONTENTS_SCHEMA_VERSION = 4
CURRENT_STATE_ANSWERS_SCHEMA_VERSION = 1
CURRENT_LEARNER_ANSWER_INFO_SCHEMA_VERSION = 1
CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION = 1
SEARCH_RESULTS_PAGE_SIZE = 20
COMMIT_LIST_PAGE_SIZE = 50
FEEDBACK_TAB_PAGE_SIZE = 20
TOP_UNRESOLVED_ANSWERS_LIMIT = 20
DEFAULT_EXPLORATION_TITLE = ''
DEFAULT_EXPLORATION_CATEGORY = ''
DEFAULT_EXPLORATION_OBJECTIVE = ''
DEFAULT_INIT_STATE_NAME = 'Introduction'
DEFAULT_EXPLANATION_CONTENT_ID = 'explanation'
INVALID_CONTENT_ID = 'invalid_content_id'
DEFAULT_STATE_CONTENT_STR = ''
DEFAULT_AUTO_TTS_ENABLED = False
DEFUALT_NEXT_CONTENT_ID_INDEX = 0
DEFAULT_COLLECTION_TITLE = ''
DEFAULT_COLLECTION_CATEGORY = ''
DEFAULT_COLLECTION_OBJECTIVE = ''
DEFAULT_STORY_DESCRIPTION = ''
DEFAULT_STORY_NOTES = ''
DEFAULT_SKILL_EXPLANATION = ''
DEFAULT_MISCONCEPTION_NAME = ''
DEFAULT_MISCONCEPTION_NOTES = ''
DEFAULT_MISCONCEPTION_FEEDBACK = ''
DEFAULT_SKILL_EXPLANATION_CONTENT_ID = 'explanation'
DEFAULT_TOPIC_DESCRIPTION = ''
DEFAULT_ABBREVIATED_TOPIC_NAME = ''
DEFAULT_SUBTOPIC_PAGE_CONTENT_ID = 'content'
IMAGE_FORMAT_JPEG = 'jpeg'
IMAGE_FORMAT_PNG = 'png'
IMAGE_FORMAT_GIF = 'gif'
IMAGE_FORMAT_SVG = 'svg'
ACCEPTED_IMAGE_FORMATS_AND_EXTENSIONS = {IMAGE_FORMAT_JPEG: ['jpg', 'jpeg'],
    IMAGE_FORMAT_PNG: ['png'], IMAGE_FORMAT_GIF: ['gif'], IMAGE_FORMAT_SVG:
    ['svg']}
COMPRESSIBLE_IMAGE_FORMATS = [IMAGE_FORMAT_JPEG, IMAGE_FORMAT_PNG]
ACCEPTED_AUDIO_EXTENSIONS = {'mp3': ['audio/mp3']}
XSSI_PREFIX = b")]}'\n"
ALPHANUMERIC_REGEX = '^[A-Za-z0-9]+$'
LANGUAGE_ACCENT_CODE_REGEX = '^(([a-zA-Z]+)-)+([a-zA-Z]+)$'
_EMPTY_RATINGS = {'1': 0, '2': 0, '3': 0, '4': 0, '5': 0}


def get_empty_ratings() ->Dict[str, int]:
    """Returns a deep copy of the empty ratings dictionary.
    This function is used to obtain a fresh copy of the empty ratings
    dictionary. This can be useful in scenarios where a new ratings
    dictionary is needed without any pre-existing data.

    Returns:
        dict. A deep copy of the _EMPTY_RATINGS dictionary. The structure
        of this dictionary is as follows:
        {
            '5': 0,
            '4': 0,
            '3': 0,
            '2': 0,
            '1': 0
        }
        Each key represents a rating value, and the corresponding value
        represents the count of ratings for that value, initialized to 0.
    """
    return copy.deepcopy(_EMPTY_RATINGS)


BULK_EMAIL_SERVICE_PROVIDER_MAILCHIMP = 'mailchimp_email_service'
BULK_EMAIL_SERVICE_PROVIDER = BULK_EMAIL_SERVICE_PROVIDER_MAILCHIMP
EMPTY_SCALED_AVERAGE_RATING = 0.0
EMAIL_SERVICE_PROVIDER_MAILGUN = 'mailgun_email_service'
EMAIL_SERVICE_PROVIDER = EMAIL_SERVICE_PROVIDER_MAILGUN
MAILGUN_DOMAIN_NAME = None
MAILCHIMP_AUDIENCE_ID = None
MAILCHIMP_USERNAME = None
VALID_MAILCHIMP_FIELD_KEYS = ['NAME']
VALID_MAILCHIMP_TAGS = ['Account', 'Android', 'Web']
ES_HOST = os.environ.get('ES_HOST', 'localhost')
ES_LOCALHOST_PORT = 9200
ES_CLOUD_ID = None
ES_USERNAME = None
REDISHOST = os.environ.get('REDIS_HOST', 'localhost')
REDISPORT = 6379
OPPIA_REDIS_DB_INDEX = 0
CLOUD_NDB_REDIS_DB_INDEX = 1
STORAGE_EMULATOR_REDIS_DB_INDEX = 2
OPPIA_PROJECT_ID = 'dev-project-id'
GOOGLE_APP_ENGINE_REGION = 'us-central1'
ENV_IS_OPPIA_ORG_PRODUCTION_SERVER = bool(OPPIA_PROJECT_ID == 'oppiaserver')
DATAFLOW_TEMP_LOCATION = 'gs://todo/todo'
DATAFLOW_STAGING_LOCATION = 'gs://todo/todo'
OPPIA_VERSION = '3.4.3'
OPPIA_PYTHON_PACKAGE_PATH = './build/oppia-beam-job-%s.tar.gz' % OPPIA_VERSION
SYSTEM_COMMITTER_ID = 'admin'
SYSTEM_EMAIL_ADDRESS = 'system@example.com'
SYSTEM_EMAIL_NAME = '.'
ADMIN_EMAIL_ADDRESS = 'testadmin@example.com'
NOREPLY_EMAIL_ADDRESS = 'noreply@example.com'
CAN_SEND_TRANSACTIONAL_EMAILS = True
DEFAULT_FEEDBACK_MESSAGE_EMAIL_COUNTDOWN_SECS = 3600
DEFAULT_FEEDBACK_MESSAGE_EMAIL_PREFERENCE = True
DEFAULT_SUBSCRIPTION_EMAIL_PREFERENCE = True
DEFAULT_FEEDBACK_NOTIFICATIONS_MUTED_PREFERENCE = False
DEFAULT_SUGGESTION_NOTIFICATIONS_MUTED_PREFERENCE = False
DEFAULT_EMAIL_UPDATES_PREFERENCE = True
DEFAULT_EDITOR_ROLE_EMAIL_PREFERENCE = True
DUPLICATE_EMAIL_INTERVAL_MINS = 2
AVERAGE_RATINGS_DASHBOARD_PRECISION = 2
ENABLE_MAINTENANCE_MODE = False
ALLOWED_QUESTION_INTERACTION_IDS = ['TextInput', 'MultipleChoiceInput',
    'NumericInput']
SEND_SUGGESTION_REVIEW_RELATED_EMAILS = False
ENABLE_RECORDING_OF_SCORES = False
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
EMAIL_INTENT_ONBOARD_CD_USER = 'onboard_cd_user'
EMAIL_INTENT_REMOVE_CD_USER = 'remove_cd_user'
EMAIL_INTENT_ADDRESS_CONTRIBUTOR_DASHBOARD_SUGGESTIONS = (
    'address_contributor_dashboard_suggestions')
EMAIL_INTENT_REVIEW_CREATOR_DASHBOARD_SUGGESTIONS = (
    'review_creator_dashboard_suggestions')
EMAIL_INTENT_REVIEW_CONTRIBUTOR_DASHBOARD_SUGGESTIONS = (
    'review_contributor_dashboard_suggestions')
EMAIL_INTENT_ADD_CONTRIBUTOR_DASHBOARD_REVIEWERS = (
    'add_contributor_dashboard_reviewers')
EMAIL_INTENT_ACCOUNT_DELETED = 'account_deleted'
EMAIL_INTENT_NOTIFY_CONTRIBUTOR_DASHBOARD_ACHIEVEMENTS = (
    'notify_contributor_dashboard_achievements')
EMAIL_INTENT_NOTIFY_CURRICULUM_ADMINS_CHAPTERS = (
    'notify_curriculum_admins_chapters')
BULK_EMAIL_INTENT_MARKETING = 'bulk_email_marketing'
BULK_EMAIL_INTENT_IMPROVE_EXPLORATION = 'bulk_email_improve_exploration'
BULK_EMAIL_INTENT_CREATE_EXPLORATION = 'bulk_email_create_exploration'
BULK_EMAIL_INTENT_CREATOR_REENGAGEMENT = 'bulk_email_creator_reengagement'
BULK_EMAIL_INTENT_LEARNER_REENGAGEMENT = 'bulk_email_learner_reengagement'
BULK_EMAIL_INTENT_TEST = 'bulk_email_test'
MESSAGE_TYPE_FEEDBACK = 'feedback'
MESSAGE_TYPE_SUGGESTION = 'suggestion'
MODERATOR_ACTION_UNPUBLISH_EXPLORATION = 'unpublish_exploration'
DEFAULT_SALUTATION_HTML_FN: Callable[[str], str
    ] = lambda recipient_username: 'Hi %s,' % recipient_username
DEFAULT_SIGNOFF_HTML_FN: Callable[[str], str
    ] = lambda sender_username: 'Thanks!<br>%s (Oppia moderator)' % sender_username
DEFAULT_EMAIL_SUBJECT_FN: Callable[[str], str] = (lambda exp_title: 
    'Your Oppia exploration "%s" has been unpublished' % exp_title)
VALID_MODERATOR_ACTIONS: Dict[str, Dict[str, Union[str, Callable[[str], str]]]
    ] = {MODERATOR_ACTION_UNPUBLISH_EXPLORATION: {'email_config':
    'unpublish_exploration_email_html_body', 'email_subject_fn':
    DEFAULT_EMAIL_SUBJECT_FN, 'email_intent': 'unpublish_exploration',
    'email_salutation_html_fn': DEFAULT_SALUTATION_HTML_FN,
    'email_signoff_html_fn': DEFAULT_SIGNOFF_HTML_FN}}
TERMS_PAGE_LAST_UPDATED_UTC = datetime.datetime(2020, 10, 19)
DASHBOARD_STATS_DATETIME_STRING_FORMAT = '%Y-%m-%d'

# Timestamp in sec since epoch for Mar 1 2021 12:00:00 UTC for the earliest
# datetime that a report could be received.
EARLIEST_APP_FEEDBACK_REPORT_DATETIME = from_milliseconds_utc(1614556800 * 1000.0)


# The minimum and maximum package version codes for Oppia Android.
MINIMUM_ANDROID_PACKAGE_VERSION_CODE = 1
MAX_SIZE_OF_MATH_SVGS_BATCH_BYTES = 31 * 1024 * 1024
MAX_FILE_SIZE_BYTES = 1048576
MAX_AUDIO_FILE_LENGTH_SEC = 300
MAX_QUESTIONS_FETCHABLE_AT_ONE_TIME = 20
MINIMUM_SCORE_REQUIRED_TO_REVIEW = 10
MAX_NUMBER_OF_SKILL_IDS = 20
MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE = 10
MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_SEARCH_RESULTS_PAGE = 10
MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_AUTHOR_PROFILE_PAGE = 12
MAX_POSTS_TO_RECOMMEND_AT_END_OF_BLOG_POST = 2
COMMIT_MESSAGE_ACCEPTED_SUGGESTION_PREFIX = 'Accepted suggestion by'
MIGRATION_BOT_USER_ID = 'OppiaMigrationBot'
MIGRATION_BOT_USERNAME = 'OppiaMigrationBot'
APP_FEEDBACK_REPORT_SCRUBBER_BOT_ID = 'AppFeedbackReportScrubberBot'
APP_FEEDBACK_REPORT_SCRUBBER_BOT_USERNAME = 'AppFeedbackReportScrubberBot'
SUGGESTION_BOT_USER_ID = 'OppiaSuggestionBot'
SUGGESTION_BOT_USERNAME = 'OppiaSuggestionBot'
SYSTEM_USERS = {SYSTEM_COMMITTER_ID: SYSTEM_COMMITTER_ID,
    MIGRATION_BOT_USER_ID: MIGRATION_BOT_USERNAME, SUGGESTION_BOT_USER_ID:
    SUGGESTION_BOT_USERNAME, APP_FEEDBACK_REPORT_SCRUBBER_BOT_ID:
    APP_FEEDBACK_REPORT_SCRUBBER_BOT_USERNAME}
ALLOWED_RTE_EXTENSIONS = {'Collapsible': {'dir': os.path.join(
    RTE_EXTENSIONS_DIR, 'Collapsible')}, 'Image': {'dir': os.path.join(
    RTE_EXTENSIONS_DIR, 'Image')}, 'Link': {'dir': os.path.join(
    RTE_EXTENSIONS_DIR, 'Link')}, 'Math': {'dir': os.path.join(
    RTE_EXTENSIONS_DIR, 'Math')}, 'Tabs': {'dir': os.path.join(
    RTE_EXTENSIONS_DIR, 'Tabs')}, 'Video': {'dir': os.path.join(
    RTE_EXTENSIONS_DIR, 'Video')}}
LINEAR_INTERACTION_IDS = ['Continue']
DEMO_EXPLORATIONS = {u'0': 'welcome', u'1': 'multiples.yaml', u'3':
    'root_linear_coefficient_theorem', u'4': 'three_balls', u'6':
    'boot_verbs.yaml', u'7': 'hola.yaml', u'9': 'pitch_perfect.yaml', u'10':
    'test_interactions', u'11': 'modeling_graphs', u'12':
    'protractor_test_1.yaml', u'13': 'solar_system', u'14':
    'about_oppia.yaml', u'15': 'classifier_demo_exploration.yaml', u'16':
    'all_interactions', u'17': 'audio_test', u'19':
    'example_exploration_in_collection1.yaml', u'20':
    'example_exploration_in_collection2.yaml', u'21':
    'example_exploration_in_collection3.yaml', u'22':
    'protractor_mobile_test_exploration.yaml', u'23': 'rating_test.yaml',
    u'24': 'learner_flow_test.yaml', u'25': 'exploration_player_test.yaml',
    u'26': 'android_interactions'}
DEMO_COLLECTIONS = {u'0': 'welcome_to_collections.yaml', u'1':
    'learner_flow_test_collection.yaml'}
DISABLED_EXPLORATION_IDS = ['5']
GOOGLE_GROUP_URL = (
    'https://groups.google.com/forum/?place=forum/oppia#!forum/oppia')
OPPIA_SITE_URL = 'http://localhost:8181'
TASKQUEUE_URL_PREFIX = '/task'
TASK_URL_FEEDBACK_MESSAGE_EMAILS = (
    '%s/email/batchfeedbackmessageemailhandler' % TASKQUEUE_URL_PREFIX)
TASK_URL_FEEDBACK_STATUS_EMAILS = (
    '%s/email/feedbackthreadstatuschangeemailhandler' % TASKQUEUE_URL_PREFIX)
TASK_URL_FLAG_EXPLORATION_EMAILS = ('%s/email/flagexplorationemailhandler' %
    TASKQUEUE_URL_PREFIX)
TASK_URL_INSTANT_FEEDBACK_EMAILS = (
    '%s/email/instantfeedbackmessageemailhandler' % TASKQUEUE_URL_PREFIX)
TASK_URL_CONTRIBUTOR_DASHBOARD_ACHIEVEMENT_NOTIFICATION_EMAILS = (
    '%s/email/contributordashboardachievementnotificationemailhandler' %
    TASKQUEUE_URL_PREFIX)
TASK_URL_DEFERRED = '%s/deferredtaskshandler' % TASKQUEUE_URL_PREFIX
ADMIN_URL = '/admin'
ADMIN_ROLE_HANDLER_URL = '/adminrolehandler'
BLOG_ADMIN_ROLE_HANDLER_URL = '/blogadminrolehandler'
BLOG_DASHBOARD_DATA_URL = '/blogdashboardhandler/data'
DIAGNOSTIC_TEST_PLAYER_PAGE_URL = '/diagnostic-test-player'
BLOG_EDITOR_DATA_URL_PREFIX = '/blogeditorhandler/data'
BULK_EMAIL_WEBHOOK_ENDPOINT = '/bulk_email_webhook_endpoint'
BLOG_HOMEPAGE_DATA_URL = '/blogdatahandler/data'
BLOG_HOMEPAGE_URL = '/blog'
BLOG_SEARCH_DATA_URL = '/blog/searchhandler/data'
BLOG_TITLE_HANDLER = '/blogtitlehandler/data'
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
CONTRIBUTOR_CERTIFICATE_URL = '/contributorcertificate'
CONTRIBUTOR_DASHBOARD_ADMIN_URL = '/contributor-admin-dashboard'
CONTRIBUTOR_DASHBOARD_ADMIN_STATS_URL_PREFIX = (
    '/contributor-dashboard-admin-stats')
COMMUNITY_CONTRIBUTION_STATS_URL = '/community-contribution-stats'
CONTRIBUTOR_OPPORTUNITIES_DATA_URL = '/opportunitiessummaryhandler'
PINNED_OPPORTUNITIES_URL = '/pinned-opportunities'
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
FEATURE_FLAGS_URL = '/feature_flags'
FEEDBACK_STATS_URL_PREFIX = '/feedbackstatshandler'
FEEDBACK_THREAD_URL_PREFIX = '/threadhandler'
FEEDBACK_THREADLIST_URL_PREFIX = '/threadlisthandler'
FEEDBACK_THREADLIST_URL_PREFIX_FOR_TOPICS = '/threadlisthandlerfortopic'
FEEDBACK_THREAD_VIEW_EVENT_URL = '/feedbackhandler/thread_view_event'
FEEDBACK_UPDATES_DATA_URL = '/feedbackupdateshandler/data'
FEEDBACK_UPDATES_URL = '/feedbackupdates'
FEEDBACK_UPDATES_THREAD_DATA_URL = '/feedbackupdatesthreadhandler'
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
LEARNER_DASHBOARD_IDS_DATA_URL = '/learnerdashboardidshandler/data'
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
REGENERATE_TOPIC_SUMMARIES_URL = '/regenerate_topic_summaries_handler'
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
DIAGNOSTIC_TEST_QUESTIONS_HANDLER_URL = (
    '/diagnostic_test_questions_handler_url')
STATE_VERSION_HISTORY_URL_PREFIX = '/version_history_handler/state'
STORY_DATA_HANDLER = '/story_data_handler'
STORY_EDITOR_URL_PREFIX = '/story_editor'
STORY_EDITOR_DATA_URL_PREFIX = '/story_editor_handler/data'
STORY_PROGRESS_URL_PREFIX = '/story_progress_handler'
STORY_PUBLISH_HANDLER = '/story_publish_handler'
STORY_URL_FRAGMENT_HANDLER = '/story_url_fragment_handler'
STORY_VIEWER_URL_PREFIX = '/story'
SUBTOPIC_DATA_HANDLER = '/subtopic_data_handler'
SUBTOPIC_MASTERY_DATA_URL = '/subtopic_mastery_handler/data'
SUBTOPIC_VIEWER_URL_PREFIX = '/subtopic'
SUGGESTION_ACTION_URL_PREFIX = '/suggestionactionhandler'
SUGGESTION_LIST_URL_PREFIX = '/suggestionlisthandler'
SUGGESTION_URL_PREFIX = '/suggestionhandler'
UPDATE_TRANSLATION_SUGGESTION_URL_PREFIX = (
    '/updatetranslationsuggestionhandler')
UPDATE_QUESTION_SUGGESTION_URL_PREFIX = '/updatequestionsuggestionhandler'
USER_GROUPS_HANDLER_URL = '/user_groups_handler'
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
CLASSROOM_DISPLAY_INFO_HANDLER_URL = '/classroom_display_info_handler'
UPDATE_CLASSROOMS_ORDER_HANDLER_URL = '/update_classrooms_order'
UNUSED_TOPICS_HANDLER_URL = '/unused_topics'
NEW_CLASSROOM_ID_HANDLER_URL = '/new_classroom_id_handler'
NEW_CLASSROOM_HANDLER_URL = '/classroom_admin/create_new'
TOPICS_TO_CLASSROOM_RELATION_HANDLER_URL = '/topics_to_classrooms_relation'
ALL_CLASSROOMS_SUMMARY_HANDLER_URL = '/all_classrooms_summary'
CLASSROOM_HANDLER_URL = '/classroom'
CLASSROOM_URL_FRAGMENT_HANDLER = '/classroom_url_fragment_handler'
CLASSROOM_ID_HANDLER_URL = '/classroom_id_handler'
VOICEOVER_ADMIN_DATA_HANDLER_URL = '/voiceover_admin_data_handler'
VOICEOVER_LANGUAGE_CODES_MAPPING_HANDLER_URL = (
    '/voiceover_language_codes_mapping')
VOICE_ARTIST_METADATA_HANDLER = '/voice_artist_metadata_handler'
GET_SAMPLE_VOICEOVERS_FOR_VOICE_ARTIST = '/get_sample_voiceovers'
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
EVENT_TYPE_START_EXPLORATION = 'start'
EVENT_TYPE_ACTUAL_START_EXPLORATION = 'actual_start'
EVENT_TYPE_MAYBE_LEAVE_EXPLORATION = 'leave'
EVENT_TYPE_COMPLETE_EXPLORATION = 'complete'
PLAY_TYPE_PLAYTEST = 'playtest'
PLAY_TYPE_NORMAL = 'normal'
COMMIT_MESSAGE_EXPLORATION_DELETED = 'Exploration deleted.'
COMMIT_MESSAGE_COLLECTION_DELETED = 'Collection deleted.'
COMMIT_MESSAGE_QUESTION_DELETED = 'Question deleted.'
COMMIT_MESSAGE_SKILL_DELETED = 'Skill deleted.'
COMMIT_MESSAGE_STORY_DELETED = 'Story deleted.'
COMMIT_MESSAGE_SUBTOPIC_PAGE_DELETED = 'Subtopic page deleted.'
COMMIT_MESSAGE_TOPIC_DELETED = 'Topic deleted.'
MAX_PLAYTHROUGHS_FOR_ISSUE = 5
TOP_UNRESOLVED_ANSWERS_COUNT_DASHBOARD = 3
OPEN_FEEDBACK_COUNT_DASHBOARD = 3
FLOAT_VERIFIER_REGEX = (
    '^([-+]?\\d*\\.\\d+)$|^([-+]?(\\d*\\.?\\d+|\\d+\\.?\\d*)e[-+]?\\d*)$')
CURRENT_EVENT_MODELS_SCHEMA_VERSION = 2
OUTPUT_FORMAT_JSON = 'json'
OUTPUT_FORMAT_ZIP = 'zip'
UPDATE_TYPE_EXPLORATION_COMMIT = 'exploration_commit'
UPDATE_TYPE_COLLECTION_COMMIT = 'collection_commit'
UPDATE_TYPE_FEEDBACK_MESSAGE = 'feedback_thread'
USER_QUERY_STATUS_PROCESSING = 'processing'
USER_QUERY_STATUS_COMPLETED = 'completed'
USER_QUERY_STATUS_ARCHIVED = 'archived'
USER_QUERY_STATUS_FAILED = 'failed'
ALLOWED_USER_QUERY_STATUSES = (USER_QUERY_STATUS_PROCESSING,
    USER_QUERY_STATUS_COMPLETED, USER_QUERY_STATUS_ARCHIVED,
    USER_QUERY_STATUS_FAILED)
PROXIMAL_TIMEDELTA_SECS = 12 * 60 * 60
LIBRARY_CATEGORY_FEATURED_ACTIVITIES = (
    'I18N_LIBRARY_GROUPS_FEATURED_ACTIVITIES')
LIBRARY_CATEGORY_TOP_RATED_EXPLORATIONS = (
    'I18N_LIBRARY_GROUPS_TOP_RATED_EXPLORATIONS')
LIBRARY_CATEGORY_RECENTLY_PUBLISHED = 'I18N_LIBRARY_GROUPS_RECENTLY_PUBLISHED'
LIBRARY_GROUP_RECENTLY_PUBLISHED = 'recently-published'
LIBRARY_GROUP_TOP_RATED = 'top-rated'
DEFAULT_TOPIC_SIMILARITY = 0.5
SAME_TOPIC_SIMILARITY = 1.0
HANDLER_TYPE_HTML = 'html'
HANDLER_TYPE_JSON = 'json'
HANDLER_TYPE_DOWNLOADABLE = 'downloadable'
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
ROLE_ID_QUESTION_COORDINATOR = 'QUESTION_COORDINATOR'
ROLE_ID_TRANSLATION_COORDINATOR = 'TRANSLATION_COORDINATOR'
ALLOWED_DEFAULT_USER_ROLES_ON_REGISTRATION = [ROLE_ID_FULL_USER,
    ROLE_ID_MOBILE_LEARNER]
ALLOWED_USER_ROLES = [ROLE_ID_CURRICULUM_ADMIN, ROLE_ID_BLOG_ADMIN,
    ROLE_ID_BLOG_POST_EDITOR, ROLE_ID_COLLECTION_EDITOR, ROLE_ID_FULL_USER,
    ROLE_ID_GUEST, ROLE_ID_MOBILE_LEARNER, ROLE_ID_MODERATOR,
    ROLE_ID_QUESTION_ADMIN, ROLE_ID_RELEASE_COORDINATOR,
    ROLE_ID_TOPIC_MANAGER, ROLE_ID_TRANSLATION_ADMIN,
    ROLE_ID_VOICEOVER_ADMIN, ROLE_ID_QUESTION_COORDINATOR,
    ROLE_ID_TRANSLATION_COORDINATOR]
ROLE_ACTION_ADD = 'add'
ROLE_ACTION_REMOVE = 'remove'
DEPRECATED_ROLE_ACTION_UPDATE = 'update'
ROLE_ACTION_VIEW_BY_USERNAME = 'view_by_username'
ROLE_ACTION_VIEW_BY_ROLE = 'view_by_role'
USER_FILTER_CRITERION_ROLE: Final = 'role'
USER_FILTER_CRITERION_USERNAME: Final = 'username'
QUESTION_BATCH_SIZE = 10
STATE_ANSWER_STATS_MIN_FREQUENCY = 2
RTE_FORMAT_TEXTANGULAR = 'text-angular'
RTE_FORMAT_CKEDITOR = 'ck-editor'
RTE_CONTENT_SPEC: Dict[str, RteTypeTextAngularDict] = {'RTE_TYPE_TEXTANGULAR':
    {'ALLOWED_PARENT_LIST': {'p': ['blockquote', 'div', 'pre', '[document]',
    'ol', 'ul', 'li'], 'b': ['i', 'li', 'p', 'pre'], 'br': ['b', 'i', 'li',
    'p'], 'i': ['b', 'li', 'p', 'pre'], 'li': ['ol', 'ul'], 'ol': ['ol',
    'ul', 'blockquote', 'li', 'pre', 'div', '[document]'], 'ul': ['ol',
    'ul', 'blockquote', 'li', 'pre', 'div', '[document]'], 'pre': ['ol',
    'ul', 'blockquote', '[document]'], 'blockquote': ['blockquote',
    '[document]'], 'oppia-noninteractive-link': ['b', 'i', 'li', 'p', 'pre'
    ], 'oppia-noninteractive-math': ['b', 'i', 'li', 'p', 'pre'],
    'oppia-noninteractive-image': ['b', 'i', 'li', 'p', 'pre'],
    'oppia-noninteractive-collapsible': ['b', 'i', 'li', 'p', 'pre'],
    'oppia-noninteractive-video': ['b', 'i', 'li', 'p', 'pre'],
    'oppia-noninteractive-tabs': ['b', 'i', 'li', 'p', 'pre']},
    'ALLOWED_TAG_LIST': ['p', 'b', 'br', 'i', 'li', 'ol', 'ul', 'pre',
    'blockquote', 'oppia-noninteractive-link', 'oppia-noninteractive-math',
    'oppia-noninteractive-image', 'oppia-noninteractive-collapsible',
    'oppia-noninteractive-video', 'oppia-noninteractive-tabs']},
    'RTE_TYPE_CKEDITOR': {'ALLOWED_PARENT_LIST': {'p': ['blockquote',
    '[document]', 'li'], 'strong': ['em', 'li', 'p', 'pre'], 'em': [
    'strong', 'li', 'p', 'pre'], 'br': ['strong', 'em', 'li', 'p'], 'li': [
    'ol', 'ul'], 'ol': ['li', 'blockquote', 'pre', '[document]'], 'ul': [
    'li', 'blockquote', 'pre', '[document]'], 'pre': ['ol', 'ul',
    'blockquote', 'li', '[document]'], 'blockquote': ['blockquote',
    '[document]'], 'oppia-noninteractive-link': ['strong', 'em', 'li', 'p',
    'pre'], 'oppia-noninteractive-math': ['strong', 'em', 'li', 'p', 'pre'],
    'oppia-noninteractive-image': ['blockquote', 'li', '[document]'],
    'oppia-noninteractive-collapsible': ['blockquote', 'li', '[document]'],
    'oppia-noninteractive-video': ['blockquote', 'li', '[document]'],
    'oppia-noninteractive-tabs': ['blockquote', 'li', '[document]']},
    'ALLOWED_TAG_LIST': ['p', 'strong', 'br', 'em', 'li', 'ol', 'ul', 'pre',
    'blockquote', 'oppia-noninteractive-link', 'oppia-noninteractive-math',
    'oppia-noninteractive-image', 'oppia-noninteractive-collapsible',
    'oppia-noninteractive-video', 'oppia-noninteractive-tabs']}}
CLASSROOM_PAGES = ['math']
GAE_AUTH_PROVIDER_ID = 'gae'
FIREBASE_AUTH_PROVIDER_ID = 'Firebase'
FIREBASE_ROLE_SUPER_ADMIN = 'super_admin'
FIREBASE_AUTH_ID_REGEX = '^[A-Za-z0-9]{1,128}$'
CLOUD_DATASTORE_EMULATOR_HOST = os.environ.get('DATASTORE_HOST', 'localhost')
CLOUD_DATASTORE_EMULATOR_PORT = 8089
FIREBASE_EMULATOR_CONFIG_PATH = '.firebase.json'
FIREBASE_EMULATOR_PORT = 9099
FIREBASE_SESSION_COOKIE_MAX_AGE = datetime.timedelta(days=14)
AUTOGENERATED_PREFIX = 'AUTO'
CMD_REVERT_COMMIT = '%s_revert_version_number' % AUTOGENERATED_PREFIX
CMD_DELETE_COMMIT = '%s_mark_deleted' % AUTOGENERATED_PREFIX
CMD_CREATE_NEW = 'create_new'
CMD_CHANGE_ROLE = 'change_role'
CMD_REMOVE_ROLE = 'remove_role'
CMD_CHANGE_EXPLORATION_STATUS = 'change_exploration_status'
CMD_CHANGE_COLLECTION_STATUS = 'change_collection_status'
CMD_CHANGE_PRIVATE_VIEWABILITY = 'change_private_viewability'
CMD_RELEASE_OWNERSHIP = 'release_ownership'
CMD_UPDATE_FIRST_PUBLISHED_MSEC = 'update_first_published_msec'
ROLE_OWNER = 'owner'
ROLE_EDITOR = 'editor'
ROLE_VOICE_ARTIST = 'voice artist'
ROLE_VIEWER = 'viewer'
ROLE_NONE = 'none'
ENTITY_TYPES_WITH_UNRESTRICTED_VIEW_SUGGESTION_ACCESS = [ENTITY_TYPE_SKILL]
ALLOWED_ACTIVITY_ROLES = [ROLE_OWNER, ROLE_EDITOR, ROLE_VOICE_ARTIST,
    ROLE_VIEWER]
ALLOWED_ACTIVITY_STATUS = [constants.ACTIVITY_STATUS_PRIVATE, constants.
    ACTIVITY_STATUS_PUBLIC]
COMMON_RIGHTS_ALLOWED_COMMANDS: List[ValidCmdDict] = [{'name':
    CMD_CREATE_NEW, 'required_attribute_names': [],
    'optional_attribute_names': [], 'user_id_attribute_names': [],
    'allowed_values': {}, 'deprecated_values': {}}, {'name':
    CMD_CHANGE_ROLE, 'required_attribute_names': ['assignee_id', 'old_role',
    'new_role'], 'optional_attribute_names': [], 'user_id_attribute_names':
    ['assignee_id'], 'allowed_values': {'new_role': ALLOWED_ACTIVITY_ROLES,
    'old_role': ALLOWED_ACTIVITY_ROLES}, 'deprecated_values': {}}, {'name':
    CMD_REMOVE_ROLE, 'required_attribute_names': ['removed_user_id',
    'old_role'], 'optional_attribute_names': [], 'user_id_attribute_names':
    ['removed_user_id'], 'allowed_values': {'old_role':
    ALLOWED_ACTIVITY_ROLES}, 'deprecated_values': {}}, {'name':
    CMD_CHANGE_PRIVATE_VIEWABILITY, 'required_attribute_names': [
    'old_viewable_if_private', 'new_viewable_if_private'],
    'optional_attribute_names': [], 'user_id_attribute_names': [],
    'allowed_values': {}, 'deprecated_values': {}}, {'name':
    CMD_RELEASE_OWNERSHIP, 'required_attribute_names': [],
    'optional_attribute_names': [], 'user_id_attribute_names': [],
    'allowed_values': {}, 'deprecated_values': {}}, {'name':
    CMD_UPDATE_FIRST_PUBLISHED_MSEC, 'required_attribute_names': [
    'old_first_published_msec', 'new_first_published_msec'],
    'optional_attribute_names': [], 'user_id_attribute_names': [],
    'allowed_values': {}, 'deprecated_values': {}}, {'name':
    CMD_DELETE_COMMIT, 'required_attribute_names': [],
    'optional_attribute_names': [], 'user_id_attribute_names': [],
    'allowed_values': {}, 'deprecated_values': {}}]
COLLECTION_RIGHTS_CHANGE_ALLOWED_COMMANDS: List[ValidCmdDict] = copy.deepcopy(
    COMMON_RIGHTS_ALLOWED_COMMANDS)
COLLECTION_RIGHTS_CHANGE_ALLOWED_COMMANDS.append({'name':
    CMD_CHANGE_COLLECTION_STATUS, 'required_attribute_names': ['old_status',
    'new_status'], 'optional_attribute_names': [],
    'user_id_attribute_names': [], 'allowed_values': {'old_status':
    ALLOWED_ACTIVITY_STATUS, 'new_status': ALLOWED_ACTIVITY_STATUS},
    'deprecated_values': {}})
EXPLORATION_RIGHTS_CHANGE_ALLOWED_COMMANDS = copy.deepcopy(
    COMMON_RIGHTS_ALLOWED_COMMANDS)
EXPLORATION_RIGHTS_CHANGE_ALLOWED_COMMANDS.append({'name':
    CMD_CHANGE_EXPLORATION_STATUS, 'required_attribute_names': [
    'old_status', 'new_status'], 'optional_attribute_names': [],
    'user_id_attribute_names': [], 'allowed_values': {'old_status':
    ALLOWED_ACTIVITY_STATUS, 'new_status': ALLOWED_ACTIVITY_STATUS},
    'deprecated_values': {'new_status': ['publicized']}})
CMD_REMOVE_MANAGER_ROLE = 'remove_manager_role'
CMD_PUBLISH_TOPIC = 'publish_topic'
CMD_UNPUBLISH_TOPIC = 'unpublish_topic'
ROLE_MANAGER = 'manager'
ALLOWED_TOPIC_ROLES = [ROLE_NONE, ROLE_MANAGER]
TOPIC_RIGHTS_CHANGE_ALLOWED_COMMANDS: List[ValidCmdDict] = [{'name':
    CMD_CREATE_NEW, 'required_attribute_names': [],
    'optional_attribute_names': [], 'user_id_attribute_names': [],
    'allowed_values': {}, 'deprecated_values': {}}, {'name':
    CMD_CHANGE_ROLE, 'required_attribute_names': ['assignee_id', 'new_role',
    'old_role'], 'optional_attribute_names': [], 'user_id_attribute_names':
    ['assignee_id'], 'allowed_values': {'new_role': ALLOWED_TOPIC_ROLES,
    'old_role': ALLOWED_TOPIC_ROLES}, 'deprecated_values': {}}, {'name':
    CMD_REMOVE_MANAGER_ROLE, 'required_attribute_names': ['removed_user_id'
    ], 'optional_attribute_names': [], 'user_id_attribute_names': [
    'removed_user_id'], 'allowed_values': {}, 'deprecated_values': {}}, {
    'name': CMD_PUBLISH_TOPIC, 'required_attribute_names': [],
    'optional_attribute_names': [], 'user_id_attribute_names': [],
    'allowed_values': {}, 'deprecated_values': {}}, {'name':
    CMD_UNPUBLISH_TOPIC, 'required_attribute_names': [],
    'optional_attribute_names': [], 'user_id_attribute_names': [],
    'allowed_values': {}, 'deprecated_values': {}}, {'name':
    CMD_DELETE_COMMIT, 'required_attribute_names': [],
    'optional_attribute_names': [], 'user_id_attribute_names': [],
    'allowed_values': {}, 'deprecated_values': {}}]
USER_ID_RANDOM_PART_LENGTH = 32
USER_ID_LENGTH = 36
USER_ID_REGEX = 'uid_[a-z]{%s}' % USER_ID_RANDOM_PART_LENGTH
PSEUDONYMOUS_ID_REGEX = 'pid_[a-z]{%s}' % USER_ID_RANDOM_PART_LENGTH
FULL_USER_PIN_LENGTH = 5
PROFILE_USER_PIN_LENGTH = 3
MAX_NUMBER_OF_OPS_IN_TRANSACTION = 25
DEFAULT_TASKQUEUE_TIMEOUT_SECONDS = 30
CUSTOMIZATION_ARG_WHICH_IDENTIFIES_ISSUE = {'EarlyQuit': 'state_name',
    'MultipleIncorrectSubmissions': 'state_name', 'CyclicStateTransitions':
    'state_names'}
SUGGESTION_TYPE_EDIT_STATE_CONTENT: Final = 'edit_exploration_state_content'
SUGGESTION_TYPE_TRANSLATE_CONTENT: Final = 'translate_content'
SUGGESTION_TYPE_ADD_QUESTION: Final = 'add_question'
CONTRIBUTION_TYPE_TRANSLATION: Final = 'translation'
CONTRIBUTION_TYPE_QUESTION: Final = 'question'
CONTRIBUTION_SUBTYPE_ACCEPTANCE: Final = 'acceptance'
CONTRIBUTION_SUBTYPE_REVIEW: Final = 'review'
CONTRIBUTION_SUBTYPE_COORDINATE: Final = 'coordinate'
CONTRIBUTION_SUBTYPE_EDIT: Final = 'edit'
CONTRIBUTION_SUBTYPE_SUBMISSION: Final = 'submission'
TRANSLATION_TEAM_LEAD = 'Anubhuti Varshney'
QUESTION_TEAM_LEAD = 'Ryan Hsiao'
ALLOWED_SUGGESTION_QUERY_FIELDS = ['suggestion_type', 'target_type',
    'target_id', 'status', 'author_id', 'final_reviewer_id',
    'score_category', 'language_code']
SUGGESTION_TARGET_TYPE_CHOICES = [ENTITY_TYPE_EXPLORATION,
    ENTITY_TYPE_QUESTION, ENTITY_TYPE_SKILL, ENTITY_TYPE_TOPIC]
SUGGESTION_TYPE_CHOICES = [SUGGESTION_TYPE_EDIT_STATE_CONTENT,
    SUGGESTION_TYPE_TRANSLATE_CONTENT, SUGGESTION_TYPE_ADD_QUESTION]
CONTRIBUTOR_DASHBOARD_SUGGESTION_TYPES = [SUGGESTION_TYPE_TRANSLATE_CONTENT,
    SUGGESTION_TYPE_ADD_QUESTION]
SUGGESTIONS_SORT_KEYS = [constants.SUGGESTIONS_SORT_KEY_DATE]
ACCESS_VALIDATION_HANDLER_PREFIX = '/access_validation_handler'
COMMIT_TYPE_CREATE = 'create'
COMMIT_TYPE_REVERT = 'revert'
COMMIT_TYPE_EDIT = 'edit'
COMMIT_TYPE_DELETE = 'delete'
MATH_INTERACTION_IDS = ['NumericExpressionInput',
    'AlgebraicExpressionInput', 'MathEquationInput']
TASK_ENTRY_ID_TEMPLATE = '%s.%s.%d.%s.%s.%s'
COMPOSITE_ENTITY_ID_TEMPLATE = '%s.%s.%d'
ContentValueType = Union[str, List[str]]
MIN_ALLOWED_MISSING_OR_UPDATE_NEEDED_WRITTEN_TRANSLATIONS = 10
DEFAULT_CLASSROOM_PUBLICATION_STATUS = False


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
    content_format: str


class VoiceoverType(enum.Enum):
    """Represents all possible voicever types."""
    AUTO = 'auto'
    MANUAL = 'manual'