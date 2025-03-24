import Image from "next/image";
import Link from "next/link";

import TagCard from "@/components/cards/TagCard";
import ROUTES from "@/constants/routes";
import { getPopularQuestions } from "@/lib/actions/question.action";
import {
  EMPTY_POPULAR_QUESTIONS,
  EMPTY_POPULAR_TAGS,
} from "@/constants/ui-states";
import DataRenderer from "@/components/DataRenderer";
import { getPopularTags } from "@/lib/actions/tag.action";

const RightSidebar = async () => {
  const [
    {
      success: questionsSuccess,
      data: popularQuestions,
      error: questionsError,
    },
    { success: tagsSuccess, data: popularTags, error: tagsError },
  ] = await Promise.all([getPopularQuestions(), getPopularTags()]);

  return (
    <section className="custom-scrollbar background-light900_dark200 light-border sticky right-0 top-0 flex h-screen w-[350px] flex-col gap-6 overflow-y-auto border-l p-6 pt-36 shadow-light-300 dark:shadow-none max-xl:hidden">
      <div>
        <h3 className="h3-bold text-dark200_light900">Top Questions</h3>

        <DataRenderer
          success={questionsSuccess}
          error={questionsError}
          data={popularQuestions}
          empty={EMPTY_POPULAR_QUESTIONS}
          variant="sm"
          render={(popularQuestions) => (
            <div className="mt-7 flex w-ful flex-col gap-[30px]">
              {popularQuestions.map(({ _id, title }) => (
                <Link
                  key={_id}
                  href={ROUTES.QUESTION(_id)}
                  className="flex cursor-pointer items-center justify-between gap-7"
                >
                  <p className="body-medium text-dark500_light700 line-clamp-2">
                    {title}
                  </p>

                  <Image
                    src="/icons/chevron-right.svg"
                    alt="Chevron"
                    width={20}
                    height={20}
                    className="invert-colors"
                  />
                </Link>
              ))}
            </div>
          )}
        />
      </div>

      <div className="mt-16">
        <h3 className="h3-bold text-dark200_light900">Popular Tags</h3>

        <DataRenderer
          data={popularTags}
          empty={EMPTY_POPULAR_TAGS}
          success={tagsSuccess}
          error={tagsError}
          variant="sm"
          render={(popularTags) => (
            <div className="mt-7 flex flex-col gap-4">
              {popularTags.map(({ _id, name, questions }) => (
                <TagCard
                  key={_id}
                  _id={_id}
                  name={name}
                  count={questions}
                  showCount
                  compact
                />
              ))}
            </div>
          )}
        />
      </div>
    </section>
  );
};

export default RightSidebar;
