import { Document, model, models, Schema, Types } from "mongoose";

export interface ITagQuestion {
  tagId: Types.ObjectId;
  question: Types.ObjectId;
}

export interface ITagQuestionDoc
  extends ITagQuestion,
    Document<Types.ObjectId> {}

const TagQuestionSchema = new Schema({
  tag: { type: Schema.Types.ObjectId, ref: "Tag", required: true },
  question: { type: Schema.Types.ObjectId, ref: "Question", required: true },
});

const TagQuestion =
  models?.TagQuestion || model<ITagQuestion>("TagQuestion", TagQuestionSchema);

export default TagQuestion;
