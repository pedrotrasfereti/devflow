import { Document, model, models, Schema, Types } from "mongoose";

export interface IVote {
  author: Types.ObjectId;
  targetId: Types.ObjectId;
  targetType: "Question" | "Answer";
  voteType: "upvote" | "downvote";
}

export interface IVoteDoc extends IVote, Document<Types.ObjectId> {}

const VoteSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  targetId: { type: Schema.Types.ObjectId, refPath: "type", required: true },
  targetType: { type: String, required: true, enum: ["Question", "Answer"] },
  voteType: { type: String, required: true, enum: ["upvote", "downvote"] },
});

const Vote = models?.Vote || model<IVote>("Vote", VoteSchema);

export default Vote;
