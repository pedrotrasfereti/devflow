import React from "react";

import { RouteParams } from "@/types/global";

const QuestionDetails = async ({ params }: RouteParams) => {
  const questionParams = await params;
  return <div>Question: {questionParams.id}</div>;
};

export default QuestionDetails;
