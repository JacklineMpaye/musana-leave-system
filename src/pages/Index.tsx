import { useState } from "react";
import EmailLogin from "@/components/EmailLogin";
import Dashboard from "@/components/Dashboard";

const Index = () => {
  const [email, setEmail] = useState<string | null>(null);

  if (!email) {
    return <EmailLogin onLogin={setEmail} />;
  }

  return <Dashboard email={email} />;
};

export default Index;
