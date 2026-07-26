import { useEffect } from "react";
import { Link, useActionData, data } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArrowRight, Mail, KeyRound, CheckCircle2 } from "lucide-react";

import type { Route } from "./+types/_auth.forgot-password";
import { forgotPasswordSchema, type ForgotPasswordInput } from "~/lib/validation";
import { createSupabaseAdminClient } from "~/lib/supabase/server";
import { GlassCard } from "~/components/ui/glass-card";
import { Button } from "~/components/ui/button";
import { TextField } from "~/components/ui/text-field";
import { fadeUp, staggerContainer } from "~/components/motion/presets";
import {
  checkRateLimit,
  equalizeTiming,
  generateSecureToken,
  hashResetToken,
} from "~/lib/auth-security";

export async function action({ request }: Route.ActionArgs) {
  const startTime = Date.now();
  const formData = await request.formData();
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return data(
      { errors: parsed.error.flatten().fieldErrors, error: null, successMessage: null },
      { status: 400 },
    );
  }

  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const rateLimitKey = `forgot:${clientIp}:${parsed.data.email.toLowerCase()}`;
  const rateCheck = checkRateLimit(rateLimitKey, 3, 15 * 60 * 1000, 30 * 60 * 1000);

  if (!rateCheck.success) {
    await equalizeTiming(startTime, 400);
    return data(
      {
        error: "Too many reset attempts for this email. Please try again in 30 minutes.",
        errors: null,
        successMessage: null,
      },
      { status: 429 },
    );
  }

  const adminClient = createSupabaseAdminClient();

  try {
    // Check if user exists (admin query)
    const { data: userData } = await adminClient.rpc("get_user_id_by_email", {
      email_input: parsed.data.email,
    }).catch(() => ({ data: null }));

    if (userData && userData.length > 0) {
      const userId = userData[0].id;
      const rawToken = generateSecureToken();
      const tokenHash = hashResetToken(rawToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

      // Insert hashed token into database
      await adminClient.from("password_reset_tokens").insert({
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
        used: false,
      });

      // Note: In production, send email with `/reset-password?token=${rawToken}`.
      // Raw token is NEVER logged or stored in database.
    }
  } catch {
    // Silently continue to guarantee uniform response
  }

  await equalizeTiming(startTime, 400);

  // Anti-user enumeration uniform response
  return data({
    error: null,
    errors: null,
    successMessage:
      "If an account with that email address exists, password reset instructions have been sent.",
  });
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Forgot password · Athenaeum" }];
}

export default function ForgotPassword() {
  const actionData = useActionData<typeof action>();

  const {
    register,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  useEffect(() => {
    setFocus("email");
  }, [setFocus]);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="w-full"
    >
      <motion.div variants={fadeUp} className="mb-8 text-center lg:text-left">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-gold-300 to-gold-500 shadow-glow lg:mx-0">
          <KeyRound className="size-7 text-ink-950" />
        </div>
        <h1 className="font-serif text-3xl text-ink-800 dark:text-ivory">
          Reset your password
        </h1>
        <p className="mt-2 text-sm text-mist">
          Enter your email address and we'll send you instructions to reset your password.
        </p>
      </motion.div>

      {actionData?.error && (
        <motion.div
          variants={fadeUp}
          className="mt-5 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300"
        >
          {actionData.error}
        </motion.div>
      )}

      {actionData?.successMessage && (
        <motion.div
          variants={fadeUp}
          className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3.5 text-sm text-emerald-700 dark:text-emerald-300"
        >
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" />
          <div>
            <p className="font-medium">{actionData.successMessage}</p>
            <p className="mt-1 text-xs text-mist">
              Check your inbox and spam folder. Reset links expire in 1 hour.
            </p>
          </div>
        </motion.div>
      )}

      {!actionData?.successMessage && (
        <motion.div variants={fadeUp} className="mt-6">
          <GlassCard className="p-6 sm:p-7">
            <form method="post" className="space-y-4" noValidate>
              <TextField
                label="Email address"
                type="email"
                autoComplete="email"
                placeholder="you@university.edu"
                icon={Mail}
                error={errors.email?.message}
                {...register("email")}
              />

              <Button
                type="submit"
                size="lg"
                className="w-full"
                isLoading={isSubmitting}
              >
                Send reset link
                <ArrowRight className="size-4" />
              </Button>
            </form>
          </GlassCard>
        </motion.div>
      )}

      <motion.p variants={fadeUp} className="mt-6 text-center text-sm text-mist">
        Remember your password?{" "}
        <Link
          to="/login"
          className="font-medium text-gold-600 underline-offset-4 transition-colors hover:text-gold-400 hover:underline dark:text-gold-300"
        >
          Sign in
        </Link>
      </motion.p>
    </motion.div>
  );
}
