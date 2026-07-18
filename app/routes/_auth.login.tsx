import { useEffect } from "react";
import {
  Link,
  useActionData,
  data,
  redirect,
} from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Mail, Library, BookOpen, BookmarkCheck, History } from "lucide-react";

import type { Route } from "./+types/_auth.login";
import { loginSchema, type LoginInput } from "~/lib/validation";
import { createSupabaseServerClient } from "~/lib/supabase/server";
import { GlassCard } from "~/components/ui/glass-card";
import { Button } from "~/components/ui/button";
import { TextField } from "~/components/ui/text-field";
import { fadeUp, staggerContainer } from "~/components/motion/presets";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return data(
      { errors: parsed.error.flatten().fieldErrors, error: null },
      { status: 400 },
    );
  }

  const { client, headers } = createSupabaseServerClient(request);
  const { error } = await client.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return data({ error: error.message, errors: null }, { status: 400 });
  }

  throw redirect("/", { headers });
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Sign in · Athenaeum" }];
}

export default function Login() {
  const actionData = useActionData<typeof action>();

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    setFocus("email");
  }, [setFocus]);

  const features = [
    { icon: BookOpen, label: "Browse Catalog" },
    { icon: BookmarkCheck, label: "Reserve Books" },
    { icon: History, label: "Track Loans" },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="w-full"
    >
      <motion.div variants={fadeUp} className="mb-8 text-center lg:text-left">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-gold-300 to-gold-500 shadow-glow lg:mx-0">
          <Library className="size-7 text-ink-950" />
        </div>
        <h1 className="font-serif text-3xl text-ink-800 dark:text-ivory">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-mist">
          Sign in to your Athenaeum account to continue reading.
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
              autoComplete="current-password"
              placeholder="••••••••"
              icon={Lock}
              error={errors.password?.message}
              {...register("password")}
            />

            <Button
              type="submit"
              size="lg"
              className="w-full"
              isLoading={isSubmitting}
            >
              Sign in
              <ArrowRight className="size-4" />
            </Button>
          </form>
        </GlassCard>
      </motion.div>

      <motion.p variants={fadeUp} className="mt-6 text-center text-sm text-mist">
        New to Athenaeum?{" "}
        <Link
          to="/signup"
          className="font-medium text-gold-600 underline-offset-4 transition-colors hover:text-gold-400 hover:underline dark:text-gold-300"
        >
          Create an account
        </Link>
      </motion.p>

      <motion.div
        variants={fadeUp}
        className="mt-8 grid grid-cols-3 gap-3"
      >
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.label}
              className="rounded-xl border border-gold-400/15 bg-ink-500/5 p-3 text-center transition-colors hover:border-gold-400/30"
            >
              <Icon className="mx-auto size-5 text-gold-500" />
              <p className="mt-2 text-[11px] leading-tight text-mist">
                {f.label}
              </p>
            </div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
