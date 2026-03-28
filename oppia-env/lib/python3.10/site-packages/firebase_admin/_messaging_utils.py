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

"""Types and utilities used by the messaging (FCM) module."""

from firebase_admin import exceptions


class Notification:
    """A notification that can be included in a message.

    Args:
        title: Title of the notification (optional).
        body: Body of the notification (optional).
        image: Image url of the notification (optional)
    """

    def __init__(self, title=None, body=None, image=None):
        self.title = title
        self.body = body
        self.image = image


class AndroidConfig:
    """Android-specific options that can be included in a message.

    Args:
        collapse_key: Collapse key string for the message (optional). This is an identifier for a
            group of messages that can be collapsed, so that only the last message is sent when
            delivery can be resumed. A maximum of 4 different collapse keys may be active at a
            given time.
        priority: Priority of the message (optional). Must be one of ``high`` or ``normal``.
        ttl: The time-to-live duration of the message (optional). This can be specified
            as a numeric seconds value or a ``datetime.timedelta`` instance.
        restricted_package_name: The package name of the application where the registration tokens
            must match in order to receive the message (optional).
        data: A dictionary of data fields (optional). All keys and values in the dictionary must be
            strings. When specified, overrides any data fields set via ``Message.data``.
        notification: A ``messaging.AndroidNotification`` to be included in the message (optional).
        fcm_options: A ``messaging.AndroidFCMOptions`` to be included in the message (optional).
        direct_boot_ok: A boolean indicating whether messages will be allowed to be delivered to
            the app while the device is in direct boot mode (optional).
    """

    def __init__(self, collapse_key=None, priority=None, ttl=None, restricted_package_name=None,
                 data=None, notification=None, fcm_options=None, direct_boot_ok=None):
        self.collapse_key = collapse_key
        self.priority = priority
        self.ttl = ttl
        self.restricted_package_name = restricted_package_name
        self.data = data
        self.notification = notification
        self.fcm_options = fcm_options
        self.direct_boot_ok = direct_boot_ok


class AndroidNotification:
    """Android-specific notification parameters.

    Args:
        title: Title of the notification (optional). If specified, overrides the title set via
            ``messaging.Notification``.
        body: Body of the notification (optional). If specified, overrides the body set via
            ``messaging.Notification``.
        icon: Icon of the notification (optional).
        color: Color of the notification icon expressed in ``#rrggbb`` form (optional).
        sound: Sound to be played when the device receives the notification (optional). This is
            usually the file name of the sound resource.
        tag: Tag of the notification (optional). This is an identifier used to replace existing
            notifications in the notification drawer. If not specified, each request creates a new
            notification.
        click_action: The action associated with a user click on the notification (optional). If
            specified, an activity with a matching intent filter is launched when a user clicks on
            the notification.
        body_loc_key: Key of the body string in the app's string resources to use to localize the
            body text (optional).
        body_loc_args: A list of resource keys that will be used in place of the format specifiers
            in ``body_loc_key`` (optional).
        title_loc_key: Key of the title string in the app's string resources to use to localize the
            title text (optional).
        title_loc_args: A list of resource keys that will be used in place of the format specifiers
            in ``title_loc_key`` (optional).
        channel_id: channel_id of the notification (optional).
        image: Image url of the notification (optional).
        ticker: Sets the ``ticker`` text, which is sent to accessibility services. Prior to API
            level 21 (Lollipop), sets the text that is displayed in the status bar when the
            notification first arrives (optional).
        sticky: When set to ``False`` or unset, the notification is automatically dismissed when the
            user clicks it in the panel. When set to ``True``, the notification persists even when
            the user clicks it (optional).
        event_timestamp: For notifications that inform users about events with an absolute time
            reference, sets the time that the event in the notification occurred as a
            ``datetime.datetime`` instance. If the ``datetime.datetime`` instance is naive, it
            defaults to be in the UTC timezone. Notifications in the panel are sorted by this time
            (optional).
        local_only: Sets whether or not this notification is relevant only to the current device.
            Some notifications can be bridged to other devices for remote display, such as a Wear OS
            watch. This hint can be set to recommend this notification not be bridged (optional).
            See Wear OS guides:
            https://developer.android.com/training/wearables/notifications/bridger#existing-method-of-preventing-bridging
        priority: Sets the relative priority for this notification. Low-priority notifications may
            be hidden from the user in certain situations. Note this priority differs from
            ``AndroidMessagePriority``. This priority is processed by the client after the message
            has been delivered. Whereas ``AndroidMessagePriority`` is an FCM concept that controls
            when the message is delivered (optional). Must be one of ``default``, ``min``, ``low``,
            ``high``, ``max`` or ``normal``.
        vibrate_timings_millis: Sets the vibration pattern to use. Pass in an array of milliseconds
            to turn the vibrator on or off. The first value indicates the duration to wait before
            turning the vibrator on. The next value indicates the duration to keep the vibrator on.
            Subsequent values alternate between duration to turn the vibrator off and to turn the
            vibrator on. If ``vibrate_timings`` is set and ``default_vibrate_timings`` is set to
            ``True``, the default value is used instead of the user-specified ``vibrate_timings``.
        default_vibrate_timings: If set to ``True``, use the Android framework's default vibrate
            pattern for the notification (optional). Default values are specified in ``config.xml``
            https://android.googlesource.com/platform/frameworks/base/+/master/core/res/res/values/config.xml.
            If ``default_vibrate_timings`` is set to ``True`` and ``vibrate_timings`` is also set,
            the default value is used instead of the user-specified ``vibrate_timings``.
        default_sound: If set to ``True``, use the Android framework's default sound for the
            notification (optional). Default values are specified in ``config.xml``
            https://android.googlesource.com/platform/frameworks/base/+/master/core/res/res/values/config.xml
        light_settings: Settings to control the notification's LED blinking rate and color if LED is
            available on the device. The total blinking time is controlled by the OS (optional).
        default_light_settings: If set to ``True``, use the Android framework's default LED light
            settings for the notification. Default values are specified in ``config.xml``
            https://android.googlesource.com/platform/frameworks/base/+/master/core/res/res/values/config.xml.
            If ``default_light_settings`` is set to ``True`` and ``light_settings`` is also set, the
            user-specified ``light_settings`` is used instead of the default value.
        visibility: Sets the visibility of the notification. Must be either ``private``, ``public``,
            or ``secret``. If unspecified, it remains undefined in the Admin SDK, and defers to
            the FCM backend's default mapping.
        notification_count: Sets the number of items this notification represents. May be displayed
            as a badge count for Launchers that support badging. See ``NotificationBadge``
            https://developer.android.com/training/notify-user/badges. For example, this might be
            useful if you're using just one notification to represent multiple new messages but you
            want the count here to represent the number of total new messages. If zero or
            unspecified, systems that support badging use the default, which is to increment a
            number displayed on the long-press menu each time a new notification arrives.
        proxy: Sets if the notification may be proxied. Must be one of ``allow``, ``deny``, or
            ``if_priority_lowered``. If unspecified, it remains undefined in the Admin SDK, and
            defers to the FCM backend's default mapping.


    """

    def __init__(self, title=None, body=None, icon=None, color=None, sound=None, tag=None,
                 click_action=None, body_loc_key=None, body_loc_args=None, title_loc_key=None,
                 title_loc_args=None, channel_id=None, image=None, ticker=None, sticky=None,
                 event_timestamp=None, local_only=None, priority=None, vibrate_timings_millis=None,
                 default_vibrate_timings=None, default_sound=None, light_settings=None,
                 default_light_settings=None, visibility=None, notification_count=None,
                 proxy=None):
        self.title = title
        self.body = body
        self.icon = icon
        self.color = color
        self.sound = sound
        self.tag = tag
        self.click_action = click_action
        self.body_loc_key = body_loc_key
        self.body_loc_args = body_loc_args
        self.title_loc_key = title_loc_key
        self.title_loc_args = title_loc_args
        self.channel_id = channel_id
        self.image = image
        self.ticker = ticker
        self.sticky = sticky
        self.event_timestamp = event_timestamp
        self.local_only = local_only
        self.priority = priority
        self.vibrate_timings_millis = vibrate_timings_millis
        self.default_vibrate_timings = default_vibrate_timings
        self.default_sound = default_sound
        self.light_settings = light_settings
        self.default_light_settings = default_light_settings
        self.visibility = visibility
        self.notification_count = notification_count
        self.proxy = proxy


class LightSettings:
    """Represents settings to control notification LED that can be included in a
    ``messaging.AndroidNotification``.

    Args:
        color: Sets the color of the LED in ``#rrggbb`` or ``#rrggbbaa`` format.
        light_on_duration_millis: Along with ``light_off_duration``, defines the blink rate of LED
            flashes.
        light_off_duration_millis: Along with ``light_on_duration``, defines the blink rate of LED
            flashes.
    """
    def __init__(self, color, light_on_duration_millis,
                 light_off_duration_millis):
        self.color = color
        self.light_on_duration_millis = light_on_duration_millis
        self.light_off_duration_millis = light_off_duration_millis


class AndroidFCMOptions:
    """Options for features provided by the FCM SDK for Android.

    Args:
        analytics_label: contains additional options for features provided by the FCM Android SDK
            (optional).
    """

    def __init__(self, analytics_label=None):
        self.analytics_label = analytics_label


class WebpushConfig:
    """Webpush-specific options that can be included in a message.

    Args:
        headers: A dictionary of headers (optional). Refer `Webpush Specification`_ for supported
            headers.
        data: A dictionary of data fields (optional). All keys and values in the dictionary must be
            strings. When specified, overrides any data fields set via ``Message.data``.
        notification: A ``messaging.WebpushNotification`` to be included in the message (optional).
        fcm_options: A ``messaging.WebpushFCMOptions`` instance to be included in the message
            (optional).

    .. _Webpush Specification: https://tools.ietf.org/html/rfc8030#section-5
    """

    def __init__(self, headers=None, data=None, notification=None, fcm_options=None):
        self.headers = headers
        self.data = data
        self.notification = notification
        self.fcm_options = fcm_options


class WebpushNotificationAction:
    """An action available to the users when the notification is presented.

    Args:
        action: Action string.
        title: Title string.
        icon: Icon URL for the action (optional).
    """

    def __init__(self, action, title, icon=None):
        self.action = action
        self.title = title
        self.icon = icon


class WebpushNotification:
    """Webpush-specific notification parameters.

    Refer to the `Notification Reference`_ for more information.

    Args:
        title: Title of the notification (optional). If specified, overrides the title set via
            ``messaging.Notification``.
        body: Body of the notification (optional). If specified, overrides the body set via
            ``messaging.Notification``.
        icon: Icon URL of the notification (optional).
        actions: A list of ``messaging.WebpushNotificationAction`` instances (optional).
        badge: URL of the image used to represent the notification when there is
            not enough space to display the notification itself (optional).
        data: Any arbitrary JSON data that should be associated with the notification (optional).
        direction: The direction in which to display the notification (optional). Must be either
            'auto', 'ltr' or 'rtl'.
        image: The URL of an image to be displayed in the notification (optional).
        language: Notification language (optional).
        renotify: A boolean indicating whether the user should be notified after a new
            notification replaces an old one (optional).
        require_interaction: A boolean indicating whether a notification should remain active
            until the user clicks or dismisses it, rather than closing automatically (optional).
        silent: ``True`` to indicate that the notification should be silent (optional).
        tag: An identifying tag on the notification (optional).
        timestamp_millis: A timestamp value in milliseconds on the notification (optional).
        vibrate: A vibration pattern for the device's vibration hardware to emit when the
            notification fires (optional). The pattern is specified as an integer array.
        custom_data: A dict of custom key-value pairs to be included in the notification
            (optional)

    .. _Notification Reference: https://developer.mozilla.org/en-US/docs/Web/API\
        /notification/Notification
    """

    def __init__(self, title=None, body=None, icon=None, actions=None, badge=None, data=None,
                 direction=None, image=None, language=None, renotify=None,
                 require_interaction=None, silent=None, tag=None, timestamp_millis=None,
                 vibrate=None, custom_data=None):
        self.title = title
        self.body = body
        self.icon = icon
        self.actions = actions
        self.badge = badge
        self.data = data
        self.direction = direction
        self.image = image
        self.language = language
        self.renotify = renotify
        self.require_interaction = require_interaction
        self.silent = silent
        self.tag = tag
        self.timestamp_millis = timestamp_millis
        self.vibrate = vibrate
        self.custom_data = custom_data


class WebpushFCMOptions:
    """Options for features provided by the FCM SDK for Web.

    Args:
        link: The link to open when the user clicks on the notification. Must be an HTTPS URL
            (optional).
    """

    def __init__(self, link=None):
        self.link = link


class APNSConfig:
    """APNS-specific options that can be included in a message.

    Refer to `APNS Documentation`_ for more information.

    Args:
        headers: A dictionary of headers (optional).
        payload: A ``messaging.APNSPayload`` to be included in the message (optional).
        fcm_options: A ``messaging.APNSFCMOptions`` instance to be included in the message
            (optional).
        live_activity_token: A live activity token string (optional).

    .. _APNS Documentation: https://developer.apple.com/library/content/documentation\
        /NetworkingInternet/Conceptual/RemoteNotificationsPG/CommunicatingwithAPNs.html
    """

    def __init__(self, headers=None, payload=None, fcm_options=None, live_activity_token=None):
        self.headers = headers
        self.payload = payload
        self.fcm_options = fcm_options
        self.live_activity_token = live_activity_token


class APNSPayload:
    """Payload of an APNS message.

    Args:
        aps: A ``messaging.Aps`` instance to be included in the payload.
        **kwargs: Arbitrary keyword arguments to be included as custom fields in the payload
            (optional).
    """

    def __init__(self, aps, **kwargs):
        self.aps = aps
        self.custom_data = kwargs


class Aps:
    """Aps dictionary to be included in an APNS payload.

    Args:
        alert: A string or a ``messaging.ApsAlert`` instance (optional).
        badge: A number representing the badge to be displayed with the message (optional).
        sound: Name of the sound file to be played with the message or a
            ``messaging.CriticalSound`` instance (optional).
        content_available: A boolean indicating whether to configure a background update
            notification (optional).
        category: String identifier representing the message type (optional).
        thread_id: An app-specific string identifier for grouping messages (optional).
        mutable_content: A boolean indicating whether to support mutating notifications at
            the client using app extensions (optional).
        custom_data: A dict of custom key-value pairs to be included in the Aps dictionary
            (optional).
    """

    def __init__(self, alert=None, badge=None, sound=None, content_available=None, category=None,
                 thread_id=None, mutable_content=None, custom_data=None):
        self.alert = alert
        self.badge = badge
        self.sound = sound
        self.content_available = content_available
        self.category = category
        self.thread_id = thread_id
        self.mutable_content = mutable_content
        self.custom_data = custom_data


class CriticalSound:
    """Critical alert sound configuration that can be included in ``messaging.Aps``.

    Args:
        name: The name of a sound file in your app's main bundle or in the ``Library/Sounds``
            folder of your app's container directory. Specify the string ``default`` to play the
            system sound.
        critical: Set to ``True`` to set the critical alert flag on the sound configuration
            (optional).
        volume: The volume for the critical alert's sound. Must be a value between 0.0 (silent)
            and 1.0 (full volume) (optional).
    """

    def __init__(self, name, critical=None, volume=None):
        self.name = name
        self.critical = critical
        self.volume = volume


class ApsAlert:
    """An alert that can be included in ``messaging.Aps``.

    Args:
        title: Title of the alert (optional). If specified, overrides the title set via
            ``messaging.Notification``.
        subtitle: Subtitle of the alert (optional).
        body: Body of the alert (optional). If specified, overrides the body set via
            ``messaging.Notification``.
        loc_key: Key of the body string in the app's string resources to use to localize the
            body text (optional).
        loc_args: A list of resource keys that will be used in place of the format specifiers
            in ``loc_key`` (optional).
        title_loc_key: Key of the title string in the app's string resources to use to localize the
            title text (optional).
        title_loc_args: A list of resource keys that will be used in place of the format specifiers
            in ``title_loc_key`` (optional).
        action_loc_key: Key of the text in the app's string resources to use to localize the
            action button text (optional).
        launch_image: Image for the notification action (optional).
        custom_data: A dict of custom key-value pairs to be included in the ApsAlert dictionary
            (optional)
    """

    def __init__(self, title=None, subtitle=None, body=None, loc_key=None, loc_args=None,
                 title_loc_key=None, title_loc_args=None, action_loc_key=None, launch_image=None,
                 custom_data=None):
        self.title = title
        self.subtitle = subtitle
        self.body = body
        self.loc_key = loc_key
        self.loc_args = loc_args
        self.title_loc_key = title_loc_key
        self.title_loc_args = title_loc_args
        self.action_loc_key = action_loc_key
        self.launch_image = launch_image
        self.custom_data = custom_data


class APNSFCMOptions:
    """Options for features provided by the FCM SDK for iOS.

    Args:
        analytics_label: contains additional options for features provided by the FCM iOS SDK
            (optional).
        image: contains the URL of an image that is going to be displayed in a notification
            (optional).
    """

    def __init__(self, analytics_label=None, image=None):
        self.analytics_label = analytics_label
        self.image = image


class FCMOptions:
    """Options for features provided by SDK.

    Args:
        analytics_label: contains additional options to use across all platforms (optional).
    """

    def __init__(self, analytics_label=None):
        self.analytics_label = analytics_label


class ThirdPartyAuthError(exceptions.UnauthenticatedError):
    """APNs certificate or web push auth key was invalid or missing."""

    def __init__(self, message, cause=None, http_response=None):
        exceptions.UnauthenticatedError.__init__(self, message, cause, http_response)


class QuotaExceededError(exceptions.ResourceExhaustedError):
    """Sending limit exceeded for the message target."""

    def __init__(self, message, cause=None, http_response=None):
        exceptions.ResourceExhaustedError.__init__(self, message, cause, http_response)


class SenderIdMismatchError(exceptions.PermissionDeniedError):
    """The authenticated sender ID is different from the sender ID for the registration token."""

    def __init__(self, message, cause=None, http_response=None):
        exceptions.PermissionDeniedError.__init__(self, message, cause, http_response)


class UnregisteredError(exceptions.NotFoundError):
    """App instance was unregistered from FCM.

    This usually means that the token used is no longer valid and a new one must be used."""

    def __init__(self, message, cause=None, http_response=None):
        exceptions.NotFoundError.__init__(self, message, cause, http_response)
