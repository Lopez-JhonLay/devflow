import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authClient } from '@/lib/auth-client';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Triangle } from 'lucide-react';
import { GitHubIcon } from '@/components/shared/GitHubIcon';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [authError, setAuthError] = useState('');
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setAuthError('');
    const { error: signInError } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
    });

    if (signInError) {
      setAuthError(signInError.message || 'Invalid email or password');
    } else {
      navigate('/dashboard');
    }
  };

  const handleSocialLogin = async (provider: 'github' | 'google') => {
    await authClient.signIn.social({ provider, callbackURL: 'http://localhost:5173/dashboard' });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4 font-sans text-foreground">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-110 rounded-[32px] border border-border bg-card p-8 text-card-foreground shadow-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Triangle className="h-6 w-6 fill-foreground text-foreground" />
            <span className="text-xl font-bold tracking-tight text-foreground">DevFlow</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Welcome back</h1>
          <p className="text-sm text-muted-foreground text-center">Sign in to your DevFlow account.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {authError && (
            <div className="rounded-md bg-red-50 p-3 text-sm font-medium text-red-600 text-center">{authError}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="janedoe@example.com"
              {...register('email')}
              className={`bg-background/50 ${errors.email ? 'border-red-500' : ''}`}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••••••••"
              {...register('password')}
              className={`bg-background/50 ${errors.password ? 'border-red-500' : ''}`}
            />
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="inline-block text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            className="cursor-pointer w-full rounded-full h-11 text-base font-medium mt-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="my-8 flex items-center">
          <div className="grow border-t border-border"></div>
          <span className="mx-4 text-xs font-medium uppercase text-muted-foreground tracking-wider">
            Or continue with
          </span>
          <div className="grow border-t border-border"></div>
        </div>

        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSocialLogin('google')}
            className="cursor-pointer w-full rounded-full h-11 font-medium relative"
          >
            <svg className="h-5 w-5 absolute left-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSocialLogin('github')}
            className="cursor-pointer w-full rounded-full h-11 font-medium relative"
          >
            <GitHubIcon className="h-5 w-5 absolute left-4" />
            Sign in with GitHub
          </Button>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-medium text-foreground underline hover:text-muted-foreground underline-offset-4"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
