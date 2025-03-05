import { FilterQuery } from "mongoose";

import { Tag as TagModel, Question as QuestionModel } from "@/database";
import {
  ActionResponse,
  ErrorResponse,
  PaginatedSearchParams,
  Question,
  Tag,
} from "@/types/global";

import action from "../handlers/action";
import handleError from "../handlers/error";
import {
  GetTagQuestionsSchema,
  PaginatedSearchParamsSchema,
} from "../validations";
import { GetTagQuestionsParams } from "@/types/action";

export const getTags = async (
  params: PaginatedSearchParams,
): Promise<ActionResponse<{ tags: Tag[]; isNext: boolean }>> => {
  const validatedParams = await action({
    params,
    schema: PaginatedSearchParamsSchema,
  });

  if (validatedParams instanceof Error) {
    return handleError(validatedParams) as ErrorResponse;
  }

  const { page = 1, itemsPerPage = 10, query, filter } = params;

  const skip = (Number(page) - 1) * itemsPerPage;
  const limit = Number(itemsPerPage);

  const filterQuery: FilterQuery<Tag> = {};

  if (query) {
    filterQuery.$or = [{ name: { $regex: query, $options: "i" } }];
  }

  let sortCriteria = {};

  switch (filter) {
    case "popular":
      sortCriteria = { questions: -1 };
      break;
    case "recent":
      sortCriteria = { createdAt: -1 };
      break;
    case "oldest":
      sortCriteria = { createdAt: 1 };
      break;
    case "name":
      sortCriteria = { name: 1 };
      break;
    default:
      sortCriteria = { questions: -1 };
      break;
  }

  try {
    const totalTags = await TagModel.countDocuments(filterQuery);

    const tags = await TagModel.find(filterQuery)
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit);

    const isNext = totalTags > skip + tags.length;

    return {
      success: true,
      data: {
        tags: JSON.parse(JSON.stringify(tags)),
        isNext,
      },
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
};

export const getTagQuestions = async (
  params: GetTagQuestionsParams,
): Promise<
  ActionResponse<{ tag: Tag; questions: Question[]; isNext: boolean }>
> => {
  const validatedParams = await action({
    params,
    schema: GetTagQuestionsSchema,
  });

  if (validatedParams instanceof Error) {
    return handleError(validatedParams) as ErrorResponse;
  }

  const { tagId, page = 1, itemsPerPage = 10, query } = params;

  const skipValue = (Number(page) - 1) * itemsPerPage;
  const limitValue = Number(itemsPerPage);

  try {
    const tag = await TagModel.findById(tagId);
    if (!tag) throw new Error("Tag not found");

    const filterQuery: FilterQuery<Question> = {
      tags: { $in: [tagId] },
    };

    if (query) {
      filterQuery.title = { $regex: query, $options: "i" };
    }

    const totalQuestions = await QuestionModel.countDocuments(filterQuery);

    const questions = await QuestionModel.find(filterQuery)
      .select("_id title views answers upvotes downvotes author createdAt")
      .populate([
        { path: "author", select: "name image" },
        { path: "tags", select: "name" },
      ])
      .skip(skipValue)
      .limit(limitValue);

    const remainingTags = skipValue + questions.length;
    const isNext = totalQuestions > remainingTags;

    return {
      success: true,
      data: {
        tag: JSON.parse(JSON.stringify(tag)),
        questions: JSON.parse(JSON.stringify(questions)),
        isNext,
      },
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
};
