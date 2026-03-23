# Copyright 2018 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


from google.cloud.ndb import _legacy_protocol_buffer as ProtocolBuffer


class PropertyValue_ReferenceValuePathElement(ProtocolBuffer.ProtocolMessage):
    has_type_ = 0
    type_ = ""
    has_id_ = 0
    id_ = 0
    has_name_ = 0
    name_ = ""

    def type(self):
        return self.type_

    def set_type(self, x):
        self.has_type_ = 1
        self.type_ = x

    def has_type(self):
        return self.has_type_

    def id(self):
        return self.id_

    def set_id(self, x):
        self.has_id_ = 1
        self.id_ = x

    def has_id(self):
        return self.has_id_

    def name(self):
        return self.name_

    def set_name(self, x):
        self.has_name_ = 1
        self.name_ = x

    def has_name(self):
        return self.has_name_

    def TryMerge(self, d):
        while 1:
            tt = d.getVarInt32()
            if tt == 116:
                break
            if tt == 122:
                self.set_type(d.getPrefixedString())
                continue
            if tt == 128:
                self.set_id(d.getVarInt64())
                continue
            if tt == 138:
                self.set_name(d.getPrefixedString())
                continue

            if tt == 0:
                raise ProtocolBuffer.ProtocolBufferDecodeError
            d.skipData(tt)


class PropertyValue_PointValue(ProtocolBuffer.ProtocolMessage):
    has_x_ = 0
    x_ = 0.0
    has_y_ = 0
    y_ = 0.0

    def x(self):
        return self.x_

    def set_x(self, x):
        self.has_x_ = 1
        self.x_ = x

    def has_x(self):
        return self.has_x_

    def y(self):
        return self.y_

    def set_y(self, x):
        self.has_y_ = 1
        self.y_ = x

    def has_y(self):
        return self.has_y_

    def TryMerge(self, d):
        while 1:
            tt = d.getVarInt32()
            if tt == 44:
                break
            if tt == 49:
                self.set_x(d.getDouble())
                continue
            if tt == 57:
                self.set_y(d.getDouble())
                continue

            if tt == 0:
                raise ProtocolBuffer.ProtocolBufferDecodeError
            d.skipData(tt)


class PropertyValue_ReferenceValue(ProtocolBuffer.ProtocolMessage):
    has_app_ = 0
    app_ = ""
    has_name_space_ = 0
    name_space_ = ""
    has_database_id_ = 0
    database_id_ = ""

    def __init__(self):
        self.pathelement_ = []

    def app(self):
        return self.app_

    def set_app(self, x):
        self.has_app_ = 1
        self.app_ = x

    def has_app(self):
        return self.has_app_

    def name_space(self):
        return self.name_space_

    def set_name_space(self, x):
        self.has_name_space_ = 1
        self.name_space_ = x

    def has_name_space(self):
        return self.has_name_space_

    def pathelement_list(self):
        return self.pathelement_

    def add_pathelement(self):
        x = PropertyValue_ReferenceValuePathElement()
        self.pathelement_.append(x)
        return x

    def database_id(self):
        return self.database_id_

    def set_database_id(self, x):
        self.has_database_id_ = 1
        self.database_id_ = x

    def has_database_id(self):
        return self.has_database_id_

    def TryMerge(self, d):
        while 1:
            tt = d.getVarInt32()
            if tt == 100:
                break
            if tt == 106:
                self.set_app(d.getPrefixedString())
                continue
            if tt == 115:
                self.add_pathelement().TryMerge(d)
                continue
            if tt == 162:
                self.set_name_space(d.getPrefixedString())
                continue
            if tt == 186:
                self.set_database_id(d.getPrefixedString())
                continue

            if tt == 0:
                raise ProtocolBuffer.ProtocolBufferDecodeError
            d.skipData(tt)


class PropertyValue_UserValue(ProtocolBuffer.ProtocolMessage):
    has_email_ = 0
    email_ = ""
    has_auth_domain_ = 0
    auth_domain_ = ""
    has_nickname_ = 0
    nickname_ = ""
    has_gaiaid_ = 0
    gaiaid_ = 0
    has_obfuscated_gaiaid_ = 0
    obfuscated_gaiaid_ = ""

    def email(self):
        return self.email_

    def set_email(self, x):
        self.has_email_ = 1
        self.email_ = x

    def auth_domain(self):
        return self.auth_domain_

    def set_auth_domain(self, x):
        self.has_auth_domain_ = 1
        self.auth_domain_ = x

    def obfuscated_gaiaid(self):
        return self.obfuscated_gaiaid_

    def set_obfuscated_gaiaid(self, x):
        self.has_obfuscated_gaiaid_ = 1
        self.obfuscated_gaiaid_ = x


class PropertyValue(ProtocolBuffer.ProtocolMessage):
    has_int64value_ = 0
    int64value_ = 0
    has_booleanvalue_ = 0
    booleanvalue_ = 0
    has_stringvalue_ = 0
    stringvalue_ = ""
    has_doublevalue_ = 0
    doublevalue_ = 0.0
    has_pointvalue_ = 0
    pointvalue_ = None
    has_uservalue_ = 0
    uservalue_ = None
    has_referencevalue_ = 0
    referencevalue_ = None

    def int64value(self):
        return self.int64value_

    def set_int64value(self, x):
        self.has_int64value_ = 1
        self.int64value_ = x

    def has_int64value(self):
        return self.has_int64value_

    def booleanvalue(self):
        return self.booleanvalue_

    def set_booleanvalue(self, x):
        self.has_booleanvalue_ = 1
        self.booleanvalue_ = x

    def has_booleanvalue(self):
        return self.has_booleanvalue_

    def stringvalue(self):
        return self.stringvalue_

    def set_stringvalue(self, x):
        self.has_stringvalue_ = 1
        self.stringvalue_ = x

    def has_stringvalue(self):
        return self.has_stringvalue_

    def doublevalue(self):
        return self.doublevalue_

    def set_doublevalue(self, x):
        self.has_doublevalue_ = 1
        self.doublevalue_ = x

    def has_doublevalue(self):
        return self.has_doublevalue_

    def pointvalue(self):
        if self.pointvalue_ is None:
            self.pointvalue_ = PropertyValue_PointValue()
        return self.pointvalue_

    def mutable_pointvalue(self):
        self.has_pointvalue_ = 1
        return self.pointvalue()

    def has_pointvalue(self):
        return self.has_pointvalue_

    def referencevalue(self):
        if self.referencevalue_ is None:
            self.referencevalue_ = PropertyValue_ReferenceValue()
        return self.referencevalue_

    def mutable_referencevalue(self):
        self.has_referencevalue_ = 1
        return self.referencevalue()

    def has_referencevalue(self):
        return self.has_referencevalue_

    def uservalue(self):
        if self.uservalue_ is None:
            self.uservalue_ = PropertyValue_UserValue()
        return self.uservalue_

    def mutable_uservalue(self):
        self.has_uservalue_ = 1
        return self.uservalue()

    def has_uservalue(self):
        return self.has_uservalue_

    def TryMerge(self, d):
        while d.avail() > 0:
            tt = d.getVarInt32()
            if tt == 8:
                self.set_int64value(d.getVarInt64())
                continue
            if tt == 16:
                self.set_booleanvalue(d.getBoolean())
                continue
            if tt == 26:
                self.set_stringvalue(d.getPrefixedString())
                continue
            if tt == 33:
                self.set_doublevalue(d.getDouble())
                continue
            if tt == 43:
                self.mutable_pointvalue().TryMerge(d)
                continue
            if tt == 99:
                self.mutable_referencevalue().TryMerge(d)
                continue

            if tt == 0:
                raise ProtocolBuffer.ProtocolBufferDecodeError
            d.skipData(tt)


class Property(ProtocolBuffer.ProtocolMessage):

    NO_MEANING = 0
    BLOB = 14
    TEXT = 15
    BYTESTRING = 16
    ATOM_CATEGORY = 1
    ATOM_LINK = 2
    ATOM_TITLE = 3
    ATOM_CONTENT = 4
    ATOM_SUMMARY = 5
    ATOM_AUTHOR = 6
    GD_WHEN = 7
    GD_EMAIL = 8
    GEORSS_POINT = 9
    GD_IM = 10
    GD_PHONENUMBER = 11
    GD_POSTALADDRESS = 12
    GD_RATING = 13
    BLOBKEY = 17
    ENTITY_PROTO = 19
    INDEX_VALUE = 18
    EMPTY_LIST = 24

    _Meaning_NAMES = {
        0: "NO_MEANING",
        14: "BLOB",
        15: "TEXT",
        16: "BYTESTRING",
        1: "ATOM_CATEGORY",
        2: "ATOM_LINK",
        3: "ATOM_TITLE",
        4: "ATOM_CONTENT",
        5: "ATOM_SUMMARY",
        6: "ATOM_AUTHOR",
        7: "GD_WHEN",
        8: "GD_EMAIL",
        9: "GEORSS_POINT",
        10: "GD_IM",
        11: "GD_PHONENUMBER",
        12: "GD_POSTALADDRESS",
        13: "GD_RATING",
        17: "BLOBKEY",
        19: "ENTITY_PROTO",
        18: "INDEX_VALUE",
        24: "EMPTY_LIST",
    }

    def Meaning_Name(cls, x):
        return cls._Meaning_NAMES.get(x, "")

    Meaning_Name = classmethod(Meaning_Name)

    has_meaning_ = 0
    meaning_ = 0
    has_meaning_uri_ = 0
    meaning_uri_ = ""
    has_name_ = 0
    name_ = ""
    has_value_ = 0
    has_multiple_ = 0
    multiple_ = 0
    has_stashed_ = 0
    stashed_ = -1
    has_computed_ = 0
    computed_ = 0

    def __init__(self):
        self.value_ = PropertyValue()

    def meaning(self):
        return self.meaning_

    def set_meaning(self, x):
        self.has_meaning_ = 1
        self.meaning_ = x

    def has_meaning(self):
        return self.has_meaning_

    def meaning_uri(self):
        return self.meaning_uri_

    def set_meaning_uri(self, x):
        self.has_meaning_uri_ = 1
        self.meaning_uri_ = x

    def has_meaning_uri(self):
        return self.has_meaning_uri_

    def name(self):
        return self.name_

    def set_name(self, x):
        self.has_name_ = 1
        self.name_ = x

    def has_name(self):
        return self.has_name_

    def value(self):
        return self.value_

    def mutable_value(self):
        self.has_value_ = 1
        return self.value_

    def has_value(self):
        return self.has_value_

    def multiple(self):
        return self.multiple_

    def set_multiple(self, x):
        self.has_multiple_ = 1
        self.multiple_ = x

    def has_multiple(self):
        return self.has_multiple_

    def stashed(self):
        return self.stashed_

    def set_stashed(self, x):
        self.has_stashed_ = 1
        self.stashed_ = x

    def has_stashed(self):
        return self.has_stashed_

    def computed(self):
        return self.computed_

    def set_computed(self, x):
        self.has_computed_ = 1
        self.computed_ = x

    def has_computed(self):
        return self.has_computed_

    def TryMerge(self, d):
        while d.avail() > 0:
            tt = d.getVarInt32()
            if tt == 8:
                self.set_meaning(d.getVarInt32())
                continue
            if tt == 18:
                self.set_meaning_uri(d.getPrefixedString())
                continue
            if tt == 26:
                self.set_name(d.getPrefixedString())
                continue
            if tt == 32:
                self.set_multiple(d.getBoolean())
                continue
            if tt == 42:
                length = d.getVarInt32()
                tmp = ProtocolBuffer.Decoder(d.buffer(), d.pos(), d.pos() + length)
                d.skip(length)
                self.mutable_value().TryMerge(tmp)
                continue
            if tt == 48:
                self.set_stashed(d.getVarInt32())
                continue
            if tt == 56:
                self.set_computed(d.getBoolean())
                continue

            if tt == 0:
                raise ProtocolBuffer.ProtocolBufferDecodeError
            d.skipData(tt)


class Path_Element(ProtocolBuffer.ProtocolMessage):
    has_type_ = 0
    type_ = ""
    has_id_ = 0
    id_ = 0
    has_name_ = 0
    name_ = ""

    @property
    def type(self):
        # Force legacy byte-str to be a str.
        if type(self.type_) is bytes:
            return self.type_.decode()
        return self.type_

    def set_type(self, x):
        self.has_type_ = 1
        self.type_ = x

    def has_type(self):
        return self.has_type_

    @property
    def id(self):
        return self.id_

    def set_id(self, x):
        self.has_id_ = 1
        self.id_ = x

    def has_id(self):
        return self.has_id_

    @property
    def name(self):
        return self.name_

    def set_name(self, x):
        self.has_name_ = 1
        self.name_ = x

    def has_name(self):
        return self.has_name_

    def TryMerge(self, d):
        while 1:
            tt = d.getVarInt32()
            if tt == 12:
                break
            if tt == 18:
                self.set_type(d.getPrefixedString())
                continue
            if tt == 24:
                self.set_id(d.getVarInt64())
                continue
            if tt == 34:
                self.set_name(d.getPrefixedString())
                continue

            if tt == 0:
                raise ProtocolBuffer.ProtocolBufferDecodeError
            d.skipData(tt)


class Path(ProtocolBuffer.ProtocolMessage):
    def __init__(self):
        self.element_ = []

    @property
    def element(self):
        return self.element_

    def element_list(self):
        return self.element_

    def element_size(self):
        return len(self.element_)

    def add_element(self):
        x = Path_Element()
        self.element_.append(x)
        return x

    def TryMerge(self, d):
        while d.avail() > 0:
            tt = d.getVarInt32()
            if tt == 11:
                self.add_element().TryMerge(d)
                continue

            if tt == 0:
                raise ProtocolBuffer.ProtocolBufferDecodeError
            d.skipData(tt)


class Reference(ProtocolBuffer.ProtocolMessage):
    has_app_ = 0
    app_ = ""
    has_name_space_ = 0
    name_space_ = ""
    has_path_ = 0
    has_database_id_ = 0
    database_id_ = ""

    def __init__(self):
        self.path_ = Path()

    @property
    def app(self):
        return self.app_

    def set_app(self, x):
        self.has_app_ = 1
        self.app_ = x

    def has_app(self):
        return self.has_app_

    @property
    def name_space(self):
        return self.name_space_

    def set_name_space(self, x):
        self.has_name_space_ = 1
        self.name_space_ = x

    def has_name_space(self):
        return self.has_name_space_

    @property
    def path(self):
        return self.path_

    def mutable_path(self):
        self.has_path_ = 1
        return self.path_

    def has_path(self):
        return self.has_path_

    @property
    def database_id(self):
        return self.database_id_

    def set_database_id(self, x):
        self.has_database_id_ = 1
        self.database_id_ = x

    def has_database_id(self):
        return self.has_database_id_

    def TryMerge(self, d):
        while d.avail() > 0:
            tt = d.getVarInt32()
            if tt == 106:
                self.set_app(d.getPrefixedString())
                continue
            if tt == 114:
                length = d.getVarInt32()
                tmp = ProtocolBuffer.Decoder(d.buffer(), d.pos(), d.pos() + length)
                d.skip(length)
                self.mutable_path().TryMerge(tmp)
                continue
            if tt == 162:
                self.set_name_space(d.getPrefixedString())
                continue
            if tt == 186:
                self.set_database_id(d.getPrefixedString())
                continue

            if tt == 0:
                raise ProtocolBuffer.ProtocolBufferDecodeError
            d.skipData(tt)


class EntityProto(ProtocolBuffer.ProtocolMessage):

    has_key_ = 0
    has_owner_ = 0
    owner_ = None
    has_kind_ = 0
    kind_ = 0
    has_kind_uri_ = 0
    kind_uri_ = ""

    def __init__(self):
        self.key_ = Reference()
        self.property_ = []

    def key(self):
        return self.key_

    def mutable_key(self):
        self.has_key_ = 1
        return self.key_

    def has_key(self):
        return self.has_key_

    def kind(self):
        return self.kind_

    def set_kind(self, x):
        self.has_kind_ = 1
        self.kind_ = x

    def has_kind(self):
        return self.has_kind_

    def kind_uri(self):
        return self.kind_uri_

    def set_kind_uri(self, x):
        self.has_kind_uri_ = 1
        self.kind_uri_ = x

    def has_kind_uri(self):
        return self.has_kind_uri_

    def property_list(self):
        return self.property_

    def add_property(self):
        x = Property()
        self.property_.append(x)
        return x

    def TryMerge(self, d):
        while d.avail() > 0:
            tt = d.getVarInt32()
            if tt == 32:
                self.set_kind(d.getVarInt32())
                continue
            if tt == 42:
                self.set_kind_uri(d.getPrefixedString())
                continue
            if tt == 106:
                length = d.getVarInt32()
                tmp = ProtocolBuffer.Decoder(d.buffer(), d.pos(), d.pos() + length)
                d.skip(length)
                self.mutable_key().TryMerge(tmp)
                continue
            if tt == 114:
                length = d.getVarInt32()
                tmp = ProtocolBuffer.Decoder(d.buffer(), d.pos(), d.pos() + length)
                d.skip(length)
                self.add_property().TryMerge(tmp)
                continue
            if tt == 122:
                length = d.getVarInt32()
                tmp = ProtocolBuffer.Decoder(d.buffer(), d.pos(), d.pos() + length)
                d.skip(length)
                self.add_property().TryMerge(tmp)
                continue

            if tt == 0:
                raise ProtocolBuffer.ProtocolBufferDecodeError
            d.skipData(tt)

    def _get_property_value(self, prop):
        if prop.has_stringvalue():
            return prop.stringvalue()
        if prop.has_int64value():
            return prop.int64value()
        if prop.has_booleanvalue():
            return prop.booleanvalue()
        if prop.has_doublevalue():
            return prop.doublevalue()
        if prop.has_pointvalue():
            return prop.pointvalue()
        if prop.has_referencevalue():
            return prop.referencevalue()
        return None

    def entity_props(self):
        entity_props = {}
        for prop in self.property_list():
            name = prop.name().decode("utf-8")
            entity_props[name] = (
                self._get_property_value(prop.value()) if prop.has_value() else None
            )
        return entity_props


__all__ = [
    "PropertyValue",
    "PropertyValue_ReferenceValuePathElement",
    "PropertyValue_PointValue",
    "PropertyValue_ReferenceValue",
    "Property",
    "Path",
    "Path_Element",
    "Reference",
    "EntityProto",
]
