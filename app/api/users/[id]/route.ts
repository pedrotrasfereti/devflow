import { NextResponse } from "next/server";

import User from "@/database/user.model";
import handleError from "@/lib/handlers/error";
import { NotFoundError } from "@/lib/http-errors";
import dbConnect from "@/lib/mongoose";
import { APIErrorResponse } from "@/types/global";

// GET /api/users/{id}
export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) throw new NotFoundError("User");

  try {
    await dbConnect();

    // Same as `User.findOne({ _id: id });`
    const user = await User.findById(id);

    // Check if user exists
    if (!user) throw new NotFoundError("User");

    return NextResponse.json(
      {
        success: true,
        data: user,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error, "api") as APIErrorResponse;
  }
}

// DELETE /api/users/{id}
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) throw new NotFoundError("User");

  try {
    await dbConnect();

    // Same as `User.findOne({ _id: id });`
    const user = await User.findByIdAndDelete(id);

    // Check if user exists
    if (!user) throw new NotFoundError("User");

    return NextResponse.json(
      {
        success: true,
        data: user,
      },
      { status: 204 }
    );
  } catch (error) {
    return handleError(error, "api") as APIErrorResponse;
  }
}
