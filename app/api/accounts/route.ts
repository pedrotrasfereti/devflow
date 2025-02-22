import { NextResponse } from "next/server";

import Account from "@/database/account.model";
import handleError from "@/lib/handlers/error";
import dbConnect from "@/lib/mongoose";
import { APIErrorResponse } from "@/types/global";

export async function GET() {
  try {
    await dbConnect();

    const accounts = await Account.find();

    return NextResponse.json(
      { success: true, data: accounts },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error, "api") as APIErrorResponse;
  }
}
