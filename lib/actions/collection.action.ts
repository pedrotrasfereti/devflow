"use server";

import { CollectionBaseParams } from "@/types/action";
import { ActionResponse, ErrorResponse } from "@/types/global";
import action from "../handlers/action";
import { CollectionBaseSchema } from "../validations";
import handleError from "../handlers/error";
import {
  Collection as CollectionModel,
  Question as QuestionModel,
} from "@/database";
import { revalidatePath } from "next/cache";
import ROUTES from "@/constants/routes";

export async function toggleSaveQuestion(
  params: CollectionBaseParams
): Promise<ActionResponse<{ saved: boolean }>> {
  const validatedParams = await action({
    params,
    schema: CollectionBaseSchema,
    authorize: true,
  });

  if (validatedParams instanceof Error) {
    return handleError(validatedParams) as ErrorResponse;
  }

  const { questionId } = validatedParams.params!;

  const userId = validatedParams.session?.user?.id;

  try {
    const question = await QuestionModel.findById(questionId);

    if (!question) {
      throw new Error("Question not found");
    }

    const collection = await CollectionModel.findOne({
      question: questionId,
      author: userId,
    });

    // If collection was already saved, remove collection
    if (collection) {
      await CollectionModel.findByIdAndDelete(collection.id);

      revalidatePath(ROUTES.QUESTION(questionId));

      return { success: true, data: { saved: false } };
    }

    await CollectionModel.create({
      question: questionId,
      author: userId,
    });

    revalidatePath(ROUTES.QUESTION(questionId));

    return { success: true, data: { saved: true } };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function hasSavedQuestion(
  params: CollectionBaseParams
): Promise<ActionResponse<{ saved: boolean }>> {
  const validatedParams = await action({
    params,
    schema: CollectionBaseSchema,
    authorize: true,
  });

  if (validatedParams instanceof Error) {
    return handleError(validatedParams) as ErrorResponse;
  }

  const { questionId } = validatedParams.params!;
  const userId = validatedParams.session?.user?.id;

  try {
    const collection = await CollectionModel.findOne({
      question: questionId,
      author: userId,
    });

    return {
      success: true,
      data: {
        saved: !!collection,
      },
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
