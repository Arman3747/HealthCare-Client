import PublicFooter from "@/components/shared/PublicFooter";
import PublicNavbar from "@/components/shared/PublicNavbar";

const CommonLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <PublicNavbar></PublicNavbar>
      {children}
      <PublicFooter></PublicFooter>
    </>
  );
};

export default CommonLayout;
