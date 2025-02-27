"use server";

import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { signIn } from "next-auth/react";

import Account from "@/database/account.model";
import User from "@/database/user.model";
import { ActionResponse, ErrorResponse } from "@/types/global";

import action from "../handlers/action";
import handleError from "../handlers/error";
import { SignUpSchema } from "../validations";

export async function signUpWithCredentials(
  params: AuthCredentials
): Promise<ActionResponse> {
  const validatedAction = await action({ params, schema: SignUpSchema });

  if (validatedAction instanceof Error) {
    return handleError(validatedAction) as ErrorResponse;
  }

  const { name, username, email, password } = validatedAction.params!;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existingUser = await User.findOne({ email }).session(session);

    if (existingUser) {
      throw new Error("User already exists");
    }

    const existingUsername = await User.findOne({ username }).session(session);

    if (existingUsername) {
      throw new Error("Username already exists");
    }

    // Save hashed password
    const hashedPassword = await bcrypt.hash(password, 12);

    /* 
      In order for mongoose to consider the second object as "options"2, we must pass an array of objects as the first argument of Model.create()
    */
    const [newUser] = await User.create([{ username, name, email }], {
      session,
    });

    await Account.create(
      [
        {
          userId: newUser._id,
          name,
          provider: "credentials",
          providerAccountId: email,
          password: hashedPassword,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    await signIn("credentials", { email, password, redirect: false });

    return { success: true };
  } catch (error) {
    await session.abortTransaction();

    return handleError(error) as ErrorResponse;
  } finally {
    await session.endSession();
  }
}
