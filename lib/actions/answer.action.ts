"use server";

import mongoose from "mongoose";
import { revalidatePath } from "next/cache";

import ROUTES from "@/constants/routes";
import { Question } from "@/database";
import AnswerModel, { IAnswerDoc } from "@/database/answer.model";

import action from "../handlers/action";
import handleError from "../handlers/error";
import { GetAnswersSchema, PostAnswerSchema } from "../validations";
import { ActionResponse, Answer, ErrorResponse } from "@/types/global";
import { CreateAnswerParams, GetAnswersParams } from "@/types/action";

export async function createAnswer(
  params: CreateAnswerParams
): Promise<ActionResponse<IAnswerDoc>> {
  const validatedAnswer = await action({
    params,
    schema: PostAnswerSchema,
    authorize: true,
  });

  if (validatedAnswer instanceof Error) {
    return handleError(validatedAnswer) as ErrorResponse;
  }

  const { content, questionId } = validatedAnswer.params!;
  const userId = validatedAnswer?.session?.user?.id;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const question = await Question.findById(questionId);

    if (!question) throw new Error("Question not found");

    const [newAnswer] = await AnswerModel.create(
      [
        {
          author: userId,
          question: questionId,
          content,
        },
      ],
      { session }
    );

    if (!newAnswer) {
      throw new Error("Failed to create answer");
    }

    question.answers += 1;

    await question.save({ session });

    await session.commitTransaction();

    revalidatePath(ROUTES.QUESTION(questionId));

    return {
      success: true,
      data: JSON.parse(JSON.stringify(newAnswer)),
    };
  } catch (error) {
    await session.abortTransaction();
    return handleError(error) as ErrorResponse;
  } finally {
    await session.endSession();
  }
}

export async function getAnswers(params: GetAnswersParams): Promise<
  ActionResponse<{
    answers: Answer[];
    isNext: boolean;
    totalAnswers: number;
  }>
> {
  const validatedParams = await action({
    params,
    schema: GetAnswersSchema,
  });

  if (validatedParams instanceof Error) {
    return handleError(validatedParams) as ErrorResponse;
  }

  const { questionId, page = 1, itemsPerPage = 10, filter } = params;

  const skipValue = (Number(page) - 1) * itemsPerPage;
  const limitValue = Number(itemsPerPage);

  let sortCriteria = {};

  switch (filter) {
    case "latest":
      sortCriteria = { createdAt: -1 };
      break;
    case "oldest":
      sortCriteria = { createdAt: 1 };
      break;
    case "popular":
      sortCriteria = { upvotes: -1 };
      break;
    default:
      sortCriteria = { createdAt: -1 };
      break;
  }

  try {
    const totalAnswers = await AnswerModel.countDocuments({
      question: questionId,
    });

    const answers = await AnswerModel.find({ question: questionId })
      .populate("author", "_id name image")
      .sort(sortCriteria)
      .skip(skipValue)
      .limit(limitValue);

    const remainingAnswers = skipValue + answers.length;
    const isNext = totalAnswers > remainingAnswers;

    return {
      success: true,
      data: {
        answers: JSON.parse(JSON.stringify(answers)),
        isNext,
        totalAnswers,
      },
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
