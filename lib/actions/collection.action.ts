"use server";

import { CollectionBaseParams, CollectionResponse } from "@/types/action";
import {
  ActionResponse,
  Collection,
  ErrorResponse,
  PaginatedSearchParams,
} from "@/types/global";
import action from "../handlers/action";
import {
  CollectionBaseSchema,
  PaginatedSearchParamsSchema,
} from "../validations";
import handleError from "../handlers/error";
import {
  Collection as CollectionModel,
  Question as QuestionModel,
} from "@/database";
import { revalidatePath } from "next/cache";
import ROUTES from "@/constants/routes";
import { FilterQuery } from "mongoose";

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

export async function getSavedQuestions(
  params: PaginatedSearchParams
): Promise<ActionResponse<CollectionResponse>> {
  const validatedParams = await action({
    params,
    schema: PaginatedSearchParamsSchema,
    authorize: true,
  });

  if (validatedParams instanceof Error) {
    return handleError(validatedParams) as ErrorResponse;
  }

  const userId = validatedParams.session?.user?.id;
  const { page = 1, itemsPerPage = 10, query, filter } = params;

  const skipValue = (Number(page) - 1) * itemsPerPage;
  const limitValue = Number(itemsPerPage);

  const filterQuery: FilterQuery<Collection> = { author: userId }; // Saved by user

  if (query) {
    filterQuery.$or = [
      { title: { $regex: query, $options: "i" } },
      { content: { $regex: query, $options: "i" } },
    ];
  }

  let sortCriteria = {};

  switch (filter) {
    case "newest":
      sortCriteria = { createdAt: -1 };
      break;
    case "oldest":
      sortCriteria = { createdAt: -1 };
      break;
    case "mostvoted":
      sortCriteria = { upvotes: -1 };
      break;
    case "mostanswered":
      sortCriteria = { answers: -1 };
      break;
    default:
      sortCriteria = { createdAt: -1 };
      break;
  }

  try {
    const totalQuestions = await QuestionModel.countDocuments(filterQuery);

    const questions = await CollectionModel.find(filterQuery)
      .populate({
        path: "question",
        populate: [
          { path: "tags", select: "_id name" },
          { path: "author", select: "_id name image" },
        ],
      })
      .sort(sortCriteria)
      .skip(skipValue)
      .limit(limitValue);

    const remainingQuestions = skipValue + questions.length;
    const isNext = totalQuestions > remainingQuestions;

    return {
      success: true,
      data: { collection: JSON.parse(JSON.stringify(questions)), isNext },
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
