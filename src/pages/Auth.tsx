import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Shield, Eye, EyeOff } from 'lucide-react';

const authSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }).max(255),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(72)
});

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateForm = () => {
    const result = authSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach(err => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const { error } = isSignUp 
        ? await signUp(email.trim(), password)
        : await signIn(email.trim(), password);
      
      if (error) {
        let errorMessage = error.message;
        
        // Handle common auth errors with user-friendly messages
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please try again.';
        } else if (error.message.includes('User already registered')) {
          errorMessage = 'An account with this email already exists. Please sign in.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email to confirm your account.';
        }
        
        toast({
          title: "Authentication Error",
          description: errorMessage,
          variant: "destructive"
        });
      } else {
        if (isSignUp) {
          toast({
            title: "Account Created",
            description: "Check your email to confirm your account, or sign in if email confirmation is disabled."
          });
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center mb-4 glow-primary">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold font-tactical tracking-wider text-foreground">
            COMMAND CENTER
          </h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            SECURE ACCESS REQUIRED
          </p>
        </div>

        <Card className="tactical-panel border-primary/30">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-tactical tracking-wide text-center">
              {isSignUp ? 'CREATE ACCOUNT' : 'AUTHENTICATE'}
            </CardTitle>
            <CardDescription className="text-center font-mono text-xs">
              {isSignUp 
                ? 'Register new operator credentials' 
                : 'Enter your credentials to access the system'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs uppercase tracking-wider font-mono">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="operator@command.mil"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-input border-border font-mono"
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-xs text-destructive font-mono">{errors.email}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs uppercase tracking-wider font-mono">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-input border-border font-mono pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive font-mono">{errors.password}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full font-tactical tracking-wider uppercase"
                disabled={isLoading}
              >
                {isLoading 
                  ? 'PROCESSING...' 
                  : isSignUp 
                    ? 'CREATE ACCOUNT' 
                    : 'SIGN IN'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrors({});
                }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors font-mono"
                disabled={isLoading}
              >
                {isSignUp 
                  ? 'Already have an account? Sign in' 
                  : "Need an account? Create one"}
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6 font-mono">
          CLASSIFICATION: TOP SECRET // NOFORN
        </p>
      </div>
    </div>
  );
}
