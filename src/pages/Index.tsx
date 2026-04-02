import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import EmailLogin from "@/components/EmailLogin";
import Dashboard from "@/components/Dashboard";

const Index = () => {
  const [email, setEmail] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const reqId = searchParams.get("req");

  if (!email) {
    return <EmailLogin onLogin={setEmail} />;
  }

  return <Dashboard email={email} onLogout={() => setEmail(null)} highlightReqId={reqId} />;
};

export default Index;
