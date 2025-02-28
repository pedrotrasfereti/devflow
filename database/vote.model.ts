import { model, models, Schema } from "mongoose";

export interface IVote {
  author: Schema.Types.ObjectId;
  id: Schema.Types.ObjectId;
  type: "Question" | "Answer";
  voteType: "upvote" | "downvote";
}

export interface IVoteDoc extends IVote, Document {}

const VoteSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  id: { type: Schema.Types.ObjectId, refPath: "type", required: true },
  type: { type: String, required: true, enum: ["Question", "Answer"] },
  voteType: { type: String, required: true, enum: ["upvote", "downvote"] },
});

const Vote = models?.Vote || model<IVote>("Vote", VoteSchema);

export default Vote;
