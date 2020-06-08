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

# pylint: skip-file

"""Configuration for App Engine."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import logging
import os
import sys
import time

# Whether to calculate costs for RPCs, in addition to time taken.
appstats_CALC_RPC_COSTS = True
# The number of lines to record for an RPC stacktrace.
appstats_MAX_STACK = 50


def webapp_add_wsgi_middleware(app):  # pragma: no cover
    """Add AppStats recording.

    This also sets the level of appstats log messages to 'debug' by
    monkey-patching. For details, see:

        https://stackoverflow.com/questions/4305243/disable-appstats-logging
    """

    from google.appengine.ext.appstats import recording

    def save(self):
        t0 = time.time()
        with self._lock:
            num_pending = len(self.pending)
        if num_pending:
            logging.warn('Found %d RPC request(s) without matching response '
                         '(presumably due to timeouts or other errors)',
                         num_pending)
        self.dump()
        try:
            key, len_part, len_full = self._save()
        except Exception:
            logging.exception('Recorder.save() failed')
            return
        t1 = time.time()
        link = 'http://%s%s/details?time=%s' % (
            self.env.get('HTTP_HOST', ''),
            recording.config.stats_url,
            int(self.start_timestamp * 1000))
        logging.debug('Saved; key: %s, part: %s bytes, full: %s bytes, '
                      'overhead: %.3f + %.3f; link: %s',
                      key, len_part, len_full, self.overhead, t1 - t0, link)

    recording.Recorder.save = save

    app = recording.appstats_wsgi_middleware(app)
    return app


# Root path of the app.
ROOT_PATH = os.path.dirname(__file__)
_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
oppia_tools_path = os.path.join(_PARENT_DIR, 'oppia_tools')

# oppia_tools/ is available locally (in both dev and prod mode). However,
# on the GAE production server, oppia_tools/ is not available, and the default
# PIL third-party library is used instead.
#
# We cannot special-case this using DEV_MODE because it is possible to run
# Oppia in production mode locally, where a built-in PIL won't be available.
# Hence the check for oppia_tools instead.
if os.path.isdir(oppia_tools_path):
    pil_path = os.path.join(
        oppia_tools_path, 'Pillow-6.2.2')
    if not os.path.isdir(pil_path):
        raise Exception('Invalid path for oppia_tools library: %s' % pil_path)
    sys.path.insert(0, pil_path)

THIRD_PARTY_LIBS = [
    os.path.join(ROOT_PATH, 'third_party', 'backports.functools_lru_cache-1.6.1'),
    os.path.join(ROOT_PATH, 'third_party', 'beautifulsoup4-4.9.0'),
    os.path.join(ROOT_PATH, 'third_party', 'bleach-3.1.5'),
    os.path.join(ROOT_PATH, 'third_party', 'callbacks-0.3.0'),
    os.path.join(ROOT_PATH, 'third_party', 'future-0.17.1'),
    os.path.join(ROOT_PATH, 'third_party', 'gae-cloud-storage-1.9.22.1'),
    os.path.join(ROOT_PATH, 'third_party', 'gae-mapreduce-1.9.22.0'),
    os.path.join(ROOT_PATH, 'third_party', 'gae-pipeline-1.9.22.1'),
    os.path.join(ROOT_PATH, 'third_party', 'graphy-1.0.0'),
    os.path.join(ROOT_PATH, 'third_party', 'html5lib-python-1.0.1'),
    os.path.join(ROOT_PATH, 'third_party', 'mutagen-1.43.0'),
    os.path.join(ROOT_PATH, 'third_party', 'packaging-20.3'),
    os.path.join(ROOT_PATH, 'third_party', 'simplejson-3.17.0'),
    os.path.join(ROOT_PATH, 'third_party', 'six-1.12.0'),
    os.path.join(ROOT_PATH, 'third_party', 'soupsieve-1.9.5'),
    os.path.join(ROOT_PATH, 'third_party', 'webencodings-0.5.1'),
]

for lib_path in THIRD_PARTY_LIBS:
    if not os.path.isdir(lib_path):
        raise Exception('Invalid path for third_party library: %s' % lib_path)
    sys.path.insert(0, lib_path)
