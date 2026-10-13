import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { apiError } from "../../../lib/api";
import type { Role } from "../../../types/auth";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

const schema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type Values = z.infer<typeof schema>;

export default function LoginForm({
  onSuccess,
}: {
  onSuccess: (role: Role) => void;
}) {
  const { login } = useAuth();
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const submit = handleSubmit(async (values) => {
    setError("");

    try {
      const user = await login(values.email, values.password);
      onSuccess(user.role);
    } catch (err) {
      setError(apiError(err));
    }
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Input
        id="email"
        label="Work email"
        type="email"
        placeholder="employee@company.com"
        autoComplete="username"
        error={errors.email?.message}
        {...register("email")}
      />

      <div className="relative">
        <Input
          id="password"
          label="Password"
          type={visible ? "text" : "password"}
          placeholder="Enter your password"
          autoComplete="current-password"
          error={errors.password?.message}
          className="pr-12"
          {...register("password")}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-3 top-10 rounded-lg p-2
            text-slate-500 hover:text-primary-600"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200
          bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Button
        type="submit"
        loading={isSubmitting}
        icon={<ArrowRight size={18} />}
        className="mt-2 w-full py-3.5"
      >
        Sign in to workspace
      </Button>
    </form>
  );
}
