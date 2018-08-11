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

import logging
import os
import sys
import time

import feconf

# Whether to calculate costs for RPCs, in addition to time taken.
appstats_CALC_RPC_COSTS = True
# The number of lines to record for an RPC stacktrace.
appstats_MAX_STACK = 50


def webapp_add_wsgi_middleware(app):
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

if feconf.DEV_MODE:
    _PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
    pil_path = os.path.join(_PARENT_DIR, 'oppia_tools', 'PIL-1.1.7')

    if not os.path.isdir(pil_path):
        raise Exception('Invalid path for oppia_tools library: %s' % pil_path)
    sys.path.insert(0, pil_path)

THIRD_PARTY_LIBS = [
    os.path.join(ROOT_PATH, 'third_party', 'bleach-1.2.2'),
    os.path.join(ROOT_PATH, 'third_party', 'html5lib-python-0.95'),
    os.path.join(ROOT_PATH, 'third_party', 'gae-mapreduce-1.9.17.0'),
    os.path.join(ROOT_PATH, 'third_party', 'gae-cloud-storage-1.9.15.0'),
    os.path.join(ROOT_PATH, 'third_party', 'gae-pipeline-1.9.17.0'),
    os.path.join(ROOT_PATH, 'third_party', 'graphy-1.0.0'),
    os.path.join(ROOT_PATH, 'third_party', 'requests-2.10.0'),
    os.path.join(ROOT_PATH, 'third_party', 'simplejson-3.7.1'),
    os.path.join(ROOT_PATH, 'third_party', 'beautifulsoup4-4.6.0'),
    os.path.join(ROOT_PATH, 'third_party', 'mutagen-1.38'),
]

for lib_path in THIRD_PARTY_LIBS:
    if not os.path.isdir(lib_path):
        raise Exception('Invalid path for third_party library: %s' % lib_path)
    sys.path.insert(0, lib_path)

# Required, otherwise MapReduce third-party library will throw errors.
os.environ['PYTHONPATH'] = ','.join(sys.path)
