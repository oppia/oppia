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

"""Registry for JavaScript library dependencies."""

import itertools
import os

from extensions.dependencies import dependencies_config
import feconf
import utils


class Registry(object):
    """Registry of all JS/CSS library dependencies."""

    @classmethod
    def get_dependency_html(cls, dependency_id):
        """Returns the HTML template needed to inject this dependency in the
        client webpage.
        """
        return utils.get_file_contents(os.path.join(
            feconf.DEPENDENCIES_TEMPLATES_DIR, '%s.html' % dependency_id))

    @classmethod
    def get_angular_modules(cls, dependency_id):
        """Returns a list of additional modules that the main Angular module
        in the client webpage needs to depend on.
        """
        return dependencies_config.DEPENDENCIES_TO_ANGULAR_MODULES_DICT.get(
            dependency_id, [])

    @classmethod
    def get_deps_html_and_angular_modules(cls, dependency_ids):
        """Returns data needed to load the given dependencies.

        The return value is a 2-tuple. The first element of the tuple is the
        additional HTML to insert on the page. The second element of the tuple
        is a de-duplicated list of strings, each representing an additional
        angular module that should be loaded.
        """
        html = '\n'.join([
            cls.get_dependency_html(dep) for dep in set(dependency_ids)])
        angular_modules_for_each_dep = [
            cls.get_angular_modules(dep) for dep in set(dependency_ids)]
        deduplicated_angular_modules = list(set(list(
            itertools.chain.from_iterable(angular_modules_for_each_dep))))
        return html, deduplicated_angular_modules
