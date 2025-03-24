import { Document, model, models, Schema, Types } from "mongoose";

export interface IInteraction {
  user: Types.ObjectId;
  action: string;
  actionId: Types.ObjectId;
  actionType: "question" | "answer";
}

export interface IInteractionDoc
  extends IInteraction,
    Document<Types.ObjectId> {}

const InteractionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, required: true },
  actionId: { type: Schema.Types.ObjectId, refPath: "type", required: true },
  actionType: {
    type: String,
    required: true,
    enum: ["Question", "Answer"],
  },
});

const Interaction =
  models?.Interaction || model<IInteraction>("Interaction", InteractionSchema);

export default Interaction;
