import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Triangle, ArrowLeft } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordValues) => {
    setStatusMessage({ type: '', text: '' });

    // Calls Better Auth's forget password functionality
    const { error } = await authClient.requestPasswordReset({
      email: data.email,
      redirectTo: '/reset-password', // Update this based on where your reset form lives
    });

    if (error) {
      setStatusMessage({ type: 'error', text: error.message || 'Failed to send reset email.' });
    } else {
      setStatusMessage({ type: 'success', text: 'If an account exists, a reset link has been sent.' });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="w-full max-w-110 rounded-[24px] bg-white p-8 shadow-sm border border-gray-100">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Triangle className="h-6 w-6 fill-gray-900 text-gray-900" />
            <span className="text-xl font-bold tracking-tight text-gray-900">DevFlow</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset password</h1>
          <p className="text-sm text-gray-500 text-center">
            Enter your email address and we will send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {statusMessage.text && (
            <div
              className={`rounded-md p-3 text-sm font-medium text-center ${statusMessage.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}
            >
              {statusMessage.text}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="janedoe@example.com"
              {...register('email')}
              className={`rounded-lg bg-gray-50/50 border-gray-200 focus-visible:ring-gray-900 ${errors.email ? 'border-red-500' : ''}`}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <Button
            type="submit"
            className="w-full rounded-full bg-gray-900 text-white hover:bg-gray-800 h-11 text-base font-medium mt-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending instructions...' : 'Send Reset Link'}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <Link
            to="/login"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
