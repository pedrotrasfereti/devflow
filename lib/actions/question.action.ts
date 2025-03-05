"use server";

import mongoose, { FilterQuery } from "mongoose";

import QuestionModel, { IQuestionDoc } from "@/database/question.model";
import TagQuestion from "@/database/tag-question.model";
import Tag, { ITagDoc } from "@/database/tag.model";
import {
  ActionResponse,
  ErrorResponse,
  PaginatedSearchParams,
  Question,
} from "@/types/global";

import action from "../handlers/action";
import handleError from "../handlers/error";
import {
  AskQuestionSchema,
  EditQuestionSchema,
  GetQuestionSchema,
  IncrementViewsSchema,
  PaginatedSearchParamsSchema,
} from "../validations";
import {
  createQuestionParams,
  editQuestionParams,
  getQuestionParams,
  IncrementViewsParams,
} from "@/types/action";

export async function createQuestion(
  params: createQuestionParams,
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
      { session },
    );

    if (!question) {
      throw new Error("Failed to create question");
    }

    const tagIds: mongoose.Types.ObjectId[] = [];
    const tagQuestions = [];

    for (const tag of tags) {
      const existingTag = await Tag.findOneAndUpdate(
        {
          name: { $regex: `^${tag}$`, $options: "i" },
        },
        { $setOnInsert: { name: tag }, $inc: { questions: 1 } },
        { upsert: true, new: true, session },
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
      { session },
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
  params: editQuestionParams,
): Promise<ActionResponse<IQuestionDoc>> {
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
      (tag) =>
        !question.tags.some((t: ITagDoc) => t.name.includes(tag.toLowerCase())),
    );

    const newTagDocuments = [];

    if (tagsToAdd.length > 0) {
      for (const tag of tagsToAdd) {
        const existingTag = await Tag.findOneAndUpdate(
          { name: { $regex: `^${tag}$`, $options: "i" } },
          { $setOnInsert: { name: tag }, $inc: { questions: 1 } },
          { upsert: true, new: true, session },
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
      (tag: ITagDoc) =>
        !tags.some((t) => t.toLowerCase() === tag.name.toLowerCase()),
    );

    if (tagsToRemove.length > 0) {
      const tagIdsToRemove = tagsToRemove.map((tag: ITagDoc) => tag._id);

      await Tag.updateMany(
        { _id: { $in: tagIdsToRemove } },
        { $inc: { questions: -1 } },
        { session },
      );

      await TagQuestion.deleteMany(
        { tag: { $in: tagIdsToRemove }, question: questionId },
        { session },
      );

      question.tags = question.tags.filter(
        (tag: mongoose.Types.ObjectId) =>
          !tagIdsToRemove.some((id: mongoose.Types.ObjectId) =>
            id.equals(tag._id),
          ),
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
  params: getQuestionParams,
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
    const question = await QuestionModel.findById(questionId)
      .populate("tags")
      .populate("author", "_id name image");

    if (!question) {
      throw new Error("Question not found");
    }

    return { success: true, data: JSON.parse(JSON.stringify(question)) };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function getQuestions(
  params: PaginatedSearchParams,
): Promise<ActionResponse<{ questions: Question[]; isNext: boolean }>> {
  const validatedParams = await action({
    params,
    schema: PaginatedSearchParamsSchema,
  });

  if (validatedParams instanceof Error) {
    return handleError(validatedParams) as ErrorResponse;
  }

  const { page = 1, itemsPerPage = 10, query, filter } = params;

  // Skip pages based on "page" value
  const skipValue = (Number(page) - 1) * itemsPerPage;
  const limitValue = Number(itemsPerPage);

  const filterQuery: FilterQuery<Question> = {};

  if (filter === "recommended") {
    return {
      success: true,
      data: { questions: [], isNext: false },
    };
  }

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
    case "unanswered":
      filterQuery.answers = 0;
      sortCriteria = { createdAt: -1 };
      break;
    case "popular":
      sortCriteria = { upvotes: -1 };
      break;
    default:
      sortCriteria = { createdAt: -1 };
      break;
  }

  try {
    const totalQuestions = await QuestionModel.countDocuments(filterQuery);

    const questions = await QuestionModel.find(filterQuery)
      .populate("tags", "name")
      // .populate("author", "name image")
      .lean()
      .sort(sortCriteria)
      .skip(skipValue)
      .limit(limitValue);

    const remainingQuestions = skipValue + questions.length;
    const isNext = totalQuestions > remainingQuestions;

    return {
      success: true,
      data: { questions: JSON.parse(JSON.stringify(questions)), isNext },
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function incrementViews(
  params: IncrementViewsParams,
): Promise<ActionResponse<{ views: number }>> {
  const validatedParams = await action({
    params,
    schema: IncrementViewsSchema,
  });

  if (validatedParams instanceof Error) {
    return handleError(validatedParams) as ErrorResponse;
  }

  const { questionId } = validatedParams.params!;

  try {
    const question = await QuestionModel.findById(questionId);

    if (!question) {
      throw new Error("Question not found");
    }

    question.views += 1;

    await question.save();

    return { success: true, data: { views: question.views } };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
