import { useEffect } from "react";
import { Link, useActionData, useSearchParams, data, redirect } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArrowRight, Lock, KeyRound, CheckCircle2 } from "lucide-react";

import type { Route } from "./+types/_auth.reset-password";
import { resetPasswordSchema, type ResetPasswordInput } from "~/lib/validation";
import { createSupabaseAdminClient } from "~/lib/supabase/server";
import { GlassCard } from "~/components/ui/glass-card";
import { Button } from "~/components/ui/button";
import { TextField } from "~/components/ui/text-field";
import { fadeUp, staggerContainer } from "~/components/motion/presets";
import { checkRateLimit, equalizeTiming, hashResetToken, timingSafeEqualString } from "~/lib/auth-security";

export async function action({ request }: Route.ActionArgs) {
  const startTime = Date.now();
  const formData = await request.formData();
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return data(
      { errors: parsed.error.flatten().fieldErrors, error: null, success: false },
      { status: 400 },
    );
  }

  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const rateLimitKey = `reset:${clientIp}`;
  const rateCheck = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000, 30 * 60 * 1000);

  if (!rateCheck.success) {
    await equalizeTiming(startTime, 400);
    return data(
      {
        error: "Too many reset attempts. Please try again later.",
        errors: null,
        success: false,
      },
      { status: 429 },
    );
  }

  const incomingHash = hashResetToken(parsed.data.token);
  const adminClient = createSupabaseAdminClient();

  // Retrieve token entry
  const { data: tokenRecord } = await adminClient
    .from("password_reset_tokens")
    .select("*")
    .eq("token_hash", incomingHash)
    .eq("used", false)
    .single();

  if (!tokenRecord) {
    await equalizeTiming(startTime, 400);
    return data(
      {
        error: "Invalid or expired reset token. Please request a new password reset link.",
        errors: null,
        success: false,
      },
      { status: 400 },
    );
  }

  // Check expiration
  const isExpired = new Date(tokenRecord.expires_at).getTime() < Date.now();
  if (isExpired) {
    await equalizeTiming(startTime, 400);
    return data(
      {
        error: "This password reset token has expired. Please request a new link.",
        errors: null,
        success: false,
      },
      { status: 400 },
    );
  }

  // Verify hash in constant time
  const matches = timingSafeEqualString(tokenRecord.token_hash, incomingHash);
  if (!matches) {
    await equalizeTiming(startTime, 400);
    return data(
      {
        error: "Invalid token validation.",
        errors: null,
        success: false,
      },
      { status: 400 },
    );
  }

  // Update user's password securely via admin client
  const { error: updateError } = await adminClient.auth.admin.updateUserById(
    tokenRecord.user_id,
    { password: parsed.data.password },
  );

  if (updateError) {
    await equalizeTiming(startTime, 400);
    return data(
      {
        error: "Unable to update password. Please try again.",
        errors: null,
        success: false,
      },
      { status: 500 },
    );
  }

  // Mark token as used (single-use token enforcement)
  await adminClient
    .from("password_reset_tokens")
    .update({ used: true })
    .eq("id", tokenRecord.id);

  await equalizeTiming(startTime, 400);

  return data({
    error: null,
    errors: null,
    success: true,
  });
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Set new password · Athenaeum" }];
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";
  const actionData = useActionData<typeof action>();

  const {
    register,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: tokenFromUrl },
  });

  useEffect(() => {
    if (tokenFromUrl) {
      setValue("token", tokenFromUrl);
    }
  }, [tokenFromUrl, setValue]);

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
          Set new password
        </h1>
        <p className="mt-2 text-sm text-mist">
          Choose a strong password for your Athenaeum account.
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

      {actionData?.success && (
        <motion.div
          variants={fadeUp}
          className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3.5 text-sm text-emerald-700 dark:text-emerald-300"
        >
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" />
          <div>
            <p className="font-medium">Password reset successfully!</p>
            <p className="mt-1 text-xs text-mist">
              Your password has been updated. You can now{" "}
              <Link to="/login" className="underline font-semibold hover:text-gold-400">
                Sign in
              </Link>{" "}
              with your new credentials.
            </p>
          </div>
        </motion.div>
      )}

      {!actionData?.success && (
        <motion.div variants={fadeUp} className="mt-6">
          <GlassCard className="p-6 sm:p-7">
            <form method="post" className="space-y-4" noValidate>
              <input type="hidden" {...register("token")} />

              {!tokenFromUrl && (
                <TextField
                  label="Reset Token"
                  placeholder="Paste your reset token"
                  icon={KeyRound}
                  error={errors.token?.message}
                  {...register("token")}
                />
              )}

              <TextField
                label="New Password"
                reveal
                autoComplete="new-password"
                placeholder="At least 8 characters"
                icon={Lock}
                error={errors.password?.message}
                {...register("password")}
              />

              <TextField
                label="Confirm New Password"
                reveal
                autoComplete="new-password"
                placeholder="Re-enter password"
                icon={Lock}
                error={errors.confirm_password?.message}
                {...register("confirm_password")}
              />

              <Button
                type="submit"
                size="lg"
                className="w-full"
                isLoading={isSubmitting}
              >
                Update password
                <ArrowRight className="size-4" />
              </Button>
            </form>
          </GlassCard>
        </motion.div>
      )}

      <motion.p variants={fadeUp} className="mt-6 text-center text-sm text-mist">
        Return to{" "}
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
