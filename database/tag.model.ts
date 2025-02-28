import { Document, model, models, Schema } from "mongoose";

export interface ITag {
  name: string;
  questions: number;
}

export interface ITagDoc extends ITag, Document {}

const TagSchema = new Schema({
  name: { type: String, required: true, unique: true },
  questions: { type: Number, default: 0 },
});

const Tag = models?.Tag || model<ITag>("Tag", TagSchema);

export default Tag;
