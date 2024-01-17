# coding: utf-8
#
# Copyright 2024 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS-IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Constants for storing language accent codes information for
Oppia's voiceovers.
"""

from __future__ import annotations


# A dict with language code as keys and nested dicts as values. Each nested dict
# contains language accent code as keys and its description as values.
# This is an exhaustive list of language accent pairs that Oppia may support
# for voiceovers (manual and auto).
VOICEOVER_LANGUAGE_CODES_AND_ACCENT_INFO_MASTER_LIST = {
    'af': {
        'af-ZA': 'Afrikaans (South Africa)'
    },
    'am': {
        'am-ET': 'Amharic (Ethiopia)'
    },
    'ar': {
        'ar-AE': 'Arabic (United Arab Emirates)',
        'ar-BH': 'Arabic (Bahrain)',
        'ar-DZ': 'Arabic (Algeria)',
        'ar-EG': 'Arabic (Egypt)',
        'ar-IQ': 'Arabic (Iraq)',
        'ar-JO': 'Arabic (Jordan)',
        'ar-KW': 'Arabic (Kuwait)',
        'ar-LB': 'Arabic (Lebanon)',
        'ar-LY': 'Arabic (Libya)',
        'ar-MA': 'Arabic (Morocco)',
        'ar-OM': 'Arabic (Oman)',
        'ar-PS': 'Arabic (Palestinian Authority)',
        'ar-QA': 'Arabic (Qatar)',
        'ar-SA': 'Arabic (Saudi Arabia)',
        'ar-SY': 'Arabic (Syria)',
        'ar-TN': 'Arabic (Tunisia)',
        'ar-YE': 'Arabic (Yemen)',
    },
    'az': {
        'az-AZ': 'Azerbaijani (Latin, Azerbaijan)'
    },
    'bg': {
        'bg-BG': 'Bulgarian (Bulgaria)'
    },
    'bn': {
        'bn-IN': 'Bengali (India)',
        'bn-BD': 'Bangla (Bangladesh)'
    },
    'bs': {
        'bs-BA': 'Bosnian (Bosnia and Herzegovina)'
    },
    'ca': {
        'ca-ES': 'Catalan'
    },
    'cs': {
        'cs-CZ': 'Czech (Czechia)'
    },
    'cy': {
        'cy-GB': 'Welsh (United Kingdom)'
    },
    'da': {
        'da-DK': 'Danish (Denmark)'
    },
    'de': {
        'de-AT': 'German (Austria)',
        'de-CH': 'German (Switzerland)',
        'de-DE': 'German (Germany)',
    },
    'el': {
        'el-GR': 'Greek (Greece)'
    },
    'en': {
        'en-AU': 'English (Australia)',
        'en-CA': 'English (Canada)',
        'en-GB': 'English (United Kingdom)',
        'en-GH': 'English (Ghana)',
        'en-HK': 'English (Hong Kong SAR)',
        'en-IE': 'English (Ireland)',
        'en-IN': 'English (India)',
        'en-KE': 'English (Kenya)',
        'en-NG': 'English (Nigeria)',
        'en-NZ': 'English (New Zealand)',
        'en-PH': 'English (Philippines)',
        'en-SG': 'English (Singapore)',
        'en-TZ': 'English (Tanzania)',
        'en-US': 'English (United States)',
        'en-ZA': 'English (South Africa)',
    },
    'es': {
        'es-AR': 'Spanish (Argentina)',
        'es-BO': 'Spanish (Bolivia)',
        'es-CL': 'Spanish (Chile)',
        'es-CO': 'Spanish (Colombia)',
        'es-CR': 'Spanish (Costa Rica)',
        'es-CU': 'Spanish (Cuba)',
        'es-DO': 'Spanish (Dominican Republic)',
        'es-EC': 'Spanish (Ecuador)',
        'es-ES': 'Spanish (Spain)',
        'es-GQ': 'Spanish (Equatorial Guinea)',
        'es-GT': 'Spanish (Guatemala)',
        'es-HN': 'Spanish (Honduras)',
        'es-MX': 'Spanish (Mexico)',
        'es-NI': 'Spanish (Nicaragua)',
        'es-PA': 'Spanish (Panama)',
        'es-PE': 'Spanish (Peru)',
        'es-PR': 'Spanish (Puerto Rico)',
        'es-PY': 'Spanish (Paraguay)',
        'es-SV': 'Spanish (El Salvador)',
        'es-US': 'Spanish (United States)',
        'es-UY': 'Spanish (Uruguay)',
        'es-VE': 'Spanish (Venezuela)',
    },
    'et': {
        'et-EE': 'Estonian (Estonia)'
    },
    'eu': {
        'eu-ES': 'Basque'
    },
    'fa': {
        'fa-IR': 'Persian (Iran)'
    },
    'fat': {
        'fat-GH': 'Fanti (Ghana)'
    },
    'fi': {
        'fi-FI': 'Finnish (Finland)',
        'fil-PH': 'Filipino (Philippines)'
    },
    'fr': {
        'fr-BE': 'French (Belgium)',
        'fr-CA': 'French (Canada)',
        'fr-CH': 'French (Switzerland)',
        'fr-FR': 'French (France)',
    },
    'ga': {
        'ga-IE': 'Irish (Ireland)'
    },
    'gl': {
        'gl-ES': 'Galician'
    },
    'gu': {
        'gu-IN': 'Gujarati (India)'
    },
    'ha': {
        'ha-NG': 'Hausa (Nigeria)'
    },
    'he': {
        'he-IL': 'Hebrew (Israel)'
    },
    'hi': {
        'hi-IN': 'Hindi (India)'
    },
    'hi-en': {
        'hi-en-IN': 'Hinglish (India)'
    },
    'hr': {
        'hr-HR': 'Croatian (Croatia)'
    },
    'hu': {
        'hu-HU': 'Hungarian (Hungary)'
    },
    'hy': {
        'hy-AM': 'Armenian (Armenia)'
    },
    'id': {
        'id-ID': 'Indonesian (Indonesia)'
    },
    'ig': {
        'ig-NG': 'Igbo (Nigeria)'
    },
    'is': {
        'is-IS': 'Icelandic (Iceland)'
    },
    'it': {
        'it-CH': 'Italian (Switzerland)',
        'it-IT': 'Italian (Italy)'
    },
    'ja': {
        'ja-JP': 'Japanese (Japan)'
    },
    'jv': {
        'jv-ID': 'Javanese (Latin, Indonesia)'
    },
    'ka': {
        'ka-GE': 'Georgian (Georgia)'
    },
    'kab': {
        'kab-DZ': 'Kabyle (Algeria)'
    },
    'kk': {
        'kk-KZ': 'Kazakh (Kazakhstan)'
    },
    'km': {
        'km-KH': 'Khmer (Cambodia)'
    },
    'kn': {
        'kn-IN': 'Kannada (India)'
    },
    'ko': {
        'ko-KR': 'Korean (Korea)'
    },
    'lg': {
        'lg-UG': 'Ganda (Uganda)'
    },
    'lo': {
        'lo-LA': 'Lao (Laos)'
    },
    'lt': {
        'lt-LT': 'Lithuanian (Lithuania)'
    },
    'lv': {
        'lv-LV': 'Latvian (Latvia)'
    },
    'mk': {
        'mk-MK': 'Macedonian (North Macedonia)'
    },
    'ml': {
        'ml-IN': 'Malayalam (India)'
    },
    'mn': {
        'mn-MN': 'Mongolian (Mongolia)'
    },
    'mr': {
        'mr-IN': 'Marathi (India)'
    },
    'ms': {
        'ms-MY': 'Malay (Malaysia)'
    },
    'mt': {
        'mt-MT': 'Maltese (Malta)'
    },
    'my': {
        'my-MM': 'Burmese (Myanmar)'
    },
    'nb': {
        'nb-NO': 'Norwegian Bokmål (Norway)'
    },
    'ne': {
        'ne-NP': 'Nepali (Nepal)'
    },
    'nl': {
        'nl-BE': 'Dutch (Belgium)',
        'nl-NL': 'Dutch (Netherlands)'
    },
    'no': {
        'no-NO': 'Norsk (Norway)'
    },
    'pa': {
        'pa-IN': 'Punjabi (India)'
    },
    'pcm-NG': {
        'pcm-NG': 'Nigerian Pidgin (Nigeria)'
    },
    'pl': {
        'pl-PL': 'Polish (Poland)'
    },
    'prs': {
        'prs-AF': 'Dari (Afghanistan)'
    },
    'ps': {
        'ps-AF': 'Pashto (Afghanistan)'
    },
    'pt': {
        'pt-BR': 'Portuguese (Brazil)',
        'pt-PT': 'Portuguese (Portugal)'
    },
    'ro': {
        'ro-RO': 'Romanian (Romania)'
    },
    'ru': {
        'ru-RU': 'Russian (Russia)'
    },
    'si': {
        'si-LK': 'Sinhala (Sri Lanka)'
    },
    'sk': {
        'sk-SK': 'Slovak (Slovakia)'
    },
    'sl': {
        'sl-SI': 'Slovenian (Slovenia)'
    },
    'so': {
        'so-SO': 'Somali (Somalia)'
    },
    'sq': {
        'sq-AL': 'Albanian (Albania)'
    },
    'sr': {
        'sr-RS': 'Serbian (Cyrillic, Serbia)'
    },
    'sv': {
        'sv-SE': 'Swedish (Sweden)'
    },
    'sw': {
        'sw-KE': 'Swahili (Kenya)',
        'sw-TZ': 'Swahili (Tanzania)'
    },
    'ta': {
        'ta-IN': 'Tamil (India)',
        'ta-LK': 'Tamil (Sri Lanka)',
        'ta-MY': 'Tamil (Malaysia)',
        'ta-SG': 'Tamil (Singapore)'
    },
    'te': {
        'te-IN': 'Telugu (India)'
    },
    'th': {
        'th-TH': 'Thai (Thailand)'
    },
    'tl': {
        'tl-PH': 'Tagalog (Philippines)'
    },
    'tr': {
        'tr-TR': 'Turkish (Türkiye)'
    },
    'uk': {
        'uk-UA': 'Ukrainian (Ukraine)'
    },
    'ur': {
        'ur-IN': 'Urdu (India)',
        'ur-PK': 'Urdu (Pakistan)'
    },
    'uz': {
        'uz-UZ': 'Uzbek (Latin, Uzbekistan)'
    },
    'vi': {
        'vi-VN': 'Vietnamese (Vietnam)'
    },
    'wu': {
        'wuu-CN': 'Chinese (Wu, Simplified)'
    },
    'yo': {
        'yo-NG': 'Yoruba (Nigeria)'
    },
    'yu': {
        'yue-CN': 'Chinese (Cantonese, Simplified)'
    },
    'zh': {
        'zh-CN': 'Chinese (Mandarin, Simplified)',
        'zh-CN-shandong': 'Chinese (Jilu Mandarin, Simplified)',
        'zh-CN-sichuan': 'Chinese (Southwestern Mandarin, Simplified)',
        'zh-HK': 'Chinese (Cantonese, Traditional)',
        'zh-TW': 'Chinese (Taiwanese Mandarin, Traditional)',
    },
    'zu': {
        'zu-ZA': 'Zulu (South Africa)'
    },
}


# A dict with language accent codes as keys and nested dicts as values.
# Each nested dict contains 'service' and 'voice_code' as keys and their
# respective field values as values. This is an exhaustive list of
# language accent pairs that Oppia may support for automatic voiceovers, and
# this should be a subset of
# VOICEOVER_LANGUAGE_CODES_AND_ACCENT_INFO_MASTER_LIST.
AUTOGENERATABLE_VOICEOVER_LANGUAGE_ACCENT_INFO_LIST = {
    'af-ZA': {'service': 'Azure', 'voice_code': 'af-ZA-AdriNeural'},
    'am-ET': {'service': 'Azure', 'voice_code': 'am-ET-MekdesNeural'},
    'ar-AE': {'service': 'Azure', 'voice_code': 'ar-AE-FatimaNeural'},
    'ar-BH': {'service': 'Azure', 'voice_code': 'ar-BH-LailaNeural'},
    'ar-DZ': {'service': 'Azure', 'voice_code': 'ar-DZ-AminaNeural'},
    'ar-EG': {'service': 'Azure', 'voice_code': 'ar-EG-SalmaNeural'},
    'ar-IQ': {'service': 'Azure', 'voice_code': 'ar-IQ-RanaNeural'},
    'ar-JO': {'service': 'Azure', 'voice_code': 'ar-JO-SanaNeural'},
    'ar-KW': {'service': 'Azure', 'voice_code': 'ar-KW-NouraNeural'},
    'ar-LB': {'service': 'Azure', 'voice_code': 'ar-LB-LaylaNeural'},
    'ar-LY': {'service': 'Azure', 'voice_code': 'ar-LY-ImanNeural'},
    'ar-MA': {'service': 'Azure', 'voice_code': 'ar-MA-MounaNeural'},
    'ar-OM': {'service': 'Azure', 'voice_code': 'ar-OM-AyshaNeural'},
    'ar-QA': {'service': 'Azure', 'voice_code': 'ar-QA-AmalNeural'},
    'ar-SA': {'service': 'Azure', 'voice_code': 'ar-SA-ZariyahNeural'},
    'ar-SY': {'service': 'Azure', 'voice_code': 'ar-SY-AmanyNeural'},
    'ar-TN': {'service': 'Azure', 'voice_code': 'ar-TN-ReemNeural'},
    'ar-YE': {'service': 'Azure', 'voice_code': 'ar-YE-MaryamNeural'},
    'az-AZ': {'service': 'Azure', 'voice_code': 'az-AZ-BanuNeural'},
    'bg-BG': {'service': 'Azure', 'voice_code': 'bg-BG-KalinaNeural'},
    'bn-BD': {'service': 'Azure', 'voice_code': 'bn-BD-NabanitaNeural'},
    'bn-IN': {'service': 'Azure', 'voice_code': 'bn-IN-TanishaaNeural'},
    'bs-BA': {'service': 'Azure', 'voice_code': 'bs-BA-VesnaNeural'},
    'ca-ES': {'service': 'Azure', 'voice_code': 'ca-ES-JoanaNeural'},
    'cs-CZ': {'service': 'Azure', 'voice_code': 'cs-CZ-VlastaNeural'},
    'cy-GB': {'service': 'Azure', 'voice_code': 'cy-GB-NiaNeural'},
    'da-DK': {'service': 'Azure', 'voice_code': 'da-DK-ChristelNeural'},
    'de-AT': {'service': 'Azure', 'voice_code': 'de-AT-IngridNeural'},
    'de-CH': {'service': 'Azure', 'voice_code': 'de-CH-LeniNeural'},
    'de-DE': {'service': 'Azure', 'voice_code': 'de-DE-KatjaNeural'},
    'el-GR': {'service': 'Azure', 'voice_code': 'el-GR-AthinaNeural'},
    'en-AU': {'service': 'Azure', 'voice_code': 'en-AU-NatashaNeural'},
    'en-CA': {'service': 'Azure', 'voice_code': 'en-CA-ClaraNeural'},
    'en-GB': {'service': 'Azure', 'voice_code': 'en-GB-SoniaNeural'},
    'en-HK': {'service': 'Azure', 'voice_code': 'en-HK-YanNeural'},
    'en-IE': {'service': 'Azure', 'voice_code': 'en-IE-EmilyNeural'},
    'en-IN': {'service': 'Azure', 'voice_code': 'en-IN-NeerjaNeural'},
    'en-KE': {'service': 'Azure', 'voice_code': 'en-KE-AsiliaNeural'},
    'en-NG': {'service': 'Azure', 'voice_code': 'en-NG-EzinneNeural'},
    'en-NZ': {'service': 'Azure', 'voice_code': 'en-NZ-MollyNeural'},
    'en-PH': {'service': 'Azure', 'voice_code': 'en-PH-RosaNeural'},
    'en-SG': {'service': 'Azure', 'voice_code': 'en-SG-LunaNeural'},
    'en-TZ': {'service': 'Azure', 'voice_code': 'en-TZ-ImaniNeural'},
    'en-US': {
        'service': 'Azure', 'voice_code': 'en-US-JennyMultilingualNeural'
    },
    'en-ZA': {'service': 'Azure', 'voice_code': 'en-ZA-LeahNeural'},
    'es-AR': {'service': 'Azure', 'voice_code': 'es-AR-ElenaNeural'},
    'es-BO': {'service': 'Azure', 'voice_code': 'es-BO-SofiaNeural'},
    'es-CL': {'service': 'Azure', 'voice_code': 'es-CL-CatalinaNeural'},
    'es-CO': {'service': 'Azure', 'voice_code': 'es-CO-SalomeNeural'},
    'es-CR': {'service': 'Azure', 'voice_code': 'es-CR-MariaNeural'},
    'es-CU': {'service': 'Azure', 'voice_code': 'es-CU-BelkysNeural'},
    'es-DO': {'service': 'Azure', 'voice_code': 'es-DO-RamonaNeural'},
    'es-EC': {'service': 'Azure', 'voice_code': 'es-EC-AndreaNeural'},
    'es-ES': {'service': 'Azure', 'voice_code': 'es-ES-ElviraNeural'},
    'es-GQ': {'service': 'Azure', 'voice_code': 'es-GQ-TeresaNeural'},
    'es-GT': {'service': 'Azure', 'voice_code': 'es-GT-MartaNeural'},
    'es-HN': {'service': 'Azure', 'voice_code': 'es-HN-KarlaNeural'},
    'es-MX': {'service': 'Azure', 'voice_code': 'es-MX-DaliaNeural'},
    'es-NI': {'service': 'Azure', 'voice_code': 'es-NI-YolandaNeural'},
    'es-PA': {'service': 'Azure', 'voice_code': 'es-PA-MargaritaNeural'},
    'es-PE': {'service': 'Azure', 'voice_code': 'es-PE-CamilaNeural'},
    'es-PR': {'service': 'Azure', 'voice_code': 'es-PR-KarinaNeural'},
    'es-PY': {'service': 'Azure', 'voice_code': 'es-PY-TaniaNeural'},
    'es-SV': {'service': 'Azure', 'voice_code': 'es-SV-LorenaNeural'},
    'es-US': {'service': 'Azure', 'voice_code': 'es-US-PalomaNeural'},
    'es-UY': {'service': 'Azure', 'voice_code': 'es-UY-ValentinaNeural'},
    'es-VE': {'service': 'Azure', 'voice_code': 'es-VE-PaolaNeural'},
    'et-EE': {'service': 'Azure', 'voice_code': 'et-EE-AnuNeural'},
    'eu-ES': {'service': 'Azure', 'voice_code': 'eu-ES-AinhoaNeural'},
    'fa-IR': {'service': 'Azure', 'voice_code': 'fa-IR-DilaraNeural'},
    'fi-FI': {'service': 'Azure', 'voice_code': 'fi-FI-SelmaNeural'},
    'fil-PH': {'service': 'Azure', 'voice_code': 'fil-PH-BlessicaNeural'},
    'fr-BE': {'service': 'Azure', 'voice_code': 'fr-BE-CharlineNeural'},
    'fr-CA': {'service': 'Azure', 'voice_code': 'fr-CA-SylvieNeural'},
    'fr-CH': {'service': 'Azure', 'voice_code': 'fr-CH-ArianeNeural'},
    'fr-FR': {'service': 'Azure', 'voice_code': 'fr-FR-DeniseNeural'},
    'ga-IE': {'service': 'Azure', 'voice_code': 'ga-IE-OrlaNeural'},
    'gl-ES': {'service': 'Azure', 'voice_code': 'gl-ES-SabelaNeural'},
    'gu-IN': {'service': 'Azure', 'voice_code': 'gu-IN-DhwaniNeural'},
    'he-IL': {'service': 'Azure', 'voice_code': 'he-IL-HilaNeural'},
    'hi-IN': {'service': 'Azure', 'voice_code': 'hi-IN-SwaraNeural'},
    'hr-HR': {'service': 'Azure', 'voice_code': 'hr-HR-GabrijelaNeural'},
    'hu-HU': {'service': 'Azure', 'voice_code': 'hu-HU-NoemiNeural'},
    'hy-AM': {'service': 'Azure', 'voice_code': 'hy-AM-AnahitNeural'},
    'id-ID': {'service': 'Azure', 'voice_code': 'id-ID-GadisNeural'},
    'is-IS': {'service': 'Azure', 'voice_code': 'is-IS-GudrunNeural'},
    'it-IT': {'service': 'Azure', 'voice_code': 'it-IT-ElsaNeural'},
    'ja-JP': {'service': 'Azure', 'voice_code': 'ja-JP-NanamiNeural'},
    'jv-ID': {'service': 'Azure', 'voice_code': 'jv-ID-SitiNeural'},
    'ka-GE': {'service': 'Azure', 'voice_code': 'ka-GE-EkaNeural'},
    'kk-KZ': {'service': 'Azure', 'voice_code': 'kk-KZ-AigulNeural'},
    'km-KH': {'service': 'Azure', 'voice_code': 'km-KH-SreymomNeural'},
    'kn-IN': {'service': 'Azure', 'voice_code': 'kn-IN-SapnaNeural'},
    'ko-KR': {'service': 'Azure', 'voice_code': 'ko-KR-SunHiNeural'},
    'lo-LA': {'service': 'Azure', 'voice_code': 'lo-LA-KeomanyNeural'},
    'lt-LT': {'service': 'Azure', 'voice_code': 'lt-LT-OnaNeural'},
    'lv-LV': {'service': 'Azure', 'voice_code': 'lv-LV-EveritaNeural'},
    'mk-MK': {'service': 'Azure', 'voice_code': 'mk-MK-MarijaNeural'},
    'ml-IN': {'service': 'Azure', 'voice_code': 'ml-IN-SobhanaNeural'},
    'mn-MN': {'service': 'Azure', 'voice_code': 'mn-MN-YesuiNeural'},
    'mr-IN': {'service': 'Azure', 'voice_code': 'mr-IN-AarohiNeural'},
    'ms-MY': {'service': 'Azure', 'voice_code': 'ms-MY-YasminNeural'},
    'mt-MT': {'service': 'Azure', 'voice_code': 'mt-MT-GraceNeural'},
    'my-MM': {'service': 'Azure', 'voice_code': 'my-MM-NilarNeural'},
    'nb-NO': {'service': 'Azure', 'voice_code': 'nb-NO-PernilleNeural'},
    'ne-NP': {'service': 'Azure', 'voice_code': 'ne-NP-HemkalaNeural'},
    'nl-BE': {'service': 'Azure', 'voice_code': 'nl-BE-DenaNeural'},
    'nl-NL': {'service': 'Azure', 'voice_code': 'nl-NL-FennaNeural'},
    'pl-PL': {'service': 'Azure', 'voice_code': 'pl-PL-AgnieszkaNeural'},
    'ps-AF': {'service': 'Azure', 'voice_code': 'ps-AF-LatifaNeural'},
    'pt-BR': {'service': 'Azure', 'voice_code': 'pt-BR-FranciscaNeural'},
    'pt-PT': {'service': 'Azure', 'voice_code': 'pt-PT-RaquelNeural'},
    'ro-RO': {'service': 'Azure', 'voice_code': 'ro-RO-AlinaNeural'},
    'ru-RU': {'service': 'Azure', 'voice_code': 'ru-RU-SvetlanaNeural'},
    'si-LK': {'service': 'Azure', 'voice_code': 'si-LK-ThiliniNeural'},
    'sk-SK': {'service': 'Azure', 'voice_code': 'sk-SK-ViktoriaNeural'},
    'sl-SI': {'service': 'Azure', 'voice_code': 'sl-SI-PetraNeural'},
    'so-SO': {'service': 'Azure', 'voice_code': 'so-SO-UbaxNeural'},
    'sq-AL': {'service': 'Azure', 'voice_code': 'sq-AL-AnilaNeural'},
    'sr-RS': {'service': 'Azure', 'voice_code': 'sr-RS-SophieNeural'},
    'sv-SE': {'service': 'Azure', 'voice_code': 'sv-SE-SofieNeural'},
    'sw-KE': {'service': 'Azure', 'voice_code': 'sw-KE-ZuriNeural'},
    'sw-TZ': {'service': 'Azure', 'voice_code': 'sw-TZ-RehemaNeural'},
    'ta-IN': {'service': 'Azure', 'voice_code': 'ta-IN-PallaviNeural'},
    'ta-LK': {'service': 'Azure', 'voice_code': 'ta-LK-SaranyaNeural'},
    'ta-MY': {'service': 'Azure', 'voice_code': 'ta-MY-KaniNeural'},
    'ta-SG': {'service': 'Azure', 'voice_code': 'ta-SG-VenbaNeural'},
    'te-IN': {'service': 'Azure', 'voice_code': 'te-IN-ShrutiNeural'},
    'th-TH': {'service': 'Azure', 'voice_code': 'th-TH-PremwadeeNeural'},
    'tr-TR': {'service': 'Azure', 'voice_code': 'tr-TR-EmelNeural'},
    'uk-UA': {'service': 'Azure', 'voice_code': 'uk-UA-PolinaNeural'},
    'ur-IN': {'service': 'Azure', 'voice_code': 'ur-IN-GulNeural'},
    'ur-PK': {'service': 'Azure', 'voice_code': 'ur-PK-UzmaNeural'},
    'uz-UZ': {'service': 'Azure', 'voice_code': 'uz-UZ-MadinaNeural'},
    'vi-VN': {'service': 'Azure', 'voice_code': 'vi-VN-HoaiMyNeural'},
    'wuu-CN': {'service': 'Azure', 'voice_code': 'wuu-CN-XiaotongNeural'},
    'yue-CN': {'service': 'Azure', 'voice_code': 'yue-CN-XiaoMinNeural'},
    'zh-CN': {'service': 'Azure', 'voice_code': 'zh-CN-XiaoxiaoNeural'},
    'zh-CN-shandong': {
        'service': 'Azure', 'voice_code': 'zh-CN-shandong-YunxiangNeural',
    },
    'zh-CN-sichuan': {
        'service': 'Azure', 'voice_code': 'zh-CN-sichuan-YunxiNeural'
    },
    'zh-HK': {'service': 'Azure', 'voice_code': 'zh-HK-HiuMaanNeural'},
    'zh-TW': {'service': 'Azure', 'voice_code': 'zh-TW-HsiaoChenNeural'},
    'zu-ZA': {'service': 'Azure', 'voice_code': 'zu-ZA-ThandoNeural'},
}
