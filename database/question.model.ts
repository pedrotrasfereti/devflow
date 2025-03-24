import { Document, model, models, Schema } from "mongoose";

export interface IQuestion {
  author: Schema.Types.ObjectId;
  title: string;
  content: string;
  tags: Schema.Types.ObjectId[];
  views: number;
  answers: number;
  upvotes: number;
  downvotes: number;
}

export interface IQuestionDoc extends IQuestion, Document {}

const QuestionSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    tags: [{ type: Schema.Types.ObjectId, ref: "Tag" }],
    views: { type: Number, default: 0 },
    answers: { type: Number, default: 0 },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Question =
  models?.Question || model<IQuestion>("Question", QuestionSchema);

export default Question;
