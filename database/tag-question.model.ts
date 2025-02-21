import { model, models, Schema } from "mongoose";

export interface ITagQuestion {
  tagId: Schema.Types.ObjectId;
  question: Schema.Types.ObjectId;
}

export interface ITagQuestionDoc extends ITagQuestion, Document {}

const TagQuestionSchema = new Schema({
  tagId: { type: Schema.Types.ObjectId, ref: "Tag", required: true },
  question: { type: Schema.Types.ObjectId, ref: "Question", required: true },
});

const TagQuestion =
  models?.TagQuestion || model<ITagQuestion>("TagQuestion", TagQuestionSchema);

export default TagQuestion;
