import UserCard from "@/components/cards/UserCard";
import DataRenderer from "@/components/DataRenderer";
import LocalSearch from "@/components/search/LocalSearch";
import ROUTES from "@/constants/routes";
import { EMPTY_USERS } from "@/constants/ui-states";
import { getUsers } from "@/lib/actions/user.action";
import { RouteParams } from "@/types/global";
import React from "react";

const Community = async ({ searchParams }: RouteParams) => {
  const { page, itemsPerPage, query, filter } = await searchParams;

  const { success, data, error } = await getUsers({
    page: Number(page) || 1,
    itemsPerPage: Number(itemsPerPage) || 10,
    query,
    filter,
  });

  const { users } = data || {};

  const usersEmpty = !users || users.length === 0;

  if (usersEmpty) {
    return <div>Empty!</div>;
  }

  return (
    <div>
      <h1 className="h1-bold text-dark100_light900">All Users</h1>

      <div className="mt-11">
        <LocalSearch
          route={ROUTES.COMMUNITY}
          iconPosition="left"
          imgSrc="/icons/search.svg"
          placeholder="There are some great"
          classes="flex-1"
        />
      </div>

      <DataRenderer
        success={success}
        error={error}
        data={users}
        empty={EMPTY_USERS}
        render={(users) => (
          <div className="mt-12 flex flex-wrap gap-5">
            {users.map((user) => (
              <UserCard key={user._id} {...user} />
            ))}
          </div>
        )}
      />
    </div>
  );
};

export default Community;
