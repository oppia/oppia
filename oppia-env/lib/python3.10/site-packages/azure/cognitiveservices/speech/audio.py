# Copyright (c) Microsoft. All rights reserved.
# See https://aka.ms/csspeech/license for the full license information.
"""
Classes that are concerned with the handling of audio input to the various recognizers, and audio output from the speech synthesizer.
"""

import ctypes
from enum import Enum

from typing import Optional, Dict

from .interop import _CallbackContext, _Handle, _c_str, _call_hr_fn, _sdk_lib, _spx_handle, _data_ptr, _unpack_context
from .enums import PropertyId
from .properties import PropertyCollection


class AudioStreamContainerFormat(Enum):
    """
    Defines supported audio stream container format.
    """

    OGG_OPUS = 0x101
    """Stream ContainerFormat definition for OGG OPUS."""

    MP3 = 0x102
    """Stream ContainerFormat definition for MP3."""

    FLAC = 0x103
    """Stream ContainerFormat definition for FLAC."""

    ALAW = 0x104
    """Stream ContainerFormat definition for ALAW."""

    MULAW = 0x105
    """Stream ContainerFormat definition for MULAW."""

    AMRNB = 0x106
    """Stream ContainerFormat definition for AMRNB. Currently not supported."""

    AMRWB = 0x107
    """Stream ContainerFormat definition for AMRWB. Currently not supported."""

    ANY = 0x108
    """Stream ContainerFormat definition for any other or unknown format."""


class AudioStreamWaveFormat(Enum):
    """
    Represents the format specified inside WAV container.
    """

    PCM = 0x0001
    """AudioStreamWaveFormat definition for PCM (pulse-code modulated) data in integer format."""

    ALAW = 0x0006
    """AudioStreamWaveFormat definition for A-law-encoded format."""

    MULAW = 0x0007
    """AudioStreamWaveFormat definition for Mu-law-encoded format."""

    G722 = 0x028F
    """AudioStreamWaveFormat definition for G.722-encoded format."""


class AudioStreamFormat():
    """
    Represents specific audio configuration, such as microphone, file, or custom audio streams

    When called without arguments, returns the default `AudioStreamFormat` (16 kHz, 16 bit, mono
    PCM).

    :param samples_per_second: The sample rate for the stream.
    :param bits_per_sample: The number of bits per audio sample
    :param channels: The number of audio channels
    :param compressed_stream_format: The compressed stream format defined in AudioStreamContainerFormat
    :param wave_stream_format: The wave stream format defined in AudioStreamWaveFormat
    """

    def __init__(self, samples_per_second: Optional[int] = None, bits_per_sample: int = 16, channels: int = 1,
                 compressed_stream_format: Optional[AudioStreamContainerFormat] = None,
                 wave_stream_format: AudioStreamWaveFormat = AudioStreamWaveFormat.PCM):
        handle = _spx_handle(0)
        if not samples_per_second and not compressed_stream_format:
            _call_hr_fn(fn=_sdk_lib.audio_stream_format_create_from_default_input, *[ctypes.byref(handle)])
        elif samples_per_second and not compressed_stream_format:
            _call_hr_fn(
                fn=_sdk_lib.audio_stream_format_create_from_waveformat,
                *[ctypes.byref(handle), samples_per_second, bits_per_sample, channels, wave_stream_format.value])
        elif not samples_per_second and compressed_stream_format:
            _call_hr_fn(
                fn=_sdk_lib.audio_stream_format_create_from_compressed_format,
                *[ctypes.byref(handle), compressed_stream_format.value])
        self.__handle = _Handle(handle, _sdk_lib.audio_stream_format_is_handle_valid, _sdk_lib.audio_stream_format_release)

    @property
    def _handle(self) -> _spx_handle:
        return self.__handle.get()


class AudioInputStream():
    """
    Base class for Input Streams
    """

    def __init__(self, handle: _spx_handle):
        self.__handle = _Handle(handle, _sdk_lib.audio_stream_is_handle_valid, _sdk_lib.audio_stream_release)

    @property
    def _handle(self):
        return self.__handle.get()

    def __str__(self):
        return f"AudioInputStream({self.__handle})"


class PushAudioInputStream(AudioInputStream):
    """
    Represents memory backed push audio input stream used for custom audio input configurations.

    :param stream_format: The `AudioStreamFormat` the stream uses for audio data.
    """
    def __init__(self, stream_format: Optional[AudioStreamFormat] = None):
        format = AudioStreamFormat() if stream_format is None else stream_format
        handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.audio_stream_create_push_audio_input_stream, *[ctypes.byref(handle), format._handle])
        super().__init__(handle)

    def set_property(self, name: str, value: str):
        c_name = _c_str(name)
        c_value = _c_str(name)
        _call_hr_fn(fn=_sdk_lib.push_audio_input_stream_set_property_by_name, *[self._handle, c_name, c_value])

    def write(self, buffer: bytes):
        """
        Writes the audio data specified by making an internal copy of the data.
        The buffer should not contain any audio header.

        :param buffer: The audio data.
        """
        _call_hr_fn(fn=_sdk_lib.push_audio_input_stream_write, *[self._handle, buffer, len(buffer)])

    def close(self):
        """
        Closes the stream.
        """
        _call_hr_fn(fn=_sdk_lib.push_audio_input_stream_close, *[self._handle])

    def __str__(self):
        return f"PushAudioInputStream({self.__handle})"


class PullAudioInputStreamCallback():
    """
    An interface that defines callback methods for an audio input stream.

    Derive from this class and implement its function to provide your own
    data as an audio input stream.
    """

    def read(self, buffer: memoryview) -> int:
        """
        This function is called to synchronously get data from the audio stream.
        The buffer returned by read() should not contain any audio header.

        :param buffer: the buffer that audio data should be passed in.
        :returns: The number of bytes passed into the stream.
        """
        return 0

    def get_property(self, id: PropertyId) -> str:
        return ""

    def close(self) -> None:
        """
        The callback that is called when the stream is closed.
        """
        pass


class PullAudioInputStream(AudioInputStream):
    """
    Pull audio input stream class.

    :param pull_stream_callback: The object containing the callback functions for the pull stream
    :param stream_format: The `AudioStreamFormat` the stream uses for audio data.
    """

    def __init__(self, pull_stream_callback: PullAudioInputStreamCallback,
                 stream_format: Optional[AudioStreamFormat] = None):
        if pull_stream_callback is None:
            raise ValueError("Callback needs to be present")
        format = AudioStreamFormat() if stream_format is None else stream_format
        handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.audio_stream_create_pull_audio_input_stream, *[ctypes.byref(handle), format._handle])
        super().__init__(handle)
        self.__callback = pull_stream_callback
        self.__context = _CallbackContext(self.__callback)
        context_ptr = ctypes.py_object(self.__context)
        _call_hr_fn(
            fn=_sdk_lib.pull_audio_input_stream_set_callbacks,
            *[self._handle, context_ptr, PullAudioInputStream.__read_callback, PullAudioInputStream.__close_callback])
        _call_hr_fn(
            fn=_sdk_lib.pull_audio_input_stream_set_getproperty_callback,
            *[self._handle, context_ptr, PullAudioInputStream.__get_property_callback])

    def __del__(self):
        _sdk_lib.pull_audio_input_stream_set_callbacks(self._handle, None, None, None)
        _sdk_lib.pull_audio_input_stream_set_getproperty_callback(self._handle, None, None)

    @ctypes.CFUNCTYPE(ctypes.c_int, ctypes.c_void_p, _data_ptr, ctypes.c_uint32)
    def __read_callback(context: ctypes.c_void_p, data: _data_ptr, size: ctypes.c_uint32):
        obj = _unpack_context(context)
        if obj is not None:
            buf = (ctypes.c_uint8 * size).from_address(ctypes.addressof(data.contents))
            view = memoryview(buf).cast('B')
            return obj.read(view)
        return 0

    @ctypes.CFUNCTYPE(None, ctypes.c_void_p)
    def __close_callback(context: ctypes.c_void_p):
        obj = _unpack_context(context)
        if obj is not None:
            obj.close()

    @ctypes.CFUNCTYPE(None, ctypes.c_void_p, ctypes.c_int, _data_ptr, ctypes.c_uint32)
    def __get_property_callback(context: ctypes.c_void_p, id: ctypes.c_int, result: _data_ptr, size: ctypes.c_uint32):
        obj = _unpack_context(context)
        if obj is not None:
            result_buf = (ctypes.c_uint8 * size).from_address(ctypes.addressof(result.contents))
            result_view = memoryview(result_buf).cast('B')
            property_id = PropertyId(id)
            value = obj.get_property(property_id)
            value_bytes = bytearray(value, encoding='utf-8')
            value_view = memoryview(value_bytes).cast('B')
            item_count = min(size, len(value_view))
            result_view[:item_count] = value_view[:]

    def __str__(self):
        return f"PullAudioInputStream({self.__handle})"


class AudioOutputStream():
    """
    Base class for Output Streams
    """

    def __init__(self, handle):
        self.__handle = _Handle(handle, _sdk_lib.audio_stream_is_handle_valid, _sdk_lib.audio_stream_release)

    @property
    def _handle(self):
        return self.__handle.get()


class PushAudioOutputStreamCallback:
    """
    An interface that defines callback methods for an audio output stream.

    Derive from this class and implement its function to provide your own
    data as an audio output stream.
    """

    def write(self, audio_buffer: memoryview) -> int:
        """
        This function is called to synchronously write data to the audio stream.

        :param audio_buffer: the buffer that audio data should be passed in.
        :returns: The number of bytes passed into the stream.
        """
        return 0

    def close(self) -> None:
        """
        The callback that is called when the stream is closed.
        """
        pass


class PushAudioOutputStream(AudioOutputStream):
    """
    Push audio output stream class.

    :param push_stream_callback: The object containing the callback functions for the push stream
    """

    def __init__(self, push_stream_callback: PushAudioOutputStreamCallback):
        if push_stream_callback is None:
            raise ValueError("Callback needs to be present")
        handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.audio_stream_create_push_audio_output_stream, *[ctypes.byref(handle)])
        super().__init__(handle)
        self.__callback = push_stream_callback
        self.__context = _CallbackContext(self.__callback)
        context_ptr = ctypes.py_object(self.__context)
        _call_hr_fn(
            fn=_sdk_lib.push_audio_output_stream_set_callbacks,
            *[self._handle, context_ptr, PushAudioOutputStream.__write_callback, PushAudioOutputStream.__close_callback])

    def __del__(self):
        _sdk_lib.push_audio_output_stream_set_callbacks(self._handle, None, None, None)
        self.__callback = None

    @ctypes.CFUNCTYPE(ctypes.c_int, ctypes.c_void_p, _data_ptr, ctypes.c_uint32)
    def __write_callback(context: ctypes.c_void_p, buffer: _data_ptr, size: ctypes.c_uint32):
        obj = _unpack_context(context)
        if obj is not None:
            buf = (ctypes.c_uint8 * size).from_address(ctypes.addressof(buffer.contents))
            view = memoryview(buf).cast('B')
            return obj.write(view)
        return 0

    @ctypes.CFUNCTYPE(None, ctypes.c_void_p)
    def __close_callback(context: ctypes.c_void_p):
        obj = _unpack_context(context)
        if obj is not None:
            obj.close()


class PullAudioOutputStream(AudioOutputStream):
    """
    Represents memory backed pull audio output stream used for custom audio output.
    """

    def __init__(self, handle: Optional[_spx_handle] = None):
        if handle is None:
            handle = _spx_handle(0)
            _call_hr_fn(fn=_sdk_lib.audio_stream_create_pull_audio_output_stream, *[ctypes.byref(handle)])
        super().__init__(handle)

    def read(self, audio_buffer: bytes) -> int:
        """
        Reads the audio data from stream and fill into the given buffer.
        The maximal number of bytes to be read is determined by the size of audio_buffer.
        If there is no data immediately available, ReadData() blocks until the next data becomes available.

        :param audio_buffer: The buffer to receive the audio data.
        :returns: The number of bytes filled, or 0 in case the stream hits its end and there is no more data available.
        """
        filledSize = ctypes.c_uint32(0)
        _call_hr_fn(
            fn=_sdk_lib.pull_audio_output_stream_read,
            *[self._handle, audio_buffer, len(audio_buffer), ctypes.byref(filledSize)])
        return filledSize.value


class AudioConfig():
    """
    Represents audio input or output configuration. Audio input can be from a microphone,
    file, or input stream. Audio output can be to a speaker, audio file output in WAV format,
    or output stream.

    Generates an audio configuration for the various recognizers. Only one argument can be
    passed at a time.

    :param use_default_microphone: Specifies to use the default system microphone for audio
        input.
    :param device_name: Specifies the id of the audio device to use.
         Please refer to `this page <https://aka.ms/csspeech/microphone-selection>`_
         on how to retrieve platform-specific microphone names.
         This functionality was added in version 1.3.0.
    :param filename: Specifies an audio input file.
    :param stream: Creates an AudioConfig object representing the specified stream.
    """

    def __init__(self, use_default_microphone: bool = False, filename: Optional[str] = None,
                 stream: Optional[AudioInputStream] = None, device_name: Optional[str] = None):
        if not isinstance(use_default_microphone, bool):
            raise ValueError('use_default_microphone must be a bool, is "{}"'.format(
                use_default_microphone))
        handle = _spx_handle(0)
        if use_default_microphone:
            if filename is None and stream is None and device_name is None:
                _call_hr_fn(fn=_sdk_lib.audio_config_create_audio_input_from_default_microphone, *[ctypes.byref(handle)])
            else:
                raise ValueError('default microphone can not be combined with any other options')
        else:
            if sum(x is not None for x in (filename, stream, device_name)) > 1:
                raise ValueError('only one of filename, stream, and device_name can be given')

            if filename is not None:
                c_filename = _c_str(filename)
                _call_hr_fn(fn=_sdk_lib.audio_config_create_audio_input_from_wav_file_name, *[ctypes.byref(handle), c_filename])
            elif stream is not None:
                self._stream = stream
                _call_hr_fn(fn=_sdk_lib.audio_config_create_audio_input_from_stream, *[ctypes.byref(handle), stream._handle])
            elif device_name is not None:
                c_device = _c_str(device_name)
                _call_hr_fn(fn=_sdk_lib.audio_config_create_audio_input_from_a_microphone, *[ctypes.byref(handle), c_device])
            else:
                raise ValueError('cannot construct AudioConfig with the given arguments')
        self.__handle = _Handle(handle, _sdk_lib.audio_config_is_handle_valid, _sdk_lib.audio_config_release)
        prop_handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.audio_config_get_property_bag, *[handle, ctypes.byref(prop_handle)])
        self._properties = PropertyCollection(prop_handle)

    @property
    def _handle(self) -> _spx_handle:
        return self.__handle.get()

    def get_property(self, property_id: PropertyId) -> str:
        """
        Get a property by id.

        :param property_id: The id of the property to be retrieved.
        :returns: The value of the property.
        """
        if not isinstance(property_id, PropertyId):
            raise TypeError('property_id value must be PropertyId instance')
        return self._properties.get_property(property_id)

    def get_property_by_name(self, property_name: str) -> str:
        """
        Get a property by name.

        :param property_name: The name of the property to be retrieved.
        :returns: The value of the property.
        """
        if not isinstance(property_name, str):
            raise TypeError('property_name value must be str instance')
        return self._properties.get_property_by_name(property_name)

    def set_property(self, property_id: PropertyId, value: str):
        """
        Set a property by id.

        :param property_id: The id of the property to be set.
        :param value: The value to be set for the property.
        """
        if not isinstance(property_id, PropertyId):
            raise TypeError('property_id value must be PropertyId instance')
        self._properties.set_property(property_id, value)

    def set_property_by_name(self, property_name: str, value: str):
        """
        Set a property by name.

        :param property_name: The name of the property to be set.
        :param value: The value to be set for the property.
        """
        if not isinstance(property_name, str):
            raise TypeError('property_name value must be str instance')
        self._properties.set_property_by_name(property_name, value)

    def set_properties(self, properties: Dict[PropertyId, str]):
        """
        Set multiple properties by id.

        :param properties: A dict mapping property ids to the values to be set.
        """
        for property_id, value in properties.items():
            if not isinstance(property_id, PropertyId):
                raise TypeError('property_id value must be PropertyId instance')
            self._properties.set_property(property_id, value)

    def set_properties_by_name(self, properties: Dict[str, str]):
        """
        Set multiple properties by name.

        :param properties: A dict mapping property ids to the values to be set.
        """
        for property_name, value in properties.items():
            if not isinstance(property_name, str):
                raise TypeError('property_name value must be str instance')
            self._properties.set_property_by_name(property_name, value)


class AudioOutputConfig():
    """
    Represents specific audio configuration, such as audio output device, file, or custom audio streams

    Generates an audio configuration for the speech synthesizer. Only one argument can be
    passed at a time.

    :param use_default_speaker: Specifies to use the system default speaker for audio
        output.
    :param filename: Specifies an audio output file. The parent directory must already exist.
    :param stream: Creates an AudioOutputConfig object representing the specified stream.
    :param device_name: Specifies the id of the audio device to use.
         This functionality was added in version 1.17.0.
    """

    def __init__(self, use_default_speaker: bool = False, filename: Optional[str] = None,
                 stream: Optional[AudioOutputStream] = None, device_name: Optional[str] = None):
        if not isinstance(use_default_speaker, bool):
            raise ValueError('use_default_speaker must be a bool, is "{}"'.format(
                use_default_speaker))
        handle = _spx_handle(0)
        if filename is None and stream is None and device_name is None:
            if use_default_speaker:
                _call_hr_fn(fn=_sdk_lib.audio_config_create_audio_output_from_default_speaker, *[ctypes.byref(handle)])
            else:
                raise ValueError('default speaker needs to be explicitly activated')
        else:
            if sum(x is not None for x in (filename, stream, device_name)) > 1:
                raise ValueError('only one of filename, stream, and device_name can be given')

            if filename is not None:
                c_filename = _c_str(filename)
                _call_hr_fn(fn=_sdk_lib.audio_config_create_audio_output_from_wav_file_name, *[ctypes.byref(handle), c_filename])
            elif stream is not None:
                self._stream = stream
                _call_hr_fn(fn=_sdk_lib.audio_config_create_audio_output_from_stream, *[ctypes.byref(handle), stream._handle])
            elif device_name is not None:
                c_device = _c_str(device_name)
                _call_hr_fn(fn=_sdk_lib.audio_config_create_audio_output_from_a_speaker, *[ctypes.byref(handle), c_device])
            else:
                raise ValueError('cannot construct AudioOutputConfig with the given arguments')
        self.__handle = _Handle(handle, _sdk_lib.audio_config_is_handle_valid, _sdk_lib.audio_config_release)

    @property
    def _handle(self) -> _spx_handle:
        return self.__handle.get()
