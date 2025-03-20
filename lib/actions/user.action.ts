"use server";

import {
  ActionResponse,
  ErrorResponse,
  PaginatedSearchParams,
  User,
} from "@/types/global";
import { PaginatedSearchParamsSchema } from "../validations";
import action from "../handlers/action";
import handleError from "../handlers/error";
import { FilterQuery } from "mongoose";
import { User as UserModel } from "@/database";

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
