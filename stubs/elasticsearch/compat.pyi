#  Licensed to Elasticsearch B.V. under one or more contributor
#  license agreements. See the NOTICE file distributed with
#  this work for additional information regarding copyright
#  ownership. Elasticsearch B.V. licenses this file to you under
#  the Apache License, Version 2.0 (the "License"); you may
#  not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
# 	http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing,
#  software distributed under the License is distributed on an
#  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
#  KIND, either express or implied.  See the License for the
#  specific language governing permissions and limitations
#  under the License.

import sys
from typing import Tuple

PY2: bool
string_types: Tuple[type, ...]

if sys.version_info[0] == 2:
    from urllib import (
        quote_plus as quote_plus,
        quote as quote,
        urlencode as urlencode,
        unquote as unquote,
    )
    from urlparse import urlparse as urlparse
    from itertools import imap as map
    from Queue import Queue as Queue
else:
    from urllib.parse import (
        quote as quote,
        quote_plus as quote_plus,
        urlencode as urlencode,
        urlparse as urlparse,
        unquote as unquote,
    )

    map = map
    from queue import Queue as Queue
