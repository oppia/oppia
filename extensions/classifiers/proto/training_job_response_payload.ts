import * as pb_1 from "google-protobuf";
export class TrainingJobResponsePayload extends pb_1.Message {
    constructor(data?: any[] | {
        job_result?: TrainingJobResponsePayload.JobResult;
        vm_id?: string;
        signature?: string;
    }) {
        super();
        pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [], null);
        if (!Array.isArray(data) && typeof data == "object") {
            this.job_result = data.job_result;
            this.vm_id = data.vm_id;
            this.signature = data.signature;
        }
    }
    get job_result(): TrainingJobResponsePayload.JobResult {
        return pb_1.Message.getWrapperField(this, TrainingJobResponsePayload.JobResult, 1) as TrainingJobResponsePayload.JobResult;
    }
    set job_result(value: TrainingJobResponsePayload.JobResult) {
        pb_1.Message.setWrapperField(this, 1, value);
    }
    get vm_id(): string {
        return pb_1.Message.getFieldWithDefault(this, 2, undefined) as string;
    }
    set vm_id(value: string) {
        pb_1.Message.setField(this, 2, value);
    }
    get signature(): string {
        return pb_1.Message.getFieldWithDefault(this, 3, undefined) as string;
    }
    set signature(value: string) {
        pb_1.Message.setField(this, 3, value);
    }
    toObject() {
        return {
            job_result: this.job_result && this.job_result.toObject(),
            vm_id: this.vm_id,
            signature: this.signature
        };
    }
    serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
        const writer = w || new pb_1.BinaryWriter();
        if (this.job_result !== undefined)
            writer.writeMessage(1, this.job_result, () => this.job_result.serialize(writer));
        if (typeof this.vm_id === "string" && this.vm_id.length)
            writer.writeString(2, this.vm_id);
        if (typeof this.signature === "string" && this.signature.length)
            writer.writeString(3, this.signature);
        if (!w)
            return writer.getResultBuffer();
    }
    serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
    static deserialize(bytes: Uint8Array | pb_1.BinaryReader): TrainingJobResponsePayload {
        const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new TrainingJobResponsePayload();
        while (reader.nextField()) {
            if (reader.isEndGroup())
                break;
            switch (reader.getFieldNumber()) {
                case 1:
                    reader.readMessage(message.job_result, () => message.job_result = TrainingJobResponsePayload.JobResult.deserialize(reader));
                    break;
                case 2:
                    message.vm_id = reader.readString();
                    break;
                case 3:
                    message.signature = reader.readString();
                    break;
                default: reader.skipField();
            }
        }
        return message;
    }
}
export namespace TrainingJobResponsePayload {
    export class JobResult extends pb_1.Message {
        constructor(data?: any[] | {
            job_id?: string;
            text_classifier?: TextClassifierFrozenModel;
        }) {
            super();
            pb_1.Message.initialize(this, Array.isArray(data) && data, 0, -1, [], null);
            if (!Array.isArray(data) && typeof data == "object") {
                this.job_id = data.job_id;
                this.text_classifier = data.text_classifier;
            }
        }
        get job_id(): string {
            return pb_1.Message.getFieldWithDefault(this, 1, undefined) as string;
        }
        set job_id(value: string) {
            pb_1.Message.setField(this, 1, value);
        }
        get text_classifier(): TextClassifierFrozenModel {
            return pb_1.Message.getWrapperField(this, TextClassifierFrozenModel, 2) as TextClassifierFrozenModel;
        }
        set text_classifier(value: TextClassifierFrozenModel) {
            pb_1.Message.setWrapperField(this, 2, value);
        }
        toObject() {
            return {
                job_id: this.job_id,
                text_classifier: this.text_classifier && this.text_classifier.toObject()
            };
        }
        serialize(w?: pb_1.BinaryWriter): Uint8Array | undefined {
            const writer = w || new pb_1.BinaryWriter();
            if (typeof this.job_id === "string" && this.job_id.length)
                writer.writeString(1, this.job_id);
            if (this.text_classifier !== undefined)
                writer.writeMessage(2, this.text_classifier, () => this.text_classifier.serialize(writer));
            if (!w)
                return writer.getResultBuffer();
        }
        serializeBinary(): Uint8Array { throw new Error("Method not implemented."); }
        static deserialize(bytes: Uint8Array | pb_1.BinaryReader): JobResult {
            const reader = bytes instanceof Uint8Array ? new pb_1.BinaryReader(bytes) : bytes, message = new JobResult();
            while (reader.nextField()) {
                if (reader.isEndGroup())
                    break;
                switch (reader.getFieldNumber()) {
                    case 1:
                        message.job_id = reader.readString();
                        break;
                    case 2:
                        reader.readMessage(message.text_classifier, () => message.text_classifier = TextClassifierFrozenModel.deserialize(reader));
                        break;
                    default: reader.skipField();
                }
            }
            return message;
        }
    }
}
