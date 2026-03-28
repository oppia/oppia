# Copyright 2019 Google Inc.
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

"""Encoding and validation utils for the messaging (FCM) module."""

import datetime
import json
import math
import numbers
import re

import firebase_admin._messaging_utils as _messaging_utils


class Message:
    """A message that can be sent via Firebase Cloud Messaging.

    Contains payload information as well as recipient information. In particular, the message must
    contain exactly one of token, topic or condition fields.

    Args:
        data: A dictionary of data fields (optional). All keys and values in the dictionary must be
            strings.
        notification: An instance of ``messaging.Notification`` (optional).
        android: An instance of ``messaging.AndroidConfig`` (optional).
        webpush: An instance of ``messaging.WebpushConfig`` (optional).
        apns: An instance of ``messaging.ApnsConfig`` (optional).
        fcm_options: An instance of ``messaging.FCMOptions`` (optional).
        token: The registration token of the device to which the message should be sent (optional).
        topic: Name of the FCM topic to which the message should be sent (optional). Topic name
            may contain the ``/topics/`` prefix.
        condition: The FCM condition to which the message should be sent (optional).
    """

    def __init__(self, data=None, notification=None, android=None, webpush=None, apns=None,
                 fcm_options=None, token=None, topic=None, condition=None):
        self.data = data
        self.notification = notification
        self.android = android
        self.webpush = webpush
        self.apns = apns
        self.fcm_options = fcm_options
        self.token = token
        self.topic = topic
        self.condition = condition

    def __str__(self):
        return json.dumps(self, cls=MessageEncoder, sort_keys=True)


class MulticastMessage:
    """A message that can be sent to multiple tokens via Firebase Cloud Messaging.

    Args:
        tokens: A list of registration tokens of targeted devices.
        data: A dictionary of data fields (optional). All keys and values in the dictionary must be
            strings.
        notification: An instance of ``messaging.Notification`` (optional).
        android: An instance of ``messaging.AndroidConfig`` (optional).
        webpush: An instance of ``messaging.WebpushConfig`` (optional).
        apns: An instance of ``messaging.ApnsConfig`` (optional).
        fcm_options: An instance of ``messaging.FCMOptions`` (optional).
    """
    def __init__(self, tokens, data=None, notification=None, android=None, webpush=None, apns=None,
                 fcm_options=None):
        _Validators.check_string_list('MulticastMessage.tokens', tokens)
        if len(tokens) > 500:
            raise ValueError('MulticastMessage.tokens must not contain more than 500 tokens.')
        self.tokens = tokens
        self.data = data
        self.notification = notification
        self.android = android
        self.webpush = webpush
        self.apns = apns
        self.fcm_options = fcm_options


class _Validators:
    """A collection of data validation utilities.

    Methods provided in this class raise ``ValueErrors`` if any validations fail.
    """

    @classmethod
    def check_string(cls, label, value, non_empty=False):
        """Checks if the given value is a string."""
        if value is None:
            return None
        if not isinstance(value, str):
            if non_empty:
                raise ValueError('{0} must be a non-empty string.'.format(label))
            raise ValueError('{0} must be a string.'.format(label))
        if non_empty and not value:
            raise ValueError('{0} must be a non-empty string.'.format(label))
        return value

    @classmethod
    def check_number(cls, label, value):
        if value is None:
            return None
        if not isinstance(value, numbers.Number):
            raise ValueError('{0} must be a number.'.format(label))
        return value

    @classmethod
    def check_string_dict(cls, label, value):
        """Checks if the given value is a dictionary comprised only of string keys and values."""
        if value is None or value == {}:
            return None
        if not isinstance(value, dict):
            raise ValueError('{0} must be a dictionary.'.format(label))
        non_str = [k for k in value if not isinstance(k, str)]
        if non_str:
            raise ValueError('{0} must not contain non-string keys.'.format(label))
        non_str = [v for v in value.values() if not isinstance(v, str)]
        if non_str:
            raise ValueError('{0} must not contain non-string values.'.format(label))
        return value

    @classmethod
    def check_string_list(cls, label, value):
        """Checks if the given value is a list comprised only of strings."""
        if value is None or value == []:
            return None
        if not isinstance(value, list):
            raise ValueError('{0} must be a list of strings.'.format(label))
        non_str = [k for k in value if not isinstance(k, str)]
        if non_str:
            raise ValueError('{0} must not contain non-string values.'.format(label))
        return value

    @classmethod
    def check_number_list(cls, label, value):
        """Checks if the given value is a list comprised only of numbers."""
        if value is None or value == []:
            return None
        if not isinstance(value, list):
            raise ValueError('{0} must be a list of numbers.'.format(label))
        non_number = [k for k in value if not isinstance(k, numbers.Number)]
        if non_number:
            raise ValueError('{0} must not contain non-number values.'.format(label))
        return value

    @classmethod
    def check_analytics_label(cls, label, value):
        """Checks if the given value is a valid analytics label."""
        value = _Validators.check_string(label, value)
        if value is not None and not re.match(r'^[a-zA-Z0-9-_.~%]{1,50}$', value):
            raise ValueError('Malformed {}.'.format(label))
        return value

    @classmethod
    def check_boolean(cls, label, value):
        """Checks if the given value is boolean."""
        if value is None:
            return None
        if not isinstance(value, bool):
            raise ValueError('{0} must be a boolean.'.format(label))
        return value

    @classmethod
    def check_datetime(cls, label, value):
        """Checks if the given value is a datetime."""
        if value is None:
            return None
        if not isinstance(value, datetime.datetime):
            raise ValueError('{0} must be a datetime.'.format(label))
        return value


class MessageEncoder(json.JSONEncoder):
    """A custom ``JSONEncoder`` implementation for serializing Message instances into JSON."""

    @classmethod
    def remove_null_values(cls, dict_value):
        return {k: v for k, v in dict_value.items() if v not in [None, [], {}]}

    @classmethod
    def encode_android(cls, android):
        """Encodes an ``AndroidConfig`` instance into JSON."""
        if android is None:
            return None
        if not isinstance(android, _messaging_utils.AndroidConfig):
            raise ValueError('Message.android must be an instance of AndroidConfig class.')
        result = {
            'collapse_key': _Validators.check_string(
                'AndroidConfig.collapse_key', android.collapse_key),
            'data': _Validators.check_string_dict(
                'AndroidConfig.data', android.data),
            'notification': cls.encode_android_notification(android.notification),
            'priority': _Validators.check_string(
                'AndroidConfig.priority', android.priority, non_empty=True),
            'restricted_package_name': _Validators.check_string(
                'AndroidConfig.restricted_package_name', android.restricted_package_name),
            'ttl': cls.encode_ttl(android.ttl),
            'fcm_options': cls.encode_android_fcm_options(android.fcm_options),
            'direct_boot_ok': _Validators.check_boolean(
                'AndroidConfig.direct_boot_ok', android.direct_boot_ok),
        }
        result = cls.remove_null_values(result)
        priority = result.get('priority')
        if priority and priority not in ('high', 'normal'):
            raise ValueError('AndroidConfig.priority must be "high" or "normal".')
        return result

    @classmethod
    def encode_android_fcm_options(cls, fcm_options):
        """Encodes an ``AndroidFCMOptions`` instance into JSON."""
        if fcm_options is None:
            return None
        if not isinstance(fcm_options, _messaging_utils.AndroidFCMOptions):
            raise ValueError('AndroidConfig.fcm_options must be an instance of '
                             'AndroidFCMOptions class.')
        result = {
            'analytics_label': _Validators.check_analytics_label(
                'AndroidFCMOptions.analytics_label', fcm_options.analytics_label),
        }
        result = cls.remove_null_values(result)
        return result

    @classmethod
    def encode_ttl(cls, ttl):
        """Encodes an ``AndroidConfig`` ``TTL`` duration into a string."""
        if ttl is None:
            return None
        if isinstance(ttl, numbers.Number):
            ttl = datetime.timedelta(seconds=ttl)
        if not isinstance(ttl, datetime.timedelta):
            raise ValueError('AndroidConfig.ttl must be a duration in seconds or an instance of '
                             'datetime.timedelta.')
        total_seconds = ttl.total_seconds()
        if total_seconds < 0:
            raise ValueError('AndroidConfig.ttl must not be negative.')
        seconds = int(math.floor(total_seconds))
        nanos = int((total_seconds - seconds) * 1e9)
        if nanos:
            return '{0}.{1}s'.format(seconds, str(nanos).zfill(9))
        return '{0}s'.format(seconds)

    @classmethod
    def encode_milliseconds(cls, label, msec):
        """Encodes a duration in milliseconds into a string."""
        if msec is None:
            return None
        if isinstance(msec, numbers.Number):
            msec = datetime.timedelta(milliseconds=msec)
        if not isinstance(msec, datetime.timedelta):
            raise ValueError('{0} must be a duration in milliseconds or an instance of '
                             'datetime.timedelta.'.format(label))
        total_seconds = msec.total_seconds()
        if total_seconds < 0:
            raise ValueError('{0} must not be negative.'.format(label))
        seconds = int(math.floor(total_seconds))
        nanos = int((total_seconds - seconds) * 1e9)
        if nanos:
            return '{0}.{1}s'.format(seconds, str(nanos).zfill(9))
        return '{0}s'.format(seconds)

    @classmethod
    def encode_android_notification(cls, notification):
        """Encodes an ``AndroidNotification`` instance into JSON."""
        if notification is None:
            return None
        if not isinstance(notification, _messaging_utils.AndroidNotification):
            raise ValueError('AndroidConfig.notification must be an instance of '
                             'AndroidNotification class.')
        result = {
            'body': _Validators.check_string(
                'AndroidNotification.body', notification.body),
            'body_loc_args': _Validators.check_string_list(
                'AndroidNotification.body_loc_args', notification.body_loc_args),
            'body_loc_key': _Validators.check_string(
                'AndroidNotification.body_loc_key', notification.body_loc_key),
            'click_action': _Validators.check_string(
                'AndroidNotification.click_action', notification.click_action),
            'color': _Validators.check_string(
                'AndroidNotification.color', notification.color, non_empty=True),
            'icon': _Validators.check_string(
                'AndroidNotification.icon', notification.icon),
            'sound': _Validators.check_string(
                'AndroidNotification.sound', notification.sound),
            'tag': _Validators.check_string(
                'AndroidNotification.tag', notification.tag),
            'title': _Validators.check_string(
                'AndroidNotification.title', notification.title),
            'title_loc_args': _Validators.check_string_list(
                'AndroidNotification.title_loc_args', notification.title_loc_args),
            'title_loc_key': _Validators.check_string(
                'AndroidNotification.title_loc_key', notification.title_loc_key),
            'channel_id': _Validators.check_string(
                'AndroidNotification.channel_id', notification.channel_id),
            'image': _Validators.check_string(
                'image', notification.image),
            'ticker': _Validators.check_string(
                'AndroidNotification.ticker', notification.ticker),
            'sticky': notification.sticky,
            'event_time': _Validators.check_datetime(
                'AndroidNotification.event_timestamp', notification.event_timestamp),
            'local_only': notification.local_only,
            'notification_priority': _Validators.check_string(
                'AndroidNotification.priority', notification.priority, non_empty=True),
            'vibrate_timings': _Validators.check_number_list(
                'AndroidNotification.vibrate_timings_millis', notification.vibrate_timings_millis),
            'default_vibrate_timings': notification.default_vibrate_timings,
            'default_sound': notification.default_sound,
            'default_light_settings': notification.default_light_settings,
            'light_settings': cls.encode_light_settings(notification.light_settings),
            'visibility': _Validators.check_string(
                'AndroidNotification.visibility', notification.visibility, non_empty=True),
            'notification_count': _Validators.check_number(
                'AndroidNotification.notification_count', notification.notification_count),
            'proxy': _Validators.check_string(
                'AndroidNotification.proxy', notification.proxy, non_empty=True)
        }
        result = cls.remove_null_values(result)
        color = result.get('color')
        if color and not re.match(r'^#[0-9a-fA-F]{6}$', color):
            raise ValueError(
                'AndroidNotification.color must be in the form #RRGGBB.')
        if result.get('body_loc_args') and not result.get('body_loc_key'):
            raise ValueError(
                'AndroidNotification.body_loc_key is required when specifying body_loc_args.')
        if result.get('title_loc_args') and not result.get('title_loc_key'):
            raise ValueError(
                'AndroidNotification.title_loc_key is required when specifying title_loc_args.')

        event_time = result.get('event_time')
        if event_time:
            # if the datetime instance is not naive (tzinfo is present), convert to UTC
            # otherwise (tzinfo is None) assume the datetime instance is already in UTC
            if event_time.tzinfo is not None:
                event_time = event_time.astimezone(datetime.timezone.utc)
            result['event_time'] = event_time.strftime('%Y-%m-%dT%H:%M:%S.%fZ')

        priority = result.get('notification_priority')
        if priority:
            if priority not in ('min', 'low', 'default', 'high', 'max'):
                raise ValueError('AndroidNotification.priority must be "default", "min", "low", '
                                 '"high" or "max".')
            result['notification_priority'] = 'PRIORITY_' + priority.upper()

        visibility = result.get('visibility')
        if visibility:
            if visibility not in ('private', 'public', 'secret'):
                raise ValueError(
                    'AndroidNotification.visibility must be "private", "public" or "secret".')
            result['visibility'] = visibility.upper()

        vibrate_timings_millis = result.get('vibrate_timings')
        if vibrate_timings_millis:
            vibrate_timing_strings = []
            for msec in vibrate_timings_millis:
                formated_string = cls.encode_milliseconds(
                    'AndroidNotification.vibrate_timings_millis', msec)
                vibrate_timing_strings.append(formated_string)
            result['vibrate_timings'] = vibrate_timing_strings

        proxy = result.get('proxy')
        if proxy:
            if proxy not in ('allow', 'deny', 'if_priority_lowered'):
                raise ValueError(
                    'AndroidNotification.proxy must be "allow", "deny" or "if_priority_lowered".')
            result['proxy'] = proxy.upper()
        return result

    @classmethod
    def encode_light_settings(cls, light_settings):
        """Encodes a ``LightSettings`` instance into JSON."""
        if light_settings is None:
            return None
        if not isinstance(light_settings, _messaging_utils.LightSettings):
            raise ValueError(
                'AndroidNotification.light_settings must be an instance of LightSettings class.')
        result = {
            'color': _Validators.check_string(
                'LightSettings.color', light_settings.color, non_empty=True),
            'light_on_duration': cls.encode_milliseconds(
                'LightSettings.light_on_duration_millis', light_settings.light_on_duration_millis),
            'light_off_duration': cls.encode_milliseconds(
                'LightSettings.light_off_duration_millis',
                light_settings.light_off_duration_millis),
        }
        result = cls.remove_null_values(result)
        light_on_duration = result.get('light_on_duration')
        if not light_on_duration:
            raise ValueError(
                'LightSettings.light_on_duration_millis is required.')

        light_off_duration = result.get('light_off_duration')
        if not light_off_duration:
            raise ValueError(
                'LightSettings.light_off_duration_millis is required.')

        color = result.get('color')
        if not color:
            raise ValueError('LightSettings.color is required.')
        if not re.match(r'^#[0-9a-fA-F]{6}$', color) and not re.match(r'^#[0-9a-fA-F]{8}$', color):
            raise ValueError(
                'LightSettings.color must be in the form #RRGGBB or #RRGGBBAA.')
        if len(color) == 7:
            color = (color+'FF')
        rgba = [int(color[i:i + 2], 16) / 255.0 for i in (1, 3, 5, 7)]
        result['color'] = {'red': rgba[0], 'green': rgba[1],
                           'blue': rgba[2], 'alpha': rgba[3]}
        return result

    @classmethod
    def encode_webpush(cls, webpush):
        """Encodes a ``WebpushConfig`` instance into JSON."""
        if webpush is None:
            return None
        if not isinstance(webpush, _messaging_utils.WebpushConfig):
            raise ValueError('Message.webpush must be an instance of WebpushConfig class.')
        result = {
            'data': _Validators.check_string_dict(
                'WebpushConfig.data', webpush.data),
            'headers': _Validators.check_string_dict(
                'WebpushConfig.headers', webpush.headers),
            'notification': cls.encode_webpush_notification(webpush.notification),
            'fcm_options': cls.encode_webpush_fcm_options(webpush.fcm_options),
        }
        return cls.remove_null_values(result)

    @classmethod
    def encode_webpush_notification(cls, notification):
        """Encodes a ``WebpushNotification`` instance into JSON."""
        if notification is None:
            return None
        if not isinstance(notification, _messaging_utils.WebpushNotification):
            raise ValueError('WebpushConfig.notification must be an instance of '
                             'WebpushNotification class.')
        result = {
            'actions': cls.encode_webpush_notification_actions(notification.actions),
            'badge': _Validators.check_string(
                'WebpushNotification.badge', notification.badge),
            'body': _Validators.check_string(
                'WebpushNotification.body', notification.body),
            'data': notification.data,
            'dir': _Validators.check_string(
                'WebpushNotification.direction', notification.direction),
            'icon': _Validators.check_string(
                'WebpushNotification.icon', notification.icon),
            'image': _Validators.check_string(
                'WebpushNotification.image', notification.image),
            'lang': _Validators.check_string(
                'WebpushNotification.language', notification.language),
            'renotify': notification.renotify,
            'requireInteraction': notification.require_interaction,
            'silent': notification.silent,
            'tag': _Validators.check_string(
                'WebpushNotification.tag', notification.tag),
            'timestamp': _Validators.check_number(
                'WebpushNotification.timestamp_millis', notification.timestamp_millis),
            'title': _Validators.check_string(
                'WebpushNotification.title', notification.title),
            'vibrate': notification.vibrate,
        }
        direction = result.get('dir')
        if direction and direction not in ('auto', 'ltr', 'rtl'):
            raise ValueError('WebpushNotification.direction must be "auto", "ltr" or "rtl".')
        if notification.custom_data is not None:
            if not isinstance(notification.custom_data, dict):
                raise ValueError('WebpushNotification.custom_data must be a dict.')
            for key, value in notification.custom_data.items():
                if key in result:
                    raise ValueError(
                        'Multiple specifications for {0} in WebpushNotification.'.format(key))
                result[key] = value
        return cls.remove_null_values(result)

    @classmethod
    def encode_webpush_notification_actions(cls, actions):
        """Encodes a list of ``WebpushNotificationActions`` into JSON."""
        if actions is None:
            return None
        if not isinstance(actions, list):
            raise ValueError('WebpushConfig.notification.actions must be a list of '
                             'WebpushNotificationAction instances.')
        results = []
        for action in actions:
            if not isinstance(action, _messaging_utils.WebpushNotificationAction):
                raise ValueError('WebpushConfig.notification.actions must be a list of '
                                 'WebpushNotificationAction instances.')
            result = {
                'action': _Validators.check_string(
                    'WebpushNotificationAction.action', action.action),
                'title': _Validators.check_string(
                    'WebpushNotificationAction.title', action.title),
                'icon': _Validators.check_string(
                    'WebpushNotificationAction.icon', action.icon),
            }
            results.append(cls.remove_null_values(result))
        return results

    @classmethod
    def encode_webpush_fcm_options(cls, options):
        """Encodes a ``WebpushFCMOptions`` instance into JSON."""
        if options is None:
            return None
        result = {
            'link': _Validators.check_string('WebpushConfig.fcm_options.link', options.link),
        }
        result = cls.remove_null_values(result)
        link = result.get('link')
        if link is not None and not link.startswith('https://'):
            raise ValueError('WebpushFCMOptions.link must be a HTTPS URL.')
        return result

    @classmethod
    def encode_apns(cls, apns):
        """Encodes an ``APNSConfig`` instance into JSON."""
        if apns is None:
            return None
        if not isinstance(apns, _messaging_utils.APNSConfig):
            raise ValueError('Message.apns must be an instance of APNSConfig class.')
        result = {
            'headers': _Validators.check_string_dict(
                'APNSConfig.headers', apns.headers),
            'payload': cls.encode_apns_payload(apns.payload),
            'fcm_options': cls.encode_apns_fcm_options(apns.fcm_options),
            'live_activity_token': _Validators.check_string(
                'APNSConfig.live_activity_token', apns.live_activity_token),
        }
        return cls.remove_null_values(result)

    @classmethod
    def encode_apns_payload(cls, payload):
        """Encodes an ``APNSPayload`` instance into JSON."""
        if payload is None:
            return None
        if not isinstance(payload, _messaging_utils.APNSPayload):
            raise ValueError('APNSConfig.payload must be an instance of APNSPayload class.')
        result = {
            'aps': cls.encode_aps(payload.aps)
        }
        for key, value in payload.custom_data.items():
            result[key] = value
        return cls.remove_null_values(result)

    @classmethod
    def encode_apns_fcm_options(cls, fcm_options):
        """Encodes an ``APNSFCMOptions`` instance into JSON."""
        if fcm_options is None:
            return None
        if not isinstance(fcm_options, _messaging_utils.APNSFCMOptions):
            raise ValueError('APNSConfig.fcm_options must be an instance of APNSFCMOptions class.')
        result = {
            'analytics_label': _Validators.check_analytics_label(
                'APNSFCMOptions.analytics_label', fcm_options.analytics_label),
            'image': _Validators.check_string('APNSFCMOptions.image', fcm_options.image)
        }
        result = cls.remove_null_values(result)
        return result

    @classmethod
    def encode_aps(cls, aps):
        """Encodes an ``Aps`` instance into JSON."""
        if not isinstance(aps, _messaging_utils.Aps):
            raise ValueError('APNSPayload.aps must be an instance of Aps class.')
        result = {
            'alert': cls.encode_aps_alert(aps.alert),
            'badge': _Validators.check_number('Aps.badge', aps.badge),
            'sound': cls.encode_aps_sound(aps.sound),
            'category': _Validators.check_string('Aps.category', aps.category),
            'thread-id': _Validators.check_string('Aps.thread_id', aps.thread_id),
        }
        if aps.content_available is True:
            result['content-available'] = 1
        if aps.mutable_content is True:
            result['mutable-content'] = 1
        if aps.custom_data is not None:
            if not isinstance(aps.custom_data, dict):
                raise ValueError('Aps.custom_data must be a dict.')
            for key, val in aps.custom_data.items():
                _Validators.check_string('Aps.custom_data key', key)
                if key in result:
                    raise ValueError('Multiple specifications for {0} in Aps.'.format(key))
                result[key] = val
        return cls.remove_null_values(result)

    @classmethod
    def encode_aps_sound(cls, sound):
        """Encodes an APNs sound configuration into JSON."""
        if sound is None:
            return None
        if sound and isinstance(sound, str):
            return sound
        if not isinstance(sound, _messaging_utils.CriticalSound):
            raise ValueError(
                'Aps.sound must be a non-empty string or an instance of CriticalSound class.')
        result = {
            'name': _Validators.check_string('CriticalSound.name', sound.name, non_empty=True),
            'volume': _Validators.check_number('CriticalSound.volume', sound.volume),
        }
        if sound.critical:
            result['critical'] = 1
        if not result['name']:
            raise ValueError('CriticalSond.name must be a non-empty string.')
        volume = result['volume']
        if volume is not None and (volume < 0 or volume > 1):
            raise ValueError('CriticalSound.volume must be in the interval [0,1].')
        return cls.remove_null_values(result)

    @classmethod
    def encode_aps_alert(cls, alert):
        """Encodes an ``ApsAlert`` instance into JSON."""
        if alert is None:
            return None
        if isinstance(alert, str):
            return alert
        if not isinstance(alert, _messaging_utils.ApsAlert):
            raise ValueError('Aps.alert must be a string or an instance of ApsAlert class.')
        result = {
            'title': _Validators.check_string('ApsAlert.title', alert.title),
            'subtitle': _Validators.check_string('ApsAlert.subtitle', alert.subtitle),
            'body': _Validators.check_string('ApsAlert.body', alert.body),
            'title-loc-key': _Validators.check_string(
                'ApsAlert.title_loc_key', alert.title_loc_key),
            'title-loc-args': _Validators.check_string_list(
                'ApsAlert.title_loc_args', alert.title_loc_args),
            'loc-key': _Validators.check_string(
                'ApsAlert.loc_key', alert.loc_key),
            'loc-args': _Validators.check_string_list(
                'ApsAlert.loc_args', alert.loc_args),
            'action-loc-key': _Validators.check_string(
                'ApsAlert.action_loc_key', alert.action_loc_key),
            'launch-image': _Validators.check_string(
                'ApsAlert.launch_image', alert.launch_image),
        }
        if result.get('loc-args') and not result.get('loc-key'):
            raise ValueError(
                'ApsAlert.loc_key is required when specifying loc_args.')
        if result.get('title-loc-args') and not result.get('title-loc-key'):
            raise ValueError(
                'ApsAlert.title_loc_key is required when specifying title_loc_args.')
        if alert.custom_data is not None:
            if not isinstance(alert.custom_data, dict):
                raise ValueError('ApsAlert.custom_data must be a dict.')
            for key, val in alert.custom_data.items():
                _Validators.check_string('ApsAlert.custom_data key', key)
                # allow specifying key override because Apple could update API so that key
                # could have unexpected value type
                result[key] = val
        return cls.remove_null_values(result)

    @classmethod
    def encode_notification(cls, notification):
        """Encodes a ``Notification`` instance into JSON."""
        if notification is None:
            return None
        if not isinstance(notification, _messaging_utils.Notification):
            raise ValueError('Message.notification must be an instance of Notification class.')
        result = {
            'body': _Validators.check_string('Notification.body', notification.body),
            'title': _Validators.check_string('Notification.title', notification.title),
            'image': _Validators.check_string('Notification.image', notification.image)
        }
        return cls.remove_null_values(result)

    @classmethod
    def sanitize_topic_name(cls, topic):
        """Removes the /topics/ prefix from the topic name, if present."""
        if not topic:
            return None
        prefix = '/topics/'
        if topic.startswith(prefix):
            topic = topic[len(prefix):]
        # Checks for illegal characters and empty string.
        if not re.match(r'^[a-zA-Z0-9-_\.~%]+$', topic):
            raise ValueError('Malformed topic name.')
        return topic

    def default(self, o): # pylint: disable=method-hidden
        if not isinstance(o, Message):
            return json.JSONEncoder.default(self, o)
        result = {
            'android': MessageEncoder.encode_android(o.android),
            'apns': MessageEncoder.encode_apns(o.apns),
            'condition': _Validators.check_string(
                'Message.condition', o.condition, non_empty=True),
            'data': _Validators.check_string_dict('Message.data', o.data),
            'notification': MessageEncoder.encode_notification(o.notification),
            'token': _Validators.check_string('Message.token', o.token, non_empty=True),
            'topic': _Validators.check_string('Message.topic', o.topic, non_empty=True),
            'webpush': MessageEncoder.encode_webpush(o.webpush),
            'fcm_options': MessageEncoder.encode_fcm_options(o.fcm_options),
        }
        result['topic'] = MessageEncoder.sanitize_topic_name(result.get('topic'))
        result = MessageEncoder.remove_null_values(result)
        target_count = sum([t in result for t in ['token', 'topic', 'condition']])
        if target_count != 1:
            raise ValueError('Exactly one of token, topic or condition must be specified.')
        return result

    @classmethod
    def encode_fcm_options(cls, fcm_options):
        """Encodes an ``FCMOptions`` instance into JSON."""
        if fcm_options is None:
            return None
        if not isinstance(fcm_options, _messaging_utils.FCMOptions):
            raise ValueError('Message.fcm_options must be an instance of FCMOptions class.')
        result = {
            'analytics_label': _Validators.check_analytics_label(
                'FCMOptions.analytics_label', fcm_options.analytics_label),
        }
        result = cls.remove_null_values(result)
        return result
