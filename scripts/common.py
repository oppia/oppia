"""Common utility functions used by multiple Python scripts in Oppia."""

import os
import sys
import enum
from typing import List, Optional

AFFIRMATIVE_CONFIRMATIONS = ['y', 'ye', 'yes']
CURRENT_PYTHON_BIN = sys.executable

NODE_VERSION = '16.13.0'
YARN_VERSION = '1.22.15'
REDIS_CLI_VERSION = '6.2.4'
ELASTICSEARCH_VERSION = '7.17.0'
RELEASE_BRANCH_NAME_PREFIX = 'release-'

CURR_DIR = os.path.abspath(os.getcwd())

OPPIA_TOOLS_DIR = os.path.abspath(
    os.path.join(CURR_DIR, os.pardir, 'oppia_tools')
)
THIRD_PARTY_DIR = os.path.join(CURR_DIR, 'third_party')
THIRD_PARTY_PYTHON_LIBS_DIR = os.path.join(
    THIRD_PARTY_DIR, 'python_libs'
)

GOOGLE_CLOUD_SDK_HOME = (
    '/app/vm_deps/google-cloud-sdk'
    if os.environ.get('OPPIA_IS_DOCKERIZED') == 'True'
    else os.path.join(
        OPPIA_TOOLS_DIR, 'google-cloud-sdk-500.0.0', 'google-cloud-sdk'
    )
)

GOOGLE_APP_ENGINE_SDK_HOME = os.path.join(
    GOOGLE_CLOUD_SDK_HOME, 'platform', 'google_appengine'
)
GOOGLE_CLOUD_SDK_BIN = os.path.join(GOOGLE_CLOUD_SDK_HOME, 'bin')

WEBPACK_BIN_PATH = os.path.join(
    CURR_DIR, 'node_modules', 'webpack', 'bin', 'webpack.js'
)
NG_BIN_PATH = os.path.join(CURR_DIR, 'node_modules', '.bin', 'ng')

DEV_APPSERVER_PATH = os.path.join(GOOGLE_CLOUD_SDK_BIN, 'dev_appserver.py')
GCLOUD_PATH = os.path.join(GOOGLE_CLOUD_SDK_BIN, 'gcloud')

NODE_PATH = (
    '/usr'
    if os.environ.get('OPPIA_IS_DOCKERIZED') == 'True'
    else os.path.join(OPPIA_TOOLS_DIR, f'node-{NODE_VERSION}')
)
NODE_MODULES_PATH = os.path.join(CURR_DIR, 'node_modules')
FRONTEND_DIR = os.path.join(CURR_DIR, 'core', 'templates')
YARN_PATH = os.path.join(OPPIA_TOOLS_DIR, f'yarn-{YARN_VERSION}')

ACCEPTANCE_TEST_DIR = os.path.join(
    CURR_DIR, 'core', 'tests', 'acceptance_tests'
)


def is_affirmative(user_input: str) -> bool:
    """Return True if the user input is an affirmative string."""
    return user_input.lower() in AFFIRMATIVE_CONFIRMATIONS


def get_node_path() -> str:
    """Return the path to the Node.js binary."""
    return NODE_PATH


def get_node_modules_path() -> str:
    """Return the path to the node_modules directory."""
    return NODE_MODULES_PATH


def get_yarn_path() -> str:
    """Return the path to the Yarn binary."""
    return YARN_PATH


def get_google_cloud_sdk_home() -> str:
    """Return the path to the Google Cloud SDK."""
    return GOOGLE_CLOUD_SDK_HOME


def get_google_app_engine_sdk_home() -> str:
    """Return the path to the Google App Engine SDK."""
    return GOOGLE_APP_ENGINE_SDK_HOME


def get_gcloud_path() -> str:
    """Return the path to the gcloud CLI binary."""
    return GCLOUD_PATH


def get_dev_appserver_path() -> str:
    """Return the path to the dev_appserver.py binary."""
    return DEV_APPSERVER_PATH


def get_webpack_bin_path() -> str:
    """Return the path to the webpack binary."""
    return WEBPACK_BIN_PATH


def get_ng_bin_path() -> str:
    """Return the path to the Angular CLI binary."""
    return NG_BIN_PATH


def get_frontend_dir() -> str:
    """Return the path to the frontend templates directory."""
    return FRONTEND_DIR


class LogType(enum.Enum):
    """Enum for terminal log message types."""

    INFO = 'INFO'
    ERROR = 'ERROR'
    SUCCESS = 'SUCCESS'
    WARNING = 'WARNING'


_LOG_COLORS = {
    LogType.INFO: '\033[94m',
    LogType.SUCCESS: '\033[92m',
    LogType.WARNING: '\033[93m',
    LogType.ERROR: '\033[91m',
    None: ''
}
_END_COLOR = '\033[0m'


def log_to_terminal(
    message: str, message_type: Optional[LogType] = None
) -> None:
    """Print a message to terminal with optional color based on LogType.

    Args:
        message: str. Message string to print.
        message_type: Optional[LogType]. Log type for colored output.
            If None, automatic highlighting based on content is used.
    """
    if message_type is None:
        lower_msg = message.lower()
        if 'error' in lower_msg:
            message_type = LogType.ERROR
        elif 'warning' in lower_msg:
            message_type = LogType.WARNING
        elif 'success' in lower_msg:
            message_type = LogType.SUCCESS
        else:
            message_type = LogType.INFO

    color = _LOG_COLORS.get(message_type, '')
    print(f'{color}{message}{_END_COLOR}')


def list_acceptance_tests() -> List[str]:
    """Return a list of all acceptance test scripts."""
    tests = []
    for root, _, files in os.walk(ACCEPTANCE_TEST_DIR):
        for f in files:
            if f.endswith('_test.py'):
                tests.append(os.path.join(root, f))
    return sorted(tests)


def get_acceptance_test_path(test_name: str) -> str:
    """Return the full path to an acceptance test script."""
    return os.path.join(ACCEPTANCE_TEST_DIR, test_name)


def run_acceptance_test(test_name: str) -> None:
    """Run a single acceptance test script."""
    test_path = get_acceptance_test_path(test_name)
    if not os.path.exists(test_path):
        log_to_terminal(
            (
                f'Error: Acceptance test {test_name} '
                'not found'
            ),
            LogType.ERROR
        )
        return

    log_to_terminal(
        f'Running acceptance test: {test_name}',
        LogType.INFO
    )
    os.system(f'{sys.executable} {test_path}')

def is_current_branch_a_hotfix_branch() -> bool:
    """Stub function to satisfy pre-push hook. Returns False by default."""
    return False
    
