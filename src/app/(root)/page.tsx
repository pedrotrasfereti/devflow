import ROUTES from "@/constants/routes";

import { auth, signOut } from "../../../auth";

const Home = async () => {
  const session = await auth();

  console.log(session);

  return (
    <div>
      <h1 className="text-3xl font-black text-violet-700">
        Welcome to the world of Next.js
      </h1>

      <form
        className="px-10 pt-[100px]"
        action={async () => {
          "use server";

          await signOut({ redirectTo: ROUTES.SIGN_IN });
        }}
      >
        <button type="submit">Log out</button>
      </form>
    </div>
  );
};

export default Home;
