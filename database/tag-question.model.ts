import { model, models, Schema, Types } from "mongoose";

export interface ITagQuestion {
  tagId: Types.ObjectId;
  question: Types.ObjectId;
}

const TagQuestionSchema = new Schema({
  tagId: { type: Types.ObjectId, ref: "Tag", required: true },
  question: { type: Types.ObjectId, ref: "Question", required: true },
});

const TagQuestion =
  models?.TagQuestion || model<ITagQuestion>("TagQuestion", TagQuestionSchema);

export default TagQuestion;
