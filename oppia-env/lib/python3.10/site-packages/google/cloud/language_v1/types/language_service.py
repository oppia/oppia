# -*- coding: utf-8 -*-
# Copyright 2025 Google LLC
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
#
from __future__ import annotations

from typing import MutableMapping, MutableSequence

import proto  # type: ignore

__protobuf__ = proto.module(
    package="google.cloud.language.v1",
    manifest={
        "EncodingType",
        "Document",
        "Sentence",
        "Entity",
        "Token",
        "Sentiment",
        "PartOfSpeech",
        "DependencyEdge",
        "EntityMention",
        "TextSpan",
        "ClassificationCategory",
        "ClassificationModelOptions",
        "AnalyzeSentimentRequest",
        "AnalyzeSentimentResponse",
        "AnalyzeEntitySentimentRequest",
        "AnalyzeEntitySentimentResponse",
        "AnalyzeEntitiesRequest",
        "AnalyzeEntitiesResponse",
        "AnalyzeSyntaxRequest",
        "AnalyzeSyntaxResponse",
        "ClassifyTextRequest",
        "ClassifyTextResponse",
        "ModerateTextRequest",
        "ModerateTextResponse",
        "AnnotateTextRequest",
        "AnnotateTextResponse",
    },
)


class EncodingType(proto.Enum):
    r"""Represents the text encoding that the caller uses to process the
    output. Providing an ``EncodingType`` is recommended because the API
    provides the beginning offsets for various outputs, such as tokens
    and mentions, and languages that natively use different text
    encodings may access offsets differently.

    Values:
        NONE (0):
            If ``EncodingType`` is not specified, encoding-dependent
            information (such as ``begin_offset``) will be set at
            ``-1``.
        UTF8 (1):
            Encoding-dependent information (such as ``begin_offset``) is
            calculated based on the UTF-8 encoding of the input. C++ and
            Go are examples of languages that use this encoding
            natively.
        UTF16 (2):
            Encoding-dependent information (such as ``begin_offset``) is
            calculated based on the UTF-16 encoding of the input. Java
            and JavaScript are examples of languages that use this
            encoding natively.
        UTF32 (3):
            Encoding-dependent information (such as ``begin_offset``) is
            calculated based on the UTF-32 encoding of the input. Python
            is an example of a language that uses this encoding
            natively.
    """
    NONE = 0
    UTF8 = 1
    UTF16 = 2
    UTF32 = 3


class Document(proto.Message):
    r"""Represents the input to API methods.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        type_ (google.cloud.language_v1.types.Document.Type):
            Required. If the type is not set or is ``TYPE_UNSPECIFIED``,
            returns an ``INVALID_ARGUMENT`` error.
        content (str):
            The content of the input in string format.
            Cloud audit logging exempt since it is based on
            user data.

            This field is a member of `oneof`_ ``source``.
        gcs_content_uri (str):
            The Google Cloud Storage URI where the file content is
            located. This URI must be of the form:
            gs://bucket_name/object_name. For more details, see
            https://cloud.google.com/storage/docs/reference-uris. NOTE:
            Cloud Storage object versioning is not supported.

            This field is a member of `oneof`_ ``source``.
        language (str):
            The language of the document (if not specified, the language
            is automatically detected). Both ISO and BCP-47 language
            codes are accepted. `Language
            Support <https://cloud.google.com/natural-language/docs/languages>`__
            lists currently supported languages for each API method. If
            the language (either specified by the caller or
            automatically detected) is not supported by the called API
            method, an ``INVALID_ARGUMENT`` error is returned.
    """

    class Type(proto.Enum):
        r"""The document types enum.

        Values:
            TYPE_UNSPECIFIED (0):
                The content type is not specified.
            PLAIN_TEXT (1):
                Plain text
            HTML (2):
                HTML
        """
        TYPE_UNSPECIFIED = 0
        PLAIN_TEXT = 1
        HTML = 2

    type_: Type = proto.Field(
        proto.ENUM,
        number=1,
        enum=Type,
    )
    content: str = proto.Field(
        proto.STRING,
        number=2,
        oneof="source",
    )
    gcs_content_uri: str = proto.Field(
        proto.STRING,
        number=3,
        oneof="source",
    )
    language: str = proto.Field(
        proto.STRING,
        number=4,
    )


class Sentence(proto.Message):
    r"""Represents a sentence in the input document.

    Attributes:
        text (google.cloud.language_v1.types.TextSpan):
            The sentence text.
        sentiment (google.cloud.language_v1.types.Sentiment):
            For calls to [AnalyzeSentiment][] or if
            [AnnotateTextRequest.Features.extract_document_sentiment][google.cloud.language.v1.AnnotateTextRequest.Features.extract_document_sentiment]
            is set to true, this field will contain the sentiment for
            the sentence.
    """

    text: "TextSpan" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="TextSpan",
    )
    sentiment: "Sentiment" = proto.Field(
        proto.MESSAGE,
        number=2,
        message="Sentiment",
    )


class Entity(proto.Message):
    r"""Represents a phrase in the text that is a known entity, such
    as a person, an organization, or location. The API associates
    information, such as salience and mentions, with entities.

    Attributes:
        name (str):
            The representative name for the entity.
        type_ (google.cloud.language_v1.types.Entity.Type):
            The entity type.
        metadata (MutableMapping[str, str]):
            Metadata associated with the entity.

            For most entity types, the metadata is a Wikipedia URL
            (``wikipedia_url``) and Knowledge Graph MID (``mid``), if
            they are available. For the metadata associated with other
            entity types, see the Type table below.
        salience (float):
            The salience score associated with the entity in the [0,
            1.0] range.

            The salience score for an entity provides information about
            the importance or centrality of that entity to the entire
            document text. Scores closer to 0 are less salient, while
            scores closer to 1.0 are highly salient.
        mentions (MutableSequence[google.cloud.language_v1.types.EntityMention]):
            The mentions of this entity in the input
            document. The API currently supports proper noun
            mentions.
        sentiment (google.cloud.language_v1.types.Sentiment):
            For calls to [AnalyzeEntitySentiment][] or if
            [AnnotateTextRequest.Features.extract_entity_sentiment][google.cloud.language.v1.AnnotateTextRequest.Features.extract_entity_sentiment]
            is set to true, this field will contain the aggregate
            sentiment expressed for this entity in the provided
            document.
    """

    class Type(proto.Enum):
        r"""The type of the entity. For most entity types, the associated
        metadata is a Wikipedia URL (``wikipedia_url``) and Knowledge Graph
        MID (``mid``). The table below lists the associated fields for
        entities that have different metadata.

        Values:
            UNKNOWN (0):
                Unknown
            PERSON (1):
                Person
            LOCATION (2):
                Location
            ORGANIZATION (3):
                Organization
            EVENT (4):
                Event
            WORK_OF_ART (5):
                Artwork
            CONSUMER_GOOD (6):
                Consumer product
            OTHER (7):
                Other types of entities
            PHONE_NUMBER (9):
                Phone number

                The metadata lists the phone number, formatted according to
                local convention, plus whichever additional elements appear
                in the text:

                -  ``number`` - the actual number, broken down into sections
                   as per local convention
                -  ``national_prefix`` - country code, if detected
                -  ``area_code`` - region or area code, if detected
                -  ``extension`` - phone extension (to be dialed after
                   connection), if detected
            ADDRESS (10):
                Address

                The metadata identifies the street number and locality plus
                whichever additional elements appear in the text:

                -  ``street_number`` - street number
                -  ``locality`` - city or town
                -  ``street_name`` - street/route name, if detected
                -  ``postal_code`` - postal code, if detected
                -  ``country`` - country, if detected<
                -  ``broad_region`` - administrative area, such as the
                   state, if detected
                -  ``narrow_region`` - smaller administrative area, such as
                   county, if detected
                -  ``sublocality`` - used in Asian addresses to demark a
                   district within a city, if detected
            DATE (11):
                Date

                The metadata identifies the components of the date:

                -  ``year`` - four digit year, if detected
                -  ``month`` - two digit month number, if detected
                -  ``day`` - two digit day number, if detected
            NUMBER (12):
                Number

                The metadata is the number itself.
            PRICE (13):
                Price

                The metadata identifies the ``value`` and ``currency``.
        """
        UNKNOWN = 0
        PERSON = 1
        LOCATION = 2
        ORGANIZATION = 3
        EVENT = 4
        WORK_OF_ART = 5
        CONSUMER_GOOD = 6
        OTHER = 7
        PHONE_NUMBER = 9
        ADDRESS = 10
        DATE = 11
        NUMBER = 12
        PRICE = 13

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )
    type_: Type = proto.Field(
        proto.ENUM,
        number=2,
        enum=Type,
    )
    metadata: MutableMapping[str, str] = proto.MapField(
        proto.STRING,
        proto.STRING,
        number=3,
    )
    salience: float = proto.Field(
        proto.FLOAT,
        number=4,
    )
    mentions: MutableSequence["EntityMention"] = proto.RepeatedField(
        proto.MESSAGE,
        number=5,
        message="EntityMention",
    )
    sentiment: "Sentiment" = proto.Field(
        proto.MESSAGE,
        number=6,
        message="Sentiment",
    )


class Token(proto.Message):
    r"""Represents the smallest syntactic building block of the text.

    Attributes:
        text (google.cloud.language_v1.types.TextSpan):
            The token text.
        part_of_speech (google.cloud.language_v1.types.PartOfSpeech):
            Parts of speech tag for this token.
        dependency_edge (google.cloud.language_v1.types.DependencyEdge):
            Dependency tree parse for this token.
        lemma (str):
            `Lemma <https://en.wikipedia.org/wiki/Lemma_%28morphology%29>`__
            of the token.
    """

    text: "TextSpan" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="TextSpan",
    )
    part_of_speech: "PartOfSpeech" = proto.Field(
        proto.MESSAGE,
        number=2,
        message="PartOfSpeech",
    )
    dependency_edge: "DependencyEdge" = proto.Field(
        proto.MESSAGE,
        number=3,
        message="DependencyEdge",
    )
    lemma: str = proto.Field(
        proto.STRING,
        number=4,
    )


class Sentiment(proto.Message):
    r"""Represents the feeling associated with the entire text or
    entities in the text.

    Attributes:
        magnitude (float):
            A non-negative number in the [0, +inf) range, which
            represents the absolute magnitude of sentiment regardless of
            score (positive or negative).
        score (float):
            Sentiment score between -1.0 (negative
            sentiment) and 1.0 (positive sentiment).
    """

    magnitude: float = proto.Field(
        proto.FLOAT,
        number=2,
    )
    score: float = proto.Field(
        proto.FLOAT,
        number=3,
    )


class PartOfSpeech(proto.Message):
    r"""Represents part of speech information for a token. Parts of speech
    are as defined in
    http://www.lrec-conf.org/proceedings/lrec2012/pdf/274_Paper.pdf

    Attributes:
        tag (google.cloud.language_v1.types.PartOfSpeech.Tag):
            The part of speech tag.
        aspect (google.cloud.language_v1.types.PartOfSpeech.Aspect):
            The grammatical aspect.
        case (google.cloud.language_v1.types.PartOfSpeech.Case):
            The grammatical case.
        form (google.cloud.language_v1.types.PartOfSpeech.Form):
            The grammatical form.
        gender (google.cloud.language_v1.types.PartOfSpeech.Gender):
            The grammatical gender.
        mood (google.cloud.language_v1.types.PartOfSpeech.Mood):
            The grammatical mood.
        number (google.cloud.language_v1.types.PartOfSpeech.Number):
            The grammatical number.
        person (google.cloud.language_v1.types.PartOfSpeech.Person):
            The grammatical person.
        proper (google.cloud.language_v1.types.PartOfSpeech.Proper):
            The grammatical properness.
        reciprocity (google.cloud.language_v1.types.PartOfSpeech.Reciprocity):
            The grammatical reciprocity.
        tense (google.cloud.language_v1.types.PartOfSpeech.Tense):
            The grammatical tense.
        voice (google.cloud.language_v1.types.PartOfSpeech.Voice):
            The grammatical voice.
    """

    class Tag(proto.Enum):
        r"""The part of speech tags enum.

        Values:
            UNKNOWN (0):
                Unknown
            ADJ (1):
                Adjective
            ADP (2):
                Adposition (preposition and postposition)
            ADV (3):
                Adverb
            CONJ (4):
                Conjunction
            DET (5):
                Determiner
            NOUN (6):
                Noun (common and proper)
            NUM (7):
                Cardinal number
            PRON (8):
                Pronoun
            PRT (9):
                Particle or other function word
            PUNCT (10):
                Punctuation
            VERB (11):
                Verb (all tenses and modes)
            X (12):
                Other: foreign words, typos, abbreviations
            AFFIX (13):
                Affix
        """
        UNKNOWN = 0
        ADJ = 1
        ADP = 2
        ADV = 3
        CONJ = 4
        DET = 5
        NOUN = 6
        NUM = 7
        PRON = 8
        PRT = 9
        PUNCT = 10
        VERB = 11
        X = 12
        AFFIX = 13

    class Aspect(proto.Enum):
        r"""The characteristic of a verb that expresses time flow during
        an event.

        Values:
            ASPECT_UNKNOWN (0):
                Aspect is not applicable in the analyzed
                language or is not predicted.
            PERFECTIVE (1):
                Perfective
            IMPERFECTIVE (2):
                Imperfective
            PROGRESSIVE (3):
                Progressive
        """
        ASPECT_UNKNOWN = 0
        PERFECTIVE = 1
        IMPERFECTIVE = 2
        PROGRESSIVE = 3

    class Case(proto.Enum):
        r"""The grammatical function performed by a noun or pronoun in a
        phrase, clause, or sentence. In some languages, other parts of
        speech, such as adjective and determiner, take case inflection
        in agreement with the noun.

        Values:
            CASE_UNKNOWN (0):
                Case is not applicable in the analyzed
                language or is not predicted.
            ACCUSATIVE (1):
                Accusative
            ADVERBIAL (2):
                Adverbial
            COMPLEMENTIVE (3):
                Complementive
            DATIVE (4):
                Dative
            GENITIVE (5):
                Genitive
            INSTRUMENTAL (6):
                Instrumental
            LOCATIVE (7):
                Locative
            NOMINATIVE (8):
                Nominative
            OBLIQUE (9):
                Oblique
            PARTITIVE (10):
                Partitive
            PREPOSITIONAL (11):
                Prepositional
            REFLEXIVE_CASE (12):
                Reflexive
            RELATIVE_CASE (13):
                Relative
            VOCATIVE (14):
                Vocative
        """
        CASE_UNKNOWN = 0
        ACCUSATIVE = 1
        ADVERBIAL = 2
        COMPLEMENTIVE = 3
        DATIVE = 4
        GENITIVE = 5
        INSTRUMENTAL = 6
        LOCATIVE = 7
        NOMINATIVE = 8
        OBLIQUE = 9
        PARTITIVE = 10
        PREPOSITIONAL = 11
        REFLEXIVE_CASE = 12
        RELATIVE_CASE = 13
        VOCATIVE = 14

    class Form(proto.Enum):
        r"""Depending on the language, Form can be categorizing different
        forms of verbs, adjectives, adverbs, etc. For example,
        categorizing inflected endings of verbs and adjectives or
        distinguishing between short and long forms of adjectives and
        participles

        Values:
            FORM_UNKNOWN (0):
                Form is not applicable in the analyzed
                language or is not predicted.
            ADNOMIAL (1):
                Adnomial
            AUXILIARY (2):
                Auxiliary
            COMPLEMENTIZER (3):
                Complementizer
            FINAL_ENDING (4):
                Final ending
            GERUND (5):
                Gerund
            REALIS (6):
                Realis
            IRREALIS (7):
                Irrealis
            SHORT (8):
                Short form
            LONG (9):
                Long form
            ORDER (10):
                Order form
            SPECIFIC (11):
                Specific form
        """
        FORM_UNKNOWN = 0
        ADNOMIAL = 1
        AUXILIARY = 2
        COMPLEMENTIZER = 3
        FINAL_ENDING = 4
        GERUND = 5
        REALIS = 6
        IRREALIS = 7
        SHORT = 8
        LONG = 9
        ORDER = 10
        SPECIFIC = 11

    class Gender(proto.Enum):
        r"""Gender classes of nouns reflected in the behaviour of
        associated words.

        Values:
            GENDER_UNKNOWN (0):
                Gender is not applicable in the analyzed
                language or is not predicted.
            FEMININE (1):
                Feminine
            MASCULINE (2):
                Masculine
            NEUTER (3):
                Neuter
        """
        GENDER_UNKNOWN = 0
        FEMININE = 1
        MASCULINE = 2
        NEUTER = 3

    class Mood(proto.Enum):
        r"""The grammatical feature of verbs, used for showing modality
        and attitude.

        Values:
            MOOD_UNKNOWN (0):
                Mood is not applicable in the analyzed
                language or is not predicted.
            CONDITIONAL_MOOD (1):
                Conditional
            IMPERATIVE (2):
                Imperative
            INDICATIVE (3):
                Indicative
            INTERROGATIVE (4):
                Interrogative
            JUSSIVE (5):
                Jussive
            SUBJUNCTIVE (6):
                Subjunctive
        """
        MOOD_UNKNOWN = 0
        CONDITIONAL_MOOD = 1
        IMPERATIVE = 2
        INDICATIVE = 3
        INTERROGATIVE = 4
        JUSSIVE = 5
        SUBJUNCTIVE = 6

    class Number(proto.Enum):
        r"""Count distinctions.

        Values:
            NUMBER_UNKNOWN (0):
                Number is not applicable in the analyzed
                language or is not predicted.
            SINGULAR (1):
                Singular
            PLURAL (2):
                Plural
            DUAL (3):
                Dual
        """
        NUMBER_UNKNOWN = 0
        SINGULAR = 1
        PLURAL = 2
        DUAL = 3

    class Person(proto.Enum):
        r"""The distinction between the speaker, second person, third
        person, etc.

        Values:
            PERSON_UNKNOWN (0):
                Person is not applicable in the analyzed
                language or is not predicted.
            FIRST (1):
                First
            SECOND (2):
                Second
            THIRD (3):
                Third
            REFLEXIVE_PERSON (4):
                Reflexive
        """
        PERSON_UNKNOWN = 0
        FIRST = 1
        SECOND = 2
        THIRD = 3
        REFLEXIVE_PERSON = 4

    class Proper(proto.Enum):
        r"""This category shows if the token is part of a proper name.

        Values:
            PROPER_UNKNOWN (0):
                Proper is not applicable in the analyzed
                language or is not predicted.
            PROPER (1):
                Proper
            NOT_PROPER (2):
                Not proper
        """
        PROPER_UNKNOWN = 0
        PROPER = 1
        NOT_PROPER = 2

    class Reciprocity(proto.Enum):
        r"""Reciprocal features of a pronoun.

        Values:
            RECIPROCITY_UNKNOWN (0):
                Reciprocity is not applicable in the analyzed
                language or is not predicted.
            RECIPROCAL (1):
                Reciprocal
            NON_RECIPROCAL (2):
                Non-reciprocal
        """
        RECIPROCITY_UNKNOWN = 0
        RECIPROCAL = 1
        NON_RECIPROCAL = 2

    class Tense(proto.Enum):
        r"""Time reference.

        Values:
            TENSE_UNKNOWN (0):
                Tense is not applicable in the analyzed
                language or is not predicted.
            CONDITIONAL_TENSE (1):
                Conditional
            FUTURE (2):
                Future
            PAST (3):
                Past
            PRESENT (4):
                Present
            IMPERFECT (5):
                Imperfect
            PLUPERFECT (6):
                Pluperfect
        """
        TENSE_UNKNOWN = 0
        CONDITIONAL_TENSE = 1
        FUTURE = 2
        PAST = 3
        PRESENT = 4
        IMPERFECT = 5
        PLUPERFECT = 6

    class Voice(proto.Enum):
        r"""The relationship between the action that a verb expresses and
        the participants identified by its arguments.

        Values:
            VOICE_UNKNOWN (0):
                Voice is not applicable in the analyzed
                language or is not predicted.
            ACTIVE (1):
                Active
            CAUSATIVE (2):
                Causative
            PASSIVE (3):
                Passive
        """
        VOICE_UNKNOWN = 0
        ACTIVE = 1
        CAUSATIVE = 2
        PASSIVE = 3

    tag: Tag = proto.Field(
        proto.ENUM,
        number=1,
        enum=Tag,
    )
    aspect: Aspect = proto.Field(
        proto.ENUM,
        number=2,
        enum=Aspect,
    )
    case: Case = proto.Field(
        proto.ENUM,
        number=3,
        enum=Case,
    )
    form: Form = proto.Field(
        proto.ENUM,
        number=4,
        enum=Form,
    )
    gender: Gender = proto.Field(
        proto.ENUM,
        number=5,
        enum=Gender,
    )
    mood: Mood = proto.Field(
        proto.ENUM,
        number=6,
        enum=Mood,
    )
    number: Number = proto.Field(
        proto.ENUM,
        number=7,
        enum=Number,
    )
    person: Person = proto.Field(
        proto.ENUM,
        number=8,
        enum=Person,
    )
    proper: Proper = proto.Field(
        proto.ENUM,
        number=9,
        enum=Proper,
    )
    reciprocity: Reciprocity = proto.Field(
        proto.ENUM,
        number=10,
        enum=Reciprocity,
    )
    tense: Tense = proto.Field(
        proto.ENUM,
        number=11,
        enum=Tense,
    )
    voice: Voice = proto.Field(
        proto.ENUM,
        number=12,
        enum=Voice,
    )


class DependencyEdge(proto.Message):
    r"""Represents dependency parse tree information for a token.
    (For more information on dependency labels, see
    http://www.aclweb.org/anthology/P13-2017

    Attributes:
        head_token_index (int):
            Represents the head of this token in the dependency tree.
            This is the index of the token which has an arc going to
            this token. The index is the position of the token in the
            array of tokens returned by the API method. If this token is
            a root token, then the ``head_token_index`` is its own
            index.
        label (google.cloud.language_v1.types.DependencyEdge.Label):
            The parse label for the token.
    """

    class Label(proto.Enum):
        r"""The parse label enum for the token.

        Values:
            UNKNOWN (0):
                Unknown
            ABBREV (1):
                Abbreviation modifier
            ACOMP (2):
                Adjectival complement
            ADVCL (3):
                Adverbial clause modifier
            ADVMOD (4):
                Adverbial modifier
            AMOD (5):
                Adjectival modifier of an NP
            APPOS (6):
                Appositional modifier of an NP
            ATTR (7):
                Attribute dependent of a copular verb
            AUX (8):
                Auxiliary (non-main) verb
            AUXPASS (9):
                Passive auxiliary
            CC (10):
                Coordinating conjunction
            CCOMP (11):
                Clausal complement of a verb or adjective
            CONJ (12):
                Conjunct
            CSUBJ (13):
                Clausal subject
            CSUBJPASS (14):
                Clausal passive subject
            DEP (15):
                Dependency (unable to determine)
            DET (16):
                Determiner
            DISCOURSE (17):
                Discourse
            DOBJ (18):
                Direct object
            EXPL (19):
                Expletive
            GOESWITH (20):
                Goes with (part of a word in a text not well
                edited)
            IOBJ (21):
                Indirect object
            MARK (22):
                Marker (word introducing a subordinate
                clause)
            MWE (23):
                Multi-word expression
            MWV (24):
                Multi-word verbal expression
            NEG (25):
                Negation modifier
            NN (26):
                Noun compound modifier
            NPADVMOD (27):
                Noun phrase used as an adverbial modifier
            NSUBJ (28):
                Nominal subject
            NSUBJPASS (29):
                Passive nominal subject
            NUM (30):
                Numeric modifier of a noun
            NUMBER (31):
                Element of compound number
            P (32):
                Punctuation mark
            PARATAXIS (33):
                Parataxis relation
            PARTMOD (34):
                Participial modifier
            PCOMP (35):
                The complement of a preposition is a clause
            POBJ (36):
                Object of a preposition
            POSS (37):
                Possession modifier
            POSTNEG (38):
                Postverbal negative particle
            PRECOMP (39):
                Predicate complement
            PRECONJ (40):
                Preconjunt
            PREDET (41):
                Predeterminer
            PREF (42):
                Prefix
            PREP (43):
                Prepositional modifier
            PRONL (44):
                The relationship between a verb and verbal
                morpheme
            PRT (45):
                Particle
            PS (46):
                Associative or possessive marker
            QUANTMOD (47):
                Quantifier phrase modifier
            RCMOD (48):
                Relative clause modifier
            RCMODREL (49):
                Complementizer in relative clause
            RDROP (50):
                Ellipsis without a preceding predicate
            REF (51):
                Referent
            REMNANT (52):
                Remnant
            REPARANDUM (53):
                Reparandum
            ROOT (54):
                Root
            SNUM (55):
                Suffix specifying a unit of number
            SUFF (56):
                Suffix
            TMOD (57):
                Temporal modifier
            TOPIC (58):
                Topic marker
            VMOD (59):
                Clause headed by an infinite form of the verb
                that modifies a noun
            VOCATIVE (60):
                Vocative
            XCOMP (61):
                Open clausal complement
            SUFFIX (62):
                Name suffix
            TITLE (63):
                Name title
            ADVPHMOD (64):
                Adverbial phrase modifier
            AUXCAUS (65):
                Causative auxiliary
            AUXVV (66):
                Helper auxiliary
            DTMOD (67):
                Rentaishi (Prenominal modifier)
            FOREIGN (68):
                Foreign words
            KW (69):
                Keyword
            LIST (70):
                List for chains of comparable items
            NOMC (71):
                Nominalized clause
            NOMCSUBJ (72):
                Nominalized clausal subject
            NOMCSUBJPASS (73):
                Nominalized clausal passive
            NUMC (74):
                Compound of numeric modifier
            COP (75):
                Copula
            DISLOCATED (76):
                Dislocated relation (for fronted/topicalized
                elements)
            ASP (77):
                Aspect marker
            GMOD (78):
                Genitive modifier
            GOBJ (79):
                Genitive object
            INFMOD (80):
                Infinitival modifier
            MES (81):
                Measure
            NCOMP (82):
                Nominal complement of a noun
        """
        UNKNOWN = 0
        ABBREV = 1
        ACOMP = 2
        ADVCL = 3
        ADVMOD = 4
        AMOD = 5
        APPOS = 6
        ATTR = 7
        AUX = 8
        AUXPASS = 9
        CC = 10
        CCOMP = 11
        CONJ = 12
        CSUBJ = 13
        CSUBJPASS = 14
        DEP = 15
        DET = 16
        DISCOURSE = 17
        DOBJ = 18
        EXPL = 19
        GOESWITH = 20
        IOBJ = 21
        MARK = 22
        MWE = 23
        MWV = 24
        NEG = 25
        NN = 26
        NPADVMOD = 27
        NSUBJ = 28
        NSUBJPASS = 29
        NUM = 30
        NUMBER = 31
        P = 32
        PARATAXIS = 33
        PARTMOD = 34
        PCOMP = 35
        POBJ = 36
        POSS = 37
        POSTNEG = 38
        PRECOMP = 39
        PRECONJ = 40
        PREDET = 41
        PREF = 42
        PREP = 43
        PRONL = 44
        PRT = 45
        PS = 46
        QUANTMOD = 47
        RCMOD = 48
        RCMODREL = 49
        RDROP = 50
        REF = 51
        REMNANT = 52
        REPARANDUM = 53
        ROOT = 54
        SNUM = 55
        SUFF = 56
        TMOD = 57
        TOPIC = 58
        VMOD = 59
        VOCATIVE = 60
        XCOMP = 61
        SUFFIX = 62
        TITLE = 63
        ADVPHMOD = 64
        AUXCAUS = 65
        AUXVV = 66
        DTMOD = 67
        FOREIGN = 68
        KW = 69
        LIST = 70
        NOMC = 71
        NOMCSUBJ = 72
        NOMCSUBJPASS = 73
        NUMC = 74
        COP = 75
        DISLOCATED = 76
        ASP = 77
        GMOD = 78
        GOBJ = 79
        INFMOD = 80
        MES = 81
        NCOMP = 82

    head_token_index: int = proto.Field(
        proto.INT32,
        number=1,
    )
    label: Label = proto.Field(
        proto.ENUM,
        number=2,
        enum=Label,
    )


class EntityMention(proto.Message):
    r"""Represents a mention for an entity in the text. Currently,
    proper noun mentions are supported.

    Attributes:
        text (google.cloud.language_v1.types.TextSpan):
            The mention text.
        type_ (google.cloud.language_v1.types.EntityMention.Type):
            The type of the entity mention.
        sentiment (google.cloud.language_v1.types.Sentiment):
            For calls to [AnalyzeEntitySentiment][] or if
            [AnnotateTextRequest.Features.extract_entity_sentiment][google.cloud.language.v1.AnnotateTextRequest.Features.extract_entity_sentiment]
            is set to true, this field will contain the sentiment
            expressed for this mention of the entity in the provided
            document.
    """

    class Type(proto.Enum):
        r"""The supported types of mentions.

        Values:
            TYPE_UNKNOWN (0):
                Unknown
            PROPER (1):
                Proper name
            COMMON (2):
                Common noun (or noun compound)
        """
        TYPE_UNKNOWN = 0
        PROPER = 1
        COMMON = 2

    text: "TextSpan" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="TextSpan",
    )
    type_: Type = proto.Field(
        proto.ENUM,
        number=2,
        enum=Type,
    )
    sentiment: "Sentiment" = proto.Field(
        proto.MESSAGE,
        number=3,
        message="Sentiment",
    )


class TextSpan(proto.Message):
    r"""Represents an output piece of text.

    Attributes:
        content (str):
            The content of the output text.
        begin_offset (int):
            The API calculates the beginning offset of the content in
            the original document according to the
            [EncodingType][google.cloud.language.v1.EncodingType]
            specified in the API request.
    """

    content: str = proto.Field(
        proto.STRING,
        number=1,
    )
    begin_offset: int = proto.Field(
        proto.INT32,
        number=2,
    )


class ClassificationCategory(proto.Message):
    r"""Represents a category returned from the text classifier.

    Attributes:
        name (str):
            The name of the category representing the
            document.
        confidence (float):
            The classifier's confidence of the category.
            Number represents how certain the classifier is
            that this category represents the given text.
    """

    name: str = proto.Field(
        proto.STRING,
        number=1,
    )
    confidence: float = proto.Field(
        proto.FLOAT,
        number=2,
    )


class ClassificationModelOptions(proto.Message):
    r"""Model options available for classification requests.

    This message has `oneof`_ fields (mutually exclusive fields).
    For each oneof, at most one member field can be set at the same time.
    Setting any member of the oneof automatically clears all other
    members.

    .. _oneof: https://proto-plus-python.readthedocs.io/en/stable/fields.html#oneofs-mutually-exclusive-fields

    Attributes:
        v1_model (google.cloud.language_v1.types.ClassificationModelOptions.V1Model):
            Setting this field will use the V1 model and
            V1 content categories version. The V1 model is a
            legacy model; support for this will be
            discontinued in the future.

            This field is a member of `oneof`_ ``model_type``.
        v2_model (google.cloud.language_v1.types.ClassificationModelOptions.V2Model):
            Setting this field will use the V2 model with
            the appropriate content categories version. The
            V2 model is a better performing model.

            This field is a member of `oneof`_ ``model_type``.
    """

    class V1Model(proto.Message):
        r"""Options for the V1 model."""

    class V2Model(proto.Message):
        r"""Options for the V2 model.

        Attributes:
            content_categories_version (google.cloud.language_v1.types.ClassificationModelOptions.V2Model.ContentCategoriesVersion):
                The content categories used for
                classification.
        """

        class ContentCategoriesVersion(proto.Enum):
            r"""The content categories used for classification.

            Values:
                CONTENT_CATEGORIES_VERSION_UNSPECIFIED (0):
                    If ``ContentCategoriesVersion`` is not specified, this
                    option will default to ``V1``.
                V1 (1):
                    Legacy content categories of our initial
                    launch in 2017.
                V2 (2):
                    Updated content categories in 2022.
            """
            CONTENT_CATEGORIES_VERSION_UNSPECIFIED = 0
            V1 = 1
            V2 = 2

        content_categories_version: "ClassificationModelOptions.V2Model.ContentCategoriesVersion" = proto.Field(
            proto.ENUM,
            number=1,
            enum="ClassificationModelOptions.V2Model.ContentCategoriesVersion",
        )

    v1_model: V1Model = proto.Field(
        proto.MESSAGE,
        number=1,
        oneof="model_type",
        message=V1Model,
    )
    v2_model: V2Model = proto.Field(
        proto.MESSAGE,
        number=2,
        oneof="model_type",
        message=V2Model,
    )


class AnalyzeSentimentRequest(proto.Message):
    r"""The sentiment analysis request message.

    Attributes:
        document (google.cloud.language_v1.types.Document):
            Required. Input document.
        encoding_type (google.cloud.language_v1.types.EncodingType):
            The encoding type used by the API to
            calculate sentence offsets.
    """

    document: "Document" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="Document",
    )
    encoding_type: "EncodingType" = proto.Field(
        proto.ENUM,
        number=2,
        enum="EncodingType",
    )


class AnalyzeSentimentResponse(proto.Message):
    r"""The sentiment analysis response message.

    Attributes:
        document_sentiment (google.cloud.language_v1.types.Sentiment):
            The overall sentiment of the input document.
        language (str):
            The language of the text, which will be the same as the
            language specified in the request or, if not specified, the
            automatically-detected language. See
            [Document.language][google.cloud.language.v1.Document.language]
            field for more details.
        sentences (MutableSequence[google.cloud.language_v1.types.Sentence]):
            The sentiment for all the sentences in the
            document.
    """

    document_sentiment: "Sentiment" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="Sentiment",
    )
    language: str = proto.Field(
        proto.STRING,
        number=2,
    )
    sentences: MutableSequence["Sentence"] = proto.RepeatedField(
        proto.MESSAGE,
        number=3,
        message="Sentence",
    )


class AnalyzeEntitySentimentRequest(proto.Message):
    r"""The entity-level sentiment analysis request message.

    Attributes:
        document (google.cloud.language_v1.types.Document):
            Required. Input document.
        encoding_type (google.cloud.language_v1.types.EncodingType):
            The encoding type used by the API to
            calculate offsets.
    """

    document: "Document" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="Document",
    )
    encoding_type: "EncodingType" = proto.Field(
        proto.ENUM,
        number=2,
        enum="EncodingType",
    )


class AnalyzeEntitySentimentResponse(proto.Message):
    r"""The entity-level sentiment analysis response message.

    Attributes:
        entities (MutableSequence[google.cloud.language_v1.types.Entity]):
            The recognized entities in the input document
            with associated sentiments.
        language (str):
            The language of the text, which will be the same as the
            language specified in the request or, if not specified, the
            automatically-detected language. See
            [Document.language][google.cloud.language.v1.Document.language]
            field for more details.
    """

    entities: MutableSequence["Entity"] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="Entity",
    )
    language: str = proto.Field(
        proto.STRING,
        number=2,
    )


class AnalyzeEntitiesRequest(proto.Message):
    r"""The entity analysis request message.

    Attributes:
        document (google.cloud.language_v1.types.Document):
            Required. Input document.
        encoding_type (google.cloud.language_v1.types.EncodingType):
            The encoding type used by the API to
            calculate offsets.
    """

    document: "Document" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="Document",
    )
    encoding_type: "EncodingType" = proto.Field(
        proto.ENUM,
        number=2,
        enum="EncodingType",
    )


class AnalyzeEntitiesResponse(proto.Message):
    r"""The entity analysis response message.

    Attributes:
        entities (MutableSequence[google.cloud.language_v1.types.Entity]):
            The recognized entities in the input
            document.
        language (str):
            The language of the text, which will be the same as the
            language specified in the request or, if not specified, the
            automatically-detected language. See
            [Document.language][google.cloud.language.v1.Document.language]
            field for more details.
    """

    entities: MutableSequence["Entity"] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="Entity",
    )
    language: str = proto.Field(
        proto.STRING,
        number=2,
    )


class AnalyzeSyntaxRequest(proto.Message):
    r"""The syntax analysis request message.

    Attributes:
        document (google.cloud.language_v1.types.Document):
            Required. Input document.
        encoding_type (google.cloud.language_v1.types.EncodingType):
            The encoding type used by the API to
            calculate offsets.
    """

    document: "Document" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="Document",
    )
    encoding_type: "EncodingType" = proto.Field(
        proto.ENUM,
        number=2,
        enum="EncodingType",
    )


class AnalyzeSyntaxResponse(proto.Message):
    r"""The syntax analysis response message.

    Attributes:
        sentences (MutableSequence[google.cloud.language_v1.types.Sentence]):
            Sentences in the input document.
        tokens (MutableSequence[google.cloud.language_v1.types.Token]):
            Tokens, along with their syntactic
            information, in the input document.
        language (str):
            The language of the text, which will be the same as the
            language specified in the request or, if not specified, the
            automatically-detected language. See
            [Document.language][google.cloud.language.v1.Document.language]
            field for more details.
    """

    sentences: MutableSequence["Sentence"] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="Sentence",
    )
    tokens: MutableSequence["Token"] = proto.RepeatedField(
        proto.MESSAGE,
        number=2,
        message="Token",
    )
    language: str = proto.Field(
        proto.STRING,
        number=3,
    )


class ClassifyTextRequest(proto.Message):
    r"""The document classification request message.

    Attributes:
        document (google.cloud.language_v1.types.Document):
            Required. Input document.
        classification_model_options (google.cloud.language_v1.types.ClassificationModelOptions):
            Model options to use for classification.
            Defaults to v1 options if not specified.
    """

    document: "Document" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="Document",
    )
    classification_model_options: "ClassificationModelOptions" = proto.Field(
        proto.MESSAGE,
        number=3,
        message="ClassificationModelOptions",
    )


class ClassifyTextResponse(proto.Message):
    r"""The document classification response message.

    Attributes:
        categories (MutableSequence[google.cloud.language_v1.types.ClassificationCategory]):
            Categories representing the input document.
    """

    categories: MutableSequence["ClassificationCategory"] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="ClassificationCategory",
    )


class ModerateTextRequest(proto.Message):
    r"""The document moderation request message.

    Attributes:
        document (google.cloud.language_v1.types.Document):
            Required. Input document.
    """

    document: "Document" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="Document",
    )


class ModerateTextResponse(proto.Message):
    r"""The document moderation response message.

    Attributes:
        moderation_categories (MutableSequence[google.cloud.language_v1.types.ClassificationCategory]):
            Harmful and sensitive categories representing
            the input document.
    """

    moderation_categories: MutableSequence[
        "ClassificationCategory"
    ] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="ClassificationCategory",
    )


class AnnotateTextRequest(proto.Message):
    r"""The request message for the text annotation API, which can
    perform multiple analysis types (sentiment, entities, and
    syntax) in one call.

    Attributes:
        document (google.cloud.language_v1.types.Document):
            Required. Input document.
        features (google.cloud.language_v1.types.AnnotateTextRequest.Features):
            Required. The enabled features.
        encoding_type (google.cloud.language_v1.types.EncodingType):
            The encoding type used by the API to
            calculate offsets.
    """

    class Features(proto.Message):
        r"""All available features for sentiment, syntax, and semantic
        analysis. Setting each one to true will enable that specific
        analysis for the input.

        Attributes:
            extract_syntax (bool):
                Extract syntax information.
            extract_entities (bool):
                Extract entities.
            extract_document_sentiment (bool):
                Extract document-level sentiment.
            extract_entity_sentiment (bool):
                Extract entities and their associated
                sentiment.
            classify_text (bool):
                Classify the full document into categories.
            moderate_text (bool):
                Moderate the document for harmful and
                sensitive categories.
            classification_model_options (google.cloud.language_v1.types.ClassificationModelOptions):
                The model options to use for classification. Defaults to v1
                options if not specified. Only used if ``classify_text`` is
                set to true.
        """

        extract_syntax: bool = proto.Field(
            proto.BOOL,
            number=1,
        )
        extract_entities: bool = proto.Field(
            proto.BOOL,
            number=2,
        )
        extract_document_sentiment: bool = proto.Field(
            proto.BOOL,
            number=3,
        )
        extract_entity_sentiment: bool = proto.Field(
            proto.BOOL,
            number=4,
        )
        classify_text: bool = proto.Field(
            proto.BOOL,
            number=6,
        )
        moderate_text: bool = proto.Field(
            proto.BOOL,
            number=11,
        )
        classification_model_options: "ClassificationModelOptions" = proto.Field(
            proto.MESSAGE,
            number=10,
            message="ClassificationModelOptions",
        )

    document: "Document" = proto.Field(
        proto.MESSAGE,
        number=1,
        message="Document",
    )
    features: Features = proto.Field(
        proto.MESSAGE,
        number=2,
        message=Features,
    )
    encoding_type: "EncodingType" = proto.Field(
        proto.ENUM,
        number=3,
        enum="EncodingType",
    )


class AnnotateTextResponse(proto.Message):
    r"""The text annotations response message.

    Attributes:
        sentences (MutableSequence[google.cloud.language_v1.types.Sentence]):
            Sentences in the input document. Populated if the user
            enables
            [AnnotateTextRequest.Features.extract_syntax][google.cloud.language.v1.AnnotateTextRequest.Features.extract_syntax].
        tokens (MutableSequence[google.cloud.language_v1.types.Token]):
            Tokens, along with their syntactic information, in the input
            document. Populated if the user enables
            [AnnotateTextRequest.Features.extract_syntax][google.cloud.language.v1.AnnotateTextRequest.Features.extract_syntax].
        entities (MutableSequence[google.cloud.language_v1.types.Entity]):
            Entities, along with their semantic information, in the
            input document. Populated if the user enables
            [AnnotateTextRequest.Features.extract_entities][google.cloud.language.v1.AnnotateTextRequest.Features.extract_entities].
        document_sentiment (google.cloud.language_v1.types.Sentiment):
            The overall sentiment for the document. Populated if the
            user enables
            [AnnotateTextRequest.Features.extract_document_sentiment][google.cloud.language.v1.AnnotateTextRequest.Features.extract_document_sentiment].
        language (str):
            The language of the text, which will be the same as the
            language specified in the request or, if not specified, the
            automatically-detected language. See
            [Document.language][google.cloud.language.v1.Document.language]
            field for more details.
        categories (MutableSequence[google.cloud.language_v1.types.ClassificationCategory]):
            Categories identified in the input document.
        moderation_categories (MutableSequence[google.cloud.language_v1.types.ClassificationCategory]):
            Harmful and sensitive categories identified
            in the input document.
    """

    sentences: MutableSequence["Sentence"] = proto.RepeatedField(
        proto.MESSAGE,
        number=1,
        message="Sentence",
    )
    tokens: MutableSequence["Token"] = proto.RepeatedField(
        proto.MESSAGE,
        number=2,
        message="Token",
    )
    entities: MutableSequence["Entity"] = proto.RepeatedField(
        proto.MESSAGE,
        number=3,
        message="Entity",
    )
    document_sentiment: "Sentiment" = proto.Field(
        proto.MESSAGE,
        number=4,
        message="Sentiment",
    )
    language: str = proto.Field(
        proto.STRING,
        number=5,
    )
    categories: MutableSequence["ClassificationCategory"] = proto.RepeatedField(
        proto.MESSAGE,
        number=6,
        message="ClassificationCategory",
    )
    moderation_categories: MutableSequence[
        "ClassificationCategory"
    ] = proto.RepeatedField(
        proto.MESSAGE,
        number=7,
        message="ClassificationCategory",
    )


__all__ = tuple(sorted(__protobuf__.manifest))
