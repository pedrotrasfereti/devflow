"use server";

import {
  ActionResponse,
  ErrorResponse,
  PaginatedSearchParams,
  Question,
  User,
  UserDetails,
} from "@/types/global";
import {
  GetUserQuestionsSchema,
  GetUserSchema,
  PaginatedSearchParamsSchema,
} from "../validations";
import action from "../handlers/action";
import handleError from "../handlers/error";
import { FilterQuery } from "mongoose";
import {
  Answer as AnswerModel,
  Question as QuestionModel,
  User as UserModel,
} from "@/database";
import { GetUserParams, GetUserQuestionsParams } from "@/types/action";

export async function getUsers(
  params: PaginatedSearchParams
): Promise<ActionResponse<{ users: User[]; isNext: boolean }>> {
  const validatedRequest = await action({
    params,
    schema: PaginatedSearchParamsSchema,
  });

  if (validatedRequest instanceof Error) {
    return handleError(validatedRequest) as ErrorResponse;
  }

  const { page = 1, itemsPerPage = 10, query, filter } = params;

  const skipValue = (Number(page) - 1) * itemsPerPage;
  const limitValue = Number(itemsPerPage);

  const filterQuery: FilterQuery<User> = {};

  if (query) {
    filterQuery.$or = [
      { name: { $regex: query, $options: "i" } },
      { email: { $regex: query, $options: "i" } },
    ];
  }

  let sortCriteria = {};

  switch (filter) {
    case "newest":
      sortCriteria = { createdAt: -1 };
      break;
    case "oldest":
      sortCriteria = { createdAt: 1 };
      break;
    case "popular":
      sortCriteria = { reputation: -1 };
      break;
    default:
      sortCriteria = { createdAt: -1 };
      break;
  }

  try {
    const totalUsers = await UserModel.countDocuments(filterQuery);

    const users = await UserModel.find(filterQuery)
      .sort(sortCriteria)
      .skip(skipValue)
      .limit(limitValue);

    const isNext = totalUsers > skipValue + users.length;

    return {
      success: true,
      data: { users: JSON.parse(JSON.stringify(users)), isNext },
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function getUserDetails(
  params: GetUserParams
): Promise<ActionResponse<UserDetails>> {
  const validatedRequest = await action({
    params,
    schema: GetUserSchema,
  });

  if (validatedRequest instanceof Error) {
    return handleError(validatedRequest) as ErrorResponse;
  }

  const { userId } = params;

  const user = UserModel.findById(userId);

  if (!user) {
    throw new Error(`User with ID ${userId} not found`);
  }

  const totalQuestions = await QuestionModel.countDocuments({ author: userId });

  const totalAnswers = await AnswerModel.countDocuments({
    author: userId,
  });

  const data = {
    user: JSON.parse(JSON.stringify(user)),
    totalQuestions,
    totalAnswers,
  };

  try {
    return { success: true, data };
  } catch (error) {
    return handleError(validatedRequest) as ErrorResponse;
  }
}

export async function getUserQuestions(
  params: GetUserQuestionsParams
): Promise<ActionResponse<{ questions: Question[]; isNext: boolean }>> {
  const validatedRequest = await action({
    params,
    schema: GetUserQuestionsSchema,
  });

  if (validatedRequest instanceof Error) {
    return handleError(validatedRequest) as ErrorResponse;
  }

  const { userId, page = 1, itemsPerPage = 10 } = params;

  const skipValue = (Number(page) - 1) * Number(itemsPerPage);

  const limitValue = Number(itemsPerPage);

  try {
    const totalQuestions = await QuestionModel.countDocuments({
      author: userId,
    });

    const questions = await QuestionModel.find({ author: userId })
      .populate("tags", "name")
      .populate("author", "name image")
      .sort({ createdAt: -1 })
      .skip(skipValue)
      .limit(limitValue);

    const isNext = totalQuestions > skipValue + questions.length;

    const data = {
      questions: JSON.parse(JSON.stringify(questions)),
      isNext,
    };

    return {
      success: true,
      data,
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
