import Image from "next/image";
import Link from "next/link";
import React from "react";

import ROUTES from "@/constants/routes";
import { getDeviconClassName } from "@/lib/utils";

import { Badge } from "../ui/badge";

interface Props {
  _id: string;
  name: string;
  count?: number;
  showCount?: boolean;
  compact?: boolean;
  close?: boolean;
  isButton?: boolean;
  handleClose?: () => void;
}

const TagCard = ({
  _id,
  name,
  count,
  showCount,
  compact,
  close,
  isButton,
  handleClose,
}: Props) => {
  const iconClass = getDeviconClassName(name);

  const handleClick = (e: React.MouseEvent) => e.preventDefault();

  const CardContent = (
    <>
      <Badge className="subtle-medium background-light800_dark300 text-light400_light500 flex flex-row gap-2 rounded-md border-none px-4 py-2 uppercase">
        <div className="flex-center space-x-2">
          <i className={`${iconClass} text-sm`} />
          <span>{name}</span>
        </div>
      </Badge>

      {close && (
        <Image
          src="/icons/close.svg"
          width={12}
          height={12}
          alt="close icon"
          className="cursor-pointer object-contain invert-0 dark:invert"
          onClick={handleClose}
        />
      )}

      {showCount && (
        <p className="small-medium text-dark500_light700">{count}</p>
      )}
    </>
  );

  if (compact) {
    if (isButton) {
      return (
        <button className="flex justify-between gap-2" onClick={handleClick}>
          {CardContent}
        </button>
      );
    } else {
      return (
        <Link
          href={ROUTES.TAGS(_id)}
          className="flex items-center justify-between gap-2"
        >
          {CardContent}
        </Link>
      );
    }
  }
};

export default TagCard;
