#  Copyright (c) Microsoft. All rights reserved.
#  See https://aka.ms/csspeech/license for the full license information.

"""
Microsoft Speech SDK for Python
"""

from .speech import *
from . import audio
from . import dialog
from . import intent
from . import transcription
from . import translation
from . import languageconfig

try:
    from .version import __version__
except ImportError:
    __version__ = '0.0.0'

from .audio import (
    AudioStreamContainerFormat,
    AudioStreamWaveFormat
)

from .properties import (
    PropertyCollection
)

from .enums import (
    CancellationErrorCode,
    CancellationReason,
    NoMatchReason,
    OutputFormat,
    ProfanityOption,
    PropertyId,
    ResultReason,
    ServicePropertyChannel
)

from .speech import (
    CancellationDetails,
    NoMatchDetails
)

from .audio import AudioConfig
from .languageconfig import (
    AutoDetectSourceLanguageConfig,
    SourceLanguageConfig,
)

# override __module__ for correct docs generation
root_namespace_classes = (
    AudioDataStream,
    AutoDetectSourceLanguageResult,
    CancellationDetails,
    CancellationErrorCode,
    CancellationReason,
    Connection,
    ConnectionEventArgs,
    EventSignal,
    KeywordRecognitionEventArgs,
    KeywordRecognitionModel,
    KeywordRecognitionResult,
    KeywordRecognizer,
    NoMatchDetails,
    NoMatchReason,
    OutputFormat,
    PhraseListGrammar,
    ProfanityOption,
    PropertyCollection,
    PropertyId,
    RecognitionEventArgs,
    RecognitionResult,
    Recognizer,
    ResultFuture,
    ResultReason,
    ServicePropertyChannel,
    SessionEventArgs,
    SpeechConfig,
    SpeechRecognitionCanceledEventArgs,
    SpeechRecognitionEventArgs,
    SpeechRecognitionResult,
    SpeechRecognizer,
    SpeechSynthesisBookmarkEventArgs,
    SpeechSynthesisCancellationDetails,
    SpeechSynthesisEventArgs,
    SpeechSynthesisOutputFormat,
    SpeechSynthesisResult,
    SpeechSynthesisVisemeEventArgs,
    SpeechSynthesisWordBoundaryEventArgs,
    SpeechSynthesizer,
    SynthesisVoicesResult,
    VoiceInfo,
    SynthesisVoiceGender,
    SynthesisVoiceType,
    StreamStatus,
    AudioStreamContainerFormat,
    AudioStreamWaveFormat,
    PronunciationAssessmentConfig,
    PronunciationAssessmentResult,
    PronunciationAssessmentPhonemeResult,
    PronunciationAssessmentWordResult,
    PronunciationAssessmentGradingSystem,
    PronunciationAssessmentGranularity,
    SyllableLevelTimingResult,
    SourceLanguageRecognizer,
)
for cls in root_namespace_classes:
    cls.__module__ = __name__
__all__ = [cls.__name__ for cls in root_namespace_classes]
