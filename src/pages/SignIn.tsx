import { useState } from 'react';
const _w = window as any;
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const signinSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

type SigninFormData = z.infer<typeof signinSchema>;

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { checkAuth } = useAuth();

  const form = useForm<SigninFormData>({
    resolver: zodResolver(signinSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data: SigninFormData) => {
    setIsLoading(true);
    try {
      const { error } = await _w.ezsite.apis.login({
        email: data.email,
        password: data.password
      });

      if (error) {
        toast({
          title: 'Sign in failed',
          description: error,
          variant: 'destructive'
        });
        return;
      }

      // Refresh auth state
      await checkAuth();

      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.'
      });

      // Redirect to the page they tried to visit, or home
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) =>
                <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                      type="email"
                      placeholder="you@example.com"
                      disabled={isLoading}
                      {...field} />

                    </FormControl>
                    <FormMessage />
                  </FormItem>
                } />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) =>
                <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                      type="password"
                      placeholder="••••••••"
                      disabled={isLoading}
                      {...field} />

                    </FormControl>
                    <FormMessage />
                  </FormItem>
                } />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-sm text-muted-foreground text-center">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>);

}