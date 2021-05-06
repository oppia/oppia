import * as pb_1 from "google-protobuf";
export class TextClassifierFrozenModel extends pb_1.Message {
    constructor(data?: any[] | {
        model_json?: string;
    }) {
        super();
        pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [], null);
        if (!Array.isArray(data) && typeof data == "object") {
            this.model_json = data.model_json;
        }
    }
    get model_json(): string {
        return pb_1.Message.getFieldWithDefault(this, 1, undefined) as string;
    }
    set model_json(value: string) {
        pb_1.Message.setField(this, 1, value);
    }
    toObject() {
        return {
            model_json: this.model_json
        };
    }
    serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
        const writer = w || new pb_1.BinaryWriter();
        if (typeof this.model_json === "string" && this.model_json.length)
            writer.writeString(1, this.model_json);
        if (!w)
            return writer.getResultBuffer();
    }
    serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
    static deserialize(bytes: Uint8Array | pb_1.BinaryReader): TextClassifierFrozenModel {
        const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new TextClassifierFrozenModel();
        while (reader.nextField()) {
            if (reader.isEndGroup())
                break;
            switch (reader.getFieldNumber()) {
                case 1:
                    message.model_json = reader.readString();
                    break;
                default: reader.skipField();
            }
        }
        return message;
    }
}
