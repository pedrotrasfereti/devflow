import { NextResponse } from "next/server";

import User from "@/database/user.model";
import handleError from "@/lib/handlers/error";
import { ValidationError } from "@/lib/http-errors";
import dbConnect from "@/lib/mongoose";
import { UserSchema } from "@/lib/validations";
import { APIErrorResponse } from "@/types/global";

// GET /api/users
export async function GET() {
  try {
    await dbConnect();

    const users = await User.find();

    return NextResponse.json(
      {
        success: true,
        data: users,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error, "api") as APIErrorResponse;
  }
}

// POST /api/users
export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    // Validate user data
    const validatedData = UserSchema.safeParse(body);

    if (!validatedData.success) {
      throw new ValidationError(validatedData.error.flatten().fieldErrors);
    }

    const user = validatedData.data;

    // Check if user already exists
    const existingUser = await User.findOne({ email: user.email });

    if (existingUser) {
      throw new Error("User already exists.");
    }

    // Check if username is already taken
    const existingUsername = await User.findOne({
      username: user.username,
    });

    if (existingUsername) {
      throw new Error("That username is taken. Try a different one.");
    }

    // Create user
    const newUser = await User.create(validatedData.data);

    return NextResponse.json({ success: true, data: newUser }, { status: 201 });
  } catch (error) {
    return handleError(error, "api") as APIErrorResponse;
  }
}
