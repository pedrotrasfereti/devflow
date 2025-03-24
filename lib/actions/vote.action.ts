"use server";

import mongoose, { ClientSession } from "mongoose";
import { revalidatePath } from "next/cache";

import ROUTES from "@/constants/routes";
import {
  Question as QuestionModel,
  Answer as AnswerModel,
  Vote as VoteModel,
} from "@/database";
import {
  CreateVoteParams,
  HasVotedParams,
  HasVotedResponse,
  UpdateVoteCountParams,
} from "@/types/action";
import { ActionResponse, ErrorResponse } from "@/types/global";

import action from "../handlers/action";
import handleError from "../handlers/error";
import {
  CreateVoteSchema,
  HasVotedSchema,
  UpdateVoteCountSchema,
} from "../validations";




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
    return handleError(validatedVote) as ErrorResponse;
  }

  const { targetId, targetType, voteType } = validatedVote.params!;

  const userId = validatedVote.session?.user?.id;

  if (!userId) {
    return handleError(new Error("Unauthorized")) as ErrorResponse;
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

        // Update vote count
        await updateVoteCount({
          targetId,
          targetType,
          voteType: existingVote.voteType,
          change: -1,
        });

        await updateVoteCount({ targetId, targetType, voteType, change: 1 });
      }
    } else {
      // If the user has not voted yet, create a new vote
      await VoteModel.create(
        [{ author: userId, targetId, targetType, voteType, change: 1 }],
        {
          session,
        }
      );

      await updateVoteCount(
        { targetId, targetType, voteType, change: 1 },
        session
      );
    }

    await session.commitTransaction();
    session.endSession();

    revalidatePath(ROUTES.QUESTION(targetId));

    return { success: true };
  } catch (error) {
    await session.abortTransaction();
    return handleError(error) as ErrorResponse;
  } finally {
    await session.endSession();
  }
}

export async function hasVoted(
  params: HasVotedParams
): Promise<ActionResponse<HasVotedResponse>> {
  const validatedParams = await action({
    params,
    schema: HasVotedSchema,
    authorize: true,
  });

  if (validatedParams instanceof Error) {
    return handleError(validatedParams) as ErrorResponse;
  }

  const { targetId, targetType } = validatedParams.params!;

  const userId = validatedParams.session?.user?.id;

  try {
    const vote = await VoteModel.findOne({
      author: userId,
      targetId,
      targetType,
    });

    if (!vote) {
      return {
        success: false,
        data: { hasUpvoted: false, hasDownvoted: false },
      };
    }

    return {
      success: true,
      data: {
        hasUpvoted: vote.voteType === "upvote",
        hasDownvoted: vote.voteType === "downvote",
      },
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
