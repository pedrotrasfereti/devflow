import { FilterQuery } from "mongoose";

import { Tag as TagModel } from "@/database";
import {
  ActionResponse,
  ErrorResponse,
  PaginatedSearchParams,
  Tag,
} from "@/types/global";

import action from "../handlers/action";
import handleError from "../handlers/error";
import { PaginatedSearchParamsSchema } from "../validations";

export const getTags = async (
  params: PaginatedSearchParams
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
