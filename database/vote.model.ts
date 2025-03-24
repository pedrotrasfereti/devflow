import { Document, model, models, Schema } from "mongoose";

export interface IVote {
  author: Schema.Types.ObjectId;
  targetId: Schema.Types.ObjectId;
  targetType: "Question" | "Answer";
  voteType: "upvote" | "downvote";
}

export interface IVoteDoc extends IVote, Document {}

const VoteSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  targetId: { type: Schema.Types.ObjectId, refPath: "type", required: true },
  targetType: { type: String, required: true, enum: ["Question", "Answer"] },
  voteType: { type: String, required: true, enum: ["upvote", "downvote"] },
});

const Vote = models?.Vote || model<IVote>("Vote", VoteSchema);

export default Vote;
