import LogoutButton from "@/components/shared/LogoutButton";
import { getCookie } from "@/services/auth/tokenHandlers";
import React from "react";

const commonDashboardLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const accessToken = await getCookie("accessToken");
  return (
    <>
      {accessToken && <LogoutButton></LogoutButton>}
      {children}
    </>
  );
};

export default commonDashboardLayout;
