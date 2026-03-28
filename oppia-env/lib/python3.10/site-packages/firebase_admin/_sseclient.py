# Copyright 2017 Google Inc.
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

"""SSEClient module to stream realtime updates from the Firebase Database.

Based on a similar implementation from Pyrebase.
"""

import re
import time
import warnings

from google.auth import transport
import requests


# Technically, we should support streams that mix line endings.  This regex,
# however, assumes that a system will provide consistent line endings.
end_of_field = re.compile(r'\r\n\r\n|\r\r|\n\n')


class KeepAuthSession(transport.requests.AuthorizedSession):
    """A session that does not drop authentication on redirects between domains."""

    def __init__(self, credential):
        super(KeepAuthSession, self).__init__(credential)

    def rebuild_auth(self, prepared_request, response):
        pass


class _EventBuffer:
    """A helper class for buffering and parsing raw SSE data."""

    def __init__(self):
        self._buffer = []
        self._tail = ''

    def append(self, char):
        self._buffer.append(char)
        self._tail += char
        self._tail = self._tail[-4:]

    def truncate(self):
        head, sep, _ = self.buffer_string.rpartition('\n')
        rem = head + sep
        self._buffer = list(rem)
        self._tail = rem[-4:]

    @property
    def is_end_of_field(self):
        last_two_chars = self._tail[-2:]
        return last_two_chars == '\n\n' or last_two_chars == '\r\r' or self._tail == '\r\n\r\n'

    @property
    def buffer_string(self):
        return ''.join(self._buffer)


class SSEClient:
    """SSE client implementation."""

    def __init__(self, url, session, retry=3000, **kwargs):
        """Initializes the SSEClient.

        Args:
          url: The remote url to connect to.
          session: The requests session.
          retry: The retry interval in milliseconds (optional).
          **kwargs: Extra kwargs that will be sent to ``requests.get()`` (optional).
        """
        self.url = url
        self.session = session
        self.retry = retry
        self.requests_kwargs = kwargs
        self.should_connect = True
        self.last_id = None
        self.buf = u'' # Keep data here as it streams in

        headers = self.requests_kwargs.get('headers', {})
        # The SSE spec requires making requests with Cache-Control: no-cache
        headers['Cache-Control'] = 'no-cache'
        # The 'Accept' header is not required, but explicit > implicit
        headers['Accept'] = 'text/event-stream'
        self.requests_kwargs['headers'] = headers
        self._connect()

    def close(self):
        """Closes the SSEClient instance."""
        self.should_connect = False
        self.retry = 0
        self.resp.close()

    def _connect(self):
        """Connects to the server using requests."""
        if self.should_connect:
            if self.last_id:
                self.requests_kwargs['headers']['Last-Event-ID'] = self.last_id
            self.resp = self.session.get(self.url, stream=True, **self.requests_kwargs)
            self.resp_iterator = self.resp.iter_content(decode_unicode=True)
            self.resp.raise_for_status()
        else:
            raise StopIteration()

    def __iter__(self):
        return self

    def __next__(self):
        if not re.search(end_of_field, self.buf):
            temp_buffer = _EventBuffer()
            while not temp_buffer.is_end_of_field:
                try:
                    nextchar = next(self.resp_iterator)
                    temp_buffer.append(nextchar)
                except (StopIteration, requests.RequestException):
                    time.sleep(self.retry / 1000.0)
                    self._connect()
                    # The SSE spec only supports resuming from a whole message, so
                    # if we have half a message we should throw it out.
                    temp_buffer.truncate()
                    continue
            self.buf = temp_buffer.buffer_string

        split = re.split(end_of_field, self.buf)
        head = split[0]
        self.buf = '\n\n'.join(split[1:])
        event = Event.parse(head)

        if event.data == 'credential is no longer valid':
            self._connect()
            return None
        if event.data == 'null':
            return None

        # If the server requests a specific retry delay, we need to honor it.
        if event.retry:
            self.retry = event.retry

        # last_id should only be set if included in the message.  It's not
        # forgotten if a message omits it.
        if event.event_id:
            self.last_id = event.event_id
        return event

    def next(self):
        return self.__next__()


class Event:
    """Event represents the events fired by SSE."""

    sse_line_pattern = re.compile('(?P<name>[^:]*):?( ?(?P<value>.*))?')

    def __init__(self, data='', event_type='message', event_id=None, retry=None):
        self.data = data
        self.event_type = event_type
        self.event_id = event_id
        self.retry = retry

    @classmethod
    def parse(cls, raw):
        """Given a possibly-multiline string representing an SSE message, parses it
        and returns an Event object.

        Args:
          raw: the raw data to parse.

        Returns:
          Event: A new ``Event`` with the parameters initialized.
        """
        event = cls()
        for line in raw.split('\n'):
            match = cls.sse_line_pattern.match(line)
            if match is None:
                # Malformed line.  Discard but warn.
                warnings.warn('Invalid SSE line: "%s"' % line, SyntaxWarning)
                continue

            name = match.groupdict()['name']
            value = match.groupdict()['value']
            if name == '':
                # line began with a ":", so is a comment.  Ignore
                continue
            if name == 'data':
                # If we already have some data, then join to it with a newline.
                # Else this is it.
                if event.data:
                    event.data = '%s\n%s' % (event.data, value)
                else:
                    event.data = value
            elif name == 'event':
                event.event_type = value
            elif name == 'id':
                event.event_id = value
            elif name == 'retry':
                event.retry = int(value)
        return event
