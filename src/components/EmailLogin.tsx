import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

interface EmailLoginProps {
  onLogin: (email: string) => void;
}

const EmailLogin = ({ onLogin }: EmailLoginProps) => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      onLogin(email.trim().toLowerCase());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-lg border-0 shadow-primary/5">
        <CardHeader className="text-center space-y-3 pb-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-1">
            <Mail className="w-7 h-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Welcome to Musana Leave System</CardTitle>
          <CardDescription className="text-base">Enter your email to continue</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11"
            />
            <Button type="submit" className="w-full h-11 text-base font-medium">
              Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailLogin;
