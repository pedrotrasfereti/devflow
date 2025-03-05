"use server";

import { CreateVoteParams, UpdateVoteCountParams } from "@/types/action";
import { ActionResponse, ErrorResponse } from "@/types/global";
import action from "../handlers/action";
import { CreateVoteSchema, UpdateVoteCountSchema } from "../validations";
import handleError from "../handlers/error";

import VoteModel from "@/database/vote.model";

import mongoose, { ClientSession } from "mongoose";
import { Question as QuestionModel, Answer as AnswerModel } from "@/database";

async function updateVoteCount(
  params: UpdateVoteCountParams,
  session?: ClientSession
): Promise<ActionResponse> {
  const validatedVoteChange = await action({
    params,
    schema: UpdateVoteCountSchema,
  });

  if (validatedVoteChange instanceof Error) {
    return handleError(validatedVoteChange) as ErrorResponse;
  }

  const { targetId, targetType, voteType, change } =
    validatedVoteChange.params!;

  const Model = targetType === "Question" ? QuestionModel : AnswerModel;
  const voteField = voteType === "upvote" ? "upvotes" : "downvotes";

  try {
    const result = await Model.findByIdAndUpdate(
      targetId,
      { $inc: { [voteField]: change } },
      { new: true, session }
    );

    if (!result)
      return handleError(
        new Error("Failed to update vote count")
      ) as ErrorResponse;

    return { success: true };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function createVote(
  params: CreateVoteParams
): Promise<ActionResponse> {
  const validatedVote = await action({
    params,
    schema: CreateVoteSchema,
    authorize: true,
  });

  if (validatedVote instanceof Error) {
    return handleError(validatedVote) as ActionResponse;
  }

  const { targetId, targetType, voteType } = validatedVote.params!;

  const userId = validatedVote.session?.user?.id;

  if (!userId) {
    handleError(new Error("Unauthorized")) as ErrorResponse;
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existingVote = await VoteModel.findOne({
      author: userId,
      targetId,
      targetType,
    }).session(session);

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        /*
          If the user has already voted with the same voteType, remove the vote: "Upvoted" --> "Upvote" or "Downvoted" --> "Downvote"
        */
        await VoteModel.deleteOne({ _id: existingVote._id }).session(session);

        // Decrement vote count
        await updateVoteCount({ targetId, targetType, voteType, change: -1 });
      } else {
        /*
          If the user has already voted with a different voteType, update the vote: "Upvoted" --> "Downvoted" or "Downvoted" --> "Upvoted"
        */
        await VoteModel.findByIdAndUpdate(
          existingVote._id,
          { voteType },
          { new: true, session }
        );

        // Increment vote count
        await updateVoteCount({ targetId, targetType, voteType, change: 1 });
      }
    } else {
      // If the user has not voted yet, create a new vote
      await VoteModel.create([{ targetId, targetType, voteType, change: 1 }], {
        session,
      });

      await updateVoteCount(
        { targetId, targetType, voteType, change: 1 },
        session
      );
    }

    await session.commitTransaction();
    session.endSession();

    return { success: true };
  } catch (error) {
    await session.abortTransaction();
    return handleError(error) as ErrorResponse;
  } finally {
    await session.endSession();
  }
}
