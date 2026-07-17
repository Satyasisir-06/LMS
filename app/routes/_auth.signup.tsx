import { useEffect } from "react";
import { Link, useActionData, data, redirect } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArrowRight, GraduationCap, IdCard, Lock, Mail, User } from "lucide-react";

import type { Route } from "./+types/_auth.signup";
import { signupSchema, type SignupInput } from "~/lib/validation";
import { createSupabaseServerClient } from "~/lib/supabase/server";
import { GlassCard } from "~/components/ui/glass-card";
import { Button } from "~/components/ui/button";
import { TextField } from "~/components/ui/text-field";
import { fadeUp, staggerContainer } from "~/components/motion/presets";
import { cn } from "~/lib/utils";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return data(
      { errors: parsed.error.flatten().fieldErrors, error: null },
      { status: 400 },
    );
  }

  const { client, headers } = createSupabaseServerClient(request);
  const { data: signUpData, error } = await client.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.full_name,
        role: parsed.data.role,
        student_id: parsed.data.student_id || null,
        department: parsed.data.department || null,
        academic_year: parsed.data.academic_year || null,
        semester: parsed.data.semester || null,
      },
    },
  });

  if (error) {
    return data({ error: error.message, errors: null }, { status: 400 });
  }

  if (signUpData.session) {
    throw redirect("/", { headers });
  }
  throw redirect("/login", { headers });
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Create account · Athenaeum" }];
}

export default function Signup() {
  const actionData = useActionData<typeof action>();

  const {
    register,
    handleSubmit,
    watch,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: "student" },
  });

  const role = watch("role");

  useEffect(() => {
    setFocus("full_name");
  }, [setFocus]);

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show">
      <motion.div variants={fadeUp}>
        <h1 className="font-serif text-3xl text-ink-800 dark:text-ivory">
          Begin your membership
        </h1>
        <p className="mt-2 text-sm text-mist">
          Create an Athenaeum account to borrow, reserve, and explore.
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

      <motion.div variants={fadeUp} className="mt-6">
        <GlassCard className="p-6 sm:p-7">
          <form method="post" className="space-y-4" noValidate>
            <TextField
              label="Full name"
              autoComplete="name"
              placeholder="Jane Austen"
              icon={User}
              error={errors.full_name?.message}
              {...register("full_name")}
            />
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@university.edu"
              icon={Mail}
              error={errors.email?.message}
              {...register("email")}
            />
            <TextField
              label="Password"
              reveal
              autoComplete="new-password"
              placeholder="At least 8 characters"
              icon={Lock}
              error={errors.password?.message}
              hint={errors.password ? undefined : "Use 8+ characters."}
              {...register("password")}
            />

            {/* Role selector */}
            <div className="space-y-1.5">
              <span className="block text-xs font-medium uppercase tracking-[0.12em] text-mist">
                Membership type
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(["student", "faculty"] as const).map((value) => {
                  const Icon = value === "student" ? GraduationCap : IdCard;
                  const active = role === value;
                  return (
                    <label
                      key={value}
                      className={cn(
                        "flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-3 text-sm transition-all duration-200",
                        active
                          ? "border-gold-400/60 bg-gold-400/12 text-gold-600 dark:text-gold-300"
                          : "border-gold-400/15 text-ink-500 hover:border-gold-400/35 dark:text-ink-300",
                      )}
                    >
                      <input
                        type="radio"
                        value={value}
                        className="sr-only"
                        {...register("role")}
                      />
                      <Icon className="size-4" />
                      <span className="font-medium capitalize">{value}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {role === "student" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <TextField
                  label="Student ID"
                  placeholder="e.g. 2026-CS-042"
                  icon={IdCard}
                  error={errors.student_id?.message}
                  {...register("student_id")}
                />
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <TextField
                    label="Academic Year"
                    type="number"
                    placeholder="e.g. 2026"
                    error={errors.academic_year?.message}
                    {...register("academic_year")}
                  />
                  <TextField
                    label="Semester"
                    placeholder="e.g. Fall"
                    error={errors.semester?.message}
                    {...register("semester")}
                  />
                </div>
              </motion.div>
            )}

            <TextField
              label="Department (optional)"
              placeholder="e.g. English Literature"
              {...register("department")}
            />

            <Button
              type="submit"
              size="lg"
              className="w-full"
              isLoading={isSubmitting}
            >
              Create account
              <ArrowRight className="size-4" />
            </Button>
          </form>
        </GlassCard>
      </motion.div>

      <motion.p variants={fadeUp} className="mt-6 text-center text-sm text-mist">
        Already a member?{" "}
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
