# Copyright 2016 The Oppia Authors. All Rights Reserved.
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

"""Main package for URL routing for incoming emails."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import sys

ROOT_PATH = os.path.dirname(__file__)
_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
OPPIA_TOOLS_PATH = os.path.join(_PARENT_DIR, 'oppia_tools')

# oppia_tools/ is available locally (in both dev and prod mode). However,
# on the GAE production server, oppia_tools/ is not available, and the default
# PIL third-party library is used instead.
#
# We cannot special-case this using DEV_MODE because it is possible to run
# Oppia in production mode locally, where a built-in PIL won't be available.
# Hence the check for oppia_tools instead.
if os.path.isdir(OPPIA_TOOLS_PATH):
    PIL_PATH = os.path.join(
        OPPIA_TOOLS_PATH, 'Pillow-6.2.2')
    if not os.path.isdir(PIL_PATH):
        raise Exception('Invalid path for oppia_tools library: %s' % PIL_PATH)
    sys.path.insert(0, PIL_PATH)

THIRD_PARTY_LIBS = [
    os.path.join(
        ROOT_PATH, 'third_party', 'backports.functools_lru_cache-1.6.1'),
    os.path.join(ROOT_PATH, 'third_party', 'beautifulsoup4-4.9.1'),
    os.path.join(ROOT_PATH, 'third_party', 'bleach-3.1.5'),
    os.path.join(ROOT_PATH, 'third_party', 'callbacks-0.3.0'),
    os.path.join(ROOT_PATH, 'third_party', 'future-0.17.1'),
    os.path.join(ROOT_PATH, 'third_party', 'gae-cloud-storage-1.9.22.1'),
    os.path.join(ROOT_PATH, 'third_party', 'gae-mapreduce-1.9.22.0'),
    os.path.join(ROOT_PATH, 'third_party', 'gae-pipeline-1.9.22.1'),
    os.path.join(ROOT_PATH, 'third_party', 'graphy-1.0.0'),
    os.path.join(ROOT_PATH, 'third_party', 'html5lib-python-1.1'),
    os.path.join(ROOT_PATH, 'third_party', 'mutagen-1.43.0'),
    os.path.join(ROOT_PATH, 'third_party', 'packaging-20.4'),
    os.path.join(ROOT_PATH, 'third_party', 'pylatexenc-2.6'),
    os.path.join(ROOT_PATH, 'third_party', 'simplejson-3.17.0'),
    os.path.join(ROOT_PATH, 'third_party', 'six-1.15.0'),
    os.path.join(ROOT_PATH, 'third_party', 'soupsieve-1.9.5'),
    os.path.join(ROOT_PATH, 'third_party', 'webencodings-0.5.1'),
]

for lib_path in THIRD_PARTY_LIBS:
    if not os.path.isdir(lib_path):
        raise Exception('Invalid path for third_party library: %s' % lib_path)
    sys.path.insert(0, lib_path)

# The system path insertions above MUST be run before the imports below because
# each of the imports below uses various third_party libraries in their
# execution. During the import of a python module, the python interpreter also
# loads imports specific to that module. For example, the acl_decorators module
# imports backports.functools_lru_cache so importing acl_decorators will
# automatically force the python interpreter to import backports as part of the
# acl_decorators import execution. The system path setup above lets the python
# compiler know where to look when these third_party imports occur.
# As such, any imports of non system-standard modules should occur after the
# third_party libraries are added to the system path.

from core.controllers import incoming_emails # isort:skip   pylint: disable=wrong-import-position, wrong-import-order
from core.platform import models # isort:skip   pylint: disable=wrong-import-position, wrong-import-order
import feconf # isort:skip   pylint: disable=wrong-import-position, wrong-import-order
import main # isort:skip   pylint: disable=wrong-import-position, wrong-import-order

import webapp2 # isort:skip   pylint: disable=wrong-import-position, wrong-import-order


transaction_services = models.Registry.import_transaction_services()

# Register the URLs with the classes responsible for handling them.
URLS = [
    main.get_redirect_route(
        '/_ah/mail/reply+<reply_to_id>@%s' % feconf.INCOMING_EMAILS_DOMAIN_NAME,
        incoming_emails.IncomingReplyEmailHandler),
]

app = transaction_services.toplevel_wrapper(  # pylint: disable=invalid-name
    webapp2.WSGIApplication(URLS, debug=feconf.DEBUG))
