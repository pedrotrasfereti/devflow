import { ReactNode } from "react";

import Navbar from "@/components/navigation/navbar";
import LeftSidebar from "@/components/navigation/sidebar/LeftSidebar";

const RootLayout = ({ children }: Readonly<{ children: ReactNode }>) => {
  return (
    <main>
      <Navbar />

      <div className="flex pt-20">
        <LeftSidebar />

        <section>{children}</section>
      </div>
    </main>
  );
};

export default RootLayout;
