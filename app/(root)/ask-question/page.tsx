import Link from "next/link";

import { auth } from "@/auth";
import QuestionForm from "@/components/forms/QuestionForm";
import ROUTES from "@/constants/routes";

const AskAQuestion = async () => {
  const loggedInUser = await auth();

  if (!loggedInUser) {
    return (
      <>
        <h1 className="h1-bold text-dark100_light900">Saved Questions</h1>

        <div className="mt-11 flex w-full">
          <p className="body-regular text-dark500_light700 max-w-md text-center">
            You must be logged in to ask a question.{" "}
            <Link
              className="body-regular primary-text-gradient"
              href={ROUTES.SIGN_IN}
            >
              Log in
            </Link>
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="h1-bold text-dark100_light900">Ask a Question</h1>

      <div className="mt-9">
        <QuestionForm />
      </div>
    </>
  );
};

export default AskAQuestion;
