"use server";

import mongoose from "mongoose";

import Question from "@/database/question.model";
import TagQuestion from "@/database/tag-question.model";
import Tag from "@/database/tag.model";
import { ActionResponse, ErrorResponse } from "@/types/global";

import action from "../handlers/action";
import handleError from "../handlers/error";
import { AskQuestionSchema } from "../validations";

export async function createQuestion(
  params: createQuestionParams
): Promise<ActionResponse> {
  const validatedQuestion = await action({
    params,
    schema: AskQuestionSchema,
    authorize: true,
  });

  if (validatedQuestion instanceof Error) {
    return handleError(validatedQuestion) as ErrorResponse;
  }

  const { title, content, tags } = validatedQuestion.params!;
  const userId = validatedQuestion.session?.user?.id;

  // Atomic transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Create question
    const [question] = await Question.create(
      [
        {
          title,
          content,
          author: userId,
        },
      ],
      { session }
    );

    if (!question) {
      throw new Error("Failed to create question");
    }

    const tagIds: mongoose.Types.ObjectId[] = [];
    const tagQuestions = [];

    for (const tag of tags) {
      const existingTag = await Tag.findOneAndUpdate(
        {
          name: { $regex: new RegExp(`^${tag}$`, "i") },
        },
        { $setOnInsert: { name: tag }, $inc: { questions: 1 } },
        { upsert: true, new: true, session }
      );

      tagIds.push(existingTag._id);
      tagQuestions.push({
        tag: existingTag._id,
        question: question._id,
      });
    }

    await TagQuestion.insertMany(tagQuestions, { session });

    await Question.findByIdAndUpdate(
      question._id,
      { $push: { tags: { $each: tagIds } } },
      { session }
    );

    await session.commitTransaction();

    return { success: true, data: JSON.parse(JSON.stringify(question)) };
  } catch (error) {
    await session.abortTransaction();
    return handleError(error) as ErrorResponse;
  } finally {
    session.endSession();
  }
}
