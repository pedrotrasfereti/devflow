import { auth } from "@/auth";
import UserAvatar from "@/components/UserAvatar";
import { getUserDetails } from "@/lib/actions/user.action";

import { RouteParams } from "@/types/global";
import { notFound } from "next/navigation";

import dayjs from "dayjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ProfileLink from "@/components/profile/ProfileLink";
import ProfileStats from "@/components/profile/ProfileStats";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Profile = async ({ params }: RouteParams) => {
  const { userId } = await params;

  if (!userId) notFound();

  const loggedInUser = await auth();

  const { success, data, error } = await getUserDetails({ userId });

  if (!success) {
    return (
      <div>
        <div className="h1-bold text-dark100_light900">{error?.message}</div>
      </div>
    );
  }

  const { user, totalQuestions, totalAnswers } = data!;

  return (
    <>
      <section className="flex flex-col-reverse items-start justify-between sm:flex-row">
        <div className="flex flex-col items-start gap-4 lg:flex-row">
          <UserAvatar
            id={user._id}
            name={user.name}
            imageUrl={user.image}
            className="size-[140px] rounded-full object-cover"
            fallbackClassName="text-5xl font-bolder"
          />
        </div>

        <div className="mt-3">
          <h2 className="h2-bold text-dark100_light900">{user.name}</h2>

          <p className="paragraph-regular text-dark200_light800">
            @{user.username}
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-start gap-5">
            {user.portfolio && (
              <ProfileLink
                imgUrl="/icons/link.svg"
                href={user.portfolio}
                title="Portfolio"
              />
            )}

            {user.location && (
              <ProfileLink
                imgUrl="/icons/location.svg"
                href={user.location}
                title="Portfolio"
              />
            )}

            <ProfileLink
              imgUrl="/icons/calendar.svg"
              title={dayjs(user.createdAt).format("MMMM YYYY")}
            />
          </div>

          {user.bio && (
            <p className="paragraph-regular text-dark400_light800 mt-8">
              {user.bio}
            </p>
          )}
        </div>

        <div className="flex justify-end max-sm:mb-5 max-sm:w-full sm:mt-3">
          {loggedInUser?.user?.id === userId && (
            <Link href="/profile/edit">
              <Button className="paragraph-medium btn-secondary text-dark300_light900 min-h-12 min-w-44 px-4 py-3">
                Edit Profile
              </Button>
            </Link>
          )}
        </div>
      </section>

      <ProfileStats
        totalQuestions={totalQuestions}
        totalAnswers={totalAnswers}
        badges={{
          GOLD: 0,
          SILVER: 0,
          BRONZE: 0,
        }}
      />

      <section className="mt-10 flex gap-10">
        <Tabs defaultValue="top-posts" className="flex-[2]">
          <TabsList className="background-light800_dark400 min-h-[42px] p-1">
            <TabsTrigger value="top-posts" className="tab">
              Top Posts
            </TabsTrigger>

            <TabsTrigger value="answers" className="tab">
              Answers
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="top-posts"
            className="mt-5 flex w-full flex-col gap-6"
          >
            List of Questions
          </TabsContent>

          <TabsContent value="answers" className="flex w-full flex-col gap-6">
            List of Answers
          </TabsContent>
        </Tabs>

        <div className="flex w-full min-w-[250px] flex-1 flex-col max-lg:hidden">
          <h3 className="h3-bold text-dark200_light900">Top Tech</h3>

          <div className="mt-7 flex flex-col gap-4">
            <p>List of Tags</p>
          </div>
        </div>
      </section>
    </>
  );
};

export default Profile;
