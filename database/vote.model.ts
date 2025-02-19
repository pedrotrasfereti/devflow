import { model, models, Schema, Types } from "mongoose";

export interface IVote {
  author: Types.ObjectId;
  id: Types.ObjectId;
  type: "Question" | "Answer";
  voteType: "upvote" | "downvote";
}

const VoteSchema = new Schema({
  author: { type: Types.ObjectId, ref: "User", required: true },
  id: { type: Types.ObjectId, refPath: "type", required: true },
  type: { type: String, required: true, enum: ["Question", "Answer"] },
  voteType: { type: String, required: true, enum: ["upvote", "downvote"] },
});

const Vote = models?.vote || model<IVote>("Vote", VoteSchema);

export default Vote;
