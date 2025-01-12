import { ReactNode } from "react";

const AuthLayout = ({ children }: Readonly<{ children: ReactNode }>) => {
  return <main>{children}</main>;
};

export default AuthLayout;
