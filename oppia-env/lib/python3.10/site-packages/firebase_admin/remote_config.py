# Copyright 2024 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Firebase Remote Config Module.
This module has required APIs for the clients to use Firebase Remote Config with python.
"""

import asyncio
import json
import logging
import threading
from typing import Dict, Optional, Literal, Union, Any
from enum import Enum
import re
import hashlib
import requests
from firebase_admin import App, _http_client, _utils
import firebase_admin

# Set up logging (you can customize the level and output)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_REMOTE_CONFIG_ATTRIBUTE = '_remoteconfig'
MAX_CONDITION_RECURSION_DEPTH = 10
ValueSource = Literal['default', 'remote', 'static']  # Define the ValueSource type

class PercentConditionOperator(Enum):
    """Enum representing the available operators for percent conditions.
    """
    LESS_OR_EQUAL = "LESS_OR_EQUAL"
    GREATER_THAN = "GREATER_THAN"
    BETWEEN = "BETWEEN"
    UNKNOWN = "UNKNOWN"

class CustomSignalOperator(Enum):
    """Enum representing the available operators for custom signal conditions.
    """
    STRING_CONTAINS = "STRING_CONTAINS"
    STRING_DOES_NOT_CONTAIN = "STRING_DOES_NOT_CONTAIN"
    STRING_EXACTLY_MATCHES = "STRING_EXACTLY_MATCHES"
    STRING_CONTAINS_REGEX = "STRING_CONTAINS_REGEX"
    NUMERIC_LESS_THAN = "NUMERIC_LESS_THAN"
    NUMERIC_LESS_EQUAL = "NUMERIC_LESS_EQUAL"
    NUMERIC_EQUAL = "NUMERIC_EQUAL"
    NUMERIC_NOT_EQUAL = "NUMERIC_NOT_EQUAL"
    NUMERIC_GREATER_THAN = "NUMERIC_GREATER_THAN"
    NUMERIC_GREATER_EQUAL = "NUMERIC_GREATER_EQUAL"
    SEMANTIC_VERSION_LESS_THAN = "SEMANTIC_VERSION_LESS_THAN"
    SEMANTIC_VERSION_LESS_EQUAL = "SEMANTIC_VERSION_LESS_EQUAL"
    SEMANTIC_VERSION_EQUAL = "SEMANTIC_VERSION_EQUAL"
    SEMANTIC_VERSION_NOT_EQUAL = "SEMANTIC_VERSION_NOT_EQUAL"
    SEMANTIC_VERSION_GREATER_THAN = "SEMANTIC_VERSION_GREATER_THAN"
    SEMANTIC_VERSION_GREATER_EQUAL = "SEMANTIC_VERSION_GREATER_EQUAL"
    UNKNOWN = "UNKNOWN"

class _ServerTemplateData:
    """Parses, validates and encapsulates template data and metadata."""
    def __init__(self, template_data):
        """Initializes a new ServerTemplateData instance.

        Args:
            template_data: The data to be parsed for getting the parameters and conditions.

        Raises:
            ValueError: If the template data is not valid.
        """
        if 'parameters' in template_data:
            if template_data['parameters'] is not None:
                self._parameters = template_data['parameters']
            else:
                raise ValueError('Remote Config parameters must be a non-null object')
        else:
            self._parameters = {}

        if 'conditions' in template_data:
            if template_data['conditions'] is not None:
                self._conditions = template_data['conditions']
            else:
                raise ValueError('Remote Config conditions must be a non-null object')
        else:
            self._conditions = []

        self._version = ''
        if 'version' in template_data:
            self._version = template_data['version']

        self._etag = ''
        if 'etag' in template_data and isinstance(template_data['etag'], str):
            self._etag = template_data['etag']

        self._template_data_json = json.dumps(template_data)

    @property
    def parameters(self):
        return self._parameters

    @property
    def etag(self):
        return self._etag

    @property
    def version(self):
        return self._version

    @property
    def conditions(self):
        return self._conditions

    @property
    def template_data_json(self):
        return self._template_data_json


class ServerTemplate:
    """Represents a Server Template with implementations for loading and evaluating the template."""
    def __init__(self, app: App = None, default_config: Optional[Dict[str, str]] = None):
        """Initializes a ServerTemplate instance.

        Args:
          app: App instance to be used. This is optional and the default app instance will
                be used if not present.
          default_config: The default config to be used in the evaluated config.
        """
        self._rc_service = _utils.get_app_service(app,
                                                  _REMOTE_CONFIG_ATTRIBUTE, _RemoteConfigService)
        # This gets set when the template is
        # fetched from RC servers via the load API, or via the set API.
        self._cache = None
        self._stringified_default_config: Dict[str, str] = {}
        self._lock = threading.RLock()

        # RC stores all remote values as string, but it's more intuitive
        # to declare default values with specific types, so this converts
        # the external declaration to an internal string representation.
        if default_config is not None:
            for key in default_config:
                self._stringified_default_config[key] = str(default_config[key])

    async def load(self):
        """Fetches the server template and caches the data."""
        rc_server_template = await self._rc_service.get_server_template()
        with self._lock:
            self._cache = rc_server_template

    def evaluate(self, context: Optional[Dict[str, Union[str, int]]] = None) -> 'ServerConfig':
        """Evaluates the cached server template to produce a ServerConfig.

        Args:
          context: A dictionary of values to use for evaluating conditions.

        Returns:
          A ServerConfig object.
        Raises:
            ValueError: If the input arguments are invalid.
        """
        # Logic to process the cached template into a ServerConfig here.
        if not self._cache:
            raise ValueError("""No Remote Config Server template in cache.
                            Call load() before calling evaluate().""")
        context = context or {}
        config_values = {}

        with self._lock:
            template_conditions = self._cache.conditions
            template_parameters = self._cache.parameters

        # Initializes config Value objects with default values.
        if self._stringified_default_config is not None:
            for key, value in self._stringified_default_config.items():
                config_values[key] = _Value('default', value)
        self._evaluator = _ConditionEvaluator(template_conditions,
                                              template_parameters, context,
                                              config_values)
        return ServerConfig(config_values=self._evaluator.evaluate())

    def set(self, template_data_json: str):
        """Updates the cache to store the given template is of type ServerTemplateData.

        Args:
          template_data_json: A json string representing ServerTemplateData to be cached.
        """
        template_data_map = json.loads(template_data_json)
        template_data = _ServerTemplateData(template_data_map)

        with self._lock:
            self._cache = template_data

    def to_json(self):
        """Provides the server template in a JSON format to be used for initialization later."""
        if not self._cache:
            raise ValueError("""No Remote Config Server template in cache.
                            Call load() before calling toJSON().""")
        with self._lock:
            template_json = self._cache.template_data_json
        return template_json


class ServerConfig:
    """Represents a Remote Config Server Side Config."""
    def __init__(self, config_values):
        self._config_values = config_values # dictionary of param key to values

    def get_boolean(self, key):
        """Returns the value as a boolean."""
        return self._get_value(key).as_boolean()

    def get_string(self, key):
        """Returns the value as a string."""
        return self._get_value(key).as_string()

    def get_int(self, key):
        """Returns the value as an integer."""
        return self._get_value(key).as_int()

    def get_float(self, key):
        """Returns the value as a float."""
        return self._get_value(key).as_float()

    def get_value_source(self, key):
        """Returns the source of the value."""
        return self._get_value(key).get_source()

    def _get_value(self, key):
        return self._config_values.get(key, _Value('static'))


class _RemoteConfigService:
    """Internal class that facilitates sending requests to the Firebase Remote
        Config backend API.
    """
    def __init__(self, app):
        """Initialize a JsonHttpClient with necessary inputs.

        Args:
            app: App instance to be used for fetching app specific details required
                for initializing the http client.
        """
        remote_config_base_url = 'https://firebaseremoteconfig.googleapis.com'
        self._project_id = app.project_id
        app_credential = app.credential.get_credential()
        rc_headers = {
            'X-FIREBASE-CLIENT': 'fire-admin-python/{0}'.format(firebase_admin.__version__), }
        timeout = app.options.get('httpTimeout', _http_client.DEFAULT_TIMEOUT_SECONDS)

        self._client = _http_client.JsonHttpClient(credential=app_credential,
                                                   base_url=remote_config_base_url,
                                                   headers=rc_headers, timeout=timeout)

    async def get_server_template(self):
        """Requests for a server template and converts the response to an instance of
        ServerTemplateData for storing the template parameters and conditions."""
        try:
            loop = asyncio.get_event_loop()
            headers, template_data = await loop.run_in_executor(None,
                                                                self._client.headers_and_body,
                                                                'get', self._get_url())
        except requests.exceptions.RequestException as error:
            raise self._handle_remote_config_error(error)
        else:
            template_data['etag'] = headers.get('etag')
            return _ServerTemplateData(template_data)

    def _get_url(self):
        """Returns project prefix for url, in the format of /v1/projects/${projectId}"""
        return "/v1/projects/{0}/namespaces/firebase-server/serverRemoteConfig".format(
            self._project_id)

    @classmethod
    def _handle_remote_config_error(cls, error: Any):
        """Handles errors received from the Cloud Functions API."""
        return _utils.handle_platform_error_from_requests(error)


class _ConditionEvaluator:
    """Internal class that facilitates sending requests to the Firebase Remote
    Config backend API."""
    def __init__(self, conditions, parameters, context, config_values):
        self._context = context
        self._conditions = conditions
        self._parameters = parameters
        self._config_values = config_values

    def evaluate(self):
        """Internal function that evaluates the cached server template to produce
        a ServerConfig"""
        evaluated_conditions = self.evaluate_conditions(self._conditions, self._context)

        # Overlays config Value objects derived by evaluating the template.
        if self._parameters:
            for key, parameter in self._parameters.items():
                conditional_values = parameter.get('conditionalValues', {})
                default_value = parameter.get('defaultValue', {})
                parameter_value_wrapper = None
                # Iterates in order over condition list. If there is a value associated
                # with a condition, this checks if the condition is true.
                if evaluated_conditions:
                    for condition_name, condition_evaluation in evaluated_conditions.items():
                        if condition_name in conditional_values and condition_evaluation:
                            parameter_value_wrapper = conditional_values[condition_name]
                            break

                if parameter_value_wrapper and parameter_value_wrapper.get('useInAppDefault'):
                    logger.info("Using in-app default value for key '%s'", key)
                    continue

                if parameter_value_wrapper:
                    parameter_value = parameter_value_wrapper.get('value')
                    self._config_values[key] = _Value('remote', parameter_value)
                    continue

                if not default_value:
                    logger.warning("No default value found for key '%s'", key)
                    continue

                if default_value.get('useInAppDefault'):
                    logger.info("Using in-app default value for key '%s'", key)
                    continue
                self._config_values[key] = _Value('remote', default_value.get('value'))
        return self._config_values

    def evaluate_conditions(self, conditions, context)-> Dict[str, bool]:
        """Evaluates a list of conditions and returns a dictionary of results.

        Args:
          conditions: A list of NamedCondition objects.
          context: An EvaluationContext object.

        Returns:
          A dictionary that maps condition names to boolean evaluation results.
        """
        evaluated_conditions = {}
        for condition in conditions:
            evaluated_conditions[condition.get('name')] = self.evaluate_condition(
                condition.get('condition'), context
            )
        return evaluated_conditions

    def evaluate_condition(self, condition, context,
                           nesting_level: int = 0) -> bool:
        """Recursively evaluates a condition.

        Args:
          condition: The condition to evaluate.
          context: An EvaluationContext object.
          nesting_level: The current recursion depth.

        Returns:
          The boolean result of the condition evaluation.
        """
        if nesting_level >= MAX_CONDITION_RECURSION_DEPTH:
            logger.warning("Maximum condition recursion depth exceeded.")
            return False
        if condition.get('orCondition') is not None:
            return self.evaluate_or_condition(condition.get('orCondition'),
                                              context, nesting_level + 1)
        if condition.get('andCondition') is not None:
            return self.evaluate_and_condition(condition.get('andCondition'),
                                               context, nesting_level + 1)
        if condition.get('true') is not None:
            return True
        if condition.get('false') is not None:
            return False
        if condition.get('percent') is not None:
            return self.evaluate_percent_condition(condition.get('percent'), context)
        if condition.get('customSignal') is not None:
            return self.evaluate_custom_signal_condition(condition.get('customSignal'), context)
        logger.warning("Unknown condition type encountered.")
        return False

    def evaluate_or_condition(self, or_condition,
                              context,
                              nesting_level: int = 0) -> bool:
        """Evaluates an OR condition.

        Args:
          or_condition: The OR condition to evaluate.
          context: An EvaluationContext object.
          nesting_level: The current recursion depth.

        Returns:
          True if any of the subconditions are true, False otherwise.
        """
        sub_conditions = or_condition.get('conditions') or []
        for sub_condition in sub_conditions:
            result = self.evaluate_condition(sub_condition, context, nesting_level + 1)
            if result:
                return True
        return False

    def evaluate_and_condition(self, and_condition,
                               context,
                               nesting_level: int = 0) -> bool:
        """Evaluates an AND condition.

        Args:
          and_condition: The AND condition to evaluate.
          context: An EvaluationContext object.
          nesting_level: The current recursion depth.

        Returns:
          True if all of the subconditions are met; False otherwise.
        """
        sub_conditions = and_condition.get('conditions') or []
        for sub_condition in sub_conditions:
            result = self.evaluate_condition(sub_condition, context, nesting_level + 1)
            if not result:
                return False
        return True

    def evaluate_percent_condition(self, percent_condition,
                                   context) -> bool:
        """Evaluates a percent condition.

        Args:
          percent_condition: The percent condition to evaluate.
          context: An EvaluationContext object.

        Returns:
          True if the condition is met, False otherwise.
        """
        if not context.get('randomization_id'):
            logger.warning("Missing randomization_id in context for evaluating percent condition.")
            return False

        seed = percent_condition.get('seed')
        percent_operator = percent_condition.get('percentOperator')
        micro_percent = percent_condition.get('microPercent')
        micro_percent_range = percent_condition.get('microPercentRange')
        if not percent_operator:
            logger.warning("Missing percent operator for percent condition.")
            return False
        if micro_percent_range:
            norm_percent_upper_bound = micro_percent_range.get('microPercentUpperBound') or 0
            norm_percent_lower_bound = micro_percent_range.get('microPercentLowerBound') or 0
        else:
            norm_percent_upper_bound = 0
            norm_percent_lower_bound = 0
        if micro_percent:
            norm_micro_percent = micro_percent
        else:
            norm_micro_percent = 0
        seed_prefix = f"{seed}." if seed else ""
        string_to_hash = f"{seed_prefix}{context.get('randomization_id')}"

        hash64 = self.hash_seeded_randomization_id(string_to_hash)
        instance_micro_percentile = hash64 % (100 * 1000000)
        if percent_operator == PercentConditionOperator.LESS_OR_EQUAL.value:
            return instance_micro_percentile <= norm_micro_percent
        if percent_operator == PercentConditionOperator.GREATER_THAN.value:
            return instance_micro_percentile > norm_micro_percent
        if percent_operator == PercentConditionOperator.BETWEEN.value:
            return norm_percent_lower_bound < instance_micro_percentile <= norm_percent_upper_bound
        logger.warning("Unknown percent operator: %s", percent_operator)
        return False
    def hash_seeded_randomization_id(self, seeded_randomization_id: str) -> int:
        """Hashes a seeded randomization ID.

        Args:
          seeded_randomization_id: The seeded randomization ID to hash.

        Returns:
          The hashed value.
        """
        hash_object = hashlib.sha256()
        hash_object.update(seeded_randomization_id.encode('utf-8'))
        hash64 = hash_object.hexdigest()
        return abs(int(hash64, 16))

    def evaluate_custom_signal_condition(self, custom_signal_condition,
                                         context) -> bool:
        """Evaluates a custom signal condition.

        Args:
          custom_signal_condition: The custom signal condition to evaluate.
          context: An EvaluationContext object.

        Returns:
          True if the condition is met, False otherwise.
        """
        custom_signal_operator = custom_signal_condition.get('customSignalOperator') or {}
        custom_signal_key = custom_signal_condition.get('customSignalKey') or {}
        target_custom_signal_values = (
            custom_signal_condition.get('targetCustomSignalValues') or {})

        if not all([custom_signal_operator, custom_signal_key, target_custom_signal_values]):
            logger.warning("Missing operator, key, or target values for custom signal condition.")
            return False

        if not target_custom_signal_values:
            return False
        actual_custom_signal_value = context.get(custom_signal_key) or {}

        if not actual_custom_signal_value:
            logger.debug("Custom signal value not found in context: %s", custom_signal_key)
            return False

        if custom_signal_operator == CustomSignalOperator.STRING_CONTAINS.value:
            return self._compare_strings(target_custom_signal_values,
                                         actual_custom_signal_value,
                                         lambda target, actual: target in actual)
        if custom_signal_operator == CustomSignalOperator.STRING_DOES_NOT_CONTAIN.value:
            return not self._compare_strings(target_custom_signal_values,
                                             actual_custom_signal_value,
                                             lambda target, actual: target in actual)
        if custom_signal_operator == CustomSignalOperator.STRING_EXACTLY_MATCHES.value:
            return self._compare_strings(target_custom_signal_values,
                                         actual_custom_signal_value,
                                         lambda target, actual: target.strip() == actual.strip())
        if custom_signal_operator == CustomSignalOperator.STRING_CONTAINS_REGEX.value:
            return self._compare_strings(target_custom_signal_values,
                                         actual_custom_signal_value,
                                         re.search)

        # For numeric operators only one target value is allowed.
        if custom_signal_operator == CustomSignalOperator.NUMERIC_LESS_THAN.value:
            return self._compare_numbers(custom_signal_key,
                                         target_custom_signal_values[0],
                                         actual_custom_signal_value,
                                         lambda r: r < 0)
        if custom_signal_operator == CustomSignalOperator.NUMERIC_LESS_EQUAL.value:
            return self._compare_numbers(custom_signal_key,
                                         target_custom_signal_values[0],
                                         actual_custom_signal_value,
                                         lambda r: r <= 0)
        if custom_signal_operator == CustomSignalOperator.NUMERIC_EQUAL.value:
            return self._compare_numbers(custom_signal_key,
                                         target_custom_signal_values[0],
                                         actual_custom_signal_value,
                                         lambda r: r == 0)
        if custom_signal_operator == CustomSignalOperator.NUMERIC_NOT_EQUAL.value:
            return self._compare_numbers(custom_signal_key,
                                         target_custom_signal_values[0],
                                         actual_custom_signal_value,
                                         lambda r: r != 0)
        if custom_signal_operator == CustomSignalOperator.NUMERIC_GREATER_THAN.value:
            return self._compare_numbers(custom_signal_key,
                                         target_custom_signal_values[0],
                                         actual_custom_signal_value,
                                         lambda r: r > 0)
        if custom_signal_operator == CustomSignalOperator.NUMERIC_GREATER_EQUAL.value:
            return self._compare_numbers(custom_signal_key,
                                         target_custom_signal_values[0],
                                         actual_custom_signal_value,
                                         lambda r: r >= 0)

        # For semantic operators only one target value is allowed.
        if custom_signal_operator == CustomSignalOperator.SEMANTIC_VERSION_LESS_THAN.value:
            return self._compare_semantic_versions(custom_signal_key,
                                                   target_custom_signal_values[0],
                                                   actual_custom_signal_value,
                                                   lambda r: r < 0)
        if custom_signal_operator == CustomSignalOperator.SEMANTIC_VERSION_LESS_EQUAL.value:
            return self._compare_semantic_versions(custom_signal_key,
                                                   target_custom_signal_values[0],
                                                   actual_custom_signal_value,
                                                   lambda r: r <= 0)
        if custom_signal_operator == CustomSignalOperator.SEMANTIC_VERSION_EQUAL.value:
            return self._compare_semantic_versions(custom_signal_key,
                                                   target_custom_signal_values[0],
                                                   actual_custom_signal_value,
                                                   lambda r: r == 0)
        if custom_signal_operator == CustomSignalOperator.SEMANTIC_VERSION_NOT_EQUAL.value:
            return self._compare_semantic_versions(custom_signal_key,
                                                   target_custom_signal_values[0],
                                                   actual_custom_signal_value,
                                                   lambda r: r != 0)
        if custom_signal_operator == CustomSignalOperator.SEMANTIC_VERSION_GREATER_THAN.value:
            return self._compare_semantic_versions(custom_signal_key,
                                                   target_custom_signal_values[0],
                                                   actual_custom_signal_value,
                                                   lambda r: r > 0)
        if custom_signal_operator == CustomSignalOperator.SEMANTIC_VERSION_GREATER_EQUAL.value:
            return self._compare_semantic_versions(custom_signal_key,
                                                   target_custom_signal_values[0],
                                                   actual_custom_signal_value,
                                                   lambda r: r >= 0)
        logger.warning("Unknown custom signal operator: %s", custom_signal_operator)
        return False

    def _compare_strings(self, target_values, actual_value, predicate_fn) -> bool:
        """Compares the actual string value of a signal against a list of target values.

        Args:
            target_values: A list of target string values.
            actual_value: The actual value to compare, which can be a string or number.
            predicate_fn: A function that takes two string arguments (target and actual)
                            and returns a boolean indicating whether
                            the target matches the actual value.

        Returns:
            bool: True if the predicate function returns True for any target value in the list,
                False otherwise.
        """

        for target in target_values:
            if predicate_fn(target, str(actual_value)):
                return True
        return False

    def _compare_numbers(self, custom_signal_key, target_value, actual_value, predicate_fn) -> bool:
        try:
            target = float(target_value)
            actual = float(actual_value)
            result = -1 if actual < target else 1 if actual > target else 0
            return predicate_fn(result)
        except ValueError:
            logger.warning("Invalid numeric value for comparison for custom signal key %s.",
                           custom_signal_key)
            return False

    def _compare_semantic_versions(self, custom_signal_key,
                                   target_value, actual_value, predicate_fn) -> bool:
        """Compares the actual semantic version value of a signal against a target value.
        Calls the predicate function with -1, 0, 1 if actual is less than, equal to,
        or greater than target.

        Args:
        custom_signal_key: The custom signal for which the evaluation is being performed.
        target_values: A list of target string values.
        actual_value: The actual value to compare, which can be a string or number.
        predicate_fn: A function that takes an integer (-1, 0, or 1) and returns a boolean.

        Returns:
            bool: True if the predicate function returns True for the result of the comparison,
        False otherwise.
        """
        return self._compare_versions(custom_signal_key, str(actual_value),
                                      str(target_value), predicate_fn)

    def _compare_versions(self, custom_signal_key,
                          sem_version_1, sem_version_2, predicate_fn) -> bool:
        """Compares two semantic version strings.

        Args:
            custom_signal_key: The custom singal for which the evaluation is being performed.
            sem_version_1: The first semantic version string.
            sem_version_2: The second semantic version string.
            predicate_fn: A function that takes an integer and returns a boolean.

        Returns:
            bool: The result of the predicate function.
        """
        try:
            v1_parts = [int(part) for part in sem_version_1.split('.')]
            v2_parts = [int(part) for part in sem_version_2.split('.')]
            max_length = max(len(v1_parts), len(v2_parts))
            v1_parts.extend([0] * (max_length - len(v1_parts)))
            v2_parts.extend([0] * (max_length - len(v2_parts)))

            for part1, part2 in zip(v1_parts, v2_parts):
                if any((part1 < 0, part2 < 0)):
                    raise ValueError
                if part1 < part2:
                    return predicate_fn(-1)
                if part1 > part2:
                    return predicate_fn(1)
            return predicate_fn(0)
        except ValueError:
            logger.warning(
                "Invalid semantic version format for comparison for custom signal key %s.",
                custom_signal_key)
            return False

async def get_server_template(app: App = None, default_config: Optional[Dict[str, str]] = None):
    """Initializes a new ServerTemplate instance and fetches the server template.

    Args:
        app: App instance to be used. This is optional and the default app instance will
            be used if not present.
        default_config: The default config to be used in the evaluated config.

    Returns:
        ServerTemplate: An object having the cached server template to be used for evaluation.
    """
    template = init_server_template(app=app, default_config=default_config)
    await template.load()
    return template

def init_server_template(app: App = None, default_config: Optional[Dict[str, str]] = None,
                         template_data_json: Optional[str] = None):
    """Initializes a new ServerTemplate instance.

    Args:
        app: App instance to be used. This is optional and the default app instance will
            be used if not present.
        default_config: The default config to be used in the evaluated config.
        template_data_json: An optional template data JSON to be set on initialization.

    Returns:
        ServerTemplate: A new ServerTemplate instance initialized with an optional
        template and config.
    """
    template = ServerTemplate(app=app, default_config=default_config)
    if template_data_json is not None:
        template.set(template_data_json)
    return template

class _Value:
    """Represents a value fetched from Remote Config.
    """
    DEFAULT_VALUE_FOR_BOOLEAN = False
    DEFAULT_VALUE_FOR_STRING = ''
    DEFAULT_VALUE_FOR_INTEGER = 0
    DEFAULT_VALUE_FOR_FLOAT_NUMBER = 0.0
    BOOLEAN_TRUTHY_VALUES = ['1', 'true', 't', 'yes', 'y', 'on']

    def __init__(self, source: ValueSource, value: str = DEFAULT_VALUE_FOR_STRING):
        """Initializes a Value instance.

        Args:
          source: The source of the value (e.g., 'default', 'remote', 'static').
          "static" indicates the value was defined by a static constant.
          "default" indicates the value was defined by default config.
          "remote" indicates the value was defined by config produced by evaluating a template.
          value: The string value.
        """
        self.source = source
        self.value = value

    def as_string(self) -> str:
        """Returns the value as a string."""
        if self.source == 'static':
            return self.DEFAULT_VALUE_FOR_STRING
        return str(self.value)

    def as_boolean(self) -> bool:
        """Returns the value as a boolean."""
        if self.source == 'static':
            return self.DEFAULT_VALUE_FOR_BOOLEAN
        return str(self.value).lower() in self.BOOLEAN_TRUTHY_VALUES

    def as_int(self) -> float:
        """Returns the value as a number."""
        if self.source == 'static':
            return self.DEFAULT_VALUE_FOR_INTEGER
        try:
            return int(self.value)
        except ValueError:
            return self.DEFAULT_VALUE_FOR_INTEGER

    def as_float(self) -> float:
        """Returns the value as a number."""
        if self.source == 'static':
            return self.DEFAULT_VALUE_FOR_FLOAT_NUMBER
        try:
            return float(self.value)
        except ValueError:
            return self.DEFAULT_VALUE_FOR_FLOAT_NUMBER

    def get_source(self) -> ValueSource:
        """Returns the source of the value."""
        return self.source
