import { notFound, redirect } from "next/navigation";
import React from "react";

import { auth } from "@/auth";
import QuestionForm from "@/components/forms/QuestionForm";
import ROUTES from "@/constants/routes";
import { getQuestion } from "@/lib/actions/question.action";
import { RouteParams } from "@/types/global";

const EditQuestion = async ({ params }: RouteParams) => {
  const { id: questionId } = await params;

  if (!questionId) return notFound();

  const session = await auth();

  // Redirect if user is not logged in
  if (!session) return redirect("/sign-in");

  const { data: question, success } = await getQuestion({ questionId });

  if (!success) return notFound();

  if (question?.author.toString() !== session?.user?.id) {
    redirect(ROUTES.QUESTION(questionId));
  }

  return (
    <main>
      <QuestionForm question={question} isEdit />
    </main>
  );
};

export default EditQuestion;
