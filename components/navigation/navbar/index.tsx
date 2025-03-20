import Image from "next/image";
import Link from "next/link";
import React from "react";

import { auth } from "@/auth";
import UserAvatar from "@/components/UserAvatar";

import MobileNavigation from "./MobileNavigation";
import ThemeToggle from "./ThemeToggle";

const Navbar = async () => {
  const session = await auth();

  const userId = session?.user?.id;
  const username = session?.user?.name;
  const avatarImage = session?.user?.image;

  return (
    <nav className="flex-between background-light900_dark200 fixed z-50 w-full gap-5 p-6 shadow-light-200 dark:shadow-none sm:px-12">
      <Link href="/" className="flex items-center gap-2">
        <Image
          src="/images/site-logo.svg"
          width={23}
          height={23}
          alt="DevFlow Logo"
        />

        <p className="h2-bold font-space-grotesk text-dark-100 dark:text-light-900 max-sm:hidden">
          Dev<span className="text-primary-500">Flow</span>
        </p>
      </Link>

      <p>Global Search</p>

      <div className="flex-between gap-5">
        <ThemeToggle />

        {userId && (
          <UserAvatar
            id={userId}
            name={username || "Login"}
            imageUrl={avatarImage}
          />
        )}

        <MobileNavigation />
      </div>
    </nav>
  );
};

export default Navbar;
