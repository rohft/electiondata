import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignUp() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      const { error } = await window.ezsite.apis.register({
        name: data.name,
        email: data.email,
        password: data.password
      });

      if (error) {
        toast({
          title: 'Registration failed',
          description: error,
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Registration successful!',
        description: 'Please check your email to verify your account.'
      });

      // Redirect to signin after successful registration
      setTimeout(() => {
        navigate('/signin');
      }, 2000);
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
          <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
          <CardDescription>Enter your details to create your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) =>
                <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                      type="text"
                      placeholder="John Doe"
                      disabled={isLoading}
                      {...field} />

                    </FormControl>
                    <FormMessage />
                  </FormItem>
                } />

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

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) =>
                <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
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
                Sign Up
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-sm text-muted-foreground text-center">
            Already have an account?{' '}
            <Link to="/signin" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>);

}