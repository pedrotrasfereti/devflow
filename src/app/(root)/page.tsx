import { auth } from "../../../auth";

const Home = async () => {
  const session = await auth();

  console.log(session);

  return (
    <div>
      <h1 className="text-3xl font-black text-violet-700">
        Welcome to the world of Next.js
      </h1>
    </div>
  );
};

export default Home;
