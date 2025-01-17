import Image from "next/image";
import Link from "next/link";
import React from "react";

import { Button } from "@/components/ui/button";
import ROUTES from "@/constants/routes";

import NavLinks from "../navbar/NavLinks";

const LeftSidebar = () => {
  return (
    <section className="background-light900_dark200 sticky left-0 top-0 z-0 min-h-screen max-w-72 flex-1 border-none dark:shadow-none">
      <div className="no-scrollbar flex h-[calc(100vh-80px)] flex-col justify-between overflow-y-auto">
        <section className="flex h-full flex-col gap-6 px-6 pt-16">
          <NavLinks />
        </section>

        <div className="flex flex-col gap-3 px-6 pb-6">
          <Button
            className="small-medium btn-secondary min-h-[41px] w-full rounded-lg px-4 py-3 shadow-none"
            asChild
          >
            <Link href={ROUTES.SIGN_IN}>
              <Image
                src="/icons/account.svg"
                alt="Account"
                width={20}
                height={20}
                className="invert-colors lg:hidden"
              />

              <span className="primary-text-gradient max-lg:hidden">
                Sign In
              </span>
            </Link>
          </Button>

          <Button
            className="small-medium btn-tertiary light-border-2 text-dark400_light900 min-h-[41px] w-full rounded-lg border px-4 py-3 shadow-none"
            asChild
          >
            <Link href={ROUTES.SIGN_UP}>
              <Image
                src="/icons/sign-up.svg"
                alt="Sign Up"
                width={20}
                height={20}
                className="invert-colors lg:hidden"
              />

              <span className="primary-text-gradient max-lg:hidden">
                Sign Up
              </span>
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default LeftSidebar;
