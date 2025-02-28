"use server";

import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import Account from "@/database/account.model";
import User from "@/database/user.model";
import { ActionResponse, ErrorResponse } from "@/types/global";

import action from "../handlers/action";
import handleError from "../handlers/error";
import { NotFoundError } from "../http-errors";
import { SignInSchema, SignUpSchema } from "../validations";

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

    return { success: true };
  } catch (error) {
    await session.abortTransaction();

    return handleError(error) as ErrorResponse;
  } finally {
    await session.endSession();
  }
}

export async function signInWithCredentials(
  params: Pick<AuthCredentials, "email" | "password">
): Promise<ActionResponse> {
  const validatedAction = await action({ params, schema: SignInSchema });

  if (validatedAction instanceof Error) {
    return handleError(validatedAction) as ErrorResponse;
  }

  const { email, password } = validatedAction.params!;

  try {
    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      throw new NotFoundError("User");
    }

    const existingAccount = await Account.findOne({
      provider: "credentials",
      providerAccountId: email,
    });

    if (!existingAccount) throw new NotFoundError("Account");

    const passwordMatch = await bcrypt.compare(
      password,
      existingAccount.password
    );

    if (!passwordMatch) throw new Error("Wrong password");

    return { success: true };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
