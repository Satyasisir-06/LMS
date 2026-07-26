import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export const signupSchema = z.object({
  full_name: z.string().min(2, "Please tell us your name."),
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.enum(["student", "faculty"]),
  student_id: z.string().optional(),
  department: z.string().optional(),
  academic_year: z.string().optional(),
  semester: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address."),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirm_password: z.string().min(8, "Password must be at least 8 characters."),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords do not match.",
  path: ["confirm_password"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
