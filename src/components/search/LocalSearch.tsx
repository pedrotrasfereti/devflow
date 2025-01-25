"use client";

import Image from "next/image";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

import { formUrlQuery, removeKeysFromUrlQuery } from "@/lib/url";

import { Input } from "../ui/input";

interface Props {
  route: string;
  imgSrc: string;
  placeholder: string;
  classes?: string;
}

const LocalSearch = ({ route, imgSrc, placeholder, classes }: Props) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || "";

  const [searchQuery, setSearchQuery] = useState(query);

  useEffect(() => {
    // Run after 1 second
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery) {
        const newUrl = formUrlQuery({
          params: searchParams.toString(),
          key: "query",
          value: searchQuery,
        });

        router.push(newUrl, { scroll: false });
      } else {
        if (pathname === route) {
          const newUrl = removeKeysFromUrlQuery({
            params: searchParams.toString(),
            keysToRemove: ["query"],
          });

          router.push(newUrl, { scroll: false });
        }
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, searchParams, route, router, pathname]);

  return (
    <div
      className={`background-light800_darkgradient flex min-h-[56px] grow items-center gap-4 rounded-[10px] px-4 ${classes}`}
    >
      <label htmlFor="search-questions">
        <Image
          src={imgSrc}
          width={24}
          height={24}
          alt="Search"
          className="invert-colors cursor-pointer"
        />
      </label>

      <Input
        id="search-questions"
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="no-focus paragraph-regular text-dark400_light700 border-none bg-transparent shadow-none outline-none"
      />
    </div>
  );
};

export default LocalSearch;
