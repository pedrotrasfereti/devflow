import Link from "next/link";
import React from "react";

import ROUTES from "@/constants/routes";
import { getDeviconClassName } from "@/lib/utils";

import { Badge } from "../ui/badge";

interface Props {
  _id: string;
  name: string;
  count: number;
  showCount?: boolean;
  compact?: boolean;
}

const TagCard = ({ _id, name, count, showCount, compact }: Props) => {
  const iconClass = getDeviconClassName(name);

  console.log(compact);

  return (
    <Link
      href={ROUTES.TAGS(_id)}
      className="flex items-center justify-between gap-2"
    >
      <Badge className="subtle-medium background-light800_dark300 text-light400_light500 rounded-md border-none px-4 py-2 uppercase">
        <div className="flex-center space-x-2">
          <i className={`${iconClass} text-sm`} />
          <span>{name}</span>
        </div>
      </Badge>

      {showCount && (
        <p className="small-medium text-dark500_light700">{count}</p>
      )}
    </Link>
  );
};

export default TagCard;
