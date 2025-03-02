"use server";

import mongoose from "mongoose";

import QuestionModel from "@/database/question.model";
import TagQuestion from "@/database/tag-question.model";
import Tag, { ITagDoc } from "@/database/tag.model";
import { ActionResponse, ErrorResponse, Question } from "@/types/global";

import action from "../handlers/action";
import handleError from "../handlers/error";
import {
  AskQuestionSchema,
  EditQuestionSchema,
  GetQuestionSchema,
} from "../validations";

export async function createQuestion(
  params: createQuestionParams
): Promise<ActionResponse<Question>> {
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
    const [question] = await QuestionModel.create(
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

    await QuestionModel.findByIdAndUpdate(
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

export async function editQuestion(
  params: editQuestionParams
): Promise<ActionResponse<Question>> {
  const validatedQuestion = await action({
    params,
    schema: EditQuestionSchema,
    authorize: true,
  });

  if (validatedQuestion instanceof Error) {
    return handleError(validatedQuestion) as ErrorResponse;
  }

  const { title, content, tags, questionId } = validatedQuestion.params!;
  const userId = validatedQuestion.session?.user?.id;

  // Atomic transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Get Question and Question Tags Data
    const question = await QuestionModel.findById(questionId).populate("tags");

    if (!question) {
      throw new Error("Question not found");
    }

    if (question.author.toString() !== userId) {
      throw new Error("Unauthorized");
    }

    if (question.title !== title || question.content !== content) {
      question.title = title;
      question.content = content;

      await question.save({ session });
    }

    // Add Tags
    const tagsToAdd = tags.filter(
      (tag) => !question.tags.includes(tag.toLowerCase())
    );

    const newTagDocuments = [];

    if (tagsToAdd.length > 0) {
      for (const tag of tagsToAdd) {
        const existingTag = await Tag.findOneAndUpdate(
          { name: { $regex: new RegExp(`^${tag}$`, "i") } },
          { $setOnInsert: { name: tag }, $inc: { questions: 1 } },
          { upsert: true, new: true, session }
        );

        if (existingTag) {
          newTagDocuments.push({
            tag: existingTag._id,
            question: question._id,
          });

          question.tags.push(existingTag._id);
        }
      }
    }

    // Remove Tags
    const tagsToRemove = question.tags.filter(
      (tag: ITagDoc) => !tags.includes(tag.name.toLowerCase())
    );

    if (tagsToRemove.length > 0) {
      const tagIdsToRemove = tagsToRemove.map((tag: ITagDoc) => tag._id);

      await Tag.updateMany(
        { _id: { $in: tagIdsToRemove } },
        { $inc: { questions: -1 } },
        { session }
      );

      await TagQuestion.deleteMany(
        { tag: { $in: tagIdsToRemove }, question: questionId },
        { session }
      );

      question.tags = question.tags.filter(
        (tagId: mongoose.Types.ObjectId) => !tagsToRemove.includes(tagId)
      );
    }

    if (newTagDocuments.length > 0) {
      await TagQuestion.insertMany(newTagDocuments, { session });
    }

    await question.save({ session });
    await session.commitTransaction();

    return { success: true, data: JSON.parse(JSON.stringify(question)) };
  } catch (error) {
    await session.abortTransaction();
    return handleError(error) as ErrorResponse;
  } finally {
    session.endSession();
  }
}

export async function getQuestion(
  params: getQuestionParams
): Promise<ActionResponse<Question>> {
  const validatedQuestion = await action({
    params,
    schema: GetQuestionSchema,
    authorize: true,
  });

  if (validatedQuestion instanceof Error) {
    return handleError(validatedQuestion) as ErrorResponse;
  }

  const { questionId } = validatedQuestion.params!;

  try {
    const question = await QuestionModel.findById(questionId).populate("tags");

    if (!question) {
      throw new Error("Question not found");
    }

    return { success: true, data: JSON.parse(JSON.stringify(question)) };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
