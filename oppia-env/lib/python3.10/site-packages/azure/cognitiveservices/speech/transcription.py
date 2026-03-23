# Copyright (c) Microsoft. All rights reserved.
# See https://aka.ms/csspeech/license for the full license information.
"""
Classes related to conversation transcription.

"""

import ctypes

from .enums import PropertyId
from .audio import (AudioConfig)
from .speech import (
    EventSignal,
    RecognitionResult,
    RecognitionEventArgs,
    Recognizer,
    ResultFuture,
    SpeechConfig,
    CancellationDetails)
from .properties import PropertyCollection
from .interop import _Handle, _c_str, _identity, _sdk_lib, _spx_handle, _call_hr_fn, max_uint32, _unpack_context

from typing import Optional
from . import languageconfig
OptionalStr = Optional[str]


class ConversationTranscriptionResult(RecognitionResult):
    """
    Defines the conversation transcription result.
    """
    def __init__(self, handle: _spx_handle):
        """
        Constructor for internal use.
        """
        super().__init__(handle)
        buffer = ctypes.create_string_buffer(1024 + 1)
        buffer_size = ctypes.c_size_t(1024 + 1)
        _call_hr_fn(fn=_sdk_lib.conversation_transcription_result_get_speaker_id, *[handle, buffer, buffer_size])
        self._speaker_id = buffer.value.decode()

    @property
    def speaker_id(self) -> str:
        """
        Unique speaker id
        """
        return self._speaker_id

    def __str__(self) -> str:
        return u'{}(result_id={}, speaker_id={}, text={}, reason={})'.format(
               type(self).__name__, self.result_id, self.speaker_id, self.text, self.reason)


class ConversationTranscriptionEventArgs(RecognitionEventArgs):
    """
    An object that encapsulates the conversation transcription result.
    """
    def __init__(self, handle: _spx_handle):
        """
        Constructor for internal use.
        """
        super().__init__(handle)
        result_handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.recognizer_recognition_event_get_result, *[handle, ctypes.byref(result_handle)])
        self._result = ConversationTranscriptionResult(result_handle)

    @property
    def result(self) -> ConversationTranscriptionResult:
        """
        Contains the conversation transcription result.
        """
        return self._result

    def __str__(self) -> str:
        return u'{}(session_id={}, result={})'.format(type(self).__name__, self.session_id, self.result)


class ConversationTranscriptionCanceledEventArgs(ConversationTranscriptionEventArgs):
    """
    An object that encapsulates conversation transcription canceled event arguments.
    """
    def __init__(self, handle: _spx_handle):
        """
        Constructor for internal use.
        """
        super().__init__(handle)
        self._cancellation_details = CancellationDetails(self.result)

    @property
    def cancellation_details(self) -> "CancellationDetails":
        """
        The reason why transcription was cancelled.

        Returns `None` if there was no cancellation.
        """
        return self._cancellation_details


class ConversationTranscriber(Recognizer):
    """
    On object that performs conversation transcription operations.
    If you need to specify source language information, please only specify one of these three parameters,
    language, source_language_config or auto_detect_source_language_config.

    :param speech_config: The config for the conversation transcriber
    :param audio_config: The config for the audio input
    :param language: The source language
    :param source_language_config: The source language config
    :param auto_detect_source_language_config: The auto detection source language config
    """

    def __init__(self,
                 speech_config: SpeechConfig,
                 audio_config: Optional[AudioConfig] = None,
                 language: Optional[str] = None,
                 source_language_config: Optional[languageconfig.SourceLanguageConfig] = None,
                 auto_detect_source_language_config: Optional[languageconfig.AutoDetectSourceLanguageConfig] = None):
        if not isinstance(speech_config, SpeechConfig):
            raise ValueError('speech_config must be a SpeechConfig instance')
        languageConfigNum = 0
        if language is not None:
            if language == "":
                raise ValueError('language cannot be an empty string')
            languageConfigNum = languageConfigNum + 1
        if source_language_config is not None:
            languageConfigNum = languageConfigNum + 1
        if auto_detect_source_language_config is not None:
            languageConfigNum = languageConfigNum + 1
        if languageConfigNum > 1:
            raise ValueError('cannot construct ConversationTranscriber with more than one language configurations, '
                             'please only specify one of these three parameters: language, '
                             'source_language_config or auto_detect_source_language_config')
        handle = _spx_handle(0)
        audio_config_handle = audio_config._handle if audio_config is not None else None
        if language is None and source_language_config is None and auto_detect_source_language_config is None:
            _call_hr_fn(
                fn=_sdk_lib.recognizer_create_conversation_transcriber_from_config,
                *[ctypes.byref(handle), speech_config._handle, audio_config_handle])
        elif language is not None:
            source_language_config = languageconfig.SourceLanguageConfig(language)
            _call_hr_fn(
                fn=_sdk_lib.recognizer_create_conversation_transcriber_from_source_lang_config,
                *[ctypes.byref(handle), speech_config._handle, source_language_config._handle, audio_config_handle])
        elif source_language_config is not None:
            _call_hr_fn(
                fn=_sdk_lib.recognizer_create_conversation_transcriber_from_source_lang_config,
                *[ctypes.byref(handle), speech_config._handle, source_language_config._handle, audio_config_handle])
        else:
            # auto_detect_source_language_config must not be None if we arrive this code
            _call_hr_fn(
                fn=_sdk_lib.recognizer_create_conversation_transcriber_from_auto_detect_source_lang_config,
                *[ctypes.byref(handle), speech_config._handle, auto_detect_source_language_config._handle, audio_config_handle])
        super().__init__(handle)

    def __del__(self):
        def clean_signal(signal: EventSignal):
            if signal is not None:
                signal.disconnect_all()
        clean_signal(self.__transcribing_signal)
        clean_signal(self.__transcribed_signal)
        clean_signal(self.__canceled_signal)
        super(type(self), self).__del__()

    def start_transcribing_async(self) -> ResultFuture:
        """
        Asynchronously starts conversation transcribing.

        :returns: A future that is fulfilled once conversation transcription is started.
        """
        async_handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.recognizer_start_continuous_recognition_async, *[self._handle, ctypes.byref(async_handle)])

        def resolve_future(handle: _spx_handle):
            _call_hr_fn(fn=_sdk_lib.recognizer_start_continuous_recognition_async_wait_for, *[handle, max_uint32])
            _sdk_lib.recognizer_async_handle_release(handle)
            return None
        return ResultFuture(async_handle, resolve_future, None)

    def stop_transcribing_async(self) -> ResultFuture:
        """
        Asynchronously stops conversation transcribing.

        :returns: A future that is fulfilled once conversation transcription is stopped.
        """
        async_handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.recognizer_stop_continuous_recognition_async, *[self._handle, ctypes.byref(async_handle)])

        def resolve_future(handle: _spx_handle):
            _call_hr_fn(fn=_sdk_lib.recognizer_stop_continuous_recognition_async_wait_for, *[handle, max_uint32])
            _sdk_lib.recognizer_async_handle_release(handle)
            return None
        return ResultFuture(async_handle, resolve_future, None)

    @property
    def properties(self) -> PropertyCollection:
        """
        A collection of properties and their values defined for this Participant.
        """
        return super().properties

    @property
    def session_started(self) -> EventSignal:
        """
        Signal for events indicating the start of a recognition session (operation).

        Callbacks connected to this signal are called with a :class:`.SessionEventArgs` instance as
        the single argument.
        """
        return super().session_started

    @property
    def session_stopped(self) -> EventSignal:
        """
        Signal for events indicating the end of a recognition session (operation).

        Callbacks connected to this signal are called with a :class:`.SessionEventArgs` instance as
        the single argument.
        """
        return super().session_stopped

    @property
    def speech_start_detected(self) -> EventSignal:
        """
        Signal for events indicating the start of speech.

        Callbacks connected to this signal are called with a :class:`.RecognitionEventArgs`
        instance as the single argument.
        """
        return super().speech_start_detected

    @property
    def speech_end_detected(self) -> EventSignal:
        """
        Signal for events indicating the end of speech.

        Callbacks connected to this signal are called with a :class:`.RecognitionEventArgs`
        instance as the single argument.
        """
        return super().speech_end_detected

    __transcribing_signal = None

    @property
    def transcribing(self) -> EventSignal:
        """
        Signal for events containing intermediate transcription results.

        Callbacks connected to this signal are called with a :class:`.ConversationTranscriptionEventArgs`,
        instance as the single argument.
        """
        def transcribing_connection(signal: EventSignal, handle: _spx_handle):
            callback = ConversationTranscriber.__transcribing_callback if signal.is_connected() else None
            _sdk_lib.recognizer_recognizing_set_callback(handle, callback, signal._context_ptr)
        if self.__transcribing_signal is None:
            self.__transcribing_signal = EventSignal(self, transcribing_connection)
        return self.__transcribing_signal

    @ctypes.CFUNCTYPE(None, _spx_handle, _spx_handle, ctypes.c_void_p)
    def __transcribing_callback(reco_handle: _spx_handle, event_handle: _spx_handle, context: ctypes.c_void_p):
        event_handle = _spx_handle(event_handle)
        obj = _unpack_context(context)
        if obj is not None:
            event = ConversationTranscriptionEventArgs(event_handle)
            obj.__transcribing_signal.signal(event)

    __transcribed_signal = None

    @property
    def transcribed(self) -> EventSignal:
        """
        Signal for events containing final transcription results (indicating a successful
        transcription attempt).

        Callbacks connected to this signal are called with a :class:`.ConversationTranscriptionEventArgs`,
        instance as the single argument.
        """
        def transcribed_connection(signal: EventSignal, handle: _spx_handle):
            callback = ConversationTranscriber.__transcribed_callback if signal.is_connected() else None
            _sdk_lib.recognizer_recognized_set_callback(handle, callback, signal._context_ptr)
        if self.__transcribed_signal is None:
            self.__transcribed_signal = EventSignal(self, transcribed_connection)
        return self.__transcribed_signal

    @ctypes.CFUNCTYPE(None, _spx_handle, _spx_handle, ctypes.c_void_p)
    def __transcribed_callback(reco_handle: _spx_handle, event_handle: _spx_handle, context: ctypes.c_void_p):
        event_handle = _spx_handle(event_handle)
        obj = _unpack_context(context)
        if obj is not None:
            event = ConversationTranscriptionEventArgs(event_handle)
            obj.__transcribed_signal.signal(event)

    __canceled_signal = None

    @property
    def canceled(self) -> EventSignal:
        """
        Signal for events containing canceled transcription results (indicating a transcription attempt
        that was canceled as a result or a direct cancellation request or, alternatively, a
        transport or protocol failure).

        Callbacks connected to this signal are called with a
        :class:`.ConversationTranscriptionCanceledEventArgs`, instance as the single argument.
        """
        def canceled_connection(signal: EventSignal, handle: _spx_handle):
            callback = ConversationTranscriber.__canceled_callback if signal.is_connected() else None
            _sdk_lib.recognizer_canceled_set_callback(handle, callback, signal._context_ptr)
        if self.__canceled_signal is None:
            self.__canceled_signal = EventSignal(self, canceled_connection)
        return self.__canceled_signal

    @ctypes.CFUNCTYPE(None, _spx_handle, _spx_handle, ctypes.c_void_p)
    def __canceled_callback(reco_handle: _spx_handle, event_handle: _spx_handle, context: ctypes.c_void_p):
        event_handle = _spx_handle(event_handle)
        obj = _unpack_context(context)
        if obj is not None:
            event = ConversationTranscriptionCanceledEventArgs(event_handle)
            obj.__canceled_signal.signal(event)

    @property
    def authorization_token(self) -> str:
        """
        The authorization token that will be used for connecting to the service.

        .. note::

          The caller needs to ensure that the authorization token is valid. Before the
          authorization token expires, the caller needs to refresh it by calling this setter with a
          new valid token. As configuration values are copied when creating a new recognizer, the
          new token value will not apply to recognizers that have already been created. For
          recognizers that have been created before, you need to set authorization token of the
          corresponding recognizer to refresh the token. Otherwise, the recognizers will encounter
          errors during transcription.
        """
        return super().authorization_token

    @authorization_token.setter
    def authorization_token(self, authorization_token: str) -> None:
        super().authorization_token = authorization_token


class MeetingTranscriptionResult(RecognitionResult):
    """
    Defines the meeting transcription result.
    """
    def __init__(self, handle: _spx_handle):
        """
        Constructor for internal use.
        """
        super().__init__(handle)
        buffer = ctypes.create_string_buffer(1024 + 1)
        buffer_size = ctypes.c_size_t(1024 + 1)
        _call_hr_fn(fn=_sdk_lib.meeting_transcription_result_get_user_id, *[handle, buffer, buffer_size])
        self._user_id = buffer.value.decode()
        _call_hr_fn(fn=_sdk_lib.meeting_transcription_result_get_utterance_id, *[handle, buffer, buffer_size])
        self._utterance_id = buffer.value.decode()

    @property
    def user_id(self) -> str:
        """
        Unique speaker id
        """
        return self._user_id

    @property
    def utterance_id(self) -> str:
        """
        Unique id that is consistent across all the intermediates and final speech recognition result from one user.
        """
        return self._utterance_id

    def __str__(self) -> str:
        return u'{}(result_id={}, user_id={}, utterance_id={}, text={}, reason={})'.format(
               type(self).__name__, self.result_id, self.user_id, self.utterance_id, self.text, self.reason)


class MeetingTranscriptionEventArgs(RecognitionEventArgs):
    """
    An object that encapsulates the meeting transcription result.
    """
    def __init__(self, handle: _spx_handle):
        """
        Constructor for internal use.
        """
        super().__init__(handle)
        result_handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.recognizer_recognition_event_get_result, *[handle, ctypes.byref(result_handle)])
        self._result = MeetingTranscriptionResult(result_handle)

    @property
    def result(self) -> MeetingTranscriptionResult:
        """
        Contains the meeting transcription result.
        """
        return self._result

    def __str__(self) -> str:
        return u'{}(session_id={}, result={})'.format(type(self).__name__, self.session_id, self.result)


class MeetingTranscriptionCanceledEventArgs(MeetingTranscriptionEventArgs):
    """
    An object that encapsulates meeting transcription canceled event arguments.
    """
    def __init__(self, handle: _spx_handle):
        """
        Constructor for internal use.
        """
        super().__init__(handle)
        self._cancellation_details = CancellationDetails(self.result)

    @property
    def cancellation_details(self) -> "CancellationDetails":
        """
        The reason why transcription was cancelled.

        Returns `None` if there was no cancellation.
        """
        return self._cancellation_details


class Participant():
    """
    An object that represents conversation participant.

    :param user_id: The user identification string.
    :param preferred_language: The preferred language of user in BCP-47 format.
    :param voice_signature: User's voice signature (optional).
    """
    def __init__(self, user_id: str, preferred_language: str, voice_signature: OptionalStr = None):
        handle = _spx_handle(0)
        c_user_id = _c_str(user_id)
        c_language = _c_str(preferred_language)
        c_signature = _c_str(voice_signature)
        _call_hr_fn(fn=_sdk_lib.participant_create_handle, *[ctypes.byref(handle), c_user_id, c_language, c_signature])
        self.__handle = _Handle(handle, None, _sdk_lib.participant_release_handle)

        def try_load_string(fn):
            try:
                length = ctypes.c_uint32(0)
                _call_hr_fn(fn=fn, *[handle, None, ctypes.byref(length)])
                buffer = ctypes.create_string_buffer(length.value)
                _call_hr_fn(fn=fn, *[handle, buffer, ctypes.byref(length)])
                return buffer.value.decode()
            except RuntimeError:
                return ""

        def try_get_bool(fn):
            try:
                c_value = ctypes.c_bool(False)
                _call_hr_fn(fn=fn, *[handle, ctypes.byref(c_value)])
                return c_value.value
            except RuntimeError:
                return False
        self.__id = try_load_string(fn=_sdk_lib.conversation_translator_participant_get_id)
        self.__avatar = try_load_string(fn=_sdk_lib.conversation_translator_participant_get_avatar)
        self.__display_name = try_load_string(fn=_sdk_lib.conversation_translator_participant_get_displayname)
        self.__is_tts = try_get_bool(fn=_sdk_lib.conversation_translator_participant_get_is_using_tts)
        self.__is_muted = try_get_bool(fn=_sdk_lib.conversation_translator_participant_get_is_muted)
        self.__is_host = try_get_bool(fn=_sdk_lib.conversation_translator_participant_get_is_host)
        propbag_handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.participant_get_property_bag, *[handle, ctypes.byref(propbag_handle)])
        self.__properties = PropertyCollection(propbag_handle)

    @property
    def _handle(self):
        return self.__handle.get()

    @property
    def participant_id(self) -> str:
        """
        Get the identifier for the participant.
        """
        return self.__id

    @property
    def avatar(self) -> str:
        """
        Gets the colour of the user's avatar as an HTML hex string (e.g. FF0000 for red).
        """
        return self.__avatar

    @property
    def display_name(self) -> str:
        """
        The participant's display name. Please note that each participant within the same conversation must
        have a different display name. Duplicate names within the same conversation are not allowed. You can
        use the Id property as another way to refer to each participant.
        """
        return self.__display_name

    @property
    def is_using_tts(self) -> bool:
        """
        Gets whether or not the participant is using Text To Speech (TTS).
        """
        return self.__is_tts

    @property
    def is_muted(self) -> bool:
        """
        Gets whether or not the participant is muted.
        """
        return self.__is_muted

    @property
    def is_host(self) -> bool:
        """
        Gets whether or not the participant is the host.
        """
        return self.__is_host

    def set_preferred_language(self, language: str) -> None:
        """
        Sets the preferred language of the participant

        :param language: The language in BCP-47 format.
        """
        c_lang = _c_str(language)
        _call_hr_fn(fn=_sdk_lib.participant_set_preferred_langugage, *[self._handle, c_lang])

    def set_voice_signature(self, signature: str) -> None:
        """
        Sets the voice signature of the participant used for identification.

        :param signature: The language in BCP-47 format.
        """
        c_signature = _c_str(signature)
        _call_hr_fn(fn=_sdk_lib.participant_set_voice_signature, *[self._handle, c_signature])

    @property
    def properties(self) -> PropertyCollection:
        """
        A collection of properties and their values defined for this Participant.
        """
        return self.__properties


class Meeting():
    """
    An object that performs meeting management related operations.

    :param speech_config: The speech configuration.
    :param meeting_id: The meeting identifier.
    """
    def __init__(self, speech_config: SpeechConfig, meeting_id: str):
        if not isinstance(speech_config, SpeechConfig):
            raise ValueError('speech_config must be a SpeechConfig instance')
        if (len(meeting_id) == 0):
            raise ValueError('meeting_id must not be empty')
        handle = _spx_handle(0)
        c_meeting_id = _c_str(meeting_id)
        _call_hr_fn(fn=_sdk_lib.meeting_create_from_config, *[ctypes.byref(handle), speech_config._handle, c_meeting_id])
        self.__handle = _Handle(handle, None, _sdk_lib.meeting_release_handle)
        propbag_handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.meeting_get_property_bag, *[handle, ctypes.byref(propbag_handle)])
        self.__properties = PropertyCollection(propbag_handle)
        buffer = ctypes.create_string_buffer(1024 + 1)
        c_size = ctypes.c_size_t(1024 + 1)
        _call_hr_fn(fn=_sdk_lib.meeting_get_meeting_id, *[handle, buffer, c_size])
        self._meeting_id = buffer.value.decode(encoding='utf-8')

    @property
    def _handle(self):
        return self.__handle.get()

    @property
    def meeting_id(self) -> str:
        """
        Get the meeting id.
        """
        return self._meeting_id

    def add_participant_async(self, participant: Optional[Participant] = None, user_id: OptionalStr = None) -> ResultFuture:
        """
        Asynchronously adds a participant to a meeting using the participant object or user id.+

        .. note::

          The caller needs to ensure that this asynchronous call is completed before starting the meeting.
          This can be done by calling the get function of the returned future.

        :param participant: the participant object
        :param user_id: the user identification string
        :returns: A future containing the added participant object.
        """
        bad_params_error_message = "bad arguments: pass either participant object or user id string "
        if participant is None and user_id is None:
            raise ValueError(bad_params_error_message)
        if participant is not None and user_id is not None:
            raise ValueError(bad_params_error_message)
        if user_id is not None:
            participant = Participant(user_id=user_id)

        def resolve_future(handle: _spx_handle):
            _call_hr_fn(fn=_sdk_lib.meeting_update_participant, *[self._handle, ctypes.c_bool(True), participant._handle])
            return participant
        return ResultFuture(None, resolve_future, _identity)

    def remove_participant_async(self, participant: Optional[Participant] = None, user_id: OptionalStr = None) -> ResultFuture:
        """
        Asynchronously removes a participant from a meeting using the participant object or user id.

        :param participant: the participant object
        :param user_id: the user identification string
        :returns: An empty future.
        """
        bad_params_error_message = "bad arguments: pass either participant object or user id string "
        if participant is None and user_id is None:
            raise ValueError(bad_params_error_message)
        if participant is not None and user_id is not None:
            raise ValueError(bad_params_error_message)

        def resolve_future(handle: _spx_handle):
            c_false = ctypes.c_bool(False)
            if participant is not None:
                _call_hr_fn(fn=_sdk_lib.meeting_update_participant, *[self._handle, c_false, participant._handle])
            elif user_id is not None:
                c_user_id = _c_str(user_id)
                _call_hr_fn(fn=_sdk_lib.meeting_update_participant_by_user_id, *[self._handle, c_false, c_user_id])
        return ResultFuture(None, resolve_future, None)

    def end_meeting_async(self) -> ResultFuture:
        """
        Asynchronously ends the current meeting.

        :returns: A future that is fulfilled once meeting has been ended.
        """
        def resolve_future(handle: _spx_handle):
            _call_hr_fn(fn=_sdk_lib.meeting_end_meeting, *[self._handle])
            return None
        return ResultFuture(None, resolve_future, None)

    def start_meeting_async(self) -> ResultFuture:
        """
        Asynchronously starts meeting.

        :returns: A future that is fulfilled once meeting has been started.
        """
        def resolve_future(handle: _spx_handle):
            _call_hr_fn(fn=_sdk_lib.meeting_start_meeting, *[self._handle])
            return None
        return ResultFuture(None, resolve_future, None)

    def delete_meeting_async(self) -> ResultFuture:
        """
        Asynchronously deletes meeting. Any participants that are still part of the meeting
        will be ejected after this call.

        :returns: A future that is fulfilled once meeting has been deleted.
        """
        def resolve_future(handle: _spx_handle):
            _call_hr_fn(fn=_sdk_lib.meeting_delete_meeting, *[self._handle])
            return None
        return ResultFuture(None, resolve_future, None)

    def lock_meeting_async(self) -> ResultFuture:
        """
        Asynchronously locks meeting. After this no new participants will be able to join.

        :returns: A future that is fulfilled once meeting has been locked.
        """
        def resolve_future(handle: _spx_handle):
            _call_hr_fn(fn=_sdk_lib.meeting_lock_meeting, *[self._handle])
            return None
        return ResultFuture(None, resolve_future, None)

    def unlock_meeting_async(self) -> ResultFuture:
        """
        Asynchronously unlocks meeting.

        :returns: A future that is fulfilled once meeting has been unlocked.
        """
        def resolve_future(handle: _spx_handle):
            _call_hr_fn(fn=_sdk_lib.meeting_unlock_meeting, *[self._handle])
            return None
        return ResultFuture(None, resolve_future, None)

    def mute_all_participants_async(self) -> ResultFuture:
        """
        Asynchronously mutes all participants except for the host. This prevents others from generating
        transcriptions, or sending text messages.

        :returns: A future that is fulfilled once participants have been muted.
        """
        def resolve_future(handle: _spx_handle):
            _call_hr_fn(fn=_sdk_lib.meeting_mute_all_participants, *[self._handle])
            return None
        return ResultFuture(None, resolve_future, None)

    def unmute_all_participants_async(self) -> ResultFuture:
        """
        Asynchronously unmutes all participants, which allows participants to generate
        transcriptions, or send text messages.

        :returns: A future that is fulfilled once participants have been unmuted.
        """
        def resolve_future(handle: _spx_handle):
            _call_hr_fn(fn=_sdk_lib.meeting_unmute_all_participants, *[self._handle])
            return None
        return ResultFuture(None, resolve_future, None)

    def mute_participant_async(self, participant_id: str) -> ResultFuture:
        """
        Asynchronously mutes a particular participant. This will prevent them generating new transcriptions,
        or sending text messages.

        :param participant_id: the participant idnetifier.
        :returns: A future that is fulfilled once participant has been muted.
        """
        def resolve_future(handle: _spx_handle):
            c_participant = _c_str(participant_id)
            _call_hr_fn(fn=_sdk_lib.meeting_mute_participant, *[self._handle, c_participant])
            return None
        return ResultFuture(None, resolve_future, None)

    def unmute_participant_async(self, participant_id: str) -> ResultFuture:
        """
        Asynchronously unmutes a particular participant. This will allow generating new transcriptions,
        or sending text messages.

        :param participant_id: the participant idnetifier.
        :returns: A future that is fulfilled once participant has been muted.
        """
        def resolve_future(handle: _spx_handle):
            c_participant = _c_str(participant_id)
            _call_hr_fn(fn=_sdk_lib.meeting_unmute_participant, *[self._handle, c_participant])
            return None
        return ResultFuture(None, resolve_future, None)

    @property
    def authorization_token(self) -> str:
        """
        The authorization token that will be used for connecting to the service.

        .. note::

          The caller needs to ensure that the authorization token is valid. Before the
          authorization token expires, the caller needs to refresh it by calling this setter with a
          new valid token. As configuration values are copied when creating a new recognizer, the
          new token value will not apply to recognizers that have already been created. For
          recognizers that have been created before, you need to set authorization token of the
          corresponding recognizer to refresh the token. Otherwise, the recognizers will encounter
          errors during transcription.
        """
        return self.properties.get_property(PropertyId.SpeechServiceAuthorization_Token)

    @authorization_token.setter
    def authorization_token(self, authorization_token: str) -> None:
        self.properties.set_property(PropertyId.SpeechServiceAuthorization_Token, authorization_token)

    @property
    def properties(self) -> PropertyCollection:
        """
        A collection of properties and their values defined for this Participant.
        """
        return self.__properties


class MeetingTranscriber(Recognizer):
    """
    On object that performs meeting transcription operations.

    :param audio_config: The configuration for the audio input.
    """

    def __init__(self, audio_config: Optional[AudioConfig] = None):
        handle = _spx_handle(0)
        audio_handle = audio_config._handle if audio_config is not None else None
        _call_hr_fn(fn=_sdk_lib.recognizer_create_meeting_transcriber_from_config, *[ctypes.byref(handle), audio_handle])
        super().__init__(handle)
        self._audio_keep_alive = audio_config

    def __del__(self):
        def clean_signal(signal: EventSignal):
            if signal is not None:
                signal.disconnect_all()
        clean_signal(self.__transcribing_signal)
        clean_signal(self.__transcribed_signal)
        clean_signal(self.__canceled_signal)
        super(type(self), self).__del__()

    def join_meeting_async(self, meeting: Meeting) -> ResultFuture:
        """
        Asynchronously joins a meeting.

        :returns: A future that is fulfilled once joined the meeting.
        """
        def resolve_future(handle: _spx_handle):
            _call_hr_fn(fn=_sdk_lib.recognizer_join_meeting, *[meeting._handle, self._handle])
            None
        return ResultFuture(None, resolve_future, None)

    def leave_meeting_async(self) -> ResultFuture:
        """
        Asynchronously leaves a meeting. After leaving a meeting, no transcribing or transcribed
        events will be sent to end users. End users need to join a meeting to get the events again.

        :returns: A future that is fulfilled once left the meeting.
        """
        def resolve_future(handle: _spx_handle):
            _call_hr_fn(fn=_sdk_lib.recognizer_leave_meeting, *[self._handle])
            None
        return ResultFuture(None, resolve_future, None)

    def start_transcribing_async(self) -> ResultFuture:
        """
        Asynchronously starts meeting transcribing.

        :returns: A future that is fulfilled once meeting transcription is started.
        """
        async_handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.recognizer_start_continuous_recognition_async, *[self._handle, ctypes.byref(async_handle)])

        def resolve_future(handle: _spx_handle):
            print("calling recognizer_start_continuous_recognition_async_wait_for")
            _call_hr_fn(fn=_sdk_lib.recognizer_start_continuous_recognition_async_wait_for, *[handle, max_uint32])
            _sdk_lib.recognizer_async_handle_release(handle)
            return None
        return ResultFuture(async_handle, resolve_future, None)

    def stop_transcribing_async(self) -> ResultFuture:
        """
        Asynchronously stops meeting transcribing.

        :returns: A future that is fulfilled once meeting transcription is stopped.
        """
        async_handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.recognizer_stop_continuous_recognition_async, *[self._handle, ctypes.byref(async_handle)])

        def resolve_future(handle: _spx_handle):
            _call_hr_fn(fn=_sdk_lib.recognizer_stop_continuous_recognition_async_wait_for, *[handle, max_uint32])
            _sdk_lib.recognizer_async_handle_release(handle)
            return None
        return ResultFuture(async_handle, resolve_future, None)

    @property
    def properties(self) -> PropertyCollection:
        """
        A collection of properties and their values defined for this Participant.
        """
        return super().properties

    @property
    def session_started(self) -> EventSignal:
        """
        Signal for events indicating the start of a recognition session (operation).

        Callbacks connected to this signal are called with a :class:`.SessionEventArgs` instance as
        the single argument.
        """
        return super().session_started

    @property
    def session_stopped(self) -> EventSignal:
        """
        Signal for events indicating the end of a recognition session (operation).

        Callbacks connected to this signal are called with a :class:`.SessionEventArgs` instance as
        the single argument.
        """
        return super().session_stopped

    @property
    def speech_start_detected(self) -> EventSignal:
        """
        Signal for events indicating the start of speech.

        Callbacks connected to this signal are called with a :class:`.RecognitionEventArgs`
        instance as the single argument.
        """
        return super().speech_start_detected

    @property
    def speech_end_detected(self) -> EventSignal:
        """
        Signal for events indicating the end of speech.

        Callbacks connected to this signal are called with a :class:`.RecognitionEventArgs`
        instance as the single argument.
        """
        return super().speech_end_detected

    __transcribing_signal = None

    @property
    def transcribing(self) -> EventSignal:
        """
        Signal for events containing intermediate transcription results.

        Callbacks connected to this signal are called with a :class:`.MeetingTranscriptionEventArgs`,
        instance as the single argument.
        """
        def transcribing_connection(signal: EventSignal, handle: _spx_handle):
            callback = MeetingTranscriber.__transcribing_callback if signal.is_connected() else None
            _sdk_lib.recognizer_recognizing_set_callback(handle, callback, signal._context_ptr)
        if self.__transcribing_signal is None:
            self.__transcribing_signal = EventSignal(self, transcribing_connection)
        return self.__transcribing_signal

    @ctypes.CFUNCTYPE(None, _spx_handle, _spx_handle, ctypes.c_void_p)
    def __transcribing_callback(reco_handle: _spx_handle, event_handle: _spx_handle, context: ctypes.c_void_p):
        event_handle = _spx_handle(event_handle)
        obj = _unpack_context(context)
        if obj is not None:
            event = MeetingTranscriptionEventArgs(event_handle)
            obj.__transcribing_signal.signal(event)

    __transcribed_signal = None

    @property
    def transcribed(self) -> EventSignal:
        """
        Signal for events containing final transcription results (indicating a successful
        transcription attempt).

        Callbacks connected to this signal are called with a :class:`.MeetingTranscriptionEventArgs`,
        instance as the single argument.
        """
        def transcribed_connection(signal: EventSignal, handle: _spx_handle):
            callback = MeetingTranscriber.__transcribed_callback if signal.is_connected() else None
            _sdk_lib.recognizer_recognized_set_callback(handle, callback, signal._context_ptr)
        if self.__transcribed_signal is None:
            self.__transcribed_signal = EventSignal(self, transcribed_connection)
        return self.__transcribed_signal

    @ctypes.CFUNCTYPE(None, _spx_handle, _spx_handle, ctypes.c_void_p)
    def __transcribed_callback(reco_handle: _spx_handle, event_handle: _spx_handle, context: ctypes.c_void_p):
        event_handle = _spx_handle(event_handle)
        obj = _unpack_context(context)
        if obj is not None:
            event = MeetingTranscriptionEventArgs(event_handle)
            obj.__transcribed_signal.signal(event)

    __canceled_signal = None

    @property
    def canceled(self) -> EventSignal:
        """
        Signal for events containing canceled transcription results (indicating a transcription attempt
        that was canceled as a result or a direct cancellation request or, alternatively, a
        transport or protocol failure).

        Callbacks connected to this signal are called with a
        :class:`.MeetingTranscriptionCanceledEventArgs`, instance as the single argument.
        """
        def canceled_connection(signal: EventSignal, handle: _spx_handle):
            callback = MeetingTranscriber.__canceled_callback if signal.is_connected() else None
            _sdk_lib.recognizer_canceled_set_callback(handle, callback, signal._context_ptr)
        if self.__canceled_signal is None:
            self.__canceled_signal = EventSignal(self, canceled_connection)
        return self.__canceled_signal

    @ctypes.CFUNCTYPE(None, _spx_handle, _spx_handle, ctypes.c_void_p)
    def __canceled_callback(reco_handle: _spx_handle, event_handle: _spx_handle, context: ctypes.c_void_p):
        event_handle = _spx_handle(event_handle)
        obj = _unpack_context(context)
        if obj is not None:
            event = MeetingTranscriptionCanceledEventArgs(event_handle)
            obj.__canceled_signal.signal(event)

    @property
    def authorization_token(self) -> str:
        """
        The authorization token that will be used for connecting to the service.

        .. note::

          The caller needs to ensure that the authorization token is valid. Before the
          authorization token expires, the caller needs to refresh it by calling this setter with a
          new valid token. As configuration values are copied when creating a new recognizer, the
          new token value will not apply to recognizers that have already been created. For
          recognizers that have been created before, you need to set authorization token of the
          corresponding recognizer to refresh the token. Otherwise, the recognizers will encounter
          errors during transcription.
        """
        return super().authorization_token

    @authorization_token.setter
    def authorization_token(self, authorization_token: str) -> None:
        super().authorization_token = authorization_token
